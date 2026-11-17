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
    [[[30,15],[59,10],[80,12],[83,38],[74,51],[43,62],[17,78],[22,91],[47,97],[76,96],[93,87]]],
    [[[19,34],[23,16],[43,6],[60,15],[65,37],[53,62],[30,85],[16,94],
      [10,83],[22,76],[44,84],[70,94]]]],
  ["3", [[[19,14],[47,7],[75,14],[83,31],[68,47],[46,51],[71,53],[85,70],[74,89],[48,97],[17,88]]],
    [[[18,12],[57,9],[48,28],[79,50],[84,71],[72,88],[46,97],[15,98]]]],
  ["4", [[[65,9],[17,66],[91,66]],[[66,9],[66,97]]], [[[77,10],[20,66],[88,66],[88,95]]],
    [[[18,11],[18,62],[93,62]],[[74,17],[74,98]]],
    [[[70,9],[17,64],[70,64],[70,9],[70,98]]]],
  ["5", [[[79,9],[25,9],[20,46],[48,42],[73,49],[84,70],[73,87],[49,95],[20,86]]]],
  ["6", [[[77,9],[43,27],[22,47],[20,74],[34,93],[62,96],[81,79],[72,59],[50,52],[22,68]]]],
  ["7", [[[15,12],[87,12],[50,96]]]],
  ["8", [[[50,51],[25,35],[26,17],[50,8],[75,19],[76,37],[50,51],[26,65],[25,81],[50,97],[75,84],[76,65],[50,51]]],
    // Boucles étroites ou 8 commencé sur le bord supérieur.
    [[[55,8],[39,12],[40,30],[51,53],[60,75],[46,94],[30,94],[33,76],[47,49],[55,26],[52,8]]],
    [[[87,10],[34,8],[13,18],[22,31],[51,47],[79,64],[86,79],[74,94],[43,97],[27,77],[28,52],[42,23],[60,10]]]],
  ["9", [[[75,43],[57,57],[34,52],[20,34],[29,14],[51,7],[74,20],[78,48],[66,73],[41,94],[19,97]]],
    [[[64,29],[63,11],[49,8],[30,24],[23,42],[38,56],[60,48],[72,25],[65,47],[59,70],[57,97]]]],
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
const MAX_GLYPH_DISTANCE=.13,MIN_GLYPH_MARGIN=.015;

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
// Un 7 presque vertical peut ressembler à un 4 dans les gabarits.
// Sa tête part vers la droite au sommet avant que la hampe traverse la barre.
function hasUprightSeven(paths,box){
  const height=box.maxY-box.minY;
  return paths.some((body,index)=>{
    const bar=bounds([paths[1-index]]);
    const cross=(bar.minY+bar.maxY)/2;
    const shape=bounds([body]);
    if(shape.maxY-shape.minY<height*.9)return false;
    const path=body[0][1]<=body.at(-1)[1]?body:[...body].reverse();
    const [startX,startY]=path[0];
    const [endX,endY]=path.at(-1);
    if(startY>box.minY+height*.16||endY<box.maxY-height*.12)return false;
    const shoulder=path.findIndex(([,y])=>y>box.minY+height*.24);
    if(shoulder<2)return false;
    const headRight=Math.max(...path.slice(0,shoulder).map(([x])=>x));
    if(headRight-startX<height*.48||Math.abs(headRight-endX)>height*.26)return false;
    const stem=path.slice(shoulder);
    if(stem.some(([x,y])=>Math.abs(x-headRight)>height*.28||y<box.minY+height*.18))return false;
    const crossing=stem.findIndex(([,y])=>y>=cross);
    if(crossing<0)return false;
    const [x1,y1]=crossing?stem[crossing-1]:path[shoulder-1];
    const [x2,y2]=stem[crossing];
    const x=x1+(x2-x1)*(cross-y1)/(y2-y1);
    const inset=(bar.maxX-bar.minX)*.12;
    return x>=bar.minX+inset&&x<=bar.maxX-inset;
  });
}
// Une hampe rectiligne croise la barre du 4 au-dessous du sommet.
function hasOpenFour(paths,box){
  if(paths.length!==2)return false;
  const height=box.maxY-box.minY;
  return paths.some((arm,index)=>{
    const stroke=paths[1-index];
    const stem=stroke[0][1]<=stroke.at(-1)[1]?stroke:[...stroke].reverse();
    const [topX,topY]=stem[0], [bottomX,bottomY]=stem.at(-1);
    if(bottomY-topY<height*.64||Math.abs(bottomX-topX)>height*.27)return false;
    if(stem.some(([x,y])=>Math.abs(x-topX-(bottomX-topX)*(y-topY)/(bottomY-topY))>height*.10))return false;

    const path=arm[0][1]<=arm.at(-1)[1]?arm:[...arm].reverse();
    const [startX,startY]=path[0], [endX,endY]=path.at(-1);
    const rise=endY-startY;
    if(rise<height*.23||endY<topY+height*.18||endY>bottomY-height*.18)return false;
    const stemX=topX+(bottomX-topX)*(endY-topY)/(bottomY-topY);
    // Une boucle de 9 peut repartir de la hampe avant de dessiner son arrondi.
    if(endX<stemX-height*.12||endX>stemX+height*.44||startX>stemX-height*.08)return false;

    return path.some(([x,y],i)=>{
      if(i===0||i===path.length-1||endX-x<height*.25||x>stemX-height*.24
        ||y-startY<rise*.82||Math.abs(y-endY)>height*.11||x>startX+height*.06)return false;
      const down=path.slice(0,i);
      const across=path.slice(i+1);
      return down.every(([px,py])=>px<=Math.max(startX,x)+height*.12&&py<=y+height*.10)
        &&across.every(([px,py])=>px>=x-height*.05&&px<=endX+height*.10&&Math.abs(py-y)<=height*.11);
    });
  });
}

