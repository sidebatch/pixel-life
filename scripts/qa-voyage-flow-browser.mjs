import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/voyage-flow-qa');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>typeof drawVoyageScenery==='function'&&!document.getElementById('startupLoading'));
  await page.evaluate(()=>{
   enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));GAME_STATE.progression.coins=99999;
   GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',45)),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
   GAME_STATE.appearance.activeTool='rod';worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
  });
  for(const destination of ['shallow','mid','deep','glacier']){
   await page.evaluate(id=>{buyVoyageTickets(id);if(!departVoyage(id))throw Error('Cannot depart '+id);},destination);
   await page.waitForFunction(()=>!isVoyageBoarding());
   const flow=await page.evaluate(destination=>{
    const check=(ok,message)=>{if(!ok)throw Error(destination+': '+message);},tested=[];
    const snapshot=t=>[...voyageSceneCache.objects.values()].filter(o=>t>=o.spawnMs).map(o=>({id:o.id,...voyageSceneryRect(o,t)}));
    for(let landmark=1;landmark<6;landmark++){
     let seed=0;while(nextVoyageScene(createVoyageSceneGenerator(seed,destination)).landmark!==landmark)seed++;
     activeVoyage().tripSeed=seed;activeVoyage().remainingMs=600000;releaseVoyageScenes();drawWorld();
     const first=voyageSceneCache.current,obj=[...voyageSceneCache.objects.values()].find(o=>o.sceneIndex===0&&o.layer==='far');
     check(!!obj,'Landmark sprite missing');
     for(const o of voyageSceneCache.objects.values()){
      const born=voyageSceneryRect(o,o.spawnMs);check(born.y+born.h<=0,'Object is born inside the viewport');
      check(o.side<0?born.x+born.w<=102-6:born.x>=438+6,'Object intrudes into the hull corridor');
     }
     syncVoyageScenes(seed,first.endMs-1,destination);const before=voyageSceneryRect(obj,first.endMs-1);
     syncVoyageScenes(seed,first.endMs+1,destination);const after=voyageSceneryRect(obj,first.endMs+1);
     check(voyageSceneCache.objects.get(obj.id)===obj,'Visible landmark was discarded at a scene switch');
     check(after.y>=before.y&&after.y-before.y<=2,'Scene switch teleported a landmark');
     const calls=[],original=CanvasRenderingContext2D.prototype.drawImage;
     const solidCanvases=new Set([...voyageSceneCache.objects.values()].map(o=>o.canvas));let landmarkCalls=0;
     CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this===ctx&&solidCanvases.has(args[0])){calls.push(this.globalAlpha);if(args[0]===obj.canvas)landmarkCalls++;}return original.apply(this,args);};
     try{drawVoyageScenery(first.endMs-1);drawVoyageScenery(first.endMs+1);}finally{CanvasRenderingContext2D.prototype.drawImage=original;}
     check(landmarkCalls===2&&calls.every(alpha=>alpha===1),'Solid scenery cross-faded');
     const pixels=obj.canvas.getContext('2d').getImageData(0,0,obj.canvas.width,obj.canvas.height),rect=voyageSceneryRect(obj,0);let lo=pixels.height,hi=-1;
     // An outer half is intentionally off camera: use the visible alpha rows.
     for(let y=0;y<pixels.height;y++)for(let x=0;x<pixels.width;x++)if(rect.x+x*obj.w/pixels.width>=0&&rect.x+x*obj.w/pixels.width<VIEW_W&&pixels.data[(y*pixels.width+x)*4+3]){lo=Math.min(lo,y);hi=Math.max(hi,y);}
     check(hi>=lo,'Empty landmark');const scale=obj.h/pixels.height,oldMap=voyageSceneCache.objects;
     const coverage=y=>{
      const elapsed=obj.spawnMs+(y+obj.h+2)/obj.speed*1000;
      ctx.save();ctx.clearRect(0,0,VIEW_W,VIEW_H);voyageSceneCache.objects=new Map([[obj.id,obj]]);
      try{drawVoyageScenery(elapsed);}finally{voyageSceneCache.objects=oldMap;ctx.restore();}
      const p=ctx.getImageData(0,0,VIEW_W,VIEW_H).data;let n=0;for(let i=3;i<p.length;i+=4)if(p[i])n++;return n;
     };
     const full=coverage(100),entry=[coverage(-(hi+1)*scale-4),coverage(-(hi+1)*scale+12),coverage(-(hi+1)*scale+30)],
      exit=[coverage(VIEW_H-lo*scale-30),coverage(VIEW_H-lo*scale-12),coverage(VIEW_H-lo*scale+4)];
     check(full>0&&entry[0]===0&&entry[1]>0&&entry[1]<full&&entry[2]>entry[1],'Top edge must progressively reveal pixel rows: '+landmark+' '+entry+' / '+full);
     check(exit[0]>exit[1]&&exit[1]>0&&exit[2]===0,'Bottom edge must progressively crop pixel rows: '+landmark+' '+exit);
     syncVoyageScenes(seed,obj.exitMs-1,destination);check(voyageSceneCache.objects.has(obj.id),'Landmark retired before leaving frame');
     check(voyageSceneryRect(obj,obj.exitMs-1).y>=VIEW_H,'Canvas retired while still visible');
     syncVoyageScenes(seed,obj.exitMs+1,destination);check(!voyageSceneCache.objects.has(obj.id),'Expired canvas was retained');
     tested.push({kind:voyageScenePool(destination).landmarks[landmark],entry,exit,full});
    }
    const seed=42,t=75000;syncVoyageScenes(seed,t,destination);const expected=JSON.stringify(snapshot(t));
    releaseVoyageScenes();syncVoyageScenes(seed,t,destination);check(JSON.stringify(snapshot(t))===expected,'Seed/time restore changed surviving objects');
    let maxBytes=0,maxObjects=0,observations=0;
    for(let elapsed=0;elapsed<600000;elapsed+=1000){
     const prior=new Map([...voyageSceneCache.objects].map(([id,o])=>[id,{o,r:voyageSceneryRect(o,elapsed-1000)}]));
     syncVoyageScenes(seed,elapsed,destination);
     if(elapsed>0)for(const [id,{o,r}] of prior){if(o.spawnMs<=elapsed-1000&&r.y+r.h>0&&r.y<VIEW_H&&o.exitMs>elapsed){check(voyageSceneCache.objects.get(id)===o,'Visible decoration disappeared');observations++;}}
     maxObjects=Math.max(maxObjects,voyageSceneCache.objects.size);maxBytes=Math.max(maxBytes,[...voyageSceneCache.objects.values()].reduce((n,o)=>n+o.canvas.width*o.canvas.height*4,0));
    }
    check(maxObjects<=32&&maxBytes<2*1024*1024,'Unbounded artwork memory');check(observations>100,'Temporal sample must include visible scenery');
    activeVoyage().tripSeed=20;activeVoyage().remainingMs=576000;voyageClock.last=performance.now();releaseVoyageScenes();drawWorld();
    return {tested,maxObjects,maxBytes,observations};
   },destination);
   await page.screenshot({path:path.join(out,width+'-'+destination+'-passing.png')});
   const normal=await page.evaluate(()=>{const t=24000;return [...voyageSceneCache.objects.values()].map(o=>({id:o.id,...voyageSceneryRect(o,t)}));});
   await page.emulateMedia({reducedMotion:'reduce'});
   const reduced=await page.evaluate(()=>{drawWorld();const t=24000;return [...voyageSceneCache.objects.values()].map(o=>({id:o.id,...voyageSceneryRect(o,t)}));});
   assert.deepEqual(reduced,normal,'Motion preference must not teleport solid scenery');await page.emulateMedia({reducedMotion:'no-preference'});
   reports.push({width,destination,...flow});await page.evaluate(()=>returnFromVoyage());
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Voyage continuous flow passed: '+JSON.stringify({viewports:[393,320],landmarkVariants:reports.reduce((n,r)=>n+r.tested.length,0),fourRoutes:true,pixelRowEntryExit:true,noSolidFade:true,sceneBoundaryRetention:true,clearHullCorridor:true,deterministicRestore:true,boundedSprites:true,errors}));
}finally{await browser.close();}
