import test from "node:test";
import assert from "node:assert/strict";
import {parseMathLine} from "./math-preview.mjs";

test("Affichage structurel des fractions et puissances, sans calcul approximatif",()=>{
  const fraction=parseMathLine("(x+1)/2");
  assert.equal(fraction.type,"fraction");
  assert.equal(fraction.left.type,"group");
  assert.equal(fraction.right.value,"2");
  const power=parseMathLine("x^2 = 4");
  assert.equal(power.type,"binary");
  assert.equal(power.left.type,"power");
  assert.equal(power.op,"=");
  assert.equal(parseMathLine("x²").exponent.value,"2");
});
test("Racines, décimaux français et symboles mathématiques",()=>{
  const result=parseMathLine("√(x+1) ≤ 1,5");
  assert.equal(result.op,"≤");
  assert.equal(result.left.type,"sqrt");
  assert.equal(result.right.value,"1,5");
  assert.equal(parseMathLine("π×2").op,"×");
  assert.equal(parseMathLine("(numérateur)/(dénominateur)").type,"fraction");
  assert.equal(parseMathLine("2x+5=17").right.value,"17");
});
test("Les entrées malformées et non mathématiques ne sont jamais inventées",()=>{
  for(const s of ["", "x=1=2", "x=", "1/","x<alert(1)>", "<img src=x onerror=alert(1)>", "sin(x) : preuve", "f'(x)"])
    assert.equal(parseMathLine(s),null,s);
  assert.equal(parseMathLine("(".repeat(40)+"x"+")".repeat(40)),null);
  assert.equal(parseMathLine("1".repeat(190)),null);
});
test("Priorité des fractions, somme et signes",()=>{
  const ast=parseMathLine("-x²+3/4");
  assert.equal(ast.type,"binary");
  assert.equal(ast.left.type,"unary");
  assert.equal(ast.left.arg.type,"power");
  assert.equal(ast.right.type,"fraction");
});

test("Fonctions et dérivées affichables en MathML sûr",()=>{
 const f=parseMathLine("f(x)=3x²-2x+1");
 const p=parseMathLine("f'(x)=6x-2");
 assert.equal(f.type,"functionDefinition");
 assert.equal(f.prime,false);
 assert.equal(p.type,"functionDefinition");
 assert.equal(p.prime,true);
 assert.equal(parseMathLine("f'(x)=sin(x)"),null);
 assert.equal(parseMathLine("f''(x)=2"),null);
});
