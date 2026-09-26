// Asset invariants for the approved art upgrade. Browser behavior is covered by
// qa-character, qa-temporary-wardrobe, qa-held-tool and qa-inventory-ui.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const read=file=>decodePNG(fs.readFileSync(file));
const manifest=JSON.parse(fs.readFileSync('assets/player/polish-v1/manifest.json','utf8'));
assert.equal(manifest.cell,96);assert.deepEqual(manifest.feet,[48,88]);assert.equal(manifest.frames,32);
assert.equal(manifest.files.length,18);
assert.equal(manifest.headRegistration,'single-uniform-master');
const registration=read('assets/player/polish-v1/head-registration.png');
for(const file of ['src/data/character-rig-data.js',
  ...['walk','chop','fish'].flatMap(pose=>['body','head','hair','outfit','backpack','grip'].map(part=>'assets/player/rig-v1/'+pose+'-'+part+'.png')),
  ...['axe-basic','axe-iron','axe-steel','axe-master','rod-basic','rod-sturdy','rod-steel','rod-expert','rod-master_angler','rod-deepwater'].map(name=>'assets/player/rig-v1/tools/'+name+'.png')]){
  const previous=execFileSync('git',['show','HEAD:'+file],{maxBuffer:8*1024*1024});
  assert.ok(fs.readFileSync(file).equals(previous),'Original motion/rig/sprite must remain unchanged: '+file);
}
let verified=0,packCapPixels=0;
for(const pose of ['walk','chop','fish']){
  const columns=pose==='chop'?2:3;
  const layers=Object.fromEntries(['head','hair','outfit','backpack'].map(part=>[part,read('assets/player/polish-v1/'+pose+'-'+part+'.png')]));
  const grip=read('assets/player/rig-v1/'+pose+'-grip.png');
  for(const [part,image] of Object.entries(layers)){
    assert.equal(image.width,columns*96);assert.equal(image.height,384);
    const old=read('assets/player/rig-v1/'+pose+'-'+part+'.png');let changes=0;
    for(let p=0;p<image.data.length;p+=4)if(image.data[p+3]&&!image.data.subarray(p,p+4).equals(old.data.subarray(p,p+4)))changes++;
    assert.ok(changes>30,'New artwork must visibly differ: '+pose+'/'+part);
  }
  for(let face=0;face<4;face++)for(let frame=0;frame<columns;frame++){
    for(const part of ['head','hair']){
      const image=crop(layers[part],frame*96,face*96,96,96),bounds=alphaBounds(image),expected=manifest.canonicalHeads[face][part];
      assert.equal(bounds.width,expected.width,'Head must not enlarge by pose');
      assert.equal(bounds.height,expected.height,'Head must not enlarge by pose');
    }
    if(pose==='walk'&&frame===0){
      const head=crop(layers.head,0,face*96,96,96),hair=crop(layers.hair,0,face*96,96,96),master=crop(registration,0,face*96,96,96);
      for(let p=0;p<master.data.length;p+=4){
        assert.ok(!(head.data[p+3]&&hair.data[p+3]),'Head and Hair must have one pixel owner');
        const pixel=hair.data[p+3]?hair.data.subarray(p,p+4):head.data.subarray(p,p+4);
        assert.ok(pixel.equals(master.data.subarray(p,p+4)),'Merged head must exactly reproduce registered master without bald protrusions');
      }
    }
    const cleanBody=crop(read('assets/player/polish-v1/'+pose+'-body.png'),frame*96,face*96,96,96);
    for(let p=3;p<54*96*4;p+=4)assert.equal(cleanBody.data[p],0,'Body must not retain old head classifier fragments');
    const outfit=crop(layers.outfit,frame*96,face*96,96,96),pack=crop(layers.backpack,frame*96,face*96,96,96),hand=crop(grip,frame*96,face*96,96,96);
    for(let p=0;p<outfit.data.length;p+=4){
      if(hand.data[p+3])assert.ok(!outfit.data[p+3]&&!pack.data[p+3],'Clothes/pack must retain exposed gripping hands');
      if(p/4<54*96)assert.equal(outfit.data[p+3],0,'Old stray hair pixels must not remain in clothes');
      if(face===0)assert.equal(pack.data[p+3],0,'Front-facing pack must remain naturally occluded');
    }
    if(pose==='chop'&&frame===1&&(face===1||face===2)){
      let cap=0;for(let y=54;y<=60;y++)for(let x=0;x<96;x++)if(pack.data[(y*96+x)*4+3])cap++;
      assert.ok(cap>=10,'Side impact backpack cap must remain visible');packCapPixels+=cap;
    }
    verified++;
  }
}
for(const part of ['outfit','backpack']){
  const icon=read('assets/player/polish-v1/'+part+'-icon.png');assert.equal(icon.width,96);assert.equal(icon.height,96);
  assert.ok(icon.data.some((n,index)=>index%4===3&&n===0),'Icons must retain transparency');
}
const assets=fs.readFileSync('src/assets.js','utf8');
for(const pose of ['walk','chop','fish'])for(const part of ['head','hair','outfit','backpack'])
  assert.ok(assets.includes('assets/player/polish-v1/'+pose+'-'+part+'.png'),'Runtime must load every polished part');
assert.ok(fs.readFileSync('src/character.js','utf8').includes("if(handBehindHead)drawLayer('Grip')"),'Raised hands must be occluded by the head');
console.log('Polish contracts passed: '+verified+' poses, exact registered head reconstruction, no Body head fragments, stable head size, preserved grips/caps, 18 assets, original rig/tools unchanged. Cap pixels: '+packCapPixels);
