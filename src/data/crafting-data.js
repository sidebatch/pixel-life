// Portable crafting is inventory-based; no placed world object is required.
const PORTABLE_WORKBENCH=Object.freeze({id:'portable_workbench',name:'휴대용 제작대',woodCost:20});
const HUNTING_MATERIALS=Object.freeze([
  Object.freeze({id:'normal_leather',name:'일반 가죽',price:3}),
  Object.freeze({id:'sturdy_leather',name:'튼튼한 가죽',price:90}),
  Object.freeze({id:'brak_tusk',name:'브락 엄니',price:160})
]);
const HUNTING_MATERIAL_BY_ID=new Map(HUNTING_MATERIALS.map(item=>[item.id,item]));
const CRAFTING_RECIPES=Object.freeze([
  Object.freeze({id:'sturdy_leather',name:'튼튼한 가죽',category:'materials',type:'material',resultId:'sturdy_leather',
    description:'여러 장의 가죽을 단단하게 엮은 제작 재료예요.',materials:Object.freeze({normal_leather:30})}),
  Object.freeze({id:'brak_sword',name:'브락의 검',category:'equipment',type:'sword',resultId:'sword.brak',
    description:'브락의 엄니로 만든 검. 가방 → 장비에서 장착할 수 있어요.',materials:Object.freeze({sturdy_leather:3,brak_tusk:1})})
]);
const HUNTING_LOOT=Object.freeze({boar:3,deer:2,fox:1,wolf:4,bear:6,brak:10});
