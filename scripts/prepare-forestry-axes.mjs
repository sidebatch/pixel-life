import fs from 'node:fs';
import path from 'node:path';
import {alphaBounds,blank,blitNearest,crop,decodePNG,encodePNG} from './lib/png.mjs';

const root=path.resolve(import.meta.dirname,'..');
const axes=['black-iron','rune','spirit','moonlight','starlight','primordial'];
const cardSize=384;

for(const id of axes){
  const sourcePath=path.join(root,'assets','forestry','axes','source',`${id}-1254.png`);
  const source=decodePNG(fs.readFileSync(sourcePath));
  const bounds=alphaBounds(source);
  if(!bounds) throw new Error(`${id}: empty source image`);
  if(source.width!==1254||source.height!==1254) throw new Error(`${id}: expected 1254x1254 source`);

  const card=blank(cardSize,cardSize);
  blitNearest(card,source,0,0,cardSize,cardSize);
  const cardPath=path.join(root,'assets','forestry','axes',`${id}.png`);
  fs.writeFileSync(cardPath,encodePNG(card));

  const scale=Math.min(80/bounds.width,80/bounds.height);
  const width=Math.max(1,Math.round(bounds.width*scale));
  const height=Math.max(1,Math.round(bounds.height*scale));
  const tool=blank(96,96);
  blitNearest(tool,crop(source,bounds.x,bounds.y,bounds.width,bounds.height),
    Math.round((96-width)/2),Math.round((96-height)/2),width,height);
  const destination=path.join(root,'assets','player','rig-v1','tools',`axe-${id}.png`);
  fs.writeFileSync(destination,encodePNG(tool));
  console.log(`${id}: card ${source.width}x${source.height} -> ${cardSize}x${cardSize}; tool ${bounds.width}x${bounds.height} -> ${width}x${height}`);
}
