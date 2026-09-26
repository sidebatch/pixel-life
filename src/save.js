const SAVE_CONFIG=Object.freeze({
  // A fresh namespace starts every browser at Lv.1 and zero coins. Keep the
  // previous key untouched so an accidental reset remains recoverable.
  key:'pixel-life.save.v2',
  version:2
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
    const wood=item.type==='material'&&typeof item.id==='string'&&item.id.endsWith('_log')?FOREST_WOOD[item.id.slice(0,-4)]:null;
    if(item.type==='material'&&(item.id==='log'||wood)){
      const quantity=saveClamp(Math.floor(saveFiniteNumber(item.quantity,0)),0,99999);
      if(quantity) inventory.push({type:'material',id:item.id,name:wood||'일반 목재',quantity});
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
  const knownTrees=new Map();
  for(const regionId of Object.keys(FOREST_REGION_SPECIES)){
    const forest=REGION_WORLDS[regionId];
    for(const line of forest.treeLines){
      for(let value=line.from;value<=line.to;value+=line.step){
        if(line.gaps?.some(([start,end])=>value>=start&&value<=end)) continue;
        const x=line.axis==='x'?value:line.fixed,y=line.axis==='x'?line.fixed:value;
        knownTrees.set(forestTreeId(x,y,regionId),forestTreeSpecies(x,y,regionId));
      }
    }
    for(const tree of forest.trees){
      const id=tree.id||forestTreeId(tree.x,tree.y,regionId);
      if(!knownTrees.has(id)) knownTrees.set(id,tree.species||forestTreeSpecies(tree.x,tree.y,regionId));
    }
  }
  const trees={};
  for(const [id,value] of Object.entries(source.trees||{})){
    const species=knownTrees.get(id);
    if(!species||!value||typeof value!=='object') continue;
    const targetMaxHp=FORESTRY_TREES[species].maxHp;
    const choppedAt=Math.floor(saveFiniteNumber(value.choppedAt,0));
    if(choppedAt>0&&choppedAt<=now&&now-choppedAt<LIFE_CONTENT.treeRespawnMs){
      trees[id]={hp:0,choppedAt,maxHp:targetMaxHp};
    }else if(!choppedAt){
      const sourceMaxHp=Math.max(1,saveFiniteNumber(value.maxHp,Number(value.hp)<=3?3:LIFE_CONTENT.treeHp));
      const hp=saveClamp(Math.floor(saveFiniteNumber(value.hp,sourceMaxHp)),1,sourceMaxHp);
      const normalizedHp=saveClamp(Math.ceil(hp/sourceMaxHp*targetMaxHp),1,targetMaxHp);
      if(normalizedHp<targetMaxHp) trees[id]={hp:normalizedHp,choppedAt:null,maxHp:targetMaxHp};
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
  // Before shop purchases existed, every rod at or below the fishing level
  // was already usable. Keep those earned entitlements in legacy saves.
  const purchasedRodIds=Array.isArray(source.purchasedRodIds)?
    [...new Set([DEFAULT_FISHING_ROD_ID,...source.purchasedRodIds])].filter(id=>{
      const rod=FISHING_ROD_BY_ID.get(id);
      return rod&&!rod.requiresMasterReward&&(rod.unlockLevel||1)<=progress.level;
    }):
    FISHING_RODS.filter(rod=>!rod.requiresMasterReward&&!rod.requiresMasterRod&&(rod.unlockLevel||1)<=progress.level).map(rod=>rod.id);
  const requestedRod=FISHING_ROD_BY_ID.get(source.equippedRodId);
  const masterUnlocked=flags.masterRod===true||inventory.some(item=>
    item.type==='equipment'&&item.id==='rod.master_angler'
  );
  const rodUnlocked=requestedRod&&(
    requestedRod.requiresMasterReward?masterUnlocked:purchasedRodIds.includes(requestedRod.id)
  );
  const equippedRodId=rodUnlocked?requestedRod.id:DEFAULT_FISHING_ROD_ID;
  return {...progress,equippedRodId,purchasedRodIds};
}

function normalizeSavedLoggingProgress(rawProgress){
  const source=rawProgress&&typeof rawProgress==='object'?rawProgress:{};
  const savedLevel=saveClamp(Math.floor(saveFiniteNumber(source.level,1)),1,LIFE_SKILL_MAX_LEVEL);
  const savedXp=Math.max(0,Math.floor(saveFiniteNumber(source.xp,0)));
  const minimumTotal=lifeSkillTotalXpForLevel('logging',savedLevel)+savedXp;
  const totalXp=Math.max(minimumTotal,Math.floor(saveFiniteNumber(source.totalXp,minimumTotal)));
  return lifeSkillProgressFromTotal('logging',totalXp);
}

function normalizeSavedForestryProgress(rawProgress){
  const ids=Array.isArray(rawProgress?.ownedAxeIds)?rawProgress.ownedAxeIds:[];
  const ownedAxeIds=[...new Set([DEFAULT_FORESTRY_AXE_ID,...ids])].filter(id=>FORESTRY_AXE_BY_ID.has(id));
  const axeId=ownedAxeIds.includes(rawProgress?.axeId)?rawProgress.axeId:DEFAULT_FORESTRY_AXE_ID;
  return {axeId,ownedAxeIds};
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

function normalizeSavedAppearance(rawAppearance){
  const source=rawAppearance&&typeof rawAppearance==='object'?rawAppearance:{};
  const ownedOutfitIds=[DEFAULT_OUTFIT_ID,...(Array.isArray(source.ownedOutfitIds)?source.ownedOutfitIds:[])]
    .filter((id,index,ids)=>CHARACTER_OUTFIT_BY_ID.has(id)&&ids.indexOf(id)===index);
  return {
    bodyId:CHARACTER_PARTS.body.has(source.bodyId)?source.bodyId:'body.starter',
    hairId:CHARACTER_PARTS.hair.has(source.hairId)?source.hairId:'hair.brown',
    backpackId:CHARACTER_PARTS.backpack.has(source.backpackId)?source.backpackId:'pack.traveler',
    outfitId:ownedOutfitIds.includes(source.outfitId)?source.outfitId:DEFAULT_OUTFIT_ID,
    ownedOutfitIds,
    activeTool:source.activeTool==='rod'?'rod':'axe'
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
      appearance:GAME_STATE.appearance,
      world:GAME_STATE.world,
      collections:{fish:GAME_STATE.collections.fish},
      progression:{
        coins:GAME_STATE.progression.coins,
        flags:GAME_STATE.progression.flags,
        fishing:GAME_STATE.progression.fishing,
        logging:GAME_STATE.progression.logging,
        forestry:GAME_STATE.progression.forestry
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
  GAME_STATE.appearance=normalizeSavedAppearance(savedState.appearance);
  GAME_STATE.world=normalizeSavedLifeWorld(savedState.world);
  GAME_STATE.collections.fish=normalizeSavedFishCollections(savedState.collections?.fish);
  GAME_STATE.progression.coins=Math.max(0,Math.floor(saveFiniteNumber(savedState.progression?.coins,GAME_STATE.progression.coins)));
  GAME_STATE.progression.flags=normalizeSavedProgressionFlags(savedState.progression?.flags);
  GAME_STATE.progression.fishing=normalizeSavedFishingProgress(
    savedState.progression?.fishing,
    GAME_STATE.progression.flags,
    GAME_STATE.inventory
  );
  GAME_STATE.progression.logging=normalizeSavedLoggingProgress(savedState.progression?.logging);
  GAME_STATE.progression.forestry=normalizeSavedForestryProgress(savedState.progression?.forestry);
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
