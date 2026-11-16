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
