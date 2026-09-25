const lifeUi={plotId:null,open:false,phase:null,toastTimer:null,hit:null,lastRefresh:0};

function lifeItemIconMarkup(type,id,fallback=''){
  const asset=type==='material'?(id==='log'?LIFE_ITEM_URLS.log:LIFE_ITEM_URLS[`${id.slice(0,-4)}Log`]):
    type==='seed'?LIFE_ITEM_URLS[`${id}Seed`]:type==='crop'?LIFE_ITEM_URLS[`${id}Crop`]:null;
  return asset?`<img class="lifeItemIcon" src="${asset}" alt="">`:`<span aria-hidden="true">${fallback}</span>`;
}

function lifeItemName(type,id){
  if(type==='material') return id==='log'?'통나무':FOREST_WOOD[id.slice(0,-4)]&&id.endsWith('_log')?`${FOREST_WOOD[id.slice(0,-4)]} 통나무`:'';
  const crop=LIFE_CROP_BY_ID.get(id);
  return crop?(type==='seed'?`${crop.name} 씨앗`:type==='crop'?crop.name:''):'';
}

function lifeItemCount(type,id,inventory=GAME_STATE.inventory){
  return inventory.reduce((total,item)=>total+(item.type===type&&item.id===id?item.quantity||0:0),0);
}
function totalLogCount(inventory=GAME_STATE.inventory){
  return lifeItemCount('material','log',inventory)+FOREST_SPECIES.reduce((total,species)=>total+lifeItemCount('material',`${species}_log`,inventory),0);
}
function spendLogs(quantity){
  let remaining=quantity;
  for(const id of ['log',...FOREST_SPECIES.map(species=>`${species}_log`)]){
    const used=Math.min(remaining,lifeItemCount('material',id));
    if(used) removeLifeItem('material',id,used);
    remaining-=used;
    if(!remaining) break;
  }
  return remaining===0;
}

function addLifeItem(type,id,quantity){
  if(!Number.isSafeInteger(quantity)||quantity<1||!lifeItemName(type,id)) return false;
  const existing=GAME_STATE.inventory.find(item=>item.type===type&&item.id===id);
  if(existing) existing.quantity+=quantity;
  else GAME_STATE.inventory.push({type,id,name:lifeItemName(type,id),quantity});
  return true;
}

function removeLifeItem(type,id,quantity){
  if(!Number.isSafeInteger(quantity)||quantity<1||lifeItemCount(type,id)<quantity) return false;
  let remaining=quantity;
  for(const item of GAME_STATE.inventory){
    if(item.type!==type||item.id!==id||!remaining) continue;
    const taken=Math.min(item.quantity,remaining);
    item.quantity-=taken;remaining-=taken;
  }
  GAME_STATE.inventory=GAME_STATE.inventory.filter(item=>item.quantity!==0);
  return true;
}

function commitLifeChange(change){
  const beforeInventory=JSON.parse(JSON.stringify(GAME_STATE.inventory));
  const beforeWorld=JSON.parse(JSON.stringify(GAME_STATE.world));
  const beforeCoins=GAME_STATE.progression.coins;
  const beforeLogging=GAME_STATE.progression.logging?{...GAME_STATE.progression.logging}:null;
  const result=change();
  if(result&&saveGame()) return result;
  GAME_STATE.inventory=beforeInventory;
  GAME_STATE.world=beforeWorld;
  GAME_STATE.progression.coins=beforeCoins;
  if(beforeLogging) GAME_STATE.progression.logging=beforeLogging;
  return null;
}

function getTreeState(tree,now=Date.now()){
  const saved=GAME_STATE.world.trees?.[tree.id];
  if(!saved) return {hp:LIFE_CONTENT.treeHp,choppedAt:null};
  if(saved.choppedAt&&now-saved.choppedAt>=LIFE_CONTENT.treeRespawnMs)
    return {hp:LIFE_CONTENT.treeHp,choppedAt:null};
  return saved;
}

function showLifeToast(message,options={}){
  const toast=document.getElementById('lifeToast');
  toast.textContent=message;
  if(options.belowSkill) toast.classList.add('belowSkill');
  else toast.classList.remove('belowSkill');
  toast.classList.add('show');
  clearTimeout(lifeUi.toastTimer);
  lifeUi.toastTimer=setTimeout(()=>toast.classList.remove('show','belowSkill'),1900);
}

