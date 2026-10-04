// Normalize Tier-10 art into review candidates only; live game art is untouched.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {alphaBounds,blank,blitNearest,crop,decodePNG,encodePNG} from './lib/png.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const tierRoot=path.join(root,'assets','forestry','candidates','tier10');
const ids=['origin_tree','primal_ancient','worldroot','dawncore','abysswood'];
const entries=[
  ...ids.map(id=>['trees',id,120,144]),
  ...ids.map(id=>['stumps',id,96,96]),
  ...ids.map(id=>['items',id,96,96])
];

for(const [kind,id,width,height] of entries){
  const prefix=kind==='items'?'item':kind==='trees'?'tree':'stump';
  const source=decodePNG(await readFile(path.join(tierRoot,'source',`${prefix}-${id}.png`)));
  const bounds=alphaBounds(source);
  const trimmed=crop(source,bounds.x,bounds.y,bounds.width,bounds.height);
  const margin=kind==='trees'?4:5;
  const scale=Math.min((width-2*margin)/trimmed.width,(height-2*margin)/trimmed.height);
  const drawnWidth=Math.max(1,Math.round(trimmed.width*scale));
  const drawnHeight=Math.max(1,Math.round(trimmed.height*scale));
  const out=blank(width,height);
  const x=Math.floor((width-drawnWidth)/2);
  const y=kind==='items'?Math.floor((height-drawnHeight)/2):height-margin-drawnHeight;
  blitNearest(out,trimmed,x,y,drawnWidth,drawnHeight);
  const destination=path.join(tierRoot,kind,`${id}.png`);
  await mkdir(path.dirname(destination),{recursive:true});
  await writeFile(destination,encodePNG(out));
  const finalBounds=alphaBounds(out);
  if(finalBounds.x<1||finalBounds.y<1||finalBounds.x+finalBounds.width>=width-1||finalBounds.y+finalBounds.height>=height-1){
    throw Error(`Sprite clipped: ${kind}/${id}`);
  }
  process.stdout.write(`${kind}/${id}.png ${width}x${height} content=${finalBounds.width}x${finalBounds.height}\n`);
}
