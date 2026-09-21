const worldDebugParams=new URLSearchParams(window.location.search);
let worldDebugEnabled=worldDebugParams.has('debug');

if(worldDebugEnabled&&worldDebugParams.has('x')&&worldDebugParams.has('y')){
  const debugX=Number(worldDebugParams.get('x'));
  const debugY=Number(worldDebugParams.get('y'));
  if(Number.isInteger(debugX)&&Number.isInteger(debugY)&&inside(debugX,debugY)&&!blocked.has(key(debugX,debugY))){
    player.x=debugX;player.y=debugY;
    player.px=debugX*TILE+TILE/2;player.py=debugY*TILE+TILE/2;
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
  }
}

function toggleWorldDebug(force){
  worldDebugEnabled=force===undefined?!worldDebugEnabled:Boolean(force);
  return worldDebugEnabled;
}

function drawWorldDebug(){
  if(!worldDebugEnabled) return;
  const x0=Math.max(0,Math.floor(camX/TILE)-1), y0=Math.max(0,Math.floor(camY/TILE)-1);
  const x1=Math.min(MAP_W-1,Math.ceil((camX+VIEW_W)/TILE)+1), y1=Math.min(MAP_H-1,Math.ceil((camY+VIEW_H)/TILE)+1);

  ctx.save();
  ctx.font='10px monospace';
  ctx.textAlign='left';
  ctx.textBaseline='top';

  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const sx=Math.round(x*TILE-camX), sy=Math.round(y*TILE-camY);
    ctx.strokeStyle='rgba(255,255,255,.18)';
    ctx.lineWidth=1;ctx.strokeRect(sx,sy,TILE,TILE);
    if(blocked.has(key(x,y))){
      ctx.fillStyle='rgba(255,55,70,.18)';ctx.fillRect(sx,sy,TILE,TILE);
    }
  }

  for(const building of buildings){
    const door=building.entrance.door, approach=building.entrance.approach;
    ctx.fillStyle='rgba(70,160,255,.48)';ctx.fillRect(door.x*TILE-camX,door.y*TILE-camY,TILE,TILE);
    ctx.fillStyle='rgba(255,226,70,.48)';ctx.fillRect(approach.x*TILE-camX,approach.y*TILE-camY,TILE,TILE);
    ctx.strokeStyle='#ffef70';ctx.lineWidth=2;
    ctx.strokeRect(building.x*TILE-camX,building.y*TILE-camY,building.w*TILE,building.h*TILE);
  }

  for(const npc of npcs){
    ctx.strokeStyle='rgba(90,240,255,.6)';ctx.lineWidth=1;
    const radius=npc.roam*TILE;
    ctx.strokeRect(npc.homeX*TILE+TILE/2-radius-camX,npc.homeY*TILE+TILE/2-radius-camY,radius*2,radius*2);
  }

  ctx.fillStyle='rgba(4,18,22,.86)';
  roundedRectPath(ctx,10,78,222,58,8);ctx.fill();
  ctx.fillStyle='#dffcff';
  ctx.fillText(`DEBUG WORLD · F3`,20,88);
  ctx.fillText(`map ${MAP_W}x${MAP_H} · tile ${TILE}px`,20,104);
  ctx.fillText(`player ${player.x},${player.y} · blocked ${blocked.size}`,20,120);
  ctx.restore();
}
