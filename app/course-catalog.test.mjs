import test from "node:test";
import assert from "node:assert/strict";
import {TOPICS} from "./questions.mjs";
import {COURSES,courseInfo,courseUrl,practiceTopicForCourse,practiceUrlForCourse} from "./course-catalog.mjs";
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
