// Mobile browser regression for the two-level fishing collection skeleton.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/fish-dex-qa');
fs.mkdirSync(output,{recursive:true});

const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(base);
  try{
    await page.waitForFunction(()=>typeof openFishDex==='function'&&FISHING_HABITATS.length===10,null,{timeout:60000});
  }catch(error){
    throw new Error(`${error.message}\nStartup errors:\n${errors.join('\n')||'(none)'}`);
  }

  await page.locator('#menuBtn').tap();
  await page.locator('#openFishDexBtn').tap();
  const before=await page.evaluate(()=>JSON.stringify({
    inventory:GAME_STATE.inventory,collections:GAME_STATE.collections.fish,
    fishing:GAME_STATE.progression.fishing,flags:GAME_STATE.progression.flags,coins:GAME_STATE.progression.coins
  }));
  await page.evaluate(()=>{
    const categories=[...document.querySelectorAll('[data-fish-category]')];
    const boxes=categories.map(button=>button.getBoundingClientRect());
    const rows=new Set(boxes.map(box=>Math.round(box.top)));
    const panel=document.getElementById('fishDexPanel').getBoundingClientRect();
    if(categories.map(button=>button.textContent.trim()).join('|')!=='전체|내륙|해안|원양'||
      rows.size!==1||Math.max(...boxes.map(box=>box.width))-Math.min(...boxes.map(box=>box.width))>1||
      boxes.some(box=>box.left<panel.left||box.right>panel.right))throw new Error('Top category tabs are not a stable four-column row');
    if(!document.getElementById('fishDexHabitatTabs').hidden)throw new Error('All view should not show habitat tabs');
    const sections=[...document.querySelectorAll('[data-fish-section]')];
    if(sections.map(section=>section.dataset.fishSection).join(',')!=='pond,river,mountain_lake,coast,waterfall,swamp,boat_shallow,boat_mid,boat_deep')
      throw new Error('All view is not grouped into the nine live habitats');
    if(document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==8||
      !document.querySelector('[data-fish-section="pond"]')?.classList.contains('open')||
      document.getElementById('fishDexProgress').textContent.trim()!=='0 / 67')
      throw new Error('All view must lazily render only the open pond section');
    renderFishDexReward(20);
    const legacyReward=document.getElementById('fishDexReward');
    if(!legacyReward.textContent.includes('기존 20종 도감 보상 완료')||
      !legacyReward.textContent.includes('20 / 67'))
      throw new Error('Legacy 20-fish rewards must not claim the current 67-fish collection is complete');
    renderFishDexReward(0);
  });
  await page.screenshot({path:path.join(output,'393-all-habitats.png')});

  await page.locator('[data-fish-section-toggle="river"]').tap();
  await page.evaluate(()=>{
    if(document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==8||
      document.querySelector('[data-fish-section-toggle="river"]')?.getAttribute('aria-expanded')!=='true'||
      document.querySelector('[data-fish-section-toggle="pond"]')?.getAttribute('aria-expanded')!=='false')
      throw new Error('Habitat accordion did not switch lazy cards from pond to river');
  });
  await page.locator('#fishDexGrid [data-fish-id]').first().tap();
  await page.evaluate(()=>{
    if(!isFishDexDetailOpen()||!document.getElementById('fishDexDetail').textContent.includes('강'))
      throw new Error('Fish detail did not open from a grouped habitat');
  });
  await page.goBack();
  await page.waitForFunction(()=>isFishDexOpen()&&!isFishDexDetailOpen());

  await page.locator('[data-fish-category="inland"]').tap();
  await page.evaluate(()=>{
    const tabs=[...document.querySelectorAll('[data-fish-habitat]')];
    const boxes=tabs.map(button=>button.getBoundingClientRect());
    const rows=new Set(boxes.map(box=>Math.round(box.top)));
    const panel=document.getElementById('fishDexPanel').getBoundingClientRect();
    if(tabs.map(button=>button.textContent.trim()).join('|')!=='내륙 전체|연못|강|산악 호수|폭포|늪지'||
      rows.size!==2||boxes.some(box=>box.left<panel.left||box.right>panel.right)||
      document.querySelectorAll('[data-fish-section]').length!==5||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==8)
      throw new Error('Inland two-level filter or three-column habitat layout failed');
    for(const id of ['pond','river','mountain_lake','waterfall','swamp']){
      const section=document.querySelector(`[data-fish-section="${id}"]`);
      if(!section||section.textContent.includes('준비 중'))
        throw new Error(`Every inland habitat must now be live: ${id}`);
    }
  });
  await page.screenshot({path:path.join(output,'393-inland-grid.png')});

  await page.locator('[data-fish-habitat="river"]').tap();
  await page.evaluate(()=>{
    if(document.querySelectorAll('[data-fish-section]').length!==1||
      document.querySelector('[data-fish-section]')?.dataset.fishSection!=='river'||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==8)
      throw new Error('River habitat filter does not show the eight live river fish');
  });
  await page.locator('[data-fish-habitat="all"]').tap();
  await page.locator('[data-fish-habitat="mountain_lake"]').tap();
  await page.evaluate(()=>{
    if(document.querySelectorAll('[data-fish-section]').length!==1||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==7||
      document.querySelector('[data-fish-section="mountain_lake"]')?.textContent.includes('준비 중'))
      throw new Error('Mountain lake must show its seven live fish instead of a placeholder');
  });
  await page.screenshot({path:path.join(output,'393-mountain-lake.png')});
  await page.locator('[data-fish-habitat="waterfall"]').tap();
  await page.evaluate(()=>{
    if(document.querySelectorAll('[data-fish-section]').length!==1||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==7||
      document.querySelector('[data-fish-section="waterfall"]')?.textContent.includes('준비 중'))
      throw new Error('Waterfall must show its seven live fish instead of a placeholder');
  });
  await page.screenshot({path:path.join(output,'393-waterfall.png')});
  await page.locator('[data-fish-habitat="swamp"]').tap();
  await page.evaluate(()=>{
    if(document.querySelectorAll('[data-fish-section]').length!==1||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==7||
      document.querySelector('[data-fish-section="swamp"]')?.textContent.includes('준비 중'))
      throw new Error('Swamp must show its seven live fish instead of a placeholder');
  });
  await page.screenshot({path:path.join(output,'393-swamp.png')});

  await page.locator('[data-fish-category="coastal"]').tap();
  await page.evaluate(()=>{
    if([...document.querySelectorAll('[data-fish-habitat]')].map(button=>button.textContent.trim()).join('|')!=='해안 전체|바다'||
      document.querySelectorAll('[data-fish-section]').length!==1||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==8)
      throw new Error('Coastal category does not preserve the live coast collection');
  });

  await page.locator('[data-fish-category="offshore"]').tap();
  await page.evaluate(()=>{
    const tabs=[...document.querySelectorAll('[data-fish-habitat]')];
    const rows=new Set(tabs.map(button=>Math.round(button.getBoundingClientRect().top)));
    if(tabs.map(button=>button.textContent.trim()).join('|')!=='원양 전체|얕은수심|중간수심|심해지역|빙하'||
      rows.size!==2||document.querySelectorAll('[data-fish-section]').length!==4||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==7||
      !['glacier'].every(id=>document.querySelector(`[data-fish-section="${id}"]`)?.textContent.includes('준비 중')))
      throw new Error('Offshore should show the shallow/mid/deep habitats and the future glacier habitat');
  });
  await page.locator('[data-fish-habitat="boat_mid"]').tap();
  await page.evaluate(()=>{
    if(document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==7||document.querySelector('[data-fish-section="boat_mid"]')?.textContent.includes('준비 중'))
      throw new Error('Mid route must show seven live fish');
  });
  await page.locator('[data-fish-habitat="boat_deep"]').tap();
  await page.evaluate(()=>{
    const section=document.querySelector('[data-fish-section="boat_deep"]');
    if(document.querySelectorAll('[data-fish-section]').length!==1||section?.textContent.includes('준비 중')||
      document.querySelectorAll('#fishDexGrid [data-fish-id]').length!==8)
      throw new Error('Deep sea must show eight live fish including the migrated coelacanth');
  });
  await page.screenshot({path:path.join(output,'393-offshore-deep.png')});

  await page.locator('[data-fish-category="all"]').tap();
  await page.setViewportSize({width:320,height:568});
  await page.evaluate(()=>{
    const panel=document.getElementById('fishDexPanel').getBoundingClientRect();
    const categories=[...document.querySelectorAll('[data-fish-category]')];
    if(new Set(categories.map(button=>Math.round(button.getBoundingClientRect().top))).size!==1)
      throw new Error('Top categories wrapped at 320px');
    for(const element of document.querySelectorAll('#fishDexCategoryTabs button,#fishDexGrid [data-fish-section],#fishDexGrid [data-fish-id]')){
      const box=element.getBoundingClientRect();
      if(box.left<panel.left-1||box.right>panel.right+1)throw new Error('Fish dex content overflows at 320px');
    }
    if(document.querySelectorAll('#fishDexGrid [data-fish-id]').length>9)
      throw new Error('All view rendered more than one habitat at once');
  });
  await page.screenshot({path:path.join(output,'320-all-habitats.png')});

  await page.locator('#fishDexClose').tap();
  await page.waitForFunction(()=>!isFishDexOpen());
  const after=await page.evaluate(()=>JSON.stringify({
    inventory:GAME_STATE.inventory,collections:GAME_STATE.collections.fish,
    fishing:GAME_STATE.progression.fishing,flags:GAME_STATE.progression.flags,coins:GAME_STATE.progression.coins
  }));
  if(after!==before)throw new Error('Browsing the fish dex changed saved gameplay state');
  if(errors.length)throw new Error(errors.join('\n'));

  const report={categories:['전체','내륙','해안','원양'],habitatGridMaxColumns:3,
    allSections:['pond','river','mountain_lake','coast','waterfall','swamp','boat_shallow','boat_mid','boat_deep'],lazyCards:true,liveFish:67,futureHabitats:true,
    detailHistory:true,legacyRewardProgress:'20 / 67',viewports:['393x780','320x568'],stateUnchanged:true,browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Fish dex browser QA passed: '+JSON.stringify(report));
}finally{
  await browser.close();
}
