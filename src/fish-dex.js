const FISH_DEX_LABELS=Object.freeze({
  habitats:Object.freeze(Object.fromEntries(FISHING_HABITATS.map(habitat=>[habitat.id,habitat.label]))),
  periods:{DAWN:'새벽',DAY:'낮',DUSK:'저녁',NIGHT:'밤'},
  weather:{clear:'맑음',rain:'비',storm:'폭풍'}
});

const fishDexState={open:false,detailOpen:false,filter:'all',selectedFishId:null};

function isFishDexOpen(){ return fishDexState.open; }
function isFishDexDetailOpen(){ return fishDexState.detailOpen; }

function getFishDexRecord(fishId){
  return GAME_STATE.collections.fish[fishId]||null;
}

function fishDexList(){
  if(fishDexState.filter==='all') return FISH_DATA;
  return FISH_DATA.filter(fish=>fish.habitat===fishDexState.filter);
}

function fishDexConditionText(values,labels,fallback){
  if(!values) return fallback;
  return values.map(value=>labels[value]||value).join(' · ');
}

function renderFishDexReward(discovered){
  const rewardPanel=document.getElementById('fishDexReward');
  const nextReward=FISH_COLLECTION_REWARDS.find(reward=>discovered<reward.count);
  if(!nextReward){
    rewardPanel.className='fishDexReward complete';
    rewardPanel.innerHTML='<div><small>COLLECTION COMPLETE</small><b>🏆 강태공 · 모든 도감 보상 완료</b></div><span>20 / 20</span>';
    return;
  }
  const progress=Math.min(100,discovered/nextReward.count*100);
  rewardPanel.className='fishDexReward';
  rewardPanel.innerHTML=`<div><small>다음 도감 보상 · ${nextReward.count}종</small><b>🎁 ${nextReward.label}</b><i><span style="width:${progress}%"></span></i></div><span>${discovered} / ${nextReward.count}</span>`;
}

function fishDexUndiscoveredHint(fish,habitat,period,weather){
  const flags=GAME_STATE.progression.flags||{};
  const remaining=FISH_DATA.length-getDiscoveredFishCount();
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

function renderFishDex(){
  const list=fishDexList();
  const discovered=FISH_DATA.filter(fish=>getFishDexRecord(fish.id)).length;
  document.getElementById('fishDexProgress').textContent=`${discovered} / ${FISH_DATA.length}`;
  renderFishDexReward(discovered);
  document.querySelectorAll('[data-fish-filter]').forEach(button=>{
    const active=button.dataset.fishFilter===fishDexState.filter;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  const grid=document.getElementById('fishDexGrid');
  grid.innerHTML=list.map(fish=>{
    const found=!!getFishDexRecord(fish.id);
    return `<button type="button" class="fishDexCard ${found?'discovered':'undiscovered'} rarity-${fish.rarity}" data-fish-id="${fish.id}" aria-label="${found?`${fish.name} · ${FISH_RARITY_LABELS[fish.rarity]}`:'미발견 물고기'}" aria-haspopup="dialog">
      <span class="fishDexCardIcon">${found?`<img src="${getFishImageUrl(fish)}" alt="">`:'?'}</span>
      <b>${found?fish.name:'???'}</b>
      ${found?'':'<small>미발견</small>'}
    </button>`;
  }).join('');
  grid.querySelectorAll('[data-fish-id]').forEach(button=>{
    button.addEventListener('click',()=>{
      openFishDexDetail(button.dataset.fishId);
    });
  });
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
document.querySelectorAll('[data-fish-filter]').forEach(button=>{
  button.addEventListener('click',()=>{
    fishDexState.filter=button.dataset.fishFilter;
    fishDexState.selectedFishId=null;
    renderFishDex();
  });
});
