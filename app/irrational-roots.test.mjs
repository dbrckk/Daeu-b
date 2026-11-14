import test from "node:test";
import assert from "node:assert/strict";
import {classifyEquality,checkMathSteps} from "./math-step-checker.mjs";
import {sameRealSolutions} from "./quadratic-checker.mjs";

test("La racine inférieure d'une équation quadratique irrationnelle est rejetée uniquement si son signe est négatif",()=>{
  const a=classifyEquality("√(x+1)=x-2");
  assert.equal(a.kind,"unique");
  assert.equal(a.solution,"(5+√(13))/2");
  assert.deepEqual(a.rejectedCandidates,["(5-√(13))/2"]);
  assert.equal(a.irrationalExact,true);
  const b=classifyEquality("√(4x+4)=2x-4");
  assert.equal(sameRealSolutions(a,b),true);
  assert.deepEqual(checkMathSteps("√(x+1)=x-2\n√(4x+4)=2x-4")
    .entries.map(e=>e.kind),["info","ok"]);
});
test("Le signe de la racine ne dépend pas de l'ordre des membres de l'égalité",()=>{
  const first=classifyEquality("√(x+1)=x");
  const second=classifyEquality("x=√(x+1)");
  assert.equal(sameRealSolutions(first,second),true);
  assert.equal(first.solution,second.solution);
  assert.deepEqual(checkMathSteps("√(x+1)=x\nx=√(x+1)")
    .entries.map(e=>e.kind),["info","ok"]);
});
test("Un carré de dénominateur rationnel produit une expression radicale exacte",()=>{
  const a=classifyEquality("√(1/2)=x");
  const b=classifyEquality("x=√(1/2)");
  assert.equal(a.kind,"unique");
  assert.equal(a.solution,"√(1/2)");
  assert.equal(sameRealSolutions(a,b),true);
  assert.equal(checkMathSteps("x=√(1/2)\nx=0,70710678118").errors,1);
});
test("Un membre sans racine strictement négatif rejette toutes les solutions irrationnelles",()=>{
  const noSolutions=classifyEquality("√(x²-1)=-1");
  assert.equal(noSolutions.kind,"none");
  assert.deepEqual(noSolutions.rejectedCandidates,["-√(2)","√(2)"]);
  const both=classifyEquality("√(x²-1)=1");
  assert.equal(both.kind,"two");
  assert.equal(both.solutions,null);
  assert.equal(sameRealSolutions(noSolutions,both),false);
});
test("Les limites non décidables exactement ne sont pas converties en valeurs vraies",()=>{
  for(const source of [
    "√(x²)=x","√(x+1)=x²","√(x)=√(x)",
    "√(x+1)+2=x","√(x²+2)=√(x+2)"
  ]){
    const s=checkMathSteps(source);
    assert.equal(s.checked,0,source);
    assert.equal(s.unsupported,1,source);
  }
});
