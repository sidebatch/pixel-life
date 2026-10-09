import {fishingRuntime} from './fishing-balance.mjs';

export function sessionRuntime(seed,overheadSeconds=3,startMinutes=624){
  const r=fishingRuntime(seed);let elapsedMs=0,catches=0;
  function advance(ms){
    elapsedMs+=ms;
    const absolute=startMinutes+elapsedMs/r.WORLD_TIME_CONFIG.realDayDurationMs*1440;
    r.worldTime.day=Math.floor(absolute/1440);r.worldTime.minutes=absolute%1440;r.updateWeather();
  }
  advance(0);
  function context(habitat){return {regionId:'simulation',habitat,period:r.getWorldTimePeriod(),weather:r.getWeatherKind()};}
  function catchFish(habitat){
    r.fishingState.context=context(habitat);
    const rod=r.FISHING_RODS.find(rod=>rod.id===r.state.progression.fishing.equippedRodId);
    advance(r.FISHING_CONFIG.castMs+r.getFishingBiteDelay(r.random(),rod)+overheadSeconds*1000);
    const result=r.createFishingCatch();catches++;return result;
  }
  return {...r,advance,context,catchFish,get elapsedMs(){return elapsedMs;},get catches(){return catches;}};
}
export function quantile(values,p){const ordered=values.toSorted((a,b)=>a-b);return ordered[Math.floor((ordered.length-1)*p)];}

// Independent recipe-only diagnostic: empty bag and the previous rod, not
// future materials stockpiled during earlier coin farming. Travel/repair time
// advances real weather. Tickets/XP progression belong to the full model below.
export function simulateRodMaterials(seed,{overheadSeconds=3,maxCatches=20000}={}){
  const data=fishingRuntime(),targets=data.FISHING_RODS.filter(rod=>rod.fishCost&&rod.id!=='rod.sturdy'),rows=[];
  for(const target of targets){
    const r=sessionRuntime(seed,overheadSeconds,(seed*137.50776405)%1440),state=r.state;
    const previous=target.requiresRodId||({ 'rod.steel':'rod.sturdy','rod.expert':'rod.steel','rod.deepwater':'rod.master_angler' })[target.id];
    state.progression.flags={masterRod:true,fishCollectionRewards:{5:true,10:true,15:true,19:true,20:true}};
    state.progression.fishing.purchasedRodIds=data.FISHING_RODS.filter(rod=>!rod.requiresMasterReward).map(rod=>rod.id);
    state.progression.coins=100000000;r.equipFishingRod(previous);
    const counts=new Map(Object.keys(target.fishCost).map(id=>[id,0]));let habitat=null,repairs=0,repairCoins=0;
    while(r.catches<maxCatches&&[...counts].some(([id,count])=>count<target.fishCost[id])){
      const missing=[...counts].filter(([id,count])=>count<target.fishCost[id]);
      const available=missing.filter(([id])=>{const fish=r.FISH_DATA.find(f=>f.id===id);return r.getEligibleFishPool(r.context(fish.habitat)).some(f=>f.id===id);});
      const fish=r.FISH_DATA.find(f=>f.id===(available[0]||missing[0])[0]);
      if(habitat!==fish.habitat){habitat=fish.habitat;r.advance(45000);}
      if(r.getFishingRodDurability(previous).broken){
        state.regionId='lilacVillage';const cost=r.fishingRodRepairCost(previous);
        if(!r.repairFishingRod(previous))throw Error('Recipe repair failed');
        repairs++;repairCoins+=cost;r.advance(90000);r.equipFishingRod(previous);
      }
      state.regionId='simulation';const result=r.catchFish(habitat);
      if(counts.has(result.fishId))counts.set(result.fishId,counts.get(result.fishId)+1);
      // Keep diagnostic memory bounded; counts are not game ownership.
      state.inventory=[];
    }
    rows.push({seed,targetId:target.id,previousId:previous,maxDurability:r.getFishingRodDurability(previous).max,
      catches:r.catches,repairs,repairCoins,complete:[...counts].every(([id,count])=>count>=target.fishCost[id])});
  }
  return rows;
}

