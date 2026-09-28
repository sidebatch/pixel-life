// Trial-only Ria alignment must not change the normal game, other views or saves.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/ria-neck-preview');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const errors=[],page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
  await page.goto(base+'?ria-neck-preview&character-preview&character=female&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterRiaNeckHeads.femaleFishHair&&document.querySelector('[aria-label="리아 목 위치 비교"]'));
  await page.evaluate(()=>{
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();
  });
  const first=await page.evaluate(()=>{
    const before=JSON.stringify(createSaveData().state),store=JSON.stringify({...localStorage});
    if(!CHARACTER_RIA_NECK_PREVIEW_ENABLED||characterRiaNeckPreview!=='centered'||characterBodyPreview!=='female')
      throw Error('Ria centered trial was not selected by default');
    const getData=image=>{
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const p=c.getContext('2d',{willReadFrequently:true});p.drawImage(image,0,0);return p.getImageData(0,0,c.width,c.height).data;
    };
    let atlases=0,changed=0;
    for(const [key,{original,centered}] of Object.entries(characterRiaNeckHeads)){
      if(!(original.src?.includes('/npc-ria-v3/')||original.src?.startsWith('data:image/png'))||
        characterLayerImgs[key]!==centered||
        original.width!==centered.width||original.height!==centered.height)throw Error(`Wrong trial atlas ${key}`);
      const a=getData(original),b=getData(centered),width=original.width;
      for(let y=0;y<original.height;y++)for(let x=0;x<width;x++){
        const target=(y*width+x)*4,frame=Math.floor(x/96),local=x%96;
        const source=(y*width+(y<96&&local>=2?frame*96+local-2:x))*4;
        for(let c=0;c<4;c++){
          const expected=y<96&&local<2?0:a[source+c];
          if(b[target+c]!==expected)throw Error(`${key}: wrong pixel at ${x},${y}`);
          if(a[target+c]!==b[target+c])changed++;
        }
      }
      atlases++;
    }
    if(atlases!==6||changed<100)throw Error('Ria trial did not shift all six head/hair atlases');
    if(JSON.stringify(createSaveData().state)!==before||JSON.stringify({...localStorage})!==store)
      throw Error('Preview setup changed game progress');
    return {atlases,changed,before,store};
  });
  await page.screenshot({path:path.join(output,'centered-mobile.png')});
  await page.getByRole('button',{name:'현재',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'현재',exact:true}).getAttribute('aria-pressed'),'true');
  assert(await page.evaluate(()=>Object.entries(characterRiaNeckHeads).every(([key,v])=>characterLayerImgs[key]===v.original)));
  await page.screenshot({path:path.join(output,'original-mobile.png')});
  await page.getByRole('button',{name:'목 중앙 보정',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'목 중앙 보정',exact:true}).getAttribute('aria-pressed'),'true');
  const after=await page.evaluate(()=>({state:JSON.stringify(createSaveData().state),store:JSON.stringify({...localStorage}),
    centered:Object.entries(characterRiaNeckHeads).every(([key,v])=>characterLayerImgs[key]===v.centered)}));
  assert.equal(after.centered,true);assert.equal(after.state,first.before);assert.equal(after.store,first.store);
  const normal=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  normal.on('pageerror',error=>errors.push(error.message));
  await normal.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await normal.goto(base+'?character-preview&character=female&time=12:00&weather=clear');
  await normal.waitForFunction(()=>characterLayerImgs.femaleFishHair&&document.querySelector('[aria-label="캐릭터 동작 비교"]'));
  const unaltered=await normal.evaluate(()=>!CHARACTER_RIA_NECK_PREVIEW_ENABLED&&
    !document.querySelector('[aria-label="리아 목 위치 비교"]')&&
    Object.keys(characterRiaNeckHeads).length===0&&
    (characterLayerImgs.femaleWalkHead.src.includes('/character-baseline-v2/')||
      characterLayerImgs.femaleWalkHead.src.startsWith('data:image/png')));
  assert.equal(unaltered,true);assert.deepEqual(errors,[]);
  console.log(`PASS: archived Ria neck comparison shifted ${first.atlases} atlases front-only, mobile buttons/save and promoted normal art unchanged.`);
}finally{await browser.close();}
