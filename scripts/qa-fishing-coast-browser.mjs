import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/fishing-coast-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(base+'?time=12:00&weather=clear');
  await page.waitForFunction(()=>typeof enterWorldRegion==='function'&&REGION_WORLDS.coast);
  await page.waitForFunction(()=>!document.getElementById('startupLoading'));
  const entered=await page.evaluate(()=>enterWorldRegion(REGION_EXITS.lilacVillage.find(exit=>exit.to==='coast')));
  if(!entered)throw new Error('Could not enter the coast from the village');
  await page.evaluate(()=>{
    player.x=42;player.y=25;player.face='down';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();
  });
  const harbor=await page.evaluate(()=>({
    region:GAME_STATE.regionId,name:WORLD_DEFINITION.name,location:document.getElementById('locationName').textContent,
    habitat:resolveFishingSpot(WORLD_DEFINITION,{x:20,y:29},GAME_STATE.regionId)?.fishingHabitat,
    captain:npcs.find(npc=>npc.id==='captain_maru')?.name,
    booth:!!WORLD_DEFINITION.fixedObjects?.harbor?.ticketBooth,boat:!!WORLD_DEFINITION.fixedObjects?.harbor?.boat,
    pierWalkable:!blocked.has('38,36'),music:REGION_MUSIC_TRACKS.coast
  }));
  if(harbor.region!=='coast'||harbor.name!=='바람결 해안 항구'||harbor.location!=='바람결 해안 항구'||
    harbor.habitat!=='coast'||harbor.captain!=='선장 마루'||!harbor.booth||!harbor.boat||!harbor.pierWalkable||harbor.music!=='lakeside')
    throw new Error(`Harbor runtime mismatch: ${JSON.stringify(harbor)}`);
  await page.screenshot({path:path.join(output,'393-harbor-plaza.png')});

  await page.evaluate(()=>{
    player.x=36;player.y=23;player.face='up';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));interact();
  });
  const ticketText=await page.locator('#dialogText').textContent();
  if(!ticketText.includes('얕은 바다')||!ticketText.includes('중간 바다')||!ticketText.includes('심해')||
    !ticketText.includes('빙하 해역')||!ticketText.includes('준비 중'))throw new Error('Ticket booth placeholder does not list all four planned routes');
  await page.locator('#dialogNext').tap();

  const saved=await page.evaluate(()=>{
    GAME_STATE.regionId='coast';player.x=42;player.y=25;player.face='down';return saveGame();
  });
  if(!saved)throw new Error('Could not save the coast location');
  await page.reload();
  await page.waitForFunction(()=>typeof enterWorldRegion==='function'&&GAME_STATE.regionId==='coast');
  await page.waitForFunction(()=>!document.getElementById('startupLoading'));
  const restored=await page.evaluate(()=>({region:GAME_STATE.regionId,x:player.x,y:player.y,name:WORLD_DEFINITION.name}));
  if(restored.region!=='coast'||restored.x!==42||restored.y!==25||restored.name!=='바람결 해안 항구')
    throw new Error(`Coast save restoration failed: ${JSON.stringify(restored)}`);
  await page.evaluate(()=>{
    GAME_STATE.appearance.activeTool='rod';
    player.x=20;player.y=28;player.face='down';player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();
  });
  const shore=await page.evaluate(()=>({interaction:resolveWorldInteraction(),spot:getFishingSpotInFront()}));
  if(shore.interaction?.kind!=='fishing'||shore.spot?.fishingHabitat!=='coast'||shore.spot?.spotId!=='windshore_harbor')
    throw new Error(`Playable coast fishing shore failed: ${JSON.stringify(shore)}`);
  await page.screenshot({path:path.join(output,'393-coast-fishing-shore.png')});
  const returned=await page.evaluate(()=>enterWorldRegion(REGION_EXITS.coast.find(exit=>exit.to==='lilacVillage')));
  if(!returned||!await page.evaluate(()=>GAME_STATE.regionId==='lilacVillage'))throw new Error('Could not return from coast to village');
  if(errors.length)throw new Error(errors.join('\n'));
  const report={harbor,allTicketRoutes:true,saveRestored:restored,shoreFishing:true,reciprocalTravel:true,
    viewport:'393x780',browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Fishing coast browser QA passed: '+JSON.stringify(report));
}finally{await browser.close();}
