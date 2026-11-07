import {EXAMS} from "./exams.mjs";
import {GENERATED_EXAM_ID} from "./exam-generator.mjs";
import {getRubric,rubricForSection,countChecks} from "./reasoning.mjs";
import {analyzeExamHistory} from "./exam-analytics.mjs";
import {findExam,startExam,hasExpired,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,sanitizeExamStore,addHistory,updateReviewCheck} from "./exam-engine.mjs";
import {StaleDataError} from "./persistence.mjs";

const EXAM_LESSONS={
  "a-analyse":[["Second degré","04-second-degre.md"],["Dérivation","06-derivation.md"]],
  "a-suites":[["Suites","10-suites.md"],["Logarithmes","09-exponentielle-logarithme.md"]],
  "a-probas":[["Probabilités","12-probabilites.md"]],
  "a-integrales":[["Primitives et intégrales","15-primitives-integrales.md"],["Logarithmes","09-exponentielle-logarithme.md"]],
  "b-fonction":[["Fonctions","05-fonctions.md"],["Dérivation","06-derivation.md"],["Limites","07-limites-asymptotes.md"]],
  "b-systeme":[["Équations et systèmes","03-equations-inequations-systemes.md"]],
  "b-stats":[["Statistiques","11-statistiques.md"]],
  "b-expo":[["Continuité et TVI","08-continuite-tvi.md"],["Exponentielle","09-exponentielle-logarithme.md"]],
  "c-optimisation":[["Second degré","04-second-degre.md"],["Dérivation","06-derivation.md"]],
  "c-suites":[["Suites","10-suites.md"],["Logarithmes","09-exponentielle-logarithme.md"]],
  "c-probabilites":[["Probabilités","12-probabilites.md"]],
  "c-integrales":[["Calcul intégral","15-primitives-integrales.md"]]
};
const byId=id=>document.getElementById(id);
let store=emptyExamStore(),timer=null,lastResult=null;
let initialized=false,adapter=null,onStale=()=>{};
function alertExam(message){
  const node=byId("examNotice");node.textContent=message;node.hidden=!message;
}
function persist(){
  try{
    store=adapter.updateExams(store).exams;
    return true;
  }catch(error){
    if(error instanceof StaleDataError)onStale();
    else alertExam("Impossible d'enregistrer la copie : quota saturé ou accès au stockage refusé. Aucune ancienne copie écrasée.");
    return false;
  }
}
// N'appliquer une modification en mémoire que si son écriture a réussi.
// Sinon, restaurer la copie enregistrée et afficher son contenu exact.
function commitExam(next){
  const previous=store;
  store=next;
  if(persist())return true;
  store=previous;
  return false;
}
function load(){
  store=adapter.snapshot().exams;
}
function element(tag,cls,content){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(content!==undefined)node.textContent=content;
  return node;
}
function setVisible(id,show){byId(id).hidden=!show;}
function setTimer(){
  if(timer!==null)clearInterval(timer);
  timer=setInterval(tick,1000);
}
function tick(){
  if(!store.active){byId("examTimer").textContent="03:00:00";return;}
  if(hasExpired(store.active)){
    finalize("timeout");return;
  }
  const seconds=Math.ceil((store.active.deadlineAt-Date.now())/1000);
  const h=Math.floor(seconds/3600).toString().padStart(2,"0");
  const m=Math.floor((seconds%3600)/60).toString().padStart(2,"0");
  const s=(seconds%60).toString().padStart(2,"0");
  byId("examTimer").textContent=h+":"+m+":"+s;
}

