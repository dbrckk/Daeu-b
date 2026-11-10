# 10 — Suites numériques : arithmétiques, géométriques, récurrence

**Objectifs :** calculer termes et sommes, trouver une formule explicite, étudier variations/limites, démontrer une propriété par récurrence. Préreq. : 01, 03, 05 et 07. Durée : 6–9 h.

## 1. Définition
Une suite est une fonction des entiers naturels : $u_0,u_1,u_2,\ldots$. Elle peut être **explicite**, par exemple $u_n=2n+3$, ou **récurrente**, par exemple $u_0=3$, $u_{n+1}=u_n+2$. Dans ce cas $u_1=5$, $u_2=7$.

Attention : $u_{n+1}$ n'est pas $u_n+1$.

## 2. Suite arithmétique
Raison $r$ si $u_{n+1}=u_n+r$ :
$$u_n=u_0+nr,\quad u_n=u_p+(n-p)r.$$
La suite est croissante si $r>0$, constante si $r=0$, décroissante si $r<0$.
Somme de $n+1$ termes de $u_0$ à $u_n$ :
$$S=(n+1)\frac{u_0+u_n}{2}.$$
Exemple : $u_0=5$, $r=3$ ; $u_{10}=35$, somme $u_0+\ldots+u_{10}=11(5+35)/2=\boxed{220}$.

## 3. Suite géométrique
Raison $q$ si $u_{n+1}=q u_n$ :
$$u_n=u_0q^n,\quad u_n=u_p q^{n-p}.$$
Somme des $n+1$ termes, pour $q\ne1$ :
$$S=u_0\,\frac{1-q^{n+1}}{1-q}.$$
Pour $q=1$, $S=(n+1)u_0$.
Exemple : $u_0=100$, $q=1{,}05$ ; $u_3=100(1{,}05)^3=115{,}7625$. Une croissance de 5 % donne une suite géométrique, pas arithmétique.

## 4. Comportement à l'infini
- Arithmétique : $u_0+nr\to+\infty$ si $r>0$ ; $\to-\infty$ si $r<0$.
- Géométrique : si $|q|<1$, $q^n\to0$ ; si $q>1$, $q^n\to+\infty$. Pour $q=-1$, la suite oscille ; pour $q<-1$, elle alterne avec amplitude croissante et **n'a pas de limite**.
- Une suite bornée et monotone est convergente (théorème utile en approfondissement).

## 5. Étudier une suite non standard
Pour étudier une variation, comparer $u_{n+1}-u_n$, et pour des termes **strictement positifs** on peut comparer $u_{n+1}/u_n$ à 1.

Exemple : $u_n=n^2-3n$ ; $u_{n+1}-u_n=(n+1)^2-3(n+1)-(n^2-3n)=2n-2$. Donc décroissante pour $n=0$, stationnaire à l'étape $n=1$, puis croissante.

## 6. Récurrence : prouver pour tout entier
Pour prouver $P(n)$ :
1. **Initialisation :** vérifier $P(0)$ (ou le premier rang).
2. **Hérédité :** supposer $P(n)$ et démontrer $P(n+1)$.
3. **Conclusion :** $P(n)$ est vraie pour tout $n$ visé.

Exemple : $1+2+\ldots+n=n(n+1)/2$ pour $n\ge1$.
Au rang 1 : $1=1(2)/2$. Si vrai pour $n$, ajout de $n+1$ :
$$\frac{n(n+1)}2+(n+1)=\frac{(n+1)(n+2)}2.$$
Donc vrai pour $n+1$.

## 7. Suite affine récurrente : méthode du point fixe
$u_{n+1}=0{,}5u_n+2$, $u_0=0$. Le point fixe $L$ satisfait $L=0{,}5L+2$, donc $L=4$. Poser $v_n=u_n-4$ :
$$v_{n+1}=0{,}5v_n,\quad v_0=-4,\quad u_n=4-4(0{,}5)^n.$$
La limite est $\boxed4$. Il faut montrer la convergence, pas seulement résoudre l'équation du point fixe.

## 8. Atelier approfondi — croissance géométrique et seuil entier

Un stock commence à \(u_0=160\) unités et augmente de **25 % par période**. On cherche la formule explicite, une somme, puis le premier rang où le stock atteint au moins 400 unités.

**1. Nature et raison.** Une hausse de 25 % multiplie par \(1{,}25\) :

\[
u_{n+1}=1{,}25u_n,\qquad \boxed{u_n=160(1{,}25)^n}.
\]

C'est une suite géométrique de raison \(q=1{,}25>1\), donc strictement croissante puisque ses termes sont positifs. Le **premier rang est \(n=0\)**.

