const FISHING_CONFIG = Object.freeze({
  castMs: 320,
  minWaitMs: 3000,
  maxWaitMs: 6000,
  // Keep the temporary village preview until region-exclusive fish balancing is updated.
  temporaryAllFishAtVillagePond: true
});

const FISHING_HABITAT_BY_REGION=Object.freeze({
  lilacVillage:FISH_HABITATS.POND,
  oldForest:FISH_HABITATS.RIVER,
  deepForest:FISH_HABITATS.RIVER,
  sunnyFields:FISH_HABITATS.POND,
  riverValley:FISH_HABITATS.RIVER,
  coast:FISH_HABITATS.COAST
});

const fishingState = {
  phase: 'idle',
  timer: 0,
  biteDelay: 0,
  result: null,
  spot: null,
  context: null
};

const fishingCatchStreak={fishId:null,count:0};
const fishingDebugParams=typeof window!=='undefined'?new URLSearchParams(window.location.search):null;
const fishingDebugFishId=fishingDebugParams?.has('debug')?fishingDebugParams.get('fish'):null;

function isFishingActive(){ return fishingState.phase !== 'idle'; }
function isFishingResult(){ return fishingState.phase === 'result'; }

function fishingWaterInFront(){
  const t=facingTile();
  return waterSet.has(key(t.x,t.y));
}

function getFishingHabitat(regionId=GAME_STATE.regionId){
  return FISHING_HABITAT_BY_REGION[regionId]||FISH_HABITATS.POND;
}

function getFishingContext(){
  return {
    regionId:GAME_STATE.regionId,
    habitat:getFishingHabitat(),
    period:getWorldTimePeriod(),
    weather:getWeatherKind()
  };
}

function fishMatchesContext(fish,context){
  const villagePreview=FISHING_CONFIG.temporaryAllFishAtVillagePond&&
    context.regionId==='lilacVillage'&&context.habitat===FISH_HABITATS.POND;
  if(!villagePreview&&fish.habitat!==context.habitat) return false;
  if(fish.periods&&!fish.periods.includes(context.period)) return false;
  if(fish.weather&&!fish.weather.includes(context.weather)) return false;
  return true;
}

function getEligibleFishPool(context=getFishingContext()){
  return FISH_DATA.filter(fish=>fishMatchesContext(fish,context));
}

function getFishingDebugFish(){
  if(!fishingDebugFishId) return null;
  return FISH_DATA.find(fish=>fish.id===fishingDebugFishId)||null;
}

function isFishingRodUnlocked(rod,state=GAME_STATE){
  if(!rod) return false;
  if(rod.id===DEFAULT_FISHING_ROD_ID) return true;
  if(rod.requiresMasterReward){
    return state.progression?.flags?.masterRod===true||
      state.inventory?.some(item=>item.type==='equipment'&&item.id===rod.id)===true;
  }
  return state.progression?.fishing?.purchasedRodIds?.includes(rod.id)===true;
}

function getEquippedFishingRod(){
  const equippedId=GAME_STATE.progression.fishing.equippedRodId||DEFAULT_FISHING_ROD_ID;
  const equipped=FISHING_ROD_BY_ID.get(equippedId);
  if(equipped&&isFishingRodUnlocked(equipped)) return equipped;
  return FISHING_ROD_BY_ID.get(DEFAULT_FISHING_ROD_ID);
}

function getFishingRodWaitMultiplier(rod=getEquippedFishingRod()){
  return 1-Math.max(0,Math.min(.75,rod?.waitReduction||0));
}

function getFishingBiteDelay(randomValue=Math.random(),rod=getEquippedFishingRod()){
  const roll=Math.max(0,Math.min(1,Number(randomValue)||0));
  const baseWait=FISHING_CONFIG.minWaitMs+roll*(FISHING_CONFIG.maxWaitMs-FISHING_CONFIG.minWaitMs);
  return baseWait*getFishingRodWaitMultiplier(rod);
}

function getEffectiveFishWeight(fish,streak=fishingCatchStreak,rod=getEquippedFishingRod()){
  const repeatPenalty=streak.fishId===fish.id&&streak.count>=3 ? .5 : 1;
  const rareBonus=['rare','heroic','legendary'].includes(fish.rarity)?1+(rod?.rareWeightBonus||0):1;
  return fish.weight*repeatPenalty*rareBonus;
}

function chooseWeightedFish(pool,randomValue=Math.random(),streak=fishingCatchStreak){
  const totalWeight=pool.reduce((sum,fish)=>sum+getEffectiveFishWeight(fish,streak),0);
  if(totalWeight<=0) return null;
  let roll=Math.min(Math.max(randomValue,0),1-Number.EPSILON)*totalWeight;
  for(const fish of pool){
    roll-=getEffectiveFishWeight(fish,streak);
    if(roll<0) return fish;
  }
  return pool[pool.length-1]||null;
}

