/* ============================================================
   Status-Zeile (Button-Meldungen — unabhängig vom Panel-Rendering,
   damit ein Klick-Hinweis nicht binnen 16ms wieder überschrieben wird)
   ============================================================ */
const statusEl=document.getElementById("status");
function say(msg){statusEl.innerHTML=msg;}

