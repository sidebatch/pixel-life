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
  const startupLoading=document.getElementById('startupLoading');
  if(startupLoading){startupLoading.classList.add('ready');setTimeout(()=>startupLoading.remove(),220);}
  if(CHARACTER_WALK_PREVIEW_ENABLED&&!CHARACTER_MASTER_PREVIEW_ENABLED){
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
    for(const [mode,text] of [['original','기존 동작'],['balanced','보정 동작'],['soft','흔들림 완화']]){
      const button=document.createElement('button');button.type='button';button.textContent=text;
      button.style.cssText='margin:6px 3px 0 0;min-height:44px;padding:7px 14px;border:1px solid #acd4bb;border-radius:8px;';
      button.addEventListener('click',()=>{setCharacterWalkPreview(mode);refresh();drawWorld();});
      buttons.push([mode,button]);panel.appendChild(button);
    }
    refresh();document.body.appendChild(panel);
  }
  if(CHARACTER_BODY_PREVIEW_ENABLED&&!CHARACTER_MASTER_PREVIEW_ENABLED){
    const panel=document.createElement('div');
    panel.dataset.characterPreviewPanel='true';
    panel.style.cssText='position:fixed;top:112px;left:8px;z-index:15;padding:8px;border-radius:12px;background:#102e2ee8;color:#fff;font:12px sans-serif;max-width:calc(100vw - 16px);';
    panel.setAttribute('aria-label','캐릭터 동작 비교');
    if(CHARACTER_WALK_PREVIEW_ENABLED&&!CHARACTER_MASTER_PREVIEW_ENABLED)panel.style.top='210px';
    const label=document.createElement('div');label.textContent='캐릭터 비교 · 시험 선택은 저장 안 됨';panel.appendChild(label);
    for(const [sex,text] of [['male','이안'],['female','리아']]){
      const button=document.createElement('button');button.type='button';button.textContent=text;
      button.style.cssText='margin:6px 3px 0 0;min-height:44px;padding:7px 14px;border:1px solid #acd4bb;border-radius:8px;background:#dbece0;color:#14322b;';
      button.addEventListener('click',()=>{setCharacterBodyPreview(sex);drawWorld();});panel.appendChild(button);
    }
    document.body.appendChild(panel);
  }
  if(CHARACTER_RIA_NECK_PREVIEW_ENABLED&&!CHARACTER_MASTER_PREVIEW_ENABLED){
    const panel=document.createElement('div');
    panel.dataset.characterPreviewPanel='true';
    panel.style.cssText='position:fixed;top:112px;left:8px;z-index:15;padding:8px;border-radius:12px;background:#102e2ee8;color:#fff;font:12px sans-serif;max-width:calc(100vw - 16px);';
    if(CHARACTER_WALK_PREVIEW_ENABLED&&!CHARACTER_MASTER_PREVIEW_ENABLED)panel.style.top='308px';
    else if(CHARACTER_BODY_PREVIEW_ENABLED)panel.style.top='210px';
    panel.setAttribute('aria-label','리아 목 위치 비교');
    const label=document.createElement('div');label.textContent='리아 목 위치 비교 · 시험 선택 저장 안 됨';panel.appendChild(label);
    const buttons=[];
    const refresh=()=>{for(const [mode,button] of buttons){
      const selected=characterRiaNeckPreview===mode;
      button.setAttribute('aria-pressed',String(selected));
      button.style.background=selected?'#dbece0':'#224644';button.style.color=selected?'#14322b':'#fff';
    }};
    for(const [mode,text] of [['original','현재'],['centered','목 중앙 보정']]){
      const button=document.createElement('button');button.type='button';button.textContent=text;
      button.style.cssText='margin:6px 3px 0 0;min-height:44px;padding:7px 14px;border:1px solid #acd4bb;border-radius:8px;';
      button.addEventListener('click',()=>{setCharacterRiaNeckPreview(mode);refresh();drawWorld();});
      buttons.push([mode,button]);panel.appendChild(button);
    }
    refresh();document.body.appendChild(panel);
  }
  if(CHARACTER_MASTER_PREVIEW_ENABLED){
    characterMasterOutfitPreview=getCharacterRenderAppearance().outfitId;
    const panel=document.createElement('div');panel.dataset.characterPreviewPanel='true';
    panel.style.cssText='position:fixed;top:112px;left:8px;z-index:15;padding:8px;border-radius:12px;background:#102e2ee8;color:#fff;font:12px sans-serif;max-width:calc(100vw - 16px);';
    panel.setAttribute('aria-label','캐릭터 제작 기준 시험');
    let expanded=false;
    const toggle=document.createElement('button');toggle.type='button';
    toggle.style.cssText='min-height:44px;padding:7px 12px;border:1px solid #acd4bb;border-radius:8px;background:#dbece0;color:#14322b;';
    const content=document.createElement('div');
    const updateExpanded=()=>{
      content.hidden=!expanded;toggle.textContent=expanded?'기준·걸음 비교 접기 ▲':'기준·걸음 비교 열기 ▼';
      toggle.setAttribute('aria-expanded',String(expanded));
    };
    toggle.addEventListener('click',()=>{expanded=!expanded;updateExpanded();});
    panel.appendChild(toggle);panel.appendChild(content);
    const title=document.createElement('div');title.textContent='4방향·목·옷깃 · 선택 저장 안 됨';content.appendChild(title);
    const rows=[
      [['male','이안'],['female','리아']],
      [['original','현재'],['candidate','새 기준']],
      [['balanced','현재 걸음'],['soft','흔들림 완화']],
      [['outfit.traveler','기본복'],['outfit.ember','불꽃'],['outfit.meadow','정원']]
    ];
    const buttons=[];
    const refresh=()=>{for(const [kind,id,button] of buttons){
      const selected=kind==='body'?characterBodyPreview===id:
        kind==='art'?characterMasterPreview===id:
        kind==='walk'?characterWalkPreview===id:characterMasterOutfitPreview===id;
      button.setAttribute('aria-pressed',String(selected));
      button.style.background=selected?'#dbece0':'#224644';button.style.color=selected?'#14322b':'#fff';
    }};
    for(let row=0;row<rows.length;row++){
      const line=document.createElement('div');
      for(const [id,label] of rows[row]){
        const button=document.createElement('button');button.type='button';button.textContent=label;
        button.style.cssText='margin:6px 3px 0 0;min-height:44px;padding:7px 12px;border:1px solid #acd4bb;border-radius:8px;';
        button.addEventListener('click',()=>{
          if(row===0)setCharacterBodyPreview(id);
          else if(row===1)setCharacterMasterPreview(id);
          else if(row===2)setCharacterWalkPreview(id);
          else setCharacterMasterOutfitPreview(id);
          refresh();drawWorld();
          expanded=false;updateExpanded();
        });
        buttons.push([['body','art','walk','outfit'][row],id,button]);line.appendChild(button);
      }
      content.appendChild(line);
    }
    const hint=document.createElement('div');hint.style.marginTop='6px';
    hint.textContent='방향은 이동으로, 도끼·낚싯대는 평소처럼 확인';content.appendChild(hint);
    refresh();updateExpanded();document.body.appendChild(panel);
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
  console.error(err);
  const startupLoading=document.getElementById('startupLoading');
  if(startupLoading){startupLoading.querySelector('b').textContent='게임을 준비하지 못했어요';startupLoading.querySelector('small').textContent='인터넷 연결을 확인한 뒤 앱을 완전히 닫고 다시 열어 주세요.';}
  document.getElementById('dialogText').textContent='이미지 로딩 중 문제가 발생했습니다.';
  document.getElementById('dialog').classList.add('show');
});
