import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/voyage-scenes.js','utf8')+'\n'+fs.readFileSync('src/voyage-mid-rendering.js','utf8')+'\n'+fs.readFileSync('src/voyage-deep-rendering.js','utf8');
const model={};vm.createContext(model);vm.runInContext(source,model);
const run=code=>vm.runInContext(code,model),clone=value=>JSON.parse(JSON.stringify(value));
const stats=clone(run(`(()=>{
  const durations=new Set(),majorTypes=new Set();let quiet=0,total=0;
  for(let seed=0;seed<256;seed++){
    const first=createVoyageSceneGenerator(seed),again=createVoyageSceneGenerator(seed),recent=[];let previous=null,end=0;
    for(let index=0;index<64;index++){
      const scene=nextVoyageScene(first),same=nextVoyageScene(again);
      if(JSON.stringify(scene)!==JSON.stringify(same))throw Error('Nondeterministic scene');
      if(recent.includes(scene.sceneSignature)||previous===scene.majorSignature)throw Error('Repeated scene or adjacent major pair');
      if(scene.startMs!==end||scene.durationMs<16000||scene.durationMs>30000)throw Error('Broken scene timeline');
      durations.add(scene.durationMs);majorTypes.add(scene.landmark);quiet+=scene.landmark===0?1:0;total++;
      recent.push(scene.sceneSignature);if(recent.length>6)recent.shift();previous=scene.majorSignature;end=scene.endMs;
      if(index<30&&voyageSceneAt(seed,scene.startMs+1).sceneSignature!==scene.sceneSignature)throw Error('Reconnect lookup differs');
    }
  }
  return {total,quietRatio:quiet/total,durations:durations.size,landmarks:majorTypes.size};
})()`));
assert.equal(stats.total,16384);assert.ok(stats.quietRatio>.1&&stats.quietRatio<.45);assert.ok(stats.durations>100);assert.equal(stats.landmarks,6);
const paint={save(){},restore(){},translate(){},scale(){},fillRect(){},beginPath(){},ellipse(){},fill(){},drawImage(){},moveTo(){},lineTo(){},stroke(){}};
let created=0;
const trip={destination:'shallow',tripSeed:42,remainingMs:600000},motion={matches:false};
const render={VIEW_W:540,VIEW_H:960,TILE:48,camX:1400,camY:800,ctx:{...paint},
  WORLD_DEFINITION:{voyageDeck:{x:28,y:18,w:9,h:14}},activeVoyage:()=>trip,
  VOYAGE_ROUTE_BY_ID:new Map([['shallow',{durationMs:600000}]]),
  window:{matchMedia:()=>motion},document:{createElement(){created++;return {width:0,height:0,getContext:()=>({...paint})};}}};
