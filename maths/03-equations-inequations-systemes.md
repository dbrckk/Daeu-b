# 03 — Équations, inéquations, systèmes et tableaux de signes

**Objectifs :** résoudre avec équivalences correctes, gérer les dénominateurs et inégalités, résoudre systèmes 2×2 et produits/quotients par signe. Préreq. : 01–02. Durée : 6–9 h.

## 1. Équation du premier degré
Résoudre $ax+b=cx+d$ consiste à faire la **même opération des deux côtés**. Exemple :
$$3(x-2)=2x+5\Longleftrightarrow 3x-6=2x+5\Longleftrightarrow\boxed{x=11}.$$
Vérification : gauche $3(9)=27$, droite $22+5=27$.

Si $a=c$ après simplification : soit impossible ($0=5$), soit tous les réels vérifient ($0=0$).

## 2. Équations produit et quotient
Un produit vaut zéro si et seulement si au moins un facteur vaut zéro :
$$(x-3)(2x+1)=0\Longleftrightarrow x=3\ \mathrm{ou}\ x=-1/2.$$
Pour $\frac{x+1}{x-2}=3$ : domaine $x\ne2$, puis $x+1=3x-6$, d'où $x=7/2$, autorisé.
Ne jamais multiplier par une expression de signe inconnu dans une **inéquation** sans étudier ce signe.

