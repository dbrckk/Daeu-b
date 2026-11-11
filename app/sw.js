/*
 * PWA : installation atomique, cache des ressources de version immuable.
 * Aucune requête extérieure n'est mise en cache. Les données d'étude restent
 * exclusivement dans localStorage et ne passent jamais dans le service worker.
 */
const CACHE="daeu-b-maths-v25-4";
const PREFIX="daeu-b-maths-";
const ASSETS=["./","./index.html","./style.css","./app.mjs","./engine.mjs","./questions.mjs","./variants.mjs","./exams.mjs","./exam-engine.mjs","./exam-ui.mjs","./exam-generator.mjs","./exam-alternative.mjs","./reasoning.mjs","./exam-analytics.mjs","./persistence.mjs","./round.mjs","./jalons.mjs","./jalon-progress.mjs","./prerequisites.mjs","./transfer-progress.mjs","./transferts/sujets.md","./transferts/corriges.md","./manifest.json","./icon.svg","./course.html","./problems.html","./problems-reader.mjs","./problemes/sujets.md","./problemes/corriges.md","./course-reader.mjs","./course-catalog.mjs","./reading-tools.mjs","./reading-bookmark.mjs","./course-search.mjs","./vendor/showdown-2.1.0.min.js","./vendor/dompurify.min.js","./vendor/temml.min.js","./cours/00-positionnement.md","./cours/01-calcul-numerique.md","./cours/02-calcul-litteral.md","./cours/03-equations-inequations-systemes.md","./cours/04-second-degre.md","./cours/05-fonctions.md","./cours/06-derivation.md","./cours/07-limites-asymptotes.md","./cours/08-continuite-tvi.md","./cours/09-exponentielle-logarithme.md","./cours/10-suites.md","./cours/11-statistiques.md","./cours/12-probabilites.md","./cours/13-trigonometrie.md","./cours/14-geometrie-vectorielle.md","./cours/15-primitives-integrales.md","./cours/16-complexes-complements.md","./cours/17-raisonnement-modelisation.md"];
const SCOPE=new URL(self.registration.scope);
const allowed=new Set(ASSETS.map(asset=>new URL(asset,SCOPE).pathname));
const shell=new URL("./index.html",SCOPE).pathname;
const courseShell=new URL("./course.html",SCOPE).pathname;
const problemsShell=new URL("./problems.html",SCOPE).pathname;

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
    const target=url.pathname===courseShell?"./course.html":url.pathname===problemsShell?"./problems.html":"./index.html";
    const shellResponse=await cache.match(new URL(target,SCOPE));
    if(shellResponse)return shellResponse;
    try{return await fetch(request);}
    catch{return Response.error();}
  })());
});
