const MARKET_FISH_BY_ID=new Map(FISH_DATA.map(fish=>[fish.id,fish]));
const MARKET_SHOPS=Object.freeze({
  elli:{name:'엘리의 상점',views:['rods','fish','rodRepairs'],defaultView:'home'},
  haru:{name:'하루의 농사 상점',views:['seeds','crops','orders','decorations'],defaultView:'home'},
  farm:{name:'농장 꾸미기',views:['decorations'],defaultView:'decorations'},
  workshop:{name:'준의 도구점',views:['supplies','wood','axes','axeRepairs','crafting'],defaultView:'home'}
});
// Add a service here and to a shop's views only when it has real content.
const MARKET_SERVICES=Object.freeze({
  supplies:{title:'구매',available:()=>true},
  seeds:{title:'구매',available:()=>LIFE_CONTENT.crops.length>0},
  rods:{title:'구매',available:()=>FISHING_RODS.some(rod=>!rod.requiresMasterReward&&!isFishingRodUnlocked(rod))},
  fish:{title:'판매',available:()=>groupInventoryFish().length>0},
  wood:{title:'판매',available:()=>GAME_STATE.inventory.some(item=>item.type==='material'&&item.quantity>0&&marketGoodDefinition(item.type,item.id))},
  crops:{title:'판매',available:()=>LIFE_CONTENT.crops.some(crop=>lifeItemCount('crop',crop.id)>0)},
  axes:{title:'업그레이드',available:()=>getOwnedForestryAxes().length<FORESTRY_AXES.length},
  axeRepairs:{title:'수리',available:()=>getOwnedForestryAxes().some(axe=>forestryAxeRepairCost(axe)>0)||getOwnedSwords().some(sword=>swordRepairCost(sword)>0)},
  crafting:{title:'제작',available:()=>!hasPortableWorkbench()},
  rodRepairs:{title:'수리',available:()=>FISHING_RODS.some(rod=>isFishingRodUnlocked(rod)&&fishingRodRepairCost(rod)>0)},
  orders:{title:'주문',available:()=>true},
  decorations:{title:'꾸미기',available:()=>true}
});
function marketAvailableViews(){return MARKET_SHOPS[marketState.shop].views.filter(view=>MARKET_SERVICES[view]?.available());}
function selectMarketView(view){
  if(!marketState.open||!(view==='home'||MARKET_SHOPS[marketState.shop].views.includes(view)))return;
  if(view!=='home'&&!MARKET_SERVICES[view]?.available())return;
  marketState.view=view;marketState.selection.clear();marketState.goodsSelection.clear();marketState.message='';
  renderMarket();document.getElementById('marketList').scrollTop=0;
  (view==='home'?(document.querySelector('[data-market-view]')||document.getElementById('marketClose')):document.getElementById('marketBackBtn'))?.focus();
}
const marketState={open:false,shop:'elli',view:'fish',selection:new Map(),goodsSelection:new Map(),message:''};
const marketCoinAnimation={frame:null,displayed:null};

function isMarketOpen(){return marketState.open;}

function setMarketCoinDisplay(amount){
  marketCoinAnimation.displayed=Math.round(amount);
  const text=marketCoinAnimation.displayed.toLocaleString();
  document.getElementById('coinCount').textContent=text;
  document.getElementById('marketCoinCount').textContent=text;
}

function finishMarketCoinAnimation(){
  if(marketCoinAnimation.frame!==null&&typeof cancelAnimationFrame==='function'){
    cancelAnimationFrame(marketCoinAnimation.frame);
  }
  marketCoinAnimation.frame=null;
  setMarketCoinDisplay(GAME_STATE.progression.coins);
  const gain=document.getElementById('marketCoinGain');
  gain.classList.remove('show');
  gain.textContent='';
  document.querySelector('.marketWallet').classList.remove('coinBump');
  document.querySelector('.coinPill').classList.remove('coinBump');
}

function animateMarketCoins(beforeCoins,afterCoins){
  if(marketCoinAnimation.frame!==null&&typeof cancelAnimationFrame==='function'){
    cancelAnimationFrame(marketCoinAnimation.frame);
  }
  marketCoinAnimation.frame=null;
  const from=marketCoinAnimation.displayed??beforeCoins;
  const reduced=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(reduced||typeof requestAnimationFrame!=='function'||from===afterCoins){
    setMarketCoinDisplay(afterCoins);
    return;
  }
  const wallet=document.querySelector('.marketWallet');
  const pill=document.querySelector('.coinPill');
  const gain=document.getElementById('marketCoinGain');
  gain.textContent=`+${(afterCoins-beforeCoins).toLocaleString()}`;
  wallet.classList.remove('coinBump');
  pill.classList.remove('coinBump');
  gain.classList.remove('show');
  void wallet.offsetWidth;
  wallet.classList.add('coinBump');
  pill.classList.add('coinBump');
  gain.classList.add('show');
  let startedAt=null;
  const step=now=>{
    if(startedAt===null) startedAt=now;
    const progress=Math.max(0,Math.min(1,(now-startedAt)/900));
    const eased=1-Math.pow(1-progress,3);
    setMarketCoinDisplay(from+(afterCoins-from)*eased);
    if(progress<1) marketCoinAnimation.frame=requestAnimationFrame(step);
    else marketCoinAnimation.frame=null;
  };
  marketCoinAnimation.frame=requestAnimationFrame(step);
}

