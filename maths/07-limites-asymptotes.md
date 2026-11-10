# 07 — Limites, infini, asymptotes

**Objectifs :** reconnaître une limite finie/infinie, résoudre les formes indéterminées usuelles et identifier les asymptotes. Préreq. : 05–06. Durée : 7–10 h.

## 1. Comprendre la limite
Dire $\lim_{x\to a}f(x)=L$ signifie que $f(x)$ se rapproche de $L$ lorsque $x$ se rapproche de $a$ (sans exiger $f(a)=L$). Pour $x\to+\infty$, on regarde le comportement à droite, sans jamais « remplacer l'infini par un nombre ».

**Exemples :** $\lim_{x\to+\infty}1/x=0$, $\lim_{x\to-\infty}x^3=-\infty$, $\lim_{x\to3}(2x+1)=7$.

## 2. Règles et formes indéterminées
Pour des limites **finies**, somme/produit/quotient passent à la limite si le dénominateur limite n'est pas nul. Attention aux formes $\infty-\infty$, $0/0$, $\infty/\infty$, $0\times\infty$ : elles n'indiquent pas la valeur, il faut **transformer l'expression**.

**Polynômes à l'infini :** le terme de plus haut degré domine. Ainsi $3x^4-2x+8\to+\infty$ pour $x\to\pm\infty$.

**Quotients de polynômes :** diviser par la plus grande puissance pertinente :
$$\lim_{x\to+\infty}\frac{3x^2-x}{x^2+1}=\lim\frac{3-1/x}{1+1/x^2}=\boxed3.$$
Numérateur plus haut degré ⇒ souvent $\pm\infty$ ; dénominateur plus haut degré ⇒ 0 ; degrés égaux ⇒ rapport des coefficients dominants.

## 3. Limites en un point : droite/gauche
Pour $f(x)=1/(x-2)$ :
$$\lim_{x\to2^-}f(x)=-\infty,\qquad\lim_{x\to2^+}f(x)=+\infty.$$
La limite bilatérale n'existe pas : les deux côtés diffèrent. **Toujours examiner le signe du dénominateur** près de son zéro.

Un trou peut être amovible : $(x^2-4)/(x-2)=x+2$ pour $x\ne2$, donc limite 4 en 2, même si la fonction de départ n'est pas définie en 2.

## 4. Asymptotes
- **Verticale** $x=a$ si au moins une limite unilatérale est infinie en $a$.
- **Horizontale** $y=L$ si $\lim_{x\to\pm\infty}f(x)=L$.
- **Oblique** $y=ax+b$ si $\lim_{x\to\pm\infty}[f(x)-(ax+b)]=0$.

Exemple :
$$\frac{x^2+1}{x-1}=x+1+\frac2{x-1}.$$
On a une asymptote **verticale** $x=1$ et une asymptote **oblique** $y=x+1$ à $\pm\infty$.

## 5. Croissances comparées (complément)
À $+\infty$, pour puissances positives convenables, $\ln x$ croît moins vite que toute puissance positive $x^\alpha$, laquelle croît moins vite que $e^x$. Résultats utiles :
$$\lim_{x\to+\infty}\frac{\ln x}{x}=0,\quad \lim_{x\to+\infty}\frac{x^2}{e^x}=0.$$
Se méfier des limites en $0^+$ : $\ln x\to-\infty$ et $x\ln x\to0$.

## 6. Méthode d'étude
1. Domaine, valeurs interdites.
2. Nature de la limite : en une borne, $+\infty$ ou $-\infty$.
3. Substitution directe **si elle a du sens**.
4. Si indéterminée : factoriser, diviser, rationaliser, ou utiliser les croissances comparées.
5. Traduire en asymptote seulement si la définition est remplie.

## 7. Atelier guidé — une fonction rationnelle de bout en bout

On étudie sur son domaine la fonction :

\[
f(x)=\frac{x^2+4}{x-2}.
\]

**Étape 1 — Définition.** Le dénominateur s'annule uniquement pour \(x=2\). On doit donc écrire \(D_f=\mathbb R\setminus\{2\}\). Cette interdiction reste valable, même si l'on réécrit la fonction.

**Étape 2 — Division et limites.** Comme \(x^2+4=(x-2)(x+2)+8\), on obtient, pour \(x\ne2\) :

\[
f(x)=x+2+\frac8{x-2}.
\]

Lorsque \(x\to+\infty\) ou \(x\to-\infty\), la différence \(f(x)-(x+2)=8/(x-2)\) tend vers zéro. **L'asymptote oblique est donc \(y=x+2\)**, avec sa justification par une limite, et non par une simple intuition graphique.

