// NPC service changes saved identity, not the fixed body/motion/weapon rig.
const CHARACTER_STYLE_CHOICES=Object.freeze({
  male:Object.freeze({bodyId:'body.starter',hairId:'hair.brown'}),
  female:Object.freeze({bodyId:'body.female',hairId:'hair.female.brown'})
});
const characterStyleState={open:false,selected:null,returnFocus:null};
function isCharacterStyleOpen(){return characterStyleState.open;}
function currentCharacterStyle(){return GAME_STATE.appearance.bodyId==='body.female'?'female':'male';}
function characterStyleNpcReady(){return GAME_STATE.regionId==='lilacVillage'&&resolveWorldInteraction()?.kind==='characterStyle';}
function renderCharacterStyle(){
  const current=currentCharacterStyle();
  for(const button of document.querySelectorAll('[data-character-style]')){
    const sex=button.dataset.characterStyle,choice=CHARACTER_STYLE_CHOICES[sex];
    const active=sex===characterStyleState.selected;
    button.setAttribute('aria-pressed',String(active));button.classList.toggle('selected',active);
    button.querySelector('[data-style-current]').textContent=sex===current?'현재 모습':'';
    const preview=button.querySelector('canvas').getContext('2d');
    preview.clearRect(0,0,120,110);preview.imageSmoothingEnabled=false;
    const body=CHARACTER_PARTS.body.get(choice.bodyId),hair=CHARACTER_PARTS.hair.get(choice.hairId);
    for(const image of [characterLayerImgs[body.walkBody],getCharacterOutfitImages(GAME_STATE.appearance.outfitId)?.walk,
      characterLayerImgs[body.walkHead],characterLayerImgs[hair.walkHair],characterLayerImgs[body.walkGrip]]){
      if(image)preview.drawImage(image,0,0,96,96,10,0,100,100);
    }
  }
  const same=characterStyleState.selected===current;
  const apply=document.getElementById('characterStyleApply');
  apply.disabled=same;apply.textContent=same?'현재 모습이에요':'변경하기 · 무료';
}
function openCharacterStyle(options={}){
  if(characterStyleState.open||menuOpen||dialogOpen||isChoppingTree()||isFishingActive()||!characterStyleNpcReady())return false;
  characterStyleState.open=true;characterStyleState.selected=currentCharacterStyle();
  characterStyleState.returnFocus=document.activeElement;
  menuOpen=true;clearMovement();resetJoystick();
  document.getElementById('characterStyleMessage').textContent='원하는 모습을 선택해 주세요.';
  renderCharacterStyle();
  const panel=document.getElementById('characterStylePanel');panel.classList.add('show');panel.setAttribute('aria-hidden','false');
  refreshCharacterPreviewVisibility();
  document.querySelector(`[data-character-style="${characterStyleState.selected}"]`).focus();
  if(!options.fromHistory)pushGameOverlayHistory('character-style');
  return true;
}
function closeCharacterStyle(options={}){
  if(!characterStyleState.open)return;
  characterStyleState.open=false;characterStyleState.selected=null;menuOpen=false;clearMovement();
  const panel=document.getElementById('characterStylePanel');panel.classList.remove('show');panel.setAttribute('aria-hidden','true');
  refreshCharacterPreviewVisibility();
  characterStyleState.returnFocus?.focus?.({preventScroll:true});characterStyleState.returnFocus=null;
  if(!options.fromHistory)leaveGameOverlayHistory('character-style');
}
function applyCharacterStyle(){
  const selected=characterStyleState.selected,choice=CHARACTER_STYLE_CHOICES[selected];
  if(!characterStyleState.open||!choice||!characterStyleNpcReady()||isFishingActive()||isChoppingTree()||selected===currentCharacterStyle())return false;
  const before=GAME_STATE.appearance;
  GAME_STATE.appearance={...before,...choice};
  if(!saveGame()){
    GAME_STATE.appearance=before;
    document.getElementById('characterStyleMessage').textContent='저장하지 못했어요. 기존 모습은 유지돼요. 다시 시도해 주세요.';
    return false;
  }
  // A render-only comparison must not hide the appearance just chosen at NPC.
  characterBodyPreview=null;
  closeCharacterStyle();drawWorld();
  return true;
}
document.querySelectorAll('[data-character-style]').forEach(button=>button.addEventListener('click',()=>{
  if(!characterStyleState.open)return;
  characterStyleState.selected=button.dataset.characterStyle;renderCharacterStyle();
  document.getElementById('characterStyleMessage').textContent='변경하기를 누르면 적용돼요. 비용은 없어요.';
}));
document.getElementById('characterStyleApply').addEventListener('click',applyCharacterStyle);
for(const id of ['characterStyleClose','characterStyleCancel'])document.getElementById(id).addEventListener('click',closeCharacterStyle);
// Open happens on action pointerdown. Its release must not become a backdrop
// click that immediately closes the newly opened modal on Android.
document.getElementById('characterStylePanel').addEventListener('pointerdown',event=>{
  if(event.target.id==='characterStylePanel'){event.preventDefault();closeCharacterStyle();}
});
document.getElementById('characterStylePanel').addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const buttons=[...event.currentTarget.querySelectorAll('button:not(:disabled)')];
  const first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
