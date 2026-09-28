const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
// Keep the phone's existing pixel-snapped rendering untouched. Desktop
// pointer/keyboard play benefits from fractional actor positions at 60Hz.
const DESKTOP_SMOOTH_RENDER = typeof window !== 'undefined' && window.matchMedia?.('(pointer:fine)').matches === true && (navigator.maxTouchPoints||0) === 0;

const PROJECT = Object.freeze({
  name:'Pixel Life',
  architectureVersion:'2.0',
  genre:'Top-down Open World Life Adventure',
  worldModel:'region-based',
  coreRule:'CORE systems stay stable; gameplay grows through Activity Modules.'
});

// Appearance data is independent of the equipped axe and fishing rod.
const DEFAULT_OUTFIT_ID='outfit.traveler';
// Free, temporary wardrobe samples. Do not auto-equip or reset progress.
const TEMPORARY_OUTFIT_IDS=Object.freeze(['outfit.ember','outfit.meadow']);
const TEMPORARY_BACKPACK_IDS=Object.freeze(['pack.ranger','pack.berry']);
const CHARACTER_TRIAL_ENABLED=typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('appearance-preview');
const CHARACTER_TRIAL_SET=Object.freeze({
  outfitId:'outfit.trial.green',hairId:'hair.trial.blond',backpackId:'pack.trial.red'
});
let characterAppearancePreview=null;
// Full, non-saving reference trial also enables gender and the earlier gait.
const CHARACTER_MASTER_PREVIEW_ENABLED=typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('character-master-preview');
// Non-saving body comparison. New-game gender selection is a later UI step.
const CHARACTER_BODY_PREVIEW_ENABLED=CHARACTER_MASTER_PREVIEW_ENABLED||
  typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('character-preview');
let characterBodyPreview=null;
if(CHARACTER_BODY_PREVIEW_ENABLED){
  const requestedCharacter=new URLSearchParams(window.location.search).get('character');
  if(requestedCharacter==='female')characterBodyPreview='female';
  else if(CHARACTER_MASTER_PREVIEW_ENABLED)characterBodyPreview=requestedCharacter==='male'?'male':'female';
}
// The full in-game character reference also carries the earlier, preferred
// down-walk comparison. No gait choice is saved or enabled on the normal URL.
// Opt-in comparison only: never persist a gait choice or change normal play.
const CHARACTER_WALK_PREVIEW_ENABLED=CHARACTER_MASTER_PREVIEW_ENABLED||
  typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('walk-preview');
