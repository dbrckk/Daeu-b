/**
 * Signets de lecture locaux, séparés des résultats et des copies d'examens.
 * Seuls l’identifiant de section et le jalon de lecture éventuel sont stockés.
 */
export const BOOKMARK_PREFIX="daeu-b-reader-bookmark-v1:";
export const LAST_READING_KEY="daeu-b-last-reading-v1";
const VALID_DOCUMENT=/^(?:cours:[0-1][0-9]-[a-z0-9-]+|(?:problemes|transferts(?:-[bc])?):(?:sujets|corriges))$/;
const VALID_SECTION=/^[a-zA-Z][a-zA-Z0-9_-]{0,100}$/;
const validSection=section=>typeof section==="string"&&VALID_SECTION.test(section);
const validJalon=jalon=>Number.isInteger(jalon)&&jalon>=1&&jalon<=20;
export function bookmarkKey(documentId){
  return typeof documentId==="string"&&VALID_DOCUMENT.test(documentId)?BOOKMARK_PREFIX+documentId:null;
}
export function readBookmarkEntry(storage,documentId){
  const key=bookmarkKey(documentId);
  if(!key)return null;
  try{
    const value=storage.getItem(key);
    if(validSection(value))return {sectionId:value};
    const entry=JSON.parse(value);
    if(!entry||!validSection(entry.sectionId))return null;
    return validJalon(entry.jalon)?{sectionId:entry.sectionId,jalon:entry.jalon}:{sectionId:entry.sectionId};
  }catch{return null;}
}
export function readBookmark(storage,documentId){
  return readBookmarkEntry(storage,documentId)?.sectionId??null;
}
export function saveBookmark(storage,documentId,sectionId,{jalon}={}){
  const key=bookmarkKey(documentId);
  if(!key||!validSection(sectionId))return false;
  const value=validJalon(jalon)?JSON.stringify({sectionId,jalon}):sectionId;
  try{storage.setItem(key,value);return true;}catch{return false;}
}
export function clearBookmark(storage,documentId){
  const key=bookmarkKey(documentId);
  if(!key)return false;
  try{storage.removeItem(key);return true;}catch{return false;}
}

export function readLastReading(storage){
  try{
    const entry=JSON.parse(storage.getItem(LAST_READING_KEY));
    if(!entry||!bookmarkKey(entry.documentId)||!validSection(entry.sectionId))return null;
    const {documentId,sectionId,jalon}=entry;
    return validJalon(jalon)?{documentId,sectionId,jalon}:{documentId,sectionId};
  }catch{return null;}
}

export function saveLastReading(storage,documentId,sectionId,jalon){
  if(!bookmarkKey(documentId)||!validSection(sectionId))return false;
  const entry={documentId,sectionId,...(validJalon(jalon)?{jalon}:{})};
  try{
    const value=JSON.stringify(entry);
    if(storage.getItem(LAST_READING_KEY)!==value)storage.setItem(LAST_READING_KEY,value);
    return true;
  }catch{return false;}
}
