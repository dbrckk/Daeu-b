import {TOPICS} from "./questions.mjs";
import {mountNotebook,notebookMode} from "./math-notebook.mjs";
import {backedStorage,onAutoBackupStatus} from "./auto-backup.mjs";
import {COURSES,courseUrl} from "./course-catalog.mjs";
import {initExams,getExamBackup,restoreExamBackup,clearExamProgress} from "./exam-ui.mjs";
import {sanitizeExamStore,emptyExamStore} from "./exam-engine.mjs";
import {sanitizeWorkbook,emptyWorkbook} from "./workbook.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY,StaleDataError} from "./persistence.mjs";
import {VARIANTS,injectVariants,validateVariants} from "./variants.mjs";
import {buildRound,restoreRound,advanceRound,MAX_ANSWER_DRAFT_LENGTH} from "./round.mjs";
import {flatten,validateTopics,gradeAnswer,emptyState,sanitizeState,recordAnswer,getMetrics,selectRound} from "./engine.mjs";
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

const el=id=>document.getElementById(id);
const transferUrl=(id,series=recommendedTransferSeries(transferStatus(transfers,id)))=>
  "./problems.html?set=transferts&jalon="+id+(series==="a"?"":"&variante="+series);
let state=emptyState(),session=[],index=0,score=0,done=false,hintUsed=false,round=null,transfers=emptyTransferStore();
let dataStore=null,answerDraftTimer=null;
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
function firstAction(metrics){
  if(round&&round.completed<round.ids.length)return {kind:"resume"};
  if(metrics.due)return {kind:"due"};
  const rows=jalonProgress(state,questions,jalonIndex);
  if(rows.some(row=>!row.attempted))return {kind:"diagnostic"};
  const next=recommendJalon(rows);
  return next?{kind:"jalon",next}:{kind:"exam"};
}

