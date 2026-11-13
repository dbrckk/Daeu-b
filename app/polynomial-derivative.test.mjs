import test from "node:test";
import assert from "node:assert/strict";
import {parseDerivativePolynomial as p,differentiatePolynomial as derive,formatPolynomialExact as fmt,comparePolynomialExact as same,firstDerivativeDifference} from "./polynomial-derivative.mjs";

test("Polynômes de degrés 3 à 6 et dérivation exacte",()=>{
 assert.equal(fmt(derive(p("x³-4x²+2x-1"))),"3x² − 8x + 2");
 assert.equal(fmt(derive(p("3x⁶ - 2x⁴ + x² - 5"))),"18x⁵ − 8x³ + 2x");
 assert.equal(fmt(derive(p("x^5 + x^3 + x"))),"5x⁴ + 3x² + 1");
 assert.equal(fmt(derive(p("-7"))),"0");
 assert.equal(fmt(derive(p("2x² + 3x + 1"))),"4x + 3");
});
test("Règles des produits et puissances développées sans approximation",()=>{
 assert.equal(fmt(derive(p("(x+1)^3"))),"3x² + 6x + 3");
 assert.equal(fmt(derive(p("(x²+1)(x-1)"))),"3x² − 2x + 1");
 assert.equal(fmt(derive(p("x(x+1)(x-1)"))),"3x² − 1");
 assert.equal(fmt(derive(p("(x+1)^2(x-1)^2"))),"4x³ − 4x");
 assert.equal(fmt(p("(x+1)^0")),"1");
});
test("Décimaux français, fractions exactes, égalités de formes",()=>{
 const a=derive(p("1/3x³+1/2x²"));
 const b=p("x²+x");
 assert.equal(same(a,b),true);
 assert.equal(same(a,p("0,999999x²+x")),false);
 assert.equal(fmt(p("3/4x³ - 1/2x")),"3/4x³ − 1/2x");
 assert.equal(firstDerivativeDifference(p("3x²"),p("6x²")),"Terme x² : coefficient attendu 6, obtenu 3.");
});
test("Expression hostile, degré >6, dénominateur x et surcharges rejetés",()=>{
 for(const raw of [
  "x^7","x⁶*x","(x+1)^7","(x+1)^6*x","1/x","x/(x+1)",
  "sin(x)","ln(x)","Math.random()","x**2","x=2","x^(-2)","x²^2",
  "x^2.5","2e9","x+<script>","(x+1)^3(x+1)^4","1/0"
 ])assert.throws(()=>p(raw),raw);
 assert.throws(()=>p("(".repeat(30)+"x"+")".repeat(30)));
 assert.throws(()=>p("9".repeat(100)));
});
