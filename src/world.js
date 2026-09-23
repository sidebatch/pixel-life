const waterSet=new Set(), pathSet=new Set(), stoneSet=new Set(), bridgeSet=new Set(), blocked=new Set();
const key=(x,y)=>`${x},${y}`;
const inside=(x,y)=>x>=0&&y>=0&&x<MAP_W&&y<MAP_H;

function addSegmentToSet(segment,target){
  const dx=Math.sign(segment.x2-segment.x1), dy=Math.sign(segment.y2-segment.y1);
  if(dx!==0&&dy!==0) throw new Error(`Diagonal map segment is not supported: ${JSON.stringify(segment)}`);
  let x=segment.x1, y=segment.y1;
  while(true){
    if(inside(x,y)) target.add(key(x,y));
    if(x===segment.x2&&y===segment.y2) break;
    x+=dx;y+=dy;
  }
}

function addAreaToSet(area,target){
  for(let x=area.x;x<area.x+area.w;x++) for(let y=area.y;y<area.y+area.h;y++){
    const isCutCorner=area.cutCorners&&(
      (x===area.x||x===area.x+area.w-1)&&(y===area.y||y===area.y+area.h-1)
    );
    if(!isCutCorner&&inside(x,y)) target.add(key(x,y));
  }
}

// The outermost tile ring is always reserved as a hard world boundary.
for(let x=0;x<MAP_W;x++){ blocked.add(key(x,0));blocked.add(key(x,MAP_H-1)); }
for(let y=0;y<MAP_H;y++){ blocked.add(key(0,y));blocked.add(key(MAP_W-1,y)); }

WORLD_DEFINITION.paths.forEach(segment=>addSegmentToSet(segment,pathSet));
WORLD_DEFINITION.stoneAreas.forEach(area=>addAreaToSet(area,stoneSet));
WORLD_DEFINITION.waterAreas.forEach(area=>addAreaToSet(area,waterSet));
waterSet.forEach(tile=>blocked.add(tile));

WORLD_DEFINITION.bridges.forEach(segment=>addSegmentToSet(segment,bridgeSet));
bridgeSet.forEach(tile=>{ waterSet.delete(tile);blocked.delete(tile); });

const npcs=WORLD_DEFINITION.npcs.map(n=>({...n}));
npcs.forEach((n,i)=>{
  n.px=n.x*TILE+TILE/2;n.py=n.y*TILE+TILE/2;
  n.fromX=n.px;n.fromY=n.py;n.toX=n.px;n.toY=n.py;
  n.t=0;n.duration=MOVEMENT_CONFIG.npcStepDuration;n.stepSeed=i*7+3;
});

const sign={...WORLD_DEFINITION.fixedObjects.sign};
const bench={...WORLD_DEFINITION.fixedObjects.bench};
const lamp={...WORLD_DEFINITION.fixedObjects.lamp};
const marketStall={...WORLD_DEFINITION.fixedObjects.marketStall};
const rocks=WORLD_DEFINITION.fixedObjects.rocks.map(o=>({...o}));
const bushes=WORLD_DEFINITION.decorations.bushes.map(o=>({...o}));
const flowers=WORLD_DEFINITION.decorations.flowers.map(o=>({...o}));
const grassTufts=WORLD_DEFINITION.decorations.grassTufts.map(o=>({...o}));
const reeds=WORLD_DEFINITION.decorations.reeds.map(o=>({...o}));
const buildings=WORLD_DEFINITION.buildings.map(b=>({
  ...b,
  artAnchor:{...b.artAnchor},
  entrance:{...b.entrance,door:{...b.entrance.door},approach:{...b.entrance.approach}}
}));

for(const building of buildings){
  for(let x=building.x;x<building.x+building.w;x++){
    for(let y=building.y;y<building.y+building.h;y++) blocked.add(key(x,y));
  }
}

function buildingAtDoor(x,y){
  return buildings.find(b=>b.entrance.door.x===x&&b.entrance.door.y===y)||null;
}

function buildingForPlayerInteraction(){
  const target=facingTile();
  return buildings.find(building=>
    player.x===building.entrance.approach.x&&player.y===building.entrance.approach.y&&
    target.x===building.entrance.door.x&&target.y===building.entrance.door.y
  )||null;
}

blocked.add(key(sign.x,sign.y));
rocks.forEach(object=>blocked.add(key(object.x,object.y)));
blocked.add(key(bench.x,bench.y));
blocked.add(key(lamp.x,lamp.y));
for(let x=marketStall.x;x<marketStall.x+marketStall.w;x++){
  for(let y=marketStall.y;y<marketStall.y+marketStall.h;y++) blocked.add(key(x,y));
}

const trees=[];
const treeSet=new Set();
function addTree(x,y){
  const tile=key(x,y);
  if(!inside(x,y)||treeSet.has(tile)||blocked.has(tile)) return;
  trees.push({x,y});treeSet.add(tile);blocked.add(tile);
}

function isInGap(value,gaps=[]){
  return gaps.some(([from,to])=>value>=from&&value<=to);
}

for(const line of WORLD_DEFINITION.treeLines){
  for(let value=line.from;value<=line.to;value+=line.step){
    if(isInGap(value,line.gaps)) continue;
    if(line.axis==='x') addTree(value,line.fixed);
    else addTree(line.fixed,value);
  }
}
WORLD_DEFINITION.trees.forEach(tree=>addTree(tree.x,tree.y));