function renderFirstStart(metrics=getMetrics(state,questions)){
  const {kind,next}=firstAction(metrics);
  const cards={
    resume:["Reprendre ma séance","Retrouve ta progression jusqu’à la dernière réponse validée.","Reprendre ma séance en cours"],
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
  const status=metrics.due===1?"1 question à réviser":metrics.due+" questions à réviser";
  el("firstStatus").textContent=metrics.attempted
    ?metrics.attempted+" question(s) déjà travaillée(s) · "+status+"."
    :kind==="resume"?"Une séance est sauvegardée sur cet appareil."
    :"Tu n’as encore effectué aucun exercice. Le repérage initial est le meilleur point de départ.";
}

function focusCurrentQuiz(){
  const quiz=el("quiz");
  if(quiz.hidden||quiz.classList.contains("paper-mode"))return;
  const target=done?el("next"):el("questionText");
  target.focus({preventScroll:true});
  (done?el("feedback"):quiz).scrollIntoView({block:"start",behavior:"instant"});
}

function firstStart(){
  const now=Date.now();
  const {kind,next}=firstAction(getMetrics(state,questions,now));
  switch(kind){
    case "resume":
      if(el("quiz").hidden)resumeSession();
      focusCurrentQuiz();
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
function buildTopicSelector() {
  for(const topic of fullTopics) {
    const option=document.createElement("option");option.value=topic.slug;option.textContent=topic.title;
    el("topic").appendChild(option);
  }
}

function startSession() {
  const mode=el("mode").value;
  const selected=requestedJalon
    ?selectJalonQuestions(state,questions,jalonIndex,requestedJalon.id,mode)
    :selectRound(state,questions,{topic:el("topic").value,mode,limit:10});
  if(!selected.length){
    notification(el("mode").value==="due"?"Aucune question à réviser actuellement dans ce chapitre. Passe en mode découverte ou reviens à la date d'échéance.":"Aucune question correspondante. Essaie un autre domaine ou mode.");
    return;
  }
  startSelectedSession(selected,{jalon:requestedJalon?.id});
}
function startSelectedSession(selected,{jalon}={}){
  try{
    const planned=buildRound(selected,state,{jalon});
    const saved=dataStore.updateRound(planned.round);
    round=saved.round;session=planned.questions;
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
  renderQuestion();
  return true;
}
function startJalonSession(jalon,mode="all"){
  let selection=selectJalonQuestions(state,questions,jalonIndex,jalon,mode);
  if(!selection.length&&mode!=="all")selection=selectJalonQuestions(state,questions,jalonIndex,jalon,"all");
  if(!selection.length){notification("Aucune question disponible pour ce jalon.");return;}
  startSelectedSession(selection,{jalon});
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
    if(index>=session.length)finish({focus:false});
    else{
      el("quiz").hidden=false;
      renderQuestion();
      notification("Séance restaurée après rechargement : questions et variantes conservées.");
    }
  }catch(err){
    notification("Cette ancienne séance ne peut pas être reconstruite. Démarre une nouvelle séance ; ta progression validée reste intacte.");
  }
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
    onGuidance:markGuidedQuestion,
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
  el("feedback").hidden=true;el("hint").hidden=true;
  el("hint").textContent="";
  el("answerForm").hidden=false;el("submit").disabled=false;
  el("numericAnswer").hidden=q.type!=="number";
  el("choices").hidden=q.type!=="choice";
  el("choiceList").replaceChildren();
  const draft=round?.draftAnswer?.questionId===q.id?round.draftAnswer.value:"";
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
    (el("choiceList").querySelector("input:checked")??el("choiceList").querySelector("input"))?.focus();
  } else {
    quiz.scrollTop=0;
    const target=mode==="clavier"?el("questionText"):notebook.querySelector("canvas");
    target?.focus({preventScroll:true});
  }
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

function renderResultsCorrections(){
  const rows=(round?.corrections??[]).map(record=>{
    const ordinal=round.ids.indexOf(record.questionId);
    return {record,ordinal,question:session[ordinal],retry:!record.correct||record.hinted};
  });
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
  const list=el("resultsCorrectionList");
  list.replaceChildren();
  rows.sort((a,b)=>Number(b.retry)-Number(a.retry));
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

function showFeedback(record) {
  const q=session[index];
  const {title,text}=correctionText(q,record);
  el("lastCorrection").hidden=true;
  el("paperUnknown").hidden=true;
  el("feedback").hidden=false;el("feedback").dataset.result=record.correct?"correct":"wrong";
  el("feedbackTitle").textContent=title;
  el("feedbackText").textContent=text;
  el("lessonLink").href=courseUrl(q.lesson);
  el("answerForm").hidden=true;
  el("next").textContent=index===session.length-1?"Terminer la séance":"Question suivante";
  el("next").focus();
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
  if(!grade.valid){notification(grade.message);return;}
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
  let snapshot;
  try{snapshot=dataStore.snapshot();}
  catch(err){if(err instanceof StaleDataError)conflictWarning();else notification("Impossible de lire la sauvegarde actuelle.");return;}
  const backup={backupVersion:1,practice:snapshot.practice,exams:snapshot.exams,round:snapshot.round,transfers:snapshot.transfers,workbook:snapshot.workbook};
  const blob=new Blob([JSON.stringify(backup)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="daeu-b-progression-"+new Date().toISOString().slice(0,10)+".json";
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  notification("Sauvegarde préparée. Garde le fichier JSON en lieu sûr pour changer d'appareil.");
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
const requestedJalon=JALONS.find(item=>String(item.id)===practiceParams.get("jalon"));
const hasTopic=fullTopics.some(topic=>topic.slug===requestedTopic);
if(hasTopic)el("topic").value=requestedTopic;
if(hasTopic||requestedJalon){
  const requestedMode=practiceParams.get("mode");
  if(["due","wrong"].includes(requestedMode))el("mode").value=requestedMode;
}
if(requestedJalon){
  el("practice-title").textContent="Jalon "+requestedJalon.id+" — "+requestedJalon.title;
  el("topic").closest(".field").hidden=true;
  el("practiceAll").hidden=false;
  el("start").textContent="Démarrer ce jalon";
  el("restart").textContent="Nouvelle séance sur ce jalon";
}
renderCourseLibrary();
refreshOverview();
initExams(dataStore,conflictWarning);
resumeSession();
renderFirstStart();
el("firstStart").addEventListener("click",firstStart);
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
  clearTimeout(answerDraftTimer);
  answerDraftTimer=setTimeout(saveAnswerDraft,250);
});
el("choiceList").addEventListener("change",saveAnswerDraft);
el("answerForm").addEventListener("submit",evt=>{
  evt.preventDefault();
  submit(readAnswer(session[index]));
});
for(const id of ["unknownButton","paperUnknown"])el(id).addEventListener("click",()=>submit(null,true));
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
window.addEventListener("pageshow",event=>{
  if(event.persisted)refreshSchedule();
});
window.addEventListener("storage",event=>{
  if((event.key===DATA_KEY||event.key===null)&&dataStore.isStale())conflictWarning();
});
