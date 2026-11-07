/**
 * Exercices paramétriques originaux. Chaque générateur crée un nouvel énoncé,
 * la réponse exacte, une explication dépendant des valeurs et les données
 * permettant aux tests de contrôler le résultat par une formule indépendante.
 * Aucune évaluation de texte ou expression saisie par l'utilisateur.
 */
function rng(seed) {
  let s=seed>>>0;
  return ()=>{s=(s+0x6D2B79F5)>>>0;let z=s;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return ((z^(z>>>14))>>>0)/4294967296;};
}
const pick=(r,lo,hi)=>lo+Math.floor(r()*(hi-lo+1));
const fmt=n=>Number.isInteger(n)?String(n):String(Number(n.toFixed(8))).replace(".",",");
const v=(id,topic,jalons,make)=>({id,topic,jalons,type:"variant",make});
function num(prompt,answer,hint,explanation,meta){
  return {type:"number",prompt,answer,hint,explanation,meta};
}
export const VARIANTS=[
  v("v01","nombres",[1],r=>{
    const a=pick(r,2,14),b=pick(r,2,9),c=pick(r,2,7);
    return num("Calculer "+a+" + "+b+" × "+c+".",a+b*c,"Commence par la multiplication.",b+" × "+c+" = "+b*c+" ; puis "+a+" + "+b*c+" = "+(a+b*c)+".",{a,b,c,kind:"priority"});
  }),
  v("v02","nombres",[2],r=>{
    const d=pick(r,3,12),a=pick(r,1,d-1),b=pick(r,1,d-1);
    return num("Calculer "+a+"/"+d+" + "+b+"/"+d+" (nombre ou fraction).",(a+b)/d,"Les dénominateurs sont identiques.",a+"/"+d+" + "+b+"/"+d+" = "+(a+b)+"/"+d+" = "+fmt((a+b)/d)+".",{a,b,d,kind:"fractions"});
  }),
  v("v03","nombres",[3],r=>{
    const base=pick(r,2,5),a=pick(r,2,5),b=pick(r,1,4);
    return num("Calculer "+base+"^"+a+" ÷ "+base+"^"+b+".",base**(a-b),"Même base : soustrais les exposants.",base+"^("+a+"−"+b+") = "+base+"^"+(a-b)+" = "+fmt(base**(a-b))+".",{base,a,b,kind:"powers"});
  }),
  v("v04","nombres",[2,3],r=>{
    const base=pick(r,2,9),mult=pick(r,2,7);
    return num("Simplifier √("+base*base*mult*mult+") (valeur positive).",base*mult,"Reconnais le carré d'un produit positif.","√("+base*base*mult*mult+") = √("+base*mult+"²) = "+base*mult+".",{base,mult,kind:"sqrt"});
  }),
  v("v05","litteral",[4],r=>{
    const a=pick(r,1,6),b=pick(r,-6,6),c=pick(r,-3,4),x=pick(r,-4,4);
    return num("Si A(x) = "+a+"x² "+(b>=0?"+ ":"− ")+Math.abs(b)+"x "+(c>=0?"+ ":"− ")+Math.abs(c)+", calculer A("+x+").",a*x*x+b*x+c,"Remplace x par la valeur entre parenthèses, puis calcule.",a+"×("+x+")² + ("+b+")×("+x+") + ("+c+") = "+(a*x*x+b*x+c)+".",{a,b,c,x,kind:"evaluate"});
  }),
  v("v06","litteral",[4],r=>{
    const a=pick(r,1,9),b=pick(r,1,8);
    return num("Dans (x+"+a+")(x+"+b+"), quel est le coefficient de x après développement ?",a+b,"Distribue les deux facteurs.","(x+"+a+")(x+"+b+")=x²+"+(a+b)+"x+"+a*b+". Le coefficient de x vaut "+(a+b)+".",{a,b,kind:"expand"});
  }),
  v("v07","equations",[5],r=>{
    const a=pick(r,2,10),b=pick(r,-10,12),x=pick(r,-8,8),c=a*x+b;
    return num("Résoudre "+a+"x "+(b>=0?"+ ":"− ")+Math.abs(b)+" = "+c+". Quelle est la valeur de x ?",x,"Isole ax puis divise par a.",a+"x = "+(c-b)+" ; donc x = ("+(c-b)+")/"+a+" = "+x+".",{a,b,c,x,kind:"linear"});
  }),
  v("v08","equations",[6],r=>{
    const x=pick(r,-7,8),y=pick(r,-7,8),a=x+y,b=2*x-y;
    return num("Système : x+y="+a+" ; 2x−y="+b+". Quelle est la valeur de x ?",x,"Additionne les deux équations.","(x+y)+(2x−y)="+(a+b)+" ; 3x="+(a+b)+" ; x="+x+".",{x,y,a,b,kind:"system"});
  }),
  v("v09","equations",[8],r=>{
    const a=pick(r,2,8),k=pick(r,-8,8),b=pick(r,-7,7),c=a*k+b;
    return num("Résoudre "+a+"x "+(b>=0?"+ ":"− ")+Math.abs(b)+" ≤ "+c+". Quelle est la plus grande valeur entière de x autorisée ?",k,"Comme a est positif, le signe ≤ ne change pas.",a+"x ≤ "+(c-b)+" ; x ≤ "+k+". Donc la plus grande solution entière est "+k+".",{a,b,c,k,kind:"inequality"});
  }),
  v("v10","second",[7],r=>{
    const p=pick(r,-6,6),q=pick(r,-6,6),a=pick(r,1,4);
    const b=-a*(p+q),c=a*p*q;
    return num("Calculer le discriminant Δ de "+a+"x² "+(b>=0?"+ ":"− ")+Math.abs(b)+"x "+(c>=0?"+ ":"− ")+Math.abs(c)+".",b*b-4*a*c,"Δ=b²−4ac.","Δ=("+b+")²−4×"+a+"×("+c+") = "+(b*b-4*a*c)+".",{a,b,c,p,q,kind:"discriminant"});
  }),
  v("v11","second",[7],r=>{
    const a=pick(r,1,4),center=pick(r,-6,6),shift=pick(r,-10,10);
    return num("f(x)="+a+"(x−("+center+"))² "+(shift>=0?"+ ":"− ")+Math.abs(shift)+". Quelle est sa valeur minimale ?",shift,"Le carré est ≥ 0 et le coefficient devant est positif.","Minimum atteint en x="+center+", lorsque (x−("+center+"))²=0 ; f(min)="+shift+".",{a,center,shift,kind:"minimum"});
  }),
  v("v12","statistiques",[9],r=>{
    const a=pick(r,2,10),b=pick(r,2,10),c=pick(r,2,10),d=pick(r,2,10);
    return num("Moyenne des valeurs "+a+", "+b+", "+c+", "+d+" ?", (a+b+c+d)/4,"Additionne les 4 valeurs puis divise par 4.","Somme = "+(a+b+c+d)+" ; moyenne = "+(a+b+c+d)+"/4 = "+fmt((a+b+c+d)/4)+".",{a,b,c,d,kind:"mean"});
  }),
  v("v13","statistiques",[9],r=>{
    const a=pick(r,1,9),b=pick(r,1,9),c=pick(r,1,9);
    return num("Notes : "+a+" (coef. 1), "+b+" (coef. 2), "+c+" (coef. 3). Quelle est la moyenne pondérée ?", (a+2*b+3*c)/6,"Pondère chaque note avant de diviser par la somme des coefficients.","("+a+"+2×"+b+"+3×"+c+")/6 = "+fmt((a+2*b+3*c)/6)+".",{a,b,c,kind:"weighted"});
  }),
  v("v14","fonctions",[10],r=>{
    const a=pick(r,-6,6),b=pick(r,-9,9),x=pick(r,-5,5);
    return num("f(x)="+a+"x "+(b>=0?"+ ":"− ")+Math.abs(b)+". Calculer f("+x+").",a*x+b,"Remplace x par "+x+".",a+"×("+x+") + ("+b+") = "+(a*x+b)+".",{a,b,x,kind:"affine"});
  }),
  v("v15","fonctions",[10],r=>{
    const a=pick(r,1,8),x=pick(r,-6,6),image=x*x+a;
    return num("f(x)=x²+"+a+". Calculer f("+x+").",image,"Calcule le carré avant d'ajouter la constante.","("+x+")² + "+a+" = "+image+".",{a,x,kind:"quadratic_image"});
  }),
  v("v16","limites",[11],r=>{
    const a=pick(r,1,12),b=pick(r,1,12);
    return num("Limite de ("+a+"x²+1)/("+b+"x²+3) quand x tend vers +∞ ?",a/b,"Les deux polynômes ont le même degré.","On divise en haut et en bas par x² : la limite vaut "+a+"/"+b+" = "+fmt(a/b)+".",{a,b,kind:"rational_limit"});
  }),
  v("v17","derivation",[12],r=>{
    const a=pick(r,1,7),b=pick(r,-8,8),x=pick(r,-4,4);
    return num("f(x)="+a+"x² "+(b>=0?"+ ":"− ")+Math.abs(b)+"x. Quelle est la pente de la tangente en x="+x+" ?",2*a*x+b,"La pente est f′(x).","f′(x)="+2*a+"x + ("+b+") ; f′("+x+")="+(2*a*x+b)+".",{a,b,x,kind:"derivative"});
  }),
  v("v18","derivation",[12],r=>{
    const a=pick(r,2,8),x=pick(r,-3,3);
    return num("g(x)="+a+"x³. Calculer g′("+x+").",3*a*x*x,"Dérive x³ en 3x².","g′(x)="+3*a+"x² ; g′("+x+")="+(3*a*x*x)+".",{a,x,kind:"cubic_derivative"});
  }),
  v("v19","limites",[13],r=>{
    const a=pick(r,-12,12),b=pick(r,1,9);
    return num("Quelle est l'abscisse de l'asymptote verticale de f(x) = 1/("+b+"x − ("+a+")) ?",a/b,"Le dénominateur s'annule sur l'asymptote.","On résout "+b+"x−("+a+")=0, donc x="+fmt(a/b)+". La fonction tend vers l'infini au voisinage.",{a,b,kind:"vertical_asymptote"});
  }),
  v("v20","continuite",[14],r=>{
    const a=pick(r,1,10),b=pick(r,1,10),power=pick(r,1,5);
    return num("f(x)=x³−"+(power**3)+". Calculer f("+power+") pour vérifier la racine candidate.",0,"Substitue la valeur de l'argument.","f("+power+")="+(power**3)+"−"+(power**3)+"=0. La continuité et la stricte croissance de x³ assurent l'unicité de cette racine.",{a,b,power,kind:"tvi_root"});
  }),
  v("v21","continuite",[14],r=>{
    const n=pick(r,2,8),start=pick(r,1,10);
    return num("Une dichotomie commence avec un intervalle de largeur "+start+". Après "+n+" étapes, quelle est la largeur ?",start/2**n,"On divise la largeur par 2 à chaque étape.","Nouvelle largeur = "+start+"/2^"+n+" = "+fmt(start/2**n)+".",{n,start,kind:"bisection"});
  }),
  v("v22","suites",[15],r=>{
    const start=pick(r,-8,12),rate=pick(r,-5,8),index=pick(r,4,12);
    return num("Suite arithmétique u₀="+start+" et raison "+rate+". Calculer u"+index+".",start+index*rate,"uₙ = u₀ + n×r.","u"+index+"="+start+"+"+index+"×("+rate+")="+(start+index*rate)+".",{start,rate,index,kind:"arithmetic"});
  }),
  v("v23","suites",[15],r=>{
    const start=pick(r,1,9),rate=pick(r,2,4),index=pick(r,2,5);
    return num("Suite géométrique v₀="+start+" et raison "+rate+". Calculer v"+index+".",start*rate**index,"vₙ = v₀×qⁿ.","v"+index+"="+start+"×"+rate+"^"+index+" = "+(start*rate**index)+".",{start,rate,index,kind:"geometric"});
  }),
  v("v24","explog",[16],r=>{
    const shift=pick(r,-6,6),target=pick(r,2,15);
    return num("Résoudre ln(x−("+shift+"))=ln("+target+"). Donner x.",target+shift,"ln est injective sur les nombres strictement positifs.","x−("+shift+")="+target+" ; donc x="+(target+shift)+". Domaine : x>"+shift+" ; réponse autorisée.",{shift,target,kind:"log_equation"});
  }),
  v("v25","explog",[17],r=>{
    const mult=pick(r,2,8),target=pick(r,-6,8);
    return num("Résoudre exp("+mult+"x)=exp("+(mult*target)+"). Donner x.",target,"Les deux exposants sont égaux.","Par injectivité de exp : "+mult+"x="+(mult*target)+", donc x="+target+".",{mult,target,kind:"exp_equation"});
  }),
  v("v26","integrales",[18],r=>{
    const a=pick(r,1,8),b=pick(r,-6,6),x=pick(r,1,6);
    return num("Calculer ∫ de 0 à "+x+" de ("+a+"t "+(b>=0?"+ ":"− ")+Math.abs(b)+") dt.",a*x*x/2+b*x,"Primitive : ("+a+"/2)t² + ("+b+")t.","[("+a+"/2)t² + ("+b+")t]₀^"+x+" = "+fmt(a*x*x/2+b*x)+".",{a,b,x,kind:"linear_integral"});
  }),
  v("v27","integrales",[18],r=>{
    const a=pick(r,1,7),end=pick(r,1,5);
    return num("Calculer ∫ de 0 à "+end+" de "+(3*a)+"t² dt.",a*end**3,"Une primitive de 3at² est at³.","["+a+"t³]₀^"+end+" = "+a+"×"+end+"³ = "+(a*end**3)+".",{a,end,kind:"polynomial_integral"});
  }),
  v("v28","probas",[19],r=>{
    const red=pick(r,1,9),blue=pick(r,1,9);
    return num("Urne avec "+red+" boules rouges et "+blue+" bleues. P(rouge) en un tirage ?",red/(red+blue),"Issues favorables / issues possibles.","P(rouge)="+red+"/(" +red+"+"+blue+")="+fmt(red/(red+blue))+".",{red,blue,kind:"urn"});
  }),
  v("v29","probas",[20],r=>{
    const n=pick(r,2,12),p=pick(r,1,9)/10;
    return num("X suit une loi binomiale B("+n+" ; "+fmt(p)+"). Quelle est son espérance ?",n*p,"E(X)=n×p.","E(X)="+n+"×"+fmt(p)+"="+fmt(n*p)+".",{n,p,kind:"binomial_mean"});
  }),
  v("v30","probas",[19,20],r=>{
    const n=pick(r,2,6),p=pick(r,1,8)/10;
    return num("Dans "+n+" essais indépendants de probabilité de succès "+fmt(p)+", quelle est P(au moins un succès) ?",1-(1-p)**n,"Calcule 1−P(aucun succès).","P(X≥1)=1−(1−"+fmt(p)+")^"+n+" = "+fmt(1-(1-p)**n)+".",{n,p,kind:"at_least_one"});
  }),
  v("v31","probas",[19],r=>{
    const total=pick(r,5,20),favorable=pick(r,1,total-1),conditional=pick(r,1,9)/10;
    return num("P(B)="+fmt(favorable/total)+" et P(A|B)="+fmt(conditional)+". Calculer P(A∩B).",(favorable/total)*conditional,"P(A∩B) = P(B)×P(A|B).","P(A∩B)=("+favorable+"/"+total+")×"+fmt(conditional)+" = "+fmt((favorable/total)*conditional)+".",{total,favorable,conditional,kind:"conditional"});
  }),
  v("v32","nombres",[1],r=>{
    const price=pick(r,3,14)*10,percent=pick(r,1,7)*5;
    return num("Un objet vaut "+price+" €. On applique une remise de "+percent+" %. Quel est le nouveau prix ?",price*(100-percent)/100,"Multiplie par 1−(pourcentage/100).",price+"×(1−"+percent+"/100) = "+fmt(price*(100-percent)/100)+" €.",{price,percent,kind:"discount"});
  })
];

