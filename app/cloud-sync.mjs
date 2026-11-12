/**
 * Synchronisation privée du DAEU B par Supabase Auth + PostgREST (sans SDK).
 * Sécurité : clé PUBLIABLE seulement, RLS en base, HTTPS, CAS sur revision.
 * Les conflits ne sont jamais résolus par une écriture silencieuse.
 */
import {DATA_KEY} from "./persistence.mjs";
import {parseValidatedBundle,backedStorage,flushAutoBackup} from "./auto-backup.mjs";

export const CLOUD_URL="https://xxypyvzkciowwseldxhq.supabase.co";
export const CLOUD_KEY="sb_publishable_NimmaIaGu7fQbT356QkxWQ_R91HHhBf";
export const CLOUD_SESSION_KEY="daeu-b-cloud-session-v1";
export const CLOUD_BASE_KEY="daeu-b-cloud-base-v1";
const TABLE="/rest/v1/daeu_b_progress";
const HEADERS={"apikey":CLOUD_KEY,"Content-Type":"application/json"};
const MAX_BODY=1_000_000;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let session=null,knownIds=null,storage=null,base=null,conflict=null;
let onChange=()=>{},onRestore=()=>{},status="déconnecté",busy=false,pending=false,timer=null,queue=Promise.resolve();
const clone=value=>JSON.parse(JSON.stringify(value));
function report(label){status=label;try{onChange(label);}catch{}}
export function cloudStatus(){return status;}
export function cloudUser(){return session?.user?.email??null;}
export function cloudConflict(){return !!conflict;}
export function cloudEnabled(){return !!session;}
function jsonTry(value){try{return JSON.parse(value);}catch{return null;}}
const validEmail=email=>typeof email==="string"&&email.trim().length<=254&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
function normalizeSession(data){
  if(!data||typeof data.access_token!=="string"||typeof data.refresh_token!=="string"
    ||!UUID.test(data.user?.id)||!Number.isFinite(data.expires_in)||data.expires_in<1)
    throw Error("Session de connexion invalide");
  return {access_token:data.access_token,refresh_token:data.refresh_token,
    expires_at:Date.now()+data.expires_in*1000,user:{id:data.user.id,email:data.user.email??""}};
}
function storeSession(next){
  session=next;
  if(next)storage.setItem(CLOUD_SESSION_KEY,JSON.stringify(next));
  else storage.removeItem(CLOUD_SESSION_KEY);
}
function saveBase(localRevision,remoteRevision){
  base={userId:session.user.id,localRevision,remoteRevision};
  storage.setItem(CLOUD_BASE_KEY,JSON.stringify(base));
}
export function decideSync(local,remote,marker,userId){
  // Ne jamais transférer les données d'un utilisateur précédent.
  const own=marker?.userId===userId?marker:null;
  if(!remote)return "upload-initial";
  if(!local)return "download";
  if(own&&local.revision===own.localRevision&&remote.revision===own.remoteRevision)return "synced";
  if(own&&local.revision===own.localRevision)return "download";
  if(own&&remote.revision===own.remoteRevision)return "upload";
  return "conflict";
}
async function request(path,{method="GET",body,token=session?.access_token,prefer,query=""}={}){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),13000);
  try{
    const response=await fetch(CLOUD_URL+path+query,{
      method,headers:{...HEADERS,...(token?{Authorization:"Bearer "+token}:{}),...(prefer?{Prefer:prefer}:{})},
      ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal,
      cache:"no-store"
    });
    let data=null;
    try{data=await response.json();}catch{}
    if(!response.ok){
      const error=new Error(response.status===401?"Session expirée ou connexion non autorisée":
        response.status===409?"Conflit de version serveur":
        "Service indisponible (HTTP "+response.status+")");
      error.status=response.status;throw error;
    }
    return data;
  }finally{clearTimeout(timeout);}
}
async function refreshSession(){
  if(!session)return false;
  if(session.expires_at>Date.now()+60_000)return true;
  try{
    const response=await request("/auth/v1/token?grant_type=refresh_token",{
      method:"POST",body:{refresh_token:session.refresh_token},token:null});
    storeSession(normalizeSession(response));return true;
  }catch{
    storeSession(null);report("session-expirée");return false;
  }
}
async function readRemote(){
  const response=await request(TABLE,{query:"?select=user_id,revision,payload&user_id=eq."+encodeURIComponent(session.user.id)+"&limit=1"});
  if(!Array.isArray(response)||response.length>1)throw Error("Réponse cloud invalide");
  const row=response[0]??null;
  if(row&&(row.user_id!==session.user.id||!Number.isSafeInteger(row.revision)||row.revision<1
    ||!parseValidatedBundle(JSON.stringify(row.payload),knownIds)))
    throw Error("Copie cloud incompatible ou endommagée");
  return row;
}
function localSnapshot(){
  return parseValidatedBundle(storage.getItem(DATA_KEY),knownIds);
}
function localEmpty(local){
  return !local||local.revision===0
    &&!Object.keys(local.practice.items).length&&!Object.keys(local.transfers.items).length
    &&!local.exams.active&&!local.exams.history.length&&!local.round;
}
async function adoptRemote(row){
  const remote=parseValidatedBundle(JSON.stringify(row.payload),knownIds);
  if(!remote)throw Error("Copie distante invalide");
  const old=localSnapshot();
  // Une révision locale monotone interdit qu'une copie IndexedDB périmée
  // prenne le dessus à l'ouverture suivante.
  const next={...remote,revision:Math.max(old?.revision||0,remote.revision)+1};
  const raw=JSON.stringify(next);
  if(raw.length>MAX_BODY)throw Error("Copie distante trop volumineuse");
  const safe=backedStorage(storage);
  safe.setItem(DATA_KEY,raw);
  await flushAutoBackup();
  saveBase(next.revision,row.revision);
  report("récupéré");
  onRestore();
}
async function createRemote(local){
  const result=await request(TABLE,{method:"POST",prefer:"return=representation",
    body:{user_id:session.user.id,payload:local,revision:1}});
  if(!Array.isArray(result)||result.length!==1||result[0].revision!==1)
    throw Error("Confirmation du premier enregistrement absente");
  saveBase(local.revision,1);report("synchronisé");
}
async function updateRemote(local,version){
  const response=await request(TABLE,{method:"PATCH",prefer:"return=representation",
    query:"?user_id=eq."+encodeURIComponent(session.user.id)+"&revision=eq."+version+"&select=revision",
    body:{payload:local,revision:version+1,updated_at:new Date().toISOString()}});
  if(!Array.isArray(response))throw Error("Accusé serveur invalide");
  if(response.length!==1||response[0].revision!==version+1){
    report("conflit");conflict={};return false;
  }
  saveBase(local.revision,version+1);report("synchronisé");return true;
}
async function reconcile(){
  if(!session||!await refreshSession())return;
  const local=localSnapshot(),remote=await readRemote();
  const decision=decideSync(local,remote,base,session.user.id);
  // Un navigateur neuf peut récupérer la copie sans risque. Un navigateur
  // avec des données non synchronisées demande l'accord explicite.
  if(remote&&localEmpty(local)&&!base){await adoptRemote(remote);return;}
  if(decision==="synced"){conflict=null;report("synchronisé");return;}
  if(decision==="download"){await adoptRemote(remote);conflict=null;return;}
  if(decision==="upload-initial"){
    await createRemote(local||defaultBundle());conflict=null;return;
  }
  if(decision==="upload"){
    if(await updateRemote(local,remote.revision))conflict=null;
    return;
  }
  conflict={remote,local};
  report("conflit");
}
function defaultBundle(){
  // Aucun bundle local : demander une saisie / une copie initiale valide
  // plutôt que publier un faux objet vide.
  throw Error("Aucune progression locale à publier");
}
async function syncQueue(){
  if(busy||!session||conflict)return;
  busy=true;
  try{await reconcile();}
  catch(e){report(e.status===401?"session-expirée":"en-attente-réseau");}
  finally{busy=false;}
}
export function queueCloudWrite(){
  if(!session||conflict)return;
  pending=true;
  if(timer!==null)clearTimeout(timer);
  report("en-cours");
  timer=setTimeout(()=>{
    timer=null;
    if(!pending)return;
    pending=false;
    queue=queue.then(syncQueue,syncQueue);
  },750);
}
export async function flushCloudSync(){
  if(timer!==null){clearTimeout(timer);timer=null;pending=false;queue=queue.then(syncQueue,syncQueue);}
  await queue;
}
export async function initCloudSync(localStorageObject,ids,{onRestored=()=>{}}={}){
  storage=localStorageObject;knownIds=ids;onRestore=onRestored;
  const candidate=jsonTry(storage.getItem(CLOUD_SESSION_KEY));
  const metadata=jsonTry(storage.getItem(CLOUD_BASE_KEY));
  base=metadata?.userId===candidate?.user?.id?metadata:null;
  if(candidate?.user?.id&&UUID.test(candidate.user.id)&&candidate.refresh_token&&candidate.access_token){
    session=candidate;
    try{await reconcile();}
    catch{report("en-attente-réseau");}
  }else report("déconnecté");
  return {signedIn:!!session,status};
}
export function subscribeCloudStatus(callback){
  onChange=typeof callback==="function"?callback:()=>{};
  onChange(status);
}
export async function signInCloud(email,password,{register=false}={}){
  if(!validEmail(email)||typeof password!=="string"||password.length<8||password.length>200)
    throw Error("Adresse e-mail ou mot de passe invalide (8 caractères minimum)");
  const cleanEmail=email.trim().toLowerCase();
  const data=await request(register?"/auth/v1/signup":"/auth/v1/token?grant_type=password",{
    method:"POST",token:null,body:{email:cleanEmail,password}
  });
  if(!data?.access_token){
    if(register){report("confirmation-email");return "confirmation-email";}
    throw Error("Connexion non confirmée");
  }
  storeSession(normalizeSession(data));
  const marker=jsonTry(storage.getItem(CLOUD_BASE_KEY));
  base=marker?.userId===session.user.id?marker:null;
  await syncQueue();
  return status;
}
export async function signOutCloud(){
  if(session){try{await request("/auth/v1/logout",{method:"POST"});}catch{}}
  storeSession(null);base=null;conflict=null;
  storage.removeItem(CLOUD_BASE_KEY);report("déconnecté");
}
export async function resolveCloudConflict(choice){
  if(!conflict||!session)throw Error("Aucun conflit à résoudre");
  if(!["cloud","device"].includes(choice))throw Error("Choix de résolution invalide");
  const {remote}=conflict;
  if(!remote)throw Error("Version distante à récupérer");
  const fresh=await readRemote();
  if(fresh.revision!==remote.revision){
    conflict={remote:fresh,local:localSnapshot()};
    report("conflit");throw Error("La copie distante a changé. Actualise et recommence.");
  }
  if(choice==="cloud"){
    await adoptRemote(fresh);
    conflict=null;return "récupéré";
  }
  const local=localSnapshot();
  if(!local)throw Error("Aucune copie locale valide");
  const ok=await updateRemote(local,fresh.revision);
  if(ok)conflict=null;
  return ok?"synchronisé":"conflit";
}
export function initCloudInterface(){
  const form=document.getElementById("cloudForm");
  if(!form)return;
  const statusNode=document.getElementById("cloudStatus");
  const conflictNode=document.getElementById("cloudConflict");
  const fields=document.getElementById("cloudCredentials");
  const signed=document.getElementById("cloudSigned");
  const submit=document.getElementById("cloudSubmit");
  const textStatus={
    "déconnecté":"Synchronisation cloud désactivée. Tes copies locales restent enregistrées.",
    "confirmation-email":"E-mail envoyé : confirme ton adresse depuis ta messagerie, puis reconnecte-toi ici.",
    "synchronisé":"Progression synchronisée et accessible après connexion sur un autre appareil.",
    "récupéré":"Progression retrouvée sur le cloud et restaurée sur cet appareil.",
    "conflit":"Deux progressions différentes détectées. Choisis celle à conserver ; rien n'est écrasé.",
    "en-cours":"Enregistrement dans le cloud en cours…",
    "en-attente-réseau":"Hors connexion ou service indisponible : les copies locales restent enregistrées. La synchronisation réessaiera.",
    "session-expirée":"Connexion expirée : reconnecte-toi pour reprendre la synchronisation."
  };
  function render(next){
    const logged=cloudEnabled();
    fields.hidden=logged;signed.hidden=!logged;conflictNode.hidden=!cloudConflict();
    document.getElementById("cloudAccount").textContent=cloudUser()??"";
    statusNode.textContent=textStatus[next]??next;
  }
  subscribeCloudStatus(render);
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    submit.disabled=true;
    try{
      await signInCloud(document.getElementById("cloudEmail").value,
        document.getElementById("cloudPassword").value,{register:submit.dataset.mode==="register"});
      render(cloudStatus());
    }catch(e){statusNode.textContent="Connexion impossible : "+e.message;}
    finally{submit.disabled=false;}
  });
  document.getElementById("cloudRegister").addEventListener("click",()=>{
    submit.dataset.mode=submit.dataset.mode==="register"?"login":"register";
    submit.textContent=submit.dataset.mode==="register"?"Créer mon accès":"Me connecter";
    document.getElementById("cloudRegister").textContent=submit.dataset.mode==="register"?
      "J'ai déjà un compte":"Créer un compte";
  });
  document.getElementById("cloudSignOut").addEventListener("click",()=>signOutCloud());
  document.getElementById("cloudUseCloud").addEventListener("click",()=>{
    if(!confirm("Remplacer la progression de cet appareil par celle du cloud ? La progression locale différente ne sera plus accessible."))return;
    resolveCloudConflict("cloud").catch(e=>{statusNode.textContent=e.message;});
  });
  document.getElementById("cloudUseDevice").addEventListener("click",()=>{
    if(!confirm("Remplacer la copie cloud par la progression de cet appareil ? Cela affectera les autres appareils lors de leur prochaine synchronisation."))return;
    resolveCloudConflict("device").catch(e=>{statusNode.textContent=e.message;});
  });
  window.addEventListener("online",()=>{queue=queue.then(syncQueue,syncQueue);});
  window.addEventListener("focus",()=>{queue=queue.then(syncQueue,syncQueue);});
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible")queue=queue.then(syncQueue,syncQueue);
    else if(session)void flushCloudSync();
  });
}
