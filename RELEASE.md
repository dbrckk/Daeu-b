# Rapport de stabilisation — DAEU B mathématiques

**État : candidat public stable v6 (07/11/2026)**  
**Version hébergée :** https://dim-monolith-4m8zee2.shipstatic.com  
**Dépôt :** https://github.com/dbrckk/Daeu-b  
**Branche :** `main`

## Capacités réellement présentes
- Programme DAEU B SONATE 2026-2027, 20 jalons principaux + 3 facultatifs traités dans les cours.
- 95 questions fixes et 32 générateurs paramétriques, répartis en 13 domaines, avec corrigés, révisions espacées et suivi local.
- Examens A/B fixes, examen C à valeurs variables, chacun 4 exercices, 3 heures, 20 points de notation objective.
- Grilles de raisonnement à valider par soi-même et diagnostic de points perdus, sans prétendre noter automatiquement la rédaction.
- Huit problèmes progressifs indépendants et 37 sous-questions avec fichiers de corrigés séparés.
- Export/import JSON contenant entraînements, examens, copies, réflexions et auto-évaluations.
- Service Worker et cache PWA pour les fichiers de l'application ; nouveau manifeste et icône vectorielle.
- Bouton de persistance facultative du stockage local et repli explicite en cas de refus.

## Tests automatisés — résultats confirmés
| Contrôle | Résultat et preuve |
|---|---|
| Liens Markdown, fichiers, sujets et cache | [Succès GitHub Actions](https://github.com/dbrckk/Daeu-b/actions/runs/42398972750) |
| Vérifications de cohérence mathématique et notation | Même exécution : échantillons et 2 560 variantes recalculées |
| 1 000 sujets C et 250 calculs de référence | Scripts `app/exam-generator.test.mjs` exécutés en CI |
| Parcours mobile dans Chromium | [Succès du test fonctionnel](https://github.com/dbrckk/Daeu-b/actions/runs/42398972721) |
| Export → suppression → import JSON | Succès dans le test fonctionnel Chromium |
| Sauvegarde d'une copie en cours, reprise et auto-évaluation | Succès dans le test fonctionnel Chromium |
| Rechargement intégral sans Internet | Succès dans le test fonctionnel Chromium |
| Absence de débordement horizontal à 390 px | Succès dans le test fonctionnel Chromium |
| Réponse HTTP et fichier publié | ShipStatic : publication `success` |
| Test physique Android | **Non réalisé** |
| Relecture universitaire complète | **Non réalisée** |

La CI utilise Playwright en dépendance de test **uniquement sur GitHub Actions**. L'application servie contient 17 fichiers totalisant **136 534 octets** (valeur fournie par l'hébergeur pour ce déploiement) ; pas de dépendance npm au chargement.

## Mode d'emploi Android
1. Ouvrir https://dim-monolith-4m8zee2.shipstatic.com dans Chrome.
2. Choisir un chapitre, puis « Démarrer · 10 questions » ; consulter le corrigé après chaque réponse.
3. Dans « Examens blancs », utiliser de préférence le **sujet C** pour de nouvelles données sans mémoriser les valeurs des sujets A/B.
4. En cas de besoin, utiliser le menu du navigateur « Ajouter à l'écran d'accueil » ou « Installer l'application » selon les possibilités du navigateur.
5. Visiter une première fois le site avec Internet pour le mettre en cache. Les cours publiés sur GitHub restent externes.
6. Utiliser « Exporter mes résultats » régulièrement. Le stockage persistant, lorsqu'il est accepté par le navigateur, n'élimine pas la nécessité d'une sauvegarde.

## Hébergement stable GitHub Pages (préparé, action initiale nécessaire)
Le workflow `.github/workflows/pages.yml` est installé mais **désactivé en déploiement automatique initial**, car GitHub Pages n'était pas encore activé (l'action `configure-pages` a retourné Not Found).

Depuis le dépôt :
1. **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. **Actions → Site stable GitHub Pages → Run workflow** (branche `main`).
3. Attendre que le workflow soit vert, puis ouvrir l'URL donnée par le déploiement. Elle devrait être du type `https://dbrckk.github.io/Daeu-b/`, **à confirmer uniquement après déploiement réussi**.

Ce réglage ne touche pas au site de montres existant ni aux autres domaines.

## Limites à ne pas masquer
- Pas de correction automatique véritable de la démonstration libre ; seule la réponse objective est notée et les étapes sont auto-évaluées.
- L'examen C varie les coefficients sur **quatre structures de problème**, pas l'ensemble possible des questions universitaires.
- L'application fonctionne hors ligne pour les écrans et exercices en cache, mais les cours GitHub ne sont pas mis en cache.
- L'usage sur un véritable téléphone Android et les autres navigateurs restent à valider.
- Il faut **exporter/importer** pour migrer d'un domaine de déploiement à l'autre ; aucune synchronisation cloud n'existe.
- Cette formation ne délivre pas le DAEU B et n'est pas une plateforme officielle universitaire.

## Politique de mise à jour
- Modifier le bon dépôt et exécuter les deux workflows de vérification après toute modification de l'application.
- Ne pas déployer une version dont les tests Chromium ou les contrôles pédagogiques échouent.
- Vérifier le résultat de publication et tenir l'URL à jour dans le README.
- Préserver la compatibilité des sauvegardes avant tout changement de schéma ; les exports des versions précédentes doivent rester importables.
