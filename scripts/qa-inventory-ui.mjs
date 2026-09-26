// Real card/info-button input, history, layout, and appearance save regressions.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/character-qa/inventory');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base);
  await page.waitForFunction(()=>typeof openInventory==='function'&&characterOutfitImgs['outfit.traveler'],null,{polling:50});
  await page.evaluate(()=>openInventory());
  await page.locator('[data-inventory-tab="equipment"]').tap();
  const gridCheck=async()=>page.evaluate(()=>{
    for(const grid of document.querySelectorAll('#inventoryScroll .inventoryItemGrid')){
      if(getComputedStyle(grid).gridTemplateColumns.split(' ').length!==3)throw new Error('Grid is not three columns');
    }
    for(const info of document.querySelectorAll('.inventoryInfoButton')){
      const box=info.getBoundingClientRect();
      if(box.width<44||box.height<44||box.right>innerWidth||box.left<0)throw new Error('Info touch target/layout fails');
    }
    if(document.querySelector('#inventoryScroll .inventoryItemCount'))throw new Error('Weapon/appearance count remains');
    if(document.querySelector('#inventoryScroll [data-held-tool]'))throw new Error('Duplicate hand picker remains');
  });
  await gridCheck();
  await page.screenshot({path:path.join(output,'mobile-equipment.png')});
  const original=await page.evaluate(()=>JSON.stringify(GAME_STATE));
  await page.locator('[data-inventory-info-id="rod.basic"]').tap();
  await page.evaluate(before=>{
    if(!isInventoryDetailOpen()||document.getElementById('inventoryDetailTitle').textContent!=='기본 낚싯대'||
      !document.getElementById('inventoryPanel').inert||JSON.stringify(GAME_STATE)!==before)
      throw new Error('Info button equips tool or opens wrong detail');
    const box=document.querySelector('.inventoryDetailSheet').getBoundingClientRect();
    const frame=document.getElementById('inventoryDetailModal').getBoundingClientRect();
    if(Math.abs((box.top+box.bottom)/2-(frame.top+frame.bottom)/2)>2||box.bottom>frame.bottom)
      throw new Error('Detail is not centered/contained');
  },original);
  await page.screenshot({path:path.join(output,'mobile-rod-detail.png')});
  await page.keyboard.press('Tab');
  if(await page.locator('#inventoryDetailClose').evaluate(el=>el!==document.activeElement))throw new Error('Detail focus escapes');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!isInventoryDetailOpen()&&window.history.state?.pixelLifeOverlay==='inventory',null,{polling:50});
  await page.locator('[data-inventory-info-id="axe.basic"]').tap();
  await page.goBack();
  await page.waitForFunction(()=>!isInventoryDetailOpen()&&isInventoryOpen(),null,{polling:50});
  await page.goForward();
  await page.waitForFunction(()=>isInventoryDetailOpen()&&inventoryState.detail.id==='axe.basic',null,{polling:50});
  await page.locator('#inventoryDetailClose').tap();
  await page.waitForFunction(()=>!isInventoryDetailOpen()&&window.history.state?.pixelLifeOverlay==='inventory',null,{polling:50});
  await page.locator('[data-equip-id="rod.basic"]').tap();
  await page.evaluate(()=>{
    if(GAME_STATE.appearance.activeTool!=='rod'||document.querySelectorAll('[data-equip-type].equipped').length!==1)
      throw new Error('Card does not equip exactly one tool');
  });
  await page.locator('[data-inventory-tab="appearance"]').tap();
  await gridCheck();
  await page.evaluate(()=>{
    if(document.querySelectorAll('.inventoryAppearanceSection').length!==2||
      document.querySelectorAll('[data-equip-type="outfit"]').length!==1||
      document.querySelectorAll('[data-equip-type="backpack"]').length!==1||
      document.querySelector('#inventoryScroll').textContent.includes('헤어')||
      document.querySelector('#inventoryScroll').textContent.includes('모자'))
      throw new Error('Appearance groups include unexpected parts');
    for(const image of document.querySelectorAll('#inventoryScroll img')){
      if(!image.src.startsWith('data:image/png'))throw new Error('Appearance is not an actual part thumbnail');
    }
  });
  await page.screenshot({path:path.join(output,'mobile-appearance.png')});
  await page.locator('[data-inventory-info-id="pack.traveler"]').tap();
  await page.screenshot({path:path.join(output,'mobile-backpack-detail.png')});
  await page.locator('#inventoryDetailClose').tap();
  await page.waitForFunction(()=>!isInventoryDetailOpen()&&window.history.state?.pixelLifeOverlay==='inventory',null,{polling:50});
  // Runtime-only owned alternatives exercise future item IDs without shipping new art/items.
  await page.evaluate(()=>{
    CHARACTER_OUTFIT_BY_ID.set('outfit.qa',{...CHARACTER_OUTFIT_BY_ID.get(DEFAULT_OUTFIT_ID),id:'outfit.qa',name:'QA 의상'});
    CHARACTER_PARTS.backpack.set('pack.qa',{...CHARACTER_PARTS.backpack.get('pack.traveler'),name:'QA 가방'});
    characterOutfitImgs['outfit.qa']=characterOutfitImgs[DEFAULT_OUTFIT_ID];
    if(equipInventoryAppearance('outfit','outfit.qa')||equipInventoryAppearance('backpack','pack.qa'))
      throw new Error('Unowned appearance accepted');
    GAME_STATE.appearance.ownedOutfitIds.push('outfit.qa');
    GAME_STATE.appearance.ownedBackpackIds.push('pack.qa');
    renderInventoryAppearance();
  });
  await page.locator('[data-equip-id="outfit.qa"]').tap();
  await page.locator('[data-equip-id="pack.qa"]').tap();
  await page.evaluate(()=>{
    if(GAME_STATE.appearance.outfitId!=='outfit.qa'||GAME_STATE.appearance.backpackId!=='pack.qa'||
      GAME_STATE.appearance.activeTool!=='rod'||GAME_STATE.appearance.hairId!=='hair.brown'||
      document.querySelectorAll('[data-equip-type="outfit"].equipped').length!==1||
      document.querySelectorAll('[data-equip-type="backpack"].equipped').length!==1)
      throw new Error('Independent appearance equip failed');
    window.__originalSave=saveGame;saveGame=()=>false;
    window.__beforeFailedAppearance=JSON.stringify(GAME_STATE);
  });
  await page.locator('[data-equip-id="outfit.traveler"]').tap();
  await page.evaluate(()=>{
    if(JSON.stringify(GAME_STATE)!==window.__beforeFailedAppearance)throw new Error('Failed appearance save not rolled back');
    saveGame=window.__originalSave;
  });
  await page.locator('[data-equip-id="outfit.traveler"]').tap();
  await page.locator('[data-equip-id="pack.traveler"]').tap();
  await page.setViewportSize({width:320,height:568});
  await gridCheck();
  await page.screenshot({path:path.join(output,'small-appearance.png')});
  await page.locator('[data-inventory-tab="equipment"]').tap();
  await page.evaluate(()=>{
    GAME_STATE.progression.fishing.purchasedRodIds=FISHING_RODS.map(rod=>rod.id);
    GAME_STATE.progression.flags.masterRod=true;
    GAME_STATE.progression.forestry.ownedAxeIds=FORESTRY_AXES.map(axe=>axe.id);
    renderInventoryEquipment();
  });
  await gridCheck();
  const infoIds=await page.locator('.inventoryInfoButton').evaluateAll(nodes=>nodes.map(node=>({type:node.dataset.inventoryInfoType,id:node.dataset.inventoryInfoId})));
  if(infoIds.length!==10)throw new Error('Owned weapon tiers missing');
  await page.screenshot({path:path.join(output,'small-all-owned-tools.png')});
  for(const {type,id} of infoIds){
    const before=await page.evaluate(()=>JSON.stringify(GAME_STATE));
    await page.locator('[data-inventory-info-id="'+id+'"]').tap();
    await page.evaluate(({type,id,before})=>{
      const item=inventoryWearable(type,id);
      if(document.getElementById('inventoryDetailTitle').textContent!==item.name||JSON.stringify(GAME_STATE)!==before)
        throw new Error('Tier detail changed equip/progress');
    },{type,id,before});
    await page.locator('#inventoryDetailClose').tap();
    await page.waitForFunction(()=>!isInventoryDetailOpen()&&window.history.state?.pixelLifeOverlay==='inventory',null,{polling:50});
  }
  await page.locator('[data-inventory-tab="appearance"]').tap();
  await page.evaluate(()=>saveGame());
  await page.reload();
  await page.waitForFunction(()=>typeof openInventory==='function'&&characterOutfitImgs['outfit.traveler'],null,{polling:50});
  await page.evaluate(()=>{
    if(GAME_STATE.appearance.activeTool!=='rod'||GAME_STATE.appearance.outfitId!==DEFAULT_OUTFIT_ID||
      GAME_STATE.appearance.backpackId!=='pack.traveler')throw new Error('Tool or appearance not restored');
    openInventory();
  });
  await page.locator('[data-inventory-tab="equipment"]').tap();
  await page.goBack();
  await page.waitForFunction(()=>!isInventoryOpen()&&!isInventoryDetailOpen(),null,{polling:50});
  const desktop=await browser.newContext({viewport:{width:1100,height:900}});
  const pc=await desktop.newPage();pc.on('pageerror',error=>errors.push(error.message));
  await pc.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await pc.goto(base);
  await pc.waitForFunction(()=>typeof openInventory==='function'&&characterOutfitImgs['outfit.traveler'],null,{polling:50});
  await pc.evaluate(()=>openInventory({fromHistory:true}));
  await pc.locator('[data-inventory-tab="equipment"]').click();
  const card=pc.locator('[data-equip-id="rod.basic"]');
  await card.hover();
  await pc.waitForFunction(()=>getComputedStyle(document.querySelector('[data-equip-id="rod.basic"] .inventoryItemName')).opacity==='1',null,{polling:50});
  await card.focus();await pc.keyboard.press('Space');
  await pc.evaluate(()=>{if(GAME_STATE.appearance.activeTool!=='rod')throw new Error('Native keyboard card equip failed');});
  await pc.locator('[data-inventory-info-id="axe.basic"]').focus();await pc.keyboard.press('Enter');
  await pc.keyboard.press('KeyX');
  await pc.waitForFunction(()=>!isInventoryDetailOpen(),null,{polling:50});
  if(errors.length)throw new Error(errors.join('\n'));
  const report={threeColumns:true,imageOnlyCards:true,separateInfoButtons:true,singleWeapon:true,appearanceGroups:['옷','가방'],
    independentAppearanceEquip:true,unownedRejected:true,saveRollback:true,reload:true,allWeaponDetails:10,
    historyBackForward:true,keyboard:true,viewports:['393x780','320x568','1100x900'],browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Inventory UI QA passed: '+JSON.stringify(report));
}finally{await browser.close();}
