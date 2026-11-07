# Atelier de maths — application web

**Site public :** https://drifting-neon-d3tt6t6.shipstatic.com

Cette application complète les cours Markdown du dépôt. Elle contient **95 exercices fixes et 32 modèles à valeurs variables**, soit 127 éléments suivis dans 13 domaines couvrant les 20 jalons obligatoires du syllabus DAEU B SONATE Côte d'Azur 2026-2027. Les 3 jalons facultatifs sont traités dans les cours Markdown, mais pas encore dans la banque interactive.

## Utilisation sur Android ou PC

1. Ouvrir le site dans Chrome ou un navigateur récent.
2. Choisir un chapitre ou « Tous les chapitres », puis « Découverte et consolidation ».
3. Répondre sans aide ; utiliser papier et stylo pour les calculs.
4. Lire la correction seulement après validation. Un indice ou l'option « Je ne sais pas » sont disponibles.
5. Revenir en mode « Révisions à effectuer » pour revoir les questions arrivées à échéance.
6. Utiliser « Exporter mes résultats » pour obtenir un fichier JSON avant de changer d'appareil, puis « Importer une sauvegarde JSON ».

## Validation et rappels

- Premier succès : rappel un jour plus tard.
- Deuxième succès consécutif à une date différente : trois jours après, puis 7, 14 et 30 jours selon la série.
- « Acquis après rappel » exige au moins deux réponses correctes consécutives à des dates **différentes** (dates calculées en UTC).
- Une erreur remet le compteur à zéro et rend la question révisable.
- Les réussites **avec indice** ne valident pas la maîtrise et remettent à zéro la série. Pour les modèles à valeurs variables, le nouvel énoncé doit être différent de celui du rappel précédent.
- Les réponses à choix multiples ne prouvent pas une maîtrise complète : résoudre aussi les exercices des cours et les examens blancs.

## Réponses acceptées

L'outil accepte pour les questions numériques les écritures 3/4, 0,75, -1/2, 0.5 et les entiers. Tolérance : 1e-6 fois le maximum de 1 et de la valeur absolue de la réponse. Les questions symboliques sont proposées en QCM : il n'y a **pas de moteur d'algèbre symbolique**.

## Vie privée et hors ligne

- Pas de compte, de publicité, de jeton, de bibliothèque externe ni de télémétrie.
- Les résultats sont dans le stockage local du navigateur, sans synchronisation.
- Un service worker précharge les fichiers de l'interface après une première visite en HTTPS ; les liens externes GitHub ne sont **pas** inclus dans le cache.
- Si le navigateur efface les données du site, les résultats non exportés sont perdus.
- Import JSON : version 2, remplacement de la progression existante après confirmation.
- Les vrais tests sur téléphone Android, la navigation au clavier et le cache hors ligne sont encore à vérifier.

## Développement

Application statique sans outils de build ni dépendances. À partir de la racine du dépôt, lancer sur PC un serveur HTTP local avec la commande :

    python3 -m http.server 8000 -d app

Puis ouvrir http://localhost:8000 .

Vérifications :

    node --test app/engine.test.mjs
    python3 scripts/check_content.py

La CI valide les invariants du moteur, la cohérence du corpus et les liens, **pas** le comportement réel sur tous les navigateurs ni l'exactitude de toutes les preuves mathématiques.

Référence universitaire : https://univ-cotedazur.fr/medias/fichier/syllabus-daeu-b-sonate-26-27_1776078074188-pdf

Le dépôt prépare au DAEU B, il ne délivre pas le diplôme.

## Changer d'adresse ou de téléphone

La nouvelle version publiée le 7 novembre 2026 est : https://drifting-neon-d3tt6t6.shipstatic.com.

Le précédent site `https://clear-glyph-3u8hr78.shipstatic.com` conserve **sa propre mémoire locale**, car le stockage est lié à l'adresse du site. Il n'existe pas de transfert automatique de données entre ces deux adresses.

1. Ouvrir **l'ancien site**, puis **Exporter mes résultats**.
2. Ouvrir **la nouvelle adresse** ci-dessus.
3. Cliquer **Importer une sauvegarde JSON**, choisir le fichier exporté puis confirmer.
4. Vérifier le nombre de questions travaillées. Les 32 modèles variables sont nouveaux ; ils n'effacent pas le suivi des 95 questions d'origine.

Si la précédente adresse est inaccessible ou si son stockage a été effacé, la progression qui n'a jamais été exportée ne peut pas être reconstituée.

## Validation de cette version

- **32 modèles paramétriques** couvrant les 20 jalons non facultatifs, en plus des 95 questions fixes.
- Vérifications automatisées : **2 560 instances de variantes** comparées à une formule de référence, ainsi que les contrôles de notation, d'espacement et de sauvegardes.
- La publication a été confirmée comme `success` par l'hébergeur ; cela ne vaut pas audit manuel complet dans Chrome Android.
