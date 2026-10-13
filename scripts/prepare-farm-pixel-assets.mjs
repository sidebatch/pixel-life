// Authored pixel geometry, matching the game's code-drawn terrain palette.
import fs from 'node:fs';
import {blank,encodePNG} from './lib/png.mjs';
function rect(image,x,y,w,h,color){
  const rgba=color.match(/../g).map(n=>parseInt(n,16));
  for(let iy=y;iy<y+h;iy++)for(let ix=x;ix<x+w;ix++)
    if(ix>=0&&iy>=0&&ix<image.width&&iy<image.height)
      image.data.set([...rgba,255],(iy*image.width+ix)*4);
}
const soil=blank(48,48);
rect(soil,5,0,38,48,'5d4734');rect(soil,7,0,34,48,'88623f');
rect(soil,9,0,30,48,'a47a4c');
for(let y=3;y<48;y+=10){
  rect(soil,10,y,28,3,'725137');rect(soil,11,y+3,26,2,'bb8d57');
  rect(soil,12+(y%3)*3,y,5,1,'604631');
}
for(let i=0;i<18;i++){
  const x=9+(i*13)%29,y=(i*17)%48;
  rect(soil,x,y,2,1,i%2?'c09560':'956b45');
}
for(let y=2;y<48;y+=9){rect(soil,4,y,2,3,'739351');rect(soil,42,y+4,2,2,'739351');}
const sickle=blank(96,96);
// A diagonal wooden grip and a hooked iron blade. True anchors: 28,72 / 58,26.
for(let i=0;i<47;i++){
  const x=28+Math.round(i*30/46),y=72-i;
  rect(sickle,x-3,y-3,7,7,'493c2e');rect(sickle,x-1,y-2,4,5,'a57a45');
  rect(sickle,x,y-2,1,3,'d6aa64');
}
// Pixel crescent opens toward the right; interior remains transparent.
for(let y=13;y<=49;y++)for(let x=45;x<=79;x++){
  const d=Math.hypot(x-61,y-32),inner=Math.hypot(x-69,y-34);
  if(d<=18&&inner>=14&&!(x>69&&y>34)){
    rect(sickle,x,y,1,1,d>16?'435757':d>14?'e2e4c2':'a9b9ac');
  }
}
rect(sickle,54,26,8,5,'657b75');rect(sickle,56,26,5,2,'d5ddbd');
fs.mkdirSync('assets/farming/terrain',{recursive:true});fs.mkdirSync('assets/player/sickle-v1',{recursive:true});
fs.writeFileSync('assets/farming/terrain/soil-v1.png',encodePNG(soil));
fs.writeFileSync('assets/player/sickle-v1/basic.png',encodePNG(sickle));
console.log('Authored farm soil 48px and sickle 96px');
