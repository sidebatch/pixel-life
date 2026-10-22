import fs from 'node:fs';
import path from 'node:path';
import {blank,decodePNG,encodePNG,crop,alphaBounds,blitNearest} from './lib/png.mjs';
// Only crop/pack the generated pixels; no replacement or procedural monster art.
const manifest=JSON.parse(fs.readFileSync('docs/art/dungeon-prompts-v1.json','utf8'));
const out='assets/dungeons';fs.mkdirSync(out,{recursive:true});
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
    if(queue.length>500)result.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,pixels:queue.length});
  }
  return result;
}
function fit(target,source,b,cellX,cellY,cellW,cellH,foot,margin=10){
  const sprite=crop(source,b.x,b.y,b.width,b.height),s=Math.min((cellW-margin*2)/b.width,(cellH-margin*2)/b.height);
  const w=Math.round(b.width*s),h=Math.round(b.height*s);
  blitNearest(target,sprite,cellX+Math.round((cellW-w)/2),cellY+foot-h,w,h);
}
function write(file,image){fs.writeFileSync(path.join(out,file),encodePNG(image));}
for(const item of manifest){
  const source=decodePNG(fs.readFileSync(item.source)),parts=components(source);
  if(process.argv.includes('--inspect')){console.log(item.key,JSON.stringify(parts));continue;}
  if(item.key==='brak'){
    if(parts.length!==4)throw Error('Brak must have four complete views');
    const target=blank(192,192);
    for(const b of parts){const col=Math.round((b.x+b.width/2)/source.width*2-.5),row=Math.round((b.y+b.height/2)/source.height*2-.5);
      fit(target,source,b,col*96,row*96,96,96,90,6);}
    write('brak-v1.png',target);continue;
  }
  if(parts.length!==7)throw Error(item.key+' must have six separate monsters and one entrance; found '+parts.length);
  const gate=parts.reduce((a,b)=>a.y+a.height/2>b.y+b.height/2?a:b),monsters=parts.filter(p=>p!==gate);
  const target=blank(384,256),occupied=new Set();
  for(const b of monsters){
    const col=Math.max(0,Math.min(2,Math.floor((b.x+b.width/2)/source.width*3)));
    const row=b.y+b.height/2<source.height/3?0:1,slot=row*3+col;
    if(occupied.has(slot))throw Error('Duplicate atlas cell '+item.key+' '+slot);occupied.add(slot);
    fit(target,source,b,col*128,row*128,128,128,118);
  }
  write(item.key+'-v1.png',target);
  const gateImage=blank(320,256);fit(gateImage,source,gate,0,0,320,256,246,10);write(item.key+'-gate-v1.png',gateImage);
  const icon=blank(128,128);fit(icon,source,gate,0,0,128,128,120,8);write(item.key+'-icon-v1.png',icon);
}
if(!process.argv.includes('--inspect')){
  const icon=blank(128,128),left=decodePNG(fs.readFileSync('assets/hunting/cave-v1.png')),
    right=decodePNG(fs.readFileSync(out+'/mine-gate-v1.png'));
  fit(icon,left,alphaBounds(left),7,12,64,103,98,2);fit(icon,right,alphaBounds(right),56,12,64,103,98,2);
  write('crossroads-icon-v1.png',icon);
  console.log('Packed',manifest.length,'generated dungeon sheets.');
}
