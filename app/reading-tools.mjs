/**
 * Contrôles de lecture locaux et accessibles, communs aux cours et problèmes.
 * Préférence de taille volontairement indépendante des copies d'examens.
 */
import {readBookmark,saveBookmark,clearBookmark} from "./reading-bookmark.mjs";
const KEY="daeu-b-reading-size-v1";
const VALID=new Set(["normal","large","extra"]);
export function initReadingTools(article,sizeSelect,outline,{documentId,saveButton,resumeButton,clearButton,status}={}){
  function setSize(value){
    const size=VALID.has(value)?value:"normal";
    article.dataset.readingSize=size;
    sizeSelect.value=size;
  }
  let saved="normal";
  try{saved=localStorage.getItem(KEY)||"normal";}catch{/* navigation privée/quota */ }
  setSize(saved);
  sizeSelect.addEventListener("change",()=>{
    setSize(sizeSelect.value);
    try{localStorage.setItem(KEY,sizeSelect.value);}catch{/* lecture toujours utilisable */ }
  });
  return function rebuildOutline(){
    const headings=[...article.querySelectorAll("h2,h3")],used=new Set();
    const list=document.createElement("ol");
    for(const [i,heading] of headings.entries()){
      let id=heading.id && !used.has(heading.id)?heading.id:"lecture-section-"+(i+1);
      while(used.has(id))id+="-suite";
      used.add(id);
      heading.id=id;
      heading.dataset.readerBookmarkId="lecture-section-"+(i+1);
      heading.tabIndex=-1;
      const li=document.createElement("li");
      const link=document.createElement("a");
      link.href="#"+encodeURIComponent(id);
      link.textContent=heading.textContent.trim()||"Section "+(i+1);
      link.addEventListener("click",()=>heading.focus({preventScroll:true}));
      if(heading.tagName==="H3")li.className="reader-outline-subsection";
      li.append(link);list.append(li);
    }
    outline.replaceChildren(list);
    if(documentId&&saveButton&&resumeButton&&clearButton&&status){
      const available=()=>{
        const saved=readBookmark(localStorage,documentId);
        return headings.find(h=>h.dataset.readerBookmarkId===saved||h.id===saved);
      };
      function refresh(){
        const target=available();
        resumeButton.hidden=!target;
        clearButton.hidden=!target;
        resumeButton.textContent=target?"Reprendre : "+target.textContent.trim():"Reprendre ma lecture";
      }
      function goTo(heading){
        heading.focus({preventScroll:true});
        heading.scrollIntoView({block:"start"});
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
        const ok=saveBookmark(localStorage,documentId,current.dataset.readerBookmarkId);
        announce(ok?"Position enregistrée : "+current.textContent.trim()+".":"Stockage indisponible : position non enregistrée.");
        refresh();
      };
      resumeButton.onclick=()=>{
        const heading=available();
        if(heading)goTo(heading);
        else {announce("Signet indisponible : cette section n'existe plus.");refresh();}
      };
      clearButton.onclick=()=>{
        const ok=clearBookmark(localStorage,documentId);
        announce(ok?"Signet supprimé.":"Impossible de supprimer le signet.");
        refresh();
      };
      refresh();
    }
    // Les contenus sont chargés après le document HTML : restaurer un lien
    // direct vers une section (y compris hors réseau).
    if(location.hash){
      let requested="";
      try{requested=decodeURIComponent(location.hash.slice(1));}catch{}
      const target=headings.find(h=>h.id===requested);
      if(target)requestAnimationFrame(()=>target.scrollIntoView({block:"start"}));
    }
  };
}
