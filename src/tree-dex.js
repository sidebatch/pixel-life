const treeDexState={open:false,detailOpen:false,filter:'all',selectedSpecies:null,
  discoveryOpen:false,discoverySpecies:null,returnMenuOpen:false};

function isTreeDexOpen(){return treeDexState.open;}
function isTreeDexDetailOpen(){return treeDexState.detailOpen;}
function isTreeDiscoveryOpen(){return treeDexState.discoveryOpen;}

function treeDexEntries(){
  return FOREST_SPECIES.map((species,index)=>({species,index,name:FOREST_WOOD[species],...FORESTRY_TREES[species]}))
    .sort((a,b)=>a.tier-b.tier||a.index-b.index);
}

function treeDexList(){
  const entries=treeDexEntries();
  const world=TREE_DEX_WORLDS.find(item=>item.id===treeDexState.filter);
  if(world)return entries.filter(tree=>tree.tier>=world.minTier&&tree.tier<=world.maxTier);
  return entries;
}

function treeDexWorldForTier(tier){
  return TREE_DEX_WORLDS.find(world=>tier>=world.minTier&&tier<=world.maxTier)||TREE_DEX_WORLDS[0];
}

function treeDexWorldProgress(world){
  const entries=treeDexEntries().filter(tree=>tree.tier>=world.minTier&&tree.tier<=world.maxTier);
  return {found:entries.filter(tree=>getTreeCollectionRecord(tree.species)).length,total:entries.length};
}

function treeDexImage(species){return FOREST_TREE_URLS[species];}
function treeDexLogImage(species){return LIFE_ITEM_URLS[`${species}Log`];}

function renderTreeDexSummary(discovered){
  const percent=Math.round(discovered/FOREST_SPECIES.length*100);
  const summary=document.getElementById('treeDexSummary');
  const nextWorld=TREE_DEX_WORLDS.find(world=>{
    const progress=treeDexWorldProgress(world);
    return progress.found<progress.total;
  });
  const progress=nextWorld?treeDexWorldProgress(nextWorld):null;
  summary.className=`fishDexReward treeDexSummary${nextWorld?'':' complete'}`;
  summary.innerHTML=`<div><small>${nextWorld?`${nextWorld.name} · ${progress.found}/${progress.total}`:'나무 도감'}</small><b>${nextWorld?'수집 중':'도감 완성'}</b><i><span style="width:${percent}%"></span></i></div><span>${percent}%</span>`;
}

function renderTreeDexDetail(tree){
  const detail=document.getElementById('treeDexDetail');
  const record=getTreeCollectionRecord(tree.species);
  const world=treeDexWorldForTier(tree.tier);
  if(!record){
    detail.className='fishDexDetail treeDexDetail undiscovered';
    detail.innerHTML=`
      <div class="fishDexDetailHero treeDexDetailHero"><span><img class="treeDexSilhouette" src="${treeDexImage(tree.species)}" alt=""></span><div><small>${world.name}</small><h3>???</h3></div></div>
      <p>아직 발견하지 못한 나무입니다.</p>`;
    return;
  }
  detail.className=`fishDexDetail treeDexDetail tree-tier-${tree.tier}`;
  detail.innerHTML=`
    <div class="fishDexDetailHero treeDexDetailHero"><span><img src="${treeDexImage(tree.species)}" alt=""></span><div><small>${world.name}</small><h3>${tree.name}</h3></div></div>
    <p>${TREE_DEX_DESCRIPTIONS[tree.species]||'벌목 도감에 기록된 나무입니다.'}</p>
    <div class="fishDexStats">
      <div><span>벤 횟수</span><b>${record.count.toLocaleString()}그루</b></div>
      <div><span>벌목 경험치</span><b>${forestryTreeXp(tree).toLocaleString()} XP</b></div>
      <div><span>목재 판매가</span><b>${tree.logPrice.toLocaleString()}코인</b></div>
    </div>
    <div class="treeDexWood"><img src="${treeDexLogImage(tree.species)}" alt=""><span><small>획득 목재</small><b>${tree.name} 목재 · 0~3개</b></span></div>`;
}

