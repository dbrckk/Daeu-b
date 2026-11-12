import {TOPICS} from "./questions.mjs";
import {mountNotebook} from "./math-notebook.mjs";
import {backedStorage,onAutoBackupStatus} from "./auto-backup.mjs";
import {COURSES,courseUrl} from "./course-catalog.mjs";
import {initExams,getExamBackup,restoreExamBackup,clearExamProgress} from "./exam-ui.mjs";
import {sanitizeExamStore,emptyExamStore} from "./exam-engine.mjs";
import {sanitizeWorkbook,emptyWorkbook} from "./workbook.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY,StaleDataError} from "./persistence.mjs";
import {VARIANTS,injectVariants,validateVariants} from "./variants.mjs";
import {buildRound,restoreRound,advanceRound} from "./round.mjs";
import {flatten,validateTopics,gradeAnswer,emptyState,sanitizeState,recordAnswer,getMetrics,selectRound} from "./engine.mjs";
import {buildJalonIndex,jalonProgress,recommendJalon,selectDiagnosticQuestions,selectJalonQuestions} from "./jalon-progress.mjs";
import {validatePrerequisites,prerequisiteAdvice,nextPrerequisite} from "./prerequisites.mjs";
import {emptyTransferStore,sanitizeTransferStore,transferSummary,transferStatus,recommendedTransferSeries,pendingTransferReviews} from "./transfer-progress.mjs";


const fullTopics=injectVariants(TOPICS);
const questions=flatten(fullTopics);
const knownIds=new Set(questions.map(q=>q.id));
const jalonIndex=buildJalonIndex(questions);
const errors=[...validateTopics(TOPICS),...validateVariants(TOPICS),...validatePrerequisites()];
if(errors.length) throw new Error("Corpus invalide : "+errors.join("; "));

const el=id=>document.getElementById(id);
const transferUrl=id=>{
  const series=recommendedTransferSeries(transferStatus(transfers,id));
  return "./problems.html?set=transferts&jalon="+id+(series==="a"?"":"&variante="+series);
};
let state=emptyState(),session=[],index=0,score=0,done=false,hintUsed=false,round=null,transfers=emptyTransferStore();
let dataStore=null;
let storageWorks=true;
function conflictWarning(){
  const notice=el("syncWarning");
  notice.hidden=false;
  el("main").inert=true;
  notice.focus();
}

function notification(message) {
  const target=el("notification"); target.textContent=message; target.hidden=!message;
}

try {
  dataStore=createPersistence(backedStorage(localStorage),knownIds);
  const initial=dataStore.snapshot();state=initial.practice;round=initial.round;transfers=initial.transfers;
} catch(err) {
  storageWorks=false;
  // Aucun original corrompu n'est effacé. Le mode dégradé reste utilisable,
  // mais les modifications ne persistent pas entre deux ouvertures.
  dataStore=createPersistence(createVolatileStorage(),knownIds);
  notification("Ancienne sauvegarde illisible ou stockage inaccessible. Données existantes préservées, mais cette session est temporaire. Exporte tes résultats et vérifie les paramètres du navigateur.");
}

function persist(practice,progressRound) {
  try {
    const saved=dataStore.commitPractice(practice,progressRound);
    state=saved.practice;round=saved.round;
    storageWorks=true;
    return true;
  }catch(err){
    storageWorks=false;
    if(err instanceof StaleDataError)conflictWarning();
    else notification("La progression n'a pas pu être enregistrée (quota ou permission). Aucune sauvegarde existante n'a été écrasée.");
    return false;
  }
}

