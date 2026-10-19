/* ============================================================
   Boot & Interrupt-getriebene Ausführungsschleife
   ============================================================ */
const SPEED_FACTOR = 4;
const STEPS_PER_FRAME = 6000 * SPEED_FACTOR;
const INTERRUPT_PERIOD = 400 * SPEED_FACTOR;

function bootROM(){
  mem.set(PAM8_ROM, 0);
  rom.mem = mem;
  rom.digitSel=0; rom.display.fill(0x7f); rom.speakerOn=false; rom.keyByte=ROM_NO_KEY;
  rom.stepCounter=0; rom.ionSeen=false; rom.userSeen=false; rom.siState=0; rom.tape=null;
  rom.pendingRxInterrupt=false; rom.rxHostQueue.length=0;
  usartReset(rom.usart); termClear();
  const c = new CPU(mem, new Uint8Array(256));
  c.onIn = romIoIn; c.onOut = romIoOut;
  // Reales H8 blendet ROM (0-1777 oktal = 0-1023 dez.) bei Schreibzugriffen aus.
  c.wr = function(addr,val){
    if((addr & 0xFFFF) < 1024) return;
    this.mem[addr & 0xFFFF] = val & 0xFF;
  };
  c.pc = 0;
  rom.cpu = c;
  romRunLoop();
}
// Ein CPU-Schritt samt Host-Eingabe und Interrupts. false: CPU steht ohne Interrupts (HLT bei DI).
function romStep(c){
  if(rom.rxHostQueue.length && !rom.usart.rxReady) usartReceive(rom.rxHostQueue.shift());
  if(c.halted){
    if(c.iff && rom.pendingRxInterrupt){ rom.pendingRxInterrupt=false; c.interrupt(0x18); }
    else if(c.iff){ c.interrupt(0x08); } else return false;
  }
  // Einzelbefehl (SI): Das PAM-8-ROM fuehrt nur im SI-Pfad bei 000633 oktal ein OUT 360 aus (der
  // GO-Pfad springt darueber hinweg). Die H8-Hardware (D-Latch plus M1-Teiler IC108A/B) loest danach
  // nach genau einem Anwenderbefehl den Level-20-Interrupt (RST 2, Vektor 020 oktal) aus.
  if(c.pc===0o633 && mem[0o633]===0xD3) rom.siState = 1;
  const siRun = rom.siState===2;
  c.step();
  rom.stepCounter++;
  if(rom.siState===1 && c.pc>=0x2000 && c.pc<0xFFFF){ rom.siState = 2; }       // zurueck im Anwenderprogramm
  else if(siRun){ rom.siState = 0; c.interrupt(0x10); return true; }           // ein Anwenderbefehl ist fertig
  if(c.iff && (rom.stepCounter % INTERRUPT_PERIOD)===0){ c.interrupt(0x08); }
  else if(c.iff && rom.pendingRxInterrupt){ rom.pendingRxInterrupt=false; c.interrupt(0x18); }
  return true;
}
// Lässt die CPU synchron n Schritte laufen, ohne auf den nächsten Frame zu warten
// (schnelles Eintippen langer Programme, siehe typeBasicLine).
function romPump(n){
  const c = rom.cpu;
  if(!c) return;
  for(let i=0;i<n;i++) if(!romStep(c)) break;
}
function romRunLoop(){
  function frame(){
    if(!rom.cpu){ rom.runHandle=null; return; }
    const c = rom.cpu;
    let iffSeen = false, userSeen = false;
    for(let i=0;i<STEPS_PER_FRAME;i++){
      if(!romStep(c)) break;
      if(c.iff) iffSeen = true;
      if(c.pc>=1024) userSeen = true;
    }
    rom.ionSeen = iffSeen;
    rom.userSeen = userSeen;
    romRender();
    rom.runHandle = setTimeout(frame, 16);
  }
  rom.runHandle = setTimeout(frame, 16);
}
function romRender(){
  if(!rom.cpu) return;
  document.getElementById('lampIon').classList.toggle('on', rom.ionSeen);
  const inRom = !rom.userSeen;
  document.getElementById('lampMon').classList.toggle('on', inRom);
  document.getElementById('lampRun').classList.toggle('on', !inRom);
  for(let i=1;i<=9;i++) setDigit(i-1, decodeRomSeg(rom.display[i]), (rom.display[i]&0x80)===0);
}

