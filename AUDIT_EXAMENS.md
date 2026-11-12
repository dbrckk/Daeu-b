# Audit des cinq examens blancs — couverture et structure

Ce rapport est recalculé depuis les banques et les générateurs réels du dépôt. Il décrit des **compétences explicitement étiquetées**, et non toutes les méthodes implicitement mobilisées. Les résultats ne sont ni une évaluation psychométrique de difficulté, ni une preuve d'équivalence avec les épreuves officielles des universités.

## Structure mesurée

| Sujet | Format | Questions | Numériques / choix | Questions à 2 points | Rubrique de rédaction | Compétences distinctes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| A | Fixe | 16 | 13 / 3 | 4 | 16 étapes | 14 |
| B | Fixe | 15 | 12 / 3 | 5 | 16 étapes | 13 |
| C | Généré | 16 | 15 / 1 | 4 | 16 étapes | 12 |
| D | Généré | 16 | 14 / 2 | 4 | 16 étapes | 15 |
| E | Généré | 16 | 14 / 2 | 4 | 16 étapes | 11 |

**Interprétation :** les questions à deux points et le nombre de compétences sont des indicateurs de composition, non des niveaux de difficulté. Les copies conservent une note automatique indicative /20 ; les preuves rédigées restent non notées automatiquement.

## Familles d'exercices réellement présentes

### Examen A — valeurs fixes
- Étude d'un bénéfice (4 questions ; 5 points ; 4 étapes de rédaction)
- Prévisions de croissance (4 questions ; 5 points ; 4 étapes de rédaction)
- Tirages indépendants (4 questions ; 5 points ; 4 étapes de rédaction)
- Intégration et logarithmes (4 questions ; 5 points ; 4 étapes de rédaction)
Notions étiquetées : Second degré, Fonctions et domaines, Dérivation, Exponentielle et logarithme, Suites, Probabilités, Primitives et intégrales.

### Examen B — valeurs fixes
- Fonction rationnelle (4 questions ; 5 points ; 4 étapes de rédaction)
- Billetterie : deux tarifs (3 questions ; 5 points ; 4 étapes de rédaction)
- Résultats d'un groupe (4 questions ; 5 points ; 4 étapes de rédaction)
- Une équation avec exponentielle (4 questions ; 5 points ; 4 étapes de rédaction)
Notions étiquetées : Équations, inéquations et systèmes, Fonctions et domaines, Dérivation, Limites et asymptotes, Continuité et TVI, Exponentielle et logarithme, Statistiques, Rédaction et modélisation.

### Examen C — valeurs régénérées à chaque nouveau sujet
- Optimiser une activité (4 questions ; 5 points ; 4 étapes de rédaction)
- Prévoir un stock (4 questions ; 5 points ; 4 étapes de rédaction)
- Analyser des tirages indépendants (4 questions ; 5 points ; 4 étapes de rédaction)
- Calculer une accumulation (4 questions ; 5 points ; 4 étapes de rédaction)
Notions étiquetées : Second degré, Dérivation, Exponentielle et logarithme, Suites, Probabilités, Primitives et intégrales.

### Examen D — valeurs régénérées à chaque nouveau sujet
- Étudier une fonction rationnelle (4 questions ; 5 points ; 4 étapes de rédaction)
- Interpréter un test (4 questions ; 5 points ; 4 étapes de rédaction)
- Étudier une série de mesures (4 questions ; 5 points ; 4 étapes de rédaction)
- Résoudre une équation exponentielle (4 questions ; 5 points ; 4 étapes de rédaction)
Notions étiquetées : Fonctions et domaines, Dérivation, Limites et asymptotes, Continuité et TVI, Exponentielle et logarithme, Statistiques, Probabilités.

### Examen E — valeurs régénérées à chaque nouveau sujet
- Déterminer deux tarifs (4 questions ; 5 points ; 4 étapes de rédaction)
- Triangle rectangle et mesures (4 questions ; 5 points ; 4 étapes de rédaction)
- Probabilités sans remise (4 questions ; 5 points ; 4 étapes de rédaction)
- Domaine et zéro d'une fonction irrationnelle (4 questions ; 5 points ; 4 étapes de rédaction)
Notions étiquetées : Équations, inéquations et systèmes, Fonctions et domaines, Probabilités, Trigonométrie (complément), Rédaction et modélisation.

## Couverture des 13 chapitres de référence

| Cours | Examens qui le ciblent |
| --- | --- |
| 01 · Calcul numérique | Aucun ciblage explicite |
| 02 · Calcul littéral | Aucun ciblage explicite |
| 03 · Équations, inéquations et systèmes | B, E |
| 04 · Second degré | A, C |
| 05 · Fonctions et domaines | A, B, D, E |
| 06 · Dérivation | A, B, C, D |
| 07 · Limites et asymptotes | B, D |
| 08 · Continuité et TVI | B, D |
| 09 · Exponentielle et logarithme | A, B, C, D |
| 10 · Suites | A, C |
| 11 · Statistiques | B, D |
| 12 · Probabilités | A, C, D, E |
| 15 · Primitives et intégrales | A, C |

**Couverture explicite : 11/13 cours de référence.**
Cours non ciblés explicitement : 01 · Calcul numérique ; 02 · Calcul littéral. Ces techniques peuvent être nécessaires à d'autres questions, sans identification comme objectif principal.

Les chapitres complémentaires (trigonométrie, vecteurs et complexes) et la rédaction possèdent une place variable dans le cursus selon l'université ; cette matrice ne certifie pas leur caractère obligatoire.

## Validation reproductible

- Source : banques A/B et générateurs C/D/E, même moteur que les copies du navigateur.
- Graines contrôlées : 0, 1, 7, 29, 257, 65535, 4294967295.
- Intégrité : quatre exercices de cinq points, 16 étapes de raisonnement, compétences reliées à un cours et gabarits constants pour les sujets générés.
- Aucune estimation empirique de difficulté : il faudrait des résultats d'élèves sur des sujets indépendants et une calibration externe.
- Reproduction : `node scripts/audit-exams.mjs --check` (ou `--write` pour régénérer les rapports).
