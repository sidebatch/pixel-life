import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/discovery-unified-qa');
fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>typeof isFishDiscoveryOpen==='function'&&!document.getElementById('startupLoading'));
  // Use normal bite/catch actions. Zero roll selects the ordinary pond crucian.
  const first=await page.evaluate(()=>{
   worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
   GAME_STATE.appearance.activeTool='rod';player.x=33;player.y=9;player.face='right';
   // Resolve a reachable pond edge from real collision/spot definitions.
   let found=false;for(let y=0;y<MAP_H&&!found;y++)for(let x=0;x<MAP_W&&!found;x++)if(!isBlocked(x,y))for(const face of ['up','down','left','right']){
    player.x=x;player.y=y;player.face=face;if(getFishingSpotInFront()?.fishingHabitat==='pond'){found=true;break;}
   }
   if(!found)throw Error('No reachable pond');player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;clearMovement();
   const xp=GAME_STATE.progression.fishing.totalXp,coins=GAME_STATE.progression.coins;
   if(!startFishing())throw Error('Cannot start');updateFishing(320);updateFishing(7000);
   const random=Math.random;try{Math.random=()=>0;handleFishingAction();}finally{Math.random=random;}
   const r=fishingState.result,dialog=document.getElementById('dialog'),box=dialog.getBoundingClientRect(),tree=document.getElementById('treeDiscoveryCard');
   return {id:r.fishId,name:r.name,first:r.firstDiscovery,xp:GAME_STATE.progression.fishing.totalXp-xp,expectedXp:r.progression.gained,
    coins:GAME_STATE.progression.coins-coins,count:GAME_STATE.collections.fish[r.fishId].count,card:isFishDiscoveryOpen(),pending:skillFeedbackState.pending?.[0],
    noInline:!dialog.querySelector('[data-skill-card]'),sameBackground:getComputedStyle(dialog).backgroundImage===getComputedStyle(tree).backgroundImage,
    animation:getComputedStyle(dialog).animationName,inside:box.left>=0&&box.right<=innerWidth&&box.top>=0&&box.bottom<=innerHeight,
    button:document.getElementById('dialogNext').getBoundingClientRect().height,buttonFlow:getComputedStyle(document.getElementById('dialogNext')).position,
    sameButton:getComputedStyle(document.getElementById('dialogNext')).backgroundImage===getComputedStyle(document.getElementById('treeDiscoveryClose')).backgroundImage,
    position:{x:player.x,y:player.y}};
  });assert.equal(first.first,true);assert.equal(first.card,true);assert.equal(first.count,1);assert.equal(first.xp,first.expectedXp);
  assert.equal(first.pending,'fishing');assert.ok(first.noInline&&first.sameBackground&&first.inside);assert.equal(first.animation,'treeDiscoveryFlip');assert.ok(first.button>=44);
  assert.equal(first.buttonFlow,'static');assert.ok(first.sameButton);await page.waitForFunction(()=>document.getElementById('dialog').getAnimations().every(a=>a.playState!=='running'));
  await page.screenshot({path:path.join(out,width+'-first-fish.png')});
  await page.keyboard.press('Escape');await page.locator('#fishDiscoveryOverlay .treeDiscoveryBackdrop').tap({position:{x:3,y:3}});
  await page.evaluate(()=>history.pushState({...history.state,qaDiscoveryBack:true},''));await page.goBack();
  const locked=await page.evaluate(()=>{pressB();interact();closeDialog();tryMove('up');return {open:isFishDiscoveryOpen(),x:player.x,y:player.y,phase:fishingState.phase};});
  assert.deepEqual(locked,{open:true,...first.position,phase:'result'});
  await page.locator('#dialogNext').tap();await page.waitForFunction(()=>!isFishDiscoveryOpen()&&fishingState.phase==='idle'&&document.getElementById('skillXPToast').classList.contains('show'));
  const feedback=await page.evaluate(()=>({cards:document.querySelectorAll('[data-skill-card="fishing"]').length,pending:skillFeedbackState.pending,updated:GAME_STATE.collections.fish[fishingCatchStreak.fishId].count,
   home:document.getElementById('dialog').previousElementSibling?.id,toast:document.getElementById('skillXPToast').textContent}));
  assert.equal(feedback.cards,1);assert.equal(feedback.pending,null);assert.equal(feedback.updated,1);assert.equal(feedback.home,'fishDiscoveryOverlay');assert.ok(feedback.toast.includes('XP'));
  await page.screenshot({path:path.join(out,width+'-fish-xp.png')});
  const repeat=await page.evaluate(()=>{
   if(!startFishing())throw Error('Cannot repeat');updateFishing(320);updateFishing(7000);const random=Math.random;
   try{Math.random=()=>0;handleFishingAction();}finally{Math.random=random;}
   return {first:fishingState.result.firstDiscovery,discovery:isFishDiscoveryOpen(),count:fishingState.result.collection.count,
    inline:document.querySelectorAll('#dialog [data-skill-card]').length,art:document.querySelectorAll('#dialog .treeDiscoveryArt').length};
  });assert.deepEqual(repeat,{first:false,discovery:false,count:2,inline:0,art:0});await page.locator('#dialogNext').tap();
  await page.evaluate(()=>saveGame());await page.reload();await page.waitForFunction(()=>typeof isFishDiscoveryOpen==='function'&&!document.getElementById('startupLoading'));
  assert.equal(await page.evaluate(()=>GAME_STATE.collections.fish['fish.crucian_carp'].count),2);assert.equal(await page.evaluate(()=>isFishDiscoveryOpen()),false);
  // Logging uses the same deferred visual sequence without granting XP twice.
  const tree=await page.evaluate(()=>{
   cancelSkillXpFeedback();enterWorldRegion({to:'oldForest',entry:{x:31,y:44,face:'up'}});GAME_STATE.appearance.activeTool='axe';
   const tree=trees.find(t=>t.species==='oak'&&t.interactable),xp=GAME_STATE.progression.logging.totalXp,hits=Math.ceil(FORESTRY_TREES.oak.maxHp/getEquippedForestryAxe().damage);
   for(let i=0;i<hits;i++)if(!hitResourceTree(tree))throw Error('Chop failed');
   return {open:isTreeDiscoveryOpen(),pending:skillFeedbackState.pending?.[0],xp:GAME_STATE.progression.logging.totalXp-xp,expected:forestryTreeXp(FORESTRY_TREES.oak)};
  });assert.ok(tree.open);assert.equal(tree.pending,'logging');assert.equal(tree.xp,tree.expected);
  await page.screenshot({path:path.join(out,width+'-first-tree.png')});await page.locator('#treeDiscoveryClose').tap();
  assert.equal(await page.evaluate(()=>document.querySelectorAll('[data-skill-card="logging"]').length),1);
  await page.screenshot({path:path.join(out,width+'-tree-xp.png')});
  // Lv-up is displayed after reading the discovery, using the common skill UI.
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{
   cancelSkillXpFeedback();enterWorldRegion({to:'lilacVillage',entry:{x:33,y:9,face:'right'}});Object.assign(player,{...GAME_STATE.playerLocation});
   let found=false;for(let y=0;y<MAP_H&&!found;y++)for(let x=0;x<MAP_W&&!found;x++)if(!isBlocked(x,y))for(const face of ['up','down','left','right']){player.x=x;player.y=y;player.face=face;if(getFishingSpotInFront()?.fishingHabitat==='pond'){found=true;break;}}
   GAME_STATE.appearance.activeTool='rod';const target=FISH_DATA.find(f=>f.id==='fish.koi');
   GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',2)-4),equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
   if(!startFishing())throw Error('Level catch failed');updateFishing(320);updateFishing(7000);
   const pool=getEligibleFishPool(fishingState.context),i=pool.findIndex(f=>f.id===target.id),sum=pool.reduce((s,f)=>s+getEffectiveFishWeight(f),0),roll=(pool.slice(0,i).reduce((s,f)=>s+getEffectiveFishWeight(f),0)+getEffectiveFishWeight(target)/2)/sum,random=Math.random;
   try{Math.random=()=>roll;handleFishingAction();}finally{Math.random=random;}
   if(!isFishDiscoveryOpen()||isSkillLevelUpVisible()||getComputedStyle(document.getElementById('dialog')).animationName!=='none')throw Error('Reduced first discovery sequence incorrect');
  });await page.locator('#dialogNext').tap();assert.equal(await page.evaluate(()=>isSkillLevelUpVisible()),true);
  await page.screenshot({path:path.join(out,width+'-fishing-level-up.png')});
  reports.push({width,first,feedback,repeat,tree,levelUp:true,reducedMotion:true});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Unified discovery passed: '+JSON.stringify({viewports:[393,320],firstOnlyFlip:true,explicitConfirmation:true,oneCommonXpCard:true,treeFishMatch:true,noDoubleRewards:true,repeatAndRestore:true,reducedMotion:true,levelUp:true,errors}));
}finally{await browser.close();}
