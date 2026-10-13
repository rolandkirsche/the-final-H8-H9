/* ============================================================
   Kassettendeck-UI (rechts neben dem H8) — Einlegen/Auswerfen/
   Zurückspulen/Speichern eines virtuellen Bandes. LOAD (8) und DUMP (9)
   auf dem Panel sprechen unverändert PAM-8s eigene Kassettenroutine über
   Port 370/371 an (siehe cassetteIn/cassetteOut oben); diese UI steuert
   nur, welches Band gerade eingelegt ist.
   ============================================================ */
const elCassetteArt = document.getElementById('cassetteArt');
const elTapeLabel = document.getElementById('tapeLabel');
const elTapeCounter = document.getElementById('tapeCounter');
const elTapeSelect = document.getElementById('tapeSelect');
const elBtnRewind = document.getElementById('btnRewind');
const elBtnEject = document.getElementById('btnEject');
const elBtnTapeSave = document.getElementById('btnTapeSave');
const elBtnTapeLoadFile = document.getElementById('btnTapeLoadFile');
const elTapeFile = document.getElementById('tapeFile');
const elChkWriteProtect = document.getElementById('chkWriteProtect');
const elLampTape = document.getElementById('lampTape');

function pad4(n){ return String(n).padStart(4,'0'); }
function updateCassetteUI(){
  const t = rom.tape;
  const active = !!(t && t.lastActivity && (performance.now()-t.lastActivity) < 400);
  elCassetteArt.classList.toggle('empty', !t);
  elCassetteArt.classList.toggle('spinning', active);
  elLampTape.classList.toggle('on', active);
  elTapeLabel.textContent = t ? t.label : '— kein Band eingelegt —';
  elTapeCounter.textContent = t ? (pad4(t.pos)+' / '+pad4(t.bytes.length)+' Bytes') : '— / —';
  elBtnRewind.disabled = !t;
  elBtnEject.disabled = !t;
  elBtnTapeSave.disabled = !t || t.bytes.length===0;
  elChkWriteProtect.disabled = !t;
  elChkWriteProtect.checked = !!(t && !t.editable);
}
function insertTape(label, bytes, editable){
  rom.tape = { label, bytes: Array.from(bytes), pos:0, editable, lastActivity:0 };
  updateCassetteUI();
  say('Kassette eingelegt: <b>'+label+'</b> ('+rom.tape.bytes.length+' Bytes)'
    +(editable ? '' : ', schreibgeschützt')
    +' — <b>LOAD (8)</b> liest'+(editable ? ', <b>DUMP (9)</b> schreibt' : '')+'.');
}
function ejectTape(){
  if(!rom.tape) return;
  const had = rom.tape.label;
  rom.tape = null;
  elTapeSelect.value = '';
  updateCassetteUI();
  say('Kassette ausgeworfen (war: <b>'+had+'</b>).');
}
function rewindTape(){
  if(!rom.tape) return;
  rom.tape.pos = 0;
  updateCassetteUI();
  say('Band zurückgespult: <b>'+rom.tape.label+'</b>.');
}
function saveTapeToFile(){
  const t = rom.tape;
  if(!t || !t.bytes.length) return;
  const blob = new Blob([new Uint8Array(t.bytes)], {type:'application/octet-stream'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (t.label.replace(/[^A-Za-z0-9_-]+/g,'_') || 'kassette') + '.h8t';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  say('Band <b>'+t.label+'</b> als Datei gespeichert ('+t.bytes.length+' Bytes).');
}
elTapeSelect.addEventListener('change', (e)=>{
  const v = e.target.value;
  if(v==='basic') insertTape('Benton Harbor BASIC', BHBASIC_TAPE, false);
  else if(v==='blank') insertTape('Leeres Band', [], true);
  else ejectTape();
});
elBtnEject.addEventListener('click', ejectTape);
elBtnRewind.addEventListener('click', rewindTape);
elBtnTapeSave.addEventListener('click', saveTapeToFile);
elChkWriteProtect.addEventListener('change', (e)=>{
  if(rom.tape) rom.tape.editable = !e.target.checked;
});
elBtnTapeLoadFile.addEventListener('click', ()=> elTapeFile.click());
elTapeFile.addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const bytes = new Uint8Array(await f.arrayBuffer());
  insertTape(f.name, bytes, true);
  elTapeFile.value = '';
});
setInterval(updateCassetteUI, 150);

