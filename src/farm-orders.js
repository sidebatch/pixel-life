function createDefaultFarmOrders(){
  return {schemaVersion:1,tickets:0,completed:0,current:null,ownedDecorationIds:[],placedDecorationIds:[]};
}

function normalizeSavedFarmOrders(raw){
  const result=createDefaultFarmOrders();
  if(!raw||typeof raw!=='object')return result;
  const integer=(value,max)=>Number.isSafeInteger(value)&&value>=0?Math.min(value,max):0;
  result.tickets=integer(raw.tickets,FARM_ORDER_RULES.maxTickets);
  result.completed=integer(raw.completed,9999999);
  const ids=Array.isArray(raw.ownedDecorationIds)?raw.ownedDecorationIds:[];
  result.ownedDecorationIds=[...new Set(ids)].filter(id=>FARM_DECOR_BY_ID.has(id));
  result.placedDecorationIds=[...new Set(Array.isArray(raw.placedDecorationIds)?raw.placedDecorationIds:[])]
    .filter(id=>result.ownedDecorationIds.includes(id));
  const order=raw.current,rule=FARM_ORDER_RULES.tiers.find(t=>t.tier===order?.tier);
  if(rule&&order.id==='farm-order-'+(result.completed+1)&&Array.isArray(order.requirements)&&order.requirements.length===rule.lines&&
    Number.isSafeInteger(order.coins)&&order.coins>0&&order.coins<=10000000&&order.tickets===rule.tier&&
    new Set(order.requirements.map(row=>row?.cropId)).size===rule.lines&&
    order.requirements.every(row=>LIFE_CROP_BY_ID.has(row?.cropId)&&Number.isSafeInteger(row.quantity)&&
      row.quantity>=rule.minQuantity&&row.quantity<=rule.maxQuantity)){
    result.current={id:order.id,tier:rule.tier,requirements:order.requirements.map(row=>({cropId:row.cropId,quantity:row.quantity})),
      coins:order.coins,tickets:order.tickets};
  }
  return result;
}

function farmOrderTier(level,plots){
  return [...FARM_ORDER_RULES.tiers].reverse().find(t=>level>=t.minLevel&&plots>=t.minPlots)||FARM_ORDER_RULES.tiers[0];
}

function farmOrderPlotCount(){
  return REGION_WORLDS.sunnyFields.farmPlots.filter(plot=>getFarmPlotState(plot).unlocked).length;
}

function generateFarmOrder(state,random=Math.random){
  const rule=farmOrderTier(GAME_STATE.progression.farming.level,farmOrderPlotCount());
  const pool=LIFE_CONTENT.crops.filter(crop=>crop.growMs/60000<=rule.maxGrowMinutes);
  const previousFirst=state.current?.requirements[0]?.cropId,requirements=[];
  for(let index=0;index<rule.lines;index++){
    const available=pool.filter(c=>!requirements.some(row=>row.cropId===c.id)&&
      (index!==0||pool.length<=rule.lines||c.id!==previousFirst));
    const roll=Math.max(0,Math.min(.999999999,Number(random())||0));
    const crop=available[Math.floor(roll*available.length)];
    const quantity=rule.minQuantity+Math.floor(Math.max(0,Math.min(.999999999,Number(random())||0))*(rule.maxQuantity-rule.minQuantity+1));
    requirements.push({cropId:crop.id,quantity});
  }
  const saleValue=requirements.reduce((sum,row)=>sum+LIFE_CROP_BY_ID.get(row.cropId).sellPrice*row.quantity,0);
  return {id:'farm-order-'+(state.completed+1),tier:rule.tier,requirements,coins:Math.ceil(saleValue*1.25)+15*rule.tier,tickets:rule.tier};
}

function ensureFarmOrder(){
  const state=GAME_STATE.progression.farmOrders;
  if(state.current)return true;
  const order=generateFarmOrder(state);
  return Boolean(commitLifeChange(()=>{state.current=order;return true;}));
}

function deliverFarmOrder(expectedId){
  const state=GAME_STATE.progression.farmOrders,order=state.current;
  if(marketState.shop!=='haru'||marketState.view!=='orders'||!order||order.id!==expectedId||
    !order.requirements.every(row=>lifeItemCount('crop',row.cropId)>=row.quantity)||
    !Number.isSafeInteger(GAME_STATE.progression.coins+order.coins)||state.tickets+order.tickets>FARM_ORDER_RULES.maxTickets||
    state.completed>=9999999)return false;
  const next=generateFarmOrder({...state,completed:state.completed+1});
  const success=commitLifeChange(()=>{
    for(const row of order.requirements)removeLifeItem('crop',row.cropId,row.quantity);
    GAME_STATE.progression.coins+=order.coins;
    state.tickets+=order.tickets;state.completed++;state.current=next;
    return true;
  });
  marketState.message=success?`납품 완료! +${order.coins.toLocaleString()}코인 · 농장 교환권 +${order.tickets}장`:'저장하지 못했어요. 다시 시도해 주세요.';
  if(success){setMarketCoinDisplay(GAME_STATE.progression.coins);playMarketSaleSound();}
  renderMarket();return Boolean(success);
}

function exchangeFarmDecoration(id){
  const state=GAME_STATE.progression.farmOrders,item=FARM_DECOR_BY_ID.get(id);
  if(!['haru','farm'].includes(marketState.shop)||marketState.view!=='decorations'||!item||
    state.ownedDecorationIds.includes(id)||state.tickets<item.cost)return false;
  const success=commitLifeChange(()=>{state.tickets-=item.cost;state.ownedDecorationIds.push(id);return true;});
  marketState.message=success?`${item.name} 교환 완료! 가방 → 농장에 보관했어요. 농장에서 설치하기를 눌러 주세요.`:'저장하지 못했어요. 다시 시도해 주세요.';
  renderMarket();return Boolean(success);
}

