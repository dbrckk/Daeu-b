# DAEU B — Plan d'amélioration priorisé (07/11/2026)

## État actuel — livraison v6 stabilisée (7 novembre 2026)

**Application publique actuelle : https://encoded-nova-5agr5eq.shipstatic.com**

- [x] Contrôle de bout en bout réel dans Chromium avec dimensions mobiles : entraînement, examen C, copie, rédaction, bilan et restauration JSON.
- [x] Vérifier un rechargement complet sans réseau après installation du Service Worker.
- [x] Corriger l'initialisation du Service Worker sur `localhost` et `127.0.0.1` pour la validation.
- [x] Icône SVG pour l'écran d'accueil et manifeste PWA cohérent, indépendant du domaine de déploiement.
- [x] Corriger le focus clavier du bouton d'import JSON et proposer le stockage persistant quand le navigateur le permet.
- [x] Conserver un site statique léger sans API, base de données, service tiers à l'exécution ou abonnement.
- [x] Préparer le workflow GitHub Pages sur URL stable (déclenchement manuel uniquement pour ne pas accumuler d'échecs).
- [ ] **Activer GitHub Pages une première fois** via Settings → Pages → Source = GitHub Actions, puis lancer le workflow « Site stable GitHub Pages ».
- [ ] Vérifier la PWA sur au moins un téléphone Android physique et un navigateur secondaire.
- [ ] Vérifier plusieurs sujets et rédactions par une relecture pédagogique externe.
- [ ] Améliorer la profondeur des cours, et élargir les familles d'examen C au-delà de quatre structures.

Le rapport [RELEASE.md](RELEASE.md) précise exactement les tests exécutés et leurs limites.

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
- [x] Publier une interface statique gratuite : https://streamy-field-k44v8kv.shipstatic.com — déploiement confirmé, sans date d'expiration définie. Lien public à mettre à jour dans ce README à chaque publication tant qu'aucun domaine permanent n'est disponible.

**Critère de sortie A :** application qui fonctionne sans clés, qui note les réponses et dont les tests automatisés réussissent. Le nombre d'exercices doit être vérifié par le script, jamais affirmé à la main.

## Phase B — Mémorisation et personnalisation (priorité P1)
- [x] Proposer une pratique par domaine et une sélection des questions à revoir.
- [x] Enregistrer localement les résultats, sans transmettre de données personnelles.
- [x] Révision espacée J+1/J+3/J+7/J+14/J+30, remise à zéro de la série après erreur.
- [x] Exporter/importer sa progression en JSON pour sauvegarde manuelle Android.
- [x] Ajouter **32 générateurs paramétriques** avec des valeurs et corrigés renouvelés couvrant les 20 jalons obligatoires.
- [ ] Transformer progressivement les autres exercices fixes en variantes quand c'est pédagogiquement adapté ; approfondir les exercices non réductibles à un seul nombre.
- [ ] Couvrir chaque jalon à plusieurs degrés de difficulté (calcul, preuve, problème appliqué).
- [x] Rendre les corrections des nouveaux modèles dépendantes des paramètres et vérifiables par calcul.
- [ ] Ajouter des explications par étapes plus longues pour chaque sous-compétence fragile.

**Critère de sortie B :** une compétence est acquise uniquement après deux réussites **à des dates différentes** ; la notation sur QCM n'est qu'un indice, jamais une preuve suffisante.

## Phase C — Préparation d'examen (priorité P1 / P2)
- [x] Ajouter **2 examens blancs interactifs de 3 h**, chacun structuré en 4 exercices et noté /20 automatiquement pour les réponses objectives ; rédaction conservée mais non notée.
- [x] Ajouter un bilan par exercice (points perdus, correction, compétence et chapitres de remédiation).
- [x] Analyser les pertes de points par compétence sur les 12 dernières copies et proposer des cours ciblés, avec avertissement lorsque le même sujet est répété.
- [ ] Mesurer la progression sur plusieurs **sujets inédits**, sans apprentissage par cœur.
- [ ] Confronter les exercices originaux à des annales **autorisées**, sans reproduction non autorisée.
- [x] Ajouter une **auto-correction guidée des 8 problèmes d’examen** : 32 critères argumentés, comparés aux réponses rédigées après la remise, sans modifier la note /20.
- [x] Ajouter **8 problèmes inédits progressifs** (37 questions) avec solutions démontrées en fichiers séparés.
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

## Livraison contrôlée (07/11/2026)

- Site (v2, historique) : https://drifting-neon-d3tt6t6.shipstatic.com
- **95 questions**, **13 domaines**, **20 jalons principaux**.
- GitHub Actions : contrôle des liens, syntaxe JS, cohérence du corpus, réponses sur échantillons, échéances, sauvegardes.
- Exécution automatique validée : https://github.com/dbrckk/Daeu-b/actions/runs/42385148907
- Déploiement confirmé « success » côté hébergeur. **Test manuel Android réel non effectué** ; fonctionnement hors ligne prévu par service worker, mais encore à vérifier.

## Prochain bloc prioritaire
1. Convertir une partie des **95 questions fixes** en variantes conçues pour la compréhension ; étendre les difficultés des 32 modèles.
2. Créer des problèmes longs avec grille de correction et justification.
3. Enrichir les cours par niveaux, prérequis, méthode et difficulté d'examen.
4. Ajouter des épreuves interactives de 3 h / 4 exercices après audit mathématique.


## Livraison v2 — 7 novembre 2026
- Adresse de production actuelle : https://ghostly-void-w99dhwc.shipstatic.com
- 95 questions fixes + 32 modèles de variantes = **127 éléments suivis** dans l'application.
- 20 jalons principaux couverts par les modèles variables ; les 3 facultatifs restent dans les cours.
- Validation plus stricte : seules les réponses sans indice et à des dates différentes confirment la maîtrise. Une variante doit changer l'énoncé précédent.
- Contrôle CI : 2 560 instances comparées à des calculs de référence, tests de générateur, des échéances et de la sauvegarde.
- Ancien site : https://clear-glyph-3u8hr78.shipstatic.com (export JSON nécessaire pour reprendre le suivi sur la nouvelle adresse).
- Déploiement nouveau déclaré `success` ; test d'interface complet en situation Android encore non réalisé.


## Livraison v3 — 7 novembre 2026
- Adresse publiée : https://ghostly-void-w99dhwc.shipstatic.com
- Deux examens originaux de 20 points, quatre exercices de 5 points, 3 heures par sujet ; chaque exercice comporte 3 à 4 étapes liées.
- Conservation de la réponse et du raisonnement libre par exercice avec sauvegarde locale ; reprise après fermeture, échéance réelle et remise automatique.
- Bilans par exercice, note indicative et liens de remédiation ; résultats exportables/importables dans une sauvegarde unifiée.
- Tests automatisés des barèmes, du chronomètre, de l'import et de la correction ; vérification CI : https://github.com/dbrckk/Daeu-b/actions/runs/42389729798
- Déploiement confirmé « success » ; alias pérenne ShipStatic indisponible (limite du plan), utiliser ce README comme point d'entrée stable.
- À poursuivre : exercices de rédaction évaluables avec grille, audit mathématique indépendant, essais réels sur Android.


## Livraison v4 — correction raisonnée et diagnostic (07/11/2026)
- 8 grilles de raisonnement, avec 32 critères et exemples de rédaction, consultables **seulement après la remise**.
- Auto-évaluation conservée dans la copie, sans noter automatiquement le texte libre.
- Diagnostic des lacunes fondé sur les points perdus par compétence sur les 12 derniers examens ; priorisation de 5 cours et avertissement contre les répétitions d’un même sujet.
- Huit problèmes progressifs (37 sous-questions) et solutions séparées, accessibles par [problèmes](problemes/README.md).
- Tests des sauvegardes historiques et des notes inchangées, et couverture des compétences.
- Déploiement actuel : https://visceral-link-ng9xj73.shipstatic.com (confirmation « success » ; 15 fichiers servis, aucune expiration annoncée).
- Contrôles : https://github.com/dbrckk/Daeu-b/actions/runs/42393012325
- Prochain jalon : sujets nouveaux paramétriques de niveau examen et vérification visuelle de l’application sur Android.


## Livraison v5 — examen C généré (07/11/2026)

**Publication de la v5 (historique) :** https://streamy-field-k44v8kv.shipstatic.com

- [x] **Générer un nouveau sujet complet à chaque session C** : quatre problèmes cohérents de cinq points, 16 sous-questions, sujets originaux à valeurs paramétriques.
- [x] **Corrigés et grilles numériques variables** : coefficients, seuils, probabilités, primitives, moyennes et explications issus de la même graine déterministe.
- [x] **Reprise sûre** : graine stockée dans la copie, import/export JSON compatible avec les copies A/B, résultats recalculés à l'import depuis le contenu autorisé.
- [x] **Historique de sujets distincts** : le diagnostic n'assimile plus deux copies C de graines différentes à un même énoncé.
- [x] **Vérification mathématique indépendante** : 1 000 sujets contrôlés structurellement et 250 soumis à des formules de référence (dont optimisation, seuil logarithmique, probabilité binomiale, moyenne intégrale).
- [x] **CI GitHub verte** après corrections pédagogiques et techniques.
- [ ] **Élargir les familles de problèmes** au-delà des quatre modèles C : fonctions rationnelles, statistiques, continuité/TVI, conditionnelles, logarithmes avancés.
- [ ] **Construire une notation de rédaction avec supervision** (grilles de preuves, cohérence des hypothèses et alternatives valides), sans présenter une auto-déclaration comme une évaluation externe.
- [ ] **Effectuer un test réel de navigation sur Android** : cache PWA, clavier, formulaires, reprises et exports.
- [ ] Rechercher une **adresse stable gratuite** sans toucher aux autres applications existantes.
- [ ] Vérifier l'alignement des sujets par un audit mathématique externe et des annales publiées avec autorisation.

**Limite** : l'examen C crée des *variantes numériques* sur quatre familles ; il ne fournit pas encore des sujets structurellement nouveaux à l'infini. L'épreuve et l'évaluation officielle relèvent exclusivement de l'université.


## Déploiement stabilisé v6 — 07/11/2026
- Site public : https://dim-monolith-4m8zee2.shipstatic.com — hébergeur : statut `success`, **17 fichiers, 136 534 octets, expires:null**.
- GitHub Actions pour la validation de contenu : https://github.com/dbrckk/Daeu-b/actions/runs/42398972750
- GitHub Actions pour la validation fonctionnelle mobile et hors ligne : https://github.com/dbrckk/Daeu-b/actions/runs/42398972721
- Publication permanente GitHub Pages **préparée mais pas activée** : le dépôt n'a pas encore de site Pages. La configuration nécessite un choix initial dans Settings. Pour éviter de conserver une CI rouge, le workflow Pages a été placé en mode manuel. Aucune modification d'un domaine existant n'a été effectuée.
- La structure des données (sauvegarde `backupVersion:1`, `practice.version:2`, `exams.version:1`) reste compatible avec les exports antérieurs.
- Application statique sans dépendance npm en production ; Playwright est installé uniquement par les runners GitHub pour le test.


## Livraison v7 — robustesse et usage mobile (07/11/2026)

- [x] Cache des ressources installé de façon atomique, évitant les mélanges de scripts entre versions.
- [x] Cache hors ligne des modules nécessaires au simulateur C après première visite en ligne.
- [x] Parcours Chromium mobile étendu : corrections, raisonnement, nouvel examen C et conservation du sujet après recharge hors connexion.
- [x] Déploiement statique : https://noisy-prism-63q74n2.shipstatic.com ; hébergeur confirmé en statut success, 17 fichiers, sans expiration définie.
- [ ] Vérifier l'expérience sur un Android réel : clavier, téléchargements, cache et fermeture forcée.
- [ ] Mettre en place un domaine permanent pour éviter le transfert manuel du stockage à chaque nouvelle adresse.
- [ ] Renforcer la gestion des quotas de stockage et des conflits entre onglets.
- [ ] Étendre le générateur au-delà de quatre familles de problèmes et demander une validation mathématique indépendante.

La v7 est exploitable et contrôlée automatiquement ; elle ne peut pas encore être qualifiée de totalement finalisée sans vérification physique Android et adresse stable.


## Livraison v8 — transaction locale, concurrence et migration (07/11/2026)

- [x] **Remplacer deux clés persistantes distinctes par un état unique versionné** pour les révisions et les examens. Une écriture atomique par changement : import et reset ne peuvent plus être validés en deux temps.
- [x] **Migrer automatiquement les anciennes clés** lors du premier enregistrement réussi ; données antérieures préservées si l'opération est refusée (quota ou permission).
- [x] Détecter les modifications externes et avertir un onglet obsolète, sans remplacer silencieusement une copie récente.
- [x] Gérer les conflits au moment d'écrire les réponses et les auto-évaluations, avec message visible.
- [x] Vérifier la transaction avec simulations de quota saturé, sauvegardes anciennes/corrompues et deux accès concurrents.
- [x] Vérifier en Chromium mobile le flux complet export/import/révision/examen C, le hors ligne **et deux onglets concurrents**.
- [x] Publication : https://encoded-nova-5agr5eq.shipstatic.com, hébergeur success, 18 fichiers, 145 909 octets, expiration non annoncée.
- [x] CI contenu : https://github.com/dbrckk/Daeu-b/actions/runs/42403528001 et navigateur : https://github.com/dbrckk/Daeu-b/actions/runs/42403528047
- [ ] Obtenir une URL définitive par activation initiale de GitHub Pages (workflow déjà prêt) ou un autre espace Render explicitement choisi.
- [ ] Essai sur smartphone Android physique, en particulier avec reprise après fermeture forcée, navigateur privé et stockage presque plein.
- [ ] Renforcer le verrouillage inter-onglets pour les écritures exactement simultanées (localStorage n'offre pas de transaction compare-and-swap).
- [ ] Audit académique indépendant des corrections, puis diversification des familles de problèmes d'examen.

**Statut** : application publique stable vérifiée automatiquement, mais pas encore certifiée compatible avec tous les appareils physiques ni dotée d'une URL permanente.