const fmt=n=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:8}).format(n);
function renderFirstStart(metrics=getMetrics(state,questions)){
  const active=round&&round.completed<round.ids.length;
  el("firstStart").textContent=active?"Reprendre ma séance en cours":
    metrics.attempted>0?"Faire un nouveau repérage":"Démarrer mon diagnostic";
  el("firstStatus").textContent=active?
    "Une séance est sauvegardée sur cet appareil : reprends-la avant d'en commencer une autre.":
    metrics.attempted>0?
      metrics.attempted+" question(s) déjà travaillée(s), "+metrics.due+
      " rappel(s) arrivé(s) à échéance. Poursuis selon ton parcours.":
      "Tu n'as encore effectué aucun exercice. Le repérage initial est le meilleur point de départ.";
}
function firstStart(){
  if(round&&round.completed<round.ids.length){
    if(el("quiz").hidden)resumeSession();
    el("practice-title").scrollIntoView({behavior:"smooth",block:"start"});
    return;
  }
  startDiagnosticSession();
}
function refreshOverview() {
  const metrics=getMetrics(state,questions);
  renderFirstStart(metrics);
  el("totalQuestions").textContent=fmt(metrics.total);
  el("attempted").textContent=fmt(metrics.attempted);
  el("mastered").textContent=fmt(metrics.mastered);
  el("due").textContent=fmt(metrics.due);
  el("percentage").textContent=metrics.percent+" %";
  el("masteryProgress").value=metrics.percent;
  renderCatalog();
  renderJalonPath();
  const t=transferSummary(transfers);
  el("transferSummary").textContent=t.started+"/20 problèmes rédigés · "+t.due+" rappel(s) J+7/J+30 à effectuer · "+t.completed+" parcours de rappels déclarés terminés (non certifiés).";
  renderTransferQueue();
}
function renderTransferQueue(){
  const pending=pendingTransferReviews(transfers);
  const panel=el("transferDuePanel");
  panel.hidden=pending.length===0;
  const list=el("transferDueList");list.replaceChildren();
  for(const entry of pending.slice(0,5)){
    const item=document.createElement("li");item.className="transfer-due-entry";
    const link=document.createElement("a");
    link.href=transferUrl(entry.id);
    link.textContent="Jalon "+entry.id+" — rappel J+"+entry.stage+" (série "+entry.series.toUpperCase()+")";
    const note=document.createElement("p");
    note.textContent=entry.missing.length
      ?"À retravailler selon ta dernière auto-évaluation : "+entry.missing.join(", ")+"."
      :"Dernière auto-évaluation : aucun critère signalé. Refais pourtant le sujet sans corrigé.";
    item.append(link,note);list.append(item);
  }
  el("transferDueMore").textContent=pending.length>5
    ?(pending.length-5)+" autre(s) rappel(s) : retrouve-les en ouvrant les jalons détaillés."
    :"Les critères sont déclarés par toi, sans correction automatique.";
}
function renderJalonPath(){
  const rows=jalonProgress(state,questions,jalonIndex);
  const next=recommendJalon(rows);
  const notAttempted=rows.filter(r=>!r.attempted).length;
  el("jalonSummary").textContent=(20-notAttempted)+"/20 jalons abordés · "+rows.filter(r=>r.due>0).length+" avec rappels à faire. Une question réussie ne certifie pas la notion.";
  const area=el("pathNext");area.replaceChildren();
  const heading=document.createElement("h3");
  heading.textContent=next?"Étape conseillée : jalon "+next.id+" — "+next.title:"Toutes les questions interactives sont confirmées";
  const message=document.createElement("p");
  message.textContent=!next?"Continue avec les exercices rédigés, les transferts et les examens blancs. Ces compteurs ne certifient pas la maîtrise.":next.due>0?next.due+" rappel(s) arrivé(s) à échéance : contrôle sans indice.":next.unconfirmedErrors>0?next.unconfirmedErrors+" erreur(s) non encore confirmée(s) : revois la méthode avant de recommencer.":!next.attempted?"Cette notion n’a pas encore été travaillée.":"Déjà abordé : consolide les exercices non confirmés sur plusieurs jours.";
  area.append(heading,message);
  if(next){
    const requirements=prerequisiteAdvice(rows,next.id);
    if(requirements.length){
      const info=document.createElement("p");info.className="path-prerequisites";
      info.textContent="Prérequis conseillés : "+requirements.map(p=>"J"+p.id+" ("+p.status+")").join(" · ")+". L'accès au jalon n'est pas bloqué.";
      area.append(info);
    }
    const priority=nextPrerequisite(rows,next.id);
    if(priority){
      const review=document.createElement("button");review.type="button";review.className="subtle small";
      review.textContent="Revoir d'abord le jalon "+priority.id;
      review.addEventListener("click",()=>startJalonSession(priority.id,priority.mode));
      area.append(review);
    }
  }
  if(next){
    const actions=document.createElement("div");actions.className="path-buttons";
    const play=document.createElement("button");play.className="primary";play.type="button";play.textContent="Travailler ce jalon";
    play.addEventListener("click",()=>startJalonSession(next.id,next.mode));
    const course=document.createElement("a");course.href=courseUrl(next.lesson);course.textContent="Lire le cours";
    const transfer=document.createElement("a");transfer.href=transferUrl(next.id);transfer.textContent="Problème de transfert";
    actions.append(play,course,transfer);area.append(actions);
  }
  const diagnostic=el("diagnosticStart");diagnostic.disabled=notAttempted===0;
  diagnostic.textContent=notAttempted?"Repérage initial · jusqu’à 10 jalons":"Tous les jalons ont été abordés";
  const list=el("jalonList");list.replaceChildren();
  for(const row of rows){
    const item=document.createElement("li");item.className="jalon-entry";
    const title=document.createElement("h3");title.textContent=row.id+". "+row.title;
    const status=document.createElement("p");status.className="jalon-status";
    status.textContent=row.status+" · "+row.attempted+"/"+row.total+" tentées · "+row.confirmed+" confirmée(s)"+(row.due?" · "+row.due+" rappel(s)":"");
    const buttons=document.createElement("div");buttons.className="path-buttons";
    const play=document.createElement("button");play.className="subtle small";play.type="button";play.textContent="S’entraîner";
    play.setAttribute("aria-label","S’entraîner sur le jalon "+row.id+" : "+row.title);
    play.addEventListener("click",()=>startJalonSession(row.id,row.mode));
    const course=document.createElement("a");course.href=courseUrl(row.lesson);course.textContent="Cours";
    const transfer=document.createElement("a");transfer.href=transferUrl(row.id);transfer.textContent="Transfert rédigé";
    const transferState=transferStatus(transfers,row.id);
    const tinfo=document.createElement("p");tinfo.className="jalon-pre";
    tinfo.textContent=!transferState.count?"Transfert écrit : non commencé":transferState.done?"Transfert écrit : 3 étapes auto-déclarées":transferState.due?"Transfert écrit : rappel à effectuer":"Transfert écrit : prochain rappel planifié";
    item.append(tinfo);
    const requirements=prerequisiteAdvice(rows,row.id);
    if(requirements.length){
      const info=document.createElement("p");info.className="jalon-pre";info.textContent="Prérequis : "+requirements.map(p=>"J"+p.id+" ("+p.status+")").join(" · ");
      item.append(title,status,info);
    }else item.append(title,status);
    const priority=nextPrerequisite(rows,row.id);
    if(priority){
      const back=document.createElement("button");back.type="button";back.className="subtle small";back.textContent="Revoir J"+priority.id;
      back.setAttribute("aria-label","Revoir le prérequis jalon "+priority.id+" avant le jalon "+row.id);
      back.addEventListener("click",()=>startJalonSession(priority.id,priority.mode));
      buttons.append(back);
    }
    buttons.append(play,course,transfer);item.append(buttons);list.append(item);
  }
}

