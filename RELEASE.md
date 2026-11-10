# Rapport de stabilisation — DAEU B mathématiques

**État : candidat public stable v14, domaine permanent Render (10/11/2026)**  
**Version hébergée :** https://daeu-b-maths-dbrckk.onrender.com  
**Dépôt :** https://github.com/dbrckk/Daeu-b  
**Branche :** `main`

## Capacités réellement présentes
- Programme DAEU B SONATE 2026-2027, 20 jalons principaux + 3 facultatifs traités dans les cours.
- 111 questions fixes et 32 générateurs paramétriques, répartis en 13 domaines, avec corrigés, révisions espacées et suivi local.
- Examens **A/B fixes** et **C/D à valeurs variables**, chacun composé de 4 exercices, 3 heures et 20 points de notation objective. Le nouveau D couvre quatre autres familles.
- Grilles de raisonnement à valider par soi-même et diagnostic de points perdus, sans prétendre noter automatiquement la rédaction.
- Huit problèmes progressifs indépendants et 37 sous-questions avec fichiers de corrigés séparés.
- Export/import JSON contenant entraînements, examens, copies, réflexions et auto-évaluations ; **import atomique et migration depuis les anciennes clés**.
- Service Worker et cache PWA pour les fichiers de l'application ; nouveau manifeste et icône vectorielle.
- Bouton de persistance facultative du stockage local et repli explicite en cas de refus.

