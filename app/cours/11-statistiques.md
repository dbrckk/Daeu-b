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

## 7. Atelier de bout en bout — moyenne, quartiles et variance

On observe la série déjà ordonnée \(2,\ 4,\ 4,\ 7,\ 8,\ 11\), avec **six observations**.

**Étape 1 — Moyenne :**

\[
\bar x=\frac{2+4+4+7+8+11}{6}=\frac{36}{6}=\boxed6.
\]

La moyenne utilise **toutes** les observations, y compris les répétitions.

**Étape 2 — Médiane :** comme \(N=6\) est pair, on prend les valeurs des rangs 3 et 4, soit 4 et 7 ; la médiane vaut \(\boxed{(4+7)/2=5{,}5}\). Elle diffère de la moyenne 6, ce qui est possible.

**Étape 3 — Quartiles :** avec la convention française par rang (à vérifier selon l'établissement), \(Q_1\) a le rang \(\lceil 6/4\rceil=2\), soit \(\boxed4\). \(Q_3\) a le rang \(\lceil3\times6/4\rceil=5\), soit \(\boxed8\). L'écart interquartile vaut \(8-4=\boxed4\).

**Étape 4 — Variance de population :** la formule \(V=\overline{x^2}-\bar x^2\) évite six soustractions :

\[
\overline{x^2}=\frac{2^2+4^2+4^2+7^2+8^2+11^2}{6}
=\frac{270}{6}=45,
\quad V=45-6^2=\boxed9.
\]

L'écart-type de population est \(\sigma=\sqrt9=\boxed3\), dans la même unité que les observations. La variance est en **unité au carré**. L'étendue vaut \(11-2=\boxed9\), numériquement égale à la variance dans cet exemple par coïncidence : les deux notions restent différentes.

### Comparer deux séries sans se laisser tromper par la moyenne

Les séries \(A=(5,5,5,5)\) et \(B=(3,4,6,7)\) ont toutes deux pour moyenne 5. Cependant :

- \(V_A=0\) : toutes les valeurs sont identiques.
- \(V_B=((3-5)^2+(4-5)^2+(6-5)^2+(7-5)^2)/4=10/4=\boxed{2{,}5}\).
- \(\sigma_B=\sqrt{2{,}5}\approx1{,}581\) : B est plus dispersée.

Le choix entre **variance de population (division par \(N\))** et **variance d'échantillon corrigée (division par \(N-1\))** dépend de ce qui est demandé. Dans l'examen D, la convention est annoncée et le dénominateur est \(N\).

### Deux problèmes de transfert

**A.** Étudier \(1,\ 2,\ 4,\ 5\) : moyenne, médiane, \(Q_1\), \(Q_3\) et variance de population.

**B.** Pour \(2,\ 2,\ 6,\ 6\), calculer l'écart-type de population. Une variance nulle signifierait-elle que la moyenne vaut zéro ?

### Corrections commentées

**A.** Moyenne \(12/4=\boxed3\) ; médiane \((2+4)/2=\boxed3\). Avec les rangs \(\lceil4/4\rceil=1\) et \(\lceil3\times4/4\rceil=3\), \(Q_1=\boxed1\), \(Q_3=\boxed4\). Carrés des écarts à 3 : \(4,1,1,4\), somme 10 ; variance \(10/4=\boxed{2{,}5}\).

**B.** Moyenne 4, écarts \(-2,-2,+2,+2\), carrés \(4,4,4,4\). Variance \(16/4=4\), écart-type \(\boxed2\). Une variance nulle signifie **toutes les observations égales à la moyenne**, pas « moyenne nulle ».

**Pièges à surveiller :** oublier de trier, calculer les quartiles en interpolant sans préciser la convention, diviser par \(N-1\) alors que l'énoncé demande la population, confondre \(V\) et \(\sqrt V\).

---

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