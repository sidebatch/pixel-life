import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {decodePNG} from './lib/png.mjs';
const read=file=>fs.readFileSync(file,'utf8'),clone=value=>JSON.parse(JSON.stringify(value));
const run=(context,files,code)=>vm.runInContext(files.map(read).join('\n')+'\n'+code,context);
const data={};vm.createContext(data);
run(data,['src/assets.js','src/data/fishing-habitat-data.js','src/data/fish-data.js'],
  'globalThis.fish=FISH_DATA.filter(f=>f.habitat==="boat_mid");globalThis.planned=FISHING_TARGET_ROSTER.filter(f=>f.habitat==="boat_mid");globalThis.urls=FISH_URLS;');
const fish=clone(data.fish);assert.equal(fish.length,7);assert.deepEqual(fish.map(f=>f.id),clone(data.planned).map(f=>f.id));
for(const f of fish){
  const image=decodePNG(fs.readFileSync(data.urls[f.asset]));
  assert.equal(image.width,96);assert.equal(image.height,96);
  assert.ok(image.data.some((v,i)=>i%4===3&&v===0));assert.ok(image.data.some((v,i)=>i%4===3&&v>0));
  assert.ok(fs.existsSync(`assets/fishing/source/${f.asset}.png`));
}
const logic=['src/data/fishing-habitat-data.js','src/data/fish-data.js','src/data/fishing-gear-data.js','src/data/life-skill-data.js','src/life-skills.js','src/fishing.js'];
const pool={GAME_STATE:{inventory:[],progression:{flags:{},fishing:{level:1,equippedRodId:'rod.basic'}}}};vm.createContext(pool);
run(pool,logic,`globalThis.rows=[];
  for(const period of ['DAWN','DAY','DUSK','NIGHT'])for(const weather of ['clear','rain','storm']){
    const context={regionId:'boatMid',habitat:'boat_mid',period,weather};
    globalThis.rows.push({period,weather,ids:getEligibleFishPool(context).map(f=>f.id),coast:getEligibleFishPool({...context,habitat:'coast'}).map(f=>f.id)});
  }
  globalThis.access=FISH_DATA.map(f=>{
    const p=getEligibleFishPool({regionId:'qa',habitat:f.habitat,period:f.periods?.[0]||'DAY',weather:f.weather?.[0]||'clear'}),i=p.findIndex(item=>item.id===f.id);
    const total=p.reduce((sum,item)=>sum+getEffectiveFishWeight(item),0),roll=(p.slice(0,i).reduce((sum,item)=>sum+getEffectiveFishWeight(item),0)+getEffectiveFishWeight(f)/2)/total;
    return {id:f.id,rod:getEquippedFishingRod().id,weight:getEffectiveFishWeight(f),selected:chooseWeightedFish(p,roll).id};
  });`);
for(const row of pool.rows){
  for(const id of ['fish.spanish_mackerel','fish.yellowtail','fish.marlin'])assert.ok(row.ids.includes(id));
  assert.equal(row.ids.includes('fish.amberjack'),row.period==='DAY');
  assert.equal(row.ids.includes('fish.bluefin_tuna'),row.period==='DAWN'&&row.weather==='clear');
  for(const id of ['fish.sevenband_grouper','fish.deep_octopus'])assert.equal(row.ids.includes(id),row.period==='NIGHT');
  assert.ok(row.coast.every(id=>!row.ids.includes(id)));
}
assert.equal(pool.access.length,60);assert.ok(pool.access.every(f=>f.rod==='rod.basic'&&f.weight>0&&f.selected===f.id));
const caught=[];
for(const f of fish){
  let saves=0;
  const context={Math:Object.create(Math),saveGame:()=>{saves++;return true;},GAME_STATE:{regionId:'boatMid',inventory:[],collections:{fish:{}},progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic'}},activity:{active:null}}};vm.createContext(context);
  run(context,logic,`fishingState.context={regionId:'boatMid',spotId:'mid_open_sea',habitat:'boat_mid',period:'${f.periods?.[0]||'DAY'}',weather:'${f.weather?.[0]||'clear'}'};
    const p=getEligibleFishPool(fishingState.context),i=p.findIndex(item=>item.id==='${f.id}'),total=p.reduce((sum,item)=>sum+getEffectiveFishWeight(item),0);
    const roll=(p.slice(0,i).reduce((sum,item)=>sum+getEffectiveFishWeight(item),0)+getEffectiveFishWeight(p[i])/2)/total;let rolls=0;Math.random=()=>rolls++===0?roll:.5;
    globalThis.result=createFishingCatch();globalThis.inventory=GAME_STATE.inventory;globalThis.record=GAME_STATE.collections.fish['${f.id}'];`);
  assert.equal(context.result.fishId,f.id);assert.equal(context.result.rodId,'rod.basic');assert.equal(context.record.count,1);assert.equal(saves,1);caught.push(clone(context.inventory[0]));
}
const save={window:{addEventListener(){}},console:{warn(){}},localStorage:{getItem:()=>null,setItem(){}},GAME_STATE:{progression:{}}};vm.createContext(save);
run(save,[...logic.slice(0,-1),'src/save.js'],`globalThis.inventory=normalizeSavedInventory(${JSON.stringify(caught)});
  globalThis.records=normalizeSavedFishCollections(${JSON.stringify(Object.fromEntries(caught.map(f=>[f.id,{count:1,minSizeCm:f.sizeCm,maxSizeCm:f.sizeCm,totalSizeCm:f.sizeCm}])))});`);
assert.deepEqual(clone(save.inventory).map(f=>f.id),fish.map(f=>f.id));assert.deepEqual(Object.keys(save.records),fish.map(f=>f.id));
const commerce={};vm.createContext(commerce);
run(commerce,['src/data/fishing-habitat-data.js','src/data/fish-data.js','src/market.js','src/inventory.js'],`globalThis.sale=planFishSale(new Map(${JSON.stringify(caught.map(f=>[f.id,1]))}),${JSON.stringify(caught)});`);
assert.deepEqual(clone(commerce.sale),{inventory:[],count:7,total:caught.reduce((sum,f)=>sum+f.price,0)});
console.log('Mid fishing passed: seven images, 12 condition pools, real weighted catches, inventory/collection/save/sale, basic rod access to all 60 fish');
