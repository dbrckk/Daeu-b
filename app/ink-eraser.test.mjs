import test from "node:test";
import assert from "node:assert/strict";
import {nearestInkStroke} from "./ink-eraser.mjs";
import {encodeStroke} from "./workbook.mjs";

const line=(a,b)=>encodeStroke([a,b]);
test("gomme tactile : sélection du trait géométriquement le plus proche",()=>{
  const page=[
    line([20,20],[200,20]),
    line([20,50],[200,50]),
    line([20,80],[200,80])
  ];
  assert.equal(nearestInkStroke(page,[110,22]),0);
  assert.equal(nearestInkStroke(page,[110,52]),1);
  assert.equal(nearestInkStroke(page,[110,78]),2);
  assert.equal(nearestInkStroke(page,[110,112]),null);
  assert.equal(nearestInkStroke(page,[201,50]),1);
});
test("gomme : les intersections préfèrent les traits ajoutés le plus récemment",()=>{
  const a=line([20,50],[150,50]),b=line([85,10],[85,100]);
  assert.equal(nearestInkStroke([a,b],[85,50]),1);
});
test("gomme : un point et des données invalides ne suppriment rien à distance",()=>{
  assert.equal(nearestInkStroke([encodeStroke([[50,50]])],[50,50]),0);
  assert.equal(nearestInkStroke([encodeStroke([[50,50]])],[100,100]),null);
  assert.equal(nearestInkStroke(["<script>"],[50,50]),null);
  assert.equal(nearestInkStroke([line([1,1],[30,30])],[NaN,1]),null);
  assert.equal(nearestInkStroke([line([1,1],[30,30])],[-1,1]),null);
  assert.equal(nearestInkStroke(Array(101).fill("1,1;2,2"),[1,1]),null);
});
test("gomme : la distance se calcule au segment, pas seulement aux extrémités",()=>{
  assert.equal(nearestInkStroke([line([100,100],[300,100])],[200,108]),0);
  assert.equal(nearestInkStroke([line([100,100],[300,100])],[200,120]),null);
});
