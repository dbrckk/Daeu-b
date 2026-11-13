/**
 * Correction exacte de la dérivation des polynômes de degré <= 2.
 * f(x)=... suivi de f'(x)=... (idem g et h).
 * Rationnels BigInt fournis par le parseur quadratique ; aucun eval.
 * Ne valide ni la règle de chaîne générale ni les fonctions non polynomiales.
 */
import {parsePolynomial,formatExact} from "./quadratic-checker.mjs";

const FUNCTION_LINE=/^\s*([fgh])\s*(['’′])?\s*\(\s*x\s*\)\s*=\s*(.+?)\s*$/u;
const FUNCTION_PREFIX=/^\s*[fgh]\s*(?:['’′]|\()/u;
const ZERO={n:0n,d:1n};
const isZero=q=>q.n===0n;
const equal=(a,b)=>a.n*b.d===b.n*a.d;
function normalized(n,d){
  if(d===0n)throw Error("dénominateur nul");
  if(d<0n){n=-n;d=-d;}
  const abs=v=>v<0n?-v:v;
  let a=abs(n),b=d;
  while(b){const rem=a%b;a=b;b=rem;}
  const g=a||1n;
  return {n:n/g,d:d/g};
}
export function derivativeCoefficients(poly){
  if(!Array.isArray(poly)||poly.length!==3)throw Error("polynôme invalide");
  return [poly[1],normalized(2n*poly[2].n,poly[2].d),ZERO];
}
export function formatPolynomial(poly){
  if(!Array.isArray(poly)||poly.length!==3)throw Error("polynôme invalide");
  const terms=[];
  for(let degree=2;degree>=0;degree--){
    const q=poly[degree];
    if(isZero(q))continue;
    const sign=q.n<0n?"−":"+";
    const magnitude=normalized(q.n<0n?-q.n:q.n,q.d);
    const number=formatExact(magnitude);
    const factor=degree===0?number:(number==="1"?"":number)+(degree===2?"x²":"x");
    terms.push({sign,factor});
  }
  if(!terms.length)return "0";
  return terms.map(({sign,factor},i)=>i===0?(sign==="−"?"−":"")+factor:" "+sign+" "+factor).join("");
}
export function isFunctionNotation(line){
  return typeof line==="string"&&FUNCTION_PREFIX.test(line);
}
export function parseFunctionLine(line){
  if(typeof line!=="string"||line.length>380)throw Error("ligne trop longue");
  const match=line.match(FUNCTION_LINE);
  if(!match)throw Error("utilise f(x) = ... puis f'(x) = ...");
  const coefficients=parsePolynomial(match[3]);
  return {name:match[1],type:match[2]?"derivative":"definition",coefficients};
}
export function checkDerivativeCandidate(definition,candidate){
  if(!definition||definition.type!=="definition"||candidate.type!=="derivative"
    ||definition.name!==candidate.name)throw Error("fonction d'origine absente ou différente");
  const wanted=derivativeCoefficients(definition.coefficients),actual=candidate.coefficients;
  const correct=wanted.every((q,i)=>equal(q,actual[i]));
  return {correct,expected:definition.name+"'(x) = "+formatPolynomial(wanted),
    actual:definition.name+"'(x) = "+formatPolynomial(actual),
    rule:"Règle : (ax² + bx + c)' = 2ax + b. La dérivée d'une constante est zéro."};
}
