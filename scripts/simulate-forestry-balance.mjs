// Read-only end-to-end progression model. All tree, axe, recipe and timing
// values come from the live game data, including durability and repair costs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const lifeDataSource=fs.readFileSync(path.join(root,'src/data/life-content-data.js'),'utf8');
const current=vm.runInNewContext(`${lifeDataSource};({FORESTRY_TREES,FORESTRY_AXES,FORESTRY_CHOP_TIMING,
  FORESTRY_LOG_DROP_TABLE,FORESTRY_EXPECTED_LOGS_PER_TREE,FORESTRY_LOGGING_XP_RATE,forestryTreeXp})`);
const skillDataSource=fs.readFileSync(path.join(root,'src/data/life-skill-data.js'),'utf8');
const skillLogicSource=fs.readFileSync(path.join(root,'src/life-skills.js'),'utf8');
const skillModel=vm.runInNewContext(`${skillDataSource}\n${skillLogicSource};({lifeSkillProgressFromTotal})`);
const regionDataSource=fs.readFileSync(path.join(root,'src/data/region-maps.js'),'utf8');
const woodNamesEnd=regionDataSource.indexOf('const FOREST_SPECIES=');
assert.ok(woodNamesEnd>0,'Could not locate the live forestry species names');
const woodNames=vm.runInNewContext(`${regionDataSource.slice(0,woodNamesEnd)};FOREST_WOOD`,{WORLD_DEFINITION:{}});

const numericOption=(name,fallback)=>{
  const prefix=`--${name}=`;
  const raw=process.argv.find(argument=>argument.startsWith(prefix))?.slice(prefix.length);
  if(raw===undefined)return fallback;
  const value=Number(raw);
  assert.ok(Number.isFinite(value)&&value>=0,`${prefix} must be a non-negative number`);
  return value;
};
const json=process.argv.includes('--json');
const treeOverheadSeconds=numericOption('tree-overhead',2);
const dropsPerTree=numericOption('drops',current.FORESTRY_EXPECTED_LOGS_PER_TREE);
assert.ok(dropsPerTree>0&&dropsPerTree<=3,'--drops must be greater than 0 and at most 3');

const treesByTier=new Map();
for(const [species,tree] of Object.entries(current.FORESTRY_TREES)){
  const list=treesByTier.get(tree.tier)||[];
  list.push({species,name:woodNames[species]||species,...tree});
  treesByTier.set(tree.tier,list);
}
const hits=(axe,tree)=>Math.ceil(tree.maxHp/axe.damage);
const chopSeconds=(axe,tree)=>hits(axe,tree)*current.FORESTRY_CHOP_TIMING.durationMs/1000;
const cycleSeconds=(axe,tree)=>chopSeconds(axe,tree)+treeOverheadSeconds;
const amortizedRepairCoins=(axe,tree)=>axe.maxDurability?
  hits(axe,tree)*tree.tier*axe.repairCoins/axe.maxDurability:0;
const netTreeCoins=(axe,tree,dropCount)=>tree.logPrice*dropCount-amortizedRepairCoins(axe,tree);
const formatDuration=seconds=>{
  const rounded=Math.round(seconds);
  const hours=Math.floor(rounded/3600),minutes=Math.floor((rounded%3600)/60),secs=rounded%60;
  return hours?`${hours}시간 ${minutes}분`:minutes?`${minutes}분 ${secs}초`:`${secs}초`;
};
const materialSpecies=id=>id.endsWith('_log')?id.slice(0,-4):null;