**2. Calcul d'une somme de quatre termes.**

\[
S=u_0+u_1+u_2+u_3=160+200+250+312{,}5=\boxed{922{,}5}.
\]

On pouvait aussi utiliser la formule des quatre termes \(S=160(1-1{,}25^4)/(1-1{,}25)\). Attention : la somme de \(u_0\) à \(u_3\) contient **quatre** termes.

**3. Premier rang dépassant un seuil.** Pour \(u_n\ge400\) :

\[
160(1{,}25)^n\ge400
\iff (1{,}25)^n\ge 2{,}5
\iff n\ge\frac{\ln(2{,}5)}{\ln(1{,}25)}\approx4{,}106.
\]

Le premier entier admissible est **\(n=5\)**. Vérification des deux rangs voisins : \(u_4=390{,}625<400\) et \(u_5=488{,}28125\ge400\). Un résultat de calculatrice \(4{,}106\) n'est pas un numéro de période : il faut **prendre l'entier supérieur**.

**4. Suite affine à point fixe.** Pour une récurrence \(v_{n+1}=\frac34v_n+5\), le point fixe \(L\) satisfait \(L=\frac34L+5\), donc \(L=20\). En posant \(w_n=v_n-20\), on a \(w_{n+1}=\frac34w_n\). Comme \(|3/4|<1\), \(w_n\to0\), puis \(v_n\to20\). **Résoudre seulement l'équation du point fixe ne prouve pas la convergence** ; il faut justifier la décroissance de la puissance géométrique.

### Deux problèmes de transfert

**A.** Une suite a \(u_0=80\) et \(u_{n+1}=1{,}5u_n\). Donner \(u_0+u_1+u_2\) et le premier entier \(n\) tel que \(u_n\ge300\).

**B.** \(v_0=4\) et \(v_{n+1}=0{,}75v_n+5\). Donner \(v_2\), la formule explicite de \(v_n\) et sa limite.

### Corrections commentées

**A.** \(u_n=80(1{,}5)^n\). Les trois premiers termes sont 80, 120 et 180, somme \(\boxed{380}\). \(u_3=270<300\) et \(u_4=405\ge300\) ; le premier rang admissible est \(\boxed{n=4}\).

**B.** \(v_1=0{,}75\times4+5=8\) et \(v_2=0{,}75\times8+5=\boxed{11}\). Le point fixe \(L=20\) donne \(v_n=20+(v_0-20)(0{,}75)^n=\boxed{20-16(3/4)^n}\). Puisque \(0<3/4<1\), la limite vaut \(\boxed{20}\).

**Pièges à surveiller :** oublier que \(u_0\) est le premier terme, arrondir le logarithme du seuil au lieu de prendre l'entier admissible, affirmer une limite en calculant uniquement un point fixe.

---

## Exercices
1. $u_0=4$, $u_{n+1}=u_n-3$. Calculer $u_5$.
2. Calculer $\sum_{k=0}^{9}(2k+1)$.
3. $v_0=3$, $v_{n+1}=2v_n$. Calculer $v_6$.
4. Évaluer $1+1/2+1/4+1/8$.
5. Déterminer la limite de $w_n=5(0{,}8)^n$.
6. Déterminer variation de $u_n=n^2+n$ pour $n\ge0$.
7. Pour $u_0=2$, $u_{n+1}=0{,}5u_n+3$, trouver la formule de $u_n$ et la limite.
8. Prouver par récurrence que $\sum_{k=1}^{n}(2k-1)=n^2$.

---

## Corrigés
1. $u_5=4+5(-3)=\boxed{-11}$.
2. Somme des 10 premiers impairs, de 1 à 19 : $10(1+19)/2=\boxed{100}$.
3. $v_6=3\cdot2^6=\boxed{192}$.
4. Somme géométrique de raison $1/2$ : $\boxed{15/8}$.
5. $0<0{,}8<1$ : $\boxed0$.
6. $u_{n+1}-u_n=(n+1)^2+(n+1)-n^2-n=2n+2>0$ : strictement croissante.
7. Point fixe $L=6$ ; $v_n=u_n-6$, $v_0=-4$, raison $1/2$. $\boxed{u_n=6-4(1/2)^n}$ et $\boxed{\lim u_n=6}$.
8. Initialisation $n=1$ : 1=1². Si somme des $n$ impairs vaut $n^2$, l'impair suivant vaut $2n+1$ : $n^2+2n+1=(n+1)^2$ ; propriété établie.

## Maîtrise
Savoir repérer les rangs $u_0$ et $u_1$, distinguer somme et terme, et justifier une limite de suite affine **après** transformation géométrique.