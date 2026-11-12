/**
 * Restaure la copie locale secondaire AVANT toute lecture/écriture du moteur.
 * Une indisponibilité d'IndexedDB ne doit jamais bloquer l'application.
 */
import {TOPICS} from "./questions.mjs";
import {injectVariants} from "./variants.mjs";
import {flatten} from "./engine.mjs";
import {initializeAutoBackup} from "./auto-backup.mjs";
import {initCloudSync,initCloudInterface} from "./cloud-sync.mjs";
const knownIds=new Set(flatten(injectVariants(TOPICS)).map(q=>q.id));
try{await initializeAutoBackup(localStorage,knownIds);}
catch{/* Le module principal dispose d'un repli mémoire propre. */}
try{await initCloudSync(localStorage,knownIds);}
catch{/* La synchronisation distante ne bloque jamais les exercices locaux. */}
await import("./app.mjs");
initCloudInterface();
