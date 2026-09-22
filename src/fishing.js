// Fishing System v0.1 — the first vertical slice is intentionally simple:
// every cast succeeds, and the player's choice is only when to reel in.
const FISHING_CONFIG = Object.freeze({
  castMs: 320,
  minWaitMs: 1000,
  maxWaitMs: 3000,
  starterFish: Object.freeze({
    id: 'crucianCarp',
    name: '붕어',
    emoji: '🐟',
    minSizeCm: 12,
    maxSizeCm: 35,
    basePrice: 25,
    xp: 8
  })
});

const fishingState = {
  phase: 'idle',
  timer: 0,
  biteDelay: 0,
  result: null
};

function isFishingActive(){ return fishingState.phase !== 'idle'; }
function isFishingResult(){ return fishingState.phase === 'result'; }

function fishingWaterInFront(){
  const t=facingTile();
  return waterSet.has(key(t.x,t.y));
}

function startFishing(){
  if(menuOpen || isFishingActive() || !fishingWaterInFront()) return false;
  fishingState.phase='casting';
  fishingState.timer=0;
  fishingState.biteDelay=FISHING_CONFIG.minWaitMs+
    Math.random()*(FISHING_CONFIG.maxWaitMs-FISHING_CONFIG.minWaitMs);
  fishingState.result=null;
  GAME_STATE.activity.active='fishing';
  inputs.up=inputs.down=inputs.left=inputs.right=false;
  activeDir=null;
  clearPlayerInputBuffer?.();
  return true;
}

function finishFishing(){
  fishingState.phase='idle';
  fishingState.timer=0;
  fishingState.biteDelay=0;
  fishingState.result=null;
  if(GAME_STATE.activity.active==='fishing') GAME_STATE.activity.active=null;
}

function finishFishingResult(){ finishFishing(); }

function createStarterCatch(){
  const fish=FISHING_CONFIG.starterFish;
  const sizeCm=fish.minSizeCm+Math.random()*(fish.maxSizeCm-fish.minSizeCm);
  const ratio=(sizeCm-fish.minSizeCm)/(fish.maxSizeCm-fish.minSizeCm);
  const price=Math.round(fish.basePrice*(0.8+ratio*0.4));
  const result={fishId:fish.id,name:fish.name,emoji:fish.emoji,sizeCm,price,xp:fish.xp};
  GAME_STATE.inventory.push({
    type:'fish', id:fish.id, name:fish.name, sizeCm, price, quantity:1
  });
  return result;
}

function showFishingResult(){
  fishingState.result=createStarterCatch();
  fishingState.phase='result';
  const r=fishingState.result;
  showDialog('낚시 결과',`${r.emoji} ${r.name} · ${r.sizeCm.toFixed(1)}cm\n판매가 ${r.price}G · +${r.xp} Fishing XP`);
}

function updateFishing(dt){
  if(!isFishingActive()) return;
  if(fishingState.phase==='casting'){
    fishingState.timer+=dt;
    if(fishingState.timer>=FISHING_CONFIG.castMs){
      fishingState.phase='waiting';
      fishingState.timer=0;
    }
    return;
  }
  if(fishingState.phase==='waiting'){
    fishingState.timer+=dt;
    if(fishingState.timer>=fishingState.biteDelay){
      fishingState.phase='bite';
      fishingState.timer=0;
    }
  }
}

function handleFishingAction(){
  if(fishingState.phase==='bite') showFishingResult();
}

function getFishingContextText(){
  if(fishingState.phase==='casting') return '🎣 찌를 던지는 중';
  if(fishingState.phase==='waiting') return '🎣 입질을 기다리는 중';
  if(fishingState.phase==='bite') return '❗ 입질! 버튼을 눌러주세요';
  if(fishingState.phase==='result') return '🎣 낚시 결과';
  return '';
}
