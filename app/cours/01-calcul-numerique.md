# 01 — Calcul numérique : les fondations

**Objectifs :** calculer exactement avec entiers, décimaux, fractions, puissances et racines ; maîtriser les signes, la proportionnalité et les pourcentages. Prérequis : aucun. **Durée indicative : 5–8 h.**

## 1. Priorités et signes
Dans un calcul, traiter **parenthèses → puissances → multiplications/divisions → additions/soustractions**. À priorité égale, calculer de gauche à droite. Exemple :
$$8-2(3-5)^2=8-2\times4=0.$$
Attention : $-3^2=-9$ mais $(-3)^2=9$. Règle des signes : $(-)\times(-)=(+)$, $(-)\times(+) = (-)$ ; soustraire un négatif revient à additionner.

**Astuce :** placer des parenthèses supplémentaires si le signe est ambigu.

## 2. Fractions
Pour $b,d\ne0$ :
$$\frac ab+\frac cd=\frac{ad+bc}{bd},\quad\frac ab\times\frac cd=\frac{ac}{bd},\quad\frac ab\div\frac cd=\frac{ad}{bc}\quad(c\ne0).$$
Pour une somme, prendre le plus petit dénominateur commun quand c'est possible. Une fraction doit être **simplifiée**, mais on ne peut simplifier que des **facteurs** communs, jamais des morceaux d'une somme : $(x+2)/x\ne 2$.

**Exemple guidé :**
$$\frac56-\frac34=\frac{10}{12}-\frac9{12}=\boxed{\frac1{12}}.$$
Et $\frac{2/3}{5/4}=(2/3)\times(4/5)=\boxed{8/15}$.

## 3. Puissances et notation scientifique
Pour $a\ne0$ et $m,n$ entiers : $a^ma^n=a^{m+n}$ ; $a^m/a^n=a^{m-n}$ ; $(a^m)^n=a^{mn}$ ; $a^0=1$ ; $a^{-n}=1/a^n$.
Exemple : $10^{-3}=0{,}001$, $2^3\cdot2^{-5}=2^{-2}=1/4$.

Notation scientifique : $N=a\times10^n$, $1\le |a|<10$. Ainsi $0{,}00042=4{,}2\times10^{-4}$.

## 4. Racines carrées
$\sqrt a$ n'existe dans les réels que si $a\ge0$ ; $\sqrt{a^2}=|a|$. Pour $a,b\ge0$, $\sqrt{ab}=\sqrt a\sqrt b$ ; mais **$\sqrt{a+b}\ne\sqrt a+\sqrt b$** en général.
Exemple : $\sqrt{72}=\sqrt{36\cdot2}=6\sqrt2$. Pour un dénominateur $1/\sqrt2$, on peut écrire $\sqrt2/2$.

## 5. Proportions et pourcentages
$p\%$ signifie $p/100$. Une augmentation de $p\%$ multiplie par $1+p/100$ ; une diminution multiplie par $1-p/100$. Deux variations successives se **multiplient**, elles ne s'additionnent pas.

