// L'utilisateur choisit le moment du rechargement, y compris pendant une copie.
const button=document.getElementById("appUpdate");
const status=document.getElementById("appUpdateStatus");
const serviceWorker=navigator.serviceWorker;
if(button&&status&&serviceWorker&&isSecureContext){
  const initialController=serviceWorker.controller;
  let readyToReload=false;

  serviceWorker.addEventListener("controllerchange",()=>{
    if(!initialController||serviceWorker.controller===initialController)return;
    readyToReload=true;
    button.textContent="Ouvrir la nouvelle version";
    status.textContent="Mise à jour prête. Termine ton trait avant de recharger. Tes données sauvegardées sont conservées.";
  });

  const registration=serviceWorker.register("./sw.js",{updateViaCache:"none"});
  registration.then(()=>{button.hidden=false;}).catch(()=>{});
  button.addEventListener("click",async()=>{
    if(readyToReload){
      location.reload();
      return;
    }
    button.disabled=true;
    status.textContent="Recherche d’une mise à jour…";
    try{
      const worker=await registration;
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
}
