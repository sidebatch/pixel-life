const INVENTORY_FISH_BY_ID=new Map(FISH_DATA.map(fish=>[fish.id,fish]));
const inventoryState={open:false,tab:'fish',detail:null};
const inventoryAppearanceIcons=new Map();

function isInventoryOpen(){return inventoryState.open;}
function isInventoryDetailOpen(){return Boolean(inventoryState.detail);}

function inventoryAppearanceIcon(type,id){
  const cacheKey=type+':'+id;
  if(inventoryAppearanceIcons.has(cacheKey))return inventoryAppearanceIcons.get(cacheKey);
  const image=type==='outfit'?characterOutfitImgs[id]?.walk:
    characterLayerImgs[CHARACTER_PARTS.backpack.get(id)?.walkBackpack];
  if(!image||typeof document.createElement!=='function')return '';
  const cell=CHARACTER_RIG.cell,icon=document.createElement('canvas');
  icon.width=icon.height=cell;
  const context=icon.getContext('2d');
  // Clothing front, backpack back: show the actual part, not the whole actor.
  context.drawImage(image,0,type==='backpack'?3*cell:0,cell,cell,0,0,cell,cell);
  const imageData=context.getImageData(0,0,cell,cell),pixels=imageData.data;
  // Rig layers can contain tiny palette-classified fragments of neighboring
  // parts. Keep the main connected garment/pack only in the UI thumbnail.
  const seen=new Uint8Array(cell*cell);let main=[];
  for(let start=0;start<seen.length;start++){
    if(seen[start]||!pixels[start*4+3])continue;
    const queue=[start],component=[];seen[start]=1;
    while(queue.length){
      const point=queue.pop(),x=point%cell,y=Math.floor(point/cell);component.push(point);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy,next=ny*cell+nx;
        if(nx<0||ny<0||nx>=cell||ny>=cell||seen[next]||!pixels[next*4+3])continue;
        seen[next]=1;queue.push(next);
      }
    }
    if(component.length>main.length)main=component;
  }
  const keep=new Set(main);
  const bounds=(type==='outfit'?CHARACTER_OUTFIT_BY_ID.get(id):CHARACTER_PARTS.backpack.get(id))?.iconCrop;
  for(let point=0;point<seen.length;point++){
    const x=point%cell,y=Math.floor(point/cell);
    if(!keep.has(point)||(bounds&&(x<bounds.x||y<bounds.y||x>=bounds.x+bounds.width||y>=bounds.y+bounds.height)))
      pixels[point*4+3]=0;
  }
  context.putImageData(imageData,0,0);
  let left=cell,top=cell,right=-1,bottom=-1;
  for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if(pixels[(y*cell+x)*4+3]){
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  if(right<left)return '';
  const crop=document.createElement('canvas');crop.width=right-left+1;crop.height=bottom-top+1;
  crop.getContext('2d').drawImage(icon,left,top,crop.width,crop.height,0,0,crop.width,crop.height);
  const url=crop.toDataURL();inventoryAppearanceIcons.set(cacheKey,url);return url;
}

function inventoryWearable(type,id){
  const appearance=normalizeSavedAppearance(GAME_STATE.appearance);
  if(type==='axe')return getOwnedForestryAxes().find(item=>item.id===id)||null;
  if(type==='rod')return FISHING_RODS.find(item=>item.id===id&&isFishingRodUnlocked(item))||null;
  if(type==='outfit')return appearance.ownedOutfitIds.includes(id)?CHARACTER_OUTFIT_BY_ID.get(id):null;
  if(type==='backpack')return appearance.ownedBackpackIds.includes(id)?CHARACTER_PARTS.backpack.get(id):null;
  return null;
}

function equipInventoryAppearance(type,id){
  if(!['outfit','backpack'].includes(type)||!inventoryWearable(type,id)||
    (typeof isChoppingTree==='function'&&isChoppingTree())||
    (typeof isFishingActive==='function'&&isFishingActive()))return false;
  const before=GAME_STATE.appearance;
  GAME_STATE.appearance={...normalizeSavedAppearance(before),[type==='outfit'?'outfitId':'backpackId']:id};
  if(saveGame())return true;
  GAME_STATE.appearance=before;return false;
}

