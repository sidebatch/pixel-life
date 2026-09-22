let last=performance.now();
function loop(now){
  tNow=now;const dt=Math.min(40,now-last);last=now;
  updateWorldTime(dt);updateWorldClockUI();
  update(dt);drawWorld();refreshContext();requestAnimationFrame(loop);
}
loadAll().then(()=>{
  requestAnimationFrame(loop);
}).catch(err=>{
  console.error(err);document.getElementById('dialogText').textContent='이미지 로딩 중 문제가 발생했습니다.';
  document.getElementById('dialog').classList.add('show');
});
