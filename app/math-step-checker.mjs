/**
 * Contrôle exact des calculs, équations affines et équations quadratiques en x.
 * Aucune exécution de texte utilisateur ni appels externes : arithmétique
 * rationnelle exacte (BigInt), sans heuristique flottante pour les réponses.
 *
 * Périmètre volontairement limité : les expressions non affines ou ambiguës
 * sont signalées comme non vérifiées et JAMAIS validées par approximation.
 */
import {classifyPolynomialEquality,sameRealSolutions} from "./quadratic-checker.mjs";
import {classifyConstrainedEquality} from "./constraint-solver.mjs";
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
function normalizeExactRoots(expression){
  if(!expression.includes("√"))return expression;
  const result=expression.replace(/√\((\d{1,6})\)/g,(raw,digits)=>{
    const square=Number(digits),root=Math.sqrt(square);
    return Number.isInteger(root)?"("+root+")":raw;
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
    if(!input.includes("=")){previous=null;definition=null;continue;}
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
          entries.push({line,kind:"error",message:"Dérivée incorrecte : "+review.actual+". Résultat attendu : "+review.expected+". "+review.rule+" "+review.detail+" Vérifie les exposants, les signes et la dérivée des constantes."});
        }
      }
      continue;
    }
    definition=null;
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
        errors++;entries.push({line,kind:"error",message:"Égalité numérique fausse : le membre gauche vaut "+result.left+", le membre droit "+result.right+"."});
      }else if(earlier?.kind==="unique"){
        entries.push({line,kind:"info",message:"Égalité numérique correcte, mais elle ne prouve pas à elle seule l'équivalence avec la ligne "+fromLine+" ("+description(earlier)+"). Une vérification par substitution se rédige à part."});
      }else if(earlier){
        errors++;entries.push({line,kind:"error",message:"L'égalité numérique n'est pas équivalente à la ligne "+fromLine+" : "+description(earlier)+"."});
      }else{
        entries.push({line,kind:"ok",message:"Calcul correct : "+result.left+" = "+result.right+"."});
      }
      continue;
    }
    if(!previous){
      entries.push({line,kind:"info",message:result.rationalEquation
        ?"Équation rationnelle : "+description(result)+". Les valeurs interdites sont conservées lors de chaque comparaison."
        :result.radicalEquation
          ?"Équation avec racine carrée : "+description(result)+". Après mise au carré, chaque solution candidate a été contrôlée dans l'égalité initiale."
          :result.quadratic
            ?"Équation du second degré reconnue (Δ = "+result.discriminant+"). Les lignes suivantes seront comparées selon leur ensemble de solutions réelles."
            :"Équation du premier degré reconnue. Les transformations suivantes seront comparées à cette ligne."});
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
      entries.push({line,kind:"error",message:"Étape non équivalente à la ligne "+previousLine+" : précédemment "+description(previous)+", maintenant "+description(result)+". Vérifie les signes et les opérations appliquées aux deux membres."+method});
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
