/**
 * Contrôle exact des calculs, équations affines, quadratiques, rationnelles
 * et de certaines équations à racine carrée isolée.
 * Aucune exécution de texte utilisateur ni appels externes : arithmétique
 * rationnelle exacte (BigInt), sans heuristique flottante pour les réponses.
 *
 * Périmètre volontairement limité : les expressions non affines ou ambiguës
 * sont signalées comme non vérifiées et JAMAIS validées par approximation.
 */
import {classifyPolynomialEquality,classifyPolynomialDifference,parsePolynomial,sameRealSolutions} from "./quadratic-checker.mjs";
import {classifyConstrainedEquality,rationalSide} from "./constraint-solver.mjs";
import {isFunctionNotation,parseFunctionLine,checkDerivativeCandidate} from "./derivative-checker.mjs";

const MAX_LINE=180;
const MAX_LINES=40;
const MAX_TOKENS=90;
const MAX_DIGITS=80;

const abs=n=>n<0n?-n:n;
function gcd(a,b){
  a=abs(a);b=abs(b);
  while(b!==0n){const c=a%b;a=b;b=c;}
  return a||1n;
}
function rat(n,d=1n){
  if(d===0n)throw new Error("division par zéro");
  if(d<0n){n=-n;d=-d;}
  const g=gcd(n,d);n/=g;d/=g;
  if(abs(n).toString().length>MAX_DIGITS||d.toString().length>MAX_DIGITS)
    throw new Error("valeurs trop grandes pour cette vérification");
  return {n,d};
}
const add=(u,v)=>rat(u.n*v.d+v.n*u.d,u.d*v.d);
const neg=u=>rat(-u.n,u.d);
const sub=(u,v)=>add(u,neg(v));
const mul=(u,v)=>rat(u.n*v.n,u.d*v.d);
const div=(u,v)=>rat(u.n*v.d,u.d*v.n);
const eq=(u,v)=>u.n===v.n&&u.d===v.d;
const ZERO=rat(0n),ONE=rat(1n);
const constant=u=>({a:ZERO,b:u});
const variable=()=>({a:ONE,b:ZERO});
const addForms=(u,v)=>({a:add(u.a,v.a),b:add(u.b,v.b)});
const negForm=u=>({a:neg(u.a),b:neg(u.b)});
function multiplyForms(u,v){
  if(u.a.n!==0n&&v.a.n!==0n)
    throw new Error("produit contenant x² : équation non linéaire");
  return {a:add(mul(u.a,v.b),mul(v.a,u.b)),b:mul(u.b,v.b)};
}
function divideForms(u,v){
  if(v.a.n!==0n)throw new Error("division par une expression contenant x");
  if(v.b.n===0n)throw new Error("division par zéro");
  return {a:div(u.a,v.b),b:div(u.b,v.b)};
}
function numberValue(text){
  const parts=text.replace(",",".").split(".");
  const digits=parts.join("");
  if(digits.length>16)throw new Error("nombre trop long");
  return rat(BigInt(digits),10n**BigInt(parts[1]?.length??0));
}
function tokenize(raw){
  const text=raw.replace(/\s/g,"").replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/");
  if(!text||text.length>MAX_LINE)throw new Error("expression vide ou trop longue");
  const tokens=[];
  let i=0;
  while(i<text.length){
    const tail=text.slice(i);
    const m=tail.match(/^(?:\d+(?:[.,]\d+)?|[.,]\d+)/);
    if(m){tokens.push({type:"num",value:m[0]});i+=m[0].length;}
    else if("xX".includes(text[i])){tokens.push({type:"x"});i++;}
    else if("+-*/()".includes(text[i])){tokens.push({type:text[i]});i++;}
    else throw new Error("symbole non pris en charge : "+text[i]);
    if(tokens.length>MAX_TOKENS)throw new Error("expression trop complexe");
  }
  return tokens;
}
export function parseAffine(source){
  const tokens=tokenize(source);
  let i=0;
  const peek=()=>tokens[i]?.type;
  const take=type=>{if(peek()!==type)throw new Error("syntaxe incomplète près de "+(peek()??"fin de ligne"));i++;};
  function atom(){
    if(peek()==="num"){const value=numberValue(tokens[i].value);i++;return constant(value);}
    if(peek()==="x"){i++;return variable();}
    if(peek()==="("){i++;const expression=sum();take(")");return expression;}
    throw new Error("nombre, x ou parenthèse attendu");
  }
  function unary(){
    if(peek()==="+"){i++;return unary();}
    if(peek()==="-"){i++;return negForm(unary());}
    return atom();
  }
  function product(){
    let value=unary();
    for(;;){
      const op=peek();
      if(op==="*"||op==="/"){
        i++;const next=unary();value=op==="*"?multiplyForms(value,next):divideForms(value,next);
      }else if(op==="x"||op==="("){
        // 2x et 2(x+1) ; ne jamais inventer une multiplication "2 3".
        value=multiplyForms(value,unary());
      }else break;
    }
    return value;
  }
  function sum(){
    let value=product();
    while(peek()==="+"||peek()==="-"){
      const op=peek();i++;const next=product();
      value=addForms(value,op==="+"?next:negForm(next));
    }
    return value;
  }
  const expression=sum();
  if(i!==tokens.length)throw new Error("opérateur ou parenthèse inattendu");
  return expression;
}
export function formatRational(value){
  return value.d===1n?String(value.n):String(value.n)+"/"+String(value.d);
}
/**
 * Les racines carrées ne sont traitées mathématiquement que lorsqu'elles
 * représentent un entier exact : √(9) = 3, √(144) = 12.
 * Aucune approximation ni élimination de racine symbolique : √(2),
 * √(x) et √(x+1) sont explicitement NON vérifiées, car leurs domaines
 * et leurs éventuelles solutions parasites demandent un autre solveur.
 */
