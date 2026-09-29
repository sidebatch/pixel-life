// Browser smoke test for the approved Tier-2 forestry sprites and gameplay.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forestry-tier2-qa');
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
  await page.waitForFunction(()=>typeof hitResourceTree==='function'&&
    ['ginkgo','larch','cherry'].every(species=>forestTreeImgs[species]?.naturalWidth===120&&
      forestStumpImgs[species]?.naturalWidth===96&&lifeItemImgs[`${species}Log`]?.naturalWidth===96));
  await page.evaluate(()=>{
    if(!enterWorldRegion({to:'deepForest',entry:{x:31,y:30,face:'right'}}))throw new Error('Deep forest transition failed');
    for(const species of ['ginkgo','larch','cherry']){
      if(trees.filter(tree=>tree.species===species).length!==3)throw new Error(`${species} spawn count is wrong`);
    }
  });
  await page.screenshot({path:path.join(output,'forest-393.png')});
  await page.evaluate(()=>enterWorldRegion({to:'deepForest',entry:{x:18,y:25,face:'left'}}));
  await page.screenshot({path:path.join(output,'forest-cherry-393.png')});
  await page.evaluate(async()=>{
    const ginkgo=trees.find(tree=>tree.species==='ginkgo');
    if(hitResourceTree(ginkgo)||getTreeState(ginkgo).hp!==120)throw new Error('Basic axe bypassed Tier-2 requirement');
    GAME_STATE.progression.forestry={axeId:'axe.iron',ownedAxeIds:['axe.basic','axe.iron']};
    for(const species of ['ginkgo','larch','cherry']){
      const tree=trees.find(item=>item.species===species);
      for(let hit=0;hit<3;hit++)if(!hitResourceTree(tree))throw new Error(`${species} chop failed`);
      if(lifeItemCount('material',`${species}_log`)<1||getTreeState(tree).hp!==0)
        throw new Error(`${species} reward/stump failed`);
    }
    addLifeItem('material','cypress_log',1);
    addLifeItem('material','birch_log',1);
    openInventory({fromHistory:true});
    inventoryState.tab='supplies';renderInventory();
    const markup=document.getElementById('inventoryScroll').innerHTML;
    const images=[...document.querySelectorAll('#inventoryScroll img')];
    await Promise.all(images.map(img=>img.decode()));
    if(!['은행나무','낙엽송','벚나무','편백나무','자작나무'].every(name=>markup.includes(name))||
      images.length<5||images.some(img=>!img.complete||img.naturalWidth!==96))
      throw new Error('Inventory name or wood art is missing');
  });
  await page.screenshot({path:path.join(output,'inventory-393.png')});
  await page.evaluate(()=>{
    closeInventory({fromHistory:true});
    openMarket({shop:'workshop',fromHistory:true});
    const markup=document.getElementById('marketList').innerHTML;
    if(!['은행나무','낙엽송','벚나무','편백나무','자작나무'].every(name=>markup.includes(name)))
      throw new Error('Workshop wood list is missing a species');
    const beforeCoins=GAME_STATE.progression.coins;
    const beforeLogs=lifeItemCount('material','ginkgo_log');
    marketState.goodsSelection.set('material:ginkgo_log',1);
    if(!sellSelectedGoods()||GAME_STATE.progression.coins!==beforeCoins+FORESTRY_TREES.ginkgo.logPrice||
      lifeItemCount('material','ginkgo_log')!==beforeLogs-1)
      throw new Error('Selling new wood did not exchange it for the configured coin amount');
  });
  await page.screenshot({path:path.join(output,'workshop-393.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Tier-2 forestry browser QA passed: sprites/spawns, iron-gated chops, inventory, and real workshop sale');
}finally{
  await browser.close();
}
