/**
 * Reconnaissance prudente de chaînes d'équations affines manuscrites sur une page.
 * Moteur local, sans modèle téléchargé ni appel réseau. La transcription DOIT
 * être confirmée visuellement avant la vérification mathématique.
 *
 * Vocabulaire limité : chiffres, x, +, -, =, décimaux simples et "/".
 * Pas de fractions empilées, exposants, racines, matrices ou preuves.
 */
import {parseStroke,encodeStroke} from "./workbook.mjs";
import {recognizeNumericInk} from "./numeric-ink.mjs";

const MAX_STROKES=90,MAX_LINES=12,MAX_GLYPHS=32;
const rect=paths=>{
  const points=paths.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
};
const width=b=>b.right-b.left,height=b=>b.bottom-b.top;
const cx=b=>(b.left+b.right)/2,cy=b=>(b.top+b.bottom)/2;
function sortedLines(paths){
  const items=paths.map(path=>({path,box:rect([path])}));
  const tall=items.filter(item=>height(item.box)>=18);
  if(!tall.length)return null;
  const heights=tall.map(item=>height(item.box)).sort((a,b)=>a-b);
  const gap=Math.max(35,Math.min(52,heights[Math.floor(heights.length/2)]*.65));
  const lines=[];
  for(const item of tall.sort((a,b)=>cy(a.box)-cy(b.box))){
    const y=cy(item.box),line=lines.at(-1);
    if(!line||Math.abs(y-line.center)>gap){
      if(lines.length>=MAX_LINES)return null;
      lines.push({center:y,anchors:1,items:[item]});
    }else{
      line.center=(line.center*line.anchors+y)/(line.anchors+1);
      line.anchors++;
      line.items.push(item);
    }
  }
  for(const item of items.filter(item=>height(item.box)<18)){
    const line=lines.reduce((best,candidate)=>Math.abs(cy(candidate.items[0].box)-cy(item.box))<
      Math.abs(cy(best.items[0].box)-cy(item.box))?candidate:best,lines[0]);
    if(Math.abs(cy(item.box)-line.center)>Math.max(52,gap*1.4))return null;
    line.items.push(item);
  }
  return lines.sort((a,b)=>a.center-b.center).map(line=>line.items.map(item=>item.path));
}
function overlap(a,b){
  return Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
}
function sameGlyph(a,b){
  const wa=width(a),wb=width(b),shared=overlap(a,b);
  const nearX=wa<7?b.left<=cx(a)&&cx(a)<=b.right:
    wb<7?a.left<=cx(b)&&cx(b)<=a.right:
    shared>=Math.min(wa,wb)*.5;
  const nearY=Math.max(0,Math.max(a.top,b.top)-Math.min(a.bottom,b.bottom))<=28;
  return nearX&&nearY;
}
function glyphs(paths){
  const ordered=paths.map(path=>({paths:[path],box:rect([path])}))
    .sort((a,b)=>cx(a.box)-cx(b.box));
  const out=[];
  for(const entry of ordered){
    let target=out.find(group=>sameGlyph(group.box,entry.box));
    if(!target){target={paths:[],box:entry.box};out.push(target);}
    target.paths.push(...entry.paths);
    target.box=rect(target.paths);
  }
  return out.sort((a,b)=>cx(a.box)-cx(b.box));
}
function directLine(points){
  if(points.length<2)return false;
  const first=points[0],last=points.at(-1);
  let length=0;
  for(let i=1;i<points.length;i++)length+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
  return length>=12&&Math.hypot(last[0]-first[0],last[1]-first[1])/length>=.86;
}
function horizontal(path){
  const b=rect([path]);
  return directLine(path)&&width(b)>=15&&height(b)<=Math.max(5,width(b)*.18);
}
function vertical(path){
  const b=rect([path]);
  return directLine(path)&&height(b)>=19&&width(b)<=Math.max(5,height(b)*.18);
}
function diagonal(path){
  if(!directLine(path))return 0;
  const a=path[0],b=path.at(-1),dx=b[0]-a[0],dy=b[1]-a[1];
  return Math.abs(dx)>=16&&Math.abs(dy)>=18?Math.sign(dx*dy):0;
}
function special(paths){
  if(paths.length===1&&horizontal(paths[0]))return "-";
  if(paths.length!==2)return null;
  const [a,b]=paths,ra=rect([a]),rb=rect([b]);
  if(horizontal(a)&&horizontal(b)&&
    overlap(ra,rb)>=Math.min(width(ra),width(rb))*.65&&
    Math.abs(cy(ra)-cy(rb))>=5&&Math.abs(cy(ra)-cy(rb))<=30)return "=";
  if((horizontal(a)&&vertical(b)||vertical(a)&&horizontal(b))&&sameGlyph(ra,rb))
    return "+";
  const da=diagonal(a),db=diagonal(b);
  if(da&&db&&da!==db&&sameGlyph(ra,rb))return "x";
  return null;
}
function readGlyph(group){
  const op=special(group.paths);
  if(op)return op;
  const result=recognizeNumericInk(group.paths.map(encodeStroke));
  return result.status==="recognized"&&result.text.length===1?result.text:null;
}
/** La valeur renvoyée est une proposition, pas une vérité ou une note. */
export function recognizeEquationInk(page){
  if(!Array.isArray(page)||!page.length)return {status:"empty",message:"Cette page ne contient aucun tracé."};
  if(page.length>MAX_STROKES)return {status:"unsupported",message:"Trop de tracés pour ce lecteur expérimental : utilise une page avec les seules équations à vérifier."};
  let paths;
  try{paths=page.map(parseStroke);}catch{
    return {status:"unsupported",message:"Tracés illisibles. Le cahier enregistré n'a pas été modifié."};
  }
  const lines=sortedLines(paths);
  if(!lines||!lines.length)return {status:"unsupported",message:"Impossible de séparer les lignes manuscrites."};
  const texts=[];
  for(const line of lines){
    const parts=glyphs(line);
    if(parts.length>MAX_GLYPHS)return {status:"unsupported",message:"Ligne trop longue pour le lecteur actuel (32 caractères maximum)."};
    let text="";
    for(const group of parts){
      const value=readGlyph(group);
      if(!value)return {status:"uncertain",message:"Un symbole est ambigu. Écris plus grand, sépare les signes ou utilise la vérification au clavier ; aucun corrigé n'a été dévoilé."};
      text+=value;
    }
    if(!/^[0-9x+\-=./]+$/.test(text)||text.split("=").length!==2||!text.split("=").every(Boolean))
      return {status:"unsupported",message:"Écris une égalité simple par ligne, avec chiffres, x, +, −, = et / (sans parenthèses ni exposants)."};
    texts.push(text);
  }
  return {status:"recognized",text:texts.join("\n"),lines:texts.length,
    message:"Transcription proposée : contrôle chaque symbole avant l'analyse des étapes."};
}
