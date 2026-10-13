const LIFE_SKILLS=Object.freeze({
  fishing:Object.freeze({id:'fishing',name:'낚시',icon:'🎣'}),
  gathering:Object.freeze({id:'gathering',name:'채집',icon:'🌿'}),
  logging:Object.freeze({id:'logging',name:'벌목',icon:'🪓'}),
  farming:Object.freeze({id:'farming',name:'농사',icon:'🌾'}),
  mining:Object.freeze({id:'mining',name:'채광',icon:'⛏️'}),
  cooking:Object.freeze({id:'cooking',name:'요리',icon:'🍳'}),
  hunting:Object.freeze({id:'hunting',name:'수렵',icon:'🏹'})
});

const LIFE_SKILL_MAX_LEVEL=100;
const LIFE_SKILL_XP_CURVE_VERSION=2;
// Per bed, reward the complete growth cycle once, regardless of random yield.
const FARMING_XP_PER_GROW_MINUTE=12;

// Keep the original curve to migrate old saves without losing levels or bars.
const LIFE_SKILL_LEGACY_XP_TABLE=Object.freeze(Array.from({length:LIFE_SKILL_MAX_LEVEL-1},(_,index)=>{
  const level=index+1;
  if(level<=20) return 60+level*12;
  if(level<=30) return 300+(level-20)*14;
  if(level<=60) return 440+(level-30)*22;
  if(level<=80) return 1100+(level-60)*38;
  return 1860+(level-80)*55;
}));
// Shared life skill growth: Fishing/Logging are unchanged; Farming uses it too.
// Later requirements rise gradually from 1.15x to 4x (Lv.100: 187,230 XP).
const LIFE_SKILL_XP_TABLE=Object.freeze(LIFE_SKILL_LEGACY_XP_TABLE.map((required,index)=>{
  const level=index+1;
  return level<80?required:Math.round(required*(1+3*(level-79)/20));
}));

const LIFE_SKILL_MASTERY_BASE_XP=4000;
const LIFE_SKILL_MASTERY_STEP_XP=250;
