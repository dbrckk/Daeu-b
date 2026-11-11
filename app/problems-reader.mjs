import {initReadingTools} from "./reading-tools.mjs";
import {TOPICS} from "./questions.mjs";
import {injectVariants} from "./variants.mjs";
import {flatten} from "./engine.mjs";
import {createPersistence,DATA_KEY,StaleDataError} from "./persistence.mjs";
import {recordTransferReview,transferStatus,transferSummary,recommendedTransferSeries} from "./transfer-progress.mjs";
const el=id=>document.getElementById(id);
const params=new URL(location.href).searchParams;
const transfers=params.get("set")==="transferts";
const variant=transfers&&["b","c"].includes(params.get("variante"))?params.get("variante"):"a";
const selectedJalon=Number(params.get("jalon"));
const jalonSuffix=Number.isInteger(selectedJalon)&&selectedJalon>=1&&selectedJalon<=20?"&jalon="+selectedJalon:"";
const collectionSuffix=transfers?"set=transferts&"+(variant==="a"?"":"variante="+variant+"&"):"";
const updateOutline=initReadingTools(el("problemBody"),el("problemTextSize"),el("problemToc"),{
  documentId:(transfers?"transferts"+(variant==="a"?"":"-"+variant)+":":"problemes:")+(params.get("mode")==="corriges"?"corriges":"sujets"),
  saveButton:el("problemBookmarkSave"),resumeButton:el("problemBookmarkResume"),
  clearButton:el("problemBookmarkClear"),status:el("problemBookmarkStatus")
});
const files=transfers?{
  sujets:"./transferts/sujets"+(variant==="a"?"":"-"+variant)+".md",
  corriges:"./transferts/corriges"+(variant==="a"?"":"-"+variant)+".md"
}:{sujets:"./problemes/sujets.md",corriges:"./problemes/corriges.md"};
const mode=params.get("mode")==="corriges"?"corriges":"sujets";
const other=mode==="sujets"?"corriges":"sujets";
el("problemSwitch").href="./problems.html?"+collectionSuffix+"mode="+other+jalonSuffix;
el("problemSwitch").textContent=mode==="sujets"?"Consulter les corrigés détaillés":"Retour aux sujets sans les réponses";
el("problemTitle").textContent=transfers?(mode==="sujets"?"20 problèmes de transfert — série "+variant.toUpperCase():"Corrigés des 20 transferts — série "+variant.toUpperCase()):(mode==="sujets"?"8 problèmes progressifs":"Corrigés des 8 problèmes");
document.title=el("problemTitle").textContent+" · DAEU B";
function initTransferTracker(){
  if(!transfers)return;
  const panel=el("transferTracking");panel.hidden=false;
  const selector=el("transferSelect");
  for(let id=1;id<=20;id++){
    const option=document.createElement("option");
    option.value=String(id);option.textContent="T"+String(id).padStart(2,"0")+" — Jalon "+id;
    selector.append(option);
  }
  selector.value=String(selectedJalon>=1&&selectedJalon<=20?selectedJalon:1);
  const form=el("transferForm"),notice=el("transferNotice"),button=el("transferRecord");
  const checks=[...panel.querySelectorAll(".transfer-criterion")];
  const attest=el("transferAttest");
  let data=null;
  try {
    const knownIds=new Set(flatten(injectVariants(TOPICS)).map(q=>q.id));
    data=createPersistence(localStorage,knownIds);
  }catch(err){
    notice.textContent="Stockage indisponible ou sauvegarde illisible : aucun historique n'est modifié. Utilise l'atelier pour vérifier tes données.";
    form.hidden=true;
    return;
  }
  function render(){
    let snapshot;
    try{snapshot=data.snapshot();}
    catch(err){
      form.hidden=true;
      notice.textContent="Historique modifié dans un autre onglet. Recharge cette page avant d'enregistrer pour protéger tes réponses.";
      return;
    }
    const id=Number(selector.value);
    const status=transferStatus(snapshot.transfers,id);
    const summary=transferSummary(snapshot.transfers);
    el("transferGlobal").textContent=summary.started+"/20 transferts rédigés · "+summary.due+" rappel(s) à effectuer · "+summary.completed+" parcours J0/J+7/J+30 déclarés terminés.";
    const nextSeries=variant==="a"?"b":variant==="b"?"c":"a";
    const alternate=el("transferVariantSwitch");
    alternate.href="./problems.html?set=transferts&jalon="+id+"&mode="+mode+(nextSeries==="a"?"":"&variante="+nextSeries);
    alternate.textContent="Essayer la situation "+nextSeries.toUpperCase()+" du jalon";
    const seriesNav=el("transferSeries");
    seriesNav.replaceChildren();
    for(const name of ["a","b","c"]){
      const link=document.createElement("a");
      link.href="./problems.html?set=transferts&jalon="+id+"&mode="+mode+(name==="a"?"":"&variante="+name);
      link.textContent="Série "+name.toUpperCase();
      link.dataset.series=name;
      if(name===variant)link.setAttribute("aria-current","page");
      seriesNav.append(link);
    }
    const suggested=recommendedTransferSeries(status).toUpperCase();
    el("transferVarietyTip").textContent=status.stage===7?"Pour J+7, privilégie la série B, différente de la première rédaction.":status.stage===30?"Pour J+30, privilégie la série C, un troisième contexte inédit.":"Trois situations A, B, C pour le même jalon ; série conseillée actuellement : "+suggested+".";
    const formatDate=value=>new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(value));
    const stageName=status.count===0?"Première rédaction (J0)":status.done?"Trois déclarations enregistrées":status.stage===7?"Rappel J+7":"Rappel J+30";
    const detail=status.done?"Le parcours prévu est enregistré, sans certification de maîtrise.":status.dueAt===null?"Commence par résoudre le sujet sans regarder la correction.":status.due?"Le rappel est arrivé à échéance : résous à nouveau sans solution visible.":"Prochaine auto-évaluation possible à partir du "+formatDate(status.dueAt)+".";
    const criteria=status.criteria?status.criteria.filter(Boolean).length+"/4 critères déclarés lors de la dernière rédaction. ":"";
    el("transferStage").textContent=stageName+" — "+criteria+detail;
    const canRecord=!status.done&&(status.dueAt===null||status.due);
    form.hidden=false;
    button.disabled=!canRecord;
    button.textContent=canRecord?"Enregistrer mon auto-évaluation":status.done?"Parcours de rappels terminé":"Rappel pas encore à échéance";
    checks.forEach(x=>{x.checked=false;x.disabled=!canRecord;});
    attest.checked=false;attest.disabled=!canRecord;
  }
  selector.addEventListener("change",()=>{
    const next=Number(selector.value);
    location.href="./problems.html?set=transferts&mode="+mode+"&jalon="+next+(variant==="a"?"":"&variante="+variant);
  });
  form.addEventListener("submit",event=>{
    event.preventDefault();
    if(!attest.checked){notice.textContent="Confirme d'abord avoir rédigé ta solution et lu le corrigé.";return;}
    try{
      const snapshot=data.snapshot();
      const next=recordTransferReview(snapshot.transfers,Number(selector.value),checks.map(x=>x.checked));
      data.updateTransfers(next);
      notice.textContent="Auto-évaluation enregistrée avec sa date. Elle ne constitue pas une note automatique.";
      render();
    }catch(err){
      if(err instanceof StaleDataError){
        form.hidden=true;
        notice.textContent="Une autre page a modifié la progression. Recharge pour récupérer la version récente sans perdre de données.";
      }else notice.textContent="Enregistrement refusé : "+err.message;
    }
  });
  window.addEventListener("storage",event=>{
    if((event.key===DATA_KEY||event.key===null)&&data.isStale()){
      form.hidden=true;
      notice.textContent="Progression modifiée dans un autre onglet : recharge pour éviter tout écrasement.";
    }
  });
  render();
}
initTransferTracker();

