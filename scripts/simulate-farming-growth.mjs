import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=['src/data/life-content-data.js','src/data/life-skill-data.js','src/life-skills.js'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
const {crops,xpForCrop,base,progress}=new Function(data+'\nreturn {crops:LIFE_CONTENT.crops,xpForCrop:farmingCropXp,base:lifeSkillTotalXpForLevel,progress:lifeSkillProgressFromTotal};')();
const rows=crops.map(c=>({id:c.id,name:c.name,minutes:c.growMs/60000,xp:xpForCrop(c),xpPerMinute:xpForCrop(c)/(c.growMs/60000)}));
assert(rows.every(row=>row.xpPerMinute===12),'Every crop should reward equal XP for equal full growth time');
const scenarios=[];
for(const plots of [4,16])for(const revisit of [0,15,30,60])for(const crop of rows){
  const cycle=revisit?Math.ceil(crop.minutes/revisit)*revisit:crop.minutes,xpPerBatch=crop.xp*plots;
  scenarios.push({plots,revisitMinutes:revisit,crop:crop.id,cycleMinutes:cycle,
    hoursToLevel10:Math.ceil(base('farming',10)/xpPerBatch)*cycle/60,
    hoursToLevel20:Math.ceil(base('farming',20)/xpPerBatch)*cycle/60,
    hoursToLevel100:Math.ceil(base('farming',100)/xpPerBatch)*cycle/60,
    progressAfterHours:[1,6,24].map(hours=>({hours,...progress('farming',Math.floor(hours*60/cycle)*xpPerBatch)}))});
}
const report={assumptions:'All owned beds planted together; enough seeds; fixed visits or immediate harvest; only completed harvests grant XP; excludes planting, travel, harvest animation and expansion cost.',
  target100:base('farming',100),rows,scenarios};
fs.mkdirSync('output/farming-progression-v1',{recursive:true});fs.writeFileSync('output/farming-progression-v1/growth.json',JSON.stringify(report,null,2)+'\n');
console.table(rows);
console.log('Farming growth simulation: 112 crop/plot/revisit cases, shared Lv.100 target '+report.target100+' XP; ideal 4-bed '+(report.target100/48/60).toFixed(2)+'h / 16-bed '+(report.target100/192/60).toFixed(2)+'h.');
