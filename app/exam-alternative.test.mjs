import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {createGeneratedExam} from "./exam-generator.mjs";
import {ALTERNATIVE_EXAM_ID,createAlternativeExam} from "./exam-alternative.mjs";
import {isGeneratedExamId,findExam,startExam,updateExamAnswer,updateExamNotes,finishExam,addHistory,emptyExamStore,sanitizeExamStore,updateReviewCheck,validateExamBank} from "./exam-engine.mjs";
import {validateRubrics,countChecks,validReviewKeys} from "./reasoning.mjs";
import {analyzeExamHistory} from "./exam-analytics.mjs";
import {gradeAnswer} from "./engine.mjs";
const time=Date.UTC(2026,10,10,9);
const near=(actual,expected,where)=>assert.ok(Math.abs(actual-expected)<=1e-9*Math.max(1,Math.abs(expected)),where+" : "+actual+" ≠ "+expected);
const qs=exam=>exam.sections.flatMap(s=>s.questions);
const french=s=>Number(s.replace(",","."));

test("D accepte uniquement des graines uint32 et ne modifie pas les sujets C existants",()=>{
  for(const invalid of [null,undefined,-1,0.5,"7",4294967296])assert.throws(()=>createAlternativeExam(invalid));
  assert.equal(findExam(ALTERNATIVE_EXAM_ID),undefined);
  assert.equal(isGeneratedExamId(ALTERNATIVE_EXAM_ID),true);
  assert.equal(isGeneratedExamId("blanc-c"),true);
  assert.equal(isGeneratedExamId("blanc-1"),false);
  assert.throws(()=>startExam(ALTERNATIVE_EXAM_ID,time));
  assert.equal(EXAMS.length,2);
  const c=createGeneratedExam(400);
  assert.deepEqual(findExam("blanc-c",400),c);
  assert.equal(c.sections[0].id,"c-optimisation");
});

test("1000 sujets D complets avec corrigés et barème /20",()=>{
  for(let seed=0;seed<1000;seed++){
    const exam=createAlternativeExam(seed);
    assert.deepEqual(createAlternativeExam(seed),exam,"génération déterministe");
    assert.equal(exam.id,ALTERNATIVE_EXAM_ID);
    assert.equal(exam.sections.length,4);
    assert.equal(qs(exam).length,16);
    assert.deepEqual(validateExamBank([...EXAMS,exam]),[],"bank seed "+seed);
    assert.deepEqual(validateRubrics([exam]),[],"rubric seed "+seed);
    assert.deepEqual(exam.sections.map(s=>s.questions.reduce((sum,q)=>sum+q.points,0)),[5,5,5,5]);
    for(const section of exam.sections){
      assert.equal(section.rubric.steps.length,4);
      assert.equal(new Set(section.rubric.steps.map(s=>s.id)).size,4);
    }
    for(const q of qs(exam)){
      assert.ok(q.solution.length>55,"solution trop brève "+q.id);
      assert.equal(gradeAnswer(q,String(q.answer)).correct,true,"non gradable "+q.id+" seed "+seed);
    }
  }
});

test("300 jeux vérifiés par formules indépendantes pour les quatre familles",()=>{
  for(let seed=0;seed<300;seed++){
    const e=createAlternativeExam(seed),[r,p,stats,expo]=e.sections;
    const rational=r.context.match(/f\(x\)=x\+(\d+)\+(\d+)\/\(x−(\d+)\)/);
    assert.ok(rational,"rationnelle manquante");
    const k=Number(rational[1]),c=Number(rational[2]),b=Number(rational[3]);
    near(r.questions[0].answer,b,"pôle");
    near(r.questions[1].answer,(b+1)+k+c,"valeur de f");
    near(r.questions[2].answer,1-c/4,"dérivée en b+2");
    assert.equal(r.questions[3].answer,"y = x + "+k);
    assert.ok(r.questions[3].options.includes("x = "+b),"asymptote verticale distractrice");

    const cond=p.context.match(/P\(A\)=([\d,]+).*P\(B\|A\)=([\d,]+).*P\(B\|non A\)=([\d,]+)/);
    assert.ok(cond,"arbre manquant");
    const a=french(cond[1]),yes=french(cond[2]),no=french(cond[3]);
    const intersection=a*yes,positive=intersection+(1-a)*no;
    near(p.questions[0].answer,intersection,"intersection");
    near(p.questions[1].answer,positive,"totales");
    near(p.questions[2].answer,intersection/positive,"Bayes");
    near(p.questions[3].answer,1-positive,"complémentaire");
    assert.ok(positive>0&&positive<1&&intersection<positive);

    const values=stats.context.match(/cinq mesures suivantes : ([\d ;]+)/);
    assert.ok(values,"série absente");
    const nums=values[1].trim().split(/\s*;\s*/).map(Number);
    assert.equal(nums.length,5);
    const mean=nums.reduce((x,y)=>x+y,0)/5;
    const populationVariance=nums.reduce((s,x)=>s+(x-mean)**2,0)/5;
    near(stats.questions[0].answer,mean,"moyenne");
    near(stats.questions[1].answer,[...nums].sort((a,b)=>a-b)[2],"médiane");
    near(stats.questions[2].answer,populationVariance,"variance");
    near(stats.questions[3].answer,Math.max(...nums)-Math.min(...nums),"étendue");

    const g=expo.context.match(/g\(x\)=exp\((\d+)x\)−(\d+)/);
    assert.ok(g,"fonction exponentielle absente");
    const factor=Number(g[1]),n=Number(g[2]);
    near(expo.questions[0].answer,1-n,"g0");
    near(expo.questions[1].answer,factor,"dérivée g0");
    near(expo.questions[2].answer,Math.log(n)/factor,"zéro exact");
    assert.ok(expo.questions[2].answer>0&&expo.questions[2].answer<2,"zéro dans [0,2]");
    assert.ok(Math.exp(2*factor)-n>0,"TVI doit changer de signe");
    assert.equal(expo.questions[3].answer,"Un seul");
  }
});

