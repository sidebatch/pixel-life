import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const context={};
vm.createContext(context);
vm.runInContext(`${read('src/assets.js')}\n${read('src/data/world-map.js')}\n${read('src/data/region-maps.js')}\n`+
  `${read('src/data/fishing-habitat-data.js')}\n${read('src/data/fish-data.js')}\n`+
  `globalThis.__coast=REGION_WORLDS.coast;globalThis.__villageExits=REGION_EXITS.lilacVillage;`+
  `globalThis.__coastExits=REGION_EXITS.coast;globalThis.__fish=FISH_DATA;globalThis.__urls=FISH_URLS;`,context);

const coast=clone(context.__coast),fish=clone(context.__fish),urls=clone(context.__urls);
assert.equal(coast.name,'바람결 해안 항구');
assert.equal(coast.waterAreas.length,1);
assert.equal(coast.waterAreas[0].id,'windshore_harbor');
assert.equal(coast.waterAreas[0].fishingHabitat,'coast');
assert.ok(coast.fixedObjects.harbor.ticketBooth&&coast.fixedObjects.harbor.boat,'Harbor booth and docked boat must exist');
assert.equal(coast.npcs.find(npc=>npc.id==='captain_maru')?.role,'captain','The harbor captain must be placed');
assert.ok(context.__villageExits.some(exit=>exit.to==='coast'&&exit.x===1&&exit.y===36),'Village must lead west to the coast');
assert.ok(context.__coastExits.some(exit=>exit.to==='lilacVillage'&&exit.x===62&&exit.y===24),'Coast must return east to the village');

const key=(x,y)=>`${x},${y}`,blocked=new Set();
for(let x=0;x<coast.width;x++){blocked.add(key(x,0));blocked.add(key(x,coast.height-1));}
for(let y=0;y<coast.height;y++){blocked.add(key(0,y));blocked.add(key(coast.width-1,y));}
for(const area of coast.waterAreas)for(let x=area.x;x<area.x+area.w;x++)for(let y=area.y;y<area.y+area.h;y++)blocked.add(key(x,y));
for(const bridge of coast.bridges){
  const dx=Math.sign(bridge.x2-bridge.x1),dy=Math.sign(bridge.y2-bridge.y1);let x=bridge.x1,y=bridge.y1;
  while(true){blocked.delete(key(x,y));if(x===bridge.x2&&y===bridge.y2)break;x+=dx;y+=dy;}
}
const booth=coast.fixedObjects.harbor.ticketBooth;
for(let x=booth.x;x<booth.x+booth.w;x++)for(let y=booth.y;y<booth.y+booth.h;y++)blocked.add(key(x,y));
for(const item of [...coast.fixedObjects.rocks,...coast.fixedObjects.harbor.crates])blocked.add(key(item.x,item.y));
const queue=[coast.playerSpawn],seen=new Set([key(coast.playerSpawn.x,coast.playerSpawn.y)]);
for(let index=0;index<queue.length;index++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const x=queue[index].x+dx,y=queue[index].y+dy,k=key(x,y);
  if(x<0||y<0||x>=coast.width||y>=coast.height||blocked.has(k)||seen.has(k))continue;
  seen.add(k);queue.push({x,y});
}
assert.ok(seen.has('62,24')&&seen.has(key(booth.approach.x,booth.approach.y))&&seen.has('38,34'),
  'Exit, ticket booth approach, and captain must be reachable');
assert.ok(seen.has('20,28')&&blocked.has('20,29'),'A reachable shoreline must face fishable coast water');
assert.ok(seen.has('38,35')&&seen.has('38,36')&&!blocked.has('38,36'),'The main pier must remain walkable');

