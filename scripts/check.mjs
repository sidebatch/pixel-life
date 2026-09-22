import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const scriptFiles = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/world-time.js',
  'src/weather.js',
  'src/config.js',
  'src/world.js',
  'src/world-validation.js',
  'src/simulation.js',
  'src/debug.js',
  'src/rendering.js',
  'src/interactions.js',
  'src/main.js'
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const html = read('index.html');
const scripts = scriptFiles.map(read).join('\n');
new Function(scripts);

const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const usedIds = [...scripts.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((match) => match[1]);
for (const id of usedIds) assert(htmlIds.has(id), `Missing HTML element: #${id}`);

const assetPaths = [...read('src/assets.js').matchAll(/['"](assets\/[^'"]+\.png)['"]/g)].map((match) => match[1]);
assert(assetPaths.length === 34, `Expected 34 runtime asset references, found ${assetPaths.length}`);
for (const assetPath of assetPaths) {
  assert(fs.existsSync(path.join(root, assetPath)), `Missing asset: ${assetPath}`);
}

for (const npc of ['mina', 'thomas', 'elli', 'noah', 'hana', 'jun']) {
  assert(read('src/data/world-map.js').includes(`id:'${npc}'`), `Missing NPC record: ${npc}`);
}

assert(!read('src/assets.js').includes('base64,'), 'Development asset map must not contain embedded images');

const validationScripts = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/config.js',
  'src/world.js',
  'src/world-validation.js'
].map(read).join('\n');
const canvasContext = {};
const validationContext = {
  console: { info(){}, warn(){}, error: console.error },
  Image: class {},
  document: {
    getElementById(id){
      if(id!=='game') return null;
      return { width:540, height:960, getContext:()=>canvasContext };
    }
  }
};
vm.createContext(validationContext);
vm.runInContext(`${validationScripts}\nglobalThis.__worldReport=WORLD_VALIDATION_REPORT;`,validationContext);
const worldReport=validationContext.__worldReport;
assert(worldReport.map==='64x48',`Expected expanded 64x48 world, found ${worldReport.map}`);
assert(worldReport.errors.length===0,`World validation has ${worldReport.errors.length} errors`);

console.log(`Checks passed: ${scriptFiles.length} scripts, ${htmlIds.size} UI ids, ${assetPaths.length} runtime assets, world ${worldReport.map}`);
