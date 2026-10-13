import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {forestWorldContext} from './lib/forest-world-qa.mjs';
const context=forestWorldContext(),storage=new Map(),feedback=[];
context.document=undefined;context.performance={now:()=>0};
context.player={x:14,y:22,face:'right',moving:false};
context.window={addEventListener(){}};
context.localStorage={getItem:key=>storage.get(key)||null,setItem(key,value){if(context.failSave)throw Error('quota');storage.set(key,String(value));}};
context.setTimeout=()=>0;context.clearTimeout=()=>{};context.clearMovement=()=>{};
context.showSkillXpFeedback=(skill,before,after,gained)=>feedback.push({skill,before,after,gained});
const files=['src/data/fish-data.js','src/data/tree-dex-data.js','src/data/farming-data.js','src/life-skills.js','src/save.js','src/simulation.js','src/life-content.js'];
vm.runInContext(files.map(file=>fs.readFileSync(file,'utf8')).join('\n')+
  "\nGAME_STATE.regionId='sunnyFields';buildWorldRegion(REGION_WORLDS.sunnyFields);GAME_STATE.appearance.activeTool='sickle';",context);
vm.runInContext("applySaveData(createSaveData());",context);
context.document={getElementById:()=>({textContent:'',classList:{add(){},remove(){}}})};
const run=source=>JSON.parse(vm.runInContext('JSON.stringify((()=>{'+source+'})())',context));
const fresh=run("return GAME_STATE.progression.farming;");
assert.deepEqual(fresh,{xpCurveVersion:2,level:1,xp:0,totalXp:0,mastery:0,masteryXp:0});
const expected={carrot:24,turnip:36,lettuce:48,potato:60,onion:96,cabbage:120,wheat:144,corn:180,cucumber:216,tomato:240,eggplant:300,strawberry:360,pumpkin:420,chili:480};
assert.deepEqual(run("return Object.fromEntries(LIFE_CONTENT.crops.map(c=>[c.id,farmingCropXp(c)]));"),expected);
assert.equal(vm.runInContext("farmingCropXp(null)",context),0);
const untouched=run("return {fishing:GAME_STATE.progression.fishing,logging:GAME_STATE.progression.logging};");
for(const maximum of [false,true])for(const id of Object.keys(expected)){
  const result=run(`
    const crop=LIFE_CROP_BY_ID.get('${id}'),plot=WORLD_DEFINITION.farmPlots[0];
    GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:crop.id,plantedAt:Date.now()-crop.growMs-1};
    player.x=plot.x-1;player.y=plot.y;
    const before=GAME_STATE.progression.farming.totalXp,stock=lifeItemCount('crop',crop.id),random=Math.random;
    Math.random=()=>${maximum?0.999999:0};let success;try{success=harvestFarmCrop(plot);}finally{Math.random=random;}
    const delta=GAME_STATE.progression.farming.totalXp-before,quantity=lifeItemCount('crop',crop.id)-stock;
    const duplicate=harvestFarmCrop(plot);
    return {success,duplicate,delta,quantity,expected:crop.${maximum?'harvestMax':'harvestMin'},blocked:isBlocked(plot.x,plot.y)};
  `);
  assert(result.success&&!result.duplicate&&result.blocked);
  assert.equal(result.delta,expected[id]);assert.equal(result.quantity,result.expected);
}
assert.deepEqual(run("return {fishing:GAME_STATE.progression.fishing,logging:GAME_STATE.progression.logging};"),untouched);
assert.equal(feedback.length,28);assert(feedback.every(f=>f.skill==='farming'&&f.after.totalXp-f.before.totalXp===f.gained));
for(const mode of ['LOCKED','EMPTY','GROWING','distance','tool']){
  const blocked=run(`
    const plot=WORLD_DEFINITION.farmPlots[0],crop=LIFE_CROP_BY_ID.get('carrot');
    GAME_STATE.world.plots[plot.id]={unlocked:${mode!=='LOCKED'},cropId:${mode==='EMPTY'?'null':"'carrot'"},plantedAt:Date.now()-${mode==='GROWING'?'1':'crop.growMs+1'}};
    player.x=plot.x-${mode==='distance'?5:1};player.y=plot.y;
    GAME_STATE.appearance.activeTool='${mode==='tool'?'axe':'sickle'}';
    const before=JSON.stringify({world:GAME_STATE.world,inventory:GAME_STATE.inventory,farming:GAME_STATE.progression.farming});
    const success=harvestFarmCrop(plot);
    GAME_STATE.appearance.activeTool='sickle';
    return !success&&before===JSON.stringify({world:GAME_STATE.world,inventory:GAME_STATE.inventory,farming:GAME_STATE.progression.farming});
  `);assert(blocked,mode+' must not award farming XP');
}
for(const total of [71,vm.runInContext("lifeSkillTotalXpForLevel('farming',100)-1",context),vm.runInContext("lifeSkillTotalXpForLevel('farming',100)+3999",context)]){
  const setup=run(`
    GAME_STATE.progression.farming=lifeSkillProgressFromTotal('farming',${total});
    const plot=WORLD_DEFINITION.farmPlots[0];player.x=plot.x-1;player.y=plot.y;
    GAME_STATE.world.plots[plot.id]={unlocked:true,cropId:'carrot',plantedAt:Date.now()-120001};
    saveGame();return createSaveData();
  `);
  const persisted=storage.get('pixel-life.save.v2'),events=feedback.length;
  context.failSave=true;
  assert.equal(vm.runInContext("harvestFarmCrop(WORLD_DEFINITION.farmPlots[0])",context),false);
  assert.deepEqual(run("return createSaveData().state;"),setup.state);assert.equal(storage.get('pixel-life.save.v2'),persisted);
  assert.equal(feedback.length,events,'Failed save showed an XP/level-up reward');
  context.failSave=false;
  assert(vm.runInContext("harvestFarmCrop(WORLD_DEFINITION.farmPlots[0])",context));
  const advanced=run("return GAME_STATE.progression.farming;");
  assert.equal(advanced.totalXp,total+24);
  const saved=run("return createSaveData().state;");
  vm.runInContext("GAME_STATE.progression.farming=lifeSkillProgressFromTotal('farming',0);loadGame();",context);
  assert.deepEqual(run("return createSaveData().state;"),saved);
}
const old=run("return createSaveData();");delete old.state.progression.farming;
context.legacy=old;
assert(vm.runInContext('applySaveData(legacy)',context));
assert.deepEqual(run("return GAME_STATE.progression.farming;"),fresh);
const restored=run("return createSaveData().state;");delete restored.progression.farming;
assert.deepEqual(restored,old.state,'Adding farming changed existing saves');
for(let level=2;level<=100;level++){
  const base=vm.runInContext(`lifeSkillTotalXpForLevel('farming',${level})`,context);
  assert.equal(vm.runInContext(`lifeSkillProgressFromTotal('farming',${base}-1).level`,context),level-1);
  assert.equal(vm.runInContext(`lifeSkillProgressFromTotal('farming',${base}).level`,context),level);
}
assert.equal(vm.runInContext("lifeSkillTotalXpForLevel('farming',100)",context),187230);
console.log('Farming progression passed: 14 min/max yields, one grant, five invalid actions, XP/level/mastery save rollback, old-save Lv.1, independent skill progress, real save/reload and 99 level boundaries.');
