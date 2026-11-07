# 14 — Géométrie analytique, vecteurs et produit scalaire

**Statut : complément UGA/Rennes.** Préreq. : 01–03 et 05. Durée : 5–7 h.

## 1. Coordonnées et vecteurs
Dans un repère orthonormé, pour $A(x_A;y_A)$ et $B(x_B;y_B)$ :
$$\overrightarrow{AB}=(x_B-x_A;y_B-y_A),\qquad AB=\sqrt{(x_B-x_A)^2+(y_B-y_A)^2}.$$
Exemple $A(1;2)$, $B(4;6)$ : $\overrightarrow{AB}=(3;4)$, distance $AB=5$.

Milieu $M$ de $[AB]$ :
$$M\left(\frac{x_A+x_B}2;\frac{y_A+y_B}2\right).$$

## 2. Opérations et colinéarité
Pour $u=(a;b)$ et $v=(c;d)$ :
$$u+v=(a+c;b+d),\qquad ku=(ka;kb).$$
Deux vecteurs du plan sont colinéaires si leur **déterminant** $ad-bc=0$. Exemple $u=(2;3)$ et $v=(4;6)$ : $2\cdot6-3\cdot4=0$, donc colinéaires.

## 3. Équation d'une droite
Une droite non verticale peut se décrire par $y=mx+p$. Une droite quelconque a une forme $ax+by+c=0$, où $(a;b)\ne(0;0)$. Le vecteur $(a;b)$ est **normal**, $(b;-a)$ est directeur.

Pour $A(1;2)$ et $B(3;6)$, pente $(6-2)/(3-1)=2$, droite $\boxed{y=2x}$.
Pour une verticale passant par $(4;2)$, équation $\boxed{x=4}$ (aucune pente finie).

## 4. Produit scalaire
Si $u=(a;b)$, $v=(c;d)$ :
$$u\cdot v=ac+bd=\|u\|\|v\|\cos\theta.$$
Norme $\|u\|=\sqrt{a^2+b^2}$. Deux vecteurs **non nuls** sont orthogonaux si $u\cdot v=0$.
Exemple $(2;1)\cdot(1;-2)=2-2=0$ : perpendiculaires.

## 5. Projection et angle
Pour deux vecteurs non nuls :
$$\cos\theta=\frac{u\cdot v}{\|u\|\|v\|}.$$
Si $\|u\|=5$, $\|v\|=4$ et $u\cdot v=10$, alors $\cos\theta=10/20=1/2$, angle géométrique $\theta=60^\circ$.

**Attention :** ne pas confondre produit scalaire (un **nombre**) et somme de vecteurs (un **vecteur**).

## 6. Cercle et géométrie de coordonnées
Le cercle de centre $C(a;b)$ et rayon $R>0$ vérifie :
$$(x-a)^2+(y-b)^2=R^2.$$
Exemple centre $(1;-2)$ rayon 3 : $(x-1)^2+(y+2)^2=9$.

## Exercices
1. Pour $A(-1;2)$ et $B(3;5)$, calculer $\overrightarrow{AB}$ et $AB$.
2. Milieu du segment précédent ?
3. Les vecteurs $u=(3;2)$ et $v=(6;4)$ sont-ils colinéaires ?
4. Trouver l'équation réduite de la droite par $(0;1)$ et $(2;5)$.
5. Donner un vecteur normal à $2x-3y+4=0$.
6. Calculer $(3;-1)\cdot(2;6)$ ; sont-ils orthogonaux ?
7. Équation du cercle centre $(-2;1)$ rayon 4 ?
8. Deux vecteurs ont normes 2 et 3 et angle $60^\circ$. Produit scalaire ?

---

## Corrigés
1. $\overrightarrow{AB}=(4;3)$ et $\boxed{AB=\sqrt{16+9}=5}$.
2. $\boxed{M(1;7/2)}$.
3. Déterminant $3\cdot4-2\cdot6=0$ : $\boxed{\text{oui}}$.
4. Pente $(5-1)/2=2$ et ordonnée initiale 1 : $\boxed{y=2x+1}$.
5. $\boxed{(2;-3)}$.
6. $3\cdot2+(-1)\cdot6=0$ : $\boxed{\text{oui}}$.
7. $\boxed{(x+2)^2+(y-1)^2=16}$.
8. $2\cdot3\cdot\cos60^\circ=6(1/2)=\boxed3$.

## Maîtrise
Écrire une droite sous deux formes, tester colinéarité/orthogonalité et interpréter géométriquement un résultat.