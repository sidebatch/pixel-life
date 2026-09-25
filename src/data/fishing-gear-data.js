function defineFishingRod(rod){
  return Object.freeze({...rod});
}

const FISHING_RODS=Object.freeze([
  defineFishingRod({
    id:'rod.basic',name:'기본 낚싯대',icon:'🎣',unlockLevel:1,
    waitReduction:0,rareWeightBonus:0,sizeBonus:0,
    description:'처음부터 사용하는 균형 잡힌 낚싯대.'
  }),
  defineFishingRod({
    id:'rod.sturdy',name:'튼튼한 낚싯대',icon:'🪵',unlockLevel:5,
    coins:450,fishCost:Object.freeze({'fish.crucian_carp':8,'fish.koi':6}),
    waitReduction:.10,rareWeightBonus:0,sizeBonus:0,
    description:'튼튼한 줄과 손잡이로 입질을 조금 더 빠르게 받는다.'
  }),
  defineFishingRod({
    id:'rod.steel',name:'강철 낚싯대',icon:'⚙️',unlockLevel:10,
    coins:1300,fishCost:Object.freeze({'fish.goldfish':5,'fish.largemouth_bass':4}),
    waitReduction:.10,rareWeightBonus:.10,sizeBonus:0,
    description:'단단한 강철 프레임이 희귀한 물고기의 반응을 끌어낸다.'
  }),
  defineFishingRod({
    id:'rod.expert',name:'전문가 낚싯대',icon:'✨',unlockLevel:15,
    coins:3500,fishCost:Object.freeze({'fish.catfish':3,'fish.trout':8,'fish.salmon':5}),
    waitReduction:.15,rareWeightBonus:.20,sizeBonus:.08,
    description:'빠른 입질과 희귀 어종, 큰 개체를 함께 노리는 전문가 장비.'
  }),
  defineFishingRod({
    id:'rod.master_angler',name:'강태공의 낚싯대',icon:'🏆',unlockLevel:null,requiresMasterReward:true,
    waitReduction:.25,rareWeightBonus:.35,sizeBonus:.15,
    description:'도감 20종을 완성한 강태공만 사용할 수 있는 특별한 낚싯대.'
  })
]);

const FISHING_ROD_BY_ID=new Map(FISHING_RODS.map(rod=>[rod.id,rod]));
const DEFAULT_FISHING_ROD_ID='rod.basic';
