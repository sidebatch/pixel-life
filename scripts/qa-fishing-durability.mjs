import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fishingRuntime} from './lib/fishing-balance.mjs';
const plain=value=>JSON.parse(JSON.stringify(value));
function ready(seed=1){
  const r=fishingRuntime(seed);
  r.state.progression.fishing.purchasedRodIds=r.FISHING_RODS.filter(rod=>!rod.requiresMasterReward).map(rod=>rod.id);
  r.state.progression.flags.masterRod=true;r.state.progression.coins=100000;
  r.fishingState.context={habitat:'pond',period:'DAY',weather:'clear'};
  return r;
}
for(const rod of ready().FISHING_RODS){
  const r=ready(),state=r.state;assert(r.equipFishingRod(rod.id));
  const before=r.getFishingRodDurability(rod);
  const result=r.createFishingCatch();assert(result);assert.equal(result.rodId,rod.id);
  assert.equal(r.getFishingRodDurability(rod).current,before.infinite?null:before.max-1);
  if(before.infinite){assert.equal(r.fishingRodRepairCost(rod),0);assert(!r.repairFishingRod(rod.id));continue;}
  state.progression.fishing.durabilityByRodId[rod.id]=Math.floor(rod.maxDurability*.7);
  const cost=Math.ceil(rod.repairCoins*(rod.maxDurability-Math.floor(rod.maxDurability*.7))/rod.maxDurability);
  assert.equal(r.fishingRodRepairCost(rod),cost);
  state.regionId='fishingBoat';assert(!r.repairFishingRod(rod.id));state.regionId='lilacVillage';
  r.fishingState.phase='waiting';assert(!r.repairFishingRod(rod.id));r.fishingState.phase='idle';
  state.progression.coins=cost-1;assert(!r.repairFishingRod(rod.id));state.progression.coins=100000;
  const snapshot=plain(state),reference=state.progression.fishing;
  r.setSaveResult(false);assert(!r.repairFishingRod(rod.id));assert.deepEqual(plain(state),snapshot);assert.equal(state.progression.fishing,reference);
  r.setSaveResult(true);assert(r.repairFishingRod(rod.id));assert.equal(state.progression.coins,100000-cost);
  assert.equal(state.appearance.activeTool,'rod');assert.equal(r.getFishingRodDurability(rod).current,rod.maxDurability);
  state.progression.fishing.durabilityByRodId[rod.id]=1;
  const last=r.createFishingCatch();assert(last.rodBroke);assert.equal(last.rodId,rod.id);
  assert.equal(state.appearance.activeTool,'none');assert.equal(r.getFishingRodDurability(rod).current,0);
  assert(!r.equipFishingRod(rod.id));assert.equal(r.createFishingCatch(),null);
  assert(r.repairFishingRod(rod.id));assert.equal(state.appearance.activeTool,'none','Repair auto-equipped broken gear');
  assert(r.equipFishingRod(rod.id));assert.equal(state.appearance.activeTool,'rod');
}
// Every reward boundary is one atomic catch, including gifted rod and cosmetic graduation.
for(const threshold of [1,5,10,15,19,20,30,40,50,60,74]){
  const r=ready(threshold),state=r.state,target=r.FISH_DATA.find(f=>f.id==='fish.crucian_carp');
  state.progression.flags={};state.inventory=[];
  const discovered=r.FISH_DATA.filter(f=>f.id!==target.id).slice(0,threshold-1);
  state.collections.fish=Object.fromEntries(discovered.map(f=>[f.id,{count:1,minSizeCm:f.minSizeCm,maxSizeCm:f.minSizeCm,totalSizeCm:f.minSizeCm}]));
  state.collections.fishRewards={schemaVersion:1,milestoneIds:[],habitatIds:[],revealedMilestoneIds:[],revealedHabitatIds:[]};
  assert(r.equipFishingRod('rod.sturdy'));state.progression.fishing.durabilityByRodId={'rod.sturdy':1};
  // Choose a frozen candidate without exposing it; failure retries cannot reroll.
  r.fishingState.pendingCatch={fish:target,rod:r.FISHING_RODS[1],sizeCm:target.minSizeCm,price:target.basePrice};
  const snapshot=plain(state),inventory=state.inventory,fish=state.collections.fish,flags=state.progression.flags,fishing=state.progression.fishing;
  const streak=plain(r.fishingCatchStreak);
  r.setSaveResult(false);assert.equal(r.createFishingCatch(),null);assert.equal(r.createFishingCatch(),null);
  assert.deepEqual(plain(state),snapshot);assert.equal(state.inventory,inventory);assert.equal(state.collections.fish,fish);
  assert.equal(state.progression.flags,flags);assert.equal(state.progression.fishing,fishing);assert.deepEqual(plain(r.fishingCatchStreak),streak);
  assert.equal(r.fishingState.pendingCatch.fish.id,target.id);
  r.setSaveResult(true);const result=r.createFishingCatch();assert(result.firstDiscovery&&result.rodBroke);
  assert.equal(result.fishId,target.id);assert.equal(result.sizeCm,target.minSizeCm);assert.equal(state.collections.fish[target.id].count,1);
  assert.equal(Object.keys(state.collections.fish).length,threshold);assert.equal(r.fishingState.pendingCatch,null);
  assert.equal(state.inventory.filter(i=>i.type==='fish').length,1);
  if(threshold>=20){assert(state.progression.flags.masterRod);assert.equal(r.getFishingRodDurability('rod.master_angler').current,240);}
  r.fishingState.phase='result';r.fishingState.result=result;const committed=plain(state);
  assert.equal(r.createFishingCatch(),result);assert.deepEqual(plain(state),committed,'Result confirmation granted twice');
}
const r=ready();r.state.progression.flags.fishCollectionRewards={20:true};
r.state.progression.fishing.durabilityByRodId={'rod.master_angler':0};r.createFishingCatch();
assert.equal(r.getFishingRodDurability('rod.master_angler').current,0,'Reward sync refilled a broken gift');
assert(!r.repairFishingRod('rod.fake'));r.state.progression.fishing.purchasedRodIds=['rod.basic'];
assert(!r.repairFishingRod('rod.sturdy'));
const losses={pond:1,river:1,mountain_lake:1,waterfall:1,swamp:1,coast:1,boat_shallow:6,boat_mid:8,boat_deep:10,glacier:12};
for(const rod of ready().FISHING_RODS){
  const r=ready();
  for(const [habitat,wear] of Object.entries(losses))for(const current of [wear*2,wear,Math.max(1,wear-1),1]){
    const fish=r.FISH_DATA.find(f=>f.habitat===habitat&&(!f.periods||f.periods.includes('DAY'))&&(!f.weather||f.weather.includes('clear')));
    r.state.progression.fishing.durabilityByRodId={...(r.state.progression.fishing.durabilityByRodId||{}),[rod.id]:current};
    assert(r.equipFishingRod(rod.id));r.fishingState.context={habitat,period:'DAY',weather:'clear'};
    r.fishingState.pendingCatch={fish,rod,sizeCm:fish.minSizeCm,price:fish.basePrice};
    const result=r.createFishingCatch();assert(result);assert.equal(result.durabilityLoss,rod.maxDurability?wear:0);
    const remaining=rod.maxDurability?Math.max(0,current-wear):null;
    assert.equal(r.getFishingRodDurability(rod).current,remaining);assert.equal(result.rodBroke,remaining===0);
    assert.equal(r.state.appearance.activeTool,remaining===0?'none':'rod');
    if(rod.maxDurability){
      assert.equal(r.fishingRodRepairCost(rod),Math.ceil(rod.repairCoins*(rod.maxDurability-remaining)/rod.maxDurability));
      assert(r.repairFishingRod(rod.id));
    }
  }
}
// Even all-perfect target catches exceed a full rod for later recipes. No
// random luck/coin farming is needed for this empty-bag lower-bound proof.
for(const target of r.FISHING_RODS.slice(6)){
  const previous=r.FISHING_RODS.find(rod=>rod.id===target.requiresRodId);
  const fish=r.FISH_DATA.find(f=>f.id===Object.keys(target.fishCost)[0]);
  assert(Object.keys(target.fishCost).every(id=>r.FISH_DATA.find(f=>f.id===id).habitat===fish.habitat));
  const minimumCatches=Object.values(target.fishCost).reduce((a,b)=>a+b,0),perRod=Math.ceil(previous.maxDurability/r.getFishingDurabilityLoss(fish,previous));
  assert(Math.floor((minimumCatches-1)/perRod)>=1,'Later recipe can skip all repairs with the previous paid rod');
}
// A failed catch must not permanently unlock the next voyage by XP or species.
for(const [habitat,lower,upper,fishId] of [['boat_shallow','shallow','mid','fish.filefish'],['boat_mid','mid','deep','fish.marlin'],['boat_deep','deep','glacier','fish.anglerfish']]){
  const r=fishingRuntime(101),state=r.state,fish=r.FISH_DATA.find(f=>f.id===fishId);
  state.progression.voyage.unlockedRouteIds=['shallow',...(lower==='shallow'?[]:[lower])];
  const prior=r.FISH_DATA.filter(f=>f.habitat===habitat&&f.id!==fishId).slice(0,2);
  state.collections.fish=Object.fromEntries(prior.map(f=>[f.id,{count:1,minSizeCm:f.minSizeCm,maxSizeCm:f.minSizeCm,totalSizeCm:f.minSizeCm}]));
  r.fishingState.context={habitat,period:'DAY',weather:'clear'};
  r.fishingState.pendingCatch={fish,rod:r.FISHING_RODS[0],sizeCm:fish.minSizeCm,price:fish.basePrice};
  const before=plain(state),reference=state.progression.voyage;
  r.setSaveResult(false);assert.equal(r.createFishingCatch(),null);assert.deepEqual(plain(state),before);assert.equal(state.progression.voyage,reference);
  r.setSaveResult(true);assert(r.createFishingCatch());assert(state.progression.voyage.unlockedRouteIds.includes(upper));
}
const context={window:{addEventListener(){}},localStorage:{getItem:()=>null},GAME_STATE:{progression:{}}};vm.createContext(context);
vm.runInContext(['data/fishing-habitat-data.js','data/fish-data.js','data/fishing-gear-data.js','data/life-skill-data.js','life-skills.js','save.js']
  .map(file=>fs.readFileSync('src/'+file,'utf8')).join('\n')+';globalThis.normalize=normalizeSavedFishingProgress;',context);
const purchasedRodIds=['rod.basic','rod.sturdy','rod.steel','rod.expert','rod.deepwater','rod.tidal','rod.tempest','rod.abyssal','rod.aurora'];
const legacy=context.normalize({level:90,purchasedRodIds,equippedRodId:'rod.aurora'},{masterRod:true});
assert.equal(legacy.durabilityByRodId['rod.aurora'],600);assert.equal(legacy.durabilityByRodId['rod.master_angler'],240);
for(const value of [0,1,84,119.9,-5,99999,null,'0',NaN,Infinity]){
  const normalized=context.normalize({level:90,purchasedRodIds,durabilityByRodId:{'rod.sturdy':value,'rod.basic':0,'rod.fake':0}},{masterRod:true});
  const expected=typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(120,Math.floor(value))):120;
  assert.equal(normalized.durabilityByRodId['rod.sturdy'],expected);assert(!('rod.basic' in normalized.durabilityByRodId));assert(!('rod.fake' in normalized.durabilityByRodId));
}
console.log('Rod durability passed: ten rods, 400 habitat/wear/remaining cases, later recipe repair lower bounds, 70% partial repair, last catch/break/manual re-equip, locks/old saves, eleven atomic reward boundaries and frozen retry');
