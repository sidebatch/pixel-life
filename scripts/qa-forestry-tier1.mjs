// Browser smoke test for the first approved forestry art/gameplay slice.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/forestry-tier1-qa');
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
    ['paulownia','cedar'].every(species=>forestTreeImgs[species]?.naturalWidth===120&&
      forestStumpImgs[species]?.naturalWidth===96&&lifeItemImgs[`${species}Log`]?.naturalWidth===96));
  await page.evaluate(()=>{
    if(!enterWorldRegion({to:'oldForest',entry:{x:31,y:38,face:'right'}}))throw new Error('Forest transition failed');
    if(trees.filter(tree=>tree.species==='paulownia').length!==3||
      trees.filter(tree=>tree.species==='cedar').length!==3)throw new Error('New trees are not all visible in the forest');
  });
  await page.screenshot({path:path.join(output,'forest-393.png')});
  await page.evaluate(async()=>{
    Math.random=()=>.99;
    for(const species of ['paulownia','cedar']){
      const tree=trees.find(item=>item.species===species);
      for(let hit=0;hit<5;hit++)if(!hitResourceTree(tree))throw new Error(`${species} chop failed`);
      if(lifeItemCount('material',`${species}_log`)<1||getTreeState(tree).hp!==0)
        throw new Error(`${species} reward/stump failed`);
    }
    if(!addLifeItem('material','cypress_log',1))throw new Error('Legacy wood item was rejected');
    openInventory({fromHistory:true});
    inventoryState.tab='supplies';renderInventory();
    const markup=document.getElementById('inventoryScroll').innerHTML;
    const images=[...document.querySelectorAll('#inventoryScroll img')];
    await Promise.all(images.map(img=>img.decode()));
    if(!['오동나무','삼나무','편백나무'].every(name=>markup.includes(name))||
      images.length<3||images.some(img=>!img.complete||img.naturalWidth!==96))
      throw new Error('Inventory art or names are missing');
  });
  await page.screenshot({path:path.join(output,'inventory-393.png')});
  await page.evaluate(()=>{
    closeInventory({fromHistory:true});
    openMarket({shop:'workshop',fromHistory:true});
    const markup=document.getElementById('marketList').innerHTML;
    if(!['오동나무','삼나무','편백나무'].every(name=>markup.includes(name)))
      throw new Error('Workshop wood list is missing a species');
    if(planGoodsSale(new Map([['material:cedar_log',1]])).total!==FORESTRY_TREES.cedar.logPrice)
      throw new Error('Cedar sale price is wrong');
  });
  await page.screenshot({path:path.join(output,'workshop-393.png')});
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('Tier-1 forestry browser QA passed: forest art/spawns, chops/XP inventory, names, and workshop sales');
}finally{
  await browser.close();
}
