// Isolated browser regression: only the one held tool may start its activity.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/held-tool-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base);
  await page.waitForFunction(()=>typeof selectHeldTool==='function'&&characterOutfitImgs['outfit.traveler'],null,{polling:50});
  const checkEquipment=async tool=>{
    await page.evaluate(tool=>{
      const cards=[...document.querySelectorAll('[data-equip-type].equipped')];
      if(cards.length!==1||cards[0].dataset.equipType!==tool||GAME_STATE.appearance.activeTool!==tool)
        throw new Error('Not exactly one equipped weapon: '+tool);
    },tool);
  };
  await page.evaluate(()=>openInventory({fromHistory:true}));
  await page.locator('[data-inventory-tab="equipment"]').tap();
  await checkEquipment('axe');
  await page.locator('[data-equip-id="rod.basic"]').tap();
  await checkEquipment('rod');
  await page.screenshot({path:path.join(output,'inventory-rod.png')});
  await page.locator('[data-equip-id="axe.basic"]').tap();
  await checkEquipment('axe');
  await page.screenshot({path:path.join(output,'inventory-axe.png')});
  await page.locator('[data-held-tool="rod"]').tap();
  await checkEquipment('rod');
  await page.evaluate(()=>closeInventory({fromHistory:true}));
  await page.reload();
  await page.waitForFunction(()=>typeof selectHeldTool==='function'&&characterOutfitImgs['outfit.traveler'],null,{polling:50});
  await page.evaluate(()=>{
    if(GAME_STATE.appearance.activeTool!=='rod')throw new Error('Held slot not restored');
    if(!selectHeldTool('axe'))throw new Error('Cannot equip axe');
    let position=null;
    for(const tile of waterSet){
      const [wx,wy]=tile.split(',').map(Number);
      for(const [face,[dx,dy]] of Object.entries(dirVec)){
        const x=wx-dx,y=wy-dy;
        if(!inside(x,y)||blocked.has(key(x,y))||npcAt(x,y))continue;
        Object.assign(player,{x,y,face,px:x*TILE+TILE/2,py:y*TILE+TILE/2,moving:false});
        if(resolveWorldInteraction())continue;
        position={x,y,face};break;
      }
      if(position)break;
    }
    if(!position)throw new Error('No unobstructed shore');
    window.__shore=position;
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
    if(startFishing()!==false||isFishingActive())throw new Error('Axe starts fishing directly');
    window.__beforeAir=JSON.stringify(GAME_STATE);
    drawWorld();
  });
  for(const input of ['touch','Space','KeyZ']){
    if(input==='touch')await page.locator('#btnA').tap();
    else await page.keyboard.press(input);
    await page.evaluate(()=>{
      if(!lifeUi.chop||lifeUi.chop.tree||isFishingActive()||getCharacterPose().tool!=='axe')
        throw new Error('Axe at water is not an axe swing');
      if(selectHeldTool('rod')||equipFishingRod('rod.basic')||equipForestryAxe('axe.basic'))
        throw new Error('Equipment changes during a swing');
      tNow=lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.impactMs;
      updateLifeContentUi(tNow);drawWorld();
      if(JSON.stringify(GAME_STATE)!==window.__beforeAir)throw new Error('Water air swing changes progress');
    });
    await page.screenshot({path:path.join(output,'shore-axe-'+input+'.png')});
    await page.evaluate(()=>updateLifeContentUi(lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.durationMs));
  }
  await page.evaluate(()=>{
    if(!selectHeldTool('rod')||resolveWorldInteraction()?.kind!=='fishing'||startAxeSwing()!==false)
      throw new Error('Rod eligibility failed');
  });
  await page.locator('#btnA').tap();
  await page.evaluate(()=>{
    if(!isFishingActive()||getCharacterPose().tool!=='rod')throw new Error('Rod touch fails fishing');
    if(selectHeldTool('axe')||equipForestryAxe('axe.basic')||equipFishingRod('rod.basic'))
      throw new Error('Equipment changes during fishing');
    updateFishing(FISHING_CONFIG.castMs);drawWorld();
  });
  await page.screenshot({path:path.join(output,'shore-rod-fishing.png')});
  await page.evaluate(()=>{
    const count=GAME_STATE.inventory.length,xp=GAME_STATE.progression.fishing.totalXp;
    fishingState.biteDelay=0;updateFishing(0);handleFishingAction();
    if(!isFishingResult()||GAME_STATE.inventory.length!==count+1||GAME_STATE.progression.fishing.totalXp<=xp)
      throw new Error('Equipped rod catch/XP failed');
    closeDialog();
    GAME_STATE.regionId='oldForest';buildWorldRegion(REGION_WORLDS.oldForest);
    const tree=trees.find(t=>t.x>8&&t.y>10&&t.y<38&&FORESTRY_TREES[t.species].tier===1&&!blocked.has(key(t.x-1,t.y)));
    if(!tree)throw new Error('No beginner tree');
    window.__tree=tree;
    Object.assign(player,{x:tree.x-1,y:tree.y,px:(tree.x-1)*TILE+TILE/2,py:tree.y*TILE+TILE/2,face:'right',moving:false});
    window.__treeHp=getTreeState(tree).hp;
    if(!resolveWorldInteraction()?.label.includes('도끼 장착 필요')||startTreeChop(tree)!==false)
      throw new Error('Rod can chop tree directly');
  });
  await page.locator('#btnA').tap();
  await page.evaluate(()=>{
    if(isChoppingTree()||getTreeState(window.__tree).hp!==window.__treeHp||GAME_STATE.appearance.activeTool!=='rod')
      throw new Error('Rod touch auto-switches to axe');
    if(!selectHeldTool('axe'))throw new Error('Cannot equip axe after fishing');
  });
  await page.locator('#btnA').tap();
  await page.evaluate(()=>{
    if(!lifeUi.chop?.tree)throw new Error('Equipped axe cannot chop');
    tNow=lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.impactMs;updateLifeContentUi(tNow);
    if(getTreeState(window.__tree).hp!==window.__treeHp-20)throw new Error('Axe damage changed');
    updateLifeContentUi(lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.durationMs);
    if(getEquippedFishingRod().id!=='rod.basic'||getEquippedForestryAxe().id!=='axe.basic')
      throw new Error('Remembered weapon variants changed');
    window.__savedProgress=JSON.stringify({progression:GAME_STATE.progression,inventory:GAME_STATE.inventory});
    if(!saveGame())throw new Error('Save failed');
  });
  const savedProgress=await page.evaluate(()=>window.__savedProgress);
  await page.reload();
  await page.waitForFunction(()=>typeof selectHeldTool==='function'&&characterOutfitImgs['outfit.traveler'],null,{polling:50});
  await page.evaluate(saved=>{
    if(GAME_STATE.appearance.activeTool!=='axe'||JSON.stringify({progression:GAME_STATE.progression,inventory:GAME_STATE.inventory})!==saved)
      throw new Error('Final held slot or progress lost after reload');
  },savedProgress);
  await page.evaluate(()=>{
    if(GAME_STATE.appearance.activeTool!=='axe'||GAME_STATE.inventory.length!==1||GAME_STATE.progression.fishing.totalXp<=0)
      throw new Error('Held slot/catch/XP not restored');
  });
  if(errors.length)throw new Error(errors.join('\n'));
  const report={singleEquippedWeapon:true,inventoryCardsAndHandPicker:true,reloadHeldSlot:true,
    axeAtWater:['touch','Space','KeyZ'],rodAtWaterCatchAndXp:true,rodCannotChop:true,
    busyEquipmentBlocked:true,axeTreeDamage:20,rememberedVariants:true,browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Held-tool browser QA passed: '+JSON.stringify(report));
}finally{await browser.close();}
