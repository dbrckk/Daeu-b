import {TOPICS} from "./questions.mjs";
import {mountNotebook,notebookMode} from "./math-notebook.mjs";
import {backedStorage,onAutoBackupStatus} from "./auto-backup.mjs";
import {COURSES,courseUrl,stepReview} from "./course-catalog.mjs";
import {BOOKMARK_PREFIX,LAST_READING_KEY,readBookmarkEntry,readLastReading} from "./reading-bookmark.mjs";
import {initExams,getExamBackup,restoreExamBackup,clearExamProgress} from "./exam-ui.mjs";
import {sanitizeExamStore,emptyExamStore} from "./exam-engine.mjs";
import {sanitizeWorkbook,emptyWorkbook,workbookReviewPlan} from "./workbook.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY,StaleDataError} from "./persistence.mjs";
import {VARIANTS,injectVariants,validateVariants} from "./variants.mjs";
import {buildRound,restoreRound,advanceRound,MAX_ANSWER_DRAFT_LENGTH} from "./round.mjs";
import {flatten,validateTopics,gradeAnswer,emptyState,sanitizeState,recordAnswer,getMetrics,selectRound,recurringErrors} from "./engine.mjs";
import {JALONS} from "./jalons.mjs";
import {buildJalonIndex,jalonProgress,recommendJalon,selectDiagnosticQuestions,selectJalonQuestions} from "./jalon-progress.mjs";
import {validatePrerequisites,prerequisiteAdvice,nextPrerequisite} from "./prerequisites.mjs";
import {emptyTransferStore,sanitizeTransferStore,transferSummary,transferStatus,recommendedTransferSeries,pendingTransferReviews,transferWorkKey} from "./transfer-progress.mjs";


const fullTopics=injectVariants(TOPICS);
const questions=flatten(fullTopics);
const knownIds=new Set(questions.map(q=>q.id));
const jalonIndex=buildJalonIndex(questions);
const errors=[...validateTopics(TOPICS),...validateVariants(TOPICS),...validatePrerequisites()];
if(errors.length) throw new Error("Corpus invalide : "+errors.join("; "));

const practiceParams=new URLSearchParams(location.search);
const requestedTopic=practiceParams.get("topic");
const requestedRevision=!practiceParams.has("topic")&&!practiceParams.has("jalon")
  ?stepReview(practiceParams.get("revision")):null;
const requestedJalon=JALONS.find(item=>String(item.id)===practiceParams.get("jalon"));
const hasTopic=fullTopics.some(topic=>topic.slug===requestedTopic);
const scopedPractice=Boolean(requestedJalon||hasTopic||requestedRevision);
const practiceIds=requestedRevision?new Set(requestedRevision.ids.filter(id=>knownIds.has(id)))
  :requestedJalon?jalonIndex.get(requestedJalon.id)
  :new Set(questions.filter(question=>question.topic===requestedTopic).map(question=>question.id));

const el=id=>document.getElementById(id);
const transferUrl=(id,series=recommendedTransferSeries(transferStatus(transfers,id)))=>
  "./problems.html?set=transferts&jalon="+id+(series==="a"?"":"&variante="+series);
let state=emptyState(),session=[],index=0,score=0,done=false,hintUsed=false,round=null,transfers=emptyTransferStore();
let dataStore=null,answerDraftTimer=null,roundHistory=[],pausedRound=null;
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
  roundHistory=initial.roundHistory??[];pausedRound=initial.pausedRound??null;
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
function firstAction(metrics){
  if(round&&round.completed<round.ids.length)return {kind:"resume"};
  if(pausedRound)return {kind:"paused"};
  if(metrics.due)return {kind:"due"};
  const rows=jalonProgress(state,questions,jalonIndex);
  if(rows.some(row=>!row.attempted))return {kind:"diagnostic"};
  const next=recommendJalon(rows);
  return next?{kind:"jalon",next}:{kind:"exam"};
}

function matchesPractice(candidate){
  return Boolean(candidate&&(!requestedJalon||!candidate.jalon||requestedJalon.id===candidate.jalon)
    &&candidate.ids.every(id=>practiceIds.has(id)));
}

function renderPracticeResume(){
  const context=el("practiceSavedSession");
  context.hidden=true;
  if(!scopedPractice||!el("quiz").hidden||!el("results").hidden)return;
  const matchingActive=matchesPractice(round);
  const matchingPaused=matchesPractice(pausedRound);
  const unrelated=round&&!matchingActive;
  const active=round&&round.completed<round.ids.length;
  const resume=el("practiceResumeTarget"),other=el("practiceResumeOther");
  resume.hidden=!(matchingPaused||(matchingActive&&active));
  other.hidden=!unrelated;
  other.textContent=active?"Retrouver ma séance en cours":"Retrouver mon dernier bilan";
  context.hidden=resume.hidden&&other.hidden;
}

