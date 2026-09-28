// Visual fitting sheet only; all candidates use the actual in-game compositor.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/ria-side-fit');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:4173/?character-preview&character=female&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterLayerImgs.femaleFishHair&&characterOutfitPreviewImgs['outfit.meadow']?.fish);
  const png=await page.evaluate(()=>{
    const keys=['femaleWalkHead','femaleWalkHair','femaleChopHead','femaleChopHair','femaleFishHead','femaleFishHair'];
    const originals=Object.fromEntries(keys.map(key=>[key,characterLayerImgs[key]]));
    const appearance={...GAME_STATE.appearance},dimensions=[canvas.width,canvas.height],oldTool=drawCharacterTool;
    const variants=[['current',0,0,0],['side up 3',0,0,-3],['back 2 / up 3',-2,2,-3],['back 1 / up 3',-1,1,-3],['back 2 only',-2,2,0]];
    const translateSides=(image,right,left,dy)=>{
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const painter=c.getContext('2d');painter.imageSmoothingEnabled=false;
      for(let row=0;row<4;row++)for(let frame=0;frame<image.width/96;frame++){
        const dx=row===1?right:row===2?left:0,oy=row===1||row===2?dy:0;
        painter.drawImage(image,frame*96,row*96,96,96,frame*96+dx,row*96+oy,96,96);
      }
      return c;
    };
    canvas.width=1280;canvas.height=1800;ctx.imageSmoothingEnabled=false;drawCharacterTool=()=>{};
    try{
      GAME_STATE.appearance.bodyId='body.female';GAME_STATE.appearance.hairId='hair.female.brown';
      GAME_STATE.appearance.outfitId='outfit.traveler';GAME_STATE.appearance.backpackId='pack.traveler';
      setCharacterBodyPreview('female');
      for(let row=0;row<variants.length;row++){
        const [label,right,left,dy]=variants[row];
        for(const key of keys)characterLayerImgs[key]=translateSides(originals[key],right,left,dy);
        ctx.fillStyle='#78a582';ctx.fillRect(0,row*360,1280,360);
        ctx.fillStyle='#12322b';ctx.font='22px sans-serif';ctx.fillText(label,10,row*360+30);
        for(const [i,face] of ['right','left'].entries())for(const [j,pose] of ['walk','chop'].entries()){
          ctx.save();ctx.translate(130+i*620+j*270,row*360+300);ctx.scale(3,3);
          drawCharacterActor(0,0,{pose,face,frame:0,tool:'axe'});ctx.restore();
        }
      }
      return canvas.toDataURL('image/png');
    }finally{
      Object.assign(characterLayerImgs,originals);Object.assign(GAME_STATE.appearance,appearance);
      drawCharacterTool=oldTool;canvas.width=dimensions[0];canvas.height=dimensions[1];ctx.imageSmoothingEnabled=false;
    }
  });
  fs.writeFileSync(path.join(output,'five-variants.png'),Buffer.from(png.split(',')[1],'base64'));
  console.log('Wrote Ria side-view fitting sheet');
}finally{await browser.close();}
