// Mobile-viewport visual and save smoke test for forest 1-1 through 1-5.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forest-expansion-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(response.url().includes('/assets/forestry/')&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(base);
  await page.waitForFunction(()=>typeof enterWorldRegion==='function'&&
    ['chestnut','walnut','zelkova'].every(species=>forestTreeImgs[species]?.naturalWidth===120));
  const regions=['oldForest','deepForest','forestThree','forestFour','forestFive'];
  const reports=[];
  for(let index=0;index<regions.length;index++){
    const report=await page.evaluate(({id,previous})=>{
      const exit=previous?REGION_EXITS[previous].find(item=>item.to===id):
        REGION_EXITS.lilacVillage.find(item=>item.to===id);
      if(!exit||!enterWorldRegion(exit))throw new Error(`Cannot enter ${id}`);
      validatePlayableRegion();
      const count=trees.length;
      const added=trees.filter(tree=>tree.id.includes('_infill_')).length;
      if(count<130||added<40)throw new Error(`${id} is not dense enough: ${count}/${added}`);
      return {id,name:WORLD_DEFINITION.name,count,added,
        species:[...new Set(trees.map(tree=>tree.species))].length};
    },{id:regions[index],previous:regions[index-1]});
    reports.push(report);
    await page.screenshot({path:path.join(output,`forest-1-${index+1}-entrance-393.png`)});
    await page.evaluate(()=>{
      const spot=WORLD_DEFINITION.fishingSpot;
      const shore=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:spot.x+dx,y:spot.y+dy}))
        .find(tile=>!blocked.has(key(tile.x,tile.y)));
      if(!shore)throw new Error('No fishing shore');
      player.x=shore.x;player.y=shore.y;
      player.px=player.x*TILE+TILE/2;player.py=player.y*TILE+TILE/2;
      camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
      camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
    });
    await page.screenshot({path:path.join(output,`forest-1-${index+1}-water-393.png`)});
    const scenic={forestThree:{x:19,y:16},forestFour:{x:34,y:21},forestFive:{x:45,y:13}}[regions[index]];
    if(scenic){
      await page.evaluate(({x,y})=>{
        camX=Math.max(0,Math.min(WORLD_W-VIEW_W,(x+.5)*TILE-VIEW_W/2));
        camY=Math.max(0,Math.min(WORLD_H-VIEW_H,(y+.5)*TILE-VIEW_H/2));
      },scenic);
      await page.screenshot({path:path.join(output,`forest-1-${index+1}-landmark-393.png`)});
    }
  }
  const savedTree=await page.evaluate(()=>{
    const tree=trees.find(item=>FORESTRY_TREES[item.species].tier===1);
    if(!tree||!hitResourceTree(tree))throw new Error('A starter tree in forest 1-5 cannot be chopped');
    return {id:tree.id,species:tree.species,hp:getTreeState(tree).hp};
  });
  await page.reload();
  await page.waitForFunction(()=>typeof enterWorldRegion==='function');
  const restored=await page.evaluate(id=>({id:GAME_STATE.regionId,name:WORLD_DEFINITION.name,
    report:validatePlayableRegion(),tree:trees.find(item=>item.id===id)}),savedTree.id);
  if(restored.id!=='forestFive'||restored.name!=='오래된 숲 1-5'||
    !restored.tree||restored.tree.species!==savedTree.species)
    throw new Error(`Final forest did not survive reload: ${JSON.stringify(restored)}`);
  const restoredHp=await page.evaluate(id=>getTreeState(trees.find(item=>item.id===id)).hp,savedTree.id);
  if(restoredHp!==savedTree.hp)throw new Error('New forest tree HP did not survive reload');
  if(errors.length)throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({regions:reports,restored:restored.id,screenshots:output},null,2));
}finally{
  await browser.close();
}
