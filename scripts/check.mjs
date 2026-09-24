import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const scriptFiles = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/data/region-maps.js',
  'src/data/fish-data.js',
  'src/data/fishing-gear-data.js',
  'src/data/life-skill-data.js',
  'src/data/life-content-data.js',
  'src/world-time.js',
  'src/weather.js',
  'src/config.js',
  'src/life-skills.js',
  'src/save.js',
  'src/world.js',
  'src/world-validation.js',
  'src/simulation.js',
  'src/life-content.js',
  'src/debug.js',
  'src/rendering.js',
  'src/interactions.js',
  'src/fishing-effects.js',
  'src/fishing.js',
  'src/skill-ui.js',
  'src/fish-dex.js',
  'src/fishing-gear.js',
  'src/inventory.js',
  'src/market.js',
  'src/main.js'
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const html = read('index.html');
const scripts = scriptFiles.map(read).join('\n');
new Function(scripts);

const htmlIdList = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const htmlIds = new Set(htmlIdList);
assert(htmlIds.size === htmlIdList.length, 'HTML ids must be unique');
const usedIds = [...scripts.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
for (const id of usedIds) assert(htmlIds.has(id), `Missing HTML element: #${id}`);
assert((html.match(/role="tab"/g) || []).length === 10, 'Fish dex, inventory, and market tabs must be accessible');
assert(html.includes('id="fishDexScroll" role="tabpanel"'), 'Fish dex tab panel semantics are missing');
assert(html.includes('id="inventoryScroll" role="tabpanel"'), 'Inventory tab panel semantics are missing');
assert(html.includes('id="marketExitBtn" type="button">나가기</button>')&&
  read('src/market.js').includes("getElementById('marketExitBtn').addEventListener('click',closeMarket)"),
  'Market exit button must use the existing close behavior');

const assetPaths = [...read('src/assets.js').matchAll(/['"](assets\/[^'"]+\.png)['"]/g)].map((match) => match[1]);
assert(assetPaths.length === 75, `Expected 75 runtime asset references, found ${assetPaths.length}`);
for (const assetPath of assetPaths) {
  assert(fs.existsSync(path.join(root, assetPath)), `Missing asset: ${assetPath}`);
}
for(const assetPath of assetPaths.filter(asset=>asset.startsWith('assets/forestry/')||asset.startsWith('assets/farming/'))){
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`Invalid PNG asset: ${assetPath}`);
  const actual=`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
  const expected=assetPath.includes('/trees/')?'120x144':'96x96';
  assert(actual===expected,`Wrong life asset size: ${assetPath} (${actual}, expected ${expected})`);
  assert([4,6].includes(bytes[25]),`Life asset must have an alpha channel: ${assetPath}`);
}
for(const species of ['oak','pine','birch','maple','spruce','willow','cypress','broadleaf']){
  assert(read('src/data/region-maps.js').includes(`species:'${species}'`),`Forest tree species missing: ${species}`);
}

for (const npc of ['mina', 'thomas', 'elli', 'noah', 'hana', 'jun']) {
  assert(read('src/data/world-map.js').includes(`id:'${npc}'`), `Missing NPC record: ${npc}`);
}

assert(!read('src/assets.js').includes('base64,'), 'Development asset map must not contain embedded images');
const fishingAudioPaths=[...read('src/fishing-effects.js').matchAll(/['"](assets\/fishing\/audio\/[a-z]+\.mp3)['"]/g)].map(match=>match[1]);
assert(fishingAudioPaths.length===3&&new Set(fishingAudioPaths).size===3,'Expected three distinct fishing audio clips');
const levelUpAudioPath='assets/audio/level-up.mp3';
assert(read('src/fishing-effects.js').includes(`'${levelUpAudioPath}'`),'Missing level-up audio mapping');
const marketSaleAudioPath='assets/audio/market-sale.mp3';
assert(read('src/fishing-effects.js').includes(`'${marketSaleAudioPath}'`),'Missing market sale audio mapping');
const gameAudioPaths=[...fishingAudioPaths,levelUpAudioPath,marketSaleAudioPath];
for(const assetPath of gameAudioPaths){
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.length>1000&&bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0,`Invalid MP3 asset: ${assetPath}`);
}

const fishContext={};
vm.createContext(fishContext);
vm.runInContext(`${read('src/data/fish-data.js')}\nglobalThis.__fishData=FISH_DATA;globalThis.__fishRewards=FISH_COLLECTION_REWARDS;`,fishContext);
const fishData=fishContext.__fishData;
const fishRewards=fishContext.__fishRewards;
assert(fishData.length===20,`Expected 20 fish records, found ${fishData.length}`);
assert(new Set(fishData.map(fish=>fish.id)).size===fishData.length,'Fish ids must be unique');
assert(new Set(fishData.map(fish=>fish.asset)).size===fishData.length,'Fish asset keys must be unique');
assert(fishRewards.map(reward=>reward.count).join(',')==='5,10,15,19,20','Unexpected fish collection reward thresholds');
assert(fishRewards[0].label==='코인 300','Coin rewards should use a readable unit instead of G');

const fishingGearContext={};
vm.createContext(fishingGearContext);
vm.runInContext(`${read('src/data/fishing-gear-data.js')}\n`+
  `globalThis.__rods=FISHING_RODS;globalThis.__defaultRod=DEFAULT_FISHING_ROD_ID;`,fishingGearContext);
const fishingRods=fishingGearContext.__rods;
assert(fishingRods.map(rod=>rod.id).join(',')===
  'rod.basic,rod.sturdy,rod.steel,rod.expert,rod.master_angler','Unexpected fishing rod progression');
assert(fishingGearContext.__defaultRod==='rod.basic','Unexpected default fishing rod');
assert(fishingRods.every((rod,index)=>index===0||rod.waitReduction>=fishingRods[index-1].waitReduction),
  'Fishing rod wait bonuses must not decrease');
assert(fishingRods.at(-1).requiresMasterReward&&fishingRods.at(-1).rareWeightBonus===.35,
  'Master angler rod configuration failed');

const audioProbe={oscillators:0,starts:0,stops:0,players:[]};
class FakeAudioParam{
  setValueAtTime(){}
  exponentialRampToValueAtTime(){}
}
class FakeAudioContext{
  constructor(){this.currentTime=0;this.state='running';this.destination={};this.sampleRate=48000;}
  createOscillator(){
    audioProbe.oscillators+=1;
    return {type:'sine',frequency:new FakeAudioParam(),connect(){},start(){audioProbe.starts+=1;},stop(){audioProbe.stops+=1;}};
  }
  createGain(){return {gain:new FakeAudioParam(),connect(){}};}
}
class FakeAudio{
  constructor(src){this.src=src;this.currentTime=3;this.plays=0;this.pauses=0;audioProbe.players.push(this);}
  load(){this.loaded=true;}
  pause(){this.pauses+=1;}
  play(){this.plays+=1;return Promise.resolve();}
}
const fishingEffectsContext={window:{AudioContext:FakeAudioContext},Audio:FakeAudio};
vm.createContext(fishingEffectsContext);
vm.runInContext(`${read('src/fishing-effects.js')}\nglobalThis.__rarityEffects=FISHING_RARITY_EFFECTS;`+
  `globalThis.__soundUrls=GAME_SOUND_URLS;globalThis.__legendarySound=playFishingRaritySound('legendary');`,fishingEffectsContext);
const rarityEffects=fishingEffectsContext.__rarityEffects;
assert(Object.keys(rarityEffects).join(',')==='rare,heroic,legendary','Unexpected fishing rarity effect tiers');
assert(rarityEffects.rare.particles<rarityEffects.heroic.particles&&
  rarityEffects.heroic.particles<rarityEffects.legendary.particles,
  'Fishing rarity particle intensity must increase by tier');
assert(Object.values(rarityEffects).every(effect=>effect.tones.length>=3),
  'Every fishing rarity effect needs a multi-note sound');
assert(fishingEffectsContext.__legendarySound&&audioProbe.oscillators===11&&
  audioProbe.starts===11&&audioProbe.stops===11,
  'Legendary fishing sound scheduling failed');
vm.runInContext(`globalThis.__castSound=playFishingCastSound();globalThis.__biteSound=playFishingBiteSound();globalThis.__catchSound=playFishingCatchSound();globalThis.__levelUpSound=playSkillLevelUpSound();globalThis.__marketSaleSound=playMarketSaleSound();`,fishingEffectsContext);
assert(fishingEffectsContext.__castSound&&fishingEffectsContext.__biteSound&&fishingEffectsContext.__catchSound&&fishingEffectsContext.__levelUpSound&&fishingEffectsContext.__marketSaleSound&&
  audioProbe.players.length===5&&audioProbe.players.every(player=>player.loaded&&player.plays===1&&player.currentTime===0)&&
  audioProbe.players.map(player=>player.src).join(',')===gameAudioPaths.join(','),
  'Cast, bite, catch, level-up and market-sale MP3 fallback mapping failed');

const bufferedProbe={loaded:[],started:[],stopped:0,resumed:0};
class FakeBufferedAudioContext extends FakeAudioContext{
  constructor(){super();this.state='suspended';}
  decodeAudioData(bytes){return Promise.resolve({byteLength:bytes.byteLength});}
  createBufferSource(){
    return {buffer:null,connect(){},start(){bufferedProbe.started.push(this.buffer);},
      stop(){bufferedProbe.stopped+=1;}};
  }
  resume(){this.state='running';bufferedProbe.resumed+=1;return Promise.resolve();}
}
const bufferedContext={window:{AudioContext:FakeBufferedAudioContext},Audio:FakeAudio,
  fetch:async url=>{
    bufferedProbe.loaded.push(url);
    return {ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
  }};
vm.createContext(bufferedContext);
vm.runInContext(read('src/fishing-effects.js'),bufferedContext);
await vm.runInContext('gameSoundLoadPromise',bufferedContext);
vm.runInContext('playFishingCastSound();playFishingBiteSound();playFishingCatchSound();playSkillLevelUpSound();playMarketSaleSound();',bufferedContext);
assert(bufferedProbe.stopped===2,'Level-up and sale sounds must not interrupt the catch sound');
vm.runInContext('stopFishingSound("catch");stopGameSound("levelUp");stopGameSound("marketSale");',bufferedContext);
assert(bufferedProbe.loaded.join(',')===gameAudioPaths.join(',')&&bufferedProbe.started.length===5&&
  bufferedProbe.started.every(buffer=>buffer.byteLength===3)&&bufferedProbe.stopped===5&&
  bufferedProbe.resumed===1&&audioProbe.players.slice(5).every(player=>player.plays===0),
  'Predecoded game sound playback and interruption failed');

const fishingDebugContext={window:{location:{search:'?debug&fish=fish.coelacanth'}},URLSearchParams};
vm.createContext(fishingDebugContext);
vm.runInContext(`${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
  `globalThis.__forcedFish=getFishingDebugFish()?.id;`,fishingDebugContext);
assert(fishingDebugContext.__forcedFish==='fish.coelacanth','Debug fish override failed');

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
  assert(bytes.length>=24&&bytes.subarray(1,4).toString()==='PNG',`Fish image is not a valid PNG: ${assetPath}`);
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
  assert(!fish.periods||fish.periods.every(period=>['DAWN','DAY','DUSK','NIGHT'].includes(period)),
    `Invalid fishing period: ${fish.id}`);
  assert(!fish.weather||fish.weather.every(weather=>['clear','rain','storm'].includes(weather)),
    `Invalid fishing weather: ${fish.id}`);
}

