// Actual browser QA for the palette-only trial set and all eight part combinations.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const output=path.resolve(process.argv[2]||'output/appearance-qa');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:1100,height:900}});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base+'?appearance-preview&time=12:00&weather=clear');
  await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.trial.green']);
  const alpha=await page.evaluate(()=>{
    const raster=image=>{
      const surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;
      const painter=surface.getContext('2d');painter.drawImage(image,0,0);
      return painter.getImageData(0,0,surface.width,surface.height).data;
    };
    let changedLayers=0;
    for(const pose of ['walk','chop','fish'])for(const name of ['Outfit','Hair','Backpack']){
      const original=characterLayerImgs[pose+name],trial=name==='Outfit'?
        characterOutfitImgs[CHARACTER_TRIAL_SET.outfitId][pose]:
        characterLayerImgs['trial'+pose[0].toUpperCase()+pose.slice(1)+name];
      if(original.width!==trial.width||original.height!==trial.height)throw new Error('Wrong trial dimensions');
      const a=raster(original),b=raster(trial);let changes=0;
      for(let p=0;p<a.length;p+=4){
        if(a[p+3]!==b[p+3])throw new Error('Trial geometry/alpha changed: '+pose+name);
        if(a[p+3]&&(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]))changes++;
      }
      if(changes<30)throw new Error('Trial layer is not visibly different: '+pose+name);
      changedLayers++;
    }
    return {layers:changedLayers,alphaIdentical:true};
  });
  const reports=[];
  for(let mask=0;mask<8;mask++){
    const result=await page.evaluate(mask=>{
      const parts=['outfitId','hairId','backpackId'].filter((_,i)=>mask&(1<<i));
      const before=JSON.stringify(GAME_STATE);
      setCharacterAppearancePreview(parts);
      const appearance=getCharacterRenderAppearance(),calls=[],originalDraw=ctx.drawImage.bind(ctx);
      let poses=0,toolChecks=0;
      ctx.drawImage=(image,...args)=>{calls.push({image,args});return originalDraw(image,...args);};
      canvas.width=1100;canvas.height=900;
      canvas.style.cssText='position:relative;width:1100px;height:900px;max-width:none;max-height:none;';
      document.body.style.cssText='margin:0;background:#172f30;display:block;overflow:auto;';
      document.body.appendChild(canvas);
      for(const element of document.body.children)if(element!==canvas)element.style.display='none';
      ctx.imageSmoothingEnabled=false;ctx.fillStyle='#73a07a';ctx.fillRect(0,0,1100,900);
      ctx.fillStyle='#102b2c';ctx.font='16px sans-serif';ctx.fillText('Trial mix '+mask+': '+(parts.join(', ')||'default'),25,22);
      try{
        for(const [p,pose] of ['walk','chop','fish'].entries()){
          const definition=CHARACTER_RIG.poses[pose];
          for(const [row,face] of ['down','right','left','up'].entries())for(let frame=0;frame<definition.columns;frame++){
            const action={pose,face,frame,tool:pose==='fish'?'rod':'axe'},x=65+p*350+frame*105,y=125+row*140;
            calls.length=0;drawCharacterActor(x,y,action);poses++;
            const hairPose=pose==='chop'?'walk':pose;
            const hair=characterLayerImgs[CHARACTER_PARTS.hair.get(appearance.hairId)[hairPose+'Hair']];
            const pack=characterLayerImgs[CHARACTER_PARTS.backpack.get(appearance.backpackId)[pose+'Backpack']];
            const outfit=characterOutfitImgs[appearance.outfitId][pose];
            if(!calls.some(call=>call.image===hair)||!calls.some(call=>call.image===pack)||!calls.some(call=>call.image===outfit))
              throw new Error('Part did not switch: '+mask+'/'+pose+'/'+face+'/'+frame);
            const selected=getCharacterToolTransform(x,y,action);
            setCharacterAppearancePreview(null);const standard=getCharacterToolTransform(x,y,action);
            setCharacterAppearancePreview(parts);
            if(JSON.stringify(selected)!==JSON.stringify(standard))throw new Error('Appearance moved the weapon');
            toolChecks++;
          }
        }
      }finally{ctx.drawImage=originalDraw;}
      if(JSON.stringify(GAME_STATE)!==before)throw new Error('Preview mutated save state');
      const normalized=normalizeSavedAppearance({...GAME_STATE.appearance,...CHARACTER_TRIAL_SET,
        ownedOutfitIds:[...GAME_STATE.appearance.ownedOutfitIds,CHARACTER_TRIAL_SET.outfitId]});
      if(normalized.outfitId===CHARACTER_TRIAL_SET.outfitId||normalized.hairId===CHARACTER_TRIAL_SET.hairId||
        normalized.backpackId===CHARACTER_TRIAL_SET.backpackId)throw new Error('Test-only IDs accepted into saved appearance');
      return {mask,parts,poses,toolChecks,gameStateUnchanged:true};
    },mask);
    reports.push(result);
    await page.locator('#game').screenshot({path:path.join(output,'combination-'+mask+'.png')});
  }
  const phone=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const mobile=await phone.newPage();mobile.on('pageerror',error=>errors.push(error.message));
  await mobile.goto(base+'?appearance-preview&time=12:00&weather=clear');
  await mobile.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.trial.green']);
  for(const button of ['기본','옷','머리','가방','전체']){
    await mobile.getByRole('button',{name:button,exact:true}).tap();
    const parts=await mobile.evaluate(()=>Object.keys(characterAppearancePreview||{}));
    const expected={'기본':[],'옷':['outfitId'],'머리':['hairId'],'가방':['backpackId'],'전체':['outfitId','hairId','backpackId']}[button];
    if(JSON.stringify(parts)!==JSON.stringify(expected))throw new Error('Mobile preview button failed: '+button);
  }
  await mobile.screenshot({path:path.join(output,'mobile-trial.png')});
  const stored=await mobile.evaluate(()=>{
    const expected=JSON.stringify(GAME_STATE.appearance);
    if(!saveGame())throw new Error('Preview game save failed');
    const actual=JSON.parse(localStorage.getItem(SAVE_CONFIG.key)).state.appearance;
    if(JSON.stringify(actual)!==expected)throw new Error('Preview leaked into saved appearance');
    return actual;
  });
  await mobile.goto(base+'?time=12:00&weather=clear');
  await mobile.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']);
  const ordinary=await mobile.evaluate(()=>({appearance:GAME_STATE.appearance,trialEnabled:CHARACTER_TRIAL_ENABLED,
    trialRegistered:CHARACTER_OUTFIT_BY_ID.has('outfit.trial.green'),preview:characterAppearancePreview}));
  if(JSON.stringify(ordinary.appearance)!==JSON.stringify(stored)||ordinary.trialEnabled||ordinary.trialRegistered||ordinary.preview)
    throw new Error('Leaving preview changed appearance or exposed trial items');
  if(errors.length)throw new Error(errors.join('\n'));
  const report={...alpha,combinations:reports,posesChecked:reports.reduce((sum,item)=>sum+item.poses,0),
    mobileButtons:true,saveAndOrdinaryLinkSafe:true,browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Appearance QA passed: '+report.posesChecked+' poses across 8 combinations; exact alpha; save safe. Screenshots: '+output);
}finally{await browser.close();}
