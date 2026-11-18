import {readFile} from "node:fs/promises";
import {createServer} from "node:http";
import {join} from "node:path";
import {chromium} from "playwright";
import {parseStroke} from "../../app/workbook.mjs";
import {recognizeNumericInk,recognizeStackedFractionInk} from "../../app/numeric-ink.mjs";
import {eligibleInkFallback,inkOutcome,normalizeInk} from "../benchmark-policy.mjs";
import {normalizePaths,splitIsolatedFraction} from "./fraction-rows.mjs";
import {decideFractionFallback} from "./fraction-consensus.mjs";

const [, , build, ...files]=process.argv;
if(!build||!files.length){
  console.error("Usage: node scripts/seshat-web/compare.mjs <output directory> <samples.json> [...]");
  process.exit(2);
}
const samples=[];
const controls=[];
for(const file of files){
  const rows=JSON.parse(await readFile(file,"utf8"));
  samples.push(...rows.filter(row=>row.group==="crohme-isolated-fraction").map(row=>({...row,file})));
  controls.push(...rows.filter(row=>row.group==="crohme-equation"||row.group==="crohme-fraction-equation"));
}
if(!samples.length)throw Error("Aucune fraction isolée dans les données.");
if(controls.length){
  const matches=controls.filter(({paths})=>splitIsolatedFraction(normalizePaths(paths))).length;
  console.error(`Égalités classées comme fractions isolées : ${matches}/${controls.length}`);
}

const assets=new Map([
  ["/",["text/html",`<!doctype html><meta charset="utf-8"><title>Comparaison Seshat</title>`]],
  ["/sw.js",["text/javascript",`
    const cacheName="seshat-benchmark";
    self.addEventListener("install",event=>event.waitUntil((async ()=>{
      const cache=await caches.open(cacheName);
      await cache.addAll(["/","/worker.mjs","/seshat.mjs","/seshat.wasm"]);
      await self.skipWaiting();
    })()));
    self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
    self.addEventListener("fetch",event=>{
      event.respondWith(caches.match(event.request).then(result=>result||Response.error()));
    });
  `]],
  ["/worker.mjs",["text/javascript",await readFile(new URL("worker.mjs",import.meta.url))]],
  ["/seshat.mjs",["text/javascript",await readFile(join(build,"seshat.mjs"))]],
  ["/seshat.wasm",["application/wasm",await readFile(join(build,"seshat.wasm"))]]
]);
const server=createServer(({url},response)=>{
  const asset=assets.get(url);
  if(!asset){response.writeHead(404).end();return;}
  const [type,body]=asset;
  response.writeHead(200,{"Content-Type":type,"Cache-Control":"no-store"}).end(body);
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
async function readSeshat(page,ink){
  const result=await page.evaluate(strokes=>new Promise(resolve=>{
    const worker=window.seshatWorker??=new Worker("/worker.mjs",{type:"module"});
    const close=value=>{
      clearTimeout(timeout);
      if(value.error){
        worker.terminate();
        window.seshatWorker=null;
      }
      resolve(value);
    };
    const timeout=setTimeout(()=>close({error:"Délai de 60 s dépassé"}),60000);
    worker.onmessage=({data})=>close(data);
    worker.onerror=event=>close({error:event.message||"Échec du chargement du worker"});
    worker.postMessage(strokes);
  }),ink.map(parseStroke));
  if(result.error)process.exitCode=1;
  return result;
}

let browser;
try{
  browser=await chromium.launch({executablePath:process.env.SESHAT_CHROMIUM_PATH});
  const context=await browser.newContext({
    isMobile:true,hasTouch:true,viewport:{width:390,height:844},deviceScaleFactor:2
  });
  const url=`http://127.0.0.1:${server.address().port}/`;
  const initialPage=await context.newPage();
  await initialPage.goto(url);
  await initialPage.evaluate(async ()=>{
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller){
      await new Promise(resolve=>navigator.serviceWorker.addEventListener("controllerchange",resolve,{once:true}));
    }
  });
  await context.setOffline(true);
  await initialPage.close();
  const offlinePage=await context.newPage();
  await offlinePage.goto(url);
  for(const {id,group,expected,paths,file} of samples){
    const ink=normalizePaths(paths);
    const current=recognizeStackedFractionInk(ink);
    const local=current?.status==="recognized"?current.text:null;
    const result=local?{}:await readSeshat(offlinePage,ink);
    const candidate=eligibleInkFallback(result.latex,group)?normalizeInk(result.latex):null;
    const fallback=local??candidate;
    const parts=candidate?splitIsolatedFraction(ink):null;
    let rows=null, localAgreementCount=0, localRowConflict=false, seshatRowAgreement=false;
    if(parts){
      const candidateParts=candidate.split("/");
      rows=[];
      for(const [index,part] of parts.entries()){
        const reading=recognizeNumericInk(part);
        const localPart=reading.status==="recognized"?reading.text:null;
        const seshatPart=await readSeshat(offlinePage,part);
        rows.push({local:localPart,seshat:normalizeInk(seshatPart.latex),totalMs:seshatPart.totalMs,error:seshatPart.error});
      }
      localAgreementCount=rows.filter((row,index)=>row.local===candidateParts[index]).length;
      localRowConflict=rows.some((row,index)=>row.local!==null&&row.local!==candidateParts[index]);
      seshatRowAgreement=rows.every((row,index)=>row.seshat===candidateParts[index]);
    }
    const consensus=decideFractionFallback({local,whole:result.latex,parts,rows});
    const policyOutcomes={
      strictConsensus:inkOutcome(consensus.candidate,expected),
      geometry:inkOutcome(local??(parts?candidate:null),expected),
      localVeto:inkOutcome(local??(parts&&!localRowConflict?candidate:null),expected),
      localAgreement:inkOutcome(local??(localAgreementCount>0&&!localRowConflict?candidate:null),expected),
      localFullAgreement:inkOutcome(local??(localAgreementCount===2?candidate:null),expected),
      seshatAgreement:inkOutcome(local??(seshatRowAgreement?candidate:null),expected),
      seshatAgreementWithLocalVeto:inkOutcome(local??(seshatRowAgreement&&!localRowConflict?candidate:null),expected)
    };
    console.log(JSON.stringify({file,id,expected,local,localOutcome:inkOutcome(local,expected),
      fallback,fallbackOutcome:inkOutcome(fallback,expected),rows,consensus,policyOutcomes,...result}));
  }
}finally{
  await browser?.close();
  server.close();
}