const markdown=new showdown.Converter({tables:true,ghCodeBlocks:true,tasklists:true,strikethrough:true,backslashEscapesHTMLTags:true});
function protectMath(src){
  const items=[];
  const cleaned=src.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<!\\)\$([^$\n]+?)\$/g,(match,a,b,c,d)=>{
    const block=a!==undefined||b!==undefined;
    const token="DAEUMATHTOKEN"+items.length+"END";
    items.push({tex:a??b??c??d,block});
    return (block?"\n\n":"")+token+(block?"\n\n":"");
  });
  return {cleaned,items};
}
function restoreMath(target,items){
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT),nodes=[];
  while(walker.nextNode())if(walker.currentNode.nodeValue.includes("DAEUMATHTOKEN"))nodes.push(walker.currentNode);
  for(const node of nodes){
    const fragment=document.createDocumentFragment(),source=node.nodeValue;
    let start=0;
    for(const match of source.matchAll(/DAEUMATHTOKEN(\d+)END/g)){
      fragment.append(document.createTextNode(source.slice(start,match.index)));
      const item=items[Number(match[1])];
      const span=document.createElement("span");
      span.className=item.block?"course-math-block":"course-math-inline";
      span.setAttribute("aria-label",item.tex);
      try{
        const html=temml.renderToString(item.tex,{displayMode:item.block,throwOnError:true,trust:false});
        const safe=DOMPurify.sanitize(html,{USE_PROFILES:{mathMl:true}});
        if(!safe.includes("<math"))throw Error("MathML manquant");
        span.innerHTML=safe;
      }catch{span.textContent=item.tex;span.classList.add("course-math-fallback");}
      fragment.append(span);start=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(source.slice(start)));
    node.replaceWith(fragment);
  }
}
async function load(){
  try{
    const response=await fetch(files[mode]);
    if(!response.ok)throw Error("HTTP "+response.status);
    const src=await response.text();
    if(!src.startsWith("# "))throw Error("Fichier incomplet");
    const {cleaned,items}=protectMath(src);
    const html=DOMPurify.sanitize(markdown.makeHtml(cleaned),{
      FORBID_TAGS:["script","style","iframe","object","embed","form","img"],
      FORBID_ATTR:["style","srcdoc","onerror","onclick","onload"]
    });
    const target=el("problemBody");
    target.innerHTML=html;
    restoreMath(target,items);
    for(const a of target.querySelectorAll("a[href]")){
      const href=a.getAttribute("href");
      if(/^(?:\.\/)?corriges\.md(?:#.*)?$/.test(href))a.href="./problems.html?"+collectionSuffix+"mode=corriges"+jalonSuffix;
      else if(/^(?:\.\/)?sujets\.md(?:#.*)?$/.test(href))a.href="./problems.html?"+collectionSuffix+"mode=sujets"+jalonSuffix;
      else if(href.startsWith("#"))continue;
      else a.removeAttribute("href");
    }
    updateOutline();
    if(transfers&&jalonSuffix){
      const prefix="T"+String(selectedJalon).padStart(2,"0")+" ";
      const heading=[...target.querySelectorAll("h2")].find(h=>h.textContent.trim().startsWith(prefix));
      if(heading){
        heading.scrollIntoView({block:"start"});
        heading.setAttribute("tabindex","-1");heading.focus({preventScroll:true});
        const link=document.createElement("a");
        link.href="#transferTracking";
        link.className="reader-section-save";
        link.textContent="Après correction : noter mon raisonnement";
        heading.insertAdjacentElement("afterend",link);
      }
    }
    const details=transfers?(mode==="sujets"?"20 problèmes de transfert · 20 jalons":"20 corrigés et grilles de raisonnement"):(mode==="sujets"?"37 questions · 8 problèmes · 3 niveaux":"37 corrections détaillées · 8 problèmes");
    el("problemStatus").textContent=details+" · Lecture hors connexion";
  }catch(error){
    el("problemBody").textContent="Contenu indisponible. Charge une fois l'application en ligne pour installer les sujets et leurs corrections.";
    el("problemStatus").textContent="Erreur de chargement : "+error.message;
  }
}
load();
