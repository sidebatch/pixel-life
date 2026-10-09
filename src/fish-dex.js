const FISH_DEX_LABELS=Object.freeze({
  habitats:Object.freeze(Object.fromEntries(FISHING_HABITATS.map(habitat=>[habitat.id,habitat.label]))),
  periods:{DAWN:'새벽',DAY:'낮',DUSK:'저녁',NIGHT:'밤'},
  weather:{clear:'맑음',rain:'비',storm:'폭풍'}
});

const fishDexState={open:false,detailOpen:false,category:'all',rewardsOpen:false,selectedFishId:null};

function isFishDexOpen(){ return fishDexState.open; }
function isFishDexDetailOpen(){ return fishDexState.detailOpen; }

function getFishDexRecord(fishId){
  return GAME_STATE.collections.fish[fishId]||null;
}

function fishDexList(){
  if(fishDexState.category==='all') return FISH_DATA;
  const habitatIds=new Set((FISHING_HABITATS_BY_GROUP[fishDexState.category]||[]).map(habitat=>habitat.id));
  return FISH_DATA.filter(fish=>habitatIds.has(fish.habitat));
}

function fishDexConditionText(values,labels,fallback){
  if(!values) return fallback;
  return values.map(value=>labels[value]||value).join(' · ');
}

function renderFishDexReward(discovered){
  const panel=document.getElementById('fishDexReward');
  const legacy=FISH_COLLECTION_REWARDS.find(reward=>discovered<reward.count);
  const cosmetic=typeof FISH_DEX_MILESTONES==='undefined'?null:FISH_DEX_MILESTONES.find(reward=>discovered<reward.count);
  const next=legacy||cosmetic;
  const title=typeof fishDexActiveTitle==='function'?fishDexActiveTitle():null;
  panel.className='fishDexReward'+(next?'':' complete');
  const heading=legacy?'다음 도감 보상 · '+next.count+'종':next?'기존 20종 도감 보상 완료 · 다음 '+next.count+'종':'기존 20종 도감 보상 완료';
  const label=next?(legacy?fishDexLegacyRewardLabel(next):next.name):'세계의 강태공 · 74종 도감 완성';
  const progress=next?'<i><span style="width:'+Math.min(100,discovered/next.count*100)+'%"></span></i>':'';
  panel.innerHTML='<div><small>'+heading+'</small><b>'+label+'</b>'+
    (title?'<em class="fishDexTitleBadge">칭호 · '+title+'</em>':'')+progress+
    '</div><span>'+discovered+' / '+(legacy?legacy.count:FISH_DATA.length)+'</span>';
}

function fishDexLegacyRewardLabel(reward){
  // Keep historical reward IDs/save flags, but never promise hidden-fish hints.
  if(reward.kind==='rareHints'||reward.kind==='finalClue')return `${reward.count}종 발견 기록`;
  return reward.label;
}

function renderFishDexDetail(fish){
  const detail=document.getElementById('fishDexDetail');
  const record=getFishDexRecord(fish.id);
  if(!record){
    detail.className='fishDexDetail undiscovered';
    detail.innerHTML=`
      <div class="fishDexDetailHero"><span class="fishDexUnknown">?</span><div><small>미발견</small><h3>???</h3></div></div>
      <p>아직 발견하지 못한 물고기입니다. 직접 낚아 도감 기록을 완성해 보세요.</p>`;
    return;
  }
  const habitat=FISH_DEX_LABELS.habitats[fish.habitat];
  const period=fishDexConditionText(fish.periods,FISH_DEX_LABELS.periods,'언제나');
  const weather=fishDexConditionText(fish.weather,FISH_DEX_LABELS.weather,'모든 날씨');
  detail.className=`fishDexDetail rarity-${fish.rarity}`;
  detail.innerHTML=`
    <div class="fishDexDetailHero"><span><img src="${getFishImageUrl(fish)}" alt=""></span><div><small>${FISH_RARITY_LABELS[fish.rarity]}</small><h3>${fish.name}</h3></div></div>
    <p>${fish.description||'도감에 기록된 물고기입니다.'}</p>
    <div class="fishDexStats">
      <div><span>잡은 수</span><b>${record.count}마리</b></div>
      <div><span>최대 크기</span><b>${record.maxSizeCm.toFixed(1)}cm</b></div>
      <div><span>최소 크기</span><b>${record.minSizeCm.toFixed(1)}cm</b></div>
      <div><span>평균 크기</span><b>${record.averageSizeCm.toFixed(1)}cm</b></div>
    </div>
    <div class="fishDexConditions"><span>📍 ${habitat}</span><span>🕒 ${period}</span><span>☁️ ${weather}</span></div>`;
}

