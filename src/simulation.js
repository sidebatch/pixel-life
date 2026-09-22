const playerSpawn=WORLD_DEFINITION.playerSpawn;
const player={
  x:playerSpawn.x,y:playerSpawn.y,
  px:playerSpawn.x*TILE+TILE/2,py:playerSpawn.y*TILE+TILE/2,
  fromX:0,fromY:0,toX:0,toY:0,t:0,moving:false,duration:MOVEMENT_CONFIG.playerStepDuration,face:playerSpawn.face||'down'
};
const inputs={up:false,down:false,left:false,right:false};
let lastDir='down', activeDir=null, dialogOpen=false, menuOpen=false, tNow=0;
let camX=0,camY=0;

const dirVec={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function npcAt(x,y,ignoreId=null){
  return npcs.find(n=>n.id!==ignoreId && n.x===x && n.y===y);
}
function isBlocked(x,y,ignoreNpcId=null){
  return !inside(x,y)||blocked.has(key(x,y))||!!npcAt(x,y,ignoreNpcId);
}
function preferredDir(){
  if(activeDir && inputs[activeDir]) return activeDir;
  for(const d of ['left','right','up','down']) if(inputs[d]) return d;
  return null;
}
function syncActiveDir(){
  activeDir = preferredDir();
}
function tryMove(d){
  if(!d||dialogOpen||menuOpen||player.moving) return;
  player.face=d;
  const [dx,dy]=dirVec[d], nx=player.x+dx,ny=player.y+dy;
  if(isBlocked(nx,ny)) return;
  player.fromX=player.px;player.fromY=player.py;
  player.toX=nx*TILE+TILE/2;player.toY=ny*TILE+TILE/2;
  player.x=nx;player.y=ny;player.t=0;player.moving=true;
}
function canNpcMove(n,nx,ny){
  if(!inside(nx,ny) || blocked.has(key(nx,ny))) return false;
  // Building Standard 1.0: NPC roaming must never occupy a door approach tile.
  if(buildings.some(b=>b.entrance.approach.x===nx && b.entrance.approach.y===ny)) return false;
  const playerDist=Math.abs(nx-player.x)+Math.abs(ny-player.y);
  if(playerDist<=1) return false; // do not crowd or trap the player
  if(npcAt(nx,ny,n.id)) return false;
  if(Math.abs(nx-n.homeX)+Math.abs(ny-n.homeY)>n.roam) return false;
  return true;
}
function chooseNpcDir(n){
  // Deterministic-ish roaming: changes over time but avoids frantic random jitter.
  const dirs=['up','right','down','left'];
  const start=(Math.floor(tNow/700)+n.stepSeed)%4;
  for(let i=0;i<4;i++){
    const d=dirs[(start+i)%4];
    const [dx,dy]=dirVec[d];
    if(canNpcMove(n,n.x+dx,n.y+dy)) return d;
  }
  return null;
}
function startNpcMove(n,d){
  if(!d||n.moving) return;
  const [dx,dy]=dirVec[d], nx=n.x+dx, ny=n.y+dy;
  if(!canNpcMove(n,nx,ny)) return;
  n.face=d;
  n.fromX=n.px; n.fromY=n.py;
  n.toX=nx*TILE+TILE/2; n.toY=ny*TILE+TILE/2;
  n.x=nx; n.y=ny; n.t=0; n.moving=true;
}
function updateNPCs(dt){
  // Keep everyone still while dialogue/menu is open so an NPC cannot walk away mid-conversation.
  if(dialogOpen||menuOpen) return;
  for(const n of npcs){
    if(n.moving){
      n.t+=dt;
      const p=Math.min(1,n.t/n.duration);
      const e=1-Math.pow(1-p,3);
      n.px=n.fromX+(n.toX-n.fromX)*e;
      n.py=n.fromY+(n.toY-n.fromY)*e;
      if(p>=1){
        n.px=n.toX; n.py=n.toY; n.moving=false;
        n.wait=900+((n.stepSeed*431 + Math.floor(tNow))%1700);
        n.stepSeed=(n.stepSeed+1)%97;
      }
    }else{
      n.wait-=dt;
      // NPCs near the player pause and look at them rather than walking through the interaction moment.
      const dist=Math.abs(player.x-n.x)+Math.abs(player.y-n.y);
      if(dist<=1){ n.wait=Math.max(n.wait,500); continue; }
      if(n.wait<=0){
        const d=chooseNpcDir(n);
        if(d) startNpcMove(n,d);
        else n.wait=900;
      }
    }
  }
}

function update(dt){
  updateNPCs(dt);
  if(player.moving){
    player.t+=dt;
    const p=Math.min(1,player.t/player.duration);
    // Keep player velocity consistent across tile boundaries. Resetting an
    // ease-out curve every tile makes held movement visibly hitch at each step.
    const e=p;
    player.px=player.fromX+(player.toX-player.fromX)*e;
    player.py=player.fromY+(player.toY-player.fromY)*e;
    if(p>=1){
      player.px=player.toX;player.py=player.toY;player.moving=false;
      const d=preferredDir(); if(d) tryMove(d);
    }
  }else{
    const d=preferredDir(); if(d) tryMove(d);
  }
  const targetX=player.px-VIEW_W/2, targetY=player.py-VIEW_H/2;
  const maxX=Math.max(0,WORLD_W-VIEW_W), maxY=Math.max(0,WORLD_H-VIEW_H);
  const tx=Math.max(0,Math.min(maxX,targetX)), ty=Math.max(0,Math.min(maxY,targetY));
  camX += (tx-camX)*Math.min(1,dt*.008);
  camY += (ty-camY)*Math.min(1,dt*.008);
}

function hash2(x,y){
  const n=Math.sin(x*12.9898+y*78.233)*43758.5453;
  return n-Math.floor(n);
}
function tileTypeAt(x,y){
  const k=key(x,y);
  if(bridgeSet.has(k)) return 'bridge';
  if(waterSet.has(k)) return 'water';
  if(stoneSet.has(k)) return 'stone';
  if(pathSet.has(k)) return 'path';
  return 'grass';
}
