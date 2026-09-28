// Diagnostic contact sheet: compare Ria's current collar against head/neck-only
// variants in the real compositor. This never changes game state or source art.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/ria-neck-fit');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:4173/?walk-preview&character-preview&character=female&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterLayerImgs.femaleFishHair&&characterOutfitPreviewImgs['outfit.meadow']?.fish);
  const png=await page.evaluate(async()=>{
    const keys=['femaleWalkHead','femaleWalkHair','femaleChopHead','femaleChopHair','femaleFishHead','femaleFishHair'];
    const originals=Object.fromEntries(keys.map(key=>[key,characterLayerImgs[key]]));
    const originalAppearance={...GAME_STATE.appearance},oldTool=drawCharacterTool;
    const dimensions=[canvas.width,canvas.height];
    const variants=[['current',0,false],['down 2',2,false],['down 4',4,false],['down 3 / bridge off',3,true],['v3 new art',0,false]];
    const v3={};for(const key of keys){
      const pose=key.includes('Walk')?'walk':key.includes('Chop')?'chop':'fish';
      const part=key.endsWith('Head')?'head':'hair';
      v3[key]=await loadImage(`assets/player/npc-ria-v3/${pose}-${part}.png`);
    }
    const shift=(image,dy,removeBridge)=>{
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const cctx=c.getContext('2d',{willReadFrequently:true});cctx.imageSmoothingEnabled=false;
      cctx.drawImage(image,0,dy);
      if(removeBridge){
        const pixels=cctx.getImageData(0,0,c.width,c.height);
        for(let row=0;row<4;row++)for(let frame=0;frame<c.width/96;frame++)
          for(let y=52+dy;y<=56+dy;y++)for(let x=42;x<=54;x++)
            pixels.data[((row*96+y)*c.width+frame*96+x)*4+3]=0;
        cctx.putImageData(pixels,0,0);
      }
      return c;
    };
    canvas.width=1500;canvas.height=1500;ctx.imageSmoothingEnabled=false;drawCharacterTool=()=>{};
    try{
      GAME_STATE.appearance.bodyId='body.female';GAME_STATE.appearance.hairId='hair.female.brown';
      GAME_STATE.appearance.outfitId='outfit.traveler';GAME_STATE.appearance.backpackId='pack.traveler';
      setCharacterBodyPreview('female');setCharacterWalkPreview('soft');
      const poses=[{pose:'walk',face:'down',frame:0,tool:'axe'},
        {pose:'walk',face:'down',frame:1,tool:'axe'},
        {pose:'walk',face:'right',frame:0,tool:'axe'},
        {pose:'walk',face:'up',frame:0,tool:'axe'}];
      for(let row=0;row<variants.length;row++){
        const [label,dy,removeBridge]=variants[row];
        for(const key of keys)characterLayerImgs[key]=label==='v3 new art'?v3[key]:shift(originals[key],dy,removeBridge&&key.endsWith('Head'));
        ctx.fillStyle='#78a582';ctx.fillRect(0,row*300,1500,300);
        ctx.fillStyle='#17342c';ctx.font='20px sans-serif';ctx.fillText(label,10,row*300+35);
        for(let i=0;i<poses.length;i++){
          ctx.save();ctx.translate(160+i*330,row*300+206);ctx.scale(3,3);
          drawCharacterActor(0,0,poses[i]);ctx.restore();
        }
      }
      return canvas.toDataURL('image/png');
    }finally{
      Object.assign(characterLayerImgs,originals);Object.assign(GAME_STATE.appearance,originalAppearance);
      drawCharacterTool=oldTool;canvas.width=dimensions[0];canvas.height=dimensions[1];ctx.imageSmoothingEnabled=false;
    }
  });
  fs.writeFileSync(path.join(output,'variants.png'),Buffer.from(png.split(',')[1],'base64'));
  console.log('Wrote actual-render Ria neck fitting variants');
}finally{await browser.close();}
