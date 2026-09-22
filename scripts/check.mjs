import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const scriptFiles = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/data/fish-data.js',
  'src/world-time.js',
  'src/weather.js',
  'src/config.js',
  'src/save.js',
  'src/world.js',
  'src/world-validation.js',
  'src/simulation.js',
  'src/debug.js',
  'src/rendering.js',
  'src/interactions.js',
  'src/fishing.js',
  'src/fish-dex.js',
  'src/main.js'
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const html = read('index.html');
const scripts = scriptFiles.map(read).join('\n');
new Function(scripts);

const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const usedIds = [...scripts.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
for (const id of usedIds) assert(htmlIds.has(id), `Missing HTML element: #${id}`);

const assetPaths = [...read('src/assets.js').matchAll(/['"](assets\/[^'"]+\.png)['"]/g)].map((match) => match[1]);
assert(assetPaths.length === 54, `Expected 54 runtime asset references, found ${assetPaths.length}`);
for (const assetPath of assetPaths) {
  assert(fs.existsSync(path.join(root, assetPath)), `Missing asset: ${assetPath}`);
}

for (const npc of ['mina', 'thomas', 'elli', 'noah', 'hana', 'jun']) {
  assert(read('src/data/world-map.js').includes(`id:'${npc}'`), `Missing NPC record: ${npc}`);
}

assert(!read('src/assets.js').includes('base64,'), 'Development asset map must not contain embedded images');

const fishContext={};
vm.createContext(fishContext);
vm.runInContext(`${read('src/data/fish-data.js')}\nglobalThis.__fishData=FISH_DATA;`,fishContext);
const fishData=fishContext.__fishData;
assert(fishData.length===20,`Expected 20 fish records, found ${fishData.length}`);
assert(new Set(fishData.map(fish=>fish.id)).size===fishData.length,'Fish ids must be unique');
assert(new Set(fishData.map(fish=>fish.asset)).size===fishData.length,'Fish asset keys must be unique');

const fishAssetContext={};
vm.createContext(fishAssetContext);
vm.runInContext(`${read('src/assets.js')}\nglobalThis.__fishUrls=FISH_URLS;`,fishAssetContext);
const fishUrls=fishAssetContext.__fishUrls;
assert(Object.keys(fishUrls).length===fishData.length,
  `Expected ${fishData.length} fish image assets, found ${Object.keys(fishUrls).length}`);
for(const fish of fishData){
  const assetPath=fishUrls[fish.asset];
  assert(assetPath,`Missing fish image mapping: ${fish.id}`);
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.readUInt32BE(16)===96&&bytes.readUInt32BE(20)===96,
    `Fish image must be 96x96: ${assetPath}`);
}
for(const habitat of ['pond','river','coast']){
  const habitatFish=fishData.filter(fish=>fish.habitat===habitat);
  assert(habitatFish.length>0,`Missing fish habitat: ${habitat}`);
  assert(habitatFish.some(fish=>fish.periods===null&&fish.weather===null),`${habitat} needs an always-available fish`);
}
for(const fish of fishData){
  assert(fish.id.startsWith('fish.'),`Invalid fish id: ${fish.id}`);
  assert(fish.minSizeCm>0&&fish.maxSizeCm>fish.minSizeCm,`Invalid size range: ${fish.id}`);
  assert(fish.basePrice>0&&fish.xp>0&&fish.weight>0,`Invalid reward or weight: ${fish.id}`);
}

const eligibleFish=(habitat,period,weather)=>fishData.filter(fish=>
  fish.habitat===habitat&&
  (!fish.periods||fish.periods.includes(period))&&
  (!fish.weather||fish.weather.includes(weather))
);
for(const habitat of ['pond','river','coast']){
  for(const period of ['DAWN','DAY','DUSK','NIGHT']){
    for(const weather of ['clear','rain','storm']){
      assert(eligibleFish(habitat,period,weather).length>0,`Empty fish pool: ${habitat}/${period}/${weather}`);
    }
  }
}
assert(eligibleFish('pond','DAY','clear').map(fish=>fish.id).join(',')===
  'fish.crucian_carp,fish.koi,fish.goldfish,fish.largemouth_bass','Unexpected pond DAY/clear pool');
assert(eligibleFish('pond','NIGHT','storm').map(fish=>fish.id).join(',')===
  'fish.crucian_carp,fish.koi,fish.catfish','Unexpected pond NIGHT/storm pool');

