import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const bytes=Uint8Array.from({length:1024},(_,i)=>i%256),events={},matched=[],opened=[];let online=true,status=206;
const context=vm.createContext({URL,Request,Response,Error,Number,Promise,
 self:{location:{origin:'https://game.test'},addEventListener:(name,fn)=>events[name]=fn},
 caches:{open:async name=>{opened.push(name);return {match:async url=>{matched.push(url);assert(!new URL(url).search);return new Response(bytes,{headers:{'Content-Type':'audio/mpeg'}});}};}},
 fetch:async request=>{if(!online)throw Error('Offline');return new Response(Uint8Array.of(10,20,30),{status,headers:{'Content-Range':'bytes 10-12/1024','Content-Type':'audio/mpeg'}});}});
vm.runInContext(fs.readFileSync('service-worker.js','utf8'),context);
const request=async(range,query='')=>{
 let promise;events.fetch({request:new Request('https://game.test/pixel-life/assets/audio/music/meadow.mp3'+query,{headers:range?{Range:range}:{}}),respondWith:p=>promise=p});
 const response=await promise;return {status:response.status,range:response.headers.get('Content-Range'),bytes:new Uint8Array(await response.arrayBuffer())};
};
let result=await request('bytes=10-12');assert.equal(result.status,206);assert.deepEqual([...result.bytes],[10,20,30]);assert.equal(matched.length,0,'Live streaming must retain the native range response');
online=false;result=await request('bytes=100-199','?recovery=17');assert.equal(result.status,206);assert.equal(result.range,'bytes 100-199/1024');assert.deepEqual([...result.bytes],[...bytes.slice(100,200)]);
result=await request('bytes=-100','?recovery=18');assert.equal(result.bytes.length,100);assert.equal(result.range,'bytes 924-1023/1024');
result=await request('bytes=1024-');assert.equal(result.status,416);
result=await request(null,'?recovery=19');assert.equal(result.status,200);assert.equal(result.bytes.length,1024);
online=true;status=503;result=await request('bytes=0-99');assert.equal(result.status,206);assert.equal(result.bytes.length,100);
assert(opened.every(name=>name==='pixel-life-__PIXEL_LIFE_BUILD_ID__'),'Only the current complete music cache may supply offline bytes');
console.log('Music cache passed: native online streaming, scoped full-cache fallback, retry-query normalization, exact offline/suffix/invalid ranges, whole file and transient HTTP failure.');
