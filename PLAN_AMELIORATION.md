# DAEU B — Plan d'amélioration priorisé (07/11/2026)

## Vision produit
Préparer **réellement et gratuitement** les maths du DAEU B à partir du syllabus universitaire SONATE Côte d'Azur 2026-2027, avec une progression mesurable, des solutions démontrées et une utilisation pratique sur Android/PC.

## Audit initial (07/11/2026)
- Dépôt \`dbrckk/Daeu-b\`, branche principale \`main\`, avec 18 documents de modules (00 à 17), 3 sujets blancs, exercices corrigés, formule et suivi manuel.
- La vérification GitHub précédente vérifiait uniquement la présence des fichiers et les liens Markdown locaux ; **elle ne validait ni les résultats mathématiques ni un entraînement interactif**.
- Les sujets 01/02 sont alignés sur quatre exercices, selon le syllabus Nice 2026-2027.
- Des modules restent volontairement transversaux (plusieurs jalons regroupés dans une leçon) ; **un chapitre synthétique de quelques pages ne suffit pas à maîtriser toutes ses variantes**.
- Le suivi était manuel, les corrigés visibles trop facilement, l'accès sur mobile limité à une arborescence de fichiers.

## Phase A — Fiabilité pédagogique et entraînement actif (priorité P0)
- [x] Retrouver le syllabus universitaire 2026-2027, repérer les 23 jalons dont 3 facultatifs et les modalités de l'examen.
- [x] Conserver les 17 cours et les trois examens existants.
- [x] Créer une application web mobile **sans inscription ni API**, appuyée sur un corpus de questions corrigées, avec réponses numériques et choix multiples, erreurs expliquées.
- [x] Ajouter un test de cohérence du corpus (IDs, jalons, réponses, liens de cours).
- [x] Ajouter des vérifications d'exécution du moteur pédagogique (notation, planification, données de progression).
- [x] Publier une interface statique gratuite si un service de déploiement disponible l'autorise ; indiquer son caractère temporaire le cas échéant.

**Critère de sortie A :** application qui fonctionne sans clés, qui note les réponses et dont les tests automatisés réussissent. Le nombre d'exercices doit être vérifié par le script, jamais affirmé à la main.

## Phase B — Mémorisation et personnalisation (priorité P1)
- [x] Proposer une pratique par domaine et une sélection des questions à revoir.
- [x] Enregistrer localement les résultats, sans transmettre de données personnelles.
- [x] Révision espacée J+1/J+3/J+7/J+14/J+30, remise à zéro de la série après erreur.
- [x] Exporter/importer sa progression en JSON pour sauvegarde manuelle Android.
- [ ] Générer plusieurs variantes paramétriques de chaque exercice pour éviter l'apprentissage par cœur de réponses fixes.
- [ ] Couvrir chaque jalon à plusieurs degrés de difficulté (calcul, preuve, problème appliqué).
- [ ] Ajouter des explications par étapes plus longues pour chaque sous-compétence fragile.

**Critère de sortie B :** une compétence est acquise uniquement après deux réussites **à des dates différentes** ; la notation sur QCM n'est qu'un indice, jamais une preuve suffisante.

## Phase C — Préparation d'examen (priorité P1 / P2)
- [ ] Ajouter de véritables **épreuves interactives chronométrées** en quatre exercices regroupant plusieurs questions avec notation sur 20.
- [ ] Mettre en place une grille de suivi des points perdus et recommandations ciblées par compétence.
- [ ] Confronter les exercices originaux à des annales **autorisées**, sans reproduction non autorisée.
- [ ] Réaliser un audit de correction méthodique par chapitre et des sujets blancs.
- [ ] Proposer un mode sans connexion vérifié sur Android réel (le service worker est déjà prévu, mais doit être validé en conditions réelles).
- [ ] Ajouter des visualisations interactives des fonctions et des statistiques, sans dépendances distantes.
- [ ] Accessibilité : audit clavier/lecteur d'écran, contraste et préférences de mouvement sur appareil réel.

## Indicateurs
- **Couverture** : 20 jalons non facultatifs représentés dans les cours et la banque ; jalons 21-23 facultatifs distincts.
- **Réussite** : viser ≥ 80 % à J+7 sur des questions **inédites** ; ≥ 16/20 deux blancs différents en temps limité (hors app pour le moment).
- **Technique** : 0 dépendance d'exécution externe, 0 jeton, aucun stockage serveur, GitHub Actions vert.
- **Qualité** : 0 réponse affichée avant soumission ; chiffres et corrigés vérifiés ; liens internes valides.

## Limites actuelles
Le suivi local disparaît si l'utilisateur efface les données du navigateur ou change de téléphone sans exporter sa progression. Les exercices dans l'app sont un **complément** : les démonstrations longues doivent être rédigées sur papier et corrigées avec le cours. Une CI verte prouve les contrôles automatisés, **pas** la maîtrise personnelle ni l'exactitude universelle de tous les contenus. L'université reste seule habilitée à délivrer le diplôme.