function inventoryWearableArt(type,item){
  const url=type==='axe'?FORESTRY_AXE_URLS[item.asset]:type==='rod'?FISHING_ROD_URLS[item.asset]:
    item.iconUrl||inventoryAppearanceIcon(type,item.id||'pack.traveler');
  return `<img src="${url}" alt="">`;
}

function inventoryWearableCard(type,item,equipped){
  return `<div class="inventoryWearableSlot${equipped?' selected':''}">
    <button type="button" class="inventoryItemCard inventoryEquipmentCard${equipped?' equipped':''}" data-equip-type="${type}" data-equip-id="${item.id}" aria-pressed="${equipped}" aria-label="${item.name}${equipped?', 장착 중':', 장착하기'}">
      <span class="inventoryItemArt">${inventoryWearableArt(type,item)}</span>
      ${equipped?'<span class="inventorySelectedMark" aria-hidden="true">✓</span>':''}
      <span class="inventoryItemName" aria-hidden="true">${item.name}</span>
    </button>
    <button type="button" class="inventoryInfoButton" data-inventory-info-type="${type}" data-inventory-info-id="${item.id}" aria-label="${item.name} 상세 정보" aria-haspopup="dialog"><span aria-hidden="true">i</span></button>
  </div>`;
}

function selectHeldTool(tool){
  if(!['axe','rod'].includes(tool)) return false;
  if((typeof isChoppingTree==='function'&&isChoppingTree())||
    (typeof isFishingActive==='function'&&isFishingActive()))return false;
  const previous=GAME_STATE.appearance;
  if(previous?.activeTool===tool) return true;
  GAME_STATE.appearance={...normalizeSavedAppearance(previous),activeTool:tool};
  if(saveGame()) return true;
  GAME_STATE.appearance=previous;
  return false;
}

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

function renderInventoryEquipment(){
  const rods=FISHING_RODS.filter(rod=>isFishingRodUnlocked(rod));
  const equippedRod=getEquippedFishingRod();
  const equippedAxe=getEquippedForestryAxe();
  const appearance=normalizeSavedAppearance(GAME_STATE.appearance);
  document.getElementById('inventorySummary').textContent=`장착 ${appearance.activeTool==='rod'?equippedRod.name:equippedAxe.name}`;
  const equipment=[
    ...getOwnedForestryAxes().map(axe=>inventoryWearableCard('axe',axe,appearance.activeTool==='axe'&&axe.id===equippedAxe.id)),
    ...rods.map(rod=>inventoryWearableCard('rod',rod,appearance.activeTool==='rod'&&rod.id===equippedRod.id))
  ];
  document.getElementById('inventoryScroll').innerHTML=`<div class="inventoryItemGrid">${equipment.join('')}</div>`;
}

function renderInventoryAppearance(){
  const appearance=normalizeSavedAppearance(GAME_STATE.appearance);
  document.getElementById('inventorySummary').textContent='카드를 누르면 착용 · ⓘ 상세 정보';
  const outfits=appearance.ownedOutfitIds.map(id=>CHARACTER_OUTFIT_BY_ID.get(id));
  const packs=appearance.ownedBackpackIds.map(id=>({...CHARACTER_PARTS.backpack.get(id),id}));
  document.getElementById('inventoryScroll').innerHTML=`<section class="inventoryAppearanceSection" aria-label="옷">
    <h3>옷</h3><div class="inventoryItemGrid">${outfits.map(item=>inventoryWearableCard('outfit',item,item.id===appearance.outfitId)).join('')}</div>
    </section><section class="inventoryAppearanceSection" aria-label="가방">
    <h3>가방</h3><div class="inventoryItemGrid">${packs.map(item=>inventoryWearableCard('backpack',item,item.id===appearance.backpackId)).join('')}</div></section>`;
}

