// Initial test route prices/durations; final economy is assessed with offshore fish.
const VOYAGE_ROUTES=Object.freeze([
  Object.freeze({id:'shallow',name:'얕은 바다',ticketName:'얕은 바다 승선권',regionId:'boatShallow',habitat:'boat_shallow',price:300,durationMs:600000,available:true}),
  Object.freeze({id:'mid',name:'중간 바다',ticketName:'중간 바다 승선권',regionId:'boatMid',habitat:'boat_mid',price:900,durationMs:600000,available:true,unlockLevel:15,unlockShallowSpecies:3}),
  Object.freeze({id:'deep',name:'심해',ticketName:'심해 승선권',regionId:'boatDeep',habitat:'boat_deep',price:2400,durationMs:600000,available:true,unlockLevel:30,unlockMidSpecies:3}),
  Object.freeze({id:'glacier',name:'빙하 해역',ticketName:'빙하 해역 승선권',regionId:'boatGlacier',habitat:'glacier',price:4800,durationMs:600000,available:true,unlockLevel:45,unlockDeepSpecies:3})
]);
const VOYAGE_ROUTE_BY_ID=new Map(VOYAGE_ROUTES.map(route=>[route.id,route]));
const VOYAGE_HARBOR_ENTRY=Object.freeze({x:38,y:33,face:'down'});

function voyageUnlockEvidence(state=GAME_STATE){
  const shallowSpecies=typeof FISH_DATA==='undefined'?0:FISH_DATA.filter(fish=>
    fish.habitat==='boat_shallow'&&Number(state.collections?.fish?.[fish.id]?.count)>0).length;
  const midSpecies=typeof FISH_DATA==='undefined'?0:FISH_DATA.filter(fish=>
    fish.habitat==='boat_mid'&&Number(state.collections?.fish?.[fish.id]?.count)>0).length;
  const deepSpecies=typeof FISH_DATA==='undefined'?0:FISH_DATA.filter(fish=>
    fish.habitat==='boat_deep'&&Number(state.collections?.fish?.[fish.id]?.count)>0).length;
  return {fishingLevel:Number(state.progression?.fishing?.level)||1,shallowSpecies,midSpecies,deepSpecies};
}
function qualifiesForMidVoyage(evidence){
  const route=VOYAGE_ROUTE_BY_ID.get('mid');
  return evidence?.fishingLevel>=route.unlockLevel||evidence?.shallowSpecies>=route.unlockShallowSpecies;
}
function qualifiesForDeepVoyage(evidence){
  const route=VOYAGE_ROUTE_BY_ID.get('deep');
  return evidence?.fishingLevel>=route.unlockLevel||evidence?.midSpecies>=route.unlockMidSpecies;
}
function qualifiesForGlacierVoyage(evidence){
  const route=VOYAGE_ROUTE_BY_ID.get('glacier');
  return evidence?.fishingLevel>=route.unlockLevel||evidence?.deepSpecies>=route.unlockDeepSpecies;
}
function syncVoyageUnlocks(state=GAME_STATE){
  const progress=state.progression.voyage;
  if(progress&&qualifiesForMidVoyage(voyageUnlockEvidence(state))&&!progress.unlockedRouteIds.includes('mid'))
    progress.unlockedRouteIds.push('mid');
  if(progress&&qualifiesForDeepVoyage(voyageUnlockEvidence(state))&&!progress.unlockedRouteIds.includes('deep'))
    progress.unlockedRouteIds.push('deep');
  if(progress&&qualifiesForGlacierVoyage(voyageUnlockEvidence(state))&&!progress.unlockedRouteIds.includes('glacier'))
    progress.unlockedRouteIds.push('glacier');
}
function normalizeSavedVoyageProgress(raw,evidence=null){
  const source=raw&&typeof raw==='object'?raw:{};
  const count=value=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(9999,Math.floor(value))):0;
  const ticketCounts=Object.fromEntries(VOYAGE_ROUTES.map(route=>[route.id,count(source.ticketCounts?.[route.id])]));
  // Reaching the harbor unlocks the first route; future routes require progress.
  const unlockedRouteIds=['shallow',...(qualifiesForMidVoyage(evidence)?['mid']:[]),...(qualifiesForDeepVoyage(evidence)?['deep']:[]),...(qualifiesForGlacierVoyage(evidence)?['glacier']:[]),...(Array.isArray(source.unlockedRouteIds)?source.unlockedRouteIds:[])]
    .filter((id,index,ids)=>VOYAGE_ROUTE_BY_ID.get(id)?.available&&ids.indexOf(id)===index);
  const trip=source.activeTrip,route=VOYAGE_ROUTE_BY_ID.get(trip?.destination);
  let activeTrip=null;
  if(route?.available&&unlockedRouteIds.includes(route.id)&&typeof trip.remainingMs==='number'&&Number.isFinite(trip.remainingMs)&&
    Number.isInteger(trip.tripSeed)&&trip.tripSeed>=0&&trip.tripSeed<=4294967295){
    const remainingMs=Math.max(0,Math.min(route.durationMs,trip.remainingMs));
    activeTrip={destination:route.id,remainingMs,returnPending:trip.returnPending===true||remainingMs===0,tripSeed:trip.tripSeed};
  }
  return {ticketCounts,unlockedRouteIds,activeTrip};
}

function restoreSavedVoyageLocation(){
  const progress=GAME_STATE.progression.voyage;
  const trip=progress.activeTrip;
  const onDeck=Object.values(REGION_WORLDS).some(def=>def.id===GAME_STATE.regionId&&def.voyageDeck);
  if(onDeck&&(!trip||trip.returnPending||trip.remainingMs<=0)){
    GAME_STATE.regionId='coast';GAME_STATE.playerLocation={...VOYAGE_HARBOR_ENTRY};progress.activeTrip=null;
  }else if(trip&&GAME_STATE.regionId!==VOYAGE_ROUTE_BY_ID.get(trip.destination).regionId){
    progress.activeTrip=null;
    if(onDeck){GAME_STATE.regionId='coast';GAME_STATE.playerLocation={...VOYAGE_HARBOR_ENTRY};}
  }else if(onDeck&&trip){
    const definition=REGION_WORLDS[GAME_STATE.regionId],location=GAME_STATE.playerLocation;
    if(definition.voyageDeck?.view==='bow'){
      const onForwardDeck=location&&definition.bridgeAreas.some(a=>location.x>=a.x&&location.x<a.x+a.w&&location.y>=a.y&&location.y<a.y+a.h);
      const occupied=location&&definition.npcs.some(n=>n.x===location.x&&n.y===location.y);
      if(!onForwardDeck||occupied)GAME_STATE.playerLocation={...definition.playerSpawn};
    }
  }
}
