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
// Scene metadata can rotate, but every solid decoration has its own lifetime.
const voyageSceneCache={key:null,generator:null,current:null,next:null,composites:new Map(),objects:new Map(),built:0,lastElapsed:-1};
const voyageMotionQuery=typeof window!=='undefined'?window.matchMedia?.('(prefers-reduced-motion: reduce)'):null;
function releaseVoyageScenes(){
  for(const object of voyageSceneCache.objects.values()){object.canvas.width=1;object.canvas.height=1;}
  voyageSceneCache.objects.clear();voyageSceneCache.composites.clear();voyageSceneCache.key=null;
  voyageSceneCache.current=null;voyageSceneCache.next=null;voyageSceneCache.generator=null;voyageSceneCache.lastElapsed=-1;
}
function syncVoyageScenes(seed,elapsedMs,destination='shallow'){
  const cache=voyageSceneCache,key=`${destination}:${seed}:${VIEW_W}:${VIEW_H}`;
  if(cache.key!==key||elapsedMs<cache.lastElapsed){
    releaseVoyageScenes();cache.key=key;cache.generator=createVoyageSceneGenerator(seed,destination);
    cache.current=nextVoyageScene(cache.generator);cache.next=nextVoyageScene(cache.generator);
  }
  const retain=scene=>{
    if(cache.composites.has(scene.index))return;
    // Reconstruct only scenes whose objects could still be crossing the screen.
    if(scene.endMs+50000<elapsedMs)return;
    const layers=composeVoyageScene(scene);
    cache.composites.set(scene.index,layers);cache.built++;
    for(const object of layers.objects)if(object.exitMs>elapsedMs)cache.objects.set(object.id,object);
    else{object.canvas.width=1;object.canvas.height=1;}
  };
  while(elapsedMs>=cache.current.endMs){retain(cache.current);cache.current=cache.next;cache.next=nextVoyageScene(cache.generator);}
  retain(cache.current);retain(cache.next);
  // Discard metadata, not visible artwork. Canvas retirement is below the frame.
  for(const index of cache.composites.keys())if(index!==cache.current.index&&index!==cache.next.index)cache.composites.delete(index);
  for(const [id,object] of cache.objects)if(elapsedMs>=object.exitMs){
    object.canvas.width=1;object.canvas.height=1;cache.objects.delete(id);
  }
  cache.lastElapsed=elapsedMs;return cache;
}
// Pixel artwork is composed once into compact, independently retained sprites.
// No per-frame canvases, smooth vector edges, or decorative collisions.
function voyagePixelRect(paint,x,y,w,h,color){
  paint.fillStyle=color;
  paint.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
}
function voyagePixelPolygon(paint,points,color){
  paint.fillStyle=color;
  const low=Math.floor(Math.min(...points.map(p=>p[1]))),high=Math.ceil(Math.max(...points.map(p=>p[1])));
  for(let y=low;y<high;y++){
    const hits=[],scan=y+.5;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[j],b=points[i];
      if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))hits.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    hits.sort((a,b)=>a-b);
    for(let i=0;i+1<hits.length;i+=2){const left=Math.round(hits[i]),right=Math.round(hits[i+1]);if(right>left)paint.fillRect(left,y,right-left,1);}
  }
}
function voyagePixelOval(paint,x,y,rx,ry,color){
  paint.fillStyle=color;
  for(let dy=-Math.ceil(ry);dy<ry;dy++){
    const t=(dy+.5)/ry;if(Math.abs(t)>=1)continue;
    const half=Math.sqrt(1-t*t)*rx,left=Math.round(x-half),right=Math.round(x+half);
    if(right>left)paint.fillRect(left,Math.round(y+dy),right-left,1);
  }
}
function voyagePixelLine(paint,x1,y1,x2,y2,color,thickness=2){
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))/2));
  for(let i=0;i<=steps;i++)voyagePixelRect(paint,x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps,thickness,thickness,color);
}
function drawVoyageWaveCrest(paint,x,y,length,color,foam=false){
  voyagePixelRect(paint,x,y,length*.28,2,color);
  voyagePixelRect(paint,x+length*.22,y-2,length*.45,2,color);
  voyagePixelRect(paint,x+length*.64,y,length*.3,2,color);
  if(foam){voyagePixelRect(paint,x+length*.4,y-4,4,2,color);voyagePixelRect(paint,x+length*.83,y+4,4,2,color);}
}
function drawVoyagePalm(paint,x,y,size=1){
  const polygon=(pts,color)=>voyagePixelPolygon(paint,pts.map(([px,py])=>[x+px*size,y+py*size]),color);
  polygon([[-3,0],[3,0],[7,-25],[4,-29],[0,-22]],'#71553f');
  voyagePixelLine(paint,x,y-2,x+4*size,y-23*size,'#b99a62',2);
  polygon([[4,-24],[-18,-18],[-12,-28],[1,-32],[-12,-41],[0,-39],[7,-32],[19,-38],[27,-31],[13,-29],[28,-21],[15,-19]],'#315e4b');
  polygon([[3,-29],[-12,-23],[-8,-29],[4,-34],[17,-33],[11,-28],[21,-23],[12,-23]],'#548565');
  voyagePixelRect(paint,x+2*size,y-33*size,8*size,2,'#87a378');
}
// Marine raster sprites are baked once into individual scenery sprites.
// Keep the pixel fallback for isolated renderer tests or asset load diagnostics.
function drawVoyageMarineSprite(paint,key,x,y,w,h,alpha=1){
  const sprite=typeof imgs!=='undefined'&&imgs[key];
  if(!sprite?.complete||!sprite.naturalWidth)return false;
  paint.save();paint.globalAlpha=alpha;
  paint.drawImage(sprite,Math.round(x-w/2),Math.round(y-h/2),Math.round(w),Math.round(h));
  paint.restore();return true;
}
function drawShallowVoyageLandmark(paint,kind,x,y,random,palette){
  const polygon=(pts,color)=>voyagePixelPolygon(paint,pts.map(([px,py])=>[x+px,y+py]),color);
  if(kind==='reef'){
    if(drawVoyageMarineSprite(paint,'voyageReef',x,y+4,120,82,.92)){
      // Keep seeded positions of other scenery identical to the fallback.
      for(let i=0;i<16;i++)random();return;
    }
    polygon([[-58,4],[-40,-14],[-11,-18],[8,-10],[38,-16],[59,8],[29,30],[-28,24]],'rgba(117,177,162,.25)');
    for(let i=0;i<8;i++){
      const rx=x-43+random()*83,ry=y-14+random()*38;
      voyagePixelPolygon(paint,[[rx-12,ry+6],[rx-8,ry-6],[rx+3,ry-10],[rx+13,ry+4],[rx+5,ry+10]],i%2?'#4e877e':'#5f9788');
      voyagePixelRect(paint,rx-5,ry-5,10,2,'#85b19b');
      if(i%3===0){voyagePixelRect(paint,rx,ry-12,4,14,'#b7927a');voyagePixelRect(paint,rx-5,ry-9,12,4,'#cba08b');}
    }
    return;
  }
  if(kind==='rockArch'){
    polygon([[-57,26],[-38,15],[26,16],[57,26],[24,35],[-34,35]],'rgba(165,211,197,.22)');
    polygon([[-34,21],[-36,2],[-31,-12],[-22,-26],[-5,-30],[16,-29],[28,-18],[35,-5],[37,11],[32,24],[17,23],[18,10],[13,-5],[3,-9],[-10,-7],[-16,7],[-18,24]],'#475e61');
    polygon([[-35,1],[-31,-12],[-22,-26],[-5,-30],[16,-29],[28,-18],[31,-8],[15,-13],[1,-15],[-12,-12],[-21,4],[-24,20],[-34,21]],'#7a9184');
    polygon([[-22,-26],[-5,-30],[16,-29],[24,-20],[10,-20],[-3,-23],[-17,-18]],'#b1bba0');
    voyagePixelRect(paint,x+23,y-6,4,22,'#627878');voyagePixelRect(paint,x-23,y+3,6,3,'#a1ae95');
    voyagePixelLine(paint,x-24,y-13,x-17,y-17,'#586f69');voyagePixelLine(paint,x+15,y-26,x+20,y-16,'#61786e');
    voyagePixelRect(paint,x-28,y+13,4,3,'#527269');voyagePixelRect(paint,x+25,y+17,6,3,'#527269');
    drawVoyageWaveCrest(paint,x-46,y+29,38,'#b2d7c7');return;
  }
  const breadth=kind==='sandbar'?1.08:.95+random()*.15;
  const coast=[[-57,5],[-44,-11],[-24,-19],[-3,-17],[17,-25],[41,-13],[57,4],[49,19],[24,27],[-3,23],[-26,28],[-48,19]];
  const shape=(scale,offsetY,color)=>polygon(coast.map(([px,py])=>[px*scale*breadth,py*scale+offsetY]),color);
  shape(1.18,7,'rgba(116,192,178,.35)');shape(1.07,4,'#719e91');
  shape(1,1,'#b29765');shape(.98,-2,palette.sand);shape(.85,-5,'#e3d1a0');
  if(kind!=='sandbar'){
    polygon([[-40,-1],[-29,-15],[-8,-13],[16,-19],[34,-8],[37,5],[12,11],[-12,8],[-31,12]],'#3d6f54');
    polygon([[-32,-6],[-25,-15],[-6,-12],[15,-18],[29,-9],[23,0],[-4,3],[-22,1]],palette.leaf);
    // A few clustered bushes, not uniform circles or a repeated terrain tile.
    for(let i=0;i<4;i++){
      const bx=x-22+i*14,by=y-10+(i%2)*5;
      voyagePixelPolygon(paint,[[bx-10,by+4],[bx-7,by-5],[bx+2,by-9],[bx+10,by-2],[bx+8,by+5]],'#48785a');
      voyagePixelRect(paint,bx-4,by-5,8,2,'#8ba274');
    }
    if(kind==='palmIsland'){drawVoyagePalm(paint,x-17,y,1);drawVoyagePalm(paint,x+15,y-7,.85);}
    else{
      voyagePixelPolygon(paint,[[x+28,y+6],[x+23,y-1],[x+28,y-9],[x+39,y-4],[x+41,y+5]],'#637c72');
      voyagePixelRect(paint,x+29,y-7,6,2,'#a2b09a');
    }
  }
  for(let i=0;i<8;i++)voyagePixelRect(paint,x-36+random()*75,y+10+random()*8,2+random()*3,2,'#c0a878');
  drawVoyageWaveCrest(paint,x-46,y+31,34,'#bfdccb');drawVoyageWaveCrest(paint,x+14,y+30,25,'#abcfc0');
}
function composeVoyageScene(scene){
  const pool=voyageScenePool(scene.destination),random=voyageRandom(scene.artSeed),palette=pool.palettes[scene.base],objects=[];
  const makeObject=(layer,side,spawnMs,paintObject)=>{
    const canvas=document.createElement('canvas');
    canvas.width=layer==='far'?192:80;canvas.height=layer==='far'?176:80;
    const paint=canvas.getContext('2d');paint.imageSmoothingEnabled=false;
    paintObject(paint,canvas.width/2,layer==='far'?88:32);
    const scale=layer==='far'?.8:1.4,w=Math.round(canvas.width*scale),h=Math.round(canvas.height*scale);
    const speed=layer==='far'?26:46,inset=8+Math.round(random()*12);
    objects.push({id:`${scene.index}:${objects.length}`,sceneIndex:scene.index,layer,side,canvas,w,h,inset,spawnMs,
      exitMs:spawnMs+(VIEW_H+h+4)/speed*1000,speed});
  };
  if(scene.landmark){
    const kind=pool.landmarks[scene.landmark];
    makeObject('far',scene.side,(scene.startMs||0)+1000+random()*3000,(paint,x,y)=>{
      if(scene.destination==='mid')drawMidVoyageLandmark(paint,kind,x,y,random,palette);
      else if(scene.destination==='deep')drawDeepVoyageLandmark(paint,kind,x,y,random,palette);
      else if(scene.destination==='glacier')drawGlacierVoyageLandmark(paint,kind,x,y,random,palette);
      else drawShallowVoyageLandmark(paint,kind,x,y,random,palette);
    });
  }
  const type=pool.midObjects[scene.mid],count=type==='none'?0:3+Math.floor(random()*3);
  for(let i=0;i<count;i++){
    const side=(i+(scene.side<0?0:1))%2===0?-1:1;
    makeObject('mid',side,(scene.startMs||0)+3000+i*3500+random()*1500,(m,x,y)=>{
      if(scene.destination==='deep')drawDeepVoyageMidObject(m,type,x,y,random,palette);
      else if(scene.destination==='glacier')drawGlacierVoyageMidObject(m,type,x,y,random,palette);
      else if(type==='dolphins'){
        for(let dolphin=0;dolphin<3;dolphin++){
          const dx=x+dolphin*12,dy=y+dolphin*16;
          drawVoyageWaveCrest(m,dx-17,dy+8,28,'rgba(191,222,216,.24)');
          voyagePixelPolygon(m,[[dx-14,dy],[dx-7,dy-5],[dx-4,dy-11],[dx+1,dy-5],[dx+11,dy-2],[dx+16,dy+2],[dx+5,dy+4],[dx-8,dy+3]],'#42677a');
          voyagePixelRect(m,dx-6,dy-3,12,2,'#8da9af');
          voyagePixelRect(m,dx-17,dy-4,5,3,'#42677a');voyagePixelRect(m,dx-17,dy+2,5,3,'#42677a');
        }
      }else if(type==='swell'){
        for(let crest=0;crest<3;crest++)drawVoyageWaveCrest(m,x-26,y+crest*10,55,crest===0?'rgba(202,225,226,.55)':'rgba(163,201,214,.3)',crest===0);
      }else if(type==='buoys'){
        drawVoyageWaveCrest(m,x-14,y+12,29,'rgba(217,234,210,.38)');
        voyagePixelRect(m,x-5,y-5,10,16,'#40555a');
        voyagePixelRect(m,x-3,y-6,6,14,i%2?'#c49b59':'#b46d54');
        voyagePixelRect(m,x-3,y-1,6,4,'#e5d6ae');voyagePixelRect(m,x-1,y-17,2,12,'#3f5b64');
        voyagePixelRect(m,x-3,y-18,6,2,'#d2b67a');
      }else if(type==='coral'){
        if(drawVoyageMarineSprite(m,'voyageCoral',x,y,38,38,.82)){
          for(let branch=0;branch<4;branch++)random();return;
        }
        voyagePixelOval(m,x,y+6,25,10,'rgba(35,93,104,.2)');
        for(let branch=0;branch<4;branch++){
          const bx=x-16+branch*10,by=y-9-random()*7,color=branch%2?'rgba(195,142,118,.43)':'rgba(131,172,135,.5)';
          voyagePixelRect(m,bx,by,4,18,color);voyagePixelRect(m,bx-4,by+4,12,4,color);
        }
      }else if(type==='fishSchool'){
        for(let fish=0;fish<5;fish++){const fx=x+fish*7,fy=y+fish%2*7;voyagePixelRect(m,fx,fy,8,2,'rgba(25,71,88,.35)');voyagePixelRect(m,fx-2,fy-2,2,6,'rgba(25,71,88,.35)');}
      }else{
        for(let p=0;p<3;p++)drawVoyageWaveCrest(m,x+p*8,y+p%2*6,18,'rgba(215,237,221,.3)',p===0);
      }
    });
  }
  const waves=Array.from({length:Math.round(120*scene.density)},()=>({x:random(),y:random()*3,length:12+random()*28,phase:random()*6.28}));
  const gulls=scene.landmark===0||scene.destination==='deep'||scene.destination==='glacier'?[]:Array.from({length:2+Math.floor(random()*3)},()=>({x:random(),y:random(),phase:random()*6.28}));
  return {objects,waves,gulls};
}
function voyageSceneryRect(object,elapsedMs){
  const deck=WORLD_DEFINITION.voyageDeck,boatLeft=deck.x*TILE-camX,boatRight=(deck.x+deck.w)*TILE-camX;
  // Entire sprite bounds stay outside the hull corridor, including above its bow.
  // Oversized outer portions are allowed to crop at the left/right frame edges.
  const x=object.side<0?boatLeft-object.inset-object.w:boatRight+object.inset;
  const y=Math.floor((-object.h-2+(elapsedMs-object.spawnMs)/1000*object.speed)/2)*2;
  return {x:Math.round(x/2)*2,y,w:object.w,h:object.h};
}
function drawVoyageScenery(elapsedMs){
  ctx.save();ctx.globalAlpha=1;
  // Keep solid scenery speed stable when reduced-motion is toggled. Otherwise
  // changing speed against scene age teleports islands. Only waves/gulls reduce.
  for(const layer of ['far','mid'])for(const object of voyageSceneCache.objects.values()){
    if(object.layer!==layer||elapsedMs<object.spawnMs)continue;
    const rect=voyageSceneryRect(object,elapsedMs);
    if(rect.y+rect.h<=0||rect.y>=VIEW_H)continue;
    ctx.drawImage(object.canvas,rect.x,rect.y,rect.w,rect.h);
  }
  ctx.restore();
}
function drawVoyageSceneLayers(scene,elapsedMs,opacity,reduced){
  if(opacity<=0)return;
  const layers=voyageSceneCache.composites.get(scene.index),age=Math.max(0,elapsedMs-scene.startMs)/1000;
  const boatX=(WORLD_DEFINITION.voyageDeck.x+WORLD_DEFINITION.voyageDeck.w/2)*TILE-camX;
  const shiftX=(boatX-VIEW_W/2)*.2,motion=reduced ? .18 : 1;
  ctx.save();ctx.globalAlpha=opacity;
  const pool=voyageScenePool(scene.destination);
  ctx.globalAlpha=opacity*(scene.wave===2?.34:.24);
  for(const wave of layers.waves){
    const y=((wave.y*VIEW_H+age*(24+scene.wave*8)*motion)%(VIEW_H*3))-VIEW_H;
    if(y<-20||y>VIEW_H+20)continue;
    const x=wave.x*(VIEW_W+80)-40+shiftX;
    drawVoyageWaveCrest(ctx,x,y,wave.length,pool.palettes[scene.base].light,scene.wave===3);
    if(scene.destination==='mid'){
      drawVoyageWaveCrest(ctx,x+5,y-6,wave.length*.75,pool.palettes[scene.base].light);
    }
    if(scene.wave%2)voyagePixelRect(ctx,x+wave.length*.4,y+6,wave.length*.35,2,pool.palettes[scene.base].light);
  }
  ctx.globalAlpha=opacity*.7;
  for(const gull of layers.gulls){
    const x=(gull.x*(VIEW_W+170)+age*8*motion)%(VIEW_W+170)-85,y=gull.y*VIEW_H+age*2*motion;
    const wing=reduced?3:3+Math.sin(age*3+gull.phase)*2;
    voyagePixelRect(ctx,x-8,y-wing,6,2,'#dce6d3');voyagePixelRect(ctx,x-3,y-2,6,2,'#dce6d3');voyagePixelRect(ctx,x+3,y-wing,6,2,'#dce6d3');
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
  drawVoyageScenery(elapsedMs);
  const deck=WORLD_DEFINITION.voyageDeck,x=(deck.x+deck.w/2)*TILE-camX,y=(deck.view==='bow'?deck.y+2:deck.y+deck.h)*TILE-camY;
  // Streaming hull wake, no rocking of the walkable deck or fishing target.
  const shift=reduced?0:elapsedMs/35%24;
  for(let i=0;i<15;i++){
    const distance=i*24+shift;
    ctx.globalAlpha=(1-i/15)*.36;
    drawVoyageWaveCrest(ctx,x-deck.w*TILE/2-22-distance*.13,y-10+distance,32,'#b9d7cc',i%3===0);
    drawVoyageWaveCrest(ctx,x+deck.w*TILE/2-8+distance*.13,y-10+distance,32,'#b9d7cc',i%3===0);
  }
  ctx.restore();return true;
}
