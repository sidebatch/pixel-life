function facingTile(){
  const [dx,dy]=dirVec[player.face];return {x:player.x+dx,y:player.y+dy};
}
function showDialog(speaker,text){
  dialogOpen=true;inputs.up=inputs.down=inputs.left=inputs.right=false;
  document.getElementById('speaker').textContent=speaker;
  document.getElementById('dialogText').textContent=text;
  document.getElementById('dialog').classList.add('show');
}
function closeDialog(){ dialogOpen=false;document.getElementById('dialog').classList.remove('show'); }
function interact(){
  if(menuOpen) return;
  if(dialogOpen){ closeDialog(); return; }
  const t=facingTile(), k=key(t.x,t.y);
  const targetNpc=npcs.find(n=>n.x===t.x&&n.y===t.y);
  if(targetNpc) return showDialog(targetNpc.name,targetNpc.dialog);
  if(t.x===sign.x&&t.y===sign.y) return showDialog('표지판','→ 연못   ← 마을 광장   ↑ 오래된 숲');
  if(waterSet.has(k)) return showDialog('물가','잔잔한 물결이 보인다. 🎣 이 지점은 첫 Activity Module인 낚시의 진입점으로 사용된다.');
  const targetBuilding=buildingForPlayerInteraction();
  if(targetBuilding) return showDialog(targetBuilding.name,targetBuilding.dialog);
  showDialog('SYSTEM','조사할 것이 없다.');
}
function pressB(){ if(dialogOpen) closeDialog(); else if(menuOpen) toggleMenu(false); }

function toggleMenu(force){
  menuOpen = force===undefined ? !menuOpen : force;
  document.getElementById('menuPanel').classList.toggle('show',menuOpen);
  if(menuOpen){inputs.up=inputs.down=inputs.left=inputs.right=false;}
}

function clearMovement(){for(const k of Object.keys(inputs)) inputs[k]=false; activeDir=null;}
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
document.getElementById('dialogClose').addEventListener('click',closeDialog);
document.getElementById('dialog').addEventListener('pointerdown',e=>{if(e.target.id!=='dialogClose'&&dialogOpen) closeDialog();});
document.getElementById('bagBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('topBagBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('menuBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('settingsBtn').addEventListener('click',()=>toggleMenu());
document.getElementById('closeMenu').addEventListener('click',()=>toggleMenu(false));
document.getElementById('coinCount').textContent=Number(GAME_STATE.progression.coins||0).toLocaleString();

function contextInfo(){
  const t=facingTile(),k=key(t.x,t.y);
  if(npcs.some(n=>n.x===t.x&&n.y===t.y)) return '대화';
  if(t.x===sign.x&&t.y===sign.y) return '표지판';
  if(waterSet.has(k)) return '낚시';
  if(buildingForPlayerInteraction()) return '들어가기';
  return '';
}
function refreshContext(){
  const chip=document.getElementById('contextChip');
  const text=contextInfo();chip.textContent=text||'조사';chip.classList.toggle('show',!!text);
}
const keyMap={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
window.addEventListener('keydown',e=>{
  if(e.code==='F3'&&!e.repeat){e.preventDefault();toggleWorldDebug();return;}
  if(keyMap[e.code]){e.preventDefault();inputs[keyMap[e.code]]=true;activeDir=keyMap[e.code];lastDir=keyMap[e.code];}
  if((e.code==='Space'||e.code==='KeyZ')&&!e.repeat){e.preventDefault();interact();}
  if((e.code==='KeyX'||e.code==='Escape')&&!e.repeat){e.preventDefault();pressB();}
});
window.addEventListener('keyup',e=>{if(keyMap[e.code]){e.preventDefault();inputs[keyMap[e.code]]=false;if(activeDir===keyMap[e.code]) syncActiveDir();}});
window.addEventListener('blur',resetJoystick);
window.addEventListener('pagehide',resetJoystick);



window.addEventListener('error',e=>console.error('[Pixel Life runtime]',e.error||e.message));
window.addEventListener('unhandledrejection',e=>console.error('[Pixel Life promise]',e.reason));
