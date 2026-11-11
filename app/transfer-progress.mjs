/** Suivi d'auto-évaluation des problèmes rédigés. Aucune notation automatique.
 * Les trois déclarations sont à J0, J+7 puis J+30 depuis la première.
 */
export const TRANSFER_VERSION=1;
export const TRANSFER_DAY_MS=86_400_000;
export const TRANSFER_JALONS=20;
const PHASE_DAYS=[0,7,30];
const validTime=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e15;
const validId=id=>Number.isInteger(id)&&id>=1&&id<=TRANSFER_JALONS;
const validCriteria=c=>Array.isArray(c)&&c.length===4&&c.every(v=>typeof v==="boolean");
export const emptyTransferStore=()=>({version:TRANSFER_VERSION,items:{}});

/** Refuse toute sauvegarde de transfert endommagée, sans l'effacer silencieusement. */
export function sanitizeTransferStore(raw){
  if(raw===undefined||raw===null)return emptyTransferStore(); // sauvegardes v1/v25
  if(!raw||raw.version!==TRANSFER_VERSION||!raw.items||typeof raw.items!=="object"||Array.isArray(raw.items))
    throw Error("Historique de transfert incompatible");
  const items={};
  for(const [id,value] of Object.entries(raw.items)){
    const jalon=Number(id);
    if(!validId(jalon)||String(jalon)!==id||!value||!Array.isArray(value.reviews)||value.reviews.length<1||value.reviews.length>3)
      throw Error("Transfert mal formé : "+id);
    const reviews=[];
    for(const [i,v] of value.reviews.entries()){
      if(!v||!validTime(v.at)||!validCriteria(v.criteria))throw Error("Auto-évaluation invalide : "+id);
      if(i>0){
        const due=Math.max(reviews[0].at+PHASE_DAYS[i]*TRANSFER_DAY_MS,reviews[i-1].at+TRANSFER_DAY_MS);
        if(v.at<due)throw Error("Auto-évaluation antérieure à l'échéance : "+id);
      }
      reviews.push({at:v.at,criteria:[...v.criteria]});
    }
    items[id]={reviews};
  }
  return {version:TRANSFER_VERSION,items};
}
export function transferStatus(store,id,now=Date.now()){
  if(!validId(id)||!validTime(now))throw Error("Jalon ou date invalide");
  const row=store?.items?.[id];
  const reviews=row?.reviews||[];
  const count=reviews.length,last=reviews[count-1]??null;
  const done=count===3;
  const stage=done?null:PHASE_DAYS[count];
  const dueAt=count===0?null:done?null:Math.max(reviews[0].at+stage*TRANSFER_DAY_MS,last.at+TRANSFER_DAY_MS);
  return {id,count,stage,dueAt,due:dueAt!==null&&now>=dueAt,done,lastAt:last?.at??null,criteria:last?.criteria??null};
}
export function transferSummary(store,now=Date.now()){
  let started=0,due=0,completed=0;
  for(let id=1;id<=TRANSFER_JALONS;id++){
    const status=transferStatus(store,id,now);
    if(status.count)started++;
    if(status.due)due++;
    if(status.done)completed++;
  }
  return {total:TRANSFER_JALONS,started,due,completed};
}
/** Sauvegarde uniquement une déclaration explicite après résolution et auto-correction.
 * Aucun "acquis" ne peut découler de cette liste de quatre critères.
 */
export function recordTransferReview(store,id,criteria,now=Date.now()){
  if(!validId(id)||!validCriteria(criteria)||!validTime(now))
    throw Error("Auto-évaluation ou date invalide");
  const clean=sanitizeTransferStore(store);
  const status=transferStatus(clean,id,now);
  if(status.done)throw Error("Trois étapes déjà enregistrées pour ce jalon");
  if(status.dueAt!==null&&now<status.dueAt)throw Error("Rappel non encore arrivé à échéance");
  const previous=clean.items[id]?.reviews||[];
  return {...clean,items:{...clean.items,[id]:{reviews:[...previous,{at:now,criteria:[...criteria]}]}}};
}
