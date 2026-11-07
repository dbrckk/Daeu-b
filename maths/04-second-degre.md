# 04 — Second degré : discriminant, parabole, inéquations

**Objectifs :** analyser $ax^2+bx+c$, résoudre équations et inéquations, utiliser formes développée/canonique/factorisée et modéliser un maximum ou minimum. Préreq. : 02–03. Durée : 6–9 h.

## 1. Formes et discriminant
Pour $a\ne0$, $P(x)=ax^2+bx+c$. Le discriminant est $\Delta=b^2-4ac$.
- $\Delta>0$ : deux racines $x_{1,2}=\frac{-b\pm\sqrt\Delta}{2a}$.
- $\Delta=0$ : une racine double $x_0=-b/(2a)$.
- $\Delta<0$ : aucune racine **réelle**.

Exemple : $x^2-5x+6=0$ : $a=1,b=-5,c=6$, $\Delta=25-24=1$ ; $x_1=2$, $x_2=3$. Ainsi $x^2-5x+6=(x-2)(x-3)$.

## 2. Forme canonique et sommet
$$P(x)=a(x-\alpha)^2+\beta,\quad\alpha=-\frac b{2a},\quad\beta=P(\alpha).$$
Sommet $S(\alpha;\beta)$, axe $x=\alpha$. Si $a>0$, la parabole s'ouvre vers le haut et atteint un **minimum** $\beta$ ; si $a<0$, maximum.

Exemple $P(x)=x^2-4x+1=(x-2)^2-3$. Sommet $(2;-3)$ et minimum $-3$.

## 3. Signe du trinôme
Si $\Delta>0$ et $x_1<x_2$, le signe est celui de $a$ **à l'extérieur** des racines et le signe opposé **à l'intérieur**.
- $x^2-5x+6\le0$ donne $[2;3]$.
- $-x^2+5x-6>0$ donne $]2;3[$.
Pour $\Delta<0$, le signe reste celui de $a$ pour tout réel.

## 4. Liens entre racines et coefficients
Si les racines $x_1,x_2$ sont réelles : $x_1+x_2=-b/a$ et $x_1x_2=c/a$. Ces relations permettent un contrôle rapide : $2+3=5$, $2\times3=6$.

## 5. Problème complet
On fabrique un enclos rectangulaire avec 20 m de clôture ; longueur $x$, largeur $10-x$ ; **domaine physique** $0<x<10$. L'aire est
$$A(x)=x(10-x)=-(x-5)^2+25.$$
Le maximum est $\boxed{25\,\text{m}^2}$ pour $x=5$ m (carré de côté 5 m). Le domaine vient du contexte et doit être justifié.

## 6. Méthode d'examen
Écrire $a,b,c$ → calculer $\Delta$ sans erreur de signe → calculer les racines → tableau de signes si inéquation → conclure par un **ensemble de solutions**. Pour une optimisation : domaine, expression, sommet, conclusion contextualisée.

## Exercices
1. Résoudre $2x^2-7x+3=0$.
2. Résoudre $x^2+2x+5=0$ dans $\mathbb R$.
3. Mettre $x^2+6x+5$ sous forme canonique ; trouver son minimum.
4. Résoudre $x^2-4x+3\ge0$.
5. Résoudre $-2x^2+8x-6>0$.
6. Le bénéfice (en euros) est $B(x)=-x^2+10x-9$, $x\in[0;10]$. Production optimale et bénéfice maximal ?
7. Écrire un polynôme de coefficient directeur $a=2$ ayant les racines $1$ et $-3$.
8. Résoudre $x^2-6x+9=0$.

---

## Corrigés
1. $\Delta=49-24=25$ ; $x=(7\pm5)/4$ : $\boxed{x=1/2\text{ ou }x=3}$.
2. $\Delta=4-20=-16<0$ ; $\boxed{\varnothing}$ dans $\mathbb R$ (des solutions complexes existent, cf. 16).
3. $(x+3)^2-4$ ; minimum $\boxed{-4}$ pour $x=-3$.
4. $(x-1)(x-3)\ge0$ ; $\boxed{]-\infty;1]\cup[3;+\infty[}$.
5. $-2(x-1)(x-3)>0$ ; $\boxed{]1;3[}$.
6. $B(x)=-(x-5)^2+16$ ; $\boxed{x=5,\ B_{\max}=16\text{ €}}$.
7. $P(x)=2(x-1)(x+3)=\boxed{2x^2+4x-6}$.
8. $(x-3)^2=0$ ; $\boxed{x=3}$, racine double.

## Maîtrise
Savoir lire directement les variations d'une parabole à partir du signe de $a$, produire un tableau de signes et ne pas confondre $\Delta<0$ avec « aucune solution complexe ».