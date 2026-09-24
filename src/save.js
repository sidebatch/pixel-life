const SAVE_CONFIG=Object.freeze({
  key:'pixel-life.save',
  version:1
});

const SAVE_FISH_BY_ID=new Map(FISH_DATA.map(fish=>[fish.id,fish]));
const SAVE_EQUIPMENT=Object.freeze(Object.fromEntries(
  FISHING_RODS.filter(rod=>rod.requiresMasterReward).map(rod=>[rod.id,Object.freeze({name:rod.name})])
));

function saveFiniteNumber(value,fallback=0){
  const number=Number(value);
  return Number.isFinite(number)?number:fallback;
}

function saveClamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}

function normalizeSavedInventory(rawInventory){
  if(!Array.isArray(rawInventory)) return [];
  const inventory=[];
  for(const item of rawInventory){
    if(!item) continue;
    if(item.type==='equipment'){
      const equipment=SAVE_EQUIPMENT[item.id];
      if(!equipment||inventory.some(saved=>saved.type==='equipment'&&saved.id===item.id)) continue;
      inventory.push({type:'equipment',id:item.id,name:equipment.name,quantity:1});
      continue;
    }
    if(item.type==='material'&&item.id==='log'){
      const quantity=saveClamp(Math.floor(saveFiniteNumber(item.quantity,0)),0,99999);
      if(quantity) inventory.push({type:'material',id:'log',name:'통나무',quantity});
      continue;
    }
    if((item.type==='seed'||item.type==='crop')&&LIFE_CROP_BY_ID.has(item.id)){
      const crop=LIFE_CROP_BY_ID.get(item.id);
      const quantity=saveClamp(Math.floor(saveFiniteNumber(item.quantity,0)),0,99999);
      if(quantity) inventory.push({type:item.type,id:crop.id,name:item.type==='seed'?`${crop.name} 씨앗`:crop.name,quantity});
      continue;
    }
    if(item.type!=='fish') continue;
    const fish=SAVE_FISH_BY_ID.get(item.id);
    if(!fish) continue;
    inventory.push({
      type:'fish',
      id:fish.id,
      name:fish.name,
      rarity:fish.rarity,
      sizeCm:saveClamp(saveFiniteNumber(item.sizeCm,fish.minSizeCm),fish.minSizeCm,fish.maxSizeCm),
      price:Math.max(0,Math.round(saveFiniteNumber(item.price,fish.basePrice))),
      quantity:saveClamp(Math.floor(saveFiniteNumber(item.quantity,1)),1,999)
    });
  }
  return inventory;
}

function normalizeSavedLifeWorld(rawWorld){
  const source=rawWorld&&typeof rawWorld==='object'?rawWorld:{};
  const now=Date.now();
  const knownTrees=new Set(REGION_WORLDS.oldForest.trees.filter(tree=>tree.interactable).map(tree=>tree.id));
  const trees={};
  for(const [id,value] of Object.entries(source.trees||{})){
    if(!knownTrees.has(id)||!value||typeof value!=='object') continue;
    const choppedAt=Math.floor(saveFiniteNumber(value.choppedAt,0));
    if(choppedAt>0&&choppedAt<=now&&now-choppedAt<LIFE_CONTENT.treeRespawnMs){
      trees[id]={hp:0,choppedAt};
    }else if(!choppedAt){
      const hp=saveClamp(Math.floor(saveFiniteNumber(value.hp,LIFE_CONTENT.treeHp)),1,LIFE_CONTENT.treeHp);
      if(hp<LIFE_CONTENT.treeHp) trees[id]={hp,choppedAt:null};
    }
  }
  const plots={};
  REGION_WORLDS.sunnyFields.farmPlots.forEach((plot,index)=>{
    const saved=source.plots?.[plot.id];
    const unlocked=isInitialFarmPlot(index)||saved?.unlocked===true;
    const cropId=unlocked&&LIFE_CROP_BY_ID.has(saved?.cropId)?saved.cropId:null;
    const plantedAt=cropId?Math.floor(saveFiniteNumber(saved.plantedAt,0)):0;
    plots[plot.id]={unlocked,cropId:plantedAt>0&&plantedAt<=now?cropId:null,
      plantedAt:plantedAt>0&&plantedAt<=now?plantedAt:null};
  });
  return {trees,plots};
}

function normalizeSavedFishCollections(rawCollections){
  const source=rawCollections&&typeof rawCollections==='object'?rawCollections:{};
  const collections={};
  for(const fish of FISH_DATA){
    const saved=source[fish.id];
    if(!saved||typeof saved!=='object') continue;
    const count=Math.max(0,Math.floor(saveFiniteNumber(saved.count,0)));
    if(count===0) continue;
    const firstSize=saveClamp(saveFiniteNumber(saved.minSizeCm,fish.minSizeCm),fish.minSizeCm,fish.maxSizeCm);
    const secondSize=saveClamp(saveFiniteNumber(saved.maxSizeCm,firstSize),fish.minSizeCm,fish.maxSizeCm);
    const minSizeCm=Math.min(firstSize,secondSize);
    const maxSizeCm=Math.max(firstSize,secondSize);
    const fallbackTotal=(minSizeCm+maxSizeCm)*.5*count;
    const totalSizeCm=saveClamp(
      saveFiniteNumber(saved.totalSizeCm,fallbackTotal),
      minSizeCm*count,
      maxSizeCm*count
    );
    collections[fish.id]={
      fishId:fish.id,
      name:fish.name,
      rarity:fish.rarity,
      count,
      minSizeCm,
      maxSizeCm,
      totalSizeCm,
      averageSizeCm:totalSizeCm/count
    };
  }
  return collections;
}

