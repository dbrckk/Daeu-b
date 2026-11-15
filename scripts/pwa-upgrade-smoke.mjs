import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {createServer} from "node:http";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {extname,join,resolve,sep} from "node:path";

const BASELINE="4eab6a6f567429638f2ca3d61dcddbc31bf037e1";
const DATA_KEY="daeu-b-data-v1";
const MIME={".html":"text/html",".mjs":"text/javascript",".js":"text/javascript",
  ".css":"text/css",".json":"application/json",".md":"text/plain",".svg":"image/svg+xml"};

export async function verifyPwaUpgrade(browser){
  const oldRoot=await mkdtemp(join(tmpdir(),"daeu-v62-"));
  const newRoot=resolve("app");
  const releasePages={"./":"index.html","./index.html":"index.html","./course.html":"course.html"};
  const updatedHtml=new Map();
  for(const name of new Set(Object.values(releasePages))){
    const html=await readFile(join(newRoot,name),"utf8");
    updatedHtml.set(name,html.replace(/id="appVersion">\d+/,'id="appVersion">Suivante'));
  }
  try{
    try{execFileSync("git",["cat-file","-e",BASELINE+"^{commit}"],{stdio:"ignore"});}
    catch{execFileSync("git",["fetch","--no-tags","--depth=1","origin",BASELINE],{stdio:"inherit"});}
    const archive=execFileSync("git",["archive",BASELINE,"app"],{maxBuffer:16*1024*1024});
    execFileSync("tar",["-xf","-","-C",oldRoot],{input:archive});
    let root=join(oldRoot,"app");
    let nextRelease=false,staleAsset=false;
    const server=createServer(async(req,res)=>{
      const pathname=new URL(req.url,"http://127.0.0.1").pathname;
      const path=resolve(root,"."+ (pathname==="/"?"/index.html":pathname));
      if(!path.startsWith(root+sep)){res.writeHead(404).end();return;}
      try{
        let bytes=await readFile(path);
        if(staleAsset&&pathname==="/equation-ink.mjs")bytes=await readFile(join(oldRoot,"app/equation-ink.mjs"));
        if(nextRelease&&root===newRoot&&pathname==="/sw.js"){
          bytes=bytes.toString().replace(/const CACHE="([^"]+)"/,'const CACHE="$1-smoke"')
            .replace(/const INTEGRITY=(\{[\s\S]*?\});/,(_,data)=>{
              const manifest=JSON.parse(data);
              for(const [asset,name] of Object.entries(releasePages)){
                manifest[asset]="sha256-"+createHash("sha256").update(updatedHtml.get(name)).digest("base64");
              }
              return "const INTEGRITY="+JSON.stringify(manifest)+";";
            });
        }else if(nextRelease&&root===newRoot&&updatedHtml.has(pathname==="/"? "index.html":pathname.slice(1))){
          bytes=updatedHtml.get(pathname==="/"? "index.html":pathname.slice(1));
        }
        res.writeHead(200,{"Content-Type":(MIME[extname(path)]??"application/octet-stream"),"Cache-Control":"no-store"});
        res.end(bytes);
      }catch{res.writeHead(404).end();}
    });
    await new Promise((ok,fail)=>server.once("error",fail).listen(0,"127.0.0.1",ok));
    try{
      const origin="http://127.0.0.1:"+server.address().port;
      const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
      try{
        const page=await context.newPage();
        await page.goto(origin,{waitUntil:"networkidle"});
        await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
        assert.ok(await page.evaluate(async()=>(await caches.keys()).includes("daeu-b-maths-v62")));
        await page.locator("#examStart").click();
        const canvas=page.locator("#examNotebook canvas");
        await canvas.scrollIntoViewIfNeeded();
        const point=await canvas.evaluate(el=>{
          const box=el.getBoundingClientRect(),view=el.closest(".math-notebook-sheet-viewport").getBoundingClientRect();
          return {x:Math.max(box.x,view.x)+40,y:Math.max(box.y,view.y)+40};
        });
        assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,point),"CANVAS");
        await page.mouse.move(point.x,point.y);
        await page.mouse.down();
        await page.mouse.move(point.x+70,point.y+26,{steps:12});
        await page.mouse.up();
        const snapshot=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),DATA_KEY);
        const before=await snapshot();
        const [entry]=Object.values(before.workbook.entries);
        assert.equal(entry?.pages[0].length,1);
        const nextWorker=await readFile(join(newRoot,"sw.js"),"utf8");
        const nextCache=nextWorker.match(/const CACHE="([^"]+)"/)?.[1];
        assert.ok(nextCache&&nextCache!=="daeu-b-maths-v62");
        root=newRoot;
        staleAsset=true;
        await page.evaluate(async()=>{
          const registration=await navigator.serviceWorker.getRegistration();
          const previous=navigator.serviceWorker.controller;
          const failed=new Promise(resolve=>registration.addEventListener("updatefound",()=>{
            const candidate=registration.installing;
            if(candidate.state==="redundant")resolve();
            else candidate.addEventListener("statechange",()=>{
              if(candidate.state==="redundant")resolve();
            });
          },{once:true}));
          await registration.update();
          await failed;
          if(navigator.serviceWorker.controller!==previous)throw new Error("Le cache actif a changé");
        });
        assert.deepEqual(await page.evaluate(()=>caches.keys()),["daeu-b-maths-v62"]);
        assert.deepEqual(await snapshot(),before,"Une ressource périmée ne modifie pas la copie");
        staleAsset=false;
        console.log("OK Réponse HTTP 200 périmée rejetée, cache et copie précédents conservés");
        await page.evaluate(async()=>{
          const registration=await navigator.serviceWorker.getRegistration();
          const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener("controllerchange",resolve,{once:true}));
          await registration.update();
          await changed;
        });
        await page.waitForFunction(async cache=>{
          const names=await caches.keys();
          return names.includes(cache)&&!names.includes("daeu-b-maths-v62");
        },nextCache);
        assert.deepEqual(await snapshot(),before,"La mise à jour ne modifie pas la copie ouverte");
        await context.setOffline(true);
        await page.reload({waitUntil:"domcontentloaded"});
        await page.locator("#examActive.paper-exam-active").waitFor({state:"visible"});
        assert.deepEqual(await snapshot(),before,"La version actuelle rouvre la copie v62 hors ligne");
        await page.locator("#examFormulaOpen").waitFor({state:"visible"});
        await page.locator("#examFormulaOpen").focus();
        await page.keyboard.press("Enter");
        await page.locator("#examFormula math").first().waitFor({state:"visible"});
        await page.keyboard.press("Escape");
        assert.ok(await page.locator("#examFormula").isHidden());
        assert.equal(await page.evaluate(()=>document.activeElement?.id),"examFormulaOpen");
        const version=page.locator("#appVersion");
        const displayed=await version.textContent();
        assert.match(nextCache,new RegExp("-v"+displayed+"$"));
        await context.setOffline(false);
        const coursePage=await context.newPage();
        await coursePage.goto(origin+"/course.html",{waitUntil:"domcontentloaded"});
        const update=coursePage.locator("#appUpdate");
        await update.waitFor();
        await coursePage.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
        nextRelease=true;
        await update.click();
        await coursePage.getByRole("button",{name:"Ouvrir la nouvelle version"}).waitFor();
        assert.equal(await version.textContent(),displayed,"Aucun rechargement forcé pendant une copie");
        assert.deepEqual(await snapshot(),before);
        await update.click();
        await coursePage.waitForFunction(()=>document.getElementById("appVersion")?.textContent==="Suivante");
        await page.reload({waitUntil:"domcontentloaded"});
        await page.locator("#examActive.paper-exam-active").waitFor({state:"visible"});
        assert.equal(await version.textContent(),"Suivante");
        assert.deepEqual(await snapshot(),before,"La recharge demandée préserve la copie");
        console.log("OK Version affichée et mise à jour à la demande, copie conservée");
        console.log("OK Mise à niveau du cache v62, reprise hors ligne et retour clavier à la copie");
      }finally{await context.close();}
    }finally{await new Promise(ok=>server.close(ok));}
  }finally{await rm(oldRoot,{recursive:true,force:true});}
}
