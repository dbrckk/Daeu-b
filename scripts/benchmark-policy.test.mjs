import test from "node:test";
import assert from "node:assert/strict";
import {normalizeInk,inkOutcome,eligibleInkFallback} from "./benchmark-policy.mjs";

test("notations LaTeX courantes comparées sans équivalence algébrique",()=>{
  assert.equal(normalizeInk(String.raw`\frac{3}{4}`),"3/4");
  assert.equal(normalizeInk(String.raw`x ^{2} = 4`),"x^2=4");
  assert.equal(inkOutcome(String.raw`\frac{3}{4}`,"3/4"),"exact");
  assert.equal(inkOutcome("x+x","2x"),"error");
  assert.equal(inkOutcome(null,"2"),"abstention");
});
test("fractions isolées : rejeter zéro, caractères étrangers et chiffres ajoutés non vérifiables",()=>{
  assert.equal(eligibleInkFallback(String.raw`\frac{3}{4}`,"crohme-isolated-fraction"),true);
  assert.equal(eligibleInkFallback("3/0","crohme-isolated-fraction"),false);
  assert.equal(eligibleInkFallback("3/4+1","crohme-isolated-fraction"),false);
  assert.equal(eligibleInkFallback("3/4","synthetic"),false);
});
test("égalités : accepter une forme valide sans la confondre avec une lecture exacte",()=>{
  assert.equal(eligibleInkFallback("x=4","crohme-equation"),true);
  assert.equal(eligibleInkFallback("x==4","crohme-equation"),false);
  assert.equal(eligibleInkFallback("x=4<script>","crohme-equation"),false);
  assert.equal(eligibleInkFallback("x=4","synthetic"),false);
  assert.equal(inkOutcome("x=5","x=4"),"error");
});
