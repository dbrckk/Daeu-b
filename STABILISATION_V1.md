# DAEU B — plan de stabilisation 1.0 : commencer sans attendre

**Date de décision :** 13 novembre 2026 · **Périmètre :** mathématiques DAEU B · **Dépôt :** `dbrckk/Daeu-b` · **Site :** https://daeu-b-maths-dbrckk.onrender.com/#commencer

## Décision de livraison

La version v34 est **déjà utilisable pour commencer les mathématiques** : 18 cours (00–17), 20 jalons obligatoires SONATE, 157 entrées suivies (116 fixes + 41 modèles paramétriques), 60 problèmes de transfert, cinq examens blancs et cahier numérique avec sauvegarde locale. Les tests Node et Chromium mobile automatisé étaient verts avant la fusion de v34 ; le déploiement Render associé à `c250579` était déclaré `live`.

Le projet n'attend pas la couverture exhaustive de tous les programmes locaux du DAEU B pour commencer. Pour une **v1.0 stable**, priorité aux scénarios d'étude réels ; nouvelles fonctions, matières et perfectionnements visuels sont gelés jusqu'à fermeture des défauts P0.

## Sprint court : ordre impératif, un seul chantier à la fois

| Priorité | Livrable / travail | Critère de sortie observable | État au 13 novembre |
|---|---|---|---|
| **P0 — 1. Publication et supervision** | Vérifier la branche `main`, le déploiement Render correspondant, l'URL permanente, le manifeste, le cache PWA et les cours hors ligne. Corriger le healthcheck qui attendait `v33` après la publication `v34`. | Render `live` sur le bon SHA, contrôle public vert et absence de mélange de versions ; alerte en cas de déploiement obsolète. | Déploiement v34 **confirmé** ; correction du moniteur en cours sur branche de stabilisation. |
| **P0 — 2. Continuité de la progression** | Rejouer diagnostic, saisie manuscrite/texte, réponses, reprise après rechargement, miroir IndexedDB, import legacy, conflit entre onglets ; contrôler aussi l'accès cloud réel. | Zéro écrasement ou perte connue sur les scénarios automatisés ; statut de sauvegarde lisible ; restauration sur autre appareil testée avec compte si possible. | Scénarios locaux/Chromium déjà couverts ; Supabase actif avec RLS et politiques propriétaires vérifiées ; **connexion utilisateur réelle non encore validée**. |
| **P0 — 3. Parcours entièrement numérique** | Tester depuis un navigateur vierge : `Démarrer mon diagnostic → prochaine notion conseillée → cours → entraînement → transfert → rappel → examen blanc`. Toutes les opérations et justifications doivent pouvoir être saisies dans l'application, au doigt ou au clavier. | Aucun papier ou export nécessaire ; après chaque étape, une action utile identifiable ; brouillons et copies conservés au rechargement. | Démarrage, cahier, correction et réouverture testés dans Chromium simulant Android ; contrôle physique Android restant. |
| **P0 — 4. Cohérence mathématique et épreuves** | Tester syntaxe, corrigés, opérations exactes, domaines, examens générés et énoncés variables ; confronter les chapitres à leur référentiel, sans promettre de correction automatique de preuves libres. | CI Node/Python/Chromium verte sur le commit livré ; aucun défaut mathématique bloquant connu ; limites affichées honnêtement. | 163 tests Node et parcours Chromium verts sur v34 ; relecture académique complète non faite. |
| **P1 — 5. Confort et accessibilité** | Parcours TalkBack, clavier, focus, petit écran Android, orientation, luminosité, lisibilité et performance avec de nombreuses notes. | Les opérations essentielles restent utilisables et sans régression après correction ; aucun blocage P1 connu. | Tests navigateur simulé réalisés ; **TalkBack et Android réel restent à contrôler**. |
| **P2 — 6. Extensions ultérieures** | Autres matières, analyse symbolique générale, nouvelles banques d'exercices ou animations. | **Différées** jusqu'à la disponibilité d'une v1.0 stable. | Non bloquant. |

## Gate de la version 1.0 stable

Chaque point doit être renseigné par une preuve, pas seulement coché par intuition :

- [x] Application publique à une **adresse fixe** ; v34 publiée sur le commit `c250579`.
- [x] Parcours pédagogique et examens accessibles sur smartphone ; tests automatisés Chromium/hors ligne effectués.
- [x] Cahier sans papier, opérations posées, réponses, calculs et rédaction conservés par la sauvegarde locale.
- [x] Modèles de progression, rappels et examens testés sans perte sur les scénarios automatisés existants.
- [x] Serveur Supabase de progression actif, table RLS activée avec politiques INSERT/SELECT/UPDATE propriétaires ; aucun avis de sécurité remonté à l'inspection.
- [ ] Test de **connexion/inscription cloud réelle**, puis restauration sur un **second appareil** ; ne pas confondre simulation et preuve de production.
- [ ] Essai sur **Android physique** et lecture d'écran TalkBack ; les tests Chromium mobiles simulés ne suffisent pas pour cette mention.
- [ ] Healthcheck public aligné sur `main` et **réussi** après la correction du moniteur.
- [ ] Dernière vérification d'absence de défaut bloquant P0 et état de déploiement `live` du commit final.

**Statut à appliquer :** `Prête pour démarrer les mathématiques` tant que les trois derniers points ne sont pas certifiés ; `1.0 stable vérifiée` seulement après fermeture des vérifications P0 exigibles. Aucun pourcentage de préparation arbitraire.

## Consignes de travail pendant le gel

1. Priorité aux bugs et à la fiabilité ; ne pas mélanger une évolution UX lourde avec un correctif de sauvegarde.
2. Ne **jamais** réinitialiser `daeu-b-data-v1`, changer le domaine Render ou effacer les données utilisateur pour corriger un bug. Préserver les identifiants historiques des exercices.
3. La sauvegarde courante localStorage + IndexedDB est automatique sur le même appareil ; la **sauvegarde entre appareils nécessite une connexion cloud activée et confirmée**. Le JSON reste une option avancée, jamais une exigence quotidienne.
4. Exécuter les tests ciblés, CI Node/Python, Chromium mobile et hors ligne avant chaque fusion `main`, puis vérifier le déploiement Render correspondant.
5. Utiliser les vrais exercices, corrections et données ; ne pas attribuer de maîtrise à la lecture ni inventer une évaluation automatique des démonstrations.
6. À chaque blocage : produire un cas reproductible et le corriger avant de reprendre les fonctionnalités secondaires.

## Séance initiale recommandée

**Entrer dans l'application maintenant** : https://daeu-b-maths-dbrckk.onrender.com/#commencer. Toucher `Démarrer mon diagnostic` (10 questions au maximum), effectuer toutes les opérations dans le cahier intégré, consulter les erreurs puis ouvrir le premier cours conseillé. Les étapes et brouillons restent enregistrés sur ce téléphone. Pour éviter les exports manuels et retrouver l'historique sur un autre appareil, activer ensuite la synchronisation dans `Ma progression sur tous mes appareils` ; vérifier explicitement que l'état affiche une synchronisation réussie.

**Ce que « complet » signifie ici :** un système de travail **utilisable de bout en bout pour les mathématiques** et le référentiel SONATE couvert ; la préparation ne délivre ni le diplôme ni une garantie de réussite. La conformité à l'université finalement choisie est à vérifier séparément.
