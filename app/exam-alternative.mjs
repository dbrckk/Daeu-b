/**
 * Examen D — quatre nouvelles familles, indépendantes des modèles de C.
 *
 * Algorithme déterministe figé : ne pas modifier l'ordre des tirages ni les
 * formules sans prévoir une migration/version, car les copies sont
 * reconstruites depuis leur graine lors d'un import ou d'une reprise.
 */
import {isSeed} from "./exam-generator.mjs";

export const ALTERNATIVE_EXAM_ID="blanc-d";
const int=(next,min,max)=>min+Math.floor(next()*(max-min+1));
const fmt=value=>Number(value.toFixed(8)).toString().replace(".",",");
const number=(id,prompt,answer,points,solution,skill)=>({id,prompt,answer,points,solution,skill,type:"number"});
const choice=(id,prompt,options,answer,points,solution,skill)=>({id,prompt,options,answer,points,solution,skill,type:"choice"});
const step=(id,prompt,model,lesson)=>({id,prompt,model,lesson});
const section=(id,title,context,questions,method,intro,steps)=>({id,title,context,questions,method,rubric:{intro,steps}});

export function createAlternativeExam(seed){
  if(!isSeed(seed))throw new Error("Graine D invalide");
  let state=(seed^0x85ebca6b)>>>0;
  const next=()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };

  // 1. Étude d'une fonction rationnelle, domaine et asymptote oblique.
  const b=int(next,2,6),k=int(next,1,5),c=int(next,2,8);
  const oblique="y = x + "+k;
  const rational=section("d-rationnelle","Étudier une fonction rationnelle",
    "Soit f(x)=x+"+k+"+"+c+"/(x−"+b+"). Étudier cette fonction sur son domaine réel. On justifiera les calculs par une décomposition et une dérivée.",[
      number("d01","Quelle valeur réelle est exclue du domaine de définition ?",b,1,
        "Le dénominateur x−"+b+" s'annule en x="+b+". Le domaine est ℝ privé de {"+b+"}.","domaines"),
      number("d02","Calculer f("+(b+1)+").",b+1+k+c,1,
        "En x="+(b+1)+", le dénominateur vaut 1 : f("+(b+1)+")="+(b+1)+"+"+k+"+"+c+"="+(b+1+k+c)+".","calcul de fonction"),
      number("d03","Calculer f′("+(b+2)+").",1-c/4,1,
        "Sur le domaine, f′(x)=1−"+c+"/(x−"+b+")². Pour x="+(b+2)+", on obtient f′="+fmt(1-c/4)+".","dérivation"),
      choice("d04","Quelle droite est une asymptote oblique à la courbe de f ?",[
        oblique,"y = x − "+k,"x = "+b,"y = "+c+"/(x−"+b+")"
      ],oblique,2,
      "f(x)−(x+"+k+")="+c+"/(x−"+b+") tend vers 0 quand x tend vers ±∞. L'asymptote oblique est "+oblique+". La droite x="+b+" est une asymptote verticale, pas oblique.","asymptotes")
    ],"Exclure l'annulation du dénominateur, calculer la dérivée et établir une asymptote par une limite.",
    "Une asymptote oblique y=ax+b se justifie par la limite de f(x)−(ax+b).",[
      step("domain","Ai-je établi le domaine avant les calculs et éliminé le pôle ?",
        "On doit avoir x−"+b+"≠0, donc x≠"+b+". On travaille séparément sur les intervalles ]−∞;"+b+"[ et ]"+b+";+∞[.","05-fonctions.md"),
      step("evaluate","Ai-je évalué la fonction uniquement sur son domaine de définition ?",
        "Au point "+(b+1)+", x−"+b+"=1, donc f("+(b+1)+")="+(b+1+k+c)+". Ce calcul n'a de sens qu'après vérification du domaine.","05-fonctions.md"),
      step("derivative","Ai-je dérivé le terme rationnel et conservé le carré au dénominateur ?",
        "La dérivée de "+c+"/(x−"+b+") est −"+c+"/(x−"+b+")². Donc f′(x)=1−"+c+"/(x−"+b+")² et f′("+(b+2)+")="+fmt(1-c/4)+".","06-derivation.md"),
      step("asymptote","Ai-je utilisé une limite pour démontrer l'asymptote oblique ?",
        "f(x)−(x+"+k+")="+c+"/(x−"+b+")→0 pour x→±∞. L'asymptote oblique est donc "+oblique+" ; x="+b+" reste verticale.","07-limites-asymptotes.md")
    ]);

  // 2. Arbre de probabilités et formule de Bayes.
  const p=int(next,2,7)/10,q=int(next,6,9)/10,t=int(next,1,4)/10;
  const intersection=p*q,other=(1-p)*t,total=intersection+other,bayes=intersection/total;
  const probability=section("d-conditionnelles","Interpréter un test",
    "Dans une population, P(A)="+fmt(p)+". Un test est positif (événement B) avec P(B|A)="+fmt(q)+" et P(B|non A)="+fmt(t)+". On note non A l'événement contraire de A. Calculer en justifiant les branches de l'arbre.",[
      number("d05","Calculer P(A∩B).",intersection,1,
        "Par la formule des probabilités conditionnelles, P(A∩B)=P(A)×P(B|A)="+fmt(p)+"×"+fmt(q)+"="+fmt(intersection)+".","probabilités"),
      number("d06","Calculer P(B), la probabilité totale d'un test positif.",total,2,
        "Les cas A et non A forment une partition : P(B)=P(A∩B)+P(non A∩B)="+fmt(intersection)+"+"+fmt(other)+"="+fmt(total)+".","probabilités totales"),
      number("d07","Sachant que le test est positif, calculer P(A|B).",bayes,1,
        "P(A|B)=P(A∩B)/P(B)="+fmt(intersection)+"/"+fmt(total)+"≈"+fmt(bayes)+". Attention à l'ordre du conditionnement.","Bayes"),
      number("d08","Calculer la probabilité que le test ne soit pas positif.",1-total,1,
        "L'événement contraire de B a pour probabilité 1−P(B)=1−"+fmt(total)+"="+fmt(1-total)+".","complémentaire")
    ],"Établir l'arbre de probabilités, distinguer P(A|B) de P(B|A), et justifier chaque produit.",
    "Les probabilités conditionnelles se lisent sur les branches ; la formule de Bayes inverse le conditionnement.",[
      step("tree","Ai-je expliqué les branches et leurs probabilités complémentaires ?",
        "P(A)="+fmt(p)+" et P(non A)="+fmt(1-p)+". Les branches B valent "+fmt(q)+" après A et "+fmt(t)+" après non A.","12-probabilites.md"),
      step("intersection","Ai-je calculé correctement les probabilités d'intersection ?",
        "P(A∩B)="+fmt(p)+"×"+fmt(q)+"="+fmt(intersection)+" ; P(non A∩B)="+fmt(1-p)+"×"+fmt(t)+"="+fmt(other)+".","12-probabilites.md"),
      step("total","Ai-je montré les deux cas exhaustifs dans la probabilité totale ?",
        "P(B)="+fmt(intersection)+"+"+fmt(other)+"="+fmt(total)+". Les deux branches se rejoignent sans se recouvrir.","12-probabilites.md"),
      step("bayes","Ai-je inversé correctement le conditionnement et utilisé P(B) au dénominateur ?",
        "P(A|B)="+fmt(intersection)+"/"+fmt(total)+"≈"+fmt(bayes)+". Cette probabilité n'est pas P(B|A)="+fmt(q)+".","12-probabilites.md")
    ]);

  // 3. Statistiques : valeurs ordonnées, variance de population (division par N).
  const a=int(next,3,12),d=int(next,1,5);
  const values=[a,a+d,a+d,a+3*d,a+4*d],mean=a+9*d/5,variance=54*d*d/25;
  const statistics=section("d-statistiques","Étudier une série de mesures",
    "On relève les cinq mesures suivantes : "+values.join(" ; ")+". La variance demandée est celle de la population : diviser la somme des écarts quadratiques par 5, et non par 4.",[
      number("d09","Calculer la moyenne arithmétique des cinq mesures.",mean,2,
        "La somme vaut "+fmt(values.reduce((x,y)=>x+y,0))+". En divisant par 5, la moyenne vaut "+fmt(mean)+".","moyenne"),
      number("d10","Déterminer la médiane de cette série.",a+d,1,
        "Les cinq valeurs sont rangées en ordre croissant. La troisième mesure, "+(a+d)+", est donc la médiane.","médiane"),
      number("d11","Calculer la variance de population (dénominateur 5).",variance,1,
        "V=(1/5)∑(xᵢ−"+fmt(mean)+")²="+fmt(variance)+". Par développement, V=(54/25)×"+d+"²="+fmt(variance)+".","variance"),
      number("d12","Calculer l'étendue de la série.",4*d,1,
        "L'étendue est la différence entre le maximum "+(a+4*d)+" et le minimum "+a+", soit "+(4*d)+".","dispersion")
    ],"Préciser effectif, série ordonnée, moyenne, médiane, variance (dénominateur N), étendue.",
    "Ne confonds pas la moyenne, la mesure centrale, la variance et l'étendue ; préciser la convention retenue.",[
      step("order","Ai-je ordonné les valeurs et vérifié que l'effectif vaut cinq ?",
        "On a exactement cinq mesures : "+values.join(", ")+". La série est déjà triée, ce qui donne directement la médiane au rang 3.","11-statistiques.md"),
      step("mean","Ai-je calculé la moyenne en divisant la somme par l'effectif ?",
        "Somme="+fmt(values.reduce((x,y)=>x+y,0))+" ; N=5. Donc moyenne="+fmt(mean)+", à comparer aux valeurs extrêmes.","11-statistiques.md"),
      step("variance","Ai-je utilisé la variance de population et non la variance corrigée ?",
        "Les écarts à la moyenne sont au carré puis divisés par 5. On obtient V=(54/25)×"+d+"²="+fmt(variance)+", valeur positive.","11-statistiques.md"),
      step("range","Ai-je distingué dispersion et position centrale dans la conclusion ?",
        "Minimum="+a+" et maximum="+(a+4*d)+". L'étendue vaut "+(4*d)+", tandis que moyenne et médiane caractérisent la position centrale.","11-statistiques.md")
    ]);

  // 4. TVI, monotonie et résolution exacte d'une équation exponentielle.
  const m=int(next,2,6),factor=int(next,1,4),root=Math.log(m)/factor;
  const exponential=section("d-exponentielle","Résoudre une équation exponentielle",
    "Soit g(x)=exp("+factor+"x)−"+m+" sur [0;2]. La fonction exp désigne l'exponentielle naturelle. On souhaite justifier l'existence et l'unicité d'un zéro puis le calculer.",[
      number("d13","Calculer g(0).",1-m,1,
        "exp(0)=1. Par conséquent, g(0)=1−"+m+"="+(1-m)+", valeur négative.","exponentielle"),
      number("d14","Calculer g′(0).",factor,1,
        "La dérivée de exp("+factor+"x) est "+factor+"exp("+factor+"x). Donc g′(0)="+factor+"exp(0)="+factor+".","dérivation"),
      number("d15","Calculer l'abscisse exacte du zéro de g (valeur décimale acceptée).",root,2,
        "g(x)=0 ⇔ exp("+factor+"x)="+m+" ⇔ "+factor+"x=ln("+m+") ⇔ x=ln("+m+")/"+factor+"≈"+fmt(root)+".","logarithmes"),
      choice("d16","Combien de zéros g possède-t-elle sur l'intervalle [0;2] ?",[
        "Aucun","Un seul","Au moins deux"
      ],"Un seul",1,
      "g est continue et g(0)="+(1-m)+"<0 alors que g(2)=exp("+2*factor+")−"+m+">0. Sa dérivée g′(x)="+factor+"exp("+factor+"x)>0 : le TVI et la stricte croissance assurent un unique zéro.","TVI")
    ],"Utiliser la continuité, le changement de signe, la stricte croissance et le logarithme.",
    "Le TVI démontre l'existence ; c'est la monotonie stricte qui démontre l'unicité.",[
      step("continuity","Ai-je justifié la continuité de g sur l'intervalle fermé demandé ?",
        "L'exponentielle est continue sur ℝ. Par composition, g(x)=exp("+factor+"x)−"+m+" est continue sur [0;2].","08-continuite-tvi.md"),
      step("sign","Ai-je calculé les signes aux deux bornes pour appliquer le TVI ?",
        "g(0)="+(1-m)+"<0 et g(2)=exp("+2*factor+")−"+m+">0. Par le TVI, au moins une racine appartient à ]0;2[.","08-continuite-tvi.md"),
      step("unique","Ai-je démontré l'unicité en étudiant la dérivée et ses signes ?",
        "g′(x)="+factor+"exp("+factor+"x)>0 sur [0;2] : g est strictement croissante et ne peut donc avoir deux zéros.","06-derivation.md"),
      step("solution","Ai-je résolu avec le logarithme et vérifié l'appartenance à [0;2] ?",
        "L'égalité exp("+factor+"x)="+m+" donne x=ln("+m+")/"+factor+"≈"+fmt(root)+". On a bien 0<"+fmt(root)+"<2.","09-exponentielle-logarithme.md")
    ]);

  return {
    id:ALTERNATIVE_EXAM_ID,seed,
    title:"Examen D — nouvelles familles de problèmes",
    description:"Rationnelles, probabilités conditionnelles, statistiques et TVI · 3 heures · /20.",
    sections:[rational,probability,statistics,exponential]
  };
}
