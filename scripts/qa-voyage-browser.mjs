import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/voyage-qa');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
    await page.goto(base+'?time=12:00&weather=clear');
    await page.waitForFunction(()=>typeof departVoyage==='function'&&!document.getElementById('startupLoading'));
    await page.evaluate(()=>{
      enterWorldRegion(REGION_EXITS.lilacVillage.find(exit=>exit.to==='coast'));
      GAME_STATE.progression.coins=6000;refreshHarborCoins();
      player.x=36;player.y=23;player.face='up';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;interact();
    });
    await page.locator('[data-ticket-buy="shallow"][data-quantity="5"]').tap();
    assert.equal(await page.evaluate(()=>voyageProgress().ticketCounts.shallow),5);
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.coins),4500);
    assert.equal(await page.evaluate(()=>activeVoyage()),null,'Purchase must not start the voyage');
    await page.screenshot({path:path.join(output,`${width}-harbor-tickets.png`)});
    const panel=await page.locator('#harborPanel').boundingBox();
    assert.ok(panel.x>=0&&panel.x+panel.width<=width&&panel.y>=0,'Harbor panel stays inside the screen');
    await page.locator('[data-voyage-depart="shallow"]').tap();
    await page.waitForFunction(()=>document.getElementById('voyageBoarding').hidden);
    assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'boatShallow');
    assert.equal(await page.evaluate(()=>voyageProgress().ticketCounts.shallow),4);
    assert.equal(await page.evaluate(()=>departVoyage('shallow')),false,'Duplicate departure must not spend another ticket');
    const deck=await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='rod';
      player.x=36;player.y=27;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
      camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;drawWorld();
      return {spot:getFishingSpotInFront(),collision:isBlocked(37,27),cabin:isBlocked(32,20),left:bridgeSet.has(key(28,27)),bottom:bridgeSet.has(key(32,31))};
    });
    assert.equal(deck.spot.fishingHabitat,'boat_shallow');assert.equal(deck.spot.spotId,'shallow_open_sea');
    assert.ok(deck.collision&&deck.cabin&&deck.left&&deck.bottom);
    await page.screenshot({path:path.join(output,`${width}-boat-deck.png`)});
    // Back navigation closes the captain dialog without changing destination.
    await page.evaluate(()=>{player.x=32;player.y=25;player.face='up';interact();});
    assert.ok(await page.locator('[data-voyage-return]').isVisible());
    await page.goBack();assert.equal(await page.evaluate(()=>isHarborOpen()),false);
    // A visible bag does not stop the real monotonic clock.
    const menuClock=await page.evaluate(()=>{
      openInventory();inventoryState.tab='supplies';renderInventory();
      const before=activeVoyage().remainingMs;voyageClock.boardingUntil=0;voyageClock.last=performance.now()-2000;checkpointVoyageTime();
      const elapsed=before-activeVoyage().remainingMs;
      return {elapsed,tickets:document.getElementById('inventoryScroll').textContent};
    });
    assert.ok(menuClock.elapsed>=2000);assert.ok(menuClock.tickets.includes('얕은 바다 승선권'));
    await page.evaluate(()=>closeInventory({fromHistory:true}));
    const hidden=await page.evaluate(()=>{
      Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
      document.dispatchEvent(new Event('visibilitychange'));
      const before=activeVoyage().remainingMs;updateVoyage(performance.now()+900000);
      window.dispatchEvent(new Event('pagehide'));const after=activeVoyage().remainingMs;
      delete document.visibilityState;window.dispatchEvent(new Event('pageshow'));document.dispatchEvent(new Event('visibilitychange'));
      return {before,after};
    });assert.equal(hidden.before,hidden.after,'Hidden/pagehide elapsed time is never charged');
    const resume=await page.evaluate(()=>{saveGame();return {...activeVoyage(),tickets:voyageProgress().ticketCounts.shallow};});
    await page.reload();await page.waitForFunction(()=>typeof departVoyage==='function'&&!document.getElementById('startupLoading'));
    const restored=await page.evaluate(()=>({...activeVoyage(),region:GAME_STATE.regionId,tickets:voyageProgress().ticketCounts.shallow}));
    assert.equal(restored.region,'boatShallow');assert.equal(restored.tripSeed,resume.tripSeed);assert.equal(restored.tickets,resume.tickets);
    assert.ok(restored.remainingMs<=resume.remainingMs&&resume.remainingMs-restored.remainingMs<5000);
    // Early return saves the harbor and never refunds the spent ticket.
    await page.evaluate(()=>openHarbor());await page.locator('[data-voyage-return]').tap();
    assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'coast');assert.equal(await page.evaluate(()=>activeVoyage()),null);
    assert.equal(await page.evaluate(()=>voyageProgress().ticketCounts.shallow),4);
    // Real localStorage failure rolls back all three transactions, including map position.
    const rollback=await page.evaluate(()=>{
      const original=Storage.prototype.setItem;
      const before={coins:GAME_STATE.progression.coins,tickets:voyageProgress().ticketCounts.shallow,x:player.x,y:player.y};
      Storage.prototype.setItem=function(){throw new Error('QA storage failure');};
      let purchase,departure;
      try{purchase=buyVoyageTickets('shallow');departure=departVoyage('shallow');}finally{Storage.prototype.setItem=original;}
      return {before,purchase,departure,after:{coins:GAME_STATE.progression.coins,tickets:voyageProgress().ticketCounts.shallow,x:player.x,y:player.y},region:GAME_STATE.regionId,trip:activeVoyage()};
    });assert.equal(rollback.purchase,false);assert.equal(rollback.departure,false);assert.deepEqual(rollback.after,rollback.before);assert.equal(rollback.region,'coast');assert.equal(rollback.trip,null);
    for(const phase of ['casting','waiting','bite','result']){
      await page.evaluate(()=>departVoyage('shallow'));
      await page.waitForFunction(()=>document.getElementById('voyageBoarding').hidden);
      const pending=await page.evaluate(phase=>{
        GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
        const started=startFishing();fishingState.phase=phase==='result'?'bite':phase;
        if(phase==='result')handleFishingAction();
        activeVoyage().remainingMs=0;updateVoyage();
        return {started,region:GAME_STATE.regionId,pending:activeVoyage().returnPending,phase:fishingState.phase,allowed:canStartVoyageFishing()};
      },phase);
      assert.ok(pending.started&&pending.pending&&!pending.allowed);assert.equal(pending.region,'boatShallow');assert.equal(pending.phase,phase);
      if(phase==='result'){
        await page.screenshot({path:path.join(output,`${width}-expired-catch-result.png`)});
        await page.locator('#dialogNext').tap();
      }else await page.locator('#fishingCancelBtn').tap();
      assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'coast');assert.equal(await page.evaluate(()=>activeVoyage()),null);
    }
    // Waiting expiry -> bite -> normal catch still works before the automatic return.
    await page.evaluate(()=>{voyageProgress().ticketCounts.shallow=3;departVoyage('shallow');});
    await page.waitForFunction(()=>document.getElementById('voyageBoarding').hidden);
    const catchState=await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';startFishing();
      fishingState.phase='waiting';activeVoyage().remainingMs=0;updateVoyage();
      updateFishing(7000);handleFishingAction();
      return {phase:fishingState.phase,id:fishingState.result.fishId,region:GAME_STATE.regionId};
    });assert.equal(catchState.phase,'result');assert.equal(catchState.region,'boatShallow');assert.ok(['fish.sardine','fish.mackerel','fish.horse_mackerel'].includes(catchState.id));
    await page.locator('#dialogNext').tap();assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'coast');
    await page.evaluate(()=>departVoyage('shallow'));await page.waitForFunction(()=>document.getElementById('voyageBoarding').hidden);
    const failedReturn=await page.evaluate(()=>{
      const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('QA return failure');};
      try{activeVoyage().remainingMs=0;updateVoyage();return {region:GAME_STATE.regionId,pending:activeVoyage()?.returnPending,tickets:voyageProgress().ticketCounts.shallow};}
      finally{Storage.prototype.setItem=original;}
    });assert.equal(failedReturn.region,'boatShallow');assert.equal(failedReturn.pending,true);assert.equal(failedReturn.tickets,1);
    await page.waitForFunction(()=>GAME_STATE.regionId==='coast');assert.equal(await page.evaluate(()=>activeVoyage()),null);
    // Expired saved result is restored directly at harbor, without a second ticket.
    await page.evaluate(()=>departVoyage('shallow'));await page.waitForFunction(()=>document.getElementById('voyageBoarding').hidden);
    await page.evaluate(()=>{fishingState.phase='result';activeVoyage().remainingMs=0;activeVoyage().returnPending=true;saveGame();});
    await page.reload();await page.waitForFunction(()=>typeof departVoyage==='function'&&!document.getElementById('startupLoading'));
    assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'coast');assert.equal(await page.evaluate(()=>activeVoyage()),null);assert.equal(await page.evaluate(()=>voyageProgress().ticketCounts.shallow),0);
    // Return Stone clears the voyage only on a successfully saved village teleport.
    const stone=await page.evaluate(()=>{
      voyageProgress().ticketCounts.shallow=1;departVoyage('shallow');voyageClock.boardingUntil=0;
      addLifeItem('consumable',VILLAGE_RETURN_ITEM.id,1);
      const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('QA stone failure');};
      let failed;try{failed=useVillageReturnItem();}finally{Storage.prototype.setItem=original;}
      const rolledBack={region:GAME_STATE.regionId,trip:Boolean(activeVoyage()),count:lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id)};
      const success=useVillageReturnItem();return {failed,rolledBack,success,region:GAME_STATE.regionId,trip:activeVoyage()};
    });assert.equal(stone.failed,false);assert.deepEqual(stone.rolledBack,{region:'boatShallow',trip:true,count:1});assert.equal(stone.success,true);assert.equal(stone.region,'lilacVillage');assert.equal(stone.trip,null);
    reports.push({width,deck,hidden,resume:restored,rollback:true,allFishingPhases:true,normalPendingCatch:catchState.id,automaticRetry:true,expiredRestore:true,returnStone:true});
    await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({reports,errors},null,2));
  console.log('Voyage browser passed: '+JSON.stringify({viewports:reports.map(report=>report.width),tickets:true,saveRollback:true,visibleClock:true,hiddenRestore:true,fishingExpiry:true,automaticRetry:true,returnStone:true,errors}));
}finally{await browser.close();}
