import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {decodePNG} from './lib/png.mjs';

const site='https://sidebatch.github.io/pixel-life/';
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

// Verify the raw head: link crawlers must not need JavaScript or the game canvas.
export function validateSocialShare(html,readAsset){
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert(head,'Missing HTML head');
  const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));
  const meta=new Map();
  for(const tag of head.match(/<meta\b[^>]*>/gi)||[]){
    const a=attrs(tag),key=a.property||a.name;
    if(!key)continue;
    assert(!meta.has(key),'Duplicate metadata: '+key);
    meta.set(key,a.content);
  }
  const get=key=>{assert(meta.get(key)?.trim(),'Missing share metadata: '+key);return meta.get(key);};
  const canonical=(head.match(/<link\b[^>]*>/gi)||[]).map(attrs).filter(a=>a.rel==='canonical');
  assert.equal(canonical.length,1);assert.equal(canonical[0].href,site);
  assert.equal(get('og:url'),site);assert.equal(get('og:type'),'website');
  assert.equal(get('og:site_name'),'Pixel Life');assert.equal(get('og:locale'),'ko_KR');
  assert.equal(get('og:title'),'Pixel Life');assert.equal(get('twitter:title'),get('og:title'));
  assert.equal(get('description'),get('og:description'));assert.equal(get('twitter:description'),get('og:description'));
  assert.equal(get('twitter:card'),'summary_large_image');
  assert.equal(get('og:image:secure_url'),get('og:image'));assert.equal(get('twitter:image'),get('og:image'));
  assert.equal(get('twitter:image:alt'),get('og:image:alt'));assert.equal(get('og:image:type'),'image/png');
  const image=new URL(get('og:image'));
  assert(image.href.startsWith(site+'assets/social/')&&!image.search&&!image.hash,'Share image must be a versioned public HTTPS file');
  const relative=image.href.slice(site.length),bytes=readAsset(relative);
  assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Share image must be a PNG');
  assert(bytes.length<5*1024*1024,'Share image exceeds Kakao message image limit');
  const decoded=decodePNG(bytes);
  assert.equal(decoded.width,1200);assert.equal(decoded.height,630);
  assert.equal(Number(get('og:image:width')),decoded.width);assert.equal(Number(get('og:image:height')),decoded.height);
  for(let i=3;i<decoded.data.length;i+=4)assert.equal(decoded.data[i],255,'Cover must have an opaque background');
  return {canonical:site,title:get('og:title'),description:get('og:description'),image:image.href,relative,
    width:decoded.width,height:decoded.height,bytes:bytes.length,sha256:sha256(bytes)};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const directory=path.resolve(process.argv[2]||'.');
  const report=validateSocialShare(fs.readFileSync(path.join(directory,'index.html'),'utf8'),file=>fs.readFileSync(path.join(directory,file)));
  const published=process.env.PIXEL_LIFE_SHARE_URL;
  if(published){
    const response=await fetch(published,{headers:{'User-Agent':'Kakaotalk-scrap/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(60000)});
    assert.equal(response.status,200);assert.match(response.headers.get('content-type')||'',/text\/html/);
    const imageResponse=await fetch(report.image,{signal:AbortSignal.timeout(60000)});
    assert.equal(imageResponse.status,200);assert.match(imageResponse.headers.get('content-type')||'',/^image\/png/);
    const bytes=Buffer.from(await imageResponse.arrayBuffer());
    const remote=validateSocialShare(await response.text(),file=>{assert.equal(file,report.relative);return bytes;});
    assert.equal(remote.sha256,report.sha256,'Published cover differs from reviewed cover');
    report.published={url:published,htmlStatus:response.status,imageStatus:imageResponse.status,imageType:imageResponse.headers.get('content-type'),checkedAt:new Date().toISOString()};
  }
  console.log(JSON.stringify(report,null,2));
}
