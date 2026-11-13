/**
 * Cahier numérique DAEU B : texte + écriture au doigt/stylet.
 * Sauvegarde atomique dans le bundle progression / cloud / IndexedDB.
 * Les traits sont des coordonnées, jamais du HTML, SVG fourni par l'utilisateur ou du code.
 */
import {blankWork,changeWork,encodeStroke,parseStroke,readWork,PAPER_WIDTH,PAPER_HEIGHT} from "./workbook.mjs";
import {checkMathSteps} from "./math-step-checker.mjs";
import {renderMathPreview} from "./math-preview.mjs";

const SYMBOLS=["+","−","×","÷","=","(",")","²","√","π","≤","≥","≠","→","^","/"];
/** Modèles de rédaction éditables, utilisables sans clavier physique. */
export const MATH_TEMPLATES=Object.freeze([
  {label:"Fraction",value:"(numérateur)/(dénominateur)",selection:"numérateur"},
  {label:"Puissance",value:"(base)^(exposant)",selection:"base"},
  {label:"Racine",value:"√(expression)",selection:"expression"},
  {label:"Équation",value:"2x + 5 = 17\n2x = 12\nx = 6",selection:"2x + 5 = 17"},
  {label:"Second degré",value:"x² - 5x + 6 = 0\n(x - 2)(x - 3) = 0",selection:"x² - 5x + 6 = 0"},
  {label:"Système",value:"{\n  2x + y = 7\n  x − y = 2\n}",selection:"2x + y = 7"},
  {label:"Fonction",value:"f(x) = 3x² - 2x + 1\nf'(x) = 6x - 2",selection:"3x² - 2x + 1"},
  {label:"Dérivée avancée",value:"f(x) = (x+1)^3\nf'(x) = 3x² + 6x + 3",selection:"(x+1)^3"},
  {label:"Dérivée sin/cos",value:"f(x) = 2sin(3x+1)\nf'(x) = 6cos(3x+1)",selection:"2sin(3x+1)"},
  {label:"Dérivée exp",value:"f(x) = exp(2x-1)\nf'(x) = 2exp(2x-1)",selection:"exp(2x-1)"},
  {label:"Dérivée ln",value:"f(x) = ln(2x+1)\nf'(x) = 2/(2x+1)",selection:"ln(2x+1)"},
  {label:"Limite",value:"lim(x → a) f(x) = résultat",selection:"a"},
  {label:"Intégrale",value:"∫[a,b] f(x) dx = résultat",selection:"résultat"},
  {label:"Conclusion",value:"Donc, la solution est : ",selection:""}
]);
export function insertTemplate(value,template,start,end){
  if(!template||typeof template.value!=="string")throw Error("Modèle invalide");
  const inserted=insertAtSelection(value,template.value,start,end);
  const base=inserted.caret-template.value.length;
  const offset=template.selection?template.value.indexOf(template.selection):-1;
  if(offset<0)return {...inserted,start:inserted.caret,end:inserted.caret};
  return {...inserted,start:base+offset,end:base+offset+template.selection.length};
}
const MAX_TEXT=6000;
const MAX_POINTS=300;
export function notebookKey(context){
  if(typeof context!=="string"||!/^[-\w:.]{1,120}$/.test(context))
    throw new Error("Identifiant de brouillon invalide");
  return "daeu-b-notebook-v1:"+context;
}
export function insertAtSelection(value,symbol,start,end){
  const text=String(value).slice(0,MAX_TEXT);
  const a=Math.max(0,Math.min(text.length,Number(start)||0));
  const b=Math.max(a,Math.min(text.length,(Number.isFinite(Number(end))?Number(end):a)));
  const addition=String(symbol).slice(0,MAX_TEXT);
  const result=(text.slice(0,a)+addition+text.slice(b)).slice(0,MAX_TEXT);
  return {value:result,caret:Math.min(result.length,a+addition.length)};
}
function grid(ctx){
  ctx.fillStyle="#fff";ctx.fillRect(0,0,PAPER_WIDTH,PAPER_HEIGHT);
  ctx.beginPath();
  for(let x=0;x<=PAPER_WIDTH;x+=25){ctx.moveTo(x,0);ctx.lineTo(x,PAPER_HEIGHT);}
  for(let y=0;y<=PAPER_HEIGHT;y+=25){ctx.moveTo(0,y);ctx.lineTo(PAPER_WIDTH,y);}
  ctx.lineWidth=0.7;ctx.strokeStyle="#dce8f2";ctx.stroke();
}
function path(ctx,points){
  if(!points.length)return;
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.lineWidth=2.8;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#162c47";
  if(points.length===1){ctx.lineTo(points[0][0]+0.05,points[0][1]+0.05);}
  ctx.stroke();
}
export function mountNotebook(host,{context,adapter,storage=globalThis.localStorage,title="Mon cahier de calcul",checkingEnabled=true,onGuidance=()=>{},handwrittenReview=null}){
  if(!host)throw new Error("Emplacement de cahier absent");
  const legacyKey=notebookKey(context);
  if(!adapter||typeof adapter.snapshot!=="function"||typeof adapter.updateWorkbook!=="function")
    throw new Error("Stockage unifié du cahier indisponible");
  const section=document.createElement("section");section.className="math-notebook";
  const heading=document.createElement("h4");heading.textContent=title;
  const help=document.createElement("p");help.className="helper";
  help.textContent="Écris toute ta réponse sur la feuille agrandie au doigt ou au stylet ; fais défiler pour les équations longues. Tu peux valider cette réponse sans la recopier dans le champ classique. Tu peux aussi utiliser le clavier mathématique plus bas. Chaque trait est sauvegardé automatiquement. Une copie manuscrite se valide par comparaison au corrigé, sans reconnaissance automatique des tracés.";
  const status=document.createElement("p");status.className="helper math-notebook-status";status.setAttribute("role","status");
  let work=blankWork(),pageIndex=0;
  try{
    const book=adapter.snapshot().workbook;
    work=readWork(book,context);
    // Migration non destructive de l'ancien texte local, créé avant le cahier intégré.
    const old=storage?.getItem(legacyKey);
    if(!book.entries?.[context]&&old&&old.length<=MAX_TEXT){
      const migrated=changeWork(book,context,{...work,text:old});
      adapter.updateWorkbook(migrated);
      work=readWork(migrated,context);
      try{storage.removeItem(legacyKey);}catch{}
    }else if(!book.entries?.[context]&&old&&old.length>MAX_TEXT)
      status.textContent="Ancien brouillon trop long : conservé sans modification dans l'ancien stockage.";
  }catch(error){status.textContent="Le cahier n'a pas pu être chargé : "+error.message;}
  const field=document.createElement("textarea");
  field.className="math-notebook-editor";field.rows=8;field.maxLength=MAX_TEXT;field.spellcheck=false;
  field.setAttribute("aria-label",title+" — étapes rédigées");
  field.placeholder="Exemple :\n2x + 5 = 17\n2x = 12\nx = 6\nVérification : 2 × 6 + 5 = 17";
  field.value=work.text;
  const preview=document.createElement("details");preview.className="math-notebook-preview";preview.open=true;
  const previewHeading=document.createElement("summary");
  previewHeading.textContent="Aperçu mathématique comme sur une copie";
  const previewBody=document.createElement("div");previewBody.className="math-notebook-preview-body";
  previewBody.setAttribute("aria-label","Aperçu visuel des équations et calculs saisis");
  preview.append(previewHeading,previewBody);
  renderMathPreview(previewBody,field.value);
  const keypad=document.createElement("div");keypad.className="math-notebook-keypad";
  keypad.setAttribute("role","group");keypad.setAttribute("aria-label","Symboles mathématiques");
  function persist(next){
    try{
      const current=adapter.snapshot().workbook;
      const updated=changeWork(current,context,next);
      adapter.updateWorkbook(updated);
      work=next;status.textContent="Cahier enregistré automatiquement avec la progression.";
      // Ne jamais afficher un ancien verdict après une édition par touche ou modèle.
      if(typeof feedback!=="undefined")feedback.hidden=true;
      renderMathPreview(previewBody,field.value);
      return true;
    }catch(error){
      status.textContent="Cahier non enregistré : "+error.message+". Recharge si la progression a changé dans un autre onglet.";
      return false;
    }
  }
  field.addEventListener("input",()=>{
    const next={...work,text:field.value};
    if(!persist(next))field.value=work.text;
  });
  for(const symbol of SYMBOLS){
    const button=document.createElement("button");button.type="button";
    button.className="subtle small";button.textContent=symbol;button.setAttribute("aria-label","Insérer "+symbol);
    button.addEventListener("click",()=>{
      const next=insertAtSelection(field.value,symbol,field.selectionStart,field.selectionEnd);
      field.value=next.value;field.focus();field.setSelectionRange(next.caret,next.caret);
      if(!persist({...work,text:field.value}))field.value=work.text;
    });keypad.append(button);
  }
  const templates=document.createElement("div");templates.className="math-notebook-templates";
  templates.setAttribute("role","group");templates.setAttribute("aria-label","Modèles de rédaction mathématique");
  for(const template of MATH_TEMPLATES){
    const button=document.createElement("button");button.type="button";button.className="subtle small";
    button.textContent=template.label;button.setAttribute("aria-label","Insérer un modèle : "+template.label);
    button.addEventListener("click",()=>{
      const inserted=insertTemplate(field.value,template,field.selectionStart,field.selectionEnd);
      field.value=inserted.value;field.focus();field.setSelectionRange(inserted.start,inserted.end);
      if(!persist({...work,text:field.value}))field.value=work.text;
    });templates.append(button);
  }
  const newline=document.createElement("button");newline.type="button";newline.className="subtle small";newline.textContent="Nouvelle ligne";
  newline.addEventListener("click",()=>{
    const next=insertAtSelection(field.value,"\n",field.selectionStart,field.selectionEnd);
    field.value=next.value;field.focus();field.setSelectionRange(next.caret,next.caret);
    if(!persist({...work,text:field.value}))field.value=work.text;
  });keypad.append(newline);
  const correction=document.createElement("section");correction.className="math-notebook-checker";
  correction.setAttribute("aria-label","Correction guidée des lignes");
  const correctionTitle=document.createElement("h5");correctionTitle.textContent="Correction guidée des étapes";
  const explanation=document.createElement("p");explanation.className="helper";
  explanation.textContent="Vérifie les calculs, les équations du premier et du second degré et les dérivées polynomiales (degré 0 à 6) ou usuelles : sin(ax+b), cos(ax+b), exp(ax+b), ln(ax+b), multipliées par une constante. Écris f(x) = ... puis f'(x) = ... sans ligne vide. Les coefficients sont comparés exactement. Les combinaisons plus complexes et les démonstrations ne sont pas vérifiées ; pour ln, respecte le domaine ax+b > 0.";
  const verify=document.createElement("button");verify.type="button";verify.className="subtle";
  verify.textContent="Vérifier mes étapes";
  const feedback=document.createElement("div");feedback.className="math-notebook-feedback";feedback.hidden=true;
  feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
  verify.addEventListener("click",()=>{
    const review=checkMathSteps(field.value);
    feedback.replaceChildren();
    const summary=document.createElement("p");
    summary.textContent=review.checked
      ?review.checked+" ligne(s) analysée(s), "+review.errors+" erreur(s) détectée(s) dans le périmètre pris en charge."
      :"Aucune égalité exploitable trouvée. Écris par exemple : 2x + 5 = 17, puis 2x = 12, puis x = 6.";
    feedback.append(summary);
    if(review.entries.length){
      const list=document.createElement("ol");list.className="math-notebook-review-list";
      for(const entry of review.entries){
        const item=document.createElement("li");item.dataset.result=entry.kind;
        item.textContent=(entry.line?"Ligne "+entry.line+" — ":"")+entry.message;
        list.append(item);
      }
      feedback.append(list);
    }
    const caveat=document.createElement("p");caveat.className="helper";
    caveat.textContent="Ce contrôle ne certifie ni la justesse du raisonnement complet ni la maîtrise de la notion. Les lignes non prises en charge restent à vérifier avec le corrigé.";
    feedback.append(caveat);feedback.hidden=false;
    if(review.checked>0)onGuidance();
  });
  correction.append(correctionTitle,explanation,verify,feedback);
  if(!checkingEnabled)correction.hidden=true;
  field.addEventListener("input",()=>{feedback.hidden=true;});
  const drawLabel=document.createElement("strong");drawLabel.textContent="Feuille quadrillée — écrire au doigt ou au stylet";
  const controls=document.createElement("div");controls.className="math-notebook-pages";
  const prev=document.createElement("button");prev.type="button";prev.className="subtle small";prev.textContent="Page précédente";
  const nextPage=document.createElement("button");nextPage.type="button";nextPage.className="subtle small";nextPage.textContent="Page suivante";
  const addPage=document.createElement("button");addPage.type="button";addPage.className="subtle small";addPage.textContent="Ajouter une page";
  const undo=document.createElement("button");undo.type="button";undo.className="subtle small";undo.textContent="Annuler le dernier trait";
  const clear=document.createElement("button");clear.type="button";clear.className="subtle small";clear.textContent="Effacer cette page";
  const indicator=document.createElement("span");indicator.className="helper math-notebook-page-indicator";
  const canvas=document.createElement("canvas");canvas.className="math-notebook-canvas";
  const sheetViewport=document.createElement("div");sheetViewport.className="math-notebook-sheet-viewport";
  sheetViewport.tabIndex=0;
  sheetViewport.setAttribute("role","region");
  sheetViewport.setAttribute("aria-label","Grande feuille quadrillée défilante pour longues équations");
  sheetViewport.append(canvas);
  const sheetControls=document.createElement("div");sheetControls.className="math-notebook-view-tools";
  const moveLeft=document.createElement("button");moveLeft.type="button";moveLeft.className="subtle small";
  moveLeft.textContent="← Vers la gauche";
  const moveRight=document.createElement("button");moveRight.type="button";moveRight.className="subtle small";
  moveRight.textContent="Vers la droite →";
  const moveMode=document.createElement("button");moveMode.type="button";moveMode.className="subtle small";
  const moveUp=document.createElement("button");moveUp.type="button";moveUp.className="subtle small";
  moveUp.textContent="↑ Monter";
  const moveDown=document.createElement("button");moveDown.type="button";moveDown.className="subtle small";
  moveDown.textContent="↓ Descendre";
  moveMode.textContent="Déplacer au doigt";
  moveMode.setAttribute("aria-pressed","false");
  let panMode=false;
  moveLeft.addEventListener("click",()=>sheetViewport.scrollBy({left:-Math.max(180,sheetViewport.clientWidth*.8),behavior:"smooth"}));
  moveRight.addEventListener("click",()=>sheetViewport.scrollBy({left:Math.max(180,sheetViewport.clientWidth*.8),behavior:"smooth"}));
  moveUp.addEventListener("click",()=>sheetViewport.scrollBy({top:-Math.max(180,sheetViewport.clientHeight*.75),behavior:"smooth"}));
  moveDown.addEventListener("click",()=>sheetViewport.scrollBy({top:Math.max(180,sheetViewport.clientHeight*.75),behavior:"smooth"}));
  moveMode.addEventListener("click",()=>{
    panMode=!panMode;
    canvas.classList.toggle("is-panning",panMode);
    moveMode.setAttribute("aria-pressed",String(panMode));
    moveMode.textContent=panMode?"Reprendre le stylo":"Déplacer au doigt";
  });
  sheetControls.append(moveLeft,moveRight,moveUp,moveDown,moveMode);
  const sheetHelp=document.createElement("p");sheetHelp.className="helper";
  sheetHelp.textContent="Grande feuille 900 × 1200 : utilise les flèches pour te déplacer horizontalement et verticalement. Active « Déplacer au doigt », puis « Reprendre le stylo » pour continuer à écrire. Tu peux ajouter jusqu’à huit pages.";
  canvas.width=PAPER_WIDTH;canvas.height=PAPER_HEIGHT;
  canvas.tabIndex=0;
  canvas.setAttribute("role","img");canvas.setAttribute("aria-label","Feuille de calcul quadrillée. Trace les équations avec le doigt ou un stylet.");
  const ctx=canvas.getContext("2d");
  let drawing=null,activePointer=null;
  function paint(){
    if(!ctx)return;
    grid(ctx);
    for(const stroke of work.pages[pageIndex]){
      try{path(ctx,parseStroke(stroke));}catch{/* Les données ont déjà été validées à la lecture. */}
    }
    if(drawing)path(ctx,drawing);
  }
  function renderPages(){
    prev.disabled=pageIndex===0;nextPage.disabled=pageIndex===work.pages.length-1;
    addPage.disabled=work.pages.length>=8;
    undo.disabled=work.pages[pageIndex].length===0;
    clear.disabled=undo.disabled;
    indicator.textContent="Page "+(pageIndex+1)+"/"+work.pages.length;
    paint();
  }
  function editPage(fn){
    const updated={text:work.text,pages:work.pages.map(page=>[...page])};
    fn(updated);
    if(persist(updated))renderPages();
  }
  prev.addEventListener("click",()=>{if(pageIndex>0){pageIndex--;renderPages();}});
  nextPage.addEventListener("click",()=>{if(pageIndex<work.pages.length-1){pageIndex++;renderPages();}});
  addPage.addEventListener("click",()=>{
    if(work.pages.length>=8)return;
    editPage(w=>w.pages.push([]));
    if(work.pages.length>pageIndex+1){pageIndex=work.pages.length-1;renderPages();}
  });
  undo.addEventListener("click",()=>editPage(w=>{w.pages[pageIndex].pop();}));
  clear.addEventListener("click",()=>{
    if(!confirm("Effacer tous les traits de cette page ? Le texte et les autres pages seront conservés."))return;
    editPage(w=>{w.pages[pageIndex]=[];});
  });
  function pointOf(event){
    const rect=canvas.getBoundingClientRect();
    return [
      Math.max(0,Math.min(PAPER_WIDTH,Math.round((event.clientX-rect.left)*PAPER_WIDTH/rect.width))),
      Math.max(0,Math.min(PAPER_HEIGHT,Math.round((event.clientY-rect.top)*PAPER_HEIGHT/rect.height)))
    ];
  }
  canvas.addEventListener("pointerdown",event=>{
    if(panMode||activePointer!==null||event.button!==0||work.pages[pageIndex].length>=100)return;
    event.preventDefault();activePointer=event.pointerId;drawing=[pointOf(event)];
    canvas.setPointerCapture(event.pointerId);paint();
  });
  canvas.addEventListener("pointermove",event=>{
    if(activePointer!==event.pointerId||!drawing)return;
    const point=pointOf(event),last=drawing.at(-1);
    if((Math.abs(point[0]-last[0])+Math.abs(point[1]-last[1]))<2)return;
    if(drawing.length<MAX_POINTS)drawing.push(point);
    paint();
  });
  const finish=event=>{
    if(activePointer!==event.pointerId||!drawing)return;
    event.preventDefault();const stroke=drawing;
    activePointer=null;drawing=null;
    if(stroke.length&&work.pages[pageIndex].length<100){
      editPage(w=>w.pages[pageIndex].push(encodeStroke(stroke)));
    }else renderPages();
  };
  canvas.addEventListener("pointerup",finish);
  canvas.addEventListener("pointercancel",finish);
  controls.append(prev,nextPage,addPage,undo,clear,indicator);
  const quickValidate=document.createElement("button");quickValidate.type="button";
  quickValidate.className="primary math-notebook-quick-validate";
  quickValidate.textContent="Valider ma réponse sur la feuille";
  quickValidate.hidden=!handwrittenReview;
  const manual=document.createElement("section");manual.className="math-notebook-manual";
  manual.hidden=!handwrittenReview;
  if(handwrittenReview){
    if(typeof handwrittenReview.expected!=="string"||typeof handwrittenReview.explanation!=="string"
      ||typeof handwrittenReview.onDecision!=="function")
      throw Error("Correction manuscrite mal configurée");
    const manualTitle=document.createElement("h5");manualTitle.textContent="Valider ma réponse écrite sur la feuille";
    const manualIntro=document.createElement("p");manualIntro.className="helper";
    manualIntro.textContent="Après avoir écrit, affiche le corrigé et compare-le à tes propres lignes. Pas besoin de remplir le champ de réponse. L'application ne lit pas encore les tracés manuscrits : cette validation est une auto-évaluation et ne confirme pas la maîtrise.";
    const reveal=document.createElement("button");reveal.type="button";reveal.className="primary";
    reveal.textContent="Afficher le corrigé et valider ma feuille";
    const manualStatus=document.createElement("p");manualStatus.className="helper";manualStatus.setAttribute("role","status");
    const comparison=document.createElement("div");comparison.className="math-notebook-manual-comparison";comparison.hidden=true;
    const answerTitle=document.createElement("strong");answerTitle.textContent="Réponse attendue :";
    const answer=document.createElement("p");answer.className="math-notebook-expected";
    answer.textContent=handwrittenReview.expected;
    const explanationTitle=document.createElement("strong");explanationTitle.textContent="Correction détaillée :";
    const detail=document.createElement("p");detail.className="math-notebook-explanation";
    detail.textContent=handwrittenReview.explanation;
    const compareInstruction=document.createElement("p");compareInstruction.className="helper";
    compareInstruction.textContent="Sur la feuille, avais-tu trouvé cette réponse, avec le bon raisonnement ? Ta déclaration ne comptera pas comme une maîtrise autonome vérifiée.";
    const decisions=document.createElement("div");decisions.className="math-notebook-manual-decisions";
    const success=document.createElement("button");success.type="button";success.className="subtle";
    success.textContent="Oui, ma réponse correspond";
    const failure=document.createElement("button");failure.type="button";failure.className="subtle";
    failure.textContent="Non, je dois retravailler";
    const decide=correct=>{
      try{
        if(handwrittenReview.onDecision(correct)===false){
          manualStatus.textContent="La validation n'a pas été enregistrée. Vérifie la sauvegarde et réessaie.";
          return;
        }
        success.disabled=true;failure.disabled=true;
        manualStatus.textContent="Auto-évaluation de la feuille enregistrée avec ta progression.";
      }catch(error){manualStatus.textContent="Validation impossible : "+error.message;}
    };
    success.addEventListener("click",()=>decide(true));
    failure.addEventListener("click",()=>decide(false));
    reveal.addEventListener("click",()=>{
      if(!work.pages.some(page=>page.length)){
        manualStatus.textContent="Trace d'abord ta réponse sur la feuille quadrillée (au moins un trait), puis valide.";
        return;
      }
      const proceed=handwrittenReview.onRevealed?.();
      if(proceed===false){
        manualStatus.textContent="Impossible de sauvegarder la consultation du corrigé. Réessaie avant de poursuivre.";
        return;
      }
      reveal.disabled=true;quickValidate.disabled=true;
      comparison.hidden=false;
      manualStatus.textContent="Corrigé affiché. Compare ta réponse manuscrite, puis indique ton résultat.";
    });
    quickValidate.addEventListener("click",()=>{
      reveal.click();
      if(!comparison.hidden)comparison.scrollIntoView({behavior:"smooth",block:"nearest"});
      else manualStatus.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
    decisions.append(success,failure);
    comparison.append(answerTitle,answer,explanationTitle,detail,compareInstruction,decisions);
    manual.append(manualTitle,manualIntro,reveal,manualStatus,comparison);
  }
  const editorDetails=document.createElement("details");editorDetails.className="math-notebook-editor-disclosure";editorDetails.open=true;
  const editorSummary=document.createElement("summary");editorSummary.textContent="Clavier mathématique et vérification des étapes (facultatif)";
  editorDetails.append(editorSummary,keypad,templates,field,preview,correction);
  section.append(heading,help,drawLabel,quickValidate,controls,sheetControls,sheetViewport,sheetHelp,manual,status,editorDetails);
  host.replaceChildren(section);renderPages();
  return {element:section,field,canvas,save:()=>persist({...work,text:field.value})};
}
