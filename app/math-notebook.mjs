/**
 * Cahier numérique DAEU B : texte + écriture au doigt/stylet.
 * Sauvegarde atomique dans le bundle progression / cloud / IndexedDB.
 * Les traits sont des coordonnées, jamais du HTML, SVG fourni par l'utilisateur ou du code.
 */
import {blankWork,changeWork,encodeStroke,parseStroke,readWork,PAPER_WIDTH,PAPER_HEIGHT,MAX_PAGE_STROKES} from "./workbook.mjs";
import {checkMathSteps} from "./math-step-checker.mjs";
import {renderMathPreview} from "./math-preview.mjs";
import {recognizeBottomNumericInk,recognizeNumericInk,recognizeStackedFractionInk} from "./numeric-ink.mjs";
import {recognizeEquationInk,extractFinalNumericAnswer,recognizeFinalEquationInk} from "./equation-ink.mjs";
import {INK_EDIT_SYMBOLS,validateInkTranscript,editInkTranscript} from "./ink-transcript.mjs";
import {nearestInkStroke} from "./ink-eraser.mjs";
import {pageInkFingerprint} from "./ink-drafts.mjs";

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
const VIEW_KEY="daeu-b-paper-views-v1";
const ZOOM_LEVELS=[["100","Largeur de l’écran"],["150","Zoom 1,5×"],["200","Zoom 2×"],["300","Zoom 3×"]];
function savedPaperViews(storage){
  try{
    const entries=JSON.parse(storage.getItem(VIEW_KEY)??"[]");
    if(Array.isArray(entries))return new Map(entries.slice(-80));
  }catch{/* Une préférence locale illisible ne bloque pas le cahier. */}
  return new Map();
}
function readPaperView(storage,context,pageCount){
  const view=savedPaperViews(storage).get(context);
  if(!view||!Number.isInteger(view.page)||view.page<0||view.page>=pageCount
    ||!ZOOM_LEVELS.some(([zoom])=>zoom===view.zoom)
    ||!Number.isFinite(view.left)||view.left<0||view.left>1
    ||!Number.isFinite(view.top)||view.top<0||view.top>1
    ||typeof view.writing!=="boolean")return null;
  return view;
}
function writePaperView(storage,context,view){
  try{
    const views=savedPaperViews(storage);
    views.delete(context);
    views.set(context,view);
    storage.setItem(VIEW_KEY,JSON.stringify([...views].slice(-80)));
  }catch{/* La sauvegarde des traits est indépendante de ce réglage. */}
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
export function mountNotebook(host,{context,adapter,storage=globalThis.localStorage,title="Mon cahier de calcul",checkingEnabled=true,onGuidance=()=>{},handwrittenReview=null,paperOnly=false,paperPrompt="",readOnly=false,showEditor=!paperOnly}){
  if(!host)throw new Error("Emplacement de cahier absent");
  const legacyKey=notebookKey(context);
  if(!adapter||typeof adapter.snapshot!=="function"||typeof adapter.updateWorkbook!=="function")
    throw new Error("Stockage unifié du cahier indisponible");
  const section=document.createElement("section");section.className="math-notebook"+(paperOnly?" is-paper-only":"")+(readOnly?" is-read-only":"");
  const heading=document.createElement("h4");heading.textContent=title;
  const help=document.createElement("p");help.className="helper";
  help.textContent="Écris sur la grande feuille au doigt ou au stylet. Tu peux corriger un trait avec la gomme, puis vérifier tes équations. Si un symbole est mal lu, corrige la transcription en touchant les symboles proposés, sans clavier ni ressaisie de la copie. Chaque modification de la feuille est sauvegardée automatiquement. La reconnaissance reste expérimentale : vérifie-la avant toute notation.";
  const status=document.createElement("p");status.className="helper math-notebook-status";status.setAttribute("role","status");
  function showSheetStatus(message,kind="info"){
    status.textContent=message;
    status.classList.toggle("math-notebook-save-ok",kind==="saved");
    status.classList.toggle("math-notebook-save-error",kind==="error");
  }
  let work=blankWork(),pageIndex=0;
  let invalidateRecognition=()=>{};
  try{
    const book=adapter.snapshot().workbook;
    work=readWork(book,context);
    // Migration non destructive de l'ancien texte local, créé avant le cahier intégré.
    const old=storage?.getItem(legacyKey);
    if(!readOnly&&!book.entries?.[context]&&old&&old.length<=MAX_TEXT){
      const migrated=changeWork(book,context,{...work,text:old});
      adapter.updateWorkbook(migrated);
      work=readWork(migrated,context);
      try{storage.removeItem(legacyKey);}catch{}
    }else if(!book.entries?.[context]&&old&&old.length>MAX_TEXT)
      status.textContent="Ancien brouillon trop long : conservé sans modification dans l'ancien stockage.";
  }catch(error){
    if(readOnly)throw error;
    showSheetStatus("Le cahier n’a pas pu être chargé. "+error.message,"error");
  }
  const resumeView=paperOnly&&!readOnly?readPaperView(storage,context,work.pages.length):null;
  if(paperOnly&&!readOnly)
    pageIndex=resumeView?.page??Math.max(0,work.pages.findLastIndex(page=>page.length>0));
  let restorePaperView=()=>{};
  let savePaperView=()=>{};
  let syncPageNavigation=()=>{};
  let returnToWriting=()=>{};
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
  function persist(next,{keepReading=false}={}){
    try{
      const current=adapter.snapshot().workbook;
      const updated=changeWork(current,context,next);
      adapter.updateWorkbook(updated);
      work=next;if(!keepReading)invalidateRecognition();
      showSheetStatus("Cahier enregistré automatiquement avec la progression.","saved");
      // Ne jamais afficher un ancien verdict après une édition par touche ou modèle.
      if(typeof feedback!=="undefined")feedback.hidden=true;
      renderMathPreview(previewBody,field.value);
      return true;
    }catch(error){
      const detail=error.name==="QuotaExceededError"
        ?"Le stockage du navigateur est plein."
        :error.message;
      showSheetStatus("Modification non enregistrée. Ta dernière copie sauvegardée est conservée. "+detail,"error");
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
  explanation.textContent="Vérifie les calculs, les équations du premier et du second degré, certaines équations rationnelles (valeurs interdites), les racines carrées isolées (solutions parasites) et les dérivées polynomiales (degré 0 à 6) ou usuelles : sin(ax+b), cos(ax+b), exp(ax+b), ln(ax+b), multipliées par une constante. Écris f(x) = ... puis f'(x) = ... sans ligne vide. Les coefficients sont comparés exactement. Les combinaisons plus complexes et les démonstrations ne sont pas vérifiées ; pour ln, respecte le domaine ax+b > 0.";
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
  const eraser=document.createElement("button");eraser.type="button";eraser.className="subtle small";
  eraser.textContent="Gomme : effacer un trait";eraser.setAttribute("aria-pressed","false");
  const indicator=document.createElement("span");indicator.className="helper math-notebook-page-indicator";
  const canvas=document.createElement("canvas");canvas.className="math-notebook-canvas";
  const sheetViewport=document.createElement("div");sheetViewport.className="math-notebook-sheet-viewport";
  sheetViewport.tabIndex=0;
  sheetViewport.setAttribute("role","region");
  sheetViewport.setAttribute("aria-label","Grande feuille quadrillée défilante pour longues équations");
  let paper=null;
  if(paperOnly){
    paper=document.createElement("div");paper.className="math-notebook-paper";
    const print=document.createElement("header");print.className="math-notebook-paper-heading";
    const label=document.createElement("strong");label.textContent=title;print.append(label);
    if(paperPrompt){const prompt=document.createElement("p");prompt.className="math-notebook-paper-prompt";prompt.textContent=String(paperPrompt).slice(0,12000);print.append(prompt);}
    const note=document.createElement("p");note.className="math-notebook-paper-instruction";
    note.textContent=readOnly?"Copie en lecture seule":"Sauvegarde automatique · Glisse à deux doigts pour déplacer la feuille.";
    print.append(note);paper.append(print,canvas);sheetViewport.append(paper);
  }else sheetViewport.append(canvas);
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
  moveMode.textContent=paperOnly?"Déplacer":"Déplacer au doigt";
  moveMode.setAttribute("aria-pressed","false");
  let panMode=false,eraserMode=false,lastErasure=null;
  moveLeft.addEventListener("click",()=>sheetViewport.scrollBy({left:-Math.max(180,sheetViewport.clientWidth*.8),behavior:"smooth"}));
  moveRight.addEventListener("click",()=>sheetViewport.scrollBy({left:Math.max(180,sheetViewport.clientWidth*.8),behavior:"smooth"}));
  moveUp.addEventListener("click",()=>sheetViewport.scrollBy({top:-Math.max(180,sheetViewport.clientHeight*.75),behavior:"smooth"}));
  moveDown.addEventListener("click",()=>sheetViewport.scrollBy({top:Math.max(180,sheetViewport.clientHeight*.75),behavior:"smooth"}));
  function enableEraser(enabled){
    eraserMode=enabled;
    eraser.setAttribute("aria-pressed",String(enabled));
    eraser.textContent=paperOnly?"Gomme":enabled?"Reprendre le stylo":"Gomme : effacer un trait";
    canvas.classList.toggle("is-erasing",enabled);
  }
  eraser.addEventListener("click",()=>{
    const enabled=!eraserMode;
    if(enabled && panMode){
      panMode=false;canvas.classList.remove("is-panning");
      moveMode.setAttribute("aria-pressed","false");moveMode.textContent=paperOnly?"Déplacer":"Déplacer au doigt";
    }
    enableEraser(enabled);
    if(paperOnly)updateWritingMode();
  });
  moveMode.addEventListener("click",()=>{
    if(eraserMode)enableEraser(false);
    panMode=!panMode;
    canvas.classList.toggle("is-panning",panMode);
    moveMode.setAttribute("aria-pressed",String(panMode));
    moveMode.textContent=paperOnly?"Déplacer":panMode?"Reprendre le stylo":"Déplacer au doigt";
    if(paperOnly)updateWritingMode();
  });
  const pen=document.createElement("button");
  pen.type="button";pen.className="subtle small";pen.textContent="Stylo";
  function updateWritingMode(){
    pen.setAttribute("aria-pressed",String(!eraserMode&&!panMode));
  }
  pen.addEventListener("click",()=>{
    if(panMode)moveMode.click();
    else if(eraserMode)eraser.click();
  });
  sheetControls.append(moveLeft,moveRight,moveUp,moveDown,moveMode,eraser);
  const sheetHelp=document.createElement("p");sheetHelp.className="helper";
  sheetHelp.textContent="Grande feuille 900 × 1200. Déplace-toi avec les flèches ou le mode déplacement. Pour corriger un symbole ancien, active « Gomme : effacer un trait », touche uniquement le trait concerné, puis reprends le stylo. Tu peux annuler cet effacement. Jusqu’à huit pages disponibles.";
  canvas.width=PAPER_WIDTH;canvas.height=PAPER_HEIGHT;
  if(readOnly)canvas.classList.add("is-panning");
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
    invalidateRecognition();
    prev.disabled=pageIndex===0;nextPage.disabled=pageIndex===work.pages.length-1;
    addPage.disabled=work.pages.length>=8;
    undo.disabled=work.pages[pageIndex].length===0&&!lastErasure;
    const undoLabel=lastErasure?"Annuler l’effacement":"Annuler le dernier trait";
    undo.textContent=paperOnly?"Annuler":undoLabel;
    undo.setAttribute("aria-label",undoLabel);
    clear.disabled=work.pages[pageIndex].length===0;
    indicator.textContent="Page "+(pageIndex+1)+"/"+work.pages.length;
    syncPageNavigation();
    paint();
  }
  function editPage(fn){
    const updated={...work,pages:work.pages.map(page=>[...page])};
    fn(updated);
    // Toute modification d'une page rend sa transcription précédente caduque.
    if(updated.inkDrafts){
      const validDrafts={...updated.inkDrafts};
      for(const key of Object.keys(validDrafts)){
        const index=Number(key);
        if(index>=updated.pages.length||validDrafts[key].source!==pageInkFingerprint(updated.pages[index]))
          delete validDrafts[key];
      }
      if(Object.keys(validDrafts).length)updated.inkDrafts=validDrafts;
      else delete updated.inkDrafts;
    }
    const saved=persist(updated);
    if(saved)renderPages();
    else paint();
    return saved;
  }
  function goToPage(index){
    lastErasure=null;pageIndex=index;
    sheetViewport.scrollTo({top:0,left:0,behavior:"instant"});
    renderPages();
    savePaperView();
  }
  prev.addEventListener("click",()=>{if(pageIndex>0)goToPage(pageIndex-1);});
  nextPage.addEventListener("click",()=>{if(pageIndex<work.pages.length-1)goToPage(pageIndex+1);});
  addPage.addEventListener("click",()=>{
    if(work.pages.length>=8)return;
    if(!editPage(w=>w.pages.push([])))return;
    goToPage(work.pages.length-1);
    if(paperOnly)returnToWriting();
  });
  undo.addEventListener("click",()=>{
    if(lastErasure){
      const erased=lastErasure;
      const before=work;
      editPage(w=>w.pages[pageIndex].splice(erased.index,0,erased.stroke));
      if(work!==before)lastErasure=null;
      renderPages();
      return;
    }
    editPage(w=>{w.pages[pageIndex].pop();});
  });
  clear.addEventListener("click",()=>{
    if(!confirm("Effacer tous les traits de cette page ? Le texte et les autres pages seront conservés."))return;
    lastErasure=null;editPage(w=>{w.pages[pageIndex]=[];});
  });
  function pointOf(event){
    const rect=canvas.getBoundingClientRect();
    return [
      Math.max(0,Math.min(PAPER_WIDTH,Math.round((event.clientX-rect.left)*PAPER_WIDTH/rect.width))),
      Math.max(0,Math.min(PAPER_HEIGHT,Math.round((event.clientY-rect.top)*PAPER_HEIGHT/rect.height)))
    ];
  }
  const fingers=new Map();
  let twoFingerPan=false,panAnchor=null;
  function anchorTwoFingers(){
    const [first,second]=fingers.values();
    panAnchor=second?{
      x:(first.x+second.x)/2,y:(first.y+second.y)/2,
      left:sheetViewport.scrollLeft,top:sheetViewport.scrollTop
    }:null;
  }
  function stopTouch(event){
    if(!fingers.delete(event.pointerId))return;
    if(fingers.size===0)twoFingerPan=false;
    if(twoFingerPan)anchorTwoFingers();
    else panAnchor=null;
  }
  canvas.addEventListener("pointerdown",event=>{
    if(readOnly||panMode||event.button!==0)return;
    if(paperOnly&&!eraserMode&&event.pointerType==="touch"){
      // L’arrivée du deuxième doigt transforme le trait en déplacement.
      if(activePointer!==null&&!fingers.has(activePointer))return;
      fingers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(fingers.size>=2||twoFingerPan){
        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);
        twoFingerPan=true;
        anchorTwoFingers();
        activePointer=null;
        drawing=null;
        paint();
        return;
      }
    }
    if(activePointer!==null||twoFingerPan)return;
    if(eraserMode){
      event.preventDefault();
      const index=nearestInkStroke(work.pages[pageIndex],pointOf(event));
      if(index===null){showSheetStatus("Aucun trait assez proche : touche le symbole à effacer.");return;}
      const erased=work.pages[pageIndex][index],before=work;
      editPage(w=>w.pages[pageIndex].splice(index,1));
      if(work!==before){
        lastErasure={index,stroke:erased};
        showSheetStatus("Un trait effacé. Tu peux annuler ou reprendre le stylo.");
        renderPages();
      }
      return;
    }
    if(work.pages[pageIndex].length>=MAX_PAGE_STROKES){
      showSheetStatus("Cette page est pleine : ajoute une page pour continuer ton calcul.");
      return;
    }
    event.preventDefault();activePointer=event.pointerId;drawing=[pointOf(event)];
    canvas.setPointerCapture(event.pointerId);paint();
  });
  canvas.addEventListener("pointermove",event=>{
    if(fingers.has(event.pointerId)){
      fingers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(twoFingerPan){
        if(panAnchor){
          const [first,second]=fingers.values();
          sheetViewport.scrollLeft=panAnchor.left+panAnchor.x-(first.x+second.x)/2;
          sheetViewport.scrollTop=panAnchor.top+panAnchor.y-(first.y+second.y)/2;
        }
        return;
      }
    }
    if(activePointer!==event.pointerId||!drawing)return;
    const point=pointOf(event),last=drawing.at(-1);
    if((Math.abs(point[0]-last[0])+Math.abs(point[1]-last[1]))<2)return;
    if(drawing.length<MAX_POINTS)drawing.push(point);
    paint();
  });
  // Le doigt garde le défilement natif ; la souris et le stylet
  // peuvent faire glisser la feuille en mode Déplacer.
  let drag=null;
  canvas.addEventListener("pointerdown",event=>{
    if(!paperOnly||(!panMode&&!readOnly)||event.pointerType==="touch"||event.button!==0)return;
    event.preventDefault();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,
      left:sheetViewport.scrollLeft,top:sheetViewport.scrollTop};
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove",event=>{
    if(drag?.id!==event.pointerId)return;
    sheetViewport.scrollLeft=drag.left+drag.x-event.clientX;
    sheetViewport.scrollTop=drag.top+drag.y-event.clientY;
  });
  canvas.addEventListener("lostpointercapture",event=>{
    if(drag?.id!==event.pointerId)return;
    drag=null;
    canvas.classList.remove("is-dragging");
  });
  const finish=event=>{
    stopTouch(event);
    if(activePointer!==event.pointerId||!drawing)return;
    event.preventDefault();const stroke=drawing;
    activePointer=null;drawing=null;
    if(stroke.length&&work.pages[pageIndex].length<MAX_PAGE_STROKES){
      lastErasure=null;
      editPage(w=>w.pages[pageIndex].push(encodeStroke(stroke)));
    }else renderPages();
  };
  canvas.addEventListener("pointerup",finish);
  // Android peut interrompre un geste (changement d'application, appel, scroll).
  // Ne jamais sauvegarder comme résultat un trait interrompu.
  const cancelStroke=event=>{
    stopTouch(event);
    if(activePointer!==event.pointerId)return;
    activePointer=null;drawing=null;paint();
    showSheetStatus("Geste interrompu : aucun trait incomplet n’a été enregistré.");
  };
  canvas.addEventListener("pointercancel",cancelStroke);
  canvas.addEventListener("lostpointercapture",cancelStroke);
  controls.append(prev,nextPage,addPage,undo,clear,indicator);
  const recognition=document.createElement("section");recognition.className="math-notebook-recognition";
  recognition.hidden=readOnly||typeof handwrittenReview?.onRecognized!=="function";
  const recognitionTitle=document.createElement("h5");
  recognitionTitle.textContent=paperOnly?"Vérifie la lecture":"Lire ma réponse manuscrite (expérimental)";
  const recognitionHelp=document.createElement("p");recognitionHelp.className="helper";
  recognitionHelp.textContent="Pour les questions numériques : écris le résultat final seul sur la page actuelle (ex. 12, −7 ou 3/4). Le calcul complet peut rester sur les pages précédentes. Cette lecture locale n'est pas fiable sur les équations ou écritures complexes.";
  const readButton=document.createElement("button");readButton.type="button";readButton.className="subtle";
  readButton.textContent="Reconnaître le nombre écrit";
  const recognitionStatus=document.createElement("p");recognitionStatus.className="helper";
  recognitionStatus.setAttribute("role","status");
  const recognitionCandidate=document.createElement("div");recognitionCandidate.className="math-notebook-recognition-candidate";
  recognitionCandidate.hidden=true;
  const recognitionValue=document.createElement("strong");
  const recognitionSource=document.createElement("p");recognitionSource.className="helper math-notebook-recognition-source";
  recognitionSource.hidden=!paperOnly;
  const recognitionCaveat=document.createElement("p");recognitionCaveat.className="helper";
  recognitionCaveat.textContent="Vérifie impérativement que les chiffres correspondent à ta feuille avant de corriger : l'analyse peut se tromper.";
  const acceptReading=document.createElement("button");acceptReading.type="button";acceptReading.className="primary";
  acceptReading.textContent="Oui, vérifier ce résultat";
  const rejectReading=document.createElement("button");rejectReading.type="button";rejectReading.className="subtle";
  rejectReading.textContent="Non, la lecture est incorrecte";
  let recognizedText=null;
  invalidateRecognition=()=>{
    recognizedText=null;recognitionCandidate.hidden=true;
    recognitionStatus.textContent="";
    recognition.classList.remove("paper-shown");
  };
  function readNumber({allowBottom=false}={}){
    if(recognition.hidden)return false;
    invalidateRecognition();
    const page=work.pages[pageIndex];
    let result=recognizeNumericInk(page);
    if(result.status!=="recognized"&&handwrittenReview.allowEquation!==false)
      result=(allowBottom?recognizeFinalEquationInk(page):null)??recognizeStackedFractionInk(page)??result;
    if(allowBottom&&result.status!=="recognized")result=recognizeBottomNumericInk(page)??result;
    if(result.status!=="recognized"){
      recognitionStatus.textContent=result.message;
      return false;
    }
    const formatted=handwrittenReview.formatRecognized
      ?handwrittenReview.formatRecognized(result.text):result.text;
    if(formatted===null){
      recognitionStatus.textContent="Écris le numéro d’un des choix imprimés sur la feuille.";
      return false;
    }
    recognizedText=result.text;
    recognitionSource.textContent="Page "+(pageIndex+1)+" de ta copie"+(result.expression?" · "+result.expression:"");
    recognitionValue.textContent="Lecture proposée : "+formatted;
    recognitionCandidate.hidden=false;
    recognitionStatus.textContent="Confirme la lecture si elle correspond à ce que tu as écrit.";
    return true;
  }
  readButton.addEventListener("click",()=>readNumber());
  function confirmReading(){
    if(recognizedText===null||acceptReading.disabled)return;
    try{
      if(handwrittenReview?.onRecognized?.(recognizedText)===false){
        recognitionStatus.textContent="La réponse n'a pas été enregistrée. Vérifie la sauvegarde, puis réessaie.";
        return;
      }
      readButton.disabled=true;acceptReading.disabled=true;rejectReading.disabled=true;
      validateCurrentPage.disabled=true;
      recognitionStatus.textContent="Résultat reconnu et corrigé avec le moteur des exercices. Progression enregistrée.";
    }catch(error){recognitionStatus.textContent="Correction impossible : "+error.message;}
  }
  acceptReading.addEventListener("click",confirmReading);
  if(paperOnly){
    // Un relâchement tactile peut arriver sans click dans le conteneur
    // défilant. Le geste doit commencer et finir sur le même bouton.
    let confirmPointer=null;
    acceptReading.addEventListener("pointerdown",event=>{
      if(event.pointerType==="touch"&&event.isPrimary)confirmPointer=event.pointerId;
    });
    acceptReading.addEventListener("pointercancel",()=>{confirmPointer=null;});
    acceptReading.addEventListener("pointerup",event=>{
      if(event.pointerId!==confirmPointer)return;
      confirmPointer=null;
      if(!acceptReading.contains(document.elementFromPoint(event.clientX,event.clientY)))return;
      event.preventDefault();
      confirmReading();
    });
  }
  rejectReading.addEventListener("click",()=>{
    invalidateRecognition();
    const message="Lecture rejetée. Réécris le résultat sur une ligne séparée ou compare ta copie au corrigé.";
    if(paperOnly){
      showManualStatus(message);
      return;
    }
    recognitionStatus.textContent=message;
  });
  const recognitionButtons=document.createElement("div");recognitionButtons.className="math-notebook-recognition-actions";
  recognitionButtons.append(acceptReading,rejectReading);
  recognitionCandidate.append(recognitionValue,recognitionSource,recognitionCaveat,recognitionButtons);
  recognitionHelp.hidden=paperOnly;readButton.hidden=paperOnly;
  recognitionCaveat.hidden=paperOnly;
  recognition.append(recognitionTitle,recognitionHelp,readButton,recognitionStatus,recognitionCandidate);
  // Vérification des transformations manuscrites, distincte de la notation d'un quiz.
  // La transcription est proposée AVANT toute analyse et doit être confirmée.
  const inkEquations=document.createElement("section");inkEquations.className="math-notebook-equations";
  inkEquations.hidden=readOnly||!checkingEnabled;
  inkEquations.setAttribute("aria-label","Vérifier mes équations manuscrites");
  const inkEquationsTitle=document.createElement("h5");
  inkEquationsTitle.textContent="Vérifier mes équations écrites sur la feuille (expérimental)";
  const inkEquationsHelp=document.createElement("p");inkEquationsHelp.className="helper";
  inkEquationsHelp.textContent="Écris une égalité par ligne sur la page affichée, par exemple 2x+5=17, puis 2x=12 et x=6. Si l’exercice demande x, la dernière ligne x=nombre peut être corrigée sans ressaisie. Lecture expérimentale : chiffres, x, +, −, =, /, multiplication * à trois traits croisés, point ou virgule décimale placée entre deux chiffres près de leur ligne de base, parenthèses courbes, petits exposants 2 surélevés et fractions empilées avec entiers, décimales courtes ou expressions simples en x ; une ligne peut contenir jusqu’à 48 glyphes, dans la limite de 100 traits et 12 lignes par page. Écris une égalité par ligne et vérifie chaque symbole reconnu. Les racines carrées tracées avec barre (dont les radicandes décimaux et les expressions courtes 2x+1, x²+1 ou -x+2) et les fractions avec dénominateur en x peuvent être transcrites ; une transcription n'est pas une validation mathématique et une racine non résolue ne donne jamais de note automatiquement. Le contrôleur sait isoler une seule racine avec des termes affines ou un facteur constant entier ou décimal court non nul (calcul exact sans arrondi) (par exemple 2√(x)=4, √(x)/2=1 ou x+2√(x)=8) ; il écarte les solutions parasites, y compris irrationnelles. Le bouton * du correcteur tactile permet d'éditer une multiplication sans clavier. Les valeurs interdites et les racines parasites sont contrôlées sans arrondi. Le retour guidé explique le domaine, la transformation et la vérification des candidats ; les cas hors périmètre restent non vérifiés.";
  const inkEquationsRead=document.createElement("button");inkEquationsRead.type="button";inkEquationsRead.className="subtle";
  inkEquationsRead.textContent="Lire mes équations manuscrites";
  const inkEquationsStatus=document.createElement("p");inkEquationsStatus.className="helper";
  inkEquationsStatus.setAttribute("role","status");
  const inkEquationsCandidate=document.createElement("div");inkEquationsCandidate.className="math-notebook-equations-candidate";inkEquationsCandidate.hidden=true;
  const inkEquationsLabel=document.createElement("strong");inkEquationsLabel.textContent="Transcription proposée — relis chaque symbole :";
  const inkEquationsText=document.createElement("pre");inkEquationsText.className="math-notebook-equations-transcript";
  const inkEquationsEditToggle=document.createElement("button");
  inkEquationsEditToggle.type="button";inkEquationsEditToggle.className="subtle math-notebook-ink-edit-toggle";
  inkEquationsEditToggle.textContent="Corriger les symboles reconnus sans clavier";
  inkEquationsEditToggle.setAttribute("aria-expanded","false");
  const inkEquationsEditor=document.createElement("div");inkEquationsEditor.className="math-notebook-ink-editor";
  inkEquationsEditor.hidden=true;
  const inkEquationsEditHelp=document.createElement("p");inkEquationsEditHelp.className="helper";
  inkEquationsEditHelp.textContent="Touche le symbole erroné (□ signifie illisible), puis le bon symbole ci-dessous. « Insérer à droite » ajoute un caractère au lieu d'en remplacer un. Il n'est pas nécessaire de ressaisir toute l'équation.";
  const inkEquationsChars=document.createElement("div");inkEquationsChars.className="math-notebook-ink-chars";
  inkEquationsChars.setAttribute("role","group");inkEquationsChars.setAttribute("aria-label","Symboles de la transcription à corriger");
  const inkEquationsSymbols=document.createElement("div");inkEquationsSymbols.className="math-notebook-ink-symbols";
  inkEquationsSymbols.setAttribute("role","group");inkEquationsSymbols.setAttribute("aria-label","Choisir un symbole manuscrit");
  const inkEquationsEditTools=document.createElement("div");inkEquationsEditTools.className="math-notebook-ink-edit-tools";
  const inkEquationsInsert=document.createElement("button");inkEquationsInsert.type="button";
  inkEquationsInsert.className="subtle";inkEquationsInsert.textContent="Insérer à droite";
  inkEquationsInsert.setAttribute("aria-pressed","false");
  const inkEquationsDelete=document.createElement("button");inkEquationsDelete.type="button";
  inkEquationsDelete.className="subtle";inkEquationsDelete.textContent="Supprimer le symbole";
  const inkEquationsNewline=document.createElement("button");inkEquationsNewline.type="button";
  inkEquationsNewline.className="subtle";inkEquationsNewline.textContent="Nouvelle ligne";
  inkEquationsEditTools.append(inkEquationsInsert,inkEquationsDelete,inkEquationsNewline);
  inkEquationsEditor.append(inkEquationsEditHelp,inkEquationsChars,inkEquationsSymbols,inkEquationsEditTools);
  const inkEquationsConfirm=document.createElement("button");inkEquationsConfirm.type="button";inkEquationsConfirm.className="primary";
  inkEquationsConfirm.textContent="Oui, vérifier ces étapes";
  const inkEquationsReject=document.createElement("button");inkEquationsReject.type="button";inkEquationsReject.className="subtle";
  inkEquationsReject.textContent="La transcription est incorrecte";
  const inkEquationsFinal=document.createElement("div");inkEquationsFinal.className="math-notebook-equations-final";
  inkEquationsFinal.hidden=true;
  const inkEquationsFinalHelp=document.createElement("p");inkEquationsFinalHelp.className="helper";
  inkEquationsFinalHelp.textContent="Si la question demande la valeur de x, tu peux corriger le résultat final directement depuis la dernière ligne de ta feuille. Les expressions en racine ou avec x au dénominateur ne sont pas converties automatiquement en réponse numérique. Vérifie toujours la transcription avant de valider.";
  const inkEquationsGrade=document.createElement("button");inkEquationsGrade.type="button";inkEquationsGrade.className="primary";
  inkEquationsFinal.append(inkEquationsFinalHelp,inkEquationsGrade);
  const inkEquationsActions=document.createElement("div");inkEquationsActions.className="math-notebook-equations-actions";
  inkEquationsActions.append(inkEquationsConfirm,inkEquationsReject);
  const inkEquationsReport=document.createElement("div");inkEquationsReport.className="math-notebook-feedback";inkEquationsReport.hidden=true;
  inkEquationsReport.setAttribute("role","status");
  let currentEquationText=null,currentFinalAnswer=null,editCursor=0,insertMode=false,inkWasEdited=false;
  function syncEquationCandidate(){
    inkEquationsText.textContent=currentEquationText??"";
    const valid=currentEquationText!==null&&validateInkTranscript(currentEquationText);
    inkEquationsConfirm.disabled=!valid;
    currentFinalAnswer=valid&&handwrittenReview?.allowEquation!==false&&typeof handwrittenReview?.onRecognized==="function"
      ?extractFinalNumericAnswer(currentEquationText):null;
    inkEquationsFinal.hidden=currentFinalAnswer===null;
    if(currentFinalAnswer!==null)
      inkEquationsGrade.textContent="Corriger mon résultat final : x = "+currentFinalAnswer;
    inkEquationsGrade.disabled=currentFinalAnswer===null;
    inkEquationsReport.hidden=true;
    inkEquationsChars.replaceChildren();
    if(currentEquationText===null)return;
    for(let i=0;i<currentEquationText.length;i++){
      const symbol=currentEquationText[i],button=document.createElement("button");
      button.type="button";button.className="subtle";
      button.textContent=symbol==="\n"?"↵":symbol;
      button.setAttribute("aria-label","Symbole "+(i+1)+" : "+(symbol==="\n"?"nouvelle ligne":symbol));
      button.setAttribute("aria-pressed",String(i===editCursor));
      if(symbol==="□")button.classList.add("unreadable");
      button.addEventListener("click",()=>{editCursor=i;syncEquationCandidate();});
      inkEquationsChars.append(button);
    }
  }
  function applyInkEdit(mode,symbol=""){
    if(currentEquationText===null)return;
    try{
      const index=mode==="insert"||mode==="newline"
        ?Math.min(currentEquationText.length,editCursor+1):editCursor;
      const result=editInkTranscript(currentEquationText,index,mode,symbol);
      const source=pageInkFingerprint(work.pages[pageIndex]);
      const next={...work,inkDrafts:{...(work.inkDrafts??{}),[pageIndex]:{
        source,text:result,edited:true
      }}};
      if(!persist(next,{keepReading:true})){
        inkEquationsStatus.textContent="Édition non enregistrée. Vérifie le stockage avant de corriger.";
        return;
      }
      currentEquationText=result;inkWasEdited=true;
      editCursor=Math.max(0,Math.min(result.length-1,index+(mode==="insert"?1:0)));
      syncEquationCandidate();
      inkEquationsStatus.textContent=validateInkTranscript(result)
        ?"Transcription corrigée. Relis-la entièrement avant de vérifier."
        :"Transcription incomplète : corrige les □ et les équations avant toute vérification.";
    }catch(error){inkEquationsStatus.textContent="Modification refusée : "+error.message;}
  }
  for(const symbol of INK_EDIT_SYMBOLS){
    const button=document.createElement("button");button.type="button";
    button.className="subtle";button.textContent=symbol;
    button.setAttribute("aria-label","Écrire le symbole "+symbol);
    button.addEventListener("click",()=>applyInkEdit(insertMode?"insert":"replace",symbol));
    inkEquationsSymbols.append(button);
  }
  inkEquationsEditToggle.addEventListener("click",()=>{
    inkEquationsEditor.hidden=!inkEquationsEditor.hidden;
    inkEquationsEditToggle.setAttribute("aria-expanded",String(!inkEquationsEditor.hidden));
    if(!inkEquationsEditor.hidden)syncEquationCandidate();
  });
  inkEquationsInsert.addEventListener("click",()=>{
    insertMode=!insertMode;
    inkEquationsInsert.setAttribute("aria-pressed",String(insertMode));
    inkEquationsInsert.textContent=insertMode?"Remplacer le symbole":"Insérer à droite";
  });
  inkEquationsDelete.addEventListener("click",()=>applyInkEdit("delete"));
  inkEquationsNewline.addEventListener("click",()=>applyInkEdit("newline"));
  const previousInvalidateRecognition=invalidateRecognition;
  invalidateRecognition=()=>{
    previousInvalidateRecognition();
    currentEquationText=null;currentFinalAnswer=null;inkWasEdited=false;
    inkEquationsFinal.hidden=true;
    inkEquationsEditor.hidden=true;
    inkEquationsCandidate.hidden=true;
    inkEquationsReport.hidden=true;
    inkEquationsStatus.textContent="";
    inkEquations.classList.remove("paper-shown");
  };
  inkEquationsRead.addEventListener("click",()=>{
    invalidateRecognition();
    const saved=work.inkDrafts?.[pageIndex];
    const validSaved=saved&&saved.source===pageInkFingerprint(work.pages[pageIndex]);
    const read=validSaved
      ?{status:"restored",text:saved.text,message:"Transcription corrigée retrouvée dans le cahier. Relis-la avant de valider."}
      :recognizeEquationInk(work.pages[pageIndex],{draft:true});
    if(!["recognized","partial","restored"].includes(read.status)){
      inkEquationsStatus.textContent=read.message;return;
    }
    currentEquationText=read.text;inkWasEdited=validSaved&&saved.edited===true;
    editCursor=Math.max(0,read.text.indexOf("□"));
    inkEquationsEditor.hidden=read.status==="recognized"||(read.status==="restored"&&validateInkTranscript(read.text));
    inkEquationsCandidate.hidden=false;
    syncEquationCandidate();
    inkEquationsStatus.textContent=read.message;
  });
  inkEquationsGrade.addEventListener("click",()=>{
    if(currentEquationText===null||currentFinalAnswer===null)return;
    try{
      // Exactement le même moteur que la saisie numérique normale.
      // La simple lecture de la feuille ne constitue pas un indice.
      if(handwrittenReview?.onRecognized?.(currentFinalAnswer,{edited:inkWasEdited})===false){
        inkEquationsStatus.textContent="Réponse non enregistrée : vérifie la sauvegarde et réessaie.";
        return;
      }
      inkEquationsGrade.disabled=true;inkEquationsRead.disabled=true;
      inkEquationsConfirm.disabled=true;inkEquationsReject.disabled=true;
      inkEquationsEditToggle.disabled=true;inkEquationsEditor.hidden=true;
      inkEquationsStatus.textContent=inkWasEdited
        ?"Résultat validé après correction manuelle de la transcription : enregistré comme réponse assistée."
        :"Résultat final vérifié avec le correcteur du quiz et progression enregistrée.";
    }catch(error){inkEquationsStatus.textContent="Correction non enregistrée : "+error.message;}
  });
  inkEquationsReject.addEventListener("click",()=>{
    if(work.inkDrafts?.[pageIndex]){
      const drafts={...work.inkDrafts};delete drafts[pageIndex];
      const next={...work};
      if(Object.keys(drafts).length)next.inkDrafts=drafts;else delete next.inkDrafts;
      if(!persist(next))return;
    }
    invalidateRecognition();
    if(paperOnly)manual.classList.add("paper-shown");
    inkEquationsStatus.textContent="Transcription rejetée. La version corrigée a été écartée ; les traits restent dans le cahier.";
  });
  inkEquationsConfirm.addEventListener("click",()=>{
    if(currentEquationText===null||!validateInkTranscript(currentEquationText))return;
    const review=checkMathSteps(currentEquationText);
    if(review.checked>0&&onGuidance()===false){
      inkEquationsStatus.textContent="La consultation de la correction n'a pas pu être enregistrée. Réessaie sans quitter cette page.";
      return;
    }
    inkEquationsReport.replaceChildren();
    const summary=document.createElement("p");
    summary.textContent=review.checked+" ligne(s) mathématique(s) analysée(s), "+review.errors+" transformation(s) ou calcul(s) erroné(s), "+review.unsupported+" ligne(s) non prises en charge.";
    const list=document.createElement("ol");list.className="math-notebook-review-list";
    for(const entry of review.entries){
      const item=document.createElement("li");item.dataset.result=entry.kind;
      item.textContent=(entry.line?"Ligne "+entry.line+" — ":"")+entry.message;
      list.append(item);
    }
    const caution=document.createElement("p");caution.className="helper";
    caution.textContent="Une absence d'erreur détectée ne prouve pas la réponse à l'énoncé et ne valide pas le quiz. Ce contrôle porte uniquement sur les égalités transcrites et les transformations prises en charge. Utilise la validation du résultat numérique ou le corrigé pour terminer l'exercice.";
    inkEquationsReport.append(summary,list,caution);
    inkEquationsReport.hidden=false;
    inkEquationsConfirm.disabled=true;
    inkEquationsStatus.textContent="Étapes examinées sur la transcription que tu as confirmée.";
  });
  inkEquationsCandidate.append(inkEquationsLabel,inkEquationsText,inkEquationsEditToggle,inkEquationsEditor,inkEquationsFinal,inkEquationsActions);
  if(paperOnly){
    inkEquationsTitle.textContent="Vérifie les étapes lues";
    inkEquationsHelp.hidden=true;inkEquationsRead.hidden=true;
  }
  inkEquations.append(inkEquationsTitle,inkEquationsHelp,inkEquationsRead,inkEquationsStatus,inkEquationsCandidate,inkEquationsReport);
  const quickValidate=document.createElement("button");quickValidate.type="button";
  quickValidate.className="primary math-notebook-quick-validate";
  quickValidate.textContent="Valider ma réponse sur la feuille";
  quickValidate.hidden=!handwrittenReview||readOnly;
  const validateCurrentPage=document.createElement("button");
  validateCurrentPage.type="button";validateCurrentPage.className="subtle small math-notebook-validate-page";
  validateCurrentPage.textContent="Lire cette page";
  validateCurrentPage.hidden=true;
  const manual=document.createElement("section");manual.className="math-notebook-manual";
  const invalidateReading=invalidateRecognition;
  invalidateRecognition=()=>{
    invalidateReading();
    if(paperOnly&&!manual.querySelector(".math-notebook-manual-comparison:not([hidden])"))
      manual.classList.remove("paper-shown");
  };
  manual.hidden=!handwrittenReview||readOnly;
  let showManualStatus=()=>{};
  if(handwrittenReview){
    if(typeof handwrittenReview.expected!=="string"||typeof handwrittenReview.explanation!=="string"
      ||typeof handwrittenReview.onDecision!=="function")
      throw Error("Correction manuscrite mal configurée");
    const manualTitle=document.createElement("h5");manualTitle.textContent="Valider ma réponse écrite sur la feuille";
    const manualIntro=document.createElement("p");manualIntro.className="helper";
    manualIntro.textContent="Laisse une ligne vide entre tes calculs et ton résultat final. Si la lecture échoue, tu peux réécrire le résultat ou ouvrir le corrigé pour comparer ta copie.";
    const reveal=document.createElement("button");reveal.type="button";reveal.className="primary";
    reveal.textContent="Afficher le corrigé et valider ma feuille";
    const manualStatus=document.createElement("p");manualStatus.className="helper";manualStatus.setAttribute("role","status");
    showManualStatus=message=>{
      manual.classList.add("paper-shown");
      manualStatus.textContent=message;
      manualStatus.scrollIntoView({behavior:"instant",block:"nearest"});
    };
    const retry=document.createElement("button");retry.type="button";retry.className="subtle math-notebook-paper-retry";
    retry.textContent="Revenir à ma feuille";
    retry.hidden=!paperOnly;
    retry.addEventListener("click",()=>{
      manual.classList.remove("paper-shown");
      returnToWriting();
    });
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
      reveal.disabled=true;quickValidate.disabled=true;readButton.disabled=true;acceptReading.disabled=true;rejectReading.disabled=true;
      inkEquationsRead.disabled=true;inkEquationsConfirm.disabled=true;inkEquationsGrade.disabled=true;
      inkEquationsEditToggle.disabled=true;inkEquationsEditor.hidden=true;
      comparison.hidden=false;retry.hidden=true;validateCurrentPage.disabled=true;
      manualStatus.textContent="Corrigé affiché. Compare ta réponse manuscrite, puis indique ton résultat.";
    });
    const validatePage=target=>{
      if(paperOnly)manual.classList.remove("paper-shown");
      manualStatus.textContent="";
      if(target<0){
        if(paperOnly)manual.classList.add("paper-shown");
        reveal.click();
        manualStatus.scrollIntoView({behavior:"instant",block:"nearest"});
        return;
      }
      if(pageIndex!==target)goToPage(target);
      if(typeof handwrittenReview.onRecognized==="function"&&!readButton.disabled){
        // Lecture locale sans correction ni transfert de données vers un OCR.
        // Le clic de confirmation reste obligatoire avant toute notation.
        if(readNumber({allowBottom:true})){
          if(paperOnly)recognition.classList.add("paper-shown");
          recognitionCandidate.scrollIntoView({behavior:"instant",block:"nearest"});
          return;
        }
        // Une suite d'équations peut se terminer par x = nombre.
        if(handwrittenReview.allowEquation!==false&&!inkEquations.hidden&&!inkEquationsRead.disabled)inkEquationsRead.click();
        if(handwrittenReview.allowEquation!==false&&!inkEquations.hidden&&!inkEquationsCandidate.hidden){
          if(paperOnly)inkEquations.classList.add("paper-shown");
          inkEquationsStatus.textContent="Étapes détectées sur ta feuille. Vérifie et corrige les symboles au toucher ; aucun résultat n'est noté sans confirmation.";
          if(currentFinalAnswer===null&&paperOnly)manual.classList.add("paper-shown");
          inkEquationsCandidate.scrollIntoView({behavior:"instant",block:"nearest"});
          return;
        }
      }
      showManualStatus(handwrittenReview.allowEquation===false
        ?"Le numéro du choix n’a pas été reconnu. Réécris-le sur une ligne séparée ou ouvre le corrigé."
        :"Le résultat n’a pas été reconnu. Réécris-le sur une ligne séparée ou ouvre le corrigé.");
    };
    quickValidate.addEventListener("click",()=>validatePage(work.pages.findLastIndex(page=>page.length>0)));
    validateCurrentPage.addEventListener("click",()=>validatePage(pageIndex));
    decisions.append(success,failure);
    comparison.append(answerTitle,answer,explanationTitle,detail,compareInstruction,decisions);
    manual.append(manualTitle,manualIntro,retry,reveal,manualStatus,comparison);
  }
  const editorDetails=document.createElement("details");editorDetails.className="math-notebook-editor-disclosure";editorDetails.open=!paperOnly;
  editorDetails.hidden=!showEditor||readOnly;
  const editorSummary=document.createElement("summary");editorSummary.textContent="Clavier mathématique et vérification des étapes (facultatif)";
  editorDetails.append(editorSummary,keypad,templates,field,preview,correction);
  if(paperOnly){
    // Les modes de tracé restent accessibles au-dessous de la feuille.
    const tools=document.createElement("details");tools.className="math-notebook-paper-tools";
    const summary=document.createElement("summary");summary.textContent="Outils de la feuille";
    summary.setAttribute("aria-label","Afficher les outils de la feuille : pages, gomme, déplacement et zoom");
    const zoom=document.createElement("select");
    zoom.className="math-notebook-paper-zoom";
    zoom.setAttribute("aria-label","Zoom de la feuille");
    for(const [value,label] of ZOOM_LEVELS){
      const option=document.createElement("option");
      option.value=value;option.textContent=label;zoom.append(option);
    }
    const canvasOffset=()=>canvas.getBoundingClientRect().top-sheetViewport.getBoundingClientRect().top-sheetViewport.clientTop;
    let previousView="";
    if(!readOnly){
      if(resumeView){
        zoom.value=resumeView.zoom;
        canvas.style.width=zoom.value+"%";
      }
      savePaperView=()=>{
        const box=canvas.getBoundingClientRect();
        if(!box.width||!box.height)return;
        const start=canvasOffset()+sheetViewport.scrollTop;
        const writing=sheetViewport.scrollTop>=start-1;
        const view={page:pageIndex,zoom:zoom.value,writing,
          left:Math.round(sheetViewport.scrollLeft/box.width*10000)/10000,
          top:Math.round(Math.max(0,writing?-canvasOffset()/box.height:sheetViewport.scrollTop/Math.max(1,start))*10000)/10000};
        const encoded=JSON.stringify(view);
        if(previousView===encoded)return;
        previousView=encoded;
        writePaperView(storage,context,view);
      };
      restorePaperView=()=>{
        const apply=()=>{
          const box=canvas.getBoundingClientRect();
          if(!box.width||!box.height)return false;
          if(resumeView){
            const start=canvasOffset()+sheetViewport.scrollTop;
            const top=resumeView.writing?start+resumeView.top*box.height:resumeView.top*start;
            sheetViewport.scrollTo({top,left:resumeView.left*box.width,behavior:"instant"});
          }
          sheetViewport.addEventListener("scroll",savePaperView,{passive:true});
          return true;
        };
        if(apply())return;
        // Le cahier d’un cours peut être monté dans un volet encore fermé.
        const observer=new ResizeObserver(()=>{
          if(!canvas.isConnected||apply())observer.disconnect();
        });
        observer.observe(canvas);
      };
    }
    zoom.addEventListener("change",()=>{
      const top=canvasOffset();
      const atWritingArea=sheetViewport.scrollTop>0&&top<=12;
      const before=canvas.getBoundingClientRect();
      const vertical=Math.max(0,-top)/before.height;
      const horizontal=sheetViewport.scrollLeft/before.width;
      canvas.style.width=zoom.value+"%";
      const after=canvas.getBoundingClientRect();
      if(atWritingArea)sheetViewport.scrollTop+=canvasOffset()+vertical*after.height;
      sheetViewport.scrollLeft=horizontal*after.width;
      savePaperView();
    });
    if(readOnly){controls.replaceChildren(prev,nextPage,indicator);sheetControls.hidden=true;}
    const bar=document.createElement("div");bar.className="math-notebook-paper-bar";
    if(!readOnly){
      bar.append(status);
      const modes=document.createElement("div");modes.className="math-notebook-paper-modes";
      modes.setAttribute("role","group");modes.setAttribute("aria-label","Mode de la feuille");
      eraser.textContent="Gomme";
      updateWritingMode();
      modes.append(pen,eraser,moveMode,undo);
      modes.classList.add("has-undo");
      bar.append(modes,quickValidate);
    }
    tools.append(summary,controls,sheetControls);
    const paperNavigation=document.createElement("nav");
    paperNavigation.className="math-notebook-paper-navigation";
    paperNavigation.setAttribute("aria-label","Pages de la feuille");
    if(!readOnly){
      prev.textContent="‹";prev.setAttribute("aria-label","Page précédente");
      nextPage.textContent="›";nextPage.setAttribute("aria-label","Page suivante");
      indicator.setAttribute("aria-live","polite");
      paperNavigation.append(prev,indicator,nextPage,validateCurrentPage);
      syncPageNavigation=()=>{
        paperNavigation.hidden=work.pages.length<2;
        validateCurrentPage.hidden=!handwrittenReview||work.pages[pageIndex].length===0
          ||pageIndex===work.pages.findLastIndex(page=>page.length>0);
      };
    }else paperNavigation.hidden=true;
    const paperTop=document.createElement("div");paperTop.className="math-notebook-paper-top";
    if(paperPrompt&&!readOnly){
      const jump=document.createElement("button");jump.type="button";jump.className="subtle small math-notebook-paper-jump";
      const position=()=>Math.min(canvasOffset()+sheetViewport.scrollTop,sheetViewport.scrollHeight-sheetViewport.clientHeight);
      const onCanvas=()=>sheetViewport.scrollTop>=Math.max(1,position()-12);
      const syncJump=()=>{jump.textContent=onCanvas()?"Voir l’énoncé":"Aller à la zone d’écriture";};
      returnToWriting=()=>{
        tools.open=false;
        if(eraserMode||panMode)pen.click();
        sheetViewport.scrollTo({top:position(),left:0,behavior:"instant"});
        section.scrollIntoView({block:"start",behavior:"instant"});
        canvas.focus({preventScroll:true});
        syncJump();
      };
      jump.textContent="Aller à la zone d’écriture";
      sheetViewport.addEventListener("scroll",syncJump,{passive:true});
      jump.addEventListener("click",()=>{
        const top=onCanvas()?0:position();
        tools.open=false;
        sheetViewport.scrollTo({top,left:0,behavior:"instant"});
        syncJump();
      });
      paperTop.append(jump);
    }
    paperTop.append(zoom,tools);
    section.append(paperTop,paperNavigation,sheetViewport,bar,recognition,inkEquations,manual,editorDetails);
  }else section.append(heading,help,drawLabel,recognition,quickValidate,controls,sheetControls,sheetViewport,sheetHelp,inkEquations,manual,status,editorDetails);
  host.replaceChildren(section);renderPages();restorePaperView();
  return {element:section,field,canvas,save:()=>persist({...work,text:field.value})};
}
