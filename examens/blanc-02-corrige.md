# Correction détaillée — Examen blanc 02 /20

[Retour au sujet](blanc-02-sujet.md)

## Exercice 1 (8 points)
1. Dénominateur nul en 1 ; $\boxed{D_f=\mathbb R\setminus\{1\}}$ **(1)**.
2. Division : $x^2+1=(x-1)(x+1)+2$. Donc $\boxed{f(x)=x+1+2/(x-1)}$ pour $x\ne1$ **(1,5)**.
3. Près de 1, $x+1\to2$ tandis que $2/(x-1)$ tend vers $-\infty$ à gauche et $+\infty$ à droite. Donc limites respectives $\boxed{-\infty,+\infty}$, asymptote **verticale $x=1$**. À $+\infty$, $f\to+\infty$ ; à $-\infty$, $f\to-\infty$. Cependant $f(x)-(x+1)=2/(x-1)\to0$ aux deux infinis : asymptote **oblique $y=x+1$** **(2)**.
4. En dérivant la décomposition, $\boxed{f'=1-2/(x-1)^2}$ **(1)**.
5. Dénominateur $(x-1)^2>0$. Le signe de $f'$ est celui de $(x-1)^2-2$, positif lorsque $|x-1|>\sqrt2$, négatif lorsque $|x-1|<\sqrt2$ (en excluant 1). Zéros en $a=1-\sqrt2$, $b=1+\sqrt2$.
   - Sur $]-\infty;a]$ : f croît vers $f(a)=2-2\sqrt2$.
   - Sur $[a;1[$ : f décroît vers $-\infty$.
   - Sur $]1;b]$ : f décroît de $+\infty$ vers $f(b)=2+2\sqrt2$.
   - Sur $[b;+\infty[$ : f croît vers $+\infty$.
   $\boxed{\text{maximum local }2-2\sqrt2\text{ en }a;\ \text{minimum local }2+2\sqrt2\text{ en }b}$ **(1,5)**.
6. $x^2+1>0$ pour tout réel, donc le quotient ne peut être nul sur son domaine. $\boxed{\text{Aucune solution réelle}}$ **(1)**.

## Exercice 2 (6 points)
1. Première séparation $D$ : $0{,}2$ ; $\bar D$ : $0{,}8$. Depuis $D$, $T:0{,}9$, $\bar T:0{,}1$. Depuis $\bar D$, $T:0{,}05$, $\bar T:0{,}95$ **(1)**.
2. $P(T)=0{,}2(0{,}9)+0{,}8(0{,}05)=0{,}18+0{,}04=\boxed{0{,}22}$ **(1,5)**.
3. $P(D\mid T)=P(D\cap T)/P(T)=0{,}18/0{,}22=\boxed{9/11\approx81{,}8\%}$. Le 90 % initial est $P(T\mid D)$, alors que la question demande $P(D\mid T)$ **(1,5)**.
4. 4 essais indépendants de même probabilité $p=0{,}2$ : $\boxed{X\sim\mathcal B(4;0{,}2)}$ et $\boxed{E(X)=4(0{,}2)=0{,}8}$ **(1)**.
5. Complément : $P(X\ge1)=1-P(X=0)=1-(0{,}8)^4=\boxed{0{,}5904}$ **(1)**.

## Exercice 3 (6 points)
1. $u_1=0{,}5(1)+3=\boxed{3{,}5}$ ; $u_2=0{,}5(3{,}5)+3=\boxed{4{,}75}$ **(1)**.
2. $L=0{,}5L+3$ donc $\boxed{L=6}$ **(1)**.
3. $v_n=u_n-6$ ; $v_{n+1}=u_{n+1}-6=0{,}5u_n-3=0{,}5(u_n-6)=0{,}5v_n$. Comme $v_0=1-6=-5$, $v_n=-5(1/2)^n$, d'où $\boxed{u_n=6-5(1/2)^n}$ **(2)**.
4. $(1/2)^n\to0$, donc $\boxed{u_n\to6}$ **(1)**.
5. $6-5(1/2)^n\ge5{,}5 \iff (1/2)^n\le0{,}1$. Comme $\ln(1/2)<0$, diviser inverse l'inégalité : $n\ge\ln(0{,}1)/\ln(1/2)\approx3{,}322$. Donc $\boxed{n=4}$ ; contrôle $u_3=5{,}375<5{,}5$, $u_4=5{,}6875\ge5{,}5$ **(1)**.

## Remédiation
Exercice 1 <6/8 : revoir 05, 06, 07. Exercice 2 <4,5/6 : revoir 12. Exercice 3 <4,5/6 : revoir 09 et 10. Refaire les questions ratées à J+2 et J+7 ; consigner le résultat dans [SUIVI.md](../SUIVI.md).