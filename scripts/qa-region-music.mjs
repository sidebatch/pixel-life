// Actual HTML audio playback, native loops and mobile map transitions.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/character-qa/music');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
  await page.goto(base+'?time=12:00&weather=clear');
  await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']);
  const before=await page.evaluate(()=>({state:JSON.stringify(GAME_STATE),paused:regionMusicPlayer.paused,
    unlocked:regionMusicUnlocked,track:regionMusicTrack,loop:regionMusicPlayer.loop}));
  if(!before.paused||before.unlocked||before.track!=='meadow'||!before.loop)throw new Error('Music autoplay/initial mapping incorrect');
  await page.evaluate(()=>drawWorld());
  await page.locator('#settingsBtn').tap();
  await page.waitForFunction(()=>!regionMusicPlayer.paused&&regionMusicPlayer.currentTime>.05&&Number.isFinite(regionMusicPlayer.duration),null,{polling:50});
  const tracks=[];
  const inspect=()=>page.evaluate(()=>({region:GAME_STATE.regionId,track:regionMusicTrack,paused:regionMusicPlayer.paused,
    duration:regionMusicPlayer.duration,loop:regionMusicPlayer.loop,volume:regionMusicPlayer.volume,src:regionMusicPlayer.currentSrc}));
  tracks.push(await inspect());
  await page.screenshot({path:path.join(output,'mobile-music-menu.png')});
  await page.locator('#menuMusicBtn').tap();
  if(!await page.evaluate(()=>regionMusicMuted&&regionMusicPlayer.paused&&
    localStorage.getItem(REGION_MUSIC_MUTE_KEY)==='true'))throw new Error('Music mute failed');
  await page.reload();
  await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']);
  if(!await page.evaluate(()=>regionMusicMuted&&regionMusicPlayer.paused))throw new Error('Mute not restored');
  await page.locator('#settingsBtn').tap();await page.locator('#menuMusicBtn').tap();
  await page.waitForFunction(()=>!regionMusicPlayer.paused&&regionMusicPlayer.currentTime>.05,null,{polling:50});
  await page.locator('#closeMenu').tap();
  await page.evaluate(()=>{window.__musicPlayer=regionMusicPlayer;
    enterWorldRegion(REGION_EXITS.lilacVillage.find(exit=>exit.to==='oldForest'));});
  await page.waitForFunction(()=>regionMusicTrack==='woodland'&&!regionMusicPlayer.paused&&regionMusicPlayer.currentTime>.05,null,{polling:50});
  tracks.push(await inspect());
  const continuity=await page.evaluate(()=>{
    const before=regionMusicPlayer.currentTime;
    enterWorldRegion(REGION_EXITS.oldForest.find(exit=>exit.to==='deepForest'));
    return {before,after:regionMusicPlayer.currentTime,same:regionMusicPlayer===window.__musicPlayer,
      track:regionMusicTrack,paused:regionMusicPlayer.paused};
  });
  if(!continuity.same||continuity.paused||continuity.track!=='woodland'||continuity.after<continuity.before)
    throw new Error('Forest music restarted or duplicated');
  await page.evaluate(()=>{
    enterWorldRegion(REGION_EXITS.deepForest[0]);
    enterWorldRegion(REGION_EXITS.oldForest.find(exit=>exit.to==='lilacVillage'));
    enterWorldRegion(REGION_EXITS.lilacVillage.find(exit=>exit.to==='sunnyFields'));
  });
  await page.waitForFunction(()=>regionMusicTrack==='lakeside'&&!regionMusicPlayer.paused&&regionMusicPlayer.currentTime>.05,null,{polling:50});
  tracks.push(await inspect());
  // Seek to each file's actual tail and observe the browser loop wrap.
  for(const region of ['sunnyFields','lilacVillage','oldForest']){
    await page.evaluate(region=>{GAME_STATE.regionId=region;syncRegionMusic();},region);
    await page.waitForFunction(()=>!regionMusicPlayer.paused&&Number.isFinite(regionMusicPlayer.duration)&&regionMusicPlayer.readyState>=2,null,{polling:50});
    await page.evaluate(()=>{regionMusicPlayer.currentTime=regionMusicPlayer.duration-.3;});
    await page.waitForFunction(()=>regionMusicPlayer.currentTime>regionMusicPlayer.duration-1,null,{polling:25,timeout:10000});
    await page.waitForFunction(()=>regionMusicPlayer.currentTime<2&&!regionMusicPlayer.paused,null,{polling:50,timeout:10000});
  }
  const sfx=await page.evaluate(()=>{
    const player=regionMusicPlayer,track=regionMusicTrack;
    const effect=playFishingCastSound();
    return {effect,samePlayer:regionMusicPlayer===player,sameTrack:regionMusicTrack===track,playing:!regionMusicPlayer.paused};
  });
  if(!sfx.effect||!sfx.samePlayer||!sfx.sameTrack||!sfx.playing)throw new Error('Fishing sound interrupted music');
  const lifecycle=await page.evaluate(()=>{
    const before=regionMusicPlayer.currentTime;
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
    const paused=regionMusicPlayer.paused;
    Object.defineProperty(document,'hidden',{configurable:true,value:false});
    document.dispatchEvent(new Event('visibilitychange'));
    return {paused,before,after:regionMusicPlayer.currentTime};
  });
  await page.waitForFunction(()=>!regionMusicPlayer.paused,null,{polling:50});
  if(!lifecycle.paused||lifecycle.after<lifecycle.before)throw new Error('Visibility pause/resume failed');
  if(tracks.some(track=>track.paused||!track.loop||track.volume!==.3||Math.abs(track.duration-360)>.2))
    throw new Error('Wrong music duration/loop/volume');
  // Save/reload a real region and confirm initial music follows restored location.
  await page.evaluate(()=>{GAME_STATE.regionId='sunnyFields';saveGame();});
  await page.reload();
  await page.waitForFunction(()=>typeof characterOutfitImgs!=='undefined'&&characterOutfitImgs['outfit.traveler']);
  if(!await page.evaluate(()=>GAME_STATE.regionId==='sunnyFields'&&regionMusicTrack==='lakeside'&&!regionMusicMuted))
    throw new Error('Saved location music mapping failed');
  await page.locator('#settingsBtn').tap();await page.waitForFunction(()=>!regionMusicPlayer.paused,null,{polling:50});
  if(errors.length)throw new Error(errors.join('\n'));
  const report={tracks,continuity,nativeLoopAllThree:true,muteReload:true,visibilityPauseResume:lifecycle,
    effectsAlongsideMusic:sfx,savedRegionRestored:true,browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Region music browser QA passed: 3 actual 6-minute tracks, native loops, transitions, mute, saved region and effects.');
}finally{await browser.close();}