/**
 * Racine carrée exacte d'un entier naturel, en BigInt uniquement.
 * Une approximation de racine ne doit jamais prouver une égalité.
 */
function integerSquareRoot(value){
  if(value<0n)throw Error("racine négative");
  let lower=0n,upper=value+1n;
  while(upper-lower>1n){
    const mid=(lower+upper)/2n;
    if(mid*mid<=value)lower=mid;
    else upper=mid;
  }
  return lower;
}
function normalizeExactRoots(expression){
  if(!expression.includes("√"))return expression;
  const result=expression.replace(/√\((\d{1,6}(?:[.,]\d{1,4})?)\)/g,(raw,rawDigits)=>{
    const digits=rawDigits.replace(",",".").split(".");
    const numerator=BigInt(digits.join(""));
    const denominator=10n**BigInt(digits[1]?.length??0);
    const rootN=integerSquareRoot(numerator),rootD=integerSquareRoot(denominator);
    return rootN*rootN===numerator&&rootD*rootD===denominator
      ?"("+rootN+(rootD===1n?"":"/"+rootD)+")":raw;
  });
  if(result.includes("√"))
    throw new Error("racine non carrée parfaite ou symbolique : domaine et transformations non vérifiés");
  return result;
}
export function classifyEquality(text){
  if(typeof text!=="string"||text.length>2*MAX_LINE)throw new Error("ligne trop longue");
  const parts=text.split("=");
  if(parts.length!==2||parts.some(x=>!x.trim()))
    throw new Error("utilise une seule égalité par ligne");
  let left,right,normalized;
  try{normalized=parts.map(normalizeExactRoots);}
  catch(error){
    // Une racine symbolique isolée se résout par mise au carré et
    // substitution des candidats. Aucun résultat n'est seulement déduit
    // de l'équation mise au carré (risque de racines parasites).
    const constrained=classifyConstrainedEquality(text);
    if(constrained)return constrained;
    throw error;
  }
  try{
    left=parseAffine(normalized[0]);right=parseAffine(normalized[1]);
  }catch(error){
    // La lecture affine reste prioritaire, puis le second degré exact.
    try{return classifyPolynomialEquality(normalized.join("="));}
    catch{
      const constrained=classifyConstrainedEquality(normalized.join("="));
      if(constrained)return constrained;
      throw error;
    }
  }
  if(!/[xX]/.test(parts[0]+parts[1])){
    return {kind:"calculation",correct:eq(left.b,right.b),
      left:formatRational(left.b),right:formatRational(right.b)};
  }
  const coeff=sub(left.a,right.a),target=sub(right.b,left.b);
  if(coeff.n===0n)return {kind:target.n===0n?"all":"none"};
  return {kind:"unique",solution:formatRational(div(target,coeff)),
    solutionRatio:div(target,coeff),coefficient:formatRational(coeff),target:formatRational(target)};
}

/**
 * Inéquations AFFINES exactes sur R : une relation par ligne, en x uniquement.
 * La frontière est rationnelle ; son inclusion et le sens sont comparés sans flottants.
 * Les systèmes, produits de signes et inéquations quadratiques restent non vérifiés.
 */
