// Normalize only the new raster marine decorations; preserve source alpha.
// Uses existing PNG helpers for trim + nearest-neighbor packing, no repainting.
import fs from 'node:fs';
import path from 'node:path';
import {alphaBounds,blank,blitNearest,crop,decodePNG,encodePNG} from './lib/png.mjs';
const folder=path.join(process.cwd(),'assets/voyage');
for(const [id,width,height] of [['voyage-reef-v1',128,88],['voyage-coral-v1',48,48]]){
 const source=decodePNG(fs.readFileSync(path.join(folder,'source',id+'.png'))),bounds=alphaBounds(source);
 if(!bounds.width||!bounds.height)throw Error('Empty source: '+id);
 const trimmed=crop(source,bounds.x,bounds.y,bounds.width,bounds.height),out=blank(width,height);
 const scale=Math.min((width-4)/trimmed.width,(height-4)/trimmed.height);
 const w=Math.max(1,Math.round(trimmed.width*scale)),h=Math.max(1,Math.round(trimmed.height*scale));
 blitNearest(out,trimmed,Math.floor((width-w)/2),Math.floor((height-h)/2),w,h);
 fs.writeFileSync(path.join(folder,id+'.png'),encodePNG(out));console.log(id+' '+width+'x'+height+' content='+w+'x'+h);
}
