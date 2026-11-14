import test from "node:test";
import assert from "node:assert/strict";
import {encodeStroke} from "./workbook.mjs";
import {recognizeEquationInk,extractFinalNumericAnswer} from "./equation-ink.mjs";
import {checkMathSteps} from "./math-step-checker.mjs";

// Tracés d'essai dessinés comme des gestes séparés, pas du texte OCR préencodé.
const GLYPHS={
  "0":[[[49,8],[24,15],[12,35],[12,67],[26,89],[49,97],[72,88],[87,65],[86,37],[70,15],[49,8]]],
  "1":[[[50,5],[50,97]]],
  "2":[[[18,26],[30,11],[55,7],[77,17],[83,37],[72,54],[49,73],[20,94],[86,94]]],
  "3":[[[19,14],[47,7],[75,14],[83,31],[68,47],[46,51],[71,53],[85,70],[74,89],[48,97],[17,88]]],
  "4":[[[65,9],[17,66],[91,66]],[[66,9],[66,97]]],
  "5":[[[79,9],[25,9],[20,46],[48,42],[73,49],[84,70],[73,87],[49,95],[20,86]]],
  "6":[[[77,9],[43,27],[22,47],[20,74],[34,93],[62,96],[81,79],[72,59],[50,52],[22,68]]],
  "7":[[[15,12],[87,12],[50,96]]],
  "8":[[[50,51],[25,35],[26,17],[50,8],[75,19],[76,37],[50,51],[26,65],[25,81],[50,97],[75,84],[76,65],[50,51]]],
  "9":[[[75,43],[57,57],[34,52],[20,34],[29,14],[51,7],[74,20],[78,48],[66,73],[41,94],[19,97]]],
  "x":[[[17,10],[83,90]],[[83,10],[17,90]]],
  "+":[[[15,50],[85,50]],[[50,12],[50,88]]],
  "-":[[[15,50],[85,50]]],
  "=":[[[15,40],[85,40]],[[15,60],[85,60]]],
  "/":[[[83,10],[17,94]]],
  "(":[[[78,5],[54,15],[36,31],[27,50],[36,69],[54,86],[78,96]]],
  ")":[[[22,5],[46,15],[64,31],[73,50],[64,69],[46,86],[22,96]]]
};
function ink(lines,scale=.62){
  return lines.flatMap((line,j)=>[...line].flatMap((symbol,i)=>{
    assert.ok(GLYPHS[symbol],"Symbole de test : "+symbol);
    return GLYPHS[symbol].map(path=>encodeStroke(path.map(([x,y])=>[
      Math.round(35+i*70+x*scale),Math.round(35+j*165+y*scale)
    ])));
  }));
}
test("Lire une suite de trois équations de premier degré sur une page",()=>{
  const result=recognizeEquationInk(ink(["2x+5=17","2x=12","x=6"]));
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"2x+5=17\n2x=12\nx=6");
  assert.equal(result.lines,3);
  const review=checkMathSteps(result.text);
  assert.equal(review.checked,3);
  assert.equal(review.errors,0);
  assert.equal(review.unsupported,0);
});
test("La vérification mathématique détecte une transformation incohérente",()=>{
  const result=recognizeEquationInk(ink(["2x+5=17","2x=13","x=6"]));
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"2x+5=17\n2x=13\nx=6");
  assert.ok(checkMathSteps(result.text).errors>0);
});
test("Lire les opérations et les égalités de chiffres sur des lignes distinctes",()=>{
  const result=recognizeEquationInk(ink(["3+4=7","6-2=4"]));
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"3+4=7\n6-2=4");
  assert.equal(checkMathSteps(result.text).errors,0);
});
test("Ne jamais inventer une correction à partir de traits invalides",()=>{
  assert.equal(recognizeEquationInk([]).status,"empty");
  assert.equal(recognizeEquationInk(["<svg>"]).status,"unsupported");
  assert.equal(recognizeEquationInk(Array(91).fill("10,10;20,20")).status,"unsupported");
  const result=recognizeEquationInk(ink(["7","8"]));
  assert.notEqual(result.status,"recognized");
});
test("Ne pas confondre opérateurs superposés avec plusieurs lignes",()=>{
  const result=recognizeEquationInk(ink(["x=1","x=2"],.84));
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"x=1\nx=2");
  assert.equal(checkMathSteps(result.text).errors,1);
});

