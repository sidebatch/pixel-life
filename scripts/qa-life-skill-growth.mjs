// Growth boundaries and real v2-save migration; no user storage is accessed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const clone=value=>JSON.parse(JSON.stringify(value));
const storage=new Map();
const context={console:{warn(){}},window:{addEventListener(){}},localStorage:{
  getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))},
  GAME_STATE:{regionId:'lilacVillage',playerLocation:null,inventory:[],world:{trees:{},plots:{}},
    collections:{fish:{},trees:{}},progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0},logging:{level:1,xp:0,totalXp:0}}}};
vm.createContext(context);
const files=['data/world-map.js','data/region-maps.js','data/fishing-habitat-data.js','data/fish-data.js',
  'data/fishing-gear-data.js','data/life-skill-data.js','data/life-content-data.js','data/character-rig-data.js',
  'data/sword-data.js','data/tree-dex-data.js','life-skills.js'];
vm.runInContext(files.map(file=>read('src/'+file)).join('\n')+
  "\nconst DEFAULT_OUTFIT_ID='outfit.traveler';const CHARACTER_OUTFIT_BY_ID=new Map([[DEFAULT_OUTFIT_ID,{}]]);"+
  "\nconst CHARACTER_PARTS={body:new Map([['body.starter',{}]]),hair:new Map([['hair.brown',{}]]),backpack:new Map([['pack.traveler',{}]])};\n"+
  read('src/save.js')+
  '\nglobalThis.api={lifeSkillXpForNextLevel,lifeSkillTotalXpForLevel,lifeSkillProgressFromTotal,lifeSkillMasteryXpRequired,'+
  'normalizeSavedFishingProgress,normalizeSavedLoggingProgress,createSaveData,applySaveData,saveGame,loadGame,grantLifeSkillXp,'+
  'FORESTRY_TREES,forestryTreeXp,FORESTRY_AXES,FISHING_RODS,SAVE_CONFIG,getSaveKnownTrees};',context);
const r=context.api;
const legacyRequired=level=>level<=20?60+level*12:level<=30?300+(level-20)*14:
  level<=60?440+(level-30)*22:level<=80?1100+(level-60)*38:1860+(level-80)*55;
const legacyBase=level=>Array.from({length:level-1},(_,i)=>legacyRequired(i+1)).reduce((a,b)=>a+b,0);
assert.equal(legacyBase(100),106690);
assert.equal(r.lifeSkillTotalXpForLevel('logging',100),187230);
assert.equal(r.lifeSkillTotalXpForLevel('fishing',100),187230);
assert.equal(r.lifeSkillXpForNextLevel('logging',80),2139);
assert.equal(r.lifeSkillXpForNextLevel('logging',90),6387);
assert.equal(r.lifeSkillXpForNextLevel('logging',99),11620);
for(let level=1;level<80;level++)assert.equal(r.lifeSkillXpForNextLevel('fishing',level),legacyRequired(level));
for(const skill of ['fishing','logging'])for(let level=2;level<=100;level++){
  const total=r.lifeSkillTotalXpForLevel(skill,level);
  assert.equal(r.lifeSkillProgressFromTotal(skill,total-1).level,level-1);
  assert.equal(r.lifeSkillProgressFromTotal(skill,total).level,level);
}
const xp=[0,7,8,9,10,11,12,15,16,17,18];
assert.equal(Object.keys(r.FORESTRY_TREES).length,50);
for(const tree of Object.values(r.FORESTRY_TREES))assert.equal(r.forestryTreeXp(tree),xp[tree.tier]);
let migratedCases=0;
for(const [skill,normalize] of [['fishing',r.normalizeSavedFishingProgress],['logging',r.normalizeSavedLoggingProgress]]){
  for(let level=1;level<100;level++)for(const amount of new Set([0,1,Math.floor(legacyRequired(level)*.37),Math.floor(legacyRequired(level)*.99),legacyRequired(level)-1])){
    const saved={level,xp:amount,totalXp:legacyBase(level)+amount};
    const next=normalize(saved);
    assert.equal(next.level,level,`${skill} lost/gained Lv.${level}`);
    assert.equal(next.xpCurveVersion,2);
    const required=r.lifeSkillXpForNextLevel(skill,level);
    assert.equal(next.xp,Math.ceil(amount*required/legacyRequired(level)));
    assert(Math.floor(next.xp/required*100)>=Math.floor(amount/legacyRequired(level)*100),'Displayed bar went backwards');
    assert.deepEqual(clone(normalize(next)),clone(next),'Migration repeated on new progress');
    migratedCases++;
  }
  for(let mastery=0;mastery<=30;mastery++)for(const amount of [0,17,r.lifeSkillMasteryXpRequired(mastery)-1]){
    const earned=mastery*4000+mastery*(mastery-1)/2*250+amount;
    for(const includeTotal of [true,false]){
      const saved={level:100,xp:0,mastery,masteryXp:amount,...(includeTotal?{totalXp:legacyBase(100)+earned}:{})};
      const next=normalize(saved);
      assert.equal(next.level,100);assert.equal(next.mastery,mastery);assert.equal(next.masteryXp,amount);
      assert.equal(next.totalXp,187230+earned);
      assert.deepEqual(clone(normalize(next)),clone(next));migratedCases++;
    }
  }
  const oldCap=normalize({level:20,xp:0,totalXp:legacyBase(85)+931});
  assert.equal(oldCap.level,85,'Historical Lv.20 cap lost earned total XP');
  assert.equal(oldCap.xp,Math.ceil(931*r.lifeSkillXpForNextLevel(skill,85)/legacyRequired(85)));
}
// Use the real serializer/load path, preserving non-XP progress and a new curve marker.
const data=clone(r.createSaveData());
data.state.progression.coins=9876;
data.state.location={regionId:'oldForest',x:31,y:44,face:'up'};
data.state.inventory=[{type:'fish',id:'fish.crucian_carp',quantity:1,sizeCm:22.5,price:78},
  {type:'material',id:'oak_log',quantity:7},{type:'seed',id:'carrot',quantity:5},
  {type:'consumable',id:'village_return_charm',quantity:3}];
