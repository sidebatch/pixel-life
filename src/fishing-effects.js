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

function playFishingRaritySound(rarity){
  const effect=FISHING_RARITY_EFFECTS[rarity];
  const AudioContextClass=typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext);
  if(!effect||!AudioContextClass) return false;
  try{
    fishingAudioContext ||= new AudioContextClass();
    const play=()=>{
      const now=fishingAudioContext.currentTime+.015;
      effect.tones.forEach((frequency,index)=>{
        const start=now+index*(rarity==='legendary'?.105:.085);
        const duration=rarity==='legendary'?.64:rarity==='heroic'?.5:.38;
        const type=rarity==='rare'?'sine':index%2?'sine':'triangle';
        scheduleFishingTone(fishingAudioContext,frequency,start,duration,type,.035);
        if(rarity==='legendary') scheduleFishingTone(fishingAudioContext,frequency*2,start+.04,.42,'sine',.012);
      });
      if(rarity==='legendary') scheduleFishingTone(fishingAudioContext,98,now,.95,'sine',.026);
    };
    if(fishingAudioContext.state==='suspended') fishingAudioContext.resume().then(play).catch(()=>{});
    else play();
    return true;
  }catch(_){
    return false;
  }
}

function showFishingRarityEffect(dialog,rarity){
  const rendered=renderFishingRarityEffect(dialog,rarity);
  if(rendered) playFishingRaritySound(rarity);
  return rendered;
}
