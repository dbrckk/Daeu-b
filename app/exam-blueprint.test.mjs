import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {createGeneratedExam} from "./exam-generator.mjs";
import {createAlternativeExam} from "./exam-alternative.mjs";
import {createAppliedExam} from "./exam-applied.mjs";
import {EXAM_SEEDS,EXAM_COURSE_BASE,EXAM_FAMILIES,profileExam,examOverview,renderExamAudit} from "./exam-blueprint.mjs";

test("composition des cinq sujets, 20 points et 16 critères conservés",()=>{
  const r=examOverview();
  assert.deepEqual(r.errors,[]);
  assert.equal(r.profiles.length,5);
  assert.deepEqual(r.profiles.map(p=>p.label),["A","B","C","D","E"]);
  for(const p of r.profiles){
    assert.equal(p.points,20);
    assert.equal(p.sections.length,4);
    assert.equal(p.guidedSteps,16);
    assert.equal(p.types.number+p.types.choice,p.questions);
    assert.equal(p.sections.reduce((n,s)=>n+s.points,0),20);
    assert.ok(p.twoPointQuestions>=2);
    assert.ok(p.skills.length>=8);
    for(const c of p.courses)assert.ok(c.points>0);
  }
});
test("couverture honnête des chapitres : calcul numérique et littéral non isolés",()=>{
  const r=examOverview();
  assert.equal(r.total,EXAM_COURSE_BASE.length);
  assert.equal(r.covered,11);
  assert.deepEqual(r.missing,["01-calcul-numerique","02-calcul-litteral"]);
  assert.equal(r.perCourse.find(c=>c.course==="13-trigonometrie"),undefined);
  assert.ok(r.perCourse.find(c=>c.course==="12-probabilites").examLabels.includes("E"));
  assert.match(renderExamAudit(r),/non des niveaux de difficulté/);
  assert.match(renderExamAudit(r),/Aucune estimation empirique/);
});
test("gabarit stable entre graines C/D/E, sans modifier les copies historiques",()=>{
  for(const [create,id] of [[createGeneratedExam,"blanc-c"],[createAlternativeExam,"blanc-d"],[createAppliedExam,"blanc-e"]]){
    const base=profileExam(create(0));
    assert.equal(base.id,id);
    for(const seed of EXAM_SEEDS){
      const p=profileExam(create(seed));
      assert.deepEqual(p.types,base.types);
      assert.deepEqual(p.sections,base.sections);
      assert.deepEqual(p.skills,base.skills);
    }
  }
  assert.equal(EXAM_FAMILIES.length,5);
  assert.deepEqual(EXAMS.map(x=>x.id),["blanc-1","blanc-2"]);
});
test("aucune question sans cours, ou gabarit dénaturé",()=>{
  const bad=structuredClone(EXAMS[0]);
  bad.sections[0].questions[0].skill="compétence-inexistante";
  assert.throws(()=>profileExam(bad),/sans cours/);
  const short=structuredClone(EXAMS[0]);
  short.sections[0].questions.pop();
  assert.throws(()=>profileExam(short),/Exercice mal équilibré/);
});
