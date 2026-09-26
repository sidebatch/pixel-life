const ASSET_URLS = Object.freeze({
  bridge: 'assets/world/bridge.png',
  tree: 'assets/world/tree.png',
  treeStage24: 'assets/world/treeStage24.png',
  rock: 'assets/world/rock.png',
  sign: 'assets/world/sign.png',
  bench: 'assets/world/bench.png',
  lamp: 'assets/world/lamp.png',
  bush1: 'assets/world/bush1.png',
  bush2: 'assets/world/bush2.png',
  flower1: 'assets/world/flower1.png',
  flower2: 'assets/world/flower2.png',
  grassTuft: 'assets/world/grassTuft.png',
  reeds: 'assets/world/reeds.png'
});

const MENU_ICON_URLS = Object.freeze({
  bag:'assets/ui/menu/bag.png',
  fishDex:'assets/ui/menu/fish-dex.png'
});

const FOREST_TREE_URLS = Object.freeze({
  oak:'assets/forestry/trees/oak.png',
  pine:'assets/forestry/trees/pine.png',
  birch:'assets/forestry/trees/birch.png',
  maple:'assets/forestry/trees/maple-v2.png',
  spruce:'assets/forestry/trees/spruce-v2.png',
  willow:'assets/forestry/trees/willow.png',
  cypress:'assets/forestry/trees/cypress.png',
  broadleaf:'assets/forestry/trees/broadleaf.png'
});
const FOREST_STUMP_URLS = Object.freeze({
  oak:'assets/forestry/stumps/oak.png',
  pine:'assets/forestry/stumps/pine.png',
  birch:'assets/forestry/stumps/birch.png',
  maple:'assets/forestry/stumps/maple.png',
  spruce:'assets/forestry/stumps/spruce.png',
  willow:'assets/forestry/stumps/willow.png',
  cypress:'assets/forestry/stumps/cypress.png',
  broadleaf:'assets/forestry/stumps/broadleaf.png'
});
const FORESTRY_AXE_URLS = Object.freeze({
  basic:'assets/forestry/axes/basic.png',
  iron:'assets/forestry/axes/iron.png',
  steel:'assets/forestry/axes/steel.png',
  master:'assets/forestry/axes/master.png'
});
const FISHING_ROD_URLS = Object.freeze({
  basic:'assets/fishing/rods/basic.png',
  sturdy:'assets/fishing/rods/sturdy.png',
  steel:'assets/fishing/rods/steel.png',
  expert:'assets/fishing/rods/expert.png',
  deepwater:'assets/fishing/rods/deepwater.png',
  master_angler:'assets/fishing/rods/master_angler.png'
});
const FORESTRY_CHOP_PLAYER_URL='assets/forestry/chop/player-v2.png';
const CHARACTER_POLISH_ICON_URLS=Object.freeze({
  outfit:'assets/player/polish-v1/outfit-icon.png',backpack:'assets/player/polish-v1/backpack-icon.png'
});
const CHARACTER_TEMP_APPEARANCE_URLS=Object.freeze({
  ember:{walk:'assets/player/temporary-appearance/ember-walk.png',chop:'assets/player/temporary-appearance/ember-chop.png',fish:'assets/player/temporary-appearance/ember-fish.png',icon:'assets/player/temporary-appearance/ember-icon.png'},
  meadow:{walk:'assets/player/temporary-appearance/meadow-walk.png',chop:'assets/player/temporary-appearance/meadow-chop.png',fish:'assets/player/temporary-appearance/meadow-fish.png',icon:'assets/player/temporary-appearance/meadow-icon.png'},
  ranger:{icon:'assets/player/temporary-appearance/ranger-icon.png'},
  berry:{icon:'assets/player/temporary-appearance/berry-icon.png'}
});
const CHARACTER_LAYER_URLS=Object.freeze({
  walkBody:'assets/player/polish-v1/walk-body.png',
  walkHead:'assets/player/polish-v1/walk-head.png',
  walkHair:'assets/player/polish-v1/walk-hair.png',
  walkOutfit:'assets/player/polish-v1/walk-outfit.png',
  walkBackpack:'assets/player/polish-v1/walk-backpack.png',
  walkGrip:'assets/player/rig-v1/walk-grip.png',
  chopBody:'assets/player/polish-v1/chop-body.png',
  chopHead:'assets/player/polish-v1/chop-head.png',
  chopHair:'assets/player/polish-v1/chop-hair.png',
  chopOutfit:'assets/player/polish-v1/chop-outfit.png',
  chopBackpack:'assets/player/polish-v1/chop-backpack.png',
  chopGrip:'assets/player/rig-v1/chop-grip.png',
  fishBody:'assets/player/polish-v1/fish-body.png',
  fishHead:'assets/player/polish-v1/fish-head.png',
  fishHair:'assets/player/polish-v1/fish-hair.png',
  fishOutfit:'assets/player/polish-v1/fish-outfit.png',
  fishBackpack:'assets/player/polish-v1/fish-backpack.png',
  fishGrip:'assets/player/rig-v1/fish-grip.png',
  rangerWalkBackpack:'assets/player/temporary-appearance/ranger-walk.png',
  rangerChopBackpack:'assets/player/temporary-appearance/ranger-chop.png',
  rangerFishBackpack:'assets/player/temporary-appearance/ranger-fish.png',
  berryWalkBackpack:'assets/player/temporary-appearance/berry-walk.png',
  berryChopBackpack:'assets/player/temporary-appearance/berry-chop.png',
  berryFishBackpack:'assets/player/temporary-appearance/berry-fish.png'
});
const CHARACTER_TOOL_URLS=Object.freeze({
  'axe.basic':'assets/player/rig-v1/tools/axe-basic.png',
  'axe.iron':'assets/player/rig-v1/tools/axe-iron.png',
  'axe.steel':'assets/player/rig-v1/tools/axe-steel.png',
  'axe.master':'assets/player/rig-v1/tools/axe-master.png',
  'rod.basic':'assets/player/rig-v1/tools/rod-basic.png',
  'rod.sturdy':'assets/player/rig-v1/tools/rod-sturdy.png',
  'rod.steel':'assets/player/rig-v1/tools/rod-steel.png',
  'rod.expert':'assets/player/rig-v1/tools/rod-expert.png',
  'rod.master_angler':'assets/player/rig-v1/tools/rod-master_angler.png',
  'rod.deepwater':'assets/player/rig-v1/tools/rod-deepwater.png'
});
const LIFE_ITEM_URLS = Object.freeze({
  log:'assets/forestry/items/log.png',
  oakLog:'assets/forestry/items/oak.png',
  pineLog:'assets/forestry/items/pine.png',
  birchLog:'assets/forestry/items/birch.png',
  mapleLog:'assets/forestry/items/maple.png',
  spruceLog:'assets/forestry/items/spruce.png',
  willowLog:'assets/forestry/items/willow.png',
  cypressLog:'assets/forestry/items/cypress.png',
  broadleafLog:'assets/forestry/items/broadleaf.png',
  carrotSeed:'assets/farming/seeds/carrot.png',
  turnipSeed:'assets/farming/seeds/turnip.png',
  potatoSeed:'assets/farming/seeds/potato.png',
  onionSeed:'assets/farming/seeds/onion.png',
  cabbageSeed:'assets/farming/seeds/cabbage.png',
  wheatSeed:'assets/farming/seeds/wheat.png',
  cornSeed:'assets/farming/seeds/corn.png',
  tomatoSeed:'assets/farming/seeds/tomato.png',
  strawberrySeed:'assets/farming/seeds/strawberry.png',
  pumpkinSeed:'assets/farming/seeds/pumpkin.png',
  carrotCrop:'assets/farming/harvest/carrot.png',
  turnipCrop:'assets/farming/harvest/turnip.png',
  potatoCrop:'assets/farming/harvest/potato.png',
  onionCrop:'assets/farming/harvest/onion.png',
  cabbageCrop:'assets/farming/harvest/cabbage.png',
  wheatCrop:'assets/farming/harvest/wheat.png',
  cornCrop:'assets/farming/harvest/corn.png',
  tomatoCrop:'assets/farming/harvest/tomato.png',
  strawberryCrop:'assets/farming/harvest/strawberry.png',
  pumpkinCrop:'assets/farming/harvest/pumpkin.png'
});
const MATURE_CROP_URLS = Object.freeze({
  carrot:'assets/farming/mature/carrot.png',
  turnip:'assets/farming/mature/turnip.png',
  potato:'assets/farming/mature/potato.png',
  onion:'assets/farming/mature/onion.png',
  cabbage:'assets/farming/mature/cabbage.png',
  wheat:'assets/farming/mature/wheat.png',
  corn:'assets/farming/mature/corn.png',
  tomato:'assets/farming/mature/tomato.png',
  strawberry:'assets/farming/mature/strawberry.png',
  pumpkin:'assets/farming/mature/pumpkin.png'
});
const YOUNG_CROP_URLS = Object.freeze({
  carrot:'assets/farming/young/carrot.png',
  turnip:'assets/farming/young/turnip.png',
  potato:'assets/farming/young/potato.png',
  onion:'assets/farming/young/onion.png',
  cabbage:'assets/farming/young/cabbage.png',
  wheat:'assets/farming/young/wheat.png',
  corn:'assets/farming/young/corn.png',
  tomato:'assets/farming/young/tomato.png',
  strawberry:'assets/farming/young/strawberry.png',
  pumpkin:'assets/farming/young/pumpkin.png'
});

