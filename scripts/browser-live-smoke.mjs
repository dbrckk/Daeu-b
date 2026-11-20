import assert from "node:assert/strict";
import {chromium} from "playwright";

const BASE=process.env.TEST_BASE_URL||"https://daeu-b-maths-dbrckk.onrender.com";
const startUrl=new URL("/#commencer",BASE).href;
const examUrl=new URL("/#exam-title",BASE).href;
const readCopy=page=>page.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1"))?.exams.active);
const remainingSeconds=text=>text.split(":").reduce((total,part)=>total*60+Number(part),0);
const justification="x ≠ 1, car le dénominateur x−1 doit rester non nul.";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
  const context=await browser.newContext({viewport:{width:320,height:720},isMobile:true,hasTouch:true,locale:"fr-FR"});
  context.setDefaultTimeout(25_000);
  context.setDefaultNavigationTimeout(45_000);
  const page=await context.newPage();
  await page.goto(startUrl,{waitUntil:"domcontentloaded"});
  const version=await page.locator("#appVersion").textContent();
  assert.match(version,/^\d+$/);
  await page.waitForFunction(async version=>Boolean(navigator.serviceWorker.controller)
    &&(await caches.keys()).includes("daeu-b-maths-v"+version),version,{timeout:80_000});
  await page.locator('#examSelect option[value="blanc-2"]').waitFor({state:"attached"});
  await page.getByRole("button",{name:"Démarrer mon diagnostic"}).press("Enter");
  await page.locator("#answerForm").waitFor();

  await page.locator("#examSelect").selectOption("blanc-2");
  await page.locator("#examStart").press("Enter");
  await page.locator("#exam-answer-b01").fill("5");
  await page.locator("#examNotes").fill(justification);
  await page.locator("#examNext").press("Enter");
  await page.locator("#exam-answer-b05").fill("12");
  const before=await readCopy(page);
  const remaining=remainingSeconds(await page.locator("#examTimer").textContent());
  assert.equal(before.examId,"blanc-2");
  assert.equal(before.sectionIndex,1);
  assert.deepEqual(before.answers,{b01:"5",b05:"12"});
  assert.deepEqual(before.notes,{"b-fonction":justification});
  assert.equal(before.deadlineAt-before.startedAt,10_800_000);

  console.log("Diagnostic du cache",await page.evaluate(async version=>{
    const cache=await caches.open("daeu-b-maths-v"+version);
    const hit=await cache.match(new URL("./index.html",location.href));
    const bypass=await cache.match(new URL("./index.html",location.href),{ignoreVary:true});
    return {controller:navigator.serviceWorker.controller?.scriptURL,
      shell:hit?.url,ignoreVary:bypass?.url,redirected:bypass?.redirected,vary:bypass?.headers.get("vary")};
  },version));
  const probe=await context.newPage();
  const response=await probe.goto(examUrl,{waitUntil:"domcontentloaded"});
  console.log("Navigation en ligne servie par le service worker",response?.fromServiceWorker());
  await probe.close();
  await page.close();
  const reopened=await context.newPage();
  await context.setOffline(true);
  await reopened.goto(examUrl,{waitUntil:"domcontentloaded"});
  await reopened.locator("#exam-answer-b05").waitFor();
  assert.equal(await reopened.locator("#appVersion").textContent(),version);
  assert.equal(await reopened.locator("#exam-answer-b05").inputValue(),"12");
  assert.deepEqual(await readCopy(reopened),before);
  await reopened.waitForFunction(({deadline,remaining})=>{
    const value=document.getElementById("examTimer").textContent
      .split(":").reduce((total,part)=>total*60+Number(part),0);
    return value>0 && value<remaining && Math.abs(value-Math.ceil((deadline-Date.now())/1000))<=2;
  },{deadline:before.deadlineAt,remaining});
  await reopened.locator("#examPrev").press("Enter");
  assert.equal(await reopened.locator("#exam-answer-b01").inputValue(),"5");
  assert.equal(await reopened.locator("#examNotes").inputValue(),justification);
  console.log("OK v"+version+" sur "+new URL(BASE).origin+" : diagnostic, blanc B, reprise hors ligne à 320 px, réponses, justification et échéance conservées.");
}finally{await browser.close();}
