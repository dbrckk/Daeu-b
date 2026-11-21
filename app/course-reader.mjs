import {renderMathMarkdown} from "./math-markdown.mjs";
import {COURSES,courseInfo,courseUrl,practiceTopicForCourse,practiceUrlForCourse} from "./course-catalog.mjs";
import {JALONS} from "./jalons.mjs";
import {initReadingTools,readerSectionHeadings} from "./reading-tools.mjs";
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
const courseSources=new Map();
function loadCourseText(key){
  if(!courseSources.has(key))courseSources.set(key,(async()=>{
    const response=await fetch("./cours/"+key+".md");
    if(!response.ok)throw Error("HTTP "+response.status);
    const content=await response.text();
    if(!content.startsWith("# "))throw Error("Contenu de cours incomplet");
    return content;
  })().catch(error=>{courseSources.delete(key);throw error;}));
  return courseSources.get(key);
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
    const src=await loadCourseText(slug);
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
const indexedCourses=new Map();
function indexSections(content){
  const draft=document.createElement("div");
  renderMathMarkdown(draft,content,markdown,{typeset:false});
  const headings=readerSectionHeadings(draft);
  const range=document.createRange();
  return [null,...headings].map((heading,index)=>{
    range.selectNodeContents(draft);
    if(heading)range.setStartAfter(heading);
    if(headings[index])range.setEndBefore(headings[index]);
    return {id:heading?.id??null,title:heading?.textContent.trim()??"",text:range.toString()};
  });
}

async function corpus(){
  const missing=COURSES.filter(([key])=>!indexedCourses.has(key));
  await Promise.allSettled(missing.map(async([key,title])=>{
    indexedCourses.set(key,{slug:key,title,sections:indexSections(await loadCourseText(key))});
  }));
  return [...indexedCourses.values()];
}
byId("courseSearchForm").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget;
  const results=byId("courseSearchResults"),status=byId("courseSearchStatus");
  const button=byId("courseSearchSubmit"),input=byId("courseSearchInput"),query=validSearchQuery(input.value);
  if(button.disabled)return;
  results.replaceChildren();
  if(!query){status.textContent="Saisis entre 2 et 80 caractères.";return;}
  button.disabled=true;status.textContent="Recherche dans les 18 cours…";
  try{
    const docs=await corpus();
    if(!docs.length)throw Error("Bibliothèque vide");
    const matches=searchCourseDocs(docs,query);
    for(const item of matches){
      const li=document.createElement("li"),a=document.createElement("a"),p=document.createElement("p");
      a.href=courseUrl(item.slug)+"#"+encodeURIComponent(item.sectionId??"courseBody");
      a.textContent=item.title+(item.sectionTitle?" · "+item.sectionTitle:"");
      p.textContent=item.excerpt;
      li.append(a,p);results.append(li);
    }
    const unavailable=COURSES.length-docs.length;
    status.textContent=(matches.length
      ?matches.length+" cours correspondant"+(matches.length>1?"s":"")+" sur "+docs.length+"."
      :"Aucun cours correspondant. Essaie un terme plus général.")
      +(unavailable?" "+unavailable+" cours indisponible"+(unavailable>1?"s":"")+". Relance la recherche pour réessayer.":"");
  }catch{
    status.textContent="Bibliothèque indisponible. Ouvre d'abord le site avec Internet pour mettre les cours en cache.";
  }finally{
    button.disabled=false;
    if(validSearchQuery(input.value)===query&&(document.activeElement===document.body||form.contains(document.activeElement)))
      (results.querySelector("a")??input).focus();
  }
});
