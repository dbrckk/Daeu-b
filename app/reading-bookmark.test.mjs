import test from "node:test";
import assert from "node:assert/strict";
import {LAST_READING_KEY,bookmarkKey,readBookmark,readBookmarkEntry,saveBookmark,clearBookmark,readLastReading,saveLastReading} from "./reading-bookmark.mjs";
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
 assert.deepEqual(readBookmarkEntry(s,"problemes:sujets"),{sectionId:"lecture-section-2"});
 assert.equal(saveBookmark(s,"transferts-b:sujets","lecture-section-9",{jalon:9}),true);
 assert.deepEqual(readBookmarkEntry(s,"transferts-b:sujets"),{sectionId:"lecture-section-9",jalon:9});
 assert.equal(readBookmark(s,"transferts-b:sujets"),"lecture-section-9");
 assert.equal(readBookmark(s,"transferts-b:corriges"),null);
 assert.equal(readBookmark(s,"transferts-c:sujets"),null);
 assert.equal(clearBookmark(s,"transferts-b:sujets"),true);
 assert.equal(readBookmarkEntry(s,"transferts-b:sujets"),null);
 assert.equal(saveLastReading(s,"problemes:sujets","lecture-section-5"),true);
 assert.deepEqual(readLastReading(s),{documentId:"problemes:sujets",sectionId:"lecture-section-5"});
 assert.equal(readBookmark(s,"problemes:sujets"),"lecture-section-2");
 assert.equal(saveLastReading(s,"transferts-c:corriges","lecture-section-19",19),true);
 assert.deepEqual(readLastReading(s),{documentId:"transferts-c:corriges",sectionId:"lecture-section-19",jalon:19});
});
test("identifiants invalides refusés et valeurs corrompues ignorées",()=>{
 const s=storage();
 for(const doc of ["","cours:../../secret","cours:99-evil","problemes:other","transferts-d:sujets","__proto__"]){
   assert.equal(bookmarkKey(doc),null);
   assert.equal(saveBookmark(s,doc,"lecture-section-1"),false);
   assert.equal(clearBookmark(s,doc),false);
 }
 for(const section of ["","../../x","#bad","a".repeat(102)," <script>"]){
   assert.equal(saveBookmark(s,"cours:01-calcul-numerique",section),false);
 }
 s.setItem(bookmarkKey("cours:01-calcul-numerique"),"../../corrupted");
 assert.equal(readBookmark(s,"cours:01-calcul-numerique"),null);
 assert.equal(saveLastReading(s,"problemes:sujets","../../corrupted"),false);
 s.setItem(LAST_READING_KEY,JSON.stringify({documentId:"../../corrupted",sectionId:"lecture-section-1"}));
 assert.equal(readLastReading(s),null);
 const denied={getItem(){throw Error("denied");},setItem(){throw Error("denied");},removeItem(){throw Error("denied");}};
 assert.equal(readBookmark(denied,"cours:01-calcul-numerique"),null);
 assert.equal(saveBookmark(denied,"cours:01-calcul-numerique","lecture-section-1"),false);
 assert.equal(clearBookmark(denied,"cours:01-calcul-numerique"),false);
 assert.equal(readLastReading(denied),null);
 assert.equal(saveLastReading(denied,"cours:01-calcul-numerique","lecture-section-1"),false);
});
