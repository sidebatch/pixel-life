import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/voyage-scenes.js','utf8')+'\n'+fs.readFileSync('src/voyage-mid-rendering.js','utf8')+'\n'+fs.readFileSync('src/voyage-deep-rendering.js','utf8')+'\n'+fs.readFileSync('src/voyage-glacier-rendering.js','utf8');
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
// Every decorative fragment must be rasterized on integer pixel cells. Smooth
// ellipse/path/stroke drawing would bring back the prototype vector appearance.
let pixelCells=0;
const pixelPaint={fillRect(x,y,w,h){assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(w>0&&h>0);pixelCells++;},
  ellipse(){throw Error('Smooth ellipse in pixel sea');},beginPath(){throw Error('Vector path in pixel sea');},stroke(){throw Error('Vector stroke in pixel sea');}};
const pixelModel={VIEW_W:540,VIEW_H:960,document:{createElement:()=>({getContext:()=>pixelPaint})}};
vm.createContext(pixelModel);vm.runInContext(source,pixelModel);
for(const destination of ['shallow','mid','deep','glacier']){
  pixelModel.destination=destination;
  vm.runInContext(`(()=>{const pool=voyageScenePool(destination);for(let landmark=0;landmark<pool.landmarks.length;landmark++)for(let mid=0;mid<pool.midObjects.length;mid++){
    composeVoyageScene({destination,base:0,wave:0,landmark,mid,atmosphere:2,artSeed:42,side:1,density:.8});
  }})()`,pixelModel);
}
assert.ok(pixelCells>10000,'Pixel scenery must paint all four route families');
const marineCalls=[],marinePaint={...paint,drawImage(sprite,x,y,w,h){
  assert.ok([x,y,w,h].every(Number.isInteger));marineCalls.push({key:sprite.key,w,h});
}};
const marineModel={VIEW_W:540,VIEW_H:960,imgs:{
  voyageReef:{key:'reef',complete:true,naturalWidth:128},voyageCoral:{key:'coral',complete:true,naturalWidth:48}
},document:{createElement:()=>({getContext:()=>marinePaint})}};
vm.createContext(marineModel);vm.runInContext(source,marineModel);
const marineRecipe="composeVoyageScene({destination:'shallow',base:0,wave:0,landmark:2,mid:2,atmosphere:0,artSeed:42,side:1,density:.8})";
const marineLayers=vm.runInContext(marineRecipe,marineModel),proceduralLayers=vm.runInContext(marineRecipe,pixelModel);
assert.deepEqual(clone(marineLayers.waves),clone(proceduralLayers.waves),'Sprite replacement must not reshuffle seeded waves');
assert.deepEqual(clone(marineLayers.gulls),clone(proceduralLayers.gulls),'Sprite replacement must not reshuffle seeded gulls');
assert.equal(marineCalls.filter(c=>c.key==='reef').length,1,'Loaded reef must use the raster sprite, not polygon rocks');
assert.ok(marineCalls.some(c=>c.key==='coral'),'Loaded coral must replace the cross-shaped branches');
assert.ok(marineCalls.every(c=>c.key==='reef'?c.w===120&&c.h===82:c.w===38&&c.h===38));
let created=0;
const trip={destination:'shallow',tripSeed:42,remainingMs:600000},motion={matches:false};
const render={VIEW_W:540,VIEW_H:960,TILE:48,camX:1400,camY:800,ctx:{...paint},
  WORLD_DEFINITION:{voyageDeck:{x:28,y:18,w:9,h:14}},activeVoyage:()=>trip,
  VOYAGE_ROUTE_BY_ID:new Map([['shallow',{durationMs:600000}]]),
  window:{matchMedia:()=>motion},document:{createElement(){created++;return {width:0,height:0,getContext:()=>({...paint})};}}};