test("Parenthèses manuscrites : développer une expression affine",()=>{
  const result=recognizeEquationInk(ink(["2(x+1)=8","x=3"]));
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"2(x+1)=8\nx=3");
  const review=checkMathSteps(result.text);
  assert.equal(review.errors,0);
  assert.equal(review.unsupported,0);
});
test("Parenthèses manuscrites : factorisation de degré deux",()=>{
  const result=recognizeEquationInk(ink(["(x-2)(x+2)=0","x=2"]));
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"(x-2)(x+2)=0\nx=2");
  assert.equal(checkMathSteps(result.text).errors,1,"Une seule racine ne remplace pas deux solutions");
});
function powerInk(exponent="2"){
  const draw=(symbol,x,y,scale)=>GLYPHS[symbol].map(path=>encodeStroke(path.map(([px,py])=>
    [Math.round(x+px*scale),Math.round(y+py*scale)])));
  return [
    ...draw("x",35,42,.78),...draw(exponent,113,29,.34),
    ...draw("=",164,42,.78),...draw("4",252,42,.78)
  ];
}
test("Exposant 2 physiquement placé en hauteur à droite",()=>{
  const result=recognizeEquationInk(powerInk());
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"x^2=4");
  assert.equal(checkMathSteps(result.text).unsupported,0);
});
test("Exposant 3 ne peut pas devenir une fausse puissance 2",()=>{
  const result=recognizeEquationInk(powerInk("3"));
  assert.notEqual(result.status,"recognized",JSON.stringify(result));
});
function stackedFractionInk(){
  const draw=(symbol,x,y,scale)=>GLYPHS[symbol].map(path=>encodeStroke(path.map(([px,py])=>
    [Math.round(x+px*scale),Math.round(y+py*scale)])));
  return [
    ...draw("x",24,62,.7),...draw("=",100,62,.7),
    ...draw("1",223,30,.46),encodeStroke([[215,101],[278,101]]),
    ...draw("2",211,119,.46)
  ];
}
test("Fraction empilée (un chiffre de chaque côté) dans une égalité",()=>{
  const result=recognizeEquationInk(stackedFractionInk());
  assert.equal(result.status,"recognized",JSON.stringify(result));
  assert.equal(result.text,"x=1/2");
  assert.equal(checkMathSteps(result.text).unsupported,0);
});
test("Refuser les parenthèses non fermées sans transmettre un calcul trompeur",()=>{
  const result=recognizeEquationInk(ink(["2(x+1=8"]));
  assert.notEqual(result.status,"recognized",JSON.stringify(result));
});