test("D: reprise, corrigé, copies importées et étapes de rédaction",()=>{
  for(const seed of [0,17,420,0xFFFFFFFF]){
    let session=startExam(ALTERNATIVE_EXAM_ID,time,seed);
    const exam=createAlternativeExam(seed);
    session=updateExamAnswer(session,"d01",String(exam.sections[0].questions[0].answer));
    session=updateExamNotes(session,"d-statistiques","Justification de la variance de population.");
    session={...session,sectionIndex:3};
    const restored=sanitizeExamStore({...emptyExamStore(),active:JSON.parse(JSON.stringify(session))});
    assert.deepEqual(restored.active,session);
    const grade=finishExam(restored.active,time+1234);
    assert.equal(grade.seed,seed);
    assert.equal(grade.score,1);
    assert.equal(grade.sections.length,4);
    let store=sanitizeExamStore(addHistory(emptyExamStore(),grade));
    assert.equal(store.history[0].seed,seed);
    assert.equal(store.history[0].score,1);
    assert.equal(store.history[0].notes["d-statistiques"],"Justification de la variance de population.");
    const key="d-statistiques:variance";
    assert.ok(validReviewKeys(exam).has(key));
    store=updateReviewCheck(store,ALTERNATIVE_EXAM_ID,time,key,true);
    const imported=sanitizeExamStore(JSON.parse(JSON.stringify(store)));
    assert.deepEqual(countChecks(imported.history[0],exam),{checked:1,total:16});
    assert.equal(imported.history[0].score,1);
    let full=startExam(ALTERNATIVE_EXAM_ID,time+2000,seed);
    for(const q of qs(exam))full=updateExamAnswer(full,q.id,String(q.answer));
    const result=finishExam(full,time+3000);
    assert.equal(result.score,20);
    assert.deepEqual(result.sections.map(s=>s.earned),[5,5,5,5]);
    assert.equal(finishExam(startExam(ALTERNATIVE_EXAM_ID,time,seed),time+5).score,0);
  }
});

test("historique distingue D et C par graines, et conserve les anciennes copies",()=>{
  const c=finishExam(startExam("blanc-c",time,77),time+1000);
  const d=finishExam(startExam(ALTERNATIVE_EXAM_ID,time+2000,77),time+3000);
  const d2=finishExam(startExam(ALTERNATIVE_EXAM_ID,time+4000,78),time+5000);
  const history=sanitizeExamStore({version:1,active:null,history:[c,d,d2]}).history;
  assert.equal(history.length,3);
  assert.equal(history[0].seed,77);
  assert.equal(history[0].sections[0].id,"c-optimisation");
  assert.equal(history[1].seed,77);
  assert.equal(history[1].sections[0].id,"d-rationnelle");
  const report=analyzeExamHistory(history);
  assert.equal(report.distinctSubjects,3);
  assert.equal(report.repeatedSubjects,false);
  const duplicate=analyzeExamHistory([...history,d2]);
  assert.equal(duplicate.distinctSubjects,3);
  assert.equal(duplicate.repeatedSubjects,true);
  const lessons=report.weaknesses.filter(x=>x.skill==="Bayes"||x.skill==="probabilités totales");
  assert.equal(lessons.length,2);
  assert.ok(lessons.every(x=>x.lesson==="12-probabilites.md"));
});
