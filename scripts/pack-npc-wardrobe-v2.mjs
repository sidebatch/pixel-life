// Register new image-generated clothing paint against immutable NPC pose masks.
// No body, head, grip, rig or original wardrobe atlas is overwritten.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {blank,crop,decodePNG,encodePNG,blitNearest} from './lib/png.mjs';
const root='assets/player/source/npc-wardrobe-v2',out='assets/player/npc-wardrobe-v2';
const faces=['down','right','left','up'],poses={walk:3,chop:2,fish:3};
const read=file=>decodePNG(fs.readFileSync(file));
const original=JSON.parse(fs.readFileSync('assets/player/npc-v1/manifest.json','utf8'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const protectedFiles=Object.fromEntries(fs.readdirSync('assets/player/npc-v1').map(name=>['assets/player/npc-v1/'+name,sha('assets/player/npc-v1/'+name)]));
protectedFiles['src/data/character-rig-data.js']=sha('src/data/character-rig-data.js');
const skin=(r,g,b)=>r>185&&g>110&&b>90&&r>g*1.15&&g>b*1.08&&b/g>.62;
function components(image,count){
  const seen=new Uint8Array(image.width*image.height),found=[];
  for(let start=0;start<seen.length;start++){
    if(seen[start]||image.data[start*4+3]<128)continue;
    const queue=[start];seen[start]=1;let x0=image.width,y0=image.height,x1=0,y1=0;
    for(let i=0;i<queue.length;i++){
      const n=queue[i],x=n%image.width,y=Math.floor(n/image.width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy,next=yy*image.width+xx;
        if(xx<0||xx>=image.width||yy<0||yy>=image.height||seen[next]||image.data[next*4+3]<128)continue;
        seen[next]=1;queue.push(next);
      }
    }
    if(queue.length>1500)found.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,pixels:queue.length});
  }
  assert.equal(found.length,count,'Generated edit must retain every complete pose');
  return found.sort((a,b)=>(a.y+a.height/2)-(b.y+b.height/2));
}
const manifest={version:2,anatomy:'npc-v1',mode:'built-in-imagegen',registration:'native pose-mask, no old short-body textures',protectedFiles,frames:[]};
fs.mkdirSync(out,{recursive:true});
for(const name of ['ember','meadow'])for(const [pose,cols] of Object.entries(poses)){
  const raw=read(`${root}/${name}-${pose}-generated.png`),bounds=components(raw,cols*4);
  const maskAtlas=read(`assets/player/npc-v1/${pose}-outfit.png`),atlas=blank(cols*96,384);
  for(let row=0;row<4;row++){
    if(row===2)continue; // Share authored right anatomy with the existing mirrored left rig.
    const sorted=bounds.slice(row*cols,row*cols+cols).sort((a,b)=>a.x-b.x);
    for(let frame=0;frame<cols;frame++){
      const b=sorted[frame],art=crop(raw,b.x,b.y,b.width,b.height);
      const old=original.sourceFrames.find(r=>r.pose===pose&&r.face===faces[row]&&r.frame===frame);
      const neckOffset=b.height*old.neckOffset/old.source.height,scale=36/(b.height-1-neckOffset);
      let sum=0,total=0;
      for(let y=Math.floor(art.height*.85);y<art.height;y++)for(let x=0;x<art.width;x++)if(art.data[(y*art.width+x)*4+3]>=128){sum+=x;total++;}
      const w=Math.round(art.width*scale),h=Math.round(art.height*scale),paint=blank(96,96);
      blitNearest(paint,art,Math.round(48-sum/total*scale),89-h,w,h);
      // Neck/hand skin only registers the source, never becomes garment paint.
      for(let p=0;p<paint.data.length;p+=4)if(skin(...paint.data.subarray(p,p+3)))paint.data[p+3]=0;
      const mask=crop(maskAtlas,frame*96,row*96,96,96),cell=blank(96,96);
      const centre=image=>{let sum=0,n=0;for(let y=59;y<=62;y++)for(let x=0;x<96;x++)if(image.data[(y*96+x)*4+3]>=128){sum+=x;n++;}return sum/n;};
      const dx=Math.round(centre(mask)-centre(paint));assert(Number.isFinite(dx)&&Math.abs(dx)<=8,'Clothing collar registration drift');
      let repaired=0,maxDistance=0;
      for(let y=0;y<96;y++)for(let x=0;x<96;x++){
        const p=(y*96+x)*4;if(!mask.data[p+3])continue;
        const sx=x-dx;let q=(y*96+sx)*4,dist=0;
        if(sx<0||sx>=96||!paint.data[q+3]){
          dist=Infinity;
          // Local raster registration only, not an old costume's global fill.
          for(let yy=Math.max(0,y-6);yy<=Math.min(95,y+6);yy++)for(let xx=Math.max(0,sx-6);xx<=Math.min(95,sx+6);xx++){
            const candidate=(yy*96+xx)*4,d=(xx-sx)**2+(yy-y)**2;
            if(paint.data[candidate+3]&&d<dist){dist=d;q=candidate;}
          }
          assert(Number.isFinite(dist)&&dist<=36,`Source garment no longer fits pose: ${name}/${pose}/${faces[row]}/${frame} ${x},${y}`);
          repaired++;maxDistance=Math.max(maxDistance,Math.sqrt(dist));
        }
        paint.data.copy(cell.data,p,q,q+3);cell.data[p+3]=mask.data[p+3];
      }
      blitNearest(atlas,cell,frame*96,row*96);
      manifest.frames.push({name,pose,face:faces[row],frame,source:b,neckOffset,scale,collarDx:dx,repaired,maxDistance});
    }
  }
  for(let frame=0;frame<cols;frame++)for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const from=((96+y)*atlas.width+frame*96+95-x)*4,to=((192+y)*atlas.width+frame*96+x)*4;atlas.data.copy(atlas.data,to,from,from+4);
  }
  for(let p=3;p<atlas.data.length;p+=4)assert.equal(atlas.data[p],maskAtlas.data[p],'Wardrobe alpha must not change the common body shape');
  fs.writeFileSync(`${out}/${pose}-${name}.png`,encodePNG(atlas));
}
for(const [file,hash] of Object.entries(protectedFiles))assert.equal(sha(file),hash,'Original pose/part/rig modified');
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log('Wardrobe v2 packed: six atlases, 64 pose cells, exact common alpha, original anatomy/rig/wardrobe preserved.');
