import test from "node:test";
import assert from "node:assert/strict";
import {TOPICS} from "./questions.mjs";
import {injectVariants} from "./variants.mjs";
import {flatten,emptyState,recordAnswer} from "./engine.mjs";
import {DATA_KEY,createPersistence,createVolatileStorage} from "./persistence.mjs";
import {decideSync,initCloudSync,signInCloud,cloudConflict,cloudStatus,resolveCloudConflict,
  queueCloudWrite,flushCloudSync,CLOUD_SESSION_KEY,CLOUD_BASE_KEY} from "./cloud-sync.mjs";
import {backedStorage,flushAutoBackup} from "./auto-backup.mjs";
const ids=new Set(flatten(injectVariants(TOPICS)).map(q=>q.id));
const uid="aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",email="eleve@example.org";
const bundle=(n=1)=>{
 const mem=createVolatileStorage(),store=createPersistence(mem,ids);
 for(let i=0;i<n;i++)store.updatePractice(emptyState());
 return JSON.parse(mem.getItem(DATA_KEY));
};
const response=(status,data)=>({ok:status>=200&&status<300,status,async json(){return data;}});
function fakeApi(){
 let row=null,postCount=0,patchCount=0,reads=0;
 const original=globalThis.fetch;
 globalThis.fetch=async (url,options={})=>{
   const path=new URL(url).pathname;
   if(path==="/auth/v1/token")return response(200,{access_token:"jwt"+uid,
     refresh_token:"refresh",expires_in:3600,user:{id:uid,email}});
   if(path==="/auth/v1/logout")return response(204,null);
   if(path==="/rest/v1/daeu_b_progress"){
     if(options.method==="POST"){
       postCount++;
       if(row)return response(409,{});
       row=structuredClone(JSON.parse(options.body));
       return response(201,[row]);
     }
     if(options.method==="PATCH"){
       patchCount++;
       const requested=Number(new URL(url).searchParams.get("revision").replace("eq.",""));
       if(!row||row.revision!==requested)return response(200,[]);
       Object.assign(row,structuredClone(JSON.parse(options.body)));
       return response(200,[{revision:row.revision}]);
     }
     reads++;
     return response(200,row?[structuredClone(row)]:[]);
   }
   throw Error("Requête imprévue : "+path);
 };
 return {
   get row(){return row;},set row(value){row=value;},
   get reads(){return reads;},get postCount(){return postCount;},get patchCount(){return patchCount;},
   close(){globalThis.fetch=original;}
 };
}
test("Décisions à versions indépendantes : lecture, écriture, conflit et absence",()=>{
 const user="u",local={revision:2},remote={revision:5},marker={userId:user,localRevision:2,remoteRevision:5};
 assert.equal(decideSync(null,null,null,user),"empty");
 assert.equal(decideSync(local,null,null,user),"upload-initial");
 assert.equal(decideSync(null,remote,null,user),"download");
 assert.equal(decideSync(local,remote,null,user),"conflict");
 assert.equal(decideSync(local,remote,marker,user),"synced");
 assert.equal(decideSync({...local,revision:3},remote,marker,user),"upload");
 assert.equal(decideSync(local,{...remote,revision:6},marker,user),"download");
 assert.equal(decideSync({...local,revision:3},{...remote,revision:6},marker,user),"conflict");
 assert.equal(decideSync(local,remote,{...marker,userId:"autre"},user),"conflict");
});
test("Compte sans progression : première réponse enregistrée automatiquement dans le cloud",async()=>{
 const api=fakeApi();
 try{
   const mem=createVolatileStorage();
   await initCloudSync(mem,ids);
   assert.equal(await signInCloud(email,"12345678"),"en-attente-première-réponse");
   const persistence=createPersistence(backedStorage(mem),ids);
   const first=recordAnswer(emptyState(),[...ids][0],true,Date.UTC(2026,10,12));
   persistence.updatePractice(first);
   await flushCloudSync();
   assert.equal(api.postCount,1);
   assert.equal(api.row.payload.practice.items[[...ids][0]].attempts,1);
   assert.equal(cloudStatus(),"synchronisé");
   assert.equal(JSON.parse(mem.getItem(CLOUD_BASE_KEY)).remoteRevision,1);
 }finally{api.close();}
});
test("Un téléphone neuf récupère les données cloud à la connexion sans fichier JSON",async()=>{
 const api=fakeApi();
 try{
   const remote=bundle(4);
   api.row={user_id:uid,revision:7,payload:remote};
   const mem=createVolatileStorage();
   let restored=0;
   await initCloudSync(mem,ids,{onRestored:()=>restored++});
   assert.equal(await signInCloud(email,"12345678"),"récupéré");
   assert.equal(restored,1);
   assert.equal(createPersistence(mem,ids).snapshot().practice.version,2);
   assert.equal(createPersistence(mem,ids).snapshot().revision,remote.revision+1);
   assert.equal(api.patchCount,0);
 }finally{api.close();}
});
test("Deux appareils éditent le même compte : refus d'écrasement silencieux",async()=>{
 const api=fakeApi();
 try{
   const initial=bundle(2);
   const mem=createVolatileStorage();mem.setItem(DATA_KEY,JSON.stringify(initial));
   await initCloudSync(mem,ids);
   assert.equal(await signInCloud(email,"12345678"),"synchronisé");
   const changed=createPersistence(backedStorage(mem),ids);
   changed.updatePractice(emptyState());
   api.row={user_id:uid,revision:2,payload:{...initial,revision:44}};
   await flushCloudSync();
   assert.equal(cloudConflict(),true);
   assert.equal(cloudStatus(),"conflit");
   assert.equal(api.row.revision,2);
   assert.equal(api.patchCount,0);
   assert.equal(await resolveCloudConflict("device"),"synchronisé");
   assert.equal(api.row.revision,3);
   assert.equal(api.row.payload.revision,3);
 }finally{api.close();}
});
