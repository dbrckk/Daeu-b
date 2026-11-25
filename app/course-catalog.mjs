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
export function courseUrl(filename,{jalon}={}){
  const slug=String(filename??"").split("/").at(-1).replace(/\.md$/,"");
  return catalog.has(slug)?"./course.html?course="+encodeURIComponent(slug)+(Number.isInteger(jalon)?"&jalon="+jalon:""):null;
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
export function practiceUrlForCourse(filename,{jalon}={}){
  const topic=practiceTopicForCourse(filename);
  return topic?"./?topic="+encodeURIComponent(topic)+(Number.isInteger(jalon)?"&jalon="+jalon:"")+"#practice-title":"./#practice-title";
}

/** Correspondance éditoriale entre erreurs établies et exercices existants. */
const STEP_REVIEWS=new Map([
 ["numeric",{title:"Calculs, fractions et signes",lesson:"01-calcul-numerique",ids:["n06","v01","n01","v02","n09","v33","v42"]}],
 ["linear",{title:"Équations et transformations",lesson:"03-equations-inequations-systemes",ids:["v07","e01","v43","e09","v35"]}],
 ["inequality",{title:"Sens des inégalités et bornes",lesson:"03-equations-inequations-systemes",ids:["e05","v09","v44","v37","e04"]}],
 ["quadratic",{title:"Second degré, racines et signes",lesson:"04-second-degre",ids:["s01","v10","s02","s06","s05","e04","v45"]}],
 ["rational",{title:"Quotients et valeurs interdites",lesson:"03-equations-inequations-systemes",ids:["f02","a06","e10","v19","e06","v46"]}],
 ["radical",{title:"Racines et conditions de définition",lesson:"05-fonctions",ids:["v04","n03","n11","f03","f06","v47"]}],
 ["derivative",{title:"Règles de dérivation",lesson:"06-derivation",ids:["d01","v17","v18","d03","d02","d06","v48","l12"]}]
]);
export function stepReview(code){
  const record=STEP_REVIEWS.get(code);
  return record?{code,title:record.title,lesson:record.lesson,ids:[...record.ids]}:null;
}
export function stepReviewUrl(code){
  return STEP_REVIEWS.has(code)?"./?revision="+encodeURIComponent(code)+"#practice-title":null;
}
export function stepReviewRecommendations(entries){
  const counts=new Map();
  for(const entry of Array.isArray(entries)?entries:[]){
    if(entry?.kind!=="error"||!STEP_REVIEWS.has(entry.skill))continue;
    counts.set(entry.skill,(counts.get(entry.skill)||0)+1);
  }
  return [...counts].map(([code,count])=>({...stepReview(code),count,url:stepReviewUrl(code)}))
    .sort((a,b)=>b.count-a.count||a.code.localeCompare(b.code,"fr"));
}


/** Three editorial difficulty tiers. For a targeted session, the current
 * weak questions and due reminders are selected before already-confirmed
 * questions; delivery is ordered from foundations to transfer. */
export function stepReviewLevel(code,id){
  const ids=STEP_REVIEWS.get(code)?.ids;
  const index=ids?.indexOf(id)??-1;
  return index<0?null:index<2?1:index<4?2:3;
}
export function selectStepReviewQuestions(code,questions,practice,{mode="all",now=Date.now(),limit=6}={}){
  const item=stepReview(code);
  if(!item||!["all","due","wrong"].includes(mode)||!Number.isInteger(limit)||limit<1||limit>10)return [];
  const byId=new Map(questions.map(q=>[q.id,q]));
  const info=id=>practice?.items?.[id];
  const due=id=>Boolean(info(id)?.attempts&&info(id).dueAt<=now);
  const weak=id=>Boolean(info(id)?.attempts&&!info(id).streak);
  const priority=id=>due(id)?0:weak(id)?1:!info(id)?.attempts?2:!info(id).confirmed?3:4;
  const candidates=item.ids.filter(id=>byId.has(id)&&(mode==="all"||
    (mode==="due"?due(id):Boolean(info(id)?.wrong&&!info(id).confirmed))));
  candidates.sort((a,b)=>priority(a)-priority(b)||stepReviewLevel(code,a)-stepReviewLevel(code,b)
    ||(info(a)?.lastAt??0)-(info(b)?.lastAt??0)||item.ids.indexOf(a)-item.ids.indexOf(b));
  return candidates.slice(0,limit).sort((a,b)=>stepReviewLevel(code,a)-stepReviewLevel(code,b)
    ||priority(a)-priority(b)||item.ids.indexOf(a)-item.ids.indexOf(b)).map(id=>byId.get(id));
}