assert.equal(current.FORESTRY_AXES.length,10);
assert.equal(Object.keys(current.FORESTRY_TREES).length,50);
assert.equal(current.FORESTRY_CHOP_TIMING.durationMs,700);
assert.deepEqual(Array.from(current.FORESTRY_AXES,axe=>axe.tier),[1,2,3,4,5,6,7,8,9,10]);
for(const axe of current.FORESTRY_AXES.slice(1)){
  assert.ok(Object.keys(axe.materials).length>0,`${axe.id} has no material recipe`);
  for(const [id,count] of Object.entries(axe.materials)){
    const species=materialSpecies(id),tree=current.FORESTRY_TREES[species];
    assert.ok(tree,`${axe.id} references unknown material ${id}`);
    assert.equal(tree.tier,axe.tier-1,`${axe.id} must only use wood from Tier ${axe.tier-1}`);
    assert.ok(Number.isSafeInteger(count)&&count>0,`${axe.id} has an invalid material count for ${id}`);
  }
}

// Use the same two-second movement proxy as the default report. Zero movement
// is not a playable scenario because every completed tree requires selecting
// and reaching another tree; Android timing will replace this proxy later.
const balanceRegressionOverheadSeconds=2;
const tierDominance=current.FORESTRY_AXES.map(axe=>{
  const newest=treesByTier.get(axe.tier).toSorted((a,b)=>b.logPrice-a.logPrice)[0];
  const older=Array.from(treesByTier.values()).flat().filter(tree=>tree.tier<axe.tier);
  const efficiency=tree=>netTreeCoins(axe,tree,current.FORESTRY_EXPECTED_LOGS_PER_TREE)/
    (chopSeconds(axe,tree)+balanceRegressionOverheadSeconds);
  const regressions=older.filter(tree=>efficiency(newest)<efficiency(tree));
  assert.equal(regressions.length,0,
    `Tier ${axe.tier} coin efficiency backtracks to ${regressions.map(tree=>tree.species).join(', ')}`);
  return {tier:axe.tier,species:newest.species,name:newest.name,price:newest.logPrice,hits:hits(axe,newest),
    netCoinsPerTree:netTreeCoins(axe,newest,current.FORESTRY_EXPECTED_LOGS_PER_TREE)};
});

