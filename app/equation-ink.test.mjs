import test from "node:test";
import assert from "node:assert/strict";
import {encodeStroke} from "./workbook.mjs";
import {recognizeEquationInk} from "./equation-ink.mjs";
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
  "/":[[[83,10],[17,94]]]
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
