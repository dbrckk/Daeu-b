import test from "node:test";
import assert from "node:assert/strict";
import {TOPICS} from "./questions.mjs";
import {VARIANTS,injectVariants,materializeVariant,validateVariants} from "./variants.mjs";
import {flatten,validateTopics,parseNumber,gradeAnswer,emptyState,sanitizeState,recordAnswer,getMetrics,selectRound,DAY_MS} from "./engine.mjs";

const questions=flatten(TOPICS);
const ids=new Set(questions.map(q=>q.id));
test("couverture 20 jalons obligatoires, banque non triviale et données cohérentes",()=>{
  assert.deepEqual(validateTopics(TOPICS),[]);
  assert.equal(questions.length,116,"95 historiques + 16 approfondies + 5 ciblées v24");
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
  assert.equal(s.items.n01.dueAt,t+1000+DAY_MS);
  s=recordAnswer(s,"n01",true,t+DAY_MS);
  assert.equal(s.items.n01.confirmed,true);
  assert.equal(s.items.n01.dueAt,t+DAY_MS+3*DAY_MS);
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
  assert.equal(all.length,10);
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

test("banque paramétrique: IDs uniques, 20 jalons, 41 modèles",()=>{
  assert.deepEqual(validateVariants(TOPICS,100),[]);
  assert.equal(VARIANTS.length,41);
  const merged=flatten(injectVariants(TOPICS));
  assert.equal(merged.length,questions.length+VARIANTS.length);
  assert.equal(new Set(merged.map(q=>q.id)).size,merged.length);
});
test("une nouvelle variation après rappel, sans exposer la réponse",()=>{
  for (const template of VARIANTS){
    const first=materializeVariant(template,{random:()=>0.11});
    const second=materializeVariant(template,{random:()=>0.11,previousPrompt:first.prompt});
    assert.notEqual(first.prompt,second.prompt,template.id);
    assert.equal(first.id,template.id);
    assert.equal(gradeAnswer(first,String(first.answer)).correct,true,template.id);
    assert.equal(gradeAnswer(second,String(second.answer)).correct,true,template.id);
  }
});
test("réussite assistée ou même énoncé : pas d'acquis artificiel",()=>{
  const t=Date.UTC(2026,10,7,9);
  let s=recordAnswer(emptyState(),"v01",true,t,{signature:"énoncé 1",hinted:true});
  assert.equal(s.items.v01.confirmed,false);assert.equal(s.items.v01.streak,0);
  s=recordAnswer(s,"v01",true,t+DAY_MS,{signature:"énoncé 1"});
  assert.equal(s.items.v01.streak,1);assert.equal(s.items.v01.confirmed,false);
  s=recordAnswer(s,"v01",true,t+2*DAY_MS,{signature:"énoncé 1"});
  assert.equal(s.items.v01.confirmed,false);
  s=recordAnswer(s,"v01",true,t+3*DAY_MS,{signature:"énoncé 2"});
  assert.equal(s.items.v01.confirmed,true);
  s=recordAnswer(s,"v01",false,t+4*DAY_MS,{signature:"énoncé 3"});
  assert.equal(s.items.v01.confirmed,false);
});
test("validation complète de plusieurs valeurs et équations",()=>{
  for (const template of VARIANTS) {
    for(let k=0;k<150;k++){
      let seed=k;
      const random=()=>((seed= (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      const q=materializeVariant(template,{random});
      assert.equal(typeof q.prompt,"string");assert.ok(q.explanation.length>15,template.id+" seed "+k+" : "+q.explanation);
      assert.ok(Number.isFinite(q.answer),template.id);
      assert.equal(gradeAnswer(q,String(q.answer)).correct,true,template.id);
      assert.equal(gradeAnswer(q,"not a number").valid,false,template.id);
    }
  }
});


test("contrôle indépendant des 41 familles de calculs sur 3 280 énoncés",()=>{
  const reference={
    priority:m=>m.a+m.b*m.c,
    fractions:m=>(m.a+m.b)/m.d,
    powers:m=>Math.pow(m.base,m.a-m.b),
    sqrt:m=>Math.sqrt(m.base*m.base*m.mult*m.mult),
    evaluate:m=>m.a*Math.pow(m.x,2)+m.b*m.x+m.c,
    expand:m=>m.a+m.b,
    linear:m=>(m.c-m.b)/m.a,
    system:m=>(m.a+m.b)/3,
    inequality:m=>Math.floor((m.c-m.b)/m.a),
    discriminant:m=>m.b*m.b-4*m.a*m.c,
    minimum:m=>m.shift,
    mean:m=>(m.a+m.b+m.c+m.d)/4,
    weighted:m=>(m.a+2*m.b+3*m.c)/6,
    affine:m=>m.a*m.x+m.b,
    quadratic_image:m=>Math.pow(m.x,2)+m.a,
    rational_limit:m=>m.a/m.b,
    derivative:m=>2*m.a*m.x+m.b,
    cubic_derivative:m=>3*m.a*m.x*m.x,
    vertical_asymptote:m=>m.a/m.b,
    tvi_root:m=>Math.cbrt(m.power**3),
    bisection:m=>m.start/(2**m.n),
    arithmetic:m=>m.start+m.index*m.rate,
    geometric:m=>m.start*(m.rate**m.index),
    log_equation:m=>m.shift+m.target,
    exp_equation:m=>m.target,
    linear_integral:m=>m.a*m.x*m.x/2+m.b*m.x,
    polynomial_integral:m=>m.a*m.end*m.end*m.end,
    urn:m=>m.red/(m.red+m.blue),
    binomial_mean:m=>m.n*m.p,
    at_least_one:m=>1-Math.pow(1-m.p,m.n),
    conditional:m=>m.favorable*m.conditional/m.total,
    discount:m=>m.price-m.price*m.percent/100,
    unlike_fractions:m=>m.a/m.d+m.b/m.e,
    absolute_distance:m=>Math.abs(m.x-m.h),
    fractional_equation:m=>m.a+m.b*m.c,
    two_by_two_system:m=>(m.a-3*m.b)/5,
    negative_inequality:m=>Math.ceil((m.b-m.c)/m.a)-1,
    removable_limit:m=>2*m.a,
    horizontal_asymptote:m=>m.a/m.c,
    log_exp_product:m=>Math.log(Math.exp(m.a)*Math.exp(m.b)),
    exponential_log_power:m=>Math.pow(m.base,m.n)
  };
  assert.equal(Object.keys(reference).length,VARIANTS.length);
  for(const t of VARIANTS){
    for(let seed=0;seed<80;seed++){
      const q=t.make((()=>{
        let x=(seed+Math.imul(2654435761,seed+1))>>>0;
        return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
      })());
      const fn=reference[q.meta.kind];
      assert.ok(fn,"Formule de référence manquante : "+q.meta.kind);
      const expected=fn(q.meta);
      assert.ok(Math.abs(expected-q.answer)<=1e-10*Math.max(1,Math.abs(expected)),t.id+" seed "+seed+" attendu "+expected+" reçu "+q.answer);
    }
  }
});

test("16 exercices approfondis : exactitude et compatibilité des données locales",()=>{
  const byTopic=new Map(TOPICS.map(t=>[t.slug,t.questions.length]));
  for(const [topic,count] of [["statistiques",10],["limites",12],["continuite",10],["probas",13]])
    assert.equal(byTopic.get(topic),count,topic);
  const map=new Map(questions.map(q=>[q.id,q]));
  const cases=[["st07","6"],["st08","3"],["st09","13"],["st10","4"],
    ["l09","y=x+3"],["l10","−∞"],["l11","1/4"],["l12","1/4"],
    ["t07","−3/8"],["t08","11/64"],["t09","0,5 < x < 0,75"],["t10","g′(x)=eˣ>0"],
    ["p10","0,22"],["p11","7/11"],["p12","3/10"],["p13","1,5"]];
  assert.equal(cases.length,16);
  for(const [id,answer] of cases){
    const q=map.get(id);
    assert.ok(q,"identifiant absent "+id);
    assert.equal(gradeAnswer(q,answer).correct,true,"mauvaise correction "+id);
    assert.ok(q.hint.length>=15&&q.explanation.length>=65,"explication trop brève "+id);
  }
  assert.equal(flatten(injectVariants(TOPICS)).length,157);
  const prev=recordAnswer(emptyState(),"st05",true,Date.UTC(2026,10,9));
  const compatible=sanitizeState(JSON.parse(JSON.stringify(prev)),new Set(flatten(injectVariants(TOPICS)).map(q=>q.id)));
  assert.equal(compatible.items.st05.correct,1,"progrès antérieur inchangé");
  assert.equal(compatible.items.st10,undefined,"nouvelle question non acquise");
});


test("v24 : exercices ciblés, saisie exacte et stabilité des anciens IDs",()=>{
  const byId=new Map(questions.map(q=>[q.id,q]));
  for(const [id,answer] of [["n09","11/24"],["n10","7/3"],["n11","3√2"],["e09","1"],["e10","3"]]){
    const q=byId.get(id);
    assert.ok(q,id);
    assert.equal(gradeAnswer(q,answer).correct,true,id);
    assert.ok(q.explanation.length>=55,id);
  }
  assert.equal(questions.filter(q=>q.id.startsWith("n")).length,11);
  assert.equal(questions.filter(q=>q.id.startsWith("e")).length,10);
  const previous=recordAnswer(emptyState(),"n01",true,Date.UTC(2026,10,10));
  const restored=sanitizeState(previous,new Set(flatten(injectVariants(TOPICS)).map(q=>q.id)));
  assert.equal(restored.items.n01.correct,1);
  assert.equal(restored.items.n11,undefined);
});
