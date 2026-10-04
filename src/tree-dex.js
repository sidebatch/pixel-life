const treeDexState={open:false,detailOpen:false,filter:'all',selectedSpecies:null};

function isTreeDexOpen(){return treeDexState.open;}
function isTreeDexDetailOpen(){return treeDexState.detailOpen;}

function treeDexEntries(){
  return FOREST_SPECIES.map((species,index)=>({species,index,name:FOREST_WOOD[species],...FORESTRY_TREES[species]}))
    .sort((a,b)=>a.tier-b.tier||a.index-b.index);
}

function treeDexList(){
  const entries=treeDexEntries();
  if(treeDexState.filter==='early')return entries.filter(tree=>tree.tier<=3);
  if(treeDexState.filter==='middle')return entries.filter(tree=>tree.tier>=4&&tree.tier<=7);
  if(treeDexState.filter==='late')return entries.filter(tree=>tree.tier>=8);
  return entries;
}

function treeDexRegionNames(species){
  return Object.entries(FOREST_REGION_SPECIES)
    .filter(([,speciesList])=>speciesList.includes(species))
    .map(([regionId])=>REGION_WORLDS[regionId]?.name)
    .filter((name,index,names)=>name&&names.indexOf(name)===index);
}

function treeDexImage(species){return FOREST_TREE_URLS[species];}
function treeDexLogImage(species){return LIFE_ITEM_URLS[`${species}Log`];}

function renderTreeDexSummary(discovered){
  const percent=Math.round(discovered/FOREST_SPECIES.length*100);
  const summary=document.getElementById('treeDexSummary');
  summary.className=`fishDexReward treeDexSummary${discovered===FOREST_SPECIES.length?' complete':''}`;
  summary.innerHTML=`<div><small>${discovered===FOREST_SPECIES.length?'COLLECTION COMPLETE':'벌목 발견 기록'}</small><b>${discovered===FOREST_SPECIES.length?'🌳 모든 나무를 발견했어요!':'🪵 나무를 완전히 베면 도감에 등록돼요'}</b><i><span style="width:${percent}%"></span></i></div><span>${percent}%</span>`;
}

function renderTreeDexDetail(tree){
  const detail=document.getElementById('treeDexDetail');
  const record=getTreeCollectionRecord(tree.species);
  const regions=treeDexRegionNames(tree.species);
  const requiredAxe=FORESTRY_AXES[tree.tier-1];
  if(!record){
    detail.className='fishDexDetail treeDexDetail undiscovered';
    detail.innerHTML=`
      <div class="fishDexDetailHero treeDexDetailHero"><span><img class="treeDexSilhouette" src="${treeDexImage(tree.species)}" alt=""></span><div><small>미발견 · ${tree.tier}단계</small><h3>???</h3></div></div>
      <p>아직 발견하지 못한 나무입니다. 직접 완전히 베어 도감에 기록해 보세요.</p>
      <div class="fishDexHint"><b>발견 힌트</b><span>🗺️ ${regions.join(' · ')||`${tree.tier}단계 숲`}</span><span>🪓 ${requiredAxe.name} 이상 필요</span></div>`;
    return;
  }
  detail.className=`fishDexDetail treeDexDetail tree-tier-${tree.tier}`;
  detail.innerHTML=`
    <div class="fishDexDetailHero treeDexDetailHero"><span><img src="${treeDexImage(tree.species)}" alt=""></span><div><small>${tree.tier>=8?'환상 수종':'실제 수종'} · ${tree.tier}단계</small><h3>${tree.name}</h3></div></div>
    <p>${TREE_DEX_DESCRIPTIONS[tree.species]||'벌목 도감에 기록된 나무입니다.'}</p>
    <div class="fishDexStats">
      <div><span>벤 횟수</span><b>${record.count.toLocaleString()}그루</b></div>
      <div><span>나무 체력</span><b>${tree.maxHp.toLocaleString()}</b></div>
      <div><span>벌목 경험치</span><b>${tree.xp.toLocaleString()} XP</b></div>
      <div><span>목재 판매가</span><b>${tree.logPrice.toLocaleString()}코인</b></div>
    </div>
    <div class="treeDexWood"><img src="${treeDexLogImage(tree.species)}" alt=""><span><small>획득 목재</small><b>${tree.name} 목재 · 1~3개</b></span></div>
    <div class="fishDexConditions"><span>🗺️ ${regions.join(' · ')||'숲'}</span><span>🪓 ${requiredAxe.name} 이상</span></div>`;
}

