import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/',out=path.resolve(process.argv[2]||'output/lower-axe/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const treeId=await page.evaluate(()=>{
      enterWorldRegion({to:'deepForest',entry:REGION_WORLDS.deepForest.playerSpawn},{skipSave:true});worldTime.debugLocked=true;worldTime.minutes=720;weatherState.debugLocked=true;weatherState.kind='clear';
      GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:['axe.basic'],durabilityByAxeId:{}};GAME_STATE.appearance.activeTool='axe';
      const tree=trees.find(t=>t.species==='maple'&&[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>!isBlocked(t.x+dx,t.y+dy)));
      const [dx,dy]=[[0,1],[0,-1],[1,0],[-1,0]].find(([dx,dy])=>!isBlocked(tree.x+dx,tree.y+dy));
      player.x=tree.x+dx;player.y=tree.y+dy;player.px=(player.x+.5)*TILE;player.py=(player.y+.5)*TILE;player.face=dx===1?'left':dx===-1?'right':dy===1?'up':'down';clearMovement();
      globalThis.lowerAxeTreeId=tree.id;globalThis.chopSounds=[];playForestryChopSound=cut=>chopSounds.push(cut);refreshContext();return tree.id;
    });
    assert((await page.locator('#btnA').getAttribute('aria-label')).includes('철 도끼 필요'));
    await page.locator('#btnA').tap();assert(await page.evaluate(()=>!isChoppingTree()&&getTreeState(trees.find(t=>t.id===lowerAxeTreeId)).hp===120));
    assert(await page.evaluate(()=>{
      const axe=FORESTRY_AXES[1];GAME_STATE.progression.coins=10000;for(const [id,count] of Object.entries(axe.materials))addLifeItem('material',id,count);
      const purchased=upgradeForestryAxe(axe.id);refreshContext();return purchased&&getEquippedForestryAxe().id==='axe.basic'&&forestryTreeChopStats(FORESTRY_TREES.maple).damage===8;
    }));
    assert((await page.locator('#btnA').getAttribute('aria-label')).includes('위력 -60%'));
    const swing=async()=>{await page.locator('#btnA').tap();await page.waitForFunction(()=>!isChoppingTree());};
    await swing();assert.equal(await page.evaluate(()=>GAME_STATE.world.trees[lowerAxeTreeId].hp),112);
    await page.evaluate(()=>{GAME_STATE.progression.forestry.durabilityByAxeId['axe.iron']=4;equipForestryAxe('axe.iron');});
    await swing();await swing();
    assert(await page.evaluate(()=>GAME_STATE.world.trees[lowerAxeTreeId].hp===12&&getForestryAxeDurability('axe.iron').broken&&GAME_STATE.appearance.activeTool==='none'&&getForestryUnlockedTier()===2));
    await page.evaluate(()=>{openInventory();inventoryState.tab='equipment';renderInventory();});
    await page.locator('[data-equip-type="axe"][data-equip-id="axe.basic"]').tap();
    await page.locator('[data-inventory-info-type="axe"][data-inventory-info-id="axe.basic"]').tap();
    assert((await page.locator('#inventoryDetailContent').textContent()).includes('위력 40%/25%/15%/10%'));
    await page.screenshot({path:path.join(out,`fallback-detail-${width}.png`)});
    await page.locator('#inventoryDetailClose').tap();await page.locator('#inventoryClose').tap();await page.waitForFunction(()=>!isInventoryOpen()&&!menuOpen);
    assert((await page.locator('#btnA').getAttribute('aria-label')).includes('위력 -60%'));
    await page.screenshot({path:path.join(out,`fallback-tree-${width}.png`)});
    await swing();assert.equal(await page.evaluate(()=>GAME_STATE.world.trees[lowerAxeTreeId].hp),4);
    await page.evaluate(()=>{globalThis.dropRandom=Math.random;Math.random=()=>.99;});await swing();await page.evaluate(()=>Math.random=dropRandom);
    assert(await page.evaluate(()=>GAME_STATE.world.trees[lowerAxeTreeId].hp===0&&lifeItemCount('material','maple_log')===3&&GAME_STATE.progression.logging.totalXp===8&&chopSounds.slice(-2).join(',')==='false,true'));
    await page.evaluate(()=>{if(isTreeDiscoveryOpen())closeTreeDiscoveryReveal();cancelSkillXpFeedback();saveGame();});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert(await page.evaluate(()=>getForestryUnlockedTier()===2&&getForestryAxeDurability('axe.iron').broken&&getEquippedForestryAxe().id==='axe.basic'&&forestryTreeChopStats(FORESTRY_TREES.maple).damage===8&&!forestryTreeChopStats(FORESTRY_TREES.cypress).unlocked));
    const rollback=await page.evaluate(treeId=>{
      const tree=trees.find(t=>t.species==='maple'&&t.id!==treeId),before=JSON.stringify(GAME_STATE),original=saveGame;saveGame=()=>false;
      try{return !hitResourceTree(tree)&&JSON.stringify(GAME_STATE)===before;}finally{saveGame=original;}
    },treeId);assert(rollback);
    const species=await page.evaluate(()=>{
      GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:FORESTRY_AXES.map(a=>a.id),durabilityByAxeId:Object.fromEntries(FORESTRY_AXES.slice(1).map(a=>[a.id,0]))};
      const rows=[];for(const species of FOREST_SPECIES){
        const id=Object.keys(FOREST_REGION_SPECIES).find(id=>REGION_WORLDS[id].trees.some(t=>t.species===species));enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn},{skipSave:true});
        const tree=trees.find(t=>t.species===species),type=FORESTRY_TREES[species];GAME_STATE.world.trees[tree.id]={hp:type.maxHp,maxHp:type.maxHp,choppedAt:null};
        const inventory=JSON.stringify(GAME_STATE.inventory);if(!hitResourceTree(tree))throw Error('Owned broken tier did not unlock '+species);
        const damage=type.maxHp-getTreeState(tree).hp;if(damage!==[20,8,5,3,2][Math.min(4,type.tier-1)]||inventory!==JSON.stringify(GAME_STATE.inventory))throw Error('Wrong fallback damage/reward '+species);
        rows.push({species,tier:type.tier,damage});
      }return rows;
    });assert.equal(species.length,50);
    reports.push({width,treeId,lockedBeforePurchase:true,unlockedAfterPurchase:true,breakAndManualFallback:true,damage:8,finalSounds:[false,true],logs:3,xp:8,reload:true,nextTierLocked:true,rollback,species});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2)+'\n');
  console.log('Lower-axe browser QA passed: 393/320px, real acquisition/gate/8-damage hit/break/manual bag switch/remaining HP/rewards/sounds/reload/rollback; all 50 species retain unlocks with higher axes broken.');
}finally{await browser.close();}
