import test from "node:test";
import assert from "node:assert/strict";
import {TOPICS} from "./questions.mjs";
import {flatten,validateTopics,parseNumber,gradeAnswer,emptyState,sanitizeState,recordAnswer,getMetrics,selectRound,DAY_MS} from "./engine.mjs";

const questions=flatten(TOPICS);
const ids=new Set(questions.map(q=>q.id));
test("couverture 20 jalons obligatoires, banque non triviale et données cohérentes",()=>{
  assert.deepEqual(validateTopics(TOPICS),[]);
  assert.ok(questions.length>=90, "banque de 90 questions minimum");
  assert.equal(ids.size,questions.length);
  assert.equal(TOPICS.length,13);
  assert.equal(questions.filter(q=>q.type==="number").length>50,true);
  for(const topic of TOPICS) assert.ok(topic.questions.length>=5);
});
test("notation fraction/virgule/espaces et refus des expressions non sûres",()=>{
  const q={type:"number",answer:0.75};
  for(const input of ["3/4","0,75"," 0.75 ","6/8"]) assert.equal(gradeAnswer(q,input).correct,true);
  for(const input of ["1/0","Math.random()","3+4","","Infinity","2//3"]) assert.equal(gradeAnswer(q,input).valid,false);
  assert.equal(gradeAnswer(q,"1/2").correct,false);
  const choice={type:"choice",answer:"x=2",options:["x=2","x=3"]};
  assert.equal(gradeAnswer(choice,"x=2").correct,true);
  assert.equal(gradeAnswer(choice,"x=3").correct,false);
  assert.equal(gradeAnswer(choice,"x=4").valid,false);
  assert.equal(parseNumber("−1/2"),-.5);
});
test("révision espacée et acquisition après deux dates distinctes",()=>{
  const t=Date.UTC(2026,10,7,12);
  let s=emptyState();
  s=recordAnswer(s,"n01",true,t);
  assert.equal(s.items.n01.confirmed,false);
  assert.equal(s.items.n01.dueAt,t+DAY_MS);
  s=recordAnswer(s,"n01",true,t+1000);
  assert.equal(s.items.n01.confirmed,false,"deux succès le même jour ne suffisent pas");
  assert.equal(s.items.n01.dueAt,t+1000+3*DAY_MS);
  s=recordAnswer(s,"n01",true,t+DAY_MS);
  assert.equal(s.items.n01.confirmed,true);
  assert.equal(s.items.n01.dueAt,t+DAY_MS+7*DAY_MS);
  s=recordAnswer(s,"n01",false,t+2*DAY_MS);
  assert.equal(s.items.n01.confirmed,false);
  assert.equal(s.items.n01.streak,0);
  assert.equal(s.items.n01.wrong,1);
  assert.equal(s.items.n01.dueAt,t+2*DAY_MS);
});
test("sélection des rappels uniquement à échéance et filtres",()=>{
  const now=Date.UTC(2026,10,10);
  let s=recordAnswer(emptyState(),"n01",false,now-500);
  s=recordAnswer(s,"n02",true,now);
  const due=selectRound(s,questions,{topic:"nombres",mode:"due",now,random:()=>.25});
  assert.deepEqual(due.map(q=>q.id),["n01"]);
  const wrong=selectRound(s,questions,{topic:"nombres",mode:"wrong",now,random:()=>.25});
  assert.deepEqual(wrong.map(q=>q.id),["n01"]);
  const all=selectRound(s,questions,{topic:"nombres",mode:"all",limit:10,now,random:()=>.25});
  assert.equal(all.length,8);
  assert.equal(all[0].id,"n01","rappel arrivé à échéance en premier");
  assert.equal(selectRound(s,questions,{topic:"unknown",mode:"all"}).length,0);
  assert.equal(selectRound(s,questions,{mode:"invalid"}).length,0);
});
test("métriques et validation des sauvegardes",()=>{
  const now=Date.UTC(2026,10,11);
  let s=recordAnswer(emptyState(),"n01",false,now);
  let m=getMetrics(s,questions,now);
  assert.equal(m.attempted,1);assert.equal(m.due,1);assert.equal(m.mastered,0);
  const clean=sanitizeState(JSON.parse(JSON.stringify(s)),ids);
  assert.deepEqual(clean,s);
  assert.throws(()=>sanitizeState({version:1,items:{}},ids));
  const unsafe={version:2,items:{"n01":{...s.items.n01},unknown:{attempts:1}}};
  assert.deepEqual(sanitizeState(unsafe,ids),s);
  assert.deepEqual(sanitizeState({version:2,items:{n01:{attempts:999,correct:0,wrong:1,streak:0,confirmed:false,lastAt:now,dueAt:now,lastCorrectDay:null}}},ids),emptyState());
});
test("échantillons de calcul issus de chapitres différents",()=>{
  const map=new Map(questions.map(q=>[q.id,q]));
  const examples=[["n01","1/4"],["a02","(x−4)(x+4)"],["e01","6"],["s01","1"],["st05","2/3"],["f04","2"],["d01","8"],["l02","4"],["t06","1/16"],["u02","54"],["x03","1"],["i04","-1/2"],["p09","0,36"]];
  for(const [id,answer] of examples) assert.equal(gradeAnswer(map.get(id),answer).correct,true,id);
});
