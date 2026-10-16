import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const url=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/dist/index.html';
const out=path.resolve(process.argv[2]||'output/market-services-qa/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
  for(const [width,height]of [[393,852],[320,568],[1280,800]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
    const page=await context.newPage();page.on('pageerror',error=>{errors.push(error.message);console.error(error.stack);});
    page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.evaluate(()=>{
      enterWorldRegion({to:'lilacVillage',entry:{x:30,y:21,face:'up'}});
      GAME_STATE.progression.coins=1000000;
      for(const species of FOREST_SPECIES)addLifeItem('material',species+'_log',1000);
      addLifeItem('crop','carrot',7);addLifeItem('seed','carrot',2);
      const fish=FISH_DATA[0];GAME_STATE.inventory.push({type:'fish',id:fish.id,name:fish.name,quantity:50,price:26,sizeCm:20,rarity:fish.rarity});
      if(!upgradeForestryAxe('axe.iron'))throw Error('Fixture axe purchase failed');
      GAME_STATE.progression.fishing.level=5;
      for(const [id,count]of Object.entries(FISHING_ROD_BY_ID.get('rod.sturdy').fishCost)){
        const required=FISH_DATA.find(fish=>fish.id===id);GAME_STATE.inventory.push({type:'fish',id,name:required.name,quantity:count,price:required.basePrice,sizeCm:required.minSizeCm,rarity:required.rarity});
      }
      if(!purchaseFishingRod('rod.sturdy'))throw Error('Fixture rod purchase failed');
      const axe=getOwnedForestryAxes().find(axe=>axe.id==='axe.iron'),rod=FISHING_ROD_BY_ID.get('rod.sturdy');
      GAME_STATE.progression.forestry.durabilityByAxeId[axe.id]=0;
      GAME_STATE.progression.fishing.durabilityByRodId[rod.id]=0;
      window.__soundEvents=[];playCoinSpendSound=()=>__soundEvents.push('spend');
      playEquipmentRepairSound=kind=>__soundEvents.push('repair:'+kind);playEquipmentPurchaseSound=kind=>__soundEvents.push('purchase:'+kind);playMarketSaleSound=()=>__soundEvents.push('sale');
      saveGame();
    });
    const open=async shop=>{await page.evaluate(shop=>openMarket({shop}),shop);};
    const close=async()=>{await page.locator('#marketClose').click();await page.waitForFunction(()=>!isMarketOpen()&&!window.history.state?.pixelLifeOverlay);};
    const checkChooser=async()=>{
      const panel=page.locator('#marketPanel');assert(await panel.evaluate(node=>node.classList.contains('marketServiceChooser')));
      assert.equal(await panel.locator('img').count(),0);assert.equal(await panel.locator('.marketWallet:visible,.marketFooter:visible').count(),0);
      const buttons=page.locator('[data-market-view]:visible'),rects=await buttons.evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,label:node.textContent};}));
      assert(rects.every((rect,index)=>['구매','판매','업그레이드','수리','주문','꾸미기'].includes(rect.label)&&rect.height>=44&&(!index||rect.x===rects[0].x&&rect.y>=rects[index-1].y+rects[index-1].height)));
      const box=await panel.boundingBox();assert(box.width<=281&&box.height<=320&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
    };
    const home=async()=>{await page.locator('#marketBackBtn').click();assert.equal(await page.evaluate(()=>marketState.view),'home');await checkChooser();};
    const choose=async view=>{await page.locator(`[data-market-view="${view}"]`).click();assert.equal(await page.evaluate(()=>marketState.view),view);assert.equal(await page.locator('[data-market-view]:visible').count(),0);assert(!await page.locator('#marketPanel').evaluate(node=>node.classList.contains('marketServiceChooser')));};
    const views=()=>page.locator('[data-market-view]:visible').evaluateAll(nodes=>nodes.map(node=>node.dataset.marketView));
    // Actual NPC interaction must open the service chooser, with no transaction list.
    await page.locator('#btnA').click();await page.waitForFunction(()=>isMarketOpen());
    assert.equal(await page.evaluate(()=>marketState.shop),'workshop');assert.equal(await page.evaluate(()=>marketState.view),'home');
    assert.deepEqual(await views(),['supplies','wood','axes','axeRepairs']);assert.equal(await page.locator('#marketList:visible').count(),0);
    await checkChooser();
    await page.screenshot({path:path.join(out,`jun-home-${width}.png`)});
    await choose('supplies');assert.equal(await page.locator('[data-buy-return-item]').count(),1);assert.equal(await page.locator('.marketEquipmentCard').count(),0);
    assert((await page.locator('#marketList').innerText()).includes('중앙 광장'));
    const before=await page.evaluate(()=>({coins:GAME_STATE.progression.coins,count:lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id)}));
    await page.locator('[data-buy-return-item]').click();
    assert.deepEqual(await page.evaluate(()=>({coins:GAME_STATE.progression.coins,count:lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id)})),{coins:before.coins-100,count:before.count+1});
    await home();await choose('axes');assert.equal(await page.locator('[data-buy-return-item],[data-repair-axe-id]').count(),0);
    assert.equal(await page.locator('[data-equipment-id="axe.iron"]').count(),0);
    await page.screenshot({path:path.join(out,`axe-upgrades-${width}.png`)});
    const upgrade=await page.evaluate(()=>({axe:getEquippedForestryAxe().id,active:GAME_STATE.appearance.activeTool,coins:GAME_STATE.progression.coins,cost:FORESTRY_AXE_BY_ID.get('axe.steel').coins}));
    await page.locator('[data-axe-id="axe.steel"]').click();
    assert.deepEqual(await page.evaluate(()=>({axe:getEquippedForestryAxe().id,active:GAME_STATE.appearance.activeTool,coins:GAME_STATE.progression.coins})),{axe:upgrade.axe,active:upgrade.active,coins:upgrade.coins-upgrade.cost});
    await home();await choose('axeRepairs');assert.equal(await page.locator('[data-axe-id],[data-buy-return-item]').count(),0);
    assert.equal(await page.locator('[data-repair-axe-id]').count(),1);await page.screenshot({path:path.join(out,`axe-repair-${width}.png`)});
    // Failed saves retain coins, materials, wear and silence. A successful repair stays manual-equip.
    const failedBefore=await page.evaluate(()=>{window.__realSave=saveGame;saveGame=()=>false;return JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,sounds:__soundEvents});});
    await page.locator('[data-repair-axe-id]').click();assert.equal(await page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,sounds:__soundEvents})),failedBefore);
    await page.evaluate(()=>{saveGame=__realSave;});await page.locator('[data-repair-axe-id]').click();
    assert.equal(await page.locator('[data-repair-axe-id]').count(),0);await home();assert(!(await views()).includes('axeRepairs'));
    // Clear is to the left of All, for every sellable kind; exact selected quantities and money still work.
    const exerciseSale=async(view,rowSelector,actionPrefix)=>{
      await choose(view);const row=page.locator(rowSelector).first();const all=row.locator(`[data-${actionPrefix}-action="all"]`),reset=row.locator(`[data-${actionPrefix}-action="reset"]`);
      assert((await reset.boundingBox()).x<(await all.boundingBox()).x);
      await all.click();assert(Number(await row.locator('.marketQty strong').innerText())>0);
      await reset.click();assert.equal(await row.locator('.marketQty strong').innerText(),'0');
      await row.locator(`[data-${actionPrefix}-action="plus"]`).click();
      const coins=await page.evaluate(()=>GAME_STATE.progression.coins);await page.locator('#marketSellBtn').click();assert((await page.evaluate(()=>GAME_STATE.progression.coins))>coins);
      await page.screenshot({path:path.join(out,`${view}-sale-${width}.png`)});await home();
    };
    await exerciseSale('wood','[data-good-key]','good');await close();
    await open('elli');assert.deepEqual(await views(),['rods','fish','rodRepairs']);
    await choose('rods');assert.equal(await page.locator('[data-repair-rod-id]').count(),0);assert.equal(await page.locator('[data-equipment-id="rod.basic"],[data-equipment-id="rod.sturdy"],[data-equipment-id="rod.master_angler"]').count(),0);
    await home();await choose('rodRepairs');assert.equal(await page.locator('[data-rod-id]').count(),0);await page.locator('[data-repair-rod-id]').click();await home();assert(!(await views()).includes('rodRepairs'));
    await exerciseSale('fish','[data-fish-id]','market');await close();
    await open('haru');assert.deepEqual(await views(),['seeds','crops','orders','decorations']);await page.screenshot({path:path.join(out,`haru-home-${width}.png`)});
    await choose('seeds');assert.equal(await page.locator('[data-seed-id]').count(),14);assert.equal(await page.locator('[data-good-key],[data-farm-action]').count(),0);
    const seed=await page.evaluate(()=>({coins:GAME_STATE.progression.coins,count:lifeItemCount('seed','carrot'),price:LIFE_CROP_BY_ID.get('carrot').seedPrice}));await page.locator('[data-seed-id="carrot"]').click();assert.deepEqual(await page.evaluate(()=>({coins:GAME_STATE.progression.coins,count:lifeItemCount('seed','carrot')})),{coins:seed.coins-seed.price,count:seed.count+1});
    await home();await exerciseSale('crops','[data-good-key]','good');await choose('orders');assert.equal(await page.locator('[data-seed-id],[data-good-key]').count(),0);await home();await choose('decorations');assert.equal(await page.locator('[data-seed-id],[data-good-key]').count(),0);await close();
    await page.evaluate(()=>{GAME_STATE.inventory=GAME_STATE.inventory.filter(item=>!['fish','crop','material'].includes(item.type));});
    for(const [shop,sale]of [['elli','fish'],['haru','crops'],['workshop','wood']]){await open(shop);assert(!(await views()).includes(sale));await close();}
    await open('farm');assert.equal(await page.evaluate(()=>marketState.view),'decorations');assert.equal(await page.locator('#marketBackBtn:visible').count(),0);await close();
    await page.evaluate(()=>{window.__oldAxes=GAME_STATE.progression.forestry.ownedAxeIds;window.__oldRods=GAME_STATE.progression.fishing.purchasedRodIds;
      GAME_STATE.progression.forestry.ownedAxeIds=FORESTRY_AXES.map(axe=>axe.id);GAME_STATE.progression.fishing.purchasedRodIds=FISHING_RODS.filter(rod=>!rod.requiresMasterReward).map(rod=>rod.id);});
    for(const [shop,view,copy]of [['workshop','axes','모든 도끼'],['elli','rods','구매할 낚싯대를 모두']]){
      await open(shop);assert(!(await views()).includes(view));
      if(shop==='elli'){assert.equal((await views()).length,0);assert((await page.locator('.marketGreeting').innerText()).includes('지금 이용할 서비스가 없어요'));}
      await page.evaluate(view=>{marketState.view=view;renderMarket();},view);assert((await page.locator('#marketList').innerText()).includes(copy));await close();
    }
    await page.evaluate(()=>{GAME_STATE.progression.forestry.ownedAxeIds=__oldAxes;GAME_STATE.progression.fishing.purchasedRodIds=__oldRods;});
    const iconReport=await page.evaluate(async()=>{
      // Decode art before the synchronous HUD-only sweep. Do not yield a game
      // frame with a temporary region ID and the previous region's geometry.
      const loaded=new Map(await Promise.all(Object.entries(REGION_ICON_URLS).map(async([id,url])=>{const image=new Image();image.src=url;await image.decode();return [id,image];})));
      const regions=[];for(const [id,region]of Object.entries(REGION_WORLDS)){
        GAME_STATE.regionId=id;updateWorldClockUI();const icon=document.getElementById('locationIcon');
        if(document.getElementById('locationName').textContent!==region.name||icon.getAttribute('src')!==REGION_ICON_URLS[id])throw Error('Wrong location icon: '+id);
        regions.push({id,name:region.name,width:loaded.get(id).naturalWidth,height:loaded.get(id).naturalHeight});
      }
      GAME_STATE.regionId='lilacVillage';updateWorldClockUI();
      const holder=document.createElement('div');holder.id='qaSkillIcons';holder.style.cssText='position:absolute;inset:150px 20px auto;z-index:50;display:grid;gap:8px';
      holder.innerHTML=['fishing','logging','farming'].map(id=>skillCardMarkup(id)).join('');document.getElementById('gameShell').append(holder);
      await Promise.all([...holder.querySelectorAll('img')].map(img=>img.decode()));return {regions,skills:[...holder.querySelectorAll('img')].map(img=>({width:img.naturalWidth,height:img.naturalHeight}))};
    });
    assert.equal(iconReport.regions.length,22);assert(iconReport.regions.every(icon=>icon.width===128&&icon.height===128));assert(iconReport.skills.every(icon=>icon.width===128&&icon.height===128));
    await page.screenshot({path:path.join(out,`skill-icons-${width}.png`)});await page.evaluate(()=>document.getElementById('qaSkillIcons').remove());
    // The generated icons fit actual HUDs, without changing their slot or clipping names.
    for(const id of ['lilacVillage','sunnyFields','forestEleven']){await page.evaluate(id=>{enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn});updateWorldClockUI();},id);await page.screenshot({path:path.join(out,`hud-${id}-${width}.png`)});}
    if(width===1280){
      await page.evaluate(async()=>{const board=document.createElement('div');board.id='qaIconBoard';board.style.cssText='position:fixed;inset:0;z-index:1000;background:#17392f;color:#f5ecd0;padding:22px;display:grid;grid-template-columns:repeat(6,1fr);gap:12px;align-content:start;font:14px system-ui';
        board.innerHTML=Object.entries(REGION_WORLDS).map(([id,region])=>`<div style="display:grid;justify-items:center;gap:5px"><img width="64" height="64" style="object-fit:contain;image-rendering:pixelated" src="${REGION_ICON_URLS[id]}" alt=""><b>${region.name}</b></div>`).join('');document.body.append(board);await Promise.all([...board.querySelectorAll('img')].map(img=>img.decode()));});
      await page.screenshot({path:path.join(out,'all-region-icons.png')});await page.evaluate(()=>document.getElementById('qaIconBoard').remove());
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow);
    const sounds=await page.evaluate(()=>__soundEvents);for(const sound of ['spend','purchase:axe','repair:axe','repair:rod','sale'])assert(sounds.includes(sound));
    reports.push({width,height,icons:iconReport,sounds,emptyCategoriesHidden:true,transactionIsolation:true,saveRollback:true,buttonOrder:'reset, all'});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({url,reports,errors},null,2)+'\n');console.log('Market service isolation, transactions, empty categories, 22 location icons and skill icons passed at 320/393/1280px.');
}finally{await browser.close();}
