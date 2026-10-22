import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const context=vm.createContext({console:{info(){},warn(){},error:console.error},Image:class{},
  document:{getElementById(id){return id==='game'?{width:540,height:960,getContext:()=>({})}:null;}}});
const files=['src/assets.js','src/data/character-rig-data.js','src/data/sword-data.js','src/data/world-map.js',
  'src/data/dungeon-preview-data.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/fishing-spots.js',
  'src/data/fishing-gear-data.js','src/data/life-content-data.js','src/data/life-skill-data.js','src/config.js','src/world.js','src/world-validation.js'];
vm.runInContext(files.map(file=>fs.readFileSync(file,'utf8')).join('\n'),context);
const data=vm.runInContext('({regions:DUNGEON_REGIONS,maps:DUNGEON_WORLD_DEFINITIONS,assets:ASSET_URLS,icons:REGION_ICON_URLS})',context);
const roster=data.regions.flatMap(r=>r.monsters.map(m=>m.id));
assert(roster.includes('heron')&&roster.includes('armadillo')&&!roster.includes('leech')&&!roster.includes('sandWorm'),'Both unsettling creatures must be fully replaced');
for(const [atlas,changed]of [['swamp',4],['redrock',4],['frost',5]]){
  const before=decodePNG(fs.readFileSync('assets/dungeons/'+atlas+'-v1.png')),
    after=decodePNG(fs.readFileSync('assets/dungeons/'+atlas+'-v2.png'));
  for(let frame=0;frame<6;frame++){
    const original=crop(before,frame%3*128,Math.floor(frame/3)*128,128,128).data,
      current=crop(after,frame%3*128,Math.floor(frame/3)*128,128,128).data;
    assert.equal(original.equals(current),frame!==changed,atlas+' must only replace its requested frame '+frame);
  }
}
vm.runInContext(fs.readFileSync('src/dungeon-preview.js','utf8'),context);
const auraChecks=vm.runInContext(`(()=>{
  const before=JSON.stringify(GAME_STATE),bosses=DUNGEON_REGIONS.map(r=>r.monsters[5]);
  return {all:bosses.every(b=>DUNGEON_BOSS_AURA_COLORS[b.id]&&getDungeonBossAuraState(b,123).color===DUNGEON_BOSS_AURA_COLORS[b.id]),
    regular:DUNGEON_REGIONS.every(r=>r.monsters.slice(0,5).every(m=>getDungeonBossAuraState(m,123)===null)),
    reduced:bosses.every(b=>JSON.stringify(getDungeonBossAuraState(b,0,true))===JSON.stringify(getDungeonBossAuraState(b,2879,true))),
    animated:bosses.every(b=>getDungeonBossAuraState(b,123).phase!==getDungeonBossAuraState(b,999).phase),
    unchanged:before===JSON.stringify(GAME_STATE)};
})()`,context);
assert(auraChecks.all&&auraChecks.regular&&auraChecks.reduced&&auraChecks.animated&&auraChecks.unchanged,JSON.stringify(auraChecks));
assert.equal(data.regions.length,10);assert.equal(new Set(data.regions.flatMap(r=>r.monsters.map(m=>m.id))).size,60);
const brak=decodePNG(fs.readFileSync(data.assets.dungeonBrak));assert.equal(brak.width,192);assert.equal(brak.height,192);
for(let frame=0;frame<4;frame++){
  const b=alphaBounds(crop(brak,frame%2*96,Math.floor(frame/2)*96,96,96));
  assert(b.x>=6&&b.y>=6&&b.x+b.width<=90&&b.y+b.height<=90,'Brak view must preserve padded 90px foot standard');
}
const design=fs.readFileSync('docs/DUNGEON_REGIONS_MONSTERS_V1.md','utf8');
for(const region of data.regions){
  assert.equal(region.monsters.length,6);assert.equal(region.monsters.filter(m=>m.boss).length,1);
  for(const m of region.monsters)assert(design.includes(m.name),'Unapproved monster name '+m.name);
  if(!region.atlas)continue;
  const sheet=decodePNG(fs.readFileSync(data.assets[region.atlas]));assert.equal(sheet.width,384);assert.equal(sheet.height,256);
  for(let frame=0;frame<6;frame++){
    const b=alphaBounds(crop(sheet,frame%3*128,Math.floor(frame/3)*128,128,128));
    assert(b.x>=10&&b.y>=10&&b.x+b.width<=118&&b.y+b.height<=118,region.id+' clipped/unaligned frame '+frame);
  }
  const gate=decodePNG(fs.readFileSync(data.assets[region.gate])),b=alphaBounds(gate);
  assert(gate.width===320&&gate.height===256&&b.x>=10&&b.y>=10&&b.y+b.height<=246,'Cave needs transparent margin '+region.id);
}
const report=vm.runInContext(`Object.keys(DUNGEON_WORLD_DEFINITIONS).concat('wildwoodHunt').map(id=>{
  GAME_STATE.regionId=id;buildWorldRegion(REGION_WORLDS[id]);validatePlayableRegion();
  const def=WORLD_DEFINITION,queue=[def.playerSpawn],seen=new Set([key(queue[0].x,queue[0].y)]);
  for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[0,1],[1,0],[0,-1],[-1,0]]){
    const x=queue[i].x+dx,y=queue[i].y+dy,k=key(x,y);if(!inside(x,y)||blocked.has(k)||seen.has(k))continue;
    seen.add(k);queue.push({x,y});
  }
  const near=p=>[[0,1],[1,0],[0,-1],[-1,0]].some(([dx,dy])=>seen.has(key(p.x+dx,p.y+dy)));
  return {id,label:WORLD_REGIONS[id].name===def.name,exits:REGION_EXITS[id].every(e=>seen.has(key(e.x,e.y))),
    monsters:(def.dungeonMonsters||[]).every(m=>near(m)&&blocked.has(key(m.x,m.y))),count:def.dungeonMonsters?.length||0};
})`,context);
assert(report.every(r=>r.label&&r.exits&&r.monsters),JSON.stringify(report));
assert.equal(report.reduce((n,r)=>n+r.count,0),100); // Plus the preserved 10 wildlife actors.
assert.equal(vm.runInContext('REGION_EXITS.lilacVillage.find(e=>e.x===48&&e.y===35).to',context),'dungeonCrossroads');
console.log('Dungeon preview data passed: 60 approved names, 55 new monsters with padded frames, nine cave sprites, all 11 maps/portals/approaches and 100 new actors.');
console.log('Dungeon art v2 passed: two species replaced, 15 other atlas cells pixel-identical, ten boss auras only, reduced motion and unchanged gameplay state.');
