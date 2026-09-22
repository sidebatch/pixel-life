const WEATHER_CONFIG=Object.freeze({
  segmentMinutes:6*60,
  probabilities:Object.freeze({clear:.65,rain:.27,storm:.08})
});

const weatherParams=typeof window!=='undefined' ? new URLSearchParams(window.location.search) : null;
const weatherPreviewMode=weatherParams?.has('weather-preview')===true;
const requestedWeather=(weatherParams?.has('debug')||weatherPreviewMode) ? weatherParams.get('weather') : null;
const WEATHER_TYPES=new Set(['clear','rain','storm']);
const initialWeather=WEATHER_TYPES.has(requestedWeather)?requestedWeather:'clear';
const weatherState={
  kind:initialWeather,
  segment:-1,
  debugLocked:WEATHER_TYPES.has(requestedWeather)||weatherPreviewMode,
  wetSegments:0,
  day:0
};

function currentWeatherSegment(){
  return worldTime.day*4+Math.floor(getWorldTimeMinutes()/WEATHER_CONFIG.segmentMinutes);
}

function pickWeather(){
  const roll=Math.random();
  if(roll<WEATHER_CONFIG.probabilities.storm) return 'storm';
  if(roll<WEATHER_CONFIG.probabilities.storm+WEATHER_CONFIG.probabilities.rain) return 'rain';
  return 'clear';
}

function updateWeather(){
  if(weatherState.debugLocked) return;
  const segment=currentWeatherSegment();
  if(segment===weatherState.segment) return;
  const day=worldTime.day, segmentInDay=segment%4;
  if(day!==weatherState.day){weatherState.day=day;weatherState.wetSegments=0;}
  let next=pickWeather();
  // Soft guarantee: if the first three windows were dry, the last window is wet.
  if(segmentInDay===3&&weatherState.wetSegments===0) next=Math.random()<.22?'storm':'rain';
  weatherState.kind=next;
  weatherState.segment=segment;
  if(next!=='clear') weatherState.wetSegments+=1;
}

function setWeatherDebug(kind){
  if(!WEATHER_TYPES.has(kind)) return;
  weatherState.kind=kind;
  weatherState.debugLocked=true;
  updateWeatherDebugUI();
}

function resumeWeather(){
  weatherState.debugLocked=false;
  weatherState.segment=-1;
  updateWeather();
  updateWeatherDebugUI();
}

function getWeatherKind(){ return weatherState.kind; }
function getWeatherIcon(){ return weatherState.kind==='storm'?'⛈':weatherState.kind==='rain'?'🌧':'☀'; }

function updateWeatherDebugUI(){
  for(const button of document.querySelectorAll('[data-weather-kind]')){
    button.classList.toggle('active',button.dataset.weatherKind===weatherState.kind&&weatherState.debugLocked);
  }
}
