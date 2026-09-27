// Real NPC interaction and mobile UI, isolated saves; no user data touched.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve('output/character-qa/character-style');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
const errors=[],results=[];
try{
  for(const [width,height] of [[393,780],[320,568],[1100,900]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish&&typeof isCharacterStyleOpen==='function');
    await page.evaluate(()=>{
      const save=createSaveData();save.state.progression.coins=4321;
      Object.assign(save.state.appearance,{outfitId:'outfit.ember',backpackId:'pack.berry',activeTool:'rod'});
      save.state.inventory.push({type:'material',id:'oak_log',name:'참나무',quantity:17});
      if(!applySaveData(save)||!saveGame())throw Error('Fixture save failed');
      return JSON.stringify(GAME_STATE);
    });
    async function approach(){
      await page.evaluate(()=>{
        const npc=npcs.find(n=>n.role==='stylist');if(!npc||npc.id!=='hana'||npc.roam!==0)throw Error('NPC service missing/fails to stay put');
        const seen=new Set([key(player.x,player.y)]),queue=[[player.x,player.y]];
        for(let i=0;i<queue.length;i++)for(const [dx,dy] of Object.values(dirVec)){
          const [x,y]=queue[i],xx=x+dx,yy=y+dy,k=key(xx,yy);
          if(!inside(xx,yy)||seen.has(k)||blocked.has(k)||npcAt(xx,yy))continue;
          seen.add(k);queue.push([xx,yy]);
        }
        const entry=Object.entries(dirVec).find(([face,[dx,dy]])=>seen.has(key(npc.x-dx,npc.y-dy)));
        if(!entry)throw Error('Stylist is not reachable');
        const [face,[dx,dy]]=entry;
        Object.assign(player,{x:npc.x-dx,y:npc.y-dy,px:(npc.x-dx)*TILE+TILE/2,py:(npc.y-dy)*TILE+TILE/2,face,moving:false});
        clearMovement();if(resolveWorldInteraction()?.kind!=='characterStyle')throw Error('Wrong NPC interaction');
        camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();
      });
      await page.locator('#btnA').tap();await page.locator('#characterStylePanel.show').waitFor();
    }
    const core=()=>page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections,world:GAME_STATE.world,
      outfit:GAME_STATE.appearance.outfitId,pack:GAME_STATE.appearance.backpackId,tool:GAME_STATE.appearance.activeTool,ownedOutfits:GAME_STATE.appearance.ownedOutfitIds,ownedPacks:GAME_STATE.appearance.ownedBackpackIds}));
    const preserved=await core();
    await approach();
    assert(await page.locator('.characterStyleChoices canvas').evaluateAll(canvases=>canvases.every(canvas=>{
      const r=canvas.getBoundingClientRect(),b=canvas.parentElement.getBoundingClientRect();
      return getComputedStyle(canvas).position==='static'&&r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom&&
        canvas.getContext('2d').getImageData(0,0,120,110).data.some((v,i)=>i%4===3&&v>0);
    })),'Character previews must be painted inside their cards, not on the game HUD');
    assert.equal(await page.locator('#characterStyleApply').isDisabled(),true);
    await page.locator('[data-character-style="female"]').tap();
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.bodyId),'body.starter','Selection must not apply before confirm');
    await page.screenshot({path:path.join(output,`${width}-choose-female.png`)});
    const visible=await page.locator('#characterStyleApply').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;});
    assert(visible,'Apply button clipped');
    await page.locator('#characterStyleCancel').tap();
    await page.waitForFunction(()=>!isCharacterStyleOpen()&&window.history.state?.pixelLifeOverlay!=='character-style');
    assert.equal(await core(),preserved);
    await approach();await page.locator('[data-character-style="female"]').tap();
    await page.locator('#characterStyleApply').tap();
    await page.waitForFunction(()=>!isCharacterStyleOpen()&&window.history.state?.pixelLifeOverlay!=='character-style');
    assert.deepEqual(await page.evaluate(()=>({body:GAME_STATE.appearance.bodyId,hair:GAME_STATE.appearance.hairId})),{body:'body.female',hair:'hair.female.brown'});
    assert.equal(await core(),preserved);
    await page.screenshot({path:path.join(output,`${width}-female-world.png`)});
    await page.reload();await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish);
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.bodyId),'body.female');assert.equal(await core(),preserved);
    await approach();await page.locator('[data-character-style="male"]').tap();
    await page.evaluate(()=>{window.__storageSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('QA storage unavailable');};});
    await page.locator('#characterStyleApply').tap();
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.bodyId),'body.female');
    assert.equal(await page.locator('#characterStylePanel.show').count(),1);
    assert.match(await page.locator('#characterStyleMessage').textContent(),/저장하지 못/);
    assert.equal(await core(),preserved);
    await page.evaluate(()=>{Storage.prototype.setItem=window.__storageSet;});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!isCharacterStyleOpen()&&window.history.state?.pixelLifeOverlay!=='character-style');
    await approach();await page.goBack();await page.waitForFunction(()=>!isCharacterStyleOpen());
    await page.goForward();await page.waitForFunction(()=>isCharacterStyleOpen());
    await page.locator('#characterStyleClose').tap();await page.waitForFunction(()=>!isCharacterStyleOpen()&&window.history.state?.pixelLifeOverlay!=='character-style');
    await approach();await page.locator('[data-character-style="male"]').focus();await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>characterStyleState.selected),'male');
    await page.locator('#characterStyleApply').focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>!isCharacterStyleOpen()&&window.history.state?.pixelLifeOverlay!=='character-style');
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.bodyId),'body.starter');assert.equal(await core(),preserved);
    await page.reload();await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish);
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.bodyId),'body.starter');
    await page.evaluate(()=>{if(applyCharacterStyle())throw Error('NPC service applies outside modal');});
    results.push({viewport:`${width}x${height}`,npcReachable:true,touchAndKeyboard:true,cancelBackForward:true,savedBothWays:true,saveFailureRollback:true,progressEquipmentAndWardrobePreserved:true});
    await context.close();
  }
  // A trial-only gender override must not conceal the newly saved identity.
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?walk-preview&character-preview&character=female');await page.waitForFunction(()=>characterOutfitPreviewImgs['outfit.meadow']?.fish);
  await page.evaluate(()=>{
    const npc=npcs.find(n=>n.role==='stylist');Object.assign(player,{x:npc.x,y:npc.y+1,face:'up',moving:false});
    if(!openCharacterStyle())throw Error('Trial open failed');
    if(document.querySelectorAll('[data-character-preview-panel]:not([hidden])').length)throw Error('Trial panels cover dialog');
    characterStyleState.selected='female';if(!applyCharacterStyle())throw Error('Trial save failed');
    if(characterBodyPreview!==null||getCharacterRenderAppearance().bodyId!=='body.female')throw Error('Trial masks NPC choice');
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({results,trialOverrideCleared:true,browserErrors:errors},null,2));
  console.log('PASS: NPC gender change, 393/320/PC touch+keyboard, confirmation/cancel/history, both saved identities, save rollback, wardrobe/progress and fixed rig preserved.');
}finally{await browser.close();}