test("Résultat numérique final d'une solution manuscrite : aucune ressaisie",()=>{
  const read=recognizeEquationInk(ink(["2x+5=17","2x=12","x=6"]));
  assert.equal(read.status,"recognized");
  assert.equal(extractFinalNumericAnswer(read.text),"6");
  assert.equal(extractFinalNumericAnswer("x=1/2"),"1/2");
  assert.equal(extractFinalNumericAnswer("x=-3"),"-3");
  assert.equal(extractFinalNumericAnswer("3x=9\nx=3"),"3");
  assert.equal(extractFinalNumericAnswer("x = 0.75"),"0.75");
  assert.equal(extractFinalNumericAnswer("x=0"),"0");
});
test("Ne jamais déduire une réponse d'un brouillon partiel ou d'une identité",()=>{
  for(const text of [
    "2x+5=17","x^2=4","x=3+2","x=1/0","2x=12","6=6","x=abc",
    "x=3\n2x=6","x=Infinity","x=1e9","x=1\nx=3/0",
    "x=1\n", 1, "", "x=1\n".repeat(20)
  ]){
    // Le retour à la ligne final est sans risque et doit rester accepté.
    if(text==="x=1\n"){assert.equal(extractFinalNumericAnswer(text),"1");continue;}
    assert.equal(extractFinalNumericAnswer(text),null,"Input "+JSON.stringify(text));
  }
});
test("Les parenthèses sont reconnues même tracées du bas vers le haut",()=>{
  const lines=["2(x+1)=8","x=3"];
  const strokes=lines.flatMap((line,j)=>[...line].flatMap((symbol,i)=>
    GLYPHS[symbol].map(path=>encodeStroke(
      (symbol==="("||symbol===")"?[...path].reverse():path).map(([x,y])=>[
        Math.round(35+i*70+x*.62),Math.round(35+j*165+y*.62)
      ])
    ))
  ));
  const read=recognizeEquationInk(strokes);
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"2(x+1)=8\nx=3");
  assert.equal(checkMathSteps(read.text).errors,0);
});
test("Petites variations géométriques déterministes : pas de notation implicite",()=>{
  const baseline=ink(["2x+5=17","2x=12","x=6"]);
  const perturbed=baseline.map((encoded,k)=>{
    const pts=encoded.split(";").map((p,j)=>{
      const [x,y]=p.split(",").map(Number);
      return [x+(j%3===0?1:0),y+(j%2===0?1:0)];
    });
    return encodeStroke(pts);
  });
  const read=recognizeEquationInk(perturbed);
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"2x+5=17\n2x=12\nx=6");
});

test("Un symbole composite inconnu rend un brouillon partiel, sans note inventée",()=>{
  const strange=[
    [[290,75],[321,75]],[[305,52],[305,99]],
    [[292,59],[318,91]],[[292,90],[318,59]]
  ].map(encodeStroke);
  const page=[...ink(["x=1"]),...strange];
  const draft=recognizeEquationInk(page,{draft:true});
  assert.equal(draft.status,"partial",JSON.stringify(draft));
  assert.ok(draft.text.includes("□"),JSON.stringify(draft));
  assert.equal(recognizeEquationInk(page).status,"uncertain");
});

function stackedIntegerInk(numerator,denominator,{barEnd=370}={}){
  const draw=(symbol,x,y,scale)=>GLYPHS[symbol].map(points=>encodeStroke(points.map(([px,py])=>
    [Math.round(x+px*scale),Math.round(y+py*scale)])));
  const top=[...numerator].flatMap((digit,i)=>draw(digit,218+i*49,31,.42));
  const bottom=[...denominator].flatMap((digit,i)=>draw(digit,217+i*49,120,.42));
  return [
    ...draw("x",24,64,.7),...draw("=",100,64,.7),
    ...top,encodeStroke([[209,102],[barEnd,102]]),...bottom
  ];
}
test("Fraction empilée : numérateur et dénominateur à deux chiffres",()=>{
  const read=recognizeEquationInk(stackedIntegerInk("12","25"));
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"x=12/25");
  assert.equal(extractFinalNumericAnswer(read.text),"12/25");
  assert.equal(checkMathSteps(read.text).unsupported,0);
});
test("Fraction empilée : zéro au dénominateur non présenté comme résultat valide",()=>{
  const read=recognizeEquationInk(stackedIntegerInk("12","00"),{draft:true});
  assert.notEqual(read.status,"recognized",JSON.stringify(read));
  assert.notEqual(read.text,"x=12/00");
});
test("Fraction empilée : le numérateur contenant x+1 conserve les parenthèses",()=>{
  const draw=(symbol,x,y,scale)=>GLYPHS[symbol].map(points=>encodeStroke(points.map(([px,py])=>
    [Math.round(x+px*scale),Math.round(y+py*scale)])));
  const numerator=["x","+","1"].flatMap((glyph,i)=>draw(glyph,218+i*55,35,.37));
  const page=[
    ...draw("x",25,70,.7),...draw("=",99,70,.7),
    ...numerator,encodeStroke([[209,103],[400,103]]),
    ...draw("2",279,121,.45)
  ];
  const read=recognizeEquationInk(page);
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"x=(x+1)/2");
  assert.equal(checkMathSteps(read.text).unsupported,0);
});
test("Le signe égal de deux barres horizontales ne devient jamais une fraction",()=>{
  const read=recognizeEquationInk(ink(["2x+5=17","2x=12","x=6"]));
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"2x+5=17\n2x=12\nx=6");
});

