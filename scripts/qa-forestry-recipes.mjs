// Mobile browser end-to-end test for Tier 5-10 axe recipes and persistence.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forestry-recipes-qa');
fs.mkdirSync(output,{recursive:true});

const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(base);
  await page.waitForFunction(()=>typeof openMarket==='function'&&typeof upgradeForestryAxe==='function'&&
    FORESTRY_AXE_BY_ID.has('axe.primordial'));

  const recipeReport=await page.evaluate(()=>{
    const axes=FORESTRY_AXES.filter(axe=>axe.tier>=5);
    const report=axes.map(axe=>{
      const materials=Object.entries(axe.materials);
      if(materials.length<4)throw new Error(`${axe.id} needs at least four wood materials`);
      for(const [id,count] of materials){
        const species=id.endsWith('_log')?id.slice(0,-4):'';
        if(!Number.isSafeInteger(count)||count<1||FORESTRY_TREES[species]?.tier!==axe.tier-1)
          throw new Error(`${axe.id} has an invalid previous-tier material: ${id}`);
      }
      return {id:axe.id,name:axe.name,tier:axe.tier,materials:materials.map(([id,count])=>({id,count}))};
    });
    GAME_STATE.inventory=[];
    GAME_STATE.progression.coins=0;
    GAME_STATE.progression.forestry={axeId:'axe.master',ownedAxeIds:FORESTRY_AXES.slice(0,4).map(axe=>axe.id)};
    GAME_STATE.appearance.activeTool='axe';
    if(!saveGame())throw new Error('Could not prepare the recipe QA save');
    openMarket({shop:'workshop',fromHistory:true});
    marketState.view='axes';renderMarket();
    const text=document.getElementById('marketList').textContent;
    if(!text.includes('물푸레나무')||!text.includes('망고나무')||
      !text.includes('목재 수량은 전체 밸런스 전 임시값이에요.'))
      throw new Error('Tier 5 recipe details are not visible in the mobile shop');
    return report;
  });
  await page.screenshot({path:path.join(output,'tier5-ready.png'),fullPage:true});

  for(const recipe of recipeReport){
    await page.evaluate(axeId=>{
      const axe=FORESTRY_AXE_BY_ID.get(axeId);
      GAME_STATE.inventory=[];
      GAME_STATE.progression.coins=axe.coins;
      for(const [id,count] of Object.entries(axe.materials))addLifeItem('material',id,count);
      renderMarket();
      const button=document.querySelector(`[data-axe-id="${axe.id}"]`);
      if(!button||button.disabled)throw new Error(`${axe.id} is not purchasable with its exact recipe`);
    },recipe.id);
    await page.locator(`[data-axe-id="${recipe.id}"]`).tap();
    await page.evaluate(axeId=>{
      if(!GAME_STATE.progression.forestry.ownedAxeIds.includes(axeId))
        throw new Error(`${axeId} was not granted by the shop button`);
      if(GAME_STATE.progression.coins!==0||GAME_STATE.inventory.some(item=>item.type==='material'))
        throw new Error(`${axeId} did not consume the exact recipe`);
      if(GAME_STATE.progression.forestry.axeId!=='axe.master')
        throw new Error(`${axeId} auto-equipped instead of preserving the current axe`);
    },recipe.id);
  }
  await page.screenshot({path:path.join(output,'all-axes-owned.png'),fullPage:true});

  const beforeReload=await page.evaluate(()=>{
    closeMarket({fromHistory:true});
    if(!equipForestryAxe('axe.primordial'))throw new Error('Final axe could not be equipped');
    return {owned:[...GAME_STATE.progression.forestry.ownedAxeIds],axeId:GAME_STATE.progression.forestry.axeId,
      activeTool:GAME_STATE.appearance.activeTool};
  });
  await page.reload();
  await page.waitForFunction(()=>typeof getEquippedForestryAxe==='function'&&characterToolImgs['axe.primordial']);
  const restored=await page.evaluate(()=>({owned:[...GAME_STATE.progression.forestry.ownedAxeIds],
    axeId:GAME_STATE.progression.forestry.axeId,activeTool:GAME_STATE.appearance.activeTool,
    next:nextForestryAxe()?.id||null,equipped:getEquippedForestryAxe().id}));
  if(restored.owned.length!==10||restored.next!==null||restored.axeId!=='axe.primordial'||
    restored.equipped!=='axe.primordial'||restored.activeTool!=='axe')
    throw new Error(`Final axe save did not restore: ${JSON.stringify({beforeReload,restored})}`);
  if(errors.length)throw new Error(errors.join('\n'));

  const report={recipes:recipeReport,shopPurchases:recipeReport.length,exactMaterialsConsumed:true,
    noAutoEquip:true,finalSaveRestored:true,browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Forestry recipe QA passed: '+JSON.stringify(report));
}finally{
  await browser.close();
}
