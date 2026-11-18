# Reconnaissance manuscrite des mathématiques

Le cahier DAEU B conserve les coordonnées des traits. La reconnaissance fournit une proposition que l’élève confirme avant correction. Cette séparation permet de comparer plusieurs lecteurs avec les mêmes copies et le même correcteur.

| Ressource | Usage pour le DAEU B |
| --- | --- |
| [Google MathWriting](https://github.com/google-research/google-research/tree/master/mathwriting) | Évaluer des traits tracés par de vraies personnes. Données CC BY-NC-SA 4.0, distinctes du code Apache-2.0. |
| [ink-on](https://github.com/kimseungdae/ink-on) et [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/deploy.html) | Comparer un lecteur de formules entières dans le navigateur. ink-on accepte des coordonnées, puis rasterise les traits et exécute CoMER dans un worker. Le dépôt annonce 7,2 Mo de poids INT8 hors runtime. |
| [Seshat](https://github.com/falvaro/seshat) | Comparateur sur les traits vectoriels, en C++ sous GPLv3. Il prend des fichiers de traits et produit notamment du LaTeX. |
| [MyScript](https://developer.myscript.com/pricing/) | Offre Web avec reconnaissance cloud. Le palier gratuit est destiné aux essais et le déploiement nécessite de contacter l’éditeur. |
| [PP-FormulaNet-S](https://huggingface.co/PaddlePaddle/PP-FormulaNet-S/tree/main) | Comparateur d’OCR sur image. Les poids officiels Apache-2.0 pèsent 232 Mo dans le dépôt Hugging Face, ce qui rend leur intégration directe peu adaptée au mobile. |

Le candidat Web à mesurer en priorité est ink-on. Son benchmark publié annonce 36,41 % de formules exactes sur CROHME 2014 pour la version INT8. Ce résultat représente un corpus différent des exercices DAEU B. Le code d’ink-on est sous Apache-2.0. Les conditions de redistribution des poids CoMER d’origine restent à confirmer auprès de l’amont avant inclusion dans la PWA.

## Mesure locale reproductible

Depuis la racine du dépôt, avec Python et Node installés :

```sh
curl -fL https://storage.googleapis.com/mathwriting_data/mathwriting-2024-excerpt.tgz -o /tmp/mathwriting-2024-excerpt.tgz
python3 scripts/benchmark-ink.py /tmp/mathwriting-2024-excerpt.tgz --details
```

Le script lit directement l’archive locale. Il compare le texte proposé à la référence MathWriting et distingue lectures exactes, erreurs et abstentions. Il compte les expressions du lot de test contenant une égalité compatible et les chiffres isolés du lot de symboles. Les symboles isolés sont issus du lot d’entraînement de MathWriting. Les données ne sont pas ajoutées au dépôt.

L’extrait officiel contient 100 expressions de test et 100 symboles. Après filtrage, il ne reste que quatre chiffres isolés et aucune égalité compatible. Sur ces quatre chiffres, la v90 a produit une erreur et trois abstentions. La v91 produit quatre abstentions. Cet extrait est utile pour vérifier le script, mais trop petit pour mesurer la précision. Pour comparer un moteur de formules entières, utiliser un lot d’égalités et fractions manuscrites suffisamment représentatif, mesurer les erreurs et abstentions séparément, puis contrôler la latence et le mode hors connexion sur Android.

## Comparaison avec ink-on

Essai sur les mêmes traits normalisés pour chaque moteur. Le lot réel sélectionne 24 égalités ou fractions courtes dans les 100 expressions de test de l’extrait MathWriting. Ces expressions débordent du périmètre du lecteur DAEU B v91. Le lot synthétique couvre six cas déjà pris en charge, dont deux fractions posées. La comparaison ignore certains écarts de notation LaTeX (espaces, accolades simples, fractions numériques), sans appliquer d’équivalence algébrique.

| Lot | DAEU B exact / erreur / abstention | ink-on exact / erreur / abstention | Médiane DAEU B / ink-on |
| --- | --- | --- | --- |
| 20 expressions MathWriting sans fraction posée | 0 / 0 / 20 | 4 / 16 / 0 | 1,8 ms / 1 126 ms |
| 4 expressions MathWriting avec fraction posée | 0 / 0 / 4 | 1 / 3 / 0 | 2,6 ms / 1 148 ms |
| 6 cas synthétiques DAEU B | 6 / 0 / 0 | 4 / 2 / 0 | 2,4 ms / 547 ms |

Mesuré avec Node 24 sur un CPU AMD EPYC x86_64, avec ONNX Runtime Web 1.24.2 (WASM, un thread), rendu Canvas natif et faisceau de largeur 3. Initialisation du modèle depuis le disque : 805 ms, exclue des médianes. La latence Android reste à mesurer. Le lot réel mesure la couverture hors du périmètre v91. Le lot synthétique vérifie la compatibilité avec des cas existants et ne permet pas d’estimer la précision sur des écritures naturelles.

Sur les six cas DAEU B, ink-on lit les deux fractions et les deux réponses isolées. Il perd le 7 de l’égalité `2x+5=17` et remplace la parenthèse de `2(x+1)=8` par un signe de multiplication. Le lecteur actuel reste le choix pour la validation. Un moteur de formules entières pourrait proposer une seconde lecture quand le lecteur s’abstient, après validation sur un lot représentatif des exercices et des écritures des utilisateurs.

### Reproduire la comparaison locale

Utiliser une copie de travail distincte d’ink-on et Node 24. Les poids et dépendances restent dans cette copie.

```sh
git clone https://github.com/kimseungdae/ink-on.git /tmp/ink-on
git -C /tmp/ink-on checkout 2585994ee11fe2ed98065c555c4aae8ee9096209
(cd /tmp/ink-on && npm ci && npm run build:lib && npm install --no-save @napi-rs/canvas@1.1.1)
python3 scripts/benchmark-ink.py /tmp/mathwriting-2024-excerpt.tgz --export-comparison >/tmp/daeu-ink-cases.json
node scripts/compare-ink-on.mjs /tmp/ink-on /tmp/daeu-ink-cases.json audits/ink-cases.json
```

## Seconde lecture sur des écritures proches du DAEU B

Le lot cible provient du test annoté [CROHME 2014](https://www.isical.ac.in/~crohme/data2.html). Il contient toutes les égalités et fractions numériques isolées retenues par le filtre décrit dans `scripts/export-crohme-ink.py`. Il s’agit d’écritures humaines sur des expressions proches du programme, collectées hors du DAEU B. Le modèle ink-on a déjà été évalué sur CROHME 2014, ce qui limite la portée de cette comparaison. Le filtre accepte les carrés, mais le lot retenu ne contient aucune égalité avec un carré.

Chaque moteur reçoit les mêmes traits. Une fraction isolée est lue avec le lecteur de fractions posées du DAEU B. La simulation conserve la lecture locale lorsqu’elle existe. Lors d’une abstention, elle propose le résultat ink-on uniquement si la transcription correspond à la forme attendue. Ce contrôle de forme ne vérifie pas l’exactitude de la transcription.

| Lot | DAEU B exact / erreur / abstention | ink-on exact / erreur / abstention | Seconde lecture simulée exact / erreur / abstention | Médiane ink-on |
| --- | --- | --- | --- | --- |
| 7 égalités sans fraction posée | 0 / 0 / 7 | 6 / 1 / 0 | 6 / 1 / 0 | 1 201 ms |
| 6 égalités avec fractions posées | 0 / 0 / 6 | 5 / 1 / 0 | 5 / 0 / 1 | 1 271 ms |
| 9 fractions isolées | 0 / 2 / 7 | 5 / 4 / 0 | 4 / 3 / 2 | 277 ms |
| Total | 0 / 2 / 20 | 16 / 6 / 0 | 15 / 4 / 3 | |

Sur les 20 abstentions du lecteur local, la seconde lecture récupère 15 transcriptions exactes et ajoute deux erreurs. Le modèle ajoute notamment un terme à `4x=x+x+x+x` et transforme le dénominateur `38973` en `38897373`. Les deux erreurs du lecteur local restent visibles dans la colonne de simulation, puisque la seconde lecture ne se déclenche qu’après abstention.

La mesure utilise le même environnement WASM/CPU à un thread que le premier essai. Elle ne couvre pas la latence Android. Ces résultats justifient de poursuivre l’essai comme seconde lecture à confirmer, en priorité sur les fractions simples, avant toute intégration publique.

### Reproduire le lot ciblé

Après l’installation locale d’ink-on décrite plus haut :

```sh
curl -fL https://www.cs.rit.edu/~crohme2019/downloads/Task1_and_Task2.zip -o /tmp/crohme-package.zip
unzip -p /tmp/crohme-package.zip 'Task1_and_Task2/Task1_and_Task2/Task1_onlineRec/MainTask_formula/valid.zip' > /tmp/crohme-formulas.zip
python3 scripts/export-crohme-ink.py /tmp/crohme-formulas.zip > /tmp/daeu-crohme-cases.json
node scripts/compare-ink-on.mjs /tmp/ink-on /tmp/daeu-crohme-cases.json
```

## Peut-on réutiliser un moteur existant ?

Mesure avec le lecteur DAEU B v103. Chaque moteur reçoit les mêmes coordonnées, ramenées à 70 unités de haut au maximum. Le comparateur juge la transcription, espaces et variantes simples de notation LaTeX ignorés. Il n’accepte pas d’égalité différente au seul motif qu’elle donne la même solution. Les lots CROHME réutilisent les sélections 2012, 2013 et 2014. Le lot de contrôle ajoute 38 expressions du test CROHME 2019. Le lot MathWriting contient les 24 écritures humaines déjà extraites. Les six tracés de test du DAEU B sont synthétiques.

| Lot | DAEU B v103 exact / erreur / abstention | ink-on | Seshat | MathNote OCR |
| --- | --- | --- | --- | --- |
| 44 fractions et égalités CROHME | 4 / 0 / 40 | 37 / 7 / 0 | 16 / 27 / 1 | 4 / 40 / 0 |
| 38 fractions et égalités CROHME 2019 | 2 / 0 / 36 | 33 / 5 / 0 | 20 / 16 / 2 | 7 / 31 / 0 |
| 24 expressions MathWriting | 0 / 0 / 24 | 5 / 19 / 0 | 0 / 23 / 1 | 0 / 24 / 0 |
| 6 tracés synthétiques DAEU B | 6 / 0 / 0 | 4 / 2 / 0 | 0 / 6 / 0 | 0 / 6 / 0 |

- **ink-on** est le moteur Web testé qui lit le plus de formules entières. Sur les 44 cas CROHME, garder la lecture locale et essayer ink-on seulement en cas d’abstention donne 38 lectures exactes, deux erreurs et quatre abstentions après filtrage de la forme. Le filtre laisse passer un dénominateur altéré et une égalité avec un terme ajouté. Le dépôt d’ink-on indique une licence Apache-2.0 et l’amont CoMER ne publie pas de licence pour les poids dans son dépôt. Les conditions de redistribution des poids restent à vérifier avant de les livrer dans la PWA. [ink-on](https://github.com/kimseungdae/ink-on) · [CoMER](https://github.com/Green-Wood/CoMER)
- **Seshat** est un exécutable C++ sous GPLv3. Dans la même simulation, la seconde lecture filtrée donne 18 lectures exactes, zéro erreur et 26 abstentions sur les 44 cas CROHME. Elle ajoute huit lectures de fractions isolées, quatre d’égalités et deux d’égalités contenant une fraction. Le moteur brut a produit 27 erreurs sur ce lot. Il a dépassé huit secondes sur un tracé CROHME et un tracé MathWriting. L’essai Linux utilise le lecteur SCG_INK avec des adaptations de compilation C++ et Boost, sans charger le lecteur XML. [Seshat](https://github.com/falvaro/seshat)
- **MathNote OCR 0.2.1** fonctionne en Python avec ses poids fournis. Remonter l’échelle à 220 unités donne les mêmes nombres de lectures exactes pour chaque lot. Sur les sept transcriptions d’une confiance annoncée d’au moins 0,80 à l’échelle de référence, quatre sont erronées. [MathNote OCR](https://github.com/YonatanNemtsov/mathnote-ocr)

**Seconde lecture sur le lot séparé.** Sur CROHME 2019, ink-on après filtrage ajoute 31 lectures exactes et une erreur. Seshat ajoute 18 lectures exactes et deux erreurs, toutes deux liées à un signe de multiplication lu comme la lettre `x`. Sur les 48 fractions numériques isolées des deux séries CROHME, la seconde lecture Seshat seule après filtrage donne 27 lectures exactes contre 6 avec la v103, avec 21 abstentions et zéro erreur observée.

Une simulation conserve la lecture locale et propose une seconde transcription quand ink-on et Seshat s’accordent après normalisation, puis que la forme correspond au type de réponse. Elle donne 17 lectures exactes, zéro erreur et 27 abstentions sur les 44 premiers cas, et 18 lectures exactes, zéro erreur et 20 abstentions sur les 38 cas de 2019. Les réponses restent à confirmer sur la feuille. Cette mesure porte sur un échantillon de fractions et d’égalités courtes. [Corpus CROHME](https://www.cs.rit.edu/~dprl/software.html) · [Références du test 2019](https://zenodo.org/records/17122781)

Les trois moteurs lisent `4` sur le symbole auquel la v103 attribue `9`. Le build d’ink-on a aussi lu `4/3` au doigt en ligne, puis `0,9−0,9=0` et ce `4` après coupure du réseau dans Chromium à 390 px. La tentative de rechargement complet de la page hors ligne a échoué. Ce test émule le toucher et laisse la latence et la compatibilité d’un téléphone Android physique à mesurer. [Démo publique ink-on](https://ink-on.vercel.app/)

**Solutions commerciales.** MyScript Math fournit un cahier Android avec saisie manuscrite et sortie LaTeX. L’application prévoit un essai puis des offres payantes. Le palier développeur Web est réservé aux tests et le déploiement demande un contrat. Mathpix facture l’activation de sa première clé API et la reconnaissance par appel ou session. [MyScript Math](https://help.myscript.com/math/overview/getting-started/) · [MyScript développeurs](https://developer.myscript.com/pricing/) · [Mathpix](https://mathpix.com/ocr)

**Décision.** Garder le cahier, la correction et la progression DAEU B. Étudier la réutilisation d’un moteur existant comme seconde lecture à confirmer sur des réponses courtes. Commencer par évaluer le portage Web de Seshat pour les fractions numériques isolées et vérifier la reprise hors ligne. Pour élargir la lecture aux égalités, le test d’accord des deux moteurs dépend aussi de la clarification des droits sur les poids CoMER. La v103 reste le lecteur public après cette évaluation.

## Lecteur local v94

Le même lot CROHME a été rejoué sur les versions v93 et v94. Les trois transcriptions corrigées concernent des fractions isolées. `4/3` était illisible, `1/8` était proposée comme `1/1` et `3/8` comme `3/5`.

| Lot | v93 exact / erreur / abstention | v94 exact / erreur / abstention |
| --- | --- | --- |
| 9 fractions isolées CROHME | 0 / 2 / 7 | 3 / 0 / 6 |
| 13 égalités CROHME | 0 / 0 / 13 | 0 / 0 / 13 |
| 24 expressions de l’extrait MathWriting | 0 / 0 / 24 | 0 / 0 / 24 |

Les 22 tracés CROHME avaient servi à orienter la correction. Ces résultats décrivent les cas rejoués. Une mesure sur des tracés indépendants reste nécessaire pour estimer le gain sur d’autres écritures.

## Lecteur local v95

L’analyse des groupes de traits annotés a montré que des barres courtes ou irrégulières du signe `=` empêchaient la transcription, notamment pour `200−200=0`. Le lecteur tolère une légère inclinaison et un petit retour du stylo lorsque les deux barres restent séparées et se superposent horizontalement. Pour les fractions, l’écart minimal à la barre passe de deux à une unité sur la feuille de 900 × 1 200. Les traits qui touchent la barre restent exclus par ce lecteur.

| Lot | v94 exact / erreur / abstention | v95 exact / erreur / abstention |
| --- | --- | --- |
| CROHME 2019, 38 tracés indépendants du réglage | 0 / 0 / 38 | 1 / 0 / 37 |
| CROHME 2012 et 2013, 22 tracés retenus | 0 / 1 / 21 | 0 / 1 / 21 |
| CROHME 2014, 22 tracés du lot v94 | 3 / 0 / 19 | 3 / 0 / 19 |
| `Train_2014`, 122 tracés du lot de mise au point | 1 / 0 / 121 | 6 / 0 / 116 |
| MathWriting, 24 tracés de l’extrait déjà mesuré | 0 / 0 / 24 | 0 / 0 / 24 |

La nouvelle lecture exacte du lot 2019 est `777/400`. Elle était bloquée par l’écart d’une unité entre le numérateur et la barre. Aucune des 15 égalités de ce lot n’a été transcrite entièrement. Sur les éditions 2012 et 2013, l’erreur `7/5` lu `4/5` reste à traiter. Ces échantillons ne représentent pas la variété de l’écriture d’un utilisateur sur Android.

### Rejouer la mesure sans modèle externe

Extraire `Test.zip` du dossier `Task1_onlineRec/MainTask_formula` dans l’archive CROHME 2019 et récupérer le fichier `CROHME2019st.json`. Les références sont associées aux tracés par nom de fichier. Le filtre retient les fractions entières posées et les égalités compatibles avec son alphabet, jusqu’à 45 caractères de notation normalisée pour ce lot. Le comparateur ramène chaque expression à 70 unités de haut au maximum, en préservant les proportions. Les tracés et labels restent hors du dépôt. [Archives CROHME du RIT](https://www.cs.rit.edu/~dprl/software.html) · [Références CROHME 2019](https://zenodo.org/records/17122781)

```sh
python3 scripts/export-crohme-ink.py /tmp/Test.zip --split Test2019_GT \
  --labels /tmp/CROHME2019st.json > /tmp/daeu-crohme-2019.json
node scripts/compare-ink-on.mjs --local /tmp/daeu-crohme-2019.json
```

Pour le lot de mise au point et les éditions 2012 et 2013, utiliser le fichier `Train.zip` du dossier `Task1_onlineRec/MainTask_formula` et les valeurs `Train_2014`, `TestINKMLGT_2012` et `TestINKMLGT_2013` pour `--split`. Pour mesurer la v94 avec les mêmes paramètres, exécuter le comparateur v95 dans une copie de travail de la v94.

## Lecteur local v96

La v95 comparait le contour du `7` barré presque vertical aux gabarits. La barre médiane et la hampe droite rapprochaient ce tracé du `4`. La v96 vérifie la présence d’une tête horizontale suivie d’une hampe presque verticale et exige que la barre traverse cette hampe. Les autres formes continuent à passer par les gabarits existants.

| Lot | v95 exact / erreur / abstention | v96 exact / erreur / abstention |
| --- | --- | --- |
| 60 chiffres `7` à deux traits, CROHME 2014 | 8 / 9 / 43 | 23 / 7 / 30 |
| 9 chiffres `7` à deux traits, CROHME 2013 | 1 / 1 / 7 | 2 / 1 / 6 |
| 191 chiffres `4` à deux traits, CROHME 2013 et 2014 | 20 / 55 / 116 | 20 / 55 / 116 |
| 228 expressions des lots précédents | 10 / 1 / 217 | 12 / 0 / 216 |

Les 1 789 autres symboles annotés des lots 2013 et 2014 ont tous conservé leur résultat de lecture. Deux fractions changent dans le lot d’expressions. Le cas de mise au point `7/5` était lu `4/5`. Le cas indépendant `4/7` de CROHME 2019 était illisible. Les tests isolent le chiffre grâce à la segmentation fournie par CROHME. La lecture d’une copie entière dépend aussi de la séparation des symboles par le moteur.

```sh
python3 scripts/export-crohme-ink.py /tmp/crohme-formulas.zip --symbols > /tmp/daeu-symboles-2014.json
python3 scripts/export-crohme-ink.py /tmp/Train.zip --split TestINKMLGT_2013 --symbols > /tmp/daeu-symboles-2013.json
node scripts/compare-ink-on.mjs --local /tmp/daeu-symboles-2014.json /tmp/daeu-symboles-2013.json
```

## Lecteur local v97

Un `4` écrivant séparément la hampe peut présenter un contour proche du `9` pour le comparateur de gabarits. Le lecteur recherche désormais deux traits précis. Le trait coudé commence à gauche de la hampe, descend vers un coude puis rejoint la hampe par une barre voisine de l’horizontale. La hampe est presque droite et se prolonge sous la barre. L’écart au départ sert à écarter la boucle d’un `9` repartant de la hampe.

Le lot de mise au point `Train_2014` a servi à vérifier le critère de départ à gauche sur deux vrais `9` que la première règle lisait comme des `4`. Les deux lots de test gardent la préparation v96, à 70 unités de haut pour chaque symbole. Le nombre d’abstentions correspond aux cas où le lecteur ne propose aucun chiffre.

| Tracés de `4` à deux traits | v96 exact / erreur / abstention | v97 exact / erreur / abstention | Confusions `4` → `9` v96 → v97 |
| --- | --- | --- | --- |
| CROHME 2013, 56 symboles | 4 / 19 / 33 | 26 / 9 / 21 | 15 → 5 |
| CROHME 2014, 135 symboles | 16 / 36 / 83 | 43 / 22 / 70 | 27 → 13 |

Les 1 667 autres symboles des deux lots de test conservent leur résultat, dont les `9`. La mesure rejoue les tracés déjà segmentés. Le parcours Chromium vérifie séparément la lecture de `4/5` écrite dans le cahier.

## Lecteur local v98

Sur certains `4` à deux traits, la barre monte ou descend et la hampe est inclinée. Le filtre v97 exigeait une barre presque horizontale et une hampe presque verticale. La v98 vérifie la forme du coude et la trajectoire de la barre pour ces écritures lorsque la lecture par gabarit hésite ou propose `9`. Si les deux traits commencent près l’un de l’autre, la barre doit dépasser nettement à droite de la hampe et le premier segment rester rectiligne. Ces conditions écartent des `9` dont la boucle revient près de la hampe.

| Lot à 70 unités | v97 exact / erreur / abstention | v98 exact / erreur / abstention |
| --- | --- | --- |
| 191 chiffres `4` à deux traits, CROHME 2013 et 2014 | 69 / 31 / 91 | 96 / 26 / 69 |
| 166 expressions des lots CROHME 2012, 2013, 2014 et `Train_2014` | 10 / 0 / 156 | 10 / 0 / 156 |

Le comparateur des symboles relève 5 corrections de la confusion `4` → `9` et 22 nouvelles lectures de `4`. Les 1 667 autres symboles conservent leur résultat sur ces lots. La mesure porte sur des chiffres déjà segmentés. Le parcours Chromium mobile à 320 px complète la mesure sur un exercice de probabilités entier. L’élève écrit `4/5` sans clavier, confirme la lecture, obtient un point et rouvre la séance hors connexion avec sa copie.

## Lecteur local v99

Quand le `4` se ferme au sommet, sa barre peut finir sur la hampe. La v98 demandait qu’elle dépasse nettement pour retenir cette forme. La v99 mesure l’écart de la diagonale au segment qui relie le sommet au coude. Elle exige une barre qui rejoint la hampe et s’écarte peu de son propre segment. La règle s’applique aux propositions `9` ou incertaines.

| Lot à 70 unités | v98 exact / erreur / abstention | v99 exact / erreur / abstention |
| --- | --- | --- |
| 191 chiffres `4` à deux traits, CROHME 2013 et 2014 | 96 / 26 / 69 | 105 / 23 / 63 |
| 166 expressions des lots CROHME 2012, 2013, 2014 et `Train_2014` | 10 / 0 / 156 | 10 / 0 / 156 |

Trois `4` lus comme des `9` et six tracés auparavant sans proposition sont désormais lus correctement. Les 1 667 autres symboles de test conservent leur résultat à 25, 45, 70 et 105 unités. Le parcours Chromium à 320 px reproduit le même geste en v98 et en v99. En v99, le lecteur propose `4/5` et le quiz n’attribue le point qu’après confirmation. La copie et la séance sont restaurées après fermeture et réouverture hors connexion.

## Lecteur local v100

Une barre ascendante peut se terminer près du sommet du `4`. La position haute de son extrémité et son dépassement à droite pouvaient faire rejeter ces tracés par les filtres de la v99. La v100 exige que la barre remonte à partir d’un coude situé à gauche de la hampe puis dépasse nettement à droite. Le contrôle des deux segments autour du coude est commun aux `4` fermés et aux `4` à barre montante. La règle intervient après une proposition `9` ou incertaine.

| Lot à 70 unités | v99 exact / erreur / abstention | v100 exact / erreur / abstention |
| --- | --- | --- |
| 191 chiffres `4` à deux traits, CROHME 2013 et 2014 | 105 / 23 / 63 | 108 / 21 / 62 |
| 166 expressions des lots CROHME 2012, 2013, 2014 et `Train_2014` | 10 / 0 / 156 | 10 / 0 / 156 |

Les mêmes trois tracés progressent à 25, 45, 70 et 105 unités. Deux étaient lus `9` et le troisième faisait l’objet d’une abstention. Les autres tracés de test conservent leur lecture aux quatre tailles. L’essai tactile à 320 px reproduit la lecture `9/5` en v99. En v100, le lecteur propose `4/5`, le quiz attribue un seul point après confirmation et la réouverture hors connexion restaure la copie, le score et la tentative.

## Lecteur local v101

Une barre courte peut s’arrêter avant la hampe. Le lecteur vérifie que le premier trait garde un coude, que son extrémité revient près du milieu et que la hampe descend plus bas. Si un petit espace sépare les deux boîtes de tracé, le regroupement applique ces mêmes critères après avoir vérifié que le trait coudé est plus court que la hampe.

| Lot à 70 unités | v100 exact / erreur / abstention | v101 exact / erreur / abstention |
| --- | --- | --- |
| 191 chiffres `4` à deux traits, CROHME 2013 et 2014 | 108 / 21 / 62 | 112 / 19 / 60 |
| 166 expressions des lots CROHME 2012, 2013, 2014 et `Train_2014` | 10 / 0 / 156 | 10 / 0 / 156 |

Deux `4` auparavant lus `9` et deux abstentions supplémentaires sont correctement lus à 70 unités. Aux quatre tailles testées, 25, 45, 70 et 105 unités, seules des lectures de `4` sont modifiées et elles deviennent exactes. À 320 px dans Chromium, le même tracé de `4/5` avec un espace entre les deux traits du `4` ouvre la comparaison au corrigé en v100 et reçoit une proposition en v101. La confirmation attribue un point. Après fermeture et réouverture hors connexion, la copie, le score et la tentative sont restaurés.

## Lecteur local v102

Lorsque le premier trait d’un `4` ouvert descend vers la droite, son coude se trouve à droite de son point de départ. La v102 accepte ce mouvement si le coude reste à gauche de la hampe et que la barre traverse celle-ci en se prolongeant à droite. Le contrôle vérifie aussi que les deux segments restent assez droits autour du coude.

| Lot à 70 unités | v101 exact / erreur / abstention | v102 exact / erreur / abstention |
| --- | --- | --- |
| 191 chiffres `4` à deux traits, CROHME 2013 et 2014 | 112 / 19 / 60 | 116 / 17 / 58 |
| 166 expressions des lots CROHME 2012, 2013, 2014 et `Train_2014` | 10 / 0 / 156 | 10 / 0 / 156 |

À 70 unités, deux `4` lus `9` et deux tracés sans proposition sont correctement reconnus. À 25, 45, 70 et 105 unités, seuls des tracés de `4` sont modifiés et ils deviennent exacts. Le parcours Chromium mobile à 320 px reproduit le geste qui donnait `9/5` en v101. En v102, le quiz propose `4/5`, attend la confirmation avant d’accorder le point et restaure la copie, le score et la tentative à la réouverture hors connexion.

## Lecteur local v103

La règle du `4` ouvert peut accepter une courte descente quand elle commence bas, reste presque verticale et précède une barre assez longue pour dépasser la hampe. La barre doit se terminer plus bas que le début de la descente, ce qui écarte des signes `+` fortement inclinés repérés pendant les mesures. Si la descente est plus longue, un léger retour en arrière de la barre est toléré quand son extrémité reste nettement à droite de la hampe.

| Lot à 70 unités | v102 exact / erreur / abstention | v103 exact / erreur / abstention |
| --- | --- | --- |
| 191 chiffres `4` à deux traits, CROHME 2013 et 2014 | 116 / 17 / 58 | 120 / 14 / 57 |
| 166 expressions des lots CROHME 2012, 2013, 2014 et `Train_2014` | 10 / 0 / 156 | 10 / 0 / 156 |

Trois lectures `4` → `9` et une abstention sont corrigées à 70 unités. À 25 unités, deux confusions et une abstention sont corrigées. À 45 et 105 unités, les mêmes quatre tracés qu’à 70 unités sont corrigés. Le parcours Chromium mobile à 320 px reproduit la lecture `9/5` en v102 pour chacun des deux gestes. En v103, le quiz propose `4/5`, attend la confirmation et restaure la copie, la tentative et le point après fermeture et réouverture hors connexion.

## Application existante et seconde lecture avec Seshat Web

[EulerPad sur Android](https://play.google.com/store/apps/details?id=com.eulerpad.app) est l’option prête à l’emploi la plus proche parmi les applications examinées. Selon l’éditeur, le cahier accepte l’écriture au doigt et la correction porte sur chaque étape. Son catalogue couvre plusieurs thèmes de maths du lycée, la pratique gratuite a un quota quotidien et les fonctions d’IA traitent les entrées via des prestataires distants. [Fonctionnement et crédits](https://eulerpad.app/) · [Politique de confidentialité](https://eulerpad-2d8dac.gitlab.io/privacy.html)

[CalcInk](https://kushagra905.github.io/CalcInk/) dispose d’un cahier avec sauvegarde locale et mode hors connexion après mise en cache. Il calcule les expressions saisies et réutilise le modèle CoMER d’ink-on, déjà mesuré ici. Ses fonctionnalités documentées couvrent le calcul et le tracé de fonctions. [Code et description](https://github.com/Kushagra905/CalcInk)

### Essai hors connexion du moteur Seshat

Seshat, sous GPLv3, est compilé avec Emscripten 3.1.74 et Boost 1.74. Le correctif adapte l’ancien C++ au compilateur et omet le lecteur de fichiers InkML. Le moteur reçoit les coordonnées du cahier au format SCG_INK et produit du LaTeX. L’essai initial utilisait un nouveau worker Chromium à chaque lecture. Le test ferme la page, coupe le réseau et rouvre la page depuis le cache avant de lancer la reconnaissance. [Code amont au commit utilisé](https://github.com/falvaro/seshat/tree/84c677cf3b916646ea122003236b5ca96039ff2a)

| Fractions manuscrites isolées | v103 exact / erreur / abstention | v103 puis Seshat exact / erreur / abstention |
| --- | --- | --- |
| 23 fractions CROHME 2019 | 2 / 0 / 21 | 19 / 2 / 2 |
| 25 fractions CROHME 2012–2014 | 4 / 0 / 21 | 18 / 1 / 6 |
| **48 fractions** | **6 / 0 / 42** | **37 / 3 / 8** |

L’essai conserve chaque proposition v103 et utilise Seshat sur les 42 abstentions. Il admet une fraction dont le numérateur est entier positif ou nul et le dénominateur entier strictement positif. Les réponses attendues servent au calcul des résultats du benchmark une fois la proposition produite. Parmi les trois nouvelles erreurs, Seshat lit `1/7` comme `1/1`, `7/4` comme `1/4` et `9/5` comme `4/5`. L’essai fournit directement des fractions isolées annotées. La détection d’une fraction parmi les calculs d’une feuille et la latence sur un téléphone physique restent à mesurer. La version publiée conserve le lecteur v103.

### Rejouer l’essai

Préparer les JSON de fractions avec `scripts/export-crohme-ink.py` comme dans la comparaison CROHME ci-dessus. Pour CROHME 2014, utiliser son lot de validation correspondant. Installer Chromium Playwright et activer Emscripten 3.1.74, puis depuis le dépôt avec les en-têtes Boost 1.74 disponibles :

```sh
npm install --no-save --package-lock=false playwright@1.65.0
npx playwright install chromium
bash scripts/seshat-web/build.sh /chemin/vers/boost-1.74/include /tmp/daeu-seshat-wasm
```

Exécuter ensuite le comparateur :

```sh
node scripts/seshat-web/compare.mjs /tmp/daeu-seshat-wasm \
  /tmp/daeu-crohme-2019.json /tmp/daeu-crohme-2014.json \
  /tmp/daeu-crohme-2012.json /tmp/daeu-crohme-2013.json
```

La sortie JSONL contient une ligne par fraction avec la mesure locale, la seconde lecture et la durée du worker. Les données du corpus et le binaire compilé restent hors du dépôt.

### Vérification séparée du numérateur et du dénominateur

Après une abstention de la v103, le comparateur sépare la fraction proposée par Seshat autour d’une barre unique. Les traits au-dessus et au-dessous doivent former deux lignes rapprochées et centrées. La géométrie sépare 41 des 48 fractions du premier lot et classe correctement les 34 égalités du corpus comme des expressions distinctes d’une fraction isolée.

Le lecteur de chiffres de l’application relit chaque ligne à 70 unités de hauteur. Lorsqu’il propose une valeur différente de Seshat, le comparateur mesure l’effet d’écarter la transcription. Il mesure aussi l’effet d’exiger l’accord sur une ligne ou sur les deux. Une autre lecture fait tourner Seshat sur chaque ligne séparément. Les trois lectures de Seshat utilisent le même modèle. Les corrections du corpus servent uniquement à l’évaluation.

Le worker mis en cache réutilise le modèle après réouverture hors connexion. Le correctif remet à zéro le lecteur d’arguments à chaque commande. L’essai a rejoué une même fraction après avoir fait lire une autre fraction et ses deux lignes au même moteur. La première et la dernière transcription sont identiques. Le délai de 60 secondes du comparateur s’applique au banc d’essai.

Le JSONL contient les deux lectures de ligne et le résultat de chaque règle dans `policyOutcomes`. Le comparateur affiche sur la sortie d’erreur le nombre d’égalités confondues avec une fraction isolée. Pour rejouer l’essai dans un Chromium installé localement, utiliser la variable `SESHAT_CHROMIUM_PATH` avec le chemin de son exécutable.

Le second lot contient les 47 fractions numériques isolées dont le LaTeX est annoté dans `CROHME2023Test.json`. Une comparaison des suites de coordonnées normalisées a vérifié que ces tracés diffèrent de ceux du premier lot. [Archive de test CROHME 2023](https://zenodo.org/records/8428035) · [Références LaTeX](https://zenodo.org/records/17122781)

```sh
python3 scripts/export-crohme-ink.py /tmp/CROHME23.zip --split CROHME2023_test \
  --labels /tmp/CROHME2023Test.json > /tmp/daeu-crohme-2023.json
node scripts/seshat-web/compare.mjs /tmp/daeu-seshat-wasm /tmp/daeu-crohme-2023.json
```

| Règle de seconde lecture | Premier lot, 48 tracés | CROHME 2023, 47 tracés |
| --- | --- | --- |
| Lecteur v103 seul | 6 / 0 / 42 | 0 / 1 / 46 |
| Seshat après abstention et filtre de forme LaTeX | 37 / 3 / 8 | 29 / 3 / 15 |
| Séparation géométrique des lignes exigée | 30 / 3 / 15 | 21 / 2 / 24 |
| Propositions qui contredisent le lecteur local écartées | 28 / 3 / 17 | 16 / 2 / 29 |
| Accord avec le lecteur local sur au moins une ligne, sans contradiction | 15 / 3 / 30 | 3 / 1 / 43 |
| Accord avec le lecteur local sur les deux lignes | 6 / 0 / 42 | 0 / 1 / 46 |
| Accord après relecture des deux lignes par Seshat | 30 / 3 / 15 | 20 / 2 / 25 |
| Relecture Seshat et veto du lecteur local | 28 / 3 / 17 | 15 / 2 / 30 |

Chaque cellule indique le nombre de transcriptions exactes, d’erreurs et d’abstentions. Toutes les règles conservent une première lecture v103 déjà obtenue. Le test a terminé les 95 tracés dans Chromium en mode mobile, après réouverture hors connexion, sans erreur d’exécution du worker. L’abstention sur le tracé annoté `0/0` de CROHME 2023 est attendue.

Seshat conserve ses trois erreurs du premier lot après séparation des lignes. Il lit `1/7` comme `1/1`, `7/4` comme `1/4` et `9/5` comme `4/5`. L’accord exigé sur les deux lignes avec le lecteur local écarte chaque nouvelle erreur sur les deux lots et n’ajoute aucune lecture exacte. L’erreur `43/9` lu `48/9` de CROHME 2023 vient de la v103, avant la seconde lecture. Le cahier public utilise la v103.

## Lecteur local v104

Le gabarit d’un `8` étroit devançait celui du `3` sur certains traits ouverts. Le lecteur vérifie désormais les candidats `8` tracés d’un seul geste. Il cherche des extrémités à gauche, un creux central entre deux arcs et une descente sans remontée marquée. L’arc supérieur doit se prolonger vers la droite sous le sommet. Cette condition écarte les `5` dont la barre supérieure est retracée.

| Tracés de `3` à 70 unités | v103 exact / erreur / abstention | v104 exact / erreur / abstention |
| --- | --- | --- |
| 150 tracés CROHME 2012 | 23 / 17 / 110 | 43 / 9 / 98 |
| 117 tracés CROHME 2013 | 24 / 8 / 85 | 37 / 4 / 76 |
| 289 tracés CROHME 2014 | 47 / 21 / 221 | 65 / 18 / 206 |
| 20 tracés dans le lot de fractions CROHME 2023 | 2 / 2 / 16 | 7 / 2 / 11 |
| **576 tracés** | **96 / 48 / 432** | **152 / 33 / 391** |

Les `3` et `8` isolés sont segmentés par les annotations CROHME. À 70 unités, 15 `3` autrefois lus `8` sont corrigés et 41 abstentions deviennent des lectures exactes. À 25, 45, 70 et 105 unités, aucune lecture des 172 tracés de `8` ne change. Les 7 470 autres symboles annotés sont également contrôlés aux quatre tailles. Les deux variantes annotées de `43/9` dans les 95 tracés de fractions sont correctement lues. [Archives CROHME du RIT](https://www.cs.rit.edu/~dprl/software.html) · [Corpus CROHME 2023](https://zenodo.org/records/8428035)

Le parcours Chromium à 320 px vérifie le nouveau tracé sur un exercice de probabilités. Il propose `3/8` après l’écriture au doigt et attribue le point après confirmation. La copie et le score sont restaurés après fermeture et réouverture hors connexion.

## Lecteur local v105

Les cinq erreurs du `8` de la v104 à 70 unités concernaient des chiffres à deux boucles tracés d’un seul geste. Les gabarits proposaient deux `6`, deux `9` et un `4`. Le lecteur vérifie le croisement au milieu de la hauteur, le retour près du départ et la présence d’une boucle de chaque côté du croisement. Les deux boucles doivent tourner en sens opposés et avoir une aire suffisante. Les contrôles incluent un `0` retracé et des `1` presque verticaux.

| Tracés de `8` à 70 unités | v104 exact / erreur / abstention | v105 exact / erreur / abstention |
| --- | --- | --- |
| 50 tracés CROHME 2012 | 25 / 1 / 24 | 38 / 0 / 12 |
| 28 tracés CROHME 2013 | 8 / 1 / 19 | 26 / 0 / 2 |
| 83 tracés CROHME 2014 | 27 / 3 / 53 | 68 / 0 / 15 |
| 11 tracés du lot de fractions CROHME 2023 | 0 / 0 / 11 | 4 / 0 / 7 |
| **172 tracés** | **60 / 5 / 107** | **136 / 0 / 36** |

Les essais à 25, 45, 70 et 105 unités contrôlent aussi les 576 tracés de `3` et les 7 470 autres symboles annotés. Toutes les transcriptions modifiées aux quatre tailles deviennent exactes sur ce corpus. Sur 95 fractions, le lecteur propose neuf lectures exactes et 86 abstentions. La lecture ajoutée correspond à un `8/7` de CROHME 2019. [Archives CROHME du RIT](https://www.cs.rit.edu/~dprl/software.html) · [Corpus CROHME 2023](https://zenodo.org/records/8428035)

Le scénario Chromium à 320 px vérifie une fraction dont le dénominateur déclenchait la proposition `3/6` en v104. En v105, le cahier propose `3/8`, demande confirmation et restaure la copie et le score après réouverture hors connexion.

## Décision sur le consensus Seshat : ne pas publier sans gain démontré

Les 95 fractions annotées déjà mesurées avec le lecteur **v103** fournissent un contrôle indépendant du nouveau code de rapport, mais **ne mesurent pas encore la v107**. La règle historique `seshatAgreementWithLocalVeto` (accord Seshat sur les deux lignes, veto du lecteur local) a donné :

| Corpus | Exact / erreur / abstention | Lecteur v103 seul |
| --- | --- | --- |
| CROHME 2012–2019, 48 fractions | 28 / 3 / 17 | 6 / 0 / 42 |
| CROHME 2023, 47 fractions | 15 / 2 / 30 | 0 / 1 / 46 |
| **Total, 95 fractions** | **43 / 5 / 47** | **6 / 1 / 88** |

Cette politique ajoute des lectures exactes **mais également des erreurs**. Le consensus strict introduit après la v107 exige aussi des lectures numériques valides ; il n'a pas encore été rejoué sur ces 95 tracés. Il serait incorrect de lui attribuer les scores de la politique historique. Les données disponibles ne justifient pas la publication du moteur externe.

Le script `scripts/seshat-web/report.mjs` résume les sorties JSONL du comparateur, pour chaque corpus et chaque politique : exactitudes, erreurs, abstentions, nouvelles lectures exactes, nouvelles erreurs et pertes de lectures exactes par rapport au lecteur local. Il signale les échantillons dupliqués et les résultats manquants. Une politique n'est **jamais** approuvée pour la production par ce rapport, même si ses critères de présélection passent.

```sh
node scripts/seshat-web/compare.mjs /tmp/daeu-seshat-wasm \
  /tmp/daeu-crohme-2019.json /tmp/daeu-crohme-2023.json \
  > /tmp/daeu-seshat-comparison.jsonl
node scripts/seshat-web/report.mjs /tmp/daeu-seshat-comparison.jsonl
```

Cette commande suppose que les deux corpus et le moteur WASM ont été préparés selon les instructions précédentes. Le nouveau rapport ne remplace pas la mesure de latence sur un appareil Android physique, ni l'analyse des licences et du volume du modèle.

## Filtre de consensus pour le moteur Seshat (essai non publié)

Le comparateur WebAssembly possède maintenant une politique indépendante, testée dans `scripts/seshat-web/fraction-consensus.test.mjs`. Lorsque le lecteur local s'abstient, elle exige : une fraction numérique admissible, une séparation géométrique en deux lignes, et l'accord exact entre la lecture Seshat de la fraction entière et celles du numérateur et du dénominateur séparés. Toute contradiction avec une lecture locale partielle bloque la proposition. La lecture locale complète garde la priorité.

La politique produit explicitement un motif de refus et ajoute `strictConsensus` aux résultats du comparateur. Cela permet de mesurer exactitudes, erreurs et abstentions sans confondre l'acceptation syntaxique et une transcription correcte. **Ce n'est pas encore une intégration dans la PWA** : le WebAssembly GPLv3 n'est pas livré dans le site, et la validation sur téléphone Android réel, la taille des ressources, la licence de redistribution et un lot indépendant doivent encore être vérifiés. Aucun chiffre de précision supplémentaire n'est annoncé sans nouvelle exécution du corpus.

## Audit des chiffres à deux traits — chantier suivant

Le benchmark `scripts/audit-two-stroke-eight.mjs` prend les chiffres isolés et annotés des exports CROHME (`--symbols`). Il mesure séparément les `8` à deux traits et les autres chiffres à deux traits, avec trois issues exclusives : exact, erreur, abstention. Il signale les **faux `8` parmi les autres chiffres** par identifiant. Il permet aussi de comparer un lecteur antérieur sur **les mêmes coordonnées normalisées** et d'identifier chaque transcription modifiée.

```sh
python3 scripts/export-crohme-ink.py /tmp/Train.zip --split TestINKMLGT_2013 --symbols > /tmp/crohme-2013-symbols.json
python3 scripts/export-crohme-ink.py /tmp/crohme-formulas.zip --symbols > /tmp/crohme-2014-symbols.json
git show 64e0aded0012e43e950a17c6f1b54d99b5cd1966:app/numeric-ink.mjs > app/numeric-ink-v106.mjs
node scripts/audit-two-stroke-eight.mjs --baseline app/numeric-ink-v106.mjs \
  /tmp/crohme-2013-symbols.json /tmp/crohme-2014-symbols.json
rm app/numeric-ink-v106.mjs
```

Les archives doivent être obtenues séparément et ne sont ni téléchargées ni publiées par ce script. La comparaison de référence est facultative : retirer `--baseline app/numeric-ink-v106.mjs` pour mesurer uniquement la version courante. Les contrôles de l'audit lui-même tournent en CI, **mais les scores CROHME ne sont pas encore mesurés pour la v107**. Ne pas interpréter un faible taux de faux positifs sur les seules formes synthétiques comme une précision démontrée en production.

## Lecteur local v107

Certains élèves écrivent le `8` comme deux ovales indépendants plutôt qu'en traçant un croisement central. Le lecteur regroupe désormais ces traits uniquement lorsque leurs largeurs et hauteurs sont comparables, leurs centres horizontaux sont alignés, les ovales sont presque joints verticalement et chacun forme une boucle fermée d'aire suffisante.

Le test de régression vérifie le cas `8` isolé, l'ordre de dessin inversé, la direction inversée, deux ovales avec un petit espace et la fraction posée `3/8`. Il refuse un `0` retracé, des boucles côte à côte, des boucles trop éloignées et un `9` avec une hampe distincte. L'app conserve l'obligation de confirmer la transcription avant toute notation.

**Limite de la mesure :** ces tracés de test ont été construits géométriquement et ne sont pas un nouveau corpus annoté de personnes réelles. Le résultat sur CROHME et l'essai sur Android physique doivent encore être mesurés. Les performances de la v106 sur les `8` d'un seul trait restent le point de référence.

## Lecteur local v106

Les boucles d’un `8` peuvent se croiser alors que le stylo finit loin de son point de départ. La v105 écartait ces tracés. La v106 accepte les extrémités éloignées si elles restent proches du sommet des boucles, si le croisement demeure central et si les deux boucles de sens opposés possèdent chacune une aire suffisante. Le contrôle renforcé de l’écart entre le croisement et les extrémités écarte un `2` ouvert observé pendant les essais.

| Tracés de `8` à 70 unités | v105 exact / erreur / abstention | v106 exact / erreur / abstention |
| --- | --- | --- |
| 50 tracés CROHME 2012 | 38 / 0 / 12 | 43 / 0 / 7 |
| 28 tracés CROHME 2013 | 26 / 0 / 2 | 27 / 0 / 1 |
| 83 tracés CROHME 2014 | 68 / 0 / 15 | 74 / 0 / 9 |
| 11 tracés du lot CROHME 2023 | 4 / 0 / 7 | 4 / 0 / 7 |
| **172 tracés** | **136 / 0 / 36** | **148 / 0 / 24** |

Les quatre tailles contrôlées restent 25, 45, 70 et 105 unités. Aucun des autres chiffres annotés des lots 2012–2014 et 2023 ne change de lecture. Un deuxième lot de contrôle comprend 7 027 chiffres des données d’entraînement CROHME 2014, dont 701 `8`. À 70 unités, 53 `8` supplémentaires deviennent exacts, sans modification des autres chiffres. Les 95 fractions utilisées jusqu’ici gardent leurs transcriptions précédentes.

Le parcours Chromium à 320 px vérifie une nouvelle fraction `3/8` dont les extrémités du `8` restent éloignées. La proposition nécessite une confirmation pour attribuer le point. La copie et le score sont restaurés après fermeture et réouverture hors connexion. [Archives CROHME du RIT](https://www.cs.rit.edu/~dprl/software.html)
