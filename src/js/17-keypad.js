/* ============================================================
   Keypad — Layout nach Assembly Manual 595-2013-01, Pictorial 3-11.
   Halten statt Klick (mousedown/up, touchstart/end), wie am Original.
   ============================================================ */
const KEYS=[
  {top:"",   main:"7", sub:"SI",        id:"7"},
  {top:"",   main:"8", sub:"LOAD",      id:"8"},
  {top:"",   main:"9", sub:"DUMP",      id:"9"},
  {top:"",   main:"+", sub:"",          id:"+"},
  {top:"DE", main:"4", sub:"GO",        id:"4"},
  {top:"HL", main:"5", sub:"IN",        id:"5"},
  {top:"PC", main:"6", sub:"OUT",       id:"6"},
  {top:"",   main:"−", sub:"",          id:"-"},
  {top:"SP", main:"1", sub:"",          id:"1"},
  {top:"AF", main:"2", sub:"",          id:"2"},
  {top:"BC", main:"3", sub:"",          id:"3"},
  {top:"",   main:"*", sub:"CANCEL",    id:"*"},
  {top:"",   main:"0", sub:"",          id:"0"},
  {top:"REG",main:"·", sub:"",          id:"."},
  {top:"MEM",main:"#", sub:"RTM/0",     id:"#"},
  {top:"ALTER",main:"/",sub:"RST/0",    id:"/"}
];
const KEY_BYTE_BY_ID = {
  "0":ROM_KEY_BYTE[0],"1":ROM_KEY_BYTE[1],"2":ROM_KEY_BYTE[2],"3":ROM_KEY_BYTE[3],
  "4":ROM_KEY_BYTE[4],"5":ROM_KEY_BYTE[5],"6":ROM_KEY_BYTE[6],"7":ROM_KEY_BYTE[7],
  "8":ROM_KEY_BYTE.LOAD, "9":ROM_KEY_BYTE.DUMP, "+":ROM_KEY_BYTE.PLUS, "-":ROM_KEY_BYTE.MINUS,
  "*":ROM_KEY_BYTE.CANCEL, ".":ROM_KEY_BYTE.REG, "#":ROM_KEY_BYTE.MEM, "/":ROM_KEY_BYTE.ALTER
};
function panelKeyDown(id,ev){
  if(romTyping) return;
  if(id==="0" && ev && (ev.ctrlKey||ev.metaKey)){ romDoReset(); return; }
  if(id==="0" && ev && ev.shiftKey){ romDoRTM(); return; }
  romPressKey(KEY_BYTE_BY_ID[id]);
}
function panelKeyUp(){
  if(romTyping) return;
  romReleaseKey();
}
(function buildKeypad(){
  const pad=document.getElementById("keypad");
  for(const k of KEYS){
    const b=document.createElement("button");
    b.className="key";
    b.innerHTML='<span class="top">'+k.top+'</span><span class="main">'+k.main+'</span><span class="sub">'+k.sub+"</span>";
    b.addEventListener("mousedown",(ev)=>panelKeyDown(k.id,ev));
    b.addEventListener("touchstart",(ev)=>panelKeyDown(k.id,ev),{passive:true});
    pad.appendChild(b);
  }
})();
window.addEventListener("mouseup",panelKeyUp);
window.addEventListener("touchend",panelKeyUp);
window.addEventListener("touchcancel",panelKeyUp);

// Physische Tastatur: M/R/A/C/L/D + Ziffern 0-7 + +/-, Strg+0=Reset,
// Umschalt+0=RTM — wie am Original-Panel, aber nur solange die H9-
// Konsole (crt) nicht gerade fokussiert ist (sonst geht die Eingabe
// dorthin, wie schon vorher in dieser Datei).
function digitFromEvent(e){
  const m = /^(?:Digit|Numpad)([0-9])$/.exec(e.code||'');
  if(m) return parseInt(m[1],10);
  const k=e.key;
  return (k>='0' && k<='9') ? parseInt(k,10) : null;
}
document.addEventListener("keydown",ev=>{
  if(H9ONLY||document.activeElement===crt)return;
  if(romTyping) return;
  const digit = digitFromEvent(ev);
  const hasModifier = ev.ctrlKey || ev.metaKey || ev.altKey;
  if(digit!==null && digit<=7){
    if((ev.ctrlKey||ev.metaKey) && digit===0){ romDoReset(); ev.preventDefault(); return; }
    if(ev.shiftKey && digit===0){ romDoRTM(); ev.preventDefault(); return; }
    if(hasModifier) return;
    romPressKey(ROM_KEY_BYTE[digit]); ev.preventDefault(); return;
  }
  if(hasModifier) return;
  const k=ev.key.toLowerCase();
  const map={m:'MEM', r:'REG', a:'ALTER', c:'CANCEL', l:'LOAD', d:'DUMP'};
  if(map[k]){ romPressKey(ROM_KEY_BYTE[map[k]]); ev.preventDefault(); return; }
  if(ev.key==='+'||ev.key==='='){ romPressKey(ROM_KEY_BYTE.PLUS); ev.preventDefault(); return; }
  if(ev.key==='-'){ romPressKey(ROM_KEY_BYTE.MINUS); ev.preventDefault(); return; }
});
document.addEventListener("keyup",ev=>{
  if(H9ONLY||document.activeElement===crt)return;
  if(romTyping) return;
  const digit = digitFromEvent(ev);
  if(digit!==null && digit<=7){ romReleaseKey(); return; }
  const k=ev.key.toLowerCase();
  if('mracld+=-'.includes(k)) romReleaseKey();
});

