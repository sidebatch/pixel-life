// Compare one shared under-collar edit across both bodies and all current outfits.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve('output/character-qa/collar-fit');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME});
try{
  const page=await browser.newPage({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:4173/?character-preview&character=female&time=12:00&weather=clear');
  await page.waitForFunction(()=>characterLayerImgs.femaleFishHair&&characterOutfitPreviewImgs['outfit.meadow']?.fish);
  const png=await page.evaluate(()=>{
    const keys=['walkBody','chopBody','fishBody'];
    const originals=Object.fromEntries(keys.map(key=>[key,characterLayerImgs[key]]));
    const appearance={...GAME_STATE.appearance},dimensions=[canvas.width,canvas.height],oldTool=drawCharacterTool;
    const shorterCollar=image=>{
      const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
      const painter=c.getContext('2d',{willReadFrequently:true});painter.drawImage(image,0,0);
      const pixels=painter.getImageData(0,0,c.width,c.height),data=pixels.data;
      for(let frame=0;frame<image.width/96;frame++)for(let y=57;y<=59;y++)for(let x=45;x<=51;x++){
        const p=(y*c.width+frame*96+x)*4,src=(62*c.width+frame*96+x)*4;
        const [r,g,b,a]=data.subarray(p,p+4);
        if(a>=128&&r>150&&r>g*1.1&&g>b*1.05&&data[src+3]>=128)
          for(let channel=0;channel<3;channel++)data[p+channel]=data[src+channel];
      }
      painter.putImageData(pixels,0,0);return c;
    };
    const fitted=Object.fromEntries(keys.map(key=>[key,shorterCollar(originals[key])]));
    canvas.width=1980;canvas.height=830;ctx.imageSmoothingEnabled=false;drawCharacterTool=()=>{};
    try{
      ctx.fillStyle='#78a582';ctx.fillRect(0,0,1980,830);
      const outfits=['outfit.traveler','outfit.ember','outfit.meadow'];
      for(let row=0;row<2;row++){
        for(const key of keys)characterLayerImgs[key]=row?fitted[key]:originals[key];
        ctx.fillStyle='#12322b';ctx.font='24px sans-serif';ctx.fillText(row?'shorter shared collar':'current',8,42+row*400);
        for(let i=0;i<6;i++){
          setCharacterBodyPreview(i<3?'male':'female');GAME_STATE.appearance.outfitId=outfits[i%3];
          ctx.fillStyle='#12322b';ctx.font='17px sans-serif';ctx.fillText(`${i<3?'Ian':'Ria'} / ${outfits[i%3].split('.')[1]}`,i*330+15,row*400+85);
          ctx.save();ctx.translate(i*330+165,row*400+335);ctx.scale(3,3);
          drawCharacterActor(0,0,{pose:'walk',face:'down',frame:0,tool:'axe'});ctx.restore();
        }
      }
      return canvas.toDataURL('image/png');
    }finally{
      Object.assign(characterLayerImgs,originals);Object.assign(GAME_STATE.appearance,appearance);
      drawCharacterTool=oldTool;canvas.width=dimensions[0];canvas.height=dimensions[1];ctx.imageSmoothingEnabled=false;
    }
  });
  fs.writeFileSync(path.join(output,'outfits-comparison.png'),Buffer.from(png.split(',')[1],'base64'));
  console.log('Wrote shared collar fitting sheet');
}finally{await browser.close();}
