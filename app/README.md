# Atelier de maths — application web

## v55 — la feuille numérique comme support unique d'écriture (14 novembre 2026)

- Les quiz s'ouvrent sur une grande copie plein écran : questions et choix imprimés en haut, écritures au doigt ou au stylet, sans formulaire ni clavier visible. Le geste et les pages sont sauvegardés automatiquement dans le format existant.
- Les choix multiples sont numérotés sur la feuille. Un numéro manuscrit peut être lu localement et n'est corrigé qu'après confirmation. Les calculs et équations incertains restent soumis à comparaison au corrigé, sans maîtrise autonome fictive.
- Les nouveaux examens utilisent quatre feuilles manuscrites distinctes, conservées et consultables après remise. **Aucune note /20 n'est affichée** pour ces copies : la correction automatique des démonstrations manuscrites n'est pas fiable.
- Les anciennes copies avec formulaires restent compatibles. Une interface clavier d'accessibilité reste disponible en ajoutant `?saisie=clavier` à l'URL de l'atelier.
- Navigation : gomme, annulation, pages et déplacement tactile. L'écriture ne nécessite aucun papier ni export manuel.


## v54 — validation manuscrite en priorité, sans révélation prématurée (14 novembre 2026)

- Le bouton principal « Valider ma réponse sur la feuille » cherche d'abord la réponse numérique sur la dernière page écrite ; si besoin, il propose la transcription des équations et de leur dernière ligne `x = nombre`. **Une confirmation visuelle reste indispensable** avant toute correction objective ; aucune note n'est produite à partir d'un OCR non confirmé.
- Les symboles incertains peuvent être corrigés au toucher, puis vérifiés. En cas de QCM, démonstration ou écriture non reconnue, l'élève peut comparer sa réponse au corrigé dans le même cahier, sans ressaisir son calcul sur un autre champ. Cette auto-évaluation est assistée et ne valide pas un acquis autonome.
- Sur Android, un geste `pointercancel` n'est plus enregistré comme un trait incomplet. Tests navigateur adaptés pour contrôler cette interruption et le chemin de validation prioritaire, en plus des tests de sauvegarde et PWA.


## v36 — grande feuille et remise manuscrite sans ressaisie (13 novembre 2026)

- Sur les quiz, le cahier propose une surface d'écriture de 840 px, débordant horizontalement dans une zone de défilement, avec flèches et mode déplacement tactile. Le format de sauvegarde des traits reste 600 × 800 pour conserver les copies existantes ; seule leur échelle affichée change. Huit pages par activité restent disponibles.
- Écrire au doigt/stylet, puis toucher « Valider ma feuille manuscrite » : l'application refuse une feuille entièrement vierge, révèle la réponse attendue et son explication, puis propose deux boutons d'auto-évaluation. Le formulaire de réponse numérique et les QCM ne sont pas requis pour cette remise.
- Une réponse déclarée correcte ou incorrecte est inscrite dans la séance et dans la sauvegarde automatique ; la consultation du corrigé compte comme assistance et ne valide **jamais** un acquis autonome. Le navigateur n'effectue ni OCR ni notation automatique de l'écriture manuscrite.
- Le clavier mathématique et la vérification de certaines étapes restent utilisables après la feuille, dans un volet facultatif. Les quiz numériques et QCM conservent leurs contrôles automatiques.
- Tests automatisés ciblés : tracé, grande surface, déplacement, refus de feuille vide, révélation différée, remise sans second champ, exclusion de maîtrise, reprise après rechargement. Les tests Chromium ne remplacent pas un essai sur appareil Android réel.


> **État réel au 13 novembre 2026 :** voir [le plan de stabilisation 1.0](../STABILISATION_V1.md). Les paragraphes historiques v2 à v27 décrivent les anciennes versions ; ils ne remplacent pas ce statut actuel. La synchronisation cloud facultative a été ajoutée après les sections historiques ; elle nécessite une connexion et une confirmation de synchronisation, et son inscription dépend des restrictions d'e-mail du service Supabase.


**Site public :** https://daeu-b-maths-dbrckk.onrender.com

