// Visual exploration milestone. These actors do not yet grant combat rewards.
const DUNGEON_REGIONS=Object.freeze([
  {id:'wildwoodHunt',name:'들녘 숲',atlas:null,gate:'huntingGate',palette:['#638a53','#3e6943','#95ab68','#9c8d60','#c0ad7b'],monsters:[['boar','멧돼지'],['deer','사슴'],['fox','여우'],['wolf','늑대'],['bear','곰'],['brak','브락']]},
  {id:'mossVale',name:'이끼 골짜기',atlas:'dungeonMoss',gate:'dungeonMossGate',palette:['#607553','#384b3d','#85956a','#647355','#87936a'],monsters:[['needleRat','니들랫'],['rockTurtle','바위거북'],['slime','슬라임'],['hawk','호크'],['mossGolem','모스골렘'],['torga','토르가']]},
  {id:'rootHollow',name:'뒤엉킨 뿌리굴',atlas:'dungeonRoots',gate:'dungeonRootsGate',palette:['#65543e','#3d3c30','#807252','#65533d','#8a7553'],monsters:[['caveRat','케이브랫'],['viper','바이퍼'],['spider','스파이더'],['fungus','펑거스'],['rootling','루트링'],['lugo','루고']]},
  {id:'ashMine',name:'잿빛 폐광',atlas:'dungeonMine',gate:'dungeonMineGate',palette:['#62646a','#343943','#83858a','#55565c','#858385'],monsters:[['caveBat','케이브뱃'],['oreBeetle','오어비틀'],['skullMiner','스컬마이너'],['mineCrab','마인크랩'],['rockmaw','록마울'],['grunn','그룬']]},
  {id:'mistfen',name:'독안개 습지',atlas:'dungeonSwamp',gate:'dungeonSwampGate',palette:['#586454','#303f37','#728064','#53614a','#7a8061'],monsters:[['mudSlime','머드슬라임'],['toad','토드'],['boa','보아'],['croc','크록'],['heron','왜가리'],['mogra','모그라']]},
  {id:'redrockGorge',name:'붉은바위 협곡',atlas:'dungeonRedrock',gate:'dungeonRedrockGate',palette:['#a27751','#644a3c','#bc9162','#946b4b','#c79e6e'],monsters:[['scorpion','스콜피온'],['scarab','스카랍'],['rockLizard','록리자드'],['goblin','고블린'],['armadillo','아르마딜로'],['vask','바스크']]},
  {id:'frostfangCave',name:'서리송곳 산굴',atlas:'dungeonFrost',gate:'dungeonFrostGate',palette:['#a6bdc4','#485f70','#c5d7d9','#849ba8','#d0dfe0'],monsters:[['snowHare','북극토끼'],['snowFox','북극여우'],['iceBat','아이스뱃'],['yeti','예티'],['iceCrab','아이스크랩'],['vorn','보른']]},
  {id:'silentGraveyard',name:'고요한 묘지',atlas:'dungeonGrave',gate:'dungeonGraveGate',palette:['#68716a','#353d3c','#858e7f','#626b61','#8d9482'],monsters:[['skeleton','스켈레톤'],['boneArcher','본아처'],['raven','레이븐'],['ghoul','구울'],['digger','디거'],['karden','카르덴']]},
  {id:'forgottenShrine',name:'잊힌 성소',atlas:'dungeonShrine',gate:'dungeonShrineGate',palette:['#929487','#51594f','#b7b5a0','#838777','#b9b69d'],monsters:[['sentinel','센티널'],['mimic','미믹'],['bellguard','벨가드'],['gargoyle','가고일'],['templar','템플러'],['valrok','발록']]},
  {id:'stargraveRuins',name:'별무덤 유적',atlas:'dungeonStargrave',gate:'dungeonStargraveGate',palette:['#68697e','#353849','#8d8ca0','#626175','#9991a7'],monsters:[['shardling','샤들링'],['stalker','스토커'],['shardGolem','샤드골렘'],['shardhorn','샤드혼'],['ironGuard','아이언가드'],['orkan','오르칸']]}
].map(region=>Object.freeze({...region,monsters:Object.freeze(region.monsters.map(([id,name],frame)=>Object.freeze({id,name,frame,boss:frame===5})))})));
// Visual status only: these colors do not grant attacks, damage or rewards.
const DUNGEON_BOSS_AURA_COLORS=Object.freeze({brak:'#e6b96b',torga:'#bedb7a',lugo:'#8ed09a',grunn:'#e0ad71',
  mogra:'#83cec0',vask:'#ecaa74',vorn:'#a8e5fa',karden:'#c7b9e5',valrok:'#efdb95',orkan:'#bbacfa'});

function dungeonDoor(x,y,to,entry,label,image){return {x,y,to,entry,label,image,dungeonDoor:true};}
function dungeonDoorSolids(doors){
  return doors.flatMap(({x,y})=>{
    const points=[];
    for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=0;dy++)if(dy<0||dx!==0)points.push({x:x+dx,y:y+dy});
    return points;
  });
}
function dungeonWalls(floors){
  const open=(x,y)=>floors.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h&&
    !(r.cutCorners&&(x===r.x||x===r.x+r.w-1)&&(y===r.y||y===r.y+r.h-1)));
  const walls=[];
  for(let y=1;y<47;y++)for(let x=1;x<63;){
    if(open(x,y)){x++;continue;}
    const start=x;while(x<63&&!open(x,y))x++;
    walls.push({x:start,y,w:x-start,h:1});
  }
  return walls;
}
const DUNGEON_HUB_DOORS=Object.freeze(DUNGEON_REGIONS.map((r,i)=>dungeonDoor(12+(i%5)*10,i<5?13:30,r.id,
  r.id==='wildwoodHunt'?{x:12,y:14,face:'down'}:{x:32,y:11,face:'down'},r.name,r.gate)));
