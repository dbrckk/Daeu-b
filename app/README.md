# Atelier de maths — application web

**Site public :** https://clear-glyph-3u8hr78.shipstatic.com

Cette application complète les cours Markdown du dépôt. Elle contient 95 questions corrigées en 13 domaines couvrant les 20 jalons obligatoires du syllabus DAEU B SONATE Côte d'Azur 2026-2027. Les 3 jalons facultatifs sont traités dans les cours Markdown, mais pas encore dans la banque interactive.

## Utilisation sur Android ou PC

1. Ouvrir le site dans Chrome ou un navigateur récent.
2. Choisir un chapitre ou « Tous les chapitres », puis « Découverte et consolidation ».
3. Répondre sans aide ; utiliser papier et stylo pour les calculs.
4. Lire la correction seulement après validation. Un indice ou l'option « Je ne sais pas » sont disponibles.
5. Revenir en mode « Révisions à effectuer » pour revoir les questions arrivées à échéance.
6. Utiliser « Exporter mes résultats » pour obtenir un fichier JSON avant de changer d'appareil, puis « Importer une sauvegarde JSON ».

## Validation et rappels

- Premier succès : rappel un jour plus tard.
- Deuxième succès consécutif : trois jours après, puis 7, 14 et 30 jours selon la série.
- « Acquis après rappel » exige au moins deux réponses correctes consécutives à des dates **différentes** (dates calculées en UTC).
- Une erreur remet le compteur à zéro et rend la question révisable.
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