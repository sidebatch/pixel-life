import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {decodePNG,alphaBounds} from './lib/png.mjs';
export function checkWorldSkillIcons(){
  const context=vm.createContext({});
  for(const file of ['src/assets.js','src/data/world-map.js','src/data/region-maps.js','src/data/life-skill-data.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  const data=vm.runInContext('({regions:REGION_WORLDS,regionIcons:REGION_ICON_URLS,skills:LIFE_SKILLS,skillIcons:LIFE_SKILL_ICON_URLS})',context);
  assert.deepEqual(Object.keys(data.regions).sort(),Object.keys(data.regionIcons).sort(),'Every region must explicitly register an icon, with no stale maps');
  assert.deepEqual(Object.keys(data.skills).sort(),Object.keys(data.skillIcons).sort(),'Every skill needs a registered raster icon');
  const byName=new Map(),usedArt=new Map();
  for(const [id,file]of Object.entries({...data.regionIcons,...data.skillIcons})){
    const bytes=fs.readFileSync(file),image=decodePNG(bytes),b=alphaBounds(image);
    assert.equal(image.width,128,id);assert.equal(image.height,128,id);
    assert(b.width>0&&b.height>0&&b.x>=7&&b.y>=7&&b.x+b.width<=121&&b.y+b.height<=121,'Icon needs visible art and transparent breathing room: '+id);
    if(!data.regions[id])continue;
    const name=data.regions[id].name,art=bytes.toString('base64');
    assert(!byName.has(name)||byName.get(name)===file,'One region name must keep one icon: '+name);
    assert(!usedArt.has(art)||usedArt.get(art)===name,'Different region names must use visibly distinct bitmap assets: '+name);
    byName.set(name,file);usedArt.set(art,name);
  }
  console.log(`World/skill icons passed: ${byName.size} distinct regions, ${Object.keys(data.skills).length} skills, transparent 128px PNGs.`);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/check-world-skill-icons.mjs'))checkWorldSkillIcons();
