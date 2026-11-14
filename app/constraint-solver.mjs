/**
 * Équations rationnelles et équations à une racine isolée, en arithmétique
 * rationnelle exacte. Aucun flottant, eval, approximation de racines ou accès
 * réseau. Les cas hors domaine retournent une erreur explicite.
 *
 * Périmètre :
 * - (polynôme degré <= 2)/(dénominateur affine) = expression polynomiale
 *   ou un second quotient à dénominateur affine ; produit croisé <= degré 2 ;
 * - √(polynôme degré <= 2) = polynôme affine, ou ordre inverse ;
 * - racines de l'équation auxiliaire rationnelles uniquement dans le
 *   problème radical, contrôlées dans l'équation initiale.
 */
import {parsePolynomial,classifyPolynomialDifference,formatExact} from "./quadratic-checker.mjs";

const DIGIT_CAP=80,MAX_SIDE=180;
const abs=n=>n<0n?-n:n;
function gcd(a,b){
  a=abs(a);b=abs(b);
  while(b){const r=a%b;a=b;b=r;}
  return a||1n;
}
function rat(n,d=1n){
  if(d===0n)throw Error("division par zéro");
  if(d<0n){n=-n;d=-d;}
  const g=gcd(n,d);n/=g;d/=g;
  if(abs(n).toString().length>DIGIT_CAP||d.toString().length>DIGIT_CAP)
    throw Error("coefficients rationnels trop grands");
  return {n,d};
}
const zero=rat(0n),one=rat(1n);
const plus=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=a=>rat(-a.n,a.d);
const minus=(a,b)=>plus(a,neg(b));
const times=(a,b)=>rat(a.n*b.n,a.d*b.d);
const over=(a,b)=>rat(a.n*b.d,a.d*b.n);
const equal=(a,b)=>a.n===b.n&&a.d===b.d;
const compare=(a,b)=>a.n*b.d<b.n*a.d?-1:a.n*b.d>b.n*a.d?1:0;
const degree=p=>p[2].n!==0n?2:p[1].n!==0n?1:0;
const constant=r=>[r,zero,zero];
const difference=(a,b)=>a.map((co,i)=>minus(co,b[i]));
const multiply=(a,b)=>{
  const out=[zero,zero,zero];
  for(let i=0;i<=2;i++)for(let j=0;j<=2;j++){
    if(a[i].n===0n||b[j].n===0n)continue;
    if(i+j>2)throw Error("produit croisé de degré supérieur à deux : non vérifié");
    out[i+j]=plus(out[i+j],times(a[i],b[j]));
  }
  return out;
};
const valueAt=(p,x)=>plus(p[0],times(x,plus(p[1],times(x,p[2]))));
const isZero=p=>p.every(value=>value.n===0n);
function quotientIndex(expression){
  let depth=0,index=-1;
  for(let i=0;i<expression.length;i++){
    const ch=expression[i];
    if(ch==="(")depth++;
    else if(ch===")")depth--;
    if(depth<0)throw Error("parenthèses déséquilibrées");
    if(ch==="/"&&depth===0){
      if(index!==-1)throw Error("fractions composées ou multiples non vérifiées");
      index=i;
    }
  }
  if(depth!==0)throw Error("parenthèses déséquilibrées");
  return index;
}
function rationalSide(source){
  // La lecture polynomiale en premier conserve les fractions de constantes,
  // les expressions ordinaires et les polynômes existants.
  try{return {numerator:parsePolynomial(source),denominator:constant(one),excluded:[]};}
  catch(original){
    const slash=quotientIndex(source);
    if(slash<1||slash===source.length-1)throw original;
    const numerator=parsePolynomial(source.slice(0,slash));
    const denominator=parsePolynomial(source.slice(slash+1));
    if(degree(denominator)>1)
      throw Error("dénominateur quadratique : valeurs interdites non vérifiées");
    if(isZero(denominator))
      throw Error("dénominateur identiquement nul");
    if(degree(denominator)!==1)throw original;
    const banned=over(neg(denominator[0]),denominator[1]);
    return {numerator,denominator,excluded:[banned]};
  }
}
function sortedUnique(ratios){
  const sorted=[...ratios].sort(compare),out=[];
  for(const x of sorted)if(!out.some(y=>equal(x,y)))out.push(x);
  return out;
}
function candidates(classification){
  if(classification.kind==="none")return [];
  if(classification.kind==="unique")return [classification.solutionRatio];
  if(classification.kind==="two"){
    if(!classification.solutions)return null;
    return classification.solutions.map(text=>parsePolynomial(text)[0]);
  }
  return null; // Ensemble infini ou racines irrationnelles
}
function filteredResult(base,valid,metadata={}){
  if(base.kind==="none")return {...base,...metadata};
  if(base.kind==="all")throw Error("identité avec contraintes de signe : ensemble infini non vérifié");
  const original=candidates(base);
  if(original===null)throw Error("racines non rationnelles : substitution exacte non disponible");
  const kept=original.filter(valid);
  const dropped=original.filter(x=>!valid(x)).map(formatExact);
  const details={...metadata,rejectedCandidates:dropped};
  if(kept.length===0)return {kind:"none",...details};
  if(kept.length===original.length)return {...base,...details};
  if(kept.length===1)return {
    kind:"unique",solution:formatExact(kept[0]),solutionRatio:kept[0],...details
  };
  if(kept.length===2)return {...base,...details};
  throw Error("ensemble de solutions inattendu");
}
function rationalEquation(left,right){
  const a=rationalSide(left),b=rationalSide(right);
  const exclusions=sortedUnique([...a.excluded,...b.excluded]);
  if(!exclusions.length)return null;
  const cross=difference(multiply(a.numerator,b.denominator),
    multiply(b.numerator,a.denominator));
  const raw=classifyPolynomialDifference(cross);
  const banned=exclusions.map(formatExact);
  const domainExclusions=banned;
  const domainInfo="Valeurs interdites : "+banned.map(x=>"x = "+x).join(" et ")+".";
  if(raw.kind==="all")return {kind:"allExcept",excluded:banned,
    domainExclusions,domainInfo,rationalEquation:true,
    rejectedCandidates:[]};
  if(raw.kind==="none")return {...raw,domainExclusions,domainInfo,rationalEquation:true,
    rejectedCandidates:[]};
  // Une racine irrationnelle ne peut pas être égale à une valeur interdite
  // rationnelle pour un dénominateur affine ; on peut donc la conserver.
  if(raw.kind==="two"&&!raw.solutions)return {...raw,domainExclusions,
    domainInfo,rationalEquation:true,rejectedCandidates:[]};
  const originals=candidates(raw),accepted=originals.filter(x=>
    !exclusions.some(excluded=>equal(excluded,x)));
  const rejectedCandidates=originals.filter(x=>
    exclusions.some(excluded=>equal(excluded,x))).map(formatExact);
  const meta={domainExclusions,domainInfo,rationalEquation:true,rejectedCandidates};
  if(!accepted.length)return {kind:"none",...meta};
  if(accepted.length===1)return {
    kind:"unique",solution:formatExact(accepted[0]),solutionRatio:accepted[0],...meta
  };
  return {...raw,...meta};
}
function rootSide(text){
  const source=text.trim();
  if(!source.startsWith("√(")||!source.endsWith(")"))return null;
  const expression=source.slice(2,-1);
  if(!expression||expression.includes("√"))throw Error("racine imbriquée non vérifiée");
  return parsePolynomial(expression);
}
function radicalEquation(left,right){
  const a=rootSide(left),b=rootSide(right);
  if((a===null&&b===null)||(a!==null&&b!==null)){
    if(left.includes("√")||right.includes("√"))
      throw Error("isole une seule racine carrée dans un membre de l'égalité");
    return null;
  }
  const radicand=a??b,other=a===null?left:right;
  if(other.includes("√"))throw Error("une seule racine carrée par équation");
  const target=parsePolynomial(other);
  if(degree(target)>1)throw Error("membre sans racine de degré supérieur à un : non vérifié");
  const squared=difference(radicand,multiply(target,target));
  const raw=classifyPolynomialDifference(squared);
  const conditions="Conditions : radicande ≥ 0 et membre sans racine ≥ 0 ; "
    +"solutions candidates contrôlées par substitution exacte.";
  if(raw.kind==="all")throw Error("racine définissant un intervalle : résolution symbolique non vérifiée");
  if(raw.kind==="two"&&!raw.solutions)
    throw Error("candidats irrationnels après mise au carré : substitution exacte non vérifiée");
  const valid=x=>{
    const y=valueAt(target,x);
    return y.n>=0n&&valueAt(radicand,x).n>=0n
      &&equal(valueAt(radicand,x),times(y,y));
  };
  return filteredResult(raw,valid,{radicalEquation:true,domainInfo:conditions});
}
/**
 * Renvoie null quand la ligne relève des solveurs habituels.
 * Sinon retourne un ensemble de solutions vérifié, ou refuse
 * explicitement le cas non encore couvert.
 */
export function classifyConstrainedEquality(text){
  if(typeof text!=="string"||text.length>MAX_SIDE*2)
    throw Error("ligne trop longue");
  const parts=text.split("=");
  if(parts.length!==2||parts.some(x=>!x.trim()))
    throw Error("une seule égalité complète est nécessaire");
  const [left,right]=parts.map(s=>s.trim());
  if(left.includes("√")||right.includes("√"))
    return radicalEquation(left,right);
  if(!left.includes("/")&&!right.includes("/"))return null;
  return rationalEquation(left,right);
}
