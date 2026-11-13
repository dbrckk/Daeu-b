# DAEU B — Parcours de maîtrise (mathématiques)

**Plan d'évolution actif (v23–v28) : [feuille de route de progression](ROADMAP_V23.md)** · **[Audit v23 de couverture des 20 jalons](AUDIT_COUVERTURE.md)** — audit de couverture, corrections pédagogiques, maîtrise par jalon et examens enrichis.

Formation personnelle **gratuite, ouverte et consultable sur smartphone**. Documents originaux en français, conçus pour maîtriser les mathématiques du **DAEU B** et non uniquement apprendre des formules. Aucun prérequis informatique, compte ni logiciel payant.

> **Important :** ce dépôt prépare aux épreuves, il ne délivre pas le diplôme. Le programme précis et les modalités d'examen dépendent de l'université d'inscription. Le socle est aligné sur les 23 jalons listés dans le syllabus SONATE Côte d'Azur 2026-2027 (dont trois facultatifs) ; les compléments couvrent des programmes d'autres universités.

## Application interactive gratuite

**[Ouvrir l'Atelier de maths — commencer maintenant](https://daeu-b-maths-dbrckk.onrender.com/#commencer)**

- **116 questions fixes + 41 modèles paramétriques (157 emplacements)**, répartis entre 13 domaines couvrant les **20 jalons obligatoires** de SONATE 2026-2027.
- Réponses numériques (fractions ou décimaux) et choix multiples, indices et correction immédiate. Les **41 modèles variables** régénèrent de nouveaux nombres et de nouvelles corrections aux rappels.
- Révisions espacées J+1, J+3, J+7, J+14 et J+30 ; acquisition uniquement après des réponses autonomes sur des jours distincts, **sans indice**, avec énoncés différents pour les exercices variables.
- Suivi et copies enregistrés **dans une même transaction locale** : import et réinitialisation tout-ou-rien, migration des anciennes données, avertissement lorsqu'un autre onglet modifie la progression. Aucun compte ni serveur de données : une seconde copie locale IndexedDB est créée automatiquement, sans export manuel pour l'utilisation courante. La perte de l'appareil ou l'effacement intégral du site nécessitera une sauvegarde cloud qui n'est pas encore activée.
- Site statique gratuit et léger (**sans dépendances à l'exécution**), hébergé sur **Render avec URL permanente**, déploiement automatique depuis `main` et vérification Node.js bloquante avant publication ; le code reste dans [app/](app/).
- **[Cinq examens blancs interactifs](https://daeu-b-maths-dbrckk.onrender.com/#exam-title)** : A et B fixes, **C, D et E générés avec de nouvelles valeurs** à chaque tentative. Chaque sujet contient 4 problèmes indépendants, 3 h, barème indicatif /20 et sauvegarde de la copie. **grilles guidées de 16 étapes par sujet**, auto-évaluation et diagnostic des points perdus.
- [Guide des examens chronométrés, sujets variables et limites de la correction automatique](examens/guide-interactif.md).
- [Notice de fonctionnement et limites](app/README.md).
- [Rapport de stabilisation, tests Chromium mobile et procédure d'installation](RELEASE.md).
- [Contrôle automatique quotidien de disponibilité](.github/workflows/live-health.yml) de l'URL permanente, du manifeste PWA et des ressources principales.
- **Progression :** si tu arrives d'une ancienne adresse ShipStatic, [exporte puis importe ton suivi JSON](app/README.md#changer-dadresse-ou-de-téléphone). Ensuite, toutes les prochaines mises à jour Render conservent **le même domaine** et donc le même stockage local. Les copies d'examen sont incluses.

> La réussite à un QCM n'est pas la preuve d'une maîtrise. Les démonstrations, problèmes et examens sur papier restent indispensables.

## Démarrer ici

**Première séance :** ouvrir [l'application](https://daeu-b-maths-dbrckk.onrender.com/#commencer), appuyer sur **Démarrer mon diagnostic**, répondre à dix questions maximum, puis lire le cours indiqué par le parcours. Pour travailler une démonstration, utiliser le cahier numérique intégré (texte ou écriture au doigt), sans papier. [Instructions pour le premier jour](COMMENCER.md).

1. [Programme vérifié, sources et correspondance avec les universités](PROGRAMME.md)
2. [Test de positionnement avec corrigé](maths/00-positionnement.md) — commencer sans consulter les réponses.
3. [Organisation du parcours, méthode et rythme](PARCOURS.md).
4. [Tableau de suivi de la maîtrise](SUIVI.md).
5. Après le niveau de base, faire les [examens blancs](examens/).

## Cours — ordre recommandé

| Module | Thème | Lien |
|---|---|---|
| 01 | Calcul numérique, fractions, pourcentages, puissances, racines | [Cours](maths/01-calcul-numerique.md) |
| 02 | Calcul littéral, identités remarquables, factorisation | [Cours](maths/02-calcul-litteral.md) |
| 03 | Équations, inéquations, systèmes, tableaux de signes | [Cours](maths/03-equations-inequations-systemes.md) |
| 04 | Polynômes et équations du second degré | [Cours](maths/04-second-degre.md) |
| 05 | Fonctions, domaines, graphiques, compositions | [Cours](maths/05-fonctions.md) |
| 06 | Dérivation, tangentes, variations, convexité | [Cours](maths/06-derivation.md) |
| 07 | Limites et asymptotes | [Cours](maths/07-limites-asymptotes.md) |
| 08 | Continuité, TVI, recherche d'une solution | [Cours](maths/08-continuite-tvi.md) |
| 09 | Exponentielle et logarithme | [Cours](maths/09-exponentielle-logarithme.md) |
| 10 | Suites et récurrence | [Cours](maths/10-suites.md) |
| 11 | Statistiques descriptives et échantillonnage | [Cours](maths/11-statistiques.md) |
| 12 | Probabilités, conditionnement et loi binomiale | [Cours](maths/12-probabilites.md) |
| 13 | Trigonométrie | [Cours](maths/13-trigonometrie.md) |
| 14 | Géométrie analytique, vecteurs, produit scalaire | [Cours](maths/14-geometrie-vectorielle.md) |
| 15 | **Calcul intégral (au programme SONATE 2026-2027)**, primitives et équations différentielles | [Cours](maths/15-primitives-integrales.md) |
| 16 | Nombres complexes et approfondissements locaux | [Cours](maths/16-complexes-complements.md) |
| 17 | Raisonnement, modélisation et méthode d'examen | [Cours](maths/17-raisonnement-modelisation.md) |

## Comment travailler chaque chapitre

- **Comprendre :** lire et refaire à la main tous les exemples détaillés.
- **S'entraîner :** résoudre les exercices sans regarder les corrigés, en rédigeant toutes les étapes.
- **Vérifier :** comparer avec les solutions, identifier précisément l'erreur et refaire l'exercice 48 heures plus tard.
- **Valider :** obtenir au moins 80 % deux fois, dont une fois après sept jours ; ne pas confondre lecture et maîtrise.
- **Examens blancs :** faire un sujet complet, chronométré, sans correction ni aide durant l'épreuve.

## Ressources gratuites

- [GeoGebra](https://www.geogebra.org/graphing) pour vérifier graphiquement, **après** avoir calculé.
- [Khan Academy France](https://fr.khanacademy.org/math) pour pratiquer les prérequis.
- [Syllabus universitaire SONATE 2026-2027](https://univ-cotedazur.fr/medias/fichier/syllabus-daeu-b-sonate-26-27_1776078074188-pdf) — référentiel prioritaire : 23 jalons, examen de 4 exercices.
- [Mathématiques DAEU SONATE](https://daeu-sonate.fr/cours/mathematiques/) — ancienne présentation générique (19 jalons), à comparer au syllabus récent.
- [Programme UGA DAEU B](https://dlst.univ-grenoble-alpes.fr/medias/fichier/daeu-programme-maths_1680268166678-pdf?ID_FICHE=102717&INLINE=FALSE) — compléments possibles.

## Entraînements supplémentaires et examens

- [Série de 24 questions de calcul/algèbre](entrainement/01-algebre-sujet.md) et son [corrigé](entrainement/01-algebre-corrige.md).
- [Série de 24 questions d'analyse/probabilités](entrainement/02-analyse-probas-sujet.md) et son [corrigé](entrainement/02-analyse-probas-corrige.md).
- [Examen blanc 01 — 4 exercices, format SONATE 2026-2027](examens/blanc-01-sujet.md) / [correction](examens/blanc-01-corrige.md).
- [Examen blanc 02 — 4 exercices, format SONATE 2026-2027](examens/blanc-02-sujet.md) / [correction](examens/blanc-02-corrige.md).
- [Examen blanc 03 — compléments universitaires](examens/blanc-03-complements-sujet.md) / [correction](examens/blanc-03-complements-corrige.md).
- [8 problèmes de rédaction progressive — 3 niveaux, 37 questions](problemes/README.md) · [énoncés](problemes/sujets.md) · [corrigés](problemes/corriges.md).
- [Fiche des formules](fiches/formulaire.md) et [25 erreurs fréquentes](fiches/erreurs-frequentes.md).

La structure et les liens internes des cours sont vérifiés automatiquement lors de chaque mise à jour via GitHub Actions, avec `scripts/check_content.py`. Ce contrôle technique **ne garantit pas l'exactitude de chaque corrigé mathématique**, qui doit aussi être relu et confronté à des sujets réels.

## Extension future

Des répertoires `francais/`, `physique/`, `chimie/` pourront être ajoutés sans modifier l'organisation des mathématiques. Ne pas confondre le matériel de préparation de ce dépôt avec les cours officiels d'une université.

Licence : [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) pour les contenus pédagogiques originaux ; les sources externes sont citées et non recopiées.

## Ateliers de consolidation approfondie — v12

Quatorze cours du tronc commun ont été enrichis d'une démarche rédigée pas à pas, de contre-exemples et de deux problèmes de transfert corrigés chacun (**28 problèmes supplémentaires au total**). Ils sont accessibles depuis les cartes de chapitres de l'application ou directement dans le dépôt :

- [Limites, asymptotes et rationalisation](maths/07-limites-asymptotes.md)
- [TVI, unicité et dichotomie](maths/08-continuite-tvi.md)
- [Statistiques : quartiles et variance](maths/11-statistiques.md)
- [Probabilités conditionnelles, Bayes et tirages](maths/12-probabilites.md)
- [Calcul numérique, fractions et évolutions successives](maths/01-calcul-numerique.md)
- [Systèmes, modélisation et inéquations rationnelles](maths/03-equations-inequations-systemes.md)
- [Second degré, formes et optimisation](maths/04-second-degre.md)
- [Dérivation, variations et tangentes](maths/06-derivation.md)
- [Suites, sommes et seuils logarithmiques](maths/10-suites.md)
- [Intégrales signées, aire et compositions](maths/15-primitives-integrales.md)
- [Calcul littéral et restrictions de domaine](maths/02-calcul-litteral.md)
- [Fonctions : domaine, images et antécédents](maths/05-fonctions.md)
- [Logarithmes, équations et croissance exponentielle](maths/09-exponentielle-logarithme.md)
- [Raisonnement, équivalences et rédaction d'examen](maths/17-raisonnement-modelisation.md)

Les 18 cours sont désormais **consultables dans l'application sans connexion** après installation complète de la PWA. Le dépôt GitHub reste la source éditoriale : des copies contrôlées sont mises en cache localement. Les exemples sont recalculés en CI, sans que cela garantisse une relecture universitaire exhaustive.


## v16 — reprise des séances de révision
La séance de dix questions en cours est enregistrée dans la même transaction que les réponses et les copies. Après une fermeture ou un rechargement, l'application reprend à la question non terminée, sans réévaluer les réponses déjà validées. Les exercices à valeurs variables retrouvent exactement leurs nombres et leur énoncé. L'export JSON inclut la séance ; les anciens exports restent acceptés.


## v17 — Bibliothèque complète hors ligne
La [bibliothèque de cours](https://daeu-b-maths-dbrckk.onrender.com/course.html) inclut les 18 chapitres 00–17 : explications, équations, tableaux, exercices et corrigés. Le navigateur télécharge les cours, le moteur Markdown et le rendu MathML lors de la mise en cache de la PWA. Les liens des cartes de chapitre, de l'entraînement et des corrections d'examen ouvrent ce lecteur local, sans CDN. Les fichiers sources restent dans `maths/` et les copies déployées dans `app/cours/` sont comparées octet par octet en CI.


## Parcours d'apprentissage par jalon — v25

L'atelier propose un **repérage initial en séries de dix questions maximum**, une question pour chacun des jalons obligatoires qui n'ont pas encore été abordés. Le suivi de **20 jalons** présente les questions tentées, confirmées, les rappels à effectuer et les erreurs non confirmées. La prochaine étape conseillée privilégie les rappels échus, puis les erreurs, les notions nouvelles et la consolidation. Un bouton lance une séance ciblée sur le jalon choisi et ouvre son cours. Les modèles qui couvrent deux jalons ne deviennent pas deux exercices distincts dans le total global. Les anciennes sauvegardes restent compatibles ; **une réussite isolée ne certifie pas la maîtrise du programme**.


## Pré-requis et problèmes de transfert — v25.2

Chaque jalon indique maintenant des **prérequis conseillés** avec leur statut réel (non abordé, à consolider, erreur ou rappel), un lien vers le cours, les exercices du jalon et **un transfert rédigé distinct**. Le parcours des prérequis est sans cycle, explicite et non bloquant : on peut étudier un jalon même si des bases restent à revoir.

[20 problèmes de transfert et sujets indépendants](transferts/sujets.md) · [20 corrigés et grilles de raisonnement](transferts/corriges.md). Le lecteur mobile propose les mêmes sujets et corrigés dans la PWA hors connexion, **sans révéler la correction avant une action volontaire**. La grille qualitative de quatre critères est auto-évaluée par l'apprenant et **n'entre pas dans la note automatique**. Les anciens historiques, exercices, examens et sauvegardes restent inchangés.


## Carnet des transferts — v25.3

Les **20 problèmes de transfert** disposent maintenant d'un carnet d'auto-évaluation : quatre critères (domaine, méthode, calcul, interprétation), datés lorsqu'on confirme avoir rédigé sa solution puis consulté le corrigé. Les rappels sont programmés **sept puis trente jours après la première rédaction** (et toujours au moins un jour après le rappel précédent). Impossible d'antidater la progression depuis l'interface ou d'enregistrer une révision trop tôt. Les échéances sont visibles dans le tableau de bord. 

Le suivi des transferts est intégré à la même sauvegarde transactionnelle `daeu-b-data-v1` que les questions et les examens : **export, import, reprise et remise à zéro** incluent ces déclarations. Les anciennes sauvegardes sans suivi de transferts restent acceptées, sans altération des résultats antérieurs. Il s'agit **d'auto-évaluations**, pas de notes certifiées ni de correction automatique des démonstrations.


## Deuxième série de transferts — v25.4

La banque comporte maintenant **40 problèmes rédigés et 120 sous-questions**, soit deux situations réellement différentes (A et B) pour chacun des 20 jalons obligatoires. Les [sujets B](transferts/sujets-b.md) et leurs [corrigés B](transferts/corriges-b.md) sont originaux, distincts de la première série et intégrés au lecteur PWA **hors connexion**. Le lien « Essayer la situation B » et le carnet de raisonnement sont disponibles sur chaque fiche. Le suivi J+7 recommande la série B pour réduire la mémorisation du premier énoncé ; les quatre critères restent auto-déclarés, sans note automatique ni certification de réussite.


## Série C et rappels J+30 — v25.5

Les **60 problèmes de transfert rédigés** (trois situations distinctes A, B et C pour chacun des vingt jalons) comptent désormais **180 sous-questions** avec corrigés explicites. La série C est recommandée lors de la révision **J+30** ; A reste le point de départ et B la variante privilégiée à J+7. On peut toujours choisir librement A, B ou C. Les six documents Markdown sources ont des copies embarquées dans la PWA et sont contrôlés en CI, tout comme les contraintes mathématiques des vingt nouveaux transferts.

- [Sujets C](transferts/sujets-c.md) et [corrigés C](transferts/corriges-c.md) accessibles dans le dépôt.
- Trois séries sélectionnables dans le lecteur, sans révélation des corrigés avant une action explicite, avec même carnet de raisonnement daté.
- Les données locales et exports restent compatibles. Ni les cases cochées ni un seul sujet réussi ne valent une certification de maîtrise.


## v25.6 — rappels rédigés directement exploitables

Le tableau de bord affiche désormais jusqu'à cinq rappels rédigés échus, **classés par date d'échéance**, avec le jalon, la série adaptée au rappel (B pour J+7, C pour J+30) et les critères jugés insuffisants **dans la dernière auto-évaluation**. Les liens ouvrent immédiatement le bon problème sur Android, sans modifier l'historique ni créer de prétendue note. Le compteur global indique les autres rappels éventuels, accessibles depuis la liste des jalons.

Les **40 problèmes A/B** sont désormais contrôlés par des oracles arithmétiques indépendants, en plus des 20 oracles C, des tests de progression, de la cohérence des six documents et des contrôles du cache. Un résultat numérique correct ne dispense pas de relire les raisonnements, domaines et formulations.


## v25.7 — corriger la méthode, pas seulement le résultat

Les **60 corrigés des problèmes de transfert** comprennent désormais chacun deux rubriques distinctes : « Justification à expliciter » et « Erreur fréquente à éviter ». Les indications sont spécifiques à la situation, par exemple : domaine avant résolution, inversion de signe, conditions du TVI, rôle de la dérivée, risque de confondre conditionnelles, ou unité d'une intégrale. Les sujets restent séparés et ne révèlent aucune de ces aides avant la consultation volontaire du corrigé. Le contrôle des contenus refuse tout corrigé privé de sa méthode ou de sa mise en garde. Les six fichiers sources et leurs copies mobiles hors connexion sont synchronisés.


## Examens blancs v26 — contrôle de copie sans corrigé anticipé

La préparation des épreuves A/B/C/D intègre désormais un **tableau de complétude en temps réel** : questions avec saisie non vide (mais non encore corrigées), questions restantes et points qu'elles représentent, exercices possédant une rédaction personnelle. Quatre raccourcis facilitent la vérification de chaque exercice avant remise. La confirmation de rendu résume la copie sans révéler les solutions. Le minuteur de trois heures, le barème indicatif /20, les sauvegardes et la reprise hors connexion sont inchangés. Une réponse présente n'est ni une réponse correcte ni une démonstration maîtrisée.


## Examen E — familles complémentaires de mathématiques (v26.1)

Un cinquième examen blanc a été ajouté : **E**, à quatre exercices de cinq points, trois heures et seize questions, avec de **nouveaux modèles d'énoncés**, distincts des exercices C et D. Il traite les systèmes de tarifs, la trigonométrie du triangle rectangle, les probabilités **sans remise** et les domaines de fonctions avec racine carrée. Chaque sujet E est généré à partir d'une graine uint32, conserve exactement ses valeurs et ses corrigés après fermeture ou import, et dispose de seize étapes guidées de raisonnement déclaratif après remise. Les anciens générateurs C/D et leurs copies ne sont pas modifiés. Le cache PWA comprend le nouveau moteur E. La réponse automatique sur 20 demeure **indicative** : elle ne note pas les preuves et justifications rédigées.


## v26.2 — transparence sur la composition des examens

Un audit reproductible compare les cinq sujets A/B/C/D/E : questions numériques ou à choix, barème par exercice, compétences étiquetées et étapes de rédaction. Sur les **13 chapitres principaux sélectionnés dans la bibliothèque**, **11 sont explicitement étiquetés** dans au moins un examen. Le calcul numérique et le calcul littéral ne sont pas encore évalués comme compétences autonomes dans les cinq épreuves ; ils interviennent toutefois transversalement. Le rapport ne prétend pas mesurer la difficulté réelle ni une équivalence officielle.

- [Audit des examens](AUDIT_EXAMENS.md) et [données des cinq gabarits](audits/exam-blueprints.json).
- Dans l'application, la composition du sujet sélectionné est consultable avant de lancer le chronomètre ; ni réponses ni corrections ne sont exposées.
- Vérification locale et CI : `node scripts/audit-exams.mjs --check`, puis tests Node et Chromium Android.


## Prochain examen conseillé (v26.3)

La page des examens propose un **sujet conseillé** à partir des 12 dernières copies : priorité aux familles jamais essayées, puis aux compétences où des points objectifs ont été perdus, en pénalisant la répétition du dernier sujet. Le choix reste manuel et les copies existantes sont conservées. Ce conseil n'est **pas une mesure de difficulté ni une estimation de réussite au DAEU B** ; les raisonnements rédigés ne sont pas évalués automatiquement.


**Synchronisation cloud (v28) :** depuis l'application, connecter une adresse e-mail et un mot de passe à l'espace Supabase privé. Les résultats sont envoyés automatiquement après chaque modification et retrouvés sur un autre appareil avec la même connexion. La sauvegarde locale reste utilisable sans réseau ; en cas de conflit, une résolution explicite est demandée. Aucun export quotidien n'est nécessaire.


**Confirmation du compte :** le service e-mail intégré gratuit de Supabase n'envoie actuellement qu'aux adresses des membres de l'organisation Supabase. Utiliser celle de ton compte Supabase ; un SMTP externe est nécessaire pour d'autres adresses. Voir [le réglage de confirmation](app/README.md#mise-en-service-de-la-confirmation-e-mail).
