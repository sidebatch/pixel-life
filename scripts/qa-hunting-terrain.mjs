import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {forestWorldContext} from './lib/forest-world-qa.mjs';
import {decodePNG,alphaBounds} from './lib/png.mjs';
const context=forestWorldContext();
vm.runInContext(fs.readFileSync('src/data/hunting-data.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
run("GAME_STATE.regionId='wildwoodHunt';buildWorldRegion(REGION_WORLDS.wildwoodHunt)");
const data=JSON.parse(run('JSON.stringify({terrain:WORLD_DEFINITION.terrain,blocked:[...blocked],paths:[...pathSet],spawns:HUNTING_SPAWNS,exit:REGION_EXITS.wildwoodHunt[0]})'));
assert.equal(data.terrain.ridges.length,8);assert(!data.terrain.hills?.length);
const blocked=new Set(data.blocked),queue=[[12,37]],seen=new Set(['12,37']);
for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
  const [px,py]=queue[i],x=px+dx,y=py+dy,k=x+','+y;
  if(x<1||y<1||x>62||y>46||seen.has(k)||blocked.has(k))continue;
  seen.add(k);queue.push([x,y]);
}
assert(seen.has(data.exit.x+','+data.exit.y));assert(seen.has('46,12'),'Pond bank must remain reachable');
for(const a of data.spawns){
  assert(seen.has(a.x+','+a.y),'Wildlife home must be accessible: '+a.id);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])assert(seen.has((a.x+dx)+','+(a.y+dy)),'Melee approach blocked: '+a.id);
}
for(const tile of data.paths){assert(!blocked.has(tile),'Path crosses solid terrain: '+tile);assert(seen.has(tile),'Disconnected path: '+tile);}
for(const r of data.terrain.ridges)assert(blocked.has((r.x+Math.floor(r.w/2))+','+(r.y+1)),'A raised ledge must block movement');
run("GAME_STATE.regionId='lilacVillage';buildWorldRegion(REGION_WORLDS.lilacVillage)");
assert(run('!blocked.has(key(48,35))&&!blocked.has(key(48,36))&&!blocked.has(key(48,37))'));
assert(run('blocked.has(key(48,34))&&blocked.has(key(48,33))'),'Cave roof must be solid');
for(const [x,y]of [[50,32],[51,32],[52,32],[52,33],[52,34],[52,35],[52,36],[52,37],[51,37],[49,37],[48,37],[48,36],[48,35]])assert(run(`!blocked.has(key(${x},${y}))`),'Village approach must curve around the cave mound');
for(const id of ['cave','cliff']){
  const image=decodePNG(fs.readFileSync(`assets/hunting/${id}-v1.png`)),b=alphaBounds(image);
  assert.equal(image.width,320);assert.equal(image.height,id==='cave'?256:160);
  assert(b.x>=8&&b.y>=8&&b.x+b.width<=312&&b.y+b.height<=248);
  assert.equal(image.data[3],0);
}
const cave=decodePNG(fs.readFileSync('assets/hunting/cave-v1.png'));let dark=0;
for(let y=145;y<210;y++)for(let x=135;x<185;x++){
  const i=(y*cave.width+x)*4;
  if(cave.data[i+3]===255&&Math.max(...cave.data.subarray(i,i+3))<65)dark++;
}
assert(dark>2200,'The recessed cave mouth must be opaque darkness, not a transparent frame');
console.log(`Hunting terrain passed: 8 solid ridges, ${data.paths.length} connected clear path tiles, 10 homes/40 melee approaches, pond/exit, village cave roof/approach, opaque tunnel and transparent sprite margins.`);
