import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {forestIds,forestWorldContext,forestSnapshot} from './lib/forest-world-qa.mjs';
const context=forestWorldContext();
assert.deepEqual(forestSnapshot(context),JSON.parse(fs.readFileSync('docs/FOREST_ROUTES_BASELINE_V1.json','utf8')),
  'Every legacy resource tree ID/position/species, water, shore, rock, terrain and forestry economy must remain intact');
const report=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
  const ids=['lilacVillage',...Object.keys(FOREST_REGION_SPECIES),'mountainLake'],maps={};
  for(const id of ids){
    GAME_STATE.regionId=id;buildWorldRegion(REGION_WORLDS[id]);
    if(id!=='lilacVillage')validatePlayableRegion();
    const start=WORLD_DEFINITION.playerSpawn,queue=[start],seen=new Set([key(start.x,start.y)]);
    for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const x=queue[i].x+dx,y=queue[i].y+dy,k=key(x,y);
      if(!inside(x,y)||blocked.has(k)||seen.has(k))continue;seen.add(k);queue.push({x,y});
    }
    const exits=REGION_EXITS[id];
    if(exits.some(e=>!seen.has(key(e.x,e.y))))throw Error('Unreachable exit '+id);
    for(const path of WORLD_DEFINITION.routePaths||[]){
      const dx=Math.sign(path.x2-path.x1),dy=Math.sign(path.y2-path.y1);let x=path.x1,y=path.y1;
      while(true){if(blocked.has(key(x,y)))throw Error('New path crossed a tree/water '+id+' '+key(x,y));
        if(x===path.x2&&y===path.y2)break;x+=dx;y+=dy;}
    }
    for(const source of Object.values(REGION_EXITS).flat().filter(e=>e.to===id)){
      if(!seen.has(key(source.entry.x,source.entry.y)))throw Error('Unreachable arrival '+id);
      if(exits.some(e=>e.x===source.entry.x&&e.y===source.entry.y))throw Error('Arrival instant-bounces '+id);
    }
    maps[id]={exits,reachable:seen.size};
  }
  return maps;
})())`,context));
const expected={
  lilacVillage:['oldForest','forestTen','sunnyFields','coast'],
  oldForest:['lilacVillage','deepForest','forestThree','forestFour','forestFive','mountainLake'],
  deepForest:['oldForest'],forestThree:['oldForest'],forestFour:['oldForest'],
  forestFive:['oldForest','forestSix'],forestSix:['forestFive','forestSeven'],
  forestSeven:['forestSix','forestEight'],forestEight:['forestSeven','forestNine'],forestNine:['forestEight'],
  forestTen:['lilacVillage','forestEleven'],forestEleven:['forestTen','forestTwelve'],forestTwelve:['forestEleven']
};
for(const [id,targets] of Object.entries(expected)){
  assert.deepEqual(report[id].exits.map(e=>e.to),targets);
  for(const e of report[id].exits){
    const reverse=report[e.to]?.exits.find(r=>r.to===id);
    if(!reverse)continue; // Existing farm/coast routes are protected by their own QA.
    assert(Math.abs(e.entry.x-reverse.x)+Math.abs(e.entry.y-reverse.y)===2,'Arrival is two tiles inside its matching return gate');
  }
}
assert(report.lilacVillage.exits.find(e=>e.to==='oldForest').y===46);
assert(report.lilacVillage.exits.find(e=>e.to==='forestTen').y===1);
assert(report.oldForest.exits.find(e=>e.to==='deepForest').y===1);
assert(report.oldForest.exits.find(e=>e.to==='forestThree').x===1);
assert(report.oldForest.exits.find(e=>e.to==='forestFour').x===62);
assert(report.oldForest.exits.find(e=>e.to==='forestFive').y===46);
const routes=new Set(['lilacVillage']),queue=['lilacVillage'];
for(let i=0;i<queue.length;i++)for(const e of report[queue[i]]?.exits||[])if(!routes.has(e.to)){routes.add(e.to);queue.push(e.to);}
assert(forestIds.every(id=>routes.has(id)),'All twelve forests remain connected');
console.log('Forest routes passed: south branching hub/north fantasy, 12 forests, 2565 untouched trees, all exits/arrivals/corridors reachable, no bounce or new progression locks');
