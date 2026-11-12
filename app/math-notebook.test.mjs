import test from "node:test";
import assert from "node:assert/strict";
import {notebookKey,insertAtSelection,insertTemplate,MATH_TEMPLATES} from "./math-notebook.mjs";
test("Les cahiers sont distincts par question et examen",()=>{
 assert.notEqual(notebookKey("quiz:q-1"),notebookKey("quiz:q-2"));
 assert.notEqual(notebookKey("quiz:q-1"),notebookKey("exam:a"));
 assert.throws(()=>notebookKey("../injection"));
});
test("Insertion au curseur et remplacement d'une sélection",()=>{
 assert.deepEqual(insertAtSelection("2x = 12","÷",3,4),{value:"2x ÷ 12",caret:4});
 assert.deepEqual(insertAtSelection("x", "²",1,1),{value:"x²",caret:2});
 assert.deepEqual(insertAtSelection("", "\n",0,0),{value:"\n",caret:1});
});
test("Limite stricte de longueur et indices bornés",()=>{
 const x=insertAtSelection("a".repeat(12000),"×",12000,12000);
 assert.equal(x.value.length,6000);
 assert.equal(insertAtSelection("abc","π",-10,999).value,"π");
});

test("Modèles : fraction, équation et système insérés à la sélection",()=>{
  assert.ok(MATH_TEMPLATES.some(x=>x.label==="Fraction"));
  assert.ok(MATH_TEMPLATES.some(x=>x.label==="Système"));
  const fraction=MATH_TEMPLATES.find(x=>x.label==="Fraction");
  const inserted=insertTemplate("Calcul : ",fraction,9,9);
  assert.equal(inserted.value,"Calcul : (numérateur)/(dénominateur)");
  assert.equal(inserted.value.slice(inserted.start,inserted.end),"numérateur");
  const eq=insertTemplate("",MATH_TEMPLATES.find(x=>x.label==="Équation"),0,0);
  assert.ok(eq.value.includes("\\nx = 6"));
  assert.equal(eq.value.slice(eq.start,eq.end),"2x + 5 = 17");
});
