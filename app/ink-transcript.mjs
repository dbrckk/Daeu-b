/**
 * Vérification et correction tactile d'une transcription manuscrite.
 * Seuls des symboles autorisés sont éditables : jamais de HTML/JS injecté.
 * Les équations trop complexes restent refusées par le correcteur algébrique.
 */
export const INK_EDIT_SYMBOLS=Object.freeze(
  [..."0123456789", "x","+","-","=","/","(",")",".","^","√","*"]
);
const PATTERN=/^[0-9x+\-=./()^√*□\n]+$/;
export function validInkDraft(source){
  return typeof source==="string"&&source.length<=1200&&PATTERN.test(source);
}
export function validateInkTranscript(source){
  if(!validInkDraft(source)||source.includes("□"))return false;
  const lines=source.split("\n");
  if(!lines.length||lines.length>12)return false;
  for(const line of lines){
    if(!line||line.length>80||line.split("=").length!==2||line.startsWith("=")||line.endsWith("="))
      return false;
    let depth=0;
    for(const c of line){if(c==="(")depth++;else if(c===")")depth--;if(depth<0)return false;}
    if(depth!==0||/√(?!\()|√\(\)/.test(line)||line.includes("^")&&(line.match(/\^[0-9]+/g)||[]).some(p=>p!=="^2")
       ||/(?:\^$|\^\D)/.test(line))return false;
  }
  return true;
}
/** Les déplacements et éditions ne sont possibles que dans le périmètre sûr. */
export function editInkTranscript(source,index,mode,symbol=""){
  if(!validInkDraft(source)||!Number.isInteger(index)||index<0||index>source.length)
    throw Error("Transcription incompatible");
  if(mode==="replace"){
    if(index>=source.length||source[index]==="\n"||!INK_EDIT_SYMBOLS.includes(symbol))throw Error("Remplacement invalide");
    return source.slice(0,index)+symbol+source.slice(index+1);
  }
  if(mode==="insert"){
    if(!INK_EDIT_SYMBOLS.includes(symbol))throw Error("Symbole non pris en charge");
    if(source.length>=1200)throw Error("Trop de caractères");
    return source.slice(0,index)+symbol+source.slice(index);
  }
  if(mode==="delete"){
    if(index>=source.length||source.length===1)throw Error("Suppression invalide");
    const out=source.slice(0,index)+source.slice(index+1);
    if(!out)return source;
    return out;
  }
  if(mode==="newline"){
    if(source.length>=1199)throw Error("Trop de caractères");
    return source.slice(0,index)+"\n"+source.slice(index);
  }
  throw Error("Opération non autorisée");
}