function hitResourceTree(tree){
  if(!tree?.interactable||!FOREST_REGION_SPECIES[GAME_STATE.regionId]) return false;
  const now=Date.now();
  const current=getTreeState(tree,now);
  if(current.hp<=0){
    showLifeToast('나무가 다시 자라고 있어요');
    return false;
  }
  const nextHp=Math.max(0,current.hp-LIFE_CONTENT.treeDamage);
  const logs=nextHp===0?1+Math.floor(Math.random()*3):0;
  const gainedXp=logs?(LIFE_CONTENT.loggingXpBySpecies[tree.species]||0):0;
  const progressBefore=gainedXp?lifeSkillProgressSnapshot('logging'):null;
  const success=commitLifeChange(()=>{
    GAME_STATE.world.trees[tree.id]=nextHp===0?{hp:0,choppedAt:now,maxHp:LIFE_CONTENT.treeHp}:{hp:nextHp,choppedAt:null,maxHp:LIFE_CONTENT.treeHp};
    if(logs) addLifeItem('material',`${tree.species}_log`,logs);
    if(gainedXp) grantLifeSkillXp('logging',gainedXp);
    return true;
  });
  if(!success){showLifeToast('저장하지 못했어요. 다시 시도해 주세요');return false;}
  lifeUi.hit={regionId:GAME_STATE.regionId,x:tree.x,y:tree.y,until:performance.now()+650};
  if(logs){
    showLifeToast(`+${logs} ${FOREST_WOOD[tree.species]} 통나무`,{belowSkill:true});
    showSkillXpFeedback('logging',progressBefore,lifeSkillProgressSnapshot('logging'),gainedXp);
  }
  return true;
}

function getFarmPlotState(plot){
  const index=REGION_WORLDS.sunnyFields.farmPlots.findIndex(item=>item.id===plot.id);
  const saved=GAME_STATE.world.plots?.[plot.id];
  return saved||{unlocked:isInitialFarmPlot(index),cropId:null,plantedAt:null};
}

function getFarmPlotPhase(plot,now=Date.now()){
  const state=getFarmPlotState(plot);
  if(!state.unlocked) return 'LOCKED';
  if(!state.cropId||!state.plantedAt) return 'EMPTY';
  const crop=LIFE_CROP_BY_ID.get(state.cropId);
  return crop&&now-state.plantedAt>=crop.growMs?'READY':'GROWING';
}

function farmExpansionCost(){
  const unlocked=REGION_WORLDS.sunnyFields.farmPlots.filter(plot=>getFarmPlotState(plot).unlocked).length;
  return LIFE_CONTENT.farmExpansionCosts[unlocked-LIFE_CONTENT.initialFarmPlots]||null;
}

function buyFarmPlot(plot){
  if(getFarmPlotPhase(plot)!=='LOCKED') return false;
  const cost=farmExpansionCost();
  if(!cost) return false;
  if(GAME_STATE.progression.coins<cost.coins||totalLogCount()<cost.logs){
    showLifeToast('코인이나 통나무가 부족해요');return false;
  }
  const success=commitLifeChange(()=>{
    GAME_STATE.progression.coins-=cost.coins;
    if(cost.logs) spendLogs(cost.logs);
    GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:null,plantedAt:null};
    return true;
  });
  if(!success){showLifeToast('저장하지 못했어요');return false;}
  document.getElementById('coinCount').textContent=GAME_STATE.progression.coins.toLocaleString();
  showLifeToast('새 밭을 사용할 수 있어요!');
  renderLifePanel();return true;
}

function plantFarmCrop(plot,cropId){
  if(getFarmPlotPhase(plot)!=='EMPTY'||!LIFE_CROP_BY_ID.has(cropId)) return false;
  if(lifeItemCount('seed',cropId)<1){showLifeToast('씨앗이 없어요');return false;}
  const now=Date.now();
  const success=commitLifeChange(()=>{
    removeLifeItem('seed',cropId,1);
    GAME_STATE.world.plots[plot.id]={unlocked:true,cropId,plantedAt:now};
    return true;
  });
  if(!success){showLifeToast('저장하지 못했어요');return false;}
  showLifeToast(`${LIFE_CROP_BY_ID.get(cropId).name} 씨앗을 심었어요`);
  renderLifePanel();return true;
}

function harvestFarmCrop(plot){
  if(getFarmPlotPhase(plot)!=='READY') return false;
  const state=getFarmPlotState(plot),crop=LIFE_CROP_BY_ID.get(state.cropId);
  if(!crop) return false;
  const quantity=crop.harvestMin+Math.floor(Math.random()*(crop.harvestMax-crop.harvestMin+1));
  const success=commitLifeChange(()=>{
    addLifeItem('crop',crop.id,quantity);
    GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:null,plantedAt:null};
    return true;
  });
  if(!success){showLifeToast('저장하지 못했어요');return false;}
  showLifeToast(`+${quantity} ${crop.name}`);
  renderLifePanel();return true;
}

function farmPlotAt(x,y){
  if(GAME_STATE.regionId!=='sunnyFields') return null;
  return WORLD_DEFINITION.farmPlots.find(plot=>plot.x===x&&plot.y===y)||null;
}

function farmPlotActionLabel(plot){
  const phase=getFarmPlotPhase(plot);
  return {LOCKED:'밭 확장',EMPTY:'씨앗 심기',GROWING:'작물 살펴보기',READY:'수확'}[phase];
}