## Tests automatisés — résultats confirmés
| Contrôle | Résultat et preuve |
|---|---|
| Liens Markdown, fichiers, sujets et cache | [Succès GitHub Actions](https://github.com/dbrckk/Daeu-b/actions/runs/42791013222) |
| Vérifications de cohérence mathématique et notation | Même exécution : échantillons et 2 560 variantes recalculées |
| 1 000 sujets C et 250 calculs de référence | Scripts `app/exam-generator.test.mjs` exécutés en CI |
| Parcours mobile dans Chromium | [Succès du test fonctionnel](https://github.com/dbrckk/Daeu-b/actions/runs/42791013207) |
| Export → suppression → import JSON | Succès dans le test fonctionnel Chromium |
| Sauvegarde d'une copie en cours, reprise et auto-évaluation | Succès dans le test fonctionnel Chromium |
| Rechargement intégral sans Internet | Succès dans le test fonctionnel Chromium |
| Absence de débordement horizontal à 390 px | Succès dans le test fonctionnel Chromium |
| Réponse HTTP et fichier publié | Render : site statique public avec adresse permanente et surveillance quotidienne |
| Test physique Android | **Non réalisé** |
| Relecture universitaire complète | **Non réalisée** |

La CI utilise Playwright en dépendance de test **uniquement sur GitHub Actions**. L'ancien déploiement ShipStatic v8 comportait 18 fichiers totalisant 145 909 octets ; cette mesure historique n'est **pas** la taille garantie du site Render v12. Il n'y a pas de dépendance npm au chargement.

## Mode d'emploi Android
1. Ouvrir https://daeu-b-maths-dbrckk.onrender.com dans Chrome.
2. Choisir un chapitre, puis « Démarrer · 10 questions » ; consulter le corrigé après chaque réponse.
3. Dans « Examens blancs », alterner les **sujets C et D** : ils proposent huit familles de problèmes différentes et de nouvelles valeurs à chaque tentative.
4. En cas de besoin, utiliser le menu du navigateur « Ajouter à l'écran d'accueil » ou « Installer l'application » selon les possibilités du navigateur.
5. Visiter une première fois le site avec Internet pour le mettre en cache. Les cours publiés sur GitHub restent externes.
6. Utiliser « Exporter mes résultats » régulièrement. Le stockage persistant, lorsqu'il est accepté par le navigateur, n'élimine pas la nécessité d'une sauvegarde.

## Adresse permanente Render : active

- L'application est déployée dans l'espace Render « My Workspace » du compte `studycall12` : https://daeu-b-maths-dbrckk.onrender.com.
- Service statique `daeu-b-maths-dbrckk`, dépôt `dbrckk/Daeu-b`, branche `main`, dossier publié `app/`.
- Déploiement automatique sur les commits `main`, avec tests de cohérence et de notation Node.js en commande de build. Les nouveaux déploiements gardent la même URL.
- L'offre statique de Render est gratuite dans la limite des quotas d'utilisation du compte (bande passante et minutes de build incluses).
- Une action GitHub réalise un contrôle de disponibilité chaque jour, et lors des changements du script de santé : [healthcheck](.github/workflows/live-health.yml).
- Important : les données restent dans le navigateur. Migrer une seule fois les anciennes sauvegardes JSON vers le domaine Render ; elles y restent liées pendant les déploiements suivants.

## Alternative GitHub Pages (préparée, facultative)
Le workflow `.github/workflows/pages.yml` reste disponible comme alternative, mais **n'est pas activé**, car GitHub Pages n'était pas encore activé (l'action `configure-pages` a retourné Not Found).

Depuis le dépôt :
1. **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. **Actions → Site stable GitHub Pages → Run workflow** (branche `main`).
3. Attendre que le workflow soit vert, puis ouvrir l'URL donnée par le déploiement. Elle devrait être du type `https://dbrckk.github.io/Daeu-b/`, **à confirmer uniquement après déploiement réussi**.

Ce réglage ne touche pas au site de montres existant ni aux autres domaines.

## Limites à ne pas masquer
- Pas de correction automatique véritable de la démonstration libre ; seule la réponse objective est notée et les étapes sont auto-évaluées.
- Les examens C et D proposent **huit structures de problème différentes**, avec données variables ; cela ne couvre pas toute la diversité des sujets universitaires.
- L'application fonctionne hors ligne pour les écrans et exercices en cache, mais les cours GitHub ne sont pas mis en cache.
- L'usage sur un véritable téléphone Android et les autres navigateurs restent à valider.
- Il faut **exporter/importer** pour migrer d'un domaine de déploiement à l'autre ; aucune synchronisation cloud n'existe.
- Cette formation ne délivre pas le DAEU B et n'est pas une plateforme officielle universitaire.

## Politique de mise à jour
- Modifier le bon dépôt et exécuter les deux workflows de vérification après toute modification de l'application.
- Ne pas déployer une version dont les tests Chromium ou les contrôles pédagogiques échouent.
- Vérifier le statut Render sur le domaine stable et contrôler les résultats des deux workflows de CI. La publication ne doit plus changer le nom de domaine.
- Préserver la compatibilité des sauvegardes avant tout changement de schéma ; les exports des versions précédentes doivent rester importables.


## Correctif v8 — sauvegardes intégrales et test multi-onglets

La sauvegarde de la progression et des examens utilise maintenant une **seule clé localStorage** pour limiter les situations où un import n'écrirait qu'une partie du travail. Les versions anciennes sont migrées de manière contrôlée. En cas de conflit avec un autre onglet, un bandeau rend la page obsolète non modifiable et invite à la recharger.

**Validation supplémentaire :** tests de quota saturé, imports corrompus et migrations historiques ; scénario Playwright vérifiant que l'onglet ancien devient non modifiable puis se synchronise.

**Déploiement actuel :** https://daeu-b-maths-dbrckk.onrender.com — publication statique confirmée. GitHub Pages demeure prêt pour une activation initiale manuelle, sans effet sur les autres sites du compte.


## v9 — sécurité navigateur, SEO et disponibilité

- CSP restrictive définie dans le HTML : scripts, styles, ressources et workers limités au même domaine, objets embarqués interdits.
- Adresse canonique et métadonnées de partage Open Graph, ainsi que fichiers `robots.txt` et `sitemap.xml` pour le domaine Render.
- Manifeste PWA exposé sur `/manifest.json` pour que Render fournisse le bon type MIME JSON ; l'ancienne extension `.webmanifest` était servie comme fichier générique.
- Tests de navigation sur Chromium mobile, cache hors ligne et contrôles pédagogiques exécutés sur GitHub Actions avant publication.
- Contrôle quotidien de l'URL publique et de ses ressources essentielles ; faux échecs évités grâce à une courte attente lors des commits (le déploiement Render dure parfois plus longtemps que le déclenchement GitHub Actions).
- Des essais sur Android physique et une relecture universitaire du contenu demeurent nécessaires.


## v10 — correction de régression et validation responsive

- Le parcours Chromium de la v9 a révélé un **faux échec dû au test** : le scénario de stockage saturé partageait l'origine de la page principale et y créait un examen actif. Un contexte navigateur indépendant isole maintenant cette simulation ; le parcours hors ligne est à nouveau entièrement validé.
- L'application distingue « Retour aux examens » d'**« Reprendre ma copie en cours »** lorsqu'un ancien corrigé est consulté pendant une épreuve encore active. Cette copie reprend avec le même énoncé.
- Un test couvre explicitement le changement entre **l'examen actif, l'historique et le retour à la copie**, y compris hors ligne et après rechargement.
- Le contrôle responsive couvre désormais les largeurs **320, 360, 390, 768 et 1024 px**, sans débordement horizontal détecté par Chromium.
- Tests de référence : [contrôle pédagogique vert](https://github.com/dbrckk/Daeu-b/actions/runs/42416220427) ; [parcours mobile, quotas et hors ligne vert](https://github.com/dbrckk/Daeu-b/actions/runs/42416336635).
- Le déploiement reste sur https://daeu-b-maths-dbrckk.onrender.com ; la compatibilité Android physique et l'exactitude académique exhaustive demeurent à valider séparément.


## v11 — nouvelles familles mathématiques (10/11/2026)

- Ajout d'un **examen D** entièrement distinct de C : étude de fonctions rationnelles, probabilités conditionnelles et formule de Bayes, variance de population, exponentielle et théorème des valeurs intermédiaires.
- **Graine indépendante et déterministe** : une copie D reprise ou importée retrouve les mêmes coefficients, énoncés, réponses et critères de rédaction ; le générateur C historique est inchangé.
- **16 questions / 20 points / 3 h** et quatre grilles de raisonnement (16 étapes) par tentative D. Score objectif uniquement ; l'auto-évaluation ne modifie pas les points.
- **1 000 sujets D** vérifiés structurellement et **300 séries de calculs** revérifiées par des formules indépendantes. Historique et diagnostic des lacunes gèrent désormais C et D séparément.
- Tests : [45 vérifications pédagogiques et techniques, toutes réussies](https://github.com/dbrckk/Daeu-b/actions/runs/42791013222), [parcours Chromium mobile incluant D, réussi](https://github.com/dbrckk/Daeu-b/actions/runs/42791013207).
- Les examens A, B et C et les sauvegardes existantes ne sont ni remplacés ni réinitialisés.


## v12 — consolider les acquis hors des examens blancs (10/11/2026)
- 16 questions fixes inédites réparties entre limites, TVI, statistiques et probabilités, avec indices et justifications détaillées.
- 111 questions fixes + 32 modèles variables = **143 items**, sur les mêmes 13 domaines.
- La progression antérieure reste inchangée : tous les anciens ID sont conservés, les nouvelles questions partent non acquises.
- Tests de corrections numériques/fractions/choix multiples et parcours Android/hors ligne actualisé au total de 143 items.
- [Application](https://daeu-b-maths-dbrckk.onrender.com).


### Approfondissements des cours v12
- Quatre chapitres obligatoires (07, 08, 11 et 12) comportent désormais des ateliers rédigés en plusieurs étapes : étude d'une rationnelle et rationalisation, démonstration TVI/dichotomie, variance et quartiles de population, probabilités conditionnelles/Bayes et indépendance.
- **Huit problèmes de transfert** (deux par chapitre), accompagnés de corrections détaillées et de distinctions entre erreurs classiques.
- Un contrôle Python dédié recalcule les résultats numériques fondamentaux et vérifie la présence des exercices, corrections et délimiteurs mathématiques dans les quatre chapitres.
- Le domaine reste https://daeu-b-maths-dbrckk.onrender.com ; les liens vers les cours GitHub nécessitent Internet.


## v13 — consolidation des fondations et de l'analyse (10/11/2026)

- Six cours supplémentaires approfondis : 01 calcul numérique, 03 équations/systèmes, 04 second degré, 06 dérivation, 10 suites et 15 intégration.
- Chaque nouveau module comprend un atelier de méthode entièrement résolu et deux problèmes de transfert corrigés, sans remplacer les exercices antérieurs. Total cumulé : **dix ateliers et vingt problèmes de transfert** dans les chapitres consolidés.
- Le contrôle GitHub Actions `scripts/verify_worked_cases.py` vérifie désormais les dix chapitres et recalcule les résultats principaux à l'aide de fractions exactes et d'identités indépendantes du texte.
- La banque interactive reste à **143 éléments** ; aucune modification de ses IDs ni du stockage des copies. Les cours Markdown sont servis depuis GitHub, hors du cache PWA.
- L'exactitude complète des démonstrations et les tests sur Android physique nécessitent encore une validation externe.


## v14 — consolidation de tous les modules du tronc commun (10/11/2026)

- Quatre cours de plus : 02 calcul littéral, 05 fonctions/domaines, 09 logarithmes/exponentielles, 17 raisonnement/rédaction, avec deux problèmes de transfert corrigés chacun.
- Tronc commun approfondi sur **14 chapitres** : 01 à 12, puis 15 et 17, soit **14 ateliers et 28 problèmes de transfert** au total. Le module 00 de positionnement et les compléments 13, 14 et 16 sont conservés dans leur version antérieure.
- Correction pédagogique : le chapitre 17 conseille désormais la lecture des **quatre exercices** de l'épreuve SONATE 2026-2027 (et non trois).
- La vérification des méthodes et exemples porte désormais sur les 14 chapitres avec des invariants numériques et algébriques recalculés automatiquement.
- Aucun changement de format de sauvegarde : 143 questions et modèles interactifs, quatre examens A/B/C/D, domaine Render permanent inchangés.
- Validation sur Android physique et relecture universitaire externe toujours non réalisées : ces contrôles CI ne se substituent pas à une certification académique.


## v15 — compléments facultatifs structurés (10/11/2026)
- Les chapitres 13 (trigonométrie), 14 (géométrie) et 16 (complexes) comprennent désormais des ateliers guidés et six problèmes de transfert corrigés.
- **17 ateliers et 34 problèmes de transfert** contrôlés par un script Python de recalcul des invariants.
- Les jalons 21–23 restent facultatifs selon le syllabus Nice 2026-2027 ; aucune modification des 143 éléments interactifs ni des sauvegardes.


## v16 — reprise automatique d'une séance interrompue (10/11/2026)
- Sauvegarde atomique de la réponse et de l'avancement d'une série de 10 questions.
- Reprise au bon rang après rechargement, sans doubler les points ; mêmes questions paramétriques reconstruite à partir de leurs graines.
- Intégrité des données : validation stricte des ID, index, scores et graines ; repli sur anciennes sauvegardes JSON sans séance.
- Tests purs de restitution et d'échec quota, plus scénario Chromium de rechargement à la première et à la deuxième question.
