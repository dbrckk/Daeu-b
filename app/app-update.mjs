// L'utilisateur choisit le moment du rechargement, y compris pendant une copie.
const button=document.getElementById("appUpdate");
const status=document.getElementById("appUpdateStatus");
const offline=document.getElementById("offlineStatus");
const retry=document.getElementById("offlineRetry");
const serviceWorker=navigator.serviceWorker;
const offlineMessages={
  preparing:"Préparation des cours et exercices pour le hors connexion…",
  ready:"Cours et exercices disponibles hors connexion.",
  failed:"Le téléchargement est incomplet. Rétablis la connexion puis réessaie.",
  unavailable:"Le hors connexion n’est pas disponible dans ce navigateur."
};
function showOffline(state){
  if(!offline||!retry)return;
  offline.dataset.state=state;
  offline.textContent=offlineMessages[state];
  retry.hidden=state!=="failed";
}

if(button&&status&&serviceWorker&&isSecureContext){
  const initialController=serviceWorker.controller;
  let readyToReload=false;
  let registration,watching=null,revision=0;

  function requestOffline(worker,type,timeout){
    return new Promise((resolve,reject)=>{
      const channel=new MessageChannel();
      const finish=(complete)=>{
        clearTimeout(timer);
        channel.port1.close();
        resolve(complete);
      };
      const timer=setTimeout(()=>finish(false),timeout);
      channel.port1.onmessage=event=>finish(event.data?.complete===true);
      try{worker.postMessage({type},[channel.port2]);}
      catch(error){clearTimeout(timer);channel.port1.close();reject(error);}
    });
  }
  async function checkOffline(type="offline-status"){
    const worker=serviceWorker.controller;
    if(worker?.state!=="activated")return;
    const check=++revision;
    const complete=await requestOffline(worker,type,type==="offline-retry"?90_000:4000).catch(()=>false);
    if(check===revision&&worker===serviceWorker.controller)showOffline(complete?"ready":"failed");
  }
  function watchWorker(worker){
    if(!worker)return;
    if(!serviceWorker.controller)showOffline("preparing");
    const onState=()=>{
      if(worker.state==="activated"){
        void checkOffline();
        worker.removeEventListener("statechange",onState);
      }else if(worker.state==="redundant"){
        if(!serviceWorker.controller)showOffline("failed");
        worker.removeEventListener("statechange",onState);
      }
    };
    worker.addEventListener("statechange",onState);
    onState();
  }
  async function register(){
    try{
      const worker=await serviceWorker.register("./sw.js",{updateViaCache:"none"});
      if(watching!==worker){
        watching=worker;
        worker.addEventListener("updatefound",()=>watchWorker(worker.installing));
      }
      const candidate=worker.installing||worker.waiting||worker.active;
      if(candidate)watchWorker(candidate);
      else showOffline("failed");
      button.hidden=false;
      return worker;
    }catch{
      if(!serviceWorker.controller)showOffline("failed");
      else void checkOffline();
      return null;
    }
  }

  serviceWorker.addEventListener("controllerchange",()=>{
    watchWorker(serviceWorker.controller);
    if(!initialController||serviceWorker.controller===initialController)return;
    readyToReload=true;
    button.textContent="Ouvrir la nouvelle version";
    status.textContent="Mise à jour prête. Tu peux l’ouvrir quand tu as terminé ta saisie.";
  });

  showOffline("preparing");
  registration=register();
  retry?.addEventListener("click",async()=>{
    showOffline("preparing");
    if(serviceWorker.controller?.state==="activated"){
      await checkOffline("offline-retry");
    }else{
      registration=register();
      await registration;
    }
  });
  window.addEventListener("pageshow",event=>{
    if(event.persisted&&offline?.dataset.state!=="preparing")void checkOffline();
  });
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden&&offline?.dataset.state!=="preparing")void checkOffline();
  });
  button.addEventListener("click",async()=>{
    if(readyToReload){
      if(!document.dispatchEvent(new Event("daeu:before-update",{cancelable:true}))){
        status.textContent="Le brouillon du quiz n’a pas pu être enregistré. Vérifie le stockage, puis réessaie.";
        return;
      }
      location.reload();
      return;
    }
    button.disabled=true;
    status.textContent="Recherche d’une mise à jour…";
    try{
      const worker=await registration;
      if(!worker)throw new Error("Service worker indisponible");
      await worker.update();
      const installing=worker.installing;
      if(!readyToReload&&installing){
        status.textContent="Téléchargement de la mise à jour…";
        installing.addEventListener("statechange",()=>{
          if(installing.state==="redundant"&&!readyToReload){
            status.textContent="Le téléchargement a échoué. Réessaie avec une connexion stable.";
          }
        });
      }else if(!readyToReload&&!worker.waiting){
        status.textContent="Aucune nouvelle version trouvée.";
      }
    }catch{
      if(!readyToReload)status.textContent="Vérification indisponible. Réessaie avec une connexion Internet.";
    }finally{
      button.disabled=false;
    }
  });
}else showOffline("unavailable");
