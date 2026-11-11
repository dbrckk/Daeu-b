import test from "node:test";
import assert from "node:assert/strict";
import {validSearchQuery,normalizeSearchText,searchCourseDocs} from "./course-search.mjs";
const docs=[
 {slug:"08-continuite-tvi",title:"Continuité et TVI",content:"# Continuité\n\nLa dichotomie permet de localiser une racine."},
 {slug:"12-probabilites",title:"Probabilités",content:"# Probabilités\n\nFormule de Bayes et probabilités conditionnelles."},
 {slug:"02-calcul-litteral",title:"Calcul littéral",content:"# Calcul littéral\n\nÉquations simples et expressions."},
 {slug:"03-equations",title:"Équations",content:"# Équations\n\nRésolution et factorisation."}
];
test("recherche locale insensible aux accents et à la casse",()=>{
 assert.equal(validSearchQuery("  PROBABILITÉS  "),"PROBABILITÉS");
 assert.equal(normalizeSearchText("ÉQUATIONS"),"equations");
 assert.deepEqual(searchCourseDocs(docs,"probabilites").map(x=>x.slug),["12-probabilites"]);
 assert.deepEqual(searchCourseDocs(docs,"DICHOTOMIE").map(x=>x.slug),["08-continuite-tvi"]);
 assert.deepEqual(searchCourseDocs(docs,"equations").map(x=>x.slug),["03-equations","02-calcul-litteral"]);
});
test("plusieurs mots AND et extraits courts",()=>{
 assert.deepEqual(searchCourseDocs(docs,"formule Bayes").map(x=>x.slug),["12-probabilites"]);
 assert.deepEqual(searchCourseDocs(docs,"formule dichotomie"),[]);
 const [found]=searchCourseDocs(docs,"bayes");
 assert.ok(found.excerpt.includes("Bayes")&&found.excerpt.length<=215);
 assert.deepEqual(searchCourseDocs(docs,"équations",{limit:1}).map(x=>x.slug),["03-equations"]);
});
test("requêtes incorrectes ou absentes refusées",()=>{
 for(const q of [null,5,"","x"," ".repeat(8),"a".repeat(81)]){
   assert.equal(validSearchQuery(q),null);
   assert.deepEqual(searchCourseDocs(docs,q),[]);
 }
 assert.deepEqual(searchCourseDocs([], "tvi"),[]);
});
