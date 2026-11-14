import test from "node:test";
import assert from "node:assert/strict";
import {blankWork,emptyWorkbook,changeWork,readWork,encodeStroke,sanitizeWorkbook} from "./workbook.mjs";
import {pageInkFingerprint} from "./ink-drafts.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY} from "./persistence.mjs";
import {editInkTranscript} from "./ink-transcript.mjs";

const sample=encodeStroke([[25,55],[45,78],[65,100]]);
const other=encodeStroke([[30,55],[45,78],[65,100]]);
const key="quiz:q01";
const withDraft=(stroke=sample,text="x=1",edited=true)=>({
  ...blankWork(),
  pages:[[stroke]],
  inkDrafts:{"0":{source:pageInkFingerprint([stroke]),text,edited}}
});
test("Correction au doigt persistée dans le bundle local et restaurée après rechargement",()=>{
  const store=createVolatileStorage(),known=new Set(["q01"]);
  const first=createPersistence(store,known);
  const corrected=editInkTranscript("x=1",2,"replace","2");
  const input=withDraft(sample,corrected,true);
  const saved=first.updateWorkbook(changeWork(first.snapshot().workbook,key,input));
  assert.deepEqual(readWork(saved.workbook,key),input);
  const reopened=createPersistence(store,known);
  assert.deepEqual(readWork(reopened.snapshot().workbook,key),input);
  assert.equal(JSON.parse(store.getItem(DATA_KEY)).workbook.entries[key].inkDrafts[0].edited,true);
});
test("Un trait effacé ou remplacé invalide la transcription sans perdre la copie",()=>{
  const book=changeWork(emptyWorkbook(),key,withDraft());
  const changed={...readWork(book,key),pages:[[other]]};
  const after=changeWork(book,key,changed);
  assert.equal(readWork(after,key).inkDrafts,undefined);
  assert.deepEqual(readWork(after,key).pages,[[other]]);
  const wiped=changeWork(book,key,{...readWork(book,key),pages:[[]]});
  assert.equal(readWork(wiped,key).inkDrafts,undefined);
  assert.deepEqual(readWork(wiped,key).pages,[[]]);
});
test("Les transcriptions d'autres pages restent isolées et sont préservées",()=>{
  const page0=[sample],page1=[other];
  const drafts={
    0:{source:pageInkFingerprint(page0),text:"x=1",edited:true},
    1:{source:pageInkFingerprint(page1),text:"x=2",edited:true}
  };
  const original=changeWork(emptyWorkbook(),key,{text:"",pages:[page0,page1],inkDrafts:drafts});
  const changed=changeWork(original,key,{...readWork(original,key),pages:[[sample],[sample]]});
  const result=readWork(changed,key);
  assert.deepEqual(result.inkDrafts,{"0":drafts[0]});
  assert.deepEqual(result.pages,[[sample],[sample]]);
});
test("Ancien cahier sans transcriptions : format inchangé",()=>{
  const legacy=changeWork(emptyWorkbook(),key,{text:"calculs",pages:[[sample]]});
  assert.deepEqual(readWork(legacy,key),{text:"calculs",pages:[[sample]]});
  assert.deepEqual(sanitizeWorkbook(legacy),legacy);
});
test("Ne jamais accepter des métadonnées malformées ou HTML injecté",()=>{
  const start=withDraft();
  const bogus=[
    {...start,inkDrafts:[]},
    {...start,inkDrafts:{"9":{source:"a",text:"x=1",edited:true}}},
    {...start,inkDrafts:{"0":{source:"fake",text:"<img>",edited:true}}},
    {...start,inkDrafts:{"0":{source:"fake",text:"x=1",edited:"true"}}},
    {...start,inkDrafts:{"0":{source:"abc".repeat(100),text:"x=1",edited:true}}}
  ];
  for(const input of bogus)assert.throws(()=>changeWork(emptyWorkbook(),key,input));
});
test("Empreinte déterministe : ordre et segmentation des traits comptent",()=>{
  const page=[sample,other];
  assert.equal(pageInkFingerprint(page),pageInkFingerprint([...page]));
  assert.notEqual(pageInkFingerprint(page),pageInkFingerprint([...page].reverse()));
  assert.notEqual(pageInkFingerprint([sample]),pageInkFingerprint([sample,sample]));
});
