const waterSet=new Set(), pathSet=new Set(), stoneSet=new Set(), bridgeSet=new Set(), blocked=new Set();
const key=(x,y)=>`${x},${y}`;
const inside=(x,y)=>x>=0&&y>=0&&x<MAP_W&&y<MAP_H;

// border
for(let x=0;x<MAP_W;x++){ blocked.add(key(x,0));blocked.add(key(x,MAP_H-1));}
for(let y=0;y<MAP_H;y++){ blocked.add(key(0,y));blocked.add(key(MAP_W-1,y));}

// main roads
for(let x=2;x<=31;x++) pathSet.add(key(x,12));
for(let y=2;y<=21;y++) pathSet.add(key(10,y));
for(let x=6;x<=14;x++) pathSet.add(key(x,8)); // village front-door lane
for(let x=3;x<=17;x++) pathSet.add(key(x,17));
for(let y=12;y<=17;y++) pathSet.add(key(17,y));

// stone square
for(let x=8;x<=13;x++) for(let y=10;y<=14;y++) stoneSet.add(key(x,y));

// pond with slightly irregular shape
for(let x=20;x<=28;x++) for(let y=5;y<=15;y++){
  if((y===5&&(x===20||x===28))||(y===15&&(x===20||x===28))) continue;
  waterSet.add(key(x,y)); blocked.add(key(x,y));
}
// bridge north-south
for(let y=9;y<=12;y++){ bridgeSet.add(key(24,y)); waterSet.delete(key(24,y)); blocked.delete(key(24,y)); }

// entities / objects
const npcs=[
  {id:'mina',x:13,y:11,homeX:13,homeY:11,name:'미나',role:'villager',sprite:'mina',scale:1.00,face:'down',moving:false,wait:900,roam:3,dialog:'안녕! 연못 산책 중이었어. 물가에 가면 낚시를 시작할 수 있어.'},
  {id:'thomas',x:11,y:17,homeX:11,homeY:17,name:'토마스',role:'fisherman',sprite:'thomas',scale:1.00,face:'left',moving:false,wait:1400,roam:2,dialog:'낚시는 서두르면 안 돼. 물결을 잘 보면 입질 타이밍이 보여.'},
  {id:'elli',x:18,y:16,homeX:18,homeY:16,name:'엘리',role:'merchant',sprite:'elli',scale:1.00,face:'down',moving:false,wait:1800,roam:2,dialog:'광장에 작은 상점을 열 준비 중이야. 나중엔 잡은 물고기와 재료도 거래할 수 있어.'},
  {id:'noah',x:8,y:12,homeX:8,homeY:12,name:'노아',role:'guide',sprite:'noah',scale:1.00,face:'right',moving:false,wait:2200,roam:3,dialog:'오래된 숲으로 가는 길은 북쪽이야. 아직은 닫혀 있지만 곧 열릴 거야.'},
  {id:'hana',x:16,y:15,homeX:16,homeY:15,name:'하나',role:'florist',sprite:'hana',scale:1.00,face:'left',moving:false,wait:1200,roam:2,dialog:'꽃은 계절마다 분위기가 달라져. 나중엔 꽃다발이나 정원 꾸미기도 할 수 있으면 좋겠어.'},
  {id:'jun',x:6,y:10,homeX:6,homeY:10,name:'준',role:'carpenter',sprite:'jun',scale:1.00,face:'right',moving:false,wait:1600,roam:2,dialog:'다리랑 집을 손보는 중이야. 목재를 모으면 작업대나 가구 제작도 열 수 있을 거야.'}
];
npcs.forEach((n,i)=>{
  n.px=n.x*TILE+TILE/2; n.py=n.y*TILE+TILE/2;
  n.fromX=n.px; n.fromY=n.py; n.toX=n.px; n.toY=n.py;
  n.t=0; n.duration=260; n.stepSeed=i*7+3;
});
const sign={x:18,y:12};
const bench={x:14,y:14};
const lamp={x:16,y:11};
const rocks=[{x:6,y:15},{x:29,y:17},{x:4,y:10}];
const bushes=[
  {x:7,y:9,v:0,s:.82,flip:false},{x:16,y:16,v:1,s:.72,flip:true},{x:30,y:9,v:0,s:.76,flip:true},
  {x:5,y:18,v:1,s:.66,flip:false},{x:13,y:18,v:0,s:.70,flip:false},{x:19,y:4,v:1,s:.64,flip:true}
];
const flowers=[
  {x:15,y:10,v:0,s:.61,flip:false},{x:16,y:10,v:1,s:.55,flip:true},{x:14,y:16,v:1,s:.58,flip:false},
  {x:15,y:16,v:0,s:.52,flip:true},{x:29,y:13,v:1,s:.57,flip:true},{x:9,y:19,v:0,s:.48,flip:false}
];
const grassTufts=[
  {x:8,y:7,s:.38,flip:false},{x:18,y:9,s:.34,flip:true},{x:4,y:16,s:.31,flip:false},
  {x:12,y:6,s:.28,flip:true},{x:28,y:17,s:.35,flip:false},{x:31,y:7,s:.30,flip:true},{x:6,y:20,s:.27,flip:false}
];
const reeds=[
  {x:19,y:7,s:.43,flip:false},{x:19,y:14,s:.39,flip:true},{x:29,y:8,s:.42,flip:true},{x:29,y:13,s:.37,flip:false}
];

