# 16 — Nombres complexes et approfondissements locaux

**Statut :** jalons 22 et 23 **facultatifs** dans le syllabus SONATE Côte d'Azur 2026-2027 ; demandés dans certaines autres universités, notamment Sorbonne et Orléans. À prioriser selon ton centre d'examen. Préreq. : 04, 13 et 14. Durée : 5–8 h.

## 1. Pourquoi les nombres complexes ?
Dans les réels, $x^2+1=0$ n'a pas de solution. On introduit $i$ tel que $i^2=-1$ ; un complexe est $z=a+ib$, $a,b\in\mathbb R$. Partie réelle $\operatorname{Re}(z)=a$, imaginaire $\operatorname{Im}(z)=b$.
Deux complexes sont égaux si et seulement si leurs parties réelles **et** imaginaires sont égales.

## 2. Calcul algébrique
Additionner par composantes ; multiplier en utilisant $i^2=-1$.
$$(2+3i)+(1-5i)=3-2i.$$
$$(2+i)(3-2i)=6-4i+3i-2i^2=\boxed{8-i}.$$
Conjugué : $\overline z=a-ib$ ; $z\overline z=a^2+b^2$.

Pour diviser :
$$\frac1{1+i}=\frac{1-i}{(1+i)(1-i)}=\boxed{\frac12-\frac i2}.$$

## 3. Module et argument
Le module est $|z|=\sqrt{a^2+b^2}$, distance à l'origine. Si $z\ne0$, un argument $\theta$ satisfait $\cos\theta=a/|z|$, $\sin\theta=b/|z|$.
$$z=r(\cos\theta+i\sin\theta)=re^{i\theta},\quad r=|z|>0.$$
Exemple $1+i$ : module $\sqrt2$, argument principal $\pi/4$, forme exponentielle $\sqrt2e^{i\pi/4}$.

**Piège :** l'argument de 0 n'est pas défini. Les arguments sont définis modulo $2\pi$.

## 4. Multiplication en forme polaire
$$r_1e^{i\theta_1}\,r_2e^{i\theta_2}=r_1r_2e^{i(\theta_1+\theta_2)}.$$
Les modules se multiplient, les arguments s'additionnent. Par exemple $(e^{i\pi/3})^3=e^{i\pi}=-1$.
Pour la forme trigonométrique, appliquer $\cos,\sin$ de l'angle calculé.

## 5. Équations du second degré à discriminant négatif
Pour $ax^2+bx+c=0$ avec coefficients réels, $a\ne0$ et $\Delta<0$ :
$$z_{1,2}=\frac{-b\pm i\sqrt{-\Delta}}{2a}.$$
Exemple $z^2+2z+5=0$ : $\Delta=4-20=-16$, donc $\boxed{z=-1\pm2i}$.

## 6. Interprétation géométrique
Le complexe $z_B-z_A$ représente le vecteur de $A$ vers $B$ dans le plan complexe. Sa norme $|z_B-z_A|$ est la distance $AB$. Le module mesure une longueur et l'argument une direction.

## 7. Géométrie complexe : transformations et angles (jalon 23 facultatif)
Pour des points $A,B$ d'affixes $z_A,z_B$, l'affixe du vecteur $\overrightarrow{AB}$ est $z_B-z_A$. La distance $AB=|z_B-z_A|$. Pour deux vecteurs non nuls $\overrightarrow{AB}$ et $\overrightarrow{AC}$ :
$\frac{z_C-z_A}{z_B-z_A}$
est réel si les deux vecteurs sont colinéaires ; il est imaginaire pur si leurs directions sont orthogonales. Son argument donne l'**angle orienté** de $\overrightarrow{AB}$ vers $\overrightarrow{AC}$, modulo $2\pi$.

**Rotation** de centre d'affixe $c$ et angle $\theta$ :
$z'=c+e^{i\theta}(z-c).$
**Homothétie** de centre $c$ et rapport réel $k$ : $z'=c+k(z-c)$. Pour $c=0$, une rotation de $90^\circ$ dans le sens direct s'écrit simplement $z'=iz$.

**Exemple guidé :** $A$ a pour affixe $1$, $B$ a pour affixe $2+i$, $C$ a pour affixe $1+2i$. Les vecteurs d'origine $A$ valent $z_B-z_A=1+i$ et $z_C-z_A=2i$. Le rapport
$\frac{2i}{1+i}=\frac{2i(1-i)}2=1+i$
a pour argument $\pi/4$. Donc l'angle orienté $\widehat{(AB,AC)}=\pi/4$.

### Exercices de géométrie complexe
A. Pour $z_A=2+i$ et $z_B=5+5i$, donner l'affixe de $\overrightarrow{AB}$ et la distance $AB$.
B. Image de $z=1+i$ par la rotation de centre $0$ et d'angle $\pi/2$ ?
C. Image de $z=3$ par l'homothétie de centre $1$ et de rapport $2$ ?
D. Les points d'affixes $0$, $1+i$, $2+2i$ sont-ils alignés ?
E. Les vecteurs d'affixes $1+i$ et $1-i$ sont-ils orthogonaux ?
F. Rotation de centre $c=1$ et d'angle $\pi$ : image de $z=2+i$ ?
G. Pour $z_A=0$, $z_B=1$, $z_C=i$, angle orienté de $\overrightarrow{AB}$ vers $\overrightarrow{AC}$ ?

### Corrigés de géométrie complexe
A. $z_B-z_A=3+4i$ et $AB=|3+4i|=\boxed5$.
B. Multiplier par $i$ : $i(1+i)=\boxed{-1+i}$.
C. $1+2(3-1)=\boxed5$.
D. $(2+2i)/(1+i)=2\in\mathbb R$ ; $\boxed{\text{oui}}$.
E. Produit scalaire $(1;1)\cdot(1;-1)=0$, ou quotient $(1-i)/(1+i)=-i$, imaginaire pur ; $\boxed{\text{oui}}$.
F. $z'=1+e^{i\pi}(z-1)=1-(1+i)=\boxed{-i}$.
G. $(z_C-z_A)/(z_B-z_A)=i$ a pour argument $\boxed{\pi/2}$.

## Exercices
1. Calculer $(3-2i)+(1+5i)$.
2. Calculer $(2+i)^2$.
3. Simplifier $3/(1-i)$.
4. Module de $z=3+4i$ ?
5. Conjugué de $z=-2+5i$ ?
6. Forme exponentielle de $z=-i$ ?
7. Résoudre dans $\mathbb C$ : $z^2+4=0$.
8. Résoudre dans $\mathbb C$ : $z^2-2z+5=0$.

---

## Corrigés
1. $\boxed{4+3i}$.
2. $4+4i+i^2=\boxed{3+4i}$.
3. $3(1+i)/(1+1)=\boxed{3/2+(3/2)i}$.
4. $\sqrt{9+16}=\boxed5$.
5. $\boxed{-2-5i}$.
6. Module 1, argument $-\pi/2$ : $\boxed{e^{-i\pi/2}}$.
7. $z^2=-4$, $\boxed{z=\pm2i}$.
8. $\Delta=4-20=-16$, $\boxed{z=1\pm2i}$.

## Maîtrise
Ne pas confondre $i$ avec une variable réelle. Comprendre pourquoi une équation sans solution réelle peut posséder deux solutions complexes.