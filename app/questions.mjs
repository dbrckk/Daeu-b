/* Banque d'exercices DAEU B : questions originales, corrigées et versionnées.
 * Format : n(id, énoncé, réponse numérique, indice, correction)
 *         c(id, énoncé, options, bonne réponse, indice, correction)
 */
const n=(id,prompt,answer,hint,explanation)=>({id,prompt,answer,hint,explanation,type:"number"});
const c=(id,prompt,options,answer,hint,explanation)=>({id,prompt,options,answer,hint,explanation,type:"choice"});
export const TOPICS=[
{slug:"nombres",title:"Calcul numérique et fractions",lesson:"01-calcul-numerique.md",jalons:[1,2,3],questions:[
 n("n01","Calculer 3/4 − 1/2.",0.25,"Réduis au même dénominateur.","3/4 − 2/4 = 1/4 = 0,25."),
 n("n02","Calculer 2³ × 2⁻⁵.",0.25,"Additionne les exposants de même base.","2^(3−5) = 2⁻² = 1/4."),
 n("n03","Simplifier √(72) / √(2).",6,"Regroupe sous une racine positive.","√(72/2) = √36 = 6."),
 n("n04","Prix après une remise de 15 % sur 80 € ? (en €)",68,"Multiplie par 1 − 0,15.","80 × 0,85 = 68 €."),
 n("n05","Combien vaut 5/6 + 1/3 ?",7/6,"Écris 1/3 avec un dénominateur 6.","5/6 + 2/6 = 7/6 ≈ 1,1666667."),
 n("n06","Résultat de −3 × (−4) + 2 ?",14,"Le produit de deux négatifs est positif.","(−3)×(−4)=12 ; puis 12+2=14."),
 n("n07","Un prix augmente de 10 % puis baisse de 10 %. Variation totale en % ?",-1,"Multiplie les coefficients, ne les additionne pas.","1,10 × 0,90 = 0,99 : baisse totale de 1 %. Réponse : −1."),
 n("n08","Combien vaut (−2)⁴ ?",16,"Les parenthèses comptent.","(−2)⁴ = (−2)(−2)(−2)(−2) = 16."),
 n("n09","Calculer 5/8 − 1/6 (fraction ou décimal).",11/24,"Réduis au dénominateur commun 24.","5/8=15/24 et 1/6=4/24 ; leur différence vaut 11/24."),
 n("n10","Calculer la valeur absolue |−7/3|.",7/3,"La valeur absolue est une distance, jamais négative.","|−7/3| = 7/3 car la valeur absolue d'un réel négatif est son opposé."),
 c("n11","Simplifier √50 − √8.",["3√2","7√2","√42"],"3√2","Extrais les carrés parfaits des deux racines.","√50=5√2 et √8=2√2 ; donc √50−√8=3√2.")
]},
{slug:"litteral",title:"Développer et factoriser",lesson:"02-calcul-litteral.md",jalons:[4],questions:[
 c("a01","Développement de (x+3)² ?",["x²+6x+9","x²+9","x²+3x+9"],"x²+6x+9","Utilise (a+b)² = a² + 2ab + b².","(x+3)² = x² + 2×3x + 9 = x²+6x+9."),
 c("a02","Factorisation de x²−16 ?",["(x−4)(x+4)","(x−8)(x+2)","(x−4)²"],"(x−4)(x+4)","Différence de deux carrés.","x²−4²=(x−4)(x+4)."),
 n("a03","Si A(x)=2x²−3x+1, combien vaut A(−2) ?",15,"Remplace x par (−2) et garde les parenthèses.","2×4 −3×(−2)+1 = 8+6+1=15."),
 c("a04","Développement de (2x−1)(x+3) ?",["2x²+5x−3","2x²+6x−3","2x²+5x+3"],"2x²+5x−3","Distribue les quatre produits.","2x²+6x−x−3=2x²+5x−3."),
 c("a05","Factorisation de 6x²−9x ?",["3x(2x−3)","3(2x−3)","x(6x−9x)"],"3x(2x−3)","Cherche le facteur commun.","6x²−9x=3x(2x−3)."),
 c("a06","Domaine de (x²−4)/(x−2), même après simplification ?",["x ≠ 2","tous les réels","x ≥ 2"],"x ≠ 2","Une simplification ne rétablit pas la valeur interdite.","Le dénominateur initial s'annule en 2 : cette valeur reste interdite.")
]},
{slug:"equations",title:"Équations, systèmes et signes",lesson:"03-equations-inequations-systemes.md",jalons:[5,6,8],questions:[
 n("e01","Résoudre 3x−5 = x+7. Valeur de x ?",6,"Regroupe les termes en x.","3x−x=7+5 ; 2x=12 ; x=6."),
 n("e02","Système x+y=7 et x−y=1. Valeur de x ?",4,"Additionne les deux équations.","2x=8 ; x=4, puis y=3."),
 n("e03","Système x+y=7 et x−y=1. Valeur de y ?",3,"Utilise le x trouvé.","x=4 donc y=7−4=3."),
 c("e04","Solutions de (x−2)(x+3)>0 ?",["x<−3 ou x>2","−3<x<2","x>−3"],"x<−3 ou x>2","Tableau de signes : produit positif hors des racines.","Les zéros sont −3 et 2 ; les deux facteurs ont même signe en dehors."),
 c("e05","Résoudre −2x<4.",["x>−2","x<−2","x<2"],"x>−2","Diviser par un négatif inverse l'inégalité.","−2x<4 équivaut à x>−2."),
 c("e06","Solutions de (x+1)/(x−2) ≥ 0 ?",["x≤−1 ou x>2","−1≤x≤2","x<−1 ou x≥2"],"x≤−1 ou x>2","Numérateur nul admis, dénominateur nul interdit.","La fraction est non négative sur ]−∞;−1]∪]2;+∞[."),
 n("e07","Résoudre |x−3|=2 : donner la plus petite solution.",1,"La distance à 3 vaut 2.","x−3=±2, donc solutions 1 et 5 ; la plus petite est 1."),
 n("e08","Système 2x+y=10 et x−y=2. Valeur de x ?",4,"Additionne après élimination de y.","3x=12 ; x=4, puis y=2."),
 n("e09","Résoudre x/3 + 1/2 = 5/6. Donner x.",1,"Soustrais 1/2, puis multiplie par 3.","x/3=5/6−3/6=2/6=1/3 ; par conséquent x=1."),
 n("e10","Résoudre 2/(x−1)=1. Donner x.",3,"Commence par exclure x=1, puis multiplie par x−1.","Domaine : x≠1. Sur ce domaine, 2=x−1 donc x=3 ; cette valeur est bien admissible.")
]},
{slug:"second",title:"Second degré",lesson:"04-second-degre.md",jalons:[7],questions:[
 n("s01","Discriminant de x²−5x+6 ?",1,"Δ=b²−4ac.","(−5)²−4×1×6=25−24=1."),
 n("s02","Plus petite racine de x²−5x+6=0 ?",2,"Factorise (x−2)(x−3).","Les solutions sont 2 et 3 ; la plus petite est 2."),
 n("s03","Sommet de x²−4x+1 : abscisse ?",2,"α = −b/(2a).","Avec a=1, b=−4 : α=4/2=2."),
 n("s04","Minimum de x²−4x+1 ?",-3,"Écris (x−2)²−3.","(x−2)²≥0, minimum −3 atteint en x=2."),
 c("s05","Signe de x²−1 ?",["négatif entre −1 et 1","toujours positif","négatif hors de [−1;1]"],"négatif entre −1 et 1","Factorise (x−1)(x+1).","Coefficient dominant positif : signe négatif entre les racines −1 et 1."),
 c("s06","Nombre de racines réelles de 2x²+2x+5 ?",["0","1","2"],"0","Calcule Δ.","Δ=2²−4×2×5=−36<0, aucune racine réelle.")
]},
{slug:"statistiques",title:"Statistiques descriptives",lesson:"11-statistiques.md",jalons:[9],questions:[
 n("st01","Moyenne des notes 2, 4, 6 ?",4,"Somme divisée par l'effectif.","(2+4+6)/3=4. La somme vaut 12, puis on la divise par les 3 observations."),
 n("st02","Médiane de 1, 3, 5, 7, 9 ?",5,"Prends la valeur centrale triée.","Cinquième série triée de 5 valeurs : le troisième élément est 5."),
 n("st03","Moyenne pondérée : 10 (coefficient 2), 16 (coefficient 1) ?",12,"Divise par la somme des coefficients.","(10×2+16×1)/(2+1)=36/3=12."),
 n("st04","Étendue des valeurs 3, 8, 2, 12 ?",10,"Maximum moins minimum.","12−2=10. L'étendue mesure l'intervalle entre la plus grande et la plus petite valeur."),
 n("st05","Variance population de 1, 2, 3 ?",2/3,"Moyenne 2 puis somme des carrés des écarts divisée par 3.","[(1−2)² + (2−2)² + (3−2)²] /3 = 2/3."),
 c("st06","Deux séries ont la même moyenne. Laquelle est la moins dispersée ?",["celle avec l'écart-type le plus faible","celle avec le plus grand maximum","impossible à déterminer avec les écarts-types"],"celle avec l'écart-type le plus faible","L'écart-type mesure la dispersion.","À moyenne égale, un écart-type plus faible indique une dispersion plus faible."),
 n("st07","Médiane de la série ordonnée 2 ; 4 ; 4 ; 8 ; 12 ; 14 ?",6,"Pour six valeurs, moyenne des rangs 3 et 4.","Avec N=6, les deux valeurs centrales sont 4 et 8. La médiane vaut (4+8)/2 = 6, pas la moyenne de toute la série."),
 n("st08","Premier quartile Q1 (rang arrondi à l’entier supérieur) de 2 ; 3 ; 5 ; 7 ; 11 ; 13 ; 17 ; 19 ?",3,"Q1 est au rang plafond(N/4), avec rangs commençant à 1.","N=8 donc plafond(8/4)=2. La deuxième valeur de la série ordonnée est 3. Convention française du rang, sans interpolation."),
 n("st09","Troisième quartile Q3 (rang arrondi à l’entier supérieur) de 2 ; 3 ; 5 ; 7 ; 11 ; 13 ; 17 ; 19 ?",13,"Q3 est au rang plafond(3N/4).","N=8 donc plafond(3×8/4)=6. La sixième valeur de la série ordonnée est 13. Ne pas prendre 75 % de la valeur maximale."),
 n("st10","Variance de population de 1 ; 1 ; 5 ; 5 (diviser par N) ?",4,"Moyenne 3 ; calculer la moyenne des carrés des écarts.","Moyenne =3. Les quatre écarts sont −2, −2, 2 et 2 ; leurs carrés valent tous 4, donc V=(4+4+4+4)/4=4. L’écart-type est 2.")
]},
{slug:"fonctions",title:"Fonctions et domaines",lesson:"05-fonctions.md",jalons:[10],questions:[
 n("f01","Pour f(x)=x²−3, calculer f(4).",13,"Remplace x par 4.","4²−3=16−3=13. Une image se calcule en substituant la valeur de x dans l'expression."),
 c("f02","Domaine de f(x)=1/(x−3) ?",["x ≠ 3","x ≥ 3","tous les réels"],"x ≠ 3","Le dénominateur ne peut être nul.","x−3≠0 donc x≠3."),
 c("f03","Domaine de √(x−2) ?",["x≥2","x>2","x≤2"],"x≥2","Le radicande doit être positif ou nul.","x−2≥0 donc x≥2."),
 n("f04","La droite passe par (0,2) et (2,6). Quelle est sa pente ?",2,"Pente Δy/Δx.","(6−2)/(2−0)=2. La pente donne le changement vertical par unité de changement horizontal."),
 n("f05","Pour f(x)=2x+1, antécédent de 9 ?",4,"Résous 2x+1=9.","2x=8 donc x=4. L'antécédent est la valeur de x qui produit l'image demandée."),
 c("f06","Pour f(x)=x², combien 9 possède-t-il d'antécédents réels ?",["2","1","0"],"2","Résous x²=9.","Deux antécédents : −3 et 3."),
 c("f07","f(x)=−(x−1)²+4 a pour maximum ?",["4 en x=1","1 en x=4","pas de maximum"],"4 en x=1","Un carré est toujours positif.","−(x−1)²≤0, donc f(x)≤4 ; égalité en x=1.")
]},
{slug:"derivation",title:"Dérivées et variations",lesson:"06-derivation.md",jalons:[12],questions:[
 n("d01","Si f(x)=x³−4x, combien vaut f′(2) ?",8,"f′(x)=3x²−4.","f′(2)=3×4−4=8. La règle (x³)′=3x² s'applique, tandis que (−4x)′=−4."),
 c("d02","Dérivée de (2x+1)³ ?",["6(2x+1)²","3(2x+1)²","6(2x+1)"],"6(2x+1)²","Applique la règle de la chaîne.","3(2x+1)²×2=6(2x+1)²."),
 n("d03","Pente de la tangente à f(x)=x² en x=3 ?",6,"Dérive : f′(x)=2x.","f′(3)=2×3=6. La dérivée en un point est le coefficient directeur de la tangente."),
 c("d04","Si f′ est strictement négative sur I, f est…",["strictement décroissante","strictement croissante","constante"],"strictement décroissante","Relie le signe de f′ et la variation.","Une dérivée négative signifie une fonction strictement décroissante."),
 n("d05","Minimum de f(x)=x²−6x+8 ?",-1,"Sommet de parabole ou dérivée nulle.","f=(x−3)²−1, minimum −1 en x=3."),
 c("d06","Dérivée de u(x)v(x) ?",["u′v+uv′","u′v′","uv"],"u′v+uv′","Règle du produit.","Le produit demande u′v + uv′."),
 c("d07","f″(x)>0 partout sur I signifie que f est…",["convexe","concave","forcément positive"],"convexe","Signe de la dérivée seconde.","f″>0 entraîne une fonction convexe sur I.")
]},
{slug:"limites",title:"Limites et asymptotes",lesson:"07-limites-asymptotes.md",jalons:[11,13],questions:[
 n("l01","Limite de (3x²−x)/(x²+1) quand x→+∞ ?",3,"Divise par x².","(3−1/x)/(1+1/x²) tend vers 3."),
 n("l02","Limite de (x²−4)/(x−2) quand x→2 ?",4,"Factorise le numérateur.","(x−2)(x+2)/(x−2) = x+2 pour x≠2 ; limite 4."),
 c("l03","Limite de 1/(x−2) lorsque x→2 par valeurs supérieures ?",["+∞","−∞","0"],"+∞","Le dénominateur est positif et très petit.","1/(x−2) tend vers +∞ lorsque x→2⁺."),
 c("l04","Asymptote verticale de f(x)=1/(x+3) ?",["x=−3","y=−3","x=3"],"x=−3","La limite devient infinie près du dénominateur nul.","x+3=0 en x=−3 ; asymptote verticale x=−3."),
 c("l05","Asymptote horizontale de (2x+1)/(x−1) ?",["y=2","x=1","y=1"],"y=2","Compare les coefficients de plus haut degré.","Le rapport des coefficients dominants est 2 ; y=2 à l'infini."),
 c("l06","Asymptote oblique de (x²+1)/(x−1) ?",["y=x+1","y=x−1","y=1"],"y=x+1","Effectue une division polynomiale.","(x²+1)/(x−1)=x+1+2/(x−1), avec dernier terme→0."),
 n("l07","Limite de 1/x quand x→+∞ ?",0,"Le dénominateur devient grand.","1/x tend vers 0 quand x tend vers +∞."),
 c("l08","Une valeur interdite du domaine entraîne-t-elle toujours une asymptote verticale ?",["non","oui"],"non","Pense à un trou amovible.","(x²−1)/(x−1) n'est pas définie en 1 mais sa limite est 2, pas l'infini."),
 c("l09","Asymptote oblique de f(x)=x+3+4/(x−2) quand x→+∞ ?",["y=x+3","y=x−3","y=4","x=2"],"y=x+3","Soustrais la droite et étudie la limite du reste.","f(x)−(x+3)=4/(x−2)→0 à l’infini. Donc y=x+3 est asymptote oblique ; x=2 est une asymptote verticale."),
 c("l10","Limite de 5/(x−2) quand x tend vers 2 par valeurs inférieures ?",["−∞","+∞","0"],"−∞","Le dénominateur est négatif et tend vers 0.","Pour x<2, x−2<0 et 5>0 ; le quotient devient négatif sans borne en approchant 2 par la gauche."),
 n("l11","Limite de (√(x+4)−2)/x lorsque x→0 ?",0.25,"Multiplie par le conjugué √(x+4)+2.","Pour x≠0, la fraction vaut 1/(√(x+4)+2). La limite en 0 existe et vaut 1/(2+2)=1/4. La fonction initiale reste non définie en x=0."),
 n("l12","f(x)=x+2+3/(x−1). Calculer f′(3).",0.25,"Dérivée de 3/(x−1) : −3/(x−1)².","Sur x≠1, f′(x)=1−3/(x−1)². En x=3, f′(3)=1−3/4=1/4 ; toujours vérifier le domaine.")
]},
{slug:"continuite",title:"Continuité et TVI",lesson:"08-continuite-tvi.md",jalons:[14],questions:[
 c("t01","f continue sur [0;2], f(0)=−1 et f(2)=4 : le TVI garantit…",["au moins un zéro","exactement un zéro","aucun zéro"],"au moins un zéro","Le signe change entre les deux bornes.","Par continuité et changement de signe, f s'annule au moins une fois."),
 c("t02","Pour montrer qu'une racine est unique après le TVI, on utilise…",["la stricte monotonie","seulement un dessin","l'existence du domaine"],"la stricte monotonie","Une fonction strictement monotone ne prend chaque valeur qu'une fois.","Le TVI donne l'existence ; la stricte monotonie donne l'unicité."),
 n("t03","f(x)=x³−2. Combien vaut f(1) ?",-1,"Remplace x par 1.","1³−2=−1. Cette valeur est négative à l'extrémité gauche de l'intervalle."),
 n("t04","f(x)=x³−2. Combien vaut f(2) ?",6,"Remplace x par 2.","2³−2=6. Cette valeur est positive à l'extrémité droite de l'intervalle."),
 c("t05","Le TVI s'applique directement si f est…",["continue sur [a;b]","seulement dérivable en a","non définie en a"],"continue sur [a;b]","Relis ses hypothèses.","L'hypothèse centrale est la continuité sur tout l'intervalle fermé."),
 n("t06","Largeur d'un intervalle de départ 1 après 4 étapes de dichotomie ?",1/16,"Chaque étape divise la largeur par 2.","Largeur = 1/2⁴ = 1/16."),
 n("t07","Pour h(x)=x³+x−1, combien vaut h(0,5) ?",-0.375,"Calcule 0,5³+0,5−1.","0,5³=0,125 ; 0,125+0,5−1=−0,375=−3/8. La racine de h est donc à droite de 0,5 si h est croissante."),
 n("t08","Pour h(x)=x³+x−1, combien vaut h(0,75) ?",0.171875,"Exprime 0,75=3/4 puis calcule le cube.","h(3/4)=27/64+3/4−1=(27+48−64)/64=11/64=0,171875, de signe positif."),
 c("t09","h(x)=x³+x−1 est continue et strictement croissante. Après les essais h(0,5)<0 et h(0,75)>0, quel intervalle encadre son unique zéro ?",["0,5 < x < 0,75","0 < x < 0,5","0,75 < x < 1"],"0,5 < x < 0,75","Conserve la moitié où les valeurs aux bornes ont des signes opposés.","Par le TVI, la racine est dans ]0,5;0,75[ car la fonction est continue. Sa dérivée h′(x)=3x²+1>0 justifie son unicité."),
 c("t10","g(x)=eˣ−3 possède un zéro sur [0;2]. Quelle propriété prouve qu’il est unique ?",["g′(x)=eˣ>0","g(0)<0 et g(2)>0 seulement","g est continue seulement"],"g′(x)=eˣ>0","Le TVI garantit l’existence mais pas l’unicité.","La dérivée g′(x)=eˣ est strictement positive sur [0;2]. Donc g est strictement croissante et ne peut s’annuler qu’une fois au plus.")
]},
{slug:"suites",title:"Suites numériques",lesson:"10-suites.md",jalons:[15],questions:[
 n("u01","Suite arithmétique u₀=3, raison 4 : u₅ ?",23,"uₙ = u₀ + nr.","3+5×4=23. On part du terme de rang zéro et on ajoute cinq fois la raison."),
 n("u02","Suite géométrique v₀=2, raison 3 : v₃ ?",54,"vₙ = v₀ qⁿ.","2×3³=54. Une suite géométrique multiplie par sa raison à chaque nouveau rang."),
 n("u03","Somme 1+2+⋯+10 ?",55,"n(n+1)/2.","10×11/2=55. C'est la formule de la somme des n premiers entiers naturels."),
 c("u04","Si |q|<1, la limite de qⁿ vaut…",["0","+∞","q"],"0","Puissances d'un nombre de module inférieur à un.","qⁿ tend vers 0 lorsque n→∞."),
 n("u05","u₀=0, uₙ₊₁=0,5uₙ+2 : point fixe L ?",4,"Résous L=0,5L+2.","0,5L=2, donc L=4."),
 n("u06","Suite u₀=5, raison −2 : u₄ ?",-3,"Quatre fois soustraire 2.","u₄=5+4×(−2)=−3."),
 c("u07","uₙ=2(−1)ⁿ converge-t-elle ?",["non, elle oscille","oui vers 0","oui vers 2"],"non, elle oscille","Regarde les termes pairs et impairs.","Elle alterne entre 2 et −2 : pas de limite.")
]},
{slug:"explog",title:"Logarithme et exponentielle",lesson:"09-exponentielle-logarithme.md",jalons:[16,17],questions:[
 n("x01","Résoudre e^(2x)=e^6. Valeur de x ?",3,"L'exponentielle est injective.","2x=6 donc x=3. L'égalité des exponentielles impose l'égalité de leurs exposants réels."),
 c("x02","Domaine de ln(x−2) ?",["x>2","x≥2","tous les réels"],"x>2","Argument du logarithme strictement positif.","ln(x−2) impose x−2>0."),
 n("x03","Résoudre ln(x)=0. Valeur de x ?",1,"ln(1)=0.","x=1 car ln(1)=0."),
 c("x04","Dérivée de e^(3x) ?",["3e^(3x)","e^(3x)","3e^x"],"3e^(3x)","Règle de la chaîne.","(e^u)′=u′e^u ; ici u′=3."),
 c("x05","Dérivée de ln(2x+1) ?",["2/(2x+1)","1/(2x+1)","2ln(2x+1)"],"2/(2x+1)","(ln u)′=u′/u.","La dérivée est 2/(2x+1) pour x>−1/2."),
 c("x06","ln(ab) vaut, si a,b>0…",["ln(a)+ln(b)","ln(a)+b","ln(a+b)"],"ln(a)+ln(b)","Logarithme d'un produit.","ln(ab)=ln(a)+ln(b), mais pas ln(a+b)."),
 n("x07","Combien vaut ln(e²) ?",2,"ln et exp sont réciproques.","ln(e²)=2. Le logarithme népérien et la fonction exponentielle sont réciproques."),
 c("x08","Signe de e^x pour tout réel x ?",["strictement positif","peut être négatif","nul si x<0"],"strictement positif","La courbe approche 0 sans l'atteindre.","e^x>0 sur tous les réels."),
 n("x09","Résoudre ln(x−1)=ln(4). Valeur de x ?",5,"Égalité des ln => égalité des arguments positifs.","x−1=4 ⇒ x=5, ce qui satisfait x>1.")
]},
{slug:"integrales",title:"Primitives et intégrales",lesson:"15-primitives-integrales.md",jalons:[18],questions:[
 n("i01","Calculer ∫ de 0 à 2 de 3x² dx.",8,"Primitive de 3x² : x³.","[x³]₀²=8. On applique le théorème fondamental du calcul intégral aux bornes."),
 n("i02","Calculer ∫ de 0 à 1 de 2x dx.",1,"Primitive de 2x : x².","[x²]₀¹=1. La primitive de 2x est x² et l'évaluation se fait entre 0 et 1."),
 c("i03","Une primitive de 6x+1 est…",["3x²+x","6x²+x","3x+1"],"3x²+x","Dérive chacune des propositions.","La dérivée de 3x²+x est 6x+1. Ajouter une constante pour toutes les primitives."),
 n("i04","Calculer ∫ de 0 à 1 de (x−1) dx.",-0.5,"Une intégrale peut être négative.","[x²/2−x]₀¹=1/2−1=−1/2."),
 c("i05","Aire entre y=x−1 et l'axe, sur [0;2] ?",["1","0","−1"],"1","Sépare aux points où la courbe traverse l'axe.","Aire = ∫₀¹(1−x)dx + ∫₁²(x−1)dx = 1."),
 c("i06","La formule de l'intégration par parties est…",["∫uv′=[uv]−∫u′v","∫uv′=u′v′","∫uv′=uv"],"∫uv′=[uv]−∫u′v","Dérive le produit uv.","(uv)′=u′v+uv′ ; en intégrant, ∫uv′=[uv]−∫u′v."),
 n("i07","Calculer ∫ de 1 à e de 1/x dx.",1,"Primitive sur x>0 : ln x.","[ln x]₁ᵉ=1−0=1."),
 n("i08","Calculer ∫ de 0 à 2 de x dx.",2,"Primitive de x : x²/2.","[x²/2]₀² = 4/2 = 2.")
]},
{slug:"probas",title:"Probabilités et variables aléatoires",lesson:"12-probabilites.md",jalons:[19,20],questions:[
 n("p01","Une urne a 3 rouges et 2 bleues. P(rouge) en un tirage ?",0.6,"Issues favorables divisées par total.","3/(3+2) = 3/5 = 0,6."),
 n("p02","Pièce équilibrée, deux lancers. P(exactement une face) ?",0.5,"Énumère FF, FP, PF, PP.","Deux cas favorables sur quatre : 1/2."),
 n("p03","X~Bin(3;0,5). P(X=2) ?",0.375,"Combinaisons : C(3,2)×0,5³.","3×(1/2)³=3/8=0,375."),
 n("p04","X~Bin(4;0,25). Quelle est E(X) ?",1,"Espérance binomiale np.","4×0,25=1. Pour une loi binomiale l'espérance est toujours le produit n×p."),
 n("p05","P(A)=0,4, P(B)=0,5 et A,B indépendants. P(A∩B) ?",0.2,"Multiplier pour deux événements indépendants.","0,4×0,5=0,2. C'est précisément la propriété de deux événements indépendants."),
 n("p06","P(A∩B)=0,12 et P(B)=0,3. P(A|B) ?",0.4,"Définition de la conditionnelle.","0,12/0,3=0,4. La conditionnelle est le quotient de l'intersection par la probabilité de l'événement conditionnant."),
 n("p07","P(X=1)=0,2, P(X=3)=0,8. Quelle est E(X) ?",2.6,"Somme des valeurs pondérées.","1×0,2+3×0,8=2,6."),
 n("p08","P(A)=0,2. Quelle est P(non A) ?",0.8,"Événement contraire.","1−0,2=0,8. Un événement et son contraire constituent une partition de probabilité totale 1."),
 n("p09","X~Bin(2;0,2). P(X≥1) ?",0.36,"Utilise l'événement contraire X=0.","1−P(X=0)=1−0,8²=0,36."),
 n("p10","P(A)=0,2, P(B|A)=0,7, P(B|non A)=0,1. Calculer P(B).",0.22,"Additionne les deux chemins A∩B et non A∩B.","Formule des probabilités totales : P(B)=0,2×0,7+0,8×0,1=0,14+0,08=0,22."),
 n("p11","P(A)=0,2, P(B|A)=0,7, P(B|non A)=0,1. Calculer P(A|B).",0.6363636363636364,"Calcule d’abord P(B), puis utilise Bayes.","P(A∩B)=0,2×0,7=0,14. P(B)=0,14+0,08=0,22 ; donc P(A|B)=0,14/0,22=7/11≈0,63636. Ne pas répondre 0,7."),
 n("p12","Sac de 3 boules rouges et 2 bleues. On tire deux boules sans remise. P(deux rouges) ?",0.3,"La composition du sac change après le premier tirage rouge.","P(R1∩R2)=(3/5)×(2/4)=6/20=3/10. Sans remise, les tirages ne sont pas indépendants."),
 n("p13","X suit une loi binomiale B(8;0,25). Quelle est sa variance ?",1.5,"Pour la loi binomiale, V(X)=n×p×(1−p).","V(X)=8×0,25×0,75=1,5. L’espérance vaut 8×0,25=2 : ce sont deux indicateurs différents.")
]}
];