const PLAYER_URLS = Object.freeze({
  down_0: 'assets/player/legacy/down_0.png',
  down_1: 'assets/player/legacy/down_1.png',
  down_2: 'assets/player/legacy/down_2.png',
  left_0: 'assets/player/legacy/left_0.png',
  left_1: 'assets/player/legacy/left_1.png',
  left_2: 'assets/player/legacy/left_2.png',
  right_0: 'assets/player/legacy/right_0.png',
  right_1: 'assets/player/legacy/right_1.png',
  right_2: 'assets/player/legacy/right_2.png',
  up_0: 'assets/player/legacy/up_0.png',
  up_1: 'assets/player/legacy/up_1.png',
  up_2: 'assets/player/legacy/up_2.png'
});

const NPC_SHEET_URLS = Object.freeze({
  mina: 'assets/npcs/mina.png',
  thomas: 'assets/npcs/thomas.png',
  elli: 'assets/npcs/elli.png',
  noah: 'assets/npcs/noah.png',
  hana: 'assets/npcs/hana.png',
  jun: 'assets/npcs/jun.png'
});

const PLAYER_SHEET_URL = 'assets/player/player.png';

const BUILDING_URLS = Object.freeze({
  buildingHome: 'assets/buildings/home_cottage.png',
  buildingWorkshop: 'assets/buildings/carpenter_workshop.png',
  buildingMarket: 'assets/buildings/elli_market.png'
});

const FISH_URLS = Object.freeze({
  crucian_carp: 'assets/fishing/crucian_carp.png',
  koi: 'assets/fishing/koi.png',
  goldfish: 'assets/fishing/goldfish.png',
  largemouth_bass: 'assets/fishing/largemouth_bass.png',
  catfish: 'assets/fishing/catfish.png',
  golden_koi: 'assets/fishing/golden_koi.png',
  minnow: 'assets/fishing/minnow.png',
  trout: 'assets/fishing/trout.png',
  ayu: 'assets/fishing/ayu.png',
  salmon: 'assets/fishing/salmon.png',
  snakehead: 'assets/fishing/snakehead.png',
  rainbow_trout: 'assets/fishing/rainbow_trout.png',
  masou_salmon: 'assets/fishing/masou_salmon.png',
  sardine: 'assets/fishing/sardine.png',
  mackerel: 'assets/fishing/mackerel.png',
  horse_mackerel: 'assets/fishing/horse_mackerel.png',
  red_seabream: 'assets/fishing/red_seabream.png',
  seabass: 'assets/fishing/seabass.png',
  flounder: 'assets/fishing/flounder.png',
  coelacanth: 'assets/fishing/coelacanth.png'
});
