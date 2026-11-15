import assert from "node:assert/strict";
import {chromium} from "playwright";
const BASE=process.env.TEST_BASE_URL||"http://127.0.0.1:8000";
const HOST="https://xxypyvzkciowwseldxhq.supabase.co";
const user="00000000-1111-4222-8333-444444444444",email="eleve@example.fr";
let row=null,posts=0,patches=0;
const responses={
 "Access-Control-Allow-Origin":"*",
 "Access-Control-Allow-Headers":"apikey,authorization,content-type,prefer",
 "Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS",
 "Content-Type":"application/json"
};
const reply=async(route,status,json)=>route.fulfill({status,headers:responses,body:JSON.stringify(json)});
async function mockSupabase(route){
 const req=route.request(),url=new URL(req.url());
 if(req.method()==="OPTIONS"){await route.fulfill({status:204,headers:responses});return;}
 if(url.pathname==="/auth/v1/signup"){
   await reply(route,200,{user:{id:user,email},session:null});
   return;
 }
 if(url.pathname.startsWith("/auth/v1/token")){
   await reply(route,200,{access_token:"test-token",refresh_token:"test-refresh",
     expires_in:3600,user:{id:user,email}});
   return;
 }
 if(url.pathname==="/rest/v1/daeu_b_progress"){
   if(req.method()==="GET"){await reply(route,200,row?[structuredClone(row)]:[]);return;}
   if(req.method()==="POST"){
     posts++;
     if(row){await reply(route,409,{});return;}
     row=JSON.parse(req.postData());
     await reply(route,201,[structuredClone(row)]);
     return;
   }
   if(req.method()==="PATCH"){
     patches++;
     const revision=Number(url.searchParams.get("revision")?.replace("eq.",""));
     if(row?.revision!==revision){await reply(route,200,[]);return;}
     Object.assign(row,JSON.parse(req.postData()));
     await reply(route,200,[{revision:row.revision}]);
     return;
   }
 }
 if(url.pathname==="/auth/v1/logout"){await reply(route,204,{});return;}
 throw Error("Appel cloud non simulé : "+req.method()+" "+url.pathname);
}
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=()=>browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"});
const a=await context(),b=await context();
try{
 const first=await a.newPage();
 await first.route(HOST+"/**",mockSupabase);
 await first.goto(BASE+"/?saisie=clavier",{waitUntil:"networkidle"});
 await first.locator("#firstStart").click();
 await first.locator("#unknownButton").click();
 await first.waitForFunction(()=>Number(document.querySelector("#attempted")?.textContent)>0);
 const expected=await first.evaluate(async()=>{
   const [{DATA_KEY,createPersistence},{backedStorage},{startExam,finishExam,addHistory,updateReviewTarget},{changeWork,encodeStroke}] =
     await Promise.all(["persistence","auto-backup","exam-engine","workbook"].map(name=>import("./"+name+".mjs")));
   const saved=JSON.parse(localStorage.getItem(DATA_KEY));
   const ids=new Set([...Object.keys(saved.practice.items),...saved.round.ids]);
   const adapter=createPersistence(backedStorage(localStorage),ids);
   const started=Date.now()-60_000,examId="blanc-1";
   const copy=finishExam(startExam(examId,started,null,true),started+30_000);
   const exams=updateReviewTarget(addHistory(saved.exams,copy),examId,started,"a-analyse:domain",true);
   const key="exam:"+examId+":"+started+":a-analyse";
   const workbook=changeWork(saved.workbook,key,{text:"",pages:[[encodeStroke([[40,60],[80,100],[90,40]])]]});
   const next=adapter.replaceAll(saved.practice,exams,saved.round,saved.transfers,workbook);
   return {key,entry:next.workbook.entries[key],targets:next.exams.history.at(-1).reviewTargets};
 });
 await first.reload({waitUntil:"networkidle"});
 assert.equal(posts,0,"Aucune donnée envoyée sans connexion explicite");
 await first.locator("#cloudEmail").fill(email);
 await first.locator("#cloudPassword").fill("motdepassefort");
 await first.locator("#cloudRegister").click();
 assert.equal(await first.locator("#cloudSubmit").textContent(),"Créer mon accès");
 await first.locator("#cloudSubmit").click();
 await first.waitForFunction(()=>document.querySelector("#cloudStatus")?.textContent.includes("E-mail envoyé"));
 console.log("OK Inscription sécurisée : confirmation d'e-mail demandée");
 await first.locator("#cloudRegister").click();
 await first.locator("#cloudSubmit").click();
 await first.waitForFunction(()=>document.querySelector("#cloudStatus")?.textContent.includes("synchronisée"));
 assert.equal(posts,1,"La progression locale a été envoyée dès la première connexion");
 assert.ok(Object.keys(row.payload.practice.items).length>0);
 assert.ok(await first.locator("#cloudCredentials").isHidden(),"Formulaire masqué après connexion");
 assert.ok(await first.locator("#cloudSigned").isVisible(),"Compte reconnu");
 console.log("OK Première connexion et création cloud privée, sans export");
 const second=await b.newPage();
 await second.route(HOST+"/**",mockSupabase);
 await second.goto(BASE+"/?saisie=clavier",{waitUntil:"networkidle"});
 assert.equal(await second.locator("#attempted").textContent(),"0");
 await second.locator("#cloudEmail").fill(email);
 await second.locator("#cloudPassword").fill("motdepassefort");
 await second.locator("#cloudSubmit").click();
 await second.waitForFunction(()=>Number(document.querySelector("#attempted")?.textContent)>0,null,{timeout:14000});
 assert.equal(await second.locator("#attempted").textContent(),
   await first.locator("#attempted").textContent());
 assert.equal(posts,1,"Le téléphone secondaire doit télécharger, pas écraser la copie distante");
 const adopted=await second.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
 assert.ok(adopted.practice.items&&Object.keys(adopted.practice.items).length>0);
 assert.deepEqual(adopted.workbook.entries[expected.key],expected.entry);
 assert.deepEqual(adopted.exams.history.at(-1).reviewTargets,expected.targets);
 console.log("OK Deux profils Chromium, réseau simulé : réponse, copie et révision restaurées sans fichier JSON");
 // Ajouter un nouveau résultat sur le premier téléphone ; il doit être envoyé
 // par le listener de la sauvegarde principale, sans bouton « enregistrer ».
 await first.locator("#unknownButton").click();
 await first.waitForFunction(()=>document.querySelector("#cloudStatus")?.textContent.includes("synchronisée"));
 assert.ok(patches>=1,"Modifications propagées automatiquement par PATCH conditionnel");
 assert.equal(row.revision,2);
 console.log("OK Nouvelle réponse : sauvegarde distante automatique et révision conditionnelle");
}finally{await a.close();await b.close();await browser.close();}
