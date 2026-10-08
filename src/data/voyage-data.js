// Initial test route prices/durations; final economy is assessed with offshore fish.
const VOYAGE_ROUTES=Object.freeze([
  Object.freeze({id:'shallow',name:'얕은 바다',ticketName:'얕은 바다 승선권',regionId:'boatShallow',habitat:'boat_shallow',price:300,durationMs:600000,available:true}),
  Object.freeze({id:'mid',name:'중간 바다',ticketName:'중간 바다 승선권',available:false}),
  Object.freeze({id:'deep',name:'심해',ticketName:'심해 승선권',available:false}),
  Object.freeze({id:'glacier',name:'빙하 해역',ticketName:'빙하 해역 승선권',available:false})
]);
const VOYAGE_ROUTE_BY_ID=new Map(VOYAGE_ROUTES.map(route=>[route.id,route]));
const VOYAGE_HARBOR_ENTRY=Object.freeze({x:38,y:33,face:'down'});
const VOYAGE_TRIAL_FISH_IDS=Object.freeze(['fish.sardine','fish.mackerel','fish.horse_mackerel']);

function normalizeSavedVoyageProgress(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  const count=value=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(9999,Math.floor(value))):0;
  const ticketCounts=Object.fromEntries(VOYAGE_ROUTES.map(route=>[route.id,count(source.ticketCounts?.[route.id])]));
  // Reaching the harbor unlocks the first route; future routes require progress.
  const unlockedRouteIds=['shallow',...(Array.isArray(source.unlockedRouteIds)?source.unlockedRouteIds:[])]
    .filter((id,index,ids)=>VOYAGE_ROUTE_BY_ID.get(id)?.available&&ids.indexOf(id)===index);
  const trip=source.activeTrip,route=VOYAGE_ROUTE_BY_ID.get(trip?.destination);
  let activeTrip=null;
  if(route?.available&&typeof trip.remainingMs==='number'&&Number.isFinite(trip.remainingMs)&&
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
  }
}
