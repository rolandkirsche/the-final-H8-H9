/* ============================================================
   Port-I/O: Frontpanel (360/361), H8-5-Konsole (372/373, Intel-8251-
   USART), Kassette (370/371) — plus unser eigenes einfaches UART
   (350/355) für Hello World und Zeilen-Umkehr, unverändert daneben.
   ============================================================ */
const UART_DATA=0o350, UART_LSR=0o355;
const rxQ=[];
function oldUartIn(p){
  if(p===UART_DATA)return rxQ.length?rxQ.shift():0;
  if(p===UART_LSR)return 0x20|(rxQ.length?0x01:0x00);
  return 0xFF;
}
function oldUartOut(p,v){
  if(p===UART_DATA)term.put(v&0x7F);
}

const rom = {
  cpu:null, mem:null,
  digitSel:0, display:new Uint8Array(10).fill(0x7f), speakerOn:false,
  keyByte: ROM_NO_KEY, keyHoldTimer:null,
  runHandle:null, stepCounter:0,
  siState:0,   // Einzelbefehl: 0 aus, 1 bereit (Rueckkehr ins Programm folgt), 2 Anwenderbefehl laeuft
  ionSeen:false, userSeen:false,
  usart:{mode:0,cmd:0,expectMode:true,rbr:0,rxReady:false,overrunErr:false,txEnabled:false,rxEnabled:false,dtr:false},
  tape:null, // {label,bytes[],pos,editable,lastActivity} eingelegtes virtuelles Band, sonst null
  pendingRxInterrupt:false,
  rxHostQueue:[],
};

function queueHostByte(byte){
  rom.rxHostQueue.push(byte);
}

const CONSOLE_BASE = 0xFA; // 372 oktal
const CASSETTE_BASE = 0xF8; // 370 oktal

function tapeActivity(){
  if(rom.tape){ rom.tape.lastActivity = performance.now(); }
}
function cassetteIn(port){
  if(port===CASSETTE_BASE){
    if(rom.tape && rom.tape.pos < rom.tape.bytes.length){ tapeActivity(); return rom.tape.bytes[rom.tape.pos++]; }
    return 0xFF;
  }
  const ready = rom.tape && rom.tape.pos < rom.tape.bytes.length;
  return ready ? 0x03 : 0x01;
}
// DUMP: PAM-8 schreibt Bytes über OUT 370₈ auf das Band. Die Bereitschafts-
// Statusleitung (TxRDY, Bit 0 auf 371₈) liefert cassetteIn oben ohnehin
// immer 1 zurück — real wie virtuell blockiert DUMP also nie am Handshake,
// nur das eigentliche Schreiben war bislang unimplementiert.
function cassetteOut(port,val){
  if(port!==CASSETTE_BASE) return;
  const t = rom.tape;
  if(!t || !t.editable) return;
  t.bytes[t.pos++] = val & 0xFF;
  tapeActivity();
}
function usartReset(u){
  u.mode=0; u.cmd=0; u.expectMode=true;
  u.rxReady=false; u.rbr=0; u.overrunErr=false;
  u.txEnabled=false; u.rxEnabled=false; u.dtr=false;
}
function usartStatus(u){
  let s=0x80;
  if(u.txEnabled){ s|=0x01; s|=0x04; }
  if(u.rxReady) s|=0x02;
  if(u.overrunErr) s|=0x10;
  return s;
}
function usartIn(port){
  const u = rom.usart;
  if(port===CONSOLE_BASE){
    u.rxReady=false;
    return u.rbr;
  }
  return usartStatus(u);
}
function usartOut(port,val){
  const u = rom.usart;
  if(port===CONSOLE_BASE){
    if(u.txEnabled){ termWrite(val); }
    return;
  }
  if(u.expectMode){
    u.mode = val;
    u.expectMode = false;
    return;
  }
  u.cmd = val;
  u.txEnabled = !!(val & 0x01);
  u.dtr = !!(val & 0x02);
  u.rxEnabled = !!(val & 0x04);
  if(val & 0x10) u.overrunErr = false;
  if(val & 0x40){ u.expectMode = true; u.txEnabled = false; u.rxEnabled = false; u.dtr = false; }
}
function usartReceive(byte){
  const u = rom.usart;
  if(!u.rxEnabled) return;
  if(u.rxReady) u.overrunErr = true;
  u.rbr = byte & 0xFF;
  u.rxReady = true;
  if(u.dtr) rom.pendingRxInterrupt = true;
}

function romIoIn(port){
  if(port===0xF0){
    // RTM (Code 056 oktal) gilt nur fuer die Abfrage im Uhr-Interrupt bei 000313 oktal (IN 360,
    // danach steht PC auf 000315). Die Tastenroutine des Monitors (001660) wuerde den noch
    // gehaltenen Code als Ziffer 8 (= LOAD) lesen und auf die Kassette warten. Deshalb wird RTM
    // dort verbraucht und sonst als "keine Taste" gelesen.
    if(rom.keyByte===ROM_RTM_BYTE){
      if(rom.cpu && rom.cpu.pc===0o315){
        if(rom.keyHoldTimer){ clearTimeout(rom.keyHoldTimer); rom.keyHoldTimer=null; }
        rom.keyByte = ROM_NO_KEY;
        return ROM_RTM_BYTE;
      }
      return ROM_NO_KEY;
    }
    return rom.keyByte;
  }
  if(port===CONSOLE_BASE || port===CONSOLE_BASE+1) return usartIn(port);
  if(port===CASSETTE_BASE || port===CASSETTE_BASE+1) return cassetteIn(port);
  if(port===UART_DATA || port===UART_LSR) return oldUartIn(port);
  return 0xFF;
}
function romIoOut(port,val){
  if(port===0xF0){
    rom.digitSel = val & 0x0F;
    const speakerNow = !!(val & 0x80);
    if(speakerNow && !rom.speakerOn) beepKind('short');
    rom.speakerOn = speakerNow;
  }
  else if(port===0xF1){ if(rom.digitSel>=1 && rom.digitSel<=9) rom.display[rom.digitSel]=val; }
  else if(port===CONSOLE_BASE || port===CONSOLE_BASE+1) usartOut(port,val);
  else if(port===CASSETTE_BASE) cassetteOut(port,val);
  else if(port===UART_DATA) oldUartOut(port,val);
}

