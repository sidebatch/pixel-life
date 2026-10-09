import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/forest-routes-qa');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
const ready=page=>page.waitForFunction(()=>typeof connectForestEntrances==='function'&&!document.getElementById('startupLoading'));
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base,{timeout:60000});await ready(page);
  await page.evaluate(()=>{
   worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
   globalThis.walkForestRoute=to=>{
    const source=GAME_STATE.regionId,exit=REGION_EXITS[source].find(e=>e.to===to);
    if(!exit)throw Error('Missing route '+source+' to '+to);
    for(const n of npcs){n.moving=false;n.wait=1e9;n.px=n.x*TILE+24;n.py=n.y*TILE+24;}
    clearMovement();player.moving=false;
    const queue=[{x:player.x,y:player.y}],previous=new Map([[key(player.x,player.y),null]]);
    let goal=null;
    for(let i=0;i<queue.length;i++){
     const point=queue[i];
     if(point.x===exit.x&&point.y===exit.y){goal=point;break;}
     for(const [dir,dx,dy] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]){
      const x=point.x+dx,y=point.y+dy,k=key(x,y);
      if(isBlocked(x,y)||previous.has(k)||(regionExitAt(x,y)&&!(x===exit.x&&y===exit.y)))continue;
      previous.set(k,{point,dir});queue.push({x,y});
     }
    }
    if(!goal)throw Error('Unreachable walk '+source+' to '+to);
    const steps=[];let point=goal;
    while(previous.get(key(point.x,point.y))){const p=previous.get(key(point.x,point.y));steps.push(p.dir);point=p.point;}
    for(const dir of steps.reverse()){tryMove(dir);if(!player.moving)throw Error('Movement refused '+source);update(player.duration+1);}
    if(GAME_STATE.regionId!==to||player.x!==exit.entry.x||player.y!==exit.entry.y)throw Error('Bad arrival '+source+' to '+to);
    if(isBlocked(player.x,player.y))throw Error('Blocked arrival '+to);
    clearMovement();for(let tick=0;tick<12;tick++)update(100);
    if(GAME_STATE.regionId!==to)throw Error('Instant return loop '+to);
    return {source,to,steps:steps.length,x:player.x,y:player.y,face:player.face};
   };
  });
  const itinerary=['oldForest','forestSeven','oldForest','forestEight','oldForest','forestNine','oldForest',
   'deepForest','forestThree','forestFour','forestFive','forestSix','forestFive','forestFour','forestThree','deepForest','oldForest',
   'mountainLake','oldForest','lilacVillage','forestTen','forestEleven','forestTwelve','forestEleven','forestTen','lilacVillage'];
  const journeys=[];
  for(const to of itinerary){
   journeys.push(await page.evaluate(to=>walkForestRoute(to),to));
   if(['oldForest','deepForest','forestThree','forestFour','forestFive','forestTen'].includes(to)){
    await page.waitForTimeout(80);await page.screenshot({path:path.join(out,width+'-'+to+'-arrival.png')});
   }
  }
  assert(await page.evaluate(()=>typeof getNearbyForestExitGuides==='undefined'&&typeof drawForestExitGuides==='undefined'),'Floating route UI must be removed');
  assert.deepEqual(await page.evaluate(()=>[imgs.routeSign.naturalWidth,imgs.routeSign.naturalHeight]),[144,111]);
  let postsRead=0;
  for(const id of ['lilacVillage','oldForest','deepForest','forestThree','forestFour','forestFive','forestSix','forestSeven','forestEight','forestNine','forestTen','forestEleven','forestTwelve']){
   const count=await page.evaluate(id=>{
    enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn},{skipSave:true});
    const before=JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory,collections:GAME_STATE.collections});
    for(const post of routeSigns){
     const option=[['up',0,1],['down',0,-1],['left',1,0],['right',-1,0]].find(([,dx,dy])=>!isBlocked(post.x+dx,post.y+dy));
     if(!option)throw Error('No reading position '+post.id);
     player.x=post.x+option[1];player.y=post.y+option[2];player.px=player.x*TILE+24;player.py=player.y*TILE+24;player.face=option[0];player.moving=false;
     const interaction=resolveWorldInteraction();
     if(interaction?.kind!=='routeSign'||interaction.target.id!==post.id)throw Error('Wrong sign interaction');
     activateWorldInteraction(interaction);
     if(!dialogOpen||document.getElementById('dialogText').textContent!==post.arrow+' '+post.label)throw Error('Wrong sign text');
     closeDialog();tryMove(option[0]);if(player.moving)throw Error('Player walked through wooden post');
    }
    if(JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory,collections:GAME_STATE.collections})!==before)throw Error('Reading signs changed progress');
    return routeSigns.length;
   },id);postsRead+=count;
  }
  assert.equal(postsRead,27);
  for(const [id,to] of [['lilacVillage','oldForest'],['lilacVillage','forestTen'],['oldForest','forestSeven'],['oldForest','forestEight'],['oldForest','forestNine'],['oldForest','deepForest']]){
   const start=await page.evaluate(({id,to})=>{
    enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn},{skipSave:true});
    const post=routeSigns.find(s=>s.to===to),point={x:post.x+2,y:post.y+1};
    if(isBlocked(point.x,point.y)){point.x=post.x;point.y=post.y+2;}
    if(isBlocked(point.x,point.y))throw Error('Screenshot approach blocked');
    player.x=point.x;player.y=point.y;player.px=point.x*TILE+24;player.py=point.y*TILE+24;player.moving=false;
    const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;
    return {x:post.x,y:post.y};
   },{id,to});
   await page.waitForTimeout(80);await page.screenshot({path:path.join(out,width+'-'+id+'-'+to+'-sign.png')});
   const fixed=await page.evaluate(to=>{const s=routeSigns.find(s=>s.to===to);return {x:s.x,y:s.y};},to);assert.deepEqual(fixed,start);
  }
  // Existing partial/chopped tree and equipment/XP/collection records survive routing and reload.
  const saved=await page.evaluate(()=>{
   enterWorldRegion({to:'oldForest',entry:{x:25,y:3,face:'down'}},{skipSave:true});
   GAME_STATE.progression.forestry={axeId:'axe.iron',ownedAxeIds:['axe.basic','axe.iron'],durabilityByAxeId:{'axe.iron':126}};
   GAME_STATE.appearance.activeTool='axe';GAME_STATE.progression.coins=9876;
   GAME_STATE.progression.logging={...lifeSkillProgressFromTotal('logging',777),mastery:0,masteryXp:0};
   const first=trees.find(t=>t.id==='forest_tree_01'),second=trees.find(t=>t.id==='forest_tree_02'),now=Date.now();
   GAME_STATE.world.trees[first.id]={hp:50,maxHp:100,choppedAt:null};
   GAME_STATE.world.trees[second.id]={hp:0,maxHp:100,choppedAt:now};
   GAME_STATE.collections.trees.oak={species:'oak',name:FOREST_WOOD.oak,count:7};
   GAME_STATE.inventory=[{type:'material',id:'oak_log',name:FOREST_WOOD.oak,quantity:11}];
   globalThis.forestSaveExpected=JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory,
    logging:GAME_STATE.progression.logging,forestry:GAME_STATE.progression.forestry,record:GAME_STATE.collections.trees.oak});
   if(!saveGame())throw Error('Initial forest save failed');return forestSaveExpected;
  });
  await page.reload({timeout:60000});await ready(page);
  assert.equal(await page.evaluate(()=>JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory,
   logging:GAME_STATE.progression.logging,forestry:GAME_STATE.progression.forestry,record:GAME_STATE.collections.trees.oak})),saved);
  assert.deepEqual(await page.evaluate(()=>[getTreeState(trees.find(t=>t.id==='forest_tree_01')).hp,getTreeState(trees.find(t=>t.id==='forest_tree_02')).hp]),[50,0]);
  assert.deepEqual(await page.evaluate(()=>[GAME_STATE.regionId,player.x,player.y]),['oldForest',25,3]);
  await page.evaluate(()=>{
   const legacy=createSaveData(),post=routeSigns[0];
   legacy.state.location={regionId:'oldForest',x:post.x,y:post.y,face:'down'};
   localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(legacy));
  });
  await page.reload({timeout:60000});await ready(page);
  assert.deepEqual(await page.evaluate(()=>[GAME_STATE.regionId,player.x,player.y]),['oldForest',25,3]);
  assert.equal(await page.evaluate(()=>JSON.stringify({coins:GAME_STATE.progression.coins,inventory:GAME_STATE.inventory,
   logging:GAME_STATE.progression.logging,forestry:GAME_STATE.progression.forestry,record:GAME_STATE.collections.trees.oak})),saved);
  // The final ordinary forest and all three fantasy forests keep the prior tool restrictions.
  const gates=await page.evaluate(()=>['forestNine','forestTen','forestEleven','forestTwelve'].map(id=>{
   enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn},{skipSave:true});
   const tree=trees.find(t=>t.interactable),hp=getTreeState(tree).hp;
   const accepted=hitResourceTree(tree);
   if(accepted||getTreeState(tree).hp!==hp)throw Error('Lower axe accepted in '+id);
   return id;
  }));
  reports.push({width,journeys,gates,postsRead,legacySave:true,postLocationFallback:true});console.log(width+'px forest routes passed: '+journeys.length+' actual walks, 27 planted signs/read/collision, save intact/post fallback, tool limits retained');
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
}finally{await browser.close();}
