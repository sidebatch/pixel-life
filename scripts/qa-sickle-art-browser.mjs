// Render the actual shared body/hand rig in isolated browser storage.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const out=path.resolve(process.argv[2]||'output/sickle-art-qa');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
try{
  const context=await browser.newContext({viewport:{width:800,height:1100}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Art readiness is the startup screen; streaming music may finish later.
  await page.goto(process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof SICKLE_TOOLS!=='undefined'&&!document.getElementById('startupLoading'));
  const report=await page.evaluate(()=>{
    drawWorld=()=>{};const canvas=document.getElementById('game');canvas.width=576;canvas.height=1120;
    ctx.fillStyle='#e4edce';ctx.fillRect(0,0,576,1120);ctx.imageSmoothingEnabled=false;
    const previous=GAME_STATE.appearance,faces=['down','right','left','up'];let count=0;
    const bodies=[...CHARACTER_PARTS.body.keys()];
    for(const [bodyIndex,bodyId] of bodies.entries()){
      GAME_STATE.appearance={...previous,bodyId,activeTool:'sickle'};
      for(const [row,[pose,frame,label]] of [['walk',0,'Carry'],['sickle',0,'Ready'],['sickle',1,'Harvest']].entries())
        for(const [column,face] of faces.entries()){
          const x=column*144+72,y=bodyIndex*540+row*170+125;
          ctx.fillStyle='#385141';ctx.font='14px sans-serif';ctx.textAlign='center';
          ctx.fillText(bodyId+' / '+face,x,y-105);ctx.fillText(label,x,y+40);
          const transform=drawCharacterActor(x,y,{pose,face,frame,tool:'sickle'});
          assertFinite(transform);count++;
        }
    }
    GAME_STATE.appearance=previous;
    function assertFinite(t){if(t.key!=='sickle.basic'||![t.x,t.y,t.scale,t.rotation].every(Number.isFinite))throw Error('Invalid sickle');}
    return {count,tool:SICKLE_TOOLS['sickle.basic'],image:SICKLE_TOOL_URLS['sickle.basic']};
  });
  const data=await page.evaluate(()=>document.getElementById('game').toDataURL('image/png'));
  fs.writeFileSync(path.join(out,'contact-sheet.png'),Buffer.from(data.split(',')[1],'base64'));
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,errors},null,2));
  console.log('Sickle art rendered: '+report.count+' body/direction/carry/ready/impact frames');
  await context.close();
}finally{await browser.close();}
