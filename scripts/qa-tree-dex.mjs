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
    const tabs=[...document.querySelectorAll('.treeDexTabs [data-tree-filter]')];
    if(cards.length!==50||document.getElementById('treeDexProgress').textContent.trim()!=='0 / 50')
      throw new Error('Fresh tree dex does not show 50 undiscovered species');
    if(cards.some(card=>!card.classList.contains('undiscovered')||!card.querySelector('.treeDexSilhouette')))
      throw new Error('Fresh tree dex reveals an undiscovered species');
    const tabBoxes=tabs.map(tab=>tab.getBoundingClientRect());
    const tabRows=[...new Set(tabBoxes.map(box=>Math.round(box.top)))];
    const panel=document.getElementById('treeDexPanel').getBoundingClientRect();
    if(tabs.map(tab=>tab.textContent.trim()).join('|')!=='전체|새싹의 숲|거목의 경계|강철의 대삼림|정령의 성역|태초의 심연'||
      Math.max(...tabBoxes.map(box=>box.width))-Math.min(...tabBoxes.map(box=>box.width))>1||tabRows.length!==2||
      tabBoxes.some(box=>box.left<panel.left||box.right>panel.right))
      throw new Error('Tree world tabs are not simple, matching controls');
  });
  await page.screenshot({path:path.join(output,'mobile-undiscovered.png')});
  await page.locator('[data-tree-species="oak"]').tap();
  await page.evaluate(()=>{
    const text=document.getElementById('treeDexDetail').textContent;
    if(!isTreeDexDetailOpen()||!text.includes('???')||!text.includes('새싹의 숲')||
      text.includes('단계')||text.includes('발견 힌트')||text.includes('도끼')||text.includes('나오는 곳'))
      throw new Error('Undiscovered tree detail is not minimal');
  });
  await page.goBack();
  await page.waitForFunction(()=>isTreeDexOpen()&&!isTreeDexDetailOpen());
  await page.locator('#treeDexClose').tap();
  await page.waitForFunction(()=>!isTreeDexOpen());

  const firstChop=await page.evaluate(()=>{
    Math.random=()=>0;
    enterWorldRegion({to:'oldForest',entry:{x:31,y:44,face:'up'}});
    GAME_STATE.progression.forestry={axeId:'axe.basic',ownedAxeIds:['axe.basic']};
    GAME_STATE.appearance.activeTool='axe';
    const oakTrees=trees.filter(tree=>tree.species==='oak'&&tree.interactable).slice(0,2);
    if(oakTrees.length<2)throw new Error('Two oak trees are required for collection QA');
    const hits=Math.ceil(FORESTRY_TREES.oak.maxHp/FORESTRY_AXES[0].damage);
    for(let hit=0;hit<hits;hit++)if(!hitResourceTree(oakTrees[0]))throw new Error('First oak chop failed');
    const record=getTreeCollectionRecord('oak');
    if(record?.count!==1||getDiscoveredTreeCount()!==1||lifeItemCount('material','oak_log')!==0||
      GAME_STATE.progression.logging.totalXp!==forestryTreeXp(FORESTRY_TREES.oak))
      throw new Error('Zero-item first cut did not update discovery and Logging XP');
    return {count:record.count,logs:lifeItemCount('material','oak_log'),xp:GAME_STATE.progression.logging.totalXp};
  });
  await page.waitForFunction(()=>isTreeDiscoveryOpen());
  await page.evaluate(()=>{
    const text=document.getElementById('treeDiscoveryOverlay').textContent;
    if(!text.includes('참나무')||!text.includes('새싹의 숲')||!text.includes('확인')||
      text.includes('제1세계')||text.includes('1단계'))throw new Error('First discovery card is not concise');
  });
  await page.screenshot({path:path.join(output,'first-tree-discovery.png')});
  await page.keyboard.press('Escape');
  if(!await page.evaluate(()=>isTreeDiscoveryOpen()))throw new Error('Discovery card closed without its close button');
  await page.locator('#treeDiscoveryClose').tap();
  await page.waitForFunction(()=>!isTreeDiscoveryOpen());

  const chopReport=await page.evaluate((firstChop)=>{
    Math.random=()=>.99;
    const tree=trees.filter(item=>item.species==='oak'&&item.interactable)[1];
    const hits=Math.ceil(FORESTRY_TREES.oak.maxHp/FORESTRY_AXES[0].damage);
    for(let hit=0;hit<hits;hit++)if(!hitResourceTree(tree))throw new Error('Repeated oak chop failed');
    const record=getTreeCollectionRecord('oak');
    if(record?.count!==2||getDiscoveredTreeCount()!==1||isTreeDiscoveryOpen()||
      lifeItemCount('material','oak_log')!==3||GAME_STATE.progression.logging.totalXp!==2*forestryTreeXp(FORESTRY_TREES.oak))
      throw new Error('Repeated species showed discovery again or failed to count');
    return {count:record.count,logs:lifeItemCount('material','oak_log'),firstDiscovery:firstChop};
  },firstChop);

  await page.locator('#menuBtn').tap();
  await page.locator('#openTreeDexBtn').tap();
  await page.evaluate(()=>{
    const oak=document.querySelector('[data-tree-species="oak"]');
    if(!oak?.classList.contains('discovered')||!oak.textContent.includes('참나무')||
      oak.textContent.includes('단계')||
      document.getElementById('treeDexProgress').textContent.trim()!=='1 / 50'||
      document.querySelectorAll('#treeDexGrid .undiscovered').length!==49)
      throw new Error('Discovered oak card or progress is incorrect');
  });
  await page.screenshot({path:path.join(output,'mobile-one-discovered.png')});
  await page.locator('[data-tree-species="oak"]').tap();
  await page.evaluate(()=>{
    const text=document.getElementById('treeDexDetail').textContent;
    if(!text.includes('참나무')||!text.includes('새싹의 숲')||!text.includes('2그루')||
      !text.includes('벌목 경험치')||!text.includes('1 XP')||!text.includes('목재 판매가')||
      !text.includes('참나무 목재 · 0~3개')||
      text.includes('나무 체력')||text.includes('단계')||text.includes('기본 도끼')||text.includes('오래된 숲'))
      throw new Error('Discovered tree detail is not concise');
  });
  await page.screenshot({path:path.join(output,'mobile-oak-detail.png')});
  await page.goBack();
  await page.waitForFunction(()=>isTreeDexOpen()&&!isTreeDexDetailOpen());

  const filterCounts={world1:11,world2:9,world3:10,world4:10,world5:10};
  for(const [filter,count] of Object.entries(filterCounts)){
    await page.locator(`[data-tree-filter="${filter}"]`).tap();
    const actual=await page.locator('#treeDexGrid [data-tree-species]').count();
    if(actual!==count)throw new Error(`${filter} filter expected ${count}, got ${actual}`);
    if(filter==='world1'){
      const teaser=await page.locator('.treeDexNextWorld');
      if(!await teaser.textContent().then(text=>text.includes('거목의 경계')&&!text.includes('제2세계')&&!text.includes('단계'))||await teaser.locator('img').count()!==3)
        throw new Error('Next-world silhouette teaser is missing');
      await teaser.scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(output,'world1-next-world-teaser.png')});
    }
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

  await page.setViewportSize({width:393,height:780});
  await page.evaluate(()=>{
    const milestoneTree=trees.find(tree=>tree.interactable&&!getTreeCollectionRecord(tree.species));
    if(!milestoneTree)throw new Error('A distinct milestone tree is required');
    for(const species of FOREST_SPECIES){
      if(getDiscoveredTreeCount()>=10)break;
      if(species!==milestoneTree.species&&!getTreeCollectionRecord(species))recordTreeDiscovery(species);
    }
    GAME_STATE.progression.forestry={axeId:'axe.primordial',ownedAxeIds:['axe.basic','axe.primordial'],
      durabilityByAxeId:{'axe.primordial':FORESTRY_AXE_BY_ID.get('axe.primordial').maxDurability}};
    GAME_STATE.appearance.activeTool='axe';
    const hits=Math.ceil(FORESTRY_TREES[milestoneTree.species].maxHp/FORESTRY_AXE_BY_ID.get('axe.primordial').damage);
    for(let hit=0;hit<hits;hit++)if(!hitResourceTree(milestoneTree))throw new Error('Milestone tree chop failed');
    if(getDiscoveredTreeCount()!==11||treeDexState.revealType!=='tree')throw new Error('Eleventh discovery did not open its tree card first');
  });
  await page.locator('#treeDiscoveryClose').tap();
  await page.waitForFunction(()=>treeDexState.revealType==='milestone');
  await page.evaluate(()=>{
    const text=document.getElementById('treeDiscoveryOverlay').textContent;
    if(!text.includes('11 / 50종 발견')||!text.includes('새싹의 탐험가')||!text.includes('보상 받기'))
      throw new Error('Eleven-tree title reward card is incorrect');
  });
  await page.waitForTimeout(800);
  await page.screenshot({path:path.join(output,'milestone-11-title.png')});
  await page.locator('#treeDiscoveryClose').tap();
  await page.waitForFunction(()=>!isTreeDiscoveryOpen());
  await page.locator('#menuBtn').tap();
  await page.locator('#openTreeDexBtn').tap();
  await page.evaluate(()=>{
    if(!document.getElementById('treeDexSummary').textContent.includes('칭호 · 새싹의 탐험가'))
      throw new Error('Unlocked tree title is not visible in the dex');
  });

  const milestoneChecks=[
    {count:20,name:'청동 나무 테두리',panelClass:'reward-bronze',shot:'milestone-20-bronze.png'},
    {count:30,name:'대삼림의 벌목꾼',panelClass:'reward-bronze',shot:'milestone-30-title.png'},
    {count:40,name:'정령빛 도감 효과',panelClass:'reward-spirit',shot:'milestone-40-spirit.png'},
    {count:50,name:'세계수의 기록자',panelClass:'reward-gold',shot:'milestone-50-gold.png'}
  ];
  for(const milestone of milestoneChecks){
    await page.evaluate(target=>{
      for(const species of FOREST_SPECIES){
        if(getDiscoveredTreeCount()>=target)break;
        if(!getTreeCollectionRecord(species))recordTreeDiscovery(species);
      }
      if(getDiscoveredTreeCount()!==target||!saveGame()||!showTreeMilestoneReveal({returnMenuOpen:true}))
        throw new Error(`Could not open ${target}-tree milestone`);
    },milestone.count);
    await page.evaluate(({count,name})=>{
      const text=document.getElementById('treeDiscoveryOverlay').textContent;
      if(!text.includes(`${count} / 50종 발견`)||!text.includes(name))throw new Error(`${count}-tree reward card is incorrect`);
    },milestone);
    await page.waitForTimeout(800);
    await page.screenshot({path:path.join(output,milestone.shot)});
    await page.locator('#treeDiscoveryClose').tap();
    await page.waitForFunction(()=>!isTreeDiscoveryOpen());
    await page.evaluate(({count,panelClass})=>{
      const panel=document.getElementById('treeDexPanel');
      if(!panel.classList.contains(panelClass)||getTreeDexMilestoneState().revealedIds.length!==TREE_DEX_WORLDS.filter(world=>world.milestone<=count).length)
        throw new Error(`${count}-tree permanent cosmetic was not applied or saved`);
    },milestone);
  }
  await page.setViewportSize({width:320,height:568});
  await page.evaluate(()=>{
    const summary=document.getElementById('treeDexSummary').textContent;
    const panel=document.getElementById('treeDexPanel').getBoundingClientRect();
    if(!summary.includes('칭호 · 세계수의 기록자')||document.getElementById('treeDexProgress').textContent.trim()!=='50 / 50')
      throw new Error('Final tree title or completion progress is missing');
    if(panel.left<0||panel.right>innerWidth||panel.top<0||panel.bottom>innerHeight)
      throw new Error('Final gold dex frame overflows the small viewport');
  });
  await page.screenshot({path:path.join(output,'small-final-gold-dex.png')});
  await page.locator('#treeDexClose').tap();
  await page.reload();
  await page.waitForFunction(()=>typeof openTreeDex==='function');
  await page.locator('#menuBtn').tap();
  await page.locator('#openTreeDexBtn').tap();
  await page.evaluate(()=>{
    const milestones=getTreeDexMilestoneState();
    if(isTreeDiscoveryOpen()||milestones.unlockedIds.length!==5||milestones.revealedIds.length!==5||
      !document.getElementById('treeDexPanel').classList.contains('reward-gold'))
      throw new Error('Completed milestone rewards did not restore without replaying cards');
  });
  if(errors.length)throw new Error(errors.join('\n'));

  const report={species:50,filterCounts,chopReport,discoveryProgress:'1 / 50',saveRestored:true,milestones:[11,20,30,40,50],
    viewports:['393x780','320x568'],browserErrors:errors};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('Tree dex QA passed: '+JSON.stringify(report));
}finally{
  await browser.close();
}
