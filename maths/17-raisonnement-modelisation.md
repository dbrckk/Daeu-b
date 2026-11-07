# 17 — Raisonnement, modélisation et rédaction d'examen

**Objectifs :** expliquer une méthode, vérifier les conditions d'un théorème, construire un modèle, éviter les erreurs classiques et rendre une copie lisible. Complément transversal de tous les chapitres. Durée : 4–6 h.

## 1. Proposition, implication et équivalence
$P\Rightarrow Q$ : si $P$ est vraie, alors $Q$ est vraie. Cela n'implique pas $Q\Rightarrow P$. $P\Leftrightarrow Q$ exprime les **deux sens**.
Exemple : $x=2\Rightarrow x^2=4$, mais $x^2=4\not\Rightarrow x=2$ (aussi $x=-2$).
Ne jamais passer de $x^2=4$ à $x=2$ en perdant la solution négative.

## 2. Conditions avant les opérations
Avant de diviser par $x$, annoncer $x\ne0$ ; avant de prendre $\ln x$, annoncer $x>0$ ; avant de multiplier une inéquation par un terme de signe inconnu, étudier ce signe.
Exemple résoudre $x(x-2)=0$ : **ne pas diviser par $x$** car cela éliminerait $x=0$. Factoriser et appliquer le produit nul.

## 3. Trois techniques de démonstration
- **Directe :** partir des hypothèses vers la conclusion.
- **Par contraposée :** prouver $\neg Q\Rightarrow\neg P$ pour établir $P\Rightarrow Q$.
- **Par récurrence :** initialisation, hérédité et conclusion pour les propriétés à rang entier (chapitre 10).
Pour réfuter un énoncé universel, **un seul contre-exemple** suffit.

## 4. Preuve courte : la somme de deux entiers pairs
Si $a=2m$ et $b=2n$ avec $m,n$ entiers, alors $a+b=2(m+n)$, entier multiple de 2. Donc la somme de deux pairs est paire.

## 5. Modéliser en cinq étapes
1. **Choisir l'inconnue**, et son domaine réel ou physique.
2. **Traduire les données** en équation, fonction, suite ou événement.
3. **Résoudre** avec une méthode justifiée.
4. **Vérifier** les conditions et remplacer dans le modèle initial.
5. **Conclure** avec valeur, unité et interprétation.

**Exemple guidé.** Un abonnement coûte 10 € fixes puis 2 € par usage ; formule $C(n)=10+2n$, avec $n$ entier $\ge0$. Budget maximum 25 € : $10+2n\le25\Rightarrow n\le7{,}5$. Comme $n$ entier, **au maximum 7 usages**, coût 24 €. Écrire « 7,5 usages » serait une erreur de modélisation.

## 6. Contrôle des résultats
- Pourcentages : une remise de 30 % ne peut produire une hausse.
- Aires : dimension en unités au carré.
- Probabilités : résultat obligatoirement entre 0 et 1.
- Longueur / temps : normalement positifs dans les problèmes concrets.
- Solutions d'une équation : essayer dans **l'équation originale**, pas seulement dans une forme transformée potentiellement non équivalente.

## 7. Plan d'une copie de mathématiques
Pour chaque question : **données et domaine → règle/théorème et hypothèses → calcul propre → conclusion encadrée**.
Pour une étude de fonction : domaine, limites aux bornes, dérivée/signe, tableau de variations, zéros/valeurs, éventuelles asymptotes et graphique qualitatif.

## 8. Gestion du temps
Lire les 3 exercices dès le début. Commencer par les questions accessibles, ne pas s'enfermer sur une question à faible barème. Réserver une dernière passe pour les **signes, domaines, unités, parenthèses**, particulièrement dans les fractions et les dérivées.

## Exercices
1. Expliquer pourquoi « $x^2=9\Rightarrow x=3$ » est faux.
2. Pour $\frac{x^2-1}{x-1}=2$, quelle valeur de $x$ doit être exclue ? Y a-t-il des solutions ?
3. « Toutes les fonctions dérivables ont une dérivée continue. » Vrai ou faux ? (approfondissement : un contre-exemple suffit.)
4. Un article de coût fixe 50 € et coût variable 3 €/pièce est vendu 8 €/pièce. Donner $B(n)$ et le premier nombre entier $n$ donnant un bénéfice **strictement positif**.
5. Une probabilité calculée vaut 1,25 : conclusion ?
6. Le tarif d'un taxi est $C(d)=4+1{,}8d$ en € pour $d\ge0$ km. Distance maximale pour 20 € ?
7. Une recette est $R(x)=-x^2+8x$. Justifier le maximum sur $[0;8]$.

---

## Corrigés
1. $x=-3$ vérifie aussi $x^2=9$ ; solutions $\boxed{\{-3,3\}}$.
2. Domaine $x\ne1$. Pour $x\ne1$, fraction égale à $x+1$ ; l'égalité 2 donnerait $x=1$ **interdit**. Donc $\boxed{\varnothing}$.
3. **Faux** : la fonction $f(x)=x^2\sin(1/x)$ si $x\ne0$ et $f(0)=0$ est dérivable en 0 avec $f'(0)=0$ mais sa dérivée $f'(x)=2x\sin(1/x)-\cos(1/x)$, $x\ne0$, n'a pas de limite en 0. La continuité de $f'$ n'est pas garantie.
4. $B(n)=8n-(50+3n)=5n-50$ ; $B>0$ pour $n>10$ ; $\boxed{11\text{ pièces}}$.
5. Résultat impossible : une erreur de modèle, de somme, de conditionnement ou d'arithmétique est présente. Reprendre le calcul.
6. $4+1{,}8d\le20\Rightarrow d\le16/1{,}8=\boxed{80/9\approx8{,}89\text{ km}}$.
7. $R(x)=-(x-4)^2+16$ ; sur $[0;8]$ maximum $\boxed{16}$ pour $x=4$.

## Maîtrise
Savoir expliquer **pourquoi** une solution est écartée, rédiger une phrase de conclusion et détecter un résultat physiquement/probabilistiquement impossible.