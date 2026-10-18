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

/* LINE (links) auf dem authentischen Foto: zurück zur H8-Seite.
   Die sichtbare Beschriftung des Fotos bleibt unverändert. */
(function installH8ReturnKey(){
  const stage = document.getElementById("h9stage");
  if(!stage) return;
  const key = document.createElement("button");
  key.id = "h9lineH8";
  key.type = "button";
  key.title = "LINE: zurück zum H8";
  key.setAttribute("aria-label","LINE: zurück zum H8");
  key.addEventListener("click",()=>document.getElementById("btnPageH8")?.click());
  stage.appendChild(key);
})();
