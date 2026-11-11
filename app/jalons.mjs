/** Jalons obligatoires SONATE 2026–2027 et classification éditoriale.
 * Classification de questions, non certification de maîtrise.
 */
export const JALONS=[
  {
    "id": 1,
    "title": "Nombres entiers",
    "lesson": "01-calcul-numerique.md"
  },
  {
    "id": 2,
    "title": "Nombres rationnels",
    "lesson": "01-calcul-numerique.md"
  },
  {
    "id": 3,
    "title": "Nombres réels",
    "lesson": "01-calcul-numerique.md"
  },
  {
    "id": 4,
    "title": "Calcul littéral",
    "lesson": "02-calcul-litteral.md"
  },
  {
    "id": 5,
    "title": "Équations à une inconnue",
    "lesson": "03-equations-inequations-systemes.md"
  },
  {
    "id": 6,
    "title": "Systèmes de deux équations à deux inconnues",
    "lesson": "03-equations-inequations-systemes.md"
  },
  {
    "id": 7,
    "title": "Polynômes de degré 2",
    "lesson": "04-second-degre.md"
  },
  {
    "id": 8,
    "title": "Intervalles réels et inéquations",
    "lesson": "03-equations-inequations-systemes.md"
  },
  {
    "id": 9,
    "title": "Statistiques descriptives",
    "lesson": "11-statistiques.md"
  },
  {
    "id": 10,
    "title": "Introduction aux fonctions",
    "lesson": "05-fonctions.md"
  },
  {
    "id": 11,
    "title": "Limites",
    "lesson": "07-limites-asymptotes.md"
  },
  {
    "id": 12,
    "title": "Dérivées",
    "lesson": "06-derivation.md"
  },
  {
    "id": 13,
    "title": "Asymptotes",
    "lesson": "07-limites-asymptotes.md"
  },
  {
    "id": 14,
    "title": "Théorème des valeurs intermédiaires",
    "lesson": "08-continuite-tvi.md"
  },
  {
    "id": 15,
    "title": "Suites numériques",
    "lesson": "10-suites.md"
  },
  {
    "id": 16,
    "title": "Logarithme",
    "lesson": "09-exponentielle-logarithme.md"
  },
  {
    "id": 17,
    "title": "Exponentielle",
    "lesson": "09-exponentielle-logarithme.md"
  },
  {
    "id": 18,
    "title": "Calcul intégral",
    "lesson": "15-primitives-integrales.md"
  },
  {
    "id": 19,
    "title": "Probabilités discrètes",
    "lesson": "12-probabilites.md"
  },
  {
    "id": 20,
    "title": "Variables aléatoires",
    "lesson": "12-probabilites.md"
  }
];
/** Attribution éditoriale des questions fixes (une question = un jalon principal).
 * Les générateurs disposent déjà de leur propre tableau de jalons dans variants.mjs.
 * Une attribution n'est PAS une certification de difficulté, de correction ni de maîtrise.
 */
export const FIXED_IDS_BY_JALON={
  "1": "n02 n04 n06 n07 n08",
  "2": "n01 n05 n09",
  "3": "n03 n10 n11",
  "4": "a01 a02 a03 a04 a05 a06",
  "5": "e01 e07 e09 e10",
  "6": "e02 e03 e08",
  "7": "s01 s02 s03 s04 s05 s06",
  "8": "e04 e05 e06",
  "9": "st01 st02 st03 st04 st05 st06 st07 st08 st09 st10",
  "10": "f01 f02 f03 f04 f05 f06 f07",
  "11": "l01 l02 l03 l07 l10 l11",
  "12": "d01 d02 d03 d04 d05 d06 d07 l12",
  "13": "l04 l05 l06 l08 l09",
  "14": "t01 t02 t03 t04 t05 t06 t07 t08 t09 t10",
  "15": "u01 u02 u03 u04 u05 u06 u07",
  "16": "x02 x03 x05 x06 x07 x09",
  "17": "x01 x04 x08",
  "18": "i01 i02 i03 i04 i05 i06 i07 i08",
  "19": "p01 p02 p05 p06 p08 p10 p11 p12",
  "20": "p03 p04 p07 p09 p13"
};