export function classifyAffineInequality(text){
  if(typeof text!=="string"||text.length>2*MAX_LINE)throw Error("ligne trop longue");
  const match=text.match(/^(.+?)\s*(<=|>=|≤|≥|<|>)\s*(.+)$/u);
  if(!match||/[<>=≤≥≠]/u.test(match[1]+match[3]))
    throw Error("une seule inéquation complète est nécessaire (x < a, x ≥ a, etc.)");
  const lhs=parseAffine(match[1]),rhs=parseAffine(match[3]);
  const coefficient=sub(lhs.a,rhs.a),target=sub(rhs.b,lhs.b);
  const originalOperator=match[2]==="<="?"≤":match[2]===">="?"≥":match[2];
  const base={inequality:true,coefficient:formatRational(coefficient),
    target:formatRational(target),originalOperator};
  if(coefficient.n===0n){
    const valid=originalOperator==="<"?target.n>0n
      :originalOperator==="≤"?target.n>=0n
      :originalOperator===">"?target.n<0n:target.n<=0n;
    return {...base,kind:valid?"all":"none",
      solution:valid?"tous les réels":"aucune solution",
      signFlipped:false};
  }
  const signFlipped=coefficient.n<0n;
  const mirror={"<":">","≤":"≥",">":"<","≥":"≤"};
  const operator=signFlipped?mirror[originalOperator]:originalOperator;
  const boundary=div(target,coefficient);
  return {...base,kind:"interval",operator,boundary,signFlipped,
    solution:"x "+operator+" "+formatRational(boundary)};
}
// Ensembles de solutions : intervalles ordonnés, bornes rationnelles ou
// racines algébriques canoniques. Les clés des racines irrationnelles
// utilisent le polynôme monique et leur ordre, jamais un nombre flottant.
const endpoint=value=>({key:"r:"+formatRational(value),label:formatRational(value),value});
const interval=(lo=null,hi=null,lc=false,hc=false)=>({lo,hi,lc:!!lo&&lc,hc:!!hi&&hc});
const ALL_INTERVALS=[interval()];
const rootPoint=r=>interval(r,r,true,true);
const sameEndpoint=(a,b)=>a===null?b===null:b!==null&&a.key===b.key;
const compareRat=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
const signRat=a=>a.n<0n?-1:a.n>0n?1:0;
function signSurd(a,b,d){
  const sa=signRat(a),sb=signRat(b);
  if(!sb)return sa;
  if(!sa||sa===sb)return sb;
  return sa*compareRat(mul(a,a),mul(mul(b,b),d));
}
function surdEndpoint(center,coefficient,radicand,label){
  if(radicand.n<0n)throw Error("racine carrée non réelle");
  if(!coefficient.n||!radicand.n)return endpoint(center);
  const n=integerSquareRoot(radicand.n),d=integerSquareRoot(radicand.d);
  if(n*n===radicand.n&&d*d===radicand.d)
    return endpoint(add(center,mul(coefficient,rat(n,d))));
  const b=neg(mul(rat(2n),center));
  const c=sub(mul(center,center),mul(mul(coefficient,coefficient),radicand));
  return {key:"q:"+formatRational(b)+":"+formatRational(c)+":"+(coefficient.n<0n?"lower":"upper"),
    label,center,coefficient,radicand};
}
function compareEndpoint(left,right){
  if(sameEndpoint(left,right))return 0;
  if(left.value&&right.value)return compareRat(left.value,right.value);
  if(right.value)return signSurd(sub(left.center,right.value),left.coefficient,left.radicand);
  if(left.value)return -compareEndpoint(right,left);
  // Compare u = a+b√D and v = e√F. When signs agree, compare
  // their squares, retaining the common sign. No numerical approximation.
  const a=sub(left.center,right.center),b=left.coefficient,e=right.coefficient;
  const u=signSurd(a,b,left.radicand),v=signRat(e);
  if(!u||u!==v)return u||-v;
  const constant=sub(add(mul(a,a),mul(mul(b,b),left.radicand)),mul(mul(e,e),right.radicand));
  return u*signSurd(constant,mul(rat(2n),mul(a,b)),left.radicand);
}
function normalizeIntervals(source){
  const sorted=[...source].sort((a,b)=>!a.lo?(!b.lo?Number(b.lc)-Number(a.lc):-1)
    :!b.lo?1:compareEndpoint(a.lo,b.lo)||Number(b.lc)-Number(a.lc));
  const out=[];
  for(const b of sorted){
    const a=out.at(-1);
    if(!a){out.push(b);continue;}
    const overlap=!a.hi||!b.lo?1:compareEndpoint(a.hi,b.lo);
    if(overlap>0||overlap===0&&(a.hc||b.lc)){
      const upper=!a.hi||!b.hi?null:compareEndpoint(a.hi,b.hi)>=0?a.hi:b.hi;
      const hc=upper!==null&&(sameEndpoint(upper,a.hi)&&a.hc||sameEndpoint(upper,b.hi)&&b.hc);
      out[out.length-1]=interval(a.lo,upper,a.lc,hc);
    }else out.push(b);
  }
  return out;
}
function intervalsFor(result){
  if(result.intervals)return result.intervals;
  if(result.kind==="all")return ALL_INTERVALS;
  if(result.kind==="none")return [];
  const r=endpoint(result.boundary);
  return result.operator.startsWith("<")||result.operator==="≤"
    ?[interval(null,r,false,result.operator==="≤")]
    :[interval(r,null,result.operator==="≥",false)];
}
function describeSet(intervals){
  if(!intervals.length)return "∅";
  if(intervals.length===1&&!intervals[0].lo&&!intervals[0].hi)return "ℝ";
  return intervals.map(({lo,hi,lc,hc})=>{
    if(lo&&hi&&sameEndpoint(lo,hi)&&lc&&hc)return "{"+lo.label+"}";
    return (lc?"[":"]")+(lo?.label??"−∞")+" ; "+(hi?.label??"+∞")+(hc?"]":"[");
  }).join(" ∪ ");
}
function rationalEndpoint(text){
  if(!text.trim()||/[xX]/.test(text))throw Error("borne rationnelle attendue");
  const poly=parsePolynomial(text);
  if(poly[1].n!==0n||poly[2].n!==0n)throw Error("borne rationnelle attendue");
  return endpoint(poly[0]);
}
function parseEndpoint(text){
  if(!text.includes("√"))return rationalEndpoint(text);
  if(/[xX]/.test(text)||/\d\s+\d/.test(text))throw Error("borne numérique exacte attendue");
  const source=text.replace(/[−–]/g,"-").trim();
  // Exactly one radical occurrence; the polynomial parser verifies the
  // surrounding rational expression as an affine expression in √D.
  const normalized=source.replace(/√\s*(\d+(?:[.,]\d+)?)(?![\d.,])/g,"√($1)");
  const matches=[...normalized.matchAll(/√\s*\(([^()]*)\)/g)];
  if(matches.length!==1||normalized.split("√").length!==2)
    throw Error("utilise une racine isolée : √(2), -√(2) ou (1+√(5))/2");
  const match=matches[0],radicand=rationalEndpoint(match[1]).value;
  const expr=normalized.slice(0,match.index)+"x"+normalized.slice(match.index+match[0].length);
  const [center,coefficient,quadratic]=parsePolynomial(expr);
  if(quadratic.n)throw Error("borne non affine en une racine carrée");
  return surdEndpoint(center,coefficient,radicand,source);
}
function quadraticRoots(result){
  if(result.kind==="none"||result.kind==="all")return [];
  if(result.kind==="unique")return [endpoint(result.solutionRatio)];
  if(result.solutions)return result.solutions.map(rationalEndpoint);
  const b=result.normalizedB,c=result.normalizedC,D=sub(mul(b,b),mul(rat(4n),c));
  return [-1n,1n].map((sign,i)=>surdEndpoint(div(neg(b),rat(2n)),rat(sign,2n),D,
    "("+formatRational(neg(b))+(i===0?" − ":" + ")+"√("+formatRational(D)+"))/2"));
}
function classifyPolynomialInequality(text){
  if(typeof text!=="string"||text.length>2*MAX_LINE)throw Error("ligne trop longue");
  const match=text.match(/^(.+?)\s*(<=|>=|≤|≥|<|>)\s*(.+)$/u);
  if(!match||/[<>=≤≥≠]/u.test(match[1]+match[3]))throw Error("une seule inéquation complète est nécessaire");
  let left,right;
  try{left=parsePolynomial(match[1]);right=parsePolynomial(match[3]);}
  catch(error){
    if(!/[\/÷]/.test(text))throw error;
    return classifyRationalInequality(match[1],match[2],match[3]);
  }
  const poly=left.map((v,i)=>sub(v,right[i]));
  const [c,b,a]=poly;
  if(a.n===0n){
    // La simplification de termes quadratiques peut ramener au degré 1.
    const coeff=formatRational(b),target=formatRational(neg(c));
    const result=classifyAffineInequality(coeff+"*x "+match[2]+" "+target);
    return {...result,numeric:!/[xX]/.test(text)};
  }
  const roots=classifyPolynomialDifference(poly),bounds=quadraticRoots(roots);
  const operator=match[2]==="<="?"≤":match[2]===">="?"≥":match[2];
  const wantsPositive=operator===">"||operator==="≥";
  const includeZero=operator==="≤"||operator==="≥";
  const positiveOutside=a.n>0n,selectOutside=wantsPositive===positiveOutside;
  let intervals;
  if(bounds.length===0)intervals=selectOutside?ALL_INTERVALS:[];
  else if(bounds.length===1){
    const [r]=bounds;
    intervals=selectOutside?(includeZero?ALL_INTERVALS:[interval(null,r),interval(r,null)])
      :(includeZero?[rootPoint(r)]:[]);
  }else{
    const [r,s]=bounds;
    intervals=selectOutside?[interval(null,r,false,includeZero),interval(s,null,includeZero,false)]
      :[interval(r,s,includeZero,includeZero)];
  }
  const sign=positiveOutside?"+":"−",opposite=positiveOutside?"−":"+";
  const range=(lo,hi)=>describeSet([interval(lo,hi)]);
  const signTable=bounds.length===0?[{range:"ℝ",sign}]:
    bounds.length===1?[{range:range(null,bounds[0]),sign},
      {range:bounds[0].label,sign:"0"},{range:range(bounds[0],null),sign}]:
    [{range:range(null,bounds[0]),sign},{range:bounds[0].label,sign:"0"},
      {range:range(bounds[0],bounds[1]),sign:opposite},{range:bounds[1].label,sign:"0"},
      {range:range(bounds[1],null),sign}];
  return {inequality:true,quadratic:true,kind:intervals.length?"set":"none",intervals,
    solution:"S = "+describeSet(intervals),discriminant:roots.discriminant,
    coefficient:formatRational(a),originalOperator:operator,signTable,positiveOutside,
    rootCount:bounds.length,includeZero};
}
/**
 * Rational inequalities: two sides, each a polynomial or a single
 * explicitly delimited quotient P(x)/Q(x), Q affine. Cross numerator
 * and denominator product must remain degree <= 2. Never multiply
 * an inequality by a variable denominator without tracking its sign.
 */
