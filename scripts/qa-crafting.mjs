import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const read=file=>fs.readFileSync(file,'utf8');
let saves=0,allowSave=true;
const state={regionId:'lilacVillage',inventory:[],world:{trees:{},plots:{}},collections:{trees:{},treeMilestones:{}},appearance:{activeTool:'sword'},
  progression:{coins:200,swords:{swordId:'sword.basic',ownedSwordIds:['sword.basic'],durabilityBySwordId:{}},hunting:{defeatedUntil:{}}}};
const context={console,Date,Math,GAME_STATE:state,FOREST_SPECIES:['oak','pine'],FOREST_WOOD:{oak:'참나무',pine:'소나무'},LIFE_CROP_BY_ID:new Map(),
  VILLAGE_RETURN_ITEM:{id:'return',name:'귀환석'},document:undefined,window:{},TILE:48,
  player:{x:20,y:34,px:984,py:1656,face:'up',moving:false},menuOpen:false,dialogOpen:false,
  dirVec:{up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},blocked:new Set(),key:(x,y)=>x+','+y,
  inside:(x,y)=>x>0&&y>0&&x<63&&y<47,regionExitAt:()=>null,isFishingActive:()=>false,
  showLifeToast(){},clearMovement(){},normalizeSavedAppearance:value=>({...value}),saveGame:()=>{saves++;return allowSave;}};
