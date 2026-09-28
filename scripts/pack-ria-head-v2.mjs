// Pack the generated Ria turnaround into head/hair layers without modifying
// the shared body, outfit, grip, rig or the protected npc-v1 source sprites.
import fs from 'node:fs';
import {blank,blitNearest,crop,decodePNG,encodePNG,mainSpriteBounds} from './lib/png.mjs';

const source='assets/player/source/ria-head-v2';
const output='assets/player/npc-ria-v2';
const raw=decodePNG(fs.readFileSync(`${source}/turnaround-generated.png`));
const faces=['down','right','left','up'];
const poses={walk:3,chop:2,fish:3};
const registered=blank(96,384);
const heads=[],hairs=[];
const skin=(r,g,b)=>r>=165&&g>=100&&b>=55&&r>g*1.15&&g>b*1.08;
const oldHeadAtlas=decodePNG(fs.readFileSync('assets/player/npc-v1/walk-female-head.png'));
const commonBodyAtlas=decodePNG(fs.readFileSync('assets/player/npc-v1/walk-body.png'));

for(let row=0;row<4;row++){
  const from=Math.round(row*raw.height/4),to=Math.round((row+1)*raw.height/4);
  const section=crop(raw,0,from,raw.width,to-from),bounds=mainSpriteBounds(section);
  const height=68,width=Math.round(bounds.width*height/bounds.height);
  if(width<30||width>45)throw Error(`Ria ${faces[row]} width ${width} is outside the common silhouette`);
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
  blitNearest(registered,cell,0,row*96);
  // The generated face was still too tall at native size (hair 41px against
  // a 36px body). Shrink both parts by the SAME fixed transform around the
  // common neck so facial features stay registered and the collar overlaps.
  const fittedHead=blank(96,96),fittedHair=blank(96,96);
  blitNearest(fittedHead,head,2,4,91,84);
  blitNearest(fittedHair,hair,2,4,91,84);
  // The AI-derived face has a nicer silhouette but its chin stops short of
  // the shared body's native neck. Keep the proven skin bridge from Ria's
  // previous registered head; only the central collar-overlap pixels apply.
  for(let y=52;y<=56;y++)for(let x=42;x<=54;x++){
    const p=(y*96+x)*4,old=((row*96+y)*oldHeadAtlas.width+x)*4;
    const body=((row*96+y)*commonBodyAtlas.width+x)*4;
    if(oldHeadAtlas.data[old+3]<128||commonBodyAtlas.data[body+3]<128)continue;
    if(fittedHead.data[p+3]<128)oldHeadAtlas.data.copy(fittedHead.data,p,old,old+4);
  }
  heads.push(fittedHead);hairs.push(fittedHair);
}

fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(`${source}/normalized-source-turnaround.png`,encodePNG(registered));
for(const [pose,columns] of Object.entries(poses))for(const [name,parts] of [['head',heads],['hair',hairs]]){
  const atlas=blank(columns*96,384);
  for(let row=0;row<4;row++)for(let frame=0;frame<columns;frame++)
    blitNearest(atlas,parts[row],frame*96,row*96);
  fs.writeFileSync(`${output}/${pose}-${name}.png`,encodePNG(atlas));
}
console.log('Packed Ria head/hair into shared 96px, 4-direction, 32-pose standard');
