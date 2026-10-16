function facingTile(){
  const [dx,dy]=dirVec[player.face];return {x:player.x+dx,y:player.y+dy};
}
function showDialog(speaker,text){
  dialogOpen=true;inputs.up=inputs.down=inputs.left=inputs.right=false;
  document.getElementById('speaker').textContent=speaker;
  document.getElementById('dialogText').textContent=text;
  document.getElementById('dialog').classList.add('show');
}
function closeDialog(options={}){
  const wasDiscovery=typeof isFishDiscoveryOpen==='function'&&isFishDiscoveryOpen();
  if(wasDiscovery&&!options.confirmDiscovery)return false;
  const wasFishingResult=typeof isFishingResult==='function'&&isFishingResult();
  if(typeof clearFishingRarityEffect==='function') clearFishingRarityEffect();
  if(wasDiscovery)hideFishDiscoveryReveal();
  dialogOpen=false;
  const dialog=document.getElementById('dialog');
  dialog.classList.remove('show','fishingResult','firstDiscovery');
  delete dialog.dataset.rarity;
  if(wasFishingResult) finishFishingResult();
  if(wasDiscovery){
    if(typeof updateFishRewardReveal==='function')updateFishRewardReveal();
    if(typeof flushPendingSkillXpFeedback==='function')flushPendingSkillXpFeedback();
  }
}
function resolveWorldInteraction(tile=facingTile()){
  const exit=regionExitAt(tile.x,tile.y);
  if(exit) return {kind:'exit',label:exit.label,target:exit};
  const npc=npcs.find(n=>n.x===tile.x&&n.y===tile.y);
  if(npc) return {kind:npc.id==='elli'?'market':npc.id==='jun'?'workshopMarket':npc.role==='farmMerchant'?'farmMarket':npc.role==='stylist'?'characterStyle':'npc',label:npc.role==='stylist'?'외형 변경':['elli','jun'].includes(npc.id)||npc.role==='farmMerchant'?'상점':'대화',target:npc};
  const harborFeature=harborFeatureAt(tile.x,tile.y);
  if(harborFeature) return harborFeature;
  if(tile.x===sign.x&&tile.y===sign.y) return {kind:'sign',label:'표지판'};
  const routePost=routeSigns.find(post=>post.x===tile.x&&post.y===tile.y);
  if(routePost)return {kind:'routeSign',label:'읽기',target:routePost};
  const tree=trees.find(item=>item.x===tile.x&&item.y===tile.y&&item.interactable);
  if(tree){
    const needed=FORESTRY_TREES[tree.species]?.tier||1;
    const chopStats=forestryTreeChopStats(FORESTRY_TREES[tree.species]);
    const name=FOREST_WOOD[tree.species];
    const label=GAME_STATE.appearance?.activeTool==='sword'?`${name} · 검 휘두르기`:
      GAME_STATE.appearance?.activeTool==='none'&&getForestryAxeDurability()?.broken?`${name} · 도끼 수리 필요`:
      (GAME_STATE.appearance?.activeTool||'axe')!=='axe'?`${name} · 도끼 장착 필요`:
      !getTreeState(tree).hp?`${name} · 재생 중`:
      !chopStats.unlocked?`${name} · ${FORESTRY_AXES[needed-1].name} 필요`:
      chopStats.penalized?`${name} · 벌목 · 위력 -${chopStats.penaltyPercent}%`:`${name} · 벌목`;
    return {kind:'tree',label,target:tree};
  }
  const plot=farmPlotAt(tile.x,tile.y);
  if(plot) return {kind:'farm',label:farmPlotActionLabel(plot),target:plot};
  if(waterSet.has(key(tile.x,tile.y))&&GAME_STATE.appearance?.activeTool==='rod') return {kind:'fishing',label:'낚시'};
  const building=buildingForPlayerInteraction();
  if(building) return {kind:building.serviceKey==='farmSupply'?'farmMarket':'building',label:building.interactionLabel||'들어가기',target:building};
  return null;
}