function renderFirstStart(metrics=getMetrics(state,questions)){
  const {kind,next}=firstAction(metrics);
  const cards={
    resume:["Reprendre ma séance","Retrouve ta progression jusqu’à la dernière réponse validée.","Reprendre ma séance en cours"],
    paused:["Reprendre ma séance mise en pause","Retrouve tes réponses et ton brouillon au dernier exercice.","Reprendre la séance mise en pause"],
    due:["Mes rappels à faire","Travaille jusqu’à dix questions, en commençant par les échéances les plus anciennes.","Réviser mes questions à échéance"],
    diagnostic:["Repérer mon niveau","Jusqu’à dix questions, sans regarder les corrections. Aucune note officielle.",metrics.attempted?"Faire un nouveau repérage":"Démarrer mon diagnostic"],
    exam:["Passer un examen blanc","Teste-toi sur un sujet complet avec chronomètre et corrigé.","Voir les examens blancs"]
  };
  const [title,description,button]=kind==="jalon"
    ?["Poursuivre mon parcours",next.title,"Travailler le jalon "+next.id]
    :cards[kind];
  el("firstTitle").textContent=metrics.attempted?"Reprendre mes maths":"Commencer en trois étapes";
  el("firstStepTitle").textContent="1 · "+title;
  el("firstStepDetails").textContent=description;
  el("firstStart").textContent=button;
  el("resumePausedRound").hidden=!pausedRound||kind==="paused";
  el("resumeFromResults").hidden=!pausedRound;
  const status=metrics.due===1?"1 question à réviser":metrics.due+" questions à réviser";
  el("firstStatus").textContent=metrics.attempted
    ?metrics.attempted+" question(s) déjà travaillée(s) · "+status+"."
    :kind==="resume"?"Une séance est sauvegardée sur cet appareil."
    :"Tu n’as encore effectué aucun exercice. Le repérage initial est le meilleur point de départ.";
  renderPracticeResume();
}

function focusCurrentQuiz(){
  const quiz=el("quiz");
  if(quiz.hidden||quiz.classList.contains("paper-mode"))return;
  const target=done?el("feedbackTitle"):el("questionText");
  target.focus({preventScroll:true});
  (done?el("feedback"):quiz).scrollIntoView({block:"start",behavior:"instant"});
}

function resumeCurrentSession(){
  if(el("quiz").hidden)resumeSession();
  renderPracticeResume();
  focusCurrentQuiz();
}

