import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/dist/index.html';
const out=path.resolve(process.argv[2]||'output/shop-dex-polish-v1/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const reports=[],errors=[];
try{
  for(const [width,height] of [[393,780],[320,568]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
    const ready=()=>page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const closeShop=async()=>{await page.locator('#marketClose').tap();await page.waitForFunction(()=>!isMarketOpen()&&!window.history.state?.pixelLifeOverlay);};
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await ready();
    const legacy=await page.evaluate(()=>{
      const fish=FISH_DATA[0],second=FISH_DATA[1];
      GAME_STATE.inventory=[{type:'fish',id:fish.id,name:fish.name,rarity:fish.rarity,sizeCm:fish.minSizeCm,price:fish.basePrice,quantity:24},
        {type:'fish',id:second.id,name:second.name,rarity:second.rarity,sizeCm:second.minSizeCm,price:second.basePrice,quantity:7},
        {type:'material',id:'oak_log',name:lifeItemName('material','oak_log'),quantity:57},
        {type:'seed',id:'carrot',name:'당근 씨앗',quantity:4},{type:'crop',id:'carrot',name:'당근',quantity:18}];
      GAME_STATE.progression.coins=12345;
      ensureFarmOrder();GAME_STATE.progression.farmOrders.tickets=12;
      GAME_STATE.progression.farmOrders.ownedDecorationIds=['scarecrow'];GAME_STATE.progression.farmOrders.placedDecorationIds=['scarecrow'];
      recordFishDiscovery(fish,fish.minSizeCm);recordTreeDiscovery('oak');
      GAME_STATE.world.plots.farm_01={unlocked:true,cropId:'onion',plantedAt:Date.now()-30000};
      applySaveData(createSaveData());saveGame();return JSON.parse(JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,world:GAME_STATE.world,collections:GAME_STATE.collections}));
    });
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready();
    assert.deepEqual(await page.evaluate(()=>({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,world:GAME_STATE.world,collections:GAME_STATE.collections})),legacy);
    const layout=await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:9,y:24,face:'up'}});worldTime.minutes=720;
      const farmLanes=[14,16,18,20,22].every(x=>[21,22,23,24,25,26].every(y=>!isBlocked(x,y)));
      const farmBeds=WORLD_DEFINITION.farmPlots.every(p=>Object.values(dirVec).some(([dx,dy])=>!isBlocked(p.x+dx,p.y+dy)));
      const oldShopRemoved=!buildings.some(b=>b.id==='farm_supply_cottage')&&!npcs.some(n=>n.id==='haru');
      enterWorldRegion({to:'lilacVillage',entry:{x:57,y:24,face:'up'}});
      const seen=new Set(),queue=[{x:3,y:24}];
      for(let i=0;i<queue.length;i++){const p=queue[i],k=key(p.x,p.y);if(seen.has(k)||isBlocked(p.x,p.y))continue;seen.add(k);
        for(const [dx,dy] of Object.values(dirVec))queue.push({x:p.x+dx,y:p.y+dy});}
      const house=buildings.find(b=>b.id==='farm_supply_cottage'),npc=npcs.find(n=>n.id==='haru');
      const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();
      return {npc:!!npc&&npc.roam===0,door:seen.has(key(house.entrance.approach.x,house.entrance.approach.y)),
        merchant:seen.has(key(57,24)),lanes:farmLanes,beds:farmBeds,oldShopRemoved,
        exit:seen.has(key(62,24)),interaction:resolveWorldInteraction().kind};
    });assert(layout.npc&&layout.door&&layout.merchant&&layout.lanes&&layout.beds&&layout.exit&&layout.interaction==='farmMarket');
    await page.screenshot({path:path.join(out,'farm-shop-'+width+'.png')});
    await page.locator('#btnA').tap();await page.waitForFunction(()=>isMarketOpen());
    assert.equal(await page.locator('#marketShopName').innerText(),'하루의 농사 상점');
    assert.deepEqual(await page.locator('[data-market-view]:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.marketView).sort()),['crops','decorations','orders','seeds']);
    await page.locator('[data-market-view="seeds"]').tap();
    const seedCopy=await page.locator('#marketList').innerText();assert(!seedCopy.includes('분 성장')&&!seedCopy.includes('농장 부지에 심는 씨앗'));
    assert.equal(await page.locator('[data-seed-id]').count(),14);
    await page.screenshot({path:path.join(out,'seed-shop-'+width+'.png')});
    const seedBefore=await page.evaluate(()=>({coins:GAME_STATE.progression.coins,quantity:lifeItemCount('seed','carrot'),cost:LIFE_CROP_BY_ID.get('carrot').seedPrice}));
    await page.locator('[data-seed-id="carrot"]').tap();
    assert.deepEqual(await page.evaluate(()=>({coins:GAME_STATE.progression.coins,quantity:lifeItemCount('seed','carrot')})),
      {coins:seedBefore.coins-seedBefore.cost,quantity:seedBefore.quantity+1});
    await page.evaluate(()=>selectMarketView('home'));
    await page.locator('[data-market-view="orders"]').tap();
    assert.deepEqual(await page.evaluate(()=>GAME_STATE.progression.farmOrders.current),legacy.progression.farmOrders.current);
    assert((await page.locator('.farmOrderLabel').innerText()).includes('하루'));
    await closeShop();
    await page.evaluate(()=>{player.x=56;player.y=23;player.px=56*TILE+24;player.py=23*TILE+24;player.face='up';});
    await page.locator('#btnA').tap();await page.waitForFunction(()=>isMarketOpen()&&marketState.shop==='haru');await closeShop();
    await page.evaluate(()=>{enterWorldRegion({to:'lilacVillage',entry:{x:29,y:39,face:'up'}});});
    await page.locator('#btnA').tap();await page.waitForFunction(()=>isMarketOpen());
    assert.deepEqual(await page.locator('[data-market-view]:visible').evaluateAll(nodes=>nodes.map(n=>n.dataset.marketView).sort()),['fish','rods']);
    assert(await page.evaluate(()=>{
      const before=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression}),view=marketState.view;
      marketState.view='seeds';const seed=buyMarketSeed('carrot');marketState.view='crops';marketState.goodsSelection.set('crop:carrot',1);
      const crop=sellSelectedGoods();marketState.goodsSelection.clear();marketState.view='orders';const order=deliverFarmOrder(GAME_STATE.progression.farmOrders.current.id);
      marketState.view='decorations';const decor=exchangeFarmDecoration('sign');marketState.view=view;
      return !seed&&!crop&&!order&&!decor&&before===JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression});
    }));
    await page.locator('[data-market-view="fish"]').tap();
    const fishId=await page.evaluate(()=>FISH_DATA[0].id),secondId=await page.evaluate(()=>FISH_DATA[1].id);
    const fishRow=page.locator('[data-fish-id="'+fishId+'"]');
    await page.locator('[data-fish-id="'+secondId+'"] [data-market-action="plus"]').tap();
    const untouched=await page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,coins:GAME_STATE.progression.coins}));
    await fishRow.locator('[data-market-action="all"]').tap();assert.equal(await fishRow.locator('.marketQty strong').innerText(),'24');
    await page.screenshot({path:path.join(out,'fish-reset-'+width+'.png')});
    await fishRow.locator('[data-market-action="reset"]').tap();assert.equal(await fishRow.locator('.marketQty strong').innerText(),'0');
    assert.equal(await page.evaluate(id=>marketState.selection.get(id),secondId),1);
    await page.locator('[data-fish-id="'+secondId+'"] [data-market-action="reset"]').tap();
    assert(await page.locator('#marketSellBtn').isDisabled());
    assert.equal(await page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,coins:GAME_STATE.progression.coins})),untouched);
    await fishRow.locator('[data-market-action="plus"]').tap();await page.locator('#marketSellBtn').tap();
    assert.equal(await page.evaluate(id=>groupInventoryFish().find(g=>g.fish.id===id).count,fishId),23);
    await closeShop();
    await page.evaluate(()=>{enterWorldRegion({to:'lilacVillage',entry:{x:30,y:21,face:'up'}});});
    await page.locator('#btnA').tap();await page.waitForFunction(()=>isMarketOpen()&&marketState.shop==='workshop');
    await page.locator('[data-market-view="wood"]').tap();
    const woodRow=page.locator('[data-good-key="material:oak_log"]');
    await woodRow.locator('[data-good-action="all"]').tap();assert.equal(await woodRow.locator('.marketQty strong').innerText(),'57');
    await page.screenshot({path:path.join(out,'wood-reset-'+width+'.png')});
    await woodRow.locator('[data-good-action="reset"]').tap();assert.equal(await woodRow.locator('.marketQty strong').innerText(),'0');
    assert(await page.locator('#marketSellBtn').isDisabled());assert.equal(await page.evaluate(()=>lifeItemCount('material','oak_log')),57);
    await closeShop();
    const treeTarget=await page.evaluate(()=>{
      enterWorldRegion({to:'oldForest',entry:{x:3,y:24,face:'right'}});worldTime.minutes=720;
      const tree=trees.find(t=>t.interactable&&t.x>5&&t.x<50&&t.y>5&&t.y<40&&!isBlocked(t.x+1,t.y));
      player.x=tree.x+1;player.y=tree.y;player.px=player.x*TILE+24;player.py=player.y*TILE+24;player.face='left';
      const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();return resolveWorldInteraction().kind;
    });assert.equal(treeTarget,'tree');
    await page.screenshot({path:path.join(out,'tree-approach-'+width+'.png')});
    await page.evaluate(()=>openFishDex());await page.locator('#fishDexGrid [data-fish-id="'+fishId+'"]').tap();
    const fishArt=await page.locator('#fishDexDetail .fishDexDetailHero img').boundingBox();assert(fishArt.width>=180&&fishArt.height>=160);
    await page.screenshot({path:path.join(out,'fish-detail-'+width+'.png')});
    assert(await page.locator('#fishDexModalClose').isVisible());await page.goBack();await page.waitForFunction(()=>isFishDexOpen()&&!isFishDexDetailOpen());
    await page.evaluate(()=>openFishDexDetail(FISH_DATA[1].id));assert.equal(await page.locator('#fishDexDetail img').count(),0);
    assert((await page.locator('#fishDexDetail').innerText()).includes('???'));await page.goBack();await page.waitForFunction(()=>!isFishDexDetailOpen());
    await page.locator('#fishDexClose').tap();await page.waitForFunction(()=>!isFishDexOpen());
    await page.evaluate(()=>openTreeDex());await page.locator('#treeDexGrid [data-tree-species="oak"]').tap();
    const treeArt=await page.locator('#treeDexDetail .fishDexDetailHero img').boundingBox();assert(treeArt.width>=170&&treeArt.height>=200);
    await page.screenshot({path:path.join(out,'tree-detail-'+width+'.png')});
    assert(await page.locator('#treeDexModalClose').isVisible());
    assert(await page.evaluate(()=>{const detail=document.getElementById('treeDexDetail');detail.scrollTop=detail.scrollHeight;const a=detail.getBoundingClientRect(),b=detail.lastElementChild.getBoundingClientRect();return b.bottom<=a.bottom+1;}));
    await page.goBack();await page.waitForFunction(()=>!isTreeDexDetailOpen());
    await page.locator('#treeDexGrid [data-tree-species="birch"]').tap();assert.equal(await page.locator('#treeDexDetail .treeDexSilhouette').count(),1);
    assert((await page.locator('#treeDexDetail').innerText()).includes('???'));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    reports.push({width,height,layout,fishArt,treeArt,oldSavePreserved:true,seedPurchase:true,shopGuards:true,resetFishAndWood:true,unknownHidden:true});
    await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2)+'\n');
  console.log('Shop/dex browser passed: 393/320px, old-save/order preservation, real NPC/door shops, 14-seed catalog and purchase, fish/farm separation and guards, all/reset/partial sale, reachable lanes, large scrollable known cards and hidden unknowns.');
}finally{await browser.close();}
