import {initReadingTools} from "./reading-tools.mjs";
const el=id=>document.getElementById(id);
const updateOutline=initReadingTools(el("problemBody"),el("problemTextSize"),el("problemToc"));
const files={sujets:"./problemes/sujets.md",corriges:"./problemes/corriges.md"};
const params=new URL(location.href).searchParams;
const mode=params.get("mode")==="corriges"?"corriges":"sujets";
const other=mode==="sujets"?"corriges":"sujets";
el("problemSwitch").href="./problems.html?mode="+other;
el("problemSwitch").textContent=mode==="sujets"?"Consulter les corrigés détaillés":"Retour aux sujets sans les réponses";
el("problemTitle").textContent=mode==="sujets"?"8 problèmes progressifs":"Corrigés des 8 problèmes";
document.title=el("problemTitle").textContent+" · DAEU B";
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
      if(/^(?:\.\/)?corriges\.md(?:#.*)?$/.test(href))a.href="./problems.html?mode=corriges";
      else if(/^(?:\.\/)?sujets\.md(?:#.*)?$/.test(href))a.href="./problems.html?mode=sujets";
      else if(href.startsWith("#"))continue;
      else a.removeAttribute("href");
    }
    updateOutline();
    el("problemStatus").textContent=(mode==="sujets"?"37 questions · 8 problèmes · 3 niveaux":"37 corrections détaillées · 8 problèmes")+" · Lecture hors connexion";
  }catch(error){
    el("problemBody").textContent="Contenu indisponible. Charge une fois l'application en ligne pour installer les sujets et leurs corrections.";
    el("problemStatus").textContent="Erreur de chargement : "+error.message;
  }
}
load();
