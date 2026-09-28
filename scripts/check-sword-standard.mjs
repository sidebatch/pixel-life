import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {decodePNG} from './lib/png.mjs';
import {validateTool} from './check-character-standard.mjs';

const contract=JSON.parse(fs.readFileSync('docs/sword-action-v1.json','utf8'));
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
export function checkSwordStandard(){
  assert.equal(contract.baseStandard,JSON.parse(fs.readFileSync('docs/character-standard-v4.json','utf8')).id);
  assert.equal(digest(contract.basicImage),contract.basicImageSha256,'Basic sword artwork changed');
  assert.equal(digest(contract.sourceImage),contract.sourceImageSha256,'Basic sword source changed');
  const context={};vm.createContext(context);
  vm.runInContext(fs.readFileSync('src/data/character-rig-data.js','utf8')+'\n'+
    fs.readFileSync('src/data/sword-data.js','utf8')+'\n'+
    fs.readFileSync('src/assets.js','utf8')+'\n'+
    'globalThis.sword={action:SWORD_ACTION,tools:SWORD_TOOLS,items:SWORDS,timing:SWORD_SWING_TIMING,rig:CHARACTER_RIG,urls:SWORD_TOOL_URLS,'+
    'longer:{carry:swordTargetLength({carryLength:36,swingLength:48},"walk"),swing:swordTargetLength({carryLength:36,swingLength:48},"sword")}};',context);
  const {action,tools,items,timing,rig,urls,longer}=plain(context.sword);
  assert.equal(action.artPose,contract.artPose);
  assert.equal(action.columns,contract.columns);
  assert.deepEqual(Object.keys(action.frames),contract.faces);
  for(const face of contract.faces){
    assert.equal(action.frames[face].length,2);
    for(const [frameIndex,frame] of action.frames[face].entries()){
      const base=rig.poses.chop.frames[face][frameIndex];
      assert.deepEqual(frame.grip,base.grip,`${face}/${frameIndex}: must use existing right-hand grip`);
      assert.equal(frame.toolBehind,base.toolBehind);
      assert.deepEqual(frame.headMotion,base.headMotion);
      assert(Math.abs(frame.angle-contract.angles[face][frameIndex])<1e-12,`${face}/${frameIndex}: sword angle changed`);
    }
  }
  assert(contract.angles.down[1]>0&&Math.cos(contract.angles.up[0])>0&&Math.cos(contract.angles.up[1])<0,
    'The front hit must sweep south and rear hit must cross right to left');
  assert.deepEqual(tools['sword.basic'].grip,contract.grip);
  assert.deepEqual(tools['sword.basic'].tip,contract.tip);
  assert.equal(tools['sword.basic'].carryLength,contract.carryLength);
  assert.equal(tools['sword.basic'].swingLength,contract.swingLength);
  assert.deepEqual(longer,{carry:36,swing:48},'A longer sword must keep its own display lengths');
  assert.deepEqual(Object.keys(tools).sort(),items.map(item=>item.id).sort(),'Every sword needs tool metadata');
  assert.deepEqual(Object.keys(urls).sort(),items.map(item=>item.id).sort(),'Every sword needs artwork');
  for(const item of items){
    const tool=tools[item.id],url=urls[item.id];
    assert(Number.isFinite(tool.carryLength)&&tool.carryLength>=24&&tool.carryLength<=64&&
      Number.isFinite(tool.swingLength)&&tool.swingLength>=tool.carryLength&&tool.swingLength<=64,
      `${item.id}: invalid display lengths`);
    validateTool(decodePNG(fs.readFileSync(url)),tool,item.id);
  }
  assert.equal(urls['sword.basic'],contract.basicImage);
  assert.deepEqual(timing,{impactMs:contract.impactMs,durationMs:contract.durationMs});
  assert(items.some(item=>item.id==='sword.basic'&&item.tier===1&&item.asset==='basic'));
  return {poses:contract.faces.length*2,tools:Object.keys(tools).length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=checkSwordStandard();
  console.log(`Sword standard passed: ${result.poses} swing frames, ${result.tools} sword tool(s).`);
}
