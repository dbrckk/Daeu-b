import test from "node:test";
import assert from "node:assert/strict";
import {recognizeBottomNumericInk,recognizeNumericInk,recognizeStackedFractionInk} from "./numeric-ink.mjs";
import {encodeStroke} from "./workbook.mjs";
import {gradeAnswer} from "./engine.mjs";

// Dessins vectoriels de test non téléchargés : translation et échelle arbitraires.
const GLYPHS={
  "0":[[[50,10],[25,15],[12,35],[12,65],[26,88],[50,95],[73,86],[88,62],[85,37],[69,15],[50,10]]],
  "1":[[[50,5],[50,97]]],
  "2":[[[18,26],[30,11],[55,7],[77,17],[83,37],[72,54],[49,73],[20,94],[86,94]]],
  "3":[[[19,14],[47,7],[75,14],[83,31],[68,47],[46,51],[71,53],[85,70],[74,89],[48,97],[17,88]]],
  "4":[[[65,9],[17,66],[91,66]],[[66,9],[66,97]]],
  "5":[[[79,9],[25,9],[20,46],[48,42],[73,49],[84,70],[73,87],[49,95],[20,86]]],
  "6":[[[77,9],[43,27],[22,47],[20,74],[34,93],[62,96],[81,79],[72,59],[50,52],[22,68]]],
  "7":[[[15,12],[87,12],[50,96]]],
  "8":[[[50,51],[25,35],[26,17],[50,8],[75,19],[76,37],[50,51],[26,65],[25,81],[50,97],[75,84],[76,65],[50,51]]],
  "9":[[[75,43],[57,57],[34,52],[20,34],[29,14],[51,7],[74,20],[78,48],[66,73],[41,94],[19,97]]],
  "/":[[[83,10],[17,94]]],
  "-":[[[20,50],[80,50]]],
  ".":[[[49,92],[51,94]]]
};
function ink(value,scale=.68){
  return [...value].flatMap((symbol,i)=>
    GLYPHS[symbol].map(stroke=>encodeStroke(stroke.map(([x,y])=>[
      Math.round(40+i*115+x*scale),Math.round(50+y*scale)
    ]))));
}
test("Lecture pure locale : chiffres isolés avec échelle et décalage",()=>{
  for(const digit of "0123456789"){
    const result=recognizeNumericInk(ink(digit));
    assert.equal(result.status,"recognized",digit+" "+JSON.stringify(result));
    assert.equal(result.text,digit);
  }
});
test("Réponse à plusieurs chiffres, nombre signé, fraction et décimal",()=>{
  for(const value of ["12","21","-7","-12","3/4","1.2","0.75","-0.5","0/4","2/3"]){
    const result=recognizeNumericInk(ink(value));
    assert.equal(result.status,"recognized",value+" "+JSON.stringify(result));
    assert.equal(result.text,value);
  }
});
test("Corriger une transcription confirmée avec le même moteur objectif",()=>{
  const recognized=recognizeNumericInk(ink("3/4"));
  assert.equal(recognized.text,"3/4");
  assert.equal(gradeAnswer({type:"number",answer:.75},recognized.text).correct,true);
  assert.equal(gradeAnswer({type:"number",answer:1.5},recognized.text).correct,false);
});
test("Ne pas inventer une lecture des brouillons complexes ou corrompus",()=>{
  assert.equal(recognizeNumericInk([]).status,"empty");
  assert.notEqual(recognizeNumericInk(["<svg>"]).status,"recognized");
  assert.notEqual(recognizeNumericInk(Array(21).fill("1,2;3,4")).status,"recognized");
  assert.notEqual(recognizeNumericInk(["1,1;1,500"]).status,"recognized");
});

test("Le classement de 300 points manuscrits reste borné sur téléphone",()=>{
  const stroke=encodeStroke(Array.from({length:300},(_,i)=>{
    const t=2*Math.PI*i/299;
    return [Math.round(130+62*Math.cos(t)),Math.round(145+82*Math.sin(t))];
  }));
  const start=performance.now();
  const result=recognizeNumericInk([stroke]);
  assert.ok(["recognized","uncertain","unsupported"].includes(result.status));
  assert.ok(performance.now()-start<1500,"Un trait long ne doit pas bloquer le navigateur");
});

