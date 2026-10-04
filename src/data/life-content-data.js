const LIFE_CONTENT=Object.freeze({
  treeHp:100,
  treeDamage:20,
  treeRespawnMs:5*60*1000,
  initialFarmPlots:4,
  logSellPrice:12,
  farmExpansionCosts:Object.freeze([
    {coins:100,logs:0},{coins:150,logs:0},{coins:250,logs:0},
    {coins:400,logs:0},{coins:600,logs:0},{coins:850,logs:5},
    {coins:1100,logs:8},{coins:1450,logs:10},{coins:1800,logs:12},
    {coins:2200,logs:15},{coins:2700,logs:18},{coins:3300,logs:22}
  ]),
  crops:Object.freeze([
    {id:'carrot',name:'당근',icon:'🥕',growMs:2*60*1000,harvestMin:2,harvestMax:3,seedPrice:12,sellPrice:8},
    {id:'turnip',name:'순무',icon:'🌱',growMs:3*60*1000,harvestMin:2,harvestMax:3,seedPrice:16,sellPrice:10},
    {id:'potato',name:'감자',icon:'🥔',growMs:5*60*1000,harvestMin:2,harvestMax:4,seedPrice:20,sellPrice:12},
    {id:'onion',name:'양파',icon:'🧅',growMs:8*60*1000,harvestMin:2,harvestMax:4,seedPrice:28,sellPrice:16},
    {id:'cabbage',name:'양배추',icon:'🥬',growMs:10*60*1000,harvestMin:2,harvestMax:3,seedPrice:35,sellPrice:22},
    {id:'wheat',name:'밀',icon:'🌾',growMs:12*60*1000,harvestMin:3,harvestMax:5,seedPrice:32,sellPrice:15},
    {id:'corn',name:'옥수수',icon:'🌽',growMs:15*60*1000,harvestMin:3,harvestMax:5,seedPrice:45,sellPrice:20},
    {id:'tomato',name:'토마토',icon:'🍅',growMs:20*60*1000,harvestMin:3,harvestMax:5,seedPrice:60,sellPrice:26},
    {id:'strawberry',name:'딸기',icon:'🍓',growMs:30*60*1000,harvestMin:3,harvestMax:5,seedPrice:80,sellPrice:35},
    {id:'pumpkin',name:'호박',icon:'🎃',growMs:35*60*1000,harvestMin:1,harvestMax:2,seedPrice:100,sellPrice:120}
  ])
});
const LIFE_CROP_BY_ID=new Map(LIFE_CONTENT.crops.map(crop=>[crop.id,crop]));
const isInitialFarmPlot=index=>index%4<2&&Math.floor(index/4)<2;

