/**
 * Cahiers de calcul électroniques par activité.
 * Les pages sont des trajectoires de points entiers et non des images bitmap :
 * édition / reprise déterministes et sauvegarde cloud de la même progression.
 */
import {sanitizeInkDrafts} from "./ink-drafts.mjs";
import {stepReview,stepReviewRecommendations,stepReviewUrl} from "./course-catalog.mjs";

export const WORKBOOK_VERSION=1;
export const PAPER_WIDTH=900;
export const PAPER_HEIGHT=1200;
// Marge pour le reste du bundle et pour le quota localStorage du navigateur.
export const MAX_WORKBOOK_BYTES=1_650_000;
export const MAX_PAGE_STROKES=240;
export const MAX_WORK_PAGES=8;
const KEY_PATTERN=/^[A-Za-z0-9:_.-]{1,130}$/;
const STROKE_PATTERN=/^\d{1,4},\d{1,4}(;\d{1,4},\d{1,4}){0,299}$/;

export const emptyWorkbook=()=>({version:WORKBOOK_VERSION,entries:{}});
export const blankWork=()=>({text:"",pages:[[]]});
const clone=value=>JSON.parse(JSON.stringify(value));

export function validWorkKey(key){return typeof key==="string"&&KEY_PATTERN.test(key);}

export function parseStroke(raw){
  if(typeof raw!=="string"||raw.length>2500||!STROKE_PATTERN.test(raw))
    throw Error("Trait de calcul invalide");
  const points=raw.split(";").map(part=>part.split(",").map(Number));
  if(points.some(([x,y])=>x<0||x>PAPER_WIDTH||y<0||y>PAPER_HEIGHT))
    throw Error("Coordonnées de calcul hors page");
  return points;
}
export function encodeStroke(points){
  if(!Array.isArray(points)||!points.length||points.length>300)throw Error("Trait trop long");
  const raw=points.map(point=>{
    if(!Array.isArray(point)||point.length!==2||point.some(n=>!Number.isFinite(n)))
      throw Error("Point invalide");
    return point.map(Math.round).join(",");
  }).join(";");
  parseStroke(raw);
  return raw;
}
export function sanitizeWork(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||typeof raw.text!=="string"
    ||raw.text.length>6000||!Array.isArray(raw.pages)
    ||raw.pages.length<1||raw.pages.length>MAX_WORK_PAGES)throw Error("Page de calcul incompatible");
  const pages=raw.pages.map(page=>{
    if(!Array.isArray(page)||page.length>MAX_PAGE_STROKES)throw Error("Trop de traits sur une page");
    return page.map(path=>{parseStroke(path);return path;});
  });
  const cleaned={text:raw.text,pages};
  const drafts=sanitizeInkDrafts(raw.inkDrafts,pages);
  if(drafts&&Object.keys(drafts).length)cleaned.inkDrafts=drafts;
  if(JSON.stringify(cleaned).length>180_000)throw Error("Cahier trop volumineux pour cette activité");
  return cleaned;
}
// Bounded diagnostic history, not an assessment or duplicate of draft text.
export const MAX_STEP_REVIEWS=60;
const validReviewContext=key=>typeof key==="string"&&validWorkKey(key)&&/^(?:quiz:|cours:|problems:)/.test(key);
const validCount=n=>Number.isInteger(n)&&n>=0&&n<=40;
function reviewFingerprint(source){
  // Used only for deduplication; never an integrity or correctness proof.
  let a=2166136261,b=0x9e3779b9;
  for(let i=0;i<source.length;i++){const n=source.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,2246822519);}
  return (a>>>0).toString(16).padStart(8,"0")+(b>>>0).toString(16).padStart(8,"0");
}
export function sanitizeStepReviews(raw){
  if(!Array.isArray(raw))return [];
  const out=[];
  for(const row of raw.slice(-MAX_STEP_REVIEWS)){
    if(!row||!validReviewContext(row.context)||!Number.isSafeInteger(row.at)||row.at<0||row.at>1e15
      ||typeof row.fingerprint!=="string"||!/^[0-9a-f]{16}$/.test(row.fingerprint)
      ||!validCount(row.checked)||row.checked===0||!validCount(row.unsupported)
      ||!Array.isArray(row.skills)||row.skills.length>7)continue;
    const skills=[],seen=new Set();let errors=0,valid=true;
    for(const item of row.skills){
      if(!item||!stepReview(item.code)||seen.has(item.code)||!validCount(item.count)||item.count===0){valid=false;break;}
      seen.add(item.code);errors+=item.count;skills.push({code:item.code,count:item.count});
    }
    if(!valid||errors>row.checked)continue;
    out.push({context:row.context,at:row.at,fingerprint:row.fingerprint,checked:row.checked,
      unsupported:row.unsupported,skills});
  }
  return out;
}
/** Store a diagnostic only when it belongs to the saved draft. Identical
 * repeated clicks are not counted as separate learning events. */
