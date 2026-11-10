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

## 8. Atelier approfondi — algèbre, module et rotation

Considérons \(z=1+2i\) et \(w=2-i\), où \(i^2=-1\).

**Étape 1 — Multiplier.** \(zw=(1+2i)(2-i)=2-i+4i-2i^2=\boxed{4+3i}\). Le produit est un complexe, pas le produit séparé des parties réelles et imaginaires.

**Étape 2 — Vérifier par les modules.** \(|z|=\sqrt5\), \(|w|=\sqrt5\), donc \(|zw|=|z||w|=5\). Avec \(zw=4+3i\), on trouve aussi \(\sqrt{4^2+3^2}=\boxed5\).

**Étape 3 — Diviser.** En multipliant par le conjugué de \(w\) : \(z/w=(1+2i)(2+i)/[(2-i)(2+i)]=(2+i+4i+2i^2)/5=\boxed i\). Contrôle : \(i(2-i)=1+2i=z\).

**Étape 4 — Rotation de centre \(c=1+i\) et d'angle \(\pi/2\).** L'image de \(z=3+i\) vérifie \(z'=c+i(z-c)\). Comme \(z-c=2\), on obtient \(z'=1+i+2i=\boxed{1+3i}\). La distance au centre est conservée : \(|z-c|=2=|z'-c|\).

### Deux problèmes de transfert

**A.** Calculer \((2+i)(1-3i)\), son module, puis le quotient \((2+i)/(1-3i)\) sous forme algébrique.

**B.** On effectue une rotation d'angle \(\pi\) et de centre d'affixe \(c=2\). Quelle est l'image du point d'affixe \(z=3+2i\) ? Vérifier la conservation de la distance au centre.

### Corrections commentées

**A.** \((2+i)(1-3i)=2-6i+i-3i^2=\boxed{5-5i}\). Module \(\sqrt{25+25}=\boxed{5\sqrt2}\). Pour le quotient, on multiplie par \(1+3i\) : \((2+i)(1+3i)/(1+9)=(-1+7i)/10=\boxed{-1/10+7i/10}\).

**B.** Comme \(e^{i\pi}=-1\), \(z'=2-(z-2)=4-z=\boxed{1-2i}\). Les deux distances au centre valent \(|1+2i|=|-1-2i|=\boxed{\sqrt5}\).

**Pièges :** oublier \(i^2=-1\), confondre module et partie réelle, effectuer une rotation autour de l'origine quand le centre est non nul.

---

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