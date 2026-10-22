import fs from 'node:fs';
import {blank,decodePNG,encodePNG,crop,alphaBounds,mainSpriteBounds,blitNearest} from './lib/png.mjs';
// Only pack the four newly generated subjects. Other atlas cells keep exact RGBA.
const manifest=JSON.parse(fs.readFileSync('docs/art/dungeon-prompts-v2.json','utf8'));
const replacements={heron:['swamp',4],armadillo:['redrock',4],vorn:['frost',5]};
function components(image){
  const {width,height,data}=image,seen=new Uint8Array(width*height),result=[];
  for(let start=0;start<seen.length;start++){
    if(seen[start]||data[start*4+3]<128)continue;
    const queue=[start];seen[start]=1;let x0=width,y0=height,x1=0,y1=0;
    for(let q=0;q<queue.length;q++){
      const n=queue[q],x=n%width,y=Math.floor(n/width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;
        const i=yy*width+xx;if(!seen[i]&&data[i*4+3]>=128){seen[i]=1;queue.push(i);}
      }
    }
    if(queue.length>500)result.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1});
  }
  return result;
}
function fit(target,image,x,y,cell,foot,margin){
  const b=mainSpriteBounds(image),sprite=crop(image,b.x,b.y,b.width,b.height),scale=Math.min((cell-margin*2)/b.width,(cell-margin*2)/b.height);
  const w=Math.round(b.width*scale),h=Math.round(b.height*scale);
  for(let row=0;row<cell;row++)target.data.fill(0,((y+row)*target.width+x)*4,((y+row)*target.width+x+cell)*4);
  blitNearest(target,sprite,x+Math.round((cell-w)/2),y+foot-h,w,h);
}
for(const item of manifest){
  const image=decodePNG(fs.readFileSync(item.source));
  if(item.key==='brak'){
    const target=blank(192,192);
    const parts=components(image);if(parts.length!==4)throw Error('Brak needs four separate full-body sprites');
    const slots=new Set();
    for(const b of parts){
      const col=Math.round((b.x+b.width/2)/image.width*2-.5),row=Math.round((b.y+b.height/2)/image.height*2-.5);
      if(slots.has(row*2+col))throw Error('Duplicate Brak view');slots.add(row*2+col);
      fit(target,crop(image,b.x,b.y,b.width,b.height),col*96,row*96,96,90,6);
    }
    fs.writeFileSync('assets/dungeons/brak-v2.png',encodePNG(target));continue;
  }
  const [atlas,frame]=replacements[item.key]||[];if(!atlas)throw Error('Unexpected sprite '+item.key);
  const target=decodePNG(fs.readFileSync('assets/dungeons/'+atlas+'-v1.png'));
  fit(target,image,frame%3*128,Math.floor(frame/3)*128,128,118,10);
  fs.writeFileSync('assets/dungeons/'+atlas+'-v2.png',encodePNG(target));
}
console.log('Packed heron, armadillo, Brak and Vorn; all other atlas pixels preserved.');