function renderCatalog() {
  const container=el("topicCards"); container.replaceChildren();
  for(const topic of fullTopics){
    const card=document.createElement("article");card.className="topic-card";
    const count=topic.questions.length;
    const completed=topic.questions.filter(q=>Boolean(state.items?.[q.id]?.confirmed)).length;
    const mark=document.createElement("div");mark.className="mark";mark.textContent=completed+"/"+count+" acquis";
    const title=document.createElement("h3");title.textContent=topic.title;
    const body=document.createElement("p");
    body.textContent="Jalon"+(topic.jalons.length>1?"s ":" ")+topic.jalons.join(", ")+" · "+count+" questions";
    const link=document.createElement("a");link.href=courseUrl(topic.lesson);
    link.target="_blank";link.rel="noopener noreferrer";link.textContent="Lire le cours ↗";
    const play=document.createElement("button");play.className="subtle small";play.style.marginLeft="10px";play.textContent="Pratiquer";
    play.type="button";play.setAttribute("aria-label","Pratiquer : "+topic.title);
    play.addEventListener("click",()=>{
      el("topic").value=topic.slug;el("mode").value="all";startSession();
      el("practice-title").scrollIntoView({behavior:"smooth",block:"start"});
    });
    card.append(mark,title,body,link,play);
    container.appendChild(card);
  }
}

