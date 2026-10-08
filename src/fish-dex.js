const FISH_DEX_LABELS=Object.freeze({
  habitats:Object.freeze(Object.fromEntries(FISHING_HABITATS.map(habitat=>[habitat.id,habitat.label]))),
  periods:{DAWN:'새벽',DAY:'낮',DUSK:'저녁',NIGHT:'밤'},
  weather:{clear:'맑음',rain:'비',storm:'폭풍'}
});

const fishDexState={open:false,detailOpen:false,category:'all',habitat:null,openHabitatId:null,selectedFishId:null};

function isFishDexOpen(){ return fishDexState.open; }
function isFishDexDetailOpen(){ return fishDexState.detailOpen; }

function getFishDexRecord(fishId){
  return GAME_STATE.collections.fish[fishId]||null;
}

function fishDexList(){
  if(fishDexState.habitat) return FISH_DATA.filter(fish=>fish.habitat===fishDexState.habitat);
  if(fishDexState.category==='all') return FISH_DATA;
  const habitatIds=new Set((FISHING_HABITATS_BY_GROUP[fishDexState.category]||[]).map(habitat=>habitat.id));
  return FISH_DATA.filter(fish=>habitatIds.has(fish.habitat));
}

function fishDexVisibleHabitats(){
  if(fishDexState.habitat){
    const habitat=FISHING_HABITAT_BY_ID.get(fishDexState.habitat);
    return habitat?[habitat]:[];
  }
  if(fishDexState.category==='all'){
    const liveHabitats=new Set(FISH_DATA.map(fish=>fish.habitat));
    return FISHING_HABITATS.filter(habitat=>liveHabitats.has(habitat.id));
  }
  return FISHING_HABITATS_BY_GROUP[fishDexState.category]||[];
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
  const label=next?(next.label||next.name):'세계의 강태공 · 74종 도감 완성';
  const progress=next?'<i><span style="width:'+Math.min(100,discovered/next.count*100)+'%"></span></i>':'';
  panel.innerHTML='<div><small>'+heading+'</small><b>'+label+'</b>'+
    (title?'<em class="fishDexTitleBadge">칭호 · '+title+'</em>':'')+progress+
    '</div><span>'+discovered+' / '+(legacy?legacy.count:FISH_DATA.length)+'</span>';
}

function fishDexUndiscoveredHint(fish,habitat,period,weather){
  const flags=GAME_STATE.progression.flags||{};
  const remaining=FISH_DATA.filter(item=>item.habitat===fish.habitat&&!getFishDexRecord(item.id)).length;
  const finalClue=flags.finalFishClue===true&&remaining===1;
  const highRarity=['rare','heroic','legendary'].includes(fish.rarity);
  if(highRarity&&!flags.rareFishHints&&!finalClue){
    return {label:'출현 힌트',text:`${habitat} · 특별한 시간 또는 날씨`};
  }
  return {
    label:finalClue?'마지막 단서':'출현 힌트',
    text:`${habitat} · ${period} · ${weather}`
  };
}

