/**
 * Parseur strict de polynômes en x, de degré <= 6, à coefficients rationnels exacts.
 * Destiné à la dérivation, indépendant du solveur des équations du second degré.
 * Jamais de eval, ni de fonctions inconnues ou de dénominateurs contenant x.
 */
export const MAX_DERIVATIVE_DEGREE=6;
const MAX_LINE=180,MAX_TOKENS=100,MAX_DEPTH=24,MAX_DIGITS=60;
const ZERO=Object.freeze({n:0n,d:1n}),ONE=Object.freeze({n:1n,d:1n});
const abs=n=>n<0n?-n:n;
function gcd(a,b){
  a=abs(a);b=abs(b);
  while(b){const c=a%b;a=b;b=c;}
  return a||1n;
}
function rational(n,d=1n){
  if(d===0n)throw Error("division par zéro");
  if(d<0n){n=-n;d=-d;}
  const g=gcd(n,d);n/=g;d/=g;
  if(abs(n).toString().length>MAX_DIGITS||d.toString().length>MAX_DIGITS)
    throw Error("coefficient trop grand pour une vérification sûre");
  return {n,d};
}
const addR=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
const negateR=a=>rational(-a.n,a.d);
const mulR=(a,b)=>rational(a.n*b.n,a.d*b.d);
const divR=(a,b)=>rational(a.n*b.d,a.d*b.n);
export const equalRational=(a,b)=>a.n*b.d===b.n*a.d;
const blank=()=>Array.from({length:MAX_DERIVATIVE_DEGREE+1},()=>ZERO);
function constant(a){const result=blank();result[0]=a;return result;}
function variable(){const result=blank();result[1]=ONE;return result;}
function add(a,b){return a.map((v,i)=>addR(v,b[i]));}
function negate(a){return a.map(negateR);}
function multiply(a,b){
  const result=blank();
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
    if(a[i].n===0n||b[j].n===0n)continue;
    if(i+j>MAX_DERIVATIVE_DEGREE)
      throw Error("degré supérieur à 6 : dérivation non vérifiée");
    result[i+j]=addR(result[i+j],mulR(a[i],b[j]));
  }
  return result;
}
function divide(a,b){
  if(b.slice(1).some(v=>v.n!==0n))
    throw Error("dénominateur contenant x : dérivation non vérifiée");
  return a.map(v=>divR(v,b[0]));
}
function power(base,exponent){
  if(!Number.isInteger(exponent)||exponent<0||exponent>MAX_DERIVATIVE_DEGREE)
    throw Error("puissance non prise en charge (0 à 6)");
  let result=constant(ONE);
  for(let k=0;k<exponent;k++)result=multiply(result,base);
  return result;
}
function value(text){
  const parts=text.replace(",",".").split("."),digits=parts.join("");
  if(digits.length>16)throw Error("nombre trop long");
  return rational(BigInt(digits),10n**BigInt(parts[1]?.length||0));
}
function tokenize(source){
  if(typeof source!=="string"||source.length>MAX_LINE||!source.trim())
    throw Error("expression vide ou trop longue");
  const text=source.replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/");
  const tokens=[];let i=0;
  while(i<text.length){
    if(/\s/u.test(text[i])){i++;continue;}
    const match=text.slice(i).match(/^(?:\d+(?:[.,]\d+)?|[.,]\d+)/u);
    if(match){tokens.push({type:"number",value:match[0]});i+=match[0].length;}
    else if(text[i]==="x"||text[i]==="X"){tokens.push({type:"x",value:"x"});i++;}
    else if("+-*/()^²³⁴⁵⁶".includes(text[i])){tokens.push({type:text[i],value:text[i]});i++;}
    else throw Error("symbole non pris en charge : "+text[i]);
    if(tokens.length>MAX_TOKENS)throw Error("expression trop complexe");
  }
  return tokens;
}
const SUPERSCRIPTS={"²":2,"³":3,"⁴":4,"⁵":5,"⁶":6};
export function parseDerivativePolynomial(source){
  const tokens=tokenize(source);let i=0,depth=0;
  const peek=()=>tokens[i]?.type;
  function nested(fn){
    if(++depth>MAX_DEPTH)throw Error("expression trop imbriquée");
    try{return fn();}finally{depth--;}
  }
  function atom(){
    const t=peek();
    if(t==="number")return constant(value(tokens[i++].value));
    if(t==="x"){i++;return variable();}
    if(t==="("){
      i++;const inner=nested(expression);
      if(peek()!==")")throw Error("parenthèse non fermée");
      i++;return inner;
    }
    throw Error("nombre, x ou parenthèse attendu");
  }
  function exponent(){
    let term=atom();
    const t=peek();
    if(Object.hasOwn(SUPERSCRIPTS,t)){i++;term=power(term,SUPERSCRIPTS[t]);}
    else if(t==="^"){
      i++;
      if(peek()!=="number"||!/^[0-6]$/.test(tokens[i].value))
        throw Error("exposant entier de 0 à 6 attendu");
      term=power(term,Number(tokens[i++].value));
    }
    if(peek()==="^"||Object.hasOwn(SUPERSCRIPTS,peek()))
      throw Error("puissances successives non vérifiées");
    return term;
  }
  function unary(){
    if(peek()==="+"||peek()==="-"){
      const op=tokens[i++].type,term=nested(unary);
      return op==="-"?negate(term):term;
    }
    return exponent();
  }
  function product(){
    let result=unary();
    for(;;){
      const op=peek();
      if(op==="*"||op==="/"){
        i++;const rhs=unary();
        result=op==="*"?multiply(result,rhs):divide(result,rhs);
      }else if(op==="x"||op==="("){
        result=multiply(result,unary());
      }else break;
    }
    return result;
  }
  function expression(){
    let result=product();
    while(peek()==="+"||peek()==="-"){
      const op=tokens[i++].type,rhs=product();
      result=add(result,op==="+"?rhs:negate(rhs));
    }
    return result;
  }
  const result=expression();
  if(i!==tokens.length)throw Error("syntaxe incomplète ou opérateur non reconnu");
  return result;
}
export function differentiatePolynomial(coefficients){
  if(!Array.isArray(coefficients)||coefficients.length<2||
    coefficients.length>MAX_DERIVATIVE_DEGREE+1)
    throw Error("coefficients polynomiaux invalides");
  const result=coefficients.map(()=>ZERO);
  for(let i=1;i<coefficients.length;i++)
    result[i-1]=mulR(coefficients[i],rational(BigInt(i)));
  return result;
}
export function formatPolynomialExact(coefficients){
  if(!Array.isArray(coefficients)||!coefficients.length||
    coefficients.length>MAX_DERIVATIVE_DEGREE+1)
    throw Error("coefficients polynomiaux invalides");
  const superscripts=["","", "²","³","⁴","⁵","⁶"];
  const terms=[];
  for(let degree=coefficients.length-1;degree>=0;degree--){
    const coeff=coefficients[degree];
    if(coeff.n===0n)continue;
    const negative=coeff.n<0n;
    const magnitude=rational(abs(coeff.n),coeff.d);
    const value=magnitude.d===1n?String(magnitude.n):String(magnitude.n)+"/"+String(magnitude.d);
    const part=degree===0?value:(value==="1"?"":value)+"x"+superscripts[degree];
    terms.push({negative,part});
  }
  if(!terms.length)return "0";
  return terms.map(({negative,part},i)=>i===0?(negative?"−":"")+part:(negative?" − ":" + ")+part).join("");
}
export function comparePolynomialExact(a,b){
  if(!Array.isArray(a)||!Array.isArray(b))return false;
  const length=Math.max(a.length,b.length);
  for(let i=0;i<length;i++){
    if(!equalRational(a[i]||ZERO,b[i]||ZERO))return false;
  }
  return true;
}
export function firstDerivativeDifference(actual,expected){
  const length=Math.max(actual.length,expected.length);
  for(let d=length-1;d>=0;d--){
    if(!equalRational(actual[d]||ZERO,expected[d]||ZERO)){
      const label=d===0?"constante":d===1?"x":"x"+(["","","²","³","⁴","⁵","⁶"][d]||"^"+d);
      const describe=value=>value.d===1n?String(value.n):String(value.n)+"/"+String(value.d);
      return "Terme "+label+" : coefficient attendu "+describe(expected[d]||ZERO)+", obtenu "+describe(actual[d]||ZERO)+".";
    }
  }
  return "";
}
