# 06 — Dérivation, tangentes, variations et convexité

**Objectifs :** calculer une dérivée, étudier son signe, dresser un tableau de variations, résoudre un problème d'optimisation et comprendre la convexité. Préreq. : 05. Durée : 8–12 h.

## 1. Taux de variation et dérivée
Entre $a$ et $a+h$ :
$$\text{taux moyen}=\frac{f(a+h)-f(a)}h,\qquad h\ne0.$$
Quand $h\to0$ et que la limite existe, elle vaut $f'(a)$ : **pente de la tangente**. Exemple avec $f(x)=x^2$ :
$$\frac{(a+h)^2-a^2}{h}=2a+h\to 2a;\quad f'(a)=2a.$$
Tangente en $a$ : $y=f'(a)(x-a)+f(a)$.

## 2. Tableau de dérivées indispensables
| $f(x)$ | $f'(x)$ |
|---|---|
| $c$ | $0$ |
| $x^n$ (entier $n$) | $nx^{n-1}$ |
| $1/x$ ($x\ne0$) | $-1/x^2$ |
| $\sqrt{x}$ ($x>0$) | $1/(2\sqrt{x})$ |
| $\sin x$ | $\cos x$ |
| $\cos x$ | $-\sin x$ |
| $e^x$ | $e^x$ |
| $\ln x$ ($x>0$) | $1/x$ |

Les deux dernières nécessitent le chapitre 09 ; les fonctions trigonométriques le chapitre 13.

## 3. Règles opératoires
Pour $u,v$ dérivables, $k$ constant :
$$(u+v)'=u'+v',\quad(ku)'=ku',$$
$$(uv)'=u'v+uv',\quad\left(\frac uv\right)'=\frac{u'v-uv'}{v^2}\quad (v\ne0).$$
**Composition :** $(u^n)'=nu^{n-1}u'$, $(e^u)'=u'e^u$, $(\ln u)'=u'/u$ si $u>0$.
Exemple : $[(2x+1)^3]'=3(2x+1)^2\times2=6(2x+1)^2$.

## 4. Dérivée et variations
Si $f'(x)>0$ sur un intervalle, $f$ y est strictement croissante ; si $f'(x)<0$, strictement décroissante. Les zéros de $f'$ peuvent être des extremums, mais **pas automatiquement**.