function activateWorldInteraction(interaction){
  switch(interaction.kind){
    case 'exit':return enterWorldRegion(interaction.target);
    case 'market':return openMarket();
    case 'workshopMarket':return openMarket({shop:'workshop'});
    case 'farmMarket':return openMarket({shop:'haru'});
    case 'characterStyle':return openCharacterStyle();
    case 'npc':return ['captain','voyageCaptain'].includes(interaction.target.role)?openHarbor():showDialog(interaction.target.name,interaction.target.dialog);
    case 'ticketBooth':return openHarbor();
    case 'sign':return showDialog('표지판','↑ 고대 숲 · ↓ 오래된 숲 · → 햇살 농장 · ← 바람결 해안 항구 · 낚싯대를 장착하고 물가에서 낚시할 수 있어요.');
    case 'routeSign':return showDialog('나무 팻말',interaction.target.arrow+' '+interaction.target.label);
    case 'tree':return GAME_STATE.appearance?.activeTool==='sword'?startSwordSwing():startTreeChop(interaction.target);
    case 'farm':return getFarmPlotPhase(interaction.target)==='READY'&&GAME_STATE.appearance?.activeTool==='sickle'?
      startFarmHarvest(interaction.target):openFarmPlot(interaction.target);
    case 'fishing':return startFishing();
    case 'building':return showDialog(interaction.target.name,interaction.target.dialog);
  }
}
function interact(){
  if(typeof isFishDiscoveryOpen==='function'&&isFishDiscoveryOpen())return;
  if(typeof isVoyageBoarding==='function'&&isVoyageBoarding())return;
  if(isChoppingTree()) return;
  if(menuOpen) return;
  if(dialogOpen){ closeDialog(); return; }
  if(typeof isFishingActive==='function'&&isFishingActive()) return handleFishingAction();
  const interaction=resolveWorldInteraction();
  if(interaction) return activateWorldInteraction(interaction);
  if((GAME_STATE.appearance?.activeTool||'axe')==='axe') return startAxeSwing();
  if(GAME_STATE.appearance?.activeTool==='sword') return startSwordSwing();
  showDialog('SYSTEM','조사할 것이 없다.');
}
function pressB(){
  if(typeof isFishDiscoveryOpen==='function'&&isFishDiscoveryOpen())return;
  if(typeof isFishRewardRevealOpen==='function'&&isFishRewardRevealOpen())return;
  if(typeof isTreeDiscoveryOpen==='function'&&isTreeDiscoveryOpen()) return;
  if(typeof isSkillLevelUpVisible==='function'&&isSkillLevelUpVisible()) dismissSkillLevelUp();
  else if(typeof isCharacterStyleOpen==='function'&&isCharacterStyleOpen()) closeCharacterStyle();
  else if(typeof isGrowthStatusOpen==='function'&&isGrowthStatusOpen()) closeGrowthStatus();
  else if(dialogOpen) closeDialog();
  else if(typeof isHarborOpen==='function'&&isHarborOpen())closeHarbor();
  else if(typeof isInventoryDetailOpen==='function'&&isInventoryDetailOpen()) closeInventoryDetail();
  else if(typeof isFishDexRewardsOpen==='function'&&isFishDexRewardsOpen()) closeFishDexRewards();
  else if(typeof isFishDexDetailOpen==='function'&&isFishDexDetailOpen()) closeFishDexDetail();
  else if(typeof isFishDexOpen==='function'&&isFishDexOpen()) closeFishDex();
  else if(typeof isTreeDexDetailOpen==='function'&&isTreeDexDetailOpen()) closeTreeDexDetail();
  else if(typeof isTreeDexOpen==='function'&&isTreeDexOpen()) closeTreeDex();
  else if(typeof isInventoryOpen==='function'&&isInventoryOpen()) closeInventory();
  else if(typeof isMarketOpen==='function'&&isMarketOpen()) closeMarket();
  else if(typeof isFarmPlotOpen==='function'&&isFarmPlotOpen()) closeFarmPlot();
  else if(menuOpen) toggleMenu(false);
  else if(typeof isFishingActive==='function'&&isFishingActive()) finishFishing();
}

function pushGameOverlayHistory(kind,fishId=null){
  try{window.history.pushState({...window.history.state,pixelLifeOverlay:kind,fishId},'');}
  catch(_){}
}

function leaveGameOverlayHistory(kind){
  if(window.history.state?.pixelLifeOverlay===kind) window.history.back();
}

