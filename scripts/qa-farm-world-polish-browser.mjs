import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/dist/index.html',out=path.resolve(process.argv[2]||'output/farm-world-polish-v2/browser');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
  for(const [width,height] of [[393,780],[320,568]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    const forests=await page.evaluate(()=>Object.keys(FOREST_REGION_SPECIES));assert.equal(forests.length,12);
    const forestReports=[];
    for(const id of forests){
      const row=await page.evaluate(id=>{
        enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn});worldTime.minutes=720;weatherState.kind='clear';
        const original=ctx.roundRect;let plazas=0;ctx.roundRect=function(...args){plazas++;return original.apply(this,args);};
        const before=JSON.stringify({world:GAME_STATE.world,trees:trees.map(t=>[t.id,t.x,t.y,t.species])});
        try{drawNaturalPlazas(WORLD_DEFINITION.terrain||{});}finally{ctx.roundRect=original;}
        const areas=WORLD_DEFINITION.stoneAreas||[];
        const plainGround=areas.every(a=>Array.from({length:a.w},(_,dx)=>Array.from({length:a.h},(_,dy)=>tileTypeAt(a.x+dx,a.y+dy)!=='stone').every(Boolean)).every(Boolean));
        const area=areas[0];if(area){player.x=area.x+Math.floor(area.w/2);player.y=area.y+Math.floor(area.h/2);player.px=player.x*TILE+24;player.py=player.y*TILE+24;}
        const c=getWorldCameraTarget();camX=c.x;camY=c.y;drawWorld();
        return {id,plazas,plainGround,unchanged:before===JSON.stringify({world:GAME_STATE.world,trees:trees.map(t=>[t.id,t.x,t.y,t.species])}),trees:trees.length};
      },id);assert(row.plazas===0&&row.plainGround&&row.unchanged);forestReports.push(row);
      if(['forestTen','forestEleven'].includes(id))await page.screenshot({path:path.join(out,id+'-'+width+'.png')});
    }
    const village=await page.evaluate(()=>{
      enterWorldRegion({to:'lilacVillage',entry:{x:57,y:24,face:'up'}});const house=buildings.find(b=>b.id==='farm_supply_cottage'),haru=npcs.find(n=>n.id==='haru');
      const seen=new Set(),q=[WORLD_DEFINITION.playerSpawn];for(let i=0;i<q.length;i++){const p=q[i],k=key(p.x,p.y);if(seen.has(k)||blocked.has(k)||!inside(p.x,p.y))continue;seen.add(k);for(const [dx,dy] of Object.values(dirVec))q.push({x:p.x+dx,y:p.y+dy});}
      const c=getWorldCameraTarget();camX=c.x;camY=c.y;drawWorld();
      return {house:[house.x,house.y],haru:[haru.x,haru.y],scale:haru.scale,art:npcImgs.haru.src===NPC_SHEET_URLS.haru&&npcImgs.haru.naturalWidth===288&&npcImgs.haru.naturalHeight===384,
        door:seen.has(key(56,23)),shop:seen.has(key(57,24)),farmExit:seen.has(key(62,24)),allDoors:buildings.every(b=>seen.has(key(b.entrance.approach.x,b.entrance.approach.y))),interaction:resolveWorldInteraction().kind};
    });assert.deepEqual(village.house,[54,19]);assert.deepEqual(village.haru,[57,23]);assert(village.scale===1&&village.art&&village.door&&village.shop&&village.farmExit&&village.allDoors&&village.interaction==='farmMarket');
    await page.screenshot({path:path.join(out,'village-haru-'+width+'.png')});await page.locator('#btnA').tap();await page.waitForFunction(()=>isMarketOpen()&&marketState.shop==='haru');
    assert.equal(await page.locator('[data-seed-id]').count(),14);await page.locator('#marketClose').tap();await page.waitForFunction(()=>!isMarketOpen()&&!window.history.state?.pixelLifeOverlay);
    await page.evaluate(()=>{
      enterWorldRegion({to:'sunnyFields',entry:{x:14,y:22,face:'right'}});
      globalThis.originalHarvestSound=playFarmHarvestSound;globalThis.harvestSounds=[];
      playFarmHarvestSound=()=>{const result=originalHarvestSound();harvestSounds.push(result);return result;};
      GAME_STATE.world.plots.farm_01={unlocked:true,cropId:'turnip',plantedAt:Date.now()};
    });assert(await page.evaluate(()=>!buildings.some(b=>b.id==='farm_supply_cottage')&&!npcs.some(n=>n.id==='haru')));
    await page.locator('#btnA').tap();await page.waitForFunction(()=>isFarmPlotOpen());
    assert.equal(await page.locator('#lifeTitle').innerText(),'비트');assert.equal(await page.locator('#lifeTitle img').count(),1);
    const cropIds=await page.evaluate(()=>LIFE_CONTENT.crops.map(c=>c.id));
    for(const id of cropIds){
      const art=await page.evaluate(id=>{
        const crop=LIFE_CROP_BY_ID.get(id);GAME_STATE.world.plots.farm_01={unlocked:true,cropId:id,plantedAt:Date.now()};renderLifePanel();
        const title=document.getElementById('lifeTitle'),img=title.querySelector('img');
        return {name:title.textContent,expectedName:crop.name,src:img.getAttribute('src'),expectedSrc:LIFE_ITEM_URLS[id+'Crop']};
      },id);assert.equal(art.name,art.expectedName);assert.equal(art.src,art.expectedSrc);
    }
    await page.evaluate(()=>{GAME_STATE.world.plots.farm_01={unlocked:true,cropId:'turnip',plantedAt:Date.now()};renderLifePanel();});
    await page.screenshot({path:path.join(out,'growing-beet-'+width+'.png')});assert.equal(await page.evaluate(()=>harvestSounds.length),0);
    await page.evaluate(()=>{GAME_STATE.world.plots.farm_01={unlocked:true,cropId:null,plantedAt:null};renderLifePanel();});assert.equal(await page.locator('#lifeTitle img').count(),0);
    await page.evaluate(()=>{GAME_STATE.world.plots.farm_01={unlocked:true,cropId:'turnip',plantedAt:Date.now()-LIFE_CROP_BY_ID.get('turnip').growMs-1};GAME_STATE.appearance.activeTool='sickle';renderLifePanel();});
    await page.locator('#lifeExit').tap();await page.waitForFunction(()=>!isFarmPlotOpen()&&!window.history.state?.pixelLifeOverlay);
    const before=await page.evaluate(()=>({quantity:lifeItemCount('crop','turnip'),xp:GAME_STATE.progression.farming.totalXp}));
    await page.locator('#btnA').tap();await page.waitForFunction(()=>getFarmPlotPhase(farmPlotAt(15,22))==='EMPTY'&&!isChoppingTree());
    const harvested=await page.evaluate(()=>({quantity:lifeItemCount('crop','turnip'),xp:GAME_STATE.progression.farming.totalXp,sounds:harvestSounds}));assert(harvested.quantity>before.quantity&&harvested.xp>before.xp);assert.deepEqual(harvested.sounds,[true]);
    const rollback=await page.evaluate(()=>{
      GAME_STATE.world.plots.farm_01={unlocked:true,cropId:'turnip',plantedAt:Date.now()-LIFE_CROP_BY_ID.get('turnip').growMs-1};
      const before=JSON.stringify({world:GAME_STATE.world,inventory:GAME_STATE.inventory,farming:GAME_STATE.progression.farming}),original=saveGame;
      saveGame=()=>false;let result;try{result=harvestFarmCrop(farmPlotAt(15,22));}finally{saveGame=original;}
      return !result&&harvestSounds.length===1&&before===JSON.stringify({world:GAME_STATE.world,inventory:GAME_STATE.inventory,farming:GAME_STATE.progression.farming});
    });assert(rollback);
    const audio=await page.evaluate(async()=>{
      const offline=new OfflineAudioContext(1,Math.ceil(44100*.25),44100),original=playFishingAudio;
      playFishingAudio=fn=>{fn(offline);return true;};try{originalHarvestSound();}finally{playFishingAudio=original;}
      const buffer=await offline.startRendering(),samples=buffer.getChannelData(0);let energy=0,peak=0;for(const n of samples){energy+=n*n;peak=Math.max(peak,Math.abs(n));}
      return {seconds:buffer.duration,rms:Math.sqrt(energy/samples.length),peak};
    });assert(audio.rms>.001&&audio.peak<.8);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    reports.push({width,height,forests:forestReports,village,cropImages:cropIds.length,harvestSoundOnce:true,failedSaveSilent:rollback,audio});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2)+'\n');
  console.log('Farm/world polish passed: twelve forests without plaza overlays, preserved resources, relocated village shop and all doors/exits, fourteen growing crop images, exact one harvest sound, silent rollback and real audio waveform at 393/320px.');
}finally{await browser.close();}
