// Exercise visible stairs and actual movement at melee impact, including late dodges.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:48274/';
const out=path.resolve(process.env.PIXEL_LIFE_QA_OUT||'output/dungeon-combat-qa');fs.mkdirSync(out,{recursive:true});
const before=process.argv.includes('--record-before'),reports=[],errors=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
try{
  for(const [width,height]of before?[[393,850]]:[[393,850],[320,640],[1280,850]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500,reducedMotion:width===320?'reduce':'no-preference'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))errors.push(r.status()+' '+r.url());});
    await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
    await page.goto(base+'?time=12:00&weather=clear',{waitUntil:'load',timeout:60000});
    await page.waitForFunction(()=>imgs.dungeonSouthExit?.width>0&&characterLayerImgs.walkHead?.width>0&&characterOutfitImgs['outfit.traveler']?.walk?.width>0);
    await page.evaluate(()=>{
      document.getElementById('startupLoading')?.remove();Math.random=()=>0;
      window.__testNow=performance.now();Object.defineProperty(performance,'now',{configurable:true,value:()=>__testNow});
      window.__tick=ms=>{for(let left=ms;left>0;left-=20){const dt=Math.min(20,left);__testNow+=dt;tNow=__testNow;update(dt);updateLifeContentUi(__testNow);updateHunting(dt);}};
      window.__place=(x,y,face='up')=>{clearMovement();lifeUi.chop=null;Object.assign(player,{x,y,face,px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false,t:0});const c=getWorldCameraTarget();camX=c.x;camY=c.y;};
      window.__arena=(type='boar',face='down')=>{
        enterWorldRegion({to:'wildwoodHunt'});clearMovement();lifeUi.chop=null;
        for(const animal of huntingActors())Object.assign(animal,{hp:0,moving:false,mode:'down',respawnAt:1e12});
        let spot;for(let y=22;y<35&&!spot;y++)for(let x=22;x<44&&!spot;x++){
          let free=true;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(blocked.has(key(x+dx,y+dy))||regionExitAt(x+dx,y+dy))free=false;
          if(free)spot={x,y};
        }
        if(!spot)throw Error('No open combat arena');
        const a=type==='brak'?huntingBoss:huntingState.animals.find(a=>a.type===type),[dx,dy]=dirVec[face];
        Object.assign(a,{x:spot.x,y:spot.y,px:(spot.x+.5)*TILE,py:(spot.y+.5)*TILE,homeX:spot.x,homeY:spot.y,hp:huntingType(a).hp,mode:'aggro',face,moving:false,wait:1e9,windup:null,attackRecovery:null,lastHit:huntingState.clock,nextAttack:huntingState.clock});
        __place(a.x+dx,a.y+dy,{up:'down',down:'up',left:'right',right:'left'}[face]);
        huntingState.hp=100;huntingState.hurtUntil=0;huntingState.playerSwingUntil=0;
        GAME_STATE.appearance.activeTool='sword';GAME_STATE.progression.swords.swordId='sword.basic';
        updateHunting(0);if(!a.windup)throw Error('No attack windup');window.__a=a;return a;
      };
    });
    const stairs=await page.evaluate(()=>{
      const rows=[],sheet=document.createElement('canvas');sheet.width=780;sheet.height=450;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;
      for(const region of ['dungeonCrossroads',...DUNGEON_REGIONS.map(r=>r.id)]){
        enterWorldRegion({to:region});const door=WORLD_DEFINITION.dungeonDoors.find(d=>d.southExit);
        for(const direction of ['down','up'])for(const progress of [.1,.5,.9]){
          __place(door.x,direction==='down'?door.y-1:door.y,direction);tryMove(direction);update(player.duration*progress);tNow=__testNow;
          const order=[],originalImage=ctx.drawImage,originalPlayer=drawPlayer;
          ctx.drawImage=function(image,...args){if(image===imgs.dungeonSouthExit)order.push('stairs');return originalImage.call(this,image,...args);};
          drawPlayer=()=>{order.push('player');originalPlayer();};
          drawWorld();ctx.drawImage=originalImage;drawPlayer=originalPlayer;
          const actual=ctx.getImageData(0,0,canvas.width,canvas.height).data;
          drawPlayer=()=>{};drawWorld();drawPlayer=originalPlayer;
          const absent=ctx.getImageData(0,0,canvas.width,canvas.height).data;let visiblePixels=0;
          for(let i=0;i<actual.length;i+=4)if(actual[i]!==absent[i]||actual[i+1]!==absent[i+1]||actual[i+2]!==absent[i+2])visiblePixels++;
          const visual=typeof getDungeonStairVisual==='function'?getDungeonStairVisual():null;
          rows.push({region,direction,progress,visiblePixels,stairsBelowPlayer:order.indexOf('stairs')<order.indexOf('player'),drop:visual?.drop??null});
          drawWorld();if(region==='wildwoodHunt'){
            const col=[.1,.5,.9].indexOf(progress),row=direction==='down'?0:1,x=(door.x+.5)*TILE-camX,y=(door.y+1)*TILE-camY;
            c.fillStyle='#233d36';c.fillRect(col*260,row*225,260,225);c.drawImage(canvas,x-125,y-145,250,205,col*260,row*225+20,250,205);
            c.fillStyle='#fff2cf';c.font='14px sans-serif';c.fillText(direction+' '+Math.round(progress*100)+'%',col*260+8,row*225+16);
          }
        }
        __place(door.x,door.y-1,'down');tryMove('down');update(player.duration);
        rows.push({region,transition:GAME_STATE.regionId===door.to});
      }
      return {rows,image:sheet.toDataURL('image/png')};
    });
    fs.writeFileSync(path.join(out,`${before?'before':'after'}-${width}-stairs.png`),Buffer.from(stairs.image.split(',')[1],'base64'));delete stairs.image;
    const combat=await page.evaluate(()=>{
      const rows=[];
      for(const type of [...Object.keys(WILDLIFE_TYPES),'brak'])for(const face of ['down','up','left','right']){
        const side=['down','up'].includes(face)?'right':'down',opposite={right:'left',down:'up'}[side];
        for(const mode of ['standing','lateDodge','tooLate','returnIntoAttack']){
          const a=__arena(type,face),duration=huntingWindupMs(a),aim={x:a.windup.x,y:a.windup.y},damage=huntingType(a).damage;
          if(mode==='standing')__tick(duration);
          if(mode==='lateDodge'){__tick(duration-120);tryMove(side);__tick(120);}
          if(mode==='tooLate'){__tick(duration-40);tryMove(side);__tick(40);}
          if(mode==='returnIntoAttack'){tryMove(side);__tick(player.duration);tryMove(opposite);__tick(duration-player.duration);}
          rows.push({type,face,mode,hp:huntingState.hp,expected:mode==='lateDodge'?100:100-damage,
            moved:Math.hypot(player.px-aim.x,player.py-aim.y),recovery:!!a.attackRecovery,
            aimLocked:a.attackRecovery?.x===aim.x&&a.attackRecovery?.y===aim.y});
        }
      }
      const cancel=[];
      for(const tool of ['sword','axe','rod','sickle'])for(const elapsed of [200,300]){
        const a=__arena();a.mode='idle';a.windup=null;const initial=a.hp;
        GAME_STATE.appearance.activeTool=tool;
        if(!startHeldToolSwing())throw Error('Cannot start cancel scenario');__tick(elapsed-20);
        inputs.right=true;activeDir='right';__tick(20);clearMovement();
        const moved=player.moving,cancelled=!lifeUi.chop;__tick(player.duration);
        const throttled=!startHeldToolSwing();__tick(690-elapsed-player.duration);
        const notEarly=!startHeldToolSwing();__tick(11);const ready=startHeldToolSwing();
        cancel.push({tool,elapsed,moved,cancelled,throttled,notEarly,ready,damage:initial-a.hp,expectedDamage:elapsed<270?0:HUNTING_RULES.toolDamage[tool]});lifeUi.chop=null;
      }
      const a=__arena();a.mode='idle';a.windup=null;startHeldToolSwing();const attack=lifeUi.chop;
      tryMove('up');const blockedMoveKeepsSwing=lifeUi.chop===attack&&!player.moving;lifeUi.chop=null;
      const tree={};lifeUi.chop={tree,regionId:GAME_STATE.regionId,startedAt:__testNow,struck:false};tryMove('right');const treeStillLocked=lifeUi.chop?.tree===tree&&!player.moving;lifeUi.chop=null;
      return {rows,cancel,blockedMoveKeepsSwing,treeStillLocked};
    });
    // Exercise the actual input event route as well as the simulation above.
    await page.evaluate(()=>{const a=__arena();__tick(huntingWindupMs(a)-140);});
    let touch;
    if(width<500){
      const box=await page.locator('#joystick').boundingBox();touch=await context.newCDPSession(page);
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.9,y:box.y+box.height/2}]});
    }
    else await page.keyboard.down('ArrowRight');
    await page.evaluate(()=>__tick(140));
    const input=await page.evaluate(()=>({hp:huntingState.hp,moving:player.moving,displacement:player.px-__a.attackRecovery.x}));
    if(width<500){await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}else await page.keyboard.up('ArrowRight');
    if(!before){
      assert(stairs.rows.every(r=>r.transition??(r.visiblePixels>350&&r.stairsBelowPlayer&&r.drop!==null)),JSON.stringify(stairs.rows.filter(r=>!(r.transition??(r.visiblePixels>350&&r.stairsBelowPlayer&&r.drop!==null)))));
      for(const row of combat.rows)assert(row.hp===row.expected&&row.recovery&&row.aimLocked,JSON.stringify(row));
      for(const row of combat.cancel)assert(row.moved&&row.cancelled&&row.throttled&&row.notEarly&&row.ready&&row.damage===row.expectedDamage,JSON.stringify(row));
      assert(combat.blockedMoveKeepsSwing&&combat.treeStillLocked);assert(input.hp===100&&input.displacement>26.4,JSON.stringify(input));
      for(const region of ['dungeonCrossroads',...new Set(stairs.rows.map(r=>r.region))]){
        const down=stairs.rows.filter(r=>r.region===region&&r.direction==='down'),up=stairs.rows.filter(r=>r.region===region&&r.direction==='up');
        assert(down[0].drop<down[2].drop&&up[0].drop>up[2].drop,'Stair depth must follow actual ascent/descent');
      }
    }
    reports.push({width,stairs,combat,input});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,before?'before-report.json':'report.json'),JSON.stringify({base,reports,errors},null,2));
  console.log(before?'Recorded original stair occlusion, late-dodge damage and swing movement lock.':'Stairs/melee passed: 11 maps, visible ascent/descent, 6 combat species x 4 directions x 4 impact scenarios, cancel/no ghost hit/cadence, joystick/keyboard at 320/393/1280px.');
}finally{await browser.close();}
