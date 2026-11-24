import {EXAMS} from "./exams.mjs";
import {mountNotebook,notebookMode} from "./math-notebook.mjs";
import {courseUrl,practiceUrlForCourse} from "./course-catalog.mjs";
import {GENERATED_EXAM_ID} from "./exam-generator.mjs";
import {ALTERNATIVE_EXAM_ID} from "./exam-alternative.mjs";
import {APPLIED_EXAM_ID} from "./exam-applied.mjs";
import {getRubric,rubricForSection,countChecks} from "./reasoning.mjs";
import {analyzeExamHistory} from "./exam-analytics.mjs";
import {examOverview} from "./exam-blueprint.mjs";
import {recommendNextExam} from "./exam-recommendation.mjs";
import {buildExamRemediation,hasPracticeQuestions} from "./exam-remediation.mjs";
import {inspectExamDraft} from "./exam-readiness.mjs";
import {findExam,isGeneratedExamId,startExam,hasExpired,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,sanitizeExamStore,addHistory,updateReviewCheck,updateReviewTarget} from "./exam-engine.mjs";
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
const inputMode=notebookMode();
const sheetKey=(session,id)=>"exam:"+session.examId+":"+session.startedAt+":"+id;
function writtenPaperSections(session,{onError=new Set()}={}){
  let entries={};
  try{entries=adapter.snapshot().workbook.entries??{};}catch{return onError;}
  const exam=findExam(session.examId,session.seed??null);
  return new Set(exam.sections.filter(section=>entries[sheetKey(session,section.id)]?.pages?.some(page=>page.length>0)).map(section=>section.id));
}
const examPaperPrompt=section=>[section.context,...section.questions.map((q,i)=>
  "Question "+(i+1)+" — "+q.points+" point"+(q.points>1?"s":"")+"\n"+q.prompt+
  (q.type==="choice"?"\n"+q.options.map((option,j)=>(j+1)+". "+option).join("\n"):"")
)].join("\n\n");
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
      row.append(element("p","helper","Ce chapitre n'a pas de quiz dédié : étudier le cours et rédiger une démonstration dans le cahier numérique."));
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
  renderRevisionHome();
  if(!store.history.length){container.append(element("p","helper","Aucun examen terminé pour le moment."));renderAnalytics();renderExamRecommendation();return;}
  for(const result of [...store.history].reverse()){
    const row=element("div","exam-history-row");
    const label=element("span","",result.title+" · "+new Date(result.finishedAt).toLocaleDateString("fr-FR")+" · "+(result.paperOnly?"copie manuscrite non notée":result.score+"/20"));
    const open=element("button","subtle small","Voir la correction");
    open.type="button";
    open.addEventListener("click",()=>{lastResult=result;showResult(result);});
    row.append(label,open);container.append(row);
  }
  renderAnalytics();
  renderExamRecommendation();
}
const formatWarning=count=>count
  ?count+(count===1?" réponse au format invalide":" réponses au format invalide")
  :"";