const expected=[
  {id:'fish.rockfish',name:'볼락',asset:'rockfish',habitat:'coast',rarity:'uncommon',periods:['NIGHT'],weather:null,
    minSizeCm:12,maxSizeCm:38,basePrice:78,xp:12,weight:16,description:'밤의 얕은 바위틈에서 눈을 반짝이는 물고기다.',introducedVersion:'expansion'},
  {id:'fish.korean_rockfish',name:'우럭',asset:'korean_rockfish',habitat:'coast',rarity:'uncommon',periods:null,weather:null,
    minSizeCm:18,maxSizeCm:55,basePrice:72,xp:12,weight:20,description:'바위틈을 좋아하는 해안의 터줏대감이다.',introducedVersion:'expansion'}
];
assert.deepEqual(fish.filter(item=>expected.some(candidate=>candidate.id===item.id)).map(({emoji,...item})=>item),expected);
assert.ok(fish.length>=25,'The step-6 coast additions must remain live as later habitats are added');
assert.equal(fish.filter(item=>item.habitat==='coast').length,9,
  'The live coast temporarily has nine fish until coelacanth migrates to deep sea');
for(const item of expected){
  const file=`assets/fishing/${item.asset}.png`,bytes=fs.readFileSync(path.join(root,file));
  assert.equal(urls[item.asset],file);assert.equal(bytes.readUInt32BE(16),96);assert.equal(bytes.readUInt32BE(20),96);assert.equal(bytes[25],6);
}

const poolContext={GAME_STATE:{regionId:'coast',inventory:[],collections:{fish:{}},progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,equippedRodId:'rod.basic'}},activity:{active:null}}};
vm.createContext(poolContext);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/fishing-spots.js')}\n${read('src/data/fish-data.js')}\n`+
  `${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
  `globalThis.__day=getEligibleFishPool({regionId:'coast',spotId:'windshore_harbor',habitat:'coast',period:'DAY',weather:'clear'}).map(f=>f.id);`+
  `globalThis.__night=getEligibleFishPool({regionId:'coast',spotId:'windshore_harbor',habitat:'coast',period:'NIGHT',weather:'clear'}).map(f=>f.id);`,poolContext);
assert.ok(poolContext.__day.includes('fish.korean_rockfish')&&!poolContext.__day.includes('fish.rockfish'));
assert.ok(poolContext.__night.includes('fish.korean_rockfish')&&poolContext.__night.includes('fish.rockfish'));

for(const fish of expected){
  let saves=0;
  const catchContext={
    Math,URLSearchParams,window:{location:{search:`?debug&fish=${fish.id}`}},
    GAME_STATE:{regionId:'coast',inventory:[],collections:{fish:{}},
      progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']}},
      appearance:{activeTool:'rod'},activity:{active:null}},
    getWorldTimePeriod:()=>fish.periods?.[0]||'DAY',getWeatherKind:()=> 'clear',saveGame:()=>{saves+=1;return true;}
  };
  vm.createContext(catchContext);
  vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/fishing-spots.js')}\n${read('src/data/fish-data.js')}\n`+
    `${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
    `fishingState.context={regionId:'coast',spotId:'windshore_harbor',habitat:'coast',period:'${fish.periods?.[0]||'DAY'}',weather:'clear'};`+
    `globalThis.__result=createFishingCatch();globalThis.__inventory=GAME_STATE.inventory;globalThis.__collection=GAME_STATE.collections.fish;`,catchContext);
  assert.equal(catchContext.__result.fishId,fish.id,`Debug catch selected the wrong coast fish: ${fish.id}`);
  assert.equal(catchContext.__inventory.length,1,`Coast catch did not add one inventory record: ${fish.id}`);
  assert.equal(catchContext.__collection[fish.id].count,1,`Coast catch did not create a collection record: ${fish.id}`);
  assert.equal(saves,1,`Coast catch did not save exactly once: ${fish.id}`);
}
assert.ok(read('src/interactions.js').includes("case 'ticketBooth'")&&read('src/rendering.js').includes('drawHarborBoat'),
  'Ticket placeholder and harbor boat renderer must remain connected');

console.log('Fishing coast passed: reciprocal harbor map, reachable shore/pier/booth/captain, rockfish catches, pools and assets');
