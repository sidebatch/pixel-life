import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/';
const out=path.resolve(process.argv[2]||'output/farm-orders-v1/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const legacy=await page.evaluate(()=>{
      const data=createSaveData();delete data.state.progression.farmOrders;data.state.progression.coins=9876;
      data.state.inventory=[{type:'crop',id:'turnip',name:'비트',quantity:9},{type:'seed',id:'carrot',name:'당근 씨앗',quantity:4}];
      data.state.world.plots.farm_01={unlocked:true,cropId:'onion',plantedAt:Date.now()-40000};
      window.removeEventListener('pagehide',saveGame);localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(data));
      return {inventory:data.state.inventory,coins:data.state.progression.coins,plot:data.state.world.plots.farm_01,farming:data.state.progression.farming};
    });
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.deepEqual(await page.evaluate(()=>({inventory:GAME_STATE.inventory,coins:GAME_STATE.progression.coins,plot:GAME_STATE.world.plots.farm_01,farming:GAME_STATE.progression.farming})),legacy);
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farmOrders.tickets),0);
    await page.evaluate(()=>{enterWorldRegion({to:'lilacVillage',entry:{x:42,y:31,face:'up'}});openMarket();});
    await page.locator('[data-market-view="orders"]').click();
    assert.equal(await page.locator('[data-order-id]').count(),1);
    const first=await page.evaluate(()=>JSON.parse(JSON.stringify(GAME_STATE.progression.farmOrders.current)));
    assert.equal(first.requirements.length,1);
    const ready=await page.evaluate(()=>GAME_STATE.progression.farmOrders.current.requirements.every(row=>lifeItemCount('crop',row.cropId)>=row.quantity));
    assert.equal(await page.locator('[data-farm-action="deliver"]').isEnabled(),ready);
    await page.screenshot({path:path.join(out,'first-order-'+width+'.png')});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.evaluate(()=>openMarket());await page.locator('[data-market-view="orders"]').click();
    assert.deepEqual(await page.evaluate(()=>GAME_STATE.progression.farmOrders.current),first);
    const transactions=[];
    while(await page.evaluate(()=>GAME_STATE.progression.farmOrders.tickets)<16){
      const before=await page.evaluate(()=>{
        const state=GAME_STATE.progression.farmOrders,order=JSON.parse(JSON.stringify(state.current));
        order.requirements.forEach(row=>{const missing=row.quantity-lifeItemCount('crop',row.cropId);if(missing>0)addLifeItem('crop',row.cropId,missing);});
        if(state.completed===1||state.completed===2){
          const level=state.completed===1?10:20,count=state.completed===1?8:12;
          GAME_STATE.progression.farming=lifeSkillProgressFromTotal('farming',lifeSkillTotalXpForLevel('farming',level));
          REGION_WORLDS.sunnyFields.farmPlots.forEach((plot,index)=>{
            const saved=getFarmPlotState(plot);GAME_STATE.world.plots[plot.id]={...saved,unlocked:index<count};
          });
        }
        renderMarket();return {order,coins:GAME_STATE.progression.coins,tickets:state.tickets,completed:state.completed,xp:GAME_STATE.progression.farming.totalXp};
      });
      await page.locator('[data-farm-action="deliver"]').click();
      const after=await page.evaluate(id=>({coins:GAME_STATE.progression.coins,tickets:GAME_STATE.progression.farmOrders.tickets,
        completed:GAME_STATE.progression.farmOrders.completed,next:GAME_STATE.progression.farmOrders.current,
        xp:GAME_STATE.progression.farming.totalXp,duplicate:deliverFarmOrder(id)}),before.order.id);
      assert.equal(after.coins-before.coins,before.order.coins);assert.equal(after.tickets-before.tickets,before.order.tickets);
      assert.equal(after.completed-before.completed,1);assert.equal(after.xp,before.xp);assert(!after.duplicate);
      assert.equal(after.next.requirements.length,after.next.tier);
      transactions.push({tier:before.order.tier,coins:before.order.coins,tickets:before.order.tickets,nextTier:after.next.tier});
    }
    assert(transactions.some(row=>row.nextTier===2)&&transactions.some(row=>row.nextTier===3));
    await page.screenshot({path:path.join(out,'mixed-order-'+width+'.png')});
    const rollback=await page.evaluate(()=>{
      const order=GAME_STATE.progression.farmOrders.current;
      order.requirements.forEach(row=>addLifeItem('crop',row.cropId,row.quantity));
      const before=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression});
      const original=saveGame;saveGame=()=>false;let delivered;try{delivered=deliverFarmOrder(order.id);}finally{saveGame=original;}
      return !delivered&&before===JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression});
    });assert(rollback);
    await page.locator('[data-market-view="decorations"]').click();
    await page.screenshot({path:path.join(out,'rewards-'+width+'.png')});
    for(const id of ['scarecrow','sign','fence']){
      const before=await page.evaluate(()=>GAME_STATE.progression.farmOrders.tickets);
      const cost=await page.evaluate(id=>FARM_DECOR_BY_ID.get(id).cost,id);
      await page.locator('[data-farm-action="exchange"][data-decoration-id="'+id+'"]').click();
      assert.equal(await page.evaluate(()=>GAME_STATE.progression.farmOrders.tickets),before-cost);
      assert(await page.locator('[data-farm-action="place"][data-decoration-id="'+id+'"]').isDisabled());
    }
    await page.locator('#marketClose').click();await page.waitForFunction(()=>!isMarketOpen()&&!window.history.state?.pixelLifeOverlay);
    await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:14,y:22,face:'right'}});openFarmPlot(farmPlotAt(15,22));
    });
    await page.locator('#lifeDecor').click();await page.waitForFunction(()=>isMarketOpen()&&!isFarmPlotOpen());
    assert.equal(await page.locator('#marketShopName').innerText(),'농장 꾸미기');
    assert.equal(await page.locator('[data-market-view]:visible').count(),1);
    for(const id of ['scarecrow','sign','fence'])await page.locator('[data-farm-action="place"][data-decoration-id="'+id+'"]').click();
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farmOrders.placedDecorationIds.length),3);
    const placementRollback=await page.evaluate(()=>{
      const before=JSON.stringify(GAME_STATE.progression.farmOrders),keys=[...blocked].sort().join('|'),original=saveGame;
      saveGame=()=>false;let removed;try{removed=setFarmDecorationPlaced('fence',false);}finally{saveGame=original;}
      return !removed&&before===JSON.stringify(GAME_STATE.progression.farmOrders)&&keys===[...blocked].sort().join('|');
    });assert(placementRollback);
    await page.locator('#marketClose').click();await page.waitForFunction(()=>!isMarketOpen()&&!window.history.state?.pixelLifeOverlay);
    const layout=await page.evaluate(()=>{
      player.x=18;player.y=26;player.px=18*TILE+24;player.py=26*TILE+24;
      const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();
      const seen=new Set(),queue=[{x:3,y:24}];
      for(let i=0;i<queue.length;i++){const p=queue[i],k=key(p.x,p.y);if(seen.has(k)||isBlocked(p.x,p.y))continue;seen.add(k);
        for(const [dx,dy] of Object.values(dirVec))queue.push({x:p.x+dx,y:p.y+dy});}
      saveGame();return {lanes:[14,16,18,20,22].every(x=>[21,22,23,24,25,26].every(y=>seen.has(key(x,y)))),
        beds:WORLD_DEFINITION.farmPlots.every(p=>Object.values(dirVec).some(([dx,dy])=>seen.has(key(p.x+dx,p.y+dy)))),
        objects:FARM_DECORATIONS.every(item=>item.slots.every(slot=>isBlocked(slot.x,slot.y))),exit:seen.has(key(1,24))};
    });assert(layout.lanes&&layout.beds&&layout.objects&&layout.exit);
    await page.screenshot({path:path.join(out,'decorated-farm-'+width+'.png')});
    const saved=await page.evaluate(()=>JSON.parse(JSON.stringify({farmOrders:GAME_STATE.progression.farmOrders,inventory:GAME_STATE.inventory,plots:GAME_STATE.world.plots,coins:GAME_STATE.progression.coins})));
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.deepEqual(await page.evaluate(()=>({farmOrders:GAME_STATE.progression.farmOrders,inventory:GAME_STATE.inventory,plots:GAME_STATE.world.plots,coins:GAME_STATE.progression.coins})),saved);
    assert(await page.evaluate(()=>FARM_DECORATIONS.every(item=>item.slots.every(slot=>isBlocked(slot.x,slot.y)))));
    await page.evaluate(()=>{player.x=14;player.y=22;player.px=14*TILE+24;player.py=22*TILE+24;openFarmPlot(farmPlotAt(15,22));});
    await page.locator('#lifeDecor').click();
    await page.locator('[data-farm-action="remove"][data-decoration-id="fence"]').click();
    assert(await page.evaluate(()=>FARM_DECOR_BY_ID.get('fence').slots.every(slot=>!isBlocked(slot.x,slot.y))));
    await page.locator('[data-farm-action="place"][data-decoration-id="fence"]').click();
    const screen=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,
      buttonHeights:[...document.querySelectorAll('#marketList [data-farm-action]')].map(b=>b.getBoundingClientRect().height)}));
    assert(!screen.overflow&&screen.buttonHeights.every(height=>height>=44));
    reports.push({width,legacyPreserved:true,firstOrder:first,transactions,rollback,placementRollback,layout,saveReload:true,screen});
    await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,errors,reports},null,2));
  console.log('Farm orders browser passed: 393/320px, legacy preservation, one random saved order, exact real-button delivery/rewards/tier growth, rollback, three exchanges and world placement/removal, accessible lanes, reload and farm-panel history.');
}finally{await browser.close();}
