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
  Object.freeze({count:5,kind:'coins',amount:300,label:'코인 300'}),
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
  defineFish({id:'fish.crucian_carp',name:'붕어',emoji:'🐟',asset:'crucian_carp',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:12,maxSizeCm:35,basePrice:25,xp:8,weight:35,description:'마을 연못의 단골. 미끼만 던지면 올라오는 친근한 민물고기다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.koi',name:'잉어',emoji:'🐟',asset:'koi',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:25,maxSizeCm:80,basePrice:35,xp:8,weight:32,description:'연못의 터줏대감. 크고 느긋하게 움직인다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.goldfish',name:'금붕어',emoji:'🐠',asset:'goldfish',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY'],weather:['clear'],minSizeCm:8,maxSizeCm:25,basePrice:60,xp:12,weight:18,description:'낮의 햇살을 받아 반짝이는 작은 관상어다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.largemouth_bass',name:'큰입배스',emoji:'🐟',asset:'largemouth_bass',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY','DUSK'],weather:null,minSizeCm:20,maxSizeCm:65,basePrice:75,xp:12,weight:16,description:'연못의 포식자. 입질이 강렬하다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.catfish',name:'메기',emoji:'🐟',asset:'catfish',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:['rain','storm'],minSizeCm:25,maxSizeCm:100,basePrice:160,xp:20,weight:7,description:'비 오는 밤에만 모습을 드러내는 연못의 그림자다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.golden_koi',name:'황금잉어',emoji:'🐠',asset:'golden_koi',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.HEROIC,periods:['DAWN'],weather:['clear'],minSizeCm:30,maxSizeCm:90,basePrice:420,xp:40,weight:2,description:'새벽 연못에 떠오르는 황금빛 행운이다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.bluegill',name:'블루길',emoji:'🐟',asset:'bluegill',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:8,maxSizeCm:28,basePrice:22,xp:8,weight:28,description:'파란 볼이 매력적인 연못의 단골이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.killifish',name:'송사리',emoji:'🐟',asset:'killifish',habitat:FISH_HABITATS.POND,rarity:FISH_RARITIES.COMMON,periods:['DAY'],weather:null,minSizeCm:2,maxSizeCm:6,basePrice:18,xp:8,weight:22,description:'수면 위를 총총 뛰어다니는 작은 물고기다.',introducedVersion:'expansion'}),

  // Forest river
  defineFish({id:'fish.minnow',name:'피라미',emoji:'🐟',asset:'minnow',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:6,maxSizeCm:18,basePrice:20,xp:8,weight:35,description:'숲 강에서 가장 흔한 작은 물고기다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.trout',name:'송어',emoji:'🐟',asset:'trout',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.COMMON,periods:['DAY'],weather:null,minSizeCm:18,maxSizeCm:55,basePrice:40,xp:8,weight:30,description:'맑은 강물을 좋아하는 대표적인 계류어다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.ayu',name:'은어',emoji:'🐟',asset:'ayu',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY'],weather:['clear'],minSizeCm:12,maxSizeCm:30,basePrice:65,xp:12,weight:18,description:'맑은 날 강에서 반짝이는 은빛 물고기다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.salmon',name:'연어',emoji:'🐟',asset:'salmon',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.UNCOMMON,periods:['DAWN','DUSK'],weather:null,minSizeCm:45,maxSizeCm:110,basePrice:90,xp:12,weight:16,description:'강을 거슬러 오르는 회귀의 물고기다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.snakehead',name:'가물치',emoji:'🐟',asset:'snakehead',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:null,minSizeCm:30,maxSizeCm:100,basePrice:145,xp:20,weight:8,description:'밤의 강을 지배하는 사나운 포식자다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.rainbow_trout',name:'무지개송어',emoji:'🐠',asset:'rainbow_trout',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.RARE,periods:['DAY','DUSK'],weather:['rain'],minSizeCm:20,maxSizeCm:70,basePrice:180,xp:20,weight:6,description:'비 오는 날 무지개처럼 빛나는 송어다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.masou_salmon',name:'산천어',emoji:'🐟',asset:'masou_salmon',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.HEROIC,periods:['DAWN'],weather:['clear'],minSizeCm:15,maxSizeCm:45,basePrice:360,xp:40,weight:2,description:'새벽 강물에 떠오르는 붉은 점의 귀빈이다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.mandarin_fish',name:'쏘가리',emoji:'🐟',asset:'mandarin_fish',habitat:FISH_HABITATS.RIVER,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:15,maxSizeCm:50,basePrice:38,xp:8,weight:25,description:'맑은 강바닥에 숨어사는 자존심 강한 물고기다.',introducedVersion:'expansion'}),

  // Coast
  defineFish({id:'fish.sardine',name:'정어리',emoji:'🐟',asset:'sardine',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:10,maxSizeCm:25,basePrice:25,xp:8,weight:35,description:'해안의 대표 소형어. 떼로 몰려다닌다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.mackerel',name:'고등어',emoji:'🐟',asset:'mackerel',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.COMMON,periods:['DAY','DUSK'],weather:null,minSizeCm:20,maxSizeCm:50,basePrice:40,xp:8,weight:30,description:'등푸른 생선의 대표주자다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.horse_mackerel',name:'전갱이',emoji:'🐟',asset:'horse_mackerel',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:15,maxSizeCm:45,basePrice:65,xp:12,weight:18,description:'해안가에서 흔히 만나는 단단한 생선이다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.red_seabream',name:'도미',emoji:'🐟',asset:'red_seabream',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:['DAWN','DAY'],weather:['clear'],minSizeCm:20,maxSizeCm:70,basePrice:95,xp:12,weight:14,description:'맑은 날 해안에 붉게 빛나는 고급어다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.seabass',name:'농어',emoji:'🐟',asset:'seabass',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:['rain','storm'],minSizeCm:30,maxSizeCm:100,basePrice:170,xp:20,weight:7,description:'비바람 치는 밤바다의 사냥꾼이다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.flounder',name:'광어',emoji:'🐟',asset:'flounder',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.RARE,periods:['DAY'],weather:['clear'],minSizeCm:25,maxSizeCm:90,basePrice:190,xp:20,weight:6,description:'맑은 날 모래바닥에 납작 엎드린 위장술사다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.coelacanth',name:'실러캔스',emoji:'🐟',asset:'coelacanth',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.LEGENDARY,periods:['NIGHT'],weather:['storm'],minSizeCm:100,maxSizeCm:180,basePrice:1500,xp:120,weight:.6,description:'폭풍우 치는 밤 심해에서 눈을 뜨는 살아있는 화석이다.',introducedVersion:'baseline-v1'})
]);
