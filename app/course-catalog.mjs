/** Cours publiés depuis les sources Markdown du dossier maths/. */
export const COURSES=[
["00-positionnement","00 · Positionnement"],
["01-calcul-numerique","01 · Calcul numérique"],
["02-calcul-litteral","02 · Calcul littéral"],
["03-equations-inequations-systemes","03 · Équations, inéquations et systèmes"],
["04-second-degre","04 · Second degré"],
["05-fonctions","05 · Fonctions et domaines"],
["06-derivation","06 · Dérivation"],
["07-limites-asymptotes","07 · Limites et asymptotes"],
["08-continuite-tvi","08 · Continuité et TVI"],
["09-exponentielle-logarithme","09 · Exponentielle et logarithme"],
["10-suites","10 · Suites"],
["11-statistiques","11 · Statistiques"],
["12-probabilites","12 · Probabilités"],
["13-trigonometrie","13 · Trigonométrie (complément)"],
["14-geometrie-vectorielle","14 · Géométrie vectorielle (complément)"],
["15-primitives-integrales","15 · Primitives et intégrales"],
["16-complexes-complements","16 · Nombres complexes (complément)"],
["17-raisonnement-modelisation","17 · Rédaction et modélisation"]
];
const catalog=new Map(COURSES);
export function courseUrl(filename){
  const slug=String(filename??"").split("/").at(-1).replace(/\.md$/,"");
  return catalog.has(slug)?"./course.html?course="+encodeURIComponent(slug):null;
}
export function courseInfo(slug){return catalog.get(slug)||null;}