data.state.world={trees:{[r.getSaveKnownTrees().keys().next().value]:{hp:50,maxHp:100,choppedAt:null}},plots:{}};
data.state.collections={fish:{'fish.crucian_carp':{count:2,minSizeCm:20,maxSizeCm:25,totalSizeCm:45}},trees:{oak:{count:17}}};
data.state.progression.fishing={level:85,xp:931,totalXp:legacyBase(85)+931,
  purchasedRodIds:Array.from(r.FISHING_RODS,rod=>rod.id),equippedRodId:'rod.aurora',durabilityByRodId:{'rod.aurora':84}};
data.state.progression.logging={level:100,xp:0,mastery:3,masteryXp:17,totalXp:legacyBase(100)+4000+4250+4500+17};
data.state.progression.forestry={axeId:'axe.primordial',ownedAxeIds:Array.from(r.FORESTRY_AXES,axe=>axe.id),durabilityByAxeId:{'axe.primordial':890}};
storage.set(r.SAVE_CONFIG.key,JSON.stringify(data));
assert(r.loadGame());
const loaded=clone(context.GAME_STATE);
assert.equal(loaded.progression.fishing.level,85);
assert.equal(loaded.progression.fishing.equippedRodId,'rod.aurora');
assert.equal(loaded.progression.fishing.durabilityByRodId['rod.aurora'],84);
assert.equal(loaded.progression.forestry.axeId,'axe.primordial');
assert.equal(loaded.progression.forestry.durabilityByAxeId['axe.primordial'],890);
assert.equal(loaded.progression.logging.mastery,3);assert.equal(loaded.progression.logging.masteryXp,17);
assert.equal(loaded.progression.coins,9876);assert.equal(loaded.regionId,'oldForest');
assert.equal(loaded.inventory.find(i=>i.id==='fish.crucian_carp').price,78);
assert.equal(loaded.inventory.find(i=>i.id==='oak_log').quantity,7);
assert.equal(loaded.inventory.find(i=>i.id==='carrot').quantity,5);
assert.equal(loaded.collections.trees.oak.count,17);
assert.equal(loaded.collections.fish['fish.crucian_carp'].count,2);
assert(r.saveGame());
const persisted=JSON.parse(storage.get(r.SAVE_CONFIG.key));
assert.equal(persisted.version,2);assert.equal(r.SAVE_CONFIG.key,'pixel-life.save.v2');
assert.equal(persisted.state.progression.fishing.xpCurveVersion,2);
assert.equal(persisted.state.progression.logging.xpCurveVersion,2);
assert(r.loadGame());assert.deepEqual(clone(context.GAME_STATE),loaded,'Reload changed migrated progress/items');
context.GAME_STATE.progression.logging=r.lifeSkillProgressFromTotal('logging',187230-7);
const result=r.grantLifeSkillXp('logging',7);
assert.equal(result.level,100);assert.equal(result.mastery,0);assert.equal(result.masteryXp,0);
assert.equal(r.grantLifeSkillXp('logging',4017).masteryXp,17);
console.log(`Life skill growth passed: ${migratedCases} legacy/current migrations, all level/mastery boundaries, 50 tree XP values, actual save/reload with tools/items/coins preserved`);
