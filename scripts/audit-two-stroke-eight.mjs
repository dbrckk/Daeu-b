/**
 * Audit reproductible des chiffres CROHME à deux traits, sans télécharger
 * ni redistribuer les copies annotées. Usage :
 * node scripts/audit-two-stroke-eight.mjs [--baseline /tmp/numeric-ink-v106.mjs] corpus.json [...]
 * Le baseline est un fichier local issu de git show v106:app/numeric-ink.mjs ;
 * le placer à côté d'une copie de workbook.mjs si nécessaire.
 */
import {readFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {recognizeNumericInk} from "../app/numeric-ink.mjs";
import {encodeStroke,PAPER_WIDTH,PAPER_HEIGHT} from "../app/workbook.mjs";

const DIGITS=new Set("0123456789");

export function normalizeSample(paths){
  if(!Array.isArray(paths)||paths.length!==2
    ||paths.some(path=>!Array.isArray(path)||path.length<2
      ||path.some(p=>!Array.isArray(p)||p.length<2||p.some(n=>!Number.isFinite(n)))))
    throw Error("Deux traits valides sont requis");
  const points=paths.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const left=Math.min(...xs),right=Math.max(...xs);
  const top=Math.min(...ys),bottom=Math.max(...ys);
  const scale=Math.min((PAPER_WIDTH-40)/(right-left||1),
    (PAPER_HEIGHT-40)/(bottom-top||1),70/(bottom-top||1));
  return paths.map(path=>{
    const count=Math.min(path.length,180);
    return encodeStroke(Array.from({length:count},(_,i)=>{
      const [x,y]=path[Math.round(i*(path.length-1)/Math.max(1,count-1))];
      return [20+(x-left)*scale,20+(y-top)*scale];
    }));
  });
}

export function evaluateSamples(samples,recognizer=recognizeNumericInk,baseline=null){
  if(!Array.isArray(samples))throw Error("Corpus JSON attendu");
  const rows=[];
  for(const sample of samples){
    if(sample?.group!=="crohme-symbol"||!DIGITS.has(sample.expected)
      ||sample.expected.length!==1||sample.paths?.length!==2)continue;
    let page;
    try{page=normalizeSample(sample.paths);}catch{continue;}
    const outcome=reader=>{
      const result=reader(page);
      const proposal=result?.status==="recognized"?result.text:null;
      return {proposal,verdict:proposal===sample.expected?"exact"
        :proposal===null?"abstention":"erreur"};
    };
    const current=outcome(recognizer),previous=baseline?outcome(baseline):null;
    rows.push({id:String(sample.id??""),expected:sample.expected,
      ...current,...(previous?{baseline:previous}:{} )});
  }
  const summarize=records=>{
    const stats={total:records.length,exact:0,erreur:0,abstention:0};
    for(const row of records)stats[row.verdict]++;
    return stats;
  };
  const byDigit={};
  for(const digit of "0123456789"){
    const subset=rows.filter(row=>row.expected===digit);
    if(subset.length)byDigit[digit]=summarize(subset);
  }
  // Matrice agrégée des confusions, sans conserver de trajectoires ni d'IDs.
  // Seules les propositions erronées y figurent : une abstention n'est
  // pas une confusion avec un autre chiffre.
  const confusions={};
  for(const row of rows){
    if(row.verdict!=="erreur")continue;
    const byProposal=confusions[row.expected]??(confusions[row.expected]={});
    byProposal[row.proposal]=(byProposal[row.proposal]??0)+1;
  }
  const eights=rows.filter(row=>row.expected==="8");
  const controls=rows.filter(row=>row.expected!=="8");
  const falseEight=controls.filter(row=>row.proposal==="8");
  const baselineSummary=baseline?{
    eights:summarize(eights.map(row=>row.baseline)),
    controls:summarize(controls.map(row=>row.baseline)),
    falseEight:controls.filter(row=>row.baseline.proposal==="8").length,
    changes:rows.filter(row=>row.proposal!==row.baseline.proposal).map(row=>({
      id:row.id,expected:row.expected,from:row.baseline.proposal,to:row.proposal,
      fromVerdict:row.baseline.verdict,toVerdict:row.verdict
    }))
  }:null;
  return {sampleCount:rows.length,eights:summarize(eights),
    controls:summarize(controls),falseEight:falseEight.length,
    falseEightIds:falseEight.map(row=>row.id),byDigit,confusions,baseline:baselineSummary};
}

async function main(argv){
  const args=[...argv];
  let baseline=null;
  if(args[0]==="--baseline"){
    if(args.length<3)throw Error("Usage : --baseline module.mjs corpus.json [...]");
    const module=await import(pathToFileURL(resolve(args[1])).href);
    if(typeof module.recognizeNumericInk!=="function")throw Error("Module baseline incompatible");
    baseline=module.recognizeNumericInk;
    args.splice(0,2);
  }
  if(!args.length)throw Error("Usage : node scripts/audit-two-stroke-eight.mjs [--baseline module.mjs] corpus.json [...]");
  const samples=(await Promise.all(args.map(async file=>JSON.parse(await readFile(file,"utf8"))))).flat();
  const report=evaluateSamples(samples,recognizeNumericInk,baseline);
  if(!report.sampleCount)throw Error("Aucun chiffre annoté à deux traits : vérifier --split et --symbols");
  console.log(JSON.stringify(report,null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname)
  main(process.argv.slice(2)).catch(err=>{console.error(err.message);process.exitCode=1;});
