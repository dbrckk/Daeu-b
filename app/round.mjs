/**
 * Sauvegarde d'une séance de 10 questions.
 * Les exercices fixes sont reconstruits depuis la banque officielle.
 * Les variantes ne gardent que leur graine uint32, jamais une réponse
 * importée arbitrairement. Aucun code utilisateur n'est évalué.
 */
import {VARIANTS,materializeVariant} from "./variants.mjs";
const variantIds=new Set(VARIANTS.map(q=>q.id));
const isUInt32=n=>Number.isInteger(n)&&n>=0&&n<=0xFFFFFFFF;
export const ROUND_VERSION=1;

export function sanitizeRound(raw,knownIds){
  if(raw===null||raw===undefined)return null;
  if(!raw||raw.version!==ROUND_VERSION||!Array.isArray(raw.ids)
    ||raw.ids.length<1||raw.ids.length>10
    ||new Set(raw.ids).size!==raw.ids.length
    ||raw.ids.some(id=>typeof id!=="string"||!knownIds.has(id))
    ||!Number.isSafeInteger(raw.startedAt)||raw.startedAt<0||raw.startedAt>9e15
    ||!Number.isInteger(raw.completed)||raw.completed<0||raw.completed>raw.ids.length
    ||!Number.isInteger(raw.score)||raw.score<0||raw.score>raw.completed
    ||!raw.seeds||typeof raw.seeds!=="object"||Array.isArray(raw.seeds))
    throw new Error("Séance de révision invalide");
  const seeds={};
  const expected=new Set(raw.ids.filter(id=>variantIds.has(id)));
  if(Object.keys(raw.seeds).length!==expected.size)
    throw new Error("Graines des variantes manquantes");
  for(const [id,seed] of Object.entries(raw.seeds)){
    if(!expected.has(id)||!isUInt32(seed))throw new Error("Graine de révision invalide");
    Object.defineProperty(seeds,id,{value:seed,enumerable:true,configurable:true,writable:true});
  }
  return {version:ROUND_VERSION,ids:[...raw.ids],seeds,startedAt:raw.startedAt,completed:raw.completed,score:raw.score};
}
export function buildRound(selection,practice,{random=Math.random,now=Date.now()}={}){
  if(!Array.isArray(selection)||!selection.length||selection.length>10)
    throw new Error("Sélection de révision invalide");
  const questions=selection.map(q=>q.type==="variant"
    ?materializeVariant(q,{random,previousPrompt:practice.items?.[q.id]?.lastPrompt||""})
    :q);
  const seeds={};
  for(const q of questions)if(q.isVariant)seeds[q.id]=q.seed;
  const ids=questions.map(q=>q.id);
  const round=sanitizeRound({version:ROUND_VERSION,ids,seeds,startedAt:now,completed:0,score:0},new Set(ids));
  return {round,questions};
}
export function restoreRound(raw,bank){
  const known=new Map(bank.map(q=>[q.id,q]));
  const round=sanitizeRound(raw,new Set(known.keys()));
  if(!round)return [];
  return round.ids.map(id=>{
    const q=known.get(id);
    return q.type==="variant"
      ?materializeVariant(q,{random:()=>round.seeds[id]/4294967296})
      :q;
  });
}
export function advanceRound(round,correct){
  if(!round||round.completed>=round.ids.length)throw new Error("Séance déjà terminée");
  return {...round,completed:round.completed+1,score:round.score+(correct?1:0)};
}
