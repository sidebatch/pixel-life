import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:48273/';
const out=path.resolve(process.argv[2]||'output/crafting-qa/browser');fs.mkdirSync(out,{recursive:true});
const errors=[],reports=[];
try{
  for(const [width,height]of [[393,850],[320,568],[1280,900]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion:width===320?'reduce':'no-preference'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))errors.push(r.status()+' '+r.url());});
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    await page.goto(base+'?time=12:00&weather=clear',{waitUntil:'load',timeout:60000});
    await page.waitForFunction(()=>typeof craftingState!=='undefined'&&characterToolImgs['sword.brak']?.width>0&&imgs.brakAttack?.width>0,null,{polling:100});
    await page.evaluate(()=>{
      document.getElementById('startupLoading')?.remove();Math.random=()=>0;
      window.__place=(x,y,face='up')=>{clearMovement();lifeUi.chop=null;Object.assign(player,{x,y,face,px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false,t:0});const c=getWorldCameraTarget();camX=c.x;camY=c.y;};
      window.__advance=ms=>{for(let t=0;t<ms;t+=40)updateHunting(Math.min(40,ms-t));};
      window.__hit=()=>{if(!startSwordSwing())throw Error('Sword action refused');const t=lifeUi.chop.startedAt;updateLifeContentUi(t+270);updateLifeContentUi(t+701);};
      addLifeItem('material','oak_log',12);addLifeItem('material','pine_log',8);saveGame();openMarket({shop:'workshop'});
    });
    await page.locator('[data-market-view="crafting"]').click();await page.locator('[data-make-workbench]').click();
    assert(await page.evaluate(()=>hasPortableWorkbench()&&totalLogCount()===0&&GAME_STATE.progression.coins===0));
    await page.screenshot({path:path.join(out,width+'-workbench-shop.png')});
    await page.evaluate(()=>{closeMarket({fromHistory:true});openInventory();inventoryState.tab='supplies';renderInventory();});
    await page.locator('[data-use-item-id="portable_workbench"]').click();assert(await page.locator('#craftingPanel').isVisible());
    assert(await page.locator('#craftingMake').isDisabled());assert.equal(await page.locator('.craftingMaterials .missing').count(),1);
    await page.evaluate(()=>{addLifeItem('material','normal_leather',95);renderCrafting();});
    await page.locator('#craftingMax').click();assert.equal(await page.locator('#craftingQuantity').textContent(),'3');
    await page.screenshot({path:path.join(out,width+'-leather-crafting.png')});
    // Every live button remains inside the panel/viewport at the smallest phone size.
    const layout=await page.evaluate(()=>{const panel=document.getElementById('craftingPanel'),r=panel.getBoundingClientRect(),button=document.getElementById('craftingMake').getBoundingClientRect();return {overflow:panel.scrollWidth>panel.clientWidth,bottom:button.bottom,height:innerHeight,left:r.left,right:r.right,width:innerWidth};});
    assert(!layout.overflow&&layout.bottom<=layout.height&&layout.left>=0&&layout.right<=layout.width,JSON.stringify(layout));
    await page.locator('#craftingMake').click();assert(await page.evaluate(()=>lifeItemCount('material','normal_leather')===5&&lifeItemCount('material','sturdy_leather')===3));
    await page.locator('[data-craft-category="equipment"]').click();assert(await page.locator('#craftingMake').isDisabled());
    await page.evaluate(()=>{addLifeItem('material','brak_tusk',1);renderCrafting();});
    await page.screenshot({path:path.join(out,width+'-brak-recipe.png')});await page.locator('#craftingMake').click();
    assert(await page.evaluate(()=>getOwnedSwords().length===2&&getEquippedSword().id==='sword.basic'&&getSwordDurability('sword.brak').current===200));
    assert(await page.locator('#craftingMake').isDisabled());
    await page.locator('#craftingClose').click();assert(!(await page.locator('#craftingPanel').isVisible()));
    await page.locator('[data-inventory-tab="equipment"]').click();await page.locator('[data-equip-id="sword.brak"]').click();
    assert(await page.evaluate(()=>getEquippedSword().id==='sword.brak'));await page.screenshot({path:path.join(out,width+'-brak-equipment.png')});
    if(width===393){
      const image=await page.evaluate(()=>{
        const appearance=GAME_STATE.appearance,oldSize=[canvas.width,canvas.height];canvas.width=760;canvas.height=700;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#315743';ctx.fillRect(0,0,760,700);
        try{
          for(const [sex,bodyId]of ['body.starter','body.female'].entries()){
            GAME_STATE.appearance={...appearance,bodyId,hairId:sex?'hair.female.brown':'hair.brown'};
            for(const [row,face]of ['down','right','left','up'].entries())for(const frame of [0,1]){
              const pose={pose:'sword',face,frame,tool:'sword'},transform=getCharacterToolTransform(0,0,pose),grip=SWORD_ACTION.frames[face][frame].grip,unit=CHARACTER_RIG.renderSize/96;
              if(transform.key!=='sword.brak'||Math.abs(transform.x-(grip[0]-48)*unit)>1e-8||Math.abs(transform.y-(20+(grip[1]-88)*unit))>1e-8||Math.abs(Math.hypot(transform.tip.x-transform.x,transform.tip.y-transform.y)-44*unit)>1e-8)throw Error('Brak sword lost its common hand pivot');
              ctx.save();ctx.translate(100+frame*175+sex*380,115+row*160);ctx.scale(2,2);drawCharacterActor(0,0,pose);ctx.restore();
            }
          }
          return canvas.toDataURL('image/png');
        }finally{GAME_STATE.appearance=appearance;canvas.width=oldSize[0];canvas.height=oldSize[1];}
      });fs.writeFileSync(path.join(out,'brak-sword-contact-sheet.png'),Buffer.from(image.split(',')[1],'base64'));
    }
    await page.evaluate(()=>{closeInventory({fromHistory:true});refreshToolHotbar();});
    assert.equal(await page.locator('[data-quick-tool="sword"] .equipmentDurability').getAttribute('aria-valuenow'),'200');
    const noWear=await page.evaluate(()=>{__hit();return getSwordDurability().current;});assert.equal(noWear,200,'Air swings never wear the sword');
    // Boss is a live combat actor, not an extra static obstacle or duplicate drawing.
    const neutral=await page.evaluate(()=>{
      enterWorldRegion({to:'wildwoodHunt',entry:{x:44,y:14,face:'up'}});__place(44,14);
      for(const a of huntingActors()){resetHuntingAnimal(a);a.wait=1e9;}
      __advance(3000);drawWorld();return {hp:huntingBoss.hp,mode:huntingBoss.mode,blocked:blocked.has(key(44,12)),types:huntingActors().length};
    });assert.deepEqual(neutral,{hp:320,mode:'idle',blocked:false,types:11});
    await page.evaluate(()=>{equipSword('sword.basic');__place(44,13);__hit();});
    assert(await page.evaluate(()=>huntingBoss.hp===304&&huntingBoss.mode==='aggro'&&huntingState.animals.every(a=>a.mode==='idle')));
    const dodge=await page.evaluate(()=>{
      huntingBoss.nextAttack=huntingState.clock;__advance(40);if(!huntingBoss.windup)throw Error('Boss never telegraphed');
      const hp=huntingState.hp;__advance(1000);const telegraphed=!!huntingBoss.windup;__place(46,13);__advance(540);
      return {telegraphed,dodged:huntingState.hp===hp,recovery:!!huntingBoss.attackRecovery};
    });assert(dodge.telegraphed&&dodge.dodged&&dodge.recovery);
    await page.evaluate(()=>{__place(huntingBoss.x,huntingBoss.y+1);huntingBoss.windup={at:huntingState.clock-1490,x:player.px,y:player.py,face:'down'};huntingState.hurtUntil=0;__advance(40);});
    assert.equal(await page.evaluate(()=>huntingState.hp),74,'Brak hit deals 26');
    await page.evaluate(()=>{__place(huntingBoss.x,huntingBoss.y+1);huntingBoss.windup={at:huntingState.clock-1000,x:player.px,y:player.py,face:'down'};drawWorld();refreshContext();});
    await page.screenshot({path:path.join(out,width+'-brak-windup.png')});
    await page.evaluate(()=>{huntingBoss.windup.at=huntingState.clock-1490;drawWorld();});await page.screenshot({path:path.join(out,width+'-brak-charge.png')});
    const reward=await page.evaluate(()=>{
      const old=lifeItemCount('material','normal_leather');huntingBoss.windup=null;huntingBoss.attackRecovery=null;
      __place(huntingBoss.x,huntingBoss.y+1);let hits=0;while(huntingBoss.hp>0&&hits<30){__hit();hits++;}
      const leather=lifeItemCount('material','normal_leather')-old,tusks=lifeItemCount('material','brak_tusk');
      __hit();return {hits,leather,tusks,hp:huntingBoss.hp,duplicate:lifeItemCount('material','normal_leather')-old,until:GAME_STATE.progression.hunting.defeatedUntil.wildwood_brak-Date.now(),blocking:!!huntingAnimalAt(huntingBoss.x,huntingBoss.y)};
    });assert.equal(reward.hits,19);assert.equal(reward.leather,10);assert.equal(reward.tusks,1);assert.equal(reward.hp,0);assert.equal(reward.duplicate,10);assert(reward.until>298000&&!reward.blocking);
    // Neutral animal drops, real sword wear, miss immunity and save-failure rollback.
    const normal=await page.evaluate(()=>{
      const a=huntingState.animals[0];resetHuntingAnimal(a);a.wait=1e9;__place(a.x,a.y+1);equipSword('sword.brak');const old=lifeItemCount('material','normal_leather'),d=getSwordDurability().current;
      Math.random=()=>.9;__hit();const missed=getSwordDurability().current===d&&a.hp===64&&a.mode==='idle';Math.random=()=>0;
      __hit();const injured=a.hp===40&&getSwordDurability().current===d-1;
      const oldSave=saveGame,before=JSON.stringify(createSaveData().state);saveGame=()=>false;__hit();const rollback=JSON.stringify(createSaveData().state)===before&&a.hp===40;saveGame=oldSave;
      __hit();__hit();return {missed,injured,rollback,loot:lifeItemCount('material','normal_leather')-old,durability:getSwordDurability().current};
    });assert(normal.missed&&normal.injured&&normal.rollback&&normal.loot===3&&normal.durability===197,JSON.stringify(normal));
    const saved=await page.evaluate(()=>{saveGame();return {leather:lifeItemCount('material','normal_leather'),tusks:lifeItemCount('material','brak_tusk'),until:GAME_STATE.progression.hunting.defeatedUntil.wildwood_brak};});
    await page.evaluate(()=>{const save=JSON.parse(localStorage.getItem(SAVE_CONFIG.key)),p=save.state.progression.swords;p.swordId='sword.iron';p.ownedSwordIds=p.ownedSwordIds.map(id=>id==='sword.brak'?'sword.iron':id);p.durabilityBySwordId['sword.iron']=p.durabilityBySwordId['sword.brak'];delete p.durabilityBySwordId['sword.brak'];window.removeEventListener('pagehide',saveGame);saveGame=()=>true;localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(save));});
    await page.reload({waitUntil:'load'});await page.waitForFunction(()=>typeof huntingBoss!=='undefined'&&characterToolImgs['sword.brak']?.width>0,null,{polling:100});
    assert(await page.evaluate(saved=>hasPortableWorkbench()&&huntingBoss.hp===0&&lifeItemCount('material','normal_leather')===saved.leather&&lifeItemCount('material','brak_tusk')===saved.tusks&&GAME_STATE.progression.hunting.defeatedUntil.wildwood_brak===saved.until&&getOwnedSwords().length===2&&getSwordDurability().current===197,saved));
    await page.evaluate(()=>{
      document.getElementById('startupLoading')?.remove();enterWorldRegion({to:'lilacVillage',entry:{x:25,y:24,face:'down'}});GAME_STATE.progression.coins=100;openMarket({shop:'workshop',view:'axeRepairs'});
    });
    // openMarket honors shop default; choose the existing combined repair category.
    if(!(await page.locator('[data-repair-sword]').count()))await page.locator('[data-market-view="axeRepairs"]').click();
    assert.equal(await page.locator('[data-repair-sword="sword.brak"]').count(),1);await page.locator('[data-repair-sword="sword.brak"]').click();
    assert(await page.evaluate(()=>getSwordDurability().current===200&&GAME_STATE.progression.coins===98));
    await page.evaluate(()=>{closeMarket({fromHistory:true});openInventory();inventoryState.tab='supplies';renderInventory();});
    await page.locator('[data-use-item-id="portable_workbench"]').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!isCraftingOpen(),null,{polling:100});assert(await page.evaluate(()=>isInventoryOpen()));
    reports.push({width,height,layout,neutral,dodge,reward,normal,reload:true,repair:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log('Crafting browser passed: 320/393/1280px, real shop/bag/recipe/equip/repair clicks, Brak neutral/charge/dodge/kill, loot, miss/wear/rollback, reload and Escape.');
}finally{await browser.close();}
