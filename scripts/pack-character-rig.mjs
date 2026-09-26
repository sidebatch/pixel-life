// Production packing only: AI supplies missing body/pose art; this script aligns
// frames, exports transparent layers, and records explicit grip/pivot contracts.
import fs from 'node:fs';
import {blank,crop,alphaBounds,mainSpriteBounds,blitNearest,decodePNG,encodePNG} from './lib/png.mjs';
const cell=96,feet=[48,88],height=68;
const output='assets/player/rig-v1',source='assets/player/source/rig-v1';
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(`${output}/tools`,{recursive:true});
const read=file=>decodePNG(fs.readFileSync(file));
const write=(file,image)=>fs.writeFileSync(file,encodePNG(image));
function sourceFrame(image,column,row,columns){
  const x=Math.round(column*image.width/columns),y=Math.round(row*image.height/4);
  return crop(image,x,y,Math.round((column+1)*image.width/columns)-x,Math.round((row+1)*image.height/4)-y);
}
const inside=(x,y,[rx,ry,rw,rh])=>x>=rx&&x<rx+rw&&y>=ry&&y<ry+rh;
const directions=['down','right','left','up'];
const specs={
  walk:{file:'assets/player/player.png',body:`${source}/walk-body.png`,columns:3,
    hand:[
      [[26,66,14,13],[30,64,12,12],[28,63,14,12]],
      [[37,67,15,14],[42,64,14,14],[32,62,16,14]],
      [],[[55,67,11,13],[55,64,12,16],[53,65,12,15]]
    ],angles:[[-Math.PI+.9,-Math.PI+.95,-Math.PI+.9],[-.6,-.55,-.6],[],[-.79,-.79,-.79]]},
  chop:{file:'assets/forestry/chop/player-v2.png',body:`${source}/chop-body.png`,columns:2,
    // Authored row spans for the impact backpack cap (inclusive x bounds).
    // Its brown pixels overlap the old y<64 hair heuristic. Keep the original
    // outline with the bag when rendering canonical walking head/hair instead.
    backpackTopRows:{1:{1:[
      [54,30,36],[55,28,36],[56,27,35],[57,27,35],
      [58,26,36],[59,25,36],[60,24,34]
    ]}},
    // Keep head dimensions canonical, but follow the torso's wind-up/lean.
    headMotion:[
      [{offset:[0,-1],rotation:-.025},{offset:[0,1],rotation:.025}],
      [{offset:[-1,-1],rotation:-.05},{offset:[2,1],rotation:.05}],
      [],[{offset:[0,-1],rotation:.025},{offset:[0,1],rotation:-.025}]
    ],
    hand:[
      [[26,45,11,15],[40,65,17,16]],[[28,46,12,13],[47,63,17,17]],
      [],[[61,44,13,15],[58,46,13,15]]
    ],angles:[[-2,1.15],[-2,.2],[],[-1.9,-1.6]]},
  fish:{file:`${source}/fish-full.png`,body:`${source}/fish-body.png`,columns:3,
    hand:[
      [[26,43,12,15],[41,63,16,16],[42,57,17,13]],
      [[27,43,14,13],[52,63,20,14],[50,59,20,13]],
      [],[[62,43,12,15],[58,61,10,12],[63,55,13,15]]
    ],angles:[[-2,1.1,-1.4],[-2,-.2,-1.1],[],[-1.8,-1.5,-1.9]]}
};
const rig={version:1,handedness:'right',cell,feet,renderSize:100,poses:{},tools:{}};
const layerNames=['body','head','hair','outfit','backpack','grip'];
const urls={};
function normalize(frame,targetHeight=height,generated=false){
  const b=generated?mainSpriteBounds(frame):alphaBounds(frame),out=blank(cell,cell);
  const w=Math.round(b.width*targetHeight/b.height);
  blitNearest(out,crop(frame,b.x,b.y,b.width,b.height),Math.round(feet[0]-w/2),feet[1]+1-targetHeight,w,targetHeight);
  return out;
}
const skin=(r,g,b)=>r>185&&g>120&&b>75&&r>g+15&&g>b+12;
const brown=(r,g,b)=>r>g+12&&g>b+5&&(r<185||g<r*.66);
const blue=(r,g,b)=>b>r+5&&b>=g;
function neighbors(frame,x,y,predicate){
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const xx=x+ox,yy=y+oy;if(xx<0||yy<0||xx>=cell||yy>=cell)continue;
    const p=(yy*cell+xx)*4;if(frame.data[p+3]&&predicate(...frame.data.subarray(p,p+3)))return true;
  }
  return false;
}
function split(frame,bodyTemplate,handBox,face,backpackTopRows=[]){
  const layers=Object.fromEntries(layerNames.map(name=>[name,blank(cell,cell)]));
  const template=normalize(bodyTemplate,62,true);
  let sx=0,sy=0,count=0;
  const packBox=face==='up'?[33,61,31,23]:face==='right'?[21,60,18,22]:[66,59,9,21];
  for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
    const p=(y*cell+x)*4;if(!frame.data[p+3])continue;
    // Body is complete beneath the original opaque outfit, not just holes cut
    // out of clothes. Clip outer contour to the reference to avoid default leaks.
    const [r,g,b]=frame.data.subarray(p,p+3);
    const isSkin=skin(r,g,b),dark=r<85&&g<85&&b<85;
    const isGrip=inside(x,y,handBox)&&(isSkin||(dark&&neighbors(frame,x,y,skin)));
    const packTop=backpackTopRows.some(([py,left,right])=>y===py&&x>=left&&x<=right);
    const isPack=packTop||(inside(x,y,packBox)&&!blue(r,g,b)&&y>60&&
      (r>g+10&&g>b+10||(dark&&neighbors(frame,x,y,brown))));
    const isHair=y<64&&(brown(r,g,b)||(dark&&y<59&&neighbors(frame,x,y,brown)));
    let layer=isGrip?'grip':isPack?'backpack':isHair?'hair':y<64&&!blue(r,g,b)?'head':isSkin&&y<80?'body':'outfit';
    if(template.data[p+3]){
      const templateLayer=y<62&&['head','hair','grip'].includes(layer)?'head':'body';
      template.data.copy(layers[templateLayer].data,p,p,p+4);
    }
    frame.data.copy(layers[layer].data,p,p,p+4);
    if(isGrip&&isSkin){sx+=x;sy+=y;count++;}
  }
  const grip=count?[Math.round(sx/count),Math.round(sy/count)]:
    [Math.round(handBox[0]+handBox[2]/2),Math.round(handBox[1]+handBox[3]/2)];
  return {layers,grip};
}
for(const [pose,spec] of Object.entries(specs)){
  const full=read(spec.file),body=read(spec.body);
  const atlases=Object.fromEntries(layerNames.map(name=>[name,blank(cell*spec.columns,cell*4)]));
  const reference=blank(cell*spec.columns,cell*4),frames={};
  for(let row=0;row<4;row++){
    frames[directions[row]]=[];
    for(let f=0;f<spec.columns;f++){
      if(row===2){
        // Mirror the body, not its handedness. Facing left puts the right arm
        // on the far side. Two-handed actions keep their shared handle pivot.
        for(const image of [...Object.values(atlases),reference])for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
          const s=((cell+y)*image.width+f*cell+cell-1-x)*4,d=((row*cell+y)*image.width+f*cell+x)*4;
          image.data.copy(image.data,d,s,s+4);
        }
        const right=frames.right[f];
        const farHandOffset=pose==='walk'?[-8,-3]:[0,0];
        frames.left.push({...right,
          grip:[cell-1-right.grip[0]+farHandOffset[0],right.grip[1]+farHandOffset[1]],
          angle:Math.PI-right.angle,toolBehind:true,
          ...(right.headMotion?{headMotion:{...right.headMotion,
            offset:[-right.headMotion.offset[0],right.headMotion.offset[1]],
            rotation:-right.headMotion.rotation}}:{})});
        continue;
      }
      const frame=normalize(sourceFrame(full,f,row,spec.columns),height,pose==='fish');
      const {layers,grip}=split(frame,sourceFrame(body,f,row,spec.columns),spec.hand[row][f],directions[row],
        spec.backpackTopRows?.[row]?.[f]);
      for(const name of layerNames)blitNearest(atlases[name],layers[name],f*cell,row*cell);
      blitNearest(reference,frame,f*cell,row*cell);
      frames[directions[row]].push({grip,angle:spec.angles[row][f],toolBehind:row===3,
        ...(spec.headMotion?{headMotion:{...spec.headMotion[row][f],pivot:[48,63]}}:{})});
    }
  }
  rig.poses[pose]={columns:spec.columns,frames};
  for(const name of layerNames){
    const file=`${output}/${pose}-${name}.png`;write(file,atlases[name]);
    urls[`${pose}${name[0].toUpperCase()}${name.slice(1)}`]=file;
  }
  write(`${source}/${pose}-reference.png`,reference);
}
// Tools retain their original art, but receive their own grip/tip coordinates.
// Rod's decorative dangling line is clipped away from the diagonal shaft;
// gameplay fishing line is drawn dynamically from the recorded rod tip.
for(const [kind,assets] of Object.entries({axe:['basic','iron','steel','master'],rod:['basic','sturdy','steel','expert','master_angler','deepwater']})){
  for(const asset of assets){
    const image=read(kind==='axe'?`assets/forestry/axes/${asset}.png`:`assets/fishing/rods/${asset}.png`);
    if(kind==='rod'){
      for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
        // Upper rod shaft follows the top-left/bottom-right diagonal.
        if(x+y>image.width*1.19&&x>image.width*.62)image.data[(y*image.width+x)*4+3]=0;
      }
    }
    const b=alphaBounds(image),out=blank(96,96);
    const scale=Math.min(80/b.width,80/b.height),w=Math.round(b.width*scale),h=Math.round(b.height*scale);
    const dx=Math.round((96-w)/2),dy=Math.round((96-h)/2);
    blitNearest(out,crop(image,b.x,b.y,b.width,b.height),dx,dy,w,h);
    // Grip is inside the lower handle, not the image rectangle's origin.
    const grip=kind==='axe'?[dx+Math.round(w*.10),dy+Math.round(h*.88)]:
      [dx+Math.round(w*.15),dy+Math.round(h*.85)];
    const tip=kind==='axe'?[dx+Math.round(w*.68),dy+Math.round(h*.27)]:
      [dx+Math.round(w*.97),dy+Math.round(h*.03)];
    const file=`${output}/tools/${kind}-${asset}.png`;write(file,out);
    const key=`${kind}.${asset}`;urls[key]=file;
    rig.tools[key]={grip,tip,nativeAngle:Math.atan2(tip[1]-grip[1],tip[0]-grip[0]),
      nativeLength:Math.hypot(tip[0]-grip[0],tip[1]-grip[1])};
  }
}
fs.writeFileSync('src/data/character-rig-data.js',
  `// Generated by scripts/pack-character-rig.mjs. Do not hand-edit packed metadata.\nconst CHARACTER_RIG=Object.freeze(${JSON.stringify(rig,null,2)});\n`);
fs.writeFileSync(`${output}/manifest.json`,JSON.stringify({rig,urls},null,2)+'\n');
console.log('Packed 32 poses, 18 appearance layers and 10 tool sprites into rig v1.');
