import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/',out=path.resolve(process.argv[2]||'output/actor-standard-qa/browser');fs.mkdirSync(out,{recursive:true});
const previous=execFileSync('git',['show','57317c4:src/rendering.js'],{encoding:'utf8'}),legacyNpc=previous.slice(previous.indexOf('function drawNPC(npc){'),previous.indexOf('function forestryPlayerDrawDepth'));
const oldAssets=execFileSync('git',['show','57317c4:src/assets.js'],{encoding:'utf8'});
const legacyUrls=Object.fromEntries(Object.entries(Function(oldAssets+';return NPC_SHEET_URLS;')()).map(([id,file])=>[id,'data:image/png;base64,'+fs.readFileSync(file).toString('base64')]));
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined}),errors=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!document.getElementById('startupLoading'));
  const result=await page.evaluate(async({legacyNpc,legacyUrls})=>{
    const oldImages={};await Promise.all(Object.entries(legacyUrls).map(([id,url])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{oldImages[id]=img;resolve();};img.onerror=()=>reject(Error('Cannot load legacy comparison '+id));img.src=url;})));
    const originalState=JSON.stringify(GAME_STATE),originalPlayer={...player},originalCam=[camX,camY],originalTime=tNow,originalTool=drawCharacterTool,originalSize=[canvas.width,canvas.height];
    const originalNpcImages={...npcImgs},oldDraw=Function(`return (${legacyNpc})`)(),faces=['down','left','right','up'];
    const makeBoard=old=>{
      const ids=Object.keys(NPC_SHEET_URLS),columns=ids.length+2;
      canvas.width=columns*120;canvas.height=640;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#315945';ctx.fillRect(0,0,canvas.width,640);camX=camY=0;player.x=player.y=999;
      Object.assign(npcImgs,old?oldImages:originalNpcImages);
      for(let row=0;row<4;row++)for(let col=0;col<columns;col++){
        const x=col*120+60,y=row*150+100;
        for(const [line,color] of [[y+20,'#e6d56e88'],[y+20+(54-88)*100/96,'#add5e855']]){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x-48,line);ctx.lineTo(x+48,line);ctx.stroke();}
        if(col<ids.length)(old?oldDraw:drawNPC)({sprite:ids[col],name:ids[col],scale:1,px:x,py:y,x:0,y:0,face:faces[row],moving:false});
        else{Object.assign(GAME_STATE.appearance,{bodyId:col===ids.length?'body.starter':'body.female',hairId:col===ids.length?'hair.brown':'hair.female.brown',outfitId:'outfit.traveler',backpackId:'pack.traveler'});drawCharacterActor(x,y,{pose:'walk',face:faces[row],frame:0,tool:'none'});}
        ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText((ids[col]||['Ian','Ria'][col-ids.length])+' '+faces[row],x,y+45);
      }return canvas.toDataURL();
    };
    const boards={before:makeBoard(true),after:makeBoard(false)};Object.assign(npcImgs,originalNpcImages);
    const npcChecks=[],nativeDraw=ctx.drawImage.bind(ctx);
    for(const sprite of Object.keys(NPC_SHEET_URLS))for(let row=0;row<4;row++)for(let frame=0;frame<3;frame++){
      tNow=frame*120;let call;ctx.drawImage=(...args)=>{call=args;nativeDraw(...args);};
      try{drawNPC({sprite,name:sprite,scale:1,px:200,py:200,x:0,y:0,face:faces[row],moving:true});}finally{ctx.drawImage=nativeDraw;}
      const [,sx,sy,sw,sh,dx,dy,w,h]=call;
      if(sx!==frame*96||sy!==row*96||sw!==96||sh!==96||w!==100||h!==100||Math.abs(dx+48*w/96-200)>.5||Math.abs(dy+88*h/96-220)>.5)throw Error('NPC draw registration '+sprite);
      npcChecks.push({sprite,row,frame,feetY:dy+88*h/96});
    }
    canvas.width=canvas.height=192;ctx.imageSmoothingEnabled=false;drawCharacterTool=()=>{};const checks=[];
    try{for(const sex of ['male','female'])for(const outfit of CHARACTER_OUTFITS.filter(o=>!o.testOnly))for(const pack of CHARACTER_PARTS.backpack.keys()){
      Object.assign(GAME_STATE.appearance,{bodyId:sex==='male'?'body.starter':'body.female',hairId:sex==='male'?'hair.brown':'hair.female.brown',outfitId:outfit.id,backpackId:pack});
      for(const pose of ['walk','chop','fish','sword','sickle'])for(const face of faces)for(let frame=0;frame<(pose==='sword'||pose==='sickle'?2:CHARACTER_RIG.poses[pose].columns);frame++){
        ctx.clearRect(0,0,192,192);drawCharacterActor(96,120,{pose,face,frame,tool:pose==='fish'?'rod':pose==='sword'?'sword':pose==='sickle'?'sickle':'axe'});
        const pixels=ctx.getImageData(0,0,192,192).data,seen=new Uint8Array(192*192);let total=0,largest=0,bottom=0;
        for(let start=0;start<seen.length;start++){
          if(seen[start]||pixels[start*4+3]<80)continue;const queue=[start];seen[start]=1;
          for(let at=0;at<queue.length;at++){
            const n=queue[at],x=n%192,y=Math.floor(n/192);bottom=Math.max(bottom,y+1);
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              const xx=x+dx,yy=y+dy,next=yy*192+xx;
              if(xx<0||yy<0||xx>=192||yy>=192||seen[next]||pixels[next*4+3]<80)continue;seen[next]=1;queue.push(next);
            }
          }total+=queue.length;largest=Math.max(largest,queue.length);
        }
        if(!total||largest/total<.97)throw Error('Detached actor '+JSON.stringify({sex,outfit:outfit.id,pack,pose,face,frame,total,largest}));
        if(bottom<138||bottom>142)throw Error('Player feet outside common registration '+JSON.stringify({pose,face,frame,bottom}));
        checks.push({sex,outfit:outfit.id,pack,pose,face,frame,bottom,connected:Number((largest/total).toFixed(4))});
      }
    }}finally{drawCharacterTool=originalTool;const state=JSON.parse(originalState);Object.keys(state).forEach(k=>GAME_STATE[k]=state[k]);Object.assign(player,originalPlayer);[camX,camY]=originalCam;tNow=originalTime;[canvas.width,canvas.height]=originalSize;ctx.imageSmoothingEnabled=false;}
    if(originalState!==JSON.stringify(GAME_STATE))throw Error('Audit modified player state');
    return {boards,checks,npcChecks,npcCount:Object.keys(NPC_SHEET_URLS).length,npcInstances:Object.values(REGION_WORLDS).reduce((n,w)=>n+(w.npcs||[]).length,0),
      expectedPlayers:2*CHARACTER_OUTFITS.filter(o=>!o.testOnly).length*CHARACTER_PARTS.backpack.size*(CHARACTER_RIG.poses.walk.columns+CHARACTER_RIG.poses.chop.columns+CHARACTER_RIG.poses.fish.columns+4)*4};
  },{legacyNpc,legacyUrls});
  assert.equal(result.checks.length,result.expectedPlayers);
  for(const [name,url] of Object.entries(result.boards))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
  // Actual desktop keys, visible hints, keypad/key-only fallback, typing and menu guards.
  await page.evaluate(()=>{enterWorldRegion({to:'lilacVillage',entry:{x:25,y:24,face:'down'}},{skipSave:true});});
  for(let number=1;number<=5;number++){
    await page.keyboard.press('Digit'+number);assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),['axe','rod','sickle','sword','none'][number-1]);
    assert(await page.locator('[data-quick-tool] kbd').nth(number-1).isVisible());
  }
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'2',code:'Numpad2',bubbles:true})));assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'rod');
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'4',bubbles:true})));assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'sword');
  await page.evaluate(()=>{const input=document.createElement('input');input.id='qaTyping';document.body.append(input);input.focus();});await page.keyboard.press('Digit1');
  assert.equal(await page.locator('#qaTyping').inputValue(),'1');assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'sword');await page.evaluate(()=>document.getElementById('qaTyping').remove());
  await page.evaluate(()=>openInventory());await page.keyboard.press('Digit2');assert.equal(await page.evaluate(()=>GAME_STATE.appearance.activeTool),'sword');await page.evaluate(()=>closeInventory({fromHistory:true}));
  await page.screenshot({path:path.join(out,'desktop-hotbar.png')});
  assert.equal(result.npcChecks.length,result.npcCount*12);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,npcSheets:result.npcCount,npcFrames:result.npcChecks.length,npcInstances:result.npcInstances,npcChecks:result.npcChecks,playerCombinations:result.checks.length,checks:result.checks,desktopKeys:[1,2,3,4,5],keypad:true,keyOnlyFallback:true,typingAndMenuGuards:true,errors},null,2)+'\n');
  console.log(`Actor standard browser passed: ${result.npcCount} NPCs/${result.npcChecks.length} frames/${result.npcInstances} instances and ${result.checks.length} player combinations, shared feet, connected head/body/wardrobe, before/after boards, actual desktop 1–5 and keypad/typing/menu guards.`);
}finally{await browser.close();}
