// Convert generated, transparent Tier-1 concepts into isolated game-size candidates.
// This only writes assets/forestry/candidates/tier1; it never changes live assets.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {alphaBounds,blank,blitNearest,crop,decodePNG,encodePNG} from './lib/png.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const tierRoot=path.join(root,'assets','forestry','candidates','tier1');
const entries=[
  ['items','pine',96,96],
  ['items','willow',96,96],
  ['items','spruce',96,96],
  ['items','paulownia',96,96],
  ['items','cedar',96,96],
  ['trees','paulownia',120,144],
  ['trees','cedar',120,144],
  ['trees','cedar-v2',120,144],
  ['stumps','paulownia',96,96],
  ['stumps','cedar',96,96]
];
for(const [kind,id,width,height] of entries){
  const sourceName=`${kind==='items'?'item':kind==='trees'?'tree':'stump'}-${id}.png`;
  const source=decodePNG(await readFile(path.join(tierRoot,'source',sourceName)));
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
