// New roster art stays separate from the existing five-species combat rules.
let dungeonWelcomeShown=false;
function onDungeonRegionChange(){
  if(GAME_STATE.regionId==='dungeonCrossroads'&&!dungeonWelcomeShown){
    dungeonWelcomeShown=true;showLifeToast('앞쪽은 들녘 숲이에요. 북쪽 길을 따라 다음 지역으로 가 보세요.');
  }
}
function drawDungeonTerrain(){
  const terrain=WORLD_DEFINITION.terrain;if(!terrain?.dungeonWalls)return;
  const x0=Math.max(0,Math.floor(camX/TILE)),x1=Math.min(MAP_W-1,Math.ceil((camX+VIEW_W)/TILE));
  const y0=Math.max(0,Math.floor(camY/TILE)),y1=Math.min(MAP_H-1,Math.ceil((camY+VIEW_H)/TILE));
  // Paint only structural walls. Monster and door anchors never become wall art.
  const wallAt=(x,y)=>x===0||y===0||x===MAP_W-1||y===MAP_H-1||
    terrain.ridges.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
  ctx.save();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(wallAt(x,y)){
    const px=Math.round(x*TILE-camX),py=Math.round(y*TILE-camY),n=hash2(x,y);
    ctx.fillStyle=terrain.patchA;ctx.fillRect(px,py,TILE,TILE);
    const edge=!wallAt(x-1,y)||!wallAt(x+1,y)||!wallAt(x,y-1)||!wallAt(x,y+1);
    if(!edge){
      if(n>.78){ctx.fillStyle='rgba(0,0,0,.07)';ctx.fillRect(px+6,py+9,31,19);}
      continue;
    }
    ctx.fillStyle=n>.5?terrain.ground:terrain.pathRim;
    const chip=6+Math.floor(n*7);
    ctx.beginPath();ctx.moveTo(px+chip,py+2);ctx.lineTo(px+TILE-8,py+2);ctx.lineTo(px+TILE-2,py+9);
    ctx.lineTo(px+TILE-2,py+TILE-10);ctx.lineTo(px+TILE-10,py+TILE-3);ctx.lineTo(px+7,py+TILE-3);
    ctx.lineTo(px+2,py+TILE-12);ctx.lineTo(px+2,py+10);ctx.closePath();ctx.fill();
    ctx.fillStyle=terrain.patchB;ctx.globalAlpha=.18;ctx.fillRect(px+6,py+4,28,3);ctx.globalAlpha=1;
    if(!wallAt(x,y+1)){
      ctx.fillStyle=terrain.patchA;ctx.fillRect(px,py+TILE-13,TILE,13);
      ctx.fillStyle='rgba(8,15,20,.24)';ctx.fillRect(px,py+TILE-5,TILE,5);
      ctx.fillStyle=terrain.patchB;ctx.globalAlpha=.3;ctx.fillRect(px+2,py+TILE-15,TILE-4,3);ctx.globalAlpha=1;
    }
    if(n>.65){ctx.fillStyle=terrain.patchA;ctx.fillRect(px+15,py+12,2,8);ctx.fillRect(px+17,py+18,7,2);}
  }
  ctx.restore();
}
function getDungeonBossAuraState(monster,time=0,reduced=false){
  if(!monster.boss)return null;
  return {color:DUNGEON_BOSS_AURA_COLORS[monster.id]||'#e6b96b',phase:reduced?0:((time%3600)+3600)%3600/3600,
    strength:reduced?.8:.8+Math.sin(time/850)*.16};
}
function drawDungeonBossAura(aura,x,y,size){
  // One visible boss uses one gradient and a handful of pixel motes. No blur filters.
  const radius=size*.65,glow=ctx.createRadialGradient(x,y-size*.4,8,x,y-size*.4,radius);
  glow.addColorStop(0,aura.color+'38');glow.addColorStop(.6,aura.color+'19');glow.addColorStop(1,aura.color+'00');
  ctx.save();ctx.globalAlpha=aura.strength;ctx.fillStyle=glow;
  ctx.fillRect(x-radius,y-size*.4-radius,radius*2,radius*2);
  ctx.strokeStyle=aura.color;ctx.lineWidth=2;ctx.globalAlpha=.65*aura.strength;
  for(const inset of [0,6]){ctx.beginPath();ctx.ellipse(x,y-3,size*.39-inset,size*.105-inset*.35,0,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle=aura.color;
  for(let i=0;i<7;i++){
    const p=(aura.phase+i/7)%1,px=Math.round(x+Math.sin(i*2.4+aura.phase)*size*.36),py=Math.round(y-p*size*.92);
    ctx.globalAlpha=Math.sin(p*Math.PI)*.72;ctx.fillRect(px,py,3,3);
    if(i%3===0){ctx.globalAlpha*=.5;ctx.fillRect(px-2,py+1,7,1);}
  }
  ctx.restore();
}
function drawDungeonBossCrown(x,y){
  const pattern=['100010001','110111011','111111111','011111110','011111110'];
  const left=Math.round(x-9),top=Math.round(y-5);
  ctx.fillStyle='#26362e';
  pattern.forEach((row,iy)=>{for(let ix=0;ix<row.length;ix++)if(row[ix]==='1')ctx.fillRect(left+ix*2-1,top+iy*2-1,4,4);});
  pattern.forEach((row,iy)=>{ctx.fillStyle=iy<2?'#fff0ae':'#e7bd67';for(let ix=0;ix<row.length;ix++)if(row[ix]==='1')ctx.fillRect(left+ix*2,top+iy*2,2,2);});
}
function drawDungeonStairs(){
  // Walkable stair treads belong to the floor, never the occluding object queue.
  for(const door of WORLD_DEFINITION.dungeonDoors||[]){
    if(!door.southExit)continue;
    const wx=(door.x+.5)*TILE,wy=(door.y+1)*TILE;
    if(!onScreen(wx,wy,192,260))continue;
    const x=Math.round(wx-camX),y=Math.round(wy-camY);
    ctx.drawImage(imgs[door.image],x-96,y-112,192,160);
    drawDungeonLabel(door.label,x,y-126,false);
  }
}
function getDungeonStairVisual(actor=player){
  const feet=actor.py+20;
  for(const door of WORLD_DEFINITION.dungeonDoors||[]){
    if(!door.southExit||Math.abs(actor.px-(door.x+.5)*TILE)>TILE*.85)continue;
    const edge=(door.y+1)*TILE;
    if(feet<edge-96||feet>edge+12)continue;
    const progress=Math.max(0,Math.min(1,(feet-(edge-96))/96));
    // Move the complete shared rig down into the stairwell without resizing it.
    return {progress,drop:progress*18};
  }
  return null;
}
function addDungeonRenderables(renderables){
  for(const door of WORLD_DEFINITION.dungeonDoors||[]){
    if(door.southExit)continue;
    const wx=(door.x+.5)*TILE,wy=(door.y+1)*TILE;
    if(!onScreen(wx,wy,180,250))continue;
    renderables.push({y:wy,draw:()=>{
      const x=Math.round(wx-camX),y=Math.round(wy-camY);
      ctx.drawImage(imgs[door.image],x-144,y-230,288,230);
      drawDungeonLabel(door.order?`${door.order}. ${door.label}`:door.label,x,y+24,false);
    }});
  }
  for(const monster of WORLD_DEFINITION.dungeonMonsters||[]){
    if(monster.combat)continue;
    const wx=(monster.x+.5)*TILE,wy=(monster.y+1)*TILE;
    if(!onScreen(wx,wy,190,220))continue;
    renderables.push({y:wy,draw:()=>{
      const x=Math.round(wx-camX),y=Math.round(wy-camY),size=monster.size;
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const breath=reduced?1:1+Math.sin(tNow/650+monster.x)*.012;
      const aura=getDungeonBossAuraState(monster,tNow,reduced);
      if(aura)drawDungeonBossAura(aura,x,y,size);
      ctx.save();ctx.fillStyle='rgba(10,20,23,.2)';ctx.beginPath();ctx.ellipse(x,y-3,size*.27,7,0,0,Math.PI*2);ctx.fill();
      if(monster.fourDirections)ctx.drawImage(imgs[monster.atlas],0,0,96,96,x-size/2,y-size*90/96,size,size);
      else ctx.drawImage(imgs[monster.atlas],monster.frame%3*128,Math.floor(monster.frame/3)*128,128,128,
        x-size/2,y-size*118/128*breath,size,size*breath);
      ctx.restore();drawDungeonLabel(monster.name,x,y-size-8,monster.boss);
    }});
  }
}
function drawDungeonLabel(text,x,y,boss){
  ctx.save();ctx.font=(boss?'bold 17px':'bold 15px')+' system-ui';ctx.textAlign='center';
  if(boss){const width=ctx.measureText(text).width;drawDungeonBossCrown(x-(width+24)/2+9,y-6);x+=12;}
  ctx.lineWidth=5;ctx.lineJoin='round';ctx.strokeStyle='#26362e';ctx.strokeText(text,x,y);
  ctx.fillStyle=boss?'#ffe3a2':'#fff5dc';ctx.fillText(text,x,y);ctx.restore();
}