// Inventory order is catch order. Selling from the front makes variable-size
// prices deterministic while the player chooses only species and quantity.
function planFishSale(selection,inventory=GAME_STATE.inventory){
  const requested=new Map();
  let count=0;
  for(const [id,quantity] of selection){
    if(!MARKET_FISH_BY_ID.has(id)||!Number.isSafeInteger(quantity)||quantity<0) return null;
    if(quantity>0){requested.set(id,quantity);count+=quantity;}
  }
  if(!Number.isSafeInteger(count)) return null;
  const remaining=[];
  let total=0;
  for(const item of inventory){
    if(item?.type!=='fish'||!requested.has(item.id)){
      remaining.push(item);
      continue;
    }
    const available=item.quantity;
    const price=item.price;
    if(!Number.isSafeInteger(available)||available<1||!Number.isSafeInteger(price)||price<0) return null;
    const sold=Math.min(available,requested.get(item.id));
    requested.set(item.id,requested.get(item.id)-sold);
    total+=sold*price;
    if(!Number.isSafeInteger(total)) return null;
    if(sold<available) remaining.push(sold?{...item,quantity:available-sold}:item);
  }
  if([...requested.values()].some(quantity=>quantity>0)) return null;
  return {inventory:remaining,count,total};
}

function marketGoodDefinition(type,id){
  if(type==='material'){
    if(typeof HUNTING_MATERIAL_BY_ID!=='undefined'&&HUNTING_MATERIAL_BY_ID.has(id))return {...HUNTING_MATERIAL_BY_ID.get(id),icon:''};
    const wood=id.endsWith('_log')&&FOREST_WOOD[id.slice(0,-4)];
    if(id==='log'||wood) return {name:lifeItemName('material',id),icon:'🪵',price:wood?FORESTRY_TREES[id.slice(0,-4)].logPrice:LIFE_CONTENT.logSellPrice};
  }
  if(type==='crop'&&LIFE_CROP_BY_ID.has(id)){
    const crop=LIFE_CROP_BY_ID.get(id);
    return {name:crop.name,icon:crop.icon,price:crop.sellPrice};
  }
  return null;
}

function planGoodsSale(selection,inventory=GAME_STATE.inventory){
  const requested=new Map();
  let total=0,count=0;
  for(const [itemKey,quantity] of selection){
    const [type,id]=itemKey.split(':');
    const good=marketGoodDefinition(type,id);
    if(!good||!Number.isSafeInteger(quantity)||quantity<0||quantity>lifeItemCount(type,id,inventory)) return null;
    if(quantity){requested.set(itemKey,quantity);count+=quantity;total+=quantity*good.price;}
  }
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(count)) return null;
  const remaining=[];
  for(const item of inventory){
    const itemKey=`${item.type}:${item.id}`;
    const sold=Math.min(item.quantity||0,requested.get(itemKey)||0);
    if(sold) requested.set(itemKey,requested.get(itemKey)-sold);
    if(sold<(item.quantity||0)) remaining.push(sold?{...item,quantity:item.quantity-sold}:item);
  }
  if([...requested.values()].some(value=>value>0)) return null;
  return {inventory:remaining,count,total};
}

function renderGoodsMarket(){
  const goods=(marketState.view==='wood'?
    [{type:'material',id:'log'},...FOREST_SPECIES.map(species=>({type:'material',id:`${species}_log`})),...HUNTING_MATERIALS.map(item=>({type:'material',id:item.id}))]:
    LIFE_CONTENT.crops.map(crop=>({type:'crop',id:crop.id})))
    .map(item=>({...item,definition:marketGoodDefinition(item.type,item.id),count:lifeItemCount(item.type,item.id)}))
    .filter(item=>item.count>0);
  const available=new Map(goods.map(item=>[`${item.type}:${item.id}`,item.count]));
  for(const [itemKey,quantity] of marketState.goodsSelection){
    const count=available.get(itemKey)||0;
    if(!count) marketState.goodsSelection.delete(itemKey);
    else if(quantity>count) marketState.goodsSelection.set(itemKey,count);
  }
  const plan=planGoodsSale(marketState.goodsSelection);
  document.getElementById('marketStock').textContent=`판매 가능한 ${marketState.view==='wood'?'재료':'작물'} ${goods.reduce((sum,item)=>sum+item.count,0)}개`;
  const list=document.getElementById('marketList'),scrollTop=list.scrollTop;
  list.innerHTML=(marketState.view==='crops'?skillCardMarkup('farming'):'')+(goods.length?goods.map(item=>{
    const itemKey=`${item.type}:${item.id}`,selected=marketState.goodsSelection.get(itemKey)||0;
    return `<div class="marketFishRow marketSaleRow" data-good-key="${itemKey}">
      <span class="marketGoodsIcon" aria-hidden="true">${lifeItemIconMarkup(item.type,item.id,item.definition.icon)}</span>
      <div class="marketFishBody"><div class="marketFishTop"><b>${item.definition.name}</b><span>보유 ${item.count}개</span></div>
      <small>개당 ${item.definition.price.toLocaleString()}코인</small>
      <span class="marketRowTotal">판매 합계 <b>${(selected*item.definition.price).toLocaleString()}코인</b></span></div>
      <div class="marketFishBottom"><div class="marketQty">
        <button type="button" data-good-action="minus" aria-label="${item.definition.name} 판매 수량 줄이기" ${selected?'':'disabled'}>−</button>
        <strong>${selected}</strong><button type="button" data-good-action="plus" aria-label="${item.definition.name} 판매 수량 늘리기" ${selected<item.count?'':'disabled'}>+</button></div>
        <div class="marketSelectionActions"><button type="button" class="marketAll marketReset" data-good-action="reset" aria-label="${item.definition.name} 판매 수량 초기화" ${selected?'':'disabled'}>취소</button>
        <button type="button" class="marketAll" data-good-action="all" aria-label="${item.definition.name} 전부 선택" ${selected<item.count?'':'disabled'}>전부</button></div>
      </div></div>`;
  }).join(''):`<div class="marketEmpty"><span>${marketState.view==='wood'?'🪵':'🌾'}</span><b>판매할 ${marketState.view==='wood'?'재료가':'작물이'} 없어요</b><p>${marketState.view==='wood'?'벌목하거나 사냥해서 재료를 모아 보세요.':'농장에서 작물을 수확해 보세요.'}</p></div>`);
  list.scrollTop=scrollTop;
  document.getElementById('marketTotal').textContent=`${plan?.count||0}개 · ${(plan?.total||0).toLocaleString()}코인`;
  document.getElementById('marketSellBtn').disabled=!plan||plan.count===0;
}

