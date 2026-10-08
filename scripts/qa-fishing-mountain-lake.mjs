import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {decodePNG} from './lib/png.mjs';

const read=file=>fs.readFileSync(path.resolve(file),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const run=(context,files,code)=>vm.runInContext(files.map(read).join('\n')+'\n'+code,context);
const data={};vm.createContext(data);
run(data,['src/assets.js','src/data/world-map.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/data/fish-data.js'],
  'globalThis.fish=FISH_DATA.filter(f=>f.habitat==="mountain_lake");globalThis.planned=FISHING_TARGET_ROSTER.filter(f=>f.habitat==="mountain_lake");globalThis.urls=FISH_URLS;');
const fish=clone(data.fish),planned=clone(data.planned);
assert.equal(fish.length,7);
assert.deepEqual(fish.map(f=>f.id),planned.map(f=>f.id));
for(const f of fish){
  const image=decodePNG(fs.readFileSync(data.urls[f.asset]));
  assert.equal(image.width,96);assert.equal(image.height,96);
  assert.ok(image.data.some((value,index)=>index%4===3&&value===0));
  assert.ok(image.data.some((value,index)=>index%4===3&&value>0));
}

const world={MAP_W:64,MAP_H:48,TILE:48,MOVEMENT_CONFIG:{npcStepDuration:240},GAME_STATE:{regionId:'mountainLake'}};
vm.createContext(world);
run(world,['src/data/world-map.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/fishing-spots.js','src/world.js'],
  `globalThis.routes={out:REGION_EXITS.oldForest.find(e=>e.to==='mountainLake'),back:REGION_EXITS.mountainLake.find(e=>e.to==='oldForest')};
   globalThis.map=REGION_WORLDS.mountainLake;
   globalThis.reachable=(()=>{
     const open=[WORLD_DEFINITION.playerSpawn],seen=new Set([key(open[0].x,open[0].y)]);
     for(let i=0;i<open.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
       const x=open[i].x+dx,y=open[i].y+dy,k=key(x,y);
       if(!inside(x,y)||blocked.has(k)||seen.has(k))continue;
       seen.add(k);open.push({x,y});
     }
     return [...seen];
   })();
   globalThis.pierWater=resolveFishingSpot(WORLD_DEFINITION,{x:32,y:30});
   globalThis.waterBlocked=blocked.has('32,30');
   globalThis.ridgeBlocked=blocked.has('10,8');
   GAME_STATE.regionId='oldForest';buildWorldRegion(REGION_WORLDS.oldForest);
   globalThis.oldArrivalSafe=!blocked.has('3,24')&&!blocked.has('1,24');`);
assert.equal(world.routes.out.x,1);assert.equal(world.routes.out.y,24);
assert.equal(world.routes.back.x,62);assert.equal(world.routes.back.y,24);
assert.ok(world.oldArrivalSafe);
for(const tile of ['60,24','62,24','48,24','31,30','31,35','14,24'])
  assert.ok(world.reachable.includes(tile),'Unreachable lake destination: '+tile);
assert.equal(world.pierWater.fishingHabitat,'mountain_lake');
assert.ok(world.waterBlocked&&world.ridgeBlocked);

const logicFiles=['src/data/fishing-habitat-data.js','src/fishing-spots.js','src/data/fish-data.js',
  'src/data/fishing-gear-data.js','src/data/life-skill-data.js','src/life-skills.js','src/fishing.js'];
const pool={};vm.createContext(pool);
run(pool,logicFiles,`globalThis.contexts=[];
 for(const period of ['DAWN','DAY','DUSK','NIGHT'])for(const weather of ['clear','rain','storm']){
   const ids=getEligibleFishPool({regionId:'mountainLake',habitat:'mountain_lake',period,weather}).map(f=>f.id);
   globalThis.contexts.push({period,weather,ids});
 }
 globalThis.leaks=['pond','river','coast'].flatMap(habitat=>getEligibleFishPool({regionId:habitat,habitat,period:'DAWN',weather:'clear'}).filter(f=>f.habitat==='mountain_lake'));`);
for(const row of pool.contexts){
  assert.ok(row.ids.includes('fish.pond_smelt')&&row.ids.includes('fish.freshwater_eel'),'Every lake context needs guaranteed common catches');
  assert.equal(row.ids.includes('fish.aurora_trout'),row.period==='DAWN'&&row.weather==='clear');
  assert.equal(row.ids.includes('fish.manchurian_trout'),['DAY','DUSK'].includes(row.period)&&row.weather==='clear');
}
assert.equal(pool.leaks.length,0);

const caught=[];
for(const f of fish){
  let saves=0;
  const catchContext={Math:Object.create(Math),GAME_STATE:{regionId:'mountainLake',inventory:[],collections:{fish:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']}},
    appearance:{activeTool:'rod'},activity:{active:null}},saveGame:()=>{saves++;return true;}};
  vm.createContext(catchContext);
  run(catchContext,logicFiles,`fishingState.context={regionId:'mountainLake',spotId:'dawn_lake_main',habitat:'mountain_lake',period:'${f.periods?.[0]||'DAY'}',weather:'clear'};
    const eligible=getEligibleFishPool(fishingState.context);
    const index=eligible.findIndex(f=>f.id==='${f.id}');
    const total=eligible.reduce((sum,f)=>sum+getEffectiveFishWeight(f),0);
    const targetRoll=(eligible.slice(0,index).reduce((sum,f)=>sum+getEffectiveFishWeight(f),0)+getEffectiveFishWeight(eligible[index])/2)/total;
    let rollIndex=0;Math.random=()=>rollIndex++===0?targetRoll:.5;
    globalThis.result=createFishingCatch();globalThis.inventory=GAME_STATE.inventory;globalThis.record=GAME_STATE.collections.fish['${f.id}'];`);
  assert.equal(catchContext.result.fishId,f.id,'Normal weighted selection must be able to catch '+f.id);
  assert.equal(catchContext.inventory.length,1);assert.equal(catchContext.record.count,1);assert.equal(saves,1);
  caught.push(clone(catchContext.inventory[0]));
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
console.log('Mountain lake passed: reciprocal route, real world collision/access, seven normal weighted catches, 12 context pools, dawn legendary, assets, save and sale');
