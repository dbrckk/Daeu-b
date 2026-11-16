import test from "node:test";
import assert from "node:assert/strict";
import {blankWork,emptyWorkbook,sanitizeWorkbook,readWork,changeWork,encodeStroke,parseStroke} from "./workbook.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY} from "./persistence.mjs";
import {emptyState} from "./engine.mjs";
import {emptyExamStore} from "./exam-engine.mjs";
const known=new Set(["q01","v01"]);
test("Cahier : traits vectoriels et texte multi-lignes reprennent exactement",()=>{
 const stroke=encodeStroke([[0,0],[100,70],[600,800],[900,1200]]);
 assert.deepEqual(parseStroke(stroke),[[0,0],[100,70],[600,800],[900,1200]]);
 const work={text:"2x + 3 = 7\\n2x = 4\\nx = 2",pages:[[stroke],[],[]]};
 const changed=changeWork(emptyWorkbook(),"quiz:q01:0",work);
 assert.deepEqual(readWork(changed,"quiz:q01:0"),work);
 assert.deepEqual(readWork(changed,"cours:01-calcul-numerique"),blankWork());
 assert.deepEqual(sanitizeWorkbook(changed),changed);
});
test("Refuser les cahiers corrompus, chemins arbitraires et dépassements",()=>{
 for(const invalid of ["1,2;901,0","0,1201","-1,2","1,2;Infinity,0","<svg>","1,2;","1e3,2"])
   assert.throws(()=>parseStroke(invalid));
 for(const key of ["","../","quiz:<script>","a".repeat(131)])assert.throws(()=>changeWork(emptyWorkbook(),key,blankWork()));
 assert.throws(()=>changeWork(emptyWorkbook(),"cours:1",{text:"a".repeat(6001),pages:[[]]}));
 assert.throws(()=>changeWork(emptyWorkbook(),"cours:1",{text:"",pages:Array.from({length:9},()=>[])}));
});
test("Stockage unifié : les autres opérations ne suppriment pas les brouillons",()=>{
 const s=createVolatileStorage(),p=createPersistence(s,known);
 const key="quiz:q01:0",work={text:"x²=9\\nx=3 ou -3",pages:[[encodeStroke([[1,2],[4,5]])]]};
 let v=p.updateWorkbook(changeWork(p.snapshot().workbook,key,work));
 assert.deepEqual(readWork(v.workbook,key),work);
 v=p.updateExams(emptyExamStore());
 v=p.updatePractice(emptyState());
 assert.deepEqual(readWork(v.workbook,key),work);
 const raw=JSON.parse(s.getItem(DATA_KEY));
 assert.deepEqual(readWork(createPersistence(s,known).snapshot().workbook,key),work);
 assert.equal(raw.version,1);
});
test("Ancien bundle sans cahier : migration transparente et reset explicite",()=>{
 const s=createVolatileStorage(),p=createPersistence(s,known);
 p.updatePractice(emptyState());
 const data=JSON.parse(s.getItem(DATA_KEY));delete data.workbook;
 s.setItem(DATA_KEY,JSON.stringify(data));
 const restored=createPersistence(s,known);
 assert.deepEqual(restored.snapshot().workbook,emptyWorkbook());
 restored.updateWorkbook(changeWork(emptyWorkbook(),"cours:01-calcul-numerique",{text:"ok",pages:[[]]}));
 assert.equal(Object.keys(restored.replaceAll(emptyState(),emptyExamStore()).workbook.entries).length,0);
});

test("Cahier agrandi : anciens traits et nouvelles coordonnées coexistent sans migration",()=>{
 const legacy="600,800;0,0";
 const expanded=encodeStroke([[0,0],[900,1200]]);
 const value=changeWork(emptyWorkbook(),"quiz:q01",{text:"",pages:[[legacy,expanded]]});
 assert.deepEqual(parseStroke(readWork(value,"quiz:q01").pages[0][0]),[[600,800],[0,0]]);
 assert.deepEqual(parseStroke(readWork(value,"quiz:q01").pages[0][1]),[[0,0],[900,1200]]);
});

test("longues équations : 240 gestes par page et anciens cahiers inchangés",()=>{
 const stroke=encodeStroke([[10,12],[18,27],[24,35]]);
 const book=changeWork(emptyWorkbook(),"quiz:longue-equation",{
   text:"",pages:[Array.from({length:240},()=>stroke),[],[]]
 });
 assert.equal(readWork(book,"quiz:longue-equation").pages[0].length,240);
 assert.throws(()=>changeWork(emptyWorkbook(),"quiz:longue-equation",{
   text:"",pages:[Array.from({length:241},()=>stroke)]
 }),/Trop de traits/);
});

