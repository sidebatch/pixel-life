import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const read=file=>fs.readFileSync(file,'utf8');
export function validateNpcFrame(frame,label,standard){
  const b=alphaBounds(frame);
  assert(b.x>8&&b.x+b.width<88&&b.y>0,`${label}: clipped sprite`);
  assert.equal(b.y+b.height,standard.feet[1],`${label}: feet baseline`);
  assert(b.height>=standard.heightRange[0]&&b.height<=standard.heightRange[1],`${label}: height`);
  let neck=0;for(let x=39;x<=57;x++)if(frame.data[(54*96+x)*4+3]>=128)neck++;
  assert(neck>=6,`${label}: disconnected neck/body band`);
  return b;
}
export function validateNpcFrontProportion(frame,label,standard){
  let head=0,total=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(frame.data[(y*96+x)*4+3]>=128){total++;if(y<54)head++;}
  const fraction=head/total;assert(fraction>=standard.frontHeadFraction[0]&&fraction<=standard.frontHeadFraction[1],`${label}: front head/body proportion requires review`);
  return fraction;
}
export function checkNpcStandard(standard=JSON.parse(read('docs/npc-standard-v1.json'))){
  const context={};vm.createContext(context);
  vm.runInContext(['src/assets.js','src/data/character-rig-data.js','src/data/world-map.js','src/data/region-maps.js'].map(read).join('\n')+
    '\nglobalThis.data={urls:NPC_SHEET_URLS,rig:CHARACTER_RIG,worlds:REGION_WORLDS};',context);
  const {urls,rig,worlds}=context.data;
  assert.equal(standard.cell,rig.cell);assert.equal(standard.renderSize,rig.renderSize);
  assert.deepEqual(standard.feet,Array.from(rig.feet));
  assert.deepEqual(Object.keys(urls).sort(),Object.keys(standard.art).sort(),'Every registered NPC requires an explicit reviewed standard entry');
  const frames=[];
  for(const [id,file] of Object.entries(urls)){
    assert.equal(file,standard.art[id].file,`${id}: unreviewed artwork path`);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),standard.art[id].sha256,`${id}: unreviewed artwork pixels`);
    const image=decodePNG(fs.readFileSync(file));assert.equal(image.width,288);assert.equal(image.height,384);
    for(let row=0;row<4;row++)for(let col=0;col<3;col++){
      const frame=crop(image,col*96,row*96,96,96),bounds=validateNpcFrame(frame,`${id}/${row}/${col}`,standard);
      if(row===0&&col===1)validateNpcFrontProportion(frame,id,standard);
      frames.push({id,row,col,bounds});
    }
  }
  const instances=Object.values(worlds).flatMap(world=>(world.npcs||[]).map(npc=>({region:world.id,...npc})));
  for(const npc of instances){assert(urls[npc.sprite],`Unregistered NPC: ${npc.id}`);assert.equal(npc.scale,1,`${npc.id}: per-NPC scale exception`);}
  const renderer=read('src/rendering.js').split('function drawNPC(npc){')[1].split('function forestryPlayerDrawDepth')[0];
  assert(renderer.includes('CHARACTER_RIG.cell')&&renderer.includes('CHARACTER_RIG.renderSize')&&renderer.includes('CHARACTER_RIG.feet[1]'),'NPC renderer must share player anchors');
  // Reject the old six-pixel mistake and an unreviewed future NPC in memory.
  const wrong=decodePNG(fs.readFileSync('assets/npcs/jun.png'));
  assert.throws(()=>validateNpcFrame(crop(wrong,96,0,96,96),'old feet=94',standard),/feet baseline/);
  return {standard:standard.id,sheets:Object.keys(urls).length,frames:frames.length,instances:instances.length,registeredIds:Object.keys(urls)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log('NPC standard passed: '+JSON.stringify(checkNpcStandard()));
