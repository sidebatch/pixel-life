import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {forestIds,forestWorldContext,forestSnapshot} from './lib/forest-world-qa.mjs';
import {decodePNG} from './lib/png.mjs';
const postArt=decodePNG(fs.readFileSync('assets/world/route-sign-v1.png'));
assert.equal(postArt.width,144);assert.equal(postArt.height,111);assert.equal(postArt.data[3],0);
assert.equal(postArt.data[(43*144+72)*4+3],255,'Runtime lettering sits on the opaque wooden board');
const renderer=fs.readFileSync('src/rendering.js','utf8');
assert(!renderer.includes('getNearbyForestExitGuides')&&!renderer.includes('drawForestExitGuides'),'No floating destination UI');
assert(renderer.includes('routeSigns.forEach(post=>renderables.push({y:(post.y+1)*TILE'),'Physical signs share world depth sorting');
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
    const postIds=new Set();
    for(const post of routeSigns){
      const tile=key(post.x,post.y);
      if(postIds.has(post.id)||waterSet.has(tile)||treeSet.has(tile)||pathSet.has(tile)||!blocked.has(tile))throw Error('Bad physical sign '+post.id);
      postIds.add(post.id);
      if(!exits.some(e=>e.to===post.to&&e.label===post.label))throw Error('Incorrect sign destination '+post.id);
      if(![[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>seen.has(key(post.x+dx,post.y+dy))))throw Error('Sign cannot be read '+post.id);
    }
    if(WORLD_DEFINITION.routeSigns&&routeSigns.length!==exits.length)throw Error('Missing route sign '+id);
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
  oldForest:['lilacVillage','forestSeven','forestEight','forestNine','deepForest','mountainLake'],
  deepForest:['oldForest','forestThree'],forestThree:['deepForest','forestFour'],forestFour:['forestThree','forestFive'],
  forestFive:['forestFour','forestSix'],forestSix:['forestFive'],
  forestSeven:['oldForest'],forestEight:['oldForest'],forestNine:['oldForest'],
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
assert(report.oldForest.exits.find(e=>e.to==='forestSeven').y===1);
assert(report.oldForest.exits.find(e=>e.to==='forestEight').x===1);
assert(report.oldForest.exits.find(e=>e.to==='forestNine').x===62);
assert(report.oldForest.exits.find(e=>e.to==='deepForest').y===46);
for(const [id,next] of [['deepForest','forestThree'],['forestThree','forestFour'],['forestFour','forestFive'],['forestFive','forestSix']])
  assert(report[id].exits.find(e=>e.to===next).y===46);
const routes=new Set(['lilacVillage']),queue=['lilacVillage'];
for(let i=0;i<queue.length;i++)for(const e of report[queue[i]]?.exits||[])if(!routes.has(e.to)){routes.add(e.to);queue.push(e.to);}
assert(forestIds.every(id=>routes.has(id)),'All twelve forests remain connected');
console.log('Forest routes passed: south 1-1 through 1-5/giant chain, higher ordinary branches from 1-1, north fantasy, planted signposts, 2565 untouched trees, no new locks');