const timeContext={};
vm.createContext(timeContext);
vm.runInContext(`${read('src/world-time.js')}\n`+
  `globalThis.__parsedTimes=[parseWorldTime('00:00'),parseWorldTime('23:59'),parseWorldTime('24:00'),parseWorldTime('9:7')];`+
  `globalThis.__periodBounds=[getWorldTimePeriod(299),getWorldTimePeriod(300),getWorldTimePeriod(479),getWorldTimePeriod(480),getWorldTimePeriod(1019),getWorldTimePeriod(1020),getWorldTimePeriod(1199),getWorldTimePeriod(1200)];`,timeContext);
assert(timeContext.__parsedTimes.join(',')==='0,1439,,','World-time parser boundary check failed');
assert(timeContext.__periodBounds.join(',')==='NIGHT,DAWN,DAWN,DAY,DAY,DUSK,DUSK,NIGHT',
  'World-time period boundary check failed');

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
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,equippedRodId:'rod.basic'}},
    activity:{active:null}
  },
  getWorldTimePeriod:()=> 'DAY',
  getWeatherKind:()=> 'clear'
};
vm.createContext(fishingLogicContext);
vm.runInContext(`${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
  `const pool=getEligibleFishPool();`+
  `globalThis.__villagePool=pool.map(fish=>fish.id);`+
  `globalThis.__villageReachable=[...new Set(['DAWN','DAY','DUSK','NIGHT'].flatMap(period=>['clear','rain','storm'].flatMap(weather=>getEligibleFishPool({regionId:'lilacVillage',habitat:'pond',period,weather}).map(fish=>fish.id))))];`+
  `globalThis.__futureRiverPool=getEligibleFishPool({regionId:'oldForest',habitat:'river',period:'DAY',weather:'clear'}).map(fish=>fish.id);`+
  `globalThis.__farmPool=getEligibleFishPool({regionId:'sunnyFields',habitat:'pond',period:'DAY',weather:'clear'}).map(fish=>fish.id);`+
  `globalThis.__futureCoastPool=getEligibleFishPool({regionId:'coast',habitat:'coast',period:'DAY',weather:'clear'}).map(fish=>fish.id);`+
  `const repeatStreak={fishId:'fish.crucian_carp',count:3};`+
  `globalThis.__weightedBounds=[chooseWeightedFish(pool,0).id,chooseWeightedFish(pool,1).id];`+
  `globalThis.__repeatPenalty=[getEffectiveFishWeight(pool[0],repeatStreak),chooseWeightedFish(pool,.1,repeatStreak).id];`+
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
  `GAME_STATE.progression.fishing.level=15;GAME_STATE.progression.fishing.equippedRodId='rod.expert';`+
  `const expertRod=getEquippedFishingRod();const catfish=FISH_DATA.find(fish=>fish.id==='fish.catfish');`+
  `globalThis.__expertRod={id:expertRod.id,wait:getFishingRodWaitMultiplier(expertRod),rareWeight:getEffectiveFishWeight(catfish,{fishId:null,count:0},expertRod),commonWeight:getEffectiveFishWeight(crucian,{fishId:null,count:0},expertRod),sizeFloor:applyFishingRodSizeBonus(0,expertRod)};`+
  `GAME_STATE.progression.fishing.equippedRodId='rod.master_angler';const masterRod=getEquippedFishingRod();`+
  `globalThis.__masterRod={id:masterRod.id,wait:getFishingRodWaitMultiplier(masterRod),sizeFloor:applyFishingRodSizeBonus(0,masterRod)};`+
  `globalThis.__maxProgress=addFishingXp(999999);`,fishingLogicContext);
const fishingContextLabels=vm.runInContext(
  `['casting','waiting','bite','result'].map(phase=>{fishingState.phase=phase;return getFishingContextText();}).join('|')`,
  fishingLogicContext);
assert(fishingContextLabels==='|||🎣 낚시 결과','Fishing should use sound and the bobber marker instead of phase text');
const biteDelays=vm.runInContext(
  `[getFishingBiteDelay(0,FISHING_RODS[0]),getFishingBiteDelay(.5,FISHING_RODS[0]),getFishingBiteDelay(1,FISHING_RODS[0]),getFishingBiteDelay(.5,FISHING_RODS[3])]`,
  fishingLogicContext);
assert(biteDelays.join(',')==='3000,4500,6000,3825',
  'Bite delay must be random within 3–6 seconds before the equipped rod reduction');
assert(fishingLogicContext.__villageReachable.length===fishData.length&&
  fishingLogicContext.__villageReachable.every(id=>fishData.some(fish=>fish.id===id)),
  'Every fish must be reachable at the village pond across time and weather conditions');
assert(fishingLogicContext.__villagePool.includes('fish.flounder')&&
  fishingLogicContext.__villagePool.includes('fish.minnow')&&
  !fishingLogicContext.__villagePool.includes('fish.coelacanth')&&
  fishingLogicContext.__futureRiverPool.length>0&&fishingLogicContext.__futureCoastPool.length>0&&
  fishingLogicContext.__farmPool.length>0&&
  fishingLogicContext.__farmPool.every(id=>fishData.find(fish=>fish.id===id).habitat==='pond')&&
  fishingLogicContext.__futureRiverPool.every(id=>fishData.find(fish=>fish.id===id).habitat==='river')&&
  fishingLogicContext.__futureCoastPool.every(id=>fishData.find(fish=>fish.id===id).habitat==='coast'),
  'Temporary village preview must keep weather and future region-specific pools');
assert(fishingLogicContext.__weightedBounds[0]==='fish.crucian_carp','Weighted selection lower bound failed');
assert(fishingLogicContext.__weightedBounds[1]==='fish.flounder','Weighted selection upper bound failed');
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
  fishingLogicContext.__rewardState.progression.coins===300&&
  fishingLogicContext.__reward5.messages[0]==='5종 보상 · 코인 +300','Five-fish coin reward failed');
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
assert(fishingLogicContext.__expertRod.id==='rod.expert'&&fishingLogicContext.__expertRod.wait===.85&&
  Math.abs(fishingLogicContext.__expertRod.rareWeight-8.4)<1e-9&&
  fishingLogicContext.__expertRod.commonWeight===35&&fishingLogicContext.__expertRod.sizeFloor===.08,
  'Expert fishing rod effects failed');
assert(fishingLogicContext.__masterRod.id==='rod.master_angler'&&fishingLogicContext.__masterRod.wait===.75&&
  fishingLogicContext.__masterRod.sizeFloor===.15,'Master fishing rod effects failed');
assert(fishingLogicContext.__maxProgress.level===100&&fishingLogicContext.__maxProgress.nextLevelXp===null&&
  fishingLogicContext.__maxProgress.mastery>0&&fishingLogicContext.__maxProgress.totalXp>999999,
  'Fishing level 100 and mastery progression failed');
vm.runInContext(
  `globalThis.__level20Edge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',21)-1);`+
  `globalThis.__level21Edge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',21));`+
  `globalThis.__level100Edge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',100));`+
  `globalThis.__masteryEdge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',100)+lifeSkillMasteryXpRequired(0)+17);`,
  fishingLogicContext
);
assert(fishingLogicContext.__level20Edge.level===20&&fishingLogicContext.__level20Edge.xp===299&&
  fishingLogicContext.__level21Edge.level===21&&fishingLogicContext.__level21Edge.xp===0,
  'Level 20 to 21 threshold failed');
