/*
 * PWA : installation atomique, cache des ressources de version immuable.
 * Aucune requête extérieure n'est mise en cache. Les données d'étude restent
 * exclusivement dans localStorage et ne passent jamais dans le service worker.
 */
const CACHE="daeu-b-maths-v110";
const PREFIX="daeu-b-maths-";
const ASSETS=["./","./index.html","./style.css","./start.mjs","./app-update.mjs","./auto-backup.mjs","./math-notebook.mjs","./ink-eraser.mjs","./ink-transcript.mjs","./ink-drafts.mjs","./numeric-ink.mjs","./equation-ink.mjs","./math-step-checker.mjs","./constraint-solver.mjs","./quadratic-checker.mjs","./derivative-checker.mjs","./polynomial-derivative.mjs","./elementary-derivative.mjs","./math-preview.mjs","./workbook.mjs","./reader-start.mjs","./cloud-sync.mjs","./app.mjs","./engine.mjs","./questions.mjs","./variants.mjs","./exams.mjs","./exam-engine.mjs","./exam-ui.mjs","./math-markdown.mjs","./fiches/formulaire.md","./exam-generator.mjs","./exam-alternative.mjs","./exam-applied.mjs","./exam-recommendation.mjs","./exam-remediation.mjs","./reasoning.mjs","./exam-analytics.mjs","./exam-blueprint.mjs","./exam-readiness.mjs","./persistence.mjs","./round.mjs","./jalons.mjs","./jalon-progress.mjs","./prerequisites.mjs","./transfer-progress.mjs","./transferts/sujets.md","./transferts/corriges.md","./transferts/sujets-b.md","./transferts/corriges-b.md","./transferts/sujets-c.md","./transferts/corriges-c.md","./manifest.json","./icon.svg","./course.html","./problems.html","./problems-reader.mjs","./problemes/sujets.md","./problemes/corriges.md","./course-reader.mjs","./course-catalog.mjs","./reading-tools.mjs","./reading-bookmark.mjs","./course-search.mjs","./vendor/showdown-2.1.0.min.js","./vendor/dompurify.min.js","./vendor/temml.min.js","./cours/00-positionnement.md","./cours/01-calcul-numerique.md","./cours/02-calcul-litteral.md","./cours/03-equations-inequations-systemes.md","./cours/04-second-degre.md","./cours/05-fonctions.md","./cours/06-derivation.md","./cours/07-limites-asymptotes.md","./cours/08-continuite-tvi.md","./cours/09-exponentielle-logarithme.md","./cours/10-suites.md","./cours/11-statistiques.md","./cours/12-probabilites.md","./cours/13-trigonometrie.md","./cours/14-geometrie-vectorielle.md","./cours/15-primitives-integrales.md","./cours/16-complexes-complements.md","./cours/17-raisonnement-modelisation.md"];
// Empreintes générées par scripts/sync_pwa_integrity.py.
const INTEGRITY={
  "./": "sha256-mgZz1ZLsBPn3wZRyBIo1aXlrfybgKXfRaJgXVN0iUJA=",
  "./index.html": "sha256-mgZz1ZLsBPn3wZRyBIo1aXlrfybgKXfRaJgXVN0iUJA=",
  "./style.css": "sha256-+eNLJ/ZRb8Q4UMSs2IUd9DVjZ0BHT9uuAUlz+Rrv0Io=",
  "./start.mjs": "sha256-RId2iTu3b/TzBFFV2Tf8mHMtl2fSL9cn+hC49TIqMDY=",
  "./app-update.mjs": "sha256-jVn5a/zPpdFbfiLigraGxTlG2r2wG8csO04O0/zw6kQ=",
  "./auto-backup.mjs": "sha256-LhxzES0v2LJYdwa9dpG4d8NOGpYyI5gz5dVIO3n4t0I=",
  "./math-notebook.mjs": "sha256-E3v/on+/GHpzSvX57PD2oTrTi97mJVaD0WaXNtY0x3U=",
  "./ink-eraser.mjs": "sha256-v2o1TCVD9uPG/Bj29R0UcFdbZ1YSTogn66W8QE5qWl8=",
  "./ink-transcript.mjs": "sha256-9Uvu5JHqsfBI0ZZAypsyWWPhs1uNF9LPfgLCC1E+/F4=",
  "./ink-drafts.mjs": "sha256-dfVQrTQONTsQm7+NQmT0l9d6gSy3Fg6UGd7J/Uz9u7Q=",
  "./numeric-ink.mjs": "sha256-lxvn+/8BHu4FpqWoPFRv4dFEXlLX/wJnDKGm11Amvk8=",
  "./equation-ink.mjs": "sha256-INYhCPIvcRLMRZh4dQv1yD+b55EdNLO/fW3G5gR+BHk=",
  "./math-step-checker.mjs": "sha256-Vk9NhsH3fQhCP8Fv5jFUl7b0f4cbYHvsSTxgbjqHwCc=",
  "./constraint-solver.mjs": "sha256-UXRWXNipYdIhKI/T1IOXuIX5Wr7EgYJ7vFjyADsDv3s=",
  "./quadratic-checker.mjs": "sha256-R6aPlppeC459kufeU+va0mUu0ctlwcg3xDCNX4bNNS8=",
  "./derivative-checker.mjs": "sha256-J7UXlWuoAkkySZEZK5RsrNdwgkx9KrGsk8fiqB2N/cI=",
  "./polynomial-derivative.mjs": "sha256-0Aitir1CgRXI3R7QPkqjG4nUyEk59lO8ni26Ikg04GY=",
  "./elementary-derivative.mjs": "sha256-7xMdXs/Wg3Q2kvy3QglInwDD4hOZn6uYEOhfFM7AzSg=",
  "./math-preview.mjs": "sha256-j9vBvWsncbJX6O/bZirgD9iuSdt9RCSLRGE9mk6oJaI=",
  "./workbook.mjs": "sha256-f9uj62JlZ9mSKTKaRpiLv7pwUMBdVgbyCOGYEjnRv9M=",
  "./reader-start.mjs": "sha256-+Xd1hulbi9GJQk7CPA+YhF8k7D5sMsQQ0Y+n4wEQ7sw=",
  "./cloud-sync.mjs": "sha256-ZOCuQWZkClkO0QrJZZK4qxqttL1NFbXQNJ46IXde3SY=",
  "./app.mjs": "sha256-bq5ZgY2pGreugg6gYdPAroSg3ZbzZ9Sgb5AWwuFJN2M=",
  "./engine.mjs": "sha256-EKSDmlgLOv1rF7CgJlSKKOYLinByZfO811cJDMF57nA=",
  "./questions.mjs": "sha256-uXER7lCRBT9/8IhPRH0+0A7uqkaCLyr0N9Sky98gWTY=",
  "./variants.mjs": "sha256-bwRw2EK/4sa9ZzwCZL/I+KtqFYHk520d4PJ2Ldpfj4c=",
  "./exams.mjs": "sha256-7xx+MNgJ2S66YDvV+i3ptG/mOIzS9a7HoOAwu1gNdxo=",
  "./exam-engine.mjs": "sha256-fifawCHHz5r4U+W/1zDmND2ke6O+AgZgGi4YbA8Ok9Y=",
  "./exam-ui.mjs": "sha256-3ueGPhhYs1R0ZO8YSaAY5wD2stSbFH6IoxjQk7q397k=",
  "./math-markdown.mjs": "sha256-mSG63bwBlK6JgUJ5NvWwk8zQY8QTs1VNFZsD7nwxMpE=",
  "./fiches/formulaire.md": "sha256-9HiUJq6pjuj9ce4LxBl5hS9DIHQZgxSDg0qnZYkxw+w=",
  "./exam-generator.mjs": "sha256-ZCvvBzwge0bYYUtEd508CKC4wMM0jAsJAyVLLd8nhyQ=",
  "./exam-alternative.mjs": "sha256-eUJ64NTkVbkOHbM8rWlP6xdUCVO4EyGDiOGbMeMQhUA=",
  "./exam-applied.mjs": "sha256-Mvlo76iGmDIw0ta95LzGw9q9Cbnl2bagEFyP1L7r4hQ=",
  "./exam-recommendation.mjs": "sha256-9l2PtHKDHG94VU12dvLUytjAit/qBIbEG8puT1fUp8U=",
  "./exam-remediation.mjs": "sha256-Jv6VJthVlnHnCHaiauF5vF8jW0oBGOx7UyqQB9Zyl8g=",
  "./reasoning.mjs": "sha256-ubNvDuIKbEnn5LiEnwIrigrv0nFsdc/y/2Yn8jUfZVs=",
  "./exam-analytics.mjs": "sha256-l7jClhhbMIwgsdHJ+ok6T8Z/Gss0CQpEhno7w2k/jmk=",
  "./exam-blueprint.mjs": "sha256-7aT3ghX1WeR49b22cVYbjXDpU1aL9zPPyi0RQvaHQtg=",
  "./exam-readiness.mjs": "sha256-cXUKt+xCwVJLHGq1o403EzBIX2WXQ+qf1BKkgehOIII=",
  "./persistence.mjs": "sha256-E820l2DkqY1P+pc6KcRCj7itBX0zdoViGXyrQv3acJY=",
  "./round.mjs": "sha256-YFcHcmfJWBbTzJ1Im5W+DLxS5g+2iskqbWDE+HbPwKA=",
  "./jalons.mjs": "sha256-6DcKsOYX7JnyS4rpr/LgpJ79d+Sg26Pu+Ve5QyExLSw=",
  "./jalon-progress.mjs": "sha256-nBskUYrxlA2iJifMSRlDxERB/MOZtQFWver0KHZFnfw=",
  "./prerequisites.mjs": "sha256-WTKvs0GFDnrZY9P/ZXO2jCgTTIDmz6/T4qB3G4XjxDs=",
  "./transfer-progress.mjs": "sha256-x+g+egMx3p/cnb2CPD76xyzd7mzYLOUD8skRTPLsedY=",
  "./transferts/sujets.md": "sha256-dOFiezViSbWtPL2UUSiM7D9Dfix+9l69ZbVEsQOlcDM=",
  "./transferts/corriges.md": "sha256-MLEZcmlc5axfOoYLzQt9q55yTnMYDPICoJnWSF/Fon4=",
  "./transferts/sujets-b.md": "sha256-ehxqtgmx7DWeNFCN6cYc0QWRnhI2mlVfcpxUeTn1WmE=",
  "./transferts/corriges-b.md": "sha256-LEbcFsoSJbCX7GtlHSahKMX30vpGmfYM/qGLqOZ1NbI=",
  "./transferts/sujets-c.md": "sha256-VkBX+WnrlOeYpCvB9iteDE5HTN7KS7Xsecnz6p+Wqg0=",
  "./transferts/corriges-c.md": "sha256-Hn/flk0xlq5YZHLiv/gLMP1H6AnUS70otxgZHXekxbI=",
  "./manifest.json": "sha256-00Z1QEW31Y32cv7JByCGGdwpUYv5G9g5rr8VPsJP/YM=",
  "./icon.svg": "sha256-q27cXuIYoZ/KI8gqAtfGFIAKaBktDvBEXgaPm2Pth9A=",
  "./course.html": "sha256-auQqlYROLPPvKYPdsIsGsAYJuvgColY9gjgHlj0FZCQ=",
  "./problems.html": "sha256-CKFUUTKVcN6CoVmEnOAVzUAbHMzMlOLWYy2zpm4F0Nc=",
  "./problems-reader.mjs": "sha256-3pUPnQPEugz9u6G0d9qRjPS4/iMdJu9zSTBH2n4mzkg=",
  "./problemes/sujets.md": "sha256-mEg8MKGER6ckIYNf3/dBFyVUcQ2ofuK4u36zos/CoFE=",
  "./problemes/corriges.md": "sha256-y9EwWpj5YxphNDQdqybU2oKV689g6TAmm+l2tX7yMME=",
  "./course-reader.mjs": "sha256-taPEoXvaNAy28fAj+iJxvJZnN0ptLZQLg8Ax4WoY1CU=",
  "./course-catalog.mjs": "sha256-eD5pyRxSiTrD+O18FTBuLFEWoiwSgwJf6jwomb7iNkg=",
  "./reading-tools.mjs": "sha256-Lc8TbR0xtinYsdmzj3bJYUfzNzT5bTrEeb3DTmQbJEo=",
  "./reading-bookmark.mjs": "sha256-zU0+Mj02Cj4h+zq/FGfYH/QZqBzDEKbU/Yv+HLssYZA=",
  "./course-search.mjs": "sha256-n/QPTnjsIk6LPeVEGDY0opAwoByoiw7hJ8CrJUxZu24=",
  "./vendor/showdown-2.1.0.min.js": "sha256-iOtvu+DCcN3zOEruDJYg0HDgkKJuB8Z0Ia42yQO11kk=",
  "./vendor/dompurify.min.js": "sha256-27zWZKYWkF0bqyjV7T5WPeBsHCAl1obrslGmENgoKvU=",
  "./vendor/temml.min.js": "sha256-VrQzgXbTkXBpJQO4t+xjDT7fjhCGGJVljet0rvtmr50=",
  "./cours/00-positionnement.md": "sha256-NrUVjtT6of/v+LN6ePHrFHNTi/MhP6cUuRSCcIx8j+M=",
  "./cours/01-calcul-numerique.md": "sha256-eEBHHxoYNHfltsQ5fjEbSVwkkqBOX98pK4y82YZx+i0=",
  "./cours/02-calcul-litteral.md": "sha256-IpAEhnoQi7KhY6fSyfY8NDCpTd/IYY3L3k30rUloYQ8=",
  "./cours/03-equations-inequations-systemes.md": "sha256-vG5BIaJuZjpQfzp1zDDx6U+Xd9CEd/TsFnJqhp5c9gQ=",
  "./cours/04-second-degre.md": "sha256-eMTXBbPosS9PGN81xdDEEr8OiAdCGil5DEvTrVAzPSM=",
  "./cours/05-fonctions.md": "sha256-Wp70dpucubJUNXM0J4bV3EwRdgVFyML2bHdnl87YZbo=",
  "./cours/06-derivation.md": "sha256-Cjp5QfjWCngn57omrtN5uVecf5TLsGNRlKwYEEeJAS4=",
  "./cours/07-limites-asymptotes.md": "sha256-vbOnDC89f8chA3aIpwN2uaYo6OsadKmGwfQz2eXYh0c=",
  "./cours/08-continuite-tvi.md": "sha256-/61ppc0znqtwZ28tlk/rj2x38qy71ytKYEj8tmU2Ogg=",
  "./cours/09-exponentielle-logarithme.md": "sha256-Jz86D54OKIPKXSDQZVXPl9ZZXxEYbdoMa4Sk538Afpc=",
  "./cours/10-suites.md": "sha256-g/of+G2DKfxNVimE8RMaJuB/1Z5m5WSVN0YfP9YAmMU=",
  "./cours/11-statistiques.md": "sha256-+E5jtAMeOikkrKPQgX7QbhOdrRb/hpn7ytO7rkAKtGY=",
  "./cours/12-probabilites.md": "sha256-cXqMQbBeU0kzQ66yQ3ErQBrW8RXSvEu0OXZut4sue98=",
  "./cours/13-trigonometrie.md": "sha256-7Yy5q672g5XSkpgKvrKmBD/CX7bqV2i+IOAaJHYxYes=",
  "./cours/14-geometrie-vectorielle.md": "sha256-rM3V7+rZSDWoJOdt4xNgNopJOW4ki14oGf/6qenk5ME=",
  "./cours/15-primitives-integrales.md": "sha256-LAmemqs39JmpRh4/jdLdTuVGu2bPS8UBd4+JZlzqHLc=",
  "./cours/16-complexes-complements.md": "sha256-Rfw37Hv5zIMCaWBNrYSmRzyMqKdAs+NchzNy9+HiFLo=",
  "./cours/17-raisonnement-modelisation.md": "sha256-uHXVwtqIaH0hT5p3k+VDKPCrQ63xu+H7GupXtm3c4K4="
};
const SCOPE=new URL(self.registration.scope);
const allowed=new Set(ASSETS.map(asset=>new URL(asset,SCOPE).pathname));
const shell=new URL("./index.html",SCOPE).pathname;
const courseShell=new URL("./course.html",SCOPE).pathname;
const problemsShell=new URL("./problems.html",SCOPE).pathname;

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    // Un CDN peut renvoyer un fichier périmé avec un statut 200.
    // Fetch vérifie l’intégrité de chaque réponse avant l’installation du cache.
    const cache=await caches.open(CACHE);
    try {
      await cache.addAll(ASSETS.map(asset=>new Request(new URL(asset,SCOPE),{cache:"reload",integrity:INTEGRITY[asset]})));
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
