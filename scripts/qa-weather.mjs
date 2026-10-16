import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const listeners={},physics=[],math=Object.create(Math);let now=0,seed=1,roll=.99;
math.random=()=>roll;
const context={Math:math,performance:{now:()=>now},document:{hidden:false,addEventListener:(id,fn)=>listeners[id]=fn},window:{location:{search:''},addEventListener:(id,fn)=>listeners[id]=fn},
  URLSearchParams,requestAnimationFrame(){},update:dt=>physics.push(dt)};
for(const name of ['updateVoyage','updateFishRewardReveal','updateLifeContentUi','updateGrowthStatus','drawWorld','refreshContext'])context[name]=()=>{};
vm.createContext(context);
vm.runInContext(read('src/world-time.js')+'\n'+read('src/weather.js')+'\n'+read('src/main.js').split('function updateStartupProgress')[0]+
  '\nupdateWorldClockUI=()=>{};refreshCharacterPreviewVisibility=()=>{};updateWeatherDebugUI=()=>{};globalThis.api={worldTime,weatherState,updateWeather,pickWeather,setWeatherDebug,resumeWeather,loop,config:WEATHER_CONFIG,resetLast:()=>{last=0;}};',context);
const r=context.api;
for(const [value,kind]of [[0,'storm'],[.079,'storm'],[.08,'rain'],[.349,'rain'],[.351,'clear'],[.999,'clear']]){roll=value;assert.equal(r.pickWeather(),kind);}
// Even adversarial rolls cannot hide a storm for four consecutive windows.
roll=.99;let run=0,maxRun=0;
for(let segment=0;segment<100;segment++){
  r.worldTime.day=Math.floor(segment/4);r.worldTime.minutes=(segment%4)*360;r.updateWeather();
  run=r.weatherState.kind==='storm'?0:run+1;maxRun=Math.max(maxRun,run);assert(run<=3);
  const state=JSON.stringify(r.weatherState);for(let i=0;i<20;i++)r.updateWeather();assert.equal(JSON.stringify(r.weatherState),state);
}
assert.equal(maxRun,3);
const locked=JSON.stringify(r.weatherState);r.setWeatherDebug('rain');r.worldTime.minutes=0;r.worldTime.day+=1;r.updateWeather();assert.equal(r.weatherState.kind,'rain');
assert.equal(r.weatherState.nonStormSegments,JSON.parse(locked).nonStormSegments);r.resumeWeather();assert(!r.weatherState.debugLocked);
// The real main loop keeps calendar speed at low FPS while movement stays capped.
const clock={};
for(const fps of [60,30,20,10,5]){
  r.worldTime.debugLocked=false;r.worldTime.minutes=0;r.worldTime.day=0;r.resetLast();physics.length=0;
  for(let i=1;i<=fps*600;i++)r.loop(i*1000/fps);
  assert(Math.abs(r.worldTime.minutes-480)<1e-6);
  assert(physics.every(dt=>dt<=40));clock[fps]=r.worldTime.minutes;
}
r.worldTime.minutes=0;r.resetLast();context.document.hidden=true;r.loop(600000);assert.equal(r.worldTime.minutes,0);
context.document.hidden=false;now=600000;listeners.visibilitychange();r.loop(600100);assert(Math.abs(r.worldTime.minutes-.08)<1e-8);
now=1200000;listeners.pageshow();r.loop(1200100);assert(Math.abs(r.worldTime.minutes-.16)<1e-8);
r.worldTime.minutes=0;r.resetLast();r.loop(100000);assert(Math.abs(r.worldTime.minutes-.8)<1e-8);
r.worldTime.debugLocked=true;r.loop(100100);assert(Math.abs(r.worldTime.minutes-.8)<1e-8);
// Count actual schedules across 10,000 days, not only direct debug weather.
math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
Object.assign(r.weatherState,{segment:-1,debugLocked:false,wetSegments:0,nonStormSegments:0,day:0});
const counts={clear:0,rain:0,storm:0};let noStormDays=0;
for(let day=0;day<10000;day++){let seen=false;
  for(let i=0;i<4;i++){r.worldTime.day=day;r.worldTime.minutes=i*360;r.updateWeather();counts[r.weatherState.kind]++;if(r.weatherState.kind==='storm')seen=true;}
  if(!seen)noStormDays++;
}
assert.equal(noStormDays,0);assert(counts.clear>counts.storm&&counts.rain>0);
const report={days:10000,counts,noStormDays,maxNonStormWindows:maxRun,lowFpsClock:clock,backgroundPaused:true,debugLock:true,movementCapped:true};
if(process.argv[1]?.endsWith('qa-weather.mjs')&&process.argv[2]){fs.mkdirSync(process.argv[2],{recursive:true});fs.writeFileSync(process.argv[2]+'/schedule.json',JSON.stringify(report,null,2)+'\n');}
console.log('Weather passed: 10,000 days, storm within four windows, 5–60 FPS calendar, capped movement, background/BFCache pause, debug/auto and stable windows. '+JSON.stringify(counts));
