// Pack the generated replacement; never reshape the character or old artwork.
import fs from 'node:fs';
import {blank,decodePNG,encodePNG,alphaBounds,crop,blitNearest} from './lib/png.mjs';
const sourcePath='assets/player/sickle-v2/source.png';
const source=decodePNG(fs.readFileSync(sourcePath)),bounds=alphaBounds(source);
const sprite=blank(96,96),width=80,height=Math.round(bounds.height*width/bounds.width),x=8,y=14;
blitNearest(sprite,crop(source,bounds.x,bounds.y,bounds.width,bounds.height),x,y,width,height);
fs.writeFileSync('assets/player/sickle-v2/basic.png',encodePNG(sprite));
// The shaft-aligned blade point controls orientation; the sharp cutting end
// is registered separately so the grip does not turn toward the face.
const grip=[19,62],tip=[43,21],bladeTip=[86,55];
for(const [name,[px,py]] of Object.entries({grip,tip,bladeTip}))
  if(!sprite.data[(py*96+px)*4+3])throw Error(`Sickle ${name} does not touch artwork`);
fs.writeFileSync('assets/player/sickle-v2/manifest.json',JSON.stringify({version:2,source:sourcePath,
  image:'assets/player/sickle-v2/basic.png',sourceSize:[source.width,source.height],crop:bounds,
  target:{x,y,width,height},grip,tip,bladeTip,nativeAngle:Math.atan2(tip[1]-grip[1],tip[0]-grip[0]),
  nativeLength:Math.hypot(tip[0]-grip[0],tip[1]-grip[1]),generation:'built-in image_gen; precise-object-edit'},null,2)+'\n');
console.log('Packed sickle v2: 96px, short wooden handle and broad curved blade');
