import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/',out=path.resolve(process.argv[2]||'output/gameplay-feedback/rods');fs.mkdirSync(out,{recursive:true});
// Use the actual published renderer for the visual comparison, without editing
// the protected art, body geometry or the browser's current renderer.
const previous=execFileSync('git',['show','7222fed:src/character.js'],{encoding:'utf8'});
const oldDraw=previous.slice(previous.indexOf('function drawCharacterTool('),previous.indexOf('function drawCharacterActor('));
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[];
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
  const report=await page.evaluate(oldSource=>{
    clearMovement();worldTime.debugLocked=true;weatherState.debugLocked=true;weatherState.kind='clear';cancelSkillXpFeedback();
    const old=Function(`return (${oldSource})`)(),before=JSON.stringify(GAME_STATE),drawImage=ctx.drawImage.bind(ctx),rows=[],images=[];
    const savedWidth=canvas.width,savedHeight=canvas.height;
    canvas.width=canvas.height=192;ctx.imageSmoothingEnabled=false;
    for(const body of ['body.starter','body.female']){
      GAME_STATE.appearance.bodyId=body;GAME_STATE.appearance.hairId=body==='body.female'?'hair.female.brown':'hair.brown';
      for(const rod of FISHING_RODS){
        GAME_STATE.progression.fishing.equippedRodId=rod.id;GAME_STATE.progression.fishing.purchasedRodIds=FISHING_RODS.map(r=>r.id);GAME_STATE.progression.flags.masterRod=true;
        const pair=[];
        for(const face of ['down','right','left','up'])for(const pose of ['walk','fish'])for(let frame=0;frame<3;frame++){
          const transform=getCharacterToolTransform(96,110,{pose,face,frame,tool:'rod'}),tool=CHARACTER_RIG.tools[transform.key];
          let matrix;ctx.drawImage=(...args)=>{matrix=ctx.getTransform();drawImage(...args);};
          ctx.clearRect(0,0,192,192);drawCharacterTool(transform);ctx.drawImage=drawImage;
          const dx=tool.tip[0]-tool.grip[0],dy=tool.tip[1]-tool.grip[1];
          const tip={x:matrix.a*dx+matrix.c*dy+matrix.e,y:matrix.b*dx+matrix.d*dy+matrix.f};
          if(Math.hypot(tip.x-transform.tip.x,tip.y-transform.tip.y)>1e-4||Math.hypot(matrix.e-transform.x,matrix.f-transform.y)>1e-4)throw Error('Rod hand/tip moved '+JSON.stringify({id:rod.id,pose,face,frame,tip,expected:transform.tip,matrix}));
          if(Math.abs(Math.abs(matrix.a*matrix.d-matrix.b*matrix.c)-2*transform.scale**2)>1e-5)throw Error('Rod width not 2x');
          rows.push({body,rod:rod.id,pose,face,frame});
          if(face==='right'&&pose==='fish'&&frame===1){
            for(const renderer of [old,drawCharacterTool]){
              ctx.clearRect(0,0,192,192);const current=drawCharacterTool;drawCharacterTool=renderer;
              try{drawCharacterActor(96,110,{pose,face,frame,tool:'rod'});pair.push(canvas.toDataURL());}finally{drawCharacterTool=current;}
            }
          }
        }
        images.push({body,id:rod.id,name:rod.name,pair});
      }
    }
    const changed=JSON.parse(before);Object.keys(GAME_STATE).forEach(k=>GAME_STATE[k]=changed[k]);canvas.width=savedWidth;canvas.height=savedHeight;ctx.imageSmoothingEnabled=false;
    return {rows,images};
  },oldDraw);
  assert.equal(report.rows.length,480);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,checks:report.rows,errors},null,2)+'\n');
  const html=`<!doctype html><meta charset="utf-8"><title>낚싯대 두께 비교</title><style>body{background:#244e3d;color:#fff;font:15px system-ui;margin:20px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}article{background:#365f49;padding:8px;border-radius:8px}article b{display:block}img{width:50%;image-rendering:pixelated}small{display:block;color:#e2ead8}h2{font-size:18px}</style><h2>낚싯대 — 왼쪽 변경 전 / 오른쪽 변경 후</h2><div class="grid">${report.images.map(({body,name,pair})=>`<article><b>${name}</b><small>${body==='body.female'?'리아':'이안'}</small>${pair.map(url=>`<img src="${url}">`).join('')}</article>`).join('')}</div>`;
  fs.writeFileSync(path.join(out,'comparison.html'),html);const review=await browser.newPage({viewport:{width:1200,height:900}});await page.close();
  await review.setContent(html);await review.screenshot({path:path.join(out,'comparison.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log('Rod presentation passed: 10 rods × 2 characters × 4 directions × 6 walk/fishing frames; hand/tip/length fixed, width 2x; actual published/new renderer visual comparison.');
}finally{await browser.close();}
