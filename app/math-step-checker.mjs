/**
 * Contrôle pédagogique strict des calculs numériques et équations affines en x.
 * Aucune exécution de texte utilisateur ni appels externes : arithmétique
 * rationnelle exacte (BigInt), sans heuristique flottante pour les réponses.
 *
 * Périmètre volontairement limité : les expressions non affines ou ambiguës
 * sont signalées comme non vérifiées et JAMAIS validées par approximation.
 */
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
export function classifyEquality(text){
  if(typeof text!=="string"||text.length>2*MAX_LINE)throw new Error("ligne trop longue");
  const parts=text.split("=");
  if(parts.length!==2||parts.some(x=>!x.trim()))
    throw new Error("utilise une seule égalité par ligne");
  const left=parseAffine(parts[0]),right=parseAffine(parts[1]);
  if(!/[xX]/.test(parts[0]+parts[1])){
    return {kind:"calculation",correct:eq(left.b,right.b),
      left:formatRational(left.b),right:formatRational(right.b)};
  }
  const coeff=sub(left.a,right.a),target=sub(right.b,left.b);
  if(coeff.n===0n)return {kind:target.n===0n?"all":"none"};
  return {kind:"unique",solution:formatRational(div(target,coeff)),
    solutionRatio:div(target,coeff),coefficient:formatRational(coeff),target:formatRational(target)};
}
const description=result=>result.kind==="unique"?"x = "+result.solution:
  result.kind==="all"?"tous les nombres réels":
  result.kind==="none"?"aucune solution":"un calcul numérique";
function sameSolution(a,b){
  return a.kind===b.kind&&
    (a.kind!=="unique"||eq(a.solutionRatio,b.solutionRatio));
}
/**
 * Les lignes non mathématiques séparent les chaînes (plusieurs exercices).
 * Les lignes contenant un = inconnu ne servent JAMAIS à confirmer une étape.
 */
export function checkMathSteps(text){
  const lines=String(text??"").split(/\r?\n/);
  if(lines.length>MAX_LINES)
    return {entries:[{line:0,kind:"unsupported",message:"Vérifie au maximum 40 lignes à la fois ; sépare ton travail en plusieurs séances."}],checked:0,errors:0,unsupported:1};
  const entries=[];let previous=null,previousLine=0,checked=0,errors=0,unsupported=0;
  for(let i=0;i<lines.length;i++){
    const input=lines[i].trim(),line=i+1;
    if(!input){previous=null;continue;}
    if(!input.includes("=")){previous=null;continue;}
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
      entries.push({line,kind:"info",message:"Équation du premier degré reconnue. Les transformations suivantes seront comparées à cette ligne."});
    }else if(sameSolution(previous,result)){
      entries.push({line,kind:"ok",message:"Étape équivalente à la ligne "+previousLine+" : même ensemble de solutions ("+description(result)+")."});
    }else{
      errors++;
      const method=previous.kind==="unique"
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
