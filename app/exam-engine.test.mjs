import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {gradeAnswer} from "./engine.mjs";
import {EXAM_DURATION_MS,findExam,validateExamBank,startExam,hasExpired,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,sanitizeExamStore,addHistory,updateReviewCheck,updateReviewTarget} from "./exam-engine.mjs";

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
test("les résultats recalculés des huit exercices A et B donnent 20/20",()=>{
  const answers=[
    [[4,6,16,"2 < x < 10"],["6/5",216,4,546],["3/5","54/125","117/125","9/5"],["2x²−2x",4,"x > 1",5]],
    [[5,1,"1/2","y=x+1"],[12,5,41],[7,6,"28/5",7],
      [-2,"1,099","eˣ","g est continue et strictement croissante, avec un changement de signe"]]
  ];
  for(const [index,exam] of EXAMS.entries()){
    let session=startExam(exam.id,time);
    for(const [sectionIndex,section] of exam.sections.entries()){
      const expected=answers[index][sectionIndex];
      assert.equal(expected.length,section.questions.length);
      for(const [questionIndex,q] of section.questions.entries()){
        const answer=String(expected[questionIndex]);
        assert.equal(gradeAnswer(q,answer).correct,true,q.id);
        session=updateExamAnswer(session,q.id,answer);
      }
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
  const b=startExam("blanc-2",time);
  for(const [answer,points] of [["1,099",2],["1,09861229",2],["1,098",0],["1,09 9",0]]){
    const result=finishExam(updateExamAnswer(b,"b13",answer),time+50000);
    assert.equal(result.score,points,answer);
    assert.equal(result.sections[3].questions[1].expected,1.099);
  }
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
  const key="a-analyse:domain";
  store=updateReviewTarget(clean,result.examId,time,key,true);
  const reopened=sanitizeExamStore(JSON.parse(JSON.stringify(store)));
  assert.deepEqual(reopened.history[0].reviewTargets,{[key]:true});
  assert.equal(reopened.history[0].score,result.score);
  const justified=updateReviewCheck(reopened,result.examId,time,key,true);
  assert.deepEqual(justified.history[0].selfChecks,{[key]:true});
  assert.equal(justified.history[0].reviewTargets,undefined);
  let b=startExam("blanc-2",time+1);
  b=updateExamAnswer(b,"b13","1,099");
  b=updateExamNotes(b,"b-expo","Je prends le logarithme de 3.");
  const archive=addHistory(emptyExamStore(),{...finishExam(b,time+120000),score:0});
  const regraded=sanitizeExamStore(JSON.parse(JSON.stringify(archive))).history[0];
  assert.equal(regraded.score,2);
  assert.equal(regraded.answers.b13,"1,099");
  assert.equal(regraded.notes["b-expo"],"Je prends le logarithme de 3.");
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

test("examen manuscrit : aucune note fictive et indicateur conservé dans l'historique",()=>{
  const session=startExam("blanc-1",time,null,true);
  assert.equal(session.paperOnly,true);
  assert.equal(session.answers["a-analyse-1"],undefined);
  const active=sanitizeExamStore({version:1,active:session,history:[]}).active;
  assert.equal(active.paperOnly,true);
  const result=finishExam(active,time+60000);
  assert.equal(result.paperOnly,true);
  const saved=sanitizeExamStore(addHistory(emptyExamStore(),result));
  assert.equal(saved.history[0].paperOnly,true);
  assert.equal(saved.history[0].score,0,"score interne non exposé dans le parcours manuscrit");
});
