import test from "node:test";
import assert from "node:assert/strict";
import {createPersistence,createVolatileStorage,DATA_KEY,OLD_PRACTICE_KEY,OLD_EXAMS_KEY,StaleDataError} from "./persistence.mjs";
import {emptyState,recordAnswer} from "./engine.mjs";
import {emptyExamStore,startExam,finishExam,addHistory} from "./exam-engine.mjs";

const known=new Set(["v01","q01","q02"]);
const time=Date.UTC(2026,10,7,12);
test("initialisation à vide et écriture atomique dans une seule clé",()=>{
  const storage=createVolatileStorage(),data=createPersistence(storage,known);
  assert.equal(data.snapshot().revision,0);
  assert.equal(data.snapshot().practice.items.q01,undefined);
  assert.deepEqual(data.snapshot().exams,emptyExamStore());
  const practice=recordAnswer(emptyState(),"q01",true,time);
  const result=data.updatePractice(practice);
  assert.equal(result.revision,1);
  assert.equal(result.practice.items.q01.correct,1);
  const raw=JSON.parse(storage.getItem(DATA_KEY));
  assert.equal(raw.exams.version,1);
  assert.equal(raw.practice.items.q01.correct,1);
});
test("import des deux anciennes clés, puis migration non destructive",()=>{
  const storage=createVolatileStorage();
  const practice=recordAnswer(emptyState(),"q02",false,time);
  const exams={...emptyExamStore(),active:startExam("blanc-c",time,12345)};
  storage.setItem(OLD_PRACTICE_KEY,JSON.stringify(practice));
  storage.setItem(OLD_EXAMS_KEY,JSON.stringify(exams));
  const adapter=createPersistence(storage,known);
  assert.equal(adapter.snapshot().practice.items.q02.wrong,1);
  assert.equal(adapter.snapshot().exams.active.seed,12345);
  assert.equal(storage.getItem(DATA_KEY),null);
  adapter.updateExams(exams);
  assert.equal(storage.getItem(OLD_PRACTICE_KEY),null);
  assert.equal(storage.getItem(OLD_EXAMS_KEY),null);
  const reload=createPersistence(storage,known);
  assert.equal(reload.snapshot().practice.items.q02.wrong,1);
  assert.equal(reload.snapshot().exams.active.seed,12345);
});
test("import et reset remplacent tout ou rien",()=>{
  const storage=createVolatileStorage();
  const adapter=createPersistence(storage,known);
  const first=recordAnswer(emptyState(),"q01",true,time);
  const completed=finishExam(startExam("blanc-1",time),time+1000);
  const exams=addHistory(emptyExamStore(),completed);
  adapter.replaceAll(first,exams);
  assert.equal(adapter.snapshot().exams.history.length,1);
  const prev=storage.getItem(DATA_KEY);
  assert.throws(()=>adapter.replaceAll(first,{version:99,active:null,history:[]}));
  assert.equal(storage.getItem(DATA_KEY),prev);
  assert.throws(()=>adapter.replaceAll({version:99,items:{}},exams));
  assert.equal(storage.getItem(DATA_KEY),prev);
  adapter.replaceAll(emptyState(),emptyExamStore());
  assert.equal(adapter.snapshot().practice.items.q01,undefined);
  assert.equal(adapter.snapshot().exams.history.length,0);
});
test("erreur quota : aucune mutation partielle ni écrasement des anciennes clés",()=>{
  const db=new Map();
  let full=false;
  const storage={
    getItem:key=>db.get(key)??null,
    setItem:(key,value)=>{if(full)throw new Error("QuotaExceededError");db.set(key,String(value));},
    removeItem:key=>db.delete(key)
  };
  const p=recordAnswer(emptyState(),"q01",true,time);
  storage.setItem(OLD_PRACTICE_KEY,JSON.stringify(p));
  const adapter=createPersistence(storage,known);
  const before=adapter.snapshot();
  full=true;
  assert.throws(()=>adapter.updatePractice(emptyState()),/QuotaExceededError/);
  assert.deepEqual(adapter.snapshot(),before);
  assert.ok(storage.getItem(OLD_PRACTICE_KEY));
  assert.equal(storage.getItem(DATA_KEY),null);
});
test("deux onglets : écriture ancienne refusée, sans perdre les données récentes",()=>{
  const storage=createVolatileStorage();
  const a=createPersistence(storage,known),b=createPersistence(storage,known);
  a.updatePractice(recordAnswer(emptyState(),"q01",true,time));
  assert.equal(b.isStale(),true);
  assert.throws(()=>b.updateExams({...emptyExamStore(),active:startExam("blanc-c",time,234)}),StaleDataError);
  assert.throws(()=>b.snapshot(),StaleDataError); // aucune lecture silencieusement obsolète
});
test("la seconde instance recharge puis écrit sans perdre le premier onglet",()=>{
  const storage=createVolatileStorage();
  const a=createPersistence(storage,known);
  const b=createPersistence(storage,known);
  a.updatePractice(recordAnswer(emptyState(),"q01",true,time));
  assert.throws(()=>b.snapshot(),StaleDataError);
  const refreshed=b.refresh();
  assert.equal(refreshed.practice.items.q01.correct,1);
  b.updateExams({...emptyExamStore(),active:startExam("blanc-c",time,80)});
  const c=createPersistence(storage,known);
  assert.equal(c.snapshot().practice.items.q01.correct,1);
  assert.equal(c.snapshot().exams.active.seed,80);
  assert.equal(a.isStale(),true);
});
test("JSON corrompu conservé et non effacé silencieusement",()=>{
  const storage=createVolatileStorage();
  storage.setItem(OLD_PRACTICE_KEY,"{");
  assert.throws(()=>createPersistence(storage,known),/non lisibles/);
  assert.equal(storage.getItem(OLD_PRACTICE_KEY),"{");
});