const degreeOf=p=>p[2].n?2:p[1].n?1:0;
const zeroPoly=p=>p.every(v=>!v.n);
function productPoly(a,b){
  const result=[ZERO,ZERO,ZERO];
  for(let i=0;i<=2;i++)for(let j=0;j<=2;j++){
    if(!a[i].n||!b[j].n)continue;
    if(i+j>2)throw Error("produit croisé de degré supérieur à 2");
    result[i+j]=add(result[i+j],mul(a[i],b[j]));
  }
  return result;
}
function polynomialEvents(poly){
  const degree=degreeOf(poly),roots=quadraticRoots(classifyPolynomialDifference(poly));
  return {roots,flip:degree===1||roots.length===2,
    initial:zeroPoly(poly)?0:signRat(poly[degree])*(degree%2?-1:1)};
}
function classifyRationalInequality(lhs,rawOp,rhs){
  const a=rationalSide(lhs),b=rationalSide(rhs);
  if(!a.excluded.length&&!b.excluded.length)throw Error("quotient non vérifié");
  const numerator=productPoly(a.numerator,b.denominator)
    .map((v,i)=>sub(v,productPoly(b.numerator,a.denominator)[i]));
  const denominator=productPoly(a.denominator,b.denominator);
  const n=polynomialEvents(numerator),d=polynomialEvents(denominator);
  const events=[...n.roots,...d.roots].sort(compareEndpoint)
    .filter((r,i,all)=>i===0||!sameEndpoint(r,all[i-1]));
  const operator=rawOp==="<="?"≤":rawOp===">="?"≥":rawOp;
  const accept=s=>operator==="<"?s<0:operator==="≤"?s<=0:operator===">"?s>0:s>=0;
  const selected=[],signTable=[];
  let ns=n.initial,ds=d.initial,lo=null;
  function segment(hi){
    const current=interval(lo,hi),s=ns*ds;
    signTable.push({range:describeSet([current]),sign:s<0?"−":s>0?"+":"0"});
    if(accept(s))selected.push(current);
  }
  for(const root of events){
    segment(root);
    const forbidden=d.roots.some(r=>sameEndpoint(r,root));
    const isZero=n.roots.some(r=>sameEndpoint(r,root))||zeroPoly(numerator);
    if(!forbidden&&!isZero)throw Error("événement de signe incohérent");
    signTable.push({range:root.label,sign:forbidden?"interdit":"0"});
    if(!forbidden&&accept(0))selected.push(rootPoint(root));
    if(n.flip&&n.roots.some(r=>sameEndpoint(r,root)))ns=-ns;
    if(d.flip&&forbidden)ds=-ds;
    lo=root;
  }
  segment(null);
  const intervals=normalizeIntervals(selected);
  const forbidden=d.roots.map(r=>r.label);
  return {inequality:true,rationalInequality:true,kind:intervals.length?"set":"none",
    intervals,solution:"S = "+describeSet(intervals),signTable,
    originalOperator:operator,forbidden,
    method:"Tout ramener à un quotient et étudier séparément le signe du numérateur et du dénominateur. "+
      "Valeur(s) interdite(s) : "+forbidden.join(" ; ")+
      ". Elles restent exclues même si un facteur se simplifie. "+
      "Ne multiplie jamais par un dénominateur de signe inconnu."};
}
/** Une conclusion S = ... accepte les intervalles français à bornes
 * rationnelles ou quadratiques exactes, ℝ/R, ∅ et des unions.
 * Les intervalles sont normalisés avant toute comparaison. */
