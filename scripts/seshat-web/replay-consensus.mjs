/**
 * Recalcule la politique de consensus depuis une sortie JSONL de compare.mjs,
 * sans moteur WASM ni corpus CROHME. Ne recalcule pas les lectures : elles
 * restent celles du moteur et de la version locale qui ont produit le JSONL.
 *
 * node scripts/seshat-web/replay-consensus.mjs comparison.jsonl [...]
 */
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {decideFractionFallback} from "./fraction-consensus.mjs";
import {inkOutcome} from "../benchmark-policy.mjs";
import {parseBenchmark,summarizeBenchmark} from "./report.mjs";

export function replayConsensus(rows){
  if(!Array.isArray(rows)||!rows.length)throw Error("Aucune lecture à rejouer");
  const replayed=rows.map((row,index)=>{
    if(!row||typeof row!=="object"||typeof row.file!=="string"||
      typeof row.id!=="string"||typeof row.expected!=="string"||
      !Object.hasOwn(row,"local")||
      (!Object.hasOwn(row,"latex")&&row.local==null)||
      !Object.hasOwn(row,"rows")||!Object.hasOwn(row,"policyOutcomes")||
      !Object.hasOwn(row,"localOutcome")){
      throw Error("Lecture incomplète à l'index "+index+" : impossible de rejouer le consensus");
    }
    const {local,latex,rows:lineReadings,expected}=row;
    const parts=Array.isArray(lineReadings)&&lineReadings.length===2
      ?[[],[]]:null;
    const consensus=decideFractionFallback({local,whole:latex,parts,rows:lineReadings});
    const strictOutcome=inkOutcome(consensus.candidate,expected);
    return {...row,consensus,
      policyOutcomes:{...row.policyOutcomes,strictConsensus:strictOutcome}};
  });
  return {replayed,report:summarizeBenchmark(replayed)};
}

async function main(args){
  if(!args.length)throw Error("Usage : node scripts/seshat-web/replay-consensus.mjs comparison.jsonl [...]");
  const rows=(await Promise.all(args.map(file=>readFile(file,"utf8")))).flatMap(parseBenchmark);
  const {report}=replayConsensus(rows);
  console.log(JSON.stringify({...report,
    replayOnly:true,
    limitation:"Lectures historiques réutilisées : aucun moteur ni lecteur local actuel exécuté."},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
