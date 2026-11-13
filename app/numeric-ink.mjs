/**
 * Lecture de réponses numériques au doigt/stylet, intégralement locale.
 * Gabarits géométriques simples et vérification de la transcription obligatoire.
 * Aucune validation automatique d'un raisonnement ou d'une équation manuscrite.
 */
import {parseStroke} from "./workbook.mjs";

const SHAPES=[
  ["0", [[[49,8],[24,15],[12,35],[12,67],[26,89],[49,97],[72,88],[87,65],[86,37],[70,15],[49,8]]]],
  ["1", [[[43,21],[57,8],[57,96]]], [[[51,8],[51,96]]]],
  ["2", [[[18,26],[30,11],[55,7],[77,17],[83,37],[72,54],[49,73],[20,94],[86,94]]]],
  ["3", [[[19,14],[47,7],[75,14],[83,31],[68,47],[46,51],[71,53],[85,70],[74,89],[48,97],[17,88]]]],
  ["4", [[[65,9],[17,66],[91,66]],[[66,9],[66,97]]], [[[77,10],[20,66],[88,66],[88,95]]]],
  ["5", [[[79,9],[25,9],[20,46],[48,42],[73,49],[84,70],[73,87],[49,95],[20,86]]]],
  ["6", [[[77,9],[43,27],[22,47],[20,74],[34,93],[62,96],[81,79],[72,59],[50,52],[22,68]]]],
  ["7", [[[15,12],[87,12],[50,96]]]],
  ["8", [[[50,51],[25,35],[26,17],[50,8],[75,19],[76,37],[50,51],[26,65],[25,81],[50,97],[75,84],[76,65],[50,51]]]],
  ["9", [[[75,43],[57,57],[34,52],[20,34],[29,14],[51,7],[74,20],[78,48],[66,73],[41,94],[19,97]]]],
  ["/", [[[83,10],[17,94]]]]
];
const far=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function bounds(paths){
  const pts=paths.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
}
function sample(paths){
  const box=bounds(paths),span=Math.max(box.maxX-box.minX,box.maxY-box.minY,1);
  const samples=[];
  for(const path of paths){
    for(let j=0;j<path.length-1;j++){
      const a=path[j],b=path[j+1],steps=Math.max(1,Math.ceil(far(a,b)/span*32));
      for(let k=0;k<=steps;k++)samples.push([
        ((a[0]+(b[0]-a[0])*k/steps)-(box.minX+box.maxX)/2)/span,
        ((a[1]+(b[1]-a[1])*k/steps)-(box.minY+box.maxY)/2)/span
      ]);
    }
  }
  return samples;
}
function distance(a,b){
  const nearest=(src,dst)=>src.reduce((sum,p)=>{
    let best=Infinity;
    for(const q of dst){
      const d=(p[0]-q[0])**2+(p[1]-q[1])**2;
      if(d<best)best=d;
    }
    return sum+Math.sqrt(best);
  },0)/src.length;
  return (nearest(a,b)+nearest(b,a))/2;
}
const TEMPLATES=SHAPES.map(([digit,...variants])=>[digit,variants.map(sample)]);
function classify(paths){
  if(!paths.length||paths.length>3)return null;
  const b=bounds(paths),w=b.maxX-b.minX,h=b.maxY-b.minY;
  if(Math.max(w,h)<15)return {digit:".",score:0,margin:1};
  if(w>20&&h<Math.max(8,w*.22))return {digit:"-",score:0,margin:1};
  const p=sample(paths);
  if(!p.length)return null;
  const scores=TEMPLATES.map(([digit,variants])=>({
    digit,score:Math.min(...variants.map(t=>distance(p,t)))
  })).sort((a,b)=>a.score-b.score);
  return {...scores[0],margin:scores[1].score-scores[0].score};
}
function splitGlyphs(strokes){
  const sorted=strokes.map(s=>({paths:[s],box:bounds([s])})).sort((a,b)=>a.box.minX-b.box.minX);
  const groups=[];
  for(const item of sorted){
    const last=groups.at(-1);
    if(last&&item.box.minX<=last.box.maxX+Math.min(5,(last.box.maxX-last.box.minX)*.1)
      &&item.box.maxY>=last.box.minY&&item.box.minY<=last.box.maxY){
      last.paths.push(...item.paths);last.box=bounds(last.paths);
    }else groups.push(item);
  }
  return groups;
}
/**
 * Seule la page actuelle est lue ; cette version ne sait pas extraire
 * une valeur cachée dans plusieurs lignes d'algèbre.
 */
export function recognizeNumericInk(page){
  if(!Array.isArray(page)||!page.length)return {status:"empty",message:"Feuille vide."};
  if(page.length>20)return {status:"unsupported",message:"Trop de tracés : écris le résultat numérique seul sur une nouvelle page."};
  let strokes;
  try{strokes=page.map(parseStroke);}
  catch{return {status:"unsupported",message:"Tracés illisibles."};}
  const box=bounds(strokes),h=box.maxY-box.minY;
  if(h<18||h>230)return {status:"unsupported",message:"Écris le résultat isolé sur une seule ligne."};
  const glyphs=splitGlyphs(strokes);
  if(glyphs.length>8)return {status:"unsupported",message:"Écris au maximum huit caractères (chiffres, signe, point ou /)."};
  const digitBoxes=glyphs.map(g=>g.box).filter(b=>b.maxY-b.minY>=18&&b.maxX-b.minX>=9);
  const centerYs=digitBoxes.map(b=>(b.maxY+b.minY)/2);
  const maxHeight=Math.max(0,...digitBoxes.map(b=>b.maxY-b.minY));
  if(centerYs.length>1&&Math.max(...centerYs)-Math.min(...centerYs)>Math.max(32,maxHeight*.5))
    return {status:"unsupported",message:"Plusieurs lignes détectées : écris la valeur finale sur une page séparée."};
  let text="",weakest=Infinity;
  for(const glyph of glyphs){
    const c=classify(glyph.paths);
    if(!c||c.score>.13||c.margin<.015)
      return {status:"uncertain",message:"Lecture incertaine : essaie un résultat isolé ou compare au corrigé."};
    text+=c.digit;weakest=Math.min(weakest,c.margin);
  }
  if(text.length>1&&text.startsWith("0"))
    return {status:"uncertain",message:"Plusieurs chiffres avec zéro initial : lecture ambiguë."};
  if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:\/\d+)?$/.test(text))
    return {status:"unsupported",message:"La transcription n'est pas un nombre ou une fraction simple."};
  return {status:"recognized",text,score:weakest};
}
