import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fishingRuntime,balanceReport,routeRegressions} from './lib/fishing-balance.mjs';
import {simulateTrips} from './lib/fishing-progression.mjs';

// Fare decisions use runtime pools/size prices/repeat weights and paid-rod
// repairs. Slow input is a sensitivity case, not a promise for idle voyages.
const samples=16,routeData=fishingRuntime().VOYAGE_ROUTES;
const output=path.resolve(process.argv[2]||'output/voyage-fares-v1/simulation.json');
const scenarios=[];
for(const overheadSeconds of [0,3,8]){
  const report=balanceReport({overheadSeconds,legends:false});
  const boatRows=report.rows.filter(row=>row.durationMs);
  const regressions=routeRegressions(report);
  assert.equal(regressions.length,0,'A higher route must retain higher net income in the same context');
  assert(boatRows.every(row=>row.netTripCoins>0),'Expected ordinary ten-minute earnings must cover fare and repair');
  const routes=routeData.map(route=>{
    const rows=boatRows.filter(row=>row.habitat===route.habitat&&row.rodId==='rod.basic');
    const gross=rows.map(row=>row.catches*row.pricePerCatch).sort((a,b)=>a-b);
    const medianGross=(gross[5]+gross[6])/2;
    return {id:route.id,name:route.name,price:route.price,basicCatches:rows[0].catches,
      basicGrossMedian:medianGross,fareShareOfBasicGross:route.price/medianGross,
      basicNetRange:[Math.min(...rows.map(row=>row.netTripCoins)),Math.max(...rows.map(row=>row.netTripCoins))]};
  });
  const trips=simulateTrips({samples,overheadSeconds});
  assert(trips.every(trip=>trip.losses===0&&trip.minNet>0),'Sampled full voyages lost money after fare/repair');
  const scenario={overheadSeconds,staticConditions:boatRows.length,regressions:regressions.length,routes,
    dynamicSamples:routeData.length*fishingRuntime().FISHING_RODS.length*samples,
    losses:trips.reduce((sum,trip)=>sum+trip.losses,0),minNet:Math.min(...trips.map(trip=>trip.minNet)),trips};
  scenarios.push(scenario);
  console.log(JSON.stringify({overheadSeconds,routes,regressions:scenario.regressions,
    dynamicSamples:scenario.dynamicSamples,losses:scenario.losses,minNet:scenario.minNet}));
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify({assumptions:{visibleVoyageMinutes:10,inputOverheadSeconds:[0,3,8],
  setupSeconds:15,portAndSaleSeconds:45,repairSeconds:5,paidRodWearAndRepair:true,
  breakagePolicy:'Manually use basic rod for remaining voyage, then repair preferred rod at village',
  noFirstDiscoveryRewards:true,noClaimForIdleOrCancelledCatches:true},samplesPerRouteAndRod:samples,
  fares:routeData.map(({id,price})=>({id,price})),scenarios},null,2));
console.log('Voyage fare simulation passed: 1,440 static boat conditions, 1,920 dynamic voyages, 0/3/8s input, all ten rods.');
