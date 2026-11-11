import test from "node:test";
import assert from "node:assert/strict";
import {emptyTransferStore,sanitizeTransferStore,recordTransferReview,transferStatus,transferSummary,recommendedTransferSeries,pendingTransferReviews,TRANSFER_DAY_MS} from "./transfer-progress.mjs";
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

test("v25.5 : séries A puis B à J+7, C à J+30, sans changement de sauvegarde",()=>{
  let s=emptyTransferStore();
  assert.equal(recommendedTransferSeries(transferStatus(s,9,t)),"a");
  s=recordTransferReview(s,9,weak,t);
  assert.equal(recommendedTransferSeries(transferStatus(s,9,t)),"b");
  assert.equal(recommendedTransferSeries(transferStatus(s,9,t+7*TRANSFER_DAY_MS)),"b");
  s=recordTransferReview(s,9,yes,t+7*TRANSFER_DAY_MS);
  assert.equal(recommendedTransferSeries(transferStatus(s,9,t+30*TRANSFER_DAY_MS)),"c");
  s=recordTransferReview(s,9,yes,t+30*TRANSFER_DAY_MS);
  assert.equal(recommendedTransferSeries(transferStatus(s,9,t+40*TRANSFER_DAY_MS)),"a");
  assert.equal(s.version,1);
  assert.throws(()=>recommendedTransferSeries({stage:99}),/inconnue/);
});

test("v25.6 : rappels rédigés triés et lacunes auto-déclarées, séries appropriées",()=>{
  let store=emptyTransferStore();
  store=recordTransferReview(store,18,[true,false,true,false],t);
  store=recordTransferReview(store,6,[false,true,true,true],t+TRANSFER_DAY_MS);
  assert.deepEqual(pendingTransferReviews(store,t+6*TRANSFER_DAY_MS),[]);
  const reviews=pendingTransferReviews(store,t+8*TRANSFER_DAY_MS);
  assert.deepEqual(reviews.map(r=>r.id),[18,6]);
  assert.deepEqual(reviews.map(r=>r.series),["b","b"]);
  assert.equal(reviews[0].stage,7);
  assert.deepEqual(reviews[0].missing,["méthode","conclusion et unités"]);
  assert.deepEqual(reviews[1].missing,["domaine et hypothèses"]);
  store=recordTransferReview(store,18,[true,true,true,true],t+8*TRANSFER_DAY_MS);
  assert.deepEqual(pendingTransferReviews(store,t+8*TRANSFER_DAY_MS).map(r=>r.id),[6]);
  assert.deepEqual(pendingTransferReviews(store,t+30*TRANSFER_DAY_MS).map(r=>[r.id,r.series]),[[6,"b"],[18,"c"]]);
  const previous=pendingTransferReviews(store,t+30*TRANSFER_DAY_MS)[1];
  assert.equal(previous.stage,30);
  assert.deepEqual(previous.missing,[],"Une déclaration complète ne vaut pas certification");
});
