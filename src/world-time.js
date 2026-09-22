const WORLD_TIME_CONFIG=Object.freeze({
  realDayDurationMs:30*60*1000,
  startMinutes:10*60+24,
  minutesPerDay:24*60
});

function parseWorldTime(value){
  if(typeof value!=='string') return null;
  const match=/^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if(!match) return null;
  const hour=Number(match[1]), minute=Number(match[2]);
  if(hour>23||minute>59) return null;
  return hour*60+minute;
}

const worldTimeParams=typeof window!=='undefined' ? new URLSearchParams(window.location.search) : null;
const isWorldDebugMode=worldTimeParams?.has('debug')===true;
const isWeatherPreviewMode=worldTimeParams?.has('weather-preview')===true;
const debugTime=(isWorldDebugMode||isWeatherPreviewMode) ? parseWorldTime(worldTimeParams.get('time')) : null;
const worldTime={
  day:0,
  minutes:debugTime ?? (isWeatherPreviewMode ? 18*60+30 : WORLD_TIME_CONFIG.startMinutes),
  debugLocked:debugTime!==null||isWeatherPreviewMode
};

const WORLD_TIME_VISUAL_STOPS=Object.freeze([
  {minutes:0,tint:[24,38,88],alpha:.34,light:1},
  {minutes:300,tint:[30,48,102],alpha:.30,light:1},
  {minutes:420,tint:[82,108,158],alpha:.14,light:.42},
  {minutes:480,tint:[255,255,255],alpha:0,light:0},
  {minutes:1020,tint:[255,255,255],alpha:0,light:0},
  {minutes:1140,tint:[255,214,160],alpha:.06,light:.18},
  {minutes:1200,tint:[245,132,64],alpha:.16,light:.58},
  {minutes:1320,tint:[27,39,92],alpha:.32,light:1}
]);

function lerp(a,b,t){ return a+(b-a)*t; }
function getWorldTimeVisuals(minutes=worldTime.minutes){
  const dayMinutes=WORLD_TIME_CONFIG.minutesPerDay;
  const value=((minutes%dayMinutes)+dayMinutes)%dayMinutes;
  let before=WORLD_TIME_VISUAL_STOPS[WORLD_TIME_VISUAL_STOPS.length-1];
  let after={...WORLD_TIME_VISUAL_STOPS[0],minutes:dayMinutes};
  for(let i=0;i<WORLD_TIME_VISUAL_STOPS.length-1;i++){
    if(value>=WORLD_TIME_VISUAL_STOPS[i].minutes&&value<WORLD_TIME_VISUAL_STOPS[i+1].minutes){
      before=WORLD_TIME_VISUAL_STOPS[i];after=WORLD_TIME_VISUAL_STOPS[i+1];break;
    }
  }
  const span=after.minutes-before.minutes;
  const t=span<=0?0:(value-before.minutes)/span;
  return {
    tint:before.tint.map((channel,index)=>Math.round(lerp(channel,after.tint[index],t))),
    alpha:lerp(before.alpha,after.alpha,t),
    light:lerp(before.light,after.light,t)
  };
}

function updateWorldTime(dt){
  if(worldTime.debugLocked) return;
  const minutesPerMs=WORLD_TIME_CONFIG.minutesPerDay/WORLD_TIME_CONFIG.realDayDurationMs;
  worldTime.minutes+=Math.max(0,dt)*minutesPerMs;
  while(worldTime.minutes>=WORLD_TIME_CONFIG.minutesPerDay){
    worldTime.minutes-=WORLD_TIME_CONFIG.minutesPerDay;
    worldTime.day+=1;
  }
}

function setWorldTimeDebug(minutes){
  worldTime.minutes=((minutes%WORLD_TIME_CONFIG.minutesPerDay)+WORLD_TIME_CONFIG.minutesPerDay)%WORLD_TIME_CONFIG.minutesPerDay;
  worldTime.debugLocked=true;
}

function adjustWorldTimeDebug(deltaMinutes){
  setWorldTimeDebug(worldTime.minutes+deltaMinutes);
}

function isWorldTimeDebugLocked(){ return worldTime.debugLocked; }

let worldTimeDebugUIReady=false;
function setupWorldTimeDebugUI(){
  const panel=document.getElementById('timeDebugPanel');
  if(!panel) return;
  panel.classList.toggle('show',isWorldDebugMode||isWeatherPreviewMode);
  document.body.classList.toggle('weatherPreviewMode',isWeatherPreviewMode);
  const modeLabel=document.getElementById('timeDebugModeLabel');
  if(modeLabel) modeLabel.textContent=isWeatherPreviewMode?'WEATHER PREVIEW':'TIME DEBUG';
  const previewHint=document.getElementById('weatherPreviewHint');
  if(previewHint) previewHint.hidden=!isWeatherPreviewMode;
  if(worldTimeDebugUIReady) return;
  worldTimeDebugUIReady=true;
  document.getElementById('timeBack30')?.addEventListener('click',()=>adjustWorldTimeDebug(-30));
  document.getElementById('timeForward30')?.addEventListener('click',()=>adjustWorldTimeDebug(30));
  document.getElementById('timeResume')?.addEventListener('click',()=>{worldTime.debugLocked=false;});
  document.getElementById('timeDawn')?.addEventListener('click',()=>setWorldTimeDebug(6*60+30));
  document.getElementById('timeDay')?.addEventListener('click',()=>setWorldTimeDebug(12*60));
  document.getElementById('timeDusk')?.addEventListener('click',()=>setWorldTimeDebug(18*60+30));
  document.getElementById('timeNight')?.addEventListener('click',()=>setWorldTimeDebug(22*60));
  document.getElementById('weatherClear')?.addEventListener('click',()=>setWeatherDebug('clear'));
  document.getElementById('weatherRain')?.addEventListener('click',()=>setWeatherDebug('rain'));
  document.getElementById('weatherStorm')?.addEventListener('click',()=>setWeatherDebug('storm'));
  document.getElementById('weatherAuto')?.addEventListener('click',resumeWeather);
}

function getWorldTimeMinutes(){ return worldTime.minutes; }

function getWorldTimePeriod(minutes=worldTime.minutes){
  if(minutes>=5*60&&minutes<8*60) return 'DAWN';
  if(minutes>=8*60&&minutes<17*60) return 'DAY';
  if(minutes>=17*60&&minutes<20*60) return 'DUSK';
  return 'NIGHT';
}

function formatWorldTime(minutes=worldTime.minutes){
  const total=Math.floor(minutes)%WORLD_TIME_CONFIG.minutesPerDay;
  const hour=Math.floor(total/60).toString().padStart(2,'0');
  const minute=(total%60).toString().padStart(2,'0');
  return `${hour}:${minute}`;
}

function updateWorldClockUI(){
  setupWorldTimeDebugUI();
  updateWeatherDebugUI();
  const clock=document.getElementById('worldClock');
  if(!clock) return;
  const mapLabel=`WORLD ${WORLD_DEFINITION.width}×${WORLD_DEFINITION.height}`;
  clock.textContent=`${getWeatherIcon()} ${formatWorldTime()} · ${mapLabel}`;
  const debugValue=document.getElementById('timeDebugValue');
  if(debugValue) debugValue.textContent=formatWorldTime();
}
