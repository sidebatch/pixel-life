import fs from 'node:fs';
import path from 'node:path';
import {blank,blitNearest,decodePNG,encodePNG} from './lib/png.mjs';

const root=process.cwd();
const source=decodePNG(fs.readFileSync(path.join(root,'assets/ui/menu/bag.png')));
const outputDirectory=path.join(root,'assets/pwa');
fs.mkdirSync(outputDirectory,{recursive:true});

function fill(image,r,g,b,a=255){
  for(let at=0;at<image.data.length;at+=4){
    image.data[at]=r;image.data[at+1]=g;image.data[at+2]=b;image.data[at+3]=a;
  }
}

function makeIcon(size){
  const icon=blank(size,size);
  fill(icon,14,36,49);
  const inset=Math.round(size*.08);
  for(let y=inset;y<size-inset;y++)for(let x=inset;x<size-inset;x++){
    const nx=(x-size/2)/(size/2-inset),ny=(y-size/2)/(size/2-inset);
    if(nx*nx+ny*ny>1)continue;
    const at=(y*size+x)*4;
    const glow=Math.max(0,1-Math.hypot(nx,ny));
    icon.data[at]=Math.round(28+glow*12);
    icon.data[at+1]=Math.round(78+glow*27);
    icon.data[at+2]=Math.round(67+glow*18);
  }
  const artSize=Math.round(size*.72);
  blitNearest(icon,source,Math.round((size-artSize)/2),Math.round((size-artSize)/2),artSize,artSize);
  return icon;
}

for(const size of [192,512]){
  const output=path.join(outputDirectory,`icon-${size}.png`);
  fs.writeFileSync(output,encodePNG(makeIcon(size)));
  console.log(`Prepared ${path.relative(root,output)} (${size}x${size})`);
}
