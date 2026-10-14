import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {forestWorldContext} from './lib/forest-world-qa.mjs';
const context=forestWorldContext(),storage=new Map();context.document=undefined;
context.performance={now:()=>0};context.window={addEventListener(){}};context.setTimeout=()=>0;context.clearTimeout=()=>{};
context.localStorage={getItem:key=>storage.get(key)||null,setItem(key,value){if(context.failSave)throw Error('quota');storage.set(key,String(value));}};
context.renderMarket=()=>{};context.setMarketCoinDisplay=()=>{};context.playMarketSaleSound=()=>{};context.showSkillXpFeedback=()=>{};
context.marketState={shop:'haru',view:'orders',message:''};
const files=['src/data/farm-orders-data.js','src/farm-orders.js','src/data/fish-data.js','src/data/tree-dex-data.js','src/data/farming-data.js',
  'src/life-skills.js','src/save.js','src/simulation.js','src/life-content.js'];
vm.runInContext(files.map(file=>fs.readFileSync(file,'utf8')).join('\n')+
  "\nGAME_STATE.regionId='sunnyFields';applySaveData(createSaveData());buildWorldRegion(REGION_WORLDS.sunnyFields);player.x=14;player.y=22;"+
  "\nglobalThis.api={state:GAME_STATE,player,world:REGION_WORLDS.sunnyFields,items:FARM_DECORATIONS,crops:LIFE_CROP_BY_ID,"+
  "ensureFarmOrder,generateFarmOrder,normalizeSavedFarmOrders,createDefaultFarmOrders,deliverFarmOrder,exchangeFarmDecoration,setFarmDecorationPlaced,"+
  "refreshFarmDecorationCollision,addFarmDecorationRenderables,imgs,addLifeItem,lifeItemCount,createSaveData,applySaveData,saveGame,loadGame,buildWorldRegion,isBlocked,dirVec,"+
  "lifeSkillProgressFromTotal,lifeSkillTotalXpForLevel,collisionKeys:()=>[...blocked].sort()};",context);
context.document={getElementById:()=>({textContent:'',classList:{add(){},remove(){}}})};
const r=context.api,clone=value=>JSON.parse(JSON.stringify(value)),state=()=>clone(r.createSaveData().state),orders=()=>r.state.progression.farmOrders;
const old=clone(r.createSaveData());delete old.state.progression.farmOrders;assert(r.applySaveData(old));
assert.deepEqual(clone(orders()),{schemaVersion:1,tickets:0,completed:0,current:null,ownedDecorationIds:[],placedDecorationIds:[]});
const noOrders=state();delete noOrders.progression.farmOrders;assert.deepEqual(noOrders,old.state);
assert.equal(r.items.length,8);
const previousSave=clone(r.createSaveData());
previousSave.state.progression.farmOrders={schemaVersion:1,tickets:37,completed:7,current:{...clone(r.generateFarmOrder({...orders(),completed:7})),id:'farm-order-8'},
  ownedDecorationIds:['scarecrow','sign','fence'],placedDecorationIds:['sign','fence']};