Exemple : 200 € + 10 %, puis − 10 % : $200\times1{,}10\times0{,}90=\boxed{198\text{ €}}$ (ce n'est pas 200 €). Pour retrouver le prix initial à partir de 198 € après remise de 10 %, calculer $198/0{,}90=220$ €.

Proportionnalité : $y=kx$. Si 3 kg coûtent 7,50 €, $k=2{,}50$ €/kg et 5 kg coûtent 12,50 €.

## 6. Ordres de grandeur et arrondis
Ne pas arrondir les résultats intermédiaires inutilement. Un résultat doit être compatible avec les unités, positif quand il représente une durée ou une masse, et d'un ordre de grandeur plausible.

## 7. Atelier approfondi — un calcul exact avant les approximations

**Situation.** Un produit vaut 120 €. Son prix augmente de 20 %, puis le nouveau prix baisse de 25 %.

**Étape 1 — Traduire chaque évolution en coefficient.** La hausse de 20 % correspond au facteur \(1+20/100=1{,}20\). La baisse de 25 % correspond à \(1-25/100=0{,}75\).

**Étape 2 — Composer dans le bon ordre :**

\[
P_f=120\times1{,}20\times0{,}75=\boxed{108\text{ €}}.
\]

La variation totale est \((108-120)/120=-0{,}10\), soit une **baisse de 10 %**. Même si la somme algébrique des taux vaut \(-5\%\), celle-ci ne représente pas l'évolution réelle du prix.

**Étape 3 — Retrouver un prix antérieur.** Après une remise de 15 %, un autre prix vaut 102 €. Le coefficient de remise étant \(0{,}85\), le prix avant remise \(P\) satisfait \(0{,}85P=102\). Ainsi :

\[
P=\frac{102}{0{,}85}=\boxed{120\text{ €}}.
\]

Il faut **diviser** par le coefficient pour revenir au prix initial, pas ajouter arbitrairement 15 % au montant final.

**Étape 4 — Combiner des fractions exactement.** Calculons

\[
E=\frac{\frac34-\frac23}{\frac56}.
\]

La différence au numérateur vaut \(9/12-8/12=1/12\). Diviser par \(5/6\) revient à multiplier par son inverse \(6/5\) :

\[
E=\frac1{12}\times\frac65=\boxed{\frac1{10}}.
\]

**Contrôle :** \(0{,}75-0{,}666\ldots\) est positif et petit ; le quotient final \(0{,}1\) est plausible. Conserver \(1/12\), et non une approximation \(0{,}08\), évite la perte de précision.

### Deux problèmes de transfert

**A.** Un article coûte 250 €. Il augmente de 12 %, puis baisse de 10 %. Calculer le prix final et la variation totale en pourcentage.

**B.** Simplifier exactement \(\left(\frac56+\frac14\right)\times\frac{12}{13}\) sans passer par des arrondis.

### Corrections commentées

**A.** Les facteurs sont \(1{,}12\) et \(0{,}90\). Le nouveau prix vaut \(250\times1{,}12\times0{,}90=\boxed{252\text{ €}}\). Le coefficient total est \(1{,}008\), soit une **hausse de 0,8 %**. Ajouter les taux \(12-10=2\%\) donnerait une réponse fausse.

**B.** Le dénominateur commun de 6 et 4 est 12. La parenthèse vaut \(10/12+3/12=13/12\). Le produit est \((13/12)(12/13)=\boxed1\), par simplification des **facteurs** communs.

**Pièges à surveiller :** traiter un pourcentage comme un montant fixe, confondre addition et multiplication des coefficients, simplifier à travers une somme sans factoriser, arrondir trop tôt.

---

## Exercices — sans regarder le corrigé
1. $7-3(2-5)^2$.
2. $\frac{3}{4}+\frac{5}{6}-\frac{1}{3}$.
3. $\frac{9}{10}\div\frac{3}{5}$.
4. Simplifier $\frac{2^5\times2^{-2}}{2^4}$ ; écrire $0{,}000078$ en notation scientifique.
5. Simplifier $\sqrt{50}+2\sqrt8$.
6. Un produit coûte 80 €. Son prix augmente de 25 % puis baisse de 20 %. Prix final ? Variation totale ?
7. Une somme après remise de 15 % vaut 68 €. Prix avant remise ?
8. Vrai ou faux ? (a) $\sqrt{4+9}=2+3$ ; (b) $(-2)^4=16$ ; (c) $1/2+1/3=2/5$.

---

## Corrigés raisonnés
1. $2-5=-3$, carré 9 ; $7-27=\boxed{-20}$.
2. Dénominateur commun 12 : $9/12+10/12-4/12=\boxed{15/12=5/4}$.
3. Multiplier par l'inverse : $9/10\times5/3=\boxed{3/2}$.
4. $2^{5-2-4}=\boxed{1/2}$ ; $\boxed{7{,}8\times10^{-5}}$.
5. $\sqrt{50}=5\sqrt2$ et $2\sqrt8=4\sqrt2$ ; $\boxed{9\sqrt2}$.
6. $80\times1{,}25\times0{,}80=\boxed{80\text{ €}}$ ; $\boxed{0\%}$.
7. $0{,}85P=68$ donc $P=\boxed{80\text{ €}}$.
8. (a) Faux, $\sqrt{13}\ne5$ ; (b) Vrai ; (c) Faux, $1/2+1/3=5/6$.

## Maîtrise
Sans modèle : savoir expliquer pourquoi on inverse dans une division de fractions, pourquoi une baisse de 10 % n'annule pas une hausse de 10 %, et pourquoi $\sqrt{x^2}=|x|$. Faire 7/8 minimum puis refaire à J+7.