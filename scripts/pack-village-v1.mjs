// Reproducible mechanical crop/nearest-neighbor packing, not art generation.
import fs from 'node:fs';
import {blank,decodePNG,encodePNG,crop,alphaBounds,mainSpriteBounds,blitNearest} from './lib/png.mjs';
const buildings=[
  {id:'townhall',doorX:700,width:320},
  {id:'inn',doorX:738,width:320},
  {id:'atelier',doorX:556,width:156},
  {id:'gardener',doorX:518,width:140},
  {id:'veranda',doorX:900,width:200}
];
const manifest={tool:'built-in imagegen',packing:'alpha crop, binary-alpha nearest neighbor, 8px building padding, shared NPC scale and feet baseline',buildings:{},npcs:{}};
for(const spec of buildings){
  const source=decodePNG(fs.readFileSync('assets/buildings/source/village-v1/'+spec.id+'.png'));
  const bounds=alphaBounds(source),scale=(spec.width-16)/bounds.width;
  const contentH=Math.round(bounds.height*scale),packed=blank(spec.width,contentH+16);
  blitNearest(packed,crop(source,bounds.x,bounds.y,bounds.width,bounds.height),8,8,spec.width-16,contentH);
  const file='assets/buildings/'+spec.id+'-v1.png';fs.writeFileSync(file,encodePNG(packed));
  manifest.buildings[spec.id]={file,width:packed.width,height:packed.height,doorCenterX:Math.round(8+(spec.doorX-bounds.x)*scale),groundOffsetY:12,drawW:packed.width*1.5,drawH:packed.height*1.5,sourceDoorX:spec.doorX,crop:bounds};
}
for(const id of ['luca','sora','eden']){
  const source=decodePNG(fs.readFileSync('assets/npcs/source/village-v1/'+id+'.png'));
  const frames=[];
  for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    const x=Math.round(col*source.width/3),y=Math.round(row*source.height/4);
    const frame=crop(source,x,y,Math.round((col+1)*source.width/3)-x,Math.round((row+1)*source.height/4)-y);
    const bounds=mainSpriteBounds(frame);
    frames.push(crop(frame,bounds.x,bounds.y,bounds.width,bounds.height));
  }
  const scale=66/Math.max(...frames.map(frame=>frame.height)),packed=blank(288,384);
  for(let n=0;n<12;n++){
    const frame=frames[n],w=Math.round(frame.width*scale),h=Math.round(frame.height*scale);
    blitNearest(packed,frame,(n%3)*96+48-Math.round(w/2),Math.floor(n/3)*96+88-h,w,h);
  }
  const file='assets/npcs/'+id+'-v1.png';fs.writeFileSync(file,encodePNG(packed));
  manifest.npcs[id]={file,width:288,height:384,cell:96,feetY:88,maxBodyHeight:66,rows:['down','left','right','up']};
}
fs.writeFileSync('assets/buildings/source/village-v1/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
