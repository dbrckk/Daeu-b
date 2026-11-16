import test from "node:test";
import assert from "node:assert/strict";
import {recognizeBottomNumericInk,recognizeNumericInk,recognizeStackedFractionInk} from "./numeric-ink.mjs";
import {encodeStroke} from "./workbook.mjs";
import {gradeAnswer} from "./engine.mjs";

// Dessins vectoriels de test non téléchargés : translation et échelle arbitraires.
const GLYPHS={
  "0":[[[50,10],[25,15],[12,35],[12,65],[26,88],[50,95],[73,86],[88,62],[85,37],[69,15],[50,10]]],
  "1":[[[50,5],[50,97]]],
  "2":[[[18,26],[30,11],[55,7],[77,17],[83,37],[72,54],[49,73],[20,94],[86,94]]],
  "3":[[[19,14],[47,7],[75,14],[83,31],[68,47],[46,51],[71,53],[85,70],[74,89],[48,97],[17,88]]],
  "4":[[[65,9],[17,66],[91,66]],[[66,9],[66,97]]],
  "5":[[[79,9],[25,9],[20,46],[48,42],[73,49],[84,70],[73,87],[49,95],[20,86]]],
  "6":[[[77,9],[43,27],[22,47],[20,74],[34,93],[62,96],[81,79],[72,59],[50,52],[22,68]]],
  "7":[[[15,12],[87,12],[50,96]]],
  "8":[[[50,51],[25,35],[26,17],[50,8],[75,19],[76,37],[50,51],[26,65],[25,81],[50,97],[75,84],[76,65],[50,51]]],
  "9":[[[75,43],[57,57],[34,52],[20,34],[29,14],[51,7],[74,20],[78,48],[66,73],[41,94],[19,97]]],
  "/":[[[83,10],[17,94]]],
  "-":[[[20,50],[80,50]]],
  ".":[[[49,92],[51,94]]]
};
function ink(value,scale=.68){
  return [...value].flatMap((symbol,i)=>
    GLYPHS[symbol].map(stroke=>encodeStroke(stroke.map(([x,y])=>[
      Math.round(40+i*115+x*scale),Math.round(50+y*scale)
    ]))));
}
test("Lecture pure locale : chiffres isolés avec échelle et décalage",()=>{
  for(const digit of "0123456789"){
    const result=recognizeNumericInk(ink(digit));
    assert.equal(result.status,"recognized",digit+" "+JSON.stringify(result));
    assert.equal(result.text,digit);
  }
});
test("Réponse à plusieurs chiffres, nombre signé, fraction et décimal",()=>{
  for(const value of ["12","21","-7","-12","3/4","1.2","0.75","-0.5","0/4","2/3"]){
    const result=recognizeNumericInk(ink(value));
    assert.equal(result.status,"recognized",value+" "+JSON.stringify(result));
    assert.equal(result.text,value);
  }
});
test("Corriger une transcription confirmée avec le même moteur objectif",()=>{
  const recognized=recognizeNumericInk(ink("3/4"));
  assert.equal(recognized.text,"3/4");
  assert.equal(gradeAnswer({type:"number",answer:.75},recognized.text).correct,true);
  assert.equal(gradeAnswer({type:"number",answer:1.5},recognized.text).correct,false);
});
test("Ne pas inventer une lecture des brouillons complexes ou corrompus",()=>{
  assert.equal(recognizeNumericInk([]).status,"empty");
  assert.notEqual(recognizeNumericInk(["<svg>"]).status,"recognized");
  assert.notEqual(recognizeNumericInk(Array(21).fill("1,2;3,4")).status,"recognized");
  assert.notEqual(recognizeNumericInk(["1,1;1,500"]).status,"recognized");
});

test("Le classement de 300 points manuscrits reste borné sur téléphone",()=>{
  const stroke=encodeStroke(Array.from({length:300},(_,i)=>{
    const t=2*Math.PI*i/299;
    return [Math.round(130+62*Math.cos(t)),Math.round(145+82*Math.sin(t))];
  }));
  const start=performance.now();
  const result=recognizeNumericInk([stroke]);
  assert.ok(["recognized","uncertain","unsupported"].includes(result.status));
  assert.ok(performance.now()-start<1500,"Un trait long ne doit pas bloquer le navigateur");
});