const fishingLogicContext={
  GAME_STATE:{
    regionId:'lilacVillage',
    inventory:[],
    collections:{fish:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0}},
    activity:{active:null}
  },
  getWorldTimePeriod:()=> 'DAY',
  getWeatherKind:()=> 'clear'
};
vm.createContext(fishingLogicContext);
vm.runInContext(`${read('src/data/fish-data.js')}\n${read('src/fishing.js')}\n`+
  `const pool=getEligibleFishPool();`+
  `const repeatStreak={fishId:'fish.crucian_carp',count:3};`+
  `globalThis.__weightedBounds=[chooseWeightedFish(pool,0).id,chooseWeightedFish(pool,1).id];`+
  `globalThis.__repeatPenalty=[getEffectiveFishWeight(pool[0],repeatStreak),chooseWeightedFish(pool,.21,repeatStreak).id];`+
  `recordFishingSelection('fish.koi');recordFishingSelection('fish.koi');recordFishingSelection('fish.koi');`+
  `recordFishingSelection('fish.goldfish');`+
  `globalThis.__resetStreak={...fishingCatchStreak};`+
  `const crucian=pool[0];`+
  `const firstDiscovery=recordFishDiscovery(crucian,20);`+
  `const secondDiscovery=recordFishDiscovery(crucian,30);`+
  `globalThis.__collection={first:firstDiscovery.isFirst,second:secondDiscovery.isFirst,record:{...secondDiscovery.record}};`+
  `globalThis.__xpProgress=addFishingXp(80);`+
  `for(const fish of FISH_DATA.slice(1,5))recordFishDiscovery(fish,fish.minSizeCm);`+
  `globalThis.__reward5=applyFishCollectionRewards();`+
  `globalThis.__reward5Duplicate=applyFishCollectionRewards();`+
  `for(const fish of FISH_DATA.slice(5,10))recordFishDiscovery(fish,fish.minSizeCm);`+
  `globalThis.__reward10=applyFishCollectionRewards();`+
  `for(const fish of FISH_DATA.slice(10))recordFishDiscovery(fish,fish.minSizeCm);`+
  `globalThis.__rewardTail=applyFishCollectionRewards();`+
  `globalThis.__rewardState=JSON.parse(JSON.stringify(GAME_STATE));`+
  `globalThis.__maxProgress=addFishingXp(999999);`,fishingLogicContext);
assert(fishingLogicContext.__weightedBounds[0]==='fish.crucian_carp','Weighted selection lower bound failed');
assert(fishingLogicContext.__weightedBounds[1]==='fish.largemouth_bass','Weighted selection upper bound failed');
assert(fishingLogicContext.__repeatPenalty[0]===17.5,'Three-catch repeat weight was not halved');
assert(fishingLogicContext.__repeatPenalty[1]==='fish.koi','Repeat penalty did not affect weighted selection');
assert(fishingLogicContext.__resetStreak.fishId==='fish.goldfish'&&fishingLogicContext.__resetStreak.count===1,
  'Repeat penalty did not reset after a different fish');
assert(fishingLogicContext.__collection.first&&!fishingLogicContext.__collection.second,'Fish discovery state failed');
assert(fishingLogicContext.__collection.record.count===2,'Fish collection count failed');
assert(fishingLogicContext.__collection.record.minSizeCm===20&&fishingLogicContext.__collection.record.maxSizeCm===30,
  'Fish collection size bounds failed');
assert(fishingLogicContext.__collection.record.averageSizeCm===25,'Fish collection average failed');
assert(fishingLogicContext.__xpProgress.level===2&&fishingLogicContext.__xpProgress.xp===8&&
  fishingLogicContext.__xpProgress.totalXp===80&&fishingLogicContext.__xpProgress.leveledUp,'Fishing XP level-up failed');
assert(fishingLogicContext.__reward5.unlocked.join(',')==='5'&&
  fishingLogicContext.__rewardState.progression.coins===300,'Five-fish coin reward failed');
assert(fishingLogicContext.__reward5Duplicate.unlocked.length===0,'Fish collection reward was granted twice');
assert(fishingLogicContext.__reward10.unlocked.join(',')==='10'&&fishingLogicContext.__reward10.xpGained===240,
  'Ten-fish XP reward failed');
assert(fishingLogicContext.__rewardTail.unlocked.join(',')==='15,19,20',
  'Final fish collection rewards failed');
