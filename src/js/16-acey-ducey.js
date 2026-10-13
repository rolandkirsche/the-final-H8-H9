/* ============================================================
   BASIC-Programme eintippen (F2 Acey Ducey, F3 Star Trek) — Zeichen für
   Zeichen über dieselbe Host-Empfangswarteschlange wie eine echte
   Tastatureingabe (queueHostByte/usartReceive). Dabei ergänzt BASIC beim
   Tippen Schlüsselwörter automatisch zur kürzesten eindeutigen Abkürzung
   (siehe Bedienungshilfe), bei Funktionen samt "$(" bzw. "(" — typeBasicLine
   erkennt das am tatsächlichen Bildschirminhalt und überspringt die
   dadurch bereits ausgefüllten Quelltextzeichen, statt sie doppelt zu
   tippen. Nach jeder Zeile wartet es auf den *-Prompt: Solange BASIC die
   Zeile noch abspeichert, gingen weitere Zeichen sonst verloren.
   fast: Die CPU läuft synchron weiter, statt pro Zeichen auf den nächsten
   Frame zu warten — gleiche Firmware, gleiche Zeichen, nur ohne
   Echtzeitbremse (für lange Programme wie Star Trek).
   ============================================================ */
const FAST_STEPS_PER_MS = STEPS_PER_FRAME / 16;
const FAST_SETTLE_STEPS = 2000; // Nachlauf nach dem Echo für die Ergänzung; gemessen reichen 300
async function basicWait(fast, done, limitMs){
  if(fast){ for(let n=0; !done() && n<limitMs*FAST_STEPS_PER_MS; n+=500) romPump(500); return; }
  for(let t=0; !done() && t<limitMs; t+=5) await delay(5);
}
const hostQueueEmpty = ()=>rom.rxHostQueue.length===0;
const basicPromptShown = ()=>term.col===1 && term.buf[term.row][0]==='*';
async function typeBasicLine(line, fast=false, waitFor=basicPromptShown){
  const startRow = term.row, startCol = term.col;
  let srcPos = 0, screenOffset = 0;
  while(srcPos < line.length){
    const received = term.received;
    queueHostByte(line.charCodeAt(srcPos));
    await basicWait(fast, hostQueueEmpty, 2000);
    if(fast){ await basicWait(true, ()=>term.received!==received, 20); romPump(FAST_SETTLE_STEPS); }
    srcPos++;
    if(term.row !== startRow) break; // unerwarteter Zeilenumbruch — Notbremse
    const visible = term.buf[startRow].slice(startCol, term.col).join('');
    const expectedLen = srcPos + screenOffset;
    if(visible.length > expectedLen){
      // BASIC hat Zeichen ergänzt: so viele überspringen, wie mit dem Quelltext übereinstimmen
      const extra = visible.slice(expectedLen);
      let k = 0;
      while(k < extra.length && srcPos + k < line.length &&
            extra[k].toUpperCase() === line[srcPos + k].toUpperCase()) k++;
      srcPos += k;
      screenOffset += extra.length - k;
    }
  }
  queueHostByte(13);
  await basicWait(fast, hostQueueEmpty, 2000);
  await basicWait(fast, waitFor, 3000);
  if(fast) await delay(0); // Bildschirm und Frames zwischen den Zeilen zum Zug kommen lassen
}
// Löscht das Programm im Speicher (SCRATCH, Rückfrage SURE? mit Y bestätigen).
async function basicScratch(fast){
  await typeBasicLine('SCRATCH', fast, ()=>term.buf[term.row].join('').startsWith('SURE?'));
  queueHostByte('Y'.charCodeAt(0));
  await basicWait(fast, hostQueueEmpty, 2000);
  await basicWait(fast, basicPromptShown, 3000);
}

/* Acey Ducey (Creative Computing / BASIC Computer Games, 1978), Original-
   Quelltext. Gegen die echte ROM/BASIC-Firmware verifiziert (0 Abweichungen
   bei allen 100 Programmzeilen, RUN funktioniert fehlerfrei). */