assert(fishingLogicContext.__level100Edge.level===100&&fishingLogicContext.__level100Edge.mastery===0&&
  fishingLogicContext.__masteryEdge.level===100&&fishingLogicContext.__masteryEdge.mastery===1&&
  fishingLogicContext.__masteryEdge.masteryXp===17,'Level 100 mastery boundary failed');

const saveStorage=new Map();
const saveContext={
  console:{warn(){}},
  window:{addEventListener(){}},
  localStorage:{
    getItem(key){return saveStorage.has(key)?saveStorage.get(key):null;},
    setItem(key,value){saveStorage.set(key,String(value));}
  },
  GAME_STATE:{
    regionId:'lilacVillage',playerLocation:null,world:{trees:{},plots:{}},
    inventory:[],
    collections:{fish:{}},
    progression:{coins:1230,flags:{},fishing:{level:1,xp:0,totalXp:0}}
  }
};
vm.createContext(saveContext);
vm.runInContext(`${read('src/data/world-map.js')}\n${read('src/data/region-maps.js')}\n${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/data/life-content-data.js')}\n${read('src/life-skills.js')}\n${read('src/save.js')}\n`+
  `GAME_STATE.inventory.push({type:'fish',id:'fish.crucian_carp',name:'붕어',rarity:'common',sizeCm:22.5,price:26,quantity:1});`+
  `GAME_STATE.collections.fish['fish.crucian_carp']={fishId:'fish.crucian_carp',name:'붕어',rarity:'common',count:2,minSizeCm:20,maxSizeCm:25,totalSizeCm:45,averageSizeCm:22.5};`+
  `GAME_STATE.inventory.push({type:'equipment',id:'rod.master_angler',name:'강태공의 낚싯대',quantity:1});`+
  `GAME_STATE.progression.coins=1400;GAME_STATE.progression.flags={fishCollectionRewards:{5:true,10:true,15:true,19:true,20:true},rareFishHints:true,finalFishClue:true,masterAnglerTitle:true,masterRod:true};GAME_STATE.progression.fishing={level:2,xp:8,totalXp:80,equippedRodId:'rod.master_angler'};`+
  `saveGame();`+
  `GAME_STATE.inventory=[];GAME_STATE.collections.fish={};GAME_STATE.progression.coins=0;GAME_STATE.progression.flags={};GAME_STATE.progression.fishing={level:1,xp:0,totalXp:0};`+
  `globalThis.__loaded=loadGame();globalThis.__restored=JSON.parse(JSON.stringify(GAME_STATE));`+
  `globalThis.__lockedRod=normalizeSavedFishingProgress({level:2,xp:0,totalXp:0,equippedRodId:'rod.expert'},{},[]);`+
  `globalThis.__oldCap=normalizeSavedFishingProgress({level:20,xp:0,totalXp:lifeSkillTotalXpForLevel('fishing',20)+900,equippedRodId:'rod.expert'},{},[]);`+
  `globalThis.__savedMastery=normalizeSavedFishingProgress({level:100,xp:0,totalXp:lifeSkillTotalXpForLevel('fishing',100)+lifeSkillMasteryXpRequired(0)+17,equippedRodId:'rod.expert'},{},[]);`,saveContext);