/** Signale les champs manquants et les formats refusés par le correcteur. */
function renderDraftProgress(){
  if(!store.active)return;
  const exam=findExam(store.active.examId,store.active.seed??null);
  if(store.active.paperOnly){
    const written=writtenPaperSections(store.active);
    byId("examDraftTitle").textContent="Pages manuscrites";
    byId("examDraftSummary").textContent=written.size+"/4 exercices avec écriture sauvegardée. Les équations, QCM et justifications se rédigent sur la feuille. Cette copie ne recevra pas de note automatique.";
    const list=byId("examDraftSections");list.replaceChildren();
    for(const [index,section] of exam.sections.entries()){
      const button=element("button","subtle small exam-draft-section","Exercice "+(index+1)+" — "+(written.has(section.id)?"écriture sauvegardée":"page encore vide"));
      button.type="button";button.addEventListener("click",()=>moveTo(index));list.append(button);
    }
    return;
  }
  byId("examDraftTitle").textContent="Vérification de ma copie avant remise";
  const draft=inspectExamDraft(exam,store.active);
  const current=draft.sections[store.active.sectionIndex];
  const invalid=new Set(current.invalidIds);
  for(const question of exam.sections[current.index].questions){
    const input=byId("exam-answer-"+question.id);
    if(!input)continue;
    input.setAttribute("aria-invalid",String(invalid.has(question.id)));
    byId("exam-format-"+question.id).hidden=!invalid.has(question.id);
  }
  const format=formatWarning(draft.invalidAnswers);
  byId("examDraftSummary").textContent=
    "Copie : "+draft.answeredQuestions+"/"+draft.totalQuestions+" réponses saisies (justesse non vérifiée) · "+
    (format?format+" · ":"")+draft.sectionsWithNotes+"/4 justifications présentes · "+draft.pointsUnanswered+
    " point(s) associés à des questions sans réponse, sur 20.";
  const list=byId("examDraftSections");list.replaceChildren();
  for(const section of draft.sections){
    const invalid=formatWarning(section.invalidIds.length);
    const button=element("button","subtle small exam-draft-section",
      "Exercice "+(section.index+1)+" — "+section.answered+"/"+section.total+" réponses · "+
      (invalid?invalid+" · ":"")+(section.notePresent?"rédaction présente":"rédaction absente"));
    button.type="button";
    button.setAttribute("aria-label","Aller à l'exercice "+(section.index+1)+
      " : "+section.remaining+" question(s) sans réponse, "+
      (invalid?invalid+", ":"")+(section.notePresent?"justification saisie":"justification absente"));
    if(section.index===store.active.sectionIndex)button.setAttribute("aria-current","step");
    button.addEventListener("click",()=>moveTo(section.index));
    list.append(button);
  }
}
function installExamNotesKeyboard(){
  const notes=byId("examNotes");
  const panel=element("div","math-notebook-keypad exam-notes-keypad");
  panel.id="examNotesSymbols";
  panel.setAttribute("role","group");
  panel.setAttribute("aria-label","Symboles pour rédiger mes calculs");
  for(const symbol of ["×","÷","−","√","²","³","π","≤","≥","≠","Δ","∫","∞","→","(",")"]){
    const button=element("button","subtle small",symbol);
    button.type="button";
    button.setAttribute("aria-label","Insérer "+symbol+" dans la rédaction");
    button.addEventListener("click",()=>{
      if(!store.active||store.active.paperOnly||hasExpired(store.active)){tick();return;}
      const start=notes.selectionStart,end=notes.selectionEnd;
      if(notes.value.length-(end-start)+symbol.length>notes.maxLength){
        alertExam("Rédaction limitée à 3 500 caractères. Raccourcis ta démonstration avant d'ajouter un symbole.");
        notes.focus();return;
      }
      notes.setRangeText(symbol,start,end,"end");
      notes.dispatchEvent(new Event("input",{bubbles:true}));
      notes.focus();
    });
    panel.append(button);
  }
  notes.after(panel);
}

