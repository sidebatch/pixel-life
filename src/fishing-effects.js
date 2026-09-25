const FISHING_RARITY_EFFECTS=Object.freeze({
  rare:Object.freeze({label:'RARE CATCH',particles:16,distance:112,tones:[659.25,783.99,987.77]}),
  heroic:Object.freeze({label:'HEROIC CATCH',particles:22,distance:132,tones:[523.25,659.25,783.99,1046.5]}),
  legendary:Object.freeze({label:'LEGENDARY CATCH',particles:30,distance:154,tones:[392,523.25,659.25,783.99,1046.5]})
});

let gameAudioContext=null;
let fishingRarityEffectTimer=null;
const GAME_SOUND_URLS=Object.freeze({
  cast:'assets/fishing/audio/cast.mp3',
  bite:'assets/fishing/audio/bite.mp3',
  catch:'assets/fishing/audio/catch.mp3',
  levelUp:'assets/audio/level-up.mp3',
  marketSale:'assets/audio/market-sale.mp3'
});
const gameSoundPlayers=new Map();
const gameSoundBuffers=new Map();
const gameSoundSources=new Map();

function getGameAudioContext(){
  const AudioContextClass=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
  if(!AudioContextClass) return null;
  try{
    gameAudioContext ||= new AudioContextClass({latencyHint:'interactive'});
    return gameAudioContext;
  }catch(_){return null;}
}

async function preloadGameSound(kind,context){
  try{
    const response=await fetch(GAME_SOUND_URLS[kind]);
    if(!response.ok) return;
    gameSoundBuffers.set(kind,await context.decodeAudioData(await response.arrayBuffer()));
  }catch(_){/* The HTMLAudioElement fallback remains available. */}
}

const gameSoundContext=getGameAudioContext();
const gameSoundLoadPromise=gameSoundContext&&typeof fetch==='function'
  ?Promise.all(Object.keys(GAME_SOUND_URLS).map(kind=>preloadGameSound(kind,gameSoundContext)))
  :Promise.resolve();

function resumeGameAudio(){
  const context=getGameAudioContext();
  if(context?.state==='suspended') context.resume().catch(()=>{});
}

if(typeof document!=='undefined'){
  document.addEventListener('pointerdown',resumeGameAudio,{once:true});
  document.addEventListener('keydown',resumeGameAudio,{once:true});
}

function getGameSoundPlayer(kind){
  if(!GAME_SOUND_URLS[kind]||typeof Audio==='undefined') return null;
  if(!gameSoundPlayers.has(kind)){
    try{
      const player=new Audio(GAME_SOUND_URLS[kind]);
      player.preload='auto';
      player.load();
      gameSoundPlayers.set(kind,player);
    }catch(_){return null;}
  }
  return gameSoundPlayers.get(kind);
}

function stopGameSound(kind){
  const source=gameSoundSources.get(kind);
  if(source){
    try{source.stop();}catch(_){}
    gameSoundSources.delete(kind);
  }
  gameSoundPlayers.get(kind)?.pause();
}

function playGameSample(kind){
  try{
    if(kind==='cast'){
      stopGameSound('bite');
      stopGameSound('catch');
    }else if(kind==='bite') stopGameSound('cast');
    else if(kind==='catch'){
      stopGameSound('cast');
      stopGameSound('bite');
    }
    stopGameSound(kind);
    const context=getGameAudioContext();
    const buffer=gameSoundBuffers.get(kind);
    if(context&&buffer){
      const source=context.createBufferSource();
      source.buffer=buffer;
      source.connect(context.destination);
      source.onended=()=>{
        if(gameSoundSources.get(kind)===source) gameSoundSources.delete(kind);
      };
      gameSoundSources.set(kind,source);
      source.start();
      resumeGameAudio();
      return true;
    }
    const player=getGameSoundPlayer(kind);
    if(!player) return false;
    player.pause();
    player.currentTime=0;
    player.play()?.catch(()=>{});
    return true;
  }catch(_){
    return false;
  }
}

function stopFishingSound(kind){stopGameSound(kind);}
function playFishingCastSound(){return playGameSample('cast');}
function playFishingBiteSound(){return playGameSample('bite');}
function playFishingCatchSound(){return playGameSample('catch');}
function playSkillLevelUpSound(){return playGameSample('levelUp');}
function playMarketSaleSound(){return playGameSample('marketSale');}

