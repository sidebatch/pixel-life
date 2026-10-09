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
  const itinerary=['oldForest','deepForest','oldForest','forestThree','oldForest','forestFour','oldForest',
   'forestFive','forestSix','forestSeven','forestEight','forestNine','forestEight','forestSeven','forestSix','forestFive','oldForest',
   'mountainLake','oldForest','lilacVillage','forestTen','forestEleven','forestTwelve','forestEleven','forestTen','lilacVillage'];
  const journeys=[];
  for(const to of itinerary){
   journeys.push(await page.evaluate(to=>walkForestRoute(to),to));
   if(['oldForest','deepForest','forestThree','forestFour','forestFive','forestTen'].includes(to)){
    await page.waitForTimeout(80);await page.screenshot({path:path.join(out,width+'-'+to+'-arrival.png')});
   }
  }
  // Boundary destination labels must match both village entrances and branch junctions.
  for(const [name,to,x,y] of [['village-south','lilacVillage',25,44],['village-north','lilacVillage',25,3],['first-north-fork','oldForest',20,3],['first-west','oldForest',3,36],['first-east','oldForest',60,40]]){
   await page.evaluate(({to,x,y})=>{enterWorldRegion({to,entry:{x,y,face:'down'}},{skipSave:true});const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;},{to,x,y});
   const guides=await page.evaluate(()=>getNearbyForestExitGuides());
   assert(guides.length>0,'Nearby destination guide must remain readable');
   assert(guides.every(g=>g.x-g.width/2>=8&&g.x+g.width/2<=540-8&&g.y>=160&&g.y<=540));
   assert(await page.evaluate(()=>{
    const canvasRect=document.getElementById('game').getBoundingClientRect();
    const controls=['joystick','btnA','settingsBtn','menuBtn'].map(id=>document.getElementById(id)?.getBoundingClientRect()).filter(Boolean);
    return getNearbyForestExitGuides().every(g=>{
     const left=canvasRect.left+(g.x-g.width/2)/540*canvasRect.width,right=canvasRect.left+(g.x+g.width/2)/540*canvasRect.width;
     const top=canvasRect.top+(g.y-16)/960*canvasRect.height,bottom=canvasRect.top+(g.y+16)/960*canvasRect.height;
     return controls.every(c=>right<=c.left||left>=c.right||bottom<=c.top||top>=c.bottom);
    });
   }),'Destination labels cannot hide underneath mobile controls');
   if(name==='first-north-fork')assert.deepEqual(guides.map(g=>g.to).sort(),['deepForest','lilacVillage']);
   await page.waitForTimeout(80);await page.screenshot({path:path.join(out,width+'-'+name+'.png')});
  }
  for(const y of [4,39]){
   assert(await page.evaluate(y=>{
    enterWorldRegion({to:'lilacVillage',entry:{x:25,y,face:'down'}},{skipSave:true});
    const camera=getWorldCameraTarget();camX=camera.x;camY=camera.y;
    const ax=player.px-camX,ay=player.py-camY;
    return getNearbyForestExitGuides().every(g=>g.x+g.width/2<=ax-38||g.x-g.width/2>=ax+38||g.y+16<=ay-82||g.y-16>=ay+12);
   },y),'Clamped destination badge cannot cover the walking character');
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
  // The final ordinary forest and all three fantasy forests keep the prior tool restrictions.
  const gates=await page.evaluate(()=>['forestNine','forestTen','forestEleven','forestTwelve'].map(id=>{
   enterWorldRegion({to:id,entry:REGION_WORLDS[id].playerSpawn},{skipSave:true});
   const tree=trees.find(t=>t.interactable),hp=getTreeState(tree).hp;
   const accepted=hitResourceTree(tree);
   if(accepted||getTreeState(tree).hp!==hp)throw Error('Lower axe accepted in '+id);
   return id;
  }));
  reports.push({width,journeys,gates,legacySave:true});console.log(width+'px forest routes passed: '+journeys.length+' actual walks, save intact, tool limits retained');
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
}finally{await browser.close();}
