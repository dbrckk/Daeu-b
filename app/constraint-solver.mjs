/**
 * Équations rationnelles et équations à une racine isolée, en arithmétique
 * rationnelle exacte. Aucun flottant, eval, approximation de racines ou accès
 * réseau. Les cas hors domaine retournent une erreur explicite.
 *
 * Périmètre :
 * - (polynôme degré <= 2)/(dénominateur affine) = expression polynomiale
 *   ou un second quotient à dénominateur affine ; produit croisé <= degré 2 ;
 * - une racine √(polynôme degré <= 2), de coefficient numérique rationnel
 *   non nul ou accompagnée de termes affines, sur un seul membre ;
 * - candidats rationnels substitués exactement ; candidats quadratiques
 *   irrationnels vérifiés par comparaison algébrique exacte des signes,
 *   sans approximation ni évaluation de racines sur des flottants.
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
/** Mise en forme lisible, conservant les fractions exactes du calcul. */
function formatPolynomial(poly){
  const pieces=[];
  for(let i=2;i>=0;i--){
    const coefficient=poly[i];
    if(coefficient.n===0n)continue;
    const value=rat(abs(coefficient.n),coefficient.d);
    const literal=formatExact(value);
    const variable=i===2?"x²":i===1?"x":"";
    const factor=i===0?literal
      :literal==="1"?variable
      :literal.includes("/")?"("+literal+")·"+variable
      :literal+variable;
    pieces.push({sign:signOf(coefficient),value:factor});
  }
  if(!pieces.length)return "0";
  return pieces.map((part,i)=>{
    if(i===0)return (part.sign<0?"-":"")+part.value;
    return (part.sign<0?" - ":" + ")+part.value;
  }).join("");
}

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
    const numeratorText=source.slice(0,slash).trim();
    const denominatorText=source.slice(slash+1).trim();
    // Une somme hors parenthèses avant "/" n'est pas le numérateur :
    // x+1/(x-1) signifie x + (1/(x-1)), et non (x+1)/(x-1).
    let numeratorDepth=0;
    for(let i=0;i<numeratorText.length;i++){
      const ch=numeratorText[i];
      if(ch==="(")numeratorDepth++;
      else if(ch===")")numeratorDepth--;
      if(numeratorDepth===0&&i>0&&(ch==="+"||ch==="-"))
        throw Error("entoure tout numérateur contenant une addition ou soustraction de parenthèses");
    }
    // Un dénominateur variable doit être un atome x ou une expression
    // entièrement parenthésée. Ainsi 1/(x-1)+1 ne devient JAMAIS 1/x.
    // La lecture de la fraction empilée écrit déjà les parenthèses.
    if(!/^[xX]$/.test(denominatorText)){
      if(!denominatorText.startsWith("(")||!denominatorText.endsWith(")"))
        throw Error("entoure tout dénominateur algébrique de parenthèses");
      let depth=0;
      for(let i=0;i<denominatorText.length;i++){
        if(denominatorText[i]==="(")depth++;
        else if(denominatorText[i]===")")depth--;
        if(depth<0||depth===0&&i<denominatorText.length-1)
          throw Error("opération située après le dénominateur : fraction non vérifiée");
      }
      if(depth!==0)throw Error("parenthèses du dénominateur non fermées");
    }
    const numerator=parsePolynomial(numeratorText);
    const denominator=parsePolynomial(denominatorText);
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
/**
 * Le discriminant est strictement positif et sa racine est irrationnelle.
 * Pour x = (-B ± √(B²-4C))/2, on compare m·x+n à zéro sans jamais
 * convertir √D en Number. Un signe faux ferait accepter une racine parasite.
 */
