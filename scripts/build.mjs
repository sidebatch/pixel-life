import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scriptFiles = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/data/fish-data.js',
  'src/data/fishing-gear-data.js',
  'src/data/life-skill-data.js',
  'src/world-time.js',
  'src/weather.js',
  'src/config.js',
  'src/life-skills.js',
  'src/save.js',
  'src/world.js',
  'src/world-validation.js',
  'src/simulation.js',
  'src/debug.js',
  'src/rendering.js',
  'src/interactions.js',
  'src/fishing-effects.js',
  'src/fishing.js',
  'src/skill-ui.js',
  'src/fish-dex.js',
  'src/fishing-gear.js',
  'src/inventory.js',
  'src/market.js',
  'src/main.js'
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assetPattern = /(['"])(assets\/[A-Za-z0-9_./-]+\.(?:png|mp3))\1/g;

let scripts = scriptFiles.map(read).join('\n');
new Function(scripts);
scripts = scripts.replace(assetPattern, (_match, quote, relativePath) => {
  const bytes = fs.readFileSync(path.join(root, relativePath));
  const mimeType=relativePath.endsWith('.mp3')?'audio/mpeg':'image/png';
  return `${quote}data:${mimeType};base64,${bytes.toString('base64')}${quote}`;
});

let html = read('index.html');
const css = read('styles/game.css');
html = html.replace(
  /<!-- build:styles -->[\s\S]*?<!-- \/build:styles -->/,
  `<!-- standalone styles -->\n<style>\n${css}</style>`
);
html = html.replace(
  /<!-- build:scripts -->[\s\S]*?<!-- \/build:scripts -->/,
  `<!-- standalone scripts -->\n<script>\n${scripts}</script>`
);

if (html.includes('<script src=') || html.includes('<link rel="stylesheet"') || /['"]assets\//.test(html)) {
  throw new Error('Standalone build still contains external runtime dependencies');
}
if((html.match(/data:audio\/mpeg;base64,/g)||[]).length!==4){
  throw new Error('Standalone build must inline all four game sounds');
}

const outputDirectory = path.join(root, 'dist');
fs.mkdirSync(outputDirectory, { recursive: true });
const outputFile = path.join(outputDirectory, 'index.html');
fs.writeFileSync(outputFile, html);

console.log(`Built and verified ${path.relative(root, outputFile)} (${fs.statSync(outputFile).size.toLocaleString()} bytes)`);
