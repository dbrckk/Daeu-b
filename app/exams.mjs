/** Sujets originaux de préparation : score automatique indicatif, non officiel. */
const N=(id,prompt,answer,points,solution,skill)=>({id,prompt,answer,points,solution,skill,type:"number"});
const C=(id,prompt,options,answer,points,solution,skill)=>({id,prompt,options,answer,points,solution,skill,type:"choice"});
const E=(id,title,context,questions,method)=>({id,title,context,questions,method});
export const EXAMS=[
  {id:"blanc-1",title:"Examen blanc A — analyse, suites et probabilités",description:"Quatre problèmes indépendants, barème /20, trois heures.",sections:[
    E("a-analyse","Étude d'un bénéfice","Une entreprise modélise son bénéfice (en unités monétaires) pour x produits par B(x)=−x²+12x−20. On étudie x dans [0;12].",[
      N("a01","Calculer B′(4).",4,1,"B′(x)=−2x+12, donc B′(4)=−8+12=4.","dérivation"),
      N("a02","Pour quelle valeur de x le bénéfice est-il maximal ?",6,1,"B′(x)=0 pour x=6. La dérivée passe de positive à négative, donc le bénéfice est maximal en x=6.","variations"),
      N("a03","Calculer le bénéfice maximal B(6).",16,1,"B(6)=−36+72−20=16.","optimisation"),
      C("a04","Pour quelles valeurs de x le bénéfice est-il strictement positif ?",["2 < x < 10","x < 2 ou x > 10","2 ≤ x ≤ 10"],"2 < x < 10",2,"B(x)=−(x−2)(x−10). Le produit est strictement positif entre les racines 2 et 10 (et nul aux bornes).","second degré")
    ],"Domaine, dérivée, signe, variations, puis résolution d'une inéquation du second degré. Justifier le signe de B′ et celui de B."),
    E("a-suites","Prévisions de croissance","Un stock vaut initialement 150 unités. Il augmente de 20 % à chaque période : u₀=150 et uₙ₊₁=1,2uₙ.",[
      N("a05","Quelle est la raison q de la suite ?",1.2,1,"Chaque période multiplie par 1+20/100=1,2. C'est une suite géométrique de raison 1,2.","suites"),
      N("a06","Calculer u₂.",216,1,"u₂=150×1,2²=150×1,44=216.","suites"),
      N("a07","Quel est le plus petit entier n pour lequel uₙ ≥ 300 ?",4,2,"150×1,2ⁿ ≥300 équivaut à n≥ln(2)/ln(1,2)≈3,802. Le premier entier admissible est 4 ; u₃=259,2 et u₄=311,04.","logarithmes"),
      N("a08","Calculer u₀+u₁+u₂.",546,1,"u₀=150, u₁=180, u₂=216. La somme est 150+180+216=546.","somme de suites")
    ],"Démontrer la nature géométrique, justifier une formule explicite et contrôler le seuil par les termes voisins."),
    E("a-probas","Tirages indépendants","Une urne contient 3 boules rouges et 2 bleues. On effectue trois tirages AVEC remise. X désigne le nombre de rouges.",[
      N("a09","Probabilité p d'obtenir rouge lors d'un tirage ?",0.6,1,"p=3/(3+2)=3/5=0,6.","probabilités"),
      N("a10","Probabilité P(X=2) ?",0.432,2,"X suit B(3;0,6) : P(X=2)=C(3,2)×0,6²×0,4=3×0,36×0,4=0,432.","loi binomiale"),
      N("a11","Probabilité P(X≥1) ?",0.936,1,"Par le complément : P(X≥1)=1−P(X=0)=1−0,4³=0,936.","complémentaire"),
      N("a12","Espérance E(X) ?",1.8,1,"Pour une loi binomiale E(X)=np=3×0,6=1,8.","espérance")
    ],"Indiquer les trois conditions de la loi binomiale : nombre fixe d'essais, indépendance et probabilité constante."),
    E("a-integrales","Intégration et logarithmes","On travaille avec h(x)=4x−2 et la fonction logarithme népérien.",[
      C("a13","Quelle est une primitive de h ?",["2x²−2x","4x²−2x","2x−2"],"2x²−2x",1,"La dérivée de 2x²−2x est 4x−2. Toutes les primitives s'écrivent 2x²−2x+C.","primitives"),
      N("a14","Calculer l'intégrale de 0 à 2 de (4x−2) dx.",4,2,"Une primitive est H(x)=2x²−2x. H(2)−H(0)=8−4=4.","intégrales"),
      C("a15","Quel est le domaine de définition de ln(x−1) ?",["x > 1","x ≥ 1","tous les réels"],"x > 1",1,"L'argument doit être strictement positif : x−1>0, donc x>1.","domaines"),
      N("a16","Résoudre ln(x−1)=ln(4). Donner x.",5,1,"Sur x>1, ln est injective. Donc x−1=4 et x=5, bien dans le domaine.","logarithmes")
    ],"Toujours vérifier les domaines ; écrire la primitive et les bornes de l'intégrale.")
  ]},
  {id:"blanc-2",title:"Examen blanc B — fonctions, algèbre et statistiques",description:"Quatre problèmes indépendants, barème /20, trois heures.",sections:[
    E("b-fonction","Fonction rationnelle","On considère f(x)=(x²+1)/(x−1), pour x≠1. On peut effectuer une division pour écrire f(x)=x+1+2/(x−1).",[
      N("b01","Calculer f(2).",5,1,"f(2)=(2²+1)/(2−1)=5.","calcul de fonction"),
      N("b02","Quelle est l'abscisse de l'asymptote verticale ?",1,1,"Le dénominateur s'annule en x=1 et le numérateur vaut 2 : les limites unilatérales sont infinies.","asymptotes"),
      N("b03","Calculer f′(3).",0.5,1,"À partir de f=x+1+2/(x−1), f′=1−2/(x−1)² ; f′(3)=1−2/4=0,5.","dérivation"),
      C("b04","Quelle est une asymptote oblique de f à l'infini ?",["y=x+1","y=x−1","y=2"],"y=x+1",2,"f(x)−(x+1)=2/(x−1) tend vers 0 à ±∞, donc y=x+1 est asymptote oblique.","limites")
    ],"Justifier le domaine, les limites unilatérales et la différence tendant vers zéro à l'infini."),
    E("b-systeme","Billetterie : deux tarifs","Une place adulte coûte A euros, une place enfant C euros. Un adulte et deux enfants paient 22 € ; deux adultes et un enfant paient 29 €.",[
      N("b05","Prix A d'une place adulte ?",12,2,"On résout A+2C=22 et 2A+C=29. Multiplier la première par 2 et soustraire la seconde donne 3C=15, soit C=5 et A=12.","systèmes"),
      N("b06","Prix C d'une place enfant ?",5,2,"À partir de A+2C=22 et A=12, 2C=10, donc C=5.","systèmes"),
      N("b07","Prix de trois places adultes et une enfant ?",41,1,"3A+C=3×12+5=41 €.","modélisation")
    ],"Introduire clairement les inconnues, établir les deux équations, résoudre et vérifier dans les deux tarifs."),
    E("b-stats","Résultats d'un groupe","Les cinq résultats d'une série statistique sont : 4 ; 6 ; 6 ; 8 ; 11. On utilise la variance de population (division par 5).",[
      N("b08","Calculer la moyenne de la série.",7,1,"(4+6+6+8+11)/5=35/5=7.","moyenne"),
      N("b09","Calculer la médiane.",6,1,"La série est triée. La valeur du milieu (3e) vaut 6.","médiane"),
      N("b10","Calculer la variance de population.",5.6,2,"Moyenne 7 ; carrés des écarts : 9,1,1,1,16. Somme 28, variance 28/5=5,6.","variance"),
      N("b11","Calculer l'étendue.",7,1,"Maximum 11 moins minimum 4 donne 7.","dispersion")
    ],"Présenter les effectifs, la moyenne et les cinq écarts au carré avant de diviser par l'effectif."),
    E("b-expo","Une équation avec exponentielle","Soit g(x)=eˣ−3, définie sur tous les réels. On étudie son zéro.",[
      N("b12","Calculer g(0).",-2,1,"e⁰=1 donc g(0)=1−3=−2.","exponentielle"),
      N("b13","Résoudre g(x)=0. Donner une approximation décimale de x.",Math.log(3),2,"eˣ=3 donc x=ln(3)≈1,09861229. Le logarithme est la fonction réciproque de l'exponentielle.","logarithmes"),
      C("b14","Quelle est la dérivée de g(x)=eˣ−3 ?",["eˣ","eˣ−3","1"],"eˣ",1,"La dérivée de eˣ est eˣ et celle d'une constante est zéro.","dérivation"),
      C("b15","Quelle justification établit que g(x)=0 a une unique solution ?",["g est continue et strictement croissante, avec un changement de signe","g est définie sur tous les réels, sans autre hypothèse","le graphique semble couper l'axe"],"g est continue et strictement croissante, avec un changement de signe",1,"g est continue ; g(0)<0 et g(2)>0 assurent un zéro par TVI. Sa dérivée eˣ>0 assure l'unicité.","TVI")
    ],"Rédiger les hypothèses du TVI (continuité, valeurs aux bornes), puis la preuve d'unicité par monotonie.")
  ]}
];
