const LIFE_SKILLS=Object.freeze({
  fishing:Object.freeze({id:'fishing',name:'낚시',icon:'🎣'}),
  gathering:Object.freeze({id:'gathering',name:'채집',icon:'🌿'}),
  logging:Object.freeze({id:'logging',name:'벌목',icon:'🪓'}),
  mining:Object.freeze({id:'mining',name:'채광',icon:'⛏️'}),
  cooking:Object.freeze({id:'cooking',name:'요리',icon:'🍳'}),
  hunting:Object.freeze({id:'hunting',name:'수렵',icon:'🏹'})
});

const LIFE_SKILL_MAX_LEVEL=100;

// Provisional curve. Levels 1–20 retain the existing fishing requirements so
// saved progress keeps its meaning; later tiers can be tuned after playtests.
const LIFE_SKILL_XP_TABLE=Object.freeze(Array.from({length:LIFE_SKILL_MAX_LEVEL-1},(_,index)=>{
  const level=index+1;
  if(level<=20) return 60+level*12;
  if(level<=30) return 300+(level-20)*14;
  if(level<=60) return 440+(level-30)*22;
  if(level<=80) return 1100+(level-60)*38;
  return 1860+(level-80)*55;
}));

const LIFE_SKILL_MASTERY_BASE_XP=4000;
const LIFE_SKILL_MASTERY_STEP_XP=250;