function treeDexNextWorldTeaser(){
  const index=TREE_DEX_WORLDS.findIndex(world=>world.id===treeDexState.filter);
  if(index<0||index>=TREE_DEX_WORLDS.length-1)return '';
  const next=TREE_DEX_WORLDS[index+1];
  const silhouettes=treeDexEntries()
    .filter(tree=>tree.tier>=next.minTier&&tree.tier<=next.maxTier)
    .slice(0,3)
    .map(tree=>`<img src="${treeDexImage(tree.species)}" alt="">`).join('');
  return `<aside class="treeDexNextWorld" aria-label="다음 세계 미리보기">
    <div class="treeDexNextSilhouettes" aria-hidden="true">${silhouettes}</div>
    <span><small>다음 숲</small><b>${next.name}</b><em>새로운 나무</em></span>
  </aside>`;
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
    return `<button type="button" class="fishDexCard treeDexCard ${found?'discovered':'undiscovered'} tree-tier-${tree.tier}" data-tree-species="${tree.species}" aria-label="${found?tree.name:'미발견 나무'}" aria-haspopup="dialog">
      <span class="fishDexCardIcon treeDexCardIcon"><img class="${found?'':'treeDexSilhouette'}" src="${treeDexImage(tree.species)}" alt=""></span>
      <b>${found?tree.name:'???'}</b>
    </button>`;
  }).join('')+treeDexNextWorldTeaser();
  grid.querySelectorAll('[data-tree-species]').forEach(button=>button.addEventListener('click',()=>openTreeDexDetail(button.dataset.treeSpecies)));
}

function showTreeDiscoveryReveal(species){
  const tree=treeDexEntries().find(item=>item.species===species);
  if(!tree||treeDexState.discoveryOpen)return false;
  const world=treeDexWorldForTier(tree.tier);
  treeDexState.discoveryOpen=true;
  treeDexState.discoverySpecies=species;
  treeDexState.returnMenuOpen=menuOpen;
  menuOpen=true;
  clearMovement();
  document.getElementById('treeDiscoveryImage').src=treeDexImage(species);
  document.getElementById('treeDiscoveryImage').alt=`${tree.name} 나무`;
  document.getElementById('treeDiscoveryWorld').textContent=world.name;
  document.getElementById('treeDiscoveryTitle').textContent=tree.name;
  document.getElementById('treeDiscoveryDescription').textContent=TREE_DEX_DESCRIPTIONS[species]||'새로운 나무가 도감에 기록되었습니다.';
  const overlay=document.getElementById('treeDiscoveryOverlay');
  overlay.classList.remove('show');
  void overlay.offsetWidth;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  if(typeof playTreeDiscoverySound==='function')playTreeDiscoverySound();
  document.getElementById('treeDiscoveryClose').focus();
  return true;
}

function closeTreeDiscoveryReveal(){
  if(!treeDexState.discoveryOpen)return false;
  treeDexState.discoveryOpen=false;
  const overlay=document.getElementById('treeDiscoveryOverlay');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  menuOpen=treeDexState.returnMenuOpen;
  treeDexState.returnMenuOpen=false;
  document.getElementById('btnA')?.focus({preventScroll:true});
  return true;
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
document.getElementById('treeDiscoveryClose').addEventListener('click',closeTreeDiscoveryReveal);
document.getElementById('treeDiscoveryOverlay').addEventListener('keydown',event=>{
  if(event.key!=='Escape'&&event.key!=='Tab')return;
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('treeDiscoveryClose').focus();
});
document.querySelectorAll('[data-tree-filter]').forEach(button=>button.addEventListener('click',()=>{
  treeDexState.filter=button.dataset.treeFilter;
  treeDexState.selectedSpecies=null;
  renderTreeDex();
}));
