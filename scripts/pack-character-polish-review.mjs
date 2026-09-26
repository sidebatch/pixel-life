// Review-only normalization: no production sprite, rig, save or asset map edits.
import fs from 'node:fs';
import {blank,crop,mainSpriteBounds,alphaBounds,blitNearest,decodePNG,encodePNG} from './lib/png.mjs';
const dir='assets/player/source/polish-v1';
const read=file=>decodePNG(fs.readFileSync(file));
const generated=read(dir+'/turnaround-generated.png');
const polished=blank(96,384),original=blank(96,384),elli=blank(96,384),jun=blank(96,384);
const names=['down','right','left','up'],measurements=[];
for(let row=0;row<4;row++){
  const col=row%2,sourceRow=Math.floor(row/2),x=Math.round(col*generated.width/2),y=Math.round(sourceRow*generated.height/2);
  const tile=crop(generated,x,y,Math.round((col+1)*generated.width/2)-x,Math.round((sourceRow+1)*generated.height/2)-y);
  const bounds=mainSpriteBounds(tile),width=Math.round(bounds.width*68/bounds.height);
  if(width>80)throw new Error('Review sprite proportions are not compatible');
  const frame=blank(96,96);
  blitNearest(frame,crop(tile,bounds.x,bounds.y,bounds.width,bounds.height),Math.round(48-width/2),21,width,68);
  blitNearest(polished,frame,0,row*96);
  measurements.push({face:names[row],...alphaBounds(frame)});
  for(const part of ['body','outfit','backpack','head','hair','grip'])
    blitNearest(original,crop(read('assets/player/rig-v1/walk-'+part+'.png'),0,row*96,96,96),0,row*96);
  const npcRow=[0,2,1,3][row];
  for(const [name,atlas] of [['elli',elli],['jun',jun]])
    blitNearest(atlas,crop(read('assets/npcs/'+name+'.png'),0,npcRow*96,96,96),0,row*96);
}
const images={polished,original,elli,jun};
for(const [name,atlas] of Object.entries(images))fs.writeFileSync(dir+'/'+name+'-idle-review.png',encodePNG(atlas));
fs.writeFileSync(dir+'/review-manifest.json',JSON.stringify({status:'design-review-only',cell:96,feet:[48,88],targetHeight:68,directions:names,measurements,runtimeChanged:false,animationValidated:false},null,2)+'\n');
const embedded=Object.fromEntries(Object.entries(images).map(([name,image])=>[name,'data:image/png;base64,'+encodePNG(image).toString('base64')]));
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>기본 캐릭터 디자인 검토</title>
<style>body{margin:0;background:#102d27;color:#eef6ea;font:16px system-ui,sans-serif;padding:24px;box-sizing:border-box}main{max-width:930px;margin:auto}h1{font-size:24px;margin:0 0 12px}p{line-height:1.6;color:#cbdacf}strong{color:#f0d293}.scroll{overflow:auto;border:1px solid #53755c;border-radius:14px;margin-top:18px}canvas{display:block;image-rendering:pixelated}button{min-height:44px;border:1px solid #86b49c;border-radius:8px;padding:8px 16px;background:#284c3f;color:white;margin:4px;cursor:pointer}</style>
<main><h1>기본 캐릭터 · 방향별 디자인 검토</h1><p>갈색 머리·파란 옷·갈색 가방을 유지한 개선안입니다.<br><strong>디자인 검토용입니다. 게임 적용·부품 분리·동작 연결은 아직 하지 않았습니다.</strong></p><button id="actual" type="button">게임 표시 크기</button><button id="large" type="button">3배 확대</button><div class="scroll"><canvas id="review" width="900" height="660" aria-label="기존 주인공, 개선안, 엘리, 준의 네 방향 비교"></canvas></div><p>96×96 공통 셀, 발 (48,88), 새 그림 높이 68px. NPC는 실제 원본 비율을 유지합니다.<br>손 위치·휘두름·낚시·장착품 겹침 검사는 디자인 확정 후 부품별 그림을 만들면서 진행합니다.</p></main>
<script>
const sources=${JSON.stringify(embedded)},rows=['앞','오른쪽','왼쪽','뒤'],columns=[['original','기존 주인공'],['polished','개선안'],['elli','엘리 · 참고'],['jun','준 · 참고']],images={};
const canvas=document.getElementById('review'),ctx=canvas.getContext('2d');
function draw(size){canvas.width=4*(size+24)+80;canvas.height=4*(size+38)+46;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#74a078';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillStyle='#16352b';columns.forEach(([key,label],col)=>{const x=80+col*(size+24);ctx.fillText(label,x+size/2,28);for(let row=0;row<4;row++){const y=44+row*(size+38);ctx.drawImage(images[key],0,row*96,96,96,x,y,size,size);if(col===0)ctx.fillText(rows[row],36,y+size/2);}});}
Promise.all(Object.entries(sources).map(([key,url])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[key]=image;resolve();};image.onerror=reject;image.src=url;}))).then(()=>{draw(100);window.reviewReady=true;});
document.getElementById('actual').onclick=()=>draw(100);document.getElementById('large').onclick=()=>draw(288);
</script></html>`;
fs.writeFileSync(dir+'/review.html',html);
console.log('Review-only four-view sprites and standalone comparison page packed; production game unchanged.');