assert(saveContext.__loaded,'Versioned save did not load');
assert(saveContext.__restored.inventory.length===2&&saveContext.__restored.inventory[0].id==='fish.crucian_carp'&&
  saveContext.__restored.inventory[1].id==='rod.master_angler',
  'Saved inventory did not restore');
assert(saveContext.__restored.collections.fish['fish.crucian_carp'].averageSizeCm===22.5,
  'Saved fish collection did not restore');
assert(saveContext.__restored.progression.coins===1400&&saveContext.__restored.progression.fishing.level===2&&
  saveContext.__restored.progression.fishing.xp===8&&saveContext.__restored.progression.fishing.totalXp===80&&
  saveContext.__restored.progression.fishing.equippedRodId==='rod.master_angler',
  'Saved fishing progression did not restore');
assert(saveContext.__restored.progression.flags.fishCollectionRewards[20]&&
  saveContext.__restored.progression.flags.masterAnglerTitle&&saveContext.__restored.progression.flags.masterRod,
  'Saved fish collection rewards did not restore');
assert(saveContext.__lockedRod.equippedRodId==='rod.basic','Locked saved fishing rod must fall back to basic');
assert(saveContext.__oldCap.level>20&&saveContext.__oldCap.totalXp===4320,
  'Saved fishing XP beyond the old level 20 cap must be restored');
