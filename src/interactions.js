function facingTile(){
  const [dx,dy]=dirVec[player.face];return {x:player.x+dx,y:player.y+dy};
}
function showDialog(speaker,text){
  dialogOpen=true;inputs.up=inputs.down=inputs.left=inputs.right=false;
  document.getElementById('speaker').textContent=speaker;
  document.getElementById('dialogText').textContent=text;
  document.getElementById('dialog').classList.add('show');
}
function closeDialog(){
  const wasFishingResult=typeof isFishingResult==='function'&&isFishingResult();
  if(typeof clearFishingRarityEffect==='function') clearFishingRarityEffect();
  if(wasFishingResult&&typeof cancelSkillXpFeedback==='function') cancelSkillXpFeedback();
  dialogOpen=false;
  const dialog=document.getElementById('dialog');
  dialog.classList.remove('show','fishingResult','firstDiscovery');
  delete dialog.dataset.rarity;
  if(wasFishingResult) finishFishingResult();
}
function resolveWorldInteraction(tile=facingTile()){
  const exit=regionExitAt(tile.x,tile.y);
  if(exit) return {kind:'exit',label:exit.label,target:exit};
  const npc=npcs.find(n=>n.x===tile.x&&n.y===tile.y);
  if(npc) return {kind:npc.id==='elli'?'market':'npc',label:npc.id==='elli'?'상점':'대화',target:npc};
  if(tile.x===sign.x&&tile.y===sign.y) return {kind:'sign',label:'표지판'};
  const tree=trees.find(item=>item.x===tile.x&&item.y===tile.y&&item.interactable);
  if(tree) return {kind:'tree',label:getTreeState(tree).hp?'벌목':'재생 중',target:tree};
  const plot=farmPlotAt(tile.x,tile.y);
  if(plot) return {kind:'farm',label:farmPlotActionLabel(plot),target:plot};
  if(waterSet.has(key(tile.x,tile.y))) return {kind:'fishing',label:'낚시'};
  const building=buildingForPlayerInteraction();
  if(building) return {kind:'building',label:'들어가기',target:building};
  return null;
}

function activateWorldInteraction(interaction){
  switch(interaction.kind){
    case 'exit':return enterWorldRegion(interaction.target);
    case 'market':return openMarket();
    case 'npc':return showDialog(interaction.target.name,interaction.target.dialog);
    case 'sign':return showDialog('표지판','↑ 오래된 숲 · → 햇살 농장 · 물가에서는 낚시할 수 있어요.');
    case 'tree':return hitResourceTree(interaction.target);
    case 'farm':return openFarmPlot(interaction.target);
    case 'fishing':return startFishing();
    case 'building':return showDialog(interaction.target.name,interaction.target.dialog);
  }
}
function interact(){
  if(menuOpen) return;
  if(dialogOpen){ closeDialog(); return; }
  if(typeof isFishingActive==='function'&&isFishingActive()) return handleFishingAction();
  const interaction=resolveWorldInteraction();
  if(interaction) return activateWorldInteraction(interaction);
  showDialog('SYSTEM','조사할 것이 없다.');
}
function pressB(){
  if(typeof isSkillLevelUpVisible==='function'&&isSkillLevelUpVisible()) dismissSkillLevelUp();
  else if(dialogOpen) closeDialog();
  else if(typeof isFishDexDetailOpen==='function'&&isFishDexDetailOpen()) closeFishDexDetail();
  else if(typeof isFishDexOpen==='function'&&isFishDexOpen()) closeFishDex();
  else if(typeof isFishingGearOpen==='function'&&isFishingGearOpen()) closeFishingGear();
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
  const layer=window.history.state?.pixelLifeOverlay;
  if(isSkillLevelUpVisible()) dismissSkillLevelUp({fromHistory:true});
  if(layer==='skill-level-up') return;
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
  if(layer==='fishing-gear'){
    if(!isFishingGearOpen()) openFishingGear({fromHistory:true});
    return;
  }
  if(isFishingGearOpen()) closeFishingGear({fromHistory:true});
  if(layer==='inventory'){
    if(!isInventoryOpen()) openInventory({fromHistory:true});
    return;
  }
  if(isInventoryOpen()) closeInventory({fromHistory:true});
  if(layer==='market'){
    if(!isMarketOpen()) openMarket({fromHistory:true});
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
  if(menuOpen) toggleMenu(false);
});

function toggleMenu(force){
  menuOpen = force===undefined ? !menuOpen : force;
  document.getElementById('menuPanel').classList.toggle('show',menuOpen);
  if(menuOpen){inputs.up=inputs.down=inputs.left=inputs.right=false;}
}

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

function pulseButton(id,fn){
  const b=document.getElementById(id);if(!b)return;
  b.addEventListener('pointerdown',e=>{e.preventDefault();fn();});
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
document.getElementById('dialogNext').addEventListener('click',closeDialog);
document.getElementById('dialog').addEventListener('pointerdown',e=>{
  if(e.target.id!=='dialogClose'&&!e.target.closest('#dialogNext')&&dialogOpen&&!e.currentTarget.classList.contains('fishingResult')) closeDialog();
});
document.getElementById('menuBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('settingsBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('closeMenu').addEventListener('click',()=>toggleMenu(false));
document.getElementById('coinCount').textContent=Number(GAME_STATE.progression.coins||0).toLocaleString();

function contextInfo(){
  if(typeof isFishingActive==='function'&&isFishingActive())
    return typeof getFishingContextText==='function'?getFishingContextText():'';
  return resolveWorldInteraction()?.label||'';
}
function refreshContext(){
  const chip=document.getElementById('contextChip');
  const text=contextInfo();chip.textContent=text;chip.classList.toggle('show',!!text);
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
}
const keyMap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
window.addEventListener('keydown',e=>{
  if(e.code==='F3'&&!e.repeat){e.preventDefault();toggleWorldDebug();return;}
  if(worldDebugEnabled&&e.code==='BracketLeft'&&!e.repeat){e.preventDefault();adjustWorldTimeDebug(-30);return;}
  if(worldDebugEnabled&&e.code==='BracketRight'&&!e.repeat){e.preventDefault();adjustWorldTimeDebug(30);return;}
  if(keyMap[e.code]){e.preventDefault();const d=keyMap[e.code];inputs[d]=true;activeDir=d;lastDir=d;if(!e.repeat) bufferPlayerDirection(d);}
  if((e.code==='Space'||e.code==='KeyZ')&&!e.repeat){e.preventDefault();interact();}
  if((e.code==='KeyX'||e.code==='Escape')&&!e.repeat){e.preventDefault();pressB();}
});
window.addEventListener('keyup',e=>{if(keyMap[e.code]){e.preventDefault();inputs[keyMap[e.code]]=false;if(activeDir===keyMap[e.code]) syncActiveDir();}});
window.addEventListener('blur',resetJoystick);
window.addEventListener('pagehide',resetJoystick);



window.addEventListener('error',e=>console.error('[Pixel Life runtime]',e.error||e.message));
window.addEventListener('unhandledrejection',e=>console.error('[Pixel Life promise]',e.reason));
