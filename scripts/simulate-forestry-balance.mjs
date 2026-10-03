// Read-only model. Axe damage/purchase values are live; future tree, durability and repair values are proposals.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const current=vm.runInNewContext(fs.readFileSync(path.join(root,'src/data/life-content-data.js'),'utf8')+
  ';({FORESTRY_TREES,FORESTRY_AXES,FORESTRY_CHOP_TIMING})');
const stages=[
  {tier:1,name:'기본',hp:100,damage:20,logPrice:14,xp:12,purchase:0,durability:160,repair:0},
  {tier:2,name:'철',hp:120,damage:50,logPrice:27,xp:28,purchase:3600,durability:180,repair:160},
  {tier:3,name:'강철',hp:160,damage:70,logPrice:46,xp:62,purchase:11200,durability:240,repair:500},
  {tier:4,name:'청금',hp:260,damage:90,logPrice:75,xp:90,purchase:30000,durability:360,repair:1300},
  {tier:5,name:'흑철',hp:400,damage:125,logPrice:105,xp:120,purchase:65000,durability:600,repair:2800},
  {tier:6,name:'룬',hp:620,damage:175,logPrice:145,xp:155,purchase:115000,durability:750,repair:5000},
  {tier:7,name:'정령',hp:950,damage:240,logPrice:190,xp:190,purchase:180000,durability:900,repair:7500},
  {tier:8,name:'달빛',hp:1450,damage:330,logPrice:240,xp:225,purchase:270000,durability:1200,repair:11500},
  {tier:9,name:'별빛',hp:2100,damage:450,logPrice:300,xp:260,purchase:390000,durability:1500,repair:17000},
  {tier:10,name:'태초',hp:3000,damage:620,logPrice:350,xp:300,purchase:550000,durability:1800,repair:24000}
];
const hits=(axe,tree)=>Math.ceil(tree.hp/axe.damage);
const seconds=(axe,tree)=>hits(axe,tree)*current.FORESTRY_CHOP_TIMING.durationMs/1000;
const yieldCoins=(tree,logs=2)=>tree.logPrice*logs;
const repairRatio=(index)=>{
  const axe=stages[index],previousTree=stages[index-1];
  const treesPerCycle=axe.durability/hits(axe,previousTree);
  return axe.repair/(treesPerCycle*yieldCoins(previousTree));
};

// The ten axes are live; tree HP and late-game material recipes remain provisional.
assert.deepEqual(Array.from(current.FORESTRY_AXES,a=>a.damage),stages.map(stage=>stage.damage));
assert.deepEqual(Array.from(current.FORESTRY_AXES,a=>a.coins),stages.map(stage=>stage.purchase));
assert.equal(current.FORESTRY_AXES.length,10);
assert.equal(current.FORESTRY_TREES.oak.maxHp,100);
assert.equal(current.FORESTRY_TREES.maple.maxHp,120);
assert.equal(current.FORESTRY_TREES.chestnut.maxHp,160);
assert.equal(current.FORESTRY_CHOP_TIMING.durationMs,700);

assert.equal(hits(stages[0],stages[0]),5);
assert.equal(hits(stages[1],stages[0]),2);
assert.ok(hits(stages[0],stages[9])>=80&&hits(stages[0],stages[9])<=150);
assert.ok(stages[0].durability>=hits(stages[0],stages[9]));
for(let index=0;index<stages.length;index++){
  const stage=stages[index];
  assert.ok(hits(stage,stage)>=3&&hits(stage,stage)<=6,`Stage ${stage.tier} target hits`);
  if(index===0)continue;
  assert.ok(stage.purchase>stages[index-1].purchase);
  assert.ok(stage.repair/stage.purchase>=.04&&stage.repair/stage.purchase<=.08);
  assert.ok(repairRatio(index)>=.05&&repairRatio(index)<=.12,`Stage ${stage.tier} repair burden`);
}

console.log('LIVE AXES + PROPOSED TREES/DURABILITY — this script does not modify saves');
console.log('| 단계 | 나무 HP | 도끼 피해 | 같은 단계 타수 | 기본 도끼 타수 | 목재가/개 | XP | 구매 코인 | 내구력/타격 | 완전 수리 코인 | 앞 단계 나무 판매액 대비 수리비 |');
console.log('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for(let index=0;index<stages.length;index++){
  const s=stages[index];
  console.log(`| ${s.tier} ${s.name} | ${s.hp} | ${s.damage} | ${hits(s,s)} | ${hits(stages[0],s)} | ${s.logPrice} | ${s.xp} | ${s.purchase} | ${s.durability} | ${s.repair} | ${index===0?'무료':`${(repairRatio(index)*100).toFixed(1)}%`} |`);
}
console.log('LOW-AXE REWARD CHECK — 2 logs/tree, hit animation time only; travel, rarity, materials excluded');
console.log('| 나무 단계 | 기본 도끼 타수 | 타격 시간(초) | 코인/초 | XP/초 |');
console.log('| ---: | ---: | ---: | ---: | ---: |');
for(const s of stages){
  console.log(`| ${s.tier} | ${hits(stages[0],s)} | ${seconds(stages[0],s).toFixed(1)} | ${(yieldCoins(s)/seconds(stages[0],s)).toFixed(1)} | ${(s.xp/seconds(stages[0],s)).toFixed(1)} |`);
}