## 3. Inéquations linéaires et intervalles
Addition/soustraction préservent le sens. **Multiplier ou diviser par un nombre négatif inverse le signe** :
$$-2x+3\le7\Longleftrightarrow -2x\le4\Longleftrightarrow x\ge-2.$$
Solution : $[-2;+\infty[$.

Notations : $[a;b]$ inclut les bornes, $]a;b[$ exclut, $\cup$ unit, $\cap$ intersecte. Ne jamais inclure $\pm\infty$ comme borne fermée.

## 4. Tableau de signes d'un produit
Pour $(x-1)(x+2)>0$ :
- zéros $x=-2$ et $x=1$ ;
- pour $x<-2$ les deux facteurs sont négatifs : produit positif ;
- pour $-2<x<1$, signes opposés : négatif ;
- pour $x>1$, positifs : positif.
Donc $S=]-\infty;-2[\cup]1;+\infty[$.

Pour $(x-1)/(x+2)\ge0$, mêmes signes, mais **$x=-2$ interdit** et **$x=1$ admis** : $S=]-\infty;-2[\cup[1;+\infty[$.

## 5. Systèmes de deux équations
**Substitution :** $\left\{\begin{aligned}x+y&=7\\2x-y&=5\end{aligned}\right.$. De $y=7-x$, on tire $2x-(7-x)=5$, soit $3x=12$. Solution $\boxed{(x,y)=(4,3)}$.

**Combinaison :** additionner $x+y=7$ et $2x-y=5$ fait disparaître $y$.

Trois situations : une solution (deux droites sécantes), aucune (parallèles distinctes), infinité (droites confondues).

## 6. Valeur absolue
$|x|$ mesure la distance à zéro. $|x-3|=2$ correspond à $x-3=2$ ou $x-3=-2$, donc $x=5$ ou $x=1$. Et $|x|<2$ équivaut à $-2<x<2$.

## 7. Modélisation
Un rectangle a un périmètre de 30 cm, longueur $L$ de 3 cm supérieure à largeur $l$. $2(L+l)=30$, $L=l+3$, soit $2l+3=15$, $l=6$ et $L=9$ cm. Toujours vérifier les unités et la cohérence.

## 8. Atelier approfondi — système, inéquation rationnelle et vérification

**Situation concrète.** Deux types de billets coûtent respectivement \(x\) et \(y\) euros. Trois billets du premier type et deux du second coûtent 19 €, et le premier coûte 3 € de plus que le second.

**1. Poser le système en précisant le sens des inconnues :**

\[
\begin{cases}3x+2y=19\\x-y=3.\end{cases}
\]

**2. Substitution.** La seconde équation donne \(x=y+3\). Dans la première :

\[
3(y+3)+2y=19\iff5y+9=19\iff y=2,\quad x=5.
\]

**3. Vérification obligatoire.** \(3\times5+2\times2=19\) et \(5-2=3\). Les deux prix sont positifs. Conclusion : **5 €** pour le premier billet et **2 €** pour le second.

**4. Passer à une inéquation rationnelle.** Résoudre

\[
\frac{2x-6}{x+1}\le0.
\]

Le numérateur s'annule en \(3\), le dénominateur en \(-1\). Le domaine est \(\mathbb R\setminus\{-1\}\), même si l'on obtient une égalité dans un autre calcul. En ordonnant les valeurs critiques \(-1<3\) :

| Intervalle | \(2x-6\) | \(x+1\) | Quotient |
|---|---|---|---|
| \(]-\infty;-1[\) | \(-\) | \(-\) | \(+\) |
| \(]-1;3[\) | \(-\) | \(+\) | \(-\) |
| \(]3;+\infty[\) | \(+\) | \(+\) | \(+\) |

On cherche un résultat négatif **ou nul**. Le quotient vaut zéro en \(x=3\), où le dénominateur n'est pas nul. Il n'est jamais défini en \(x=-1\). On conclut :

\[
\boxed{S=]-1;3]}.
\]

Ne jamais « multiplier par \(x+1\) » directement dans une inéquation sans connaître son signe, car cela peut inverser le sens de l'inégalité.

### Deux problèmes de transfert

**A.** Résoudre le système \(2x+3y=17\) et \(x+y=7\), avec vérification dans les deux équations.

**B.** Résoudre \((x-4)/(x+2)\ge0\), en justifiant les valeurs incluses et exclues.

### Corrections commentées

**A.** \(x=7-y\). Donc \(2(7-y)+3y=17\), soit \(14+y=17\), d'où \(y=3\) et \(x=4\). Vérification : \(2\times4+3\times3=17\), et \(4+3=7\). On conclut \(\boxed{(x,y)=(4,3)}\).

**B.** La valeur \(x=-2\) annule le dénominateur : elle est interdite. Le numérateur s'annule en 4 : cette borne est admise pour \(\ge0\). La fraction est positive quand les deux facteurs ont le même signe, soit \(x<-2\) ou \(x>4\). Conclusion : \(\boxed{S=]-\infty;-2[\cup[4;+\infty[}\).

**Erreur typique :** confondre « solution qui annule le numérateur » et « valeur qui annule le dénominateur » ; la seconde n'appartient jamais au domaine.

---

## Exercices
1. Résoudre $5(2x-1)-3x=9$.
2. Résoudre $(x+4)(3x-6)=0$.
3. Résoudre $7-3x>1$.
4. Résoudre $(x-4)(x+1)\le0$.
5. Résoudre $\frac{2x-1}{x+3}<0$.
6. Résoudre le système $2x+y=8$, $x-y=1$.
7. Résoudre $\frac{2}{x-1}=1$, avec interdits.
8. Résoudre $|2x-1|\le3$.

---

## Corrigés
1. $10x-5-3x=9\Rightarrow7x=14\Rightarrow\boxed{x=2}$.
2. $x+4=0$ ou $3x-6=0$ : $\boxed{\{-4,2\}}$.
3. $-3x>-6$ donc $\boxed{x<2}$ (inversion).
4. Racines $-1$ et $4$, produit négatif entre : $\boxed{[-1;4]}$.
5. Zéro du numérateur $1/2$, pôle $-3$. Négatif entre $-3$ et $1/2$ : $\boxed{]-3;1/2[}$ ; $-3$ interdit.
6. $y=x-1$ puis $2x+x-1=8$ : $\boxed{x=3,y=2}$.
7. Domaine $x\ne1$ ; $2=x-1$ donc $\boxed{x=3}$.
8. $-3\le2x-1\le3$, donc $-2\le2x\le4$, soit $\boxed{x\in[-1;2]}$.

## Maîtrise
En cas de doute sur un signe, faire un tableau **avec les zéros et pôles**. Vérifier chaque solution d'équation et exclure toute valeur interdite.