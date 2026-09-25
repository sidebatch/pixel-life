function defineFishingRod(rod){
  return Object.freeze({...rod});
}

const FISHING_RODS=Object.freeze([
  defineFishingRod({
    id:'rod.basic',name:'기본 낚싯대',icon:'🎣',asset:'basic',unlockLevel:1,
    waitReduction:0,rareWeightBonus:0,sizeBonus:0,
    description:'처음부터 사용하는 균형 잡힌 낚싯대.'
  }),
  defineFishingRod({
    id:'rod.sturdy',name:'튼튼한 낚싯대',icon:'🪵',asset:'sturdy',unlockLevel:5,
    coins:1800,fishCost:Object.freeze({'fish.crucian_carp':25,'fish.koi':20}),
    waitReduction:.10,rareWeightBonus:0,sizeBonus:0,
    description:'튼튼한 줄과 손잡이로 입질을 조금 더 빠르게 받는다.'
  }),
  defineFishingRod({
    id:'rod.steel',name:'강철 낚싯대',icon:'⚙️',asset:'steel',unlockLevel:10,
    coins:5200,fishCost:Object.freeze({'fish.goldfish':15,'fish.largemouth_bass':12}),
    waitReduction:.10,rareWeightBonus:.10,sizeBonus:0,
    description:'단단한 강철 프레임이 희귀한 물고기의 반응을 끌어낸다.'
  }),
  defineFishingRod({
    id:'rod.expert',name:'전문가 낚싯대',icon:'✨',asset:'expert',unlockLevel:15,
    coins:14000,fishCost:Object.freeze({'fish.catfish':10,'fish.trout':24,'fish.salmon':15}),
    waitReduction:.15,rareWeightBonus:.20,sizeBonus:.08,
    description:'빠른 입질과 희귀 어종, 큰 개체를 함께 노리는 전문가 장비.'
  }),
  defineFishingRod({
    id:'rod.master_angler',name:'강태공의 낚싯대',icon:'🏆',asset:'master_angler',unlockLevel:null,requiresMasterReward:true,
    waitReduction:.25,rareWeightBonus:.35,sizeBonus:.15,
    description:'도감 20종을 완성한 강태공만 사용할 수 있는 특별한 낚싯대.'
  }),
  defineFishingRod({
    id:'rod.deepwater',name:'심해 낚싯대',icon:'🌊',asset:'deepwater',unlockLevel:25,requiresMasterRod:true,
    coins:45000,fishCost:Object.freeze({'fish.golden_koi':5,'fish.rainbow_trout':12,'fish.flounder':12}),
    waitReduction:.30,rareWeightBonus:.45,sizeBonus:.20,
    description:'도감 완성 후에도 낚시를 이어간 강태공을 위한 최상위 장비.'
  })
]);

const FISHING_ROD_BY_ID=new Map(FISHING_RODS.map(rod=>[rod.id,rod]));
const DEFAULT_FISHING_ROD_ID='rod.basic';