function simulateProgression(dropCount){
  let coins=0,totalTrees=0,totalXp=0,totalChopSeconds=0,totalCycleSeconds=0,totalRepairs=0,totalRepairCoins=0;
  const stages=[];
  for(let index=1;index<current.FORESTRY_AXES.length;index++){
    const axe=current.FORESTRY_AXES[index],equipped=current.FORESTRY_AXES[index-1];
    const accessible=Array.from(treesByTier.values()).flat().filter(tree=>tree.tier<=equipped.tier);
    const coinTree=accessible.toSorted((a,b)=>
      (netTreeCoins(equipped,b,dropCount)/cycleSeconds(equipped,b))-
      (netTreeCoins(equipped,a,dropCount)/cycleSeconds(equipped,a))||b.logPrice-a.logPrice)[0];
    let materialTrees=0,materialHits=0,materialXp=0,materialChopSeconds=0,materialCycleSeconds=0,surplusCoins=0;
    const materials=[];
    for(const [id,requiredLogs] of Object.entries(axe.materials)){
      const species=materialSpecies(id),tree=current.FORESTRY_TREES[species];
      const treeCount=Math.ceil(requiredLogs/dropCount),harvestedLogs=treeCount*dropCount;
      const surplusLogs=harvestedLogs-requiredLogs;
      materialTrees+=treeCount;
      materialHits+=treeCount*hits(equipped,tree);
      materialXp+=treeCount*current.forestryTreeXp(tree);
      materialChopSeconds+=treeCount*chopSeconds(equipped,tree);
      materialCycleSeconds+=treeCount*cycleSeconds(equipped,tree);
      surplusCoins+=surplusLogs*tree.logPrice;
      materials.push({id,species,name:woodNames[species]||species,requiredLogs,treeCount,surplusLogs});
    }
    const coinsPerFarmTree=coinTree.logPrice*dropCount;
    let coinTrees=0,repairCount=0,repairCoins=0;
    for(let pass=0;pass<100;pass++){
      const totalHits=materialHits+coinTrees*hits(equipped,coinTree);
      const hitsPerDurability=equipped.maxDurability?Math.ceil(equipped.maxDurability/equipped.tier):Infinity;
      repairCount=Number.isFinite(hitsPerDurability)?Math.floor(Math.max(0,totalHits-1)/hitsPerDurability):0;
      repairCoins=repairCount*equipped.repairCoins;
      const coinShortfall=Math.max(0,axe.coins+repairCoins-coins-surplusCoins);
      const nextCoinTrees=Math.ceil(coinShortfall/coinsPerFarmTree);
      if(nextCoinTrees===coinTrees)break;
      coinTrees=nextCoinTrees;
      assert.ok(pass<99,`${axe.id} repair/coin calculation did not converge`);
    }
    const coinFarmRevenue=coinTrees*coinsPerFarmTree;
    const coinXp=coinTrees*current.forestryTreeXp(coinTree);
    const coinChopSeconds=coinTrees*chopSeconds(equipped,coinTree);
    const coinCycleSeconds=coinTrees*cycleSeconds(equipped,coinTree);
    coins+=surplusCoins+coinFarmRevenue-repairCoins;
    assert.ok(coins>=axe.coins,`${axe.id} coin farm did not reach its purchase price`);
    coins-=axe.coins;
    const stageTrees=materialTrees+coinTrees,stageXp=materialXp+coinXp;
    const stageChopSeconds=materialChopSeconds+coinChopSeconds;
    const stageCycleSeconds=materialCycleSeconds+coinCycleSeconds;
    totalTrees+=stageTrees;
    totalXp+=stageXp;
    totalChopSeconds+=stageChopSeconds;
    totalCycleSeconds+=stageCycleSeconds;
    totalRepairs+=repairCount;
    totalRepairCoins+=repairCoins;
    const loggingProgress=skillModel.lifeSkillProgressFromTotal('logging',totalXp);
    stages.push({
      fromTier:equipped.tier,toTier:axe.tier,axeId:axe.id,axeName:axe.name,purchaseCoins:axe.coins,
      recipeLogs:Object.values(axe.materials).reduce((sum,count)=>sum+count,0),materials,
      materialTrees,surplusCoins,coinFarmSpecies:coinTree.species,coinFarmName:coinTree.name,
      coinFarmTier:coinTree.tier,backtracksForCoins:coinTree.tier<equipped.tier,
      coinTrees,coinFarmRevenue,stageTrees,stageXp,stageChopSeconds,stageCycleSeconds,
      repairCount,repairCoins,
      carriedCoins:coins,totalTrees,totalXp,totalChopSeconds,totalCycleSeconds,
      loggingLevel:loggingProgress.level,loggingMastery:loggingProgress.mastery,
      targetTreeHits:hits(equipped,treesByTier.get(equipped.tier)[0])
    });
  }
  const loggingProgress=skillModel.lifeSkillProgressFromTotal('logging',totalXp);
  return {dropCount,treeOverheadSeconds,stages,totals:{trees:totalTrees,xp:totalXp,
    loggingLevel:loggingProgress.level,loggingMastery:loggingProgress.mastery,
    chopSeconds:totalChopSeconds,cycleSeconds:totalCycleSeconds,coins,repairs:totalRepairs,repairCoins:totalRepairCoins}};
}

