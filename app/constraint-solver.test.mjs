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
    ["x=√(x+1)*2",null],
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
    "√(x^2)=x","√(x)=√(x)",
    "√(x+1)=x^2","2*√(x)=5","√(x)*(x+1)=2"
  ]){
    const review=checkMathSteps(input);
    // Les radicaux imbriqués et les expressions non isolées restent refusés.
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

test("Racines irrationnelles exactes : garder seulement la branche au signe admissible",()=>{
  const plus=classifyEquality("√(x+1)=x");
  assert.equal(plus.kind,"unique");
  assert.equal(plus.solution,"(1+√(5))/2");
  assert.equal(plus.irrationalExact,true);
  assert.deepEqual(plus.rejectedCandidates,["(1-√(5))/2"]);
  assert.equal(plus.algebraic.branch,"upper");
  assert.equal(plus.algebraic.normalizedB.n,-1n);
  assert.equal(plus.algebraic.normalizedC.n,-1n);
  assert.match(plus.domainInfo,/sans arrondi/);
  assert.deepEqual(checkMathSteps("√(x+1)=x\nx=1,61803398875")
    .entries.map(r=>r.kind),["info","error"],"Une approximation ne prouve pas une égalité exacte");
});
test("Branche négative : contrôle algébrique et comparaison avec la même racine",()=>{
  const lower=classifyEquality("√(x+1)=-x");
  assert.equal(lower.kind,"unique");
  assert.equal(lower.solution,"(1-√(5))/2");
  assert.deepEqual(lower.rejectedCandidates,["(1+√(5))/2"]);
  const equivalent=classifyEquality("√(4x+4)=-2x");
  assert.equal(sameRealSolutions(lower,equivalent),true);
  assert.equal(sameRealSolutions(lower,classifyEquality("√(x+1)=x")),false);
  assert.deepEqual(checkMathSteps("√(x+1)=-x\n√(4x+4)=-2x")
    .entries.map(r=>r.kind),["info","ok"]);
});
test("Équivalences irrationnelles indépendantes des coefficients du polynôme auxiliaire",()=>{
  const first=classifyEquality("√(x+1)=x");
  const second=classifyEquality("√(4x+4)=2x");
  assert.equal(first.kind,"unique");assert.equal(second.kind,"unique");
  assert.equal(sameRealSolutions(first,second),true);
  assert.deepEqual(checkMathSteps("√(x+1)=x\n√(4x+4)=2x")
    .entries.map(r=>r.kind),["info","ok"]);
  assert.match(checkMathSteps("√(x+1)=x").entries[0].message,/Méthode guidée/);
  assert.match(checkMathSteps("√(x+1)=x").entries[0].message,/mettre au carré/);
});
test("Deux solutions irrationnelles réelles conservées sans arrondi",()=>{
  for(const [root,polynomial] of [
    ["√(x²-1)=1","x²=2"],
    ["√(x²-5)=1","x²=6"]
  ]){
    const a=classifyEquality(root),b=classifyEquality(polynomial);
    assert.equal(a.kind,"two",root);
    assert.equal(a.solutions,null,root);
    assert.equal(a.irrationalExact,true,root);
    assert.deepEqual(a.rejectedCandidates,[]);
    assert.equal(sameRealSolutions(a,b),true,root);
    assert.deepEqual(checkMathSteps(root+"\n"+polynomial).entries.map(r=>r.kind),
      ["info","ok"],root);
  }
});
test("Une racine irrationnelle négative écrite au toucher est une solution exacte distincte",()=>{
  const minus=classifyEquality("x=-√(2)");
  const plus=classifyEquality("x=√(2)");
  const square=classifyEquality("x²=2");
  assert.equal(minus.kind,"unique");assert.equal(minus.solution,"-√(2)");
  assert.equal(plus.kind,"unique");assert.equal(plus.solution,"√(2)");
  assert.equal(sameRealSolutions(minus,plus),false);
  assert.equal(sameRealSolutions(minus,square),false);
  assert.equal(sameRealSolutions(plus,square),false);
  assert.deepEqual(checkMathSteps("x=-√(2)\n-√(2)=x").entries.map(r=>r.kind),
    ["info","ok"]);
});
test("Méthode rationnelle complète : valeurs interdites et produit croisé explicites",()=>{
  const result=classifyEquality("1/(x-1)=2");
  assert.equal(result.kind,"unique");
  assert.deepEqual(result.domainExclusions,["1"]);
  assert.equal(result.methodSteps.length,3);
  assert.match(result.methodSteps[0],/x ≠ 1/);
  assert.match(result.methodSteps[1],/1 = 2x - 2/);
  assert.match(checkMathSteps("1/(x-1)=2").entries[0].message,/Méthode guidée/);
});

test("Une racine additionnée à une constante est isolée et vérifiée, des deux côtés",()=>{
  const samples=[
    ["√(x)+2=x","4"],
    ["2+√(x)=x","4"],
    ["x=√(x)+2","4"],
    ["x-√(x)=2","4"],
    ["-√(x)+x=2","4"],
    ["-√(x)+2=x","1"],
    ["x=2-√(x)","1"],
    ["√(x)+2=2","0"],
    ["√(x)-2=0","4"],
    ["√(x)+(x-1)=5","4"]
  ];
  for(const [equation,solution] of samples){
    const a=classifyEquality(equation),b=classifyEquality("x="+solution);
    assert.equal(a.kind,"unique",equation);
    assert.equal(a.solution,solution,equation);
    assert.equal(sameRealSolutions(a,b),true,equation);
    assert.equal(a.methodSteps.length,4,equation);
    assert.match(a.methodSteps[0],/Isoler la racine|déjà isolée/,equation);
    assert.deepEqual(checkMathSteps(equation+"\nx="+solution).entries.map(e=>e.kind),
      ["info","ok"],equation);
  }
});
test("Solutions parasites après déplacement du radical : contrôle de signe conservé",()=>{
  const result=classifyEquality("√(x)+2=x");
  assert.equal(result.kind,"unique");assert.equal(result.solution,"4");
  assert.deepEqual(result.rejectedCandidates,["1"]);
  assert.equal(checkMathSteps("√(x)+2=x\nx=1").errors,1);
  const opposite=classifyEquality("2-√(x)=x");
  assert.deepEqual(opposite.rejectedCandidates,["4"]);
  assert.equal(opposite.solution,"1");
  const no=classifyEquality("√(x)-x=1");
  assert.equal(no.kind,"none");
});
test("Déplacement de la racine et filtrage exact des solutions irrationnelles",()=>{
  const a=classifyEquality("√(x+1)+2=x");
  const b=classifyEquality("√(x+1)=x-2");
  assert.equal(a.kind,"unique");
  assert.equal(a.solution,"(5+√(13))/2");
  assert.deepEqual(a.rejectedCandidates,["(5-√(13))/2"]);
  assert.equal(sameRealSolutions(a,b),true);
  assert.deepEqual(checkMathSteps("√(x+1)+2=x\n√(x+1)=x-2")
    .entries.map(e=>e.kind),["info","ok"]);
  const c=classifyEquality("x+√(x)=5");
  assert.equal(c.kind,"unique");
  assert.equal(c.solution,"(11-√(21))/2");
  assert.deepEqual(c.rejectedCandidates,["(11+√(21))/2"]);
  assert.equal(checkMathSteps("x+√(x)=5\nx=5").errors,1);
});
test("Un radical avec plusieurs termes affines reste comparé exactement",()=>{
  for(const expression of [
    "√(x)+x-1=4","x-1+√(x)=4",
    "4=√(x)+x-1"
  ]){
    const a=classifyEquality(expression);
    const b=classifyEquality("x+√(x)=5");
    assert.equal(sameRealSolutions(a,b),true,expression);
  }
});
test("Les multiplications, racines multiples et expressions quadratiques autour du radical sont refusées",()=>{
  const unsupported=[
    "2√(x)=4","2*√(x)=4","√(x)*2=4","√(x)/2=4",
    "x*√(x)=4","√(x)+√(x)=4","x+√(x²)+√(x)=4",
    "√(x)+x²=4","x²-√(x)=4",
    "√(x)²+1=5","√(x)+2/(x-1)=5",
    "x+√(x)=√(x)+1","x++√(x)=2","x--√(x)=2",
    "√(x)+1/0=4"
  ];
  for(const expression of unsupported){
    const review=checkMathSteps(expression);
    assert.equal(review.checked,0,expression);
    assert.equal(review.unsupported,1,expression);
  }
});
