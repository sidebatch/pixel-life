const LIFE_CONTENT=Object.freeze({
  treeHp:3,
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
    {id:'potato',name:'감자',icon:'🥔',growMs:5*60*1000,harvestMin:2,harvestMax:4,seedPrice:20,sellPrice:12},
    {id:'corn',name:'옥수수',icon:'🌽',growMs:15*60*1000,harvestMin:3,harvestMax:5,seedPrice:45,sellPrice:20},
    {id:'strawberry',name:'딸기',icon:'🍓',growMs:30*60*1000,harvestMin:3,harvestMax:5,seedPrice:80,sellPrice:35}
  ])
});
const LIFE_CROP_BY_ID=new Map(LIFE_CONTENT.crops.map(crop=>[crop.id,crop]));
const isInitialFarmPlot=index=>index%4<2&&Math.floor(index/4)<2;