Cette application complète les cours Markdown du dépôt. Elle contient **116 exercices fixes et 41 modèles à valeurs variables**, soit 157 éléments suivis dans 13 domaines couvrant les 20 jalons obligatoires du syllabus DAEU B SONATE Côte d'Azur 2026-2027. Les 3 jalons facultatifs sont traités dans les cours Markdown, mais ne disposent pas tous d'une banque de quiz indépendante. Le chapitre de trigonométrie comporte notamment trois problèmes rédigés et corrigés.

## Utilisation sur Android ou PC

1. Ouvrir le site dans Chrome ou un navigateur récent.
2. Choisir un chapitre ou « Tous les chapitres », puis « Découverte et consolidation ».
3. Répondre sans aide ; utiliser le cahier de calcul numérique pour poser les calculs, les équations et les rédactions directement dans l'application.
4. Lire la correction seulement après validation. Un indice ou l'option « Je ne sais pas » sont disponibles.
5. Revenir en mode « Révisions à effectuer » pour revoir les questions arrivées à échéance.
6. La progression est enregistrée automatiquement en deux exemplaires locaux. Aucun export JSON n'est nécessaire au quotidien. Une connexion facultative depuis « Ma progression sur tous mes appareils » permet une synchronisation cloud lorsqu'elle est réellement active ; sans cette connexion, la perte du téléphone ou l'effacement complet des données du site efface les deux copies locales.

## Validation et rappels

- Premier succès : rappel un jour plus tard.
- Deuxième succès consécutif à une date différente : trois jours après, puis 7, 14 et 30 jours selon la série.
- « Acquis après rappel » exige au moins deux réponses correctes consécutives à des dates **différentes** (dates calculées en UTC).
- Une erreur remet le compteur à zéro et rend la question révisable.
- Les réussites **avec indice** ne valident pas la maîtrise et remettent à zéro la série. Pour les modèles à valeurs variables, le nouvel énoncé doit être différent de celui du rappel précédent.
- Les réponses à choix multiples ne prouvent pas une maîtrise complète : résoudre aussi les exercices des cours et les examens blancs.

## Réponses acceptées

## Examens blancs interactifs (v3)

Depuis la v11, la page comprend **deux sujets fixes originaux A et B, ainsi que les sujets C et D générés** sous « Examens blancs interactifs ». Chacun comporte **4 exercices représentant 5 points chacun**, soit une note automatisée sur 20.

- Sélectionner le sujet A, B ou C (avec nouvelles valeurs à chaque tentative), puis « Commencer l'examen (3 h) ».
- Le chronomètre démarre immédiatement, **continue même si la page est fermée** et s'arrête définitivement après trois heures. L'application rend alors la copie et calcule le bilan dès que l'onglet est rouvert.
- Chaque exercice contient des questions numériques ou des QCM **et un champ libre pour rédiger les justifications**. Les réponses, la rédaction et l'exercice courant sont sauvegardés dans le navigateur à chaque modification.
- Les solutions et le barème obtenu ne sont affichés **qu'après** le clic « Rendre ma copie » ou la fin du temps. La correction se consulte par exercice et indique les chapitres à revoir.
- **Important :** la note automatique valide uniquement les réponses numériques/QCM, pas les démonstrations, la rigueur ni la méthode. **Ce n'est pas une notation officielle du DAEU B.**
- « Historique des copies » conserve les 12 derniers examens, avec commentaires de rédaction. Les données restent locales.
- La sauvegarde JSON exportée depuis la nouvelle version comprend la progression **et les examens**. Les fichiers JSON de l'ancienne version (suivi v2 seul) sont toujours importables.

**Tolérance des approximations :** 1e-6 × max(1, |réponse|) ; pour les valeurs irrationnelles, fournir au moins 6 décimales (par ex. ln 3 ≈ 1,098612).

## Réponses acceptées

Le cahier de calcul vérifie les dérivées de polynômes de degré 0 à 6 et certaines fonctions usuelles : c·sin(ax+b), c·cos(ax+b), c·exp(ax+b), c·ln(ax+b) + constante, avec coefficients rationnels et argument affine. Pour ln, le domaine ax+b > 0 doit être respecté. Les autres expressions, les démonstrations et la rédaction ne sont pas corrigées automatiquement. Des modèles tactiles permettent de saisir ces dérivées sans papier.

