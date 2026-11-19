import test from "node:test";
import assert from "node:assert/strict";
import {replayConsensus} from "./replay-consensus.mjs";

const names=["geometry","localVeto","localAgreement","localFullAgreement",
  "seshatAgreement","seshatAgreementWithLocalVeto"];
const sample=(id,expected,latex,rows,local=null)=>({
  id,file:"2019.json",expected,local,latex,rows,geometryValid:true,
  localOutcome:local?"exact":"abstention",
  policyOutcomes:Object.fromEntries([...names,"strictConsensus"].map(key=>[key,"abstention"]))
});

test("Rejouer la lecture historique : accord strict et désaccord",()=>{
  const rows=[
    sample("exact","12/7",String.raw`\frac{12}{7}`,[
      {local:null,seshat:"12"},{local:null,seshat:"7"}]),
    sample("wrong","12/7",String.raw`\frac{12}{1}`,[
      {local:null,seshat:"12"},{local:null,seshat:"1"}]),
    sample("veto","12/7",String.raw`\frac{12}{7}`,[
      {local:"11",seshat:"12"},{local:null,seshat:"7"}])
  ];
  const original=JSON.stringify(rows);
  const {replayed,report}=replayConsensus(rows);
  assert.deepEqual(replayed.map(row=>row.policyOutcomes.strictConsensus),
    ["exact","error","abstention"]);
  assert.equal(report.policies.strictConsensus.exact,1);
  assert.equal(report.policies.strictConsensus.error,1);
  assert.equal(report.policies.strictConsensus.abstention,1);
  assert.equal(report.decision,"reject-regression");
  assert.equal(JSON.stringify(rows),original);
});

test("Rejouer une lecture locale qui n'avait pas nécessité Seshat",()=>{
  const row=sample("local","3/8",undefined,null,"3/8");
  delete row.latex;
  const {replayed,report}=replayConsensus([row]);
  assert.equal(replayed[0].consensus.source,"local");
  assert.equal(replayed[0].policyOutcomes.strictConsensus,"exact");
  assert.equal(report.strictAddedExact,0);
});

test("Refuser les sorties tronquées plutôt que produire un score trompeur",()=>{
  assert.throws(()=>replayConsensus([]),/Aucune lecture/);
  const row=sample("incomplete","1/2",null,null);
  delete row.rows;
  assert.throws(()=>replayConsensus([row]),/incomplète/);
  const missing=sample("missing","1/2",undefined,null);
  delete missing.latex;
  assert.throws(()=>replayConsensus([missing]),/incomplète/);
});

test("Rejouer : détecter un résultat local falsifié ou périmé",()=>{
  const row=sample("bad-baseline","3/8",null,null,"3/8");
  row.localOutcome="abstention";
  assert.throws(()=>replayConsensus([row]),/Résultat local incohérent/);
});

test("Rejouer : ne jamais inventer une preuve géométrique à partir des lectures",()=>{
  const row=sample("no-geometry","12/7",String.raw`\frac{12}{7}`,[
    {local:null,seshat:"12"},{local:null,seshat:"7"}]);
  delete row.geometryValid;
  const absent=replayConsensus([row]);
  assert.equal(absent.replayed[0].consensus.reason,"invalid-geometry");
  assert.equal(absent.replayed[0].policyOutcomes.strictConsensus,"abstention");
  row.geometryValid=false;
  const invalid=replayConsensus([row]);
  assert.equal(invalid.replayed[0].consensus.reason,"invalid-geometry");
  row.geometryValid="true";
  assert.throws(()=>replayConsensus([row]),/Preuve géométrique invalide/);
});
