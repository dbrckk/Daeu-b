import test from "node:test";
import assert from "node:assert/strict";
import {decideFractionFallback} from "./fraction-consensus.mjs";

const valid={
  whole:String.raw`\frac{12}{7}`,
  parts:[["numerator"],["denominator"]],
  rows:[{local:null,seshat:"12"},{local:null,seshat:"7"}]
};

test("Accepter une fraction isolée quand les deux lignes concordent",()=>{
  assert.deepEqual(decideFractionFallback(valid),{
    candidate:"12/7",source:"seshat-consensus",reason:"agreement"
  });
  assert.equal(decideFractionFallback({...valid,whole:"12/7"}).candidate,"12/7");
  assert.equal(decideFractionFallback({...valid,rows:[
    {local:"12",seshat:"12"},{local:"7",seshat:"7"}
  ]}).candidate,"12/7");
});

test("La lecture locale entière garde toujours la priorité",()=>{
  assert.deepEqual(decideFractionFallback({...valid,local:"3/8"}),{
    candidate:"3/8",source:"local",reason:"local-priority"
  });
});

test("Refuser les mauvaises formes, dénominateurs nuls et structures incomplètes",()=>{
  for(const whole of ["1/0","1/07","1/7=1","x/7","1+1/7","1/","1/2/3","1\\\\times2","",null]){
    assert.equal(decideFractionFallback({...valid,whole}).candidate,null,String(whole));
  }
  assert.equal(decideFractionFallback({...valid,parts:null}).reason,"invalid-geometry");
  assert.equal(decideFractionFallback({...valid,parts:[[]]}).reason,"invalid-geometry");
  assert.equal(decideFractionFallback({...valid,rows:null}).reason,"missing-row-readings");
  assert.equal(decideFractionFallback({...valid,rows:[valid.rows[0]]}).reason,"missing-row-readings");
});

test("Refuser toute contradiction entre les deux lectures indépendantes",()=>{
  const examples=[
    [{local:null,seshat:"12"},{local:null,seshat:"1"}],
    [{local:null,seshat:"1"},{local:null,seshat:"7"}],
    [{local:"11",seshat:"12"},{local:null,seshat:"7"}],
    [{local:null,seshat:"12"},{local:"1",seshat:"7"}],
    [{local:null,seshat:"12",error:"timeout"},{local:null,seshat:"7"}],
    [{local:null,seshat:"12"},{local:null,seshat:"7+1"}],
    [{local:null,seshat:"12"},{local:null,seshat:null}]
  ];
  for(const rows of examples)assert.equal(decideFractionFallback({...valid,rows}).candidate,null);
});
