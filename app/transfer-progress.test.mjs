import test from "node:test";
import assert from "node:assert/strict";
import {emptyTransferStore,sanitizeTransferStore,recordTransferReview,transferStatus,transferSummary,TRANSFER_DAY_MS} from "./transfer-progress.mjs";
const t=Date.UTC(2026,10,11,12),yes=[true,true,true,true],weak=[true,false,false,true];
test("ancien historique absent -> magasin vide ; aucun acquis attribué",()=>{
  assert.deepEqual(sanitizeTransferStore(undefined),emptyTransferStore());
  assert.deepEqual(sanitizeTransferStore(null),emptyTransferStore());
  assert.deepEqual(transferSummary(emptyTransferStore(),t),{total:20,started:0,due:0,completed:0});
  assert.equal(transferStatus(emptyTransferStore(),5,t).stage,0);
});
test("3 étapes indépendantes J0, J+7, J+30 avec dates explicites",()=>{
  let s=recordTransferReview(emptyTransferStore(),12,weak,t);
  assert.deepEqual(transferSummary(s,t),{total:20,started:1,due:0,completed:0});
  assert.equal(transferStatus(s,12,t+7*TRANSFER_DAY_MS-1).due,false);
  assert.equal(transferStatus(s,12,t+7*TRANSFER_DAY_MS).stage,7);
  assert.equal(transferStatus(s,12,t+7*TRANSFER_DAY_MS).due,true);
  assert.throws(()=>recordTransferReview(s,12,yes,t+6*TRANSFER_DAY_MS),/échéance/);
  s=recordTransferReview(s,12,yes,t+7*TRANSFER_DAY_MS);
  assert.equal(transferStatus(s,12,t+29*TRANSFER_DAY_MS).due,false);
  assert.equal(transferStatus(s,12,t+30*TRANSFER_DAY_MS).due,true);
  s=recordTransferReview(s,12,weak,t+30*TRANSFER_DAY_MS);
  assert.equal(transferStatus(s,12,t+365*TRANSFER_DAY_MS).done,true);
  assert.equal(transferStatus(s,12,t).count,3);
  assert.deepEqual(transferSummary(s,t+365*TRANSFER_DAY_MS),{total:20,started:1,due:0,completed:1});
  assert.throws(()=>recordTransferReview(s,12,yes,t+31*TRANSFER_DAY_MS),/déjà enregistrées/);
  assert.deepEqual(sanitizeTransferStore(JSON.parse(JSON.stringify(s))),s);
});
test("rappel J+30 tardif : espacement minimal d'un jour entre les déclarations",()=>{
  let s=recordTransferReview(emptyTransferStore(),1,yes,t);
  s=recordTransferReview(s,1,yes,t+31*TRANSFER_DAY_MS);
  const next=transferStatus(s,1,t+31*TRANSFER_DAY_MS);
  assert.equal(next.dueAt,t+32*TRANSFER_DAY_MS);
  assert.throws(()=>recordTransferReview(s,1,yes,t+31*TRANSFER_DAY_MS),/échéance/);
  s=recordTransferReview(s,1,yes,t+32*TRANSFER_DAY_MS);
  assert.equal(transferStatus(s,1,t+40*TRANSFER_DAY_MS).done,true);
});
test("vérification stricte et conservation : pas de correction implicite des données cassées",()=>{
  const s=recordTransferReview(emptyTransferStore(),3,[false,false,false,false],t);
  assert.equal(transferStatus(s,3,t).criteria.filter(Boolean).length,0);
  assert.throws(()=>recordTransferReview(s,0,yes,t),/invalide/);
  assert.throws(()=>recordTransferReview(s,3,[true],t),/invalide/);
  assert.throws(()=>sanitizeTransferStore({version:2,items:{}}),/incompatible/);
  assert.throws(()=>sanitizeTransferStore({version:1,items:{"21":{reviews:[]}}}),/mal formé/);
  assert.throws(()=>sanitizeTransferStore({version:1,items:{"3":{reviews:[{at:t,criteria:yes},{at:t,criteria:yes}]}}}),/échéance/);
});
