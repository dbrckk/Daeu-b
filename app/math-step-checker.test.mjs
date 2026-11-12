import test from "node:test";
import assert from "node:assert/strict";
import {classifyEquality,checkMathSteps,parseAffine,formatRational} from "./math-step-checker.mjs";

test("chaîne linéaire correcte : transformation équivalente exacte",()=>{
 const c=checkMathSteps("2x + 5 = 17\n2x = 12\nx = 6");
 assert.equal(c.checked,3);
 assert.equal(c.errors,0);
 assert.deepEqual(c.entries.map(e=>e.kind),["info","ok","ok"]);
});
test("repère précisément les erreurs de signes et la ligne concernée",()=>{
 const c=checkMathSteps("2x + 5 = 17\n2x = 14\nx = 7");
 assert.equal(c.errors,1);
 assert.match(c.entries[1].message,/ligne 1/);
 assert.match(c.entries[1].message,/x = 6/);
});
test("rationnels exacts, décimaux français, négatifs et parenthèses",()=>{
 for(const text of [
  "3x = 1\nx = 1/3",
  "2(x + 3) = 10\nx = 2",
  "(x + 1)/2 = 1,5\nx = 2",
  "-2x + 4 = 10\nx = -3",
  "2x + 1 = x + 5\nx = 4",
  "3/2x = 6\nx = 4",
  "0,1x = 0,3\nx = 3"
 ])assert.equal(checkMathSteps(text).errors,0,text);
 assert.equal(classifyEquality("x=0,5").solution,"1/2");
 assert.equal(formatRational(parseAffine("2,5").b),"5/2");
});
test("identités, impossibilités et calculs numériques vérifiés sans approximation",()=>{
 assert.deepEqual(checkMathSteps("x - x = 0\n0 = 0").entries.map(e=>e.kind),["info","ok"]);
 assert.deepEqual(checkMathSteps("x - x = 1\n0 = 1").entries.map(e=>e.kind),["info","ok"]);
 assert.equal(checkMathSteps("3/4=0,75\n2×3=7").errors,1);
 assert.match(checkMathSteps("3/4=0,75\n2×3=7").entries[1].message,/6/);
 assert.equal(checkMathSteps("x=1/3\nx=0,333333").errors,1,"l'arrondi n'est pas une preuve d'égalité");
});
test("ne prétend pas corriger les équations quadratiques ou les fonctions",()=>{
 for(const expression of ["x²=4","x*x=4","1/x=2","sin(x)=1","x^2=4","√(x)=2","x=2=2","1/(2-2)=4"]){
  const c=checkMathSteps(expression);
  assert.equal(c.checked,0,expression);
  assert.equal(c.unsupported,1,expression);
 }
});
test("les annotations et lignes vides cassent la chaîne et ne sont pas approuvées",()=>{
 const s=checkMathSteps("x=2\n\nx=7\ntexte explicatif\n3x = 9");
 assert.equal(s.errors,0);
 assert.deepEqual(s.entries.map(e=>e.kind),["info","info","info"]);
 const x=checkMathSteps("x=2\nErreur : x=3\nx=4");
 assert.equal(x.unsupported,1);
 assert.equal(x.errors,0);
});
test("borne le travail, interdit les entrées dangereuses et la division nulle",()=>{
 for(const expression of ["x=1/0","x=2**3","x=0;alert(1)","x=2e10","x=(1+2","x=999999999999999999999999"]){
  assert.equal(checkMathSteps(expression).unsupported,1,expression);
 }
 assert.equal(checkMathSteps(Array(41).fill("x=2").join("\n")).unsupported,1);
 assert.equal(checkMathSteps("x=1\nx=3").errors,1);
 assert.equal(checkMathSteps("x-x=0\nx=2").errors,1);
 assert.equal(checkMathSteps("x=5\n0=0").entries[1].kind,"info","une vérité numérique ne prouve pas une équation");
});
