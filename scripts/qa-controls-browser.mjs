import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/',out=process.argv[2]||'output/controls-tool-art-v4';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
  for(const [width,height] of [[393,780],[320,568],[430,932]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
    await page.evaluate(()=>{enterWorldRegion({to:'sunnyFields',entry:{x:18,y:30,face:'down'}});worldTime.minutes=12*60;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;});
    const size=await page.evaluate(()=>{
      const shell=document.getElementById('gameShell').getBoundingClientRect(),joy=document.getElementById('joystick').getBoundingClientRect(),action=document.getElementById('btnA').getBoundingClientRect();
      const thumb=document.getElementById('stick').getBoundingClientRect();
      return {shell:{left:shell.left,right:shell.right,top:shell.top,bottom:shell.bottom},joy:{left:joy.left,right:joy.right,top:joy.top,bottom:joy.bottom,width:joy.width,height:joy.height},action:{left:action.left,right:action.right,top:action.top,bottom:action.bottom,width:action.width,height:action.height},centerError:Math.abs(thumb.left+thumb.width/2-(joy.left+joy.width/2))+Math.abs(thumb.top+thumb.height/2-(joy.top+joy.height/2)),buttonText:document.getElementById('btnA').textContent.trim(),svg:!!document.querySelector('#btnA svg'),overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert(size.centerError<.01&&size.buttonText===''&&size.svg&&!size.overflow);
    assert(size.joy.right+14<=size.action.left&&size.action.width>=72&&size.action.height>=72);
    for(const box of [size.joy,size.action])assert(box.left>=size.shell.left&&box.right<=size.shell.right&&box.top>=size.shell.top&&box.bottom<=size.shell.bottom);
    const box=await page.locator('#joystick').boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
    const movement=[];
    for(const [direction,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]){
      await page.evaluate(()=>{resetJoystick();player.x=18;player.y=30;player.px=18*TILE+24;player.py=30*TILE+24;player.moving=false;});
      await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+dx*box.width*.42,cy+dy*box.height*.42);
      assert(await page.evaluate(direction=>inputs[direction],direction));
      await page.waitForFunction(([dx,dy])=>dx?Math.sign(player.x-18)===dx:Math.sign(player.y-30)===dy,[dx,dy]);
      await page.mouse.move(box.x-40,box.y-40);await page.mouse.up();
      await page.waitForFunction(()=>{const matrix=new DOMMatrix(getComputedStyle(stick).transform);return Object.values(inputs).every(value=>!value)&&matrix.m41===0&&matrix.m42===0;});
      movement.push(direction);
    }
    await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+30,cy);
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
    await page.waitForFunction(()=>{const matrix=new DOMMatrix(getComputedStyle(stick).transform);return Object.values(inputs).every(value=>!value)&&matrix.m41===0&&matrix.m42===0;});
    await page.evaluate(()=>{player.x=14;player.y=22;player.px=14*TILE+24;player.py=22*TILE+24;player.face='right';player.moving=false;const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();});
    await page.waitForTimeout(220);await page.screenshot({path:out+'/farm-'+width+'.png'});
    assert.equal(await page.locator('#btnA').getAttribute('data-action-icon'),'seed');
    assert.equal(await page.locator('#contextChip').innerText(),'심기');
    await page.locator('#btnA .actionIcon:visible, #btnA .actionToolIcon:visible').tap();
    assert(await page.evaluate(()=>isFarmPlotOpen()));
    await page.locator('#lifeClose').click();await page.waitForFunction(()=>!isFarmPlotOpen()&&!window.history.state?.pixelLifeOverlay);
    await page.locator('#btnA').tap({position:{x:size.action.width/2,y:size.action.height-16}});
    assert(await page.evaluate(()=>isFarmPlotOpen()));
    await page.locator('#lifeClose').click();await page.waitForFunction(()=>!isFarmPlotOpen()&&!window.history.state?.pixelLifeOverlay);
    await page.locator('#menuBtn').tap();assert(await page.evaluate(()=>menuOpen));
    await page.locator('#closeMenu').tap();assert(await page.evaluate(()=>!menuOpen));
    const readAction=async()=>{
      await page.waitForFunction(()=>{
        const button=document.getElementById('btnA'),image=button.querySelector('.actionToolIcon');
        return image.hidden||(image.complete&&image.naturalWidth===96&&image.currentSrc===characterToolImgs[button.dataset.actionTool]?.currentSrc);
      });
      return page.evaluate(()=>{
        const button=document.getElementById('btnA'),image=button.querySelector('.actionToolIcon');
        return {icon:button.dataset.actionIcon,label:document.getElementById('contextChip').textContent,visible:document.getElementById('contextChip').classList.contains('show'),aria:button.getAttribute('aria-label'),toolKey:button.dataset.actionTool||null,
          toolVisible:!image.hidden,toolMatchesCharacter:!image.hidden&&image.currentSrc===characterToolImgs[button.dataset.actionTool]?.currentSrc};
      });
    };
    await page.evaluate(()=>{GAME_STATE.world.plots.farm_01={unlocked:true,cropId:'carrot',plantedAt:Date.now()-20000};refreshContext();});
    const growing=await readAction();assert.equal(growing.icon,'seed');assert.equal(growing.label,'살펴보기');
    await page.evaluate(()=>{GAME_STATE.world.plots.farm_01.plantedAt=Date.now()-180000;GAME_STATE.appearance.activeTool='axe';refreshContext();});
    const unarmed=await readAction();assert.equal(unarmed.icon,'sickle');assert.equal(unarmed.label,'낫 장착 필요');
    await page.evaluate(()=>{GAME_STATE.appearance.activeTool='sickle';refreshContext();});
    const harvest=await readAction();assert.equal(harvest.icon,'sickle');assert.equal(harvest.label,'수확');
    await page.waitForTimeout(220);await page.screenshot({path:out+'/harvest-'+width+'.png'});
    assert.equal(harvest.toolKey,'sickle.basic');assert(harvest.toolMatchesCharacter);
    await page.locator('#btnA .actionIcon:visible, #btnA .actionToolIcon:visible').tap();await page.waitForFunction(()=>getFarmPlotPhase(farmPlotAt(15,22))==='EMPTY');
    assert(await page.evaluate(()=>lifeItemCount('crop','carrot')>=2));
    await page.evaluate(()=>{
      const plot=WORLD_DEFINITION.farmPlots.find(plot=>getFarmPlotPhase(plot)==='LOCKED');
      player.x=plot.x-1;player.y=plot.y;player.px=player.x*TILE+24;player.py=player.y*TILE+24;player.face='right';player.moving=false;refreshContext();
    });
    const locked=await readAction();assert.equal(locked.icon,'basket');assert.equal(locked.label,'부지 구매');
    await page.evaluate(()=>{
      enterWorldRegion({to:'oldForest',entry:{x:25,y:3,face:'down'}});
      GAME_STATE.appearance.activeTool='axe';
      const tree=trees.find(t=>t.interactable&&FORESTRY_TREES[t.species].tier===1&&Object.values(dirVec).some(([dx,dy])=>!isBlocked(t.x-dx,t.y-dy)));
      const [face,[dx,dy]]=Object.entries(dirVec).find(([, [dx,dy]])=>!isBlocked(tree.x-dx,tree.y-dy));
      player.x=tree.x-dx;player.y=tree.y-dy;player.px=player.x*TILE+24;player.py=player.y*TILE+24;player.face=face;player.moving=false;
      const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;refreshContext();drawWorld();
    });
    const chop=await readAction();assert.equal(chop.icon,'axe');assert.equal(chop.label,'벌목');
    await page.waitForTimeout(220);await page.screenshot({path:out+'/logging-'+width+'.png'});
    await page.evaluate(()=>{GAME_STATE.appearance.activeTool='sword';refreshContext();});
    const sword=await readAction();assert.equal(sword.icon,'sword');assert.equal(sword.label,'검 휘두르기');
    await page.evaluate(()=>{enterWorldRegion({to:'sunnyFields',entry:{x:26,y:20,face:'right'}});GAME_STATE.appearance.activeTool='rod';refreshContext();const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();});
    const fish=await readAction();assert.equal(fish.icon,'rod');assert.equal(fish.label,'낚시');
    await page.waitForTimeout(220);await page.screenshot({path:out+'/fishing-'+width+'.png'});
    assert.equal(fish.toolKey,'rod.basic');assert(fish.toolMatchesCharacter);
    await page.locator('#btnA .actionIcon:visible, #btnA .actionToolIcon:visible').tap();await page.waitForFunction(()=>isFishingActive());
    assert.equal((await readAction()).icon,'rod');
    await page.evaluate(()=>{updateFishing(320);updateFishing(7000);refreshContext();});
    const bite=await readAction();assert.equal(bite.icon,'rod');assert.equal(bite.label,'낚기');
    await page.locator('#fishingCancelBtn').tap();await page.waitForFunction(()=>!isFishingActive());
    await page.evaluate(()=>{
      enterWorldRegion({to:'lilacVillage',entry:{x:42,y:31,face:'up'}});
      const npc=npcs.find(n=>!['elli','jun'].includes(n.id)&&!['stylist','farmMerchant','captain','voyageCaptain'].includes(n.role));
      const [face,[dx,dy]]=Object.entries(dirVec).find(([, [dx,dy]])=>!isBlocked(npc.x-dx,npc.y-dy));
      player.x=npc.x-dx;player.y=npc.y-dy;player.px=player.x*TILE+24;player.py=player.y*TILE+24;player.face=face;player.moving=false;refreshContext();const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;drawWorld();
    });
    const talk=await readAction();assert.equal(talk.icon,'chat');assert.equal(talk.label,'대화');
    await page.locator('#btnA .actionIcon:visible, #btnA .actionToolIcon:visible').tap();assert(await page.evaluate(()=>dialogOpen));
    await page.waitForFunction(()=>document.getElementById('btnA').dataset.actionIcon==='confirm');
    await page.evaluate(()=>closeDialog());
    await page.evaluate(()=>{enterWorldRegion({to:'sunnyFields',entry:{x:18,y:30,face:'down'}});GAME_STATE.appearance.activeTool='none';refreshContext();});
    const idle=await readAction();assert.equal(idle.icon,'hand');assert.equal(idle.label,'');assert(!idle.visible);
    assert(!idle.toolVisible&&!talk.toolVisible&&chop.toolMatchesCharacter&&sword.toolMatchesCharacter);
    const variants=[];
    const groups=await page.evaluate(()=>{
      GAME_STATE.progression.forestry.ownedAxeIds=FORESTRY_AXES.map(item=>item.id);
      GAME_STATE.progression.fishing.purchasedRodIds=FISHING_RODS.map(item=>item.id);GAME_STATE.progression.flags.masterRod=true;
      return {axe:FORESTRY_AXES.map(item=>item.id),rod:FISHING_RODS.map(item=>item.id)};
    });
    for(const [tool,ids] of Object.entries(groups))for(const id of ids){
      await page.evaluate(({tool,id})=>{
        GAME_STATE.appearance.activeTool=tool;
        if(tool==='axe')GAME_STATE.progression.forestry.axeId=id;else GAME_STATE.progression.fishing.equippedRodId=id;
        refreshContext();
      },{tool,id});
      const variant=await readAction();assert.equal(variant.icon,tool);assert.equal(variant.toolKey,id);assert(variant.toolMatchesCharacter);variants.push(id);
    }
    assert.equal(variants.length,20);
    reports.push({width,height,size,movement,releaseOutside:true,blurReset:true,iconTap:true,edgeTap:true,menuTap:true,contexts:{growing,unarmed,harvest,locked,chop,sword,fish,bite,talk,idle},toolVariants:variants,realHarvest:true,realFishingAndCancel:true,realConversation:true});await context.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({base,errors,reports},null,2)+'\n');
  console.log('Controls verified: 393/320/430px, round shape/movement preserved, matching character sickle/axe/rod/sword art and all 20 axe/rod variants, correct hints and real harvest/fishing/cancel/conversation, no button text or overlap.');
}finally{await browser.close();}
