import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relativePath=>fs.readFileSync(path.join(root,relativePath),'utf8');
const baseline=JSON.parse(read('docs/FISHING_BASELINE_V1.json'));
const clone=value=>JSON.parse(JSON.stringify(value));

assert.equal(baseline.version,1,'Fishing baseline version must stay explicit');
assert.equal(baseline.legacyFish.length,20,'Baseline must contain the original 20 fish');
assert.equal(baseline.legacyRods.length,6,'Baseline must contain the original six rods');

const dataContext={};
vm.createContext(dataContext);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n`+
  `globalThis.__fish=FISH_DATA;globalThis.__rewards=FISH_COLLECTION_REWARDS;`+
  `globalThis.__rods=FISHING_RODS;globalThis.__defaultRod=DEFAULT_FISHING_ROD_ID;globalThis.__habitats=FISHING_HABITATS;`,dataContext);

const fishById=new Map(clone(dataContext.__fish).map(fish=>[fish.id,fish]));
const actualLegacyFish=baseline.legacyFish.map(expected=>{
  const fish=fishById.get(expected[0]);
  assert.ok(fish,`Legacy fish id disappeared: ${expected[0]}`);
  return baseline.fishFields.map(field=>fish[field]??null);
});
// Step 13 explicitly authorizes only the coelacanth habitat migration.
// Keep the historical baseline immutable and compare every other field exactly.
const migratedLegacyFish=baseline.legacyFish.map(record=>record.map((value,index)=>
  record[0]==='fish.coelacanth'&&baseline.fishFields[index]==='habitat'?'boat_deep':value));
assert.deepEqual(actualLegacyFish,migratedLegacyFish,'Legacy fish data changed outside the approved habitat migration');
assert.equal(baseline.legacyFish.find(record=>record[0]==='fish.coelacanth')[baseline.fishFields.indexOf('habitat')],'coast');

const rodsById=new Map(clone(dataContext.__rods).map(rod=>[rod.id,rod]));
const actualLegacyRods=baseline.legacyRods.map(expected=>{
  const rod=rodsById.get(expected[0]);
  assert.ok(rod,`Legacy rod id disappeared: ${expected[0]}`);
  return baseline.rodFields.map(field=>rod[field]??(field==='requiresMasterReward'||field==='requiresMasterRod'?false:null));
});
// Step 17 adds four higher rods. Only replace the now-obsolete "highest tier"
// wording of deepwater; all six identities, recipes and effects stay frozen.
const expandedLegacyRods=baseline.legacyRods.map(record=>record.map((value,index)=>
  record[0]==='rod.deepwater'&&baseline.rodFields[index]==='description'?
    '도감 완성 후에도 낚시를 이어간 강태공을 위한 심해 탐색 장비.':value));
assert.deepEqual(actualLegacyRods,expandedLegacyRods,'Legacy rod data changed outside the approved description update');
assert.deepEqual(clone(dataContext.__rewards),baseline.collectionRewards,'The original 5/10/15/19/20 rewards changed');
assert.equal(dataContext.__defaultRod,baseline.runtime.defaultRodId,'Default rod id changed');

const assetContext={};
vm.createContext(assetContext);
vm.runInContext(`${read('src/assets.js')}\nglobalThis.__fishUrls=FISH_URLS;`,assetContext);
const fishUrls=clone(assetContext.__fishUrls);
for(const record of baseline.legacyFish){
  const fish=Object.fromEntries(baseline.fishFields.map((field,index)=>[field,record[index]]));
  const assetPath=fishUrls[fish.asset];
  assert.equal(assetPath,`assets/fishing/${fish.asset}.png`,`Legacy fish asset mapping changed: ${fish.id}`);
  const png=fs.readFileSync(path.join(root,assetPath));
  assert.equal(png.subarray(1,4).toString(),'PNG',`Legacy fish asset is not PNG: ${assetPath}`);
  assert.equal(png.readUInt32BE(16),96,`Legacy fish asset width changed: ${assetPath}`);
  assert.equal(png.readUInt32BE(20),96,`Legacy fish asset height changed: ${assetPath}`);
}

const html=read('index.html');
const categories=[...html.matchAll(/data-fish-category="([^"]+)"/g)].map(match=>match[1]);
assert.ok(categories.includes('all'),'The fish dex must retain an all-species view');
const habitatIds=clone(dataContext.__habitats).map(habitat=>habitat.id);
for(const filter of baseline.runtime.filters.filter(filter=>filter!=='all'))
  assert.ok(habitatIds.includes(filter),`Legacy fish-dex habitat disappeared: ${filter}`);

const fishingSource=read('src/fishing.js');
const effectsSource=read('src/fishing-effects.js');
// 2026-10-08 explicitly approved shared Logging-style XP feedback: remove only
// the duplicate inline Fishing skill card, not the historical baseline itself.
for(const className of baseline.runtime.resultClasses.filter(name=>name!=='fishingResultSkill'))
  assert.ok(fishingSource.includes(className),`Fishing result contract disappeared: ${className}`);
assert.ok(!fishingSource.includes("skillCard.className='fishingResultSkill'"),'Result must not duplicate the common XP toast');
for(const effect of baseline.runtime.requiredEffects)
  assert.ok(fishingSource.includes(`${effect}(`)||effectsSource.includes(`function ${effect}(`),`Fishing effect disappeared: ${effect}`);

let saveCalls=0;
let castSounds=0;
let clearedInputs=0;
const deterministicMath=Object.create(Math);
deterministicMath.random=()=>0;
const fishingContext={
  Math:deterministicMath,
  URLSearchParams,
  window:{location:{search:''}},
  GAME_STATE:{
    regionId:'lilacVillage',
    inventory:[],
    collections:{fish:{},trees:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']}},
    appearance:{activeTool:'rod'},
    activity:{active:null}
  },
  getWorldTimePeriod:()=> 'DAY',
  getWeatherKind:()=> 'clear',
  facingTile:()=>({x:1,y:1}),
  WORLD_DEFINITION:{id:'lilacVillage',waterAreas:[{id:'lilac_pond',x:1,y:1,w:1,h:1,fishingHabitat:'pond'}]},
  waterSet:new Set(['1,1']),
  key:(x,y)=>`${x},${y}`,
  menuOpen:false,
  inputs:{up:true,down:true,left:true,right:true},
  activeDir:'down',
  clearPlayerInputBuffer:()=>{clearedInputs+=1;},
  playFishingCastSound:()=>{castSounds+=1;},
  playFishingBiteSound:()=>{},
  stopFishingSound:()=>{},
  saveGame:()=>{saveCalls+=1;return true;}
};
vm.createContext(fishingContext);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/fishing-spots.js')}\n${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n`+
  `${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${fishingSource}\n`+
  `globalThis.__config=FISHING_CONFIG;`+
  `globalThis.__started=startFishing();`+
  `globalThis.__castState={phase:fishingState.phase,activity:GAME_STATE.activity.active,inputs:{...inputs}};`+
  `updateFishing(FISHING_CONFIG.castMs);updateFishing(fishingState.biteDelay);`+
  `globalThis.__bitePhase=fishingState.phase;`+
  `const regions={pond:'sunnyFields',river:'oldForest',coast:'coast'};`+
  `const catches=[];`+
  `for(const habitat of ['pond','river','coast'])for(const period of ['DAWN','DAY','DUSK','NIGHT'])for(const weather of ['clear','rain','storm']){`+
  ` fishingState.context={regionId:regions[habitat],habitat,period,weather};`+
  ` const before=GAME_STATE.inventory.length;const result=createFishingCatch();`+
  ` catches.push({habitat,period,weather,result,added:GAME_STATE.inventory.length-before});`+
  `}`+
  `globalThis.__catches=catches;finishFishing();globalThis.__finished={phase:fishingState.phase,activity:GAME_STATE.activity.active};`,fishingContext);

assert.deepEqual(clone(fishingContext.__config),{
  castMs:baseline.runtime.castMs,
  minWaitMs:baseline.runtime.minWaitMs,
  maxWaitMs:baseline.runtime.maxWaitMs,
  temporaryAllFishAtVillagePond:false
},'Fishing timing contract changed');
assert.equal(fishingContext.__started,true,'Equipped rod must start fishing at reachable water');
assert.deepEqual(clone(fishingContext.__castState),{
  phase:'casting',activity:'fishing',inputs:{up:false,down:false,left:false,right:false}
},'Casting must lock the character and clear movement input');
assert.equal(fishingContext.__bitePhase,'bite','Casting must reach a bite without a miss roll');
assert.equal(castSounds,1,'Casting sound must play exactly once when fishing starts');
assert.equal(clearedInputs,1,'Casting must clear buffered movement once');
assert.equal(fishingContext.__catches.length,36,'Every legacy habitat/time/weather combination must be exercised');
assert.ok(fishingContext.__catches.every(entry=>entry.added===1&&entry.result?.fishId&&entry.result.xp>0&&entry.result.rodId==='rod.basic'),
  'Every bite must add exactly one fish and return a complete result');
assert.equal(saveCalls,36,'Every successful catch must save once');
assert.deepEqual(clone(fishingContext.__finished),{phase:'idle',activity:null},'Finishing fishing must restore idle movement state');

const saveContext={
  window:{addEventListener(){}},
  console:{warn(){}},
  localStorage:{getItem:()=>null,setItem(){}},
  GAME_STATE:{progression:{}}
};
vm.createContext(saveContext);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n`+
  `${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/save.js')}\n`+
  `globalThis.__saveKey=SAVE_CONFIG.key;`,saveContext);
assert.equal(saveContext.__saveKey,baseline.runtime.saveKey,'Fishing expansion must not silently change the save namespace');

const rawCollections=Object.fromEntries(baseline.legacyFish.map(record=>[
  record[0],{count:2,minSizeCm:record[8],maxSizeCm:record[9],totalSizeCm:record[8]+record[9]}
]));
const normalizedCollections=vm.runInContext(`normalizeSavedFishCollections(${JSON.stringify(rawCollections)})`,saveContext);
for(const record of baseline.legacyFish){
  const saved=normalizedCollections[record[0]];
  assert.ok(saved,`Legacy fish collection no longer restores: ${record[0]}`);
  assert.equal(saved.name,record[1],`Legacy fish name no longer restores: ${record[0]}`);
  assert.equal(saved.rarity,record[5],`Legacy fish rarity no longer restores: ${record[0]}`);
  assert.equal(saved.count,2,`Legacy fish count no longer restores: ${record[0]}`);
}

const level30Total=vm.runInContext(`lifeSkillTotalXpForLevel('fishing',30)`,saveContext);
const restoredDeepwater=vm.runInContext(`normalizeSavedFishingProgress(${JSON.stringify({
  totalXp:level30Total,
  equippedRodId:'rod.deepwater',
  purchasedRodIds:['rod.basic','rod.sturdy','rod.steel','rod.expert','rod.deepwater']
})},{masterRod:true},[])`,saveContext);
assert.equal(restoredDeepwater.equippedRodId,'rod.deepwater','Purchased deepwater rod must survive save normalization');
const restoredMaster=vm.runInContext(`normalizeSavedFishingProgress(${JSON.stringify({
  totalXp:level30Total,equippedRodId:'rod.master_angler',purchasedRodIds:['rod.basic']
})},{masterRod:true},[{type:'equipment',id:'rod.master_angler'}])`,saveContext);
assert.equal(restoredMaster.equippedRodId,'rod.master_angler','Master angler rod must survive save normalization');

console.log(`Fishing baseline v${baseline.version} passed: 20 legacy fish, 6 legacy rods, 36 guaranteed-catch contexts, save compatibility`);
