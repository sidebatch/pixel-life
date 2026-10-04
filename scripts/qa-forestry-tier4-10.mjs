// Mobile browser smoke test for the complete Tier 4-10 forestry catalog.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forestry-tier4-10-qa');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{
    if(response.url().includes('/assets/forestry/')&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(base);
  await page.waitForFunction(()=>typeof hitResourceTree==='function'&&FOREST_SPECIES.length===50&&
    FOREST_SPECIES.every(species=>forestTreeImgs[species]?.naturalWidth===120&&
      forestStumpImgs[species]?.naturalWidth===96&&lifeItemImgs[`${species}Log`]?.naturalWidth===96));
  const result=await page.evaluate(()=>{
    const byTier={
      4:['ash','teak','mahogany','mango'],
      5:['baobab','sequoia','black_locust','hickory','eucalyptus'],
      6:['olive','purpleheart','jatoba','spotted_gum','ironbark'],
      7:['cumaru','ipe','quebracho','african_blackwood','lignum_vitae'],
      8:['ancient_zelkova','amber_cedar','silverbark','spiralwood','moonshade'],
      9:['spirit_ancient','starlight_tree','moonveil','crystal_leaf','whisperwood'],
      10:['origin_tree','primal_ancient','worldroot','dawncore','abysswood']
    };
    GAME_STATE.regionId='forestThree';
    GAME_STATE.inventory=[];GAME_STATE.world.trees={};
    GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:FORESTRY_AXES.map(axe=>axe.id)};
    const checked=[];
    for(const [tierText,speciesList] of Object.entries(byTier)){
      const tier=Number(tierText),axe=FORESTRY_AXES[tier-1],lowerAxe=FORESTRY_AXES[tier-2];
      for(const species of speciesList){
        const tree={id:`qa_${species}`,x:10,y:10,species,interactable:true};
        GAME_STATE.progression.forestry.axeId=lowerAxe.id;
        if(hitResourceTree(tree)||GAME_STATE.world.trees[tree.id])throw new Error(`${species} accepted a Tier-${tier-1} axe`);
        GAME_STATE.progression.forestry.axeId=axe.id;
        const hits=Math.ceil(FORESTRY_TREES[species].maxHp/axe.damage);
        for(let count=0;count<hits;count++)if(!hitResourceTree(tree))throw new Error(`${species} chop ${count+1}/${hits} failed`);
        if(getTreeState(tree).hp!==0||lifeItemCount('material',`${species}_log`)<1)
          throw new Error(`${species} stump or wood reward is missing`);
        const good=marketGoodDefinition('material',`${species}_log`);
        if(good.name!==FOREST_WOOD[species]||good.price!==FORESTRY_TREES[species].logPrice)
          throw new Error(`${species} workshop data is missing`);
        checked.push(species);
      }
    }
    openInventory({fromHistory:true});inventoryState.tab='supplies';renderInventory();
    const markup=document.getElementById('inventoryScroll').innerHTML;
    if(!checked.every(species=>markup.includes(FOREST_WOOD[species])))throw new Error('Inventory is missing a new wood name');
    return {checked:checked.length,inventoryImages:[...document.querySelectorAll('#inventoryScroll img')].length};
  });
  await page.locator('#inventoryScroll img').first().waitFor();
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('#inventoryScroll img')].map(img=>img.decode())));
  const broken=await page.locator('#inventoryScroll img').evaluateAll(images=>images.filter(img=>!img.complete||img.naturalWidth!==96).length);
  if(broken)throw new Error(`${broken} inventory wood images failed to decode`);
  await page.screenshot({path:path.join(output,'inventory-393.png')});
  if(result.checked!==34||result.inventoryImages<34)throw new Error(`Incomplete catalog QA: ${JSON.stringify(result)}`);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`Tier 4-10 forestry browser QA passed: ${result.checked} new species, axe gates, chops, rewards, workshop data, and inventory art`);
}finally{
  await browser.close();
}