export function simulateTrips({samples=128,overheadSeconds=3}={}){
  const data=fishingRuntime(),reports=[];
  for(const route of data.VOYAGE_ROUTES)for(const rod of data.FISHING_RODS){
    const values=[],xp=[],rates=[];
    for(let seed=1;seed<=samples;seed++){
      const r=sessionRuntime(seed,overheadSeconds,(seed*137.50776405)%1440);
      r.state.progression.fishing.equippedRodId=rod.id;r.state.progression.fishing.purchasedRodIds=data.FISHING_RODS.map(r=>r.id);
      r.state.progression.flags.masterRod=true;
      r.advance(15000);let gross=0,totalXp=0;
      while(r.elapsedMs<route.durationMs){
        if(r.getFishingRodDurability()?.broken)r.equipFishingRod('rod.basic');
        const result=r.catchFish(route.habitat);gross+=result.price;totalXp+=result.xp;r.state.inventory=[];
      }
      r.advance(45000);const repair=r.fishingRodRepairCost(rod);
      r.state.regionId='lilacVillage';r.state.progression.coins=gross;
      if(repair){if(!r.repairFishingRod(rod.id))throw new Error('Trip repair failed');r.advance(5000);}
      const net=gross-route.price-repair;values.push(net);xp.push(totalXp);rates.push(net*60000/r.elapsedMs);
    }
    reports.push({routeId:route.id,rodId:rod.id,samples,losses:values.filter(n=>n<0).length,
      meanNet:values.reduce((a,b)=>a+b,0)/samples,p10Net:quantile(values,.1),p90Net:quantile(values,.9),minNet:Math.min(...values),
      meanNetPerMinute:rates.reduce((a,b)=>a+b,0)/samples,meanXp:xp.reduce((a,b)=>a+b,0)/samples});
  }
  return reports;
}

