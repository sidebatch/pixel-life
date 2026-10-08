const VILLAGE_WORLD_DEFINITION=WORLD_DEFINITION;
const FOREST_WOOD=Object.freeze({
  oak:'참나무',pine:'소나무',birch:'자작나무',maple:'단풍나무',spruce:'가문비나무',
  willow:'버드나무',cypress:'편백나무',broadleaf:'활엽수',paulownia:'오동나무',cedar:'삼나무',
  ginkgo:'은행나무',larch:'낙엽송',cherry:'벚나무',chestnut:'밤나무',walnut:'호두나무',zelkova:'느티나무',
  ash:'물푸레나무',teak:'티크',mahogany:'마호가니',mango:'망고나무',
  baobab:'바오밥',sequoia:'세쿼이아',black_locust:'아까시나무',hickory:'히코리',eucalyptus:'유칼립투스',
  olive:'올리브나무',purpleheart:'퍼플하트',jatoba:'자토바',spotted_gum:'스포티드검',ironbark:'아이언바크',
  cumaru:'쿠마루',ipe:'이페',quebracho:'케브라초',african_blackwood:'아프리칸 블랙우드',lignum_vitae:'리그넘바이테',
  ancient_zelkova:'고대 느티나무',amber_cedar:'호박삼나무',silverbark:'은피나무',spiralwood:'나선목',moonshade:'달그늘나무',
  spirit_ancient:'정령고목',starlight_tree:'별빛나무',moonveil:'달장막나무',crystal_leaf:'수정잎나무',whisperwood:'속삭임나무',
  origin_tree:'시원의 나무',primal_ancient:'태초고목',worldroot:'세계뿌리나무',dawncore:'여명목',abysswood:'심연목'
});
const FOREST_SPECIES=Object.freeze(Object.keys(FOREST_WOOD));
// Keep the species of every pre-existing generated tree stable for old saves.
const FOREST_LEGACY_STARTER_SPECIES=Object.freeze(['oak','pine','birch']);
const FOREST_LEGACY_DEEP_SPECIES=Object.freeze(['maple','spruce','willow','cypress','broadleaf']);
const FOREST_TIER_REGION_SPECIES=Object.freeze({
  forestSix:Object.freeze(['oak','ash','teak','mahogany','mango']),
  forestSeven:Object.freeze(['baobab','sequoia','black_locust','hickory','eucalyptus']),
  forestEight:Object.freeze(['olive','purpleheart','jatoba','spotted_gum','ironbark']),
  forestNine:Object.freeze(['cumaru','ipe','quebracho','african_blackwood','lignum_vitae']),
  forestTen:Object.freeze(['ancient_zelkova','amber_cedar','silverbark','spiralwood','moonshade']),
  forestEleven:Object.freeze(['spirit_ancient','starlight_tree','moonveil','crystal_leaf','whisperwood']),
  forestTwelve:Object.freeze(['origin_tree','primal_ancient','worldroot','dawncore','abysswood'])
});
const FOREST_REGION_SPECIES=Object.freeze({
  oldForest:Object.freeze([...FOREST_LEGACY_STARTER_SPECIES,'paulownia','cedar']),
  deepForest:Object.freeze([...FOREST_LEGACY_DEEP_SPECIES,'ginkgo','larch','cherry','chestnut','walnut','zelkova']),
  forestThree:Object.freeze(FOREST_SPECIES),
  forestFour:Object.freeze(FOREST_SPECIES),
  forestFive:Object.freeze(FOREST_SPECIES),
  ...FOREST_TIER_REGION_SPECIES
});
const forestTreeId=(x,y,regionId='oldForest')=>`${regionId==='deepForest'?'deep_forest':regionId==='oldForest'?'forest':regionId}_tree_${x}_${y}`;
const forestTreeSpecies=(x,y,regionId='oldForest')=>{
  // A species has the same tool requirement in every region. Forest 1-2
  // retains starter species near its entrance, then adds stronger species.
  const laterForestSpecies={
    forestThree:y>=31?['oak','pine','birch','paulownia','cedar']:y>=16?['maple','spruce','willow','ginkgo','larch','cherry']:['cypress','broadleaf','chestnut','walnut','zelkova'],
    forestFour:y>=35?['oak','pine','cedar']:y>=23?['maple','spruce','willow','ginkgo','larch','cherry']:['cypress','broadleaf','chestnut','walnut','zelkova'],
    forestFive:y>=39?['oak','birch','cedar']:y>=30?['maple','larch','cherry']:['cypress','broadleaf','chestnut','walnut','zelkova']
  };
  const species=FOREST_TIER_REGION_SPECIES[regionId]||(regionId==='deepForest'?
    (y>=32?FOREST_LEGACY_STARTER_SPECIES:y>=24?FOREST_LEGACY_DEEP_SPECIES.slice(0,3):FOREST_LEGACY_DEEP_SPECIES.slice(3)):
    (regionId==='oldForest'?FOREST_LEGACY_STARTER_SPECIES:laterForestSpecies[regionId]||FOREST_SPECIES));
  return species[Math.abs(x*17+y*31)%species.length];
};
// Fixed coordinates make groves reproducible across visits and saved tree states.
function forestGroveTrees(regionId){
  const groves=[];
  for(const [fromX,toX] of [[5,20],[29,36],[49,59]]){
    for(let x=fromX;x<=toX;x+=3) for(let y=5+(x%2);y<=42;y+=4){
      if((x*7+y*11)%7===0) continue;
      if(x>=16&&x<=36&&y>=29&&y<=36) continue;
      if(x>=23&&x<=27) continue;
      if(x>=29&&x<=33&&y>=18&&y<=35) continue;
      if(x>=35&&x<=49&&y>=5&&y<=39) continue;
      groves.push({x,y,species:forestTreeSpecies(x,y,regionId)});
    }
  }
  return groves;
}
// Extra trees are appended after legacy groves, so old coordinates/IDs keep their saved state.
function forestInfillTrees(regionId,waterAreas=[]){
  const extras=[];
  for(let x=7;x<=59;x+=4) for(let y=8+(x%3);y<=41;y+=5){
    if(x>=23&&x<=27) continue;
    if(waterAreas.some(area=>x>=area.x-2&&x<area.x+area.w+2&&y>=area.y-2&&y<area.y+area.h+2)) continue;
    extras.push({id:`${regionId}_infill_${x}_${y}`,x,y,species:forestTreeSpecies(x,y,regionId)});
  }
  return extras;
}
const FOREST_ROUTE_IDS=Object.freeze(['deepForest','forestThree','forestFour','forestFive','forestSix','forestSeven','forestEight','forestNine','forestTen','forestEleven','forestTwelve']);
const FOREST_ROUTE_LABELS=Object.freeze({
  deepForest:'숲 1-2',forestThree:'숲 1-3',forestFour:'숲 1-4',forestFive:'숲 1-5',
  forestSix:'거목 숲',forestSeven:'붉은 거목림',forestEight:'은빛 경목림',forestNine:'검은 경목림',
  forestTen:'고대 숲',forestEleven:'정령 숲',forestTwelve:'태초 숲'
});
const FOREST_REGION_NAMES=Object.freeze({
  forestSix:'거목 숲 2-1',forestSeven:'붉은 거목림 2-2',forestEight:'은빛 경목림 2-3',
  forestNine:'검은 경목림 2-4',forestTen:'고대 숲 3-1',forestEleven:'정령 숲 3-2',forestTwelve:'태초 숲 3-3'
});
function forestFrontierExits(id){
  const index=FOREST_ROUTE_IDS.indexOf(id),previous=FOREST_ROUTE_IDS[index-1],next=FOREST_ROUTE_IDS[index+1];
  return [
    ...(next?[{x:25,y:1,to:next,entry:{x:25,y:44,face:'up'},label:FOREST_ROUTE_LABELS[next]}]:[]),
    {x:25,y:46,to:previous,entry:{x:25,y:3,face:'down'},label:FOREST_ROUTE_LABELS[previous]}
  ];
}
const forestNearSegment=(x,y,segment,padding=1)=>x>=Math.min(segment.x1,segment.x2)-padding&&
  x<=Math.max(segment.x1,segment.x2)+padding&&y>=Math.min(segment.y1,segment.y2)-padding&&
  y<=Math.max(segment.y1,segment.y2)+padding;
