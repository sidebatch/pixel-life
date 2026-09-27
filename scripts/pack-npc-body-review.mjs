// NPC-like body design review only; does not alter the current game or rig.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {blank,crop,alphaBounds,blitNearest,decodePNG,encodePNG} from './lib/png.mjs';
const dir='assets/player/source/npc-body-v1';
fs.mkdirSync(dir,{recursive:true});
const read=file=>decodePNG(fs.readFileSync(file));
const raw=read(dir+'/turnaround-generated.png');
// Generated rows are visually spaced, not guaranteed mathematical grid cells.
// Find whole connected sprites BEFORE cropping, otherwise first-row boots get cut.
function spriteComponents(image){
  const seen=new Uint8Array(image.width*image.height),components=[];
  for(let start=0;start<seen.length;start++){
    if(seen[start]||image.data[start*4+3]<128)continue;
    const queue=[start];seen[start]=1;
    let x0=image.width,y0=image.height,x1=0,y1=0;
    for(let q=0;q<queue.length;q++){
      const n=queue[q],x=n%image.width,y=Math.floor(n/image.width);
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy;
        if(xx<0||yy<0||xx>=image.width||yy>=image.height)continue;
        const next=yy*image.width+xx;
        if(!seen[next]&&image.data[next*4+3]>=128){seen[next]=1;queue.push(next);}
      }
    }
    if(queue.length>2000)components.push({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,pixels:queue.length});
  }
  assert.equal(components.length,8,'Must find eight complete, disconnected full-body sprites');
  components.sort((a,b)=>(a.y+a.height/2)-(b.y+b.height/2));
  const rows=[];
  for(let row=0;row<4;row++)rows.push(components.slice(row*2,row*2+2).sort((a,b)=>a.x-b.x));
  return rows;
}
const sourceRows=spriteComponents(raw);
const names=['down','right','left','up'];
const images=Object.fromEntries(['male','female','elli','jun'].map(name=>[name,blank(96,384)]));
const measurements=[];
for(let row=0;row<4;row++){
  for(const [col,name] of ['male','female'].entries()){
    const bounds=sourceRows[row][col],width=Math.round(bounds.width*68/bounds.height);
    assert(width>=25&&width<=52,`Unexpected ${name}/${names[row]} width: ${width}`);
    const frame=blank(96,96);
    blitNearest(frame,crop(raw,bounds.x,bounds.y,bounds.width,bounds.height),Math.round(48-width/2),21,width,68);
    const packed=alphaBounds(frame);
    assert.equal(packed.y+packed.height-1,88,'Common ground baseline');
    assert.equal(packed.height,68,'Common physical height');
    blitNearest(images[name],frame,0,row*96);
    measurements.push({name,face:names[row],source:bounds,packed});
  }
  const npcRow=[0,2,1,3][row];
  for(const name of ['elli','jun']){
    const frame=crop(read(`assets/npcs/${name}.png`),96,npcRow*96,96,96),bounds=alphaBounds(frame);
    // No NPC rescaling. Align its opaque foot baseline for a fair body comparison.
    const shift=88-(bounds.y+bounds.height-1),aligned=blank(96,96);
    blitNearest(aligned,frame,0,shift);
    blitNearest(images[name],aligned,0,row*96);
    measurements.push({name,face:names[row],source:bounds,packed:alphaBounds(aligned),baselineShift:shift});
  }
}
for(const [name,atlas] of Object.entries(images))fs.writeFileSync(`${dir}/${name}-idle-review.png`,encodePNG(atlas));
fs.writeFileSync(dir+'/review-manifest.json',JSON.stringify({status:'design-review-only',cell:96,feet:[48,88],displaySize:100,targetHeight:68,directions:names,measurements,runtimeChanged:false,animationValidated:false,wardrobeCompatibilityValidated:false,npcBaselineAlignedWithoutRescaling:true},null,2)+'\n');
const embedded=Object.fromEntries(Object.entries(images).map(([name,image])=>[name,'data:image/png;base64,'+encodePNG(image).toString('base64')]));
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NPC 체형 · 남녀 주인공 비교</title>
<style>body{margin:0;background:#102d27;color:#eef6ea;font:16px system-ui,sans-serif;padding:20px;box-sizing:border-box}main{max-width:970px;margin:auto}h1{font-size:24px;margin:0 0 12px}p{line-height:1.6;color:#cbdacf}.scroll{overflow:auto;border:1px solid #53755c;border-radius:14px;margin-top:18px}canvas{display:block;image-rendering:pixelated}button{min-height:44px;border:1px solid #86b49c;border-radius:8px;padding:8px 16px;background:#284c3f;color:white;margin:4px;cursor:pointer}</style>
<main><h1>NPC 체형 · 남녀 주인공 기본안</h1><p>엘리·준처럼 머리 비중을 줄이고 몸통·팔다리가 보이도록 새로 그린 검토안입니다.<br>네 캐릭터는 같은 표시 배율과 발 기준으로 비교합니다. NPC 그림은 확대/축소하지 않았습니다.<br>아직 실제 게임에는 적용하지 않았습니다. 동작·장비·외형 교체 검증은 이후 단계입니다.</p><button id="actual" type="button">게임 표시 크기</button><button id="large" type="button">3배 확대</button><button id="guide" type="button" aria-pressed="false">발 기준선 보기</button><div class="scroll"><canvas id="review" aria-label="NPC 체형 남녀 주인공과 엘리 준의 사방향 비교"></canvas></div><p>공통 셀 96×96 · 그림 높이 68px · 발 (48,88) · 표시 100px.<br>다음 작업: 체형 확인 → 공통 관절/부품 → 걷기·벌목·낚시 → 기존 옷·가방·오른손 장비 연결.</p></main>
<script>
const sources=${JSON.stringify(embedded)},rows=['앞','오른쪽','왼쪽','뒤'],columns=[['male','남자 기본안'],['female','여자 기본안'],['elli','엘리 · 참고'],['jun','준 · 참고']],images={};
const canvas=document.getElementById('review'),ctx=canvas.getContext('2d');let guide=false;
function draw(size){canvas.width=4*(size+32)+64;canvas.height=4*(size+36)+46;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#74a078';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillStyle='#16352b';columns.forEach(([key,label],col)=>{const x=64+col*(size+32);ctx.fillText(label,x+size/2,28);for(let row=0;row<4;row++){const y=44+row*(size+36);ctx.drawImage(images[key],0,row*96,96,96,x,y,size,size);if(guide){ctx.strokeStyle='#efd998';ctx.beginPath();ctx.moveTo(x,y+89*size/96);ctx.lineTo(x+size,y+89*size/96);ctx.stroke();}if(col===0)ctx.fillText(rows[row],30,y+size/2);}});window.reviewSize=size;}
Promise.all(Object.entries(sources).map(([key,url])=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[key]=image;resolve();};image.onerror=reject;image.src=url;}))).then(()=>{draw(100);window.reviewReady=true;});
document.getElementById('actual').onclick=()=>draw(100);document.getElementById('large').onclick=()=>draw(300);document.getElementById('guide').onclick=()=>{guide=!guide;document.getElementById('guide').setAttribute('aria-pressed',String(guide));draw(window.reviewSize);};
</script></html>`;
fs.writeFileSync(dir+'/review.html',html);
console.log(JSON.stringify({status:'design-review-only',measurements,runtimeChanged:false},null,2));
