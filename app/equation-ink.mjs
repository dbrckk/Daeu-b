/**
 * Reconnaissance prudente de chaînes d'équations affines manuscrites sur une page.
 * Moteur local, sans modèle téléchargé ni appel réseau. La transcription DOIT
 * être confirmée visuellement avant la vérification mathématique.
 *
 * Symboles supportés : chiffres, x, +, -, =, /, parenthèses et exposant 2
 * surélevé ; fraction simple avec un chiffre au-dessus/dessous d’une barre.
 * Aucune reconnaissance générale des formules ni des démonstrations.
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
function sortedLines(items){
  items=items.map(item=>({...item,box:rect(item.paths)}));
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
  return lines.sort((a,b)=>a.center-b.center).map(line=>line.items);
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
function glyphs(items){
  const ordered=items.map(item=>({...item,box:rect(item.paths)}))
    .sort((a,b)=>cx(a.box)-cx(b.box));
  const out=[];
  for(const entry of ordered){
    if(entry.preRead){out.push(entry);continue;}
    let target=out.find(group=>!group.preRead&&sameGlyph(group.box,entry.box));
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
function parenthesis(path){
  if(path.length<5)return null;
  const b=rect([path]),w=width(b),h=height(b);
  if(h<35||w<10||w>h*.62)return null;
  // Un même arc peut être dessiné du haut vers le bas OU à l'envers.
  const forward=path[0][1]<=path.at(-1)[1];
  const ordered=forward?path:[...path].reverse();
  const first=ordered[0],last=ordered.at(-1);
  if(first[1]>b.top+h*.22||last[1]<b.bottom-h*.22)return null;
  let backwards=0;
  for(let i=1;i<ordered.length;i++)if(ordered[i][1]<ordered[i-1][1]-h*.06)backwards++;
  if(backwards>1)return null;
  const middle=ordered.filter(p=>p[1]>=b.top+h*.33&&p[1]<=b.bottom-h*.33);
  if(!middle.length)return null;
  const mx=middle.reduce((n,p)=>n+p[0],0)/middle.length;
  const endpoints=(first[0]+last[0])/2;
  if(endpoints-mx>w*.45)return "(";
  if(mx-endpoints>w*.45)return ")";
  return null;
}
function special(paths){
  if(paths.length===1){
    if(horizontal(paths[0]))return "-";
    const p=parenthesis(paths[0]);if(p)return p;
  }
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
  if(group.preRead)return group.preRead;
  const op=special(group.paths);
  if(op)return op;
  const result=recognizeNumericInk(group.paths.map(encodeStroke));
  return result.status==="recognized"&&result.text.length===1?result.text:null;
}

/** Une fraction empilée n'est acceptée que si chaque terme est un seul chiffre. */
function foldFractions(paths){
  const entries=paths.map((path,id)=>({id,paths:[path],box:rect([path])}));
  const used=new Set(),found=[];
  for(const bar of entries){
    if(used.has(bar.id)||!horizontal(bar.paths[0])||width(bar.box)<29)continue;
    const y=cy(bar.box),w=width(bar.box);
    const near=entries.filter(e=>e.id!==bar.id&&!used.has(e.id)
      &&cx(e.box)>=bar.box.left-6&&cx(e.box)<=bar.box.right+6
      &&width(e.box)<w*1.35&&height(e.box)>=20);
    const upper=near.filter(e=>e.box.bottom<y-9&&y-e.box.bottom<=38);
    const lower=near.filter(e=>e.box.top>y+9&&e.box.top-y<=38);
    if(upper.length!==1||lower.length!==1)continue;
    const a=recognizeNumericInk([encodeStroke(upper[0].paths[0])]);
    const b=recognizeNumericInk([encodeStroke(lower[0].paths[0])]);
    if(a.status!=="recognized"||b.status!=="recognized"
      ||!/^\d$/.test(a.text)||!/^\d$/.test(b.text)||b.text==="0")continue;
    used.add(bar.id);used.add(upper[0].id);used.add(lower[0].id);
    found.push({paths:[...upper[0].paths,...bar.paths,...lower[0].paths],
      preRead:a.text+"/"+b.text});
  }
  return [...entries.filter(e=>!used.has(e.id)),...found];
}
function transcription(parts,{draft=false}={}){
  let text="",previous=null,unreadable=0;
  for(const group of parts){
    let value=readGlyph(group);
    if(!value){
      if(!draft)return null;
      value="□";unreadable++;
    }
    const b=group.box;
    const upper=previous&&/^\d$/.test(value)&&/^[0-9x)]$/.test(previous.value)
      &&height(b)>=15&&height(b)<height(previous.box)*.72
      &&b.bottom<previous.box.top+height(previous.box)*.62
      &&b.top<=previous.box.top+height(previous.box)*.24
      &&b.left>=previous.box.right-8;
    text+=(upper?"^":"")+value;
    previous={value,box:b};
  }
  return {text,unreadable};
}
/**
 * En mode draft, une expression partiellement illisible conserve les symboles
 * reconnaissables et marque les autres par □ ; elle n'est jamais notée.
 */
