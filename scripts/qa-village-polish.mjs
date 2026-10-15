import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const read=file=>fs.readFileSync(file,'utf8'),context={};
vm.createContext(context);
vm.runInContext(read('src/assets.js')+'\n'+read('src/data/world-map.js')+'\n globalThis.def=WORLD_DEFINITION;globalThis.urls=BUILDING_URLS;globalThis.npcUrls=NPC_SHEET_URLS;',context);
const def=context.def,manifest=JSON.parse(read('assets/buildings/source/village-v1/manifest.json'));
assert.equal(def.buildings.length,8);assert.equal(def.npcs.length,10);
assert.equal(new Set(def.buildings.map(b=>b.w+'x'+b.h)).size,8,'Seven previous footprints plus the relocated four-by-four farm shop');
for(const b of def.buildings.filter(b=>b.action==='inspect')){
  const id=context.urls[b.sprite].match(/([^/]+)-v1.png$/)[1],meta=manifest.buildings[id];
  assert.equal(b.artAnchor.doorCenterX,meta.doorCenterX);assert.equal(b.artAnchor.groundOffsetY,meta.groundOffsetY);
  assert.equal(b.drawW,meta.drawW);assert.equal(b.drawH,meta.drawH);
  assert.equal(b.depthLine,b.h);assert.equal(b.interactionLabel,'살펴보기');
  assert(b.serviceKey&&b.interiorId===null);
  const image=decodePNG(fs.readFileSync(meta.file));
  assert.equal(image.width,meta.width);assert.equal(image.height,meta.height);
  assert.equal(image.data[3],0);assert(alphaBounds(image).height>70);
}
for(const id of ['luca','sora','eden']){
  const n=def.npcs.find(n=>n.id===id),img=decodePNG(fs.readFileSync(context.npcUrls[id]));
  assert(n.residentOf&&def.buildings.some(b=>b.id===n.residentOf));assert.equal(n.roam,2);
  assert.equal(img.width,288);assert.equal(img.height,384);
  for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    const bounds=alphaBounds(crop(img,col*96,row*96,96,96));
    assert(bounds.height>=58&&bounds.height<=66);assert.equal(bounds.y+bounds.height,88);
    assert(bounds.x>8&&bounds.x+bounds.width<88,'No clipped animation frame');
  }
}
assert.equal(def.npcs.find(n=>n.id==='elli').roam,0);assert.equal(def.npcs.find(n=>n.id==='jun').roam,0);
assert.equal(def.npcs.find(n=>n.id==='hana').role,'stylist');
const haru=def.npcs.find(n=>n.id==='haru'),haruArt=decodePNG(fs.readFileSync(context.npcUrls.haru));
assert.equal(haru.role,'farmMerchant');assert.equal(haru.roam,0);assert.equal(haru.scale,1);
assert(def.buildings.some(b=>b.id===haru.residentOf));assert.equal(haruArt.width,288);assert.equal(haruArt.height,384);
for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const frame=crop(haruArt,col*96,row*96,96,96),b=alphaBounds(frame);
  assert(b.height>=58&&b.height<=66);assert.equal(b.y+b.height,88);
  assert(b.x>8&&b.x+b.width<88);assert(frame.data[(54*96+48)*4+3]>0,'Shared neck/body connection remains occupied');
}
const rendering=read('src/rendering.js'),terrain=rendering.slice(rendering.indexOf('function drawNaturalPlazas'),rendering.indexOf('function onScreen'));
assert(terrain.includes('drawNaturalPlazas(terrain)'));assert(!terrain.includes('strokeRect('),'No brick-grid ground');
assert(!terrain.includes("'#9ca2a9'"));assert(terrain.includes('Math.floor(wx/28)*28'),'Texture positions anchored to world, not camera');
const vertices=[],paint={save(){},restore(){},beginPath(){},roundRect(){},fill(){},clip(){},lineTo(){},closePath(){},moveTo(x,y){vertices.push([x+surface.camX,y+surface.camY]);}};
const surface={ctx:paint,WORLD_DEFINITION:def,FOREST_REGION_SPECIES:{},TILE:48,VIEW_W:180,VIEW_H:180,camX:1100,camY:1060,hash2:(x,y)=>{const n=Math.sin(x*12.9898+y*78.233)*43758.5453;return n-Math.floor(n);}};
vm.createContext(surface);vm.runInContext(terrain.slice(0,terrain.indexOf('function drawTerrain')),surface);
vm.runInContext('drawNaturalPlazas(WORLD_DEFINITION.terrain)',surface);
const common=points=>points.filter(([x,y])=>x>1150&&x<1240&&y>1110&&y<1190);
const first=common(vertices);vertices.length=0;surface.camX+=28;surface.camY+=28;
vm.runInContext('drawNaturalPlazas(WORLD_DEFINITION.terrain)',surface);assert.deepEqual(common(vertices),first,'Panning cannot regenerate plaza grains');
vertices.length=0;surface.camX=0;surface.camY=0;vm.runInContext('drawNaturalPlazas(WORLD_DEFINITION.terrain)',surface);assert.equal(vertices.length,0,'Off-screen plaza texture is culled');
console.log('Village polish QA passed: 9 buildings including market, 10 residents, 8 footprint families, previous 36 NPC frames and village plazas preserved');
