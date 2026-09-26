// Long tracks stream separately; never decode three six-minute PCM buffers.
const REGION_MUSIC_URLS=Object.freeze({
  meadow:'assets/audio/music/meadow.mp3',
  woodland:'assets/audio/music/woodland.mp3',
  lakeside:'assets/audio/music/lakeside.mp3'
});
const REGION_MUSIC_TRACKS=Object.freeze({
  lilacVillage:'meadow',oldForest:'woodland',deepForest:'woodland',sunnyFields:'lakeside'
});
const REGION_MUSIC_VOLUME=.3;
const REGION_MUSIC_MUTE_KEY='pixel-life.music-muted.v1';
let regionMusicPlayer=null,regionMusicTrack=null,regionMusicUnlocked=false;
let regionMusicPending=false,regionMusicVersion=0,regionMusicMuted=false;
try{regionMusicMuted=localStorage.getItem(REGION_MUSIC_MUTE_KEY)==='true';}catch(_){}

function pauseRegionMusic(){
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
    }catch(_){return false;}
  }
  if(track!==regionMusicTrack){
    regionMusicVersion++;regionMusicPending=false;
    regionMusicPlayer.pause();regionMusicTrack=track;
    if(track){regionMusicPlayer.src=REGION_MUSIC_URLS[track];regionMusicPlayer.load();}
    else {regionMusicPlayer.removeAttribute('src');regionMusicPlayer.load();}
  }
  if(!track||regionMusicMuted||document.hidden||!regionMusicUnlocked){
    pauseRegionMusic();return false;
  }
  // Same-track travel (forest 1-1/1-2) and ordinary input must not restart it.
  if(regionMusicPending||!regionMusicPlayer.paused)return true;
  const version=regionMusicVersion;
  try{
    regionMusicPending=true;
    Promise.resolve(regionMusicPlayer.play()).catch(()=>{
      // Autoplay may be blocked; a subsequent actual gesture retries safely.
    }).finally(()=>{if(version===regionMusicVersion)regionMusicPending=false;});
    return true;
  }catch(_){regionMusicPending=false;return false;}
}
function unlockRegionMusic(){regionMusicUnlocked=true;syncRegionMusic();}
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
  window.addEventListener('pagehide',pauseRegionMusic);
  window.addEventListener('pageshow',()=>syncRegionMusic());
  document.getElementById('menuMusicBtn')?.addEventListener('click',toggleRegionMusic);
  updateRegionMusicButton();syncRegionMusic();
}
