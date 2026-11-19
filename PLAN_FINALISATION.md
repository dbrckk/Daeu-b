# DAEU B Maths — plan de finalisation de la version stable

**Point de départ** · v62, commit `4eab6a6`, 15 novembre 2026.  
**Application** · [Ouvrir DAEU B Maths](https://daeu-b-maths-dbrckk.onrender.com/#commencer).  
**Périmètre** · préparation autonome aux mathématiques sur Android et ordinateur, d’après le [programme du dépôt](PROGRAMME.md) et le [syllabus SONATE Côte d’Azur 2026–2027, pages 4 et 5](https://univ-cotedazur.fr/medias/fichier/syllabus-daeu-b-sonate-26-27_1776078074188-pdf). Les autres matières feront l’objet d’une feuille de route distincte.

## Objectif de sortie

Pouvoir suivre le parcours complet depuis un navigateur vierge. Démarrer un diagnostic, suivre le cours conseillé, faire ses calculs et répondre au clavier, réaliser un transfert, passer un examen blanc, puis reprendre les notions à retravailler. Le travail se fait dans l’application. La copie et la progression sont sauvegardées automatiquement pendant l’usage courant, sans export manuel.

La v62 est déjà utilisable pour étudier. Ce plan remplace les anciennes priorités de développement. La version stable conserve l’URL Render, les identifiants des questions et le format des sauvegardes tant qu’une migration n’est pas nécessaire. Elle s’appuie sur le site statique, la PWA et le stockage existants.

## État de départ vérifié

| Domaine | Disponible dans la v62 | À vérifier ou corriger avant clôture |
|---|---|---|
| Programme | 18 cours, 20 jalons obligatoires, 116 questions fixes, 41 générateurs, 8 problèmes guidés et 60 transferts | Vérifier la profondeur des exemples et résoudre l’attribution inter-domaines `l12`. |
| Feuille et correction | Écriture au doigt ou au stylet, quiz numériques et à choix, remise manuscrite, corrigés, grille et révisions | Rejouer le parcours complet depuis une installation vierge, sur écran étroit, avec des écritures simples et difficiles à reconnaître. |
| Continuité | Sauvegarde locale et miroir IndexedDB, reprise des copies, synchronisation facultative | Accumulation de copies réalistes, mise à niveau de la PWA avec une copie ouverte, vérification cloud réelle sur deux navigateurs si un compte de test est disponible. |
| Examens blancs | Cinq sujets à quatre exercices, chronomètre et historique | Rejouer une épreuve manuscrite complète. Rendre le formulaire de l’application accessible depuis la copie pendant une simulation, sans quitter l’épreuve. |
| Publication | URL publique, CI et contrôle du cache | Publier la version candidate et consigner les preuves exactes de ce qui a été validé. |

## Avancement vérifié

- v63 · six examens dont cinq copies d’essai volumineuses, restauration IndexedDB hors ligne après fermeture et absence de perte lors d’un quota simulé. Contrôle de concurrence sur le miroir. La synchronisation avec un compte Supabase réel reste à vérifier.
- v64 · formulaire d’entraînement hors ligne dans la copie, retour à la feuille et conservation du délai vérifiés dans Chromium.
- v65 · [échantillon pédagogique des 20 jalons](audits/REVUE_FINALE_MATHS.md) et correction de l’attribution de `l12`.
- v113 · saisie au clavier par défaut et reprise d’une copie manuscrite en cours au clavier.
- v114 · contrôle du format des réponses avant remise et reprise d’une étape à retravailler depuis l’accueil après un examen au clavier.

## Lot 1 · Continuité et sécurité des sauvegardes

- [x] Chromium mobile · `scripts/paper-only-smoke.mjs` vérifie la reprise hors ligne d’une séance et d’un examen à plusieurs pages après fermeture de l’onglet. Il compare la question, l’exercice actif et les traits, rouvre la deuxième page depuis la correction et retrouve l’étape à retravailler. Il rejoue la migration du cache v62 avec une copie d’examen ouverte.
- [ ] Mesurer dans `app/workbook.mjs`, `app/persistence.mjs` et `app/auto-backup.mjs` le volume d’un parcours au trait avec quatre exercices par examen, puis de plusieurs copies. Examiner les limites de 240 traits par page, 180 entrées et 1,65 Mo pour le cahier. En cas d’échec, distinguer la limite applicative du quota du navigateur. Corriger tout blocage observé sur un usage ordinaire, sans supprimer ni tronquer les anciennes copies. Simuler un échec d’écriture et un conflit d’onglets et vérifier que l’état sauvegardé reste lisible.
- [ ] Vérifier la synchro en production avec un compte de test contrôlé et deux profils de navigateur neufs. Le premier enregistre une réponse, une copie et une étape à retravailler. Le second restaure ces trois données par connexion, sans importer de fichier. Vérifier l’isolation avec un autre compte de test si disponible. Documenter séparément les résultats des parcours simulés de `scripts/browser-cloud.mjs`.

**Sortie** · aucune perte de progression dans les scénarios locaux. Une limite ou une erreur de stockage est visible et laisse la dernière sauvegarde intacte. La synchronisation entre appareils est mentionnée comme vérifiée uniquement après un essai réel. Sans accès au compte de test, publier l’état exact de la validation locale et de la synchronisation.

## Lot 2 · Parcours entièrement dans l’application

- [ ] Sur `app/index.html`, depuis un profil neuf, suivre le diagnostic, le prochain jalon conseillé, le cours, l’entraînement et un transfert. Vérifier qu’un apprenant trouve l’action suivante en fin de séance et retrouve ses rappels après rechargement. Corriger seulement les impasses, intitulés trompeurs et liens cassés observés.
- [x] Saisir des fractions et des équations dans le brouillon du quiz en Chromium mobile. Vérifier le rendu MathML, la correction des étapes prises en charge et la reprise du brouillon après rechargement.
- [ ] Sur `app/exam-ui.mjs`, réaliser un blanc à quatre exercices, vérifier une remise annulée puis confirmée et rejouer une fin de chronomètre. Ajouter dans la copie un accès repliable à une version locale du [formulaire d’entraînement](fiches/formulaire.md). Vérifier que l’ouverture ne modifie ni le temps restant ni la copie et fonctionne hors connexion. Le formulaire d’entraînement doit être identifiable comme tel. Tester les calculs nécessaires dans l’application et n’ajouter un outil de calcul que si un besoin de l’épreuve reste bloquant.
- [x] Après la remise, comparer la copie au corrigé et marquer une étape à retravailler. Vérifier que l’accueil rouvre l’étape exacte après rechargement et que les liens de cours et d’entraînement s’ouvrent sur les bons chapitres.

**Sortie** · le parcours est mené de bout en bout au clavier, sans papier ni export obligatoire. Les démonstrations se comparent au corrigé et à la grille de rédaction.

## Lot 3 · Dernière revue pédagogique et accessibilité

- [x] À partir de [l’audit de couverture](AUDIT_COUVERTURE.md), relire un exercice fixe, une variante et un transfert par jalon obligatoire. Vérifier les calculs, les domaines, la cohérence de la correction et le lien vers le cours. Traiter `l12` comme un exercice de dérivation en contexte de fonction rationnelle. Si le classement change, conserver son identifiant et vérifier les révisions existantes. Examiner en priorité les inéquations et les asymptotes, dont les questions fixes sont à choix.
- [ ] Rejouer les cinq examens avec leurs corrigés et vérifier que leurs profils signalent le tronc commun et les compléments. Contrôler au moins une copie complète sans se servir du corrigé avant la remise. Corriger les erreurs démontrées avant d’ajouter du contenu.
- [ ] Vérifier à 320 px puis en paysage la feuille, la zone d’écriture, le passage entre pages, la confirmation et le retour au corrigé. Vérifier au clavier sur ordinateur les commandes, tabulations et focus. Faire un essai sur Android physique et avec TalkBack dès qu’un appareil est disponible. Consigner clairement la différence avec les résultats Chromium en mode mobile.

**Sortie** · les 20 jalons ont tous une preuve de cohérence sur l’échantillon relu. Les écarts restants sont documentés. Les actions indispensables sont accessibles et l’application décrit précisément les environnements vérifiés.

## Lot 4 · Publier et fermer la version stable

- [ ] Sur le commit candidat, exécuter les vérifications locales ci-dessous, puis les parcours de `.github/workflows/verify-content.yml` et `.github/workflows/browser-smoke.yml`. Enregistrer les résultats dans [RELEASE.md](RELEASE.md), avec les tests manuels et les limites de validation.
- [ ] Fusionner sur `main` quand les défauts bloquants sont fermés. Vérifier le cache PWA public et la cohérence des ressources effectivement servies avec le commit livré. Exécuter `python3 scripts/healthcheck.py` depuis le checkout de ce commit. Rejouer un démarrage et une reprise sur l’URL habituelle.
- [ ] En cas de régression publique bloquante, publier le correctif ou restaurer les ressources de la dernière version fonctionnelle. Vérifier qu’une copie créée dans la version candidate se relit après le retour. Aucune réinitialisation du stockage utilisateur.

**Critère de clôture** · aucun défaut ouvert empêchant d’étudier, de rendre une copie, de retrouver sa progression ou d’accéder aux corrigés. Les tests de production et les résultats manuels disponibles sont consignés. Les validations dépendant d’un appareil ou d’un compte de test sont suivies comme telles, sans assimiler une simulation à un essai réel.

```bash
node --test app/*.test.mjs scripts/audit-coverage.test.mjs
python3 scripts/check_content.py
python3 scripts/verify_app_assets.py
python3 scripts/verify_worked_cases.py
python3 scripts/check_transfers.py
node scripts/verify-transfer-math-ab.mjs
python3 scripts/verify_transfer_math.py
node scripts/audit-coverage.mjs --check
node scripts/audit-exams.mjs --check
```

## Ordre et périmètre après clôture

Prévoir quatre blocs de travail, dans l’ordre ci-dessus. Compter environ quatre à six jours de travail effectif si les validations ne révèlent pas de problème de stockage important. L’accès à un téléphone physique ou à un compte de test peut changer le calendrier sans empêcher de commencer à étudier sur l’URL actuelle.

Après la sortie stable, reprendre séparément l’élargissement des banques facultatives, les perfectionnements de reconnaissance et les autres matières. Les anomalies de sauvegarde, d’accès et de correction restent prioritaires en maintenance.
