/**
 * Reconnaissance prudente de chaînes d'équations affines manuscrites sur une page.
 * Moteur local, sans modèle téléchargé ni appel réseau. La transcription DOIT
 * être confirmée visuellement avant la vérification mathématique.
 *
 * Symboles supportés : chiffres, x, +, -, =, /, point/virgule décimale,
 * signe * à trois branches, parenthèses et exposant 2 surélevé ;
 * jusqu'à 12 lignes ou 48 glyphes sur une même ligne ;
 * fraction de termes courts en x et racine carrée écrite en un
 * seul geste avec une barre au-dessus de 1 à 3 chiffres ou de x.
 * Les expressions non polynomiales ne sont pas corrigées automatiquement.
 */
import {parseStroke,encodeStroke} from "./workbook.mjs";
import {recognizeNumericInk} from "./numeric-ink.mjs";
import {parsePolynomial} from "./quadratic-checker.mjs";

const MAX_STROKES=100,MAX_LINES=12,MAX_GLYPHS=48;
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
  // Astérisque manuscrit conservateur : deux diagonales croisées comme
  // un x, plus une troisième branche verticale passant au même centre.
  // Un x à deux traits reste toujours un x.
  if(paths.length===3){
    const slash=paths.filter(p=>diagonal(p)!==0),stem=paths.find(p=>vertical(p));
    if(slash.length===2&&stem&&diagonal(slash[0])!==diagonal(slash[1])){
      const boxes=paths.map(p=>rect([p])),whole=rect(paths);
      if(boxes.every(b=>sameGlyph(b,whole))
        &&Math.abs(cx(rect([stem]))-cx(whole))<=Math.max(8,width(whole)*.18))
        return "*";
    }
  }
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
  // Un petit point (ou la queue d'une virgule manuscrite) n'est JAMAIS
  // un chiffre : la transcription vérifie ensuite qu'il est placé entre
  // deux chiffres, près de leur ligne de base, avant de le proposer.
  if(group.paths.length===1){
    const b=rect(group.paths);
    if(width(b)<=9&&height(b)<=15&&group.paths[0].length<=12)
      return ".";
  }
  const op=special(group.paths);
  if(op)return op;
  const result=recognizeNumericInk(group.paths.map(encodeStroke));
  return result.status==="recognized"&&result.text.length===1?result.text:null;
}

/**
 * Reconnaissance strictement locale des fractions écrites en colonne.
 * Les deux termes peuvent être des entiers, décimaux courts (point ou
 * virgule manuscrite) ou courtes expressions polynomiales en x.
 * La validation des domaines revient au correcteur algébrique exact.
 *
 * Fractions imbriquées, expressions non reconnues et division par zéro
 * sont refusées au lieu de produire un verdict artificiel.
 */
