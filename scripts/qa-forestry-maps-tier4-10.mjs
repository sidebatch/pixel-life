// Mobile browser smoke test for the seven distinct Tier 4-10 forest maps.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forestry-maps-tier4-10-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(base);
  await page.waitForFunction(()=>typeof enterWorldRegion==='function'&&forestTreeImgs.abysswood?.naturalWidth===120);
  const regions=['forestSix','forestSeven','forestEight','forestNine','forestTen','forestEleven','forestTwelve'];
  await page.evaluate(()=>enterWorldRegion({to:'forestFive',entry:{x:25,y:3,face:'down'}}));
  const reports=[];
  for(let index=0;index<regions.length;index++){
    const report=await page.evaluate(({id,previous,tier})=>{
      const exit=REGION_EXITS[previous].find(item=>item.to===id);
      if(!exit||!enterWorldRegion(exit))throw new Error(`Cannot enter ${id} from ${previous}`);
      validatePlayableRegion();
      const target=FOREST_TIER_REGION_SPECIES[id];
      if(!target.every(species=>trees.some(tree=>tree.species===species))||trees.some(tree=>!target.includes(tree.species)))
        throw new Error(`${id} has the wrong species set`);
      const reciprocal=REGION_EXITS[id].some(item=>item.to===previous);
      if(!reciprocal)throw new Error(`${id} has no return exit`);
      GAME_STATE.progression.forestry={axeId:FORESTRY_AXES[tier-2].id,ownedAxeIds:FORESTRY_AXES.map(axe=>axe.id)};
      const tree=trees.find(item=>FORESTRY_TREES[item.species].tier===tier);
      if(!tree)throw new Error(`${id} has no Tier-${tier} tree`);
      if(hitResourceTree(tree)||getTreeState(tree).hp!==FORESTRY_TREES[tree.species].maxHp)
        throw new Error(`${id} accepted a lower-tier axe`);
      GAME_STATE.progression.forestry.axeId=FORESTRY_AXES[tier-1].id;
      const hits=Math.ceil(FORESTRY_TREES[tree.species].maxHp/FORESTRY_AXES[tier-1].damage);
      for(let hit=0;hit<hits;hit++)if(!hitResourceTree(tree))throw new Error(`${id} chop failed`);
      if(getTreeState(tree).hp!==0||lifeItemCount('material',`${tree.species}_log`)<1)
        throw new Error(`${id} did not create a stump and wood reward`);
      return {id,name:WORLD_DEFINITION.name,count:trees.length,species:target.length,tree:tree.species,
        ground:WORLD_DEFINITION.terrain.ground,paths:JSON.stringify(WORLD_DEFINITION.paths),water:JSON.stringify(WORLD_DEFINITION.waterAreas)};
    },{id:regions[index],previous:index?regions[index-1]:'forestFive',tier:index+4});
    reports.push(report);
    await page.screenshot({path:path.join(output,`${index+4}-${regions[index]}-entrance.png`)});
    await page.evaluate(()=>{
      const spot=WORLD_DEFINITION.fishingSpot;
      const shore=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:spot.x+dx,y:spot.y+dy}))
        .find(tile=>!blocked.has(key(tile.x,tile.y)));
      if(!shore)throw new Error('No reachable fishing shore');
      player.x=shore.x;player.y=shore.y;player.px=(shore.x+.5)*TILE;player.py=(shore.y+.5)*TILE;
      camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
      camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));
    });
    await page.screenshot({path:path.join(output,`${index+4}-${regions[index]}-water.png`)});
  }
  if(new Set(reports.map(report=>report.ground)).size!==7||new Set(reports.map(report=>report.paths)).size!==7||
    new Set(reports.map(report=>report.water)).size!==7)throw new Error('New forests do not have seven distinct landscapes');
  const saved=await page.evaluate(()=>{
    const tree=trees.find(item=>item.species==='worldroot'&&getTreeState(item).hp>0);
    if(!tree)throw new Error('No second worldroot tree for persistence test');
    GAME_STATE.progression.forestry.axeId='axe.primordial';
    if(!hitResourceTree(tree))throw new Error('Final forest partial chop failed');
    return {id:tree.id,hp:getTreeState(tree).hp,region:GAME_STATE.regionId};
  });
  await page.reload();
  await page.waitForFunction(()=>typeof getTreeState==='function'&&GAME_STATE.regionId==='forestTwelve');
  const restored=await page.evaluate(id=>{
    const tree=trees.find(item=>item.id===id);
    return {region:GAME_STATE.regionId,name:WORLD_DEFINITION.name,hp:tree?getTreeState(tree).hp:null};
  },saved.id);
  if(restored.region!==saved.region||restored.name!=='태초 숲 3-3'||restored.hp!==saved.hp)
    throw new Error(`Final forest save did not restore: ${JSON.stringify({saved,restored})}`);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(JSON.stringify({regions:reports.map(({id,name,count,species,tree})=>({id,name,count,species,tree})),restored},null,2));
}finally{
  await browser.close();
}
