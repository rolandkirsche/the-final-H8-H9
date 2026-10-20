/* ============================================================
   Demoprogramm ab 040.100 (0x2040): Meldung + Terminal-Echo
   ============================================================ */
async function loadDemo(){
  if(romTyping) return;
  romTyping=true; setLoadButtonsDisabled(true);
  try{
    const ORG=0x2040;
    const MSG=0x206A;
    const code=[
      0x21,MSG&0xFF,MSG>>8,      /* 2040 LXI H,MSG   */
      0x7E,                      /* 2043 MOV A,M     */
      0xB7,                      /* 2044 ORA A       */
      0xCA,0x4F,0x20,            /* 2045 JZ ECHO     */
      0xCD,0x5E,0x20,            /* 2048 CALL TX     */
      0x23,                      /* 204B INX H       */
      0xC3,0x43,0x20,            /* 204C JMP LOOP    */
      0xDB,UART_LSR,             /* 204F ECHO: IN 355Q */
      0xE6,0x01,                 /* 2051 ANI 01      */
      0xCA,0x4F,0x20,            /* 2053 JZ ECHO     */
      0xDB,UART_DATA,            /* 2056 IN 350Q     */
      0xCD,0x5E,0x20,            /* 2058 CALL TX     */
      0xC3,0x4F,0x20,            /* 205B JMP ECHO    */
      0xF5,                      /* 205E TX: PUSH PSW */
      0xDB,UART_LSR,             /* 205F IN 355Q     */
      0xE6,0x20,                 /* 2061 ANI 20H     */
      0xCA,0x5F,0x20,            /* 2063 JZ 205F     */
      0xF1,                      /* 2066 POP PSW     */
      0xD3,UART_DATA,            /* 2067 OUT 350Q    */
      0xC9                       /* 2069 RET         */
    ];
    const msg="HEATHKIT H8 AN H9 TERMINAL\r\nECHO AKTIV - BITTE TIPPEN\r\n\r\n";
    code.forEach((b,i)=>{mem[ORG+i]=b;});
    for(let i=0;i<msg.length;i++)mem[MSG+i]=msg.charCodeAt(i)&0x7F;
    mem[MSG+msg.length]=0;
    await ensureBootSettled();
    await romSetPC(ORG);
    say("Demo nach <b>040.100</b> geladen ("+(code.length+msg.length+1)+" Bytes), PC gesetzt — jetzt <b>GO (4)</b> drücken.");
  } finally {
    romTyping=false; setLoadButtonsDisabled(false);
  }
}

/* ============================================================
   Hello-World-Demo ab 040.100 (0x2040): gibt "HELLO WORLD!" aus
   und hält danach mit HLT an (kein Echo-Betrieb).
   ============================================================ */
async function loadHello(){
  if(romTyping) return;
  romTyping=true; setLoadButtonsDisabled(true);
  try{
    const ORG=0x2040;
    const MSG=0x205C;
    const code=[
      0x21,MSG&0xFF,MSG>>8,      /* 2040 LXI H,MSG    */
      0x7E,                      /* 2043 LOOP: MOV A,M */
      0xB7,                      /* 2044 ORA A        */
      0xCA,0x4F,0x20,            /* 2045 JZ DONE      */
      0xCD,0x50,0x20,            /* 2048 CALL TX      */
      0x23,                      /* 204B INX H        */
      0xC3,0x43,0x20,            /* 204C JMP LOOP     */
      0x76,                      /* 204F DONE: HLT    */
      0xF5,                      /* 2050 TX: PUSH PSW  */
      0xDB,UART_LSR,             /* 2051 TXW: IN 355Q */
      0xE6,0x20,                 /* 2053 ANI 20H      */
      0xCA,0x51,0x20,            /* 2055 JZ TXW       */
      0xF1,                      /* 2058 POP PSW      */
      0xD3,UART_DATA,            /* 2059 OUT 350Q     */
      0xC9                       /* 205B RET          */
    ];
    const msg="HELLO WORLD!\r\n";
    code.forEach((b,i)=>{mem[ORG+i]=b;});
    for(let i=0;i<msg.length;i++)mem[MSG+i]=msg.charCodeAt(i)&0x7F;
    mem[MSG+msg.length]=0;
    await ensureBootSettled();
    await romSetPC(ORG);
    say("Hello-World-Demo nach <b>040.100</b> geladen, PC gesetzt — jetzt <b>GO (4)</b> drücken. Nach der Ausgabe stoppt <b>HLT</b>, kein Echo.");
  } finally {
    romTyping=false; setLoadButtonsDisabled(false);
  }
}

