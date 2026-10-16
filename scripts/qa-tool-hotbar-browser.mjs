import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/dist/index.html',out=path.resolve(process.argv[2]||'output/tool-hotbar-v1/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),reports=[],errors=[];
try{
  for(const [width,height] of [[393,780],[320,568],[430,932]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.evaluate(()=>{enterWorldRegion({to:'sunnyFields',entry:{x:18,y:30,face:'down'}});worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;});
    assert.equal(await page.locator('[data-quick-tool]').count(),5);
    const layout=await page.evaluate(()=>{
      const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.left,y:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {bar:rect('toolHotbar'),joy:rect('joystick'),action:rect('btnA'),shell:rect('gameShell'),overflow:document.documentElement.scrollWidth>innerWidth,
        slots:[...document.querySelectorAll('[data-quick-tool]')].map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))};
    });assert(!layout.overflow&&layout.bar.x>=layout.shell.x&&layout.bar.right<=layout.shell.right&&layout.bar.bottom<=layout.shell.bottom);
    assert(layout.joy.bottom+10<=layout.bar.y&&layout.action.bottom+10<=layout.bar.y);assert(layout.slots.every(r=>r.width>=44&&r.height>=44));
    const before=await page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,coins:GAME_STATE.progression.coins,logging:GAME_STATE.progression.logging,farming:GAME_STATE.progression.farming,fishing:GAME_STATE.progression.fishing}));
    for(const kind of ['rod','sickle','sword','none','axe']){
      await page.locator('[data-quick-tool="'+kind+'"]').tap();
      assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),kind);assert.equal(await page.locator('[data-quick-tool][aria-pressed="true"]').count(),1);
      assert(await page.locator('[data-quick-tool="'+kind+'"]').evaluate(b=>b.getAttribute('aria-pressed')==='true'));
    }
    assert.equal(await page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,coins:GAME_STATE.progression.coins,logging:GAME_STATE.progression.logging,farming:GAME_STATE.progression.farming,fishing:GAME_STATE.progression.fishing})),before);
    await page.screenshot({path:path.join(out,'hotbar-'+width+'.png')});
    await page.keyboard.press('Digit3');assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'sickle');
    await page.locator('[data-quick-tool="rod"]').focus();await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'rod');
    assert(await page.evaluate(()=>!isChoppingTree()&&!dialogOpen&&!menuOpen));
    const upgraded=await page.evaluate(()=>{
      const axe=FORESTRY_AXES[1],rod=FISHING_RODS.find(r=>r.id==='rod.sturdy');
      Object.assign(GAME_STATE.progression.fishing,lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',rod.unlockLevel)));
      GAME_STATE.progression.forestry.ownedAxeIds.push(axe.id);GAME_STATE.progression.forestry.axeId=axe.id;
      GAME_STATE.progression.fishing.purchasedRodIds.push(rod.id);GAME_STATE.progression.fishing.equippedRodId=rod.id;
      GAME_STATE.progression.forestry.durabilityByAxeId[axe.id]=axe.maxDurability-3;GAME_STATE.progression.fishing.durabilityByRodId[rod.id]=rod.maxDurability-3;
      refreshToolHotbar();return {axe:axe.id,rod:rod.id,axeWear:axe.maxDurability-3,rodWear:rod.maxDurability-3};
    });
    for(const kind of ['axe','rod']){
      await page.locator('[data-quick-tool="'+kind+'"]').tap();
      assert.equal(await page.locator('[data-quick-tool="'+kind+'"]').getAttribute('data-tool-id'),upgraded[kind]);
      assert(await page.evaluate(kind=>document.querySelector('[data-quick-tool="'+kind+'"] img').getAttribute('src')===CHARACTER_TOOL_URLS[kind==='axe'?getEquippedForestryAxe().id:getEquippedFishingRod().id],kind));
    }
    assert.deepEqual(await page.evaluate(()=>({axeWear:getForestryAxeDurability().current,rodWear:getFishingRodDurability().current})),{axeWear:upgraded.axeWear,rodWear:upgraded.rodWear});
    const broken=await page.evaluate(()=>{
      GAME_STATE.progression.forestry.durabilityByAxeId[getEquippedForestryAxe().id]=0;GAME_STATE.appearance.activeTool='none';refreshContext();
      return !quickEquipTool('axe')&&GAME_STATE.appearance.activeTool==='none';
    });assert(broken);assert(await page.locator('[data-quick-tool="axe"]').isDisabled());
    await page.evaluate(wear=>{GAME_STATE.progression.forestry.durabilityByAxeId[getEquippedForestryAxe().id]=wear;refreshToolHotbar();},upgraded.axeWear);
    const rollback=await page.evaluate(()=>{
      const before=JSON.stringify({appearance:GAME_STATE.appearance,forestry:GAME_STATE.progression.forestry,fishing:GAME_STATE.progression.fishing}),original=saveGame;saveGame=()=>false;
      let result;try{result=quickEquipTool('sickle');}finally{saveGame=original;}
      return !result&&before===JSON.stringify({appearance:GAME_STATE.appearance,forestry:GAME_STATE.progression.forestry,fishing:GAME_STATE.progression.fishing});
    });assert(rollback);
    await page.evaluate(()=>{openInventory();});assert(await page.locator('[data-quick-tool="sickle"]').isDisabled());
    const held=await page.evaluate(()=>GAME_STATE.appearance.activeTool);await page.keyboard.press('Digit3');assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),held);
    await page.locator('#inventoryClose').tap();await page.waitForFunction(()=>!isInventoryOpen()&&!window.history.state?.pixelLifeOverlay);
    await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:26,y:20,face:'right'}});quickEquipTool('rod');
    });await page.locator('#btnA').tap();await page.waitForFunction(()=>isFishingActive());
    await page.waitForFunction(()=>document.querySelector('[data-quick-tool="axe"]').disabled);assert(await page.evaluate(()=>!quickEquipTool('axe')&&GAME_STATE.appearance.activeTool==='rod'));
    await page.locator('#fishingCancelBtn').tap();await page.waitForFunction(()=>!isFishingActive());await page.locator('[data-quick-tool="sickle"]').tap();
    await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:14,y:22,face:'right'}});GAME_STATE.world.plots.farm_01={unlocked:true,cropId:'carrot',plantedAt:Date.now()-LIFE_CROP_BY_ID.get('carrot').growMs-1};
    });await page.locator('#btnA').tap();assert(await page.evaluate(()=>isChoppingTree()&&!quickEquipTool('rod')&&GAME_STATE.appearance.activeTool==='sickle'));
    await page.waitForFunction(()=>!isChoppingTree()&&getFarmPlotPhase(farmPlotAt(15,22))==='EMPTY');
    await page.locator('[data-quick-tool="none"]').tap();await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'none');assert.equal(await page.locator('[data-quick-tool="none"]').getAttribute('aria-pressed'),'true');
    assert.deepEqual(await page.evaluate(()=>({axe:getEquippedForestryAxe().id,rod:getEquippedFishingRod().id})),{axe:upgraded.axe,rod:upgraded.rod});
    reports.push({width,height,layout,fiveTools:true,keyboard:true,upgraded,brokenBlocked:true,rollback:true,actionsLocked:true,reload:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2)+'\n');console.log('Tool hotbar passed: 393/320/430px, five touch slots, keys/Space, remembered upgraded tools and art, no overlap, broken/busy guards, atomic rollback, real fishing/harvest and reload.');
}finally{await browser.close();}