function openInventoryDetail(type,id,options={}){
  const item=inventoryWearable(type,id);
  if(!item||!inventoryState.open)return false;
  const appearance=normalizeSavedAppearance(GAME_STATE.appearance);
  const equipped=type==='axe'?appearance.activeTool==='axe'&&getEquippedForestryAxe().id===id:
    type==='rod'?appearance.activeTool==='rod'&&getEquippedFishingRod().id===id:
    appearance[type==='outfit'?'outfitId':'backpackId']===id;
  const labels={axe:'벌목 도구',rod:'낚시 도구',outfit:'옷',backpack:'가방'};
  const effects=type==='rod'?fishingRodEffectLabels(item):
    type==='axe'?[`타격 힘 ${item.damage}`,`벨 수 있는 나무: ${FOREST_SPECIES.filter(species=>FORESTRY_TREES[species].tier<=item.tier).map(species=>FOREST_WOOD[species]).join(' · ')}`]:
    ['외형용 · 능력치 변화 없음'];
  const description=item.description||(type==='axe'?'나무를 베는 도끼. 장착한 도끼의 힘으로 나무에 피해를 줍니다.':'여행자의 기본 의상. 걷기·낚시·벌목 동작에 함께 적용돼요.');
  document.getElementById('inventoryDetailContent').innerHTML=`<div class="inventoryDetailHero">
    <span>${inventoryWearableArt(type,{...item,id})}</span><div><small>${labels[type]}</small><h3 id="inventoryDetailTitle">${item.name}</h3></div></div>
    <p>${description}</p><ul>${effects.map(effect=>`<li>${effect}</li>`).join('')}</ul>
    <footer>${equipped?'✓ 현재 장착 중':'가방에서 카드를 누르면 장착할 수 있어요.'}</footer>`;
  inventoryState.detail={type,id};
  const modal=document.getElementById('inventoryDetailModal');
  modal.classList.add('show');modal.setAttribute('aria-hidden','false');
  document.getElementById('inventoryPanel').inert=true;
  document.getElementById('inventoryDetailClose').focus();
  if(!options.fromHistory)pushGameOverlayHistory('inventory-detail',type+':'+id);
  return true;
}

function closeInventoryDetail(options={}){
  if(!inventoryState.detail)return;
  const {type,id}=inventoryState.detail;
  inventoryState.detail=null;
  const modal=document.getElementById('inventoryDetailModal');
  modal.classList.remove('show');modal.setAttribute('aria-hidden','true');
  document.getElementById('inventoryPanel').inert=false;
  document.querySelector(`[data-inventory-info-type="${type}"][data-inventory-info-id="${id}"]`)?.focus({preventScroll:true});
  if(!options.fromHistory)leaveGameOverlayHistory('inventory-detail');
}

function renderInventorySupplies(){
  const entries=[
    {type:'material',id:'log',icon:'🪵',name:lifeItemName('material','log')},
    ...FOREST_SPECIES.map(species=>({type:'material',id:`${species}_log`,icon:'🪵',name:lifeItemName('material',`${species}_log`)})),
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
  else if(inventoryState.tab==='appearance') renderInventoryAppearance();
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
  if(isInventoryDetailOpen()){
    closeInventoryDetail(options);
    if(!options.fromHistory)return;
  }
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
  document.getElementById('inventoryDetailClose').addEventListener('click',closeInventoryDetail);
  document.getElementById('inventoryDetailModal').addEventListener('click',event=>{
    if(event.target.classList.contains('inventoryDetailBackdrop'))closeInventoryDetail();
  });
  document.getElementById('inventoryDetailModal').addEventListener('keydown',event=>{
    if(event.key==='Tab'){event.preventDefault();document.getElementById('inventoryDetailClose').focus();}
  });
  document.getElementById('inventoryScroll').addEventListener('click',event=>{
    const info=event.target.closest('[data-inventory-info-type]');
    if(info){
      openInventoryDetail(info.dataset.inventoryInfoType,info.dataset.inventoryInfoId);
      return;
    }
    const card=event.target.closest('.inventoryItemCard');
    if(!card) return;
    if(card.dataset.equipType){
      if(card.classList.contains('equipped')){
        card.classList.add('showName');return;
      }
      const success=card.dataset.equipType==='rod'?equipFishingRod(card.dataset.equipId):
        card.dataset.equipType==='axe'?equipForestryAxe(card.dataset.equipId):
        equipInventoryAppearance(card.dataset.equipType,card.dataset.equipId);
      if(success){
        renderInventory();
        document.getElementById('inventorySummary').textContent=`${inventoryWearable(card.dataset.equipType,card.dataset.equipId).name} 장착`;
        const selected=document.querySelector(`[data-equip-id="${card.dataset.equipId}"]`);
        selected?.classList.add('showName');selected?.focus({preventScroll:true});
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