L'outil accepte pour les questions numériques les écritures 3/4, 0,75, -1/2, 0.5 et les entiers. Tolérance : 1e-6 fois le maximum de 1 et de la valeur absolue de la réponse. Les questions symboliques sont proposées en QCM : il n'y a **pas de moteur d'algèbre symbolique**.

## Vie privée et hors ligne

- Aucun compte nécessaire pour étudier : pas de publicité, télémétrie ou SDK commercial. La clé publique Supabase est embarquée uniquement pour la synchronisation facultative.
- La progression est conservée automatiquement localement (localStorage + IndexedDB) ; en cas de connexion volontaire à un compte, une copie cloud privée peut être synchronisée. La synchronisation effective doit être confirmée par son statut dans l'interface. Sans compte connecté, les données restent seulement sur cet appareil.
- Le service worker précharge l'interface, les 18 cours, le moteur Markdown et le rendu MathML après la première visite HTTPS. Les annexes externes sur GitHub ne sont pas incluses.
- Une corruption ou disparition de la copie localStorage peut être réparée automatiquement depuis IndexedDB, si la seconde copie subsiste. **L'effacement complet des données du site supprime les deux copies** ; la récupération sur un autre appareil n'est pas encore prise en charge.
- Import JSON : version 2, remplacement de la progression existante après confirmation.
- Le parcours Chromium simulant Android et le cache hors ligne ont été vérifiés automatiquement ; un test matériel sur téléphone Android et un audit complet d'accessibilité au clavier restent nécessaires.

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

La version actuelle est : https://daeu-b-maths-dbrckk.onrender.com.

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

Les examens A et B comprennent **8 grilles / 32 étapes**. Le nouvel examen C possède **4 grilles générées / 16 étapes** supplémentaires par sujet : le total est **16 grilles / 64 étapes** réparties entre quatre formats, en ajoutant les 4 grilles et 16 étapes de D. Les cases cochées sont sauvegardées dans chaque copie et dans l'export JSON. Elles **ne modifient pas la note sur 20** : c'est une déclaration personnelle, pas une correction automatique de la rédaction ou un contrôle anti-triche.

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
- La page et les 18 cours principaux sont utilisables hors ligne **après une première visite avec connexion et installation du cache PWA**. Les documents externes complémentaires restent sur GitHub.
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


## Fiabilisation v8 — stockage unifié et onglets concurrents

**Site public v8 :** https://daeu-b-maths-dbrckk.onrender.com

- Le suivi (143 questions/modèles) et toutes les copies des examens A/B/C/D sont écrits dans **une unique clé** locale, sous un document versionné. Une seule écriture remplace le tout : l'import et la remise à zéro sont **atomiques**, sans demi-import.
- Lors de la première utilisation de v8, les anciennes clés de progression et d'examens sont lues automatiquement si aucune sauvegarde unifiée n'existe. Elles ne sont effacées **qu'après** une première écriture unifiée réussie. Les anciens exports JSON restent importables.
- Un import illisible, incompatible ou impossible faute d'espace disponible ne remplace pas les données valides. Ne jamais effacer manuellement le stockage pour « réparer » une importation échouée sans avoir d'abord exporté la progression.
- Si une autre page du **même domaine** modifie la sauvegarde, l'onglet obsolète affiche un avertissement et suspend les saisies jusqu'à rechargement. Les saisies obsolètes ne doivent pas écraser silencieusement les nouvelles données.
- Cette protection ne remplace pas une synchronisation serveur : des écritures exactement simultanées ne peuvent pas être intégralement sérialisées par localStorage. Utiliser **un seul onglet** pendant un examen reste préférable.
- L'export JSON demeure indispensable avant tout changement de domaine, perte d'appareil ou suppression des données du navigateur ; le nouveau format d'export reste **backupVersion:1** pour la compatibilité.
- Le stockage local n'est ni chiffré ni synchronisé entre les appareils. Éviter l'utilisation sur un téléphone partagé.

