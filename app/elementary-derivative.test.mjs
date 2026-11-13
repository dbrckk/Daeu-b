import test from "node:test";
import assert from "node:assert/strict";
import {parseElementaryFunction,parseElementaryQuotient,formatElementary,
  expectedElementaryDerivative,equivalentElementary,elementaryRule} from "./elementary-derivative.mjs";
import {parseFunctionLine,checkDerivativeCandidate} from "./derivative-checker.mjs";
import {checkMathSteps} from "./math-step-checker.mjs";

const review=(source,answer)=>checkDerivativeCandidate(
  parseFunctionLine("f(x)="+source),parseFunctionLine("f'(x)="+answer));

test("règle de chaîne exacte : sinus, cosinus et exponentielle",()=>{
  for(const [f,derivative] of [
    ["sin(x)","cos(x)"],
    ["2sin(3x+1)+4","6cos(3x+1)"],
    ["cos(x)","-sin(x)"],
    ["-3cos(2x-1)","6sin(2x-1)"],
    ["exp(x)","exp(x)"],
    ["1/2exp(4x-1)-3","2exp(4x-1)"],
    ["sin(x/2)","1/2cos(x/2)"]
  ]){
    const outcome=review(f,derivative);
    assert.equal(outcome.correct,true,f+" => "+derivative);
    assert.match(outcome.rule,/u'/);
  }
});
test("logarithme : règle de chaîne, domaine et quotients équivalents",()=>{
  assert.equal(review("ln(x)","1/x").correct,true);
  assert.equal(review("ln(2x+2)","2/(2x+2)").correct,true);
  assert.equal(review("ln(2x+2)","1/(x+1)").correct,true);
  assert.equal(review("3ln(2x+1)+5","6/(2x+1)").correct,true);
  assert.equal(review("ln(2x+1)","1/(2x+1)").correct,false);
  assert.match(review("ln(2x+1)","2/(2x+1)").rule,/Domaine.*> 0/);
});
test("erreurs fréquentes : coefficient de chaîne, signe, argument et constante",()=>{
  for(const [f,wrong] of [
    ["sin(2x)","cos(2x)"],
    ["cos(x)","sin(x)"],
    ["2exp(3x)","2exp(3x)"],
    ["sin(x+1)","cos(x-1)"],
    ["sin(x)","cos(x)+1"],
    ["sin(x)","sin(x)"],
    ["sin(x)","0"]
  ])assert.equal(review(f,wrong).correct,false,f+" -> "+wrong);
  assert.equal(review("sin(2x)","2cos(2x)").expected,"f'(x) = 2cos(2x)");
});
test("refuse fonctions plus complexes, dénominateurs variables abusifs et entrées hostiles",()=>{
  for(const bad of [
    "sin(x²)","sin(x)+x","sin(x)cos(x)","ln(x²)","ln(1)",
    "sin(y)","Math.sin(x)","sin(x);alert(1)","sin(x)^2",
    "sin((x))","3*sin(x)+x","1/0sin(x)"
  ])assert.throws(()=>parseElementaryFunction(bad),bad);
  for(const bad of ["1/(x²+1)","x/(x+1)","1/(x-x)","1/(1)","1/x+1","2/(x+1);evil()"])
    assert.throws(()=>parseElementaryQuotient(bad),bad);
  assert.throws(()=>parseFunctionLine("f(x)=1/x"));
  assert.throws(()=>parseFunctionLine("f(x)=sin(x²)"));
  assert.throws(()=>parseFunctionLine("f'(x)=1/(x²+1)"));
});
test("notation et intégration à la correction pas à pas",()=>{
  const source=parseElementaryFunction("2sin(3x+1)+4");
  assert.equal(formatElementary(source),"2sin(3x + 1) + 4");
  assert.equal(formatElementary(expectedElementaryDerivative(source)),"6cos(3x + 1)");
  assert.equal(equivalentElementary(parseElementaryFunction("6cos(3x+1)"),
    expectedElementaryDerivative(source)),true);
  assert.match(elementaryRule(parseElementaryFunction("ln(x+1)")) ,/Domaine/);
  const result=checkMathSteps("f(x)=sin(2x)\nf'(x)=cos(2x)\nf'(x)=2cos(2x)");
  assert.deepEqual(result.entries.map(item=>item.kind),["info","error","ok"]);
  assert.equal(result.errors,1);
  const noContext=checkMathSteps("f'(x)=cos(x)");
  assert.equal(noContext.unsupported,1);
  const separate=checkMathSteps("f(x)=sin(x)\n\nf'(x)=cos(x)");
  assert.equal(separate.unsupported,1);
  assert.equal(checkMathSteps("f(x)=ln(2x+1)\nf'(x)=2/(2x+1)").errors,0);
});
