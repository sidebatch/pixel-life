// Browser regression for the first sword and its reusable action family.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/sword-v1');fs.mkdirSync(output,{recursive:true});
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base+'?time=12:00&weather=clear');
  await page.waitForFunction(()=>characterToolImgs['sword.basic']&&characterLayerImgs.chopGrip);
  const starter=await page.evaluate(()=>({owned:getOwnedSwords().map(sword=>sword.id),active:GAME_STATE.appearance.activeTool,
    swordId:GAME_STATE.progression.swords.swordId,next:nextSword()}));
  assert.deepEqual(starter,{owned:['sword.basic'],active:'axe',swordId:'sword.basic',next:null});
  await page.evaluate(()=>{openInventory();inventoryState.tab='equipment';renderInventory();});
  const card=page.locator('[data-equip-type="sword"][data-equip-id="sword.basic"]');
  assert.equal(await card.count(),1,await page.locator('#inventoryScroll').innerHTML());
  assert.equal(await card.getAttribute('aria-pressed'),'false');
  await card.tap();
  assert.equal(await card.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.inventoryEquipmentCard.equipped').count(),1);
  await page.evaluate(()=>closeInventory());
  const report=await page.evaluate(()=>{
    if(GAME_STATE.appearance.activeTool!=='sword')throw Error('Sword did not equip');
    const before=JSON.stringify(createSaveData().state),stored=localStorage.getItem(SAVE_CONFIG.key);
    const swordArt=characterToolImgs['sword.basic'];
    const faces=['down','right','left','up'];let poses=0;
    canvas.width=750;canvas.height=720;ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#6d987c';ctx.fillRect(0,0,750,720);
    const appearance=GAME_STATE.appearance,oldPreview=characterBodyPreview;
    try{
      for(const [sexIndex,bodyId] of ['body.starter','body.female'].entries()){
        GAME_STATE.appearance={...appearance,bodyId,hairId:sexIndex?'hair.female.brown':'hair.brown'};
        for(const [faceIndex,face] of faces.entries())for(const frame of [0,1]){
          const pose={pose:'sword',face,frame,tool:'sword'};
          const transform=getCharacterToolTransform(0,0,pose);
          const grip=SWORD_ACTION.frames[face][frame].grip,unit=CHARACTER_RIG.renderSize/96;
          if(transform.key!=='sword.basic'||transform.edgeScale!==1||
            Math.abs(transform.x-(grip[0]-48)*unit)>1e-8||
            Math.abs(transform.y-(20+(grip[1]-88)*unit))>1e-8||
            Math.abs(Math.hypot(transform.tip.x-transform.x,transform.tip.y-transform.y)-
              SWORD_TOOLS['sword.basic'].swingLength*unit)>1e-8)
            throw Error(`Sword disconnected from common right hand: ${JSON.stringify({face,frame,transform,grip,unit})}`);
          if(face==='down'&&frame===1&&transform.tip.y<=transform.y||
            face==='up'&&frame===0&&(transform.tip.x<=transform.x||!transform.behind)||
            face==='up'&&frame===1&&(transform.tip.x>=transform.x||!transform.behind))
            throw Error('Rear sword slash must cross right-to-left behind the head');
          ctx.save();ctx.translate(100+frame*180+sexIndex*370,105+faceIndex*150);ctx.scale(2,2);
          drawCharacterActor(0,0,pose);ctx.restore();poses++;
        }
      }
    }finally{GAME_STATE.appearance=appearance;characterBodyPreview=oldPreview;}
    const future={carryLength:36,swingLength:48};
    if(swordTargetLength(future,'walk')!==36||swordTargetLength(future,'sword')!==48)
      throw Error('Longer sword would be shrunk to basic-sword size');
    if(JSON.stringify(createSaveData().state)!==before||localStorage.getItem(SAVE_CONFIG.key)!==stored)
      throw Error('Sword render changed progress or save');
    const png=canvas.toDataURL('image/png');
    canvas.width=576;canvas.height=1024;
    const inventoryBefore=JSON.stringify(GAME_STATE.inventory),treesBefore=JSON.stringify(GAME_STATE.world.trees);
    player.moving=false;menuOpen=false;dialogOpen=false;lifeUi.chop=null;
    if(!startSwordSwing())throw Error('Sword did not swing in air');
    const started=lifeUi.chop.startedAt;
    tNow=started+SWORD_SWING_TIMING.impactMs+1;
    if(getCharacterPose().pose!=='sword'||getCharacterPose().frame!==1||
      !isChoppingTree()||startSwordSwing())throw Error('Sword action lock/impact failed');
    updateLifeContentUi(started+SWORD_SWING_TIMING.impactMs+1);
    updateLifeContentUi(started+SWORD_SWING_TIMING.durationMs+1);
    if(isChoppingTree()||inventoryBefore!==JSON.stringify(GAME_STATE.inventory)||
      treesBefore!==JSON.stringify(GAME_STATE.world.trees))throw Error('Air sword swing changed resources');
    return {poses,source:swordArt.src,oneHeldWeapon:true,airSwingNoRewards:true,png};
  });
  fs.writeFileSync(path.join(output,'sword-contact-sheet.png'),Buffer.from(report.png.split(',')[1],'base64'));
  delete report.png;
  const longerPreview=await page.evaluate(()=>{
    const originalLength=swordTargetLength,appearance=GAME_STATE.appearance;
    canvas.width=750;canvas.height=210;ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#6d987c';ctx.fillRect(0,0,750,210);
    try{
      swordTargetLength=(tool,pose)=>pose==='sword'?48:36;
      for(const [sexIndex,bodyId] of ['body.starter','body.female'].entries()){
        GAME_STATE.appearance={...appearance,bodyId,hairId:sexIndex?'hair.female.brown':'hair.brown'};
        for(const frame of [0,1]){
          const pose={pose:'sword',face:'up',frame,tool:'sword'};
          const transform=getCharacterToolTransform(0,0,pose),unit=CHARACTER_RIG.renderSize/96;
          if(Math.abs(Math.hypot(transform.tip.x-transform.x,transform.tip.y-transform.y)-48*unit)>1e-8||
            !transform.behind||frame===0&&transform.tip.x<=transform.x||frame===1&&transform.tip.x>=transform.x)
            throw Error('Long sword lost its shared pivot, length, arc or head occlusion');
          ctx.save();ctx.translate(100+frame*180+sexIndex*370,105);ctx.scale(2,2);
          drawCharacterActor(0,0,pose);ctx.restore();
        }
      }
      return canvas.toDataURL('image/png');
    }finally{swordTargetLength=originalLength;GAME_STATE.appearance=appearance;canvas.width=576;canvas.height=1024;}
  });
  fs.writeFileSync(path.join(output,'longer-sword-preview.png'),Buffer.from(longerPreview.split(',')[1],'base64'));
  const legacy=await page.evaluate(()=>{
    const swords=normalizeSavedSwordProgress(undefined);
    const appearance=normalizeSavedAppearance({activeTool:'sword'});
    if(swords.swordId!=='sword.basic'||swords.ownedSwordIds.length!==1||appearance.activeTool!=='sword')
      throw Error('Legacy or sword save normalization failed');
    GAME_STATE.regionId='oldForest';buildWorldRegion(REGION_WORLDS.oldForest);
    const tree=trees.find(item=>item.interactable);
    if(!tree)throw Error('No tree to test sword non-damage');
    const before=JSON.stringify(GAME_STATE.world.trees),inventoryBefore=JSON.stringify(GAME_STATE.inventory);
    if(!activateWorldInteraction({kind:'tree',target:tree}))throw Error('Sword cannot swing at tree');
    const started=lifeUi.chop.startedAt;
    updateLifeContentUi(started+SWORD_SWING_TIMING.impactMs+1);
    updateLifeContentUi(started+SWORD_SWING_TIMING.durationMs+1);
    if(JSON.stringify(GAME_STATE.world.trees)!==before||JSON.stringify(GAME_STATE.inventory)!==inventoryBefore)
      throw Error('Sword swing damaged tree or awarded resources');
    return {legacyStarter:true,treeSwingNoDamage:true};
  });
  await page.reload();
  await page.waitForFunction(()=>characterToolImgs['sword.basic']);
  assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'sword');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,...legacy,reloaded:true,browserErrors:errors},null,2));
  console.log(`PASS: basic sword owned, one held tool, ${report.poses} live sword poses, hand/tip, air/tree swings, legacy save/reload.`);
}finally{await browser.close();}