function renderSeedMarket(){
  document.getElementById('marketStock').textContent='씨앗은 한 번에 1개씩 살 수 있어요';
  const list=document.getElementById('marketList'),scrollTop=list.scrollTop;
  list.innerHTML=skillCardMarkup('farming')+LIFE_CONTENT.crops.map(crop=>`<div class="marketFishRow marketPurchaseRow">
    <span class="marketGoodsIcon" aria-hidden="true">${lifeItemIconMarkup('seed',crop.id,crop.icon)}</span>
    <div class="marketFishBody"><div class="marketFishTop"><b>${crop.name} 씨앗</b><span>보유 ${lifeItemCount('seed',crop.id)}개</span></div>
      <div class="marketFishBottom">
        <button type="button" class="marketSeedBuy" data-seed-id="${crop.id}" ${GAME_STATE.progression.coins>=crop.seedPrice?'':'disabled'}>구매 · ${crop.seedPrice.toLocaleString()}코인</button>
      </div></div></div>`).join('');
  list.scrollTop=scrollTop;
}

function equipmentCostChip(label,held,needed){
  return `<span class="${held>=needed?'ready':'missing'}">${label} ×${needed.toLocaleString()}</span>`;
}

function equipmentCardMarkup({id,asset,name,effect,status,details,costs='',note='',action='',active=false,open=false}){
  return `<details class="marketEquipmentCard${active?' equipped':''}" data-equipment-id="${id}" ${open?'open':''}>
    <summary><img src="${asset}" alt=""${id.startsWith('rod.')?' class="rodThickArt"':''}><span class="marketEquipmentCopy"><b>${name}</b><small>${effect}</small></span><span class="marketEquipmentStatus">${status}</span></summary>
    <div class="marketEquipmentDetail"><p>${details}</p>${costs?`<div class="marketEquipmentCosts">${costs}</div>`:''}${note?`<p class="marketEquipmentNote">${note}</p>`:''}${action}</div>
  </details>`;
}

function renderForestryMarket(){
  const repairing=marketState.view==='axeRepairs';
  const equipped=getEquippedForestryAxe(),next=nextForestryAxe();
  const axeActive=GAME_STATE.appearance?.activeTool==='axe';
  const ownedIds=new Set(getOwnedForestryAxes().map(axe=>axe.id));
  document.getElementById('marketStock').textContent=`현재 ${axeActive?equipped.name:'장착 없음'} · 벌목 Lv.${GAME_STATE.progression.logging.level}`;
  const catalog=FORESTRY_AXES.filter(axe=>repairing?ownedIds.has(axe.id)&&forestryAxeRepairCost(axe)>0:!ownedIds.has(axe.id)).map(axe=>{
    const owned=ownedIds.has(axe.id),active=axeActive&&equipped.id===axe.id;
    const durability=getForestryAxeDurability(axe),repairCost=owned?forestryAxeRepairCost(axe):0;
    const available=next?.id===axe.id;
    const missing=Object.entries(axe.materials).flatMap(([id,count])=>{
      const short=count-lifeItemCount('material',id);
      return short>0?[`${FOREST_WOOD[id.slice(0,-4)]} ${short}개`]:[];
    });
    if(GAME_STATE.progression.coins<axe.coins) missing.push(`코인 ${(axe.coins-GAME_STATE.progression.coins).toLocaleString()}`);
    const costs=owned?'':Object.entries(axe.materials).map(([id,count])=>
      equipmentCostChip(FOREST_WOOD[id.slice(0,-4)],lifeItemCount('material',id),count)).join('')+
      equipmentCostChip('코인',GAME_STATE.progression.coins,axe.coins);
    const note=owned?(durability.infinite?'기본 도끼는 내구도가 닳지 않아요.':durability.broken?
      '수리해도 자동으로 장착되지 않아요. 가방에서 다시 장착해 주세요.':
      '닳은 만큼만 수리할 수 있어요.'):
      !available?'이전 도끼를 먼저 구매해 주세요.':
      missing.length?`부족: ${missing.join(' · ')}`:
      '구매할 수 있어요.';
    const previousAxe=FORESTRY_AXES[axe.tier-2];
    const materialKinds=Object.keys(axe.materials).length;
    const repairAction=owned&&repairCost?`<button type="button" class="marketAxeUpgrade" data-repair-axe-id="${axe.id}" ${GAME_STATE.progression.coins>=repairCost?'':'disabled'}>수리 ${repairCost.toLocaleString()}코인</button>`:'';
    return equipmentCardMarkup({id:axe.id,asset:FORESTRY_AXE_URLS[axe.asset],name:axe.name,
      effect:owned?(durability.infinite?'내구도 무제한':
        `내구도 ${durability.current} / ${durability.max}`):
        `${axe.coins.toLocaleString()}코인${materialKinds?` · 목재 ${materialKinds}종`:''}`,
      status:durability.broken?'수리 필요':active?'장착 중':owned?'보유 중':available?'다음 도끼':'순서대로 구매',
      details:previousAxe?`${previousAxe.name}를 보유하면 제작이 열립니다. 높은 단계 나무일수록 한 번 칠 때 내구도가 더 많이 닳습니다.`:
        '처음부터 사용할 수 있는 기본 장비이며 내구도가 닳지 않습니다.',
      costs,note,active,open:available||durability.broken,
      action:owned?repairAction:`<button type="button" class="marketAxeUpgrade" data-axe-id="${axe.id}" ${canUpgradeForestryAxe(axe)?'':'disabled'}>${axe.name} 구매</button>`});
  }).join('');
  document.getElementById('marketList').innerHTML=skillCardMarkup('logging')+(catalog||(repairing?'':'<div class="marketEmpty"><b>모든 도끼를 보유하고 있어요</b></div>'));
  if(repairing){const list=document.getElementById('marketList'),axes=list.innerHTML;renderSwordRepairsMarket();const swords=list.innerHTML;list.innerHTML=axes+(swords||(!catalog?'<div class="marketEmpty"><b>수리할 장비가 없어요</b></div>':''));}
}

