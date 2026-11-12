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
// Le réseau ou le service cloud ne doivent JAMAIS retarder les cours hors connexion.
// Une récupération distante déclenche un rechargement sécurisé de l'interface.
const cloudReady=initCloudSync(localStorage,knownIds,{onRestored:()=>location.reload()})
  .catch(()=>{/* L'application reste disponible même si le cloud ne répond pas. */});
await import("./app.mjs");
initCloudInterface();
// Ne pas await cloudReady : l'interface est immédiatement utilisable hors ligne.
void cloudReady;
