import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',output=path.resolve(process.argv[2]||'output/village-polish-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[];
const ready=page=>page.waitForFunction(()=>typeof drawNaturalPlazas==='function'&&!document.getElementById('startupLoading'));
try{
  for(const width of [393,320]){
    const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base,{timeout:60000});await ready(page);
    const report=await page.evaluate(()=>{
      const queue=[WORLD_DEFINITION.playerSpawn],seen=new Set([key(queue[0].x,queue[0].y)]);
      for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=queue[i].x+dx,y=queue[i].y+dy,k=key(x,y);
        if(!inside(x,y)||blocked.has(k)||seen.has(k))continue;seen.add(k);queue.push({x,y});
      }
      if(buildings.some(b=>!seen.has(key(b.entrance.approach.x,b.entrance.approach.y))))throw Error('Unreachable building approach');
      if(npcs.some(n=>!seen.has(key(n.x,n.y))))throw Error('Unreachable resident');
      if(REGION_EXITS.lilacVillage.some(e=>!seen.has(key(e.x,e.y))))throw Error('Exit blocked');
      for(const b of buildings){
        if(!blocked.has(key(b.entrance.door.x,b.entrance.door.y))||blocked.has(key(b.entrance.approach.x,b.entrance.approach.y)))throw Error('Door collision invalid');
        if(!imgs[b.sprite]?.complete||!imgs[b.sprite].naturalWidth)throw Error('Building art missing');
      }
      for(const id of ['luca','sora','eden'])if(npcImgs[id].naturalWidth!==288)throw Error('NPC sheet missing');
      worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
      return {buildings:buildings.length+1,residents:npcs.length,reachable:seen.size};
    });
    assert.equal(report.buildings,8);assert.equal(report.residents,9);
    for(const [name,x,y] of [['plaza',25,25],['inn',10,21],['hall',31,12],['atelier',15,35],['garden',8,42],['veranda',17,42]]){
      await page.evaluate(({x,y})=>{clearMovement();player.x=x;player.y=y;player.px=x*TILE+24;player.py=y*TILE+24;player.face='up';const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;}, {x,y});
      await page.waitForTimeout(100);await page.screenshot({path:path.join(output,width+'-'+name+'.png')});
    }
    for(const id of ['village_hall','hearth_inn','thread_atelier','garden_cottage','veranda_home']){
      const interaction=await page.evaluate(id=>{
        const b=buildings.find(b=>b.id===id);player.x=b.entrance.approach.x;player.y=b.entrance.approach.y;
        player.px=player.x*TILE+24;player.py=player.y*TILE+24;player.face='up';
        return resolveWorldInteraction()?.kind+':'+resolveWorldInteraction()?.label;
      },id);assert.equal(interaction,'building:살펴보기');
    }
    for(const [x,y,kind] of [[29,39,'market'],[30,21,'workshopMarket'],[31,28,'characterStyle']]){
      assert.equal(await page.evaluate(({x,y})=>{player.x=x;player.y=y;player.face='up';return resolveWorldInteraction()?.kind;},{x,y}),kind);
    }
    for(const id of ['luca','sora','eden']){
      assert.equal(await page.evaluate(id=>{
        const n=npcs.find(n=>n.id===id),options=[['up',0,1],['down',0,-1],['left',1,0],['right',-1,0]];
        const option=options.find(([,dx,dy])=>!isBlocked(n.x+dx,n.y+dy));
        if(!option)throw Error('Resident cannot be approached');
        player.x=n.x+option[1];player.y=n.y+option[2];player.face=option[0];
        const interaction=resolveWorldInteraction();activateWorldInteraction(interaction);
        const opened=dialogOpen;closeDialog();return opened&&interaction.target.id===id;
      },id),true);
    }
    await page.evaluate(()=>{worldTime.minutes=1320;weatherState.kind='rain';});
    await page.screenshot({path:path.join(output,width+'-night-rain.png')});
    await page.evaluate(()=>{
      clearMovement();player.x=25;player.y=28;player.px=25*TILE+24;player.py=28*TILE+24;
      for(let i=0;i<1500;i++)updateNPCs(120);
      if(npcs.some(n=>blocked.has(key(n.x,n.y))||buildings.some(b=>b.entrance.approach.x===n.x&&b.entrance.approach.y===n.y)))throw Error('NPC blocks entrance');
      if(npcs.filter(n=>['luca','sora','eden'].includes(n.id)).some(n=>Math.abs(n.x-n.homeX)+Math.abs(n.y-n.homeY)>n.roam))throw Error('Resident left home neighborhood');
      GAME_STATE.progression.coins=123456;
      GAME_STATE.inventory.push({type:'material',id:'oak_log',name:FOREST_WOOD.oak,quantity:7});
      const save=createSaveData();save.state.location={regionId:'lilacVillage',x:10,y:17,face:'down'};
      globalThis.townSaveExpected=JSON.stringify(save.state.inventory);
      localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(save));
    });
    const expected=await page.evaluate(()=>townSaveExpected);
    await page.reload({timeout:60000});await ready(page);
    assert.equal(await page.evaluate(()=>GAME_STATE.progression.coins),123456);
    assert.equal(await page.evaluate(()=>JSON.stringify(GAME_STATE.inventory)),expected);
    assert.deepEqual(await page.evaluate(()=>[player.x,player.y]),[25,28]);
    await page.evaluate(()=>{enterWorldRegion({to:'coast',entry:{x:39,y:25,face:'down'}},{skipSave:true});worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;});
    await page.waitForTimeout(100);await page.screenshot({path:path.join(output,width+'-harbor.png')});
    assert(await page.evaluate(()=>GAME_STATE.regionId==='coast'&&!!npcs.find(n=>n.role==='captain')));
    await context.close();console.log(width+'px village browser QA passed: '+JSON.stringify(report));
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
