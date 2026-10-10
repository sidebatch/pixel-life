import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {decodePNG} from './lib/png.mjs';
import {forestWorldContext} from './lib/forest-world-qa.mjs';
const context=forestWorldContext(),snapshot={};
const ids=['mountainLake','waterfallValley','reedSwamp','forestFive','forestTwelve'];
for(const id of ids){
 const row=vm.runInContext(`GAME_STATE.regionId='${id}';buildWorldRegion(REGION_WORLDS['${id}']);JSON.stringify({
  blocked:[...blocked].sort(),water:[...waterSet].sort(),paths:[...pathSet].sort(),bridges:[...bridgeSet].sort(),
  trees:trees.map(t=>[t.id,t.x,t.y,t.species]),rocks,exits:REGION_EXITS['${id}'],spawn:WORLD_DEFINITION.playerSpawn,
  fishingSpot:WORLD_DEFINITION.fishingSpot,waterAreas:WORLD_DEFINITION.waterAreas
 })`,context);
 snapshot[id]=crypto.createHash('sha256').update(row).digest('hex');
}
if(process.argv.includes('--snapshot')){console.log(JSON.stringify(snapshot,null,2));}
else{
 assert.deepEqual(snapshot,JSON.parse(fs.readFileSync('docs/SCENERY_NAVIGATION_BASELINE_V1.json','utf8')),'Scene art cannot change collision/trees/routes/fishing water/spawns');
 const manifest=JSON.parse(fs.readFileSync('assets/biomes/source/scenery-v1/manifest.json','utf8'));
 for(const a of Object.values(manifest.assets)){
  const image=decodePNG(fs.readFileSync(a.file));
  assert.equal(image.width,a.width);assert.equal(image.height,a.height);assert.equal(image.data[3],0);
  assert(image.data.some((v,i)=>i%4===3&&v===255),'Asset cannot be empty');
 }
 const source=fs.readFileSync('src/rendering.js','utf8');
 const art=source.slice(source.indexOf('// Art is independent'),source.indexOf('// PLAZA STANDARD'));
 context.window={matchMedia:()=>({matches:false})};
 context.hash2=(x,y)=>{const n=Math.sin(x*12.9898+y*78.233)*43758.5453;return n-Math.floor(n);};
 const calls=[],paint=vm.runInContext('ctx',context);
 for(const name of ['save','restore','beginPath','rect','clip','fillRect','ellipse','fill','stroke','translate','scale'])paint[name]=()=>{};
 paint.drawImage=(...args)=>calls.push(args);
 vm.runInContext(`let camX=0,camY=0,tNow=0;${art}
  for(const id of ['sceneryRidgeWest','sceneryRidgeEast','sceneryWaterfall','scenerySwampBank','sceneryLilyPads'])imgs[id]={id};`,context);
 const content=JSON.parse(vm.runInContext('JSON.stringify(SCENERY_IMAGE_CONTENT)',context));
 for(const [key,id] of [['west','ridge-west'],['east','ridge-east'],['fall','waterfall']]){
  const m=manifest.assets[id].content;assert.deepEqual(content[key],{x:m.x,y:m.y,w:m.w,h:m.h});
 }
 vm.runInContext("GAME_STATE.regionId='mountainLake';buildWorldRegion(REGION_WORLDS.mountainLake);drawMountainRidges(WORLD_DEFINITION.terrain)",context);
 assert.equal(calls.length,1);assert.equal(calls[0][0].id,'sceneryRidgeWest');
 calls.length=0;vm.runInContext('camX=2000;drawMountainRidges(WORLD_DEFINITION.terrain)',context);
 assert.equal(calls[0][0].id,'sceneryRidgeEast');
 calls.length=0;vm.runInContext('camX=-5000;camY=-5000;drawMountainRidges(WORLD_DEFINITION.terrain)',context);assert.equal(calls.length,0,'Off-screen ridge culling');
 vm.runInContext("GAME_STATE.regionId='waterfallValley';buildWorldRegion(REGION_WORLDS.waterfallValley);camX=1700;camY=750;drawForestWaterfalls(WORLD_DEFINITION.terrain)",context);
 assert.equal(calls[0][0].id,'sceneryWaterfall');
 const banks=vm.runInContext("GAME_STATE.regionId='reedSwamp';buildWorldRegion(REGION_WORLDS.reedSwamp);getSwampSceneryBanks()",context);
 assert.equal(banks,vm.runInContext('tNow=5000;getSwampSceneryBanks()',context),'Fixed cached banks, no per-frame regeneration');
 assert(vm.runInContext('getSwampSceneryBanks().every(b=>waterSet.has(key(Math.floor(b.x),Math.floor(b.y))))',context));
 assert(!art.includes('stripe<fall.w*4')&&!art.includes("lineTo(left+pw*.46"),'Prototype geometric fall/ridges removed');
 console.log('Biome scenery passed: 5 alpha assets, source crops, old navigation/fishing/trees intact, culling, fixed cached water decorations');
}
