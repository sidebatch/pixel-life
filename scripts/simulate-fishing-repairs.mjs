import fs from 'node:fs';
import path from 'node:path';
import {simulateRodMaterials,quantile} from './lib/fishing-progression.mjs';
const samples=Number(process.argv.find(a=>a.startsWith('--samples='))?.split('=')[1]??16);
if(!Number.isInteger(samples)||samples<1||samples>256)throw Error('Samples must be 1–256');
const rows=Array.from({length:samples},(_,i)=>simulateRodMaterials(i+1)).flat();
const summary=[...new Set(rows.map(r=>r.targetId))].map(targetId=>{
  const values=rows.filter(r=>r.targetId===targetId);
  return {targetId,previousId:values[0].previousId,maxDurability:values[0].maxDurability,samples,
    complete:values.filter(r=>r.complete).length,noRepairs:values.filter(r=>!r.repairs).length,
    minCatches:Math.min(...values.map(r=>r.catches)),medianCatches:quantile(values.map(r=>r.catches),.5),
    minRepairs:Math.min(...values.map(r=>r.repairs)),medianRepairs:quantile(values.map(r=>r.repairs),.5)};
});
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({rows,summary},null,2));}
console.log(JSON.stringify(summary,null,2));
