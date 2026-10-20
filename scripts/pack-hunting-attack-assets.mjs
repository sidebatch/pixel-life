import fs from 'node:fs';
import {blank,decodePNG,encodePNG,crop,blitNearest} from './lib/png.mjs';
function spriteComponents(image){
  const visited=new Uint8Array(image.width*image.height),parts=[];
  for(let start=0;start<visited.length;start++){
    if(visited[start]||image.data[start*4+3]<128)continue;
    const queue=[start];visited[start]=1;let x0=image.width,y0=image.height,x1=0,y1=0;
    for(let at=0;at<queue.length;at++){
      const n=queue[at],x=n%image.width,y=Math.floor(n/image.width);
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;if(xx<0||xx>=image.width||yy<0||yy>=image.height)continue;
        const next=yy*image.width+xx;
        if(!visited[next]&&image.data[next*4+3]>=128){visited[next]=1;queue.push(next);}
      }
    }
    if(queue.length>1000)parts.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,pixels:queue.length});
  }
  const largest=parts.sort((a,b)=>b.pixels-a.pixels).slice(0,4).sort((a,b)=>(a.y+a.height/2)-(b.y+b.height/2));
  if(largest.length!==4)throw Error('Expected four disconnected animal views');
  return [largest.slice(0,2),largest.slice(2)].flatMap(row=>row.sort((a,b)=>a.x-b.x));
}
for(const id of ['boar','deer','fox','wolf','bear']){
  const image=decodePNG(fs.readFileSync(`assets/hunting/source/${id}-attack-v1.png`));
  const frames=spriteComponents(image).map((b,i)=>{
    if(b.x<2||b.y<2||b.x+b.width>=image.width-2||b.y+b.height>=image.height-2)throw Error(`${id}/${i}: clipped attack frame`);
    return crop(image,b.x,b.y,b.width,b.height);
  });
  const scale=Math.min(...frames.flatMap(f=>[84/f.width,84/f.height])),atlas=blank(192,192);
  frames.forEach((frame,i)=>{
    const w=Math.round(frame.width*scale),h=Math.round(frame.height*scale);
    blitNearest(atlas,frame,(i%2)*96+Math.round((96-w)/2),Math.floor(i/2)*96+90-h,w,h);
  });
  fs.writeFileSync(`assets/hunting/${id}-attack-v1.png`,encodePNG(atlas));
}
console.log('Packed five attack atlases: four directions each, 96px cells, original images preserved.');
