import assert from "node:assert/strict";
import {chromium} from "playwright";
import {parseStroke,PAPER_WIDTH,PAPER_HEIGHT} from "../app/workbook.mjs";
import {recognizeFinalEquationInk} from "../app/equation-ink.mjs";
import {verifyPwaUpgrade} from "./pwa-upgrade-smoke.mjs";

const BASE=process.env.TEST_BASE_URL||"http://127.0.0.1:8000";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"});
const page=await context.newPage(),errors=[];
page.setDefaultTimeout(15000);
page.on("pageerror",error=>errors.push(error.message));
page.on("dialog",dialog=>dialog.accept());

async function drawOnSheet(selector,targetPage=page){
  const viewport=targetPage.locator(selector);
  await viewport.scrollIntoViewIfNeeded();
  await viewport.locator("canvas").scrollIntoViewIfNeeded();
  const box=await viewport.boundingBox(),ink=await viewport.locator("canvas").boundingBox();
  assert.ok(box&&ink&&box.height>=300&&box.width>=200,"Feuille non visible sur mobile");
  const x=Math.max(box.x+25,ink.x+35),y=Math.max(box.y+25,ink.y+35);
  assert.ok(x+75<Math.min(box.x+box.width,ink.x+ink.width)
    &&y+40<Math.min(box.y+box.height,ink.y+ink.height),"Zone d'écriture réellement visible");
  await targetPage.mouse.move(x,y);
  await targetPage.mouse.down();
  await targetPage.mouse.move(x+75,y+35,{steps:10});
  await targetPage.mouse.up();
}
const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
const tightEight=[[180,290],[158,294],[159,312],[172,333],[182,353],[166,366],[148,365],
  [152,347],[166,328],[174,307],[175,291]];
