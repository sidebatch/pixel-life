import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {decodePNG} from './lib/png.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/npc-wardrobe-v2');fs.mkdirSync(output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('assets/player/npc-wardrobe-v2/manifest.json'));
for(const [file,hash] of Object.entries(manifest.protectedFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'Old anatomy/wardrobe changed: '+file);
let cells=0;
for(const pose of ['walk','chop','fish'])for(const name of ['ember','meadow']){
  const image=decodePNG(fs.readFileSync(`assets/player/npc-wardrobe-v2/${pose}-${name}.png`)),mask=decodePNG(fs.readFileSync(`assets/player/npc-v1/${pose}-outfit.png`));
  assert.deepEqual([image.width,image.height],[mask.width,384]);
  let changed=0,blue=0;
  const old=decodePNG(fs.readFileSync(`assets/player/npc-v1/${pose}-${name}.png`));
  for(let p=0;p<image.data.length;p+=4){
    assert.equal(image.data[p+3],mask.data[p+3],'Clothing shape exposes/moves body');
    if(!image.data[p+3])continue;
    if(!image.data.subarray(p,p+3).equals(old.data.subarray(p,p+3)))changed++;
    const [r,g,b]=image.data.subarray(p,p+3);if(b>r+20&&b>g+15&&b>50)blue++;
  }
  assert(changed>200,'Newly redrawn paint is missing');assert.equal(blue,0,'Blue base jacket leaked through');
  cells+=image.width/96*4;
}
assert.equal(cells,64);
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
try{
  const page=await browser.newPage({viewport:{width:1300,height:920},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base+'?walk-preview&character-preview&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterOutfitPreviewImgs['outfit.meadow']?.fish);
  const result=await page.evaluate(()=>{
    const appearance={...GAME_STATE.appearance},saved=JSON.stringify(createSaveData().state),stored=JSON.stringify({...localStorage}),tool=drawCharacterTool;
    setCharacterWalkPreview('balanced');canvas.width=160;canvas.height=160;let combinations=0;
    const refs=new Map();
    for(const [pose,definition] of Object.entries(CHARACTER_RIG.poses))for(const face of ['down','right','left','up'])for(let frame=0;frame<definition.columns;frame++){
      const p={pose,face,frame,tool:pose==='fish'?'rod':'axe'};refs.set([pose,face,frame].join(),JSON.stringify(getCharacterToolTransform(80,110,p)));
    }
    try{
      for(const sex of ['male','female'])for(const id of ['outfit.traveler','outfit.ember','outfit.meadow'])for(const pack of ['pack.traveler','pack.ranger','pack.berry']){
        setCharacterBodyPreview(sex);GAME_STATE.appearance.outfitId=id;GAME_STATE.appearance.backpackId=pack;
        for(const [pose,definition] of Object.entries(CHARACTER_RIG.poses))for(const face of ['down','right','left','up'])for(let frame=0;frame<definition.columns;frame++){
          const p={pose,face,frame,tool:pose==='fish'?'rod':'axe'};
          if(JSON.stringify(getCharacterToolTransform(80,110,p))!==refs.get([pose,face,frame].join()))throw Error('Wardrobe moved tool grip');
          const selected=getCharacterOutfitImages(id);
          if(id!=='outfit.traveler'&&selected!==characterOutfitPreviewImgs[id])throw Error('New wardrobe not selected');
          let seen=false;const draw=ctx.drawImage;ctx.drawImage=function(image,...args){if(image===selected[pose])seen=true;return draw.call(this,image,...args);};
          ctx.clearRect(0,0,160,160);drawCharacterTool=()=>{};drawCharacterActor(80,110,p);ctx.drawImage=draw;drawCharacterTool=tool;
          if(!seen)throw Error('Renderer ignored new wardrobe');
          const pixels=ctx.getImageData(0,0,160,160).data,visited=new Uint8Array(25600),parts=[];
          for(let start=0;start<visited.length;start++){
            if(visited[start]||pixels[start*4+3]<80)continue;const queue=[start];visited[start]=1;
            for(let i=0;i<queue.length;i++){
              const n=queue[i],x=n%160,y=Math.floor(n/160);
              for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
                const xx=x+dx,yy=y+dy,next=yy*160+xx;if(xx<0||xx>=160||yy<0||yy>=160||visited[next]||pixels[next*4+3]<80)continue;
                visited[next]=1;queue.push(next);
              }
            }
            parts.push(queue.length);
          }
          if(Math.max(...parts)/parts.reduce((a,b)=>a+b,0)<.97)throw Error('Wardrobe separates character: '+[sex,id,pack,pose,face,frame].join('/'));
          combinations++;
        }
      }
      setCharacterWalkPreview('original');for(const id of ['outfit.ember','outfit.meadow'])if(getCharacterOutfitImages(id)!==characterOutfitImgs[id])throw Error('Original compare no longer original');
    }finally{Object.assign(GAME_STATE.appearance,appearance);drawCharacterTool=tool;}
    if(JSON.stringify(createSaveData().state)!==saved||JSON.stringify({...localStorage})!==stored)throw Error('Clothes trial persisted state');
    return {combinations,newPaintUsed:true,toolsAndAnatomyUnchanged:true,largePartsConnected:true,storageUnchanged:true,originalComparisonPreserved:true};
  });
  assert.equal(result.combinations,576);
  for(const sex of ['male','female'])for(const outfit of ['outfit.ember','outfit.meadow']){
    const png=await page.evaluate(({sex,outfit})=>{
      setCharacterBodyPreview(sex);GAME_STATE.appearance.outfitId=outfit;GAME_STATE.appearance.backpackId='pack.traveler';
      canvas.width=1300;canvas.height=900;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1300,900);
      for(let i=0;i<3;i++){
        const pose=['walk','chop','fish'][i];
        for(let row=0;row<4;row++)for(let frame=0;frame<CHARACTER_RIG.poses[pose].columns;frame++){
          setCharacterWalkPreview('balanced');ctx.save();ctx.translate(i*430+55+frame*125,120+row*200);ctx.scale(1.7,1.7);
          drawCharacterActor(0,0,{pose,face:['down','right','left','up'][row],frame,tool:pose==='fish'?'rod':'axe'});ctx.restore();
        }
      }
      return canvas.toDataURL('image/png');
    },{sex,outfit});
    fs.writeFileSync(path.join(output,sex+'-'+outfit.slice(7)+'-poses.png'),Buffer.from(png.split(',')[1],'base64'));
  }
  await page.setViewportSize({width:393,height:780});await page.reload();await page.waitForFunction(()=>characterOutfitPreviewImgs['outfit.meadow']?.fish);
  const legacy=await page.evaluate(()=>{
    const fixture=JSON.parse(JSON.stringify(createSaveData()));fixture.state.progression.coins=4321;fixture.state.appearance.outfitId='outfit.ember';fixture.state.appearance.backpackId='pack.berry';
    if(!applySaveData(fixture)||!saveGame())throw Error('Existing wardrobe save failed');return {coins:GAME_STATE.progression.coins,outfit:GAME_STATE.appearance.outfitId,pack:GAME_STATE.appearance.backpackId};
  });
  await page.evaluate(()=>{openInventory();});
  await page.locator('[data-inventory-tab="appearance"]').tap();
  for(const id of ['outfit.traveler','outfit.ember','outfit.meadow']){
    await page.locator('[data-equip-id="'+id+'"]').tap();
    assert.equal(await page.evaluate(()=>GAME_STATE.appearance.outfitId),id);
  }
  legacy.outfit='outfit.meadow';
  await page.screenshot({path:path.join(output,'mobile-wardrobe.png')});
  assert.equal(await page.locator('[data-character-preview-panel]:visible').count(),0);
  await page.locator('#inventoryClose').tap();
  await page.getByRole('button',{name:'보정 동작',exact:true}).tap();
  await page.reload();await page.waitForFunction(()=>characterOutfitPreviewImgs['outfit.ember']?.walk);
  assert.deepEqual(await page.evaluate(()=>({coins:GAME_STATE.progression.coins,outfit:GAME_STATE.appearance.outfitId,pack:GAME_STATE.appearance.backpackId})),legacy);
  await page.goto(base);await page.waitForFunction(()=>characterOutfitImgs['outfit.meadow']?.fish);
  assert(await page.evaluate(()=>Object.keys(characterOutfitPreviewImgs).length===0&&getCharacterOutfitImages('outfit.ember')===characterOutfitImgs['outfit.ember']));
  assert.deepEqual(await page.evaluate(()=>({coins:GAME_STATE.progression.coins,outfit:GAME_STATE.appearance.outfitId,pack:GAME_STATE.appearance.backpackId})),legacy);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({cells,...result,normalAssetsAndLegacySavePreserved:true,mobileViewport:'393x780',browserErrors:errors},null,2));
  console.log('PASS: 64 redrawn garment cells, exact body alpha/no blue residue, original part hashes, 576 real renders, grips/compare/save/mobile/normal preserved.');
}finally{await browser.close();}