function renderTreeDex(){
  const discovered=getDiscoveredTreeCount();
  document.getElementById('treeDexProgress').textContent=`${discovered} / ${FOREST_SPECIES.length}`;
  renderTreeDexSummary(discovered);
  document.querySelectorAll('[data-tree-filter]').forEach(button=>{
    const active=button.dataset.treeFilter===treeDexState.filter;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  const grid=document.getElementById('treeDexGrid');
  grid.innerHTML=treeDexList().map(tree=>{
    const found=Boolean(getTreeCollectionRecord(tree.species));
    return `<button type="button" class="fishDexCard treeDexCard ${found?'discovered':'undiscovered'} tree-tier-${tree.tier}" data-tree-species="${tree.species}" aria-label="${found?`${tree.name} · ${tree.tier}단계`:`미발견 ${tree.tier}단계 나무`}" aria-haspopup="dialog">
      <span class="fishDexCardIcon treeDexCardIcon"><img class="${found?'':'treeDexSilhouette'}" src="${treeDexImage(tree.species)}" alt=""></span>
      <b>${found?tree.name:'???'}</b><small>${found?`${tree.tier}단계`:'미발견'}</small>
    </button>`;
  }).join('');
  grid.querySelectorAll('[data-tree-species]').forEach(button=>button.addEventListener('click',()=>openTreeDexDetail(button.dataset.treeSpecies)));
}

function openTreeDexDetail(species,options={}){
  const tree=treeDexEntries().find(item=>item.species===species);
  if(!tree||!treeDexState.open)return;
  treeDexState.selectedSpecies=species;
  treeDexState.detailOpen=true;
  renderTreeDexDetail(tree);
  const modal=document.getElementById('treeDexModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.getElementById('treeDexModalClose').focus();
  if(!options.fromHistory)pushGameOverlayHistory('tree-detail',species);
}

function closeTreeDexDetail(options={}){
  if(!treeDexState.detailOpen)return;
  treeDexState.detailOpen=false;
  const modal=document.getElementById('treeDexModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  document.querySelector(`#treeDexGrid [data-tree-species="${treeDexState.selectedSpecies}"]`)?.focus({preventScroll:true});
  if(!options.fromHistory)leaveGameOverlayHistory('tree-detail');
}

function openTreeDex(options={}){
  if(typeof isFishingActive==='function'&&isFishingActive())return;
  toggleMenu(false);
  treeDexState.open=true;
  menuOpen=true;
  clearMovement();
  renderTreeDex();
  const panel=document.getElementById('treeDexPanel');
  panel.classList.add('show');
  panel.setAttribute('aria-hidden','false');
  document.getElementById('treeDexClose').focus();
  if(!options.fromHistory)pushGameOverlayHistory('tree-dex');
}

function closeTreeDex(options={}){
  if(treeDexState.detailOpen)closeTreeDexDetail({fromHistory:true});
  treeDexState.open=false;
  menuOpen=false;
  const panel=document.getElementById('treeDexPanel');
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory)leaveGameOverlayHistory('tree-dex');
}

document.getElementById('openTreeDexBtn').addEventListener('click',openTreeDex);
document.getElementById('treeDexClose').addEventListener('click',closeTreeDex);
document.getElementById('treeDexModalClose').addEventListener('click',closeTreeDexDetail);
document.querySelectorAll('[data-tree-filter]').forEach(button=>button.addEventListener('click',()=>{
  treeDexState.filter=button.dataset.treeFilter;
  treeDexState.selectedSpecies=null;
  renderTreeDex();
}));