function renderCourseLibrary(){
  const area=el("courseLibrary");area.replaceChildren();
  for(const [slug,label] of COURSES){
    const link=document.createElement("a");
    link.className="course-library-entry";
    link.href=courseUrl(slug);
    link.textContent=label;
    area.append(link);
  }
}
function buildTopicSelector() {
  for(const topic of fullTopics) {
    const option=document.createElement("option");option.value=topic.slug;option.textContent=topic.title;
    el("topic").appendChild(option);
  }
}

function startSession() {
  const selected=selectRound(state,questions,{topic:el("topic").value,mode:el("mode").value,limit:10});
  if(!selected.length){
    notification(el("mode").value==="due"?"Aucune question à réviser actuellement dans ce chapitre. Passe en mode découverte ou reviens à la date d'échéance.":"Aucune question correspondante. Essaie un autre domaine ou mode.");
    return;
  }
  startSelectedSession(selected);
}
function startSelectedSession(selected){
  try{
    const planned=buildRound(selected,state);
    const saved=dataStore.updateRound(planned.round);
    round=saved.round;session=planned.questions;
  }catch(err){
    if(err instanceof StaleDataError)conflictWarning();
    else notification("Impossible de sauvegarder la nouvelle séance. Vérifie le stockage du navigateur.");
    return;
  }
  index=0;score=0;done=false;
  el("results").hidden=true;
  el("quiz").hidden=false;
  notification("");
  renderFirstStart();
  renderQuestion();
}
function startJalonSession(jalon,mode="all"){
  let selection=selectJalonQuestions(state,questions,jalonIndex,jalon,mode);
  if(!selection.length&&mode!=="all")selection=selectJalonQuestions(state,questions,jalonIndex,jalon,"all");
  if(!selection.length){notification("Aucune question disponible pour ce jalon.");return;}
  startSelectedSession(selection);
  el("practice-title").scrollIntoView({behavior:"smooth",block:"start"});
}
function startDiagnosticSession(){
  const selection=selectDiagnosticQuestions(state,questions,jalonIndex);
  if(!selection.length){notification("Tous les jalons ont déjà été abordés. Utilise les révisions ciblées.");return;}
  startSelectedSession(selection);
  el("practice-title").scrollIntoView({behavior:"smooth",block:"start"});
}
function resumeSession(){
  if(!round)return;
  try{
    session=restoreRound(round,questions);
    score=round.score;index=round.completed;done=false;
    if(index>=session.length)finish();
    else{
      el("quiz").hidden=false;
      renderQuestion();
      notification("Séance restaurée après rechargement : questions et variantes conservées.");
    }
  }catch(err){
    notification("Cette ancienne séance ne peut pas être reconstruite. Démarre une nouvelle séance ; ta progression validée reste intacte.");
  }
}

function markGuidedQuestion(){
  if(done||!round||!session[index])return;
  const id=session[index].id;
  hintUsed=true;
  if(round.assistedIds?.includes(id))return;
  try{
    const saved=dataStore.updateRound({...round,assistedIds:[...(round.assistedIds??[]),id]});
    round=saved.round;
  }catch(error){
    if(error instanceof StaleDataError)conflictWarning();
    else notification("L'aide a été consultée, mais son enregistrement a échoué. Termine ta réponse avant de quitter.");
  }
}
function renderQuestion() {
  const q=session[index]; if(!q) return finish();
  done=false;hintUsed=!!round?.assistedIds?.includes(q.id);
  el("quizCount").textContent="Question "+(index+1)+" / "+session.length;
  el("quizTopic").textContent=q.topicTitle;
  el("quizProgress").max=session.length;
  el("quizProgress").value=index;
  el("questionText").textContent=q.prompt;
  mountNotebook(el("quizNotebook"),{context:"quiz:"+q.id,adapter:dataStore,title:"Mon raisonnement — "+q.topicTitle,onGuidance:markGuidedQuestion});
  el("questionHelp").textContent=q.isVariant?"Exercice à valeurs variables : un autre énoncé sera proposé au prochain rappel.":"Réponds sans consulter le cours. Les étapes importantes sont dans la correction.";
  el("feedback").hidden=true;el("hint").hidden=true;
  el("hint").textContent="";
  el("answerForm").hidden=false;el("submit").disabled=false;
  el("numericAnswer").hidden=q.type!=="number";
  el("choices").hidden=q.type!=="choice";
  el("choiceList").replaceChildren();
  el("answer").value="";
  if(q.type==="choice"){
    q.options.forEach((option,i)=>{
      const label=document.createElement("label");label.className="option";
      const input=document.createElement("input");input.type="radio";input.name="answerChoice";input.value=option;input.id="option-"+i;
      const text=document.createElement("span");text.textContent=option;
      label.append(input,text);el("choiceList").appendChild(label);
    });
    el("choiceList").querySelector("input")?.focus();
  } else el("answer").focus();
}

