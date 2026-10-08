import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=file=>fs.readFileSync(file,'utf8');
let now=0,phase='idle',failSave=false,saved=null;
const nodes=new Map(),listeners={};
const node=id=>{
  if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',hidden:true,classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},focus(){}});
  return nodes.get(id);
};
const runtime={Math,clearTimeout(){},lifeUi:{toastTimer:null},performance:{now:()=>now},document:{visibilityState:'visible',getElementById:node,querySelector:()=>node('boardingTitle'),addEventListener:(name,fn)=>listeners[name]=fn},
  window:{history:{state:{},replaceState(){}},addEventListener:(name,fn)=>listeners[name]=fn},
  GAME_STATE:{regionId:'coast',progression:{coins:3000},playerLocation:null},
  WORLD_DEFINITION:{},REGION_WORLDS:{coast:{id:'coast'},boatShallow:{id:'boatShallow',voyageDeck:{}}},
  player:{x:36,y:23,face:'up'},menuOpen:false,dialogOpen:false,
  isFishingActive:()=>phase!=='idle',clearMovement(){},toggleMenu(){},pushGameOverlayHistory(){},leaveGameOverlayHistory(){},
  closeInventory(){},closeFishDex(){},closeTreeDex(){},closeMarket(){},closeFarmPlot(){},closeCharacterStyle(){},isSkillLevelUpVisible:()=>false,showLifeToast(){},
  enterWorldRegion(exit){runtime.GAME_STATE.regionId=exit.to;runtime.WORLD_DEFINITION=runtime.REGION_WORLDS[exit.to];Object.assign(runtime.player,exit.entry||{x:32,y:26,face:'down'});return true;},
  saveGame(){vm.runInContext('checkpointVoyageTime()',runtime);if(failSave)return false;saved=JSON.parse(JSON.stringify(runtime.GAME_STATE));return true;}
};
vm.createContext(runtime);
vm.runInContext(read('src/data/voyage-data.js')+'\n'+read('src/voyage.js'),runtime);
const run=code=>vm.runInContext(code,runtime),clone=value=>JSON.parse(JSON.stringify(value));
const progress=()=>runtime.GAME_STATE.progression.voyage,trip=()=>progress().activeTrip;
assert.equal(run("buyVoyageTickets('mid')"),false);
assert.equal(run("buyVoyageTickets('shallow',-1)"),false);
assert.equal(run("buyVoyageTickets('shallow',1.5)"),false);
failSave=true;
assert.equal(run("buyVoyageTickets('shallow',5)"),false);
assert.equal(runtime.GAME_STATE.progression.coins,3000);assert.equal(progress().ticketCounts.shallow,0);
failSave=false;
assert.equal(run("buyVoyageTickets('shallow',5)"),true);
assert.equal(runtime.GAME_STATE.progression.coins,1500);assert.equal(progress().ticketCounts.shallow,5);
failSave=true;
assert.equal(run("departVoyage('shallow')"),false);
assert.equal(runtime.GAME_STATE.regionId,'coast');assert.equal(progress().ticketCounts.shallow,5);
assert.deepEqual(runtime.player,{x:36,y:23,face:'up'});assert.equal(trip(),null);
failSave=false;
assert.equal(run("departVoyage('shallow')"),true);
assert.equal(progress().ticketCounts.shallow,4);assert.equal(saved.regionId,'boatShallow');assert.equal(saved.progression.voyage.ticketCounts.shallow,4);
assert.equal(run("departVoyage('shallow')"),false);assert.equal(run("buyVoyageTickets('shallow')"),false);
now=700;run('updateVoyage()');assert.equal(trip().remainingMs,600000,'Boarding animation is not charged');
now=1700;run('updateVoyage()');assert.equal(trip().remainingMs,599000);
trip().remainingMs=60001;now+=2;run('updateVoyage()');assert.equal(node('voyageNotice').textContent,'1분 뒤 귀항해요');
trip().remainingMs=10001;now+=2;run('updateVoyage()');assert.equal(node('voyageNotice').textContent,'10초 뒤 귀항해요');
trip().remainingMs=599000;
now=2000;runtime.document.visibilityState='hidden';listeners.visibilitychange();
const hiddenRemaining=trip().remainingMs;
now=102000;run('updateVoyage()');assert.equal(trip().remainingMs,hiddenRemaining);
runtime.document.visibilityState='visible';listeners.visibilitychange();
now+=1000;run('updateVoyage()');assert.equal(trip().remainingMs,hiddenRemaining-1000);
// Dialogs and bags do not pause a visible voyage.
runtime.menuOpen=true;now+=70000;run('updateVoyage()');assert.equal(trip().remainingMs,hiddenRemaining-71000);runtime.menuOpen=false;
const beforeEarly=clone(trip()),entry=clone(runtime.player);
failSave=true;assert.equal(run('returnFromVoyage()'),false);
assert.deepEqual(clone(trip()),beforeEarly);assert.deepEqual(runtime.player,entry);assert.equal(runtime.GAME_STATE.regionId,'boatShallow');
failSave=false;assert.equal(run('returnFromVoyage()'),true);assert.equal(trip(),null);assert.equal(progress().ticketCounts.shallow,4);
// Each fishing phase is allowed to finish, but a new cast is blocked at expiry.
for(const value of ['casting','waiting','bite','result']){
  phase='idle';assert.equal(run("departVoyage('shallow')"),true);now+=700;run('updateVoyage()');
  phase=value;trip().remainingMs=1;now+=2;run('updateVoyage()');
  assert.equal(trip().remainingMs,0);assert.equal(trip().returnPending,true);assert.equal(runtime.GAME_STATE.regionId,'boatShallow');
  assert.equal(run('canStartVoyageFishing()'),false);
  phase='idle';assert.equal(run('returnFromVoyage()'),true);assert.equal(runtime.GAME_STATE.regionId,'coast');
}
// Failed automatic return keeps the consumed ticket spent, blocks casts, and retries.
progress().ticketCounts.shallow=1;run("departVoyage('shallow')");now+=700;run('updateVoyage()');
trip().remainingMs=1;failSave=true;now+=2;run('updateVoyage()');
assert.equal(runtime.GAME_STATE.regionId,'boatShallow');assert.equal(progress().ticketCounts.shallow,0);assert.equal(trip().returnPending,true);
failSave=false;now+=2100;run('updateVoyage()');assert.equal(runtime.GAME_STATE.regionId,'coast');assert.equal(trip(),null);
// Save normalization rejects malformed counts, routes, and seeds, and restores expired trips at harbor.
const normalized=clone(run("normalizeSavedVoyageProgress({ticketCounts:{shallow:2.9,mid:-2,deep:'9',glacier:Infinity},unlockedRouteIds:['mid','shallow','fake'],activeTrip:{destination:'shallow',remainingMs:60000000,tripSeed:42}})"));
assert.deepEqual(normalized.ticketCounts,{shallow:2,mid:0,deep:0,glacier:0});assert.deepEqual(normalized.unlockedRouteIds,['shallow','mid']);assert.equal(normalized.activeTrip.remainingMs,600000);
assert.equal(run("normalizeSavedVoyageProgress({activeTrip:{destination:'shallow',remainingMs:1,tripSeed:-1}}).activeTrip"),null);
assert.equal(run("normalizeSavedVoyageProgress({activeTrip:{destination:'deep',remainingMs:1,tripSeed:1}}).activeTrip"),null);
for(const pending of [false,true]){
  run(`GAME_STATE.regionId='boatShallow';GAME_STATE.progression.voyage=normalizeSavedVoyageProgress({ticketCounts:{shallow:7},activeTrip:{destination:'shallow',remainingMs:${pending?100:0},returnPending:${pending},tripSeed:42}});restoreSavedVoyageLocation()`);
  assert.equal(runtime.GAME_STATE.regionId,'coast');assert.equal(trip(),null);assert.equal(progress().ticketCounts.shallow,7);
}
run("GAME_STATE.regionId='boatShallow';GAME_STATE.progression.voyage=normalizeSavedVoyageProgress({activeTrip:{destination:'shallow',remainingMs:123456,tripSeed:42}});restoreSavedVoyageLocation()");
assert.equal(runtime.GAME_STATE.regionId,'boatShallow');assert.equal(trip().remainingMs,123456);assert.equal(trip().tripSeed,42);
// The real shallow pool has replaced the Step 10 trial; coast fish cannot leak in.
const fishContext={GAME_STATE:{regionId:'boatShallow',progression:{fishing:{equippedRodId:'rod.basic'}}}};
vm.createContext(fishContext);
vm.runInContext(['src/data/fishing-habitat-data.js','src/data/fish-data.js','src/data/fishing-gear-data.js','src/data/voyage-data.js','src/fishing.js'].map(read).join('\n'),fishContext);
for(const period of ['DAWN','DAY','DUSK','NIGHT'])for(const weather of ['clear','rain','storm']){
  const pool=clone(vm.runInContext(`getEligibleFishPool({regionId:'boatShallow',spotId:'shallow_open_sea',habitat:'boat_shallow',period:'${period}',weather:'${weather}'}).map(fish=>fish.id)`,fishContext));
  assert.ok(pool.includes('fish.damselfish'));assert.ok(pool.every(id=>['fish.damselfish','fish.wrasse','fish.filefish','fish.striped_damsel','fish.barred_knifejaw','fish.black_seabream','fish.cuttlefish'].includes(id)));
}
console.log('Voyage passed: tickets, purchase/departure/return rollback, visible clock, hidden resume, menu time, all four fishing phases, retry, legacy/invalid/expired restore, 12 shallow pools');
