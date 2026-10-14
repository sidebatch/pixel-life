// Mechanical alpha crop and nearest-neighbor packing of generated raster art.
import fs from 'node:fs';
import {blank,decodePNG,encodePNG,crop,alphaBounds,mainSpriteBounds,blitNearest} from './lib/png.mjs';
const house=decodePNG(fs.readFileSync('assets/buildings/source/farm-shop-v1/house.png'));
const bounds=alphaBounds(house),scale=144/bounds.width;
const contentH=Math.round(bounds.height*scale),packedHouse=blank(160,contentH+16);
blitNearest(packedHouse,crop(house,bounds.x,bounds.y,bounds.width,bounds.height),8,8,144,contentH);
fs.writeFileSync('assets/buildings/farm-shop-v1.png',encodePNG(packedHouse));
const npc=decodePNG(fs.readFileSync('assets/npcs/source/farm-shop-v1/haru.png'));
const frames=Array.from({length:4},(_,index)=>{
  const left=Math.round(index*npc.width/4),right=Math.round((index+1)*npc.width/4);
  const cell=crop(npc,left,0,right-left,npc.height),b=mainSpriteBounds(cell);
  return crop(cell,b.x,b.y,b.width,b.height);
});
const npcScale=66/Math.max(...frames.map(frame=>frame.height)),sheet=blank(288,384);
for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const frame=frames[row],w=Math.round(frame.width*npcScale),h=Math.round(frame.height*npcScale);
  blitNearest(sheet,frame,col*96+48-Math.round(w/2),row*96+88-h,w,h);
}
fs.writeFileSync('assets/npcs/haru-v1.png',encodePNG(sheet));
const manifest={tool:'built-in imagegen',packing:'alpha crop and binary-alpha nearest-neighbor; no raster art drawn in code',
  house:{file:'assets/buildings/farm-shop-v1.png',width:160,height:packedHouse.height,crop:bounds,sourceDoorCenterX:600,
    doorCenterX:Math.round(8+(600-bounds.x)*scale),groundOffsetY:12,drawW:240,drawH:packedHouse.height*1.5},
  npc:{file:'assets/npcs/haru-v1.png',width:288,height:384,cell:96,feetY:88,maxBodyHeight:66,rows:['down','left','right','up'],
    stationary:true,frames:'one idle portrait per direction repeated in three columns; roam=0'}};
fs.writeFileSync('assets/buildings/source/farm-shop-v1/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
