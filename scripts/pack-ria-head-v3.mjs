// Re-register only Ria's head/hair against the fixed shared collar. The v2
// atlas added legacy neck pixels over the coat; v3 seats the chin lower and
// lets the existing coat form the neckline. Shared parts stay untouched.
import fs from 'node:fs';
import {blank,blitNearest,crop,decodePNG,encodePNG,mainSpriteBounds} from './lib/png.mjs';

const source='assets/player/source/ria-head-v2/turnaround-generated.png';
const output='assets/player/npc-ria-v3';
const raw=decodePNG(fs.readFileSync(source));
const poses={walk:3,chop:2,fish:3};
const heads=[],hairs=[];
const skin=(r,g,b)=>r>=165&&g>=100&&b>=55&&r>g*1.15&&g>b*1.08;
for(let row=0;row<4;row++){
  const from=Math.round(row*raw.height/4),to=Math.round((row+1)*raw.height/4);
  const section=crop(raw,0,from,raw.width,to-from),bounds=mainSpriteBounds(section);
  const height=68,width=Math.round(bounds.width*height/bounds.height);
  if(width<30||width>45)throw Error(`Ria row ${row} width ${width} outside common silhouette`);
  const cell=blank(96,96),head=blank(96,96),hair=blank(96,96);
  blitNearest(cell,crop(section,bounds.x,bounds.y,bounds.width,bounds.height),Math.round(48-width/2),21,width,height);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const p=(y*96+x)*4,[r,g,b,a]=cell.data.subarray(p,p+4);
    if(a<128)continue;
    const brown=r>g+12&&g>b+8&&r<170;
    const tail=y>55&&y<=61&&brown&&(row===3?x>=40&&x<=55:x<44||x>53);
    if(y>55&&!tail)continue;
    const facial=row===0?y>=44&&x>=37&&x<=59:row===1?y>=43&&x>=47:row===2?y>=43&&x<=48:false;
    const target=skin(r,g,b)||facial&&!brown?head:hair;
    cell.data.copy(target.data,p,p,p+4);
  }
  const fittedHead=blank(96,96),fittedHair=blank(96,96);
  // Keep v2's scale and horizontal registration; move the whole head/hair
  // unit exactly 4 source pixels toward the fixed (48,54) collar.
  blitNearest(fittedHead,head,2,8,91,84);
  blitNearest(fittedHair,hair,2,8,91,84);
  heads.push(fittedHead);hairs.push(fittedHair);
}
fs.mkdirSync(output,{recursive:true});
for(const [pose,columns] of Object.entries(poses))for(const [name,parts] of [['head',heads],['hair',hairs]]){
  const atlas=blank(columns*96,384);
  for(let row=0;row<4;row++)for(let frame=0;frame<columns;frame++)
    blitNearest(atlas,parts[row],frame*96,row*96);
  fs.writeFileSync(`${output}/${pose}-${name}.png`,encodePNG(atlas));
}
console.log('Packed Ria v3 with chin seated at shared collar and no legacy neck bridge');
