import {renderMathMarkdown} from "./math-markdown.mjs";
import {COURSES,courseInfo,courseUrl,practiceTopicForCourse,practiceUrlForCourse} from "./course-catalog.mjs";
import {JALONS} from "./jalons.mjs";
import {initReadingTools} from "./reading-tools.mjs";
import {mountNotebook,notebookMode} from "./math-notebook.mjs";
import {createPersistence} from "./persistence.mjs";
import {backedStorage} from "./auto-backup.mjs";
import {TOPICS} from "./questions.mjs";
import {injectVariants} from "./variants.mjs";
import {flatten} from "./engine.mjs";
import {validSearchQuery,searchCourseDocs} from "./course-search.mjs";
const byId=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
let slug=params.get("course")||"00-positionnement";
if(!courseInfo(slug))slug="00-positionnement";
const selector=byId("courseSelector");
for(const [key,title] of COURSES){
  const option=document.createElement("option");option.value=key;option.textContent=title;selector.append(option);
}
selector.value=slug;
try{
  const ids=new Set(flatten(injectVariants(TOPICS)).map(q=>q.id));
  const notebookStore=createPersistence(backedStorage(localStorage),ids);
  const inputMode=notebookMode();
  mountNotebook(byId("courseNotebook"),{context:"cours:"+slug,adapter:notebookStore,
    title:"Ma prise de notes et mes calculs — "+courseInfo(slug),
    textOnly:inputMode==="clavier",paperOnly:inputMode==="manuscrit",showEditor:true,paperPrompt:"Note tes idées et pose les calculs du chapitre sur cette feuille."});
}catch{byId("courseNotebook").textContent="Le cahier ne peut pas être ouvert : vérifie le stockage du navigateur.";}

const practice=byId("coursePractice");
const jalon=JALONS.find(item=>String(item.id)===params.get("jalon")&&item.lesson===slug+".md");
const exerciseUrl=practiceUrlForCourse(slug,{jalon:jalon?.id});
practice.href=exerciseUrl;
byId("courseNotebookPractice").href=exerciseUrl;
practice.textContent=jalon?"M’entraîner sur le jalon "+jalon.id
  :practiceTopicForCourse(slug)?"M'entraîner sur ce chapitre":"M'entraîner sur le tronc commun";
practice.setAttribute("aria-label",practice.textContent+" : "+(jalon?.title??courseInfo(slug)));
selector.addEventListener("change",()=>{location.href=courseUrl(selector.value);});
const index=COURSES.findIndex(([key])=>key===slug);
for(const [id,diff] of [["coursePrevious",-1],["courseNext",1]]){
  const element=byId(id),neighbor=COURSES[index+diff];
  if(!neighbor){element.hidden=true;continue;}
  element.href=courseUrl(neighbor[0]);
  element.textContent=(diff<0?"← ":"")+neighbor[1]+(diff>0?" →":"");
}
const updateOutline=initReadingTools(byId("courseBody"),byId("courseTextSize"),byId("courseToc"),{
  documentId:"cours:"+slug,
  getJalon:()=>jalon?.id,
  saveButton:byId("courseBookmarkSave"),resumeButton:byId("courseBookmarkResume"),
  clearButton:byId("courseBookmarkClear"),status:byId("courseBookmarkStatus")
});
const markdown=new showdown.Converter({
  tables:true,ghCodeBlocks:true,tasklists:true,strikethrough:true,
  simplifiedAutoLink:false,openLinksInNewWindow:false,backslashEscapesHTMLTags:true
});
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
    const target=byId("courseBody");
    renderMathMarkdown(target,src,markdown);
    sanitizeLinks(target);
    updateOutline();
    byId("courseStatus").textContent="Cours "+(index+1)+"/18 · Contenu intégral et formules mathématiques";
  }catch(error){
    byId("courseBody").textContent="Cours indisponible. Ouvre l'Atelier avec une connexion au moins une fois pour télécharger la bibliothèque hors connexion.";
    byId("courseStatus").textContent="Échec du chargement du cours : "+(error.message||error);
  }
}
displayCourse();
// Chargement des 18 cours uniquement à la première recherche ; cache PWA hors ligne.
let corpusPromise=null;
async function corpus(){
  if(!corpusPromise)corpusPromise=Promise.all(COURSES.map(async([key,title])=>{
    const response=await fetch("./cours/"+key+".md");
    if(!response.ok)throw Error("Cours indisponible "+key);
    const content=await response.text();
    if(!content.startsWith("# "))throw Error("Cours incomplet "+key);
    return {slug:key,title,content};
  })).catch(error=>{corpusPromise=null;throw error;});
  return corpusPromise;
}
byId("courseSearchForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const results=byId("courseSearchResults"),status=byId("courseSearchStatus");
  const button=byId("courseSearchSubmit"),query=validSearchQuery(byId("courseSearchInput").value);
  results.replaceChildren();
  if(!query){status.textContent="Saisis entre 2 et 80 caractères.";return;}
  button.disabled=true;status.textContent="Recherche dans les 18 cours…";
  try{
    const matches=searchCourseDocs(await corpus(),query);
    for(const item of matches){
      const li=document.createElement("li"),a=document.createElement("a"),p=document.createElement("p");
      a.href=courseUrl(item.slug);a.textContent=item.title;p.textContent=item.excerpt;
      li.append(a,p);results.append(li);
    }
    status.textContent=matches.length
      ?matches.length+" cours correspondant"+(matches.length>1?"s":"")+" sur 18."
      :"Aucun cours correspondant. Essaie un terme plus général.";
  }catch{
    status.textContent="Bibliothèque indisponible. Ouvre d'abord le site avec Internet pour mettre les cours en cache.";
  }finally{button.disabled=false;}
});
