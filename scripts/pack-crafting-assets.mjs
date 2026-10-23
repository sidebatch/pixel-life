import fs from 'node:fs';
import {blank,decodePNG,encodePNG,crop,alphaBounds,blitNearest} from './lib/png.mjs';
const manifest=JSON.parse(fs.readFileSync('docs/art/crafting-prompts-v1.json','utf8'));
const source=key=>decodePNG(fs.readFileSync(manifest.find(item=>item.key===key).source));
function fit(image,cell=96,margin=7,foot=null){
  const b=alphaBounds(image),sprite=crop(image,b.x,b.y,b.width,b.height),scale=Math.min((cell-margin*2)/b.width,(cell-margin*2)/b.height);
  const target=blank(cell,cell),w=Math.round(b.width*scale),h=Math.round(b.height*scale);
  blitNearest(target,sprite,Math.round((cell-w)/2),foot===null?Math.round((cell-h)/2):foot-h,w,h);return target;
}
fs.mkdirSync('assets/crafting',{recursive:true});
const items=source('craftItemsClean');
for(const [i,name]of ['workbench','normal-leather','sturdy-leather','brak-tusk'].entries()){
  const tile=crop(items,i%2*items.width/2,Math.floor(i/2)*items.height/2,items.width/2,items.height/2);
  fs.writeFileSync(`assets/crafting/${name}-v1.png`,encodePNG(fit(tile)));
}
fs.writeFileSync('assets/crafting/iron-sword-v1.png',encodePNG(fit(source('ironSword'),96,10)));
const attack=source('brakAttack'),seen=new Uint8Array(attack.width*attack.height),parts=[];
for(let start=0;start<seen.length;start++){
  if(seen[start]||attack.data[start*4+3]<128)continue;
  const queue=[start];seen[start]=1;let x0=attack.width,y0=attack.height,x1=0,y1=0;
  for(let q=0;q<queue.length;q++){
    const n=queue[q],x=n%attack.width,y=Math.floor(n/attack.width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=attack.width||yy>=attack.height)continue;
      const next=yy*attack.width+xx;if(!seen[next]&&attack.data[next*4+3]>=128){seen[next]=1;queue.push(next);}
    }
  }
  if(queue.length>500)parts.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1});
}
if(parts.length!==4)throw Error('Expected four separated Brak poses, got '+parts.length);
const sheet=blank(192,192),slots=new Set();
for(const b of parts){const col=Math.round((b.x+b.width/2)/attack.width*2-.5),row=Math.round((b.y+b.height/2)/attack.height*2-.5),slot=row*2+col;
  if(slots.has(slot))throw Error('Duplicate Brak pose');slots.add(slot);
  blitNearest(sheet,fit(crop(attack,b.x,b.y,b.width,b.height),96,6,90),col*96,row*96);
}
fs.writeFileSync('assets/hunting/brak-attack-v1.png',encodePNG(sheet));
console.log('Packed four crafting icons, iron sword and four Brak attack directions.');
