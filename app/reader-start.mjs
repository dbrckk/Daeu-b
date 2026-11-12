/** Démarrage unifié des lecteurs : récupération locale avant montage, cloud non bloquant. */
import {TOPICS} from "./questions.mjs";
import {injectVariants} from "./variants.mjs";
import {flatten} from "./engine.mjs";
import {initializeAutoBackup} from "./auto-backup.mjs";
import {initCloudSync} from "./cloud-sync.mjs";
const knownIds=new Set(flatten(injectVariants(TOPICS)).map(q=>q.id));
try{await initializeAutoBackup(localStorage,knownIds);}catch{/* Lecteurs encore utilisables. */}
const cloudReady=initCloudSync(localStorage,knownIds,{onRestored:()=>location.reload()}).catch(()=>{});
if(location.pathname.endsWith("/course.html"))await import("./course-reader.mjs");
else if(location.pathname.endsWith("/problems.html"))await import("./problems-reader.mjs");
void cloudReady;
