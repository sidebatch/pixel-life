// Negative fixtures stay in memory: never change real art or player saves.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {blank,crop,decodePNG} from './lib/png.mjs';
import {checkCharacterStandard,validateAtlas,validateNeckOverlap,validateOutfit,validateTool} from './check-character-standard.mjs';
const contract=JSON.parse(fs.readFileSync('docs/character-standard-v3.json','utf8'));
const outfit=decodePNG(fs.readFileSync('assets/player/npc-v1/walk-outfit.png'));
const tool=decodePNG(fs.readFileSync('assets/player/rig-v1/tools/axe-basic.png'));
const meta=contract.existingTools['axe.basic'];
let rejected=0;
function fails(fn,pattern){assert.throws(fn,pattern);rejected++;}
validateAtlas(outfit,3,'valid outfit');validateOutfit(outfit,outfit,'valid mask');validateTool(tool,meta,'valid tool');
const body=decodePNG(fs.readFileSync('assets/player/npc-v1/walk-body.png'));
const head=decodePNG(fs.readFileSync('assets/player/npc-ria-v3/walk-head.png'));
const commonFront=crop(body,0,0,96,96);
assert(validateNeckOverlap(commonFront,crop(head,0,0,96,96),'ria','down')>=30,
  'Ria v3 chin must sit into the fixed collar, not reuse the thin v2 bridge');
const oldRia=decodePNG(fs.readFileSync('assets/player/npc-ria-v2/walk-head.png'));
assert(validateNeckOverlap(commonFront,crop(oldRia,0,0,96,96),'ria v2 reference','down')<30,
  'the historical detached-neck art must remain a meaningful regression fixture');
fails(()=>validateNeckOverlap(crop(body,0,0,96,96),blank(96,96),'fixture','down'),/detached head/);
fails(()=>validateAtlas(blank(287,384),3,'fixture'),/width/);
fails(()=>validateAtlas(blank(288,383),3,'fixture'),/height/);
const changed={...outfit,data:Buffer.from(outfit.data)};changed.data[3]=changed.data[3]===0?255:0;
fails(()=>validateOutfit(changed,outfit,'fixture'),/silhouette/);
fails(()=>validateTool(blank(95,96),meta,'fixture'),/width/);
fails(()=>validateTool(tool,{...meta,grip:[-1,77]},'fixture'),/grip/);
fails(()=>validateTool(tool,{...meta,tip:[96,31]},'fixture'),/tip/);
fails(()=>validateTool(tool,{...meta,nativeLength:0},'fixture'),/length/);
fails(()=>validateTool(tool,{...meta,nativeAngle:0},'fixture'),/axis/);
fails(()=>validateTool(blank(96,96),meta,'fixture'),/empty/);
const altered=structuredClone(contract);altered.protectedFiles['src/character.js']='wrong';
fails(()=>checkCharacterStandard(altered),/Frozen reference/);
const wrongRig=structuredClone(contract);wrongRig.geometryHash='wrong';
fails(()=>checkCharacterStandard(wrongRig),/coordinates/);
console.log('PASS: '+JSON.stringify({...checkCharacterStandard(),invalidFixturesRejected:rejected}));
