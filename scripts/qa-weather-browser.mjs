import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/dist/index.html',out=path.resolve(process.argv[2]||'output/weather-qa/browser');
fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
  for(const [width,height]of [[393,780],[320,568],[1280,800]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion:'no-preference'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const automatic=await page.evaluate(()=>{
      applySaveData(createSaveData());const before=JSON.stringify(GAME_STATE),random=Math.random,rows=[];
      worldTime.debugLocked=true;Object.assign(weatherState,{segment:-1,debugLocked:false,day:0,wetSegments:0,nonStormSegments:0});
      try{Math.random=()=>.99;
        for(let i=0;i<8;i++){worldTime.day=Math.floor(i/4);worldTime.minutes=i%4*360;updateWeather();rows.push(getWeatherKind());}
      }finally{Math.random=random;}
      updateWorldClockUI();return {rows,unchanged:before===JSON.stringify(GAME_STATE),locked:weatherState.debugLocked};
    });
    assert.deepEqual(automatic.rows,['clear','clear','clear','storm','clear','clear','clear','storm']);assert(automatic.unchanged&&!automatic.locked);
    assert.match(await page.locator('#worldClock').innerText(),/폭풍/);
    // Observe the real running renderer, not a forced preview frame.
    await page.evaluate(()=>{
      window.__stormFrames=0;window.__stormOriginal=drawWeatherEffects;window.__stormImage=null;
      drawWeatherEffects=function(){__stormOriginal();const strike=getWeatherKind()==='storm'&&getStormLightningStrike(tNow);if(strike?.flash>.85){__stormFrames++;if(!__stormImage)__stormImage=canvas.toDataURL();}};
    });
    await page.waitForFunction(()=>__stormFrames>0,{},{timeout:15000});
    fs.writeFileSync(path.join(out,`live-lightning-${width}.png`),Buffer.from((await page.evaluate(()=>__stormImage)).split(',')[1],'base64'));
    await page.screenshot({path:path.join(out,`storm-${width}.png`)});
    const visuals=await page.evaluate(()=>{
      drawWeatherEffects=__stormOriginal;
      const before=JSON.stringify(GAME_STATE),random=Math.random,oldTime=tNow,frames=[];
      try{Math.random=()=>{throw Error('Weather visuals consumed gameplay randomness');};
        for(let i=0;i<6;i++){tNow=i*4800+350+hash2(i+13,71)*2800+(300+hash2(i+29,97)*200)*.5;drawWorld();frames.push({index:i,points:getStormLightningStrike(tNow).points,image:canvas.toDataURL()});}
      }finally{Math.random=random;tNow=oldTime;}
      return {frames,unchanged:before===JSON.stringify(GAME_STATE)};
    });
    assert(visuals.unchanged);assert.equal(new Set(visuals.frames.map(f=>JSON.stringify(f.points))).size,6);
    if(width===393)for(const f of visuals.frames)fs.writeFileSync(path.join(out,`strike-${f.index}.png`),Buffer.from(f.image.split(',')[1],'base64'));
    await page.emulateMedia({reducedMotion:'reduce'});
    assert(await page.evaluate(()=>{drawWorld();return getWeatherKind()==='storm'&&Array.from({length:400},(_,i)=>getStormLightningStrike(i*60)).every(s=>s===null);}));
    await page.screenshot({path:path.join(out,`storm-reduced-${width}.png`)});await page.emulateMedia({reducedMotion:'no-preference'});
    const regions=await page.evaluate(()=>{
      const visited=[],original=drawWeatherEffects;let count=0;drawWeatherEffects=()=>{count++;original();};
      try{for(const id of Object.keys(REGION_WORLDS)){const before=count;if(!enterWorldRegion({to:id},{skipSave:true}))throw Error(id);drawWorld();if(count!==before+1)throw Error('Weather missing in '+id);visited.push(id);}}
      finally{drawWeatherEffects=original;enterWorldRegion({to:'lilacVillage'},{skipSave:true});}return visited;
    });assert(regions.includes('oldForest')&&regions.includes('boatDeep')&&regions.length>=22);
    // Debug controls still work, and automatic mode can be restored.
    assert.equal(await page.locator('#timeDebugPanel').isVisible(),false);
    const debugUrl=new URL(base);debugUrl.searchParams.set('debug','1');
    await page.goto(debugUrl.href,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.locator('#weatherRain').click();await page.waitForFunction(()=>document.getElementById('worldClock').textContent.includes('비'));
    await page.locator('#weatherStorm').click();await page.waitForFunction(()=>document.getElementById('worldClock').textContent.includes('폭풍'));
    await page.locator('#weatherClear').click();await page.waitForFunction(()=>document.getElementById('worldClock').textContent.includes('맑음'));
    await page.locator('#weatherAuto').click();assert.equal(await page.evaluate(()=>weatherState.debugLocked),false);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    reports.push({width,height,automaticStorm:true,unchangedSave:true,realAnimatedLightning:true,randomShapes:true,reducedMotionRespected:true,visualsUseNoGameplayRandomness:true,debugAndAuto:true,regions});
    await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2)+'\n');
  console.log('Weather browser passed: 320/393/1280px automatic storms, live lightning, varied shapes, all regions, reduced motion, debug/auto, no save/RNG changes.');
}finally{await browser.close();}
