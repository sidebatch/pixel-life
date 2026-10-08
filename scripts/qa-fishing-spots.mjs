import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));

const mapContext={};
vm.createContext(mapContext);
vm.runInContext(`${read('src/data/world-map.js')}\n${read('src/data/region-maps.js')}\n`+
  `${read('src/data/fishing-habitat-data.js')}\n${read('src/fishing-spots.js')}\n`+
  `globalThis.__regions=REGION_WORLDS;globalThis.__habitatIds=[...FISHING_HABITAT_BY_ID.keys()];`+
  `globalThis.__primarySpots=Object.fromEntries(Object.entries(REGION_WORLDS).map(([id,definition])=>`+
  `[id,resolveFishingSpot(definition,definition.fishingSpot,id)]));`,mapContext);

const regions=clone(mapContext.__regions);
const habitatIds=new Set(clone(mapContext.__habitatIds));
const primarySpots=clone(mapContext.__primarySpots);
const forestIds=['oldForest','deepForest','forestThree','forestFour','forestFive','forestSix','forestSeven',
  'forestEight','forestNine','forestTen','forestEleven','forestTwelve'];

assert.equal(Object.keys(regions).length,17,'Expected village, farm, coast, mountain lake, waterfall valley, and twelve playable forest regions');
for(const [regionId,definition] of Object.entries(regions)){
  assert.ok(definition.waterAreas.length>0,`Region has no fishing water: ${regionId}`);
  const ids=new Set();
  for(const area of definition.waterAreas){
    assert.ok(area.id&&!ids.has(area.id),`Fishing spot ids must be stable and unique inside ${regionId}`);
    ids.add(area.id);
    assert.ok(habitatIds.has(area.fishingHabitat),`Unknown fishing habitat: ${regionId}/${area.id}`);
  }
  assert.ok(primarySpots[regionId]&&ids.has(primarySpots[regionId].spotId),
    `Primary fishing marker does not resolve inside ${regionId}`);
}
assert.ok(regions.lilacVillage.waterAreas.every(area=>area.fishingHabitat==='pond'),
  'Village water must preserve the pond pool');
assert.ok(regions.sunnyFields.waterAreas.every(area=>area.fishingHabitat==='pond'),
  'Farm water must preserve the pond pool');
assert.ok(regions.coast.waterAreas.every(area=>area.fishingHabitat==='coast'),
  'The playable harbor water must use the coast pool');
assert.ok(regions.mountainLake.waterAreas.every(area=>area.fishingHabitat==='mountain_lake'),
  'The playable mountain lake must use its own lake pool');
assert.ok(forestIds.every(id=>regions[id].waterAreas.every(area=>area.fishingHabitat==='river')),
  'Every existing forest water area must preserve the river pool');

const resolverReport=vm.runInContext(`(()=>{
  const mixed={id:'mixedHarbor',waterAreas:[
    {id:'garden_pond',x:0,y:0,w:4,h:4,cutCorners:true,fishingHabitat:'pond'},
    {id:'harbor_channel',x:6,y:0,w:4,h:4,fishingHabitat:'coast'}
  ]};
  return {
    pond:resolveFishingSpot(mixed,{x:1,y:1}),
    coast:resolveFishingSpot(mixed,{x:7,y:1}),
    cutCorner:resolveFishingSpot(mixed,{x:0,y:0}),
    dryTile:resolveFishingSpot(mixed,{x:5,y:1}),
    fallback:resolveFishingSpot({id:'oldForest',waterAreas:[{id:'legacy_stream',x:0,y:0,w:2,h:2}]},{x:1,y:1})
  };
})()`,mapContext);
const resolved=clone(resolverReport);
assert.deepEqual(resolved.pond,{regionId:'mixedHarbor',spotId:'garden_pond',fishingHabitat:'pond',x:1,y:1});
assert.deepEqual(resolved.coast,{regionId:'mixedHarbor',spotId:'harbor_channel',fishingHabitat:'coast',x:7,y:1});
assert.equal(resolved.cutCorner,null,'Cut water corners must not resolve as fishable tiles');
assert.equal(resolved.dryTile,null,'Dry tiles must not resolve as fishing spots');
assert.equal(resolved.fallback.fishingHabitat,'river','Legacy region fallback must remain available');

let period='DAY',weather='clear',target={x:1,y:1};
const runtime={
  Math,URLSearchParams,window:{location:{search:''}},
  GAME_STATE:{regionId:'mixedHarbor',inventory:[],collections:{fish:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']}},
    appearance:{activeTool:'rod'},activity:{active:null}},
  WORLD_DEFINITION:{id:'mixedHarbor',waterAreas:[
    {id:'garden_pond',x:0,y:0,w:4,h:4,fishingHabitat:'pond'},
    {id:'harbor_channel',x:6,y:0,w:4,h:4,fishingHabitat:'coast'}
  ]},
  getWorldTimePeriod:()=>period,getWeatherKind:()=>weather,facingTile:()=>({...target}),
  waterSet:new Set(['1,1','7,1']),key:(x,y)=>`${x},${y}`,menuOpen:false,
  inputs:{up:false,down:false,left:false,right:false},activeDir:null,
  clearPlayerInputBuffer:()=>{},playFishingCastSound:()=>{},playFishingBiteSound:()=>{},stopFishingSound:()=>{}
};
vm.createContext(runtime);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/fishing-spots.js')}\n`+
  `${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n`+
  `${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
  `globalThis.__pondStarted=startFishing();globalThis.__pondContext=fishingState.context;`+
  `globalThis.__pondSpot={...fishingState.spot};`,runtime);
period='NIGHT';weather='storm';target={x:7,y:1};runtime.GAME_STATE.regionId='changedRegion';
runtime.__frozenContext=clone(runtime.__pondContext);
runtime.__contextFrozen=vm.runInContext('Object.isFrozen(fishingState.context)',runtime);
vm.runInContext(`finishFishing();GAME_STATE.regionId='mixedHarbor';globalThis.__coastStarted=startFishing();`+
  `globalThis.__coastContext=fishingState.context;`,runtime);

assert.equal(runtime.__pondStarted,true,'Fishing must start on the first mapped water area');
assert.deepEqual(runtime.__frozenContext,{regionId:'mixedHarbor',spotId:'garden_pond',habitat:'pond',period:'DAY',weather:'clear'},
  'Cast context must stay fixed after region, target, time, and weather change');
assert.equal(runtime.__contextFrozen,true,'Cast context must be immutable');
assert.deepEqual(clone(runtime.__pondSpot),{spotId:'garden_pond',x:1,y:1,fishingHabitat:'pond'},
  'Active fishing state must retain the stable spot id');
assert.equal(runtime.__coastStarted,true,'Fishing must start on the second mapped water area');
assert.deepEqual(clone(runtime.__coastContext),
  {regionId:'mixedHarbor',spotId:'harbor_channel',habitat:'coast',period:'NIGHT',weather:'storm'},
  'A second water area on the same map must select its own habitat pool');

console.log('Fishing spot routing passed: 17 regions, stable spot ids, mixed-habitat map, frozen cast context');
