#!/usr/bin/env node
/** Rapports calculés depuis les cinq banques ; --check refuse les rapports périmés. */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {examOverview,renderExamAudit} from "../app/exam-blueprint.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const audit=examOverview();
if(audit.errors.length)throw Error(audit.errors.join("\n"));
const outputs=[
  ["AUDIT_EXAMENS.md",renderExamAudit(audit)],
  ["audits/exam-blueprints.json",JSON.stringify(audit,null,2)+"\n"]
];
if(process.argv.includes("--write")){
  for(const [path,content] of outputs)writeFileSync(resolve(root,path),content,"utf8");
  console.log("Rapports des cinq examens recalculés.");
}else{
  for(const [path,content] of outputs)
    if(readFileSync(resolve(root,path),"utf8")!==content)
      throw Error("Rapport obsolète : "+path+" ; lancer node scripts/audit-exams.mjs --write");
  console.log("Audit des examens validé : "+audit.profiles.length+" sujets ; "+
    audit.covered+"/"+audit.total+" cours ciblés explicitement.");
}
