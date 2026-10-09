import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
export const forestIds=['oldForest','deepForest','forestThree','forestFour','forestFive','forestSix','forestSeven','forestEight','forestNine','forestTen','forestEleven','forestTwelve'];
export function forestWorldContext(){
  const context={console:{info(){},warn(){},error:console.error},Image:class{},document:{getElementById(id){return id==='game'?{width:540,height:960,getContext:()=>({})}:null;}}};
  vm.createContext(context);
  const files=['src/assets.js','src/data/character-rig-data.js','src/data/sword-data.js','src/data/world-map.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/fishing-spots.js','src/data/fishing-gear-data.js','src/data/life-content-data.js','src/config.js','src/world.js','src/world-validation.js'];
  vm.runInContext(files.map(file=>fs.readFileSync(file,'utf8')).join('\n'),context);
  return context;
}
export function forestSnapshot(context){
  const snapshot={};
  for(const id of forestIds){
    const row=JSON.parse(vm.runInContext(`GAME_STATE.regionId='${id}';buildWorldRegion(REGION_WORLDS['${id}']);JSON.stringify({
      trees:trees.map(t=>[t.id,t.x,t.y,t.species]).sort((a,b)=>a[0].localeCompare(b[0])),
      water:WORLD_DEFINITION.waterAreas,spot:WORLD_DEFINITION.fishingSpot,
      rocks:WORLD_DEFINITION.fixedObjects.rocks,terrain:WORLD_DEFINITION.terrain
    })`,context));
    snapshot[id]={count:row.trees.length,sha256:crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex')};
  }
  snapshot.economy=crypto.createHash('sha256').update(vm.runInContext('JSON.stringify({trees:FORESTRY_TREES,axes:FORESTRY_AXES})',context)).digest('hex');
  return snapshot;
}
