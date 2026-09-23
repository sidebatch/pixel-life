const fishingGearState={open:false};

function isFishingGearOpen(){ return fishingGearState.open; }

function fishingRodUnlockText(rod){
  if(rod.requiresMasterReward) return '도감 20종 보상';
  if(rod.unlockLevel<=1) return '기본 지급';
  return `Fishing Lv.${rod.unlockLevel}`;
}

function fishingRodEffectLabels(rod){
  const labels=[];
  if(rod.waitReduction>0) labels.push(`입질 -${Math.round(rod.waitReduction*100)}%`);
  if(rod.rareWeightBonus>0) labels.push(`희귀 이상 +${Math.round(rod.rareWeightBonus*100)}%`);
  if(rod.sizeBonus>0) labels.push(`큰 개체 +${Math.round(rod.sizeBonus*100)}%`);
  if(!labels.length) labels.push('보정 없음');
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
  saveGame();
  renderFishingGear();
  return true;
}

function renderFishingGear(){
  const progress=GAME_STATE.progression.fishing;
  const equipped=getEquippedFishingRod();
  const nextXp=fishingXpForNextLevel(progress.level);
  const summary=document.getElementById('fishingGearSummary');
  summary.innerHTML=`<div><span>FISHING LEVEL</span><b>Lv.${progress.level}</b></div><div><span>다음 레벨</span><b>${nextXp===null?'MAX':`${progress.xp} / ${nextXp} XP`}</b></div>`;

  const list=document.getElementById('fishingGearList');
  list.innerHTML=FISHING_RODS.map(rod=>{
    const unlocked=isFishingRodUnlocked(rod);
    const active=equipped.id===rod.id;
    const effects=fishingRodEffectLabels(rod).map(label=>`<em>${label}</em>`).join('');
    return `<button type="button" class="fishingGearCard${active?' equipped':''}${unlocked?'':' locked'}" data-rod-id="${rod.id}" ${unlocked?'':'disabled'} aria-pressed="${active}">
      <span class="fishingGearIcon">${rod.icon}</span>
      <span class="fishingGearCopy"><b>${rod.name}</b><small>${unlocked?fishingRodUnlockText(rod):`🔒 ${fishingRodUnlockText(rod)}`}</small><span>${effects}</span></span>
      <strong>${active?'장착 중':unlocked?'장착':'잠김'}</strong>
    </button>`;
  }).join('');
  list.querySelectorAll('[data-rod-id]:not([disabled])').forEach(button=>{
    button.addEventListener('click',()=>equipFishingRod(button.dataset.rodId));
  });

  const detail=document.getElementById('fishingGearDetail');
  detail.innerHTML=`<span>현재 장비</span><div><i>${equipped.icon}</i><div><b>${equipped.name}</b><p>${equipped.description}</p></div></div><footer>${fishingRodEffectLabels(equipped).map(label=>`<em>${label}</em>`).join('')}</footer>`;
  renderFishingGearMenuStatus();
}

function openFishingGear(){
  if(typeof isFishingActive==='function'&&isFishingActive()) return;
  toggleMenu(false);
  const rewards=applyFishCollectionRewards();
  if(rewards.unlocked.length) saveGame();
  fishingGearState.open=true;
  menuOpen=true;
  clearMovement();
  renderFishingGear();
  const panel=document.getElementById('fishingGearPanel');
  panel.classList.add('show');
  panel.setAttribute('aria-hidden','false');
}

function closeFishingGear(){
  fishingGearState.open=false;
  menuOpen=false;
  const panel=document.getElementById('fishingGearPanel');
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
}

document.getElementById('openFishingGearBtn').addEventListener('click',openFishingGear);
document.getElementById('fishingGearClose').addEventListener('click',closeFishingGear);
renderFishingGearMenuStatus();
