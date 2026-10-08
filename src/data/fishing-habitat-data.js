const FISHING_HABITAT_GROUPS=Object.freeze([
  Object.freeze({id:'inland',label:'내륙',order:1}),
  Object.freeze({id:'coastal',label:'해안',order:2}),
  Object.freeze({id:'offshore',label:'원양',order:3})
]);

const FISHING_HABITATS=Object.freeze([
  Object.freeze({id:'pond',constant:'POND',label:'연못',shortLabel:'연못',groupId:'inland',order:1,targetSpeciesCount:8,recommendedLevel:1,access:'시작 지역과 농장 연못'}),
  Object.freeze({id:'river',constant:'RIVER',label:'강',shortLabel:'강',groupId:'inland',order:2,targetSpeciesCount:8,recommendedLevel:5,access:'기존 숲의 강'}),
  Object.freeze({id:'mountain_lake',constant:'MOUNTAIN_LAKE',label:'산악 호수',shortLabel:'산악 호수',groupId:'inland',order:3,targetSpeciesCount:7,recommendedLevel:12,access:'산악 지역 탐험으로 개방'}),
  Object.freeze({id:'coast',constant:'COAST',label:'바다',shortLabel:'바다',groupId:'coastal',order:4,targetSpeciesCount:8,recommendedLevel:18,access:'해안 지역 개방'}),
  Object.freeze({id:'waterfall',constant:'WATERFALL',label:'폭포',shortLabel:'폭포',groupId:'inland',order:5,targetSpeciesCount:7,recommendedLevel:22,access:'폭포가 있는 상위 숲 물가 발견'}),
  Object.freeze({id:'swamp',constant:'SWAMP',label:'늪지',shortLabel:'늪지',groupId:'inland',order:6,targetSpeciesCount:7,recommendedLevel:28,access:'늪지 지역 개방'}),
  Object.freeze({id:'boat_shallow',constant:'BOAT_SHALLOW',label:'어선·얕은수심',shortLabel:'얕은수심',groupId:'offshore',order:7,targetSpeciesCount:7,recommendedLevel:35,access:'항구 노선 해금·얕은 바다 승선권'}),
  Object.freeze({id:'boat_mid',constant:'BOAT_MID',label:'어선·중간수심',shortLabel:'중간수심',groupId:'offshore',order:8,targetSpeciesCount:7,recommendedLevel:45,access:'중간 바다 노선 해금·승선권'}),
  Object.freeze({id:'boat_deep',constant:'BOAT_DEEP',label:'어선·심해지역',shortLabel:'심해지역',groupId:'offshore',order:9,targetSpeciesCount:8,recommendedLevel:55,access:'심해 노선 해금·승선권'}),
  Object.freeze({id:'glacier',constant:'GLACIER',label:'빙하',shortLabel:'빙하',groupId:'offshore',order:10,targetSpeciesCount:7,recommendedLevel:65,access:'극지 항로 해금·빙하 승선권'})
]);

const FISHING_HABITAT_BY_ID=new Map(FISHING_HABITATS.map(habitat=>[habitat.id,habitat]));
const FISHING_HABITATS_BY_GROUP=Object.freeze(Object.fromEntries(FISHING_HABITAT_GROUPS.map(group=>[
  group.id,Object.freeze(FISHING_HABITATS.filter(habitat=>habitat.groupId===group.id))
])));
const FISH_HABITATS=Object.freeze(Object.fromEntries(FISHING_HABITATS.map(habitat=>[habitat.constant,habitat.id])));

function defineFishingTargetFish(id,name,habitat,rarity,periods,weather,description,introducedVersion='expansion'){
  return Object.freeze({
    id,name,asset:id.slice('fish.'.length),habitat,rarity,
    periods:periods?Object.freeze([...periods]):null,
    weather:weather?Object.freeze([...weather]):null,
    description,introducedVersion
  });
}

