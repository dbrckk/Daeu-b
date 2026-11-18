import test from "node:test";
import assert from "node:assert/strict";
import {parseBenchmark,summarizeBenchmark} from "./report.mjs";

const names=["strictConsensus","geometry","localVeto","localAgreement",
  "localFullAgreement","seshatAgreement","seshatAgreementWithLocalVeto"];
const sample=(id,local,strict,file="2019.json")=>({
  id,file,localOutcome:local,
  policyOutcomes:Object.fromEntries(names.map(name=>[name,strict]))
});

test("Rapport : distinguer les gains, erreurs nouvelles et pertes",()=>{
  const report=summarizeBenchmark([
    sample("a","abstention","exact"),
    sample("b","abstention","error"),
    sample("c","exact","abstention"),
    sample("d","error","error"),
    sample("e","exact","exact","2023.json")
  ]);
  assert.equal(report.samples,5);
  assert.equal(report.datasetCount,2);
  assert.equal(report.strictAddedExact,1);
  assert.equal(report.strictAddedErrors,1);
  assert.equal(report.strictLostExact,1);
  assert.equal(report.decision,"reject-regression");
  assert.equal(report.decisionIsProductionApproval,false);
  assert.deepEqual(report.policies.strictConsensus,{
    samples:5,exact:2,error:2,abstention:1,
    addedExact:1,addedErrors:1,lostExact:1,changed:3
  });
  assert.equal(report.datasets["2023.json"].strictConsensus.samples,1);
});

test("Rapport : zéro gain ou données insuffisantes interdisent une intégration",()=>{
  const noGain=summarizeBenchmark([sample("a","abstention","abstention")]);
  assert.equal(noGain.decision,"reject-no-gain");
  const small=summarizeBenchmark([sample("a","abstention","exact")]);
  assert.equal(small.decision,"insufficient-independent-data");
  assert.equal(small.decisionIsProductionApproval,false);
});

test("Rapport : séparer les fichiers sans confondre deux identifiants identiques",()=>{
  const report=summarizeBenchmark([
    sample("same","abstention","exact","2019.json"),
    sample("same","abstention","exact","2023.json")
  ]);
  assert.equal(report.samples,2);
  assert.equal(report.strictAddedExact,2);
});

test("Rapport : refuser les mesures incomplètes, fausses ou dupliquées",()=>{
  assert.throws(()=>summarizeBenchmark([]),/Au moins/);
  assert.throws(()=>summarizeBenchmark([sample("a","abstention","exact"),
    sample("a","abstention","exact")]),/dupliqué/);
  assert.throws(()=>summarizeBenchmark([sample("a","wrong","exact")]),/local invalide/);
  assert.throws(()=>summarizeBenchmark([sample("a","abstention","wrong")]),/absente ou invalide/);
  assert.throws(()=>summarizeBenchmark([{id:"a",file:"2019.json",localOutcome:"exact"}]),/manquants/);
  assert.throws(()=>summarizeBenchmark([{id:"",file:"2019.json",localOutcome:"exact"}]),/identifiant/);
});

test("Rapport : lire des sorties JSONL avec lignes vides et détecter les corruptions",()=>{
  const line=JSON.stringify(sample("a","abstention","exact"));
  assert.deepEqual(parseBenchmark("\n"+line+"\r\n"),[JSON.parse(line)]);
  assert.throws(()=>parseBenchmark("\n{wrong"),/ligne 2/);
});
