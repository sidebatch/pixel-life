import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/dist/index.html',out=path.resolve(process.argv[2]||'output/wood-bridges-v1');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto(base,{timeout:60000});await page.waitForFunction(()=>typeof getWoodBridgeGeometry==='function'&&!document.getElementById('startupLoading'));
  assert.deepEqual(await page.evaluate(()=>[imgs.bridge.naturalWidth,imgs.bridge.naturalHeight,imgs.bridgePost.naturalWidth,imgs.bridgePost.naturalHeight]),[64,64,24,32]);
  let walked=0;
  for(const [name,id,x,y,dir,steps,face] of [['village','lilacVillage',41,21,'down',4,'down'],['lake','mountainLake',31,35,'up',5,'up'],['falls','waterfallValley',36,38,'right',8,'right'],['swamp','reedSwamp',33,34,'down',6,'left'],['harbor','coast',38,36,'right',9,'right']]){
   const result=await page.evaluate(({id,x,y,dir,steps,face})=>{
    enterWorldRegion({to:id,entry:{x,y,face}},{skipSave:true});clearMovement();player.moving=false;GAME_STATE.appearance.activeTool='rod';
    for(const n of npcs){n.moving=false;n.wait=1e9;}
    worldTime.minutes=720;worldTime.debugLocked=true;weatherState.kind='clear';weatherState.debugLocked=true;
    const before=JSON.stringify({bridge:[...bridgeSet],water:[...waterSet],blocked:[...blocked],state:GAME_STATE}),g=getWoodBridgeGeometry();
    for(let i=0;i<10;i++){tNow+=123;drawWorld();}
    if(getWoodBridgeGeometry()!==g||before!==JSON.stringify({bridge:[...bridgeSet],water:[...waterSet],blocked:[...blocked],state:GAME_STATE}))throw Error('Bridge rendering mutated/cached badly');
    for(let i=0;i<steps;i++){tryMove(dir);if(!player.moving)throw Error('Bridge movement refused '+id);update(player.duration+1);if(!bridgeSet.has(key(player.x,player.y)))throw Error('Left bridge '+id);}
    clearMovement();player.face=face;const cam=getWorldCameraTarget();camX=cam.x;camY=cam.y;drawWorld();
    return {x:player.x,y:player.y,tiles:g.tiles.length,posts:g.posts.length,steps,interaction:resolveWorldInteraction()?.kind};
   },{id,x,y,dir,steps,face});
   walked+=result.steps;
   if(id==='mountainLake'||id==='reedSwamp')assert.equal(result.interaction,'fishing');
   await page.waitForTimeout(80);await page.screenshot({path:path.join(out,width+'-'+name+'.png')});
   if(id==='coast'){
    await page.evaluate(()=>{player.x=38;player.y=36;player.px=38*TILE+24;player.py=36*TILE+24;const c=getWorldCameraTarget();camX=c.x;camY=c.y;drawWorld();});
    await page.screenshot({path:path.join(out,width+'-harbor-junction.png')});
   }
  }
  assert.equal(walked,32);
  await page.evaluate(()=>{enterWorldRegion({to:'reedSwamp',entry:{x:33,y:38,face:'left'}},{skipSave:true});worldTime.minutes=1320;weatherState.kind='rain';drawWorld();});
  await page.screenshot({path:path.join(out,width+'-night-rain.png')});
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>drawWorld());
  const saved=await page.evaluate(()=>{GAME_STATE.progression.coins=9876;return saveGame();});assert(saved);
  await page.reload();await page.waitForFunction(()=>typeof getWoodBridgeGeometry==='function'&&!document.getElementById('startupLoading'));
  assert.deepEqual(await page.evaluate(()=>[GAME_STATE.regionId,player.x,player.y,GAME_STATE.progression.coins]),['reedSwamp',33,38,9876]);
  reports.push({width,walked,restored:true,nightRain:true});await context.close();
  console.log(width+'px wood bridges passed: five regions, '+walked+' real steps, lake/swamp fishing, harbor junction, cached read-only art, night/rain, saved position');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({reports,errors},null,2));
}finally{await browser.close();}
