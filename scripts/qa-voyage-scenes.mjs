import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/voyage-scenes.js','utf8');
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
console.log('Voyage scenes passed: '+JSON.stringify({...stats,deterministicRestore:true,boundedCanvasCache:true,noFrameAllocation:true,reducedMotion:true}));
