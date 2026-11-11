# Feuille de route v23–v28 — DAEU B mathématiques

**Établie le 11 novembre 2026.** Source de vérité pour les prochaines itérations, en complément de l'[historique des améliorations](PLAN_AMELIORATION.md), du [programme](PROGRAMME.md) et du [parcours apprenant](PARCOURS.md).

## 1. Finalité du produit

Construire une plateforme **gratuite, réellement exploitable sur Android et PC, sans compte, sans API payante et utilisable hors connexion**, qui aide à atteindre une maîtrise démontrée des mathématiques du DAEU B. Ne pas confondre réussite à un QCM, preuve de compréhension et réussite à une épreuve universitaire.

**Centre de référence actuel :** syllabus SONATE / Université Côte d'Azur 2026–2027, documenté dans `PROGRAMME.md`. Les **20 premiers jalons sont obligatoires** dans ce référentiel, dont le **jalon 18 (calcul intégral, cours 15)** ; les jalons 21–23 sont facultatifs à Nice. Les exigences des autres établissements restent configurables et ne doivent pas être présentées comme universelles.

### Base réelle auditée (v22)

| Élément | État vérifié | Limite actuelle |
|---|---|---|
| Cours | 18 chapitres Markdown embarqués, MathML, sommaires, recherche et signets | Couverture textuelle ≠ maîtrise de toutes les difficultés |
| Pratique | 111 questions fixes + 32 modèles paramétriques, soit 143 entrées dans 13 domaines | Types principaux : nombre ou choix multiple ; raisonnement libre non noté automatiquement |
| Programme | 20 jalons obligatoires représentés dans la banque, 3 facultatifs séparés | Distribution et profondeur par jalon à quantifier |
| Examens | 4 blancs A/B/C/D, 4 exercices, 3 h, score objectif /20, notes et grilles d'auto-évaluation | Variété limitée de structures ; note /20 non officielle |
| Rédaction | 8 problèmes progressifs, 37 sous-questions, corrigés séparés | Pas d'évaluation humaine automatique de la démonstration |
| Résilience | PWA hors connexion, reprise des séances/copies, sauvegarde JSON, 59 tests Node réussis, parcours Chromium mobile réussi | Android physique, TalkBack et relecture universitaire indépendante non validés |
| Déploiement | Branche `main`, adresse Render stable | Validation nécessaire à chaque livraison, même documentaire si contenu pédagogique modifié |

