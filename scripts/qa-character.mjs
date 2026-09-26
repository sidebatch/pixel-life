// Browser visual/regression QA. Uses actual game renderers and isolated storage.
// Install playwright separately, or point PIXEL_LIFE_PLAYWRIGHT at its module.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve(process.argv[2]||'output/character-qa');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const trialQuery=process.env.PIXEL_LIFE_QA_APPEARANCE==='trial'?'&appearance-preview':'';
const wardrobe={outfit:process.env.PIXEL_LIFE_QA_OUTFIT||null,backpack:process.env.PIXEL_LIFE_QA_BACKPACK||null};
async function applyWardrobe(page){
  if(!wardrobe.outfit&&!wardrobe.backpack)return;
  await page.waitForFunction(ids=>(!ids.outfit||characterOutfitImgs[ids.outfit]?.fish)&&
    (!ids.backpack||characterLayerImgs[CHARACTER_PARTS.backpack.get(ids.backpack)?.fishBackpack]),wardrobe,{polling:50});
  await page.evaluate(ids=>{
    if(ids.outfit&&!equipInventoryAppearance('outfit',ids.outfit))throw new Error('QA outfit equip failed');
    if(ids.backpack&&!equipInventoryAppearance('backpack',ids.backpack))throw new Error('QA backpack equip failed');
  },wardrobe);
}
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
try{
const context=await browser.newContext({viewport:{width:1100,height:900}});
const errors=[];
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
await page.goto(base+'?debug&time=12:00&weather=clear'+trialQuery);
await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler'],{timeout:30000});
await applyWardrobe(page);
const report=await page.evaluate(()=>{
  const before=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression});
  canvas.width=1100;canvas.height=900;
  canvas.style.cssText='position:relative;width:1100px;height:900px;max-width:none;max-height:none;';
  document.body.style.cssText='margin:0;background:#172f30;display:block;overflow:auto;';
  document.body.appendChild(canvas);
  for(const el of document.body.children)if(el!==canvas)el.style.display='none';
  ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1100,900);
  ctx.font='16px sans-serif';ctx.textAlign='left';ctx.fillStyle='#102b2c';
  const faces=['down','right','left','up'];
  const poses=['walk','chop','fish'];
  for(let p=0;p<poses.length;p++){
    const pose=poses[p],def=CHARACTER_RIG.poses[pose],groupX=25+p*350;
    ctx.fillText(pose+' / default layers + held tool',groupX,24);
    for(let row=0;row<4;row++)for(let frame=0;frame<def.columns;frame++){
      const x=groupX+40+frame*105,y=125+row*140;
      ctx.fillStyle='rgba(10,30,25,.12)';ctx.fillRect(x-45,y-105,96,125);
      drawCharacterActor(x,y,{pose,face:faces[row],frame,tool:pose==='fish'?'rod':'axe'});
      ctx.fillStyle='#102b2c';ctx.font='12px sans-serif';ctx.fillText(faces[row]+' '+frame,x-38,y+37);
    }
  }
  // All weapon tiers must fit the same waiting hand without changing the body.
  const originalAxe=getEquippedForestryAxe,originalRod=getEquippedFishingRod;
  for(const [i,key] of Object.keys(CHARACTER_RIG.tools).entries()){
    const isRod=key.startsWith('rod.'),asset=key.slice(4);
    if(isRod)getEquippedFishingRod=()=>({asset});
    else getEquippedForestryAxe=()=>({asset});
    // Rendering is tested directly; purchase restrictions must not be altered.
    drawCharacterActor(75+i*105,775,{pose:'walk',face:'right',frame:0,tool:isRod?'rod':'axe'});
    ctx.fillStyle='#102b2c';ctx.font='11px sans-serif';ctx.fillText(key,30+i*105,825);
  }
  getEquippedForestryAxe=originalAxe;getEquippedFishingRod=originalRod;
  if(before!==JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression}))throw new Error('Rendering changed progression');
  return {poses:32,layers:18,tools:10,progressionUnchanged:true};
});
await page.locator('#game').screenshot({path:path.join(output,'rig-contact-sheet.png')});
await page.evaluate(()=>{
  ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1100,900);
  ctx.imageSmoothingEnabled=false;
  for(const [row,face] of ['right','left'].entries())for(const frame of [0,1]){
    ctx.save();ctx.scale(4,4);
    drawCharacterActor(65+frame*135,85+row*105,{pose:'chop',face,frame,tool:'axe'});
    ctx.restore();ctx.fillStyle='#102b2c';ctx.font='18px sans-serif';ctx.textAlign='center';
    ctx.fillText(face+' / '+(frame===0?'ready':'impact'),260+frame*540,450+row*420);
  }
});
await page.locator('#game').screenshot({path:path.join(output,'backpack-side-closeups.png')});
await page.close();
const phone=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const mobile=await phone.newPage();
mobile.on('pageerror',e=>errors.push(e.message));
await mobile.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
await mobile.goto(base+'?time=12:00&weather=clear'+trialQuery);
await mobile.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler'],{timeout:30000});
await applyWardrobe(mobile);
for(const face of ['down','right','left','up']){
  await mobile.evaluate(face=>{
    player.face=face;player.moving=false;lifeUi.chop=null;fishingState.phase='idle';
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
    drawWorld();
  },face);
  await mobile.screenshot({path:path.join(output,'mobile-'+face+'.png')});
}
await mobile.evaluate(()=>{
  let position=null;
  for(const tile of waterSet){
    const [wx,wy]=tile.split(',').map(Number);
    for(const [face,[dx,dy]] of Object.entries(dirVec)){
      const x=wx-dx,y=wy-dy;
      if(inside(x,y)&&!blocked.has(key(x,y))&&!npcAt(x,y)){position={x,y,face};break;}
    }
    if(position)break;
  }
  if(!position)throw new Error('No usable fishing shore');
  Object.assign(player,position,{px:position.x*TILE+TILE/2,py:position.y*TILE+TILE/2,moving:false});
  camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
  camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
  if(!selectHeldTool('rod')||!startFishing())throw new Error('Real fishing start failed');
  updateFishing(FISHING_CONFIG.castMs);
  drawWorld();
  const pose=getCharacterPose(),tip=getFishingRodTipPosition();
  if(pose.pose!=='fish'||!Number.isFinite(tip.x)||!Number.isFinite(tip.y))throw new Error('Rod pose/tip failed');
});
await mobile.screenshot({path:path.join(output,'mobile-fishing.png')});
await mobile.evaluate(()=>{
  const count=GAME_STATE.inventory.length,xp=GAME_STATE.progression.fishing.totalXp;
  fishingState.biteDelay=0;updateFishing(0);handleFishingAction();drawWorld();
  if(!isFishingResult()||GAME_STATE.inventory.length!==count+1||GAME_STATE.progression.fishing.totalXp<=xp)
    throw new Error('Fishing catch/XP regression');
});
await mobile.screenshot({path:path.join(output,'mobile-catch.png')});
const logging=await mobile.evaluate(()=>{
  finishFishingResult();dialogOpen=false;document.getElementById('dialog').classList.remove('show');
  GAME_STATE.regionId='oldForest';buildWorldRegion(REGION_WORLDS.oldForest);
  const tree=trees.find(t=>t.x>8&&t.y>10&&t.y<38&&FORESTRY_TREES[t.species].tier===1&&!blocked.has(key(t.x-1,t.y)));
  if(!tree)throw new Error('No reachable beginner tree');
  Object.assign(player,{x:tree.x-1,y:tree.y,px:(tree.x-1)*TILE+TILE/2,py:tree.y*TILE+TILE/2,face:'right',moving:false});
  camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
  camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
  const before=getTreeState(tree).hp;
  if(!selectHeldTool('axe')||!startTreeChop(tree))throw new Error('Real chopping start failed');
  tNow=lifeUi.chop.startedAt;drawWorld();
  return {before};
});
await mobile.screenshot({path:path.join(output,'mobile-chop-ready.png')});
logging.after=await mobile.evaluate(()=>{
  tNow=lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.impactMs;
  updateLifeContentUi(tNow);drawWorld();
  return getTreeState(lifeUi.chop.tree).hp;
});
if(logging.before-logging.after!==20)throw new Error('Chop damage/timing regression');
await mobile.screenshot({path:path.join(output,'mobile-chop-impact.png')});
await mobile.evaluate(()=>{
  updateLifeContentUi(lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.durationMs);
  GAME_STATE.appearance.activeTool='axe';
});
for(const [index,face] of ['down','right','left','up'].entries()){
  await mobile.evaluate(face=>{
    let found=false;
    for(let y=5;y<MAP_H-5&&!found;y++)for(let x=5;x<MAP_W-5;x++){
      if(blocked.has(key(x,y))||npcAt(x,y))continue;
      Object.assign(player,{x,y,px:x*TILE+TILE/2,py:y*TILE+TILE/2,face,moving:false});
      if(resolveWorldInteraction())continue;
      camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
      camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
      window.__airState=JSON.stringify(GAME_STATE);found=true;break;
    }
    if(!found)throw new Error('No empty ground for '+face);
  },face);
  if(index<2)await mobile.keyboard.press(index===0?'Space':'KeyZ');
  else await mobile.locator('#btnA').tap();
  await mobile.evaluate(()=>{
    if(!lifeUi.chop||lifeUi.chop.tree||dialogOpen)throw new Error('Air action failed');
    const startedAt=lifeUi.chop.startedAt;
    interact();
    if(lifeUi.chop.startedAt!==startedAt)throw new Error('Repeat resets swing');
    tNow=startedAt;drawWorld();
  });
  await mobile.screenshot({path:path.join(output,'air-'+face+'-ready.png')});
  await mobile.evaluate(()=>{
    tNow=lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.impactMs;
    updateLifeContentUi(tNow);drawWorld();
    if(getCharacterPose().frame!==1)throw new Error('Missing air impact pose');
    if(JSON.stringify(GAME_STATE)!==window.__airState)throw new Error('Air swing changes game state');
  });
  await mobile.screenshot({path:path.join(output,'air-'+face+'-impact.png')});
  await mobile.evaluate(()=>{
    updateLifeContentUi(lifeUi.chop.startedAt+FORESTRY_CHOP_TIMING.durationMs);
    if(isChoppingTree())throw new Error('Air swing never ends');
  });
}
if(errors.length)throw new Error(errors.join('\n'));
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,browserErrors:errors,mobileViewport:'393x780',
  actualFishingCatchAndXp:true,actualChopHp:logging,airSwingKeyboardAndTouch:true},null,2));
console.log('Browser QA passed: '+JSON.stringify(report)+'. Screenshots: '+output);
}finally{
  await browser.close();
}
