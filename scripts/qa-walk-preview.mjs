// Compare only south walk body registration; use isolated saves and real renderer.
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
        const expected=original;
        if(JSON.stringify(balanced)!==JSON.stringify(expected))throw Error('Unexpected sequence '+face);
        if(JSON.stringify(original)!=='[0,1,2,1,0,1,2,1]')throw Error('Baseline changed');
        // Canonical head stays fixed; body, wardrobe and tool move as one unit.
        for(const frame of [0,1,2]){
          const pose={pose:'walk',face,frame,tool:'axe'};drawCalls.length=0;
          setCharacterWalkPreview('original');const a=drawCharacterActor(100,120,pose),calls=drawCalls.slice();
          drawCalls.length=0;setCharacterWalkPreview('balanced');const b=drawCharacterActor(100,120,pose);
          const shift=face==='down'?[0,3,-2][frame]*CHARACTER_RIG.renderSize/CHARACTER_RIG.cell:0;
          const expectedTool={...a,x:a.x+shift,tip:{...a.tip,x:a.tip.x+shift}};
          if(JSON.stringify(expectedTool)!==JSON.stringify(b)||calls.length!==drawCalls.length)throw Error('Hand/tool registration changed');
          const heads=new Set(Object.entries(characterLayerImgs).filter(([key])=>key.endsWith('Head')||key.endsWith('Hair')).map(([,image])=>image));
          if(!calls.every((call,i)=>call.every((value,j)=>
            j===5&&call.length===9&&!heads.has(call[0])?Math.abs(value+shift-drawCalls[i][j])<1e-8:value===drawCalls[i][j])))throw Error('Unexpected drawing change');
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
    return {compare,originalCadence:true,headAndScaleUnchanged:true,bodyAndToolOffsetOnly:true,idleAndActionsUnchanged:true,stateAndStorageUnchanged:true};
  });
  report.alignedWardrobeCombinations=await page.evaluate(()=>{
    const appearance={...GAME_STATE.appearance},tool=drawCharacterTool,dimensions=[canvas.width,canvas.height];
    drawCharacterTool=()=>{};setCharacterWalkPreview('balanced');canvas.width=160;canvas.height=160;
    let count=0;
    try{
      for(const sex of ['male','female'])for(const outfit of ['outfit.traveler','outfit.ember','outfit.meadow'])for(const pack of ['pack.traveler','pack.ranger','pack.berry'])for(let frame=0;frame<3;frame++){
        setCharacterBodyPreview(sex);GAME_STATE.appearance.outfitId=outfit;GAME_STATE.appearance.backpackId=pack;
        ctx.clearRect(0,0,160,160);drawCharacterActor(80,110,{pose:'walk',face:'down',frame,tool:'axe'});
        const pixels=ctx.getImageData(0,0,160,160).data,seen=new Uint8Array(25600),parts=[];
        for(let start=0;start<seen.length;start++){
          if(seen[start]||pixels[start*4+3]<80)continue;const queue=[start];seen[start]=1;
          for(let i=0;i<queue.length;i++){
            const n=queue[i],x=n%160,y=Math.floor(n/160);
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              const xx=x+dx,yy=y+dy,next=yy*160+xx;
              if(xx<0||xx>=160||yy<0||yy>=160||seen[next]||pixels[next*4+3]<80)continue;
              seen[next]=1;queue.push(next);
            }
          }
          parts.push(queue.length);
        }
        if(Math.max(...parts)/parts.reduce((a,b)=>a+b,0)<.97)throw Error('Head/body separated: '+[sex,outfit,pack,frame].join('/'));
        count++;
      }
    }finally{Object.assign(GAME_STATE.appearance,appearance);drawCharacterTool=tool;canvas.width=dimensions[0];canvas.height=dimensions[1];ctx.imageSmoothingEnabled=false;}
    return count;
  });
  assert.equal(report.alignedWardrobeCombinations,54);
  const panel=page.locator('[aria-label="아래 걷기 순서 비교"]');
  await panel.getByRole('button',{name:'기존 동작'}).tap();
  assert.equal(await panel.getByRole('button',{name:'기존 동작'}).getAttribute('aria-pressed'),'true');
  await panel.getByRole('button',{name:'보정 동작'}).tap();
  assert.equal(await panel.getByRole('button',{name:'보정 동작'}).getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{setCharacterBodyPreview('male');camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();});
  await page.screenshot({path:path.join(output,'mobile-comparison.png')});
  const contact=await page.evaluate(()=>{
    canvas.width=900;canvas.height=640;canvas.style.cssText='position:relative;width:900px;height:640px;max-width:none;max-height:none;';
    document.body.style.cssText='margin:0;display:block;overflow:auto;';document.body.appendChild(canvas);
    for(const el of document.body.children)if(el!==canvas)el.style.display='none';
    ctx.fillStyle='#73a07a';ctx.fillRect(0,0,900,640);ctx.imageSmoothingEnabled=false;
    for(let sex=0;sex<2;sex++)for(let mode=0;mode<2;mode++){
      setCharacterBodyPreview(sex?'female':'male');setCharacterWalkPreview(mode?'balanced':'original');
      const y=55+(sex*2+mode)*145;ctx.fillStyle='#102b2c';ctx.font='15px sans-serif';ctx.fillText((sex?'female':'male')+' / '+(mode?'aligned':'original'),10,y);
      for(let frame=0;frame<3;frame++){
        const x=240+frame*200;ctx.save();ctx.translate(x,y+65);ctx.scale(2,2);
        drawCharacterActor(0,0,{pose:'walk',face:'down',frame,tool:'axe'});ctx.restore();
      }
    }
    return canvas.toDataURL('image/png');
  });
  fs.writeFileSync(path.join(output,'down-alignment-comparison.png'),Buffer.from(contact.split(',')[1],'base64'));
  await page.goto(base);
  await page.waitForFunction(()=>characterLayerImgs.walkBody);
  assert.equal(await page.locator('[aria-label="아래 걷기 순서 비교"]').count(),0);
  assert(await page.evaluate(()=>{player.face='down';player.moving=true;lifeUi.chop=null;fishingState.phase='idle';return !setCharacterWalkPreview('balanced')&&getCharacterWalkAlignment({pose:'walk',face:'down',frame:1})===0&&Array.from({length:4},(_,i)=>{tNow=i*105;return getCharacterPose().frame;}).join(',')==='0,1,2,1';}));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,normalLinkUnchanged:true,mobileButtons:true,browserErrors:errors},null,2));
  console.log('PASS: down body/tool registration only; original cadence, fixed head/scale, male/female, idle/chop/fish, save/storage, normal link and mobile buttons.');
}finally{await browser.close();}
