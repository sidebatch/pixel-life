import assert from 'node:assert/strict';
import {fishingRuntime,balanceReport,routeRegressions,poolModel,expectedFishPrice} from './lib/fishing-balance.mjs';
import {simulateTrips,simulateGearProgression} from './lib/fishing-progression.mjs';

const r=fishingRuntime(71),report=balanceReport();
assert.equal(report.rows.length,720);assert.equal(report.legendRows.length,36);
assert.equal(report.maxLevelXp,106690);
for(const row of report.rows){
  assert(row.probabilities.length>0);assert(Math.abs(row.probabilities.reduce((sum,p)=>sum+p.initial,0)-1)<1e-10);
  assert(Math.abs(row.probabilities.reduce((sum,p)=>sum+p.stationary,0)-1)<1e-10);
  assert(row.probabilities.every(p=>p.initial>0&&p.stationary>0));
}
for(const overheadSeconds of [0,3,8]){
  const sensitivity=overheadSeconds===3?report:balanceReport({overheadSeconds,legends:false});
  assert.deepEqual(routeRegressions(sensitivity),[],'Upper boat route regressed in the same time/weather/rod');
  assert(sensitivity.rows.filter(row=>row.durationMs).every(row=>row.netTripCoins>0),'Ordinary full voyage cannot repay ticket');
}
assert.deepEqual(Array.from(r.VOYAGE_ROUTES,route=>[route.price,route.durationMs]),
  [[300,600000],[900,600000],[2400,600000],[4800,600000]]);
const glacierPrices={toothfish:280,snow_smelt:160,glacier_trout:300,polar_cod:480,greenland_shark:550};
for(const [id,price] of Object.entries(glacierPrices))assert.equal(r.FISH_DATA.find(f=>f.id==='fish.'+id).basePrice,price);

// Sanity-check exact first-hit math against a geometric pool where repeat
// weights never change, and a single-fish pool that must hit on attempt 1.
const neutral={getEffectiveFishWeight:fish=>fish.weight};
const geometric=poolModel(neutral,[{id:'a',weight:9},{id:'b',weight:1}],r.FISHING_RODS[0]);
const hit=geometric.firstHit(1);assert(Math.abs(hit.mean-10)<1e-7);assert.equal(hit.median,7);assert.equal(hit.p90,22);
assert.equal(poolModel(neutral,[{id:'a',weight:1}],r.FISHING_RODS[0]).firstHit(0).mean,1);
for(const row of report.legendRows){assert(row.mean>50&&row.mean<200);assert(row.p90>row.median);assert(row.tail<1e-10);}

// Independent Monte Carlo using the game's chooser, not the model transition.
const pool=r.getEligibleFishPool({habitat:'glacier',period:'DAY',weather:'clear'}),rod=r.FISHING_RODS[0],model=poolModel(r,pool,rod);
const counts=new Map(pool.map(f=>[f.id,0]));
for(let i=0;i<100000;i++){
  const fish=r.chooseWeightedFish(pool,r.random());r.recordFishingSelection(fish.id);counts.set(fish.id,counts.get(fish.id)+1);
}
pool.forEach((f,i)=>assert(Math.abs(counts.get(f.id)/100000-model.stationary[i])<.006));
const snow=r.FISH_DATA.find(f=>f.id==='fish.snow_smelt');
assert(expectedFishPrice(r,snow,r.FISHING_RODS.at(-1))>expectedFishPrice(r,snow,rod));

const trips=simulateTrips({samples:8});assert(trips.every(trip=>trip.losses===0&&trip.minNet>0));
for(let seed=1;seed<=16;seed++){
  const progress=simulateGearProgression(seed);
  assert(progress.complete,`Progression hung for seed ${seed}`);
  assert.equal(progress.milestones.at(-1).rodId,'rod.deepwater');
  assert(progress.glacier.level<100&&progress.milestones.at(-1).level<100);
  assert(progress.totalXp<report.maxLevelXp*.65,'Current gear consumed the future rod growth budget');
}
console.log('Fishing balance passed: 720 pools, real repeat/size math, 0/3/8s input sensitivity, positive tickets, 36 legendary contexts, 192 dynamic trips, 16 growth seeds');