function recordFishingSelection(fishId){
  if(fishingCatchStreak.fishId===fishId){
    fishingCatchStreak.count+=1;
    return;
  }
  fishingCatchStreak.fishId=fishId;
  fishingCatchStreak.count=1;
}

function fishingXpForNextLevel(level){
  return lifeSkillXpForNextLevel('fishing',level);
}

function addFishingXp(amount){
  return grantLifeSkillXp('fishing',amount);
}

function recordFishDiscovery(fish,sizeCm){
  const collection=GAME_STATE.collections.fish;
  let record=collection[fish.id];
  const isFirst=!record;
  if(!record){
    record={
      fishId:fish.id,
      name:fish.name,
      rarity:fish.rarity,
      count:0,
      minSizeCm:sizeCm,
      maxSizeCm:sizeCm,
      totalSizeCm:0,
      averageSizeCm:0
    };
    collection[fish.id]=record;
  }
  record.count+=1;
  record.minSizeCm=Math.min(record.minSizeCm,sizeCm);
  record.maxSizeCm=Math.max(record.maxSizeCm,sizeCm);
  record.totalSizeCm+=sizeCm;
  record.averageSizeCm=record.totalSizeCm/record.count;
  return {isFirst,record};
}

function getDiscoveredFishCount(){
  return FISH_DATA.reduce((count,fish)=>count+(GAME_STATE.collections.fish[fish.id]?1:0),0);
}

function fishingNewRodText(previousLevel,currentLevel){
  const rods=FISHING_RODS.filter(rod=>!rod.requiresMasterReward&&rod.unlockLevel>previousLevel&&rod.unlockLevel<=currentLevel);
  return rods.length?`${rods.map(rod=>rod.name).join('·')} 엘리에게서 구매 가능!`:'';
}

function ensureMasterAnglerRod(){
  const inventory=GAME_STATE.inventory;
  if(inventory.some(item=>item.type==='equipment'&&item.id==='rod.master_angler')) return;
  inventory.push({type:'equipment',id:'rod.master_angler',name:'강태공의 낚싯대',quantity:1});
}

function applyFishCollectionRewards(){
  const discovered=getDiscoveredFishCount();
  const flags=GAME_STATE.progression.flags||(GAME_STATE.progression.flags={});
  const claimed=flags.fishCollectionRewards||(flags.fishCollectionRewards={});
  const unlocked=[];
  const messages=[];
  let xpGained=0;
  for(const reward of FISH_COLLECTION_REWARDS){
    if(discovered<reward.count||claimed[reward.count]) continue;
    claimed[reward.count]=true;
    unlocked.push(reward.count);
    if(reward.kind==='coins'){
      GAME_STATE.progression.coins+=reward.amount;
      messages.push(`${reward.count}종 보상 · 코인 +${reward.amount}`);
    }else if(reward.kind==='fishingXp'){
      addFishingXp(reward.amount);
      xpGained+=reward.amount;
      messages.push(`${reward.count}종 보상 · 낚시 경험치 +${reward.amount} XP`);
    }else if(reward.kind==='rareHints'){
      flags.rareFishHints=true;
      messages.push(`${reward.count}종 보상 · 희귀어 정보가 자세히 보여요`);
    }else if(reward.kind==='finalClue'){
      flags.finalFishClue=true;
      messages.push(`${reward.count}종 보상 · 마지막 물고기 단서를 볼 수 있어요`);
    }else if(reward.kind==='masterReward'){
      flags.masterAnglerTitle=true;
      flags.masterRod=true;
      ensureMasterAnglerRod();
      messages.push(`${reward.count}종 보상 · 강태공 칭호와 특별 낚싯대를 받았어요`);
    }
  }
  if(claimed[15]) flags.rareFishHints=true;
  if(claimed[19]) flags.finalFishClue=true;
  if(claimed[20]){
    flags.masterAnglerTitle=true;
    flags.masterRod=true;
    ensureMasterAnglerRod();
  }
  if(typeof document!=='undefined'){
    const coinCount=document.getElementById('coinCount');
    if(coinCount) coinCount.textContent=Number(GAME_STATE.progression.coins||0).toLocaleString();
  }
  return {discovered,unlocked,messages,xpGained};
}

function startFishing(){
  if(menuOpen || isFishingActive() || !fishingWaterInFront()) return false;
  fishingState.phase=fishingDebugFishId?'bite':'casting';
  fishingState.timer=0;
  fishingState.biteDelay=getFishingBiteDelay();
  fishingState.result=null;
  const target=facingTile();
  fishingState.spot={x:target.x,y:target.y};
  fishingState.context=getFishingContext();
  GAME_STATE.activity.active='fishing';
  inputs.up=inputs.down=inputs.left=inputs.right=false;
  activeDir=null;
  clearPlayerInputBuffer?.();
  playFishingCastSound();
  return true;
}

function finishFishing(){
  if(fishingState.phase!=='result'){
    stopFishingSound('cast');
    stopFishingSound('bite');
  }
  fishingState.phase='idle';
  fishingState.timer=0;
  fishingState.biteDelay=0;
  fishingState.result=null;
  fishingState.spot=null;
  fishingState.context=null;
  if(GAME_STATE.activity.active==='fishing') GAME_STATE.activity.active=null;
}

