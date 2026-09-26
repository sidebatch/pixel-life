import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/character-qa/temporary-wardrobe');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const phone=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await phone.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base);
  await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish&&typeof equipInventoryAppearance==='function',null,{polling:50});
  const legacy=await page.evaluate(()=>{
    const data=JSON.parse(JSON.stringify(createSaveData()));
    data.state.appearance={bodyId:'body.starter',hairId:'hair.brown',outfitId:'outfit.traveler',backpackId:'pack.traveler',
      ownedOutfitIds:['outfit.traveler'],ownedBackpackIds:['pack.traveler'],activeTool:'rod'};
    data.state.progression.coins=4321;
    const progress=lifeSkillProgressFromTotal('fishing',80);
    Object.assign(data.state.progression.fishing,{level:progress.level,xp:progress.xp,totalXp:80});
    if(!applySaveData(data))throw new Error('Legacy fixture could not be applied');
    GAME_STATE.appearance.ownedOutfitIds=['outfit.traveler'];
    GAME_STATE.appearance.ownedBackpackIds=['pack.traveler'];
    if(!saveGame())throw new Error('Legacy fixture could not be saved');
    return {coins:4321,level:progress.level,xp:progress.xp,totalXp:80,axeId:data.state.progression.forestry.axeId};
  });
  await page.reload();
  await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish&&typeof equipInventoryAppearance==='function',null,{polling:50});
  await page.evaluate(before=>{
    if(GAME_STATE.progression.coins!==before.coins||GAME_STATE.progression.fishing.level!==before.level||
      GAME_STATE.progression.fishing.xp!==before.xp||GAME_STATE.progression.fishing.totalXp!==before.totalXp||
      GAME_STATE.progression.forestry.axeId!==before.axeId||GAME_STATE.appearance.outfitId!=='outfit.traveler'||
      GAME_STATE.appearance.backpackId!=='pack.traveler'||GAME_STATE.appearance.activeTool!=='rod'||
      GAME_STATE.appearance.ownedOutfitIds.length!==3||GAME_STATE.appearance.ownedBackpackIds.length!==3)
      throw new Error('Legacy save sample grant changed equip/progress: '+JSON.stringify({expected:before,actual:{appearance:GAME_STATE.appearance,progression:GAME_STATE.progression}}));
    openInventory();
  },legacy);
  await page.locator('[data-inventory-tab="appearance"]').tap();
  await page.screenshot({path:path.join(output,'mobile-three-options.png')});
  const outfits=['outfit.traveler','outfit.ember','outfit.meadow'],packs=['pack.traveler','pack.ranger','pack.berry'];
  for(const outfit of outfits)for(const pack of packs){
    await page.locator('[data-equip-id="'+outfit+'"]').tap();
    await page.locator('[data-equip-id="'+pack+'"]').tap();
    await page.evaluate(({outfit,pack})=>{
      if(GAME_STATE.appearance.outfitId!==outfit||GAME_STATE.appearance.backpackId!==pack||
        GAME_STATE.appearance.activeTool!=='rod'||GAME_STATE.appearance.hairId!=='hair.brown'||
        document.querySelectorAll('[data-equip-type="outfit"].equipped').length!==1||
        document.querySelectorAll('[data-equip-type="backpack"].equipped').length!==1)
        throw new Error('Mobile combination equip failed');
    },{outfit,pack});
  }
  for(const id of ['outfit.ember','outfit.meadow','pack.ranger','pack.berry']){
    const before=await page.evaluate(()=>JSON.stringify(GAME_STATE));
    await page.locator('[data-inventory-info-id="'+id+'"]').tap();
    await page.evaluate(before=>{
      if(JSON.stringify(GAME_STATE)!==before||!document.getElementById('inventoryDetailContent').textContent.includes('임시'))
        throw new Error('Temporary detail changes state or omits sample notice');
    },before);
    await page.locator('#inventoryDetailClose').tap();
    await page.waitForFunction(()=>!isInventoryDetailOpen(),null,{polling:50});
  }
  await page.reload();
  await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish&&typeof equipInventoryAppearance==='function',null,{polling:50});
  await page.evaluate(()=>{
    if(GAME_STATE.appearance.outfitId!=='outfit.meadow'||GAME_STATE.appearance.backpackId!=='pack.berry'||
      GAME_STATE.progression.coins!==4321||GAME_STATE.progression.fishing.totalXp!==80)
      throw new Error('Appearance choice not restored or progress reset');
  });
  const context=await browser.newContext({viewport:{width:1920,height:1440}});
  const pc=await context.newPage();pc.on('pageerror',error=>errors.push(error.message));
  await pc.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await pc.goto(base);
  await pc.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish&&typeof equipInventoryAppearance==='function',null,{polling:50});
  const report=await pc.evaluate(()=>{
    const outfits=['outfit.traveler','outfit.ember','outfit.meadow'],packs=['pack.traveler','pack.ranger','pack.berry'];
    canvas.width=1920;canvas.height=1440;canvas.style.cssText='position:relative;width:1920px;height:1440px;max-width:none;max-height:none;';
    document.body.style.cssText='margin:0;display:block;background:#73a07a;overflow:auto;';
    document.body.appendChild(canvas);
    for(const el of document.body.children)if(el!==canvas)el.style.display='none';
    ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1920,1440);
    const poses=Object.entries(CHARACTER_RIG.poses).flatMap(([pose,def])=>Array.from({length:def.columns},(_,frame)=>({pose,frame})));
    const faces=['down','right','left','up'],baseline=new Map();
    for(const face of faces)for(const pose of poses){
      const p={...pose,face,tool:pose.pose==='fish'?'rod':'axe'};
      baseline.set(face+pose.pose+pose.frame,JSON.stringify(getCharacterToolTransform(100,100,p)));
    }
    let tested=0;
    for(let i=0;i<outfits.length;i++)for(let j=0;j<packs.length;j++){
      if(!equipInventoryAppearance('outfit',outfits[i])||!equipInventoryAppearance('backpack',packs[j]))throw new Error('Contact equip failed');
      const gx=j*640,gy=i*480,packLayers=CHARACTER_PARTS.backpack.get(packs[j]);
      ctx.fillStyle='#153c2b';ctx.font='bold 18px sans-serif';ctx.textAlign='left';
      ctx.fillText(CHARACTER_OUTFIT_BY_ID.get(outfits[i]).name+' / '+packLayers.name,gx+20,gy+25);
      const draw=ctx.drawImage;let outfitSeen=false,packSeen=false;
      for(let row=0;row<faces.length;row++)for(let col=0;col<poses.length;col++){
        const pose=poses[col],p={...pose,face:faces[row],tool:pose.pose==='fish'?'rod':'axe'};
        if(baseline.get(p.face+p.pose+p.frame)!==JSON.stringify(getCharacterToolTransform(100,100,p)))
          throw new Error('Appearance changed weapon grips or size');
        const outfitImage=characterOutfitImgs[outfits[i]][pose.pose],packImage=characterLayerImgs[packLayers[pose.pose+'Backpack']];
        if(!outfitImage||!packImage)throw new Error('Missing motion layers');
        ctx.drawImage=function(image,...args){if(image===outfitImage)outfitSeen=true;if(image===packImage)packSeen=true;return draw.call(this,image,...args);};
        drawCharacterActor(gx+48+col*78,gy+125+row*110,p);ctx.drawImage=draw;
        ctx.fillStyle='#153c2b';ctx.font='10px sans-serif';ctx.fillText(p.pose+' '+p.frame,gx+18+col*78,gy+153+row*110);
        tested++;
      }
      if(!outfitSeen||!packSeen)throw new Error('Selected appearance layers not rendered');
    }
    return {combinations:9,poses:tested,weaponTransformsUnchanged:true};
  });
  await pc.locator('#game').screenshot({path:path.join(output,'nine-combinations.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,mobileChoicesAndDetails:true,legacySavePreserved:true,reload:true,browserErrors:errors},null,2));
  console.log('Temporary wardrobe QA passed: '+JSON.stringify(report));
}finally{await browser.close();}