test("Lire la dernière ligne isolée sous les calculs, quel que soit l'ordre de dessin",()=>{
  const lower=ink("0.75").map(raw=>encodeStroke(raw.split(";").map(point=>{
    const [x,y]=point.split(",").map(Number);
    return [x,y+240];
  })));
  const upper=[...ink("12"),encodeStroke([[250,60],[275,90],[250,110]])];
  assert.equal(recognizeBottomNumericInk([...lower,...upper])?.text,"0.75");
  assert.equal(recognizeBottomNumericInk(upper),null);
  assert.equal(recognizeBottomNumericInk([...upper,...lower,encodeStroke([[40,210],[650,320]])]),null);
  assert.equal(recognizeBottomNumericInk([...upper,encodeStroke([[30,245],[100,245]]),...lower]),null);
  assert.equal(recognizeBottomNumericInk([...upper,...lower,"invalid"]),null);
  assert.notEqual(recognizeNumericInk([
    encodeStroke([[70,50],[70,115]]),encodeStroke([[180,135],[180,200]])
  ]).status,"recognized");
  assert.notEqual(recognizeNumericInk(ink("3/0")).status,"recognized");
});


test("Lire une fraction posée sous les calculs sans dépendre de l’ordre des traits",()=>{
  const numerator=ink("3");
  const bar=encodeStroke([[40,137],[111,138]]);
  const denominator=ink("4").map(raw=>encodeStroke(raw.split(";").map(point=>{
    const [x,y]=point.split(",").map(Number);
    return [x,y+110];
  })));
  const earlier=encodeStroke([[300,5],[301,10]]);
  assert.equal(recognizeStackedFractionInk([bar,...denominator,earlier,...numerator])?.text,"3/4");
  assert.equal(gradeAnswer({type:"number",answer:.75},
    recognizeStackedFractionInk([...numerator,bar,...denominator]).text).correct,true);
  const zero=ink("0").map(raw=>encodeStroke(raw.split(";").map(point=>{
    const [x,y]=point.split(",").map(Number);
    return [x,y+110];
  })));
  assert.equal(recognizeStackedFractionInk([...numerator,bar,...zero]),null);
  assert.equal(recognizeStackedFractionInk([...numerator,bar,encodeStroke([[45,140],[115,140]]),...denominator]),null);
  assert.equal(recognizeStackedFractionInk([...numerator,bar,encodeStroke([[300,160],[300,230]])]),null);
});
test("Lire les chiffres presque au contact de la barre, en refusant un trait qui la touche",()=>{
  const top=encodeStroke([[75,41],[75,97]]);
  const bottom=encodeStroke([[60,121],[73,113],[88,114],[92,127],[89,136],
    [73,145],[59,156],[65,164],[81,167],[99,162]]);
  assert.equal(recognizeStackedFractionInk([top,encodeStroke([[43,98],[115,98]]),bottom])?.text,"1/2");
  assert.equal(recognizeStackedFractionInk([top,encodeStroke([[43,97],[115,97]]),bottom]),null);
});


test("Lire les 7 barrés même lorsque l’ordre ou le sens des traits change",()=>{
  const examples=[
    ["170,35;220,35;186,108","181,72;210,72"],
    ["169,37;180,34;187,36;218,38;209,54;201,68;194,84;187,102","177,70;193,69;211,66"],
    ["211,72;181,72","186,108;220,35;170,35"]
  ];
  for(const seven of examples){
    assert.equal(recognizeNumericInk(seven).text,"7");
    assert.equal(recognizeNumericInk([...seven,"260,39;260,101"]).text,"71");
  }
  const crossedSlash=["220,35;186,108","181,72;210,72"];
  assert.notEqual(recognizeNumericInk(crossedSlash).text,"7");
  assert.equal(recognizeNumericInk(ink("4")).text,"4");
});

