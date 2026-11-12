import test from "node:test";
import assert from "node:assert/strict";
import {EXAM_FAMILIES,examOverview} from "./exam-blueprint.mjs";
import {recommendNextExam} from "./exam-recommendation.mjs";
import {startExam,finishExam,updateExamAnswer} from "./exam-engine.mjs";
const now=Date.UTC(2026,10,12,9);
const done=(id,seed=undefined,correct=false)=>{
  let session=startExam(id,now,seed);
  if(correct){
    const exam=EXAM_FAMILIES.find(f=>f.id===id).create(seed);
    for(const q of exam.sections.flatMap(s=>s.questions))
      session=updateExamAnswer(session,q.id,String(q.answer));
  }
  return finishExam(session,now+60000);
};
test("Sans copie, suggérer une famille fixe, sans inventer de niveau",()=>{
 const recommendation=recommendNextExam([]);
 assert.equal(recommendation.id,"blanc-1");
 assert.equal(recommendation.attempts,0);
 assert.equal(recommendation.candidates.length,5);
 assert.match(recommendation.reason,/non encore passé/);
});
test("Explorer les cinq familles avant de répéter un sujet",()=>{
 const history=[],seen=new Set();
 for(let i=0;i<5;i++){
   const suggestion=recommendNextExam(history);
   assert.equal(suggestion.attempts,0,"Un sujet non encore passé doit être prioritaire");
   assert.equal(seen.has(suggestion.id),false,"Ne pas répéter un sujet tant que les autres sont inédits");
   seen.add(suggestion.id);
   history.push(done(suggestion.id,["blanc-c","blanc-d","blanc-e"].includes(suggestion.id)?7:undefined));
 }
 assert.equal(seen.size,5);
});
test("Après cinq familles, privilégier les points perdus et éviter le dernier sujet",()=>{
 const history=["blanc-1","blanc-2","blanc-c","blanc-d","blanc-e"].map(id=>
   done(id,["blanc-c","blanc-d","blanc-e"].includes(id)?7:undefined));
 const rec=recommendNextExam(history);
 assert.equal(rec.candidates.length,5);
 assert.ok(rec.candidates.every(x=>x.attempts===1));
 assert.notEqual(rec.id,"blanc-e");
 assert.ok(rec.candidates.every(x=>Number.isFinite(x.priority)));
 assert.ok(rec.candidates.some(x=>x.overlap>0));
});
test("Historique limité à douze copies, aucun effet de bord",()=>{
 const h=Array.from({length:15},(_,i)=>done(i%2?"blanc-1":"blanc-2"));
 const original=structuredClone(h);
 const x=recommendNextExam(h);
 assert.deepEqual(h,original);
 assert.equal(x.attempts,0);
 assert.equal(x.id,"blanc-c");
});
test("Les profils du rapport de couverture restent inchangés",()=>{
 const before=examOverview();
 recommendNextExam([done("blanc-e",8,true)]);
 assert.deepEqual(examOverview(),before);
});
