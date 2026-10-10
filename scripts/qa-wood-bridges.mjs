import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {decodePNG} from './lib/png.mjs';
import {forestWorldContext} from './lib/forest-world-qa.mjs';
const c=forestWorldContext(),source=fs.readFileSync('src/rendering.js','utf8');
const art=source.slice(source.indexOf('// Visual topology only'),source.indexOf('function onScreen'));
c.hash2=(x,y)=>{const n=Math.sin(x*12.9898+y*78.233)*43758.5453;return n-Math.floor(n);};
const paint=vm.runInContext('ctx',c),calls=[];
for(const name of ['save','restore','translate','rotate','scale','fillRect'])paint[name]=()=>{};
paint.drawImage=(...args)=>calls.push(args);
vm.runInContext(`let camX=0,camY=0;${art};imgs.bridge={id:'deck'};imgs.bridgePost={id:'post'};`,c);
const expected={lilacVillage:[[41,21,41,25]],mountainLake:[[31,30,31,35]],waterfallValley:[[36,38,44,38]],reedSwamp:[[33,34,33,40]],coast:[[38,27,38,38],[38,36,47,36]]};
let total=0;
for(const [id,segments] of Object.entries(expected)){
 vm.runInContext(`GAME_STATE.regionId='${id}';buildWorldRegion(REGION_WORLDS['${id}']);`,c);
 const before=vm.runInContext('JSON.stringify({bridge:[...bridgeSet],water:[...waterSet],blocked:[...blocked],state:GAME_STATE})',c);
 const geometry=vm.runInContext('getWoodBridgeGeometry()',c);
 assert.equal(geometry,vm.runInContext('getWoodBridgeGeometry()',c),'Geometry is cached by world definition');
 const tiles=new Set();for(const [x1,y1,x2,y2] of segments)for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)tiles.add(x+','+y);
 assert.deepEqual(Array.from(geometry.tiles,t=>t.x+','+t.y).sort(),[...tiles].sort(),'Existing bridge footprints unchanged');
 assert(vm.runInContext('getWoodBridgeGeometry().tiles.every(t=>!blocked.has(key(t.x,t.y))&&!waterSet.has(key(t.x,t.y)))',c));
 if(id==='waterfallValley')assert(geometry.tiles.every(t=>t.horizontal));
 if(id==='reedSwamp')assert(geometry.tiles.every(t=>!t.horizontal));
 // Every beam separates deck and actual water, never deck/deck or deck/land.
 assert(vm.runInContext(`getWoodBridgeGeometry().edges.every(e=>{
  const a=e.axis==='vertical'?key(e.x-1,e.y):key(e.x,e.y-1),b=key(e.x,e.y);
  return (bridgeSet.has(a)&&waterSet.has(b))||(waterSet.has(a)&&bridgeSet.has(b));
 })`,c));
 const vertices=geometry.posts.map(v=>v.x+','+v.y);assert.equal(vertices.length,new Set(vertices).size);
 assert(geometry.posts.length<geometry.edges.length*2,'No per-tile post boxes');
 vm.runInContext('camX=1000;camY=1000;drawWoodBridges();',c);
 assert.equal(vm.runInContext('JSON.stringify({bridge:[...bridgeSet],water:[...waterSet],blocked:[...blocked],state:GAME_STATE})',c),before,'Rendering must be read-only');
 calls.length=0;vm.runInContext('camX=-10000;camY=-10000;drawWoodBridges()',c);assert.equal(calls.length,0);
 total+=geometry.tiles.length;
}
assert.equal(total,48);
vm.runInContext("GAME_STATE.regionId='boatShallow';buildWorldRegion(REGION_WORLDS.boatShallow);camX=1400;camY=900;drawWoodBridges()",c);assert.equal(calls.length,0,'Voyage bow excluded');
const deck=decodePNG(fs.readFileSync('assets/world/bridge-deck-v1.png')),post=decodePNG(fs.readFileSync('assets/world/bridge-post-v1.png'));
assert.deepEqual([deck.width,deck.height,post.width,post.height],[64,64,24,32]);
assert(deck.data.every((v,i)=>i%4!==3||v===255),'Deck is opaque material, not a framed cutout');
assert.equal(post.data[3],0);assert(post.data.some((v,i)=>i%4===3&&v===255));
console.log('Wood bridges passed: 48 unchanged tiles, direction-aware floors, water-only edge beams, sparse deduplicated supports, cached/read-only/culling, voyage excluded');
