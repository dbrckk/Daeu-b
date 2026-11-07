import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {createGeneratedExam,GENERATED_EXAM_ID,isSeed} from "./exam-generator.mjs";
import {validateExamBank,findExam,startExam,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,addHistory,sanitizeExamStore,updateReviewCheck} from "./exam-engine.mjs";
import {rubricForSection,validateRubrics,countChecks,validReviewKeys} from "./reasoning.mjs";
import {analyzeExamHistory} from "./exam-analytics.mjs";
import {gradeAnswer} from "./engine.mjs";
const time=Date.UTC(2026,10,7,16);
const qs=exam=>exam.sections.flatMap(s=>s.questions);
const validateApprox=(actual,expected,context)=>{
  assert.ok(Math.abs(actual-expected)<1e-9*Math.max(1,Math.abs(expected)),context+": "+actual+" vs "+expected);
};
test("graine uint32 valide, aucune création implicite de copies C",()=>{
  assert.equal(isSeed(0),true);
  assert.equal(isSeed(4294967295),true);
  for(const bad of [-1,0.1,4294967296,null,undefined,"3",NaN,Infinity])assert.equal(isSeed(bad),false);
  assert.equal(findExam(GENERATED_EXAM_ID),undefined);
  assert.throws(()=>createGeneratedExam(-1));
  assert.throws(()=>startExam(GENERATED_EXAM_ID,time));
  assert.throws(()=>startExam(GENERATED_EXAM_ID,time,-1));
  assert.throws(()=>startExam("blanc-1",time,23));
  assert.equal(EXAMS.length,2,"Les examens A/B restent intacts");
});
test("1000 sujets complets : quatre exercices et total exact de 20 points",()=>{
  for(let seed=0;seed<1000;seed++){
    const exam=createGeneratedExam(seed);
    assert.equal(exam.seed,seed);
    assert.equal(exam.sections.length,4);
    assert.equal(qs(exam).length,16);
    assert.deepEqual(validateExamBank([EXAMS[0],EXAMS[1],exam]),[], "seed "+seed);
    assert.deepEqual(validateRubrics([exam]),[],"seed "+seed);
    assert.equal(qs(exam).reduce((s,q)=>s+q.points,0),20);
    for(const section of exam.sections){
      assert.equal(section.questions.reduce((s,q)=>s+q.points,0),5);
      assert.equal(rubricForSection(section).steps.length,4);
      for(const q of section.questions){
        assert.ok(Number.isFinite(q.answer)||q.type==="choice","Réponse inattendue "+q.id);
        assert.ok(q.solution.length>40,q.id+" explication trop courte, seed "+seed);
        const answer=q.type==="choice"?q.answer:String(q.answer);
        assert.equal(gradeAnswer(q,answer).correct,true,q.id+" seed "+seed);
      }
    }
  }
});
test("formules mathématiques recalculées indépendamment des réponses du générateur",()=>{
  for(let seed=0;seed<250;seed++){
    const exam=createGeneratedExam(seed);
    const [s1,s2,s3,s4]=exam.sections;
    const quad=s1.context.match(/B\(x\)=−\(x−(\d+)\)²\+(\d+), pour 0 ≤ x ≤ (\d+)/);
    assert.ok(quad,"Quadratique manquante");
    const h=Number(quad[1]),gain=Number(quad[2]);
    assert.equal(Number(quad[3]),2*h);
    validateApprox(s1.questions[0].answer,2*h,"dérivée");
    validateApprox(s1.questions[1].answer,h,"maximum");
    validateApprox(s1.questions[2].answer,gain,"bénéfice");
    const low=h-Math.sqrt(gain),high=h+Math.sqrt(gain);
    assert.equal(s1.questions[3].answer,low+" < x < "+high);

    const suite=s2.context.match(/initialement (\d+) unités et augmente de ([\d,]+) % par période/);
    assert.ok(suite,"Suite manquante");
    const u0=Number(suite[1]),q=1+Number(suite[2].replace(",","."))/100;
    validateApprox(s2.questions[0].answer,q,"raison");
    validateApprox(s2.questions[1].answer,u0*q*q,"u2");
    const threshold=Number(s2.questions[2].prompt.match(/≥ ([\d,]+) \?/)[1].replace(",","."));
    const n=s2.questions[2].answer;
    assert.ok(Number.isInteger(n)&&n>=3&&n<=6);
    assert.ok(u0*q**(n-1)<threshold && u0*q**n>=threshold,"Rang du seuil");
    validateApprox(s2.questions[3].answer,u0*(1+q+q*q),"somme");

    const urn=s3.context.match(/contient (\d+) boules rouges et (\d+) boules bleues. On effectue (\d+) tirages/);
    assert.ok(urn,"Probabilités manquantes");
    const red=Number(urn[1]),blue=Number(urn[2]),trials=Number(urn[3]),p=red/(red+blue);
    validateApprox(s3.questions[0].answer,p,"p");
    validateApprox(s3.questions[1].answer,trials*p*((1-p)**(trials-1)),"P(X=1)");
    validateApprox(s3.questions[2].answer,1-(1-p)**trials,"P(X>=1)");
    validateApprox(s3.questions[3].answer,trials*p,"espérance");

    const integral=s4.context.match(/f\(t\)=(\d+)t²\+(\d+)t pour 0 ≤ t ≤ (\d+)/);
    assert.ok(integral,"Intégrale manquante");
    const A=Number(integral[1]),B=Number(integral[2]),L=Number(integral[3]);
    const I=A*L**3/3+B*L*L/2;
    validateApprox(s4.questions[0].answer,2*A+B,"dérivée");
    validateApprox(s4.questions[1].answer,A/3,"primitive");
    validateApprox(s4.questions[2].answer,I,"intégrale");
    validateApprox(s4.questions[3].answer,I/L,"moyenne");
  }
});
test("copie C reproduite exactement avec seed et sujet différent sur nouvelle graine",()=>{
  const e1=createGeneratedExam(123456);
  const e2=createGeneratedExam(123456);
  assert.deepEqual(e1,e2);
  const e3=createGeneratedExam(123457);
  assert.notDeepEqual(e1.sections.map(s=>s.context),e3.sections.map(s=>s.context));
  const session=startExam(GENERATED_EXAM_ID,time,123456);
  assert.equal(session.seed,123456);
  assert.equal(findExam(session.examId,session.seed).sections[0].context,e1.sections[0].context);
});
test("reprise de l'examen C et notes libres après import sans changement des résultats",()=>{
  let session=startExam(GENERATED_EXAM_ID,time,4294967295);
  const exam=findExam(session.examId,session.seed);
  session=updateExamAnswer(session,"c01",String(exam.sections[0].questions[0].answer));
  session=updateExamNotes(session,"c-integrales","J'ai donné la primitive et appliqué les bornes.");
  session={...session,sectionIndex:3};
  let store={...emptyExamStore(),active:session};
  const saved=sanitizeExamStore(JSON.parse(JSON.stringify(store)));
  assert.deepEqual(saved.active,session);
  const result=finishExam(saved.active,time+10000);
  assert.equal(result.score,1);
  assert.equal(result.seed,4294967295);
  assert.equal(result.notes["c-integrales"],"J'ai donné la primitive et appliqué les bornes.");
  store=addHistory(store,result);
  let restored=sanitizeExamStore(JSON.parse(JSON.stringify(store)));
  assert.equal(restored.history[0].seed,4294967295);
  assert.equal(restored.history[0].score,1);
  assert.equal(restored.history[0].sections[0].questions[0].expected,exam.sections[0].questions[0].answer);
  restored=updateReviewCheck(restored,GENERATED_EXAM_ID,time,"c-integrales:integral",true);
  assert.equal(restored.history[0].score,1);
  assert.deepEqual(countChecks(restored.history[0],exam),{checked:1,total:16});
  const again=sanitizeExamStore(JSON.parse(JSON.stringify(restored)));
  assert.deepEqual(again.history[0].selfChecks,{"c-integrales:integral":true});
});
test("barème C perfectible, 20/20 et 0/20 contrôlés",()=>{
  for(const seed of [0,1,27,999,4294967295]){
    const exam=createGeneratedExam(seed);
    let s=startExam(GENERATED_EXAM_ID,time,seed);
    assert.equal(finishExam(s,time+1000).score,0);
    for(const q of qs(exam))s=updateExamAnswer(s,q.id,String(q.answer));
    const result=finishExam(s,time+2000);
    assert.equal(result.score,20);
    assert.deepEqual(result.sections.map(s=>s.earned),[5,5,5,5]);
    const sanitized=sanitizeExamStore(addHistory(emptyExamStore(),result));
    assert.equal(sanitized.history[0].score,20);
  }
});
test("diagnostic ne classe pas comme répétitions deux sujets C de graines différentes",()=>{
  const r1=finishExam(startExam(GENERATED_EXAM_ID,time,100),time+1000);
  const r2=finishExam(startExam(GENERATED_EXAM_ID,time+2000,101),time+3000);
  const r3=finishExam(startExam(GENERATED_EXAM_ID,time+4000,100),time+5000);
  const distinct=analyzeExamHistory([r1,r2]);
  assert.equal(distinct.distinctSubjects,2);
  assert.equal(distinct.repeatedSubjects,false);
  const duplicate=analyzeExamHistory([r1,r2,r3]);
  assert.equal(duplicate.distinctSubjects,2);
  assert.equal(duplicate.repeatedSubjects,true);
});
test("import de copies A/B v4 et nouveaux contrôles ne changent pas les résultats",()=>{
  let staticSession=startExam("blanc-1",time);
  staticSession=updateExamAnswer(staticSession,"a01","4");
  const original=finishExam(staticSession,time+1000);
  const exported=JSON.parse(JSON.stringify(addHistory(emptyExamStore(),original)));
  const restored=sanitizeExamStore(exported);
  assert.equal(restored.history[0].score,1);
  assert.equal(restored.history[0].seed,undefined);
  assert.equal(restored.history[0].selfChecks["a-analyse:domain"],undefined);
});
