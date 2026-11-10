# 02 — Calcul littéral, développer, factoriser

**Objectifs :** simplifier une expression sans changer sa valeur, reconnaître une identité remarquable, factoriser et manipuler une fraction rationnelle sans perdre les valeurs interdites. Préreq. : 01. Durée : 5–7 h.

## 1. Le sens des lettres
Une variable désigne un nombre dont la valeur peut changer. $3x$ signifie $3\times x$, pas $3+x$. Les termes semblables s'additionnent : $3x+2x=5x$ mais $3x+2x^2$ ne se réduit pas.

Le terme $x^2$ ne peut pas se fusionner avec $x$ ; garder la structure de l'expression.

## 2. Distribuer et développer
$$a(b+c)=ab+ac,\quad(a+b)(c+d)=ac+ad+bc+bd.$$
Exemple : $(2x-3)(x+4)=2x^2+8x-3x-12=\boxed{2x^2+5x-12}$.
Pour le signe moins : $-(3x-2)=-3x+2$. Écrire toutes les étapes si les signes sont difficiles.

## 3. Trois identités remarquables
$$(a+b)^2=a^2+2ab+b^2,$$
$$(a-b)^2=a^2-2ab+b^2,$$
$$(a-b)(a+b)=a^2-b^2.$$
Exemples : $(x-5)^2=x^2-10x+25$ ; $4x^2-9=(2x-3)(2x+3)$.

**Piège :** $(a+b)^2\ne a^2+b^2$ : il manque $2ab$.

## 4. Factoriser
Factoriser revient à **mettre en produit**, utile pour résoudre les équations :
- Facteur commun : $6x^2-9x=3x(2x-3)$.
- Différence de deux carrés : $x^2-16=(x-4)(x+4)$.
- Trinôme reconnu : $x^2+6x+9=(x+3)^2$.
- Par regroupement : $ax+ay+bx+by=(a+b)(x+y)$.

Pour vérifier une factorisation, **redévelopper**.

## 5. Fractions rationnelles et domaine
$\frac{x^2-9}{x-3}$ est définie seulement pour $x\ne3$. Pour $x\ne3$ :
$$\frac{x^2-9}{x-3}=\frac{(x-3)(x+3)}{x-3}=x+3.$$
À $x=3$, la fraction de départ **n'existe toujours pas** même si $x+3$ existe. Simplification ne signifie pas changement du domaine.

On additionne $\frac1x+\frac1{x+1}=\frac{2x+1}{x(x+1)}$, **avec $x\ne0,-1$**.

## 6. Substituer une valeur
Pour $A(x)=2x^2-3x+1$, $A(-2)=2(4)+6+1=15$. Toujours mettre les valeurs négatives entre parenthèses.

## 7. Atelier approfondi — expression rationnelle et valeur interdite

Étudier l'expression

\[
E(x)=\frac{x^2-9}{x-3}+\frac2{x+1}.
\]

**1. Domaine avant simplification.** Les dénominateurs initiaux imposent \(x\ne3\) et \(x\ne-1\). Ainsi \(D_E=\mathbb R\setminus\{-1,3\}\). Une simplification ne peut pas rétablir une valeur interdite.

**2. Factoriser le numérateur.** L'identité \(a^2-b^2=(a-b)(a+b)\) donne \(x^2-9=(x-3)(x+3)\). Puis, **pour \(x\ne3\)**,

\[
E(x)=x+3+\frac2{x+1}.
\]

**3. Mettre sur un dénominateur commun.** Pour \(x\ne-1,3\) :

\[
E(x)=\frac{(x+3)(x+1)+2}{x+1}
=\boxed{\frac{x^2+4x+5}{x+1}}.
\]

Les formes sont égales **sur le domaine initial seulement**. La forme simplifiée possède une valeur algébrique en \(x=3\), mais cette valeur n'appartient pas à la fonction d'origine.

**4. Contrôle par substitution.** En \(x=0\), l'expression initiale vaut \((-9)/(-3)+2/1=5\). La forme finale donne \(5/1=5\). En revanche, \(x=3\) reste interdit, même si le quotient simplifié serait calculable.

### Deux problèmes de transfert

**A.** Simplifier \(F(x)=(x^2-4)/(x-2)-1/(x+1)\), préciser **toutes** les valeurs interdites et calculer \(F(0)\).

**B.** Factoriser sans développer inutilement \((2x-3)^2-(x-1)^2\), puis donner les zéros de l'expression factorisée.

### Corrections commentées

**A.** Le domaine initial interdit \(\boxed{x=2}\) et \(\boxed{x=-1}\). Pour \(x\) autorisé, \((x^2-4)/(x-2)=x+2\). Donc

\[
F(x)=x+2-\frac1{x+1}
=\boxed{\frac{x^2+3x+1}{x+1}},\qquad x\ne-1,2.
\]

En \(x=0\), \(F(0)=2-1=\boxed1\). L'interdiction \(x=2\) doit être conservée.

**B.** Différence de carrés \(A^2-B^2=(A-B)(A+B)\), avec \(A=2x-3\) et \(B=x-1\) :

\[
(2x-3)^2-(x-1)^2
=[(2x-3)-(x-1)]\,[(2x-3)+(x-1)]
=\boxed{(x-2)(3x-4)}.
\]

L'expression s'annule pour \(\boxed{x=2}\) ou \(\boxed{x=4/3}\). Le redéveloppement donne \(3x^2-10x+8\), ce qui confirme le produit.

**Pièges à surveiller :** supprimer un terme au lieu d'un facteur, oublier une valeur interdite après simplification, écrire \((a-b)^2=a^2-b^2\), substituer sans parenthèses un nombre négatif.

---

## Exercices
1. Réduire $4x-3(2x-5)+7$.
2. Développer $(3x-2)^2$.
3. Factoriser $5x^2-20x$.
4. Factoriser $9y^2-25$.
5. Simplifier $\frac{x^2-4}{x-2}$ et préciser le domaine.
6. Mettre sur un seul dénominateur $\frac2{x-1}-\frac1{x+1}$, avec restrictions.
7. Développer $(2x+1)(x-3)$ puis évaluer pour $x=-1$.
8. Résoudre immédiatement par factorisation $3x(x-4)=0$.

---

## Corrigés
1. $4x-6x+15+7=\boxed{-2x+22}$.
2. $(3x)^2-2(3x)(2)+4=\boxed{9x^2-12x+4}$.
3. $5x(x-4)$, car le facteur commun est $5x$.
4. $(3y-5)(3y+5)$.
5. Domaine $\mathbb R\setminus\{2\}$ ; $[(x-2)(x+2)]/(x-2)=\boxed{x+2}$ pour $x\ne2$.
6. Domaine $\mathbb R\setminus\{-1,1\}$ ; $\frac{2(x+1)-(x-1)}{(x-1)(x+1)}=\boxed{\frac{x+3}{x^2-1}}$.
7. $2x^2-6x+x-3=\boxed{2x^2-5x-3}$ ; pour $x=-1$, $2+5-3=\boxed4$.
8. Produit nul : $3x=0$ ou $x-4=0$ ; $\boxed{x=0\text{ ou }x=4}$.

## Maîtrise
Différencier **développer** (produit vers somme) et **factoriser** (somme vers produit), justifier toutes les valeurs interdites, reconnaître les 3 identités sans regarder.