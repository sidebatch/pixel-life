import fs from 'node:fs';
import vm from 'node:vm';

export const PERIODS=['DAWN','DAY','DUSK','NIGHT'];
export const WEATHERS=['clear','rain','storm'];
export function fishingRuntime(seed=1){
  let randomState=seed>>>0;
  let saveSucceeds=true;
  const math=Object.create(Math);math.random=()=>{
    randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;
  };
  const state={regionId:'lilacVillage',inventory:[],collections:{fish:{}},progression:{coins:0,flags:{},
    fishing:{level:1,xp:0,totalXp:0,mastery:0,masteryXp:0,equippedRodId:'rod.basic',purchasedRodIds:['rod.basic']},
    voyage:{ticketCounts:{},unlockedRouteIds:['shallow'],activeTrip:null}},appearance:{activeTool:'rod'}};
  const sandbox={Math:math,GAME_STATE:state,saveGame:()=>{sandbox.runtime.syncVoyageUnlocks();return saveSucceeds;}};vm.createContext(sandbox);
  const files=['data/fishing-habitat-data.js','data/fish-data.js','data/fish-reward-data.js','fish-collection-rewards.js','data/fishing-gear-data.js','data/life-skill-data.js',
    'life-skills.js','world-time.js','weather.js','data/voyage-data.js','fishing.js','fishing-gear.js'];
  vm.runInContext(files.map(file=>fs.readFileSync(new URL('../../src/'+file,import.meta.url),'utf8')).join('\n')+
    '\nglobalThis.runtime={FISH_DATA,FISHING_RODS,VOYAGE_ROUTES,FISHING_HABITATS,FISHING_CONFIG,WORLD_TIME_CONFIG,WEATHER_CONFIG,'+
    'worldTime,weatherState,fishingState,fishingCatchStreak,getWorldTimePeriod,getWeatherKind,updateWeather,'+
    'getEligibleFishPool,getEffectiveFishWeight,getFishingBiteDelay,applyFishingRodSizeBonus,calculateFishPrice,'+
    'createFishingCatch,chooseWeightedFish,recordFishingSelection,canPurchaseFishingRod,purchaseFishingRod,equipFishingRod,getFishingRodDurability,fishingRodRepairCost,repairFishingRod,lifeSkillTotalXpForLevel,syncVoyageUnlocks};',sandbox);
  return {...sandbox.runtime,state,random:math.random,setSaveResult(value){saveSucceeds=value;}};
}

// Three repeat states per fish: run of 1, 2, or >=3. Repeats beyond 3 keep the
// runtime's half-weight penalty; they must not be treated as independent rolls.
export function poolModel(runtime,pool,rod){
  const n=pool.length,weights=pool.map(f=>runtime.getEffectiveFishWeight(f,{fishId:null,count:0},rod));
  const initial=weights.map(w=>w/weights.reduce((a,b)=>a+b,0));
  const transitions=Array.from({length:n*3},(_,state)=>{
    const current=Math.floor(state/3),run=state%3;
    const corrected=pool.map(f=>runtime.getEffectiveFishWeight(f,{fishId:pool[current].id,count:run+1},rod));
    const total=corrected.reduce((a,b)=>a+b,0);
    return corrected.map((w,i)=>({fish:i,next:i===current?i*3+Math.min(2,run+1):i*3,p:w/total}));
  });
  let mass=Array(n*3).fill(0);initial.forEach((p,i)=>mass[i*3]=p);
  for(let step=0;step<10000;step++){
    const next=Array(n*3).fill(0);
    transitions.forEach((row,s)=>row.forEach(t=>next[t.next]+=mass[s]*t.p));
    const error=next.reduce((sum,p,i)=>sum+Math.abs(p-mass[i]),0);mass=next;if(error<1e-13)break;
    if(step===9999)throw new Error('Repeat model failed to converge');
  }
  const stationary=Array(n).fill(0);
  transitions.forEach((row,s)=>row.forEach(t=>stationary[t.fish]+=mass[s]*t.p));
  function firstHit(index){
    let survivors=Array(n*3).fill(0);initial.forEach((p,i)=>{if(i!==index)survivors[i*3]=p;});
    let mean=1,median=null,p90=null,survival=1;
    for(let attempt=1;attempt<=20000;attempt++){
      survival=survivors.reduce((a,b)=>a+b,0);
      if(median===null&&survival<=.5)median=attempt;
      if(p90===null&&survival<=.1)p90=attempt;
      if(survival<1e-10)return {mean,median,p90,tail:survival};
      mean+=survival;
      const next=Array(n*3).fill(0);
      transitions.forEach((row,s)=>row.forEach(t=>{if(t.fish!==index)next[t.next]+=survivors[s]*t.p;}));
      survivors=next;
    }
    throw new Error('First discovery tail exceeded limit');
  }
  return {initial,stationary,firstHit};
}