async function traceFraction(touch,canvas,paths){
  await canvas.scrollIntoViewIfNeeded();
  const box=await canvas.boundingBox();
  assert.ok(box);
  const point=([x,y])=>({x:box.x+x*box.width/PAPER_WIDTH,y:box.y+y*box.height/PAPER_HEIGHT});
  for(const [start,...rest] of paths){
    const first=point(start);
    assert.equal(await canvas.evaluate((el,{x,y})=>document.elementFromPoint(x,y)===el,first),true);
    await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[first]});
    for(const end of rest)await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[point(end)]});
    await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  }
}
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

  await page.locator("#quizNotebook .math-notebook-quick-validate").press("Enter");
  assert.ok(await page.locator("#quizNotebook .math-notebook-manual [role=status]")
    .textContent().then(t=>t.includes("Trace d'abord")));
  assert.ok(await page.locator("#quizNotebook .math-notebook-manual-comparison").isHidden());
  const retryOnPaper=page.getByRole("button",{name:"Revenir à ma feuille"});
  await retryOnPaper.click();
  assert.ok(await retryOnPaper.isHidden());
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),"CANVAS");
  console.log("OK Copie vierge non corrigée et retour direct au stylo");

  const touch=await context.newCDPSession(page);
  const fractionStrokes=[
    [[20,241],[58,293]],[[58,241],[20,293]],
    [[74,258],[98,256],[106,257],[100,257]],[[76,276],[100,277],[104,277]],
    [[170,180],[170,245]],[[120,267],[220,267]],tightEight
  ];
  await traceFraction(touch,page.locator("#quizNotebook canvas"),fractionStrokes);
  await page.locator("#quizNotebook .math-notebook-quick-validate").click();
  const fractionCandidate=page.locator("#quizNotebook .math-notebook-recognition-candidate");
  assert.match(await fractionCandidate.locator("strong").textContent(),/Lecture proposée : 1\/8/);
  assert.match(await fractionCandidate.locator(".math-notebook-recognition-source").textContent(),/x=1\/8/);
  assert.equal((await snapshot()).round.completed,0);
  const undoFraction=page.getByRole("button",{name:"Annuler le dernier trait"});
  for(const _ of fractionStrokes)await undoFraction.click();
  console.log("OK Dernière égalité avec signe = irrégulier et fraction posée, confirmation obligatoire");

  const uprightFraction=[
    [[128,189],[145,190],[165,186],[186,185],[188,188],[182,211],[182,234],[182,239],[182,236]],
    [[156,219],[179,221],[205,219],[226,219],[218,219]],
    [[120,267],[236,269]],
    [[185,295],[153,295],[151,320],[171,318],[187,325],[191,339],[182,354],[166,359],[150,354]]
  ];
  await traceFraction(touch,page.locator("#quizNotebook canvas"),uprightFraction);
  await page.locator("#quizNotebook .math-notebook-quick-validate").tap();
  await fractionCandidate.waitFor({state:"visible"});
  assert.equal(await fractionCandidate.locator("strong").textContent(),"Lecture proposée : 7/5");
  assert.equal((await snapshot()).round.completed,0);
  for(const _ of uprightFraction)await undoFraction.click();
  console.log("OK 7 barré presque vertical lu comme 7/5 au doigt, sans notation préalable");

  const openFourFraction=[
    [[183,173],[170,192],[156,210],[200,210]],
    [[205,183],[203,264]],
    [[120,280],[236,281]],
    [[185,305],[153,305],[151,330],[171,328],[187,335],[191,349],[182,364],[166,369],[150,364]]
  ];
  await traceFraction(touch,page.locator("#quizNotebook canvas"),openFourFraction);
  await page.locator("#quizNotebook .math-notebook-quick-validate").tap();
  await fractionCandidate.waitFor({state:"visible"});
  assert.equal(await fractionCandidate.locator("strong").textContent(),"Lecture proposée : 4/5");
  assert.equal((await snapshot()).round.completed,0);
  for(const _ of openFourFraction)await undoFraction.click();
  console.log("OK 4 ouvert lu comme 4/5 au doigt, sans notation préalable");

  const ovalStroke=(cx,cy,rx,ry)=>Array.from({length:13},(_,i)=>[
    Math.round(cx+rx*Math.cos(2*Math.PI*i/12)),
    Math.round(cy+ry*Math.sin(2*Math.PI*i/12))
  ]);
  const twinLoopFraction=[
    [[163,160],[182,155],[201,160],[206,171],[196,182],[181,185],
      [198,186],[208,198],[200,211],[183,216],[162,210]],
    [[130,235],[240,235]],
    ovalStroke(180,282,26,21),
    ovalStroke(183,330,27,24)
  ];
  await traceFraction(touch,page.locator("#quizNotebook canvas"),twinLoopFraction);
  await page.locator("#quizNotebook .math-notebook-quick-validate").tap();
  await fractionCandidate.waitFor({state:"visible"});
  assert.equal(await fractionCandidate.locator("strong").textContent(),"Lecture proposée : 3/8");
  assert.equal((await snapshot()).round.completed,0);
  for(const _ of twinLoopFraction)await undoFraction.click();
  console.log("OK 8 à deux boucles distinctes dans 3/8 au doigt, sans notation préalable");

  const roundedSevenStrokes=[
    [[170,188],[175,183],[183,181],[187,180],[191,183],[193,190],[193,200],[193,215],[192,228],[188,250]],
    [[162,219],[199,214]]
  ];
  const serifSevenStrokes=[
    [[171,200],[170,194],[169,186],[170,180]],
    [[170,184],[178,182],[191,181],[197,182],[200,185],[199,199],[196,214],[193,234],[190,253]]
  ];
  for(const [style,seven] of [["arrondi et barré",roundedSevenStrokes],["avec empattement à gauche",serifSevenStrokes]]){
    const fraction=[...seven,[[120,270],[235,270]],
      [[185,295],[153,295],[151,320],[171,318],[187,325],[191,339],[182,354],[166,359],[150,354]]];
    await traceFraction(touch,page.locator("#quizNotebook canvas"),fraction);
    await page.locator("#quizNotebook .math-notebook-quick-validate").tap();
    await fractionCandidate.waitFor({state:"visible"});
    assert.equal(await fractionCandidate.locator("strong").textContent(),"Lecture proposée : 7/5");
    assert.equal((await snapshot()).round.completed,0);
    for(const _ of fraction)await undoFraction.click();
    console.log(`OK 7 ${style} lu comme 7/5 au doigt, sans notation préalable`);
  }

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
  const zoomSheet=page.locator("#quizNotebook .math-notebook-sheet-viewport");
  const zoom=page.getByRole("combobox",{name:"Zoom de la feuille"});
  const coordinates=()=>zoomSheet.evaluate(el=>{
    const canvas=el.querySelector("canvas");
    const ink=canvas.getBoundingClientRect(),view=el.getBoundingClientRect();
    return {left:el.scrollLeft/ink.width,top:(view.top+el.clientTop-ink.top)/ink.height,
      width:canvas.clientWidth/el.clientWidth};
  });
  await zoom.selectOption("150");
  const size=await coordinates();
  assert.ok(Math.abs(size.width-1.5)<.03);
  const toWriting=page.getByRole("button",{name:"Aller à la zone d’écriture"});
  if(await toWriting.isVisible())await toWriting.click();
  await zoomSheet.evaluate(el=>el.scrollBy({left:70,top:150,behavior:"instant"}));
  const beforeZoom=await coordinates();
  await zoom.selectOption("200");
  const afterZoom=await coordinates();
  assert.ok(Math.abs(afterZoom.width-2)<.03);
  assert.ok(Math.abs(beforeZoom.left-afterZoom.left)<.01&&Math.abs(beforeZoom.top-afterZoom.top)<.01,
    "L’endroit visible sur la copie est conservé dans les deux axes");
  await pan.click();
  const dragPoint=await zoomSheet.evaluate(el=>{
    const box=el.getBoundingClientRect();
    return [box.left+160,box.top+110];
  });
  assert.equal(await page.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,dragPoint),"CANVAS");
  await page.mouse.move(...dragPoint);
  await page.mouse.down();
  await page.mouse.move(dragPoint[0]-60,dragPoint[1]-45,{steps:8});
  await page.mouse.up();
  const afterDrag=await coordinates();
  assert.ok(afterDrag.left>afterZoom.left&&afterDrag.top>afterZoom.top);
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],first.workbook.entries["quiz:"+questionId]);
  await pen.click();
  const touchPan=await context.newCDPSession(page);
  const finger=(id,x,y)=>({id,x,y});
  const left=finger(1,dragPoint[0]-25,dragPoint[1]);
  const right=finger(2,dragPoint[0]+35,dragPoint[1]+25);
  await touchPan.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[left]});
  await touchPan.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{...left,x:left.x-8}]});
  await touchPan.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...left,x:left.x-8},right]});
  await touchPan.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[
    {...left,x:left.x-55,y:left.y-42},{...right,x:right.x-55,y:right.y-42}
  ]});
  await touchPan.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  const afterTouchPan=await coordinates();
  assert.ok(afterTouchPan.left>afterDrag.left+.025&&afterTouchPan.top>afterDrag.top+.025,
    "Le geste à deux doigts doit déplacer les deux axes");
  assert.equal(await pen.getAttribute("aria-pressed"),"true");
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],first.workbook.entries["quiz:"+questionId],
    "Le début du geste à deux doigts n’est jamais enregistré comme trait");
  assert.equal(await zoom.inputValue(),"200","Un glissement à deux doigts garde le zoom");
  const center=await zoomSheet.evaluate(el=>{
    const box=el.getBoundingClientRect();
    return {x:box.left+el.clientWidth/2,y:box.top+130};
  });
  const anchoredPoint=()=>zoomSheet.locator("canvas").evaluate((el,{x,y})=>{
    const box=el.getBoundingClientRect();
    return {x:(x-box.left)/box.width,y:(y-box.top)/box.height};
  },center);
  const beforePinch=await anchoredPoint();
  const pinch=async(from,to)=>{
    await touchPan.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[
      finger(1,center.x-from,center.y),finger(2,center.x+from,center.y)
    ]});
    await touchPan.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[
      finger(1,center.x-to,center.y),finger(2,center.x+to,center.y)
    ]});
    await touchPan.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  };
  await pinch(40,54);
  const enlarged=Number(await zoom.inputValue());
  assert.ok(enlarged>225&&enlarged<300);
  const afterPinch=await anchoredPoint();
  assert.ok(Math.abs(afterPinch.x-beforePinch.x)<.015&&Math.abs(afterPinch.y-beforePinch.y)<.015,
    "Le calcul sous le milieu des deux doigts reste au même endroit");
  await pinch(64,48);
  const savedZoom=await zoom.inputValue();
  assert.ok(Number(savedZoom)<enlarged&&Number(savedZoom)>100);
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],first.workbook.entries["quiz:"+questionId]);
  await touchPan.detach();
  const savedPosition=await coordinates();
  console.log("OK Déplacement et zoom à deux doigts sans modifier la copie");

  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(id=>{
    const key="daeu-b-paper-views-v1";
    const entries=new Map(JSON.parse(localStorage.getItem(key)));
    const context="quiz:"+id;
    const record=entries.get(context);
    // Même copie et réglages, dans le format v82 à une seule vue.
    entries.set(context,{page:record.page,...record.views[record.page]});
    localStorage.setItem(key,JSON.stringify([...entries]));
  },questionId);
  await context.setOffline(true);
  await page.reload({waitUntil:"domcontentloaded"});
  await zoom.waitFor();
  assert.equal(await zoom.inputValue(),savedZoom);
  const resumed=await coordinates();
  assert.ok(Math.abs(resumed.left-savedPosition.left)<.01&&Math.abs(resumed.top-savedPosition.top)<.01,
    "Le zoom et la position sont restaurés après rechargement hors connexion");
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],first.workbook.entries["quiz:"+questionId]);
  assert.equal(await pen.getAttribute("aria-pressed"),"true");
  await context.setOffline(false);
  const nextLine=page.getByRole("button",{name:"Ligne suivante sur la feuille"});
  await nextLine.click();
  const firstLine=await coordinates();
  assert.equal(firstLine.left,0,"Retour à la marge gauche sans changer le zoom");
  assert.ok(firstLine.top>resumed.top);
  assert.equal(await zoom.inputValue(),savedZoom);
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),"CANVAS");
  await nextLine.click();
  assert.ok((await coordinates()).top>firstLine.top,"Un second appui descend encore");
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],first.workbook.entries["quiz:"+questionId]);
  const continuePage=page.getByRole("button",{name:"Continuer sur la page suivante"});
  const reachPageEnd=async()=>{
    await zoomSheet.evaluate(el=>{el.scrollTop=el.scrollHeight;});
    for(let i=0;i<24;i++){
      await nextLine.click();
      if(await continuePage.isVisible())return;
    }
    assert.fail("La fin de page doit proposer de continuer sur la suivante");
  };
  await reachPageEnd();
  const lineStatus=page.locator("#quizNotebook .math-notebook-status");
  assert.match(await lineStatus.textContent(),/Bas de la feuille/);
  assert.equal((await snapshot()).workbook.entries["quiz:"+questionId].pages.length,1);
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==="daeu-b-data-v1"){
        Storage.prototype.setItem=original;
        throw new DOMException("Quota exceeded","QuotaExceededError");
      }
      return original.call(this,key,value);
    };
  });
  await continuePage.click();
  assert.match(await lineStatus.textContent(),/Modification non enregistrée/);
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],first.workbook.entries["quiz:"+questionId]);
  await continuePage.click();
  const paperPages=page.getByRole("navigation",{name:"Pages de la feuille"});
  assert.match(await paperPages.textContent(),/Page 2\/2/);
  const copyWithExtraPage=await snapshot();
  assert.deepEqual(copyWithExtraPage.workbook.entries["quiz:"+questionId].pages,
    [...first.workbook.entries["quiz:"+questionId].pages,[]]);
  assert.equal(await zoom.inputValue(),savedZoom);
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),"CANVAS");
  await paperPages.getByRole("button",{name:"Page précédente"}).click();
  await reachPageEnd();
  await continuePage.click();
  assert.match(await paperPages.textContent(),/Page 2\/2/);
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],copyWithExtraPage.workbook.entries["quiz:"+questionId]);
  await paperPages.getByRole("button",{name:"Page précédente"}).click();
  if(await toWriting.isVisible())await toWriting.click();
  console.log("OK Fin de page : erreur de sauvegarde récupérable, création et réutilisation d’une page");
  await zoom.selectOption("100");
  await page.getByRole("button",{name:"Voir l’énoncé"}).click();
  console.log("OK Zoom progressif et déplacement de la feuille sans nouveau trait");
  await page.setViewportSize({width:640,height:360});
  const landscapeSheet=page.locator("#quizNotebook .math-notebook-sheet-viewport");
  const jump=page.locator("#quizNotebook .math-notebook-paper-jump");
  await jump.click();
  assert.equal(await jump.textContent(),"Voir l’énoncé");
  assert.ok(await landscapeSheet.evaluate(el=>{
    const sheet=el.getBoundingClientRect();
    const ink=el.querySelector("canvas").getBoundingClientRect();
    return el.scrollTop>0&&el.clientHeight>=190&&el.clientHeight<=250
      &&ink.top<=sheet.top+el.clientTop+2&&ink.bottom>=sheet.top+150;
  }),"La zone d’écriture doit remplir la feuille défilante en paysage");
  const landscapeValidate=page.locator("#quizNotebook .math-notebook-quick-validate");
  await landscapeValidate.scrollIntoViewIfNeeded();
  assert.ok(await landscapeValidate.evaluate(button=>{
    const box=button.getBoundingClientRect();
    return box.height>=44&&document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)?.closest("button")===button;
  }),"La validation doit rester accessible en paysage");
  await jump.click();
  assert.equal(await jump.textContent(),"Aller à la zone d’écriture");
  assert.equal(await landscapeSheet.evaluate(el=>el.scrollTop),0);
  await page.setViewportSize({width:390,height:844});
  assert.deepEqual((await snapshot()).workbook.entries["quiz:"+questionId],copyWithExtraPage.workbook.entries["quiz:"+questionId]);
  console.log("OK Paysage : accès à la zone d’écriture, validation accessible et copie intacte");
  const previewButton=paperPages.getByRole("button",{name:"Aperçu des pages"});
  const previewDialog=page.getByRole("dialog",{name:"Aperçu des pages de la copie"});
  await page.setViewportSize({width:320,height:640});
  await previewButton.click();
  const writtenThumbnail=previewDialog.getByRole("button",{name:"Page 1 Manuscrite"});
  const blankThumbnail=previewDialog.getByRole("button",{name:"Page 2 Vierge"});
  assert.equal(await writtenThumbnail.getAttribute("aria-current"),"page");
  assert.ok(await previewDialog.evaluate(el=>el.getBoundingClientRect().width<=window.innerWidth));
  const containsInk=thumb=>thumb.locator("canvas").evaluate(el=>{
    const pixels=el.getContext("2d").getImageData(0,0,el.width,el.height).data;
    return pixels.some((channel,i)=>i%4===0&&channel<100);
  });
  assert.equal(await containsInk(writtenThumbnail),true);
  assert.equal(await containsInk(blankThumbnail),false);
  const lastInk=(thumb)=>thumb.locator(".math-notebook-last-ink");
  const checkLastInk=async(thumb,strokes)=>{
    const [x,y]=parseStroke(strokes.at(-1)).at(-1);
    const marker=await lastInk(thumb).evaluate(el=>({
      x:parseFloat(el.style.left)/100,y:parseFloat(el.style.top)/100,
      transparentToTouch:getComputedStyle(el).pointerEvents==="none"
    }));
    assert.ok(Math.abs(marker.x-x/PAPER_WIDTH)<.00001&&Math.abs(marker.y-y/PAPER_HEIGHT)<.00001);
    assert.ok(marker.transparentToTouch,"Le repère doit laisser passer l’appui sur la miniature");
  };
  await checkLastInk(writtenThumbnail,copyWithExtraPage.workbook.entries["quiz:"+questionId].pages[0]);
  assert.equal(await lastInk(blankThumbnail).count(),0);
  await page.keyboard.press("Escape");
  assert.ok(await previewDialog.isHidden());
  assert.equal(await previewButton.evaluate(el=>document.activeElement===el),true);
  await page.setViewportSize({width:390,height:844});
  await previewButton.click();
  await blankThumbnail.click();
  assert.match(await paperPages.textContent(),/Page 2\/2/);
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),"CANVAS");
  await drawOnSheet("#quizNotebook .math-notebook-sheet-viewport");
  const beforePreview=await snapshot();
  await zoom.selectOption("200");
  await zoomSheet.evaluate(el=>el.scrollBy({top:85,left:110,behavior:"instant"}));
  const pageTwoPosition=await coordinates();
  await context.setOffline(true);
  await previewButton.click();
  const secondWrittenThumbnail=previewDialog.getByRole("button",{name:"Page 2 Manuscrite"});
  assert.equal(await containsInk(secondWrittenThumbnail),true);
  await checkLastInk(secondWrittenThumbnail,beforePreview.workbook.entries["quiz:"+questionId].pages[1]);
  const target={x:.70,y:.60};
  const thumbnail=await writtenThumbnail.locator("canvas").boundingBox();
  assert.ok(thumbnail);
  await page.touchscreen.tap(thumbnail.x+thumbnail.width*target.x,thumbnail.y+thumbnail.height*target.y);
  assert.ok(await previewDialog.isHidden());
  assert.match(await paperPages.textContent(),/Page 1\/2/);
  assert.equal(await zoom.inputValue(),"200");
  const paperCenter=await zoomSheet.evaluate(el=>{
    const box=el.getBoundingClientRect(),ink=el.querySelector("canvas").getBoundingClientRect();
    return {x:(box.left+el.clientLeft+el.clientWidth/2-ink.left)/ink.width,
      y:(box.top+el.clientTop+el.clientHeight/2-ink.top)/ink.height};
  });
  assert.ok(Math.abs(paperCenter.x-target.x)<.02&&Math.abs(paperCenter.y-target.y)<.02,
    "La zone touchée doit être affichée au centre de la feuille");
  assert.deepEqual(await snapshot(),beforePreview);
  await previewButton.click();
  const visibleFrame=writtenThumbnail.locator(".math-notebook-visible-frame");
  await visibleFrame.waitFor();
  assert.equal(await previewDialog.locator(".math-notebook-visible-frame").count(),1);
  const framePosition=()=>visibleFrame.evaluate(frame=>({
    x:parseFloat(frame.style.left)/100,y:parseFloat(frame.style.top)/100,
    width:parseFloat(frame.style.width)/100,height:parseFloat(frame.style.height)/100
  }));
  const expectedFrame=()=>zoomSheet.evaluate(el=>{
    const view=el.getBoundingClientRect(),ink=el.querySelector("canvas").getBoundingClientRect();
    const dx=view.left+el.clientLeft-ink.left,dy=view.top+el.clientTop-ink.top;
    const x=Math.max(0,dx)/ink.width,y=Math.max(0,dy)/ink.height;
    return {x,y,width:Math.min(1,(dx+el.clientWidth)/ink.width)-x,
      height:Math.min(1,(dy+el.clientHeight)/ink.height)-y};
  });
  const frame=await framePosition(),expected=await expectedFrame();
  for(const axis of ["x","y","width","height"])
    assert.ok(Math.abs(frame[axis]-expected[axis])<.015,"Cadre visible, axe "+axis);
  assert.ok(frame.x>0&&frame.y>0&&frame.width<1&&frame.height<1);
  await page.setViewportSize({width:640,height:360});
  await page.waitForFunction(()=>{
    const frame=document.querySelector(".math-notebook-visible-frame");
    const view=document.querySelector("#quizNotebook .math-notebook-sheet-viewport");
    const paper=view.querySelector("canvas").getBoundingClientRect();
    return Math.abs(parseFloat(frame.style.height)/100-view.clientHeight/paper.height)<.015;
  });
  await page.keyboard.press("Escape");
  await page.setViewportSize({width:390,height:844});
  assert.deepEqual(await snapshot(),beforePreview);
  await context.setOffline(false);
  await zoom.selectOption("150");
  const pageOnePosition=await coordinates();
  await paperPages.getByRole("button",{name:"Page suivante"}).click();
  assert.equal(await zoom.inputValue(),"200");
  const reopenedPageTwo=await coordinates();
  assert.ok(Math.abs(reopenedPageTwo.left-pageTwoPosition.left)<.015
    &&Math.abs(reopenedPageTwo.top-pageTwoPosition.top)<.015);
  await paperPages.getByRole("button",{name:"Page précédente"}).click();
  assert.equal(await zoom.inputValue(),"150");
  const reopenedPageOne=await coordinates();
  assert.ok(Math.abs(reopenedPageOne.left-pageOnePosition.left)<.015
    &&Math.abs(reopenedPageOne.top-pageOnePosition.top)<.015);
  assert.deepEqual(await snapshot(),beforePreview);
  await zoom.selectOption("100");
  console.log("OK Miniatures à 320 px, vues distinctes par page et copie intacte");
  await paperPages.getByRole("button",{name:"Lire cette page"}).click();
  assert.match(await paperPages.textContent(),/Page 1\/2/);
  assert.ok(await page.locator("#quizNotebook .math-notebook-manual-comparison").isHidden());
  assert.deepEqual((await snapshot()).round.assistedIds,[]);
  await page.reload({waitUntil:"networkidle"});
  assert.ok(await page.locator("#quiz.paper-mode").isVisible());
  assert.equal((await snapshot()).workbook.entries["quiz:"+questionId].pages.length,2);
  assert.match(await paperPages.textContent(),/Page 1\/2/);
  await paperPages.getByRole("button",{name:"Page suivante"}).click();
  await page.getByRole("button",{name:"Annuler le dernier trait"}).click();
  assert.equal((await snapshot()).workbook.entries["quiz:"+questionId].pages[1].length,0);
  await paperPages.getByRole("button",{name:"Page précédente"}).click();
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
  assert.equal(await candidate.locator(".math-notebook-recognition-source").textContent(),"Page 1 de ta copie");
  await candidate.getByRole("button",{name:"Non, la lecture est incorrecte"}).click();
  assert.match(await quizNotebook.locator(".math-notebook-manual [role=status]").textContent(),/Lecture rejetée/);
  await quizNotebook.getByRole("button",{name:"Revenir à ma feuille"}).click();
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),"CANVAS");
  assert.equal((await snapshot()).round.completed,0);
  await validate.click();
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

  const skipOnPaper=page.getByRole("button",{name:"Je ne sais pas",exact:true});
  assert.ok(await skipOnPaper.isHidden());
  await page.locator("#next").tap();
  const beforeSkip=await snapshot();
  const skippedId=beforeSkip.round.ids[1];
  await page.setViewportSize({width:320,height:640});
  assert.ok(await page.locator("#quiz .quiz-top").evaluate(top=>
    top.scrollWidth<=top.clientWidth&&[...top.querySelectorAll("button")].every(button=>
      button.getBoundingClientRect().height>=44)));
  await skipOnPaper.tap();
  assert.ok(await page.locator("#feedback").isVisible());
  assert.ok(await skipOnPaper.isHidden());
  assert.match(await page.locator("#feedbackText").textContent(),/^Réponse à connaître : [^\n]+\n\n/);
  const afterSkip=await snapshot();
  assert.equal(afterSkip.round.completed,2);
  assert.equal(afterSkip.round.score,beforeSkip.round.score);
  assert.equal(afterSkip.practice.items[skippedId].attempts,1);
  assert.equal(afterSkip.practice.items[skippedId].confirmed,false);
  assert.deepEqual(afterSkip.workbook,beforeSkip.workbook);
  assert.deepEqual(afterSkip.round.assistedIds,beforeSkip.round.assistedIds);

  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#quiz.paper-mode").waitFor({state:"visible"});
  assert.equal(await page.locator("#quizCount").textContent(),"Question 3 / 10");
  assert.deepEqual(await snapshot(),afterSkip);
  for(let index=2;index<afterSkip.round.ids.length;index++){
    await skipOnPaper.tap();
    await page.locator("#next").tap();
  }
  const nextCourse=page.locator("#resultsNextActions").getByRole("link",{name:"Lire le cours"});
  await nextCourse.tap();
  await page.locator("#courseBody h2").first().waitFor({state:"visible"});
  await page.locator("#coursePractice").tap();
  await page.waitForURL(/topic=/);
  await page.locator("#start").tap();
  await page.locator("#quiz.paper-mode").waitFor({state:"visible"});
  assert.ok(await page.locator("#answerForm").isHidden());
  assert.deepEqual((await snapshot()).workbook,beforeSkip.workbook);
  console.log("OK Diagnostic sur feuille à 320 px : réponse inconnue, reprise et accès au cours puis à l’entraînement");

  const denominatorFive=[[185,311],[153,311],[151,336],[171,334],[187,341],[191,355],[182,370],[166,375],[150,370]];
  const fractions=[
    {id:"p03",answer:"3/8",paths:[
      [[150,184],[171,179],[192,184],[198,194],[186,206],[169,209],[189,211],
        [201,224],[193,239],[174,245],[150,240]],
      [[120,267],[220,267]],tightEight
    ]},
    // Le 8 croise ses deux boucles et termine près de son départ.
    {id:"p03",answer:"3/8",paths:[
      [[150,184],[171,179],[192,184],[198,194],[186,206],[169,209],[189,211],
        [201,224],[193,239],[174,245],[150,240]],
      [[119,267],[221,267]],
      [[187,301],[155,321],[168,327],[185,335],[197,343],[199,353],[182,362],
        [165,365],[149,360],[141,349],[150,337],[165,321],[183,307],[195,292]]
    ]},
    // Les extrémités du 8 restent éloignées après un croisement de ses boucles.
    {id:"p03",answer:"3/8",paths:[
      [[150,184],[171,179],[192,184],[198,194],[186,206],[169,209],[189,211],
        [201,224],[193,239],[174,245],[150,240]],
      [[100,267],[235,267]],
      [[154,299],[151,291],[139,286],[123,289],[119,299],[126,312],[147,329],[165,345],
        [159,359],[142,367],[123,364],[112,353],[123,338],[145,322],[171,306],[187,297]]
    ]},
    // Un 3 étroit descend en deux arcs, tandis que le 8 ferme ses boucles.
    {id:"p03",answer:"3/8",paths:[
      [[158,184],[158,181],[165,181],[170,176],[173,178],[173,187],[170,193],[163,204],
        [162,208],[171,209],[177,211],[181,215],[185,220],[185,226],[180,234],[174,239],[165,242],[155,240]],
      [[120,267],[220,267]],tightEight
    ]},
    {id:"p08",answer:"4/5",paths:[
      [[156,177],[144,200],[138,216],[141,222],[163,223],[180,231],[188,232]],
      [[178,188],[176,205],[172,232],[167,254],[164,266],[164,272]],
      [[115,286],[223,287]],
      denominatorFive
    ]},
    {id:"p08",answer:"4/5",paths:[
      [[184,178],[170,180],[157,184],[141,200],[136,206],[141,209],[152,212],[168,216]],
      [[183,179],[181,198],[174,223],[163,254],[158,272]],
      [[115,286],[223,287]],
      denominatorFive
    ]},
    // La barre du numérateur remonte jusqu'à la hauteur du sommet.
    {id:"p08",answer:"4/5",paths:[
      [[154,175],[150,185],[140,199],[134,212],[142,212],[168,204],[186,197],[201,189]],
      [[158,178],[161,195],[168,216],[182,248],[190,272]],
      [[115,286],[223,287]],
      denominatorFive
    ]},
    {id:"p08",answer:"4/5",detached:true,paths:[
      [[160,175],[158,186],[152,202],[151,216],[153,220],[161,220],[173,220]],
      [[185,175],[185,197],[182,220],[181,244],[180,270]],
      [[115,286],[223,287]],
      denominatorFive
    ]},
    // Le premier trait descend vers la droite puis croise la hampe.
    {id:"p08",answer:"4/5",paths:[
      [[132,180],[130,183],[136,195],[147,214],[152,213],[177,209],[187,207]],
      [[172,175],[172,194],[173,217],[172,246],[173,272]],
      [[115,286],[223,287]],
      denominatorFive
    ]},
    // Le premier trait démarre bas et descend peu avant la barre.
    {id:"p08",answer:"4/5",paths:[
      [[134,201],[133,207],[136,217],[138,219],[151,221],[169,220],[189,216]],
      [[179,175],[175,183],[174,204],[177,240],[179,272]],
      [[115,286],[223,287]],
      denominatorFive
    ]},
    // La barre revient légèrement en arrière après avoir traversé la hampe.
    {id:"p08",answer:"4/5",paths:[
      [[131,175],[129,192],[128,204],[130,224],[147,227],[176,224],[193,222],[180,221]],
      [[143,191],[139,191],[137,199],[140,214],[149,229],[158,263],[159,272]],
      [[115,286],[223,287]],
      denominatorFive
    ]}
  ];
  for(const {id,answer,detached,paths} of fractions){
    const probabilityContext=await browser.newContext({viewport:{width:320,height:640},isMobile:true,hasTouch:true,locale:"fr-FR"});
    try{
      // Conserver l’ordre de la banque pour atteindre les exercices fixes depuis l’accueil.
      await probabilityContext.addInitScript(()=>{Math.random=()=>0.999999;});
      let probabilityPage=await probabilityContext.newPage();
      probabilityPage.on("pageerror",error=>errors.push(error.message));
      const stored=()=>probabilityPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
      await probabilityPage.goto(BASE+"/?topic=probas",{waitUntil:"networkidle"});
      await probabilityPage.locator("#start").tap();
      await probabilityPage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
      const fractionTouch=await probabilityContext.newCDPSession(probabilityPage);
      await probabilityContext.setOffline(true);
      await probabilityPage.waitForFunction(()=>!navigator.onLine);
      const resumeUrl=probabilityPage.url();
      const {round}=await stored();
      const target=round.ids.indexOf(id);
      assert.ok(target>=round.completed);
      for(let i=round.completed;i<target;i++){
        await probabilityPage.getByRole("button",{name:"Je ne sais pas",exact:true}).tap();
        await probabilityPage.locator("#next").tap();
      }
      const before=await stored();
      assert.equal(before.round.ids[before.round.completed],id);
      const notebook=probabilityPage.locator("#quizNotebook");
      await traceFraction(fractionTouch,notebook.locator("canvas"),paths);
      const copy=(await stored()).workbook.entries["quiz:"+id];
      assert.equal(copy.pages[0].length,paths.length);
      if(detached){
        const [arm,stem]=copy.pages[0].slice(0,2).map(parseStroke);
        assert.ok(Math.max(...arm.map(([x])=>x))<Math.min(...stem.map(([x])=>x)));
      }
      await notebook.locator(".math-notebook-quick-validate").tap();
      const proposed=notebook.locator(".math-notebook-recognition-candidate");
      await proposed.waitFor({state:"visible"});
      assert.equal(await proposed.locator("strong").textContent(),"Lecture proposée : "+answer);
      assert.ok(await probabilityPage.locator("#answerForm").isHidden());
      assert.ok(await probabilityPage.locator("#feedback").isHidden());
      assert.deepEqual((await stored()).round,before.round);
      await proposed.getByRole("button",{name:"Oui, vérifier ce résultat"}).tap();
      await probabilityPage.locator('#feedback[data-result="correct"]').waitFor({state:"visible"});
      const graded=await stored();
      assert.equal(graded.round.completed,before.round.completed+1);
      assert.equal(graded.round.score,before.round.score+1);
      assert.equal(graded.practice.items[id].attempts,1);
      assert.deepEqual(graded.workbook.entries["quiz:"+id],copy);
      await probabilityPage.close();
      probabilityPage=await probabilityContext.newPage();
      probabilityPage.on("pageerror",error=>errors.push(error.message));
      await probabilityPage.goto(resumeUrl,{waitUntil:"domcontentloaded"});
      await probabilityPage.locator("#quiz.paper-mode").waitFor({state:"visible"});
      assert.equal(await probabilityPage.evaluate(()=>navigator.onLine),false);
      assert.deepEqual(await stored(),graded);
      console.log("OK Fraction "+answer+" écrite au doigt à 320 px : correction après confirmation, copie et score restaurés hors ligne");
    }finally{await probabilityContext.close();}
  }

  const examContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"});
  const newExamPage=async()=>{
    const tab=await examContext.newPage();
    tab.setDefaultTimeout(15000);
    tab.on("dialog",dialog=>dialog.accept());
    tab.on("pageerror",error=>errors.push("examen : "+error.message));
    return tab;
  };
  let examPage=await newExamPage();
  const examSnapshot=()=>examPage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
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
    const sheet="#examNotebook .math-notebook-sheet-viewport";
    const viewport=examPage.locator(sheet);
    await drawOnSheet(sheet,examPage);
    const tools=examPage.locator("#examNotebook .math-notebook-paper-tools");
    await tools.locator("summary").click();
    await tools.getByRole("button",{name:"Ajouter une page"}).click();
    await drawOnSheet(sheet,examPage);
    const saved=await examSnapshot();
    assert.equal(saved.exams.active.paperOnly,true);
    const key=Object.keys(saved.workbook.entries).find(k=>k.startsWith("exam:"));
    assert.deepEqual(saved.workbook.entries[key].pages.map(page=>page.length),[1,1]);
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
    const beforeClose=await examSnapshot();
    await examContext.setOffline(true);
    await examPage.close();
    examPage=await newExamPage();
    await examPage.goto(BASE,{waitUntil:"domcontentloaded"});
    const reopenedNavigation=examPage.getByRole("group",{name:"Navigation entre les quatre exercices"});
    await reopenedNavigation.getByRole("button",{name:"Exercice 3 en cours"}).waitFor();
    assert.deepEqual(await examSnapshot(),beforeClose);
    await reopenedNavigation.getByRole("button",{name:"Aller à l'exercice 1"}).click();
    assert.match(await examPage.getByRole("navigation",{name:"Pages de la feuille"}).textContent(),/Page 2\/2/);
    console.log("OK Examen hors ligne après fermeture : exercice actif et deux pages manuscrites retrouvés");

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

    await examPage.reload({waitUntil:"domcontentloaded"});
    await homeSummary.waitFor();
    assert.match(await homeSummary.textContent(),/1 étape à retravailler dans 1 copie/);
    await homeSummary.click();
    const homeRow=homeRevision.getByRole("listitem");
    assert.equal(await homeRow.count(),1);
    assert.match(await homeRow.getByRole("link",{name:"Revoir le cours"}).getAttribute("href"),/course\.html\?course=/);
    await homeRow.getByRole("button",{name:/Exercice 1/}).click();
    await copy.locator("canvas").waitFor({state:"visible"});
    assert.ok(await guide.evaluate(node=>node.contains(document.activeElement)));
    const thumbnails=copy.getByRole("button",{name:"Aperçu des pages"});
    await thumbnails.click();
    await copy.getByRole("dialog",{name:"Aperçu des pages de la copie"})
      .getByRole("button",{name:/Page 2/}).click();
    assert.match(await copy.locator(".math-notebook-page-indicator").textContent(),/Page 2\/2/);
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
    await examContext.setOffline(false);
    console.log("OK Correction : comparaison mobile et bureau, deuxième page et révision retrouvées hors ligne");

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
  for(const scenario of ["sept barré","un à pied","quatre fermé","deux bouclé","retouché","réécrit"]){
    const ambiguous=scenario==="retouché"||scenario==="réécrit";
    const denseContext=await browser.newContext({
      viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:"fr-FR"
    });
    try{
      let densePage=await denseContext.newPage();
      densePage.on("pageerror",error=>errors.push(error.message));
      await densePage.goto(BASE+"/#commencer",{waitUntil:"networkidle"});
      await densePage.locator("#firstStart").click();
      const savedCopy=await densePage.evaluate(async ({ambiguous,scenario})=>{
        const {encodeStroke}=await import("/workbook.mjs");
        const key="daeu-b-data-v1";
        const state=JSON.parse(localStorage.getItem(key));
        const copyKey="quiz:"+state.round.ids[0];
        const strokes=[];
        for(let row=0;row<4;row++){
          const y=35+row*100;
          for(let column=0;column<10;column++){
            const x=48+column*52;
            strokes.push(encodeStroke([[x,y],[x,y+33]]));
            if(column<9){
              strokes.push(encodeStroke([[x+13,y+16],[x+39,y+16]]));
              strokes.push(encodeStroke([[x+26,y+3],[x+26,y+30]]));
            }
          }
          strokes.push(encodeStroke([[531,y+12],[556,y+12]]));
          strokes.push(encodeStroke([[531,y+21],[556,y+21]]));
          strokes.push(encodeStroke([[576,y],[576,y+33]]));
          strokes.push(encodeStroke([[607,y],[596,y+8],[595,y+23],[605,y+33],
            [618,y+29],[624,y+17],[620,y+5],[607,y]]));
        }
        for(const points of [
          [[39,445],[73,487]],[[73,445],[39,487]],
          [[106,461],[142,461]],[[106,471],[142,471]],[[192,443],[192,490]]
        ])strokes.push(encodeStroke(points));
        // Une ancienne réponse lisible en page 1 permet de détecter une
        // validation accidentelle de la page affichée.
        const previousAnswer=[
          ...strokes.slice(-5,-1),
          encodeStroke([[164,455],[173,446],[185,444],[198,449],[201,459],
            [195,467],[181,477],[165,490],[202,490]])
        ];
        if(ambiguous)strokes.splice(-1,1,...[
          [[178,466],[210,466]],[[194,446],[194,489]],
          [[180,451],[208,481]],[[180,481],[208,451]]
        ].map(encodeStroke));
        if(scenario==="deux bouclé")strokes.splice(-1,1,encodeStroke([
          [176,461],[179,445],[195,437],[210,445],[214,463],[206,484],
          [188,508],[170,522],[165,515],[172,506],[190,509],[219,520]
        ]));
        if(scenario==="quatre fermé")strokes.splice(-1,1,encodeStroke([[211,442],[167,492],[212,492],[211,442],[212,520]]));
        if(scenario==="un à pied")strokes.push(encodeStroke([[175,496],[210,496]]));
        if(scenario==="sept barré")strokes.splice(-1,1,...[
          [[170,441],[220,441],[186,514]],[[181,478],[210,478]]
        ].map(encodeStroke));
        const pages=[previousAnswer,strokes,[]];
        state.workbook.entries[copyKey]={text:"",pages};
        state.revision++;
        localStorage.setItem(key,JSON.stringify(state));
        return {copyKey,pages};
      },{ambiguous,scenario});
      assert.ok(savedCopy.pages[1].length>100);
      assert.equal(recognizeFinalEquationInk(savedCopy.pages[0])?.text,"2");
      await densePage.reload({waitUntil:"networkidle"});
      await densePage.locator("#quiz").waitFor({state:"visible"});
      const navigation=densePage.locator("#quizNotebook .math-notebook-paper-navigation");
      const previousPage=navigation.getByRole("button",{name:"Page précédente"});
      const nextPage=navigation.getByRole("button",{name:"Page suivante"});
      while(await nextPage.isEnabled())await nextPage.tap();
      assert.match(await navigation.textContent(),/Page 3\/3/);
      await previousPage.tap();
      await previousPage.tap();
      assert.match(await navigation.textContent(),/Page 1\/3/);
      await densePage.locator("#quizNotebook .math-notebook-quick-validate").tap();
      const stored=()=>densePage.evaluate(()=>JSON.parse(localStorage.getItem("daeu-b-data-v1")));
      assert.equal((await stored()).round.completed,0);
      if(ambiguous){
        assert.match(await navigation.textContent(),/Page 2\/3/);
        const notebook=densePage.locator("#quizNotebook");
        const transcript=notebook.locator(".math-notebook-equations-transcript");
        assert.equal(await transcript.textContent(),"x=□");
        assert.ok(await notebook.locator(".math-notebook-manual-comparison").isHidden());
        assert.ok(await densePage.locator("#answerForm").isHidden());
        const grade=notebook.getByRole("button",{name:"Corriger mon résultat final : x = 1"});
        assert.ok(await grade.isHidden());
        await notebook.getByRole("button",{name:"Écrire le symbole 1"}).tap();
        await densePage.waitForFunction(()=>document.querySelector("#quizNotebook .math-notebook-equations-transcript")?.textContent==="x=1");
        assert.equal((await stored()).round.completed,0);
        await densePage.reload({waitUntil:"networkidle"});
        await densePage.locator("#quiz").waitFor({state:"visible"});
        await notebook.locator(".math-notebook-quick-validate").tap();
        assert.equal(await transcript.textContent(),"x=1");
        if(scenario==="réécrit"){
          await densePage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
          await denseContext.setOffline(true);
          await previousPage.tap();
          assert.ok(await transcript.isHidden(),"Changer de page ferme la lecture de l’ancienne page");
          await nextPage.tap();
          const undo=notebook.getByRole("button",{name:"Annuler le dernier trait"});
          for(let i=0;i<4;i++)await undo.tap();
          const erased=(await stored()).workbook.entries[savedCopy.copyKey];
          assert.equal(erased.inkDrafts?.[1],undefined);
          assert.deepEqual(erased.pages[1],savedCopy.pages[1].slice(0,-4));
          const canvas=notebook.locator("canvas");
          const jump=notebook.getByRole("button",{name:"Aller à la zone d’écriture"});
          if(await jump.isVisible())await jump.tap();
          await canvas.scrollIntoViewIfNeeded();
          const box=await canvas.boundingBox();
          assert.ok(box);
          const point=(x,y)=>[box.x+x*box.width/900,box.y+y*box.height/1200];
          const path=[[164,455],[173,446],[185,444],[198,449],[201,459],
            [195,467],[181,477],[165,490],[202,490]];
          const start=point(...path[0]);
          assert.equal(await densePage.evaluate(([x,y])=>document.elementFromPoint(x,y)?.tagName,start),"CANVAS");
          await densePage.mouse.move(...start);
          await densePage.mouse.down();
          for(const xy of path.slice(1))await densePage.mouse.move(...point(...xy),{steps:3});
          await densePage.mouse.up();
          const rewritten=(await stored()).workbook.entries[savedCopy.copyKey];
          assert.equal(rewritten.pages[1].length,erased.pages[1].length+1);
          savedCopy.pages[1]=rewritten.pages[1];
          const resumeUrl=densePage.url();
          await densePage.close();
          densePage=await denseContext.newPage();
          densePage.on("pageerror",error=>errors.push(error.message));
          await densePage.goto(resumeUrl,{waitUntil:"domcontentloaded"});
          await densePage.locator("#quiz.paper-mode").waitFor({state:"visible"});
          assert.deepEqual((await stored()).workbook.entries[savedCopy.copyKey],rewritten);
          assert.equal(await densePage.evaluate(()=>navigator.onLine),false);
          const reopenedNotebook=densePage.locator("#quizNotebook");
          await reopenedNotebook.locator(".math-notebook-quick-validate").tap();
          const candidate=reopenedNotebook.locator(".math-notebook-recognition-candidate");
          assert.match(await candidate.locator(".math-notebook-recognition-source").textContent(),/^Page 2 de ta copie · x=2$/);
          assert.equal((await stored()).round.completed,0);
          await candidate.getByRole("button",{name:"Oui, vérifier ce résultat"}).tap();
        }else await grade.tap();
      }else{
        const candidate=densePage.locator("#quizNotebook .math-notebook-recognition-candidate");
        assert.ok(await candidate.isVisible(),scenario+" · "+await densePage.locator("#quizNotebook [role=status]").allTextContents());
        assert.equal(await candidate.locator(".math-notebook-recognition-source").textContent(),
          "Page 2 de ta copie · x="+({"un à pied":"1","sept barré":"7","quatre fermé":"4","deux bouclé":"2"}[scenario]));
        await candidate.getByRole("button",{name:"Oui, vérifier ce résultat"}).tap();
      }
      await densePage.locator("#feedback").waitFor({state:"visible"});
      const corrected=await stored();
      assert.equal(corrected.round.completed,1);
      assert.deepEqual(corrected.workbook.entries[savedCopy.copyKey].pages,savedCopy.pages);
      assert.equal(corrected.round.assistedIds.includes(savedCopy.copyKey.slice(5)),scenario==="retouché");
      if(scenario==="réécrit"){
        const questionId=savedCopy.copyKey.slice(5);
        assert.equal(await densePage.evaluate(()=>navigator.onLine),false);
        assert.equal(corrected.practice.items[questionId].attempts,1);
        await denseContext.setOffline(false);
        await densePage.waitForFunction(()=>navigator.onLine);
        await densePage.reload({waitUntil:"domcontentloaded"});
        await densePage.locator("#quiz.paper-mode").waitFor({state:"visible"});
        assert.equal(await densePage.locator("#quizCount").textContent(),"Question 2 / 10");
        const resumed=await stored();
        assert.deepEqual(resumed.round,corrected.round);
        assert.deepEqual(resumed.practice.items[questionId],corrected.practice.items[questionId]);
        assert.deepEqual(resumed.workbook.entries[savedCopy.copyKey],corrected.workbook.entries[savedCopy.copyKey]);
        console.log("OK Reconnexion : une seule tentative, copie intacte et reprise à la question 2");
      }
      console.log(scenario==="réécrit"?"OK Trait réécrit hors ligne : copie restaurée après fermeture, nouveau résultat confirmé":ambiguous?"OK Dernière page ambiguë : retouche tactile restaurée, copie conservée":
        "OK Copie dense sur deux pages : "+scenario+" reconnu en page 2 et validé au toucher");
    }finally{await denseContext.close();}
  }

  await verifyPwaUpgrade(browser);
  assert.deepEqual(errors,[]);
  console.log("PAPER-ONLY ANDROID : OK");
}finally{await context.close();await browser.close();}
