/**
 * Storage transactionnel unique pour les révisions et les copies.
 *
 * Une écriture localStorage.setItem() remplace atomiquement la chaîne
 * complète ; l'export/import ou le reset ne peuvent ainsi laisser un
 * état « révisions importées, copies non importées ».
 *
 * Le contrôle d'empreinte empêche un onglet ancien d'écraser sans préavis
 * un état qui a changé depuis son chargement. L'API localStorage ne fournit
 * cependant pas de compare-and-swap multi-onglets : on ne revendique pas
 * une sérialisation forte en cas d'écritures exactement simultanées.
 */
import {emptyState,sanitizeState} from "./engine.mjs";
import {emptyExamStore,sanitizeExamStore} from "./exam-engine.mjs";

export const DATA_KEY="daeu-b-data-v1";
export const OLD_PRACTICE_KEY="daeu-b-maths-progress-v2";
export const OLD_EXAMS_KEY="daeu-b-exams-v1";
export const DATA_VERSION=1;
export class StaleDataError extends Error {
  constructor(){super("La progression a été modifiée depuis un autre onglet. Recharge la page avant de continuer.");this.name="StaleDataError";}
}
export class InvalidStorageError extends Error {
  constructor(message){super(message);this.name="InvalidStorageError";}
}
const copy=obj=>JSON.parse(JSON.stringify(obj));
const validRevision=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e12;

function normalizeBundle(raw,knownIds){
  if(!raw||raw.version!==DATA_VERSION||!validRevision(raw.revision))
    throw new InvalidStorageError("Version de stockage incompatible");
  return {
    version:DATA_VERSION,
    revision:raw.revision,
    practice:sanitizeState(raw.practice,knownIds),
    exams:sanitizeExamStore(raw.exams)
  };
}
function parse(value,label){
  try{return JSON.parse(value);}
  catch{throw new InvalidStorageError("Données "+label+" non lisibles ; aucune ancienne sauvegarde ne sera écrasée.");}
}
export function createPersistence(storage,knownIds){
  if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function"||!knownIds?.has)
    throw new TypeError("Interface de stockage ou identifiants manquants");
  const startRaw=storage.getItem(DATA_KEY);
  const legacyPracticeRaw=storage.getItem(OLD_PRACTICE_KEY);
  const legacyExamsRaw=storage.getItem(OLD_EXAMS_KEY);
  let current=startRaw===null?{
    version:DATA_VERSION,
    revision:0,
    practice:legacyPracticeRaw===null?emptyState():sanitizeState(parse(legacyPracticeRaw,"du suivi"),knownIds),
    exams:legacyExamsRaw===null?emptyExamStore():sanitizeExamStore(parse(legacyExamsRaw,"des copies"))
  }:normalizeBundle(parse(startRaw,"unifiées"),knownIds);
  let fingerprint=startRaw;

  function isStale(){
    if(storage.getItem(DATA_KEY)!==fingerprint)return true;
    if(fingerprint===null && (
      storage.getItem(OLD_PRACTICE_KEY)!==legacyPracticeRaw ||
      storage.getItem(OLD_EXAMS_KEY)!==legacyExamsRaw
    ))return true;
    return false;
  }
  function save(updated){
    if(isStale())throw new StaleDataError();
    const next={
      version:DATA_VERSION,
      revision:current.revision+1,
      practice:updated.practice,
      exams:updated.exams
    };
    if(next.revision>1e12)throw new InvalidStorageError("Le compteur de sauvegarde a atteint sa limite");
    const encoded=JSON.stringify(next);
    // En cas de quota épuisé ou stockage inaccessible, l'état courant
    // et les anciennes clés restent inchangés.
    storage.setItem(DATA_KEY,encoded);
    current=next;
    fingerprint=encoded;
    // Migration : suppression des copies anciennes uniquement après succès.
    try {
      if(legacyPracticeRaw!==null)storage.removeItem(OLD_PRACTICE_KEY);
      if(legacyExamsRaw!==null)storage.removeItem(OLD_EXAMS_KEY);
    }catch{/* Les anciennes clés ne servent plus ; ne pas annuler la sauvegarde. */}
    return copy(current);
  }
  function verified(){if(isStale())throw new StaleDataError();return copy(current);}
  return {
    snapshot:verified,
    isStale,
    refresh(){
      const value=storage.getItem(DATA_KEY);
      if(value===null)throw new InvalidStorageError("La sauvegarde unifiée a disparu ; recharge la page pour la récupérer.");
      const normalized=normalizeBundle(parse(value,"unifiées"),knownIds);
      current=normalized;fingerprint=value;
      return copy(current);
    },
    updatePractice(practice){
      if(!practice||practice.version!==emptyState().version)throw new InvalidStorageError("Suivi non compatible");
      return save({...current,practice:sanitizeState(practice,knownIds)});
    },
    updateExams(exams){
      if(!exams||exams.version!==emptyExamStore().version)throw new InvalidStorageError("Copies non compatibles");
      return save({...current,exams:sanitizeExamStore(exams)});
    },
    replaceAll(practice,exams){
      // La vérification complète précède l'écriture atomique.
      const cleanPractice=sanitizeState(practice,knownIds);
      const cleanExams=sanitizeExamStore(exams);
      return save({practice:cleanPractice,exams:cleanExams});
    },
    storageKey:DATA_KEY
  };
}

/** Repli fonctionnel privé : les données seront perdues au rechargement. */
export function createVolatileStorage(){
  const data=new Map();
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>{data.set(key,String(value));},
    removeItem:key=>{data.delete(key);}
  };
}
