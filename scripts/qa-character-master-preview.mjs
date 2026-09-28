// Full reference trial: exact atlas deltas, in-game mobile controls, all
// current outfits/directions/actions, save isolation and normal-link safety.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/character-master-preview');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const errors=[],page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
  await page.goto(base+'?character-master-preview&character-preview&character=female&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterMasterOriginals.femaleFishHair&&
    characterOutfitPreviewImgs['outfit.meadow']?.fish&&
    document.querySelector('[aria-label="캐릭터 제작 기준 시험"]'));
  await page.evaluate(()=>{
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();
  });
  const initial=await page.evaluate(()=>{
    const state=JSON.stringify(createSaveData().state),storage=JSON.stringify({...localStorage});
    if(!CHARACTER_MASTER_PREVIEW_ENABLED||!CHARACTER_WALK_PREVIEW_ENABLED||
      characterMasterPreview!=='candidate'||characterWalkPreview!=='soft'||characterBodyPreview!=='female')
      throw Error('Trial must start with Ria and candidate art');
    for(const [frame,body,head] of [[0,0,0],[1,2,-1],[2,-1,1]]){
      if(getCharacterWalkAlignment({pose:'walk',face:'down',frame})!==body||
        getCharacterWalkHeadAlignment({pose:'walk',face:'down',frame})!==head)
        throw Error('Earlier soft down-walk was not restored');
      for(const face of ['right','left','up'])if(getCharacterWalkAlignment({pose:'walk',face,frame})!==0)
        throw Error('Soft down-walk leaked into another direction');
    }
    for(const face of ['down','up'])for(const frame of [0,1])
      if(getCharacterToolTransform(0,0,{pose:'chop',face,frame,tool:'axe'}).edgeScale!==1)
        throw Error('Soft gait unexpectedly changed the approved axe swing');
    const pixels=image=>{
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const painter=c.getContext('2d',{willReadFrequently:true});painter.drawImage(image,0,0);
      return painter.getImageData(0,0,c.width,c.height).data;
    };
    let checked=0,changed=0;
    for(const [key,{original,candidate}] of Object.entries(characterMasterOriginals)){
      if(original.width!==candidate.width||original.height!==candidate.height||characterLayerImgs[key]!==candidate)
        throw Error(`Wrong candidate atlas ${key}`);
      const a=pixels(original),b=pixels(candidate),width=original.width;
      for(let y=0;y<original.height;y++)for(let x=0;x<width;x++){
        const p=(y*width+x)*4,row=Math.floor(y/96),frame=Math.floor(x/96),local=x%96;
        if(key.endsWith('Body')){
          if(a[p+3]!==b[p+3])throw Error(`${key}: body alpha changed`);
          if((row!==0||y<57||y>59||local<45||local>51)&&
            (a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]))
            throw Error(`${key}: body pixel changed outside shared neckline`);
        }else{
          const dx=[2,-2,2,0][row],sx=local-dx;
          const from=(y*width+frame*96+sx)*4;
          for(let c=0;c<4;c++){
            let expected=sx<0||sx>=96?0:a[from+c];
            if(key.endsWith('Hair')&&(row===1||row===2)){
              const [left,right,peaks]=row===1?[45,52,[48,49]]:[47,53,[50,51]];
              if(y%96===27&&(local===left||local===right))expected=0;
              if(y%96===26&&peaks.includes(local))
                expected=a[((row*96+27)*width+frame*96+peaks[0]-dx)*4+c];
            }
            if(b[p+c]!==expected)throw Error(`${key}: wrong face/hair translation at ${x},${y}`);
          }
        }
        if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]||a[p+3]!==b[p+3])changed++;
      }
      checked++;
    }
    if(checked!==9||changed<100)throw Error('Incomplete trial atlas set');
    if(JSON.stringify(createSaveData().state)!==state||JSON.stringify({...localStorage})!==storage)
      throw Error('Trial setup changed saved play');
    return {checked,changed,state,storage};
  });
  await page.screenshot({path:path.join(output,'candidate-mobile.png')});
  const openMaster=()=>page.getByRole('button',{name:'기준·걸음 비교 열기 ▼'}).click();
  await openMaster();
  await page.getByRole('button',{name:'현재 걸음',exact:true}).click();
  assert.equal(await page.evaluate(()=>characterWalkPreview),'balanced');
  await openMaster();
  await page.getByRole('button',{name:'흔들림 완화',exact:true}).click();
  assert.equal(await page.evaluate(()=>characterWalkPreview),'soft');
  await openMaster();
  await page.getByRole('button',{name:'현재',exact:true}).click();
  assert.equal(await page.evaluate(()=>characterMasterPreview),'original');
  assert(await page.evaluate(()=>Object.entries(characterMasterOriginals).every(([key,v])=>characterLayerImgs[key]===v.original)));
  await page.screenshot({path:path.join(output,'original-mobile.png')});
  await openMaster();
  await page.getByRole('button',{name:'새 기준',exact:true}).click();
  for(const [button,id] of [['불꽃','outfit.ember'],['정원','outfit.meadow'],['기본복','outfit.traveler']]){
    await openMaster();
    await page.getByRole('button',{name:button,exact:true}).click();
    assert.equal(await page.evaluate(()=>getCharacterRenderAppearance().outfitId),id);
  }
  await openMaster();
  await page.getByRole('button',{name:'이안',exact:true}).click();
  assert.equal(await page.evaluate(()=>getCharacterRenderAppearance().bodyId),'body.starter');
  await openMaster();
  await page.getByRole('button',{name:'리아',exact:true}).click();
  assert.equal(await page.evaluate(()=>getCharacterRenderAppearance().bodyId),'body.female');
  const result=await page.evaluate(()=>{
    const outfits=['outfit.traveler','outfit.ember','outfit.meadow'],faces=['down','right','left','up'];
    const sheets=[['walk',0,'axe'],['walk',1,'axe'],['walk',2,'axe'],
      ['chop',0,'axe'],['chop',1,'axe'],['fish',0,'rod'],['fish',1,'rod'],['fish',2,'rod']];
    const dimensions=[canvas.width,canvas.height],images=[];
    let renders=0;
    try{
      canvas.width=1400;canvas.height=1330;ctx.imageSmoothingEnabled=false;
      for(const [pose,frame,tool] of sheets){
        ctx.fillStyle='#78a582';ctx.fillRect(0,0,canvas.width,canvas.height);
        for(let row=0;row<6;row++){
          const sex=row<3?'male':'female',outfit=outfits[row%3];
          setCharacterBodyPreview(sex);setCharacterMasterOutfitPreview(outfit);
          ctx.fillStyle='#12322b';ctx.font='17px sans-serif';ctx.fillText(`${sex}/${outfit}`,4,row*220+28);
          for(let col=0;col<4;col++){
            ctx.save();ctx.translate(col*350+160,row*220+194);ctx.scale(2,2);
            drawCharacterActor(0,0,{pose,face:faces[col],frame,tool});ctx.restore();renders++;
          }
        }
        images.push({name:`${pose}-${frame}`,png:canvas.toDataURL('image/png')});
      }
    }finally{canvas.width=dimensions[0];canvas.height=dimensions[1];ctx.imageSmoothingEnabled=false;drawWorld();}
    return {images,renders,state:JSON.stringify(createSaveData().state),storage:JSON.stringify({...localStorage}),
      candidate:Object.entries(characterMasterOriginals).every(([key,v])=>characterLayerImgs[key]===v.candidate)};
  });
  for(const {name,png} of result.images)fs.writeFileSync(path.join(output,`${name}-all-characters-outfits-directions.png`),Buffer.from(png.split(',')[1],'base64'));
  assert.equal(result.renders,192);assert.equal(result.candidate,true);
  assert.equal(result.state,initial.state);assert.equal(result.storage,initial.storage);
  const layering=await page.evaluate(()=>{
    const appearance=getCharacterRenderAppearance(),tool=characterToolImgs[appearance.activeToolId||'axe.basic']||characterToolImgs['axe.basic'];
    const original=ctx.drawImage,orders={};
    try{
      ctx.drawImage=function(image,...args){
        if(image===tool)orders.current.push('axe');
        if(image===characterLayerImgs.femaleWalkHair)orders.current.push('hair');
        return original.call(this,image,...args);
      };
      for(const mode of ['candidate','original'])for(const face of ['down','right','left','up'])
        for(const [pose,frame] of [['walk',0],['chop',0],['chop',1]]){
        setCharacterMasterPreview(mode);orders.current=[];
        drawCharacterActor(100,100,{pose,face,frame,tool:'axe'});
        orders[`${mode}-${pose}-${frame}-${face}`]=orders.current;
      }
    }finally{ctx.drawImage=original;setCharacterMasterPreview('candidate');drawWorld();delete orders.current;}
    return orders;
  });
  for(const [pose,frame] of [['walk',0],['chop',0],['chop',1]]){
    for(const face of ['down','right']){
      assert.deepEqual(layering[`candidate-${pose}-${frame}-${face}`],['hair','axe']);
      assert.deepEqual(layering[`original-${pose}-${frame}-${face}`],['axe','hair']);
    }
    for(const face of ['left','up'])
      assert.deepEqual(layering[`candidate-${pose}-${frame}-${face}`],['axe','hair']);
  }
  const narrow=await browser.newPage({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
  narrow.on('pageerror',error=>errors.push(error.message));
  await narrow.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await narrow.goto(base+'?character-master-preview&character-preview&character=female&time=12:00&weather=clear');
  await narrow.waitForFunction(()=>document.querySelector('[aria-label="캐릭터 제작 기준 시험"]'));
  await narrow.evaluate(()=>{
    camX=Math.max(0,Math.min(WORLD_W-VIEW_W,player.px-VIEW_W/2));
    camY=Math.max(0,Math.min(WORLD_H-VIEW_H,player.py-VIEW_H/2));drawWorld();
  });
  const narrowBounds=await narrow.evaluate(()=>{
    const panel=document.querySelector('[aria-label="캐릭터 제작 기준 시험"]');
    return {panel:panel.getBoundingClientRect().toJSON(),buttons:[...panel.querySelectorAll('button')].map(button=>button.getBoundingClientRect().toJSON()),width:innerWidth};
  });
  assert(narrowBounds.panel.right<=narrowBounds.width&&narrowBounds.buttons.every(button=>button.right<=narrowBounds.width));
  assert.equal(await narrow.getByRole('button',{name:'기준·걸음 비교 열기 ▼'}).getAttribute('aria-expanded'),'false');
  await narrow.screenshot({path:path.join(output,'candidate-mobile-320.png')});
  await narrow.getByRole('button',{name:'기준·걸음 비교 열기 ▼'}).click();
  await narrow.getByRole('button',{name:'현재',exact:true}).click();
  assert.equal(await narrow.getByRole('button',{name:'기준·걸음 비교 열기 ▼'}).getAttribute('aria-expanded'),'false');
  await narrow.getByRole('button',{name:'기준·걸음 비교 열기 ▼'}).click();
  await narrow.getByRole('button',{name:'새 기준',exact:true}).click();
  await narrow.getByRole('button',{name:'기준·걸음 비교 열기 ▼'}).click();
  await narrow.getByRole('button',{name:'불꽃',exact:true}).click();
  assert.equal(await narrow.evaluate(()=>getCharacterRenderAppearance().outfitId),'outfit.ember');
  const standalone=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  standalone.on('pageerror',error=>errors.push(error.message));
  await standalone.goto(base+'?character-master-preview&time=12:00&weather=clear');
  await standalone.waitForFunction(()=>document.querySelector('[aria-label="캐릭터 제작 기준 시험"]'));
  assert(await standalone.evaluate(()=>CHARACTER_BODY_PREVIEW_ENABLED&&characterBodyPreview==='female'&&
    characterWalkPreview==='soft'&&!document.querySelector('[aria-label="캐릭터 동작 비교"]')&&
    !document.querySelector('[aria-label="아래 걷기 순서 비교"]')));
  const normal=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  normal.on('pageerror',error=>errors.push(error.message));
  await normal.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await normal.goto(base+'?character-preview&character=female&time=12:00&weather=clear');
  await normal.waitForFunction(()=>characterLayerImgs.femaleFishHair&&document.querySelector('[aria-label="캐릭터 동작 비교"]'));
  assert(await normal.evaluate(()=>!CHARACTER_MASTER_PREVIEW_ENABLED&&
    !CHARACTER_WALK_PREVIEW_ENABLED&&
    !document.querySelector('[aria-label="캐릭터 제작 기준 시험"]')&&
    Object.keys(characterMasterOriginals).length===0&&
    characterLayerImgs.femaleWalkHead instanceof HTMLImageElement&&
    characterLayerImgs.walkBody instanceof HTMLImageElement&&
    (characterLayerImgs.femaleWalkHead.src.includes('/character-baseline-v2/')||
      characterLayerImgs.femaleWalkHead.src.startsWith('data:image/png'))&&
    [0,2,-1].every((offset,frame)=>getCharacterWalkAlignment({pose:'walk',face:'down',frame})===offset)&&
    [0,-1,1].every((offset,frame)=>getCharacterWalkHeadAlignment({pose:'walk',face:'down',frame})===offset)));
  assert.deepEqual(await normal.evaluate(()=>{
    const original=ctx.drawImage,order=[];
    try{
      ctx.drawImage=function(image,...args){
        if(image===characterLayerImgs.femaleWalkHair)order.push('hair');
        if(image===characterToolImgs['axe.basic'])order.push('axe');
        return original.call(this,image,...args);
      };
      drawCharacterActor(100,100,{pose:'walk',face:'right',frame:0,tool:'axe'});
      return order;
    }finally{ctx.drawImage=original;drawWorld();}
  }),['hair','axe']);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${initial.checked} versioned baseline atlases, ${result.renders} live renders, 393/320 mobile switching, saves and promoted normal gait/depth.`);
}finally{await browser.close();}
