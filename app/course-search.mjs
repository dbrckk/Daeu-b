/** Recherche textuelle locale : résultats sans HTML ni transfert de requête. */
export function validSearchQuery(raw){
  if(typeof raw!=="string")return null;
  const q=raw.trim().replace(/\s+/g," ");
  return q.length>=2&&q.length<=80?q:null;
}
export function normalizeSearchText(value){
  return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr-FR");
}
function plainText(markdown){
  return String(markdown??"").replace(/\x60{3}[\s\S]*?\x60{3}/g," ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g,"$1").replace(/\[([^\]]+)\]\([^)]*\)/g,"$1")
    .replace(/https?:\/\/\S+/g," ").replace(/[*_#>|\x60$]/g," ")
    .replace(/\\([a-zA-Z]+)/g,"$1").replace(/\s+/g," ").trim();
}
export function searchCourseDocs(docs,rawQuery,{limit=18}={}){
  const query=validSearchQuery(rawQuery);if(!query)return [];
  const normalizedQuery=normalizeSearchText(query),terms=normalizedQuery.split(" ");
  const matches=[];
  for(const doc of docs){
    if(!doc||typeof doc.slug!=="string"||typeof doc.title!=="string"||typeof doc.content!=="string")continue;
    const plain=plainText(doc.content),hay=normalizeSearchText(plain),title=normalizeSearchText(doc.title);
    if(!terms.every(term=>hay.includes(term)||title.includes(term)))continue;
    const phraseAt=hay.indexOf(normalizedQuery),firstAt=Math.max(0,phraseAt>=0?phraseAt:hay.indexOf(terms[0]));
    const start=Math.max(0,firstAt-65),end=Math.min(plain.length,firstAt+145);
    const excerpt=(start?"…":"")+plain.slice(start,end).trim()+(end<plain.length?"…":"");
    const score=(phraseAt>=0?100:0)+(title.includes(normalizedQuery)?70:0)+terms.reduce((n,t)=>n+(title.includes(t)?12:0),0);
    matches.push({slug:doc.slug,title:doc.title,excerpt,score});
  }
  return matches.sort((a,b)=>b.score-a.score||a.slug.localeCompare(b.slug)).slice(0,Math.max(0,Math.min(18,limit)));
}