function fishDexCardMarkup(fish){
  const found=!!getFishDexRecord(fish.id);
  return `<button type="button" class="fishDexCard ${found?'discovered':'undiscovered'} rarity-${fish.rarity}" data-fish-id="${fish.id}" aria-label="${found?`${fish.name} · ${FISH_RARITY_LABELS[fish.rarity]}`:'미발견 물고기'}" aria-haspopup="dialog">
    <span class="fishDexCardIcon">${found?`<img src="${getFishImageUrl(fish)}" alt="" loading="lazy" decoding="async">`:'?'}</span>
    <b>${found?fish.name:'???'}</b>
  </button>`;
}

function renderFishDexGrid(){
  const container=document.getElementById('fishDexGrid');
  container.innerHTML=fishDexList().map(fishDexCardMarkup).join('');
  container.querySelectorAll('[data-fish-id]').forEach(button=>{
    button.addEventListener('click',()=>openFishDexDetail(button.dataset.fishId));
  });
}
function renderFishDexRewardsList(){
  const discovered=getDiscoveredFishCount(),state=getFishDexRewardState();
  const row=(label,description,status)=>`<li><div><b>${label}</b><small>${description}</small></div><span>${status}</span></li>`;
  const legacy=FISH_COLLECTION_REWARDS.map(reward=>row(reward.count+'종',fishDexLegacyRewardLabel(reward),discovered>=reward.count?'달성':'미달성')).join('');
  const milestones=FISH_DEX_MILESTONES.map(reward=>row(reward.count+'종',reward.name,state.milestoneIds.includes(reward.id)?'달성':'미달성')).join('');
  const habitats=FISHING_HABITATS.map(habitat=>{
    const species=FISH_DATA.filter(fish=>fish.habitat===habitat.id),found=species.filter(fish=>getFishDexRecord(fish.id)).length;
    return `<li><div><b>${habitat.label}</b><small>${found} / ${species.length}종 발견</small></div>${state.habitatIds.includes(habitat.id)?'<em class="fishHabitatSeal" aria-label="서식지 졸업 도장">✓</em>':'<span>미완성</span>'}</li>`;
  }).join('');
  document.getElementById('fishDexRewardsList').innerHTML='<h3>발견 보상</h3><ul>'+legacy+milestones+'</ul><h3>서식지 완성</h3><ul>'+habitats+'</ul>';
}
function isFishDexRewardsOpen(){return fishDexState.rewardsOpen;}
function openFishDexRewards(options={}){
  if(!fishDexState.open||fishDexState.detailOpen||isFishDexRewardsOpen())return;
  renderFishDexReward(getDiscoveredFishCount());renderFishDexRewardsList();fishDexState.rewardsOpen=true;
  const modal=document.getElementById('fishDexRewardsModal');modal.classList.add('show');modal.setAttribute('aria-hidden','false');modal.removeAttribute('inert');
  document.getElementById('fishDexRewardsClose').focus();
  if(!options.fromHistory)pushGameOverlayHistory('fish-dex-rewards');
}
function closeFishDexRewards(options={}){
  if(!isFishDexRewardsOpen())return;
  fishDexState.rewardsOpen=false;const modal=document.getElementById('fishDexRewardsModal');
  modal.classList.remove('show');modal.setAttribute('aria-hidden','true');modal.setAttribute('inert','');
  document.getElementById('fishDexRewardsBtn').focus({preventScroll:true});
  if(!options.fromHistory)leaveGameOverlayHistory('fish-dex-rewards');
}