// A reload starts with every overlay closed. Drop a stale entry so closing a
// newly opened panel cannot resurrect the overlay that existed before reload.
if(window.history.state?.pixelLifeOverlay){
  try{
    const {pixelLifeOverlay,fishId,...rest}=window.history.state;
    window.history.replaceState(rest,'');
  }catch(_){}
}

window.addEventListener('popstate',()=>{
  if(typeof isFishDiscoveryOpen==='function'&&isFishDiscoveryOpen())return;
  if(typeof isTreeDiscoveryOpen==='function'&&isTreeDiscoveryOpen())return;
  if(typeof isFishRewardRevealOpen==='function'&&isFishRewardRevealOpen()){pushGameOverlayHistory('fish-reward');return;}
  const layer=window.history.state?.pixelLifeOverlay;
  if(layer!=='growth-status'&&typeof isGrowthStatusOpen==='function'&&isGrowthStatusOpen())closeGrowthStatus({fromHistory:true});
  if(layer==='harbor'){openHarbor({fromHistory:true});return;}
  if(typeof isHarborOpen==='function'&&isHarborOpen())closeHarbor({fromHistory:true});
  if(isSkillLevelUpVisible()) dismissSkillLevelUp({fromHistory:true});
  if(layer==='skill-level-up') return;
  if(layer==='character-style'){
    if(!isCharacterStyleOpen())openCharacterStyle({fromHistory:true});
    return;
  }
  if(isCharacterStyleOpen())closeCharacterStyle({fromHistory:true});
  if(layer==='inventory-detail'){
    if(!isInventoryOpen())openInventory({fromHistory:true});
    const [type,id]=(window.history.state.fishId||'').split(':');
    inventoryState.tab=['outfit','backpack'].includes(type)?'appearance':'equipment';
    renderInventory();openInventoryDetail(type,id,{fromHistory:true});return;
  }
  if(isInventoryDetailOpen())closeInventoryDetail({fromHistory:true});
  if(layer==='fish-dex-rewards'){
    if(!isFishDexOpen())openFishDex({fromHistory:true});
    if(!isFishDexRewardsOpen())openFishDexRewards({fromHistory:true});
    return;
  }
  if(isFishDexRewardsOpen())closeFishDexRewards({fromHistory:true});
  if(layer==='fish-detail'){
    if(!isFishDexOpen()) openFishDex({fromHistory:true});
    if(!isFishDexDetailOpen()) openFishDexDetail(window.history.state.fishId,{fromHistory:true});
    return;
  }
  if(isFishDexDetailOpen()) closeFishDexDetail({fromHistory:true});
  if(layer==='fish-dex'){
    if(!isFishDexOpen()) openFishDex({fromHistory:true});
    return;
  }
  if(isFishDexOpen()) closeFishDex({fromHistory:true});
  if(layer==='tree-detail'){
    if(!isTreeDexOpen()) openTreeDex({fromHistory:true});
    if(!isTreeDexDetailOpen()) openTreeDexDetail(window.history.state.fishId,{fromHistory:true});
    return;
  }
  if(isTreeDexDetailOpen()) closeTreeDexDetail({fromHistory:true});
  if(layer==='tree-dex'){
    if(!isTreeDexOpen()) openTreeDex({fromHistory:true});
    return;
  }
  if(isTreeDexOpen()) closeTreeDex({fromHistory:true});
  if(layer==='inventory'){
    if(!isInventoryOpen()) openInventory({fromHistory:true});
    return;
  }
  if(isInventoryOpen()) closeInventory({fromHistory:true});
  if(layer==='market'){
    if(!isMarketOpen()) openMarket({fromHistory:true,shop:window.history.state?.fishId});
    return;
  }
  if(isMarketOpen()) closeMarket({fromHistory:true});
  if(layer==='farm-plot'){
    if(!isFarmPlotOpen()){
      const plot=WORLD_DEFINITION.farmPlots?.find(item=>item.id===window.history.state?.fishId);
      if(plot) openFarmPlot(plot,{fromHistory:true});
    }
    return;
  }
  if(isFarmPlotOpen()) closeFarmPlot({fromHistory:true});
  if(layer==='growth-status'){
    if(!isGrowthStatusOpen())openGrowthStatus({fromHistory:true});
    return;
  }
  if(menuOpen) toggleMenu(false);
});

