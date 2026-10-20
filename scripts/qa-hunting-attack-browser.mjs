import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4190/dist/index.html';
const out=path.resolve(process.argv[2]||'output/hunting-attack-qa');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const reports=[],errors=[];
try{
 for(const [width,height]of [[393,780],[320,568],[1280,800]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base,{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']&&imgs.wildlifeBearAttack);
  await page.evaluate(()=>{document.getElementById('startupLoading')?.remove();enterWorldRegion(REGION_EXITS.lilacVillage.find(e=>e.to==='wildwoodHunt'));});
  await page.locator('[data-quick-tool="sword"]').click();
  const result=await page.evaluate(()=>{
   const sheets=[],rows=[],faces=['down','left','right','up'],times=[0,400,560,600,680,780,860];
   const economy=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections});
   const advance=ms=>{for(let elapsed=0;elapsed<ms;elapsed+=20)updateHunting(Math.min(20,ms-elapsed));};
   const place=(x,y,face)=>{clearMovement();lifeUi.chop=null;Object.assign(player,{x,y,face,px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false,t:0});};
   for(const type of Object.keys(WILDLIFE_TYPES)){
    const sheet=document.createElement('canvas');sheet.width=times.length*144;sheet.height=faces.length*190;
    const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#304c38';c.fillRect(0,0,sheet.width,sheet.height);
    for(let faceIndex=0;faceIndex<faces.length;faceIndex++){
     const face=faces[faceIndex],[dx,dy]=dirVec[face];place(12,37,'up');
     for(const a of huntingState.animals){resetHuntingAnimal(a);a.wait=1e9;}
     const a=huntingState.animals.find(a=>a.type===type);huntingState.hp=100;huntingState.hurtUntil=0;
     place(a.x+dx,a.y+dy,{up:'down',down:'up',left:'right',right:'left'}[face]);
     if(!startHeldToolSwing())throw Error('Cannot start player attack');
     const start=lifeUi.chop.startedAt;updateLifeContentUi(start+270);updateLifeContentUi(start+701);
     for(let i=0;i<100&&!a.windup;i++)updateHunting(20);
     if(!a.windup||a.windup.face!==face)throw Error('No directional retaliation '+type+'/'+face);
     const began=a.windup.at,anchor={x:a.x,y:a.y,px:a.px,py:a.py},phases=[];
     for(let i=0;i<times.length;i++){
      advance(Math.max(0,began+times[i]-huntingState.clock));
      const visual=getHuntingAttackVisual(a),health=huntingState.hp;
      if(times[i]<600&&health!==100)throw Error('Damage before visual impact');
      if(times[i]>=600&&health!==100-WILDLIFE_TYPES[type].damage)throw Error('Missing or duplicated attack damage');
      if(a.x!==anchor.x||a.y!==anchor.y||a.px!==anchor.px||a.py!==anchor.py)throw Error('Animation moved collision anchor');
      phases.push({ms:times[i],phase:visual.phase,image:visual.image,health});
      const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;tNow=performance.now();drawWorld();refreshContext();
      c.drawImage(canvas,a.px-camX-70,a.py+24-camY-145,140,170,i*144,faceIndex*190+20,140,170);
      c.fillStyle='#fff1cf';c.font='bold 12px sans-serif';c.fillText(face+' '+times[i]+'ms',i*144+6,faceIndex*190+14);
     }
     const expected=['windup','windup','attack','impact','impact','recover','idle'];
     if(phases.some((p,i)=>p.phase!==expected[i]))throw Error('Incorrect animation phases '+JSON.stringify(phases));
     rows.push({type,face,phases});
    }
    sheets.push({type,data:sheet.toDataURL('image/png').split(',')[1]});
   }
   const unchanged=economy===JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections});
   // Menus freeze the same clock that drives artwork and damage.
   const a=huntingState.animals.find(a=>a.type==='boar');place(12,37,'up');resetHuntingAnimal(a);place(a.x,a.y+1,'up');
   a.mode='aggro';a.lastHit=huntingState.clock;a.windup={at:huntingState.clock,x:player.px,y:player.py,face:'down'};a.attackRecovery=null;
   advance(400);const clock=huntingState.clock,before=JSON.stringify(getHuntingAttackVisual(a)),hp=huntingState.hp;
   toggleMenu(true);advance(2000);const paused=huntingState.clock===clock&&huntingState.hp===hp&&before===JSON.stringify(getHuntingAttackVisual(a));toggleMenu(false);
   // Moving out of the marked attack still plays the attack but deals no damage.
   place(player.x+2,player.y,'up');advance(200);const miss=getHuntingAttackVisual(a).phase==='impact'&&huntingState.hp===hp;
   enterWorldRegion(REGION_EXITS.wildwoodHunt[0]);const cleared=huntingState.animals.every(a=>!a.windup&&!a.attackRecovery);
   return {rows,sheets,unchanged,paused,miss,cleared};
  });
  assert(result.unchanged&&result.paused&&result.miss&&result.cleared);
  assert.equal(result.rows.length,20);if(width===393)for(const sheet of result.sheets)fs.writeFileSync(path.join(out,sheet.type+'-attack-directions.png'),Buffer.from(sheet.data,'base64'));
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduced=await page.evaluate(()=>{
   const actor={type:'wolf',hp:80,mode:'aggro',face:'down',windup:{at:0,face:'down'},attackRecovery:null};
   const v=getHuntingAttackVisual(actor,560);return {image:v.image,phase:v.phase,x:v.offsetX,y:v.offsetY,lift:v.lift,sx:v.scaleX,sy:v.scaleY};
  });assert.equal(reduced.phase,'attack');assert.equal(reduced.image,'wildlifeWolfAttack');assert.equal(reduced.x,0);assert.equal(reduced.y,0);assert.equal(reduced.lift,0);assert.equal(reduced.sx,1);assert.equal(reduced.sy,1);
  delete result.sheets;reports.push({width,...result,reduced});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
 console.log('Hunting attack browser passed: 5 species x 4 directions x 7 phases at 320/393/1280px; impact timing, single damage, stable collision, pause/miss/reset, reduced motion and economy.');
}finally{await browser.close();}
