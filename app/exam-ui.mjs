import {EXAMS} from "./exams.mjs";
import {startExam,hasExpired,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,sanitizeExamStore,addHistory} from "./exam-engine.mjs";

const EXAM_LESSONS={
  "a-analyse":[["Second degré","04-second-degre.md"],["Dérivation","06-derivation.md"]],
  "a-suites":[["Suites","10-suites.md"],["Logarithmes","09-exponentielle-logarithme.md"]],
  "a-probas":[["Probabilités","12-probabilites.md"]],
  "a-integrales":[["Primitives et intégrales","15-primitives-integrales.md"],["Logarithmes","09-exponentielle-logarithme.md"]],
  "b-fonction":[["Fonctions","05-fonctions.md"],["Dérivation","06-derivation.md"],["Limites","07-limites-asymptotes.md"]],
  "b-systeme":[["Équations et systèmes","03-equations-inequations-systemes.md"]],
  "b-stats":[["Statistiques","11-statistiques.md"]],
  "b-expo":[["Continuité et TVI","08-continuite-tvi.md"],["Exponentielle","09-exponentielle-logarithme.md"]]
};
const KEY="daeu-b-exams-v1";
const byId=id=>document.getElementById(id);
let store=emptyExamStore(),timer=null,lastResult=null;
let initialized=false;
function alertExam(message){
  const node=byId("examNotice");node.textContent=message;node.hidden=!message;
}
function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(store));}
  catch(error){alertExam("Sauvegarde automatique indisponible : les réponses peuvent être perdues au rechargement. Vérifie les réglages du navigateur.");}
}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw)store=sanitizeExamStore(JSON.parse(raw));
  }catch(error){
    store=emptyExamStore();
    alertExam("Anciennes données d'examens incompatibles ou stockage indisponible. Aucun résultat n'a pu être repris.");
  }
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
function renderHistory(){
  const container=byId("examHistory");
  container.replaceChildren();
  if(!store.history.length){container.append(element("p","helper","Aucun examen terminé pour le moment."));return;}
  for(const result of [...store.history].reverse()){
    const row=element("div","exam-history-row");
    const label=element("span","",result.title+" · "+new Date(result.finishedAt).toLocaleDateString("fr-FR")+" · "+result.score+"/20");
    const open=element("button","subtle small","Voir la correction");
    open.type="button";
    open.addEventListener("click",()=>{lastResult=result;showResult(result);byId("exam-title").scrollIntoView({behavior:"smooth",block:"start"});});
    row.append(label,open);container.append(row);
  }
}
function renderExamSection(){
  const session=store.active;
  if(!session)return;
  const exam=EXAMS.find(e=>e.id===session.examId);
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
        store.active=updateExamAnswer(store.active,q.id,input.value);
        persist();
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
          store.active=updateExamAnswer(store.active,q.id,radio.value);persist();
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
    store.active=updateExamNotes(store.active,section.id,notes.value);persist();
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
  store.active={...store.active,sectionIndex:i};persist();
  renderExamSection();byId("examPosition").scrollIntoView({block:"start"});
}
function renderActive(){
  const active=!!store.active;
  setVisible("examActive",active);
  setVisible("examIntro",!active);
  if(active){
    byId("examActiveTitle").textContent=EXAMS.find(e=>e.id===store.active.examId).title;
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
  const review=byId("examReview");review.replaceChildren();
  const exam=EXAMS.find(e=>e.id===result.examId);
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
  store=addHistory(store,result);persist();lastResult=result;
  showResult(result);
  alertExam("");
}
function start(){
  if(store.active){renderActive();return;}
  const examId=byId("examSelect").value;
  store={...store,active:startExam(examId)};lastResult=null;persist();
  alertExam("");renderActive();
}
export function getExamBackup(){return store;}
export function restoreExamBackup(raw){
  store=sanitizeExamStore(raw);persist();
  if(initialized){lastResult=null;setVisible("examResult",false);renderActive();if(store.active&&hasExpired(store.active))finalize("timeout");}
}
export function clearExamProgress(){
  store=emptyExamStore();lastResult=null;persist();
  if(initialized){setVisible("examResult",false);renderActive();}
}
export function initExams(){
  if(initialized)return;
  initialized=true;load();
  const select=byId("examSelect");
  for(const exam of EXAMS){const opt=element("option","",exam.title);opt.value=exam.id;select.append(opt);}
  byId("examStart").addEventListener("click",start);
  byId("examPrev").addEventListener("click",()=>moveTo(Math.max(0,store.active.sectionIndex-1)));
  byId("examNext").addEventListener("click",()=>moveTo(Math.min(3,store.active.sectionIndex+1)));
  byId("examSubmit").addEventListener("click",()=>{
    const exam=EXAMS.find(x=>x.id===store.active?.examId);
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
