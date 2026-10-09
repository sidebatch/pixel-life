import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(file,'utf8'),clone=x=>JSON.parse(JSON.stringify(x));
let failed=false,saves=0,persisted=null;
const elements=new Map();
const context={FISH_URLS:{},GAME_STATE:{collections:{fish:{},fishRewards:{schemaVersion:1,milestoneIds:[],habitatIds:[],revealedMilestoneIds:[],revealedHabitatIds:[]}},
  inventory:[{id:'fish.coelacanth',type:'fish',sizeCm:132.7,price:1478,quantity:3}],
  progression:{coins:4321,fishing:{level:30,xp:8,totalXp:12345},flags:{fishCollectionRewards:{5:true,10:true,15:true,19:true,20:true},masterRod:true,masterAnglerTitle:true,finalFishClue:true}}},
  saveGame(){if(failed)return false;saves++;persisted=clone(context.GAME_STATE.collections.fishRewards);return true;},
  document:{getElementById:id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',addEventListener(){}});return elements.get(id);},querySelectorAll:()=>[]},
  window:{addEventListener(){}},console:{warn(){}},localStorage:{getItem:()=>null,setItem(){}}
};vm.createContext(context);
vm.runInContext(['src/data/fishing-habitat-data.js','src/data/fish-data.js','src/data/fish-reward-data.js','src/fish-collection-rewards.js',
  'src/data/fishing-gear-data.js','src/data/life-skill-data.js','src/life-skills.js','src/save.js','src/fish-dex.js'].map(read).join('\n')+
  '\nglobalThis.fish=FISH_DATA;globalThis.milestones=FISH_DEX_MILESTONES;',context);
const run=code=>vm.runInContext(code,context),fish=clone(context.fish);
context.saveGame=()=>{if(failed)return false;saves++;persisted=clone(context.GAME_STATE.collections.fishRewards);return true;};
assert.deepEqual(clone(context.milestones).map(r=>r.count),[30,40,50,60,74]);
const records=n=>Object.fromEntries(fish.slice(0,n).map(f=>[f.id,{count:1,minSizeCm:f.minSizeCm,maxSizeCm:f.minSizeCm,totalSizeCm:f.minSizeCm}]));
for(const n of [0,29,30,39,40,49,50,59,60,73,74]){
  const result=clone(run('normalizeSavedFishDexRewards(null,'+JSON.stringify(records(n))+')'));
  assert.equal(result.milestoneIds.length,[30,40,50,60,74].filter(count=>n>=count).length);
  assert.deepEqual(result.milestoneIds,result.revealedMilestoneIds);
  assert.deepEqual(result.habitatIds,result.revealedHabitatIds);
}
context.GAME_STATE.collections.fish=records(74);run('syncFishDexRewards()');
const before=clone({coins:context.GAME_STATE.progression.coins,inventory:context.GAME_STATE.inventory,progression:context.GAME_STATE.progression});
const state=context.GAME_STATE.collections.fishRewards;
assert.equal(state.milestoneIds.length,5);assert.equal(state.habitatIds.length,10);
let cards=0;
while(run('pendingFishDexReward()')){
  const pending=clone(run('pendingFishDexReward()'));assert.ok(run('acknowledgeFishDexReward('+JSON.stringify(pending)+')'));cards++;
  assert.equal(run('acknowledgeFishDexReward('+JSON.stringify(pending)+')'),false);
}
assert.equal(cards,15);assert.equal(saves,15);assert.deepEqual(persisted,clone(state));
assert.deepEqual(clone({coins:context.GAME_STATE.progression.coins,inventory:context.GAME_STATE.inventory,progression:context.GAME_STATE.progression}),before);
assert.equal(run('fishDexActiveTitle()'),'세계의 강태공');assert.equal(run('fishDexRewardFrame()'),'fish-reward-aurora');assert.equal(run('hasFishVoyageRewardFlag()'),true);
const modern=clone(run('normalizeSavedFishDexRewards({schemaVersion:1,revealedMilestoneIds:[],revealedHabitatIds:[]},GAME_STATE.collections.fish)'));
context.GAME_STATE.collections.fishRewards=clone(modern);const pending=clone(run('pendingFishDexReward()'));
failed=true;assert.equal(run('acknowledgeFishDexReward('+JSON.stringify(pending)+')'),false);assert.deepEqual(clone(context.GAME_STATE.collections.fishRewards),modern);
failed=false;assert.equal(run('acknowledgeFishDexReward('+JSON.stringify(pending)+')'),true);
const resumed=clone(run('normalizeSavedFishDexRewards(GAME_STATE.collections.fishRewards,GAME_STATE.collections.fish)'));
assert.equal(resumed.revealedHabitatIds.length,1);assert.equal(resumed.revealedMilestoneIds.length,0);
const invalid=clone(run('normalizeSavedFishDexRewards({schemaVersion:1,milestoneIds:["fake","world-master-angler"],revealedMilestoneIds:["fake","world-master-angler"],habitatIds:["fake"],revealedHabitatIds:["fake"]},{})'));
assert.deepEqual(invalid,{schemaVersion:1,milestoneIds:[],habitatIds:[],revealedMilestoneIds:[],revealedHabitatIds:[]});
const legacy=clone(run('normalizeSavedFishDexRewards(null,GAME_STATE.collections.fish)'));
context.GAME_STATE.collections.fishRewards=legacy;assert.equal(run('pendingFishDexReward()'),null);
// Every rarity and both legacy hint flags must render the same unknown detail.
let unknownChecks=0;
for(const rareFishHints of [false,true])for(const finalFishClue of [false,true])for(const f of fish){
  context.GAME_STATE.collections.fish={};Object.assign(context.GAME_STATE.progression.flags,{rareFishHints,finalFishClue});
  run('renderFishDexDetail(FISH_DATA.find(f=>f.id==='+JSON.stringify(f.id)+'))');
  const html=elements.get('fishDexDetail').innerHTML;
  assert.ok(html.includes('???'));assert.ok(!/fishDexHint|fishDexConditions|출현 힌트|마지막 단서/.test(html));assert.ok(!html.includes(f.name));unknownChecks++;
}
for(const habitat of new Set(fish.map(f=>f.habitat))){
  const pool=fish.filter(f=>f.habitat===habitat),missing=pool.at(-1);
  context.GAME_STATE.collections.fish=Object.fromEntries(pool.slice(0,-1).map(f=>[f.id,{count:9}]));
  Object.assign(context.GAME_STATE.progression.flags,{rareFishHints:true,finalFishClue:true});
  run('renderFishDexDetail(FISH_DATA.find(f=>f.id==='+JSON.stringify(missing.id)+'))');
  assert.ok(!/fishDexHint|fishDexConditions|마지막 단서/.test(elements.get('fishDexDetail').innerHTML));unknownChecks++;
}
for(const f of fish){
  context.GAME_STATE.collections.fish={[f.id]:{count:1,minSizeCm:f.minSizeCm,maxSizeCm:f.minSizeCm,averageSizeCm:f.minSizeCm}};
  run('renderFishDexDetail(FISH_DATA.find(f=>f.id==='+JSON.stringify(f.id)+'))');
  const html=elements.get('fishDexDetail').innerHTML;
  assert.ok(html.includes(f.name)&&html.includes('fishDexConditions')&&html.includes('크기'));
}
assert.equal(run("fishDexLegacyRewardLabel({count:15,kind:'rareHints'})"),'15종 발견 기록');
assert.equal(run("fishDexLegacyRewardLabel({count:19,kind:'finalClue'})"),'19종 발견 기록');
for(const count of [14,18]){
  run('renderFishDexReward('+count+')');assert.ok(!/힌트|단서/.test(elements.get('fishDexReward').innerHTML));
}
context.GAME_STATE.collections.fish=records(1);context.GAME_STATE.collections.fish[fish[0].id].count=999;
run('syncFishDexRewards()');assert.equal(context.GAME_STATE.collections.fishRewards.habitatIds.length,0);
console.log('Fish cosmetics passed: five thresholds, ten graduation stamps, 15 one-time cards, save/rollback, '+unknownChecks+' unknown details without hints, 74 known conditions retained, zero economy/gear changes');