function renderAnalytics(){
  const container=byId("examAnalytics");container.replaceChildren();
  const report=analyzeExamHistory(store.history);
  if(!report.attempts){
    container.append(element("p","helper","Le diagnostic par compétence apparaîtra après un premier examen terminé."));
    return;
  }
  container.append(element("p","exam-analytics-intro",report.attempts+" copie(s) · moyenne "+String(report.average).replace(".",",")+"/20 · dernière note "+report.latestScore+"/20"));
  if(report.change!==null){
    const message=report.change===0?"Même note que sur la copie précédente.":"Écart avec la copie précédente : "+(report.change>0?"+":"")+report.change+" point(s).";
    container.append(element("p","helper",message));
  }
  if(report.repeatedSubjects)container.append(element("p","exam-warning","Certains sujets ont été refaits. Une note plus élevée peut provenir de la mémorisation des solutions : il faut aussi réussir des problèmes inédits."));
  if(!report.weaknesses.length){
    container.append(element("p","helper","Aucune erreur objective dans les questions corrigées. Contrôle néanmoins les démonstrations écrites."));
    return;
  }
  container.append(element("h4","","Notions à consolider d'abord"));
  const list=element("ol","exam-weakness-list");
  for(const item of report.weaknesses.slice(0,5)){
    const li=element("li");
    li.append(element("strong","",item.skill+" : "+item.lost+"/"+item.points+" point(s) perdu(s)"));
    if(item.lesson){
      const link=element("a","","Revoir le cours ↗");
      link.href="https://github.com/dbrckk/Daeu-b/blob/main/maths/"+item.lesson;
      link.target="_blank";link.rel="noopener noreferrer";
      li.append(link);
    }
    list.append(li);
  }
  container.append(list,element("p","helper","Diagnostic des réponses objectives des 12 dernières copies au maximum, distinct de l'évaluation de la rédaction."));
}

