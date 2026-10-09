// Mobile browser end-to-end test for axe durability, breakage and village repair.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forestry-durability-qa');
fs.mkdirSync(output,{recursive:true});

const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(base);
  await page.waitForFunction(()=>typeof repairForestryAxe==='function');
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.waitForFunction(()=>typeof repairForestryAxe==='function');

  const chopReport=await page.evaluate(()=>{
    let axeBreakSoundCount=0;
    playAxeBreakSound=()=>{axeBreakSoundCount+=1;return true;};
    Math.random=()=>0;
    enterWorldRegion({to:'oldForest',entry:{x:31,y:44,face:'up'}});
    GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:['axe.basic'],durabilityByAxeId:{}};
    GAME_STATE.appearance.activeTool='axe';
    const oak=trees.find(tree=>tree.species==='oak'&&tree.interactable);
    const oakHits=Math.ceil(FORESTRY_TREES.oak.maxHp/FORESTRY_AXES[0].damage);
    document.getElementById('lifeToast').classList.remove('show');
    document.getElementById('lifeToast').textContent='';
    for(let hit=0;hit<oakHits;hit++)if(!hitResourceTree(oak))throw new Error('Basic axe chop failed');
    const noDropQuiet=!document.getElementById('lifeToast').classList.contains('show')&&
      document.getElementById('lifeToast').textContent===''&&lifeItemCount('material','oak_log')===0;
    if(!noDropQuiet||Object.hasOwn(GAME_STATE.progression.forestry.durabilityByAxeId,'axe.basic'))
      throw new Error('Basic axe durability or no-drop feedback is wrong');
    if(isTreeDiscoveryOpen())closeTreeDiscoveryReveal({fromHistory:true});

    enterWorldRegion({to:'deepForest',entry:{x:31,y:44,face:'up'}});
    GAME_STATE.progression.forestry={axeId:'axe.iron',ownedAxeIds:['axe.basic','axe.iron'],
      durabilityByAxeId:{'axe.iron':4}};
    GAME_STATE.appearance.activeTool='axe';
    const maple=trees.find(tree=>tree.species==='maple'&&tree.interactable);
    if(!maple||!hitResourceTree(maple)||getForestryAxeDurability('axe.iron').current!==2||
      !hitResourceTree(maple))throw new Error('Iron durability did not fall by Tier-2 hit cost');
    const hp=getTreeState(maple).hp;
    if(hp!==20||getForestryAxeDurability('axe.iron').current!==0||GAME_STATE.appearance.activeTool!=='none'||
      hitResourceTree(maple)||getTreeState(maple).hp!==hp||equipForestryAxe('axe.iron'))
      throw new Error('Broken axe did not stop use and auto-unequip');
    return {noDropQuiet,basicInfinite:true,mapleId:maple.id,hp,axeBreakSoundCount,
      hitCosts:[forestryAxeHitCost(FORESTRY_TREES.oak),forestryAxeHitCost(FORESTRY_TREES.maple),forestryAxeHitCost(FORESTRY_TREES.worldroot)]};
  });
  if(chopReport.axeBreakSoundCount!==1)throw new Error('Axe break sound did not play exactly once');

  await page.reload();
  await page.waitForFunction(()=>typeof repairForestryAxe==='function');
  const restored=await page.evaluate(mapleId=>({
    durability:getForestryAxeDurability('axe.iron').current,
    activeTool:GAME_STATE.appearance.activeTool,
    hp:GAME_STATE.world.trees[mapleId]?.hp
  }),chopReport.mapleId);
  if(restored.durability!==0||restored.activeTool!=='none'||restored.hp!==20)
    throw new Error(`Broken axe state did not survive reload: ${JSON.stringify(restored)}`);

  await page.evaluate(()=>{
    openInventory({fromHistory:true});
    inventoryState.tab='equipment';renderInventory();
    const summary=document.getElementById('inventorySummary').textContent;
    const iron=document.querySelector('[data-equip-type="axe"][data-equip-id="axe.iron"]');
    if(!summary.includes('장착 없음')||!iron?.classList.contains('broken')||!iron.querySelector('.inventoryBrokenMark')||
      !iron.getAttribute('aria-label').includes('수리 필요'))
      throw new Error('Broken axe is not clearly marked in the inventory');
    openInventoryDetail('axe','axe.iron',{fromHistory:true});
    const detail=document.getElementById('inventoryDetailContent').textContent;
    if(!detail.includes('내구도 0 / 180')||!detail.includes('준의 도구점에서 수리'))
      throw new Error('Broken axe detail does not explain durability and repair');
    closeInventoryDetail({fromHistory:true});
  });
  await page.screenshot({path:path.join(output,'broken-axe-inventory-393.png')});
  await page.evaluate(()=>closeInventory({fromHistory:true}));

  await page.evaluate(()=>{
    GAME_STATE.regionId='lilacVillage';
    GAME_STATE.progression.coins=1000;
    saveGame();
    openMarket({shop:'workshop',fromHistory:true});
    marketState.view='axes';renderMarket();
  });
  const repairButton=page.locator('[data-repair-axe-id="axe.iron"]');
  if(await repairButton.count()!==1||await repairButton.textContent()!=='수리 150코인')
    throw new Error('Jun workshop did not show the broken iron axe repair');
  await repairButton.scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'broken-axe-repair-393.png')});
  await repairButton.tap();
  const repaired=await page.evaluate(()=>({
    durability:getForestryAxeDurability('axe.iron').current,
    activeTool:GAME_STATE.appearance.activeTool,
    coins:GAME_STATE.progression.coins,
    message:document.getElementById('marketMessage').textContent,
    repairButton:Boolean(document.querySelector('[data-repair-axe-id="axe.iron"]')),
    equipped:equipForestryAxe('axe.iron')
  }));
  if(repaired.durability!==180||repaired.activeTool!=='none'||repaired.coins!==850||repaired.repairButton||
    !repaired.message.includes('수리 완료')||!repaired.equipped)
    throw new Error(`Village repair result is wrong: ${JSON.stringify(repaired)}`);
  await page.screenshot({path:path.join(output,'repaired-axe-393.png')});

  await page.evaluate(()=>{
    GAME_STATE.progression.forestry.durabilityByAxeId['axe.iron']=126;
    GAME_STATE.progression.coins=500;
    saveGame();renderMarket();
    document.querySelector('[data-equipment-id="axe.iron"]').open=true;
  });
  const partialRepairButton=page.locator('[data-repair-axe-id="axe.iron"]');
  if(await partialRepairButton.textContent()!=='수리 45코인')
    throw new Error('A 70%-durability iron axe did not show its proportional repair cost');
  await partialRepairButton.scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'partial-axe-repair-393.png')});
  await partialRepairButton.tap();
  const partialRepair=await page.evaluate(()=>(
    {durability:getForestryAxeDurability('axe.iron').current,coins:GAME_STATE.progression.coins,
      activeTool:GAME_STATE.appearance.activeTool,message:document.getElementById('marketMessage').textContent}
  ));
  if(partialRepair.durability!==180||partialRepair.coins!==455||partialRepair.activeTool!=='axe'||
    !partialRepair.message.includes('수리 완료')||partialRepair.message.includes('다시 장착'))
    throw new Error(`70% partial repair result is wrong: ${JSON.stringify(partialRepair)}`);

  await page.evaluate(()=>{
    window.__equipSoundCount=0;
    // Weapon/clothes/rod sounds were separated by the earlier audio update.
    playEquipWeaponSound=()=>{window.__equipSoundCount+=1;return true;};
    closeMarket({fromHistory:true});
    openInventory({fromHistory:true});inventoryState.tab='equipment';renderInventory();
  });
  await page.locator('[data-equip-type="axe"][data-equip-id="axe.basic"]').tap();
  await page.locator('[data-equip-type="axe"][data-equip-id="axe.iron"]').tap();
  await page.locator('[data-equip-type="axe"][data-equip-id="axe.iron"]').tap();
  const equipSoundReport=await page.evaluate(()=>(
    {count:window.__equipSoundCount,axeId:GAME_STATE.progression.forestry.axeId,activeTool:GAME_STATE.appearance.activeTool}
  ));
  if(equipSoundReport.count!==2||equipSoundReport.axeId!=='axe.iron'||equipSoundReport.activeTool!=='axe')
    throw new Error(`Successful inventory equips did not play once each or repeated on the equipped card: ${JSON.stringify(equipSoundReport)}`);
  await page.evaluate(()=>closeInventory({fromHistory:true}));

  await page.evaluate(()=>{openMarket({shop:'workshop',fromHistory:true});marketState.view='axes';renderMarket();});
  const returnBuyButton=page.locator('[data-buy-return-item="village_return_charm"]');
  await returnBuyButton.tap();
  await returnBuyButton.tap();
  const purchasedReturns=await page.evaluate(()=>(
    {count:lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id),coins:GAME_STATE.progression.coins,
      message:document.getElementById('marketMessage').textContent}
  ));
  if(purchasedReturns.count!==2||purchasedReturns.coins!==255||!purchasedReturns.message.includes('가방의 재료 탭'))
    throw new Error(`Return item purchase is wrong: ${JSON.stringify(purchasedReturns)}`);
  await page.screenshot({path:path.join(output,'return-item-shop-393.png')});

  await page.evaluate(()=>{
    closeMarket({fromHistory:true});
    enterWorldRegion({to:'deepForest',entry:{x:25,y:44,face:'up'}});
    openInventory();inventoryState.tab='supplies';renderInventory();
  });
  const returnCard=page.locator('[data-use-item-id="village_return_charm"]');
  if(await returnCard.count()!==1||!(await returnCard.getAttribute('aria-label')).includes('귀환석, 2개, 사용하기'))
    throw new Error('Purchased return items are not usable from the inventory supplies tab');
  await page.screenshot({path:path.join(output,'return-item-inventory-393.png')});
  await returnCard.tap();
  await page.waitForFunction(()=>GAME_STATE.regionId==='lilacVillage'&&!isInventoryOpen());
  const returned=await page.evaluate(()=>(
    {region:GAME_STATE.regionId,x:player.x,y:player.y,face:player.face,
      count:lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id),toast:document.getElementById('lifeToast').textContent}
  ));
  if(returned.region!=='lilacVillage'||returned.x!==25||returned.y!==3||returned.face!=='down'||
    returned.count!==1||!returned.toast.includes('마을로 돌아왔어요'))
    throw new Error(`Return item use is wrong: ${JSON.stringify(returned)}`);

  await page.evaluate(()=>{openInventory();inventoryState.tab='supplies';renderInventory();});
  await page.locator('[data-use-item-id="village_return_charm"]').tap();
  await page.waitForFunction(()=>!isInventoryOpen());
  const homeUse=await page.evaluate(()=>(
    {open:isInventoryOpen(),count:lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id),
      region:GAME_STATE.regionId,x:player.x,y:player.y,toast:document.getElementById('lifeToast').textContent}
  ));
  if(homeUse.open||homeUse.count!==0||homeUse.region!=='lilacVillage'||homeUse.x!==25||homeUse.y!==3||
    !homeUse.toast.includes('마을로 돌아왔어요'))
    throw new Error(`Return Stone did not consume and resolve inside the village: ${JSON.stringify(homeUse)}`);

  await page.reload();
  await page.waitForFunction(()=>typeof getForestryAxeDurability==='function');
  const finalState=await page.evaluate(()=>({
    durability:getForestryAxeDurability('axe.iron').current,
    activeTool:GAME_STATE.appearance.activeTool,
    axeId:GAME_STATE.progression.forestry.axeId,
    coins:GAME_STATE.progression.coins
  }));
  finalState.returnItems=await page.evaluate(()=>lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id));
  if(finalState.durability!==180||finalState.activeTool!=='axe'||finalState.axeId!=='axe.iron'||finalState.coins!==255||finalState.returnItems!==0)
    throw new Error(`Repaired and re-equipped axe did not survive reload: ${JSON.stringify(finalState)}`);
  if(chopReport.hitCosts.join(',')!=='1,2,10')throw new Error('Higher-tier trees do not consume more durability');
  if(errors.length)throw new Error(errors.join('\n'));
  const report={chopReport,restored,repaired,partialRepair,equipSoundReport,purchasedReturns,returned,homeUse,finalState};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Forestry durability browser QA passed: quiet no-drop, raised full/70% repairs, Return Stone use inside/outside village and reload');
}finally{
  await browser.close();
}
