const TOOL_HOTBAR_ORDER=Object.freeze(['axe','rod','sickle','sword','none']);
const toolHotbar=document.getElementById('toolHotbar');
let toolHotbarSignature='';

function toolHotbarBusy(){
  return menuOpen||dialogOpen||isChoppingTree()||isFishingActive()||
    (typeof isVoyageBoarding==='function'&&isVoyageBoarding())||
    (typeof isFishRewardRevealOpen==='function'&&isFishRewardRevealOpen());
}

function toolHotbarItems(){
  const axe=getEquippedForestryAxe(),rod=getEquippedFishingRod(),sword=getEquippedSword();
  return [
    {kind:'axe',id:axe.id,label:'도끼',name:axe.name,url:CHARACTER_TOOL_URLS[axe.id],durability:getForestryAxeDurability(axe),broken:getForestryAxeDurability(axe)?.broken,
      owned:getOwnedForestryAxes().some(item=>item.id===axe.id)},
    {kind:'rod',id:rod.id,label:'낚시',name:rod.name,url:CHARACTER_TOOL_URLS[rod.id],durability:getFishingRodDurability(rod),broken:getFishingRodDurability(rod)?.broken,owned:isFishingRodUnlocked(rod)},
    {kind:'sickle',id:FARM_SICKLE.id,label:'낫',name:FARM_SICKLE.name,url:SICKLE_TOOL_URLS[FARM_SICKLE.id],owned:true},
    {kind:'sword',id:sword.id,label:'검',name:sword.name,url:SWORD_TOOL_URLS[sword.id],durability:getSwordDurability(sword),broken:getSwordDurability(sword)?.broken,owned:getOwnedSwords().some(item=>item.id===sword.id)},
    {kind:'none',id:'none',label:'빈손',name:'빈손',owned:true}
  ];
}

function refreshToolHotbar(){
  if(!toolHotbar)return;
  const items=toolHotbarItems(),busy=toolHotbarBusy(),active=GAME_STATE.appearance?.activeTool||'axe';
  // Large PNG URLs never enter the frame-by-frame cache key. Rebuild only when
  // a selected equipment ID, ownership or broken state changes, not on a tap.
  const signature=items.map(item=>`${item.kind}:${item.id}:${!!item.broken}:${item.owned}`).join('|');
  if(signature!==toolHotbarSignature){
    toolHotbarSignature=signature;
    toolHotbar.innerHTML=items.map((item,index)=>`<button type="button" class="toolHotbarSlot${item.broken?' broken':''}" data-quick-tool="${item.kind}" data-tool-id="${item.id}"
      aria-label="${item.name}${item.broken?' · 수리 필요':''}" aria-pressed="false" aria-keyshortcuts="${index+1}" title="${item.name} · ${index+1}번${item.broken?' · 수리 필요':''}">
      ${item.url?`<img src="${item.url}" alt="" draggable="false">`:`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ACTION_ICON_PATHS.hand}"/></svg>`}
      <kbd aria-hidden="true">${index+1}</kbd><span>${item.broken?'수리':item.label}</span>${equipmentDurabilityMarkup(item.durability)}</button>`).join('');
  }
  toolHotbar.classList.toggle('busy',busy);
  for(const item of items){
    const button=toolHotbar.querySelector(`[data-quick-tool="${item.kind}"]`),selected=active===item.kind,disabled=busy||!item.owned||!!item.broken;
    const bar=button.querySelector('.equipmentDurability'),durability=item.durability;
    if(bar&&bar.getAttribute('aria-valuenow')!==String(durability.current)){
      const percent=Math.round(durability.current/durability.max*100);
      bar.setAttribute('aria-valuenow',String(durability.current));
      bar.setAttribute('aria-valuetext',`${durability.current} / ${durability.max}`);
      bar.title=`내구도 ${durability.current} / ${durability.max}`;
      bar.classList.toggle('low',percent<=20);bar.classList.toggle('worn',percent>20&&percent<=50);
      bar.firstElementChild.style.width=`${percent}%`;
    }
    if(button.disabled!==disabled)button.disabled=disabled;
    if(button.getAttribute('aria-pressed')!==String(selected)){
      button.setAttribute('aria-pressed',String(selected));button.classList.toggle('selected',selected);
    }
  }
}

function quickEquipTool(kind){
  if(toolHotbarBusy())return false;
  const item=toolHotbarItems().find(item=>item.kind===kind);
  if(!item||!item.owned||item.broken)return false;
  if(GAME_STATE.appearance?.activeTool===kind)return true;
  const success=kind==='axe'?equipForestryAxe(item.id):kind==='rod'?equipFishingRod(item.id):
    kind==='sword'?equipSword(item.id):selectHeldTool(kind);
  if(success){
    if(kind==='rod')playEquipRodSound();
    else if(kind!=='none')playEquipWeaponSound();
  }else showLifeToast('장착 상태를 저장하지 못했어요. 다시 시도해 주세요.');
  refreshContext();return success;
}

toolHotbar.addEventListener('click',event=>{
  const button=event.target.closest('[data-quick-tool]');if(!button||button.disabled)return;
  event.preventDefault();quickEquipTool(button.dataset.quickTool);
  if(event.detail)button.blur();
});
window.addEventListener('keydown',event=>{
  if(event.repeat||event.isComposing||event.shiftKey||event.altKey||event.ctrlKey||event.metaKey||event.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  const number=/^Digit([1-5])$/.exec(event.code)||/^([1-5])$/.exec(event.key);if(!number||toolHotbarBusy())return;
  event.preventDefault();quickEquipTool(TOOL_HOTBAR_ORDER[Number(number[1])-1]);
});
refreshToolHotbar();
