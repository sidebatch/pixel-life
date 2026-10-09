import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',output=path.resolve(process.argv[2]||'output/ten-rod-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[];
const ready=page=>page.waitForFunction(()=>typeof purchaseFishingRod==='function'&&!document.getElementById('startupLoading'));
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base,{timeout:60000});await ready(page);
  await page.evaluate(()=>{
    GAME_STATE.progression.fishing={...lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',85)),
      equippedRodId:'rod.expert',purchasedRodIds:['rod.basic','rod.sturdy','rod.steel','rod.expert','rod.deepwater']};
    const legacy=createSaveData();delete legacy.state.progression.fishing.purchasedRodIds;
    localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(legacy));
  });
  await page.reload({timeout:60000});await ready(page);
  await page.evaluate(()=>{
    if(GAME_STATE.progression.fishing.purchasedRodIds.some(id=>FISHING_RODS.slice(6).some(r=>r.id===id)))
      throw Error('Legacy level gave free new rods');
    if(getEquippedFishingRod().id!=='rod.expert')throw Error('Legacy equipped rod changed');
    GAME_STATE.progression.flags.masterRod=true;GAME_STATE.appearance.activeTool='rod';
    GAME_STATE.progression.fishing.purchasedRodIds=FISHING_RODS.slice(0,6).filter(r=>!r.requiresMasterReward).map(r=>r.id);
    GAME_STATE.progression.fishing.equippedRodId='rod.deepwater';
    GAME_STATE.progression.coins=860123;
    GAME_STATE.inventory=FISHING_RODS.slice(6).flatMap(rod=>Object.entries(rod.fishCost).map(([id,quantity])=>{
      const fish=FISH_DATA.find(f=>f.id===id);return {type:'fish',id,name:fish.name,rarity:fish.rarity,sizeCm:fish.minSizeCm,price:fish.basePrice,quantity:quantity+2};
    }));
    globalThis.rodCollectionBefore=JSON.stringify(GAME_STATE.collections);
    openMarket();marketState.view='rods';renderMarket();
  });
  assert.equal(await page.locator('#marketList .marketEquipmentCard').count(),10);
  for(const id of ['rod.tidal','rod.tempest','rod.abyssal','rod.aurora']){
    const card=page.locator(`#marketList [data-equipment-id="${id}"]`);
    if(!await card.evaluate(el=>el.open))await card.locator('summary').tap();
    assert(await card.locator('img').evaluate(img=>img.complete&&img.naturalWidth===96));
    await page.screenshot({path:path.join(output,width+'-'+id.slice(4)+'-shop.png')});
    assert(await card.locator(`[data-rod-id="${id}"]`).isEnabled());
    if(id==='rod.tidal'){
      await page.evaluate(()=>{globalThis.rodSaveOriginal=saveGame;globalThis.rodTradeBefore=JSON.stringify(GAME_STATE);saveGame=()=>false;});
      await card.locator(`[data-rod-id="${id}"]`).tap();
      assert(await page.evaluate(()=>JSON.stringify(GAME_STATE)===rodTradeBefore));
      await page.evaluate(()=>saveGame=rodSaveOriginal);
    }
    await card.locator(`[data-rod-id="${id}"]`).tap();
    assert(await page.evaluate(id=>GAME_STATE.progression.fishing.purchasedRodIds.includes(id),id));
    assert.equal(await page.evaluate(()=>getEquippedFishingRod().id),'rod.deepwater');
  }
  assert.equal(await page.evaluate(()=>GAME_STATE.progression.coins),123);
  assert(await page.evaluate(()=>GAME_STATE.inventory.every(i=>i.type!=='fish'||i.quantity===2)&&JSON.stringify(GAME_STATE.collections)===rodCollectionBefore));
  await page.locator('#marketClose').tap();
  await page.locator('#menuBtn').tap();await page.locator('#openInventoryBtn').tap();
  await page.locator('[data-inventory-tab="equipment"]').tap();
  assert.equal(await page.locator('[data-equip-type="rod"]').count(),10);
  for(const id of ['rod.tidal','rod.tempest','rod.abyssal','rod.aurora']){
    await page.locator(`[data-equip-type="rod"][data-equip-id="${id}"]`).tap();
    assert.equal(await page.evaluate(()=>getEquippedFishingRod().id),id);
  }
  await page.screenshot({path:path.join(output,width+'-aurora-bag.png')});
  await page.locator('#inventoryClose').tap();await page.reload({timeout:60000});await ready(page);
  assert.equal(await page.evaluate(()=>getEquippedFishingRod().id),'rod.aurora');
  assert.equal(await page.evaluate(()=>GAME_STATE.progression.fishing.purchasedRodIds.length),9);
  for(const id of ['tidal','tempest','abyssal','aurora']){
    const catchReport=await page.evaluate(id=>{
      worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
      let shore=false;for(let y=0;y<MAP_H&&!shore;y++)for(let x=0;x<MAP_W&&!shore;x++)if(!isBlocked(x,y))
        for(const face of ['up','down','left','right']){player.x=x;player.y=y;player.face=face;
          if(getFishingSpotInFront()?.fishingHabitat==='pond'){shore=true;break;}}
      if(!shore)throw Error('No real pond shore');player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;clearMovement();
      if(!equipFishingRod('rod.'+id))throw Error('Cannot equip');
      const random=Math.random;Math.random=()=>0;
      try{
        if(!startFishing())throw Error('Cannot cast new rod');
        const wait=fishingState.biteDelay,expected=FISHING_CONFIG.minWaitMs*(1-getEquippedFishingRod().waitReduction);
        updateFishing(320);updateFishing(6000);handleFishingAction();
        const result=fishingState.result;
        return {rodId:result.rodId,fishId:result.fishId,xp:result.xp,wait,expected,phase:fishingState.phase};
      }finally{Math.random=random;}
    },id);
    assert.equal(catchReport.rodId,'rod.'+id);assert.equal(catchReport.fishId,'fish.crucian_carp');assert.equal(catchReport.xp,8);
    assert.equal(catchReport.wait,catchReport.expected);assert.equal(catchReport.phase,'result');
    await page.locator('#dialogNext').tap();await page.waitForFunction(()=>!isFishingActive());
  }
  for(const id of ['tidal','tempest','abyssal','aurora'])for(const face of ['down','right','left','up']){
    await page.evaluate(({id,face})=>{
      finishFishing();equipFishingRod('rod.'+id);player.face=face;player.moving=false;
      fishingState.phase='waiting';fishingState.timer=0;fishingState.biteDelay=1e9;
      fishingState.spot={x:player.x+(face==='right'?1:face==='left'?-1:0),y:player.y+(face==='down'?1:face==='up'?-1:0)};
      drawWorld();const tool=getCharacterToolTransform(player.px,player.py);
      if(tool?.key!=='rod.'+id||!Number.isFinite(tool.tip.x)||!Number.isFinite(tool.tip.y)||!characterToolImgs[tool.key]?.complete)
        throw Error('Missing held rod or valid line tip');
    },{id,face});
    if(width===393)await page.screenshot({path:path.join(output,id+'-'+face+'-held.png')});
  }
  await page.evaluate(()=>finishFishing());await context.close();
 }
 assert.deepEqual(errors,[]);
 console.log('Ten-rod browser QA passed: 393/320px ten-item shop/bag, purchases/rollback/manual equip, old/new saves, four rods × four held/fishing-line directions');
}finally{await browser.close();}
