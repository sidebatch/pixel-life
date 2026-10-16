import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const url=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/dist/index.html';
const out=path.resolve(process.argv[2]||'output/growth-status-qa/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
  for(const [width,height]of [[393,780],[320,568],[1280,800]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    const ready=()=>page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await ready();
    await page.evaluate(()=>applySaveData(createSaveData()));
    const original=await page.evaluate(()=>{window.__originalGrowthSave=saveGame;window.__growthSaveCalls=0;saveGame=()=>{__growthSaveCalls++;return false;};return JSON.stringify({progression:GAME_STATE.progression,inventory:GAME_STATE.inventory,appearance:GAME_STATE.appearance,collections:GAME_STATE.collections});});
    const open=async()=>{await page.locator('#settingsBtn').click();await page.locator('#openGrowthStatusBtn').click();await page.waitForFunction(()=>isGrowthStatusOpen());};
    const closed=()=>page.waitForFunction(()=>!isGrowthStatusOpen()&&!window.history.state?.pixelLifeOverlay);
    await page.waitForFunction(()=>document.getElementById('growthStatusHud').getAttribute('aria-label').includes('농사 1레벨'));
    assert.deepEqual(await page.locator('#growthStatusHud b').allTextContents(),['Lv.1','Lv.1','Lv.1']);
    await page.locator('#growthStatusHud img').evaluateAll(nodes=>Promise.all(nodes.map(node=>node.decode())));
    const hudShape=await page.locator('#growthStatusHud').boundingBox();
    const locationShape=await page.locator('.locationPill').boundingBox(),shellShape=await page.locator('#gameShell').boundingBox();
    assert(hudShape.width<210&&hudShape.height<=30&&hudShape.x===shellShape.x+14&&hudShape.y>=locationShape.y+locationShape.height+4);
    assert(hudShape.x+hudShape.width<=shellShape.x+shellShape.width);
    assert(await page.evaluate(()=>{
      const voyage=document.getElementById('voyageHud'),toast=document.getElementById('skillXPToast'),life=document.getElementById('lifeToast'),hud=document.getElementById('growthStatusHud').getBoundingClientRect();
      voyage.hidden=false;toast.innerHTML=skillCardMarkup('fishing');toast.classList.add('show');
      const v=voyage.getBoundingClientRect(),t=toast.getBoundingClientRect(),notice=life.getBoundingClientRect();
      const separate=v.top>=hud.bottom+4&&t.top>=v.bottom+4&&notice.top>=v.bottom+4;
      voyage.hidden=true;toast.classList.remove('show');toast.innerHTML='';return separate;
    }));
    await page.screenshot({path:path.join(out,`hud-${width}.png`)});
    // The small HUD updates even with its detail panel closed.
    await page.evaluate(()=>grantLifeSkillXp('fishing',72));
    await page.waitForFunction(()=>document.querySelector('[data-growth-hud-skill="fishing"] b').textContent==='Lv.2');
    await page.evaluate(()=>Object.assign(GAME_STATE.progression.fishing,lifeSkillProgressFromTotal('fishing',0)));
    await page.waitForFunction(()=>document.querySelector('[data-growth-hud-skill="fishing"] b').textContent==='Lv.1');
    await page.locator('#growthStatusHud').click();await page.waitForFunction(()=>isGrowthStatusOpen());
    await page.locator('#growthStatusClose').click();await closed();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'growthStatusHud');
    await page.keyboard.press('Space');await page.waitForFunction(()=>isGrowthStatusOpen());
    await page.keyboard.press('Escape');await closed();
    await page.locator('#settingsBtn').click();
    const menu=await page.locator('.menuGrid .menuCard').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};}));
    assert.equal(menu.length,4);assert.equal(menu[0].y,menu[1].y);assert.equal(menu[2].y,menu[3].y);assert(menu[2].y>menu[0].y);
    await page.screenshot({path:path.join(out,`menu-${width}.png`)});
    await page.locator('#openGrowthStatusBtn').click();await page.waitForFunction(()=>isGrowthStatusOpen());
    assert.equal(await page.locator('#menuPanel.show').count(),0);
    assert.deepEqual(await page.locator('[data-growth-skill]').evaluateAll(nodes=>nodes.map(node=>node.dataset.growthSkill)),['fishing','logging','farming']);
    assert.equal(await page.locator('#growthStatusOverlay [data-skill-card]').count(),0);
    assert.deepEqual(await page.locator('#growthStatusContent .skillCardLevel').allTextContents(),['Lv.1','Lv.1','Lv.1']);
    assert.deepEqual(await page.locator('#growthStatusContent .skillCardXp').allTextContents(),['0 / 72 XP','0 / 72 XP','0 / 72 XP']);
    assert.equal(await page.locator('#growthStatusContent img').count(),3);await page.locator('#growthStatusContent img').evaluateAll(nodes=>Promise.all(nodes.map(node=>node.decode())));
    const shape=await page.locator('.growthStatusSheet').boundingBox();assert(shape.width<=421&&shape.x>=0&&shape.y>=0&&shape.x+shape.width<=width+1&&shape.y+shape.height<=height+1,JSON.stringify({width,height,shape}));
    assert(await page.evaluate(()=>{const scroll=document.getElementById('growthStatusContent');scroll.scrollTop=scroll.scrollHeight;return scroll.lastElementChild.getBoundingClientRect().bottom<=scroll.getBoundingClientRect().bottom+1;}));
    await page.screenshot({path:path.join(out,`fresh-${width}.png`)});
    assert.equal(await page.evaluate(()=>__growthSaveCalls),0);
    assert.equal(await page.evaluate(()=>JSON.stringify({progression:GAME_STATE.progression,inventory:GAME_STATE.inventory,appearance:GAME_STATE.appearance,collections:GAME_STATE.collections})),original);
    await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'growthStatusClose');
    await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'growthStatusClose');
    await page.keyboard.press('ArrowDown');await page.keyboard.press('Digit2');assert(await page.evaluate(()=>Object.values(inputs).every(value=>!value)&&GAME_STATE.appearance.activeTool==='axe'));
    // Actual model changes must refresh the open panel, independent of XP animation.
    await page.evaluate(()=>{grantLifeSkillXp('fishing',72);Object.assign(GAME_STATE.progression.logging,lifeSkillProgressFromTotal('logging',18));Object.assign(GAME_STATE.progression.farming,lifeSkillProgressFromTotal('farming',lifeSkillTotalXpForLevel('farming',100)+4250));});
    await page.waitForFunction(()=>document.querySelector('[data-growth-skill="fishing"] .skillCardLevel').textContent==='Lv.2');
    assert.deepEqual(await page.locator('#growthStatusHud b').allTextContents(),['Lv.2','Lv.1','Lv.100']);
    assert.equal(await page.locator('[data-growth-skill="fishing"] .skillCardXp').innerText(),'0 / 84 XP');
    assert.equal(await page.locator('[data-growth-skill="logging"] .skillCardXp').innerText(),'18 / 72 XP');assert.equal(await page.locator('[data-growth-skill="logging"] .skillCardPercent').innerText(),'25%');
    assert.equal(await page.locator('[data-growth-skill="farming"] .skillCardLevel').innerText(),'Lv.100 · 숙련도 1');
    assert.equal(await page.locator('[data-growth-skill="farming"] .skillCardXp').innerText(),'250 / 4,250 XP');
    assert((await page.locator('.growthStatusSkill').nth(2).innerText()).includes('다음 숙련도까지 4,000 XP'));
    await page.evaluate(()=>setSkillCardProgress('fishing',{level:1,xp:0,mastery:0,masteryXp:0},true));
    assert.equal(await page.locator('[data-growth-skill="fishing"] .skillCardLevel').innerText(),'Lv.2');
    await page.screenshot({path:path.join(out,`progress-${width}.png`)});
    const progress=await page.evaluate(()=>JSON.stringify(GAME_STATE.progression));
    await page.keyboard.press('Escape');await closed();assert.equal(await page.locator('#growthStatusOverlay').getAttribute('aria-hidden'),'true');assert(await page.locator('#growthStatusOverlay').evaluate(node=>node.inert));
    assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsBtn');assert.equal(await page.evaluate(()=>__growthSaveCalls),0);
    await open();await page.goBack();await page.waitForFunction(()=>!isGrowthStatusOpen());await page.goForward();await page.waitForFunction(()=>isGrowthStatusOpen());
    assert.equal(await page.locator('[data-growth-skill="farming"] .skillCardLevel').innerText(),'Lv.100 · 숙련도 1');
    await page.locator('#growthStatusClose').click();await closed();
    await open();await page.locator('.growthStatusBackdrop').click({position:{x:3,y:3}});await closed();
    assert.deepEqual(JSON.parse(await page.evaluate(()=>JSON.stringify(GAME_STATE.progression))),JSON.parse(progress));
    assert(await page.evaluate(()=>{const original=isFishingActive;isFishingActive=()=>true;openGrowthStatus();const rejected=!isGrowthStatusOpen();isFishingActive=original;return rejected;}));
    // Retain real saves, then restart with stale history while the panel was open.
    await page.evaluate(()=>{saveGame=__originalGrowthSave;if(!saveGame())throw Error('Fixture save failed');});
    await open();await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready();
    assert.equal(await page.evaluate(()=>isGrowthStatusOpen()),false);assert.equal(await page.evaluate(()=>window.history.state?.pixelLifeOverlay||null),null);
    assert.equal(await page.evaluate(()=>JSON.stringify(GAME_STATE.progression)),progress);
    await open();assert.equal(await page.locator('[data-growth-skill="logging"] .skillCardPercent').innerText(),'25%');
    await page.locator('#growthStatusClose').click();await closed();
    for(const [opener,panel,close]of [['openInventoryBtn','inventoryPanel','inventoryClose'],['openFishDexBtn','fishDexPanel','fishDexClose'],['openTreeDexBtn','treeDexPanel','treeDexClose']]){
      await page.locator('#settingsBtn').click();await page.locator('#'+opener).click();assert(await page.locator('#'+panel).isVisible());
      assert.equal(await page.evaluate(()=>isGrowthStatusOpen()),false);await page.locator('#'+close).click();await page.waitForFunction(()=>!window.history.state?.pixelLifeOverlay);
    }
    await open();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    reports.push({width,height,shape,hudShape,compactHud:true,hudLiveWhileClosed:true,hudOpensDetail:true,voyageAndFeedbackSpacing:true,threeActiveSkills:true,freshDefaults:true,liveUpdates:true,level100Mastery:true,ignoresXpAnimation:true,noSaveCallsFromPanel:true,unchangedProgression:true,keyboardAndBackdrop:true,historyAndReload:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({url,reports,errors},null,2)+'\n');console.log('Growth status passed: 320/393/1280px menu, real levels/XP/mastery, live updates, read-only persistence, modal input and history/reload.');
}finally{await browser.close();}
