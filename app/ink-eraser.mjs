/**
 * Effaceur de trait proche du doigt/stylet sur la feuille 900 × 1200.
 * Ne touche ni au texte ni aux autres pages. Fonction pure, sans DOM.
 */
import {parseStroke,PAPER_WIDTH,PAPER_HEIGHT} from "./workbook.mjs";

function segmentDistanceSquared(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  const t=length===0?0:Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length));
  const x=a[0]+t*dx,y=a[1]+t*dy;
  return (p[0]-x)**2+(p[1]-y)**2;
}
/** Index du trait le plus proche ; null si l'appui est trop loin. */
export function nearestInkStroke(page,point,{radius=15}={}){
  if(!Array.isArray(page)||page.length>100||!Array.isArray(point)||point.length!==2
    ||point.some(v=>!Number.isFinite(v))||point[0]<0||point[0]>PAPER_WIDTH
    ||point[1]<0||point[1]>PAPER_HEIGHT||!Number.isFinite(radius)||radius<=0||radius>60)return null;
  let nearest=null,best=radius*radius;
  for(let i=page.length-1;i>=0;i--){
    let stroke;
    try{stroke=parseStroke(page[i]);}catch{continue;}
    for(let j=0;j<stroke.length;j++){
      const d=segmentDistanceSquared(point,stroke[Math.max(0,j-1)],stroke[j]);
      if(d<best){best=d;nearest=i;}
    }
  }
  return nearest;
}
