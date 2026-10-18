/* Replace the synthetic H8 face with the supplied photographic front panel.
   The existing #keypad node is moved, not recreated, so 17-keypad.js keeps all
   original PAM-8 event handlers and firmware integration. */
(function(){
  function install(){
    const machine=document.querySelector('.machine');
    const panel=document.getElementById('keypad');
    if(!machine||!panel)return;
    machine.classList.add('authentic-h8');
    const old=machine.querySelector('.h8-panel');
    if(old) old.classList.add('authentic-h8-surface');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
