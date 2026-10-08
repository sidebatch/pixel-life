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
  'globalThis.fish=FISH_DATA.filter(f=>f.habitat==="waterfall");globalThis.planned=FISHING_TARGET_ROSTER.filter(f=>f.habitat==="waterfall");globalThis.urls=FISH_URLS;');
const fish=clone(data.fish),planned=clone(data.planned);
assert.equal(fish.length,7);assert.deepEqual(fish.map(f=>f.id),planned.map(f=>f.id));
for(const f of fish){
  const image=decodePNG(fs.readFileSync(data.urls[f.asset]));
  assert.equal(image.width,96);assert.equal(image.height,96);
  assert.ok(image.data.some((v,i)=>i%4===3&&v===0));assert.ok(image.data.some((v,i)=>i%4===3&&v>0));
}
const world={MAP_W:64,MAP_H:48,TILE:48,MOVEMENT_CONFIG:{npcStepDuration:240},GAME_STATE:{regionId:'waterfallValley'}};
vm.createContext(world);
run(world,['src/data/world-map.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/fishing-spots.js','src/world.js'],
  `globalThis.routes={out:REGION_EXITS.mountainLake.find(e=>e.to==='waterfallValley'),back:REGION_EXITS.waterfallValley.find(e=>e.to==='mountainLake')};
   globalThis.reachable=(()=>{
     const open=[WORLD_DEFINITION.playerSpawn],seen=new Set([key(open[0].x,open[0].y)]);
     for(let i=0;i<open.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
       const x=open[i].x+dx,y=open[i].y+dy,k=key(x,y);
       if(!inside(x,y)||blocked.has(k)||seen.has(k))continue;
       seen.add(k);open.push({x,y});
     }return [...seen];
   })();
   globalThis.spots={upper:resolveFishingSpot(WORLD_DEFINITION,{x:35,y:12}),pool:resolveFishingSpot(WORLD_DEFINITION,{x:36,y:23}),
     lower:resolveFishingSpot(WORLD_DEFINITION,{x:38,y:35}),cascade:resolveFishingSpot(WORLD_DEFINITION,{x:37,y:20})};
   globalThis.waterBlocked=blocked.has('36,23');globalThis.bridgeSafe=!blocked.has('40,38');
   globalThis.connected=[[38,16],[38,17],[38,22],[38,23],[38,32],[38,33]].every(([x,y])=>waterSet.has(key(x,y)));
   GAME_STATE.regionId='mountainLake';buildWorldRegion(REGION_WORLDS.mountainLake);
   globalThis.arrivalSafe=!blocked.has('31,44')&&!blocked.has('31,46');`);
assert.equal(world.routes.out.x,31);assert.equal(world.routes.out.y,46);
assert.equal(world.routes.back.x,31);assert.equal(world.routes.back.y,1);
assert.ok(world.arrivalSafe&&world.waterBlocked&&world.bridgeSafe&&world.connected);
for(const tile of ['31,1','31,3','34,12','36,22','29,27','47,27','40,38'])
  assert.ok(world.reachable.includes(tile),'Unreachable waterfall destination: '+tile);
assert.equal(world.spots.upper.fishingHabitat,'river');assert.equal(world.spots.lower.fishingHabitat,'river');
assert.equal(world.spots.pool.fishingHabitat,'waterfall');assert.equal(world.spots.cascade,null);

const logicFiles=['src/data/fishing-habitat-data.js','src/fishing-spots.js','src/data/fish-data.js',
  'src/data/fishing-gear-data.js','src/data/life-skill-data.js','src/life-skills.js','src/fishing.js'];
const pool={GAME_STATE:{inventory:[],progression:{flags:{},fishing:{level:1,equippedRodId:'rod.basic',purchasedRodIds:[]}}}};
vm.createContext(pool);
run(pool,logicFiles,`globalThis.contexts=[];
 for(const period of ['DAWN','DAY','DUSK','NIGHT'])for(const weather of ['clear','rain','storm']){
   const context={regionId:'waterfallValley',habitat:'waterfall',period,weather};
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
  assert.ok(row.ids.includes('fish.sockeye_salmon'),'Every waterfall condition needs an available fish');
  assert.equal(row.ids.includes('fish.falls_catfish'),row.weather==='rain');
  assert.equal(row.ids.includes('fish.golden_trout'),row.period==='DAY'&&row.weather==='clear');
  assert.equal(row.ids.includes('fish.silver_manchurian'),['DAWN','DUSK'].includes(row.period)&&row.weather==='clear');
  assert.equal(row.ids.includes('fish.crystal_trout'),row.period==='DAWN'&&row.weather==='clear');
  assert.ok(row.river.includes('fish.minnow')&&row.river.every(id=>!row.ids.includes(id)));
}
assert.equal(pool.basicAccess.length,39);
assert.ok(pool.basicAccess.every(row=>row.rod==='rod.basic'&&row.weight>0&&row.selected===row.id),
  'Basic rod at Lv.1 must retain a positive real selection interval for every live species');

const caught=[];
for(const f of fish){
  let saves=0;
  const context={Math:Object.create(Math),GAME_STATE:{regionId:'waterfallValley',inventory:[],collections:{fish:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic',purchasedRodIds:[]}},
    appearance:{activeTool:'rod'},activity:{active:null}},saveGame:()=>{saves++;return true;}};
  vm.createContext(context);
  run(context,logicFiles,`fishingState.context={regionId:'waterfallValley',spotId:'mist_falls_pool',habitat:'waterfall',period:'${f.periods?.[0]||'DAY'}',weather:'${f.weather?.[0]||'clear'}'};
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
console.log('Waterfall passed: connected valley, river/pool separation, 12 conditions, seven catches/assets/save/sale; basic rod can select all 39 fish (aurora '+(pool.basicAuroraChance*100).toFixed(3)+'% at clear dawn before streak correction)');
