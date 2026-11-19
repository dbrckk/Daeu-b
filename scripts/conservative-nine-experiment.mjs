/** Expérience hors production : rejeter un 9 isolé écrit en deux traits. */
import {recognizeNumericInk} from "../app/numeric-ink.mjs";

export function recognizeNumericInkConservativeNine(page){
  const result=recognizeNumericInk(page);
  if(Array.isArray(page)&&page.length===2&&result.status==="recognized"&&result.text==="9")
    return {status:"uncertain",message:"9 à deux traits : confirmation nécessaire."};
  return result;
}
