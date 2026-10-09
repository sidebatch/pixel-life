import fs from 'node:fs';
import {decodePNG,encodePNG,alphaBounds,crop,blank,blitNearest} from './lib/png.mjs';
const source=decodePNG(fs.readFileSync('assets/world/source/route-sign-v1/original.png'));
const bounds=alphaBounds(source),scale=128/bounds.width,h=Math.round(bounds.height*scale),packed=blank(144,h+16);
blitNearest(packed,crop(source,bounds.x,bounds.y,bounds.width,bounds.height),8,8,128,h);
fs.writeFileSync('assets/world/route-sign-v1.png',encodePNG(packed));
console.log(JSON.stringify({width:packed.width,height:packed.height,crop:bounds,textCenter:{x:Math.round(8+(744-bounds.x)*scale),y:Math.round(8+(421-bounds.y)*scale)}}));
