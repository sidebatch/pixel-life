import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relativePath=>fs.readFileSync(path.join(root,relativePath),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));

const context={};
vm.createContext(context);
vm.runInContext(`${read('src/data/fishing-habitat-data.js')}\n${read('src/data/fish-data.js')}\n`+
  `globalThis.__groups=FISHING_HABITAT_GROUPS;globalThis.__habitats=FISHING_HABITATS;`+
  `globalThis.__habitatsByGroup=FISHING_HABITATS_BY_GROUP;globalThis.__constants=FISH_HABITATS;`+
  `globalThis.__target=FISHING_TARGET_ROSTER;globalThis.__runtime=FISH_DATA;`,context);

const groups=clone(context.__groups);
const habitats=clone(context.__habitats);
const habitatsByGroup=clone(context.__habitatsByGroup);
const constants=clone(context.__constants);
const target=clone(context.__target);
const runtime=clone(context.__runtime);

assert.deepEqual(groups.map(group=>[group.id,group.label,group.order]),[
  ['inland','내륙',1],['coastal','해안',2],['offshore','원양',3]
],'Fishing habitat groups changed');
assert.equal(habitats.length,10,'The expansion needs exactly ten habitats');
assert.deepEqual(habitats.map(habitat=>habitat.id),[
  'pond','river','mountain_lake','coast','waterfall','swamp','boat_shallow','boat_mid','boat_deep','glacier'
],'Fishing habitat order changed');
assert.deepEqual(habitats.map(habitat=>habitat.label),[
  '연못','강','산악 호수','바다','폭포','늪지','어선·얕은수심','어선·중간수심','어선·심해지역','빙하'
],'Fishing habitat labels changed');
assert.deepEqual(habitats.map(habitat=>habitat.targetSpeciesCount),[8,8,7,8,7,7,7,7,8,7],
  'Fishing habitat species targets changed');
assert.deepEqual(habitats.map(habitat=>habitat.recommendedLevel),[1,5,12,18,22,28,35,45,55,65],
  'Fishing habitat recommended levels changed');
assert.deepEqual(Object.fromEntries(Object.entries(habitatsByGroup).map(([id,items])=>[id,items.map(item=>item.id)])),{
  inland:['pond','river','mountain_lake','waterfall','swamp'],
  coastal:['coast'],
  offshore:['boat_shallow','boat_mid','boat_deep','glacier']
},'Fishing habitat grouping changed');
assert.deepEqual(constants,{
  POND:'pond',RIVER:'river',MOUNTAIN_LAKE:'mountain_lake',COAST:'coast',WATERFALL:'waterfall',SWAMP:'swamp',
  BOAT_SHALLOW:'boat_shallow',BOAT_MID:'boat_mid',BOAT_DEEP:'boat_deep',GLACIER:'glacier'
},'Fishing habitat constants changed');

const unique=(items,label)=>assert.equal(new Set(items).size,items.length,`Duplicate ${label} in 74-fish target roster`);
assert.equal(target.length,74,'Target fishing roster must contain 74 species');
unique(target.map(fish=>fish.id),'fish id');
unique(target.map(fish=>fish.name),'fish name');
unique(target.map(fish=>fish.asset),'fish asset');

const habitatIds=new Set(habitats.map(habitat=>habitat.id));
const rarities=['common','uncommon','rare','heroic','legendary'];
const periods=['DAWN','DAY','DUSK','NIGHT'];
const weatherKinds=['clear','rain','storm'];
for(const fish of target){
  assert.match(fish.id,/^fish\.[a-z0-9_]+$/,`Invalid target fish id: ${fish.id}`);
  assert.equal(fish.asset,fish.id.slice(5),`Target fish asset must match its id: ${fish.id}`);
  assert.ok(fish.name&&fish.description,`Target fish needs a name and description: ${fish.id}`);
  assert.ok(habitatIds.has(fish.habitat),`Unknown target habitat: ${fish.id}/${fish.habitat}`);
  assert.ok(rarities.includes(fish.rarity),`Unknown target rarity: ${fish.id}/${fish.rarity}`);
  assert.ok(fish.introducedVersion==='baseline-v1'||fish.introducedVersion==='expansion',
    `Invalid introduced version: ${fish.id}`);
  for(const [field,values,allowed] of [['periods',fish.periods,periods],['weather',fish.weather,weatherKinds]]){
    assert.ok(values===null||(Array.isArray(values)&&values.length>0),`${fish.id} ${field} must be null or non-empty`);
    if(values){
      unique(values,`${fish.id} ${field} value`);
      assert.ok(values.every(value=>allowed.includes(value)),`Invalid ${field} value: ${fish.id}`);
    }
  }
}

const expectedRarityCounts={
  pond:[4,2,1,1,0],river:[3,2,2,1,0],mountain_lake:[2,2,2,0,1],coast:[2,4,2,0,0],
  waterfall:[1,2,2,1,1],swamp:[2,1,2,1,1],boat_shallow:[2,2,2,1,0],boat_mid:[1,2,3,1,0],
  boat_deep:[0,2,3,1,2],glacier:[1,2,2,1,1]
};
for(const habitat of habitats){
  const pool=target.filter(fish=>fish.habitat===habitat.id);
  assert.equal(pool.length,habitat.targetSpeciesCount,`Wrong target count for ${habitat.id}`);
  assert.deepEqual(rarities.map(rarity=>pool.filter(fish=>fish.rarity===rarity).length),expectedRarityCounts[habitat.id],
    `Wrong rarity distribution for ${habitat.id}`);
  for(const period of periods)for(const weather of weatherKinds){
    assert.ok(pool.some(fish=>(!fish.periods||fish.periods.includes(period))&&(!fish.weather||fish.weather.includes(weather))),
      `Empty target pool: ${habitat.id}/${period}/${weather}`);
  }
}

