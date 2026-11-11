/**
 * Audit v23 reproductible, sans npm ni service payant.
 * --write régénère les deux rapports ; --check refuse tout rapport obsolète.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {TOPICS} from "../app/questions.mjs";
import {VARIANTS} from "../app/variants.mjs";
import {COURSES} from "../app/course-catalog.mjs";
import {FIXED_IDS_BY_JALON} from "./coverage-map.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
export const buildAudit=function buildAudit(topics,variants,courses,program,fixedByJalon){
  const errors=[];
  const lines=program.split("\n");
  const rows=lines.map(line=>line.match(/^\|\s*(\d{1,2})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|$/)).filter(Boolean)
    .map(m=>({jalon:Number(m[1]),title:m[2].trim(),courseNumbers:[...new Set(m[3].match(/\b\d{2}\b/g)||[])],requirement:m[4].trim()}));
  if(rows.length!==23||rows.some((r,i)=>r.jalon!==i+1))errors.push("PROGRAMME.md doit contenir exactement les jalons 1 à 23 dans l'ordre");
  const courseMap=new Map(courses.map(([slug,title])=>[slug.slice(0,2),slug]));
  const fixed=topics.flatMap(topic=>topic.questions.map(q=>({id:q.id,topic:topic.slug,type:q.type,declared:topic.jalons,lesson:topic.lesson})));
  const fixedIds=new Map();
  for(const q of fixed)if(fixedIds.has(q.id))errors.push("Question fixe dupliquée : "+q.id);else fixedIds.set(q.id,q);
  const variantIds=new Map();
  for(const v of variants){
    if(variantIds.has(v.id)||fixedIds.has(v.id))errors.push("Générateur dupliqué : "+v.id);
    variantIds.set(v.id,v);
    if(!topics.some(t=>t.slug===v.topic))errors.push("Générateur sans domaine : "+v.id);
    if(!Array.isArray(v.jalons)||!v.jalons.length||v.jalons.some(j=>!Number.isInteger(j)||j<1||j>20))errors.push("Jalons invalides pour "+v.id);
  }
  const attributed=new Map(),unexpected=[];
  for(const [rawJalon,ids] of Object.entries(fixedByJalon)){
    const j=Number(rawJalon);
    if(!Number.isInteger(j)||j<1||j>20)errors.push("Attribution hors programme obligatoire : "+rawJalon);
    for(const id of ids.trim().split(/\s+/)){
      if(!fixedIds.has(id))unexpected.push(id);
      if(attributed.has(id))errors.push("Question fixe rattachée plusieurs fois : "+id);
      attributed.set(id,j);
    }
  }
  if(unexpected.length)errors.push("Attributions sans question réelle : "+unexpected.join(", "));
  const unassigned=[...fixedIds.keys()].filter(id=>!attributed.has(id));
  if(unassigned.length)errors.push("Questions fixes non classifiées : "+unassigned.join(", "));
  const topicIds=new Set(topics.map(t=>t.slug));
  if(topicIds.size!==topics.length)errors.push("Domaines interactifs dupliqués");
  for(const t of topics){
    const matching=courses.find(([slug])=>slug+".md"===t.lesson);
    if(!matching)errors.push("Cours associé introuvable pour le domaine "+t.slug);
    if(!Array.isArray(t.jalons)||t.jalons.some(j=>j<1||j>20))errors.push("Jalons du domaine invalides : "+t.slug);
  }
  const jalons=rows.map(row=>{
    const required=row.jalon<=20;
    if(required&&row.requirement!=="Programme")errors.push("Jalon obligatoire mal classé : "+row.jalon);
    if(!required&&!row.requirement.includes("Facultatif"))errors.push("Complément déclaré obligatoire sans contrôle : "+row.jalon);
    const courseSlugs=row.courseNumbers.map(num=>courseMap.get(num)).filter(Boolean);
    if(courseSlugs.length!==row.courseNumbers.length)errors.push("Cours absent du catalogue : jalon "+row.jalon);
    const selectedFixed=fixed.filter(q=>attributed.get(q.id)===row.jalon);
    const selectedVariants=variants.filter(v=>v.jalons.includes(row.jalon));
    const crossTopic=selectedFixed.filter(q=>!q.declared.includes(row.jalon)).map(q=>q.id);
    const typeCounts={number:selectedFixed.filter(q=>q.type==="number").length,choice:selectedFixed.filter(q=>q.type==="choice").length};
    const risk=[];
    if(required){
      if(selectedFixed.length<=2)risk.push("≤2 questions fixes");
      if(selectedVariants.length<=1)risk.push("≤1 modèle variable");
      if(crossTopic.length)risk.push("question hors jalons du domaine : "+crossTopic.join(", "));
      if(!selectedVariants.length)errors.push("Jalon obligatoire sans modèle variable : "+row.jalon);
      if(!selectedFixed.length)errors.push("Jalon obligatoire sans question fixe attribuée : "+row.jalon);
    }
    return {
      jalon:row.jalon,title:row.title,required,
      courseNumbers:row.courseNumbers,courseSlugs,
      topicSlugs:topics.filter(t=>t.jalons.includes(row.jalon)).map(t=>t.slug),
      fixedIds:selectedFixed.map(q=>q.id),fixedFormats:typeCounts,
      variantIds:selectedVariants.map(v=>v.id),
      crossTopicFixedIds:crossTopic,attention:risk,
      priority:required&&risk.length?"P0":"P1",
      levelEvidence:"non étiqueté : diagnostic/application/transfert non mesuré",
      writtenReasoning:"non noté automatiquement"
    };
  });
  if(rows.find(r=>r.jalon===18)?.courseNumbers.join(",")!=="15")errors.push("Jalon 18 : cours 15 requis (intégrales)");
  const totals={
    fixedUnique:fixed.length,variantUnique:variants.length,interactiveUnique:fixed.length+variants.length,
    fixedAttributed:attributed.size,
    variantJalonAssignments:jalons.reduce((n,j)=>n+j.variantIds.length,0),
    requiredJalons:jalons.filter(j=>j.required).length,optionalJalons:jalons.filter(j=>!j.required).length,
    sparseFixed:jalons.filter(j=>j.required&&j.fixedIds.length<=2).map(j=>j.jalon),
    singleVariant:jalons.filter(j=>j.required&&j.variantIds.length<=1).map(j=>j.jalon),
    crossTopic:jalons.flatMap(j=>j.crossTopicFixedIds.map(id=>({id,jalon:j.jalon})))
  };
  return {
    schemaVersion:1,
    scope:"SONATE / Université Côte d'Azur 2026–2027",
    sourceFiles:["PROGRAMME.md","app/questions.mjs","app/variants.mjs","app/course-catalog.mjs","app/jalons.mjs","scripts/coverage-map.mjs"],
    methodology:"Questions fixes classifiées une seule fois manuellement par jalon; les générateurs portent leurs jalons explicitement dans le code et peuvent couvrir plusieurs jalons. Ni difficulté ni maîtrise personnelle déduites des effectifs.",
    totals,jalons,errors
  };
};
export const renderMarkdown=function renderMarkdown(a){
 const lines=[
  "# Audit v23 — couverture réelle des jalons DAEU B",
  "",
  "**Référence :** SONATE / Université Côte d'Azur 2026–2027. **Reproduction :** `node scripts/audit-coverage.mjs --write`; contrôle : `node scripts/audit-coverage.mjs --check`.",
  "",
  "Les affectations des **questions fixes** sont une classification éditoriale explicite (`scripts/coverage-map.mjs`), **non encore une preuve de validité pédagogique individuelle**. Les générateurs sont classés par les jalons réellement déclarés dans `app/variants.mjs`. Une variante peut figurer dans deux jalons : **ne jamais additionner les effectifs par ligne pour obtenir des modèles distincts**.",
  "",
  "## Inventaire vérifiable",
  "",
  `- **${a.totals.fixedUnique} questions fixes** attribuées une fois chacune (${a.totals.fixedAttributed} classées) ; **${a.totals.variantUnique} générateurs uniques** ; **${a.totals.interactiveUnique} entrées interactives uniques**.`,
  `- **${a.totals.requiredJalons} jalons obligatoires** dotés d'au moins une question fixe attribuée et d'un générateur ; **${a.totals.optionalJalons} jalons facultatifs** distingués de la banque.`,
  `- **${a.totals.variantJalonAssignments} attributions de générateurs à des jalons**, pour ${a.totals.variantUnique} modèles uniques (modèles couvrant plusieurs jalons).`,
  `- Effectif fixe faible (≤2) : **${a.totals.sparseFixed.join(", ")||"aucun"}**. Un seul modèle variable : **${a.totals.singleVariant.join(", ")||"aucun"}**.`,
  "",
  "## Matrice des 23 jalons (20 obligatoires + 3 facultatifs)",
  "",
  "| Jalon | Notion | Cours | Fixes (N/Choix) | Modèles variables | Vigilance |",
  "|---:|---|---|---:|---:|---|"
 ];
 for(const j of a.jalons){
   const fixedText=`${j.fixedIds.length} (${j.fixedFormats.number}/${j.fixedFormats.choice})`;
   lines.push(`| ${j.jalon}${j.required?"":" *"} | ${j.title.replace(/\|/g,"/")} | ${j.courseNumbers.join(", ")} | ${fixedText} | ${j.variantIds.length} | ${!j.required?"Facultatif ; aucun modèle dédié":(j.attention.join(" ; ")||"Attribution présente ; profondeur non mesurée")} |`);
 }
 lines.push("","*Les jalons 21–23 sont facultatifs à Nice dans le référentiel indiqué ; leur présence dans les cours ne prouve pas une banque interactive dédiée.*",
  "","## Anomalies et risques observés","",
  ...a.totals.crossTopic.map(({id,jalon})=>`- **Attribution inter-domaines :** \`${id}\` porte principalement sur le jalon ${jalon}, mais se trouve dans un domaine dont la liste \`jalons\` ne le mentionne pas. Il faut examiner son classement sans modifier aveuglément les historiques.`),
  "- **Profondeur non certifiée :** les étiquettes *diagnostic / application / transfert*, la qualité de la rédaction, la difficulté et la variété effective des problèmes **ne sont pas présentes de manière vérifiable pour chaque question**. Aucun taux de maîtrise par jalon n'est déduit de cet audit.",
  "- **Couverture facultative :** les jalons 21–23 ont des cours mais pas de questions interactives dédiées ; ne pas les présenter comme évalués dans l'application.",
  "","## Prochaines corrections classées par priorité","",
  "1. **P0 — v24 :** examiner les jalons à faible quantité de questions fixes ou à un seul générateur ; enrichir d'abord des compétences insuffisamment évaluées plutôt que recopier des exercices similaires.",
  "2. **P0 — classification :** relire la question inter-domaines et les exemples particuliers ; confirmer les attributions manuelles des questions fixes avant toute mesure de maîtrise par jalon.",
  "3. **P1 — v25/v26 :** ajouter des niveaux évaluables et des exercices de transfert avec corrections étape par étape, sans faux correcteur automatique du raisonnement libre.",
  "4. **Contrôle continu :** tests du moteur, des imports JSON, des 18 cours hors connexion et des examens A/B/C/D ; ne pas prendre la CI pour une validation académique indépendante.",
  "","## Reproduire l'audit","",
  "```bash",
  "node scripts/audit-coverage.mjs --check",
  "```",
  "",
  "Données détaillées (IDs exacts, formats, jalons, cours et alertes) : [`audits/coverage.json`](audits/coverage.json).",
  ""
 );
 return lines.join("\n");
};
export function currentAudit(){
  return buildAudit(TOPICS,VARIANTS,COURSES,readFileSync(resolve(root,"PROGRAMME.md"),"utf8"),FIXED_IDS_BY_JALON);
}
export function runAudit(mode){
  const audit=currentAudit();
  if(audit.errors.length)throw Error(audit.errors.join("\n"));
  const outputs=[
    [resolve(root,"AUDIT_COUVERTURE.md"),renderMarkdown(audit)],
    [resolve(root,"audits/coverage.json"),JSON.stringify(audit,null,2)+"\n"]
  ];
  for(const [path,content] of outputs){
    if(mode==="--write")writeFileSync(path,content,"utf8");
    else if(readFileSync(path,"utf8")!==content)throw Error("Rapport obsolète : "+path+" ; relancer node scripts/audit-coverage.mjs --write");
  }
  console.log("Audit v23 validé : "+audit.totals.fixedUnique+" fixes, "+audit.totals.variantUnique+" générateurs, "+audit.totals.requiredJalons+" jalons obligatoires, "+audit.totals.crossTopic.length+" attribution inter-domaines.");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  runAudit(process.argv.includes("--write")?"--write":"--check");
}
