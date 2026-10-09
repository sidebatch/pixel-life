const FISHING_CONFIG = Object.freeze({
  castMs: 320,
  minWaitMs: 3000,
  maxWaitMs: 6000,
  // The village pond now uses its real pond-only pool; other habitats are reachable in-world.
  temporaryAllFishAtVillagePond: false
});

const fishingState = {
  phase: 'idle',
  timer: 0,
  biteDelay: 0,
  result: null,
  spot: null,
  context: null,
  pendingCatch: null
};

const fishingCatchStreak={fishId:null,count:0};
const fishingDebugParams=typeof window!=='undefined'?new URLSearchParams(window.location.search):null;
const fishingDebugFishId=fishingDebugParams?.has('debug')?fishingDebugParams.get('fish'):null;

function isFishingActive(){ return fishingState.phase !== 'idle'; }
function isFishingResult(){ return fishingState.phase === 'result'; }
function isFishDiscoveryOpen(){return typeof document!=='undefined'&&document.getElementById('fishDiscoveryOverlay')?.classList.contains('show')===true;}
function hideFishDiscoveryReveal(){
  if(!isFishDiscoveryOpen())return false;
  const overlay=document.getElementById('fishDiscoveryOverlay'),dialog=document.getElementById('dialog');
  overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');overlay.setAttribute('inert','');
  overlay.parentElement.insertBefore(dialog,overlay.nextSibling);
  dialog.querySelectorAll(':scope > .treeDiscoveryEyebrow,:scope > .treeDiscoveryArt,:scope > .treeDiscoveryWorld').forEach(element=>element.remove());
  dialog.classList.remove('treeDiscoveryCard');return true;
}

function fishingWaterInFront(){
  const t=facingTile();
  return waterSet.has(key(t.x,t.y))&&!!resolveFishingSpot(WORLD_DEFINITION,t,GAME_STATE.regionId);
}

function getFishingSpotInFront(){
  const tile=facingTile();
  if(!waterSet.has(key(tile.x,tile.y))) return null;
  return resolveFishingSpot(WORLD_DEFINITION,tile,GAME_STATE.regionId);
}

function getFishingContext(spot=null){
  const regionId=spot?.regionId||GAME_STATE.regionId;
  return Object.freeze({
    regionId,
    spotId:spot?.spotId||null,
    habitat:getFishingHabitat(regionId,spot),
    period:getWorldTimePeriod(),
    weather:getWeatherKind()
  });
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
  return rods.length?`${rods.map(rod=>rod.name).join('·')} ${rods.some(rod=>rod.requiresMasterRod)?'도감 20종 완성 후 엘리에게서 구매 가능!':'엘리에게서 구매 가능!'}`:'';
}

function ensureMasterAnglerRod(){
  const inventory=GAME_STATE.inventory;
  const rod=FISHING_ROD_BY_ID.get('rod.master_angler'),progress=GAME_STATE.progression.fishing;
  if(rod.maxDurability&&!(typeof progress.durabilityByRodId?.[rod.id]==='number'&&Number.isFinite(progress.durabilityByRodId[rod.id])))
    progress.durabilityByRodId={...(progress.durabilityByRodId||{}),[rod.id]:rod.maxDurability};
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
      // Historical flags remain save-compatible; discovery no longer reveals hints.
      flags.rareFishHints=true;
      messages.push(`${reward.count}종 발견 · 도감 기록이 쌓였어요`);
    }else if(reward.kind==='finalClue'){
      flags.finalFishClue=true;
      messages.push(`${reward.count}종 발견 · 도감 완성에 한 걸음 더 가까워졌어요`);
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
  if(typeof syncFishDexRewards==='function')syncFishDexRewards();
  return {discovered,unlocked,messages,xpGained};
}

