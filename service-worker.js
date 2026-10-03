const CACHE_NAME='pixel-life-__PIXEL_LIFE_BUILD_ID__';
const APP_SHELL=[
  './index.html',
  './manifest.webmanifest',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  './assets/audio/music/meadow.mp3',
  './assets/audio/music/woodland.mp3',
  './assets/audio/music/lakeside.mp3'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('pixel-life-')&&key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function cachedRangeResponse(request,cached){
  const match=/bytes=(\d*)-(\d*)/.exec(request.headers.get('range')||'');
  if(!match)return cached;
  const bytes=await cached.arrayBuffer();
  const size=bytes.byteLength;
  let start=match[1]?Number(match[1]):0;
  let end=match[2]?Number(match[2]):size-1;
  if(!match[1]&&match[2]){
    start=Math.max(0,size-Number(match[2]));
    end=size-1;
  }
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||start>=size||start>end){
    return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  }
  end=Math.min(end,size-1);
  return new Response(bytes.slice(start,end+1),{
    status:206,
    statusText:'Partial Content',
    headers:{
      'Accept-Ranges':'bytes',
      'Content-Length':String(end-start+1),
      'Content-Range':`bytes ${start}-${end}/${size}`,
      'Content-Type':cached.headers.get('Content-Type')||'audio/mpeg'
    }
  });
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.headers.has('range')){
    event.respondWith(
      caches.match(url.href)
        .then(cached=>cached?cachedRangeResponse(request,cached):fetch(request))
        .catch(()=>fetch(request))
    );
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',response.clone()));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response=>{
        if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));
        return response;
      })
      .catch(()=>caches.match(request))
  );
});
