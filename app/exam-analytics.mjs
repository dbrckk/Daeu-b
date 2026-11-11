/**
 * Synthèse des épreuves : erreurs objectives observées, sans en déduire
 * que le niveau officiel est acquis. Pas de réseau ni de données externes.
 */
export const SKILL_LESSONS={
 "dérivation":"06-derivation.md","variations":"06-derivation.md","optimisation":"06-derivation.md",
 "second degré":"04-second-degre.md","suites":"10-suites.md","logarithmes":"09-exponentielle-logarithme.md",
 "somme de suites":"10-suites.md","probabilités":"12-probabilites.md","loi binomiale":"12-probabilites.md",
 "complémentaire":"12-probabilites.md","espérance":"12-probabilites.md","primitives":"15-primitives-integrales.md",
 "intégrales":"15-primitives-integrales.md","domaines":"05-fonctions.md","calcul de fonction":"05-fonctions.md",
 "asymptotes":"07-limites-asymptotes.md","limites":"07-limites-asymptotes.md","systèmes":"03-equations-inequations-systemes.md",
 "modélisation":"17-raisonnement-modelisation.md","moyenne":"11-statistiques.md",
 "médiane":"11-statistiques.md","variance":"11-statistiques.md","dispersion":"11-statistiques.md",
 "exponentielle":"09-exponentielle-logarithme.md","TVI":"08-continuite-tvi.md",
 "probabilités totales":"12-probabilites.md","Bayes":"12-probabilites.md",
 "budget":"17-raisonnement-modelisation.md","géométrie":"13-trigonometrie.md",
 "aires":"13-trigonometrie.md","trigonométrie":"13-trigonometrie.md",
 "tirages sans remise":"12-probabilites.md","équations":"03-equations-inequations-systemes.md"
};
export function analyzeExamHistory(history,limit=12){
  const reports=(Array.isArray(history)?history:[]).filter(r=>r?.examId&&Array.isArray(r.sections)&&Number.isFinite(r.score)).slice(-limit);
  const keys=new Map();
  let totalPoints=0,earnedPoints=0;
  for(const result of reports){
    totalPoints+=20;earnedPoints+=result.score;
    for(const section of result.sections){
      for(const q of section.questions||[]){
        if(!q.skill||!Number.isFinite(q.points)||!Number.isFinite(q.earned))continue;
        const item=keys.get(q.skill)||{skill:q.skill,attempts:0,points:0,earned:0,lost:0,errors:0,lesson:SKILL_LESSONS[q.skill]||null};
        item.attempts++;
        item.points+=q.points;item.earned+=q.earned;item.lost+=Math.max(0,q.points-q.earned);
        if(q.earned<q.points)item.errors++;
        keys.set(q.skill,item);
      }
    }
  }
  const weaknesses=[...keys.values()].filter(k=>k.lost>0).sort((a,b)=>b.lost-a.lost || b.errors-a.errors || a.skill.localeCompare(b.skill,"fr"));
  const last=reports.at(-1);
  const previous=reports.length>1?reports.at(-2):null;
  const distinct=new Set(reports.map(r=>r.examId+(["blanc-c","blanc-d","blanc-e"].includes(r.examId)?"#"+r.seed:""))).size;
  return {
    attempts:reports.length,distinctSubjects:distinct,
    average:reports.length?Number((earnedPoints/reports.length).toFixed(1)):null,
    latestScore:last?.score??null,
    change:previous?last.score-previous.score:null,
    weaknesses,seenSkills:keys.size,possiblePoints:totalPoints,earnedPoints,
    repeatedSubjects:reports.length>distinct
  };
}
