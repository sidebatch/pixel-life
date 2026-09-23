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
  document.getElementById('inventorySummary').textContent=`물고기 ${count.toLocaleString()}마리 · ${groups.length}종`;
  const scroll=document.getElementById('inventoryScroll');
  if(!groups.length){
    scroll.innerHTML='<div class="inventoryEmpty"><span>🐟</span><b>아직 낚은 물고기가 없어요</b><p>연못에서 낚으면 이곳에서 확인할 수 있어요.</p></div>';
    return;
  }
  scroll.innerHTML=groups.map((group,index)=>`<details class="inventorySpecies rarity-${group.fish.rarity}" ${index===0?'open':''}>
    <summary><span class="inventoryFishIcon"><img src="${getFishImageUrl(group.fish)}" alt=""></span>
      <span class="inventoryFishTitle"><b>${group.fish.name}</b><small>${group.count.toLocaleString()}마리 · 개별 크기와 가격 보기</small></span>
      <span class="inventoryChevron" aria-hidden="true">⌄</span></summary>
    <div class="inventoryCatchList">${group.entries.map(entry=>`<div class="inventoryCatchRow">
      <span>크기 <b>${entry.sizeCm.toFixed(1)}cm</b>${entry.quantity>1?` <small>×${entry.quantity}</small>`:''}</span>
      <span>판매가 <b>${entry.price.toLocaleString()}G</b></span>
    </div>`).join('')}</div>
  </details>`).join('');
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

function renderInventory(){
  document.querySelectorAll('[data-inventory-tab]').forEach(button=>{
    const active=button.dataset.inventoryTab===inventoryState.tab;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
  });
  if(inventoryState.tab==='fish') renderInventoryFish();
  else renderInventoryEquipment();
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
  document.querySelectorAll('[data-inventory-tab]').forEach(button=>{
    button.addEventListener('click',()=>{
      inventoryState.tab=button.dataset.inventoryTab;
      renderInventory();
      document.getElementById('inventoryScroll').scrollTop=0;
    });
  });
}
