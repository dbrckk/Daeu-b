# 12 — Probabilités, arbres, conditionnement et loi binomiale

**Objectifs :** dénombrer, appliquer la règle d'addition/multiplication, traiter les probabilités conditionnelles, variables aléatoires et binomiales. Préreq. : 01–03. Durée : 7–11 h.

## 1. Univers, événements et probabilités
L'univers $\Omega$ liste les issues possibles. Un événement $A$ est un ensemble d'issues. Si elles sont équiprobables :
$$P(A)=\frac{\text{issues favorables}}{\text{issues possibles}}.$$
Toujours $0\le P(A)\le1$, $P(\bar A)=1-P(A)$ et
$$P(A\cup B)=P(A)+P(B)-P(A\cap B).$$
Si $A$ et $B$ sont **incompatibles**, $P(A\cap B)=0$. Cela ne veut pas dire qu'ils sont indépendants.

## 2. Dénombrement
Pour 3 choix successifs de 2, 4 et 5 possibilités : $2\times4\times5=40$ issues.
Factorielle $n!=n(n-1)\cdots1$, $0!=1$. Choisir $k$ éléments parmi $n$ sans ordre :
$$\binom nk=\frac{n!}{k!(n-k)!}.$$
Par exemple $\binom52=10$. Bien vérifier si l'ordre et le remplacement sont autorisés.

## 3. Probabilités conditionnelles et arbres
Si $P(B)>0$ :
$$P(A\mid B)=\frac{P(A\cap B)}{P(B)},\quad P(A\cap B)=P(B)P(A\mid B).$$
À chaque branche d'un arbre, les probabilités sortantes somment à 1. La probabilité d'un chemin se calcule en **multipliant** ; celle d'un événement regroupant des chemins incompatibles en **additionnant**.

## 4. Probabilités totales et Bayes
Avec une partition $B,\bar B$ :
$$P(A)=P(B)P(A\mid B)+P(\bar B)P(A\mid\bar B).$$
Puis
$$P(B\mid A)=\frac{P(B)P(A\mid B)}{P(A)}.$$
**Exemple test médical :** prévalence 1 %, sensibilité 90 % ($P(+\mid M)=0{,}90$), spécificité 95 % ($P(-\mid\bar M)=0{,}95$). Alors $P(+)=0{,}01(0{,}90)+0{,}99(0{,}05)=0{,}0585$ ; la probabilité d'être malade en cas de test positif est
$$P(M\mid+)=0{,}009/0{,}0585\approx\boxed{15{,}4\%}.$$
Cela montre pourquoi $P(+\mid M)$ et $P(M\mid+)$ **ne sont pas interchangeables**.

## 5. Indépendance
Événements indépendants si $P(A\cap B)=P(A)P(B)$ (équiv. $P(A\mid B)=P(A)$ si $P(B)>0$). Deux tirages **avec remise** d'une urne de composition stable sont indépendants ; sans remise, généralement non.

## 6. Variable aléatoire discrète
Une variable $X$ associe un nombre à chaque issue. La loi donne $P(X=x_i)$. Espérance :
$$E(X)=\sum_i x_iP(X=x_i),$$
variance $V(X)=E(X^2)-[E(X)]^2$.
Exemple : gain $X=2$ € avec probabilité $1/4$, $X=-1$ € avec probabilité $3/4$, alors $E(X)=2/4-3/4=\boxed{-1/4\text{ €}}$.

## 7. Loi binomiale
Si $X$ compte les succès dans **$n$ essais indépendants**, avec probabilité constante de succès **$p$**, $X\sim\mathcal B(n,p)$ :
$$P(X=k)=\binom nk p^k(1-p)^{n-k},\quad E(X)=np,\quad V(X)=np(1-p).$$
Exemple : 3 lancers de pièce équilibrée, exactement 2 faces :
$$P(X=2)=\binom32(1/2)^2(1/2)^1=\boxed{3/8}.$$
« Au moins un succès » : souvent plus simple par complément $P(X\ge1)=1-P(X=0)$.

## 8. Atelier guidé — arbre pondéré, probabilités totales et Bayes

Dans une population, la probabilité d'un événement \(A\) vaut \(P(A)=0{,}2\). Un signal positif \(B\) survient dans **80 % des cas lorsque \(A\) est réalisé**, et dans **10 % des cas lorsque \(A\) ne l'est pas**. Ce sont deux probabilités conditionnelles : \(P(B\mid A)=0{,}8\) et \(P(B\mid\bar A)=0{,}1\).

**Étape 1 — Branches de l'arbre.** On a \(P(\bar A)=0{,}8\), \(P(\bar B\mid A)=0{,}2\) et \(P(\bar B\mid\bar A)=0{,}9\). Les probabilités qui partent d'un même nœud somment à 1.

**Étape 2 — Produits sur les chemins.**

\[
P(A\cap B)=0{,}2\times0{,}8=\boxed{0{,}16},
\qquad P(\bar A\cap B)=0{,}8\times0{,}1=\boxed{0{,}08}.
\]

**Étape 3 — Somme des chemins incompatibles.**

\[
P(B)=P(A\cap B)+P(\bar A\cap B)
=0{,}16+0{,}08=\boxed{0{,}24}.
\]