assert(saveContext.__savedMastery.level===100&&saveContext.__savedMastery.mastery===1&&
  saveContext.__savedMastery.masteryXp===17&&saveContext.__savedMastery.equippedRodId==='rod.expert',
  'Level 100 mastery save restoration failed');
vm.runInContext(`GAME_STATE.regionId='sunnyFields';GAME_STATE.playerLocation={x:14,y:24,face:'right'};`+
  `GAME_STATE.inventory.push({type:'material',id:'log',name:'통나무',quantity:5},{type:'seed',id:'carrot',name:'당근 씨앗',quantity:2});`+
  `GAME_STATE.world={trees:{forest_tree_01:{hp:0,choppedAt:Date.now()}},plots:{farm_09:{unlocked:true,cropId:'carrot',plantedAt:Date.now()-30000}}};`+
  `saveGame();GAME_STATE.inventory=[];GAME_STATE.world={trees:{},plots:{}};GAME_STATE.regionId='lilacVillage';`+
  `globalThis.__lifeLoaded=loadGame();globalThis.__lifeRestored=JSON.parse(JSON.stringify(GAME_STATE));`,saveContext);
assert(saveContext.__lifeLoaded&&saveContext.__lifeRestored.regionId==='sunnyFields'&&
  saveContext.__lifeRestored.playerLocation.x===14&&
  saveContext.__lifeRestored.inventory.some(item=>item.type==='material'&&item.quantity===5)&&
  saveContext.__lifeRestored.inventory.some(item=>item.type==='seed'&&item.id==='carrot'&&item.quantity===2)&&
  saveContext.__lifeRestored.world.trees.forest_tree_01.hp===0&&
  saveContext.__lifeRestored.world.plots.farm_09.cropId==='carrot'&&
  saveContext.__lifeRestored.world.plots.farm_01.unlocked&&
  saveContext.__lifeRestored.world.plots.farm_05.unlocked&&
  !saveContext.__lifeRestored.world.plots.farm_03.unlocked,
  'Region, life inventory, tree respawn, and initial farm plot state must survive reload');
saveStorage.set('pixel-life.save','{not-json');
vm.runInContext('globalThis.__invalidJsonSave=loadGame();',saveContext);
assert(saveContext.__invalidJsonSave===false,'Malformed save JSON must fail safely');
saveStorage.set('pixel-life.save',JSON.stringify({version:999,state:{}}));
vm.runInContext('globalThis.__futureVersionSave=loadGame();',saveContext);
assert(saveContext.__futureVersionSave===false,'Unknown save version must not be applied');

const inventoryContext={
  FISH_DATA:[{id:'fish.crucian_carp',name:'붕어'},{id:'fish.goldfish',name:'금붕어'}],
  GAME_STATE:{inventory:[]}
};
vm.createContext(inventoryContext);
vm.runInContext(`${read('src/inventory.js')}\n`+
  `globalThis.__grouped=groupInventoryFish([`+
  `{type:'fish',id:'fish.crucian_carp',sizeCm:22.5,price:26,quantity:1},`+
  `{type:'fish',id:'fish.goldfish',sizeCm:11.2,price:80,quantity:1},`+
  `{type:'fish',id:'fish.crucian_carp',sizeCm:28.1,price:39,quantity:1},`+
  `{type:'equipment',id:'rod.basic',quantity:1}`+
  `]);`,inventoryContext);
