import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/dist/index.html',out=path.resolve(process.argv[2]||'output/tool-swing-qa/browser');
fs.mkdirSync(out,{recursive:true});
// Keep the pre-extension baseline stable after this change is committed.
const previous=execFileSync('git',['show','ad6a82d:src/character.js'],{encoding:'utf8'});
const oldTransform=previous.slice(previous.indexOf('function getCharacterToolTransform('),previous.indexOf('function drawCharacterTool('));
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
  for(const [width,height]of [[393,780],[320,568],[1280,800]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.evaluate(()=>{
      applySaveData(createSaveData());worldTime.debugLocked=true;worldTime.minutes=720;weatherState.debugLocked=true;weatherState.kind='clear';
      window.__placeFree=()=>{
        clearMovement();for(let y=3;y<40;y++)for(let x=3;x<52;x++){
          if(isBlocked(x,y))continue;Object.assign(player,{x,y,px:(x+.5)*TILE,py:(y+.5)*TILE,moving:false});
          if(['down','right','left','up'].every(face=>{player.face=face;return !resolveWorldInteraction();})){player.face='down';refreshContext();return;}
        }throw Error('No free test location');
      };__placeFree();
    });
    // Real touch/click and keyboard input must all reach the common free swing.
    for(const kind of ['axe','rod','sickle','sword']){
      await page.locator('[data-quick-tool="'+kind+'"]').click();await page.evaluate(()=>{__placeFree();refreshContext();});
      const before=await page.evaluate(()=>JSON.stringify(createSaveData().state));
      if(width<500)await page.locator('#btnA').tap();else{await page.locator('#game').click();await page.keyboard.press('Space');}
      assert.equal(await page.evaluate(()=>lifeUi.chop?.mode|| (lifeUi.chop?'axe':null)),kind);
      assert.equal(await page.evaluate(()=>getCharacterPose().tool),kind);
      assert.equal(await page.evaluate(()=>startHeldToolSwing()),false,'Repeated input must not restart the action');
      await page.evaluate(()=>{updateLifeContentUi(lifeUi.chop.startedAt+701);refreshContext();});
      assert.equal(await page.evaluate(()=>isChoppingTree()),false);
      assert.equal(await page.evaluate(()=>JSON.stringify(createSaveData().state)),before,'Free swing changed saved game');
    }
    const matrix=await page.evaluate(oldSource=>{
      const old=Function('return ('+oldSource+')')(),faces=['down','right','left','up'],appearance=GAME_STATE.appearance,oldTime=tNow;
      GAME_STATE.progression.forestry.ownedAxeIds=FORESTRY_AXES.map(a=>a.id);
      GAME_STATE.progression.fishing.purchasedRodIds=FISHING_RODS.map(r=>r.id);GAME_STATE.progression.flags.masterRod=true;
      for(const a of FORESTRY_AXES)GAME_STATE.progression.forestry.durabilityByAxeId[a.id]=a.maxDurability;
      for(const r of FISHING_RODS)GAME_STATE.progression.fishing.durabilityByRodId[r.id]=r.maxDurability;
      const rows=[...FORESTRY_AXES.map(a=>({kind:'axe',id:a.id})),...FISHING_RODS.map(r=>({kind:'rod',id:r.id})),{kind:'sickle',id:FARM_SICKLE.id},...SWORDS.map(s=>({kind:'sword',id:s.id}))];
      const equip=row=>{GAME_STATE.appearance={...appearance,activeTool:row.kind};if(row.kind==='axe')GAME_STATE.progression.forestry.axeId=row.id;if(row.kind==='rod')GAME_STATE.progression.fishing.equippedRodId=row.id;if(row.kind==='sword')GAME_STATE.progression.swords.swordId=row.id;};
      let transforms=0,swings=0,frontFrames=0;const sheets=[];
      try{
        for(const row of rows){
          equip(row);
          for(const face of faces)for(const name of ['walk',row.kind==='rod'?'fish':row.kind==='sword'?'sword':row.kind==='sickle'?'sickle':'chop']){
            const count=getCharacterActionDefinition(name).columns;
            for(let frame=0;frame<count;frame++){
              const pose={pose:name,face,frame,tool:row.kind};
              if(JSON.stringify(old(100,100,pose))!==JSON.stringify(getCharacterToolTransform(100,100,pose)))throw Error('Existing tool transform changed '+row.id+'/'+name+'/'+face+'/'+frame);
              transforms++;
            }
          }
          for(const bodyId of ['body.starter','body.female'])for(const face of faces){
            GAME_STATE.appearance={...GAME_STATE.appearance,bodyId,hairId:bodyId==='body.female'?'hair.female.brown':'hair.brown'};player.face=face;
            const before=JSON.stringify(createSaveData().state),stored=localStorage.getItem(SAVE_CONFIG.key),random=Math.random;
            try{
              Math.random=()=>{throw Error('Free swing consumed gameplay randomness');};
              if(!startHeldToolSwing())throw Error('Cannot swing '+row.id);
              for(const frame of [0,1]){
                tNow=lifeUi.chop.startedAt+(frame?300:0);const pose=getCharacterPose(),transform=getCharacterToolTransform(100,100,pose),definition=getCharacterActionDefinition(pose.pose);
                if(pose.tool!==row.kind||pose.frame!==frame||!transform||!Number.isFinite(transform.tip.x))throw Error('Invalid swing '+row.id);
                if(Math.abs(transform.x-(100+(definition.frames[face][frame].grip[0]-48)*100/96))>1e-7)throw Error('Hand grip moved');
                if(face==='down'){
                  const grip=definition.frames.down[frame].grip;
                  if(Math.abs(transform.y-(120+(grip[1]-88)*100/96))>1e-7)throw Error('Front hand height moved');
                  if(frame===0&&transform.tip.y>=transform.y||frame===1&&transform.tip.y<=transform.y)throw Error('Front swing reversed '+row.id);
                  frontFrames++;
                }
                drawCharacterActor(100,100,pose);
              }
              updateLifeContentUi(lifeUi.chop.startedAt+701);
              if(lifeUi.chop||JSON.stringify(createSaveData().state)!==before||stored!==localStorage.getItem(SAVE_CONFIG.key))throw Error('Free swing mutated state '+row.id);
              swings++;
            }finally{Math.random=random;lifeUi.chop=null;}
          }
        }
        // Actual actor composites for both bodies, all directions and both frames.
        for(const kind of ['axe','rod','sickle','sword'])for(const bodyId of ['body.starter','body.female']){
          equip(rows.find(r=>r.kind===kind));GAME_STATE.appearance={...GAME_STATE.appearance,bodyId,hairId:bodyId==='body.female'?'hair.female.brown':'hair.brown'};
          const sheet=document.createElement('canvas');sheet.width=760;sheet.height=340;const target=sheet.getContext('2d');target.fillStyle='#71967d';target.fillRect(0,0,760,340);target.imageSmoothingEnabled=false;
          for(let f=0;f<4;f++)for(let frame=0;frame<2;frame++){
            ctx.save();ctx.clearRect(0,0,540,960);drawCharacterActor(90,120,{pose:kind==='rod'?'rodSwing':kind==='axe'?'chop':kind,face:faces[f],frame,tool:kind});ctx.restore();
            target.drawImage(canvas,0,0,180,170,f*190,frame*170,180,170);
          }sheets.push({kind,bodyId,image:sheet.toDataURL()});
        }
      }finally{GAME_STATE.appearance=appearance;tNow=oldTime;lifeUi.chop=null;}
      return {transforms,swings,frontFrames,items:rows.length,sheets};
    },oldTransform);
    assert.equal(matrix.items,22);assert.equal(matrix.swings,176);assert.equal(matrix.transforms,480);assert.equal(matrix.frontFrames,88);
    if(width===393)for(const s of matrix.sheets)fs.writeFileSync(path.join(out,s.kind+'-'+s.bodyId+'.png'),Buffer.from(s.image.split(',')[1],'base64'));
    const safety=await page.evaluate(()=>{
      __placeFree();const active=GAME_STATE.appearance;GAME_STATE.appearance={...active,activeTool:'rod'};
      const before=JSON.stringify(createSaveData().state);
      for(const lock of ['moving','menu','dialog','fishing']){
        if(lock==='moving')player.moving=true;if(lock==='menu')menuOpen=true;if(lock==='dialog')dialogOpen=true;if(lock==='fishing')fishingState.phase='casting';
        if(startHeldToolSwing())throw Error('Swing ignored '+lock);
        player.moving=false;menuOpen=false;dialogOpen=false;fishingState.phase='idle';
      }
      const rod=FISHING_RODS[1];GAME_STATE.progression.fishing.equippedRodId=rod.id;GAME_STATE.progression.fishing.durabilityByRodId[rod.id]=0;
      if(startHeldToolSwing())throw Error('Broken rod swung');GAME_STATE.progression.fishing.durabilityByRodId[rod.id]=rod.maxDurability;
      GAME_STATE.appearance={...active,activeTool:'none'};if(startHeldToolSwing())throw Error('Empty hand became a weapon');
      GAME_STATE.appearance={...active,activeTool:'rod'};
      // A different held tool at a tree swings without harming the tree.
      enterWorldRegion({to:'oldForest'},{skipSave:true});const tree=trees.find(t=>t.interactable);
      Object.assign(player,{x:tree.x-1,y:tree.y,px:(tree.x-.5)*TILE,py:(tree.y+.5)*TILE,face:'right',moving:false});
      const treeState=JSON.stringify(getTreeState(tree));interact();if(lifeUi.chop?.mode!=='rod')throw Error('Wrong tool did not swing');
      updateLifeContentUi(lifeUi.chop.startedAt+701);if(JSON.stringify(getTreeState(tree))!==treeState)throw Error('Rod damaged tree');
      // Regular fishing is still the water interaction; a swing never casts.
      enterWorldRegion({to:'lilacVillage'},{skipSave:true});const spot=WORLD_DEFINITION.fishingSpot;
      Object.assign(player,{x:spot.x-1,y:spot.y,px:(spot.x-.5)*TILE,py:(spot.y+.5)*TILE,face:'right',moving:false});
      if(!getFishingSpotInFront())throw Error('Fishing test position');interact();if(!isFishingActive()||lifeUi.chop)throw Error('Water interaction did not cast');finishFishing();
      // A ready plot still harvests once, and no free action substitutes for it.
      enterWorldRegion({to:'sunnyFields',entry:{x:14,y:22,face:'right'}},{skipSave:true});const plot=farmPlotAt(15,22),crop=LIFE_CONTENT.crops[0];
      GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:crop.id,plantedAt:Date.now()-crop.growMs-1000};GAME_STATE.appearance={...active,activeTool:'sickle'};
      const xp=GAME_STATE.progression.farming.totalXp;interact();if(lifeUi.chop?.plot!==plot)throw Error('Ready crop did not start harvest');
      updateLifeContentUi(lifeUi.chop.startedAt+701);if(getFarmPlotPhase(plot)!=='EMPTY'||GAME_STATE.progression.farming.totalXp!==xp+farmingCropXp(crop))throw Error('Harvest changed');
      return {busyGuards:true,brokenGuard:true,emptyHands:true,treeSafe:true,fishing:true,harvest:true};
    });
    reports.push({width,height,items:matrix.items,swings:matrix.swings,frontFrames:matrix.frontFrames,existingTransforms:matrix.transforms,...safety});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,reports,errors},null,2)+'\n');
  console.log('Tool swings passed: 22 items, both bodies/four directions, 480 existing transforms, touch/Space, no free-action rewards/wear/save/RNG, guards and fishing/harvest.');
}finally{await browser.close();}
