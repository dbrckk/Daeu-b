/**
 * Décision de seconde lecture de fractions isolées.
 *
 * Aucun résultat de Seshat ne doit être noté automatiquement. Une proposition
 * ne peut être affichée qu'après accord de trois observations indépendantes :
 * forme fractionnaire, séparation géométrique des deux lignes et lecture de
 * chaque ligne par le moteur externe. Toute lecture locale contradictoire
 * bloque la proposition, même si le moteur externe est confiant.
 */
import {eligibleInkFallback,normalizeInk} from "../benchmark-policy.mjs";

const INTEGER=/^\d+$/;

export function decideFractionFallback({local=null,whole=null,parts=null,rows=null}={}){
  if(local!==null&&local!==undefined){
    return {candidate:local,source:"local",reason:"local-priority"};
  }
  if(!eligibleInkFallback(whole,"crohme-isolated-fraction")){
    return {candidate:null,source:null,reason:"invalid-fraction"};
  }
  const candidate=normalizeInk(whole);
  if(!Array.isArray(parts)||parts.length!==2){
    return {candidate:null,source:null,reason:"invalid-geometry"};
  }
  if(!Array.isArray(rows)||rows.length!==2){
    return {candidate:null,source:null,reason:"missing-row-readings"};
  }
  const expected=candidate.split("/");
  for(let i=0;i<2;i++){
    const row=rows[i];
    if(!row||row.error||!INTEGER.test(normalizeInk(row.seshat)??"")){
      return {candidate:null,source:null,reason:"invalid-row"};
    }
    if(normalizeInk(row.seshat)!==expected[i]){
      return {candidate:null,source:null,reason:"row-disagreement"};
    }
    if(row.local!==null&&row.local!==undefined&&normalizeInk(row.local)!==expected[i]){
      return {candidate:null,source:null,reason:"local-conflict"};
    }
  }
  return {candidate,source:"seshat-consensus",reason:"agreement"};
}
