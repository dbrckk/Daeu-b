import test from "node:test";
import assert from "node:assert/strict";
import {buildExamRemediation,hasPracticeQuestions} from "./exam-remediation.mjs";
import {startExam,finishExam,updateExamAnswer} from "./exam-engine.mjs";
import {EXAMS} from "./exams.mjs";
import {TOPICS} from "./questions.mjs";
import {VARIANTS,injectVariants} from "./variants.mjs";
const at=Date.UTC(2026,10,12,12);
const make=(id,answered={})=>{
  let session=startExam(id,at);
  for(const [key,answer] of Object.entries(answered))session=updateExamAnswer(session,key,answer);
  return finishExam(session,at+5000);
};
test("Aucune copie : aucune faiblesse inventée ni quiz fantôme",()=>{
  assert.deepEqual(buildExamRemediation([],{}),[]);
  assert.deepEqual(buildExamRemediation(null,null),[]);
  assert.equal(hasPracticeQuestions("13-trigonometrie.md"),false);
  assert.equal(hasPracticeQuestions("17-raisonnement-modelisation.md"),false);
  assert.equal(hasPracticeQuestions("12-probabilites.md"),true);
});
test("Regrouper les erreurs par cours plutôt que dupliquer les liens pour chaque compétence",()=>{
  const result=make("blanc-1");
  const plan=buildExamRemediation([result],{items:{}},at+1000);
  const slugs=plan.map(x=>x.slug);
  assert.equal(new Set(slugs).size,slugs.length);
  assert.ok(slugs.includes("10-suites"));
  assert.ok(slugs.includes("12-probabilites"));
  const suites=plan.find(p=>p.slug==="10-suites");
  assert.ok(suites.lost>1&&suites.possible>=suites.lost);
  assert.ok(suites.skills.includes("suites")&&suites.skills.includes("somme de suites"));
  assert.equal(suites.topic,"suites");
  assert.equal(suites.practiceMode,"all");
  assert.equal(suites.practiceUrl,"./?topic=suites#practice-title");
});
test("État réel des exercices : variantes et questions fixes, rappels dus et maîtrises",()=>{
  const bank=injectVariants(TOPICS).find(t=>t.slug==="suites").questions;
  assert.ok(bank.some(q=>VARIANTS.some(v=>v.id===q.id)));
  const items={
    [bank[0].id]:{confirmed:true,attempts:2,wrong:0,dueAt:at+100000},
    [bank[1].id]:{confirmed:false,attempts:1,wrong:1,dueAt:at-1},
    [bank[2].id]:{confirmed:false,attempts:1,wrong:1,dueAt:at+100000}
  };
  const plan=buildExamRemediation([make("blanc-1")],{items},at).find(x=>x.slug==="10-suites");
  assert.equal(plan.practiceTotal,bank.length);
  assert.equal(plan.confirmed,1);
  assert.equal(plan.due,1);
  assert.equal(plan.wrong,2);
  assert.equal(plan.practiceMode,"due");
  assert.equal(plan.practiceUrl,"./?topic=suites&mode=due#practice-title");
});
test("Compétences sans quiz dédié : cours conservé, pas de faux accès à des exercices",()=>{
  const result=make("blanc-2");
  result.sections[0].questions[0].skill="trigonométrie";
  result.sections[0].questions[0].points=1;
  result.sections[0].questions[0].earned=0;
  const plan=buildExamRemediation([result],{items:{}},at);
  const tri=plan.find(x=>x.slug==="13-trigonometrie");
  assert.ok(tri);
  assert.equal(tri.practiceUrl,null);
  assert.equal(tri.practiceTotal,0);
  assert.equal(tri.courseUrl,"./course.html?course=13-trigonometrie");
});
test("Les bonnes réponses d'examen n'ajoutent jamais de maîtrise en pratique",()=>{
  const perfect=make("blanc-1",Object.fromEntries(EXAMS[0].sections.flatMap(s=>s.questions).map(q=>[q.id,String(q.answer)])));
  assert.equal(perfect.score,20);
  assert.deepEqual(buildExamRemediation([perfect],{items:{}}),[]);
});
