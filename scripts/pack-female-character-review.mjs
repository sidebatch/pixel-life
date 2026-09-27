// Design review only. Never changes production sprites, saves or asset registration.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {blank,crop,mainSpriteBounds,alphaBounds,blitNearest,decodePNG,encodePNG} from './lib/png.mjs';

const dir='assets/player/source/female-v1';
fs.mkdirSync(dir,{recursive:true});
const read=file=>decodePNG(fs.readFileSync(file));
const names=['down','right','left','up'];
const male=blank(96,384),elli=blank(96,384),jun=blank(96,384);
for(let row=0;row<4;row++){
  // Same idle frame and occlusion order as the current approved renderer.
  const order=row===1||row===2
    ? ['backpack','body','outfit','head','hair','grip']
    : ['body','outfit','backpack','head','hair','grip'];
  for(const part of order){
    const root=part==='grip'?'rig-v1':'polish-v1';
    blitNearest(male,crop(read(`assets/player/${root}/walk-${part}.png`),0,row*96,96,96),0,row*96);
  }
  const npcRow=[0,2,1,3][row];
  for(const [name,atlas] of [['elli',elli],['jun',jun]])
    blitNearest(atlas,crop(read(`assets/npcs/${name}.png`),96,npcRow*96,96,96),0,row*96);
}
const female=blank(96,384),measurements=[];
const generated=read(dir+'/turnaround-generated.png');
const targetHeight=61;
for(let row=0;row<4;row++){
  const col=row%2,sourceRow=Math.floor(row/2);
  const x=Math.round(col*generated.width/2),y=Math.round(sourceRow*generated.height/2);
  const tile=crop(generated,x,y,Math.round((col+1)*generated.width/2)-x,Math.round((sourceRow+1)*generated.height/2)-y);
  const bounds=mainSpriteBounds(tile);
  const width=Math.round(bounds.width*targetHeight/bounds.height);
  assert(width>=20&&width<=50,`Unexpected ${names[row]} silhouette width: ${width}`);
  const frame=blank(96,96);
  // One uniform scale per complete sprite; no independent head/body distortion.
  blitNearest(frame,crop(tile,bounds.x,bounds.y,bounds.width,bounds.height),Math.round(48-width/2),89-targetHeight,width,targetHeight);
  const normalized=alphaBounds(frame);
  assert.equal(normalized.y+normalized.height-1,88,'Feet must be on the common baseline');
  assert(normalized.x>0&&normalized.x+normalized.width<96,'No cell-edge clipping');
  blitNearest(female,frame,0,row*96);
  measurements.push({face:names[row],source:bounds,female:normalized,male:alphaBounds(crop(male,0,row*96,96,96))});
}
const images={male,female,elli,jun};
for(const [name,atlas] of Object.entries(images))fs.writeFileSync(`${dir}/${name}-idle-review.png`,encodePNG(atlas));
fs.writeFileSync(dir+'/review-manifest.json',JSON.stringify({status:'design-review-only',cell:96,feet:[48,88],displaySize:100,targetHeight,directions:names,measurements,runtimeChanged:false,animationValidated:false,wardrobeCompatibilityValidated:false},null,2)+'\n');
const embedded=Object.fromEntries(Object.entries(images).map(([name,image])=>[name,'data:image/png;base64,'+encodePNG(image).toString('base64')]));
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>여자 기본 캐릭터 디자인 검토</title>
<style>body{margin:0;background:#102d27;color:#eef6ea;font:16px system-ui,sans-serif;padding:20px;box-sizing:border-box}main{max-width:970px;margin:auto}h1{font-size:24px;margin:0 0 12px}p{line-height:1.6;color:#cbdacf}.scroll{overflow:auto;border:1px solid #53755c;border-radius:14px;margin-top:18px}canvas{display:block;image-rendering:pixelated}button{min-height:44px;border:1px solid #86b49c;border-radius:8px;padding:8px 16px;background:#284c3f;color:white;margin:4px;cursor:pointer}</style>
<main><h1>여자 기본 캐릭터 · 사방향 디자인</h1><p>현재 남자 주인공·엘리·준과 같은 표시 배율로 비교합니다.<br>디자인 검토용입니다. 실제 게임·진행도·저장 데이터는 변경하지 않았습니다.</p><button id="actual" type="button">게임 표시 크기</button><button id="large" type="button">3배 확대</button><div class="scroll"><canvas id="review" aria-label="남자와 여자 주인공, 엘리, 준의 사방향 비교"></canvas></div><p>96×96 공통 셀 · 발 (48,88) · 게임 표시 100px. 여자 원화는 전체를 등비 축소했습니다.<br>걷기·벌목·낚시, 옷/가방/무기 교체 검증과 새 게임 성별 선택은 디자인 확인 후 진행합니다.</p></main>
<script>
const sources=${JSON.stringify(embedded)},rows=['앞','오른쪽','왼쪽','뒤'],columns=[['male','현재 남자'],['female','여자 기본안'],['elli','엘리 · 참고'],['jun','준 · 참고']],images={};
const canvas=document.getElementById('review'),ctx=canvas.getContext('2d');
function draw(size){canvas.width=4*(size+32)+64;canvas.height=4*(size+36)+46;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#74a078';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillStyle='#16352b';columns.forEach(([key,label],col)=>{const x=64+col*(size+32);ctx.fillText(label,x+size/2,28);for(let row=0;row<4;row++){const y=44+row*(size+36);ctx.drawImage(images[key],0,row*96,96,96,x,y,size,size);if(col===0)ctx.fillText(rows[row],30,y+size/2);}});window.reviewSize=size;}
Promise.all(Object.entries(sources).map(([key,url])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[key]=image;resolve();};image.onerror=reject;image.src=url;}))).then(()=>{draw(100);window.reviewReady=true;});
document.getElementById('actual').onclick=()=>draw(100);document.getElementById('large').onclick=()=>draw(300);
</script></html>`;
fs.writeFileSync(dir+'/review.html',html);
console.log(JSON.stringify({status:'design-review-only',measurements,productionChanged:false},null,2));
