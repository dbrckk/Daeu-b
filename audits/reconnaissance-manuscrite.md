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

Extraire `Task1_onlineRec.zip` de l’archive de test CROHME 2019 et récupérer le fichier `CROHME2019st.json`. Les références sont associées aux tracés par nom de fichier. Le filtre retient les fractions entières posées et les égalités compatibles avec son alphabet, jusqu’à 45 caractères de notation normalisée pour ce lot. Le comparateur ramène chaque expression à 70 unités de haut au maximum, en préservant les proportions. Les tracés et labels restent hors du dépôt. [Archives CROHME du RIT](https://www.cs.rit.edu/~dprl/software.html) · [Références CROHME 2019](https://zenodo.org/records/17122781)

```sh
python3 scripts/export-crohme-ink.py /tmp/Task1_onlineRec.zip --split TestSet2019 \
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
