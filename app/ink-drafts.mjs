/**
 * Métadonnées de transcription manuscrite liées aux traits exacts de la page.
 * Aucune copie du manuscrit, aucun réseau, aucun HTML ; validation déterministe.
 */
import {validInkDraft} from "./ink-transcript.mjs";

/**
 * Empreinte non cryptographique des traits enregistrés : permet d'invalider
 * une lecture éditée si le contenu de la page change après sa correction.
 * Ce n'est PAS une signature de sécurité ni une preuve d'identité.
 */
export function pageInkFingerprint(page){
  if(!Array.isArray(page)||page.length>100||page.some(s=>typeof s!=="string"))
    throw Error("Page manuscrite invalide");
  let a=0x811c9dc5,b=0x9e3779b9,bytes=0;
  for(const stroke of page){
    for(let i=0;i<stroke.length;i++){
      const c=stroke.charCodeAt(i);bytes++;
      a=Math.imul(a^c,0x01000193)>>>0;
      b=(Math.imul(b^c,0x5bd1e995)+(b>>>7))>>>0;
    }
    // Marquer la fin de chaque trait pour qu'un assemblage ne soit pas confondu.
    a=Math.imul(a^65535,0x01000193)>>>0;
    b=(Math.imul(b^65535,0x5bd1e995)+(b>>>7))>>>0;
  }
  return page.length.toString(16)+"-"+bytes.toString(16)+"-"
    +a.toString(16).padStart(8,"0")+b.toString(16).padStart(8,"0");
}
/**
 * Ne retient que les transcriptions qui correspondent encore à la page.
 * Les anciens cahiers sans métadonnées restent inchangés.
 */
export function sanitizeInkDrafts(input,pages){
  if(input===undefined)return undefined;
  if(!input||typeof input!=="object"||Array.isArray(input))
    throw Error("Transcriptions manuscrites incompatibles");
  const keys=Object.keys(input);
  if(keys.length>8)throw Error("Trop de transcriptions manuscrites");
  const result={};
  for(const key of keys){
    if(!/^(?:[0-7])$/.test(key)||Number(key)>=pages.length)
      throw Error("Page de transcription inconnue");
    const draft=input[key];
    if(!draft||typeof draft!=="object"||Array.isArray(draft)
      ||typeof draft.source!=="string"||draft.source.length>50
      ||!validInkDraft(draft.text)||typeof draft.edited!=="boolean")
      throw Error("Transcription manuscrite invalide");
    if(draft.source===pageInkFingerprint(pages[Number(key)]))
      Object.defineProperty(result,key,{value:{source:draft.source,text:draft.text,edited:draft.edited},
        enumerable:true,configurable:true,writable:true});
  }
  return result;
}
