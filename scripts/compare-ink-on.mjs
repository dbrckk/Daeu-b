import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {encodeStroke,parseStroke,PAPER_WIDTH,PAPER_HEIGHT} from "../app/workbook.mjs";
import {recognizeStackedFractionInk} from "../app/numeric-ink.mjs";
import {normalizeInk,inkOutcome,eligibleInkFallback} from "./benchmark-policy.mjs";
import {recognizeEquationInk} from "../app/equation-ink.mjs";

const [, , inkOnPath, ...sampleFiles]=process.argv;
if(!inkOnPath||sampleFiles.length===0){
  console.error("Usage: node scripts/compare-ink-on.mjs <ink-on checkout> <samples.json> [...]");
  process.exit(2);
}
const inkOn=pathToFileURL(resolve(inkOnPath)+"/");
const dependencies=createRequire(new URL("package.json",inkOn));
const {createCanvas}=dependencies("@napi-rs/canvas");
const {env}=await import(new URL("node_modules/onnxruntime-web/dist/ort.node.min.mjs",inkOn));
const {InferenceEngine, preprocessStrokes}=await import(new URL("dist-lib/core.js",inkOn));


globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.fetch=async url=>new Response(await readFile(new URL(url)));
env.wasm.numThreads=1;
const model=new URL("public/models/comer/",inkOn);
const engine=new InferenceEngine({
  encoderUrl:new URL("encoder_int8.onnx",model).href,
  decoderUrl:new URL("decoder_int8.onnx",model).href
});
const vocab=JSON.parse(await readFile(new URL("vocab.json",model),"utf8"));
const samples=(await Promise.all(sampleFiles.map(async file=>JSON.parse(await readFile(file,"utf8"))))).flat();
if(!samples.length)throw Error("No samples");
const start=performance.now();
await engine.init();
const initializationMs=performance.now()-start;
const rows=[];
for(const {id,expected,paths,group} of samples){
  const points=paths.flat();
  const xs=points.map(([x])=>x), ys=points.map(([,y])=>y);
  const left=Math.min(...xs),top=Math.min(...ys);
  const scale=Math.min((PAPER_WIDTH-40)/(Math.max(...xs)-left||1),
    Math.min(70,PAPER_HEIGHT-40)/(Math.max(...ys)-top||1));
  const page=paths.map(path=>{
    const count=Math.min(path.length,180);
    return encodeStroke(Array.from({length:count},(_,i)=>{
      const [x,y]=path[Math.round(i*(path.length-1)/Math.max(1,count-1))];
      return [20+(x-left)*scale,20+(y-top)*scale];
    }));
  });
  let t=performance.now();
  const isolatedFraction=group==="crohme-isolated-fraction";
  const current=isolatedFraction?recognizeStackedFractionInk(page):recognizeEquationInk(page);
  const daeuMs=performance.now()-t;
  t=performance.now();
  const input=preprocessStrokes(page.map(raw=>({lineWidth:3,points:parseStroke(raw).map(([x,y])=>({x,y}))})));
  const predicted=(await engine.recognize(input,vocab,"expression")).latex;
  const inkOnMs=performance.now()-t;
  const local=current?.status==="recognized"?current.text:null;
  const outcome=value=>inkOutcome(value,expected);
  const eligible=eligibleInkFallback(predicted,group);
  const fallback=group.startsWith("crohme-")?outcome(local??(eligible?normalizeInk(predicted):null)):undefined;
  rows.push({id,group,expected,local,predicted,daeuMs,inkOnMs,
    daeu:outcome(local),inkOn:outcome(predicted),fallback});
}
console.log(JSON.stringify({initializationMs,rows},null,2));
