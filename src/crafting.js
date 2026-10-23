const craftingState={open:false,category:'materials',recipeId:'sturdy_leather',quantity:1,message:''};
function hasPortableWorkbench(){return lifeItemCount('utility',PORTABLE_WORKBENCH.id)>0;}
function huntingCombatActive(){return typeof huntingActors==='function'&&isInHuntingGround()&&huntingActors().some(a=>a.hp>0&&(a.mode==='aggro'||a.mode==='returning'||a.windup));}
function workbenchWoodPlan(){
  let remaining=PORTABLE_WORKBENCH.woodCost;const plan=[];
  for(const id of ['log',...FOREST_SPECIES.map(species=>`${species}_log`)]){
    const quantity=Math.min(remaining,lifeItemCount('material',id));if(quantity>0)plan.push({id,quantity});remaining-=quantity;if(!remaining)break;
  }
  return remaining?null:plan;
}
function makePortableWorkbench(){
  const plan=workbenchWoodPlan();
  if(GAME_STATE.regionId!=='lilacVillage'||hasPortableWorkbench()||!plan)return false;
  return Boolean(commitLifeChange(()=>plan.every(item=>removeLifeItem('material',item.id,item.quantity))&&addLifeItem('utility',PORTABLE_WORKBENCH.id,1)));
}
function craftingRecipeMax(recipe){
  if(!recipe)return 0;
  if(recipe.type==='sword'&&getOwnedSwords().some(sword=>sword.id===recipe.resultId))return 0;
  const materials=Math.min(...Object.entries(recipe.materials).map(([id,count])=>Math.floor(lifeItemCount('material',id)/count)));
  return Math.max(0,Math.min(recipe.type==='sword'?1:99999-lifeItemCount('material',recipe.resultId),materials));
}
function craftRecipe(id,quantity){
  const recipe=CRAFTING_RECIPES.find(item=>item.id===id);
  if(!hasPortableWorkbench()||huntingCombatActive()||isChoppingTree()||isFishingActive()||!Number.isSafeInteger(quantity)||quantity<1||quantity>craftingRecipeMax(recipe))return false;
  return Boolean(commitLifeChange(()=>{
    for(const [material,count]of Object.entries(recipe.materials))if(!removeLifeItem('material',material,count*quantity))return false;
    if(recipe.type==='material')return addLifeItem('material',recipe.resultId,quantity);
    const progress=GAME_STATE.progression.swords,sword=SWORD_BY_ID.get(recipe.resultId);
    GAME_STATE.progression.swords={...progress,ownedSwordIds:[...new Set([...getOwnedSwords().map(item=>item.id),sword.id])],
      durabilityBySwordId:{...progress.durabilityBySwordId,[sword.id]:sword.maxDurability}};
    return true;
  }));
}
// Inventory + cooldown + sword wear are saved together before combat damage is applied.
function commitHuntingHitReward(a,damage,tool){
  const lethal=a.hp<=damage,sword=tool==='sword'?getEquippedSword():null;
  if(sword&&getSwordDurability(sword).broken)return false;
  if(!lethal&&!sword?.maxDurability)return true;
  return Boolean(commitLifeChange(()=>{
    if(sword?.maxDurability){
      const progress=GAME_STATE.progression.swords,current=getSwordDurability(sword).current;
      progress.durabilityBySwordId={...progress.durabilityBySwordId,[sword.id]:Math.max(0,current-1)};
      if(current===1)GAME_STATE.appearance.activeTool='none';
    }
    if(lethal){
      const progress=GAME_STATE.progression.hunting||(GAME_STATE.progression.hunting={defeatedUntil:{}});
      if((progress.defeatedUntil[a.id]||0)>Date.now())return false;
      if(!addLifeItem('material','normal_leather',HUNTING_LOOT[a.type]))return false;
      if(a.type==='brak'&&!addLifeItem('material','brak_tusk',1))return false;
      progress.defeatedUntil[a.id]=Date.now()+(a.type==='brak'?300000:HUNTING_RULES.respawnMs);
    }
    return true;
  }));
}
function craftingArt(recipe){return recipe.type==='sword'?`<img src="${SWORD_TOOL_URLS[recipe.resultId]}" alt="">`:lifeItemIconMarkup('material',recipe.resultId);}
function renderCrafting(){
  const recipes=CRAFTING_RECIPES.filter(recipe=>recipe.category===craftingState.category);
  const recipe=recipes.find(item=>item.id===craftingState.recipeId)||recipes[0];craftingState.recipeId=recipe.id;
  const max=craftingRecipeMax(recipe),owned=recipe.type==='sword'&&getOwnedSwords().some(item=>item.id===recipe.resultId);
  craftingState.quantity=Math.max(1,Math.min(craftingState.quantity,Math.max(1,max)));
  const quantity=craftingState.quantity;
  document.getElementById('craftingRecipes').innerHTML=recipes.map(item=>`<button type="button" data-craft-recipe="${item.id}" aria-pressed="${item.id===recipe.id}" class="${item.id===recipe.id?'selected':''}">${craftingArt(item)}<span>${item.name}</span><small>${item.type==='sword'&&getOwnedSwords().some(s=>s.id===item.resultId)?'보유 중':craftingRecipeMax(item)>0?'제작 가능':'재료 부족'}</small></button>`).join('');
  document.querySelectorAll('[data-craft-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.craftCategory===craftingState.category)));
  document.getElementById('craftingDetail').innerHTML=`<div class="craftingHero">${craftingArt(recipe)}<div><small>${recipe.type==='sword'?'장비':'재료 가공'}</small><h3>${recipe.name}</h3><p>${recipe.description}</p></div></div>
    <ul class="craftingMaterials">${Object.entries(recipe.materials).map(([id,count])=>{const held=lifeItemCount('material',id),needed=count*quantity;return `<li class="${held<needed?'missing':''}">${lifeItemIconMarkup('material',id)}<span>${lifeItemName('material',id)}</span><strong>${held.toLocaleString()} / ${needed.toLocaleString()}</strong></li>`;}).join('')}</ul>
    ${owned||!max?`<p class="craftingResult">${owned?'이미 보유한 장비예요. 닳으면 준의 도구점에서 수리하세요.':'필요한 재료를 모아 주세요.'}</p>`:''}`;
  document.getElementById('craftingQuantity').textContent=quantity;
  document.getElementById('craftingMinus').disabled=quantity<=1;
  document.getElementById('craftingPlus').disabled=quantity>=max;
  document.getElementById('craftingMax').disabled=max<=quantity;
  const button=document.getElementById('craftingMake');button.disabled=owned||max<quantity;button.textContent=owned?'보유 중':`${quantity}개 제작하기`;
  document.getElementById('craftingMessage').textContent=craftingState.message;
}
function isCraftingOpen(){return craftingState.open;}
function openCrafting(options={}){
  if(craftingState.open)return true;
  if(!hasPortableWorkbench()||huntingCombatActive()||isChoppingTree()||isFishingActive()){
    if(isInventoryOpen())document.getElementById('inventorySummary').textContent=huntingCombatActive()?'전투를 마친 뒤 제작대를 사용할 수 있어요.':'지금은 제작대를 사용할 수 없어요.';
    return false;
  }
  if(!isInventoryOpen())openInventory({fromHistory:options.fromHistory});
  craftingState.open=true;craftingState.message='';craftingState.quantity=1;menuOpen=true;clearMovement();
  document.getElementById('inventoryPanel').inert=true;
  const panel=document.getElementById('craftingPanel');panel.classList.add('show');panel.setAttribute('aria-hidden','false');
  renderCrafting();document.getElementById('craftingClose').focus();
  if(!options.fromHistory)pushGameOverlayHistory('crafting');return true;
}
function closeCrafting(options={}){
  if(!craftingState.open)return;
  craftingState.open=false;const panel=document.getElementById('craftingPanel');panel.classList.remove('show');panel.setAttribute('aria-hidden','true');
  document.getElementById('inventoryPanel').inert=false;inventoryState.tab='supplies';renderInventory();
  document.querySelector(`[data-use-item-id="${PORTABLE_WORKBENCH.id}"]`)?.focus();
  if(!options.fromHistory)leaveGameOverlayHistory('crafting');
}
function renderWorkbenchMarket(){
  document.getElementById('marketStock').textContent='목재로 휴대용 제작대를 만들어요';
  const planned=workbenchWoodPlan(),costLabel=!hasPortableWorkbench()&&planned?`사용할 목재: ${planned.map(item=>`${lifeItemName('material',item.id)} ${item.quantity}개`).join(' · ')}`:'';
  document.getElementById('marketList').innerHTML=`<div class="marketFishRow marketPurchaseRow"><span class="marketGoodsIcon">${lifeItemIconMarkup('utility',PORTABLE_WORKBENCH.id)}</span><div class="marketFishBody"><div class="marketFishTop"><b>휴대용 제작대</b><span>${hasPortableWorkbench()?'보유 중':'영구 사용'}</span></div><small>가방 → 재료에서 사용하면 조합창이 열려요.</small><div class="marketFishBottom"><span>목재 ${totalLogCount()} / ${PORTABLE_WORKBENCH.woodCost}개 · 종류 무관</span><button type="button" class="marketSeedBuy" data-make-workbench ${hasPortableWorkbench()||totalLogCount()<PORTABLE_WORKBENCH.woodCost?'disabled':''}>${hasPortableWorkbench()?'보유 중':'제작하기'}</button></div></div></div>`;
  if(costLabel){const note=document.createElement('p');note.className='marketRule';note.textContent=costLabel;document.getElementById('marketList').append(note);}
}
function renderSwordRepairsMarket(){
  document.getElementById('marketStock').textContent='닳은 도끼와 검을 수리해요';
  if(!getOwnedSwords().some(sword=>swordRepairCost(sword)>0)){document.getElementById('marketList').innerHTML='';return;}
  document.getElementById('marketList').innerHTML=getOwnedSwords().filter(sword=>swordRepairCost(sword)>0).map(sword=>`<div class="marketFishRow marketPurchaseRow"><span class="marketGoodsIcon"><img src="${SWORD_TOOL_URLS[sword.id]}" alt=""></span><div class="marketFishBody"><b>${sword.name}</b><p>내구도 ${getSwordDurability(sword).current} / ${sword.maxDurability}</p>${equipmentDurabilityMarkup(getSwordDurability(sword))}<div class="marketFishBottom"><button type="button" class="marketSeedBuy" data-repair-sword="${sword.id}" ${GAME_STATE.progression.coins<swordRepairCost(sword)?'disabled':''}>수리 · ${swordRepairCost(sword)}코인</button></div></div></div>`).join('')||'<div class="marketEmpty"><b>수리할 검이 없어요</b></div>';
}
document.getElementById('craftingClose').addEventListener('click',()=>closeCrafting());
document.getElementById('craftingPanel').addEventListener('click',event=>{
  const category=event.target.closest('[data-craft-category]'),recipe=event.target.closest('[data-craft-recipe]');
  if(category){craftingState.category=category.dataset.craftCategory;craftingState.quantity=1;craftingState.message='';renderCrafting();}
  else if(recipe){craftingState.recipeId=recipe.dataset.craftRecipe;craftingState.quantity=1;craftingState.message='';renderCrafting();document.querySelector(`[data-craft-recipe="${craftingState.recipeId}"]`)?.focus({preventScroll:true});}
});
for(const [id,action]of [['craftingMinus',q=>q-1],['craftingPlus',q=>q+1],['craftingMax',()=>craftingRecipeMax(CRAFTING_RECIPES.find(r=>r.id===craftingState.recipeId))]]){
  document.getElementById(id).addEventListener('click',()=>{craftingState.quantity=action(craftingState.quantity);renderCrafting();});
}
document.getElementById('craftingMake').addEventListener('click',()=>{
  const recipe=CRAFTING_RECIPES.find(r=>r.id===craftingState.recipeId),quantity=craftingState.quantity;
  const success=craftRecipe(recipe.id,quantity);
  craftingState.message=success?`${recipe.name} ${quantity}개를 만들었어요.${recipe.type==='sword'?' 가방 → 장비에서 장착하세요.':''}`:'제작하지 못했어요. 재료와 저장 상태를 확인해 주세요.';
  if(success&&typeof playEquipmentRepairSound==='function')playEquipmentRepairSound('axe');renderCrafting();
});
document.getElementById('craftingPanel').addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const buttons=[...event.currentTarget.querySelectorAll('button:not([disabled])')],first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
