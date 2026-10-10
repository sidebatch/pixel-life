import fs from 'node:fs';
import {blank,decodePNG,encodePNG,crop,alphaBounds,blitNearest} from './lib/png.mjs';
const specs=[['ridge-west',384,352],['ridge-east',448,256],['waterfall',224,320],['swamp-bank',160,96],['lily-pads',96,64]];
const manifest={tool:'built-in imagegen',packing:'alpha crop, aspect-preserving nearest-neighbor fit with 4px padding',assets:{}};
for(const [id,width,height] of specs){
 const img=decodePNG(fs.readFileSync('assets/biomes/source/scenery-v1/'+id+'.png')),bounds=alphaBounds(img);
 const ratio=Math.min((width-8)/bounds.width,(height-8)/bounds.height),w=Math.round(bounds.width*ratio),h=Math.round(bounds.height*ratio);
 const out=blank(width,height),x=Math.floor((width-w)/2),y=height-4-h;
 blitNearest(out,crop(img,bounds.x,bounds.y,bounds.width,bounds.height),x,y,w,h);
 const file='assets/biomes/'+id+'-v1.png';fs.writeFileSync(file,encodePNG(out));
 manifest.assets[id]={file,width,height,content:{x,y,w,h},sourceCrop:bounds};
}
fs.writeFileSync('assets/biomes/source/scenery-v1/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
