const MARKET_FISH_BY_ID=new Map(FISH_DATA.map(fish=>[fish.id,fish]));
const marketState={open:false,selection:new Map(),message:''};
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

function renderMarket(){
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
  marketState.selection.clear();
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
  menuOpen=false;
  finishMarketCoinAnimation();
  const panel=document.getElementById('marketPanel');
  panel.classList.remove('show');
  panel.setAttribute('aria-hidden','true');
  if(!options.fromHistory) leaveGameOverlayHistory('market');
}

if(typeof document!=='undefined'){
  document.getElementById('marketClose').addEventListener('click',closeMarket);
  document.getElementById('marketSellBtn').addEventListener('click',sellSelectedFish);
  document.getElementById('marketList').addEventListener('click',event=>{
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