/* ============================================================
   Zeilen-Umkehr-Demo ab 040.100 (0x2040): H9 -> H8 -> H9.
   Tippt man auf dem H9 eine Zeile und drückt Enter, sammelt der H8
   die Zeichen in einem RAM-Puffer, echot sie beim Tippen mit und
   schickt die Zeile danach rückwärts zurück — zeigt, dass die Daten
   auf dem H8 wirklich verarbeitet werden, nicht nur durchgereicht.
   Läuft endlos (mehrere Zeilen nacheinander); RTM (Umschalt+0) zum
   Monitor.
   ============================================================ */
async function loadReverser(){
  if(romTyping) return;
  romTyping=true; setLoadButtonsDisabled(true);
  try{
    const ORG=0x2040;
    const GREET=0x20AB;
    const BUF=0x20D7;         /* muss zu GREET + msg.length + 1 passen */
    const code=[
      0x21,GREET&0xFF,GREET>>8, /* 2040 LXI H,GREET        */
      0xCD,0x88,0x20,            /* 2043 CALL PRINTMSG      */
      0x21,BUF&0xFF,BUF>>8,      /* 2046 RLOOP: LXI H,BUF   */
      0x0E,0x00,                 /* 2049 MVI C,0            */
      0xCD,0x95,0x20,            /* 204B CHARLOOP: CALL RX  */
      0xFE,0x0D,                 /* 204E CPI 13             */
      0xCA,0x5F,0x20,            /* 2050 JZ ENDLINE         */
      0x77,                      /* 2053 MOV M,A            */
      0x23,                      /* 2054 INX H              */
      0x0C,                      /* 2055 INR C              */
      0xCD,0x9F,0x20,            /* 2056 CALL TXA           */
      0x79,                      /* 2059 MOV A,C            */
      0xFE,0x3C,                 /* 205A CPI 60             */
      0xDA,0x4B,0x20,            /* 205C JC CHARLOOP        */
      0x3E,0x0D,                 /* 205F ENDLINE: MVI A,13  */
      0xCD,0x9F,0x20,            /* 2061 CALL TXA           */
      0x3E,0x0A,                 /* 2064 MVI A,10           */
      0xCD,0x9F,0x20,            /* 2066 CALL TXA           */
      0x79,                      /* 2069 MOV A,C            */
      0xB7,                      /* 206A ORA A              */
      0xCA,0x46,0x20,            /* 206B JZ RLOOP           */
      0x2B,                      /* 206E DCX H              */
      0x7E,                      /* 206F REVLOOP: MOV A,M   */
      0xCD,0x9F,0x20,            /* 2070 CALL TXA           */
      0x0D,                      /* 2073 DCR C              */
      0xCA,0x7B,0x20,            /* 2074 JZ REVDONE         */
      0x2B,                      /* 2077 DCX H              */
      0xC3,0x6F,0x20,            /* 2078 JMP REVLOOP        */
      0x3E,0x0D,                 /* 207B REVDONE: MVI A,13  */
      0xCD,0x9F,0x20,            /* 207D CALL TXA           */
      0x3E,0x0A,                 /* 2080 MVI A,10           */
      0xCD,0x9F,0x20,            /* 2082 CALL TXA           */
      0xC3,0x46,0x20,            /* 2085 JMP RLOOP          */
      0x7E,                      /* 2088 PRINTMSG: MOV A,M  */
      0xB7,                      /* 2089 ORA A              */
      0xCA,0x94,0x20,            /* 208A JZ PRDONE          */
      0xCD,0x9F,0x20,            /* 208D CALL TXA           */
      0x23,                      /* 2090 INX H              */
      0xC3,0x88,0x20,            /* 2091 JMP PRINTMSG       */
      0xC9,                      /* 2094 PRDONE: RET        */
      0xDB,UART_LSR,             /* 2095 RX: IN 355Q        */
      0xE6,0x01,                 /* 2097 ANI 01             */
      0xCA,0x95,0x20,            /* 2099 JZ RX              */
      0xDB,UART_DATA,            /* 209C IN 350Q            */
      0xC9,                      /* 209E RET                */
      0xF5,                      /* 209F TXA: PUSH PSW      */
      0xDB,UART_LSR,             /* 20A0 TXW: IN 355Q       */
      0xE6,0x20,                 /* 20A2 ANI 20H            */
      0xCA,0xA0,0x20,            /* 20A4 JZ TXW             */
      0xF1,                      /* 20A7 POP PSW            */
      0xD3,UART_DATA,            /* 20A8 OUT 350Q           */
      0xC9                       /* 20AA RET                */
    ];
    const msg="LINE-REVERSER - TYPE A LINE, PRESS ENTER:\r\n";
    code.forEach((b,i)=>{mem[ORG+i]=b;});
    for(let i=0;i<msg.length;i++)mem[GREET+i]=msg.charCodeAt(i)&0x7F;
    mem[GREET+msg.length]=0;
    await ensureBootSettled();
    await romSetPC(ORG);
    say("Zeilen-Umkehr-Demo nach <b>040.100</b> geladen, PC gesetzt — jetzt <b>GO (4)</b> drücken. Auf dem H9 eine Zeile tippen und Enter — der H8 schickt sie rückwärts zurück. <b>Umschalt+0</b> (RTM) beendet.");
  } finally {
    romTyping=false; setLoadButtonsDisabled(false);
  }
}


