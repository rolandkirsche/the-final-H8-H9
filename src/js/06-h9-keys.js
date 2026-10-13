/* ============================================================
   H9-Bildschirm-Funktionstasten (HOME/ERASE/EOL/PAGE/Cursor) — reine
   Bildschirmsteuerung direkt auf dem Terminal-Puffer, unabhängig von der
   H8-CPU/Konsole. Auf echten Terminals dieser Art senden diese Tasten
   Escape-Folgen an den Host und der Host entscheidet, was passiert;
   das aktuelle PAM-8/BASIC auf der H8-Seite wertet aber keine
   Eingabe-Escape-Folgen aus, daher wirken die Tasten hier lokal auf dem
   H9 — nützlich zum manuellen Aufräumen/Positionieren des Bildschirms,
   ohne die laufende H8-Sitzung zu beeinflussen.
   ============================================================ */
function crtKeyAction(fn){
  fn();
  term.render();
}
document.getElementById("btnCurUp").addEventListener("click",()=>crtKeyAction(()=>term.cursorUp()));
document.getElementById("btnCurDown").addEventListener("click",()=>crtKeyAction(()=>term.cursorDown()));
document.getElementById("btnCurLeft").addEventListener("click",()=>crtKeyAction(()=>term.cursorLeft()));
document.getElementById("btnCurRight").addEventListener("click",()=>crtKeyAction(()=>term.cursorRight()));
document.getElementById("btnHome").addEventListener("click",()=>crtKeyAction(()=>term.home()));
document.getElementById("btnEraseEol").addEventListener("click",()=>crtKeyAction(()=>term.eraseToEOL()));
document.getElementById("btnErasePage").addEventListener("click",()=>crtKeyAction(()=>term.eraseToEOP()));
document.getElementById("btnErase").addEventListener("click",()=>crtKeyAction(()=>term.eraseScreen()));

