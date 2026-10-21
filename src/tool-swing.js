// Add a free rod swing without changing the authored body/grip or fishing pose.
const ROD_SWING_ACTION=Object.freeze({artPose:'chop',columns:2,frames:SWORD_ACTION.frames});

function startHeldToolSwing(){
  const tool=GAME_STATE.appearance?.activeTool||'axe';
  if(!['axe','rod','sickle','sword'].includes(tool)||isChoppingTree()||player.moving||
    menuOpen||dialogOpen||isFishingActive()||
    (typeof isVoyageBoarding==='function'&&isVoyageBoarding())||
    (typeof isSkillLevelUpVisible==='function'&&isSkillLevelUpVisible())||
    (typeof isTreeDiscoveryOpen==='function'&&isTreeDiscoveryOpen())||
    (typeof isFishRewardRevealOpen==='function'&&isFishRewardRevealOpen()))return false;
  if(tool==='axe')return !getForestryAxeDurability()?.broken&&startAxeSwing();
  if(tool==='sword')return startSwordSwing();
  if(tool==='rod'&&(!isFishingRodUnlocked(getEquippedFishingRod())||getFishingRodDurability()?.broken))return false;
  clearMovement();
  // No target: the common impact phase cannot harvest, damage, grant XP or wear.
  lifeUi.chop={mode:tool,tree:null,plot:null,regionId:GAME_STATE.regionId,
    startedAt:performance.now(),struck:false};
  if(typeof playHuntingSwing==='function')playHuntingSwing(tool);
  return true;
}
