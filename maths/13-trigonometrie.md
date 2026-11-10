# 13 — Trigonométrie : cercle, radians, sinus et cosinus

**Statut : jalon 21 facultatif dans le syllabus SONATE Côte d'Azur 2026-2027 ; demandé dans les programmes d'autres universités, notamment UGA et Rennes.** Préreq. : 01, 03, 05. Durée : 5–8 h.

## 1. Triangle rectangle et cercle trigonométrique
Dans un triangle rectangle, pour un angle aigu $\theta$ :
$$\cos\theta=\frac{\text{adjacent}}{\text{hypoténuse}},\quad\sin\theta=\frac{\text{opposé}}{\text{hypoténuse}},\quad \tan\theta=\frac{\sin\theta}{\cos\theta}.$$
Ces définitions par triangle sont pour les angles aigus ; le **cercle unité** étend $\sin,\cos$ à tout réel. Le point du cercle d'angle $t$ (en radians) a pour coordonnées $(\cos t;\sin t)$.

## 2. Radians
Un tour vaut $2\pi$ radians $=360^\circ$ ; un demi-tour $\pi=180^\circ$.
$$t_{\mathrm{rad}}=\theta_{\mathrm{deg}}\frac\pi{180}.$$
Exemples : $30^\circ=\pi/6$ ; $135^\circ=3\pi/4$. Les formules de dérivation $\sin'=\cos$ et $\cos'=-\sin$ supposent l'angle en **radians**.

## 3. Valeurs remarquables
| $t$ | $0$ | $\pi/6$ | $\pi/4$ | $\pi/3$ | $\pi/2$ |
|---|---:|---:|---:|---:|---:|
| $\cos t$ | 1 | $\sqrt3/2$ | $\sqrt2/2$ | $1/2$ | 0 |
| $\sin t$ | 0 | $1/2$ | $\sqrt2/2$ | $\sqrt3/2$ | 1 |

Sur le cercle, sinus = coordonnée verticale ; cosinus = horizontale.
$$\sin^2t+\cos^2t=1;\quad \sin(t+2\pi)=\sin t;\quad\cos(t+2\pi)=\cos t.$$
Symétries : $\sin(-t)=-\sin t$ (impaire), $\cos(-t)=\cos t$ (paire).

## 4. Formules utiles
$$\cos(a-b)=\cos a\cos b+\sin a\sin b,$$
$$\cos(a+b)=\cos a\cos b-\sin a\sin b,$$
$$\sin(a+b)=\sin a\cos b+\cos a\sin b.$$
À connaître aussi : $\cos(2t)=2\cos^2t-1=1-2\sin^2t$.

## 5. Résolution d'équations trigonométriques
Pour $t\in\mathbb R$ :
- $\sin t=0$ $\iff t=k\pi$ avec $k\in\mathbb Z$.
- $\cos t=0$ $\iff t=\pi/2+k\pi$.
- $\cos t=\cos\alpha$ $\iff t=2k\pi\pm\alpha$.
- $\sin t=\sin\alpha$ $\iff t=\alpha+2k\pi$ **ou** $t=\pi-\alpha+2k\pi$.

Exemple : sur $[0;2\pi[$, $\sin t=1/2$ donne $\boxed{\{\pi/6;5\pi/6\}}$.

## 6. Étude de fonction
Pour $f(x)=2\sin x+\cos x$ :
$f'(x)=2\cos x-\sin x$. Pour une représentation graphique ou une étude, garder les valeurs exactes et vérifier l'intervalle demandé. Domaine de $\tan x$ : $x\ne\pi/2+k\pi$.

## 7. Atelier approfondi — angle, cercle et résolution

**Objectif :** distinguer l'angle en degrés et en radians, puis résoudre une équation en donnant toutes les solutions de l'intervalle demandé.

**Étape 1 — Convertir.** Pour \(150^\circ\), la formule \(150\pi/180\) donne \(\boxed{5\pi/6}\). Cet angle est dans le deuxième quadrant : le cosinus est négatif et le sinus positif.

**Étape 2 — Valeurs exactes.** Comme \(5\pi/6=\pi-\pi/6\), on a \(\cos(5\pi/6)=-\sqrt3/2\) et \(\sin(5\pi/6)=1/2\). On vérifie \(\cos^2t+\sin^2t=3/4+1/4=1\).

**Étape 3 — Résoudre sur un tour.** Pour \(\sin x=1/2\) avec \(x\in[0;2\pi[\), les deux solutions sont \(\boxed{x=\pi/6\text{ ou }x=5\pi/6}\). Sur \(\mathbb R\), ajouter \(2k\pi\) à chacune, \(k\in\mathbb Z\). L'intervalle \([0;2\pi[\) exclut \(2\pi\).

**Étape 4 — Dériver.** Pour \(f(x)=2\sin x-\cos x\), \(f'(x)=2\cos x+\sin x\), à condition que \(x\) soit mesuré en radians. En \(x=0\), \(f'(0)=2\).

### Deux problèmes de transfert

**A.** Convertir \(210^\circ\) en radians, puis calculer \(\sin(210^\circ)\) et \(\cos(210^\circ)\) sans calculatrice.

**B.** Résoudre \(\cos x=-1/2\) sur \([0;2\pi[\), puis calculer la dérivée en \(0\) de \(g(x)=3\cos x+4\sin x\).

### Corrections commentées

**A.** \(210^\circ=210\pi/180=\boxed{7\pi/6}\). L'angle est dans le troisième quadrant et son angle de référence est \(\pi/6\), d'où \(\boxed{\sin(7\pi/6)=-1/2}\) et \(\boxed{\cos(7\pi/6)=-\sqrt3/2}\).

**B.** Le cosinus vaut \(-1/2\) aux angles du deuxième et troisième quadrants : \(\boxed{x=2\pi/3\text{ ou }x=4\pi/3}\). Ensuite \(g'(x)=-3\sin x+4\cos x\), donc \(\boxed{g'(0)=4}\).

**Pièges :** oublier une deuxième solution, confondre radians et degrés dans la dérivée, appliquer la tangente quand \(\cos x=0\).

---

## Exercices
1. Convertir $150^\circ$ en radians.
2. Donner $\cos(2\pi/3)$ et $\sin(2\pi/3)$.
3. Calculer $\sin^2(\pi/6)+\cos^2(\pi/6)$.
4. Résoudre $\cos x=0$ sur $[0;2\pi[$.
5. Résoudre $\sin x=\sqrt3/2$ sur $[0;2\pi[$.
6. Dériver $f(x)=3\cos x-2\sin x$.
7. Un triangle rectangle a hypoténuse 10 et angle $30^\circ$. Longueur du côté opposé ?
8. Simplifier $1-\cos^2x$.

---

## Corrigés
1. $150\pi/180=\boxed{5\pi/6}$.
2. Angle du deuxième quadrant : $\boxed{-1/2}$ et $\boxed{\sqrt3/2}$.
3. $1/4+3/4=\boxed1$.
4. $\boxed{x=\pi/2\text{ ou }3\pi/2}$.
5. $\boxed{x=\pi/3\text{ ou }2\pi/3}$.
6. $\boxed{-3\sin x-2\cos x}$.
7. $10\sin30^\circ=10(1/2)=\boxed5$.
8. D'après $\sin^2x+\cos^2x=1$ : $\boxed{\sin^2x}$.

## Maîtrise
Savoir tracer mentalement le cercle des angles usuels, donner les deux solutions dans un tour et **ne pas mélanger degrés et radians**.