// Read-only visual comparison of Ria's front-facing neck registration.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/ria-neck-horizontal');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:4173/?character-preview&character=female&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterLayerImgs.femaleFishHair&&characterOutfitPreviewImgs['outfit.meadow']?.fish);
  const png=await page.evaluate(()=>{
    const keys=['femaleWalkHead','femaleWalkHair','femaleChopHead','femaleChopHair','femaleFishHead','femaleFishHair'];
    const original=Object.fromEntries(keys.map(key=>[key,characterLayerImgs[key]]));
    const appearance={...GAME_STATE.appearance},dimensions=[canvas.width,canvas.height],oldTool=drawCharacterTool;
    const shiftFront=(image,dx)=>{
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const painter=c.getContext('2d');painter.imageSmoothingEnabled=false;
      for(let frame=0;frame<image.width/96;frame++)painter.drawImage(image,frame*96,0,96,96,frame*96+dx,0,96,96);
      painter.drawImage(image,0,96,image.width,288,0,96,image.width,288);
      return c;
    };
    const variants=[['current',0,0],['Head +1',1,0],['Head +2',2,0],['Head/Hair +1',1,1],['Head/Hair +2',2,2]];
    canvas.width=1000;canvas.height=1900;ctx.imageSmoothingEnabled=false;drawCharacterTool=()=>{};
    try{
      GAME_STATE.appearance.bodyId='body.female';GAME_STATE.appearance.hairId='hair.female.brown';
      GAME_STATE.appearance.outfitId='outfit.traveler';GAME_STATE.appearance.backpackId='pack.traveler';
      setCharacterBodyPreview('female');
      for(let row=0;row<variants.length;row++){
        const [label,hx,ax]=variants[row];
        for(const key of keys)characterLayerImgs[key]=shiftFront(original[key],key.endsWith('Head')?hx:ax);
        ctx.fillStyle='#78a582';ctx.fillRect(0,row*380,1000,380);
        ctx.fillStyle='#12322b';ctx.font='22px sans-serif';ctx.fillText(label,10,row*380+30);
        for(let i=0;i<2;i++){
          ctx.save();ctx.translate(220+i*480,row*380+315);ctx.scale(3.6,3.6);
          drawCharacterActor(0,0,{pose:'walk',face:'down',frame:i,tool:'axe'});ctx.restore();
        }
      }
      return canvas.toDataURL('image/png');
    }finally{
      Object.assign(characterLayerImgs,original);Object.assign(GAME_STATE.appearance,appearance);
      drawCharacterTool=oldTool;canvas.width=dimensions[0];canvas.height=dimensions[1];ctx.imageSmoothingEnabled=false;
    }
  });
  fs.writeFileSync(path.join(output,'five-variants.png'),Buffer.from(png.split(',')[1],'base64'));
  console.log('Wrote Ria neck-axis comparison with five actual-render variants');
}finally{await browser.close();}
