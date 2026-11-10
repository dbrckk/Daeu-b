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


/**
 * Association explicite entre les cours Markdown et les 13 domaines interactifs.
 * Les compléments 00, 13, 14, 16 et 17 ne possèdent pas de banque dédiée :
 * leurs liens mènent au sélecteur général au lieu de promettre un faux quiz.
 */
const PRACTICE_TOPICS=new Map([
  ["01-calcul-numerique","nombres"],
  ["02-calcul-litteral","litteral"],
  ["03-equations-inequations-systemes","equations"],
  ["04-second-degre","second"],
  ["05-fonctions","fonctions"],
  ["06-derivation","derivation"],
  ["07-limites-asymptotes","limites"],
  ["08-continuite-tvi","continuite"],
  ["09-exponentielle-logarithme","explog"],
  ["10-suites","suites"],
  ["11-statistiques","statistiques"],
  ["12-probabilites","probas"],
  ["15-primitives-integrales","integrales"]
]);
const slugOf=filename=>String(filename??"").split("/").at(-1).replace(/\.md$/,"");
export function practiceTopicForCourse(filename){
  const slug=slugOf(filename);
  return catalog.has(slug)?PRACTICE_TOPICS.get(slug)??null:null;
}
export function practiceUrlForCourse(filename){
  const topic=practiceTopicForCourse(filename);
  return topic?"./?topic="+encodeURIComponent(topic)+"#practice-title":"./#practice-title";
}
