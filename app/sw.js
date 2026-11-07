/*
 * PWA : installation atomique, cache des ressources de version immuable.
 * Aucune requête extérieure n'est mise en cache. Les données d'étude restent
 * exclusivement dans localStorage et ne passent jamais dans le service worker.
 */
const CACHE="daeu-b-maths-v10";
const PREFIX="daeu-b-maths-";
const ASSETS=["./","./index.html","./style.css","./app.mjs","./engine.mjs","./questions.mjs","./variants.mjs","./exams.mjs","./exam-engine.mjs","./exam-ui.mjs","./exam-generator.mjs","./reasoning.mjs","./exam-analytics.mjs","./persistence.mjs","./manifest.webmanifest","./icon.svg"];
const SCOPE=new URL(self.registration.scope);
const allowed=new Set(ASSETS.map(asset=>new URL(asset,SCOPE).pathname));
const shell=new URL("./index.html",SCOPE).pathname;

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    // addAll échoue intégralement si un asset est absent : on n'active pas
    // une nouvelle version incomplète ou un mélange de modules incompatibles.
    const cache=await caches.open(CACHE);
    try {
      await cache.addAll(ASSETS.map(asset=>new Request(new URL(asset,SCOPE),{cache:"reload"})));
    } catch(error) {
      await caches.delete(CACHE);
      throw error;
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return;
  if(!allowed.has(url.pathname)&&request.mode!=="navigate")return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    // Toutes les ressources JS/CSS proviennent d'une seule version
    // précachée : éviter les imports mixtes lors d'un déploiement.
    if(request.mode!=="navigate"){
      const cached=await cache.match(request,{ignoreSearch:true});
      if(cached)return cached;
      return fetch(request);
    }
    // Navigation : prioriser le shell précaché pour le hors-ligne ;
    // une nouvelle version sera récupérée par la mise à jour du SW.
    const shellResponse=await cache.match(new URL("./index.html",SCOPE));
    if(shellResponse)return shellResponse;
    try{return await fetch(request);}
    catch{return Response.error();}
  })());
});
