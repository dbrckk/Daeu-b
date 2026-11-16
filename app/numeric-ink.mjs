/**
 * Lecture de réponses numériques au doigt/stylet, intégralement locale.
 * Gabarits géométriques simples et vérification de la transcription obligatoire.
 * Aucune validation automatique d'un raisonnement ou d'une équation manuscrite.
 */
import {MAX_PAGE_STROKES,parseStroke} from "./workbook.mjs";

const SHAPES=[
  ["0", [[[49,8],[24,15],[12,35],[12,67],[26,89],[49,97],[72,88],[87,65],[86,37],[70,15],[49,8]]]],
  ["1", [[[43,21],[57,8],[57,96]]], [[[51,8],[51,96]]],
    [[[31,29],[52,10],[52,94],[22,94]]],
    [[[32,27],[52,9],[52,92],[79,92]]]],
  ["2", [[[18,26],[30,11],[55,7],[77,17],[83,37],[72,54],[49,73],[20,94],[86,94]]],
    [[[19,34],[23,16],[43,6],[60,15],[65,37],[53,62],[30,85],[16,94],
      [10,83],[22,76],[44,84],[70,94]]]],
  ["3", [[[19,14],[47,7],[75,14],[83,31],[68,47],[46,51],[71,53],[85,70],[74,89],[48,97],[17,88]]]],
  ["4", [[[65,9],[17,66],[91,66]],[[66,9],[66,97]]], [[[77,10],[20,66],[88,66],[88,95]]],
    [[[18,11],[18,62],[93,62]],[[74,17],[74,98]]],
    [[[70,9],[17,64],[70,64],[70,9],[70,98]]]],
  ["5", [[[79,9],[25,9],[20,46],[48,42],[73,49],[84,70],[73,87],[49,95],[20,86]]]],
  ["6", [[[77,9],[43,27],[22,47],[20,74],[34,93],[62,96],[81,79],[72,59],[50,52],[22,68]]]],
  ["7", [[[15,12],[87,12],[50,96]]]],
  ["8", [[[50,51],[25,35],[26,17],[50,8],[75,19],[76,37],[50,51],[26,65],[25,81],[50,97],[75,84],[76,65],[50,51]]]],
  ["9", [[[75,43],[57,57],[34,52],[20,34],[29,14],[51,7],[74,20],[78,48],[66,73],[41,94],[19,97]]]],
  ["/", [[[83,10],[17,94]]]]
];
// Le 7 barré est fréquent avec un stylet, dans les deux sens du tracé.
const BARRED_SEVEN=[
  [[[15,12],[87,12],[43,96]],[[31,53],[76,53]]],
  [[[15,14],[37,9],[87,14],[45,96]],[[27,59],[77,48]]]
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
  // Les longs tracés au stylet peuvent produire des milliers de segments.
  // Borner à 160 échantillons protège le navigateur Android contre les
  // comparaisons quadratiques tout en conservant la forme du tracé.
  if(samples.length<=160)return samples;
  return Array.from({length:160},(_,i)=>samples[Math.round(i*(samples.length-1)/159)]);
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
const BARRED_SEVEN_TEMPLATES=BARRED_SEVEN.map(sample);

function hasSevenBar(paths,box){
  if(paths.length!==2)return false;
  const width=box.maxX-box.minX,height=box.maxY-box.minY;
  return paths.some((path,index)=>{
    const bar=bounds([path]),body=bounds([paths[1-index]]);
    const center=(bar.minY+bar.maxY)/2;
    return bar.maxX-bar.minX>=width*.4&&bar.maxY-bar.minY<=height*.2
      &&center>=body.minY+height*.28&&center<=body.maxY-height*.25
      &&body.maxY-body.minY>=height*.85
      &&body.minX<bar.maxX&&bar.minX<body.maxX;
  });
}
// Un pied peut être légèrement détaché, mais reste centré sous une hampe.
export function isFootedOne(paths){
  if(paths.length!==2)return false;
  return paths.some((path,i)=>{
    const stem=paths[1-i];
    const foot=bounds([path]),body=bounds([stem]);
    const height=body.maxY-body.minY,width=foot.maxX-foot.minX;
    const gap=(foot.minY+foot.maxY)/2-body.maxY;
    const x=stem[0][1]>stem.at(-1)[1]?stem[0][0]:stem.at(-1)[0];
    return height>=24&&body.maxX-body.minX<=height*.34
      &&width>=height*.30&&width<=height*.86
      &&foot.maxY-foot.minY<=width*.16
      &&gap>=-height*.06&&gap<=height*.15
      &&x>=foot.minX+width*.15&&x<=foot.maxX-width*.15
      &&stem.every(([px,py])=>py<body.minY+height*.32||Math.abs(px-x)<=height*.12)
      &&Math.abs(stem[0][1]-stem.at(-1)[1])>=height*.90
      &&Math.abs(path[0][0]-path.at(-1)[0])>=width*.90;
  });
}

function classify(paths){
  if(!paths.length||paths.length>3)return null;
  if(isFootedOne(paths))return {digit:"1",score:0,margin:1};
  const b=bounds(paths),w=b.maxX-b.minX,h=b.maxY-b.minY;
  if(Math.max(w,h)<15)return {digit:".",score:0,margin:1};
  if(w>20&&h<Math.max(8,w*.22))return {digit:"-",score:0,margin:1};
  const p=sample(paths);
  if(!p.length)return null;
  const barred=hasSevenBar(paths,b);
  const scores=TEMPLATES.map(([digit,variants])=>({
    digit,score:Math.min(...(digit==="7"&&barred?[...variants,...BARRED_SEVEN_TEMPLATES]:variants).map(t=>distance(p,t)))
  })).sort((a,b)=>a.score-b.score);
  return {...scores[0],margin:scores[1].score-scores[0].score};
}
function splitGlyphs(strokes){
  const sorted=strokes.map(s=>({paths:[s],box:bounds([s])})).sort((a,b)=>a.box.minX-b.box.minX);
  const groups=[];
  for(const item of sorted){
    const last=groups.at(-1);
    if(last&&((item.box.minX<=last.box.maxX+Math.min(5,(last.box.maxX-last.box.minX)*.1)
      &&item.box.maxY>=last.box.minY&&item.box.minY<=last.box.maxY)
      ||(last.paths.length===1&&isFootedOne([last.paths[0],item.paths[0]])))){
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
  const digitBoxes=glyphs.map(g=>g.box).filter(b=>b.maxY-b.minY>=18);
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
  if(/^-?0\d/.test(text))
    return {status:"uncertain",message:"Plusieurs chiffres avec zéro initial : lecture ambiguë."};
  if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:\/\d+)?$/.test(text)||Number(text.split("/")[1])===0)
    return {status:"unsupported",message:"La transcription n'est pas un nombre ou une fraction simple."};
  return {status:"recognized",text,score:weakest};
}

/**
 * Lit une fraction posée sur deux lignes, seule ou séparée des calculs.
 * Une barre isolée et deux entiers centrés doivent être géométriquement cohérents.
 */
export function recognizeStackedFractionInk(page){
  if(!Array.isArray(page)||page.length<3||page.length>MAX_PAGE_STROKES)return null;
  let strokes;
  try{strokes=page.map(raw=>({raw,box:bounds([parseStroke(raw)])}));}
  catch{return null;}
  const proposals=[];
  for(const bar of strokes){
    const {minX,maxX,minY,maxY}=bar.box;
    const width=maxX-minX,midX=(minX+maxX)/2;
    if(width<28||maxY-minY>Math.min(16,width*.13))continue;
    const denominator=strokes.filter(stroke=>stroke.box.minY>maxY);
    if(!denominator.length||denominator.length>12)continue;
    const above=strokes.filter(stroke=>stroke.box.maxY<minY)
      .sort((a,b)=>b.box.maxY-a.box.maxY);
    const numerator=[];
    let rowTop=minY;
    for(const stroke of above){
      // Une ligne de brouillon distincte peut précéder cette fraction.
      if(rowTop-stroke.box.maxY>36&&numerator.length)break;
      numerator.push(stroke);
      rowTop=Math.min(rowTop,stroke.box.minY);
    }
    if(!numerator.length||numerator.length>12)continue;
    if(strokes.some(stroke=>stroke!==bar&&stroke.box.maxY>=minY&&stroke.box.minY<=maxY))continue;
    // Deux barres rapprochées qui couvrent le milieu ne forment pas une fraction.
    if(numerator.some(({box})=>minY-box.maxY<=16&&box.maxX-box.minX>=28
      &&box.maxY-box.minY<=8&&box.minX<=midX&&box.maxX>=midX))continue;
    const horizontalTolerance=12;
    const compatible=(row,gap)=>{
      const left=Math.min(...row.map(({box})=>box.minX));
      const right=Math.max(...row.map(({box})=>box.maxX));
      const height=Math.max(...row.map(({box})=>box.maxY))-Math.min(...row.map(({box})=>box.minY));
      return height>=18&&gap>=2&&gap<=Math.max(20,height*.65)
        &&left>=minX-horizontalTolerance&&right<=maxX+horizontalTolerance
        &&Math.abs((left+right)/2-midX)<=Math.max(10,width*.28);
    };
    if(!compatible(numerator,minY-above[0].box.maxY)
      ||!compatible(denominator,Math.min(...denominator.map(({box})=>box.minY))-maxY))continue;
    const top=recognizeNumericInk(numerator.map(({raw})=>raw));
    const bottom=recognizeNumericInk(denominator.map(({raw})=>raw));
    if(top.status!=="recognized"||bottom.status!=="recognized"
      ||!/^-?\d+$/.test(top.text)||!/^\d+$/.test(bottom.text)||Number(bottom.text)===0)continue;
    proposals.push({status:"recognized",text:top.text+"/"+bottom.text,score:Math.min(top.score,bottom.score)});
  }
  return proposals.length===1?proposals[0]:null;
}

/** Une ligne de résultat doit être nettement séparée du reste de la copie. */
export function recognizeBottomNumericInk(page){
  if(!Array.isArray(page)||page.length<2||page.length>MAX_PAGE_STROKES)return null;
  let positioned;
  try{
    positioned=page.map(raw=>({raw,box:bounds([parseStroke(raw)])}))
      .sort((a,b)=>a.box.minY-b.box.minY);
  }catch{return null;}
  let split=0,bottom=positioned[0].box.maxY;
  for(let i=1;i<positioned.length;i++){
    const {minY,maxY}=positioned[i].box;
    if(minY-bottom>=36)split=i;
    bottom=Math.max(bottom,maxY);
  }
  if(!split)return null;
  const finalLine=positioned.slice(split);
  const left=Math.min(...finalLine.map(item=>item.box.minX));
  const right=Math.max(...finalLine.map(item=>item.box.maxX));
  // Une barre proche au-dessus du résultat peut être celle d'une fraction.
  const belowBar=positioned.slice(0,split).some(({box:b})=>
    positioned[split].box.minY-b.maxY<=85&&b.maxX-b.minX>=20&&b.maxY-b.minY<=8
    &&b.minX<=right&&b.maxX>=left
  );
  if(belowBar)return null;
  const result=recognizeNumericInk(finalLine.map(item=>item.raw));
  return result.status==="recognized"?result:null;
}