const rarityFromKorean={일반:'common',고급:'uncommon',희귀:'rare',영웅:'heroic',전설:'legendary'};
const periodFromKorean={새벽:'DAWN',낮:'DAY',황혼:'DUSK',밤:'NIGHT'};
const weatherFromKorean={맑음:'clear',비:'rain',폭풍:'storm'};
const parseValues=(value,labels)=>value==='—'?null:value.split('·').map(label=>labels[label]);
const documented=[];
let documentedHabitat=null;
for(const line of read('docs/FISHING_74_EXPANSION_DESIGN.md').split(/\r?\n/)){
  const heading=line.match(/^### 4\.(?:[1-9]|10) .*\(`([^`]+)`\)/);
  if(heading) documentedHabitat=heading[1];
  const cells=line.split('|').slice(1,-1).map(cell=>cell.trim());
  if(!documentedHabitat||cells.length!==6||!/^`fish\.[^`]+`$/.test(cells[0])) continue;
  const id=cells[0].slice(1,-1);
  documented.push({
    id,name:cells[1],asset:id.slice(5),habitat:documentedHabitat,rarity:rarityFromKorean[cells[2]],
    periods:parseValues(cells[3],periodFromKorean),weather:parseValues(cells[4],weatherFromKorean),description:cells[5]
  });
}
assert.equal(documented.length,74,'The design document roster must contain 74 parsable species');
assert.deepEqual(target.map(({introducedVersion,...fish})=>fish),documented,
  'The machine-readable target roster and design document differ');

const baseline=JSON.parse(read('docs/FISHING_BASELINE_V1.json'));
const baselineIds=baseline.legacyFish.map(record=>record[0]);
assert.equal(target.filter(fish=>fish.introducedVersion==='baseline-v1').length,20,
  'Exactly 20 target species must retain baseline identity');
assert.ok(baselineIds.every(id=>target.some(fish=>fish.id===id)),
  'Every baseline fish id must remain in the target roster');
assert.equal(target.filter(fish=>fish.introducedVersion==='expansion').length,54,
  'The target roster must contain exactly 54 expansion species');

const promotedExpansionIds=['fish.bluegill','fish.killifish','fish.mandarin_fish',
  'fish.pond_smelt','fish.freshwater_eel','fish.manchurian_trout','fish.lake_trout','fish.brown_trout','fish.sturgeon','fish.aurora_trout',
  'fish.golden_trout','fish.nile_perch','fish.sockeye_salmon','fish.falls_catfish','fish.silver_manchurian','fish.tigerfish','fish.crystal_trout',
  'fish.swamp_eel','fish.swamp_catfish','fish.piranha','fish.black_ghost','fish.electric_eel','fish.arowana','fish.swamp_king_eel',
  'fish.damselfish','fish.wrasse','fish.filefish','fish.striped_damsel','fish.barred_knifejaw','fish.black_seabream','fish.cuttlefish',
  'fish.rockfish','fish.korean_rockfish'];
assert.equal(runtime.length,53,'Step 11 must expose the original 20 fish and thirty-three expansion additions');
assert.deepEqual(runtime.filter(fish=>fish.introducedVersion==='expansion').map(fish=>fish.id),promotedExpansionIds,
  'Only the thirty-three approved fish may be promoted through step 11');
const targetById=new Map(target.map(fish=>[fish.id,fish]));
for(const fish of runtime){
  const planned=targetById.get(fish.id);
  assert.ok(planned,`Live fish is missing from the target roster: ${fish.id}`);
  assert.equal(fish.name,planned.name,`Live fish name differs from target: ${fish.id}`);
  assert.equal(fish.asset,planned.asset,`Live fish asset differs from target: ${fish.id}`);
  assert.equal(fish.rarity,planned.rarity,`Live fish rarity differs from target: ${fish.id}`);
  assert.deepEqual(fish.periods,planned.periods,`Live fish periods differ from target: ${fish.id}`);
  assert.deepEqual(fish.weather,planned.weather,`Live fish weather differs from target: ${fish.id}`);
  assert.equal(fish.description,planned.description,`Live fish description differs from target: ${fish.id}`);
  assert.equal(fish.introducedVersion,planned.introducedVersion,`Live fish version marker differs from target: ${fish.id}`);
  if(fish.id==='fish.coelacanth'){
    assert.equal(fish.habitat,'coast','Coelacanth must stay live at the coast until the deep-sea migration step');
    assert.equal(planned.habitat,'boat_deep','Coelacanth target habitat must be the deep-sea route');
  }else assert.equal(fish.habitat,planned.habitat,`Live fish habitat differs from target: ${fish.id}`);
}

const dexSource=read('src/fish-dex.js');
assert.ok(!dexSource.includes('FISH_DESCRIPTIONS'),'Fish descriptions must not remain duplicated in fish-dex.js');
assert.ok(dexSource.includes("fish.description||'도감에 기록된 물고기입니다.'"),
  'Fish dex details must read descriptions from fish data');

console.log('Fishing expansion data passed: 3 groups, 10 habitats, 74 target species, 53 live species');