function finishFishingResult(){ finishFishing(); }

function calculateFishPrice(fish,sizeCm){
  const ratio=(sizeCm-fish.minSizeCm)/(fish.maxSizeCm-fish.minSizeCm);
  const sizeMultiplier=ratio>=.95?1.5:0.8+ratio*0.4;
  return Math.round(fish.basePrice*sizeMultiplier);
}

function applyFishingRodSizeBonus(randomValue,rod=getEquippedFishingRod()){
  const roll=Math.max(0,Math.min(1,Number(randomValue)||0));
  const bonus=Math.max(0,Math.min(.5,rod?.sizeBonus||0));
  return roll+(1-roll)*bonus;
}

function createFishingCatch(){
  const pool=getEligibleFishPool(fishingState.context||getFishingContext());
  const forcedFish=getFishingDebugFish();
  const fish=forcedFish||chooseWeightedFish(pool);
  if(!fish) throw new Error('No eligible fish for the current fishing context');
  recordFishingSelection(fish.id);
  const rod=getEquippedFishingRod();
  const sizeRoll=applyFishingRodSizeBonus(Math.random(),rod);
  const sizeCm=fish.minSizeCm+sizeRoll*(fish.maxSizeCm-fish.minSizeCm);
  const price=calculateFishPrice(fish,sizeCm);
  GAME_STATE.inventory.push({
    type:'fish',id:fish.id,name:fish.name,rarity:fish.rarity,sizeCm,price,quantity:1
  });
  const discovery=recordFishDiscovery(fish,sizeCm);
  const progressBefore=lifeSkillProgressSnapshot('fishing');
  addFishingXp(fish.xp);
  const rewards=applyFishCollectionRewards();
  const progressAfter=lifeSkillProgressSnapshot('fishing');
  const progression={...progressAfter,before:progressBefore,after:progressAfter,
    gained:fish.xp+rewards.xpGained,leveledUp:progressAfter.level>progressBefore.level,
    masteryGained:progressAfter.mastery-progressBefore.mastery};
  saveGame();
  return {
    fishId:fish.id,
    name:fish.name,
    emoji:fish.emoji,
    rarity:fish.rarity,
    sizeCm,
    price,
    xp:fish.xp,
    firstDiscovery:discovery.isFirst,
    collection:discovery.record,
    progression,
    rewards,
    rodId:rod.id
  };
}

function showFishingResult(){
  fishingState.result=createFishingCatch();
  fishingState.phase='result';
  const r=fishingState.result;
  const fish=FISH_DATA.find(item=>item.id===r.fishId);
  const discoveryText=r.firstDiscovery?'\n✨ 첫 발견! 도감 기록 완료':'';
  const rewardText=r.rewards.messages.length?`\n🎁 ${r.rewards.messages.join('\n🎁 ')}`:'';
  const resultCopy=`${r.sizeCm.toFixed(1)}cm · 판매가 ${r.price}${discoveryText}${rewardText}`;
  showDialog(r.name,resultCopy);
  const layout=document.createElement('div');
  layout.className='fishingResultLayout';
  const image=document.createElement('img');
  image.className='fishingResultFish';
  image.src=getFishImageUrl(fish);
  image.alt='';
  const copy=document.createElement('div');
  copy.className='fishingResultCopy';
  copy.textContent=resultCopy;
  layout.append(image,copy);
  const skillCard=document.createElement('div');
  skillCard.className='fishingResultSkill';
  skillCard.innerHTML=skillCardMarkup('fishing',r.progression.before);
  document.getElementById('dialogText').replaceChildren(layout,skillCard);
  const dialog=document.getElementById('dialog');
  dialog.classList.add('fishingResult');
  dialog.classList.toggle('firstDiscovery',r.firstDiscovery);
  dialog.dataset.rarity=r.rarity;
  playFishingCatchSound();
  showFishingRarityEffect(dialog,r.rarity);
  showSkillXpFeedback('fishing',r.progression.before,r.progression.after,r.progression.gained,
    fishingNewRodText(r.progression.before.level,r.progression.level));
}

function updateFishing(dt){
  if(!isFishingActive()) return;
  if(fishingState.phase==='casting'){
    fishingState.timer+=dt;
    if(fishingState.timer>=FISHING_CONFIG.castMs){
      fishingState.phase='waiting';
      fishingState.timer=0;
    }
    return;
  }
  if(fishingState.phase==='waiting'){
    fishingState.timer+=dt;
    if(fishingState.timer>=fishingState.biteDelay){
      fishingState.phase='bite';
      fishingState.timer=0;
      playFishingBiteSound();
    }
  }
}

function handleFishingAction(){
  if(fishingState.phase==='bite') showFishingResult();
}

function getFishingContextText(){
  if(fishingState.phase==='result') return '🎣 낚시 결과';
  return '';
}