function renderLifePanel(){
  if(!lifeUi.open) return;
  const plot=WORLD_DEFINITION.farmPlots.find(item=>item.id===lifeUi.plotId);
  if(!plot) return;
  const state=getFarmPlotState(plot),phase=getFarmPlotPhase(plot),crop=LIFE_CROP_BY_ID.get(state.cropId);
  lifeUi.phase=phase;
  document.getElementById('lifeTitle').textContent=`밭 ${Number(plot.id.slice(-2))}`;
  const info=document.getElementById('lifeInfo'),actions=document.getElementById('lifeActions');
  if(phase==='LOCKED'){
    const cost=farmExpansionCost();
    const affordable=cost&&GAME_STATE.progression.coins>=cost.coins&&totalLogCount()>=cost.logs;
    info.textContent=`이 밭을 확장하면 앞으로 계속 사용할 수 있어요. 보유 ${GAME_STATE.progression.coins.toLocaleString()}코인 · 통나무 ${totalLogCount()}개`;
    actions.innerHTML=`<button type="button" data-life-action="unlock" ${affordable?'':'disabled'}>밭 확장 · ${cost?.coins.toLocaleString()||0}코인${cost?.logs?` + 통나무 ${cost.logs}개`:''}</button>`;
  }else if(phase==='EMPTY'){
    info.textContent='씨앗을 고르면 시간이 지나 자동으로 자라요.';
    actions.innerHTML=LIFE_CONTENT.crops.map(item=>`<button type="button" data-life-action="plant" data-crop-id="${item.id}" ${lifeItemCount('seed',item.id)?'':'disabled'}>${lifeItemIconMarkup('seed',item.id,item.icon)} ${item.name} 씨앗 · ${lifeItemCount('seed',item.id)}개</button>`).join('');
  }else if(phase==='GROWING'){
    const remaining=Math.max(0,crop.growMs-(Date.now()-state.plantedAt));
    info.textContent=`${crop.name}이 자라는 중이에요. 약 ${Math.ceil(remaining/60000)}분 남았어요. 게임을 꺼도 자라요.`;
    actions.innerHTML='';
  }else{
    info.textContent=`${crop.name}을 수확할 수 있어요!`;
    actions.innerHTML=`<button type="button" data-life-action="harvest">${crop.name} 수확하기</button>`;
  }
}

function openFarmPlot(plot,options={}){
  if(!plot||lifeUi.open||(typeof isFishingActive==='function'&&isFishingActive())) return;
  toggleMenu(false);clearMovement();menuOpen=true;
  lifeUi.open=true;lifeUi.plotId=plot.id;
  renderLifePanel();
  const panel=document.getElementById('lifePanel');
  panel.classList.add('show');panel.setAttribute('aria-hidden','false');
  document.getElementById('lifeClose').focus();
  if(!options.fromHistory) pushGameOverlayHistory('farm-plot',plot.id);
}

function closeFarmPlot(options={}){
  if(!lifeUi.open) return;
  lifeUi.open=false;lifeUi.plotId=null;lifeUi.phase=null;menuOpen=false;
  const panel=document.getElementById('lifePanel');
  panel.classList.remove('show');panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory) leaveGameOverlayHistory('farm-plot');
}

function isFarmPlotOpen(){return lifeUi.open;}

function updateLifeContentUi(now){
  if(!lifeUi.open||now-lifeUi.lastRefresh<1000) return;
  if(lifeUi.phase!=='GROWING') return;
  lifeUi.lastRefresh=now;renderLifePanel();
}

if(typeof document!=='undefined'){
  document.getElementById('lifeClose').addEventListener('click',closeFarmPlot);
  document.getElementById('lifeExit').addEventListener('click',closeFarmPlot);
  document.getElementById('lifeActions').addEventListener('click',event=>{
    const button=event.target.closest('[data-life-action]');
    if(!button||button.disabled||!lifeUi.open) return;
    const plot=WORLD_DEFINITION.farmPlots.find(item=>item.id===lifeUi.plotId);
    if(!plot) return;
    if(button.dataset.lifeAction==='unlock') buyFarmPlot(plot);
    else if(button.dataset.lifeAction==='plant') plantFarmCrop(plot,button.dataset.cropId);
    else if(button.dataset.lifeAction==='harvest') harvestFarmCrop(plot);
  });
  document.getElementById('game').addEventListener('click',event=>{
    if(GAME_STATE.regionId!=='sunnyFields'||menuOpen||dialogOpen||isFishingActive()) return;
    const rect=event.currentTarget.getBoundingClientRect();
    const x=Math.floor((event.clientX-rect.left)*VIEW_W/rect.width+camX);
    const y=Math.floor((event.clientY-rect.top)*VIEW_H/rect.height+camY);
    const plot=farmPlotAt(Math.floor(x/TILE),Math.floor(y/TILE));
    if(plot&&Math.abs(player.x-plot.x)+Math.abs(player.y-plot.y)<=1) openFarmPlot(plot);
  });
}