vm.createContext(render);vm.runInContext(source,render);
const draw=()=>vm.runInContext('drawVoyageSea()',render);
assert.equal(draw(),true);const initialCanvases=created;
for(let frame=0;frame<240;frame++){trip.remainingMs-=16;draw();}
assert.equal(created,initialCanvases,'Steady frames must reuse object sprites, not allocate canvases');
for(let elapsed=20000;elapsed<600000;elapsed+=20000){
  trip.remainingMs=600000-elapsed;draw();
  const info=vm.runInContext(`({signature:voyageSceneCache.current.sceneSignature,expected:voyageSceneAt(42,${elapsed}).sceneSignature,
    cached:voyageSceneCache.composites.size,bytes:[...voyageSceneCache.objects.values()].reduce((sum,o)=>sum+o.canvas.width*o.canvas.height*4,0)})`,render);
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

render.VOYAGE_ROUTE_BY_ID.set('glacier',{durationMs:600000});trip.destination='glacier';trip.remainingMs=550000;draw();
assert.equal(vm.runInContext('voyageSceneCache.current.destination',render),'glacier');
const glacierStats=clone(run(`(()=>{
  const landmarks=new Set(),midObjects=new Set();let total=0;
  for(let seed=0;seed<128;seed++){
    const first=createVoyageSceneGenerator(seed,'glacier'),again=createVoyageSceneGenerator(seed,'glacier'),recent=[];let previous=null;
    for(let i=0;i<64;i++){
      const scene=nextVoyageScene(first),pool=voyageScenePool('glacier');
      if(JSON.stringify(scene)!==JSON.stringify(nextVoyageScene(again)))throw Error('Glacier determinism failed');
      if(recent.includes(scene.sceneSignature)||scene.majorSignature===previous)throw Error('Glacier scene repeats');
      if(voyageSceneAt(seed,scene.startMs+1,'glacier').sceneSignature!==scene.sceneSignature)throw Error('Glacier reconstruction differs');
      landmarks.add(pool.landmarks[scene.landmark]);midObjects.add(pool.midObjects[scene.mid]);total++;
      recent.push(scene.sceneSignature);if(recent.length>6)recent.shift();previous=scene.majorSignature;
    }
  }
  return {total,landmarks:[...landmarks],midObjects:[...midObjects]};
})()`));
assert.equal(glacierStats.total,8192);
assert.ok(['iceberg','auroraVeil','snowBank'].every(kind=>glacierStats.landmarks.includes(kind)));
assert.ok(glacierStats.midObjects.includes('iceFloes')&&!glacierStats.midObjects.includes('jellyGlow'));
assert.ok(!glacierStats.landmarks.includes('freighter')&&!glacierStats.landmarks.includes('giantShadow'));
const beforeGlacierFrames=created;
for(let frame=0;frame<120;frame++){trip.remainingMs-=16;draw();}
assert.equal(created,beforeGlacierFrames);assert.equal(vm.runInContext('voyageSceneCache.composites.size',render),2);
console.log('Glacier scenes passed: '+JSON.stringify({...glacierStats,routeCacheIsolation:true,noFrameAllocation:true}));

// Protect object lifetimes independently of the 16–30 second palette scenes.
// All decorations, not only the largest landmark, must survive transitions.
render.WORLD_DEFINITION.voyageDeck={x:29,y:18,w:7,h:14,view:'bow'};render.camX=1290;
let observed=0;
for(const destination of ['shallow','mid','deep','glacier']){
  trip.destination=destination;
  render.VOYAGE_ROUTE_BY_ID.set(destination,{durationMs:600000});
  for(let seed=0;seed<4;seed++){
    render.flowSeed=seed;render.flowDestination=destination;
    vm.runInContext('releaseVoyageScenes()',render);
    for(let elapsed=0;elapsed<600000;elapsed+=1000){
      render.flowElapsed=elapsed;
      const info=vm.runInContext(`(()=>{
        const before=new Map([...voyageSceneCache.objects].map(([id,o])=>[id,{o,r:voyageSceneryRect(o,flowElapsed-1000)}]));
        syncVoyageScenes(flowSeed,flowElapsed,flowDestination);let retained=0;
        const surfaceStep=voyageSurfaceDistance(flowElapsed)-voyageSurfaceDistance(flowElapsed-1000);
        for(const [id,{o,r}] of before)if(o.spawnMs<=flowElapsed-1000&&r.y+r.h>0&&r.y<VIEW_H&&o.exitMs>flowElapsed){
          if(voyageSceneCache.objects.get(id)!==o)throw Error('Visible object discarded at scene transition');retained++;
          if(voyageSceneryRect(o,flowElapsed).y-r.y!==surfaceStep)throw Error('Surface objects drift/overtake each other');
        }
        for(const o of voyageSceneCache.objects.values()){
          const birth=voyageSceneryRect(o,o.spawnMs),exit=voyageSceneryRect(o,o.exitMs-1);
          if(birth.y+birth.h>0||exit.y<VIEW_H)throw Error('Scenery born/retired inside viewport');
          if(o.side<0?birth.x+birth.w>96:birth.x<444)throw Error('Scenery enters hull corridor');
        }
        return {retained,count:voyageSceneCache.objects.size,bytes:[...voyageSceneCache.objects.values()].reduce((n,o)=>n+o.canvas.width*o.canvas.height*4,0)};
      })()`,render);
      observed+=info.retained;assert.ok(info.count<=32);assert.ok(info.bytes<2*1024*1024);
    }
    const snapshot=()=>clone(vm.runInContext('[...voyageSceneCache.objects.values()].map(o=>({id:o.id,spawnMs:o.spawnMs,...voyageSceneryRect(o,flowElapsed)}))',render));
    const prior=snapshot();vm.runInContext('releaseVoyageScenes();syncVoyageScenes(flowSeed,flowElapsed,flowDestination)',render);
    assert.deepEqual(snapshot(),prior,'Reload must reconstruct surviving objects, including previous scenes');
  }
}
assert.ok(observed>10000);
console.log('Continuous scenery passed: '+JSON.stringify({observed,allFourRoutes:true,topBottomClipping:true,noVisibleRetirement:true,noOvertaking:true,hullCorridorClear:true,restore:true,maxSpriteBytes:2097152}));