let characterWalkPreview=CHARACTER_MASTER_PREVIEW_ENABLED?'soft':'balanced';
function setCharacterWalkPreview(mode){
  if(!CHARACTER_WALK_PREVIEW_ENABLED||!['original','balanced','soft'].includes(mode))return false;
  characterWalkPreview=mode;return true;
}
// Ria's frontal face/neck axis is 2 source pixels left of the common x=48
// collar. Keep this exact registration experiment off normal play and saves.
const CHARACTER_RIA_NECK_PREVIEW_ENABLED=typeof window!=='undefined'&&new URLSearchParams(window.location.search).has('ria-neck-preview');
let characterRiaNeckPreview='centered';
// Separate, non-saving full-character reference trial. Do not promote these
// candidate pixels into the protected atlas or normal render path implicitly.
let characterMasterPreview='candidate';
let characterMasterOutfitPreview=null;
const CHARACTER_OUTFITS=Object.freeze([
  Object.freeze({id:DEFAULT_OUTFIT_ID,name:'여행자의 옷',walkSheet:PLAYER_SHEET_URL,
    chopSheet:FORESTRY_CHOP_PLAYER_URL,renderMode:'rig-v1',iconUrl:CHARACTER_POLISH_ICON_URLS.outfit}),
  Object.freeze({id:'outfit.ember',name:'불꽃 탐험복',description:'붉은 재킷과 금빛 잠금 장식, 검은 바지의 탐험복. 임시로 자유롭게 착용할 수 있어요.',
    renderMode:'rig-v1',layers:CHARACTER_TEMP_APPEARANCE_URLS.ember,iconUrl:CHARACTER_TEMP_APPEARANCE_URLS.ember.icon,temporary:true}),
  Object.freeze({id:'outfit.meadow',name:'햇살 정원복',description:'크림색 셔츠에 노란 앞치마와 초록 바지를 갖춘 정원복. 임시로 자유롭게 착용할 수 있어요.',
    renderMode:'rig-v1',layers:CHARACTER_TEMP_APPEARANCE_URLS.meadow,iconUrl:CHARACTER_TEMP_APPEARANCE_URLS.meadow.icon,temporary:true}),
  ...(CHARACTER_TRIAL_ENABLED?[Object.freeze({id:CHARACTER_TRIAL_SET.outfitId,name:'시험용 녹색 옷',
    renderMode:'palette-test',testOnly:true})]:[])
]);
const CHARACTER_OUTFIT_BY_ID=new Map(CHARACTER_OUTFITS.map(outfit=>[outfit.id,outfit]));
const CHARACTER_PARTS=Object.freeze({
  body:new Map([['body.starter',{walkBody:'walkBody',walkHead:'walkHead',walkGrip:'walkGrip',chopBody:'chopBody',chopHead:'chopHead',chopGrip:'chopGrip',fishBody:'fishBody',fishHead:'fishHead',fishGrip:'fishGrip'}],
    ['body.female',{walkBody:'walkBody',walkHead:'femaleWalkHead',walkGrip:'walkGrip',chopBody:'chopBody',chopHead:'femaleChopHead',chopGrip:'chopGrip',fishBody:'fishBody',fishHead:'femaleFishHead',fishGrip:'fishGrip'}]]),
  hair:new Map([['hair.brown',{walkHair:'walkHair',chopHair:'chopHair',fishHair:'fishHair'}],
    ['hair.female.brown',{walkHair:'femaleWalkHair',chopHair:'femaleChopHair',fishHair:'femaleFishHair'}],
    ...(CHARACTER_TRIAL_ENABLED?[[CHARACTER_TRIAL_SET.hairId,{walkHair:'trialWalkHair',chopHair:'trialChopHair',fishHair:'trialFishHair',testOnly:true}]]:[])]),
  backpack:new Map([['pack.traveler',{name:'여행자의 가방',description:'여행자의 기본 가방. 외형만 바뀌며 아이템 보관 수에는 영향을 주지 않아요.',iconUrl:CHARACTER_POLISH_ICON_URLS.backpack,walkBackpack:'walkBackpack',chopBackpack:'chopBackpack',fishBackpack:'fishBackpack'}],
    ['pack.ranger',{name:'숲길 등산가방',description:'초록색 등산가방에 둥글게 만 침낭과 튼튼한 끈을 달았어요. 임시 체험용이며 보관 수는 바뀌지 않아요.',
      walkBackpack:'rangerWalkBackpack',chopBackpack:'rangerChopBackpack',fishBackpack:'rangerFishBackpack',iconUrl:CHARACTER_TEMP_APPEARANCE_URLS.ranger.icon,temporary:true}],
    ['pack.berry',{name:'딸기 소풍가방',description:'둥근 딸기 모양에 초록 잎과 작은 씨앗 무늬가 있는 소풍가방. 임시 체험용이며 보관 수는 바뀌지 않아요.',
      walkBackpack:'berryWalkBackpack',chopBackpack:'berryChopBackpack',fishBackpack:'berryFishBackpack',iconUrl:CHARACTER_TEMP_APPEARANCE_URLS.berry.icon,temporary:true}],
    ...(CHARACTER_TRIAL_ENABLED?[[CHARACTER_TRIAL_SET.backpackId,{walkBackpack:'trialWalkBackpack',chopBackpack:'trialChopBackpack',fishBackpack:'trialFishBackpack',testOnly:true}]]:[])])
});

const WORLD_REGIONS = Object.freeze({
  lilacVillage:{id:'lilacVillage',name:'라일락 연못 마을',status:'playable'},
  oldForest:{id:'oldForest',name:'오래된 숲 1-1',status:'playable'},
  deepForest:{id:'deepForest',name:'오래된 숲 1-2',status:'playable'},
  sunnyFields:{id:'sunnyFields',name:'햇살 농장',status:'playable'},
  riverValley:{id:'riverValley',name:'강 계곡',status:'planned'},
  coast:{id:'coast',name:'해변과 항구',status:'planned'}
});

const ACTIVITY_MODULES = Object.freeze({
  fishing:{id:'fishing',label:'낚시',status:'prototype',entry:'water'},
  gathering:{id:'gathering',label:'채집',status:'planned',entry:'resource-node'},
  cooking:{id:'cooking',label:'요리',status:'planned',entry:'kitchen'},
  defense:{id:'defense',label:'디펜스',status:'planned',entry:'world-event'},
  quests:{id:'quests',label:'퀘스트',status:'planned',entry:'npc'},
  shops:{id:'shops',label:'상점',status:'prototype',entry:'merchant-npc'}
});

