/**
 * Contrôles de lecture locaux et accessibles, communs aux cours et problèmes.
 * Préférence de taille volontairement indépendante des copies d'examens.
 */
const KEY="daeu-b-reading-size-v1";
const VALID=new Set(["normal","large","extra"]);
export function initReadingTools(article,sizeSelect,outline){
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
