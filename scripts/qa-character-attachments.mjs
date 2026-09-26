// Check actual raster connectivity, not merely atlas dimensions. Also export
// a slow playback page showing the game's real ready/impact/return frames.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/character-qa/attachments');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
try{
  const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base);
  await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish&&typeof equipInventoryAppearance==='function');
  const result=await page.evaluate(()=>{
    const outfits=['outfit.traveler','outfit.ember','outfit.meadow'],packs=['pack.traveler','pack.ranger','pack.berry'];
    const faces=['down','right','left','up'],samples=[0,100,269,270,350,500,699,700,701];
    const before=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression});
    canvas.width=192;canvas.height=180;ctx.imageSmoothingEnabled=false;
    const toolDraw=drawCharacterTool;
    const raster=(face,time,tools=false)=>{
      player.face=face;player.moving=false;tNow=time;
      lifeUi.chop={regionId:GAME_STATE.regionId,startedAt:0,struck:true};
      updateLifeContentUi(time);
      ctx.clearRect(0,0,192,180);
      drawCharacterTool=tools?toolDraw:()=>{};
      const pose=getCharacterPose();drawCharacterActor(96,110,pose);
      drawCharacterTool=toolDraw;
      return {pixels:ctx.getImageData(0,0,192,180).data,url:canvas.toDataURL(),frame:pose.frame};
    };
    const connectivity=pixels=>{
      const seen=new Uint8Array(192*180),components=[];
      for(let start=0;start<seen.length;start++){
        if(seen[start]||pixels[start*4+3]<80)continue;
        const queue=[start];seen[start]=1;
        for(let at=0;at<queue.length;at++){
          const n=queue[at],x=n%192,y=Math.floor(n/192);
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const xx=x+dx,yy=y+dy,next=yy*192+xx;
            if(xx<0||yy<0||xx>=192||yy>=180||seen[next]||pixels[next*4+3]<80)continue;
            seen[next]=1;queue.push(next);
          }
        }
        components.push(queue.length);
      }
      components.sort((a,b)=>b-a);
      const total=components.reduce((sum,n)=>sum+n,0);
      return {largest:components[0],total,detached:total-components[0],components};
    };
    const sets=[],report=[];
    for(const outfit of outfits)for(const pack of packs){
      equipInventoryAppearance('outfit',outfit);equipInventoryAppearance('backpack',pack);
      const images={};
      for(const face of faces){
        images[face]=[];
        for(const time of samples){
          const art=raster(face,time),connected=connectivity(art.pixels);
          if(connected.largest/connected.total<.97)
            throw new Error('Detached character parts: '+JSON.stringify({outfit,pack,face,time,...connected}));
          report.push({outfit,pack,face,time,frame:art.frame,detached:connected.detached,total:connected.total});
        }
        for(const time of [0,270])images[face].push(raster(face,time,true).url);
        lifeUi.chop=null;tNow=800;ctx.clearRect(0,0,192,180);
        drawCharacterActor(96,110,{pose:'walk',face,frame:0,tool:'axe'});
        images[face].push(canvas.toDataURL());
      }
      sets.push({outfit,pack,images});
    }
    if(before!==JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression}))throw new Error('Visual review changed progression');
    return {sets,report,samples,progressionUnchanged:true};
  });
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({samples:result.samples,checks:result.report,progressionUnchanged:true,browserErrors:errors},null,2));
  const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>벌목 연결 검토</title><style>body{background:#183d30;color:#fff;font:16px system-ui;margin:20px}canvas{background:#73a07a;image-rendering:pixelated;max-width:100%;height:auto}button,select{font:inherit;min-height:44px;margin:6px;padding:6px}p{line-height:1.6}</style><h1>벌목 연결 · 느린 재생</h1><p>실제 게임 렌더러의 준비 → 타격 → 기본 자세. 새 중간 모션을 추가한 것이 아닙니다.<br>옷/가방 9조합, 사방향을 같은 배율로 확인합니다.</p><select id="set"></select><button id="play">일시정지</button><button id="step">다음 자세</button><canvas id="review" width="960" height="440"></canvas><script>const sets=${JSON.stringify(result.sets)},faces=['down','right','left','up'],labels=['앞','오른쪽','왼쪽','뒤'],phases=['준비','타격','기본'],selector=document.getElementById('set'),c=document.getElementById('review'),ctx=c.getContext('2d');sets.forEach((s,i)=>selector.add(new Option(s.outfit+' / '+s.pack,i)));let frame=0,playing=true,images={};async function load(){const s=sets[selector.value||0];await Promise.all(faces.map(async face=>{images[face]=await Promise.all(s.images[face].map(url=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.src=url;})));}));draw();}function draw(){ctx.imageSmoothingEnabled=false;ctx.fillStyle='#73a07a';ctx.fillRect(0,0,960,440);faces.forEach((face,col)=>{ctx.drawImage(images[face][frame],col*240-72,0,384,360);ctx.fillStyle='#173b2b';ctx.font='bold 20px system-ui';ctx.textAlign='center';ctx.fillText(labels[col]+' · '+phases[frame],col*240+120,410);});}selector.onchange=load;document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'일시정지':'재생';};document.getElementById('step').onclick=()=>{playing=false;frame=(frame+1)%3;draw();};setInterval(()=>{if(playing&&images.down){frame=(frame+1)%3;draw();}},900);load();</script></html>`;
  fs.writeFileSync(path.join(output,'slow-review.html'),html);
  // Compare whole silhouettes with NPCs at the same game display size and
  // ground line, not arbitrary separately enlarged source crops.
  await page.evaluate(()=>{
    lifeUi.chop=null;equipInventoryAppearance('outfit','outfit.traveler');equipInventoryAppearance('backpack','pack.traveler');
    canvas.width=1200;canvas.height=700;canvas.style.cssText='position:relative;width:1200px;height:700px;max-width:none;';
    document.body.appendChild(canvas);for(const node of document.body.children)if(node!==canvas)node.style.display='none';
    const faces=['down','right','left','up'];ctx.imageSmoothingEnabled=false;ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1200,700);
    const tool=drawCharacterTool;drawCharacterTool=()=>{};
    for(let row=0;row<4;row++){
      const y=110+row*150;drawCharacterActor(110,y,{pose:'walk',face:faces[row],frame:0,tool:'axe'});
      for(const [col,name] of ['elli','jun'].entries()){
        const sheet=npcImgs[name],npcRow={down:0,left:1,right:2,up:3}[faces[row]];
        ctx.drawImage(sheet,96,npcRow*96,96,96,260+col*200,y+20-100,100,100);
      }
      ctx.fillStyle='#143b2a';ctx.font='18px system-ui';ctx.fillText(faces[row],15,y);
    }
    drawCharacterTool=tool;
  });
  await page.locator('#game').screenshot({path:path.join(output,'npc-proportion-comparison.png')});
  await page.goto(pathToFileURL(path.join(output,'slow-review.html')).href);
  for(const phase of [0,1,2]){
    await page.waitForFunction(phase=>typeof images!=='undefined'&&images.down&&frame===phase,phase,{polling:50});
    await page.locator('#review').screenshot({path:path.join(output,'slow-phase-'+phase+'.png')});
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Attachment QA passed: '+result.report.length+' actual timeline samples, 9 wardrobes, 4 directions, connected head/body/bag, progression unchanged. Slow review: '+path.join(output,'slow-review.html'));
}finally{await browser.close();}
