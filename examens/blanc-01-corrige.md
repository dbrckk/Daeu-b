# Correction détaillée — Examen blanc 01 /20

[Retour au sujet](blanc-01-sujet.md) · **Se corriger strictement ; accorder les points des étapes justificatives, pas seulement des résultats.**

## Exercice 1 (6 points)
1. $(x-1)^2(x+2)=(x^2-2x+1)(x+2)=x^3+2x^2-2x^2-4x+x+2=x^3-3x+2$ **(1)**.
2. $f'=3x^2-3=3(x-1)(x+1)$ **(1)**.
3. $f'>0$ pour $x<-1$ ou $x>1$, $f'<0$ pour $-1<x<1$. Valeurs $f(-1)=-1+3+2=4$, $f(1)=1-3+2=0$.
   - $x:-\infty\to-1$: $f$ croît de $-\infty$ à $4$.
   - $x:-1\to1$: décroît de $4$ à $0$.
   - $x:1\to+\infty$: croît de $0$ à $+\infty$.
   Maximum **local** $4$ en $-1$, minimum **local** $0$ en 1 **(1,5)**.
4. $f=(x-1)^2(x+2)$, zéros $\boxed{-2,1}$ (1 racine double). Comme $(x-1)^2\ge0$, pour $x\ne1$ le signe est celui de $x+2$. D'où $f(x)\ge0$ pour $\boxed{[-2;+\infty[}$ **(1)**.
5. $f(0)=2$, $f'(0)=-3$, tangente $\boxed{y=-3x+2}$ **(0,5)**.
6. Sur $[0;1]$, $f$ est continue (polynôme), $f(0)=2$ et $f(1)=0$ encadrent 1 : TVI assure une solution. $f$ est strictement décroissante sur $]0;1[$, donc solution unique. $f(0{,}3)=0{,}027-0{,}9+2=1{,}127>1$ et $f(0{,}4)=0{,}064-1{,}2+2=0{,}864<1$. Donc $\boxed{\alpha\in]0{,}3;0{,}4[}$ **(1)**.

## Exercice 2 (5 points)
1. Chaque terme vaut $1{,}1$ fois le précédent, donc suite géométrique de raison $q=1{,}1$ et premier terme 400 : $\boxed{u_n=400(1{,}1)^n}$ **(1)**.
2. $\boxed{u_3=400\times1{,}331=532{,}4}$ **(0,5)**.
3. $400(1{,}1)^n\ge600\iff (1{,}1)^n\ge1{,}5$. Comme $\ln1{,}1>0$, $\boxed{n\ge\ln(1{,}5)/\ln(1{,}1)\approx4{,}25}$. Premier entier : $\boxed{n=5}$. Contrôle : $u_4=585{,}64<600$ et $u_5=644{,}204\ge600$ **(1,5)**.
4. $x-1>0\iff \boxed{x>1}$. $g(x)=0\iff\ln(x-1)=\ln2\iff x-1=2\iff \boxed{x=3}$ **(1)**.
5. Sur $]1;+\infty[$, $g'(x)=\boxed{1/(x-1)}>0$. $\lim_{x\to1^+}g(x)=-\infty$ ; $\lim_{x\to+\infty}g(x)=+\infty$ **(1)**.

## Exercice 3 (5 points)
1. Trois tirages avec remise **indépendants**, succès « rouge » de probabilité constante $p=3/5=0{,}6$ : $\boxed{X\sim\mathcal B(3;0{,}6)}$ **(0,5)**.
2. $\binom32(0{,}6)^2(0{,}4)^1=3\cdot0{,}36\cdot0{,}4=\boxed{0{,}432}$ **(1)**.
3. $P(X\ge1)=1-P(X=0)=1-(0{,}4)^3=\boxed{0{,}936}$ **(1)**.
4. $E(X)=np=3(0{,}6)=\boxed{1{,}8}$ **(0,5)**.
5. Somme $7+8+8+9+13=45$, moyenne $\boxed9$. Médiane de cinq observations ordonnées = troisième valeur : $\boxed8$ **(1)**.
6. Variance descriptive :
$$V=\frac{(7-9)^2+(8-9)^2+(8-9)^2+(9-9)^2+(13-9)^2}{5}=\frac{4+1+1+0+16}{5}=\boxed{4{,}4}$$
**(1)**.

## Exercice 4 (4 points)
1. Toutes les primitives sont $\boxed{H(x)=2x^2-3x+C}$, car $H'=4x-3$ **(1)**.
2. $[2x^2-3x]_0^2=8-6=\boxed2$ **(1)**.
3. Domaine $x>0$ ; l'injectivité de $\ln$ donne $\boxed{x=4}$, autorisé **(1)**.
4. $h(x)=x^2-2$ est continue sur $[1;2]$ ; $h(1)=-1<0$, $h(2)=2>0$ ; par TVI elle possède un zéro. Sur $[1;2]$, $h'=2x>0$, donc strictement croissante, zéro unique dans $]1;2[$ **(1)**.

## Résultat et remédiation
- **≥16/20 :** bon niveau de première validation, refaire une autre épreuve à J+7.
- **12–15,9 :** corriger les points perdus, réviser les chapitres correspondants, puis refaire sans consulter la solution.
- **<12 :** reprendre prioritairement 04–06, 08–12 et la méthode 17 avant de passer un nouveau sujet.
Compléter [SUIVI.md](../SUIVI.md).