function signOf(value){return value.n===0n?0:value.n>0n?1:-1;}
function signOfQuadraticSurd(a,b,radicand){
  const sa=signOf(a),sb=signOf(b);
  if(sb===0)return sa;
  if(sa===0||sa===sb)return sb;
  const lhs=times(a,a),rhs=times(times(b,b),radicand);
  const magnitude=compare(lhs,rhs);
  if(magnitude===0)throw Error("racine supposée irrationnelle devenue rationnelle");
  return magnitude>0?sa:sb;
}
function irrationalCandidates(raw){
  if(raw.kind!=="two"||raw.solutions!==null)
    throw Error("racines quadratiques non irrationnelles");
  const B=raw.normalizedB,C=raw.normalizedC;
  const D=minus(times(B,B),times(rat(4n),C));
  if(D.n<=0n)throw Error("discriminant non positif");
  const center=over(neg(B),rat(2n));
  const spreadSquared=over(D,rat(4n));
  const digits=formatExact(spreadSquared);
  const bText=formatExact(neg(B));
  const dText=formatExact(D);
  // Forme exacte standard sans simplification algébrique risquée :
  // B=0 donne x=±√(D/4), sinon x=(-B±√D)/2.
  const label=branch=>bText==="0"
    ?(branch==="lower"?"-":"")+"√("+digits+")"
    :"("+bText+(branch==="lower"?"-":"+")+"√("+dText+"))/2";
  return ["lower","upper"].map(branch=>({
    branch,normalizedB:B,normalizedC:C,discriminant:D,
    label:label(branch),center,radicand:D
  }));
}
/** Signe exact d'un polynôme affine à une racine quadratique irrationnelle. */
function signAffineAtIrrational(poly,candidate){
  if(degree(poly)>1)throw Error("contrôle de signe de degré supérieur à un");
  const constant=plus(poly[0],times(poly[1],candidate.center));
  const radical=over(poly[1],rat(candidate.branch==="lower"?-2n:2n));
  return signOfQuadraticSurd(constant,radical,candidate.radicand);
}
function irrationalFilteredResult(raw,target,metadata={}){
  const roots=irrationalCandidates(raw);
  // Pour une racine carrée, l'équation auxiliaire garantit R(x)=T(x)².
  // Dans l'équation initiale √R(x)=T(x), le seul autre contrôle est T(x)>=0.
  const kept=roots.filter(candidate=>signAffineAtIrrational(target,candidate)>=0);
  const discarded=roots.filter(candidate=>!kept.includes(candidate));
  const details={...metadata,rejectedCandidates:discarded.map(x=>x.label),
    irrationalExact:true};
  if(!kept.length)return {kind:"none",...details};
  if(kept.length===2)return {...raw,...details};
  const candidate=kept[0];
  return {kind:"unique",solution:candidate.label,
    algebraic:{normalizedB:candidate.normalizedB,normalizedC:candidate.normalizedC,
      branch:candidate.branch},
    ...details};
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
  const steps=[
    "1. Domaine de définition : "+banned.map(x=>"x ≠ "+x).join(" et ")+".",
    "2. Sur ce domaine seulement, le produit en croix donne "
      +formatPolynomial(multiply(a.numerator,b.denominator))+" = "
      +formatPolynomial(multiply(b.numerator,a.denominator))+".",
    "3. Résoudre cette égalité puis supprimer les valeurs interdites du résultat."
  ];
  if(raw.kind==="all")return {kind:"allExcept",excluded:banned,
    domainExclusions,domainInfo,rationalEquation:true,
    methodSteps:steps,rejectedCandidates:[]};
  if(raw.kind==="none")return {...raw,domainExclusions,domainInfo,rationalEquation:true,
    methodSteps:steps,rejectedCandidates:[]};
  // Une racine irrationnelle ne peut pas être égale à une valeur interdite
  // rationnelle pour un dénominateur affine ; on peut donc la conserver.
  if(raw.kind==="two"&&!raw.solutions)return {...raw,domainExclusions,
    domainInfo,rationalEquation:true,methodSteps:steps,rejectedCandidates:[]};
  const originals=candidates(raw),accepted=originals.filter(x=>
    !exclusions.some(excluded=>equal(excluded,x)));
  const rejectedCandidates=originals.filter(x=>
    exclusions.some(excluded=>equal(excluded,x))).map(formatExact);
  const meta={domainExclusions,domainInfo,rationalEquation:true,
    methodSteps:steps,rejectedCandidates};
  if(!accepted.length)return {kind:"none",...meta};
  if(accepted.length===1)return {
    kind:"unique",solution:formatExact(accepted[0]),solutionRatio:accepted[0],...meta
  };
  return {...raw,...meta};
}
/**
 * Extrait une seule racine carrée, éventuellement accompagnée de termes
 * affines additifs et d'un coefficient constant non nul.
 * Seules les multiplications ou divisions par un ENTIER littéral de 1 à
 * 3 chiffres sont prises en charge ; jamais x√(...), √(...)/x ni √(...)².
 * Pour x-2√(x)+2, on renvoie (hors racine = x+2, facteur = -2).
 */
