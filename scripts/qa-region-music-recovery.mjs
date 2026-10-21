import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/region-music.js','utf8');
function rig(code){
 let now=0,sequence=0;const timers=new Map(),events={},players=[];
 const later=(fn,delay)=>{const id=++sequence;timers.set(id,{fn,at:now+delay});return id;};
 class Audio{
  constructor(){this.paused=true;this.currentTime=0;this.duration=360;this.error=null;this.loads=0;this.plays=0;this.listeners=new Map();players.push(this);}
  addEventListener(name,fn,options={}){const list=this.listeners.get(name)||[];list.push({fn,once:options.once});this.listeners.set(name,list);}
  emit(name){const list=[...(this.listeners.get(name)||[])];this.listeners.set(name,list.filter(e=>!e.once));for(const e of list)e.fn();}
  load(){this.loads++;this.currentTime=0;this.error=null;later(()=>this.emit('loadedmetadata'),10);}
  play(){this.plays++;this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){this.src='';}
 }
 const context=vm.createContext({Audio,performance:{now:()=>now},GAME_STATE:{regionId:'lilacVillage'},
  localStorage:{getItem:()=>null,setItem(){}},
  document:{hidden:false,getElementById:()=>null,addEventListener:(name,fn)=>events[name]=fn},
  window:{addEventListener:(name,fn)=>events[name]=fn,setTimeout:later,clearTimeout:id=>timers.delete(id),setInterval:()=>0}});
 const run=code=>vm.runInContext(code,context);
 vm.runInContext(code,context);
 const advance=ms=>{const end=now+ms;let count=0;while(true){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;if(++count>100)throw Error('Unbounded recovery');now=next[1].at;timers.delete(next[0]);next[1].fn();}now=end;};
 const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
 const travel=id=>{context.GAME_STATE.regionId=id;run('syncRegionMusic()');advance(20);};
 const fail=()=>{players[0].error={code:2,message:'PIPELINE_ERROR_READ'};players[0].paused=false;players[0].emit('error');};
 return {run,advance,flush,travel,fail,players,context,events};
}
// The deployed implementation trusted paused=false after a decoder failure.
const previous=rig(fs.readFileSync('scripts/fixtures/region-music-v1.js','utf8'));
previous.events.pointerdown();previous.travel('oldForest');previous.travel('lilacVillage');previous.players[0].currentTime=1.7;
previous.fail();previous.advance(10000);assert(previous.players[0].error&&!previous.players[0].paused&&previous.players[0].currentTime===1.7);
const r=rig(source);r.events.pointerdown();r.advance(20);await r.flush();r.travel('oldForest');r.travel('lilacVillage');await r.flush();
r.players[0].currentTime=1.7;const before=r.players[0].loads;r.fail();r.advance(550);await r.flush();
assert.equal(r.players[0].error,null);assert.equal(r.players[0].loads,before+1);assert.equal(r.players[0].currentTime,1.7);assert(!r.players[0].paused);
assert.equal(r.players.length,1,'Recovery must keep the mobile-unlocked streaming element');
// A change of destination invalidates an old track's pending recovery/seek.
r.fail();r.travel('sunnyFields');r.advance(2000);await r.flush();assert.equal(r.players[0].currentTime,0);assert(r.players[0].src.endsWith('lakeside.mp3'));
r.fail();const mutedLoads=r.players[0].loads;r.run('toggleRegionMusic()');r.advance(3000);assert.equal(r.players[0].loads,mutedLoads);assert(r.players[0].paused);
r.run('toggleRegionMusic()');r.advance(550);await r.flush();assert(!r.players[0].error&&!r.players[0].paused);
r.fail();r.context.document.hidden=true;r.events.visibilitychange();const hiddenLoads=r.players[0].loads;r.advance(3000);assert.equal(r.players[0].loads,hiddenLoads);assert(r.players[0].paused);
r.context.document.hidden=false;r.events.visibilitychange();r.advance(1100);await r.flush();assert(!r.players[0].error&&!r.players[0].paused);
r.travel('oldForest');await r.flush();r.players[0].currentTime=123;const woodland=r.players[0].loads;r.travel('deepForest');assert.equal(r.players[0].loads,woodland);assert.equal(r.players[0].currentTime,123);
// A network outage gets three bounded retries, then waits for a real gesture.
r.travel('lilacVillage');await r.flush();
for(let i=0;i<3;i++){r.fail();r.advance(2000);await r.flush();}
const attempts=r.players[0].loads;r.fail();r.advance(10000);r.run('monitorRegionMusic()');r.advance(10000);
assert.equal(r.players[0].loads,attempts);assert(r.players[0].error);
r.events.pointerdown();r.advance(20);await r.flush();assert.equal(r.players[0].loads,attempts+1);assert(!r.players[0].error);
r.travel('oldForest');await r.flush();r.players[0].currentTime=4;r.run('monitorRegionMusic()');r.advance(9000);r.run('monitorRegionMusic()');r.advance(550);await r.flush();
assert.equal(r.players[0].currentTime,4);assert(!r.players[0].paused);
r.events.pagehide();r.advance(10000);r.run('monitorRegionMusic()');assert(r.players[0].paused);
r.events.pageshow();await r.flush();assert(!r.players[0].paused);
const originalPlay=r.players[0].play;r.players[0].paused=true;r.players[0].play=()=>{r.players[0].plays++;return Promise.reject(Error('Autoplay blocked'));};
r.travel('sunnyFields');await r.flush();const beforeBlocked=r.players[0].plays;
for(let i=0;i<8;i++){r.advance(3000);r.run('monitorRegionMusic()');await r.flush();}
assert(r.players[0].plays<=beforeBlocked+3,'Blocked autoplay retries must also be bounded');
r.players[0].play=originalPlay;r.events.pointerdown();await r.flush();assert(!r.players[0].paused);
console.log('Region music passed: reproduced paused=false decoder freeze; automatic reload/position recovery, bounded retries, stale transitions, mute/hidden cancellation, same-track continuity, stall watchdog and one streaming player.');