function renderFishDexDetail(fish){
  const detail=document.getElementById('fishDexDetail');
  const record=getFishDexRecord(fish.id);
  const habitat=FISH_DEX_LABELS.habitats[fish.habitat];
  const period=fishDexConditionText(fish.periods,FISH_DEX_LABELS.periods,'언제나');
  const weather=fishDexConditionText(fish.weather,FISH_DEX_LABELS.weather,'모든 날씨');
  if(!record){
    const hint=fishDexUndiscoveredHint(fish,habitat,period,weather);
    detail.className='fishDexDetail undiscovered';
    detail.innerHTML=`
      <div class="fishDexDetailHero"><span class="fishDexUnknown">?</span><div><small>미발견</small><h3>???</h3></div></div>
      <p>아직 발견하지 못한 물고기입니다. 직접 낚아 도감 기록을 완성해 보세요.</p>
      <div class="fishDexHint"><b>${hint.label}</b><span>${hint.text}</span></div>`;
    return;
  }
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
    <span class="fishDexCardIcon">${found?`<img src="${getFishImageUrl(fish)}" alt="">`:'?'}</span>
    <b>${found?fish.name:'???'}</b>
    ${found?'':'<small>미발견</small>'}
  </button>`;
}

function renderFishDexHabitatTabs(){
  const tabs=document.getElementById('fishDexHabitatTabs');
  if(fishDexState.category==='all'){
    tabs.hidden=true;
    tabs.replaceChildren();
    return;
  }
  const group=FISHING_HABITAT_GROUPS.find(item=>item.id===fishDexState.category);
  const habitats=FISHING_HABITATS_BY_GROUP[fishDexState.category]||[];
  tabs.hidden=false;
  tabs.innerHTML=[
    `<button type="button" role="tab" aria-selected="${String(fishDexState.habitat===null)}" aria-controls="fishDexScroll" data-fish-habitat="all" class="${fishDexState.habitat===null?'active':''}">${group?.label||''} 전체</button>`,
    ...habitats.map(habitat=>`<button type="button" role="tab" aria-selected="${String(fishDexState.habitat===habitat.id)}" aria-controls="fishDexScroll" data-fish-habitat="${habitat.id}" class="${fishDexState.habitat===habitat.id?'active':''}">${habitat.shortLabel}</button>`)
  ].join('');
  tabs.querySelectorAll('[data-fish-habitat]').forEach(button=>{
    button.addEventListener('click',()=>{
      fishDexState.habitat=button.dataset.fishHabitat==='all'?null:button.dataset.fishHabitat;
      fishDexState.openHabitatId=fishDexState.habitat;
      fishDexState.selectedFishId=null;
      renderFishDex();
    });
  });
}

function renderFishDexSections(){
  const sections=fishDexVisibleHabitats();
  if(!sections.some(habitat=>habitat.id===fishDexState.openHabitatId)){
    fishDexState.openHabitatId=(sections.find(habitat=>FISH_DATA.some(fish=>fish.habitat===habitat.id))||sections[0])?.id||null;
  }
  const container=document.getElementById('fishDexGrid');
  container.innerHTML=sections.map(habitat=>{
    const fish=FISH_DATA.filter(item=>item.habitat===habitat.id);
    const discovered=fish.filter(item=>getFishDexRecord(item.id)).length;
    const open=habitat.id===fishDexState.openHabitatId;
    const graduated=typeof getFishDexRewardState==='function'&&getFishDexRewardState().habitatIds.includes(habitat.id);
    const progress=fish.length?`${discovered} / ${fish.length}종`:`목표 ${habitat.targetSpeciesCount}종 · 준비 중`;
    const body=!open?'':fish.length?
      `<div class="fishDexSectionBody"><div class="fishDexSectionGrid">${fish.map(fishDexCardMarkup).join('')}</div></div>`:
      '<div class="fishDexSectionBody"><p class="fishDexSectionEmpty">아직 이 서식지에서 만날 수 있는 물고기가 없습니다.<br>지역이 열리면 도감 카드가 추가됩니다.</p></div>';
    return `<section class="fishDexHabitatSection ${open?'open':''} ${graduated?'fish-habitat-graduated':''}" data-fish-section="${habitat.id}">
      <button type="button" class="fishDexSectionToggle" data-fish-section-toggle="${habitat.id}" aria-expanded="${String(open)}">
        <span><b>${habitat.label}</b><small>${progress}</small></span>${graduated?'<em class="fishHabitatSeal" aria-label="서식지 졸업 도장">✓</em>':''}<i aria-hidden="true">⌄</i>
      </button>${body}
    </section>`;
  }).join('');
  container.querySelectorAll('[data-fish-section-toggle]').forEach(button=>{
    button.addEventListener('click',()=>{
      const habitatId=button.dataset.fishSectionToggle;
      if(fishDexState.openHabitatId===habitatId) return;
      fishDexState.openHabitatId=habitatId;
      renderFishDexSections();
    });
  });
  container.querySelectorAll('[data-fish-id]').forEach(button=>{
    button.addEventListener('click',()=>openFishDexDetail(button.dataset.fishId));
  });
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
  renderFishDexHabitatTabs();
  renderFishDexSections();
}

function openFishDexDetail(fishId,options={}){
  const fish=FISH_DATA.find(item=>item.id===fishId);
  if(!fish||!fishDexState.open) return;
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
document.querySelectorAll('[data-fish-category]').forEach(button=>{
  button.addEventListener('click',()=>{
    fishDexState.category=button.dataset.fishCategory;
    fishDexState.habitat=null;
    fishDexState.openHabitatId=null;
    fishDexState.selectedFishId=null;
    renderFishDex();
  });
});
