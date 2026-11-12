import test from "node:test";
import assert from "node:assert/strict";
import {parsePolynomial,classifyPolynomialEquality as classify,sameRealSolutions,formatExact} from "./quadratic-checker.mjs";

test("Développe exactement les produits, carrés et coefficients fractionnaires",()=>{
  const p=parsePolynomial("(x-2)(x+2)");
  assert.deepEqual(p.map(formatExact),["-4","0","1"]);
  assert.deepEqual(parsePolynomial("(x-1)²").map(formatExact),["1","-2","1"]);
  assert.deepEqual(parsePolynomial("1/2x^2 - 3x + 1/4").map(formatExact),["1/4","-3","1/2"]);
  assert.deepEqual(parsePolynomial("2x(x+3)").map(formatExact),["0","6","2"]);
  assert.deepEqual(parsePolynomial("−x²+2x+3".replace("−","-")).map(formatExact),["3","2","-1"]);
});
test("Deux racines rationnelles et transformations réellement équivalentes",()=>{
  const a=classify("x² - 5x + 6=0"),b=classify("(x-2)(x-3)=0");
  assert.equal(a.kind,"two");assert.deepEqual(a.solutions,["2","3"]);
  assert.equal(a.discriminant,"1");assert.equal(sameRealSolutions(a,b),true);
  assert.equal(sameRealSolutions(a,classify("x=2")),false);
  assert.equal(sameRealSolutions(a,classify("x² - 5x + 5=0")),false);
  assert.deepEqual(classify("x^2=4").solutions,["-2","2"]);
  assert.deepEqual(classify("x*x=4").solutions,["-2","2"]);
});
test("Racine double et équivalence avec une équation affine",()=>{
  const a=classify("(x-1)^2=0"),b=classify("x=1");
  assert.equal(a.kind,"unique");assert.equal(a.repeated,true);
  assert.equal(a.discriminant,"0");assert.equal(sameRealSolutions(a,b),true);
  assert.equal(sameRealSolutions(classify("x²=0"),classify("x=0")),true);
});
test("Aucune solution réelle sans faux calcul de racines complexes",()=>{
  const a=classify("x²+1=0");
  assert.equal(a.kind,"none");assert.equal(a.discriminant,"-4");
  assert.equal(sameRealSolutions(a,classify("x²+2=0")),true);
  assert.equal(sameRealSolutions(a,classify("x=2")),false);
});
test("Racines irrationnelles conservées symboliquement",()=>{
  const a=classify("x²=2"),b=classify("2x²=4");
  assert.equal(a.kind,"two");assert.equal(a.solutions,null);
  assert.match(a.radical,/√\(8\)/);
  assert.equal(sameRealSolutions(a,b),true);
  assert.equal(sameRealSolutions(a,classify("x²=3")),false);
});
test("Échecs explicites pour degré supérieur, division par x et saisie hostile",()=>{
  for(const line of ["x^3=1","x²*x=1","1/x=2","x/(x-1)=0","(x+1)^4=0","x²=1=2","x²=alert(1)","x²=2e10","x²=1/0","x²=√4"]){
    assert.throws(()=>classify(line),line);
  }
  assert.throws(()=>parsePolynomial("(".repeat(30)+"x"+")".repeat(30)));
  assert.throws(()=>parsePolynomial("9".repeat(40)));
});
