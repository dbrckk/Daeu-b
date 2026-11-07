import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {getRubric,validateRubrics,validReviewKeys,sanitizeSelfChecks,countChecks} from "./reasoning.mjs";
import {analyzeExamHistory,SKILL_LESSONS} from "./exam-analytics.mjs";
import {startExam,updateExamAnswer,finishExam,emptyExamStore,addHistory,updateReviewCheck,sanitizeExamStore} from "./exam-engine.mjs";

const time=Date.UTC(2026,10,7,12);
function examWithAllAnswers(id,correctIds=[]){
  const exam=EXAMS.find(e=>e.id===id);
  let session=startExam(id,time);
  for(const section of exam.sections){
    for(const question of section.questions){
      if(correctIds.includes(question.id))session=updateExamAnswer(session,question.id,String(question.answer));
    }
  }
  return finishExam(session,time+60_000);
}
test("tous les huit problèmes disposent d'une grille de raisonnement fiable",()=>{
  assert.deepEqual(validateRubrics(EXAMS),[]);
  const sections=EXAMS.flatMap(exam=>exam.sections);
  assert.equal(sections.length,8);
  assert.equal(sections.reduce((sum,s)=>sum+getRubric(s.id).steps.length,0),32);
  for(const section of sections){
    const keys=validReviewKeys(EXAMS.find(e=>e.sections.includes(section)));
    for(const step of getRubric(section.id).steps){
      assert.ok(keys.has(section.id+":"+step.id));
      assert.ok(step.model.length>45);
      assert.ok(step.prompt.length>=25);
    }
  }
});
test("les compétences évaluées possèdent toutes un lien vers un cours",()=>{
  const skills=EXAMS.flatMap(exam=>exam.sections.flatMap(s=>s.questions.map(q=>q.skill)));
  for(const skill of skills)assert.match(SKILL_LESSONS[skill],/^\d{2}-.*\.md$/,skill);
});
test("cocher une étape n'augmente pas la note et reste lié à la bonne copie",()=>{
  const initial=examWithAllAnswers("blanc-1",["a01","a05"]);
  let store=addHistory(emptyExamStore(),initial);
  assert.equal(initial.score,2);
  const id="a-analyse:domain";
  store=updateReviewCheck(store,"blanc-1",time,id,true);
  assert.equal(store.history[0].score,2);
  assert.equal(store.history[0].selfChecks[id],true);
  assert.deepEqual(countChecks(store.history[0]),{checked:1,total:16});
  store=updateReviewCheck(store,"blanc-1",time,id,false);
  assert.deepEqual(store.history[0].selfChecks,{});
  assert.deepEqual(countChecks(store.history[0]),{checked:0,total:16});
  assert.throws(()=>updateReviewCheck(store,"blanc-1",time,"x-invalid",true));
  assert.throws(()=>updateReviewCheck(store,"blanc-1",time+1,id,true));
  assert.throws(()=>updateReviewCheck(store,"blanc-1",time,id,"oui"));
});
test("export/import des auto-évaluations sans rupture avec les anciens résultats",()=>{
  const initial=examWithAllAnswers("blanc-2",["b01","b08","b09"]);
  let store=addHistory(emptyExamStore(),initial);
  store=updateReviewCheck(store,"blanc-2",time,"b-stats:mean",true);
  const copied=JSON.parse(JSON.stringify(store));
  copied.history[0].selfChecks["b-stats:mean"]="true";
  copied.history[0].selfChecks["other:unsafe"]=true;
  const cleaned=sanitizeExamStore(copied);
  assert.deepEqual(cleaned.history[0].selfChecks,{});
  copied.history[0].selfChecks["b-stats:mean"]=true;
  const restored=sanitizeExamStore(copied);
  assert.equal(restored.history[0].selfChecks["b-stats:mean"],true);
  assert.equal(restored.history[0].selfChecks["other:unsafe"],undefined);
  assert.equal(restored.history[0].score,3);
  const previous=JSON.parse(JSON.stringify(store));
  delete previous.history[0].selfChecks;
  assert.deepEqual(sanitizeExamStore(previous).history[0].selfChecks,{});
});
test("diagnostic des pertes de points, priorité et absence de faux certificat",()=>{
  const first=examWithAllAnswers("blanc-1",["a01","a02"]);
  const second=examWithAllAnswers("blanc-2",["b01"]);
  const report=analyzeExamHistory([first,second]);
  assert.equal(report.attempts,2);
  assert.equal(report.distinctSubjects,2);
  assert.equal(report.latestScore,1);
  assert.equal(report.average,1.5);
  assert.equal(report.change,-1);
  assert.equal(report.repeatedSubjects,false);
  assert.equal(report.earnedPoints,3);
  assert.equal(report.possiblePoints,40);
  assert.ok(report.weaknesses.some(r=>r.skill==="loi binomiale"&&r.lost>0));
  assert.ok(report.weaknesses.every(x=>x.lost>0&&x.lesson));
  const repeated=analyzeExamHistory([first,first]);
  assert.equal(repeated.repeatedSubjects,true);
  assert.equal(analyzeExamHistory([]).average,null);
});
test("la correction des résultats garde son indépendance vis-à-vis de la grille",()=>{
  const full=examWithAllAnswers("blanc-2",EXAMS[1].sections.flatMap(s=>s.questions.map(q=>q.id)));
  assert.equal(full.score,20);
  let store=addHistory(emptyExamStore(),full);
  store=updateReviewCheck(store,"blanc-2",time,"b-expo:uniqueness",true);
  const restored=sanitizeExamStore(JSON.parse(JSON.stringify(store)));
  assert.equal(restored.history[0].score,20);
  assert.deepEqual(countChecks(restored.history[0]),{checked:1,total:16});
});
