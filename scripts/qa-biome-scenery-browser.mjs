import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/biome-scenery-v1');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
const ready=page=>page.waitForFunction(()=>typeof drawSceneryImage==='function'&&!document.getElementById('startupLoading'));
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base,{timeout:60000});await ready(page);
  const assets=await page.evaluate(()=>['sceneryRidgeWest','sceneryRidgeEast','sceneryWaterfall','scenerySwampBank','sceneryLilyPads'].map(id=>({id,w:imgs[id].naturalWidth,h:imgs[id].naturalHeight})));
  assert(assets.every(a=>a.w&&a.h));
  for(const [name,id,x,y] of [['ridge-west','mountainLake',18,14],['ridge-east','mountainLake',43,14],['waterfall','waterfallValley',36,22],['swamp-shore','reedSwamp',29,24],['swamp-pier','reedSwamp',33,38],['forest-falls','forestFive',38,19]]){
   await page.evaluate(({id,x,y})=>{
    enterWorldRegion({to:id,entry:{x,y,face:'down'}},{skipSave:true});
    if(isBlocked(x,y))throw Error('Scene observation tile blocked '+id);
    clearMovement();player.moving=false;GAME_STATE.appearance.activeTool='rod';
    worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
    const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();
   },{id,x,y});
   await page.waitForTimeout(80);await page.screenshot({path:path.join(out,width+'-'+name+'.png')});
  }
  const swamp=await page.evaluate(()=>{
   enterWorldRegion({to:'reedSwamp',entry:{x:33,y:38,face:'left'}},{skipSave:true});
   const banks=getSwampSceneryBanks(),again=getSwampSceneryBanks();
   if(banks!==again||banks.some(b=>!waterSet.has(key(Math.floor(b.x),Math.floor(b.y)))))throw Error('Swamp banks not cached/fixed in water');
   if(!bridgeSet.has('33,38')||blocked.has('33,38'))throw Error('Boardwalk changed');
   const before=JSON.stringify(GAME_STATE);
   for(let tick=0;tick<12;tick++){tNow+=333;drawWorld();}
   if(JSON.stringify(GAME_STATE)!==before)throw Error('Scenery changed gameplay state');
   return {banks:banks.length,pads:WORLD_DEFINITION.terrain.lilyPads.length};
  });
  assert(swamp.banks>3);assert.equal(swamp.pads,11);
  await page.evaluate(()=>{worldTime.minutes=1320;weatherState.kind='rain';drawWorld();});
  await page.screenshot({path:path.join(out,width+'-night-rain.png')});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert(await page.evaluate(()=>sceneryMotionQuery.matches));
  await page.evaluate(()=>drawWorld());await page.screenshot({path:path.join(out,width+'-reduced-motion.png')});
  reports.push({width,assets,swamp,reducedMotion:true});await context.close();
  console.log(width+'px scenery browser passed: art loaded, fixed swamp placements, boardwalk, read-only render, night/rain/reduced motion');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
}finally{await browser.close();}
