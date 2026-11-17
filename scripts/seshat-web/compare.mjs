import {readFile} from "node:fs/promises";
import {createServer} from "node:http";
import {join} from "node:path";
import {chromium} from "playwright";
import {encodeStroke,parseStroke,PAPER_HEIGHT,PAPER_WIDTH} from "../../app/workbook.mjs";
import {recognizeStackedFractionInk} from "../../app/numeric-ink.mjs";
import {eligibleInkFallback,inkOutcome,normalizeInk} from "../benchmark-policy.mjs";

const [, , build, ...files]=process.argv;
if(!build||!files.length){
  console.error("Usage: node scripts/seshat-web/compare.mjs <output directory> <samples.json> [...]");
  process.exit(2);
}
const samples=[];
for(const file of files){
  const rows=JSON.parse(await readFile(file,"utf8"));
  samples.push(...rows.filter(row=>row.group==="crohme-isolated-fraction").map(row=>({...row,file})));
}
if(!samples.length)throw Error("Aucune fraction isolée dans les données.");

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
let browser;
try{
  browser=await chromium.launch();
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
    const points=paths.flat();
    const xs=points.map(([x])=>x),ys=points.map(([,y])=>y);
    const left=Math.min(...xs),top=Math.min(...ys);
    const scale=Math.min((PAPER_WIDTH-40)/(Math.max(...xs)-left||1),
      Math.min(70,PAPER_HEIGHT-40)/(Math.max(...ys)-top||1));
    const ink=paths.map(path=>{
      const count=Math.min(path.length,180);
      return encodeStroke(Array.from({length:count},(_,i)=>{
        const [x,y]=path[Math.round(i*(path.length-1)/Math.max(1,count-1))];
        return [20+(x-left)*scale,20+(y-top)*scale];
      }));
    });
    const current=recognizeStackedFractionInk(ink);
    const local=current?.status==="recognized"?current.text:null;
    const result=local?{}:await offlinePage.evaluate(strokes=>new Promise(resolve=>{
      const worker=new Worker("/worker.mjs",{type:"module"});
      const close=value=>{
        clearTimeout(timeout);
        worker.terminate();
        resolve(value);
      };
      const timeout=setTimeout(()=>close({error:"Délai de 10 s dépassé"}),10000);
      worker.onmessage=({data})=>close(data);
      worker.onerror=event=>close({error:event.message||"Échec du chargement du worker"});
      worker.postMessage(strokes);
    }),ink.map(parseStroke));
    if(result.error)process.exitCode=1;
    const fallback=local??(eligibleInkFallback(result.latex,group)?normalizeInk(result.latex):null);
    console.log(JSON.stringify({file,id,expected,local,localOutcome:inkOutcome(local,expected),
      fallback,fallbackOutcome:inkOutcome(fallback,expected),...result}));
  }
}finally{
  await browser?.close();
  server.close();
}
