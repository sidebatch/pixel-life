// Mechanical packing only; Haru's corrected proportions come from the new art.
import fs from 'node:fs';
import {blank,decodePNG,encodePNG,crop,mainSpriteBounds,blitNearest} from './lib/png.mjs';
const source=decodePNG(fs.readFileSync('assets/npcs/source/haru-v2/haru.png')),frames=[];
for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const x=Math.round(col*source.width/3),y=Math.round(row*source.height/4);
  const cell=crop(source,x,y,Math.round((col+1)*source.width/3)-x,Math.round((row+1)*source.height/4)-y),b=mainSpriteBounds(cell);
  frames.push(crop(cell,b.x,b.y,b.width,b.height));
}
const scale=66/Math.max(...frames.map(f=>f.height)),sheet=blank(288,384);
for(let i=0;i<frames.length;i++){
  const frame=frames[i],w=Math.round(frame.width*scale),h=Math.round(frame.height*scale);
  blitNearest(sheet,frame,(i%3)*96+48-Math.round(w/2),Math.floor(i/3)*96+88-h,w,h);
}
const file='assets/npcs/haru-v2.png';fs.writeFileSync(file,encodePNG(sheet));
const manifest={tool:'built-in imagegen edit',references:['assets/npcs/haru-v1.png','assets/npcs/jun.png'],file,width:288,height:384,cell:96,feet:[48,88],neck:[48,54],maxBodyHeight:66,rows:['down','left','right','up'],stationary:true,packing:'alpha crop, common scale, nearest neighbor; existing rig/scale unchanged'};
fs.writeFileSync('assets/npcs/source/haru-v2/manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest));
