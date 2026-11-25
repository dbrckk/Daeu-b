import test from "node:test";
import assert from "node:assert/strict";
import {TOPICS} from "./questions.mjs";
import {COURSES,courseInfo,courseUrl,practiceTopicForCourse,practiceUrlForCourse,stepReview,stepReviewUrl,stepReviewRecommendations,stepReviewLevel,selectStepReviewQuestions} from "./course-catalog.mjs";
import {injectVariants} from "./variants.mjs";
import {flatten,emptyState,recordAnswer,DAY_MS} from "./engine.mjs";
import {checkMathSteps} from "./math-step-checker.mjs";
test("13 liens d'entraînement exacts, sans domaine fictif ni duplication",()=>{
  const slugs=new Set(COURSES.map(([slug])=>slug));
  assert.equal(slugs.size,18);
  const topics=new Set(TOPICS.map(t=>t.slug));
  assert.equal(topics.size,13);
  const mapped=new Set();
  for(const topic of TOPICS){
    const slug=topic.lesson.slice(0,-3);
    assert.ok(slugs.has(slug),slug);
    assert.equal(practiceTopicForCourse(topic.lesson),topic.slug,slug);
    assert.equal(practiceUrlForCourse(slug),"./?topic="+encodeURIComponent(topic.slug)+"#practice-title");
    assert.ok(!mapped.has(slug),"Cours utilisé deux fois dans le sélecteur : "+slug);
    mapped.add(slug);
  }
  assert.equal(mapped.size,topics.size);
  for(const [slug,title] of COURSES){
    assert.equal(courseInfo(slug),title);
    assert.equal(courseUrl(slug),"./course.html?course="+slug);
    if(!mapped.has(slug)){
      assert.equal(practiceTopicForCourse(slug),null,slug);
      assert.equal(practiceUrlForCourse(slug),"./#practice-title",slug);
    }
  }
});
test("paramètres étrangers jamais convertis en cibles d'entraînement",()=>{
  for(const raw of ["","../evil","https://example.com/x","__proto__","99-examen.md","/maths/cours-absent.md"]){
    assert.equal(practiceTopicForCourse(raw),null,raw);
    assert.equal(practiceUrlForCourse(raw),"./#practice-title",raw);
    assert.equal(courseUrl(raw),null,raw);
  }
  assert.equal(practiceTopicForCourse("maths/07-limites-asymptotes.md"),"limites");
});


test("les sept révisions ciblées ont des questions réelles et des variantes",()=>{
  const bank=new Map(flatten(injectVariants(TOPICS)).map(q=>[q.id,q]));
  for(const code of ["numeric","linear","inequality","quadratic","rational","radical","derivative"]){
    const review=stepReview(code);
    assert.ok(courseInfo(review.lesson),code);
    assert.equal(new Set(review.ids).size,review.ids.length);
    assert.ok(review.ids.length>=3&&review.ids.length<=10);
    for(const id of review.ids)assert.ok(bank.has(id),code+" "+id);
    assert.ok(review.ids.some(id=>bank.get(id).type==="variant"),code);
    assert.equal(stepReviewUrl(code),"./?revision="+code+"#practice-title");
  }
  for(const bad of ["__proto__","constructor","../evil",null,undefined,"unknown"]){
    assert.equal(stepReview(bad),null);
    assert.equal(stepReviewUrl(bad),null);
  }
  const review=stepReview("inequality");review.ids.length=0;
  assert.ok(stepReview("inequality").ids.length>0);
});
test("seules les erreurs établies déclenchent une remédiation, regroupées par notion",()=>{
  const cases=[
    ["2+3=6","numeric"],["2x=6\nx=4","linear"],
    ["-2x<4\nx<-2","inequality"],["x²≤4\nS=]-2;2[","quadratic"],
    ["(x-1)/(x-1)≥0\nS=R","rational"],["√(x+1)=x\nx=2","radical"],
    ["f(x)=x²\nf'(x)=x","derivative"]
  ];
  for(const [source,code] of cases){
    const rows=stepReviewRecommendations(checkMathSteps(source).entries);
    assert.equal(rows.length,1,source);
    assert.equal(rows[0].code,code,source);
  }
  const review=checkMathSteps("-2x<4\nx<-2\nx≤-2\n\n2+3=6\n\nx³<1");
  assert.deepEqual(stepReviewRecommendations(review.entries).map(r=>[r.code,r.count]),[["inequality",2],["numeric",1]]);
  assert.deepEqual(stepReviewRecommendations(checkMathSteps("2x=6\nx=3\n\nx³<1").entries),[]);
  assert.deepEqual(stepReviewRecommendations([{kind:"unsupported",skill:"linear"},{kind:"error",skill:"__proto__"}]),[]);
});


test("révision adaptative : fondamentaux, consolidation, transfert et priorités",()=>{
  const bank=flatten(injectVariants(TOPICS)),now=Date.UTC(2026,10,25,12);
  const fresh=selectStepReviewQuestions("inequality",bank,emptyState(),{now});
  assert.deepEqual(fresh.map(q=>q.id),["e05","v09","v44","v37","e04"]);
  assert.deepEqual(fresh.map(q=>stepReviewLevel("inequality",q.id)),[1,1,2,2,3]);
  let state=recordAnswer(emptyState(),"v44",false,now-100);
  state=recordAnswer(state,"e04",true,now-2*DAY_MS);
  state=recordAnswer(state,"e04",true,now-DAY_MS);
  assert.deepEqual(selectStepReviewQuestions("inequality",bank,state,{mode:"wrong",now}).map(q=>q.id),["v44"]);
  assert.deepEqual(selectStepReviewQuestions("inequality",bank,state,{mode:"due",now}).map(q=>q.id),["v44"]);
  const chosen=selectStepReviewQuestions("inequality",bank,state,{now,limit:2});
  assert.ok(chosen.some(q=>q.id==="v44"));
  assert.ok(!chosen.some(q=>q.id==="e04"));
  assert.deepEqual(selectStepReviewQuestions("unknown",bank,state),[]);
  assert.deepEqual(selectStepReviewQuestions("inequality",bank,state,{mode:"invalid"}),[]);
});
