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
const FOREST_REGION_SPECIES=Object.freeze({
  oldForest:Object.freeze([...FOREST_LEGACY_STARTER_SPECIES,'paulownia','cedar']),
  deepForest:Object.freeze([...FOREST_LEGACY_DEEP_SPECIES,'ginkgo','larch','cherry','chestnut','walnut','zelkova']),
  forestThree:Object.freeze(FOREST_SPECIES),
  forestFour:Object.freeze(FOREST_SPECIES),
  forestFive:Object.freeze(FOREST_SPECIES)
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
  const species=regionId==='deepForest'?
    (y>=32?FOREST_LEGACY_STARTER_SPECIES:y>=24?FOREST_LEGACY_DEEP_SPECIES.slice(0,3):FOREST_LEGACY_DEEP_SPECIES.slice(3)):
    (regionId==='oldForest'?FOREST_LEGACY_STARTER_SPECIES:laterForestSpecies[regionId]||FOREST_SPECIES);
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
function forestFrontierRegion(id,number,layout){
  const {paths,waterAreas,fishingSpot,rocks,terrain}=layout;
  return Object.freeze({
    id,name:`오래된 숲 1-${number}`,tileSize:48,width:64,height:48,
    playerSpawn:{x:25,y:44,face:'up'},
    paths,terrain,
    stoneAreas:[],waterAreas,bridges:[],fishingSpot,npcs:[],fixedObjects:{rocks},
    decorations:{
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
    trees:[...forestGroveTrees(id),...forestInfillTrees(id,waterAreas)],
    farmPlots:[],exits:[
      ...(number<5?[{x:25,y:1,to:number===3?'forestFour':'forestFive',entry:{x:25,y:44,face:'up'},label:`숲 1-${number+1}`}]:[]),
      {x:25,y:46,to:number===3?'deepForest':number===4?'forestThree':'forestFour',entry:{x:25,y:3,face:'down'},label:`숲 1-${number-1}`}
    ]
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
      {id:'forest_stream',x:40,y:7,w:8,h:30,cutCorners:true},
      {id:'forest_pool',x:37,y:21,w:4,h:9,cutCorners:true}
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
      {x:25,y:46,to:'lilacVillage',entry:{x:25,y:3,face:'down'},label:'마을로'}
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
      {id:'deep_forest_stream',x:40,y:7,w:8,h:30,cutCorners:true},
      {id:'deep_forest_pool',x:37,y:19,w:4,h:9,cutCorners:true}
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
  sunnyFields:Object.freeze({
    id:'sunnyFields',name:'햇살 농장',tileSize:48,width:64,height:48,
    playerSpawn:{x:3,y:24,face:'right'},
    paths:[
      {x1:1,y1:24,x2:13,y2:24},{x1:11,y1:17,x2:11,y2:31},
      {x1:11,y1:20,x2:21,y2:20},{x1:11,y1:28,x2:21,y2:28},
      {x1:22,y1:20,x2:22,y2:31}
    ],
    stoneAreas:[],waterAreas:[{id:'farm_pond',x:27,y:13,w:11,h:15,cutCorners:true}],
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
  })
});
const REGION_EXITS=Object.freeze({
  lilacVillage:[
    {x:25,y:1,to:'oldForest',entry:{x:25,y:44,face:'up'},label:'숲으로'},
    {x:62,y:24,to:'sunnyFields',entry:{x:3,y:24,face:'right'},label:'농장으로'}
  ],
  oldForest:REGION_WORLDS.oldForest.exits,
  deepForest:REGION_WORLDS.deepForest.exits,
  forestThree:REGION_WORLDS.forestThree.exits,
  forestFour:REGION_WORLDS.forestFour.exits,
  forestFive:REGION_WORLDS.forestFive.exits,
  sunnyFields:REGION_WORLDS.sunnyFields.exits
});
