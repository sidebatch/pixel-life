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

function renderInventoryFish(){
  const groups=groupInventoryFish();
  const count=groups.reduce((total,group)=>total+group.count,0);
  document.getElementById('inventorySummary').textContent=`보유 물고기 ${count.toLocaleString()}마리`;
  const scroll=document.getElementById('inventoryScroll');
  if(!groups.length){
    scroll.innerHTML='<div class="inventoryEmpty"><span>🐟</span><b>아직 낚은 물고기가 없어요</b><p>연못에서 낚으면 이곳에서 확인할 수 있어요.</p></div>';
    return;
  }
  scroll.innerHTML=`<div class="inventoryFishGrid">${groups.map(group=>`<button type="button" class="inventoryFishCard rarity-${group.fish.rarity}" aria-label="${group.fish.name}, ${group.count.toLocaleString()}마리">
    <span class="inventoryFishArt"><img src="${getFishImageUrl(group.fish)}" alt=""><strong class="inventoryFishCount" aria-hidden="true">${group.count.toLocaleString()}</strong></span>
    <span class="inventoryFishName" aria-hidden="true">${group.fish.name}</span>
  </button>`).join('')}</div>`;
}

function renderInventoryEquipment(){
  const rods=FISHING_RODS.filter(rod=>isFishingRodUnlocked(rod));
  const equipped=getEquippedFishingRod();
  document.getElementById('inventorySummary').textContent=`사용 가능한 낚싯대 ${rods.length}개 · 현재 ${equipped.name}`;
  document.getElementById('inventoryScroll').innerHTML=`<p class="inventoryHint">장착 변경은 메뉴의 ‘낚시 장비’에서 할 수 있어요.</p>
    ${rods.map(rod=>`<div class="inventoryEquipment${rod.id===equipped.id?' equipped':''}">
      <span class="inventoryEquipmentIcon">${rod.icon}</span>
      <span><b>${rod.name}</b><small>${rod.description}</small></span>
      ${rod.id===equipped.id?'<strong>장착 중</strong>':''}
    </div>`).join('')}`;
}

function renderInventorySupplies(){
  const entries=[
    {type:'material',id:'log',icon:'🪵',name:'통나무'},
    ...LIFE_CONTENT.crops.flatMap(crop=>[
      {type:'seed',id:crop.id,icon:crop.icon,name:`${crop.name} 씨앗`},
      {type:'crop',id:crop.id,icon:crop.icon,name:crop.name}
    ])
  ].map(item=>({...item,count:lifeItemCount(item.type,item.id)})).filter(item=>item.count>0);
  document.getElementById('inventorySummary').textContent=`보유 재료 ${entries.reduce((sum,item)=>sum+item.count,0)}개`;
  document.getElementById('inventoryScroll').innerHTML=entries.length?
    `<div class="inventorySupplies">${entries.map(item=>`<div class="inventorySupply"><span>${item.icon}</span><b>${item.name}</b><strong>${item.count.toLocaleString()}개</strong></div>`).join('')}</div>`:
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
    const card=event.target.closest('.inventoryFishCard');
    if(!card) return;
    const show=!card.classList.contains('showName');
    document.querySelectorAll('.inventoryFishCard.showName').forEach(other=>other.classList.remove('showName'));
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
