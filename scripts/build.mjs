import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const sourceHtml=read('index.html');
const sourceScriptBlock=sourceHtml.match(/<!-- build:scripts -->([\s\S]*?)<!-- \/build:scripts -->/)?.[1]||'';
const scriptFiles=[...sourceScriptBlock.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match=>match[1]);
if(!scriptFiles.length)throw new Error('No source scripts found in the build block');
const assetPattern = /(['"])(assets\/[A-Za-z0-9_./-]+\.(?:png|mp3))\1/g;

let scripts = scriptFiles.map(read).join('\n');
new Function(scripts);
scripts = scripts.replace(assetPattern, (_match, quote, relativePath) => {
  if(relativePath.startsWith('assets/audio/music/'))return `${quote}${relativePath}${quote}`;
  const bytes = fs.readFileSync(path.join(root, relativePath));
  const mimeType=relativePath.endsWith('.mp3')?'audio/mpeg':'image/png';
  return `${quote}data:${mimeType};base64,${bytes.toString('base64')}${quote}`;
});

let html = sourceHtml;
const css = read('styles/game.css');
html = html.replace(
  /<!-- build:styles -->[\s\S]*?<!-- \/build:styles -->/,
  `<!-- standalone styles -->\n<style>\n${css}</style>`
);
html = html.replace(
  /<!-- build:scripts -->[\s\S]*?<!-- \/build:scripts -->/,
  `<!-- standalone scripts -->\n<script>\n${scripts}</script>`
);

const inlineOnlyHtml=html
  .replace(/['"]assets\/audio\/music\/(?:meadow|woodland|lakeside)\.mp3['"]/g,'')
  .replace(/['"]assets\/pwa\/icon-(?:192|512)\.png['"]/g,'');
if (html.includes('<script src=') || html.includes('<link rel="stylesheet"') || /['"]assets\//.test(inlineOnlyHtml)) {
  throw new Error('Standalone build still contains external runtime dependencies');
}
if((html.match(/data:audio\/mpeg;base64,/g)||[]).length!==9){
  throw new Error('Standalone build must inline all nine game sounds');
}

const outputDirectory = path.join(root, 'dist');
fs.mkdirSync(outputDirectory, { recursive: true });
const outputFile = path.join(outputDirectory, 'index.html');
fs.writeFileSync(outputFile, html);
const musicDirectory=path.join(outputDirectory,'assets/audio/music');
fs.mkdirSync(musicDirectory,{recursive:true});
for(const track of ['meadow','woodland','lakeside']){
  const relative=`assets/audio/music/${track}.mp3`;
  if(!html.includes(relative))throw new Error(`Missing streaming music reference: ${relative}`);
  fs.copyFileSync(path.join(root,relative),path.join(musicDirectory,`${track}.mp3`));
}

for(const relative of ['manifest.webmanifest','assets/pwa/icon-192.png','assets/pwa/icon-512.png']){
  const source=path.join(root,relative),destination=path.join(outputDirectory,relative);
  if(!fs.existsSync(source))throw new Error(`Missing PWA file: ${relative}`);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}
const serviceWorkerSource=read('service-worker.js');
const buildHash=crypto.createHash('sha256').update(html).update(serviceWorkerSource);
for(const relative of ['manifest.webmanifest','assets/pwa/icon-192.png','assets/pwa/icon-512.png',
  'assets/audio/music/meadow.mp3','assets/audio/music/woodland.mp3','assets/audio/music/lakeside.mp3']){
  buildHash.update(fs.readFileSync(path.join(root,relative)));
}
const buildId=buildHash.digest('hex').slice(0,12);
const serviceWorker=serviceWorkerSource.replaceAll('__PIXEL_LIFE_BUILD_ID__',buildId);
if(serviceWorker.includes('__PIXEL_LIFE_BUILD_ID__'))throw new Error('Service worker build ID was not replaced');
fs.writeFileSync(path.join(outputDirectory,'service-worker.js'),serviceWorker);

console.log(`Built and verified ${path.relative(root, outputFile)} (${fs.statSync(outputFile).size.toLocaleString()} bytes, PWA ${buildId})`);
