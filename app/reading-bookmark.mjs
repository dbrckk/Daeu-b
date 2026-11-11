/**
 * Signets de lecture locaux, séparés des résultats et des copies d'examens.
 * Aucune donnée du document n'est stockée, seulement l'identifiant de section.
 */
const PREFIX="daeu-b-reader-bookmark-v1:";
const VALID_DOCUMENT=/^(?:cours:[0-1][0-9]-[a-z0-9-]+|problemes:(?:sujets|corriges))$/;
const VALID_SECTION=/^[a-zA-Z][a-zA-Z0-9_-]{0,100}$/;
export function bookmarkKey(documentId){
  return VALID_DOCUMENT.test(documentId)?PREFIX+documentId:null;
}
export function readBookmark(storage,documentId){
  const key=bookmarkKey(documentId);
  if(!key)return null;
  try{
    const value=storage.getItem(key);
    return value&&VALID_SECTION.test(value)?value:null;
  }catch{return null;}
}
export function saveBookmark(storage,documentId,sectionId){
  const key=bookmarkKey(documentId);
  if(!key||!VALID_SECTION.test(sectionId))return false;
  try{storage.setItem(key,sectionId);return true;}catch{return false;}
}
export function clearBookmark(storage,documentId){
  const key=bookmarkKey(documentId);
  if(!key)return false;
  try{storage.removeItem(key);return true;}catch{return false;}
}
