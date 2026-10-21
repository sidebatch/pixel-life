// Crop and nearest-neighbor pack generated originals; no sprite painting here.
import fs from 'node:fs';
import {decodePNG,encodePNG,mainSpriteBounds,crop,blank,blitNearest} from './lib/png.mjs';
for(const [id,width,height]of [['rock-spine',256,384],['dense-grove',384,256],['fallen-log',384,144]]){
 const source=decodePNG(fs.readFileSync(`assets/hunting/source/${id}-v1.png`)),b=mainSpriteBounds(source);
 const sprite=crop(source,b.x,b.y,b.width,b.height),scale=Math.min((width-16)/b.width,(height-16)/b.height);
 const w=Math.round(b.width*scale),h=Math.round(b.height*scale),packed=blank(width,height);
 blitNearest(packed,sprite,Math.floor((width-w)/2),height-8-h,w,h);
 fs.writeFileSync(`assets/hunting/${id}-v1.png`,encodePNG(packed));
 console.log(id,{bounds:b,packed:[width,height]});
}
