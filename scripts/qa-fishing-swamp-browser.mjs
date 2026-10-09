import {acknowledgeFishRewardCards} from './lib/fish-reward-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/fishing-swamp-qa');
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
    if(!enterWorldRegion(REGION_EXITS.oldForest.find(e=>e.to==='mountainLake')))return false;
    if(!enterWorldRegion(REGION_EXITS.mountainLake.find(e=>e.to==='waterfallValley')))return false;
    GAME_STATE.appearance.activeTool='rod';
    return enterWorldRegion(REGION_EXITS.waterfallValley.find(e=>e.to==='reedSwamp'));
  });
  assert.ok(entered);
  const place=async(x,y,face)=>page.evaluate(({x,y,face})=>{
    player.x=x;player.y=y;player.face=face;player.px=x*TILE+TILE/2;player.py=y*TILE+TILE/2;
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
    worldTime.minutes=12*60;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
    updateWorldClockUI();drawWorld();
  },{x,y,face});
  await place(29,24,'left');
  assert.deepEqual(await page.evaluate(()=>({
    region:GAME_STATE.regionId,name:document.getElementById('locationName').textContent,
    habitat:getFishingSpotInFront()?.fishingHabitat,walkable:!blocked.has(key(player.x,player.y)),music:REGION_MUSIC_TRACKS.reedSwamp
  })),{region:'reedSwamp',name:'그늘 갈대 늪',habitat:'swamp',walkable:true,music:'woodland'});
  await page.screenshot({path:path.join(output,'393-swamp-bank-day.png')});
  await page.locator('#btnA').tap();
  const swampCast=await page.evaluate(()=>({habitat:fishingState.context?.habitat,
    ids:getEligibleFishPool(fishingState.context).map(f=>f.id)}));
  assert.equal(swampCast.habitat,'swamp');
  assert.ok(swampCast.ids.includes('fish.swamp_eel')&&!swampCast.ids.includes('fish.minnow'));
  await page.locator('#fishingCancelBtn').tap();
  await page.waitForFunction(()=>fishingState.phase==='idle');
  await page.evaluate(()=>{worldTime.minutes=22*60;updateWorldClockUI();drawWorld();});
  await page.screenshot({path:path.join(output,'393-swamp-bank-night.png')});
  await place(33,40,'left');
  await page.evaluate(()=>{GAME_STATE.appearance.activeTool='rod';});
  const boardwalk=await page.evaluate(()=>({kind:resolveWorldInteraction()?.kind,spot:getFishingSpotInFront()?.spotId,boardwalk:bridgeSet.has('33,40')}));
  assert.deepEqual(boardwalk,{kind:'fishing',spot:'shade_swamp_deep',boardwalk:true});
  await page.screenshot({path:path.join(output,'393-swamp-boardwalk.png')});
  const ids=await page.evaluate(()=>FISH_DATA.filter(f=>f.habitat==='swamp').map(f=>f.id));
  const caught=[];
  for(const id of ids){
    await page.evaluate(id=>{
      const target=FISH_DATA.find(f=>f.id===id);
      worldTime.minutes={DAWN:5*60,DAY:12*60,DUSK:18*60+30,NIGHT:22*60}[target.periods?.[0]||'DAY'];
      weatherState.kind=target.weather?.[0]||'clear';weatherState.debugLocked=true;updateWorldClockUI();
      assertSwampStart();
      function assertSwampStart(){if(!startFishing())throw new Error('Cannot start swamp fishing: '+id);}
      updateFishing(320);updateFishing(7000);
      if(fishingState.phase!=='bite')throw new Error('Swamp casting did not reach a bite');
      const pool=getEligibleFishPool(fishingState.context),index=pool.findIndex(f=>f.id===id);
      if(index<0)throw new Error('Requested swamp fish is not eligible: '+id);
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
    if(id==='fish.swamp_king_eel')await page.screenshot({path:path.join(output,'393-swamp-king-eel-storm-result.png')});
    caught.push(result.id);
    await page.locator('#dialogNext').tap();await acknowledgeFishRewardCards(page);
    await page.waitForFunction(()=>fishingState.phase==='idle'&&!dialogOpen);
  }
  assert.equal(await page.evaluate(()=>saveGame()),true);
  await page.reload();
  await page.waitForFunction(()=>typeof GAME_STATE!=='undefined'&&GAME_STATE.regionId==='reedSwamp'&&!document.getElementById('startupLoading'));
  const restored=await page.evaluate(()=>({region:GAME_STATE.regionId,x:player.x,y:player.y,safe:!blocked.has(key(player.x,player.y)),
    ids:FISH_DATA.filter(f=>f.habitat==='swamp').filter(f=>GAME_STATE.collections.fish[f.id]?.count===1).map(f=>f.id),
    inventory:GAME_STATE.inventory.filter(f=>f.type==='fish'&&SAVE_FISH_BY_ID.get(f.id)?.habitat==='swamp').length}));
  assert.equal(restored.region,'reedSwamp');assert.equal(restored.x,33);assert.equal(restored.y,40);assert.ok(restored.safe);
  assert.deepEqual(restored.ids,ids);assert.equal(restored.inventory,7);
  await page.locator('#menuBtn').tap();await page.locator('#openFishDexBtn').tap();
  await page.locator('[data-fish-category="inland"]').tap();
  assert.equal(await page.evaluate(habitat=>FISH_DATA.filter(f=>f.habitat===habitat).filter(f=>document.querySelector('#fishDexGrid [data-fish-id="'+f.id+'"]')?.classList.contains('discovered')).length,'swamp'),7);
  await page.screenshot({path:path.join(output,'393-swamp-discovered-dex.png')});
  await page.setViewportSize({width:320,height:568});
  const overflow=await page.evaluate(()=>{
    const panel=document.getElementById('fishDexPanel').getBoundingClientRect();
    return [...document.querySelectorAll('#fishDexGrid [data-fish-id],#fishDexCategoryTabs button')].some(e=>{
      const box=e.getBoundingClientRect();return box.left<panel.left-1||box.right>panel.right+1;
    });
  });
  assert.equal(overflow,false);
  await page.screenshot({path:path.join(output,'320-swamp-discovered-dex.png')});
  await page.locator('#fishDexClose').tap();
  const returned=await page.evaluate(()=>{
    if(!enterWorldRegion(REGION_EXITS.reedSwamp.find(e=>e.to==='waterfallValley')))return false;
    if(blocked.has(key(player.x,player.y)))return false;
    if(!enterWorldRegion(REGION_EXITS.waterfallValley.find(e=>e.to==='mountainLake')))return false;
    if(!enterWorldRegion(REGION_EXITS.mountainLake.find(e=>e.to==='oldForest')))return false;
    if(blocked.has(key(player.x,player.y)))return false;
    return enterWorldRegion(REGION_EXITS.oldForest.find(e=>e.to==='lilacVillage'));
  });
  assert.ok(returned);
  assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'lilacVillage');
  assert.deepEqual(errors,[]);
  const report={caught,restored,boardwalk,swampCast,reciprocalTravel:true,viewports:['393x780','320x568'],browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Swamp browser QA passed: '+JSON.stringify(report));
}finally{await browser.close();}
