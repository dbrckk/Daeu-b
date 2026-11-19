/** Mesure A/B sur les mêmes tracés, sans modifier le lecteur public. */
import {readFile} from "node:fs/promises";
import {evaluateSamples} from "./audit-two-stroke-eight.mjs";
import {recognizeNumericInk} from "../app/numeric-ink.mjs";
import {recognizeNumericInkConservativeNine} from "./conservative-nine-experiment.mjs";

export function compareNinePolicy(samples){
  const report=evaluateSamples(samples,recognizeNumericInkConservativeNine,recognizeNumericInk);
  const changes=report.baseline.changes;
  const lostExact=changes.filter(row=>row.fromVerdict==="exact"&&row.toVerdict!=="exact");
  const fixedErrors=changes.filter(row=>row.fromVerdict==="erreur"&&row.toVerdict!=="erreur");
  const addedErrors=changes.filter(row=>row.fromVerdict!=="erreur"&&row.toVerdict==="erreur");
  // Le corpus doit contenir assez de vrais 9 et de chiffres témoins.
  const trueNines=report.byDigit["9"]?.total??0;
  const otherDigits=report.sampleCount-trueNines;
  const sufficientSample=trueNines>=30&&otherDigits>=30;
  return {sampleCount:report.sampleCount,evidence:{trueNines,otherDigits,minimumPerGroup:30,sufficientSample},baseline:{eights:report.baseline.eights,controls:report.baseline.controls,falseEight:report.baseline.falseEight},
    candidate:{eights:report.eights,controls:report.controls,falseEight:report.falseEight,byDigit:report.byDigit,confusions:report.confusions},
    comparison:{lostExact:lostExact.length,fixedErrors:fixedErrors.length,addedErrors:addedErrors.length,
      approved:sufficientSample&&lostExact.length===0&&addedErrors.length===0&&fixedErrors.length>0,
      decision:"EXPÉRIMENTAL : aucune activation automatique"}};
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  try{
    if(process.argv.length<3)throw Error("Usage: node scripts/compare-conservative-nine.mjs corpus.json [...]");
    const samples=(await Promise.all(process.argv.slice(2).map(async path=>JSON.parse(await readFile(path,"utf8"))))).flat();
    const report=compareNinePolicy(samples);
    if(!report.sampleCount)throw Error("Aucun échantillon CROHME exploitable");
    console.log(JSON.stringify(report,null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
