# Atelier de maths — application web

**Site public :** https://noisy-prism-63q74n2.shipstatic.com

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

## Examens blancs interactifs (v3)

Depuis cette version, la page comprend **deux sujets fixes originaux A et B et un sujet C généré** sous « Examens blancs interactifs ». Chacun comporte **4 exercices représentant 5 points chacun**, soit une note automatisée sur 20.

- Sélectionner le sujet A, B ou C (avec nouvelles valeurs à chaque tentative), puis « Commencer l'examen (3 h) ».
- Le chronomètre démarre immédiatement, **continue même si la page est fermée** et s'arrête définitivement après trois heures. L'application rend alors la copie et calcule le bilan dès que l'onglet est rouvert.
- Chaque exercice contient des questions numériques ou des QCM **et un champ libre pour rédiger les justifications**. Les réponses, la rédaction et l'exercice courant sont sauvegardés dans le navigateur à chaque modification.
- Les solutions et le barème obtenu ne sont affichés **qu'après** le clic « Rendre ma copie » ou la fin du temps. La correction se consulte par exercice et indique les chapitres à revoir.
- **Important :** la note automatique valide uniquement les réponses numériques/QCM, pas les démonstrations, la rigueur ni la méthode. **Ce n'est pas une notation officielle du DAEU B.**
- « Historique des copies » conserve les 12 derniers examens, avec commentaires de rédaction. Les données restent locales.
- La sauvegarde JSON exportée depuis la nouvelle version comprend la progression **et les examens**. Les fichiers JSON de l'ancienne version (suivi v2 seul) sont toujours importables.

**Tolérance des approximations :** 1e-6 × max(1, |réponse|) ; pour les valeurs irrationnelles, fournir au moins 6 décimales (par ex. ln 3 ≈ 1,098612).

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

La version actuelle est : https://noisy-prism-63q74n2.shipstatic.com.

Anciennes adresses possibles :
- `https://clear-glyph-3u8hr78.shipstatic.com` (première version).
- `https://drifting-neon-d3tt6t6.shipstatic.com` (deuxième version).
- `https://ghostly-void-w99dhwc.shipstatic.com` (version avec examens sans auto-correction guidée).
- `https://visceral-link-ng9xj73.shipstatic.com` (version v4 avec correction guidée).
- `https://streamy-field-k44v8kv.shipstatic.com` (version v5 avec examen C).

L'hébergeur a signalé **une limite de domaines permanents atteinte**, et un alias stable n'a pas pu être réservé. Le lien du README de ce dépôt reste le point d'entrée pour trouver la dernière adresse.

Chaque ancien site conserve **sa propre mémoire locale**, car le stockage est lié à l'adresse du site. Il n'existe pas de transfert automatique de données entre ces deux adresses.

1. Ouvrir **l'ancien site**, puis **Exporter mes résultats**.
2. Ouvrir **la nouvelle adresse** ci-dessus.
3. Cliquer **Importer une sauvegarde JSON**, choisir le fichier exporté puis confirmer.
4. Vérifier le nombre de questions travaillées. Les 95 questions d'origine et les 32 modèles variables conservent leurs identifiants et leur progression si le fichier provient de la version précédente.
5. Les fichiers exportés depuis cette version comprennent également les examens et copies ; les anciens fichiers n'en contiennent pas.

Si la précédente adresse est inaccessible ou si son stockage a été effacé, la progression qui n'a jamais été exportée ne peut pas être reconstituée.

## Validation de cette version

- **32 modèles paramétriques** couvrant les 20 jalons non facultatifs, en plus des 95 questions fixes.
- Vérifications automatisées : **2 560 instances de variantes** comparées à une formule de référence, ainsi que les contrôles de notation, d'espacement et de sauvegardes.
- La publication a été confirmée comme `success` par l'hébergeur ; cela ne vaut pas audit manuel complet dans Chrome Android.


## Notes de validation — simulateur d'examen
- Deux examens originaux indépendants, chacun /20 en 4 exercices.
- Chronomètre réel 3 h, reprise locale, fin automatique à échéance, notation numérique/choix multiple, copies et rédaction locales.
- Les justifications manuscrites/texte **ne sont pas évaluées automatiquement**.
- Vérifications du moteur et des cas d'importation par `node --test app/engine.test.mjs app/exam-engine.test.mjs` ; contrôle GitHub Actions vert avant publication.
- Le test de compatibilité sur un appareil Android réel n'a pas été réalisé ; une réussite CI et un hébergement « success » n'en tiennent pas lieu.


## Correction guidée du raisonnement — v4

À la **fin d'un examen** (jamais pendant), ouvre chaque exercice du corrigé, puis « Correction guidée du raisonnement ». Quatre étapes structurées sont proposées : hypothèses/domaine, méthode, calculs et conclusion selon le problème. Compare-les à la rédaction sauvegardée de ta propre copie. Coche seulement les étapes **réellement démontrées**.

Les examens A et B comprennent **8 grilles / 32 étapes**. Le nouvel examen C possède **4 grilles générées / 16 étapes** supplémentaires par sujet : le total est **12 grilles / 48 étapes** réparties entre les trois formats. Les cases cochées sont sauvegardées dans chaque copie et dans l'export JSON. Elles **ne modifient pas la note sur 20** : c'est une déclaration personnelle, pas une correction automatique de la rédaction ou un contrôle anti-triche.

