const fishingGearState={open:false,selectedRodId:null};

function isFishingGearOpen(){ return fishingGearState.open; }

function fishingRodUnlockText(rod){
  if(rod.requiresMasterReward) return '도감 20종 보상';
  if(rod.unlockLevel<=1) return '기본 지급';
  return `낚시 Lv.${rod.unlockLevel}부터 사용 가능`;
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
  GAME_STATE.progression.fishing.equippedRodId=rod.id;
  fishingGearState.selectedRodId=rod.id;
  saveGame();
  renderFishingGear();
  return true;
}

function renderFishingGear(){
  const progress=GAME_STATE.progression.fishing;
  const equipped=getEquippedFishingRod();
  const selected=FISHING_ROD_BY_ID.get(fishingGearState.selectedRodId)||equipped;
  const summary=document.getElementById('fishingGearSummary');
  summary.innerHTML=skillCardMarkup('fishing',lifeSkillProgressSnapshot('fishing',progress),fishingNextGoalText(progress.level));

  const list=document.getElementById('fishingGearList');
  list.innerHTML=FISHING_RODS.map(rod=>{
    const unlocked=isFishingRodUnlocked(rod);
    const active=equipped.id===rod.id;
    const focused=selected.id===rod.id;
    const effects=fishingRodEffectLabels(rod).map(label=>`<em>${label}</em>`).join('');
    return `<button type="button" class="fishingGearCard${active?' equipped':''}${focused?' selected':''}${unlocked?'':' locked'}" data-rod-id="${rod.id}" aria-pressed="${focused}">
      <span class="fishingGearIcon">${rod.icon}</span>
      <span class="fishingGearCopy"><b>${rod.name}</b><small>${unlocked?fishingRodUnlockText(rod):`🔒 ${fishingRodUnlockText(rod)}`}</small><span>${effects}</span></span>
      <strong>${active?'장착 중':unlocked?'장착':'보기'}</strong>
    </button>`;
  }).join('');
  list.querySelectorAll('[data-rod-id]').forEach(button=>{
    button.addEventListener('click',()=>{
      const rod=FISHING_ROD_BY_ID.get(button.dataset.rodId);
      fishingGearState.selectedRodId=rod.id;
      if(isFishingRodUnlocked(rod)) equipFishingRod(rod.id);
      else renderFishingGear();
    });
  });

  const detail=document.getElementById('fishingGearDetail');
  const requirement=selected.requiresMasterReward?'도감 20종을 모으면 받을 수 있어요':`낚시 Lv.${selected.unlockLevel}부터 사용 가능`;
  detail.innerHTML=`<span>${equipped.id===selected.id?'현재 장비':isFishingRodUnlocked(selected)?'선택한 장비':'앞으로 사용할 수 있는 장비'}</span><div><i>${selected.icon}</i><div><b>${selected.name}</b><p>${selected.description}</p></div></div><footer>${fishingRodEffectLabels(selected).map(label=>`<em>${label}</em>`).join('')}</footer>${!isFishingRodUnlocked(selected)?`<p class="fishingGearRequirement">${requirement}</p>`:''}`;
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
