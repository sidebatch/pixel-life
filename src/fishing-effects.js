const FISHING_RARITY_EFFECTS=Object.freeze({
  rare:Object.freeze({label:'RARE CATCH',particles:16,distance:112,tones:[659.25,783.99,987.77]}),
  heroic:Object.freeze({label:'HEROIC CATCH',particles:22,distance:132,tones:[523.25,659.25,783.99,1046.5]}),
  legendary:Object.freeze({label:'LEGENDARY CATCH',particles:30,distance:154,tones:[392,523.25,659.25,783.99,1046.5]})
});

let fishingAudioContext=null;
let fishingRarityEffectTimer=null;

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

function scheduleFishingSweep(context,from,to,start,duration,volume){
  const oscillator=context.createOscillator();
  const gain=context.createGain();
  oscillator.type='sine';
  oscillator.frequency.setValueAtTime(from,start);
  oscillator.frequency.exponentialRampToValueAtTime(to,start+duration);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.018);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain);gain.connect(context.destination);
  oscillator.start(start);oscillator.stop(start+duration+.02);
}

function scheduleFishingSplash(context,start,duration,volume){
  const sampleCount=Math.ceil(context.sampleRate*duration);
  const buffer=context.createBuffer(1,sampleCount,context.sampleRate);
  const samples=buffer.getChannelData(0);
  let seed=17391;
  for(let index=0;index<sampleCount;index++){
    seed=(seed*1664525+1013904223)>>>0;
    samples[index]=(seed/2147483648-1);
  }
  const source=context.createBufferSource();
  const filter=context.createBiquadFilter();
  const gain=context.createGain();
  source.buffer=buffer;
  filter.type='lowpass';filter.frequency.setValueAtTime(1800,start);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.018);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  source.connect(filter);filter.connect(gain);gain.connect(context.destination);
  source.start(start);source.stop(start+duration+.02);
}

function playFishingAudio(play){
  const AudioContextClass=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
  if(!AudioContextClass) return false;
  try{
    fishingAudioContext ||= new AudioContextClass();
    if(fishingAudioContext.state==='suspended') fishingAudioContext.resume().then(()=>play(fishingAudioContext)).catch(()=>{});
    else play(fishingAudioContext);
    return true;
  }catch(_){
    return false;
  }
}

function playFishingCastSound(){
  return playFishingAudio(context=>{
    const now=context.currentTime+.015;
    scheduleFishingSplash(context,now,.34,.085);
    scheduleFishingSweep(context,410,195,now+.035,.21,.036);
    scheduleFishingSweep(context,520,270,now+.15,.16,.02);
  });
}

function playFishingCatchSound(){
  return playFishingAudio(context=>{
    const now=context.currentTime+.015;
    scheduleFishingSplash(context,now,.13,.036);
    scheduleFishingSweep(context,360,530,now+.035,.15,.027);
    scheduleFishingSweep(context,520,735,now+.13,.18,.023);
  });
}

function playFishingRaritySound(rarity){
  const effect=FISHING_RARITY_EFFECTS[rarity];
  if(!effect) return false;
  return playFishingAudio(context=>{
    const now=context.currentTime+.19;
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
