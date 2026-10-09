// Four-tab, uninterrupted collection grid and optional read-only reward review.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',output=path.resolve(process.argv[2]||'output/fish-dex-qa');
fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>typeof openFishDexRewards==='function'&&!document.getElementById('startupLoading'));
  await page.locator('#menuBtn').tap();await page.locator('#openFishDexBtn').tap();
  assert.equal(await page.locator('#fishDexGrid [data-fish-id]').count(),74);
  assert.equal(await page.locator('#fishDexProgress').textContent(),'0 / 74');
  await page.screenshot({path:path.join(output,width+'-undiscovered.png')});
  const hiddenChecks=await page.evaluate(()=>{
    const originalFish=GAME_STATE.collections.fish,originalFlags={...GAME_STATE.progression.flags};let checks=0;
    const checkUnknown=fish=>{renderFishDexDetail(fish);const d=document.getElementById('fishDexDetail');
      if(d.querySelector('.fishDexHint,.fishDexConditions,img')||!d.textContent.includes('???')||d.textContent.includes(fish.name))throw Error('Unknown fish exposes information: '+fish.id);checks++;};
    try{
      GAME_STATE.collections.fish={};
      for(const rareFishHints of [false,true])for(const finalFishClue of [false,true]){
        Object.assign(GAME_STATE.progression.flags,{rareFishHints,finalFishClue});for(const fish of FISH_DATA)checkUnknown(fish);
      }
      for(const habitat of FISHING_HABITATS){
        const pool=FISH_DATA.filter(f=>f.habitat===habitat.id),missing=pool.at(-1);
        GAME_STATE.collections.fish=Object.fromEntries(pool.slice(0,-1).map(f=>[f.id,{count:1}]));
        Object.assign(GAME_STATE.progression.flags,{rareFishHints:true,finalFishClue:true});checkUnknown(missing);
      }
    }finally{GAME_STATE.collections.fish=originalFish;GAME_STATE.progression.flags=originalFlags;}
    return checks;
  });assert.equal(hiddenChecks,306);
  await page.locator('#fishDexGrid [data-fish-id]').first().tap();
  await page.screenshot({path:path.join(output,width+'-unknown-no-hints.png')});
  await page.locator('#fishDexModalClose').tap();await page.waitForFunction(()=>!isFishDexDetailOpen());
  await page.evaluate(()=>{
   for(const f of FISH_DATA.slice(0,3))GAME_STATE.collections.fish[f.id]={fishId:f.id,name:f.name,rarity:f.rarity,count:2,minSizeCm:f.minSizeCm,maxSizeCm:f.maxSizeCm,totalSizeCm:f.minSizeCm+f.maxSizeCm,averageSizeCm:(f.minSizeCm+f.maxSizeCm)/2};
   renderFishDex();
  });
  const snapshot=()=>page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,collections:GAME_STATE.collections,progression:GAME_STATE.progression}));
  const before=await snapshot(),categories=[];
  for(const [category,count] of [['all',74],['inland',37],['coastal',8],['offshore',29]]){
   await page.locator('[data-fish-category="'+category+'"]').tap();
   const info=await page.evaluate(()=>{
    const panel=document.getElementById('fishDexPanel'),p=panel.getBoundingClientRect(),tabs=[...panel.querySelectorAll('[data-fish-category]')],boxes=tabs.map(t=>t.getBoundingClientRect()),grid=document.getElementById('fishDexGrid'),cards=[...grid.querySelectorAll('[data-fish-id]')];
    const expected=fishDexState.category==='all'?FISH_DATA:FISH_DATA.filter(f=>FISHING_HABITAT_BY_ID.get(f.habitat).groupId===fishDexState.category);
    return {labels:tabs.map(t=>t.textContent),rows:new Set(boxes.map(b=>Math.round(b.top))).size,widthRange:Math.max(...boxes.map(b=>b.width))-Math.min(...boxes.map(b=>b.width)),
     selected:tabs.filter(t=>t.getAttribute('aria-selected')==='true').map(t=>t.dataset.fishCategory),count:cards.length,ids:cards.map(c=>c.dataset.fishId),expected:expected.map(f=>f.id),
     columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,overflow:[...tabs,...cards].some(e=>{const b=e.getBoundingClientRect();return b.left<p.left-1||b.right>p.right+1;}),
     clutter:panel.querySelectorAll('[data-fish-habitat],[data-fish-section],[data-fish-section-toggle],#fishDexReward').length,
     scrollTop:document.getElementById('fishDexScroll').scrollTop,progress:document.getElementById('fishDexProgress').textContent,reviewOpen:isFishDexRewardsOpen()};
   });
   assert.deepEqual(info.labels,['전체','내륙','해안','원양']);assert.equal(info.rows,1);assert.ok(info.widthRange<=1);assert.deepEqual(info.selected,[category]);
   assert.equal(info.count,count);assert.deepEqual(info.ids,info.expected);assert.equal(info.columns,3);assert.equal(info.overflow,false);assert.equal(info.clutter,0);
   assert.equal(info.scrollTop,0);assert.equal(info.progress,'3 / 74');assert.equal(info.reviewOpen,false);
   await page.screenshot({path:path.join(output,width+'-'+category+'.png')});categories.push({category,count});
  }
  // Unknown details do not expose a habitat, conditions, or legacy hint exceptions.
  await page.locator('[data-fish-id="fish.coelacanth"]').tap();
  assert.equal(await page.evaluate(()=>isFishDexDetailOpen()),true);assert.ok(!(await page.locator('#fishDexDetail').textContent()).includes('심해지역'));
  assert.equal(await page.locator('#fishDexDetail .fishDexHint,#fishDexDetail .fishDexConditions').count(),0);
  await page.goBack();await page.waitForFunction(()=>isFishDexOpen()&&!isFishDexDetailOpen());
  await page.locator('[data-fish-category="all"]').tap();await page.locator('[data-fish-id="fish.crucian_carp"]').tap();
  const detail=await page.locator('#fishDexDetail').textContent();assert.ok(detail.includes('붕어')&&detail.includes('연못')&&detail.includes('잡은 수')&&detail.includes('평균 크기'));
  await page.locator('#fishDexModalClose').tap();await page.waitForFunction(()=>!isFishDexDetailOpen());
  await page.locator('#fishDexGrid [data-fish-id]').last().tap();assert.equal(await page.evaluate(()=>isFishDexDetailOpen()),true);
  await page.locator('#fishDexModalClose').tap();await page.waitForFunction(()=>!isFishDexDetailOpen());
  assert.ok(await page.evaluate(()=>document.getElementById('fishDexScroll').scrollTop>0),'All 74 cards must be reachable by continuous scrolling');
  await page.locator('[data-fish-category="coastal"]').tap();assert.equal(await page.evaluate(()=>document.getElementById('fishDexScroll').scrollTop),0);
  await page.locator('#fishDexRewardsBtn').tap();assert.equal(await page.evaluate(()=>isFishDexRewardsOpen()),true);
  assert.equal(await page.locator('#fishDexRewardsList li').count(),20);assert.ok((await page.locator('#fishDexRewardsList').textContent()).includes('강태공'));
  const rewardText=await page.locator('#fishDexRewardsList').textContent();assert.ok(!rewardText.includes('힌트')&&!rewardText.includes('단서'));
  for(const count of [14,18]){await page.evaluate(count=>renderFishDexReward(count),count);assert.ok(!/힌트|단서/.test(await page.locator('#fishDexReward').textContent()));}
  await page.evaluate(()=>renderFishDexReward(getDiscoveredFishCount()));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'fishDexRewardsClose');
  await page.screenshot({path:path.join(output,width+'-rewards.png')});
  // Review is read-only and does not conflate the original 20 rewards with 74 completion.
  await page.evaluate(()=>renderFishDexReward(20));const legacy=await page.locator('#fishDexReward').textContent();
  assert.ok(legacy.includes('20 / 74')&&legacy.includes('다음 30종'));await page.evaluate(()=>renderFishDexReward(getDiscoveredFishCount()));
  await page.goBack();await page.waitForFunction(()=>isFishDexOpen()&&!isFishDexRewardsOpen());
  await page.goForward();await page.waitForFunction(()=>isFishDexOpen()&&isFishDexRewardsOpen());
  await page.locator('#fishDexRewardsClose').tap();await page.waitForFunction(()=>!isFishDexRewardsOpen());
  await page.locator('#fishDexRewardsBtn').tap();await page.keyboard.press('Escape');await page.waitForFunction(()=>!isFishDexRewardsOpen());
  await page.locator('#fishDexRewardsBtn').tap();await page.evaluate(()=>pressB());await page.waitForFunction(()=>!isFishDexRewardsOpen());
  await page.locator('#fishDexRewardsBtn').tap();await page.locator('#fishDexRewardsModal .fishDexModalBackdrop').tap({position:{x:2,y:2}});
  await page.waitForFunction(()=>!isFishDexRewardsOpen());assert.equal(await page.evaluate(()=>isFishDexOpen()),true);
  assert.equal(await snapshot(),before,'Browsing filters/details/rewards must not mutate gameplay');
  await page.locator('#fishDexClose').tap();await page.waitForFunction(()=>!isFishDexOpen());
  await page.evaluate(()=>{enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='coast'));GAME_STATE.progression.coins=5000;buyVoyageTickets('shallow');if(!departVoyage('shallow'))throw Error('QA departure failed');});
  await page.waitForFunction(()=>!isVoyageBoarding());await page.evaluate(()=>{openFishDex();openFishDexRewards();});
  assert.equal(await page.evaluate(()=>isFishDexRewardsOpen()),true);await page.evaluate(()=>{activeVoyage().remainingMs=0;updateVoyage();});
  await page.waitForFunction(()=>GAME_STATE.regionId==='coast');assert.equal(await page.evaluate(()=>isFishDexOpen()||isFishDexRewardsOpen()),false);
  assert.equal(await page.locator('#fishDexRewardsModal').getAttribute('aria-hidden'),'true');
  await page.evaluate(()=>saveGame());await page.reload();await page.waitForFunction(()=>typeof openFishDexRewards==='function'&&!document.getElementById('startupLoading'));
  assert.equal(await page.evaluate(()=>isFishDexRewardsOpen()),false);assert.equal(await page.evaluate(()=>getDiscoveredFishCount()),3);
  reports.push({width,categories,columns:3,continuousScrolling:true,details:true,hiddenChecks,rewardHistory:true,readOnly:true,reload:true,voyageExpiryClosesReview:true});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Fish dex clean UI passed: '+JSON.stringify({viewports:[393,320],fourTabs:true,counts:[74,37,8,29],threeColumns:true,unknownHintsHidden:true,legacyFlagsNoException:true,knownConditionsRetained:true,optionalRewards:true,detailsAndHistory:true,stateUnchanged:true,errors}));
}finally{await browser.close();}
