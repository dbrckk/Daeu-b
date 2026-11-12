/**
 * Matrice vérifiable des examens blancs : couverture des compétences et
 * complexité STRUCTURELLE (pas difficulté psychométrique, ni note officielle).
 *
 * Les familles A/B sont fixes ; les familles C/D/E conservent le même gabarit
 * de questions pour chaque graine, sans réécrire les anciennes copies.
 */
import {EXAMS} from "./exams.mjs";
import {createGeneratedExam} from "./exam-generator.mjs";
import {createAlternativeExam} from "./exam-alternative.mjs";
import {createAppliedExam} from "./exam-applied.mjs";
import {SKILL_LESSONS} from "./exam-analytics.mjs";
import {COURSES} from "./course-catalog.mjs";

export const EXAM_SEEDS=Object.freeze([0,1,7,29,257,65535,0xffffffff]);
export const EXAM_FAMILIES=Object.freeze([
  {id:"blanc-1",label:"A",generated:false,create:()=>EXAMS[0]},
  {id:"blanc-2",label:"B",generated:false,create:()=>EXAMS[1]},
  {id:"blanc-c",label:"C",generated:true,create:createGeneratedExam},
  {id:"blanc-d",label:"D",generated:true,create:createAlternativeExam},
  {id:"blanc-e",label:"E",generated:true,create:createAppliedExam}
]);
const slug=s=>s.replace(/\.md$/,"");
const courseLabels=new Map(COURSES);
export const EXAM_COURSE_BASE=Object.freeze([
  "01-calcul-numerique","02-calcul-litteral",
  "03-equations-inequations-systemes","04-second-degre",
  "05-fonctions","06-derivation","07-limites-asymptotes",
  "08-continuite-tvi","09-exponentielle-logarithme","10-suites",
  "11-statistiques","12-probabilites","15-primitives-integrales"
]);
export function profileExam(exam){
  if(!exam||!Array.isArray(exam.sections)||exam.sections.length!==4)throw Error("Examen sans quatre exercices");
  const skills=new Map(),courses=new Map(),byType={number:0,choice:0},sections=[];
  let points=0,questions=0,twoPoints=0,guidedSteps=0;
  for(const section of exam.sections){
    let sectionPoints=0,sectionQuestions=0;
    for(const q of section.questions||[]){
      if(!["number","choice"].includes(q.type)||!Number.isInteger(q.points)||q.points<=0)throw Error("Question invalide : "+q.id);
      const lesson=SKILL_LESSONS[q.skill];
      if(!lesson||!courseLabels.has(slug(lesson)))throw Error("Compétence sans cours : "+q.skill);
      questions++;sectionQuestions++;points+=q.points;sectionPoints+=q.points;
      byType[q.type]++;if(q.points===2)twoPoints++;
      skills.set(q.skill,(skills.get(q.skill)||0)+q.points);
      const key=slug(lesson);
      courses.set(key,(courses.get(key)||0)+q.points);
    }
    if(sectionPoints!==5||sectionQuestions<3)throw Error("Exercice mal équilibré : "+section.id);
    const steps=section.rubric?.steps?.length??0;
    guidedSteps+=steps;
    sections.push({id:section.id,title:section.title,questions:sectionQuestions,points:sectionPoints,steps});
  }
  if(points!==20||questions<12||guidedSteps!==16)throw Error("Gabarit incomplet : "+exam.id);
  return {
    id:exam.id,title:exam.title,questions,points,types:byType,twoPointQuestions:twoPoints,guidedSteps,
    sections,skills:[...skills].map(([skill,points])=>({skill,points})).sort((a,b)=>a.skill.localeCompare(b.skill,"fr")),
    courses:[...courses].map(([course,points])=>({course,label:courseLabels.get(course),points})).sort((a,b)=>a.course.localeCompare(b.course))
  };
}
export function examOverview(){
  const errors=[],profiles=[];
  for(const family of EXAM_FAMILIES){
    const base=profileExam(family.create(family.generated?EXAM_SEEDS[0]:undefined));
    if(base.id!==family.id)errors.push("Identifiant incohérent : "+family.id);
    if(base.twoPointQuestions<2)errors.push("Trop peu de questions à deux points : "+family.label);
    if(base.types.number<9)errors.push("Trop peu de réponses ouvertes numériques : "+family.label);
    if(base.skills.length<8)errors.push("Compétences trop homogènes : "+family.label);
    if(family.generated){
      for(const seed of EXAM_SEEDS.slice(1)){
        const p=profileExam(family.create(seed));
        if(p.sections.map(s=>s.id).join()!==base.sections.map(s=>s.id).join()
            ||p.questions!==base.questions
            ||JSON.stringify(p.skills)!==JSON.stringify(base.skills)
            ||JSON.stringify(p.courses)!==JSON.stringify(base.courses)
            ||JSON.stringify(p.types)!==JSON.stringify(base.types))
          errors.push("Gabarit non stable entre graines : "+family.label+"/"+seed);
      }
    }
    profiles.push({...base,label:family.label,generated:family.generated});
  }
  if(profiles.length!==5)errors.push("Cinq examens attendus");
  const covered=new Set(profiles.flatMap(p=>p.courses.map(c=>c.course)));
  const missing=EXAM_COURSE_BASE.filter(x=>!covered.has(x));
  const perCourse=EXAM_COURSE_BASE.map(course=>({
    course,label:courseLabels.get(course),
    examCount:profiles.filter(p=>p.courses.some(c=>c.course===course)).length,
    examLabels:profiles.filter(p=>p.courses.some(c=>c.course===course)).map(p=>p.label)
  }));
  return {profiles,errors,covered:EXAM_COURSE_BASE.length-missing.length,total:EXAM_COURSE_BASE.length,missing,perCourse};
}
