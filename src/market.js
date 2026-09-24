const MARKET_FISH_BY_ID=new Map(FISH_DATA.map(fish=>[fish.id,fish]));
const marketState={open:false,view:'fish',selection:new Map(),goodsSelection:new Map(),message:''};
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
  if(type==='material'&&id==='log') return {name:'통나무',icon:'🪵',price:LIFE_CONTENT.logSellPrice};
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
  const goods=[{type:'material',id:'log'},...LIFE_CONTENT.crops.map(crop=>({type:'crop',id:crop.id}))]
    .map(item=>({...item,definition:marketGoodDefinition(item.type,item.id),count:lifeItemCount(item.type,item.id)}))
    .filter(item=>item.count>0);
  const available=new Map(goods.map(item=>[`${item.type}:${item.id}`,item.count]));
  for(const [itemKey,quantity] of marketState.goodsSelection){
    const count=available.get(itemKey)||0;
    if(!count) marketState.goodsSelection.delete(itemKey);
    else if(quantity>count) marketState.goodsSelection.set(itemKey,count);
  }
  const plan=planGoodsSale(marketState.goodsSelection);
  document.getElementById('marketStock').textContent=`판매 가능한 재료 ${goods.reduce((sum,item)=>sum+item.count,0)}개`;
  const list=document.getElementById('marketList'),scrollTop=list.scrollTop;
  list.innerHTML=goods.length?goods.map(item=>{
    const itemKey=`${item.type}:${item.id}`,selected=marketState.goodsSelection.get(itemKey)||0;
    return `<div class="marketFishRow" data-good-key="${itemKey}">
      <span class="marketGoodsIcon" aria-hidden="true">${item.definition.icon}</span>
      <div class="marketFishBody"><div class="marketFishTop"><b>${item.definition.name}</b><span>보유 ${item.count}개</span></div>
      <small>한 개 ${item.definition.price.toLocaleString()}</small>
      <div class="marketFishBottom"><div class="marketQty">
        <button type="button" data-good-action="minus" aria-label="${item.definition.name} 판매 수량 줄이기" ${selected?'':'disabled'}>−</button>
        <strong>${selected}</strong><button type="button" data-good-action="plus" aria-label="${item.definition.name} 판매 수량 늘리기" ${selected<item.count?'':'disabled'}>+</button></div>
        <button type="button" class="marketAll" data-good-action="all" ${selected<item.count?'':'disabled'}>전부</button>
        <span class="marketRowTotal">${(selected*item.definition.price).toLocaleString()}</span></div></div></div>`;
  }).join(''):'<div class="marketEmpty"><span>🪵</span><b>판매할 재료가 없어요</b><p>벌목하거나 농작물을 수확해 보세요.</p></div>';
  list.scrollTop=scrollTop;
  document.getElementById('marketTotal').textContent=`${plan?.count||0}개 · ${(plan?.total||0).toLocaleString()}`;
  document.getElementById('marketSellBtn').disabled=!plan||plan.count===0;
}

function renderSeedMarket(){
  document.getElementById('marketStock').textContent='씨앗은 한 번에 1개씩 살 수 있어요';
  const list=document.getElementById('marketList'),scrollTop=list.scrollTop;
  list.innerHTML=LIFE_CONTENT.crops.map(crop=>`<div class="marketFishRow">
    <span class="marketGoodsIcon" aria-hidden="true">${crop.icon}</span>
    <div class="marketFishBody"><div class="marketFishTop"><b>${crop.name} 씨앗</b><span>보유 ${lifeItemCount('seed',crop.id)}개</span></div>
      <small>${Math.round(crop.growMs/60000)}분 성장 · ${crop.seedPrice.toLocaleString()}코인</small>
      <div class="marketFishBottom"><span>수확 ${crop.harvestMin}~${crop.harvestMax}개</span>
        <button type="button" class="marketSeedBuy" data-seed-id="${crop.id}" ${GAME_STATE.progression.coins>=crop.seedPrice?'':'disabled'}>구매</button>
      </div></div></div>`).join('');
  list.scrollTop=scrollTop;
}

function buyMarketSeed(cropId){
  const crop=LIFE_CROP_BY_ID.get(cropId);
  if(!crop||GAME_STATE.progression.coins<crop.seedPrice) return false;
  const success=commitLifeChange(()=>{
    GAME_STATE.progression.coins-=crop.seedPrice;
    addLifeItem('seed',crop.id,1);
    return true;
  });
  marketState.message=success?`${crop.name} 씨앗 1개를 샀어요`:'저장하지 못했어요. 다시 시도해 주세요.';
  if(success) setMarketCoinDisplay(GAME_STATE.progression.coins);
  renderMarket();return Boolean(success);
}

