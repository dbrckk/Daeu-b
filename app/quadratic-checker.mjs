/**
 * Équations polynomiales de degré <= 2 à coefficients rationnels exacts.
 * Syntaxe sans évaluation de code : x, x², x^2, x*x, x(x-1), fractions.
 * Ensemble de solutions dans R, jamais une approximation décimale.
 */
const LIMIT=180,MAX_TOKENS=90,MAX_DIGITS=80,MAX_DEPTH=25;
const abs=n=>n<0n?-n:n;
function gcd(a,b){
  a=abs(a);b=abs(b);
  while(b!==0n){const c=a%b;a=b;b=c;}
  return a||1n;
}
function rat(n,d=1n){
  if(d===0n)throw Error("division par zéro");
  if(d<0n){n=-n;d=-d;}
  const g=gcd(n,d);n/=g;d/=g;
  if(abs(n).toString().length>MAX_DIGITS||d.toString().length>MAX_DIGITS)
    throw Error("coefficients trop grands");
  return {n,d};
}
const ZERO=rat(0n),ONE=rat(1n);
const add=(x,y)=>rat(x.n*y.d+y.n*x.d,x.d*y.d);
const neg=x=>rat(-x.n,x.d);
const sub=(x,y)=>add(x,neg(y));
const mul=(x,y)=>rat(x.n*y.n,x.d*y.d);
const div=(x,y)=>rat(x.n*y.d,x.d*y.n);
const eq=(x,y)=>x.n===y.n&&x.d===y.d;
const cmp=(x,y)=>x.n*y.d<y.n*x.d?-1:x.n*y.d>y.n*x.d?1:0;
const form=(c=ZERO,b=ZERO,a=ZERO)=>[c,b,a];
const constant=n=>form(n);
const sum=(x,y)=>form(add(x[0],y[0]),add(x[1],y[1]),add(x[2],y[2]));
const negative=x=>x.map(neg);
const subtract=(x,y)=>sum(x,negative(y));
function multiply(x,y){
  const terms=Array.from({length:5},()=>ZERO);
  for(let i=0;i<=2;i++)for(let j=0;j<=2;j++){
    if(x[i].n!==0n&&y[j].n!==0n){
      if(i+j>2)throw Error("degré supérieur à deux : non vérifié");
      terms[i+j]=add(terms[i+j],mul(x[i],y[j]));
    }
  }
  return form(...terms.slice(0,3));
}
function divide(x,y){
  if(y[1].n!==0n||y[2].n!==0n)throw Error("division par un polynôme en x : non vérifiée");
  if(y[0].n===0n)throw Error("division par zéro");
  return x.map(t=>div(t,y[0]));
}
function pow(x,n){
  if(!Number.isInteger(n)||n<0||n>2)throw Error("seules les puissances 0, 1 et 2 sont prises en charge");
  return n===0?constant(ONE):n===1?x:multiply(x,x);
}
function numeric(source){
  const text=source.replace(",",".");
  const parts=text.split("."),digits=parts.join("");
  if(digits.length>16)throw Error("nombre trop long");
  return rat(BigInt(digits),10n**BigInt(parts[1]?.length??0));
}
function tokenize(source){
  const text=source.replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/");
  if(!text.trim()||text.length>LIMIT)throw Error("expression vide ou trop longue");
  const tokens=[];let i=0;
  while(i<text.length){
    if(/\s/.test(text[i])){i++;continue;}
    const tail=text.slice(i),m=tail.match(/^(?:\d+(?:[.,]\d+)?|[.,]\d+)/);
    if(m){tokens.push({type:"num",value:m[0]});i+=m[0].length;}
    else if(text[i]==="x"||text[i]==="X"){tokens.push({type:"x"});i++;}
    else if("+-*/()^²".includes(text[i])){tokens.push({type:text[i]});i++;}
    else throw Error("symbole non pris en charge : "+text[i]);
    if(tokens.length>MAX_TOKENS)throw Error("expression trop complexe");
  }
  return tokens;
}
export function parsePolynomial(source){
  const tokens=tokenize(source);let i=0,depth=0;
  const peek=()=>tokens[i]?.type;
  function nested(fn){
    if(++depth>MAX_DEPTH)throw Error("expression trop imbriquée");
    try{return fn();}finally{depth--;}
  }
  function atom(){
    if(peek()==="num"){return constant(numeric(tokens[i++].value));}
    if(peek()==="x"){i++;return form(ZERO,ONE);}
    if(peek()==="("){
      i++;const out=nested(sumExpression);
      if(peek()!==")")throw Error("parenthèse non fermée");
      i++;return out;
    }
    throw Error("nombre, variable x ou parenthèse attendu");
  }
  function power(){
    let out=atom();
    if(peek()==="²"){i++;out=pow(out,2);}
    else if(peek()==="^"){
      i++;
      if(peek()!=="num"||!["0","1","2"].includes(tokens[i].value))
        throw Error("exposant non pris en charge : utilise ^2");
      out=pow(out,Number(tokens[i++].value));
    }
    if(peek()==="²"||peek()==="^")throw Error("puissances imbriquées non vérifiées");
    return out;
  }
  function unary(){
    if(peek()==="+"||peek()==="-"){
      const sign=tokens[i++].type,val=nested(unary);
      return sign==="-"?negative(val):val;
    }
    return power();
  }
  function product(){
    let out=unary();
    for(;;){
      const op=peek();
      if(op==="*"||op==="/"){
        i++;const right=unary();
        out=op==="*"?multiply(out,right):divide(out,right);
      }else if(op==="x"||op==="("){
        out=multiply(out,unary());
      }else break;
    }
    return out;
  }
  function sumExpression(){
    let out=product();
    while(peek()==="+"||peek()==="-"){
      const op=tokens[i++].type,right=product();
      out=op==="+"?sum(out,right):subtract(out,right);
    }
    return out;
  }
  const result=sumExpression();
  if(i!==tokens.length)throw Error("syntaxe incomplète ou multiplication non explicite");
  return result;
}
export function formatExact(value){
  return value.d===1n?String(value.n):String(value.n)+"/"+String(value.d);
}
function integerSqrt(n){
  if(n<0n)throw Error("racine d'un nombre négatif");
  if(n<2n)return n;
  let x=1n<<BigInt((n.toString(2).length+1)>>1);
  for(;;){const next=(x+n/x)>>1n;if(next>=x)return x;x=next;}
}
function squareRootExact(value){
  if(value.n<0n)return null;
  const a=integerSqrt(value.n),b=integerSqrt(value.d);
  return a*a===value.n&&b*b===value.d?rat(a,b):null;
}
/** Résout exactement P(x)=0 pour un polynôme de degré <= 2 déjà analysé. */
export function classifyPolynomialDifference(coefficients){
  if(!Array.isArray(coefficients)||coefficients.length!==3)
    throw Error("polynôme non valide");
  const [c,b,a]=coefficients;
  if(a.n===0n){
    if(b.n===0n)return {kind:c.n===0n?"all":"none"};
    const solution=div(neg(c),b);
    return {kind:"unique",solution:formatExact(solution),solutionRatio:solution,
      coefficient:formatExact(b),target:formatExact(neg(c))};
  }
  const discriminant=sub(mul(b,b),mul(rat(4n),mul(a,c))),sign=cmp(discriminant,ZERO);
  const details={quadratic:true,discriminant:formatExact(discriminant),
    coefficients:{a:formatExact(a),b:formatExact(b),c:formatExact(c)}};
  if(sign<0)return {kind:"none",...details};
  const denominator=mul(rat(2n),a);
  if(sign===0){
    const solution=div(neg(b),denominator);
    return {kind:"unique",solution:formatExact(solution),solutionRatio:solution,
      repeated:true,coefficient:formatExact(a),target:formatExact(neg(c)),...details};
  }
  const root=squareRootExact(discriminant);
  let solutions;
  if(root){
    const first=div(sub(neg(b),root),denominator),second=div(add(neg(b),root),denominator);
    solutions=cmp(first,second)<=0?[formatExact(first),formatExact(second)]:[formatExact(second),formatExact(first)];
  }
  return {kind:"two",...details,normalizedB:div(b,a),normalizedC:div(c,a),
    solutions:solutions??null,
    radical:"x = ("+formatExact(neg(b))+" ± √("+formatExact(discriminant)+")) / ("+formatExact(denominator)+")"};
}
/** Classe une égalité polynomiale sans contrainte de dénominateur. */
export function classifyPolynomialEquality(text){
  if(typeof text!=="string"||text.length>LIMIT*2)throw Error("ligne trop longue");
  const parts=text.split("=");
  if(parts.length!==2||parts.some(x=>!x.trim()))throw Error("utilise une seule égalité par ligne");
  const lhs=parsePolynomial(parts[0]),rhs=parsePolynomial(parts[1]);
  const difference=subtract(lhs,rhs);
  if(!/[xX]/.test(text)&&difference[1].n===0n&&difference[2].n===0n)
    return {kind:"calculation",correct:difference[0].n===0n,
      left:formatExact(lhs[0]),right:formatExact(rhs[0])};
  return classifyPolynomialDifference(difference);
}
export function sameRealSolutions(left,right){
  if(left.kind!==right.kind)return false;
  if(left.kind==="unique"){
    if(left.solutionRatio&&right.solutionRatio)
      return eq(left.solutionRatio,right.solutionRatio);
    const a=left.algebraic,b=right.algebraic;
    return !!(a&&b&&a.branch===b.branch
      &&eq(a.normalizedB,b.normalizedB)
      &&eq(a.normalizedC,b.normalizedC));
  }
  if(left.kind==="two")return eq(left.normalizedB,right.normalizedB)&&eq(left.normalizedC,right.normalizedC);
  if(left.kind==="allExcept")return Array.isArray(left.excluded)
    &&Array.isArray(right.excluded)&&left.excluded.length===right.excluded.length
    &&left.excluded.every((value,i)=>value===right.excluded[i]);
  return left.kind==="all"||left.kind==="none";
}
