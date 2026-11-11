/**
 * Pré-requis conseillés pour étudier les 20 jalons SONATE 2026–2027.
 * Liens pédagogiques, jamais des conditions d'accès ni des acquis certifiés.
 */
import {JALONS} from "./jalons.mjs";

export const PREREQUISITES={
  1:[],2:[1],3:[2],4:[1,2],5:[4],6:[5],7:[4,5],8:[3,5],9:[2],
  10:[3,4],11:[10,4],12:[10,4],13:[11],14:[10,8],15:[4,10],
  16:[10,5],17:[10,4],18:[12,10],19:[2,9],20:[19,4]
};

/** Signale les cycles, références inexistantes, doublons et listes absentes. */
export function validatePrerequisites(jalons=JALONS,graph=PREREQUISITES){
  const errors=[],byId=new Map(jalons.map(j=>[j.id,j])),visited=new Set(),inPath=new Set();
  if(byId.size!==jalons.length)errors.push("Jalons dupliqués");
  for(const j of jalons){
    const edges=graph[j.id];
    if(!Array.isArray(edges)){errors.push("Prérequis absents : "+j.id);continue;}
    if(new Set(edges).size!==edges.length)errors.push("Prérequis dupliqués : "+j.id);
    for(const p of edges)if(!byId.has(p))errors.push("Prérequis inexistant : "+j.id+" → "+p);
  }
  for(const key of Object.keys(graph))if(!byId.has(Number(key)))errors.push("Jalon inconnu : "+key);
  function visit(id){
    if(inPath.has(id)){errors.push("Cycle de prérequis au jalon "+id);return;}
    if(visited.has(id))return;
    inPath.add(id);
    for(const dep of graph[id]||[])if(byId.has(dep))visit(dep);
    inPath.delete(id);visited.add(id);
  }
  for(const j of jalons)visit(j.id);
  return errors;
}

/** Un jalon avec des réponses correctes n'est pas nécessairement maîtrisé. */
export function prerequisiteAdvice(rows,jalon,graph=PREREQUISITES){
  const byId=new Map(rows.map(r=>[r.id,r]));
  if(!byId.has(jalon))throw Error("Jalon inconnu : "+jalon);
  return (graph[jalon]||[]).map(id=>{
    const row=byId.get(id);
    if(!row)throw Error("Pré-requis absent du suivi : "+id);
    const status=row.attempted===0?"non abordé":row.due>0?"rappel à effectuer":row.unconfirmedErrors>0?"erreurs à revoir":row.confirmed<row.total?"à consolider":"exercices confirmés";
    return {id,title:row.title,status,needsReview:status!=="exercices confirmés"};
  });
}

/** Parcours des prérequis transitifs : suggère une première notion à consolider. */
export function nextPrerequisite(rows,target,graph=PREREQUISITES){
  const byId=new Map(rows.map(r=>[r.id,r])),seen=new Set();
  if(!byId.has(target))throw Error("Jalon inconnu : "+target);
  function visit(id){
    if(seen.has(id))return null;
    seen.add(id);
    for(const dep of graph[id]||[]){
      const nested=visit(dep);
      if(nested)return nested;
      const row=byId.get(dep);
      if(!row)throw Error("Prérequis manquant : "+dep);
      if(!row.attempted||row.unconfirmedErrors>0||row.due>0)return row;
    }
    return null;
  }
  return visit(target);
}