function showFeedback(correct,wasUnknown=false) {
  const q=session[index];
  el("feedback").hidden=false;el("feedback").dataset.result=correct?"correct":"wrong";
  el("feedbackTitle").textContent=correct?(hintUsed?"Bonne réponse avec indice (non validée pour la maîtrise)":"Bonne réponse"):"À retravailler";
  const expected=q.type==="number"?fmt(q.answer):q.answer;
  el("feedbackText").textContent=(correct?"":(wasUnknown?"Réponse à connaître : ":"Réponse attendue : ")+expected+"\n\n")+q.explanation;
  el("lessonLink").href=courseUrl(q.lesson);
  el("answerForm").hidden=true;
  el("next").textContent=index===session.length-1?"Terminer la séance":"Question suivante";
  el("next").focus();
}

function submit(raw,unknown=false) {
  if(done) return;
  const q=session[index];
  const grade=unknown?{valid:true,correct:false}:gradeAnswer(q,raw);
  if(!grade.valid){notification(grade.message);return;}
  const next=recordAnswer(state,q.id,grade.correct,Date.now(),{signature:q.isVariant?q.prompt:null,hinted:hintUsed});
  if(!persist(next,advanceRound(round,grade.correct)))return;
  done=true;notification("");
  score=round.score;
  refreshOverview();
  showFeedback(grade.correct,unknown);
}

function finish(){
  el("quiz").hidden=true;
  el("results").hidden=false;
  el("resultsText").textContent="Tu as réussi "+score+" réponse"+(score>1?"s":"")+" sur "+session.length+". Les rappels à valeurs variables et sans indice consolident les acquis. Une aide n’augmente pas la maîtrise.";
  el("restart").focus();
  refreshOverview();
}

function exportProgress(){
  let snapshot;
  try{snapshot=dataStore.snapshot();}
  catch(err){if(err instanceof StaleDataError)conflictWarning();else notification("Impossible de lire la sauvegarde actuelle.");return;}
  const backup={backupVersion:1,practice:snapshot.practice,exams:snapshot.exams,round:snapshot.round,transfers:snapshot.transfers,workbook:snapshot.workbook};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="daeu-b-progression-"+new Date().toISOString().slice(0,10)+".json";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  notification("Sauvegarde préparée. Garde le fichier JSON en lieu sûr pour changer d'appareil.");
}

async function importProgress(file) {
  if(!file) return;
  if(file.size>1_000_000){notification("Sauvegarde refusée : fichier trop volumineux.");return;}
  try {
    const raw=JSON.parse(await file.text());
    const bundled=raw?.backupVersion===1;
    const imported=sanitizeState(bundled?raw.practice:raw,knownIds);
    const importedExams=bundled?sanitizeExamStore(raw.exams):null;
    const importedTransfers=bundled?sanitizeTransferStore(raw.transfers):emptyTransferStore();
    const importedWorkbook=bundled?sanitizeWorkbook(raw.workbook):emptyWorkbook();
    const importedCount=Object.keys(imported.items).length;
    if(!confirm("Importer "+importedCount+" résultat(s) ? Cela remplace la progression de cet appareil.")) return;
    // Une seule écriture atomique contient les révisions ET les examens.
    const prior=dataStore.snapshot();
    const updated=dataStore.replaceAll(imported,importedExams??prior.exams,bundled?raw.round??null:null,importedTransfers,importedWorkbook);
    state=updated.practice;round=updated.round;transfers=updated.transfers;
    restoreExamBackup(updated.exams);
    el("quiz").hidden=true;el("results").hidden=true;session=[];
    refreshOverview();resumeSession();
    notification("Sauvegarde importée intégralement : "+importedCount+" résultat(s) reconnus.");
  }catch(err){
    if(err instanceof StaleDataError)conflictWarning();
    else notification("Import annulé : fichier incompatible ou stockage saturé. Les anciennes données n'ont pas été remplacées.");
  }
}

