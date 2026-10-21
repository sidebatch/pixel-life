import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4190/dist/index.html';
const out=path.resolve(process.argv[2]||'output/hunting-terrain-qa/polish');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const [width,height]of [[393,780],[320,568],[1280,800]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base+'?time=12:00&weather=clear',{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']&&imgs.huntingCliff);
  await page.evaluate(()=>{
   document.getElementById('startupLoading')?.remove();worldTime.debugLocked=true;worldTime.minutes=720;weatherState.debugLocked=true;weatherState.kind='clear';
   window.__place=(x,y,face='up')=>{clearMovement();lifeUi.chop=null;Object.assign(player,{x,y,face,px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false,t:0});const cam=getWorldCameraTarget();camX=cam.x;camY=cam.y;drawWorld();refreshContext();};
   __place(48,38);
  });
  await page.screenshot({path:path.join(out,width+'-cave.png')});
  await page.evaluate(()=>{__place(48,36);tryMove('up');update(player.duration);updateHunting(0);__place(28,21);});
  assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'wildwoodHunt');
  await page.screenshot({path:path.join(out,width+'-ridge-path.png')});
  await page.locator('[data-quick-tool="sword"]').click();
  const result=await page.evaluate(async()=>{
   const originalRandom=Math.random,originalSwing=playHuntingSwing,originalImpact=playHuntingImpact;
   let swings=[],impacts=0,rolls=0;playHuntingSwing=(...args)=>swings.push(args);playHuntingImpact=()=>impacts++;
   const economy=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections});
   for(const a of huntingState.animals){resetHuntingAnimal(a);a.wait=1e9;}
   const a=huntingState.animals[0];__place(a.x,a.y+1);Math.random=()=>{rolls++;return .9;};
   const tools=[];
   for(const tool of ['sword','axe','sickle','rod']){
    GAME_STATE.appearance.activeTool=tool;lifeUi.chop=null;const before=swings.length;
    if(!startHeldToolSwing())throw Error('No free '+tool+' swing');
    if(startHeldToolSwing())throw Error('Busy action accepted');
    const at=lifeUi.chop.startedAt;updateLifeContentUi(at+270);updateLifeContentUi(at+300);updateLifeContentUi(at+701);
    if(swings.length!==before+1||impacts!==0||a.hp!==64)throw Error('Duplicate whoosh or miss impact');
    tools.push({tool,whooshes:swings.length-before});
   }
   if(rolls!==4||a.mode!=='idle')throw Error('A miss rolled twice or provoked a neutral animal');
   Math.random=()=>.1;GAME_STATE.appearance.activeTool='sword';startHeldToolSwing();
   const at=lifeUi.chop.startedAt;updateLifeContentUi(at+270);updateLifeContentUi(at+701);
   if(a.hp!==48||impacts!==1)throw Error('A real player hit needs one impact');
   huntingState.hp=100;huntingState.hurtUntil=0;a.windup={at:huntingState.clock,x:player.px,y:player.py,face:'down'};
   const before=swings.length;for(let i=0;i<35;i++)updateHunting(20);
   if(swings.length!==before+1||huntingState.hp!==88||impacts!==2)throw Error('Animal sound/damage must coincide with one strike');
   let seed=710821;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   const trial={player:0,animal:0,count:10000};
   for(let i=0;i<trial.count;i++){
    a.hp=64;a.mode='idle';if(strikeHuntingWildlife({mode:'sword',regionId:GAME_STATE.regionId}))trial.player++;
    if(![48,64].includes(a.hp))throw Error('Wrong hit/miss damage');
    a.mode='aggro';huntingState.hp=100;huntingState.hurtUntil=0;if(hurtHuntingPlayer(a))trial.animal++;
    if(![88,100].includes(huntingState.hp))throw Error('Wrong animal hit/miss damage');
   }
   if(Math.abs(trial.player/trial.count-.6)>.02||Math.abs(trial.animal/trial.count-.6)>.02)throw Error('Asymmetric probability '+JSON.stringify(trial));
   playHuntingSwing=originalSwing;playHuntingImpact=originalImpact;
   // Render the actual synthesis through Web Audio, without consuming gameplay RNG.
   const audio=[],originalPlay=playFishingAudio,rollBefore=seed;
   for(const kind of ['sword','axe','sickle','rod','bear','wolf','hit','hurt']){
    const offline=new OfflineAudioContext(1,22050,44100);playFishingAudio=callback=>callback(offline);
    if(kind==='hit'||kind==='hurt')playHuntingImpact(kind==='hurt');else playHuntingSwing(kind,['bear','wolf'].includes(kind));
    const samples=(await offline.startRendering()).getChannelData(0);let peak=0,energy=0,nonzero=0;
    for(const s of samples){peak=Math.max(peak,Math.abs(s));energy+=s*s;if(Math.abs(s)>.0001)nonzero++;}
    if(peak<.008||peak>=.9||nonzero<1000)throw Error('Silent/clipped audio '+kind);
    audio.push({kind,peak,rms:Math.sqrt(energy/samples.length),audibleSamples:nonzero});
   }
   playFishingAudio=originalPlay;if(seed!==rollBefore)throw Error('Audio changed combat randomness');Math.random=originalRandom;
   const realtime=getGameAudioContext();await realtime.resume();if(realtime.state!=='running')throw Error('Audio context not unlocked by tool button');
   playHuntingSwing('sword');playHuntingImpact();
   const unchanged=economy===JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections});
   // Collision and pathfinding around a raised ledge, independently of the attack roll.
   for(const animal of huntingState.animals){resetHuntingAnimal(animal);animal.wait=1e9;}
   __place(22,25);const c=huntingState.animals[0];Object.assign(c,{x:22,y:30,px:22.5*TILE,py:30.5*TILE,homeX:22,homeY:30,mode:'aggro',lastHit:huntingState.clock,moving:false,windup:null,attackRecovery:null,wait:0});
   const route=[];let crossed=false;huntingState.hp=100;
   for(let i=0;i<300&&Math.hypot(c.x-player.x,c.y-player.y)>1.45;i++){
    updateHunting(40);if(blocked.has(key(c.x,c.y)))throw Error('Animal walked through ridge');
    if(!route.some(p=>p.x===c.x&&p.y===c.y))route.push({x:c.x,y:c.y});
    if(c.x<20||c.x>=27)crossed=true;
   }
   if(!crossed||Math.hypot(c.x-player.x,c.y-player.y)>1.45)throw Error('Animal could not route around solid ridge');
   return {tools,trial,audio,unchanged,route,audioRunning:realtime.state==='running'};
  });assert(result.unchanged);reports.push({width,...result});
  if(width===393){
   const pixels=await page.evaluate(()=>{
    enterWorldRegion(REGION_EXITS.wildwoodHunt[0]);enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='wildwoodHunt'));
    const overview=document.createElement('canvas');overview.width=1152;overview.height=864;const c=overview.getContext('2d');c.imageSmoothingEnabled=false;
    for(let y=0;y<MAP_H*TILE;y+=VIEW_H)for(let x=0;x<MAP_W*TILE;x+=VIEW_W){camX=x;camY=y;drawWorld();c.drawImage(canvas,x*.375,y*.375,VIEW_W*.375,VIEW_H*.375);}
    return overview.toDataURL('image/png').split(',')[1];
   });fs.writeFileSync(path.join(out,'hunting-overview.png'),Buffer.from(pixels,'base64'));
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Hunting polish browser passed: 320/393/1280px cave/terrain; all four tool whooshes, hit-only impacts, symmetric 10k real attack trials, 8 Web Audio waveforms, audio unlock and obstacle routing.');
}finally{await browser.close();}
