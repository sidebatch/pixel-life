// Mobile-sized browser smoke test for approved Tier-3 forestry art and gameplay.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forestry-tier3-qa');
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
    ['chestnut','walnut','zelkova'].every(species=>forestTreeImgs[species]?.naturalWidth===120&&
      forestStumpImgs[species]?.naturalWidth===96&&lifeItemImgs[`${species}Log`]?.naturalWidth===96)&&
    ['maple','broadleaf'].every(species=>lifeItemImgs[`${species}Log`]?.naturalWidth===96));
  await page.evaluate(()=>{
    if(!enterWorldRegion({to:'deepForest',entry:{x:36,y:11,face:'down'}}))throw new Error('Deep forest transition failed');
    for(const species of ['chestnut','walnut','zelkova']){
      const spawned=trees.filter(tree=>tree.species===species&&tree.id.startsWith('deep_forest_tier3_'));
      if(spawned.length!==3||spawned.some(tree=>tree.y>23))throw new Error(`${species} northern spawn count is wrong`);
    }
    validatePlayableRegion();
  });
  await page.screenshot({path:path.join(output,'forest-north-center-393.png')});
  await page.evaluate(()=>enterWorldRegion({to:'deepForest',entry:{x:53,y:17,face:'left'}}));
  await page.screenshot({path:path.join(output,'forest-north-east-393.png')});
  await page.evaluate(async()=>{
    const chestnut=trees.find(tree=>tree.species==='chestnut');
    GAME_STATE.progression.forestry={axeId:'axe.iron',ownedAxeIds:['axe.basic','axe.iron']};
    if(hitResourceTree(chestnut)||getTreeState(chestnut).hp!==160)
      throw new Error('Iron axe bypassed Tier-3 requirement');
    GAME_STATE.progression.forestry={axeId:'axe.steel',ownedAxeIds:['axe.basic','axe.iron','axe.steel']};
    for(const species of ['chestnut','walnut','zelkova']){
      const tree=trees.find(item=>item.species===species);
      for(let hit=0;hit<4;hit++)if(!hitResourceTree(tree))throw new Error(`${species} chop failed`);
      if(lifeItemCount('material',`${species}_log`)<1||getTreeState(tree).hp!==0)
        throw new Error(`${species} reward or stump failed`);
    }
    addLifeItem('material','maple_log',1);
    addLifeItem('material','broadleaf_log',1);
    openInventory({fromHistory:true});
    inventoryState.tab='supplies';renderInventory();
    const markup=document.getElementById('inventoryScroll').innerHTML;
    const images=[...document.querySelectorAll('#inventoryScroll img')];
    await Promise.all(images.map(img=>img.decode()));
    if(!['밤나무','호두나무','느티나무','단풍나무','활엽수'].every(name=>markup.includes(name))||
      images.length<5||images.some(img=>!img.complete||img.naturalWidth!==96))
      throw new Error('Inventory name or Tier-3 wood art is missing');
  });
  await page.screenshot({path:path.join(output,'inventory-393.png')});
  await page.evaluate(()=>{
    closeInventory({fromHistory:true});
    openMarket({shop:'workshop',fromHistory:true});
    const markup=document.getElementById('marketList').innerHTML;
    if(!['밤나무','호두나무','느티나무','단풍나무','활엽수'].every(name=>markup.includes(name)))
      throw new Error('Workshop wood list is missing a species');
    const beforeCoins=GAME_STATE.progression.coins;
    const beforeLogs=lifeItemCount('material','chestnut_log');
    marketState.goodsSelection.set('material:chestnut_log',1);
    if(!sellSelectedGoods()||GAME_STATE.progression.coins!==beforeCoins+FORESTRY_TREES.chestnut.logPrice||
      lifeItemCount('material','chestnut_log')!==beforeLogs-1)
      throw new Error('Selling new wood did not exchange it for configured coins');
  });
  await page.screenshot({path:path.join(output,'workshop-393.png')});
  const saved=await page.evaluate(()=>({
    coins:GAME_STATE.progression.coins,
    chestnut:lifeItemCount('material','chestnut_log'),
    walnut:lifeItemCount('material','walnut_log'),
    zelkova:lifeItemCount('material','zelkova_log'),
    treeHp:getTreeState(trees.find(tree=>tree.species==='chestnut')).hp
  }));
  await page.reload();
  await page.waitForFunction(()=>typeof hitResourceTree==='function'&&forestTreeImgs.chestnut?.naturalWidth===120);
  const restored=await page.evaluate(()=>({
    coins:GAME_STATE.progression.coins,
    chestnut:lifeItemCount('material','chestnut_log'),
    walnut:lifeItemCount('material','walnut_log'),
    zelkova:lifeItemCount('material','zelkova_log'),
    treeHp:getTreeState(trees.find(tree=>tree.species==='chestnut')).hp
  }));
  if(JSON.stringify(saved)!==JSON.stringify(restored))throw new Error(`Tier-3 sale or tree state did not survive reload: ${JSON.stringify({saved,restored})}`);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Tier-3 forestry browser QA passed: sprites/spawns, steel-gated chops, inventory, real sale, and reload persistence');
}finally{
  await browser.close();
}