assert(fishingLogicContext.__rewardState.progression.flags.rareFishHints&&
  fishingLogicContext.__rewardState.progression.flags.finalFishClue&&
  fishingLogicContext.__rewardState.progression.flags.masterAnglerTitle,
  'Fish collection unlock flags failed');
assert(fishingLogicContext.__rewardState.inventory.some(item=>item.id==='rod.master_angler'),
  'Master angler rod reward failed');
assert(fishingLogicContext.__maxProgress.level===20&&fishingLogicContext.__maxProgress.xp===0&&
  fishingLogicContext.__maxProgress.nextLevelXp===null,'Fishing max-level cap failed');

const saveStorage=new Map();
const saveContext={
  console:{warn(){}},
  window:{addEventListener(){}},
  localStorage:{
    getItem(key){return saveStorage.has(key)?saveStorage.get(key):null;},
    setItem(key,value){saveStorage.set(key,String(value));}
  },
  GAME_STATE:{
    inventory:[],
    collections:{fish:{}},
    progression:{coins:1230,flags:{},fishing:{level:1,xp:0,totalXp:0}}
  }
};
vm.createContext(saveContext);
vm.runInContext(`${read('src/data/fish-data.js')}\n${read('src/save.js')}\n`+
  `GAME_STATE.inventory.push({type:'fish',id:'fish.crucian_carp',name:'붕어',rarity:'common',sizeCm:22.5,price:26,quantity:1});`+
  `GAME_STATE.collections.fish['fish.crucian_carp']={fishId:'fish.crucian_carp',name:'붕어',rarity:'common',count:2,minSizeCm:20,maxSizeCm:25,totalSizeCm:45,averageSizeCm:22.5};`+
  `GAME_STATE.inventory.push({type:'equipment',id:'rod.master_angler',name:'강태공의 낚싯대',quantity:1});`+
  `GAME_STATE.progression.coins=1400;GAME_STATE.progression.flags={fishCollectionRewards:{5:true,10:true,15:true,19:true,20:true},rareFishHints:true,finalFishClue:true,masterAnglerTitle:true,masterRod:true};GAME_STATE.progression.fishing={level:2,xp:8,totalXp:80};`+
  `saveGame();`+
  `GAME_STATE.inventory=[];GAME_STATE.collections.fish={};GAME_STATE.progression.coins=0;GAME_STATE.progression.flags={};GAME_STATE.progression.fishing={level:1,xp:0,totalXp:0};`+
  `globalThis.__loaded=loadGame();globalThis.__restored=JSON.parse(JSON.stringify(GAME_STATE));`,saveContext);
assert(saveContext.__loaded,'Versioned save did not load');
assert(saveContext.__restored.inventory.length===2&&saveContext.__restored.inventory[0].id==='fish.crucian_carp'&&
  saveContext.__restored.inventory[1].id==='rod.master_angler',
  'Saved inventory did not restore');
assert(saveContext.__restored.collections.fish['fish.crucian_carp'].averageSizeCm===22.5,
  'Saved fish collection did not restore');
assert(saveContext.__restored.progression.coins===1400&&saveContext.__restored.progression.fishing.level===2&&
  saveContext.__restored.progression.fishing.xp===8&&saveContext.__restored.progression.fishing.totalXp===80,
  'Saved fishing progression did not restore');
assert(saveContext.__restored.progression.flags.fishCollectionRewards[20]&&
  saveContext.__restored.progression.flags.masterAnglerTitle&&saveContext.__restored.progression.flags.masterRod,
  'Saved fish collection rewards did not restore');

const validationScripts = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/config.js',
  'src/world.js',
  'src/world-validation.js'
].map(read).join('\n');
const canvasContext = {};
const validationContext = {
  console: { info(){}, warn(){}, error: console.error },
  Image: class {},
  document: {
    getElementById(id){
      if(id!=='game') return null;
      return { width:540, height:960, getContext:()=>canvasContext };
    }
  }
};
vm.createContext(validationContext);
vm.runInContext(`${validationScripts}\nglobalThis.__worldReport=WORLD_VALIDATION_REPORT;`,validationContext);
const worldReport=validationContext.__worldReport;
assert(worldReport.map==='64x48',`Expected expanded 64x48 world, found ${worldReport.map}`);
assert(worldReport.errors.length===0,`World validation has ${worldReport.errors.length} errors`);

console.log(`Checks passed: ${scriptFiles.length} scripts, ${htmlIds.size} UI ids, ${assetPaths.length} runtime assets, ${fishData.length} fish, world ${worldReport.map}`);