function renderHistory(){
  const container=byId("examHistory");
  container.replaceChildren();
  if(!store.history.length){container.append(element("p","helper","Aucun examen terminé pour le moment."));renderAnalytics();return;}
  for(const result of [...store.history].reverse()){
    const row=element("div","exam-history-row");
    const label=element("span","",result.title+" · "+new Date(result.finishedAt).toLocaleDateString("fr-FR")+" · "+result.score+"/20");
    const open=element("button","subtle small","Voir la correction");
    open.type="button";
    open.addEventListener("click",()=>{lastResult=result;showResult(result);byId("exam-title").scrollIntoView({behavior:"smooth",block:"start"});});
    row.append(label,open);container.append(row);
  }
  renderAnalytics();
}
function renderExamSection(){
  const session=store.active;
  if(!session)return;
  const exam=findExam(session.examId,session.seed??null);
  const section=exam.sections[session.sectionIndex];
  byId("examPosition").textContent="Exercice "+(session.sectionIndex+1)+" sur 4 · 5 points";
  byId("examSectionTitle").textContent=section.title;
  byId("examContext").textContent=section.context;
  const form=byId("examQuestions");form.replaceChildren();
  section.questions.forEach((q,i)=>{
    const field=element("fieldset","exam-question");
    const legend=element("legend","","Question "+(i+1)+" · "+q.points+" point"+(q.points>1?"s":""));
    field.append(legend);
    const label=element("p","exam-prompt",q.prompt);
    field.append(label);
    if(q.type==="number"){
      const input=element("input","exam-input");
      input.type="text";input.inputMode="decimal";input.placeholder="Nombre, fraction ou décimal";input.autocomplete="off";
      input.maxLength=200;input.value=session.answers[q.id]||"";
      input.setAttribute("aria-label",q.prompt);
      input.addEventListener("input",()=>{
        if(hasExpired(store.active)){tick();return;}
        if(!commitExam({...store,active:updateExamAnswer(store.active,q.id,input.value)}))input.value=store.active.answers[q.id]||"";
      });
      field.append(input);
    }else{
      const options=element("div","exam-options");
      for(const [index,option] of q.options.entries()){
        const choice=element("label","option");
        const radio=element("input");radio.type="radio";radio.name="exam-"+q.id;radio.value=option;
        radio.checked=session.answers[q.id]===option;radio.id=q.id+"-"+index;
        radio.addEventListener("change",()=>{
          if(hasExpired(store.active)){tick();return;}
          if(!commitExam({...store,active:updateExamAnswer(store.active,q.id,radio.value)}))renderExamSection();
        });
        choice.append(radio,element("span","",option));options.append(choice);
      }
      field.append(options);
    }
    form.append(field);
  });
  const notes=byId("examNotes");
  notes.value=session.notes[section.id]||"";
  notes.placeholder="Rédige ici les étapes de ta démonstration : domaines, théorèmes et justification. Cette rédaction ne peut pas être notée automatiquement.";
  notes.maxLength=3500;
  notes.oninput=()=>{
    if(hasExpired(store.active)){tick();return;}
    if(!commitExam({...store,active:updateExamNotes(store.active,section.id,notes.value)}))notes.value=store.active.notes[section.id]||"";
  };
  byId("examPrev").disabled=session.sectionIndex===0;
  byId("examNext").disabled=session.sectionIndex===3;
  byId("examNav").replaceChildren();
  for(let i=0;i<4;i++){
    const btn=element("button","subtle small"+(i===session.sectionIndex?" exam-active-tab":""),String(i+1));
    btn.type="button";btn.setAttribute("aria-label","Aller à l'exercice "+(i+1));
    btn.setAttribute("aria-current",i===session.sectionIndex?"step":"false");
    btn.addEventListener("click",()=>moveTo(i));
    byId("examNav").append(btn);
  }
  tick();
}
function moveTo(i){
  if(!store.active)return;
  if(hasExpired(store.active)){tick();return;}
  if(!commitExam({...store,active:{...store.active,sectionIndex:i}}))return;
  renderExamSection();byId("examPosition").scrollIntoView({block:"start"});
}
function renderActive(){
  const active=!!store.active;
  setVisible("examActive",active);
  setVisible("examIntro",!active);
  if(active){
    byId("examActiveTitle").textContent=findExam(store.active.examId,store.active.seed??null).title;
    setVisible("examResult",false);
    setTimer();renderExamSection();
  }else if(timer!==null){clearInterval(timer);timer=null;}
  renderHistory();
}
function showResult(result){
  setVisible("examActive",false);setVisible("examIntro",true);setVisible("examResult",true);
  if(timer!==null){clearInterval(timer);timer=null;}
  byId("examScore").textContent=result.score+" / "+result.maxScore;
  const summary=result.reason==="timeout"?"Temps écoulé : la copie a été rendue automatiquement.":"Copie rendue. La notation automatique est terminée.";
  byId("examSummary").textContent=summary+" Les justifications rédigées ne sont pas évaluées : "+result.score+"/20 est une note indicative.";
  const selfStatus=byId("examReasoningStatus");
  const exam=findExam(result.examId,result.seed??null);
  const checks=countChecks(result,exam);
  selfStatus.textContent="Étapes rédigées déclarées : "+checks.checked+"/"+checks.total+" (auto-évaluation, hors note /20)";
  const review=byId("examReview");review.replaceChildren();
  for(const section of result.sections){
    const src=exam.sections.find(s=>s.id===section.id);
    const details=element("details","exam-review-group");
    const summaryNode=element("summary","",section.title+" : "+section.earned+"/5 points");
    const context=element("p","helper",src.context);
    details.append(summaryNode,context);
    for(const q of section.questions){
      const srcQ=src.questions.find(k=>k.id===q.id);
      const block=element("div","exam-review-item");
      const heading=element("strong","",srcQ.prompt+" — "+q.earned+"/"+q.points+" pt");
      const answer=element("p","", "Ta réponse : "+(q.answer||"Non renseignée")+" | Réponse correcte : "+String(q.expected).replace(".",","));
      const explanation=element("p","",q.solution);
      block.append(heading,answer,explanation);details.append(block);
    }
    const handwritten=result.notes[section.id];
    if(handwritten){
      const noteLabel=element("strong","","Ta rédaction (non évaluée automatiquement)");
      const note=element("p","exam-user-notes",handwritten);
      details.append(noteLabel,note);
    }

    const rubric=rubricForSection(src);
    if(rubric){
      const guide=element("details","exam-reasoning-guide");
      guide.append(element("summary","","Correction guidée du raisonnement · "+rubric.steps.length+" étapes"));
      guide.append(element("p","helper",rubric.intro));
      for(let i=0;i<rubric.steps.length;i++){
        const step=rubric.steps[i],key=section.id+":"+step.id;
        const wrap=element("div","exam-reasoning-step");
        wrap.append(element("h4","","Étape "+(i+1)+" — "+step.prompt),element("p","",step.model));
        const label=element("label","exam-check-label");
        const input=element("input");input.type="checkbox";input.checked=!!result.selfChecks?.[key];
        label.append(input,element("span","","J'ai réellement justifié cette étape dans ma copie"));
        input.addEventListener("change",()=>{
          try{
            if(!commitExam(updateReviewCheck(store,result.examId,result.startedAt,key,input.checked)))throw new Error("Persistance impossible");
            const updated=store.history.find(x=>x.examId===result.examId&&x.startedAt===result.startedAt);
            if(updated){
              result.selfChecks=updated.selfChecks;
              const tally=countChecks(updated,exam);
              selfStatus.textContent="Étapes rédigées déclarées : "+tally.checked+"/"+tally.total+" (auto-évaluation, hors note /20)";
            }
          }catch(error){input.checked=!input.checked;alertExam("La copie n'a pas pu être modifiée.");}
        });
        wrap.append(label);
        const link=element("a","","Approfondir ce chapitre ↗");
        link.href="https://github.com/dbrckk/Daeu-b/blob/main/maths/"+step.lesson;
        link.target="_blank";link.rel="noopener noreferrer";wrap.append(link);
        guide.append(wrap);
      }
      details.append(guide);
    }
    details.append(element("p","exam-method","Critères de rédaction : "+src.method));
    if(section.earned<5){
      const suggestions=element("div","exam-remediation");
      suggestions.append(element("strong","","À retravailler : "));
      for(const [label,path] of EXAM_LESSONS[section.id]||[]){
        const link=element("a","",label);
        link.href="https://github.com/dbrckk/Daeu-b/blob/main/maths/"+path;
        link.target="_blank";link.rel="noopener noreferrer";
        suggestions.append(link);
      }
      details.append(suggestions);
    }
    review.append(details);
  }
  renderHistory();
}
function finalize(reason){
  if(!store.active)return;
  const result=finishExam(store.active,Date.now(),reason);
  const prior=store;
  store=addHistory(store,result);
  if(!persist()){store=prior;return;}
  lastResult=result;
  showResult(result);
  alertExam("");
}
function createNewSeed(){
  // Graine non secrète ; Web Crypto minimise les collisions entre nouvelles copies.
  const existing=new Set(store.history.filter(x=>x.examId===GENERATED_EXAM_ID).map(x=>x.seed));
  for(let i=0;i<20;i++){
    let seed;
    if(typeof crypto!=="undefined" && crypto.getRandomValues){
      const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);seed=bytes[0];
    }else seed=Math.floor(Math.random()*4294967296);
    if(!existing.has(seed))return seed;
  }
  throw new Error("Impossible de produire une graine différente pour ce sujet");
}
function start(){
  if(store.active){renderActive();return;}
  const examId=byId("examSelect").value;
  const seed=examId===GENERATED_EXAM_ID?createNewSeed():null;
  const prior=store;
  store={...store,active:startExam(examId,Date.now(),seed)};
  if(!persist()){store=prior;return;}
  lastResult=null;
  alertExam("");renderActive();
}
export function getExamBackup(){return store;}
export function restoreExamBackup(raw){
  // Les données sont déjà validées et écrites atomiquement par le module
  // principal ; ne pas créer une seconde écriture susceptible d'échouer.
  store=sanitizeExamStore(raw);
  if(initialized){lastResult=null;setVisible("examResult",false);renderActive();if(store.active&&hasExpired(store.active))finalize("timeout");}
}
export function clearExamProgress(){
  store=emptyExamStore();lastResult=null;
  if(initialized){setVisible("examResult",false);renderActive();}
}
export function initExams(storageAdapter,staleCallback=()=>{}){
  if(initialized)return;
  initialized=true;adapter=storageAdapter;onStale=staleCallback;load();
  const select=byId("examSelect");
  for(const exam of EXAMS){const opt=element("option","",exam.title);opt.value=exam.id;select.append(opt);}
  const generated=element("option","","Examen C — NOUVEAU sujet généré à chaque tentative");
  generated.value=GENERATED_EXAM_ID;select.prepend(generated);
  byId("examStart").addEventListener("click",start);
  byId("examPrev").addEventListener("click",()=>moveTo(Math.max(0,store.active.sectionIndex-1)));
  byId("examNext").addEventListener("click",()=>moveTo(Math.min(3,store.active.sectionIndex+1)));
  byId("examSubmit").addEventListener("click",()=>{
    const exam=findExam(store.active?.examId,store.active?.seed??null);
    if(!exam)return;
    const total=exam.sections.reduce((n,s)=>n+s.questions.length,0);
    const filled=Object.values(store.active.answers).filter(x=>x.trim()).length;
    if(hasExpired(store.active)){finalize("timeout");return;}
    if(confirm("Rendre définitivement la copie ("+filled+"/"+total+" réponses) ? Le corrigé et la note seront affichés."))finalize(hasExpired(store.active)?"timeout":"submitted");
  });
  byId("examNew").addEventListener("click",()=>{lastResult=null;setVisible("examResult",false);renderActive();byId("exam-title").scrollIntoView({behavior:"smooth",block:"start"});});
  window.addEventListener("pageshow",tick);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick();});
  renderActive();
  if(store.active&&hasExpired(store.active))finalize("timeout");
}
