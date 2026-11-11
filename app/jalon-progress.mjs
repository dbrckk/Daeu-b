/** Progression descriptive par jalon. Aucun changement de sauvegarde. */
import {JALONS,FIXED_IDS_BY_JALON} from "./jalons.mjs";
import {selectRound} from "./engine.mjs";
export function buildJalonIndex(questions){
  const index=new Map(JALONS.map(j=>[j.id,new Set()]));
  const byId=new Map(questions.map(q=>[q.id,q]));
  if(byId.size!==questions.length)throw Error("IDs dupliqués");
  const seen=new Set();
  for(const [raw,ids] of Object.entries(FIXED_IDS_BY_JALON)){
    const j=Number(raw);if(!index.has(j))throw Error("Jalon invalide "+raw);
    for(const id of ids.trim().split(/\s+/)){
      const q=byId.get(id);
      if(!q||q.type==="variant"||seen.has(id))throw Error("Attribution fixe invalide : "+id);
      seen.add(id);index.get(j).add(id);
    }
  }
  for(const q of questions){
    if(q.type!=="variant"){if(!seen.has(q.id))throw Error("Question non classée "+q.id);continue;}
    if(!Array.isArray(q.jalons)||!q.jalons.length)throw Error("Variante non classée "+q.id);
    for(const j of q.jalons){if(!index.has(j))throw Error("Variante hors programme "+q.id);index.get(j).add(q.id);}
  }
  for(const [j,ids] of index)if(!ids.size)throw Error("Jalon vide "+j);
  return index;
}
export function jalonProgress(state,questions,index,now=Date.now()){
  return JALONS.map(jalon=>{
    const ids=index.get(jalon.id);if(!ids)throw Error("Jalon non indexé "+jalon.id);
    let attempted=0,confirmed=0,due=0,unconfirmedErrors=0;
    for(const id of ids){
      const r=state.items?.[id];if(!r?.attempts)continue;
      attempted++;if(r.confirmed)confirmed++;
      if(r.dueAt<=now)due++;
      if(r.wrong>0&&!r.confirmed)unconfirmedErrors++;
    }
    const status=due?"Rappels à faire":!attempted?"Non abordé":unconfirmedErrors?"Erreurs à travailler":confirmed===ids.size?"Questions confirmées":"En progression";
    const mode=due?"due":unconfirmedErrors?"wrong":"all";
    return {...jalon,total:ids.size,attempted,confirmed,due,unconfirmedErrors,status,mode};
  });
}
export function recommendJalon(rows){
  return rows.find(r=>r.due>0)||rows.find(r=>r.unconfirmedErrors>0)||rows.find(r=>r.attempted===0)||rows.find(r=>r.confirmed<r.total)||null;
}
/** Une question fixe jamais tentée par jalon non abordé ; bloc de dix. */
export function selectDiagnosticQuestions(state,questions,index,limit=10){
  if(!Number.isInteger(limit)||limit<1||limit>10)throw Error("Taille du repérage invalide");
  const byId=new Map(questions.map(q=>[q.id,q]));
  const selected=[];
  for(const row of jalonProgress(state,questions,index)){
    if(row.attempted)continue;
    const q=FIXED_IDS_BY_JALON[row.id].trim().split(/\s+/).map(id=>byId.get(id)).find(q=>q&&!state.items?.[q.id]?.attempts);
    if(q)selected.push(q);
    if(selected.length===limit)break;
  }
  return selected;
}
export function selectJalonQuestions(state,questions,index,jalon,mode="all",now=Date.now()){
  const ids=index.get(jalon);if(!ids)throw Error("Jalon inconnu "+jalon);
  return selectRound(state,questions.filter(q=>ids.has(q.id)),{mode,limit:10,now});
}
