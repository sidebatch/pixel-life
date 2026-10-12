// Isolated mobile browser profiles; never uses the user's browser storage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PIXEL_LIFE_PLAYWRIGHT||'playwright');
const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4186/';
const out=path.resolve(process.argv[2]||'output/life-skill-growth-qa');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PIXEL_LIFE_CHROME||undefined});
const errors=[],reports=[];
try{
 for(const width of [393,320]){
  const context=await browser.newContext({viewport:{width,height:width===393?780:568},isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);await page.waitForFunction(()=>typeof normalizeSavedLifeSkillProgress==='function'&&!document.getElementById('startupLoading'));
  assert.deepEqual(await page.evaluate(()=>[GAME_STATE.progression.fishing.xpCurveVersion,GAME_STATE.progression.logging.xpCurveVersion]),[2,2]);
  const fresh=await page.evaluate(()=>{
   Math.random=()=>0;enterWorldRegion({to:'oldForest',entry:{x:31,y:44,face:'up'}});
   GAME_STATE.appearance.activeTool='axe';
   const tree=trees.find(t=>t.species==='oak'&&t.interactable),before=GAME_STATE.progression.logging.totalXp;
   const hits=Math.ceil(FORESTRY_TREES.oak.maxHp/getEquippedForestryAxe().damage);
   for(let hit=0;hit<hits-1;hit++)if(!hitResourceTree(tree))throw Error('Partial hit failed');
   const partial=GAME_STATE.progression.logging.totalXp-before;
   if(!hitResourceTree(tree))throw Error('Completion failed');
   const after=GAME_STATE.progression.logging.totalXp-before;
   if(isTreeDiscoveryOpen())closeTreeDiscoveryReveal({fromHistory:true});
   return {partial,gained:after,logs:lifeItemCount('material','oak_log'),curve:lifeSkillTotalXpForLevel('logging',100)};
  });
  assert.deepEqual(fresh,{partial:0,gained:7,logs:0,curve:187230});
  await page.waitForFunction(()=>document.getElementById('skillXPToast').classList.contains('show')&&document.getElementById('skillXPToast').textContent.includes('+7'));
  await page.screenshot({path:path.join(out,`logging-xp-${width}.png`)});
  await page.evaluate(()=>{cancelSkillXpFeedback();saveGame();});await page.reload();
  await page.waitForFunction(()=>typeof normalizeSavedLifeSkillProgress==='function'&&!document.getElementById('startupLoading'));
  assert.equal(await page.evaluate(()=>GAME_STATE.progression.logging.totalXp),7);
  const migrations=[];
  for(const mastery of [false,true]){
   const prepared=await page.evaluate(mastery=>{
    const data=createSaveData(),p=data.state.progression;
    const old=(skill,level,fraction,rank)=>{
     let total=lifeSkillTotalXpForLevel(skill,level,1);
     if(level===100)for(let i=0;i<rank;i++)total+=lifeSkillMasteryXpRequired(i);
     total+=level===100?17:Math.floor(lifeSkillXpForNextLevel(skill,level,1)*fraction);
     const result=lifeSkillProgressFromTotal(skill,total,1);delete result.xpCurveVersion;return result;
    };
    p.fishing={...old('fishing',mastery?100:85,.37,2),purchasedRodIds:FISHING_RODS.map(r=>r.id),
     equippedRodId:'rod.aurora',durabilityByRodId:{'rod.aurora':84}};
    p.logging=old('logging',mastery?100:99,.99,3);
    p.flags.masterRod=true;p.coins=9876;
    p.forestry={axeId:'axe.primordial',ownedAxeIds:FORESTRY_AXES.map(a=>a.id),durabilityByAxeId:{'axe.primordial':890}};
    data.state.appearance.activeTool='rod';
    data.state.inventory=[{type:'fish',id:'fish.crucian_carp',quantity:1,sizeCm:22.5,price:78},
     {type:'material',id:'oak_log',quantity:7},{type:'seed',id:'carrot',quantity:5}];
    const expectations={};for(const id of ['fishing','logging']){
     const oldProgress=p[id],before=oldProgress.level===100?oldProgress.masteryXp:oldProgress.xp;
     const required=oldProgress.level===100?lifeSkillMasteryXpRequired(oldProgress.mastery):lifeSkillXpForNextLevel(id,oldProgress.level,1);
     expectations[id]={level:oldProgress.level,percent:Math.floor(before/required*100),mastery:oldProgress.mastery,masteryXp:oldProgress.masteryXp};
    }
    window.removeEventListener('pagehide',saveGame);
    localStorage.setItem(SAVE_CONFIG.key,JSON.stringify(data));return expectations;
   },mastery);
   await page.reload();await page.waitForFunction(()=>typeof normalizeSavedLifeSkillProgress==='function'&&!document.getElementById('startupLoading'));
   const migrated=await page.evaluate(()=>{
    const p=GAME_STATE.progression;const snapshot={fishing:lifeSkillProgressSnapshot('fishing'),logging:lifeSkillProgressSnapshot('logging')};
    for(const id of ['fishing','logging'])if(p[id].xpCurveVersion!==2)throw Error('Missing curve version');
    if(p.coins!==9876||p.fishing.equippedRodId!=='rod.aurora'||p.fishing.durabilityByRodId['rod.aurora']!==84||
       p.forestry.axeId!=='axe.primordial'||p.forestry.durabilityByAxeId['axe.primordial']!==890||
       GAME_STATE.inventory.find(i=>i.id==='fish.crucian_carp')?.price!==78||
       GAME_STATE.inventory.find(i=>i.id==='carrot')?.quantity!==5||GAME_STATE.inventory.find(i=>i.id==='oak_log')?.quantity!==7)
     throw Error('Migration changed tools/items/coins');
    saveGame();return {snapshot,progress:JSON.parse(JSON.stringify({fishing:p.fishing,logging:p.logging}))};
   });
   for(const id of ['fishing','logging']){
    assert.equal(migrated.snapshot[id].level,prepared[id].level);
    assert.equal(migrated.snapshot[id].percent,prepared[id].percent);
    assert.equal(migrated.snapshot[id].mastery,prepared[id].mastery);
    assert.equal(migrated.snapshot[id].masteryXp,prepared[id].masteryXp);
   }
   const cards=await page.evaluate(()=>({fish:skillCardMarkup('fishing'),logging:skillCardMarkup('logging')}));
   assert(cards.fish.includes(`aria-valuenow="${prepared.fishing.percent}"`));
   assert(cards.logging.includes(`aria-valuenow="${prepared.logging.percent}"`));
   await page.reload();await page.waitForFunction(()=>typeof normalizeSavedLifeSkillProgress==='function'&&!document.getElementById('startupLoading'));
   assert.deepEqual(await page.evaluate(()=>JSON.parse(JSON.stringify({fishing:GAME_STATE.progression.fishing,logging:GAME_STATE.progression.logging}))),migrated.progress,'Reload applied migration twice');
   if(!mastery){
    const late=await page.evaluate(()=>{
     cancelSkillXpFeedback();Math.random=()=>.99;
     enterWorldRegion({to:'forestTwelve',entry:{x:31,y:44,face:'up'}});GAME_STATE.appearance.activeTool='axe';
     const tree=trees.find(t=>t.species==='origin_tree'&&t.interactable);
     const before=GAME_STATE.progression.logging.totalXp;
     for(let hit=0;hit<Math.ceil(FORESTRY_TREES.origin_tree.maxHp/getEquippedForestryAxe().damage);hit++)
      if(!hitResourceTree(tree))throw Error('Late tree cut failed');
     if(isTreeDiscoveryOpen())closeTreeDiscoveryReveal({fromHistory:true});
     return {gained:GAME_STATE.progression.logging.totalXp-before,required:lifeSkillProgressSnapshot('logging').requiredXp};
    });
    assert.deepEqual(late,{gained:18,required:11620});
    await page.waitForFunction(()=>document.getElementById('skillXPToast').classList.contains('show')&&document.getElementById('skillXPToast').textContent.includes('+18'));
    assert(await page.evaluate(()=>{
     const text=document.querySelector('#skillXPToast .skillCardXp'),box=text.getBoundingClientRect();
     return text.textContent.includes('11,620')&&box.left>=0&&box.right<=window.innerWidth;
    }),'Five-digit late XP did not fit the mobile card');
    await page.screenshot({path:path.join(out,`logging-late-xp-${width}.png`)});
    await page.evaluate(()=>cancelSkillXpFeedback());
   }
   migrations.push({mastery,prepared,progress:migrated.progress});
  }
  reports.push({width,fresh,migrations});await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,errors,reports},null,2));
 console.log('Growth browser passed: 393/320px, actual zero-drop +7 reward, persisted XP, Lv.85/99 bar and Lv.100 mastery migration, preserved gear/coins/items, idempotent reload');
}finally{await browser.close();}