export function parseInequalitySet(text){
  if(typeof text!=="string"||text.length>2*MAX_LINE)throw Error("ensemble trop long");
  const m=text.match(/^S\s*=\s*(.+)$/i);
  if(!m)throw Error("écris S = suivi de l'ensemble des solutions");
  const source=m[1].trim();
  if(/^(?:ℝ|R)$/u.test(source))return {inequality:true,intervals:ALL_INTERVALS,solution:"S = ℝ"};
  if(source==="∅")return {inequality:true,intervals:[],solution:"S = ∅"};
  const parts=source.split(/\s*(?:∪|\\cup)\s*/u);
  if(parts.length>5)throw Error("cinq intervalles au maximum");
  let intervals=parts.map(part=>{
    const point=part.match(/^\{\s*(.+?)\s*\}$/u);
    if(point)return rootPoint(parseEndpoint(point[1]));
    const match=part.match(/^([\[\]])\s*([^;]+?)\s*;\s*([^;]+?)\s*([\[\]])$/u);
    if(!match)throw Error("notation attendue : ]−∞ ; 2] ou [2 ; 3[ ou {2}");
    const lower=match[2].trim(),upper=match[3].trim(),lc=match[1]==="[",hc=match[4]==="]";
    const lo=/^[-−](?:∞|inf)$/i.test(lower)?null:parseEndpoint(lower);
    const hi=/^\+?(?:∞|inf)$/i.test(upper)?null:parseEndpoint(upper);
    if((!lo&&lc)||(!hi&&hc))throw Error("une borne infinie est toujours ouverte");
    if(lo&&hi){
      const cmp=compareEndpoint(lo,hi);
      if(cmp>0||cmp===0&&!(lc&&hc))throw Error("intervalle vide ou bornes dans le mauvais ordre ; écris ∅ si nécessaire");
    }
    return interval(lo,hi,lc,hc);
  });
  intervals=normalizeIntervals(intervals);
  return {inequality:true,intervals,solution:"S = "+describeSet(intervals)};
}
function sameInequalitySolutions(a,b){
  if(!a?.inequality||!b?.inequality)return false;
  const left=intervalsFor(a),right=intervalsFor(b);
  return left.length===right.length&&left.every((v,i)=>sameEndpoint(v.lo,right[i].lo)&&
    sameEndpoint(v.hi,right[i].hi)&&v.lc===right[i].lc&&v.hc===right[i].hc);
}
function inequalityMethod(result){
  if(result.rationalInequality)return result.method+" Ensemble attendu : "+result.solution+".";
  if(result.quadratic){
    const rule=result.rootCount===0?"Aucune racine réelle : signe constant de a."
      :result.rootCount===1?"Une racine double : le signe de a ne change pas en la traversant."
      :"Deux racines : signe de a à l'extérieur, signe opposé entre elles.";
    return "Mets tout dans un membre : ax² + bx + c "+result.originalOperator+" 0. Δ = "+
      result.discriminant+". "+rule+" Ici a "+(result.positiveOutside?">":"<")+" 0. "+
      (result.includeZero?"Inclure les zéros. ":"Exclure les zéros. ")+
      "Ensemble attendu : "+result.solution+".";
  }
  if(result.kind!=="interval")
    return "Les termes en x s'annulent : vérifie la vérité de 0 "+result.originalOperator+" "+result.target+
      ". Ensemble attendu : "+result.solution+".";
  return "Regroupe les termes : "+result.coefficient+"x "+result.originalOperator+" "+result.target+
    ". "+(result.signFlipped?"En divisant par un coefficient négatif, inverse le signe de l'inégalité. ":"")+
    "Ensemble attendu : "+result.solution+
    ". Vérifie le sens et si la borne est incluse (≤/≥) ou exclue (</>).";
}