// A visible-time recipe farmer, not a speedrun: real clock/weather, retained
// future materials, runtime rod purchasing/rewards, random waiting, ticket
// costs, 45s region/port trips and periodic sale trips. Conditional fish are
// camped in their habitat when unavailable, not granted by a fixed pool.
export function simulateGearProgression(seed,{overheadSeconds=3,maxCatches=40000}={}){
  const r=sessionRuntime(seed,overheadSeconds),state=r.state;
  const rods=r.FISHING_RODS.filter(rod=>rod.fishCost),free=['pond','river','mountain_lake','waterfall','swamp','coast'];
  let stage=0,habitat=null,tripEnds=null,sinceChoice=0,glacier=null;
  const milestones=[];
  let repairCoins=0,repairVisits=0;
  function preferredRodId(){return state.progression.flags.masterRod&&stage<4?'rod.master_angler':stage?rods[stage-1].id:'rod.basic';}
  function repairAtPort(){
    const id=preferredRodId(),cost=r.fishingRodRepairCost(id);
    if(cost&&state.progression.coins>=cost){
      state.regionId='lilacVillage';
      if(!r.repairFishingRod(id))throw new Error('Port repair failed');
      repairCoins+=cost;repairVisits++;r.advance(5000);r.equipFishingRod(id);
    }
  }
  const count=id=>state.inventory.filter(i=>i.id===id&&i.type==='fish').reduce((sum,i)=>sum+i.quantity,0);
  const checkpoint=()=>({catches:r.catches,minutes:r.elapsedMs/60000,level:state.progression.fishing.level,
    totalXp:state.progression.fishing.totalXp,coins:state.progression.coins,repairCoins,repairVisits,discovered:Object.keys(state.collections.fish).length});
  function move(next){
    if(next===habitat&&tripEnds===null)return true;
    // A recipe change/expired trip returns to port before another departure.
    // Repair the preferred rod here rather than using basic forever at sea.
    if(tripEnds!==null)repairAtPort();
    const route=r.VOYAGE_ROUTES.find(route=>route.habitat===next);
    if(route){
      r.syncVoyageUnlocks(state);
      if(!state.progression.voyage.unlockedRouteIds.includes(route.id)||state.progression.coins<route.price)return false;
      state.progression.coins-=route.price;r.advance(45000);tripEnds=r.elapsedMs+route.durationMs;r.advance(15000);
      if(route.id==='glacier'&&!glacier)glacier=checkpoint();
    }else{r.advance(45000);tripEnds=null;}
    habitat=next;sinceChoice=0;return true;
  }
  function coinHabitat(){
    r.syncVoyageUnlocks(state);
    return r.VOYAGE_ROUTES.toReversed().find(route=>state.progression.voyage.unlockedRouteIds.includes(route.id)&&
      state.progression.coins>=route.price)?.habitat||'coast';
  }
  for(let step=0;step<maxCatches;step++){
    if(tripEnds!==null&&r.elapsedMs>=tripEnds){repairAtPort();habitat=null;tripEnds=null;}
    const rod=rods[stage];
    if(!rod){
      if(glacier)return {seed,complete:true,glacier,milestones,...checkpoint()};
      // The actual level OR discovery gates are preserved, including early
      // exploration with a low-level basic rod. Never grant missing evidence.
      r.syncVoyageUnlocks(state);
      const route=r.VOYAGE_ROUTES.find(route=>!state.progression.voyage.unlockedRouteIds.includes(route.id));
      const next=route?r.VOYAGE_ROUTES[r.VOYAGE_ROUTES.indexOf(route)-1].habitat:'glacier';
      if(tripEnds===null||habitat!==next)if(!move(next))move('coast');
      if(glacier)return {seed,complete:true,glacier,milestones,...checkpoint()};
    }else if(r.canPurchaseFishingRod(rod,state)){
      if(!r.purchaseFishingRod(rod.id))throw new Error('Runtime rod purchase failed');
      state.progression.fishing.equippedRodId=rod.id;milestones.push({rodId:rod.id,...checkpoint()});
      stage++;sinceChoice=100;continue;
    }else{
      const missing=Object.entries(rod.fishCost).filter(([id,needed])=>count(id)<needed);
      let next;
      if(missing.length){
        const eligible=missing.filter(([id])=>{const fish=r.FISH_DATA.find(f=>f.id===id);
          return r.getEligibleFishPool(r.context(fish.habitat)).some(f=>f.id===id);});
        const target=(eligible[0]||missing[0])[0];next=r.FISH_DATA.find(f=>f.id===target).habitat;
      }else if(rod.requiresMasterRod&&!state.progression.flags.masterRod){
        next=free.toSorted((a,b)=>r.FISH_DATA.filter(f=>f.habitat===b&&!state.collections.fish[f.id]&&
          r.getEligibleFishPool(r.context(b)).some(p=>p.id===f.id)).length-
          r.FISH_DATA.filter(f=>f.habitat===a&&!state.collections.fish[f.id]&&
          r.getEligibleFishPool(r.context(a)).some(p=>p.id===f.id)).length)[0];
      }else next=coinHabitat();
      const targetComplete=habitat&&missing.length&&!missing.some(([id])=>r.FISH_DATA.find(f=>f.id===id).habitat===habitat);
      if(!habitat||sinceChoice>=50||targetComplete){
        if(tripEnds===null||r.elapsedMs>=tripEnds||targetComplete)if(!move(next))move('coast');
      }
      // Auto-equip the earned collection rod only after the result is closed;
      // the real game still requires the player to equip it manually.
      if(state.progression.flags.masterRod&&stage<4)state.progression.fishing.equippedRodId='rod.master_angler';
    }
    if(tripEnds!==null&&r.elapsedMs>=tripEnds){habitat=null;tripEnds=null;continue;}
    const preferred=preferredRodId();
    const durability=r.getFishingRodDurability(preferred),cost=r.fishingRodRepairCost(preferred);
    if(durability.broken){
      if(tripEnds===null&&state.progression.coins>=cost){
        state.regionId='lilacVillage';
        if(!r.repairFishingRod(preferred))throw new Error('Progression repair failed');
        repairCoins+=cost;repairVisits++;r.advance(90000);
      }else r.equipFishingRod('rod.basic');
    }
    if(!r.getFishingRodDurability(preferred).broken)r.equipFishingRod(preferred);
    state.regionId=habitat?.startsWith('boat_')||habitat==='glacier'?'fishingBoat':'simulation';
    const reserved=new Map(rods.slice(stage).flatMap(rod=>Object.entries(rod.fishCost)));
    const before=r.catches,result=r.catchFish(habitat||'coast');sinceChoice++;
    if(count(result.fishId)>(reserved.get(result.fishId)||0)){
      state.progression.coins+=result.price;
      state.inventory.splice(state.inventory.findLastIndex(item=>item.type==='fish'&&item.id===result.fishId),1);
    }
    if(tripEnds===null&&before&&r.catches%50===0)r.advance(45000);
  }
  return {seed,complete:false,glacier,milestones,...checkpoint()};
}

