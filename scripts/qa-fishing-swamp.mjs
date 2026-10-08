import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {decodePNG} from './lib/png.mjs';

const read=file=>fs.readFileSync(path.resolve(file),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const run=(context,files,code)=>vm.runInContext(files.map(read).join('\n')+'\n'+code,context);
const data={};vm.createContext(data);
run(data,['src/assets.js','src/data/fishing-habitat-data.js','src/data/fish-data.js'],
  'globalThis.fish=FISH_DATA.filter(f=>f.habitat==="swamp");globalThis.planned=FISHING_TARGET_ROSTER.filter(f=>f.habitat==="swamp");globalThis.urls=FISH_URLS;');
const fish=clone(data.fish),planned=clone(data.planned);
assert.equal(fish.length,7);assert.deepEqual(fish.map(f=>f.id),planned.map(f=>f.id));
for(const f of fish){
  const image=decodePNG(fs.readFileSync(data.urls[f.asset]));
  assert.equal(image.width,96);assert.equal(image.height,96);
  assert.ok(image.data.some((v,i)=>i%4===3&&v===0));assert.ok(image.data.some((v,i)=>i%4===3&&v>0));
}
const world={MAP_W:64,MAP_H:48,TILE:48,MOVEMENT_CONFIG:{npcStepDuration:240},GAME_STATE:{regionId:'reedSwamp'}};
vm.createContext(world);
run(world,['src/data/world-map.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/fishing-spots.js','src/world.js'],
  `globalThis.routes={out:REGION_EXITS.waterfallValley.find(e=>e.to==='reedSwamp'),back:REGION_EXITS.reedSwamp.find(e=>e.to==='waterfallValley')};
   globalThis.reachable=(()=>{
     const open=[WORLD_DEFINITION.playerSpawn],seen=new Set([key(open[0].x,open[0].y)]);
     for(let i=0;i<open.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
       const x=open[i].x+dx,y=open[i].y+dy,k=key(x,y);
       if(!inside(x,y)||blocked.has(k)||seen.has(k))continue;
       seen.add(k);open.push({x,y});
     }return [...seen];
   })();
   globalThis.spots=[[28,24],[30,24],[39,15],[32,40]].map(([x,y])=>resolveFishingSpot(WORLD_DEFINITION,{x,y}));
   globalThis.narrowBank=!blocked.has('29,24')&&blocked.has('28,24')&&blocked.has('30,24');
   globalThis.boardwalkSafe=bridgeSet.has('33,40')&&!blocked.has('33,40');
   GAME_STATE.regionId='waterfallValley';buildWorldRegion(REGION_WORLDS.waterfallValley);
   globalThis.arrivalSafe=!blocked.has('36,44')&&!blocked.has('36,46');`);
assert.equal(world.routes.out.x,36);assert.equal(world.routes.out.y,46);
assert.equal(world.routes.back.x,36);assert.equal(world.routes.back.y,1);
assert.ok(world.arrivalSafe&&world.narrowBank&&world.boardwalkSafe);
for(const tile of ['36,1','36,3','29,17','29,24','38,15','38,24','33,34','33,40'])
  assert.ok(world.reachable.includes(tile),'Unreachable swamp destination: '+tile);
assert.equal(new Set(world.spots.map(spot=>spot.spotId)).size,4);
assert.ok(world.spots.every(spot=>spot.fishingHabitat==='swamp'));

const logicFiles=['src/data/fishing-habitat-data.js','src/fishing-spots.js','src/data/fish-data.js',
  'src/data/fishing-gear-data.js','src/data/life-skill-data.js','src/life-skills.js','src/fishing.js'];
const pool={GAME_STATE:{inventory:[],progression:{flags:{},fishing:{level:1,equippedRodId:'rod.basic',purchasedRodIds:[]}}}};
vm.createContext(pool);
run(pool,logicFiles,`globalThis.contexts=[];
 for(const period of ['DAWN','DAY','DUSK','NIGHT'])for(const weather of ['clear','rain','storm']){
   const context={regionId:'reedSwamp',habitat:'swamp',period,weather};
   const ids=getEligibleFishPool(context).map(f=>f.id),river=getEligibleFishPool({...context,habitat:'river'}).map(f=>f.id);
   globalThis.contexts.push({period,weather,ids,river});
 }
 globalThis.basicAccess=FISH_DATA.map(f=>{
   const eligible=getEligibleFishPool({regionId:'qa',habitat:f.habitat,period:f.periods?.[0]||'DAY',weather:f.weather?.[0]||'clear'});
   const index=eligible.findIndex(candidate=>candidate.id===f.id),rod=getEquippedFishingRod();
   const total=eligible.reduce((sum,candidate)=>sum+getEffectiveFishWeight(candidate),0);
   const roll=(eligible.slice(0,index).reduce((sum,candidate)=>sum+getEffectiveFishWeight(candidate),0)+getEffectiveFishWeight(f)/2)/total;
   return {id:f.id,rod:rod.id,weight:getEffectiveFishWeight(f),selected:chooseWeightedFish(eligible,roll).id};
 });
 const auroraPool=getEligibleFishPool({regionId:'mountainLake',habitat:'mountain_lake',period:'DAWN',weather:'clear'});
 globalThis.basicAuroraChance=auroraPool.find(f=>f.id==='fish.aurora_trout').weight/auroraPool.reduce((sum,f)=>sum+f.weight,0);`);
for(const row of pool.contexts){
  assert.ok(row.ids.includes('fish.swamp_eel'),'Every swamp condition needs its always-available eel');
  assert.equal(row.ids.includes('fish.swamp_catfish'),row.period==='NIGHT');
  assert.equal(row.ids.includes('fish.piranha'),row.period==='DAY');
  assert.equal(row.ids.includes('fish.black_ghost'),row.period==='NIGHT');
  assert.equal(row.ids.includes('fish.electric_eel'),row.weather==='rain');
  assert.equal(row.ids.includes('fish.arowana'),['DAWN','DUSK'].includes(row.period)&&row.weather==='clear');
  assert.equal(row.ids.includes('fish.swamp_king_eel'),row.period==='NIGHT'&&row.weather==='storm');
  assert.ok(row.river.includes('fish.minnow')&&row.river.every(id=>!row.ids.includes(id)));
}
assert.equal(pool.basicAccess.length,74);
assert.ok(pool.basicAccess.every(row=>row.rod==='rod.basic'&&row.weight>0&&row.selected===row.id),
  'Basic rod at Lv.1 must retain a positive real selection interval for every live species');

const caught=[];
for(const f of fish){
  let saves=0;
  const context={Math:Object.create(Math),GAME_STATE:{regionId:'reedSwamp',inventory:[],collections:{fish:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic',purchasedRodIds:[]}},
    appearance:{activeTool:'rod'},activity:{active:null}},saveGame:()=>{saves++;return true;}};
  vm.createContext(context);
  run(context,logicFiles,`fishingState.context={regionId:'reedSwamp',spotId:'shade_swamp_west',habitat:'swamp',period:'${f.periods?.[0]||'DAY'}',weather:'${f.weather?.[0]||'clear'}'};
    const eligible=getEligibleFishPool(fishingState.context),index=eligible.findIndex(candidate=>candidate.id==='${f.id}');
    const total=eligible.reduce((sum,candidate)=>sum+getEffectiveFishWeight(candidate),0);
    const roll=(eligible.slice(0,index).reduce((sum,candidate)=>sum+getEffectiveFishWeight(candidate),0)+getEffectiveFishWeight(eligible[index])/2)/total;
    let rollIndex=0;Math.random=()=>rollIndex++===0?roll:.5;
    globalThis.result=createFishingCatch();globalThis.inventory=GAME_STATE.inventory;globalThis.record=GAME_STATE.collections.fish['${f.id}'];`);
  assert.equal(context.result.fishId,f.id);assert.equal(context.result.rodId,'rod.basic');
  assert.equal(context.inventory.length,1);assert.equal(context.record.count,1);assert.equal(saves,1);
  caught.push(clone(context.inventory[0]));
}
const save={window:{addEventListener(){}},console:{warn(){}},localStorage:{getItem:()=>null,setItem(){}},GAME_STATE:{progression:{}}};
vm.createContext(save);
run(save,['src/data/fishing-habitat-data.js','src/data/fish-data.js','src/data/fishing-gear-data.js','src/data/life-skill-data.js','src/life-skills.js','src/save.js'],
  `globalThis.inventory=normalizeSavedInventory(${JSON.stringify(caught)});
   globalThis.collections=normalizeSavedFishCollections(${JSON.stringify(Object.fromEntries(caught.map(f=>[f.id,{count:1,minSizeCm:f.sizeCm,maxSizeCm:f.sizeCm,totalSizeCm:f.sizeCm}])))});`);
assert.deepEqual(clone(save.inventory).map(f=>f.id),fish.map(f=>f.id));
assert.deepEqual(Object.keys(save.collections),fish.map(f=>f.id));
const commerce={};vm.createContext(commerce);
run(commerce,['src/data/fishing-habitat-data.js','src/data/fish-data.js','src/market.js','src/inventory.js'],
  `globalThis.sale=planFishSale(new Map(${JSON.stringify(caught.map(f=>[f.id,1]))}),${JSON.stringify(caught)});`);
assert.deepEqual(clone(commerce.sale),{inventory:[],count:7,total:caught.reduce((sum,f)=>sum+f.price,0)});
console.log('Swamp passed: reciprocal route, four spots, narrow banks/boardwalk, 12 conditions, seven catches/assets/save/sale; basic rod can select all 74 fish');
