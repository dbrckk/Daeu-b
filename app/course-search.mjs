/** Recherche textuelle locale : résultats sans HTML ni transfert de requête. */
export function validSearchQuery(raw){
  if(typeof raw!=="string")return null;
  const q=raw.trim().replace(/\s+/g," ");
  return q.length>=2&&q.length<=80?q:null;
}
export function normalizeSearchText(value){
  return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr-FR");
}
function compactText(value){
  return value.replace(/\\([a-zA-Z]+)/g,"$1").replace(/\s+/g," ").trim();
}

export function searchCourseDocs(docs,rawQuery,{limit=18}={}){
  const query=validSearchQuery(rawQuery);if(!query)return [];
  const normalizedQuery=normalizeSearchText(query),terms=normalizedQuery.split(" ");
  const matches=[];
  for(const doc of docs){
    if(!doc?.sections?.length)continue;
    const title=normalizeSearchText(doc.title);
    const sections=doc.sections.map(section=>{
      const plain=compactText(section.text),hay=normalizeSearchText(plain);
      const heading=normalizeSearchText(section.title);
      const count=terms.filter(term=>heading.includes(term)||hay.includes(term)).length;
      const headingHits=terms.filter(term=>heading.includes(term)).length;
      const phraseScore=heading.includes(normalizedQuery)?100:(hay.includes(normalizedQuery)?35:0);
      const score=phraseScore+10*count+8*headingHits;
      return {...section,plain,hay,heading,score};
    });
    if(!terms.every(term=>title.includes(term)||sections.some(({heading,hay})=>heading.includes(term)||hay.includes(term))))continue;
    const best=sections.reduce((a,b)=>b.score>a.score?b:a);
    const {id:sectionId,title:sectionTitle,plain,hay}=best;
    const phraseAt=hay.indexOf(normalizedQuery);
    const firstTerm=terms.find(term=>hay.includes(term));
    const firstAt=phraseAt>=0?phraseAt:hay.indexOf(firstTerm??"");
    const start=Math.max(0,firstAt-65),end=Math.min(plain.length,firstAt+145);
    const excerpt=(start?"…":"")+plain.slice(start,end).trim()+(end<plain.length?"…":"");
    const score=best.score+(title.includes(normalizedQuery)?70:0)+terms.reduce((n,t)=>n+(title.includes(t)?12:0),0);
    matches.push({slug:doc.slug,title:doc.title,sectionId,sectionTitle,excerpt,score});
  }
  return matches.sort((a,b)=>b.score-a.score||a.slug.localeCompare(b.slug)).slice(0,Math.max(0,Math.min(18,limit)));
}
