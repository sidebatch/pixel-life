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
  broadleaf:'assets/forestry/trees/broadleaf.png',
  paulownia:'assets/forestry/trees/paulownia.png',
  cedar:'assets/forestry/trees/cedar.png',
  ginkgo:'assets/forestry/trees/ginkgo.png',
  larch:'assets/forestry/trees/larch.png',
  cherry:'assets/forestry/trees/cherry.png',
  chestnut:'assets/forestry/trees/chestnut.png',
  walnut:'assets/forestry/trees/walnut.png',
  zelkova:'assets/forestry/trees/zelkova.png',
  ash:'assets/forestry/trees/ash.png',teak:'assets/forestry/trees/teak.png',
  mahogany:'assets/forestry/trees/mahogany.png',mango:'assets/forestry/trees/mango.png',
  baobab:'assets/forestry/trees/baobab.png',sequoia:'assets/forestry/trees/sequoia.png',
  black_locust:'assets/forestry/trees/black_locust.png',hickory:'assets/forestry/trees/hickory.png',
  eucalyptus:'assets/forestry/trees/eucalyptus.png',olive:'assets/forestry/trees/olive.png',
  purpleheart:'assets/forestry/trees/purpleheart.png',jatoba:'assets/forestry/trees/jatoba.png',
  spotted_gum:'assets/forestry/trees/spotted_gum.png',ironbark:'assets/forestry/trees/ironbark.png',
  cumaru:'assets/forestry/trees/cumaru.png',ipe:'assets/forestry/trees/ipe.png',
  quebracho:'assets/forestry/trees/quebracho.png',african_blackwood:'assets/forestry/trees/african_blackwood.png',
  lignum_vitae:'assets/forestry/trees/lignum_vitae.png',ancient_zelkova:'assets/forestry/trees/ancient_zelkova.png',
  amber_cedar:'assets/forestry/trees/amber_cedar.png',silverbark:'assets/forestry/trees/silverbark.png',
  spiralwood:'assets/forestry/trees/spiralwood.png',moonshade:'assets/forestry/trees/moonshade.png',
  spirit_ancient:'assets/forestry/trees/spirit_ancient.png',starlight_tree:'assets/forestry/trees/starlight_tree.png',
  moonveil:'assets/forestry/trees/moonveil.png',crystal_leaf:'assets/forestry/trees/crystal_leaf.png',
  whisperwood:'assets/forestry/trees/whisperwood.png',origin_tree:'assets/forestry/trees/origin_tree.png',
  primal_ancient:'assets/forestry/trees/primal_ancient.png',worldroot:'assets/forestry/trees/worldroot.png',
  dawncore:'assets/forestry/trees/dawncore.png',abysswood:'assets/forestry/trees/abysswood.png'
});
const FOREST_STUMP_URLS = Object.freeze({
  oak:'assets/forestry/stumps/oak.png',
  pine:'assets/forestry/stumps/pine.png',
  birch:'assets/forestry/stumps/birch.png',
  maple:'assets/forestry/stumps/maple.png',
  spruce:'assets/forestry/stumps/spruce.png',
  willow:'assets/forestry/stumps/willow.png',
  cypress:'assets/forestry/stumps/cypress.png',
  broadleaf:'assets/forestry/stumps/broadleaf.png',
  paulownia:'assets/forestry/stumps/paulownia.png',
  cedar:'assets/forestry/stumps/cedar.png',
  ginkgo:'assets/forestry/stumps/ginkgo.png',
  larch:'assets/forestry/stumps/larch.png',
  cherry:'assets/forestry/stumps/cherry.png',
  chestnut:'assets/forestry/stumps/chestnut.png',
  walnut:'assets/forestry/stumps/walnut.png',
  zelkova:'assets/forestry/stumps/zelkova.png',
  ash:'assets/forestry/stumps/ash.png',teak:'assets/forestry/stumps/teak.png',
  mahogany:'assets/forestry/stumps/mahogany.png',mango:'assets/forestry/stumps/mango.png',
  baobab:'assets/forestry/stumps/baobab.png',sequoia:'assets/forestry/stumps/sequoia.png',
  black_locust:'assets/forestry/stumps/black_locust.png',hickory:'assets/forestry/stumps/hickory.png',
  eucalyptus:'assets/forestry/stumps/eucalyptus.png',olive:'assets/forestry/stumps/olive.png',
  purpleheart:'assets/forestry/stumps/purpleheart.png',jatoba:'assets/forestry/stumps/jatoba.png',
  spotted_gum:'assets/forestry/stumps/spotted_gum.png',ironbark:'assets/forestry/stumps/ironbark.png',
  cumaru:'assets/forestry/stumps/cumaru.png',ipe:'assets/forestry/stumps/ipe.png',
  quebracho:'assets/forestry/stumps/quebracho.png',african_blackwood:'assets/forestry/stumps/african_blackwood.png',
  lignum_vitae:'assets/forestry/stumps/lignum_vitae.png',ancient_zelkova:'assets/forestry/stumps/ancient_zelkova.png',
  amber_cedar:'assets/forestry/stumps/amber_cedar.png',silverbark:'assets/forestry/stumps/silverbark.png',
  spiralwood:'assets/forestry/stumps/spiralwood.png',moonshade:'assets/forestry/stumps/moonshade.png',
  spirit_ancient:'assets/forestry/stumps/spirit_ancient.png',starlight_tree:'assets/forestry/stumps/starlight_tree.png',
  moonveil:'assets/forestry/stumps/moonveil.png',crystal_leaf:'assets/forestry/stumps/crystal_leaf.png',
  whisperwood:'assets/forestry/stumps/whisperwood.png',origin_tree:'assets/forestry/stumps/origin_tree.png',
  primal_ancient:'assets/forestry/stumps/primal_ancient.png',worldroot:'assets/forestry/stumps/worldroot.png',
  dawncore:'assets/forestry/stumps/dawncore.png',abysswood:'assets/forestry/stumps/abysswood.png'
});
const FORESTRY_AXE_URLS = Object.freeze({
  basic:'assets/forestry/axes/basic.png',
  iron:'assets/forestry/axes/iron.png',
  steel:'assets/forestry/axes/steel.png',
  master:'assets/forestry/axes/master.png',
  black_iron:'assets/forestry/axes/black-iron.png',
  rune:'assets/forestry/axes/rune.png',
  spirit:'assets/forestry/axes/spirit.png',
  moonlight:'assets/forestry/axes/moonlight.png',
  starlight:'assets/forestry/axes/starlight.png',
  primordial:'assets/forestry/axes/primordial.png'
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
  ember:{walk:'assets/player/npc-v1/walk-ember.png',chop:'assets/player/npc-v1/chop-ember.png',fish:'assets/player/npc-v1/fish-ember.png',icon:'assets/player/temporary-appearance/ember-icon.png'},
  meadow:{walk:'assets/player/npc-v1/walk-meadow.png',chop:'assets/player/npc-v1/chop-meadow.png',fish:'assets/player/npc-v1/fish-meadow.png',icon:'assets/player/temporary-appearance/meadow-icon.png'},
  ranger:{icon:'assets/player/temporary-appearance/ranger-icon.png'},
  berry:{icon:'assets/player/temporary-appearance/berry-icon.png'}
});
// Corrected production clothes; the historical constant name keeps QA/imports
// compatible. Archived clothes remain available only for original comparison.
const CHARACTER_WARDROBE_PREVIEW_URLS=Object.freeze({
  'outfit.ember':{walk:'assets/player/npc-wardrobe-v2/walk-ember.png',chop:'assets/player/npc-wardrobe-v2/chop-ember.png',fish:'assets/player/npc-wardrobe-v2/fish-ember.png'},
  'outfit.meadow':{walk:'assets/player/npc-wardrobe-v2/walk-meadow.png',chop:'assets/player/npc-wardrobe-v2/chop-meadow.png',fish:'assets/player/npc-wardrobe-v2/fish-meadow.png'}
});
const CHARACTER_LAYER_URLS=Object.freeze({
  walkBody:'assets/player/character-baseline-v2/walk-body.png',
  walkHead:'assets/player/npc-v1/walk-head.png',
  walkHair:'assets/player/npc-v1/walk-hair.png',
  walkOutfit:'assets/player/npc-v1/walk-outfit.png',
  walkBackpack:'assets/player/npc-v1/walk-backpack.png',
  walkGrip:'assets/player/npc-v1/walk-grip.png',
  chopBody:'assets/player/character-baseline-v2/chop-body.png',
  chopHead:'assets/player/npc-v1/chop-head.png',
  chopHair:'assets/player/npc-v1/chop-hair.png',
  chopOutfit:'assets/player/npc-v1/chop-outfit.png',
  chopBackpack:'assets/player/npc-v1/chop-backpack.png',
  chopGrip:'assets/player/npc-v1/chop-grip.png',
  fishBody:'assets/player/character-baseline-v2/fish-body.png',
  fishHead:'assets/player/npc-v1/fish-head.png',
  fishHair:'assets/player/npc-v1/fish-hair.png',
  fishOutfit:'assets/player/npc-v1/fish-outfit.png',
  fishBackpack:'assets/player/npc-v1/fish-backpack.png',
  fishGrip:'assets/player/npc-v1/fish-grip.png',
  femaleWalkHead:'assets/player/character-baseline-v2/walk-head.png',
  femaleChopHead:'assets/player/character-baseline-v2/chop-head.png',
  femaleFishHead:'assets/player/character-baseline-v2/fish-head.png',
  femaleWalkHair:'assets/player/character-baseline-v2/walk-hair.png',
  femaleChopHair:'assets/player/character-baseline-v2/chop-hair.png',
  femaleFishHair:'assets/player/character-baseline-v2/fish-hair.png',
  rangerWalkBackpack:'assets/player/npc-v1/walk-ranger.png',
  rangerChopBackpack:'assets/player/npc-v1/chop-ranger.png',
  rangerFishBackpack:'assets/player/npc-v1/fish-ranger.png',
  berryWalkBackpack:'assets/player/npc-v1/walk-berry.png',
  berryChopBackpack:'assets/player/npc-v1/chop-berry.png',
  berryFishBackpack:'assets/player/npc-v1/fish-berry.png'
});
// Loaded only by comparison links; never by ordinary play.
const CHARACTER_BASELINE_LEGACY_URLS=Object.freeze({
  walkBody:'assets/player/npc-v1/walk-body.png',
  chopBody:'assets/player/npc-v1/chop-body.png',
  fishBody:'assets/player/npc-v1/fish-body.png',
  femaleWalkHead:'assets/player/npc-ria-v3/walk-head.png',
  femaleChopHead:'assets/player/npc-ria-v3/chop-head.png',
  femaleFishHead:'assets/player/npc-ria-v3/fish-head.png',
  femaleWalkHair:'assets/player/npc-ria-v3/walk-hair.png',
  femaleChopHair:'assets/player/npc-ria-v3/chop-hair.png',
  femaleFishHair:'assets/player/npc-ria-v3/fish-hair.png'
});
const CHARACTER_TOOL_URLS=Object.freeze({
  'axe.basic':'assets/player/rig-v1/tools/axe-basic.png',
  'axe.iron':'assets/player/rig-v1/tools/axe-iron.png',
  'axe.steel':'assets/player/rig-v1/tools/axe-steel.png',
  'axe.master':'assets/player/rig-v1/tools/axe-master.png',
  'axe.black_iron':'assets/player/rig-v1/tools/axe-black-iron.png',
  'axe.rune':'assets/player/rig-v1/tools/axe-rune.png',
  'axe.spirit':'assets/player/rig-v1/tools/axe-spirit.png',
  'axe.moonlight':'assets/player/rig-v1/tools/axe-moonlight.png',
  'axe.starlight':'assets/player/rig-v1/tools/axe-starlight.png',
  'axe.primordial':'assets/player/rig-v1/tools/axe-primordial.png',
  'rod.basic':'assets/player/rig-v1/tools/rod-basic.png',
  'rod.sturdy':'assets/player/rig-v1/tools/rod-sturdy.png',
  'rod.steel':'assets/player/rig-v1/tools/rod-steel.png',
  'rod.expert':'assets/player/rig-v1/tools/rod-expert.png',
  'rod.master_angler':'assets/player/rig-v1/tools/rod-master_angler.png',
  'rod.deepwater':'assets/player/rig-v1/tools/rod-deepwater.png'
});
const SWORD_TOOL_URLS=Object.freeze({
  'sword.basic':'assets/player/sword-v1/basic.png'
});
const LIFE_ITEM_URLS = Object.freeze({
  log:'assets/forestry/items/log.png',
  oakLog:'assets/forestry/items/oak.png',
  pineLog:'assets/forestry/items/pine-v2.png',
  birchLog:'assets/forestry/items/birch-v2.png',
  mapleLog:'assets/forestry/items/maple-v3.png',
  spruceLog:'assets/forestry/items/spruce-v2.png',
  willowLog:'assets/forestry/items/willow-v2.png',
  cypressLog:'assets/forestry/items/cypress-v2.png',
  broadleafLog:'assets/forestry/items/broadleaf-v2.png',
  paulowniaLog:'assets/forestry/items/paulownia.png',
  cedarLog:'assets/forestry/items/cedar.png',
  ginkgoLog:'assets/forestry/items/ginkgo.png',
  larchLog:'assets/forestry/items/larch.png',
  cherryLog:'assets/forestry/items/cherry.png',
  chestnutLog:'assets/forestry/items/chestnut.png',
  walnutLog:'assets/forestry/items/walnut.png',
  zelkovaLog:'assets/forestry/items/zelkova.png',
  ashLog:'assets/forestry/items/ash.png',teakLog:'assets/forestry/items/teak.png',
  mahoganyLog:'assets/forestry/items/mahogany.png',mangoLog:'assets/forestry/items/mango.png',
  baobabLog:'assets/forestry/items/baobab.png',sequoiaLog:'assets/forestry/items/sequoia.png',
  black_locustLog:'assets/forestry/items/black_locust.png',hickoryLog:'assets/forestry/items/hickory.png',
  eucalyptusLog:'assets/forestry/items/eucalyptus.png',oliveLog:'assets/forestry/items/olive.png',
  purpleheartLog:'assets/forestry/items/purpleheart.png',jatobaLog:'assets/forestry/items/jatoba.png',
  spotted_gumLog:'assets/forestry/items/spotted_gum.png',ironbarkLog:'assets/forestry/items/ironbark.png',
  cumaruLog:'assets/forestry/items/cumaru.png',ipeLog:'assets/forestry/items/ipe.png',
  quebrachoLog:'assets/forestry/items/quebracho.png',african_blackwoodLog:'assets/forestry/items/african_blackwood.png',
  lignum_vitaeLog:'assets/forestry/items/lignum_vitae.png',ancient_zelkovaLog:'assets/forestry/items/ancient_zelkova.png',
  amber_cedarLog:'assets/forestry/items/amber_cedar.png',silverbarkLog:'assets/forestry/items/silverbark.png',
  spiralwoodLog:'assets/forestry/items/spiralwood.png',moonshadeLog:'assets/forestry/items/moonshade.png',
  spirit_ancientLog:'assets/forestry/items/spirit_ancient.png',starlight_treeLog:'assets/forestry/items/starlight_tree.png',
  moonveilLog:'assets/forestry/items/moonveil.png',crystal_leafLog:'assets/forestry/items/crystal_leaf.png',
  whisperwoodLog:'assets/forestry/items/whisperwood.png',origin_treeLog:'assets/forestry/items/origin_tree.png',
  primal_ancientLog:'assets/forestry/items/primal_ancient.png',worldrootLog:'assets/forestry/items/worldroot.png',
  dawncoreLog:'assets/forestry/items/dawncore.png',abysswoodLog:'assets/forestry/items/abysswood.png',
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
  bluegill: 'assets/fishing/bluegill.png',
  killifish: 'assets/fishing/killifish.png',
  minnow: 'assets/fishing/minnow.png',
  trout: 'assets/fishing/trout.png',
  ayu: 'assets/fishing/ayu.png',
  salmon: 'assets/fishing/salmon.png',
  snakehead: 'assets/fishing/snakehead.png',
  rainbow_trout: 'assets/fishing/rainbow_trout.png',
  masou_salmon: 'assets/fishing/masou_salmon.png',
  mandarin_fish: 'assets/fishing/mandarin_fish.png',
  pond_smelt: 'assets/fishing/pond_smelt.png',
  freshwater_eel: 'assets/fishing/freshwater_eel.png',
  manchurian_trout: 'assets/fishing/manchurian_trout.png',
  lake_trout: 'assets/fishing/lake_trout.png',
  brown_trout: 'assets/fishing/brown_trout.png',
  sturgeon: 'assets/fishing/sturgeon.png',
  aurora_trout: 'assets/fishing/aurora_trout.png',
  golden_trout: 'assets/fishing/golden_trout.png',
  nile_perch: 'assets/fishing/nile_perch.png',
  sockeye_salmon: 'assets/fishing/sockeye_salmon.png',
  falls_catfish: 'assets/fishing/falls_catfish.png',
  silver_manchurian: 'assets/fishing/silver_manchurian.png',
  tigerfish: 'assets/fishing/tigerfish.png',
  crystal_trout: 'assets/fishing/crystal_trout.png',
  swamp_eel: 'assets/fishing/swamp_eel.png',
  swamp_catfish: 'assets/fishing/swamp_catfish.png',
  piranha: 'assets/fishing/piranha.png',
  black_ghost: 'assets/fishing/black_ghost.png',
  electric_eel: 'assets/fishing/electric_eel.png',
  arowana: 'assets/fishing/arowana.png',
  swamp_king_eel: 'assets/fishing/swamp_king_eel.png',
  damselfish: 'assets/fishing/damselfish.png',
  wrasse: 'assets/fishing/wrasse.png',
  filefish: 'assets/fishing/filefish.png',
  striped_damsel: 'assets/fishing/striped_damsel.png',
  barred_knifejaw: 'assets/fishing/barred_knifejaw.png',
  black_seabream: 'assets/fishing/black_seabream.png',
  cuttlefish: 'assets/fishing/cuttlefish.png',
  sardine: 'assets/fishing/sardine.png',
  mackerel: 'assets/fishing/mackerel.png',
  horse_mackerel: 'assets/fishing/horse_mackerel.png',
  red_seabream: 'assets/fishing/red_seabream.png',
  rockfish: 'assets/fishing/rockfish.png',
  seabass: 'assets/fishing/seabass.png',
  flounder: 'assets/fishing/flounder.png',
  korean_rockfish: 'assets/fishing/korean_rockfish.png',
  coelacanth: 'assets/fishing/coelacanth.png'
});
