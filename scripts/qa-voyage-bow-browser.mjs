import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {decodePNG} from './lib/png.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/voyage-bow-qa');
fs.mkdirSync(out,{recursive:true});const bytes=fs.readFileSync('assets/voyage/voyage-bow-v1.png'),png=decodePNG(bytes);
assert.equal(png.width,168);assert.equal(png.height,336);assert.ok(png.data.some((v,i)=>i%4===3&&v===0));
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  // Live resources may finish loading after the game is already visible.
  // Observe restore before the loop, then permit only actual visible-page time.
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{
   const trip=typeof activeVoyage==='function'?activeVoyage():null;
   globalThis.bowInitialRestoredTrip=trip?JSON.parse(JSON.stringify(trip)):null;
  }));
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>typeof getWorldCameraTarget==='function'&&!document.getElementById('startupLoading'));
  const asset=await page.evaluate(async()=>{
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ASSET_URLS.voyageBow));
   return {loaded:imgs.voyageBow.complete,w:imgs.voyageBow.naturalWidth,h:imgs.voyageBow.naturalHeight,hash:Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')};
  });assert.ok(asset.loaded);assert.equal(asset.w,168);assert.equal(asset.h,336);
  assert.ok(['assets/voyage/voyage-bow-v1.png','data:image/png;base64,'+bytes.toString('base64')].some(s=>createHash('sha256').update(s).digest('hex')===asset.hash));
  await page.evaluate(()=>{
   enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));GAME_STATE.progression.coins=60000;
   GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',45)),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
   GAME_STATE.appearance.activeTool='rod';
  });
  const routes=[];
  for(const id of ['shallow','mid','deep','glacier']){
   await page.evaluate(id=>{buyVoyageTickets(id);if(!departVoyage(id))throw Error('Cannot depart');worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;},id);
   await page.waitForFunction(()=>!isVoyageBoarding());
   const layout=await page.evaluate(()=>{
    activeVoyage().tripSeed=20;activeVoyage().remainingMs=593000;voyageClock.last=performance.now();releaseVoyageScenes();drawWorld();
    const d=WORLD_DEFINITION.voyageDeck;
    return {view:d.view,left:d.x*TILE-camX,right:VIEW_W-((d.x+d.w)*TILE-camX),top:d.y*TILE-camY,bottom:(d.y+d.h)*TILE-camY,
     width:VIEW_W,height:VIEW_H,player:{x:player.x,y:player.y},camera:{x:camX,y:camY},walkable:bridgeSet.size,cabinY:d.cabin.y*TILE-camY};
   });assert.equal(layout.view,'bow');assert.deepEqual(layout.player,{x:32,y:20});assert.equal(layout.walkable,43);
   assert.ok(layout.left>=layout.width*.18&&layout.right>=layout.width*.18);assert.ok(layout.top>=layout.height*.5&&layout.top<=layout.height*.55);
   assert.ok(layout.bottom>layout.height&&layout.cabinY>layout.height);
   await page.screenshot({path:path.join(out,width+'-'+id+'-bow.png')});
   const positions=[['front',32,18,'up'],['left',29,21,'left'],['right',35,21,'right']];
   for(const [name,x,y,face] of positions){
    const state=await page.evaluate(({x,y,face})=>{
     clearMovement();player.x=x;player.y=y;player.face=face;player.px=x*TILE+TILE/2;player.py=y*TILE+TILE/2;drawWorld();
     const spot=getFishingSpotInFront();if(isBlocked(x,y)||!startFishing())throw Error('Cannot fish at '+face+' bow railing');finishFishing();
     return {camera:{x:camX,y:camY},habitat:spot.fishingHabitat};
    },{x,y,face});assert.deepEqual(state.camera,layout.camera);assert.equal(state.habitat,id==='glacier'?'glacier':'boat_'+id);
    await page.screenshot({path:path.join(out,width+'-'+id+'-'+name+'.png')});
   }
   const movement=await page.evaluate(()=>{
    clearMovement();player.x=32;player.y=20;player.px=32*TILE+TILE/2;player.py=20*TILE+TILE/2;
    tryMove('up');update(200);tryMove('up');update(200);tryMove('up');update(200);
    return {x:player.x,y:player.y,camera:{x:camX,y:camY},outsideBlocked:isBlocked(32,17),aftBlocked:isBlocked(32,25)};
   });assert.deepEqual({x:movement.x,y:movement.y},{x:32,y:18});assert.deepEqual(movement.camera,layout.camera);assert.ok(movement.outsideBlocked&&movement.aftBlocked);
   const aftSpot=await page.evaluate(()=>{player.x=32;player.y=24;player.face='down';return getFishingSpotInFront();});assert.equal(aftSpot,null,'Aft ship body is not fishing water');
   if(id==='shallow'){
    const motion=await page.evaluate(()=>{
     drawWorld();const scene=voyageSceneCache.current,layers=voyageSceneCache.composites.get(scene.index),calls=[],original=CanvasRenderingContext2D.prototype.drawImage;
     CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this===ctx&&(args[0]===layers.far||args[0]===layers.mid))calls.push({layer:args[0]===layers.far?'far':'mid',x:args[1],y:args[2],w:args[3]});return original.apply(this,args);};
     try{drawVoyageSceneLayers(scene,scene.startMs+4000,1,false);drawVoyageSceneLayers(scene,scene.startMs+6000,1,false);
      drawVoyageSceneLayers(scene,scene.startMs+4000,1,true);drawVoyageSceneLayers(scene,scene.startMs+6000,1,true);
     }finally{CanvasRenderingContext2D.prototype.drawImage=original;}
     const data=layers.mid.getContext('2d').getImageData(0,0,layers.mid.width,layers.mid.height),third=Math.floor(data.width/3);let left=0,right=0;
     for(let y=0;y<data.height;y++)for(let x=0;x<data.width;x++){if(data.data[(y*data.width+x)*4+3]>0){if(x<third)left++;if(x>=data.width-third)right++;}}
     return {calls,left,right};
    });assert.ok(motion.left>20&&motion.right>20,'Both side lanes must have scenery');
    assert.ok(motion.calls[2].y>motion.calls[0].y&&motion.calls[3].y>motion.calls[1].y);
    assert.ok(motion.calls[3].y-motion.calls[1].y>motion.calls[2].y-motion.calls[0].y);
    assert.ok(motion.calls[6].y-motion.calls[4].y<motion.calls[2].y-motion.calls[0].y);
    assert.ok(motion.calls.every(c=>c.x<0&&c.x+c.w>540),'Layer edges should be naturally clipped, not fitted');
    await page.evaluate(()=>{weatherState.kind='rain';updateWorldClockUI();drawWorld();});
    await page.screenshot({path:path.join(out,width+'-shallow-rain.png')});await page.evaluate(()=>weatherState.kind='clear');
   }
   await page.evaluate(()=>{player.x=32;player.y=21;player.face='down';interact();});
   assert.ok(await page.locator('[data-voyage-return]').isVisible());await page.evaluate(()=>closeHarbor({fromHistory:true}));
   const migration=await page.evaluate(()=>{
    const saved=createSaveData();saved.state.location={regionId:GAME_STATE.regionId,x:36,y:27,face:'right'};
    localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(saved));
    const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key!==SAVE_CONFIG.key)return original.call(this,key,value);};
    return {trip:saved.state.progression.voyage.activeTrip,tickets:saved.state.progression.voyage.ticketCounts,coins:saved.state.progression.coins};
   });
   await page.reload();await page.waitForFunction(()=>typeof getWorldCameraTarget==='function'&&!document.getElementById('startupLoading')&&voyageSceneCache.current);
   const restored=await page.evaluate(()=>({trip:{...activeVoyage()},tickets:{...voyageProgress().ticketCounts},coins:GAME_STATE.progression.coins,
    player:{x:player.x,y:player.y},camera:{x:camX,y:camY},initialTrip:globalThis.bowInitialRestoredTrip,uptime:performance.now()}));
   assert.deepEqual(restored.player,{x:32,y:20});assert.deepEqual(restored.camera,layout.camera);
   assert.equal(restored.trip.tripSeed,migration.trip.tripSeed);assert.equal(restored.trip.destination,migration.trip.destination);
   assert.equal(restored.initialTrip.remainingMs,migration.trip.remainingMs,'Navigation/offline time must not be charged during restore');
   const visibleElapsed=migration.trip.remainingMs-restored.trip.remainingMs;
   assert.ok(visibleElapsed>=0&&visibleElapsed<=restored.uptime+300,'Only new-page visible time may elapse after restore');
   assert.deepEqual(restored.tickets,migration.tickets);assert.equal(restored.coins,migration.coins);
   routes.push({id,layout,threeRailings:true,cameraFixed:true,legacyMigration:true,tripPreserved:true});
   await page.evaluate(()=>returnFromVoyage());
  }
  reports.push({width,routes});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Voyage bow browser passed: '+JSON.stringify({viewports:reports.map(r=>r.width),fourRoutes:true,threeSeaSides:true,croppedAft:true,fixedCamera:true,downwardSideParallax:true,threeRailings:true,captainReturn:true,legacyTripMigration:true,errors}));
}finally{await browser.close();}