vm.createContext(render);vm.runInContext(source,render);
const draw=()=>vm.runInContext('drawVoyageSea()',render);
assert.equal(draw(),true);assert.equal(created,4);
for(let frame=0;frame<240;frame++){trip.remainingMs-=16;draw();}
assert.equal(created,4,'Steady frames must reuse precomposed layers, not allocate canvases');
for(let elapsed=20000;elapsed<600000;elapsed+=20000){
  trip.remainingMs=600000-elapsed;draw();
  const info=vm.runInContext(`({signature:voyageSceneCache.current.sceneSignature,expected:voyageSceneAt(42,${elapsed}).sceneSignature,
    cached:voyageSceneCache.composites.size,bytes:[...voyageSceneCache.composites.values()].reduce((sum,layer)=>sum+(layer.far.width*layer.far.height+layer.mid.width*layer.mid.height)*4,0)})`,render);
  assert.equal(info.signature,info.expected);assert.equal(info.cached,2);assert.ok(info.bytes<8*1024*1024);
}
const normal=vm.runInContext('voyageSceneCache.current.sceneSignature',render);
motion.matches=true;draw();assert.equal(vm.runInContext('voyageSceneCache.current.sceneSignature',render),normal,'Reduced motion cannot alter fish conditions or the voyage timeline');
vm.runInContext('releaseVoyageScenes()',render);assert.equal(vm.runInContext('voyageSceneCache.composites.size',render),0);
draw();assert.equal(vm.runInContext('voyageSceneCache.current.sceneSignature',render),normal);
// The same seed on a different route must not reuse shallow palette/landmarks.
render.VOYAGE_ROUTE_BY_ID.set('mid',{durationMs:600000});trip.destination='mid';trip.remainingMs=550000;draw();
assert.equal(vm.runInContext('voyageSceneCache.current.destination',render),'mid');
assert.notEqual(vm.runInContext('voyageSceneCache.current.sceneSignature',render),normal);
assert.equal(vm.runInContext('voyageSceneCache.composites.size',render),2);
const midStats=clone(run(`(()=>{
  const landmarks=new Set(),midObjects=new Set();let total=0;
  for(let seed=0;seed<128;seed++){
    const generator=createVoyageSceneGenerator(seed,'mid'),recent=[];let previous=null;
    for(let index=0;index<64;index++){
      const scene=nextVoyageScene(generator),pool=voyageScenePool(scene.destination);
      if(recent.includes(scene.sceneSignature)||scene.majorSignature===previous)throw Error('Mid scene repeat');
      if(voyageSceneAt(seed,scene.startMs+1,'mid').sceneSignature!==scene.sceneSignature)throw Error('Mid reconstruction mismatch');
      landmarks.add(pool.landmarks[scene.landmark]);midObjects.add(pool.midObjects[scene.mid]);total++;
      recent.push(scene.sceneSignature);if(recent.length>6)recent.shift();previous=scene.majorSignature;
    }
  }
  return {total,landmarks:[...landmarks],midObjects:[...midObjects]};
})()`));
assert.equal(midStats.total,8192);assert.ok(midStats.landmarks.includes('freighter')&&midStats.landmarks.includes('swellBank'));
assert.ok(midStats.midObjects.includes('dolphins'));assert.ok(!midStats.landmarks.includes('reef')&&!midStats.midObjects.includes('coral'));
console.log('Voyage scenes passed: '+JSON.stringify({...stats,deterministicRestore:true,boundedCanvasCache:true,noFrameAllocation:true,reducedMotion:true}));
console.log('Mid scenes passed: '+JSON.stringify({...midStats,routeCacheIsolation:true}));

render.VOYAGE_ROUTE_BY_ID.set('deep',{durationMs:600000});trip.destination='deep';trip.remainingMs=550000;draw();
assert.equal(vm.runInContext('voyageSceneCache.current.destination',render),'deep');
assert.equal(vm.runInContext('voyageSceneCache.composites.size',render),2);
const deepStats=clone(run(`(()=>{
  const landmarks=new Set(),midObjects=new Set();let total=0;
  for(let seed=0;seed<128;seed++){
    const first=createVoyageSceneGenerator(seed,'deep'),again=createVoyageSceneGenerator(seed,'deep'),recent=[];let previous=null;
    for(let i=0;i<64;i++){
      const scene=nextVoyageScene(first),pool=voyageScenePool('deep');
      if(JSON.stringify(scene)!==JSON.stringify(nextVoyageScene(again)))throw Error('Deep determinism failed');
      if(recent.includes(scene.sceneSignature)||scene.majorSignature===previous)throw Error('Deep scene repeats');
      if(voyageSceneAt(seed,scene.startMs+1,'deep').sceneSignature!==scene.sceneSignature)throw Error('Deep reconnect differs');
      landmarks.add(pool.landmarks[scene.landmark]);midObjects.add(pool.midObjects[scene.mid]);total++;
      recent.push(scene.sceneSignature);if(recent.length>6)recent.shift();previous=scene.majorSignature;
    }
  }
  return {total,landmarks:[...landmarks],midObjects:[...midObjects]};
})()`));
assert.equal(deepStats.total,8192);
assert.ok(['cloudBank','giantShadow','glowBloom'].every(kind=>deepStats.landmarks.includes(kind)));
assert.ok(deepStats.midObjects.includes('jellyGlow')&&!deepStats.midObjects.includes('dolphins'));
assert.ok(!deepStats.landmarks.includes('reef')&&!deepStats.landmarks.includes('freighter'));
const beforeDeepFrames=created;
for(let frame=0;frame<120;frame++){trip.remainingMs-=16;draw();}
assert.equal(created,beforeDeepFrames);
console.log('Deep scenes passed: '+JSON.stringify({...deepStats,routeCacheIsolation:true,noFrameAllocation:true}));