export function recordWorkbookReview(book,context,text,review,now=Date.now()){
  const clean=sanitizeWorkbook(book);
  if(!validReviewContext(context)||!text.trim()||clean.entries[context]?.text!==text
    ||!validCount(review?.checked)||review.checked===0||!validCount(review.unsupported))
    return {book:clean,changed:false};
  const history=clean.stepReviews??[],last=history.findLast(row=>row.context===context);
  const skills=stepReviewRecommendations(review.entries).map(({code,count})=>({code,count}));
  const next={context,at:now,fingerprint:reviewFingerprint(text),checked:review.checked,
    unsupported:review.unsupported,skills};
  if(!skills.length&&!last)return {book:clean,changed:false};
  if(last&&last.fingerprint===next.fingerprint&&last.checked===next.checked&&last.unsupported===next.unsupported
    &&JSON.stringify(last.skills)===JSON.stringify(next.skills))return {book:clean,changed:false};
  if(sanitizeStepReviews([next]).length!==1)return {book:clean,changed:false};
  return {book:sanitizeWorkbook({...clean,stepReviews:[...history,next].slice(-MAX_STEP_REVIEWS)}),changed:true};
}
/** Latest diagnosis per notebook, aggregated by skill. A subsequent
 * unassisted correct quiz answer is practice evidence, never mastery. */
export function workbookReviewPlan(book,practice,now=Date.now()){
  const history=sanitizeStepReviews(book?.stepReviews).filter(row=>row.at<=now);
  const latest=new Map();
  for(const row of history)latest.set(row.context,row);
  const groups=new Map();
  for(const row of latest.values())for(const skill of row.skills){
    const previous=groups.get(skill.code)??{count:0,at:0,contexts:0};
    groups.set(skill.code,{count:previous.count+skill.count,at:Math.max(previous.at,row.at),contexts:previous.contexts+1});
  }
  const rows=[...groups].map(([code,info])=>{
    const item=stepReview(code);
    const practiced=item.ids.filter(id=>{
      const q=practice?.items?.[id];
      return q?.lastCorrectDay&&q.streak>0&&q.lastAt>info.at&&q.lastAt<=now;
    }).length;
    const due=item.ids.filter(id=>{
      const q=practice?.items?.[id];return q?.attempts&&q.dueAt<=now;
    }).length;
    return {...item,...info,practiced,due,remaining:item.ids.length-practiced,url:stepReviewUrl(code)};
  }).sort((a,b)=>Number(b.remaining>0)-Number(a.remaining>0)||b.due-a.due||b.count-a.count||b.at-a.at||a.code.localeCompare(b.code,"fr"));
  return {rows,history:[...history].reverse(),daily:rows.filter(row=>row.remaining>0||row.due>0).slice(0,3)};
}
export function sanitizeWorkbook(raw){
  if(raw===undefined||raw===null)return emptyWorkbook();
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||raw.version!==WORKBOOK_VERSION
    ||!raw.entries||typeof raw.entries!=="object"||Array.isArray(raw.entries))
    throw Error("Version du cahier incompatible");
  if(Object.keys(raw.entries).length>180||JSON.stringify(raw).length>MAX_WORKBOOK_BYTES)
    throw Error("Cahier global trop volumineux");
  const entries=Object.create(null);
  for(const [key,value] of Object.entries(raw.entries)){
    if(!validWorkKey(key))throw Error("Identifiant de cahier invalide");
    Object.defineProperty(entries,key,{value:sanitizeWork(value),enumerable:true,writable:true,configurable:true});
  }
  const stepReviews=sanitizeStepReviews(raw.stepReviews);
  return {version:WORKBOOK_VERSION,entries,...(stepReviews.length?{stepReviews}:{})};
}
export function readWork(book,key){
  if(!validWorkKey(key))throw Error("Activité inconnue");
  return clone(book?.entries?.[key]??blankWork());
}
export function changeWork(book,key,raw){
  if(!validWorkKey(key))throw Error("Activité inconnue");
  const value=sanitizeWork(raw);
  const cleaned=sanitizeWorkbook(book);
  const next={...cleaned,entries:{...cleaned.entries}};
  if(!value.text.trim()&&value.pages.every(page=>page.length===0))delete next.entries[key];
  else Object.defineProperty(next.entries,key,{value,enumerable:true,configurable:true,writable:true});
  return sanitizeWorkbook(next);
}
