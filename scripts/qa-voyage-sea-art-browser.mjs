import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/voyage-sea-art-qa');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>typeof voyagePixelPolygon==='function'&&!document.getElementById('startupLoading'));
  await page.evaluate(()=>{
   enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));GAME_STATE.progression.coins=99999;
   GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',45)),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
   worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
  });
  const routes=[];
  for(const id of ['shallow','mid','deep','glacier']){
   await page.evaluate(id=>{
    worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;updateWorldClockUI();
    buyVoyageTickets(id);if(!departVoyage(id))throw Error('Cannot sail: '+id);
   },id);
   await page.waitForFunction(()=>!isVoyageBoarding());
   const shots=await page.evaluate(id=>{
    player.x=36;player.y=27;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;
    GAME_STATE.appearance.activeTool='rod';activeVoyage().tripSeed=42;
    const generator=createVoyageSceneGenerator(42,id),found=new Map();
    for(let i=0;i<24;i++){const scene=nextVoyageScene(generator),kind=voyageScenePool(id).landmarks[scene.landmark];if(!found.has(kind)&&scene.startMs<550000)found.set(kind,{kind,time:scene.startMs+6000});}
    return [...found.values()];
   },id);
   assert.equal(shots.length,6,'All six route-specific landmarks must be previewed');
   for(const {kind,time} of shots){
    const state=await page.evaluate(time=>{
     activeVoyage().remainingMs=600000-time;voyageClock.last=performance.now();drawWorld();
     return {cached:voyageSceneCache.composites.size,habitat:getFishingSpotInFront()?.fishingHabitat,kind:voyageScenePool(activeVoyage().destination).landmarks[voyageSceneCache.current.landmark],signature:voyageSceneCache.current.sceneSignature};
    },time);
    assert.equal(state.cached,2);assert.equal(state.kind,kind);assert.equal(state.habitat,id==='glacier'?'glacier':'boat_'+id);
    await page.screenshot({path:path.join(out,width+'-'+id+'-'+kind+'.png')});
   }
   const contract=await page.evaluate(()=>{
    const signature=voyageSceneCache.current.sceneSignature,built=voyageSceneCache.built,times=[];
    for(let i=0;i<120;i++){const start=performance.now();drawWorld();times.push(performance.now()-start);}times.sort((a,b)=>a-b);
    if(!startFishing())throw Error('Scenery changed a fishing spot');finishFishing();
    const trip=JSON.stringify(activeVoyage()),location={x:player.x,y:player.y};
    return {signature,extraCompositions:voyageSceneCache.built-built,median:times[60],p95:times[114],trip,location};
   });
   assert.equal(contract.extraCompositions,0);assert.ok(contract.median<50);
   await page.emulateMedia({reducedMotion:'reduce'});
   const reduced=await page.evaluate(()=>{drawWorld();return {signature:voyageSceneCache.current.sceneSignature,reduced:voyageMotionQuery.matches,location:{x:player.x,y:player.y}};});
   assert.equal(reduced.reduced,true);assert.equal(reduced.signature,contract.signature);assert.deepEqual(reduced.location,contract.location);
   await page.emulateMedia({reducedMotion:'no-preference'});
   const hidden=await page.evaluate(()=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));
    const before={remaining:activeVoyage().remainingMs,signature:voyageSceneCache.current.sceneSignature};updateVoyage(performance.now()+900000);drawWorld();
    const after={remaining:activeVoyage().remainingMs,signature:voyageSceneCache.current.sceneSignature};delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));return {before,after};
   });assert.deepEqual(hidden.before,hidden.after);
   const snapshot=await page.evaluate(()=>{saveGame();return {seed:activeVoyage().tripSeed,signature:voyageSceneCache.current.sceneSignature};});
   await page.reload();await page.waitForFunction(()=>typeof voyagePixelPolygon==='function'&&!document.getElementById('startupLoading')&&voyageSceneCache.current);
   const resumed=await page.evaluate(()=>({seed:activeVoyage().tripSeed,signature:voyageSceneCache.current.sceneSignature}));assert.deepEqual(resumed,snapshot);
   routes.push({id,shots:shots.map(s=>s.kind),...contract,reducedMotion:true,hiddenPause:true,restored:true});
   await page.evaluate(()=>returnFromVoyage());
  }
  reports.push({width,routes});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Voyage pixel sea browser passed: '+JSON.stringify({viewports:reports.map(r=>r.width),landmarkViews:reports.reduce((n,r)=>n+r.routes.reduce((v,t)=>v+t.shots.length,0),0),fourRoutes:true,unchangedFishing:true,hiddenPause:true,deterministicRestore:true,noSteadyCompositions:true,errors}));
}finally{await browser.close();}