function toggleMenu(force){
  menuOpen = force===undefined ? !menuOpen : force;
  const panel=document.getElementById('menuPanel');
  panel.classList.toggle('show',menuOpen);
  panel.setAttribute('aria-hidden',String(!menuOpen));
  if(menuOpen){inputs.up=inputs.down=inputs.left=inputs.right=false;}
}

document.getElementById('menuBagIcon').src=MENU_ICON_URLS.bag;
document.getElementById('menuFishDexIcon').src=MENU_ICON_URLS.fishDex;
document.getElementById('menuTreeDexIcon').src=FOREST_TREE_URLS.oak;

function clearMovement(){for(const k of Object.keys(inputs)) inputs[k]=false; activeDir=null;clearPlayerInputBuffer?.();}
const joystick=document.getElementById('joystick');
const stick=document.getElementById('stick');
let joyPointer=null;
function updateJoy(clientX,clientY){
  const r=joystick.getBoundingClientRect();
  const cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=clientX-cx,dy=clientY-cy;
  const max=r.width*.28,mag=Math.hypot(dx,dy)||1;
  if(mag>max){dx=dx/mag*max;dy=dy/mag*max;}
  stick.style.transform=`translate(${dx}px,${dy}px)`;
  clearMovement();
  const threshold=r.width*.10;
  if(Math.abs(dx)<threshold&&Math.abs(dy)<threshold) return;
  if(Math.abs(dx)>Math.abs(dy)){
    const d=dx<0?'left':'right';inputs[d]=true;activeDir=d;lastDir=d;
  }else{
    const d=dy<0?'up':'down';inputs[d]=true;activeDir=d;lastDir=d;
  }
}
function resetJoystick(){
  joyPointer=null;clearMovement();stick.style.transform='translate(0,0)';
}
function endJoy(e){
  if(joyPointer===null||!e||e.pointerId===joyPointer) resetJoystick();
}
// Pointer Events: primary path on modern browsers / Android Chrome.
joystick.addEventListener('pointerdown',e=>{
  e.preventDefault();joyPointer=e.pointerId;
  try{joystick.setPointerCapture?.(e.pointerId);}catch(_){}
  updateJoy(e.clientX,e.clientY);
});
joystick.addEventListener('pointermove',e=>{
  if(e.pointerId===joyPointer){e.preventDefault();updateJoy(e.clientX,e.clientY);}
});
joystick.addEventListener('pointerup',endJoy);
joystick.addEventListener('pointercancel',endJoy);
joystick.addEventListener('lostpointercapture',()=>resetJoystick());

// Touch Events fallback for embedded Android/WebView viewers with incomplete Pointer Events.
if(!window.PointerEvent){
  let touchId=null;
  const findTouch=(list)=>Array.from(list||[]).find(t=>touchId===null||t.identifier===touchId);
  joystick.addEventListener('touchstart',e=>{
    const t=e.changedTouches[0]; if(!t)return;
    e.preventDefault();touchId=t.identifier;updateJoy(t.clientX,t.clientY);
  },{passive:false});
  joystick.addEventListener('touchmove',e=>{
    const t=Array.from(e.touches).find(x=>x.identifier===touchId); if(!t)return;
    e.preventDefault();updateJoy(t.clientX,t.clientY);
  },{passive:false});
  const endTouch=e=>{
    if(Array.from(e.changedTouches||[]).some(x=>x.identifier===touchId)){
      e.preventDefault();touchId=null;resetJoystick();
    }
  };
  joystick.addEventListener('touchend',endTouch,{passive:false});
  joystick.addEventListener('touchcancel',endTouch,{passive:false});
}

