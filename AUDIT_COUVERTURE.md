# Audit v23 — couverture réelle des jalons DAEU B

**Référence :** SONATE / Université Côte d'Azur 2026–2027. **Reproduction :** `node scripts/audit-coverage.mjs --write`; contrôle : `node scripts/audit-coverage.mjs --check`.

Les affectations des **questions fixes** sont une classification éditoriale explicite (`scripts/coverage-map.mjs`), **non encore une preuve de validité pédagogique individuelle**. Les générateurs sont classés par les jalons réellement déclarés dans `app/variants.mjs`. Une variante peut figurer dans deux jalons : **ne jamais additionner les effectifs par ligne pour obtenir des modèles distincts**.

## Inventaire vérifiable

- **116 questions fixes** attribuées une fois chacune (116 classées) ; **41 générateurs uniques** ; **157 entrées interactives uniques**.
- **20 jalons obligatoires** dotés d'au moins une question fixe attribuée et d'un générateur ; **3 jalons facultatifs** distingués de la banque.
- **43 attributions de générateurs à des jalons**, pour 41 modèles uniques (modèles couvrant plusieurs jalons).
- Effectif fixe faible (≤2) : **aucun**. Un seul modèle variable : **aucun**.

## Matrice des 23 jalons (20 obligatoires + 3 facultatifs)

| Jalon | Notion | Cours | Fixes (N/Choix) | Modèles variables | Vigilance |
|---:|---|---|---:|---:|---|
| 1 | Nombres entiers | 01 | 5 (5/0) | 2 | Attribution présente ; profondeur non mesurée |
| 2 | Nombres rationnels | 01 | 3 (3/0) | 3 | Attribution présente ; profondeur non mesurée |
| 3 | Nombres réels | 01 | 3 (2/1) | 3 | Attribution présente ; profondeur non mesurée |
| 4 | Calcul littéral | 02 | 6 (1/5) | 2 | Attribution présente ; profondeur non mesurée |
| 5 | Équations à une inconnue | 03 | 4 (4/0) | 2 | Attribution présente ; profondeur non mesurée |
| 6 | Systèmes de deux équations à deux inconnues | 03 | 3 (3/0) | 2 | Attribution présente ; profondeur non mesurée |
| 7 | Polynômes de degré 2 | 04 | 6 (4/2) | 2 | Attribution présente ; profondeur non mesurée |
| 8 | Intervalles réels et inéquations | 03, 04 | 3 (0/3) | 2 | Attribution présente ; profondeur non mesurée |
| 9 | Statistiques descriptives | 11 | 10 (9/1) | 2 | Attribution présente ; profondeur non mesurée |
| 10 | Introduction aux fonctions | 05 | 7 (3/4) | 2 | Attribution présente ; profondeur non mesurée |
| 11 | Limites | 07 | 6 (4/2) | 2 | Attribution présente ; profondeur non mesurée |
| 12 | Dérivées | 06 | 8 (4/4) | 2 | question hors jalons du domaine : l12 |
| 13 | Asymptotes | 07 | 5 (0/5) | 2 | Attribution présente ; profondeur non mesurée |
| 14 | Théorème des valeurs intermédiaires | 08 | 10 (5/5) | 2 | Attribution présente ; profondeur non mesurée |
| 15 | Suites numériques | 10 | 7 (5/2) | 2 | Attribution présente ; profondeur non mesurée |
| 16 | Logarithme | 09 | 6 (3/3) | 2 | Attribution présente ; profondeur non mesurée |
| 17 | Exponentielle | 09 | 3 (1/2) | 2 | Attribution présente ; profondeur non mesurée |
| 18 | Calcul intégral | 15 | 8 (5/3) | 2 | Attribution présente ; profondeur non mesurée |
| 19 | Probabilités discrètes | 12 | 8 (8/0) | 3 | Attribution présente ; profondeur non mesurée |
| 20 | Variables aléatoires | 12 | 5 (5/0) | 2 | Attribution présente ; profondeur non mesurée |
| 21 * | Trigonométrie | 13 | 0 (0/0) | 0 | Facultatif ; aucun modèle dédié |
| 22 * | Nombres complexes | 16 | 0 (0/0) | 0 | Facultatif ; aucun modèle dédié |
| 23 * | Complexes appliqués à la géométrie plane | 16, 14 | 0 (0/0) | 0 | Facultatif ; aucun modèle dédié |

*Les jalons 21–23 sont facultatifs à Nice dans le référentiel indiqué ; leur présence dans les cours ne prouve pas une banque interactive dédiée.*

## Anomalies et risques observés

- **Attribution inter-domaines :** `l12` porte principalement sur le jalon 12, mais se trouve dans un domaine dont la liste `jalons` ne le mentionne pas. Il faut examiner son classement sans modifier aveuglément les historiques.
- **Profondeur non certifiée :** les étiquettes *diagnostic / application / transfert*, la qualité de la rédaction, la difficulté et la variété effective des problèmes **ne sont pas présentes de manière vérifiable pour chaque question**. Aucun taux de maîtrise par jalon n'est déduit de cet audit.
- **Couverture facultative :** les jalons 21–23 ont des cours mais pas de questions interactives dédiées ; ne pas les présenter comme évalués dans l'application.

## Prochaines corrections classées par priorité

1. **P0 — v24 :** examiner les jalons à faible quantité de questions fixes ou à un seul générateur ; enrichir d'abord des compétences insuffisamment évaluées plutôt que recopier des exercices similaires.
2. **P0 — classification :** relire la question inter-domaines et les exemples particuliers ; confirmer les attributions manuelles des questions fixes avant toute mesure de maîtrise par jalon.
3. **P1 — v25/v26 :** ajouter des niveaux évaluables et des exercices de transfert avec corrections étape par étape, sans faux correcteur automatique du raisonnement libre.
4. **Contrôle continu :** tests du moteur, des imports JSON, des 18 cours hors connexion et des examens A/B/C/D ; ne pas prendre la CI pour une validation académique indépendante.

## Reproduire l'audit

```bash
node scripts/audit-coverage.mjs --check
```

Données détaillées (IDs exacts, formats, jalons, cours et alertes) : [`audits/coverage.json`](audits/coverage.json).
