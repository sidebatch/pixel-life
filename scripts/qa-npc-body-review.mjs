import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const dir='assets/player/source/npc-body-v1';
const manifest=JSON.parse(fs.readFileSync(dir+'/review-manifest.json','utf8'));
assert.equal(manifest.runtimeChanged,false);
assert.equal(manifest.animationValidated,false);
for(const name of ['female','male','elli','jun']){
  const atlas=decodePNG(fs.readFileSync(`${dir}/${name}-idle-review.png`));
  assert.deepEqual([atlas.width,atlas.height],[96,384]);
  assert(atlas.data.some((value,index)=>index%4===3&&value===0),'Transparent margins required');
  for(let row=0;row<4;row++){
    const bounds=alphaBounds(crop(atlas,0,row*96,96,96));
    assert.equal(bounds.height,68,`${name} common height`);
    assert.equal(bounds.y+bounds.height-1,88,`${name} common baseline`);
    assert(bounds.x>0&&bounds.x+bounds.width<96,'No cell clipping');
  }
}
const raw=decodePNG(fs.readFileSync(dir+'/turnaround-generated.png'));
assert(raw.data.some((value,index)=>index%4===3&&value===0),'Source transparency');
for(const name of ['male','female']){
  const entries=manifest.measurements.filter(entry=>entry.name===name);
  assert.equal(entries.length,4);
  const heights=entries.map(entry=>entry.source.height);
  assert(Math.max(...heights)/Math.min(...heights)<1.12,'Full source sprites must have comparable heights; do not crop at arbitrary row boundaries');
  for(const entry of entries){
    assert(entry.source.pixels>2000,'Use the whole connected source sprite');
    assert(entry.source.y+entry.source.height<=raw.height,'Source feet inside image');
  }
}
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:1100,height:950}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(dir+'/review.html')).href);
  await page.waitForFunction(()=>window.reviewReady===true);
  const save=async name=>fs.writeFileSync(`${dir}/${name}.png`,Buffer.from(await page.locator('#review').evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]),'base64'));
  assert.equal(await page.evaluate(()=>window.reviewSize),100);
  await save('comparison-actual');
  await page.getByRole('button',{name:'3배 확대'}).click();
  assert.equal(await page.evaluate(()=>window.reviewSize),300);
  await save('comparison-large');
  await page.getByRole('button',{name:'발 기준선 보기'}).click();
  assert.equal(await page.locator('#guide').getAttribute('aria-pressed'),'true');
  await save('comparison-guides');
  await page.setViewportSize({width:393,height:780});
  await page.getByRole('button',{name:'게임 표시 크기'}).click();
  assert.equal(await page.evaluate(()=>window.reviewSize),100);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Phone width');
  assert(await page.locator('.scroll').evaluate(node=>node.scrollWidth>node.clientWidth),'Horizontal scroll');
  await page.screenshot({path:dir+'/review-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: all 16 views 68px tall, identical foot baseline, real transparency, 100px/3x/guide controls and 393px layout. Motion/wardrobe compatibility not yet tested.');
}finally{await browser.close();}
