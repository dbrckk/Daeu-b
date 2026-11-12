/**
 * Choix transparent du prochain sujet à travailler.
 * Les points perdus sont uniquement ceux de la notation objective ; la
 * rédaction, la difficulté psychométrique et le niveau officiel ne sont pas inférés.
 */
import {EXAM_FAMILIES,examOverview} from "./exam-blueprint.mjs";
import {analyzeExamHistory} from "./exam-analytics.mjs";

export function recommendNextExam(history,overview=examOverview()){
  const rows=Array.isArray(history)?history.filter(r=>r&&typeof r.examId==="string").slice(-12):[];
  const report=analyzeExamHistory(rows);
  const mostRecent=rows.at(-1)?.examId??null;
  const count=new Map();
  for(const row of rows)count.set(row.examId,(count.get(row.examId)||0)+1);
  const bySkill=new Map(report.weaknesses.map(x=>[x.skill,x.lost]));
  const ranked=overview.profiles.map((profile,index)=>{
    const attempts=count.get(profile.id)||0;
    const overlap=profile.skills.reduce((sum,s)=>sum+Math.min(s.points,bySkill.get(s.skill)||0),0);
    // Favoriser une famille non encore pratiquée, puis les faiblesses observées.
    // L'écart est volontairement exprimé comme priorité heuristique, pas comme note.
    const priority=(attempts===0?100:0)+overlap*4-attempts*3-(profile.id===mostRecent?8:0);
    return {id:profile.id,label:profile.label,attempts,overlap,priority,index};
  }).sort((a,b)=>b.priority-a.priority||a.index-b.index);
  const best=ranked[0];
  return {
    ...best,
    reason:best.attempts===0
      ?"Sujet non encore passé : découvrir une autre famille de problèmes."
      :best.overlap>0
        ?"Ce sujet cible "+best.overlap+" point(s) de compétences associées à des erreurs antérieures (estimation de couverture, pas de difficulté)."
        :"Varier les sujets pour limiter la mémorisation des réponses.",
    candidates:ranked
  };
}
