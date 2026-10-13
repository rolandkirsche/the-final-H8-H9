/* ============================================================
   UI-Verdrahtung & Start
   ============================================================ */
document.getElementById("btnDemo").addEventListener("click",loadDemo);
document.getElementById("btnHello").addEventListener("click",loadHello);
document.getElementById("btnReverser").addEventListener("click",loadReverser);
document.getElementById("btnBasic").addEventListener("click",(e)=>loadBasic(e.currentTarget));
document.getElementById("btnExBasic").addEventListener("click",(e)=>loadExBasic(e.currentTarget));
document.getElementById("btnAceyDucey").addEventListener("click",(e)=>loadAceyDucey(e.currentTarget));
document.getElementById("btnReset").addEventListener("click",romDoReset);
document.getElementById("btnHelp").addEventListener("click",()=>{
  document.getElementById("help").classList.toggle("open");
});

// RESET-Taste: H8 weich zuruecksetzen (CPU, RAM, USART), Schirm loeschen, Extended BASIC neu booten.
// Laeuft gerade noch der erste Bootvorgang, wird stattdessen die Seite neu geladen (sauberster Neustart).
const h9resetBtn=document.getElementById("h9reset");
if(/[?&]cal\b/.test(location.search)) document.body.classList.add("cal");   // ?cal zeigt die RESET-Flaeche rot umrandet
h9resetBtn.addEventListener("mousedown",ev=>ev.preventDefault());   // kein Fokus: Enter/Leertaste loesen nichts aus
h9resetBtn.addEventListener("click",async()=>{
  if(romTyping){ location.reload(); return; }
  romTyping=true;
  try{
    romDoReset();
    term.eraseScreen();
    await bootExtendedBasic();
  } finally { romTyping=false; }
  if(H9ONLY) crt.focus();
});
bootROM();
if(H9ONLY){
  // Nur das H9 ist sichtbar; der H8 bootet im Hintergrund Extended Benton Harbor BASIC
  romTyping=true;
  bootExtendedBasic().finally(()=>{ romTyping=false; });
  crt.focus();
} else {
loadDemo();
say("Bereit — echtes PAM-8-ROM aktiv. Demoprogramm liegt ab 040.100 im RAM, PC wird automatisch gesetzt — <b>GO (4)</b> startet es; Ausgabe erscheint auf dem H9.");
}

