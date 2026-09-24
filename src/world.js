const waterSet=new Set(),pathSet=new Set(),stoneSet=new Set(),bridgeSet=new Set(),blocked=new Set();
const key=(x,y)=>`${x},${y}`;
const inside=(x,y)=>x>=0&&y>=0&&x<MAP_W&&y<MAP_H;
const npcs=[],rocks=[],bushes=[],flowers=[],grassTufts=[],reeds=[],buildings=[],trees=[];
const sign={x:-100,y:-100},bench={x:-100,y:-100},lamp={x:-100,y:-100},marketStall={x:-100,y:-100,w:0,h:0};
const treeSet=new Set();

function addSegmentToSet(segment,target){
  const dx=Math.sign(segment.x2-segment.x1),dy=Math.sign(segment.y2-segment.y1);
  if(dx!==0&&dy!==0) throw new Error(`Diagonal map segment is not supported: ${JSON.stringify(segment)}`);
  let x=segment.x1,y=segment.y1;
  while(true){
    if(inside(x,y)) target.add(key(x,y));
    if(x===segment.x2&&y===segment.y2) break;
    x+=dx;y+=dy;
  }
}

function addAreaToSet(area,target){
  for(let x=area.x;x<area.x+area.w;x++) for(let y=area.y;y<area.y+area.h;y++){
    const cut=area.cutCorners&&
      (x===area.x||x===area.x+area.w-1)&&(y===area.y||y===area.y+area.h-1);
    if(!cut&&inside(x,y)) target.add(key(x,y));
  }
}

function addTree(x,y,options={}){
  const tile=key(x,y);
  if(!inside(x,y)||treeSet.has(tile)||blocked.has(tile)) return;
  trees.push({x,y,id:options.id||null,species:options.species||null,interactable:options.interactable===true});
  treeSet.add(tile);blocked.add(tile);
}

function isInGap(value,gaps=[]){return gaps.some(([from,to])=>value>=from&&value<=to);}

function buildWorldRegion(definition){
  if(definition.width!==MAP_W||definition.height!==MAP_H||definition.tileSize!==TILE){
    throw new Error(`Region ${definition.id} has incompatible world dimensions`);
  }
  WORLD_DEFINITION=definition;
  for(const set of [waterSet,pathSet,stoneSet,bridgeSet,blocked,treeSet]) set.clear();
  for(const items of [npcs,rocks,bushes,flowers,grassTufts,reeds,buildings,trees]) items.length=0;
  for(let x=0;x<MAP_W;x++){blocked.add(key(x,0));blocked.add(key(x,MAP_H-1));}
  for(let y=0;y<MAP_H;y++){blocked.add(key(0,y));blocked.add(key(MAP_W-1,y));}
  definition.paths.forEach(segment=>addSegmentToSet(segment,pathSet));
  definition.stoneAreas.forEach(area=>addAreaToSet(area,stoneSet));
  definition.waterAreas.forEach(area=>addAreaToSet(area,waterSet));
  waterSet.forEach(tile=>blocked.add(tile));
  definition.bridges.forEach(segment=>addSegmentToSet(segment,bridgeSet));
  bridgeSet.forEach(tile=>{waterSet.delete(tile);blocked.delete(tile);});

  definition.npcs.forEach((source,index)=>{
    const n={...source};
    n.px=n.x*TILE+TILE/2;n.py=n.y*TILE+TILE/2;
    n.fromX=n.px;n.fromY=n.py;n.toX=n.px;n.toY=n.py;
    n.t=0;n.duration=MOVEMENT_CONFIG.npcStepDuration;n.stepSeed=index*7+3;
    npcs.push(n);
  });
  const fixed=definition.fixedObjects||{};
  Object.assign(sign,{x:-100,y:-100},fixed.sign||{});
  Object.assign(bench,{x:-100,y:-100},fixed.bench||{});
  Object.assign(lamp,{x:-100,y:-100},fixed.lamp||{});
  Object.assign(marketStall,{x:-100,y:-100,w:0,h:0},fixed.marketStall||{});
  rocks.push(...(fixed.rocks||[]).map(o=>({...o})));
  const decoration=definition.decorations||{};
  bushes.push(...(decoration.bushes||[]).map(o=>({...o})));
  flowers.push(...(decoration.flowers||[]).map(o=>({...o})));
  grassTufts.push(...(decoration.grassTufts||[]).map(o=>({...o})));
  reeds.push(...(decoration.reeds||[]).map(o=>({...o})));
  buildings.push(...definition.buildings.map(b=>({
    ...b,artAnchor:{...b.artAnchor},
    entrance:{...b.entrance,door:{...b.entrance.door},approach:{...b.entrance.approach}}
  })));
  for(const building of buildings){
    for(let x=building.x;x<building.x+building.w;x++)
      for(let y=building.y;y<building.y+building.h;y++) blocked.add(key(x,y));
  }
  for(const object of [sign,bench,lamp,...rocks]) if(inside(object.x,object.y)) blocked.add(key(object.x,object.y));
  for(let x=marketStall.x;x<marketStall.x+marketStall.w;x++)
    for(let y=marketStall.y;y<marketStall.y+marketStall.h;y++) blocked.add(key(x,y));
  for(const line of definition.treeLines){
    for(let value=line.from;value<=line.to;value+=line.step){
      if(isInGap(value,line.gaps)) continue;
      if(line.axis==='x') addTree(value,line.fixed);
      else addTree(line.fixed,value);
    }
  }
  definition.trees.forEach(tree=>addTree(tree.x,tree.y,tree));
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

function regionExitAt(x,y){
  return (REGION_EXITS[GAME_STATE.regionId]||[]).find(exit=>exit.x===x&&exit.y===y)||null;
}

function enterWorldRegion(exit){
  if(!exit||!REGION_WORLDS[exit.to]) return false;
  clearMovement();
  GAME_STATE.regionId=exit.to;
  buildWorldRegion(REGION_WORLDS[exit.to]);
  const arrival=exit.entry||WORLD_DEFINITION.playerSpawn;
  player.x=arrival.x;player.y=arrival.y;player.face=arrival.face||'down';
  player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
  player.moving=false;player.t=0;
  camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
  camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
  updateWorldClockUI();
  saveGame();
  return true;
}

buildWorldRegion(REGION_WORLDS[GAME_STATE.regionId]||VILLAGE_WORLD_DEFINITION);