function radicalInk(radicand="9",{reverse=false}={}){
  const draw=(symbol,x,y,scale)=>GLYPHS[symbol].map(pts=>encodeStroke(pts.map(([px,py])=>
    [Math.round(x+px*scale),Math.round(y+py*scale)])));
  const root=[[213,77],[225,69],[238,105],[257,31],[271,31],[360,31]];
  const rootStroke=reverse?[...root].reverse():root;
  return [
    ...draw("x",24,62,.7),...draw("=",100,62,.7),
    encodeStroke(rootStroke),
    ...[...radicand].flatMap((symbol,i)=>draw(symbol,281+i*43,40,.52))
  ];
}
test("Racine carrée manuscrite : barre et radicande sous le signe",()=>{
  for(const reverse of [false,true]){
    const read=recognizeEquationInk(radicalInk("9",{reverse}));
    assert.equal(read.status,"recognized",JSON.stringify(read));
    assert.equal(read.text,"x=√(9)");
    assert.equal(checkMathSteps(read.text).unsupported,0);
    assert.equal(checkMathSteps(read.text).errors,0);
    assert.equal(extractFinalNumericAnswer(read.text),null,"Une racine n'est pas une valeur numérique devinée");
  }
});
test("Racine d'entier non carré parfait : transcription sans fausse correction",()=>{
  const read=recognizeEquationInk(radicalInk("2"));
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"x=√(2)");
  const review=checkMathSteps(read.text);
  assert.equal(review.checked,0);
  assert.equal(review.unsupported,1);
});
function rationalDenominatorInk(denominator="x+1"){
  const draw=(symbol,x,y,scale)=>GLYPHS[symbol].map(pts=>encodeStroke(pts.map(([px,py])=>
    [Math.round(x+px*scale),Math.round(y+py*scale)])));
  return [
    ...draw("x",24,64,.7),...draw("=",100,64,.7),
    ...draw("2",278,31,.43),
    encodeStroke([[211,102],[410,102]]),
    ...[...denominator].flatMap((symbol,i)=>draw(symbol,230+i*56,122,.4))
  ];
}
test("Fraction algébrique verticale : dénominateur x+1 parenthésé",()=>{
  const read=recognizeEquationInk(rationalDenominatorInk("x+1"));
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"x=2/(x+1)");
  const review=checkMathSteps(read.text);
  assert.equal(review.checked,0,"Une division par x ne doit pas produire de faux résultat");
  assert.equal(review.unsupported,1);
});
test("Dénominateur identiquement nul : expression refusée",()=>{
  const read=recognizeEquationInk(rationalDenominatorInk("x-x"),{draft:true});
  assert.notEqual(read.text,"x=2/(x-x)");
  assert.notEqual(read.status,"recognized",JSON.stringify(read));
});
test("Aucun signe racine à partir d'un 7 ou d'une barre simple",()=>{
  const read=recognizeEquationInk(ink(["7+1=8"]));
  assert.equal(read.status,"recognized",JSON.stringify(read));
  assert.equal(read.text,"7+1=8");
});
