const INVENTORY_FISH_BY_ID=new Map(FISH_DATA.map(fish=>[fish.id,fish]));
const inventoryState={open:false,tab:'fish'};

function isInventoryOpen(){return inventoryState.open;}

function groupInventoryFish(items=GAME_STATE.inventory){
  const groups=new Map();
  items.forEach((item,index)=>{
    if(item?.type!=='fish') return;
    const fish=INVENTORY_FISH_BY_ID.get(item.id);
    if(!fish) return;
    if(!groups.has(fish.id)) groups.set(fish.id,{fish,count:0,latestIndex:index,entries:[]});
    const group=groups.get(fish.id);
    const quantity=Math.max(1,Math.floor(item.quantity||1));
    group.count+=quantity;
    group.latestIndex=index;
    group.entries.push({sizeCm:item.sizeCm,price:item.price,quantity});
  });
  return [...groups.values()].map(group=>({...group,entries:group.entries.reverse()}))
    .sort((a,b)=>b.latestIndex-a.latestIndex);
}

function inventoryItemCardMarkup({name,count,unit='개',art,className='',equipped=false,equipType='',equipId=''}){
  const quantity=count.toLocaleString();
  const equipAttributes=equipType?` data-equip-type="${equipType}" data-equip-id="${equipId}"`:'';
  return `<button type="button" class="inventoryItemCard ${className}${equipped?' equipped':''}"${equipAttributes} aria-label="${name}, ${quantity}${unit}${equipped?', 장착 중':equipType?', 장착하기':''}">
    <span class="inventoryItemArt">${art}<strong class="inventoryItemCount" aria-hidden="true">${quantity}</strong></span>
    ${equipped?'<span class="inventoryItemEquipped" aria-hidden="true">장착 중</span>':''}
    ${equipType&&!equipped?'<span class="inventoryEquipPrompt" aria-hidden="true">장착</span>':''}
    <span class="inventoryItemName" aria-hidden="true">${name}</span>
  </button>`;
}

function renderInventoryFish(){
  const groups=groupInventoryFish();
  const count=groups.reduce((total,group)=>total+group.count,0);
  document.getElementById('inventorySummary').textContent=`보유 물고기 ${count.toLocaleString()}마리`;
  const scroll=document.getElementById('inventoryScroll');
  if(!groups.length){
    scroll.innerHTML='<div class="inventoryEmpty"><span>🐟</span><b>아직 낚은 물고기가 없어요</b><p>연못에서 낚으면 이곳에서 확인할 수 있어요.</p></div>';
    return;
  }
  scroll.innerHTML=`<div class="inventoryItemGrid">${groups.map(group=>inventoryItemCardMarkup({
    name:group.fish.name,count:group.count,unit:'마리',
    art:`<img src="${getFishImageUrl(group.fish)}" alt="">`,
    className:`inventoryFishCard rarity-${group.fish.rarity}`
  })).join('')}</div>`;
}

function inventoryRodArt(){
  return '<svg class="inventoryRodArt" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M12 50 48 9" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M46 9c7 3 10 9 10 18v13c0 5-2 8-6 8-3 0-5-2-5-5" stroke="#c5eee1" stroke-width="2.5" stroke-linecap="round"/><circle cx="26" cy="34" r="7" fill="#d0a066" stroke="#fff2c3" stroke-width="2"/><circle cx="26" cy="34" r="2" fill="#17463f"/></svg>';
}

function renderInventoryEquipment(){
  const rods=FISHING_RODS.filter(rod=>isFishingRodUnlocked(rod));
  const equippedRod=getEquippedFishingRod();
  const equippedAxe=getEquippedForestryAxe();
  document.getElementById('inventorySummary').textContent=`현재 ${equippedRod.name} · ${equippedAxe.name}`;
  const equipment=[
    ...getOwnedForestryAxes().map(axe=>inventoryItemCardMarkup({name:axe.name,count:1,
      art:`<img src="${FORESTRY_AXE_URLS[axe.asset]}" alt="">`,className:'inventoryEquipmentCard inventoryAxeCard',
      equipped:axe.id===equippedAxe.id,equipType:'axe',equipId:axe.id})),
    ...rods.map(rod=>inventoryItemCardMarkup({name:rod.name,count:1,art:inventoryRodArt(),
      className:`inventoryEquipmentCard rod-${rod.id.slice(4)}`,equipped:rod.id===equippedRod.id,equipType:'rod',equipId:rod.id}))
  ];
  document.getElementById('inventoryScroll').innerHTML=`<div class="inventoryItemGrid">${equipment.join('')}</div>
    <p class="inventoryHint">장착할 도끼나 낚싯대를 눌러 주세요. 도끼는 준에게, 낚싯대는 엘리에게서 구매할 수 있어요.</p>`;
}