// Building Standard 2.0: visual sprite, collision footprint, entrance and art door-anchor are independent.
// A door may sit left / center / right. The PNG is positioned so its real door center aligns to the world door-tile center.
const buildings=[
  {
    id:'home_cottage',name:'파란 지붕 집',sprite:'buildingHome',
    x:4,y:4,w:5,h:4,drawW:300,drawH:293,
    depthLine:4, // local tile offset from y; characters above this line render behind the building
    artAnchor:{doorCenterX:158,groundOffsetY:10},
    entrance:{door:{x:6,y:7},approach:{x:6,y:8},side:'center'},
    interactType:'building',action:'enterHome',
    dialog:'따뜻한 불빛이 새어 나온다. 나중에는 실내 지역으로 연결할 수 있다.'
  },
  {
    id:'carpenter_workshop',name:'준의 작업실',sprite:'buildingWorkshop',
    x:12,y:4,w:6,h:4,drawW:330,drawH:318,
    depthLine:4, // local tile offset from y; characters above this line render behind the building
    artAnchor:{doorCenterX:166,groundOffsetY:10},
    entrance:{door:{x:14,y:7},approach:{x:14,y:8},side:'left'},
    interactType:'workshop',action:'openWorkshop',
    dialog:'목재 냄새가 나는 작업실이다. 제작 기능이 열리면 이곳에서 가구와 도구를 만들 수 있다.'
  }
];
for(const b of buildings){
  for(let x=b.x;x<b.x+b.w;x++) for(let y=b.y;y<b.y+b.h;y++) blocked.add(key(x,y));
}
function buildingAtDoor(x,y){
  return buildings.find(b=>b.entrance.door.x===x && b.entrance.door.y===y) || null;
}
function buildingForPlayerInteraction(){
  const t=facingTile();
  return buildings.find(b=>
    player.x===b.entrance.approach.x && player.y===b.entrance.approach.y &&
    t.x===b.entrance.door.x && t.y===b.entrance.door.y
  ) || null;
}
blocked.add(key(sign.x,sign.y));
rocks.forEach(o=>blocked.add(key(o.x,o.y)));
blocked.add(key(bench.x,bench.y)); blocked.add(key(lamp.x,lamp.y));

// trees: borders and groves
const trees=[];
function addTree(x,y){ if(!inside(x,y))return; trees.push({x,y}); blocked.add(key(x,y)); }
for(let x=1;x<MAP_W-1;x+=2){ if(x<9||x>12) addTree(x,1); if(x<8||x>19) addTree(x,MAP_H-2); }
for(let y=3;y<MAP_H-2;y+=2){ addTree(1,y); if(y<10||y>15) addTree(MAP_W-2,y); }
[[3,3],[3,13],[7,20],[12,20],[31,19],[30,4],[18,3]].forEach(p=>addTree(...p));
