let WORLD_DEFINITION = Object.freeze({
  id: 'lilacVillage',
  name: '라일락 연못 마을',
  tileSize: 48,
  width: 64,
  height: 48,
  playerSpawn: { x: 25, y: 28, face: 'down' },
  terrain: {ground:'#83ad69',patchA:'#587d48',patchB:'#b9c67e',pathCore:'#d7c396',pathRim:'#b1ab76',plazaCore:'#c5b997',plazaEdge:'#a3ad79'},

  paths: [
    { x1: 2, y1: 24, x2: 61, y2: 24 },
    { x1: 25, y1: 2, x2: 25, y2: 45 },
    { x1: 21, y1: 20, x2: 29, y2: 20 },
    { x1: 18, y1: 29, x2: 32, y2: 29 },
    { x1: 32, y1: 24, x2: 32, y2: 34 },
    { x1: 1, y1: 36, x2: 25, y2: 36 },
    { x1: 10, y1: 10, x2: 25, y2: 10 },
    { x1: 25, y1: 40, x2: 43, y2: 40 },
    { x1: 29, y1: 38, x2: 29, y2: 40 },
    { x1: 47, y1: 24, x2: 57, y2: 24 },
    { x1: 32, y1: 32, x2: 50, y2: 32 },
    { x1: 50, y1: 24, x2: 50, y2: 32 },
    { x1: 50, y1: 24, x2: 62, y2: 24 },
    { x1: 10, y1: 20, x2: 10, y2: 24 },
    { x1: 25, y1: 11, x2: 31, y2: 11 },
    { x1: 15, y1: 34, x2: 15, y2: 36 },
    { x1: 13, y1: 36, x2: 13, y2: 43 },
    { x1: 8, y1: 43, x2: 17, y2: 43 },
    { x1: 8, y1: 41, x2: 8, y2: 43 },
    { x1: 13, y1: 41, x2: 17, y2: 41 }
  ],

  stoneAreas: [
    { id: 'village_square', x: 23, y: 22, w: 6, h: 5 }
  ],

  waterAreas: [
    { id: 'lilac_pond', x: 35, y: 14, w: 13, h: 16, cutCorners: true, fishingHabitat: 'pond' }
  ],

  bridges: [
    { id: 'lilac_bridge', x1: 41, y1: 21, x2: 41, y2: 25 }
  ],

  fishingSpot: { x: 35, y: 23 },

  npcs: [
    {id:'mina',x:28,y:23,homeX:28,homeY:23,name:'미나',role:'villager',sprite:'mina',scale:1.00,face:'down',moving:false,wait:900,roam:3,dialog:'안녕! 연못 산책 중이었어. 물가에 가면 낚시를 시작할 수 있어.'},
    {id:'thomas',x:26,y:29,homeX:26,homeY:29,name:'토마스',role:'fisherman',sprite:'thomas',scale:1.00,face:'left',moving:false,wait:1400,roam:2,dialog:'낚시는 서두르면 안 돼. 물결을 잘 보면 입질 타이밍이 보여.'},
    {id:'elli',x:29,y:38,homeX:29,homeY:38,name:'엘리',role:'merchant',sprite:'elli',scale:1.00,face:'down',moving:false,wait:1800,roam:0,dialog:'어서 와! 물고기와 수확물을 팔거나 씨앗과 낚싯대를 살 수 있어.'},
    {id:'noah',x:23,y:24,homeX:23,homeY:24,name:'노아',role:'guide',sprite:'noah',scale:1.00,face:'right',moving:false,wait:2200,roam:3,dialog:'북쪽 길 끝은 오래된 숲, 동쪽 길 끝은 햇살 농장이야. 길 끝에서 이동할 수 있어.'},
    {id:'hana',x:31,y:27,homeX:31,homeY:27,name:'하나',role:'stylist',sprite:'hana',scale:1.00,face:'down',moving:false,wait:1200,roam:0,dialog:'안녕! 이안·리아 중 원하는 모습으로 바꿔 줄게. 옷과 가방은 그대로야.'},
    {id:'jun',x:30,y:20,homeX:30,homeY:20,name:'준',role:'toolMerchant',sprite:'jun',scale:1.00,face:'down',moving:false,wait:1600,roam:0,dialog:'목재를 팔거나 도끼를 업그레이드하고 싶으면 말해 줘.'},
    {id:'luca',x:12,y:21,homeX:12,homeY:21,name:'루카',role:'villager',residentOf:'hearth_inn',serviceKey:'cooking',sprite:'luca',scale:1,face:'down',moving:false,wait:1700,roam:2,dialog:'굴뚝에서 좋은 냄새가 나지? 오늘은 허브를 넉넉히 넣었어. 긴 여행에서 돌아오면 잠깐 쉬어 가.'},
    {id:'sora',x:11,y:42,homeX:11,homeY:42,name:'소라',role:'villager',residentOf:'garden_cottage',serviceKey:'gardening',sprite:'sora',scale:1,face:'right',moving:false,wait:2100,roam:2,dialog:'작은 정원도 계절마다 표정이 달라져. 꽃이 고개를 숙이면 물을 주고, 바람이 불면 잠깐 기다려.'},
    {id:'eden',x:33,y:12,homeX:33,homeY:12,name:'이든',role:'villager',residentOf:'village_hall',serviceKey:'community',sprite:'eden',scale:1,face:'left',moving:false,wait:1900,roam:2,dialog:'회관 종소리가 들리면 마을 사람들이 모여. 숲과 항구를 오가는 여행자 이야기를 듣는 게 내 낙이야.'}
  ],

  fixedObjects: {
    sign: { x: 33, y: 24 },
    bench: { x: 29, y: 26 },
    lamp: { x: 31, y: 23 },
    marketShop: { x: 27, y: 34, w: 5, h: 4 },
    rocks: [
      {x:21,y:27},{x:44,y:31},{x:19,y:22},{x:12,y:34},{x:50,y:38},{x:53,y:12}
    ]
  },

  decorations: {
    bushes: [
      {x:22,y:21,v:0,s:.82,flip:false},{x:31,y:28,v:1,s:.72,flip:true},{x:49,y:21,v:0,s:.76,flip:true},
      {x:20,y:30,v:1,s:.66,flip:false},{x:28,y:30,v:0,s:.70,flip:false},{x:34,y:16,v:1,s:.64,flip:true},
      {x:8,y:33,v:0,s:.72,flip:false},{x:16,y:38,v:1,s:.68,flip:true},{x:49,y:34,v:0,s:.74,flip:false},
      {x:55,y:18,v:1,s:.65,flip:true},{x:14,y:13,v:0,s:.70,flip:false}
    ],
    flowers: [
      {x:30,y:22,v:0,s:.61,flip:false},{x:31,y:22,v:1,s:.55,flip:true},{x:29,y:28,v:1,s:.58,flip:false},
      {x:30,y:28,v:0,s:.52,flip:true},{x:49,y:25,v:1,s:.57,flip:true},{x:24,y:31,v:0,s:.48,flip:false},
      {x:7,y:35,v:1,s:.54,flip:false},{x:11,y:38,v:0,s:.50,flip:true},{x:18,y:34,v:1,s:.56,flip:false},
      {x:6,y:21,v:1,s:.55,flip:false},{x:14,y:21,v:0,s:.55,flip:true},
      {x:28,y:12,v:0,s:.55,flip:false},{x:35,y:12,v:1,s:.55,flip:true},
      {x:6,y:41,v:1,s:.53,flip:false},{x:10,y:41,v:0,s:.57,flip:true},
      {x:15,y:42,v:1,s:.48,flip:false},{x:20,y:41,v:0,s:.53,flip:true},
      {x:48,y:39,v:0,s:.53,flip:true},{x:54,y:22,v:1,s:.55,flip:false}
    ],
    grassTufts: [
      {x:23,y:19,s:.38,flip:false},{x:33,y:21,s:.34,flip:true},{x:19,y:28,s:.31,flip:false},
      {x:27,y:18,s:.28,flip:true},{x:49,y:29,s:.35,flip:false},{x:50,y:19,s:.30,flip:true},{x:21,y:32,s:.27,flip:false},
      {x:6,y:31,s:.34,flip:true},{x:15,y:33,s:.31,flip:false},{x:51,y:35,s:.36,flip:true},{x:57,y:27,s:.30,flip:false}
    ],
    reeds: [
      {x:34,y:19,s:.43,flip:false},{x:34,y:26,s:.39,flip:true},{x:48,y:20,s:.42,flip:true},{x:48,y:25,s:.37,flip:false},
      {x:37,y:13,s:.40,flip:false},{x:45,y:30,s:.38,flip:true}
    ]
  },

  buildings: [
    {
      id:'home_cottage',name:'파란 지붕 집',sprite:'buildingHome',
      x:19,y:16,w:5,h:4,drawW:300,drawH:293,depthLine:4,
      artAnchor:{doorCenterX:158,groundOffsetY:10},
      entrance:{door:{x:21,y:19},approach:{x:21,y:20},side:'center'},
      interactType:'building',action:'enterHome',interactionLabel:'살펴보기',sizeFamily:'cottage',
      dialog:'창가의 화분과 잘 닦인 현관에서 집주인의 부지런함이 느껴진다.'
    },
    {
      id:'carpenter_workshop',name:'준의 도구점',sprite:'buildingWorkshop',sizeFamily:'workshop',
      x:27,y:16,w:6,h:4,drawW:330,drawH:318,depthLine:4,
      artAnchor:{doorCenterX:166,groundOffsetY:10},
      entrance:{door:{x:29,y:19},approach:{x:29,y:20},side:'left'},
      interactType:'workshop',action:'openWorkshop',
      dialog:'목재와 도끼를 다루는 작업실이다. 앞에 있는 준에게 말을 걸어 보자.'
    },
    {
      id:'village_hall',name:'초록종 회관',sprite:'buildingTownhall',sizeFamily:'hall',
      x:28,y:6,w:8,h:5,drawW:480,drawH:364.5,depthLine:5,
      artAnchor:{doorCenterX:153,groundOffsetY:12},
      entrance:{door:{x:31,y:10},approach:{x:31,y:11},side:'center'},
      interactType:'building',action:'inspect',interactionLabel:'살펴보기',serviceKey:'community',interiorId:null,
      dialog:'초록 지붕 위 작은 종이 바람에 울린다. 게시판에는 주민들의 손때 묻은 쪽지가 붙어 있다.'
    },
    {
      id:'hearth_inn',name:'노을솥 여관',sprite:'buildingInn',sizeFamily:'wide_inn',
      x:6,y:16,w:8,h:4,drawW:480,drawH:291,depthLine:4,
      artAnchor:{doorCenterX:149,groundOffsetY:12},
      entrance:{door:{x:10,y:19},approach:{x:10,y:20},side:'center'},
      interactType:'building',action:'inspect',interactionLabel:'살펴보기',serviceKey:'cooking',interiorId:null,
      dialog:'붉은 지붕 아래에서 따뜻한 국 냄새가 난다. 현관에 놓인 장화에는 먼 길의 흔적이 남아 있다.'
    },
    {
      id:'thread_atelier',name:'달실 의상 공방',sprite:'buildingAtelier',sizeFamily:'tall_atelier',
      x:14,y:29,w:4,h:5,drawW:234,drawH:342,depthLine:5,
      artAnchor:{doorCenterX:58,groundOffsetY:12},
      entrance:{door:{x:15,y:33},approach:{x:15,y:34},side:'left'},
      interactType:'building',action:'inspect',interactionLabel:'살펴보기',serviceKey:'wardrobe',interiorId:null,
      dialog:'보랏빛 지붕의 작은 공방이다. 차양 아래 알록달록한 천과 실이 가지런히 놓여 있다.'
    },
    {
      id:'garden_cottage',name:'소라의 정원집',sprite:'buildingGardener',sizeFamily:'garden_hut',
      x:7,y:38,w:3,h:3,drawW:210,drawH:187.5,depthLine:3,
      artAnchor:{doorCenterX:54,groundOffsetY:12},
      entrance:{door:{x:8,y:40},approach:{x:8,y:41},side:'left'},
      interactType:'building',action:'inspect',interactionLabel:'살펴보기',serviceKey:'gardening',interiorId:null,
      dialog:'짚 지붕과 둥근 창을 덩굴이 감싸고 있다. 현관 옆 화분에서 막 피어난 꽃들이 흔들린다.'
    },
    {
      id:'veranda_home',name:'바람마루 집',sprite:'buildingVeranda',sizeFamily:'veranda',
      x:15,y:38,w:5,h:3,drawW:300,drawH:186,depthLine:3,
      artAnchor:{doorCenterX:116,groundOffsetY:12},
      entrance:{door:{x:17,y:40},approach:{x:17,y:41},side:'right'},
      interactType:'building',action:'inspect',interactionLabel:'살펴보기',serviceKey:'housing',interiorId:null,
      dialog:'낮고 넓은 툇마루에 햇볕이 든다. 창가에는 책 한 권과 식어 가는 찻잔이 놓여 있다.'
    }
  ],

  treeLines: [
    { axis:'x', from:1, to:62, step:2, fixed:1, gaps:[[23,27],[39,43]] },
    { axis:'x', from:1, to:62, step:2, fixed:46, gaps:[[23,27],[40,44]] },
    { axis:'y', from:3, to:44, step:2, fixed:1, gaps:[[22,26],[34,38]] },
    { axis:'y', from:3, to:44, step:2, fixed:62, gaps:[[22,26]] }
  ],

  trees: [
    {x:5,y:5},{x:8,y:5},{x:11,y:5},{x:14,y:5},{x:17,y:5},{x:20,y:5},
    {x:5,y:8},{x:8,y:8},{x:11,y:8},{x:14,y:8},{x:17,y:8},{x:20,y:8},
    {x:6,y:13},{x:10,y:14},{x:15,y:13},{x:20,y:12},{x:37,y:8},
    {x:50,y:5},{x:54,y:6},{x:58,y:5},{x:51,y:9},{x:56,y:10},{x:59,y:14},
    {x:5,y:28},{x:9,y:30},{x:11,y:28},{x:12,y:42},
    {x:21,y:42},{x:29,y:43},{x:35,y:44},{x:47,y:43},{x:55,y:42},{x:59,y:37},
    {x:52,y:29},{x:57,y:31},{x:50,y:16},{x:58,y:20}
  ]
});