const FISHING_TARGET_ROSTER=Object.freeze([
  defineFishingTargetFish('fish.crucian_carp','붕어','pond','common',null,null,'마을 연못의 단골. 미끼만 던지면 올라오는 친근한 민물고기다.','baseline-v1'),
  defineFishingTargetFish('fish.koi','잉어','pond','common',null,null,'연못의 터줏대감. 크고 느긋하게 움직인다.','baseline-v1'),
  defineFishingTargetFish('fish.goldfish','금붕어','pond','uncommon',['DAY'],['clear'],'낮의 햇살을 받아 반짝이는 작은 관상어다.','baseline-v1'),
  defineFishingTargetFish('fish.largemouth_bass','큰입배스','pond','uncommon',['DAY','DUSK'],null,'연못의 포식자. 입질이 강렬하다.','baseline-v1'),
  defineFishingTargetFish('fish.catfish','메기','pond','rare',['NIGHT'],['rain','storm'],'비 오는 밤에만 모습을 드러내는 연못의 그림자다.','baseline-v1'),
  defineFishingTargetFish('fish.golden_koi','황금잉어','pond','heroic',['DAWN'],['clear'],'새벽 연못에 떠오르는 황금빛 행운이다.','baseline-v1'),
  defineFishingTargetFish('fish.bluegill','블루길','pond','common',null,null,'파란 볼이 매력적인 연못의 단골이다.'),
  defineFishingTargetFish('fish.killifish','송사리','pond','common',['DAY'],null,'수면 위를 총총 뛰어다니는 작은 물고기다.'),

  defineFishingTargetFish('fish.minnow','피라미','river','common',null,null,'숲 강에서 가장 흔한 작은 물고기다.','baseline-v1'),
  defineFishingTargetFish('fish.trout','송어','river','common',['DAY'],null,'맑은 강물을 좋아하는 대표적인 계류어다.','baseline-v1'),
  defineFishingTargetFish('fish.ayu','은어','river','uncommon',['DAY'],['clear'],'맑은 날 강에서 반짝이는 은빛 물고기다.','baseline-v1'),
  defineFishingTargetFish('fish.salmon','연어','river','uncommon',['DAWN','DUSK'],null,'강을 거슬러 오르는 회귀의 물고기다.','baseline-v1'),
  defineFishingTargetFish('fish.snakehead','가물치','river','rare',['NIGHT'],null,'밤의 강을 지배하는 사나운 포식자다.','baseline-v1'),
  defineFishingTargetFish('fish.rainbow_trout','무지개송어','river','rare',['DAY','DUSK'],['rain'],'비 오는 날 무지개처럼 빛나는 송어다.','baseline-v1'),
  defineFishingTargetFish('fish.masou_salmon','산천어','river','heroic',['DAWN'],['clear'],'새벽 강물에 떠오르는 붉은 점의 귀빈이다.','baseline-v1'),
  defineFishingTargetFish('fish.mandarin_fish','쏘가리','river','common',null,null,'맑은 강바닥에 숨어사는 자존심 강한 물고기다.'),

  defineFishingTargetFish('fish.pond_smelt','빙어','mountain_lake','common',null,null,'차가운 산악 호수에 떼 지어 다니는 작은 물고기다.'),
  defineFishingTargetFish('fish.freshwater_eel','민물장어','mountain_lake','common',null,null,'산악 호수까지 거슬러 올라온 생명력의 상징이다.'),
  defineFishingTargetFish('fish.manchurian_trout','열목어','mountain_lake','uncommon',['DAY','DUSK'],['clear'],'맑은 고산 호수의 귀빈. 붉은 반점이 아름답다.'),
  defineFishingTargetFish('fish.lake_trout','호수송어','mountain_lake','uncommon',null,null,'깊은 산악 호수에 사는 대형 송어다.'),
  defineFishingTargetFish('fish.brown_trout','갈색송어','mountain_lake','rare',null,null,'갈색 바탕에 붉은 반점이 멋진 산악 호수의 터줏대감이다.'),
  defineFishingTargetFish('fish.sturgeon','철갑상어','mountain_lake','rare',null,null,'단단한 비늘을 두른 산악 호수 깊은 곳의 거대한 물고기다.'),
  defineFishingTargetFish('fish.aurora_trout','오로라송어','mountain_lake','legendary',['DAWN'],['clear'],'오로라빛 새벽에만 모습을 드러내는 환상의 송어다.'),

  defineFishingTargetFish('fish.sardine','정어리','coast','common',null,null,'해안의 대표 소형어. 떼로 몰려다닌다.','baseline-v1'),
  defineFishingTargetFish('fish.mackerel','고등어','coast','common',['DAY','DUSK'],null,'등푸른 생선의 대표주자다.','baseline-v1'),
  defineFishingTargetFish('fish.horse_mackerel','전갱이','coast','uncommon',null,null,'해안가에서 흔히 만나는 단단한 생선이다.','baseline-v1'),
  defineFishingTargetFish('fish.red_seabream','도미','coast','uncommon',['DAWN','DAY'],['clear'],'맑은 날 해안에 붉게 빛나는 고급어다.','baseline-v1'),
  defineFishingTargetFish('fish.rockfish','볼락','coast','uncommon',['NIGHT'],null,'밤의 얕은 바위틈에서 눈을 반짝이는 물고기다.'),
  defineFishingTargetFish('fish.seabass','농어','coast','rare',['NIGHT'],['rain','storm'],'비바람 치는 밤바다의 사냥꾼이다.','baseline-v1'),
  defineFishingTargetFish('fish.flounder','광어','coast','rare',['DAY'],['clear'],'맑은 날 모래바닥에 납작 엎드린 위장술사다.','baseline-v1'),
  defineFishingTargetFish('fish.korean_rockfish','우럭','coast','uncommon',null,null,'바위틈을 좋아하는 해안의 터줏대감이다.'),

  defineFishingTargetFish('fish.golden_trout','황금송어','waterfall','heroic',['DAY'],['clear'],'폭포수에 황금빛으로 빛나는 계곡의 보석이다.'),
  defineFishingTargetFish('fish.nile_perch','나일퍼치','waterfall','rare',null,null,'폭포 소의 거대한 포식자다.'),
  defineFishingTargetFish('fish.sockeye_salmon','홍연어','waterfall','uncommon',null,null,'폭포를 거슬러 오르는 붉은 연어다.'),
  defineFishingTargetFish('fish.falls_catfish','폭포메기','waterfall','common',null,['rain'],'빗물 불어난 폭포 아래에 모여드는 메기다.'),
  defineFishingTargetFish('fish.silver_manchurian','은빛열목어','waterfall','uncommon',['DAWN','DUSK'],['clear'],'여명과 황혼에만 은빛으로 빛나는 열목어다.'),
  defineFishingTargetFish('fish.tigerfish','타이거피시','waterfall','rare',null,null,'호랑이 같은 이빨의 폭포 사냥꾼이다.'),
  defineFishingTargetFish('fish.crystal_trout','수정송어','waterfall','legendary',['DAWN'],['clear'],'폭포 물보라 속에 수정처럼 빛나는 환상의 송어다.'),

  defineFishingTargetFish('fish.swamp_eel','드렁허리','swamp','common',null,null,'탁한 늪지 바닥을 미끄러지듯 누비는 가느다란 물고기다.'),
  defineFishingTargetFish('fish.swamp_catfish','늪메기','swamp','common',['NIGHT'],null,'밤의 늪지 바닥을 헤엄치는 수염의 사냥꾼이다.'),
  defineFishingTargetFish('fish.piranha','피라냐','swamp','uncommon',['DAY'],null,'늪지의 악명 높은 이빨 사냥꾼이다.'),
  defineFishingTargetFish('fish.black_ghost','블랙고스트','swamp','rare',['NIGHT'],null,'검은 칼날 같은 몸으로 밤의 늪지를 유령처럼 떠다닌다.'),
  defineFishingTargetFish('fish.electric_eel','전기뱀장어','swamp','rare',null,['rain'],'비 오는 날 전기를 일으키는 늪지의 발전기다.'),
  defineFishingTargetFish('fish.arowana','아로와나','swamp','heroic',['DAWN','DUSK'],['clear'],'수면 위로 뛰어오르는 은빛 용고기다.'),
  defineFishingTargetFish('fish.swamp_king_eel','늪왕장어','swamp','legendary',['NIGHT'],['storm'],'폭풍우 치는 밤 늪지 심연에서 눈을 뜨는 왕이다.'),

  defineFishingTargetFish('fish.damselfish','자리돔','boat_shallow','common',null,null,'얕은 바다 산호초의 단골 손님이다.'),
  defineFishingTargetFish('fish.wrasse','놀래기','boat_shallow','common',['DAY'],null,'낮의 얕은 바다를 화려하게 수놓는 물고기다.'),
  defineFishingTargetFish('fish.filefish','쥐치','boat_shallow','uncommon',null,null,'가죽처럼 질긴 피부의 얕은수심 주민이다.'),
  defineFishingTargetFish('fish.striped_damsel','줄돔','boat_shallow','uncommon',['DAY'],null,'흰 줄무늬가 멋진 얕은 바다의 신사다.'),
  defineFishingTargetFish('fish.barred_knifejaw','돌돔','boat_shallow','rare',null,null,'검은 줄무늬가 멋진 얕은 바다의 귀족이다.'),
  defineFishingTargetFish('fish.black_seabream','감성돔','boat_shallow','rare',['DAWN','DAY'],['clear'],'맑은 날 얕은수심을 누비는 은회색 고급어다.'),
  defineFishingTargetFish('fish.cuttlefish','갑오징어','boat_shallow','heroic',['NIGHT'],null,'밤바다에 색을 바꾸며 나타나는 위장의 달인이다.'),

  defineFishingTargetFish('fish.spanish_mackerel','삼치','boat_mid','common',null,null,'중간수심을 무리 지어 다니는 날쌘 생선이다.'),
  defineFishingTargetFish('fish.yellowtail','방어','boat_mid','uncommon',null,null,'차가운 바다를 힘차게 누비는 힘센 물고기다.'),
  defineFishingTargetFish('fish.amberjack','부시리','boat_mid','uncommon',['DAY'],null,'낮의 중층을 호위하듯 다니는 대형어다.'),
  defineFishingTargetFish('fish.marlin','새치','boat_mid','rare',null,null,'바다의 창기사. 빠른 돌진으로 유명하다.'),
  defineFishingTargetFish('fish.sevenband_grouper','다금바리','boat_mid','rare',['NIGHT'],null,'밤의 중간수심 바위를 지키는 문지기다.'),
  defineFishingTargetFish('fish.bluefin_tuna','참다랑어','boat_mid','heroic',['DAWN'],['clear'],'새벽 바다를 가르는 은빛 어뢰다.'),
  defineFishingTargetFish('fish.deep_octopus','심해문어','boat_mid','rare',['NIGHT'],null,'밤에만 중층으로 올라오는 여덟 다리의 현자다.'),

  defineFishingTargetFish('fish.blobfish','블롭피시','boat_deep','uncommon',null,null,'심해의 높은 압력에 적응해 살아가는 말랑한 물고기다.'),
  defineFishingTargetFish('fish.anglerfish','초롱아귀','boat_deep','rare',null,null,'어둠 속에서 초롱을 흔들며 사냥하는 심해의 등대다.'),
  defineFishingTargetFish('fish.deep_eel','심해뱀장어','boat_deep','rare',['NIGHT'],null,'밤의 심해를 미끄러지듯 다니는 긴 그림자다.'),
  defineFishingTargetFish('fish.vampire_squid','흡혈오징어','boat_deep','rare',null,null,'망토처럼 펄럭이는 팔을 가진 심해의 귀족이다.'),
  defineFishingTargetFish('fish.deep_shark','심해상어','boat_deep','heroic',['NIGHT'],null,'빛 없는 바다를 조용히 순찰하는 거대한 포식자다.'),
  defineFishingTargetFish('fish.ghost_shark','은상어','boat_deep','uncommon',null,null,'유령처럼 창백한 심해의 상어다.'),
  defineFishingTargetFish('fish.coelacanth','실러캔스','boat_deep','legendary',['NIGHT'],['storm'],'폭풍우 치는 밤 심해에서 눈을 뜨는 살아있는 화석이다.','baseline-v1'),
  defineFishingTargetFish('fish.giant_squid','대왕오징어','boat_deep','legendary',['NIGHT'],['storm'],'폭풍우 치는 밤 심해에서만 떠오르는 바다의 괴물이다.'),

  defineFishingTargetFish('fish.toothfish','메로','glacier','uncommon',null,null,'남극의 차가운 심해를 누비는 고급 생선이다.'),
  defineFishingTargetFish('fish.snow_smelt','설빙어','glacier','common',['DAY'],null,'낮의 빙하 해역에 은빛으로 반짝이는 작은 물고기다.'),
  defineFishingTargetFish('fish.glacier_trout','빙하송어','glacier','uncommon',null,['clear'],'맑은 날 빙하수에 푸르게 빛나는 송어다.'),
  defineFishingTargetFish('fish.polar_cod','극지대구','glacier','rare',null,null,'극지방의 차가운 물을 견디는 강인한 대구다.'),
  defineFishingTargetFish('fish.greenland_shark','그린란드상어','glacier','rare',null,null,'오랜 세월 차가운 빙하 바다를 떠도는 거대한 상어다.'),
  defineFishingTargetFish('fish.arctic_char','북극곤들매기','glacier','heroic',['DAWN','DUSK'],['clear'],'여명과 황혼의 빙하에 나타나는 북극의 귀빈이다.'),
  defineFishingTargetFish('fish.aurora_smelt','오로라빙어','glacier','legendary',['NIGHT'],['clear'],'오로라빛 밤의 빙하에만 모습을 드러내는 환상의 빙어다.')
]);

const FISHING_TARGET_FISH_BY_ID=new Map(FISHING_TARGET_ROSTER.map(fish=>[fish.id,fish]));
