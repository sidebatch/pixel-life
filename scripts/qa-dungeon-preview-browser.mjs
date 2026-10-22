import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {blank,decodePNG,encodePNG,blitNearest} from './lib/png.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const out=path.resolve(process.argv[2]||'output/dungeon-preview-qa');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});const errors=[],reports=[],bossFrames=[];
try{
  for(const [width,height]of [[393,850],[320,568],[1280,900]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion:width===320?'reduce':'no-preference'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    const response=await page.goto(base+'?time=12:00&weather=clear',{waitUntil:'load',timeout:60000});
    assert(response?.ok(),'Game document must load: '+response?.status()+' '+base);
    await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']&&typeof imgs!=='undefined'&&imgs.dungeonStargraveGate?.width>0,null,{polling:100});
    await page.evaluate(()=>{
      document.getElementById('startupLoading')?.remove();
      window.__bossDraws=new Set();const originalBossAura=drawDungeonBossAura;
      drawDungeonBossAura=(aura,...args)=>{__bossDraws.add(aura.color);return originalBossAura(aura,...args);};
      window.__place=(x,y,face='up')=>{clearMovement();Object.assign(player,{x,y,face,px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false,t:0});const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();refreshContext();};
      window.__reachable=()=>{
        const queue=[[player.x,player.y]],seen=new Set([key(player.x,player.y)]);
        for(let i=0;i<queue.length;i++)for(const [dx,dy]of Object.values(dirVec)){
          const [x,y]=queue[i],xx=x+dx,yy=y+dy,k=key(xx,yy);
          if(!inside(xx,yy)||blocked.has(k)||huntingAnimalAt(xx,yy)||seen.has(k))continue;seen.add(k);queue.push([xx,yy]);
        }return seen;
      };
      window.__walk=(tx,ty)=>{
        const start=key(player.x,player.y),target=key(tx,ty),queue=[[player.x,player.y]],parents=new Map([[start,null]]);
        for(let i=0;i<queue.length&&!parents.has(target);i++)for(const [face,[dx,dy]]of Object.entries(dirVec)){
          const [x,y]=queue[i],xx=x+dx,yy=y+dy,k=key(xx,yy);
          if(!inside(xx,yy)||blocked.has(k)||huntingAnimalAt(xx,yy)||parents.has(k)||(k!==target&&regionExitAt(xx,yy)))continue;
          parents.set(k,{previous:key(x,y),face});queue.push([xx,yy]);
        }
        if(!parents.has(target))throw Error('Unreachable '+GAME_STATE.regionId+' '+target);
        const steps=[];for(let k=target;k!==start;){const p=parents.get(k);steps.push(p.face);k=p.previous;}
        for(const face of steps.reverse()){tryMove(face);if(!player.moving)throw Error('Movement refused '+face);update(player.duration+1);}
        drawWorld();refreshContext();return GAME_STATE.regionId;
      };
      __place(48,37);
    });
    await page.screenshot({path:path.join(out,width+'-village.png')});
    assert.equal(await page.evaluate(()=>__walk(48,35)),'dungeonCrossroads');
    const before=await page.evaluate(()=>{saveGame();loadGame();return JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections});});
    const hub=await page.evaluate(()=>{
      validatePlayableRegion();const seen=__reachable();
      return {doors:WORLD_DEFINITION.dungeonDoors.length,allDoorsReachable:WORLD_DEFINITION.exits.every(e=>seen.has(key(e.x,e.y))),names:DUNGEON_REGIONS.map(r=>r.name)};
    });assert.equal(hub.doors,11);assert(hub.allDoorsReachable);
    await page.evaluate(()=>__place(32,34));await page.screenshot({path:path.join(out,width+'-crossroads.png')});
    const regions=[];
    for(let i=0;i<10;i++){
      const row=await page.evaluate(i=>{
        const door=DUNGEON_HUB_DOORS[i],expected=DUNGEON_REGIONS[i].id;__walk(door.x,door.y);
        if(GAME_STATE.regionId!==expected)throw Error('Wrong portal '+expected);validatePlayableRegion();const seen=__reachable();
        if(document.getElementById('locationName').textContent!==WORLD_DEFINITION.name)throw Error('HUD region name missing '+expected);
        const monsters=WORLD_DEFINITION.dungeonMonsters,anchors=new Set(monsters.map(m=>key(m.x,m.y)));
        return {id:expected,species:new Set(monsters.map(m=>m.id)).size+(i===0?5:0),instances:monsters.length+(i===0?huntingState.animals.length:0),
          unique:anchors.size===monsters.length,approachable:monsters.every(m=>Object.values(dirVec).some(([dx,dy])=>seen.has(key(m.x+dx,m.y+dy)))),
          blocked:monsters.every(m=>blocked.has(key(m.x,m.y))),exits:WORLD_DEFINITION.exits.every(e=>seen.has(key(e.x,e.y)))};
      },i);
      assert(row.species===6&&row.instances===11&&row.unique&&row.approachable&&row.blocked&&row.exits,JSON.stringify(row));
      if(width===393)await page.screenshot({path:path.join(out,'entry-'+row.id+'.png')});
      await page.evaluate(i=>i===0?__place(44,14):__place(14,36),i);
      await page.screenshot({path:path.join(out,width+'-'+row.id+'.png')});
      const bossProof=await page.evaluate(i=>{
        __place(i===0?44:50,i===0?14:15);
        const boss=WORLD_DEFINITION.dungeonMonsters.find(m=>m.boss);
        if(!__bossDraws.has(DUNGEON_BOSS_AURA_COLORS[boss.id]))throw Error('Boss aura was not actually rendered '+boss.id);
        const frame=document.createElement('canvas');frame.width=260;frame.height=260;const c=frame.getContext('2d');
        c.drawImage(canvas,Math.round((boss.x+.5)*TILE-camX-130),Math.round((boss.y+1)*TILE-camY-220),260,260,0,0,260,260);
        c.fillStyle='#233d36';c.fillRect(0,236,260,24);
        c.font='bold 14px sans-serif';c.textAlign='center';c.lineWidth=4;c.strokeStyle='#20372e';c.strokeText(DUNGEON_REGIONS[i].name,130,250);
        c.fillStyle='#fff2d2';c.fillText(DUNGEON_REGIONS[i].name,130,250);return frame.toDataURL('image/png').split(',')[1];
      },i);
      if(width===393){bossFrames.push(Buffer.from(bossProof,'base64'));await page.screenshot({path:path.join(out,'boss-'+row.id+'.png')});}
      if(i===9){
        await page.addInitScript(await page.evaluate(()=>'window.__walk='+__walk.toString()));
        await page.evaluate(()=>{__place(32,38);saveGame();});await page.reload({waitUntil:'load'});
        await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']&&typeof imgs!=='undefined'&&imgs.dungeonStargraveGate?.width>0,null,{polling:100});
        assert.equal(await page.evaluate(()=>GAME_STATE.regionId),'stargraveRuins');
        assert.equal(await page.evaluate(()=>{const exit=REGION_EXITS.stargraveRuins[0];return __walk(exit.x,exit.y);}),'dungeonCrossroads');
      }else assert.equal(await page.evaluate(()=>{const exit=REGION_EXITS[GAME_STATE.regionId][0];return __walk(exit.x,exit.y);}),'dungeonCrossroads');
      regions.push(row);
    }
    const after=await page.evaluate(()=>JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression,collections:GAME_STATE.collections}));assert.deepEqual(JSON.parse(after),JSON.parse(before),'Tour/reload must not grant or consume items, levels or money');
    // Helpers were lost on reload. Verify the final village route through actual movement.
    const returned=await page.evaluate(()=>{const exit=REGION_EXITS.dungeonCrossroads.find(e=>e.to==='lilacVillage');return __walk(exit.x,exit.y);});
    assert.equal(returned,'lilacVillage');
    if(width===393){
      const png=await page.evaluate(()=>{
        const sheet=document.createElement('canvas');sheet.width=1040;sheet.height=1360;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;
        c.fillStyle='#233d36';c.fillRect(0,0,sheet.width,sheet.height);
        DUNGEON_REGIONS.forEach((r,row)=>{
          c.textAlign='left';c.font='bold 18px sans-serif';c.fillStyle='#f8dfab';c.fillText(r.name,18,row*134+23);
          r.monsters.forEach((m,col)=>{const x=104+col*153,y=row*134+25;
            if(row===0){const image=m.boss?imgs.dungeonBrak:imgs[WILDLIFE_TYPES[m.id].image];c.drawImage(image,0,0,96,96,x,y,96,96);}
            else c.drawImage(imgs[r.atlas],m.frame%3*128,Math.floor(m.frame/3)*128,128,128,x,y,96,96);
            c.textAlign='center';c.font='14px sans-serif';c.fillStyle=m.boss?'#ffe3a2':'#f4f1df';c.fillText(m.name,x+48,y+106);
          });
        });return sheet.toDataURL('image/png').split(',')[1];
      });fs.writeFileSync(path.join(out,'all-60-monsters.png'),Buffer.from(png,'base64'));
    }
    reports.push({width,hub,regions,returned,reload:true});await context.close();
  }
  const bossSheet=blank(1300,520);
  bossFrames.forEach((bytes,i)=>blitNearest(bossSheet,decodePNG(bytes),i%5*260,Math.floor(i/5)*260));
  fs.writeFileSync(path.join(out,'all-10-bosses.png'),encodePNG(bossSheet));
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2));
  console.log('Dungeon preview passed: 60 species/110 actors, 10 enter/exit tours, reachable monsters, collisions, no economy changes, reload and 320/393/1280px.');
}finally{await browser.close();}
