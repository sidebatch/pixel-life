import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';

const base=process.env.PIXEL_LIFE_QA_URL||'http://127.0.0.1:4173/';
const candidates=[
  process.env.PIXEL_LIFE_CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].filter(Boolean);
const browserPath=candidates.find(candidate=>fs.existsSync(candidate));
if(!browserPath)throw new Error('Chrome or Edge was not found');

const debugPort=await new Promise((resolve,reject)=>{
  const server=net.createServer();
  server.once('error',reject);
  server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});
});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'pixel-life-pwa-'));
const browser=spawn(browserPath,[
  '--headless=new',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,
  '--no-first-run','--no-default-browser-check','--disable-background-networking',base
],{stdio:'ignore',windowsHide:true});

const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function retry(task,label){
  let last;
  for(let attempt=0;attempt<80;attempt++){
    try{return await task();}catch(error){last=error;await pause(100);}
  }
  throw new Error(`${label}: ${last?.message||last}`);
}

let socket;
try{
  const pages=await retry(async()=>{
    const response=await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    if(!response.ok)throw new Error(String(response.status));
    const list=await response.json();
    if(!list.some(item=>item.type==='page'))throw new Error('No page target');
    return list;
  },'Browser did not start');
  const page=pages.find(item=>item.type==='page'&&item.url.startsWith(base))||pages.find(item=>item.type==='page');
  socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});

  let sequence=0;
  const pending=new Map();
  const events=new Map();
  socket.addEventListener('message',message=>{
    const data=JSON.parse(message.data);
    if(data.id){
      const request=pending.get(data.id);if(!request)return;
      pending.delete(data.id);
      if(data.error)request.reject(new Error(data.error.message));else request.resolve(data.result);
      return;
    }
    const waiters=events.get(data.method)||[];
    events.delete(data.method);
    for(const resolve of waiters)resolve(data.params);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
  });
  const waitEvent=(method,timeout=15000)=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(`Timed out waiting for ${method}`)),timeout);
    const list=events.get(method)||[];
    list.push(value=>{clearTimeout(timer);resolve(value);});events.set(method,list);
  });
  const evaluate=async expression=>{
    const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'Page evaluation failed');
    return result.result.value;
  };

  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await retry(async()=>{
    const state=await evaluate('document.readyState');
    if(state!=='complete')throw new Error(state);
    return state;
  },'Game page did not load');
  const pageContext=await retry(async()=>{
    const context=await evaluate(`({href:location.href,title:document.title,secure:isSecureContext,
      serviceWorkerSupported:'serviceWorker' in navigator,body:(document.body?.innerText||'').slice(0,120)})`);
    if(!context.serviceWorkerSupported)throw new Error(JSON.stringify(context));
    return context;
  },'Service workers are not available on the loaded page');

  const online=await evaluate(`(async()=>{
    const registration=await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    const names=await caches.keys();
    const entries=[];
    for(const name of names)for(const request of await (await caches.open(name)).keys())entries.push(new URL(request.url).pathname);
    return {controlled:Boolean(navigator.serviceWorker.controller),scope:registration.scope,names,entries,title:document.title,
      installButtonHidden:document.getElementById('installAppBtn')?.hidden};
  })()`);
  const manifest=await send('Page.getAppManifest');
  let installability=[];
  try{installability=(await send('Page.getInstallabilityErrors')).installabilityErrors||[];}catch(_){/* Older Chromium */}
  if(!online.controlled||!online.names.some(name=>name.startsWith('pixel-life-'))||online.entries.length<7)
    throw new Error(`Incomplete PWA cache: ${JSON.stringify(online)}`);
  if((manifest.errors||[]).length)throw new Error(`Manifest errors: ${JSON.stringify(manifest.errors)}`);

  await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  const loaded=waitEvent('Page.loadEventFired');
  await send('Page.reload');
  await loaded;
  const offline=await evaluate(`(async()=>{
    try{
      const audio=await fetch('./assets/audio/music/meadow.mp3',{headers:{Range:'bytes=0-99'}});
      return {title:document.title,controlled:Boolean(navigator.serviceWorker?.controller),audioStatus:audio.status,audioBytes:(await audio.arrayBuffer()).byteLength};
    }catch(error){return {title:document.title,controlled:Boolean(navigator.serviceWorker?.controller),audioError:String(error)}}
  })()`);
  if(offline.title!=='Pixel Life'||!offline.controlled||offline.audioStatus!==206||offline.audioBytes!==100)
    throw new Error(`Offline reload failed: ${JSON.stringify(offline)}`);

  console.log(JSON.stringify({browser:path.basename(browserPath),pageContext,online,manifestUrl:manifest.url,
    installabilityErrors:installability,offline},null,2));
}finally{
  try{socket?.close();}catch(_){}
  browser.kill();
  if(process.platform==='win32'&&browser.pid)spawnSync('taskkill',['/pid',String(browser.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});
  await pause(350);
  fs.rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:200});
}
