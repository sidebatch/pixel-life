// Verify the actual published/compiled app cache and an offline boot in an isolated browser.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:48274/dist/index.html';
const out=path.resolve(process.argv[2]||'output/release-pwa-qa');fs.mkdirSync(out,{recursive:true});
const expectedCache=process.env.PIXEL_LIFE_EXPECTED_CACHE;
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
try{
  const context=await browser.newContext({viewport:{width:393,height:850},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>typeof huntingAttackContainsPlayer==='function'&&characterOutfitImgs['outfit.traveler']?.walk?.width>0,null,{timeout:60000});
  await page.waitForFunction(async expected=>{
    if(!navigator.serviceWorker.controller)return false;
    const names=(await caches.keys()).filter(name=>name.startsWith('pixel-life-'));
    if(expected&&!names.includes(expected))return false;
    for(const name of names)if((await (await caches.open(name)).keys()).length<7)return false;
    return names.length>0;
  },expectedCache||null,{timeout:90000,polling:200});
  const online=await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready,names=(await caches.keys()).filter(name=>name.startsWith('pixel-life-')),entries=[];
    for(const name of names)for(const request of await (await caches.open(name)).keys())entries.push(new URL(request.url).pathname);
    const manifestUrl=document.querySelector('link[rel="manifest"]').href,manifest=await fetch(manifestUrl).then(r=>r.json());
    return {controlled:!!navigator.serviceWorker.controller,scope:registration.scope,names,entries,manifest};
  });
  assert.equal(online.names.length,1);if(expectedCache)assert.equal(online.names[0],expectedCache);
  const scope=new URL('./',base),expected=['index.html','manifest.webmanifest','assets/pwa/icon-192.png','assets/pwa/icon-512.png','assets/audio/music/meadow.mp3','assets/audio/music/woodland.mp3','assets/audio/music/lakeside.mp3'].map(file=>new URL(file,scope).pathname);
  for(const file of expected)assert(online.entries.includes(file),'Missing app cache: '+file);
  assert.equal(online.manifest.id,'./?app=pixel-life-v2');assert.equal(online.manifest.start_url,'./?source=pwa-v2');
  const cdp=await context.newCDPSession(page),appManifest=await cdp.send('Page.getAppManifest');assert.deepEqual(appManifest.errors||[],[]);
  let installabilityErrors=[];try{installabilityErrors=(await cdp.send('Page.getInstallabilityErrors')).installabilityErrors||[];}catch{}
  const marker=await page.evaluate(()=>{GAME_STATE.progression.coins=4321;saveGame();window.__releaseBoot=performance.now();navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));return __releaseBoot;});
  await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.__releaseBoot),marker,'Worker takeover must not reload a running game');
  await context.setOffline(true);await page.goto(new URL(online.manifest.start_url,scope).href,{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>typeof getDungeonStairVisual==='function'&&characterOutfitImgs['outfit.traveler']?.walk?.width>0,null,{timeout:60000});
  const offline=await page.evaluate(async()=>{
    const audio=[];for(const track of ['meadow','woodland','lakeside']){
      const response=await fetch('./assets/audio/music/'+track+'.mp3?retry=release',{headers:{Range:'bytes=0-99'}});
      audio.push({track,status:response.status,bytes:(await response.arrayBuffer()).byteLength});
    }
    return {title:document.title,controlled:!!navigator.serviceWorker.controller,coins:GAME_STATE.progression.coins,
      regions:DUNGEON_REGIONS.length,species:DUNGEON_REGIONS.reduce((sum,r)=>sum+r.monsters.length,0),
      swords:SWORDS.map(s=>s.name),newRules:typeof huntingAttackContainsPlayer==='function'&&typeof cancelHuntingSwingForMovement==='function',audio};
  });
  assert.equal(offline.title,'Pixel Life');assert(offline.controlled&&offline.newRules);assert.equal(offline.coins,4321);assert.equal(offline.regions,10);assert.equal(offline.species,60);
  assert(offline.swords.includes('목검')&&offline.swords.includes('브락의 검'));assert(offline.audio.every(a=>a.status===206&&a.bytes===100));assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,online,noForcedReload:true,offline,installabilityErrors,errors},null,2));
  console.log('Release PWA passed: current cache, seven app files, manifest, no forced reload, saved state/offline boot and all three music ranges. Installability: '+JSON.stringify(installabilityErrors));
  await context.close();
}finally{await browser.close();}
