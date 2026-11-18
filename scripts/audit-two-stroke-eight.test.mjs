import test from "node:test";
import assert from "node:assert/strict";
import {evaluateSamples,normalizeSample} from "./audit-two-stroke-eight.mjs";

const oval=(x,y,rx=25,ry=21)=>Array.from({length:13},(_,i)=>{
  const a=i*Math.PI/6;
  return [x+rx*Math.cos(a),y+ry*Math.sin(a)];
});
const caseFor=(id,expected,paths)=>({id,expected,group:"crohme-symbol",paths});
const sample8=caseFor("8a","8",[oval(100,100),oval(103,150)]);
const sample0=caseFor("0a","0",[oval(100,100),[...oval(100,100)].reverse()]);
const sample9=caseFor("9a","9",[oval(100,100),[[122,114],[123,134],[118,152],[109,172]]]);

test("Audit : normaliser les tracés annotés sans changer les coordonnées d'origine",()=>{
  const raw=JSON.stringify(sample8.paths);
  const page=normalizeSample(sample8.paths);
  assert.equal(page.length,2);
  assert.match(page[0],/^\\d+,\\d+;/);
  assert.equal(JSON.stringify(sample8.paths),raw);
  assert.throws(()=>normalizeSample([[[1,2]]]),/Deux traits/);
  assert.throws(()=>normalizeSample([[[1,2],[2,3]],[[3,4],[Infinity,4]]]),/Deux traits/);
});

test("Audit : chiffres 8 et contrôles, erreurs et abstentions séparées",()=>{
  const fake=page=>{
    const top=page[0];
    if(top===normalizeSample(sample8.paths)[0]&&page[1]===normalizeSample(sample8.paths)[1])return {status:"recognized",text:"8"};
    return {status:"uncertain"};
  };
  const baseline=()=>({status:"recognized",text:"9"});
  const rows=[sample8,sample0,sample9,
    caseFor("other","+",[oval(1,1),oval(2,2)]),
    {id:"bad",expected:"8",group:"crohme-symbol",paths:[[[1,2]],[[3,4]]]}];
  const report=evaluateSamples(rows,fake,baseline);
  assert.equal(report.sampleCount,3);
  assert.deepEqual(report.eights,{total:1,exact:1,erreur:0,abstention:0});
  assert.deepEqual(report.controls,{total:2,exact:0,erreur:0,abstention:2});
  assert.equal(report.falseEight,0);
  assert.equal(report.baseline.eights.erreur,1);
  assert.equal(report.baseline.controls.erreur,1);
  assert.equal(report.baseline.changes.length,3);
  assert.deepEqual(Object.keys(report.byDigit),["0","8","9"]);
});

test("Audit : signaler explicitement les faux 8 parmi les chiffres de contrôle",()=>{
  const report=evaluateSamples([sample0,sample9],()=>({status:"recognized",text:"8"}));
  assert.equal(report.falseEight,2);
  assert.deepEqual(report.falseEightIds,["0a","9a"]);
  assert.equal(report.controls.erreur,2);
});