export function recognizeEquationInk(page,{draft=false}={}){
  if(!Array.isArray(page)||!page.length)return {status:"empty",message:"Cette page ne contient aucun tracé."};
  if(page.length>MAX_STROKES)return {status:"unsupported",message:"Trop de tracés pour ce lecteur expérimental : utilise une page avec les seules équations à vérifier."};
  let paths;
  try{paths=page.map(parseStroke);}catch{
    return {status:"unsupported",message:"Tracés illisibles. Le cahier enregistré n'a pas été modifié."};
  }
  const lines=sortedLines(foldFractions(paths));
  if(!lines||!lines.length)return {status:"unsupported",message:"Impossible de séparer les lignes manuscrites."};
  const texts=[];let uncertain=0,unsupported=0;
  for(const line of lines){
    const parts=glyphs(line);
    if(parts.length>MAX_GLYPHS)return {status:"unsupported",message:"Ligne trop longue pour le lecteur actuel (32 caractères maximum)."};
    const current=transcription(parts,{draft});
    if(!current)return {status:"uncertain",message:"Un symbole est ambigu : réécris-le en grand ou utilise la correction tactile. Aucun corrigé n'a été dévoilé."};
    const {text,unreadable}=current;
    uncertain+=unreadable;
    if(draft&&unreadable>0){texts.push(text);continue;}
    if(!/^[0-9x+=./()^-]+$/.test(text)||text.split("=").length!==2||!text.split("=").every(Boolean)){
      if(draft){unsupported++;texts.push(text);continue;}
      return {status:"unsupported",message:"Écris une égalité simple par ligne avec chiffres, x, +, −, =, /, parenthèses et exposant 2."};
    }
    let depth=0;
    for(const ch of text){if(ch==="(")depth++;if(ch===")")depth--;if(depth<0)break;}
    if(depth!==0||(text.match(/\^[0-9]+/g)||[]).some(power=>power!=="^2")){
      if(draft){unsupported++;texts.push(text);continue;}
      return {status:"unsupported",message:"Parenthèses ou exposant ambigus : réécris la ligne."};
    }
    texts.push(text);
  }
  return {status:uncertain||unsupported?"partial":"recognized",
    text:texts.join("\n"),lines:texts.length,uncertain,unsupported,
    message:uncertain||unsupported
      ?"Lecture partielle : les symboles □ et les lignes incomplètes doivent être corrigés au toucher avant toute évaluation."
      :"Transcription proposée : contrôle chaque symbole avant l'analyse des étapes."};
}

/**
 * Utilisable pour les exercices demandant la valeur numérique de x.
 * Seule une dernière ligne explicite « x = nombre » est candidate.
 * Aucune équation intermédiaire, racine carrée ou expression algébrique
 * n'est convertie en résultat autonome. La valeur doit être confirmée
 * visuellement par l'élève avant le correcteur du quiz.
 */
export function extractFinalNumericAnswer(transcript){
  if(typeof transcript!=="string"||transcript.length>1200)return null;
  const lines=transcript.trim().split(/\r?\n/).map(line=>line.replace(/\s/g,""));
  if(!lines.length||lines.length>12)return null;
  const match=lines.at(-1).match(/^x=([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\/[+-]?(?:\d+(?:\.\d+)?|\.\d+))?)$/);
  if(!match)return null;
  const value=match[1].replace(/^\+/,"");
  const fraction=value.split("/");
  if(fraction.length===2 && Number(fraction[1])===0)return null;
  // Garde la notation rationnelle exacte : ne pas arrondir ni inventer de chiffre.
  if(!Number.isFinite(Number(fraction[0]))||fraction.length===2&&!Number.isFinite(Number(fraction[1])))
    return null;
  return value;
}
