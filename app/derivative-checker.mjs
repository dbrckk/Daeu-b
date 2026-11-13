/**
 * Correction exacte des dérivées :
 * - polynômes en x de degré <= 6 ;
 * - c·sin(ax+b), c·cos(ax+b), c·exp(ax+b) et c·ln(ax+b) + constante.
 * Les coefficients sont rationnels BigInt, sans eval ni approximation.
 * Les fonctions composées plus complexes restent non vérifiées.
 */
import {parseDerivativePolynomial,differentiatePolynomial,formatPolynomialExact,comparePolynomialExact,firstDerivativeDifference} from "./polynomial-derivative.mjs";
import {parseElementaryFunction,parseElementaryQuotient,formatElementary,expectedElementaryDerivative,equivalentElementary,elementaryRule} from "./elementary-derivative.mjs";

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
  const type=match[2]?"derivative":"definition";
  try{
    return {name:match[1],type,coefficients:parseDerivativePolynomial(match[3])};
  }catch(error){
    if(/\b(?:sin|cos|exp|ln)\s*\(/iu.test(match[3]))
      return {name:match[1],type,elementary:parseElementaryFunction(match[3])};
    if(type==="derivative"&&match[3].includes("/"))
      return {name:match[1],type,elementary:parseElementaryQuotient(match[3])};
    throw error;
  }
}
export function checkDerivativeCandidate(definition,candidate){
  if(!definition||definition.type!=="definition"||candidate.type!=="derivative"||
    definition.name!==candidate.name)
    throw Error("fonction d'origine absente ou différente");
  const name=definition.name+"'(x) = ";
  const actual=candidate.elementary?formatElementary(candidate.elementary):
    candidate.coefficients?formatPolynomial(candidate.coefficients):"expression non interprétée";
  if(definition.elementary){
    const wanted=expectedElementaryDerivative(definition.elementary);
    const correct=equivalentElementary(candidate.elementary,wanted);
    return {correct,expected:name+formatElementary(wanted),actual:name+actual,
      detail:correct?"":"Compare le coefficient exact et l'argument de la fonction.",
      rule:elementaryRule(definition.elementary)};
  }
  if(!definition.coefficients)throw Error("définition non prise en charge");
  const wanted=derivativeCoefficients(definition.coefficients);
  const correct=!!candidate.coefficients&&comparePolynomialExact(wanted,candidate.coefficients);
  return {correct,expected:name+formatPolynomial(wanted),actual:name+actual,
    detail:correct?"":candidate.coefficients?
      firstDerivativeDifference(candidate.coefficients,wanted):
      "La dérivée d'un polynôme doit être un polynôme.",
    rule:"Règle : (a·x^n)' = n·a·x^(n−1). Dérive chaque terme séparément ; la dérivée d'une constante est zéro."};
}
