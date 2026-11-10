# 15 — Primitives, intégrales et équations différentielles

**Statut : calcul intégral inscrit au jalon 18 SONATE Côte d'Azur 2026-2027 ; approfondissements IPP/équations différentielles demandés selon les universités (Paris-Saclay notamment).** Préreq. : 05–09. Durée : 8–12 h.

## 1. Primitives : remonter d'une dérivée
Une **primitive** de $f$ sur un intervalle $I$ est une fonction $F$ dérivable avec $F'=f$ sur $I$ ; toutes les primitives diffèrent d'une constante sur cet intervalle.

| $f(x)$ | Une primitive $F(x)$ |
|---|---|
| $x^n$, $n\ne-1$ | $x^{n+1}/(n+1)$ |
| $1/x$ pour $x>0$ | $\ln x$ |
| $1/x$ pour $x<0$ | $\ln(-x)$ |
| $e^x$ | $e^x$ |
| $\cos x$ | $\sin x$ |
| $\sin x$ | $-\cos x$ |

Pour $1/x$ sur un intervalle sans 0, on peut réunir les deux cas sous $\ln|x|$. En résolvant une primitive **indéfinie**, ajouter **$+C$** : $f(x)=6x+2$ → $F(x)=3x^2+2x+C$.

## 2. Théorème fondamental et intégrale définie
Si $F'=f$ sur $[a;b]$ et $f$ y est continue :
$$\int_a^b f(x)\,dx=F(b)-F(a).$$
Exemple :
$$\int_0^2(3x^2+1)\,dx=[x^3+x]_0^2=8+2=\boxed{10}.$$
**Attention :** une intégrale est **signée** : $\int_0^1(-x)\,dx=-1/2$ alors que l'aire géométrique correspondante vaut $1/2$.

## 3. Propriétés
Linéarité :
$$\int_a^b(af+bg)=a\int_a^b f+b\int_a^b g.$$
Relation de Chasles :
$$\int_a^c f=\int_a^b f+\int_b^c f.$$
Inversion des bornes : $\int_b^a f=-\int_a^b f$.
Si $f\ge0$ sur $[a;b]$, alors l'intégrale est $\ge0$. Une aire entre courbe et axe nécessite souvent découper aux zéros et intégrer $|f|$.

