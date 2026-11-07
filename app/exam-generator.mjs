/**
 * Examen C : chaque seed uint32 crée 4 problèmes complets cohérents et corrigés.
 * Déterministe : un sujet repris/importé reconstruit les mêmes données.
 * Aucun eval, appel réseau, service externe ou dépendance.
 */
export const GENERATED_EXAM_ID="blanc-c";
export const isSeed=seed=>Number.isInteger(seed)&&seed>=0&&seed<=0xFFFFFFFF;
function randomGenerator(seed){
  if(!isSeed(seed))throw new Error("Graine de sujet invalide");
  let x=(seed^0x9e3779b9)>>>0;
  return ()=>{
    x=(Math.imul(x,1664525)+1013904223)>>>0;
    return x/4294967296;
  };
}
const integer=(r,min,max)=>min+Math.floor(r()*(max-min+1));
const pick=(r,values)=>values[integer(r,0,values.length-1)];
const fmt=n=>Number.isInteger(n)?String(n):Number(n.toFixed(8)).toString().replace(".",",");
const N=(id,prompt,answer,points,solution,skill)=>({id,prompt,answer,points,solution,skill,type:"number"});
const C=(id,prompt,options,answer,points,solution,skill)=>({id,prompt,options,answer,points,solution,skill,type:"choice"});
const step=(id,prompt,model,lesson)=>({id,prompt,model,lesson});
const section=(id,title,context,questions,method,intro,steps)=>({id,title,context,questions,method,rubric:{intro,steps}});
export function createGeneratedExam(seed){
  const r=randomGenerator(seed);

  // Problème 1 : toutes les racines et le sommet sont admissibles dans [0;2h].
  const h=integer(r,5,10),a=integer(r,2,h-2);
  const low=h-a,high=h+a,gain=a*a;
  const inside=low+" < x < "+high;
  const first=section("c-optimisation","Optimiser une activité",
    "Une activité a pour résultat (en unités) B(x)=−(x−"+h+")²+"+gain+", pour 0 ≤ x ≤ "+2*h+". Justifier chaque réponse.",[
      N("c01","Calculer la dérivée B′(0).",2*h,1,"B′(x)=−2(x−"+h+"), donc B′(0)="+2*h+".","dérivation"),
      N("c02","À quelle valeur de x le résultat est-il maximal ?",h,1,"Le carré (x−"+h+")² est minimal en x="+h+". La parabole est concave : le résultat est maximal pour x="+h+".","optimisation"),
      N("c03","Calculer ce résultat maximal B("+h+").",gain,1,"B("+h+")=−0²+"+gain+"="+gain+".","second degré"),
      C("c04","Sur quel intervalle B(x) est-il strictement positif ?",[
        inside,"x < "+low+" ou x > "+high,low+" ≤ x ≤ "+high
      ],inside,2,"B(x)>0 ⇔ (x−"+h+")²<"+gain+" ⇔ |x−"+h+"|<"+a+" ⇔ "+inside+". Aux racines B=0, elles sont exclues.","second degré")
    ],"Domaine, dérivation et variations, maximum, résolution d'une inéquation stricte.",
    "Vérifie les étapes du tableau de variations et la résolution de l'inéquation avant de cocher.",[
      step("domain","Ai-je précisé le domaine et la nature de la fonction ?",
        "La fonction B est définie pour 0 ≤ x ≤ "+2*h+" et s'écrit −(x−"+h+")²+"+gain+". Il s'agit d'une parabole tournée vers le bas.","05-fonctions.md"),
      step("derivative","Ai-je dérivé et étudié les variations sur l'intervalle ?",
        "B′(x)=−2(x−"+h+") ; elle est positive si x<"+h+", nulle en "+h+", négative si x>"+h+". B augmente puis décroît.","06-derivation.md"),
      step("max","Ai-je justifié le maximum et donné sa valeur ?",
        "Le maximum est atteint à x="+h+" dans le domaine. Il vaut B("+h+")="+gain+". Il faut distinguer l'abscisse et la valeur du résultat.","04-second-degre.md"),
      step("sign","Ai-je exclu les racines de la zone strictement positive ?",
        "B>0 équivaut à (x−"+h+")²<"+gain+", donc "+inside+". Les bornes "+low+" et "+high+" sont interdites pour une inégalité stricte.","04-second-degre.md")
    ]);

  // Problème 2 : seuil strictement entre u_{k-1} et u_k, y compris après arrondi.
  const u0=50*integer(r,2,8),q=pick(r,[1.2,1.25,1.5]),k=integer(r,3,6);
  const un=n=>u0*q**n;
  const cutoff=Number(((un(k-1)+un(k))/2).toFixed(2));
  if(!(un(k-1)<cutoff&&cutoff<un(k)))throw new Error("Seuil mal construit");
  const ratio=Math.log(cutoff/u0)/Math.log(q);
  const second=section("c-suites","Prévoir un stock",
    "Un stock contient initialement "+u0+" unités et augmente de "+fmt((q-1)*100)+" % par période. On note u₀="+u0+" et uₙ₊₁="+fmt(q)+"uₙ. La période n est un entier naturel.",[
      N("c05","Quelle est la raison multiplicative q ?",q,1,"Multiplier par 1+"+fmt((q-1)*100)+"/100 donne q="+fmt(q)+".","suites"),
      N("c06","Calculer u₂.",un(2),1,"u₂="+u0+"×("+fmt(q)+")²="+fmt(un(2))+".","suites"),
      N("c07","Quel est le premier entier n tel que uₙ ≥ "+fmt(cutoff)+" ?",k,2,"uₙ="+u0+"×("+fmt(q)+")ⁿ. Comme q>1, n≥ln("+fmt(cutoff)+"/"+u0+")/ln("+fmt(q)+")≈"+fmt(ratio)+". Le plus petit entier est "+k+". On contrôle u"+(k-1)+"="+fmt(un(k-1))+" < "+fmt(cutoff)+" ≤ u"+k+"="+fmt(un(k))+".","logarithmes"),
      N("c08","Calculer la somme u₀+u₁+u₂.",un(0)+un(1)+un(2),1,
        "Par addition ou formule géométrique : "+fmt(un(0))+"+"+fmt(un(1))+"+"+fmt(un(2))+"="+fmt(un(0)+un(1)+un(2))+".","somme de suites")
    ],"Justifier la nature géométrique, le logarithme puis la vérification des deux rangs consécutifs.",
    "Une suite géométrique croissante exige la formule explicite et un seuil contrôlé aux rangs voisins.",[
      step("model","Ai-je expliqué le passage du pourcentage à la raison ?",
        "Une hausse de "+fmt((q-1)*100)+" % correspond au facteur "+fmt(q)+". On a u₀="+u0+" et uₙ="+u0+"×"+fmt(q)+"ⁿ.","10-suites.md"),
      step("term","Ai-je appliqué la formule explicite sans erreur d'indice ?",
        "La relation uₙ₊₁="+fmt(q)+"uₙ donne u₂="+u0+"×"+fmt(q)+"²="+fmt(un(2))+". Le rang zéro est le terme initial.","10-suites.md"),
      step("threshold","Ai-je justifié le seuil et vérifié les deux rangs voisins ?",
        "n≥ln("+fmt(cutoff)+"/"+u0+")/ln("+fmt(q)+")≈"+fmt(ratio)+". On prend le plafond : n="+k+". Vérification avec u"+(k-1)+"="+fmt(un(k-1))+" et u"+k+"="+fmt(un(k))+".","09-exponentielle-logarithme.md"),
      step("sum","Ai-je calculé la somme et conclu avec les bonnes unités ?",
        "u₀+u₁+u₂="+u0+"(1+"+fmt(q)+"+"+fmt(q*q)+")="+fmt(un(0)+un(1)+un(2))+". Ce total porte sur trois périodes.","10-suites.md")
    ]);

  // Problème 3 : tirages indépendants avec remise.
  const red=integer(r,2,7),blue=integer(r,2,6),n=integer(r,3,5);
  const p=red/(red+blue),p1=n*p*((1-p)**(n-1)),atLeast=1-(1-p)**n;
  const third=section("c-probabilites","Analyser des tirages indépendants",
    "Une urne contient "+red+" boules rouges et "+blue+" boules bleues. On effectue "+n+" tirages avec remise. X est le nombre de boules rouges obtenues.",[
      N("c09","Calculer la probabilité p de rouge en un seul tirage.",p,1,
        "p="+red+"/("+red+"+"+blue+")="+fmt(p)+".","probabilités"),
      N("c10","Calculer la probabilité d'obtenir exactement une rouge.",p1,2,
        "X suit B("+n+";"+fmt(p)+"). P(X=1)=C("+n+",1)×p×(1−p)^("+(n-1)+")="+n+"×("+red+"/"+(red+blue)+")×("+blue+"/"+(red+blue)+")^"+(n-1)+"≈"+fmt(p1)+".","loi binomiale"),
      N("c11","Calculer P(X≥1), au moins une rouge.",atLeast,1,
        "P(X≥1)=1−P(X=0)=1−(1−p)^"+n+"≈"+fmt(atLeast)+".","complémentaire"),
      N("c12","Calculer E(X), le nombre moyen de rouges.",n*p,1,
        "Pour une loi binomiale E(X)=np="+n+"×"+fmt(p)+"≈"+fmt(n*p)+".","espérance")
    ],"Présenter le succès, l'indépendance, la loi binomiale, le complémentaire et l'espérance.",
    "Justifie que la remise rend les tirages indépendants avec une même probabilité.",[
      step("model","Ai-je identifié le succès et sa probabilité ?",
        "Le succès est « tirer rouge ». La probabilité de succès reste p="+red+"/"+(red+blue)+"="+fmt(p)+", car l'urne ne change pas après remise.","12-probabilites.md"),
      step("law","Ai-je démontré pourquoi une loi binomiale est applicable ?",
        "Les "+n+" essais avec remise sont indépendants ; chacun a la probabilité p="+fmt(p)+" de succès. Donc X suit la loi binomiale B("+n+";"+fmt(p)+").","12-probabilites.md"),
      step("probability","Ai-je correctement distingué exactement une et au moins une ?",
        "Exactement une : P(X=1)="+n+"p(1−p)^("+(n-1)+")≈"+fmt(p1)+". Au moins une : 1−P(X=0)≈"+fmt(atLeast)+".","12-probabilites.md"),
      step("expectation","Ai-je présenté la formule de l'espérance et son sens ?",
        "La moyenne théorique sur de très nombreuses expériences de "+n+" tirages est E(X)=np="+fmt(n*p)+" boules rouges.","12-probabilites.md")
    ]);

  // Problème 4 : polynôme intégrable et moyenne sur intervalle.
  const A=integer(r,2,7),B=integer(r,1,6),limit=integer(r,2,5);
  const integral=A*limit**3/3+B*limit**2/2,average=integral/limit;
  const fourth=section("c-integrales","Calculer une accumulation",
    "Une grandeur est modélisée par f(t)="+A+"t²+"+B+"t pour 0 ≤ t ≤ "+limit+". On note I=∫₀^"+limit+" f(t)dt. Les valeurs exactes ou fractions sont acceptées.",[
      N("c13","Calculer f′(1).",2*A+B,1,
        "f′(t)="+(2*A)+"t+"+B+", donc f′(1)="+(2*A+B)+".","dérivation"),
      N("c14","Dans une primitive F(t)=kt³+mt², quel est le coefficient k ?",A/3,1,
        "Une primitive de "+A+"t² est ("+A+"/3)t³, donc k="+A+"/3="+fmt(A/3)+".","primitives"),
      N("c15","Calculer exactement la valeur de I=∫₀^"+limit+" f(t)dt.",integral,2,
        "F(t)=("+A+"/3)t³+("+B+"/2)t². I=F("+limit+")−F(0)=("+A+"×"+limit+"³)/3+("+B+"×"+limit+"²)/2="+fmt(integral)+".","intégrales"),
      N("c16","Calculer la valeur moyenne de f sur [0;"+limit+"].",average,1,
        "La moyenne sur [0;"+limit+"] est I/("+limit+"−0)="+fmt(integral)+"/"+limit+"="+fmt(average)+".","intégrales")
    ],"Utiliser la dérivée, une primitive et le théorème fondamental, puis diviser par la longueur de l'intervalle.",
    "Distingue la pente instantanée, l'intégrale cumulée et la valeur moyenne.",[
      step("derivative","Ai-je calculé la dérivée au point demandé ?",
        "f′(t)="+2*A+"t+"+B+". On évalue en t=1 pour obtenir f′(1)="+(2*A+B)+".","06-derivation.md"),
      step("primitive","Ai-je construit une primitive et vérifié les coefficients ?",
        "F(t)=("+A+"/3)t³+("+B+"/2)t² est une primitive de f(t)="+A+"t²+"+B+"t sur ℝ. Sa dérivée redonne exactement f.","15-primitives-integrales.md"),
      step("integral","Ai-je utilisé les bornes de l'intégrale sans confusion ?",
        "I=F("+limit+")−F(0)=("+A+"×"+limit+"³)/3+("+B+"×"+limit+"²)/2="+fmt(integral)+". On substitue les deux bornes.","15-primitives-integrales.md"),
      step("mean","Ai-je distingué la valeur moyenne de l'intégrale totale ?",
        "La valeur moyenne de f est I/("+limit+"−0)="+fmt(average)+". On divise par la longueur de l'intervalle et non par le nombre de questions.","15-primitives-integrales.md")
    ]);
  return {id:GENERATED_EXAM_ID,seed,title:"Examen C — sujet inédit à valeurs variables",description:"Quatre problèmes générés, 3 heures, barème /20.",sections:[first,second,third,fourth]};
}