function setFarmDecorationPlaced(id,place){
  const state=GAME_STATE.progression.farmOrders,item=FARM_DECOR_BY_ID.get(id);
  const current=state.placedDecorationIds.includes(id);
  if(typeof place!=='boolean'||GAME_STATE.regionId!=='sunnyFields'||!item||!state.ownedDecorationIds.includes(id)||current===place||
    (place&&item.slots.some(slot=>slot.x===player.x&&slot.y===player.y)))return false;
  const success=commitLifeChange(()=>{
    state.placedDecorationIds=place?[...state.placedDecorationIds,id]:state.placedDecorationIds.filter(placed=>placed!==id);return true;
  });
  if(success)refreshFarmDecorationCollision();
  marketState.message=success?`${item.name} ${place?'설치 완료!':'회수 완료!'}`:'저장하지 못했어요. 다시 시도해 주세요.';
  if(typeof isInventoryOpen!=='function'||!isInventoryOpen())renderMarket();
  return Boolean(success);
}

function refreshFarmDecorationCollision(){
  if(GAME_STATE.regionId!=='sunnyFields')return;
  for(const item of FARM_DECORATIONS)for(const slot of item.slots)blocked.delete(key(slot.x,slot.y));
  for(const id of GAME_STATE.progression.farmOrders.placedDecorationIds)
    for(const slot of FARM_DECOR_BY_ID.get(id).slots)blocked.add(key(slot.x,slot.y));
}

function addFarmDecorationRenderables(renderables){
  if(GAME_STATE.regionId!=='sunnyFields')return;
  for(const id of GAME_STATE.progression.farmOrders.placedDecorationIds){
    const item=FARM_DECOR_BY_ID.get(id),image=imgs[item.asset];if(!image)continue;
    for(const slot of item.renderSlots||item.slots){
      const x=Math.round(slot.x*TILE+(TILE-item.width)/2-camX),y=Math.round((slot.y+1)*TILE-item.height-camY);
      if(onScreen(slot.x*TILE,slot.y*TILE,item.width,item.height))
        renderables.push({y:(slot.y+1)*TILE,draw:()=>ctx.drawImage(image,x,y,item.width,item.height)});
    }
  }
}

function renderFarmOrdersMarket(){
  const state=GAME_STATE.progression.farmOrders,order=state.current;
  document.getElementById('marketStock').textContent=`농장 교환권 ${state.tickets.toLocaleString()}장 · 납품 ${state.completed.toLocaleString()}회`;
  const list=document.getElementById('marketList');
  if(!order){list.innerHTML=skillCardMarkup('farming')+'<div class="farmOrderCard"><p>주문을 저장하지 못했어요.</p><button data-farm-action="retry-order" type="button">다시 불러오기</button></div>';return;}
  const ready=order.requirements.every(row=>lifeItemCount('crop',row.cropId)>=row.quantity);
  list.innerHTML=skillCardMarkup('farming')+`<section class="farmOrderCard"><span class="farmOrderLabel">하루의 식재료 주문</span><h3>이 작물들을 부탁해!</h3>
    <div class="farmOrderRequirements">${order.requirements.map(row=>{
      const crop=LIFE_CROP_BY_ID.get(row.cropId),count=lifeItemCount('crop',row.cropId),enough=count>=row.quantity;
      return `<div class="farmOrderRequirement${enough?' ready':''}">${lifeItemIconMarkup('crop',crop.id,crop.icon)}<b>${crop.name}</b><span>보유 ${count} / ${row.quantity}개</span></div>`;
    }).join('')}</div><div class="farmOrderRewards"><b>${order.coins.toLocaleString()}코인</b><span>농장 교환권 ${order.tickets}장</span></div>
    <button type="button" data-farm-action="deliver" data-order-id="${order.id}" ${ready?'':'disabled'}>${ready?'작물 납품하기':'작물을 모아주세요'}</button>
    <p class="farmOrderNote">납품하면 다음 주문을 받아요.</p></section>
    <button class="farmViewLink" type="button" data-farm-action="show-decorations">교환권으로 농장 꾸미기</button>`;
  list.scrollTop=0;
}

function renderFarmDecorationsMarket(){
  const state=GAME_STATE.progression.farmOrders;
  document.getElementById('marketStock').textContent=`농장 교환권 ${state.tickets.toLocaleString()}장`;
  const list=document.getElementById('marketList'),scroll=list.scrollTop;
  list.innerHTML=FARM_DECORATIONS.map(item=>{
    const owned=state.ownedDecorationIds.includes(item.id),placed=state.placedDecorationIds.includes(item.id),atFarm=GAME_STATE.regionId==='sunnyFields';
    const occupied=item.slots.some(slot=>slot.x===player.x&&slot.y===player.y);
    return `<section class="farmDecorationCard"><img src="${ASSET_URLS[item.asset]}" alt=""><div><h3>${item.name}</h3><p>${item.description}</p>
      <strong>${placed?'설치 중':owned?'보유 중':`교환권 ${item.cost}장`}</strong>
      ${owned?`<button type="button" data-farm-action="${placed?'remove':'place'}" data-decoration-id="${item.id}" ${atFarm&&(!occupied||placed)?'':'disabled'}>${atFarm?placed?'회수하기':occupied?'설치 자리에서 비켜주세요':'설치하기':'농장에서 설치'}</button>`:
        `<button type="button" data-farm-action="exchange" data-decoration-id="${item.id}" ${state.tickets>=item.cost?'':'disabled'}>교환하기</button>`}</div></section>`;
  }).join('');list.scrollTop=scroll;
}
