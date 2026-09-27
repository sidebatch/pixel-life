let last=performance.now();
function refreshCharacterPreviewVisibility(){
  const hidden=(typeof isInventoryOpen==='function'&&isInventoryOpen())||
    (typeof isCharacterStyleOpen==='function'&&isCharacterStyleOpen());
  for(const panel of document.querySelectorAll('[data-character-preview-panel]'))panel.hidden=hidden;
}
function loop(now){
  tNow=now;const dt=Math.min(40,now-last);last=now;
  updateWorldTime(dt);updateWeather();updateWorldClockUI();
  update(dt);updateLifeContentUi(now);drawWorld();refreshContext();refreshCharacterPreviewVisibility();requestAnimationFrame(loop);
}
loadAll().then(()=>{
  if(CHARACTER_WALK_PREVIEW_ENABLED){
    const panel=document.createElement('div');
    panel.dataset.characterPreviewPanel='true';
    panel.style.cssText='position:fixed;top:112px;left:8px;z-index:15;padding:8px;border-radius:12px;background:#102e2ee8;color:#fff;font:12px sans-serif;max-width:calc(100vw - 16px);';
    panel.setAttribute('aria-label','아래 걷기 순서 비교');
    const label=document.createElement('div');label.textContent='걷기·도끼·의상 비교 · 시험 선택 저장 안 됨';panel.appendChild(label);
    const buttons=[];
    const refresh=()=>{for(const [mode,button] of buttons){
      const selected=characterWalkPreview===mode;
      button.setAttribute('aria-pressed',String(selected));
      button.style.background=selected?'#dbece0':'#224644';button.style.color=selected?'#14322b':'#fff';
    }};
    for(const [mode,text] of [['original','기존 동작'],['balanced','보정 동작']]){
      const button=document.createElement('button');button.type='button';button.textContent=text;
      button.style.cssText='margin:6px 3px 0 0;min-height:44px;padding:7px 14px;border:1px solid #acd4bb;border-radius:8px;';
      button.addEventListener('click',()=>{setCharacterWalkPreview(mode);refresh();drawWorld();});
      buttons.push([mode,button]);panel.appendChild(button);
    }
    refresh();document.body.appendChild(panel);
  }
  if(CHARACTER_BODY_PREVIEW_ENABLED){
    const panel=document.createElement('div');
    panel.dataset.characterPreviewPanel='true';
    panel.style.cssText='position:fixed;top:112px;left:8px;z-index:15;padding:8px;border-radius:12px;background:#102e2ee8;color:#fff;font:12px sans-serif;max-width:calc(100vw - 16px);';
    panel.setAttribute('aria-label','남녀 캐릭터 동작 비교');
    if(CHARACTER_WALK_PREVIEW_ENABLED)panel.style.top='210px';
    const label=document.createElement('div');label.textContent='체형 비교 · 성별 시험 선택은 저장 안 됨';panel.appendChild(label);
    for(const [sex,text] of [['male','남자'],['female','여자']]){
      const button=document.createElement('button');button.type='button';button.textContent=text;
      button.style.cssText='margin:6px 3px 0 0;min-height:44px;padding:7px 14px;border:1px solid #acd4bb;border-radius:8px;background:#dbece0;color:#14322b;';
      button.addEventListener('click',()=>{setCharacterBodyPreview(sex);drawWorld();});panel.appendChild(button);
    }
    document.body.appendChild(panel);
  }
  if(CHARACTER_TRIAL_ENABLED){
    setCharacterAppearancePreview(['outfitId','hairId','backpackId']);
    const panel=document.createElement('div');
    panel.style.cssText='position:fixed;top:82px;left:8px;z-index:15;padding:8px;border-radius:12px;background:#102e2ee8;color:#fff;font:12px sans-serif;max-width:calc(100vw - 16px);';
    panel.setAttribute('aria-label','시험용 외형 비교');
    const label=document.createElement('div');label.textContent='외형 테스트 · 시험 외형만 저장 안 됨';
    panel.appendChild(label);
    for(const [text,parts] of [['기본',null],['옷',['outfitId']],['머리',['hairId']],['가방',['backpackId']],
      ['전체',['outfitId','hairId','backpackId']]]){
      const button=document.createElement('button');button.textContent=text;
      button.style.cssText='margin:6px 3px 0 0;padding:7px 10px;border:1px solid #acd4bb;border-radius:8px;background:#dbece0;color:#14322b;';
      button.addEventListener('click',()=>setCharacterAppearancePreview(parts));panel.appendChild(button);
    }
    document.body.appendChild(panel);
  }
  requestAnimationFrame(loop);
}).catch(err=>{
  console.error(err);document.getElementById('dialogText').textContent='이미지 로딩 중 문제가 발생했습니다.';
  document.getElementById('dialog').classList.add('show');
});