function renderFishDex(){
  if(typeof syncFishDexRewards==='function')syncFishDexRewards();
  const panel=document.getElementById('fishDexPanel');
  panel.classList.remove('fish-reward-wave','fish-reward-aurora');
  if(typeof fishDexRewardFrame==='function'&&fishDexRewardFrame())panel.classList.add(fishDexRewardFrame());
  const discovered=FISH_DATA.filter(fish=>getFishDexRecord(fish.id)).length;
  document.getElementById('fishDexProgress').textContent=`${discovered} / ${FISH_DATA.length}`;
  renderFishDexReward(discovered);
  document.querySelectorAll('[data-fish-category]').forEach(button=>{
    const active=button.dataset.fishCategory===fishDexState.category;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  renderFishDexGrid();
  if(isFishDexRewardsOpen())renderFishDexRewardsList();
}

function openFishDexDetail(fishId,options={}){
  const fish=FISH_DATA.find(item=>item.id===fishId);
  if(!fish||!fishDexState.open||isFishDexRewardsOpen()) return;
  fishDexState.selectedFishId=fishId;
  fishDexState.detailOpen=true;
  renderFishDexDetail(fish);
  const modal=document.getElementById('fishDexModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.getElementById('fishDexModalClose').focus();
  if(!options.fromHistory) pushGameOverlayHistory('fish-detail',fishId);
}

function closeFishDexDetail(options={}){
  if(!fishDexState.detailOpen) return;
  fishDexState.detailOpen=false;
  const modal=document.getElementById('fishDexModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  const card=Array.from(document.querySelectorAll('#fishDexGrid [data-fish-id]')).find(
    button=>button.dataset.fishId===fishDexState.selectedFishId
  );
  card?.focus({preventScroll:true});
  if(!options.fromHistory) leaveGameOverlayHistory('fish-detail');
}

function openFishDex(options={}){
  if(typeof isFishingActive==='function'&&isFishingActive()) return;
  toggleMenu(false);
  const rewards=applyFishCollectionRewards();
  if(rewards.unlocked.length) saveGame();
  fishDexState.open=true;
  menuOpen=true;
  clearMovement();
  renderFishDex();
  const panel=document.getElementById('fishDexPanel');
  panel.classList.add('show');
  panel.setAttribute('aria-hidden','false');
  if(!options.fromHistory) pushGameOverlayHistory('fish-dex');
  if(typeof updateFishRewardReveal==='function')updateFishRewardReveal();
}

function closeFishDex(options={}){
  if(isFishDexRewardsOpen())closeFishDexRewards({fromHistory:true});
  if(fishDexState.detailOpen) closeFishDexDetail({fromHistory:true});
  fishDexState.open=false;
  menuOpen=false;
  const panel=document.getElementById('fishDexPanel');
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory) leaveGameOverlayHistory('fish-dex');
}

document.getElementById('openFishDexBtn').addEventListener('click',openFishDex);
document.getElementById('fishDexClose').addEventListener('click',closeFishDex);
document.getElementById('fishDexModalClose').addEventListener('click',closeFishDexDetail);
document.getElementById('fishDexRewardsBtn').addEventListener('click',openFishDexRewards);
document.getElementById('fishDexRewardsClose').addEventListener('click',closeFishDexRewards);
document.getElementById('fishDexRewardsModal').addEventListener('click',event=>{
  if(event.target.classList.contains('fishDexModalBackdrop'))closeFishDexRewards();
});
document.getElementById('fishDexRewardsModal').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeFishDexRewards();}
  else if(event.key==='Tab'){event.preventDefault();event.stopPropagation();document.getElementById('fishDexRewardsClose').focus();}
});
document.querySelectorAll('[data-fish-category]').forEach(button=>{
  button.addEventListener('click',()=>{
    fishDexState.category=button.dataset.fishCategory;
    document.getElementById('fishDexScroll').scrollTop=0;
    fishDexState.selectedFishId=null;
    renderFishDex();
  });
});
