const FISHING_ROD_DURABILITY=Object.freeze({
  basic:[null,0],sturdy:[120,240],steel:[160,400],expert:[200,300],master_angler:[240,420],
  deepwater:[300,200],tidal:[360,225],tempest:[420,252],abyssal:[480,280],aurora:[600,400]
});
const FISHING_DURABILITY_LOSS_BY_HABITAT=Object.freeze({
  pond:1,river:1,mountain_lake:1,waterfall:1,swamp:1,coast:1,
  boat_shallow:6,boat_mid:8,boat_deep:10,glacier:12
});
function getFishingDurabilityLoss(fish,rod=getEquippedFishingRod()){
  return rod.maxDurability?(FISHING_DURABILITY_LOSS_BY_HABITAT[fish?.habitat]||1):0;
}
function defineFishingRod(rod){
  const [maxDurability,repairCoins]=FISHING_ROD_DURABILITY[rod.asset];
  return Object.freeze({...rod,maxDurability,repairCoins});
}

function getFishingRodDurability(rodOrId=getEquippedFishingRod(),state=GAME_STATE){
  const rod=typeof rodOrId==='string'?FISHING_ROD_BY_ID.get(rodOrId):rodOrId;
  if(!rod)return null;
  if(!rod.maxDurability)return {current:null,max:null,missing:0,broken:false,infinite:true};
  const saved=state.progression.fishing.durabilityByRodId?.[rod.id];
  const current=typeof saved==='number'&&Number.isFinite(saved)?Math.max(0,Math.min(rod.maxDurability,Math.floor(saved))):rod.maxDurability;
  return {current,max:rod.maxDurability,missing:rod.maxDurability-current,broken:current===0,infinite:false};
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
    description:'도감 완성 후에도 낚시를 이어간 강태공을 위한 심해 탐색 장비.'
  }),
  defineFishingRod({
    id:'rod.tidal',name:'조류 낚싯대',englishName:'Tide Rod',icon:'🌊',asset:'tidal',unlockLevel:35,requiresRodId:'rod.deepwater',
    coins:80000,fishCost:Object.freeze({'fish.damselfish':40,'fish.filefish':30,'fish.barred_knifejaw':12}),
    waitReduction:.35,rareWeightBonus:.50,sizeBonus:.22,
    description:'조류를 따라 빠르게 입질을 받아내는 원양 낚싯대.'
  }),
  defineFishingRod({
    id:'rod.tempest',name:'폭풍 낚싯대',englishName:'Tempest Rod',icon:'⛈️',asset:'tempest',unlockLevel:45,requiresRodId:'rod.tidal',
    coins:150000,fishCost:Object.freeze({'fish.spanish_mackerel':55,'fish.yellowtail':35,'fish.marlin':15}),
    waitReduction:.40,rareWeightBonus:.60,sizeBonus:.25,
    description:'짧은 대기와 높아진 희귀어 반응으로 거친 바다를 공략하는 장비.'
  }),
  defineFishingRod({
    id:'rod.abyssal',name:'심연 낚싯대',englishName:'Abyss Rod',icon:'🔮',asset:'abyssal',unlockLevel:55,requiresRodId:'rod.tempest',
    coins:250000,fishCost:Object.freeze({'fish.blobfish':45,'fish.ghost_shark':35,'fish.anglerfish':25,'fish.vampire_squid':25}),
    waitReduction:.45,rareWeightBonus:.65,sizeBonus:.28,
    description:'심해의 긴 탐색을 빠른 입질과 큰 개체로 보답하는 낚싯대.'
  }),
  defineFishingRod({
    id:'rod.aurora',name:'극광 낚싯대',englishName:'Aurora Rod',icon:'❄️',asset:'aurora',unlockLevel:65,requiresRodId:'rod.abyssal',
    coins:380000,fishCost:Object.freeze({'fish.toothfish':60,'fish.polar_cod':35,'fish.greenland_shark':25,'fish.glacier_trout':40}),
    waitReduction:.50,rareWeightBonus:.70,sizeBonus:.30,
    description:'빙하를 넘어 오래 낚아 온 탐험가를 위한 최상위 낚싯대.'
  })
]);

const FISHING_ROD_BY_ID=new Map(FISHING_RODS.map(rod=>[rod.id,rod]));
const DEFAULT_FISHING_ROD_ID='rod.basic';
