import test from "node:test";
import assert from "node:assert/strict";
import {TOPICS} from "./questions.mjs";
import {injectVariants} from "./variants.mjs";
import {flatten,emptyState} from "./engine.mjs";
import {createPersistence,createVolatileStorage,DATA_KEY} from "./persistence.mjs";
import {chooseRecovery,parseValidatedBundle,restoreAutoBackup} from "./auto-backup.mjs";
const known=new Set(flatten(injectVariants(TOPICS)).map(q=>q.id));
const make=(updates=0)=>{
  const memory=createVolatileStorage();
  const p=createPersistence(memory,known);
  for(let i=0;i<updates;i++)p.updatePractice(emptyState());
  return memory.getItem(DATA_KEY);
};
test("restauration automatique de la dernière révision valide",()=>{
  const old=make(1),fresh=make(4);
  assert.equal(chooseRecovery(old,fresh,known).source,"mirror");
  assert.equal(chooseRecovery(fresh,old,known).source,"local");
  assert.equal(chooseRecovery(fresh,fresh,known).source,"local");
  assert.equal(chooseRecovery(null,fresh,known).source,"mirror");
  assert.equal(chooseRecovery(null,null,known).source,"none");
  assert.equal(parseValidatedBundle(fresh,known).revision,4);
});
test("Les données invalides ne peuvent écraser une copie saine",()=>{
  const good=make(3);
  for(const bad of ["","{","[]","null",JSON.stringify({version:1,revision:999999999}),"x".repeat(2_000_001)]){
    assert.equal(parseValidatedBundle(bad,known),null);
    assert.equal(chooseRecovery(good,bad,known).source,"local");
    assert.equal(chooseRecovery(bad,good,known).source,"mirror");
  }
});
test("Restaurer un bundle complet d'un stockage indépendant, sans migration de format",async()=>{
  const memory=createVolatileStorage();
  const expected=make(6);
  const backend={async read(){return expected;},async write(){throw Error("N'écrivez pas si copie miroir plus récente");}};
  const result=await restoreAutoBackup(memory,known,backend);
  assert.equal(result.source,"mirror");
  assert.equal(memory.getItem(DATA_KEY),expected);
  const restored=createPersistence(memory,known).snapshot();
  assert.equal(restored.revision,6);
  assert.deepEqual(restored.exams,{version:1,active:null,history:[]});
});
test("Réparer une sauvegarde secondaire dépassée sans perdre le stockage principal",async()=>{
  const memory=createVolatileStorage(),latest=make(7),previous=make(1);
  memory.setItem(DATA_KEY,latest);
  const written=[];
  const backend={async read(){return previous;},async write(raw){written.push(raw);}};
  const result=await restoreAutoBackup(memory,known,backend);
  assert.equal(result.source,"local");
  assert.deepEqual(written,[latest]);
  assert.equal(memory.getItem(DATA_KEY),latest);
});
