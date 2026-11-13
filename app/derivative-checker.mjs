/**
 * Correction exacte de la dérivation des polynômes de degré <= 6.
 * f(x)=... suivi de f'(x)=... (idem g et h).
 * Rationnels BigInt et développements exacts ; aucun eval.
 * Ne valide ni la règle de chaîne générale ni les fonctions non polynomiales.
 */
import {parseDerivativePolynomial,differentiatePolynomial,formatPolynomialExact,comparePolynomialExact,firstDerivativeDifference} from "./polynomial-derivative.mjs";

const FUNCTION_LINE=/^\s*([fgh])\s*(['’′])?\s*\(\s*x\s*\)\s*=\s*(.+?)\s*$/u;
const FUNCTION_PREFIX=/^\s*[fgh]\s*(?:['’′]|\()/u;
export function derivativeCoefficients(poly){return differentiatePolynomial(poly);}
export function formatPolynomial(poly){return formatPolynomialExact(poly);}
export function isFunctionNotation(line){
  return typeof line==="string"&&FUNCTION_PREFIX.test(line);
}
export function parseFunctionLine(line){
  if(typeof line!=="string"||line.length>380)throw Error("ligne trop longue");
  const match=line.match(FUNCTION_LINE);
  if(!match)throw Error("utilise f(x) = ... puis f'(x) = ...");
  const coefficients=parseDerivativePolynomial(match[3]);
  return {name:match[1],type:match[2]?"derivative":"definition",coefficients};
}
export function checkDerivativeCandidate(definition,candidate){
  if(!definition||definition.type!=="definition"||candidate.type!=="derivative"
    ||definition.name!==candidate.name)throw Error("fonction d'origine absente ou différente");
  const wanted=derivativeCoefficients(definition.coefficients),actual=candidate.coefficients;
  const correct=comparePolynomialExact(wanted,actual);
  return {correct,expected:definition.name+"'(x) = "+formatPolynomial(wanted),
    actual:definition.name+"'(x) = "+formatPolynomial(actual),
    detail:correct?"":firstDerivativeDifference(actual,wanted),
    rule:"Règle : (a·x^n)' = n·a·x^(n−1). Dérive chaque terme séparément ; la dérivée d'une constante est zéro."};
}
