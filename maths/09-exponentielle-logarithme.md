# 09 — Fonction exponentielle et logarithme népérien

**Objectifs :** manipuler $e^x$ et $\ln x$, leurs domaines, dérivées, limites, équations et modèles de croissance/décroissance. Préreq. : 05–08. Durée : 7–11 h.

## 1. Exponentielle $e^x$
La fonction exponentielle est définie et strictement croissante sur $\mathbb R$, toujours **positive**, avec $e^0=1$ et $e^1=e\approx2{,}71828$.
$$e^{a+b}=e^ae^b,\quad e^{-a}=\frac1{e^a},\quad \frac{e^a}{e^b}=e^{a-b}.$$
Dérivées : $(e^x)'=e^x$ ; $(e^{u(x)})'=u'(x)e^{u(x)}$.
Limites : $e^x\to0$ quand $x\to-\infty$ ; $e^x\to+\infty$ quand $x\to+\infty$.

**Exemple :** $e^{2x-1}=e^5 \iff 2x-1=5\iff\boxed{x=3}$.

## 2. Logarithme népérien
$\ln x$ est défini **uniquement pour $x>0$**. C'est la fonction réciproque de l'exponentielle :
$$\ln(e^t)=t\quad (t\in\mathbb R),\qquad e^{\ln x}=x\quad(x>0).$$
$\ln1=0$, $\ln e=1$, $\ln x$ est strictement croissante de $-\infty$ (quand $x\to0^+$) à $+\infty$ (quand $x\to+\infty$).
Pour $a,b>0$ :
$$\ln(ab)=\ln a+\ln b,\quad\ln(a/b)=\ln a-\ln b,\quad \ln(a^r)=r\ln a.$$
**Interdit :** $\ln(a+b)=\ln a+\ln b$ (faux).
Dérivées : $(\ln x)'=1/x$ ; $(\ln u)'=u'/u$ sur les intervalles où $u>0$.

## 3. Résoudre une équation ou inéquation
$$\ln(x-1)=2\quad\Rightarrow\quad x>1,\ x-1=e^2,\ \boxed{x=1+e^2}.$$
$$e^{2x}>5\quad\Longleftrightarrow\quad 2x>\ln5\quad\Longleftrightarrow\quad \boxed{x>\tfrac12\ln5}.$$
La transformation préserve le sens puisque $\exp$ et $\ln$ sont croissantes.

