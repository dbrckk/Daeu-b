import {EXAMS} from "./exams.mjs";
import {courseUrl} from "./course-catalog.mjs";
import {GENERATED_EXAM_ID} from "./exam-generator.mjs";
import {ALTERNATIVE_EXAM_ID} from "./exam-alternative.mjs";
import {APPLIED_EXAM_ID} from "./exam-applied.mjs";
import {getRubric,rubricForSection,countChecks} from "./reasoning.mjs";
import {analyzeExamHistory} from "./exam-analytics.mjs";
import {examOverview} from "./exam-blueprint.mjs";
import {recommendNextExam} from "./exam-recommendation.mjs";
import {buildExamRemediation} from "./exam-remediation.mjs";
import {inspectExamDraft} from "./exam-readiness.mjs";
import {findExam,isGeneratedExamId,startExam,hasExpired,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,sanitizeExamStore,addHistory,updateReviewCheck} from "./exam-engine.mjs";
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
  "c-integrales":[["Calcul intégral","15-primitives-integrales.md"]],
  "d-rationnelle":[["Fonctions","05-fonctions.md"],["Limites et asymptotes","07-limites-asymptotes.md"],["Dérivation","06-derivation.md"]],
  "d-conditionnelles":[["Probabilités","12-probabilites.md"]],
  "d-statistiques":[["Statistiques","11-statistiques.md"]],
  "d-exponentielle":[["Continuité et TVI","08-continuite-tvi.md"],["Exponentielle et logarithmes","09-exponentielle-logarithme.md"]],
  "e-systeme":[["Équations et systèmes","03-equations-inequations-systemes.md"],["Modélisation","17-raisonnement-modelisation.md"]],
  "e-trigonometrie":[["Trigonométrie","13-trigonometrie.md"]],
  "e-sans-remise":[["Probabilités","12-probabilites.md"]],
  "e-racine":[["Domaine des fonctions","05-fonctions.md"],["Équations","03-equations-inequations-systemes.md"]]
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
      link.href=courseUrl(item.lesson);
      link.target="_blank";link.rel="noopener noreferrer";
      li.append(link);
    }
    list.append(li);
  }
  container.append(list,element("p","helper","Diagnostic des réponses objectives des 12 dernières copies au maximum, distinct de l'évaluation de la rédaction."));
}