// A press can open a panel under the finger before its synthetic click arrives.
// Consume that same press's click so it cannot activate the newly exposed panel.
let pendingControlClick=null;
window.addEventListener('pointerdown',()=>{pendingControlClick=null;},true);
window.addEventListener('click',event=>{
  const pending=pendingControlClick;pendingControlClick=null;
  if(!pending||event.detail===0||performance.now()-pending.at>700)return;
  if(Math.hypot(event.clientX-pending.x,event.clientY-pending.y)>12)return;
  event.preventDefault();event.stopImmediatePropagation();
},true);
function pulseButton(id,fn){
  const b=document.getElementById(id);if(!b)return;
  b.addEventListener('pointerdown',e=>{
    e.preventDefault();pendingControlClick={x:e.clientX,y:e.clientY,at:performance.now()};fn();
  });
}
pulseButton('btnA',interact);
const fishingCancelButton=document.getElementById('fishingCancelBtn');
fishingCancelButton?.addEventListener('click',e=>{
  // Finish on click (after pointerup). Hiding the button on pointerdown can
  // retarget the release to the bag/settings buttons underneath on mobile.
  e.preventDefault();e.stopPropagation();
  if(typeof isFishingActive==='function'&&isFishingActive()) finishFishing();
});
document.getElementById('dialogClose').addEventListener('click',closeDialog);
document.getElementById('dialogNext').addEventListener('click',()=>closeDialog({confirmDiscovery:true}));
document.getElementById('fishDiscoveryOverlay').addEventListener('keydown',event=>{
  if(event.key!=='Escape'&&event.key!=='Tab')return;
  event.preventDefault();event.stopPropagation();document.getElementById('dialogNext').focus();
});
document.getElementById('dialog').addEventListener('pointerdown',e=>{
  if(e.target.id!=='dialogClose'&&!e.target.closest('#dialogNext')&&dialogOpen&&!e.currentTarget.classList.contains('fishingResult')) closeDialog();
});
document.getElementById('menuBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('settingsBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('closeMenu').addEventListener('click',()=>toggleMenu(false));
document.getElementById('menuDismiss').addEventListener('click',()=>toggleMenu(false));
document.getElementById('coinCount').textContent=Number(GAME_STATE.progression.coins||0).toLocaleString();

const ACTION_ICON_PATHS=Object.freeze({
  hand:'M9 13V5a2 2 0 0 1 4 0v7m0-2h2a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v1c0 4-2 6-6 6h-1c-2 0-3-1-4-3l-3-5a2 2 0 0 1 3-2l1 1',
  chat:'M4 4h16v11H9l-5 5V4Z M8 8h8 M8 11h5',
  seed:'M12 21v-8 M12 16C5 16 3 10 3 7c6 0 9 3 9 9Z M12 13c0-6 3-9 9-9 0 6-3 9-9 9Z',
  basket:'M4 10h16l-2 10H6L4 10Z M8 10l4-7 4 7 M9 14v3 M15 14v3',
  read:'M5 3h11l3 3v15H5V3Z M8 9h8 M8 13h8 M8 17h5',
  move:'M4 12h16 M14 6l6 6-6 6',
  confirm:'M5 12l4 4L19 6'
});
function actionButtonPresentation(){
  const result=(icon,label='',aria=label||'상호작용')=>({icon,label,aria});
  if(typeof isFishingActive==='function'&&isFishingActive()){
    const label=(typeof getFishingContextText==='function'?getFishingContextText():'')||
      (typeof fishingState!=='undefined'&&fishingState.phase==='bite'?'낚기':'');
    return result('rod',label,label||'낚시');
  }
  if(dialogOpen)return result('confirm','확인');
  const interaction=resolveWorldInteraction();
  if(interaction){
    const {kind,label,target}=interaction;
    if(kind==='tree')return result(GAME_STATE.appearance?.activeTool==='sword'?'sword':'axe',label.split(' · ').slice(1).join(' · ')||label);
    if(kind==='farm'){
      const phase=getFarmPlotPhase(target);
      if(phase==='LOCKED')return result('basket','부지 구매');
      if(phase==='EMPTY')return result('seed','심기');
      if(phase==='GROWING')return result('seed','살펴보기');
      return result('sickle',GAME_STATE.appearance?.activeTool==='sickle'?'수확':'낫 장착 필요');
    }
    if(kind==='fishing')return result('rod','낚시');
    if(['market','workshopMarket','farmMarket','ticketBooth'].includes(kind))return result('basket',label);
    if(['npc','characterStyle','building'].includes(kind))return result('chat',label);
    if(['sign','routeSign'].includes(kind))return result('read','읽기');
    if(kind==='exit')return result('move',label);
  }
  const tool=GAME_STATE.appearance?.activeTool;
  const icon=['axe','sickle','rod','sword'].includes(tool)?tool:'hand';
  return result(icon,'',{axe:'도끼 사용',sickle:'낫 사용',rod:'낚싯대 사용',sword:'검 사용',hand:'상호작용'}[icon]);
}
function contextInfo(){return actionButtonPresentation().label;}
function actionButtonToolArt(icon){
  if(icon==='axe'){
    const key=getEquippedForestryAxe().id;return {key,url:CHARACTER_TOOL_URLS[key]};
  }
  if(icon==='rod'){
    const key=getEquippedFishingRod().id;return {key,url:CHARACTER_TOOL_URLS[key]};
  }
  if(icon==='sickle')return {key:FARM_SICKLE.id,url:SICKLE_TOOL_URLS[FARM_SICKLE.id]};
  if(icon==='sword'){
    const key=getEquippedSword().id;return {key,url:SWORD_TOOL_URLS[key]};
  }
  return null;
}
function refreshContext(){
  const chip=document.getElementById('contextChip');
  const action=actionButtonPresentation(),text=action.label;
  chip.textContent=text;chip.classList.toggle('show',!!text);
  const button=document.getElementById('btnA');
  const toolArt=actionButtonToolArt(action.icon),toolImage=button.querySelector('.actionToolIcon'),symbol=button.querySelector('.actionIcon');
  if(toolArt){
    if(toolImage.getAttribute('src')!==toolArt.url)toolImage.setAttribute('src',toolArt.url);
    toolImage.hidden=false;symbol.setAttribute('hidden','');button.dataset.actionTool=toolArt.key;
  }else{
    if(button.dataset.actionIcon!==action.icon)symbol.querySelector('path').setAttribute('d',ACTION_ICON_PATHS[action.icon]);
    toolImage.hidden=true;symbol.removeAttribute('hidden');delete button.dataset.actionTool;
  }
  button.dataset.actionIcon=action.icon;
  if(button.getAttribute('aria-label')!==action.aria)button.setAttribute('aria-label',action.aria);
  const cancel=document.getElementById('fishingCancelBtn');
  const fishingActive=typeof isFishingActive==='function'&&isFishingActive();
  const canCancel=fishingActive&&
    !(typeof isFishingResult==='function'&&isFishingResult());
  document.getElementById('actionCluster')?.classList.toggle('fishing',fishingActive);
  for(const id of ['settingsBtn','menuBtn']){
    const button=document.getElementById(id);
    if(!button) continue;
    button.disabled=fishingActive;
    button.classList.toggle('fishingDisabled',fishingActive);
  }
  if(cancel) cancel.hidden=!canCancel;
  cancel?.classList.toggle('show',canCancel);
  if(typeof refreshToolHotbar==='function')refreshToolHotbar();
}
const keyMap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
window.addEventListener('keydown',e=>{
  if(e.code==='F3'&&!e.repeat){e.preventDefault();toggleWorldDebug();return;}
  if(worldDebugEnabled&&e.code==='BracketLeft'&&!e.repeat){e.preventDefault();adjustWorldTimeDebug(-30);return;}
  if(worldDebugEnabled&&e.code==='BracketRight'&&!e.repeat){e.preventDefault();adjustWorldTimeDebug(30);return;}
  // Inventory buttons retain native Space/Enter activation and arrow scrolling.
  if(e.target?.closest?.('#toolHotbar,#growthStatusHud')&&['Space','Enter'].includes(e.code))return;
  if(e.target?.closest?.('#inventoryPanel,#inventoryDetailModal,#characterStylePanel,#growthStatusOverlay')&&!['KeyX','Escape'].includes(e.code))return;
  if(keyMap[e.code]){e.preventDefault();const d=keyMap[e.code];inputs[d]=true;activeDir=d;lastDir=d;if(!e.repeat) bufferPlayerDirection(d);}
  if((e.code==='Space'||e.code==='KeyZ')&&!e.repeat){e.preventDefault();interact();}
  if((e.code==='KeyX'||e.code==='Escape')&&!e.repeat){e.preventDefault();pressB();}
});
window.addEventListener('keyup',e=>{if(keyMap[e.code]){e.preventDefault();inputs[keyMap[e.code]]=false;if(activeDir===keyMap[e.code]) syncActiveDir();}});
window.addEventListener('blur',resetJoystick);
window.addEventListener('pagehide',resetJoystick);



window.addEventListener('error',e=>console.error('[Pixel Life runtime]',e.error||e.message));
window.addEventListener('unhandledrejection',e=>console.error('[Pixel Life promise]',e.reason));