function startFishing(){
  if(typeof canStartVoyageFishing==='function'&&!canStartVoyageFishing())return false;
  if(GAME_STATE.appearance?.activeTool!=='rod'||
    (typeof isChoppingTree==='function'&&isChoppingTree())||
    menuOpen || isFishingActive()||getFishingRodDurability()?.broken) return false;
  const spot=getFishingSpotInFront();
  if(!spot) return false;
  fishingState.phase=fishingDebugFishId?'bite':'casting';
  fishingState.timer=0;
  fishingState.biteDelay=getFishingBiteDelay();
  fishingState.result=null;
  fishingState.pendingCatch=null;
  fishingState.spot={spotId:spot.spotId,x:spot.x,y:spot.y,fishingHabitat:spot.fishingHabitat};
  fishingState.context=getFishingContext(spot);
  GAME_STATE.activity.active='fishing';
  inputs.up=inputs.down=inputs.left=inputs.right=false;
  activeDir=null;
  clearPlayerInputBuffer?.();
  playFishingCastSound();
  return true;
}

function finishFishing(){
  const wasDiscovery=hideFishDiscoveryReveal();
  if(wasDiscovery){
    dialogOpen=false;document.getElementById('dialog').classList.remove('show','fishingResult','firstDiscovery');
  }
  if(fishingState.phase!=='result'){
    stopFishingSound('cast');
    stopFishingSound('bite');
  }
  fishingState.phase='idle';
  fishingState.timer=0;
  fishingState.biteDelay=0;
  fishingState.result=null;
  fishingState.pendingCatch=null;
  fishingState.spot=null;
  fishingState.context=null;
  if(GAME_STATE.activity.active==='fishing') GAME_STATE.activity.active=null;
  if(typeof activeVoyage==='function'&&activeVoyage()?.returnPending)returnFromVoyage();
  if(wasDiscovery&&typeof flushPendingSkillXpFeedback==='function')flushPendingSkillXpFeedback();
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
  if(fishingState.phase==='result'&&fishingState.result)return fishingState.result;
  if(getFishingRodDurability()?.broken)return null;
  const pool=getEligibleFishPool(fishingState.context||getFishingContext());
  const forcedFish=getFishingDebugFish();
  const fish=fishingState.pendingCatch?.fish||forcedFish||chooseWeightedFish(pool);
  if(!fish) throw new Error('No eligible fish for the current fishing context');
  const rod=fishingState.pendingCatch?.rod||getEquippedFishingRod();
  if(!fishingState.pendingCatch){
    const sizeRoll=applyFishingRodSizeBonus(Math.random(),rod),sizeCm=fish.minSizeCm+sizeRoll*(fish.maxSizeCm-fish.minSizeCm);
    fishingState.pendingCatch={fish,rod,sizeCm,price:calculateFishPrice(fish,sizeCm)};
  }
  const {sizeCm,price}=fishingState.pendingCatch;
  const before={inventory:GAME_STATE.inventory,fish:GAME_STATE.collections.fish,fishRewards:GAME_STATE.collections.fishRewards,
    coins:GAME_STATE.progression.coins,flags:GAME_STATE.progression.flags,fishing:GAME_STATE.progression.fishing,
    appearance:GAME_STATE.appearance,voyage:GAME_STATE.progression.voyage,streak:{...fishingCatchStreak}};
  try{
    GAME_STATE.inventory=[...before.inventory];
    GAME_STATE.collections.fish=Object.fromEntries(Object.entries(before.fish).map(([id,record])=>[id,{...record}]));
    if(before.fishRewards)GAME_STATE.collections.fishRewards=JSON.parse(JSON.stringify(before.fishRewards));
    GAME_STATE.progression.flags=JSON.parse(JSON.stringify(before.flags||{}));
    GAME_STATE.progression.fishing={...before.fishing,durabilityByRodId:{...(before.fishing.durabilityByRodId||{})}};
    if(before.appearance)GAME_STATE.appearance={...before.appearance};
    // Save may unlock a route from this catch. Roll that back on failure, but
    // retain elapsed visible voyage time via the shared activeTrip reference.
    if(before.voyage)GAME_STATE.progression.voyage={...before.voyage,unlockedRouteIds:[...before.voyage.unlockedRouteIds]};
    recordFishingSelection(fish.id);
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
    const durability=getFishingRodDurability(rod),rodBroke=!durability.infinite&&durability.current===1;
    if(!durability.infinite){
      GAME_STATE.progression.fishing.durabilityByRodId[rod.id]=durability.current-1;
      if(rodBroke&&GAME_STATE.appearance)GAME_STATE.appearance.activeTool='none';
    }
    if(!saveGame())throw new Error('Fishing catch save failed');
    fishingState.pendingCatch=null;
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
      rodId:rod.id,rodBroke,rodName:rod.name
    };
  }catch(error){
    GAME_STATE.inventory=before.inventory;GAME_STATE.collections.fish=before.fish;
    if(before.fishRewards===undefined)delete GAME_STATE.collections.fishRewards;else GAME_STATE.collections.fishRewards=before.fishRewards;
    GAME_STATE.progression.coins=before.coins;GAME_STATE.progression.flags=before.flags;
    GAME_STATE.progression.fishing=before.fishing;GAME_STATE.appearance=before.appearance;
    if(before.voyage)GAME_STATE.progression.voyage=before.voyage;
    Object.assign(fishingCatchStreak,before.streak);
    if(typeof document!=='undefined'){
      const coinCount=document.getElementById('coinCount');if(coinCount)coinCount.textContent=Number(before.coins||0).toLocaleString();
    }
    return null;
  }
}

