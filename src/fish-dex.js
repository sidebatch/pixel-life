const FISH_DEX_LABELS=Object.freeze({
  habitats:{pond:'연못',river:'강',coast:'바다'},
  periods:{DAWN:'새벽',DAY:'낮',DUSK:'저녁',NIGHT:'밤'},
  weather:{clear:'맑음',rain:'비',storm:'폭풍'}
});

const FISH_DESCRIPTIONS=Object.freeze({
  'fish.crucian_carp':'마을 연못에서 흔히 만나는 느긋한 물고기.',
  'fish.koi':'큰 몸집으로 천천히 물살을 가르는 친숙한 민물고기.',
  'fish.goldfish':'햇빛 아래에서 비늘이 반짝이는 작은 관상어.',
  'fish.largemouth_bass':'먹잇감을 발견하면 빠르게 달려드는 힘센 포식자.',
  'fish.catfish':'비가 오는 밤, 연못 바닥을 조용히 누비는 물고기.',
  'fish.golden_koi':'새벽빛을 머금은 듯 황금색으로 빛나는 희귀한 잉어.',
  'fish.minnow':'맑은 강의 얕은 물에서 무리 지어 헤엄치는 작은 물고기.',
  'fish.trout':'차가운 강물을 거슬러 오르는 재빠른 물고기.',
  'fish.ayu':'깨끗한 물과 햇살을 좋아하는 은빛 강물고기.',
  'fish.salmon':'새벽과 저녁에 긴 여정을 이어가는 힘센 회유어.',
  'fish.snakehead':'어두운 밤의 강에서 조용히 먹잇감을 노리는 사냥꾼.',
  'fish.rainbow_trout':'빗속에서 선명한 무지갯빛을 드러내는 아름다운 송어.',
  'fish.masou_salmon':'맑은 새벽의 깊은 계곡에서만 모습을 보이는 귀한 물고기.',
  'fish.sardine':'바닷가를 은빛 물결처럼 가득 채우는 작은 물고기.',
  'fish.mackerel':'넓은 바다를 빠르게 헤엄치는 푸른 등빛 물고기.',
  'fish.horse_mackerel':'해안 가까이에서 부지런히 움직이는 날렵한 물고기.',
  'fish.red_seabream':'맑은 바다에서 붉은 비늘을 자랑하는 복스러운 물고기.',
  'fish.seabass':'거친 날씨의 밤바다를 누비는 강인한 포식자.',
  'fish.flounder':'모래 바닥에 몸을 숨기고 때를 기다리는 납작한 물고기.',
  'fish.coelacanth':'폭풍우 치는 밤에만 전설처럼 나타나는 태고의 물고기.'
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
    <p>${FISH_DESCRIPTIONS[fish.id]||'도감에 기록된 물고기입니다.'}</p>
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
    return `<button type="button" class="fishDexCard ${found?'discovered':'undiscovered'} rarity-${fish.rarity}" data-fish-id="${fish.id}" aria-label="${found?fish.name:'미발견 물고기'}" aria-haspopup="dialog">
      <span class="fishDexCardIcon">${found?`<img src="${getFishImageUrl(fish)}" alt="">`:'?'}</span>
      <b>${found?fish.name:'???'}</b>
      <small>${found?FISH_RARITY_LABELS[fish.rarity]:'미발견'}</small>
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
