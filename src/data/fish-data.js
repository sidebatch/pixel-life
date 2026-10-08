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

  // Mountain lake
  defineFish({id:'fish.pond_smelt',name:'빙어',emoji:'🐟',asset:'pond_smelt',habitat:FISH_HABITATS.MOUNTAIN_LAKE,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:5,maxSizeCm:18,basePrice:24,xp:8,weight:35,description:'차가운 산악 호수에 떼 지어 다니는 작은 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.freshwater_eel',name:'민물장어',emoji:'🐟',asset:'freshwater_eel',habitat:FISH_HABITATS.MOUNTAIN_LAKE,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:30,maxSizeCm:100,basePrice:45,xp:8,weight:28,description:'산악 호수까지 거슬러 올라온 생명력의 상징이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.manchurian_trout',name:'열목어',emoji:'🐟',asset:'manchurian_trout',habitat:FISH_HABITATS.MOUNTAIN_LAKE,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY','DUSK'],weather:['clear'],minSizeCm:20,maxSizeCm:65,basePrice:85,xp:12,weight:18,description:'맑은 고산 호수의 귀빈. 붉은 반점이 아름답다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.lake_trout',name:'호수송어',emoji:'🐟',asset:'lake_trout',habitat:FISH_HABITATS.MOUNTAIN_LAKE,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:35,maxSizeCm:110,basePrice:95,xp:12,weight:16,description:'깊은 산악 호수에 사는 대형 송어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.brown_trout',name:'갈색송어',emoji:'🐟',asset:'brown_trout',habitat:FISH_HABITATS.MOUNTAIN_LAKE,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:25,maxSizeCm:90,basePrice:175,xp:20,weight:7,description:'갈색 바탕에 붉은 반점이 멋진 산악 호수의 터줏대감이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.sturgeon',name:'철갑상어',emoji:'🐟',asset:'sturgeon',habitat:FISH_HABITATS.MOUNTAIN_LAKE,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:70,maxSizeCm:220,basePrice:220,xp:20,weight:5,description:'단단한 비늘을 두른 산악 호수 깊은 곳의 거대한 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.aurora_trout',name:'오로라송어',emoji:'🐟',asset:'aurora_trout',habitat:FISH_HABITATS.MOUNTAIN_LAKE,rarity:FISH_RARITIES.LEGENDARY,periods:['DAWN'],weather:['clear'],minSizeCm:30,maxSizeCm:95,basePrice:1400,xp:120,weight:.6,description:'오로라빛 새벽에만 모습을 드러내는 환상의 송어다.',introducedVersion:'expansion'}),

  // Waterfall pool
  defineFish({id:'fish.golden_trout',name:'황금송어',emoji:'🐟',asset:'golden_trout',habitat:FISH_HABITATS.WATERFALL,rarity:FISH_RARITIES.HEROIC,periods:['DAY'],weather:['clear'],minSizeCm:15,maxSizeCm:55,basePrice:430,xp:40,weight:2,description:'폭포수에 황금빛으로 빛나는 계곡의 보석이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.nile_perch',name:'나일퍼치',emoji:'🐟',asset:'nile_perch',habitat:FISH_HABITATS.WATERFALL,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:40,maxSizeCm:180,basePrice:195,xp:20,weight:9,description:'폭포 소의 거대한 포식자다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.sockeye_salmon',name:'홍연어',emoji:'🐟',asset:'sockeye_salmon',habitat:FISH_HABITATS.WATERFALL,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:35,maxSizeCm:85,basePrice:90,xp:12,weight:30,description:'폭포를 거슬러 오르는 붉은 연어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.falls_catfish',name:'폭포메기',emoji:'🐟',asset:'falls_catfish',habitat:FISH_HABITATS.WATERFALL,rarity:FISH_RARITIES.COMMON,periods:null,weather:['rain'],minSizeCm:20,maxSizeCm:75,basePrice:38,xp:8,weight:35,description:'빗물 불어난 폭포 아래에 모여드는 메기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.silver_manchurian',name:'은빛열목어',emoji:'🐟',asset:'silver_manchurian',habitat:FISH_HABITATS.WATERFALL,rarity:FISH_RARITIES.UNCOMMON,periods:['DAWN','DUSK'],weather:['clear'],minSizeCm:20,maxSizeCm:70,basePrice:105,xp:12,weight:18,description:'여명과 황혼에만 은빛으로 빛나는 열목어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.tigerfish',name:'타이거피시',emoji:'🐟',asset:'tigerfish',habitat:FISH_HABITATS.WATERFALL,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:25,maxSizeCm:100,basePrice:185,xp:20,weight:8,description:'호랑이 같은 이빨의 폭포 사냥꾼이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.crystal_trout',name:'수정송어',emoji:'🐟',asset:'crystal_trout',habitat:FISH_HABITATS.WATERFALL,rarity:FISH_RARITIES.LEGENDARY,periods:['DAWN'],weather:['clear'],minSizeCm:25,maxSizeCm:90,basePrice:1450,xp:120,weight:.6,description:'폭포 물보라 속에 수정처럼 빛나는 환상의 송어다.',introducedVersion:'expansion'}),

  // Swamp
  defineFish({id:'fish.swamp_eel',name:'드렁허리',emoji:'🐟',asset:'swamp_eel',habitat:FISH_HABITATS.SWAMP,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:20,maxSizeCm:85,basePrice:35,xp:8,weight:35,description:'탁한 늪지 바닥을 미끄러지듯 누비는 가느다란 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.swamp_catfish',name:'늪메기',emoji:'🐟',asset:'swamp_catfish',habitat:FISH_HABITATS.SWAMP,rarity:FISH_RARITIES.COMMON,periods:['NIGHT'],weather:null,minSizeCm:20,maxSizeCm:90,basePrice:42,xp:8,weight:28,description:'밤의 늪지 바닥을 헤엄치는 수염의 사냥꾼이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.piranha',name:'피라냐',emoji:'🐟',asset:'piranha',habitat:FISH_HABITATS.SWAMP,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY'],weather:null,minSizeCm:10,maxSizeCm:35,basePrice:80,xp:12,weight:18,description:'늪지의 악명 높은 이빨 사냥꾼이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.black_ghost',name:'블랙고스트',emoji:'🐟',asset:'black_ghost',habitat:FISH_HABITATS.SWAMP,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:null,minSizeCm:15,maxSizeCm:55,basePrice:190,xp:20,weight:7,description:'검은 칼날 같은 몸으로 밤의 늪지를 유령처럼 떠다닌다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.electric_eel',name:'전기뱀장어',emoji:'🐟',asset:'electric_eel',habitat:FISH_HABITATS.SWAMP,rarity:FISH_RARITIES.RARE,periods:null,weather:['rain'],minSizeCm:60,maxSizeCm:240,basePrice:210,xp:20,weight:8,description:'비 오는 날 전기를 일으키는 늪지의 발전기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.arowana',name:'아로와나',emoji:'🐟',asset:'arowana',habitat:FISH_HABITATS.SWAMP,rarity:FISH_RARITIES.HEROIC,periods:['DAWN','DUSK'],weather:['clear'],minSizeCm:30,maxSizeCm:120,basePrice:450,xp:40,weight:2,description:'수면 위로 뛰어오르는 은빛 용고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.swamp_king_eel',name:'늪왕장어',emoji:'🐟',asset:'swamp_king_eel',habitat:FISH_HABITATS.SWAMP,rarity:FISH_RARITIES.LEGENDARY,periods:['NIGHT'],weather:['storm'],minSizeCm:100,maxSizeCm:260,basePrice:1550,xp:120,weight:.6,description:'폭풍우 치는 밤 늪지 심연에서 눈을 뜨는 왕이다.',introducedVersion:'expansion'}),

  // Shallow boat route
  defineFish({id:'fish.damselfish',name:'자리돔',emoji:'🐟',asset:'damselfish',habitat:FISH_HABITATS.BOAT_SHALLOW,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:8,maxSizeCm:22,basePrice:48,xp:8,weight:35,description:'얕은 바다 산호초의 단골 손님이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.wrasse',name:'놀래기',emoji:'🐠',asset:'wrasse',habitat:FISH_HABITATS.BOAT_SHALLOW,rarity:FISH_RARITIES.COMMON,periods:['DAY'],weather:null,minSizeCm:12,maxSizeCm:40,basePrice:55,xp:8,weight:28,description:'낮의 얕은 바다를 화려하게 수놓는 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.filefish',name:'쥐치',emoji:'🐟',asset:'filefish',habitat:FISH_HABITATS.BOAT_SHALLOW,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:12,maxSizeCm:45,basePrice:100,xp:12,weight:20,description:'가죽처럼 질긴 피부의 얕은수심 주민이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.striped_damsel',name:'줄돔',emoji:'🐟',asset:'striped_damsel',habitat:FISH_HABITATS.BOAT_SHALLOW,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY'],weather:null,minSizeCm:10,maxSizeCm:35,basePrice:110,xp:12,weight:18,description:'흰 줄무늬가 멋진 얕은 바다의 신사다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.barred_knifejaw',name:'돌돔',emoji:'🐟',asset:'barred_knifejaw',habitat:FISH_HABITATS.BOAT_SHALLOW,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:25,maxSizeCm:85,basePrice:230,xp:20,weight:8,description:'검은 줄무늬가 멋진 얕은 바다의 귀족이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.black_seabream',name:'감성돔',emoji:'🐟',asset:'black_seabream',habitat:FISH_HABITATS.BOAT_SHALLOW,rarity:FISH_RARITIES.RARE,periods:['DAWN','DAY'],weather:['clear'],minSizeCm:20,maxSizeCm:75,basePrice:250,xp:20,weight:7,description:'맑은 날 얕은수심을 누비는 은회색 고급어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.cuttlefish',name:'갑오징어',emoji:'🦑',asset:'cuttlefish',habitat:FISH_HABITATS.BOAT_SHALLOW,rarity:FISH_RARITIES.HEROIC,periods:['NIGHT'],weather:null,minSizeCm:15,maxSizeCm:55,basePrice:520,xp:40,weight:2,description:'밤바다에 색을 바꾸며 나타나는 위장의 달인이다.',introducedVersion:'expansion'}),

  // Middle boat route
  defineFish({id:'fish.spanish_mackerel',name:'삼치',emoji:'🐟',asset:'spanish_mackerel',habitat:FISH_HABITATS.BOAT_MID,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:35,maxSizeCm:130,basePrice:78,xp:8,weight:35,description:'중간수심을 무리 지어 다니는 날쌘 생선이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.yellowtail',name:'방어',emoji:'🐟',asset:'yellowtail',habitat:FISH_HABITATS.BOAT_MID,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:35,maxSizeCm:120,basePrice:155,xp:12,weight:22,description:'차가운 바다를 힘차게 누비는 힘센 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.amberjack',name:'부시리',emoji:'🐟',asset:'amberjack',habitat:FISH_HABITATS.BOAT_MID,rarity:FISH_RARITIES.UNCOMMON,periods:['DAY'],weather:null,minSizeCm:40,maxSizeCm:150,basePrice:175,xp:12,weight:18,description:'낮의 중층을 호위하듯 다니는 대형어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.marlin',name:'새치',emoji:'🐟',asset:'marlin',habitat:FISH_HABITATS.BOAT_MID,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:100,maxSizeCm:350,basePrice:340,xp:20,weight:8,description:'바다의 창기사. 빠른 돌진으로 유명하다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.sevenband_grouper',name:'다금바리',emoji:'🐟',asset:'sevenband_grouper',habitat:FISH_HABITATS.BOAT_MID,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:null,minSizeCm:35,maxSizeCm:140,basePrice:370,xp:20,weight:7,description:'밤의 중간수심 바위를 지키는 문지기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.bluefin_tuna',name:'참다랑어',emoji:'🐟',asset:'bluefin_tuna',habitat:FISH_HABITATS.BOAT_MID,rarity:FISH_RARITIES.HEROIC,periods:['DAWN'],weather:['clear'],minSizeCm:100,maxSizeCm:300,basePrice:740,xp:40,weight:2,description:'새벽 바다를 가르는 은빛 어뢰다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.deep_octopus',name:'심해문어',emoji:'🐙',asset:'deep_octopus',habitat:FISH_HABITATS.BOAT_MID,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:null,minSizeCm:20,maxSizeCm:120,basePrice:320,xp:20,weight:8,description:'밤에만 중층으로 올라오는 여덟 다리의 현자다.',introducedVersion:'expansion'}),

  // Deep sea; legacy coelacanth retains its identity below.
  defineFish({id:'fish.blobfish',name:'블롭피시',emoji:'🐟',asset:'blobfish',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:20,maxSizeCm:65,basePrice:145,xp:12,weight:30,description:'심해의 높은 압력에 적응해 살아가는 말랑한 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.anglerfish',name:'초롱아귀',emoji:'🐟',asset:'anglerfish',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:15,maxSizeCm:80,basePrice:290,xp:20,weight:12,description:'어둠 속에서 초롱을 흔들며 사냥하는 심해의 등대다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.deep_eel',name:'심해뱀장어',emoji:'🐟',asset:'deep_eel',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:null,minSizeCm:40,maxSizeCm:220,basePrice:310,xp:20,weight:10,description:'밤의 심해를 미끄러지듯 다니는 긴 그림자다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.vampire_squid',name:'흡혈오징어',emoji:'🐟',asset:'vampire_squid',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:10,maxSizeCm:50,basePrice:280,xp:20,weight:12,description:'망토처럼 펄럭이는 팔을 가진 심해의 귀족이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.deep_shark',name:'심해상어',emoji:'🐟',asset:'deep_shark',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.HEROIC,periods:['NIGHT'],weather:null,minSizeCm:120,maxSizeCm:420,basePrice:860,xp:40,weight:2,description:'빛 없는 바다를 조용히 순찰하는 거대한 포식자다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.ghost_shark',name:'은상어',emoji:'🐟',asset:'ghost_shark',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:50,maxSizeCm:160,basePrice:165,xp:12,weight:25,description:'유령처럼 창백한 심해의 상어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.coelacanth',name:'실러캔스',emoji:'🐟',asset:'coelacanth',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.LEGENDARY,periods:['NIGHT'],weather:['storm'],minSizeCm:100,maxSizeCm:180,basePrice:1500,xp:120,weight:.6,description:'폭풍우 치는 밤 심해에서 눈을 뜨는 살아있는 화석이다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.giant_squid',name:'대왕오징어',emoji:'🐟',asset:'giant_squid',habitat:FISH_HABITATS.BOAT_DEEP,rarity:FISH_RARITIES.LEGENDARY,periods:['NIGHT'],weather:['storm'],minSizeCm:300,maxSizeCm:1400,basePrice:1850,xp:120,weight:0.6,description:'폭풍우 치는 밤 심해에서만 떠오르는 바다의 괴물이다.',introducedVersion:'expansion'}),

  // Glacier expedition
  defineFish({id:'fish.toothfish',name:'메로',emoji:'🐟',asset:'toothfish',habitat:FISH_HABITATS.GLACIER,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:40,maxSizeCm:160,basePrice:190,xp:12,weight:26,description:'남극의 차가운 심해를 누비는 고급 생선이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.snow_smelt',name:'설빙어',emoji:'🐟',asset:'snow_smelt',habitat:FISH_HABITATS.GLACIER,rarity:FISH_RARITIES.COMMON,periods:['DAY'],weather:null,minSizeCm:6,maxSizeCm:24,basePrice:75,xp:8,weight:35,description:'낮의 빙하 해역에 은빛으로 반짝이는 작은 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.glacier_trout',name:'빙하송어',emoji:'🐟',asset:'glacier_trout',habitat:FISH_HABITATS.GLACIER,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:['clear'],minSizeCm:25,maxSizeCm:100,basePrice:210,xp:12,weight:22,description:'맑은 날 빙하수에 푸르게 빛나는 송어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.polar_cod',name:'극지대구',emoji:'🐟',asset:'polar_cod',habitat:FISH_HABITATS.GLACIER,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:20,maxSizeCm:85,basePrice:340,xp:20,weight:9,description:'극지방의 차가운 물을 견디는 강인한 대구다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.greenland_shark',name:'그린란드상어',emoji:'🐟',asset:'greenland_shark',habitat:FISH_HABITATS.GLACIER,rarity:FISH_RARITIES.RARE,periods:null,weather:null,minSizeCm:150,maxSizeCm:650,basePrice:390,xp:20,weight:7,description:'오랜 세월 차가운 빙하 바다를 떠도는 거대한 상어다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.arctic_char',name:'북극곤들매기',emoji:'🐟',asset:'arctic_char',habitat:FISH_HABITATS.GLACIER,rarity:FISH_RARITIES.HEROIC,periods:['DAWN','DUSK'],weather:['clear'],minSizeCm:25,maxSizeCm:100,basePrice:920,xp:40,weight:2,description:'여명과 황혼의 빙하에 나타나는 북극의 귀빈이다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.aurora_smelt',name:'오로라빙어',emoji:'🐟',asset:'aurora_smelt',habitat:FISH_HABITATS.GLACIER,rarity:FISH_RARITIES.LEGENDARY,periods:['NIGHT'],weather:['clear'],minSizeCm:8,maxSizeCm:35,basePrice:2000,xp:120,weight:0.6,description:'오로라빛 밤의 빙하에만 모습을 드러내는 환상의 빙어다.',introducedVersion:'expansion'}),

  // Coast
  defineFish({id:'fish.sardine',name:'정어리',emoji:'🐟',asset:'sardine',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.COMMON,periods:null,weather:null,minSizeCm:10,maxSizeCm:25,basePrice:25,xp:8,weight:35,description:'해안의 대표 소형어. 떼로 몰려다닌다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.mackerel',name:'고등어',emoji:'🐟',asset:'mackerel',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.COMMON,periods:['DAY','DUSK'],weather:null,minSizeCm:20,maxSizeCm:50,basePrice:40,xp:8,weight:30,description:'등푸른 생선의 대표주자다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.horse_mackerel',name:'전갱이',emoji:'🐟',asset:'horse_mackerel',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:15,maxSizeCm:45,basePrice:65,xp:12,weight:18,description:'해안가에서 흔히 만나는 단단한 생선이다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.red_seabream',name:'도미',emoji:'🐟',asset:'red_seabream',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:['DAWN','DAY'],weather:['clear'],minSizeCm:20,maxSizeCm:70,basePrice:95,xp:12,weight:14,description:'맑은 날 해안에 붉게 빛나는 고급어다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.rockfish',name:'볼락',emoji:'🐟',asset:'rockfish',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:['NIGHT'],weather:null,minSizeCm:12,maxSizeCm:38,basePrice:78,xp:12,weight:16,description:'밤의 얕은 바위틈에서 눈을 반짝이는 물고기다.',introducedVersion:'expansion'}),
  defineFish({id:'fish.seabass',name:'농어',emoji:'🐟',asset:'seabass',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.RARE,periods:['NIGHT'],weather:['rain','storm'],minSizeCm:30,maxSizeCm:100,basePrice:170,xp:20,weight:7,description:'비바람 치는 밤바다의 사냥꾼이다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.flounder',name:'광어',emoji:'🐟',asset:'flounder',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.RARE,periods:['DAY'],weather:['clear'],minSizeCm:25,maxSizeCm:90,basePrice:190,xp:20,weight:6,description:'맑은 날 모래바닥에 납작 엎드린 위장술사다.',introducedVersion:'baseline-v1'}),
  defineFish({id:'fish.korean_rockfish',name:'우럭',emoji:'🐟',asset:'korean_rockfish',habitat:FISH_HABITATS.COAST,rarity:FISH_RARITIES.UNCOMMON,periods:null,weather:null,minSizeCm:18,maxSizeCm:55,basePrice:72,xp:12,weight:20,description:'바위틈을 좋아하는 해안의 터줏대감이다.',introducedVersion:'expansion'}),
]);
