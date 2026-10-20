/* ============================================================
   Automatisierte Tastendrücke (für die Demo-Lade-Knöpfe und BASIC-
   LOAD) — echte, zeitgesteuerte Presses gegen die laufende Original-
   Firmware, kein Speicher-Hack.
   ============================================================ */
function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }
function romPressAndRelease(byte, holdMs, gapMs){
  return new Promise(resolve=>{
    romPressKey(byte);
    setTimeout(()=>{
      romReleaseKey();
      setTimeout(resolve, gapMs);
    }, holdMs);
  });
}
async function romTypeDigits(digits, holdMs, gapMs){
  for(const d of digits) await romPressAndRelease(ROM_KEY_BYTE[d], holdMs, gapMs);
}
// Setzt PC über REG->6->ALTER->6 Oktalziffern->ALTER auf addr. Das ist der
// echte Weg, GO eine Startadresse zu geben — das bloße MEM-Anzeigen einer
// Adresse (wie in der alten Nachbildung) genügt beim echten ROM NICHT,
// GO liest immer den PC-Registerwert.
async function romSetPC(addr){
  await romPressAndRelease(ROM_KEY_BYTE.REG, 50, 40);
  await romPressAndRelease(ROM_KEY_BYTE[6], 50, 40);
  await romPressAndRelease(ROM_KEY_BYTE.ALTER, 50, 40);
  const hi=(addr>>8)&0xFF, lo=addr&0xFF;
  const digs=(oct3(hi)+oct3(lo)).split('').map(Number);
  await romTypeDigits(digs, 50, 40);
  await romPressAndRelease(ROM_KEY_BYTE.ALTER, 50, 40);
}

let romTyping = false;
const LOAD_BUTTON_IDS = ['btnDemo','btnHello','btnReverser','btnBasic','btnExBasic','btnAceyDucey','btnTest'];
function setLoadButtonsDisabled(disabled){
  for(const id of LOAD_BUTTON_IDS){
    const b = document.getElementById(id);
    if(b) b.disabled = disabled;
  }
  // Kassettenbedienung während der automatisierten Tastenfolgen sperren,
  // damit niemand der laufenden Bandautomatik das Band unter der Nadel wegzieht.
  elTapeSelect.disabled = disabled;
  elBtnTapeLoadFile.disabled = disabled;
  if(disabled){
    elBtnEject.disabled = true;
    elBtnRewind.disabled = true;
  } else {
    updateCassetteUI();
  }
}
let bootSettled = false;
async function ensureBootSettled(){
  // Kurze Sicherheitswartezeit, damit PAM-8s eigener RAM-Selbsttest beim
  // ersten Tastendruck nach dem Booten garantiert schon durchgelaufen ist.
  if(!bootSettled){ await delay(900); bootSettled = true; }
}