## 4. Reconnaître une composition
Si $u$ est dérivable :
$$\int u'(x)e^{u(x)}\,dx=e^{u(x)}+C,$$
$$\int \frac{u'(x)}{u(x)}\,dx=\ln|u(x)|+C,\quad u(x)\ne0.$$
Exemple : $\int 2xe^{x^2}\,dx=e^{x^2}+C$.

## 5. Intégration par parties (IPP, complément Paris-Saclay)
Pour $u,v$ dérivables avec régularité adaptée :
$$\int_a^b u\,v'=[uv]_a^b-\int_a^b u'v.$$
Exemple $\int_0^1 xe^x\,dx$ : prendre $u=x$, $v'=e^x$ ; $u'=1$, $v=e^x$ :
$$\int_0^1 xe^x\,dx=[xe^x]_0^1-\int_0^1 e^x\,dx=e-(e-1)=\boxed1.$$

## 6. Valeur moyenne d'une fonction
Sur $[a;b]$ avec $a<b$ :
$$m=\frac1{b-a}\int_a^b f(x)\,dx.$$
Exemple moyenne de $f(x)=2x$ sur $[0;2]$ : $(1/2)[x^2]_0^2=\boxed2$.

## 7. Équations différentielles simples
- $y'=ay$ : solutions $y(x)=Ce^{ax}$ ; condition initiale détermine $C$.
- $y'=ay+b$, $a\ne0$ : solution $y(x)=Ce^{ax}-b/a$.

Exemple $y'=2y$, $y(0)=3$ → $y(x)=\boxed{3e^{2x}}$.
Exemple $y'=-y+4$, $y(0)=1$ : solution générale $y=4+Ce^{-x}$ ; $C=-3$ ; $\boxed{y(x)=4-3e^{-x}}$.

## 8. Atelier approfondi — intégrer, contrôler, interpréter

Sur \([0;2]\), on considère la fonction continue

\[
f(x)=3x^2-4x+1.
\]

**Étape 1 — Trouver une primitive.** On intègre terme à terme :

\[
F(x)=x^3-2x^2+x.
\]

Vérification **obligatoire en dérivant** : \(F'(x)=3x^2-4x+1=f(x)\). Pour la famille complète des primitives, ajouter \(+C\).

**Étape 2 — Appliquer les bornes :**

\[
\int_0^2f(x)\,dx=F(2)-F(0)
=(8-8+2)-0=\boxed2.
\]

La valeur moyenne sur \([0;2]\) est \(2/(2-0)=\boxed1\).

**Étape 3 — Ne pas confondre intégrale et aire.** Le trinôme se factorise en \(f(x)=(3x-1)(x-1)\). Il est positif sur \([0;1/3]\), négatif sur \([1/3;1]\), puis positif sur \([1;2]\). Les zones négatives **sont soustraites** dans l'intégrale signée. Pour une aire géométrique, il faudrait intégrer \(|f(x)|\) et découper aux deux racines.

**Étape 4 — Primitive d'une composition.** Pour \(\int_0^1 2xe^{x^2}\,dx\), on repère \(u(x)=x^2\) et \(u'(x)=2x\). Une primitive est \(e^{x^2}\). D'où

\[
\int_0^1 2xe^{x^2}\,dx=[e^{x^2}]_0^1=\boxed{e-1}.
\]

La substitution n'est **pas** une permission de supprimer arbitrairement des facteurs : le facteur \(2x\) correspond exactement à la dérivée de \(x^2\).

### Deux problèmes de transfert

**A.** Calculer l'intégrale signée de \(g(x)=2x-2\) sur \([0;2]\), puis l'**aire** entre sa courbe et l'axe sur ce même intervalle.

**B.** Calculer \(\int_0^1(6x^2+2x)\,dx\), en écrivant une primitive vérifiable par dérivation.

### Corrections commentées

**A.** Une primitive de \(g\) est \(G(x)=x^2-2x\). L'intégrale signée est \(G(2)-G(0)=\boxed0\). La fonction est négative sur \([0;1]\), positive sur \([1;2]\) : l'aire vaut

\[
\int_0^1(2-2x)\,dx+\int_1^2(2x-2)\,dx=1+1=\boxed2.
\]

L'aire est positive **même lorsque l'intégrale signée s'annule**.

**B.** Une primitive est \(H(x)=2x^3+x^2\), car \(H'(x)=6x^2+2x\). L'intégrale vaut \(H(1)-H(0)=2+1=\boxed3\).

**Pièges à surveiller :** oublier les bornes, changer le signe entre \(F(b)\) et \(F(a)\), appeler « aire » une intégrale signée, omettre \(+C\) pour une primitive générale.

---

## Exercices
1. Trouver toutes les primitives de $4x^3-2x$.
2. Calculer $\int_1^3 2x\,dx$.
3. Calculer $\int_0^1 e^{2x}\,dx$.
4. Calculer $\int_1^e (1/x)\,dx$.
5. Calculer $\int_0^2(x-1)\,dx$. Est-ce une aire positive ?
6. Calculer l'aire comprise entre la courbe $y=x-1$ et l'axe horizontal sur $[0;2]$.
7. Calculer $\int_0^1 xe^x\,dx$ par IPP.
8. Résoudre $y'=-2y$, $y(0)=5$.
9. Trouver une primitive de $3x^2/(x^3+1)$ sur $x\ge0$.

---

## Corrigés
1. $\boxed{F(x)=x^4-x^2+C}$.
2. $[x^2]_1^3=9-1=\boxed8$.
3. Primitive $(1/2)e^{2x}$ ; $\boxed{(e^2-1)/2}$.
4. $[\ln x]_1^e=1-0=\boxed1$.
5. Primitive $x^2/2-x$ : $(2-2)-0=\boxed0$. Non : des zones négatives et positives se compensent.
6. $\int_0^1(1-x)\,dx+\int_1^2(x-1)\,dx=1/2+1/2=\boxed1$.
7. $[xe^x]_0^1-[e^x]_0^1=e-(e-1)=\boxed1$.
8. $y(x)=Ce^{-2x}$ et $y(0)=C=5$ : $\boxed{5e^{-2x}}$.
9. Poser $u=x^3+1$, $u'=3x^2$ ; sur $x\ge0$, $u>0$ : $\boxed{\ln(x^3+1)+C}$.

## Maîtrise
Vérifier toute primitive **en dérivant**, toute équation différentielle **en substituant**, distinguer aire et intégrale signée.