function showFishingResult(){
  if(fishingState.phase==='result')return false;
  fishingState.result=createFishingCatch();
  if(!fishingState.result){
    if(typeof showLifeToast==='function')showLifeToast('저장하지 못했어요 · 다시 누르면 재시도할 수 있어요');
    return false;
  }
  fishingState.phase='result';
  const r=fishingState.result;
  const fish=FISH_DATA.find(item=>item.id===r.fishId);
  const discoveryText=r.firstDiscovery?'\n✨ 첫 발견! 도감 기록 완료':'';
  const breakText=r.rodBroke?`${r.rodName}가 망가졌어요 · 마을 엘리에게서 수리해 주세요`:'';
  const rewardText=(r.rewards.messages.length?`\n🎁 ${r.rewards.messages.join('\n🎁 ')}`:'')+(breakText?'\n'+breakText:'');
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
  document.getElementById('dialogText').replaceChildren(layout);
  const dialog=document.getElementById('dialog');
  dialog.classList.add('fishingResult');
  dialog.classList.toggle('firstDiscovery',r.firstDiscovery);
  dialog.dataset.rarity=r.rarity;
  if(r.firstDiscovery){
    const overlay=document.getElementById('fishDiscoveryOverlay');
    dialog.classList.add('treeDiscoveryCard');overlay.append(dialog);
    const eyebrow=document.createElement('span');eyebrow.className='treeDiscoveryEyebrow';eyebrow.textContent='NEW FISH DISCOVERED';
    const art=document.createElement('div');art.className='treeDiscoveryArt';art.append(document.createElement('span'),image);
    const habitat=document.createElement('p');habitat.className='treeDiscoveryWorld';habitat.textContent=FISHING_HABITAT_BY_ID.get(fish.habitat)?.label||'물고기 도감';
    const description=document.createElement('p');description.className='treeDiscoveryDescription';description.textContent=fish.description||'새로운 물고기가 도감에 기록되었습니다.';
    // Keep the original title/image/confirmation hooks for existing result consumers.
    const heading=document.querySelector('#dialog .dialogTop');heading.before(eyebrow,art,habitat);
    document.getElementById('dialogText').replaceChildren(description);
    if(r.rewards.messages.length||breakText){
      const note=document.createElement('p');note.className='fishingDiscoveryRewards';note.textContent=[...r.rewards.messages,...(breakText?[breakText]:[])].join('\n');
      document.getElementById('dialogText').append(note);
    }
    overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');overlay.removeAttribute('inert');
    document.getElementById('dialogNext').focus();
  }
  playFishingCatchSound();
  // First discovery uses the shared card flip. Rare repeat catches keep their effects.
  if(!r.firstDiscovery)showFishingRarityEffect(dialog,r.rarity);
  else if(typeof playFishingRaritySound==='function')playFishingRaritySound(r.rarity);
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
  if(fishingState.pendingCatch)return '저장 실패 · 다시 누르면 재시도';
  if(fishingState.phase==='result') return '🎣 낚시 결과';
  return '';
}
