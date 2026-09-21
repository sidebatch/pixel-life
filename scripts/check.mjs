import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scriptFiles = [
  'src/assets.js',
  'src/config.js',
  'src/world.js',
  'src/simulation.js',
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
  assert(read('src/world.js').includes(`id:'${npc}'`), `Missing NPC record: ${npc}`);
}

assert(!read('src/assets.js').includes('base64,'), 'Development asset map must not contain embedded images');
console.log(`Checks passed: ${scriptFiles.length} scripts, ${htmlIds.size} UI ids, ${assetPaths.length} runtime assets`);
