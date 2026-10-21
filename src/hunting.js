// Wildlife combat is session state; it never rewrites money, items or life XP.
const huntingState={active:false,clock:0,hp:HUNTING_RULES.maxHp,hurtUntil:0,visited:false,effects:[],
  animals:HUNTING_SPAWNS.map((spawn,index)=>({...spawn,homeX:spawn.x,homeY:spawn.y,
    px:(spawn.x+.5)*TILE,py:(spawn.y+.5)*TILE,hp:WILDLIFE_TYPES[spawn.type].hp,
    face:'down',moving:false,t:0,mode:'idle',wait:900+index*113,step:index,
    lastHit:0,nextAttack:0,windup:null,attackRecovery:null,respawnAt:0,hitUntil:0}))};
function isInHuntingGround(){return GAME_STATE.regionId===HUNTING_RULES.regionId;}
function huntingAnimalAt(x,y,ignore=null){
  if(!isInHuntingGround())return null;
  return huntingState.animals.find(a=>a!==ignore&&a.hp>0&&
    ((a.x===x&&a.y===y)||(a.moving&&a.fromTileX===x&&a.fromTileY===y)))||null;
}
function resetHuntingAnimal(a){
  a.x=a.homeX;a.y=a.homeY;a.px=(a.x+.5)*TILE;a.py=(a.y+.5)*TILE;
  a.moving=false;a.t=0;a.mode='idle';a.windup=null;a.attackRecovery=null;a.wait=1200;
  a.hp=WILDLIFE_TYPES[a.type].hp;a.nextAttack=0;
  // A saved player may occupy a previously defeated animal's home on reload.
  if(isInHuntingGround()&&!huntingTileFree(a,a.x,a.y)){
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[2,0],[-2,0]]){
      if(!huntingTileFree(a,a.homeX+dx,a.homeY+dy))continue;
      a.x=a.homeX+dx;a.y=a.homeY+dy;a.px=(a.x+.5)*TILE;a.py=(a.y+.5)*TILE;break;
    }
  }
}
function onHuntingRegionChange(){
  // Aggression can never cross the village gate or survive a round trip.
  for(const a of huntingState.animals)if(a.hp>0)resetHuntingAnimal(a);
  huntingState.active=isInHuntingGround();huntingState.effects.length=0;
  if(huntingState.active&&!huntingState.visited){
    huntingState.visited=true;
    showLifeToast('야생동물은 먼저 공격하지 않아요. 검을 장착해 공격할 수 있어요.');
  }
  refreshHuntingHud();
}
function refreshHuntingHud(){
  const hud=document.getElementById('huntingHud');if(!hud)return;
  hud.hidden=!isInHuntingGround();
  const hp=Math.ceil(huntingState.hp),bar=document.getElementById('huntingHealth');
  if(bar){bar.value=hp;bar.setAttribute('aria-valuetext',`체력 ${hp} / ${HUNTING_RULES.maxHp}`);}
  document.getElementById('huntingHealthText').textContent=`${hp} / ${HUNTING_RULES.maxHp}`;
}
function huntingLineClear(x1,y1,x2,y2){
  const count=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)*8));
  let px=Math.floor(x1),py=Math.floor(y1);
  for(let i=1;i<=count;i++){
    const x=Math.floor(x1+(x2-x1)*i/count),y=Math.floor(y1+(y2-y1)*i/count);
    if(blocked.has(key(x,y)))return false;
    if(x!==px&&y!==py&&(blocked.has(key(px,y))||blocked.has(key(x,py))))return false;
    px=x;py=y;
  }
  return true;
}
function huntingTargetForSwing(){
  if(!isInHuntingGround())return null;
  const [dx,dy]=dirVec[player.face],x=player.px/TILE,y=player.py/TILE;
  return huntingState.animals.filter(a=>{
    if(a.hp<=0)return false;
    const ax=a.px/TILE-x,ay=a.py/TILE-y,forward=ax*dx+ay*dy,side=Math.abs(ax*dy-ay*dx);
    return forward>=.2&&forward<=1.65&&side<=.7&&Math.hypot(ax,ay)<=1.7&&
      huntingLineClear(x,y,a.px/TILE,a.py/TILE);
  }).sort((a,b)=>Math.hypot(a.px-player.px,a.py-player.py)-Math.hypot(b.px-player.px,b.py-player.py))[0]||null;
}
function huntingFeedback(x,y,text,color){
  huntingState.effects.push({x,y,text,color,at:huntingState.clock});
  if(huntingState.effects.length>16)huntingState.effects.shift();
}
function rollHuntingHit(random=Math.random){return random()<HUNTING_RULES.hitChance;}
function playHuntingSwing(tool='sword',animal=false){
  if(typeof playFishingAudio!=='function')return;
  playFishingAudio(context=>{
    const start=context.currentTime,heavy=animal?tool==='bear':['axe','sword'].includes(tool);
    scheduleGameSoundNoise(context,start,{duration:heavy?.18:.13,frequency:heavy?1050:1900,
      filter:'bandpass',q:.6,volume:animal?.045:.055,attack:.025,seed:heavy?37:71});
    scheduleGameSoundSweep(context,start+.01,{from:heavy?320:540,to:90,duration:.12,
      type:'sine',volume:.018,attack:.015});
  });
}
function playHuntingImpact(playerHit=false){
  if(typeof playFishingAudio!=='function')return;
  playFishingAudio(context=>{
    const start=context.currentTime;
    scheduleGameSoundNoise(context,start,{duration:.065,filter:'lowpass',frequency:playerHit?1400:2300,
      q:.7,volume:.09,attack:.002,seed:playerHit?19:43});
    scheduleGameSoundSweep(context,start,{from:playerHit?140:230,to:playerHit?55:85,
      duration:.14,type:'triangle',volume:.075,attack:.004});
  });
}
function strikeHuntingWildlife(chop){
  if(!isInHuntingGround()||chop.regionId!==GAME_STATE.regionId||document.hidden||menuOpen||dialogOpen)return false;
  // Legacy axe actions omit mode; preserve their existing shape/animation.
  const damage=HUNTING_RULES.toolDamage[chop.mode||'axe'];if(!damage)return false;
  const a=huntingTargetForSwing();if(!a||a.mode==='returning')return false;
  // Only a geometrically valid attack rolls once. A miss never provokes neutral wildlife.
  if(!rollHuntingHit()){huntingFeedback(a.px,a.py-40,'빗나감','#dbe7db');return false;}
  const now=huntingState.clock;
  a.hp=Math.max(0,a.hp-damage);a.lastHit=now;a.hitUntil=now+260;
  huntingFeedback(a.px,a.py-40,`−${damage}`,'#fff1b1');playHuntingImpact();
  if(a.hp===0){
    a.mode='down';a.moving=false;a.windup=null;a.attackRecovery=null;a.respawnAt=now+HUNTING_RULES.respawnMs;
    showLifeToast(`${WILDLIFE_TYPES[a.type].name}을 물리쳤어요.`);
  }else{
    // This is the ONLY path into aggression. Nearby animals do not join in.
    a.mode='aggro';a.wait=0;a.nextAttack=Math.max(a.nextAttack,now+HUNTING_RULES.windupMs);
  }
  return true;
}
function huntingTileFree(a,x,y){
  if(!inside(x,y)||blocked.has(key(x,y))||regionExitAt(x,y)||huntingAnimalAt(x,y,a))return false;
  if(player.x===x&&player.y===y)return false;
  if(player.moving&&Math.floor(player.fromX/TILE)===x&&Math.floor(player.fromY/TILE)===y)return false;
  // Leave the village arrival/exit as a safe, unobstructed area.
  if(Math.hypot(x-12,y-38)<4)return false;
  return Math.hypot(x-a.homeX,y-a.homeY)<=HUNTING_RULES.leash+2;
}
function huntingPathDirection(a,target){
  const start={x:a.x,y:a.y,first:null},queue=[start],seen=new Set([key(a.x,a.y)]);
  let best=start,bestDistance=Math.abs(a.x-target.x)+Math.abs(a.y-target.y);
  for(let i=0;i<queue.length&&i<650;i++){
    const point=queue[i],distance=Math.abs(point.x-target.x)+Math.abs(point.y-target.y);
    if(distance<bestDistance){best=point;bestDistance=distance;}
    if(distance===0||(a.mode==='aggro'&&distance===1))return point.first;
    for(const direction of ['up','right','down','left']){
      const [dx,dy]=dirVec[direction],x=point.x+dx,y=point.y+dy,k=key(x,y);
      if(seen.has(k)||!huntingTileFree(a,x,y))continue;
      seen.add(k);queue.push({x,y,first:point.first||direction});
    }
  }
  return best.first;
}
function startHuntingStep(a,direction){
  if(!direction)return false;
  const [dx,dy]=dirVec[direction],x=a.x+dx,y=a.y+dy;
  if(!huntingTileFree(a,x,y))return false;
  a.face=direction;a.fromTileX=a.x;a.fromTileY=a.y;a.fromX=a.px;a.fromY=a.py;
  a.x=x;a.y=y;a.toX=(x+.5)*TILE;a.toY=(y+.5)*TILE;a.t=0;a.moving=true;
  return true;
}
function hurtHuntingPlayer(a){
  const now=huntingState.clock;
  if(a.mode!=='aggro'||now<huntingState.hurtUntil)return false;
  if(!rollHuntingHit()){huntingFeedback(player.px,player.py-52,'회피','#dbe7db');return false;}
  const damage=WILDLIFE_TYPES[a.type].damage;
  huntingState.hp=Math.max(0,huntingState.hp-damage);huntingState.hurtUntil=now+HUNTING_RULES.invulnerableMs;
  huntingFeedback(player.px,player.py-52,`−${damage}`,'#ffc1ad');playHuntingImpact(true);
  if(huntingState.hp===0){
    lifeUi.chop=null;clearMovement();huntingState.hp=HUNTING_RULES.maxHp;
    const exit=REGION_EXITS[HUNTING_RULES.regionId][0];enterWorldRegion(exit);
    showDialog('마을 입구','기운을 잃어 마을로 돌아왔어요. 잠시 쉬며 체력을 회복했어요.');
  }
  refreshHuntingHud();return true;
}
function updateHunting(dt){
  if(huntingState.active!==isInHuntingGround())onHuntingRegionChange();
  if(document.hidden||menuOpen||dialogOpen||isFishingActive()||
    (typeof isSkillLevelUpVisible==='function'&&isSkillLevelUpVisible()))return;
  huntingState.clock+=dt;const now=huntingState.clock;
  if(!isInHuntingGround()){
    huntingState.hp=Math.min(HUNTING_RULES.maxHp,huntingState.hp+dt*.015);return;
  }
  for(const a of huntingState.animals){
    const type=WILDLIFE_TYPES[a.type];
    if(a.hp<=0){
      if(now>=a.respawnAt&&Math.hypot(player.x-a.homeX,player.y-a.homeY)>3&&!huntingAnimalAt(a.homeX,a.homeY,a))resetHuntingAnimal(a);
      continue;
    }
    if(a.mode==='aggro'&&(now-a.lastHit>HUNTING_RULES.forgetMs||
      Math.hypot(player.x-a.homeX,player.y-a.homeY)>HUNTING_RULES.leash)){
      a.mode='returning';a.windup=null;a.attackRecovery=null;a.wait=0;
    }
    if(a.moving){
      a.t+=dt;const p=Math.min(1,a.t/(type.stepMs*(a.mode==='idle'?1.7:1)));
      a.px=a.fromX+(a.toX-a.fromX)*p;a.py=a.fromY+(a.toY-a.fromY)*p;
      if(p>=1){a.moving=false;a.wait=a.mode==='idle'?1000+(a.step++%5)*210:80;}
      continue;
    }
    if(a.windup){
      if(!a.windup.sounded&&now-a.windup.at>=HUNTING_RULES.windupMs*HUNTING_ATTACK_MOTION.strikeStart){
        a.windup.sounded=true;playHuntingSwing(a.type,true);
      }
      if(now-a.windup.at>=HUNTING_RULES.windupMs){
        const aim=a.windup;a.windup=null;a.attackRecovery={...aim,at:now};
        a.nextAttack=now+HUNTING_RULES.attackCooldownMs;
        if(Math.hypot(player.px-aim.x,player.py-aim.y)<TILE*.7&&
          Math.hypot(player.px-a.px,player.py-a.py)<TILE*1.6&&
          huntingLineClear(a.px/TILE,a.py/TILE,player.px/TILE,player.py/TILE))hurtHuntingPlayer(a);
      }
      if(!isInHuntingGround())break;
      continue;
    }
    if(a.attackRecovery){
      if(now-a.attackRecovery.at<HUNTING_ATTACK_MOTION.recoverMs)continue;
      a.attackRecovery=null;
    }
    if(a.mode==='aggro'&&Math.hypot(player.px-a.px,player.py-a.py)<TILE*1.45&&
      huntingLineClear(a.px/TILE,a.py/TILE,player.px/TILE,player.py/TILE)){
      const dx=player.px-a.px,dy=player.py-a.py;
      a.face=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
      if(now>=a.nextAttack)a.windup={at:now,x:player.px,y:player.py,face:a.face};
      continue;
    }
    a.wait-=dt;if(a.wait>0)continue;
    if(a.mode==='returning'){
      if(a.x===a.homeX&&a.y===a.homeY){resetHuntingAnimal(a);continue;}
      startHuntingStep(a,huntingPathDirection(a,{x:a.homeX,y:a.homeY}));a.wait=150;
    }else if(a.mode==='aggro'){
      startHuntingStep(a,huntingPathDirection(a,player));a.wait=150;
    }else{
      const dirs=['up','left','down','right'];let moved=false;
      for(let i=0;i<4&&!moved;i++){
        const d=dirs[(a.step+i)%4],[dx,dy]=dirVec[d];
        if(Math.hypot(a.x+dx-a.homeX,a.y+dy-a.homeY)<=3)moved=startHuntingStep(a,d);
      }
      a.step++;a.wait=1400;
    }
  }
  huntingState.effects=huntingState.effects.filter(e=>now-e.at<750);refreshHuntingHud();
}
function addHuntingRenderables(renderables){
  const gate=WORLD_DEFINITION.huntingGate;
  if(gate)renderables.push({y:(gate.y+1)*TILE,draw:()=>{
    const x=(gate.x+.5)*TILE-camX,y=(gate.y+1)*TILE-camY;
    ctx.drawImage(imgs.huntingGate,x-144,y-230,288,230);
    ctx.save();ctx.font='bold 16px sans-serif';ctx.textAlign='center';
    ctx.lineWidth=5;ctx.strokeStyle='#203f30';ctx.strokeText(gate.label,x,y-234);
    ctx.fillStyle='#fff3cb';ctx.fillText(gate.label,x,y-234);ctx.restore();
  }});
  if(!isInHuntingGround())return;
  addHuntingTerrainRenderables(renderables);
  for(const a of huntingState.animals)if(a.hp>0&&onScreen(a.px,a.py,120,120))
    renderables.push({y:a.py+TILE/2,draw:()=>drawHuntingAnimal(a)});
}
function addHuntingTerrainRenderables(renderables){
  for(const r of WORLD_DEFINITION.terrain.ridges||[]){
    const columns=r.kind==='grove'?Math.ceil(r.w/4):r.kind==='spine'?Math.ceil(r.w/4):1;
    const rows=r.kind==='grove'?Math.ceil(r.h/3):1,cw=r.w/columns,ch=r.h/rows;
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const grove=r.kind==='grove',jitter=grove?Math.sin((r.x+col)*13+(r.y+row)*7)*10:0;
      const x=(r.x+col*cw)*TILE+jitter,y=(r.y+(row+1)*ch)*TILE;
      const w=cw*TILE+(grove?48:r.kind==='spine'?32:0);
      const h=grove?Math.max(ch*TILE+64,w*2/3):r.kind==='spine'?ch*TILE+32:r.kind==='log'?Math.max(ch*TILE+16,w*.375):w*.5;
      if(!onScreen(x+w/2,y-h/2,w,h))continue;
      const image=r.kind==='grove'?'huntingGrove':r.kind==='spine'?'huntingRockSpine':r.kind==='log'?'huntingFallenLog':'huntingCliff';
      renderables.push({y:y-8,draw:()=>{
        const left=x-(grove?24:r.kind==='spine'?16:0),foot=player.py+TILE/2;
        const behind=player.px>left+12&&player.px<left+w-12&&foot<y&&foot>y-h+24&&!blocked.has(key(player.x,player.y));
        ctx.save();if(behind&&(grove||r.kind==='spine'))ctx.globalAlpha=.6;
        ctx.drawImage(imgs[image],Math.round(left-camX),Math.round(y-h-camY),w,h);ctx.restore();
      }});
    }
    if(r.kind==='spine'){
      const x=r.x*TILE,y=(r.y+r.h)*TILE,w=r.w*TILE,h=Math.min(w*.5,140);
      if(onScreen(x+w/2,y-h/2,w,h))renderables.push({y:y-4,draw:()=>ctx.drawImage(imgs.huntingCliff,Math.round(x-camX),Math.round(y-h-camY),w,h)});
    }
  }
}
function getHuntingAttackVisual(a,now=huntingState.clock,reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true){
  const type=WILDLIFE_TYPES[a.type],motion=HUNTING_ATTACK_MOTION.species[a.type];
  const result={phase:'idle',image:type.image,face:a.face,offsetX:0,offsetY:0,lift:0,scaleX:1,scaleY:1};
  if(a.hp<=0||a.mode!=='aggro'||!motion)return result;
  const windup=a.windup,recovery=a.attackRecovery;
  let distance=0;
  if(windup){
    const p=Math.max(0,Math.min(1,(now-windup.at)/HUNTING_RULES.windupMs));
    result.face=windup.face||a.face;
    if(p<HUNTING_ATTACK_MOTION.strikeStart){
      result.phase='windup';const charge=Math.sin(p/HUNTING_ATTACK_MOTION.strikeStart*Math.PI/2);
      distance=-motion.recoil*charge;
      result.scaleX=1+motion.squash*charge;result.scaleY=1-motion.squash*charge;
    }else{
      result.phase='attack';result.image=motion.image;
      const pounce=(p-HUNTING_ATTACK_MOTION.strikeStart)/(1-HUNTING_ATTACK_MOTION.strikeStart),eased=1-Math.pow(1-pounce,3);
      distance=-motion.recoil+(motion.reach+motion.recoil)*eased;
      result.lift=Math.sin(pounce*Math.PI)*motion.lift;
    }
  }else if(recovery){
    const age=Math.max(0,now-recovery.at);if(age>=HUNTING_ATTACK_MOTION.recoverMs)return result;
    result.face=recovery.face||a.face;
    const p=Math.max(0,(age-HUNTING_ATTACK_MOTION.impactHoldMs)/(HUNTING_ATTACK_MOTION.recoverMs-HUNTING_ATTACK_MOTION.impactHoldMs));
    result.phase=age<=HUNTING_ATTACK_MOTION.impactHoldMs?'impact':'recover';
    result.image=age<150?motion.image:type.image;
    distance=motion.reach*(1-p*p*(3-2*p));
  }
  const [dx,dy]=dirVec[result.face];result.offsetX=dx*distance;result.offsetY=dy*distance;
  if(reduced){result.offsetX=0;result.offsetY=0;result.lift=0;result.scaleX=1;result.scaleY=1;}
  return result;
}
function drawHuntingAnimal(a){
  const type=WILDLIFE_TYPES[a.type],visual=getHuntingAttackVisual(a),frame={down:0,left:1,right:2,up:3}[visual.face],size=96*type.scale;
  const x=Math.round(a.px-camX),y=Math.round(a.py+TILE/2-camY),now=huntingState.clock;
  ctx.save();
  ctx.fillStyle='rgba(15,34,22,.22)';ctx.beginPath();ctx.ellipse(x,y-4,size*.29,7,0,0,Math.PI*2);ctx.fill();
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const bob=a.moving&&!reduced?Math.abs(Math.sin(a.t/75))*2:0;
  if(a.hitUntil>now)ctx.globalAlpha=.6;
  ctx.save();ctx.translate(x+visual.offsetX,y+visual.offsetY-visual.lift-bob);ctx.scale(visual.scaleX,visual.scaleY);
  ctx.drawImage(imgs[visual.image],(frame%2)*96,Math.floor(frame/2)*96,96,96,
    -size/2,-90*type.scale,size,size);ctx.restore();
  ctx.globalAlpha=1;
  if(a.mode==='aggro'||a.mode==='returning'||a.hp<type.hp){
    ctx.fillStyle='#17392f';ctx.fillRect(x-26,y-size-13,52,7);
    ctx.fillStyle=a.mode==='returning'?'#8cb693':'#e38b66';ctx.fillRect(x-25,y-size-12,50*a.hp/type.hp,5);
    ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#203b2a';
    ctx.strokeText(type.name,x,y-size-20);ctx.fillStyle='#fff7df';ctx.fillText(type.name,x,y-size-20);
  }
  if(a.mode==='aggro'){
    ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe299';ctx.fillText('!',x,y-size-37);
  }
  ctx.restore();
}
function drawHuntingGroundEffects(){
  if(!isInHuntingGround())return;
  const now=huntingState.clock;ctx.save();
  for(const a of huntingState.animals)if(a.windup){
    const aim=a.windup,p=Math.min(1,(now-aim.at)/HUNTING_RULES.windupMs);
    ctx.fillStyle=`rgba(211,91,61,${.14+p*.16})`;ctx.strokeStyle='#ffd18c';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(aim.x-camX,aim.y+10-camY,30,18,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  for(const e of huntingState.effects){
    const p=(now-e.at)/750;ctx.globalAlpha=1-p;ctx.textAlign='center';ctx.font='bold 20px sans-serif';
    ctx.lineWidth=4;ctx.strokeStyle='#27372d';ctx.strokeText(e.text,e.x-camX,e.y-camY-p*24);
    ctx.fillStyle=e.color;ctx.fillText(e.text,e.x-camX,e.y-camY-p*24);
  }
  ctx.restore();
}