function normalizeSavedFishingProgress(rawProgress,flags={},inventory=[]){
  const source=rawProgress&&typeof rawProgress==='object'?rawProgress:{};
  const savedLevel=saveClamp(Math.floor(saveFiniteNumber(source.level,1)),1,LIFE_SKILL_MAX_LEVEL);
  const savedXp=Math.max(0,Math.floor(saveFiniteNumber(source.xp,0)));
  // Old Lv.20 saves kept earning totalXp even though the visible XP was reset.
  const minimumTotal=lifeSkillTotalXpForLevel('fishing',savedLevel)+savedXp;
  const totalXp=Math.max(minimumTotal,Math.floor(saveFiniteNumber(source.totalXp,minimumTotal)));
  const progress=lifeSkillProgressFromTotal('fishing',totalXp);
  const requestedRod=FISHING_ROD_BY_ID.get(source.equippedRodId);
  const masterUnlocked=flags.masterRod===true||inventory.some(item=>
    item.type==='equipment'&&item.id==='rod.master_angler'
  );
  const rodUnlocked=requestedRod&&(
    requestedRod.requiresMasterReward?masterUnlocked:progress.level>=(requestedRod.unlockLevel||1)
  );
  const equippedRodId=rodUnlocked?requestedRod.id:DEFAULT_FISHING_ROD_ID;
  return {...progress,equippedRodId};
}

function normalizeSavedProgressionFlags(rawFlags){
  const source=rawFlags&&typeof rawFlags==='object'?rawFlags:{};
  const sourceRewards=source.fishCollectionRewards&&typeof source.fishCollectionRewards==='object'?
    source.fishCollectionRewards:{};
  const fishCollectionRewards={};
  for(const reward of FISH_COLLECTION_REWARDS){
    if(sourceRewards[reward.count]===true) fishCollectionRewards[reward.count]=true;
  }
  return {
    fishCollectionRewards,
    rareFishHints:source.rareFishHints===true||fishCollectionRewards[15]===true,
    finalFishClue:source.finalFishClue===true||fishCollectionRewards[19]===true,
    masterAnglerTitle:source.masterAnglerTitle===true||fishCollectionRewards[20]===true,
    masterRod:source.masterRod===true||fishCollectionRewards[20]===true
  };
}

function createSaveData(){
  return {
    version:SAVE_CONFIG.version,
    savedAt:new Date().toISOString(),
    state:{
      location:{regionId:GAME_STATE.regionId,
        x:typeof player!=='undefined'?player.x:GAME_STATE.playerLocation?.x,
        y:typeof player!=='undefined'?player.y:GAME_STATE.playerLocation?.y,
        face:typeof player!=='undefined'?player.face:GAME_STATE.playerLocation?.face},
      inventory:GAME_STATE.inventory,
      world:GAME_STATE.world,
      collections:{fish:GAME_STATE.collections.fish},
      progression:{
        coins:GAME_STATE.progression.coins,
        flags:GAME_STATE.progression.flags,
        fishing:GAME_STATE.progression.fishing
      }
    }
  };
}

function applySaveData(saveData){
  if(!saveData||saveData.version!==SAVE_CONFIG.version||!saveData.state) return false;
  const savedState=saveData.state;
  const savedLocation=savedState.location;
  GAME_STATE.regionId=REGION_WORLDS[savedLocation?.regionId]?savedLocation.regionId:'lilacVillage';
  GAME_STATE.playerLocation=Number.isInteger(savedLocation?.x)&&Number.isInteger(savedLocation?.y)&&
    savedLocation.x>=1&&savedLocation.x<63&&savedLocation.y>=1&&savedLocation.y<47?
    {x:savedLocation.x,y:savedLocation.y,face:['up','down','left','right'].includes(savedLocation.face)?savedLocation.face:'down'}:null;
  GAME_STATE.inventory=normalizeSavedInventory(savedState.inventory);
  GAME_STATE.world=normalizeSavedLifeWorld(savedState.world);
  GAME_STATE.collections.fish=normalizeSavedFishCollections(savedState.collections?.fish);
  GAME_STATE.progression.coins=Math.max(0,Math.floor(saveFiniteNumber(savedState.progression?.coins,GAME_STATE.progression.coins)));
  GAME_STATE.progression.flags=normalizeSavedProgressionFlags(savedState.progression?.flags);
  GAME_STATE.progression.fishing=normalizeSavedFishingProgress(
    savedState.progression?.fishing,
    GAME_STATE.progression.flags,
    GAME_STATE.inventory
  );
  return true;
}

function saveGame(){
  try{
    localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(createSaveData()));
    return true;
  }catch(error){
    console.warn('Pixel Life save failed.',error);
    return false;
  }
}

function loadGame(){
  try{
    const rawSave=localStorage.getItem(SAVE_CONFIG.key);
    if(!rawSave) return false;
    return applySaveData(JSON.parse(rawSave));
  }catch(error){
    console.warn('Pixel Life save could not be loaded.',error);
    return false;
  }
}

loadGame();
window.addEventListener('pagehide',saveGame);