test("Mesurer les quatre sur des symboles CROHME hors dépôt", {timeout:120_000}, async()=>{
  const {execFileSync}=await import("node:child_process");
  const {mkdtempSync,readFileSync,rmSync}=await import("node:fs");
  const {tmpdir}=await import("node:os");
  const {join}=await import("node:path");
  const dir=mkdtempSync(join(tmpdir(),"daeu-ink-"));
  try{
    const zip=join(dir,"task.zip");
    execFileSync("curl",["-fsSL","--retry","1","--max-time","65","https://www.cs.rit.edu/~crohme2019/downloads/Task1_and_Task2.zip","-o",zip]);
    execFileSync("python3",["-c",`from pathlib import Path
from zipfile import ZipFile
import sys
folder = Path(sys.argv[1])
with ZipFile(folder / 'task.zip') as archive:
  for name in ('Train', 'valid'):
    path = next(p for p in archive.namelist() if p.endswith('/Task1_onlineRec/MainTask_formula/' + name + '.zip'))
    (folder / (name + '.zip')).write_bytes(archive.read(path))
`,dir]);
    const {PAPER_WIDTH,MAX_PAGE_STROKES,parseStroke}=await import("./workbook.mjs");
    const source=readFileSync(new URL("./numeric-ink.mjs",import.meta.url),"utf8")
      .replace(/^import .*?;\n/m,"").replace(/^export /gm,"");
    const load=code=>new Function("MAX_PAGE_STROKES","parseStroke",code+"\nreturn {recognizeNumericInk,recognizeStackedFractionInk,hasOpenFour};")(MAX_PAGE_STROKES,parseStroke);
    function pageOf(paths,height){
      const points=paths.flat(), xs=points.map(p=>p[0]), ys=points.map(p=>p[1]);
      const left=Math.min(...xs), top=Math.min(...ys);
      const scale=Math.min((PAPER_WIDTH-40)/(Math.max(...xs)-left||1),height/(Math.max(...ys)-top||1));
      return paths.map(path=>{
        const count=Math.min(path.length,180);
        return encodeStroke(Array.from({length:count},(_,i)=>{
          const [x,y]=path[Math.round(i*(path.length-1)/Math.max(1,count-1))];
          return [20+(x-left)*scale,20+(y-top)*scale];
        }));
      });
    }
    const before=load(source.replace("  if(hasOpenFour(paths,b))return {digit:\"4\",score:0,margin:1};\n",""));
    const gates=[
      ["initial",source],
      ...[0.08,0.12,0.16,0.20,0.24].map(gap=>["left "+gap,source.replace("startX>stemX+height*.12","startX>stemX-height*"+gap)]),
      ...[0.08,0.12,0.16,0.20,0.24].map(gap=>["top "+gap,source.replace("rise<height*.23","startY>box.minY+height*"+gap+"||rise<height*.23")]),
      ["left or rise",source.replace("startX>stemX+height*.12","startX>stemX-height*.12&&rise<height*.46")]
    ].map(([name,code])=>[name,load(code)]);
    const splits=[
      ["Train.zip","Train_2014"],["Train.zip","TestINKMLGT_2013"],["valid.zip","TestEM2014GT_INKMLs"]
    ];
    for(const [archive,split] of splits){
      const rows=JSON.parse(execFileSync("python3",["scripts/export-crohme-ink.py",join(dir,archive),"--split",split,"--symbols"],{maxBuffer:80_000_000}));
      const stats=Object.fromEntries(gates.map(([name])=>[name,{}]));
      const nines=[];
      for(const {id,expected,paths} of rows){
        const page=pageOf(paths,70), previous=before.recognizeNumericInk(page).text??"_";
        const points=page.map(parseStroke), all=points.flat();
        const [xs,ys]=[0,1].map(i=>all.map(p=>p[i]));
        const box={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
        for(const [name,model] of gates){
          if(!model.hasOpenFour(points,box)||previous==="4")continue;
          const key=expected+" "+previous;
          stats[name][key]=(stats[name][key]??0)+1;
          if(name==="initial"&&expected==="9"){
            nines.push([id,points.map(p=>p.filter((_,i)=>i===0||i===p.length-1||i%Math.ceil(p.length/12)===0))]);
          }
        }
      }
      console.log("DAEUFOURBENCH",JSON.stringify({split,total:rows.length,stats,nines}));
    }
    console.log("DAEU96BENCH DONE");
  }finally{rmSync(dir,{recursive:true,force:true});}
});