**Preuves techniques initiales :** [59 tests réussis](https://github.com/dbrckk/Daeu-b/actions/runs/43058595653) et [parcours Chromium mobile et hors ligne](https://github.com/dbrckk/Daeu-b/actions/runs/43058595540).

## 2. Ordre de progression technique — une étape terminée avant la suivante

| Phase / priorité | Travail livrable | Critères de sortie vérifiables |
|---|---|---|
| **v23 — P0 : audit de couverture** | Produire une matrice des 20 jalons (cours, questions fixes et variables, compétences, types de réponse, niveau, corrigé), distinguer les trois facultatifs ; détecter doublons, trous et biais | Rapport généré depuis les données réelles et contrôlé en CI ; chaque jalon a ses sources et son état ; aucun faux taux de maîtrise |
| **v24 — P0 : corriger les lacunes réelles** | Revoir en priorité calcul algébrique, fonctions, analyse, probabilités et intégrales selon la matrice ; vérifier indépendamment domaines, signes, arrondis, hypothèses, solutions et démonstrations | Toute correction accompagnée d'un test reproduisant l'erreur ; aucune incohérence bloquante connue ; sources/copies hors ligne identiques |
| **v25 — P1 : progression guidée** | Diagnostic initial dans l'application, prérequis et recommandations explicables, séquence « cours → méthode → exercices → transfert → rappel », état par jalon obligatoire | Aucune notion déclarée « acquise » à la seule lecture ; indicateurs fondés sur réponses et rappels réellement effectués ; conservation/migration des sauvegardes démontrée |
| **v26 — P1 : exercices de raisonnement** | Pour chaque jalon obligatoire, viser un diagnostic, des applications distinctes, un transfert inédit et une justification guidée ; expliquer les erreurs typiques | Couverture de **20/20** jalons pour les niveaux diagnostic/application/transfert ; corrections testées ; les justifications libres sont **auto-évaluées avec grille**, jamais prétendument corrigées par IA |
| **v27 — P1 : examens plus représentatifs** | Élargir les familles de sujets à condition qu'elles apportent des compétences réellement nouvelles ; renforcer l'analyse des erreurs et le transfert vers les cours ciblés | Quatre exercices indépendants, 3 h et score /20 conservés pour SONATE ; sujets reproductibles, variants validés et sans divulgation précoce de correction ; deux sujets réellement distincts |
| **v28 — P0/P2 : finition et accessibilité** | Audit clavier et lecteur d'écran, focus/contrastes/MathML, perf et usage hors connexion ; tests Firefox/WebKit si possible ; essais sur Android physique | CI verte (Node, Python, Chromium et hors connexion), aucun bug P0/P1 connu ; sauvegarde/import/export vérifiés ; résultats des essais matériels et de la revue pédagogique consignés honnêtement |

### v23 — premier livrable : audit reproductible

La matrice détaillée des 23 jalons (20 obligatoires et 3 facultatifs) est publiée dans [l'audit de couverture](AUDIT_COUVERTURE.md) avec [les données machine-readable](audits/coverage.json). Les 111 questions fixes ont reçu une affectation principale explicite, les 32 générateurs sont lus depuis leur métadonnée existante, et les attributions doubles ou manquantes bloquent la CI. **Cette classification ne vaut pas vérification académique des compétences ni mesure de maîtrise ; les niveaux de difficulté restent à établir.**

### Détail de la première itération à exécuter : v23

1. **Construire `scripts/audit_coverage.py` ou équivalent**, en inspectant `app/questions.mjs`, `app/variants.mjs`, `PROGRAMME.md` et les cours ; préférer un export machine-readable issu du code à un parsage fragile de JavaScript.
2. Produire une matrice avec une ligne par jalon **1 à 20**, ses références vers les cours, nombres vérifiés de questions fixes/variables, lacunes, tests manquants et recommandation de priorité ; maintenir les jalons 21–23 dans une section « facultatif selon établissement ».
3. Vérifier l'alignement des supports : programme, parcours, suivi, application ; toute contradiction (notamment intégrales facultatives à tort) est bloquante.
4. Corriger d'abord les erreurs réelles révélées ; ajouter des tests d'invariants ; ensuite seulement enrichir les exercices.
5. Livrer une version utilisable avec les vérifications vertes et une documentation distinguant **présent / mesuré / restant à vérifier**.

**Principe de livraison :** aucun nouveau tableau de bord de maîtrise avant de disposer de mesures fiables par jalon et d'une politique claire de restauration des données.

## 3. Méthode de progression de l'apprenant

Le [parcours de 12 semaines](PARCOURS.md) reste **indicatif** et doit être ajusté au niveau initial, au rythme soutenable et à l'université visée. Pour les 20 jalons SONATE obligatoires :

1. **Diagnostic :** question inédite sans indice ; noter si l'erreur provient d'une notion, d'une méthode, d'un calcul ou d'une lecture d'énoncé.
2. **Compréhension :** démontrer la méthode avec hypothèses et domaines, puis refaire un exemple à l'écrit sans regarder.
3. **Application :** obtenir **au moins 80 %** sur des questions variées sans indice, et savoir expliquer les étapes.
4. **Transfert :** résoudre une situation différente sans correction visible ; vérifier unités, signes, hypothèses et conclusion.
5. **Consolidation :** révisions espacées J+1/J+3/J+7/J+14/J+30 selon le moteur actuel ; nouveau contrôle **au moins 7 jours plus tard**, avec `≥ 80 %` sans indice.
6. **Examen :** viser **deux sujets blancs distincts à ≥ 16/20**, espacés d'au moins une semaine, et contrôler séparément la qualité de la rédaction selon une grille. Ces chiffres sont des **objectifs internes de préparation**, pas une garantie d'admission ni une note universitaire.

Une séance courte de **20–45 min** peut être fractionnée (rappel, lecture active, résolution, correction), sans calendrier de réussite garanti. Les compléments 21–23 sont étudiés uniquement lorsque le centre choisi les exige, ou pour approfondissement volontaire.

## 4. Indicateurs et garde-fous

**Indicateurs de couverture produit :**
- **20/20 jalons obligatoires** disposant de références vérifiées vers leurs cours, questions, transferts et corrigés ; montrer séparément les manques de niveaux de difficulté.
- **3 niveaux utiles** par jalon : diagnostic, application, transfert ; compter des exercices **distincts**, pas plusieurs graines d'un même modèle comme des notions différentes.
- **0 erreur mathématique bloquante connue** et **0 régression de sauvegarde** à chaque livraison ; CI verte pour le code réellement déployé.
- **0 dépendance payante**, aucun envoi des notes à un serveur, disponibilité hors connexion confirmée pour les ressources annoncées.

**Indicateurs d'apprentissage (ne pas inventer) :**
- Part des jalons testés sans indice, acquis à J+7, et revus à J+30 ; distingue *non tenté*, *tenté*, *réussi une fois*, *confirmé*.
- Score des deux derniers **sujets distincts**, avec date et intervalle de confiance pédagogique limité (pas de prédiction de réussite officielle).
- Erreurs de raisonnement identifiées par grille personnelle, jamais par une prétendue correction automatique de démonstration.

**Garde-fous techniques :**
- Priorité **fiabilité > fonctionnement > sécurité > architecture > performances > interface**.
- Pas de changement du schéma `daeu-b-data-v1` sans tests de migration réels et essais d'import/export d'anciennes sauvegardes.
- Tester hors connexion, rechargement, stockage indisponible, conflits d'onglets, écran de 320 px, liens et rendu des formules.
- Ne pas interrompre l'usage sur Render pour une refonte ; commits atomiques, CI vérifiée, état `live` confirmé.
- Toute validation nécessitant un **vrai téléphone ou un correcteur universitaire** reste marquée *non réalisée* tant qu'aucune preuve n'existe.

## 5. Non-objectifs des prochaines itérations

- Aucune inscription, synchronisation cloud, télémétrie ou paiement nécessaire pour maîtriser les mathématiques.
- Pas d'agent IA payant ou de note automatique simulée sur la rédaction libre.
- Pas d'ajout précipité d'autres matières avant de stabiliser le système de progression en mathématiques ; l'architecture doit néanmoins permettre leur ajout ultérieur.
- Pas d'affichage « préparation officiellement certifiée » ni de réussite garantie.

## 6. Définition de « finalisé »

La première version considérée **complète pour l'objectif pédagogique** devra avoir : matrice de couverture contrôlée, 20/20 jalons avec pratique à trois niveaux, parcours personnalisé fondé sur de vraies réponses, rédaction auto-évaluable de manière honnête, examens variés reproductibles, sauvegardes robustes, usage mobile hors connexion validé et aucune anomalie critique connue. La conformité des contenus au syllabus de **l'établissement réellement retenu** et la validation sur appareil physique doivent être vérifiées séparément.

**Prochaine action : v23 / matrice de couverture et contrôle des incohérences**, sans modifier le moteur de notation avant l'audit.


## Point de livraison v24 — renfort ciblé de la banque (11 novembre 2026)

- Cinq questions fixes ajoutées : fractions à dénominateurs distincts (jalon 2), valeur absolue et simplification de radicaux (jalon 3), équations fractionnaires avec domaine (jalon 5).
- Neuf nouvelles familles paramétriques indépendantes : fractions et distances (2, 3), équations et systèmes (5, 6), inéquation à coefficient négatif (8), limite par factorisation et asymptote horizontale (11, 13), logarithmes et exponentielles (16, 17).
- Les lacunes **purement quantitatives** du rapport v23 sont levées (aucun jalon obligatoire avec deux questions fixes ou moins, ni avec un seul modèle variable). La profondeur pédagogique et les transferts restent à mesurer, sans prétendre que le taux de maîtrise est établi.
- Compatibilité : identifiants historiques préservés ; même modèle de sauvegarde ; cache PWA incrémenté pour éviter un mélange ancien/nouveau.
- **Prochaine priorité v24** : vérifier systématiquement les corrections, domaines et hypothèses, puis enrichir les problèmes rédigés avant de lancer le diagnostic v25.


## Livraison v25 — repérage et progression par jalon (11 novembre 2026)

- **Déployé dans `main` :** `app/jalons.mjs` et `app/jalon-progress.mjs` donnent une attribution commune aux outils d'audit et au navigateur, sans changement des identifiants de questions.
- **Disponible :** repérage en blocs de dix jalons non abordés, statistiques descriptives par jalon et recommandations déterministes (rappels > erreurs non confirmées > nouveautés > consolidation).
- **Validation :** tests Node, contrôles de contenu et scénario Chromium mobile/hors ligne, avec reprise de la séance initiale ; aucune prétention de validation universitaire ou sur téléphone physique.
- **Reste à accomplir pour la v25 complète :** expliciter les liens de prérequis, analyser la réussite sur des situations de transfert et éviter toute interprétation abusive d'un compteur d'exercices confirmés comme une maîtrise du jalon.


## v25.2 — prérequis et transfert opérationnels (11 novembre 2026)

- **20/20 jalons** dotés d'une liste explicite de prérequis, graphe validé sans cycle ni référence invalide ; suggestions non bloquantes fondées sur les réponses sauvegardées.
- **20/20 jalons** dotés d'un premier problème original de transfert à trois étapes, d'un corrigé séparé et d'une grille de quatre critères de raisonnement, consultables hors ligne.
- Sources et copies PWA contrôlées en CI, lecteur mutualisé, navigation directe par jalon, compatibilité de progression préservée.
- **Limite assumée :** une seule activité de transfert par jalon ne suffit pas à valider toute la notion ; l'auto-évaluation de la rédaction n'est ni une notation automatique ni une certification de réussite. Étape suivante : diversifier les situations et intégrer un suivi volontaire de relecture à J+7 sans surinterpréter la maîtrise.


## v25.3 — suivi réellement enregistré des transferts (11 novembre 2026)

- Création d'un carnet d'auto-évaluation par jalon : quatre critères déclarés après rédaction et consultation du corrigé, sans correction automatique ni certification.
- Échéances J+7 et J+30 calculées et contrôlées par un module pur ; au moins 24 h entre rappels, pas de double validation anticipée.
- Suivi inclus dans le même stockage transactionnel que les examens et exercices ; le même fichier JSON inclut désormais les transferts. Anciennes sauvegardes compatibles, remise à zéro intégrale et conflits multi-onglets protégés.
- Suite ciblée : une deuxième situation originale par jalon pour les rappels, puis validation éditoriale des démarches et de la diversité des énoncés.


## v25.4 — diversification réelle des transferts

- Deux séries **A et B** pour chacun des vingt jalons : 40 problèmes de transfert et 120 sous-questions corrigées. Contrôle éditorial structurel et copies hors connexion vérifiés pour les quatre sources Markdown.
- Commutation A/B dans le lecteur, conservation du jalon lors de l'ouverture du corrigé, cache PWA versionné ; la série B est suggérée au rappel J+7.
- Amélioration ultérieure : troisième situation pour J+30 et relecture humaine des corrections délicates, sans attribuer un niveau de maîtrise à partir de déclarations personnelles.


## Livraison v25.5 — trois situations A/B/C par jalon (11 novembre 2026)

- **60/60 problèmes de transfert** dans les vingt jalons obligatoires, soit 180 sous-questions rédigées et leurs corrections, avec sujet/corrigé séparés et six copies PWA.
- Première situation A, deuxième B privilégiée à J+7, troisième C privilégiée à J+30. Trois liens explicites, même historique de déclarations sans modifier la clé `daeu-b-data-v1`.
- Validation structurelle, contrôle des prérequis, calculs indépendants des vingt nouvelles situations, intégration navigateur Android et tests hors connexion.
- **Travail restant :** relecture mathématique humaine exhaustive des 180 sous-questions, enrichissement des critères rédactionnels et indicateurs de difficultés qui n'attribuent pas une maîtrise sur une simple auto-déclaration.


## v25.6 — priorité aux rappels rédigés et qualité des résultats numériques

- Tableau de bord enrichi des rappels réellement échus, triés par ancienneté, avec accès direct aux séries conseillées et diagnostic **uniquement auto-déclaré** des critères non satisfaits.
- Quarante nouveaux contrôles arithmétiques A/B indépendants du texte source, venant compléter vingt oracles C ; chaque série couvre désormais les 20 jalons.
- Tous les contrôles sont intégrés au workflow GitHub ; sa mise en file d'attente ne constitue pas un succès. Prochaine étape : validation réelle du navigateur et relecture pédagogique systématique des 60 corrigés.


## v25.7 — enrichissement des preuves et erreurs fréquentes

- Les **60 corrigés A/B/C** sont augmentés de 60 justifications méthodologiques et 60 pièges spécifiques aux situations.
- Le contrôle de couverture rédactionnelle protège désormais les six fichiers Markdown et leurs copies PWA ; Chromium contrôle le rendu sans connexion.
- Audit arithmétique en place : 40 oracles A/B + 20 C. Une égalité vérifiée ne constitue pas une preuve formelle de chaque raisonnement ; restent la relecture académique externe et l'évaluation des rédactions réelles de l'apprenant.


## v26 — contrôle de copie sans surévaluer les compétences

- Examens A/B/C/D : affiche les questions sans réponse, leurs points de barème et la présence des quatre rédactions, sans score anticipé ; navigation rapide et confirmation de remise précise.
- Protection des données inchangée ; mêmes sujets déterministes, durée trois heures, notes indicatives /20 et cache PWA actualisé.
- Suite prioritaire : diversifier les familles de sujets générés, puis relecture indépendante des corrigés et des compétences sous-représentées dans les examens.
