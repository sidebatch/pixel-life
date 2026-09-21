const WORLD_DEFINITION = Object.freeze({
  id: 'lilacVillage',
  name: '라일락 연못 마을',
  tileSize: 48,
  width: 64,
  height: 48,
  playerSpawn: { x: 25, y: 28, face: 'down' },

  paths: [
    { x1: 2, y1: 24, x2: 61, y2: 24 },
    { x1: 25, y1: 2, x2: 25, y2: 45 },
    { x1: 21, y1: 20, x2: 29, y2: 20 },
    { x1: 18, y1: 29, x2: 32, y2: 29 },
    { x1: 32, y1: 24, x2: 32, y2: 34 },
    { x1: 5, y1: 36, x2: 25, y2: 36 },
    { x1: 10, y1: 10, x2: 25, y2: 10 },
    { x1: 25, y1: 40, x2: 43, y2: 40 },
    { x1: 47, y1: 24, x2: 57, y2: 24 }
  ],

  stoneAreas: [
    { id: 'village_square', x: 23, y: 22, w: 6, h: 5 }
  ],

  waterAreas: [
    { id: 'lilac_pond', x: 35, y: 14, w: 13, h: 16, cutCorners: true }
  ],

  bridges: [
    { id: 'lilac_bridge', x1: 41, y1: 21, x2: 41, y2: 25 }
  ],

  fishingSpot: { x: 35, y: 23 },

  npcs: [
    {id:'mina',x:28,y:23,homeX:28,homeY:23,name:'미나',role:'villager',sprite:'mina',scale:1.00,face:'down',moving:false,wait:900,roam:3,dialog:'안녕! 연못 산책 중이었어. 물가에 가면 낚시를 시작할 수 있어.'},
    {id:'thomas',x:26,y:29,homeX:26,homeY:29,name:'토마스',role:'fisherman',sprite:'thomas',scale:1.00,face:'left',moving:false,wait:1400,roam:2,dialog:'낚시는 서두르면 안 돼. 물결을 잘 보면 입질 타이밍이 보여.'},
    {id:'elli',x:33,y:28,homeX:33,homeY:28,name:'엘리',role:'merchant',sprite:'elli',scale:1.00,face:'down',moving:false,wait:1800,roam:2,dialog:'광장에 작은 상점을 열 준비 중이야. 나중엔 잡은 물고기와 재료도 거래할 수 있어.'},
    {id:'noah',x:23,y:24,homeX:23,homeY:24,name:'노아',role:'guide',sprite:'noah',scale:1.00,face:'right',moving:false,wait:2200,roam:3,dialog:'오래된 숲으로 가는 길은 북쪽이야. 길을 따라가면 숲 가장자리까지 갈 수 있어.'},
    {id:'hana',x:31,y:27,homeX:31,homeY:27,name:'하나',role:'florist',sprite:'hana',scale:1.00,face:'left',moving:false,wait:1200,roam:2,dialog:'꽃은 계절마다 분위기가 달라져. 남쪽 초원에는 새로운 꽃밭을 만들 예정이야.'},
    {id:'jun',x:21,y:22,homeX:21,homeY:22,name:'준',role:'carpenter',sprite:'jun',scale:1.00,face:'right',moving:false,wait:1600,roam:2,dialog:'다리랑 집을 손보는 중이야. 길이 넓어져서 할 일이 더 많아졌어.'}
  ],

  fixedObjects: {
    sign: { x: 33, y: 24 },
    bench: { x: 29, y: 26 },
    lamp: { x: 31, y: 23 },
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
      interactType:'building',action:'enterHome',
      dialog:'따뜻한 불빛이 새어 나온다. 나중에는 실내 지역으로 연결할 수 있다.'
    },
    {
      id:'carpenter_workshop',name:'준의 작업실',sprite:'buildingWorkshop',
      x:27,y:16,w:6,h:4,drawW:330,drawH:318,depthLine:4,
      artAnchor:{doorCenterX:166,groundOffsetY:10},
      entrance:{door:{x:29,y:19},approach:{x:29,y:20},side:'left'},
      interactType:'workshop',action:'openWorkshop',
      dialog:'목재 냄새가 나는 작업실이다. 제작 기능이 열리면 이곳에서 가구와 도구를 만들 수 있다.'
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
    {x:6,y:13},{x:10,y:14},{x:15,y:13},{x:20,y:12},{x:29,y:7},{x:33,y:10},
    {x:50,y:5},{x:54,y:6},{x:58,y:5},{x:51,y:9},{x:56,y:10},{x:59,y:14},
    {x:5,y:28},{x:9,y:30},{x:14,y:27},{x:17,y:32},{x:7,y:40},{x:12,y:42},
    {x:18,y:41},{x:29,y:43},{x:35,y:44},{x:47,y:43},{x:55,y:42},{x:59,y:37},
    {x:52,y:29},{x:57,y:31},{x:50,y:16},{x:58,y:20}
  ]
});