/* ============================================================
   Initial Test Routine (Operation Manual 595-2014, Seiten 4-8):
   92 Bytes ab 040.100, wie im Handbuch ueber die Frontplatte eingetippt
   (MEM, Adresse, ALTER, Bytes), danach PC auf 040.100. GO (4) startet.
   Die Anzeige laeuft durch "your H8 / is up and / running".
   ============================================================ */
const INITIAL_TEST = [
    "076 002 062 010 040 006 004 041 170 040 021 013 040 016 011 176",
    "022 043 023 015 302 117 040 016 003 076 377 315 053 000 015 302",
    "131 040 005 302 112 040 076 062 315 140 002 076 062 315 053 000",
    "076 062 315 140 002 303 105 040 377 262 270 272 275 377 222 200",
    "377 237 244 377 272 230 377 220 326 302 377 275 272 271 271 373",
    "271 240 377 236 376 362 236 376 362 236 376 362"
  ].join(" ").split(" ");
async function loadInitialTest(){
  if(romTyping) return;
  romTyping=true; setLoadButtonsDisabled(true);
  try{
    const btn=document.getElementById("btnTest"), label=btn.textContent;
    const H=60, G=40;
    const key=(k)=>romPressAndRelease(ROM_KEY_BYTE[k],H,G);
    romDoReset();
    await delay(900); bootSettled=true;
    await key("MEM");
    await romTypeDigits("040100".split("").map(Number),H,G);
    await key("ALTER");
    let n=0;
    for(const b of INITIAL_TEST){
      btn.textContent="Testprogramm "+(++n)+"/"+INITIAL_TEST.length;
      await romTypeDigits(b.split("").map(Number),H,G);
    }
    btn.textContent=label;
    await key("ALTER");
    await romSetPC(0x2040);
    say("Initial Test Routine nach <b>040.100</b> eingegeben ("+INITIAL_TEST.length+" Bytes), PC gesetzt — jetzt <b>GO (4)</b> druecken. Stoppen: <b>0</b> und <b>MEM (#)</b> gleichzeitig.");
  } finally {
    document.getElementById("btnTest").textContent="Testprogramm";
    romTyping=false; setLoadButtonsDisabled(false);
  }
}
