import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {chromium} from "playwright";

const BASE=process.env.TEST_BASE_URL||"http://127.0.0.1:8000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const temp=await mkdtemp(join(tmpdir(),"daeu-smoke-"));
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true,locale:"fr-FR"});
const page=await context.newPage(),errors=[];
page.setDefaultTimeout(15000);
page.setDefaultNavigationTimeout(15000);
const watchdog=setTimeout(()=>{console.error("ÉCHEC : délai global du test navigateur dépassé");process.exit(2);},120000);
page.on("pageerror",e=>errors.push("JS : "+e.message));
page.on("response",r=>{if(r.url().startsWith(BASE)&&r.status()>=400)errors.push(r.status()+" "+r.url());});
page.on("dialog",dialog=>dialog.accept());
const check=async (fn,label)=>{
  assert.ok(await fn(),label);
  console.log("OK "+label);
};

try {
  await page.goto(BASE,{waitUntil:"networkidle",timeout:30000});
  await check(async()=>await page.locator("#totalQuestions").textContent().then(t=>t.trim()==="143"),"143 questions chargées");
  await check(async()=>await page.locator("#topicCards .topic-card").count()===13,"13 domaines chargés");
  await check(async()=>await page.locator("#examSelect option").count()===4,"Examens A/B/C/D disponibles");
  await check(async()=>await page.locator("#courseLibrary a").count()===18,
    "Bibliothèque complète de 18 cours locaux");
  await check(async()=>await page.locator("#topicCards .topic-card a").first().getAttribute("href").then(h=>h.startsWith("./course.html?course=")),
    "Cours du catalogue reliés au lecteur local");
  const courseOnline=await context.newPage();
  courseOnline.on("pageerror",e=>errors.push("Lecteur cours : "+e.message));
  await courseOnline.goto(BASE+"/course.html?course=07-limites-asymptotes",{waitUntil:"networkidle"});
  await check(async()=>await courseOnline.locator("#courseBody h2").count()>=5,
    "Cours complet HTML converti et structuré");
  await check(async()=>await courseOnline.locator("#courseBody math").count()>=3,
    "Formules mathématiques rendues en MathML sans CDN");
  await check(async()=>await courseOnline.locator("#courseSelector option").count()===18,
    "Navigation entre les 18 cours");
  await check(async()=>await courseOnline.locator("#courseStatus").textContent().then(s=>s.includes("Cours 8/18")),
    "Chapitre choisi depuis le paramètre d'URL");
  await check(async()=>await courseOnline.locator("#courseToc a").count()===await courseOnline.locator("#courseBody h2, #courseBody h3").count(),
    "Sommaire du cours : chaque section et sous-section dispose d'un lien");
  await courseOnline.locator("#courseOutline summary").click();
  await courseOnline.locator("#courseToc a").first().click();
  await check(async()=>await courseOnline.evaluate(()=>
    !!location.hash&&document.activeElement?.matches("#courseBody h2, #courseBody h3")),
    "Sommaire : saut et focus au clavier vers le titre de section");
  // Signet explicite, restauration après rechargement et isolation par cours.
  await courseOnline.locator("#courseBody h2").nth(2).scrollIntoViewIfNeeded();
  await courseOnline.locator("#courseBookmarkSave").click();
  await check(async()=>await courseOnline.locator("#courseBookmarkResume").isVisible(),
    "Signet de cours enregistré et bouton de reprise disponible");
  const savedSection=await courseOnline.evaluate(()=>
    localStorage.getItem("daeu-b-reader-bookmark-v1:cours:07-limites-asymptotes"));
  assert.ok(savedSection?.startsWith("lecture-section-"),"Signet de cours manquant");
  await courseOnline.reload({waitUntil:"networkidle"});
  await check(async()=>await courseOnline.locator("#courseBookmarkResume").isVisible(),
    "Signet de cours conservé après rechargement");
  await courseOnline.locator("#courseBookmarkResume").click();
  await check(async()=>await courseOnline.evaluate(id=>document.activeElement?.id===id,savedSection),
    "Reprise de lecture au titre enregistré avec focus clavier");
  await courseOnline.locator("#courseTextSize").selectOption("extra");
  await check(async()=>await courseOnline.evaluate(()=>
    document.querySelector("#courseBody").dataset.readingSize==="extra"
    &&Number.parseFloat(getComputedStyle(document.querySelector("#courseBody")).fontSize)>=20),
    "Taille de lecture très grande activée et appliquée");
  await courseOnline.setViewportSize({width:320,height:800});
  await check(async()=>await courseOnline.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),
    "Lecture agrandie sans défilement horizontal à 320 px");
  await courseOnline.setViewportSize({width:390,height:844});
  await check(async()=>await courseOnline.locator("#coursePractice").getAttribute("href").then(h=>h==="./?topic=limites#practice-title"),
    "Cours de limites relié directement au bon chapitre d'entraînement");
  await courseOnline.locator("#coursePractice").click();
  // Le document HTML peut être visible avant l'initialisation du module ES.
  // Attendre que les options aient été chargées ET le paramètre appliqué.
  await courseOnline.waitForFunction(()=>document.querySelector("#topic")?.value==="limites"
    &&document.querySelectorAll("#topic option").length===14,null,{timeout:10000});
  await check(async()=>await courseOnline.locator("#topic").inputValue().then(v=>v==="limites"),
    "Retour au quiz avec le chapitre limites présélectionné");
  await check(async()=>await courseOnline.locator("#quiz").isVisible().then(v=>!v),
    "Navigation depuis le cours sans démarrage intempestif d'une séance");
  await courseOnline.goto(BASE+"/course.html?course=13-trigonometrie",{waitUntil:"networkidle"});
  await check(async()=>await courseOnline.locator("#coursePractice").getAttribute("href").then(h=>h==="./#practice-title"),
    "Complément facultatif : accès honnête à l'entraînement général");
  await courseOnline.close();
  const problemsPage=await context.newPage();
  problemsPage.on("pageerror",e=>errors.push("Problèmes : "+e.message));
  await problemsPage.goto(BASE+"/problems.html",{waitUntil:"networkidle"});
  await check(async()=>await problemsPage.locator("#problemBookmarkResume").isHidden(),
    "Signet des problèmes distinct de celui du cours");
  await check(async()=>await problemsPage.locator("#problemTextSize").inputValue().then(v=>v==="extra")
    &&await problemsPage.locator("#problemBody").getAttribute("data-reading-size").then(v=>v==="extra"),
    "Taille de lecture conservée entre un cours et les problèmes");
  await check(async()=>await problemsPage.locator("#problemToc a").count()>=11,
    "Sommaire des problèmes : les niveaux et les huit exercices sont navigables");
  await problemsPage.locator("#problemOutline summary").click();
  await problemsPage.locator("#problemToc a").last().click();
  await check(async()=>await problemsPage.evaluate(()=>document.activeElement?.matches("#problemBody h2, #problemBody h3")),
    "Sommaire des problèmes : navigation clavier vers un exercice");
  await problemsPage.locator("#problemTextSize").selectOption("normal");
  await check(async()=>await problemsPage.locator("#problemBody").getAttribute("data-reading-size").then(v=>v==="normal"),
    "Réglage de lecture normal rétabli");
  await check(async()=>await problemsPage.locator("#problemBody h3").count()===8,
    "Huit problèmes locaux affichés sans correction");
  await check(async()=>await problemsPage.locator("#problemBody math").count()>=5,
    "Formules des problèmes converties en MathML");
  await problemsPage.locator("#problemBody h3").first().scrollIntoViewIfNeeded();
  await problemsPage.locator("#problemBookmarkSave").click();
  await check(async()=>await problemsPage.locator("#problemBookmarkResume").isVisible(),
    "Signet des sujets de problèmes enregistré");
  await problemsPage.locator("#problemSwitch").click();
  await problemsPage.waitForFunction(()=>document.querySelectorAll("#problemBody h2").length>=8,null,{timeout:10000});
  await check(async()=>await problemsPage.locator("#problemBody h2").count()>=8,
    "Corrigés locaux accessibles par action explicite");
  await check(async()=>await problemsPage.locator("#problemBookmarkResume").isHidden(),
    "Signet des sujets non divulgué aux corrigés");
  await problemsPage.close();
  await check(async()=>await page.locator('link[rel="canonical"]').getAttribute("href")==="https://daeu-b-maths-dbrckk.onrender.com/","URL canonique permanente");
  await check(async()=>await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content").then(c=>c.includes("script-src 'self'")&&c.includes("object-src 'none'")),"CSP restrictive activée");
  await check(async()=>await page.evaluate(async()=>{const manifest=await(await fetch("./manifest.json")).json();return manifest.icons?.length>0&&manifest.icons[0].src==="./icon.svg";}),"Icône PWA déclarée dans le manifeste");
  await check(async()=>await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),"Aucun débordement horizontal mobile");
  // Largeurs Android compact, standard, tablette et ordinateur : aucune
  // coupe horizontale des champs, onglets ou commandes de l'application.
  for(const width of [320,360,768,1024]){
    await page.setViewportSize({width,height:844});
    await check(async()=>await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),
      "Mise en page sans débordement à "+width+" px");
  }
  await page.setViewportSize({width:390,height:844});

  // Sujet D : valider un parcours complet, isolé de la copie principale.
  const dContext=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"
  });
  const dPage=await dContext.newPage();
  dPage.on("dialog",dialog=>dialog.accept());
  await dPage.goto(BASE,{waitUntil:"networkidle"});
  await dPage.locator("#examSelect").selectOption("blanc-d");
  await dPage.locator("#examStart").click();
  await check(async()=>await dPage.locator("#examActive").isVisible(),"Nouvel examen D démarré");
  const dRational=await dPage.locator("#examContext").textContent();
  const excluded=dRational.match(/f\(x\)=x\+\d+\+\d+\/\(x−(\d+)\)/)?.[1];
  assert.ok(excluded,"D : domaine rationnel absent");
  await check(async()=>await dPage.locator("#examQuestions fieldset").count()===4,
    "D : quatre sous-questions en première section");
  await dPage.locator("#examQuestions .exam-input").first().fill(excluded);
  await dPage.reload({waitUntil:"networkidle"});
  await check(async()=>await dPage.locator("#examContext").textContent().then(x=>x===dRational),
    "D : même énoncé après rechargement");
  await check(async()=>await dPage.locator("#examQuestions .exam-input").first().inputValue().then(x=>x===excluded),
    "D : réponse numérique conservée après rechargement");
  await dPage.locator("#examSubmit").click();
  await check(async()=>await dPage.locator("#examScore").textContent().then(x=>x.trim()==="1 / 20"),
    "D : barème calculé selon sa propre graine");
  await check(async()=>await dPage.locator("#examReview details.exam-review-group").count()===4,
    "D : quatre corrections accessibles");
  await check(async()=>await dPage.locator("#examReview .exam-reasoning-step").count()===16,
    "D : seize étapes de raisonnement disponibles");
  await check(async()=>await dPage.evaluate(()=>{
    const exams=JSON.parse(localStorage.getItem("daeu-b-data-v1"))?.exams;
    return exams?.history?.length===1&&exams.history[0].examId==="blanc-d"
      &&Number.isInteger(exams.history[0].seed);
  }),"D : copie et graine sauvegardées");
  await dContext.close();

  // Séance rétablie après fermeture de l'onglet et reprise du contexte.
  const roundContext=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"
  });
  const roundPage=await roundContext.newPage();
  await roundPage.goto(BASE,{waitUntil:"networkidle"});
  await roundPage.locator("#topic").selectOption("nombres");
  await roundPage.locator("#start").click();
  const firstPrompt=await roundPage.locator("#questionText").textContent();
  await roundPage.reload({waitUntil:"networkidle"});
  await check(async()=>await roundPage.locator("#questionText").textContent().then(t=>t===firstPrompt),
    "Révision : même question et mêmes valeurs après rechargement");
  await roundPage.locator("#unknownButton").click();
  await check(async()=>await roundPage.locator("#feedback").isVisible(),"Réponse évaluée avant rechargement");
  await roundPage.reload({waitUntil:"networkidle"});
  await check(async()=>await roundPage.locator("#quizCount").textContent().then(t=>t.includes("Question 2 /")),
    "Révision : reprise à la question suivante sans double notation");
  await check(async()=>await roundPage.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem("daeu-b-data-v1"));
    return s.round?.completed===1&&s.round?.score===0
      &&Object.values(s.practice.items).reduce((sum,x)=>sum+x.attempts,0)===1;
  }),"Réponse et avancement conservés dans une seule transaction");
  await roundContext.close();

  await page.locator("#start").click();
  await check(async()=>await page.locator("#quiz").isVisible(),"Quiz démarré");
  await page.locator("#unknownButton").click();
  await check(async()=>await page.locator("#feedback").isVisible(),"Correction après réponse");
  await page.locator("#next").click();
  await check(async()=>await page.locator("#quizCount").textContent().then(t=>t.includes("2 / 10")),"Passage à la seconde question");
  assert.equal(Number((await page.locator("#attempted").textContent()).trim()),1);

  await page.locator("#examSelect").selectOption("blanc-c");
  await page.locator("#examStart").click();
  await check(async()=>await page.locator("#examActive").isVisible(),"Examen C lancé");
  const contextText=await page.locator("#examContext").textContent();
  assert.ok(contextText.includes("B(x)="),"Énoncé complet");
  await check(async()=>await page.locator("#examQuestions fieldset").count()===4,"4 questions au premier exercice");
  await page.locator("#examQuestions .exam-input").first().fill("8");
  await page.locator("#examNext").click();
  await page.locator("#examNotes").fill("Raisonnement géométrique rédigé dans la copie.");
  await page.locator("#examPrev").click();
  await check(async()=>await page.locator("#examQuestions .exam-input").first().inputValue().then(x=>x==="8"),"Réponse conservée à la navigation");
  await page.reload({waitUntil:"networkidle"});
  await check(async()=>await page.locator("#examActive").isVisible(),"Copie récupérée au rechargement");
  await check(async()=>await page.locator("#examContext").textContent().then(x=>x===contextText),"Sujet inchangé au rechargement");
  await check(async()=>await page.locator("#examQuestions .exam-input").first().inputValue().then(x=>x==="8"),"Réponse conservée au rechargement");
  await page.locator("#examNext").click();
  await check(async()=>await page.locator("#examNotes").inputValue().then(x=>x.includes("géométrique")),"Rédaction récupérée");

  await page.locator("#examSubmit").click();
  await check(async()=>await page.locator("#examResult").isVisible(),"Note et corrigé révélés");
  await check(async()=>await page.locator("#examScore").textContent().then(x=>/^\d+ \/ 20$/.test(x.trim())),"Barème sur 20");
  await check(async()=>await page.locator("#examReview details.exam-review-group").count()===4,"4 corrigés présents");
  await page.locator("#examReview details.exam-review-group").first().locator("summary").first().click();
  await page.locator("#examReview details.exam-review-group").first().locator(".exam-reasoning-guide > summary").click();
  await check(async()=>await page.locator("#examReview .exam-reasoning-step").count()===16,"16 critères de rédaction présents");
  await page.locator("#examReview .exam-reasoning-step input[type=checkbox]").first().check();
  await check(async()=>await page.locator("#examReasoningStatus").textContent().then(x=>x.includes("1/16")),"Auto-évaluation indépendante de la note");
  await page.reload({waitUntil:"networkidle"});
  await check(async()=>await page.locator("#examHistory .exam-history-row").count()===1,"Historique rechargé");
  await page.locator("#examHistory button").first().click();
  await check(async()=>await page.locator("#examReasoningStatus").textContent().then(x=>x.includes("1/16")),"Grille sauvegardée");

  const promise=page.waitForEvent("download");
  await page.locator("#export").click();
  const download=await promise;
  assert.match(download.suggestedFilename(),/daeu-b-progression-\d{4}-\d{2}-\d{2}\.json/);
  const filename=join(temp,"backup.json");await download.saveAs(filename);
  const backup=JSON.parse(await readFile(filename,"utf8"));
  assert.equal(backup.exams.history[0].examId,"blanc-c");
  assert.equal(backup.round?.completed,1,"Export JSON : rang de la séance conservé");
  assert.equal(backup.round?.ids.length,10,"Export JSON : dix questions et leurs graines conservées");
  await page.locator("#reset").click();
  await check(async()=>await page.locator("#attempted").textContent().then(t=>t.trim()==="0"),"Remise à zéro du suivi");
  await check(async()=>await page.locator("#examHistory .exam-history-row").count()===0,"Remise à zéro des copies");
  await page.locator("#importFile").setInputFiles(filename);
  try {
    await page.waitForFunction(()=>Number(document.querySelector("#attempted")?.textContent.trim())>=1,null,{timeout:8000});
    await page.waitForFunction(()=>document.querySelectorAll("#examHistory .exam-history-row").length===1,null,{timeout:8000});
    await check(async()=>await page.locator("#quizCount").textContent().then(t=>t.includes("Question 2 / 10")),
      "Import JSON : séance interrompue récupérée à la deuxième question");
  } catch(error) {
    console.error("État import JSON : ",await page.locator("#notification").textContent());
    console.error("État copies : ",await page.locator("#examNotice").textContent());
    throw error;
  }
  await check(async()=>await page.locator("#attempted").textContent().then(t=>Number(t.trim())>=1),"Import de la progression");
  await check(async()=>await page.locator("#examHistory .exam-history-row").count()===1,"Import des copies");
  await check(async()=>await page.evaluate(()=>{
    const bundle=JSON.parse(localStorage.getItem("daeu-b-data-v1"));
    return bundle.version===1&&bundle.practice.version===2&&bundle.exams.version===1&&bundle.exams.history.length===1
      &&localStorage.getItem("daeu-b-exams-v1")===null
      &&localStorage.getItem("daeu-b-maths-progress-v2")===null;
  }),"Sauvegarde transactionnelle unique et anciennes clés migrées");

  // Une modification dans un autre onglet doit neutraliser les saisies de
  // l'onglet obsolète, au lieu d'écraser silencieusement la nouvelle copie.
  const other=await context.newPage();
  await other.goto(BASE,{waitUntil:"networkidle"});
  await other.locator("#start").click();
  await other.locator("#unknownButton").click();
  await check(async()=>await page.locator("#syncWarning").isVisible(),"Conflit multi-onglets signalé");
  await check(async()=>await page.evaluate(()=>document.getElementById("main").inert===true),
    "Écran obsolète rendu non modifiable");
  await check(async()=>await page.locator("#syncReload").isVisible(),"Action de synchronisation accessible");
  await page.locator("#syncReload").click();
  await page.waitForLoadState("networkidle");
  await check(async()=>!(await page.locator("#syncWarning").isVisible()),"Synchronisation après recharge");
  await check(async()=>await page.evaluate(()=>document.getElementById("main").inert===false),
    "Saisie réactivée après recharge");
  await other.close();

  // Simuler un quota plein : la saisie ne doit pas apparaître sauvegardée
  // alors que localStorage a refusé l'écriture.
  // Contexte isolé : la simulation ne doit pas créer une copie active
  // dans le stockage du scénario principal, testé ensuite hors ligne.
  const quotaContext=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"
  });
  const quotaPage=await quotaContext.newPage();
  await quotaPage.goto(BASE,{waitUntil:"networkidle"});
  await quotaPage.locator("#examSelect").selectOption("blanc-c");
  await quotaPage.locator("#examStart").click();
  const beforeQuota=await quotaPage.locator("#examQuestions .exam-input").first().inputValue();
  await quotaPage.evaluate(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==="daeu-b-data-v1")throw new DOMException("Quota exceeded","QuotaExceededError");
      return original.call(this,key,value);
    };
  });
  await quotaPage.locator("#examQuestions .exam-input").first().fill("777");
  await check(async()=>await quotaPage.locator("#examQuestions .exam-input").first().inputValue().then(v=>v===beforeQuota),
    "Réponse d'examen restaurée après échec de sauvegarde");
  await check(async()=>await quotaPage.locator("#examNotice").textContent().then(v=>v.includes("Impossible d'enregistrer")),
    "Échec du stockage signalé clairement");
  await quotaContext.close();
  await check(async()=>await page.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")).exams.active===null),
    "Simulation quota isolée : aucune copie active créée dans le scénario principal");

  await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error("Service Worker non activé après 10s")),10000))]);});
  await page.reload({waitUntil:"networkidle"});
  await context.setOffline(true);
  await page.reload({waitUntil:"domcontentloaded",timeout:12000});
  await check(async()=>await page.locator("#totalQuestions").textContent().then(t=>t.trim()==="143"),"Application chargée hors ligne");
  await check(async()=>await page.locator("#examHistory .exam-history-row").count()===1,"Copies accessibles hors ligne");
  // La PWA doit aussi conserver les modules des examens et les nouvelles
  // variantes hors ligne, sans tenter de charger les cours GitHub.
  await page.locator("#examHistory button").first().click();
  await check(async()=>await page.locator("#examReview details.exam-review-group").count()===4,
    "Correction C accessible hors ligne");
  await page.locator("#examNew").click();
  await page.locator("#examSelect").selectOption("blanc-c");
  await page.locator("#examStart").click();
  await check(async()=>await page.locator("#examActive").isVisible(),
    "Nouvel examen C démarré hors ligne");
  const offlineContext=await page.locator("#examContext").textContent();
  await page.reload({waitUntil:"domcontentloaded",timeout:12000});
  await check(async()=>await page.locator("#examContext").textContent().then(x=>x===offlineContext),
    "Graine et énoncé conservés après recharge hors ligne");
  // Ouvrir une ancienne correction ne doit pas supprimer la copie courante.
  await page.locator("#examHistory button").first().click();
  await check(async()=>await page.locator("#examNew").textContent().then(x=>x.includes("Reprendre ma copie")),
    "Historique : retour vers la copie active clairement indiqué");
  await page.locator("#examNew").click();
  await check(async()=>await page.locator("#examActive").isVisible(),
    "Copie en cours préservée en consultant une ancienne correction");
  await check(async()=>await page.locator("#examContext").textContent().then(x=>x===offlineContext),
    "Énoncé courant préservé à travers l'historique");
  // Le cache doit fournir les fichiers Markdown, le moteur de math et les styles
  // même en naviguant directement vers un chapitre avec le réseau coupé.
  const offlineCourse=await context.newPage();
  offlineCourse.on("pageerror",e=>errors.push("Cours hors ligne : "+e.message));
  await offlineCourse.goto(BASE+"/course.html?course=12-probabilites",{waitUntil:"domcontentloaded",timeout:12000});
  await check(async()=>await offlineCourse.locator("#courseBody h2").count()>=5,
    "Cours de probabilités accessible par URL directe hors ligne");
  await check(async()=>await offlineCourse.locator("#courseBody math").count()>=4,
    "Équations de probabilités rendues sans connexion");
  await offlineCourse.locator("#courseTextSize").selectOption("large");
  await check(async()=>await offlineCourse.locator("#courseBody").getAttribute("data-reading-size").then(v=>v==="large"),
    "Lecture agrandie disponible hors connexion");
  await check(async()=>await offlineCourse.locator("#courseToc a").count()>=5,
    "Sommaire des sections reconstruit hors connexion");
  await offlineCourse.locator("#courseSelector").selectOption("13-trigonometrie");
  await check(async()=>await offlineCourse.locator("#courseBody h1").textContent().then(s=>s.includes("Trigonométrie")),
    "Changement de cours vers la trigonométrie hors ligne");
  await check(async()=>await offlineCourse.locator("#courseBody math").count()>=4,
    "MathML toujours disponible au changement de chapitre");
  await check(async()=>await offlineCourse.locator("#courseTextSize").inputValue().then(v=>v==="large"),
    "Préférence de lecture conservée en changeant de chapitre hors connexion");
  const allCourses=await offlineCourse.locator("#courseSelector option").evaluateAll(nodes=>nodes.map(n=>n.value));
  assert.equal(allCourses.length,18);
  let mathTotal=0,mathFallbacks=0;
  for(const slug of allCourses){
    await offlineCourse.goto(BASE+"/course.html?course="+slug,{waitUntil:"domcontentloaded",timeout:12000});
    await offlineCourse.waitForFunction(()=>document.querySelector("#courseStatus")?.textContent.startsWith("Cours "),null,{timeout:7000});
    const result=await offlineCourse.evaluate(()=>({
      title:document.querySelectorAll("#courseBody h1").length,
      sections:document.querySelectorAll("#courseBody h2").length,
      math:document.querySelectorAll("#courseBody math").length,
      fallback:document.querySelectorAll("#courseBody .course-math-fallback").length,
      placeholders:document.querySelector("#courseBody")?.textContent.includes("DAEUMATHTOKEN")
    }));
    assert.ok(result.title>=1&&result.sections>=1&&!result.placeholders,
      "Chapitre offline incomplet ou invalide : "+slug+" "+JSON.stringify(result));
    mathTotal+=result.math;mathFallbacks+=result.fallback;
  }
  await check(async()=>mathTotal>=60,"18 cours vérifiés hors ligne avec au moins 60 expressions mathématiques");
  console.log("Audit mathématique offline : "+mathTotal+" MathML, "+mathFallbacks+" formules en texte de repli");
  await check(async()=>await offlineCourse.locator("#coursePractice").getAttribute("href").then(h=>h==="./#practice-title"),
    "Navigation vers la pratique générale conservée hors ligne pour le complément");
  await offlineCourse.close();
  const offlinePractice=await context.newPage();
  await offlinePractice.goto(BASE+"/?topic=probas#practice-title",{waitUntil:"domcontentloaded",timeout:12000});
  await offlinePractice.waitForFunction(()=>document.querySelector("#topic")?.value==="probas"
    &&document.querySelectorAll("#topic option").length===14,null,{timeout:10000});
  await check(async()=>await offlinePractice.locator("#topic").inputValue().then(v=>v==="probas"),
    "Lien direct vers les probabilités utilisable hors connexion");
  await offlinePractice.close();
  const offlineProblems=await context.newPage();
  await offlineProblems.goto(BASE+"/problems.html",{waitUntil:"domcontentloaded",timeout:12000});
  await check(async()=>await offlineProblems.locator("#problemBody h3").count()===8,
    "Huit problèmes disponibles hors connexion");
  await offlineProblems.locator("#problemSwitch").click();
  await offlineProblems.waitForFunction(()=>document.querySelectorAll("#problemBody h2").length>=8,null,{timeout:10000});
  await check(async()=>await offlineProblems.locator("#problemBody h2").count()>=8,
    "Corrigés complets disponibles hors connexion");
  await offlineProblems.close();
  await context.setOffline(false);
  assert.deepEqual(errors,[],"Aucune requête locale en erreur");
  console.log("CHROMIUM MOBILE / COPIES / EXPORT-IMPORT / HORS LIGNE : OK");
} catch(error) {
  console.error("ÉCHEC DU PARCOURS NAVIGATEUR :",error);
  if(errors.length)console.error(errors);
  await page.screenshot({path:join(temp,"echec.png"),fullPage:true}).catch(()=>{});
  process.exitCode=1;
} finally {
  clearTimeout(watchdog);
  await context.close();await browser.close();
  if(process.exitCode!==1)await rm(temp,{recursive:true,force:true});
}
