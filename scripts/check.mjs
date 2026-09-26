import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {decodePNG} from './lib/png.mjs';

const root = process.cwd();
const scriptFiles = [
  'src/assets.js',
  'src/data/character-rig-data.js',
  'src/data/world-map.js',
  'src/data/region-maps.js',
  'src/data/fish-data.js',
  'src/data/fishing-gear-data.js',
  'src/data/life-skill-data.js',
  'src/data/life-content-data.js',
  'src/world-time.js',
  'src/weather.js',
  'src/config.js',
  'src/life-skills.js',
  'src/save.js',
  'src/world.js',
  'src/world-validation.js',
  'src/simulation.js',
  'src/life-content.js',
  'src/debug.js',
  'src/rendering.js',
  'src/character.js',
  'src/interactions.js',
  'src/fishing-effects.js',
  'src/region-music.js',
  'src/fishing.js',
  'src/skill-ui.js',
  'src/fish-dex.js',
  'src/fishing-gear.js',
  'src/inventory.js',
  'src/market.js',
  'src/main.js'
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const html = read('index.html');
const scripts = scriptFiles.map(read).join('\n');
new Function(scripts);

const htmlIdList = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const htmlIds = new Set(htmlIdList);
assert(htmlIds.size === htmlIdList.length, 'HTML ids must be unique');
const freshContext={WORLD_DEFINITION:{tileSize:48,width:64,height:48},
  document:{getElementById:()=>({width:576,height:1024,getContext:()=>({})})},
  DEFAULT_FISHING_ROD_ID:'rod.basic',DEFAULT_FORESTRY_AXE_ID:'axe.basic'};
vm.createContext(freshContext);
vm.runInContext(`${read('src/assets.js')}\n${read('src/config.js')}\nglobalThis.__fresh=GAME_STATE;`,freshContext);
assert(freshContext.__fresh.progression.coins===0&&freshContext.__fresh.progression.fishing.level===1&&
  freshContext.__fresh.progression.logging.level===1&&
  freshContext.__fresh.progression.fishing.equippedRodId==='rod.basic'&&
  freshContext.__fresh.progression.forestry.axeId==='axe.basic'&&
  freshContext.__fresh.progression.forestry.ownedAxeIds.join(',')==='axe.basic'&&
  freshContext.__fresh.appearance.outfitId==='outfit.traveler'&&
  freshContext.__fresh.appearance.bodyId==='body.starter'&&
  freshContext.__fresh.appearance.hairId==='hair.brown'&&
  freshContext.__fresh.appearance.backpackId==='pack.traveler'&&
  freshContext.__fresh.appearance.activeTool==='axe',
  'A new browser session must start at zero coins, skill Lv.1, and starter gear');
assert(vm.runInContext("!CHARACTER_TRIAL_ENABLED&&CHARACTER_OUTFITS.length===3&&setCharacterAppearancePreview(['hairId'])===false",freshContext),
  'Ordinary game sessions must not expose or apply trial appearances');
const trialContext={...freshContext,window:{location:{search:'?appearance-preview'}},URLSearchParams};
assert(freshContext.__fresh.appearance.ownedOutfitIds.join(',')==='outfit.traveler,outfit.ember,outfit.meadow'&&
  freshContext.__fresh.appearance.ownedBackpackIds.join(',')==='pack.traveler,pack.ranger,pack.berry',
  'Temporary wardrobe must grant two distinct samples per slot without changing starter equipment');
vm.runInContext(read('src/save.js').match(/function normalizeSavedAppearance\([\s\S]*?(?=\nfunction createSaveData)/)[0]+`\n
  globalThis.__legacyWardrobe=normalizeSavedAppearance({outfitId:'outfit.traveler',backpackId:'pack.traveler',activeTool:'rod'});
  globalThis.__chosenWardrobe=normalizeSavedAppearance({outfitId:'outfit.meadow',backpackId:'pack.berry',activeTool:'rod'});
  globalThis.__wardrobeTrial=normalizeSavedAppearance({outfitId:'outfit.trial.green',backpackId:'pack.trial.red'});`,freshContext);
assert(freshContext.__legacyWardrobe.ownedOutfitIds.length===3&&freshContext.__legacyWardrobe.ownedBackpackIds.length===3&&
  freshContext.__legacyWardrobe.activeTool==='rod'&&freshContext.__legacyWardrobe.outfitId==='outfit.traveler'&&
  freshContext.__chosenWardrobe.outfitId==='outfit.meadow'&&freshContext.__chosenWardrobe.backpackId==='pack.berry'&&
  freshContext.__wardrobeTrial.outfitId==='outfit.traveler'&&freshContext.__wardrobeTrial.backpackId==='pack.traveler',
  'Legacy and selected temporary appearances must restore independently while trial IDs stay excluded');
vm.createContext(trialContext);
vm.runInContext(`${read('src/assets.js')}\n${read('src/config.js')}\n
  const trialBefore=JSON.stringify(GAME_STATE);
  globalThis.__trialValid=setCharacterAppearancePreview(['outfitId','hairId','backpackId']);
  globalThis.__trialAppearance=getCharacterRenderAppearance();
  globalThis.__trialInvalid=setCharacterAppearancePreview(['bodyId']);
  globalThis.__trialSafe=JSON.stringify(GAME_STATE)===trialBefore;
  setCharacterAppearancePreview(null);globalThis.__trialOff=getCharacterRenderAppearance();`,trialContext);
assert(trialContext.__trialValid&&!trialContext.__trialInvalid&&trialContext.__trialSafe&&
  trialContext.__trialAppearance.hairId==='hair.trial.blond'&&
  trialContext.__trialAppearance.outfitId==='outfit.trial.green'&&
  trialContext.__trialAppearance.backpackId==='pack.trial.red'&&
  trialContext.__trialOff.hairId==='hair.brown',
  'Trial parts must switch independently through appearance IDs without changing saved game state');
const usedIds = [...scripts.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
for (const id of usedIds) assert(htmlIds.has(id), `Missing HTML element: #${id}`);
assert((html.match(/role="tab"/g) || []).length === 14, 'Fish dex, inventory, appearance, and market tabs must be accessible');
assert(html.includes('id="fishDexScroll" role="tabpanel"'), 'Fish dex tab panel semantics are missing');
assert(html.includes('id="inventoryScroll" role="tabpanel"'), 'Inventory tab panel semantics are missing');
assert(html.includes('id="marketExitBtn" type="button">나가기</button>')&&
  read('src/market.js').includes("getElementById('marketExitBtn').addEventListener('click',closeMarket)"),
  'Market exit button must use the existing close behavior');
const menuMarkup=html.match(/<div id="menuPanel"[\s\S]*?(?=<div id="fishDexPanel")/)?.[0]||'';
assert((menuMarkup.match(/class="menuCard"/g)||[]).length===2&&
  ['openInventoryBtn','openFishDexBtn','menuBagIcon','menuFishDexIcon','menuDismiss','closeMenu'].every(id=>menuMarkup.includes(`id="${id}"`))&&
  !menuMarkup.includes('openFishingGearBtn')&&!html.includes('id="fishingGearPanel"')&&
  !menuMarkup.includes('디펜스')&&!menuMarkup.includes('마을 북쪽 숲')&&
  (menuMarkup.match(/<img /g)||[]).length===2&&!(menuMarkup.match(/<small>/g)||[]).length,
  'World menu must contain only the image-led bag and fish-dex cards');

const assetPaths = [...read('src/assets.js').matchAll(/['"](assets\/[^'"]+\.png)['"]/g)].map((match) => match[1]);
assert(assetPaths.length === 177, `Expected 177 runtime asset references, found ${assetPaths.length}`);
for (const assetPath of assetPaths) {
  assert(fs.existsSync(path.join(root, assetPath)), `Missing asset: ${assetPath}`);
}
const temporaryManifest=JSON.parse(read('assets/player/temporary-appearance/manifest.json'));
assert(temporaryManifest.cell===96&&Object.keys(temporaryManifest.designs).length===4,'Temporary appearance manifest must register four designs');
for(const [design,{type,frames,files}] of Object.entries(temporaryManifest.designs)){
  assert(frames===32&&files.length===4,'Each temporary design must have 32 poses and its own icon');
  for(const pose of ['walk','chop','fish']){
    const image=decodePNG(fs.readFileSync(`assets/player/temporary-appearance/${design}-${pose}.png`));
    const original=decodePNG(fs.readFileSync(`assets/player/rig-v1/${pose}-${type}.png`));
    assert(image.width===original.width&&image.height===original.height,`${design} ${pose} must preserve rig dimensions`);
    let visible=0,changed=0;
    for(let at=0;at<image.data.length;at+=4){
      if(type==='outfit')assert(image.data[at+3]===original.data[at+3],`${design} ${pose} changed garment coverage`);
      if(image.data[at+3]){visible++;if(image.data[at]!==original.data[at]||image.data[at+1]!==original.data[at+1]||image.data[at+2]!==original.data[at+2])changed++;}
    }
    assert(visible>100&&changed>visible*.25,`${design} ${pose} must have distinct visible artwork`);
  }
  const icon=decodePNG(fs.readFileSync(`assets/player/temporary-appearance/${design}-icon.png`));
  assert(icon.width===96&&icon.height===96&&icon.data.some((value,index)=>index%4===3&&value===0),`${design} must have its own transparent 96px icon`);
}
assert(assetPaths.includes('assets/buildings/elli_market.png')&&
  read('src/interactions.js').includes("case 'workshopMarket':return openMarket({shop:'workshop'})"),
  'Ellie and the workshop must use their own shop interactions');
const marketSprite=fs.readFileSync(path.join(root,'assets/buildings/elli_market.png'));
assert(marketSprite.readUInt32BE(16)===288&&marketSprite.readUInt32BE(20)===262&&marketSprite[25]===6,
  'Shop sprite must be a 288x262 transparent PNG');
for(const assetPath of assetPaths.filter(asset=>asset.startsWith('assets/forestry/')||asset.startsWith('assets/farming/'))){
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`Invalid PNG asset: ${assetPath}`);
  const actual=`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
  const expected=assetPath.includes('/axes/')?'1254x1254':assetPath.includes('/chop/')?'640x1280':
    assetPath.includes('/trees/')?'120x144':'96x96';
  assert(actual===expected,`Wrong life asset size: ${assetPath} (${actual}, expected ${expected})`);
  assert([4,6].includes(bytes[25]),`Life asset must have an alpha channel: ${assetPath}`);
}
for(const assetPath of assetPaths.filter(asset=>asset.startsWith('assets/fishing/rods/'))){
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes[25]===6,
    `Fishing rod sprite must be a transparent PNG: ${assetPath}`);
}
for(const assetPath of assetPaths.filter(asset=>asset.startsWith('assets/ui/menu/'))){
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes[25]===6,
    `Menu icon must be a transparent PNG: ${assetPath}`);
}
const cropCatalog=new Function(`${read('src/assets.js')}\n${read('src/data/life-content-data.js')}\nreturn {crops:LIFE_CONTENT.crops,items:LIFE_ITEM_URLS,young:YOUNG_CROP_URLS,mature:MATURE_CROP_URLS};`)();
assert(cropCatalog.crops.length===10&&new Set(cropCatalog.crops.map(crop=>crop.id)).size===10&&
  cropCatalog.crops.every(crop=>cropCatalog.items[`${crop.id}Seed`]&&cropCatalog.items[`${crop.id}Crop`]&&
    cropCatalog.young[crop.id]&&cropCatalog.mature[crop.id]&&crop.seedPrice>0&&crop.sellPrice>0&&
    crop.harvestMin>=1&&crop.harvestMax>=crop.harvestMin),
  'Every playable crop must have unique data and four matching sprite types');
for(const species of ['oak','pine','birch','maple','spruce','willow','cypress','broadleaf']){
  assert(read('src/data/region-maps.js').includes(`species:'${species}'`),`Forest tree species missing: ${species}`);
}

for (const npc of ['mina', 'thomas', 'elli', 'noah', 'hana', 'jun']) {
  assert(read('src/data/world-map.js').includes(`id:'${npc}'`), `Missing NPC record: ${npc}`);
}

assert(!read('src/assets.js').includes('base64,'), 'Development asset map must not contain embedded images');
const fishingAudioPaths=[...read('src/fishing-effects.js').matchAll(/['"](assets\/fishing\/audio\/[a-z]+\.mp3)['"]/g)].map(match=>match[1]);
assert(fishingAudioPaths.length===3&&new Set(fishingAudioPaths).size===3,'Expected three distinct fishing audio clips');
const levelUpAudioPath='assets/audio/level-up.mp3';
assert(read('src/fishing-effects.js').includes(`'${levelUpAudioPath}'`),'Missing level-up audio mapping');
const marketSaleAudioPath='assets/audio/market-sale.mp3';
assert(read('src/fishing-effects.js').includes(`'${marketSaleAudioPath}'`),'Missing market sale audio mapping');
const gameAudioPaths=[...fishingAudioPaths,levelUpAudioPath,marketSaleAudioPath];
const musicProbe={players:[],events:{},storage:new Map()};
class FakeMusicAudio{
  constructor(){this.paused=true;this.currentTime=0;this.plays=0;this.loads=0;musicProbe.players.push(this);}
  load(){this.loads++;this.currentTime=0;}
  pause(){this.paused=true;}
  play(){this.paused=false;this.plays++;return Promise.resolve();}
  removeAttribute(){this.src='';}
}
const musicContext={GAME_STATE:{regionId:'lilacVillage'},Audio:FakeMusicAudio,
  document:{hidden:false,getElementById:()=>null,addEventListener:(name,fn)=>{musicProbe.events[name]=fn;}},
  window:{addEventListener:(name,fn)=>{musicProbe.events[name]=fn;}},
  localStorage:{getItem:key=>musicProbe.storage.get(key),setItem:(key,value)=>musicProbe.storage.set(key,value)}};
vm.createContext(musicContext);
vm.runInContext(read('src/region-music.js')+'\nglobalThis.musicUrls=REGION_MUSIC_URLS;',musicContext);
assert(musicProbe.players.length===1&&musicProbe.players[0].paused&&musicProbe.players[0].plays===0&&
  musicProbe.players[0].loop&&musicProbe.players[0].preload==='metadata'&&musicProbe.players[0].volume===.3,
  'Music must use one streaming loop player and wait for a trusted gesture');
for(const file of Object.values(musicContext.musicUrls)){
  const bytes=fs.readFileSync(path.join(root,file));
  assert(bytes.length>100000&&bytes.length<8000000&&
    (bytes.subarray(0,3).toString()==='ID3'||bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0),
    `Missing/invalid compressed region music: ${file}`);
}
musicProbe.events.pointerdown();await Promise.resolve();await Promise.resolve();await Promise.resolve();
assert(!musicProbe.players[0].paused&&musicProbe.players[0].src===musicContext.musicUrls.meadow,'Village music did not unlock');
musicContext.GAME_STATE.regionId='oldForest';vm.runInContext('syncRegionMusic()',musicContext);
await Promise.resolve();await Promise.resolve();await Promise.resolve();
musicProbe.players[0].currentTime=123;
const woodlandLoads=musicProbe.players[0].loads,woodlandPlays=musicProbe.players[0].plays;
musicContext.GAME_STATE.regionId='deepForest';vm.runInContext('syncRegionMusic()',musicContext);
assert(musicProbe.players[0].currentTime===123&&musicProbe.players[0].loads===woodlandLoads&&
  musicProbe.players[0].plays===woodlandPlays&&musicProbe.players[0].src===musicContext.musicUrls.woodland,
  'Forest 1-1/1-2 must continue the same woodland track without reloading');
vm.runInContext('toggleRegionMusic()',musicContext);
assert(musicProbe.players[0].paused&&musicProbe.storage.get('pixel-life.music-muted.v1')==='true','Music mute must persist separately');
musicContext.GAME_STATE.regionId='sunnyFields';vm.runInContext('syncRegionMusic()',musicContext);
assert(musicProbe.players[0].paused&&musicProbe.players[0].src===musicContext.musicUrls.lakeside,'Muted farm transition must not play');
vm.runInContext('toggleRegionMusic()',musicContext);
await Promise.resolve();await Promise.resolve();await Promise.resolve();
assert(!musicProbe.players[0].paused,'Unmuting must resume the current map track');
musicProbe.players[0].currentTime=23;musicContext.document.hidden=true;musicProbe.events.visibilitychange();
assert(musicProbe.players[0].paused,'Hidden tab must pause background music');
musicContext.document.hidden=false;musicProbe.events.visibilitychange();
await Promise.resolve();await Promise.resolve();await Promise.resolve();
assert(!musicProbe.players[0].paused&&musicProbe.players[0].currentTime===23&&musicProbe.players.length===1,
  'Returning to game must resume at the same position without duplicate players');
musicProbe.events.pagehide();assert(musicProbe.players[0].paused,'Pagehide must stop background music');
musicProbe.events.pageshow();await Promise.resolve();await Promise.resolve();await Promise.resolve();
assert(!musicProbe.players[0].paused&&read('src/world.js').includes("if(typeof syncRegionMusic==='function')syncRegionMusic();"),
  'Restored page and actual map transitions must sync region music');
const successfulMusicPlay=musicProbe.players[0].play;
musicProbe.players[0].play=()=>Promise.reject(new Error('Autoplay blocked'));
vm.runInContext('pauseRegionMusic();unlockRegionMusic()',musicContext);
await new Promise(resolve=>setImmediate(resolve));
assert(vm.runInContext('regionMusicPending===false',musicContext),'Rejected autoplay must release its pending play lock');
musicProbe.players[0].play=successfulMusicPlay;musicProbe.events.pointerdown();
assert(!musicProbe.players[0].paused,'A later trusted gesture must retry rejected music playback');
musicContext.GAME_STATE.regionId='unmappedRegion';vm.runInContext('syncRegionMusic()',musicContext);
assert(musicProbe.players[0].paused&&musicProbe.players[0].src==='','An unmapped region must not keep the previous map music');
for(const assetPath of gameAudioPaths){
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.length>1000&&bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0,`Invalid MP3 asset: ${assetPath}`);
}

const fishContext={};
vm.createContext(fishContext);
vm.runInContext(`${read('src/data/fish-data.js')}\nglobalThis.__fishData=FISH_DATA;globalThis.__fishRewards=FISH_COLLECTION_REWARDS;`,fishContext);
const fishData=fishContext.__fishData;
const fishRewards=fishContext.__fishRewards;
assert(fishData.length===20,`Expected 20 fish records, found ${fishData.length}`);
assert(new Set(fishData.map(fish=>fish.id)).size===fishData.length,'Fish ids must be unique');
assert(new Set(fishData.map(fish=>fish.asset)).size===fishData.length,'Fish asset keys must be unique');
assert(fishRewards.map(reward=>reward.count).join(',')==='5,10,15,19,20','Unexpected fish collection reward thresholds');
assert(fishRewards[0].label==='코인 300','Coin rewards should use a readable unit instead of G');

const fishingGearContext={};
vm.createContext(fishingGearContext);
vm.runInContext(`${read('src/data/fishing-gear-data.js')}\n`+
  `globalThis.__rods=FISHING_RODS;globalThis.__defaultRod=DEFAULT_FISHING_ROD_ID;`,fishingGearContext);
const fishingRods=fishingGearContext.__rods;
assert(fishingRods.map(rod=>rod.id).join(',')===
  'rod.basic,rod.sturdy,rod.steel,rod.expert,rod.master_angler,rod.deepwater','Unexpected fishing rod progression');
assert(fishingGearContext.__defaultRod==='rod.basic','Unexpected default fishing rod');
assert(fishingRods.every((rod,index)=>index===0||rod.waitReduction>=fishingRods[index-1].waitReduction),
  'Fishing rod wait bonuses must not decrease');
assert(fishingRods[4].requiresMasterReward&&fishingRods[4].rareWeightBonus===.35,
  'Master angler rod configuration failed');
assert(fishingRods.filter(rod=>rod.fishCost).every(rod=>rod.coins>0&&Object.keys(rod.fishCost).length>0&&
  Object.keys(rod.fishCost).every(id=>fishData.some(fish=>fish.id===id))),
  'Shop rods must have valid fish and coin recipes');
assert(fishingRods[1].coins===1800&&fishingRods[1].fishCost['fish.crucian_carp']===25&&
  fishingRods[2].coins===5200&&fishingRods[2].fishCost['fish.goldfish']===15&&
  fishingRods[3].coins===14000&&fishingRods[3].fishCost['fish.catfish']===10&&
  fishingRods[5].coins===45000&&fishingRods[5].unlockLevel===25&&fishingRods[5].requiresMasterRod&&
  fishingRods[5].rareWeightBonus>fishingRods[4].rareWeightBonus&&fishingRods[5].fishCost['fish.golden_koi']===5,
  'Rod recipes must keep the revised progression costs');
assert(fishingRods.every(rod=>assetPaths.includes(`assets/fishing/rods/${rod.asset}.png`)),
  'Every rod must have its own pixel-art sprite');
const rodShopContext={
  GAME_STATE:{inventory:[
    {type:'fish',id:'fish.crucian_carp',quantity:13,price:25},
    {type:'fish',id:'fish.koi',quantity:20,price:35},
    {type:'fish',id:'fish.crucian_carp',quantity:13,price:28},
    {type:'material',id:'oak_log',quantity:3}
  ],appearance:{activeTool:'axe'},progression:{coins:2000,fishing:{level:5,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']}}},
  saveGame:()=>true
};
vm.createContext(rodShopContext);
vm.runInContext(`${read('src/data/fishing-gear-data.js')}\n`+
  `function isFishingRodUnlocked(rod,state=GAME_STATE){return rod.requiresMasterReward?state.progression.flags?.masterRod===true:state.progression.fishing.purchasedRodIds.includes(rod.id);}\n`+
  `${read('src/fishing-gear.js')}\n`+
  `globalThis.__first=nextFishingRodForSale().id;`+
  `globalThis.__notEnough=canPurchaseFishingRod(FISHING_ROD_BY_ID.get('rod.steel'));`+
  `globalThis.__plan=planFishingRodTrade(FISHING_ROD_BY_ID.get('rod.sturdy'));`+
  `globalThis.__bought=purchaseFishingRod('rod.sturdy');`+
  `globalThis.__after=JSON.parse(JSON.stringify(GAME_STATE));`+
  `globalThis.__repeat=purchaseFishingRod('rod.sturdy');`+
  `globalThis.__manualEquip=equipFishingRod('rod.sturdy');globalThis.__unownedEquip=equipFishingRod('rod.steel');`+
  `GAME_STATE.progression.fishing.level=10;GAME_STATE.inventory.push({type:'fish',id:'fish.goldfish',quantity:5},{type:'fish',id:'fish.largemouth_bass',quantity:4});`+
  `globalThis.__beforeFailure=JSON.stringify(GAME_STATE);`,rodShopContext);
assert(rodShopContext.__first==='rod.sturdy'&&!rodShopContext.__notEnough&&rodShopContext.__plan.length===2&&
  rodShopContext.__bought&&!rodShopContext.__repeat&&rodShopContext.__after.progression.coins===200&&
  rodShopContext.__after.progression.fishing.equippedRodId==='rod.basic'&&
  rodShopContext.__after.progression.fishing.purchasedRodIds.includes('rod.sturdy')&&
  rodShopContext.__manualEquip&&!rodShopContext.__unownedEquip&&
  rodShopContext.GAME_STATE.progression.fishing.equippedRodId==='rod.sturdy'&&
  rodShopContext.GAME_STATE.appearance.activeTool==='rod'&&
  rodShopContext.__after.inventory.filter(item=>item.type==='fish').length===1&&
  rodShopContext.__after.inventory.find(item=>item.id==='fish.crucian_carp').quantity===1,
  'Rod purchase must consume exact fish and coins once, preserve the equipped rod, and keep unrelated items');
rodShopContext.saveGame=()=>false;
vm.runInContext(`globalThis.__failedRodEquip=equipFishingRod('rod.basic');`,rodShopContext);
assert(!rodShopContext.__failedRodEquip&&rodShopContext.GAME_STATE.progression.fishing.equippedRodId==='rod.sturdy'&&
  rodShopContext.GAME_STATE.appearance.activeTool==='rod',
  'Failed rod equip must restore both equipment and the held tool');
vm.runInContext(`globalThis.__failedPurchase=purchaseFishingRod('rod.steel');globalThis.__afterFailure=JSON.stringify(GAME_STATE);`,rodShopContext);
assert(!rodShopContext.__failedPurchase&&rodShopContext.__afterFailure===rodShopContext.__beforeFailure,
  'Failed rod purchase save must restore fish, coins, and equipment');
rodShopContext.saveGame=()=>true;
vm.runInContext(`GAME_STATE.progression.coins=45000;GAME_STATE.progression.fishing.level=25;`+
  `GAME_STATE.progression.fishing.purchasedRodIds=['rod.basic','rod.sturdy','rod.steel','rod.expert'];`+
  `GAME_STATE.inventory=[{type:'fish',id:'fish.golden_koi',quantity:5},{type:'fish',id:'fish.rainbow_trout',quantity:12},{type:'fish',id:'fish.flounder',quantity:12}];`+
  `globalThis.__deepwaterLocked=!canPurchaseFishingRod(FISHING_ROD_BY_ID.get('rod.deepwater'));`+
  `GAME_STATE.progression.flags={masterRod:true};`+
  `globalThis.__deepwaterBought=purchaseFishingRod('rod.deepwater');`,rodShopContext);
assert(rodShopContext.__deepwaterLocked&&rodShopContext.__deepwaterBought&&
  rodShopContext.GAME_STATE.progression.coins===0&&rodShopContext.GAME_STATE.inventory.length===0&&
  rodShopContext.GAME_STATE.progression.fishing.equippedRodId==='rod.sturdy',
  'Deepwater rod must require the collection reward and consume its full recipe without auto-equipping');

const audioProbe={oscillators:0,starts:0,stops:0,players:[],gains:[]};
class FakeAudioParam{
  setValueAtTime(){}
  exponentialRampToValueAtTime(value){this.ramps??=[];this.ramps.push(value);}
}
class FakeAudioContext{
  constructor(){this.currentTime=0;this.state='running';this.destination={};this.sampleRate=48000;}
  createOscillator(){
    audioProbe.oscillators+=1;
    return {type:'sine',frequency:new FakeAudioParam(),connect(){},start(){audioProbe.starts+=1;},stop(){audioProbe.stops+=1;}};
  }
  createGain(){const gain=new FakeAudioParam();audioProbe.gains.push(gain);return {gain,connect(){}};}
}
class FakeAudio{
  constructor(src){this.src=src;this.currentTime=3;this.plays=0;this.pauses=0;audioProbe.players.push(this);}
  load(){this.loaded=true;}
  pause(){this.pauses+=1;}
  play(){this.plays+=1;return Promise.resolve();}
}
const fishingEffectsContext={window:{AudioContext:FakeAudioContext},Audio:FakeAudio};
vm.createContext(fishingEffectsContext);
vm.runInContext(`${read('src/fishing-effects.js')}\nglobalThis.__rarityEffects=FISHING_RARITY_EFFECTS;`+
  `globalThis.__soundUrls=GAME_SOUND_URLS;globalThis.__legendarySound=playFishingRaritySound('legendary');`,fishingEffectsContext);
const rarityEffects=fishingEffectsContext.__rarityEffects;
assert(Object.keys(rarityEffects).join(',')==='rare,heroic,legendary','Unexpected fishing rarity effect tiers');
assert(rarityEffects.rare.particles<rarityEffects.heroic.particles&&
  rarityEffects.heroic.particles<rarityEffects.legendary.particles,
  'Fishing rarity particle intensity must increase by tier');
assert(Object.values(rarityEffects).every(effect=>effect.tones.length>=3),
  'Every fishing rarity effect needs a multi-note sound');
assert(fishingEffectsContext.__legendarySound&&audioProbe.oscillators===11&&
  audioProbe.starts===11&&audioProbe.stops===11,
  'Legendary fishing sound scheduling failed');
vm.runInContext(`globalThis.__castSound=playFishingCastSound();globalThis.__biteSound=playFishingBiteSound();globalThis.__catchSound=playFishingCatchSound();globalThis.__levelUpSound=playSkillLevelUpSound();globalThis.__marketSaleSound=playMarketSaleSound();`,fishingEffectsContext);
assert(fishingEffectsContext.__castSound&&fishingEffectsContext.__biteSound&&fishingEffectsContext.__catchSound&&fishingEffectsContext.__levelUpSound&&fishingEffectsContext.__marketSaleSound&&
  audioProbe.players.length===5&&audioProbe.players.every(player=>player.loaded&&player.plays===1&&player.currentTime===0&&player.volume===.65)&&
  audioProbe.players.map(player=>player.src).join(',')===gameAudioPaths.join(','),
  'Cast, bite, catch, level-up and market-sale MP3 fallback mapping failed');
assert(vm.runInContext(`balancedGameSoundLevel({numberOfChannels:1,getChannelData:()=>new Float32Array(128).fill(.5)})<
  balancedGameSoundLevel({numberOfChannels:1,getChannelData:()=>new Float32Array(128).fill(.02)})`,fishingEffectsContext),
  'Audio balancing must lower loud effects relative to quiet effects');
vm.runInContext(`globalThis.__chop=playForestryChopSound();globalThis.__cut=playForestryChopSound(true);`,fishingEffectsContext);
assert(fishingEffectsContext.__chop&&fishingEffectsContext.__cut&&audioProbe.oscillators===15&&
  audioProbe.gains.some(gain=>gain.ramps?.includes(.23))&&audioProbe.gains.some(gain=>gain.ramps?.includes(.28))&&
  audioProbe.gains.some(gain=>gain.ramps?.includes(.055)),
  'Both chop sounds must have a stronger impact and a high-frequency attack audible on phone speakers');

const bufferedProbe={loaded:[],started:[],stopped:0,resumed:0};
class FakeBufferedAudioContext extends FakeAudioContext{
  constructor(){super();this.state='suspended';}
  decodeAudioData(bytes){return Promise.resolve({byteLength:bytes.byteLength});}
  createBufferSource(){
    return {buffer:null,connect(){},start(){bufferedProbe.started.push(this.buffer);},
      stop(){bufferedProbe.stopped+=1;}};
  }
  resume(){this.state='running';bufferedProbe.resumed+=1;return Promise.resolve();}
}
const bufferedContext={window:{AudioContext:FakeBufferedAudioContext},Audio:FakeAudio,
  fetch:async url=>{
    bufferedProbe.loaded.push(url);
    return {ok:true,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
  }};
vm.createContext(bufferedContext);
vm.runInContext(read('src/fishing-effects.js'),bufferedContext);
await vm.runInContext('gameSoundLoadPromise',bufferedContext);
vm.runInContext('playFishingCastSound();playFishingBiteSound();playFishingCatchSound();playSkillLevelUpSound();playMarketSaleSound();',bufferedContext);
assert(bufferedProbe.stopped===2,'Level-up and sale sounds must not interrupt the catch sound');
vm.runInContext('stopFishingSound("catch");stopGameSound("levelUp");stopGameSound("marketSale");',bufferedContext);
assert(bufferedProbe.loaded.join(',')===gameAudioPaths.join(',')&&bufferedProbe.started.length===5&&
  bufferedProbe.started.every(buffer=>buffer.byteLength===3)&&bufferedProbe.stopped===5&&
  bufferedProbe.resumed===1&&audioProbe.players.slice(5).every(player=>player.plays===0),
  'Predecoded game sound playback and interruption failed');

const fishingDebugContext={window:{location:{search:'?debug&fish=fish.coelacanth'}},URLSearchParams};
vm.createContext(fishingDebugContext);
vm.runInContext(`${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
  `globalThis.__forcedFish=getFishingDebugFish()?.id;`,fishingDebugContext);
assert(fishingDebugContext.__forcedFish==='fish.coelacanth','Debug fish override failed');

const fishAssetContext={};
vm.createContext(fishAssetContext);
vm.runInContext(`${read('src/assets.js')}\nglobalThis.__fishUrls=FISH_URLS;`,fishAssetContext);
const fishUrls=fishAssetContext.__fishUrls;
assert(Object.keys(fishUrls).length===fishData.length,
  `Expected ${fishData.length} fish image assets, found ${Object.keys(fishUrls).length}`);
for(const fish of fishData){
  const assetPath=fishUrls[fish.asset];
  assert(assetPath,`Missing fish image mapping: ${fish.id}`);
  const bytes=fs.readFileSync(path.join(root,assetPath));
  assert(bytes.length>=24&&bytes.subarray(1,4).toString()==='PNG',`Fish image is not a valid PNG: ${assetPath}`);
  assert(bytes.readUInt32BE(16)===96&&bytes.readUInt32BE(20)===96,
    `Fish image must be 96x96: ${assetPath}`);
}
for(const habitat of ['pond','river','coast']){
  const habitatFish=fishData.filter(fish=>fish.habitat===habitat);
  assert(habitatFish.length>0,`Missing fish habitat: ${habitat}`);
  assert(habitatFish.some(fish=>fish.periods===null&&fish.weather===null),`${habitat} needs an always-available fish`);
}
for(const fish of fishData){
  assert(fish.id.startsWith('fish.'),`Invalid fish id: ${fish.id}`);
  assert(fish.minSizeCm>0&&fish.maxSizeCm>fish.minSizeCm,`Invalid size range: ${fish.id}`);
  assert(fish.basePrice>0&&fish.xp>0&&fish.weight>0,`Invalid reward or weight: ${fish.id}`);
  assert(!fish.periods||fish.periods.every(period=>['DAWN','DAY','DUSK','NIGHT'].includes(period)),
    `Invalid fishing period: ${fish.id}`);
  assert(!fish.weather||fish.weather.every(weather=>['clear','rain','storm'].includes(weather)),
    `Invalid fishing weather: ${fish.id}`);
}

const timeContext={};
vm.createContext(timeContext);
vm.runInContext(`${read('src/world-time.js')}\n`+
  `globalThis.__parsedTimes=[parseWorldTime('00:00'),parseWorldTime('23:59'),parseWorldTime('24:00'),parseWorldTime('9:7')];`+
  `globalThis.__periodBounds=[getWorldTimePeriod(299),getWorldTimePeriod(300),getWorldTimePeriod(479),getWorldTimePeriod(480),getWorldTimePeriod(1019),getWorldTimePeriod(1020),getWorldTimePeriod(1199),getWorldTimePeriod(1200)];`,timeContext);
assert(timeContext.__parsedTimes.join(',')==='0,1439,,','World-time parser boundary check failed');
assert(timeContext.__periodBounds.join(',')==='NIGHT,DAWN,DAWN,DAY,DAY,DUSK,DUSK,NIGHT',
  'World-time period boundary check failed');

const eligibleFish=(habitat,period,weather)=>fishData.filter(fish=>
  fish.habitat===habitat&&
  (!fish.periods||fish.periods.includes(period))&&
  (!fish.weather||fish.weather.includes(weather))
);
for(const habitat of ['pond','river','coast']){
  for(const period of ['DAWN','DAY','DUSK','NIGHT']){
    for(const weather of ['clear','rain','storm']){
      assert(eligibleFish(habitat,period,weather).length>0,`Empty fish pool: ${habitat}/${period}/${weather}`);
    }
  }
}
assert(eligibleFish('pond','DAY','clear').map(fish=>fish.id).join(',')===
  'fish.crucian_carp,fish.koi,fish.goldfish,fish.largemouth_bass','Unexpected pond DAY/clear pool');
assert(eligibleFish('pond','NIGHT','storm').map(fish=>fish.id).join(',')===
  'fish.crucian_carp,fish.koi,fish.catfish','Unexpected pond NIGHT/storm pool');

const fishingLogicContext={
  GAME_STATE:{
    regionId:'lilacVillage',
    inventory:[],
    collections:{fish:{}},
    progression:{coins:0,flags:{},fishing:{level:1,xp:0,totalXp:0,equippedRodId:'rod.basic'}},
    activity:{active:null}
  },
  getWorldTimePeriod:()=> 'DAY',
  getWeatherKind:()=> 'clear'
};
vm.createContext(fishingLogicContext);
vm.runInContext(`${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/life-skills.js')}\n${read('src/fishing.js')}\n`+
  `const pool=getEligibleFishPool();`+
  `globalThis.__villagePool=pool.map(fish=>fish.id);`+
  `globalThis.__villageReachable=[...new Set(['DAWN','DAY','DUSK','NIGHT'].flatMap(period=>['clear','rain','storm'].flatMap(weather=>getEligibleFishPool({regionId:'lilacVillage',habitat:'pond',period,weather}).map(fish=>fish.id))))];`+
  `globalThis.__futureRiverPool=getEligibleFishPool({regionId:'oldForest',habitat:'river',period:'DAY',weather:'clear'}).map(fish=>fish.id);`+
  `globalThis.__farmPool=getEligibleFishPool({regionId:'sunnyFields',habitat:'pond',period:'DAY',weather:'clear'}).map(fish=>fish.id);`+
  `globalThis.__futureCoastPool=getEligibleFishPool({regionId:'coast',habitat:'coast',period:'DAY',weather:'clear'}).map(fish=>fish.id);`+
  `const repeatStreak={fishId:'fish.crucian_carp',count:3};`+
  `globalThis.__weightedBounds=[chooseWeightedFish(pool,0).id,chooseWeightedFish(pool,1).id];`+
  `globalThis.__repeatPenalty=[getEffectiveFishWeight(pool[0],repeatStreak),chooseWeightedFish(pool,.1,repeatStreak).id];`+
  `recordFishingSelection('fish.koi');recordFishingSelection('fish.koi');recordFishingSelection('fish.koi');`+
  `recordFishingSelection('fish.goldfish');`+
  `globalThis.__resetStreak={...fishingCatchStreak};`+
  `const crucian=pool[0];`+
  `const firstDiscovery=recordFishDiscovery(crucian,20);`+
  `const secondDiscovery=recordFishDiscovery(crucian,30);`+
  `globalThis.__collection={first:firstDiscovery.isFirst,second:secondDiscovery.isFirst,record:{...secondDiscovery.record}};`+
  `globalThis.__xpProgress=addFishingXp(80);`+
  `for(const fish of FISH_DATA.slice(1,5))recordFishDiscovery(fish,fish.minSizeCm);`+
  `globalThis.__reward5=applyFishCollectionRewards();`+
  `globalThis.__reward5Duplicate=applyFishCollectionRewards();`+
  `for(const fish of FISH_DATA.slice(5,10))recordFishDiscovery(fish,fish.minSizeCm);`+
  `globalThis.__reward10=applyFishCollectionRewards();`+
  `for(const fish of FISH_DATA.slice(10))recordFishDiscovery(fish,fish.minSizeCm);`+
  `globalThis.__rewardTail=applyFishCollectionRewards();`+
  `globalThis.__rewardState=JSON.parse(JSON.stringify(GAME_STATE));`+
  `GAME_STATE.progression.fishing.level=15;GAME_STATE.progression.fishing.purchasedRodIds=['rod.basic','rod.sturdy','rod.steel','rod.expert'];GAME_STATE.progression.fishing.equippedRodId='rod.expert';`+
  `const expertRod=getEquippedFishingRod();const catfish=FISH_DATA.find(fish=>fish.id==='fish.catfish');`+
  `globalThis.__expertRod={id:expertRod.id,wait:getFishingRodWaitMultiplier(expertRod),rareWeight:getEffectiveFishWeight(catfish,{fishId:null,count:0},expertRod),commonWeight:getEffectiveFishWeight(crucian,{fishId:null,count:0},expertRod),sizeFloor:applyFishingRodSizeBonus(0,expertRod)};`+
  `GAME_STATE.progression.fishing.equippedRodId='rod.master_angler';const masterRod=getEquippedFishingRod();`+
  `globalThis.__masterRod={id:masterRod.id,wait:getFishingRodWaitMultiplier(masterRod),sizeFloor:applyFishingRodSizeBonus(0,masterRod)};`+
  `globalThis.__maxProgress=addFishingXp(999999);`,fishingLogicContext);
const fishingContextLabels=vm.runInContext(
  `['casting','waiting','bite','result'].map(phase=>{fishingState.phase=phase;return getFishingContextText();}).join('|')`,
  fishingLogicContext);
assert(fishingContextLabels==='|||🎣 낚시 결과','Fishing should use sound and the bobber marker instead of phase text');
const biteDelays=vm.runInContext(
  `[getFishingBiteDelay(0,FISHING_RODS[0]),getFishingBiteDelay(.5,FISHING_RODS[0]),getFishingBiteDelay(1,FISHING_RODS[0]),getFishingBiteDelay(.5,FISHING_RODS[3])]`,
  fishingLogicContext);
assert(biteDelays.join(',')==='3000,4500,6000,3825',
  'Bite delay must be random within 3–6 seconds before the equipped rod reduction');
vm.runInContext(`fishingState.phase='idle';GAME_STATE.appearance={activeTool:'axe'};
  const beforeRejectedFishing=JSON.stringify(GAME_STATE);
  globalThis.__axeFishing=startFishing();
  globalThis.__axeFishingSafe=JSON.stringify(GAME_STATE)===beforeRejectedFishing&&!isFishingActive();
  GAME_STATE.appearance.activeTool='rod';globalThis.isChoppingTree=()=>true;
  globalThis.__busyFishing=startFishing();delete globalThis.isChoppingTree;`,fishingLogicContext);
assert(fishingLogicContext.__axeFishing===false&&fishingLogicContext.__axeFishingSafe&&
  fishingLogicContext.__busyFishing===false,
  'Fishing entry point must reject a held axe and an unfinished swing without changing progress');
assert(fishingLogicContext.__villageReachable.length===fishData.length&&
  fishingLogicContext.__villageReachable.every(id=>fishData.some(fish=>fish.id===id)),
  'Every fish must be reachable at the village pond across time and weather conditions');
assert(fishingLogicContext.__villagePool.includes('fish.flounder')&&
  fishingLogicContext.__villagePool.includes('fish.minnow')&&
  !fishingLogicContext.__villagePool.includes('fish.coelacanth')&&
  fishingLogicContext.__futureRiverPool.length>0&&fishingLogicContext.__futureCoastPool.length>0&&
  fishingLogicContext.__farmPool.length>0&&
  fishingLogicContext.__farmPool.every(id=>fishData.find(fish=>fish.id===id).habitat==='pond')&&
  fishingLogicContext.__futureRiverPool.every(id=>fishData.find(fish=>fish.id===id).habitat==='river')&&
  fishingLogicContext.__futureCoastPool.every(id=>fishData.find(fish=>fish.id===id).habitat==='coast'),
  'Temporary village preview must keep weather and future region-specific pools');
assert(fishingLogicContext.__weightedBounds[0]==='fish.crucian_carp','Weighted selection lower bound failed');
assert(fishingLogicContext.__weightedBounds[1]==='fish.flounder','Weighted selection upper bound failed');
assert(fishingLogicContext.__repeatPenalty[0]===17.5,'Three-catch repeat weight was not halved');
assert(fishingLogicContext.__repeatPenalty[1]==='fish.koi','Repeat penalty did not affect weighted selection');
assert(fishingLogicContext.__resetStreak.fishId==='fish.goldfish'&&fishingLogicContext.__resetStreak.count===1,
  'Repeat penalty did not reset after a different fish');
assert(fishingLogicContext.__collection.first&&!fishingLogicContext.__collection.second,'Fish discovery state failed');
assert(fishingLogicContext.__collection.record.count===2,'Fish collection count failed');
assert(fishingLogicContext.__collection.record.minSizeCm===20&&fishingLogicContext.__collection.record.maxSizeCm===30,
  'Fish collection size bounds failed');
assert(fishingLogicContext.__collection.record.averageSizeCm===25,'Fish collection average failed');
assert(fishingLogicContext.__xpProgress.level===2&&fishingLogicContext.__xpProgress.xp===8&&
  fishingLogicContext.__xpProgress.totalXp===80&&fishingLogicContext.__xpProgress.leveledUp,'Fishing XP level-up failed');
assert(fishingLogicContext.__reward5.unlocked.join(',')==='5'&&
  fishingLogicContext.__rewardState.progression.coins===300&&
  fishingLogicContext.__reward5.messages[0]==='5종 보상 · 코인 +300','Five-fish coin reward failed');
assert(fishingLogicContext.__reward5Duplicate.unlocked.length===0,'Fish collection reward was granted twice');
assert(fishingLogicContext.__reward10.unlocked.join(',')==='10'&&fishingLogicContext.__reward10.xpGained===240,
  'Ten-fish XP reward failed');
assert(fishingLogicContext.__rewardTail.unlocked.join(',')==='15,19,20',
  'Final fish collection rewards failed');
assert(fishingLogicContext.__rewardState.progression.flags.rareFishHints&&
  fishingLogicContext.__rewardState.progression.flags.finalFishClue&&
  fishingLogicContext.__rewardState.progression.flags.masterAnglerTitle,
  'Fish collection unlock flags failed');
assert(fishingLogicContext.__rewardState.inventory.some(item=>item.id==='rod.master_angler'),
  'Master angler rod reward failed');
assert(fishingLogicContext.__expertRod.id==='rod.expert'&&fishingLogicContext.__expertRod.wait===.85&&
  Math.abs(fishingLogicContext.__expertRod.rareWeight-8.4)<1e-9&&
  fishingLogicContext.__expertRod.commonWeight===35&&fishingLogicContext.__expertRod.sizeFloor===.08,
  'Expert fishing rod effects failed');
assert(fishingLogicContext.__masterRod.id==='rod.master_angler'&&fishingLogicContext.__masterRod.wait===.75&&
  fishingLogicContext.__masterRod.sizeFloor===.15,'Master fishing rod effects failed');
assert(fishingLogicContext.__maxProgress.level===100&&fishingLogicContext.__maxProgress.nextLevelXp===null&&
  fishingLogicContext.__maxProgress.mastery>0&&fishingLogicContext.__maxProgress.totalXp>999999,
  'Fishing level 100 and mastery progression failed');
vm.runInContext(
  `globalThis.__level20Edge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',21)-1);`+
  `globalThis.__level21Edge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',21));`+
  `globalThis.__level100Edge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',100));`+
  `globalThis.__masteryEdge=lifeSkillProgressFromTotal('fishing',lifeSkillTotalXpForLevel('fishing',100)+lifeSkillMasteryXpRequired(0)+17);`,
  fishingLogicContext
);
assert(fishingLogicContext.__level20Edge.level===20&&fishingLogicContext.__level20Edge.xp===299&&
  fishingLogicContext.__level21Edge.level===21&&fishingLogicContext.__level21Edge.xp===0,
  'Level 20 to 21 threshold failed');
assert(fishingLogicContext.__level100Edge.level===100&&fishingLogicContext.__level100Edge.mastery===0&&
  fishingLogicContext.__masteryEdge.level===100&&fishingLogicContext.__masteryEdge.mastery===1&&
  fishingLogicContext.__masteryEdge.masteryXp===17,'Level 100 mastery boundary failed');

const saveStorage=new Map();
const saveContext={
  console:{warn(){}},
  window:{addEventListener(){}},
  localStorage:{
    getItem(key){return saveStorage.has(key)?saveStorage.get(key):null;},
    setItem(key,value){saveStorage.set(key,String(value));}
  },
  GAME_STATE:{
    regionId:'lilacVillage',playerLocation:null,world:{trees:{},plots:{}},
    inventory:[],
    collections:{fish:{}},
    progression:{coins:1230,flags:{},fishing:{level:1,xp:0,totalXp:0}}
  }
};
vm.createContext(saveContext);
vm.runInContext(`${read('src/data/world-map.js')}\n${read('src/data/region-maps.js')}\n${read('src/data/fish-data.js')}\n${read('src/data/fishing-gear-data.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/data/life-content-data.js')}\n${read('src/life-skills.js')}\n`+
  `const DEFAULT_OUTFIT_ID='outfit.traveler';const CHARACTER_OUTFIT_BY_ID=new Map([[DEFAULT_OUTFIT_ID,{id:DEFAULT_OUTFIT_ID}]]);\n`+
  `const CHARACTER_PARTS={body:new Map([['body.starter',{}]]),hair:new Map([['hair.brown',{}]]),backpack:new Map([['pack.traveler',{}]])};\n`+
  `${read('src/save.js')}\n`+
  `GAME_STATE.inventory.push({type:'fish',id:'fish.crucian_carp',name:'붕어',rarity:'common',sizeCm:22.5,price:26,quantity:1});`+
  `GAME_STATE.collections.fish['fish.crucian_carp']={fishId:'fish.crucian_carp',name:'붕어',rarity:'common',count:2,minSizeCm:20,maxSizeCm:25,totalSizeCm:45,averageSizeCm:22.5};`+
  `GAME_STATE.inventory.push({type:'equipment',id:'rod.master_angler',name:'강태공의 낚싯대',quantity:1});`+
  `GAME_STATE.appearance={outfitId:DEFAULT_OUTFIT_ID,ownedOutfitIds:[DEFAULT_OUTFIT_ID],activeTool:'rod'};`+
  `GAME_STATE.progression.coins=1400;GAME_STATE.progression.flags={fishCollectionRewards:{5:true,10:true,15:true,19:true,20:true},rareFishHints:true,finalFishClue:true,masterAnglerTitle:true,masterRod:true};GAME_STATE.progression.fishing={level:2,xp:8,totalXp:80,equippedRodId:'rod.master_angler'};`+
  `saveGame();`+
  `GAME_STATE.inventory=[];GAME_STATE.appearance=null;GAME_STATE.collections.fish={};GAME_STATE.progression.coins=0;GAME_STATE.progression.flags={};GAME_STATE.progression.fishing={level:1,xp:0,totalXp:0};`+
  `globalThis.__loaded=loadGame();globalThis.__restored=JSON.parse(JSON.stringify(GAME_STATE));`+
  `globalThis.__lockedRod=normalizeSavedFishingProgress({level:2,xp:0,totalXp:0,equippedRodId:'rod.expert'},{},[]);`+
  `globalThis.__oldCap=normalizeSavedFishingProgress({level:20,xp:0,totalXp:lifeSkillTotalXpForLevel('fishing',20)+900,equippedRodId:'rod.expert'},{},[]);`+
  `globalThis.__savedMastery=normalizeSavedFishingProgress({level:100,xp:0,totalXp:lifeSkillTotalXpForLevel('fishing',100)+lifeSkillMasteryXpRequired(0)+17,equippedRodId:'rod.expert'},{},[]);`+
  `globalThis.__invalidAppearance=normalizeSavedAppearance({bodyId:'bad',hairId:'bad',backpackId:'bad',outfitId:'outfit.unknown',ownedOutfitIds:['outfit.unknown'],activeTool:'bad'});`,saveContext);
assert(saveContext.__loaded,'Versioned save did not load');
assert(saveContext.__restored.appearance.outfitId==='outfit.traveler'&&
  saveContext.__restored.appearance.activeTool==='rod'&&
  saveContext.__restored.appearance.bodyId==='body.starter'&&
  saveContext.__restored.appearance.hairId==='hair.brown'&&
  saveContext.__restored.appearance.backpackId==='pack.traveler'&&
  saveContext.__invalidAppearance.outfitId==='outfit.traveler'&&
  saveContext.__invalidAppearance.activeTool==='axe'&&
  saveContext.__invalidAppearance.bodyId==='body.starter'&&
  saveContext.__invalidAppearance.hairId==='hair.brown'&&
  saveContext.__invalidAppearance.backpackId==='pack.traveler',
  'Appearance and held tool must save safely and invalid legacy values must fall back to defaults');
assert(saveContext.__restored.inventory.length===2&&saveContext.__restored.inventory[0].id==='fish.crucian_carp'&&
  saveContext.__restored.inventory[1].id==='rod.master_angler',
  'Saved inventory did not restore');
assert(saveContext.__restored.collections.fish['fish.crucian_carp'].averageSizeCm===22.5,
  'Saved fish collection did not restore');
assert(saveContext.__restored.progression.coins===1400&&saveContext.__restored.progression.fishing.level===2&&
  saveContext.__restored.progression.fishing.xp===8&&saveContext.__restored.progression.fishing.totalXp===80&&
  saveContext.__restored.progression.fishing.equippedRodId==='rod.master_angler',
  'Saved fishing progression did not restore');
assert(saveContext.__restored.progression.logging.level===1&&saveContext.__restored.progression.logging.totalXp===0,
  'Older saves without logging progress must start at Logging Lv.1');
assert(saveContext.__restored.progression.forestry.axeId==='axe.basic',
  'Older saves without a forestry axe must receive the basic axe');
assert(saveContext.__restored.progression.flags.fishCollectionRewards[20]&&
  saveContext.__restored.progression.flags.masterAnglerTitle&&saveContext.__restored.progression.flags.masterRod,
  'Saved fish collection rewards did not restore');
assert(saveContext.__lockedRod.equippedRodId==='rod.basic','Locked saved fishing rod must fall back to basic');
const newRodSave=vm.runInContext(`normalizeSavedFishingProgress({level:15,totalXp:lifeSkillTotalXpForLevel('fishing',15),equippedRodId:'rod.expert',purchasedRodIds:['rod.basic','rod.sturdy']},{},[])`,saveContext);
assert(newRodSave.equippedRodId==='rod.basic'&&newRodSave.purchasedRodIds.join(',')==='rod.basic,rod.sturdy'&&
  saveContext.__savedMastery.purchasedRodIds.includes('rod.expert'),
  'New saves must require rod purchase while legacy saves keep previously available rods');
assert(saveContext.__oldCap.level>20&&saveContext.__oldCap.totalXp===4320,
  'Saved fishing XP beyond the old level 20 cap must be restored');
assert(saveContext.__savedMastery.level===100&&saveContext.__savedMastery.mastery===1&&
  saveContext.__savedMastery.masteryXp===17&&saveContext.__savedMastery.equippedRodId==='rod.expert',
  'Level 100 mastery save restoration failed');
vm.runInContext(`GAME_STATE.progression.logging=lifeSkillProgressFromTotal('logging',95);saveGame();`+
  `GAME_STATE.progression.logging=lifeSkillProgressFromTotal('logging',0);loadGame();`+
  `globalThis.__savedLogging=JSON.parse(JSON.stringify(GAME_STATE.progression.logging));`,saveContext);
assert(saveContext.__savedLogging.level===2&&saveContext.__savedLogging.xp===23&&saveContext.__savedLogging.totalXp===95,
  'Logging XP and level must survive a reload');
vm.runInContext(`GAME_STATE.progression.forestry={axeId:'axe.iron',ownedAxeIds:['axe.basic','axe.iron']};saveGame();`+
  `GAME_STATE.progression.forestry={axeId:'axe.basic'};loadGame();`+
  `globalThis.__savedAxe=GAME_STATE.progression.forestry.axeId;`+
  `globalThis.__invalidAxe=normalizeSavedForestryProgress({axeId:'axe.unknown'}).axeId;`,saveContext);
assert(saveContext.__savedAxe==='axe.iron'&&saveContext.__invalidAxe==='axe.basic'&&
  saveContext.GAME_STATE.progression.forestry.ownedAxeIds.includes('axe.iron'),
  'Owned and equipped axes must survive reload; invalid axe ids use the starter axe');
vm.runInContext(`${read('src/skill-ui.js')}\nglobalThis.__loggingCard=skillCardMarkup('logging');`,saveContext);
assert(saveContext.__loggingCard.includes('벌목')&&saveContext.__loggingCard.includes('Lv.2')&&
  saveContext.__loggingCard.includes('role="progressbar"')&&saveContext.__loggingCard.includes('aria-valuenow="27"'),
  'Logging must use the shared visible XP bar and level card');
const loggingLevelEdge=vm.runInContext(`lifeSkillProgressFromTotal('logging',lifeSkillXpForNextLevel('logging',1))`,saveContext);
assert(loggingLevelEdge.level===2&&loggingLevelEdge.xp===0,
  'Logging XP must fill to 100% and advance the level at the threshold');
vm.runInContext(`GAME_STATE.regionId='sunnyFields';GAME_STATE.playerLocation={x:14,y:24,face:'right'};`+
  `GAME_STATE.inventory.push({type:'material',id:'log',name:'통나무',quantity:5},{type:'material',id:'oak_log',name:'참나무 통나무',quantity:3},{type:'seed',id:'carrot',name:'당근 씨앗',quantity:2},{type:'seed',id:'pumpkin',name:'호박 씨앗',quantity:1},{type:'crop',id:'wheat',name:'밀',quantity:4});`+
  `GAME_STATE.world={trees:{forest_tree_01:{hp:0,choppedAt:Date.now()},forest_tree_15_16:{hp:2,choppedAt:null},forest_tree_1_1:{hp:0,choppedAt:Date.now()},deep_forest_tree_22_39:{hp:40,choppedAt:null,maxHp:100}},plots:{farm_09:{unlocked:true,cropId:'carrot',plantedAt:Date.now()-30000},farm_10:{unlocked:true,cropId:'pumpkin',plantedAt:Date.now()-30000}}};`+
  `saveGame();GAME_STATE.inventory=[];GAME_STATE.world={trees:{},plots:{}};GAME_STATE.regionId='lilacVillage';`+
  `globalThis.__lifeLoaded=loadGame();globalThis.__lifeRestored=JSON.parse(JSON.stringify(GAME_STATE));`,saveContext);
assert(saveContext.__lifeLoaded&&saveContext.__lifeRestored.regionId==='sunnyFields'&&
  saveContext.__lifeRestored.playerLocation.x===14&&
  saveContext.__lifeRestored.inventory.some(item=>item.type==='material'&&item.quantity===5)&&
  saveContext.__lifeRestored.inventory.some(item=>item.id==='log'&&item.name==='일반 목재')&&
  saveContext.__lifeRestored.inventory.some(item=>item.id==='oak_log'&&item.name==='참나무'&&item.quantity===3)&&
  saveContext.__lifeRestored.inventory.some(item=>item.type==='seed'&&item.id==='carrot'&&item.quantity===2)&&
  saveContext.__lifeRestored.inventory.some(item=>item.type==='seed'&&item.id==='pumpkin'&&item.quantity===1)&&
  saveContext.__lifeRestored.inventory.some(item=>item.type==='crop'&&item.id==='wheat'&&item.quantity===4)&&
  saveContext.__lifeRestored.world.trees.forest_tree_01.hp===0&&
  saveContext.__lifeRestored.world.trees.forest_tree_15_16.hp===67&&
  saveContext.__lifeRestored.world.trees.deep_forest_tree_22_39.hp===40&&
  saveContext.__lifeRestored.world.trees.forest_tree_1_1.hp===0&&
  saveContext.__lifeRestored.world.plots.farm_09.cropId==='carrot'&&
  saveContext.__lifeRestored.world.plots.farm_10.cropId==='pumpkin'&&
  saveContext.__lifeRestored.world.plots.farm_01.unlocked&&
  saveContext.__lifeRestored.world.plots.farm_05.unlocked&&
  !saveContext.__lifeRestored.world.plots.farm_03.unlocked,
  'Region, life inventory, tree respawn, and initial farm plot state must survive reload');
vm.runInContext(`GAME_STATE.regionId='deepForest';GAME_STATE.playerLocation={x:25,y:44,face:'up'};`+
  `saveGame();GAME_STATE.regionId='lilacVillage';GAME_STATE.world.trees={};loadGame();`+
  `globalThis.__deepSavedRegion=GAME_STATE.regionId;globalThis.__deepSavedTree=GAME_STATE.world.trees.deep_forest_tree_22_39;`,saveContext);
assert(saveContext.__deepSavedRegion==='deepForest'&&saveContext.__deepSavedTree.hp===40,
  'Deep forest position and partial tree HP must survive a reload');
saveStorage.set('pixel-life.save.v2','{not-json');
vm.runInContext('globalThis.__invalidJsonSave=loadGame();',saveContext);
assert(saveContext.__invalidJsonSave===false,'Malformed save JSON must fail safely');
saveStorage.set('pixel-life.save.v2',JSON.stringify({version:999,state:{}}));
vm.runInContext('globalThis.__futureVersionSave=loadGame();',saveContext);
assert(saveContext.__futureVersionSave===false,'Unknown save version must not be applied');
saveStorage.delete('pixel-life.save.v2');
saveStorage.set('pixel-life.save',JSON.stringify({version:1,state:{progression:{coins:9999}}}));
vm.runInContext('globalThis.__oldSessionLoaded=loadGame();',saveContext);
assert(saveContext.__oldSessionLoaded===false&&saveStorage.has('pixel-life.save'),
  'Fresh save namespace must ignore but preserve every prior browser save');

const inventoryContext={
  FISH_DATA:[{id:'fish.crucian_carp',name:'붕어'},{id:'fish.goldfish',name:'금붕어'}],
  GAME_STATE:{inventory:[]}
};
vm.createContext(inventoryContext);
vm.runInContext(`${read('src/inventory.js')}\n`+
  `globalThis.__grouped=groupInventoryFish([`+
  `{type:'fish',id:'fish.crucian_carp',sizeCm:22.5,price:26,quantity:1},`+
  `{type:'fish',id:'fish.goldfish',sizeCm:11.2,price:80,quantity:1},`+
  `{type:'fish',id:'fish.crucian_carp',sizeCm:28.1,price:39,quantity:1},`+
  `{type:'equipment',id:'rod.basic',quantity:1}`+
  `]);`,inventoryContext);
assert(inventoryContext.__grouped.length===2&&inventoryContext.__grouped[0].fish.id==='fish.crucian_carp'&&
  inventoryContext.__grouped[0].count===2&&inventoryContext.__grouped[0].entries[0].sizeCm===28.1&&
  inventoryContext.__grouped[0].entries[0].price===39&&
  inventoryContext.__grouped[0].entries[1].sizeCm===22.5&&
  inventoryContext.__grouped[0].entries[1].price===26,
  'Inventory must group by species without losing each catch size and price');
const inventorySummaryNode={textContent:''};
const inventoryScrollNode={innerHTML:''};
inventoryContext.document={getElementById(id){return id==='inventorySummary'?inventorySummaryNode:inventoryScrollNode;}};
inventoryContext.getFishImageUrl=()=>'/fish.png';
inventoryContext.GAME_STATE.inventory=[
  {type:'fish',id:'fish.crucian_carp',sizeCm:22.5,price:26,quantity:1},
  {type:'fish',id:'fish.crucian_carp',sizeCm:28.1,price:39,quantity:1}
];
vm.runInContext('renderInventoryFish();',inventoryContext);
assert(inventorySummaryNode.textContent==='보유 물고기 2마리'&&
  inventoryScrollNode.innerHTML.includes('class="inventoryItemGrid"')&&
  inventoryScrollNode.innerHTML.includes('class="inventoryItemCard inventoryFishCard rarity-')&&
  inventoryScrollNode.innerHTML.includes('aria-label="붕어, 2마리"')&&
  inventoryScrollNode.innerHTML.includes('class="inventoryItemCount" aria-hidden="true">2</strong>')&&
  inventoryScrollNode.innerHTML.includes('class="inventoryItemName" aria-hidden="true">붕어</span>')&&
  !inventoryScrollNode.innerHTML.includes('22.5cm')&&
  !inventoryScrollNode.innerHTML.includes('판매가')&&
  inventoryContext.GAME_STATE.inventory[0].price===26&&
  inventoryContext.GAME_STATE.inventory[1].sizeCm===28.1,
  'Inventory grid must badge counts and preserve individual catch data');
inventoryContext.FOREST_SPECIES=['oak'];
inventoryContext.FOREST_WOOD={oak:'참나무'};
inventoryContext.lifeItemName=(type,id)=>id==='log'?'일반 목재':inventoryContext.FOREST_WOOD[id.slice(0,-4)]||'';
inventoryContext.LIFE_CONTENT={crops:[{id:'carrot',name:'당근',icon:'🥕'}]};
inventoryContext.lifeItemCount=(type,id)=>type==='material'&&id==='oak_log'?3:type==='seed'&&id==='carrot'?5:0;
inventoryContext.lifeItemIconMarkup=(type,id)=>`<img class="lifeItemIcon" src="/${type}-${id}.png" alt="">`;
vm.runInContext('renderInventorySupplies();',inventoryContext);
assert(inventorySummaryNode.textContent==='보유 재료 8개'&&
  inventoryScrollNode.innerHTML.includes('class="inventoryItemGrid"')&&
  inventoryScrollNode.innerHTML.includes('aria-label="참나무, 3개"')&&
  inventoryScrollNode.innerHTML.includes('aria-label="당근 씨앗, 5개"')&&
  inventoryScrollNode.innerHTML.includes('class="inventoryItemCount" aria-hidden="true">5</strong>')&&
  !inventoryScrollNode.innerHTML.includes('class="inventorySupply"'),
  'Material and seed items must use the same image grid and count badges as fish');
inventoryContext.FISHING_RODS=[{id:'rod.basic',name:'기본 낚싯대',asset:'basic'}];
inventoryContext.FISHING_ROD_URLS={basic:'assets/fishing/rods/basic.png'};
inventoryContext.isFishingRodUnlocked=()=>true;
inventoryContext.getEquippedFishingRod=()=>inventoryContext.FISHING_RODS[0];
inventoryContext.getEquippedForestryAxe=()=>({id:'axe.basic',name:'기본 도끼',asset:'basic'});
inventoryContext.getOwnedForestryAxes=()=>[{id:'axe.basic',name:'기본 도끼',asset:'basic'},{id:'axe.iron',name:'철 도끼',asset:'iron'}];
inventoryContext.FORESTRY_AXE_URLS={basic:'/axe.png',iron:'/iron.png'};
inventoryContext.GAME_STATE.appearance={outfitId:'outfit.traveler',ownedOutfitIds:['outfit.traveler'],activeTool:'axe'};
inventoryContext.normalizeSavedAppearance=value=>value;
inventoryContext.CHARACTER_OUTFIT_BY_ID=new Map([['outfit.traveler',{id:'outfit.traveler',name:'여행자의 옷',walkSheet:'/player.png'}]]);
vm.runInContext('renderInventoryEquipment();',inventoryContext);
assert(inventoryScrollNode.innerHTML.includes('class="inventoryItemGrid"')&&
  !inventoryScrollNode.innerHTML.includes('여행자의 옷')&&!inventoryScrollNode.innerHTML.includes('data-held-tool')&&
  inventoryScrollNode.innerHTML.includes('aria-label="기본 도끼, 장착 중"')&&
  inventoryScrollNode.innerHTML.includes('data-equip-type="axe" data-equip-id="axe.iron" aria-pressed="false" aria-label="철 도끼, 장착하기"')&&
  inventoryScrollNode.innerHTML.includes('aria-label="기본 낚싯대, 장착하기"')&&
  !inventoryScrollNode.innerHTML.includes('aria-label="기본 낚싯대, 장착 중"')&&
  inventoryScrollNode.innerHTML.includes('fishing/rods/basic.png')&&
  (inventoryScrollNode.innerHTML.match(/class="inventoryInfoButton"/g)||[]).length===3&&
  !inventoryScrollNode.innerHTML.includes('inventoryItemCount'),
  'Owned tools must use image cards, one selection mark and separate info buttons without counts, clothes or duplicate hand picker');
inventoryContext.saveGame=()=>true;
vm.runInContext("globalThis.__selectedHeldRod=selectHeldTool('rod');",inventoryContext);
assert(inventoryContext.__selectedHeldRod&&inventoryContext.GAME_STATE.appearance.activeTool==='rod',
  'Hand tool selection must update the active visual tool');
vm.runInContext('renderInventoryEquipment();',inventoryContext);
assert(inventorySummaryNode.textContent==='장착 기본 낚싯대'&&
  inventoryScrollNode.innerHTML.includes('aria-label="기본 낚싯대, 장착 중"')&&
  inventoryScrollNode.innerHTML.includes('aria-label="기본 도끼, 장착하기"')&&
  !inventoryScrollNode.innerHTML.includes('aria-label="기본 도끼, 장착 중"'),
  'Only the held weapon may display equipped; inactive remembered variants stay unequipped');
inventoryContext.saveGame=()=>false;
vm.runInContext("globalThis.__failedHeldAxe=selectHeldTool('axe');",inventoryContext);
assert(!inventoryContext.__failedHeldAxe&&inventoryContext.GAME_STATE.appearance.activeTool==='rod',
  'A failed hand tool save must restore the previous selection');
inventoryContext.GAME_STATE.appearance={...inventoryContext.GAME_STATE.appearance,backpackId:'pack.traveler',ownedBackpackIds:['pack.traveler']};
inventoryContext.CHARACTER_PARTS={backpack:new Map([['pack.traveler',{name:'여행자의 가방',walkBackpack:'walkBackpack'}]])};
inventoryContext.characterLayerImgs={};inventoryContext.characterOutfitImgs={};
vm.runInContext('renderInventoryAppearance();',inventoryContext);
assert(inventoryScrollNode.innerHTML.includes('aria-label="옷"')&&inventoryScrollNode.innerHTML.includes('aria-label="가방"')&&
  inventoryScrollNode.innerHTML.includes('data-equip-type="outfit"')&&inventoryScrollNode.innerHTML.includes('data-equip-type="backpack"')&&
  !inventoryScrollNode.innerHTML.includes('모자')&&!inventoryScrollNode.innerHTML.includes('헤어'),
  'Appearance must group only owned clothes and backpacks into separate image grids');
vm.runInContext(`const appearanceBeforeFailure=GAME_STATE.appearance;
  globalThis.__outfitSaveFailed=equipInventoryAppearance('outfit','outfit.traveler');
  globalThis.__appearanceRollback=GAME_STATE.appearance===appearanceBeforeFailure;
  globalThis.__unknownAppearance=equipInventoryAppearance('backpack','pack.unknown');
  globalThis.__hairEquip=equipInventoryAppearance('hair','hair.brown');`,inventoryContext);
assert(!inventoryContext.__outfitSaveFailed&&inventoryContext.__appearanceRollback&&
  !inventoryContext.__unknownAppearance&&!inventoryContext.__hairEquip,
  'Appearance equips must restore failed saves and reject unowned parts and hair changes');
inventoryContext.saveGame=()=>true;
vm.runInContext("globalThis.__appearanceEquip=equipInventoryAppearance('backpack','pack.traveler');",inventoryContext);
assert(inventoryContext.__appearanceEquip&&inventoryContext.GAME_STATE.appearance.activeTool==='rod',
  'Backpack equip must preserve the sole held weapon');

const lifeContext={
  GAME_STATE:{regionId:'oldForest',inventory:[],world:{trees:{},plots:{}},appearance:{activeTool:'rod'},progression:{coins:500,logging:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0},forestry:{axeId:'axe.basic',ownedAxeIds:['axe.basic']}}},
  saveGame:()=>true,
  feedback:[],
  performance:{now:()=>100},
  setTimeout:()=>1,clearTimeout:()=>{}
};
lifeContext.showSkillXpFeedback=(skillId,before,after,gained)=>lifeContext.feedback.push({skillId,before,after,gained});
vm.createContext(lifeContext);
vm.runInContext(`${read('src/assets.js')}\n${read('src/data/world-map.js')}\n${read('src/data/region-maps.js')}\n${read('src/data/life-skill-data.js')}\n${read('src/data/life-content-data.js')}\n${read('src/life-skills.js')}\n${read('src/life-content.js')}\n`,lifeContext);
assert(vm.runInContext(`FORESTRY_AXES[1].coins===3600&&FORESTRY_AXES[1].materials.oak_log===60&&
  FORESTRY_AXES[2].coins===11200&&FORESTRY_AXES[2].materials.maple_log===54&&
  FORESTRY_AXES[3].coins===30000&&FORESTRY_AXES[3].materials.cypress_log===60`,lifeContext),
  'Axe recipes must keep the revised progression costs');
assert(vm.runInContext(`lifeItemName('material','log')==='일반 목재'&&
  FOREST_SPECIES.every(species=>lifeItemName('material',species+'_log')===FOREST_WOOD[species])`,lifeContext),
  'Wood item names must be short and consistent across all eight species');
const toastNode={textContent:'',classList:{add(){},remove(){}}};
const coinNode={textContent:''};
lifeContext.document={getElementById(id){return id==='lifeToast'?toastNode:coinNode;}};
vm.runInContext(`const testTree=REGION_WORLDS.oldForest.trees.find(tree=>tree.id==='forest_tree_01');`+
  `globalThis.__hits=[hitResourceTree(testTree)];globalThis.__firstHitToast=document.getElementById('lifeToast').textContent;`+
  `__hits.push(hitResourceTree(testTree),hitResourceTree(testTree),hitResourceTree(testTree),hitResourceTree(testTree),hitResourceTree(testTree));`+
  `globalThis.__logs=lifeItemCount('material','oak_log');`+
  `globalThis.__regrown=getTreeState(testTree,Date.now()+LIFE_CONTENT.treeRespawnMs+1);`+
  `const lockedPlot=REGION_WORLDS.sunnyFields.farmPlots[2];GAME_STATE.regionId='sunnyFields';`+
  `GAME_STATE.progression.coins=50;globalThis.__poorBuy=buyFarmPlot(lockedPlot);`+
  `GAME_STATE.progression.coins=500;globalThis.__plotBought=buyFarmPlot(lockedPlot);`+
  `globalThis.__doubleBuy=buyFarmPlot(lockedPlot);`+
  `addLifeItem('seed','carrot',1);globalThis.__planted=plantFarmCrop(lockedPlot,'carrot');`+
  `globalThis.__doublePlant=plantFarmCrop(lockedPlot,'carrot');`+
  `GAME_STATE.world.plots[lockedPlot.id].plantedAt=Date.now()-LIFE_CROP_BY_ID.get('carrot').growMs-1;`+
  `globalThis.__offlinePhase=getFarmPlotPhase(lockedPlot);`+
  `globalThis.__harvested=harvestFarmCrop(lockedPlot);globalThis.__doubleHarvest=harvestFarmCrop(lockedPlot);`+
  `globalThis.__cropCount=lifeItemCount('crop','carrot');globalThis.__farmCoins=GAME_STATE.progression.coins;`,lifeContext);
assert(lifeContext.__hits.join(',')==='true,true,true,true,true,false'&&lifeContext.__logs>=1&&lifeContext.__logs<=3&&
  lifeContext.__regrown.hp===100,'Trees must take five hits, grant one drop, and regrow from wall-clock time');
assert(lifeContext.__firstHitToast===''&&lifeContext.GAME_STATE.progression.logging.totalXp===10&&
  lifeContext.feedback.length===1&&lifeContext.feedback[0].skillId==='logging'&&lifeContext.feedback[0].gained===10,
  'Partial hits must stay quiet and grant no XP; complete cuts must show Logging XP once');
vm.runInContext(`GAME_STATE.regionId='deepForest';const lockedSource=REGION_WORLDS.deepForest.trees.find(tree=>tree.species==='maple');`+
  `const lockedTree={...lockedSource,id:forestTreeId(lockedSource.x,lockedSource.y,'deepForest'),interactable:true};`+
  `globalThis.__lockedHit=hitResourceTree(lockedTree);globalThis.__lockedHp=getTreeState(lockedTree).hp;`+
  `GAME_STATE.regionId='oldForest';GAME_STATE.progression.coins=4000;`+
  `for(const [id,count] of Object.entries(FORESTRY_AXES[1].materials))addLifeItem('material',id,count);`+
  `globalThis.__ironBought=upgradeForestryAxe('axe.iron');globalThis.__ironBeforeEquip=getEquippedForestryAxe().id;`+
  `globalThis.__repeatIron=upgradeForestryAxe('axe.iron');`+
  `globalThis.__nextWhileBasic=nextForestryAxe().id;globalThis.__ironEquipped=equipForestryAxe('axe.iron');`,lifeContext);
assert(lifeContext.__lockedHit===false&&lifeContext.__lockedHp===120&&lifeContext.__ironBought&&
  lifeContext.__repeatIron===false&&lifeContext.__ironBeforeEquip==='axe.basic'&&
  lifeContext.__nextWhileBasic==='axe.steel'&&lifeContext.__ironEquipped&&
  lifeContext.GAME_STATE.progression.forestry.axeId==='axe.iron'&&lifeContext.GAME_STATE.progression.coins===400&&
  lifeContext.GAME_STATE.appearance.activeTool==='axe'&&
  lifeContext.GAME_STATE.inventory.every(item=>item.id!=='pine_log'&&item.id!=='birch_log'),
  'Iron axe purchase must require reachable wood, avoid duplicates, and wait for manual equip');
vm.runInContext(`GAME_STATE.regionId='deepForest';const deepSource=REGION_WORLDS.deepForest.trees.find(tree=>tree.species==='maple');`+
  `const deepTree={...deepSource,id:forestTreeId(deepSource.x,deepSource.y,'deepForest'),interactable:true};`+
  `globalThis.__deepFirstHit=hitResourceTree(deepTree);globalThis.__deepFirstHp=getTreeState(deepTree).hp;`+
  `globalThis.__deepFirstReward=lifeItemCount('material','maple_log');`+
  `globalThis.__deepHits=[hitResourceTree(deepTree),hitResourceTree(deepTree),hitResourceTree(deepTree)];`+
  `globalThis.__deepFinalHp=getTreeState(deepTree).hp;globalThis.__deepLogs=lifeItemCount('material','maple_log');`,lifeContext);
assert(lifeContext.__deepFirstHit&&lifeContext.__deepFirstHp===80&&lifeContext.__deepFirstReward===0&&
  lifeContext.__deepHits.join(',')==='true,true,false'&&lifeContext.__deepFinalHp===0&&
  lifeContext.__deepLogs>=1&&lifeContext.__deepLogs<=3,
  'Iron axe must cut tier-2 trees in three hits and block duplicate rewards');
assert(lifeContext.GAME_STATE.progression.logging.totalXp===35&&lifeContext.feedback.length===2&&
  lifeContext.feedback[1].gained===25,
  'Deeper trees must award their provisional Logging XP only on completion');
vm.runInContext(`const upperSource=REGION_WORLDS.deepForest.trees.find(tree=>tree.species==='cypress');`+
  `const upperTree={...upperSource,id:forestTreeId(upperSource.x,upperSource.y,'deepForest'),interactable:true};`+
  `globalThis.__upperLocked=hitResourceTree(upperTree);globalThis.__upperLockedHp=getTreeState(upperTree).hp;`+
  `GAME_STATE.progression.coins=12000;`+
  `for(const [id,count] of Object.entries(FORESTRY_AXES[2].materials))addLifeItem('material',id,count);`+
  `globalThis.__steelBought=upgradeForestryAxe('axe.steel');globalThis.__steelBeforeEquip=getEquippedForestryAxe().id;`+
  `globalThis.__steelEquipped=equipForestryAxe('axe.steel');`+
  `globalThis.__upperHits=[hitResourceTree(upperTree),hitResourceTree(upperTree),hitResourceTree(upperTree),hitResourceTree(upperTree),hitResourceTree(upperTree)];`,lifeContext);
assert(lifeContext.__upperLocked===false&&lifeContext.__upperLockedHp===160&&lifeContext.__steelBought&&
  lifeContext.__steelBeforeEquip==='axe.iron'&&lifeContext.__steelEquipped&&
  lifeContext.__upperHits.join(',')==='true,true,true,true,false'&&lifeContext.GAME_STATE.progression.forestry.axeId==='axe.steel'&&
  lifeContext.GAME_STATE.progression.logging.totalXp===90,
  'Tier-3 tree must require steel axe and grant its own XP on the final hit');
vm.runInContext(`GAME_STATE.progression.coins=32000;`+
  `for(const [id,count] of Object.entries(FORESTRY_AXES[3].materials))addLifeItem('material',id,count);`+
  `globalThis.__masterNext=nextForestryAxe().id;globalThis.__masterBought=upgradeForestryAxe('axe.master');`+
  `globalThis.__masterBeforeEquip=getEquippedForestryAxe().id;globalThis.__masterEquipped=equipForestryAxe('axe.master');`+
  `globalThis.__masterDamage=getEquippedForestryAxe().damage;equipForestryAxe('axe.steel');`,lifeContext);
assert(lifeContext.__masterNext==='axe.master'&&lifeContext.__masterBought&&
  lifeContext.__masterBeforeEquip==='axe.steel'&&lifeContext.__masterEquipped&&lifeContext.__masterDamage===80&&
  lifeContext.GAME_STATE.progression.coins===2000&&vm.runInContext('nextForestryAxe()===null',lifeContext),
  'Master axe must cost reachable tier-3 wood, remain unequipped until selected, and deal more damage');
vm.runInContext(`GAME_STATE.progression.logging=lifeSkillProgressFromTotal('logging',65);GAME_STATE.regionId='oldForest';`+
  `const levelTree=REGION_WORLDS.oldForest.trees.find(tree=>tree.id==='forest_tree_03');`+
  `hitResourceTree(levelTree);`+
  `globalThis.__beforeFinalLevel=GAME_STATE.progression.logging.level;`+
  `globalThis.__finalLevelHit=hitResourceTree(levelTree);`+
  `globalThis.__afterFinalLevel=GAME_STATE.progression.logging.level;`,lifeContext);
assert(lifeContext.__beforeFinalLevel===1&&lifeContext.__finalLevelHit&&lifeContext.__afterFinalLevel===2&&
  lifeContext.feedback.length===4&&lifeContext.feedback[3].before.level===1&&lifeContext.feedback[3].after.level===2,
  'Logging level-up must happen only on the finishing strike');
assert(lifeContext.__poorBuy===false&&lifeContext.__plotBought===true&&lifeContext.__doubleBuy===false&&
  lifeContext.__farmCoins===400&&lifeContext.__planted===true&&lifeContext.__doublePlant===false&&
  lifeContext.__offlinePhase==='READY'&&lifeContext.__harvested===true&&lifeContext.__doubleHarvest===false&&
  lifeContext.__cropCount>=2&&lifeContext.__cropCount<=3,
  'Farm must reject unaffordable/duplicate actions and allow offline growth and one harvest');
lifeContext.saveGame=()=>false;
lifeContext.GAME_STATE.appearance.activeTool='rod';
vm.runInContext(`globalThis.__failedEquip=equipForestryAxe('axe.basic');globalThis.__unownedAxe=equipForestryAxe('axe.unknown');`,lifeContext);
assert(!lifeContext.__failedEquip&&!lifeContext.__unownedAxe&&lifeContext.GAME_STATE.progression.forestry.axeId==='axe.steel'&&
  lifeContext.GAME_STATE.appearance.activeTool==='rod',
  'Axe equip must reject unowned gear and roll back when saving fails');
vm.runInContext(`GAME_STATE.regionId='oldForest';const before=totalLogCount();`+
  `globalThis.__failedHit=hitResourceTree(REGION_WORLDS.oldForest.trees.find(tree=>tree.id==='forest_tree_02'));`+
  `globalThis.__rollbackOk=totalLogCount()===before&&!GAME_STATE.world.trees.forest_tree_02;`+
  `GAME_STATE.world.trees.forest_tree_02={hp:20,choppedAt:null,maxHp:100};`+
  `const xpBefore=GAME_STATE.progression.logging.totalXp;`+
  `globalThis.__failedFinalHit=hitResourceTree(REGION_WORLDS.oldForest.trees.find(tree=>tree.id==='forest_tree_02'));`+
  `globalThis.__finalRollbackOk=GAME_STATE.world.trees.forest_tree_02.hp===20&&totalLogCount()===before&&`+
  `GAME_STATE.progression.logging.totalXp===xpBefore;`,lifeContext);
assert(lifeContext.__failedHit===false&&lifeContext.__rollbackOk,
  'Failed life-content save must roll back tree damage and rewards');
assert(lifeContext.__failedFinalHit===false&&lifeContext.__finalRollbackOk&&lifeContext.feedback.length===4,
  'A failed final-cut save must roll back wood, Logging XP, tree HP, and XP feedback');
vm.runInContext(`GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:['axe.basic']};GAME_STATE.progression.coins=4000;`+
  `for(const [id,count] of Object.entries(FORESTRY_AXES[1].materials))addLifeItem('material',id,count);`+
  `const beforeWood=Object.fromEntries(Object.keys(FORESTRY_AXES[1].materials).map(id=>[id,lifeItemCount('material',id)]));`+
  `globalThis.__failedAxe=upgradeForestryAxe('axe.iron');`+
  `globalThis.__axeRollback=GAME_STATE.progression.forestry.axeId==='axe.basic'&&GAME_STATE.progression.forestry.ownedAxeIds.length===1&&GAME_STATE.progression.coins===4000&&`+
  `Object.entries(beforeWood).every(([id,count])=>lifeItemCount('material',id)===count);`,lifeContext);
assert(lifeContext.__failedAxe===false&&lifeContext.__axeRollback,
  'Failed axe-upgrade save must restore coins, recipe wood, and equipped axe');
lifeContext.saveGame=()=>true;
vm.runInContext(`GAME_STATE.inventory=[{type:'material',id:'log',quantity:2},{type:'material',id:'oak_log',quantity:3},{type:'material',id:'pine_log',quantity:4}];`+
  `globalThis.__woodBefore=totalLogCount();globalThis.__woodSpent=spendLogs(6);globalThis.__woodAfter=totalLogCount();`+
  `globalThis.__legacyLeft=lifeItemCount('material','log');globalThis.__pineLeft=lifeItemCount('material','pine_log');`+
  `globalThis.__cropIcon=lifeItemIconMarkup('crop','carrot');globalThis.__woodIcon=lifeItemIconMarkup('material','oak_log');`,lifeContext);
assert(lifeContext.__woodBefore===9&&lifeContext.__woodSpent&&lifeContext.__woodAfter===3&&
  lifeContext.__legacyLeft===0&&lifeContext.__pineLeft===3&&
  lifeContext.__cropIcon.includes('farming/harvest/carrot.png')&&lifeContext.__woodIcon.includes('forestry/items/oak.png'),
  'Mixed legacy/species logs must fund expansion and item icons must use matching harvest/wood art');
vm.runInContext(`GAME_STATE.regionId='sunnyFields';const extraPlot=REGION_WORLDS.sunnyFields.farmPlots[0];`+
  `globalThis.__extraCropResults=['turnip','onion','cabbage','wheat','tomato','pumpkin'].map(id=>{`+
  `addLifeItem('seed',id,1);const planted=plantFarmCrop(extraPlot,id);`+
  `GAME_STATE.world.plots[extraPlot.id].plantedAt=Date.now()-LIFE_CROP_BY_ID.get(id).growMs-1;`+
  `const ready=getFarmPlotPhase(extraPlot)==='READY';const harvested=harvestFarmCrop(extraPlot);`+
  `return planted&&ready&&harvested&&lifeItemCount('crop',id)>0&&lifeItemIconMarkup('crop',id).includes('farming/harvest/'+id+'.png');});`,lifeContext);
assert(lifeContext.__extraCropResults.length===6&&lifeContext.__extraCropResults.every(Boolean),
  'All six added crops must plant, mature offline, harvest, and show their own inventory icon');
lifeContext.player={moving:false};lifeContext.menuOpen=false;lifeContext.dialogOpen=false;
lifeContext.clearMovement=()=>{};
let chopSoundCount=0;
lifeContext.playForestryChopSound=()=>{chopSoundCount+=1;};
vm.runInContext(`GAME_STATE.regionId='deepForest';GAME_STATE.appearance.activeTool='axe';GAME_STATE.progression.forestry.axeId='axe.basic';`+
  `const sharedSource=REGION_WORLDS.deepForest.trees.find(tree=>tree.species==='oak');`+
  `const sharedTree={...sharedSource,id:forestTreeId(sharedSource.x,sharedSource.y,'deepForest'),interactable:true};`+
  `globalThis.__sharedStart=startTreeChop(sharedTree);globalThis.__repeatDuringChop=startTreeChop(sharedTree);`+
  `updateLifeContentUi(100+FORESTRY_CHOP_TIMING.impactMs-1);`+
  `globalThis.__beforeImpactHp=getTreeState(sharedTree).hp;`+
  `updateLifeContentUi(100+FORESTRY_CHOP_TIMING.impactMs);`+
  `globalThis.__afterImpactHp=getTreeState(sharedTree).hp;`+
  `updateLifeContentUi(100+FORESTRY_CHOP_TIMING.durationMs);`+
  `globalThis.__chopFinished=!isChoppingTree();`,lifeContext);
assert(lifeContext.__sharedStart&&lifeContext.__repeatDuringChop===false&&
  lifeContext.__beforeImpactHp===100&&lifeContext.__afterImpactHp===80&&
  lifeContext.__chopFinished&&chopSoundCount===1,
  'The same oak must accept the basic axe in forest 1-2; damage and sound occur once on the swing frame');
vm.runInContext(`const airBefore=JSON.stringify(GAME_STATE);
  globalThis.__airStart=startAxeSwing();globalThis.__airRepeat=startAxeSwing();
  updateLifeContentUi(100+FORESTRY_CHOP_TIMING.impactMs);
  updateLifeContentUi(100+FORESTRY_CHOP_TIMING.impactMs+1);
  updateLifeContentUi(100+FORESTRY_CHOP_TIMING.durationMs);
  globalThis.__airSafe=JSON.stringify(GAME_STATE)===airBefore&&!isChoppingTree();
  player.moving=true;globalThis.__movingAir=startAxeSwing();player.moving=false;
  menuOpen=true;globalThis.__menuAir=startAxeSwing();menuOpen=false;
  dialogOpen=true;globalThis.__dialogAir=startAxeSwing();dialogOpen=false;`,lifeContext);
assert(lifeContext.__airStart&&!lifeContext.__airRepeat&&lifeContext.__airSafe&&chopSoundCount===1&&
  !lifeContext.__movingAir&&!lifeContext.__menuAir&&!lifeContext.__dialogAir,
  'Air swings must animate once without damage, rewards, save changes or tree impact sounds; overlays/movement block them');
vm.runInContext(`GAME_STATE.appearance.activeTool='rod';
  const beforeRejectedChop=JSON.stringify(GAME_STATE);
  globalThis.__rodAir=startAxeSwing();globalThis.__rodTree=startTreeChop(sharedTree);
  globalThis.__rodChopSafe=JSON.stringify(GAME_STATE)===beforeRejectedChop&&!isChoppingTree();
  GAME_STATE.appearance.activeTool='axe';startAxeSwing();
  globalThis.__busyEquipAxe=equipForestryAxe('axe.basic');
  updateLifeContentUi(100+FORESTRY_CHOP_TIMING.durationMs);`,lifeContext);
assert(lifeContext.__rodAir===false&&lifeContext.__rodTree===false&&lifeContext.__rodChopSafe&&
  lifeContext.__busyEquipAxe===false,
  'Held rods must reject both axe entry points; equipment cannot change until a swing finishes');

const farmDrawCalls=[];
const farmIds=['carrot','turnip','potato','onion','cabbage','wheat','corn','tomato','strawberry','pumpkin'];
const farmNow=Date.now();
const farmDrawContext={
  GAME_STATE:{regionId:'sunnyFields'},TILE:48,camX:0,camY:0,
  WORLD_DEFINITION:{farmPlots:farmIds.flatMap((crop,index)=>[
    {x:index,y:0,crop,phase:'GROWING',elapsed:100},
    {x:index,y:1,crop,phase:'GROWING',elapsed:3000},
    {x:index,y:2,crop,phase:'GROWING',elapsed:6500},
    {x:index,y:3,crop,phase:'READY',elapsed:11000}
  ])},
  LIFE_CROP_BY_ID:new Map(farmIds.map(id=>[id,{id,growMs:10000}])),
  youngCropImgs:Object.fromEntries(farmIds.map(id=>[id,{id,stage:'young'}])),
  matureCropImgs:Object.fromEntries(farmIds.map(id=>[id,{id,stage:'mature'}])),
  getFarmPlotPhase:plot=>plot.phase,
  getFarmPlotState:plot=>({cropId:plot.crop,plantedAt:farmNow-plot.elapsed}),
  ctx:{save(){},restore(){},fillRect(){},strokeRect(){},beginPath(){},arc(){},stroke(){},
    drawImage(sprite,_x,_y,width,height){farmDrawCalls.push({id:sprite.id,stage:sprite.stage,width,height});}}
};
vm.createContext(farmDrawContext);
vm.runInContext(`${read('src/rendering.js')}\ndrawFarmGround();`,farmDrawContext);
assert(farmDrawCalls.length===farmIds.length*2&&farmIds.every((id,index)=>
  farmDrawCalls[index*2].id===id&&farmDrawCalls[index*2].stage==='young'&&farmDrawCalls[index*2].width===48&&
  farmDrawCalls[index*2+1].id===id&&farmDrawCalls[index*2+1].stage==='mature'&&farmDrawCalls[index*2+1].width===58),
  'Covered seeds and shared sprouts must not show mature art; only later stages use distinct crop-specific sprites');

// Sprite contracts are verified using the actual packed PNGs, not just string checks.
const rigContext={};
vm.createContext(rigContext);
vm.runInContext(read('src/data/character-rig-data.js')+'\nglobalThis.rig=CHARACTER_RIG;',rigContext);
const rig=rigContext.rig;
assert(rig.cell===96&&rig.feet.join(',')==='48,88'&&rig.renderSize===100,
  'Character must use one cell, feet baseline and render scale across all actions');
assert(rig.handedness==='right'&&rig.poses.walk.frames.down.every(f=>f.grip[0]<48)&&
  rig.poses.walk.frames.up.every(f=>f.grip[0]>48),
  'Both held tools must use anatomical right hand, not screen-right in every direction');
for(const [pose,definition] of Object.entries(rig.poses)){
  const layers={};
  for(const name of ['body','head','hair','outfit','backpack','grip']){
    const image=decodePNG(fs.readFileSync(path.join(root,`assets/player/rig-v1/${pose}-${name}.png`)));
    assert(image.width===definition.columns*96&&image.height===384,`Bad layer grid: ${pose}-${name}`);
    layers[name]=image;
  }
  const reference=decodePNG(fs.readFileSync(path.join(root,`assets/player/source/rig-v1/${pose}-reference.png`)));
  const composed=Buffer.alloc(reference.data.length);
  for(const name of ['body','outfit','backpack','head','hair','grip']){
    const pixels=layers[name].data;
    for(let i=0;i<pixels.length;i+=4)if(pixels[i+3])pixels.copy(composed,i,i,i+4);
  }
  assert(composed.equals(reference.data),`Default layers must reproduce normalized original exactly: ${pose}`);
  if(pose==='chop'){
    // Regression: these original backpack cap pixels must survive replacing
    // action head/hair with the canonical idle head, and tint with the bag.
    const spans=[[54,30,36],[55,28,36],[56,27,35],[57,27,35],[58,26,36],[59,25,36],[60,24,34]];
    let capPixels=0;
    for(const row of [1,2])for(const [y,left,right] of spans)for(let x=left;x<=right;x++){
      const xx=row===1?x:95-x,p=((row*96+y)*reference.width+96+xx)*4;
      if(!reference.data[p+3])continue;
      assert(layers.backpack.data.subarray(p,p+4).equals(reference.data.subarray(p,p+4))&&
        !layers.head.data[p+3]&&!layers.hair.data[p+3],
        'Side impact backpack top/outline must belong to backpack, not replaceable head/hair');
      capPixels++;
    }
    assert(capPixels>=120,'Both side impact backpack caps must retain the full original contour');
  }
  let coveredBody=0;
  for(let i=0;i<layers.body.data.length;i+=4)if(layers.body.data[i+3]&&layers.outfit.data[i+3])coveredBody++;
  assert(coveredBody>60,`Body must exist underneath clothing, not only as cut-out exposed pixels: ${pose}`);
  for(const [face,frames] of Object.entries(definition.frames)){
    assert(frames.length===definition.columns,`Missing action frames: ${pose}/${face}`);
    for(const frame of frames)assert(frame.grip.every(n=>Number.isInteger(n)&&n>=0&&n<96)&&Number.isFinite(frame.angle),
      `Invalid frame grip: ${pose}/${face}`);
    if(face==='left')for(let i=0;i<frames.length;i++)assert(
      frames[i].grip[0]===95-definition.frames.right[i].grip[0]-(pose==='walk'?8:0)&&
      frames[i].grip[1]===definition.frames.right[i].grip[1]-(pose==='walk'?3:0)&&frames[i].toolBehind,
      'Left-facing right hand must stay on the far side; shared two-hand action pivots stay aligned');
  }
}
for(const [key,tool] of Object.entries(rig.tools)){
  const image=decodePNG(fs.readFileSync(path.join(root,`assets/player/rig-v1/tools/${key.replace('.','-')}.png`)));
  let opaqueGrip=false;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
    const x=tool.grip[0]+dx,y=tool.grip[1]+dy;
    if(x>=0&&x<96&&y>=0&&y<96&&image.data[(y*96+x)*4+3])opaqueGrip=true;
  }
  assert(image.width===96&&image.height===96&&opaqueGrip&&tool.nativeLength>0,`Bad normalized tool grip: ${key}`);
}
const characterCalls=[];
const characterRotations=[],characterTranslations=[];
const characterContext={
  GAME_STATE:{regionId:'oldForest',appearance:{activeTool:'axe',outfitId:'outfit.traveler'}},
  CHARACTER_PARTS:{body:new Map(),hair:new Map(),backpack:new Map()},
  characterLayerImgs:{},characterToolImgs:{},characterOutfitImgs:{},DEFAULT_OUTFIT_ID:'outfit.traveler',
  player:{py:480,px:100,face:'down',moving:false},lifeUi:{chop:null},tNow:100,
  FORESTRY_CHOP_TIMING:{impactMs:270},FISHING_CONFIG:{castMs:320},fishingState:{phase:'idle',timer:0},
  isFishingActive:()=>false,getEquippedForestryAxe:()=>({asset:'basic'}),getEquippedFishingRod:()=>({asset:'basic'}),
  DESKTOP_SMOOTH_RENDER:false,camX:0,camY:0,TILE:48,
  ctx:{save(){},restore(){},translate(x,y){characterTranslations.push([x,y]);},
    rotate(angle){characterRotations.push(angle);},scale(){},
    drawImage(image,...args){characterCalls.push({id:image.id,args});}}
};
for(const [pose,definition] of Object.entries(rig.poses))for(const name of ['Body','Head','Hair','Outfit','Backpack','Grip'])
  characterContext.characterLayerImgs[pose+name]={id:pose+name,width:definition.columns*96,height:384};
for(const key of Object.keys(rig.tools))characterContext.characterToolImgs[key]={id:key,width:96,height:96};
vm.createContext(characterContext);
vm.runInContext(read('src/data/character-rig-data.js')+'\n'+read('src/character.js')+'\n'+read('src/rendering.js'),characterContext);
vm.runInContext('validateCharacterRigAssets();',characterContext);
for(const [pose,definition] of Object.entries(rig.poses)){
  for(const face of ['down','right','left','up'])for(let frame=0;frame<definition.columns;frame++){
    for(const key of Object.keys(rig.tools)){
      const tool=key.startsWith('rod.')?'rod':'axe',asset=key.slice(4);
      characterContext.getEquippedForestryAxe=()=>({asset});
      characterContext.getEquippedFishingRod=()=>({asset});
      characterCalls.length=0;
      characterRotations.length=0;characterTranslations.length=0;
      const transform=vm.runInContext(`drawCharacterActor(100,100,{pose:'${pose}',face:'${face}',frame:${frame},tool:'${tool}'})`,characterContext);
      const grip=definition.frames[face][frame].grip,unit=100/96;
      const expectedMirror=face==='left'||tool==='axe'&&pose==='walk'&&(face==='down'||face==='up');
      assert(transform.mirror===expectedMirror,'Only carried front/back axes change blade side; rods and swings retain orientation');
      const edgeOn=tool==='axe'&&pose==='walk'&&(face==='down'||face==='up');
      assert(transform.edgeScale===(edgeOn?0.55:1),'Only front/back carried axes use a partially visible edge projection');
      const expectedAxis=edgeOn?(face==='down'?-1.95:-1.19):definition.frames[face][frame].angle;
      assert(transform.axisAngle===expectedAxis,'Side views, rods and swing angles must remain unchanged');
      const expectedLength=(tool==='rod'?(pose==='fish'?48:36):pose==='chop'?34:26)*unit;
      assert(Math.abs(Math.hypot(transform.tip.x-transform.x,transform.tip.y-transform.y)-expectedLength)<1e-8,
        'Edge-on projection must preserve handle attachment and shaft length');
      // A source point on the blade side of the shaft must point forward in
      // both front/back carry views, without changing the handle or shaft tip.
      if(tool==='axe'&&pose==='walk'&&(face==='down'||face==='up')){
        const native=rig.tools[key].nativeAngle;
        const bx=-Math.sin(native)*(transform.mirror?-1:1),by=Math.cos(native);
        const bladeY=Math.sin(transform.rotation)*bx+Math.cos(transform.rotation)*by;
        assert(face==='down'?bladeY>0:bladeY<0,'Carried axe cutting edge must face forward');
      }
      assert(Math.abs(transform.x-(100+(grip[0]-48)*unit))<1e-8&&
        Math.abs(transform.y-(120+(grip[1]-88)*unit))<1e-8,
        'Every equipped tool must attach its own pivot to the same frame-specific hand');
      assert(characterCalls.at(-1).id===pose+'Grip'&&
        (definition.frames[face][frame].toolBehind?characterCalls[0].id===key:characterCalls[3].id===key),
        'Hands must cover the handle; back-facing tools must be behind the body');
      if(pose==='chop'){
        const motion=definition.frames[face][frame].headMotion;
        const expectedNeck=[100+motion.offset[0]*unit,120+(63-88+motion.offset[1])*unit];
        assert(characterRotations.slice(-2).every(angle=>angle===motion.rotation)&&
          characterTranslations.slice(-2).every(([x,y])=>Math.abs(x-expectedNeck[0])<1e-8&&Math.abs(y-expectedNeck[1])<1e-8),
          'Head and hair must share the actual moving neck transform, not merely motion metadata');
        for(const name of ['Head','Hair']){
          const call=characterCalls.find(item=>item.id==='walk'+name);
          assert(call&&call.args[0]===0&&call.args[1]===['down','right','left','up'].indexOf(face)*96&&
            call.args[4]===-48*unit&&call.args[5]===-63*unit&&call.args[6]===100&&call.args[7]===100,
            'Every swing must retain idle head/hair dimensions while pivoting at the neck');
        }
        assert(!characterCalls.some(item=>item.id==='chopHead'||item.id==='chopHair'),
          'Wider authored impact heads must not replace the canonical idle head');
      }
    }
  }
}
for(const face of ['down','right','left','up']){
  const [ready,impact]=rig.poses.chop.frames[face].map(frame=>frame.headMotion);
  assert(ready&&impact&&ready.pivot.join(',')==='48,63'&&impact.pivot.join(',')==='48,63'&&
    ready.offset[1]!==impact.offset[1]&&ready.rotation!==impact.rotation&&
    Math.abs(ready.rotation)<=.05&&Math.abs(impact.rotation)<=.05,
    'Chopping heads must move with the body without scaling or exaggerated tilt');
}
for(let frame=0;frame<2;frame++){
  const right=rig.poses.chop.frames.right[frame].headMotion,left=rig.poses.chop.frames.left[frame].headMotion;
  assert(left.offset[0]===-right.offset[0]&&left.offset[1]===right.offset[1]&&left.rotation===-right.rotation,
    'Left/right head follow-through must be symmetric');
}
characterContext.getEquippedFishingRod=()=>({asset:'basic'});
characterContext.getEquippedForestryAxe=()=>({asset:'basic'});
characterContext.isFishingActive=()=>true;
characterContext.fishingState={phase:'casting',timer:0};
assert(vm.runInContext('getCharacterPose().pose===\'fish\'&&getCharacterPose().frame===0&&getCharacterPose().tool===\'rod\'',characterContext),
  'Casting must use dedicated raised-hands pose and temporarily select the rod');
characterContext.fishingState.phase='waiting';
assert(vm.runInContext('getCharacterPose().frame===1',characterContext),'Waiting must use dedicated holding pose');
characterContext.fishingState.phase='result';
assert(vm.runInContext('getCharacterPose().frame===2',characterContext),'Catching must use dedicated pull pose');
characterContext.lifeUi.chop={startedAt:0,regionId:'oldForest',tree:{y:10}};
characterContext.tNow=100;
assert(vm.runInContext('getCharacterPose().pose===\'chop\'&&getCharacterPose().frame===0',characterContext),'Chop preparation must use the ready pose');
characterContext.tNow=300;
assert(vm.runInContext('getCharacterPose().frame===1',characterContext),'Chop impact must match the existing damage timing');
characterContext.lifeUi.chop=null;
characterContext.isFishingActive=()=>false;
characterContext.player.face='right';characterContext.player.moving=true;
characterContext.tNow=0;
const firstHand=vm.runInContext('getCharacterToolTransform(100,100)',characterContext);
characterContext.tNow=210;
const nextHand=vm.runInContext('getCharacterToolTransform(100,100)',characterContext);
assert(firstHand.x!==nextHand.x||firstHand.y!==nextHand.y,'Held tool must follow walking hands instead of a fixed-offset bob');
characterContext.lifeUi.chop={startedAt:0,regionId:'oldForest',tree:{y:10}};
characterContext.player.face='down';
assert(vm.runInContext('forestryPlayerDrawDepth()',characterContext)===500,'South-facing tree must still naturally cover the character');
characterContext.player.face='up';
assert(vm.runInContext('forestryPlayerDrawDepth()',characterContext)===529,'North-facing chopping must preserve tree depth ordering');
characterContext.lifeUi.chop={startedAt:0,regionId:'oldForest',tree:null};
assert(vm.runInContext('forestryPlayerDrawDepth()',characterContext)===500&&
  vm.runInContext('getCharacterPose().pose',characterContext)==='chop',
  'Air swings must use chopping animation with normal player depth and no missing-tree error');

const marketContext={
  FISH_DATA:[{id:'fish.crucian_carp'},{id:'fish.goldfish'}],
  lifeItemCount:(type,id,inventory=marketContext.GAME_STATE.inventory)=>inventory.reduce((sum,item)=>sum+(item.type===type&&item.id===id?item.quantity:0),0),
  GAME_STATE:{inventory:[
    {type:'fish',id:'fish.crucian_carp',sizeCm:22.5,price:26,quantity:1},
    {type:'fish',id:'fish.goldfish',sizeCm:11.2,price:80,quantity:1},
    {type:'fish',id:'fish.crucian_carp',sizeCm:28.1,price:39,quantity:2},
    {type:'equipment',id:'rod.master_angler',quantity:1}
  ],progression:{coins:100}}
};
vm.createContext(marketContext);
vm.runInContext(`${read('src/data/world-map.js')}\n${read('src/data/region-maps.js')}\n${read('src/data/life-content-data.js')}\n`+
  `function lifeItemName(type,id){return id==='log'?'일반 목재':FOREST_WOOD[id.slice(0,-4)]||'';}\n`+
  `${read('src/market.js')}\n`+
  `globalThis.__sale=planFishSale(new Map([['fish.crucian_carp',2]]));`+
  `globalThis.__multiSale=planFishSale(new Map([['fish.crucian_carp',1],['fish.goldfish',1]]));`+
  `globalThis.__overSale=planFishSale(new Map([['fish.crucian_carp',4]]));`+
  `globalThis.__zeroSale=planFishSale(new Map());`+
  `const goods=[{type:'material',id:'log',quantity:4},{type:'crop',id:'carrot',quantity:3},{type:'equipment',id:'rod.master_angler',quantity:1}];`+
  `globalThis.__goodsSale=planGoodsSale(new Map([['material:log',2],['crop:carrot',1]]),goods);`+
  `globalThis.__goodsOversale=planGoodsSale(new Map([['material:log',5]]),goods);`,marketContext);
assert(vm.runInContext(`marketGoodDefinition('material','birch_log').name==='자작나무'&&
  marketGoodDefinition('material','log').name==='일반 목재'&&
  planGoodsSale(new Map([['material:birch_log',2]]),[{type:'material',id:'birch_log',quantity:3}]).total===32`,marketContext),
  'Species logs must sell for their configured per-species price');
assert(vm.runInContext(`['turnip','onion','cabbage','wheat','tomato','pumpkin'].every(id=>{
  const crop=LIFE_CROP_BY_ID.get(id);
  return marketGoodDefinition('crop',id).price===crop.sellPrice&&
    planGoodsSale(new Map([['crop:'+id,1]]),[{type:'crop',id,quantity:2}]).total===crop.sellPrice;
})`,marketContext),'All added crops must sell individually at their configured prices');
const seedMarketNodes={marketStock:{textContent:''},marketList:{scrollTop:0,innerHTML:''},marketTotal:{textContent:''},marketSellBtn:{disabled:false}};
marketContext.document={getElementById:id=>seedMarketNodes[id]};
marketContext.lifeItemIconMarkup=()=>'<span></span>';
vm.runInContext('renderSeedMarket();',marketContext);
assert((seedMarketNodes.marketList.innerHTML.match(/data-seed-id=/g)||[]).length===10&&
  ['turnip','onion','cabbage','wheat','tomato','pumpkin'].every(id=>seedMarketNodes.marketList.innerHTML.includes(`data-seed-id="${id}"`)),
  'Seed shop must list all ten crops, including the six new seeds');
marketContext.GAME_STATE.inventory.push({type:'material',id:'oak_log',quantity:2},{type:'crop',id:'carrot',quantity:3});
vm.runInContext(`marketState.shop='elli';marketState.view='crops';renderGoodsMarket();globalThis.__cropRows=document.getElementById('marketList').innerHTML;`+
  `marketState.shop='workshop';marketState.view='wood';renderGoodsMarket();globalThis.__woodRows=document.getElementById('marketList').innerHTML;`+
  `marketState.goodsSelection.set('crop:carrot',1);globalThis.__wrongShopSale=sellSelectedGoods();marketState.goodsSelection.clear();`,marketContext);
assert(marketContext.__cropRows.includes('data-good-key="crop:carrot"')&&!marketContext.__cropRows.includes('data-good-key="material:oak_log"')&&
  marketContext.__woodRows.includes('data-good-key="material:oak_log"')&&!marketContext.__woodRows.includes('data-good-key="crop:carrot"')&&
  !marketContext.__wrongShopSale,
  'Ellie must show only crops and Jun must show only logs, with cross-shop selling rejected');
marketContext.GAME_STATE.inventory.splice(-2);
vm.runInContext(`marketState.shop='elli';marketState.view='fish';`,marketContext);
marketContext.GAME_STATE.progression.logging={level:1};
marketContext.GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:['axe.basic']};
marketContext.FORESTRY_AXE_URLS={basic:'basic.png',iron:'iron.png',steel:'steel.png',master:'master.png'};
marketContext.FORESTRY_AXES=vm.runInContext('FORESTRY_AXES',lifeContext);
marketContext.getEquippedForestryAxe=()=>({id:'axe.basic',name:'기본 도끼',tier:1,damage:20,asset:'basic'});
marketContext.getOwnedForestryAxes=()=>[{id:'axe.basic'}];
marketContext.nextForestryAxe=()=>({id:'axe.iron',name:'철 도끼',tier:2,damage:40,asset:'iron',coins:3600,
  materials:{oak_log:60,pine_log:48,birch_log:36}});
