# Plan de finalisation des mathématiques du DAEU B

## Point de départ

L’atelier conserve un quiz actif et un quiz en pause, avec leurs questions, leur avancement et leur brouillon. Un troisième démarrage demande de confirmer le remplacement du quiz actif. Depuis la v125, la mise à jour attend que le dernier brouillon du quiz puisse être enregistré. L’export tente aussi d’inclure la saisie la plus récente.

Le parcours de référence se fait au clavier, du diagnostic à la relecture du corrigé d’examen. Les anciennes copies restent consultables. Le périmètre comprend 18 cours, 20 jalons obligatoires, 116 questions fixes, 41 modèles variables, 60 transferts écrits et cinq examens blancs. Les [notes de version](RELEASE.md), l’[audit des jalons](AUDIT_COUVERTURE.md) et l’[audit des examens](AUDIT_EXAMENS.md) servent de référence.

## 1. Vérifier la continuité des sauvegardes · P0

- Le scénario local de [mise à jour PWA](scripts/pwa-upgrade-smoke.mjs) ouvre deux quiz, un transfert et un examen au clavier dans un même profil Chromium à 320 px. Après une mise à jour de test, il ferme le navigateur et relance le même profil hors connexion. Il compare les données sauvegardées, les réponses, les justifications, l’exercice actif et le temps restant.
- La même suite simule un quota plein, un conflit entre deux onglets et une récupération par export et import. Elle vérifie que le quota bloque le rechargement quand le brouillon du quiz reste à enregistrer.
- Si un compte Supabase de test est disponible, enregistrer sur un profil et restaurer sur un second profil vierge. Comparer la progression, une copie et une étape à retravailler. Consigner séparément l’essai avec le compte et le résultat de la simulation en CI.

**Critère de sortie.** Aucun scénario local validé ne perd de progression, de brouillon ou de copie. Une écriture refusée laisse la dernière sauvegarde intacte. Les environnements réellement vérifiés sont consignés.

## 2. Valider les corrigés et les barèmes · P1

- La [revue des 20 jalons](audits/REVUE_FINALE_MATHS.md#vérification-de-la-correction-en-v126) vérifie un piège de correction par jalon et recalcule des énoncés issus des 41 modèles de quiz.
- Les quatre exercices de chacun des blancs A à E ont été recalculés. Le rapport donne les réponses de référence pour A et B, les graines vérifiées pour C, D et E et les contrôles de barème.
- La v126 précise les arrondis des examens B et D, rend les fractions exactes visibles dans le corrigé C et vérifie la distinction entre un espace de milliers et des chiffres séparés.

**Critère de sortie.** Chaque jalon obligatoire et chaque sujet a un résultat de revue traçable. Aucune erreur connue d’énoncé, de correction ou de barème ne fausse le travail de l’élève.

## 3. Rejouer une préparation complète au clavier · P1

- Le [parcours Chromium](scripts/browser-smoke.mjs) suit le diagnostic, le cours, le quiz et le transfert du même jalon à 320 px. Il avance l’horloge à J+7 et J+30 pour vérifier que les rappels ouvrent le même jalon en série B puis C et que les trois rédactions sont enregistrées.
- Le même parcours saisit les quatre exercices du blanc A, consulte le formulaire hors connexion après réouverture de la copie, annule une remise puis confirme la suivante. Il retrouve l’étape du corrigé depuis l’accueil et ouvre les exercices associés. Le blanc B vérifie séparément la remise automatique à l’échéance.
- Chromium vérifie le focus lors des changements d’exercice sur écran étroit et sur ordinateur. Un essai Android physique avec TalkBack reste à consigner quand un appareil de test est disponible.

**Critère de sortie.** Le parcours complet se termine dans l’application. Les réponses et justifications sont récupérables, et les actions indispensables sont accessibles au clavier.

## 4. Publier et clôturer la version stable · P0

- Exécuter les contrôles de contenu, les tests Node et les suites Chromium sur le commit candidat. Consigner le commit, les scénarios rejoués et les limites dans les [notes de version](RELEASE.md).
- Publier depuis `main`. Depuis le checkout du commit livré, exécuter `python3 scripts/healthcheck.py --wait-seconds 480` et vérifier que le contrôle retrouve la version et l’intégrité de toutes les ressources PWA. Rejouer un démarrage et une reprise sur l’URL publique.
- Si une régression bloque la progression, publier le correctif ou rétablir les ressources de la dernière version fonctionnelle. Vérifier qu’une sauvegarde produite par la version candidate reste lisible après le retour.

**Critère de clôture.** Les quatre lots ont une preuve de validation. Aucun défaut ouvert n’empêche d’étudier, de rendre une copie, de retrouver sa progression ou de consulter les corrigés. Les essais dépendant d’un appareil ou d’un compte sont signalés avec leur état réel. L’ajout de contenu facultatif reprend après la clôture.

## Contrôles reproductibles

```bash
node --test app/*.test.mjs scripts/*.test.mjs scripts/seshat-web/*.test.mjs
python3 scripts/check_content.py
python3 scripts/verify_app_assets.py
python3 scripts/verify_worked_cases.py
python3 scripts/check_transfers.py
node scripts/verify-transfer-math-ab.mjs
python3 scripts/verify_transfer_math.py
node scripts/audit-coverage.mjs --check
node scripts/audit-exams.mjs --check
```

Les workflows [de contenu](.github/workflows/verify-content.yml) et [de navigation](.github/workflows/browser-smoke.yml) documentent les autres scénarios exécutés en CI.