**Étape 4 — Inverser correctement le conditionnement :**

\[
P(A\mid B)=\frac{P(A\cap B)}{P(B)}
=\frac{0{,}16}{0{,}24}=\boxed{\frac23}.
\]

Il serait **faux** de répondre 0,8 : c'est \(P(B\mid A)\), et non \(P(A\mid B)\). On peut également calculer \(P(A\mid\bar B)\) : le numérateur vaut \(0{,}2\times0{,}2=0{,}04\), le dénominateur \(P(\bar B)=1-0{,}24=0{,}76\). Donc \(P(A\mid\bar B)=0{,}04/0{,}76=\boxed{1/19}\).

### Tirages avec et sans remise : différence essentielle

Une urne contient quatre boules rouges et trois bleues. On tire deux boules.

- **Sans remise :** \(P(R_1\cap R_2)=(4/7)(3/6)=\boxed{2/7}\). Après la première rouge, il ne reste que trois rouges sur six boules : la probabilité change. Ces deux tirages ne sont **pas indépendants**.
- **Avec remise :** \(P(R_1\cap R_2)=(4/7)^2=\boxed{16/49}\). La composition redevient identique avant chaque tirage, ce qui rend les deux essais indépendants dans ce modèle.

La loi binomiale s'applique lorsque le nombre d'essais est fixé, avec **indépendance** et **probabilité de succès constante**. Dans cet exemple sans remise, on ne peut pas l'utiliser directement.

### Deux problèmes de transfert

**A.** Dans un autre système : \(P(A)=0{,}3\), \(P(B\mid A)=0{,}9\) et \(P(B\mid\bar A)=0{,}2\). Calculer \(P(B)\) puis \(P(A\mid B)\).

**B.** Sac de deux boules rouges et trois bleues, deux tirages. Calculer \(P(\text{deux rouges})\) sans remise, puis avec remise. Préciser dans quel cas la probabilité de rouge au deuxième tirage dépend du premier.

### Corrections commentées

**A.** \(P(B)=0{,}3\times0{,}9+0{,}7\times0{,}2=0{,}27+0{,}14=\boxed{0{,}41}\). Puis \(P(A\mid B)=0{,}27/0{,}41=\boxed{27/41\approx0{,}6585}\). Ne pas confondre ce résultat avec \(0{,}9\).

**B.** Sans remise : \((2/5)(1/4)=\boxed{1/10}\), car il reste une rouge parmi quatre après un premier succès. Avec remise : \((2/5)(2/5)=\boxed{4/25}\). Les deux probabilités ne sont pas égales : sans remise, les tirages sont dépendants.

**Pièges à surveiller :** additionner des branches d'un même chemin au lieu de les multiplier, inverser la conditionnelle, utiliser la formule binomiale sans indépendance, oublier que les probabilités doivent rester entre 0 et 1.

---

## Exercices
1. Dé équilibré : probabilité d'obtenir un résultat pair ou strictement supérieur à 4 ?
2. Tirage de deux boules **sans remise** d'un sac 3 rouges/2 bleues : probabilité de 2 rouges ?
3. Deux événements vérifient $P(A)=0{,}4$, $P(B)=0{,}5$, $P(A\cap B)=0{,}2$. Sont-ils indépendants ?
4. Dans une ville, 20 % des personnes sont abonnées. Une publicité est vue par 70 % des abonnés et 10 % des non-abonnés. Calculer la probabilité globale de voir la publicité.
5. Reprendre la question 4 : parmi ceux qui l'ont vue, probabilité d'être abonné ?
6. $X$ vaut 0 avec probabilité $0{,}7$ et 10 avec $0{,}3$ : $E(X)$ et $V(X)$ ?
7. $X\sim\mathcal B(4,0{,}25)$. Calculer $P(X=0)$ et $P(X\ge1)$.
8. Combien de façons de sélectionner 3 personnes parmi 6, sans ordre ?

---

## Corrigés
1. Pair $\{2,4,6\}$, $>4$ $\{5,6\}$, union $\{2,4,5,6\}$ : $\boxed{4/6=2/3}$.
2. $3/5\times2/4=\boxed{3/10}$.
3. $0{,}4\times0{,}5=0{,}2=P(A\cap B)$ ; $\boxed{\text{oui}}$.
4. $0{,}2(0{,}7)+0{,}8(0{,}1)=\boxed{0{,}22}$.
5. $P(\text{abonné}\mid\text{vu})=0{,}14/0{,}22=\boxed{7/11\approx63{,}6\%}$.
6. $E=0(0{,}7)+10(0{,}3)=\boxed3$ ; $E(X^2)=100(0{,}3)=30$, $V=30-9=\boxed{21}$.
7. $P(X=0)=(3/4)^4=\boxed{81/256}$ ; $P(X\ge1)=\boxed{175/256}$.
8. $\binom63=6!/(3!3!)=\boxed{20}$.

## Maîtrise
Tracer de mémoire un arbre de probabilités, ne jamais inverser $P(A\mid B)$ et $P(B\mid A)$ ; justifier explicitement les **3 conditions** d'une loi binomiale.