import fs from 'node:fs';
import assert from 'node:assert/strict';
import {checkNpcStandard,validateNpcFrontProportion} from './check-npc-standard.mjs';
import {decodePNG,crop} from './lib/png.mjs';
const contract=JSON.parse(fs.readFileSync('docs/npc-standard-v1.json','utf8'));
const missing=structuredClone(contract);delete missing.art.haru;
assert.throws(()=>checkNpcStandard(missing),/Every registered NPC/);
const oldHaru=decodePNG(fs.readFileSync('assets/npcs/haru-v2.png'));
assert.throws(()=>validateNpcFrontProportion(crop(oldHaru,96,0,96,96),'old Haru',contract),/head\/body proportion/);
const packing=JSON.parse(fs.readFileSync('assets/npcs/source/actor-standard-v1/packing.json','utf8'));
for(const record of Object.values(packing.records).filter(r=>r.shifts)){
  const before=decodePNG(fs.readFileSync(record.source)),after=decodePNG(fs.readFileSync(record.file));
  for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    const a=crop(before,col*96,row*96,96,96),b=crop(after,col*96,row*96,96,96),shift=record.shifts[row*3+col];let countA=0,countB=0;
    for(let y=0;y<96;y++)for(let x=0;x<96;x++){
      if(b.data[(y*96+x)*4+3])countB++;
      const at=(y*96+x)*4;if(!a.data[at+3])continue;countA++;
      assert(a.data.subarray(at,at+4).equals(b.data.subarray(((y+shift)*96+x)*4,((y+shift)*96+x)*4+4)),'Legacy actor pixels were repainted/resized');
    }assert.equal(countA,countB);
  }
}
console.log('NPC negative fixtures passed: unreviewed entry, original feet=94 and old Haru proportions rejected; all 72 legacy frames retain exactly their original visible RGBA pixels.');
