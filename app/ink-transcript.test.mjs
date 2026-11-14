import test from "node:test";
import assert from "node:assert/strict";
import {INK_EDIT_SYMBOLS,editInkTranscript,validateInkTranscript,validInkDraft} from "./ink-transcript.mjs";
import {checkMathSteps} from "./math-step-checker.mjs";
import {extractFinalNumericAnswer} from "./equation-ink.mjs";

test("une équation partiellement illisible n'est jamais notée",()=>{
  assert.equal(validInkDraft("2x□5=17\nx=6"),true);
  assert.equal(validateInkTranscript("2x□5=17\nx=6"),false);
  assert.equal(validateInkTranscript("2x+5=17\nx=6"),true);
});
test("correction sans clavier d'un opérateur mal reconnu",()=>{
  const before="2x□5=17\n2x=12\nx=6";
  const result=editInkTranscript(before,2,"replace","+");
  assert.equal(result,"2x+5=17\n2x=12\nx=6");
  assert.equal(validateInkTranscript(result),true);
  assert.equal(extractFinalNumericAnswer(result),"6");
  assert.equal(checkMathSteps(result).errors,0);
});
test("insertion d'un caractère manquant, effacement et nouvelle ligne",()=>{
  const missing="2x5=17";
  const inserted=editInkTranscript(missing,2,"insert","+");
  assert.equal(inserted,"2x+5=17");
  assert.equal(editInkTranscript(inserted,2,"delete"),missing);
  assert.equal(editInkTranscript("x=3",1,"newline"),"x\n=3");
  assert.equal(validateInkTranscript("x\n=3"),false);
});
test("syntaxique : seules les égalités complètes et équilibrées sont évaluables",()=>{
  const valid=["x=3","x=1/2","2(x+1)=8\nx=3","x^2=4","x=-3"];
  for(const src of valid)assert.equal(validateInkTranscript(src),true,src);
  const invalid=["", "x=□", "x", "=3","x=","x=1=2","2(x+1=8","x^(2)=4","x^3=9",
    "x=1\n", "x=1\n\nx=2", "x=1\n".repeat(20), "x=1\n<script>alert(1)</script>"];
  for(const src of invalid)assert.equal(validateInkTranscript(src),false,JSON.stringify(src));
});
test("alphabet et limites interdisent injection, corruption et sorties du cahier",()=>{
  assert.ok(!INK_EDIT_SYMBOLS.includes("<"));
  assert.equal(validInkDraft("<svg>"),false);
  assert.throws(()=>editInkTranscript("x=1",0,"replace","<"));
  assert.throws(()=>editInkTranscript("x=1",-1,"replace","2"));
  assert.throws(()=>editInkTranscript("x=1",999,"insert","2"));
  assert.throws(()=>editInkTranscript("x=1",0,"exec","2"));
  assert.throws(()=>editInkTranscript("a".repeat(1200),0,"replace","x"));
});

test("Éditeur tactile : une racine et une fraction rationnelle ne sont pas du HTML",()=>{
  assert.ok(INK_EDIT_SYMBOLS.includes("√"));
  for(const line of ["x=√(9)","x=√(x)","x=2/(x+1)","x=(x+1)/(x-1)"]){
    assert.equal(validateInkTranscript(line),true,line);
  }
  for(const line of ["x=√9","x=√()","x=√(9","x=2/□","x=√<9>"]){
    assert.equal(validateInkTranscript(line),false,line);
  }
  assert.equal(editInkTranscript("x=□(9)",2,"replace","√"),"x=√(9)");
  assert.equal(checkMathSteps("x=√(2)").checked,1,"La valeur √2 est vérifiée exactement, sans calcul flottant");
  assert.equal(checkMathSteps("x=√(2)").unsupported,0);
});
