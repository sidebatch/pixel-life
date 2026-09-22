import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scriptFiles = [
  'src/assets.js',
  'src/data/world-map.js',
  'src/data/fish-data.js',
  'src/world-time.js',
  'src/weather.js',
  'src/config.js',
  'src/save.js',
  'src/world.js',
  'src/world-validation.js',
  'src/simulation.js',
  'src/debug.js',
  'src/rendering.js',
  'src/interactions.js',
  'src/fishing.js',
  'src/fish-dex.js',
  'src/main.js'
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const imagePattern = /(['"])(assets\/[A-Za-z0-9_./-]+\.png)\1/g;

let scripts = scriptFiles.map(read).join('\n');
new Function(scripts);
scripts = scripts.replace(imagePattern, (_match, quote, relativePath) => {
  const bytes = fs.readFileSync(path.join(root, relativePath));
  return `${quote}data:image/png;base64,${bytes.toString('base64')}${quote}`;
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

const outputDirectory = path.join(root, 'dist');
fs.mkdirSync(outputDirectory, { recursive: true });
const outputFile = path.join(outputDirectory, 'index.html');
fs.writeFileSync(outputFile, html);

console.log(`Built and verified ${path.relative(root, outputFile)} (${fs.statSync(outputFile).size.toLocaleString()} bytes)`);
