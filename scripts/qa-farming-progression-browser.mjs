import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/';
const out=path.resolve(process.argv[2]||'output/farming-progression-v1');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
async function closeLevelUp(page){
  // The real notification also auto-closes after five seconds; a slow screenshot
  // must not turn that valid dismissal into an attempt to click an expired toast.
  if(await page.evaluate(()=>isSkillLevelUpVisible())){
    try{await page.locator('.skillLevelUpClose').click({timeout:2000});}
    catch(error){if(await page.evaluate(()=>isSkillLevelUpVisible()))throw error;}
  }
  await page.waitForFunction(()=>!isSkillLevelUpVisible()&&!window.history.state?.pixelLifeOverlay);
}
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===320?568:780},isMobile:true,hasTouch:true,reducedMotion:width===320?'reduce':'no-preference'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const legacy=await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:14,y:22,face:'right'}});
      const data=createSaveData();delete data.state.progression.farming;
      data.state.progression.coins=10000;data.state.inventory=[{type:'crop',id:'turnip',quantity:9},{type:'seed',id:'carrot',quantity:3}];
      data.state.world.plots.farm_01={unlocked:true,cropId:'carrot',plantedAt:Date.now()-120001};
      window.removeEventListener('pagehide',saveGame);localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(data));return data.state.world.plots.farm_01;
    });
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.level),1);
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.totalXp),0);
    assert.deepEqual(await page.evaluate(()=>GAME_STATE.world.plots.farm_01),legacy);
    const setup=await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='sickle';GAME_STATE.progression.farming=lifeSkillProgressFromTotal('farming',71);
      openFarmPlot(farmPlotAt(15,22));
      return {fishing:GAME_STATE.progression.fishing,logging:GAME_STATE.progression.logging,coins:GAME_STATE.progression.coins};
    });
    assert.equal(await page.locator('#farmSkillCard .skillCardLevel').innerText(),'Lv.1');
    assert.equal(await page.locator('#farmSkillCard [role="progressbar"]').getAttribute('aria-valuenow'),'98');
    await page.screenshot({path:path.join(out,'before-level-'+width+'.png')});
    await page.locator('[data-life-action="harvest"]').click();
    await page.waitForFunction(()=>!isChoppingTree()&&GAME_STATE.progression.farming.totalXp===95);
    await page.waitForFunction(()=>isSkillLevelUpVisible());
    assert((await page.locator('#skillXPToast').innerText()).includes('+24 XP'));
    assert((await page.locator('#skillLevelUpOverlay').innerText()).includes('농사 Lv.2!'));
    assert(!(await page.locator('#skillLevelUpOverlay').innerText()).includes('실력이 늘었어요'));
    assert.equal(await page.locator('#skillLevelUpOverlay p').count(),0);
    await page.waitForFunction(()=>document.querySelector('#skillXPToast .skillCardXp')?.textContent==='23 / 84 XP');
    assert.equal(await page.locator('#skillXPToast [role="progressbar"]').getAttribute('aria-valuenow'),'27');
    await page.screenshot({path:path.join(out,'level-up-'+width+'.png')});
    await closeLevelUp(page);
    assert(await page.evaluate(()=>!menuOpen&&!isFarmPlotOpen()&&!window.history.state?.pixelLifeOverlay));
    assert.deepEqual(await page.evaluate(()=>({fishing:GAME_STATE.progression.fishing,logging:GAME_STATE.progression.logging,coins:GAME_STATE.progression.coins})),setup);
    const beforeXp=await page.evaluate(()=>{
      openFarmPlot(farmPlotAt(15,22));return GAME_STATE.progression.farming.totalXp;
    });
    assert.equal(await page.locator('#farmSkillCard .skillCardLevel').innerText(),'Lv.2');
    await page.locator('[data-life-action="plant"][data-crop-id="carrot"]').click();
    await page.waitForFunction(()=>!isFarmPlotOpen());
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.totalXp),beforeXp);
    await page.evaluate(()=>{openMarket();marketState.view='seeds';renderMarket();});
    assert.equal(await page.locator('#marketList [data-skill-card="farming"]').count(),1);
    assert.equal(await page.locator('[data-seed-id]').count(),14);
    await page.locator('[data-seed-id="chili"]').click();
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.totalXp),beforeXp);
    await page.screenshot({path:path.join(out,'seed-market-'+width+'.png')});
    await page.locator('[data-market-view="crops"]').click();
    assert.equal(await page.locator('#marketList [data-skill-card="farming"]').count(),1);
    await page.locator('[data-good-key="crop:turnip"] [data-good-action="all"]').click();
    await page.locator('#marketSellBtn').click();
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.totalXp),beforeXp);
    await page.locator('#marketClose').click();await page.waitForFunction(()=>!isMarketOpen()&&!window.history.state?.pixelLifeOverlay);
    // A long first harvest crosses more levels than the shared animation limit.
    await page.evaluate(()=>{
      cancelSkillXpFeedback();GAME_STATE.progression.farming=lifeSkillProgressFromTotal('farming',0);
      const plot=farmPlotAt(15,22);GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:'chili',plantedAt:Date.now()-2400001};
      openFarmPlot(plot);
    });
    await page.locator('[data-life-action="harvest"]').click();
    await page.waitForFunction(()=>document.querySelector('#skillLevelUpOverlay.show b')?.textContent==='농사 Lv.6!');
    await page.waitForFunction(()=>document.querySelector('#skillXPToast .skillCardLevel')?.textContent==='Lv.6');
    assert.equal(await page.locator('#skillLevelUpOverlay p').count(),0);
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.totalXp),480);
    await page.waitForFunction(()=>!isChoppingTree());
    await page.screenshot({path:path.join(out,'multi-level-'+width+'.png')});
    await closeLevelUp(page);
    // Reach Lv.100 and then mastery through real sickle actions.
    for(const [total,title] of [[187229,'농사 Lv.100!'],[187230+3999,'농사 숙련도 1!']]){
      await page.evaluate(total=>{
        cancelSkillXpFeedback();GAME_STATE.progression.farming=lifeSkillProgressFromTotal('farming',total);
        const plot=farmPlotAt(15,22);GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:'carrot',plantedAt:Date.now()-120001};
        openFarmPlot(plot);
      },total);
      await page.locator('[data-life-action="harvest"]').click();
      await page.waitForFunction(title=>document.querySelector('#skillLevelUpOverlay.show b')?.textContent===title,title);
      assert.equal(await page.locator('#skillLevelUpOverlay p').count(),0);
      await page.waitForFunction(()=>!isChoppingTree());
      assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.totalXp),total+24);
      await closeLevelUp(page);
    }
    const saved=await page.evaluate(()=>{cancelSkillXpFeedback();saveGame();return JSON.parse(JSON.stringify(GAME_STATE.progression.farming));});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    assert.deepEqual(await page.evaluate(()=>GAME_STATE.progression.farming),saved);
    await page.evaluate(()=>openFarmPlot(farmPlotAt(15,22)));
    assert.equal(await page.locator('#farmSkillCard .skillCardLevel').innerText(),'Lv.100 · 숙련도 1');
    assert.equal(await page.locator('#farmSkillCard .skillCardXp').innerText(),'23 / 4,250 XP');
    const dimensions=await page.evaluate(()=>{
      const panel=document.getElementById('lifePanel').getBoundingClientRect(),actions=document.getElementById('lifeActions');
      return {top:panel.top,bottom:panel.bottom,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,actionHeight:actions.clientHeight};
    });
    assert(dimensions.top>=0&&dimensions.bottom<=dimensions.height&&!dimensions.overflow&&dimensions.actionHeight>=44,JSON.stringify(dimensions));
    await page.screenshot({path:path.join(out,'mastery-'+width+'.png')});
    const storedXp=saved.totalXp,rollback=await page.evaluate(()=>{
      closeFarmPlot({fromHistory:true});
      const plot=farmPlotAt(15,22);GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:'chili',plantedAt:Date.now()-2400001};
      const before=JSON.stringify({farming:GAME_STATE.progression.farming,plots:GAME_STATE.world.plots,inventory:GAME_STATE.inventory});
      const original=saveGame;saveGame=()=>false;let success;try{success=harvestFarmCrop(plot);}finally{saveGame=original;}
      return !success&&before===JSON.stringify({farming:GAME_STATE.progression.farming,plots:GAME_STATE.world.plots,inventory:GAME_STATE.inventory});
    });assert(rollback);assert.equal(await page.evaluate(()=>GAME_STATE.progression.farming.totalXp),storedXp);
    const levelUpCopy=await page.evaluate(()=>{
      const defaults=['fishing','logging','farming'].map(skill=>{
        showSkillLevelUp(skill,2,null);
        const overlay=document.getElementById('skillLevelUpOverlay'),row={skill,text:overlay.textContent,paragraphs:overlay.querySelectorAll('p').length};
        dismissSkillLevelUp({fromHistory:true});return row;
      });
      showSkillLevelUp('farming',2,null,'보상 안내');
      const reward=document.querySelector('#skillLevelUpOverlay p')?.textContent;
      dismissSkillLevelUp({fromHistory:true});return {defaults,reward};
    });
    assert(levelUpCopy.defaults.every(row=>row.paragraphs===0&&!row.text.includes('실력이 늘었어요')));
    assert.equal(levelUpCopy.reward,'보상 안내');
    reports.push({width,legacyLv1:true,singleLevel:95,multiLevel:480,mastery:saved,dimensions,rollback,levelUpCopy});
    await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,errors,reports},null,2));
  console.log('Farming progression browser passed: 393/320px, legacy Lv.1, actual impact XP, seed/sale no XP, shared progress cards, single/multi-level, Lv.100/mastery, save/reload, rollback, history and fitting panels.');
}finally{await browser.close();}
