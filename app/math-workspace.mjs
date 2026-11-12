/**
 * Cahier mathématique tactile / clavier. Aucune évaluation automatique
 * des démonstrations ; les saisies sont stockées dans le bundle utilisateur.
 * Utilisable dans les cours, quiz, examens et problèmes rédigés.
 */
import {PAPER_WIDTH as W,PAPER_HEIGHT as H,blankWork,readWork,changeWork,encodeStroke,parseStroke} from "./workbook.mjs";
const symbols=[
 ["+","+"],["−","−"],["×","×"],["÷","÷"],["=","="],
 ["x²","²"],["x³","³"],["xⁿ","^()"],["√","√()"],
 ["a/b","()/()"],["(", "("],[")",")"],["π","π"],
 ["≤","≤"],["≥","≥"],["≠","≠"],["→","→"],["∞","∞"],
 ["Δ","Δ"],["∫","∫"],["Σ","Σ"],["θ","θ"]
];
const elt=(tag,cls,txt)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(txt!==undefined)node.textContent=txt;
  return node;
};
const action=(label,fn,cls="subtle small")=>{
  const b=elt("button",cls,label);b.type="button";b.addEventListener("click",fn);return b;
};
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

export function mountMathWorkspace(host,adapter,{initiallyOpen=false}={}){
  if(!host||!adapter?.updateWorkbook||!adapter?.snapshot)
    throw Error("Cahier : conteneur ou sauvegarde absents");
  const detail=elt("details","math-workspace");
  if(initiallyOpen)detail.open=true;
  const summary=elt("summary","","Mon cahier de calcul numérique");
  const content=elt("div","math-workspace-body");
  const tip=elt("p","helper",
    "Toutes tes étapes se font ici, sans papier : écris des lignes d'équations ou trace au doigt/stylet sur les carreaux. Les brouillons sont sauvegardés automatiquement. La vérification des démonstrations reste manuelle.");
  const heading=elt("strong","math-workspace-topic","Activité");
  const symbolsPanel=elt("div","math-symbols");
  const label=elt("label","","Mes équations, étape par étape");
  const textArea=elt("textarea","math-steps");
  textArea.rows=6;textArea.maxLength=6000;
  textArea.spellcheck=false;
  textArea.placeholder="Ex. 2x + 3 = 11\n2x = 8\nx = 4\nVérification : 2 × 4 + 3 = 11";
  const textTools=elt("div","math-text-tools");
  const drawingHeading=elt("p","math-canvas-title","Ma feuille quadrillée — écriture au doigt ou au stylet");
  const canvas=elt("canvas","math-paper");
  canvas.width=W*2;canvas.height=H*2;
  canvas.setAttribute("role","img");
  canvas.setAttribute("aria-label","Feuille quadrillée pour écrire et tracer des calculs. Utilise la zone de texte pour une alternative au dessin.");
  const drawControls=elt("div","math-drawing-controls");
  const pagesRow=elt("div","math-pages");
  const status=elt("p","math-workspace-status helper","Ouvre une activité pour commencer.");
  status.setAttribute("role","status");status.setAttribute("aria-live","polite");
  const footer=elt("p","helper","Le cahier reste rattaché à cette activité, y compris après rechargement. Le résultat final doit être saisi dans le champ de réponse pour être corrigé automatiquement.");
  host.append(detail);
  detail.append(summary,content);
  content.append(tip,heading,label,symbolsPanel,textTools,textArea,drawingHeading,drawControls,canvas,pagesRow,status,footer);
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Canvas 2D indisponible");
  ctx.scale(2,2);
  let key=null,work=blankWork(),page=0,saveTimer=null,pointer=null,mode="draw",history=[],redo=[],lastSaved=null;
  const snapshot=()=>adapter.snapshot();
  const showStatus=(value,bad=false)=>{
    status.textContent=value;
    status.dataset.state=bad?"error":"saved";
  };
  function flush(){
    if(saveTimer!==null){clearTimeout(saveTimer);saveTimer=null;}
    if(!key)return true;
    const current=JSON.stringify(work);
    if(current===lastSaved)return true;
    try{
      adapter.updateWorkbook(changeWork(snapshot().workbook,key,work));
      lastSaved=current;
      showStatus("Brouillon enregistré automatiquement sur cet appareil.");
      return true;
    }catch(error){
      showStatus("Enregistrement impossible : "+(error?.message||"stockage indisponible")+". Ne quitte pas la page avant d'avoir résolu l'erreur.",true);
      return false;
    }
  }
  function schedule(){
    showStatus("Enregistrement en cours…");
    if(saveTimer!==null)clearTimeout(saveTimer);
    saveTimer=setTimeout(flush,300);
  }
  function pos(evt){
    const rect=canvas.getBoundingClientRect();
    return [
      clamp(Math.round((evt.clientX-rect.left)/rect.width*W),0,W),
      clamp(Math.round((evt.clientY-rect.top)/rect.height*H),0,H)
    ];
  }
  function drawLine(points,strokeColor="#14273c",lineWidth=2.4){
    if(!points.length)return;
    ctx.strokeStyle=strokeColor;ctx.lineWidth=lineWidth;
    ctx.lineCap="round";ctx.lineJoin="round";
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    if(points.length===1)ctx.lineTo(points[0][0]+.15,points[0][1]+.15);
    ctx.stroke();
  }
  function redraw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#f8fcff";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#d7e5f3";ctx.lineWidth=.65;
    for(let y=25;y<H;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    for(let x=25;x<W;x+=25){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    ctx.strokeStyle="#e7a9a9";ctx.lineWidth=1.25;
    ctx.beginPath();ctx.moveTo(45,0);ctx.lineTo(45,H);ctx.stroke();
    for(const stroke of work.pages[page]||[])drawLine(parseStroke(stroke));
    if(pointer?.points)drawLine(pointer.points,"#14273c",2.6);
    pageLabel.textContent="Page "+(page+1)+" / "+work.pages.length;
    previous.disabled=page===0;
    next.disabled=page===work.pages.length-1;
    addPage.disabled=work.pages.length>=8;
    undoButton.disabled=!history.length&&!(work.pages[page]?.length);
    redoButton.disabled=!redo.length;
  }
  function commit(action){
    if(action)history.push(action);
    if(history.length>100)history.shift();
    redo=[];
    schedule();redraw();
  }
  function pointerDown(evt){
    if(!key||evt.isPrimary===false||evt.button!==0)return;
    evt.preventDefault();canvas.setPointerCapture(evt.pointerId);
    const point=pos(evt);
    if(mode==="erase"){
      let nearest=18*18,index=-1;
      for(const [i,stroke] of work.pages[page].entries()){
        for(const [x,y] of parseStroke(stroke)){
          const d=(x-point[0])**2+(y-point[1])**2;
          if(d<nearest){nearest=d;index=i;}
        }
      }
      if(index>=0){
        const [path]=work.pages[page].splice(index,1);
        commit({type:"remove",path,index,page});
      }
      return;
    }
    pointer={id:evt.pointerId,points:[point]};
  }
  function pointerMove(evt){
    if(!pointer||pointer.id!==evt.pointerId)return;
    evt.preventDefault();
    const point=pos(evt);
    const prev=pointer.points.at(-1);
    if(pointer.points.length<300&&Math.hypot(point[0]-prev[0],point[1]-prev[1])>=2){
      pointer.points.push(point);redraw();
    }
  }
  function pointerUp(evt){
    if(!pointer||pointer.id!==evt.pointerId)return;
    evt.preventDefault();
    const finished=pointer.points;
    const end=pos(evt);
    if(finished.length<300&&Math.hypot(end[0]-finished.at(-1)[0],end[1]-finished.at(-1)[1])>1)
      finished.push(end);
    pointer=null;
    try{
      const stroke=encodeStroke(finished);
      if(work.pages[page].length>=100)throw Error("Page pleine : ouvre une nouvelle page");
      work.pages[page].push(stroke);
      commit({type:"add",path:stroke,page});
    }catch(error){
      showStatus(error.message,true);redraw();
    }
  }
  canvas.addEventListener("pointerdown",pointerDown);
  canvas.addEventListener("pointermove",pointerMove);
  canvas.addEventListener("pointerup",pointerUp);
  canvas.addEventListener("pointercancel",pointerUp);
  for(const [name,insert] of symbols){
    const button=action(name,()=>{
      const start=textArea.selectionStart,end=textArea.selectionEnd;
      textArea.setRangeText(insert,start,end,"end");
      if(insert.includes("()"))textArea.setSelectionRange(start+insert.indexOf("(")+1,start+insert.indexOf("(")+1);
      textArea.focus();work.text=textArea.value;schedule();
    },"math-symbol");
    button.setAttribute("aria-label","Insérer "+name);symbolsPanel.append(button);
  }
  textTools.append(action("Nouvelle ligne",()=>{
    const start=textArea.selectionStart,end=textArea.selectionEnd;
    textArea.setRangeText("\n",start,end,"end");textArea.focus();
    work.text=textArea.value;schedule();
  }),action("Étape de justification",()=>{
    const start=textArea.selectionStart,end=textArea.selectionEnd;
    textArea.setRangeText("\nMéthode : \nCalcul : \nConclusion : ",start,end,"end");textArea.focus();
    work.text=textArea.value;schedule();
  }));
  textArea.addEventListener("input",()=>{work.text=textArea.value;schedule();});
  textArea.addEventListener("blur",flush);
  const pen=action("Écrire",()=>setMode("draw"),"subtle small");
  const eraser=action("Effacer un trait",()=>setMode("erase"),"subtle small");
  function setMode(nextMode){
    mode=nextMode;
    pen.setAttribute("aria-pressed",String(mode==="draw"));
    eraser.setAttribute("aria-pressed",String(mode==="erase"));
  }
  const undoButton=action("Annuler",()=>{
    const a=history.pop()||(work.pages[page].length?{type:"add",path:work.pages[page].at(-1),page}:null);
    if(!a)return;
    if(a.type==="add"){
      const list=work.pages[a.page],idx=list.lastIndexOf(a.path);
      if(idx>=0)list.splice(idx,1);
    }else work.pages[a.page].splice(a.index,0,a.path);
    redo.push(a);schedule();redraw();
  });
  const redoButton=action("Rétablir",()=>{
    const a=redo.pop();if(!a)return;
    if(a.type==="add")work.pages[a.page].push(a.path);
    else{
      const list=work.pages[a.page],idx=list.indexOf(a.path);
      if(idx>=0)list.splice(idx,1);
    }
    history.push(a);schedule();redraw();
  });
  drawControls.append(pen,eraser,undoButton,redoButton,
    action("Vider cette page",()=>{
      if(!work.pages[page].length||!confirm("Effacer les tracés de cette page ? Les équations tapées restent conservées."))return;
      work.pages[page]=[];history=[];redo=[];schedule();redraw();
    }));
  const previous=action("Page précédente",()=>changePage(page-1));
  const pageLabel=elt("strong","math-page-label","Page 1 / 1");
  const next=action("Page suivante",()=>changePage(page+1));
  const addPage=action("Nouvelle feuille",()=>{
    if(work.pages.length>=8)return;
    work.pages.push([]);page=work.pages.length-1;history=[];redo=[];
    schedule();redraw();
  });
  pagesRow.append(previous,pageLabel,next,addPage);
  function changePage(index){
    if(index<0||index>=work.pages.length)return;
    flush();page=index;pointer=null;history=[];redo=[];redraw();
  }
  setMode("draw");
  function setContext(nextKey,title="Activité"){
    if(nextKey===key)return;
    if(key&&!flush())return;
    if(nextKey===null){
      key=null;detail.hidden=true;return;
    }
    const saved=readWork(snapshot().workbook,nextKey);
    key=nextKey;work=saved;lastSaved=JSON.stringify(saved);
    page=0;pointer=null;redo=[];history=[];
    heading.textContent=title;textArea.value=work.text;
    detail.hidden=false;redraw();
    showStatus("Cahier prêt : aucun export à effectuer.");
  }
  detail.hidden=true;
  redraw();
  document.addEventListener("visibilitychange",()=>{if(document.hidden)flush();});
  window.addEventListener("pagehide",flush);
  return {setContext,flush,moveTo:parent=>parent.append(detail),getContext:()=>key,getWork:()=>structuredClone(work)};
}
