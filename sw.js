/* Offline shell only; procedure data is stored separately in the browser. */
const CACHE='lineguide-shell-v2-6-quality';
const CORE=['./','./index.html','./app.js','./manifest.json'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('lineguide-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  const path=new URL(req.url).pathname;
  // Navigation falls back to cached HTML. Missing JS, CSS and assets never return HTML.
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put('./index.html',copy)))}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  const isCore=['index.html','app.js','manifest.json'].some(f=>path.endsWith('/'+f));
  // Prefer fresh app code when online. Cached assets remain available offline.
  event.respondWith(fetch(req).then(response=>{
    if(isCore&&response.ok){
      const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)));
    }
    return response;
  }).catch(()=>caches.match(req)));
});