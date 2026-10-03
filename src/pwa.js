(()=>{
  const installButton=document.getElementById('installAppBtn');
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
  let installPrompt=null;

  function hideInstallButton(){
    if(!installButton)return;
    installButton.hidden=true;
    installButton.setAttribute('aria-hidden','true');
  }

  if(standalone)hideInstallButton();
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
    if(!installButton||standalone)return;
    installButton.hidden=false;
    installButton.removeAttribute('aria-hidden');
  });
  window.addEventListener('appinstalled',()=>{
    installPrompt=null;
    hideInstallButton();
  });
  installButton?.addEventListener('click',async()=>{
    if(!installPrompt)return;
    installButton.disabled=true;
    try{
      await installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt=null;
      hideInstallButton();
    }finally{
      installButton.disabled=false;
    }
  });

  if(!('serviceWorker' in navigator)||!(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))return;
  const hadController=Boolean(navigator.serviceWorker.controller);
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(hadController&&!reloading){reloading=true;location.reload();}
  });
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(error=>{
      console.warn('Pixel Life offline mode could not start.',error);
    });
  });
})();
