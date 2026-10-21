// Packaging only: preserve image_gen originals; crop and nearest-neighbor resize.
import fs from 'node:fs';
import {decodePNG,encodePNG,mainSpriteBounds,crop,blank,blitNearest} from './lib/png.mjs';
for(const [id,w,h] of [['cave',320,256],['cliff',320,160]]){
  const source=decodePNG(fs.readFileSync(`assets/hunting/source/${id}-v1.png`));
  const b=mainSpriteBounds(source),sprite=crop(source,b.x,b.y,b.width,b.height);
  const scale=Math.min((w-16)/b.width,(h-16)/b.height),sw=Math.round(b.width*scale),sh=Math.round(b.height*scale);
  const packed=blank(w,h);blitNearest(packed,sprite,Math.floor((w-sw)/2),h-8-sh,sw,sh);
  fs.writeFileSync(`assets/hunting/${id}-v1.png`,encodePNG(packed));
  if(id==='cave'){
    const icon=blank(128,128),s=Math.min(112/b.width,112/b.height),iw=Math.round(b.width*s),ih=Math.round(b.height*s);
    blitNearest(icon,sprite,Math.floor((128-iw)/2),Math.floor((128-ih)/2),iw,ih);
    fs.writeFileSync('assets/hunting/cave-icon-v1.png',encodePNG(icon));
  }
  console.log(id,{source:[source.width,source.height],bounds:b,packed:[w,h]});
}
