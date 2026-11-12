/**
 * Cahier numérique DAEU B : texte + écriture au doigt/stylet.
 * Sauvegarde atomique dans le bundle progression / cloud / IndexedDB.
 * Les traits sont des coordonnées, jamais du HTML, SVG fourni par l'utilisateur ou du code.
 */
import {blankWork,changeWork,encodeStroke,parseStroke,readWork,PAPER_WIDTH,PAPER_HEIGHT} from "./workbook.mjs";

const SYMBOLS=["+","−","×","÷","=","(",")","²","√","π","≤","≥","≠","→","^","/"];
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
export function mountNotebook(host,{context,adapter,storage=globalThis.localStorage,title="Mon cahier de calcul"}){
  if(!host)throw new Error("Emplacement de cahier absent");
  const legacyKey=notebookKey(context);
  if(!adapter||typeof adapter.snapshot!=="function"||typeof adapter.updateWorkbook!=="function")
    throw new Error("Stockage unifié du cahier indisponible");
  const section=document.createElement("section");section.className="math-notebook";
  const heading=document.createElement("h4");heading.textContent=title;
  const help=document.createElement("p");help.className="helper";
  help.textContent="Rédige les égalités et justifications au clavier, ou trace les opérations avec le doigt ou un stylet. Le cahier est enregistré avec ta progression et synchronisé si ton compte cloud est connecté. Les étapes ne sont pas notées automatiquement.";
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
  const keypad=document.createElement("div");keypad.className="math-notebook-keypad";
  keypad.setAttribute("role","group");keypad.setAttribute("aria-label","Symboles mathématiques");
  function persist(next){
    try{
      const current=adapter.snapshot().workbook;
      const updated=changeWork(current,context,next);
      adapter.updateWorkbook(updated);
      work=next;status.textContent="Cahier enregistré automatiquement avec la progression.";
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
  const newline=document.createElement("button");newline.type="button";newline.className="subtle small";newline.textContent="Nouvelle ligne";
  newline.addEventListener("click",()=>{
    const next=insertAtSelection(field.value,"\n",field.selectionStart,field.selectionEnd);
    field.value=next.value;field.focus();field.setSelectionRange(next.caret,next.caret);
    if(!persist({...work,text:field.value}))field.value=work.text;
  });keypad.append(newline);
  const drawLabel=document.createElement("strong");drawLabel.textContent="Feuille quadrillée — écrire au doigt ou au stylet";
  const controls=document.createElement("div");controls.className="math-notebook-pages";
  const prev=document.createElement("button");prev.type="button";prev.className="subtle small";prev.textContent="Page précédente";
  const nextPage=document.createElement("button");nextPage.type="button";nextPage.className="subtle small";nextPage.textContent="Page suivante";
  const addPage=document.createElement("button");addPage.type="button";addPage.className="subtle small";addPage.textContent="Ajouter une page";
  const undo=document.createElement("button");undo.type="button";undo.className="subtle small";undo.textContent="Annuler le dernier trait";
  const clear=document.createElement("button");clear.type="button";clear.className="subtle small";clear.textContent="Effacer cette page";
  const indicator=document.createElement("span");indicator.className="helper math-notebook-page-indicator";
  const canvas=document.createElement("canvas");canvas.className="math-notebook-canvas";
  canvas.width=PAPER_WIDTH;canvas.height=PAPER_HEIGHT;
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
    if(activePointer!==null||event.button!==0||work.pages[pageIndex].length>=100)return;
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
  section.append(heading,help,keypad,field,drawLabel,controls,canvas,status);
  host.replaceChildren(section);renderPages();
  return {element:section,field,canvas,save:()=>persist({...work,text:field.value})};
}
