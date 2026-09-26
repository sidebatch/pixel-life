let last=performance.now();
function loop(now){
  tNow=now;const dt=Math.min(40,now-last);last=now;
  updateWorldTime(dt);updateWeather();updateWorldClockUI();
  update(dt);updateLifeContentUi(now);drawWorld();refreshContext();requestAnimationFrame(loop);
}
loadAll().then(()=>{
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
