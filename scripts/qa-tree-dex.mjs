// Mobile browser end-to-end test for the 50-species tree collection.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const output=path.resolve(process.argv[2]||'output/tree-dex-qa');
fs.mkdirSync(output,{recursive:true});

const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[];
try{
  const context=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(base);
  try{
    await page.waitForFunction(()=>typeof openTreeDex==='function',null,{timeout:60000});
  }catch(error){
    throw new Error(`${error.message}\nStartup errors:\n${errors.join('\n')||'(none)'}`);
  }

  await page.locator('#menuBtn').tap();
  await page.screenshot({path:path.join(output,'mobile-menu.png')});
  await page.locator('#openTreeDexBtn').tap();
  await page.evaluate(()=>{
    const cards=[...document.querySelectorAll('#treeDexGrid [data-tree-species]')];
    if(cards.length!==50||document.getElementById('treeDexProgress').textContent.trim()!=='0 / 50')
      throw new Error('Fresh tree dex does not show 50 undiscovered species');
    if(cards.some(card=>!card.classList.contains('undiscovered')||!card.querySelector('.treeDexSilhouette')))
      throw new Error('Fresh tree dex reveals an undiscovered species');
  });
  await page.screenshot({path:path.join(output,'mobile-undiscovered.png')});
  await page.locator('[data-tree-species="oak"]').tap();
  await page.evaluate(()=>{
    if(!isTreeDexDetailOpen()||!document.getElementById('treeDexDetail').textContent.includes('???')||
      !document.getElementById('treeDexDetail').textContent.includes('기본 도끼 이상 필요'))
      throw new Error('Undiscovered tree hint is incomplete');
  });
  await page.goBack();
  await page.waitForFunction(()=>isTreeDexOpen()&&!isTreeDexDetailOpen());
  await page.locator('#treeDexClose').tap();
  await page.waitForFunction(()=>!isTreeDexOpen());

  const chopReport=await page.evaluate(()=>{
    enterWorldRegion({to:'oldForest',entry:{x:31,y:44,face:'up'}});
    GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:['axe.basic']};
    GAME_STATE.appearance.activeTool='axe';
    const oakTrees=trees.filter(tree=>tree.species==='oak'&&tree.interactable).slice(0,2);
    if(oakTrees.length<2)throw new Error('Two oak trees are required for collection QA');
    for(const tree of oakTrees){
      const hits=Math.ceil(FORESTRY_TREES.oak.maxHp/FORESTRY_AXES[0].damage);
      for(let hit=0;hit<hits;hit++)if(!hitResourceTree(tree))throw new Error('Oak chop failed');
    }
    const record=getTreeCollectionRecord('oak');
    if(record?.count!==2||getDiscoveredTreeCount()!==1)throw new Error('Tree collection count did not update');
    return {count:record.count,logs:lifeItemCount('material','oak_log')};
  });

  await page.locator('#menuBtn').tap();
  await page.locator('#openTreeDexBtn').tap();
  await page.evaluate(()=>{
    const oak=document.querySelector('[data-tree-species="oak"]');
    if(!oak?.classList.contains('discovered')||!oak.textContent.includes('참나무')||
      document.getElementById('treeDexProgress').textContent.trim()!=='1 / 50'||
      document.querySelectorAll('#treeDexGrid .undiscovered').length!==49)
      throw new Error('Discovered oak card or progress is incorrect');
  });
  await page.screenshot({path:path.join(output,'mobile-one-discovered.png')});
  await page.locator('[data-tree-species="oak"]').tap();
  await page.evaluate(()=>{
    const text=document.getElementById('treeDexDetail').textContent;
    if(!text.includes('참나무')||!text.includes('2그루')||!text.includes('나무 체력')||
      !text.includes('벌목 경험치')||!text.includes('목재 판매가')||!text.includes('참나무 목재'))
      throw new Error('Discovered tree detail is incomplete');
  });
  await page.screenshot({path:path.join(output,'mobile-oak-detail.png')});
  await page.goBack();
  await page.waitForFunction(()=>isTreeDexOpen()&&!isTreeDexDetailOpen());

  const filterCounts={early:16,middle:19,late:15};
  for(const [filter,count] of Object.entries(filterCounts)){
    await page.locator(`[data-tree-filter="${filter}"]`).tap();
    const actual=await page.locator('#treeDexGrid [data-tree-species]').count();
    if(actual!==count)throw new Error(`${filter} filter expected ${count}, got ${actual}`);
  }
  await page.locator('[data-tree-filter="all"]').tap();
  await page.setViewportSize({width:320,height:568});
  await page.evaluate(()=>{
    const panel=document.getElementById('treeDexPanel').getBoundingClientRect();
    for(const card of document.querySelectorAll('#treeDexGrid .treeDexCard')){
      const box=card.getBoundingClientRect();
      if(box.left<panel.left||box.right>panel.right)throw new Error('Tree card overflows the small screen');
    }
  });
  await page.screenshot({path:path.join(output,'small-tree-dex.png')});
  await page.locator('#treeDexClose').tap();
  await page.reload();
  await page.waitForFunction(()=>typeof getTreeCollectionRecord==='function'&&forestTreeImgs.oak?.naturalWidth===120);
  const restored=await page.evaluate(()=>({record:getTreeCollectionRecord('oak'),total:getDiscoveredTreeCount()}));
  if(restored.record?.count!==2||restored.total!==1)
    throw new Error(`Tree collection save did not restore: ${JSON.stringify(restored)}`);
  if(errors.length)throw new Error(errors.join('\n'));

  const report={species:50,filterCounts,chopReport,discoveryProgress:'1 / 50',saveRestored:true,
    viewports:['393x780','320x568'],browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Tree dex QA passed: '+JSON.stringify(report));
}finally{
  await browser.close();
}
