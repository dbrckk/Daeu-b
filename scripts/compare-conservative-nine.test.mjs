import test from "node:test";
import assert from "node:assert/strict";
import {encodeStroke} from "../app/workbook.mjs";
import {recognizeNumericInk} from "../app/numeric-ink.mjs";
import {recognizeNumericInkConservativeNine} from "./conservative-nine-experiment.mjs";
import {compareNinePolicy} from "./compare-conservative-nine.mjs";

const nine=[
  [[58,26],[54,19],[45,16],[31,20],[22,31],[20,45],[24,51],[34,51],[49,46],[52,45]],
  [[59,29],[58,48],[54,69],[49,82],[47,93]]
];
const page=nine.map(encodeStroke);

test("Le 9 à deux traits reste reconnu par la production mais s'abstient dans l'expérience",()=>{
  assert.equal(recognizeNumericInk(page).text,"9");
  assert.equal(recognizeNumericInkConservativeNine(page).status,"uncertain");
  assert.deepEqual(recognizeNumericInkConservativeNine([encodeStroke([[5,5],[20,30]])]),
    recognizeNumericInk([encodeStroke([[5,5],[20,30]])]));
});

test("Le comparateur refuse l'approbation si un 9 exact est perdu",()=>{
  const report=compareNinePolicy([{id:"nine",group:"crohme-symbol",expected:"9",paths:nine}]);
  assert.equal(report.comparison.lostExact,1);
  assert.equal(report.evidence.trueNines,1);
  assert.equal(report.evidence.otherDigits,0);
  assert.equal(report.evidence.sufficientSample,false);
  assert.equal(report.comparison.approved,false);
  assert.equal(report.baseline.controls.exact,1);
  assert.equal(report.candidate.controls.abstention,1);
  assert.equal(JSON.stringify(report).includes('"id":"nine"'),false);
});
