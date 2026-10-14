const FARM_ORDER_RULES=Object.freeze({
  schemaVersion:1,
  maxTickets:9999999,
  tiers:Object.freeze([
    Object.freeze({tier:1,minLevel:1,minPlots:4,lines:1,minQuantity:4,maxQuantity:8,maxGrowMinutes:5}),
    Object.freeze({tier:2,minLevel:10,minPlots:8,lines:2,minQuantity:6,maxQuantity:10,maxGrowMinutes:12}),
    Object.freeze({tier:3,minLevel:20,minPlots:12,lines:3,minQuantity:8,maxQuantity:12,maxGrowMinutes:40})
  ])
});
const FARM_DECORATIONS=Object.freeze([
  Object.freeze({id:'scarecrow',name:'허수아비',cost:3,asset:'farmScarecrow',width:58,height:64,
    description:'밀짚모자 허수아비를 밭 왼쪽에 세워요.',slots:Object.freeze([{x:13,y:22}])}),
  Object.freeze({id:'sign',name:'농장 표지판',cost:5,asset:'farmSign',width:48,height:48,
    description:'당근 그림 표지판을 밭 오른쪽에 세워요.',slots:Object.freeze([{x:23,y:22}])}),
  Object.freeze({id:'fence',name:'꽃 울타리',cost:8,asset:'farmFence',width:48,height:48,
    description:'밭 아래 가장자리에 꽃이 달린 울타리를 설치해요.',
    slots:Object.freeze(Array.from({length:7},(_,i)=>({x:15+i,y:27})))}),
  Object.freeze({id:'flowerpot',name:'꽃 화분',cost:2,asset:'farmFlowerpot',width:44,height:48,
    description:'분홍 꽃이 핀 화분을 밭 왼쪽 아래에 놓아요.',slots:Object.freeze([{x:13,y:25}])}),
  Object.freeze({id:'haybale',name:'건초 더미',cost:4,asset:'farmHaybale',width:48,height:48,
    description:'황금빛 건초 더미를 밭 오른쪽에 놓아요.',slots:Object.freeze([{x:23,y:24}])}),
  Object.freeze({id:'waterbarrel',name:'나무 물통',cost:6,asset:'farmWaterbarrel',width:44,height:48,
    description:'물이 담긴 나무 통을 농장 왼쪽 아래에 놓아요.',slots:Object.freeze([{x:13,y:27}])}),
  Object.freeze({id:'bench',name:'나무 벤치',cost:10,asset:'farmBench',width:88,height:88,
    description:'농장 아래쪽에 아늑한 나무 벤치를 놓아요.',slots:Object.freeze([{x:17,y:29},{x:18,y:29}]),
    renderSlots:Object.freeze([{x:17.5,y:29}])}),
  Object.freeze({id:'well',name:'작은 우물',cost:12,asset:'farmWell',width:72,height:72,
    description:'빨간 지붕의 작은 우물을 농장 오른쪽 아래에 놓아요.',slots:Object.freeze([{x:24,y:29},{x:25,y:29}]),
    renderSlots:Object.freeze([{x:24.5,y:29}])})
]);
const FARM_DECOR_BY_ID=new Map(FARM_DECORATIONS.map(item=>[item.id,item]));
