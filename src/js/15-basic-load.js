/* ============================================================
   Benton Harbor BASIC (Kassette, Heath/Wintek 1977) laden — legt das
   virtuelle Band ein und bedient das Panel wie im Handbuch (MEM-Modus,
   LOAD-Taste); PAM-8 selbst liest danach über Port 370/371 (Sync-
   Leader, STX, CRC-16). BASIC spricht über die H8-5-Konsole (372/373),
   erscheint also im H9-Terminal.
   ============================================================ */
let basicBooted = false;
async function bootBentonHarborBasic(){
  await delay(5000 / SPEED_FACTOR);
  insertTape('Benton Harbor BASIC', BHBASIC_TAPE, false);
  elTapeSelect.value = 'basic';
  const tape = rom.tape;
  for(let attempt=0; attempt<4 && tape.pos===0; attempt++){
    await romPressAndRelease(ROM_KEY_BYTE.MEM, 400, 250);
    await romPressAndRelease(ROM_KEY_BYTE.LOAD, 400, 250);
    await delay(600);
  }
  const loadStarted = Date.now();
  while(tape.pos < tape.bytes.length && (Date.now()-loadStarted) < 30000){
    await delay(200);
  }
  // Band bleibt eingelegt (wie am Original) — Rücklauf/Auswurf jetzt über
  // das Kassettendeck rechts neben dem H8.
  await romPressAndRelease(ROM_KEY_BYTE.REG, 60, 50);
  await romPressAndRelease(ROM_KEY_BYTE[6], 60, 50);
  await romPressAndRelease(ROM_KEY_BYTE[4], 60, 50);
  await delay(600 / SPEED_FACTOR);
  usartReceive(13);
  basicBooted = true;
}
async function bootExtendedBasic(){
  await delay(5000 / SPEED_FACTOR);
  insertTape('Extended Benton Harbor BASIC', EXBASIC2_TAPE, false);
  const tape = rom.tape;
  for(let attempt=0; attempt<4 && tape.pos===0; attempt++){
    await romPressAndRelease(ROM_KEY_BYTE.MEM, 400, 250);
    await romPressAndRelease(ROM_KEY_BYTE.LOAD, 400, 250);
    await delay(600);
  }
  const loadStarted = Date.now();
  while(tape.pos < tape.bytes.length && (Date.now()-loadStarted) < 30000){
    await delay(200);
  }
  await romPressAndRelease(ROM_KEY_BYTE.REG, 60, 50);
  await romPressAndRelease(ROM_KEY_BYTE[6], 60, 50);
  await romPressAndRelease(ROM_KEY_BYTE[4], 60, 50);
  await delay(600 / SPEED_FACTOR);
  usartReceive(13);
  basicBooted = true;
}
async function loadExBasic(btn){
  if(romTyping) return;
  romTyping=true; setLoadButtonsDisabled(true);
  const label=btn.textContent; btn.textContent="Lädt …";
  try{ await bootExtendedBasic(); }
  finally{ btn.textContent=label; setLoadButtonsDisabled(false); romTyping=false; }
}
async function loadBasic(btn){
  if(romTyping) return;
  romTyping=true; setLoadButtonsDisabled(true);
  const label=btn.textContent; btn.textContent="Lädt …";
  try{
    await bootBentonHarborBasic();
    say("Benton Harbor BASIC geladen — Bootmeldung und <b>*</b>-Prompt sollten auf dem H9 stehen. Bildschirm anklicken zum Tippen.");
  } finally {
    btn.textContent=label; setLoadButtonsDisabled(false); romTyping=false;
  }
}

