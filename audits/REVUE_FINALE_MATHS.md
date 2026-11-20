# Revue pédagogique finale · échantillon des 20 jalons

Périmètre : une question fixe, une variante et un transfert de la série A par jalon obligatoire. Les références renvoient à la [banque fixe](../app/questions.mjs), aux [générateurs](../app/variants.mjs), aux [corrigés de transfert](../transferts/corriges.md) et au [programme](../PROGRAMME.md). Les variantes sont matérialisées par `materializeVariant` avec `random:()=>0.125`, donnant la graine 536870912. Les résultats de l’échantillon ont été recalculés puis comparés aux réponses du site.

| Jalon | Cours | Question fixe · contrôle | Variante · contrôle | Transfert A · contrôle |
|---|---:|---|---|---|
| 1 · Entiers | 01 | n06 · (−3)×(−4)+2=14 | v01 · 9+4×7=37 | T01 · 126=14×9 et 108=12×9, restes nuls |
| 2 · Rationnels | 01 | n09 · 15/24−4/24=11/24 | v02 · (3+7)/8=5/4 | T02 · prélèvements sur le même volume, 200×3/20=30 L |
| 3 · Réels | 01 | n11 · (5−2)√2=3√2 | v03 · 4^(3−4)=1/4 | T03 · 4,24²<18<4,25², longueurs positives |
| 4 · Calcul littéral | 02 | a04 · coefficients 2, 5, −3 | v05 · 36+6+4=46 | T04 · aire (x+2)(x+5), 40 m² en x=3 |
| 5 · Équations | 03 | e10 · x≠1, 2=x−1 donc x=3 | v07 · 7x=56 donc x=8 | T05 · 18/1,8=10 km et vérification du tarif |
| 6 · Systèmes | 03 | e08 · addition, 3x=12 donc x=4 | v08 · 3x=6 donc x=2 | T06 · 10 adultes et 10 enfants, 140 € |
| 7 · Second degré | 04 | s05 · x²−1<0 pour −1<x<1, nul aux bornes | v10 · 4²−4×4×(−8)=144 | T07 · maximum 16, zéros 0 et 8, hauteur ≥12 pour 2≤x≤6 |
| 8 · Inéquations | 03 | e06 · −1 inclus, 2 exclu, signes identiques sur les deux intervalles retenus | v09 · x≤−2 | T08 · division par −3, intersection [−2;−1[ |
| 9 · Statistiques | 11 | st07 · (4+8)/2=6 | v12 · 25/4=6,25 | T09 · moyenne 7, médiane 6, étendue 7 |
| 10 · Fonctions | 05 | f03 · x−2≥0 donc x≥2 | v14 · 5−2=3 | T10 · 3 interdit, f(0)=−1/3 et antécédent de 1 égal à −4 |
| 11 · Limites | 07 | l11 · conjugué puis 1/(2+2)=1/4 | v16 · coefficients dominants 8/5 | T11 · limite 6, valeur en 3 exclue |
| 12 · Dérivées | 06 | l12 · domaine x≠1, f′(3)=1−3/4=1/4 | v17 · 10×4−2=38 | T12 · signe de −2x+12, maximum 16 en x=6 |
| 13 · Asymptotes | 07 | l06 · reste 2/(x−1) qui tend vers 0, droite y=x+1 | v19 · pôle x=1/2, numérateur non nul | T13 · deux pôles ±1, limite 2 aux deux infinis |
| 14 · TVI | 08 | t02 · la stricte monotonie assure au plus une racine | v20 · 5³=125 et x³ strictement croissante | T14 · signes opposés, f′>0, changement de signe entre 1,2 et 1,3 |
| 15 · Suites | 10 | u02 · 2×3³=54 | v22 · raison nulle, suite constante égale à 4 | T15 · 188,9568<200<204,073344, seuil au rang 4 |
| 16 · Logarithme | 09 | x05 · 2/(2x+1) sur x>−1/2 | v24 · x−1=7 et x>1, donc x=8 | T16 · t=5 ln 2, environ 3,47 périodes |
| 17 · Exponentielle | 09 | x01 · injectivité et 2x=6 | v25 · 6x=−6 donne −1 | T17 · 160 cellules après 6 h, 320 après 9 h |
| 18 · Intégrales | 15 | i05 · deux triangles d’aire 1/2 chacun | v26 · 5×36/2−12=78 | T18 · primitive t³+t², intégrale 12 et moyenne 6 |
| 19 · Probabilités | 12 | p12 · (3/5)×(2/4)=3/10 | v28 · 6/10=3/5 | T19 · RR=5/14, RB ou BR=15/28, dépendance sans remise |
| 20 · Variables aléatoires | 12 | p13 · 8×0,25×0,75=1,5 | v29 · 8×0,4=3,2 | T20 · E=1,1, E(X²)=1,7, V=0,49, P(X≥1)=0,8 |

Modifications issues de cette revue : cours 06 associé à `l12` en conservant son identifiant et sa réponse, définition de l’étendue, formulation de la médiane, distinction entre existence et unicité dans les corrections du TVI. Les variantes d’inéquations et d’asymptotes permettent déjà de calculer une borne ou une coordonnée avant de répondre. Le transfert écrit permet de justifier le signe ou la limite complète.

Les contrôles de [la matrice des jalons](../AUDIT_COUVERTURE.md), des [cinq sujets](../AUDIT_EXAMENS.md) et des résultats numériques des transferts A, B et C ont été rejoués. L’échantillon ne couvre pas chaque formulation possible des générateurs et la revue ne constitue pas une validation académique externe.

## Vérification de la correction en v126

Le [test des quiz](../app/engine.test.mjs) vérifie une bonne réponse et un piège par jalon obligatoire. Il recalcule aussi 3 280 énoncés issus des 41 modèles. Les cas couvrent notamment les fractions équivalentes, les bornes incluses ou exclues, la distinction entre une asymptote verticale et une droite horizontale, le signe des intégrales et les tirages sans remise. En saisie numérique, les espaces des groupes de milliers restent compatibles avec les fractions et les décimaux en français. Une saisie comme `1 2` est désormais signalée comme invalide.

### Examens interactifs fixes

| Sujet | Exercice 1 | Exercice 2 | Exercice 3 | Exercice 4 |
|---|---|---|---|---|
| A | Dérivée en 4 égale à 4, maximum 16 atteint en 6, positivité stricte sur ]2 ; 10[ | Raison 6/5, u₂ = 216, seuil au rang 4 et somme 546 | p = 3/5, P(X = 2) = 54/125, P(X ≥ 1) = 117/125 et E(X) = 9/5 | Primitive 2x² − 2x, intégrale 4, domaine x > 1 et solution x = 5 |
| B | f(2) = 5, pôle en 1, dérivée en 3 égale à 1/2 et asymptote y = x + 1 | Tarifs adulte 12 € et enfant 5 €, total demandé 41 € | Moyenne 7, médiane 6, variance 28/5 et étendue 7 | g(0) = −2, zéro ln(3) arrondi à 1,099, dérivée eˣ et unicité par stricte croissance |

Les [réponses recalculées des sujets A et B](../app/exam-engine.test.mjs) passent par le correcteur de l’application et donnent cinq points à chacun des huit exercices. La question B13 accepte 1,099 et une valeur plus précise proche de ln(3). Elle refuse le millième voisin. Le correcteur recalcule les anciennes copies à partir de leurs réponses et garde la rédaction enregistrée.

### Examens interactifs générés

Les contrôles reconstruisent les paramètres à partir des énoncés sur 1 003 graines par sujet. Ils couvrent les graines 0 à 999, 65 536, 2³¹ et 2³² − 1. Les tests de structure vérifient quatre exercices à cinq points et les grilles de rédaction sur 1 000 graines par sujet.

| Sujet | Recalcul des quatre exercices | Cas vérifiés |
|---|---|---|
| [C](../app/exam-generator.test.mjs) | Parabole, suite géométrique, loi binomiale, intégration | Racines exclues de la zone strictement positive, rang du seuil, fractions exactes en probabilités et en intégration |
| [D](../app/exam-alternative.test.mjs) | Fonction rationnelle, Bayes, statistiques, exponentielle | Pôle et asymptote distincts, variance divisée par l’effectif, zéro dans ]0 ; 2[, millième correct accepté et millième voisin refusé |
| [E](../app/exam-applied.test.mjs) | Système, triangle rectangle, probabilités sans remise, quotient avec racine | Fractions trigonométriques, ordre des tirages, borne incluse pour la racine et pôle exclu |