## 4. Dérivée et étude de fonction
$f(x)=xe^x$ sur $\mathbb R$ :
$$f'(x)=e^x+xe^x=e^x(1+x).$$
Comme $e^x>0$, le signe est celui de $1+x$. La fonction décroît sur $]-\infty;-1]$ et croît sur $[-1;+\infty[$ ; minimum $f(-1)=-1/e$.

## 5. Modéliser
Croissance continue $N(t)=N_0e^{kt}$. Si $k>0$, croissance, si $k<0$, décroissance.
Doubler : $2N_0=N_0e^{kt}$, donc $t=\ln2/k$ si $k>0$.
Pour une diminution de moitié avec $k<0$, $t=\ln(1/2)/k>0$.
Pour une croissance annuelle **discrète** de 5 %, le modèle exact au bout de $n$ ans est plutôt $N_n=N_0(1{,}05)^n$ (chapitre 10).

## 6. Conditions de domaine dans les compositions
$g(x)=\ln(2x-4)$ impose $2x-4>0$, donc $x>2$.
Pour résoudre $\ln(x^2-1)=0$ : domaine $x<-1$ ou $x>1$. Puis $x^2-1=1$ donne $\boxed{x=\pm\sqrt2}$, toutes deux admises.

## 7. Atelier approfondi — équation logarithmique, inéquation et modèle

**1. Avant toute équation, écrire le domaine.** Résolvons

\[
\ln(2x-1)=\ln(x+2).
\]

Le logarithme de gauche existe pour \(2x-1>0\), soit \(x>1/2\). Celui de droite existe pour \(x>-2\). Le domaine commun est donc \(x>1/2\).

**2. Utiliser l'injectivité de \(\ln\).** Sur ce domaine, deux logarithmes sont égaux si et seulement si leurs arguments sont égaux :

\[
2x-1=x+2\iff x=\boxed3.
\]

La valeur 3 appartient au domaine. Vérification : \(\ln(2\times3-1)=\ln5\) et \(\ln(3+2)=\ln5\). Sans l'étude du domaine, une résolution algébrique ne serait pas complète.

**3. Résoudre une inéquation exponentielle.** La fonction exponentielle est **strictement croissante**. Donc

\[
e^{2x}\ge7\iff2x\ge\ln7\iff\boxed{x\ge\tfrac12\ln7}.
\]

On conserve le sens de l'inégalité car \(\ln\) est strictement croissante sur \(]0;+\infty[\), et 7 est positif.

**4. Modéliser une croissance continue.** Une quantité \(N(t)=240e^{0{,}15t}\), avec \(t\ge0\), double lorsque \(N(t)=480\). On trouve \(e^{0{,}15t}=2\), d'où

\[
t=\frac{\ln2}{0{,}15}\approx\boxed{4{,}62\text{ unités de temps}}.
\]

Il faut préciser l'unité de \(t\) selon le problème : si \(t\) est exprimé en années, il s'agit d'environ 4,62 années. Le modèle **discret** \(240(1+0{,}15)^n\) n'est pas identique à un modèle exponentiel continu.

### Deux problèmes de transfert

**A.** Résoudre \(\ln(x-2)=0\) en précisant le domaine. En déduire la dérivée de \(f(x)=\ln(x-2)\) et calculer \(f'(3)\).

**B.** Une substance suit \(M(t)=M_0e^{-0{,}3t}\), avec \(M_0>0\) et \(t\ge0\). Déterminer le temps exact puis approché nécessaire pour obtenir \(M(t)=M_0/2\).

### Corrections commentées

**A.** Domaine \(x-2>0\), donc \(x>2\). Comme \(\ln1=0\), l'équation équivaut à \(x-2=1\), d'où \(\boxed{x=3}\), autorisé. La dérivée est \(f'(x)=1/(x-2)\) sur \(]2;+\infty[\), donc \(\boxed{f'(3)=1}\).

**B.** Diviser par \(M_0>0\), puis prendre le logarithme :

\[
e^{-0{,}3t}=1/2\iff-0{,}3t=\ln(1/2)=-\ln2
\iff\boxed{t=\frac{\ln2}{0{,}3}\approx2{,}31}.
\]

Le temps trouvé est positif, ce qui correspond à une décroissance.

**Pièges à surveiller :** écrire \(\ln(a+b)=\ln a+\ln b\), oublier les arguments strictement positifs, inverser sans raison une inéquation, mélanger croissance continue et croissance par périodes.

---

## Exercices
1. Simplifier $e^{3x}/e^x$.
2. Résoudre $e^{3x}=7$.
3. Résoudre $\ln(2x+1)=\ln5$.
4. Déterminer le domaine de $f(x)=\ln(4-x^2)$.
5. Dériver $e^{x^2+1}$.
6. Dériver $\ln(3x-2)$ sur son domaine.
7. Résoudre $\ln x\ge2$.
8. Étudier le signe de $f'(x)$ pour $f(x)=x-\ln x$, $x>0$, et son minimum.
9. Population initiale de 100, croissance continue $N(t)=100e^{0{,}1t}$. Exprimer exactement le temps de doublement.

---

## Corrigés
1. $\boxed{e^{2x}}$.
2. $3x=\ln7$, donc $\boxed{x=\ln7/3}$.
3. Domaine $x>-1/2$ ; $2x+1=5$ donc $\boxed{x=2}$.
4. $4-x^2>0$ $\iff -2<x<2$ ; $\boxed{]-2;2[}$.
5. Chaîne : $\boxed{2xe^{x^2+1}}$.
6. Domaine $x>2/3$, dérivée $\boxed{3/(3x-2)}$.
7. $\boxed{x\ge e^2}$ (domaine $x>0$ inclus).
8. $f'=1-1/x=(x-1)/x$ ; pour $x>0$ le signe est celui de $x-1$ : minimum en 1, $f(1)=\boxed1$.
9. $e^{0{,}1t}=2$, donc $\boxed{t=10\ln2\approx6{,}93}$ unités de temps.

## Maîtrise
Savoir réciter **les conditions $x>0$ pour $\ln x$**, distinguer $e^{a+b}$ de $e^a+e^b$, expliquer les étapes de résolution et l'unité du modèle.