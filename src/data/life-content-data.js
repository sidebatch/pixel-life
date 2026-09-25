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
  oak:Object.freeze({tier:1,maxHp:100,xp:10,logPrice:12}),
  pine:Object.freeze({tier:1,maxHp:100,xp:12,logPrice:14}),
  birch:Object.freeze({tier:1,maxHp:100,xp:14,logPrice:16}),
  maple:Object.freeze({tier:2,maxHp:120,xp:25,logPrice:24}),
  spruce:Object.freeze({tier:2,maxHp:120,xp:28,logPrice:27}),
  willow:Object.freeze({tier:2,maxHp:120,xp:32,logPrice:30}),
  cypress:Object.freeze({tier:3,maxHp:160,xp:55,logPrice:42}),
  broadleaf:Object.freeze({tier:3,maxHp:160,xp:65,logPrice:48})
});
const FORESTRY_AXES=Object.freeze([
  Object.freeze({id:'axe.basic',name:'기본 도끼',tier:1,damage:20,asset:'basic',coins:0,materials:Object.freeze({})}),
  Object.freeze({id:'axe.iron',name:'철 도끼',tier:2,damage:40,asset:'iron',coins:3600,materials:Object.freeze({oak_log:60,pine_log:48,birch_log:36})}),
  Object.freeze({id:'axe.steel',name:'강철 도끼',tier:3,damage:50,asset:'steel',coins:11200,materials:Object.freeze({maple_log:54,spruce_log:42,willow_log:36})}),
  Object.freeze({id:'axe.master',name:'명장의 도끼',tier:4,damage:80,asset:'master',coins:30000,materials:Object.freeze({cypress_log:60,broadleaf_log:50})})
]);
const FORESTRY_AXE_BY_ID=new Map(FORESTRY_AXES.map(axe=>[axe.id,axe]));
const DEFAULT_FORESTRY_AXE_ID='axe.basic';
const FORESTRY_CHOP_TIMING=Object.freeze({impactMs:270,durationMs:700});
