// Real renderer: front/rear blade orientation only, with isolated trial state.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/axe-facing-preview');fs.mkdirSync(output,{recursive:true});
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:1100,height:850},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base+'?walk-preview&character-preview&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterLayerImgs.femaleChopHair&&characterToolImgs['axe.master']);
  const report=await page.evaluate(()=>{
    const before=JSON.stringify(GAME_STATE),save=JSON.stringify(createSaveData().state),stored=JSON.stringify({...localStorage});
    const equipped=getEquippedForestryAxe,toolDraw=drawCharacterTool,draw=ctx.drawImage;
    let combinations=0;const calls=[];ctx.drawImage=function(...args){calls.push(args);return draw.apply(this,args);};
    try{
      for(const sex of ['male','female'])for(const asset of ['basic','iron','steel','master'])for(const face of ['down','right','left','up'])for(let frame=0;frame<2;frame++){
        setCharacterBodyPreview(sex);getEquippedForestryAxe=()=>({asset});
        const pose={pose:'chop',face,frame,tool:'axe'},frontBack=face==='down'||face==='up';
        setCharacterWalkPreview('original');const old=getCharacterToolTransform(100,120,pose);
        setCharacterWalkPreview('balanced');const fixed=getCharacterToolTransform(100,120,pose);
        const mirror=frontBack?(face==='down'&&frame===0):old.mirror;
        if(fixed.mirror!==mirror||fixed.edgeScale!==(frontBack?.55:old.edgeScale))throw Error('Wrong blade projection');
        for(const key of ['key','x','y','axisAngle','scale','behind'])if(old[key]!==fixed[key])throw Error('Hand, shaft or draw depth changed: '+key);
        if(JSON.stringify(old.tip)!==JSON.stringify(fixed.tip))throw Error('Shaft tip moved');
        if(frontBack){
          const edgeY=Math.cos(fixed.axisAngle)*(fixed.mirror?-1:1);
          if(face==='down'?edgeY<=0:edgeY>=0)throw Error('Cutting edge points away from facing direction');
        }else if(JSON.stringify(old)!==JSON.stringify(fixed))throw Error('Side swing changed');
        // Resolve actual native shaft through mirror, rotation and foreshortening.
        const native=CHARACTER_RIG.tools[fixed.key],vx=(native.tip[0]-native.grip[0])*(fixed.mirror?-1:1)*fixed.scale,vy=(native.tip[1]-native.grip[1])*fixed.scale;
        const rx=vx*Math.cos(fixed.rotation)-vy*Math.sin(fixed.rotation),ry=vx*Math.sin(fixed.rotation)+vy*Math.cos(fixed.rotation);
        const along=rx*Math.cos(fixed.axisAngle)+ry*Math.sin(fixed.axisAngle),across=(-rx*Math.sin(fixed.axisAngle)+ry*Math.cos(fixed.axisAngle))*fixed.edgeScale;
        const tx=fixed.x+along*Math.cos(fixed.axisAngle)-across*Math.sin(fixed.axisAngle),ty=fixed.y+along*Math.sin(fixed.axisAngle)+across*Math.cos(fixed.axisAngle);
        if(Math.hypot(tx-fixed.tip.x,ty-fixed.tip.y)>1e-8)throw Error('Projected shaft detaches');
        drawCharacterTool=()=>{};calls.length=0;setCharacterWalkPreview('original');drawCharacterActor(100,120,pose);const baseline=calls.slice();
        calls.length=0;setCharacterWalkPreview('balanced');drawCharacterActor(100,120,pose);
        if(!baseline.every((call,i)=>call.every((value,j)=>value===calls[i]?.[j])))throw Error('Body/head/bag drawing changed');
        drawCharacterTool=toolDraw;combinations++;
      }
      for(const face of ['down','right','left','up'])for(const poseName of ['walk','fish'])for(let frame=0;frame<3;frame++){
        // Rods in every pose, and carried axes except the approved down walking offset.
        for(const tool of ['rod',...(poseName==='walk'&&face!=='down'?['axe']:[])]){
          const pose={pose:poseName,face,frame,tool};setCharacterWalkPreview('original');const a=getCharacterToolTransform(100,120,pose);
          setCharacterWalkPreview('balanced');const b=getCharacterToolTransform(100,120,pose);
          const shift=getCharacterWalkAlignment(pose)*CHARACTER_RIG.renderSize/CHARACTER_RIG.cell;
          const expected={...a,x:a.x+shift,tip:{...a.tip,x:a.tip.x+shift}};
          if(JSON.stringify(expected)!==JSON.stringify(b))throw Error('Carry/fishing tool changed');
        }
      }
    }finally{getEquippedForestryAxe=equipped;drawCharacterTool=toolDraw;ctx.drawImage=draw;}
    if(JSON.stringify(GAME_STATE)!==before||JSON.stringify(createSaveData().state)!==save||JSON.stringify({...localStorage})!==stored)throw Error('Trial persisted state');
    return {combinations,handAndShaftUnchanged:true,characterLayersUnchanged:true,sideSwingAndFishingUnchanged:true,forwardCuttingEdge:true,stateUnchanged:true};
  });
  assert.equal(report.combinations,64);
  const png=await page.evaluate(()=>{
    canvas.width=1100;canvas.height=800;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1100,800);
    for(let sex=0;sex<2;sex++)for(let mode=0;mode<2;mode++){
      setCharacterBodyPreview(sex?'female':'male');setCharacterWalkPreview(mode?'balanced':'original');
      const y=60+(sex*2+mode)*190;ctx.fillStyle='#102b2c';ctx.font='15px sans-serif';ctx.fillText((sex?'female':'male')+' / '+(mode?'fixed':'original'),8,y);
      for(let direction=0;direction<2;direction++)for(let frame=0;frame<2;frame++){
        ctx.save();ctx.translate(230+(direction*2+frame)*220,y+80);ctx.scale(2,2);drawCharacterActor(0,0,{pose:'chop',face:direction?'up':'down',frame,tool:'axe'});ctx.restore();
      }
    }
    return canvas.toDataURL('image/png');
  });
  fs.writeFileSync(path.join(output,'comparison.png'),Buffer.from(png.split(',')[1],'base64'));
  await page.setViewportSize({width:393,height:780});await page.reload();
  await page.waitForFunction(()=>characterLayerImgs.walkBody);
  await page.getByRole('button',{name:'기존 동작',exact:true}).tap();
  assert.equal(await page.evaluate(()=>getCharacterToolTransform(100,120,{pose:'chop',face:'down',frame:0,tool:'axe'}).edgeScale),1);
  await page.getByRole('button',{name:'보정 동작',exact:true}).tap();
  assert.equal(await page.evaluate(()=>getCharacterToolTransform(100,120,{pose:'chop',face:'down',frame:0,tool:'axe'}).edgeScale),.55);
  await page.goto(base);await page.waitForFunction(()=>characterLayerImgs.walkBody);
  assert.equal(await page.locator('[aria-label="아래 걷기 순서 비교"]').count(),0);
  assert(await page.evaluate(()=>{
    const front=getCharacterToolTransform(100,120,{pose:'chop',face:'down',frame:0,tool:'axe'});
    const back=getCharacterToolTransform(100,120,{pose:'chop',face:'up',frame:0,tool:'axe'});
    return !front.mirror&&!back.mirror&&front.edgeScale===1&&back.edgeScale===1;
  }));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,normalLinkUnchanged:true,mobileButtons:true,browserErrors:errors},null,2));
  console.log('PASS: 64 sex/axe/direction/phase combinations; front/rear blade projection, actual shaft/grip, unchanged character/side/fishing/save and normal game.');
}finally{await browser.close();}