export function expectedFishPrice(runtime,fish,rod){
  // Midpoint integration of the real size/rounding/95%-trophy rules. Unlike
  // basePrice, this includes rod size bonus and exceptional large fish prices.
  let total=0;
  for(let i=0;i<2000;i++){
    const ratio=runtime.applyFishingRodSizeBonus((i+.5)/2000,rod);
    total+=runtime.calculateFishPrice(fish,fish.minSizeCm+ratio*(fish.maxSizeCm-fish.minSizeCm));
  }
  return total/2000;
}

export function balanceReport({overheadSeconds=3,legends=true}={}){
  const runtime=fishingRuntime(),rows=[],legendRows=[];
  const routeByHabitat=new Map(runtime.VOYAGE_ROUTES.map(r=>[r.habitat,r]));
  const prices=new Map(runtime.FISHING_RODS.flatMap(rod=>runtime.FISH_DATA.map(f=>[rod.id+'/'+f.id,expectedFishPrice(runtime,f,rod)])));
  for(const habitat of new Set(runtime.FISH_DATA.map(f=>f.habitat)))for(const period of PERIODS)for(const weather of WEATHERS)
    for(const rod of runtime.FISHING_RODS){
      const pool=runtime.getEligibleFishPool({regionId:'simulation',habitat,period,weather}),model=poolModel(runtime,pool,rod);
      const price=pool.reduce((sum,f,i)=>sum+model.stationary[i]*prices.get(rod.id+'/'+f.id),0);
      const xp=pool.reduce((sum,f,i)=>sum+model.stationary[i]*f.xp,0);
      const cycleMs=runtime.FISHING_CONFIG.castMs+runtime.getFishingBiteDelay(.5,rod)+overheadSeconds*1000;
      const route=routeByHabitat.get(habitat),setupMs=15000,travelMs=45000;
      const repairPerCatch=rod.maxDurability?rod.repairCoins/rod.maxDurability:0;
      // Last cast may finish after expiry. Every normal trip first spends 15s
      // walking to the rail; 45s ticket/port/sale round trip is outside the clock.
      const catches=route?Math.ceil((route.durationMs-setupMs)/cycleMs):null;
      const playMs=route?setupMs+catches*cycleMs+travelMs:null;
      rows.push({habitat,period,weather,rodId:rod.id,pricePerCatch:price,xpPerCatch:xp,cycleMs,
        grossCoinsPerMinute:price*60000/cycleMs,xpPerMinute:xp*60000/cycleMs,
        ticketPrice:route?.price||0,durationMs:route?.durationMs||null,catches,
        repairCoinsPerCatch:repairPerCatch,
        netTripCoins:route?catches*(price-repairPerCatch)-route.price:null,
        netCoinsPerMinute:route?(catches*(price-repairPerCatch)-route.price)*60000/(playMs+(rod.maxDurability?5000:0)):(price-repairPerCatch)*60000/(cycleMs+(rod.maxDurability?90000/rod.maxDurability:0)),
        probabilities:pool.map((f,i)=>({id:f.id,initial:model.initial[i],stationary:model.stationary[i]}))});
      if(legends)pool.forEach((fish,i)=>{if(fish.rarity==='legendary')legendRows.push({fishId:fish.id,habitat,period,weather,rodId:rod.id,
        conditionalProbability:model.initial[i],...model.firstHit(i)});});
    }
  return {assumptions:{overheadSeconds,deckSetupSeconds:15,portAndSaleSeconds:45,repairVisitSeconds:5,freeHabitatRepairRoundTripSeconds:90,amortizedRepair:true,
    conditionalPools:true,repeatPenalty:true,legendAttempts:'Eligible conditions held constant; not real-time discovery promises'},
    rows,legendRows,maxLevelXp:runtime.lifeSkillTotalXpForLevel('fishing',100)};
}

export function routeRegressions(report){
  const runtime=fishingRuntime(),regressions=[];
  for(const period of PERIODS)for(const weather of WEATHERS)for(const rod of runtime.FISHING_RODS){
    const rows=runtime.VOYAGE_ROUTES.map(route=>report.rows.find(row=>row.habitat===route.habitat&&
      row.period===period&&row.weather===weather&&row.rodId===rod.id));
    rows.forEach((row,i)=>{if(i&&row.netCoinsPerMinute<=rows[i-1].netCoinsPerMinute)
      regressions.push({period,weather,rodId:rod.id,lower:rows[i-1].habitat,upper:row.habitat,
        lowerNet:rows[i-1].netCoinsPerMinute,upperNet:row.netCoinsPerMinute});});
  }
  return regressions;
}