function renderInventorySupplies(){
  const entries=[
    {type:'material',id:'log',icon:'🪵',name:'통나무'},
    ...FOREST_SPECIES.map(species=>({type:'material',id:`${species}_log`,icon:'🪵',name:`${FOREST_WOOD[species]} 통나무`})),
    ...LIFE_CONTENT.crops.flatMap(crop=>[
      {type:'seed',id:crop.id,icon:crop.icon,name:`${crop.name} 씨앗`},
      {type:'crop',id:crop.id,icon:crop.icon,name:crop.name}
    ])
  ].map(item=>({...item,count:lifeItemCount(item.type,item.id)})).filter(item=>item.count>0);
  document.getElementById('inventorySummary').textContent=`보유 재료 ${entries.reduce((sum,item)=>sum+item.count,0)}개`;
  document.getElementById('inventoryScroll').innerHTML=entries.length?
    `<div class="inventoryItemGrid">${entries.map(item=>inventoryItemCardMarkup({name:item.name,count:item.count,
      art:lifeItemIconMarkup(item.type,item.id,item.icon),className:'inventorySupplyCard'})).join('')}</div>`:
    '<div class="inventoryEmpty"><span>🪵</span><b>아직 재료가 없어요</b><p>숲에서 벌목하거나 농장에서 씨앗을 심어 보세요.</p></div>';
}

function renderInventory(){
  document.querySelectorAll('[data-inventory-tab]').forEach(button=>{
    const active=button.dataset.inventoryTab===inventoryState.tab;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  if(inventoryState.tab==='fish') renderInventoryFish();
  else if(inventoryState.tab==='equipment') renderInventoryEquipment();
  else renderInventorySupplies();
}

function openInventory(options={}){
  if(inventoryState.open||(typeof isFishingActive==='function'&&isFishingActive())) return;
  toggleMenu(false);
  inventoryState.open=true;
  inventoryState.tab='fish';
  menuOpen=true;
  clearMovement();
  renderInventory();
  const panel=document.getElementById('inventoryPanel');
  panel.classList.add('show');
  panel.setAttribute('aria-hidden','false');
  document.getElementById('inventoryScroll').scrollTop=0;
  document.getElementById('inventoryClose').focus();
  if(!options.fromHistory) pushGameOverlayHistory('inventory');
}

function closeInventory(options={}){
  if(!inventoryState.open) return;
  inventoryState.open=false;
  menuOpen=false;
  const panel=document.getElementById('inventoryPanel');
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory) leaveGameOverlayHistory('inventory');
}

if(typeof document!=='undefined'){
  document.getElementById('openInventoryBtn').addEventListener('click',openInventory);
  document.getElementById('inventoryClose').addEventListener('click',closeInventory);
  document.getElementById('inventoryScroll').addEventListener('click',event=>{
    const card=event.target.closest('.inventoryItemCard');
    if(!card) return;
    if(card.dataset.equipType){
      if(card.classList.contains('equipped')) return;
      const success=card.dataset.equipType==='rod'?equipFishingRod(card.dataset.equipId):
        equipForestryAxe(card.dataset.equipId);
      if(success){
        renderInventoryEquipment();
        document.querySelector(`[data-equip-id="${card.dataset.equipId}"]`)?.focus();
      }else document.getElementById('inventorySummary').textContent='장착 상태를 저장하지 못했어요. 다시 시도해 주세요.';
      return;
    }
    const show=!card.classList.contains('showName');
    document.querySelectorAll('.inventoryItemCard.showName').forEach(other=>other.classList.remove('showName'));
    card.classList.toggle('showName',show);
  });
  document.querySelectorAll('[data-inventory-tab]').forEach(button=>{
    button.addEventListener('click',()=>{
      inventoryState.tab=button.dataset.inventoryTab;
      renderInventory();
      document.getElementById('inventoryScroll').scrollTop=0;
    });
  });
}
