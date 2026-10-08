import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=file=>fs.readFileSync(file,'utf8'),clone=value=>JSON.parse(JSON.stringify(value));
let now=0,phase='idle',fail=false,saved=null;
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){}});return nodes.get(id);};
const context={Math,clearTimeout(){},lifeUi:{toastTimer:null},performance:{now:()=>now},
  document:{visibilityState:'visible',getElementById:node,querySelector:()=>node('boardingTitle'),addEventListener(){}},
  window:{history:{state:{},replaceState(){}},addEventListener(){}},
  GAME_STATE:{regionId:'coast',collections:{fish:{}},progression:{coins:20000,fishing:{level:1,equippedRodId:'rod.basic'}},appearance:{activeTool:'rod'}},
  WORLD_DEFINITION:{},player:{x:36,y:23,face:'up'},menuOpen:false,dialogOpen:false,isFishingActive:()=>phase!=='idle',
  clearMovement(){},toggleMenu(){},pushGameOverlayHistory(){},leaveGameOverlayHistory(){},closeInventory(){},closeFishDex(){},closeTreeDex(){},closeMarket(){},closeFarmPlot(){},closeCharacterStyle(){},isSkillLevelUpVisible:()=>false,showLifeToast(){},
  enterWorldRegion(exit){context.GAME_STATE.regionId=exit.to;vm.runInContext(`WORLD_DEFINITION=REGION_WORLDS['${exit.to}']`,context);Object.assign(context.player,exit.entry||{x:32,y:26,face:'down'});return true;},
  saveGame(){vm.runInContext('checkpointVoyageTime();syncVoyageUnlocks()',context);if(fail)return false;saved=clone(context.GAME_STATE);return true;}
};vm.createContext(context);
vm.runInContext(['src/data/world-map.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/data/fish-data.js','src/data/voyage-data.js','src/voyage.js'].map(read).join('\n'),context);
const run=code=>vm.runInContext(code,context),progress=()=>context.GAME_STATE.progression.voyage;
assert.equal(run("buyVoyageTickets('deep')"),false);progress().ticketCounts.deep=1;assert.equal(run("departVoyage('deep')"),false);
context.GAME_STATE.progression.fishing.level=29;assert.equal(run("voyageProgress().unlockedRouteIds.includes('deep')"),false);
context.GAME_STATE.progression.fishing.level=30;assert.equal(run("voyageProgress().unlockedRouteIds.includes('deep')"),true);
run("GAME_STATE.progression.voyage=normalizeSavedVoyageProgress();GAME_STATE.progression.fishing.level=1");
context.GAME_STATE.collections.fish={'fish.coelacanth':{count:100},'fish.damselfish':{count:100}};
assert.equal(run("voyageProgress().unlockedRouteIds.includes('deep')"),false,'Legacy legends and shallow catches must not count as mid-route discoveries');
context.GAME_STATE.collections.fish={'fish.spanish_mackerel':{count:30},'fish.yellowtail':{count:1}};
assert.equal(run("voyageProgress().unlockedRouteIds.includes('deep')"),false,'Repeated catches count as one species');
context.GAME_STATE.collections.fish['fish.marlin']={count:1};assert.equal(run("voyageProgress().unlockedRouteIds.includes('deep')"),true);
assert.equal(context.GAME_STATE.progression.fishing.level,1);assert.equal(context.GAME_STATE.progression.fishing.equippedRodId,'rod.basic');
context.GAME_STATE.collections.fish={};assert.equal(run("voyageProgress().unlockedRouteIds.includes('deep')"),true,'Earned route unlock is permanent');
fail=true;const coins=context.GAME_STATE.progression.coins;
assert.equal(run("buyVoyageTickets('deep',5)"),false);assert.equal(context.GAME_STATE.progression.coins,coins);assert.equal(progress().ticketCounts.deep,0);
fail=false;assert.equal(run("buyVoyageTickets('deep',5)"),true);assert.equal(context.GAME_STATE.progression.coins,coins-12000);assert.equal(progress().ticketCounts.deep,5);
fail=true;assert.equal(run("departVoyage('deep')"),false);assert.equal(context.GAME_STATE.regionId,'coast');assert.deepEqual(context.player,{x:36,y:23,face:'up'});assert.equal(progress().ticketCounts.deep,5);
fail=false;assert.equal(run("departVoyage('deep')"),true);assert.equal(saved.regionId,'boatDeep');assert.equal(saved.progression.voyage.ticketCounts.deep,4);assert.equal(run("departVoyage('deep')"),false);
assert.equal(node('boardingTitle').textContent,'심해로 출항합니다');now=700;run('updateVoyage()');
assert.equal(run("buyVoyageTickets('shallow')"),false,'Destination changes/purchases must stay at harbor');
fail=true;const trip=clone(progress().activeTrip),position=clone(context.player);
assert.equal(run('returnFromVoyage()'),false);assert.deepEqual(clone(progress().activeTrip),trip);assert.deepEqual(context.player,position);assert.equal(context.GAME_STATE.regionId,'boatDeep');
fail=false;assert.equal(run('returnFromVoyage()'),true);assert.equal(progress().ticketCounts.deep,4);
for(const state of ['casting','waiting','bite','result']){
  phase='idle';assert.equal(run("departVoyage('deep')"),true);now+=700;run('updateVoyage()');phase=state;
  progress().activeTrip.remainingMs=1;now+=2;run('updateVoyage()');
  assert.equal(context.GAME_STATE.regionId,'boatDeep');assert.equal(progress().activeTrip.returnPending,true);assert.equal(run('canStartVoyageFishing()'),false);assert.equal(run('returnFromVoyage()'),false);
  phase='idle';assert.equal(run('returnFromVoyage()'),true);assert.equal(context.GAME_STATE.regionId,'coast');
}
assert.equal(progress().ticketCounts.deep,0);
const restored=clone(run("normalizeSavedVoyageProgress({ticketCounts:{deep:3},activeTrip:{destination:'deep',remainingMs:234567,tripSeed:42}},{fishingLevel:30})"));
assert.equal(restored.activeTrip.destination,'deep');assert.equal(restored.activeTrip.remainingMs,234567);assert.equal(restored.ticketCounts.deep,3);
run(`GAME_STATE.progression.voyage=${JSON.stringify(restored)};GAME_STATE.regionId='boatDeep';restoreSavedVoyageLocation()`);assert.equal(context.GAME_STATE.regionId,'boatDeep');
run("GAME_STATE.progression.voyage.activeTrip.returnPending=true;restoreSavedVoyageLocation()");assert.equal(context.GAME_STATE.regionId,'coast');assert.equal(progress().ticketCounts.deep,3);
assert.equal(run("normalizeSavedVoyageProgress({activeTrip:{destination:'deep',remainingMs:10,tripSeed:1}}).activeTrip"),null,'A locked fabricated trip must not open a route');
assert.equal(run('REGION_WORLDS.boatDeep.voyageDeck===REGION_WORLDS.boatShallow.voyageDeck'),true);
console.log('Deep voyage passed: Lv.30 OR three distinct mid species, basic rod/Lv.1 route access, permanent unlock, all transaction rollbacks, four fishing expiry phases, destination-only harbor, restore, shared deck');
