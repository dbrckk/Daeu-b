### Coefficients décimaux exacts devant les racines (v49)

Le correcteur accepte maintenant les facteurs décimaux courts devant ou après une racine, avec point ou virgule : `0,5√(x)=1`, `2.5*√(x)=5`, `√(x)*0,5=1` et `√(x)/1.25=1.6`. Le coefficient est converti en fraction **exacte**, sans flottants ni arrondis, puis la racine est isolée avant la vérification des solutions. Les facteurs nuls, décimales trop longues, multiplications par une variable et expressions ambiguës restent non vérifiés. Les signes reconnus dans le cahier doivent être confirmés avant la correction.

# Commencer les mathématiques du DAEU B — première séance

**Accès direct :** https://daeu-b-maths-dbrckk.onrender.com/#commencer

Prévoir un smartphone Android (ou un PC) et environ 20 à 30 minutes. Le cahier de calcul intégré permet de poser les opérations sans papier. Aucun compte, paiement ou installation n'est requis. Il s'agit d'une préparation, pas d'une inscription administrative ni d'une délivrance du diplôme.

## Valider en écrivant uniquement sur la feuille virtuelle

Le questionnaire contient maintenant une **grande feuille quadrillée** (900 × 1 200 unités et 1 260 px de largeur d'affichage, défilante horizontalement et verticalement sur téléphone). Écris tes opérations ou tes longues équations directement au doigt/stylet ; déplace la feuille avec les flèches ou active **Déplacer au doigt**, puis reviens à **Reprendre le stylo**. Chaque trait et chaque page sont sauvegardés automatiquement.

Pour remettre une réponse **sans recopier le résultat dans un autre champ** :

1. Trace au moins un trait de réponse sur la feuille.
2. Appuie sur **Valider ma réponse sur la feuille** au-dessus de la feuille.
3. Compare ton travail avec la réponse attendue et son explication.
4. Choisis **Oui, ma réponse correspond** ou **Non, je dois retravailler** ; la question est validée dans la séance et la progression est enregistrée.

### Première lecture automatique : réponses numériques
Pour une question demandant **un nombre** : écris la réponse finale **seule** sur la page courante, ou ajoute une page pour ne pas mélanger les calculs avec la valeur finale. Appuie sur **« Reconnaître le nombre écrit »**. L'application propose une transcription locale expérimentale (chiffres 0–9, nombres signés, décimaux simples et fractions écrites avec un trait oblique). **Vérifie la transcription**, puis appuie sur **« Oui, vérifier ce résultat »** : le moteur habituel corrige la valeur, sans la recopier dans un champ. Si la lecture est incorrecte ou impossible, rejette-la et recommence, ou utilise la comparaison au corrigé.

**Limite essentielle :** il ne s'agit **pas** encore d'un modèle de reconnaissance générale des mathématiques : équations sur plusieurs lignes, fractions empilées, dérivées et démonstrations manuscrites ne sont pas corrigées depuis les traits. Un résultat n'est jamais noté sans confirmation de la transcription. Le bouton **« Valider ma réponse sur la feuille »** continue d'afficher le corrigé et permet une **auto-évaluation assistée**, jamais une maîtrise autonome confirmée. Le clavier numérique et les QCM restent facultatifs selon l'exercice. Aucun abonnement ni service OCR payant.

### Sauvegarde des corrections manuscrites (v42)

Quand tu corriges les symboles d'une équation depuis les boutons tactiles, **chaque modification est enregistrée automatiquement dans le même cahier que les traits**. Après fermeture ou actualisation du navigateur, affiche « Lire mes équations manuscrites » : la transcription déjà corrigée est restaurée. Aucune exportation manuelle n'est requise. Si tu effaces, dessines ou modifies des traits sur cette page, l'ancienne transcription est invalidée automatiquement : la nouvelle lecture doit être relue.

Une transcription dont les caractères ont été **corrigés manuellement** peut être notée objectivement, mais sa validation sera comptée comme **réponse assistée**, sans attribuer un acquis autonome. Le moteur ne peut pas certifier qu'une formule saisie à la main reflète parfaitement le manuscrit. Une lecture non modifiée, confirmée visuellement, suit le comportement de correction habituel.

Le cahier reste conservé localement et dans les sauvegardes automatiques du navigateur. La synchronisation entre appareils nécessite toujours l'activation de la synchronisation cloud facultative ; l'enregistrement local ne protège pas contre la perte totale des données du téléphone.

### Racines multipliées ou divisées par une constante (v48)

Le contrôleur corrige désormais certaines équations contenant **un coefficient numérique constant non nul devant une racine carrée**, ou immédiatement après le radical : `2√(x)=4`, `2*√(x)=4`, `√(x)*2=4`, `√(x)/2=1` et `x+2√(x)=8`.

Il commence par isoler **une seule racine**, divise les deux membres par le coefficient exact, puis établit les conditions de signe, met au carré et vérifie chaque candidat dans **l'équation initiale**. Exemple : `x+2√(x)=8` donne après mise au carré les candidats `x=4` et `x=16`, mais seul `x=4` respecte l'équation d'origine. `x-2√(x)=0` possède bien **deux solutions**, `0` et `4`.

Le panneau tactile permet d'insérer et corriger `*` sans clavier physique. Les corrections manuscrites restent enregistrées et identifiées comme **assistées**. Les solutions irrationnelles sont comparées exactement, sans arrondi.

**Périmètre volontairement limité :** constantes entières explicites de 1 à 3 chiffres (un coefficient peut aussi être divisé par un entier non nul), expression affine autour du radical, une racine par équation. Les coefficients **variables** (`x√(x)`), radicaux imbriqués, division par zéro, plusieurs facteurs après le radical et puissances de la racine restent non vérifiés. Aucune équation n'est notée sur la seule transcription de l'encre.

### Racines avec termes additifs et vérification des solutions (v47)

Le vérificateur accepte désormais **une racine carrée accompagnée d'additions ou de soustractions affines**, écrite de l'un ou l'autre côté de l'égalité. Exemples : `√(x)+2=x`, `x-√(x)=2`, `2-√(x)=x` et `x+√(x)=5`. Il isole d'abord la racine, puis applique les **conditions de domaine et de signe avant de mettre au carré**. Les candidats sont ensuite contrôlés exactement dans l'équation d'origine.

Par exemple, `√(x)+2=x` a pour unique solution `x=4` : le candidat `x=1` obtenu après mise au carré est **parasite**, car `√1+2≠1`. Dans `x+√(x)=5`, la solution exacte est `x=(11−√21)/2` ; l'autre candidat est rejeté grâce au signe de `5−x`.

Le retour guidé montre **quatre étapes** pour ces équations : isoler le radical, fixer les conditions de signe, mettre au carré, puis vérifier chaque solution dans l'égalité initiale. Une approximation décimale reste insuffisante pour établir une égalité exacte.

**Limites :** une seule racine par égalité, facteur multiplicatif devant la racine non pris en charge, terme accompagnant la racine de degré au plus 1. Les expressions contenant plusieurs racines, un produit ou une division par le radical, les racines imbriquées et les équations nécessitant une résolution par intervalles restent non vérifiées. Le cahier manuscrit continue de demander confirmation de la transcription.

### Solutions irrationnelles exactes et méthode détaillée (v46)

Pour certaines équations à une racine carrée **isolée**, le correcteur conserve maintenant une solution irrationnelle sous une **écriture exacte** plutôt que de l'arrondir. Par exemple, pour `√(x+1)=x`, le seul candidat admissible est `x=(1+√(5))/2` : l'autre branche est écartée, car le membre sans racine serait négatif. Le même résultat écrit sous une forme mathématiquement équivalente est comparé sans conversion en nombre décimal.

Les deux solutions irrationnelles peuvent aussi être conservées quand elles sont toutes deux valides, par exemple `√(x²−1)=1` équivaut à `x²=2`. Une **approximation** (`x=1,41421356`) n'est pas considérée comme une égalité exacte. La notation manuscrite `x=-√(2)` peut être vérifiée comme solution irrationnelle négative dans le périmètre simple pris en charge.

Pour les équations rationnelles et radicales reconnues, le retour pédagogique rappelle maintenant **trois étapes** : déterminer le domaine, transformer l'équation sous les conditions appropriées, puis vérifier les candidats dans l'équation initiale. Ce contrôle guidé reste **une aide** ; il n'attribue pas de maîtrise autonome au quiz.

**Limites conservées :** racines imbriquées, radicaux non isolés, équations à solution par intervalle, dénominateurs quadratiques et résolution générale d'expressions irrationnelles ne sont pas garantis. La lecture manuscrite doit toujours être relue et confirmée ; les expressions hors périmètre sont indiquées comme non vérifiées.

### Correction des équations rationnelles et des racines parasites (v45)

Le contrôleur des étapes sait désormais **résoudre exactement certaines équations rationnelles** dont chaque dénominateur est une expression affine en x, à condition que le produit croisé soit de degré au plus 2. Il **conserve les valeurs interdites** : par exemple `(x−1)/(x−1)=1` n'est vrai que pour **x ≠ 1**. Si une multiplication par un dénominateur fait apparaître une solution interdite, elle est éliminée. Une étape suivante qui oublierait ces restrictions est signalée comme non équivalente.

Il vérifie aussi certaines **équations à une racine carrée isolée**, par exemple `√(x+1)=x−1`. La mise au carré produit plusieurs candidats, mais chacun est contrôlé **exactement dans l'équation initiale** et avec les conditions de signe ; une solution parasite est rejetée. Le moteur ne remplace jamais la vérification initiale par une simple mise au carré.

**Limites :** seules les solutions représentables exactement dans ce périmètre sont certifiées. Dénominateurs quadratiques, fractions rationnelles imbriquées, radicaux non isolés et intervalles de solutions restent *non vérifiés*. Certaines racines irrationnelles quadratiques peuvent désormais être contrôlées exactement en v46. La transcription manuscrite doit toujours être relue et confirmée. Ce vérificateur ne constitue pas une démonstration générale et ne transforme pas les réponses corrigées manuellement en acquis autonomes.

### Racines et fractions rationnelles manuscrites (v44)

La lecture locale reconnaît désormais un geste **√** avec une barre au-dessus d'un radicande court : par exemple `√(9)`, `√(2)` ou `√(x)`. Le vérificateur accepte seulement les **racines carrées exactes d'entiers** : `√(9)=3` ou `√(144)=12`. Les racines non carrées parfaites ou contenant x sont **transcrites, mais non vérifiées** ; il ne calcule pas leur domaine ni leur valeur par approximation.

La barre d'une fraction empilée peut aussi comporter un **dénominateur court en x** : par exemple `2/(x+1)`. Le lecteur conserve les parenthèses, mais le correcteur refuse de certifier ces équations rationnelles sans analyser les valeurs interdites du dénominateur. Les fractions imbriquées ne sont pas lues automatiquement.

La lecture doit être relue et peut être corrigée au toucher. **Aucune réponse numérique n'est inventée à partir d'un radical non évalué ou d'un quotient contenant x.**

### Correction de la feuille et des symboles reconnus (v41)

La **gomme à un trait** permet de toucher un trait erroné pour l'effacer sans effacer le reste de la page. Utilise « Annuler l'effacement » si nécessaire, puis « Reprendre le stylo ». Le cahier est sauvegardé automatiquement.

Quand l'analyse des équations ne comprend pas une partie de la copie, la transcription apparaît avec des **□** pour les symboles illisibles. Ouvre **« Corriger les symboles reconnus sans clavier »** : touche le caractère erroné, puis le bon symbole proposé à l'écran. Des boutons permettent de supprimer un caractère, d'en insérer un à droite ou de commencer une nouvelle ligne. Le manuscrit original est conservé.

**Aucune formule partiellement reconnue n'est notée.** Après la correction tactile, relis chaque ligne avant de faire analyser tes étapes ou de faire corriger la réponse finale. Certaines racines et fractions avec dénominateur en x peuvent désormais être transcrites, mais les expressions avec domaine à étudier ne sont pas validées mathématiquement. La correction tactile n'est pas un modèle de reconnaissance universelle.

### Lire et vérifier une chaîne d'équations manuscrites (expérimental)

Sur une **même page** du cahier, écris une égalité par ligne, par exemple : `2x+5=17`, `2x=12`, puis `x=6`. Utilise de grands symboles séparés. Appuie sur **« Lire mes équations manuscrites »**, puis relis attentivement la transcription proposée. Si elle est fidèle à ton écriture, appuie sur **« Oui, vérifier ces étapes »** : le contrôleur algébrique existant analyse les transformations et signale certaines erreurs d'équivalence. Si un symbole est incorrect, rejette la proposition et réécris-le, ou utilise le clavier mathématique facultatif.

Le lecteur local reconnaît les chiffres, `x`, `+`, `−`, `=`, `/`, les parenthèses simples, le carré manuscrit `²` placé en exposant et les **fractions empilées avec 1 à 3 chiffres par nombre, ou un court numérateur en x sur un entier non nul**. Exemples : `(x-2)(x+2)=0`, `x²=4` et `x=1/2`. La reconnaissance est **expérimentale** et doit être confirmée visuellement. **Racines non carrées parfaites, puissances supérieures, fractions imbriquées et démonstrations générales restent non corrigées automatiquement.** Lorsque la question demande la valeur de x, une dernière ligne manuscrite comme `x=6` ou `x=1/2` propose en plus **« Corriger mon résultat final »**. Vérifie la transcription avant de toucher le bouton : le résultat est alors noté avec le même correcteur que la saisie numérique, **sans écrire le résultat une deuxième fois ni ajouter de page**. La vérification des étapes reste séparée : si tu l'utilises, elle est enregistrée comme une aide. Les parenthèses peuvent être tracées dans les deux sens.

La transcription doit être confirmée avant l'analyse ; une erreur non détectée ne prouve pas que la réponse convient à l'énoncé, et cette analyse **ne note pas la question**. La consultation d'une vérification en cours de quiz est comptée comme une aide, pas comme une maîtrise autonome. Le lecteur fonctionne hors ligne après mise en cache.

## Première séance

1. Ouvrir le site et toucher **« Démarrer mon diagnostic »**. Jusqu'à dix questions sont proposées ; faire les calculs sans corrigé. Une erreur n'empêche pas de continuer.
2. À chaque réponse, lire la correction et identifier pourquoi la méthode a fonctionné ou non. La progression est enregistrée localement. Après rechargement, le bouton initial reprend la séance inachevée plutôt que de la remplacer.
3. Consulter **« Mes 20 jalons de mathématiques »** et le parcours conseillé. On peut aussi commencer directement par [le cours 01 — Calcul numérique](https://daeu-b-maths-dbrckk.onrender.com/course.html?course=01-calcul-numerique).
4. Choisir une séance d'exercices en mode « Découverte et consolidation », puis revenir plus tard en mode « Révisions à effectuer » lorsque des rappels arrivent à échéance.
5. **La progression est enregistrée automatiquement** à chaque réponse dans le navigateur et copiée dans IndexedDB. Aucun export manuel n'est nécessaire pour étudier sur ce téléphone. Pour récupérer le suivi en cas de changement de téléphone, ouvrir **« Ma progression sur tous mes appareils »** en bas de l'application, créer un accès privé avec adresse e-mail et mot de passe, confirmer l'adresse si demandé, puis se connecter. Une fois connecté et la synchronisation confirmée dans l'application, le cloud conserve la progression. Sans cette connexion, les deux copies restent sur le même téléphone : sa perte ou l'effacement complet des données du site restent un risque.

## Premier cycle de 7 jours (adaptable)

| Jour | Séance conseillée | Trace écrite |
| --- | --- | --- |
| J1 | Diagnostic initial et fractions | Une liste des erreurs de calcul |
| J2 | Puissances, racines et pourcentages | Trois exercices justifiés |
| J3 | Calcul littéral | Une identité remarquable démontrée |
| J4 | Équations et domaines | Deux résolutions vérifiées |
| J5 | Systèmes et inéquations | Un problème concret rédigé |
| J6 | Révisions dues | Refaire une erreur sans indice |
| J7 | Bilan et reprise | Expliquer une correction sans la relire |

Ce rythme est indicatif : des séances de 10 à 20 minutes avec pauses peuvent être plus utiles qu'une longue séance fatigante.

## Ce qui est utilisable

- **18 cours**, dont les 20 jalons principaux du référentiel SONATE Côte d'Azur 2026–2027 et des compléments universitaires.
- **157 emplacements de questions** (116 questions fixes et 41 modèles variables) avec corrections et rappels.
- **60 problèmes rédigés** A/B/C, divisés en 180 sous-questions, avec corrigés méthodologiques et reprises à J+7/J+30.
- **5 examens blancs** à quatre exercices (A/B fixes, C/D/E générés), chronométrés sur trois heures, avec correction objective indicative /20 et grilles de rédaction.
- En complément : le [cours 13 de trigonométrie](https://daeu-b-maths-dbrckk.onrender.com/course.html?course=13-trigonometrie) comprend trois problèmes de rédaction supplémentaires avec corrigés.

**Important :** la note automatique ne mesure pas la qualité des démonstrations écrites. Les comptes de progression ne certifient pas un niveau officiel ; les sujets et modalités varient selon les universités.

[Programme et référentiel](PROGRAMME.md) · [Parcours progressif](PARCOURS.md) · [Application de mathématiques](https://daeu-b-maths-dbrckk.onrender.com/#commencer)

## Rédiger sans papier

**Répondre uniquement sur la feuille :** dans un quiz, trace la réponse au doigt ou au stylet sur la grande feuille quadrillée (900 × 1200 unités, 1 260 px de largeur d'affichage). Le bouton **« Valider ma réponse sur la feuille »**, placé juste au-dessus de la feuille, affiche le corrigé sans exiger de recopier la réponse dans le champ. Compare ensuite les calculs et sélectionne « Oui, ma réponse correspond » ou « Non, je dois retravailler ». Il s'agit d'une **auto-évaluation** : les expressions complexes tracées au doigt ne sont pas lues automatiquement et ce résultat ne certifie pas la maîtrise. Sur les questions numériques, le lecteur expérimental peut proposer un nombre isolé, à vérifier visuellement avant que le correcteur automatique ne le note. Pour les longues équations, fais défiler la feuille horizontalement et verticalement, utilise « Déplacer au doigt » ou ajoute une page. Les anciennes feuilles restent lisibles.

Dans les quiz et examens blancs, le **cahier de calcul** propose une zone de rédaction multilignes et des touches pour les symboles (√, π, ×, ÷, ≤, ≥, ², etc.). Dans les problèmes, un cahier distinct permet de rédiger les étapes. Les brouillons, tracés au doigt et notes sont enregistrés automatiquement avec la progression. Lorsque la synchronisation cloud est activée avec un compte, ils sont inclus dans les sauvegardes du compte ; sans connexion cloud, ils restent sur cet appareil. L’**aperçu MathML** affiche les fractions superposées, puissances et racines comme sur une copie, mais la zone texte reste la source éditable. Le vérificateur corrige les calculs numériques, compare exactement les solutions réelles des équations du premier et du second degré et contrôle les **dérivées de polynômes de degré 0 à 6** : écris `f(x) = ...`, puis `f'(x) = ...` sur des lignes consécutives. Les coefficients rationnels sont comparés exactement. Il vérifie aussi certaines dérivées usuelles de sin, cos, exp et ln d'un argument affine, avec coefficients rationnels exacts. Il ne certifie pas les démonstrations, les compositions non affines, les puissances polynomiales supérieures à 6, les fonctions rationnelles générales ni la qualité des tracés.

### Dérivées avancées, sans papier

Le cahier propose un modèle **Dérivée avancée**. Exemple : `f(x) = (x+1)^3` puis `f'(x) = 3x² + 6x + 3` sur la ligne suivante. Le calcul compare exactement les coefficients rationnels et reconnaît les produits polynomiaux et puissances de degré initial 6 maximum. La correction explique le premier coefficient erroné. Les formes non prises en charge restent signalées comme non vérifiées, sans correction inventée.

### Dérivées usuelles — saisie sur téléphone

Les boutons **Dérivée sin/cos**, **Dérivée exp** et **Dérivée ln** insèrent une définition et une proposition éditables au doigt. Exemples contrôlés : 
- `f(x) = 2sin(3x+1)` puis `f'(x) = 6cos(3x+1)` ;
- `f(x) = exp(2x-1)` puis `f'(x) = 2exp(2x-1)` ;
- `f(x) = ln(2x+1)` puis `f'(x) = 2/(2x+1)` (uniquement pour `2x+1 > 0`).

Le contrôle compare exactement les coefficients et l'argument affine. Il n'évalue pas les démonstrations, ni les produits de fonctions trigonométriques, puissances de logarithmes, compositions non affines, ou primitives. Les corrections restent invisibles tant que la vérification n'est pas demandée. Aucun papier, calculateur payant ou export manuel n'est nécessaire pour utiliser ces modèles.
