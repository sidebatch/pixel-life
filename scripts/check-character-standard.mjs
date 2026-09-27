// Registration gate: new art conforms to the rig, never the reverse.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const faces=['down','right','left','up'];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const read=file=>fs.readFileSync(file,'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
export function validateAtlas(image,columns,label){
  assert.equal(image.width,columns*96,`${label}: wrong atlas width`);
  assert.equal(image.height,384,`${label}: wrong atlas height`);
}
export function validateOutfit(image,mask,label){
  assert.equal(image.data.length,mask.data.length,`${label}: wrong pixel count`);
  for(let p=3;p<image.data.length;p+=4)assert.equal(image.data[p],mask.data[p],`${label}: changed common clothing silhouette/skin exposure`);
}
export function validateTool(image,tool,label){
  assert.equal(image.width,96,`${label}: tool width`);assert.equal(image.height,96,`${label}: tool height`);
  for(const field of ['grip','tip'])assert(Array.isArray(tool[field])&&tool[field].length===2&&
    tool[field].every(n=>Number.isFinite(n)&&n>=0&&n<96),`${label}: invalid ${field}`);
  const dx=tool.tip[0]-tool.grip[0],dy=tool.tip[1]-tool.grip[1];
  assert(Number.isFinite(tool.nativeLength)&&tool.nativeLength>0&&Math.abs(tool.nativeLength-Math.hypot(dx,dy))<1e-6,`${label}: wrong handle length`);
  assert(Number.isFinite(tool.nativeAngle)&&Math.abs(Math.atan2(Math.sin(tool.nativeAngle-Math.atan2(dy,dx)),Math.cos(tool.nativeAngle-Math.atan2(dy,dx))))<1e-6,`${label}: wrong handle axis`);
  assert(image.data.some((v,p)=>p%4===3&&v>0),`${label}: empty tool`);
}
export function checkCharacterStandard(contract=JSON.parse(read('docs/character-standard-v1.json'))){
  for(const [file,expected] of Object.entries(contract.protectedFiles)){
    const data=file.endsWith('.png')?fs.readFileSync(file):read(file).replace(/\r\n/g,'\n');
    assert.equal(hash(data),expected,`Frozen reference changed: ${file}. Fix new art, or request an explicit standard version change.`);
  }
  const context={WORLD_DEFINITION:{tileSize:48,width:64,height:48},
    document:{getElementById:()=>({width:576,height:1024,getContext:()=>({})})},
    DEFAULT_FISHING_ROD_ID:'rod.basic',DEFAULT_FORESTRY_AXE_ID:'axe.basic'};
  vm.createContext(context);
  vm.runInContext(read('src/data/character-rig-data.js')+'\n'+read('src/assets.js')+'\n'+read('src/config.js')+
    '\nglobalThis.registration={rig:CHARACTER_RIG,layers:CHARACTER_LAYER_URLS,tools:CHARACTER_TOOL_URLS,outfits:CHARACTER_OUTFITS,preview:CHARACTER_WARDROBE_PREVIEW_URLS,parts:Object.fromEntries(Object.entries(CHARACTER_PARTS).map(([k,v])=>[k,[...v]]))};',context);
  const data=plain(context.registration),{tools,...geometry}=data.rig;
  assert.equal(hash(JSON.stringify(geometry)),contract.geometryHash,'Frozen body/grip/pose coordinates changed');
  for(const [id,tool] of Object.entries(contract.existingTools))assert.deepEqual(tools[id],tool,`Existing tool anchors changed: ${id}`);
  assert.deepEqual(Object.keys(data.tools).sort(),Object.keys(tools).sort(),'Tool image/metadata registrations must match');
  const cache=new Map();
  const png=file=>{assert(file, 'Missing registered image');if(!cache.has(file))cache.set(file,decodePNG(fs.readFileSync(file)));return cache.get(file);};
  const layer=key=>png(data.layers[key]);
  let atlases=0;
  const atlas=(file,pose,label)=>{const image=png(file);validateAtlas(image,geometry.poses[pose].columns,label);atlases++;return image;};
  const fixed=(pose,name)=>layer(pose+name);
  const checkOutfits=(id,urls)=>{for(const pose of Object.keys(geometry.poses)){
    const image=atlas(urls[pose],pose,`${id}/${pose}`);validateOutfit(image,fixed(pose,'Outfit'),`${id}/${pose}`);
  }};
  for(const outfit of data.outfits)checkOutfits(outfit.id,outfit.layers||Object.fromEntries(Object.keys(geometry.poses).map(pose=>[pose,data.layers[pose+'Outfit']])));
  for(const [id,urls] of Object.entries(data.preview))checkOutfits(id+' (preview)',urls);
  for(const [part,entries] of Object.entries(data.parts))for(const [id,keys] of entries){
    const names=part==='body'?['Body','Head','Grip']:part==='hair'?['Hair']:['Backpack'];
    for(const pose of Object.keys(geometry.poses))for(const name of names){
      const image=atlas(data.layers[keys[pose+name]],pose,`${id}/${pose}${name}`);
      if(name==='Body'||name==='Grip')assert(image.data.equals(fixed(pose,name).data),`${id}: new character must share fixed ${name}`);
      for(let row=0;row<4;row++)for(let frame=0;frame<geometry.poses[pose].columns;frame++){
        const cell=crop(image,frame*96,row*96,96,96);
        if(name==='Head'||name==='Hair'){
          const neutral=crop(layer(keys['walk'+name]),0,row*96,96,96);
          assert(cell.data.equals(neutral.data),`${id}: head/hair scale or position changes across poses`);
        }
        if(name==='Backpack'&&row!==0){
          const body=crop(fixed(pose,'Body'),frame*96,row*96,96,96),bounds=alphaBounds(cell);
          assert(bounds&&bounds.x>0&&bounds.y>0&&bounds.x+bounds.width<96&&bounds.y+bounds.height<96,`${id}: bag touches cell boundary`);
          let overlap=0;for(let p=3;p<cell.data.length;p+=4)if(cell.data[p]&&body.data[p])overlap++;
          assert(overlap>=4,`${id}: bag is not attached to the body`);
        }
      }
    }
  }
  for(const [id,tool] of Object.entries(tools)){
    assert(/^(axe|rod)\./.test(id),`New action family requires a versioned extension: ${id}`);
    validateTool(png(data.tools[id]),tool,id);
  }
  return {standard:contract.id,atlases,tools:Object.keys(tools).length,protectedFiles:Object.keys(contract.protectedFiles).length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log('Character standard passed: '+JSON.stringify(checkCharacterStandard()));
