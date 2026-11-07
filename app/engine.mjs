/** Moteur pédagogique pur : aucun accès réseau, DOM ou stockage. */
export const DAY_MS = 86_400_000;
export const STORAGE_VERSION = 2;
export const INTERVALS = [1, 3, 7, 14, 30];

export function flatten(topics) {
  return topics.flatMap(topic => topic.questions.map(item => ({
    ...item, topic: topic.slug, topicTitle: topic.title, lesson: topic.lesson
  })));
}

export function validateTopics(topics) {
  const problems = [];
  const ids = new Set(), slugs = new Set(), requiredJalons = new Set();
  if (!Array.isArray(topics) || topics.length < 10) problems.push("Nombre de domaines insuffisant");
  for (const topic of topics) {
    if (!topic.slug || slugs.has(topic.slug)) problems.push("Domaine dupliqué: " + topic.slug);
    slugs.add(topic.slug);
    if (!/^\d{2}-[a-z0-9-]+\.md$/.test(topic.lesson || "")) problems.push("Lien de cours invalide: " + topic.slug);
    if (!Array.isArray(topic.jalons) || !topic.jalons.length) problems.push("Jalons absents: " + topic.slug);
    for (const j of topic.jalons || []) if (Number.isInteger(j) && j >= 1 && j <= 20) requiredJalons.add(j);
    if (!Array.isArray(topic.questions) || topic.questions.length < 5) problems.push("Moins de cinq questions: " + topic.slug);
    for (const q of topic.questions || []) {
      if (!q.id || ids.has(q.id)) problems.push("ID dupliqué ou vide: " + q.id);
      ids.add(q.id);
      if (!q.prompt || !q.explanation || q.explanation.length < 15 || !q.hint) problems.push("Explication ou indice insuffisant: " + q.id);
      if (q.type === "number") {
        if (typeof q.answer !== "number" || !Number.isFinite(q.answer)) problems.push("Valeur numérique invalide: " + q.id);
      } else if (q.type === "choice") {
        if (!Array.isArray(q.options) || q.options.length < 2 || new Set(q.options).size !== q.options.length || !q.options.includes(q.answer)) problems.push("Choix invalides: " + q.id);
      } else problems.push("Type inconnu: " + q.id);
    }
  }
  for (let j=1;j<=20;j++) if (!requiredJalons.has(j)) problems.push("Jalon obligatoire non couvert: "+j);
  return problems;
}

export function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s/g,"").replace(/,/g,".").replace(/−/g,"-");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(normalized)) return null;
  const parts = normalized.split("/");
  const n = Number(parts[0]);
  const d = parts.length === 2 ? Number(parts[1]) : 1;
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  const result = n/d;
  return Number.isFinite(result) ? result : null;
}

export function gradeAnswer(question, raw) {
  if (question.type === "number") {
    const x = parseNumber(raw);
    if (x === null) return { valid:false, correct:false, message:"Saisis un nombre, une fraction ou un décimal (ex. 3/4 ou 0,75)." };
    return {valid:true,correct:Math.abs(x-question.answer) <= 1e-6*Math.max(1,Math.abs(question.answer))};
  }
  if (question.type === "choice") {
    if (typeof raw !== "string" || !question.options.includes(raw)) return {valid:false,correct:false,message:"Choisis une réponse."};
    return {valid:true,correct:raw===question.answer};
  }
  return {valid:false,correct:false,message:"Question non prise en charge."};
}

export function emptyState() {return {version:STORAGE_VERSION, items:{}};}
const dayKey = ms => new Date(ms).toISOString().slice(0,10);

/**
 * Maîtrise seulement après deux réussites consécutives, sans indice,
 * sur des jours calendaires distincts. Pour un modèle paramétrique,
 * les deux énoncés doivent en outre être différents.
 */
