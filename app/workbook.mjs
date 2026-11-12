/**
 * Cahiers de calcul électroniques par activité.
 * Les pages sont des trajectoires de points entiers et non des images bitmap :
 * édition / reprise déterministes et sauvegarde cloud de la même progression.
 */
export const WORKBOOK_VERSION=1;
export const PAPER_WIDTH=600;
export const PAPER_HEIGHT=800;
export const MAX_WORKBOOK_BYTES=650_000;
const KEY_PATTERN=/^[A-Za-z0-9:_.-]{1,130}$/;
const STROKE_PATTERN=/^\d{1,3},\d{1,3}(;\d{1,3},\d{1,3}){0,299}$/;

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
    ||raw.pages.length<1||raw.pages.length>8)throw Error("Page de calcul incompatible");
  const pages=raw.pages.map(page=>{
    if(!Array.isArray(page)||page.length>100)throw Error("Trop de traits sur une page");
    return page.map(path=>{parseStroke(path);return path;});
  });
  const cleaned={text:raw.text,pages};
  if(JSON.stringify(cleaned).length>80_000)throw Error("Cahier trop volumineux pour cette activité");
  return cleaned;
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
  return {version:WORKBOOK_VERSION,entries};
}
export function readWork(book,key){
  if(!validWorkKey(key))throw Error("Activité inconnue");
  return clone(book?.entries?.[key]??blankWork());
}
export function changeWork(book,key,raw){
  if(!validWorkKey(key))throw Error("Activité inconnue");
  const value=sanitizeWork(raw);
  const next={version:WORKBOOK_VERSION,entries:{...sanitizeWorkbook(book).entries}};
  if(!value.text.trim()&&value.pages.every(page=>page.length===0))delete next.entries[key];
  else Object.defineProperty(next.entries,key,{value,enumerable:true,configurable:true,writable:true});
  return sanitizeWorkbook(next);
}
