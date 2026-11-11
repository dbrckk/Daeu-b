import test from "node:test";
import assert from "node:assert/strict";
import {bookmarkKey,readBookmark,saveBookmark,clearBookmark} from "./reading-bookmark.mjs";
const storage=()=>{const m=new Map();return {
 getItem:k=>m.has(k)?m.get(k):null,
 setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)
};};
test("signet propre à chaque cours et indépendant des copies",()=>{
 const s=storage();
 assert.equal(saveBookmark(s,"cours:07-limites-asymptotes","lecture-section-4"),true);
 assert.equal(readBookmark(s,"cours:07-limites-asymptotes"),"lecture-section-4");
 assert.equal(readBookmark(s,"cours:08-continuite-tvi"),null);
 assert.equal(readBookmark(s,"problemes:sujets"),null);
 assert.equal(saveBookmark(s,"problemes:sujets","lecture-section-2"),true);
 assert.equal(readBookmark(s,"problemes:corriges"),null);
 assert.equal(clearBookmark(s,"cours:07-limites-asymptotes"),true);
 assert.equal(readBookmark(s,"cours:07-limites-asymptotes"),null);
 assert.equal(readBookmark(s,"problemes:sujets"),"lecture-section-2");
});
test("identifiants invalides refusés et valeurs corrompues ignorées",()=>{
 const s=storage();
 for(const doc of ["","cours:../../secret","cours:99-evil","problemes:other","__proto__"]){
   assert.equal(bookmarkKey(doc),null);
   assert.equal(saveBookmark(s,doc,"lecture-section-1"),false);
   assert.equal(clearBookmark(s,doc),false);
 }
 for(const section of ["","../../x","#bad","a".repeat(102)," <script>"]){
   assert.equal(saveBookmark(s,"cours:01-calcul-numerique",section),false);
 }
 s.setItem(bookmarkKey("cours:01-calcul-numerique"),"../../corrupted");
 assert.equal(readBookmark(s,"cours:01-calcul-numerique"),null);
 const denied={getItem(){throw Error("denied");},setItem(){throw Error("denied");},removeItem(){throw Error("denied");}};
 assert.equal(readBookmark(denied,"cours:01-calcul-numerique"),null);
 assert.equal(saveBookmark(denied,"cours:01-calcul-numerique","lecture-section-1"),false);
 assert.equal(clearBookmark(denied,"cours:01-calcul-numerique"),false);
});
