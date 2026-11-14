import test from "node:test";
import assert from "node:assert/strict";
import {classifyConstrainedEquality} from "./constraint-solver.mjs";
import {classifyEquality,checkMathSteps} from "./math-step-checker.mjs";
import {sameRealSolutions} from "./quadratic-checker.mjs";

test("Quotients rationnels : résoudre et éliminer exactement les valeurs interdites",()=>{
  for(const [input,solution,exclusions] of [
    ["1/(x-1)=2","3/2",["1"]],
    ["2/(x+1)=1","1",["-1"]],
    ["(x+1)/(x-1)=2","3",["1"]],
    ["x/(x-1)=2/(x-1)","2",["1"]],
    ["1/x=2","1/2",["0"]]
  ]){
    const result=classifyEquality(input);
    assert.equal(result.kind,"unique",input);
    assert.equal(result.solution,solution,input);
    assert.deepEqual(result.domainExclusions,exclusions,input);
  }
});
test("Dénominateur annulé : une racine du produit croisé est toujours rejetée",()=>{
  const dropped=classifyEquality("(x^2-1)/(x-1)=2");
  assert.equal(dropped.kind,"none");
  assert.deepEqual(dropped.rejectedCandidates,["1"]);
  assert.deepEqual(dropped.domainExclusions,["1"]);
  assert.equal(classifyEquality("1/(x-1)=0").kind,"none");
  assert.equal(classifyEquality("1/x=1/(x+1)").kind,"none");
  assert.deepEqual(classifyEquality("1/x=1/(x+1)").domainExclusions,["-1","0"]);
});
test("Identité rationnelle : domaine exclu conservé, aucune fausse solution universelle",()=>{
  const identity=classifyEquality("(x-1)/(x-1)=1");
  assert.equal(identity.kind,"allExcept");
  assert.deepEqual(identity.excluded,["1"]);
  assert.equal(sameRealSolutions(identity,classifyEquality("1=1")),false);
  assert.equal(sameRealSolutions(identity,classifyEquality("(x-1)/(x-1)=1")),true);
  assert.deepEqual(checkMathSteps("(x-1)/(x-1)=1\n1=1").entries.map(e=>e.kind),
    ["info","error"]);
  assert.deepEqual(checkMathSteps("(x-1)/(x-1)=1\n(x^2-1)/(x-1)=x+1")
    .entries.map(e=>e.kind),["info","ok"]);
});
test("Une solution rationnelle conserve son ensemble exact entre étapes",()=>{
  const check=checkMathSteps("1/(x-1)=2\nx=3/2");
  assert.deepEqual(check.entries.map(e=>e.kind),["info","ok"]);
  assert.match(check.entries[0].message,/x = 1/);
  assert.equal(checkMathSteps("1/(x-1)=2\nx=1").errors,1);
});
test("Radical affine : mise au carré puis signe et substitution exacte",()=>{
  for(const [input,expected] of [
    ["√(x)=2","4"],
    ["√(x+1)=3","8"],
    ["x=√(x+1)+0",null],
    ["√(x+1)=x-1","3"],
    ["2=√(x+1)","3"],
    ["√(4x+9)=5","4"]
  ]){
    if(expected===null){
      assert.equal(checkMathSteps(input).unsupported,1,input);
      continue;
    }
    const result=classifyEquality(input);
    assert.equal(result.kind,"unique",input);
    assert.equal(result.solution,expected,input);
    assert.equal(result.radicalEquation,true,input);
  }
  const trap=classifyEquality("√(x+1)=x-1");
  assert.deepEqual(trap.rejectedCandidates,["0"]);
  assert.deepEqual(checkMathSteps("√(x+1)=x-1\nx=3").entries.map(e=>e.kind),
    ["info","ok"]);
  assert.equal(checkMathSteps("√(x+1)=x-1\nx=0").errors,1);
});
test("Racines parasites, négativité et absence de solution",()=>{
  const falseSign=classifyEquality("√(x+1)=-2");
  assert.equal(falseSign.kind,"none");
  assert.deepEqual(falseSign.rejectedCandidates,["3"]);
  assert.equal(classifyEquality("√(-1)=x").kind,"none");
  assert.equal(classifyEquality("√(x^2+1)=0").kind,"none");
});
test("Deux racines exactes conservées, et perte d'une racine détectée",()=>{
  const result=classifyEquality("√(x^2-5)=2");
  assert.equal(result.kind,"two");
  assert.deepEqual(result.solutions,["-3","3"]);
  assert.equal(checkMathSteps("√(x²-5)=2\nx²=9").errors,0);
  assert.equal(checkMathSteps("√(x²-5)=2\nx=3").errors,1);
});
test("Racines irrationnelles ou contraintes continues : ne pas déclarer de faux verdict",()=>{
  for(const input of [
    "√(x+1)=x","√(x^2)=x","x=√(x+1)","√(x)=√(x)",
    "√(x+1)=x^2","x+√(x)=5","√(x^2-1)=1"
  ]){
    const review=checkMathSteps(input);
    // √(x²-1)=1 admet ±√2, non représentables par ce sous-solveur.
    assert.equal(review.checked,0,input);
    assert.equal(review.unsupported,1,input);
  }
});
test("Expressions hors périmètre et entrées hostile : aucune conversion en équation valide",()=>{
  for(const input of [
    "1/(x^2-1)=2","1/(x-1)+1=2","x+1/(x-1)=2",
    "1/x+1=2","x-1/(x-1)=2","1/(x-x)=2",
    "1/(0*x)=2","x=1/(x-1)=3","x=1/(x-1);alert(1)",
    "√(x+1)=√(x+1)","√(1/(x-1))=2","1/(x-1)/(x+1)=2"
  ]){
    assert.equal(checkMathSteps(input).unsupported,1,input);
  }
});
test("L'équation auxiliaire ne remplace jamais l'originale dans la suite",()=>{
  const a=checkMathSteps("√(x+1)=x-1\nx^2-3x=0");
  assert.equal(a.errors,1,"La racine parasite 0 réapparaît dans l'équation mise au carré");
  const b=checkMathSteps("(x-1)/(x-1)=1\nx-x=0");
  assert.equal(b.errors,1,"La restriction x ≠ 1 a été oubliée");
});