**Étape 3 — Limites unilatérales.** Au voisinage de 2, la partie \(x+2\) tend vers 4. Pour \(x\to2^-\), \(8/(x-2)\to-\infty\) ; pour \(x\to2^+\), \(8/(x-2)\to+\infty\). La droite **\(x=2\)** est une asymptote verticale. Il faut distinguer les deux côtés : on ne peut pas écrire une limite bilatérale infinie unique ici.

**Étape 4 — Dérivée sur le domaine.** Sur chacun des intervalles \(]-\infty;2[\) et \(]2;+\infty[\) :

\[
f'(x)=1-\frac8{(x-2)^2}.
\]

Par exemple, \(f'(4)=1-8/4=-1\). Une dérivée négative à un point ne signifie pas que toute la fonction est négative : elle indique seulement une pente locale négative.

**Vérification de méthode :** \(f(4)=(16+4)/(4-2)=10\), et la forme décomposée donne aussi \(4+2+8/2=10\).

## 8. Atelier guidé — rationaliser une forme \(0/0\)

On cherche la limite lorsque \(x\to0\) de :

\[
g(x)=\frac{\sqrt{x+9}-3}{x},\qquad x\ge-9,\ x\ne0.
\]

La substitution donne \(0/0\) : ce n'est **pas** la réponse. Pour \(x\ne0\), on multiplie par le conjugué :

\[
g(x)=\frac{(\sqrt{x+9}-3)(\sqrt{x+9}+3)}{x(\sqrt{x+9}+3)}
=\frac{(x+9)-9}{x(\sqrt{x+9}+3)}
=\frac1{\sqrt{x+9}+3}.
\]

La dernière expression tend vers \(1/(3+3)\), donc \(\boxed{\lim_{x\to0}g(x)=1/6}\). La limite est finie **alors que \(g(0)\) n'existe pas**. On a un trou amovible, pas une asymptote verticale.

### Deux problèmes de transfert (sans regarder les corrigés)

**A.** Étudier \(h(x)=(x^2+3)/(x-1)\) : domaine, asymptote verticale, asymptote oblique et valeur de \(h'(3)\).

**B.** Calculer \(\lim_{x\to0}(\sqrt{x+4}-2)/x\), en justifiant la transformation et le domaine de départ.

### Corrections commentées

**A.** Domaine \(x\ne1\). Division : \(x^2+3=(x-1)(x+1)+4\), donc \(h(x)=x+1+4/(x-1)\). Près de 1, le terme \(4/(x-1)\) diverge, d'où l'asymptote verticale \(x=1\). À l'infini, \(h(x)-(x+1)\to0\), donc asymptote oblique \(y=x+1\). Enfin \(h'(x)=1-4/(x-1)^2\), ainsi \(h'(3)=1-4/4=\boxed0\).

**B.** Domaine : \(x\ge-4\), mais \(x\ne0\). Le conjugué transforme la fraction en \(1/(\sqrt{x+4}+2)\) pour \(x\ne0\). La limite est \(\boxed{1/4}\) ; la valeur en 0 reste interdite dans la fonction initiale.

**Pièges à surveiller :** déduire automatiquement une asymptote de la seule valeur interdite ; oublier que \(+\infty\) et \(-\infty\) ne sont pas des nombres ; confondre signe de \(f'\) et signe de \(f\).

---

## Exercices
1. Calculer $\lim_{x\to+\infty}(4x^3-x)/(2x^3+1)$.
2. Calculer $\lim_{x\to-\infty}(x^3-5x^2)$.
3. Calculer $\lim_{x\to2}(x^2-4)/(x-2)$.
4. Donner les limites à gauche et à droite de $x=1$ pour $1/(x-1)$.
5. Trouver les asymptotes de $(2x+1)/(x-3)$.
6. Trouver une asymptote oblique de $(x^2+2)/(x+1)$.
7. Calculer $\lim_{x\to+\infty}x/e^x$.
8. Calculer $\lim_{x\to0^+}\sqrt{x}$.

---

## Corrigés
1. Diviser par $x^3$ : $\boxed2$.
2. $x^3$ domine ; $x^3\to-\infty$ donc $\boxed{-\infty}$.
3. $(x-2)(x+2)/(x-2)=x+2$, pour $x\ne2$ ; $\boxed4$.
4. $x\to1^-$ : $\boxed{-\infty}$ ; $x\to1^+$ : $\boxed{+\infty}$.
5. $x=3$ verticale. $\frac{2x+1}{x-3}=2+\frac7{x-3}$, donc $y=2$ horizontale à $\pm\infty$.
6. $(x^2+2)/(x+1)=x-1+\frac3{x+1}$ ; $\boxed{y=x-1}$.
7. La croissance de l'exponentielle domine : $\boxed0$.
8. $\sqrt x$ est continue à droite en 0 : $\boxed0$.

## Maîtrise
Ne pas qualifier une simple valeur interdite d'asymptote verticale sans vérifier la limite. Savoir expliquer la différence entre un **trou** et une asymptote.