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