// Blind rotating exploration has no hidden-condition hints or legendary
// requirement for gear. Variable visits avoid aliasing the 30-minute day.
export function simulateDexTour(seed,{maxCatches=150000,overheadSeconds=3}={}){
  const r=sessionRuntime(seed,overheadSeconds),state=r.state;
  state.progression.coins=10000;state.progression.fishing.purchasedRodIds=r.FISHING_RODS.map(rod=>rod.id);
  state.progression.fishing.equippedRodId='rod.deepwater';state.progression.flags.masterRod=true;
  const habitats=['pond','river','mountain_lake','waterfall','swamp','coast','boat_shallow','boat_mid','boat_deep','glacier'];
  let visit=0;
  while(r.catches<maxCatches&&Object.keys(state.collections.fish).length<74){
    let habitat=habitats[visit++%habitats.length],route=r.VOYAGE_ROUTES.find(route=>route.habitat===habitat);
    if(route){
      r.syncVoyageUnlocks(state);
      if(!state.progression.voyage.unlockedRouteIds.includes(route.id)||state.progression.coins<route.price){habitat='coast';route=null;}
      else state.progression.coins-=route.price;
    }
    r.advance(45000);let remaining=route?route.durationMs-15000:null;if(route)r.advance(15000);
    state.regionId='lilacVillage';
    const cost=r.fishingRodRepairCost('rod.deepwater');
    if(cost&&state.progression.coins>=cost){r.repairFishingRod('rod.deepwater');r.advance(5000);}
    r.equipFishingRod(r.getFishingRodDurability('rod.deepwater').broken?'rod.basic':'rod.deepwater');
    state.regionId=route?'fishingBoat':'simulation';
    const visitCatches=40+Math.floor(r.random()*61);
    for(let i=0;i<visitCatches&&r.catches<maxCatches&&Object.keys(state.collections.fish).length<74;i++){
      if(remaining!==null&&remaining<=0)break;
      if(r.getFishingRodDurability()?.broken)r.equipFishingRod('rod.basic');
      const before=r.elapsedMs,result=r.catchFish(habitat);state.progression.coins+=result.price;state.inventory=[];
      if(remaining!==null)remaining-=r.elapsedMs-before;
    }
  }
  return {seed,complete:Object.keys(state.collections.fish).length===74,catches:r.catches,hours:r.elapsedMs/3600000,
    discovered:Object.keys(state.collections.fish).length,level:state.progression.fishing.level};
}
