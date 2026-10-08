import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/fishing-mountain-lake-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  await page.goto(base);
  await page.waitForFunction(()=>typeof enterWorldRegion==='function'&&!document.getElementById('startupLoading'));
  const entered=await page.evaluate(()=>{
    if(!enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='oldForest')))return false;
    return enterWorldRegion(REGION_EXITS.oldForest.find(e=>e.to==='mountainLake'));
  });
  assert.ok(entered);
  const place=async(x,y,face)=>page.evaluate(({x,y,face})=>{
    player.x=x;player.y=y;player.face=face;player.px=x*TILE+TILE/2;player.py=y*TILE+TILE/2;
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
    worldTime.minutes=12*60;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
    updateWorldClockUI();drawWorld();
  },{x,y,face});
  await place(48,24,'left');
  assert.deepEqual(await page.evaluate(()=>({
    region:GAME_STATE.regionId,name:document.getElementById('locationName').textContent,
    habitat:getFishingSpotInFront()?.fishingHabitat,walkable:!blocked.has(key(player.x,player.y)),music:REGION_MUSIC_TRACKS.mountainLake
  })),{region:'mountainLake',name:'여명 산악 호수',habitat:'mountain_lake',walkable:true,music:'lakeside'});
  await page.screenshot({path:path.join(output,'393-lake-east-shore.png')});
  await place(18,14,'down');
  await page.screenshot({path:path.join(output,'393-lake-ridge.png')});
  await place(31,30,'right');
  await page.evaluate(()=>{GAME_STATE.appearance.activeTool='rod';});
  const pier=await page.evaluate(()=>({kind:resolveWorldInteraction()?.kind,spot:getFishingSpotInFront()?.spotId,pier:bridgeSet.has('31,30')}));
  assert.deepEqual(pier,{kind:'fishing',spot:'dawn_lake_main',pier:true});
  await page.screenshot({path:path.join(output,'393-lake-pier.png')});
  const ids=await page.evaluate(()=>FISH_DATA.filter(f=>f.habitat==='mountain_lake').map(f=>f.id));
  const caught=[];
  for(const id of ids){
    await page.evaluate(id=>{
      const target=FISH_DATA.find(f=>f.id===id);
      worldTime.minutes=target.periods?.[0]==='DAWN'?5*60:12*60;
      assertLakeStart();
      function assertLakeStart(){if(!startFishing())throw new Error('Cannot start lake fishing: '+id);}
      updateFishing(320);updateFishing(7000);
      if(fishingState.phase!=='bite')throw new Error('Lake casting did not reach a bite');
      const pool=getEligibleFishPool(fishingState.context),index=pool.findIndex(f=>f.id===id);
      if(index<0)throw new Error('Requested lake fish is not eligible: '+id);
      const total=pool.reduce((sum,f)=>sum+getEffectiveFishWeight(f),0);
      const roll=(pool.slice(0,index).reduce((sum,f)=>sum+getEffectiveFishWeight(f),0)+getEffectiveFishWeight(pool[index])/2)/total;
      globalThis.qaOriginalRandom=Math.random;Math.random=()=>roll;
    },id);
    await page.locator('#btnA').tap();
    const result=await page.evaluate(()=>{
      Math.random=globalThis.qaOriginalRandom;
      const r=fishingState.result,image=document.querySelector('.fishingResultFish');
      return {id:r?.fishId,phase:fishingState.phase,inventory:GAME_STATE.inventory.some(f=>f.id===r?.fishId),
        count:GAME_STATE.collections.fish[r?.fishId]?.count,image:!!image,src:image?.getAttribute('src')};
    });
    assert.equal(result.id,id);assert.equal(result.phase,'result');assert.ok(result.inventory&&result.image);assert.equal(result.count,1);
    await page.waitForFunction(()=>document.querySelector('.fishingResultFish')?.complete&&document.querySelector('.fishingResultFish')?.naturalWidth>0);
    if(id==='fish.aurora_trout')await page.screenshot({path:path.join(output,'393-aurora-trout-result.png')});
    caught.push(result.id);
    await page.locator('#dialogNext').tap();
    await page.waitForFunction(()=>fishingState.phase==='idle'&&!dialogOpen);
  }
  assert.equal(await page.evaluate(()=>saveGame()),true);
  await page.reload();
  await page.waitForFunction(()=>typeof GAME_STATE!=='undefined'&&GAME_STATE.regionId==='mountainLake'&&!document.getElementById('startupLoading'));
  const restored=await page.evaluate(()=>({region:GAME_STATE.regionId,x:player.x,y:player.y,safe:!blocked.has(key(player.x,player.y)),
    ids:FISH_DATA.filter(f=>f.habitat==='mountain_lake').filter(f=>GAME_STATE.collections.fish[f.id]?.count===1).map(f=>f.id),
    inventory:GAME_STATE.inventory.filter(f=>f.type==='fish'&&SAVE_FISH_BY_ID.get(f.id)?.habitat==='mountain_lake').length}));
  assert.equal(restored.region,'mountainLake');assert.equal(restored.x,31);assert.equal(restored.y,30);assert.ok(restored.safe);
  assert.deepEqual(restored.ids,ids);assert.equal(restored.inventory,7);
  await page.locator('#menuBtn').tap();await page.locator('#openFishDexBtn').tap();
  await page.locator('[data-fish-category="inland"]').tap();await page.locator('[data-fish-habitat="mountain_lake"]').tap();
  assert.equal(await page.locator('#fishDexGrid .fishDexCard.discovered').count(),7);
  await page.screenshot({path:path.join(output,'393-lake-discovered-dex.png')});
  await page.setViewportSize({width:320,height:568});
  const overflow=await page.evaluate(()=>{
    const panel=document.getElementById('fishDexPanel').getBoundingClientRect();
    return [...document.querySelectorAll('#fishDexGrid [data-fish-id],#fishDexHabitatTabs button')].some(e=>{
      const box=e.getBoundingClientRect();return box.left<panel.left-1||box.right>panel.right+1;
    });
  });
  assert.equal(overflow,false);
  await page.screenshot({path:path.join(output,'320-lake-discovered-dex.png')});
  await page.locator('#fishDexClose').tap();
  const returned=await page.evaluate(()=>{
    if(!enterWorldRegion(REGION_EXITS.mountainLake.find(e=>e.to==='oldForest')))return false;
    if(blocked.has(key(player.x,player.y)))return false;
    return enterWorldRegion(REGION_EXITS.oldForest.find(e=>e.to==='lilacVillage'));
  });
  assert.ok(returned);
  assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'lilacVillage');
  assert.deepEqual(errors,[]);
  const report={caught,restored,pier,reciprocalTravel:true,viewports:['393x780','320x568'],browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Mountain lake browser QA passed: '+JSON.stringify(report));
}finally{await browser.close();}
