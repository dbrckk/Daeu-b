import test from "node:test";
import assert from "node:assert/strict";
import {blankWork,emptyWorkbook,sanitizeWorkbook,readWork,changeWork,encodeStroke,parseStroke} from "./workbook.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY} from "./persistence.mjs";
import {emptyState} from "./engine.mjs";
import {emptyExamStore} from "./exam-engine.mjs";
const known=new Set(["q01","v01"]);
test("Cahier : traits vectoriels et texte multi-lignes reprennent exactement",()=>{
 const stroke=encodeStroke([[0,0],[100,70],[600,800]]);
 assert.deepEqual(parseStroke(stroke),[[0,0],[100,70],[600,800]]);
 const work={text:"2x + 3 = 7\\n2x = 4\\nx = 2",pages:[[stroke],[],[]]};
 const changed=changeWork(emptyWorkbook(),"quiz:q01:0",work);
 assert.deepEqual(readWork(changed,"quiz:q01:0"),work);
 assert.deepEqual(readWork(changed,"cours:01-calcul-numerique"),blankWork());
 assert.deepEqual(sanitizeWorkbook(changed),changed);
});
test("Refuser les cahiers corrompus, chemins arbitraires et dépassements",()=>{
 for(const invalid of ["1,2;999,0","-1,2","1,2;Infinity,0","<svg>","1,2;","1e3,2"])
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
