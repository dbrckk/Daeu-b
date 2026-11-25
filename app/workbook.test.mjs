import test from "node:test";
import assert from "node:assert/strict";
import {blankWork,emptyWorkbook,sanitizeWorkbook,readWork,changeWork,recordWorkbookReview,sanitizeStepReviews,workbookReviewPlan,MAX_STEP_REVIEWS,encodeStroke,parseStroke} from "./workbook.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY} from "./persistence.mjs";
import {emptyState,recordAnswer} from "./engine.mjs";
import {checkMathSteps} from "./math-step-checker.mjs";
import {emptyExamStore} from "./exam-engine.mjs";
const known=new Set(["q01","v01"]);
test("Cahier : traits vectoriels et texte multi-lignes reprennent exactement",()=>{
 const stroke=encodeStroke([[0,0],[100,70],[600,800],[900,1200]]);
 assert.deepEqual(parseStroke(stroke),[[0,0],[100,70],[600,800],[900,1200]]);
 const work={text:"2x + 3 = 7\\n2x = 4\\nx = 2",pages:[[stroke],[],[]]};
 const changed=changeWork(emptyWorkbook(),"quiz:q01:0",work);
 assert.deepEqual(readWork(changed,"quiz:q01:0"),work);
 assert.deepEqual(readWork(changed,"cours:01-calcul-numerique"),blankWork());
 assert.deepEqual(sanitizeWorkbook(changed),changed);
});
test("Refuser les cahiers corrompus, chemins arbitraires et dépassements",()=>{
 for(const invalid of ["1,2;901,0","0,1201","-1,2","1,2;Infinity,0","<svg>","1,2;","1e3,2"])
   assert.throws(()=>parseStroke(invalid));
 for(const key of ["","../","quiz:<script>","a".repeat(131)])assert.throws(()=>changeWork(emptyWorkbook(),key,blankWork()));
 assert.throws(()=>changeWork(emptyWorkbook(),"cours:1",{text:"a".repeat(6001),pages:[[]]}));
 assert.throws(()=>changeWork(emptyWorkbook(),"cours:1",{text:"",pages:Array.from({length:9},()=>[])}));
});
test("Stockage unifié : les autres opérations ne suppriment pas les brouillons",()=>{
 const s=createVolatileStorage(),p=createPersistence(s,known);
 const key="quiz:q01:0",work={text:"x²=9\\nx=3 ou -3",pages:[[encodeStroke([[1,2],[4,5]])]]};
 let v=p.updateWorkbook(changeWork(p.snapshot().workbook,key,work));
 assert.deepEqual(readWork(v.workbook,key),work);
 v=p.updateExams(emptyExamStore());
 v=p.updatePractice(emptyState());
 assert.deepEqual(readWork(v.workbook,key),work);
 const raw=JSON.parse(s.getItem(DATA_KEY));
 assert.deepEqual(readWork(createPersistence(s,known).snapshot().workbook,key),work);
 assert.equal(raw.version,1);
});
test("Ancien bundle sans cahier : migration transparente et reset explicite",()=>{
 const s=createVolatileStorage(),p=createPersistence(s,known);
 p.updatePractice(emptyState());
 const data=JSON.parse(s.getItem(DATA_KEY));delete data.workbook;
 s.setItem(DATA_KEY,JSON.stringify(data));
 const restored=createPersistence(s,known);
 assert.deepEqual(restored.snapshot().workbook,emptyWorkbook());
 restored.updateWorkbook(changeWork(emptyWorkbook(),"cours:01-calcul-numerique",{text:"ok",pages:[[]]}));
 assert.equal(Object.keys(restored.replaceAll(emptyState(),emptyExamStore()).workbook.entries).length,0);
});

test("Cahier agrandi : anciens traits et nouvelles coordonnées coexistent sans migration",()=>{
 const legacy="600,800;0,0";
 const expanded=encodeStroke([[0,0],[900,1200]]);
 const value=changeWork(emptyWorkbook(),"quiz:q01",{text:"",pages:[[legacy,expanded]]});
 assert.deepEqual(parseStroke(readWork(value,"quiz:q01").pages[0][0]),[[600,800],[0,0]]);
 assert.deepEqual(parseStroke(readWork(value,"quiz:q01").pages[0][1]),[[0,0],[900,1200]]);
});

