import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4190/dist/index.html',out=path.resolve(process.argv[2]||'output/hunting-dynamic-qa/music');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),reports=[],errors=[];
try{
 for(const fault of [true,false]){
  const context=await browser.newContext({viewport:{width:393,height:780},hasTouch:true,isMobile:true,serviceWorkers:fault?'block':'allow'}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));let failNext=false,aborted=0;
  if(fault)await page.route('**/assets/audio/music/meadow.mp3',route=>{if(failNext){failNext=false;aborted++;return route.abort('failed');}return route.continue();});
  await page.goto(base,{waitUntil:'load',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
  await page.evaluate(()=>{window.__musicErrors=[];regionMusicPlayer.addEventListener('error',()=>__musicErrors.push({time:regionMusicPlayer.currentTime,message:regionMusicPlayer.error?.message}));});
  await page.locator('#game').tap({position:{x:180,y:260}});
  await page.waitForFunction(()=>regionMusicPlayer.currentTime>.5&&!regionMusicPlayer.paused,null,{timeout:20000});
  await page.evaluate(async()=>{const c=getGameAudioContext();await c.resume();const src=c.createMediaElementSource(regionMusicPlayer);window.__musicAnalyser=c.createAnalyser();__musicAnalyser.fftSize=2048;src.connect(__musicAnalyser);__musicAnalyser.connect(c.destination);});
  const rows=[];
  for(const region of ['oldForest','sunnyFields','wildwoodHunt','coast','mountainLake','deepForest']){
   await page.evaluate(id=>enterWorldRegion({to:id}),region);
   await page.waitForFunction(()=>!regionMusicPlayer.error&&regionMusicPlayer.currentTime>.25,null,{timeout:20000});
   if(fault&&region==='oldForest')failNext=true;
   await page.evaluate(()=>enterWorldRegion({to:'lilacVillage'}));
   await page.waitForFunction(()=>!regionMusicPlayer.error&&regionMusicPlayer.currentTime>.5&&!regionMusicPending,null,{timeout:20000});
   const start=await page.evaluate(()=>regionMusicPlayer.currentTime);
   await page.waitForFunction(t=>!regionMusicPlayer.error&&!regionMusicPlayer.paused&&regionMusicPlayer.currentTime>t+1,start,{timeout:6000});
   const row=await page.evaluate(()=>{const data=new Float32Array(__musicAnalyser.fftSize);__musicAnalyser.getFloatTimeDomainData(data);return {track:regionMusicTrack,time:regionMusicPlayer.currentTime,paused:regionMusicPlayer.paused,error:regionMusicPlayer.error?.message||null,recoveries:regionMusicRecoveries,rms:Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length)};});
   assert.equal(row.track,'meadow');assert(!row.paused&&!row.error&&row.time>start+1,JSON.stringify({fault,region,start,row,events:await page.evaluate(()=>__musicErrors)}));assert(row.rms>.00001,'Village track must contain audible samples');rows.push({from:region,...row});
  }
  const last=await page.evaluate(()=>regionMusicPlayer.currentTime);await page.waitForTimeout(9000);
  const continuous=await page.evaluate(()=>({time:regionMusicPlayer.currentTime,error:regionMusicPlayer.error?.message,paused:regionMusicPlayer.paused,hidden:document.hidden,recoveries:regionMusicRecoveries,pending:regionMusicPending,wanted:regionMusicWanted(),audioState:getGameAudioContext().state,events:__musicErrors}));
  assert(!continuous.error&&!continuous.paused&&continuous.time>last+7,JSON.stringify({fault,last,continuous}));
  // Intentional mute must stay paused despite the watchdog, then resume in place.
  await page.evaluate(()=>toggleRegionMusic());await page.waitForTimeout(1300);assert(await page.evaluate(()=>regionMusicPlayer.paused&&regionMusicMuted));
  await page.evaluate(()=>toggleRegionMusic());await page.waitForFunction(()=>!regionMusicPlayer.paused);
  const events=await page.evaluate(()=>__musicErrors);if(fault){assert.equal(aborted,1);assert(events.length>=1,'Inject a real network/media failure before proving recovery');}
  reports.push({fault,aborted,rows,mediaErrors:events,continuousVillage:true,muteRespected:true});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Music browser passed: real failed media request automatically recovered without another gesture, six village round trips with audible progressing music, long return playback, cache-enabled context and mute respected.');
}finally{await browser.close();}