// Provisional forestry balance. Upgrade recipes only use wood from trees
// reachable with the player's current axe, so progression cannot deadlock.
const FORESTRY_TREES=Object.freeze({
  paulownia:Object.freeze({tier:1,maxHp:100,xp:10,logPrice:12}),
  oak:Object.freeze({tier:1,maxHp:100,xp:10,logPrice:12}),
  pine:Object.freeze({tier:1,maxHp:100,xp:12,logPrice:14}),
  birch:Object.freeze({tier:1,maxHp:100,xp:14,logPrice:16}),
  cedar:Object.freeze({tier:1,maxHp:100,xp:16,logPrice:18}),
  maple:Object.freeze({tier:2,maxHp:120,xp:25,logPrice:24}),
  spruce:Object.freeze({tier:2,maxHp:120,xp:28,logPrice:27}),
  willow:Object.freeze({tier:2,maxHp:120,xp:32,logPrice:30}),
  ginkgo:Object.freeze({tier:2,maxHp:120,xp:25,logPrice:25}),
  larch:Object.freeze({tier:2,maxHp:120,xp:29,logPrice:28}),
  cherry:Object.freeze({tier:2,maxHp:120,xp:27,logPrice:26}),
  cypress:Object.freeze({tier:3,maxHp:160,xp:55,logPrice:42}),
  broadleaf:Object.freeze({tier:3,maxHp:160,xp:65,logPrice:48}),
  chestnut:Object.freeze({tier:3,maxHp:160,xp:58,logPrice:43}),
  walnut:Object.freeze({tier:3,maxHp:160,xp:62,logPrice:46}),
  zelkova:Object.freeze({tier:3,maxHp:160,xp:68,logPrice:50}),
  // Tier 4-10 values are functional placeholders. Final HP, XP and prices
  // are intentionally deferred until every tree is spawned and testable.
  ash:Object.freeze({tier:4,maxHp:260,xp:90,logPrice:75,provisionalBalance:true}),
  teak:Object.freeze({tier:4,maxHp:260,xp:90,logPrice:75,provisionalBalance:true}),
  mahogany:Object.freeze({tier:4,maxHp:260,xp:90,logPrice:75,provisionalBalance:true}),
  mango:Object.freeze({tier:4,maxHp:260,xp:90,logPrice:75,provisionalBalance:true}),
  baobab:Object.freeze({tier:5,maxHp:400,xp:120,logPrice:105,provisionalBalance:true}),
  sequoia:Object.freeze({tier:5,maxHp:400,xp:120,logPrice:105,provisionalBalance:true}),
  black_locust:Object.freeze({tier:5,maxHp:400,xp:120,logPrice:105,provisionalBalance:true}),
  hickory:Object.freeze({tier:5,maxHp:400,xp:120,logPrice:105,provisionalBalance:true}),
  eucalyptus:Object.freeze({tier:5,maxHp:400,xp:120,logPrice:105,provisionalBalance:true}),
  olive:Object.freeze({tier:6,maxHp:620,xp:155,logPrice:145,provisionalBalance:true}),
  purpleheart:Object.freeze({tier:6,maxHp:620,xp:155,logPrice:145,provisionalBalance:true}),
  jatoba:Object.freeze({tier:6,maxHp:620,xp:155,logPrice:145,provisionalBalance:true}),
  spotted_gum:Object.freeze({tier:6,maxHp:620,xp:155,logPrice:145,provisionalBalance:true}),
  ironbark:Object.freeze({tier:6,maxHp:620,xp:155,logPrice:145,provisionalBalance:true}),
  cumaru:Object.freeze({tier:7,maxHp:950,xp:190,logPrice:190,provisionalBalance:true}),
  ipe:Object.freeze({tier:7,maxHp:950,xp:190,logPrice:190,provisionalBalance:true}),
  quebracho:Object.freeze({tier:7,maxHp:950,xp:190,logPrice:190,provisionalBalance:true}),
  african_blackwood:Object.freeze({tier:7,maxHp:950,xp:190,logPrice:190,provisionalBalance:true}),
  lignum_vitae:Object.freeze({tier:7,maxHp:950,xp:190,logPrice:190,provisionalBalance:true}),
  ancient_zelkova:Object.freeze({tier:8,maxHp:1450,xp:225,logPrice:240,provisionalBalance:true}),
  amber_cedar:Object.freeze({tier:8,maxHp:1450,xp:225,logPrice:240,provisionalBalance:true}),
  silverbark:Object.freeze({tier:8,maxHp:1450,xp:225,logPrice:240,provisionalBalance:true}),
  spiralwood:Object.freeze({tier:8,maxHp:1450,xp:225,logPrice:240,provisionalBalance:true}),
  moonshade:Object.freeze({tier:8,maxHp:1450,xp:225,logPrice:240,provisionalBalance:true}),
  spirit_ancient:Object.freeze({tier:9,maxHp:2100,xp:260,logPrice:300,provisionalBalance:true}),
  starlight_tree:Object.freeze({tier:9,maxHp:2100,xp:260,logPrice:300,provisionalBalance:true}),
  moonveil:Object.freeze({tier:9,maxHp:2100,xp:260,logPrice:300,provisionalBalance:true}),
  crystal_leaf:Object.freeze({tier:9,maxHp:2100,xp:260,logPrice:300,provisionalBalance:true}),
  whisperwood:Object.freeze({tier:9,maxHp:2100,xp:260,logPrice:300,provisionalBalance:true}),
  origin_tree:Object.freeze({tier:10,maxHp:3000,xp:300,logPrice:350,provisionalBalance:true}),
  primal_ancient:Object.freeze({tier:10,maxHp:3000,xp:300,logPrice:350,provisionalBalance:true}),
  worldroot:Object.freeze({tier:10,maxHp:3000,xp:300,logPrice:350,provisionalBalance:true}),
  dawncore:Object.freeze({tier:10,maxHp:3000,xp:300,logPrice:350,provisionalBalance:true}),
  abysswood:Object.freeze({tier:10,maxHp:3000,xp:300,logPrice:350,provisionalBalance:true})
});
const FORESTRY_AXES=Object.freeze([
  Object.freeze({id:'axe.basic',name:'기본 도끼',tier:1,damage:20,asset:'basic',coins:0,materials:Object.freeze({})}),
  Object.freeze({id:'axe.iron',name:'철 도끼',tier:2,damage:50,asset:'iron',coins:3600,materials:Object.freeze({oak_log:60,pine_log:48,birch_log:36})}),
  Object.freeze({id:'axe.steel',name:'강철 도끼',tier:3,damage:70,asset:'steel',coins:11200,materials:Object.freeze({maple_log:54,spruce_log:42,willow_log:36})}),
  // Keep axe.master for save compatibility; only its player-facing name changes.
  Object.freeze({id:'axe.master',name:'청금 도끼',tier:4,damage:90,asset:'master',coins:30000,materials:Object.freeze({cypress_log:60,broadleaf_log:50})}),
  // Tier 5-10 recipes stay coin-only until their matching trees are reachable on maps.
  Object.freeze({id:'axe.black_iron',name:'흑철 도끼',tier:5,damage:125,asset:'black_iron',coins:65000,materials:Object.freeze({}),provisionalRecipe:true}),
  Object.freeze({id:'axe.rune',name:'룬 도끼',tier:6,damage:175,asset:'rune',coins:115000,materials:Object.freeze({}),provisionalRecipe:true}),
  Object.freeze({id:'axe.spirit',name:'정령 도끼',tier:7,damage:240,asset:'spirit',coins:180000,materials:Object.freeze({}),provisionalRecipe:true}),
  Object.freeze({id:'axe.moonlight',name:'달빛 도끼',tier:8,damage:330,asset:'moonlight',coins:270000,materials:Object.freeze({}),provisionalRecipe:true}),
  Object.freeze({id:'axe.starlight',name:'별빛 도끼',tier:9,damage:450,asset:'starlight',coins:390000,materials:Object.freeze({}),provisionalRecipe:true}),
  Object.freeze({id:'axe.primordial',name:'태초의 도끼',tier:10,damage:620,asset:'primordial',coins:550000,materials:Object.freeze({}),provisionalRecipe:true})
]);
const FORESTRY_AXE_BY_ID=new Map(FORESTRY_AXES.map(axe=>[axe.id,axe]));
const DEFAULT_FORESTRY_AXE_ID='axe.basic';
const FORESTRY_CHOP_TIMING=Object.freeze({impactMs:270,durationMs:700});
