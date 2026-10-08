import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {decodePNG,alphaBounds} from './lib/png.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/harbor-art-qa');
fs.mkdirSync(out,{recursive:true});
const spriteSpecs=[['harborBoat','harbor-boat-v2',192,168],['harborTicketBooth','harbor-ticket-booth-v2',96,88],['voyageDeck','voyage-deck-v2',216,336],['voyageCabin','voyage-cabin-v2',144,132],['harborCrate','harbor-crate-v2',32,32]];
for(const [,id,w,h] of spriteSpecs){
 const image=decodePNG(fs.readFileSync('assets/harbor/'+id+'.png')),bounds=alphaBounds(image);
 assert.equal(image.width,w);assert.equal(image.height,h);assert.ok(bounds.width>0&&bounds.height>0);
 assert.ok(image.data.some((v,i)=>i%4===3&&v===0));assert.ok(fs.existsSync('assets/harbor/source/'+id+'.png'));
}
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>typeof drawVoyageSea==='function'&&!document.getElementById('startupLoading'));
  const assets=await page.evaluate(async()=>Promise.all(['harborBoat','harborTicketBooth','voyageDeck','voyageCabin','harborCrate'].map(async key=>{
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ASSET_URLS[key]));
   return {key,width:imgs[key]?.naturalWidth,height:imgs[key]?.naturalHeight,loaded:imgs[key]?.complete,sourceHash:Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')};
  })));
  for(const [key,id,w,h] of spriteSpecs){
   const asset=assets.find(a=>a.key===key),url='assets/harbor/'+id+'.png';
   const sources=[url,'data:image/png;base64,'+fs.readFileSync(url).toString('base64')];
   assert.ok(asset.loaded);assert.equal(asset.width,w);assert.equal(asset.height,h);
   assert.ok(sources.some(source=>createHash('sha256').update(source).digest('hex')===asset.sourceHash),'Browser must load the selected v2 art: '+key);
  }
  await page.evaluate(()=>{
   worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
   enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));
  });
  for(const [name,x,y] of [['booth',36,23],['boat',45,36],['plaza',42,25]]){
   await page.evaluate(({x,y})=>{
    if(blocked.has(x+','+y))throw Error('Harbor preview must stand on a walkable tile');
    player.x=x;player.y=y;player.face='down';player.px=x*TILE+TILE/2;player.py=y*TILE+TILE/2;
    camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;drawWorld();
   },{x,y});await page.screenshot({path:path.join(out,width+'-harbor-'+name+'.png')});
  }
  await page.evaluate(()=>{player.x=36;player.y=23;player.face='up';interact();});
  assert.ok((await page.locator('#harborRoutes').textContent()).includes('빙하 해역'));
  await page.locator('#harborClose').tap();
  const routes=[];
  for(const id of ['shallow','mid','deep','glacier']){
   await page.evaluate(id=>{
    GAME_STATE.progression.coins=50000;
    GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',45)),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
    if(!buyVoyageTickets(id)||!departVoyage(id))throw Error('Could not depart: '+id);
   },id);await page.waitForFunction(()=>!isVoyageBoarding());
   const pose=await page.evaluate(id=>{
    const route=VOYAGE_ROUTE_BY_ID.get(id);
    player.x=32;player.y=26;player.face='down';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;
    activeVoyage().tripSeed=42;activeVoyage().remainingMs=594000;voyageClock.last=performance.now();drawWorld();
    return {id,region:GAME_STATE.regionId,habitat:WORLD_DEFINITION.waterAreas[0].fishingHabitat,deck:WORLD_DEFINITION.voyageDeck,cabinBlocked:blocked.has('32,20'),floorWalkable:!blocked.has('32,26'),coins:GAME_STATE.progression.coins,price:route.price};
   },id);
   assert.deepEqual(pose.deck,{x:28,y:18,w:9,h:14,cabin:{x:30,y:19,w:5,h:4}});
   assert.equal(pose.cabinBlocked,true);assert.equal(pose.floorWalkable,true);assert.equal(pose.coins,50000-pose.price);
   await page.screenshot({path:path.join(out,width+'-'+id+'-deck.png')});
   const fishable=await page.evaluate(()=>{
    GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
    camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;drawWorld();const spot=getFishingSpotInFront();
    if(!startFishing())throw Error('Raster deck prevented fishing');finishFishing();
    return spot.fishingHabitat;
   });assert.equal(fishable,pose.habitat);await page.screenshot({path:path.join(out,width+'-'+id+'-fishing.png')});
   const perf=await page.evaluate(()=>{const builds=voyageSceneCache.built,times=[];for(let i=0;i<120;i++){const t=performance.now();drawWorld();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {median:times[60],p95:times[114],newComposites:voyageSceneCache.built-builds};});
   assert.equal(perf.newComposites,0);assert.ok(perf.median<50);routes.push({...pose,perf});
   await page.evaluate(()=>returnFromVoyage());
  }
  reports.push({width,assets,routes,harborInteractions:true});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Harbor art browser passed: '+JSON.stringify({viewports:reports.map(r=>r.width),fiveAssets:true,fourRoutes:true,unchangedDeckCollision:true,unchangedFishing:true,errors}));
}finally{await browser.close();}