function renderSuppliesMarket(){
  document.getElementById('marketStock').textContent='여행에 필요한 물품';
  const returnItemCount=lifeItemCount('consumable',VILLAGE_RETURN_ITEM.id);
  const returnItem=`<div class="marketFishRow marketPurchaseRow" data-return-item="${VILLAGE_RETURN_ITEM.id}">
    <span class="marketGoodsIcon" aria-hidden="true">${VILLAGE_RETURN_ITEM.icon}</span>
    <div class="marketFishBody"><div class="marketFishTop"><b>${VILLAGE_RETURN_ITEM.name}</b><span>보유 ${returnItemCount.toLocaleString()}개</span></div>
      <small>어디서든 사용하면 마을 중앙 광장으로 돌아와요</small>
      <div class="marketFishBottom"><span>사용할 때 1개 소모</span>
        <button type="button" class="marketSeedBuy" data-buy-return-item="${VILLAGE_RETURN_ITEM.id}" ${GAME_STATE.progression.coins>=VILLAGE_RETURN_ITEM.price?'':'disabled'}>구매 · ${VILLAGE_RETURN_ITEM.price.toLocaleString()}코인</button>
      </div></div></div>`;
  document.getElementById('marketList').innerHTML=returnItem;
}

function renderRodMarket(){
  const repairing=marketState.view==='rodRepairs';
  const equipped=getEquippedFishingRod(),next=nextFishingRodForSale();
  document.getElementById('marketStock').textContent=`${GAME_STATE.appearance?.activeTool==='rod'?`현재 ${equipped.name}`:'낚싯대 미장착'} · 낚시 Lv.${GAME_STATE.progression.fishing.level}`;
  const catalog=FISHING_RODS.filter(rod=>repairing?isFishingRodUnlocked(rod)&&fishingRodRepairCost(rod)>0:!isFishingRodUnlocked(rod)&&!rod.requiresMasterReward).map(rod=>{
    const owned=isFishingRodUnlocked(rod),active=GAME_STATE.appearance?.activeTool==='rod'&&equipped.id===rod.id,available=next?.id===rod.id;
    const durability=getFishingRodDurability(rod),repairCost=owned?fishingRodRepairCost(rod):0;
    const durabilityText=durability.infinite?'내구도 무제한':`내구도 ${durability.current} / ${durability.max}`;
    const reward=rod.requiresMasterReward;
    const levelReady=reward||GAME_STATE.progression.fishing.level>=rod.unlockLevel;
    const masterReady=!rod.requiresMasterRod||isFishingRodUnlocked(FISHING_ROD_BY_ID.get('rod.master_angler'));
    const previousRod=FISHING_ROD_BY_ID.get(rod.requiresRodId);
    const missing=[];
    if(!levelReady) missing.push(`낚시 Lv.${rod.unlockLevel} 필요`);
    if(!masterReady) missing.push('도감 20종 완성 필요');
    if(previousRod&&!isFishingRodUnlocked(previousRod)) missing.push(`${previousRod.name} 구매 필요`);
    for(const [id,count] of Object.entries(rod.fishCost||{})){
      const short=count-lifeItemCount('fish',id);
      if(short>0) missing.push(`${MARKET_FISH_BY_ID.get(id).name} ${short}마리`);
    }
    if(rod.coins&&GAME_STATE.progression.coins<rod.coins) missing.push(`코인 ${(rod.coins-GAME_STATE.progression.coins).toLocaleString()}`);
    const costs=owned||reward?'':Object.entries(rod.fishCost).map(([id,count])=>
      equipmentCostChip(MARKET_FISH_BY_ID.get(id).name,lifeItemCount('fish',id),count)).join('')+
      equipmentCostChip('코인',GAME_STATE.progression.coins,rod.coins);
    const note=owned?(durability.broken?'망가짐 · 수리한 뒤 가방에서 다시 장착해 주세요.':'가방의 장비 탭에서 장착할 수 있어요.'):reward?'물고기 도감 20종을 완성하면 받아요.':
      !available?'이전 낚싯대를 먼저 구매해 주세요.':missing.length?`부족: ${missing.join(' · ')}`:'구매할 수 있어요.';
    return equipmentCardMarkup({id:rod.id,asset:FISHING_ROD_URLS[rod.asset],name:rod.name,
      effect:owned?durabilityText:fishingRodEffectLabels(rod)[0],status:owned&&durability.broken?'수리 필요':active?'장착 중':owned?'보유 중':reward?'도감 보상':available?'다음 낚싯대':'순서대로 구매',
      details:`${rod.description} ${fishingRodEffectLabels(rod).join(' · ')} · ${owned?durabilityText:durability.infinite?'내구도 무제한':`최대 내구도 ${durability.max}`}${durability.infinite?'':' · 획득 시 내륙·해안 1 / 바다 6~12 감소'}`,costs,note,active,open:available||(owned&&durability.broken),
      action:repairCost?`<button type="button" class="marketAxeUpgrade" data-repair-rod-id="${rod.id}" ${GAME_STATE.regionId==='lilacVillage'&&GAME_STATE.progression.coins>=repairCost&&!isFishingActive()?'':'disabled'}>수리 · ${repairCost.toLocaleString()}코인</button>`:owned||reward?'':`<button type="button" class="marketAxeUpgrade" data-rod-id="${rod.id}" ${canPurchaseFishingRod(rod)?'':'disabled'}>${rod.name} 구매</button>`});
  }).join('');
  document.getElementById('marketList').innerHTML=skillCardMarkup('fishing')+(catalog||(repairing?'<div class="marketEmpty"><b>수리할 낚싯대가 없어요</b><p>모든 낚싯대의 내구도가 가득해요.</p></div>':'<div class="marketEmpty"><b>구매할 낚싯대를 모두 보유하고 있어요</b></div>'));
}

