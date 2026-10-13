/* ============================================================
   Tasten-Presse-Modell: Halten statt Klick (Original-Debounce/Auto-
   Repeat läuft im ROM selbst, JS hält nur den rohen Scancode).
   ============================================================ */
function romPressKey(byte){
  if(!rom.cpu) return;
  if(rom.keyHoldTimer){ clearTimeout(rom.keyHoldTimer); rom.keyHoldTimer=null; }
  rom.keyByte = byte;
}
function romReleaseKey(){
  rom.keyByte = ROM_NO_KEY;
}
function romDoReset(){
  if(!rom.cpu) return;
  rom.cpu.reset();
  rom.cpu.pc = 0;
  // RAM (ab Adresse 1024, ROM bleibt unberührt) neu initialisieren, damit
  // PAM-8s eigener Speichergrößentest beim Neustart nicht an Restdaten aus
  // der vorherigen Sitzung hängen bleibt (siehe virtual-h8-h9-Vorlage).
  mem.fill(0, 1024);
  rom.digitSel=0; rom.display.fill(0x7f); rom.speakerOn=false; rom.keyByte=ROM_NO_KEY;
  rom.stepCounter=0; rom.ionSeen=false; rom.userSeen=false; rom.rxHostQueue.length=0;
  usartReset(rom.usart);
  rxQ.length=0;
  beepKind('long');
  say("RST/0 — Reset. Monitor (echtes PAM-8-ROM) aktiv. Geladene Programme im RAM sind gelöscht.");
}
function romDoRTM(){
  if(!rom.cpu) return;
  romPressKey(ROM_RTM_BYTE);
  rom.keyHoldTimer = setTimeout(()=>{ romReleaseKey(); rom.keyHoldTimer=null; }, 120);
  beepKind('medium');
}

