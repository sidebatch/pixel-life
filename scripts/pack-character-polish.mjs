// Versioned replacement art. Never changes the original rig or tool transforms.
import fs from 'node:fs';
import {blank,crop,alphaBounds,mainSpriteBounds,blitNearest,decodePNG,encodePNG} from './lib/png.mjs';
import {attachedPack} from './lib/character-attachments.mjs';
const source='assets/player/source/polish-v1',output='assets/player/polish-v1';
const read=file=>decodePNG(fs.readFileSync(file));
const write=(file,image)=>{fs.mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});fs.writeFileSync(file,encodePNG(image));};
const poses={walk:{columns:3,offset:0},chop:{columns:2,offset:3},fish:{columns:3,offset:5}};
function mainOnly(image){
  const seen=new Uint8Array(image.width*image.height);let main=[];
  for(let start=0;start<seen.length;start++){
    if(seen[start]||image.data[start*4+3]<128)continue;
    const queue=[start];seen[start]=1;
    for(let q=0;q<queue.length;q++){
      const point=queue[q],x=point%image.width,y=Math.floor(point/image.width);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy,next=ny*image.width+nx;
        if(nx<0||ny<0||nx>=image.width||ny>=image.height||seen[next]||image.data[next*4+3]<128)continue;
        seen[next]=1;queue.push(next);
      }
    }
    if(queue.length>main.length)main=queue;
  }
  const result=blank(image.width,image.height);
  for(const point of main)image.data.copy(result.data,point*4,point*4,point*4+4);
  return result;
}
function grid(image,col,row,cols,rows){
  const x=Math.round(col*image.width/cols),y=Math.round(row*image.height/rows);
  return crop(image,x,y,Math.round((col+1)*image.width/cols)-x,Math.round((row+1)*image.height/rows)-y);
}
function fit(art,bounds){
  const clean=mainOnly(art),b=alphaBounds(clean),result=blank(96,96);
  blitNearest(result,crop(clean,b.x,b.y,b.width,b.height),bounds.x,bounds.y,bounds.width,bounds.height);
  return result;
}
function anatomicalGarment(art,mask){
  const bounds=alphaBounds(mask),paint=fit(art,bounds),result=blank(96,96);
  // The authored body contour is the common wardrobe template. Never leave
  // a hole at the collar just because a separately fitted source has padding.
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const p=(y*96+x)*4;if(!mask.data[p+3])continue;
    let source=p;
    if(!paint.data[p+3]){
      let distance=Infinity;
      for(let yy=bounds.y;yy<bounds.y+bounds.height;yy++)for(let xx=bounds.x;xx<bounds.x+bounds.width;xx++){
        const q=(yy*96+xx)*4,d=(xx-x)**2+(yy-y)**2;
        if(paint.data[q+3]&&d<distance){source=q;distance=d;}
      }
    }
    paint.data.copy(result.data,p,source,source+4);
  }
  return result;
}
// A single assembled head is registered ONCE. Head and Hair are a partition
// of those same pixels, not independently stretched bald/hair silhouettes.
function registeredHead(art,face){
  const clean=mainOnly(art),b=alphaBounds(clean),master=blank(96,96);
  const height=face===3?34:36,scale=Math.min(39/b.width,height/b.height);
  const width=Math.round(b.width*scale),h=Math.round(b.height*scale);
  blitNearest(master,crop(clean,b.x,b.y,b.width,b.height),Math.round(48-width/2),64-h,width,h);
  const head=blank(96,96),hair=blank(96,96),bounds=alphaBounds(master);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const p=(y*96+x)*4,[r,g,blue,a]=master.data.subarray(p,p+4);
    if(!a)continue;
    const nx=(x-bounds.x)/bounds.width,ny=(y-bounds.y)/bounds.height;
    const skin=r>=190&&g>=125&&blue>=80&&r>g*1.12&&g>blue*1.08;
    // Eyes, mouth, ear shadows and facial outlines belong to Head, even
    // though their dark colours also occur in the hair. Authored face zones
    // are in the unified master's coordinates, never a separate fit.
    const faceZone=face===0?ny>.72&&nx>.23&&nx<.77:
      face===1?ny>.65&&nx>.57:face===2?ny>.65&&nx<.43:false;
    const ears=ny>.72&&ny<.93&&(face===0?(nx<.25||nx>.75):
      face===1?(nx>.37&&nx<.57):face===2?(nx>.43&&nx<.63):(nx<.25||nx>.75));
    const owner=skin||faceZone||ears||ny>.94?head:hair;
    master.data.copy(owner.data,p,p,p+4);
  }
  return {head,hair,master};
}
function icon(image){
  const b=alphaBounds(image),result=blank(96,96),scale=88/Math.max(b.width,b.height);
  const w=Math.round(b.width*scale),h=Math.round(b.height*scale);
  blitNearest(result,crop(image,b.x,b.y,b.width,b.height),Math.round((96-w)/2),Math.round((96-h)/2),w,h);return result;
}
if(process.argv.includes('--references')){
  const heads=blank(384,192);
  for(const [r,part] of ['head','hair'].entries())for(let face=0;face<4;face++)
    blitNearest(heads,crop(read('assets/player/rig-v1/walk-'+part+'.png'),0,face*96,96,96),face*96,r*96);
  const large=blank(1536,768);blitNearest(large,heads,0,0,1536,768);write(source+'/head-hair-reference.png',large);
  console.log('Four direction columns down/right/left/up; head row then hair row.');
}else{
  const heads=read(source+'/head-registered-generated.png'),outfits=read(source+'/outfit-generated.png'),bags=read(source+'/backpack-generated.png');
  const canonical=[];
  for(let face=0;face<4;face++){
    const pair=registeredHead(grid(heads,face%2,Math.floor(face/2),2,2),face);
    canonical.push(pair);
  }
  const reference=blank(96,384);
  canonical.forEach((pair,face)=>blitNearest(reference,pair.master,0,face*96));
  write(output+'/head-registration.png',reference);
  const manifest={cell:96,feet:[48,88],renderSize:100,rigUnchanged:true,headRegistration:'single-uniform-master',attachmentMode:'full-pack-anatomical-outfit',headMaxSize:[39,36],frames:32,files:[output+'/head-registration.png'],canonicalHeads:canonical.map(pair=>Object.fromEntries(['head','hair'].map(part=>[part,alphaBounds(pair[part])])))};
  for(const [pose,{columns,offset}] of Object.entries(poses)){
    const original=Object.fromEntries(['body','head','hair','outfit','backpack','grip'].map(part=>[part,read('assets/player/rig-v1/'+pose+'-'+part+'.png')]));
    const atlas=Object.fromEntries(['body','head','hair','outfit','backpack'].map(part=>[part,blank(columns*96,384)]));
    for(let face=0;face<4;face++)for(let frame=0;frame<columns;frame++){
      const base=Object.fromEntries(Object.entries(original).map(([part,image])=>[part,crop(image,frame*96,face*96,96,96)]));
      // The old Body contains tiny classifier remnants above the neck.
      // They must not peek out behind the new registered head when it tilts.
      const body={...base.body,data:Buffer.from(base.body.data)};
      for(let y=0;y<54;y++)for(let x=0;x<96;x++)body.data.fill(0,(y*96+x)*4,(y*96+x)*4+4);
      // Fill the hidden neck from the existing skin artwork, not a separate
      // moving cutout. It spans the shared neck pivot in both chopping poses.
      const skin=canonical[face].head;
      let colour=skin.data.subarray((62*96+48)*4,(62*96+48)*4+4);
      if(!colour[3])for(let y=63;y>=57;y--)for(let x=46;x<=50;x++){
        const p=(y*96+x)*4;
        if(skin.data[p+3]&&skin.data[p]>190&&skin.data[p+1]>125)colour=skin.data.subarray(p,p+4);
      }
      for(let y=59;y<=67;y++)for(let x=44;x<=52;x++){
        const p=(y*96+x)*4;if(!body.data[p+3])colour.copy(body.data,p);
      }
      blitNearest(atlas.body,body,frame*96,face*96);
      // Head dimensions are canonical in every pose. Small authored placement
      // deltas follow the original skull, never rescale at the impact frame.
      const first=mainSpriteBounds(crop(read('assets/player/rig-v1/walk-head.png'),0,face*96,96,96)),now=mainSpriteBounds(base.head);
      const dx=Math.round(now.x+now.width/2-first.x-first.width/2),dy=Math.round(now.y+now.height-first.y-first.height);
      for(const part of ['head','hair'])blitNearest(atlas[part],canonical[face][part],frame*96+dx,face*96+dy);
      // Only anatomical garment region: discard old classifier's stray hair
      // outline pixels above the neck instead of carrying them into new art.
      const mask={...base.outfit,data:Buffer.from(base.outfit.data)};
      for(let y=0;y<54;y++)for(let x=0;x<96;x++)mask.data[(y*96+x)*4+3]=0;
      const outfit=anatomicalGarment(grid(outfits,offset+frame,face,8,4),mask);
      // Exposed original skin and final gripping hands retain exact positions.
      for(let p=0;p<outfit.data.length;p+=4){
        const exposed=base.body.data[p+3]&&!base.outfit.data[p+3]&&!base.backpack.data[p+3]&&!base.head.data[p+3]&&!base.hair.data[p+3];
        if(base.grip.data[p+3]||exposed)outfit.data.fill(0,p,p+4);
      }
      blitNearest(atlas.outfit,outfit,frame*96,face*96);
      const view=[3,1,2,0][face],pack=attachedPack(grid(bags,view%2,Math.floor(view/2),2,2),face,pose,frame);
      blitNearest(atlas.backpack,pack,frame*96,face*96);
    }
    for(const [part,image] of Object.entries(atlas)){
      const file=output+'/'+pose+'-'+part+'.png';write(file,image);manifest.files.push(file);
      if(pose==='walk'&&(part==='outfit'||part==='backpack')){
        const file=output+'/'+part+'-icon.png';write(file,icon(crop(image,0,part==='backpack'?288:0,96,96)));manifest.files.push(file);
      }
    }
  }
  fs.writeFileSync(output+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
  console.log('Packed registered head/hair and clean body/outfit/backpack for 32 poses; original grip/tools/rig preserved.');
}
