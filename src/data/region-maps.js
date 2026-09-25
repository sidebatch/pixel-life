const VILLAGE_WORLD_DEFINITION=WORLD_DEFINITION;
const FOREST_WOOD=Object.freeze({oak:'참나무',pine:'소나무',birch:'자작나무',maple:'단풍나무',spruce:'가문비나무',willow:'버드나무',cypress:'삼나무',broadleaf:'활엽수'});
const FOREST_SPECIES=Object.freeze(Object.keys(FOREST_WOOD));
const FOREST_REGION_SPECIES=Object.freeze({
  oldForest:Object.freeze(['oak','pine','birch']),
  deepForest:Object.freeze(['maple','spruce','willow','cypress','broadleaf'])
});
const forestTreeId=(x,y,regionId='oldForest')=>`${regionId==='deepForest'?'deep_forest':'forest'}_tree_${x}_${y}`;
const forestTreeSpecies=(x,y,regionId='oldForest')=>{
  // A species has the same tool requirement in every region. Forest 1-2
  // retains starter species near its entrance, then adds stronger species.
  const species=regionId==='deepForest'?
    (y>=32?FOREST_REGION_SPECIES.oldForest:y>=24?FOREST_REGION_SPECIES.deepForest.slice(0,3):FOREST_REGION_SPECIES.deepForest.slice(3)):
    (FOREST_REGION_SPECIES[regionId]||FOREST_SPECIES);
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
const REGION_WORLDS=Object.freeze({
  lilacVillage:VILLAGE_WORLD_DEFINITION,
  oldForest:Object.freeze({
    id:'oldForest',name:'오래된 숲 1-1',tileSize:48,width:64,height:48,
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
      ...forestGroveTrees('oldForest')
    ],
    farmPlots:[],exits:[
      {x:25,y:1,to:'deepForest',entry:{x:25,y:44,face:'up'},label:'숲 1-2'},
      {x:25,y:46,to:'lilacVillage',entry:{x:25,y:3,face:'down'},label:'마을로'}
    ]
  }),
  deepForest:Object.freeze({
    id:'deepForest',name:'오래된 숲 1-2',tileSize:48,width:64,height:48,
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
      ...forestGroveTrees('deepForest')
    ],
    farmPlots:[],exits:[
      {x:25,y:46,to:'oldForest',entry:{x:25,y:3,face:'down'},label:'숲 1-1'}
    ]
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
  sunnyFields:REGION_WORLDS.sunnyFields.exits
});
