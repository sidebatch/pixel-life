import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/rod-durability-qa');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
const ready=page=>page.waitForFunction(()=>typeof repairFishingRod==='function'&&!document.getElementById('startupLoading'));
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await ready(page);
  await page.evaluate(()=>{
   GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',20)),equippedRodId:'rod.sturdy',purchasedRodIds:['rod.basic','rod.sturdy']};
   GAME_STATE.appearance.activeTool='rod';const legacy=createSaveData();delete legacy.state.progression.fishing.durabilityByRodId;
   localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(legacy));
  });await page.reload();await ready(page);
  assert.equal(await page.evaluate(()=>getFishingRodDurability('rod.sturdy').current),120);
  await page.evaluate(()=>{
   worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
   globalThis.durabilityPond=()=>{
    let found=false;for(let y=0;y<MAP_H&&!found;y++)for(let x=0;x<MAP_W&&!found;x++)if(!isBlocked(x,y))for(const face of ['up','down','left','right']){
     player.x=x;player.y=y;player.face=face;if(getFishingSpotInFront()?.fishingHabitat==='pond'){found=true;break;}
    }
    if(!found)throw Error('No pond');player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;clearMovement();
   };
   globalThis.durabilitySnapshot=()=>JSON.stringify({inventory:GAME_STATE.inventory,fish:GAME_STATE.collections.fish,rewards:GAME_STATE.collections.fishRewards,
    fishing:GAME_STATE.progression.fishing,flags:GAME_STATE.progression.flags,coins:GAME_STATE.progression.coins,appearance:GAME_STATE.appearance,streak:fishingCatchStreak});
   globalThis.durabilityFailCatch=()=>{
    const original=Storage.prototype.setItem;
    try{Storage.prototype.setItem=()=>{throw Error('QA disk full');};handleFishingAction();}finally{Storage.prototype.setItem=original;}
   };
   GAME_STATE.progression.fishing.durabilityByRodId['rod.sturdy']=2;durabilityPond();
   const before=durabilitySnapshot();if(!startFishing())throw Error('Cannot cast');finishFishing();
   if(before!==durabilitySnapshot())throw Error('Cancelled casting wore gear');
   if(!startFishing())throw Error('Cannot cast');updateFishing(320);updateFishing(7000);finishFishing();
   if(before!==durabilitySnapshot())throw Error('Cancelled bite wore gear');
   if(!startFishing())throw Error('Cannot cancelled-retry cast');updateFishing(320);updateFishing(7000);
   durabilityFailCatch();if(!fishingState.pendingCatch)throw Error('Missing failed candidate');finishFishing();
   if(fishingState.pendingCatch||before!==durabilitySnapshot())throw Error('Cancelled failed catch granted or retained candidate');
   if(!startFishing())throw Error('Cannot cast');updateFishing(320);updateFishing(7000);
   cancelSkillXpFeedback();globalThis.durabilityBefore=durabilitySnapshot();durabilityFailCatch();
   if(durabilityBefore!==durabilitySnapshot())throw Error('Catch save failure mutated progression');
   if(fishingState.phase!=='bite'||isFishDiscoveryOpen()||fishingState.result||skillFeedbackState.pending)throw Error('Failed catch revealed feedback');
   globalThis.durabilityPending={id:fishingState.pendingCatch.fish.id,size:fishingState.pendingCatch.sizeCm};
   durabilityFailCatch();if(durabilityBefore!==durabilitySnapshot())throw Error('Second failure mutated state');
  });
  const committed=await page.evaluate(()=>{
   handleFishingAction();const r=fishingState.result;if(!r)throw Error('Retry failed');
   if(r.fishId!==durabilityPending.id||r.sizeCm!==durabilityPending.size)throw Error('Retry rerolled fish');
   return {first:r.firstDiscovery,current:getFishingRodDurability().current,active:GAME_STATE.appearance.activeTool,card:isFishDiscoveryOpen(),count:r.collection.count};
  });assert.deepEqual(committed,{first:true,current:1,active:'rod',card:true,count:1});
  await page.locator('#dialogNext').tap();
  const broken=await page.evaluate(()=>{
   if(!startFishing())throw Error('Cannot last-cast');updateFishing(320);updateFishing(7000);
   // Select the same species through its real pool weight.
   const pool=getEligibleFishPool(fishingState.context),target=pool.find(f=>f.id===durabilityPending.id);
   const index=pool.indexOf(target),sum=pool.reduce((s,f)=>s+getEffectiveFishWeight(f),0);
   const roll=(pool.slice(0,index).reduce((s,f)=>s+getEffectiveFishWeight(f),0)+getEffectiveFishWeight(target)/2)/sum,random=Math.random;
   try{Math.random=()=>roll;handleFishingAction();}finally{Math.random=random;}
   return {broke:fishingState.result.rodBroke,first:fishingState.result.firstDiscovery,current:getFishingRodDurability().current,
    active:GAME_STATE.appearance.activeTool,text:document.getElementById('dialogText').textContent,count:fishingState.result.collection.count};
  });assert(broken.broke&&!broken.first&&broken.text.includes('수리'));assert.equal(broken.current,0);assert.equal(broken.active,'none');assert.equal(broken.count,2);
  await page.screenshot({path:path.join(out,width+'-last-catch.png')});await page.locator('#dialogNext').tap();
  assert.equal(await page.evaluate(()=>getCharacterPose().tool),'none');
  assert.equal(await page.evaluate(()=>startFishing()),false);
  await page.reload();await ready(page);
  assert.deepEqual(await page.evaluate(()=>({current:getFishingRodDurability().current,active:GAME_STATE.appearance.activeTool,equip:equipFishingRod('rod.sturdy')})),{current:0,active:'none',equip:false});
  await page.evaluate(()=>{openInventory();inventoryState.tab='equipment';renderInventory();});
  const card=page.locator('[data-equip-id="rod.sturdy"]');assert(await card.evaluate(el=>el.classList.contains('broken')));
  await card.tap();assert((await page.locator('#inventorySummary').textContent()).includes('엘리'));
  await page.locator('[data-inventory-info-type="rod"][data-inventory-info-id="rod.sturdy"]').tap();
  assert((await page.locator('#inventoryDetailContent').textContent()).includes('내구도 0 / 120'));
  await page.screenshot({path:path.join(out,width+'-broken-bag.png')});
  await page.evaluate(()=>{closeInventoryDetail({fromHistory:true});closeInventory({fromHistory:true});GAME_STATE.progression.coins=1000;openMarket();marketState.view='rods';renderMarket();});
  const repair=page.locator('[data-repair-rod-id="rod.sturdy"]');assert((await repair.textContent()).includes('240'));await repair.tap();
  assert.deepEqual(await page.evaluate(()=>({current:getFishingRodDurability().current,active:GAME_STATE.appearance.activeTool,coins:GAME_STATE.progression.coins})),{current:120,active:'none',coins:760});
  await page.evaluate(()=>{closeMarket({fromHistory:true});if(!equipFishingRod('rod.sturdy'))throw Error('Manual equip failed');GAME_STATE.progression.fishing.durabilityByRodId['rod.sturdy']=84;openMarket();marketState.view='rods';renderMarket();});
  const equipment=page.locator('[data-equipment-id="rod.sturdy"]');if(!await equipment.evaluate(el=>el.open))await equipment.locator('summary').tap();
  assert((await repair.textContent()).includes('72'));assert(await repair.isEnabled());
  await page.screenshot({path:path.join(out,width+'-partial-repair.png')});await repair.tap();
  assert.deepEqual(await page.evaluate(()=>({current:getFishingRodDurability().current,active:GAME_STATE.appearance.activeTool,coins:GAME_STATE.progression.coins})),{current:120,active:'rod',coins:688});
  await page.evaluate(()=>{
   closeMarket({fromHistory:true});enterWorldRegion({to:'coast',entry:VOYAGE_HARBOR_ENTRY});voyageProgress().ticketCounts.shallow=1;
   if(!departVoyage('shallow'))throw Error('Departure failed');
  });await page.waitForFunction(()=>document.getElementById('voyageBoarding').hidden);
  await page.evaluate(()=>{
   GAME_STATE.progression.fishing.durabilityByRodId['rod.sturdy']=1;
   player.x=35;player.y=21;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
   if(!startFishing())throw Error('Boat cast failed');updateFishing(320);updateFishing(7000);
   activeVoyage().remainingMs=0;activeVoyage().returnPending=true;updateVoyage();
   const before=JSON.stringify({fishing:GAME_STATE.progression.fishing,fish:GAME_STATE.collections.fish,inventory:GAME_STATE.inventory,flags:GAME_STATE.progression.flags});
   const original=Storage.prototype.setItem;try{Storage.prototype.setItem=()=>{throw Error('QA disk full');};handleFishingAction();}finally{Storage.prototype.setItem=original;}
   if(before!==JSON.stringify({fishing:GAME_STATE.progression.fishing,fish:GAME_STATE.collections.fish,inventory:GAME_STATE.inventory,flags:GAME_STATE.progression.flags}))throw Error('Boat catch not atomic');
   updateVoyage();if(GAME_STATE.regionId!=='boatShallow'||fishingState.phase!=='bite'||!activeVoyage().returnPending)throw Error('Failed catch returned prematurely');
   handleFishingAction();if(!fishingState.result?.rodBroke||GAME_STATE.regionId!=='boatShallow')throw Error('Expired last catch failed');
  });await page.locator('#dialogNext').tap();await page.waitForFunction(()=>GAME_STATE.regionId==='coast');
  assert.deepEqual(await page.evaluate(()=>({active:GAME_STATE.appearance.activeTool,current:getFishingRodDurability().current,trip:activeVoyage()})),{active:'none',current:0,trip:null});
  // A basic rod can still be manually equipped; no passive auto-fallback or refill.
  await page.evaluate(()=>{if(!equipFishingRod('rod.basic'))throw Error('Basic fallback failed');saveGame();});await page.reload();await ready(page);
  assert.deepEqual(await page.evaluate(()=>({basic:getFishingRodDurability().infinite,paid:getFishingRodDurability('rod.sturdy').current})),{basic:true,paid:0});
  reports.push({width,committed,broken,legacyFull:true,saveRetry:true,partialRepair72:true,brokenReload:true,expiredCatch:true});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Rod durability browser passed: '+JSON.stringify({viewports:[393,320],legacyFull:true,cancelNoWear:true,atomicFrozenRetry:true,firstAndRepeat:true,lastCatchBreak:true,brokenReload:true,bagAndPartialRepair:true,noAutoEquip:true,expiredCatchAndReturn:true,errors}));
}finally{await browser.close();}