const GAME_STATE = {
  regionId:'lilacVillage',
  playerLocation:null,
  inventory:[],
  world:{trees:{},plots:{}},
  collections:{fish:{}},
  appearance:{bodyId:'body.starter',hairId:'hair.brown',backpackId:'pack.traveler',
    outfitId:DEFAULT_OUTFIT_ID,ownedOutfitIds:[DEFAULT_OUTFIT_ID,...TEMPORARY_OUTFIT_IDS],ownedBackpackIds:['pack.traveler',...TEMPORARY_BACKPACK_IDS],activeTool:'axe'},
  progression:{
    coins:0,
    flags:{},
    fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:DEFAULT_FISHING_ROD_ID,purchasedRodIds:[DEFAULT_FISHING_ROD_ID]},
    logging:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0},
    forestry:{axeId:DEFAULT_FORESTRY_AXE_ID,ownedAxeIds:[DEFAULT_FORESTRY_AXE_ID]}
  },
  activity:{active:null}
};

const TILE=WORLD_DEFINITION.tileSize;
const MAP_W=WORLD_DEFINITION.width, MAP_H=WORLD_DEFINITION.height;
const WORLD_W=MAP_W*TILE, WORLD_H=MAP_H*TILE;
const MOVEMENT_CONFIG=Object.freeze({
  playerStepDuration:185,
  npcStepDuration:260
});
const VIEW_W=canvas.width, VIEW_H=canvas.height;

