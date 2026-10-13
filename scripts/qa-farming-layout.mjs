import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {forestWorldContext} from './lib/forest-world-qa.mjs';
import {decodePNG} from './lib/png.mjs';
import {validateTool} from './check-character-standard.mjs';
const context=forestWorldContext();context.performance={now:()=>0};
context.document=undefined;
vm.runInContext(fs.readFileSync('src/data/farming-data.js','utf8')+'\n'+
  "GAME_STATE.regionId='sunnyFields';buildWorldRegion(REGION_WORLDS.sunnyFields);\n"+
  fs.readFileSync('src/simulation.js','utf8')+'\n'+fs.readFileSync('src/life-content.js','utf8'),context);
assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(LIFE_CONTENT.crops.map(farmCropSubject))',context)),
  ['당근이','순무가','감자가','양파가','양배추가','밀이','옥수수가','토마토가','딸기가','호박이']);
const tool=JSON.parse(vm.runInContext("JSON.stringify(SICKLE_TOOLS['sickle.basic'])",context));
const imagePath=vm.runInContext("SICKLE_TOOL_URLS['sickle.basic']",context);
const image=decodePNG(fs.readFileSync(imagePath));validateTool(image,tool,'sickle.basic');
assert(image.data[(tool.grip[1]*96+tool.grip[0])*4+3]>0,'Grip must sit on the real handle');
assert(image.data[(tool.tip[1]*96+tool.tip[0])*4+3]>0,'Tip must sit on the real tool');
context.document={getElementById:()=>({classList:{add(){},remove(){}}})};
context.setTimeout=()=>0;context.clearTimeout=()=>{};context.saveGame=()=>true;
context.clearMovement=()=>{};
const result=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
  const plots=WORLD_DEFINITION.farmPlots;
  const ids=plots.map(p=>p.id),initial=plots.filter(p=>getFarmPlotState(p).unlocked).map(p=>p.id);
  const emptyAndLockedSolid=plots.every(p=>isBlocked(p.x,p.y));
  for(const p of plots)GAME_STATE.world.plots[p.id]={unlocked:true,cropId:'carrot',plantedAt:Date.now()};
  const growingSolid=plots.every(p=>isBlocked(p.x,p.y));
  const times=[];
  for(let i=0;i<plots.length;i++){
    const crop=LIFE_CONTENT.crops[i%10],plot=plots[i];
    GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:crop.id,plantedAt:Date.now()-crop.growMs-1};
    times.push(GAME_STATE.world.plots[plot.id].plantedAt);
  }
  const queue=[{x:3,y:24}],seen=new Set();
  for(let i=0;i<queue.length;i++){
    const tile=queue[i],k=key(tile.x,tile.y);if(seen.has(k)||isBlocked(tile.x,tile.y))continue;
    seen.add(k);for(const [dx,dy] of Object.values(dirVec))queue.push({x:tile.x+dx,y:tile.y+dy});
  }
  const accessible=plots.every(p=>Object.values(dirVec).some(([dx,dy])=>seen.has(key(p.x+dx,p.y+dy))));
  const solid=plots.every(p=>isBlocked(p.x,p.y));
  const preserved=plots.every((p,i)=>GAME_STATE.world.plots[p.id].plantedAt===times[i]);
  GAME_STATE.appearance.activeTool='axe';player.x=16;player.y=22;
  const wrongTool=harvestFarmCrop(plots[0]);
  GAME_STATE.appearance.activeTool='sickle';player.x=3;player.y=24;
  const farAway=harvestFarmCrop(plots[0]);
  const harvested=[];
  for(const p of plots){
    player.x=p.x-1;player.y=p.y;
    const id=getFarmPlotState(p).cropId,before=lifeItemCount('crop',id);
    const success=harvestFarmCrop(p),quantity=lifeItemCount('crop',id)-before,crop=LIFE_CROP_BY_ID.get(id);
    harvested.push(success&&quantity>=crop.harvestMin&&quantity<=crop.harvestMax&&isBlocked(p.x,p.y)&&!harvestFarmCrop(p));
  }
  return {ids,initial,emptyAndLockedSolid,growingSolid,accessible,solid,preserved,wrongTool,farAway,harvested,
    outsideFarm:(GAME_STATE.regionId='lilacVillage',farmPlotAt(15,22)!==null)};
})())`,context));
assert.deepEqual(result.ids,Array.from({length:16},(_,i)=>`farm_${String(i+1).padStart(2,'0')}`));
assert.deepEqual(result.initial,['farm_01','farm_02','farm_05','farm_06']);
assert(result.emptyAndLockedSolid&&result.growingSolid&&result.accessible&&result.solid&&result.preserved&&!result.wrongTool&&!result.farAway&&!result.outsideFarm);
assert(result.harvested.every(Boolean));
console.log('Farm layout passed: old IDs/ownership/time, beds blocked before purchase/planting/during growth/after harvest, accessible lanes, adjacent sickle harvest, ten yields, single grant and real tool anchors');