vm.createContext(context);
for(const file of ['src/data/character-rig-data.js','src/data/sword-data.js','src/data/hunting-data.js','src/data/crafting-data.js','src/life-content.js','src/sword.js'])vm.runInContext(read(file),context);
vm.runInContext(read('src/crafting.js').split("document.getElementById('craftingClose').addEventListener")[0],context);
context.document={hidden:false,getElementById:()=>null};
vm.runInContext(read('src/hunting.js'),context);
const run=code=>vm.runInContext(code,context),count=id=>run(`lifeItemCount('material','${id}')`),snapshot=()=>JSON.stringify(state);
run("addLifeItem('material','oak_log',12);addLifeItem('material','pine_log',8);");
const logs=snapshot();allowSave=false;assert.equal(run('makePortableWorkbench()'),false);assert.equal(snapshot(),logs);
allowSave=true;assert(run('makePortableWorkbench()'));assert.equal(run('totalLogCount()'),0);assert(run('hasPortableWorkbench()'));
assert.equal(run('makePortableWorkbench()'),false,'One reusable bench only');
run("addLifeItem('material','normal_leather',29)");assert.equal(run("craftRecipe('sturdy_leather',1)"),false);
run("addLifeItem('material','normal_leather',66)");assert.equal(run('craftingRecipeMax(CRAFTING_RECIPES[0])'),3);
for(const quantity of [0,-1,1.5,Infinity,NaN,4]){context.quantity=quantity;const before=snapshot();assert.equal(run("craftRecipe('sturdy_leather',quantity)"),false);assert.equal(snapshot(),before);}
const before=snapshot();allowSave=false;assert.equal(run("craftRecipe('sturdy_leather',3)"),false);assert.equal(snapshot(),before);allowSave=true;
assert(run("craftRecipe('sturdy_leather',3)"));assert.equal(count('normal_leather'),5);assert.equal(count('sturdy_leather'),3);
assert.equal(run("craftRecipe('brak_sword',1)"),false);run("addLifeItem('material','brak_tusk',1)");
const ironBefore=snapshot();allowSave=false;assert.equal(run("craftRecipe('brak_sword',1)"),false);assert.equal(snapshot(),ironBefore);allowSave=true;
assert(run("craftRecipe('brak_sword',1)"));assert.equal(count('sturdy_leather'),0);assert.equal(count('brak_tusk'),0);
assert.equal(run('getSwordDurability("sword.brak").current'),200);assert.equal(state.progression.swords.swordId,'sword.basic','Crafting must not auto equip');
assert.equal(run("craftRecipe('brak_sword',1)"),false);assert.equal(run("craftRecipe('no_recipe',1)"),false);
run("GAME_STATE.regionId='wildwoodHunt';huntingBoss.mode='aggro'");assert.equal(run("craftRecipe('sturdy_leather',1)"),false);run("huntingBoss.mode='idle'");
// Exact per-species loot, no direct coins or XP, one grant per saved life.
for(const [type,expected]of Object.entries({boar:3,deer:2,fox:1,wolf:4,bear:6,brak:10})){
  context.actor={id:type==='brak'?'wildwood_brak':type+'_1',type,hp:1};const old=count('normal_leather'),coins=state.progression.coins;
  const clean=snapshot();allowSave=false;assert.equal(run("commitHuntingHitReward(actor,16,'sword')"),false);assert.equal(snapshot(),clean);allowSave=true;
  assert(run("commitHuntingHitReward(actor,16,'sword')"));assert.equal(count('normal_leather'),old+expected);assert.equal(state.progression.coins,coins);
  assert.equal(run("commitHuntingHitReward(actor,16,'sword')"),false);assert.equal(count('normal_leather'),old+expected);
}
assert.equal(count('brak_tusk'),1);assert(state.progression.hunting.defeatedUntil.wildwood_brak>Date.now()+299000);
// Iron durability decreases only on a successful committed hit. Last hit still lands.
state.progression.swords.swordId='sword.brak';state.appearance.activeTool='sword';context.actor={id:'alive',type:'boar',hp:64};
assert(run("commitHuntingHitReward(actor,24,'sword')"));assert.equal(run('getSwordDurability().current'),199);
state.progression.swords.durabilityBySwordId['sword.brak']=1;
assert(run("commitHuntingHitReward(actor,24,'sword')"));assert.equal(run('getSwordDurability().current'),0);assert.equal(state.appearance.activeTool,'none');
assert.equal(run("commitHuntingHitReward(actor,24,'sword')"),false);
state.regionId='lilacVillage';const broken=snapshot();allowSave=false;assert.equal(run('repairSword("sword.brak")'),false);assert.equal(snapshot(),broken);allowSave=true;
assert(run('repairSword("sword.brak")'));assert.equal(state.progression.coins,100);assert.equal(run('getSwordDurability().current'),200);
assert(run('equipSword("sword.basic")'));assert.equal(run('getSwordDurability().infinite'),true);
// Saved cooldowns restore a defeated boss and preserve its original remaining time.
run('restoreHuntingCooldown(huntingBoss)');assert.equal(run('huntingBoss.hp'),0);
const remaining=run('huntingBoss.respawnAt-huntingState.clock');assert(remaining>298000&&remaining<=300000);
for(const name of ['workbench','normal-leather','sturdy-leather','brak-tusk','iron-sword']){
  const image=decodePNG(fs.readFileSync(`assets/crafting/${name}-v1.png`)),b=alphaBounds(image);
  assert.equal(image.width,96);assert.equal(image.height,96);assert(b.x>=4&&b.y>=4&&b.x+b.width<=92&&b.y+b.height<=92);
}
const image=decodePNG(fs.readFileSync('assets/hunting/brak-attack-v1.png'));
for(let i=0;i<4;i++){const b=alphaBounds(crop(image,i%2*96,Math.floor(i/2)*96,96,96));assert(b.x>=4&&b.y>=4&&b.x+b.width<=92&&b.y+b.height<=91);}
assert.equal(run('HUNTING_BOSS.hp'),320);assert.equal(run('huntingWindupMs(huntingBoss)'),1500);assert.equal(run('HUNTING_BOSS.attackCooldownMs'),2500);
const saveSource=read('src/save.js');
context.SAVE_FISH_BY_ID=new Map();context.SAVE_EQUIPMENT={};
vm.runInContext(saveSource.slice(saveSource.indexOf('function saveFiniteNumber'),saveSource.indexOf('function normalizeSavedLifeWorld')),context);
vm.runInContext(saveSource.slice(saveSource.indexOf('function normalizeSavedSwordProgress'),saveSource.indexOf('function normalizeSavedProgressionFlags')),context);
context.rawItems=[{type:'utility',id:'portable_workbench',quantity:2},{type:'utility',id:'portable_workbench',quantity:1},{type:'material',id:'normal_leather',quantity:99998},{type:'material',id:'normal_leather',quantity:8},{type:'material',id:'brak_tusk',quantity:-1},{type:'material',id:'unknown',quantity:500}];
const normalized=JSON.parse(run('JSON.stringify(normalizeSavedInventory(rawItems))'));
assert.deepEqual(normalized,[{type:'utility',id:'portable_workbench',name:'휴대용 제작대',quantity:1},{type:'material',id:'normal_leather',name:'일반 가죽',quantity:99999}]);
assert.equal(run('normalizeSavedSwordProgress(undefined).ownedSwordIds.join()'),'sword.basic');
assert.equal(run('normalizeSavedSwordProgress({ownedSwordIds:["sword.brak"],swordId:"sword.brak",durabilityBySwordId:{"sword.brak":-5}}).durabilityBySwordId["sword.brak"]'),0);
const migrated=JSON.parse(run('JSON.stringify(normalizeSavedSwordProgress({ownedSwordIds:["sword.iron","sword.brak"],swordId:"sword.iron",durabilityBySwordId:{"sword.iron":73}}))'));
assert.deepEqual(migrated,{swordId:'sword.brak',ownedSwordIds:['sword.basic','sword.brak'],durabilityBySwordId:{'sword.brak':73}});
assert.equal(run('normalizeSavedSwordProgress({ownedSwordIds:["sword.iron"],swordId:"sword.iron",durabilityBySwordId:{"sword.iron":0}}).durabilityBySwordId["sword.brak"]'),0);
assert.equal(run('normalizeSavedHuntingProgress({defeatedUntil:{unknown:Date.now()+99999,wildwood_brak:Date.now()+99999999}}).defeatedUntil.unknown'),undefined);
assert(run('normalizeSavedHuntingProgress({defeatedUntil:{wildwood_brak:Date.now()+99999999}}).defeatedUntil.wildwood_brak<=Date.now()+300000'));
console.log(`Crafting/loot passed: mixed wood bench, 29/30/95 leather, invalid/max/duplicate crafts, iron materials, all 6 loot tables, atomic rollback (${saves} save attempts), sword break/repair/basic fallback, saved boss cooldown, 9 art frames.`);