test("Lire la dernière ligne isolée sous les calculs, quel que soit l'ordre de dessin",()=>{
  const lower=ink("0.75").map(raw=>encodeStroke(raw.split(";").map(point=>{
    const [x,y]=point.split(",").map(Number);
    return [x,y+240];
  })));
  const upper=[...ink("12"),encodeStroke([[250,60],[275,90],[250,110]])];
  assert.equal(recognizeBottomNumericInk([...lower,...upper])?.text,"0.75");
  assert.equal(recognizeBottomNumericInk(upper),null);
  assert.equal(recognizeBottomNumericInk([...upper,...lower,encodeStroke([[40,210],[650,320]])]),null);
  assert.equal(recognizeBottomNumericInk([...upper,encodeStroke([[30,245],[100,245]]),...lower]),null);
  assert.equal(recognizeBottomNumericInk([...upper,...lower,"invalid"]),null);
  assert.notEqual(recognizeNumericInk([
    encodeStroke([[70,50],[70,115]]),encodeStroke([[180,135],[180,200]])
  ]).status,"recognized");
  assert.notEqual(recognizeNumericInk(ink("3/0")).status,"recognized");
});


test("Lire une fraction posée sous les calculs sans dépendre de l’ordre des traits",()=>{
  const numerator=ink("3");
  const bar=encodeStroke([[40,137],[111,138]]);
  const denominator=ink("4").map(raw=>encodeStroke(raw.split(";").map(point=>{
    const [x,y]=point.split(",").map(Number);
    return [x,y+110];
  })));
  const earlier=encodeStroke([[300,5],[301,10]]);
  assert.equal(recognizeStackedFractionInk([bar,...denominator,earlier,...numerator])?.text,"3/4");
  assert.equal(gradeAnswer({type:"number",answer:.75},
    recognizeStackedFractionInk([...numerator,bar,...denominator]).text).correct,true);
  const zero=ink("0").map(raw=>encodeStroke(raw.split(";").map(point=>{
    const [x,y]=point.split(",").map(Number);
    return [x,y+110];
  })));
  assert.equal(recognizeStackedFractionInk([...numerator,bar,...zero]),null);
  assert.equal(recognizeStackedFractionInk([...numerator,bar,encodeStroke([[45,140],[115,140]]),...denominator]),null);
  assert.equal(recognizeStackedFractionInk([...numerator,bar,encodeStroke([[300,160],[300,230]])]),null);
});


test("Lire les 7 barrés même lorsque l’ordre ou le sens des traits change",()=>{
  const examples=[
    ["170,35;220,35;186,108","181,72;210,72"],
    ["169,37;180,34;187,36;218,38;209,54;201,68;194,84;187,102","177,70;193,69;211,66"],
    ["211,72;181,72","186,108;220,35;170,35"]
  ];
  for(const seven of examples){
    assert.equal(recognizeNumericInk(seven).text,"7");
    assert.equal(recognizeNumericInk([...seven,"260,39;260,101"]).text,"71");
  }
  const crossedSlash=["220,35;186,108","181,72;210,72"];
  assert.notEqual(recognizeNumericInk(crossedSlash).text,"7");
  assert.equal(recognizeNumericInk(ink("4")).text,"4");
});

test("Lire le 1 avec un pied joint ou détaché sans le transformer en nombre négatif",()=>{
  for(const one of [
    ["195,35;195,106","180,113;216,113"],
    ["216,113;180,113","195,106;195,35"],
    ["182,52;200,36;200,106;176,106"],
    ["182,52;200,36;200,106;223,106"]
  ]){
    assert.equal(recognizeNumericInk(one).text,"1");
    assert.equal(recognizeNumericInk([...one,"260,39;260,101"]).text,"11");
  }
  assert.equal(recognizeNumericInk(ink("-1")).text,"-1");
  assert.notEqual(recognizeNumericInk(["195,35;195,106","145,116;245,116"]).text,"1");
});
