import {encodeStroke,parseStroke,PAPER_HEIGHT,PAPER_WIDTH} from "../../app/workbook.mjs";

export function normalizePaths(paths){
  const points=paths.flat();
  const xs=points.map(([x])=>x),ys=points.map(([,y])=>y);
  const left=Math.min(...xs),top=Math.min(...ys);
  const scale=Math.min((PAPER_WIDTH-40)/(Math.max(...xs)-left||1),
    Math.min(70,PAPER_HEIGHT-40)/(Math.max(...ys)-top||1));
  return paths.map(path=>{
    const count=Math.min(path.length,180);
    return encodeStroke(Array.from({length:count},(_,i)=>{
      const [x,y]=path[Math.round(i*(path.length-1)/Math.max(1,count-1))];
      return [20+(x-left)*scale,20+(y-top)*scale];
    }));
  });
}

function bounds(points){
  const xs=points.map(([x])=>x),ys=points.map(([,y])=>y);
  return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
}

function fits(row,bar,gap){
  if(!row.length)return false;
  const {left,right,top,bottom}=bounds(row.flatMap(({points})=>points));
  const width=bar.right-bar.left,height=bottom-top;
  return height>=8&&gap<=height*.8&&left>=bar.left-width*.25&&right<=bar.right+width*.25
    &&Math.abs((left+right-bar.left-bar.right)/2)<=width*.3;
}

/** Repère une barre unique située entre tous les traits du haut et du bas. */
export function splitIsolatedFraction(ink){
  const strokes=ink.map(raw=>{
    const points=parseStroke(raw);
    return {points,...bounds(points)};
  });
  const candidates=[];
  for(const bar of strokes){
    const width=bar.right-bar.left;
    if(width<12||bar.bottom-bar.top>width*.2)continue;
    const numerator=strokes.filter(stroke=>stroke.bottom<bar.top);
    const denominator=strokes.filter(stroke=>stroke.top>bar.bottom);
    if(numerator.length+denominator.length!==strokes.length-1)continue;
    const topGap=bar.top-Math.max(...numerator.map(stroke=>stroke.bottom));
    const bottomGap=Math.min(...denominator.map(stroke=>stroke.top))-bar.bottom;
    if(!fits(numerator,bar,topGap)||!fits(denominator,bar,bottomGap))continue;
    candidates.push([numerator,denominator].map(row=>normalizePaths(row.map(stroke=>stroke.points))));
  }
  return candidates.length===1?candidates[0]:null;
}
