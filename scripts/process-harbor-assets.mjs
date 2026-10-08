// Integrate generated harbor art using the repository's existing PNG packing helpers.
// No painting/recoloring: alpha trim and nearest-neighbor scale into new sprite files.
import fs from 'node:fs';
import path from 'node:path';
import {alphaBounds,blank,blitNearest,crop,decodePNG,encodePNG} from './lib/png.mjs';
const root=process.cwd(),folder=path.join(root,'assets/harbor');
const version=process.argv[2]||'v2';
if(!/^v[12]$/.test(version))throw Error('Expected explicit harbor art version v1 or v2');
const entries=[
  ['harbor-boat-'+version,192,168],['harbor-ticket-booth-'+version,96,88],
  ['voyage-deck-'+version,216,336],['voyage-cabin-'+version,144,132],['harbor-crate-'+version,32,32]
];
fs.mkdirSync(folder,{recursive:true});
for(const [id,width,height] of entries){
  const source=decodePNG(fs.readFileSync(path.join(folder,'source',id+'.png')));
  const bounds=alphaBounds(source);if(!bounds.width||!bounds.height)throw Error('Empty source: '+id);
  const trimmed=crop(source,bounds.x,bounds.y,bounds.width,bounds.height),out=blank(width,height);
  const scale=Math.min((width-4)/trimmed.width,(height-4)/trimmed.height);
  const w=Math.max(1,Math.round(trimmed.width*scale)),h=Math.max(1,Math.round(trimmed.height*scale));
  blitNearest(out,trimmed,Math.floor((width-w)/2),height-2-h,w,h);
  fs.writeFileSync(path.join(folder,id+'.png'),encodePNG(out));
  console.log(id+' '+width+'x'+height+' content='+w+'x'+h);
}
