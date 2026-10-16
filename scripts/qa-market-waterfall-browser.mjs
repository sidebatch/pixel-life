import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/';
const out=path.resolve(process.argv[2]||'output/market-waterfall-v1/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base);await page.waitForFunction(()=>!document.getElementById('startupLoading'));
  await page.evaluate(()=>{
   enterWorldRegion({to:'lilacVillage',entry:{x:25,y:23,face:'up'}});GAME_STATE.progression.coins=1000000;
   Object.assign(GAME_STATE.progression.fishing,lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',65)));
   window.qaSoundEvents=[];window.qaSoundOriginals={};
   for(const name of ['playCoinSpendSound','playEquipmentPurchaseSound','playEquipmentRepairSound']){
    qaSoundOriginals[name]=window[name];window[name]=(...args)=>{qaSoundEvents.push([name,...args]);return qaSoundOriginals[name](...args);};
   }
  });
  const shop=async(shop,view)=>page.evaluate(({shop,view})=>{
   if(isMarketOpen())closeMarket({fromHistory:true});openMarket({shop,fromHistory:true});marketState.view=view;renderMarket();
  },{shop,view});
  const receipt=async(selector,event)=>{
   const before=await page.evaluate(()=>{qaSoundEvents=[];window.qaSave=saveGame;saveGame=()=>false;
    return JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,appearance:GAME_STATE.appearance});});
   await page.locator(selector).tap();
   const failed=await page.evaluate(()=>{saveGame=qaSave;delete window.qaSave;return {events:qaSoundEvents,
    data:JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,appearance:GAME_STATE.appearance})};});
   assert.equal(failed.data,before);assert.deepEqual(failed.events,[]);
   await page.locator(selector).tap();assert.deepEqual(await page.evaluate(()=>qaSoundEvents),[event]);
  };
  await shop('elli','rods');
  const rod=await page.evaluate(()=>{
   const rod=FISHING_RODS[1];for(const [id,n] of Object.entries(rod.fishCost)){
    const fish=SAVE_FISH_BY_ID.get(id);GAME_STATE.inventory.push({type:'fish',id,name:fish.name,quantity:n,price:fish.basePrice,sizeCm:fish.minSizeCm});
   }
   renderMarket();return rod.id;
  });
  await receipt(`[data-rod-id="${rod}"]`,['playEquipmentPurchaseSound','rod']);
  await page.evaluate(id=>{GAME_STATE.progression.fishing.durabilityByRodId[id]=0;renderMarket();},rod);
  await receipt(`[data-repair-rod-id="${rod}"]`,['playEquipmentRepairSound','rod']);
  assert.equal(await page.locator(`[data-repair-rod-id="${rod}"]`).count(),0);
  await shop('workshop','axes');
  const axe=await page.evaluate(()=>{const axe=FORESTRY_AXES[1];
   for(const [id,n] of Object.entries(axe.materials))addLifeItem('material',id,n);renderMarket();return axe.id;
  });
  await receipt(`[data-axe-id="${axe}"]`,['playEquipmentPurchaseSound','axe']);
  await page.evaluate(id=>{GAME_STATE.progression.forestry.durabilityByAxeId[id]=0;renderMarket();},axe);
  await receipt(`[data-repair-axe-id="${axe}"]`,['playEquipmentRepairSound','axe']);
  assert.equal(await page.locator(`[data-repair-axe-id="${axe}"]`).count(),0);
  await receipt('[data-buy-return-item]',['playCoinSpendSound']);
  await shop('haru','seeds');await receipt('[data-seed-id="carrot"]',['playCoinSpendSound']);
  await page.evaluate(()=>{GAME_STATE.progression.coins=0;qaSoundEvents=[];renderMarket();document.querySelector('[data-seed-id="carrot"]').click();});
  assert.deepEqual(await page.evaluate(()=>qaSoundEvents),[]);
  await page.evaluate(()=>{
   closeMarket({fromHistory:true});enterWorldRegion({to:'coast',entry:VOYAGE_HARBOR_ENTRY},{skipSave:true});
   GAME_STATE.progression.coins=1000000;openHarbor({fromHistory:true});
  });
  await receipt('[data-ticket-buy="shallow"][data-quantity="1"]',['playCoinSpendSound']);
  await page.evaluate(()=>closeHarbor({fromHistory:true}));
  const audio=await page.evaluate(async()=>{
   const cases=[['playCoinSpendSound'],['playEquipmentPurchaseSound','axe'],['playEquipmentPurchaseSound','rod'],
    ['playEquipmentRepairSound','axe'],['playEquipmentRepairSound','rod']],rows=[];
   for(const [name,kind] of cases){
    const offline=new OfflineAudioContext(1,26460,44100),original=playFishingAudio;
    playFishingAudio=fn=>{fn(offline);return true;};try{qaSoundOriginals[name](kind);}finally{playFishingAudio=original;}
    const buffer=await offline.startRendering(),samples=buffer.getChannelData(0);let peak=0,energy=0,tail=0;
    for(let i=0;i<samples.length;i++){const n=samples[i];peak=Math.max(peak,Math.abs(n));energy+=n*n;if(i>22050)tail+=n*n;}
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',samples.buffer)),n=>n.toString(16).padStart(2,'0')).join('');
    rows.push({name,kind,rms:Math.sqrt(energy/samples.length),peak,tail,hash});
   }return rows;
  });
  assert(audio.every(a=>a.rms>.001&&a.peak<.8&&a.tail<.001));assert.equal(new Set(audio.map(a=>a.hash)).size,5);
  await page.evaluate(()=>{
   closeMarket({fromHistory:true});enterWorldRegion({to:'waterfallValley',entry:{x:36,y:22,face:'down'}},{skipSave:true});
   worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
   const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();
  });
  await page.screenshot({path:path.join(out,'waterfall-'+width+'.png')});
  const frameCheck=async()=>page.evaluate(()=>{
   const fall=WORLD_DEFINITION.terrain.waterfalls[0],old={camX,camY,tNow};
   camX=fall.x*TILE-(VIEW_W-fall.w*TILE)/2;camY=fall.y*TILE-140;
   const x=Math.round(fall.x*TILE-camX),y=Math.round(fall.y*TILE-camY),w=fall.w*TILE,h=fall.h*TILE;
   const data=JSON.stringify(GAME_STATE),blockedBefore=[...blocked].sort().join('|');
   const frame=t=>{tNow=t;ctx.clearRect(0,0,VIEW_W,VIEW_H);drawForestWaterfalls(WORLD_DEFINITION.terrain);return ctx.getImageData(x,y,w,h).data;};
   const a=frame(0),b=frame(230);let changed=0,cliffChanged=0;
   for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3]){
    changed++;const px=(i/4)%w,py=Math.floor(i/4/w);
    if(py<h*.79&&(px<w*.35||px>w*.69))cliffChanged++;
   }
   const unchanged=data===JSON.stringify(GAME_STATE)&&blockedBefore===[...blocked].sort().join('|');
   camX=old.camX;camY=old.camY;tNow=old.tNow;drawWorld();return {changed,cliffChanged,unchanged};
  });
  const moving=await frameCheck();assert(moving.changed>1000&&moving.cliffChanged===0&&moving.unchanged);
  await page.emulateMedia({reducedMotion:'reduce'});const reduced=await frameCheck();assert.equal(reduced.changed,0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const perf=await page.evaluate(()=>{const times=[];for(let i=0;i<60;i++){const start=performance.now();drawWorld();times.push(performance.now()-start);}return times.sort((a,b)=>a-b)[30];});
  assert(perf<50);reports.push({width,exactOnceAndSilentFailedSave:true,emptyFundsSilent:true,audio,moving,reduced,medianFrameMs:perf});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2));
 console.log('Market/waterfall passed: 393/320px real buy/repair receipts, failed-save silence, five distinct rendered sound waves, moving water/static cliffs, reduced motion, unchanged state and collision.');
}finally{await browser.close();}
