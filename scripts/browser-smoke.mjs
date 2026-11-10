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