const ROOT_SCALAR=/((?:[1-9][0-9]{0,2}|[0-9]{1,3}[.,][0-9]{1,3}))\\*?$/;
const ROOT_TRAILING_SCALAR=/^([*/])((?:[1-9][0-9]{0,2}|[0-9]{1,3}[.,][0-9]{1,3}))(?=$|[+-])/;
function exactRootScalar(source){
  const normalized=source.replace(",",".");
  const [integer,fraction]=normalized.split(".");
  if(fraction===undefined)return rat(BigInt(integer));
  const denominator=10n**BigInt(fraction.length);
  return rat(BigInt(integer)*denominator+BigInt(fraction),denominator);
}
function rootSide(text){
  const source=text.replace(/\s/g,"").replace(/[−–]/g,"-");
  if(!source.includes("√"))return null;
  const start=source.indexOf("√(");
  if(start<0||source.indexOf("√",start+1)!==-1)
    throw Error("une seule racine carrée √(...) est prise en charge");
  let depth=0,end=-1;
  for(let i=start+1;i<source.length;i++){
    if(source[i]==="(")depth++;
    else if(source[i]===")"){
      if(--depth<0)throw Error("parenthèses du radical déséquilibrées");
      if(depth===0){end=i;break;}
    }
  }
  if(end<0)throw Error("radicande sans parenthèse fermante");
  const expression=source.slice(start+2,end);
  if(!expression||expression.includes("√"))
    throw Error("racine vide ou imbriquée non vérifiée");
  const radicand=parsePolynomial(expression);
  const before=source.slice(0,start),after=source.slice(end+1);
  let factor=one,extraPrefix="";
  if(before){
    // k√(...), k*√(...), x+k√(...) et x-k*√(...) uniquement.
    const scalar=before.match(ROOT_SCALAR);
    if(scalar){
      const remainder=before.slice(0,-scalar[0].length);
      if(remainder && !/[+-]$/.test(remainder))
        throw Error("une multiplication dépendant de x n'est pas vérifiée");
      factor=times(exactRootScalar(scalar[1]),remainder.endsWith("-")?neg(one):one);
      extraPrefix=remainder?remainder.slice(0,-1):"";
    }else if(/[+-]$/.test(before)){
      factor=before.endsWith("-")?neg(one):one;
      extraPrefix=before.slice(0,-1);
    }else{
      throw Error("facteur devant la racine non pris en charge");
    }
  }
  let additiveSuffix=after;
  if(after.startsWith("*")||after.startsWith("/")){
    // √(...)*k et √(...)/k sont valides seulement pour k entier non nul,
    // sans autre multiplication, exponentiation ou dénominateur en x.
    const scalar=after.match(ROOT_TRAILING_SCALAR);
    if(!scalar)throw Error("multiplication ou division après la racine non prise en charge");
    const k=exactRootScalar(scalar[2]);
    if(k.n===0n)throw Error("facteur ou diviseur nul : racine non isolable");
    factor=scalar[1]==="*"?times(factor,k):over(factor,k);
    additiveSuffix=after.slice(scalar[0].length);
  }
  if(additiveSuffix&&!/^[+-]/.test(additiveSuffix))
    throw Error("seules les additions et soustractions après la racine sont prises en charge");
  const additive=extraPrefix+additiveSuffix;
  const outside=additive?parsePolynomial(additive):constant(zero);
  if(degree(outside)>1)
    throw Error("termes accompagnant la racine de degré supérieur à un : non vérifié");
  return {radicand,outside,factor,
    isolationRequired:!equal(factor,one)||!isZero(outside)};
}
/**
 * Résultat final négatif exact : x=-√(n), avec n entier naturel non
 * carré parfait. C'est la racine inférieure de x²-n=0 ; le code
 * d'équivalence utilise le même polynôme minimal que les autres équations.
 */
