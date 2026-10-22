// Long tracks stream separately; never decode three six-minute PCM buffers.
const REGION_MUSIC_URLS=Object.freeze({
  meadow:'assets/audio/music/meadow.mp3',
  woodland:'assets/audio/music/woodland.mp3',
  lakeside:'assets/audio/music/lakeside.mp3'
});
const REGION_MUSIC_TRACKS=Object.freeze({
  dungeonCrossroads:'woodland',mossVale:'woodland',rootHollow:'woodland',ashMine:'woodland',mistfen:'woodland',
  redrockGorge:'woodland',frostfangCave:'meadow',silentGraveyard:'woodland',forgottenShrine:'lakeside',stargraveRuins:'woodland',
  lilacVillage:'meadow',wildwoodHunt:'woodland',oldForest:'woodland',deepForest:'woodland',
  forestThree:'woodland',forestFour:'woodland',forestFive:'woodland',forestSix:'woodland',
  forestSeven:'woodland',forestEight:'woodland',forestNine:'woodland',forestTen:'woodland',
  forestEleven:'woodland',forestTwelve:'woodland',sunnyFields:'lakeside',coast:'lakeside',mountainLake:'lakeside',
  waterfallValley:'lakeside',reedSwamp:'woodland',boatShallow:'lakeside',boatMid:'woodland',boatDeep:'lakeside',boatGlacier:'meadow'
});
const REGION_MUSIC_VOLUME=.3;
const REGION_MUSIC_MUTE_KEY='pixel-life.music-muted.v1';
let regionMusicPlayer=null,regionMusicTrack=null,regionMusicUnlocked=false;
let regionMusicPending=false,regionMusicVersion=0,regionMusicMuted=false;
let regionMusicRecoveryTimer=null,regionMusicRecoveries=0,regionMusicProgressAt=0,regionMusicLastTime=0,regionMusicRetryAt=0;
let regionMusicPageActive=true;
try{regionMusicMuted=localStorage.getItem(REGION_MUSIC_MUTE_KEY)==='true';}catch(_){}

function regionMusicWanted(){
  return Boolean(regionMusicTrack&&REGION_MUSIC_TRACKS[GAME_STATE.regionId]===regionMusicTrack&&
    regionMusicUnlocked&&!regionMusicMuted&&!document.hidden&&regionMusicPageActive);
}
function cancelRegionMusicRecovery(){
  if(regionMusicRecoveryTimer!==null)window.clearTimeout?.(regionMusicRecoveryTimer);
  regionMusicRecoveryTimer=null;
}
function recoverRegionMusic(){
  cancelRegionMusicRecovery();
  if(!regionMusicWanted()||regionMusicRecoveries>=3)return false;
  // A decoder/read error can leave paused=false forever. Reload the same element
  // (preserving its mobile audio permission), then seek back after metadata.
  const audio=regionMusicPlayer,resumeAt=Number.isFinite(audio.currentTime)?audio.currentTime:0;
  const version=++regionMusicVersion;regionMusicPending=false;regionMusicRecoveries++;regionMusicRetryAt=0;
  audio.pause();
  audio.addEventListener?.('loadedmetadata',()=>{
    if(version!==regionMusicVersion||!regionMusicWanted()||resumeAt<=0)return;
    try{audio.currentTime=Number.isFinite(audio.duration)?Math.min(resumeAt,Math.max(0,audio.duration-.1)):resumeAt;}catch(_){}
  },{once:true});
  // Give a failed HTTP/media range a fresh request identity, rather than reuse
  // the browser's interrupted partial response. The worker retains offline music.
  audio.src=REGION_MUSIC_URLS[regionMusicTrack]+'?recovery='+version;
  audio.load();regionMusicLastTime=resumeAt;regionMusicProgressAt=performance.now();
  return syncRegionMusic();
}
function requestRegionMusicRecovery(){
  if(!regionMusicWanted()||regionMusicRecoveryTimer!==null||regionMusicRecoveries>=3||typeof window.setTimeout!=='function')return;
  const version=regionMusicVersion;
  regionMusicRecoveryTimer=window.setTimeout(()=>{
    regionMusicRecoveryTimer=null;if(version===regionMusicVersion)recoverRegionMusic();
  },500*(regionMusicRecoveries+1));
}
function monitorRegionMusic(){
  if(!regionMusicWanted()||!regionMusicPlayer)return;
  const now=performance.now(),audio=regionMusicPlayer;
  if(audio.error){requestRegionMusicRecovery();return;}
  if(audio.currentTime!==regionMusicLastTime){
    regionMusicLastTime=audio.currentTime;regionMusicProgressAt=now;return;
  }
  if(audio.paused&&!regionMusicPending){
    if(now>=regionMusicRetryAt&&regionMusicRecoveries<3){regionMusicRecoveries++;syncRegionMusic();}return;
  }
  if(now-regionMusicProgressAt>8000)requestRegionMusicRecovery();
}
function pauseRegionMusic(){
  cancelRegionMusicRecovery();
  // Invalidate unresolved play promises before muting/hiding the page. This
  // permits a quick return or unmute to retry instead of waiting on a stale one.
  if(regionMusicPending){regionMusicVersion++;regionMusicPending=false;}
  regionMusicPlayer?.pause();
}

