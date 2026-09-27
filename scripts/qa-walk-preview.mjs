// Compare only the south walk playback order; use isolated saves and real renderer.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/walk-preview');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
  await page.goto(base+'?walk-preview&character-preview&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterLayerImgs.femaleWalkHair&&document.querySelector('[aria-label="아래 걷기 순서 비교"]'));
  const report=await page.evaluate(()=>{
    const originalFace=player.face,before=JSON.stringify(GAME_STATE),saved=JSON.stringify(createSaveData().state),store=JSON.stringify({...localStorage});
    lifeUi.chop=null;fishingState.phase='idle';player.moving=true;
    const frames=face=>{player.face=face;return Array.from({length:8},(_,i)=>{tNow=i*105;return getCharacterPose().frame;});};
    const compare=[],drawCalls=[],draw=ctx.drawImage;
    ctx.drawImage=function(...args){drawCalls.push(args);return draw.apply(this,args);};
    for(const sex of ['male','female']){
      setCharacterBodyPreview(sex);
      for(const face of ['down','right','left','up']){
        setCharacterWalkPreview('original');const original=frames(face);
        setCharacterWalkPreview('balanced');const balanced=frames(face);
        const expected=face==='down'?[1,0,2,0,1,0,2,0]:original;
        if(JSON.stringify(balanced)!==JSON.stringify(expected))throw Error('Unexpected sequence '+face);
        if(JSON.stringify(original)!=='[0,1,2,1,0,1,2,1]')throw Error('Baseline changed');
        // Per-frame draws must be exactly identical, including tool attachment.
        for(const frame of [0,1,2]){
          const pose={pose:'walk',face,frame,tool:'axe'};drawCalls.length=0;
          setCharacterWalkPreview('original');const a=drawCharacterActor(100,120,pose),calls=drawCalls.slice();
          drawCalls.length=0;setCharacterWalkPreview('balanced');const b=drawCharacterActor(100,120,pose);
          if(JSON.stringify(a)!==JSON.stringify(b)||calls.length!==drawCalls.length||
            !calls.every((call,i)=>call.every((value,j)=>value===drawCalls[i][j])))throw Error('Drawing/attachment changed');
        }
        compare.push({sex,face,original,balanced});
      }
    }
    ctx.drawImage=draw;player.moving=false;player.face='down';
    if(getCharacterPose().frame!==0)throw Error('Idle changed');
    lifeUi.chop={regionId:GAME_STATE.regionId,startedAt:0,tree:null};tNow=0;
    if(getCharacterPose().pose!=='chop'||getCharacterPose().frame!==0)throw Error('Chop changed');
    tNow=270;if(getCharacterPose().frame!==1)throw Error('Impact changed');lifeUi.chop=null;
    fishingState.phase='waiting';if(getCharacterPose().pose!=='fish'||getCharacterPose().frame!==1)throw Error('Fishing changed');
    fishingState.phase='idle';
    player.face=originalFace;
    if(JSON.stringify(GAME_STATE)!==before||JSON.stringify(createSaveData().state)!==saved||JSON.stringify({...localStorage})!==store)throw Error('Preview wrote save/state');
    return {compare,identicalFrameDraws:true,idleAndActionsUnchanged:true,stateAndStorageUnchanged:true};
  });
  const panel=page.locator('[aria-label="아래 걷기 순서 비교"]');
  await panel.getByRole('button',{name:'기존 동작'}).tap();
  assert.equal(await panel.getByRole('button',{name:'기존 동작'}).getAttribute('aria-pressed'),'true');
  await panel.getByRole('button',{name:'시험 동작'}).tap();
  assert.equal(await panel.getByRole('button',{name:'시험 동작'}).getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{setCharacterBodyPreview('male');camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();});
  await page.screenshot({path:path.join(output,'mobile-comparison.png')});
  await page.goto(base);
  await page.waitForFunction(()=>characterLayerImgs.walkBody);
  assert.equal(await page.locator('[aria-label="아래 걷기 순서 비교"]').count(),0);
  assert(await page.evaluate(()=>{player.face='down';player.moving=true;lifeUi.chop=null;fishingState.phase='idle';return !setCharacterWalkPreview('balanced')&&Array.from({length:4},(_,i)=>{tNow=i*105;return getCharacterPose().frame;}).join(',')==='0,1,2,1';}));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,normalLinkUnchanged:true,mobileButtons:true,browserErrors:errors},null,2));
  console.log('PASS: only down preview order differs; male/female, all frame draws/grips, idle/chop/fish, save/storage, normal link and mobile buttons unchanged.');
}finally{await browser.close();}
