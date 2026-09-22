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
const debugTime=worldTimeParams?.has('debug') ? parseWorldTime(worldTimeParams.get('time')) : null;
const worldTime={
  day:0,
  minutes:debugTime ?? WORLD_TIME_CONFIG.startMinutes,
  debugLocked:debugTime!==null
};

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
  const clock=document.getElementById('worldClock');
  if(!clock) return;
  const mapLabel=`WORLD ${WORLD_DEFINITION.width}×${WORLD_DEFINITION.height}`;
  clock.textContent=`☀ ${formatWorldTime()} · ${mapLabel}`;
}