function sellSelectedGoods(){
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
  document.querySelectorAll('[data-market-view]').forEach(button=>{
    const active=button.dataset.marketView===marketState.view;
    button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));
  });
  document.getElementById('marketTitle').textContent={fish:'물고기 판매',goods:'재료 판매',seeds:'씨앗 구매'}[marketState.view];
  document.querySelector('.marketGreeting').textContent={fish:'엘리: 어떤 물고기를 팔고 싶어?',
    goods:'엘리: 어떤 재료를 팔고 싶어?',seeds:'엘리: 농장에 심을 씨앗을 골라 봐!'}[marketState.view];
  document.querySelector('.marketRule').textContent=marketState.view==='fish'?'같은 어종은 먼저 낚은 물고기부터 판매돼요.':
    marketState.view==='goods'?'통나무와 수확한 작물을 원하는 수량만큼 팔 수 있어요.':'씨앗을 사서 햇살 농장의 빈 밭에 심어 보세요.';
  document.getElementById('marketMessage').textContent=marketState.message;
  const seeds=marketState.view==='seeds';
  document.querySelector('.marketTotalLine').hidden=seeds;
  document.getElementById('marketSellBtn').hidden=seeds;
  document.getElementById('marketTotalLabel').textContent=marketState.view==='fish'?'선택한 물고기':'선택한 재료';
  document.getElementById('marketSellBtn').textContent=marketState.view==='goods'?'선택한 재료 판매':'선택한 물고기 판매';
  if(seeds){renderSeedMarket();return;}
  if(marketState.view==='goods'){renderGoodsMarket();return;}
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
      return `<div class="marketFishRow" data-fish-id="${group.fish.id}">
        <img src="${getFishImageUrl(group.fish)}" alt="">
        <div class="marketFishBody">
          <div class="marketFishTop"><b>${group.fish.name}</b><span>보유 ${group.count.toLocaleString()}마리</span></div>
          <small>한 마리 ${minPrice===maxPrice?minPrice.toLocaleString():`${minPrice.toLocaleString()}~${maxPrice.toLocaleString()}`}</small>
          <div class="marketFishBottom">
            <div class="marketQty"><button type="button" data-market-action="minus" aria-label="${group.fish.name} 판매 수량 줄이기" ${selected===0?'disabled':''}>−</button><strong>${selected}</strong><button type="button" data-market-action="plus" aria-label="${group.fish.name} 판매 수량 늘리기" ${selected>=group.count?'disabled':''}>+</button></div>
            <button type="button" class="marketAll" data-market-action="all" aria-label="${group.fish.name} 전부 선택" ${selected>=group.count?'disabled':''}>전부</button>
            <span class="marketRowTotal">${selected?lineTotal.toLocaleString():'0'}</span>
          </div>
        </div>
      </div>`;
    }).join('');
  }
  list.scrollTop=scrollTop;
  document.getElementById('marketTotal').textContent=`${plan?.count||0}마리 · ${Number(plan?.total||0).toLocaleString()}`;
  document.getElementById('marketSellBtn').disabled=!plan||plan.count===0;
}

function sellSelectedFish(){
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
  marketState.view='fish';
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
  if(!options.fromHistory) pushGameOverlayHistory('market');
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
    else if(marketState.view==='goods') sellSelectedGoods();
  });
  document.querySelectorAll('[data-market-view]').forEach(button=>button.addEventListener('click',()=>{
    marketState.view=button.dataset.marketView;
    marketState.selection.clear();marketState.goodsSelection.clear();marketState.message='';
    renderMarket();document.getElementById('marketList').scrollTop=0;
  }));
  document.getElementById('marketList').addEventListener('click',event=>{
    if(marketState.view==='seeds'){
      const button=event.target.closest('[data-seed-id]');
      if(button&&!button.disabled) buyMarketSeed(button.dataset.seedId);
      return;
    }
    if(marketState.view==='goods'){
      const button=event.target.closest('[data-good-action]');
      if(!button||button.disabled) return;
      const itemKey=button.closest('[data-good-key]')?.dataset.goodKey;
      const [type,id]=(itemKey||'').split(':');
      const count=lifeItemCount(type,id),selected=marketState.goodsSelection.get(itemKey)||0;
      if(!count) return;
      const next=button.dataset.goodAction==='all'?count:
        Math.max(0,Math.min(count,selected+(button.dataset.goodAction==='plus'?1:-1)));
      if(next) marketState.goodsSelection.set(itemKey,next);
      else marketState.goodsSelection.delete(itemKey);
      marketState.message='';renderMarket();return;
    }
    const button=event.target.closest('[data-market-action]');
    if(!button) return;
    const id=button.closest('[data-fish-id]')?.dataset.fishId;
    const group=groupInventoryFish().find(entry=>entry.fish.id===id);
    if(!group) return;
    const selected=marketState.selection.get(id)||0;
    const next=button.dataset.marketAction==='all'?group.count:
      Math.max(0,Math.min(group.count,selected+(button.dataset.marketAction==='plus'?1:-1)));
    if(next) marketState.selection.set(id,next);
    else marketState.selection.delete(id);
    marketState.message='';
    renderMarket();
    const replacement=document.querySelector(`[data-fish-id="${id}"] [data-market-action="${button.dataset.marketAction}"]`);
    if(replacement&&!replacement.disabled) replacement.focus();
  });
}