function signedIrrationalValue(left,right){
  const variableLeft=/^[xX]$/.test(left),variableRight=/^[xX]$/.test(right);
  if(variableLeft===variableRight)return null;
  const literal=variableLeft?right:left;
  const match=literal.match(/^-\s*√\((\d{1,6})\)$/);
  if(!match)return null;
  const n=BigInt(match[1]);
  if(n===0n)throw Error("valeur entière : utilise x=0");
  let square=0n;
  while((square+1n)*(square+1n)<=n)square++;
  if(square*square===n)throw Error("racine carrée exacte : simplifie la valeur entière");
  return {kind:"unique",solution:"-√("+n+")",
    algebraic:{normalizedB:zero,normalizedC:rat(-n),branch:"lower"},
    radicalEquation:true,irrationalExact:true,
    domainInfo:"La valeur -√("+n+") est négative, mais son carré vaut exactement "+n+". "+
      "La comparaison des étapes utilise le polynôme minimal x²-"+n+"=0 et la branche négative."};
}
function radicalEquation(left,right){
  const a=rootSide(left),b=rootSide(right);
  if((a===null&&b===null)||(a!==null&&b!==null)){
    if(left.includes("√")||right.includes("√"))
      throw Error("isole une seule racine carrée dans un membre de l'égalité");
    return null;
  }
  const radical=a??b,other=a===null?left:right;
  if(other.includes("√"))throw Error("une seule racine carrée par équation");
  const otherForm=parsePolynomial(other);
  if(degree(otherForm)>1)
    throw Error("membre sans racine de degré supérieur à un : non vérifié");
  const radicand=radical.radicand;
  const shifted=difference(otherForm,radical.outside);
  const target=shifted.map(coefficient=>over(coefficient,radical.factor));
  if(degree(target)>1)throw Error("racine non isolable en polynôme affine");
  const squared=difference(radicand,multiply(target,target));
  const raw=classifyPolynomialDifference(squared);
  const conditions="Conditions : radicande ≥ 0 et membre sans racine ≥ 0 ; "
    +"solutions candidates contrôlées par substitution exacte.";
  const methodSteps=[
    radical.isolationRequired
      ?"1. Isoler la racine : "+formatExact(radical.factor)+"·√("
        +formatPolynomial(radicand)+") = "+formatPolynomial(shifted)
        +". Diviser par le facteur constant non nul, donc √("
        +formatPolynomial(radicand)+") = "+formatPolynomial(target)+"."
      :"1. La racine est déjà isolée : √("+formatPolynomial(radicand)
        +") = "+formatPolynomial(target)+".",
    "2. Domaine : "+formatPolynomial(radicand)+" ≥ 0 et "
      +formatPolynomial(target)+" ≥ 0.",
    "3. Sur ce domaine, mettre au carré : "+formatPolynomial(radicand)
      +" = ("+formatPolynomial(target)+")².",
    "4. Résoudre l'équation polynomiale, puis contrôler chaque solution candidate "
      +"dans l'égalité initiale. Écarter les solutions parasites."
  ];
  if(raw.kind==="all")throw Error("racine définissant un intervalle : résolution symbolique non vérifiée");
  if(raw.kind==="two"&&!raw.solutions)
    return irrationalFilteredResult(raw,target,{radicalEquation:true,methodSteps,
      domainInfo:"Conditions : radicande ≥ 0 et membre sans racine ≥ 0. "+
        "Les candidats irrationnels sont filtrés par comparaison algébrique exacte, sans arrondi."});
  const valid=x=>{
    const y=valueAt(target,x);
    return y.n>=0n&&valueAt(radicand,x).n>=0n
      &&equal(valueAt(radicand,x),times(y,y));
  };
  return filteredResult(raw,valid,{radicalEquation:true,domainInfo:conditions,methodSteps});
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
  if(left.includes("√")||right.includes("√")){
    const signed=signedIrrationalValue(left,right);
    return signed??radicalEquation(left,right);
  }
  if(!left.includes("/")&&!right.includes("/"))return null;
  return rationalEquation(left,right);
}
