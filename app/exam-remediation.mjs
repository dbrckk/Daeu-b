/**
 * Convertit les erreurs OBJECTIVES d'examens en parcours cours -> exercices.
 * L'historique est indépendant de la maîtrise par révision espacée.
 * Aucun lien de quiz n'est proposé pour un chapitre sans banque dédiée.
 */
import {analyzeExamHistory} from "./exam-analytics.mjs";
import {courseInfo,practiceTopicForCourse,courseUrl,practiceUrlForCourse} from "./course-catalog.mjs";
import {TOPICS} from "./questions.mjs";
import {injectVariants} from "./variants.mjs";

const practiceTopics=injectVariants(TOPICS);
const bankBySlug=new Map(practiceTopics.map(topic=>[topic.slug,topic.questions]));
export const hasPracticeQuestions=lesson=>{
  const topic=practiceTopicForCourse(lesson);
  return !!topic&&(bankBySlug.get(topic)?.length??0)>0;
};

/**
 * @returns {Array} Des chapitres en difficulté, ordonnés par points objectifs perdus.
 * confirmed : nombre de questions réellement confirmées dans le module
 * de pratique, distinct du score des examens et des copies rédigées.
 */
export function buildExamRemediation(history,practice={},now=Date.now()){
  const report=analyzeExamHistory(history);
  const groups=new Map();
  for(const item of report.weaknesses){
    if(!item.lesson)continue;
    const slug=item.lesson.replace(/\.md$/,"");
    const label=courseInfo(slug);
    if(!label)continue;
    const row=groups.get(slug)||{slug,lesson:item.lesson,label,skills:[],lost:0,possible:0,errors:0};
    row.skills.push(item.skill);
    row.lost+=item.lost;
    row.possible+=item.points;
    row.errors+=item.errors;
    groups.set(slug,row);
  }
  const records=practice?.items && typeof practice.items==="object"&&!Array.isArray(practice.items)
    ?practice.items:{};
  const dueAt=Number.isFinite(now)?now:Date.now();
  return [...groups.values()].map(row=>{
    const topic=practiceTopicForCourse(row.lesson);
    const bank=topic?bankBySlug.get(topic)||[]:[];
    const confirmed=bank.filter(q=>records[q.id]?.confirmed===true).length;
    const due=bank.filter(q=>records[q.id]?.attempts>0
       &&Number.isFinite(records[q.id].dueAt)&&records[q.id].dueAt<=dueAt).length;
    const wrong=bank.filter(q=>records[q.id]?.wrong>0
       &&records[q.id]?.confirmed!==true).length;
    let practiceUrl=null;
    if(bank.length){
      const base=practiceUrlForCourse(row.lesson);
      practiceUrl=due>0?base.replace("#practice-title","&mode=due#practice-title"):base;
    }
    return {
      ...row,topic,practiceTotal:bank.length,confirmed,due,wrong,
      courseUrl:courseUrl(row.lesson),
      practiceUrl,
      practiceMode:bank.length?(due>0?"due":"all"):null
    };
  }).sort((a,b)=>b.lost-a.lost||b.errors-a.errors||a.slug.localeCompare(b.slug,"fr"));
}