export function injectVariants(topics) {
  return topics.map(topic=>({
    ...topic,
    questions:[...topic.questions,...VARIANTS.filter(t=>t.topic===topic.slug)]
  }));
}
export function materializeVariant(template,{random=Math.random,previousPrompt=""}={}) {
  if(template.type!=="variant"||typeof template.make!=="function") throw new Error("Générateur absent");
  let exercise, seed;
  for(let attempt=0;attempt<30;attempt++){
    seed=Math.floor(random()*4294967296)>>>0;
    exercise=template.make(rng(seed));
    if(exercise.prompt!==previousPrompt) break;
  }
  if(exercise.prompt===previousPrompt) throw new Error("Variation distincte introuvable");
  if(!exercise.prompt||!Number.isFinite(exercise.answer)||!exercise.explanation||!exercise.hint) throw new Error("Exercice invalide "+template.id);
  return {...template,...exercise,id:template.id,topic:template.topic,topicTitle:template.topicTitle,lesson:template.lesson,seed,isVariant:true};
}
export function validateVariants(topics,iterations=30) {
  const errors=[],ids=new Set(),covered=new Set();
  const knownTopics=new Set(topics.map(x=>x.slug));
  const existingIds=new Set(topics.flatMap(x=>x.questions.map(q=>q.id)));
  for(const t of VARIANTS){
    if(ids.has(t.id)||existingIds.has(t.id)) errors.push("ID dupliqué "+t.id);
    ids.add(t.id);
    if(!knownTopics.has(t.topic)) errors.push("Domaine manquant "+t.topic);
    for(const j of t.jalons) covered.add(j);
    for(let seed=0;seed<iterations;seed++) {
      try{
        const q={...t,...t.make(rng(seed))};
        if(q.type!=="number"||!q.prompt||!Number.isFinite(q.answer)||!q.explanation||!q.hint||!q.meta) {
          errors.push("Question invalide "+t.id+" seed "+seed);break;
        }
      }catch(err){errors.push("Erreur "+t.id+" seed "+seed+": "+String(err));break;}
    }
  }
  for(let j=1;j<=20;j++)if(!covered.has(j))errors.push("Jalon sans variante "+j);
  return errors;
}
