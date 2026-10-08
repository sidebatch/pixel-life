// Scene descriptors are deterministic from tripSeed + visible voyage elapsed time.
// No new clock/save schema: reconnect resumes the exact same visual sequence.
const VOYAGE_SEA_PALETTES=Object.freeze([
  {water:'#278fa8',deep:'#1c728e',light:'#7bcdbb',sand:'#d9bc78',leaf:'#508c68'},
  {water:'#258e9c',deep:'#1a717e',light:'#8cd1be',sand:'#d8c18a',leaf:'#4d8b5e'},
  {water:'#3188ad',deep:'#246b90',light:'#89cce0',sand:'#d5bb92',leaf:'#598b74'},
  {water:'#388fa8',deep:'#2a758f',light:'#a5d4cf',sand:'#d3b17b',leaf:'#648b60'}
]);
const VOYAGE_LANDMARKS=Object.freeze(['open','islet','reef','sandbar','rockArch','palmIsland']);
const VOYAGE_MID_OBJECTS=Object.freeze(['none','buoys','coral','fishSchool','foam']);
const VOYAGE_SCENE_POOLS=Object.freeze({
  shallow:{palettes:VOYAGE_SEA_PALETTES,landmarks:VOYAGE_LANDMARKS,midObjects:VOYAGE_MID_OBJECTS},
  mid:{palettes:[
    {water:'#246a96',deep:'#154b75',light:'#82b5cf'},
    {water:'#286f9e',deep:'#195780',light:'#8dbccc'},
    {water:'#316a99',deep:'#224976',light:'#97b8d1'},
    {water:'#237791',deep:'#185669',light:'#94c9d1'}
  ],landmarks:['open','freighter','trawler','sailboat','swellBank','distantShip'],midObjects:['none','dolphins','swell','fishSchool','foam']},
  deep:{palettes:[
    {water:'#142b43',deep:'#081b30',light:'#6990a7'},
    {water:'#192c46',deep:'#0e1b31',light:'#7a90bb'},
    {water:'#152f3b',deep:'#0a202c',light:'#78adae'},
    {water:'#222c48',deep:'#111b31',light:'#9295bb'}
  ],landmarks:['open','cloudBank','giantShadow','glowBloom','darkCurrent','abyssalRidge'],midObjects:['none','jellyGlow','lanternSchool','shadowTrail','coldFoam']},
  glacier:{palettes:[
    {water:'#477b92',deep:'#315a76',light:'#d0e6e8'},
    {water:'#527e98',deep:'#345b78',light:'#dbe9f0'},
    {water:'#3d7e85',deep:'#2b606c',light:'#cae5df'},
    {water:'#536f91',deep:'#38516f',light:'#d8dded'}
  ],landmarks:['open','iceberg','iceShelf','auroraVeil','snowBank','iceArch'],midObjects:['none','iceFloes','crystalWake','snowFlurry','iceShards']}
});
function voyageScenePool(destination='shallow'){return VOYAGE_SCENE_POOLS[destination]||VOYAGE_SCENE_POOLS.shallow;}
function voyageRandom(seed){
  let state=seed>>>0;
  return ()=>{state=(state+0x6D2B79F5)>>>0;let n=state;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
}
function createVoyageSceneGenerator(seed,destination='shallow'){return {destination,random:voyageRandom(seed),index:0,endMs:0,recent:[],previousMajor:null};}
function nextVoyageScene(generator){
  const random=generator.random,pick=size=>Math.floor(random()*size),destination=generator.destination,pool=voyageScenePool(destination);
  let choices,signature,major;
  do{
    const landmark=random()<.28?0:1+pick(pool.landmarks.length-1);
    choices={base:pick(pool.palettes.length),wave:pick(4),landmark,mid:landmark===0?0:pick(pool.midObjects.length),atmosphere:pick(4)};
    signature=(destination==='shallow'?'':`${destination}:`)+Object.values(choices).join(':');major=`${choices.base}:${landmark}`;
  }while(generator.recent.includes(signature)||major===generator.previousMajor);
  const durationMs=16000+pick(14001),startMs=generator.endMs,index=generator.index++;
  generator.endMs+=durationMs;generator.previousMajor=major;
  generator.recent.push(signature);if(generator.recent.length>6)generator.recent.shift();
  return Object.freeze({...choices,destination,index,sceneSignature:signature,majorSignature:major,startMs,durationMs,endMs:generator.endMs,
    artSeed:pick(4294967296),side:random()<.5?-1:1,density:choices.landmark===0 ? .38 : .75+random()*.35});
}
function voyageSceneAt(seed,elapsedMs,destination='shallow'){
  const generator=createVoyageSceneGenerator(seed,destination);let scene=nextVoyageScene(generator);
  while(scene.endMs<=Math.max(0,elapsedMs))scene=nextVoyageScene(generator);
  return scene;
}
const voyageSceneCache={key:null,generator:null,current:null,next:null,composites:new Map(),built:0};
const voyageMotionQuery=typeof window!=='undefined'?window.matchMedia?.('(prefers-reduced-motion: reduce)'):null;
function releaseVoyageScenes(){
  for(const layers of voyageSceneCache.composites.values())for(const canvas of [layers.far,layers.mid]){canvas.width=1;canvas.height=1;}
  voyageSceneCache.composites.clear();voyageSceneCache.key=null;voyageSceneCache.current=null;voyageSceneCache.next=null;voyageSceneCache.generator=null;
}
function syncVoyageScenes(seed,elapsedMs,destination='shallow'){
  const cache=voyageSceneCache,key=`${destination}:${seed}:${VIEW_W}:${VIEW_H}`;
  if(cache.key!==key||elapsedMs<(cache.current?.startMs||0)){
    releaseVoyageScenes();cache.key=key;cache.generator=createVoyageSceneGenerator(seed,destination);
    cache.current=nextVoyageScene(cache.generator);cache.next=nextVoyageScene(cache.generator);
  }
  while(elapsedMs>=cache.current.endMs){cache.current=cache.next;cache.next=nextVoyageScene(cache.generator);}
  for(const [index,layers] of cache.composites)if(index!==cache.current.index&&index!==cache.next.index){
    layers.far.width=layers.mid.width=1;layers.far.height=layers.mid.height=1;cache.composites.delete(index);
  }
  // The next whole scene is precomposed outside the visible game canvas.
  for(const scene of [cache.current,cache.next])if(!cache.composites.has(scene.index)){
    cache.composites.set(scene.index,composeVoyageScene(scene));cache.built++;
  }
  return cache;
}
function composeVoyageScene(scene){
  const width=Math.ceil(VIEW_W/2)+48,height=Math.ceil(VIEW_H*.9)+96;
  const make=()=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;};
  const pool=voyageScenePool(scene.destination);
  const far=make(),mid=make(),f=far.getContext('2d'),m=mid.getContext('2d'),random=voyageRandom(scene.artSeed),palette=pool.palettes[scene.base];
  f.imageSmoothingEnabled=m.imageSmoothingEnabled=false;
  const ellipse=(context,x,y,rx,ry,color)=>{context.fillStyle=color;context.beginPath();context.ellipse(x,y,rx,ry,0,0,Math.PI*2);context.fill();};
  // Broad underwater color patches, deliberately non-grid and non-tileable.
  for(let i=0;i<10;i++)ellipse(f,random()*width,random()*height,35+random()*65,15+random()*36,scene.atmosphere%2?'rgba(150,213,191,.07)':'rgba(7,77,101,.1)');
  if(scene.landmark){
    const x=scene.side<0?65+random()*15:width-65-random()*15,y=75+random()*Math.min(height-250,VIEW_H*.25),kind=pool.landmarks[scene.landmark];
    if(scene.destination==='mid'){
      drawMidVoyageLandmark(f,kind,x,y,random,palette);
    }else if(scene.destination==='deep'){
      drawDeepVoyageLandmark(f,kind,x,y,random,palette);
    }else if(scene.destination==='glacier'){
      drawGlacierVoyageLandmark(f,kind,x,y,random,palette);
    }else if(kind==='reef'){
      for(let i=0;i<9;i++)ellipse(f,x+random()*90-45,y+random()*65-32,8+random()*17,4+random()*7,'rgba(94,178,148,.55)');
    }else if(kind==='rockArch'){
      ellipse(f,x,y+24,51,15,'rgba(204,237,215,.25)');
      f.fillStyle='#657b78';f.fillRect(x-25,y-16,13,37);f.fillRect(x+14,y-8,15,30);f.fillRect(x-20,y-21,43,12);
      f.fillStyle='#8c9e8d';f.fillRect(x-19,y-21,37,5);f.fillRect(x-25,y-13,6,8);
    }else{
      ellipse(f,x,y+9,61,30,'rgba(137,218,211,.25)');ellipse(f,x,y,49,22,palette.sand);
      f.fillStyle='rgba(247,233,185,.7)';f.fillRect(x-31,y+12,20,2);f.fillRect(x+4,y+15,25,2);
      if(kind!=='sandbar'){
        ellipse(f,x-4,y-7,32,18,palette.leaf);
        f.fillStyle='#78a776';f.fillRect(x-22,y-18,22,6);f.fillRect(x+4,y-14,19,6);
        for(let rock=0;rock<4;rock++)ellipse(f,x+random()*62-31,y+random()*16-8,3+random()*4,2+random()*3,'#809583');
        if(kind==='palmIsland'){
          for(let i=0;i<3;i++){
            const px=x-20+i*19,py=y-9-i%2*6;
            f.fillStyle='#8b7052';f.fillRect(px,py-27,3,25);
            for(let leaf=0;leaf<5;leaf++)ellipse(f,px+Math.cos(leaf*1.2)*9,py-26+Math.sin(leaf*1.2)*4,11,3,'#347b57');
          }
        }
      }
    }
  }
  // Atmospheric fragments and the middle-water events are independent of landmarks.
  for(let i=0;i<scene.atmosphere;i++)ellipse(f,random()*width,random()*height,40+random()*40,7+random()*9,'rgba(203,233,225,.09)');
  const type=pool.midObjects[scene.mid];
  for(let i=0;i<(type==='none'?0:3+Math.floor(random()*4));i++){
    const x=random()<.5?15+random()*53:width-15-random()*53,y=50+random()*(scene.destination!=='shallow'?Math.min(height-100,VIEW_H*.4):height-100);
    if(scene.destination==='deep'){
      drawDeepVoyageMidObject(m,type,x,y,random,palette);
    }else if(scene.destination==='glacier'){
      drawGlacierVoyageMidObject(m,type,x,y,random,palette);
    }else if(type==='dolphins'){
      for(let dolphin=0;dolphin<3;dolphin++){
        const dx=x+dolphin*10,dy=y+dolphin*13;
        ellipse(m,dx,dy+4,13,5,'rgba(174,219,224,.18)');ellipse(m,dx,dy,10,4,'#476d82');
        m.fillStyle='#7e9faf';m.fillRect(dx-5,dy-2,10,2);
        m.beginPath();m.moveTo(dx-2,dy);m.lineTo(dx-4,dy-9);m.lineTo(dx+4,dy);m.fill();
        m.fillStyle='#3f6073';m.fillRect(dx+8,dy-1,5,2);m.fillRect(dx-13,dy-4,5,2);m.fillRect(dx-13,dy+2,5,2);
      }
    }else if(type==='swell'){
      for(let crest=0;crest<3;crest++){
        m.strokeStyle=crest===0?'rgba(211,235,237,.62)':'rgba(183,218,232,.32)';m.lineWidth=2;
        m.beginPath();m.moveTo(x-24,y+crest*9);m.lineTo(x-7,y+crest*9-5);m.lineTo(x+12,y+crest*9-4);m.lineTo(x+27,y+crest*9+1);m.stroke();
      }
    }else if(type==='buoys'){
      ellipse(m,x,y+8,12,4,'rgba(219,245,225,.36)');m.fillStyle=i%2?'#dc9c4c':'#b95b4c';m.fillRect(x-4,y-5,8,12);
      m.fillStyle='#eee0bd';m.fillRect(x-4,y-1,8,3);m.fillStyle='#3a5966';m.fillRect(x-1,y-17,2,12);
    }else if(type==='coral'){
      ellipse(m,x,y+3,24,12,'rgba(58,114,122,.35)');
      for(let branch=0;branch<4;branch++){m.fillStyle=branch%2?'rgba(201,147,116,.32)':'rgba(138,157,108,.4)';m.fillRect(x-16+branch*9,y-7-random()*7,4,14);}
    }else if(type==='fishSchool'){
      for(let fish=0;fish<5;fish++)ellipse(m,x+fish*5,y+fish%2*6,5,2,'rgba(23,83,102,.3)');
    }else{
      m.fillStyle='rgba(220,246,224,.28)';for(let p=0;p<5;p++)m.fillRect(x+p*6,y+p%2*3,7,2);
    }
  }
  const waves=Array.from({length:Math.round(140*scene.density)},()=>({x:random(),y:random()*3,length:8+random()*27,phase:random()*6.28}));
  const gulls=scene.landmark===0||scene.destination==='deep'||scene.destination==='glacier'?[]:Array.from({length:2+Math.floor(random()*3)},()=>({x:random(),y:random(),phase:random()*6.28}));
  return {far,mid,waves,gulls};
}
function drawVoyageSceneLayers(scene,elapsedMs,opacity,reduced){
  if(opacity<=0)return;
  const layers=voyageSceneCache.composites.get(scene.index),age=Math.max(0,elapsedMs-scene.startMs)/1000;
  const boatX=(WORLD_DEFINITION.voyageDeck.x+WORLD_DEFINITION.voyageDeck.w/2)*TILE-camX;
  const shiftX=(boatX-VIEW_W/2)*.2,motion=reduced ? .18 : 1;
  ctx.save();ctx.globalAlpha=opacity;
  // Keep distant landmarks in the exposed sea when a railing fills half the view.
  // This projection is decorative only; deck/actors/water collision never move.
  const deck=WORLD_DEFINITION.voyageDeck,left=deck.x*TILE-camX,right=(deck.x+deck.w)*TILE-camX;
  const leftSea=Math.max(0,left),rightSea=Math.max(0,VIEW_W-right);
  const mirror=scene.landmark&&((rightSea>leftSea+48&&scene.side<0)||(leftSea>rightSea+48&&scene.side>0));
  ctx.save();if(mirror){ctx.translate(VIEW_W,0);ctx.scale(-1,1);}
  ctx.drawImage(layers.far,-48+shiftX*.3,-115+age*3*motion,layers.far.width*2,layers.far.height*2);
  ctx.restore();
  ctx.drawImage(layers.mid,-48+shiftX*.65,-165+age*10*motion,layers.mid.width*2,layers.mid.height*2);
  const pool=voyageScenePool(scene.destination);
  ctx.globalAlpha=opacity*(scene.wave===2?.32:.22);ctx.fillStyle=pool.palettes[scene.base].light;
  for(const wave of layers.waves){
    const y=((wave.y*VIEW_H+age*(24+scene.wave*8)*motion)%(VIEW_H*3))-VIEW_H;
    if(y<-20||y>VIEW_H+20)continue;
    const x=wave.x*(VIEW_W+80)-40+shiftX;
    ctx.fillRect(Math.round(x),Math.round(y),wave.length,2);
    if(scene.destination==='mid'){
      ctx.fillRect(Math.round(x+wave.length*.3),Math.round(y-4),wave.length*.7,2);
      ctx.fillRect(Math.round(x+wave.length*.45),Math.round(y-7),wave.length*.35,2);
    }
    if(scene.wave%2)ctx.fillRect(Math.round(x+wave.length*.4),Math.round(y+4),wave.length*.45,2);
  }
  ctx.globalAlpha=opacity*.6;ctx.strokeStyle='#e9f0dd';ctx.lineWidth=2;
  for(const gull of layers.gulls){
    const x=(gull.x*(VIEW_W+170)+age*8*motion)%(VIEW_W+170)-85,y=gull.y*VIEW_H+age*2*motion;
    const wing=reduced?3:3+Math.sin(age*3+gull.phase)*2;
    ctx.beginPath();ctx.moveTo(x-7,y-wing);ctx.lineTo(x,y);ctx.lineTo(x+7,y-wing);ctx.stroke();
  }
  ctx.restore();
}
function drawVoyageSea(){
  const trip=activeVoyage(),route=trip&&VOYAGE_ROUTE_BY_ID.get(trip.destination);
  if(!trip||!route||!WORLD_DEFINITION.voyageDeck)return false;
  const elapsedMs=Math.max(0,route.durationMs-trip.remainingMs),cache=syncVoyageScenes(trip.tripSeed,elapsedMs,trip.destination),pool=voyageScenePool(trip.destination);
  const reduced=voyageMotionQuery?.matches===true,fadeMs=reduced?3500:2500;
  const blend=Math.max(0,Math.min(1,(elapsedMs-(cache.current.endMs-fadeMs))/fadeMs));
  ctx.save();ctx.fillStyle=pool.palettes[cache.current.base].water;ctx.fillRect(0,0,VIEW_W,VIEW_H);
  if(blend>0){ctx.globalAlpha=blend;ctx.fillStyle=pool.palettes[cache.next.base].water;ctx.fillRect(0,0,VIEW_W,VIEW_H);ctx.globalAlpha=1;}
  drawVoyageSceneLayers(cache.current,elapsedMs,1-blend,reduced);drawVoyageSceneLayers(cache.next,elapsedMs,blend,reduced);
  const deck=WORLD_DEFINITION.voyageDeck,x=(deck.x+deck.w/2)*TILE-camX,y=(deck.y+deck.h)*TILE-camY;
  // Streaming hull wake, no rocking of the walkable deck or fishing target.
  ctx.strokeStyle='rgba(217,242,225,.3)';ctx.lineWidth=3;
  const shift=reduced?0:elapsedMs/35%24;
  for(let i=0;i<15;i++){
    const distance=i*24+shift;
    ctx.globalAlpha=(1-i/15)*.6;ctx.beginPath();ctx.moveTo(x-deck.w*TILE/2-10-distance*.13,y-18+distance);ctx.lineTo(x-deck.w*TILE/2+13,y-7+distance);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+deck.w*TILE/2+10+distance*.13,y-18+distance);ctx.lineTo(x+deck.w*TILE/2-13,y-7+distance);ctx.stroke();
  }
  ctx.restore();return true;
}
