import {COURSES,courseInfo,courseUrl,practiceTopicForCourse,practiceUrlForCourse} from "./course-catalog.mjs";
const byId=id=>document.getElementById(id);
let slug=new URL(location.href).searchParams.get("course")||"00-positionnement";
if(!courseInfo(slug))slug="00-positionnement";
const selector=byId("courseSelector");
for(const [key,title] of COURSES){
  const option=document.createElement("option");option.value=key;option.textContent=title;selector.append(option);
}
selector.value=slug;
const practice=byId("coursePractice");
practice.href=practiceUrlForCourse(slug);
practice.textContent=practiceTopicForCourse(slug)
  ?"M'entraîner sur ce chapitre"
  :"M'entraîner sur le tronc commun";
practice.setAttribute("aria-label",practice.textContent+" : "+courseInfo(slug));
selector.addEventListener("change",()=>{location.href=courseUrl(selector.value);});
const index=COURSES.findIndex(([key])=>key===slug);
for(const [id,diff] of [["coursePrevious",-1],["courseNext",1]]){
  const element=byId(id),neighbor=COURSES[index+diff];
  if(!neighbor){element.hidden=true;continue;}
  element.href=courseUrl(neighbor[0]);
  element.textContent=(diff<0?"← ":"")+neighbor[1]+(diff>0?" →":"");
}
const markdown=new showdown.Converter({
  tables:true,ghCodeBlocks:true,tasklists:true,strikethrough:true,
  simplifiedAutoLink:false,openLinksInNewWindow:false,backslashEscapesHTMLTags:true
});
function separateMath(src){
  const equations=[];
  const cleaned=src.replace(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<!\\)\$([^$\n]+?)\$/g,
    (match,dollars,brackets,inlineBrackets,inlineDollars)=>{
      const tex=dollars??brackets??inlineBrackets??inlineDollars;
      const block=dollars!==undefined||brackets!==undefined;
      const placeholder="DAEUMATHTOKEN"+equations.length+"END";
      equations.push({tex,block});
      return (block?"\n\n":"")+placeholder+(block?"\n\n":"");
    });
  return {cleaned,equations};
}
function installMath(target,equations){
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT),found=[];
  while(walker.nextNode())if(walker.currentNode.nodeValue.includes("DAEUMATHTOKEN"))found.push(walker.currentNode);
  const regex=/DAEUMATHTOKEN(\d+)END/g;
  for(const node of found){
    const fragment=document.createDocumentFragment(),source=node.nodeValue;
    let from=0;
    for(const match of source.matchAll(regex)){
      fragment.append(document.createTextNode(source.slice(from,match.index)));
      const item=equations[Number(match[1])];
      if(!item){fragment.append(document.createTextNode(match[0]));continue;}
      const span=document.createElement("span");
      span.className=item.block?"course-math-block":"course-math-inline";
      span.setAttribute("aria-label",item.tex);
      try{
        const rendered=temml.renderToString(item.tex,{displayMode:item.block,throwOnError:true,trust:false});
        const clean=DOMPurify.sanitize(rendered,{USE_PROFILES:{mathMl:true}});
        if(!clean.includes("<math"))throw Error("Rendu MathML vide");
        span.innerHTML=clean;
      }catch(error){
        span.classList.add("course-math-fallback");span.textContent=item.tex;
      }
      fragment.append(span);
      from=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(source.slice(from)));
    node.replaceWith(fragment);
  }
}
function sanitizeLinks(target){
  for(const link of target.querySelectorAll("a[href]")){
    const raw=link.getAttribute("href");
    if(raw.startsWith("#"))continue;
    const local=raw.match(/(?:^|\/)(\d\d-[a-z0-9-]+\.md)(?:#[\w-]+)?$/);
    if(local&&courseUrl(local[1])){link.href=courseUrl(local[1]);continue;}
    try{
      const url=new URL(raw,location.href);
      if(url.protocol!=="https:"&&url.protocol!=="http:")throw Error("Lien refusé");
      link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";
    }catch{link.removeAttribute("href");}
  }
}
async function displayCourse(){
  document.title=courseInfo(slug)+" · DAEU B";
  try{
    const response=await fetch("./cours/"+slug+".md");
    if(!response.ok)throw Error("HTTP "+response.status);
    const src=await response.text();
    if(!src.startsWith("# "))throw Error("Contenu de cours incomplet");
    const {cleaned,equations}=separateMath(src);
    const safe=DOMPurify.sanitize(markdown.makeHtml(cleaned),{
      FORBID_TAGS:["script","style","iframe","object","embed","form","img"],
      FORBID_ATTR:["style","srcdoc","onerror","onclick","onload"]
    });
    const target=byId("courseBody");
    target.innerHTML=safe;
    installMath(target,equations);
    sanitizeLinks(target);
    byId("courseStatus").textContent="Cours "+(index+1)+"/18 · Contenu intégral et formules mathématiques · Cache PWA hors connexion";
  }catch(error){
    byId("courseBody").textContent="Cours indisponible. Ouvre l'Atelier avec une connexion au moins une fois pour télécharger la bibliothèque hors connexion.";
    byId("courseStatus").textContent="Échec du chargement du cours : "+(error.message||error);
  }
}
displayCourse();
