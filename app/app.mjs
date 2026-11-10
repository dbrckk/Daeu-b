import {TOPICS} from "./questions.mjs";
import {COURSES,courseUrl} from "./course-catalog.mjs";
import {initExams,getExamBackup,restoreExamBackup,clearExamProgress} from "./exam-ui.mjs";
import {sanitizeExamStore,emptyExamStore} from "./exam-engine.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY,StaleDataError} from "./persistence.mjs";
import {VARIANTS,injectVariants,validateVariants} from "./variants.mjs";
import {buildRound,restoreRound,advanceRound} from "./round.mjs";
import {flatten,validateTopics,gradeAnswer,emptyState,sanitizeState,recordAnswer,getMetrics,selectRound} from "./engine.mjs";


const fullTopics=injectVariants(TOPICS);
const questions=flatten(fullTopics);
const knownIds=new Set(questions.map(q=>q.id));
const errors=[...validateTopics(TOPICS),...validateVariants(TOPICS)];
if(errors.length) throw new Error("Corpus invalide : "+errors.join("; "));

const el=id=>document.getElementById(id);
let state=emptyState(),session=[],index=0,score=0,done=false,hintUsed=false,round=null;
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
  dataStore=createPersistence(localStorage,knownIds);
  const initial=dataStore.snapshot();state=initial.practice;round=initial.round;
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
function refreshOverview() {
  const metrics=getMetrics(state,questions);
  el("totalQuestions").textContent=fmt(metrics.total);
  el("attempted").textContent=fmt(metrics.attempted);
  el("mastered").textContent=fmt(metrics.mastered);
  el("due").textContent=fmt(metrics.due);
  el("percentage").textContent=metrics.percent+" %";
  el("masteryProgress").value=metrics.percent;
  renderCatalog();
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
  renderQuestion();
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

function renderQuestion() {
  const q=session[index]; if(!q) return finish();
  done=false;hintUsed=false;
  el("quizCount").textContent="Question "+(index+1)+" / "+session.length;
  el("quizTopic").textContent=q.topicTitle;
  el("quizProgress").max=session.length;
  el("quizProgress").value=index;
  el("questionText").textContent=q.prompt;
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
  const backup={backupVersion:1,practice:snapshot.practice,exams:snapshot.exams,round:snapshot.round};
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
  if(file.size>500_000){notification("Sauvegarde refusée : fichier trop volumineux.");return;}
  try {
    const raw=JSON.parse(await file.text());
    const bundled=raw?.backupVersion===1;
    const imported=sanitizeState(bundled?raw.practice:raw,knownIds);
    const importedExams=bundled?sanitizeExamStore(raw.exams):null;
    const importedCount=Object.keys(imported.items).length;
    if(!confirm("Importer "+importedCount+" résultat(s) ? Cela remplace la progression de cet appareil.")) return;
    // Une seule écriture atomique contient les révisions ET les examens.
    const prior=dataStore.snapshot();
    const updated=dataStore.replaceAll(imported,importedExams??prior.exams,bundled?raw.round??null:null);
    state=updated.practice;round=updated.round;
    restoreExamBackup(updated.exams);
    el("quiz").hidden=true;el("results").hidden=true;session=[];
    refreshOverview();resumeSession();
    notification("Sauvegarde importée intégralement : "+importedCount+" résultat(s) reconnus.");
  }catch(err){
    if(err instanceof StaleDataError)conflictWarning();
    else notification("Import annulé : fichier incompatible ou stockage saturé. Les anciennes données n'ont pas été remplacées.");
  }
}

buildTopicSelector();
renderCourseLibrary();
refreshOverview();
initExams(dataStore,conflictWarning);
resumeSession();
el("start").addEventListener("click",startSession);
el("restart").addEventListener("click",startSession);
el("answerForm").addEventListener("submit",evt=>{
  evt.preventDefault();
  const q=session[index];
  const raw=q.type==="number"?el("answer").value:el("choiceList").querySelector("input:checked")?.value;
  submit(raw);
});
el("unknownButton").addEventListener("click",()=>submit(null,true));
el("hintButton").addEventListener("click",()=>{
  if(done)return;hintUsed=true;el("hint").hidden=false;el("hint").textContent=session[index].hint;
});
el("next").addEventListener("click",()=>{index++;renderQuestion();});
el("export").addEventListener("click",exportProgress);
el("importFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];await importProgress(file);event.target.value="";
});
el("persistStorage").addEventListener("click",async()=>{
  if(!navigator.storage?.persist){
    notification("Ton navigateur ne propose pas le stockage persistant. Exporte régulièrement ta sauvegarde JSON.");
    return;
  }
  try{
    const granted=await navigator.storage.persist();
    notification(granted
      ? "Le navigateur a accordé la persistance du stockage local. Cela ne protège pas contre un changement de domaine, une suppression volontaire ou une perte du téléphone : exporte aussi le JSON."
      : "Le navigateur n’a pas accordé la persistance. Les révisions restent utilisables, mais exporte régulièrement une sauvegarde JSON.");
  }catch(error){
    notification("La demande de persistance n’a pas abouti. Tu peux continuer et exporter les résultats en JSON.");
  }
});
el("reset").addEventListener("click",()=>{
  if(!confirm("Effacer tous les résultats enregistrés sur cet appareil ? Pense à exporter d'abord."))return;
  try{
    const fresh=dataStore.replaceAll(emptyState(),emptyExamStore());
    state=fresh.practice;round=null;clearExamProgress();refreshOverview();
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
