// Atlas registration only. Original PNG pixels/artwork stay untouched.
// Haru v3 artwork was corrected with built-in imagegen; it is not painted here.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {blank,decodePNG,encodePNG,crop,alphaBounds,mainSpriteBounds,blitNearest} from './lib/png.mjs';
const folder='assets/npcs/standard-v1';fs.mkdirSync(folder,{recursive:true});
const records={};
for(const id of ['mina','thomas','elli','noah','hana','jun']){
  const source=`assets/npcs/${id}.png`,image=decodePNG(fs.readFileSync(source)),sheet=blank(288,384),shifts=[];
  for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    const frame=crop(image,col*96,row*96,96,96),b=alphaBounds(frame),shift=88-(b.y+b.height);shifts.push(shift);
    // Integer translation preserves every source RGBA pixel. No scaling,
    // repainting, alpha threshold or per-NPC draw-time offset is involved.
    for(let y=0;y<96;y++)for(let x=0;x<96;x++){
      if(!frame.data[(y*96+x)*4+3])continue;const yy=y+shift;
      if(yy<0||yy>=96)throw Error('Registration clips '+id);
      frame.data.copy(sheet.data,((row*96+yy)*288+col*96+x)*4,(y*96+x)*4,(y*96+x+1)*4);
    }
  }
  const file=`${folder}/${id}.png`;fs.writeFileSync(file,encodePNG(sheet));records[id]={source,file,operation:'lossless integer registration',shifts};
}
const source='assets/npcs/source/actor-standard-v1/haru-v3.png',image=decodePNG(fs.readFileSync(source)),frames=[];
for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const x=Math.round(col*image.width/3),y=Math.round(row*image.height/4),cell=crop(image,x,y,Math.round((col+1)*image.width/3)-x,Math.round((row+1)*image.height/4)-y),b=mainSpriteBounds(cell);
  frames.push(crop(cell,b.x,b.y,b.width,b.height));
}
const scale=68/Math.max(...frames.map(f=>f.height)),sheet=blank(288,384);
for(let n=0;n<12;n++){
  const frame=frames[n],w=Math.round(frame.width*scale),h=Math.round(frame.height*scale);
  blitNearest(sheet,frame,n%3*96+48-Math.round(w/2),Math.floor(n/3)*96+88-h,w,h);
}
const file=`${folder}/haru-v3.png`;fs.writeFileSync(file,encodePNG(sheet));records.haru={source,file,operation:'common-scale nearest-neighbor atlas packing of generated art',scale};
const manifest={version:1,date:'2026-10-16',cell:96,feet:[48,88],neck:[48,54],renderSize:100,rows:['down','left','right','up'],records};
for(const entry of Object.values(records))entry.sha256=crypto.createHash('sha256').update(fs.readFileSync(entry.file)).digest('hex');
fs.writeFileSync('assets/npcs/source/actor-standard-v1/packing.json',JSON.stringify(manifest,null,2)+'\n');console.log('Packed 6 lossless registered NPCs and generated Haru v3 at common feet (48,88).');
