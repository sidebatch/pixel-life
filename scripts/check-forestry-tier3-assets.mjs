import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {alphaBounds,decodePNG} from './lib/png.mjs';

const root=fileURLToPath(new URL('../assets/forestry/candidates/tier3/',import.meta.url));
const entries=[
  ...['chestnut','walnut','zelkova'].map(id=>['trees',id,120,144]),
  ...['chestnut','walnut','zelkova'].map(id=>['stumps',id,96,96]),
  ...['maple','chestnut','walnut','broadleaf','zelkova','maple-v2'].map(id=>['items',id,96,96])
];
for(const [kind,id,width,height] of entries){
  const image=decodePNG(await readFile(path.join(root,kind,`${id}.png`)));
  if(image.width!==width||image.height!==height)throw Error(`Wrong canvas: ${kind}/${id}`);
  const bounds=alphaBounds(image);
  if(bounds.x<1||bounds.y<1||bounds.x+bounds.width>=width-1||bounds.y+bounds.height>=height-1)
    throw Error(`Clipped candidate: ${kind}/${id}`);
  const opaque=image.data.filter((value,index)=>index%4===3&&value>=128).length;
  if(opaque<150)throw Error(`Mostly empty candidate: ${kind}/${id}`);
}
console.log(`Tier-3 forestry candidates passed: ${entries.length} transparent sprites including corrected maple, sizes, and margins`);