const selected=simulateProgression(dropsPerTree);
const sensitivity=[1,current.FORESTRY_EXPECTED_LOGS_PER_TREE,2,3].map(simulateProgression);
const report={
  assumptions:{dropsPerTree,dropTable:Array.from(current.FORESTRY_LOG_DROP_TABLE),
    noDropChance:current.FORESTRY_LOG_DROP_TABLE.filter(count=>count===0).length/current.FORESTRY_LOG_DROP_TABLE.length,
    loggingXpRate:current.FORESTRY_LOGGING_XP_RATE,treeOverheadSeconds,treeRespawnMinutes:5,
    notes:['재료 목재는 보관하고 초과분만 판매','부족한 코인은 현재 접근 가능한 나무 중 시간당 판매 효율이 가장 높은 수종으로 충당',
      '기본 도끼는 무한 내구도, 유료 도끼는 나무 단계만큼 타격 내구도 감소','내구도 0 뒤 추가 타격이 필요할 때 전체 수리비를 지출',
      '이동·메뉴·나무 탐색은 나무당 추가 시간으로 근사','마을 수리 왕복·나무 재생 대기·동시 보유 나무 수 제한은 계산에서 제외']},
  live:{axes:current.FORESTRY_AXES.length,trees:Object.keys(current.FORESTRY_TREES).length,
    chopDurationMs:current.FORESTRY_CHOP_TIMING.durationMs,balanceRegressionOverheadSeconds,tierDominance},
  selected,sensitivity:sensitivity.map(result=>({dropCount:result.dropCount,...result.totals}))
};

if(json){
  console.log(JSON.stringify(report,null,2));
  process.exit(0);
}

console.log('LIVE FORESTRY 1→10 PROGRESSION — read-only; saves are not modified');
console.log(`Assumptions: ${dropsPerTree} logs/tree, ${treeOverheadSeconds.toFixed(1)}s movement/selection overhead per tree, 0 starting coins`);
console.log('| 구매 도끼 | 제작 목재 | 재료용 나무 | 코인 파밍 수종 | 코인용 나무 | 총 나무 | 수리 | 수리비 | 현 도끼 적정 타수 | 플레이 근사 | 단계 XP | 누적 벌목 | 구매 후 코인 |');
console.log('| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for(const stage of selected.stages){
  const farmLabel=`${stage.coinFarmName} (${stage.coinFarmTier}단계${stage.backtracksForCoins?' 역주행':''})`;
  const loggingLabel=stage.loggingLevel<100?`Lv.${stage.loggingLevel}`:`Lv.100 숙련 ${stage.loggingMastery}`;
  console.log(`| ${stage.toTier}단계 ${stage.axeName} | ${stage.recipeLogs} | ${stage.materialTrees} | ${farmLabel} | ${stage.coinTrees} | ${stage.stageTrees} | ${stage.repairCount}회 | ${stage.repairCoins.toLocaleString()} | ${stage.targetTreeHits} | ${formatDuration(stage.stageCycleSeconds)} | ${stage.stageXp.toLocaleString()} | ${loggingLabel} | ${stage.carriedCoins.toLocaleString()} |`);
}
console.log('\nDROP SENSITIVITY — fixed yield envelopes, not probability estimates');
console.log('| 목재/나무 | 10단계까지 나무 | 수리 | 수리비 | 타격만 | 플레이 근사 | 누적 XP | 최종 벌목 |');
console.log('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for(const result of sensitivity){
  console.log(`| ${result.dropCount} | ${result.totals.trees.toLocaleString()} | ${result.totals.repairs}회 | ${result.totals.repairCoins.toLocaleString()} | ${formatDuration(result.totals.chopSeconds)} | ${formatDuration(result.totals.cycleSeconds)} | ${result.totals.xp.toLocaleString()} | Lv.${result.totals.loggingLevel} 숙련 ${result.totals.loggingMastery} |`);
}
const slowest=selected.stages.toSorted((a,b)=>b.stageCycleSeconds-a.stageCycleSeconds)[0];
console.log(`\nAverage-yield bottleneck: ${slowest.axeName} purchase, ${slowest.stageTrees.toLocaleString()} trees / ${formatDuration(slowest.stageCycleSeconds)}.`);
const backtracks=selected.stages.filter(stage=>stage.backtracksForCoins);
if(backtracks.length)console.log(`Backtracking warning: ${backtracks.map(stage=>`${stage.axeName} 구매 전 ${stage.coinFarmTier}단계 ${stage.coinFarmName}`).join(', ')} is more efficient than farming the newest unlocked tier.`);
console.log('Use --json for machine-readable output, --drops=<value above 0 through 3> to select an average yield, and --tree-overhead=<seconds> after device timing.');
