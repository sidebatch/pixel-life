import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {alphaBounds,decodePNG} from './lib/png.mjs';

const root=fileURLToPath(new URL('../assets/forestry/candidates/tier8/',import.meta.url));
const ids=['ancient_zelkova','amber_cedar','silverbark','spiralwood','moonshade'];
const entries=[
  ...ids.map(id=>['trees',id,120,144]),
  ...ids.map(id=>['stumps',id,96,96]),
  ...ids.map(id=>['items',id,96,96])
];

for(const [kind,id,width,height] of entries){
  const image=decodePNG(await readFile(path.join(root,kind,`${id}.png`)));
  if(image.width!==width||image.height!==height)throw Error(`Wrong canvas: ${kind}/${id}`);
  const bounds=alphaBounds(image);
  if(bounds.x<1||bounds.y<1||bounds.x+bounds.width>=width-1||bounds.y+bounds.height>=height-1){
    throw Error(`Clipped candidate: ${kind}/${id}`);
  }
  let opaque=0;
  for(let i=3;i<image.data.length;i+=4)if(image.data[i]>=128)opaque++;
  if(opaque<150)throw Error(`Mostly empty candidate: ${kind}/${id}`);
}

console.log(`Tier-8 forestry candidates passed: ${entries.length} transparent sprites, sizes, content, and safe margins`);
