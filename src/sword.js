function getEquippedSword(){
  const state=GAME_STATE.progression.swords;
  return SWORD_BY_ID.get(state?.swordId)||SWORDS[0];
}

function getOwnedSwords(){
  const owned=[DEFAULT_SWORD_ID,...(GAME_STATE.progression.swords?.ownedSwordIds||[])];
  return SWORDS.filter(sword=>owned.includes(sword.id));
}

function nextSword(){
  const tier=getEquippedSword().tier;
  return SWORDS.find(sword=>sword.tier===tier+1)||null;
}

function equipSword(id){
  if(getSwordDurability(id)?.broken){showLifeToast('검이 망가졌어요. 준의 도구점에서 수리해 주세요.');return false;}
  if(!getOwnedSwords().some(sword=>sword.id===id)||isChoppingTree()||
    (typeof isFishingActive==='function'&&isFishingActive()))return false;
  const beforeProgress=GAME_STATE.progression.swords,beforeAppearance=GAME_STATE.appearance;
  GAME_STATE.progression.swords={...beforeProgress,swordId:id};
  GAME_STATE.appearance={...normalizeSavedAppearance(beforeAppearance),activeTool:'sword'};
  if(saveGame())return true;
  GAME_STATE.progression.swords=beforeProgress;
  GAME_STATE.appearance=beforeAppearance;
  return false;
}

function startSwordSwing(){
  if(getSwordDurability()?.broken)return false;
  if(typeof isHuntingSwingCoolingDown==='function'&&isHuntingSwingCoolingDown())return false;
  if(GAME_STATE.appearance?.activeTool!=='sword'||isChoppingTree()||player.moving||
    menuOpen||dialogOpen||(typeof isFishingActive==='function'&&isFishingActive()))return false;
  clearMovement();
  // Reuse the shared short action lock. No tree target means no tree damage,
  // logging XP, inventory reward, or forestry sound at the impact frame.
  lifeUi.chop={mode:'sword',tree:null,regionId:GAME_STATE.regionId,
    startedAt:performance.now(),struck:false};
  if(typeof trackHuntingSwing==='function')trackHuntingSwing(lifeUi.chop);
  if(typeof playHuntingSwing==='function')playHuntingSwing('sword');
  return true;
}

function getSwordDurability(swordOrId=getEquippedSword()){
  const sword=typeof swordOrId==='string'?SWORD_BY_ID.get(swordOrId):swordOrId;
  if(!sword)return null;
  if(!sword.maxDurability)return {current:null,max:null,missing:0,broken:false,infinite:true};
  const saved=GAME_STATE.progression.swords?.durabilityBySwordId?.[sword.id];
  const current=Number.isFinite(saved)?Math.max(0,Math.min(sword.maxDurability,Math.floor(saved))):sword.maxDurability;
  return {current,max:sword.maxDurability,missing:sword.maxDurability-current,broken:current===0,infinite:false};
}
function swordRepairCost(sword){const d=getSwordDurability(sword);return !d||d.infinite?0:Math.ceil(d.missing/2);}
function repairSword(id){
  const sword=getOwnedSwords().find(s=>s.id===id),cost=swordRepairCost(sword);
  if(!sword||GAME_STATE.regionId!=='lilacVillage'||!cost||GAME_STATE.progression.coins<cost)return false;
  return Boolean(commitLifeChange(()=>{GAME_STATE.progression.coins-=cost;const p=GAME_STATE.progression.swords;
    p.durabilityBySwordId={...p.durabilityBySwordId,[id]:sword.maxDurability};return true;}));
}
