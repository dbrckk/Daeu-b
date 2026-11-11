/**
 * Examen E : quatre familles nouvelles, 16 questions, 4 exercices de 5 points.
 * La seed uint32 reconstruit une copie à l'identique hors ligne / après import.
 * NE PAS modifier les tirages ou l'ordre des questions après publication :
 * l'ancienne génération est une partie du format des copies sauvegardées.
 */
import {isSeed} from "./exam-generator.mjs";
export const APPLIED_EXAM_ID="blanc-e";
const randInt=(next,min,max)=>min+Math.floor(next()*(max-min+1));
const pick=(next,values)=>values[randInt(next,0,values.length-1)];
const fmt=n=>Number.isInteger(n)?String(n):Number(n.toFixed(8)).toString().replace(".",",");
const HINTS={
 "systèmes":"Écris les deux équations et vérifie leurs deux membres après résolution.",
 "modélisation":"Nomme les inconnues et conserve les unités du problème concret.",
 "budget":"Une somme restante ne peut être déduite qu'après avoir calculé le coût réel.",
 "géométrie":"Vérifie que le triangle est rectangle avant d'appliquer le théorème de Pythagore.",
 "aires":"Une aire s'exprime dans l'unité de longueur au carré.",
 "trigonométrie":"Identifie côté opposé, adjacent et hypoténuse relativement à l'angle θ.",
 "probabilités":"Distingue l'événement recherché et le nombre d'issues possibles.",
 "tirages sans remise":"Sans remise, le deuxième tirage est conditionnel au premier.",
 "domaines":"Une racine carrée exige un radicande positif ou nul ; un dénominateur ne peut pas être nul.",
 "calcul de fonction":"Vérifie d'abord que la valeur appartient au domaine de définition.",
 "équations":"Un quotient est nul exactement lorsque son numérateur est nul et son dénominateur non nul."
};
const N=(id,prompt,answer,points,solution,skill)=>({
 id,prompt,answer,points,type:"number",skill,
 solution:solution+"\n\nMéthode : "+HINTS[skill]
});
const C=(id,prompt,options,answer,points,solution,skill)=>({
 id,prompt,options,answer,points,type:"choice",skill,
 solution:solution+"\n\nMéthode : "+HINTS[skill]
});
const step=(id,prompt,model,lesson)=>({id,prompt,model,lesson});
const section=(id,title,context,questions,method,intro,steps)=>({
 id,title,context,questions,method,rubric:{intro,steps}
});
export function createAppliedExam(seed){
 if(!isSeed(seed))throw Error("Graine E invalide");
 let state=(seed^0x27d4eb2d)>>>0;
 const next=()=>{
   state=(Math.imul(state,22695477)+1)>>>0;
   return state/4294967296;
 };
 // 1 — Algèbre appliquée : système et budget, solutions entières construites.
 const adult=randInt(next,8,19),child=randInt(next,3,adult-2);
 const one=adult+2*child,two=2*adult+child;
 const group=3*adult+2*child,extra=randInt(next,5,30),budget=group+extra;
 const algebra=section("e-systeme","Déterminer deux tarifs",
   "Dans une salle, une place adulte coûte A euros et une place enfant coûte E euros. "+
   "Une place adulte et deux places enfant coûtent "+one+" €. "+
   "Deux places adulte et une place enfant coûtent "+two+" €. "+
   "On suppose que les prix sont des entiers strictement positifs.",[
     N("e01","Résoudre le système : quel est le prix d'une place adulte, en euros ?",adult,2,
       "A+2E="+one+" et 2A+E="+two+". En doublant la première puis en soustrayant la seconde : 3E="+(2*one-two)+
       ", donc E="+child+" et A="+adult+" €. Vérification : "+adult+"+2×"+child+"="+one+" et 2×"+adult+"+"+child+"="+two+".","systèmes"),
     N("e02","Quel est le prix d'une place enfant, en euros ?",child,1,
       "Avec A="+adult+", A+2E="+one+" donne E=("+one+"−"+adult+")/2="+child+" €.","systèmes"),
     N("e03","Combien coûtent trois places adulte et deux places enfant, en euros ?",group,1,
       "Le coût est 3A+2E=3×"+adult+"+2×"+child+"="+group+" €.","modélisation"),
     N("e04","Le budget du groupe est de "+budget+" €. Combien d'euros reste-t-il après l'achat ?",extra,1,
       "Budget − coût = "+budget+"−"+group+"="+extra+" €. Le solde est positif.","budget")
   ],"Poser les inconnues, établir deux équations, les résoudre puis contrôler les unités et le budget.",
   "Ne valide une résolution de système qu'après vérification dans les deux achats.",[
     step("unknowns","Ai-je donné un sens et une unité à chaque inconnue ?",
       "A et E représentent des prix en euros, strictement positifs. Le système provient des deux achats donnés dans l'énoncé.","03-equations-inequations-systemes.md"),
     step("equations","Ai-je correctement transcrit les deux achats en équations ?",
       "Les deux équations sont A+2E="+one+" et 2A+E="+two+". Les coefficients correspondent aux nombres de tickets achetés.","03-equations-inequations-systemes.md"),
     step("solution","Ai-je résolu le système et vérifié chacune des deux égalités ?",
       "On obtient A="+adult+" et E="+child+" ; contrôle : "+adult+"+2×"+child+"="+one+" et 2×"+adult+"+"+child+"="+two+".","03-equations-inequations-systemes.md"),
     step("budget","Ai-je calculé le coût total et interprété le budget restant ?",
       "Trois adultes et deux enfants coûtent "+group+" €. Le budget de "+budget+" € laisse "+extra+" €, sans dépassement.","17-raisonnement-modelisation.md")
   ]);
 // 2 — Géométrie et trigonométrie : plusieurs triangles de Pythagore.
 const [a0,b0,c0]=pick(next,[[3,4,5],[5,12,13],[8,15,17]]);
 const swap=randInt(next,0,1)===1,scale=randInt(next,2,6);
 const adjacent=(swap?b0:a0)*scale,opposite=(swap?a0:b0)*scale,hypotenuse=c0*scale;
 const area=adjacent*opposite/2;
 const correctCos=adjacent+"/"+hypotenuse,incorrectSin=opposite+"/"+hypotenuse;
 const incorrectTan=opposite+"/"+adjacent;
 const geometry=section("e-trigonometrie","Triangle rectangle et mesures",
   "Un terrain forme un triangle rectangle. Les côtés de l'angle droit mesurent "+
   adjacent+" m et "+opposite+" m. L'angle θ est adjacent au côté de "+adjacent+
   " m et opposé au côté de "+opposite+" m. On note h la longueur de l'hypoténuse.",[
     N("e05","Calculer h en mètres, sans arrondir.",hypotenuse,1,
       "Par Pythagore, h²="+adjacent+"²+"+opposite+"²="+(hypotenuse*hypotenuse)+
       ". Comme h>0, h="+hypotenuse+" m.","géométrie"),
     N("e06","Calculer l'aire du triangle en mètres carrés.",area,1,
       "L'aire est (base×hauteur)/2="+adjacent+"×"+opposite+"/2="+fmt(area)+" m².","aires"),
     N("e07","Calculer sin(θ) (fraction ou décimal accepté).",opposite/hypotenuse,1,
       "sin(θ)=côté opposé/hypoténuse="+opposite+"/"+hypotenuse+
       "≈"+fmt(opposite/hypotenuse)+".","trigonométrie"),
     C("e08","Quelle fraction représente cos(θ) ?",[
       correctCos,incorrectSin,incorrectTan
     ],correctCos,2,
       "cos(θ)=côté adjacent/hypoténuse="+correctCos+
       ". "+incorrectSin+" est le sinus et "+incorrectTan+" est la tangente.","trigonométrie")
   ],"Appliquer Pythagore, donner l'aire en m², puis identifier le bon rapport trigonométrique.",
   "Avant de choisir sinus ou cosinus, repère le côté opposé et le côté adjacent à θ.",[
     step("right","Ai-je vérifié la configuration rectangle et nommé l'hypoténuse ?",
       "Les deux côtés perpendiculaires sont "+adjacent+" m et "+opposite+
       " m ; l'hypoténuse est le côté opposé à l'angle droit, h="+hypotenuse+" m.","13-trigonometrie.md"),
     step("pythagoras","Ai-je appliqué Pythagore et retenu la racine positive ?",
       "h²="+adjacent+"²+"+opposite+"²="+(hypotenuse*hypotenuse)+
       " ; une longueur étant positive, h="+hypotenuse+" m.","13-trigonometrie.md"),
     step("area","Ai-je indiqué la formule d'aire et les unités au carré ?",
       "Aire=(base×hauteur)/2="+adjacent+"×"+opposite+"/2="+fmt(area)+" m².","13-trigonometrie.md"),
     step("ratios","Ai-je identifié opposé, adjacent, hypoténuse et les deux rapports ?",
       "sin(θ)="+incorrectSin+" et cos(θ)="+correctCos+
       ". Ces rapports sont sans unité et dépendent du choix de l'angle θ.","13-trigonometrie.md")
   ]);
 // 3 — Probabilités avec tirages DÉPENDANTS, sans remise.
 const red=randInt(next,3,8),blue=randInt(next,2,6),total=red+blue;
 const pRed=red/total,pRB=(red*blue)/(total*(total-1));
 const pOne=(2*red*blue)/(total*(total-1));
 const pRR=(red*(red-1))/(total*(total-1));
 const probability=section("e-sans-remise","Probabilités sans remise",
   "Une urne contient "+red+" boules rouges et "+blue+
   " boules bleues. On tire successivement deux boules SANS remise. "+
   "Tous les tirages ordonnés de deux boules distinctes sont équiprobables.",[
     N("e09","Calculer la probabilité de tirer rouge au premier tirage.",pRed,1,
       "P(R au premier)="+red+"/"+total+"≈"+fmt(pRed)+".","probabilités"),
     N("e10","Calculer P(rouge puis bleue), dans cet ordre.",pRB,1,
       "P(R puis B)=("+red+"/"+total+")×("+blue+"/"+(total-1)+")≈"+fmt(pRB)+
       ". Le deuxième tirage se fait parmi "+(total-1)+" boules.","tirages sans remise"),
     N("e11","Calculer P(exactement une rouge en deux tirages).",pOne,2,
       "Additionner les ordres R puis B et B puis R : 2×"+red+"×"+blue+
       "/("+total+"×"+(total-1)+")≈"+fmt(pOne)+".","tirages sans remise"),
     N("e12","Calculer P(deux rouges).",pRR,1,
       "P(R puis R)=("+red+"/"+total+")×("+(red-1)+"/"+(total-1)+")≈"+fmt(pRR)+".","tirages sans remise")
   ],"Distinguer les deux ordres, utiliser les probabilités conditionnelles et réduire le nombre de boules au second tirage.",
   "Ne pas appliquer la loi binomiale : sans remise, les deux tirages ne sont pas indépendants.",[
     step("experiment","Ai-je précisé que les tirages sont successifs et sans remise ?",
       "Au départ, "+total+" boules dont "+red+" rouges et "+blue+
       " bleues. Le second tirage se fait parmi "+(total-1)+" boules.","12-probabilites.md"),
     step("ordered","Ai-je multiplié les bonnes probabilités conditionnelles dans l'ordre ?",
       "P(R puis B)=("+red+"/"+total+")×("+blue+"/"+(total-1)+")≈"+fmt(pRB)+
       ". Le dénominateur du second tirage est modifié.","12-probabilites.md"),
     step("exactly-one","Ai-je additionné les deux ordres possibles pour exactement une rouge ?",
       "R-B et B-R sont disjoints ; chacun vaut "+red+"×"+blue+"/("+total+"×"+(total-1)+
       "). La somme est "+fmt(pOne)+".","12-probabilites.md"),
     step("two-red","Ai-je tenu compte de la première boule rouge pour le second tirage ?",
       "Après une première rouge, il en reste "+(red-1)+" parmi "+(total-1)+
       ". La probabilité de deux rouges est "+fmt(pRR)+".","12-probabilites.md")
   ]);
 // 4 — Fonction irrationnelle et valeur interdite, nouveaux domaines.
 const a=randInt(next,-4,5),delta=randInt(next,1,4),b=a+delta;
 const domain="x ≥ "+a+" et x ≠ "+b;
 const radical=section("e-racine","Domaine et zéro d'une fonction irrationnelle",
   "Soit f(x)=√(x−("+a+"))/(x−("+b+")). "+
   "Le numérateur est une racine carrée et le dénominateur n'est pas sous la racine.",[
     C("e13","Quel est le domaine de définition réel de f ?",[
       domain,"x > "+a+" et x ≠ "+b,"x ≥ "+a,"x ≤ "+a
     ],domain,2,
       "Il faut x−("+a+")≥0 et x−("+b+")≠0. Ainsi "+domain+".","domaines"),
     N("e14","Quelle valeur de x est interdite parce qu'elle annule le dénominateur ?",b,1,
       "Le dénominateur x−("+b+") s'annule en x="+b+
       ". Cette valeur vérifie x≥"+a+" mais reste exclue.","domaines"),
     N("e15","Calculer f("+(a+9)+").",3/(9-delta),1,
       "La racine vaut √9=3 et le dénominateur vaut "+(9-delta)+
       ". Donc f("+(a+9)+")=3/"+(9-delta)+"≈"+fmt(3/(9-delta))+".","calcul de fonction"),
     N("e16","Résoudre f(x)=0 sur le domaine donné.",a,1,
       "Un quotient est nul quand son numérateur est nul sans annuler le dénominateur. "+
       "√(x−("+a+"))=0 donne x="+a+
       " ; x−("+b+")="+(-delta)+" est non nul, donc la solution est "+a+".","équations")
   ],"Commencer par l'intersection des conditions racine et quotient ; vérifier chaque valeur dans le domaine.",
   "Une racine carrée peut valoir zéro, mais un dénominateur ne le peut jamais.",[
     step("radicand","Ai-je écrit la condition sur le radicande, avec une borne incluse ?",
       "x−("+a+")≥0 équivaut à x≥"+a+". L'égalité est admise car √0 existe.","05-fonctions.md"),
     step("denominator","Ai-je exclu la bonne valeur interdite du dénominateur ?",
       "x−("+b+")≠0 équivaut à x≠"+b+". Le domaine complet est "+domain+".","05-fonctions.md"),
     step("evaluate","Ai-je substitué une valeur autorisée et simplifié la racine ?",
       "x="+(a+9)+" appartient au domaine, la racine vaut 3 et le dénominateur "+(9-delta)+
       " : f="+fmt(3/(9-delta))+".","05-fonctions.md"),
     step("zero","Ai-je vérifié que le zéro du numérateur n'annule pas le dénominateur ?",
       "À x="+a+", le numérateur est nul, le dénominateur vaut "+(-delta)+
       "≠0. C'est bien la seule racine de la fonction.","03-equations-inequations-systemes.md")
   ]);
 return {
   id:APPLIED_EXAM_ID,seed,
   title:"Examen E — algèbre, trigonométrie et applications",
   description:"Systèmes, triangle rectangle, probabilités sans remise et domaine d'une racine · 3 heures · /20.",
   sections:[algebra,geometry,probability,radical]
 };
}
