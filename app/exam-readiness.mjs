/**
 * État de préparation d'une copie d'examen blanc.
 * Ce module inspecte les saisies (présence et non pas exactitude), sans corriger
 * les démonstrations ni révéler les solutions pendant l'épreuve.
 */
const nonEmpty=value=>typeof value==="string"&&value.trim().length>0;
export function inspectExamDraft(exam,session){
  if(!exam||!Array.isArray(exam.sections)||exam.sections.length!==4||!session||typeof session!=="object")throw Error("Copie ou sujet invalide");
  if(session.examId!==exam.id||(exam.seed!==undefined&&session.seed!==exam.seed))throw Error("Sujet de la copie incompatible");
  const sections=exam.sections.map((section,index)=>{
    if(!Array.isArray(section.questions)||!section.questions.length)throw Error("Section d'examen vide");
    const incomplete=section.questions.filter(q=>!nonEmpty(session.answers?.[q.id]));
    const answered=section.questions.length-incomplete.length;
    const notePresent=nonEmpty(session.notes?.[section.id]);
    return {
      id:section.id,index,title:section.title,
      total:section.questions.length,
      answered,
      remaining:incomplete.length,
      pointsUnanswered:incomplete.reduce((n,q)=>n+q.points,0),
      notePresent,
      missingIds:incomplete.map(q=>q.id)
    };
  });
  const totalQuestions=sections.reduce((n,s)=>n+s.total,0);
  const answeredQuestions=sections.reduce((n,s)=>n+s.answered,0);
  return {
    sections,totalQuestions,answeredQuestions,remainingQuestions:totalQuestions-answeredQuestions,
    pointsUnanswered:sections.reduce((n,s)=>n+s.pointsUnanswered,0),
    sectionsWithNotes:sections.filter(s=>s.notePresent).length,
    sectionsWithoutNotes:sections.filter(s=>!s.notePresent).map(s=>s.id),
    allFieldsFilled:sections.every(s=>s.remaining===0&&s.notePresent),
    firstIncompleteSection:sections.find(s=>s.remaining>0||!s.notePresent)?.index??null
  };
}
