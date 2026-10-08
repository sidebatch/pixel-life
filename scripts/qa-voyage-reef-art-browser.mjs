import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {decodePNG,alphaBounds} from './lib/png.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/voyage-reef-art-qa');
fs.mkdirSync(out,{recursive:true});
const specs=[['voyageReef','voyage-reef-v1',128,88],['voyageCoral','voyage-coral-v1',48,48]];
for(const [,id,w,h] of specs){
 const image=decodePNG(fs.readFileSync('assets/voyage/'+id+'.png')),source=decodePNG(fs.readFileSync('assets/voyage/source/'+id+'.png'));
 assert.equal(image.width,w);assert.equal(image.height,h);assert.ok(alphaBounds(image).width>0);
 assert.ok(image.data.some((v,i)=>i%4===3&&v===0));assert.ok(source.data.some((v,i)=>i%4===3&&v===0),'Generated source must retain real transparency');
}
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>typeof drawVoyageMarineSprite==='function'&&!document.getElementById('startupLoading'));
  const assets=await page.evaluate(async()=>Promise.all(['voyageReef','voyageCoral'].map(async key=>{
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ASSET_URLS[key]));
   return {key,width:imgs[key]?.naturalWidth,height:imgs[key]?.naturalHeight,loaded:imgs[key]?.complete,sourceHash:Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('')};
  })));
  for(const [key,id,w,h] of specs){
   const a=assets.find(a=>a.key===key),url='assets/voyage/'+id+'.png',sources=[url,'data:image/png;base64,'+fs.readFileSync(url).toString('base64')];
   assert.ok(a.loaded);assert.equal(a.width,w);assert.equal(a.height,h);
   assert.ok(sources.some(s=>createHash('sha256').update(s).digest('hex')===a.sourceHash));
  }
  await page.evaluate(()=>{
   enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));GAME_STATE.progression.coins=50000;
   GAME_STATE.appearance.activeTool='rod';if(!buyVoyageTickets('shallow')||!departVoyage('shallow'))throw Error('Cannot depart shallow');
  });await page.waitForFunction(()=>!isVoyageBoarding());
  const raster=await page.evaluate(()=>{
   let seed=null;for(let i=0;i<1024;i++){const scene=nextVoyageScene(createVoyageSceneGenerator(i));if(scene.landmark===2&&scene.mid===2){seed=i;break;}}
   if(seed===null)throw Error('No representative reef/coral scene');
   globalThis.marineRasterCalls={reef:0,coral:0};const original=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...args){if(args[0]===imgs.voyageReef)marineRasterCalls.reef++;if(args[0]===imgs.voyageCoral)marineRasterCalls.coral++;return original.apply(this,args);};
   activeVoyage().tripSeed=seed;activeVoyage().remainingMs=593000;voyageClock.last=performance.now();
   player.x=32;player.y=18;player.face='up';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
   camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;worldTime.minutes=640;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
   releaseVoyageScenes();updateWorldClockUI();drawWorld();return {...marineRasterCalls,seed,walkable:!blocked.has('32,18'),habitat:getFishingSpotInFront()?.fishingHabitat};
  });
  assert.ok(raster.reef>0&&raster.coral>0);assert.equal(raster.walkable,true);assert.equal(raster.habitat,'boat_shallow');
  await page.screenshot({path:path.join(out,width+'-reef-clear-top.png')});
  for(const [name,kind,minutes] of [['rain','rain',640],['night','clear',1320]]){
   await page.evaluate(({kind,minutes})=>{weatherState.kind=kind;worldTime.minutes=minutes;updateWorldClockUI();drawWorld();},{kind,minutes});
   await page.screenshot({path:path.join(out,width+'-reef-'+name+'-top.png')});
  }
  const steady=await page.evaluate(()=>{
   weatherState.kind='clear';worldTime.minutes=640;updateWorldClockUI();drawWorld();
   const before={...marineRasterCalls},built=voyageSceneCache.built,times=[];
   for(let i=0;i<120;i++){const t=performance.now();drawWorld();times.push(performance.now()-t);}times.sort((a,b)=>a-b);
   if(!startFishing())throw Error('Reef changed the upper railing fishing spot');finishFishing();
   return {before,after:{...marineRasterCalls},extraCompositions:voyageSceneCache.built-built,median:times[60],p95:times[114]};
  });
  assert.deepEqual(steady.before,steady.after);assert.equal(steady.extraCompositions,0);assert.ok(steady.median<50);
  const fallback=await page.evaluate(()=>{
   const reef=imgs.voyageReef,coral=imgs.voyageCoral;try{
    imgs.voyageReef=imgs.voyageCoral=null;releaseVoyageScenes();drawWorld();
    if(!startFishing())throw Error('Fallback changed fishing');finishFishing();return true;
   }finally{imgs.voyageReef=reef;imgs.voyageCoral=coral;releaseVoyageScenes();drawWorld();}
  });assert.equal(fallback,true);
  reports.push({width,assets,raster,steady,clearRainNight:true,fallback:true});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Reef raster browser passed: '+JSON.stringify({viewports:reports.map(r=>r.width),twoExactAssets:true,rasterInsteadOfCrosses:true,clearRainNight:true,upperRailingFishing:true,cacheOnly:true,fallback:true,errors}));
}finally{await browser.close();}
