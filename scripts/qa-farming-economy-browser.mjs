import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/';
const out=path.resolve(process.argv[2]||'output/farming-expansion-v1/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const reports=[],errors=[];
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:780},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const legacy=await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:14,y:22,face:'right'}});
      const data=createSaveData(),time=Date.now()-45000;
      data.state.inventory=[{type:'seed',id:'turnip',name:'순무 씨앗',quantity:7},{type:'crop',id:'turnip',name:'순무',quantity:9}];
      data.state.world.plots.farm_01={unlocked:true,cropId:'turnip',plantedAt:time};
      window.removeEventListener('pagehide',saveGame);localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(data));return time;
    });
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const restored=await page.evaluate(()=>({items:GAME_STATE.inventory.map(i=>[i.name,i.quantity]),plot:GAME_STATE.world.plots.farm_01}));
    assert.deepEqual(restored.items,[['비트 씨앗',7],['비트',9]]);assert.equal(restored.plot.cropId,'turnip');assert.equal(restored.plot.plantedAt,legacy);
    const catalog=await page.evaluate(()=>LIFE_CONTENT.crops);
    assert.equal(catalog.length,14);
    await page.evaluate(()=>{
      GAME_STATE.inventory=[];GAME_STATE.progression.coins=10000;GAME_STATE.appearance.activeTool='sickle';
      GAME_STATE.world.plots.farm_01={unlocked:true,cropId:null,plantedAt:null};
      openMarket({view:'seeds'});marketState.view='seeds';renderMarket();
    });
    assert.equal(await page.locator('[data-seed-id]').count(),14);
    assert(!(await page.locator('#marketList').innerText()).includes('순무'));
    assert(!/수확\s*\d+\s*[~～-]\s*\d+개/.test(await page.locator('#marketList').innerText()));
    const seedRows=await page.locator('[data-seed-id]').evaluateAll(buttons=>buttons.map(b=>b.closest('.marketFishRow')?.innerText||b.parentElement.parentElement.innerText));
    await page.screenshot({path:path.join(out,'seeds-'+width+'.png')});
    const transactions=[];
    for(const crop of catalog){
      const before=await page.evaluate(()=>GAME_STATE.progression.coins);
      await page.locator('[data-seed-id="'+crop.id+'"]').click();
      assert.equal(await page.evaluate(()=>GAME_STATE.progression.coins),before-crop.seedPrice);
      await page.evaluate(()=>{
        closeMarket({fromHistory:true});player.x=14;player.y=22;player.px=14*TILE+24;player.py=22*TILE+24;
        openFarmPlot(farmPlotAt(15,22));
      });
      await page.locator('[data-life-action="plant"][data-crop-id="'+crop.id+'"]').click();
      await page.waitForFunction(()=>!isFarmPlotOpen());
      await page.evaluate(({id,maximum})=>{
        const crop=LIFE_CROP_BY_ID.get(id);GAME_STATE.world.plots.farm_01.plantedAt=Date.now()-crop.growMs-1;
        globalThis.farmingOriginalRandom=Math.random;Math.random=()=>maximum?0.999999:0;
        openFarmPlot(farmPlotAt(15,22));
      },{id:crop.id,maximum:width===320});
      assert.equal(await page.locator('#lifeTitle').innerText(),crop.name);
      await page.locator('[data-life-action="harvest"]').click();
      await page.waitForFunction(()=>getFarmPlotPhase(farmPlotAt(15,22))==='EMPTY'&&!isChoppingTree()&&!isFarmPlotOpen());
      const quantity=await page.evaluate(id=>{Math.random=globalThis.farmingOriginalRandom;return lifeItemCount('crop',id);},crop.id);
      assert.equal(quantity,width===320?crop.harvestMax:crop.harvestMin);
      await page.evaluate(()=>{openMarket();marketState.view='crops';renderMarket();});
      await page.locator('[data-good-key="crop:'+crop.id+'"] [data-good-action="all"]').click();
      await page.locator('#marketSellBtn').click();
      const after=await page.evaluate(()=>GAME_STATE.progression.coins);
      assert.equal(after-before,quantity*crop.sellPrice-crop.seedPrice);
      assert.equal(await page.evaluate(id=>lifeItemCount('crop',id),crop.id),0);
      transactions.push({id:crop.id,seedPaid:crop.seedPrice,quantity,sale:quantity*crop.sellPrice,profit:after-before});
      await page.evaluate(()=>{marketState.view='seeds';renderMarket();});
    }
    const rollback=await page.evaluate(()=>{
      const before=JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory});
      const original=saveGame;saveGame=()=>false;let buy;
      try{buy=buyMarketSeed('chili');}finally{saveGame=original;}
      const buyUnchanged=!buy&&before===JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory});
      addLifeItem('crop','chili',3);marketState.view='crops';marketState.goodsSelection.set('crop:chili',3);
      const stock=JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory});
      saveGame=()=>false;let sale;try{sale=sellSelectedGoods();}finally{saveGame=original;}
      return {buyUnchanged,saleUnchanged:!sale&&stock===JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory})};
    });assert(rollback.buyUnchanged&&rollback.saleUnchanged);
    const saved=await page.evaluate(()=>{
      closeMarket({fromHistory:true});
      const ids=['lettuce','cucumber','eggplant','chili'];
      ids.forEach((id,i)=>{
        addLifeItem('seed',id,2);addLifeItem('crop',id,3);
        const plot=WORLD_DEFINITION.farmPlots[i];GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:id,plantedAt:Date.now()-LIFE_CROP_BY_ID.get(id).growMs*.6};
      });
      saveGame();return JSON.parse(JSON.stringify({inventory:GAME_STATE.inventory,plots:GAME_STATE.world.plots,coins:GAME_STATE.progression.coins}));
    });
    await page.screenshot({path:path.join(out,'young-'+width+'.png')});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify({inventory:GAME_STATE.inventory,plots:GAME_STATE.world.plots,coins:GAME_STATE.progression.coins}))),saved);
    const assets=await page.evaluate(()=>['lettuce','cucumber','eggplant','chili'].every(id=>youngCropImgs[id].naturalWidth===96&&matureCropImgs[id].naturalWidth===96));
    assert(assets);
    await page.evaluate(()=>{
      for(const plot of WORLD_DEFINITION.farmPlots){const state=getFarmPlotState(plot);if(state.cropId)state.plantedAt=Date.now()-LIFE_CROP_BY_ID.get(state.cropId).growMs-1;}
      const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();
    });
    await page.screenshot({path:path.join(out,'mature-'+width+'.png')});
    reports.push({width,legacy:restored,seedRows,transactions,rollback,saveReload:true,assets});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,errors,reports},null,2));
  console.log('Farm economy browser passed: 14 actual seed/plant/sickle/sale button cycles at min/max yields, legacy beet identity, new-crop reload, transaction rollback, four-stage assets at 393/320px.');
}finally{await browser.close();}
