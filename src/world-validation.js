function validateWorldDefinition(){
  const errors=[];
  const warnings=[];
  const fail=(message)=>errors.push(message);
  const warn=(message)=>warnings.push(message);
  const coordinate=(label,point)=>{
    if(!Number.isInteger(point?.x)||!Number.isInteger(point?.y)) fail(`${label} must use integer tile coordinates`);
    else if(!inside(point.x,point.y)) fail(`${label} is outside the ${MAP_W}x${MAP_H} map`);
  };

  if(TILE!==48) warn(`Tile size is ${TILE}px; current art and movement standards expect 48px`);
  if(MAP_W<34||MAP_H<24) warn('World is smaller than the preserved prototype footprint');

  for(const [index,segment] of WORLD_DEFINITION.paths.entries()){
    coordinate(`path[${index}] start`,{x:segment.x1,y:segment.y1});
    coordinate(`path[${index}] end`,{x:segment.x2,y:segment.y2});
    if(segment.x1!==segment.x2&&segment.y1!==segment.y2) fail(`path[${index}] is diagonal`);
  }
  for(const [index,segment] of WORLD_DEFINITION.bridges.entries()){
    coordinate(`bridge[${index}] start`,{x:segment.x1,y:segment.y1});
    coordinate(`bridge[${index}] end`,{x:segment.x2,y:segment.y2});
    if(segment.x1!==segment.x2&&segment.y1!==segment.y2) fail(`bridge[${index}] is diagonal`);
  }

  const ids=new Map();
  const uniqueId=(type,item)=>{
    if(!item.id) return fail(`${type} is missing an id`);
    if(ids.has(item.id)) fail(`Duplicate id '${item.id}' used by ${ids.get(item.id)} and ${type}`);
    else ids.set(item.id,type);
  };

  const solidOccupancy=new Map();
  const occupy=(label,x,y)=>{
    coordinate(label,{x,y});
    const tile=key(x,y);
    if(solidOccupancy.has(tile)) fail(`${label} overlaps ${solidOccupancy.get(tile)} at ${tile}`);
    else solidOccupancy.set(tile,label);
    if(waterSet.has(tile)) fail(`${label} overlaps water at ${tile}`);
  };

  for(const building of buildings){
    uniqueId('building',building);
    if(!Number.isInteger(building.w)||!Number.isInteger(building.h)||building.w<1||building.h<1){
      fail(`Building '${building.id}' has an invalid footprint`);
      continue;
    }
    for(let x=building.x;x<building.x+building.w;x++){
      for(let y=building.y;y<building.y+building.h;y++) occupy(`building '${building.id}'`,x,y);
    }
    const {door,approach}=building.entrance;
    coordinate(`building '${building.id}' door`,door);
    coordinate(`building '${building.id}' approach`,approach);
    const doorInside=door.x>=building.x&&door.x<building.x+building.w&&door.y>=building.y&&door.y<building.y+building.h;
    if(!doorInside) fail(`Building '${building.id}' door is outside its footprint`);
    const approachInside=approach.x>=building.x&&approach.x<building.x+building.w&&approach.y>=building.y&&approach.y<building.y+building.h;
    if(approachInside) fail(`Building '${building.id}' approach must be outside its footprint`);
    if(Math.abs(door.x-approach.x)+Math.abs(door.y-approach.y)!==1) fail(`Building '${building.id}' door and approach are not adjacent`);
  }

  occupy('sign',sign.x,sign.y);
  occupy('bench',bench.x,bench.y);
  occupy('lamp',lamp.x,lamp.y);
  rocks.forEach((rock,index)=>occupy(`rock[${index}]`,rock.x,rock.y));

  const approachTiles=new Set(buildings.map(building=>key(building.entrance.approach.x,building.entrance.approach.y)));
  for(const building of buildings){
    const approach=building.entrance.approach;
    if(blocked.has(key(approach.x,approach.y))) fail(`Building '${building.id}' approach is blocked`);
  }

  const npcTiles=new Set();
  for(const npc of npcs){
    uniqueId('npc',npc);
    coordinate(`NPC '${npc.id}'`,npc);
    coordinate(`NPC '${npc.id}' home`,{x:npc.homeX,y:npc.homeY});
    const tile=key(npc.x,npc.y);
    if(blocked.has(tile)) fail(`NPC '${npc.id}' starts on a blocked tile ${tile}`);
    if(approachTiles.has(tile)) fail(`NPC '${npc.id}' starts on a building approach tile ${tile}`);
    if(npcTiles.has(tile)) fail(`Multiple NPCs start at ${tile}`);
    npcTiles.add(tile);
  }

  coordinate('player spawn',WORLD_DEFINITION.playerSpawn);
  if(blocked.has(key(WORLD_DEFINITION.playerSpawn.x,WORLD_DEFINITION.playerSpawn.y))) fail('Player spawn is blocked');
  if(npcTiles.has(key(WORLD_DEFINITION.playerSpawn.x,WORLD_DEFINITION.playerSpawn.y))) fail('Player spawn overlaps an NPC');

  coordinate('fishing spot',WORLD_DEFINITION.fishingSpot);
  if(!waterSet.has(key(WORLD_DEFINITION.fishingSpot.x,WORLD_DEFINITION.fishingSpot.y))) fail('Fishing spot must point to a water tile');

  for(const [group,items] of Object.entries(WORLD_DEFINITION.decorations)){
    items.forEach((item,index)=>{
      coordinate(`${group}[${index}]`,item);
      if(group!=='reeds'&&waterSet.has(key(item.x,item.y))) fail(`${group}[${index}] overlaps water`);
    });
  }

  const report={
    map:`${MAP_W}x${MAP_H}`,
    tileSize:TILE,
    pathTiles:pathSet.size,
    waterTiles:waterSet.size,
    blockedTiles:blocked.size,
    buildings:buildings.length,
    npcs:npcs.length,
    errors,
    warnings
  };
  if(errors.length) throw new Error(`World validation failed:\n- ${errors.join('\n- ')}`);
  if(warnings.length) console.warn('[World validation warnings]',warnings);
  console.info('[World validation]',report);
  return report;
}

const WORLD_VALIDATION_REPORT=validateWorldDefinition();