marketContext.lifeItemCount=()=>0;
marketContext.canUpgradeForestryAxe=()=>false;
marketContext.skillCardMarkup=()=>'<div>벌목 Lv.1</div>';
vm.runInContext('renderForestryMarket();',marketContext);
assert(seedMarketNodes.marketList.innerHTML.includes('data-axe-id="axe.iron"')&&
  seedMarketNodes.marketList.innerHTML.includes('data-axe-id="axe.steel"')&&
  seedMarketNodes.marketList.innerHTML.includes('data-axe-id="axe.master"')&&
  (seedMarketNodes.marketList.innerHTML.match(/class="marketEquipmentCard/g)||[]).length===4&&
  seedMarketNodes.marketList.innerHTML.includes('이전 도끼를 먼저 구매해 주세요')&&
  seedMarketNodes.marketList.innerHTML.includes('참나무 ×60')&&
  seedMarketNodes.marketList.innerHTML.includes('코인 ×3,600')&&
  seedMarketNodes.marketList.innerHTML.includes('부족: 참나무 60개')&&
  !seedMarketNodes.marketList.innerHTML.includes('0/60')&&
  seedMarketNodes.marketList.innerHTML.includes('disabled')&&
  seedMarketNodes.marketStock.textContent.includes('기본 도끼'),
  'Axe shop must show all four tiers and their recipes while disabling unaffordable or future upgrades');
marketContext.getEquippedForestryAxe=()=>marketContext.FORESTRY_AXES[1];
marketContext.getOwnedForestryAxes=()=>marketContext.FORESTRY_AXES.slice(0,2);
marketContext.nextForestryAxe=()=>marketContext.FORESTRY_AXES[2];
vm.runInContext('renderForestryMarket();',marketContext);
assert(!seedMarketNodes.marketList.innerHTML.includes('data-axe-id="axe.iron"')&&
  seedMarketNodes.marketList.innerHTML.includes('data-axe-id="axe.steel"')&&
  seedMarketNodes.marketList.innerHTML.includes('data-axe-id="axe.master"')&&
  seedMarketNodes.marketList.innerHTML.includes('보유 중')&&
  seedMarketNodes.marketList.innerHTML.includes('이전 도끼를 먼저 구매해 주세요'),
  'Buying one axe must leave later tiers visible and make only the next tier eligible');
marketContext.__allFishData=fishData;
vm.runInContext(`for(const fish of __allFishData) MARKET_FISH_BY_ID.set(fish.id,fish);`,marketContext);
marketContext.FISHING_ROD_URLS=Object.fromEntries(fishingRods.map(rod=>[rod.asset,`${rod.asset}.png`]));
marketContext.GAME_STATE.progression.fishing={level:1,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']};
marketContext.getEquippedFishingRod=()=>fishingRods[0];
marketContext.isFishingRodUnlocked=(rod)=>rod?.id==='rod.basic'||marketContext.GAME_STATE.progression.fishing.purchasedRodIds.includes(rod?.id);
marketContext.canPurchaseFishingRod=()=>false;
vm.runInContext(`${read('src/data/fishing-gear-data.js')}\n${read('src/fishing-gear.js')}\nrenderRodMarket();`,marketContext);
assert((seedMarketNodes.marketList.innerHTML.match(/class="marketEquipmentCard/g)||[]).length===6&&
  ['rod.sturdy','rod.steel','rod.expert','rod.deepwater'].every(id=>seedMarketNodes.marketList.innerHTML.includes(`data-rod-id="${id}"`))&&
  seedMarketNodes.marketList.innerHTML.includes('강태공의 낚싯대')&&
  seedMarketNodes.marketList.innerHTML.includes('도감 보상')&&
  seedMarketNodes.marketList.innerHTML.includes('붕어 ×25')&&
  seedMarketNodes.marketList.innerHTML.includes('코인 ×1,800')&&
  !seedMarketNodes.marketList.innerHTML.includes('0/25')&&
  seedMarketNodes.marketList.innerHTML.includes('낚시 Lv.5 필요')&&
  seedMarketNodes.marketList.innerHTML.includes('disabled'),
  'Ellie must show all rods and concise expandable recipes, including the collection reward and locked tiers');
assert(marketContext.__sale.count===2&&marketContext.__sale.total===65&&
  marketContext.__sale.inventory.length===3&&
  marketContext.__sale.inventory[0].id==='fish.goldfish'&&
  marketContext.__sale.inventory[1].id==='fish.crucian_carp'&&
  marketContext.__sale.inventory[1].quantity===1&&
  marketContext.__sale.inventory[2].type==='equipment'&&
  marketContext.GAME_STATE.inventory.length===4,
  'Market sale must use oldest fish prices, preserve remaining fish and equipment, and avoid mutating source');
assert(marketContext.__overSale===null&&marketContext.__zeroSale.count===0&&marketContext.__zeroSale.total===0,
  'Market must reject overselling and treat empty selection as no sale');
assert(marketContext.__multiSale.count===2&&marketContext.__multiSale.total===106&&
  marketContext.__multiSale.inventory.length===2&&
  marketContext.__multiSale.inventory[0].quantity===2&&
  marketContext.__multiSale.inventory[1].type==='equipment',
  'Market must combine selected species and preserve unsold inventory');
assert(marketContext.__goodsSale.count===3&&marketContext.__goodsSale.total===32&&
  marketContext.__goodsSale.inventory[0].quantity===2&&
  marketContext.__goodsSale.inventory[1].quantity===2&&
  marketContext.__goodsSale.inventory[2].type==='equipment'&&marketContext.__goodsOversale===null,
  'Material sale must use selected quantities, preserve equipment, and reject overselling');
const testClassList=()=>{
  const names=new Set();
  return {add(name){names.add(name);},remove(name){names.delete(name);},contains(name){return names.has(name);}};
};
const marketNodes=new Map(['coinCount','marketCoinCount','marketCoinGain'].map(id=>[id,{
  textContent:'',offsetWidth:100,classList:testClassList()
}]));
const marketWalletNode={offsetWidth:100,classList:testClassList()};
const marketPillNode={classList:testClassList()};
marketContext.document={
  getElementById(id){return marketNodes.get(id);},
  querySelector(selector){return selector==='.marketWallet'?marketWalletNode:marketPillNode;}
};
marketContext.window={matchMedia:()=>({matches:true})};
let saleSoundCount=0;
marketContext.playMarketSaleSound=()=>{saleSoundCount+=1;return true;};
marketContext.saveGame=()=>true;
vm.runInContext(`renderMarket=()=>{};marketState.selection.set('fish.crucian_carp',2);globalThis.__sold=sellSelectedFish();globalThis.__saleMessage=marketState.message;`,marketContext);
assert(marketContext.__sold===true&&marketContext.GAME_STATE.progression.coins===165&&
  marketContext.GAME_STATE.inventory.length===3&&marketNodes.get('coinCount').textContent==='165'&&
  marketNodes.get('marketCoinCount').textContent==='165'&&saleSoundCount===1&&
  marketContext.__saleMessage==='판매 완료! +65',
  'Confirmed sale must remove only selected fish, increase coins and play the supplied sound');
marketContext.saveGame=()=>false;
vm.runInContext(`marketState.selection.set('fish.goldfish',1);globalThis.__failedSale=sellSelectedFish();`,marketContext);
assert(marketContext.__failedSale===false&&marketContext.GAME_STATE.progression.coins===165&&
  marketContext.GAME_STATE.inventory.length===3&&saleSoundCount===1&&
  marketNodes.get('marketCoinCount').textContent==='165',
  'Failed save must roll back fish and coins without playing sale feedback');
const marketFrames=[];
marketContext.window.matchMedia=()=>({matches:false});
marketContext.requestAnimationFrame=callback=>{marketFrames.push(callback);return marketFrames.length;};
marketContext.cancelAnimationFrame=()=>{};
marketContext.GAME_STATE.progression.coins=265;
vm.runInContext('animateMarketCoins(165,265);',marketContext);
marketFrames.shift()(0);
const firstCoinFrame=marketNodes.get('marketCoinCount').textContent;
marketFrames.shift()(450);
const middleCoinFrame=marketNodes.get('marketCoinCount').textContent;
marketFrames.shift()(900);
assert(firstCoinFrame==='165'&&Number(middleCoinFrame)>165&&Number(middleCoinFrame)<265&&
  marketNodes.get('marketCoinCount').textContent==='265'&&
  marketNodes.get('coinCount').textContent==='265'&&
  marketNodes.get('marketCoinGain').textContent==='+100'&&
  marketNodes.get('marketCoinGain').classList.contains('show')&&
  marketWalletNode.classList.contains('coinBump'),
  'Sale animation must count upward and show the gained amount');
vm.runInContext('finishMarketCoinAnimation();',marketContext);
assert(marketNodes.get('marketCoinGain').textContent===''&&
  !marketNodes.get('marketCoinGain').classList.contains('show')&&
  !marketWalletNode.classList.contains('coinBump')&&
  !marketPillNode.classList.contains('coinBump')&&
  marketNodes.get('marketCoinCount').textContent==='265',
  'Closing and reopening the market must not replay a previous sale effect');

const validationScripts = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/data/region-maps.js',
  'src/data/fishing-gear-data.js',
  'src/data/life-content-data.js',
  'src/config.js',
  'src/world.js',
  'src/world-validation.js'
].map(read).join('\n');
const canvasContext = {};
const validationContext = {
  console: { info(){}, warn(){}, error: console.error },
  Image: class {},
  document: {
    getElementById(id){
      if(id!=='game') return null;
      return { width:540, height:960, getContext:()=>canvasContext };
    }
  }
};
vm.createContext(validationContext);
vm.runInContext(`${validationScripts}\nglobalThis.__worldReport=WORLD_VALIDATION_REPORT;globalThis.__marketShop=marketShop;globalThis.__merchant=npcs.find(n=>n.id==='elli');globalThis.__blocked=blocked;globalThis.__path=pathSet;`,validationContext);
const worldReport=validationContext.__worldReport;
assert(worldReport.map==='64x48',`Expected expanded 64x48 world, found ${worldReport.map}`);
assert(worldReport.errors.length===0,`World validation has ${worldReport.errors.length} errors`);
const shop=validationContext.__marketShop,shopBlocked=validationContext.__blocked;
assert(shop.x===27&&shop.y===34&&shop.w===5&&shop.h===4&&
  [...Array(shop.w).keys()].every(dx=>[...Array(shop.h).keys()].every(dy=>shopBlocked.has(`${shop.x+dx},${shop.y+dy}`)))&&
  validationContext.__merchant.roam===0&&
  validationContext.__merchant.x===shop.x+Math.floor(shop.w/2)&&
  validationContext.__merchant.y===shop.y+shop.h&&
  ['26,35','32,35','29,33','29,38','33,26','34,26'].every(tile=>!shopBlocked.has(tile))&&
  ['29,38','29,39','29,40'].every(tile=>validationContext.__path.has(tile)),
  'The entire shop footprint must block movement while all four surrounding approaches remain clear');
vm.runInContext(`GAME_STATE.regionId='oldForest';buildWorldRegion(REGION_WORLDS.oldForest);globalThis.__forestReport=validatePlayableRegion();globalThis.__resourceTrees=trees.filter(tree=>tree.interactable).length;`+
  `globalThis.__forestInterior=trees.filter(tree=>tree.x>2&&tree.x<61&&tree.y>2&&tree.y<45).length;`+
  `globalThis.__allForestChoppable=trees.every(tree=>tree.interactable&&!!tree.id&&!!FOREST_WOOD[tree.species]);`+
  `globalThis.__starterSpecies=trees.every(tree=>FOREST_REGION_SPECIES.oldForest.includes(tree.species));`+
  `globalThis.__forestBoundaryBlocked=[...Array(MAP_W).keys()].every(x=>blocked.has(key(x,0))&&blocked.has(key(x,MAP_H-1)));`+
  `GAME_STATE.regionId='deepForest';buildWorldRegion(REGION_WORLDS.deepForest);globalThis.__deepReport=validatePlayableRegion();globalThis.__deepTrees=trees.filter(tree=>tree.interactable).length;`+
  `globalThis.__deepInterior=trees.filter(tree=>tree.x>2&&tree.x<61&&tree.y>2&&tree.y<45).length;`+
  `globalThis.__advancedSpecies=trees.every(tree=>FOREST_SPECIES.includes(tree.species));`+
  `globalThis.__sharedStarterSpecies=FOREST_REGION_SPECIES.oldForest.every(species=>trees.some(tree=>tree.species===species&&FORESTRY_TREES[tree.species].tier===1));`+
  `globalThis.__advancedFartherNorth=trees.some(tree=>FORESTRY_TREES[tree.species].tier===3)&&`+
  `trees.filter(tree=>FORESTRY_TREES[tree.species].tier===3).every(tree=>tree.y<=23);`+
  `GAME_STATE.regionId='sunnyFields';buildWorldRegion(REGION_WORLDS.sunnyFields);globalThis.__farmReport=validatePlayableRegion();globalThis.__plots=WORLD_DEFINITION.farmPlots.length;`,validationContext);
assert(validationContext.__forestReport.region==='oldForest'&&validationContext.__resourceTrees>=100&&validationContext.__forestInterior>=60&&
  validationContext.__allForestChoppable&&validationContext.__starterSpecies&&validationContext.__forestBoundaryBlocked&&
  validationContext.__deepReport.region==='deepForest'&&validationContext.__deepTrees>=100&&validationContext.__deepInterior>=60&&validationContext.__advancedSpecies&&validationContext.__sharedStarterSpecies&&validationContext.__advancedFartherNorth&&
  validationContext.__farmReport.region==='sunnyFields'&&validationContext.__plots===16,
  'Forest and farm maps must have exits, fishing water, resource trees, and farm plots');
const forestRoutes=vm.runInContext(`REGION_EXITS.lilacVillage.some(exit=>exit.to==='oldForest')&&
  REGION_EXITS.oldForest.some(exit=>exit.to==='deepForest'&&exit.entry.x===25&&exit.entry.y===44)&&
  REGION_EXITS.deepForest.some(exit=>exit.to==='oldForest'&&exit.entry.x===25&&exit.entry.y===3)`,validationContext);
assert(forestRoutes,'Forest 1-1 and 1-2 must have reciprocal, walkable entrances');
const accessibility=vm.runInContext(`Object.values(REGION_WORLDS).map(def=>{
  GAME_STATE.regionId=def.id;buildWorldRegion(def);
  const open=[def.playerSpawn],seen=new Set([key(def.playerSpawn.x,def.playerSpawn.y)]);
  for(let i=0;i<open.length;i++){
    const point=open[i];
    for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){
      const x=point.x+dx,y=point.y+dy,k=key(x,y);
      if(!inside(x,y)||blocked.has(k)||seen.has(k)) continue;
      seen.add(k);open.push({x,y});
    }
  }
  const near=point=>[[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>seen.has(key(point.x+dx,point.y+dy)));
  return {id:def.id,exits:(REGION_EXITS[def.id]||[]).every(exit=>seen.has(key(exit.x,exit.y))),
    fishing:near(def.fishingSpot),trees:trees.filter(tree=>tree.interactable).every(near),
    plots:(def.farmPlots||[]).every(plot=>seen.has(key(plot.x,plot.y)))};
})`,validationContext);
assert(accessibility.every(region=>region.exits&&region.fishing&&region.trees&&region.plots),
  `Each region must have reachable exits, fishing shore, resource trees, and plots: ${JSON.stringify(accessibility)}`);

console.log(`Checks passed: ${scriptFiles.length} scripts, ${htmlIds.size} UI ids, ${assetPaths.length} runtime assets, ${fishData.length} fish, world ${worldReport.map}`);
