import assert from "node:assert/strict";
import {chromium} from "playwright";

const BASE=process.env.TEST_BASE_URL||"http://127.0.0.1:8000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"});
const page=await context.newPage(),errors=[];
page.setDefaultTimeout(15000);
page.on("pageerror",error=>errors.push(error.message));
page.on("dialog",dialog=>dialog.accept());

async function drawOnSheet(selector){
  const viewport=page.locator(selector);
  await viewport.scrollIntoViewIfNeeded();
  await viewport.evaluate(node=>{
    const canvas=node.querySelector("canvas");
    node.scrollTop+=canvas.getBoundingClientRect().top-node.getBoundingClientRect().top+35;
  });
  const box=await viewport.boundingBox();
  assert.ok(box&&box.height>=300&&box.width>=200,"Feuille non visible sur mobile");
  await page.mouse.move(box.x+45,box.y+75);
  await page.mouse.down();
  await page.mouse.move(box.x+120,box.y+110,{steps:10});
  await page.mouse.up();
}
const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
try{
  await page.goto(BASE+"/#commencer",{waitUntil:"networkidle"});
  await page.locator("#firstStart").click();
  assert.ok(await page.locator("#quiz.paper-mode").isVisible());
  assert.ok(await page.locator("#quizNotebook .math-notebook-paper-prompt").isVisible());
  assert.ok(await page.locator("#quizNotebook .math-notebook-paper-prompt").textContent().then(t=>t.length>12));
  assert.ok(await page.locator("#answerForm").isHidden());
  assert.ok(await page.locator("#quizNotebook .math-notebook-editor-disclosure").isHidden());
  assert.ok(await page.locator("#quizNotebook .math-notebook-quick-validate").isVisible());
  console.log("OK Démarrage : seulement la grande feuille et la validation manuscrite");

  await page.locator("#quizNotebook .math-notebook-quick-validate").click();
  assert.ok(await page.locator("#quizNotebook .math-notebook-manual [role=status]")
    .textContent().then(t=>t.includes("Trace d'abord")));
  assert.ok(await page.locator("#quizNotebook .math-notebook-manual-comparison").isHidden());
  console.log("OK Copie vierge non corrigée et non notée");

  await drawOnSheet("#quizNotebook .math-notebook-sheet-viewport");
  const first=await snapshot(),questionId=first.round.ids[0];
  assert.equal(first.workbook.entries["quiz:"+questionId].pages[0].length,1);
  await page.locator("#quizNotebook .math-notebook-pages button").filter({hasText:"Ajouter une page"}).click();
  const updated=await snapshot();
  assert.equal(updated.workbook.entries["quiz:"+questionId].pages.length,2);
  assert.equal(updated.workbook.entries["quiz:"+questionId].pages[0].length,1);
  await page.reload({waitUntil:"networkidle"});
  assert.ok(await page.locator("#quiz.paper-mode").isVisible());
  assert.equal((await snapshot()).workbook.entries["quiz:"+questionId].pages.length,2);
  assert.ok(await page.locator("#answerForm").isHidden());
  console.log("OK Tracé, nouvelle page et reprise intégrale sans ressaisie");

  const examContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"});
  const examPage=await examContext.newPage();
  examPage.setDefaultTimeout(15000);
  examPage.on("dialog",dialog=>dialog.accept());
  examPage.on("pageerror",error=>errors.push("examen : "+error.message));
  try{
    await examPage.goto(BASE,{waitUntil:"networkidle"});
    await examPage.locator("#examStart").click();
    assert.ok(await examPage.locator("#examActive.paper-exam-active").isVisible());
    assert.ok(await examPage.locator("#examNotebook .math-notebook-paper-prompt")
      .textContent().then(t=>t.includes("Question 1")));
    assert.ok(await examPage.locator("#examQuestions").isHidden());
    assert.ok(await examPage.locator(".exam-notes").isHidden());
    // The page uses its own browser tab; record a real mouse gesture.
    const viewport=examPage.locator("#examNotebook .math-notebook-sheet-viewport");
    await viewport.scrollIntoViewIfNeeded();
    await viewport.evaluate(node=>{
      const canvas=node.querySelector("canvas");
      node.scrollTop+=canvas.getBoundingClientRect().top-node.getBoundingClientRect().top+35;
    });
    const box=await viewport.boundingBox();
    assert.ok(box&&box.height>=300&&box.width>=200,"Copie d'examen invisible");
    await examPage.mouse.move(box.x+45,box.y+75);
    await examPage.mouse.down();
    await examPage.mouse.move(box.x+120,box.y+105,{steps:10});
    await examPage.mouse.up();
    const saved=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.equal(saved.exams.active.paperOnly,true);
    const key=Object.keys(saved.workbook.entries).find(k=>k.startsWith("exam:"));
    assert.ok(key&&saved.workbook.entries[key].pages[0].length===1);
    await examPage.reload({waitUntil:"networkidle"});
    assert.ok(await examPage.locator("#examActive.paper-exam-active").isVisible());
    assert.equal((await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")))).exams.active.paperOnly,true);
    console.log("OK Examen : quatre exercices sur copies réelles, sauvegarde et reprise");

    await examPage.locator("#examSubmit").click();
    assert.ok(await examPage.locator("#examResult").isVisible());
    assert.match(await examPage.locator("#examScore").textContent(),/Copie manuscrite rendue/);
    assert.match(await examPage.locator("#examHistory").textContent(),/non notée/);
    const done=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.equal(done.exams.active,null);
    assert.equal(done.exams.history.at(-1).paperOnly,true);
    await examPage.locator("#examReview .exam-review-group").first().evaluate(node=>{node.open=true;});
    await examPage.locator("#examReview .exam-paper-review").first().evaluate(node=>{node.open=true;});
    await examPage.locator("#examReview .exam-paper-review canvas").first().waitFor({state:"visible"});
    console.log("OK Remise : aucune fausse note, copie manuscrite relisible avec correction");
  }finally{await examContext.close();}
  assert.deepEqual(errors,[]);
  console.log("PAPER-ONLY ANDROID : OK");
}finally{await context.close();await browser.close();}