onAutoBackupStatus(value=>{
  const messages={
    "initialisation":"Initialisation de la sauvegarde automatique…",
    "sauvegarde-automatique":"Enregistrement automatique : deux copies locales (navigateur + IndexedDB).",
    "restauree":"Une copie locale a été retrouvée et restaurée automatiquement.",
    "stockage-secondaire-indisponible":"Une seule copie locale disponible : le stockage secondaire est indisponible.",
    "copie-secondaire-en-echec":"La copie principale reste enregistrée ; la seconde copie automatique n’a pas abouti."
  };
  el("autoBackupStatus").textContent=messages[value]||"Progression sauvegardée localement.";
});
buildTopicSelector();
// Les liens issus des cours sélectionnent uniquement le chapitre autorisé.
// Aucune nouvelle séance n'est créée sans action explicite.
const practiceParams=new URLSearchParams(location.search);
const requestedTopic=practiceParams.get("topic");
if(fullTopics.some(topic=>topic.slug===requestedTopic)){
  el("topic").value=requestedTopic;
  const requestedMode=practiceParams.get("mode");
  if(["due","wrong"].includes(requestedMode))el("mode").value=requestedMode;
}
renderCourseLibrary();
refreshOverview();
initExams(dataStore,conflictWarning);
resumeSession();
renderFirstStart();
el("firstStart").addEventListener("click",firstStart);
el("start").addEventListener("click",startSession);
el("diagnosticStart").addEventListener("click",startDiagnosticSession);
el("restart").addEventListener("click",startSession);
el("answerForm").addEventListener("submit",evt=>{
  evt.preventDefault();
  const q=session[index];
  const raw=q.type==="number"?el("answer").value:el("choiceList").querySelector("input:checked")?.value;
  submit(raw);
});
el("unknownButton").addEventListener("click",()=>submit(null,true));
el("hintButton").addEventListener("click",()=>{
  if(done)return;markGuidedQuestion();el("hint").hidden=false;el("hint").textContent=session[index].hint;
});
el("next").addEventListener("click",()=>{index++;renderQuestion();});
el("export").addEventListener("click",exportProgress);
el("importFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];await importProgress(file);event.target.value="";
});
el("persistStorage").addEventListener("click",async()=>{
  if(!navigator.storage?.persist){
    notification("Le stockage persistant n’est pas proposé. Les deux copies locales automatiques continuent si IndexedDB est disponible. Une sauvegarde distante serait nécessaire en cas de perte du téléphone.");
    return;
  }
  try{
    const granted=await navigator.storage.persist();
    notification(granted
      ? "Le stockage persistant a été accepté. La double copie locale ne protège toutefois ni la perte du téléphone ni l’effacement complet des données."
      : "La persistance renforcée n’a pas été acceptée. Les sauvegardes locales automatiques restent utilisables, mais une perte d’appareil nécessite une sauvegarde cloud.");
  }catch(error){
    notification("La demande de persistance n’a pas abouti. La sauvegarde automatique locale continue si elle est disponible.");
  }
});
el("reset").addEventListener("click",()=>{
  if(!confirm("Effacer toute ta progression ? Si ton compte cloud est connecté, la suppression sera également synchronisée sur tes autres appareils. Cette action est irréversible."))return;
  try{
    const fresh=dataStore.replaceAll(emptyState(),emptyExamStore());
    state=fresh.practice;round=null;transfers=fresh.transfers;clearExamProgress();refreshOverview();
    session=[];el("quiz").hidden=true;el("results").hidden=true;
    notification("Progression et copies remises à zéro.");
  }catch(err){
    if(err instanceof StaleDataError)conflictWarning();
    else notification("Réinitialisation annulée : sauvegarde impossible. Aucune donnée existante effacée.");
  }
});
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"||location.hostname==="127.0.0.1")){
  navigator.serviceWorker.register("./sw.js").catch(()=>{/* mode en ligne reste fonctionnel */});
}
el("syncReload").addEventListener("click",()=>location.reload());
window.addEventListener("storage",event=>{
  if((event.key===DATA_KEY||event.key===null)&&dataStore.isStale())conflictWarning();
});
