// AI paints new designs; deterministic packing preserves the existing rig.
import fs from 'node:fs';
import path from 'node:path';
import {blank,crop,alphaBounds,mainSpriteBounds,blitNearest,decodePNG,encodePNG} from './lib/png.mjs';
const source='assets/player/source/temporary-appearance';
const output='assets/player/temporary-appearance';
const poses={walk:{columns:3,offset:0},chop:{columns:2,offset:3},fish:{columns:3,offset:5}};
const designs={ember:{type:'outfit'},meadow:{type:'outfit'},ranger:{type:'backpack'},berry:{type:'backpack'}};
const read=file=>decodePNG(fs.readFileSync(file));
const write=(file,image)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,encodePNG(image));};
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
  const keep=new Set(main),out=blank(image.width,image.height);
  for(const point of keep)image.data.copy(out.data,point*4,point*4,point*4+4);
  return out;
}
if(process.argv.includes('--references')){
  for(const type of ['outfit','backpack']){
    const atlas=blank(768,384);
    for(const [pose,{columns,offset}] of Object.entries(poses)){
      const original=read('assets/player/rig-v1/'+pose+'-'+type+'.png');
      for(let row=0;row<4;row++)for(let frame=0;frame<columns;frame++)
        blitNearest(atlas,mainOnly(crop(original,frame*96,row*96,96,96)),(offset+frame)*96,row*96);
    }
    const enlarged=blank(1536,768);blitNearest(enlarged,atlas,0,0,1536,768);
    write(source+'/'+type+'-reference.png',enlarged);
  }
  console.log('Prepared 8×4 pose references: walk3 / chop2 / fish3; down/right/left/up.');
}else{
  const report={cell:96,designs:{}};
  for(const [name,{type}] of Object.entries(designs)){
    const generated=read(source+'/'+name+'-generated.png');
    const stats={type,frames:0,files:[]};
    for(const [pose,{columns,offset}] of Object.entries(poses)){
      const original=read('assets/player/rig-v1/'+pose+'-'+type+'.png');
      const atlas=blank(columns*96,384);
      for(let row=0;row<4;row++)for(let frame=0;frame<columns;frame++){
        const base=crop(original,frame*96,row*96,96,96),main=mainOnly(base);
        if(!main.data.some((alpha,index)=>index%4===3&&alpha>=128)){
          // The backpack is fully occluded in some front-facing poses.
          stats.frames++;continue;
        }
        const bounds=alphaBounds(main);
        const view=type==='backpack'?[3,1,2,0][row]:null;
        const count=type==='backpack'?2:8,rows=type==='backpack'?2:4;
        const column=type==='backpack'?view%2:offset+frame,sourceRow=type==='backpack'?Math.floor(view/2):row;
        const x=Math.round(column*generated.width/count),y=Math.round(sourceRow*generated.height/rows);
        const tile=crop(generated,x,y,Math.round((column+1)*generated.width/count)-x,Math.round((sourceRow+1)*generated.height/rows)-y);
        const art=mainOnly(tile),b=mainSpriteBounds(art),packed=blank(96,96);
        blitNearest(packed,crop(art,b.x,b.y,b.width,b.height),bounds.x,bounds.y,bounds.width,bounds.height);
        // Preserve hand/body exposure exactly for clothes, and front/side pack
        // occlusion. Back view may retain a new bag's rounded/roll-top silhouette.
        for(let point=0;point<96*96;point++){
          if((type==='outfit'||row!==3)&&!main.data[point*4+3])packed.data[point*4+3]=0;
          if(type==='outfit'&&main.data[point*4+3]&&!packed.data[point*4+3])
            base.data.copy(packed.data,point*4,point*4,point*4+4);
          // Tiny original neighboring fragments remain unchanged, never dyed.
          if(type==='outfit'&&base.data[point*4+3]&&!main.data[point*4+3])
            base.data.copy(packed.data,point*4,point*4,point*4+4);
        }
        blitNearest(atlas,packed,frame*96,row*96);
        stats.frames++;
      }
      const file=output+'/'+name+'-'+pose+'.png';write(file,atlas);stats.files.push(file);
      if(pose==='walk'){
        const tile=mainOnly(crop(atlas,0,type==='backpack'?288:0,96,96)),bounds=alphaBounds(tile);
        const icon=blank(96,96),scale=88/Math.max(bounds.width,bounds.height);
        const w=Math.round(bounds.width*scale),h=Math.round(bounds.height*scale);
        blitNearest(icon,crop(tile,bounds.x,bounds.y,bounds.width,bounds.height),Math.round((96-w)/2),Math.round((96-h)/2),w,h);
        write(output+'/'+name+'-icon.png',icon);stats.files.push(output+'/'+name+'-icon.png');
      }
    }
    report.designs[name]=stats;
  }
  fs.writeFileSync(output+'/manifest.json',JSON.stringify(report,null,2));
  console.log('Packed four distinct appearance designs, 32 frames each, without changing the rig.');
}
