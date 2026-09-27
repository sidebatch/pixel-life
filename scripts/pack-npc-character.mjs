// Approved NPC-like anatomy, generated pose art and deterministic layer packing.
// Original rig-v1/polish-v1 and temporary art stay untouched.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {blank,crop,alphaBounds,blitNearest,decodePNG,encodePNG,mainSpriteBounds} from './lib/png.mjs';
const source='assets/player/source/npc-body-v1',output='assets/player/npc-v1';
const read=file=>decodePNG(fs.readFileSync(file));
const write=(file,image)=>{fs.mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});fs.writeFileSync(file,encodePNG(image));};
const faces=['down','right','left','up'],poses={walk:3,chop:2,fish:3};
function components(image,count){
  const seen=new Uint8Array(image.width*image.height),found=[];
  for(let start=0;start<seen.length;start++){
    if(seen[start]||image.data[start*4+3]<128)continue;
    const queue=[start];seen[start]=1;let x0=image.width,y0=image.height,x1=0,y1=0;
    for(let q=0;q<queue.length;q++){
      const n=queue[q],x=n%image.width,y=Math.floor(n/image.width);
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy,next=yy*image.width+xx;
        if(xx<0||yy<0||xx>=image.width||yy>=image.height||seen[next]||image.data[next*4+3]<128)continue;
        seen[next]=1;queue.push(next);
      }
    }
    if(queue.length>1500)found.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,pixels:queue.length});
  }
  assert.equal(found.length,count,'Expected complete disconnected pose sprites');
  found.sort((a,b)=>(a.y+a.height/2)-(b.y+b.height/2));
  return found;
}
function grid(image,col,row,cols,rows){
  const x=Math.round(col*image.width/cols),y=Math.round(row*image.height/rows);
  return crop(image,x,y,Math.round((col+1)*image.width/cols)-x,Math.round((row+1)*image.height/rows)-y);
}
const skin=(r,g,b)=>r>=165&&g>=100&&b>=55&&r>g*1.15&&g>b*1.08;
function heads(sex){
  const sheet=read(`${source}/${sex}-idle-review.png`),result=[];
  for(let face=0;face<4;face++){
    const art=crop(sheet,0,face*96,96,96),head=blank(96,96),hair=blank(96,96);
    for(let y=0;y<96;y++)for(let x=0;x<96;x++){
      const p=(y*96+x)*4,[r,g,b,a]=art.data.subarray(p,p+4);if(!a)continue;
      // Authored hair-tail areas: include ponytail, not the pack/clothes below it.
      const tail=sex==='female'&&y>55&&y<=60&&(face===1?x<42:face===2?x>55:face===3?x>=42&&x<=54:false)&&r>g+12&&g>b+8;
      if(y>55&&!tail)continue;
      const facial=face===0?y>=45&&x>=36&&x<=60:face===1?y>=43&&x>=47:face===2?y>=43&&x<=48:false;
      const owner=skin(r,g,b)||facial?head:hair;
      art.data.copy(owner.data,p,p,p+4);
    }
    result.push({head,hair});
  }
  return result;
}
const canonical={male:heads('male'),female:heads('female')};
function pack(art,face,pose,frame){
  if(face===0)return blank(96,96);
  const b=mainSpriteBounds(art),side=face===1||face===2,scale=Math.min((side?15:26)/b.width,23/b.height);
  const width=Math.round(b.width*scale),height=Math.round(b.height*scale),out=blank(96,96);
  const [dx,dy]=pose==='chop'?(frame===0?[-1,-1]:[3,-1]):pose==='walk'?(frame===1?[1,-1]:frame===2?[-1,0]:[0,0]):frame===0?[-1,-1]:[0,0];
  // Attach the pack's inner edge to the back of the new leaning torso.
  // Old negative impact offsets made it touch hair but float off the shoulder.
  const left=side?46+dx-width:Math.round(48-width/2),x=face===2?96-left-width:left;
  blitNearest(out,crop(art,b.x,b.y,b.width,b.height),x,55+dy,width,height);return out;
}
const packSources={traveler:read('assets/player/source/polish-v1/backpack-generated.png'),ranger:read('assets/player/source/temporary-appearance/ranger-generated.png'),berry:read('assets/player/source/temporary-appearance/berry-generated.png')};
function wardrobe(mask,old){
  const clean={...old,data:Buffer.from(old.data)};
  for(let y=0;y<54;y++)for(let x=0;x<96;x++)clean.data[(y*96+x)*4+3]=0;
  const b=alphaBounds(clean),m=alphaBounds(mask),paint=blank(96,96),out=blank(96,96);
  blitNearest(paint,crop(clean,b.x,b.y,b.width,b.height),m.x,m.y,m.width,m.height);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const p=(y*96+x)*4;if(!mask.data[p+3])continue;let q=p;
    if(!paint.data[p+3]){
      let distance=Infinity;
      for(let yy=m.y;yy<m.y+m.height;yy++)for(let xx=m.x;xx<m.x+m.width;xx++){
        const n=(yy*96+xx)*4,d=(xx-x)**2+(yy-y)**2;
        if(paint.data[n+3]&&d<distance){q=n;distance=d;}
      }
    }
    paint.data.copy(out.data,p,q,q+4);
  }
  return out;
}
const originalRig=JSON.parse(fs.readFileSync('assets/player/rig-v1/manifest.json','utf8')).rig;
const rig={...originalRig,version:2,anatomy:'npc-v1',neck:[48,54],poses:{}};
const manifest={version:1,cell:96,feet:[48,88],neck:[48,54],bodyNeckToFeet:37,head:'approved-single-master',poses:[],files:[],sourceFrames:[]};
for(const [pose,columns] of Object.entries(poses)){
  const raw=read(`${source}/motion/${pose}-generated.png`),bounds=components(raw,columns*4);
  const atlas=Object.fromEntries(['body','outfit','grip','head','hair','female-head','female-hair','backpack','ranger','berry','ember','meadow'].map(part=>[part,blank(columns*96,384)]));
  const oldWardrobe=Object.fromEntries(['ember','meadow'].map(name=>[name,read(`assets/player/temporary-appearance/${name}-${pose}.png`)]));
  const frames={};
  for(let row=0;row<4;row++){
    frames[faces[row]]=[];
    const sorted=bounds.slice(row*columns,row*columns+columns).sort((a,b)=>a.x-b.x);
    for(let f=0;f<columns;f++){
      const b=sorted[f],art=crop(raw,b.x,b.y,b.width,b.height),frame=blank(96,96);
      // Hand raised above the collar must not shrink the torso. These neck
      // offsets were authored against the generated ready-pose source pixels.
      const neckOffset=pose==='chop'&&f===0?[.108,.142,.108,.139][row]*b.height:0;
      const scale=36/(b.height-1-neckOffset),w=Math.round(b.width*scale),h=Math.round(b.height*scale);
      // Centre on the actual boot mass, not a raised/extended hand's bounds.
      let sx=0,count=0;
      for(let y=Math.floor(art.height*.85);y<art.height;y++)for(let x=0;x<art.width;x++)if(art.data[(y*art.width+x)*4+3]>=128){sx+=x;count++;}
      const centre=sx/count,dx=Math.round(48-centre*scale),dy=89-h;
      assert(w<80&&h<80,'Pose inside cell');
      blitNearest(frame,art,dx,dy,w,h);
      const body=blank(96,96),outfit=blank(96,96),grip=blank(96,96);
      const handCandidates=[];
      for(let y=0;y<96;y++)for(let x=0;x<96;x++){
        const p=(y*96+x)*4,[r,g,blue,a]=frame.data.subarray(p,p+4);if(!a)continue;
        const isSkin=skin(r,g,blue),neck=x>=43&&x<=54&&y<=59;
        if(isSkin){frame.data.copy(body.data,p,p,p+4);if(!neck)handCandidates.push([x,y]);}
        else{
          frame.data.copy(outfit.data,p,p,p+4);
          body.data[p]=190;body.data[p+1]=169;body.data[p+2]=133;body.data[p+3]=255;
        }
      }
      let hand;
      if(pose==='walk'){
        const candidates=handCandidates.filter(([x])=>row===0?x<43:row===3?x>53:true);
        const selected=candidates.length?candidates:handCandidates;
        hand=[Math.round(selected.reduce((n,p)=>n+p[0],0)/selected.length),Math.round(selected.reduce((n,p)=>n+p[1],0)/selected.length)];
        if(row===2)hand=[hand[0]-5,hand[1]-2];
      }else if(f===0&&pose==='chop'){
        const highest=Math.min(...handCandidates.map(p=>p[1]));
        const selected=handCandidates.filter(p=>p[1]<=highest+6);
        hand=[Math.round(selected.reduce((n,p)=>n+p[0],0)/selected.length),Math.round(selected.reduce((n,p)=>n+p[1],0)/selected.length)];
      }else{
        const selected=handCandidates;
        hand=[Math.round(selected.reduce((n,p)=>n+p[0],0)/selected.length),Math.round(selected.reduce((n,p)=>n+p[1],0)/selected.length)];
      }
      // Back views may have a partly hidden hand; explicit rear-right fallback.
      const gripOccluded=handCandidates.length===0&&row===3;
      if(!hand.every(Number.isFinite))hand=row===3?[57,58]:[48,70];
      if(handCandidates.length&&!(pose==='walk'&&row===2)){
        const rightHand=pose!=='walk'&&row===0?handCandidates.filter(p=>p[0]<=48):handCandidates;
        const candidates=rightHand.length?rightHand:handCandidates;
        hand=candidates.reduce((best,p)=>(p[0]-hand[0])**2+(p[1]-hand[1])**2<(best[0]-hand[0])**2+(best[1]-hand[1])**2?p:best,candidates[0]);
      }
      for(let y=hand[1]-5;y<=hand[1]+5;y++)for(let x=hand[0]-6;x<=hand[0]+6;x++){
        if(x<0||y<0||x>=96||y>=96)continue;
        const p=(y*96+x)*4;if(body.data[p+3]&&skin(...body.data.subarray(p,p+3)))body.data.copy(grip.data,p,p,p+4);
      }
      blitNearest(atlas.body,body,f*96,row*96);blitNearest(atlas.outfit,outfit,f*96,row*96);blitNearest(atlas.grip,grip,f*96,row*96);
      for(const sex of ['male','female'])for(const part of ['head','hair'])blitNearest(atlas[sex==='male'?part:'female-'+part],canonical[sex][row][part],f*96,row*96);
      for(const name of ['traveler','ranger','berry']){
        const view=[3,1,2,0][row],bag=pack(grid(packSources[name],view%2,Math.floor(view/2),2,2),row,pose,f);
        blitNearest(atlas[name==='traveler'?'backpack':name],bag,f*96,row*96);
      }
      for(const name of ['ember','meadow'])blitNearest(atlas[name],wardrobe(outfit,crop(oldWardrobe[name],f*96,row*96,96,96)),f*96,row*96);
      const old=originalRig.poses[pose].frames[faces[row]][f];
      frames[faces[row]].push({...old,grip:hand,gripOccluded,...(old.headMotion?{headMotion:{...old.headMotion,pivot:[48,54]}}:{})});
      manifest.sourceFrames.push({pose,face:faces[row],frame:f,source:b,neckOffset,scale,placement:[dx,dy],hand});
    }
  }
  // One side-body anatomy, mirrored consistently. The anatomical right hand
  // is on the far side when facing left; do not mirror its handedness.
  for(let f=0;f<columns;f++){
    for(const part of ['body','outfit','grip','ember','meadow']){
      const image=atlas[part];
      for(let y=0;y<96;y++)for(let x=0;x<96;x++){
        const from=((96+y)*image.width+f*96+95-x)*4,to=((192+y)*image.width+f*96+x)*4;
        image.data.copy(image.data,to,from,from+4);
      }
    }
    const right=frames.right[f],offset=pose==='walk'?[-8,-3]:[0,0];
    frames.left[f]={...frames.left[f],grip:[95-right.grip[0]+offset[0],right.grip[1]+offset[1]],angle:Math.PI-right.angle,toolBehind:true};
    const record=manifest.sourceFrames.find(entry=>entry.pose===pose&&entry.face==='left'&&entry.frame===f);
    Object.assign(record,{hand:frames.left[f].grip,packedFrom:{face:'right',mirror:true},leftSourceKeptForReferenceOnly:true});
    if(pose==='walk'){
      // The right hand is naturally hidden behind the torso in a left profile.
      const image=atlas.grip;
      for(let y=0;y<96;y++)image.data.fill(0,((192+y)*image.width+f*96)*4,((192+y)*image.width+f*96+96)*4);
    }
  }
  rig.poses[pose]={columns,frames};
  for(const [part,image] of Object.entries(atlas)){
    const file=`${output}/${pose}-${part}.png`;write(file,image);manifest.files.push(file);
  }
  manifest.poses.push({pose,columns});
}
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(output+'/rig.json',JSON.stringify(rig,null,2)+'\n');
fs.writeFileSync(output+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync('src/data/character-rig-data.js',`// Generated by scripts/pack-npc-character.mjs. Source rig-v1 preserved.\nconst CHARACTER_RIG=Object.freeze(${JSON.stringify(rig,null,2)});\n`);
console.log('NPC body packed: 32 shared poses, male/female canonical heads, 3 outfits and 3 complete packs. Existing tool art/IDs/progression preserved.');
