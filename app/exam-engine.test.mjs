import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {gradeAnswer} from "./engine.mjs";
import {EXAM_DURATION_MS,findExam,validateExamBank,startExam,hasExpired,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,sanitizeExamStore,addHistory} from "./exam-engine.mjs";

const questions=exam=>exam.sections.flatMap(s=>s.questions);
const time=Date.UTC(2026,10,7,12,0,0);
test("deux examens originaux de quatre exercices, avec 20 points chacun",()=>{
  assert.deepEqual(validateExamBank(),[]);
  assert.equal(EXAMS.length,2);
  for(const exam of EXAMS){
    assert.equal(exam.sections.length,4);
    assert.equal(questions(exam).reduce((sum,q)=>sum+q.points,0),20);
    for(const section of exam.sections)assert.equal(section.questions.reduce((a,q)=>a+q.points,0),5);
  }
});
test("toutes les réponses attendues sont reconnues et barème total 20/20",()=>{
  for(const exam of EXAMS){
    let session=startExam(exam.id,time);
    for(const q of questions(exam)){
      assert.equal(gradeAnswer(q,String(q.answer)).correct,true,q.id);
      session=updateExamAnswer(session,q.id,String(q.answer));
    }
    const result=finishExam(session,time+60000);
    assert.equal(result.score,20);
    assert.equal(result.maxScore,20);
    assert.equal(result.sections.length,4);
    assert.deepEqual(result.sections.map(s=>s.earned),[5,5,5,5]);
  }
});
test("les réponses absentes ou erronées donnent zéro, jamais de points négatifs",()=>{
  const exam=EXAMS[0];
  let session=startExam(exam.id,time);
  const missing=finishExam(session,time+8000);
  assert.equal(missing.score,0);
  session=updateExamAnswer(session,"a01","4");
  session=updateExamAnswer(session,"a05","1,2");
  session=updateExamAnswer(session,"a13","2x²−2x");
  session=updateExamAnswer(session,"a02","0");
  const result=finishExam(session,time+50000);
  assert.equal(result.score,3);
  assert.equal(result.sections[0].earned,1);
  assert.equal(result.sections[1].earned,1);
  assert.equal(result.sections[3].earned,1);
  assert.equal(result.sections[2].earned,0);
});
test("reprendre une copie et conserver les réponses et la rédaction",()=>{
  let store=emptyExamStore();
  let active=startExam("blanc-2",time);
  active=updateExamAnswer(active,"b07","41");
  active=updateExamNotes(active,"b-systeme","A+2C=22 ; 2A+C=29. J'isole C, puis je vérifie.");
  active={...active,sectionIndex:1};
  store={...store,active};
  const recovered=sanitizeExamStore(JSON.parse(JSON.stringify(store)));
  assert.equal(recovered.active.answers.b07,"41");
  assert.match(recovered.active.notes["b-systeme"],/vérifie/);
  assert.equal(recovered.active.sectionIndex,1);
  assert.equal(recovered.active.deadlineAt,time+EXAM_DURATION_MS);
});
test("chronomètre réel : reprise possible, délai strict et limite 3 h",()=>{
  const session=startExam("blanc-1",time);
  assert.equal(EXAM_DURATION_MS,10800000);
  assert.equal(hasExpired(session,time+EXAM_DURATION_MS-1),false);
  assert.equal(hasExpired(session,time+EXAM_DURATION_MS),true);
  const result=finishExam(session,time+EXAM_DURATION_MS,"timeout");
  assert.equal(result.reason,"timeout");assert.equal(result.score,0);
});
test("historique nettoyé et résultats recalculés lors de l'import",()=>{
  let active=startExam("blanc-1",time);
  active=updateExamAnswer(active,"a01","4");
  const result=finishExam(active,time+120000,"submitted");
  let store=addHistory(emptyExamStore(),result);
  assert.equal(store.history.length,1);
  const serialized=JSON.parse(JSON.stringify(store));
  serialized.history[0].score=20;
  serialized.history.push({examId:"inconnu",score:20});
  const clean=sanitizeExamStore(serialized);
  assert.equal(clean.history.length,1);
  assert.equal(clean.history[0].score,1);
  assert.equal(clean.active,null);
});
test("les sauvegardes malformées et les réponses hors banque sont rejetées",()=>{
  assert.throws(()=>startExam("examen-inconnu",time));
  assert.throws(()=>updateExamAnswer(startExam("blanc-1",time),"b01","3"));
  assert.throws(()=>updateExamNotes(startExam("blanc-1",time),"b-fonction","texte"));
  assert.throws(()=>sanitizeExamStore({version:4,active:null,history:[]}));
  assert.throws(()=>sanitizeExamStore({version:1,active:{examId:"blanc-1"},history:[]}));
  assert.throws(()=>updateExamAnswer(startExam("blanc-1",time),"a01","x".repeat(500)));
});
test("les corrections restent attachées au bon exercice et à sa compétence",()=>{
  for(const exam of EXAMS){
    const result=finishExam(startExam(exam.id,time),time+1000);
    const expected=questions(exam);
    assert.equal(result.sections.flatMap(s=>s.questions).length,expected.length);
    result.sections.flatMap(s=>s.questions).forEach((q,i)=>{
      assert.equal(q.id,expected[i].id);
      assert.equal(q.solution,expected[i].solution);
      assert.equal(q.skill,expected[i].skill);
    });
  }
});
