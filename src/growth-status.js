const GROWTH_STATUS_SKILLS=Object.freeze(['fishing','logging','farming']);
const growthStatusState={open:false,revision:'',hudRevision:'',returnFocus:'settingsBtn'};
function isGrowthStatusOpen(){return growthStatusState.open;}

function renderGrowthStatus(){
  const content=document.getElementById('growthStatusContent'),scrollTop=content.scrollTop;
  content.innerHTML=GROWTH_STATUS_SKILLS.map(id=>{
    const snapshot=lifeSkillProgressSnapshot(id),remaining=Math.max(0,snapshot.requiredXp-snapshot.currentXp);
    // XP feedback animates data-skill-card elements through intermediate values.
    // This read-only overview always displays the current saved progression.
    const card=skillCardMarkup(id,snapshot).replace(`data-skill-card="${id}"`,`data-growth-skill="${id}"`);
    return `<section class="growthStatusSkill">${card}<div class="growthStatusSkillFoot"><span>${snapshot.level>=LIFE_SKILL_MAX_LEVEL?'다음 숙련도':'다음 레벨'}까지 <b>${remaining.toLocaleString()} XP</b></span><small>누적 ${snapshot.totalXp.toLocaleString()} XP</small></div></section>`;
  }).join('');
  content.scrollTop=scrollTop;
}

function updateGrowthStatus(){
  const hudRevision=GROWTH_STATUS_SKILLS.map(id=>{const s=GAME_STATE.progression[id];return [s.level,s.mastery].join(':');}).join('|');
  if(hudRevision!==growthStatusState.hudRevision){
    growthStatusState.hudRevision=hudRevision;
    const hud=document.getElementById('growthStatusHud');
    GROWTH_STATUS_SKILLS.forEach(id=>{hud.querySelector(`[data-growth-hud-skill="${id}"] b`).textContent=`Lv.${GAME_STATE.progression[id].level}`;});
    hud.setAttribute('aria-label',GROWTH_STATUS_SKILLS.map(id=>`${LIFE_SKILLS[id].name} ${GAME_STATE.progression[id].level}레벨`).join(', ')+'. 성장 현황 열기');
  }
  if(!growthStatusState.open)return;
  const revision=GROWTH_STATUS_SKILLS.map(id=>{const s=GAME_STATE.progression[id];return [s.level,s.xp,s.totalXp,s.mastery,s.masteryXp].join(':');}).join('|');
  if(revision===growthStatusState.revision)return;
  growthStatusState.revision=revision;renderGrowthStatus();
}

function openGrowthStatus(options={}){
  if(growthStatusState.open||isFishingActive()||dialogOpen||isInventoryOpen()||isFishDexOpen()||isTreeDexOpen()||isMarketOpen()||isFarmPlotOpen()||isCharacterStyleOpen()||isHarborOpen())return;
  growthStatusState.returnFocus=document.activeElement?.id==='growthStatusHud'?'growthStatusHud':'settingsBtn';
  toggleMenu(false);clearMovement();growthStatusState.open=true;growthStatusState.revision='';menuOpen=true;
  const panel=document.getElementById('growthStatusOverlay');
  updateGrowthStatus();panel.classList.add('show');panel.setAttribute('aria-hidden','false');panel.removeAttribute('inert');
  document.getElementById('growthStatusContent').scrollTop=0;document.getElementById('growthStatusClose').focus({preventScroll:true});
  if(!options.fromHistory)pushGameOverlayHistory('growth-status');
}

function closeGrowthStatus(options={}){
  if(!growthStatusState.open)return;
  growthStatusState.open=false;growthStatusState.revision='';menuOpen=false;clearMovement();
  const panel=document.getElementById('growthStatusOverlay');panel.classList.remove('show');panel.setAttribute('aria-hidden','true');panel.setAttribute('inert','');
  document.getElementById(growthStatusState.returnFocus).focus({preventScroll:true});
  if(!options.fromHistory)leaveGameOverlayHistory('growth-status');
}

if(typeof document!=='undefined'){
  const hud=document.getElementById('growthStatusHud');
  hud.innerHTML=GROWTH_STATUS_SKILLS.map(id=>`<span data-growth-hud-skill="${id}" aria-hidden="true"><img src="${LIFE_SKILL_ICON_URLS[id]}" alt=""${id==='fishing'?' class="rodThickArt"':''}><b>Lv.1</b></span>`).join('');
  hud.addEventListener('click',()=>openGrowthStatus());
  document.querySelectorAll('[data-growth-menu-skill]').forEach(img=>{img.src=LIFE_SKILL_ICON_URLS[img.dataset.growthMenuSkill];if(img.dataset.growthMenuSkill==='fishing')img.classList.add('rodThickArt');});
  document.getElementById('openGrowthStatusBtn').addEventListener('click',()=>openGrowthStatus());
  document.getElementById('growthStatusClose').addEventListener('click',()=>closeGrowthStatus());
  document.getElementById('growthStatusOverlay').addEventListener('click',event=>{if(event.target.classList.contains('growthStatusBackdrop'))closeGrowthStatus();});
  document.getElementById('growthStatusOverlay').addEventListener('keydown',event=>{
    if(event.key==='Tab'){event.preventDefault();document.getElementById('growthStatusClose').focus();}
  });
}
