// Reproducible packing of the approved source concept into the shared 96px tool cell.
import fs from 'node:fs';
import path from 'node:path';
import {blank,decodePNG,encodePNG,crop,alphaBounds,blitNearest} from './lib/png.mjs';

const source='assets/player/source/sword-v1/basic-generated.png';
const target='assets/player/sword-v1/basic.png';
const image=decodePNG(fs.readFileSync(source));
const bounds=alphaBounds(image);
const sword=blank(96,96);
blitNearest(sword,crop(image,bounds.x,bounds.y,bounds.width,bounds.height),13,13,70,70);
const encoded=encodePNG(sword);
if(process.argv.includes('--check')){
  if(!fs.existsSync(target)||!fs.readFileSync(target).equals(encoded))
    throw new Error(`${target} does not match ${source}`);
  console.log(`Verified ${target}`);
}else{
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,encoded);
  console.log(`Packed ${target}`);
}