function renderExamSection(){
  const session=store.active;
  if(!session)return;
  const exam=findExam(session.examId,session.seed??null);
  const section=exam.sections[session.sectionIndex];
  byId("examPosition").textContent="Exercice "+(session.sectionIndex+1)+" sur 4 · 5 points";
  byId("examSectionTitle").textContent=section.title;
  byId("examContext").textContent=section.context;
  byId("examActive").classList.toggle("paper-exam-active",session.paperOnly===true);
  const notebook=byId("examNotebook");
  byId("examUseKeyboard").hidden=!session.paperOnly;
  if(session.paperOnly||inputMode==="mixte"){
    mountNotebook(notebook,{
      context:sheetKey(session,section.id),adapter,title:"Examen — exercice "+(session.sectionIndex+1)+" : "+section.title,
      checkingEnabled:false,paperOnly:session.paperOnly===true,paperPrompt:session.paperOnly?examPaperPrompt(section):""
    });
  }else{
    const context=sheetKey(session,section.id);
    mountNotebook(notebook,{
      context,adapter,title:"Mes calculs — exercice "+(session.sectionIndex+1),
      textOnly:true,collapsed:true,checkingEnabled:false
    });
    const transfer=element("button","subtle small exam-copy-calculations","Reporter mes calculs dans la rédaction");
    transfer.type="button";
    transfer.addEventListener("click",()=>{
      if(!store.active||hasExpired(store.active)){tick();return;}
      let draft="";
      try{draft=adapter.snapshot().workbook.entries?.[context]?.text?.trim()||"";}
      catch{alertExam("Impossible de relire le brouillon sauvegardé.");return;}
      if(!draft){alertExam("Écris d'abord tes calculs dans le brouillon.");return;}
      const notes=byId("examNotes");
      if(notes.value.includes(draft)){
        alertExam("Ces calculs sont déjà présents dans la rédaction.");notes.focus();return;
      }
      const merged=notes.value.trimEnd()+(notes.value.trim()?"\n\n":"")+draft;
      if(merged.length>3500){
        alertExam("Le texte dépasse la limite de 3 500 caractères. Raccourcis le brouillon ou la rédaction avant de le reporter.");
        notes.focus();return;
      }
      notes.value=merged;
      notes.dispatchEvent(new Event("input",{bubbles:true}));
      if(notes.value!==merged){
        alertExam("La rédaction n'a pas été enregistrée ; ton brouillon reste sauvegardé.");
        return;
      }
      alertExam("");
      notes.focus();
    });
    const info=element("p","helper","Brouillon enregistré automatiquement. Pour joindre les étapes à la copie, reporte-les dans la rédaction. Aucune correction n'est dévoilée pendant l'examen.");
    notebook.querySelector(".math-notebook-disclosure").append(transfer,info);
  }
  const form=byId("examQuestions");form.replaceChildren();
  form.hidden=session.paperOnly===true;
  byId("examNotes").closest(".exam-notes").hidden=session.paperOnly===true;
  section.questions.forEach((q,i)=>{
    const field=element("fieldset","exam-question");
    const legend=element("legend","","Question "+(i+1)+" · "+q.points+" point"+(q.points>1?"s":""));
    field.append(legend);
    const label=element("p","exam-prompt",q.prompt);
    field.append(label);
    if(q.type==="number"){
      const input=element("input","exam-input");
      input.type="text";input.spellcheck=false;input.placeholder="Nombre, fraction ou décimal";input.autocomplete="off";
      input.maxLength=200;input.value=session.answers[q.id]||"";
      input.id="exam-answer-"+q.id;
      input.setAttribute("aria-label",q.prompt);
      const warning=element("p","exam-format-warning","Utilise un nombre, un décimal ou une fraction, par exemple −3/4.");
      warning.id="exam-format-"+q.id;
      warning.hidden=true;
      input.setAttribute("aria-describedby",warning.id);
      input.addEventListener("input",()=>{
        if(hasExpired(store.active)){tick();return;}
        if(!commitExam({...store,active:updateExamAnswer(store.active,q.id,input.value)}))input.value=store.active.answers[q.id]||"";
        renderDraftProgress();
      });
      field.append(input,warning);
    }else{
      const options=element("div","exam-options");
      legend.id="exam-question-"+q.id;
      label.id="exam-prompt-"+q.id;
      field.setAttribute("aria-labelledby",legend.id+" "+label.id);
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
    if(session.paperOnly&&i===session.sectionIndex)btn.setAttribute("aria-label","Exercice "+(i+1)+" en cours");
    btn.addEventListener("click",()=>moveTo(i));
    byId("examNav").append(btn);
  }
  renderDraftProgress();
  tick();
}
function focusExamSection(){
  const title=byId("examSectionTitle");
  title.focus({preventScroll:true});
  title.scrollIntoView({block:"start",behavior:"instant"});
}
function moveTo(i){
  if(!store.active)return;
  if(hasExpired(store.active)){tick();return;}
  if(i!==store.active.sectionIndex){
    if(!commitExam({...store,active:{...store.active,sectionIndex:i}}))return;
    renderExamSection();
  }
  if(!store.active)return;
  if(store.active.paperOnly){
    byId("examActive").scrollTo({top:0,behavior:"instant"});
    byId("examNav").children[i].focus({preventScroll:true});
  }else focusExamSection();
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
function revisionRow(step,index,onOpen){
  const row=element("li","exam-revision-item");
  const open=element("button","subtle","Exercice "+(index+1)+" · "+step.prompt);
  open.type="button";
  open.addEventListener("click",onOpen);
  const links=element("div","exam-revision-links");
  const lesson=element("a","","Revoir le cours");lesson.href=courseUrl(step.lesson);
  lesson.target="_blank";lesson.rel="noopener noreferrer";
  links.append(lesson);
  if(hasPracticeQuestions(step.lesson)){
    const practice=element("a","","Faire des exercices");
    practice.href=practiceUrlForCourse(step.lesson);
    links.append(practice);
  }
  row.append(open,links);
  return row;
}

function openRevisionStep({group,guide,heading}){
  group.open=true;guide.open=true;
  heading.focus({preventScroll:true});
  heading.scrollIntoView({block:"start",behavior:"instant"});
}

function renderRevisionTargets(result,steps){
  const list=byId("examRevisionList");
  const marked=steps.filter(item=>result.reviewTargets?.[item.key]===true);
  const status=byId("examRevisionStatus");
  status.textContent=marked.length
    ?marked.length+(marked.length===1?" étape à retravailler":" étapes à retravailler")
    :"Coche « À retravailler » dans une grille de rédaction pour ajouter une étape ici.";
  list.replaceChildren();
  list.hidden=marked.length===0;
  for(const item of marked)list.append(revisionRow(item.step,item.index,()=>openRevisionStep(item)));
}

function renderRevisionHome(){
  const copies=byId("examRevisionHomeCopies");
  copies.replaceChildren();
  let total=0,copyCount=0;
  for(const result of [...store.history].reverse()){
    if(!result.reviewTargets)continue;
    const exam=findExam(result.examId,result.seed??null);
    const list=element("ul");
    for(const [index,section] of exam.sections.entries()){
      for(const step of rubricForSection(section)?.steps??[]){
        const key=section.id+":"+step.id;
        if(result.reviewTargets[key]!==true)continue;
        list.append(revisionRow(step,index,()=>showResult(result,key)));
      }
    }
    if(!list.childElementCount)continue;
    total+=list.childElementCount;
    copyCount++;
    const group=element("section","exam-revision-copy");
    const date=new Date(result.finishedAt).toLocaleDateString("fr-FR");
    group.append(element("h3","",result.title+" · "+date),list);
    copies.append(group);
  }
  setVisible("examRevisionHome",total>0);
  if(!total){
    copies.parentElement.open=false;
    return;
  }
  byId("examRevisionHomeSummary").textContent=
    total+(total===1?" étape":" étapes")+" à retravailler dans "+copyCount+(copyCount===1?" copie":" copies");
}

let formulaLoaded=false,formulaLoading=false;
function loadFormulaLibrary(src){
  return new Promise((resolve,reject)=>{
    const script=element("script");
    script.src=src;
    script.onload=resolve;
    script.onerror=()=>{script.remove();reject(Error("Bibliothèque du formulaire indisponible"));};
    document.head.append(script);
  });
}
async function loadExamFormula(){
  if(formulaLoaded||formulaLoading)return;
  const body=byId("examFormulaBody"),status=byId("examFormulaStatus"),retry=byId("examFormulaRetry");
  formulaLoading=true;
  body.setAttribute("aria-busy","true");
  status.hidden=false;status.textContent="Chargement du formulaire…";retry.hidden=true;
  try{
    const [{renderMathMarkdown},response]=await Promise.all([
      import("./math-markdown.mjs"),
      fetch("./fiches/formulaire.md"),
      globalThis.showdown||loadFormulaLibrary("./vendor/showdown-2.1.0.min.js"),
      globalThis.DOMPurify||loadFormulaLibrary("./vendor/dompurify.min.js"),
      globalThis.temml||loadFormulaLibrary("./vendor/temml.min.js")
    ]);
    if(!response.ok)throw Error("Formulaire indisponible");
    const source=await response.text();
    if(!source.startsWith("# "))throw Error("Fiche incomplète");
    renderMathMarkdown(body,source.replace(/^# [^\n]*\n/,""));
    formulaLoaded=true;status.hidden=true;
  }catch{
    status.textContent="Impossible de charger le formulaire.";
    retry.hidden=false;
  }finally{formulaLoading=false;body.setAttribute("aria-busy","false");}
}

function showResult(result,revisionKey=null){
  byId("examPaperSubmit").close();
  byId("examFormula").close();
  setVisible("examActive",false);setVisible("examIntro",true);setVisible("examResult",true);
  if(!store.active&&timer!==null){clearInterval(timer);timer=null;}
  byId("examResult").classList.toggle("exam-paper-result",result.paperOnly===true);
  byId("examScore").textContent=result.paperOnly?"Copie manuscrite rendue":result.score+" / "+result.maxScore;
  byId("examResult").querySelector(".eyebrow").textContent=result.paperOnly?"CORRECTION DE LA COPIE":"BILAN AUTOMATIQUE";
  const summary=result.reason==="timeout"?"Temps écoulé : la copie a été rendue automatiquement."
    :result.paperOnly?"Copie rendue.":"Copie rendue. La notation automatique est terminée.";
  byId("examSummary").textContent=result.paperOnly
    ?summary+" Relis tes pages à côté du corrigé, puis vérifie les étapes de ton raisonnement."
    :summary+" Les justifications rédigées ne sont pas évaluées : "+result.score+"/20 est une note indicative.";
  // L'historique est consultable même durant un autre examen :
  // le bouton doit reprendre la copie actuelle, sans suggérer un nouveau départ.
  byId("examNew").textContent=store.active?"Reprendre ma copie en cours":"Retour aux examens";
  const selfStatus=byId("examReasoningStatus");
  const exam=findExam(result.examId,result.seed??null);
  const checks=countChecks(result,exam);
  const selfCheckText=tally=>result.paperOnly
    ?tally.checked+"/"+tally.total+" étapes cochées dans la grille de rédaction"
    :"Étapes rédigées déclarées : "+tally.checked+"/"+tally.total+" (auto-évaluation, hors note /20)";
  selfStatus.textContent=selfCheckText(checks);
  const review=byId("examReview");review.replaceChildren();
  const revisionSteps=[];
  setVisible("examRevision",true);
  const written=result.paperOnly?writtenPaperSections(result,{onError:null}):null;
  const firstReview=result.sections.find(section=>written?.has(section.id))??result.sections[0];
  for(const [index,section] of result.sections.entries()){
    const src=exam.sections.find(s=>s.id===section.id);
    const details=element("details","exam-review-group");
    const summaryNode=element("summary","",result.paperOnly
      ?"Exercice "+(index+1)+" · "+section.title:section.title+" : "+section.earned+"/5 points");
    const solutions=result.paperOnly?element("div","exam-paper-solutions"):details;
    const context=element("p","helper",src.context);
    details.append(summaryNode);
    solutions.append(context);
    for(const q of section.questions){
      const srcQ=src.questions.find(k=>k.id===q.id);
      const block=element("div","exam-review-item");
      const heading=element("strong","",result.paperOnly?srcQ.prompt:srcQ.prompt+" — "+q.earned+"/"+q.points+" pt");
      const answer=element("p","",result.paperOnly?"Réponse attendue : "+String(q.expected).replace(".",","):"Ta réponse : "+(q.answer||"Non renseignée")+" | Réponse correcte : "+String(q.expected).replace(".",","));
      const explanation=element("p","",q.solution);
      block.append(heading,answer,explanation);solutions.append(block);
    }
    if(result.paperOnly){
      const comparison=element("div","exam-paper-comparison");
      const copy=element("details","exam-paper-review");
      copy.append(element("summary","","Relire ma feuille manuscrite"));
      const host=element("div");copy.append(host);
      if(!written||written.has(section.id)){
        copy.addEventListener("toggle",()=>{
          if(!copy.open||host.firstChild)return;
          try{mountNotebook(host,{context:sheetKey(result,section.id),adapter,
            title:"Ma copie — "+section.title,readOnly:true,paperOnly:true,checkingEnabled:false});
          }catch{host.textContent="La feuille sauvegardée n’a pas pu être chargée.";}
        });
        copy.open=Boolean(written)&&section===firstReview;
      }else host.append(element("p","helper","Aucun tracé sauvegardé dans cet exercice."));
      comparison.append(copy,solutions);
      details.append(comparison);
      details.open=section===firstReview;
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
      const saveStatus=element("p","exam-review-save-status");
      saveStatus.setAttribute("role","status");saveStatus.hidden=true;
      guide.append(saveStatus);
      for(let i=0;i<rubric.steps.length;i++){
        const step=rubric.steps[i],key=section.id+":"+step.id;
        const wrap=element("div","exam-reasoning-step");
        const heading=element("h4","","Étape "+(i+1)+" — "+step.prompt);
        wrap.append(heading,element("p","",step.model));
        const label=element("label","exam-check-label");
        const input=element("input");input.type="checkbox";input.checked=!!result.selfChecks?.[key];
        label.append(input,element("span","","J'ai réellement justifié cette étape dans ma copie"));
        wrap.append(label);
        heading.tabIndex=-1;
        revisionSteps.push({key,step,index,group:details,guide,heading});
        const targetLabel=element("label","exam-check-label");
        const target=element("input");target.type="checkbox";
        target.checked=result.reviewTargets?.[key]===true;
        targetLabel.append(target,element("span","","À retravailler"));
        wrap.append(targetLabel);
        function saveReviewChoice(control,update){
          try{
            if(!commitExam(update(store,result.examId,result.startedAt,key,control.checked)))throw new Error("Persistance impossible");
            const updated=store.history.find(x=>x.examId===result.examId&&x.startedAt===result.startedAt);
            result.selfChecks=updated.selfChecks;
            result.reviewTargets=updated.reviewTargets;
            input.checked=result.selfChecks?.[key]===true;
            target.checked=result.reviewTargets?.[key]===true;
            renderRevisionTargets(result,revisionSteps);
            renderRevisionHome();
            selfStatus.textContent=selfCheckText(countChecks(updated,exam));
            saveStatus.hidden=true;
          }catch{
            control.checked=!control.checked;
            saveStatus.textContent="La case n’a pas été enregistrée. Réessaie.";
            saveStatus.hidden=false;
          }
        }
        input.addEventListener("change",()=>saveReviewChoice(input,updateReviewCheck));
        target.addEventListener("change",()=>saveReviewChoice(target,updateReviewTarget));
        const link=element("a","","Approfondir ce chapitre ↗");
        link.href=courseUrl(step.lesson);
        link.target="_blank";link.rel="noopener noreferrer";wrap.append(link);
        guide.append(wrap);
      }
      details.append(guide);
    }
    details.append(element("p","exam-method","Critères de rédaction : "+src.method));
    if(result.paperOnly||section.earned<5){
      const suggestions=element("div","exam-remediation");
      suggestions.append(element("strong","",result.paperOnly?"Réviser les notions de cet exercice":"À retravailler"));
      for(const [label,path] of EXAM_LESSONS[section.id]||[]){
        const link=element("a","",label);
        link.href=courseUrl(path);
        link.target="_blank";link.rel="noopener noreferrer";
        suggestions.append(link);
        if(result.paperOnly&&hasPracticeQuestions(path)){
          const practiceLink=element("a","","S’entraîner · "+label);
          practiceLink.href=practiceUrlForCourse(path);
          suggestions.append(practiceLink);
        }
      }
      details.append(suggestions);
    }
    review.append(details);
  }
  renderRevisionTargets(result,revisionSteps);
  renderHistory();
  const selected=revisionKey&&revisionSteps.find(item=>item.key===revisionKey);
  if(selected){openRevisionStep(selected);return;}
  const scoreHeading=byId("examScore");
  scoreHeading.focus({preventScroll:true});
  scoreHeading.scrollIntoView({block:"start",behavior:"instant"});
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
  if(store.active){
    renderActive();
    if(store.active&&!store.active.paperOnly)focusExamSection();
    return;
  }
  const examId=byId("examSelect").value;
  const seed=isGeneratedExamId(examId)?createNewSeed(examId):null;
  const prior=store;
  store={...store,active:startExam(examId,Date.now(),seed,inputMode==="manuscrit")};
  if(!persist()){store=prior;return;}
  lastResult=null;
  alertExam("");renderActive();
  if(store.active&&!store.active.paperOnly)focusExamSection();
}
export function getExamBackup(){return store;}
export function restoreExamBackup(raw){
  // Les données sont déjà validées et écrites atomiquement par le module
  // principal ; ne pas créer une seconde écriture susceptible d'échouer.
  byId("examPaperSubmit")?.close();
  byId("examFormula")?.close();
  store=sanitizeExamStore(raw);
  if(initialized){lastResult=null;setVisible("examResult",false);renderActive();if(store.active&&hasExpired(store.active))finalize("timeout");}
}
export function clearExamProgress(){
  byId("examPaperSubmit")?.close();
  byId("examFormula")?.close();
  store=emptyExamStore();lastResult=null;
  if(initialized){setVisible("examResult",false);renderActive();}
}
export function initExams(storageAdapter,staleCallback=()=>{}){
  if(initialized)return;
  initialized=true;adapter=storageAdapter;onStale=staleCallback;load();
  installExamNotesKeyboard();
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
  byId("examUseKeyboard").addEventListener("click",()=>{
    if(!store.active?.paperOnly)return;
    if(hasExpired(store.active)){tick();return;}
    const {paperOnly,...active}=store.active;
    if(commitExam({...store,active})){
      renderExamSection();
      if(store.active)focusExamSection();
    }
  });
  byId("examPrev").addEventListener("click",()=>moveTo(Math.max(0,store.active.sectionIndex-1)));
  byId("examNext").addEventListener("click",()=>moveTo(Math.min(3,store.active.sectionIndex+1)));
  const formula=byId("examFormula");
  byId("examFormulaOpen").addEventListener("click",()=>{
    if(!store.active||hasExpired(store.active)){tick();return;}
    formula.showModal();
    void loadExamFormula();
  });
  byId("examFormulaClose").addEventListener("click",()=>formula.close());
  byId("examFormulaRetry").addEventListener("click",()=>void loadExamFormula());
  const paperSubmit=byId("examPaperSubmit");
  const paperSubmitError=byId("examPaperSubmitError");
  byId("examPaperContinue").addEventListener("click",()=>paperSubmit.close());
  byId("examPaperConfirm").addEventListener("click",()=>{
    if(!store.active?.paperOnly)return;
    finalize(hasExpired(store.active)?"timeout":"submitted");
    if(store.active){
      paperSubmitError.textContent="La remise n’a pas été enregistrée. Réessaie ou reviens à la copie.";
      paperSubmitError.hidden=false;
    }
  });
  byId("examSubmit").addEventListener("click",()=>{
    const session=store.active;
    if(!session)return;
    if(hasExpired(session)){finalize("timeout");return;}
    const exam=findExam(session.examId,session.seed??null);
    if(session.paperOnly){
      const written=writtenPaperSections(session);
      const empty=exam.sections.flatMap((section,index)=>written.has(section.id)?[]:[index+1]);
      byId("examPaperSubmitSummary").textContent=empty.length
        ?(empty.length===1?"Exercice sans tracé sauvegardé : ":"Exercices sans tracé sauvegardé : ")+empty.join(", ")+"."
        :"Les quatre exercices contiennent des tracés sauvegardés.";
      paperSubmitError.hidden=true;
      paperSubmit.showModal();
      return;
    }
    const draft=inspectExamDraft(exam,session);
    const format=formatWarning(draft.invalidAnswers);
    const text="Rendre définitivement la copie ?\n"+
      draft.answeredQuestions+"/"+draft.totalQuestions+" réponses saisies (justesse non vérifiée), "+
      draft.remainingQuestions+" sans réponse ("+draft.pointsUnanswered+" point(s) concernés).\n"+
      (format?format+". Une réponse au format invalide vaut 0 point.\n":"")+
      draft.sectionsWithNotes+"/4 exercices avec rédaction.\n"+
      "La note automatique est indicative et n'évalue pas les démonstrations. Afficher le corrigé ?";
    if(confirm(text))finalize(hasExpired(session)?"timeout":"submitted");
  });
  byId("examNew").addEventListener("click",()=>{
    lastResult=null;
    setVisible("examResult",false);
    renderActive();
    if(store.active&&!store.active.paperOnly)focusExamSection();
    else if(byId("examResult").hidden){
      const title=byId("exam-title");
      title.focus({preventScroll:true});
      title.scrollIntoView({block:"start",behavior:"instant"});
    }
  });
  window.addEventListener("pageshow",tick);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick();});
  renderActive();
  if(store.active&&hasExpired(store.active))finalize("timeout");
}