const imgs={},npcImgs={},fishImgs={},forestTreeImgs={},forestStumpImgs={},lifeItemImgs={},matureCropImgs={},youngCropImgs={};
const characterLayerImgs={},characterToolImgs={},characterOutfitImgs={},characterOutfitPreviewImgs={};
const characterMasterOriginals={};
function prepareCharacterMasterPreview(){
  if(!CHARACTER_MASTER_PREVIEW_ENABLED)return;
  const cell=CHARACTER_RIG.cell;
  const moveRiaHead=(image,part)=>{
    const shifted=document.createElement('canvas');shifted.width=image.width;shifted.height=image.height;
    const painter=shifted.getContext('2d',{willReadFrequently:true});painter.imageSmoothingEnabled=false;
    const offsets=[2,-2,2,0];
    for(let row=0;row<4;row++)for(let frame=0;frame<image.width/cell;frame++)
      painter.drawImage(image,frame*cell,row*cell,cell,cell,
        frame*cell+offsets[row],row*cell,cell,cell);
    if(part==='Hair'){
      // Ria's source has a straight, eight-pixel cap at the side-view crown.
      // Round only that tiny cap; never crop the ponytail or alter the atlas cell.
      const pixels=painter.getImageData(0,0,shifted.width,shifted.height),data=pixels.data;
      for(let frame=0;frame<image.width/cell;frame++)for(const [row,left,right,peaks] of [
        [1,45,52,[48,49]],[2,47,53,[50,51]]
      ]){
        const at=(x,y)=>((row*cell+y)*shifted.width+frame*cell+x)*4;
        for(const x of [left,right])data.fill(0,at(x,27),at(x,27)+4);
        const sample=at(peaks[0],27);
        for(const x of peaks)data.set(data.subarray(sample,sample+4),at(x,26));
      }
      painter.putImageData(pixels,0,0);
    }
    return shifted;
  };
  const shortenSharedNeck=image=>{
    const fitted=document.createElement('canvas');fitted.width=image.width;fitted.height=image.height;
    const painter=fitted.getContext('2d',{willReadFrequently:true});painter.drawImage(image,0,0);
    const pixels=painter.getImageData(0,0,image.width,image.height),data=pixels.data;
    for(let frame=0;frame<image.width/cell;frame++)for(let y=57;y<=59;y++)for(let x=45;x<=51;x++){
      const p=(y*image.width+frame*cell+x)*4,shirt=(62*image.width+frame*cell+x)*4;
      const [r,g,b,a]=data.subarray(p,p+4);
      if(a>=128&&r>150&&r>g*1.1&&g>b*1.05&&data[shirt+3]>=128)
        for(let channel=0;channel<3;channel++)data[p+channel]=data[shirt+channel];
    }
    painter.putImageData(pixels,0,0);return fitted;
  };
  for(const pose of ['walk','chop','fish']){
    const bodyKey=pose+'Body',originalBody=characterLayerImgs[bodyKey];
    characterMasterOriginals[bodyKey]={original:originalBody,candidate:shortenSharedNeck(originalBody)};
    for(const part of ['Head','Hair']){
      const key='female'+pose[0].toUpperCase()+pose.slice(1)+part;
      const original=characterLayerImgs[key];
      characterMasterOriginals[key]={original,candidate:moveRiaHead(original,part)};
    }
  }
  setCharacterMasterPreview('candidate');
}
function setCharacterMasterPreview(mode){
  if(!CHARACTER_MASTER_PREVIEW_ENABLED||!['original','candidate'].includes(mode)||
    !characterMasterOriginals.walkBody)return false;
  for(const [key,versions] of Object.entries(characterMasterOriginals))characterLayerImgs[key]=versions[mode];
  characterMasterPreview=mode;return true;
}
function setCharacterMasterOutfitPreview(id){
  if(!CHARACTER_MASTER_PREVIEW_ENABLED||!CHARACTER_OUTFIT_BY_ID.has(id))return false;
  characterAppearancePreview={outfitId:id};characterMasterOutfitPreview=id;return true;
}
const characterRiaNeckHeads={};
function prepareCharacterRiaNeckPreview(){
  if(!CHARACTER_RIA_NECK_PREVIEW_ENABLED||CHARACTER_MASTER_PREVIEW_ENABLED)return;
  for(const pose of ['walk','chop','fish'])for(const part of ['Head','Hair']){
    const key='female'+pose[0].toUpperCase()+pose.slice(1)+part;
    const original=characterLayerImgs[key];
    const centered=document.createElement('canvas');centered.width=original.width;centered.height=original.height;
    const painter=centered.getContext('2d');painter.imageSmoothingEnabled=false;
    const cell=CHARACTER_RIG.cell;
    // Shift only the front-facing row, preserving the other directions,
    // frame cadence, size and foot/collar contract.
    for(let frame=0;frame<original.width/cell;frame++)
      painter.drawImage(original,frame*cell,0,cell,cell,frame*cell+2,0,cell,cell);
    painter.drawImage(original,0,cell,original.width,cell*3,0,cell,original.width,cell*3);
    characterRiaNeckHeads[key]={original,centered};
    characterLayerImgs[key]=centered;
  }
}
function setCharacterRiaNeckPreview(mode){
  if(!CHARACTER_RIA_NECK_PREVIEW_ENABLED||!['original','centered'].includes(mode)||
    !characterRiaNeckHeads.femaleWalkHead)return false;
  for(const [key,versions] of Object.entries(characterRiaNeckHeads))characterLayerImgs[key]=versions[mode];
  characterRiaNeckPreview=mode;return true;
}
function getCharacterOutfitImages(id){
  // Use the same corrected clothes in normal play and the corrected preview.
  // The opt-in original comparison alone keeps the archived costume art.
  return (!CHARACTER_WALK_PREVIEW_ENABLED||characterWalkPreview!=='original')&&characterOutfitPreviewImgs[id]||characterOutfitImgs[id];
}
function loadImage(src){ return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;}); }
async function loadImageMap(target, urls, optional=false){
  await Promise.all(Object.entries(urls).map(async ([key,url])=>{
    try{ target[key]=await loadImage(url); }
    catch(err){
      if(!optional) throw new Error(`Required asset failed to load: ${key}`,{cause:err});
      console.warn('Optional asset failed to load:',key,err);
    }
  }));
}
// Code-native palette variants for rig QA. Alpha/geometry are copied exactly;
// these are not production art or changes to the original PNGs.
function createCharacterTrialLayer(source,kind){
  const layer=document.createElement('canvas');layer.width=source.width;layer.height=source.height;
  const painter=layer.getContext('2d');painter.drawImage(source,0,0);
  const pixels=painter.getImageData(0,0,layer.width,layer.height),data=pixels.data;
  const color={outfit:[48,119,76],hair:[211,183,119],backpack:[154,58,83]}[kind];
  for(let p=0;p<data.length;p+=4){
    if(!data[p+3])continue;
    const [r,g,b]=data.subarray(p,p+3),light=.2126*r+.7152*g+.0722*b;
    if(light<42||kind==='outfit'&&!(b>r+5&&b>=g))continue;
    const shade=.45+light/170;
    for(let c=0;c<3;c++)data[p+c]=Math.min(255,Math.round(color[c]*shade));
  }
  painter.putImageData(pixels,0,0);return layer;
}
function prepareCharacterTrialSet(){
  if(!CHARACTER_TRIAL_ENABLED)return;
  const outfit={};
  for(const pose of ['walk','chop','fish']){
    const prefix='trial'+pose[0].toUpperCase()+pose.slice(1);
    for(const [part,name] of [['hair','Hair'],['backpack','Backpack'],['outfit','Outfit']]){
      const image=createCharacterTrialLayer(characterLayerImgs[pose+name],part);
      if(part==='outfit')outfit[pose]=image;
      else characterLayerImgs[prefix+name]=image;
    }
  }
  characterOutfitImgs[CHARACTER_TRIAL_SET.outfitId]=outfit;
}
function setCharacterAppearancePreview(parts=null){
  if(!CHARACTER_TRIAL_ENABLED)return false;
  const allowed=['outfitId','hairId','backpackId'];
  if(parts!==null&&(!Array.isArray(parts)||parts.some(part=>!allowed.includes(part))))return false;
  characterAppearancePreview=parts===null?null:Object.fromEntries(parts.map(part=>[part,CHARACTER_TRIAL_SET[part]]));
  return true;
}
function getCharacterRenderAppearance(){
  const body=characterBodyPreview?{bodyId:characterBodyPreview==='female'?'body.female':'body.starter',hairId:characterBodyPreview==='female'?'hair.female.brown':'hair.brown'}:{};
  return {...GAME_STATE.appearance,...body,...characterAppearancePreview};
}
function setCharacterBodyPreview(sex){
  if(!CHARACTER_BODY_PREVIEW_ENABLED||!['male','female'].includes(sex))return false;
  characterBodyPreview=sex;return true;
}
async function loadAll(){
  await Promise.all([
    loadImageMap(imgs,ASSET_URLS),
    loadImageMap(imgs,BUILDING_URLS),
    loadImageMap(fishImgs,FISH_URLS),
    loadImageMap(forestTreeImgs,FOREST_TREE_URLS),
    loadImageMap(forestStumpImgs,FOREST_STUMP_URLS),
    loadImageMap(characterLayerImgs,CHARACTER_LAYER_URLS),
    loadImageMap(characterToolImgs,CHARACTER_TOOL_URLS),
    loadImageMap(lifeItemImgs,LIFE_ITEM_URLS),
    loadImageMap(matureCropImgs,MATURE_CROP_URLS),
    loadImageMap(youngCropImgs,YOUNG_CROP_URLS),
    loadImageMap(npcImgs,NPC_SHEET_URLS,true)
  ]);
  characterOutfitImgs[DEFAULT_OUTFIT_ID]={
    walk:characterLayerImgs.walkOutfit,chop:characterLayerImgs.chopOutfit,fish:characterLayerImgs.fishOutfit
  };
  prepareCharacterRiaNeckPreview();
  prepareCharacterMasterPreview();
  prepareCharacterTrialSet();
  validateCharacterRigAssets();
  // Every future outfit must provide all three pose atlases, not one static icon.
  for(const outfit of CHARACTER_OUTFITS){
    if(outfit.id===DEFAULT_OUTFIT_ID)continue;
    if(outfit.renderMode==='palette-test')continue;
    const images={};
    for(const pose of ['walk','chop','fish']){
      if(!outfit.layers?.[pose])throw new Error(`Missing ${pose} art for ${outfit.id}`);
      const image=await loadImage(outfit.layers[pose]),expected=CHARACTER_RIG.poses[pose].columns*CHARACTER_RIG.cell;
      if(image.width!==expected||image.height!==384)throw new Error(`Wrong outfit atlas for ${outfit.id}: ${pose}`);
      images[pose]=image;
    }
    characterOutfitImgs[outfit.id]=images;
  }
  for(const [id,urls] of Object.entries(CHARACTER_WARDROBE_PREVIEW_URLS)){
    const images={};
    await loadImageMap(images,urls);
    for(const [pose,image] of Object.entries(images))if(image.width!==CHARACTER_RIG.poses[pose].columns*96||image.height!==384)
      throw new Error(`Wrong corrected wardrobe atlas: ${id}/${pose}`);
    characterOutfitPreviewImgs[id]=images;
  }
}
