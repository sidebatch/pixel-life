// Gate real image completions to inspect 0%, partial progress and final readiness.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html';
const output=path.resolve(process.argv[2]||'output/startup-ui-qa');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const reports=[],errors=[];
async function pageFor(width,fail=false){
 const context=await browser.newContext({viewport:{width,height:width===320?568:780}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({fail})=>{
   const NativeImage=window.Image;window.qaImageQueue=[];window.qaProgress=[];let first=true;
   window.Image=function(...args){const image=new NativeImage(...args),reject=fail&&first;first=false;
     Object.defineProperty(image,'onload',{set(fn){image.addEventListener('load',()=>window.qaImageQueue.push(()=>
       reject?image.onerror(new Event('error')):fn.call(image)));}});return image;};
   window.Image.prototype=NativeImage.prototype;
   document.addEventListener('DOMContentLoaded',()=>{
     const progress=document.getElementById('startupProgress');
     window.qaProgress.push(Number(progress.getAttribute('aria-valuenow')));
     new MutationObserver(()=>window.qaProgress.push(Number(progress.getAttribute('aria-valuenow'))))
       .observe(progress,{attributes:true,attributeFilter:['aria-valuenow']});
   });
 },{fail});
 await page.goto(base);await page.waitForFunction(()=>window.qaImageQueue.length>100);
 return {page,context};
}
try{
 for(const width of [393,320]){
  const {page,context}=await pageFor(width);
  assert.equal(await page.locator('#startupPercent').textContent(),'0%');
  assert.equal(await page.locator('#startupError').isVisible(),false);
  assert.equal(await page.locator('#startupLoading').innerText(),'게임 준비 중\n0%');
  await page.screenshot({path:path.join(output,width+'-loading-zero.png')});
  await page.evaluate(()=>window.qaImageQueue.splice(0,Math.floor(window.qaImageQueue.length/2)).forEach(done=>done()));
  await page.waitForFunction(()=>Number(document.getElementById('startupProgress').getAttribute('aria-valuenow'))>0);
  const partial=await page.evaluate(()=>({value:Number(document.getElementById('startupProgress').getAttribute('aria-valuenow')),
    fill:document.getElementById('startupProgressFill').style.width}));
  assert(partial.value<100);assert.equal(partial.fill,partial.value+'%');
  await page.screenshot({path:path.join(output,width+'-loading-partial.png')});
  for(let turn=0;turn<20;turn++){
    await page.evaluate(()=>window.qaImageQueue.splice(0).forEach(done=>done()));
    if(await page.evaluate(()=>window.qaProgress.includes(100)))break;
    await page.waitForFunction(()=>window.qaImageQueue.length>0||window.qaProgress.includes(100));
  }
  await page.waitForFunction(()=>!document.getElementById('startupLoading'));
  const progress=await page.evaluate(()=>window.qaProgress);
  assert.equal(progress[0],0);assert.equal(progress.at(-1),100);
  assert(progress.every((p,i)=>p>=0&&p<=100&&(!i||p>=progress[i-1])));
  await page.locator('#menuBtn').click();
  assert.equal(await page.locator('#openTreeDexBtn').innerText(),'나무 도감');
  const cursors=await page.evaluate(()=>{
    const wrong=[...document.querySelectorAll('#gameShell button')].filter(button=>
      getComputedStyle(button).cursor!==(button.disabled||button.getAttribute('aria-disabled')==='true'?'default':'pointer'))
      .map(button=>button.id||button.className);
    const button=document.getElementById('openTreeDexBtn');button.disabled=true;
    const disabled=getComputedStyle(button).cursor;button.disabled=false;
    return {wrong,disabled,copy:getComputedStyle(button.querySelector('b')).cursor};
  });assert.deepEqual(cursors,{wrong:[],disabled:'default',copy:'pointer'});
  await page.screenshot({path:path.join(output,width+'-menu.png')});
  reports.push({width,partial,progress,cursors});await context.close();
 }
 const {page,context}=await pageFor(393,true);
 await page.evaluate(()=>window.qaImageQueue.shift()());
 await page.waitForFunction(()=>!document.getElementById('startupError').hidden);
 await page.evaluate(()=>window.qaImageQueue.splice(0).forEach(done=>done()));
 assert.equal(await page.locator('#startupPercent').textContent(),'0%');
 assert.equal(await page.locator('#startupLoading b').innerText(),'게임을 준비하지 못했어요');
 assert(await page.locator('#startupError').isVisible());assert(!await page.locator('#startupLoading').evaluate(e=>e.classList.contains('ready')));
 await page.screenshot({path:path.join(output,'loading-error.png')});await context.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(reports,null,2));
 console.log('Startup UI browser QA passed: 0/partial/100%, failure freeze, clean menu, enabled/disabled hand cursors at 393 and 320px');
}finally{await browser.close();}