export function recordAnswer(state, id, correct, now=Date.now(), {signature=null, hinted=false}={}) {
  const prev=state.items?.[id] || {};
  const today=dayKey(now);
  const eligible=Boolean(correct && !hinted);
  const wasIndependent=Boolean(prev.streak>0 && prev.lastCorrectDay && prev.lastCorrectDay!==today);
  const novel=!signature || !prev.lastPrompt || signature!==prev.lastPrompt;
  const streak=eligible ? (prev.lastCorrectDay===today ? Math.max(1,prev.streak||0) : (novel ? (prev.streak||0)+1 : 1)) : 0;
  const confirmed=Boolean(eligible && (prev.confirmed || (wasIndependent && novel && streak>=2)));
  const intervalDays=eligible ? INTERVALS[Math.min(Math.max(0,streak-1),INTERVALS.length-1)] : 0;
  const row={
    attempts:(prev.attempts||0)+1,
    correct:(prev.correct||0)+(correct?1:0),
    wrong:(prev.wrong||0)+(correct?0:1),
    assisted:(prev.assisted||0)+(correct&&hinted?1:0),
    streak, confirmed,
    dueAt:eligible ? now+intervalDays*DAY_MS : now,
    lastAt:now,
    lastCorrectDay:eligible?today:null,
    lastPrompt:signature||null
  };
  return {version:STORAGE_VERSION,items:{...state.items,[id]:row}};
}

export function getMetrics(state, questions, now=Date.now()) {
  let attempted=0,mastered=0,due=0;
  for (const q of questions) {
    const r=state.items?.[q.id];
    if (!r?.attempts) continue;
    attempted++;
    if (r.confirmed) mastered++;
    if (r.dueAt <= now) due++;
  }
  return {total:questions.length,attempted,mastered,due,percent:questions.length?Math.round(100*mastered/questions.length):0};
}

export function selectRound(state,questions,{topic="all",mode="all",limit=10,now=Date.now(),random=Math.random}={}) {
  let pool=questions.filter(q=>topic==="all"||q.topic===topic);
  if(mode==="due") pool=pool.filter(q=>state.items?.[q.id]?.attempts && state.items[q.id].dueAt<=now);
  else if(mode==="wrong") pool=pool.filter(q=>state.items?.[q.id]?.wrong && !state.items[q.id].confirmed);
  else if(mode!=="all") return [];
  // Fisher-Yates, puis faire passer les rappels arrivés à échéance avant les nouveaux.
  const shuffled=[...pool];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  if(mode==="all") shuffled.sort((a,b)=>{
    const priority=q=>state.items?.[q.id]?.attempts && state.items[q.id].dueAt<=now ? 0 : !state.items?.[q.id]?.attempts ? 1 : 2;
    return priority(a)-priority(b);
  });
  return shuffled.slice(0,limit);
}

/** Importe uniquement les statistiques de questions connues, sans code ni contenu libre. */
export function sanitizeState(raw,knownIds) {
  if (!raw || raw.version!==STORAGE_VERSION || !raw.items || typeof raw.items!=="object" || Array.isArray(raw.items))
    throw new Error("Format de sauvegarde incompatible.");
  const items={};
  for(const [id,v] of Object.entries(raw.items)) {
    if(!knownIds.has(id) || !v || typeof v!=="object") continue;
    const fields=["attempts","correct","wrong","streak","dueAt","lastAt"];
    if(fields.some(k=>!Number.isSafeInteger(v[k]) || v[k]<0 || v[k]>1e15)) continue;
    if(v.correct+v.wrong!==v.attempts || v.streak>v.correct || typeof v.confirmed!=="boolean") continue;
    if(v.lastCorrectDay!=null && (typeof v.lastCorrectDay!=="string"|| !/^\d{4}-\d{2}-\d{2}$/.test(v.lastCorrectDay))) continue;
    if(v.lastPrompt!=null && (typeof v.lastPrompt!=="string" || v.lastPrompt.length>500)) continue;
    if(v.assisted!=null && (!Number.isSafeInteger(v.assisted)||v.assisted<0||v.assisted>v.correct)) continue;
    items[id]={attempts:v.attempts,correct:v.correct,wrong:v.wrong,assisted:v.assisted||0,streak:v.streak,confirmed:v.confirmed,dueAt:v.dueAt,lastAt:v.lastAt,lastCorrectDay:v.lastCorrectDay||null,lastPrompt:v.lastPrompt||null};
  }
  return {version:STORAGE_VERSION,items};
}