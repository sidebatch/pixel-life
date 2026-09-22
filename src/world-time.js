const WORLD_TIME_CONFIG=Object.freeze({
  realDayDurationMs:30*60*1000,
  startMinutes:10*60+24,
  minutesPerDay:24*60
});

const worldTime={
  day:0,
  minutes:WORLD_TIME_CONFIG.startMinutes
};

function updateWorldTime(dt){
  const minutesPerMs=WORLD_TIME_CONFIG.minutesPerDay/WORLD_TIME_CONFIG.realDayDurationMs;
  worldTime.minutes+=Math.max(0,dt)*minutesPerMs;
  while(worldTime.minutes>=WORLD_TIME_CONFIG.minutesPerDay){
    worldTime.minutes-=WORLD_TIME_CONFIG.minutesPerDay;
    worldTime.day+=1;
  }
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
  const clock=document.getElementById('worldClock');
  if(!clock) return;
  const mapLabel=`WORLD ${WORLD_DEFINITION.width}×${WORLD_DEFINITION.height}`;
  clock.textContent=`☀ ${formatWorldTime()} · ${mapLabel}`;
}