const forestNearArea=(x,y,area,padding=1)=>x>=area.x-padding&&x<area.x+area.w+padding&&
  y>=area.y-padding&&y<area.y+area.h+padding;
function forestTierTrees(regionId,layout){
  const species=FOREST_TIER_REGION_SPECIES[regionId],pattern=layout.treePattern||{};
  const trees=[],used=new Set(),areas=[...(layout.waterAreas||[]),...(layout.stoneAreas||[])];
  const available=(x,y)=>x>=3&&x<=60&&y>=3&&y<=44&&!used.has(`${x},${y}`)&&
    !layout.paths.some(path=>forestNearSegment(x,y,path,1))&&!areas.some(area=>forestNearArea(x,y,area,1));
  const add=(x,y,wood)=>{if(!available(x,y))return false;used.add(`${x},${y}`);trees.push({id:`${regionId}_tier_${x}_${y}`,x,y,species:wood});return true;};
  const xStart=pattern.xStart||5,yStart=pattern.yStart||5,xStep=pattern.xStep||4,yStep=pattern.yStep||4;
  const seed=pattern.seed||0,skipModulo=pattern.skipModulo||9;
  for(let x=xStart;x<=59;x+=xStep)for(let y=yStart+((x+seed)%2);y<=43;y+=yStep){
    if((x*11+y*7+seed)%skipModulo===0)continue;
    add(x,y,species[Math.abs(x*13+y*29+seed)%species.length]);
  }
  // Guarantee that all five species appear even when a layout removes many grid points.
  for(let index=0;index<species.length;index++)if(!trees.some(tree=>tree.species===species[index])){
    for(let y=4;y<=43;y++)for(let x=4;x<=59;x++)if(add(x,y,species[index])){y=44;break;}
  }
  return trees;
}
function forestFrontierRegion(id,number,layout){
  const {paths,waterAreas,fishingSpot,rocks,terrain}=layout;
  const fishingWaterAreas=waterAreas.map(area=>Object.freeze({...area,fishingHabitat:area.fishingHabitat||'river'}));
  return Object.freeze({
    id,name:FOREST_REGION_NAMES[id]||`오래된 숲 1-${number}`,tileSize:48,width:64,height:48,
    playerSpawn:{x:25,y:44,face:'up'},
    paths,terrain,
    stoneAreas:layout.stoneAreas||[],waterAreas:fishingWaterAreas,bridges:layout.bridges||[],fishingSpot,npcs:[],fixedObjects:{rocks},
    decorations:layout.decorations||{
      bushes:[{x:18,y:36,v:0,s:.8},{x:34,y:38,v:1,s:.85},{x:53,y:33,v:0,s:.8}],
      flowers:[{x:22,y:30,v:1,s:.56},{x:32,y:25,v:0,s:.55}],
      grassTufts:[{x:20,y:40,s:.38},{x:30,y:35,s:.36}],
      reeds:[{x:fishingSpot.x+1,y:fishingSpot.y+3,s:.44}]
    },buildings:[],
    treeLines:[
      {axis:'x',from:1,to:62,step:2,fixed:1,gaps:[[23,27]]},
      {axis:'x',from:1,to:62,step:2,fixed:46,gaps:[[23,27]]},
      {axis:'y',from:3,to:44,step:2,fixed:1,gaps:[]},
      {axis:'y',from:3,to:44,step:2,fixed:62,gaps:[]}
    ],
    trees:FOREST_TIER_REGION_SPECIES[id]?forestTierTrees(id,layout):[...forestGroveTrees(id),...forestInfillTrees(id,fishingWaterAreas)],
    farmPlots:[],exits:forestFrontierExits(id)
  });
}
const REGION_WORLDS=Object.freeze({
  lilacVillage:VILLAGE_WORLD_DEFINITION,
  oldForest:Object.freeze({
    id:'oldForest',name:'오래된 숲 1-1',tileSize:48,width:64,height:48,
    terrain:{ground:'#609a5b',patchA:'#2e7846',patchB:'#b4d969',pathRim:'#bd9558',pathCore:'#d9b36c'},
    playerSpawn:{x:25,y:44,face:'up'},
    paths:[
      {x1:25,y1:2,x2:25,y2:46},{x1:17,y1:34,x2:35,y2:34},
      {x1:25,y1:20,x2:39,y2:20},{x1:18,y1:27,x2:25,y2:27},
      {x1:31,y1:20,x2:31,y2:34}
    ],
    stoneAreas:[],waterAreas:[
      {id:'forest_stream',x:40,y:7,w:8,h:30,cutCorners:true,fishingHabitat:'river'},
      {id:'forest_pool',x:37,y:21,w:4,h:9,cutCorners:true,fishingHabitat:'river'}
    ],bridges:[],fishingSpot:{x:40,y:20},
    npcs:[],fixedObjects:{rocks:[{x:35,y:29},{x:19,y:36},{x:50,y:39}]},
    decorations:{
      bushes:[{x:21,y:35,v:0,s:.75},{x:29,y:37,v:1,s:.8},{x:36,y:17,v:0,s:.7}],
      flowers:[{x:28,y:33,v:1,s:.58},{x:33,y:19,v:0,s:.54}],
      grassTufts:[{x:22,y:39,s:.35},{x:27,y:29,s:.38},{x:32,y:25,s:.34}],
      reeds:[{x:39,y:16,s:.43},{x:48,y:26,s:.4},{x:40,y:34,s:.38}]
    },buildings:[],
    treeLines:[
      {axis:'x',from:1,to:62,step:2,fixed:1,gaps:[[23,27]]},
      {axis:'x',from:1,to:62,step:2,fixed:46,gaps:[[23,27]]},
      {axis:'y',from:3,to:44,step:2,fixed:1,gaps:[[22,26]]},
      {axis:'y',from:3,to:44,step:2,fixed:62,gaps:[]}
    ],
    trees:[
      {x:15,y:16,species:'oak'},{x:19,y:12,species:'pine'},{x:23,y:15,species:'birch'},
      {x:29,y:12,species:'oak'},{x:33,y:16,species:'pine'},
      {x:15,y:21,species:'birch'},{x:20,y:19,species:'oak'},{x:29,y:22,species:'pine'},
      {x:34,y:25,species:'oak'},{x:17,y:32,species:'pine'},
      {x:36,y:32,species:'birch'},{x:16,y:39,species:'oak'},
      {x:30,y:40,species:'pine'},{x:33,y:42,species:'birch'},
      {x:50,y:17,species:'oak'},{x:53,y:23,species:'pine'},
      {x:51,y:31,species:'oak'},{x:55,y:37,species:'pine'},
      {id:'forest_tree_01',x:23,y:39,species:'oak',interactable:true},
      {id:'forest_tree_02',x:28,y:38,species:'pine',interactable:true},
      {id:'forest_tree_03',x:22,y:33,species:'birch',interactable:true},
      {id:'forest_tree_04',x:28,y:30,species:'oak',interactable:true},
      {id:'forest_tree_05',x:20,y:26,species:'pine',interactable:true},
      {id:'forest_tree_06',x:34,y:22,species:'birch',interactable:true},
      {id:'forest_tree_07',x:33,y:18,species:'oak',interactable:true},
      {id:'forest_tree_08',x:21,y:17,species:'pine',interactable:true},
      // New IDs/tiles preserve every existing tree's saved HP and respawn state.
      {id:'forest_tier1_paulownia_01',x:13,y:37,species:'paulownia'},
      {id:'forest_tier1_paulownia_02',x:18,y:38,species:'paulownia'},
      {id:'forest_tier1_paulownia_03',x:30,y:37,species:'paulownia'},
      {id:'forest_tier1_cedar_01',x:33,y:39,species:'cedar'},
      {id:'forest_tier1_cedar_02',x:36,y:37,species:'cedar'},
      {id:'forest_tier1_cedar_03',x:53,y:39,species:'cedar'},
      ...forestGroveTrees('oldForest'),
      ...forestInfillTrees('oldForest',[{x:40,y:7,w:8,h:30},{x:37,y:21,w:4,h:9}])
    ],
    farmPlots:[],exits:[
      {x:25,y:1,to:'deepForest',entry:{x:25,y:44,face:'up'},label:'숲 1-2'},
      {x:25,y:46,to:'lilacVillage',entry:{x:25,y:3,face:'down'},label:'마을로'},
      {x:1,y:24,to:'mountainLake',entry:{x:60,y:24,face:'left'},label:'산악 호수'}
    ]
  }),
  deepForest:Object.freeze({
    id:'deepForest',name:'오래된 숲 1-2',tileSize:48,width:64,height:48,
    terrain:{ground:'#4e805a',patchA:'#275d4c',patchB:'#8fb678',pathRim:'#8d7956',pathCore:'#b49a6a',
      hills:[{x:7,y:7,w:13,h:13},{x:46,y:30,w:12,h:11}]},
    playerSpawn:{x:25,y:44,face:'up'},
    paths:[
      {x1:25,y1:2,x2:25,y2:46},{x1:15,y1:31,x2:35,y2:31},
      {x1:25,y1:17,x2:39,y2:17},{x1:31,y1:17,x2:31,y2:31}
    ],
    stoneAreas:[],waterAreas:[
      {id:'deep_forest_stream',x:40,y:7,w:8,h:30,cutCorners:true,fishingHabitat:'river'},
      {id:'deep_forest_pool',x:37,y:19,w:4,h:9,cutCorners:true,fishingHabitat:'river'}
    ],bridges:[],fishingSpot:{x:40,y:17},
    npcs:[],fixedObjects:{rocks:[{x:35,y:27},{x:20,y:37},{x:52,y:38}]},
    decorations:{
      bushes:[{x:20,y:34,v:0,s:.8},{x:34,y:36,v:1,s:.8}],
      flowers:[{x:29,y:29,v:1,s:.55},{x:53,y:20,v:0,s:.54}],
      grassTufts:[{x:22,y:39,s:.38},{x:28,y:37,s:.36}],
      reeds:[{x:39,y:13,s:.43},{x:48,y:28,s:.4}]
    },buildings:[],
    treeLines:[
      {axis:'x',from:1,to:62,step:2,fixed:1,gaps:[[23,27]]},
      {axis:'x',from:1,to:62,step:2,fixed:46,gaps:[[23,27]]},
      {axis:'y',from:3,to:44,step:2,fixed:1,gaps:[]},
      {axis:'y',from:3,to:44,step:2,fixed:62,gaps:[]}
    ],
    trees:[
      {x:22,y:39,species:'oak'},{x:28,y:38,species:'pine'},
      {x:21,y:26,species:'willow'},{x:28,y:28,species:'spruce'},{x:34,y:23,species:'cypress'},
      {x:19,y:16,species:'broadleaf'},{x:53,y:23,species:'maple'},
      // Tier-2 additions use new IDs so old grove species and saved HP remain stable.
      {id:'deep_forest_tier2_ginkgo_01',x:18,y:28,species:'ginkgo'},
      {id:'deep_forest_tier2_ginkgo_02',x:32,y:29,species:'ginkgo'},
      {id:'deep_forest_tier2_ginkgo_03',x:51,y:27,species:'ginkgo'},
      {id:'deep_forest_tier2_larch_01',x:29,y:27,species:'larch'},
      {id:'deep_forest_tier2_larch_02',x:35,y:29,species:'larch'},
      {id:'deep_forest_tier2_larch_03',x:55,y:29,species:'larch'},
      {id:'deep_forest_tier2_cherry_01',x:21,y:29,species:'cherry'},
      {id:'deep_forest_tier2_cherry_02',x:18,y:24,species:'cherry'},
      {id:'deep_forest_tier2_cherry_03',x:55,y:24,species:'cherry'},
      // Tier-3 trees occupy new northern tiles; existing tree IDs/species stay stable.
      {id:'deep_forest_tier3_chestnut_01',x:11,y:15,species:'chestnut'},
      {id:'deep_forest_tier3_chestnut_02',x:37,y:9,species:'chestnut'},
      {id:'deep_forest_tier3_chestnut_03',x:50,y:15,species:'chestnut'},
      {id:'deep_forest_tier3_walnut_01',x:21,y:21,species:'walnut'},
      {id:'deep_forest_tier3_walnut_02',x:36,y:15,species:'walnut'},
      {id:'deep_forest_tier3_walnut_03',x:55,y:15,species:'walnut'},
      {id:'deep_forest_tier3_zelkova_01',x:8,y:21,species:'zelkova'},
      {id:'deep_forest_tier3_zelkova_02',x:28,y:15,species:'zelkova'},
      {id:'deep_forest_tier3_zelkova_03',x:49,y:21,species:'zelkova'},
      ...forestGroveTrees('deepForest'),
      ...forestInfillTrees('deepForest',[{x:40,y:7,w:8,h:30},{x:37,y:19,w:4,h:9}])
    ],
    farmPlots:[],exits:[
      {x:25,y:1,to:'forestThree',entry:{x:25,y:44,face:'up'},label:'숲 1-3'},
      {x:25,y:46,to:'oldForest',entry:{x:25,y:3,face:'down'},label:'숲 1-1'}
    ]
  }),
  forestThree:forestFrontierRegion('forestThree',3,{
    terrain:{ground:'#497f70',patchA:'#245f62',patchB:'#8ab99a',pathRim:'#907955',pathCore:'#b9a078',
      hills:[{x:6,y:7,w:13,h:17},{x:48,y:32,w:11,h:10}]},
    paths:[{x1:25,y1:38,x2:25,y2:46},{x1:25,y1:38,x2:31,y2:38},
      {x1:31,y1:25,x2:31,y2:38},{x1:25,y1:25,x2:31,y2:25},
      {x1:25,y1:15,x2:25,y2:25},{x1:25,y1:15,x2:29,y2:15},
      {x1:29,y1:7,x2:29,y2:15},{x1:25,y1:7,x2:29,y2:7},{x1:25,y1:1,x2:25,y2:7},
      {x1:31,y1:20,x2:41,y2:20},{x1:14,y1:33,x2:31,y2:33}],
    waterAreas:[{id:'gorge_upper',x:45,y:5,w:7,h:9,cutCorners:true},
      {id:'gorge_bend',x:42,y:13,w:9,h:11,cutCorners:true},
      {id:'gorge_lower',x:45,y:24,w:8,h:12,cutCorners:true}],
    fishingSpot:{x:42,y:20},rocks:[{x:36,y:28},{x:18,y:39},{x:55,y:38}]
  }),
  forestFour:forestFrontierRegion('forestFour',4,{
    terrain:{ground:'#718a50',patchA:'#456b3c',patchB:'#c4bd72',pathRim:'#927652',pathCore:'#c6a779',
      hills:[{x:34,y:6,w:22,h:21},{x:5,y:34,w:13,h:9}]},
    paths:[{x1:25,y1:37,x2:25,y2:46},{x1:25,y1:37,x2:30,y2:37},
      {x1:30,y1:25,x2:30,y2:37},{x1:25,y1:25,x2:30,y2:25},
      {x1:25,y1:1,x2:25,y2:25},{x1:20,y1:20,x2:25,y2:20},
      {x1:30,y1:30,x2:47,y2:30},{x1:25,y1:12,x2:34,y2:12}],
    waterAreas:[{id:'ridge_lake_main',x:10,y:11,w:11,h:19,cutCorners:true},
      {id:'ridge_lake_cove',x:8,y:20,w:8,h:12,cutCorners:true}],
    fishingSpot:{x:20,y:20},rocks:[{x:32,y:17},{x:21,y:39},{x:51,y:30}]
  }),
  forestFive:forestFrontierRegion('forestFive',5,{
    terrain:{ground:'#3b695b',patchA:'#1e514c',patchB:'#80a57b',pathRim:'#766851',pathCore:'#ab966f',
      hills:[{x:37,y:4,w:19,h:12},{x:5,y:8,w:15,h:15}],
      waterfalls:[{x:43,y:10,w:5,h:5}]},
    paths:[{x1:25,y1:38,x2:25,y2:46},{x1:20,y1:38,x2:25,y2:38},
      {x1:20,y1:23,x2:20,y2:38},{x1:20,y1:23,x2:29,y2:23},
      {x1:29,y1:11,x2:29,y2:23},{x1:25,y1:11,x2:29,y2:11},
      {x1:25,y1:1,x2:25,y2:11},{x1:29,y1:19,x2:39,y2:19},
      {x1:18,y1:29,x2:20,y2:29}],
    waterAreas:[{id:'falls_upper',x:42,y:6,w:7,h:6,cutCorners:true},
      {id:'falls_drop',x:43,y:11,w:5,h:5},
      {id:'falls_lower',x:39,y:15,w:12,h:12,cutCorners:true},
      {id:'deep_mirror_pool',x:9,y:27,w:9,h:9,cutCorners:true}],
    fishingSpot:{x:39,y:19},rocks:[{x:34,y:30},{x:20,y:36},{x:54,y:27}]
  }),
  forestSix:forestFrontierRegion('forestSix',6,{
    terrain:{ground:'#68734a',patchA:'#3f5d36',patchB:'#b99b5c',pathRim:'#765d3f',pathCore:'#b58a58',
      hills:[{x:5,y:7,w:14,h:27},{x:48,y:30,w:11,h:12}]},
    paths:[{x1:25,y1:39,x2:25,y2:46},{x1:25,y1:39,x2:34,y2:39},
      {x1:34,y1:30,x2:34,y2:39},{x1:25,y1:30,x2:34,y2:30},{x1:25,y1:20,x2:25,y2:30},
      {x1:18,y1:20,x2:25,y2:20},{x1:18,y1:10,x2:18,y2:20},{x1:18,y1:10,x2:25,y2:10},
      {x1:25,y1:1,x2:25,y2:10},{x1:34,y1:24,x2:41,y2:24}],
    stoneAreas:[{x:29,y:34,w:8,h:4}],
    waterAreas:[{id:'giant_canopy_lake',x:42,y:10,w:10,h:18,cutCorners:true},
      {id:'giant_canopy_cove',x:48,y:27,w:7,h:9,cutCorners:true}],
    fishingSpot:{x:42,y:24},rocks:[{x:11,y:36},{x:39,y:17},{x:56,y:39}],
    treePattern:{xStart:4,yStart:5,xStep:4,yStep:4,seed:6,skipModulo:8}
  }),
  forestSeven:forestFrontierRegion('forestSeven',7,{
    terrain:{ground:'#9b7849',patchA:'#6a4f35',patchB:'#d1ad65',pathRim:'#755237',pathCore:'#c9965f',
      hills:[{x:4,y:5,w:18,h:12},{x:36,y:8,w:23,h:17},{x:5,y:38,w:14,h:7}]},
    paths:[{x1:25,y1:36,x2:25,y2:46},{x1:15,y1:36,x2:25,y2:36},{x1:15,y1:27,x2:15,y2:36},
      {x1:15,y1:27,x2:30,y2:27},{x1:30,y1:17,x2:30,y2:27},{x1:25,y1:17,x2:30,y2:17},
      {x1:25,y1:1,x2:25,y2:17},{x1:30,y1:31,x2:44,y2:31},{x1:15,y1:22,x2:21,y2:22}],
    stoneAreas:[{x:20,y:12,w:10,h:5}],
    waterAreas:[{id:'red_grove_oasis_west',x:7,y:8,w:9,h:9,cutCorners:true},
      {id:'red_grove_oasis_east',x:45,y:27,w:10,h:9,cutCorners:true}],
    fishingSpot:{x:45,y:31},rocks:[{x:9,y:25},{x:37,y:34},{x:55,y:18}],
    treePattern:{xStart:5,yStart:4,xStep:5,yStep:3,seed:13,skipModulo:10}
  }),
  forestEight:forestFrontierRegion('forestEight',8,{
    terrain:{ground:'#566c65',patchA:'#314e4d',patchB:'#9aa98c',pathRim:'#71675c',pathCore:'#aaa08f',
      hills:[{x:5,y:25,w:16,h:17},{x:47,y:5,w:12,h:16}]},
    paths:[{x1:25,y1:40,x2:25,y2:46},{x1:25,y1:40,x2:36,y2:40},{x1:36,y1:31,x2:36,y2:40},
      {x1:27,y1:31,x2:36,y2:31},{x1:27,y1:22,x2:27,y2:31},{x1:18,y1:22,x2:27,y2:22},
      {x1:18,y1:13,x2:18,y2:22},{x1:18,y1:13,x2:25,y2:13},{x1:25,y1:1,x2:25,y2:13},
      {x1:27,y1:26,x2:40,y2:26}],
    stoneAreas:[{x:8,y:28,w:10,h:9,cutCorners:true}],
    waterAreas:[{id:'silver_ravine',x:41,y:6,w:6,h:30,cutCorners:true},
      {id:'silver_ravine_pool',x:45,y:29,w:10,h:9,cutCorners:true}],
    fishingSpot:{x:41,y:26},rocks:[{x:12,y:20},{x:33,y:16},{x:55,y:41}],
    treePattern:{xStart:4,yStart:6,xStep:3,yStep:5,seed:21,skipModulo:11}
  }),
  forestNine:forestFrontierRegion('forestNine',9,{
    terrain:{ground:'#3b4a40',patchA:'#202f2b',patchB:'#747456',pathRim:'#51473d',pathCore:'#827565',
      hills:[{x:31,y:5,w:27,h:16},{x:4,y:30,w:18,h:13}]},
    paths:[{x1:25,y1:37,x2:25,y2:46},{x1:25,y1:37,x2:35,y2:37},{x1:35,y1:28,x2:35,y2:37},
      {x1:25,y1:28,x2:35,y2:28},{x1:25,y1:19,x2:25,y2:28},{x1:20,y1:19,x2:25,y2:19},
      {x1:20,y1:9,x2:20,y2:19},{x1:20,y1:9,x2:25,y2:9},{x1:25,y1:1,x2:25,y2:9},
      {x1:18,y1:17,x2:20,y2:17},{x1:35,y1:32,x2:43,y2:32}],
    stoneAreas:[{x:27,y:22,w:8,h:5}],
    waterAreas:[{id:'blackwood_marsh_west',x:8,y:12,w:10,h:10,cutCorners:true},
      {id:'blackwood_marsh_east',x:44,y:8,w:11,h:13,cutCorners:true},
      {id:'blackwood_marsh_south',x:44,y:29,w:9,h:9,cutCorners:true}],
    fishingSpot:{x:17,y:17},rocks:[{x:10,y:28},{x:38,y:20},{x:56,y:25}],
    treePattern:{xStart:6,yStart:5,xStep:4,yStep:3,seed:34,skipModulo:9}
  }),
  forestTen:forestFrontierRegion('forestTen',10,{
    terrain:{ground:'#315f55',patchA:'#1d4542',patchB:'#719982',pathRim:'#63584a',pathCore:'#9a8c70',
      hills:[{x:4,y:6,w:17,h:18},{x:43,y:24,w:16,h:18}]},
    paths:[{x1:25,y1:39,x2:25,y2:46},{x1:17,y1:39,x2:25,y2:39},{x1:17,y1:30,x2:17,y2:39},
      {x1:17,y1:30,x2:32,y2:30},{x1:32,y1:21,x2:32,y2:30},{x1:24,y1:21,x2:32,y2:21},
      {x1:24,y1:11,x2:24,y2:21},{x1:24,y1:11,x2:31,y2:11},{x1:31,y1:5,x2:31,y2:11},
      {x1:25,y1:5,x2:31,y2:5},{x1:25,y1:1,x2:25,y2:5},{x1:32,y1:25,x2:43,y2:25}],
    stoneAreas:[{x:21,y:18,w:14,h:7,cutCorners:true}],
    waterAreas:[{id:'ancient_root_pool_west',x:6,y:25,w:9,h:11,cutCorners:true},
      {id:'ancient_root_pool_east',x:44,y:19,w:11,h:13,cutCorners:true}],
    fishingSpot:{x:44,y:25},rocks:[{x:10,y:12},{x:39,y:37},{x:55,y:15}],
    treePattern:{xStart:4,yStart:4,xStep:5,yStep:4,seed:55,skipModulo:8}
  }),
  forestEleven:forestFrontierRegion('forestEleven',11,{
    terrain:{ground:'#31465e',patchA:'#252f55',patchB:'#6c78a0',pathRim:'#56506d',pathCore:'#8c83aa',
      hills:[{x:5,y:8,w:14,h:27},{x:49,y:6,w:10,h:34}]},
    paths:[{x1:25,y1:38,x2:25,y2:46},{x1:25,y1:38,x2:34,y2:38},{x1:34,y1:29,x2:34,y2:38},
      {x1:22,y1:29,x2:34,y2:29},{x1:22,y1:20,x2:22,y2:29},{x1:22,y1:20,x2:30,y2:20},
      {x1:30,y1:11,x2:30,y2:20},{x1:25,y1:11,x2:30,y2:11},{x1:25,y1:1,x2:25,y2:11},
      {x1:34,y1:33,x2:42,y2:33},{x1:30,y1:15,x2:41,y2:15}],
    stoneAreas:[{x:17,y:16,w:7,h:7,cutCorners:true}],
    waterAreas:[{id:'spirit_moon_upper',x:42,y:8,w:10,h:8,cutCorners:true},
      {id:'spirit_moon_middle',x:45,y:15,w:10,h:13,cutCorners:true},
      {id:'spirit_moon_lower',x:41,y:27,w:11,h:10,cutCorners:true}],
    fishingSpot:{x:42,y:12},rocks:[{x:11,y:39},{x:37,y:23},{x:56,y:40}],
    treePattern:{xStart:5,yStart:5,xStep:3,yStep:4,seed:89,skipModulo:12}
  }),
  forestTwelve:forestFrontierRegion('forestTwelve',12,{
    terrain:{ground:'#292b45',patchA:'#15182f',patchB:'#62516f',pathRim:'#554454',pathCore:'#8b7184',
      hills:[{x:3,y:5,w:19,h:17},{x:40,y:28,w:20,h:14}],
      waterfalls:[{x:46,y:10,w:3,h:5}]},
    paths:[{x1:25,y1:39,x2:25,y2:46},{x1:16,y1:39,x2:25,y2:39},{x1:16,y1:31,x2:16,y2:39},
      {x1:16,y1:31,x2:34,y2:31},{x1:34,y1:22,x2:34,y2:31},{x1:25,y1:22,x2:34,y2:22},
      {x1:25,y1:13,x2:25,y2:22},{x1:18,y1:13,x2:25,y2:13},{x1:18,y1:7,x2:18,y2:13},
      {x1:18,y1:7,x2:25,y2:7},{x1:25,y1:1,x2:25,y2:7},{x1:34,y1:17,x2:41,y2:17}],
    stoneAreas:[{x:21,y:19,w:9,h:7,cutCorners:true},{x:38,y:30,w:7,h:6,cutCorners:true}],
    waterAreas:[{id:'origin_abyss_west',x:6,y:18,w:10,h:14,cutCorners:true},
      {id:'origin_falls_basin',x:42,y:7,w:10,h:13,cutCorners:true},
      {id:'origin_abyss_south',x:47,y:29,w:9,h:9,cutCorners:true}],
    fishingSpot:{x:42,y:17},rocks:[{x:11,y:10},{x:36,y:39},{x:57,y:23}],
    treePattern:{xStart:4,yStart:5,xStep:4,yStep:5,seed:144,skipModulo:7}
  }),
  sunnyFields:Object.freeze({
    id:'sunnyFields',name:'햇살 농장',tileSize:48,width:64,height:48,
    playerSpawn:{x:3,y:24,face:'right'},
    paths:[
      {x1:1,y1:24,x2:13,y2:24},{x1:11,y1:17,x2:11,y2:31},
      {x1:11,y1:20,x2:21,y2:20},{x1:11,y1:28,x2:21,y2:28},
      {x1:22,y1:20,x2:22,y2:31}
    ],
    stoneAreas:[],waterAreas:[{id:'farm_pond',x:27,y:13,w:11,h:15,cutCorners:true,fishingHabitat:'pond'}],
    bridges:[],fishingSpot:{x:27,y:20},npcs:[],
    fixedObjects:{rocks:[{x:39,y:30},{x:7,y:34}]},
    decorations:{
      bushes:[{x:8,y:18,v:0,s:.8},{x:19,y:32,v:1,s:.7},{x:39,y:18,v:0,s:.7}],
      flowers:[{x:9,y:22,v:0,s:.55},{x:24,y:26,v:1,s:.55},{x:25,y:17,v:0,s:.6}],
      grassTufts:[{x:6,y:27,s:.35},{x:20,y:18,s:.34},{x:32,y:30,s:.36}],
      reeds:[{x:26,y:19,s:.42},{x:38,y:23,s:.38}]
    },buildings:[],
    treeLines:[
      {axis:'x',from:1,to:62,step:2,fixed:1,gaps:[]},
      {axis:'x',from:1,to:62,step:2,fixed:46,gaps:[]},
      {axis:'y',from:3,to:44,step:2,fixed:1,gaps:[[22,26]]},
      {axis:'y',from:3,to:44,step:2,fixed:62,gaps:[]}
    ],
    trees:[{x:8,y:14},{x:15,y:14},{x:20,y:15},{x:42,y:19},{x:45,y:30},{x:18,y:37}],
    farmPlots:Array.from({length:16},(_,index)=>({id:`farm_${String(index+1).padStart(2,'0')}`,x:15+index%4,y:22+Math.floor(index/4)})),
    exits:[{x:1,y:24,to:'lilacVillage',entry:{x:60,y:24,face:'left'},label:'마을로'}]
  }),
  mountainLake:Object.freeze({
    id:'mountainLake',name:'여명 산악 호수',tileSize:48,width:64,height:48,
    terrain:{ground:'#7c9685',patchA:'#466d65',patchB:'#b9c0a2',pathRim:'#6d786c',pathCore:'#b3b29a',waterColor:'#347e98',
      ridges:[{x:5,y:3,w:11,h:10},{x:44,y:3,w:14,h:10}],
      hills:[{x:6,y:33,w:10,h:8},{x:48,y:34,w:10,h:9}]},
    playerSpawn:{x:60,y:24,face:'left'},
    paths:[
      {x1:62,y1:24,x2:50,y2:24},{x1:50,y1:24,x2:50,y2:32},
      {x1:50,y1:32,x2:46,y2:32},{x1:46,y1:32,x2:46,y2:36},
      {x1:46,y1:36,x2:14,y2:36},{x1:31,y1:36,x2:31,y2:46},
      {x1:14,y1:36,x2:14,y2:15},{x1:14,y1:15,x2:18,y2:15},
      {x1:50,y1:24,x2:48,y2:24}
    ],
    stoneAreas:[{id:'dawn_lake_overlook',x:29,y:35,w:5,h:3}],
    waterAreas:[
      {id:'dawn_lake_main',x:19,y:11,w:23,h:24,cutCorners:true,fishingHabitat:'mountain_lake'},
      {id:'dawn_lake_west_cove',x:15,y:18,w:8,h:12,cutCorners:true,fishingHabitat:'mountain_lake'},
      {id:'dawn_lake_east_cove',x:42,y:16,w:6,h:13,cutCorners:true,fishingHabitat:'mountain_lake'}
    ],
    bridges:[{id:'dawn_lake_fishing_pier',x1:31,y1:35,x2:31,y2:30}],
    fishingSpot:{x:32,y:30},npcs:[],buildings:[],farmPlots:[],
    fixedObjects:{rocks:[{x:17,y:14},{x:44,y:14},{x:49,y:18},{x:12,y:31},{x:37,y:37},{x:55,y:29}]},
    decorations:{
      bushes:[{x:12,y:16,v:0,s:.7},{x:52,y:27,v:1,s:.65},{x:25,y:39,v:0,s:.65}],
      flowers:[{x:27,y:36,v:1,s:.45},{x:34,y:38,v:0,s:.43},{x:13,y:14,v:1,s:.48}],
      grassTufts:[{x:17,y:32,s:.3},{x:43,y:30,s:.32},{x:50,y:22,s:.28}],
      reeds:[{x:18,y:16,s:.35},{x:24,y:35,s:.32},{x:48,y:26,s:.34}]
    },
    treeLines:[
      {axis:'x',from:2,to:62,step:3,fixed:1,gaps:[]},
      {axis:'x',from:2,to:62,step:3,fixed:46,gaps:[[29,33]]},
      {axis:'y',from:4,to:43,step:3,fixed:1,gaps:[]},
      {axis:'y',from:4,to:43,step:3,fixed:62,gaps:[[22,26]]}
    ],
    trees:[{x:9,y:19},{x:10,y:27},{x:12,y:39},{x:20,y:40},{x:40,y:41},{x:53,y:19},{x:56,y:32}],
    exits:[
      {x:62,y:24,to:'oldForest',entry:{x:3,y:24,face:'right'},label:'숲으로'},
      {x:31,y:46,to:'waterfallValley',entry:{x:31,y:3,face:'down'},label:'폭포 계곡'}
    ]
  }),
  waterfallValley:Object.freeze({
    id:'waterfallValley',name:'물안개 폭포 계곡',tileSize:48,width:64,height:48,
    terrain:{ground:'#638c83',patchA:'#285f61',patchB:'#a2be94',pathRim:'#6d7b67',pathCore:'#b4b694',waterColor:'#258fad',
      hills:[{x:7,y:6,w:13,h:15},{x:49,y:7,w:11,h:16}],
      waterfalls:[{x:37,y:17,w:4,h:6,mist:true}]},
    playerSpawn:{x:31,y:3,face:'down'},
    paths:[
      {x1:31,y1:1,x2:31,y2:20},{x1:31,y1:12,x2:34,y2:12},
      {x1:31,y1:20,x2:27,y2:20},{x1:31,y1:20,x2:36,y2:20},
      {x1:36,y1:20,x2:36,y2:22},{x1:27,y1:20,x2:27,y2:36},
      {x1:27,y1:27,x2:29,y2:27},{x1:27,y1:36,x2:36,y2:36},
      {x1:36,y1:36,x2:36,y2:46},{x1:44,y1:38,x2:50,y2:38},
      {x1:50,y1:38,x2:50,y2:27},{x1:50,y1:27,x2:47,y2:27}
    ],
    stoneAreas:[{id:'mist_pool_landing',x:26,y:25,w:4,h:5},{id:'mist_falls_overlook',x:34,y:21,w:3,h:2}],
    waterAreas:[
      {id:'mist_upper_river',x:35,y:6,w:8,h:11,cutCorners:true,fishingHabitat:'river'},
      {id:'mist_cascade',x:37,y:17,w:4,h:6,fishingHabitat:'waterfall',fishable:false},
      {id:'mist_falls_pool',x:30,y:23,w:17,h:10,cutCorners:true,fishingHabitat:'waterfall'},
      {id:'mist_lower_river',x:38,y:33,w:5,h:10,fishingHabitat:'river'}
    ],
    bridges:[{id:'mist_river_footbridge',x1:36,y1:38,x2:44,y2:38}],
    fishingSpot:{x:30,y:27},npcs:[],buildings:[],farmPlots:[],
    fixedObjects:{rocks:[{x:34,y:9},{x:44,y:18},{x:28,y:22},{x:47,y:33},{x:23,y:37},{x:51,y:24}]},
    decorations:{
      bushes:[{x:25,y:18,v:0,s:.75},{x:48,y:24,v:1,s:.7},{x:22,y:32,v:0,s:.7}],
      flowers:[{x:28,y:31,v:1,s:.45},{x:32,y:35,v:0,s:.48},{x:48,y:38,v:1,s:.44}],
      grassTufts:[{x:30,y:18,s:.34},{x:25,y:25,s:.32},{x:46,y:37,s:.33}],
      reeds:[{x:34,y:14,s:.4},{x:29,y:25,s:.38},{x:47,y:29,s:.39},{x:43,y:35,s:.35}]
    },
    treeLines:[
      {axis:'x',from:2,to:62,step:3,fixed:1,gaps:[[29,33]]},
      {axis:'x',from:2,to:62,step:3,fixed:46,gaps:[[34,38]]},
      {axis:'y',from:4,to:43,step:3,fixed:1,gaps:[]},
      {axis:'y',from:4,to:43,step:3,fixed:62,gaps:[]}
    ],
    trees:[{x:12,y:24},{x:20,y:21},{x:22,y:28},{x:18,y:38},{x:31,y:41},{x:54,y:31},{x:51,y:41}],
    exits:[
      {x:31,y:1,to:'mountainLake',entry:{x:31,y:44,face:'up'},label:'산악 호수'},
      {x:36,y:46,to:'reedSwamp',entry:{x:36,y:3,face:'down'},label:'갈대 늪'}
    ]
  }),
  reedSwamp:Object.freeze({
    id:'reedSwamp',name:'그늘 갈대 늪',tileSize:48,width:64,height:48,
    terrain:{ground:'#59654d',patchA:'#2b433b',patchB:'#8b8b58',pathRim:'#34433b',pathCore:'#898361',waterColor:'#4e665b',swamp:true,
      lilyPads:[{x:14,y:20},{x:22,y:27},{x:25,y:16},{x:31,y:22},{x:35,y:26},{x:43,y:15},{x:48,y:22},{x:51,y:30},{x:23,y:38},{x:38,y:39},{x:45,y:40}]},
    playerSpawn:{x:36,y:3,face:'down'},
    paths:[
      {x1:36,y1:1,x2:36,y2:17},{x1:36,y1:17,x2:29,y2:17},
      {x1:29,y1:17,x2:29,y2:34},{x1:29,y1:34,x2:38,y2:34},
      {x1:36,y1:15,x2:38,y2:15},{x1:38,y1:15,x2:38,y2:34}
    ],
    stoneAreas:[],
    waterAreas:[
      {id:'shade_swamp_west',x:7,y:13,w:22,h:20,cutCorners:true,fishingHabitat:'swamp'},
      {id:'shade_swamp_middle',x:30,y:19,w:8,h:10,cutCorners:true,fishingHabitat:'swamp'},
      {id:'shade_swamp_east',x:39,y:9,w:17,h:27,cutCorners:true,fishingHabitat:'swamp'},
      {id:'shade_swamp_deep',x:18,y:35,w:31,h:8,cutCorners:true,fishingHabitat:'swamp'}
    ],
    bridges:[{id:'shade_swamp_boardwalk',x1:33,y1:34,x2:33,y2:40}],
    fishingSpot:{x:28,y:24},npcs:[],buildings:[],farmPlots:[],
    fixedObjects:{rocks:[{x:34,y:11},{x:24,y:9},{x:57,y:23},{x:16,y:34},{x:51,y:39}]},
    decorations:{
      bushes:[{x:27,y:10,v:1,s:.75},{x:34,y:16,v:0,s:.7},{x:14,y:11,v:1,s:.65},{x:51,y:37,v:0,s:.75}],
      flowers:[{x:35,y:6,v:1,s:.36},{x:30,y:33,v:1,s:.35}],
      grassTufts:[{x:32,y:11,s:.35},{x:29,y:31,s:.32},{x:37,y:31,s:.3},{x:57,y:37,s:.38}],
      reeds:[{x:29,y:21,s:.4},{x:29,y:28,s:.39},{x:38,y:18,s:.4},{x:38,y:27,s:.4},{x:18,y:34,s:.45},
        {x:26,y:34,s:.42},{x:42,y:36,s:.45},{x:50,y:34,s:.4},{x:11,y:13,s:.4},{x:8,y:25,s:.44}]
    },
    treeLines:[
      {axis:'x',from:2,to:62,step:3,fixed:1,gaps:[[34,38]]},
      {axis:'x',from:2,to:62,step:3,fixed:46,gaps:[]},
      {axis:'y',from:4,to:43,step:3,fixed:1,gaps:[]},
      {axis:'y',from:4,to:43,step:3,fixed:62,gaps:[]}
    ],
    trees:[{x:4,y:12},{x:13,y:7},{x:22,y:7},{x:43,y:6},{x:57,y:17},{x:55,y:40},{x:11,y:40},{x:17,y:45}],
    exits:[{x:36,y:1,to:'waterfallValley',entry:{x:36,y:44,face:'up'},label:'폭포 계곡'}]
  }),
  coast:Object.freeze({
    id:'coast',name:'바람결 해안 항구',tileSize:48,width:64,height:48,
    terrain:{ground:'#d6bb79',patchA:'#8daa70',patchB:'#efd99a',pathRim:'#9f855b',pathCore:'#ccb587',coast:true},
    playerSpawn:{x:60,y:24,face:'left'},
    paths:[
      {x1:62,y1:24,x2:44,y2:24},{x1:44,y1:20,x2:44,y2:28},
      {x1:17,y1:27,x2:44,y2:27},{x1:12,y1:21,x2:12,y2:27}
    ],
    stoneAreas:[{id:'harbor_square',x:31,y:19,w:16,h:9}],
    waterAreas:[{id:'windshore_harbor',x:2,y:29,w:60,h:18,fishingHabitat:'coast'}],
    bridges:[
      {id:'harbor_main_pier',x1:38,y1:27,x2:38,y2:38},
      {id:'harbor_side_pier',x1:38,y1:36,x2:47,y2:36}
    ],
    fishingSpot:{x:20,y:29},
    npcs:[
      {id:'captain_maru',x:38,y:34,homeX:38,homeY:34,name:'선장 마루',role:'captain',sprite:'thomas',scale:1,face:'right',moving:false,wait:1200,roam:0,
        dialog:'배는 정비를 마쳤어. 항로와 승선권 준비가 끝나면 이 부두에서 얕은 바다부터 출항할 수 있을 거야.'}
    ],
    fixedObjects:{
      rocks:[{x:7,y:23},{x:20,y:20},{x:52,y:20},{x:57,y:27}],
      harbor:{
        ticketBooth:{x:34,y:20,w:4,h:3,approach:{x:36,y:23}},
        boat:{x:41,y:29,w:8,h:7},
        crates:[{x:32,y:25},{x:43,y:26},{x:46,y:25}]
      }
    },
    decorations:{
      bushes:[{x:9,y:18,v:0,s:.68},{x:16,y:22,v:1,s:.62},{x:53,y:23,v:0,s:.66}],
      flowers:[{x:12,y:19,v:0,s:.5},{x:18,y:25,v:1,s:.48},{x:50,y:26,v:0,s:.48}],
      grassTufts:[{x:6,y:26,s:.31},{x:24,y:24,s:.3},{x:56,y:24,s:.32}],
      reeds:[{x:10,y:29,s:.37},{x:25,y:29,s:.38},{x:54,y:29,s:.36}]
    },
    buildings:[],
    treeLines:[
      {axis:'x',from:1,to:62,step:3,fixed:1,gaps:[]},
      {axis:'y',from:4,to:27,step:3,fixed:1,gaps:[]},
      {axis:'y',from:4,to:27,step:3,fixed:62,gaps:[[22,26]]}
    ],
    trees:[{x:5,y:18},{x:24,y:17},{x:51,y:16},{x:58,y:12}],farmPlots:[],
    exits:[{x:62,y:24,to:'lilacVillage',entry:{x:3,y:36,face:'right'},label:'마을로'}]
  })
});
const REGION_EXITS=Object.freeze({
  lilacVillage:[
    {x:25,y:1,to:'oldForest',entry:{x:25,y:44,face:'up'},label:'숲으로'},
    {x:62,y:24,to:'sunnyFields',entry:{x:3,y:24,face:'right'},label:'농장으로'},
    {x:1,y:36,to:'coast',entry:{x:60,y:24,face:'left'},label:'해안으로'}
  ],
  oldForest:REGION_WORLDS.oldForest.exits,
  deepForest:REGION_WORLDS.deepForest.exits,
  forestThree:REGION_WORLDS.forestThree.exits,
  forestFour:REGION_WORLDS.forestFour.exits,
  forestFive:REGION_WORLDS.forestFive.exits,
  forestSix:REGION_WORLDS.forestSix.exits,
  forestSeven:REGION_WORLDS.forestSeven.exits,
  forestEight:REGION_WORLDS.forestEight.exits,
  forestNine:REGION_WORLDS.forestNine.exits,
  forestTen:REGION_WORLDS.forestTen.exits,
  forestEleven:REGION_WORLDS.forestEleven.exits,
  forestTwelve:REGION_WORLDS.forestTwelve.exits,
  sunnyFields:REGION_WORLDS.sunnyFields.exits,
  coast:REGION_WORLDS.coast.exits,
  mountainLake:REGION_WORLDS.mountainLake.exits,
  waterfallValley:REGION_WORLDS.waterfallValley.exits,
  reedSwamp:REGION_WORLDS.reedSwamp.exits
});
