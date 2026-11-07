# Corrigés expliqués — huit problèmes progressifs

[Retour aux sujets](sujets.md) · Un résultat correct sans méthode ne suffit pas. Après chaque problème, vérifier les domaines, les transformations, la cohérence et la conclusion.

## P1 — Deux abonnements (niveau 1)
1. Pour $x\in\mathbb N$, on a $A(x)=8+0,25x$ et $B(x)=12+0,20x$, en euros.
2. $A(x)=B(x)\iff 8+0,25x=12+0,20x\iff0,05x=4\iff\boxed{x=80}$.
3. $A(x)-B(x)=-4+0,05x$. Ce nombre est négatif si $x<80$ : **A est moins chère**. Il est nul pour $x=80$, puis positif si $x>80$ : **B est moins chère**.
4. $A(x)\le45\iff8+0,25x\le45\iff x\le37/0,25=\boxed{148}$. Vérification : $A(148)=45$ € ; $A(149)=45,25$ €, budget dépassé. $x$ étant entier, le maximum est 148 unités.

**À savoir expliquer :** pourquoi l'égalité ne suffit pas à choisir le forfait et pourquoi la contrainte $x\in\mathbb N$ compte.

## P2 — Promotions successives (niveau 1)
1. Augmentation de 15 % : facteur $1,15$ ; réduction de 20 % : facteur $0,80$.
2. $80\times1,15\times0,8=\boxed{73,60\ \text{€}}$.
3. Facteur global $1,15\times0,8=0,92$ ; variation $0,92-1=-0,08$, soit **baisse de 8 %**, et non de 5 %. Les taux portent sur des bases successives différentes.
4. Il faut multiplier $73,60$ par $80/73,60=25/23$. Hausse relative $25/23-1=2/23\approx0,0869565$, soit $\boxed{\frac{200}{23}\% \approx8,70\%}$ du prix final.

**Contrôle :** une hausse de 8 % n'annule pas nécessairement une baisse de 8 % sur une autre base.

## P3 — Enclos rectangulaire (niveau 1)
1. $2(x+L)=40$, donc $L=20-x$. Comme largeur et longueur sont strictement positives, $\boxed{0<x<20}$.
2. $S(x)=x(20-x)=-x^2+20x=\boxed{100-(x-10)^2}$, en m².
3. $S(x)\le100$ car $(x-10)^2\ge0$. Maximum $\boxed{100\ \text{m}^2}$ pour $\boxed{x=10\text{ m}}$ et $L=20-10=10$ m.
4. $S(x)\ge84\iff-x^2+20x-84\ge0\iff(x-6)(x-14)\le0$. D'où $\boxed{x\in[6;14]}$ (déjà dans le domaine admissible). Aux bornes, l'aire est exactement 84 m².

**Contrôle :** les largeurs 6 et 14 correspondent à des rectangles de côtés 6 et 14 m, de même aire.

## P4 — Stock en croissance (niveau 2)
1. $u_{n+1}=1,12u_n$, suite **géométrique** de premier terme $u_0=500$, raison $q=1,12$.
2. $\boxed{u_n=500(1,12)^n}$. $u_3=500\times(1,12)^3=500\times1,404928=\boxed{702,464}$.
3. $500(1,12)^n\ge800\iff(1,12)^n\ge1,6$. Comme $\ln(1,12)>0$, le sens de l'inégalité est conservé :
$
n\ge\frac{\ln(1,6)}{\ln(1,12)}\approx4,147.
$
Le premier entier admissible est $\boxed{n=5}$. Contrôle : $u_4=500(1,12)^4=786,75968<800$ et $u_5=500(1,12)^5\approx881,17\ge800$.
4. Somme géométrique de 4 termes :
$
S=500\frac{(1,12)^4-1}{1,12-1}
=500\frac{1,57351936-1}{0,12}
=\boxed{2389,664}.
$
Les termes ne sont pas arrondis avant la somme.

**À retenir :** le temps demandé est un rang **entier**, à vérifier avec les termes voisins.

## P5 — Contrôle qualité (niveau 2)
1. $P(D)=0,04$, $P(\bar D)=0,96$, $P(T\mid D)=0,90$, $P(T\mid\bar D)=0,10$. Donc $P(D\cap T)=0,04\times0,90=\boxed{0,036}$.
2. Par la formule des probabilités totales :
$
P(T)=P(D)P(T\mid D)+P(\bar D)P(T\mid\bar D)
=0,04\times0,9+0,96\times0,1
=\boxed{0,132}.
$
3. Par Bayes,
$
P(D\mid T)=\frac{0,036}{0,132}=\boxed{\frac3{11}\approx27,27\%}.
$
C'est la probabilité qu'une pièce soit défectueuse **sachant que son test est positif**, distincte de la probabilité qu'une pièce défectueuse obtienne un test positif (90 %).
4. En supposant trois pièces indépendantes et le même taux de défaut $p=0,04$, $X\sim\mathcal B(3;0,04)$.
$
P(X\ge1)=1-P(X=0)=1-(0,96)^3
=\boxed{0,115264\approx11,53\%}.
$