function buyMarketSeed(cropId){
  if(marketState.shop!=='haru'||marketState.view!=='seeds') return false;
  const crop=LIFE_CROP_BY_ID.get(cropId);
  if(!crop||GAME_STATE.progression.coins<crop.seedPrice) return false;
  const success=commitLifeChange(()=>{
    GAME_STATE.progression.coins-=crop.seedPrice;
    addLifeItem('seed',crop.id,1);
    return true;
  });
  marketState.message=success?`${crop.name} 씨앗 1개를 샀어요`:'저장하지 못했어요. 다시 시도해 주세요.';
  if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);if(typeof playCoinSpendSound==='function')playCoinSpendSound();}
  renderMarket();return Boolean(success);
}

function sellSelectedGoods(){
  if(!((marketState.shop==='haru'&&marketState.view==='crops')||
    (marketState.shop==='workshop'&&marketState.view==='wood'))) return false;
  const type=marketState.view==='wood'?'material':'crop';
  if([...marketState.goodsSelection.keys()].some(key=>!key.startsWith(`${type}:`))) return false;
  const plan=planGoodsSale(marketState.goodsSelection);
  if(!plan||!plan.count) return false;
  const beforeInventory=GAME_STATE.inventory,beforeCoins=GAME_STATE.progression.coins;
  if(!Number.isSafeInteger(beforeCoins+plan.total)) return false;
  GAME_STATE.inventory=plan.inventory;GAME_STATE.progression.coins+=plan.total;
  if(!saveGame()){
    GAME_STATE.inventory=beforeInventory;GAME_STATE.progression.coins=beforeCoins;
    marketState.message='저장하지 못했어요. 다시 시도해 주세요.';
    renderMarket();return false;
  }
  marketState.goodsSelection.clear();
  marketState.message=`판매 완료! +${plan.total.toLocaleString()}`;
  playMarketSaleSound();animateMarketCoins(beforeCoins,GAME_STATE.progression.coins);
  renderMarket();return true;
}

