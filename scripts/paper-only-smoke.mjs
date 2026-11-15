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
  await viewport.locator("canvas").scrollIntoViewIfNeeded();
  const box=await viewport.boundingBox(),ink=await viewport.locator("canvas").boundingBox();
  assert.ok(box&&ink&&box.height>=300&&box.width>=200,"Feuille non visible sur mobile");
  const x=Math.max(box.x+25,ink.x+35),y=Math.max(box.y+25,ink.y+35);
  assert.ok(x+75<Math.min(box.x+box.width,ink.x+ink.width)
    &&y+40<Math.min(box.y+box.height,ink.y+ink.height),"Zone d'écriture réellement visible");
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+75,y+35,{steps:10});
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
  assert.equal(await page.locator("#quizCount").textContent(),"Question 1 / 10");
  const modes=page.getByRole("group",{name:"Mode de la feuille"});
  const pen=modes.getByRole("button",{name:"Stylo"});
  const eraser=modes.getByRole("button",{name:"Gomme"});
  const pan=modes.getByRole("button",{name:"Déplacer"});
  await eraser.click();
  assert.equal(await eraser.getAttribute("aria-pressed"),"true");
  await pan.click();
  assert.equal(await eraser.getAttribute("aria-pressed"),"false");
  assert.equal(await pan.getAttribute("aria-pressed"),"true");
  await pen.click();
  assert.equal(await pen.getAttribute("aria-pressed"),"true");
  assert.equal(await pan.getAttribute("aria-pressed"),"false");
  await page.setViewportSize({width:320,height:640});
  assert.ok(await modes.evaluate(el=>{
    const box=el.getBoundingClientRect();
    return box.width<=window.innerWidth&&[...el.children].every(button=>button.getBoundingClientRect().height>=44);
  }));
  await page.setViewportSize({width:390,height:844});
  console.log("OK Démarrage : progression et outils accessibles sur petit écran");

  await page.locator("#quizNotebook .math-notebook-quick-validate").click();
  assert.ok(await page.locator("#quizNotebook .math-notebook-manual [role=status]")
    .textContent().then(t=>t.includes("Trace d'abord")));
  assert.ok(await page.locator("#quizNotebook .math-notebook-manual-comparison").isHidden());
  console.log("OK Copie vierge non corrigée et non notée");

  await drawOnSheet("#quizNotebook .math-notebook-sheet-viewport");
  const first=await snapshot(),questionId=first.round.ids[0];
  assert.equal(first.workbook.entries["quiz:"+questionId].pages[0].length,1);
  await page.locator("#pauseQuiz").click();
  assert.ok(await page.locator("#quiz").isHidden());
  assert.match(await page.locator("#firstStart").textContent(),/Reprendre/);
  await page.locator("#firstStart").click();
  assert.ok(await page.locator("#quiz").isVisible());
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],first.workbook.entries["quiz:"+questionId]);
  console.log("OK Pause et reprise de la même copie");
  assert.ok(await page.locator("#quizNotebook .math-notebook-paper-tools>summary").isVisible());
  assert.ok(await page.locator("#quizNotebook .math-notebook-pages").isHidden());
  await page.locator("#quizNotebook .math-notebook-paper-tools>summary").click();
  await page.locator("#quizNotebook .math-notebook-pages button").filter({hasText:"Ajouter une page"}).click();
  const updated=await snapshot();
  assert.equal(updated.workbook.entries["quiz:"+questionId].pages.length,2);
  assert.equal(updated.workbook.entries["quiz:"+questionId].pages[0].length,1);
  await page.reload({waitUntil:"networkidle"});
  assert.ok(await page.locator("#quiz.paper-mode").isVisible());
  assert.equal((await snapshot()).workbook.entries["quiz:"+questionId].pages.length,2);
  assert.ok(await page.locator("#answerForm").isHidden());
  console.log("OK Tracé, nouvelle page et reprise intégrale sans ressaisie");

  const quizNotebook=page.locator("#quizNotebook");
  const validate=quizNotebook.locator(".math-notebook-quick-validate");
  const correction=quizNotebook.locator(".math-notebook-manual-comparison");
  await validate.click();
  assert.ok(await correction.isHidden(),"Une lecture incertaine doit laisser le corrigé fermé");
  assert.equal((await snapshot()).round.completed,0);
  assert.deepEqual((await snapshot()).round.assistedIds,[]);

  const canvas=quizNotebook.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const drawing=await canvas.boundingBox();
  assert.ok(drawing);
  const touch=await context.newCDPSession(page);
  const x=drawing.x+drawing.width*.3,y=drawing.y+drawing.height*.50;
  const touched=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x,y});
  assert.equal(touched,"CANVAS","Le doigt doit toucher la partie visible de la feuille");
  await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
  await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y+drawing.height*.14}]});
  await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  assert.equal((await snapshot()).workbook.entries["quiz:"+questionId].pages[0].length,2);
  await validate.click();
  const candidate=quizNotebook.locator(".math-notebook-recognition-candidate");
  assert.ok(await candidate.isVisible());
  assert.equal(await candidate.locator("strong").textContent(),"Lecture proposée : 1");
  assert.ok(await correction.isHidden());
  assert.equal((await snapshot()).round.completed,0);
  const confirm=candidate.getByRole("button",{name:"Oui, vérifier ce résultat"});
  // Cadrer le bouton dans le conteneur fixe du quiz et utiliser le même
  // flux tactile CDP que pour l'écriture, dans les coordonnées du viewport.
  const confirmPoint=await confirm.evaluate(button=>{
    window.confirmEvents=[];
    for(const type of ["pointerdown","pointerup","pointercancel","touchstart","touchend","click"]){
      document.addEventListener(type,event=>{
        window.confirmEvents.push([type,event.target.tagName,event.target===button]);
      },{capture:true,once:true});
    }
    button.scrollIntoView({block:"center",behavior:"instant"});
    const rect=button.getBoundingClientRect();
    const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
    return {x,y,hit:button.contains(document.elementFromPoint(x,y))};
  });
  assert.ok(confirmPoint.hit,"La confirmation doit être à portée de touche");
  const {x:confirmX,y:confirmY}=confirmPoint;
  await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:confirmX,y:confirmY}]});
  await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await page.locator("#feedback").waitFor({state:"visible",timeout:2500}).catch(async error=>{
    const message=await quizNotebook.locator(".math-notebook-recognition [role=status]").textContent();
    const events=await page.evaluate(()=>window.confirmEvents);
    throw new Error("Validation tactile : "+message+" "+JSON.stringify(events),{cause:error});
  });
  assert.equal((await snapshot()).round.completed,1);
  assert.equal((await snapshot()).workbook.entries["quiz:"+questionId].pages[0].length,2);
  console.log("OK Lecture au doigt sous les calculs, puis validation explicite et sauvegarde");

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
    const navigation=examPage.getByRole("group",{name:"Navigation entre les quatre exercices"});
    assert.equal(await navigation.getByRole("button").count(),4);
    await examPage.setViewportSize({width:320,height:640});
    assert.ok(await navigation.evaluate(group=>
      [...group.children].every(button=>{
        const box=button.getBoundingClientRect();
        return box.height>=44&&box.left>=0&&box.right<=innerWidth;
      })
    ));
    await examPage.setViewportSize({width:390,height:844});
    // The page uses its own browser tab; record a real mouse gesture.
    const viewport=examPage.locator("#examNotebook .math-notebook-sheet-viewport");
    await viewport.scrollIntoViewIfNeeded();
    await viewport.locator("canvas").scrollIntoViewIfNeeded();
    const box=await viewport.boundingBox(),ink=await viewport.locator("canvas").boundingBox();
    assert.ok(box&&ink&&box.height>=300&&box.width>=200,"Copie d'examen invisible");
    const x=Math.max(box.x+25,ink.x+35),y=Math.max(box.y+25,ink.y+35);
    assert.ok(x+75<Math.min(box.x+box.width,ink.x+ink.width)
      &&y+40<Math.min(box.y+box.height,ink.y+ink.height),"Zone d'examen réellement visible");
    await examPage.mouse.move(x,y);
    await examPage.mouse.down();
    await examPage.mouse.move(x+75,y+35,{steps:10});
    await examPage.mouse.up();
    const saved=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.equal(saved.exams.active.paperOnly,true);
    const key=Object.keys(saved.workbook.entries).find(k=>k.startsWith("exam:"));
    assert.ok(key&&saved.workbook.entries[key].pages[0].length===1);
    await examPage.evaluate(async()=>{
      await navigator.serviceWorker.ready;
      if(!navigator.serviceWorker.controller)
        await new Promise(resolve=>navigator.serviceWorker.addEventListener("controllerchange",resolve,{once:true}));
    });
    await examContext.setOffline(true);
    await examPage.locator("#examFormulaOpen").click();
    const formula=examPage.getByRole("dialog",{name:"Formulaire d’entraînement"});
    await formula.locator("math").first().waitFor({state:"visible"});
    assert.ok(await formula.getByRole("heading",{name:"Primitives et intégrales"}).isVisible());
    assert.ok(await formula.locator("math").count()>15);
    await formula.getByRole("button",{name:"Retour à la copie"}).click();
    assert.ok(await formula.isHidden());
    assert.equal(await examPage.evaluate(()=>document.activeElement?.id),"examFormulaOpen");
    const afterFormula=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.deepEqual(afterFormula,saved);
    await examContext.setOffline(false);
    console.log("OK Formulaire MathML hors ligne dans l’examen, délai et copie inchangés");

    const canvasBefore=await viewport.locator("canvas").evaluate(canvas=>canvas.toDataURL());
    await examPage.evaluate(()=>{
      const write=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        if(key==="daeu-b-data-v1")throw new DOMException("Quota exceeded","QuotaExceededError");
        return write.call(this,key,value);
      };
    });
    await viewport.locator("canvas").scrollIntoViewIfNeeded();
    const quotaBox=await viewport.boundingBox(),quotaInk=await viewport.locator("canvas").boundingBox();
    const quotaX=Math.max(quotaBox.x+25,quotaInk.x+35),quotaY=Math.max(quotaBox.y+25,quotaInk.y+35);
    await examPage.mouse.move(quotaX,quotaY+8);
    await examPage.mouse.down();
    await examPage.mouse.move(quotaX+75,quotaY+28,{steps:10});
    await examPage.mouse.up();
    const error=examPage.locator("#examNotebook .math-notebook-save-error");
    await error.waitFor({state:"visible"});
    assert.match(await error.textContent(),/stockage du navigateur est plein/);
    assert.equal(await viewport.locator("canvas").evaluate(canvas=>canvas.toDataURL()),canvasBefore);
    const refused=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.deepEqual(refused,saved);
    await examPage.reload({waitUntil:"networkidle"});
    console.log("OK Quota : dernier état conservé et trait refusé retiré de la feuille");

    await navigation.getByRole("button",{name:"Aller à l'exercice 3"}).click();
    assert.equal(await navigation.getByRole("button",{name:"Exercice 3 en cours"}).getAttribute("aria-current"),"step");
    await examPage.reload({waitUntil:"networkidle"});
    assert.ok(await examPage.locator("#examActive.paper-exam-active").isVisible());
    assert.equal((await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")))).exams.active.paperOnly,true);
    console.log("OK Examen : quatre exercices sur copies réelles, sauvegarde et reprise");

    assert.ok(await navigation.getByRole("button",{name:"Exercice 3 en cours"}).isVisible());
    await navigation.getByRole("button",{name:"Aller à l'exercice 1"}).click();
    await examPage.locator("#examSubmit").click();
    const submit=examPage.getByRole("dialog",{name:"Rendre ta copie ?"});
    assert.ok(await submit.isVisible());
    assert.match(await examPage.locator("#examPaperSubmitSummary").textContent(),/2, 3, 4/);
    assert.ok(await examPage.locator("#examResult").isHidden());
    await submit.getByRole("button",{name:"Continuer l’examen"}).click();
    assert.ok(await submit.isHidden());
    const stillWorking=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.equal(stillWorking.exams.active.deadlineAt,saved.exams.active.deadlineAt);
    assert.deepEqual(stillWorking.workbook.entries[key],saved.workbook.entries[key]);
    await examPage.locator("#examSubmit").click();
    await submit.getByRole("button",{name:"Rendre définitivement"}).click();
    assert.ok(await examPage.locator("#examResult").isVisible());
    assert.match(await examPage.locator("#examScore").textContent(),/Copie manuscrite rendue/);
    assert.match(await examPage.locator("#examHistory").textContent(),/non notée/);
    const done=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.equal(done.exams.active,null);
    assert.equal(done.exams.history.at(-1).paperOnly,true);
    const group=examPage.locator("#examReview .exam-review-group").first();
    const copy=group.locator(".exam-paper-review");
    const solutions=group.locator(".exam-paper-solutions");
    await copy.locator("canvas").waitFor({state:"visible"});
    assert.ok(await group.evaluate(details=>details.open));
    assert.ok(await solutions.isVisible());
    assert.ok(await copy.locator(".math-notebook-paper-modes").count()===0);
    assert.ok(await examPage.evaluate(()=>document.activeElement?.id==="examScore"));

    await examPage.setViewportSize({width:320,height:640});
    assert.ok(await group.evaluate(details=>details.scrollWidth<=details.clientWidth));
    await copy.locator(":scope > summary").click();
    assert.ok(await copy.locator("canvas").isHidden());
    assert.ok(await solutions.isVisible());
    await copy.locator(":scope > summary").click();
    await examPage.setViewportSize({width:1024,height:768});
    const copyBox=await copy.boundingBox(),solutionsBox=await solutions.boundingBox();
    assert.ok(copyBox&&solutionsBox&&copyBox.x+copyBox.width<=solutionsBox.x);
    assert.ok(await group.getByRole("link",{name:/S’entraîner/}).count()>0);
    const guide=group.locator(".exam-reasoning-guide");
    await guide.locator("summary").click();
    const justified=guide.getByRole("checkbox",{name:/réellement justifié/}).first();
    const target=guide.getByRole("checkbox",{name:"À retravailler",exact:true}).first();
    const revision=examPage.locator("#examRevision");
    const homeRevision=examPage.locator("#examRevisionHome");
    const homeSummary=examPage.locator("#examRevisionHomeSummary");
    assert.ok(await homeRevision.isHidden());
    assert.ok(await revision.getByRole("listitem").count()===0);
    await justified.check();
    await target.check();
    assert.ok(!(await justified.isChecked()));
    assert.equal(await revision.getByRole("listitem").count(),1);
    await revision.getByRole("button",{name:/Exercice 1/}).click();
    assert.ok(await guide.evaluate(node=>node.contains(document.activeElement)));
    assert.ok(await revision.getByRole("link",{name:"Revoir le cours"}).isVisible());

    await examPage.reload({waitUntil:"networkidle"});
    assert.match(await homeSummary.textContent(),/1 étape à retravailler dans 1 copie/);
    await homeSummary.click();
    const homeRow=homeRevision.getByRole("listitem");
    assert.equal(await homeRow.count(),1);
    assert.match(await homeRow.getByRole("link",{name:"Revoir le cours"}).getAttribute("href"),/course\.html\?course=/);
    await homeRow.getByRole("button",{name:/Exercice 1/}).click();
    await copy.locator("canvas").waitFor({state:"visible"});
    assert.ok(await guide.evaluate(node=>node.contains(document.activeElement)));
    assert.ok(await target.isChecked());
    assert.equal(await revision.getByRole("listitem").count(),1);
    assert.ok(!(await justified.isChecked()));
    await justified.check();
    assert.ok(!(await target.isChecked()));
    assert.equal(await revision.getByRole("listitem").count(),0);
    assert.ok(await homeRevision.isHidden());
    await target.check();
    assert.ok(await homeRevision.isVisible());
    console.log("OK Accueil : révisions persistantes et accès direct à l’étape sélectionnée");
    const recovered=await examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.deepEqual(recovered.workbook.entries[key],saved.workbook.entries[key]);
    const blank=examPage.locator("#examReview .exam-review-group").nth(1);
    await blank.locator(":scope > summary").click();
    await blank.locator(".exam-paper-review > summary").click();
    assert.match(await blank.locator(".exam-paper-review").textContent(),/Aucun tracé sauvegardé/);
    console.log("OK Correction : comparaison mobile et bureau, révisions choisies et grille sauvegardée");

    // Copies manuscrites volumineuses produites avec le format de tracé réel.
    const bulk=await examPage.evaluate(async()=>{
      const {encodeStroke}=await import("/workbook.mjs");
      const {createPersistence,DATA_KEY}=await import("/persistence.mjs");
      const {backedStorage,flushAutoBackup,createIndexedDbBackend}=await import("/auto-backup.mjs");
      const {startExam,finishExam,findExam}=await import("/exam-engine.mjs");
      const raw=JSON.parse(localStorage.getItem(DATA_KEY));
      const knownIds=new Set([...Object.keys(raw.practice.items),...(raw.round?.ids??[])]);
      const repository=createPersistence(backedStorage(localStorage),knownIds);
      const {workbook,exams}=repository.snapshot();
      const examId="blanc-1";
      const exam=findExam(examId);
      const pages=Array.from({length:3},(_,page)=>Array.from({length:155},(_,i)=>
        encodeStroke(Array.from({length:18},(_,j)=>[
          100+(i%15)*40+j,100+Math.floor(i/15)*57+Math.round(12*Math.sin(j/3))+page*10
        ]))
      ));
      for(let index=1;index<=5;index++){
        const started=Date.now()-index*86_400_000;
        exams.history.unshift(finishExam(startExam(examId,started,null,true),started+3600_000));
        for(const section of exam.sections)
          workbook.entries["exam:"+examId+":"+started+":"+section.id]={text:"",pages};
      }
      const current=repository.snapshot();
      const data=repository.replaceAll(current.practice,exams,current.round,current.transfers,workbook);
      await flushAutoBackup();
      const serialized=localStorage.getItem(DATA_KEY);
      const mirror=createIndexedDbBackend(indexedDB,knownIds);
      await mirror.write(JSON.stringify({...data,revision:data.revision-1}));
      if(await mirror.read()!==serialized)throw Error("Une ancienne révision a écrasé le miroir");
      return {revision:data.revision,entries:Object.keys(data.workbook.entries).length,size:serialized.length};
    });
    assert.ok(bulk.size>1_200_000&&bulk.entries>=21,"Le scénario doit franchir l’ancienne limite");
    await examPage.evaluate(async()=>{
      await navigator.serviceWorker.ready;
      localStorage.removeItem("daeu-b-data-v1");
    });
    await examContext.setOffline(true);
    await examPage.close();
    const recoveredPage=await examContext.newPage();
    await recoveredPage.goto(BASE,{waitUntil:"domcontentloaded"});
    await recoveredPage.waitForFunction(revision=>
      JSON.parse(localStorage.getItem("daeu-b-data-v1"))?.revision===revision,bulk.revision);
    const restored=await recoveredPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.equal(Object.keys(restored.workbook.entries).length,bulk.entries);
    assert.deepEqual(restored.workbook.entries[key],saved.workbook.entries[key]);
    assert.equal(restored.exams.history.length,6);
    await recoveredPage.locator("#examStart").click();
    await recoveredPage.locator("#examFormulaOpen").click();
    await recoveredPage.locator("#examFormula").waitFor({state:"visible"});
    const deadline=await recoveredPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")).exams.active.deadlineAt);
    await recoveredPage.clock.setSystemTime(deadline+1000);
    await recoveredPage.locator("#examResult").waitFor({state:"visible",timeout:8000});
    assert.ok(await recoveredPage.locator("#examFormula").isHidden());
    const expired=await recoveredPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
    assert.equal(expired.exams.active,null);
    assert.equal(expired.exams.history.at(-1).reason,"timeout");
    assert.deepEqual(expired.workbook.entries[key],saved.workbook.entries[key]);
    await recoveredPage.close();
    console.log("OK Échéance hors ligne : le formulaire se ferme et la copie est rendue une fois");
    console.log("OK Six examens conservés après fermeture et récupération IndexedDB hors ligne : "+bulk.size+" caractères");

  }finally{await examContext.close();}
  assert.deepEqual(errors,[]);
  console.log("PAPER-ONLY ANDROID : OK");
}finally{await context.close();await browser.close();}