test("longues équations : 240 gestes par page et anciens cahiers inchangés",()=>{
 const stroke=encodeStroke([[10,12],[18,27],[24,35]]);
 const book=changeWork(emptyWorkbook(),"quiz:longue-equation",{
   text:"",pages:[Array.from({length:240},()=>stroke),[],[]]
 });
 assert.equal(readWork(book,"quiz:longue-equation").pages[0].length,240);
 assert.throws(()=>changeWork(emptyWorkbook(),"quiz:longue-equation",{
   text:"",pages:[Array.from({length:241},()=>stroke)]
 }),/Trop de traits/);
});


test("diagnostics : persistance, déduplication, correction et absence d'impact sur les acquis",()=>{
 const key="cours:03-equations-inequations-systemes",text="-2x<4\nx<-2";
 const original=changeWork(emptyWorkbook(),key,{...blankWork(),text});
 const result=recordWorkbookReview(original,key,text,checkMathSteps(text),100);
 assert.equal(result.changed,true);
 assert.equal(result.book.stepReviews.length,1);
 assert.equal(recordWorkbookReview(result.book,key,text,checkMathSteps(text),101).changed,false);
 assert.equal(recordWorkbookReview(result.book,key,"autre",checkMathSteps(text),101).changed,false);
 const s=createVolatileStorage(),p=createPersistence(s,known);
 p.updateWorkbook(result.book);
 const snapshot=createPersistence(s,known).snapshot();
 assert.deepEqual(snapshot.practice,emptyState());
 assert.equal(snapshot.workbook.stepReviews.length,1);
 assert.equal(workbookReviewPlan(snapshot.workbook,snapshot.practice,200).daily[0].code,"inequality");
 const correct="-2x<4\nx>-2";
 const edited=changeWork(snapshot.workbook,key,{...blankWork(),text:correct});
 assert.equal(edited.stepReviews.length,1);
 const fixed=recordWorkbookReview(edited,key,correct,checkMathSteps(correct),300).book;
 assert.equal(fixed.stepReviews.length,2);
 assert.equal(workbookReviewPlan(fixed,emptyState(),400).daily.length,0);
 assert.equal(workbookReviewPlan(fixed,emptyState(),400).history.length,2);
 assert.equal(changeWork(fixed,key,blankWork()).stepReviews.length,2);
});

test("historique borné, import invalide ignoré et examen exclu",()=>{
 const key="quiz:e05";
 let book=emptyWorkbook();
 for(let i=1;i<=MAX_STEP_REVIEWS+5;i++){
   const text="x="+i+"\nx="+(i+1);
   book=changeWork(book,key,{...blankWork(),text});
   book=recordWorkbookReview(book,key,text,checkMathSteps(text),i).book;
 }
 assert.equal(book.stepReviews.length,MAX_STEP_REVIEWS);
 assert.equal(book.stepReviews[0].at,6);
 assert.deepEqual(sanitizeStepReviews([{...book.stepReviews[0],context:"exam:a"},{...book.stepReviews[0],skills:[{code:"__proto__",count:1}]}]),[]);
 const exam=changeWork(book,"exam:a",{...blankWork(),text:"2+2=5"});
 assert.equal(recordWorkbookReview(exam,"exam:a","2+2=5",checkMathSteps("2+2=5"),100).changed,false);
 assert.deepEqual(sanitizeWorkbook({...book,stepReviews:[{junk:true}]}).stepReviews,undefined);
});

test("plan : priorités, succès sans aide et répétition espacée",()=>{
 const key="quiz:e05",text="-2x<4\nx<-2";
 let book=changeWork(emptyWorkbook(),key,{...blankWork(),text});
 book=recordWorkbookReview(book,key,text,checkMathSteps(text),100).book;
 let practice=recordAnswer(emptyState(),"e05",true,110,{hinted:true});
 assert.equal(workbookReviewPlan(book,practice,120).rows[0].practiced,0);
 practice=recordAnswer(practice,"e05",true,130);
 assert.equal(workbookReviewPlan(book,practice,140).rows[0].practiced,1);
 practice=recordAnswer(practice,"e04",false,140);
 assert.equal(workbookReviewPlan(book,practice,150).rows[0].due,1);
 assert.equal(workbookReviewPlan(book,practice,150).daily[0].remaining,3);
});