function renderExamRecommendation(){
  const node=byId("examRecommendation");
  const recommendation=recommendNextExam(store.history);
  node.textContent="Prochain sujet conseillé : examen "+recommendation.label+" — "+recommendation.reason+
    " Conseil indicatif fondé sur les erreurs des questions objectives et la diversité des sujets.";
  const select=byId("examSelect");
  const suggested=byId("examChooseRecommended");
  suggested.hidden=select.value===recommendation.id;
  suggested.onclick=()=>{
    select.value=recommendation.id;
    renderExamBlueprint();
  };
}
function renderExamBlueprint(){
  const profile=examOverview().profiles.find(p=>p.id===byId("examSelect").value);
  const summary=byId("examBlueprintSummary"),list=byId("examBlueprintSections");
  list.replaceChildren();
  if(!profile){summary.textContent="Sélectionne un sujet pour consulter sa composition.";return;}
  summary.textContent="Examen "+profile.label+" : "+profile.questions+" questions · "+
    profile.types.number+" réponses numériques · "+profile.types.choice+
    " choix · "+profile.twoPointQuestions+" questions à 2 points · "+
    profile.guidedSteps+" étapes de rédaction à comparer après remise.";
  for(const section of profile.sections)
    list.append(element("li","",section.title+" — "+section.questions+" questions, "+section.points+" points"));
  renderExamRecommendation();
  byId("examBlueprintCourses").textContent="Notions explicitement ciblées : "+
    profile.courses.map(c=>c.label.split(" · ").slice(1).join(" · ")).join(" ; ")+
    ". D'autres compétences peuvent être nécessaires sans être étiquetées.";
}
function renderConsolidation(){
  const panel=byId("examConsolidationPanel"),list=byId("examConsolidationList");
  const more=byId("examConsolidationExtra"),extra=byId("examConsolidationExtraList");
  list.replaceChildren();extra.replaceChildren();more.hidden=true;panel.hidden=true;
  if(!store.history.length)return;
  let practice;
  try{practice=adapter.snapshot().practice;}
  catch(error){
    if(error instanceof StaleDataError)onStale();
    return;
  }
  const plan=buildExamRemediation(store.history,practice);
  if(!plan.length)return;
  panel.hidden=false;
  byId("examConsolidationSummary").textContent=
    plan.length+" chapitre(s) concernés par des points perdus dans les 12 dernières copies. "+
    "Les questions du module de pratique ont un suivi distinct : une bonne note d'examen ne les valide pas.";
  for(const [index,item] of plan.entries()){
    const row=element("li","exam-consolidation-item");
    row.append(element("strong","",item.label));
    row.append(element("p","helper",item.lost+" point(s) perdu(s) sur "+item.possible+
      " point(s) évalué(s) dans les compétences ciblées : "+item.skills.join(", ")+"."));
    const actions=element("div","exam-consolidation-actions");
    const lesson=element("a","","1. Revoir le cours");
    lesson.href=item.courseUrl;actions.append(lesson);
    if(item.practiceUrl){
      row.append(element("p","helper","Entraînement : "+item.confirmed+"/"+item.practiceTotal+
        " question(s) confirmée(s), "+item.due+" rappel(s) à échéance, "+item.wrong+
        " question(s) avec erreur non confirmées. Ces résultats viennent des séances, pas des examens."));
      const practiceLink=element("a","","2. "+(item.due?"Faire les rappels":"Faire des exercices"));
      practiceLink.href=item.practiceUrl;
      practiceLink.dataset.practiceTopic=item.topic;
      actions.append(practiceLink);
    }else{
      row.append(element("p","helper","Ce chapitre n'a pas de quiz dédié : étudier le cours et rédiger une démonstration sur papier."));
    }
    row.append(actions);(index<5?list:extra).append(row);
  }
  if(plan.length>5){
    more.hidden=false;
    byId("examConsolidationMore").textContent=
      "Afficher les "+(plan.length-5)+" autres chapitres à consolider";
  }
}
function renderHistory(){
  const container=byId("examHistory");
  container.replaceChildren();
  renderConsolidation();
  if(!store.history.length){container.append(element("p","helper","Aucun examen terminé pour le moment."));renderAnalytics();renderExamRecommendation();return;}
  for(const result of [...store.history].reverse()){
    const row=element("div","exam-history-row");
    const label=element("span","",result.title+" · "+new Date(result.finishedAt).toLocaleDateString("fr-FR")+" · "+result.score+"/20");
    const open=element("button","subtle small","Voir la correction");
    open.type="button";
    open.addEventListener("click",()=>{lastResult=result;showResult(result);byId("exam-title").scrollIntoView({behavior:"smooth",block:"start"});});
    row.append(label,open);container.append(row);
  }
  renderAnalytics();
  renderExamRecommendation();
}
/** Indique les saisies manquantes sans juger leur justesse ni afficher de solution. */
function renderDraftProgress(){
  if(!store.active)return;
  const exam=findExam(store.active.examId,store.active.seed??null);
  const draft=inspectExamDraft(exam,store.active);
  byId("examDraftSummary").textContent=
    "Copie : "+draft.answeredQuestions+"/"+draft.totalQuestions+" réponses saisies (non vérifiées) · "+
    draft.sectionsWithNotes+"/4 justifications présentes · "+draft.pointsUnanswered+
    " point(s) associés à des questions sans réponse, sur 20.";
  const list=byId("examDraftSections");list.replaceChildren();
  for(const section of draft.sections){
    const button=element("button","subtle small exam-draft-section",
      "Exercice "+(section.index+1)+" — "+section.answered+"/"+section.total+" réponses · "+
      (section.notePresent?"rédaction présente":"rédaction absente"));
    button.type="button";
    button.setAttribute("aria-label","Aller à l'exercice "+(section.index+1)+
      " : "+section.remaining+" question(s) sans réponse, "+
      (section.notePresent?"justification saisie":"justification absente"));
    if(section.index===store.active.sectionIndex)button.setAttribute("aria-current","step");
    button.addEventListener("click",()=>moveTo(section.index));
    list.append(button);
  }
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
        else renderDraftProgress();
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
          else renderDraftProgress();
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
    else renderDraftProgress();
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
  renderDraftProgress();
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
  // L'historique est consultable même durant un autre examen :
  // le bouton doit reprendre la copie actuelle, sans suggérer un nouveau départ.
  byId("examNew").textContent=store.active?"Reprendre ma copie en cours":"Retour aux examens";
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
        link.href=courseUrl(step.lesson);
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
        link.href=courseUrl(path);
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
function createNewSeed(examId){
  // Graine non secrète ; Web Crypto minimise les collisions entre nouvelles copies.
  const existing=new Set(store.history.filter(x=>x.examId===examId).map(x=>x.seed));
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
  const seed=isGeneratedExamId(examId)?createNewSeed(examId):null;
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
  const alternative=element("option","","Examen D — autres problèmes : rationnelles, conditionnelles, statistiques, TVI");
  alternative.value=ALTERNATIVE_EXAM_ID;select.append(alternative);
  const applied=element("option","","Examen E — systèmes, trigonométrie, sans remise et fonctions à racine");
  applied.value=APPLIED_EXAM_ID;select.append(applied);
  select.addEventListener("change",renderExamBlueprint);
  renderExamBlueprint();
  byId("examStart").addEventListener("click",start);
  byId("examPrev").addEventListener("click",()=>moveTo(Math.max(0,store.active.sectionIndex-1)));
  byId("examNext").addEventListener("click",()=>moveTo(Math.min(3,store.active.sectionIndex+1)));
  byId("examSubmit").addEventListener("click",()=>{
    const exam=findExam(store.active?.examId,store.active?.seed??null);
    if(!exam)return;
    const draft=inspectExamDraft(exam,store.active);
    if(hasExpired(store.active)){finalize("timeout");return;}
    const text="Rendre définitivement la copie ?\n"+
      draft.answeredQuestions+"/"+draft.totalQuestions+" réponses saisies (justesse non vérifiée), "+
      draft.remainingQuestions+" sans réponse ("+draft.pointsUnanswered+" point(s) concernés).\n"+
      draft.sectionsWithNotes+"/4 exercices avec rédaction.\n"+
      "La note automatique est indicative et n'évalue pas les démonstrations. Afficher le corrigé ?";
    if(confirm(text))finalize(hasExpired(store.active)?"timeout":"submitted");
  });
  byId("examNew").addEventListener("click",()=>{lastResult=null;setVisible("examResult",false);renderActive();byId("exam-title").scrollIntoView({behavior:"smooth",block:"start"});});
  window.addEventListener("pageshow",tick);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick();});
  renderActive();
  if(store.active&&hasExpired(store.active))finalize("timeout");
}
