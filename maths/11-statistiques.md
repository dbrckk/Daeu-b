# 11 — Statistiques : moyenne, médiane, quartiles, écart-type

**Objectifs :** calculer indicateurs, comparer des distributions, interpréter la dispersion, connaître la différence entre estimation et certitude. Préreq. : 01. Durée : 5–7 h.

## 1. Population, effectifs et fréquences
Une série $x_1,\ldots,x_N$ rassemble $N$ observations. Une valeur $a_i$ apparaît $n_i$ fois (son **effectif**) ; sa fréquence est $f_i=n_i/N$, et $\sum f_i=1$.

Exemple : notes 8 (2 élèves), 12 (3 élèves), 16 (1 élève) ; effectif $N=6$, fréquences $2/6$, $3/6$, $1/6$.

## 2. Moyenne et moyenne pondérée
$$\bar x=\frac{x_1+\cdots+x_N}{N}=\frac{\sum n_i a_i}{N}.$$
Exemple précédent : $(2\times8+3\times12+1\times16)/6=\boxed{68/6\approx11{,}33}$.

La moyenne est sensible aux valeurs extrêmes : données 1, 1, 1, 17 → moyenne 5 alors que trois valeurs sont 1.

## 3. Médiane et quartiles
**Toujours trier la série.** Médiane : valeur centrale si $N$ impair ; moyenne des deux valeurs centrales si $N$ pair. Ex. 2,3,7,10 → médiane $(3+7)/2=5$.

Une convention fréquemment utilisée en France pour les quartiles : $Q_1$ = valeur de rang $\lceil N/4\rceil$ et $Q_3$ = valeur de rang $\lceil3N/4\rceil$ dans la série ordonnée (commencer les rangs à 1). D'autres logiciels utilisent une interpolation : se conformer à la convention de son université.

Étendue : $\max-\min$. Écart interquartile : $Q_3-Q_1$ (mesure la dispersion centrale).

## 4. Variance et écart-type
Pour la **population complète** :
$$V=\frac1N\sum_{i=1}^N(x_i-\bar x)^2,\qquad \sigma=\sqrt V.$$
Formule de calcul équivalente : $V=\frac1N\sum x_i^2-\bar x^2$ (tenir compte des effectifs). $\sigma$ possède la **même unité** que les données.

Exemple pour $2,4,6$ : moyenne 4 ; variance $[(2-4)^2+0^2+(6-4)^2]/3=8/3$ ; $\sigma=\sqrt{8/3}\approx1{,}633$.

**Attention :** l'écart-type corrigé d'un échantillon utilise $N-1$ et n'est pas la même quantité. Ici on emploie l'écart-type de la série descriptive, avec $N$.

## 5. Comparer deux séries
A : $10,10,10,10$ ; B : $0,10,10,20$. Les deux ont moyenne 10, mais A a écart-type nul, tandis que B est beaucoup plus dispersée. Une moyenne sans indicateur de dispersion est insuffisante.

## 6. Fréquence estimée et intervalle de confiance (complément local)
Pour une proportion inconnue $p$, observer une fréquence $\hat p$ sur $n$ essais aléatoires indépendants. Si l'approximation normale convient (effectifs de succès et d'échecs suffisamment grands), un intervalle **approximatif à 95 %** est :
$$\left[\hat p-1{,}96\sqrt{\frac{\hat p(1-\hat p)}n}\;;\;\hat p+1{,}96\sqrt{\frac{\hat p(1-\hat p)}n}\right]$$
à tronquer à $[0;1]$ si nécessaire. Il décrit la performance de la **procédure d'estimation à long terme**, pas une probabilité de 95 % que ce paramètre fixe varie au hasard.
Exemple $\hat p=0{,}5$, $n=100$ : marge $\approx0{,}098$, intervalle approximatif $[0{,}402;0{,}598]$. Les méthodes exactes ou Wilson sont préférables pour petits échantillons ; suivre celle enseignée par l'établissement.

## Exercices
1. Calculer la moyenne de 5, 7, 9, 11.
2. Donner médiane et quartiles (convention par rang) de 1,2,3,4,5,6,7,8.
3. Calculer la moyenne pondérée : 12 (coef. 2), 15 (coef. 3), 7 (coef. 1).
4. Calculer variance et écart-type de 1, 2, 3.
5. Deux séries ont même moyenne ; l'une a $\sigma=0$. Qu'en déduire ?
6. Une enquête a 60 réponses « oui » sur 100. Donner la fréquence et l'écart-type **approché de l'estimateur de proportion** $\sqrt{\hat p(1-\hat p)/n}$.
7. Pourquoi 10,10,10 et 0,10,20 ont-elles la même moyenne mais pas la même dispersion ?

---

## Corrigés
1. $(5+7+9+11)/4=\boxed8$.
2. Médiane $(4+5)/2=\boxed{4{,}5}$ ; $Q_1=$ rang 2 $=\boxed2$ ; $Q_3=$ rang 6 $=\boxed6$.
3. $(12\cdot2+15\cdot3+7\cdot1)/6=(24+45+7)/6=\boxed{76/6=38/3\approx12{,}67}$.
4. $\bar x=2$ ; $V=(1+0+1)/3=\boxed{2/3}$ ; $\sigma=\boxed{\sqrt{2/3}\approx0{,}816}$.
5. Tous les éléments observés valent la moyenne : **aucune dispersion**.
6. $\hat p=60/100=\boxed{0{,}6}$ ; écart-type estimé $\sqrt{0{,}6\cdot0{,}4/100}=\boxed{\sqrt{0{,}0024}\approx0{,}049}$.
7. Les moyennes valent 10 ; la première variance vaut 0, la seconde vaut $(100+0+100)/3=200/3$.

## Maîtrise
Savoir distinguer médiane et moyenne, indiquer quelle convention de quartiles est employée, ne pas confondre l'écart-type d'une distribution et l'incertitude d'une estimation.