/* ============================================================
   Ton (H8-Tastenklick über den echten ROM-Lautsprecher-Port /
   H9-Glocke)
   ============================================================ */
let actx=null;
function beep(freq,dur){
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const o=actx.createOscillator(),g=actx.createGain();
    o.type="square";o.frequency.value=freq;
    g.gain.setValueAtTime(.06,actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+dur);
    o.connect(g).connect(actx.destination);
    o.start();o.stop(actx.currentTime+dur);
  }catch(e){}
}
function beepKind(kind){
  const specs={short:[0.04,1500],medium:[0.13,900],long:[0.5,420]};
  const s=specs[kind]||specs.short;
  beep(s[1],s[0]);
}

