/**
 * Contrôles de lecture locaux et accessibles, communs aux cours et problèmes.
 * Préférence de taille volontairement indépendante des copies d'examens.
 */
import {readBookmark,saveBookmark,clearBookmark,saveLastReading} from "./reading-bookmark.mjs";
const KEY="daeu-b-reading-size-v1";
const VALID=new Set(["normal","large","extra"]);
export function readerSectionHeadings(article){
  const headings=[...article.querySelectorAll("h2,h3")];
  const used=new Set();
  for(const [i,heading] of headings.entries()){
    let id=heading.id&&!used.has(heading.id)?heading.id:"lecture-section-"+(i+1);
    while(used.has(id))id+="-suite";
    used.add(id);
    heading.id=id;
  }
  return headings;
}
export function initReadingTools(article,sizeSelect,outline,{documentId,getJalon=()=>undefined,saveButton,resumeButton,clearButton,status}={}){
  function setSize(value){
    const size=VALID.has(value)?value:"normal";
    article.dataset.readingSize=size;
    sizeSelect.value=size;
  }
  let storage,saved="normal";
  try{storage=window.localStorage;saved=storage.getItem(KEY)||"normal";}catch{/* navigation privée/quota */ }
  setSize(saved);
  sizeSelect.addEventListener("change",()=>{
    setSize(sizeSelect.value);
    try{storage.setItem(KEY,sizeSelect.value);}catch{/* lecture toujours utilisable */ }
  });
  function goTo(heading){
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:"start"});
  }
  const saveAt=heading=>saveBookmark(storage,documentId,heading.dataset.readerBookmarkId,{jalon:getJalon(heading)});
  let headings=[],readingTimer=null;
  if(documentId&&storage){
    function recordReading(){
      clearTimeout(readingTimer);
      readingTimer=null;
      const line=Math.min(160,window.innerHeight/4);
      const bounds=article.getBoundingClientRect();
      if(bounds.top>line||bounds.bottom<=line)return;
      const heading=headings.findLast(item=>item.getBoundingClientRect().top<=line);
      if(heading)saveLastReading(storage,documentId,heading.dataset.readerBookmarkId,getJalon(heading));
    }
    window.addEventListener("scroll",()=>{
      if(!document.hidden&&readingTimer===null)readingTimer=setTimeout(recordReading,200);
    },{passive:true});
    const flushReading=()=>{if(readingTimer!==null)recordReading();};
    window.addEventListener("pagehide",flushReading);
    document.addEventListener("visibilitychange",()=>{if(document.hidden)flushReading();});
  }
  function openLinkedSection(){
    let requested;
    try{requested=decodeURIComponent(location.hash.slice(1));}catch{return;}
    if(!requested)return;
    const bookmarked=new URLSearchParams(location.search).get("signet")==="1";
    const marked=bookmarked?headings.find(h=>h.dataset.readerBookmarkId===requested):null;
    const target=marked??headings.find(h=>h.id===requested);
    if(target)requestAnimationFrame(()=>goTo(target));
  }
  window.addEventListener("hashchange",openLinkedSection);
  return function rebuildOutline(){
    headings=readerSectionHeadings(article);
    const list=document.createElement("ol");
    for(const [i,heading] of headings.entries()){
      heading.dataset.readerBookmarkId="lecture-section-"+(i+1);
      heading.tabIndex=-1;
      const li=document.createElement("li");
      const link=document.createElement("a");
      link.href="#"+encodeURIComponent(heading.id);
      link.textContent=heading.textContent.trim()||"Section "+(i+1);
      link.addEventListener("click",()=>heading.focus({preventScroll:true}));
      if(heading.tagName==="H3")li.className="reader-outline-subsection";
      li.append(link);list.append(li);
    }
    outline.replaceChildren(list);
    if(documentId&&saveButton&&resumeButton&&clearButton&&status){
      const available=()=>{
        const saved=readBookmark(storage,documentId);
        return headings.find(h=>h.dataset.readerBookmarkId===saved||h.id===saved);
      };
      function refresh(){
        const target=available();
        resumeButton.hidden=!target;
        clearButton.hidden=!target;
        resumeButton.textContent=target?"Reprendre : "+target.textContent.trim():"Reprendre ma lecture";
      }
      function announce(message){
        status.textContent=message;
        clearTimeout(announce.clearTimer);
        announce.clearTimer=setTimeout(()=>{status.textContent="";},5500);
      }
      saveButton.onclick=()=>{
        // Conserver le dernier titre atteint, pas un décalage de pixels
        // fragile après zoom, changement de police ou mise à jour du cours.
        const reached=headings.filter(h=>h.getBoundingClientRect().top<=48);
        const current=reached.at(-1)??headings[0];
        if(!current){announce("Aucune section à enregistrer.");return;}
        const ok=saveAt(current);
        announce(ok?"Position enregistrée : "+current.textContent.trim()+".":"Stockage indisponible : position non enregistrée.");
        refresh();
      };
      resumeButton.onclick=()=>{
        const heading=available();
        if(heading)goTo(heading);
        else {announce("Signet indisponible : cette section n'existe plus.");refresh();}
      };
      clearButton.onclick=()=>{
        const ok=clearBookmark(storage,documentId);
        announce(ok?"Signet supprimé.":"Impossible de supprimer le signet.");
        refresh();
      };
      // Action au plus près du titre : le clic n'oblige pas à remonter
      // dans le sommaire et ne déplace pas le repère de lecture avant sauvegarde.
      for(const heading of headings){
        const mark=document.createElement("button");
        mark.type="button";
        mark.className="reader-section-save";
        mark.textContent="Marquer cette section";
        mark.setAttribute("aria-label","Marquer ma lecture à : "+heading.textContent.trim());
        mark.addEventListener("click",()=>{
          const ok=saveAt(heading);
          announce(ok?"Signet enregistré : "+heading.textContent.trim()+".":"Stockage indisponible : signet non enregistré.");
          refresh();
        });
        heading.after(mark);
      }
      refresh();
    }
    openLinkedSection();
  };
}
