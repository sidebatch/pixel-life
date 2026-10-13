// Isolated browser saves: purchase, collision, timed harvest and old plot IDs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/';
const out=path.resolve(process.argv[2]||'output/farming-layout-qa');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>typeof FARM_SICKLE!=='undefined'&&!document.getElementById('startupLoading'));
    const layout=await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:16,y:23,face:'left'}});
      const plots=WORLD_DEFINITION.farmPlots;
      const emptyAndLockedSolid=plots.every(plot=>isBlocked(plot.x,plot.y));
      for(const plot of plots)GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:'carrot',plantedAt:Date.now()};
      const growingSolid=plots.every(plot=>isBlocked(plot.x,plot.y));
      for(const [index,plot] of plots.entries())GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:LIFE_CONTENT.crops[index%10].id,
        plantedAt:Date.now()-LIFE_CONTENT.crops[index%10].growMs-5000};
      const seen=new Set(),queue=[{x:3,y:24}];
      for(let i=0;i<queue.length;i++){
        const tile=queue[i],k=key(tile.x,tile.y);if(seen.has(k)||isBlocked(tile.x,tile.y))continue;
        seen.add(k);for(const [dx,dy] of Object.values(dirVec))queue.push({x:tile.x+dx,y:tile.y+dy});
      }
      const accessible=plots.every(p=>Object.values(dirVec).some(([dx,dy])=>seen.has(key(p.x+dx,p.y+dy))));
      const allSolid=plots.every(p=>isBlocked(p.x,p.y));
      tryMove('left');const movementBlocked=!player.moving&&player.x===16;
      const lanes=[14,16,18,20,22].every(x=>[21,22,23,24,25,26].every(y=>seen.has(key(x,y))));
      return {emptyAndLockedSolid,growingSolid,accessible,allSolid,movementBlocked,lanes,ids:plots.map(p=>p.id)};
    });
    assert(layout.emptyAndLockedSolid&&layout.growingSolid&&layout.accessible&&layout.allSolid&&layout.movementBlocked&&layout.lanes);
    assert.equal(layout.ids.length,16);
    await page.evaluate(()=>{openInventory();inventoryState.tab='equipment';renderInventory();});
    await page.locator('[data-equip-type="sickle"]').click();
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'sickle');
    await page.locator('[data-inventory-info-type="sickle"]').click();
    assert((await page.locator('#inventoryDetailContent').innerText()).includes('내구도 무제한'));
    await page.locator('#inventoryDetailClose').click();
    await page.waitForFunction(()=>!isInventoryDetailOpen());
    await page.locator('#inventoryClose').click();
    await page.waitForFunction(()=>!isInventoryOpen()&&!menuOpen);
    const harvest=await page.evaluate(()=>{
      const plot=farmPlotAt(15,23),cropId=getFarmPlotState(plot).cropId;
      const before=lifeItemCount('crop',cropId);
      const distant=startFarmHarvest(farmPlotAt(21,25));
      const started=startFarmHarvest(plot),duplicate=startFarmHarvest(plot);
      const beforeImpact=lifeItemCount('crop',cropId)===before&&isBlocked(plot.x,plot.y);
      return {distant,started,duplicate,beforeImpact,cropId,before,id:plot.id};
    });
    assert(!harvest.distant&&harvest.started&&!harvest.duplicate&&harvest.beforeImpact,JSON.stringify(harvest));
    await page.waitForFunction(id=>!GAME_STATE.world.plots[id].cropId,harvest.id);
    await page.waitForFunction(()=>!isChoppingTree());
    const result=await page.evaluate(({cropId,before,id})=>({gained:lifeItemCount('crop',cropId)-before,
      bedStillBlocked:isBlocked(15,23),double:harvestFarmCrop(WORLD_DEFINITION.farmPlots.find(p=>p.id===id)),
      active:GAME_STATE.appearance.activeTool}),harvest);
    assert(result.gained>=1&&result.bedStillBlocked&&!result.double&&result.active==='sickle');
    const rollback=await page.evaluate(()=>{
      const plot=farmPlotAt(17,23),before=JSON.stringify({plots:GAME_STATE.world.plots,inventory:GAME_STATE.inventory});
      const original=saveGame;saveGame=()=>false;
      let success;try{success=harvestFarmCrop(plot);}finally{saveGame=original;}
      const unchanged=before===JSON.stringify({plots:GAME_STATE.world.plots,inventory:GAME_STATE.inventory});
      return {success,unchanged,solid:isBlocked(plot.x,plot.y)};
    });assert(!rollback.success&&rollback.unchanged&&rollback.solid);
    const growth=await page.evaluate(()=>{
      const plot=farmPlotAt(15,23);GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:'carrot',plantedAt:Date.now()};
      player.x=15;player.y=23;player.px=15*TILE+TILE/2;player.py=23*TILE+TILE/2;
      GAME_STATE.world.plots[plot.id].plantedAt=Date.now()-LIFE_CROP_BY_ID.get('carrot').growMs-1;
      keepFarmPlayerOnWalkway();return {clear:!isBlocked(player.x,player.y),near:Math.abs(player.x-15)+Math.abs(player.y-23)===1,
        retained:getFarmPlotPhase(plot)==='READY'};
    });assert(growth.clear&&growth.near&&growth.retained);
    // The actual farm panel provides the starting tool and launches its action.
    await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='axe';
      player.x=16;player.y=23;player.px=16*TILE+TILE/2;player.py=23*TILE+TILE/2;
      openFarmPlot(farmPlotAt(15,23));
    });
    await page.locator('[data-life-action="equip-sickle"]').click();
    await page.locator('[data-life-action="harvest"]').click();
    await page.waitForFunction(()=>getFarmPlotPhase(farmPlotAt(15,23))==='EMPTY'&&!isChoppingTree()&&!isFarmPlotOpen());
    const poses=await page.evaluate(()=>{
      const old=GAME_STATE.appearance;
      let count=0;
      for(const bodyId of CHARACTER_PARTS.body.keys())for(const hairId of CHARACTER_PARTS.hair.keys())
        for(const backpackId of CHARACTER_PARTS.backpack.keys())for(const outfit of CHARACTER_OUTFITS)
          for(const face of ['down','right','left','up'])for(const pose of ['walk','sickle'])
            for(let frame=0;frame<(pose==='walk'?3:2);frame++){
              GAME_STATE.appearance={...old,bodyId,hairId,backpackId,outfitId:outfit.id};
              const transform=drawCharacterActor(288,400,{pose,face,frame,tool:'sickle'});
              if(transform.key!=='sickle.basic'||![transform.x,transform.y,transform.rotation,transform.scale].every(Number.isFinite))throw Error('Bad sickle transform');
              count++;
            }
      GAME_STATE.appearance=old;return count;
    });assert(poses>0);
    await page.evaluate(()=>{
      const plot=farmPlotAt(15,23);GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:'carrot',plantedAt:Date.now()-200000};
      player.x=18;player.y=26;player.px=18*TILE+TILE/2;player.py=26*TILE+TILE/2;
      const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();saveGame();
    });
    await page.waitForFunction(()=>!document.getElementById('lifeToast').classList.contains('show'));
    await page.screenshot({path:path.join(out,`farm-${width}.png`)});
    const stored=await page.evaluate(()=>JSON.parse(JSON.stringify(GAME_STATE.world.plots)));
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(GAME_STATE.world.plots))),stored);
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'sickle');
    await page.evaluate(()=>{openMarket();marketState.view='seeds';renderMarket();});
    const seedText=await page.locator('#marketList').innerText();
    assert(!/수확\s*\d+\s*[~～-]\s*\d+개/.test(seedText));assert(seedText.includes('분 성장'));
    await page.screenshot({path:path.join(out,`seed-market-${width}.png`)});
    const purchase=await page.evaluate(()=>{
      closeMarket();const plot=WORLD_DEFINITION.farmPlots.find(p=>p.id==='farm_16');
      GAME_STATE.world.plots[plot.id]={unlocked:false,cropId:null,plantedAt:null};
      player.x=22;player.y=25;player.px=22*TILE+TILE/2;player.py=25*TILE+TILE/2;
      GAME_STATE.progression.coins=10000;addLifeItem('material','oak_log',100);
      const cost=farmExpansionCost(),before=GAME_STATE.progression.coins;
      const bought=buyFarmPlot(plot),again=buyFarmPlot(plot);
      addLifeItem('seed','pumpkin',1);const seeds=lifeItemCount('seed','pumpkin');
      const planted=plantFarmCrop(plot,'pumpkin');
      return {bought,again,paid:before-GAME_STATE.progression.coins,expected:cost.coins,planted,
        used:seeds-lifeItemCount('seed','pumpkin')};
    });assert(purchase.bought&&!purchase.again&&purchase.paid===purchase.expected&&purchase.planted&&purchase.used===1);
    // A legacy save on the former compact farm keeps ID ownership/crops/times.
    const old=await page.evaluate(()=>{
      const data=createSaveData();data.state.appearance.activeTool='axe';
      data.state.playerLocation={x:17,y:23,face:'right'};
      const expected=JSON.parse(JSON.stringify(data.state.world.plots));
      delete data.state.appearance.sickleId;
      window.removeEventListener('pagehide',saveGame);localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(data));return expected;
    });
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(GAME_STATE.world.plots))),old);
    assert(await page.evaluate(()=>!isBlocked(player.x,player.y)),'Legacy saved position spawned inside a mature crop');
    await page.evaluate(()=>{openInventory();inventoryState.tab='equipment';renderInventory();});
    assert.equal(await page.locator('[data-equip-type="sickle"]').count(),1);
    for(const phase of ['EMPTY','GROWING']){
      const expected=await page.evaluate(phase=>{
        closeInventory({fromHistory:true});
        const data=createSaveData(),plot=farmPlotAt(17,22);
        data.state.world.plots[plot.id]={unlocked:true,cropId:phase==='GROWING'?'carrot':null,
          plantedAt:phase==='GROWING'?Date.now():null};
        data.state.playerLocation={x:plot.x,y:plot.y,face:'left'};
        window.removeEventListener('pagehide',saveGame);localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(data));
        return data.state.world.plots;
      },phase);
      await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
      assert(await page.evaluate(()=>!isBlocked(player.x,player.y)),`${phase} old position spawned on a bed`);
      assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify(GAME_STATE.world.plots))),expected);
    }
    await context.close();reports.push({width,layout,result,rollback,growth,purchase,sicklePoseCombinations:poses});
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,errors,reports},null,2));
  console.log('Farm browser passed: 393/320px, all beds blocked in every state, lanes accessible, adjacent sickle harvest, persistent bed collision after harvest, rollback, safe old positions, purchase/seed use and saved progress');
}finally{await browser.close();}
