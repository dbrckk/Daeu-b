/**
 * Résume les sorties JSONL de compare.mjs, sans charger les tracés CROHME.
 * Usage : node scripts/seshat-web/report.mjs benchmark-2019.jsonl [...]
 *
 * Un candidat n'est jamais déclaré prêt pour la production par ce rapport :
 * les erreurs ajoutées et le gain de couverture sont des critères nécessaires,
 * pas des garanties sur les écritures des élèves ni sur un téléphone réel.
 */
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const OUTCOMES=new Set(["exact","error","abstention"]);
const policies=["strictConsensus","geometry","localVeto","localAgreement",
  "localFullAgreement","seshatAgreement","seshatAgreementWithLocalVeto"];

export function summarizeBenchmark(rows){
  if(!Array.isArray(rows)||rows.length===0)throw Error("Au moins une mesure JSONL est requise");
  const seen=new Set();
  const datasets=new Map();
  const totals=new Map();
  const empty=()=>({samples:0,exact:0,error:0,abstention:0,
    addedExact:0,addedErrors:0,lostExact:0,changed:0});
  const accumulate=(stats,baseline,current)=>{
    stats.samples++;
    stats[current]++;
    if(current!==baseline)stats.changed++;
    if(baseline!=="exact"&&current==="exact")stats.addedExact++;
    if(baseline!=="error"&&current==="error")stats.addedErrors++;
    if(baseline==="exact"&&current!=="exact")stats.lostExact++;
  };
  for(const row of rows){
    if(!row||typeof row!=="object"||typeof row.file!=="string"||
      typeof row.id!=="string"||!row.id||!row.file)
      throw Error("Échantillon sans identifiant et provenance");
    const key=JSON.stringify([row.file,row.id]);
    if(seen.has(key))throw Error("Échantillon dupliqué : "+row.file+" / "+row.id);
    seen.add(key);
    if(!OUTCOMES.has(row.localOutcome))throw Error("Résultat local invalide : "+key);
    if(!row.policyOutcomes||typeof row.policyOutcomes!=="object")
      throw Error("Résultats de politiques manquants : "+key);
    const dataset=datasets.get(row.file)??new Map();
    datasets.set(row.file,dataset);
    for(const name of policies){
      const result=row.policyOutcomes[name];
      if(!OUTCOMES.has(result))throw Error("Politique "+name+" absente ou invalide : "+key);
      if(!totals.has(name))totals.set(name,empty());
      if(!dataset.has(name))dataset.set(name,empty());
      accumulate(totals.get(name),row.localOutcome,result);
      accumulate(dataset.get(name),row.localOutcome,result);
    }
  }
  const asObject=map=>Object.fromEntries(map);
  const strict=totals.get("strictConsensus");
  let decision;
  if(strict.addedErrors>0||strict.lostExact>0){
    decision="reject-regression";
  }else if(strict.addedExact===0){
    decision="reject-no-gain";
  }else if(rows.length<95||datasets.size<2){
    decision="insufficient-independent-data";
  }else{
    decision="candidate-for-further-validation";
  }
  return {samples:rows.length,datasetCount:datasets.size,decision,
    decisionIsProductionApproval:false,
    strictAddedExact:strict.addedExact,strictAddedErrors:strict.addedErrors,
    strictLostExact:strict.lostExact,
    policies:asObject(totals),
    datasets:asObject(new Map([...datasets].map(([name,stats])=>[name,asObject(stats)])))};
}

export function parseBenchmark(text){
  const rows=[];
  for(const [index,line] of text.split(/\r?\n/).entries()){
    if(!line.trim())continue;
    let row;
    try{row=JSON.parse(line);}catch{throw Error("JSONL invalide à la ligne "+(index+1));}
    rows.push(row);
  }
  return rows;
}

async function main(args){
  if(!args.length)throw Error("Usage : node scripts/seshat-web/report.mjs benchmark.jsonl [...]");
  const files=await Promise.all(args.map(file=>readFile(file,"utf8")));
  const rows=files.flatMap(parseBenchmark);
  console.log(JSON.stringify(summarizeBenchmark(rows),null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