const description=result=>{
  const solutions=result.kind==="two"
    ?result.solutions?"deux solutions réelles : x = "+result.solutions.join(" ou x = ")
      :"deux solutions réelles : "+result.radical
    :result.kind==="unique"?"x = "+result.solution+(result.repeated?" (racine double)":"")
    :result.kind==="all"?"tous les nombres réels"
    :result.kind==="allExcept"?"tous les réels sauf "+result.excluded.map(x=>"x = "+x).join(" et ")
    :result.kind==="none"?"aucune solution réelle":"un calcul numérique";
  const rejected=result.rejectedCandidates?.length
    ?" Candidats éliminés après contrôle : "+result.rejectedCandidates.map(x=>"x = "+x).join(", ")+".":"";
  return solutions+(result.domainInfo?" ("+result.domainInfo+")":"")+rejected;
};
function sameSolution(a,b){return sameRealSolutions(a,b);}
function reviewSkill(result){
  if(result?.rationalInequality||result?.rationalEquation)return "rational";
  if(result?.radicalEquation)return "radical";
  if(result?.quadratic)return "quadratic";
  if(result?.inequality)return "inequality";
  if(result?.kind==="calculation")return "numeric";
  return "linear";
}
/**
 * Les lignes non mathématiques séparent les chaînes (plusieurs exercices).
 * Les lignes contenant un = inconnu ne servent JAMAIS à confirmer une étape.
 */
