import fs from 'node:fs';
import assert from 'node:assert/strict';
const {crops}=new Function(fs.readFileSync('src/data/life-content-data.js','utf8')+'\nreturn LIFE_CONTENT;')();
const oldPrices={carrot:[12,8],turnip:[16,10],potato:[20,12],onion:[28,16],cabbage:[35,22],wheat:[32,15],corn:[45,20],tomato:[60,26],strawberry:[80,35],pumpkin:[100,120]};
const round=n=>Math.round(n*100)/100;
const rows=crops.map(c=>{
  const mean=(c.harvestMin+c.harvestMax)/2,minutes=c.growMs/60000;
  const profit=mean*c.sellPrice-c.seedPrice,minProfit=c.harvestMin*c.sellPrice-c.seedPrice;
  assert(Number.isSafeInteger(c.seedPrice)&&Number.isSafeInteger(c.sellPrice)&&minProfit>0,c.id+' minimum yield must cover the seed');
  assert(profit/minutes>=3&&profit/minutes<=4,c.id+' active profit must fit the 3–4 coin/minute band');
  const old=oldPrices[c.id];
  return {id:c.id,name:c.name,minutes,seed:c.seedPrice,salePerItem:c.sellPrice,
    yield:[c.harvestMin,c.harvestMax],minProfit,maxProfit:c.harvestMax*c.sellPrice-c.seedPrice,meanProfit:profit,
    coinsPerMinute:round(profit/minutes),oldCoinsPerMinute:old?round((mean*old[1]-old[0])/minutes):null};
});
// Deterministic uniform harvests, enough starting capital, completed cycles only.
// Compare immediate harvest and periodic visits for 4/16 owned plots over 24h.
// Travel, tool animation, expansion costs and unused seed stock are excluded.
let rng=0x63726f70;
function random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
const sessions=2000,horizonMinutes=1440,scenarios=[];
for(const plotCount of [4,16])for(const revisitMinutes of [0,5,15,30,60]){
  const results=crops.map(c=>{
    const minutes=c.growMs/60000,cycleMinutes=revisitMinutes?Math.ceil(minutes/revisitMinutes)*revisitMinutes:minutes;
    const cycles=Math.floor(horizonMinutes/cycleMinutes);let total=0,min=Infinity,max=-Infinity;
    for(let session=0;session<sessions;session++){
      let net=0;
      for(let cycle=0;cycle<cycles*plotCount;cycle++)net+=(c.harvestMin+Math.floor(random()*(c.harvestMax-c.harvestMin+1)))*c.sellPrice-c.seedPrice;
      total+=net;min=Math.min(min,net);max=Math.max(max,net);
    }
    const analytic=cycles*plotCount*((c.harvestMin+c.harvestMax)/2*c.sellPrice-c.seedPrice);
    assert(Math.abs(total/sessions-analytic)<=Math.max(1,analytic*.015),'Simulation must agree with exact expected income: '+c.id);
    return {id:c.id,cyclesPerPlot:cycles,expectedPerHour:round(analytic/24),simulatedPerHour:round(total/sessions/24),observedDailyRange:[min,max]};
  });
  scenarios.push({plotCount,revisitMinutes,results});
}
const report={version:1,sessions,horizonMinutes,assumptions:'Uniform integer yields; enough seed capital; completed cycles; excludes travel, expansion and replant animation.',rows,scenarios};
const out='output/farming-expansion-v1';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/balance.json',JSON.stringify(report,null,2)+'\n');
console.table(rows.map(({name,minutes,seed,salePerItem,minProfit,meanProfit,coinsPerMinute,oldCoinsPerMinute})=>({name,minutes,seed,salePerItem,minProfit,meanProfit,coinsPerMinute,oldCoinsPerMinute})));
console.log('Passed: all 14 minimum yields profitable; 3–4 coin/min active band; 280,000 seeded 24h farm sessions agree with expected income.');
