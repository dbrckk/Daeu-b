/**
 * Dérivation élémentaire strictement bornée : c·sin(ax+b), c·cos(ax+b),
 * c·exp(ax+b), c·ln(ax+b), avec constante additionnelle facultative.
 * Toutes les valeurs sont rationnelles exactes. Aucun eval ni approximation.
 * Pour ln, seul le domaine ax+b > 0 est considéré.
 */
import {parseDerivativePolynomial,formatPolynomialExact,comparePolynomialExact,equalRational} from "./polynomial-derivative.mjs";

const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){const t=a%b;a=b;b=t;}return a||1n;}
function ratio(n,d=1n){
  if(d===0n)throw Error("division par zéro");
  if(d<0n){n=-n;d=-d;}
  const g=gcd(n,d);n/=g;d/=g;
  if(abs(n).toString().length>60||d.toString().length>60)
    throw Error("coefficient trop grand");
  return {n,d};
}
const mul=(a,b)=>ratio(a.n*b.n,a.d*b.d);
const neg=a=>ratio(-a.n,a.d);
const ZERO=ratio(0n);
const equal=(a,b)=>equalRational(a,b);
const scalarText=r=>r.d===1n?String(r.n):String(r.n)+"/"+String(r.d);
function scalar(text){
  const poly=parseDerivativePolynomial(text.trim());
  if(poly.slice(1).some(r=>r.n!==0n))throw Error("coefficient non constant");
  return poly[0];
}
function linear(text){
  const result=parseDerivativePolynomial(text.trim());
  if(result.slice(2).some(r=>r.n!==0n)||result[1].n===0n)
    throw Error("argument affine ax+b requis, avec a non nul");
  return result;
}
const CALL=/^\s*([+-]?)\s*(\d+(?:[.,]\d+)?(?:\/\d+(?:[.,]\d+)?)?)?\s*(\*?)\s*(sin|cos|exp|ln)\s*\(\s*([^()]*)\s*\)\s*(.*?)\s*$/iu;
const SIGNED_CONSTANT=/^[+-]\d+(?:[.,]\d+)?(?:\/\d+)?$/u;
export function parseElementaryFunction(expression){
  if(typeof expression!=="string"||expression.length>180)throw Error("fonction trop longue");
  const match=expression.match(CALL);
  if(!match||match[3]&&!match[2])throw Error("fonction élémentaire non prise en charge");
  const offsetText=match[6].replace(/\s+/gu,"");
  if(offsetText&&!SIGNED_CONSTANT.test(offsetText))throw Error("somme non prise en charge");
  const scale=scalar((match[1]||"")+(match[2]||"1"));
  if(scale.n===0n)throw Error("coefficient nul : utilise un polynôme constant");
  return {kind:"elementary",fn:match[4].toLowerCase(),scale,
    arg:linear(match[5]),offset:offsetText?scalar(offsetText):ZERO};
}
export function parseElementaryQuotient(expression){
  if(typeof expression!=="string"||expression.length>180)throw Error("expression trop longue");
  const text=expression.trim();
  const match=text.match(/^(.+?)\s*\/\s*(?:\(\s*([^()]*)\s*\)|(x))$/iu);
  if(!match)throw Error("quotient de la forme c/(ax+b) attendu");
  const numerator=scalar(match[1]);
  const denominator=linear(match[2]||match[3]);
  return {kind:"quotient",numerator,denominator};
}
export function formatElementary(expression){
  if(expression.kind==="quotient"){
    const denominator=formatPolynomialExact(expression.denominator);
    return scalarText(expression.numerator)+"/"+(denominator==="x"?"x":"("+denominator+")");
  }
  if(expression.kind!=="elementary")throw Error("expression élémentaire invalide");
  const value=scalarText(expression.scale);
  const coefficient=value==="1"?"":value==="-1"?"−":value;
  const offset=expression.offset.n===0n?"":expression.offset.n>0n?
    " + "+scalarText(expression.offset):" − "+scalarText(neg(expression.offset));
  return coefficient+expression.fn+"("+formatPolynomialExact(expression.arg)+")"+offset;
}
export function expectedElementaryDerivative(definition){
  if(definition?.kind!=="elementary")throw Error("définition élémentaire absente");
  const a=definition.arg[1];
  const weighted=mul(definition.scale,a);
  if(definition.fn==="ln")
    return {kind:"quotient",numerator:weighted,denominator:definition.arg};
  const fn=definition.fn==="sin"?"cos":definition.fn==="cos"?"sin":"exp";
  return {kind:"elementary",fn,scale:definition.fn==="cos"?neg(weighted):weighted,
    arg:definition.arg,offset:ZERO};
}
export function equivalentElementary(actual,expected){
  if(!actual||!expected||actual.kind!==expected.kind)return false;
  if(expected.kind==="elementary")
    return actual.fn===expected.fn&&equal(actual.scale,expected.scale)&&
      equal(actual.offset,ZERO)&&comparePolynomialExact(actual.arg,expected.arg);
  if(expected.kind==="quotient"){
    return equal(mul(actual.numerator,expected.denominator[1]),
      mul(expected.numerator,actual.denominator[1]))&&
      equal(mul(actual.numerator,expected.denominator[0]),
      mul(expected.numerator,actual.denominator[0]));
  }
  return false;
}
export function elementaryRule(definition){
  const rules={sin:"(sin u)' = u' cos u",cos:"(cos u)' = −u' sin u",
    exp:"(exp u)' = u' exp u",ln:"(ln u)' = u'/u"};
  const domain=definition.fn==="ln"
    ?" Domaine : "+formatPolynomialExact(definition.arg)+" > 0.":"";
  return "Règle de chaîne : "+rules[definition.fn]+", avec u = "+
    formatPolynomialExact(definition.arg)+" et u' = "+scalarText(definition.arg[1])+"."+domain+
    " Ce contrôle ne valide pas une preuve rédigée.";
}
