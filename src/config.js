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
  body:new Map([['body.starter',{walkBody:'walkBody',walkHead:'walkHead',walkGrip:'walkGrip',chopBody:'chopBody',chopHead:'chopHead',chopGrip:'chopGrip',fishBody:'fishBody',fishHead:'fishHead',fishGrip:'fishGrip'}]]),
  hair:new Map([['hair.brown',{walkHair:'walkHair',chopHair:'chopHair',fishHair:'fishHair'}],
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
const characterLayerImgs={},characterToolImgs={},characterOutfitImgs={};
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
  return characterAppearancePreview?{...GAME_STATE.appearance,...characterAppearancePreview}:GAME_STATE.appearance||{};
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
}