function renderMarket(){
  const shop=MARKET_SHOPS[marketState.shop]||MARKET_SHOPS.elli;
  if(marketState.view!=='home'&&!shop.views.includes(marketState.view)) marketState.view=shop.defaultView;
  const home=marketState.view==='home',tabs=document.querySelector('.marketTabs'),availableViews=home?marketAvailableViews():[];
  document.getElementById('marketPanel').classList.toggle('marketServiceChooser',home);
  document.querySelector('.marketGreeting').hidden=home&&availableViews.length>0;
  document.querySelector('.marketRule').hidden=home&&availableViews.length>0;
  tabs.hidden=!home;
  tabs.innerHTML=home?availableViews.map(view=>`<button type="button" data-market-view="${view}">${MARKET_SERVICES[view].title}</button>`).join(''):'';
  document.getElementById('marketBackBtn').hidden=home||shop.defaultView!=='home';
  document.getElementById('marketShopName').textContent=shop.name;
  document.getElementById('marketPanel').setAttribute('aria-label',shop.name);
  document.getElementById('marketTitle').textContent={home:'서비스 선택',fish:'물고기 판매',crops:'작물 판매',seeds:'씨앗 구매',rods:'낚싯대 구매',rodRepairs:'낚싯대 수리',wood:'재료 판매',axes:'도끼 업그레이드',axeRepairs:'장비 수리',crafting:'제작대 만들기',supplies:'귀환석 구매',orders:'농장 주문',decorations:'농장 꾸미기'}[marketState.view];
  document.querySelector('.marketGreeting').textContent={fish:'엘리: 어떤 물고기를 팔고 싶어?',
    crops:'하루: 수확한 작물을 보여 줘!',seeds:'하루: 어떤 씨앗이 필요해?',rods:'엘리: 어떤 낚싯대가 필요해?',
    home:'필요한 서비스를 골라 주세요.',wood:'준: 목재나 사냥 재료를 가져왔어?',axes:'준: 다음 도끼를 준비해 볼까?',axeRepairs:'준: 닳은 도끼와 검을 고쳐 줄게!',crafting:'준: 가지고 다닐 제작대를 만들어 줄게!',rodRepairs:'엘리: 닳은 낚싯대를 고쳐 줄게!',supplies:'준: 여행 전에 귀환석을 챙겨 가!',
    orders:'하루: 농장에서 키운 작물들을 부탁해!',decorations:'납품으로 모은 교환권으로 농장을 꾸며보세요.'}[marketState.view];
  document.querySelector('.marketRule').textContent=marketState.view==='orders'?'필요한 작물을 모아 하루에게 납품하세요.':
    marketState.view==='decorations'?'교환한 소품은 가방 → 농장에 보관돼요. 농장에서 설치하기를 눌러 주세요.':
    marketState.view==='fish'?'같은 어종은 먼저 낚은 물고기부터 판매돼요.':
    marketState.view==='crops'?'수확한 작물을 원하는 수량만큼 팔 수 있어요.':
    marketState.view==='wood'?'목재와 사냥 재료를 원하는 수량만큼 팔 수 있어요.':
    marketState.view==='axes'?'목재와 코인으로 다음 단계 도끼를 구매해요. 장착은 가방에서 해 주세요.':
    ['axeRepairs','rodRepairs'].includes(marketState.view)?'닳은 장비만 표시돼요. 수리 비용은 사용한 내구도에 따라 달라요.':
    marketState.view==='rods'?'물고기와 코인으로 낚싯대를 구매해요. 도감 기록은 남고 장착은 가방에서 해 주세요.':'';
  document.getElementById('marketMessage').textContent=marketState.message;
  const noSale=!['fish','wood','crops'].includes(marketState.view);
  document.querySelector('.marketActions').classList.toggle('singleAction',noSale);
  document.querySelector('.marketTotalLine').hidden=noSale;
  document.getElementById('marketSellBtn').hidden=noSale;
  document.getElementById('marketTotalLabel').textContent=marketState.view==='fish'?'선택한 물고기':marketState.view==='wood'?'선택한 재료':'선택한 작물';
  document.getElementById('marketSellBtn').textContent=marketState.view==='fish'?'선택한 물고기 판매':marketState.view==='wood'?'선택한 재료 판매':'선택한 작물 판매';
  document.getElementById('marketStock').hidden=home;
  document.getElementById('marketList').hidden=home;
  if(home){
    document.getElementById('marketList').innerHTML='';
    document.querySelector('.marketRule').textContent='';
    if(!marketAvailableViews().length){
      document.querySelector('.marketGreeting').textContent='지금 이용할 서비스가 없어요.';
      document.querySelector('.marketRule').textContent='판매할 물건을 모으거나 장비가 닳으면 다시 찾아와 주세요.';
    }
    return;
  }
  if(marketState.view==='orders'){ensureFarmOrder();renderFarmOrdersMarket();return;}
  if(marketState.view==='decorations'){renderFarmDecorationsMarket();return;}
  if(marketState.view==='seeds'){renderSeedMarket();return;}
  if(marketState.view==='rods'||marketState.view==='rodRepairs'){renderRodMarket();return;}
  if(marketState.view==='axes'||marketState.view==='axeRepairs'){renderForestryMarket();return;}
  if(marketState.view==='supplies'){renderSuppliesMarket();return;}
  if(marketState.view==='crafting'){renderWorkbenchMarket();return;}
  if(marketState.view==='crops'||marketState.view==='wood'){renderGoodsMarket();return;}
  const groups=groupInventoryFish();
  const availableById=new Map(groups.map(group=>[group.fish.id,group.count]));
  for(const [id,quantity] of marketState.selection){
    const available=availableById.get(id)||0;
    if(!available) marketState.selection.delete(id);
    else if(quantity>available) marketState.selection.set(id,available);
  }
  const plan=planFishSale(marketState.selection);
  document.getElementById('marketMessage').textContent=marketState.message;
  document.getElementById('marketStock').textContent=`보유 물고기 ${groups.reduce((sum,group)=>sum+group.count,0).toLocaleString()}마리`;
  const list=document.getElementById('marketList');
  const scrollTop=list.scrollTop;
  if(!groups.length){
    list.innerHTML='<div class="marketEmpty"><span>🐟</span><b>판매할 물고기가 없어요</b><p>낚시로 물고기를 잡아 다시 찾아와 주세요.</p></div>';
  }else{
    list.innerHTML=groups.map(group=>{
      const selected=marketState.selection.get(group.fish.id)||0;
      const {minPrice,maxPrice}=group.entries.reduce((range,entry)=>({
        minPrice:Math.min(range.minPrice,entry.price),
        maxPrice:Math.max(range.maxPrice,entry.price)
      }),{minPrice:Infinity,maxPrice:0});
      const lineTotal=selected?planFishSale(new Map([[group.fish.id,selected]])).total:0;
      return `<div class="marketFishRow marketSaleRow" data-fish-id="${group.fish.id}">
        <img src="${getFishImageUrl(group.fish)}" alt="">
        <div class="marketFishBody">
          <div class="marketFishTop"><b>${group.fish.name}</b><span>보유 ${group.count.toLocaleString()}마리</span></div>
          <small>마리당 ${minPrice===maxPrice?minPrice.toLocaleString():`${minPrice.toLocaleString()}~${maxPrice.toLocaleString()}`}코인</small>
          <span class="marketRowTotal">판매 합계 <b>${lineTotal.toLocaleString()}코인</b></span>
        </div>
          <div class="marketFishBottom">
            <div class="marketQty"><button type="button" data-market-action="minus" aria-label="${group.fish.name} 판매 수량 줄이기" ${selected===0?'disabled':''}>−</button><strong>${selected}</strong><button type="button" data-market-action="plus" aria-label="${group.fish.name} 판매 수량 늘리기" ${selected>=group.count?'disabled':''}>+</button></div>
            <div class="marketSelectionActions"><button type="button" class="marketAll marketReset" data-market-action="reset" aria-label="${group.fish.name} 판매 수량 초기화" ${selected?'':'disabled'}>취소</button>
            <button type="button" class="marketAll" data-market-action="all" aria-label="${group.fish.name} 전부 선택" ${selected>=group.count?'disabled':''}>전부</button></div>
          </div>
      </div>`;
    }).join('');
  }
  list.scrollTop=scrollTop;
  document.getElementById('marketTotal').textContent=`${plan?.count||0}마리 · ${Number(plan?.total||0).toLocaleString()}코인`;
  document.getElementById('marketSellBtn').disabled=!plan||plan.count===0;
}