function foldFractions(paths){
  const entries=paths.map((path,id)=>({id,paths:[path],box:rect([path])}));
  const used=new Set(),found=[];
  const bars=entries.filter(e=>horizontal(e.paths[0])&&width(e.box)>=29)
    .sort((a,b)=>width(b.box)-width(a.box));
  for(const bar of bars){
    if(used.has(bar.id))continue;
    const y=cy(bar.box),w=width(bar.box);
    // Les deux traits du signe "=" ne forment jamais une barre de fraction.
    if(bars.some(other=>other.id!==bar.id
      &&Math.abs(cy(other.box)-y)>=5&&Math.abs(cy(other.box)-y)<=30
      &&overlap(other.box,bar.box)>=Math.min(width(other.box),w)*.65))
      continue;
    const gap=Math.min(60,Math.max(38,w*.55));
    const inside=e=>e.id!==bar.id&&!used.has(e.id)
      &&cx(e.box)>=bar.box.left-4&&cx(e.box)<=bar.box.right+4;
    const upper=entries.filter(e=>inside(e)
      &&e.box.bottom<y-7&&y-e.box.bottom<=gap);
    const lower=entries.filter(e=>inside(e)
      &&e.box.top>y+7&&e.box.top-y<=gap);
    if(!upper.length||!lower.length)continue;
    const topGroups=glyphs(upper),bottomGroups=glyphs(lower);
    if(topGroups.length>9||bottomGroups.length>9)continue;
    // La ponctuation d'un terme doit être géométriquement encadrée
    // par deux chiffres. Réutiliser la même règle que sur les lignes.
    const top=transcription(topGroups),bottom=transcription(bottomGroups);
    if(!top||!bottom)continue;
    const numerator=top.text,denominator=bottom.text;
    const validTerm=term=>/^[0-9x()+.\-]{1,16}$/.test(term)
      &&!/(?:^|[^0-9])\.|\.(?:$|[^0-9])/.test(term)
      &&!/(?:^[+\-]|[+\-]$)/.test(term)
      &&!/\(\)/.test(term)&&!term.includes("^");
    if(!validTerm(numerator)||!validTerm(denominator))continue;
    // Le parseur exact refuse les chaînes mal formées ; les dénominateurs
    // identiquement nuls ne doivent jamais devenir une fraction valide.
    let denominatorForm;
    try{
      parsePolynomial(numerator);
      denominatorForm=parsePolynomial(denominator);
    }catch{continue;}
    if(denominatorForm.every(coefficient=>coefficient.n===0n))continue;
    const usedEntries=[...upper,...lower,bar];
    // Le trait horizontal doit dépasser au moins légèrement les chiffres
    // qu'il divise. Rejeter les signes "-" ordinaires entre deux lignes.
    const topBox=rect(upper.flatMap(e=>e.paths));
    const bottomBox=rect(lower.flatMap(e=>e.paths));
    if(width(topBox)>w*1.12||width(bottomBox)>w*1.12
      ||cx(topBox)<bar.box.left-5||cx(topBox)>bar.box.right+5
      ||cx(bottomBox)<bar.box.left-5||cx(bottomBox)>bar.box.right+5)
      continue;
    for(const e of usedEntries)used.add(e.id);
    const atomic=term=>/^-?\d{1,3}(?:\.\d{1,2})?$/.test(term)||term==="x";
    const text=(atomic(numerator)?numerator:"("+numerator+")")+"/"
      +(atomic(denominator)?denominator:"("+denominator+")");
    found.push({paths:usedEntries.flatMap(e=>e.paths),preRead:text});
  }
  return [...entries.filter(e=>!used.has(e.id)),...found];
}

/**
 * Signe racine en un trait continu : crochet gauche, pointe basse,
 * remontée raide et barre haute allant vers la droite.
 * Ne pas confondre le chiffre 7, une barre de fraction ou une parenthèse.
 * Le geste inverse (de droite vers gauche) est accepté.
 */
function radicalStroke(path){
  if(path.length<5)return null;
  const b=rect([path]),w=width(b),h=height(b);
  if(w<60||h<40)return null;
  const ordered=path[0][0]<=path.at(-1)[0]?path:[...path].reverse();
  const first=ordered[0],last=ordered.at(-1);
  if(first[0]>b.left+w*.2||last[0]<b.right-w*.1
    ||last[1]>b.top+h*.2)return null;
  let tipIndex=0;
  for(let i=1;i<ordered.length;i++)
    if(ordered[i][1]>ordered[tipIndex][1])tipIndex=i;
  const tip=ordered[tipIndex];
  if(tipIndex<2||tipIndex>ordered.length-3
    ||tip[0]<b.left+w*.08||tip[0]>b.left+w*.48
    ||tip[1]<b.bottom-h*.12)return null;
  const hooked=ordered.slice(0,tipIndex).some(p=>p[0]<tip[0]
    &&p[1]<tip[1]-h*.2);
  const topIndex=ordered.findIndex((p,i)=>i>tipIndex
    &&p[1]<=b.top+h*.2&&p[0]>tip[0]+w*.06);
  if(!hooked||topIndex<0||topIndex>=ordered.length-1)return null;
  const overbar=ordered.slice(topIndex);
  if(overbar.at(-1)[0]-overbar[0][0]<w*.3
    ||overbar.some(p=>Math.abs(p[1]-overbar[0][1])>h*.1))return null;
  return {box:b,barStart:overbar[0][0],barY:overbar[0][1]};
}
/**
 * Ne lit que des radicandes courts explicitement sous la barre.
 * Le texte √(...) est une transcription, pas une preuve mathématique.
 */