assert(inventoryContext.__grouped.length===2&&inventoryContext.__grouped[0].fish.id==='fish.crucian_carp'&&
  inventoryContext.__grouped[0].count===2&&inventoryContext.__grouped[0].entries[0].sizeCm===28.1&&
  inventoryContext.__grouped[0].entries[0].price===39&&
  inventoryContext.__grouped[0].entries[1].sizeCm===22.5&&
  inventoryContext.__grouped[0].entries[1].price===26,
  'Inventory must group by species without losing each catch size and price');
const inventorySummaryNode={textContent:''};
const inventoryScrollNode={innerHTML:''};
inventoryContext.document={getElementById(id){return id==='inventorySummary'?inventorySummaryNode:inventoryScrollNode;}};
inventoryContext.getFishImageUrl=()=>'/fish.png';
inventoryContext.GAME_STATE.inventory=[
  {type:'fish',id:'fish.crucian_carp',sizeCm:22.5,price:26,quantity:1},
  {type:'fish',id:'fish.crucian_carp',sizeCm:28.1,price:39,quantity:1}
];
vm.runInContext('renderInventoryFish();',inventoryContext);
assert(inventorySummaryNode.textContent==='보유 물고기 2마리'&&
  inventoryScrollNode.innerHTML.includes('class="inventoryFishGrid"')&&
  inventoryScrollNode.innerHTML.includes('class="inventoryFishCard rarity-')&&
  inventoryScrollNode.innerHTML.includes('aria-label="붕어, 2마리"')&&
  inventoryScrollNode.innerHTML.includes('class="inventoryFishCount" aria-hidden="true">2</strong>')&&
  inventoryScrollNode.innerHTML.includes('class="inventoryFishName" aria-hidden="true">붕어</span>')&&
  !inventoryScrollNode.innerHTML.includes('22.5cm')&&
  !inventoryScrollNode.innerHTML.includes('판매가')&&
  inventoryContext.GAME_STATE.inventory[0].price===26&&
  inventoryContext.GAME_STATE.inventory[1].sizeCm===28.1,
  'Inventory grid must badge counts and preserve individual catch data');

const lifeContext={
  GAME_STATE:{regionId:'oldForest',inventory:[],world:{trees:{},plots:{}},progression:{coins:500}},
  saveGame:()=>true,
  performance:{now:()=>100},
  setTimeout:()=>1,clearTimeout:()=>{}
};
vm.createContext(lifeContext);
vm.runInContext(`${read('src/data/world-map.js')}\n${read('src/data/region-maps.js')}\n${read('src/data/life-content-data.js')}\n${read('src/life-content.js')}\n`,lifeContext);
const toastNode={textContent:'',classList:{add(){},remove(){}}};
const coinNode={textContent:''};
lifeContext.document={getElementById(id){return id==='lifeToast'?toastNode:coinNode;}};
vm.runInContext(`const testTree=REGION_WORLDS.oldForest.trees.find(tree=>tree.id==='forest_tree_01');`+
  `globalThis.__hits=[hitResourceTree(testTree),hitResourceTree(testTree),hitResourceTree(testTree),hitResourceTree(testTree)];`+
  `globalThis.__logs=lifeItemCount('material','log');`+
  `globalThis.__regrown=getTreeState(testTree,Date.now()+LIFE_CONTENT.treeRespawnMs+1);`+
  `const lockedPlot=REGION_WORLDS.sunnyFields.farmPlots[2];GAME_STATE.regionId='sunnyFields';`+
  `GAME_STATE.progression.coins=50;globalThis.__poorBuy=buyFarmPlot(lockedPlot);`+
  `GAME_STATE.progression.coins=500;globalThis.__plotBought=buyFarmPlot(lockedPlot);`+
  `globalThis.__doubleBuy=buyFarmPlot(lockedPlot);`+
  `addLifeItem('seed','carrot',1);globalThis.__planted=plantFarmCrop(lockedPlot,'carrot');`+
  `globalThis.__doublePlant=plantFarmCrop(lockedPlot,'carrot');`+
  `GAME_STATE.world.plots[lockedPlot.id].plantedAt=Date.now()-LIFE_CROP_BY_ID.get('carrot').growMs-1;`+
  `globalThis.__offlinePhase=getFarmPlotPhase(lockedPlot);`+
  `globalThis.__harvested=harvestFarmCrop(lockedPlot);globalThis.__doubleHarvest=harvestFarmCrop(lockedPlot);`+
  `globalThis.__cropCount=lifeItemCount('crop','carrot');`,lifeContext);
assert(lifeContext.__hits.join(',')==='true,true,true,false'&&lifeContext.__logs>=2&&lifeContext.__logs<=4&&
  lifeContext.__regrown.hp===3,'Trees must take three hits, grant one drop, and regrow from wall-clock time');
assert(lifeContext.__poorBuy===false&&lifeContext.__plotBought===true&&lifeContext.__doubleBuy===false&&
  lifeContext.GAME_STATE.progression.coins===400&&lifeContext.__planted===true&&lifeContext.__doublePlant===false&&
  lifeContext.__offlinePhase==='READY'&&lifeContext.__harvested===true&&lifeContext.__doubleHarvest===false&&
  lifeContext.__cropCount>=2&&lifeContext.__cropCount<=3,
  'Farm must reject unaffordable/duplicate actions and allow offline growth and one harvest');
