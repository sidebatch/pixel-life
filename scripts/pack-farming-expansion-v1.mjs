import fs from 'node:fs';
import path from 'node:path';
import {decodePNG,encodePNG,blank,crop,alphaBounds,blitNearest} from './lib/png.mjs';
const ids=['lettuce','cucumber','eggplant','chili'];
const cells=[['seeds',0,0,80,80],['young',1,0,66,64],['mature',0,1,82,82],['harvest',1,1,80,80]];
const manifest={cellSize:96,sampling:'nearest',sprites:[]};
const preview=blank(384,384);
for(const [row,id] of ids.entries()){
  const sourcePath='assets/farming/source/expansion-v1/'+id+'.png';
  const source=decodePNG(fs.readFileSync(sourcePath));
  for(const [column,[stage,cx,cy,maxWidth,maxHeight]] of cells.entries()){
    const x=Math.floor(source.width*cx/2),y=Math.floor(source.height*cy/2);
    const region=crop(source,x,y,Math.floor(source.width*(cx+1)/2)-x,Math.floor(source.height*(cy+1)/2)-y);
    const bounds=alphaBounds(region),sprite=crop(region,bounds.x,bounds.y,bounds.width,bounds.height);
    const scale=Math.min(maxWidth/sprite.width,maxHeight/sprite.height),width=Math.round(sprite.width*scale),height=Math.round(sprite.height*scale);
    const packed=blank(96,96),dx=Math.floor((96-width)/2),dy=stage==='young'||stage==='mature'?90-height:Math.floor((96-height)/2);
    blitNearest(packed,sprite,dx,dy,width,height);
    const output='assets/farming/'+stage+'/'+id+'.png';
    fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,encodePNG(packed));
    blitNearest(preview,packed,column*96,row*96);
    manifest.sprites.push({id,stage,source:sourcePath,sourceCell:{x,y,width:region.width,height:region.height},bounds,output,packedBounds:alphaBounds(packed)});
  }
}
fs.writeFileSync('assets/farming/source/expansion-v1/manifest.json',JSON.stringify(manifest,null,2)+'\n');
fs.mkdirSync('output/farming-expansion-v1',{recursive:true});
fs.writeFileSync('output/farming-expansion-v1/sprites.png',encodePNG(preview));
console.log('Packed 16 crop sprites into transparent 96px cells.');