function dungeonBase(id,name,palette,floors){
  const [ground,patchA,patchB,pathRim,pathCore]=palette;
  return {id,name,tileSize:48,width:64,height:48,dungeonPreview:true,
    terrain:{ground,patchA,patchB,pathRim,pathCore,dungeonWalls:true,ridges:dungeonWalls(floors)},
    playerSpawn:{x:32,y:39,face:'up'},paths:[],stoneAreas:[],waterAreas:[],bridges:[],
    fishingSpot:null,npcs:[],buildings:[],fixedObjects:{},decorations:{},treeLines:[],trees:[],farmPlots:[]};
}
const DUNGEON_WORLD_DEFINITIONS=Object.freeze(Object.fromEntries([
  ['dungeonCrossroads',(()=>{
    const doors=[...DUNGEON_HUB_DOORS,dungeonDoor(8,24,'lilacVillage',{x:48,y:37,face:'down'},'라일락 마을','huntingGate')];
    const floors=[{x:9,y:14,w:47,h:5},{x:9,y:31,w:47,h:5},{x:30,y:15,w:5,h:20},{x:6,y:25,w:7,h:10},
      ...doors.map(d=>({x:d.x-3,y:d.y-3,w:7,h:8}))];
    const map=dungeonBase('dungeonCrossroads','던전 갈림길',['#7a806b','#3e4c42','#9b9d81','#767b62','#a1a283'],floors);
    return Object.freeze({...map,playerSpawn:{x:8,y:27,face:'down'},paths:[{x1:12,y1:16,x2:52,y2:16},{x1:8,y1:33,x2:52,y2:33},
      {x1:32,y1:16,x2:32,y2:33},{x1:8,y1:24,x2:8,y2:33}],
      dungeonDoors:doors,dungeonSolids:dungeonDoorSolids(doors),dungeonMonsters:[],exits:doors});
  })()],
  ...DUNGEON_REGIONS.slice(1).map((region,index)=>{
    const floors=[{x:7,y:7,w:15,h:13,cutCorners:true},{x:25,y:6,w:15,h:14,cutCorners:true},{x:43,y:7,w:15,h:13,cutCorners:true},
      {x:7,y:27,w:15,h:12,cutCorners:true},{x:25,y:27,w:15,h:13,cutCorners:true},{x:43,y:27,w:15,h:12,cutCorners:true},
      {x:13,y:21,w:39,h:5},{x:13,y:14,w:3,h:21},{x:31,y:14,w:3,h:30},{x:49,y:14,w:3,h:21}];
    const map=dungeonBase(region.id,region.name,region.palette,floors),hubDoor=DUNGEON_HUB_DOORS[index+1];
    const door=dungeonDoor(32,8,'dungeonCrossroads',{x:hubDoor.x,y:hubDoor.y+3,face:'down'},'던전 갈림길',region.gate);
    const centers=[[14,33],[32,33],[50,33],[14,13],[32,13],[50,13]];
    const monsters=region.monsters.flatMap((monster,i)=>{
      const [cx,cy]=centers[i];return (monster.boss?[0]:[-2,2]).map((offset,n)=>({...monster,
        instanceId:region.id+'_'+monster.id+'_'+n,x:cx+offset,y:cy,atlas:region.atlas,size:monster.boss?168:104}));
    });
    return [region.id,Object.freeze({...map,playerSpawn:{x:32,y:11,face:'down'},paths:[{x1:14,y1:23,x2:50,y2:23},
      ...[14,32,50].map(x=>({x1:x,y1:13,x2:x,y2:33})),{x1:32,y1:8,x2:32,y2:13}],
      dungeonDoors:[door],dungeonSolids:dungeonDoorSolids([door]),dungeonMonsters:monsters,exits:[door]})];
  })
]));
function attachDungeonPreview(definition){
  if(definition.id==='lilacVillage')return Object.freeze({...definition,huntingGate:{...definition.huntingGate,to:'dungeonCrossroads',label:'던전 입구'}});
  if(definition.id!=='wildwoodHunt')return definition;
  const hubDoor=DUNGEON_HUB_DOORS[0];
  const door=dungeonDoor(12,11,'dungeonCrossroads',{x:hubDoor.x,y:hubDoor.y+3,face:'down'},'던전 갈림길','huntingGate');
  return Object.freeze({...definition,playerSpawn:{x:12,y:14,face:'down'},
    dungeonMonsters:[{id:'brak',name:'브락',boss:true,instanceId:'wildwood_brak',x:44,y:12,atlas:'dungeonBrak',frame:0,size:168,fourDirections:true}],
    dungeonDoors:[door],dungeonSolids:dungeonDoorSolids([door]),exits:[door]});
}