« Mon diagnostic après les examens » présente les points perdus par compétence sur les **12 dernières copies** et les liens vers les cours associés. Les mêmes sujets peuvent être refaits, mais cela ne prouve pas la maîtrise sur un sujet inédit.

Pour s'entraîner à des démonstrations qui ne reposent pas sur les QCM, utiliser également les [8 problèmes progressifs et leurs 37 questions](../problemes/README.md).

**Migration :** si tu utilisais l'une des anciennes adresses ci-dessus, exporte la progression à cette ancienne adresse puis importe le fichier dans le nouveau site. Les résultats sont séparés par nom de domaine.


## Examen C paramétrique — v5

Le troisième sujet d'examen est un **générateur local** de quatre problèmes originaux (16 sous-questions, 20 points, trois heures) portant sur :
1. Optimisation, dérivée et inéquation du second degré
2. Suite géométrique, seuil et logarithme
3. Tirages avec remise, loi binomiale et espérance
4. Primitive, intégrale définie et valeur moyenne

**Une graine de génération est conservée dans la copie.** Ainsi le sujet ne change pas pendant l'épreuve, après un rechargement ou après export/import JSON. Un nouveau départ génère une nouvelle graine. Les identifiants des sous-questions restent stables à l'intérieur d'un examen, mais les valeurs, les réponses et les explications sont recalculées à partir de sa graine.

Les examens fixes A/B, leurs copies, les grilles déjà cochées et les 127 éléments de pratique existants sont conservés : aucun nouveau compte n'est nécessaire.

**Contrôles de fiabilité :** 1 000 jeux de quatre problèmes vérifiés (barème, 16 sous-questions, rubriques) ; 250 sujets avec calculs contrôlés par des formules indépendantes ; reprise, import et correction des copies vérifiés. Les tests ne remplacent pas la validation d'interface Android ni une relecture professorale.

**Pour la progression :** privilégier le sujet C pour mesurer la capacité à résoudre un problème **sans mémoriser** un ancien corrigé. Les mêmes *types* de problème restent présents : la variabilité des données ne remplace pas une diversité plus large d'annales et de raisonnements.

**Attention aux anciennes adresses :** le stockage local est lié au nom de domaine. Exporter sa progression JSON depuis l'ancienne version avant de l'importer ici. Les liens externes vers GitHub nécessitent une connexion.


## Stabilisation v6 — application installable et tests navigateur

**URL validée :** https://noisy-prism-63q74n2.shipstatic.com

- La version actuelle comporte une icône SVG vectorielle, un manifeste PWA, un Service Worker avec cache local, et peut être ajoutée à l'écran d'accueil depuis le navigateur quand celui-ci le permet.
- La page est utilisable hors ligne **après une première visite avec connexion et mise en cache des fichiers**. Les liens vers les cours GitHub nécessitent toujours Internet.
- Dans « Sauvegarde et confidentialité », l'option **« Protéger le stockage local »** demande une persistance au navigateur via `navigator.storage.persist()`. Si elle est refusée, l'application continue normalement. Même accordée, elle ne remplace **jamais** la sauvegarde JSON en cas de changement d'adresse, d'appareil ou de nettoyage volontaire.
- L'import JSON est maintenant accessible au clavier avec un indicateur de focus visible.
- Le test automatique Chromium mobile exécute une session, un examen C, la reprise et la sauvegarde de la copie, le téléchargement JSON, l'effacement volontaire, la restauration et un rechargement hors ligne. Il a réussi lors de la stabilisation.
- Les tests sont locaux au dépôt dans GitHub Actions ; aucune bibliothèque de navigateur ne doit être chargée par les utilisateurs.

**Version de test :** https://github.com/dbrckk/Daeu-b/actions/runs/42398972721

**Adresse stable à finaliser :** une action utilisateur dans GitHub (Settings → Pages → Build and deployment → Source = GitHub Actions) permet d'activer le [workflow de publication déjà préparé](../.github/workflows/pages.yml). Après cette première activation, le workflow peut publier l'application sans hébergeur tiers ni changement d'URL. Tant que ce réglage n'est pas effectué, utiliser l'adresse ShipStatic ci-dessus, sans expiration prévue mais propre à cette publication.

**Tests non réalisés :** téléphone Android physique, multiples navigateurs, audit WCAG professionnel et revue pédagogique indépendante.


## Stabilisation v7 — cache hors ligne et non-régression

- Service worker à cache de version atomique : modules et CSS cohérents, sans mélange de fichiers entre deux versions.
- Installation annulée si une ressource obligatoire manque ; ancien cache conservé tant que la nouvelle version n'est pas installée.
- Les requêtes externes vers GitHub ne sont ni interceptées ni conservées.
- Tests Chromium mobile étendus aux corrigés de l'examen C et au rechargement hors ligne d'une nouvelle épreuve C.
- Données utilisateur conservées dans le navigateur, et non dans le service worker. Export JSON recommandé pour changer d'appareil.
- Un navigateur peut garder l'ancienne interface jusqu'à activation du nouveau service worker : fermer puis rouvrir en ligne si nécessaire.

Site public v7 : https://noisy-prism-63q74n2.shipstatic.com

Limite : les tests Chromium émulent le format mobile ; ils ne remplacent pas un essai sur un téléphone Android physique.
