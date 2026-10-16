import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/',out=path.resolve(process.argv[2]||'output/gameplay-feedback/browser');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.evaluate(()=>{worldTime.debugLocked=true;worldTime.minutes=720;weatherState.debugLocked=true;weatherState.kind='clear';});
    // A real first-discovery card must not consume the 1.9-second loot receipt.
    await page.evaluate(()=>{
      enterWorldRegion({to:'oldForest',entry:{x:25,y:3,face:'down'}},{skipSave:true});
      GAME_STATE.collections.trees={};GAME_STATE.progression.forestry.axeId='axe.basic';GAME_STATE.appearance.activeTool='axe';
      const tree=trees.find(t=>t.interactable&&t.species==='oak');GAME_STATE.world.trees[tree.id]={hp:1,maxHp:100,choppedAt:null};
      const original=Math.random;Math.random=()=>0;try{if(!hitResourceTree(tree))throw Error('First cut failed');}finally{Math.random=original;}
    });
    assert(await page.evaluate(()=>isTreeDiscoveryOpen()&&lifeUi.treeLoot[0]?.message==='참나무 +0개'));
    await page.waitForTimeout(2100);assert(await page.evaluate(()=>lifeUi.treeLoot[0]?.message==='참나무 +0개'));
    await page.locator('#treeDiscoveryClose').tap();
    await page.waitForFunction(()=>document.getElementById('lifeToast').classList.contains('show')&&document.getElementById('lifeToast').textContent==='참나무 +0개',null,{timeout:18000});
    await page.screenshot({path:path.join(out,`zero-loot-${width}.png`)});
    await page.evaluate(()=>{
      cancelSkillXpFeedback();lifeUi.lootUntil=0;
      Object.assign(GAME_STATE.progression.logging,lifeSkillProgressFromTotal('logging',lifeSkillTotalXpForLevel('logging',2)-1));
      const tree=trees.find(t=>t.interactable&&t.species==='oak');GAME_STATE.world.trees[tree.id]={hp:1,maxHp:100,choppedAt:null};
      const original=Math.random;Math.random=()=>.99;try{hitResourceTree(tree);}finally{Math.random=original;}
    });
    await page.waitForFunction(()=>isSkillLevelUpVisible());await page.waitForTimeout(2000);
    assert(await page.evaluate(()=>lifeUi.treeLoot[0]?.message==='참나무 +3개'));
    // The level card also dismisses itself after five seconds. Slow public
    // loads/captures may reach the tap after that timer; accept that path only
    // when the actual overlay has closed, never force a tap through the game.
    let levelUpDismissal='automatic';
    if(await page.evaluate(()=>isSkillLevelUpVisible())){
      try{await page.locator('#skillLevelUpOverlay button').tap({timeout:1500});levelUpDismissal='manual';}
      catch(error){if(await page.evaluate(()=>isSkillLevelUpVisible()))throw error;}
    }
    await page.waitForFunction(()=>document.getElementById('lifeToast').classList.contains('show')&&document.getElementById('lifeToast').textContent==='참나무 +3개');
    const allTrees=await page.evaluate(()=>{
      cancelSkillXpFeedback();lifeUi.treeLoot=[];lifeUi.lootUntil=0;
      GAME_STATE.progression.forestry.axeId=FORESTRY_AXES.at(-1).id;GAME_STATE.progression.forestry.ownedAxeIds=FORESTRY_AXES.map(a=>a.id);
      GAME_STATE.progression.forestry.durabilityByAxeId[FORESTRY_AXES.at(-1).id]=FORESTRY_AXES.at(-1).maxDurability;
      const originalRandom=Math.random,originalFeedback=showSkillXpFeedback;showSkillXpFeedback=()=>{};const rows=[];
      try{
        FOREST_SPECIES.forEach((species,index)=>{
          const region=Object.keys(FOREST_REGION_SPECIES).find(id=>REGION_WORLDS[id].trees.some(t=>t.species===species));
          enterWorldRegion({to:region,entry:REGION_WORLDS[region].playerSpawn},{skipSave:true});
          const tree=trees.find(t=>t.interactable&&t.species===species);if(!tree)throw Error('Missing tree '+species);
          recordTreeDiscovery(species);GAME_STATE.world.trees[tree.id]={hp:1,maxHp:FORESTRY_TREES[species].maxHp,choppedAt:null};
          Math.random=()=>[0,.25,.5,.99][index%4];lifeUi.lootUntil=0;
          const before=lifeItemCount('material',species+'_log');if(!hitResourceTree(tree))throw Error('Cut failed '+species);
          if(lifeUi.treeLoot[0]?.levelUp){lifeUi.treeLoot[0].readyAt=0;flushTreeLootFeedback();}
          const count=lifeItemCount('material',species+'_log')-before,message=document.getElementById('lifeToast').textContent;
          if(message!==`${FOREST_WOOD[species]} +${count}개`)throw Error('Missing count '+species+': '+message);
          rows.push({species,count});
        });
      }finally{Math.random=originalRandom;showSkillXpFeedback=originalFeedback;}
      return rows;
    });assert.equal(allTrees.length,50);assert.deepEqual([...new Set(allTrees.map(r=>r.count))].sort(),[0,1,2,3]);
    const returns=await page.evaluate(()=>{
      lifeUi.treeLoot=[];GAME_STATE.inventory=GAME_STATE.inventory.filter(i=>i.type!=='consumable');addLifeItem('consumable',VILLAGE_RETURN_ITEM.id,4);
      const rows=[];for(const id of ['oldForest','sunnyFields','lilacVillage']){
        enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn},{skipSave:true});
        if(!useVillageReturnItem())throw Error('Return failed');rows.push({from:id,to:GAME_STATE.regionId,x:player.x,y:player.y,safe:!isBlocked(player.x,player.y)});
      }
      const original=saveGame;saveGame=()=>false;const before=JSON.stringify({region:GAME_STATE.regionId,x:player.x,y:player.y,inventory:GAME_STATE.inventory});
      try{if(useVillageReturnItem())throw Error('Failed save accepted');}finally{saveGame=original;}
      if(before!==JSON.stringify({region:GAME_STATE.regionId,x:player.x,y:player.y,inventory:GAME_STATE.inventory}))throw Error('Return rollback failed');
      return rows;
    });assert(returns.every(r=>r.to==='lilacVillage'&&r.x===25&&r.y===24&&r.safe));
    await page.evaluate(()=>{
      const axe=FORESTRY_AXES[1],rod=FISHING_RODS[1];GAME_STATE.appearance.activeTool='rod';
      GAME_STATE.progression.forestry.axeId=axe.id;GAME_STATE.progression.forestry.durabilityByAxeId[axe.id]=Math.floor(axe.maxDurability*.6);
      Object.assign(GAME_STATE.progression.fishing,lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',100)));
      GAME_STATE.progression.fishing.equippedRodId=rod.id;GAME_STATE.progression.fishing.purchasedRodIds=FISHING_RODS.map(r=>r.id);GAME_STATE.progression.flags.masterRod=true;
      GAME_STATE.progression.fishing.durabilityByRodId[rod.id]=Math.floor(rod.maxDurability*.15);refreshToolHotbar();
    });
    assert.equal(await page.locator('#toolHotbar .equipmentDurability').count(),2);
    assert(await page.locator('[data-quick-tool="rod"] .equipmentDurability').evaluate(b=>b.classList.contains('low')&&Number(b.getAttribute('aria-valuenow'))>0));
    const liveUpdate=await page.evaluate(()=>{
      const button=document.querySelector('[data-quick-tool="axe"]'),bar=button.querySelector('.equipmentDurability');
      GAME_STATE.progression.forestry.durabilityByAxeId[getEquippedForestryAxe().id]--;refreshToolHotbar();
      return button===document.querySelector('[data-quick-tool="axe"]')&&bar===button.querySelector('.equipmentDurability')&&Number(bar.getAttribute('aria-valuenow'))===getForestryAxeDurability().current;
    });assert(liveUpdate);
    await page.screenshot({path:path.join(out,`durability-hotbar-${width}.png`)});
    await page.evaluate(()=>{openInventory();inventoryState.tab='equipment';renderInventory();});
    const equipment=await page.evaluate(()=>[...document.querySelectorAll('#inventoryScroll .equipmentDurability')].map(b=>({id:b.closest('[data-equip-id]').dataset.equipId,current:Number(b.getAttribute('aria-valuenow')),max:Number(b.getAttribute('aria-valuemax')),height:b.getBoundingClientRect().height})));
    assert(equipment.length>=2&&equipment.every(r=>r.max>0&&r.height>=6&&!['axe.basic','rod.basic'].includes(r.id)));
    assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
    await page.screenshot({path:path.join(out,`durability-equipment-${width}.png`)});
    await page.evaluate(()=>openInventoryDetail('rod',getEquippedFishingRod().id));
    assert.equal(await page.locator('#inventoryDetailContent .equipmentDurability').count(),1);
    await page.evaluate(()=>{closeInventoryDetail({fromHistory:true});closeInventory({fromHistory:true});
      GAME_STATE.progression.fishing.durabilityByRodId[getEquippedFishingRod().id]=0;refreshToolHotbar();});
    assert(await page.locator('[data-quick-tool="rod"]').isDisabled());assert.equal(await page.locator('[data-quick-tool="rod"] .equipmentDurability').getAttribute('aria-valuenow'),'0');
    assert(await page.evaluate(()=>{GAME_STATE.progression.coins=100000;const rod=getEquippedFishingRod();return repairFishingRod(rod.id);}));
    await page.evaluate(()=>refreshToolHotbar());assert(await page.locator('[data-quick-tool="rod"]').isEnabled());
    assert(await page.locator('[data-quick-tool="rod"] .equipmentDurability').evaluate(b=>b.getAttribute('aria-valuenow')===b.getAttribute('aria-valuemax')));
    const lightning=await page.evaluate(()=>{
      const before=JSON.stringify(GAME_STATE),original=Math.random;Math.random=()=>{throw Error('Visuals used gameplay randomness');};
      const rows=[];try{for(let index=0;index<24;index++){
        const start=index*4800+350+hash2(index+13,71)*2800,duration=300+hash2(index+29,97)*200;
        const first=getStormLightningStrike(start+duration*.45),second=getStormLightningStrike(start+duration*.55);
        if(JSON.stringify(first.points)!==JSON.stringify(second.points)||first.points!==second.points)throw Error('Lightning moved within a strike');
        if(getStormLightningStrike(index*4800)!==null)throw Error('Unexpected extra flash');
        rows.push({index,points:first.points,branches:first.branches});
      }}finally{Math.random=original;}
      if(before!==JSON.stringify(GAME_STATE))throw Error('Weather changed save state');return rows;
    });assert.equal(new Set(lightning.map(r=>JSON.stringify(r.points))).size,24);assert(new Set(lightning.map(r=>r.branches.length)).size>=2);
    await page.emulateMedia({reducedMotion:'reduce'});assert(await page.evaluate(()=>Array.from({length:400},(_,i)=>getStormLightningStrike(i*60)).every(x=>x===null)));await page.emulateMedia({reducedMotion:'no-preference'});
    if(width===393){
      const frames=await page.evaluate(()=>{
        const oldTime=tNow,oldKind=weatherState.kind,images=[];weatherState.kind='storm';
        try{for(let index=0;index<6;index++){
          tNow=index*4800+350+hash2(index+13,71)*2800+(300+hash2(index+29,97)*200)*.5;
          ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#284c57';ctx.fillRect(0,0,canvas.width,canvas.height);drawWeatherEffects();ctx.restore();images.push(canvas.toDataURL());
        }}finally{tNow=oldTime;weatherState.kind=oldKind;}return images;
      });
      const html=`<!doctype html><meta charset="utf-8"><style>body{background:#1d3839;color:#fff;font:16px system-ui;margin:15px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}img{width:100%;image-rendering:pixelated}</style><p>폭풍 번개 — 실제 렌더러의 서로 다른 6회</p><div class="grid">${frames.map(src=>`<img src="${src}">`).join('')}</div>`;
      fs.writeFileSync(path.join(out,'lightning.html'),html);const review=await context.newPage();await review.setViewportSize({width:900,height:1000});await review.setContent(html);await review.screenshot({path:path.join(out,'lightning.png'),fullPage:true});await review.close();
    }
    reports.push({width,firstDiscoveryReceipt:true,levelUpReceipt:true,levelUpDismissal,allTrees,returns,returnRollback:true,equipment,liveUpdate,brokenAndRepair:true,lightning});
    await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2)+'\n');
  console.log('Gameplay feedback passed: 393/320px; 50 species / 0–3 drops; discovery-delayed receipts; central return and rollback; live durability, equipment/detail, break/repair; 24 stable unique strikes and reduced motion.');
}finally{await browser.close();}
