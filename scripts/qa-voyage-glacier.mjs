import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=file=>fs.readFileSync(file,'utf8'),clone=value=>JSON.parse(JSON.stringify(value));
let now=0,phase='idle',fail=false,saved=null;
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){}});return nodes.get(id);};
const context={Math,clearTimeout(){},lifeUi:{toastTimer:null},performance:{now:()=>now},
  document:{visibilityState:'visible',getElementById:node,querySelector:()=>node('boardingTitle'),addEventListener(){}},
  window:{history:{state:{},replaceState(){}},addEventListener(){}},
  GAME_STATE:{regionId:'coast',collections:{fish:{}},progression:{coins:40000,fishing:{level:1,equippedRodId:'rod.basic'}},appearance:{activeTool:'rod'}},
  WORLD_DEFINITION:{},player:{x:36,y:23,face:'up'},menuOpen:false,dialogOpen:false,isFishingActive:()=>phase!=='idle',
  clearMovement(){},toggleMenu(){},pushGameOverlayHistory(){},leaveGameOverlayHistory(){},closeInventory(){},closeFishDex(){},closeTreeDex(){},closeMarket(){},closeFarmPlot(){},closeCharacterStyle(){},isSkillLevelUpVisible:()=>false,showLifeToast(){},
  enterWorldRegion(exit){context.GAME_STATE.regionId=exit.to;vm.runInContext(`WORLD_DEFINITION=REGION_WORLDS['${exit.to}']`,context);Object.assign(context.player,exit.entry||{x:32,y:20,face:'up'});return true;},
  saveGame(){vm.runInContext('checkpointVoyageTime();syncVoyageUnlocks()',context);if(fail)return false;saved=clone(context.GAME_STATE);return true;}
};vm.createContext(context);
vm.runInContext(['src/data/world-map.js','src/data/region-maps.js','src/data/fishing-habitat-data.js','src/data/fish-data.js','src/data/voyage-data.js','src/voyage.js'].map(read).join('\n'),context);
const run=code=>vm.runInContext(code,context),progress=()=>context.GAME_STATE.progression.voyage;
assert.equal(run("buyVoyageTickets('glacier')"),false);progress().ticketCounts.glacier=1;assert.equal(run("departVoyage('glacier')"),false);
context.GAME_STATE.progression.fishing.level=44;assert.equal(run("voyageProgress().unlockedRouteIds.includes('glacier')"),false);
context.GAME_STATE.progression.fishing.level=45;assert.equal(run("voyageProgress().unlockedRouteIds.includes('glacier')"),true);
run("GAME_STATE.progression.voyage=normalizeSavedVoyageProgress();GAME_STATE.progression.fishing.level=1");
context.GAME_STATE.collections.fish={'fish.bluefin_tuna':{count:100},'fish.damselfish':{count:100}};
assert.equal(run("voyageProgress().unlockedRouteIds.includes('glacier')"),false,'Middle legends and shallow catches must not count as deep-route discoveries');
context.GAME_STATE.collections.fish={'fish.blobfish':{count:30},'fish.anglerfish':{count:1}};
assert.equal(run("voyageProgress().unlockedRouteIds.includes('glacier')"),false,'Repeated catches count as one species');
context.GAME_STATE.collections.fish['fish.vampire_squid']={count:1};assert.equal(run("voyageProgress().unlockedRouteIds.includes('glacier')"),true);
assert.equal(context.GAME_STATE.progression.fishing.level,1);assert.equal(context.GAME_STATE.progression.fishing.equippedRodId,'rod.basic');
context.GAME_STATE.collections.fish={};assert.equal(run("voyageProgress().unlockedRouteIds.includes('glacier')"),true,'Earned route unlock is permanent');
fail=true;const coins=context.GAME_STATE.progression.coins;
assert.equal(run("buyVoyageTickets('glacier',5)"),false);assert.equal(context.GAME_STATE.progression.coins,coins);assert.equal(progress().ticketCounts.glacier,0);
fail=false;assert.equal(run("buyVoyageTickets('glacier',5)"),true);assert.equal(context.GAME_STATE.progression.coins,coins-24000);assert.equal(progress().ticketCounts.glacier,5);
fail=true;assert.equal(run("departVoyage('glacier')"),false);assert.equal(context.GAME_STATE.regionId,'coast');assert.deepEqual(context.player,{x:36,y:23,face:'up'});assert.equal(progress().ticketCounts.glacier,5);
fail=false;assert.equal(run("departVoyage('glacier')"),true);assert.equal(saved.regionId,'boatGlacier');assert.equal(saved.progression.voyage.ticketCounts.glacier,4);assert.equal(run("departVoyage('glacier')"),false);
assert.equal(node('boardingTitle').textContent,'빙하 해역으로 출항합니다');now=700;run('updateVoyage()');
assert.equal(run("buyVoyageTickets('shallow')"),false,'Destination changes/purchases must stay at harbor');
fail=true;const trip=clone(progress().activeTrip),position=clone(context.player);
assert.equal(run('returnFromVoyage()'),false);assert.deepEqual(clone(progress().activeTrip),trip);assert.deepEqual(context.player,position);assert.equal(context.GAME_STATE.regionId,'boatGlacier');
fail=false;assert.equal(run('returnFromVoyage()'),true);assert.equal(progress().ticketCounts.glacier,4);
for(const state of ['casting','waiting','bite','result']){
  phase='idle';assert.equal(run("departVoyage('glacier')"),true);now+=700;run('updateVoyage()');phase=state;
  progress().activeTrip.remainingMs=1;now+=2;run('updateVoyage()');
  assert.equal(context.GAME_STATE.regionId,'boatGlacier');assert.equal(progress().activeTrip.returnPending,true);assert.equal(run('canStartVoyageFishing()'),false);assert.equal(run('returnFromVoyage()'),false);
  phase='idle';assert.equal(run('returnFromVoyage()'),true);assert.equal(context.GAME_STATE.regionId,'coast');
}
assert.equal(progress().ticketCounts.glacier,0);
const restored=clone(run("normalizeSavedVoyageProgress({ticketCounts:{glacier:3},activeTrip:{destination:'glacier',remainingMs:234567,tripSeed:42}},{fishingLevel:45})"));
assert.equal(restored.activeTrip.destination,'glacier');assert.equal(restored.activeTrip.remainingMs,234567);assert.equal(restored.ticketCounts.glacier,3);
run(`GAME_STATE.progression.voyage=${JSON.stringify(restored)};GAME_STATE.regionId='boatGlacier';restoreSavedVoyageLocation()`);assert.equal(context.GAME_STATE.regionId,'boatGlacier');
run("GAME_STATE.progression.voyage.activeTrip.returnPending=true;restoreSavedVoyageLocation()");assert.equal(context.GAME_STATE.regionId,'coast');assert.equal(progress().ticketCounts.glacier,3);
assert.equal(run("normalizeSavedVoyageProgress({activeTrip:{destination:'glacier',remainingMs:10,tripSeed:1}}).activeTrip"),null,'A locked fabricated trip must not open a route');
assert.equal(run('REGION_WORLDS.boatGlacier.voyageDeck===REGION_WORLDS.boatShallow.voyageDeck'),true);
assert.equal(run('VOYAGE_ROUTES.every(route=>route.available&&REGION_WORLDS[route.regionId].voyageDeck===SHARED_VOYAGE_DECK&&REGION_WORLDS[route.regionId].waterAreas[0].fishingHabitat===route.habitat)'),true);
assert.equal(run('new Set(VOYAGE_ROUTES.map(route=>route.regionId)).size'),4);
assert.equal(run('new Set(VOYAGE_ROUTES.map(route=>route.habitat)).size'),4);
const oldDeep=clone(run("normalizeSavedVoyageProgress({unlockedRouteIds:['shallow','mid','deep'],ticketCounts:{deep:2},activeTrip:{destination:'deep',remainingMs:234567,tripSeed:42}})"));
assert.deepEqual(oldDeep.unlockedRouteIds,['shallow','mid','deep']);assert.equal(oldDeep.activeTrip.destination,'deep');assert.equal(oldDeep.activeTrip.remainingMs,234567);assert.equal(oldDeep.ticketCounts.deep,2);
console.log('Glacier voyage passed: Lv.45 OR three distinct deep species, basic rod/Lv.1 route access, permanent unlock, all transaction rollbacks, four fishing expiry phases, destination-only harbor, restore, shared deck');
