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
  if(GAME_STATE.appearance?.activeTool!=='sword'||isChoppingTree()||player.moving||
    menuOpen||dialogOpen||(typeof isFishingActive==='function'&&isFishingActive()))return false;
  clearMovement();
  // Reuse the shared short action lock. No tree target means no tree damage,
  // logging XP, inventory reward, or forestry sound at the impact frame.
  lifeUi.chop={mode:'sword',tree:null,regionId:GAME_STATE.regionId,
    startedAt:performance.now(),struck:false};
  return true;
}
