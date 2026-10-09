const fishRewardRevealState={open:false,reward:null,returnMenuOpen:false};
function isFishRewardRevealOpen(){return fishRewardRevealState.open;}
function updateFishRewardReveal(){
  if(fishRewardRevealState.open){menuOpen=true;return false;}
  if(dialogOpen||isFishingActive()||(menuOpen&&!isFishDexOpen())||
    (typeof isTreeDexOpen==='function'&&isTreeDexOpen())||
    (typeof isInventoryOpen==='function'&&isInventoryOpen())||
    (typeof isMarketOpen==='function'&&isMarketOpen())||
    (typeof isCharacterStyleOpen==='function'&&isCharacterStyleOpen())||
    (typeof isHarborOpen==='function'&&isHarborOpen())||
    (typeof isFarmPlotOpen==='function'&&isFarmPlotOpen())||
    (typeof isTreeDiscoveryOpen==='function'&&isTreeDiscoveryOpen())||
    (typeof isSkillLevelUpVisible==='function'&&isSkillLevelUpVisible())||
    (typeof isVoyageBoarding==='function'&&isVoyageBoarding())||
    (typeof activeVoyage==='function'&&activeVoyage()?.returnPending))return false;
  const reward=pendingFishDexReward();if(!reward)return false;
  fishRewardRevealState.open=true;fishRewardRevealState.reward=reward;
  fishRewardRevealState.returnMenuOpen=menuOpen;menuOpen=true;clearMovement();
  const overlay=document.getElementById('fishRewardOverlay');
  overlay.className='fishRewardOverlay show'+(reward.frame==='aurora'?' aurora':'')+(reward.boatFlag?' flagReward':'');
  overlay.setAttribute('aria-hidden','false');
  document.getElementById('fishRewardEyebrow').textContent=reward.kind==='habitat'?'HABITAT COMPLETE':'FISH COLLECTION MILESTONE';
  document.getElementById('fishRewardIcon').textContent=reward.symbol;
  document.getElementById('fishRewardProgress').textContent=reward.progress;
  document.getElementById('fishRewardTitle').textContent=reward.name;
  document.getElementById('fishRewardDescription').textContent=reward.description;
  document.getElementById('fishRewardStatus').textContent='';
  document.getElementById('fishRewardClaim').focus();
  if(window.history.state?.pixelLifeOverlay!=='fish-reward')pushGameOverlayHistory('fish-reward');
  return true;
}
function suspendFishRewardReveal(){
  if(!fishRewardRevealState.open)return;
  fishRewardRevealState.open=false;fishRewardRevealState.reward=null;
  menuOpen=fishRewardRevealState.returnMenuOpen;fishRewardRevealState.returnMenuOpen=false;
  clearMovement();
  const overlay=document.getElementById('fishRewardOverlay');
  overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');
}
function claimFishRewardReveal(){
  if(!fishRewardRevealState.open)return false;
  if(!acknowledgeFishDexReward(fishRewardRevealState.reward)){
    document.getElementById('fishRewardStatus').textContent='보상을 저장하지 못했어요. 다시 눌러 주세요.';
    return false;
  }
  suspendFishRewardReveal();
  if(isFishDexOpen())renderFishDex();
  if(!updateFishRewardReveal()){
    if(typeof flushPendingSkillXpFeedback==='function')flushPendingSkillXpFeedback();
    leaveGameOverlayHistory('fish-reward');
    document.getElementById(isFishDexOpen()?'fishDexClose':'btnA')?.focus({preventScroll:true});
  }
  return true;
}
document.getElementById('fishRewardClaim').addEventListener('click',claimFishRewardReveal);
document.getElementById('fishRewardOverlay').addEventListener('keydown',event=>{
  if(event.key!=='Escape'&&event.key!=='Tab')return;
  event.preventDefault();event.stopPropagation();document.getElementById('fishRewardClaim').focus();
});
