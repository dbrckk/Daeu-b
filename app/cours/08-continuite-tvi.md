# 08 — Continuité, théorème des valeurs intermédiaires, dichotomie

**Objectifs :** vérifier la continuité, démontrer l'existence (puis l'unicité si possible) d'une solution et l'encadrer numériquement. Préreq. : 05–07. Durée : 4–6 h.

## 1. Continuité
Une fonction est continue en $a$ si $f(a)$ existe et $\lim_{x\to a}f(x)=f(a)$. Les polynômes sont continus sur $\mathbb R$. Quotients, racines, logarithmes sont continus **sur leurs domaines**. La fonction
$$f(x)=\begin{cases}x+1&x<1\\4&x\ge1\end{cases}$$
n'est pas continue en 1 car la limite à gauche vaut 2 tandis que $f(1)=4$.

## 2. Théorème des valeurs intermédiaires (TVI)
Si $f$ est **continue** sur $[a;b]$, pour toute valeur $k$ comprise entre $f(a)$ et $f(b)$, il existe **au moins un** $c\in[a;b]$ tel que $f(c)=k$.

Cas classique : $f(a)\times f(b)<0$ garantit au moins un zéro dans $]a;b[$. Le TVI seul ne donne **pas l'unicité** ; une stricte monotonie permet de la justifier.

## 3. Exemple rédigé de bout en bout
On cherche les solutions de $x^3+x-1=0$ sur $[0;1]$.
1. $f(x)=x^3+x-1$ est un polynôme, donc continu sur $[0;1]$.
2. $f(0)=-1<0$ et $f(1)=1>0$ : par le TVI, **au moins un** zéro $\alpha\in]0;1[$.
3. $f'(x)=3x^2+1>0$ partout : $f$ est strictement croissante ; $\alpha$ est **unique**.
4. Pour approcher $\alpha$, essayer $f(0{,}5)=-0{,}375<0$, $f(0{,}75)=0{,}171875>0$ : $\boxed{\alpha\in]0{,}5;0{,}75[}$.

## 4. Dichotomie
À partir d'un intervalle $[a;b]$ contenant un zéro avec changement de signe : calculer le milieu $m=(a+b)/2$, puis garder la moitié où les signes aux extrémités diffèrent. Répéter jusqu'à l'amplitude voulue. Après $n$ étapes, la longueur initiale $b-a$ devient $(b-a)/2^n$.

**Exemple :** si l'intervalle initial mesure 1, après 7 étapes la largeur est $1/128<0{,}01$.

## 5. Comment bien rédiger à l'examen
Dire « la courbe traverse l'axe » ne suffit pas. Écrire explicitement : **continuité sur l'intervalle**, valeurs et signes aux bornes, **application du TVI**, puis **stricte monotonie** si l'on revendique l'unicité. Aucun dessin ne remplace ces justifications.

## 6. Atelier de rédaction — TVI, unicité et trois dichotomies

Considérons \(h(x)=x^3+2x-2\) sur \([0;1]\). Le raisonnement se déroule dans cet ordre :

1. **Continuité :** \(h\) est un polynôme ; elle est continue sur \([0;1]\).
2. **Signes :** \(h(0)=-2<0\) et \(h(1)=1>0\).
3. **Existence :** par le théorème des valeurs intermédiaires, il existe **au moins un** zéro \(\alpha\) dans \(]0;1[\).
4. **Unicité :** \(h'(x)=3x^2+2>0\) sur \(\mathbb R\) ; \(h\) est strictement croissante. Le zéro est donc **unique**.
5. **Approche numérique :** appliquer la dichotomie en conservant à chaque fois l'intervalle aux signes opposés.

| Itération | Milieu testé | Valeur de \(h\) | Nouvel intervalle |
|---|---|---|---|
| 1 | \(0{,}5\) | \(-0{,}875\) | \([0{,}5;1]\) |
| 2 | \(0{,}75\) | \(-0{,}078125\) | \([0{,}75;1]\) |
| 3 | \(0{,}875\) | \(0{,}419921875\) | \([0{,}75;0{,}875]\) |

Après trois itérations, la largeur vaut \(1/8=0{,}125\). On n'a pas démontré que le milieu est **exactement** la racine : on a obtenu un encadrement rigoureux.

### Un deuxième exemple : existence et valeur exacte

Sur \([0;1]\), on étudie \(g(x)=e^{2x}-5\).

- \(g\) est continue car l'exponentielle et la fonction affine le sont.
- \(g(0)=1-5=-4<0\) et \(g(1)=e^2-5>0\) ; il existe un zéro dans \(]0;1[\).
- \(g'(x)=2e^{2x}>0\) sur \([0;1]\) ; le zéro est unique.
- L'équation \(e^{2x}=5\) donne \(2x=\ln 5\), soit \(\boxed{x=\ln(5)/2\approx0{,}8047}\), bien dans l'intervalle étudié.

**À retenir :** le TVI seul démontre l'existence. Même si une fonction change de signe, elle peut couper l'axe plusieurs fois. Une **stricte monotonie prouvée** apporte l'unicité.

### Deux problèmes de transfert

**A.** Montrer que \(f(x)=x^2-2\) a un seul zéro sur \([1;2]\) et donner l'intervalle obtenu après une dichotomie.

**B.** On considère \(q(x)=x^3-x\) sur \([-1;1]\). Trouver tous ses zéros et expliquer pourquoi la continuité n'implique pas l'unicité.

### Corrections commentées

**A.** \(f\) est continue sur \([1;2]\), \(f(1)=-1\) et \(f(2)=2\) : existence par le TVI. De plus \(f'(x)=2x>0\) sur cet intervalle : unicité. La racine est \(\sqrt2\). Milieu \(1{,}5\), \(f(1{,}5)=0{,}25>0\) : l'encadrement devient \(\boxed{[1;1{,}5]}\).

**B.** \(q(x)=x(x-1)(x+1)\) : les trois zéros sont \(\boxed{-1,\ 0,\ 1}\). La fonction est continue sur tout \(\mathbb R\), mais n'est pas strictement monotone sur \([-1;1]\). Le TVI ne donne jamais, à lui seul, « exactement une solution ».

**Pièges à surveiller :** appliquer le TVI sur un intervalle contenant une discontinuité, confondre solution approchée et exacte, conclure à l'unicité sans étude des variations.

---

## Exercices
1. Démontrer qu'il existe une solution de $x^3-2=0$ dans $]1;2[$.
2. Cette solution est-elle unique sur $\mathbb R$ ? Justifier.
3. $g(x)=x^2-1$ : montrer qu'il y a au moins une racine sur $[-2;0]$ et expliquer pourquoi le TVI seul ne prouve pas « exactement une ».
4. Une fonction continue sur $[0;2]$ vérifie $f(0)=3$, $f(2)=5$. Le TVI permet-il de garantir $f(x)=4$ ? $f(x)=8$ ?
5. Pour $h(x)=x^3+x-1$, indiquer la moitié de $[0;1]$ conservée après une dichotomie ; puis après deux itérations.
6. Donner un contre-exemple simple d'une fonction non continue qui change de signe sans s'annuler.

---

## Corrigés
1. $f(x)=x^3-2$ continue ; $f(1)=-1$, $f(2)=6$. TVI ⇒ au moins un zéro.
2. $f'(x)=3x^2\ge0$ ; plus simplement, $x\mapsto x^3$ est strictement croissante sur $\mathbb R$, donc $x^3-2=0$ a **une seule** solution réelle, $\sqrt[3]2$.
3. $g(-2)=3$, $g(0)=-1$ ; TVI ⇒ au moins une racine. Le TVI affirme une **existence**, jamais une unicité en soi (ici, on peut par ailleurs montrer l'unicité sur $[-2;0]$).
4. $4$ est entre 3 et 5 : **oui**. $8$ ne l'est pas : **aucune garantie** (elle peut éventuellement être atteinte malgré tout).
5. $h(0{,}5)=-0{,}375$ : première moitié $[0{,}5;1]$. Milieu suivant $0{,}75$, $h(0{,}75)=0{,}171875$ : deuxième moitié $[0{,}5;0{,}75]$.
6. $f(x)=-1$ pour $x<0$, $f(x)=1$ pour $x\ge0$ : changement de signe, aucun zéro, discontinuité en 0.

## Maîtrise
Être capable de produire sans aide une démonstration en 4 lignes : **continuité + changement de signe + TVI + unicité par monotonie**.