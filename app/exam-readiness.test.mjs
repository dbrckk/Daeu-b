import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {startExam,updateExamAnswer,updateExamNotes,findExam,EXAM_DURATION_MS} from "./exam-engine.mjs";
import {createGeneratedExam} from "./exam-generator.mjs";
import {createAlternativeExam} from "./exam-alternative.mjs";
import {inspectExamDraft} from "./exam-readiness.mjs";
const time=Date.UTC(2026,10,11,21);
test("A/B : les champs absents sont comptés en questions et points, sans note",()=>{
  for(const exam of EXAMS){
    const session=startExam(exam.id,time);
    const draft=inspectExamDraft(exam,session);
    assert.equal(draft.sections.length,4);
    assert.equal(draft.sectionsWithNotes,0);
    assert.equal(draft.answeredQuestions,0);
    assert.equal(draft.remainingQuestions,exam.sections.flatMap(s=>s.questions).length);
    assert.equal(draft.pointsUnanswered,20);
    assert.equal(draft.firstIncompleteSection,0);
    assert.equal(draft.allFieldsFilled,false);
    assert.deepEqual(draft.sectionsWithoutNotes,exam.sections.map(s=>s.id));
    assert.equal(session.deadlineAt,time+EXAM_DURATION_MS);
  }
});
test("compter une réponse présente, mais pas les espaces ou une rédaction blanche",()=>{
  const exam=EXAMS[0];let session=startExam(exam.id,time);
  const first=exam.sections[0].questions[0];
  session=updateExamAnswer(session,first.id,"  777  ");
  session=updateExamAnswer(session,exam.sections[0].questions[1].id,"   ");
  session=updateExamNotes(session,exam.sections[0].id,"  texte personnel  ");
  const draft=inspectExamDraft(exam,session);
  assert.equal(draft.answeredQuestions,1);
  assert.equal(draft.pointsUnanswered,19);
  assert.equal(draft.sectionsWithNotes,1);
  assert.equal(draft.firstIncompleteSection,0);
  assert.equal(draft.sections[0].missingIds.includes(first.id),false);
  assert.equal(draft.sections[0].remaining,exam.sections[0].questions.length-1);
  assert.equal(draft.sections[0].notePresent,true);
  // Une saisie non vide peut être totalement fausse : ne jamais annoncer "acquis".
  assert.equal(Object.hasOwn(draft,"score"),false);
  assert.equal(Object.hasOwn(draft,"correct"),false);
});
test("C et D : tous les exercices restent reproductibles après restauration",()=>{
  for(const create of [createGeneratedExam,createAlternativeExam]){
    for(const seed of [0,1,29,2048,0xffffffff]){
      const exam=create(seed),original=startExam(exam.id,time,seed);
      let session=original;
      for(const section of exam.sections){
        for(const q of section.questions){
          session=updateExamAnswer(session,q.id,String(q.answer));
        }
        session=updateExamNotes(session,section.id,"Domaine, méthode, calcul et conclusion écrits.");
      }
      const restored=JSON.parse(JSON.stringify(session));
      assert.deepEqual(findExam(restored.examId,restored.seed),exam);
      const draft=inspectExamDraft(exam,restored);
      assert.equal(draft.remainingQuestions,0);
      assert.equal(draft.pointsUnanswered,0);
      assert.equal(draft.sectionsWithNotes,4);
      assert.equal(draft.firstIncompleteSection,null);
      assert.equal(draft.allFieldsFilled,true);
      assert.equal(restored.startedAt,time);
    }
  }
});
test("diagnostic non noté : erreur d'identité de sujet rejetée",()=>{
  const exam=createGeneratedExam(5);
  const session=startExam(exam.id,time,5);
  assert.throws(()=>inspectExamDraft(exam,{...session,seed:6}),/incompatible/);
  assert.throws(()=>inspectExamDraft(null,session),/invalide/);
  assert.equal(inspectExamDraft(exam,session).sections.length,4);
});
