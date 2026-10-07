import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const read=relativePath=>fs.readFileSync(path.join(root,relativePath),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const expected=[
  {id:'fish.bluegill',name:'블루길',asset:'bluegill',habitat:'pond',rarity:'common',periods:null,weather:null,
    minSizeCm:8,maxSizeCm:28,basePrice:22,xp:8,weight:28,description:'파란 볼이 매력적인 연못의 단골이다.',introducedVersion:'expansion'},
  {id:'fish.killifish',name:'송사리',asset:'killifish',habitat:'pond',rarity:'common',periods:['DAY'],weather:null,
    minSizeCm:2,maxSizeCm:6,basePrice:18,xp:8,weight:22,description:'수면 위를 총총 뛰어다니는 작은 물고기다.',introducedVersion:'expansion'},
  {id:'fish.mandarin_fish',name:'쏘가리',asset:'mandarin_fish',habitat:'river',rarity:'common',periods:null,weather:null,
    minSizeCm:15,maxSizeCm:50,basePrice:38,xp:8,weight:25,description:'맑은 강바닥에 숨어사는 자존심 강한 물고기다.',introducedVersion:'expansion'}
];

const dataContext={};
vm.createContext(dataContext);
vm.runInContext(`${read('src/assets.js')}\n${read('src/data/fishing-habitat-data.js')}\n${read('src/data/fish-data.js')}\n`+
  `globalThis.__fish=FISH_DATA;globalThis.__urls=FISH_URLS;globalThis.__rewards=FISH_COLLECTION_REWARDS;`,dataContext);
const runtime=clone(dataContext.__fish),urls=clone(dataContext.__urls);
assert.ok(runtime.length>=23,'The live fishing roster must retain the 23 species introduced through step 5');
assert.deepEqual(runtime.filter(fish=>expected.some(item=>item.id===fish.id)).map(({emoji,...fish})=>fish),expected,
  'The three existing-map additions differ from the approved runtime contract');
assert.deepEqual(clone(dataContext.__rewards).map(reward=>reward.count),[5,10,15,19,20],
  'The original collection reward thresholds must not move when new fish are added');

for(const fish of expected){
  const runtimePath=`assets/fishing/${fish.asset}.png`,sourcePath=`assets/fishing/source/${fish.asset}.png`;
  assert.equal(urls[fish.asset],runtimePath,`Missing runtime image mapping: ${fish.id}`);
  const png=fs.readFileSync(path.join(root,runtimePath));
  assert.equal(png.subarray(1,4).toString(),'PNG',`Runtime fish image is not PNG: ${fish.id}`);
  assert.equal(png.readUInt32BE(16),96,`Runtime fish width must be 96px: ${fish.id}`);
  assert.equal(png.readUInt32BE(20),96,`Runtime fish height must be 96px: ${fish.id}`);
  assert.equal(png[25],6,`Runtime fish image must preserve RGBA transparency: ${fish.id}`);
  const source=fs.readFileSync(path.join(root,sourcePath));
  assert.equal(source.subarray(1,4).toString(),'PNG',`Source fish image is not PNG: ${fish.id}`);
  assert.equal(source[25],6,`Source fish image must preserve RGBA transparency: ${fish.id}`);
}

const poolContext={
  GAME_STATE:{regionId:'lilacVillage',inventory:[],collections:{fish:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,equippedRodId:'rod.basic'}},activity:{active:null}},
  getWorldTimePeriod:()=> 'DAY',getWeatherKind:()=> 'clear'
};
vm.createContext(poolContext);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/fishing-spots.js')}\n`+
  `${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n`+
  `${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
  `const ids=context=>getEligibleFishPool(context).map(fish=>fish.id);`+
  `globalThis.__pools={`+
  ` farm:ids({regionId:'sunnyFields',spotId:'farm_pond',habitat:'pond',period:'DAY',weather:'clear'}),`+
  ` forest:ids({regionId:'oldForest',spotId:'forest_stream',habitat:'river',period:'DAY',weather:'clear'}),`+
  ` coast:ids({regionId:'coast',spotId:'coast_water',habitat:'coast',period:'DAY',weather:'clear'}),`+
  ` village:ids({regionId:'lilacVillage',spotId:'lilac_pond',habitat:'pond',period:'DAY',weather:'clear'})};`,poolContext);
const pools=clone(poolContext.__pools);
assert.ok(pools.farm.includes('fish.bluegill')&&pools.farm.includes('fish.killifish')&&!pools.farm.includes('fish.mandarin_fish'),
  'Farm pond must contain only the new pond fish');
assert.ok(pools.forest.includes('fish.mandarin_fish')&&!pools.forest.includes('fish.bluegill')&&!pools.forest.includes('fish.killifish'),
  'Forest river must contain only the new river fish');
assert.ok(expected.every(fish=>!pools.coast.includes(fish.id)),'The new inland fish must not leak into the coast pool');
assert.ok(pools.village.includes('fish.bluegill')&&pools.village.includes('fish.killifish')&&!pools.village.includes('fish.mandarin_fish'),
  'The village pond must use the real pond pool after the coast becomes playable');

for(const fish of expected){
  let saves=0;
  const catchContext={
    Math,URLSearchParams,window:{location:{search:`?debug&fish=${fish.id}`}},
    GAME_STATE:{regionId:fish.habitat==='pond'?'sunnyFields':'oldForest',inventory:[],collections:{fish:{}},
      progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']}},
      appearance:{activeTool:'rod'},activity:{active:null}},
    getWorldTimePeriod:()=>fish.periods?.[0]||'DAY',getWeatherKind:()=> 'clear',saveGame:()=>{saves+=1;return true;}
  };
  vm.createContext(catchContext);
  vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/fishing-spots.js')}\n`+
    `${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n`+
    `${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
    `fishingState.context={regionId:GAME_STATE.regionId,spotId:'qa_spot',habitat:'${fish.habitat}',period:'${fish.periods?.[0]||'DAY'}',weather:'clear'};`+
    `globalThis.__result=createFishingCatch();globalThis.__inventory=GAME_STATE.inventory;globalThis.__collection=GAME_STATE.collections.fish;`,catchContext);
  assert.equal(catchContext.__result.fishId,fish.id,`Debug catch selected the wrong new fish: ${fish.id}`);
  assert.equal(catchContext.__inventory.length,1,`Catch did not add one inventory record: ${fish.id}`);
  assert.equal(catchContext.__collection[fish.id].count,1,`Catch did not create a collection record: ${fish.id}`);
  assert.equal(saves,1,`Catch did not save exactly once: ${fish.id}`);
}

const saveContext={window:{addEventListener(){}},console:{warn(){}},localStorage:{getItem:()=>null,setItem(){}},GAME_STATE:{progression:{}}};
vm.createContext(saveContext);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/data/fish-data.js')}\n`+
  `${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/save.js')}\n`+
  `globalThis.__restored=normalizeSavedFishCollections({`+
  `${expected.map(fish=>`'${fish.id}':{count:2,minSizeCm:${fish.minSizeCm},maxSizeCm:${fish.maxSizeCm},totalSizeCm:${(fish.minSizeCm+fish.maxSizeCm)*2}}`).join(',')}});`,saveContext);