// Le 4 fermé garde un coude entre sa diagonale et sa barre, même quand
// la barre s'arrête sur la hampe. La boucle du 9 revient de façon arrondie.
function hasJoinedFourArm(arm,top,bottom,stemX,height){
  const path=far(arm[0],top)<=far(arm.at(-1),top)?arm:[...arm].reverse();
  const [startX,startY]=path[0], [endX,endY]=path.at(-1);
  const endOffset=endX-stemX(endY);
  if(far(path[0],top)>height*.16||endOffset<-height*.08||endOffset>height*.53
    ||endY<top[1]+height*.17||endY>bottom[1]-height*.21)return false;

  return path.some(([x,y],i)=>{
    const run=endX-x,drop=y-startY,left=startX-x;
    if(i===0||i===path.length-1||run<height*.27||drop<height*.18||left<height*.25
      ||Math.abs(endY-y)>run*.36||stemX(y)-x<height*.21)return false;
    // L'écart perpendiculaire reste comparable même pour une diagonale peu pentue.
    const diagonalLength=Math.hypot(left,drop);
    for(let k=0;k<i;k++){
      const [px,py]=path[k];
      const offset=Math.abs((px-startX)*drop+(py-startY)*left)/diagonalLength;
      if(offset>height*.12||py>y+height*.05||py<startY-height*.07)return false;
    }
    for(let k=i+1;k<path.length;k++){
      const [px,py]=path[k],barY=y+(endY-y)*(px-x)/run;
      if(px<x-height*.05||px>endX+height*.16||Math.abs(py-barY)>height*.12)return false;
    }
    return true;
  });
}

function hasSlantedFour(paths,box){
  if(paths.length!==2)return false;
  const height=box.maxY-box.minY;
  return paths.some((arm,index)=>{
    const stem=paths[1-index];
    const ends=[stem[0],stem.at(-1)].sort((a,b)=>a[1]-b[1]);
    const [top,bottom]=ends;
    const [topX,topY]=top, [bottomX,bottomY]=bottom;
    const stemHeight=bottomY-topY;
    if(stemHeight<height*.64||Math.abs(bottomX-topX)>height*.46)return false;
    const stemX=y=>topX+(bottomX-topX)*(y-topY)/stemHeight;
    if(stem.some(([x,y])=>Math.abs(x-stemX(y))>height*.12))return false;
    if(stemHeight>=height*.76&&hasJoinedFourArm(arm,top,bottom,stemX,height))return true;

    const path=arm[0][0]<=arm.at(-1)[0]?arm:[...arm].reverse();
    const [startX,startY]=path[0], [endX,endY]=path.at(-1);
    const startsLeft=startX<=stemX(startY)-height*.09;
    const endOffset=endX-stemX(endY);
    // Quand les deux traits partent près du même point, une barre bien
    // prolongée à droite de la hampe aide à distinguer le 4 d'une boucle.
    if(endX-startX<height*.16||endOffset<(startsLeft?-.18:.20)*height||endOffset>height*.50
      ||endY<topY+height*.13||endY>bottomY-height*.17)return false;

    return path.some(([x,y],i)=>{
      const rightRun=endX-x,drop=y-startY;
      if(i===0||i===path.length-1||rightRun<height*.24||drop<height*.23
        ||x>startX+height*.12||Math.abs(endY-y)>rightRun*.48
        ||y<topY+height*.23||y>bottomY-height*.16)return false;
      if(!startsLeft&&startX-x<height*.20)return false;
      const barY=px=>y+(endY-y)*(px-x)/rightRun;
      for(let k=0;k<i;k++){
        const [px,py]=path[k];
        if(px>Math.max(x,startX)+height*.10||py>y+height*.10||py<startY-height*.09)return false;
        if(!startsLeft&&Math.abs(px-startX-(x-startX)*(py-startY)/drop)>height*.11)return false;
      }
      for(let k=i+1;k<path.length;k++){
        const [px,py]=path[k];
        if(px<x-height*.04||px>endX+height*.12||Math.abs(py-barY(px))>height*.12)return false;
      }
      return true;
    });
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
  const barred=hasSevenBar(paths,b);
  if(barred&&hasUprightSeven(paths,b))return {digit:"7",score:0,margin:1};
  if(hasOpenFour(paths,b))return {digit:"4",score:0,margin:1};
  const p=sample(paths);
  if(!p.length)return null;
  const scores=TEMPLATES.map(([digit,variants])=>({
    digit,score:Math.min(...(digit==="7"&&barred?[...variants,...BARRED_SEVEN_TEMPLATES]:variants).map(t=>distance(p,t)))
  })).sort((a,b)=>a.score-b.score);
  const [best,second]=scores,margin=second.score-best.score;
  if((best.digit==="9"||best.score>MAX_GLYPH_DISTANCE||margin<MIN_GLYPH_MARGIN)&&hasSlantedFour(paths,b))
    return {digit:"4",score:0,margin:1};
  return {...best,margin};
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
    if(!c||c.score>MAX_GLYPH_DISTANCE||c.margin<MIN_GLYPH_MARGIN)
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
      return height>=18&&gap>=1&&gap<=Math.max(20,height*.65)
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