function foldRadicals(items){
  const entries=items.map((entry,id)=>({...entry,id,box:rect(entry.paths)}));
  const used=new Set(),found=[];
  for(const root of entries){
    if(used.has(root.id)||root.preRead||root.paths.length!==1)continue;
    const radical=radicalStroke(root.paths[0]);
    if(!radical)continue;
    const b=radical.box;
    const below=entries.filter(e=>e.id!==root.id&&!used.has(e.id)
      &&cx(e.box)>=radical.barStart+3&&cx(e.box)<=b.right+3
      &&e.box.top>=radical.barY+6&&e.box.bottom<=b.bottom+6);
    if(!below.length)continue;
    const groups=glyphs(below);
    if(groups.length>5)continue;
    const decoded=groups.map(readGlyph);
    if(decoded.some(value=>!value))continue;
    const radicand=decoded.join("");
    if(!/^(?:\d{1,3}|x|x[+-]\d{1,2})$/.test(radicand))continue;
    used.add(root.id);
    for(const entry of below)used.add(entry.id);
    found.push({paths:[...root.paths,...below.flatMap(e=>e.paths)],
      preRead:"√("+radicand+")"});
  }
  return [...entries.filter(entry=>!used.has(entry.id)),...found];
}

function transcription(parts,{draft=false}={}){
  let text="",previous=null,unreadable=0;
  for(let i=0;i<parts.length;i++){
    const group=parts[i],b=group.box;
    let value=readGlyph(group);
    if(value==="."){
      const after=parts[i+1],next=after&&readGlyph(after);
      // Un point isolé sur la feuille ne devient pas une décimale valide.
      // Nécessite 2 chiffres et une ponctuation au bas des deux glyphes.
      const digit=/^\d$/;
      const low=(digitBox)=>cy(b)>=digitBox.top+height(digitBox)*.55
        &&cy(b)<=digitBox.bottom+height(digitBox)*.25;
      if(!previous||!digit.test(previous.value)||!digit.test(next??"")
        ||!low(previous.box)||!low(after.box)
        ||cx(b)<previous.box.right-4||cx(b)>after.box.left+4)
        value=null;
    }
    if(!value){
      if(!draft)return null;
      value="□";unreadable++;
    }
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
  const lines=sortedLines(foldRadicals(foldFractions(paths)));
  if(!lines||!lines.length)return {status:"unsupported",message:"Impossible de séparer les lignes manuscrites."};
  const texts=[];let uncertain=0,unsupported=0;
  for(const line of lines){
    const parts=glyphs(line);
    if(parts.length>MAX_GLYPHS)return {status:"unsupported",message:"Ligne trop longue pour le lecteur actuel (48 caractères maximum)."};
    const current=transcription(parts,{draft});
    if(!current)return {status:"uncertain",message:"Un symbole est ambigu : réécris-le en grand ou utilise la correction tactile. Aucun corrigé n'a été dévoilé."};
    const {text,unreadable}=current;
    uncertain+=unreadable;
    if(draft&&unreadable>0){texts.push(text);continue;}
    if(!/^[0-9x+=.*/()^√-]+$/.test(text)||/(?:^|[^0-9])\.|\.(?:$|[^0-9])/.test(text)
      ||text.split("=").length!==2||!text.split("=").every(Boolean)){
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
