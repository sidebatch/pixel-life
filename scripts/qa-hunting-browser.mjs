import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4190/';
const out=path.resolve(process.argv[2]||'output/hunting-qa/browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const reports=[],errors=[];
try{
  for(const [width,height]of [[393,780],[320,568],[1280,800]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    await page.goto(base+'?time=12:00&weather=clear',{waitUntil:'load',timeout:60000});
    await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler'],null,{polling:100});
    await page.evaluate(()=>updateWorldClockUI());
    await page.waitForFunction(()=>{const img=document.getElementById('locationIcon');return img.complete&&img.naturalWidth>0;},null,{polling:100});
    await page.evaluate(()=>{
      Math.random=()=>0; // Deterministic hits for exact-damage regression scenarios.
      document.getElementById('startupLoading')?.remove();
      window.__place=(x,y,face='up')=>{clearMovement();lifeUi.chop=null;Object.assign(player,{x,y,face,px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false,t:0});
        const cam=getWorldCameraTarget();camX=cam.x;camY=cam.y;drawWorld();refreshContext();};
      window.__advance=ms=>{for(let remaining=ms;remaining>0;remaining-=40)updateHunting(Math.min(40,remaining));};
      window.__impact=()=>{if(!lifeUi.chop)throw Error('No player swing');const started=lifeUi.chop.startedAt;
        updateLifeContentUi(started+270);updateLifeContentUi(started+701);drawWorld();};
      __place(48,38);
    });
    await page.screenshot({path:path.join(out,`${width}-village-gate.png`)});
    const entered=await page.evaluate(()=>{
      __place(48,36);tryMove('up');update(player.duration);
      if(GAME_STATE.regionId!=='dungeonCrossroads')throw Error('Village entrance must lead to the dungeon crossroads');
      __place(12,14);tryMove('up');update(player.duration);
      const entry=GAME_STATE.regionId==='wildwoodHunt'&&player.x===12&&player.y===14;
      updateHunting(0);drawWorld();return entry;
    });assert(entered,'Walking through the interior village gate must enter the hunting ground');
    assert.equal(await page.locator('#locationName').textContent(),'들녘 사냥터');
    const neutral=await page.evaluate(()=>{
      const before=huntingState.hp;__advance(30000);
      return {hp:huntingState.hp,before,types:new Set(huntingState.animals.map(a=>a.type)).size,
        neutral:huntingState.animals.every(a=>a.mode==='idle'&&a.hp===WILDLIFE_TYPES[a.type].hp),
        positions:huntingState.animals.every(a=>!blocked.has(key(a.x,a.y))),safe:!huntingAnimalAt(12,37)};
    });assert(neutral.neutral&&neutral.hp===neutral.before&&neutral.types===5&&neutral.positions&&neutral.safe,'All five species must remain neutral before being hit');
    await page.locator('[data-quick-tool="sword"]').click();
    await page.evaluate(()=>{
      for(const a of huntingState.animals){resetHuntingAnimal(a);a.wait=1e9;}
      window.__animal=huntingState.animals[0];__place(__animal.x,__animal.y+1);
      window.__economy=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections});
    });
    if(width<500)await page.locator('#btnA').tap();else await page.keyboard.press('Space');
    assert.equal(await page.evaluate(()=>lifeUi.chop?.mode),'sword');
    const struck=await page.evaluate(()=>{
      __impact();return {hp:__animal.hp,angry:huntingState.animals.filter(a=>a.mode==='aggro').length,
        damage:WILDLIFE_TYPES[__animal.type].hp-__animal.hp};
    });assert.equal(struck.damage,16);assert.equal(struck.angry,1,'Only the struck animal may retaliate');
    const combat=await page.evaluate(()=>{
      __advance(650);const telegraph=!!__animal.windup,hp=huntingState.hp,clock=huntingState.clock;
      toggleMenu(true);__advance(3000);const paused=huntingState.clock===clock&&huntingState.hp===hp;toggleMenu(false);
      __advance(650);const tookDamage=huntingState.hp===hp-WILDLIFE_TYPES[__animal.type].damage;
      __advance(1600);const dodging=!!__animal.windup,oldHp=huntingState.hp;
      __place(player.x+1,player.y,'left');__advance(650);
      const dodged=huntingState.hp===oldHp;
      __place(55,41);__advance(25000);
      const disengaged=__animal.mode==='idle'&&__animal.hp===WILDLIFE_TYPES[__animal.type].hp&&Math.hypot(__animal.x-__animal.homeX,__animal.y-__animal.homeY)<=3;
      return {telegraph,paused,tookDamage,dodging,dodged,disengaged};
    });assert(combat.telegraph&&combat.paused&&combat.tookDamage&&combat.dodging&&combat.dodged&&combat.disengaged,JSON.stringify(combat));
    const families=await page.evaluate(()=>{
      const rows=[];
      for(const [type,definition]of Object.entries(WILDLIFE_TYPES)){
        const a=huntingState.animals.find(item=>item.type===type);resetHuntingAnimal(a);a.wait=1e9;
        __place(a.x,a.y+1);const baseline=definition.hp;
        if(!startHeldToolSwing())throw Error('Failed family attack '+type);__impact();
        const angry=a.mode==='aggro'&&a.hp===baseline-16;
        const playerHp=huntingState.hp;__advance(1300);
        const retaliated=huntingState.hp<playerHp;
        while(a.hp>0){__place(a.x,a.y+1);startHeldToolSwing();__impact();}
        const defeated=a.mode==='down'&&!huntingAnimalAt(a.x,a.y);
        rows.push({type,angry,retaliated,defeated});huntingState.hp=100;
      }
      __place(12,37);__advance(61000);
      const respawn=huntingState.animals.every(a=>a.hp===WILDLIFE_TYPES[a.type].hp&&a.mode==='idle');
      const unchanged=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections})===__economy;
      return {rows,respawn,unchanged};
    });assert(families.rows.every(r=>r.angry&&r.retaliated&&r.defeated)&&families.respawn&&families.unchanged,JSON.stringify(families));
    const tools=[];
    for(const tool of ['axe','rod','sickle','sword']){
      await page.locator('[data-quick-tool="'+tool+'"]').click();
      await page.evaluate(()=>{for(const a of huntingState.animals){resetHuntingAnimal(a);a.wait=1e9;}window.__animal=huntingState.animals[0];__place(__animal.x,__animal.y+1);});
      if(width<500)await page.locator('#btnA').tap();else await page.keyboard.press('Space');
      const result=await page.evaluate(tool=>{const before=__animal.hp;__impact();return {tool,damage:before-__animal.hp,expected:HUNTING_RULES.toolDamage[tool]};},tool);
      assert.equal(result.damage,result.expected,'Actual equipped tool damage');tools.push(result);
    }
    const safeguards=await page.evaluate(()=>{
      for(const a of huntingState.animals){resetHuntingAnimal(a);a.wait=1e9;}
      const a=huntingState.animals[0];__place(a.x,a.y+1);tryMove('up');const collision=!player.moving;
      blocked.add(key(a.x,a.y));const walls=huntingTargetForSwing()===null;blocked.delete(key(a.x,a.y));
      startHeldToolSwing();__impact();__advance(650);const hp=huntingState.hp;
      document.getElementById('huntingHud').hidden=false;drawWorld();
      const hpShown=!document.getElementById('huntingHud').hidden;
      const text=document.getElementById('huntingHealthText'),label=text.parentElement;
      const healthFits=text.getBoundingClientRect().height<=18&&text.getBoundingClientRect().right<=label.getBoundingClientRect().right+1;
      return {collision,walls,hpShown,healthFits,hp};
    });assert(safeguards.collision&&safeguards.walls&&safeguards.hpShown&&safeguards.healthFits,JSON.stringify(safeguards));
    await page.screenshot({path:path.join(out,`${width}-retaliation.png`)});
    const returned=await page.evaluate(()=>{
      __place(12,12,'up');tryMove('up');update(player.duration);
      if(GAME_STATE.regionId!=='dungeonCrossroads')throw Error('Hunting exit must return to the crossroads');
      __place(8,25,'up');tryMove('up');update(player.duration);
      const exited=GAME_STATE.regionId==='lilacVillage'&&player.x===48&&player.y===37&&document.getElementById('huntingHud').hidden;
      return {exited,calm:huntingState.animals.filter(a=>a.hp>0).every(a=>a.mode==='idle')};
    });assert(returned.exited&&returned.calm);
    // Save/reload a location inside the new region without changing save version.
    await page.evaluate(()=>{enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='dungeonCrossroads'));enterWorldRegion(DUNGEON_HUB_DOORS[0]);saveGame();});
    await page.reload({waitUntil:'load'});await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler'],null,{polling:100});
    const reload=await page.evaluate(()=>{updateHunting(0);return GAME_STATE.regionId==='wildwoodHunt'&&huntingState.animals.every(a=>a.mode==='idle')&&SAVE_CONFIG.version===2;});assert(reload);
    const recovery=await page.evaluate(()=>{
      Math.random=()=>0;
      const a=huntingState.animals[0],x=a.x,y=a.y+1;
      Object.assign(player,{x,y,face:'up',px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false,t:0});
      GAME_STATE.appearance.activeTool='sword';startHeldToolSwing();
      const started=lifeUi.chop.startedAt;updateLifeContentUi(started+270);updateLifeContentUi(started+701);
      huntingState.hp=1;huntingState.hurtUntil=0;
      for(let i=0;i<33;i++)updateHunting(40);
      return {village:GAME_STATE.regionId==='lilacVillage',hp:huntingState.hp,dialog:dialogOpen,calm:huntingState.animals.every(a=>a.mode==='idle')};
    });assert(recovery.village&&recovery.hp===100&&recovery.dialog&&recovery.calm,JSON.stringify(recovery));
    const overlapRestore=await page.evaluate(()=>{
      closeDialog();const a=huntingState.animals[0];enterWorldRegion({to:'wildwoodHunt',entry:{x:a.homeX,y:a.homeY,face:'up'}});
      const clear=!huntingAnimalAt(player.x,player.y),overlap=new Set();
      for(const animal of huntingState.animals){const k=key(animal.x,animal.y);if(overlap.has(k))return false;overlap.add(k);}
      return clear;
    });assert(overlapRestore,'Restoring a player on a defeated animal home must not stack actors');
    if(width===393){
      const pixels=await page.evaluate(()=>{
        const sheet=document.createElement('canvas');sheet.width=600;sheet.height=460;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;
        c.fillStyle='#668c54';c.fillRect(0,0,600,460);c.textAlign='center';c.font='bold 15px sans-serif';c.fillStyle='#fff8de';
        Object.values(WILDLIFE_TYPES).forEach((type,row)=>{
          c.fillText(type.name,55,row*90+47);
          for(let face=0;face<4;face++)c.drawImage(imgs[type.image],(face%2)*96,Math.floor(face/2)*96,96,96,110+face*115,row*90,96,96);
        });return sheet.toDataURL('image/png').split(',')[1];
      });fs.writeFileSync(path.join(out,'five-species-directions.png'),Buffer.from(pixels,'base64'));
    }
    reports.push({width,entered,neutral,struck,combat,families,tools,safeguards,returned,reload,recovery,overlapRestore});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
  console.log('Hunting browser QA passed: 320/393/1280px, village gate, five neutral species, individual retaliation, dodge/menu/leash/wall/collision, defeat/respawn, unchanged economy and reload.');
}finally{await browser.close();}