assert.deepEqual(Object.keys(clone(saveContext.__restored)),expected.map(fish=>fish.id),
  'Save normalization must retain all three new collection records');

const commerceContext={};
vm.createContext(commerceContext);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/data/fish-data.js')}\n`+
  `${read('src/market.js')}\n${read('src/inventory.js')}\n`+
  `const inventory=${JSON.stringify(expected.map((fish,index)=>({type:'fish',id:fish.id,name:fish.name,rarity:fish.rarity,sizeCm:fish.minSizeCm,price:20+index,quantity:1})))};`+
  `globalThis.__marketHas=${JSON.stringify(expected.map(fish=>fish.id))}.every(id=>MARKET_FISH_BY_ID.has(id));`+
  `globalThis.__inventoryHas=${JSON.stringify(expected.map(fish=>fish.id))}.every(id=>INVENTORY_FISH_BY_ID.has(id));`+
  `globalThis.__sale=planFishSale(new Map(${JSON.stringify(expected.map(fish=>[fish.id,1]))}),inventory);`,commerceContext);
assert.equal(commerceContext.__marketHas,true,'Market lookup must include all three new fish');
assert.equal(commerceContext.__inventoryHas,true,'Inventory lookup must include all three new fish');
assert.deepEqual(clone(commerceContext.__sale),{inventory:[],count:3,total:63},
  'The three new fish must use the normal deterministic sale path');

console.log('Fishing step-5 trio passed: bluegill, killifish, mandarin fish; catch, assets, pools, save, inventory, sale');
