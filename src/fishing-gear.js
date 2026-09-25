function nextFishingRodForSale(state=GAME_STATE){
  return FISHING_RODS.find(rod=>rod.fishCost&&!isFishingRodUnlocked(rod,state))||null;
}

function planFishingRodTrade(rod,inventory=GAME_STATE.inventory){
  if(!rod?.fishCost) return null;
  const needed=new Map(Object.entries(rod.fishCost));
  const remaining=[];
  for(const item of inventory){
    const need=item?.type==='fish'?needed.get(item.id)||0:0;
    if(!need){remaining.push(item);continue;}
    if(!Number.isSafeInteger(item.quantity)||item.quantity<1) return null;
    const taken=Math.min(item.quantity,need);
    needed.set(item.id,need-taken);
    if(taken<item.quantity) remaining.push({...item,quantity:item.quantity-taken});
  }
  return [...needed.values()].some(count=>count>0)?null:remaining;
}

function canPurchaseFishingRod(rod,state=GAME_STATE){
  return rod?.id===nextFishingRodForSale(state)?.id&&
    state.progression.fishing.level>=rod.unlockLevel&&
    (!rod.requiresMasterRod||isFishingRodUnlocked(FISHING_ROD_BY_ID.get('rod.master_angler'),state))&&
    state.progression.coins>=rod.coins&&
    Boolean(planFishingRodTrade(rod,state.inventory));
}

function purchaseFishingRod(rodId){
  const rod=FISHING_ROD_BY_ID.get(rodId);
  if(!canPurchaseFishingRod(rod)) return false;
  const remaining=planFishingRodTrade(rod);
  if(!remaining) return false;
  const beforeInventory=GAME_STATE.inventory;
  const beforeCoins=GAME_STATE.progression.coins;
  const beforeFishing=GAME_STATE.progression.fishing;
  GAME_STATE.inventory=remaining;
  GAME_STATE.progression.coins-=rod.coins;
  GAME_STATE.progression.fishing={...beforeFishing,
    purchasedRodIds:[...new Set([...(beforeFishing.purchasedRodIds||[DEFAULT_FISHING_ROD_ID]),rod.id])]};
  if(!saveGame()){
    GAME_STATE.inventory=beforeInventory;
    GAME_STATE.progression.coins=beforeCoins;
    GAME_STATE.progression.fishing=beforeFishing;
    return false;
  }
  if(typeof ensureFishingRodImage==='function')
    ensureFishingRodImage(rod.asset).catch(error=>console.warn('Equipped rod art unavailable:',error));
  return true;
}

function fishingRodEffectLabels(rod){
  const labels=[];
  if(rod.waitReduction>0) labels.push(`대기시간 ${Math.round(rod.waitReduction*100)}% 감소`);
  if(rod.rareWeightBonus>0) labels.push('희귀 물고기가 더 잘 낚임');
  if(rod.sizeBonus>0) labels.push('큰 물고기가 더 잘 낚임');
  if(!labels.length) labels.push('추가 효과 없음');
  return labels;
}

function equipFishingRod(rodId){
  const rod=FISHING_ROD_BY_ID.get(rodId);
  if(!rod||!isFishingRodUnlocked(rod)) return false;
  const before=GAME_STATE.progression.fishing.equippedRodId;
  const previousTool=GAME_STATE.appearance?.activeTool;
  GAME_STATE.progression.fishing.equippedRodId=rod.id;
  if(GAME_STATE.appearance) GAME_STATE.appearance.activeTool='rod';
  if(!saveGame()){
    GAME_STATE.progression.fishing.equippedRodId=before;
    if(GAME_STATE.appearance) GAME_STATE.appearance.activeTool=previousTool;
    return false;
  }
  if(typeof ensureFishingRodImage==='function')
    ensureFishingRodImage(rod.asset).catch(error=>console.warn('Equipped rod art unavailable:',error));
  return true;
}
