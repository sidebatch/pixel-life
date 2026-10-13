import fs from 'node:fs';
import {blank,decodePNG,alphaBounds,crop,blitNearest,encodePNG} from './lib/png.mjs';
const manifest=[],preview=blank(288,96);
for(const [index,id] of ['scarecrow','sign','fence'].entries()){
  const source='assets/farming/decorations/source-v1/'+id+'.png',image=decodePNG(fs.readFileSync(source)),bounds=alphaBounds(image);
  const sprite=crop(image,bounds.x,bounds.y,bounds.width,bounds.height),maxWidth=id==='fence'?96:84,maxHeight=id==='scarecrow'?90:84;
  const scale=Math.min(maxWidth/sprite.width,maxHeight/sprite.height),width=Math.round(sprite.width*scale),height=Math.round(sprite.height*scale),cell=blank(96,96);
  blitNearest(cell,sprite,Math.floor((96-width)/2),96-height,width,height);
  const output='assets/farming/decorations/'+id+'-v1.png';fs.writeFileSync(output,encodePNG(cell));blitNearest(preview,cell,index*96,0);
  manifest.push({id,source,sourceSize:[image.width,image.height],sourceBounds:bounds,output,packedBounds:alphaBounds(cell)});
}
fs.writeFileSync('assets/farming/decorations/source-v1/manifest.json',JSON.stringify(manifest,null,2)+'\n');
fs.mkdirSync('output/farm-orders-v1',{recursive:true});fs.writeFileSync('output/farm-orders-v1/decorations.png',encodePNG(preview));
console.log('Packed three 96px farm decoration sprites.');