function sellSelectedFish(){
  if(marketState.shop!=='elli'||marketState.view!=='fish') return false;
  const plan=planFishSale(marketState.selection);
  if(!plan||plan.count===0) return false;
  const beforeInventory=GAME_STATE.inventory;
  const beforeCoins=GAME_STATE.progression.coins;
  if(!Number.isSafeInteger(beforeCoins+plan.total)) return false;
  GAME_STATE.inventory=plan.inventory;
  GAME_STATE.progression.coins=beforeCoins+plan.total;
  if(!saveGame()){
    GAME_STATE.inventory=beforeInventory;
    GAME_STATE.progression.coins=beforeCoins;
    marketState.message='저장하지 못했어요. 다시 시도해 주세요.';
    renderMarket();
    return false;
  }
  marketState.selection.clear();
  marketState.message=`판매 완료! +${plan.total.toLocaleString()}`;
  playMarketSaleSound();
  animateMarketCoins(beforeCoins,GAME_STATE.progression.coins);
  renderMarket();
  return true;
}

function openMarket(options={}){
  if(marketState.open||(typeof isFishingActive==='function'&&isFishingActive())) return;
  toggleMenu(false);
  marketState.open=true;
  marketState.shop=MARKET_SHOPS[options.shop]?options.shop:'elli';
  marketState.view=MARKET_SHOPS[marketState.shop].defaultView;
  marketState.selection.clear();
  marketState.goodsSelection.clear();
  marketState.message='';
  menuOpen=true;
  clearMovement();
  finishMarketCoinAnimation();
  renderMarket();
  const panel=document.getElementById('marketPanel');
  panel.classList.add('show');
  panel.setAttribute('aria-hidden','false');
  document.getElementById('marketList').scrollTop=0;
  document.getElementById('marketClose').focus();
  if(!options.fromHistory) pushGameOverlayHistory('market',marketState.shop);
}

function closeMarket(options={}){
  if(!marketState.open) return;
  marketState.open=false;
  marketState.selection.clear();
  marketState.goodsSelection.clear();
  menuOpen=false;
  finishMarketCoinAnimation();
  const panel=document.getElementById('marketPanel');
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory) leaveGameOverlayHistory('market');
}

