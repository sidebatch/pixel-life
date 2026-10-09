import {balanceReport,routeRegressions} from './lib/fishing-balance.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {simulateTrips,simulateGearProgression,simulateDexTour,quantile} from './lib/fishing-progression.mjs';
const overhead=Number(process.argv.find(a=>a.startsWith('--overhead='))?.split('=')[1]??3);
if(!Number.isFinite(overhead)||overhead<0||overhead>60)throw new Error('Overhead must be 0–60 seconds');
const report=balanceReport({overheadSeconds:overhead}),regressions=routeRegressions(report);
const samples=Number(process.argv.find(a=>a.startsWith('--samples='))?.split('=')[1]??64);
const tourSamples=Number(process.argv.find(a=>a.startsWith('--tour-samples='))?.split('=')[1]??8);
if(!Number.isInteger(samples)||samples<1||samples>1024||!Number.isInteger(tourSamples)||tourSamples<1||tourSamples>128)
  throw new Error('Samples must be 1–1024; tour samples must be 1–128');
if(process.argv.includes('--sessions')){
  if(!process.argv.includes('--json'))console.log(`Simulating ${24*samples} visible-time trips…`);
  report.trips=simulateTrips({samples,overheadSeconds:overhead});
  if(!process.argv.includes('--json'))console.log(`Simulating ${samples} recipe-farming progressions…`);
  report.progression=Array.from({length:samples},(_,i)=>simulateGearProgression(i+1,{overheadSeconds:overhead}));
  if(!process.argv.includes('--json'))console.log(`Simulating ${tourSamples} blind collection tours…`);
  report.dexTours=Array.from({length:tourSamples},(_,i)=>simulateDexTour(i+1,{overheadSeconds:overhead}));
}
const output=process.argv.find(a=>a.startsWith('--output='))?.slice('--output='.length);
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({...report,regressions},null,2));}
if(process.argv.includes('--json'))console.log(JSON.stringify({...report,regressions},null,2));
else{
 console.log(`Fishing balance: ${report.rows.length} pools; ${report.legendRows.length} eligible legendary contexts; Lv.100 ${report.maxLevelXp} XP`);
 for(const habitat of ['coast','boat_shallow','boat_mid','boat_deep','glacier']){
   const rows=report.rows.filter(r=>r.habitat===habitat&&r.rodId==='rod.basic');
   console.log(habitat,JSON.stringify({netPerMinuteRange:[Math.min(...rows.map(r=>r.netCoinsPerMinute)),Math.max(...rows.map(r=>r.netCoinsPerMinute))],
     netTripRange:habitat==='coast'?null:[Math.min(...rows.map(r=>r.netTripCoins)),Math.max(...rows.map(r=>r.netTripCoins))],
     xpPerMinuteRange:[Math.min(...rows.map(r=>r.xpPerMinute)),Math.max(...rows.map(r=>r.xpPerMinute))]}));
 }
 console.log('Same-context route regressions:',regressions.length,JSON.stringify(regressions.slice(0,4)));
 console.log('Legendary basic rod:',JSON.stringify(report.legendRows.filter(r=>r.rodId==='rod.basic')));
 if(report.progression){
   console.log('Dynamic trips:',JSON.stringify(report.trips.filter(row=>row.rodId==='rod.basic')));
   console.log('Progression:',JSON.stringify({completed:report.progression.filter(r=>r.complete).length,
     deepestRodLevelMedian:quantile(report.progression.map(r=>r.milestones.at(-1)?.level||100),.5),
     deepestRodLevelP90:quantile(report.progression.map(r=>r.milestones.at(-1)?.level||100),.9),
     glacierLevelMedian:quantile(report.progression.map(r=>r.glacier?.level||100),.5),
     minutesMedian:quantile(report.progression.map(r=>r.minutes),.5),
     maxXp:Math.max(...report.progression.map(r=>r.totalXp))}));
   console.log('Blind 74-species tour:',JSON.stringify({completed:report.dexTours.filter(r=>r.complete).length,
     medianHours:quantile(report.dexTours.map(r=>r.hours),.5),p90Hours:quantile(report.dexTours.map(r=>r.hours),.9),
     medianCatches:quantile(report.dexTours.map(r=>r.catches),.5)}));
 }
}
