import test from "node:test";
import assert from "node:assert/strict";
import {TOPICS} from "./questions.mjs";
import {VARIANTS,injectVariants} from "./variants.mjs";
import {flatten,emptyState,recordAnswer} from "./engine.mjs";
import {buildRound,restoreRound,advanceRound,sanitizeRound} from "./round.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY} from "./persistence.mjs";
import {emptyExamStore,startExam} from "./exam-engine.mjs";
const bank=flatten(injectVariants(TOPICS));
const known=new Set(bank.map(q=>q.id));
const byId=new Map(bank.map(q=>[q.id,q]));
const now=Date.UTC(2026,10,10,10);

test("reprise exacte de l'ordre et du même exercice variable après recharge",()=>{
  const selection=[byId.get("v01"),byId.get("n01"),byId.get("v02")];
  const {round,questions}=buildRound(selection,emptyState(),{random:()=>.314159,now});
  assert.deepEqual(round.ids,["v01","n01","v02"]);
  assert.equal(round.completed,0);
  assert.equal(round.score,0);
  const restored=restoreRound(JSON.parse(JSON.stringify(round)),bank);
  assert.deepEqual(restored.map(q=>({id:q.id,prompt:q.prompt,answer:q.answer,seed:q.seed})),
    questions.map(q=>({id:q.id,prompt:q.prompt,answer:q.answer,seed:q.seed})));
  const next=advanceRound(round,true);
  assert.equal(next.completed,1);
  assert.equal(next.score,1);
  assert.equal(advanceRound(next,false).completed,2);
});
test("une variante reprise ne dépend pas de la progression modifiée ailleurs",()=>{
  const q=byId.get("v10")||byId.get(VARIANTS[0].id);
  const progress=recordAnswer(emptyState(),q.id,true,now,{signature:"ancienne question"});
  const {round,questions}=buildRound([q],progress,{random:()=>.9,now});
  const altered=recordAnswer(progress,q.id,false,now+100,{signature:questions[0].prompt});
  assert.ok(altered.items[q.id].attempts>progress.items[q.id].attempts);
  assert.equal(restoreRound(round,bank)[0].prompt,questions[0].prompt);
  assert.equal(restoreRound(round,bank)[0].answer,questions[0].answer);
});
test("rejet des séances falsifiées, des questions inconnues et des graines malformées",()=>{
  const {round}=buildRound([byId.get("v01"),byId.get("n01")],emptyState(),{random:()=>.2,now});
  for(const invalid of [
    {...round,ids:["v01","v01"]},
    {...round,ids:["v01","inconnu"]},
    {...round,completed:3},
    {...round,score:1},
    {...round,startedAt:-1},
    {...round,seeds:{v01:-1}},
    {...round,seeds:{}},
    {...round,seeds:{v01:round.seeds.v01,n01:1}}
  ])assert.throws(()=>sanitizeRound(invalid,known));
  assert.equal(sanitizeRound(null,known),null);
  assert.throws(()=>advanceRound(advanceRound(advanceRound(round,false),true),false));
});
test("une réponse et son avancement sont écrits atomiquement avec les examens",()=>{
  const storage=createVolatileStorage(),p=createPersistence(storage,known);
  const round=buildRound([byId.get("n01"),byId.get("v01")],emptyState(),{random:()=>.1,now}).round;
  p.updateRound(round);
  const practice=recordAnswer(emptyState(),"n01",true,now);
  const result=p.commitPractice(practice,advanceRound(round,true));
  assert.equal(result.practice.items.n01.correct,1);
  assert.equal(result.round.completed,1);
  assert.equal(result.round.score,1);
  const exams={...emptyExamStore(),active:startExam("blanc-c",now,123)};
  p.updateExams(exams);
  assert.equal(p.snapshot().round.completed,1,"examen n'écrase pas la séance");
  const reopened=createPersistence(storage,known);
  assert.equal(reopened.snapshot().round.ids[1],"v01");
  assert.equal(reopened.snapshot().exams.active.seed,123);
  assert.equal(JSON.parse(storage.getItem(DATA_KEY)).round.score,1);
});
test("quota saturé : ni réponse ni avancement perdus silencieusement",()=>{
  const values=new Map();let fail=false;
  const storage={
    getItem:key=>values.get(key)??null,
    setItem:(key,value)=>{if(fail)throw new Error("quota");values.set(key,String(value));},
    removeItem:key=>values.delete(key)
  };
  const p=createPersistence(storage,known);
  const round=buildRound([byId.get("v01")],emptyState(),{random:()=>.3,now}).round;
  p.updateRound(round);
  const before=p.snapshot();
  fail=true;
  assert.throws(()=>p.commitPractice(recordAnswer(emptyState(),"v01",true,now),advanceRound(round,true)),/quota/);
  assert.deepEqual(p.snapshot(),before);
});
test("anciens JSON sans séance acceptés et remise à zéro supprime aussi la séance",()=>{
  const storage=createVolatileStorage(),p=createPersistence(storage,known);
  const round=buildRound([byId.get("n01")],emptyState(),{now}).round;
  p.updateRound(round);
  p.replaceAll(emptyState(),emptyExamStore());
  assert.equal(p.snapshot().round,null);
  const raw=JSON.parse(storage.getItem(DATA_KEY));
  delete raw.round;
  storage.setItem(DATA_KEY,JSON.stringify(raw));
  assert.equal(createPersistence(storage,known).snapshot().round,null);
});
