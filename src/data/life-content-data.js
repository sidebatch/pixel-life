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