if(typeof document!=='undefined'){
  document.getElementById('marketClose').addEventListener('click',closeMarket);
  document.getElementById('marketExitBtn').addEventListener('click',closeMarket);
  document.getElementById('marketSellBtn').addEventListener('click',()=>{
    if(marketState.view==='fish') sellSelectedFish();
    else if(marketState.view==='crops'||marketState.view==='wood') sellSelectedGoods();
  });
  document.getElementById('marketBackBtn').addEventListener('click',()=>selectMarketView('home'));
  document.querySelector('.marketTabs').addEventListener('click',event=>{const button=event.target.closest('[data-market-view]');if(button)selectMarketView(button.dataset.marketView);});
  document.getElementById('marketList').addEventListener('click',event=>{
    if(marketState.view==='orders'||marketState.view==='decorations'){
      const button=event.target.closest('[data-farm-action]');if(!button||button.disabled)return;
      const action=button.dataset.farmAction;
      if(action==='deliver')deliverFarmOrder(button.dataset.orderId);
      else if(action==='exchange')exchangeFarmDecoration(button.dataset.decorationId);
      else if(action==='place'||action==='remove')setFarmDecorationPlaced(button.dataset.decorationId,action==='place');
      else if(action==='show-decorations'){marketState.view='decorations';marketState.message='';renderMarket();}
      else if(action==='retry-order'){marketState.message='';renderMarket();}
      return;
    }
    if(['axes','axeRepairs','supplies','crafting'].includes(marketState.view)){
      if(marketState.shop!=='workshop') return;
      const benchButton=event.target.closest('[data-make-workbench]');
      if(benchButton){if(benchButton.disabled||marketState.view!=='crafting')return;const success=makePortableWorkbench();marketState.message=success?'제작대를 만들었어요. 가방 → 재료에서 사용할 수 있어요.':'제작하지 못했어요. 목재와 저장 상태를 확인해 주세요.';if(success)playEquipmentRepairSound('axe');renderMarket();return;}
      const swordButton=event.target.closest('[data-repair-sword]');
      if(swordButton){if(swordButton.disabled||marketState.view!=='axeRepairs')return;const success=repairSword(swordButton.dataset.repairSword);marketState.message=success?'검 수리를 마쳤어요. 가방에서 장착해 주세요.':'수리하지 못했어요.';if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);playEquipmentRepairSound('axe');}renderMarket();return;}
      const returnItemButton=event.target.closest('[data-buy-return-item]');
      if(returnItemButton){
        if(returnItemButton.disabled||marketState.view!=='supplies')return;
        const success=buyVillageReturnItem();
        marketState.message=success?`${VILLAGE_RETURN_ITEM.name} 1개를 샀어요. 가방의 재료 탭에서 사용할 수 있어요.`:`${VILLAGE_RETURN_ITEM.name}을 구매하지 못했어요.`;
        if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);playCoinSpendSound();}
        renderMarket();return;
      }
      const repairButton=event.target.closest('[data-repair-axe-id]');
      if(repairButton){
        if(repairButton.disabled||marketState.view!=='axeRepairs')return;
        const axe=FORESTRY_AXE_BY_ID.get(repairButton.dataset.repairAxeId);
        const cost=forestryAxeRepairCost(axe);
        const wasEquipped=GAME_STATE.appearance?.activeTool==='axe'&&getEquippedForestryAxe().id===axe.id;
        const success=repairForestryAxe(axe.id);
        marketState.message=success?`${axe.name} 수리 완료! -${cost.toLocaleString()}코인${wasEquipped?'':' · 가방에서 다시 장착해 주세요.'}`:'도끼를 수리하지 못했어요.';
        if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);playEquipmentRepairSound('axe');}
        renderMarket();return;
      }
      const button=event.target.closest('[data-axe-id]');
      if(!button||button.disabled||marketState.view!=='axes') return;
      const axe=FORESTRY_AXE_BY_ID.get(button.dataset.axeId);
      const success=upgradeForestryAxe(button.dataset.axeId);
      marketState.message=success?`${axe.name}를 구매했어요! 가방에서 장착해 주세요.`:'도끼를 구매하지 못했어요.';
      if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);playEquipmentPurchaseSound('axe');}
      renderMarket();return;
    }
    if(marketState.view==='rods'||marketState.view==='rodRepairs'){
      if(marketState.shop!=='elli') return;
      const repairButton=event.target.closest('[data-repair-rod-id]');
      if(repairButton){
        if(repairButton.disabled||marketState.view!=='rodRepairs')return;
        const rod=FISHING_ROD_BY_ID.get(repairButton.dataset.repairRodId),cost=fishingRodRepairCost(rod);
        const wasEquipped=GAME_STATE.appearance?.activeTool==='rod'&&getEquippedFishingRod().id===rod.id;
        const success=repairFishingRod(rod.id);
        marketState.message=success?`${rod.name} 수리 완료! -${cost.toLocaleString()}코인${wasEquipped?'':' · 가방에서 다시 장착해 주세요.'}`:'낚싯대를 수리하지 못했어요. 다시 시도해 주세요.';
        if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);playEquipmentRepairSound('rod');}
        renderMarket();return;
      }
      const button=event.target.closest('[data-rod-id]');
      if(!button||button.disabled||marketState.view!=='rods') return;
      const rod=FISHING_ROD_BY_ID.get(button.dataset.rodId);
      const success=purchaseFishingRod(button.dataset.rodId);
      marketState.message=success?`${rod.name}를 구매했어요! 가방에서 장착해 주세요.`:'낚싯대를 구매하지 못했어요.';
      if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);playEquipmentPurchaseSound('rod');}
      renderMarket();return;
    }
    if(marketState.view==='seeds'){
      const button=event.target.closest('[data-seed-id]');
      if(button&&!button.disabled) buyMarketSeed(button.dataset.seedId);
      return;
    }
    if(marketState.view==='crops'||marketState.view==='wood'){
      const button=event.target.closest('[data-good-action]');
      if(!button||button.disabled) return;
      const itemKey=button.closest('[data-good-key]')?.dataset.goodKey;
      const [type,id]=(itemKey||'').split(':');
      const count=lifeItemCount(type,id),selected=marketState.goodsSelection.get(itemKey)||0;
      if(!count) return;
      const next=button.dataset.goodAction==='reset'?0:button.dataset.goodAction==='all'?count:
        Math.max(0,Math.min(count,selected+(button.dataset.goodAction==='plus'?1:-1)));
      if(next) marketState.goodsSelection.set(itemKey,next);
      else marketState.goodsSelection.delete(itemKey);
      marketState.message='';renderMarket();return;
    }
    const button=event.target.closest('[data-market-action]');
    if(!button||button.disabled) return;
    const id=button.closest('[data-fish-id]')?.dataset.fishId;
    const group=groupInventoryFish().find(entry=>entry.fish.id===id);
    if(!group) return;
    const selected=marketState.selection.get(id)||0;
    const next=button.dataset.marketAction==='reset'?0:button.dataset.marketAction==='all'?group.count:
      Math.max(0,Math.min(group.count,selected+(button.dataset.marketAction==='plus'?1:-1)));
    if(next) marketState.selection.set(id,next);
    else marketState.selection.delete(id);
    marketState.message='';
    renderMarket();
    const replacement=document.querySelector(`[data-fish-id="${id}"] [data-market-action="${button.dataset.marketAction}"]`);
    if(replacement&&!replacement.disabled) replacement.focus();
  });
}
