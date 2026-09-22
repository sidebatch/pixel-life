const FISH_HABITATS=Object.freeze({
  POND:'pond',
  RIVER:'river',
  COAST:'coast'
});

const FISH_RARITIES=Object.freeze({
  COMMON:'common',
  UNCOMMON:'uncommon',
  RARE:'rare',
  HEROIC:'heroic',
  LEGENDARY:'legendary'
});

const FISH_RARITY_LABELS=Object.freeze({
  common:'일반',
  uncommon:'고급',
  rare:'희귀',
  heroic:'영웅',
  legendary:'전설'
});

const FISH_COLLECTION_REWARDS=Object.freeze([
  Object.freeze({count:5,kind:'coins',amount:300,label:'300G'}),
  Object.freeze({count:10,kind:'fishingXp',amount:240,label:'Fishing XP 240'}),
  Object.freeze({count:15,kind:'rareHints',label:'희귀어 상세 힌트'}),
  Object.freeze({count:19,kind:'finalClue',label:'마지막 물고기 단서'}),
  Object.freeze({count:20,kind:'masterReward',label:'강태공 칭호·특별 낚싯대'})
]);

function defineFish(fish){
  return Object.freeze({
    ...fish,
    periods:fish.periods?Object.freeze([...fish.periods]):null,
    weather:fish.weather?Object.freeze([...fish.weather]):null
  });
}

function getFishImageUrl(fish){
  return FISH_URLS[fish.asset]||'';
}

const FISH_DATA=Object.freeze([
  // Lilac village pond
  defineFish({id:'fish.crucian_carp',name:'붕어',emoji:'🐟',asset:'crucian_carp',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:12,maxSizeCm:35,basePrice:25,xp:8,weight:35}),
  defineFish({id:'fish.koi',name:'잉어',emoji:'🐟',asset:'koi',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:25,maxSizeCm:80,basePrice:35,xp:8,weight:32}),
  defineFish({id:'fish.goldfish',name:'금붕어',emoji:'🐠',asset:'goldfish',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY'],weather:['clear'],minSizeCm:8,maxSizeCm:25,basePrice:60,xp:12,weight:18}),
  defineFish({id:'fish.largemouth_bass',name:'큰입배스',emoji:'🐟',asset:'largemouth_bass',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY','DUSK'],weather:null,minSizeCm:20,maxSizeCm:65,basePrice:75,xp:12,weight:16}),
  defineFish({id:'fish.catfish',name:'메기',emoji:'🐟',asset:'catfish',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:['rain','storm'],minSizeCm:25,maxSizeCm:100,basePrice:160,xp:20,weight:7}),
  defineFish({id:'fish.golden_koi',name:'황금잉어',emoji:'🐠',asset:'golden_koi',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.HEROIC,periods:['DAWN'],weather:['clear'],minSizeCm:30,maxSizeCm:90,basePrice:420,xp:40,weight:2}),

  // Forest river
  defineFish({id:'fish.minnow',name:'피라미',emoji:'🐟',asset:'minnow',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:6,maxSizeCm:18,basePrice:20,xp:8,weight:35}),
  defineFish({id:'fish.trout',name:'송어',emoji:'🐟',asset:'trout',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.COMMON,periods:['DAY'],weather:null,minSizeCm:18,maxSizeCm:55,basePrice:40,xp:8,weight:30}),
  defineFish({id:'fish.ayu',name:'은어',emoji:'🐟',asset:'ayu',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY'],weather:['clear'],minSizeCm:12,maxSizeCm:30,basePrice:65,xp:12,weight:18}),
  defineFish({id:'fish.salmon',name:'연어',emoji:'🐟',asset:'salmon',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.UNCOMMON,periods:['DAWN','DUSK'],weather:null,minSizeCm:45,maxSizeCm:110,basePrice:90,xp:12,weight:16}),
  defineFish({id:'fish.snakehead',name:'가물치',emoji:'🐟',asset:'snakehead',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:null,minSizeCm:30,maxSizeCm:100,basePrice:145,xp:20,weight:8}),
  defineFish({id:'fish.rainbow_trout',name:'무지개송어',emoji:'🐠',asset:'rainbow_trout',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.RARE,periods:['DAY','DUSK'],weather:['rain'],minSizeCm:20,maxSizeCm:70,basePrice:180,xp:20,weight:6}),
  defineFish({id:'fish.masou_salmon',name:'산천어',emoji:'🐟',asset:'masou_salmon',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.HEROIC,periods:['DAWN'],weather:['clear'],minSizeCm:15,maxSizeCm:45,basePrice:360,xp:40,weight:2}),

  // Coast
  defineFish({id:'fish.sardine',name:'정어리',emoji:'🐟',asset:'sardine',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:10,maxSizeCm:25,basePrice:25,xp:8,weight:35}),
  defineFish({id:'fish.mackerel',name:'고등어',emoji:'🐟',asset:'mackerel',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.COMMON,periods:['DAY','DUSK'],weather:null,minSizeCm:20,maxSizeCm:50,basePrice:40,xp:8,weight:30}),
  defineFish({id:'fish.horse_mackerel',name:'전갱이',emoji:'🐟',asset:'horse_mackerel',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:15,maxSizeCm:45,basePrice:65,xp:12,weight:18}),
  defineFish({id:'fish.red_seabream',name:'도미',emoji:'🐟',asset:'red_seabream',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:['DAWN','DAY'],weather:['clear'],minSizeCm:20,maxSizeCm:70,basePrice:95,xp:12,weight:14}),
  defineFish({id:'fish.seabass',name:'농어',emoji:'🐟',asset:'seabass',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:['rain','storm'],minSizeCm:30,maxSizeCm:100,basePrice:170,xp:20,weight:7}),
  defineFish({id:'fish.flounder',name:'광어',emoji:'🐟',asset:'flounder',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.RARE,periods:['DAY'],weather:['clear'],minSizeCm:25,maxSizeCm:90,basePrice:190,xp:20,weight:6}),
  defineFish({id:'fish.coelacanth',name:'실러캔스',emoji:'🐟',asset:'coelacanth',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.LEGENDARY,periods:['NIGHT'],weather:['storm'],minSizeCm:100,maxSizeCm:180,basePrice:1500,xp:120,weight:.6})
]);