lifeContext.saveGame=()=>false;
vm.runInContext(`GAME_STATE.regionId='oldForest';const before=lifeItemCount('material','log');`+
  `globalThis.__failedHit=hitResourceTree(REGION_WORLDS.oldForest.trees.find(tree=>tree.id==='forest_tree_02'));`+
  `globalThis.__rollbackOk=lifeItemCount('material','log')===before&&!GAME_STATE.world.trees.forest_tree_02;`,lifeContext);
assert(lifeContext.__failedHit===false&&lifeContext.__rollbackOk,
  'Failed life-content save must roll back tree damage and rewards');

const marketContext={
  FISH_DATA:[{id:'fish.crucian_carp'},{id:'fish.goldfish'}],
  lifeItemCount:(type,id,inventory)=>inventory.reduce((sum,item)=>sum+(item.type===type&&item.id===id?item.quantity:0),0),
  GAME_STATE:{inventory:[
    {type:'fish',id:'fish.crucian_carp',sizeCm:22.5,price:26,quantity:1},
    {type:'fish',id:'fish.goldfish',sizeCm:11.2,price:80,quantity:1},
    {type:'fish',id:'fish.crucian_carp',sizeCm:28.1,price:39,quantity:2},
    {type:'equipment',id:'rod.master_angler',quantity:1}
  ],progression:{coins:100}}
};
vm.createContext(marketContext);
vm.runInContext(`${read('src/data/life-content-data.js')}\n${read('src/market.js')}\n`+
  `globalThis.__sale=planFishSale(new Map([['fish.crucian_carp',2]]));`+
  `globalThis.__multiSale=planFishSale(new Map([['fish.crucian_carp',1],['fish.goldfish',1]]));`+
  `globalThis.__overSale=planFishSale(new Map([['fish.crucian_carp',4]]));`+
  `globalThis.__zeroSale=planFishSale(new Map());`+
  `const goods=[{type:'material',id:'log',quantity:4},{type:'crop',id:'carrot',quantity:3},{type:'equipment',id:'rod.master_angler',quantity:1}];`+
  `globalThis.__goodsSale=planGoodsSale(new Map([['material:log',2],['crop:carrot',1]]),goods);`+
  `globalThis.__goodsOversale=planGoodsSale(new Map([['material:log',5]]),goods);`,marketContext);
assert(marketContext.__sale.count===2&&marketContext.__sale.total===65&&
  marketContext.__sale.inventory.length===3&&
  marketContext.__sale.inventory[0].id==='fish.goldfish'&&
  marketContext.__sale.inventory[1].id==='fish.crucian_carp'&&
  marketContext.__sale.inventory[1].quantity===1&&
  marketContext.__sale.inventory[2].type==='equipment'&&
  marketContext.GAME_STATE.inventory.length===4,
  'Market sale must use oldest fish prices, preserve remaining fish and equipment, and avoid mutating source');
assert(marketContext.__overSale===null&&marketContext.__zeroSale.count===0&&marketContext.__zeroSale.total===0,
  'Market must reject overselling and treat empty selection as no sale');
assert(marketContext.__multiSale.count===2&&marketContext.__multiSale.total===106&&
  marketContext.__multiSale.inventory.length===2&&
  marketContext.__multiSale.inventory[0].quantity===2&&
  marketContext.__multiSale.inventory[1].type==='equipment',
  'Market must combine selected species and preserve unsold inventory');
assert(marketContext.__goodsSale.count===3&&marketContext.__goodsSale.total===32&&
  marketContext.__goodsSale.inventory[0].quantity===2&&
  marketContext.__goodsSale.inventory[1].quantity===2&&
  marketContext.__goodsSale.inventory[2].type==='equipment'&&marketContext.__goodsOversale===null,
  'Material sale must use selected quantities, preserve equipment, and reject overselling');
const testClassList=()=>{
  const names=new Set();
  return {add(name){names.add(name);},remove(name){names.delete(name);},contains(name){return names.has(name);}};
};
const marketNodes=new Map(['coinCount','marketCoinCount','marketCoinGain'].map(id=>[id,{
  textContent:'',offsetWidth:100,classList:testClassList()
}]));
const marketWalletNode={offsetWidth:100,classList:testClassList()};
const marketPillNode={classList:testClassList()};
marketContext.document={
  getElementById(id){return marketNodes.get(id);},
  querySelector(selector){return selector==='.marketWallet'?marketWalletNode:marketPillNode;}
};
marketContext.window={matchMedia:()=>({matches:true})};
let saleSoundCount=0;
marketContext.playMarketSaleSound=()=>{saleSoundCount+=1;return true;};
marketContext.saveGame=()=>true;
vm.runInContext(`renderMarket=()=>{};marketState.selection.set('fish.crucian_carp',2);globalThis.__sold=sellSelectedFish();globalThis.__saleMessage=marketState.message;`,marketContext);
assert(marketContext.__sold===true&&marketContext.GAME_STATE.progression.coins===165&&
  marketContext.GAME_STATE.inventory.length===3&&marketNodes.get('coinCount').textContent==='165'&&
  marketNodes.get('marketCoinCount').textContent==='165'&&saleSoundCount===1&&
  marketContext.__saleMessage==='판매 완료! +65',
  'Confirmed sale must remove only selected fish, increase coins and play the supplied sound');