**À retenir :** décrire la population initiale, les branches de l'arbre et l'événement conditionnant.

## P6 — Fonction cubique et TVI (niveau 2)
1. $f'(x)=3x^2-3=3(x-1)(x+1)$. Pour $0\le x<1$, $x^2<1$, donc $f'(x)<0$ et $f'(1)=0$. Ainsi $f$ est **strictement décroissante** sur $[0;1]$.
2. $f(0)=1>0$ et $f(1)=1-3+1=-1<0$. Le polynôme $f$ est **continu** sur $[0;1]$. Par le TVI, il existe au moins un zéro $\alpha\in]0;1[$.
3. La stricte décroissance de $f$ sur $[0;1]$ interdit deux zéros distincts. Ainsi $\alpha$ est **unique**.
4. $f(0,3)=0,027-0,9+1=\boxed{0,127>0}$. $f(0,4)=0,064-1,2+1=\boxed{-0,136<0}$. Par continuité et décroissance, $\boxed{0,3<\alpha<0,4}$.
5. $f'(0)=-3$ et $f(0)=1$. Tangente en zéro :
$
y=f'(0)(x-0)+f(0)=\boxed{-3x+1}.
$

**À retenir :** le TVI montre l'existence, la monotonie prouve l'unicité.

## P7 — Fonction rationnelle (niveau 3)
1. Le dénominateur s'annule en $x=2$ ; $\boxed{D_g=\mathbb R\setminus\{2\}}$. Puis $x^2-2x+2=x(x-2)+2$, donc $g(x)=x+\frac2{x-2}$ sur $D_g$.
2. Lorsque $x\to2^-$, $2/(x-2)\to-\infty$, donc $\boxed{g(x)\to-\infty}$. À droite, $g(x)\to+\infty$. Asymptote verticale $\boxed{x=2}$.
3. $g(x)-x=2/(x-2)\to0$ quand $x\to+\infty$ ou $-\infty$. Ainsi asymptote oblique $\boxed{y=x}$ aux deux infinis.
4. $g'(x)=1-\frac2{(x-2)^2}$ sur le domaine. $g'(x)=0\iff(x-2)^2=2\iff\boxed{x=2\pm\sqrt2}$. Le signe est positif lorsque $|x-2|>\sqrt2$, négatif lorsque $0<|x-2|<\sqrt2$.
5. En $x_-=2-\sqrt2$, $g(x_-)=2-\sqrt2+2/(-\sqrt2)=\boxed{2-2\sqrt2}$, **maximum local** de la branche gauche. En $x_+=2+\sqrt2$, $g(x_+)=2+\sqrt2+2/\sqrt2=\boxed{2+2\sqrt2}$, **minimum local** de la branche droite. Le numérateur $x^2-2x+2=(x-1)^2+1>0$, donc $\boxed{g(x)\ne0}$ sur son domaine.
6. $g(0)=(0+2)/(0-2)=-1$, $g'(0)=1-2/4=1/2$. Tangente $\boxed{y=\frac12x-1}$.

**À retenir :** un point exclu du domaine n'est pas automatiquement une asymptote ; il faut examiner la limite. Ici c'en est bien une.

## P8 — Intégrale et exponentielle (niveau 3)
1. On reconnaît la dérivée composée $(e^{t^2})'=2te^{t^2}$. Donc une primitive est $F(t)=e^{t^2}$, et toutes les primitives sont $F(t)+C$.
2. $H(1)=\int_0^1 2te^{t^2}dt=[e^{t^2}]_0^1=\boxed{e-1}$.
3. Par le même calcul à borne variable, $\boxed{H(x)=e^{x^2}-1}$ pour tout réel $x$.
4. Pour $x\ge0$,
$
H(x)=e^4-1 \iff e^{x^2}=e^4 \iff x^2=4 \iff \boxed{x=2}
$
(puisque $x\ge0$, on élimine $x=-2$).
5. Par le théorème fondamental du calcul, $H'(x)=h(x)=2xe^{x^2}$. Pour $x>0$, $H'(x)>0$ ; $H$ est strictement croissante sur $[0;+\infty[$, ce qui rend la solution unique.
6. $\int_0^1(3x^2+2x)dx=[x^3+x^2]_0^1=\boxed{2}$.

**À retenir :** différencier une primitive, une intégrale définie et une fonction définie comme une intégrale à borne variable.

---

## Grille de correction personnelle
Pour chaque problème, entourer les étapes **explicitement rédigées** et reproductibles :
- [ ] Domaine ou hypothèses correctement annoncés
- [ ] Propriété/théorème adapté et conditions vérifiées
- [ ] Calculs exacts avec signes, indices et bornes
- [ ] Résultat interprété et contrôlé (unité, ordre de grandeur, nombre de solutions)

Ne pas ajouter ces points directement à la note automatique /20 des examens : les deux évaluations mesurent des aspects différents.