function playForestryChopSound(cut=false){
  return playFishingAudio(context=>{
    const start=context.currentTime;
    const tone=context.createOscillator(),gain=context.createGain();
    tone.type='triangle';
    tone.frequency.setValueAtTime(cut?150:210,start);
    tone.frequency.exponentialRampToValueAtTime(cut?65:95,start+.12);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(cut?.12:.08,start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,start+.18);
    tone.connect(gain);gain.connect(context.destination);
    tone.start(start);tone.stop(start+.19);
  });
}

for(const kind of Object.keys(GAME_SOUND_URLS)) getGameSoundPlayer(kind);

function clearFishingRarityEffect(dialog=document.getElementById('dialog')){
  if(fishingRarityEffectTimer!==null){
    clearTimeout(fishingRarityEffectTimer);
    fishingRarityEffectTimer=null;
  }
  dialog?.querySelector('.fishingRarityFx')?.remove();
  dialog?.classList.remove('rarityCelebration');
}

function renderFishingRarityEffect(dialog,rarity){
  clearFishingRarityEffect(dialog);
  const effect=FISHING_RARITY_EFFECTS[rarity];
  if(!dialog||!effect) return false;
  const layer=document.createElement('div');
  layer.className=`fishingRarityFx rarity-${rarity}`;
  layer.setAttribute('aria-hidden','true');

  const rays=document.createElement('span');
  rays.className='fishingRarityRays';
  const banner=document.createElement('b');
  banner.className='fishingRarityBanner';
  banner.textContent=effect.label;
  layer.append(rays,banner);

  for(let index=0;index<effect.particles;index++){
    const angle=Math.PI*2*index/effect.particles+(index%3)*.11;
    const distance=effect.distance*(.7+(index%5)*.075);
    const particle=document.createElement('i');
    particle.className=`fishingRarityParticle shape-${index%3}`;
    particle.style.setProperty('--tx',`${(Math.cos(angle)*distance).toFixed(1)}px`);
    particle.style.setProperty('--ty',`${(Math.sin(angle)*distance).toFixed(1)}px`);
    particle.style.setProperty('--delay',`${(index%7)*24}ms`);
    particle.style.setProperty('--spin',`${90+(index%4)*45}deg`);
    layer.append(particle);
  }
  dialog.append(layer);
  dialog.classList.add('rarityCelebration');
  fishingRarityEffectTimer=setTimeout(()=>clearFishingRarityEffect(dialog),2200);
  return true;
}

function scheduleFishingTone(context,frequency,start,duration,type,volume){
  const oscillator=context.createOscillator();
  const gain=context.createGain();
  oscillator.type=type;
  oscillator.frequency.setValueAtTime(frequency,start);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.025);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain);gain.connect(context.destination);
  oscillator.start(start);oscillator.stop(start+duration+.03);
}

function playFishingAudio(play){
  try{
    const context=getGameAudioContext();
    if(!context) return false;
    if(context.state==='suspended') context.resume().then(()=>play(context)).catch(()=>{});
    else play(context);
    return true;
  }catch(_){
    return false;
  }
}

function playFishingRaritySound(rarity){
  const effect=FISHING_RARITY_EFFECTS[rarity];
  if(!effect) return false;
  return playFishingAudio(context=>{
    const now=context.currentTime+.54;
    effect.tones.forEach((frequency,index)=>{
      const start=now+index*(rarity==='legendary'?.105:.085);
      const duration=rarity==='legendary'?.64:rarity==='heroic'?.5:.38;
      const type=rarity==='rare'?'sine':index%2?'sine':'triangle';
      scheduleFishingTone(context,frequency,start,duration,type,.035);
      if(rarity==='legendary') scheduleFishingTone(context,frequency*2,start+.04,.42,'sine',.012);
    });
    if(rarity==='legendary') scheduleFishingTone(context,98,now,.95,'sine',.026);
  });
}

function showFishingRarityEffect(dialog,rarity){
  const rendered=renderFishingRarityEffect(dialog,rarity);
  if(rendered) playFishingRaritySound(rarity);
  return rendered;
}