const ACEYDUCEY_LINES = [
`10 PRINT TAB(26);"ACEY DUCEY CARD GAME"`,
`20 PRINT TAB(15);"CREATIVE COMPUTING  MORRISTOWN, NEW JERSEY"`,
`21 PRINT`,
`22 PRINT`,
`30 PRINT"ACEY-DUCEY IS PLAYED IN THE FOLLOWING MANNER "`,
`40 PRINT"THE DEALER (COMPUTER) DEALS TWO CARDS FACE UP"`,
`50 PRINT"YOU HAVE AN OPTION TO BET OR NOT BET DEPENDING"`,
`60 PRINT"ON WHETHER OR NOT YOU FEEL THE CARD WILL HAVE"`,
`70 PRINT"A VALUE BETWEEN THE FIRST TWO."`,
`80 PRINT"IF YOU DO NOT WANT TO BET, INPUT A 0"`,
`100 N=100`,
`110 Q=100`,
`120 PRINT "YOU NOW HAVE";Q;"DOLLARS."`,
`130 PRINT`,
`140 GOTO 260`,
`210 Q=Q+M`,
`220 GOTO 120`,
`240 Q=Q-M`,
`250 GOTO 120`,
`260 PRINT"HERE ARE YOUR NEXT TWO CARDS: "`,
`270 A=INT(14*RND(1))+2`,
`280 IF A<2 THEN 270`,
`290 IF A>14 THEN 270`,
`300 B=INT(14*RND(1))+2`,
`310 IF B<2 THEN 300`,
`320 IF B>14 THEN 300`,
`330 IF A>=B THEN 270`,
`350 IF A<11 THEN 400`,
`360 IF A=11 THEN 420`,
`370 IF A=12 THEN 440`,
`380 IF A=13 THEN 460`,
`390 IF A=14 THEN 480`,
`400 PRINT A`,
`410 GOTO 500`,
`420 PRINT"JACK"`,
`430 GOTO 500`,
`440 PRINT"QUEEN"`,
`450 GOTO 500`,
`460 PRINT"KING"`,
`470 GOTO 500`,
`480 PRINT"ACE"`,
`500 IF B<11 THEN 550`,
`510 IF B=11 THEN 570`,
`520 IF B=12 THEN 590`,
`530 IF B=13 THEN 610`,
`540 IF B=14 THEN 630`,
`550 PRINT B`,
`560 GOTO 650`,
`570 PRINT"JACK"`,
`580 GOTO 650`,
`590 PRINT"QUEEN"`,
`600 GOTO 650`,
`610 PRINT"KING"`,
`620 GOTO 650`,
`630 PRINT"ACE"`,
`640 PRINT`,
`650 PRINT`,
`660 INPUT"WHAT IS YOUR BET";M`,
`670 IF M<>0 THEN 680`,
`675 PRINT"CHICKEN!!"`,
`676 PRINT`,
`677 GOTO 260`,
`680 IF M<=Q THEN 730`,
`690 PRINT"SORRY, MY FRIEND, BUT YOU BET TOO MUCH."`,
`700 PRINT"YOU HAVE ONLY ";Q;" DOLLARS TO BET."`,
`710 GOTO 650`,
`730 C=INT(14*RND(1))+2`,
`740 IF C<2 THEN 730`,
`750 IF C>14 THEN 730`,
`760 IF C<11 THEN 810`,
`770 IF C=11 THEN 830`,
`780 IF C=12 THEN 850`,
`790 IF C=13 THEN 870`,
`800 IF C=14 THEN 890`,
`810 PRINT C`,
`820 GOTO 910`,
`830 PRINT"JACK"`,
`840 GOTO 910`,
`850 PRINT"QUEEN"`,
`860 GOTO 910`,
`870 PRINT"KING"`,
`880 GOTO 910`,
`890 PRINT "ACE"`,
`900 PRINT`,
`910 IF C>A THEN 930`,
`920 GOTO 970`,
`930 IF C>=B THEN 970`,
`950 PRINT"YOU WIN!!!"`,
`960 GOTO 210`,
`970 PRINT"SORRY, YOU LOSE"`,
`980 IF M<Q THEN 240`,
`990 PRINT`,
`1000 PRINT`,
`1010 PRINT"SORRY, FRIEND, BUT YOU BLEW YOUR WAD."`,
`1015 PRINT:PRINT`,
`1020 INPUT"TRY AGAIN (1=YES, 0=NO)";A`,
`1025 PRINT:PRINT`,
`1030 IF A=1 THEN 110`,
`1040 PRINT"O.K., HOPE YOU HAD FUN!"`,
`1050 END`,
];
async function loadAceyDucey(btn){
  if(romTyping) return;
  romTyping=true; setLoadButtonsDisabled(true);
  const label=btn.textContent; btn.textContent="Lädt …";
  try{
    if(!basicBooted){
      say("Lade zuerst Benton Harbor BASIC, dann Acey Ducey …");
      await bootBentonHarborBasic();
    }
    say("Tippe <b>ACEY DUCEY</b> (Creative Computing, 1978) in die laufende BASIC-Sitzung — "+ACEYDUCEY_LINES.length+" Zeilen …");
    for(const line of ACEYDUCEY_LINES){
      await typeBasicLine(line);
    }
    say("Acey Ducey geladen (Creative Computing, 1978, "+ACEYDUCEY_LINES.length+" Zeilen) — <b>RUN</b> eintippen zum Spielen.");
  } finally {
    btn.textContent=label; setLoadButtonsDisabled(false); romTyping=false;
  }
}