marketContext.saveGame=()=>false;
vm.runInContext(`marketState.selection.set('fish.goldfish',1);globalThis.__failedSale=sellSelectedFish();`,marketContext);
assert(marketContext.__failedSale===false&&marketContext.GAME_STATE.progression.coins===165&&
  marketContext.GAME_STATE.inventory.length===3&&saleSoundCount===1&&
  marketNodes.get('marketCoinCount').textContent==='165',
  'Failed save must roll back fish and coins without playing sale feedback');
const marketFrames=[];
marketContext.window.matchMedia=()=>({matches:false});
marketContext.requestAnimationFrame=callback=>{marketFrames.push(callback);return marketFrames.length;};
marketContext.cancelAnimationFrame=()=>{};
marketContext.GAME_STATE.progression.coins=265;
vm.runInContext('animateMarketCoins(165,265);',marketContext);
marketFrames.shift()(0);
const firstCoinFrame=marketNodes.get('marketCoinCount').textContent;
marketFrames.shift()(450);
const middleCoinFrame=marketNodes.get('marketCoinCount').textContent;
marketFrames.shift()(900);
assert(firstCoinFrame==='165'&&Number(middleCoinFrame)>165&&Number(middleCoinFrame)<265&&
  marketNodes.get('marketCoinCount').textContent==='265'&&
  marketNodes.get('coinCount').textContent==='265'&&
  marketNodes.get('marketCoinGain').textContent==='+100'&&
  marketNodes.get('marketCoinGain').classList.contains('show')&&
  marketWalletNode.classList.contains('coinBump'),
  'Sale animation must count upward and show the gained amount');
vm.runInContext('finishMarketCoinAnimation();',marketContext);
assert(marketNodes.get('marketCoinGain').textContent===''&&
  !marketNodes.get('marketCoinGain').classList.contains('show')&&
  !marketWalletNode.classList.contains('coinBump')&&
  !marketPillNode.classList.contains('coinBump')&&
  marketNodes.get('marketCoinCount').textContent==='265',
  'Closing and reopening the market must not replay a previous sale effect');

const validationScripts = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/data/region-maps.js',
  'src/data/fishing-gear-data.js',
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
vm.runInContext(`${validationScripts}\nglobalThis.__worldReport=WORLD_VALIDATION_REPORT;globalThis.__marketStall=marketStall;globalThis.__merchant=npcs.find(n=>n.id==='elli');globalThis.__blocked=blocked;`,validationContext);
const worldReport=validationContext.__worldReport;
assert(worldReport.map==='64x48',`Expected expanded 64x48 world, found ${worldReport.map}`);
assert(worldReport.errors.length===0,`World validation has ${worldReport.errors.length} errors`);
assert(validationContext.__blocked.has(`${validationContext.__marketStall.x},${validationContext.__marketStall.y}`)&&
  validationContext.__merchant.roam===0&&validationContext.__merchant.y===validationContext.__marketStall.y+1,
  'Open-air stall and fixed merchant position are invalid');
vm.runInContext(`GAME_STATE.regionId='oldForest';buildWorldRegion(REGION_WORLDS.oldForest);globalThis.__forestReport=validatePlayableRegion();globalThis.__resourceTrees=trees.filter(tree=>tree.interactable).length;`+
  `GAME_STATE.regionId='sunnyFields';buildWorldRegion(REGION_WORLDS.sunnyFields);globalThis.__farmReport=validatePlayableRegion();globalThis.__plots=WORLD_DEFINITION.farmPlots.length;`,validationContext);
assert(validationContext.__forestReport.region==='oldForest'&&validationContext.__resourceTrees===8&&
  validationContext.__farmReport.region==='sunnyFields'&&validationContext.__plots===16,
  'Forest and farm maps must have exits, fishing water, resource trees, and farm plots');
const accessibility=vm.runInContext(`Object.values(REGION_WORLDS).map(def=>{
  GAME_STATE.regionId=def.id;buildWorldRegion(def);
  const open=[def.playerSpawn],seen=new Set([key(def.playerSpawn.x,def.playerSpawn.y)]);
  for(let i=0;i<open.length;i++){
    const point=open[i];
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
      const x=point.x+dx,y=point.y+dy,k=key(x,y);
      if(!inside(x,y)||blocked.has(k)||seen.has(k)) continue;
      seen.add(k);open.push({x,y});
    }
  }
  const near=point=>[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>seen.has(key(point.x+dx,point.y+dy)));
  return {id:def.id,exits:(REGION_EXITS[def.id]||[]).every(exit=>seen.has(key(exit.x,exit.y))),
    fishing:near(def.fishingSpot),trees:trees.filter(tree=>tree.interactable).every(near),
    plots:(def.farmPlots||[]).every(plot=>seen.has(key(plot.x,plot.y)))};
})`,validationContext);
assert(accessibility.every(region=>region.exits&&region.fishing&&region.trees&&region.plots),
  `Each region must have reachable exits, fishing shore, resource trees, and plots: ${JSON.stringify(accessibility)}`);

console.log(`Checks passed: ${scriptFiles.length} scripts, ${htmlIds.size} UI ids, ${assetPaths.length} runtime assets, ${fishData.length} fish, world ${worldReport.map}`);
