// Current NPC-like production assets + real renderer, isolated browser saves.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {decodePNG,crop,alphaBounds} from './lib/png.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/npc-v1/full');fs.mkdirSync(output,{recursive:true});
const rig=JSON.parse(fs.readFileSync('assets/player/npc-v1/rig.json','utf8'));
const faces=['down','right','left','up'];let frames=0;
for(const [pose,definition] of Object.entries(rig.poses)){
  const atlases=Object.fromEntries(['body','outfit','grip','head','hair','female-head','female-hair','ember','meadow','backpack','ranger','berry'].map(part=>[part,decodePNG(fs.readFileSync(`assets/player/npc-v1/${pose}-${part}.png`))]));
  for(const image of Object.values(atlases))assert.deepEqual([image.width,image.height],[96*definition.columns,384]);
  for(let row=0;row<4;row++)for(let frame=0;frame<definition.columns;frame++){
    const cells=Object.fromEntries(Object.entries(atlases).map(([key,atlas])=>[key,crop(atlas,frame*96,row*96,96,96)]));
    for(const sex of ['male','female'])for(const part of ['head','hair']){
      const key=sex==='male'?part:'female-'+part;
      const master=decodePNG(fs.readFileSync(`assets/player/npc-v1/walk-${key}.png`));
      assert(cells[key].data.equals(crop(master,0,row*96,96,96).data),'Head size/registration must not change across poses');
    }
    for(const wardrobe of ['ember','meadow'])for(let p=3;p<cells.outfit.data.length;p+=4)
      assert.equal(cells[wardrobe].data[p],cells.outfit.data[p],'All clothes use the same new body silhouette');
    for(const bag of ['backpack','ranger','berry']){
      if(row===0)continue;
      let overlap=0;
      for(let p=3;p<cells.body.data.length;p+=4)if(cells[bag].data[p]&&cells.body.data[p])overlap++;
      assert(overlap>=4,`Bag must actually attach to torso, not just touch hair: ${pose}/${faces[row]}/${frame}/${bag} (${overlap})`);
      const b=alphaBounds(cells[bag]);assert(b.x>0&&b.y>0&&b.x+b.width<96&&b.y+b.height<96,'Full bag inside cell');
    }
    const {grip,gripOccluded,toolBehind}=definition.frames[faces[row]][frame];
    if(gripOccluded){
      assert(row===3&&toolBehind,'Hidden forward hands only in the rear view');
      let torso=false;
      for(let y=grip[1]-3;y<=grip[1]+3;y++)for(let x=grip[0]-3;x<=grip[0]+3;x++)if(cells.body.data[(y*96+x)*4+3])torso=true;
      assert(torso,'Occluded grip is behind the actual shoulder/torso');
    }else if(!(pose==='walk'&&row===2)){
      let visible=false;
      for(let y=grip[1]-2;y<=grip[1]+2;y++)for(let x=grip[0]-2;x<=grip[0]+2;x++)if(cells.grip.data[(y*96+x)*4+3])visible=true;
      assert(visible,`Actual gripping hand at tool anchor: ${pose}/${faces[row]}/${frame} ${grip}`);
    }
    frames++;
  }
}
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:1400,height:950}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto((process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/')+'?character-preview');
  await page.waitForFunction(()=>characterOutfitPreviewImgs['outfit.meadow']?.fish&&characterLayerImgs.femaleFishHair);
  const result=await page.evaluate(()=>{
    const progress=JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression});
    const appearance=JSON.stringify(GAME_STATE.appearance);
    for(const sex of ['male','female']){
      if(!setCharacterBodyPreview(sex))throw new Error('Preview switch unavailable');
      if(JSON.stringify(GAME_STATE.appearance)!==appearance)throw new Error('Preview changed saved appearance');
      const save=createSaveData();
      if(JSON.stringify(save.state.appearance)!==appearance)throw new Error('Preview override leaked into save');
    }
    const images=[],playback=[];let combinations=0;
    const connected=()=>{
      const pixels=ctx.getImageData(0,0,160,160).data,seen=new Uint8Array(160*160),components=[];
      for(let start=0;start<seen.length;start++){
        if(seen[start]||pixels[start*4+3]<80)continue;const queue=[start];seen[start]=1;
        for(let i=0;i<queue.length;i++){
          const n=queue[i],x=n%160,y=Math.floor(n/160);
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const xx=x+dx,yy=y+dy,next=yy*160+xx;
            if(xx<0||yy<0||xx>=160||yy>=160||seen[next]||pixels[next*4+3]<80)continue;
            seen[next]=1;queue.push(next);
          }
        }
        components.push(queue.length);
      }
      components.sort((a,b)=>b-a);return components[0]/components.reduce((a,b)=>a+b,0);
    };
    canvas.width=160;canvas.height=160;
    const drawTool=drawCharacterTool;drawCharacterTool=()=>{};
    for(const sex of ['male','female'])for(const outfit of ['outfit.traveler','outfit.ember','outfit.meadow'])for(const pack of ['pack.traveler','pack.ranger','pack.berry']){
      setCharacterBodyPreview(sex);equipInventoryAppearance('outfit',outfit);equipInventoryAppearance('backpack',pack);
      for(const [pose,definition] of Object.entries(CHARACTER_RIG.poses))for(const face of ['down','right','left','up'])for(let frame=0;frame<definition.columns;frame++){
        ctx.clearRect(0,0,160,160);drawCharacterActor(80,115,{pose,face,frame,tool:pose==='fish'?'rod':'axe'});
        const fraction=connected();if(fraction<.97)throw new Error('Detached parts '+JSON.stringify({sex,outfit,pack,pose,face,frame,fraction}));combinations++;
      }
    }
    drawCharacterTool=drawTool;
    equipInventoryAppearance('outfit','outfit.traveler');equipInventoryAppearance('backpack','pack.traveler');
    if(JSON.stringify({inventory:GAME_STATE.inventory,progression:GAME_STATE.progression})!==progress)throw new Error('Rendering changed progress');
    // Save-preservation fixture exercises both registered body/hair selections.
    const original=JSON.parse(JSON.stringify(createSaveData()));
    for(const sex of ['male','female']){
      const fixture=JSON.parse(JSON.stringify(original));fixture.state.progression.coins=4321;
      fixture.state.appearance.bodyId=sex==='female'?'body.female':'body.starter';fixture.state.appearance.hairId=sex==='female'?'hair.female.brown':'hair.brown';fixture.state.appearance.activeTool='rod';
      fixture.state.appearance.outfitId='outfit.meadow';fixture.state.appearance.backpackId='pack.berry';
      if(!applySaveData(fixture)||!saveGame())throw new Error('Body save fixture failed');
      const saved=JSON.parse(JSON.stringify(createSaveData()));
      if(saved.state.progression.coins!==4321||saved.state.appearance.bodyId!==fixture.state.appearance.bodyId||saved.state.appearance.hairId!==fixture.state.appearance.hairId||saved.state.appearance.activeTool!=='rod'||saved.state.appearance.outfitId!=='outfit.meadow'||saved.state.appearance.backpackId!=='pack.berry')throw new Error('Save normalization reset data');
    }
    if(!applySaveData(original)||!saveGame())throw new Error('Original save could not be restored');
    return {combinations,savePreserved:true};
  });
  for(const sex of ['male','female']){
    await page.evaluate(sex=>{
      setCharacterBodyPreview(sex);equipInventoryAppearance('outfit','outfit.traveler');equipInventoryAppearance('backpack','pack.traveler');
      canvas.width=1400;canvas.height=900;canvas.style.cssText='position:relative;width:1400px;height:900px;max-width:none;';document.body.appendChild(canvas);for(const node of document.body.children)if(node!==canvas)node.style.display='none';
      ctx.imageSmoothingEnabled=false;ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1400,900);
      const faces=['down','right','left','up'],poses=['walk','chop','fish'];
      for(let p=0;p<poses.length;p++){
        const pose=poses[p],columns=CHARACTER_RIG.poses[pose].columns;
        for(let row=0;row<4;row++)for(let frame=0;frame<columns;frame++){
          ctx.save();ctx.translate(p*460,40+row*200);ctx.scale(1.7,1.7);drawCharacterActor(65+frame*84,65,{pose,face:faces[row],frame,tool:pose==='fish'?'rod':'axe'});ctx.restore();
        }
      }
    },sex);
    await page.locator('#game').screenshot({path:path.join(output,sex+'-poses.png')});
  }
  await page.setViewportSize({width:393,height:780});
  await page.reload();await page.waitForFunction(()=>characterOutfitPreviewImgs['outfit.meadow']?.fish);
  await page.getByRole('button',{name:'리아',exact:true}).click();
  assert.equal(await page.evaluate(()=>getCharacterRenderAppearance().bodyId),'body.female');
  assert.equal(await page.evaluate(()=>GAME_STATE.appearance.bodyId),'body.starter');
  await page.evaluate(()=>{
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();
  });
  await page.screenshot({path:path.join(output,'female-mobile.png')});
  await page.getByRole('button',{name:'이안',exact:true}).click();
  assert.equal(await page.evaluate(()=>getCharacterRenderAppearance().bodyId),'body.starter');
  await page.goto((process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/'));
  await page.waitForFunction(()=>characterOutfitPreviewImgs['outfit.meadow']?.fish);
  assert.equal(await page.getByRole('button',{name:'리아',exact:true}).count(),0,'Normal link has no preview UI');
  assert.equal(await page.evaluate(()=>setCharacterBodyPreview('female')),false);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({frames,...result,browserErrors:errors},null,2));
  console.log('PASS: 32 poses, stable male/female heads, all new clothes share anatomy, torso-connected full packs, 576 rendered combinations, body/save preservation and 393px preview controls.');
}finally{await browser.close();}
