const FISHING_HABITAT_BY_REGION=Object.freeze({
  lilacVillage:FISH_HABITATS.POND,
  oldForest:FISH_HABITATS.RIVER,
  deepForest:FISH_HABITATS.RIVER,
  forestThree:FISH_HABITATS.RIVER,
  forestFour:FISH_HABITATS.RIVER,
  forestFive:FISH_HABITATS.RIVER,
  forestSix:FISH_HABITATS.RIVER,
  forestSeven:FISH_HABITATS.RIVER,
  forestEight:FISH_HABITATS.RIVER,
  forestNine:FISH_HABITATS.RIVER,
  forestTen:FISH_HABITATS.RIVER,
  forestEleven:FISH_HABITATS.RIVER,
  forestTwelve:FISH_HABITATS.RIVER,
  sunnyFields:FISH_HABITATS.POND,
  riverValley:FISH_HABITATS.RIVER,
  coast:FISH_HABITATS.COAST,
  mountainLake:FISH_HABITATS.MOUNTAIN_LAKE,
  waterfallValley:FISH_HABITATS.RIVER,
  reedSwamp:FISH_HABITATS.SWAMP,
  boatShallow:FISH_HABITATS.BOAT_SHALLOW,
  boatMid:FISH_HABITATS.BOAT_MID,
  boatDeep:FISH_HABITATS.BOAT_DEEP,
  boatGlacier:FISH_HABITATS.GLACIER
});

function fishingAreaContainsTile(area,tile){
  if(!area||!tile||!Number.isInteger(tile.x)||!Number.isInteger(tile.y)) return false;
  if(tile.x<area.x||tile.x>=area.x+area.w||tile.y<area.y||tile.y>=area.y+area.h) return false;
  return !(area.cutCorners&&
    (tile.x===area.x||tile.x===area.x+area.w-1)&&
    (tile.y===area.y||tile.y===area.y+area.h-1));
}

function getFishingHabitat(regionId,spot=null){
  return spot?.fishingHabitat||FISHING_HABITAT_BY_REGION[regionId]||FISH_HABITATS.POND;
}

function resolveFishingSpot(definition,tile,regionId=definition?.id){
  if(!definition||!tile) return null;
  const area=(definition.waterAreas||[]).find(candidate=>
    candidate.fishable!==false&&fishingAreaContainsTile(candidate,tile)
  );
  if(!area?.id) return null;
  const resolvedRegionId=regionId||definition.id;
  return {
    regionId:resolvedRegionId,
    spotId:area.id,
    fishingHabitat:getFishingHabitat(resolvedRegionId,area),
    x:tile.x,
    y:tile.y
  };
}
