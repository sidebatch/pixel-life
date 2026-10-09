// Real loading work, including conditional art, optional fallback and failures.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const config=fs.readFileSync(new URL('../src/config.js',import.meta.url),'utf8');
const source=config.slice(config.indexOf('function loadImage('),config.indexOf('// Code-native'))+
  config.slice(config.indexOf('async function loadAll('));
async function check({preview=false,fail='',invalid=false,rigFailure=false}={}){
  const pending=[],progress=[];
  const context={console:{warn(){}},CHARACTER_MASTER_PREVIEW_ENABLED:preview,CHARACTER_RIA_NECK_PREVIEW_ENABLED:false,
    DEFAULT_OUTFIT_ID:'starter',CHARACTER_RIG:{cell:96,poses:{walk:{columns:1},chop:{columns:1},fish:{columns:1}}},
    CHARACTER_OUTFITS:[{id:'starter'},{id:'palette',renderMode:'palette-test'},
      {id:'extra',layers:{walk:'outfit-walk',chop:'outfit-chop',fish:'outfit-fish'}}],
    CHARACTER_WARDROBE_PREVIEW_URLS:{extra:{walk:'corrected-walk',chop:'corrected-chop',fish:'corrected-fish'}},
    characterOutfitImgs:{},characterOutfitPreviewImgs:{},
    prepareCharacterRiaNeckPreview(){},prepareCharacterMasterPreview(){},prepareCharacterTrialSet(){},
    validateCharacterRigAssets(){if(rigFailure)throw new Error('Rig failure');},
    Image:class{set src(url){this.width=invalid&&url==='outfit-walk'?1:96;this.height=384;
      pending.push(()=>url===fail?this.onerror(new Error('Load failure')):this.onload());}}};
  for(const target of ['imgs','fishImgs','forestTreeImgs','forestStumpImgs','characterLayerImgs',
    'characterBaselineLegacyImgs','characterToolImgs','lifeItemImgs','matureCropImgs','youngCropImgs','npcImgs'])context[target]={};
  for(const urls of ['ASSET_URLS','BUILDING_URLS','FISH_URLS','FOREST_TREE_URLS','FOREST_STUMP_URLS',
    'CHARACTER_LAYER_URLS','CHARACTER_BASELINE_LEGACY_URLS','CHARACTER_TOOL_URLS','SWORD_TOOL_URLS',
    'LIFE_ITEM_URLS','MATURE_CROP_URLS','YOUNG_CROP_URLS','NPC_SHEET_URLS'])context[urls]={one:urls};
  vm.createContext(context);vm.runInContext(source,context);
  let settled=false,error;
  const loading=context.loadAll((completed,total)=>progress.push({completed,total})).catch(e=>{error=e;}).finally(()=>settled=true);
  assert.equal(progress.length,1);assert.equal(progress[0].completed,0);
  pending.shift()();await new Promise(resolve=>setImmediate(resolve));
  if(!fail)assert.equal(progress[1].completed,1);
  for(let turn=0;!settled&&turn<50;turn++){
    pending.splice(0).forEach(done=>done());await new Promise(resolve=>setImmediate(resolve));
  }
  assert(settled,'Loading hung');await loading;
  const total=12+(preview?1:0)+6+1;
  assert(progress.every((p,i)=>p.total===total&&p.completed<=total&&(i===0||p.completed===progress[i-1].completed+1)));
  if(fail&&fail!=='NPC_SHEET_URLS'||invalid||rigFailure){assert(error);assert(progress.at(-1).completed<total);}
  else{assert(!error);assert.equal(progress.at(-1).completed,total);}
  return {total,completed:progress.at(-1).completed};
}
await check();await check({preview:true});await check({fail:'NPC_SHEET_URLS'});
await check({fail:'ASSET_URLS'});await check({invalid:true});await check({rigFailure:true});
console.log('Startup progress QA passed: actual work counts, conditional art, optional fallback, load/atlas/rig failures');
