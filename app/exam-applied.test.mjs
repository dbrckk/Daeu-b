import test from "node:test";
import assert from "node:assert/strict";
import {EXAMS} from "./exams.mjs";
import {createAppliedExam,APPLIED_EXAM_ID} from "./exam-applied.mjs";
import {createGeneratedExam,isSeed} from "./exam-generator.mjs";
import {createAlternativeExam} from "./exam-alternative.mjs";
import {validateExamBank,findExam,isGeneratedExamId,startExam,updateExamAnswer,updateExamNotes,finishExam,emptyExamStore,addHistory,sanitizeExamStore,updateReviewCheck} from "./exam-engine.mjs";
import {validateRubrics,validReviewKeys,countChecks} from "./reasoning.mjs";
import {gradeAnswer} from "./engine.mjs";
import {inspectExamDraft} from "./exam-readiness.mjs";
import {analyzeExamHistory} from "./exam-analytics.mjs";
const t=Date.UTC(2026,10,11,12);
const qs=exam=>exam.sections.flatMap(s=>s.questions);
const close=(x,y,context)=>assert.ok(Math.abs(x-y)<1e-9*Math.max(1,Math.abs(y)),context+": "+x+" vs "+y);
test("graine uint32 et conservation totale des deux anciens générateurs",()=>{
 for(const bad of [null,undefined,-1,-.5,"1",NaN,Infinity,0x100000000])
   assert.throws(()=>createAppliedExam(bad));
 assert.equal(findExam(APPLIED_EXAM_ID),undefined);
 assert.equal(isGeneratedExamId(APPLIED_EXAM_ID),true);
 assert.equal(EXAMS.length,2);
 for(const seed of [0,1,42,123456,0xffffffff]){
   assert.deepEqual(findExam("blanc-c",seed),createGeneratedExam(seed));
   assert.deepEqual(findExam("blanc-d",seed),createAlternativeExam(seed));
   assert.deepEqual(findExam(APPLIED_EXAM_ID,seed),createAppliedExam(seed));
 }
});
test("1000 sujets E complets : 4 nouvelles familles, 16 réponses corrigibles, 20 points",()=>{
 let unique=new Set();
 for(let seed=0;seed<1000;seed++){
   const e=createAppliedExam(seed),questions=qs(e);
   assert.equal(e.id,APPLIED_EXAM_ID);
   assert.equal(e.seed,seed);
   assert.deepEqual(e,createAppliedExam(seed),"Non-déterminisme, seed "+seed);
   assert.deepEqual(e.sections.map(s=>s.id),["e-systeme","e-trigonometrie","e-sans-remise","e-racine"]);
   assert.equal(questions.length,16);
   assert.deepEqual(e.sections.map(s=>s.questions.reduce((n,q)=>n+q.points,0)),[5,5,5,5]);
   assert.deepEqual(validateExamBank([...EXAMS,e]),[],"Banque seed "+seed);
   assert.deepEqual(validateRubrics([e]),[],"Raisonnement seed "+seed);
   assert.equal(validReviewKeys(e).size,16);
   for(const q of questions){
     assert.ok(q.solution.length>85,"Correction courte "+seed+" "+q.id);
     if(q.type==="choice")assert.equal(new Set(q.options).size,q.options.length,"Choix dupliqués "+seed+" "+q.id);
     assert.equal(gradeAnswer(q,String(q.answer)).correct,true,"Réponse non corrigible "+seed+" "+q.id);
   }
   unique.add(e.sections.map(s=>s.context).join("|"));
 }
 assert.ok(unique.size>950,"Le sujet E ne diversifie pas suffisamment les valeurs : "+unique.size);
});
test("recalcul indépendant des quatre familles sur 500 jeux de données",()=>{
 for(let seed=0;seed<500;seed++){
   const [sys,tri,urn,rad]=createAppliedExam(seed).sections;
   const a=sys.context.match(/Une place adulte et deux places enfant coûtent (\d+) €.+Deux places adulte et une place enfant coûtent (\d+) €/);
   assert.ok(a,"Système non analysable "+seed);
   const one=Number(a[1]),two=Number(a[2]);
   const adult=(2*two-one)/3,child=(2*one-two)/3;
   close(sys.questions[0].answer,adult,"Adulte");close(sys.questions[1].answer,child,"Enfant");
   close(sys.questions[2].answer,3*adult+2*child,"Groupe");
   const budget=Number(sys.questions[3].prompt.match(/budget du groupe est de (\d+) €/)[1]);
   close(sys.questions[3].answer,budget-(3*adult+2*child),"Budget");
   const tmatch=tri.context.match(/mesurent (\d+) m et (\d+) m/);
   assert.ok(tmatch,"Triangle non analysable "+seed);
   const leg1=Number(tmatch[1]),leg2=Number(tmatch[2]),hyp=Math.hypot(leg1,leg2);
   close(tri.questions[0].answer,hyp,"Hypoténuse");
   close(tri.questions[1].answer,leg1*leg2/2,"Aire");
   close(tri.questions[2].answer,leg2/hyp,"Sinus");
   assert.equal(tri.questions[3].answer,leg1+"/"+hyp,"Cosinus");
   const u=urn.context.match(/contient (\d+) boules rouges et (\d+) boules bleues/);
   assert.ok(u,"Urne non analysable "+seed);
   const red=Number(u[1]),blue=Number(u[2]),n=red+blue;
   close(urn.questions[0].answer,red/n,"P rouge");
   close(urn.questions[1].answer,(red/n)*(blue/(n-1)),"P rouge/bleue");
   close(urn.questions[2].answer,2*red*blue/(n*(n-1)),"Exactement une rouge");
   close(urn.questions[3].answer,(red/n)*((red-1)/(n-1)),"Deux rouges");
   const rm=rad.context.match(/√\(x−\((-?\d+)\)\)\/\(x−\((-?\d+)\)\)/);
   assert.ok(rm,"Radicande non analysable "+seed);
   const lo=Number(rm[1]),excluded=Number(rm[2]);
   assert.ok(excluded>lo&&excluded-lo<=4);
   assert.equal(rad.questions[0].answer,"x ≥ "+lo+" et x ≠ "+excluded);
   assert.equal(rad.questions[1].answer,excluded);
   close(rad.questions[2].answer,3/(9-(excluded-lo)),"Évaluation racine");
   assert.equal(rad.questions[3].answer,lo);
 }
});
test("sauvegarde, rédaction et réimport : même sujet E, mêmes réponses et barème",()=>{
 for(const seed of [0,17,1024,0xffffffff]){
   const source=createAppliedExam(seed);
   let session=startExam(APPLIED_EXAM_ID,t,seed);
   for(const q of qs(source))session=updateExamAnswer(session,q.id,String(q.answer));
   for(const s of source.sections)session=updateExamNotes(session,s.id,"Méthode et hypothèses rédigées.");
   session={...session,sectionIndex:3};
   const copy={...emptyExamStore(),active:session};
   const restored=sanitizeExamStore(JSON.parse(JSON.stringify(copy)));
   assert.deepEqual(restored.active,session);
   assert.deepEqual(inspectExamDraft(source,restored.active).allFieldsFilled,true);
   const grade=finishExam(restored.active,t+1e5);
   assert.equal(grade.score,20);
   assert.deepEqual(grade.sections.map(s=>s.earned),[5,5,5,5]);
   let history=addHistory(emptyExamStore(),grade);
   history=updateReviewCheck(history,APPLIED_EXAM_ID,t,"e-racine:zero",true);
   const normalized=sanitizeExamStore(JSON.parse(JSON.stringify(history)));
   assert.equal(normalized.history[0].score,20);
   assert.equal(normalized.history[0].seed,seed);
   assert.equal(countChecks(normalized.history[0],source).checked,1);
   assert.ok(analyzeExamHistory(normalized.history).seenSkills>=8);
 }
});
test("répétition des sujets E détectée par graine, sans faux doublon C ou D",()=>{
 const x=createAppliedExam(8),y=createAppliedExam(9);
 const e=s=>finishExam(startExam(s.id,t,s.seed),t+2000);
 const same=[e(x),e(x)],different=[e(x),e(y)];
 assert.equal(analyzeExamHistory(same).repeatedSubjects,true);
 assert.equal(analyzeExamHistory(different).repeatedSubjects,false);
});