assert(r.applySaveData(previousSave));assert.deepEqual(state(),previousSave.state);assert(r.applySaveData(old));
const generationBefore=state();context.failSave=true;
assert.equal(r.ensureFarmOrder(),false);assert.deepEqual(state(),generationBefore);
context.failSave=false;
assert(r.ensureFarmOrder());const first=clone(orders().current);
assert(first.requirements.length===1&&['carrot','turnip','lettuce','potato'].includes(first.requirements[0].cropId));
for(let i=0;i<5;i++)assert(r.ensureFarmOrder());assert.deepEqual(clone(orders().current),first);
const missing=state();assert.equal(r.deliverFarmOrder(first.id),false);assert.deepEqual(state(),missing);
let cases=0;
for(const [level,plots,tier] of [[1,4,1],[99,4,1],[9,16,1],[10,8,2],[20,8,2],[20,12,3],[100,16,3]]){
  r.state.progression.farming=r.lifeSkillProgressFromTotal('farming',r.lifeSkillTotalXpForLevel('farming',level));
  r.world.farmPlots.forEach((plot,index)=>r.state.world.plots[plot.id]={unlocked:index<plots,cropId:null,plantedAt:null});
  let seed=43;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<500;i++){
    const order=r.generateFarmOrder(orders(),random);
    assert.equal(order.tier,tier);assert.equal(order.requirements.length,tier);assert.equal(order.tickets,tier);
    assert.equal(new Set(order.requirements.map(row=>row.cropId)).size,tier);
    assert(order.requirements.every(row=>row.quantity>=[0,4,6,8][tier]&&row.quantity<=[0,8,10,12][tier]&&r.crops.get(row.cropId).growMs/60000<=[0,5,12,40][tier]));
    const value=order.requirements.reduce((sum,row)=>sum+row.quantity*r.crops.get(row.cropId).sellPrice,0);
    assert.equal(order.coins,Math.ceil(value*1.25)+15*tier);
    assert.deepEqual(clone(r.normalizeSavedFarmOrders({...orders(),current:order}).current),clone(order));cases++;
  }
}
r.state.progression.farming=r.lifeSkillProgressFromTotal('farming',0);
const skills=clone({farming:r.state.progression.farming,fishing:r.state.progression.fishing,logging:r.state.progression.logging});
for(let i=0;i<20;i++){
  const order=clone(orders().current),before={coins:r.state.progression.coins,tickets:orders().tickets,completed:orders().completed};
  const stocks=new Map();
  for(const row of order.requirements){r.addLifeItem('crop',row.cropId,row.quantity+2);stocks.set(row.cropId,r.lifeItemCount('crop',row.cropId));}
  assert(r.deliverFarmOrder(order.id));assert.equal(r.deliverFarmOrder(order.id),false);
  assert.equal(r.state.progression.coins-before.coins,order.coins);assert.equal(orders().tickets-before.tickets,order.tickets);
  assert.equal(orders().completed-before.completed,1);assert.notEqual(orders().current.id,order.id);
  for(const row of order.requirements)assert.equal(r.lifeItemCount('crop',row.cropId),stocks.get(row.cropId)-row.quantity);
}
assert.deepEqual(clone({farming:r.state.progression.farming,fishing:r.state.progression.fishing,logging:r.state.progression.logging}),skills);
for(const row of orders().current.requirements)r.addLifeItem('crop',row.cropId,row.quantity);r.saveGame();
const before=state(),stored=storage.get('pixel-life.save.v2');context.failSave=true;
assert.equal(r.deliverFarmOrder(orders().current.id),false);assert.deepEqual(state(),before);assert.equal(storage.get('pixel-life.save.v2'),stored);context.failSave=false;
context.marketState.view='decorations';
const initialBlocked=clone(r.collisionKeys());
orders().tickets=r.items.reduce((sum,item)=>sum+item.cost,0);
const decorationKeys=new Set();
for(const item of r.items){
  assert(item.slots.every(slot=>!initialBlocked.includes(slot.x+','+slot.y)));
  for(const slot of item.slots){
    const key=slot.x+','+slot.y;assert(!decorationKeys.has(key),'Decorations must not overlap');decorationKeys.add(key);
    assert(!r.world.paths.some(path=>slot.x>=Math.min(path.x1,path.x2)&&slot.x<=Math.max(path.x1,path.x2)&&slot.y>=Math.min(path.y1,path.y2)&&slot.y<=Math.max(path.y1,path.y2)),'Do not occupy walking paths');
  }
  const tickets=orders().tickets,snapshot=state();context.failSave=true;
  assert.equal(r.exchangeFarmDecoration(item.id),false);assert.deepEqual(state(),snapshot);context.failSave=false;
  assert(r.exchangeFarmDecoration(item.id));assert.equal(orders().tickets,tickets-item.cost);assert.equal(r.exchangeFarmDecoration(item.id),false);
  for(const slot of item.slots){r.player.x=slot.x;r.player.y=slot.y;assert.equal(r.setFarmDecorationPlaced(item.id,true),false);}
  r.player.x=14;r.player.y=22;const beforePlacement=state(),beforeCollision=clone(r.collisionKeys());context.failSave=true;
  assert.equal(r.setFarmDecorationPlaced(item.id,true),false);assert.deepEqual(state(),beforePlacement);assert.deepEqual(clone(r.collisionKeys()),beforeCollision);context.failSave=false;
  assert(r.setFarmDecorationPlaced(item.id,true));assert(item.slots.every(slot=>r.isBlocked(slot.x,slot.y)));assert.equal(r.setFarmDecorationPlaced(item.id,true),false);
}
assert.equal(orders().tickets,0);
context.onScreen=()=>true;
for(const item of r.items)r.imgs[item.asset]={id:item.id};
const renderables=[];r.addFarmDecorationRenderables(renderables);
assert.equal(renderables.length,14,'Render bench/well once each, plus seven fence segments');
const seen=new Set(),queue=[{x:3,y:24}];
for(let i=0;i<queue.length;i++){
  const p=queue[i],key=p.x+','+p.y;if(seen.has(key)||r.isBlocked(p.x,p.y))continue;seen.add(key);
  for(const [dx,dy] of Object.values(r.dirVec))queue.push({x:p.x+dx,y:p.y+dy});
}
assert([14,16,18,20,22].every(x=>[21,22,23,24,25,26].every(y=>seen.has(x+','+y))));
assert(r.world.farmPlots.every(p=>Object.values(r.dirVec).some(([dx,dy])=>seen.has((p.x+dx)+','+(p.y+dy)))));
assert(seen.has('1,24'));
const saved=state();r.saveGame();r.state.progression.farmOrders=r.createDefaultFarmOrders();r.loadGame();r.buildWorldRegion(r.world);
assert.deepEqual(state(),saved);assert(r.items.every(item=>item.slots.every(slot=>r.isBlocked(slot.x,slot.y))));
for(const item of r.items)assert(r.setFarmDecorationPlaced(item.id,false));assert.deepEqual(clone(r.collisionKeys()),initialBlocked);
assert.deepEqual(clone(r.normalizeSavedFarmOrders({tickets:-1,completed:2.5,ownedDecorationIds:['sign','unknown','sign'],placedDecorationIds:['scarecrow','sign']})),
  {schemaVersion:1,tickets:0,completed:0,current:null,ownedDecorationIds:['sign'],placedDecorationIds:['sign']});
assert.equal(r.normalizeSavedFarmOrders({current:{...first,requirements:[{cropId:'missing',quantity:4}]}}).current,null);
console.log('Farm orders passed: '+cases+' tier/economy/restore cases, one persistent order, previous three-object save preservation, 20 exact deliveries, stale double-submit, independent XP, rollback, eight exchanges/placement/reload/removal, multi-tile rendering and all lanes/beds/exit accessible.');
