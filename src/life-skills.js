function lifeSkillXpForNextLevel(skillId,level){
  if(!LIFE_SKILLS[skillId]||level>=LIFE_SKILL_MAX_LEVEL) return null;
  return LIFE_SKILL_XP_TABLE[Math.max(1,Math.floor(level))-1]||null;
}

function lifeSkillTotalXpForLevel(skillId,level){
  if(!LIFE_SKILLS[skillId]) return 0;
  let total=0;
  for(let current=1;current<Math.min(LIFE_SKILL_MAX_LEVEL,Math.max(1,Math.floor(level)));current++){
    total+=lifeSkillXpForNextLevel(skillId,current);
  }
  return total;
}

function lifeSkillMasteryXpRequired(mastery){
  return LIFE_SKILL_MASTERY_BASE_XP+Math.max(0,Math.floor(mastery))*LIFE_SKILL_MASTERY_STEP_XP;
}

function lifeSkillProgressFromTotal(skillId,totalXp){
  if(!LIFE_SKILLS[skillId]) return null;
  let remaining=Math.max(0,Math.floor(Number(totalXp)||0));
  let level=1;
  while(level<LIFE_SKILL_MAX_LEVEL){
    const required=lifeSkillXpForNextLevel(skillId,level);
    if(remaining<required) break;
    remaining-=required;
    level++;
  }
  let mastery=0;
  if(level>=LIFE_SKILL_MAX_LEVEL){
    while(remaining>=lifeSkillMasteryXpRequired(mastery)){
      remaining-=lifeSkillMasteryXpRequired(mastery);
      mastery++;
    }
  }
  return {
    level,
    xp:level>=LIFE_SKILL_MAX_LEVEL?0:remaining,
    mastery,
    masteryXp:level>=LIFE_SKILL_MAX_LEVEL?remaining:0,
    totalXp:Math.max(0,Math.floor(Number(totalXp)||0))
  };
}

function lifeSkillProgressSnapshot(skillId,progress=GAME_STATE.progression[skillId]){
  const nextLevelXp=lifeSkillXpForNextLevel(skillId,progress.level);
  const currentXp=nextLevelXp===null?progress.masteryXp||0:progress.xp;
  const requiredXp=nextLevelXp===null?lifeSkillMasteryXpRequired(progress.mastery||0):nextLevelXp;
  return {
    level:progress.level,
    xp:progress.xp,
    totalXp:progress.totalXp,
    mastery:progress.mastery||0,
    masteryXp:progress.masteryXp||0,
    nextLevelXp,
    currentXp,
    requiredXp,
    percent:Math.min(100,Math.floor(currentXp/requiredXp*100))
  };
}

function grantLifeSkillXp(skillId,amount){
  const progress=GAME_STATE.progression[skillId];
  if(!LIFE_SKILLS[skillId]||!progress) return null;
  const gained=Math.max(0,Math.floor(Number(amount)||0));
  const before=lifeSkillProgressSnapshot(skillId,progress);
  const next=lifeSkillProgressFromTotal(skillId,progress.totalXp+gained);
  Object.assign(progress,next);
  const after=lifeSkillProgressSnapshot(skillId,progress);
  return {
    ...after,
    gained,
    before,
    after,
    leveledUp:after.level>before.level,
    levelsGained:after.level-before.level,
    masteryGained:after.mastery-before.mastery
  };
}
