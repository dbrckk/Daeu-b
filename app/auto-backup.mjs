/**
 * Copie locale automatique indépendante du localStorage.
 * Deux stockages appartenant au MÊME navigateur/appareil : NE protège PAS
 * contre la perte du téléphone ou l'effacement complet des données du site.
 * La restauration utilise exclusivement un bundle validé par persistence.mjs.
 */
import {DATA_KEY,createPersistence,createVolatileStorage} from "./persistence.mjs";

export const MIRROR_DB="daeu-b-auto-backup-v1";
export const MIRROR_STORE="snapshots";
const MIRROR_KEY="latest";
const MAX_BYTES=2_000_000;

let activeBackend=null,queue=Promise.resolve(),listener=()=>{},state="initialisation",writeHook=()=>{};
export function onAutoBackupWrite(callback){writeHook=typeof callback==="function"?callback:()=>{};}
function status(value){state=value;try{listener(value);}catch{/* ne jamais bloquer une sauvegarde */}}
export function onAutoBackupStatus(callback){
  listener=typeof callback==="function"?callback:()=>{};
  listener(state);
}

export function parseValidatedBundle(raw,knownIds){
  if(typeof raw!=="string"||raw.length>MAX_BYTES)return null;
  try{
    const memory=createVolatileStorage();
    memory.setItem(DATA_KEY,raw);
    return createPersistence(memory,knownIds).snapshot();
  }catch{return null;}
}
export function chooseRecovery(localRaw,mirrorRaw,knownIds){
  const local=parseValidatedBundle(localRaw,knownIds),mirror=parseValidatedBundle(mirrorRaw,knownIds);
  if(mirror&&(!local||mirror.revision>local.revision))
    return {source:"mirror",raw:mirrorRaw,revision:mirror.revision};
  if(local)return {source:"local",raw:localRaw,revision:local.revision};
  return {source:"none",raw:null,revision:null};
}
function openDatabase(idb){
  return new Promise((resolve,reject)=>{
    if(!idb||typeof idb.open!=="function"){reject(new Error("IndexedDB indisponible"));return;}
    let request;
    try{request=idb.open(MIRROR_DB,1);}
    catch(error){reject(error);return;}
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(MIRROR_STORE))
        request.result.createObjectStore(MIRROR_STORE);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("Impossible d'ouvrir IndexedDB"));
    request.onblocked=()=>reject(new Error("IndexedDB bloquée par un autre onglet"));
  });
}
export function createIndexedDbBackend(idb){
  const dbPromise=openDatabase(idb);
  return {
    async read(){
      const db=await dbPromise;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(MIRROR_STORE,"readonly");
        const req=tx.objectStore(MIRROR_STORE).get(MIRROR_KEY);
        req.onsuccess=()=>resolve(req.result??null);
        req.onerror=()=>reject(req.error||new Error("Lecture de la copie impossible"));
        tx.onerror=()=>reject(tx.error||new Error("Transaction de lecture échouée"));
      });
    },
    async write(raw){
      const db=await dbPromise;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(MIRROR_STORE,"readwrite");
        tx.objectStore(MIRROR_STORE).put(raw,MIRROR_KEY);
        tx.oncomplete=()=>resolve();
        tx.onabort=()=>reject(tx.error||new Error("Transaction de copie annulée"));
        tx.onerror=()=>reject(tx.error||new Error("Copie impossible"));
      });
    }
  };
}
export async function restoreAutoBackup(storage,knownIds,backend){
  const localRaw=storage.getItem(DATA_KEY);
  const mirrored=await backend.read();
  const selected=chooseRecovery(localRaw,mirrored,knownIds);
  if(selected.source==="mirror"){
    // Restaurer AVANT le chargement du moteur : pas de sauvegarde partielle.
    storage.setItem(DATA_KEY,selected.raw);
    return {source:"mirror",revision:selected.revision};
  }
  if(selected.source==="local"&&localRaw!==mirrored)
    await backend.write(localRaw);
  return {source:selected.source,revision:selected.revision};
}
export async function initializeAutoBackup(storage,knownIds,idb=globalThis.indexedDB){
  if(!storage||!knownIds?.has)return {available:false,source:"none"};
  try{
    const backend=createIndexedDbBackend(idb);
    const result=await restoreAutoBackup(storage,knownIds,backend);
    activeBackend=backend;
    status(result.source==="mirror"?"restauree":"sauvegarde-automatique");
    return {available:true,...result};
  }catch{
    activeBackend=null;
    status("stockage-secondaire-indisponible");
    return {available:false,source:"none"};
  }
}
export function backedStorage(storage){
  return {
    getItem:key=>storage.getItem(key),
    removeItem:key=>storage.removeItem(key),
    setItem(key,value){
      // L'écriture synchrone principale est la seule qui conditionne le
      // succès d'une réponse ; la copie secondaire ne peut pas l'annuler.
      storage.setItem(key,value);
      if(key===DATA_KEY){try{writeHook(String(value));}catch{/* Secondary sync must never fail primary write */}}
      if(key!==DATA_KEY||!activeBackend)return;
      const saved=String(value);
      queue=queue.catch(()=>{}).then(async()=>{
        if(saved.length>MAX_BYTES)throw Error("Copie trop volumineuse");
        await activeBackend.write(saved);
        status("sauvegarde-automatique");
      }).catch(()=>{status("copie-secondaire-en-echec");});
    }
  };
}
export async function flushAutoBackup(){await queue;}
