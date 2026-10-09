import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fishingRuntime} from './lib/fishing-balance.mjs';
import {decodePNG} from './lib/png.mjs';
const r=fishingRuntime(),plain=value=>JSON.parse(JSON.stringify(value));
const rods=r.FISHING_RODS.slice(6);assert.equal(r.FISHING_RODS.length,10);
assert.deepEqual(Array.from(rods,rod=>rod.id),['rod.tidal','rod.tempest','rod.abyssal','rod.aurora']);
const state=r.state;state.progression.flags.masterRod=true;
state.collections.fish['fish.toothfish']={count:60,minSizeCm:80,maxSizeCm:100,totalSizeCm:5400};
const records=JSON.stringify(state.collections);
for(const [index,rod] of rods.entries()){
  const previous=r.FISHING_RODS[index+5];assert.equal(rod.requiresRodId,previous.id);
  assert(rod.waitReduction>previous.waitReduction&&rod.rareWeightBonus>previous.rareWeightBonus&&rod.sizeBonus>previous.sizeBonus);
  assert(Object.keys(rod.fishCost).every(id=>r.FISH_DATA.find(f=>f.id===id)?.rarity!=='legendary'));
  const icon=decodePNG(fs.readFileSync(`assets/fishing/rods/${rod.asset}.png`));
  const tool=decodePNG(fs.readFileSync(`assets/player/rig-v1/tools/rod-${rod.asset}.png`));
  for(const image of [icon,tool]){assert.equal(image.width,96);assert.equal(image.height,96);
    assert(image.data.some((v,i)=>i%4===3&&v===0));assert(image.data.some((v,i)=>i%4===3&&v>0));}
  state.progression.fishing.level=rod.unlockLevel;
  state.progression.fishing.purchasedRodIds=r.FISHING_RODS.slice(0,index+6).filter(r=>!r.requiresMasterReward).map(r=>r.id);
  state.progression.fishing.equippedRodId=previous.id;
  state.inventory=Object.entries(rod.fishCost).map(([id,count])=>({type:'fish',id,quantity:count+2,price:123,sizeCm:30}));
  state.progression.coins=rod.coins+123;
  const originalInventory=state.inventory,originalFishing=state.progression.fishing,before=plain(state);
  assert(r.canPurchaseFishingRod(rod));
  state.progression.fishing.level--;assert(!r.canPurchaseFishingRod(rod));state.progression.fishing.level++;
  state.progression.coins=rod.coins-1;assert(!r.canPurchaseFishingRod(rod));state.progression.coins=before.progression.coins;
  state.inventory[0].quantity=rod.fishCost[state.inventory[0].id]-1;assert(!r.canPurchaseFishingRod(rod));
  state.inventory[0].quantity=before.inventory[0].quantity;
  state.progression.fishing.purchasedRodIds=before.progression.fishing.purchasedRodIds.filter(id=>id!==previous.id);
  assert(!r.canPurchaseFishingRod(rod));state.progression.fishing.purchasedRodIds=before.progression.fishing.purchasedRodIds;
  r.setSaveResult(false);assert.equal(r.purchaseFishingRod(rod.id),false);
  assert.equal(state.inventory,originalInventory);assert.equal(state.progression.fishing,originalFishing);assert.deepEqual(plain(state),before);
  r.setSaveResult(true);assert(r.purchaseFishingRod(rod.id));assert.equal(state.progression.coins,123);
  assert(state.inventory.every(item=>item.quantity===2));assert.equal(state.progression.fishing.equippedRodId,previous.id);
  assert(!r.purchaseFishingRod(rod.id),'Duplicate purchase charged twice');
  r.setSaveResult(false);assert(!r.equipFishingRod(rod.id));assert.equal(state.progression.fishing.equippedRodId,previous.id);
  r.setSaveResult(true);assert(r.equipFishingRod(rod.id));assert.equal(state.progression.fishing.equippedRodId,rod.id);
  r.fishingState.phase='waiting';assert(!r.equipFishingRod(previous.id));r.fishingState.phase='idle';
  assert.equal(JSON.stringify(state.collections),records,'Recipe consumed a collection record');
}
const context={window:{addEventListener(){}},localStorage:{getItem:()=>null},console,GAME_STATE:{progression:{}}};vm.createContext(context);
const read=file=>fs.readFileSync(file,'utf8');
vm.runInContext(['src/data/fishing-habitat-data.js','src/data/fish-data.js','src/data/fishing-gear-data.js',
  'src/data/life-skill-data.js','src/life-skills.js','src/save.js'].map(read).join('\n')+
  ';globalThis.normalize=normalizeSavedFishingProgress;globalThis.total=lifeSkillTotalXpForLevel;',context);
const legacy=context.normalize({level:100,totalXp:context.total('fishing',100)},{});
assert(!legacy.purchasedRodIds.some(id=>rods.some(rod=>rod.id===id)),'Old high-level save received new rods for free');
const purchased=['rod.basic','rod.sturdy','rod.steel','rod.expert','rod.deepwater',...rods.map(rod=>rod.id)];
const modern=context.normalize({totalXp:context.total('fishing',90),equippedRodId:'rod.aurora',purchasedRodIds:purchased},{masterRod:true});
assert.equal(modern.equippedRodId,'rod.aurora');assert.deepEqual(Array.from(modern.purchasedRodIds),purchased);
const forged=context.normalize({totalXp:0,equippedRodId:'rod.aurora',purchasedRodIds:['rod.fake']},{});
assert.equal(forged.equippedRodId,'rod.basic');assert.deepEqual(Array.from(forged.purchasedRodIds),['rod.basic']);
console.log('Ten-rod QA passed: distinct art/tools, recipes/previous/level/coins, no legendary costs, purchase/equip rollback, manual equip, collection and old/new saves');