function syncRegionMusic(){
  if(typeof Audio==='undefined')return false;
  const track=REGION_MUSIC_TRACKS[GAME_STATE.regionId]||null;
  if(!regionMusicPlayer){
    try{
      regionMusicPlayer=new Audio();regionMusicPlayer.loop=true;
      regionMusicPlayer.preload='metadata';regionMusicPlayer.volume=REGION_MUSIC_VOLUME;
      regionMusicPlayer.addEventListener?.('error',()=>{if(regionMusicPlayer.error)requestRegionMusicRecovery();});
    }catch(_){return false;}
  }
  if(track!==regionMusicTrack){
    cancelRegionMusicRecovery();regionMusicRecoveries=0;regionMusicRetryAt=0;
    regionMusicVersion++;regionMusicPending=false;
    regionMusicPlayer.pause();regionMusicTrack=track;
    if(track){regionMusicPlayer.src=REGION_MUSIC_URLS[track];regionMusicPlayer.load();}
    else {regionMusicPlayer.removeAttribute('src');regionMusicPlayer.load();}
    regionMusicProgressAt=typeof performance==='undefined'?0:performance.now();regionMusicLastTime=0;
  }
  if(!track||regionMusicMuted||document.hidden||!regionMusicPageActive||!regionMusicUnlocked){
    pauseRegionMusic();return false;
  }
  if(regionMusicPlayer.error){requestRegionMusicRecovery();return false;}
  // Same-track travel (forest 1-1/1-2) and ordinary input must not restart it.
  if(regionMusicPending||!regionMusicPlayer.paused)return true;
  const version=regionMusicVersion;
  try{
    regionMusicPending=true;
    Promise.resolve(regionMusicPlayer.play()).catch(()=>{
      // Autoplay may be blocked; a subsequent actual gesture retries safely.
      if(version===regionMusicVersion)regionMusicRetryAt=typeof performance==='undefined'?0:performance.now()+2000;
    }).finally(()=>{if(version===regionMusicVersion)regionMusicPending=false;});
    return true;
  }catch(_){regionMusicPending=false;return false;}
}
function unlockRegionMusic(){
  regionMusicUnlocked=true;regionMusicRetryAt=0;regionMusicRecoveries=0;
  if(regionMusicPlayer?.error&&regionMusicWanted()){regionMusicRecoveries=0;recoverRegionMusic();}
  else syncRegionMusic();
}
function updateRegionMusicButton(){
  const button=document.getElementById('menuMusicBtn');
  if(!button)return;
  button.textContent=regionMusicMuted?'음악 켜기':'음악 끄기';
  button.setAttribute('aria-pressed',String(regionMusicMuted));
}
function toggleRegionMusic(){
  regionMusicMuted=!regionMusicMuted;
  try{localStorage.setItem(REGION_MUSIC_MUTE_KEY,String(regionMusicMuted));}catch(_){}
  updateRegionMusicButton();unlockRegionMusic();
}
if(typeof document!=='undefined'){
  // A trusted tap/key starts HTML audio on Android as well as desktop.
  document.addEventListener('pointerdown',unlockRegionMusic);
  document.addEventListener('keydown',unlockRegionMusic);
  document.addEventListener('visibilitychange',()=>syncRegionMusic());
  window.addEventListener('pagehide',()=>{regionMusicPageActive=false;pauseRegionMusic();});
  window.addEventListener('pageshow',()=>{regionMusicPageActive=true;syncRegionMusic();});
  document.getElementById('menuMusicBtn')?.addEventListener('click',toggleRegionMusic);
  updateRegionMusicButton();syncRegionMusic();
  window.setInterval?.(monitorRegionMusic,1000);
}
