// Preview-page QA, not an animation or production compatibility claim.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {decodePNG} from './lib/png.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const dir='assets/player/source/female-v1';
const manifest=JSON.parse(fs.readFileSync(dir+'/review-manifest.json','utf8'));
assert.equal(manifest.runtimeChanged,false);
assert.equal(manifest.animationValidated,false);
for(const name of ['female','male','elli','jun']){
  const atlas=decodePNG(fs.readFileSync(`${dir}/${name}-idle-review.png`));
  assert.deepEqual([atlas.width,atlas.height],[96,384]);
  assert(atlas.data.some((value,index)=>index%4===3&&value===0),'Transparent margins required');
}
const raw=decodePNG(fs.readFileSync(dir+'/turnaround-generated.png'));
assert(raw.data.some((value,index)=>index%4===3&&value===0),'Generated source must have real transparency');
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:1100,height:950}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(dir+'/review.html')).href);
  await page.waitForFunction(()=>window.reviewReady===true);
  assert.equal(await page.evaluate(()=>window.reviewSize),100);
  fs.writeFileSync(dir+'/comparison-actual.png',Buffer.from(await page.locator('#review').evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]),'base64'));
  await page.getByRole('button',{name:'3배 확대'}).click();
  assert.equal(await page.evaluate(()=>window.reviewSize),300);
  fs.writeFileSync(dir+'/comparison-large.png',Buffer.from(await page.locator('#review').evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]),'base64'));
  await page.setViewportSize({width:393,height:780});
  await page.getByRole('button',{name:'게임 표시 크기'}).click();
  assert.equal(await page.evaluate(()=>window.reviewSize),100);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Page must fit phone viewport');
  assert(await page.locator('.scroll').evaluate(node=>node.scrollWidth>node.clientWidth),'Comparison must allow horizontal scrolling on phones');
  await page.screenshot({path:dir+'/review-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: 4 transparent 96x384 atlases, generated transparency, common feet, actual/3x buttons, 393px layout; production unchanged. Animation/wardrobe compatibility not yet tested.');
}finally{await browser.close();}
