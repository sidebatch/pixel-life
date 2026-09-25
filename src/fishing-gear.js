const fishingGearState={open:false,selectedRodId:null};

function isFishingGearOpen(){ return fishingGearState.open; }

function fishingRodUnlockText(rod){
  if(rod.requiresMasterReward) return '도감 20종 보상';
  if(rod.unlockLevel<=1) return '기본 지급';
  if(isFishingRodUnlocked(rod)) return '보유 중';
  return GAME_STATE.progression.fishing.level>=rod.unlockLevel?'엘리에게서 구매 가능':`낚시 Lv.${rod.unlockLevel}부터 엘리에게서 구매`;
}

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
  renderFishingGearMenuStatus();
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

function renderFishingGearMenuStatus(){
  const status=document.getElementById('fishingGearMenuStatus');
  if(!status) return;
  const rod=getEquippedFishingRod();
  status.textContent=`${rod.name} · Lv.${GAME_STATE.progression.fishing.level}`;
}

function equipFishingRod(rodId){
  const rod=FISHING_ROD_BY_ID.get(rodId);
  if(!rod||!isFishingRodUnlocked(rod)) return false;
  const before=GAME_STATE.progression.fishing.equippedRodId;
  GAME_STATE.progression.fishing.equippedRodId=rod.id;
  if(!saveGame()){
    GAME_STATE.progression.fishing.equippedRodId=before;
    return false;
  }
  fishingGearState.selectedRodId=rod.id;
  renderFishingGearMenuStatus();
  if(fishingGearState.open) renderFishingGear();
  return true;
}

function renderFishingGear(){
  const progress=GAME_STATE.progression.fishing;
  const equipped=getEquippedFishingRod();
  const selected=FISHING_ROD_BY_ID.get(fishingGearState.selectedRodId)||equipped;
  const summary=document.getElementById('fishingGearSummary');
  summary.innerHTML=skillCardMarkup('fishing',lifeSkillProgressSnapshot('fishing',progress));

  const list=document.getElementById('fishingGearList');
  list.innerHTML=FISHING_RODS.map(rod=>{
    const unlocked=isFishingRodUnlocked(rod);
    const active=equipped.id===rod.id;
    const focused=selected.id===rod.id;
    const effects=fishingRodEffectLabels(rod).map(label=>`<em>${label}</em>`).join('');
    return `<button type="button" class="fishingGearCard${active?' equipped':''}${focused?' selected':''}${unlocked?'':' locked'}" data-rod-id="${rod.id}" aria-pressed="${focused}">
      <span class="fishingGearIcon">${rod.icon}</span>
      <span class="fishingGearCopy"><b>${rod.name}</b><small>${unlocked?fishingRodUnlockText(rod):`🔒 ${fishingRodUnlockText(rod)}`}</small><span>${effects}</span></span>
      <strong>${active?'장착 중':unlocked?'보유 중':'보기'}</strong>
    </button>`;
  }).join('');
  list.querySelectorAll('[data-rod-id]').forEach(button=>{
    button.addEventListener('click',()=>{
      const rod=FISHING_ROD_BY_ID.get(button.dataset.rodId);
      fishingGearState.selectedRodId=rod.id;
      renderFishingGear();
    });
  });

  const detail=document.getElementById('fishingGearDetail');
  const requirement=selected.requiresMasterReward?'도감 20종을 모으면 받을 수 있어요':
    progress.level<selected.unlockLevel?`낚시 Lv.${selected.unlockLevel}부터 엘리에게서 구매할 수 있어요`:
      '엘리의 상점에서 물고기와 코인으로 구매할 수 있어요';
  detail.innerHTML=`<span>${equipped.id===selected.id?'현재 장비':isFishingRodUnlocked(selected)?'보유한 장비':'앞으로 사용할 수 있는 장비'}</span><div><i>${selected.icon}</i><div><b>${selected.name}</b><p>${selected.description}</p></div></div><footer>${fishingRodEffectLabels(selected).map(label=>`<em>${label}</em>`).join('')}</footer><p class="fishingGearRequirement">${isFishingRodUnlocked(selected)?'장착 변경은 가방의 장비 탭에서 할 수 있어요.':requirement}</p>`;
  renderFishingGearMenuStatus();
}

function openFishingGear(options={}){
  if(typeof isFishingActive==='function'&&isFishingActive()) return;
  toggleMenu(false);
  const rewards=applyFishCollectionRewards();
  if(rewards.unlocked.length) saveGame();
  fishingGearState.open=true;
  fishingGearState.selectedRodId=getEquippedFishingRod().id;
  menuOpen=true;
  clearMovement();
  renderFishingGear();
  const panel=document.getElementById('fishingGearPanel');
  panel.classList.add('show');
  panel.setAttribute('aria-hidden','false');
  if(!options.fromHistory) pushGameOverlayHistory('fishing-gear');
}

function closeFishingGear(options={}){
  fishingGearState.open=false;
  menuOpen=false;
  const panel=document.getElementById('fishingGearPanel');
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory) leaveGameOverlayHistory('fishing-gear');
}

document.getElementById('openFishingGearBtn').addEventListener('click',openFishingGear);
document.getElementById('fishingGearClose').addEventListener('click',closeFishingGear);
renderFishingGearMenuStatus();
