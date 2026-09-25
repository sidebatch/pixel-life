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
  progression:{
    coins:1230,
    flags:{},
    fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:DEFAULT_FISHING_ROD_ID}
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

const imgs={}, playerImgs={}, npcImgs={}, fishImgs={}, forestTreeImgs={}, forestStumpImgs={}, lifeItemImgs={}, matureCropImgs={}, youngCropImgs={};
let playerSheet=null;
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
async function loadAll(){
  await Promise.all([
    loadImageMap(imgs,ASSET_URLS),
    loadImageMap(imgs,BUILDING_URLS),
    loadImageMap(fishImgs,FISH_URLS),
    loadImageMap(forestTreeImgs,FOREST_TREE_URLS),
    loadImageMap(forestStumpImgs,FOREST_STUMP_URLS),
    loadImageMap(lifeItemImgs,LIFE_ITEM_URLS),
    loadImageMap(matureCropImgs,MATURE_CROP_URLS),
    loadImageMap(youngCropImgs,YOUNG_CROP_URLS),
    loadImageMap(npcImgs,NPC_SHEET_URLS,true)
  ]);

  // The normalized sheet is preferred. Legacy frames are loaded only if it fails.
  try{ playerSheet=await loadImage(PLAYER_SHEET_URL); }
  catch(err){
    console.warn('Player sheet failed; loading legacy fallback frames.',err);
    await loadImageMap(playerImgs,PLAYER_URLS);
  }
}