Tests : [contenu, sauvegardes et mathématiques](https://github.com/dbrckk/Daeu-b/actions/runs/42403528001) ; [parcours Chromium mobile, hors ligne et multi-onglets](https://github.com/dbrckk/Daeu-b/actions/runs/42403528047).

**Adresse stable désormais active :** https://daeu-b-maths-dbrckk.onrender.com. Le site statique Render est relié au dépôt GitHub et conserve ce sous-domaine lors des prochaines mises à jour. L'ancien workflow GitHub Pages demeure une alternative facultative ; **aucune activation manuelle n'est nécessaire** pour utiliser le site Render.


## Adresse permanente, PWA et confidentialité — v9

- URL de référence, à conserver dans les favoris : **https://daeu-b-maths-dbrckk.onrender.com**.
- Toutes les nouvelles versions utilisent ce même domaine ; la progression locale ne change plus d'origine à chaque déploiement.
- **Migration initiale uniquement** : depuis la dernière URL ShipStatic utilisée, télécharger le JSON de progression ; sur le site Render, choisir « Importer une sauvegarde JSON ». Éviter d'utiliser simultanément les anciennes et nouvelles adresses.
- Après une première visite avec Internet, l'application et les exercices préchargés sont utilisables hors ligne. Les liens vers les cours GitHub restent externes et nécessitent Internet.
- Le manifeste PWA utilise maintenant le fichier `manifest.json` pour être correctement interprété par les hébergeurs statiques.
- La page limite l'exécution de scripts au domaine applicatif via une politique CSP et n'emploie aucun script de suivi publicitaire.
- La disponibilité des principales ressources est vérifiée chaque jour par GitHub Actions ; un échec de contrôle ne modifie pas la progression locale.
- Render propose une offre d'hébergement statique gratuite avec des limites mensuelles de bande passante et de minutes de compilation.


## Correctif v10 — navigation et petits écrans

Le simulateur distingue désormais une **ancienne correction consultée** et la **copie active à reprendre**. La navigation de retour préserve les réponses et les paramètres du sujet courant, sans lui substituer l'ancien examen. La correction d'un scénario de test isolant un quota localStorage plein a supprimé une collision artificielle entre les sessions simulées.

Le parcours Chromium couvre 320/360/390/768/1024 pixels, la sauvegarde atomique, l'import/export JSON, les corrections de l'examen C, et le redémarrage hors connexion. Ce contrôle ne remplace pas la manipulation sur un téléphone Android physique.

**Dernier parcours complet validé :** https://github.com/dbrckk/Daeu-b/actions/runs/42416336635


## Examen D — quatre nouvelles familles (v11)

Le sélecteur propose maintenant **D** à côté de A, B et C. Contrairement à une simple variation des coefficients de C, D change les **structures de questions** : une fonction rationnelle et ses asymptotes, un arbre conditionnel avec Bayes, une série statistique et une équation exponentielle démontrée par continuité et monotonie.

Chaque session D comprend 4 exercices, 16 questions, 16 étapes d'auto-évaluation et 20 points objectifs, avec chronomètre de trois heures. Les variantes sont calculées localement à partir d'une graine sauvée ; il n'y a ni réseau nécessaire ni crédit IA. Les corrections ne sont visibles qu'après la remise.

**Compatibilité :** A/B inchangés ; C conserve exactement son générateur et sa notation. L'historique et les exports/imports JSON incluent D. Le diagnostic des notions à revoir dispose de liens vers les chapitres correspondants.

**Preuves :** [45 tests Node.js réussis](https://github.com/dbrckk/Daeu-b/actions/runs/42791013222) et [parcours Chromium mobile réussi, incluant D](https://github.com/dbrckk/Daeu-b/actions/runs/42791013207). La validation sur Android physique reste à faire.


## Version v12 — approfondissements ciblés
- **+16 questions fixes** pour passer de 127 à **143 éléments** suivis. Elles évaluent les quartiles et la variance, les limites par conjugaison et les asymptotes, le TVI/dichotomie et les probabilités totales, Bayes, sans remise et variance binomiale.
- Aucun identifiant historique n'est modifié ; une sauvegarde antérieure conserve ses réponses et ses échéances.
- Les questions et les méthodes avancées sont liées aux cours 07, 08, 11 et 12 ; le score des examens blancs reste distinct.


Les cours 07/08/11/12 sont renforcés par des **ateliers guidés et huit problèmes de transfert corrigés**. Ils complètent la banque interactive de 143 items et les quatre examens blancs A/B/C/D. Les fichiers Markdown sont sur GitHub et exigent un accès Internet ; le cache PWA actuel ne contient que l'application et ses corrections internes.


## Cours v14 : quatorze ateliers approfondis

Les chapitres 01 à 12, 15 et 17 ont chacun un exemple de méthode commenté et deux exercices supplémentaires de transfert, corrigés. Leur structure et les calculs de référence font l'objet du contrôle CI `scripts/verify_worked_cases.py`. Ces cours restent externes à la PWA, qui conserve 143 items et quatre examens blancs sans modification des données locales.


Les quatre derniers modules approfondis en v14 (02, 05, 09 et 17) complètent la séquence de base : **14 ateliers et 28 problèmes de transfert corrigés**. Les exemples sont contrôlés par `scripts/verify_worked_cases.py` et restent consultables sur GitHub avec une connexion ; aucun changement dans la PWA ou les sauvegardes.


## v16 — séance persistante, sans compte ni serveur
La séance active conserve ses IDs, ses graines de variantes, son nombre de réponses terminées et son score dans le document local `daeu-b-data-v1`. La réponse et l'avancement sont écrits ensemble par `commitPractice()`. Une recharge restaure le même exercice et passe directement à la prochaine question si la précédente a déjà été validée. L'export JSON prend en charge cette séance optionnelle. La réinitialisation efface aussi la séance ; la validation des copies A/B/C/D reste inchangée.


## v17 — Bibliothèque locale des 18 cours
Les fichiers `app/cours/*.md` sont des copies des cours `maths/*.md`, vérifiées par la CI. Les bibliothèques libres `app/vendor/` fonctionnent sans réseau ni API. L'affichage passe par un convertisseur Markdown puis une désinfection HTML (DOMPurify) et un moteur MathML natif (Temml). La navigation et les liens « Lire le cours » pointent vers `course.html?course=…`. Mettre à jour les cours en exécutant `python3 scripts/sync_courses.py` après toute modification du dossier `maths/`.


## v19 — navigation pédagogique depuis un cours (10/11/2026)
Les treize chapitres couverts par la banque de 143 questions disposent, dans leur lecteur Markdown, d'un accès **« M'entraîner sur ce chapitre »** qui présélectionne le domaine associé à leur arrivée à l'atelier. L'entraînement ne commence pas automatiquement : une séance éventuellement en cours n'est pas remplacée. Les cinq cours sans domaine dédié (positionnement, trigonométrie, géométrie, complexes, rédaction) renvoient honnêtement vers l'entraînement général. Un second lien ouvre les huit problèmes rédigés. Les liens restent utilisables hors ligne après installation de la PWA.


## v20 — lecture confortable et navigation accessible (11/11/2026)
- **Sommaire interactif** dans les 18 cours, les 8 problèmes et leurs corrections : liens vers chaque titre et sous-titre, utilisables au clavier et hors connexion ; retour au sommaire depuis le bas de page.
- **Trois tailles de texte** (normale, grande, très grande), avec préférence locale `daeu-b-reading-size-v1` commune aux deux lecteurs. L'écriture reste facultative si le stockage est bloqué.
- Aucune modification de la clé transactionnelle `daeu-b-data-v1`, des examens A/B/C/D, de la progression ou des exports JSON.
- Tests Chromium : sommaires et focus des titres, texte agrandi à 320 px, persistance entre écrans et entre chapitres hors ligne.


## v22 — recherche locale dans les 18 cours (11/11/2026)
Panneau de recherche déroulant sans API ni compte : casse et accents ignorés, recherche multi-termes, extraits de contexte et liens locaux vers les cours trouvés. Le corpus est lu à la demande pour préserver les performances. Une fois le cache PWA installé, la recherche fonctionne hors connexion. Aucune requête n'est enregistrée avec les notes et les examens.


### Signets par section — correction d'ergonomie v22
Chaque titre de cours ou de problème possède désormais une commande « Marquer cette section ». Elle évite de remonter aux réglages, ce qui changeait le titre considéré comme la position actuelle. La reprise et l'effacement des signets existants restent compatibles ; les données d'examen ne sont pas modifiées.


## Version v25 — repérage initial et suivi des jalons

Depuis la page d'accueil, « Repérage initial · jusqu’à 10 jalons » choisit une question fixe nouvelle par jalon encore jamais abordé. La série suivante peut couvrir d'autres jalons, jusqu'aux vingt obligatoires. Les réponses utilisent le même système de progression, d'export/import et de reprise hors connexion. La liste par jalon et les recommandations sont recalculées uniquement à partir des réponses réelles. L'outil ne délivre ni note de diagnostic psychométrique ni certificat de maîtrise. Les examens A/B/C/D et la clé `daeu-b-data-v1` sont inchangés.


## v25.2 — Pré-requis et exercices de transfert

Chaque jalon inclut un graphe de prérequis pédagogiques, un bouton pour revoir le premier prérequis à consolider, et un lien **« Transfert rédigé »** vers `./problems.html?set=transferts&jalon=N`. Les 20 sujets et 20 corrections sont séparés, chargés depuis `./transferts/` dans le cache PWA. Aucune réponse rédigée n'est notée artificiellement : la grille « hypothèses et domaine / méthode / calcul / conclusion » se coche mentalement ou sur papier. L'import/export des notes, les examens A/B/C/D et les données locales ne changent pas.


## v25.3 — carnet des raisonnements à J+7 et J+30

Dans le lecteur `problems.html?set=transferts&jalon=18`, la section « Mon carnet de raisonnement » permet d'enregistrer quatre critères auto-déclarés après rédaction et comparaison au corrigé. La première saisie planifie le rappel J+7, puis J+30 à partir du premier essai (avec au moins 24 h entre deux déclarations). Les échéances sont contrôlées par le moteur pur `transfer-progress.mjs`, sauvegardées atomiquement par `persistence.mjs` dans `daeu-b-data-v1` et incluses dans les exports `backupVersion:1` sans rompre la compatibilité avec les exports historiques dépourvus du champ `transfers`. Les dates et critères sont validés à la lecture : un JSON corrompu n'est pas effacé silencieusement.


## v25.4 — série B d'application

Le lecteur accepte `problems.html?set=transferts&variante=b&jalon=18` : vingt nouveaux sujets à trois sous-questions, corrigés séparés et huit ressources de transfert en tout (quatre Markdown source + quatre copies PWA). Le choix de série est conservé quand on affiche les corrigés ou un autre jalon ; les signets A/B sont indépendants. À J+7, l'application propose B par défaut. Le suivi d'auto-évaluation conserve un seul parcours daté par jalon, quelle que soit la situation choisie.


## v25.5 — troisième contexte de transfert et audit numérique

Le paramètre `variante=c` sélectionne la troisième situation pour chacun des vingt jalons, exemple : `./problems.html?set=transferts&variante=c&jalon=18`. Les boutons « Série A / Série B / Série C » conservent le jalon et le mode (sujets/corrigés). À J+30, le tableau de bord propose C automatiquement via `recommendedTransferSeries()`, pure et testée, sans migration des sauvegardes. Les six documents (sujets/corrigés A/B/C) sont contrôlés structurellement et disposent d'une copie PWA. Un oracle Python sans dépendance vérifie les principaux résultats numériques C ; il ne remplace pas la relecture des raisonnements.


## v25.6 — priorisation des rappels de raisonnement

La fonction pure `pendingTransferReviews(store, now)` trie les rappels déjà échus par date et identifiant de jalon. Elle extrait, sans prétendre les vérifier, les quatre critères déclarés non satisfaits lors de la dernière rédaction. Le tableau de bord `#transferDuePanel` affiche les cinq premiers, avec des liens directs B à J+7 et C à J+30. La compatibilité des sauvegardes `daeu-b-data-v1` est intacte. Les tests Node vérifient le tri et les contraintes temporelles ; le smoke Chromium couvre deux rappels simulés via l'API locale, avec liens et priorités.


## v25.7 — aides rédactionnelles pour chaque problème

Dans chaque corrigé A/B/C des 20 jalons, deux paragraphes adaptés (« Justification à expliciter » et « Erreur fréquente à éviter ») accompagnent maintenant les calculs et la grille non notée. Le script `scripts/check_transfers.py` exige exactement une justification et un piège par problème, des explications suffisamment développées, les trois étapes et des copies PWA identiques. Les annotations n'apparaissent jamais dans les sujets. Le scénario Chromium vérifie leur présence en ligne et hors connexion. Aucun changement de schéma des sauvegardes.


## v26 — vérification des champs de l'examen avant remise

Le module pur `exam-readiness.mjs` calcule `inspectExamDraft(exam,session)` sans corriger les réponses, sans exposer les solutions et sans modifier le schéma de sauvegarde. Le composant `#examDraftSummary` suit les saisies en direct et les quatre raccourcis permettent de revoir chaque exercice. La confirmation de remise donne les questions et points non traités, ainsi que le nombre de rédactions présentes. Tests Node sur A/B et plusieurs graines C/D, Chromium Android sur saisie, navigation, reprise et hors connexion.


## v26.1 — cinquième examen E, sans migration des sujets historiques

`exam-applied.mjs` construit de façon déterministe quatre nouveaux exercices (`e-systeme`, `e-trigonometrie`, `e-sans-remise`, `e-racine`) et leurs grilles de raisonnement, 4 × 5 = 20 points. Le moteur `exam-engine.mjs` reconnaît l'ID `blanc-e` et restaure une copie E par sa graine, y compris via export/import historique. Les algorithmes des examens C et D restent strictement inchangés pour préserver les copies existantes. `exam-analytics.mjs` distingue les sujets E par graine et oriente les points perdus vers les nouveaux cours. Tests : 1000 graines E avec validation du barème, 500 recalculs mathématiques indépendants, sauvegarde/reprise/auto-évaluation et Chromium Android avec cache déconnecté.


## v26.2 — profil des cinq examens et audit des compétences

`exam-blueprint.mjs` construit un profil reproductible des examens A/B/C/D/E : quinze ou seize questions, 20 points, quatre exercices, 16 étapes guidées, compétences et cours explicitement visés. Il compare sept graines sur chacun des trois générateurs pour détecter les dérives du gabarit sans altérer leur logique. Le sélecteur d'examen affiche ces informations sans solution et sans classement artificiel de difficulté. Le rapport `AUDIT_EXAMENS.md` et `audits/exam-blueprints.json` sont issus des vraies banques et vérifiés par `scripts/audit-exams.mjs --check`. Les deux cours de base 01/02 n'ont pas de compétences autonomes dans ces examens : lacune de mesure déclarée, non cachée.


## v26.4 — parcours ciblé après une épreuve

Les points perdus aux examens A/B/C/D/E sont regroupés par cours via `SKILL_LESSONS`, puis reliés au **vrai chapitre et au vrai domaine d'exercices**, avec les variantes effectivement présentes dans la banque. Le plan présente l'état séparé de la pratique (questions confirmées, erreurs non confirmées, rappels dus). Quand aucun quiz spécialisé n'existe (par exemple trigonométrie), seul le cours est proposé, sans faux lien. Les URL `?topic=...&mode=due#practice-title` présélectionnent le bon chapitre et les rappels, mais **ne démarrent pas automatiquement** de séance : cela protège une séance éventuellement sauvegardée. Cache PWA versionné, schéma de sauvegarde inchangé.

Les cinq premiers chapitres du plan sont visibles directement ; tous les chapitres supplémentaires restent accessibles dans la section déroulante « autres chapitres » avec leurs liens de cours et leurs éventuels exercices dédiés. Aucun chapitre signalé par le diagnostic n'est volontairement masqué ou inaccessible.


## v29 — cahier sans papier, synchronisé

Le cahier des quiz, examens, cours et problèmes utilise désormais le champ `workbook` du stockage transactionnel. Les calculs peuvent être tapés (avec les symboles mathématiques) ou tracés au doigt/stylet sur une feuille quadrillée, jusqu’à huit pages par activité. Chaque trait peut être annulé, chaque page effacée après confirmation. Le texte et les traits sont inclus dans la sauvegarde automatique locale **et dans la copie cloud lors de la synchronisation d’un compte connecté**. Les anciens brouillons textuels locaux de 6 000 caractères au maximum sont importés sans effacement avant succès. La correction automatique continue de vérifier seulement les réponses structurées, pas le dessin ou la justification manuscrite ; aucune certification de rédaction ne doit être déduite de l’outil. Les exports JSON facultatifs incluent aussi le cahier et les anciennes sauvegardes sans cahier restent compatibles.

## v27.1 — double sauvegarde automatique locale

L'application démarre avec `start.mjs`, qui compare la révision de la progression principale à une copie IndexedDB `daeu-b-auto-backup-v1`, toutes deux soumises à la validation stricte de `persistence.mjs`. La plus récente **valide** est restaurée avant l'initialisation de l'interface. Après chaque validation de question, modification de copie, transfert ou révision, l'écriture locale atomique déclenche une copie asynchrone dans IndexedDB. L'export JSON est conservé dans les options avancées mais n'est plus une étape du fonctionnement quotidien. L'absence d'IndexedDB ne bloque pas l'application. La double copie est propre à l'origine et au navigateur : elle ne protège **ni la perte de l'appareil ni l'effacement complet des données du site** ; un service cloud avec authentification et contrôle d'accès reste nécessaire pour cela.


## v28 — Synchronisation cloud facultative, sans export manuel

Un projet Supabase dédié `daeu-b-progression` héberge les copies sous l'identité de leur propriétaire, avec contrôle d'accès PostgreSQL **RLS** : lecture, insertion et modification réservées à `auth.uid()=user_id`. Le client utilise uniquement la **clé publiable**, jamais une clé secrète. La connexion se fait par e-mail et mot de passe ; lors de la création du compte, l'adresse peut devoir être confirmée par un e-mail Supabase. Après connexion, les sauvegardes locales restent la source de vérité pendant une session hors ligne et sont envoyées automatiquement au service dès que la connexion revient. À la connexion sur un autre appareil vierge, la progression est récupérée depuis le cloud sans fichier JSON. Les écritures cloud sont conditionnelles à un numéro de révision serveur afin qu'aucun appareil obsolète ne puisse écraser silencieusement une copie plus récente. En cas de divergence, deux boutons de résolution explicite apparaissent ; **aucune fusion mathématique fictive** n'est utilisée. La déconnexion conserve les résultats locaux mais désactive la synchronisation sur cet appareil. Le service gratuit peut avoir des quotas et périodes d'indisponibilité ; un échec réseau laisse les deux copies locales intactes.


### Mise en service de la confirmation e-mail

Le projet Supabase gratuit `xxypyvzkciowwseldxhq` utilise initialement le SMTP intégré de Supabase, limité à **deux e-mails par heure** et aux **adresses des membres de l'organisation**. Pour l'utilisateur unique, employer l'adresse e-mail de son compte Supabase. Pour ouvrir la création de comptes à d'autres personnes, configurer un SMTP externe (offre gratuite compatible) et la protection antibot. **URL de confirmation à configurer une fois dans le tableau de bord :** [Authentication → URL Configuration](https://supabase.com/dashboard/project/xxypyvzkciowwseldxhq/auth/url-configuration) ; définir « Site URL » sur `https://daeu-b-maths-dbrckk.onrender.com` et ajouter cette adresse aux « Redirect URLs ». Ce réglage administratif n'est pas accessible via le connecteur Supabase actuel ; à défaut, la confirmation peut renvoyer vers l'URL par défaut, mais la connexion est possible ensuite depuis l'application. Ne jamais exposer de clé `service_role` dans un client public.


## v30 — correction guidée des lignes de calcul (12 novembre 2026)

Dans les cahiers des cours, quiz et problèmes, le bouton **« Vérifier mes étapes »** analyse volontairement une rédaction, ligne par ligne. Il prend en charge les calculs numériques et les équations affines en `x` : additions, soustractions, multiplication, divisions par constantes non nulles, fractions et parenthèses. Les transformations sont comparées par solution exacte avec des fractions rationnelles (`BigInt`) : pas de validation par tolérance flottante. Les lignes non reconnues (fonctions, systèmes, puissances de `x`, racines, calculs manuscrits) restent explicitement non vérifiées. Aucune rédaction n'est automatiquement notée. Pendant une **séance de quiz**, consulter la vérification guidée est une **aide**, enregistrée dans la séance et conservée après fermeture : une réussite assistée ne valide pas la maîtrise. La correction automatique n'est pas activée pendant les examens blancs chronométrés.