export function checkMathSteps(text){
  const lines=String(text??"").split(/\r?\n/);
  if(lines.length>MAX_LINES)
    return {entries:[{line:0,kind:"unsupported",message:"Vérifie au maximum 40 lignes à la fois ; sépare ton travail en plusieurs séances."}],checked:0,errors:0,unsupported:1};
  const entries=[];let previous=null,previousLine=0,checked=0,errors=0,unsupported=0,definition=null;
  for(let i=0;i<lines.length;i++){
    const input=lines[i].trim(),line=i+1;
    if(!input){previous=null;definition=null;continue;}
    if(!input.includes("=")&&!/[<>≤≥≠]/u.test(input)){previous=null;definition=null;continue;}
    if(/^S\s*=/i.test(input)){
      definition=null;
      if(!previous?.inequality){
        previous=null;unsupported++;
        entries.push({line,kind:"unsupported",message:"Conclusion non vérifiée : écris d'abord l'inéquation, sans ligne vide."});
        continue;
      }
      let result;
      try{result=parseInequalitySet(input);}
      catch(error){
        unsupported++;
        entries.push({line,kind:"unsupported",message:"Ensemble non vérifié : "+error.message+". Utilise des bornes rationnelles ou une racine exacte telle que (1+√(5))/2."});
        continue;
      }
      // Une écriture rationnelle ne peut pas certifier un intervalle à bornes
      // irrationnelles ; une approximation n'est jamais acceptée.
      checked++;
      if(sameInequalitySolutions(previous,result))
        entries.push({line,kind:"ok",message:"Conclusion exacte : "+result.solution+"."});
      else{
        errors++;
        entries.push({line,kind:"error",skill:reviewSkill(previous),message:"Ensemble de solutions incorrect : "+result.solution+
          ". Attendu : S = "+describeSet(intervalsFor(previous))+". "+inequalityMethod(previous)});
      }
      continue;
    }
    if(/[<>≤≥≠]/u.test(input)){
      definition=null;
      let result;
      try{result=classifyPolynomialInequality(input);}
      catch(error){
        previous=null;unsupported++;
        entries.push({line,kind:"unsupported",message:"Inéquation non vérifiée : "+error.message+
          ". Utilise une inéquation de degré 1 ou 2 ou un quotient explicite à dénominateur affine, sans chaîne."});
        continue;
      }
      if(previous&&!previous.inequality){
        previous=null;unsupported++;
        entries.push({line,kind:"unsupported",message:"Passage d'une équation à une inéquation : "+
          "on ne peut pas les déclarer équivalentes. Sépare les deux raisonnements par une ligne vide."});
        continue;
      }
      checked++;
      if(!previous){
        if(result.numeric){
          const correct=result.kind==="all";
          if(!correct)errors++;
          entries.push({line,kind:correct?"ok":"error",...(!correct?{skill:"numeric"}:{}),message:"Inégalité numérique "+(correct?"vraie.":"fausse. ")+inequalityMethod(result)});
          continue;
        }
        entries.push({line,kind:"info",message:(result.rationalInequality?"Inéquation rationnelle reconnue. ":"Inéquation du "+(result.quadratic?"second":"premier")+" degré reconnue. ")+
          inequalityMethod(result),...(result.signTable?{signTable:result.signTable}:{})});
        previous=result;previousLine=line;
      }else if(sameInequalitySolutions(previous,result)){
        entries.push({line,kind:"ok",message:"Étape équivalente à la ligne "+previousLine+
          " : même ensemble de solutions ("+result.solution+")."});
        previous=result;previousLine=line;
      }else{
        errors++;
        entries.push({line,kind:"error",skill:reviewSkill(previous),message:"Étape non équivalente à la ligne "+previousLine+
          " : cette ligne donne "+result.solution+", au lieu de "+previous.solution+". "+
          inequalityMethod(previous)});
        // Ne jamais prendre une erreur comme référence des lignes suivantes.
      }
      continue;
    }
    if(isFunctionNotation(input)){
      // Conserver la définition valide comme seule référence, y compris
      // après une tentative de dérivation incorrecte.
      previous=null;
      let statement;
      try{statement=parseFunctionLine(input);}
      catch(error){
        unsupported++;
        if(!/^\s*[fgh]\s*['’′]/u.test(input))definition=null;
        entries.push({line,kind:"unsupported",message:"Fonction non vérifiée : "+error.message+". Utilise un polynôme de degré 0 à 6, ou c·sin(ax+b), c·cos(ax+b), c·exp(ax+b), c·ln(ax+b) avec une constante facultative."});
        continue;
      }
      if(statement.type==="definition"){
        definition=statement;checked++;
        const scope=statement.elementary
          ?"Fonction élémentaire reconnue. La règle de chaîne et le domaine éventuel seront contrôlés lors de la vérification de sa dérivée."
          :"Polynôme reconnu. Règle : (a·x^n)' = n·a·x^(n−1).";
        entries.push({line,kind:"info",message:scope+" Écris ensuite "+statement.name+"'(x) = ... pour vérifier ta dérivée."});
      }else if(!definition||definition.name!==statement.name){
        unsupported++;
        entries.push({line,kind:"unsupported",message:"Dérivée non vérifiée : écris d'abord "+statement.name+"(x) = ... puis "+statement.name+"'(x) = ... sans ligne vide."});
      }else{
        const review=checkDerivativeCandidate(definition,statement);checked++;
        if(review.correct)
          entries.push({line,kind:"ok",message:"Dérivée exacte : "+review.expected+". "+review.rule});
        else{
          errors++;
          entries.push({line,kind:"error",skill:"derivative",message:"Dérivée incorrecte : "+review.actual+". Résultat attendu : "+review.expected+". "+review.rule+" "+review.detail+" Vérifie les exposants, les signes et la dérivée des constantes."});
        }
      }
      continue;
    }
    definition=null;
    if(previous?.inequality){
      previous=null;unsupported++;
      entries.push({line,kind:"unsupported",message:"Passage d'une inéquation à une équation : "+
        "elles ne sont pas équivalentes. Sépare les raisonnements par une ligne vide."});
      continue;
    }
    let result;
    try{result=classifyEquality(input);}
    catch(error){
      previous=null;unsupported++;
      entries.push({line,kind:"unsupported",message:"Non vérifiée : "+error.message+". Saisis une équation seule, sans annotation."});
      continue;
    }
    checked++;
    if(result.kind==="calculation"){
      const earlier=previous,fromLine=previousLine;
      previous=null;
      const currentKind=result.correct?"all":"none";
      if(earlier&&earlier.kind===currentKind){
        entries.push({line,kind:"ok",message:"Étape équivalente à la ligne "+fromLine+" : "+description(earlier)+"."});
      }else if(!result.correct){
        errors++;entries.push({line,kind:"error",skill:"numeric",message:"Égalité numérique fausse : le membre gauche vaut "+result.left+", le membre droit "+result.right+"."});
      }else if(earlier?.kind==="unique"){
        entries.push({line,kind:"info",message:"Égalité numérique correcte, mais elle ne prouve pas à elle seule l'équivalence avec la ligne "+fromLine+" ("+description(earlier)+"). Une vérification par substitution se rédige à part."});
      }else if(earlier){
        errors++;entries.push({line,kind:"error",skill:reviewSkill(earlier),message:"L'égalité numérique n'est pas équivalente à la ligne "+fromLine+" : "+description(earlier)+"."});
      }else{
        entries.push({line,kind:"ok",message:"Calcul correct : "+result.left+" = "+result.right+"."});
      }
      continue;
    }
    if(!previous){
      entries.push({line,kind:"info",message:(result.rationalEquation
        ?"Équation rationnelle : "+description(result)+". Les valeurs interdites sont conservées lors de chaque comparaison."
        :result.radicalEquation
          ?"Équation avec racine carrée : "+description(result)+". Après mise au carré, chaque solution candidate a été contrôlée dans l'égalité initiale."
          :result.quadratic
            ?"Équation du second degré reconnue (Δ = "+result.discriminant+"). Les lignes suivantes seront comparées selon leur ensemble de solutions réelles."
            :"Équation du premier degré reconnue. Les transformations suivantes seront comparées à cette ligne.")
        +(result.methodSteps?.length?" Méthode guidée : "+result.methodSteps.join(" "):"")});
    }else if(sameSolution(previous,result)){
      entries.push({line,kind:"ok",message:"Étape équivalente à la ligne "+previousLine+" : même ensemble de solutions ("+description(result)+")."});
    }else{
      errors++;
      const method=previous.rationalEquation
        ?" Valeurs interdites : "+(previous.domainInfo??"")+
          " Multiplier par le dénominateur n'est équivalent que si les zéros de ce dénominateur sont exclus."
        :previous.radicalEquation
          ?" Après mise au carré, vérifier dans l'équation initiale la non-négativité du membre sans racine et du radicande ; supprimer toute solution parasite."
        :previous.quadratic
        ?" Méthode depuis la ligne "+previousLine+" : mets l'équation sous la forme ax² + bx + c = 0 (a ≠ 0), puis calcule Δ = b² − 4ac = "+previous.discriminant+". "+(previous.kind==="two"?"Tu dois conserver les deux racines : "+description(previous)+".":previous.kind==="unique"?"Conserve la racine double : "+description(previous)+".":"Comme Δ < 0, il n'y a aucune racine réelle.") 
        :previous.kind==="unique"
          ?" Méthode depuis la ligne "+previousLine+" : regroupe les termes en x, puis les constantes pour obtenir "+(previous.coefficient==="1"?"x":previous.coefficient+"x")+" = "+previous.target+", et divise par "+previous.coefficient+" pour trouver x = "+previous.solution+"."
          :" Reprends la simplification : une identité doit rester vraie pour tout x et une équation impossible ne doit pas gagner de solution.";
      entries.push({line,kind:"error",skill:reviewSkill(previous),message:"Étape non équivalente à la ligne "+previousLine+" : précédemment "+description(previous)+", maintenant "+description(result)+". Vérifie les signes et les opérations appliquées aux deux membres."+method});
    }
    // Une étape incorrecte ne devient jamais le nouveau point de référence.
    // Cela évite qu'une seconde ligne cohérente avec une erreur précédente
    // soit annoncée comme valide alors qu'elle ne l'est pas.
    if(!previous||sameSolution(previous,result)){
      previous=result;previousLine=line;
    }
  }
  return {entries,checked,errors,unsupported};
}