test("Distinguer un 7 à hampe presque verticale des 4, seul et dans une fraction",()=>{
  const head=[[34,29],[41,28],[55,27],[57,29],[55,44],[55,56],[55,62],[55,60]];
  const cross=[[46,47],[56,48],[70,47],[84,47],[79,47]];
  const seven=[head,cross].map(encodeStroke);
  assert.equal(recognizeNumericInk(seven).text,"7");
  assert.equal(recognizeNumericInk([[...cross].reverse(),[...head].reverse()].map(encodeStroke)).text,"7");
  const fractionBar=encodeStroke([[20,80],[100,80]]);
  const five=GLYPHS["5"].map(stroke=>encodeStroke(stroke.map(([x,y])=>[x,90+y])));
  assert.equal(recognizeStackedFractionInk([...seven,fractionBar,...five])?.text,"7/5");
  assert.equal(recognizeNumericInk(ink("4")).text,"4");
  const openFour=[[[31,32],[31,52],[78,52]],[[57,33],[57,69]]].map(encodeStroke);
  assert.equal(recognizeNumericInk(openFour).text,"4");
  const missingHead=[[[56,27],[55,44],[55,62]],cross].map(encodeStroke);
  assert.notEqual(recognizeNumericInk(missingHead).text,"7");
});

test("Lire le 1 avec un pied joint ou détaché sans le transformer en nombre négatif",()=>{
  for(const one of [
    ["195,35;195,106","180,113;216,113"],
    ["216,113;180,113","195,106;195,35"],
    ["182,52;200,36;200,106;176,106"],
    ["182,52;200,36;200,106;223,106"]
  ]){
    assert.equal(recognizeNumericInk(one).text,"1");
    assert.equal(recognizeNumericInk([...one,"260,39;260,101"]).text,"11");
  }
  assert.equal(recognizeNumericInk(ink("-1")).text,"-1");
  assert.notEqual(recognizeNumericInk(["195,35;195,106","145,116;245,116"]).text,"1");
});

test("Lire le 2 bouclé au pied et le distinguer du 7",()=>{
  const loopedTwo=[
    [170,54],[174,36],[194,26],[211,35],[215,56],[203,81],
    [183,103],[169,113],[163,103],[173,95],[193,102],[220,113]
  ];
  for(const path of [loopedTwo,[...loopedTwo].reverse()])
    assert.equal(recognizeNumericInk([encodeStroke(path)]).text,"2");
  assert.equal(recognizeNumericInk(ink("7")).text,"7");
});

test("Lire les fractions dont le 8 manuscrit a des boucles serrées ou commence sur le bord",()=>{
  const eights=[
    [[91,161],[77,166],[78,180],[89,200],[99,220],[87,237],[70,236],[73,219],
      [87,195],[93,176],[90,161]],
    [[110,164],[79,160],[58,168],[64,180],[85,194],[102,208],[109,222],[97,233],
      [78,237],[67,219],[68,200],[78,179],[91,163]]
  ];
  const bar=encodeStroke([[38,137],[123,139]]);
  for(const eight of eights){
    for(const numerator of ["1","3"]){
      const result=recognizeStackedFractionInk([...ink(numerator),bar,encodeStroke(eight)]);
      assert.equal(result?.text,numerator+"/8");
    }
  }
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
    const candidate=load(source);
    const splits=[
      ["Train.zip","Train_2014"],["Train.zip","TestINKMLGT_2013"],["valid.zip","TestEM2014GT_INKMLs"]
    ];
    for(const [archive,split] of splits){
      const rows=JSON.parse(execFileSync("python3",["scripts/export-crohme-ink.py",join(dir,archive),"--split",split,"--symbols"],{maxBuffer:80_000_000}));
      for(const height of split==="Train_2014"?[70]:[25,70]){
        const counts={};
        const examples=[];
        for(const {id,expected,paths} of rows){
          const page=pageOf(paths,height), old=before.recognizeNumericInk(page).text??"_", next=candidate.recognizeNumericInk(page).text??"_";
          if(old!==next||expected==="4"&&old==="9"){
            const key=expected+" "+old+" "+next;
            counts[key]=(counts[key]??0)+1;
            if(expected==="4"&&old==="9"&&next==="9"&&examples.length<12){
              const points=page.map(parseStroke).map(p=>p.filter((_,i)=>i===0||i===p.length-1||i%Math.ceil(p.length/10)===0));
              examples.push([id,points]);
            }
          }
        }
        console.log("DAEU96BENCH",JSON.stringify({split,height,total:rows.length,counts}));
        if(height===70&&split==="Train_2014")console.log("DAEU96SAMPLES",JSON.stringify(examples));
      }
    }
    console.log("DAEU96BENCH DONE");
  }finally{rmSync(dir,{recursive:true,force:true});}
});
