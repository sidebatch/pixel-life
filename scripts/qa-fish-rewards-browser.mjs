import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/fish-rewards-qa');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
const ready=page=>page.waitForFunction(()=>typeof updateFishRewardReveal==='function'&&!document.getElementById('startupLoading'));
async function claimAll(page,seen=[],onCard=null){
  for(let i=0;i<16;i++){
    await page.evaluate(()=>updateFishRewardReveal());
    const reward=await page.evaluate(()=>fishRewardRevealState.open?{...fishRewardRevealState.reward}:null);
    if(!reward)return seen;
    seen.push(reward);if(onCard)await onCard(reward);await page.locator('#fishRewardClaim').tap();
    await page.waitForFunction(id=>!isFishRewardRevealOpen()||fishRewardRevealState.reward?.id!==id,reward.id);
  }
  throw Error('Reward cards did not finish');
}
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base);await ready(page);
    await page.evaluate(()=>{
      GAME_STATE.collections.fish=Object.fromEntries(FISH_DATA.map(f=>[f.id,{count:3,minSizeCm:f.minSizeCm,maxSizeCm:f.maxSizeCm,totalSizeCm:f.minSizeCm+f.maxSizeCm*2}]));
      GAME_STATE.progression.flags={fishCollectionRewards:{5:true,10:true,15:true,19:true,20:true},rareFishHints:true,finalFishClue:true,masterAnglerTitle:true,masterRod:true};
      GAME_STATE.progression.coins=999;
      GAME_STATE.inventory=[{type:'fish',id:'fish.coelacanth',name:'실러캔스',rarity:'legendary',sizeCm:132.7,price:1478,quantity:3},{type:'equipment',id:'rod.master_angler',name:'강태공의 낚싯대',quantity:1}];
      const legacy=createSaveData();delete legacy.state.collections.fishRewards;localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(legacy));
      const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key!==SAVE_CONFIG.key)return original.call(this,key,value);};
    });
    await page.reload();await ready(page);
    const migrated=await page.evaluate(()=>({state:getFishDexRewardState(),pending:pendingFishDexReward(),coins:GAME_STATE.progression.coins,stock:GAME_STATE.inventory.find(f=>f.id==='fish.coelacanth'),title:fishDexActiveTitle()}));
    assert.equal(migrated.state.milestoneIds.length,5);assert.equal(migrated.state.habitatIds.length,10);assert.equal(migrated.pending,null);assert.equal(migrated.coins,999);assert.equal(migrated.title,'세계의 강태공');
    assert.deepEqual([migrated.stock.quantity,migrated.stock.sizeCm,migrated.stock.price],[3,132.7,1478]);
    await page.evaluate(()=>openFishDex());assert.equal(await page.locator('.fishHabitatSeal').count(),10);
    await page.screenshot({path:path.join(out,width+'-legacy-quiet.png')});
    const milestones=[];
    for(const count of [30,40,50,60,74]){
      await page.evaluate(count=>{
        suspendFishRewardReveal();closeFishDex({fromHistory:true});clearVoyageOverlayHistory();
        const records=n=>Object.fromEntries(FISH_DATA.slice(0,n).map(f=>[f.id,{count:1,minSizeCm:f.minSizeCm,maxSizeCm:f.minSizeCm,totalSizeCm:f.minSizeCm}]));
        const before=records(count-1);GAME_STATE.collections.fishRewards=normalizeSavedFishDexRewards(null,before);
        GAME_STATE.collections.fish=records(count);syncFishDexRewards();saveGame();openFishDex();
      },count);
      const before=await page.evaluate(()=>JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory,fishing:GAME_STATE.progression.fishing,flags:GAME_STATE.progression.flags}));
      const cards=[];
      await claimAll(page,cards,async reward=>{
        if(reward?.kind==='milestone'){
          assert.equal(reward.count,count);await page.screenshot({path:path.join(out,width+'-milestone-'+count+'.png')});
          milestones.push(reward.name);
        }
      });
      assert.equal(cards.filter(r=>r.kind==='milestone'&&r.count===count).length,1);
      assert.equal(await page.evaluate(()=>JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory,fishing:GAME_STATE.progression.fishing,flags:GAME_STATE.progression.flags})),before);
      const frame=await page.evaluate(()=>({wave:document.getElementById('fishDexPanel').classList.contains('fish-reward-wave'),aurora:document.getElementById('fishDexPanel').classList.contains('fish-reward-aurora')}));
      if(count===40)assert.equal(frame.wave,true);if(count===74)assert.equal(frame.aurora,true);
      const overflow=await page.evaluate(()=>{const b=document.getElementById('fishDexPanel').getBoundingClientRect();return [...document.querySelectorAll('#fishDexGrid [data-fish-section],#fishDexCategoryTabs button')].some(el=>{const r=el.getBoundingClientRect();return r.left<b.left-1||r.right>b.right+1;});});assert.equal(overflow,false);
    }
    // A modern save with earned but unacknowledged rewards keeps all 15 cards.
    await page.evaluate(()=>{closeFishDex({fromHistory:true});clearVoyageOverlayHistory();GAME_STATE.collections.fishRewards=normalizeSavedFishDexRewards({schemaVersion:1},GAME_STATE.collections.fish);saveGame();});
    await page.reload();await ready(page);await page.waitForFunction(()=>isFishRewardRevealOpen());
    const first=await page.evaluate(()=>({...fishRewardRevealState.reward}));
    await page.goBack();assert.equal(await page.evaluate(()=>isFishRewardRevealOpen()),true);
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>isFishRewardRevealOpen()),true);
    await page.evaluate(()=>pressB());assert.equal(await page.evaluate(()=>isFishRewardRevealOpen()),true);
    await page.locator('.fishRewardBackdrop').tap({position:{x:4,y:4}});assert.equal(await page.evaluate(()=>isFishRewardRevealOpen()),true);
    await page.evaluate(()=>{globalThis.rewardStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('QA receipt failure');};});
    await page.locator('#fishRewardClaim').tap();
    assert.ok((await page.locator('#fishRewardStatus').textContent()).includes('저장하지 못'));
    assert.equal(await page.evaluate(()=>getFishDexRewardState().revealedHabitatIds.length),0);
    await page.screenshot({path:path.join(out,width+'-receipt-retry.png')});
    await page.evaluate(()=>{Storage.prototype.setItem=globalThis.rewardStorageSet;});await page.locator('#fishRewardClaim').tap();
    await page.waitForFunction(id=>fishRewardRevealState.reward?.id!==id,first.id);
    await page.reload();await ready(page);await page.waitForFunction(()=>isFishRewardRevealOpen());
    assert.notEqual(await page.evaluate(()=>fishRewardRevealState.reward.id),first.id);
    const remaining=await claimAll(page);
    assert.equal(remaining.length,14);assert.equal(new Set(remaining.map(r=>r.kind+':'+r.id)).size,14);
    await page.evaluate(()=>saveGame());await page.reload();await ready(page);
    assert.equal(await page.evaluate(()=>pendingFishDexReward()),null);
    await page.evaluate(()=>openFishDex());await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('fishDexPanel')).animationName),'none');
    await page.screenshot({path:path.join(out,width+'-aurora-reduced.png')});await page.emulateMedia({reducedMotion:'no-preference'});
    // Same ship/collision: the 50-species reward changes only its decorative flag.
    await page.evaluate(()=>{
      closeFishDex({fromHistory:true});clearVoyageOverlayHistory();GAME_STATE.progression.coins=50000;
      GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',45)),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
      enterWorldRegion({to:'coast',entry:{x:38,y:33,face:'down'}});buyVoyageTickets('shallow');departVoyage('shallow');
    });await page.waitForFunction(()=>!isVoyageBoarding());
    const drawings=[];
    for(const count of [49,50]){
      const info=await page.evaluate(count=>{
        GAME_STATE.collections.fish=Object.fromEntries(FISH_DATA.slice(0,count).map(f=>[f.id,{count:1,minSizeCm:f.minSizeCm,maxSizeCm:f.minSizeCm,totalSizeCm:f.minSizeCm}]));
        GAME_STATE.collections.fishRewards=normalizeSavedFishDexRewards(null,GAME_STATE.collections.fish);
        player.x=36;player.y=27;player.face='right';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;camX=player.px-VIEW_W/2;camY=player.py-VIEW_H/2;
        activeVoyage().tripSeed=42;activeVoyage().remainingMs=594000;voyageClock.last=performance.now();worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
        const original=ctx.fill;let flagPaints=0;ctx.fill=function(...args){if(this.fillStyle==='#26788d')flagPaints++;return original.apply(this,args);};
        try{drawWorld();}finally{ctx.fill=original;}
        return {flag:hasFishVoyageRewardFlag(),flagPaints,spot:getFishingSpotInFront(),pixel:canvas.toDataURL()};
      },count);drawings.push(info);await page.screenshot({path:path.join(out,width+'-ship-flag-'+count+'.png')});
    }
    assert.equal(drawings[0].flag,false);assert.equal(drawings[1].flag,true);assert.deepEqual(drawings[0].spot,drawings[1].spot);assert.notEqual(drawings[0].pixel,drawings[1].pixel);
    assert.equal(drawings[0].flagPaints,0);assert.equal(drawings[1].flagPaints,1);
    // Expiry while reading a card suspends it for the return, without claiming it.
    await page.evaluate(()=>{
      getFishDexRewardState().revealedMilestoneIds=getFishDexRewardState().revealedMilestoneIds.filter(id=>id!=='voyage-flag');
      updateFishRewardReveal();activeVoyage().remainingMs=0;updateVoyage();
    });
    await page.waitForFunction(()=>GAME_STATE.regionId==='coast'&&isFishRewardRevealOpen());
    assert.equal(await page.evaluate(()=>fishRewardRevealState.reward.id),'voyage-flag');
    assert.equal(await page.evaluate(()=>getFishDexRewardState().revealedMilestoneIds.includes('voyage-flag')),false);
    await claimAll(page);
    // Last real fish: finish the catch and timed voyage before either reward card.
    await page.evaluate(()=>{
      returnFromVoyage();buyVoyageTickets('glacier');departVoyage('glacier');
      const known=FISH_DATA.filter(f=>f.id!=='fish.aurora_smelt');GAME_STATE.collections.fish=Object.fromEntries(known.map(f=>[f.id,{count:1,minSizeCm:f.minSizeCm,maxSizeCm:f.minSizeCm,totalSizeCm:f.minSizeCm}]));
      GAME_STATE.collections.fishRewards=normalizeSavedFishDexRewards(null,GAME_STATE.collections.fish);saveGame();
    });await page.waitForFunction(()=>!isVoyageBoarding());
    await page.evaluate(()=>{
      GAME_STATE.appearance.activeTool='rod';player.x=36;player.y=27;player.face='right';worldTime.minutes=1320;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
      if(!startFishing())throw Error('Final catch could not start');updateFishing(320);updateFishing(7000);
      const pool=getEligibleFishPool(fishingState.context),i=pool.findIndex(f=>f.id==='fish.aurora_smelt'),total=pool.reduce((sum,f)=>sum+getEffectiveFishWeight(f),0);
      const roll=(pool.slice(0,i).reduce((sum,f)=>sum+getEffectiveFishWeight(f),0)+getEffectiveFishWeight(pool[i])/2)/total,original=Math.random;
      try{Math.random=()=>roll;handleFishingAction();}finally{Math.random=original;}
      activeVoyage().remainingMs=0;updateVoyage();
    });
    assert.equal(await page.evaluate(()=>isFishRewardRevealOpen()),false);assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'boatGlacier');
    await page.locator('#dialogNext').tap();await page.waitForFunction(()=>isFishRewardRevealOpen());
    assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'coast');assert.equal(await page.evaluate(()=>fishRewardRevealState.reward.id),'glacier');
    await page.screenshot({path:path.join(out,width+'-real-graduation-after-return.png')});
    await page.locator('#fishRewardClaim').tap();await page.waitForFunction(()=>fishRewardRevealState.reward?.id==='world-master-angler');
    await page.screenshot({path:path.join(out,width+'-real-74-after-return.png')});await claimAll(page);
    await page.evaluate(()=>saveGame());await page.reload();await ready(page);
    assert.equal(await page.evaluate(()=>pendingFishDexReward()),null);assert.equal(await page.evaluate(()=>getDiscoveredFishCount()),74);
    reports.push({width,quietLegacy:true,milestones,modernPendingAndRetry:true,oneTimeCards:15,flagVisualOnly:true,habitatFinale:true,expiryBeforeRewards:true,expiryDuringCard:true,reducedMotion:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
  console.log('Fish reward browser passed: '+JSON.stringify({reports,errors}));
}finally{await browser.close();}
