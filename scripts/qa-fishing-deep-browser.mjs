import {acknowledgeFishRewardCards} from './lib/fish-reward-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/',output=path.resolve(process.argv[2]||'output/fishing-deep-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await page.goto(base);await page.waitForFunction(()=>typeof drawVoyageSea==='function'&&!document.getElementById('startupLoading'));
    await page.evaluate(()=>{
      enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));GAME_STATE.progression.coins=30000;openHarbor();
      if(buyVoyageTickets('deep')||departVoyage('deep'))throw Error('Locked route allowed a transaction');
      GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',30)),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
      GAME_STATE.inventory=[
        {type:'fish',id:'fish.coelacanth',name:'실러캔스',rarity:'legendary',sizeCm:103.2,price:1270,quantity:1},
        {type:'fish',id:'fish.coelacanth',name:'실러캔스',rarity:'legendary',sizeCm:179.8,price:2130,quantity:2}
      ];
      GAME_STATE.collections.fish['fish.coelacanth']={name:'실러캔스',rarity:'legendary',count:3,minSizeCm:103.2,maxSizeCm:179.8,totalSizeCm:462.8};
      globalThis.deepLegacySnapshot={inventory:GAME_STATE.inventory,record:GAME_STATE.collections.fish['fish.coelacanth']};
      const legacy=createSaveData();delete legacy.state.progression.voyage;localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(legacy));
    });
    await page.reload();await page.waitForFunction(()=>typeof drawVoyageSea==='function'&&!document.getElementById('startupLoading'));
    assert.equal(await page.evaluate(()=>voyageProgress().unlockedRouteIds.includes('deep')),true,'Legacy Lv.30 save must receive its route');
    const migrated=await page.evaluate(()=>({
      inventory:GAME_STATE.inventory.filter(f=>f.id==='fish.coelacanth').map(({id,sizeCm,price,quantity})=>({id,sizeCm,price,quantity})),
      record:GAME_STATE.collections.fish['fish.coelacanth'],
      habitat:FISH_DATA.find(f=>f.id==='fish.coelacanth').habitat,
      coast:getEligibleFishPool({habitat:'coast',period:'NIGHT',weather:'storm'}).map(f=>f.id)
    }));
    assert.deepEqual(migrated.inventory,[
      {id:'fish.coelacanth',sizeCm:103.2,price:1270,quantity:1},
      {id:'fish.coelacanth',sizeCm:179.8,price:2130,quantity:2}
    ]);
    for(const [key,value] of Object.entries({count:3,minSizeCm:103.2,maxSizeCm:179.8,totalSizeCm:462.8}))assert.equal(migrated.record[key],value);
    assert.equal(migrated.habitat,'boat_deep');assert.ok(!migrated.coast.includes('fish.coelacanth'));
    await page.evaluate(()=>{
      GAME_STATE.collections.fish={};GAME_STATE.inventory=[];GAME_STATE.progression.flags={};
      GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',0),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
      GAME_STATE.progression.voyage=normalizeSavedVoyageProgress({unlockedRouteIds:['mid']});saveGame();openHarbor();
    });
    assert.ok((await page.locator('[data-voyage-route="deep"]').textContent()).includes('3종'));
    await page.screenshot({path:path.join(output,`${width}-deep-locked.png`)});
    await page.evaluate(()=>{closeHarbor({fromHistory:true});buyVoyageTickets('mid');departVoyage('mid');});
    await page.waitForFunction(()=>!isVoyageBoarding());
    for(const id of ['fish.spanish_mackerel','fish.yellowtail','fish.marlin']){
      await page.evaluate(id=>{
        GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';
        worldTime.minutes=12*60;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
        if(!startFishing())throw Error('Middle unlock cast failed');updateFishing(320);updateFishing(7000);
        const pool=getEligibleFishPool(fishingState.context),i=pool.findIndex(f=>f.id===id),total=pool.reduce((sum,f)=>sum+getEffectiveFishWeight(f),0);
        const roll=(pool.slice(0,i).reduce((sum,f)=>sum+getEffectiveFishWeight(f),0)+getEffectiveFishWeight(pool[i])/2)/total,original=Math.random;
        try{Math.random=()=>roll;handleFishingAction();}finally{Math.random=original;}
        if(fishingState.result.fishId!==id)throw Error('Wrong unlock species');
      },id);await page.locator('#dialogNext').tap();await acknowledgeFishRewardCards(page);
    }
    const unlocked=await page.evaluate(()=>({level:GAME_STATE.progression.fishing.level,deep:voyageProgress().unlockedRouteIds.includes('deep'),saved:JSON.parse(localStorage.getItem(SAVE_CONFIG.key)).state.progression.voyage.unlockedRouteIds.includes('deep')}));
    assert.deepEqual(unlocked,{level:1,deep:true,saved:true});
    await page.evaluate(()=>{returnFromVoyage();openHarbor();});
    await page.locator('[data-ticket-buy="deep"][data-quantity="5"]').tap();
    assert.equal(await page.evaluate(()=>voyageProgress().ticketCounts.deep),5);
    await page.screenshot({path:path.join(output,`${width}-deep-unlocked.png`)});
    await page.locator('[data-voyage-depart="deep"]').tap();
    await page.waitForFunction(()=>!isVoyageBoarding());
    assert.equal(await page.evaluate(()=>document.querySelector('#voyageBoarding b').textContent),'심해로 출항합니다');
    assert.equal(await page.evaluate(()=>REGION_MUSIC_TRACKS.boatDeep),'lakeside');
    await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
      camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;activeVoyage().tripSeed=42;
      worldTime.minutes=12*60;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;updateWorldClockUI();drawWorld();
    });
    const positions=await page.evaluate(()=>{
      const generator=createVoyageSceneGenerator(42,'deep'),selected=[],seen=new Set();
      for(let i=0;i<24;i++){
        const scene=nextVoyageScene(generator),kind=voyageScenePool('deep').landmarks[scene.landmark];
        if(scene.landmark>0&&!seen.has(kind)&&scene.startMs<550000){seen.add(kind);selected.push({time:scene.startMs+6000,kind});}
      }
      return selected;
    });
    assert.ok(positions.some(s=>s.kind==='giantShadow'));
    const signatures=[];
    for(const {time,kind} of positions){
      const scene=await page.evaluate(time=>{
        activeVoyage().remainingMs=600000-time;voyageClock.last=performance.now();drawWorld();
        return {signature:voyageSceneCache.current.sceneSignature,cached:voyageSceneCache.composites.size,built:voyageSceneCache.built,player:{x:player.x,y:player.y},spot:getFishingSpotInFront()?.fishingHabitat};
      },time);
      assert.equal(scene.cached,2);assert.deepEqual(scene.player,{x:36,y:27});assert.equal(scene.spot,'boat_deep');signatures.push(scene.signature);
      await page.screenshot({path:path.join(output,`${width}-sailing-${kind}-${time}.png`)});
    }
    assert.equal(new Set(signatures).size,signatures.length);
    const performanceStats=await page.evaluate(()=>{
      const before=voyageSceneCache.built,times=[];
      for(let frame=0;frame<120;frame++){const start=performance.now();drawWorld();times.push(performance.now()-start);}
      times.sort((a,b)=>a-b);return {medianDrawMs:times[60],p95DrawMs:times[114],cacheSize:voyageSceneCache.composites.size,extraCompositions:voyageSceneCache.built-before};
    });assert.equal(performanceStats.extraCompositions,0);assert.equal(performanceStats.cacheSize,2);assert.ok(performanceStats.medianDrawMs<50);
    await page.emulateMedia({reducedMotion:'reduce'});
    const reduced=await page.evaluate(()=>{drawWorld();return {enabled:voyageMotionQuery.matches,signature:voyageSceneCache.current.sceneSignature};});
    assert.equal(reduced.enabled,true);assert.equal(reduced.signature,signatures.at(-1));
    await page.screenshot({path:path.join(output,`${width}-reduced-motion.png`)});await page.emulateMedia({reducedMotion:'no-preference'});
    // Hidden time does not advance the scene. Seed + remaining time reconstruct it on reload.
    const hidden=await page.evaluate(()=>{
      Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));
      drawWorld();const before={remaining:activeVoyage().remainingMs,signature:voyageSceneCache.current.sceneSignature};
      updateVoyage(performance.now()+900000);drawWorld();const after={remaining:activeVoyage().remainingMs,signature:voyageSceneCache.current.sceneSignature};
      delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));return {before,after};
    });assert.deepEqual(hidden.before,hidden.after);
    const snapshot=await page.evaluate(()=>{saveGame();return {remaining:activeVoyage().remainingMs,seed:activeVoyage().tripSeed,signature:voyageSceneCache.current.sceneSignature};});
    await page.reload();await page.waitForFunction(()=>typeof drawVoyageSea==='function'&&!document.getElementById('startupLoading')&&voyageSceneCache.current);
    const resumed=await page.evaluate(()=>({region:GAME_STATE.regionId,seed:activeVoyage().tripSeed,signature:voyageSceneCache.current.sceneSignature}));
    assert.equal(resumed.region,'boatDeep');assert.equal(resumed.seed,snapshot.seed);assert.equal(resumed.signature,snapshot.signature);
    await page.evaluate(()=>{GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;});
    const ids=await page.evaluate(()=>FISH_DATA.filter(f=>f.habitat==='boat_deep').map(f=>f.id)),caught=[];
    for(const id of ids){
      await page.evaluate(id=>{
        const f=FISH_DATA.find(f=>f.id===id);worldTime.minutes={DAWN:5*60,DAY:12*60,DUSK:18*60+30,NIGHT:22*60}[f.periods?.[0]||'DAY'];
        worldTime.debugLocked=true;weatherState.kind=f.weather?.[0]||'clear';weatherState.debugLocked=true;updateWorldClockUI();
        if(!startFishing())throw Error('Could not cast: '+id);updateFishing(320);updateFishing(7000);
        const pool=getEligibleFishPool(fishingState.context),index=pool.findIndex(f=>f.id===id),total=pool.reduce((sum,f)=>sum+getEffectiveFishWeight(f),0);
        const roll=(pool.slice(0,index).reduce((sum,f)=>sum+getEffectiveFishWeight(f),0)+getEffectiveFishWeight(pool[index])/2)/total;
        const original=Math.random;try{Math.random=()=>roll;handleFishingAction();}finally{Math.random=original;}
      },id);
      const result=await page.evaluate(()=>({id:fishingState.result?.fishId,rod:fishingState.result?.rodId,record:GAME_STATE.collections.fish[fishingState.result?.fishId]?.count}));
      assert.deepEqual(result,{id,rod:'rod.basic',record:1});caught.push(result);
      await page.waitForFunction(()=>document.querySelector('.fishingResultFish')?.complete&&document.querySelector('.fishingResultFish')?.naturalWidth>0);
      await page.screenshot({path:path.join(output,`${width}-${id.slice(5)}-result.png`)});await page.locator('#dialogNext').tap();await acknowledgeFishRewardCards(page);
    }
    await page.evaluate(()=>saveGame());await page.reload();await page.waitForFunction(()=>typeof drawVoyageSea==='function'&&!document.getElementById('startupLoading'));
    const savedFish=await page.evaluate(()=>({inventory:GAME_STATE.inventory.filter(f=>SAVE_FISH_BY_ID.get(f.id)?.habitat==='boat_deep').length,
      records:FISH_DATA.filter(f=>f.habitat==='boat_deep'&&GAME_STATE.collections.fish[f.id]?.count===1).length}));assert.deepEqual(savedFish,{inventory:8,records:8});
    await page.locator('#menuBtn').tap();await page.locator('#openFishDexBtn').tap();await page.locator('[data-fish-category="offshore"]').tap();await page.locator('[data-fish-habitat="boat_deep"]').tap();
    assert.equal(await page.locator('#fishDexGrid .fishDexCard.discovered').count(),8);
    const overflow=await page.evaluate(()=>{
      const panel=document.getElementById('fishDexPanel').getBoundingClientRect();return [...document.querySelectorAll('#fishDexGrid [data-fish-id],#fishDexHabitatTabs button')].some(e=>{const b=e.getBoundingClientRect();return b.left<panel.left-1||b.right>panel.right+1;});
    });assert.equal(overflow,false);await page.screenshot({path:path.join(output,`${width}-deep-dex.png`)});await page.locator('#fishDexClose').tap();
    const sale=await page.evaluate(()=>{
      if(!returnFromVoyage())throw Error('Could not return to harbor');enterWorldRegion(REGION_EXITS.coast.find(e=>e.to==='lilacVillage'));openMarket();
      const fish=GAME_STATE.inventory.filter(f=>SAVE_FISH_BY_ID.get(f.id)?.habitat==='boat_deep'),total=fish.reduce((sum,f)=>sum+f.price*f.quantity,0),before=GAME_STATE.progression.coins;
      for(const f of fish)marketState.selection.set(f.id,1);const sold=sellSelectedFish();return {sold,total,gain:GAME_STATE.progression.coins-before,left:GAME_STATE.inventory.filter(f=>SAVE_FISH_BY_ID.get(f.id)?.habitat==='boat_deep').length,cache: voyageSceneCache.composites.size};
    });assert.equal(sale.sold,true);assert.equal(sale.gain,sale.total);assert.equal(sale.left,0);
    await page.waitForFunction(()=>voyageSceneCache.composites.size===0);
    // Actual expiry during a deep-route catch result returns only after confirmation.
    await page.evaluate(()=>{
      closeMarket({fromHistory:true});enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));departVoyage('deep');
    });await page.waitForFunction(()=>!isVoyageBoarding());
    await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';
      if(!startFishing())throw Error('Deep expiry cast failed');updateFishing(320);updateFishing(7000);handleFishingAction();
      activeVoyage().remainingMs=0;updateVoyage();
    });
    assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'boatDeep');assert.equal(await page.evaluate(()=>activeVoyage().returnPending),true);
    await page.locator('#dialogNext').tap();await acknowledgeFishRewardCards(page);assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'coast');
    await page.evaluate(()=>departVoyage('deep'));await page.waitForFunction(()=>!isVoyageBoarding());
    await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';startFishing();
      activeVoyage().remainingMs=0;updateVoyage();globalThis.deepOriginalStorageSet=Storage.prototype.setItem;
      Storage.prototype.setItem=function(){throw Error('QA deep return failure');};
    });
    await page.locator('#fishingCancelBtn').tap();
    const failedReturn=await page.evaluate(()=>{
      const result={region:GAME_STATE.regionId,pending:activeVoyage()?.returnPending};Storage.prototype.setItem=globalThis.deepOriginalStorageSet;return result;
    });assert.deepEqual(failedReturn,{region:'boatDeep',pending:true});await page.waitForFunction(()=>GAME_STATE.regionId==='coast');
    assert.equal(await page.evaluate(()=>activeVoyage()),null);
    reports.push({width,unlocked,legacyLevelUnlock:true,coelacanthRecordsPreserved:true,signatures,performance:performanceStats,hiddenPaused:true,sceneResumed:true,caught,savedFish,sale,overflow,deepExpiry:true,failedReturnRetry:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({reports,errors},null,2));
  console.log('Deep browser passed: '+JSON.stringify({viewports:reports.map(r=>r.width),sceneVariation:true,reducedMotion:true,hiddenAndSceneResume:true,eightNormalCatches:true,dexAndSale:true,performance:reports.map(r=>r.performance),errors}));
}finally{await browser.close();}
