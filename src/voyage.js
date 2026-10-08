// Monotonic visible-time clock, independent of capped simulation frames/game time.
var voyageClock={last:performance.now(),visible:document.visibilityState==='visible',checkpointAt:performance.now(),
  boardingUntil:0,nextReturnRetry:0,warningMinute:false,warningTen:false,returnSaveFailed:false,busy:false};
const harborUi={open:false};

function voyageProgress(){
  if(!GAME_STATE.progression.voyage)GAME_STATE.progression.voyage=normalizeSavedVoyageProgress();
  syncVoyageUnlocks();
  return GAME_STATE.progression.voyage;
}
function activeVoyage(){return voyageProgress().activeTrip;}
function checkpointVoyageTime(now=performance.now()){
  if(!voyageClock)return;
  const trip=GAME_STATE.progression.voyage?.activeTrip;
  const route=trip&&VOYAGE_ROUTE_BY_ID.get(trip.destination);
  if(trip&&route?.regionId===GAME_STATE.regionId&&voyageClock.visible&&voyageClock.last!==null){
    const from=Math.max(voyageClock.last,voyageClock.boardingUntil);
    trip.remainingMs=Math.max(0,trip.remainingMs-Math.max(0,now-from));
    if(trip.remainingMs===0)trip.returnPending=true;
  }
  voyageClock.last=Math.max(now,voyageClock.last??now);
}
function resetVoyageClock(now=performance.now()){
  voyageClock.last=now;voyageClock.checkpointAt=now;voyageClock.nextReturnRetry=0;
  voyageClock.warningMinute=false;voyageClock.warningTen=false;
  voyageClock.returnSaveFailed=false;
}
function isVoyageBoarding(){return voyageClock&&performance.now()<voyageClock.boardingUntil;}
function canStartVoyageFishing(){
  checkpointVoyageTime();
  const trip=activeVoyage();
  return !WORLD_DEFINITION.voyageDeck||Boolean(trip&&!trip.returnPending&&trip.remainingMs>0&&!isVoyageBoarding());
}
function setVoyageNotice(message){
  const notice=document.getElementById('voyageNotice');
  if(notice.textContent!==message)notice.textContent=message;
}
function updateVoyageHud(){
  const trip=activeVoyage(),hud=document.getElementById('voyageHud');
  hud.hidden=!trip;
  if(!trip)return;
  const seconds=Math.ceil(trip.remainingMs/1000);
  document.getElementById('voyageTimer').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  hud.classList.toggle('ending',seconds<=60);
  if(trip.returnPending)setVoyageNotice(voyageClock.returnSaveFailed?'귀항 저장 실패 · 잠시 뒤 다시 시도해요':
    isFishingActive()?'운항 종료 · 이번 낚시를 마치면 귀항해요':'운항 종료 · 항구로 돌아가는 중');
}
function updateVoyage(now=performance.now()){
  checkpointVoyageTime(now);
  document.getElementById('voyageBoarding').hidden=!isVoyageBoarding();
  const trip=activeVoyage();
  if(trip&&voyageClock.visible){
    if(trip.remainingMs<=60000&&!voyageClock.warningMinute){voyageClock.warningMinute=true;setVoyageNotice('1분 뒤 귀항해요');}
    if(trip.remainingMs<=10000&&!voyageClock.warningTen){voyageClock.warningTen=true;setVoyageNotice('10초 뒤 귀항해요');}
    if(trip.returnPending&&!isFishingActive()&&now>=voyageClock.nextReturnRetry){
      voyageClock.nextReturnRetry=now+2000;
      returnFromVoyage();
    }else if(now-voyageClock.checkpointAt>=1000){
      voyageClock.checkpointAt=now;saveGame();
    }
  }
  updateVoyageHud();
  if(!activeVoyage()&&typeof releaseVoyageScenes==='function'&&voyageSceneCache.key!==null)releaseVoyageScenes();
}
function refreshHarborCoins(){document.getElementById('coinCount').textContent=GAME_STATE.progression.coins.toLocaleString();}
function buyVoyageTickets(routeId,quantity=1){
  const route=VOYAGE_ROUTE_BY_ID.get(routeId),progress=voyageProgress();
  if(GAME_STATE.regionId!=='coast'||!route?.available||!progress.unlockedRouteIds.includes(routeId)||
    !Number.isInteger(quantity)||quantity<1||quantity>99||voyageClock.busy||isVoyageBoarding()||activeVoyage()||
    progress.ticketCounts[routeId]+quantity>9999||GAME_STATE.progression.coins<route.price*quantity)return false;
  voyageClock.busy=true;
  const coins=GAME_STATE.progression.coins,count=progress.ticketCounts[routeId];
  GAME_STATE.progression.coins-=route.price*quantity;progress.ticketCounts[routeId]+=quantity;
  const saved=saveGame();
  if(!saved){GAME_STATE.progression.coins=coins;progress.ticketCounts[routeId]=count;}
  voyageClock.busy=false;refreshHarborCoins();return saved;
}
function clearVoyageOverlayHistory(){
  try{
    const {pixelLifeOverlay,fishId,...rest}=window.history.state||{};
    window.history.replaceState(rest,'');
  }catch(_){}
}
function departVoyage(routeId){
  const route=VOYAGE_ROUTE_BY_ID.get(routeId),progress=voyageProgress();
  if(GAME_STATE.regionId!=='coast'||!route?.available||!progress.unlockedRouteIds.includes(routeId)||
    progress.ticketCounts[routeId]<1||activeVoyage()||voyageClock.busy||isVoyageBoarding()||isFishingActive())return false;
  voyageClock.busy=true;
  const entry={x:player.x,y:player.y,face:player.face};
  progress.ticketCounts[routeId]--;
  progress.activeTrip={destination:routeId,remainingMs:route.durationMs,returnPending:false,tripSeed:Math.floor(Math.random()*4294967296)};
  resetVoyageClock();
  const moved=enterWorldRegion({to:route.regionId},{skipSave:true});
  const saved=moved&&saveGame();
  if(!saved){
    progress.ticketCounts[routeId]++;progress.activeTrip=null;
    if(moved)enterWorldRegion({to:'coast',entry},{skipSave:true});
  }else{
    closeHarbor({fromHistory:true});clearVoyageOverlayHistory();clearMovement();
    clearTimeout(lifeUi.toastTimer);document.getElementById('lifeToast').classList.remove('show','belowSkill');
    voyageClock.boardingUntil=performance.now()+700;
    document.querySelector('#voyageBoarding b').textContent=`${route.name}로 출항합니다`;
    setVoyageNotice('난간에서 낚시 · 선장에게 조기 귀항');
    document.getElementById('voyageBoarding').hidden=false;
  }
  voyageClock.busy=false;updateVoyageHud();return saved;
}
function closeVoyageOverlays(){
  closeHarbor({fromHistory:true});
  closeInventory({fromHistory:true});closeFishDex({fromHistory:true});closeTreeDex({fromHistory:true});
  closeMarket({fromHistory:true});closeFarmPlot({fromHistory:true});closeCharacterStyle({fromHistory:true});
  if(isSkillLevelUpVisible())dismissSkillLevelUp({fromHistory:true});
  if(dialogOpen)closeDialog();
  toggleMenu(false);clearVoyageOverlayHistory();
}
function returnFromVoyage(){
  const trip=activeVoyage();
  if(!trip||isFishingActive()||voyageClock.busy||isVoyageBoarding())return false;
  checkpointVoyageTime();voyageClock.busy=true;
  const region=GAME_STATE.regionId,entry={x:player.x,y:player.y,face:player.face};
  voyageProgress().activeTrip=null;
  const moved=enterWorldRegion({to:'coast',entry:VOYAGE_HARBOR_ENTRY},{skipSave:true});
  const saved=moved&&saveGame();
  if(!saved){
    voyageProgress().activeTrip=trip;
    if(moved)enterWorldRegion({to:region,entry},{skipSave:true});
    voyageClock.returnSaveFailed=true;
    setVoyageNotice('귀항을 저장하지 못했어요. 다시 시도해 주세요');
  }else{
    closeVoyageOverlays();resetVoyageClock();setVoyageNotice('');
    showLifeToast('마을 항구로 돌아왔어요');
  }
  voyageClock.busy=false;updateVoyageHud();return saved;
}
function isHarborOpen(){return harborUi.open;}
function renderHarbor(){
  const trip=activeVoyage(),progress=voyageProgress();
  document.getElementById('harborTitle').textContent=trip?'선장 마루':'항구 매표소';
  document.getElementById('harborHint').textContent=trip?
    '지금 돌아가면 남은 운항 시간은 사라져요. 사용한 승선권은 돌려받지 않아요.':
    '승선권은 출항할 때 1장 사용해요. 운항 시간은 화면이 보일 때만 줄어들어요.';
  document.getElementById('harborRoutes').innerHTML=trip?
    '<button type="button" class="harborReturn" data-voyage-return>항구로 돌아가기</button>':
    VOYAGE_ROUTES.map(route=>{
      const unlocked=route.available&&progress.unlockedRouteIds.includes(route.id),count=progress.ticketCounts[route.id];
      const evidence=voyageUnlockEvidence();
      const lockedHint=route.id==='mid'?`낚시 Lv.${route.unlockLevel} 또는 얕은 바다 ${route.unlockShallowSpecies}종 발견으로 해금 · 현재 Lv.${evidence.fishingLevel} / ${Math.min(route.unlockShallowSpecies,evidence.shallowSpecies)}종`:'항로를 준비하고 있어요.';
      return `<section class="harborRoute" data-voyage-route="${route.id}"><h3>${route.name}<span>${unlocked?`${route.durationMs/60000}분 · ${count}장 보유`:route.available?'잠김':'준비 중'}</span></h3>${unlocked?
        `<p>승선권 1장 · ${route.price.toLocaleString()}코인</p><div class="harborActions"><button type="button" data-ticket-buy="${route.id}" data-quantity="1" ${GAME_STATE.progression.coins<route.price?'disabled':''}>1장 구매</button><button type="button" data-ticket-buy="${route.id}" data-quantity="5" ${GAME_STATE.progression.coins<route.price*5?'disabled':''}>5장 구매</button><button type="button" data-voyage-depart="${route.id}" ${count<1?'disabled':''}>출항</button></div>`:
        `<p>${lockedHint}</p>`}</section>`;
    }).join('');
}
function openHarbor(options={}){
  if(harborUi.open||isFishingActive()||isVoyageBoarding()||!(GAME_STATE.regionId==='coast'||WORLD_DEFINITION.voyageDeck))return false;
  toggleMenu(false);clearMovement();harborUi.open=true;menuOpen=true;
  document.getElementById('harborStatus').textContent='';renderHarbor();
  const panel=document.getElementById('harborPanel');panel.classList.add('show');panel.setAttribute('aria-hidden','false');
  document.getElementById('harborClose').focus();
  if(!options.fromHistory)pushGameOverlayHistory('harbor');
  return true;
}
function closeHarbor(options={}){
  if(!harborUi.open)return;
  harborUi.open=false;menuOpen=false;
  const panel=document.getElementById('harborPanel');panel.classList.remove('show');panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory)leaveGameOverlayHistory('harbor');
}
document.getElementById('harborClose').addEventListener('click',()=>closeHarbor());
document.getElementById('harborRoutes').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  let saved=false,message='';
  if(button.dataset.ticketBuy){saved=buyVoyageTickets(button.dataset.ticketBuy,Number(button.dataset.quantity));message='승선권을 구매했어요';}
  else if(button.dataset.voyageDepart){saved=departVoyage(button.dataset.voyageDepart);message='출항합니다';}
  else if(button.hasAttribute('data-voyage-return')){saved=returnFromVoyage();message='항구로 돌아왔어요';}
  if(harborUi.open){renderHarbor();document.getElementById('harborStatus').textContent=saved?message:'진행하지 못했어요. 코인·승선권과 저장 공간을 확인해 주세요.';}
});
document.addEventListener('visibilitychange',()=>{
  // Charge the just-finished visible interval once, then discard hidden elapsed time.
  checkpointVoyageTime();voyageClock.visible=document.visibilityState==='visible';
  voyageClock.last=performance.now();
  if(activeVoyage())saveGame();
});
window.addEventListener('pagehide',()=>{
  checkpointVoyageTime();voyageClock.visible=false;voyageClock.last=null;
  if(activeVoyage())saveGame();
});
window.addEventListener('pageshow',()=>{
  voyageClock.visible=document.visibilityState==='visible';voyageClock.last=performance.now();
});
if(activeVoyage())setVoyageNotice('난간에서 낚시 · 선장에게 조기 귀항');
updateVoyageHud();
