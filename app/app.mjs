import {TOPICS} from "./questions.mjs";
import {flatten,validateTopics,gradeAnswer,emptyState,sanitizeState,recordAnswer,getMetrics,selectRound} from "./engine.mjs";

const STORAGE_KEY="daeu-b-maths-progress-v2";
const LESSONS="https://github.com/dbrckk/Daeu-b/blob/main/maths/";
const questions=flatten(TOPICS);
const knownIds=new Set(questions.map(q=>q.id));
const errors=validateTopics(TOPICS);
if(errors.length) throw new Error("Corpus invalide : "+errors.join("; "));

const el=id=>document.getElementById(id);
let state=emptyState(),session=[],index=0,score=0,done=false;
let storageWorks=true;

function notification(message) {
  const target=el("notification"); target.textContent=message; target.hidden=!message;
}

try {
  const raw=localStorage.getItem(STORAGE_KEY);
  if(raw) state=sanitizeState(JSON.parse(raw),knownIds);
} catch(err) {
  storageWorks=false;
  notification("Stockage local indisponible ou sauvegarde incompatible : la séance reste utilisable, mais le suivi risque de ne pas être conservé. Exporte tes résultats si possible.");
}

function persist() {
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageWorks=true;}
  catch(err) {storageWorks=false;notification("Impossible d'enregistrer la progression sur cet appareil. Vérifie les paramètres de stockage du navigateur.");}
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
  for(const topic of TOPICS){
    const card=document.createElement("article");card.className="topic-card";
    const count=topic.questions.length;
    const completed=topic.questions.filter(q=>Boolean(state.items?.[q.id]?.confirmed)).length;
    const mark=document.createElement("div");mark.className="mark";mark.textContent=completed+"/"+count+" acquis";
    const title=document.createElement("h3");title.textContent=topic.title;
    const body=document.createElement("p");
    body.textContent="Jalon"+(topic.jalons.length>1?"s ":" ")+topic.jalons.join(", ")+" · "+count+" questions";
    const link=document.createElement("a");link.href=LESSONS+encodeURIComponent(topic.lesson);
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

function buildTopicSelector() {
  for(const topic of TOPICS) {
    const option=document.createElement("option");option.value=topic.slug;option.textContent=topic.title;
    el("topic").appendChild(option);
  }
}

function startSession() {
  session=selectRound(state,questions,{topic:el("topic").value,mode:el("mode").value,limit:10});
  index=0;score=0;done=false;
  el("results").hidden=true;
  el("quiz").hidden=true;
  notification("");
  if(!session.length){
    notification(el("mode").value==="due"?"Aucune question à réviser actuellement dans ce chapitre. Passe en mode découverte ou reviens à la date d'échéance.":"Aucune question correspondante. Essaie un autre domaine ou mode.");
    return;
  }
  el("quiz").hidden=false;
  renderQuestion();
}

function renderQuestion() {
  const q=session[index]; if(!q) return finish();
  done=false;
  el("quizCount").textContent="Question "+(index+1)+" / "+session.length;
  el("quizTopic").textContent=q.topicTitle;
  el("quizProgress").max=session.length;
  el("quizProgress").value=index;
  el("questionText").textContent=q.prompt;
  el("questionHelp").textContent="Réponds sans consulter le cours. Les étapes importantes sont dans la correction.";
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
  el("feedbackTitle").textContent=correct?"Bonne réponse":"À retravailler";
  const expected=q.type==="number"?fmt(q.answer):q.answer;
  el("feedbackText").textContent=(correct?"":(wasUnknown?"Réponse à connaître : ":"Réponse attendue : ")+expected+"\n\n")+q.explanation;
  el("lessonLink").href=LESSONS+encodeURIComponent(q.lesson);
  el("answerForm").hidden=true;
  el("next").textContent=index===session.length-1?"Terminer la séance":"Question suivante";
  el("next").focus();
}

function submit(raw,unknown=false) {
  if(done) return;
  const q=session[index];
  const grade=unknown?{valid:true,correct:false}:gradeAnswer(q,raw);
  if(!grade.valid){notification(grade.message);return;}
  done=true;notification("");
  if(grade.correct)score++;
  state=recordAnswer(state,q.id,grade.correct);
  persist();refreshOverview();
  showFeedback(grade.correct,unknown);
}

function finish(){
  el("quiz").hidden=true;
  el("results").hidden=false;
  el("resultsText").textContent="Tu as réussi "+score+" réponse"+(score>1?"s":"")+" sur "+session.length+". Les réponses incorrectes sont enregistrées pour la révision. Pour confirmer un acquis, réponds juste à nouveau un autre jour.";
  el("restart").focus();
  refreshOverview();
}

function exportProgress(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
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
    const imported=sanitizeState(raw,knownIds);
    const importedCount=Object.keys(imported.items).length;
    if(!confirm("Importer "+importedCount+" résultat(s) ? Cela remplace la progression de cet appareil.")) return;
    state=imported; persist(); refreshOverview();
    notification("Sauvegarde importée : "+importedCount+" résultat(s) reconnus.");
  }catch(err){notification("Import impossible : fichier JSON non compatible avec cette version du suivi.");}
}

buildTopicSelector();
refreshOverview();
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
  if(done)return;el("hint").hidden=false;el("hint").textContent=session[index].hint;
});
el("next").addEventListener("click",()=>{index++;renderQuestion();});
el("export").addEventListener("click",exportProgress);
el("importFile").addEventListener("change",async event=>{
  const file=event.target.files?.[0];await importProgress(file);event.target.value="";
});
el("reset").addEventListener("click",()=>{
  if(!confirm("Effacer tous les résultats enregistrés sur cet appareil ? Pense à exporter d'abord."))return;
  state=emptyState();persist();refreshOverview();session=[];el("quiz").hidden=true;el("results").hidden=true;
  notification("Progression remise à zéro.");
});
if("serviceWorker" in navigator&&location.protocol==="https:"){
  navigator.serviceWorker.register("./sw.js").catch(()=>{/* mode en ligne reste fonctionnel */});
}