# 05 — Fonctions, lecture de graphiques et domaines

**Objectifs :** utiliser $f(x)$, déterminer domaine et antécédents, comprendre variations, signes, fonctions usuelles, compositions et interpréter un modèle. Préreq. : 01–04. Durée : 5–8 h.

## 1. Qu'est-ce qu'une fonction ?
Une fonction $f$ associe à **chaque** nombre $x$ de son ensemble de définition **une seule** image $f(x)$. Le nombre $x$ est un **antécédent** de $f(x)$. Plusieurs antécédents peuvent avoir la même image. Exemple $f(x)=x^2$ : $f(3)=9$, et 9 a les deux antécédents $-3$ et $3$.

Sur un graphique $y=f(x)$ : lire $f(2)$ en montant verticalement depuis $x=2$ ; résoudre $f(x)=3$ en recherchant les intersections avec la **droite horizontale** $y=3$.

## 2. Ensemble de définition
- Une expression polynomiale est définie sur $\mathbb R$.
- Un dénominateur doit être **non nul** : $1/(x-4)$ exige $x\ne4$.
- Une racine carrée exige **radicande non négatif** : $\sqrt{2x-6}$ exige $x\ge3$.
- Un logarithme exige **argument strictement positif** (chapitre 09).

Exemple :
$$f(x)=\frac{\sqrt{x+1}}{x-2},\quad D_f=[-1;2[\cup]2;+\infty[.$$
Toujours écrire le domaine **avant** dérivation ou résolution.

## 3. Fonctions de référence
- Constante $f(x)=c$ : droite horizontale.
- Affine $f(x)=ax+b$ : pente $a$, ordonnée à l'origine $b$ ; croît pour $a>0$.
- Carré $x^2$ : parabole, minimum 0.
- Cube $x^3$ : strictement croissante.
- Inverse $1/x$ : hyperbole, deux branches, $x\ne0$.
- Racine $\sqrt x$ : domaine $[0;+\infty[$, croissante.

Pour une droite passant par $(1;3)$ et $(4;9)$, pente $a=(9-3)/(4-1)=2$ puis $b=1$ : $y=2x+1$.

## 4. Variations, extremums et signes
Une fonction est **croissante** si $x_1<x_2$ implique $f(x_1)\le f(x_2)$ ; décroissante si l'inégalité inverse. Pour $f(x)=-(x-2)^2+5$, elle croît jusqu'à 2, puis décroît ; maximum 5 en 2.

Ne pas confondre **signe** de la fonction ($f(x)\ge0$ ?) et **sens de variation** (la fonction monte-t-elle ?). Une fonction positive peut décroître.

## 5. Composition et transformations
$f\circ g$ désigne $f(g(x))$. Exemple : $f(t)=t^2$, $g(x)=x+1$, alors $f(g(x))=(x+1)^2$ mais $g(f(x))=x^2+1$. L'ordre compte.

Transformations de graphes : $f(x)+k$ translate verticalement de $k$ ; $f(x-h)$ translate vers la droite de $h$ ; $-f(x)$ retourne par rapport à l'axe horizontal.

## 6. Résoudre avec une fonction
Pour $f(x)=2x^2-3$, résoudre $f(x)=5$ : $2x^2-3=5$, donc $x^2=4$ et $x=-2$ ou $2$. Pour $f(x)>5$, $x^2>4$ donne $]-\infty;-2[\cup]2;+\infty[$.

## Exercices
1. Soit $f(x)=x^2-4x+3$. Calculer $f(0)$, $f(2)$ et résoudre $f(x)=0$.
2. Trouver le domaine de $g(x)=\sqrt{5-2x}$.
3. Trouver le domaine de $h(x)=\frac1{(x-1)(x+2)}$.
4. Équation de la droite passant par $A(0;-2)$ et $B(3;4)$ ?
5. Pour $f(x)=x^2$ et $g(x)=x-2$, calculer $f\circ g$ et $g\circ f$.
6. Résoudre $(x+1)^2=9$.
7. Donner les variations et l'extremum de $p(x)=-(x+1)^2+4$.

---

## Corrigés
1. $f(0)=3$ ; $f(2)=4-8+3=-1$ ; $(x-1)(x-3)=0\Rightarrow x=1,3$.
2. $5-2x\ge0\Rightarrow \boxed{D_g=]-\infty;5/2]}$.
3. $\boxed{D_h=\mathbb R\setminus\{-2,1\}}$.
4. Pente $(4-(-2))/(3-0)=2$, ordonnée $-2$ : $\boxed{y=2x-2}$.
5. $\boxed{(f\circ g)(x)=(x-2)^2}$ et $\boxed{(g\circ f)(x)=x^2-2}$.
6. $x+1=3$ ou $x+1=-3$ : $\boxed{x=2\text{ ou }-4}$.
7. Parabole tournée vers le bas, sommet $(-1;4)$ ; croît sur $]-\infty;-1]$, décroît sur $[-1;+\infty[$ ; maximum $4$.

## Maîtrise
Savoir expliquer **image vs antécédent**, déterminer les restrictions de domaine et construire une équation de droite sans modèle.