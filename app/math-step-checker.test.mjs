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
 assert.equal(c.errors,2);
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
test("rejette les degrés supérieurs, fonctions et divisions non polynomiales",()=>{
 for(const expression of ["x^3=4","x²*x=4","1/(x^2-1)=2","sin(x)=1","x*√(x)=2","x=2=2","1/(2-2)=4"]){
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

test("En cas d'erreur, indique une méthode de transformation concrète sans notation fictive",()=>{
 const s=checkMathSteps("2x + 5 = 17\n2x = 14");
 assert.equal(s.errors,1);
 assert.match(s.entries[1].message,/2x = 12/);
 assert.match(s.entries[1].message,/x = 6/);
 const n=checkMathSteps("x - x = 0\nx = 7");
 assert.equal(n.errors,1);
 assert.match(n.entries[1].message,/identité/);
});

test("Une ligne erronée ne contamine pas la référence des étapes suivantes",()=>{
 const c=checkMathSteps("2x + 5 = 17\n2x = 14\nx = 7\n2x = 12\nx = 6");
 assert.deepEqual(c.entries.map(e=>e.kind),["info","error","error","ok","ok"]);
 assert.equal(c.errors,2);
 assert.match(c.entries[2].message,/ligne 1/);
 assert.match(c.entries[3].message,/ligne 1/);
});

test("second degré : reconnaît exactement les deux racines, sans perte",()=>{
 const correct=checkMathSteps("x²-5x+6=0\n(x-2)(x-3)=0\n2x²-10x+12=0");
 assert.deepEqual(correct.entries.map(e=>e.kind),["info","ok","ok"]);
 assert.equal(correct.errors,0);
 assert.match(correct.entries[0].message,/Δ = 1/);
 const lost=checkMathSteps("x²=4\nx=2\nx=-2\n(x-2)(x+2)=0");
 assert.deepEqual(lost.entries.map(e=>e.kind),["info","error","error","ok"]);
 assert.match(lost.entries[1].message,/deux racines/);
 assert.match(lost.entries[1].message,/x = -2 ou x = 2/);
});
test("second degré : double racine, discriminant négatif et radicaux exacts",()=>{
 assert.deepEqual(checkMathSteps("(x-1)^2=0\nx=1").entries.map(e=>e.kind),["info","ok"]);
 assert.deepEqual(checkMathSteps("x²+1=0\nx²+2=0").entries.map(e=>e.kind),["info","ok"]);
 assert.deepEqual(checkMathSteps("x²=2\n2x²=4").entries.map(e=>e.kind),["info","ok"]);
 assert.equal(checkMathSteps("x²=2\nx=1,41421356237").errors,1);
 assert.equal(checkMathSteps("x²+1=0\nx=0").errors,1);
});
test("second degré : rejette les saisies non sûres sans perdre la référence valide",()=>{
 const review=checkMathSteps("x²=4\nx^3=8\n(x-2)(x+2)=0");
 assert.deepEqual(review.entries.map(e=>e.kind),["info","unsupported","info"]);
 assert.equal(review.unsupported,1);
 assert.equal(review.errors,0);
});

test("Dérivées : erreur, correction et référence non contaminée",()=>{
 const result=checkMathSteps("f(x) = 3x² - 2x + 1\nf'(x)=3x-2\nf'(x)=6x-2");
 assert.deepEqual(result.entries.map(e=>e.kind),["info","error","ok"]);
 assert.equal(result.errors,1);
 assert.match(result.entries[1].message,/6x − 2/);
});
test("Dérivées rationnelles et fonctions constantes",()=>{
 assert.deepEqual(checkMathSteps("g(x) = x²/2 + 3x\ng'(x) = x + 3").entries.map(e=>e.kind),["info","ok"]);
 assert.deepEqual(checkMathSteps("f(x) = 8\nf'(x) = 0").entries.map(e=>e.kind),["info","ok"]);
 assert.deepEqual(checkMathSteps("f(x) = -x² + 5\nf'(x) = -2x").entries.map(e=>e.kind),["info","ok"]);
});
test("Dérivées sans définition, séparées ou non polynomiales non validées",()=>{
 assert.equal(checkMathSteps("f'(x)=6x-2").unsupported,1);
 assert.equal(checkMathSteps("f(x)=x²\n\nf'(x)=2x").unsupported,1);
 assert.equal(checkMathSteps("f(x)=x^7\nf'(x)=7x⁶").unsupported,2);
 assert.equal(checkMathSteps("f(x)=x²\ng'(x)=2x").unsupported,1);
 assert.equal(checkMathSteps("f(x)=x²\nx=2\nf'(x)=2x").unsupported,1);
 assert.deepEqual(checkMathSteps("f(x)=x²\nf'(x)=2x\nf'(x)=x").entries.map(e=>e.kind),["info","ok","error"]);
});

test("Dérivées supérieures : correction exacte et explication du coefficient",()=>{
 const a=checkMathSteps("f(x)=(x+1)^3\nf'(x)=3x²+6x+3");
 assert.deepEqual(a.entries.map(e=>e.kind),["info","ok"]);
 const b=checkMathSteps("f(x)=x⁴+1\nf'(x)=3x³\nf'(x)=4x³");
 assert.deepEqual(b.entries.map(e=>e.kind),["info","error","ok"]);
 assert.match(b.entries[1].message,/coefficient attendu 4, obtenu 3/);
 const c=checkMathSteps("f(x)=x⁶\nf'(x)=6x⁵");
 assert.deepEqual(c.entries.map(e=>e.kind),["info","ok"]);
});

test("Racines carrées parfaites : équations et calculs exacts",()=>{
  for(const [text,expected] of [
    ["√(9)=3",true],["√(144)=12",true],["√(9)=4",false],
    ["√(16)/√(4)=2",true],["√(0)=0",true]
  ]){
    const review=checkMathSteps(text);
    assert.equal(review.checked,1,text);
    assert.equal(review.errors,expected?0:1,text);
  }
  const steps=checkMathSteps("x+√(9)=5\nx=2");
  assert.equal(steps.checked,2);
  assert.equal(steps.errors,0);
});
test("Racines non entières et expressions rationnelles : non vérifiées, jamais admises par approximation",()=>{
  for(const text of ["√(x)=√(x)","x*√(x)=2","√(x+1)=x^2","x=1/(x-x)","x=√(x^2)","x=2*√(2x+1)*2"]){
    const review=checkMathSteps(text);
    assert.equal(review.checked,0,text);
    assert.equal(review.unsupported,1,text);
    assert.equal(review.errors,0,text);
  }
  const mixed=checkMathSteps("x=2*√(2)*3\nx=3");
  assert.equal(mixed.unsupported,1);
  assert.equal(mixed.checked,1);
  assert.equal(mixed.errors,0,"Une ligne non vérifiée ne doit pas servir d'étape précédente");
});

test("Solutions irrationnelles exactes : conservation du signe et équivalence des étapes",()=>{
  const same=checkMathSteps("√(x+1)=x\n√(4x+4)=2x");
  assert.deepEqual(same.entries.map(x=>x.kind),["info","ok"]);
  assert.equal(same.errors,0);
  assert.match(same.entries[0].message,/√\(5\)/);
  assert.match(same.entries[0].message,/Méthode guidée/);
  const approximation=checkMathSteps("√(x+1)=x\nx=1,61803398875");
  assert.deepEqual(approximation.entries.map(x=>x.kind),["info","error"]);
  assert.equal(approximation.errors,1);
  const both=checkMathSteps("√(x²-1)=1\nx²=2");
  assert.deepEqual(both.entries.map(x=>x.kind),["info","ok"]);
});
