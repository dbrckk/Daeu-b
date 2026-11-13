import test from "node:test";
import assert from "node:assert/strict";
import {parseFunctionLine,checkDerivativeCandidate,formatPolynomial,derivativeCoefficients,isFunctionNotation} from "./derivative-checker.mjs";
import {parsePolynomial} from "./quadratic-checker.mjs";
const compare=(definition,step)=>checkDerivativeCandidate(parseFunctionLine(definition),parseFunctionLine(step));
test("Dérivation exacte du trinôme et calculs intermédiaires",()=>{
 assert.deepEqual(derivativeCoefficients(parsePolynomial("3x²-2x+1")).map(q=>String(q.n)+"/"+String(q.d)),["-2/1","6/1","0/1"]);
 assert.equal(compare("f(x)=3x²-2x+1","f'(x)=6x-2").correct,true);
 assert.equal(compare("f(x)=(x-1)²","f'(x)=2(x-1)").correct,true);
 assert.equal(compare("g(x)=x²/2+3x","g'(x)=x+3").correct,true);
 assert.equal(compare("h(x)=x²+2x+1","h'(x)=2x+2").correct,true);
});
test("Détecte coefficient oublié, signe, constante et dérivée identiquement nulle",()=>{
 const result=compare("f(x)=3x²-2x+1","f'(x)=3x-2");
 assert.equal(result.correct,false);
 assert.equal(result.expected,"f'(x) = 6x − 2");
 assert.equal(compare("f(x)=3x²-2x+1","f'(x)=6x+2").correct,false);
 assert.equal(compare("f(x)=3x²-2x+1","f'(x)=6x-2+1").correct,false);
 assert.equal(compare("f(x)=7","f'(x)=0").correct,true);
 assert.equal(compare("f(x)=-3x+1","f'(x)=-3").correct,true);
});
test("Fractions exactes, jamais comparaison flottante",()=>{
 assert.equal(compare("f(x)=1/3x²+1/2x","f'(x)=2/3x+1/2").correct,true);
 assert.equal(compare("f(x)=1/3x²","f'(x)=0,666666x").correct,false);
 assert.equal(compare("f(x)=x²/4","f'(x)=x/2").correct,true);
});
test("Constantes, identifiant de fonction et limites de syntaxe",()=>{
 assert.equal(formatPolynomial(parsePolynomial("0")),"0");
 assert.equal(formatPolynomial(parsePolynomial("-x²+2x-1")),"−x² + 2x − 1");
 assert.equal(isFunctionNotation("f'(x) = 2x"),true);
 assert.equal(isFunctionNotation("2x = 4"),false);
 for(const line of ["f(x)=x^3","f(x)=sin(x)","f'(x)=1/x","f''(x)=2","f(x)=eval(1)","f(y)=x²","f(x)=x²=2"])
  assert.throws(()=>parseFunctionLine(line),line);
 assert.throws(()=>checkDerivativeCandidate(parseFunctionLine("f(x)=x²"),parseFunctionLine("g'(x)=2x")));
});