Exemple :
$$f(x)=x^3-3x,\quad f'(x)=3(x-1)(x+1).$$
Dérivée positive sur $]-\infty;-1[$ et $]1;+\infty[$, négative sur $]-1;1[$. Donc maximum **local** $f(-1)=2$ et minimum **local** $f(1)=-2$. La fonction n'a pas d'extrémum global sur $\mathbb R$.

## 5. Tangente
Pour $f(x)=x^2+1$ en $a=2$ : $f(2)=5$, $f'(2)=4$. Équation :
$$y=4(x-2)+5=\boxed{4x-3}.$$
Contrôle : elle passe par $(2;5)$ et sa pente est bien 4.

## 6. Convexité
Si $f''(x)\ge0$ sur un intervalle, la fonction est convexe ; si $f''(x)\le0$, elle est concave. Un **point d'inflexion** nécessite un changement de convexité (souvent un changement de signe de $f''$).
Pour $f(x)=x^3$, $f''(x)=6x$ : concave pour $x<0$, convexe pour $x>0$, point d'inflexion $(0;0)$.

## 7. Optimisation
On maximise $R(x)=-2x^2+12x-5$ sur $[0;5]$. $R'(x)=-4x+12$, nul en 3, positif avant puis négatif après. Maximum en $x=3$ : $R(3)=13$. **Comparer les bords** si le domaine est fermé et si les extremums candidats diffèrent.

## 8. Atelier approfondi — variations, extremums et tangente

Étudions sur \(\mathbb R\) la fonction

\[
f(x)=x^3-6x^2+9x+1.
\]

**1. Dérivée et factorisation :**

\[
f'(x)=3x^2-12x+9=3(x-1)(x-3).
\]

Les nombres critiques sont \(x=1\) et \(x=3\). Ils sont les **zéros de la dérivée**, pas automatiquement les zéros de \(f\).

**2. Tableau de signe de la dérivée :** pour \(x<1\), les deux facteurs sont négatifs et leur produit est positif ; pour \(1<x<3\), le produit est négatif ; pour \(x>3\), il est positif. En conséquence :

- \(f\) est **croissante** sur \(]-\infty;1]\) ;
- \(f\) est **décroissante** sur \([1;3]\) ;
- \(f\) est **croissante** sur \([3;+\infty[\).

On calcule \(f(1)=1-6+9+1=\boxed5\), maximum **local**, et \(f(3)=27-54+27+1=\boxed1\), minimum **local**. Comme \(f(x)\to+\infty\) lorsque \(x\to+\infty\), 5 n'est pas un maximum global sur \(\mathbb R\).

**3. Tangente en \(x=2\).** \(f(2)=8-24+18+1=3\) et \(f'(2)=12-24+9=-3\). La tangente est

\[
y=f'(2)(x-2)+f(2)=-3(x-2)+3=\boxed{-3x+9}.
\]

Vérifier qu'elle passe par \((2;3)\) et qu'elle a la pente \(-3\).

**4. Méthode en autonomie :** domaine → dérivée → factorisation → signe → tableau de variations → calculs d'images aux valeurs critiques → conclusion locale ou globale → tangente le cas échéant. Une valeur \(f'(a)=0\) ne suffit **pas** à affirmer un extremum : \(x^3\) a une dérivée nulle en 0 sans maximum ni minimum local.

### Deux problèmes de transfert

**A.** Donner la tangente à \(p(x)=x^2-4x+7\) au point d'abscisse \(3\).

**B.** Étudier le sens de variation et les extremums locaux de \(q(x)=x^3-3x\), en justifiant le signe de \(q'\).

### Corrections commentées

**A.** \(p(3)=9-12+7=4\) et \(p'(x)=2x-4\), donc \(p'(3)=2\). La tangente est \(y=2(x-3)+4=\boxed{2x-2}\), et elle passe bien par \((3;4)\).

**B.** \(q'(x)=3x^2-3=3(x-1)(x+1)\). Elle est positive sur \(]-\infty;-1[\) et \(]1;+\infty[\), négative sur \(]-1;1[\). Donc \(q\) croît, décroît, puis croît : maximum local \(q(-1)=\boxed2\), minimum local \(q(1)=\boxed{-2}\). Ce ne sont pas des extremums globaux sur tout \(\mathbb R\).

**Erreur typique :** calculer correctement la dérivée mais oublier de **justifier son signe** avant d'annoncer les variations.

---

## Exercices
1. Dériver $4x^3-5x+7$.
2. Dériver $(x^2+1)(2x-3)$, sans forcément développer.
3. Dériver $(x+1)/(x-1)$ pour $x\ne1$.
4. Tangente à $f(x)=x^2-2x$ en $x=3$ ?
5. Étudier les variations de $f(x)=x^2-6x+4$.
6. Étudier convexité de $f(x)=x^4$.
7. Une recette $R(x)=20x-x^2$ sur $[0;20]$. Trouver son maximum.
8. Dériver $\sqrt{3x+1}$ sur $x>-1/3$.

---

## Corrigés
1. $\boxed{12x^2-5}$.
2. $(2x)(2x-3)+(x^2+1)2=\boxed{6x^2-6x+2}$.
3. $[(x-1)-(x+1)]/(x-1)^2=\boxed{-2/(x-1)^2}$.
4. $f(3)=9-6=3$, $f'(3)=4$, $y=4(x-3)+3=\boxed{4x-9}$.
5. $f'(x)=2x-6$ ; décroît sur $]-\infty;3]$, croît sur $[3;+\infty[$ ; minimum $f(3)=-5$.
6. $f''(x)=12x^2\ge0$ ; convexe sur $\mathbb R$ ; **pas** de point d'inflexion en 0.
7. $R'(x)=20-2x$ s'annule en 10 et change de $+$ à $-$ ; $\boxed{R_{\max}=100}$ en $x=10$.
8. Composition $\sqrt u$, $u=3x+1$ : $\boxed{3/(2\sqrt{3x+1})}$.

## Maîtrise
Pour toute étude complète : domaine, dérivée, factorisation/signe, variations, extrema, conclusion. Être capable de refaire la preuve de $(x^2)'=2x$ par le taux de variation.