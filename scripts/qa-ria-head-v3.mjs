// Compare the previous Ria art to the new registered head/hair in the actual
// renderer while confirming that the common body, outfits and save IDs stay put.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/ria-head-v3');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
  const compareOld=!base.startsWith('https://');
  await page.goto(base+'?walk-preview&character-preview&character=female&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterLayerImgs.femaleFishHair&&characterOutfitPreviewImgs['outfit.meadow']?.fish);
  const result=await page.evaluate(async compareOld=>{
    const before=JSON.stringify(createSaveData().state),store=JSON.stringify({...localStorage});
    const paths={};for(const pose of ['walk','chop','fish'])for(const part of ['Head','Hair']){
      const key='female'+pose[0].toUpperCase()+pose.slice(1)+part;
      paths[key]=characterLayerImgs[key];
      if(compareOld&&!paths[key].src.includes('/npc-ria-v3/'))throw Error(`Ria ${key} not registered`);
    }
    const old={};if(compareOld)for(const pose of ['walk','chop','fish'])for(const part of ['Head','Hair']){
      const key='female'+pose[0].toUpperCase()+pose.slice(1)+part;
      old[key]=await loadImage(`assets/player/npc-v1/${pose}-female-${part.toLowerCase()}.png`);
    }
    const rows=compareOld?[['old',old],['new',paths]]:[['new',paths]],poses=[
      ...[0,1,2].map(frame=>({pose:'walk',face:'down',frame,tool:'axe'})),
      {pose:'walk',face:'right',frame:0,tool:'axe'},
      {pose:'walk',face:'up',frame:0,tool:'axe'}];
    const appearance={...GAME_STATE.appearance},dimensions=[canvas.width,canvas.height],oldTool=drawCharacterTool;
    canvas.width=1200;canvas.height=570;ctx.imageSmoothingEnabled=false;drawCharacterTool=()=>{};
    ctx.fillStyle='#78a582';ctx.fillRect(0,0,1200,570);
    let count=0;
    try{
      GAME_STATE.appearance.bodyId='body.female';GAME_STATE.appearance.hairId='hair.female.brown';
      GAME_STATE.appearance.outfitId='outfit.traveler';GAME_STATE.appearance.backpackId='pack.traveler';
      setCharacterBodyPreview('female');setCharacterWalkPreview('soft');
      for(let row=0;row<rows.length;row++){
        for(const [key,image] of Object.entries(rows[row][1]))characterLayerImgs[key]=image;
        ctx.fillStyle='#13342e';ctx.font='22px sans-serif';ctx.fillText(rows[row][0],8,48+row*270);
        for(let i=0;i<poses.length;i++){
          const pose=poses[i],x=125+i*225,y=190+row*270;
          ctx.save();ctx.translate(x,y);ctx.scale(2,2);
          drawCharacterActor(0,0,pose);ctx.restore();count++;
        }
      }
    }finally{
      Object.assign(characterLayerImgs,paths);Object.assign(GAME_STATE.appearance,appearance);
      drawCharacterTool=oldTool;
    }
    const png=canvas.toDataURL('image/png');
    canvas.width=dimensions[0];canvas.height=dimensions[1];ctx.imageSmoothingEnabled=false;
    if(JSON.stringify(createSaveData().state)!==before||JSON.stringify({...localStorage})!==store)throw Error('Ria art QA changed save');
    return {png,count,sourcePaths:Object.values(paths).map(image=>image.src.startsWith('data:')?'inlined':image.src),stateUnchanged:true};
  },compareOld);
  assert.equal(result.count,compareOld?10:5);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,compareOld?'old-vs-new-soft-walk.png':'new-public-soft-walk.png'),Buffer.from(result.png.split(',')[1],'base64'));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({count:result.count,sourcePaths:result.sourcePaths,stateUnchanged:result.stateUnchanged,browserErrors:errors},null,2));
  console.log(`PASS: Ria v3 head/hair on the same body in ${result.count} actual-render poses; save unchanged.`);
}finally{await browser.close();}
