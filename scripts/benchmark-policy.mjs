import {validateInkTranscript} from "../app/ink-transcript.mjs";

/** Normalise uniquement la notation, sans supposer l'équivalence algébrique. */
export function normalizeInk(value){
  return value?.replace(/\s/g,"").replace(/\\(?:left|right)/g,"")
    .replace(/\\(?:cdot|times)/g,"*").replace(/\^\{([0-9])\}/g,"^$1")
    .replace(/_\{([a-zA-Z0-9])\}/g,"_$1")
    .replace(/\\(?:dfrac|tfrac|frac)\{([0-9]+)\}\{([0-9]+)\}/g,"$1/$2")??null;
}
export function inkOutcome(value,expected){
  return !value?"abstention":normalizeInk(value)===normalizeInk(expected)?"exact":"error";
}
/** Une forme admissible n'est jamais une preuve de transcription correcte. */
export function eligibleInkFallback(value,group){
  const candidate=normalizeInk(value);
  if(!candidate)return false;
  if(group==="crohme-isolated-fraction")return /^\d+\/[1-9]\d*$/.test(candidate);
  if(!group.startsWith("crohme-"))return false;
  return /^[0-9x+*/().=^\-]+$/.test(candidate)&&validateInkTranscript(candidate);
}