function firstStart(){
  const now=Date.now();
  const {kind,next}=firstAction(getMetrics(state,questions,now));
  switch(kind){
    case "resume":
      resumeCurrentSession();
      break;
    case "paused":
      resumePausedSession();
      break;
    case "due":
      if(startSelectedSession(selectRound(state,questions,{mode:"due",now})))focusCurrentQuiz();
      break;
    case "diagnostic":
      startDiagnosticSession();
      break;
    case "jalon":
      startJalonSession(next.id,next.mode);
      break;
    case "exam":
      el("exam-title").focus();
      break;
  }
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
  renderRecurringReviews();
  renderStepReviewDashboard();
}
function renderStepReviewDashboard(){
  const panel=el("stepReviewDashboard"),daily=el("stepReviewDaily"),history=el("stepReviewHistory");
  daily.replaceChildren();history.replaceChildren();
  let plan;
  try{plan=workbookReviewPlan(dataStore.snapshot().workbook,state);}
  catch{panel.hidden=true;return;}
  panel.hidden=!plan.history.length;
  if(panel.hidden)return;
  const remaining=plan.rows.filter(row=>row.remaining>0||row.due>0);
  el("stepReviewSummary").textContent=remaining.length
    ?remaining.length+" notion(s) à retravailler d’après les derniers diagnostics."
    :"Les exercices ciblés ont été retravaillés ou aucun problème récent n’a été détecté ; continue les rappels habituels.";
  const due=getMetrics(state,questions).due;
  if(due){
    const line=document.createElement("li"),link=document.createElement("a");
    link.href="./#practice-title";link.textContent="Faire d’abord les "+due+" rappel(s) déjà à échéance";
    const action=document.createElement("button");action.type="button";action.className="subtle small";action.textContent="Démarrer les rappels";
    action.addEventListener("click",()=>{if(startSelectedSession(selectRound(state,questions,{mode:"due",limit:10})))focusCurrentQuiz();});
    line.append(link,action);daily.append(line);
  }
  for(const row of plan.daily){
    const li=document.createElement("li");
    const title=document.createElement("strong");title.textContent=row.title;
    const detail=document.createElement("p");detail.className="helper";
    detail.textContent=row.count+" erreur(s) au dernier contrôle de "+row.contexts+" cahier(s) · "+
      row.practiced+"/"+row.ids.length+" exercices réussis sans aide depuis ce diagnostic"+
      (row.due?" · "+row.due+" rappel(s) à échéance":"");
    const actions=document.createElement("div");actions.className="path-buttons";
    const link=document.createElement("a");link.href=row.url;link.textContent="Révision ciblée";
    const course=document.createElement("a");course.href=courseUrl(row.lesson);course.textContent="Relire le cours";
    actions.append(link,course);li.append(title,detail,actions);daily.append(li);
  }
  if(!daily.children.length){const li=document.createElement("li");li.textContent="Pas de révision ciblée prioritaire actuellement.";daily.append(li);}
  for(const record of plan.history.slice(0,10)){
    const li=document.createElement("li");
    const date=new Date(record.at).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"});
    const context=record.context.startsWith("cours:")?COURSES.find(([slug])=>slug===record.context.slice(6))?.[1]??"Cours"
      :record.context.startsWith("quiz:")?"Quiz "+record.context.slice(5):"Problème rédigé";
    li.textContent=date+" — "+context+" · "+(record.skills.length
      ?record.skills.map(skill=>stepReview(skill.code).title+" ("+skill.count+")").join(" ; ")
      :"aucune erreur détectée dans les lignes vérifiées")+
      (record.unsupported?" · "+record.unsupported+" non vérifiée(s)":"");
    history.append(li);
  }
  el("stepReviewHistorySummary").textContent="Historique · "+plan.history.length+" diagnostic(s) conservé(s), 10 derniers affichés";
}
function renderTransferQueue(){
  const pending=pendingTransferReviews(transfers);
  const panel=el("transferDuePanel");
  panel.hidden=pending.length===0;
  const shortcut=el("firstTransferDue");
  shortcut.hidden=!pending.length;
  shortcut.textContent=pending.length===1?"Voir mon rappel rédigé":"Voir mes "+pending.length+" rappels rédigés";
  const list=el("transferDueList"),extraList=el("transferDueExtraList"),extra=el("transferDueExtra");
  list.replaceChildren();extraList.replaceChildren();
  extra.hidden=pending.length<=5;
  if(extra.hidden)extra.open=false;
  else el("transferDueMore").textContent=pending.length===6
    ?"Voir l’autre rappel":"Voir les "+(pending.length-5)+" autres rappels";
  if(!pending.length)return;
  let entries;
  try{entries=dataStore.snapshot().workbook.entries;}catch{/* Les liens d’échéance restent disponibles. */}
  for(const [index,entry] of pending.entries()){
    const item=document.createElement("li");item.className="transfer-due-entry";
    const link=document.createElement("a");
    link.href=transferUrl(entry.id,entry.series);
    link.textContent="Jalon "+entry.id+" — rappel J+"+entry.stage+" (série "+entry.series.toUpperCase()+")";
    const note=document.createElement("p");
    note.textContent=entry.missing.length
      ?"À retravailler selon ta dernière auto-évaluation : "+entry.missing.join(", ")+"."
      :"Dernière auto-évaluation : aucun critère signalé. Refais pourtant le sujet sans corrigé.";
    item.append(link,note);
    for(const series of entry.unusedSeries){
      const draft=entries?.[transferWorkKey(entry.id,series)];
      if(!draft||(!draft.text.trim()&&!draft.pages.some(page=>page.length)))continue;
      const resume=document.createElement("a");
      resume.className="reader-section-save";
      resume.href=transferUrl(entry.id,series)+"#problemNotebookPanel";
      resume.textContent="Reprendre mon brouillon · série "+series.toUpperCase();
      item.append(resume);
    }
    (index<5?list:extraList).append(item);
  }
}
function jalonActions(jalon,{showTransfer=true}={}){
  const actions=document.createElement("div");actions.className="path-buttons";
  const practice=document.createElement("button");practice.className="primary";practice.type="button";
  practice.textContent="Travailler ce jalon";
  practice.addEventListener("click",()=>startJalonSession(jalon.id,jalon.mode));
  const course=document.createElement("a");course.href=courseUrl(jalon.lesson,{jalon:jalon.id});course.textContent="Lire le cours";
  actions.append(practice,course);
  if(showTransfer){
    const transfer=document.createElement("a");transfer.href=transferUrl(jalon.id);transfer.textContent="Problème de transfert";
    actions.append(transfer);
  }
  return actions;
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
  if(next)area.append(jalonActions(next));
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
    const course=document.createElement("a");course.href=courseUrl(row.lesson,{jalon:row.id});course.textContent="Cours";
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

const readingDocuments=new Map([
  ...COURSES.map(([slug,title])=>["cours:"+slug,{title,url:entry=>courseUrl(slug,entry)}]),
  ...[
    ["problemes","Problèmes guidés",""],
    ["transferts","Transferts A","set=transferts&"],
    ["transferts-b","Transferts B","set=transferts&variante=b&"],
    ["transferts-c","Transferts C","set=transferts&variante=c&"]
  ].flatMap(([id,title,parameters])=>["sujets","corriges"].map(mode=>[
    id+":"+mode,{
      title:title+" · "+(mode==="sujets"?"sujets":"corrigés"),
      url:entry=>"./problems.html?"+parameters+"mode="+mode+(entry.jalon?"&jalon="+entry.jalon:"")
    }
  ]))
]);
function resumeReadingUrl(source,entry){
  return source.url(entry)+"&signet=1#"+encodeURIComponent(entry.sectionId);
}
function renderLastReading(){
  let storage;
  try{storage=window.localStorage;}catch{return;}
  const entry=readLastReading(storage),source=readingDocuments.get(entry?.documentId);
  const link=el("continueReading");
  link.hidden=!source;
  if(!source)return;
  link.href=resumeReadingUrl(source,entry);
  link.textContent="Reprendre ma lecture · "+source.title;
}
function renderStudyBookmarks(){
  let storage;
  try{storage=window.localStorage;}catch{return;}
  const list=el("studyBookmarkList"),items=document.createDocumentFragment();
  for(const [id,source] of readingDocuments){
    const entry=readBookmarkEntry(storage,id);
    if(!entry)continue;
    const link=document.createElement("a");
    link.href=resumeReadingUrl(source,entry);
    link.textContent=source.title;
    const item=document.createElement("li");item.append(link);items.append(item);
  }
  const count=items.childElementCount;
  list.replaceChildren(items);
  el("studyBookmarks").hidden=count===0;
  el("studyBookmarksTitle").textContent="Mes signets ("+count+")";
}
function buildTopicSelector() {
  for(const topic of fullTopics) {
    const option=document.createElement("option");option.value=topic.slug;option.textContent=topic.title;
    el("topic").appendChild(option);
  }
}

function startSession() {
  const mode=el("mode").value;
  const selected=requestedRevision
    ?selectRound(state,questions.filter(q=>practiceIds.has(q.id)),{mode,limit:10})
    :requestedJalon?selectJalonQuestions(state,questions,jalonIndex,requestedJalon.id,mode)
    :selectRound(state,questions,{topic:el("topic").value,mode,limit:10});
  if(!selected.length){
    notification(el("mode").value==="due"?"Aucune question à réviser actuellement dans ce chapitre. Passe en mode découverte ou reviens à la date d'échéance.":"Aucune question correspondante. Essaie un autre domaine ou mode.");
    return;
  }
  if(startSelectedSession(selected,{jalon:requestedJalon?.id})&&scopedPractice)focusCurrentQuiz();
}
function startSelectedSession(selected,{jalon}={}){
  const replaceActive=Boolean(pausedRound&&round&&round.completed<round.ids.length);
  if(replaceActive&&!confirm("Deux séances sont déjà sauvegardées. Démarrer cette séance remplacera le quiz en cours et conservera celui mis en pause. Continuer ?"))return false;
  if(!replaceActive&&!saveAnswerDraft())return false;
  try{
    const planned=buildRound(selected,state,{jalon});
    const saved=dataStore.startRound(planned.round,{replaceActive});
    clearTimeout(answerDraftTimer);
    answerDraftTimer=null;
    round=saved.round;session=planned.questions;
    roundHistory=saved.roundHistory??[];pausedRound=saved.pausedRound??null;
  }catch(err){
    if(err instanceof StaleDataError)conflictWarning();
    else notification("Impossible de sauvegarder la nouvelle séance. Vérifie le stockage du navigateur.");
    return false;
  }
  index=0;score=0;done=false;
  el("results").hidden=true;
  el("quiz").hidden=false;
  notification("");
  renderFirstStart();
  renderRoundHistory();
  renderQuestion();
  renderRecurringReviews();
  return true;
}
function startJalonSession(jalon,mode="all"){
  let selection=selectJalonQuestions(state,questions,jalonIndex,jalon,mode);
  if(!selection.length&&mode!=="all")selection=selectJalonQuestions(state,questions,jalonIndex,jalon,"all");
  if(!selection.length){notification("Aucune question disponible pour ce jalon.");return;}
  if(startSelectedSession(selection,{jalon}))el("practice-title").scrollIntoView({behavior:"smooth",block:"start"});
}
function startDiagnosticSession(){
  const selection=selectDiagnosticQuestions(state,questions,jalonIndex);
  if(!selection.length){notification("Tous les jalons ont déjà été abordés. Utilise les révisions ciblées.");return;}
  if(startSelectedSession(selection))el("practice-title").scrollIntoView({behavior:"smooth",block:"start"});
}
function resumePausedSession(){
  if(!pausedRound||!saveAnswerDraft())return;
  try{
    const saved=dataStore.resumePausedRound();
    round=saved.round;pausedRound=saved.pausedRound??null;roundHistory=saved.roundHistory??[];
  }catch(err){
    if(err instanceof StaleDataError)conflictWarning();
    else notification("Impossible de reprendre la séance mise en pause. Réessaie après avoir vérifié le stockage.");
    return;
  }
  resumeSession();
  renderFirstStart();
  renderRoundHistory();
  renderRecurringReviews();
  focusCurrentQuiz();
}

function resumeSession(){
  if(!round)return;
  try{
    session=restoreRound(round,questions);
    score=round.score;index=round.completed;done=false;
    if(index>=session.length)finish({focus:false});
    else{
      el("results").hidden=true;
      el("quiz").hidden=false;
      renderQuestion();
      notification("Séance restaurée après rechargement : questions et variantes conservées.");
    }
  }catch(err){
    notification("Cette ancienne séance ne peut pas être reconstruite. Démarre une nouvelle séance ; ta progression validée reste intacte.");
  }
}

function restoreWorkshop(){
  if(!scopedPractice||matchesPractice(round))resumeSession();
  renderPracticeResume();
}

function readAnswer(question){
  return question.type==="number"?el("answer").value:el("choiceList").querySelector("input:checked")?.value??"";
}

function saveAnswerDraft(){
  clearTimeout(answerDraftTimer);
  answerDraftTimer=null;
  const question=session[index];
  if(!round||!question||done||el("quiz").hidden||el("quiz").classList.contains("paper-mode")
    ||round.ids[round.completed]!==question.id)return true;
  const value=readAnswer(question);
  const status=el("answerDraftStatus");
  if(value===(round.draftAnswer?.value??"")){
    status.hidden=true;
    return true;
  }
  try{
    round=dataStore.updateRound({...round,draftAnswer:{questionId:question.id,value}}).round;
    status.hidden=true;
    return true;
  }catch(error){
    if(error instanceof StaleDataError)conflictWarning();
    else status.hidden=false;
    return false;
  }
}

function markGuidedQuestion(){
  if(done||!round||!session[index])return false;
  const id=session[index].id;
  hintUsed=true;
  if(round.assistedIds?.includes(id))return true;
  try{
    const saved=dataStore.updateRound({...round,assistedIds:[...(round.assistedIds??[]),id]});
    round=saved.round;
    return true;
  }catch(error){
    if(error instanceof StaleDataError)conflictWarning();
    else notification("L'aide a été consultée, mais son enregistrement a échoué. Termine ta réponse avant de quitter.");
    return false;
  }
}
function clearQuizAnswerError(){
  el("answer").removeAttribute("aria-invalid");
  el("choices").removeAttribute("aria-invalid");
  el("quizAnswerError").textContent="";
}

function renderQuestion() {
  clearTimeout(answerDraftTimer);
  answerDraftTimer=null;
  const q=session[index]; if(!q) return finish();
  const mode=notebookMode(),paperOnly=mode==="manuscrit";
  const notebook=el("quizNotebook");
  if(mode==="clavier")el("answerForm").after(notebook);
  const quiz=el("quiz");
  quiz.classList.toggle("paper-mode",paperOnly);
  el("pauseQuiz").hidden=false;
  el("paperUnknown").hidden=!paperOnly;
  done=false;hintUsed=!!round?.assistedIds?.includes(q.id);
  el("quizCount").textContent="Question "+(index+1)+" / "+session.length;
  el("quizTopic").textContent=q.topicTitle;
  el("quizProgress").max=session.length;
  el("quizProgress").value=index;
  el("questionText").textContent=q.prompt;
  renderLastCorrection(!paperOnly);
  mountNotebook(notebook,{
    context:"quiz:"+q.id,adapter:dataStore,title:mode==="clavier"?"Brouillon de calcul (facultatif)":"Ma feuille de réponse — "+q.topicTitle,
    textOnly:mode==="clavier",collapsed:true,
    paperOnly,paperPrompt:q.prompt+(q.type==="choice"?"\n\n"+q.options.map((option,i)=>(i+1)+". "+option).join("\n")+"\n\nÉcris le numéro du choix retenu sur la feuille.":"\n\nÉcris tes étapes, puis laisse une ligne vide avant le résultat."),
    onGuidance:markGuidedQuestion,onReviewSaved:renderStepReviewDashboard,
    handwrittenReview:{
      expected:q.type==="number"?fmt(q.answer):String(q.answer),
      explanation:q.explanation,
      onRevealed:markGuidedQuestion,
      onDecision:submitHandwritten,
      allowEquation:q.type==="number",
      formatRecognized:value=>{
        if(q.type!=="choice")return value.replaceAll(".",",");
        const choice=/^[1-9]$/.test(value)?q.options[Number(value)-1]:undefined;
        return choice===undefined?null:value+" — "+choice;
      },
      // Lecture géométrique locale : même correcteur objectif qu'une saisie numérique.
      // Le résultat n'est soumis qu'après confirmation visuelle par l'élève.
      onRecognized:(value,{edited=false}={})=>{
        if(done)return false;
        const selected=q.type==="choice"?(/^[1-9]$/.test(value)?q.options[Number(value)-1]:null):value;
        if(selected===null||selected===undefined)return false;
        // La saisie du résultat après retouche de transcription reste corrigée
        // objectivement, mais elle n'est pas une preuve de maîtrise sans aide.
        if(edited&&!markGuidedQuestion())return false;
        submit(selected);
        return done;
      }
    }
  });
  el("questionHelp").textContent=q.isVariant?"Exercice à valeurs variables : un autre énoncé sera proposé au prochain rappel.":"Réponds sans consulter le cours. Les étapes importantes sont dans la correction.";
  el("feedback").hidden=true;
  el("hint").textContent="";
  el("answerForm").hidden=false;el("submit").disabled=false;
  el("numericAnswer").hidden=q.type!=="number";
  el("choices").hidden=q.type!=="choice";
  el("choiceList").replaceChildren();
  const draft=round?.draftAnswer?.questionId===q.id?round.draftAnswer.value:"";
  clearQuizAnswerError();
  el("answerDraftStatus").hidden=true;
  el("answer").value=q.type==="number"?draft:"";
  if(q.type==="choice"){
    q.options.forEach((option,i)=>{
      const label=document.createElement("label");label.className="option";
      const input=document.createElement("input");input.type="radio";input.name="answerChoice";input.value=option;input.id="option-"+i;
      input.checked=option===draft;
      const text=document.createElement("span");text.textContent=option;
      label.append(input,text);el("choiceList").appendChild(label);
    });
  }
  quiz.scrollTop=0;
  const target=paperOnly?notebook.querySelector("canvas"):el("questionText");
  target?.focus({preventScroll:true});
}

function correctionText(question,{correct,kind,hinted}){
  const expected=question.type==="number"?fmt(question.answer):question.answer;
  if(kind==="manual")return {
    title:correct?"Réponse manuscrite déclarée correcte":"Réponse manuscrite à retravailler",
    text:"Auto-évaluation enregistrée : le tracé manuscrit n'a pas été reconnu par ordinateur et cette réponse n'attribue pas de maîtrise autonome.\n\nRéponse attendue : "+expected+"\n\n"+question.explanation
  };
  return {
    title:correct?(hinted?"Bonne réponse avec indice (non validée pour la maîtrise)":"Bonne réponse"):"À retravailler",
    text:(correct?"":(kind==="unknown"?"Réponse à connaître : ":"Réponse attendue : ")+expected+"\n\n")+question.explanation
  };
}

function correctionBody(question,record){
  const content=el("correctionBody").content.cloneNode(true);
  const {title,text}=correctionText(question,record);
  content.querySelector(".correction-question").textContent=question.prompt;
  content.querySelector(".correction-verdict").textContent=title;
  content.querySelector(".correction-text").textContent=text;
  const answer=content.querySelector(".correction-answer");
  answer.hidden=!record.answer;
  answer.textContent="Ta réponse · "+(record.answer??"");
  content.querySelector(".correction-lesson").href=courseUrl(question.lesson);
  return content;
}

function renderLastCorrection(visible){
  const panel=el("lastCorrection");
  const record=round?.corrections?.at(-1);
  const question=record&&session[round.completed-1];
  panel.open=false;
  panel.hidden=!visible||!question||question.id!==record.questionId;
  if(!panel.hidden)panel.querySelector(".correction-body").replaceChildren(correctionBody(question,record));
}

function correctionRows(savedRound,selection){
  return (savedRound?.corrections??[]).map(record=>{
    const ordinal=savedRound.ids.indexOf(record.questionId);
    return {record,ordinal,question:selection[ordinal],retry:!record.correct||record.hinted};
  }).sort((a,b)=>Number(b.retry)-Number(a.retry));
}

function renderResultsCorrections(){
  const rows=correctionRows(round,session);
  el("resultsCorrections").hidden=!rows.length;
  const count=el("resultsCorrectionsCount");
  count.hidden=!rows.length||rows.length===round.completed;
  if(!count.hidden)count.textContent=rows.length+" correction(s) disponible(s) sur "+round.completed+" réponses.";
  const retryIds=new Set(rows.filter(row=>row.retry).map(row=>row.record.questionId));
  const retry=el("retryCorrections");
  retry.hidden=!retryIds.size;
  retry.textContent=retryIds.size===1?"Refaire la question à retravailler":"Refaire les "+retryIds.size+" questions à retravailler";
  retry.onclick=()=>{
    const selection=questions.filter(question=>retryIds.has(question.id));
    if(startSelectedSession(selection,{jalon:round.jalon}))focusCurrentQuiz();
  };
  renderCorrectionRows(el("resultsCorrectionList"),rows);
}

function renderCorrectionRows(list,rows){
  list.replaceChildren();
  for(const {record,ordinal,question,retry} of rows){
    const item=document.createElement("details");
    item.className="math-notebook-disclosure";
    const summary=document.createElement("summary");
    const status=!record.correct?"À retravailler":retry?"Réussie avec aide":"Réussie";
    summary.textContent="Question "+(ordinal+1)+" · "+question.topicTitle+" · "+status;
    item.append(summary,correctionBody(question,record));
    list.append(item);
  }
}

function renderRoundHistory(){
  const history=el("quizHistory"),list=el("quizHistoryList");
  history.hidden=!roundHistory.length;
  el("quizHistoryLink").hidden=history.hidden;
  list.replaceChildren();
  for(const saved of [...roundHistory].reverse()){
    const item=document.createElement("details");
    item.className="math-notebook-disclosure";
    const summary=document.createElement("summary");
    const date=new Date(saved.startedAt).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"});
    summary.textContent=date+" · "+saved.score+"/"+saved.ids.length;
    const body=document.createElement("div");
    item.append(summary,body);
    item.addEventListener("toggle",()=>{
      if(!item.open||body.childNodes.length)return;
      try{
        const rows=correctionRows(saved,restoreRound(saved,questions));
        if(rows.length)renderCorrectionRows(body,rows);
        else body.textContent="Les corrections de cette séance n’étaient pas encore enregistrées.";
      }catch{body.textContent="Les énoncés de cette séance ne sont plus disponibles.";}
    });
    list.append(item);
  }
}

function renderRecurringReviews(){
  const panel=el("recurringReviews"),link=el("recurringReviewsLink"),list=el("recurringReviewChapters");
  const selected=recurringErrors(state,questions);
  panel.hidden=!selected.length;
  link.hidden=panel.hidden;
  list.replaceChildren();
  if(panel.hidden)return;

  const start=el("startRecurringReviews");
  const active=round&&round.completed<round.ids.length;
  const label=active&&pausedRound?"Remplacer le quiz en cours et réviser"
    :active?"Mettre le quiz en pause et réviser":"Réviser mes erreurs récurrentes";
  const run=group=>{
    if(startSelectedSession(group.slice(0,10)))focusCurrentQuiz();
  };
  start.textContent=label;
  start.onclick=()=>run(selected);
  el("recurringReviewsCount").textContent=selected.length+(selected.length===1
    ?" question manquée ou passée au moins deux fois, à confirmer."
    :" questions manquées ou passées au moins deux fois, à confirmer.");

  const corrections=new Map();
  for(const saved of [round,...[...roundHistory].reverse()]){
    for(const record of saved?.corrections??[]){
      if(!record.correct&&!corrections.has(record.questionId))corrections.set(record.questionId,{saved,record});
    }
  }
  const recovered=new Map();
  const chapters=new Map();
  for(const question of selected){
    if(!chapters.has(question.topic))chapters.set(question.topic,[]);
    chapters.get(question.topic).push(question);
  }
  for(const group of chapters.values()){
    const [first]=group;
    const chapter=document.createElement("details");
    chapter.className="math-notebook-disclosure";
    const summary=document.createElement("summary");
    summary.textContent=first.topicTitle+" · "+group.length+(group.length===1?" question":" questions");
    const course=document.createElement("a");
    course.href=courseUrl(first.lesson);
    course.textContent="Revoir le cours";
    const practice=document.createElement("button");
    practice.type="button";
    practice.className="subtle";
    practice.textContent=active?(pausedRound?"Remplacer le quiz et réviser ce chapitre":"Mettre le quiz en pause et réviser ce chapitre")
      :"Réviser les erreurs de ce chapitre";
    practice.addEventListener("click",()=>run(group));
    const actions=document.createElement("div");
    actions.className="path-buttons";
    actions.append(course,practice);
    chapter.append(summary,actions);
    for(const question of group){
      const misses=state.items[question.id].wrong;
      const label=(question.prompt??"Exercice à valeurs variables")+" · "+misses+" fois";
      const previous=corrections.get(question.id);
      if(!previous){
        const note=document.createElement("p");
        note.textContent=label;
        chapter.append(note);
        continue;
      }
      const detail=document.createElement("details");
      detail.className="math-notebook-disclosure";
      const name=document.createElement("summary");
      name.textContent=label;
      detail.append(name);
      detail.addEventListener("toggle",()=>{
        if(!detail.open||detail.childElementCount>1)return;
        const {saved,record}=previous;
        if(!recovered.has(saved))recovered.set(saved,restoreRound(saved,questions));
        const exercise=recovered.get(saved)[saved.ids.indexOf(record.questionId)];
        detail.append(correctionBody(exercise,record));
      });
      chapter.append(detail);
    }
    list.append(chapter);
  }
}

function showFeedback(record) {
  const q=session[index];
  const {title,text}=correctionText(q,record);
  el("lastCorrection").hidden=true;
  el("paperUnknown").hidden=true;
  el("feedback").hidden=false;el("feedback").dataset.result=record.correct?"correct":"wrong";
  el("feedbackTitle").textContent=title;
  el("feedbackText").textContent=text;
  el("hint").textContent="";
  el("lessonLink").href=courseUrl(q.lesson);
  el("answerForm").hidden=true;
  el("next").textContent=index===session.length-1?"Terminer la séance":"Question suivante";
  (el("quiz").classList.contains("paper-mode")?el("next"):el("feedbackTitle")).focus();
}

function submitHandwritten(correct){
  if(done||!round||!session[index])return false;
  // Dès que le corrigé est révélé, la réponse manuscrite est auto-évaluée
  // et ne constitue jamais une preuve de maîtrise autonome.
  if(!markGuidedQuestion())return false;
  const q=session[index];
  const next=recordAnswer(state,q.id,Boolean(correct),Date.now(),{
    signature:q.isVariant?q.prompt:null,hinted:true
  });
  if(!persist(next,advanceRound(round,Boolean(correct),{kind:"manual",hinted:true})))return false;
  done=true;hintUsed=true;score=round.score;notification("");
  refreshOverview();
  showFeedback(round.corrections.at(-1));
  return true;
}

function submit(raw,unknown=false) {
  if(done) return;
  const q=session[index];
  const grade=unknown?{valid:true,correct:false}:gradeAnswer(q,raw);
  if(!grade.valid){
    if(el("quiz").classList.contains("paper-mode"))notification(grade.message);
    else{
      el(q.type==="number"?"answer":"choices").setAttribute("aria-invalid","true");
      el("quizAnswerError").textContent=grade.message;
    }
    return;
  }
  const next=recordAnswer(state,q.id,grade.correct,Date.now(),{signature:q.isVariant?q.prompt:null,hinted:hintUsed});
  if(!persist(next,advanceRound(round,grade.correct,{kind:unknown?"unknown":"answered",hinted:hintUsed,answer:raw})))return;
  done=true;notification("");
  score=round.score;
  refreshOverview();
  showFeedback(round.corrections.at(-1));
}

function finish({focus=true}={}){
  el("quiz").hidden=true;
  el("results").hidden=false;
  renderResultsCorrections();
  el("resultsText").textContent="Tu as réussi "+score+" réponse"+(score>1?"s":"")+" sur "+session.length+". Les rappels à valeurs variables et sans indice consolident les acquis. Une aide n’augmente pas la maîtrise.";
  const next=recommendJalon(jalonProgress(state,questions,jalonIndex));
  const completed=JALONS.find(item=>item.id===round?.jalon);
  const sameJalon=el("resultsTransfer");
  sameJalon.hidden=true;
  if(completed&&session.every(question=>jalonIndex.get(completed.id).has(question.id))){
    sameJalon.href=transferUrl(completed.id);
    sameJalon.textContent="Faire le problème de transfert du jalon "+completed.id;
    sameJalon.hidden=false;
  }
  const heading=el("resultsNextTitle"),actions=el("resultsNextActions");
  heading.textContent=next?"Jalon conseillé · "+next.id+" — "+next.title:"Passer à un examen blanc";
  if(next)actions.replaceChildren(jalonActions(next,{showTransfer:sameJalon.hidden||next.id!==completed.id}));
  else{
    const exam=document.createElement("a");exam.href="#exam-title";exam.textContent="Voir les examens blancs";
    actions.replaceChildren(exam);
  }
  if(focus)el("resultsTitle").focus();
  refreshOverview();
}

function exportProgress(){
  const draftSaved=saveAnswerDraft();
  let snapshot;
  try{snapshot=dataStore.snapshot();}
  catch(err){if(err instanceof StaleDataError)conflictWarning();else notification("Impossible de lire la sauvegarde actuelle.");return;}
  const backup={backupVersion:1,practice:snapshot.practice,exams:snapshot.exams,round:snapshot.round,roundHistory:snapshot.roundHistory,pausedRound:snapshot.pausedRound,transfers:snapshot.transfers,workbook:snapshot.workbook};
  const blob=new Blob([JSON.stringify(backup)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="daeu-b-progression-"+new Date().toISOString().slice(0,10)+".json";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  notification(draftSaved?"Sauvegarde préparée. Garde le fichier JSON en lieu sûr pour changer d'appareil."
    :"Sauvegarde préparée avec les dernières données enregistrées. La saisie encore visible dans le quiz n’a pas pu être incluse.");
}

async function importProgress(file) {
  if(!file) return;
  if(file.size>8_000_000){notification("Sauvegarde refusée : fichier trop volumineux.");return;}
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
    const updated=dataStore.replaceAll(imported,importedExams??prior.exams,bundled?raw.round??null:null,
      importedTransfers,importedWorkbook,bundled?raw.roundHistory:prior.roundHistory,bundled?raw.pausedRound:null);
    state=updated.practice;round=updated.round;transfers=updated.transfers;roundHistory=updated.roundHistory??[];
    pausedRound=updated.pausedRound??null;
    renderRoundHistory();
    restoreExamBackup(updated.exams);
    el("quiz").hidden=true;el("results").hidden=true;session=[];
    refreshOverview();restoreWorkshop();
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
if(hasTopic)el("topic").value=requestedTopic;
if(hasTopic||requestedJalon){
  const requestedMode=practiceParams.get("mode");
  if(["due","wrong"].includes(requestedMode))el("mode").value=requestedMode;
}
if(requestedRevision){
  el("practice-title").textContent="Révision ciblée — "+requestedRevision.title;
  el("topic").closest(".field").hidden=true;
  el("practiceAll").hidden=false;
  el("start").textContent="Démarrer · "+practiceIds.size+" exercices ciblés";
  el("restart").textContent="Nouvelle séance ciblée";
}else if(requestedJalon){
  el("practice-title").textContent="Jalon "+requestedJalon.id+" — "+requestedJalon.title;
  el("topic").closest(".field").hidden=true;
  el("practiceAll").hidden=false;
  el("start").textContent="Démarrer ce jalon";
  el("restart").textContent="Nouvelle séance sur ce jalon";
}
renderCourseLibrary();
renderLastReading();
renderStudyBookmarks();
renderRoundHistory();
refreshOverview();
initExams(dataStore,conflictWarning);
restoreWorkshop();
renderFirstStart();
el("firstStart").addEventListener("click",firstStart);
el("practiceResumeTarget").addEventListener("click",()=>{
  if(matchesPractice(round)&&round.completed<round.ids.length)resumeCurrentSession();
  else if(matchesPractice(pausedRound))resumePausedSession();
});
for(const id of ["resumePausedRound","resumeFromResults"])el(id).addEventListener("click",resumePausedSession);
el("quizHistoryLink").addEventListener("click",()=>{el("quizHistory").open=true;});
el("pauseQuiz").addEventListener("click",()=>{
  if(done&&index+1===session.length){finish();return;}
  if(!saveAnswerDraft())return;
  el("quiz").hidden=true;
  renderFirstStart();
  el("firstStart").focus({preventScroll:true});
  el("firstStart").scrollIntoView({block:"center",behavior:"instant"});
});
el("start").addEventListener("click",startSession);
el("diagnosticStart").addEventListener("click",startDiagnosticSession);
el("restart").addEventListener("click",startSession);
el("answer").maxLength=MAX_ANSWER_DRAFT_LENGTH;
el("answer").addEventListener("input",()=>{
  clearQuizAnswerError();
  clearTimeout(answerDraftTimer);
  answerDraftTimer=setTimeout(saveAnswerDraft,250);
});
el("choiceList").addEventListener("change",()=>{
  clearQuizAnswerError();
  saveAnswerDraft();
});
el("answerForm").addEventListener("submit",evt=>{
  evt.preventDefault();
  submit(readAnswer(session[index]));
});
for(const id of ["unknownButton","paperUnknown"])el(id).addEventListener("click",()=>submit(null,true));
el("hintButton").addEventListener("click",()=>{
  if(done)return;markGuidedQuestion();el("hint").textContent=session[index].hint;
});
el("next").addEventListener("click",()=>{index++;renderQuestion();focusCurrentQuiz();});
el("export").addEventListener("click",exportProgress);
el("importFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];await importProgress(file);event.target.value="";
});
el("importFile").disabled=false;
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
    state=fresh.practice;round=null;transfers=fresh.transfers;roundHistory=[];pausedRound=null;
    clearExamProgress();renderRoundHistory();
    session=[];el("quiz").hidden=true;el("results").hidden=true;
    refreshOverview();
    notification("Progression et copies remises à zéro.");
  }catch(err){
    if(err instanceof StaleDataError)conflictWarning();
    else notification("Réinitialisation annulée : sauvegarde impossible. Aucune donnée existante effacée.");
  }
});
el("syncReload").addEventListener("click",()=>location.reload());
function refreshSchedule(){
  if(dataStore.isStale())conflictWarning();
  else refreshOverview();
}
document.addEventListener("visibilitychange",()=>{
  if(document.hidden)saveAnswerDraft();
  else refreshSchedule();
});
window.addEventListener("pagehide",saveAnswerDraft);
document.addEventListener("daeu:before-update",event=>{
  if(!saveAnswerDraft())event.preventDefault();
});
window.addEventListener("pageshow",event=>{
  if(event.persisted){refreshSchedule();renderLastReading();renderStudyBookmarks();}
});
window.addEventListener("storage",event=>{
  if((event.key===DATA_KEY||event.key===null)&&dataStore.isStale())conflictWarning();
  if(event.key===null||event.key===LAST_READING_KEY)renderLastReading();
  if(event.key===null||event.key.startsWith(BOOKMARK_PREFIX))renderStudyBookmarks();
});
