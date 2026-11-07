import {gradeAnswer} from "./engine.mjs";
import {EXAMS} from "./exams.mjs";

export const EXAM_DURATION_MS=3*60*60*1000;
export const EXAM_STORE_VERSION=1;
const validMs=x=>Number.isSafeInteger(x)&&x>=0&&x<=9e15;
const validText=(x,max)=>typeof x==="string"&&x.length<=max;
const allQuestions=exam=>exam.sections.flatMap(s=>s.questions);
export const findExam=id=>EXAMS.find(e=>e.id===id);

export function validateExamBank(bank=EXAMS){
  const errors=[],seen=new Set();
  if(bank.length<2) errors.push("Deux examens requis");
  for(const exam of bank){
    if(!exam.id||seen.has(exam.id))errors.push("Examen en doublon");
    seen.add(exam.id);
    if(exam.sections?.length!==4)errors.push("Quatre exercices requis pour "+exam.id);
    let score=0;
    for(const section of exam.sections||[]){
      if(!section.id||seen.has(section.id))errors.push("Section en doublon");
      seen.add(section.id);
      const sum=section.questions?.reduce((s,q)=>s+q.points,0);
      if(sum!==5)errors.push(section.id+" : barème différent de 5");
      if(!section.context||!section.method||!section.questions?.length)errors.push("Énoncé ou méthode incomplets : "+section.id);
      score+=sum||0;
      for(const q of section.questions||[]){
        if(seen.has(q.id)||!q.id)errors.push("Question en doublon "+q.id);
        seen.add(q.id);
        if(!q.prompt||!q.solution||!q.skill||!Number.isInteger(q.points)||q.points<1||q.points>5)errors.push("Question incomplète "+q.id);
        if(q.type==="number"&&!Number.isFinite(q.answer))errors.push("Nombre invalide "+q.id);
        else if(q.type==="choice"&&(!q.options?.includes(q.answer)||new Set(q.options).size!==q.options.length))errors.push("Choix invalides "+q.id);
        else if(!["number","choice"].includes(q.type))errors.push("Type inconnu "+q.id);
      }
    }
    if(score!==20)errors.push("Total différent de 20 "+exam.id);
  }
  return errors;
}

export function startExam(examId,now=Date.now()){
  if(!findExam(examId)||!validMs(now)) throw new Error("Examen ou date invalide");
  return {examId,startedAt:now,deadlineAt:now+EXAM_DURATION_MS,sectionIndex:0,answers:{},notes:{}};
}
export function hasExpired(session,now=Date.now()){
  return !!session&&now>=session.deadlineAt;
}
export function updateExamAnswer(session,questionId,text){
  const exam=findExam(session.examId);
  if(!exam||!allQuestions(exam).some(q=>q.id===questionId)||!validText(text,200)) throw new Error("Réponse invalide");
  return {...session,answers:{...session.answers,[questionId]:text}};
}
export function updateExamNotes(session,sectionId,text){
  const exam=findExam(session.examId);
  if(!exam||!exam.sections.some(s=>s.id===sectionId)||!validText(text,3500)) throw new Error("Note invalide");
  return {...session,notes:{...session.notes,[sectionId]:text}};
}
export function finishExam(session,now=Date.now(),reason="submitted"){
  const exam=findExam(session.examId);
  if(!exam||!validMs(now)||!["submitted","timeout"].includes(reason))throw new Error("Session invalide");
  const sections=exam.sections.map(s=>{
    const questions=s.questions.map(q=>{
      const answer=session.answers[q.id]||"";
      const grade=gradeAnswer(q,answer);
      return {id:q.id,skill:q.skill,points:q.points,earned:grade.valid&&grade.correct?q.points:0,answer,solution:q.solution,expected:q.answer,correct:grade.valid&&grade.correct};
    });
    return {id:s.id,title:s.title,earned:questions.reduce((a,q)=>a+q.earned,0),points:5,questions};
  });
  return {examId:exam.id,title:exam.title,startedAt:session.startedAt,finishedAt:now,reason,answers:{...session.answers},notes:{...session.notes},sections,score:sections.reduce((a,s)=>a+s.earned,0),maxScore:20};
}
export function emptyExamStore(){return {version:EXAM_STORE_VERSION,active:null,history:[]};}
function cleanSession(raw){
  if(!raw||typeof raw!=="object"||!findExam(raw.examId)||!validMs(raw.startedAt)||!validMs(raw.deadlineAt)||raw.deadlineAt!==raw.startedAt+EXAM_DURATION_MS)return null;
  const exam=findExam(raw.examId);
  if(!Number.isSafeInteger(raw.sectionIndex)||raw.sectionIndex<0||raw.sectionIndex>3)return null;
  const answers={},notes={};
  for(const q of allQuestions(exam)){
    const a=raw.answers?.[q.id];if(validText(a,200))answers[q.id]=a;
  }
  for(const s of exam.sections){
    const note=raw.notes?.[s.id];if(validText(note,3500))notes[s.id]=note;
  }
  return {examId:raw.examId,startedAt:raw.startedAt,deadlineAt:raw.deadlineAt,sectionIndex:raw.sectionIndex,answers,notes};
}
export function sanitizeExamStore(raw){
  if(!raw||raw.version!==EXAM_STORE_VERSION||!Array.isArray(raw.history))throw new Error("Sauvegarde d'examen incompatible");
  const active=raw.active===null?null:cleanSession(raw.active);
  if(raw.active!==null&&!active)throw new Error("Session d'examen invalide");
  const history=[];
  for(const h of raw.history.slice(-12)){
    const exam=findExam(h?.examId);
    if(!exam||!validMs(h.startedAt)||!validMs(h.finishedAt)||h.finishedAt<h.startedAt||!["submitted","timeout"].includes(h.reason))continue;
    const session=cleanSession({...h,deadlineAt:h.startedAt+EXAM_DURATION_MS,sectionIndex:0});
    if(!session)continue;
    history.push(finishExam(session,h.finishedAt,h.reason));
  }
  return {version:EXAM_STORE_VERSION,active,history};
}
export function addHistory(store,result){
  return {...store,active:null,history:[...store.history,result].slice(-12)};
}
