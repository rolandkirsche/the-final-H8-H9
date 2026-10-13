/* ============================================================
   H9-Terminal: 80×12 (Original; mit ?rows=24 der historische 24-Zeilen-Ausbau), nur Großbuchstaben — bleibt auf derselben Seite
   eingebettet; die H8-5-Konsole schreibt/liest direkt in dieses
   Terminal-Objekt statt über einen WebSocket zu einem zweiten Fenster.
   ============================================================ */
// Zeilenzahl: Original-H9 = 12 Zeilen; historischer Ausbau 24 Zeilen mit ?rows=24
const H9_ROWS = new URLSearchParams(location.search).get("rows")==="24" ? 24 : 12;
const H9ONLY = document.documentElement.classList.contains("h9only");
// Zeichensatz 5x7 (Spaltenbytes, Bit0 = oberste Punktzeile), ASCII 0x20-0x5F — das H9 hat kein ROM,
// der Zeichensatz steckt hier im Code. Ein Zeichen ist ein Punktmuster, kein Schriftbild.
const H9_FONT = ('0000000000 00005F0000 0007000700 147F147F14 242A7F2A12 2313086462 3649552250 0005030000 ' +
  '001C224100 0041221C00 14083E0814 08083E0808 0050300000 0808080808 0060600000 2010080402 ' +
  '3E5149453E 00427F4000 4261514946 2141454B31 1814127F10 2745454539 3C4A494930 0171090503 ' +
  '3649494936 064949291E 0036360000 0056360000 0814224100 1414141414 0041221408 0201510906 ' +
  '324979413E 7E1111117E 7F49494936 3E41414122 7F4141221C 7F49494941 7F09090901 3E4149497A ' +
  '7F0808087F 00417F4100 2040413F01 7F08142241 7F40404040 7F020C027F 7F0408107F 3E4141413E ' +
  '7F09090906 3E4151215E 7F09192946 4649494931 01017F0101 3F4040403F 1F2040201F 3F4038403F ' +
  '6314081463 0708700807 6151494543 007F414100 0204081020 0041417F00 0402010204 4040404040')
  .split(/\s+/).map(h=>[0,2,4,6,8].map(i=>parseInt(h.substr(i,2),16)));
const h9Canvas=document.getElementById("h9canvas");
const h9Ctx=h9Canvas.getContext("2d");
const h9Phosphor=getComputedStyle(document.getElementById("h9stage")).getPropertyValue("--h9ph").trim()||"#7dffd6";
if(H9_ROWS===24){ const st=document.getElementById("h9stage").style; st.setProperty("--scr-top","11.2%"); }

const term={
  COLS:80, ROWS:H9_ROWS, row:0, col:0,
  buf:Array.from({length:H9_ROWS},()=>Array(80).fill(" ")),
  put(ch){
    if(ch===0x0D){this.col=0;}
    else if(ch===0x0A){this.newline();}
    else if(ch===0x07){beep(1400,.08);}
    else if(ch===0x08){if(this.col>0)this.col--;}
    else if(ch>=0x20&&ch<0x7F){
      this.buf[this.row][this.col]=String.fromCharCode(ch).toUpperCase();
      if(++this.col>=this.COLS){this.col=0;this.newline();}
    }
  },
  newline(){ if(++this.row>=this.ROWS){this.buf.shift();this.buf.push(Array(this.COLS).fill(" "));this.row=this.ROWS-1;} },
  home(){ this.row=0; this.col=0; },
  cursorUp(){ if(this.row>0) this.row--; },
  cursorDown(){ if(this.row<this.ROWS-1) this.row++; },
  cursorLeft(){ if(this.col>0) this.col--; },
  cursorRight(){ if(this.col<this.COLS-1) this.col++; },
  eraseToEOL(){ for(let c=this.col;c<this.COLS;c++) this.buf[this.row][c]=" "; },
  eraseToEOP(){
    this.eraseToEOL();
    for(let r=this.row+1;r<this.ROWS;r++) this.buf[r].fill(" ");
  },
  eraseScreen(){
    for(let r=0;r<this.ROWS;r++) this.buf[r].fill(" ");
    this.home();
  },
  render(){
    const dpr=window.devicePixelRatio||1;
    const w=Math.max(1,Math.round(h9Canvas.clientWidth*dpr)), h=Math.max(1,Math.round(h9Canvas.clientHeight*dpr));
    if(h9Canvas.width!==w||h9Canvas.height!==h){h9Canvas.width=w;h9Canvas.height=h;}
    const R=this.ROWS, C=this.COLS;
    const cw=w/C, ch=h/R;
    const p=cw/6.6;                                   // horizontaler Punktabstand (Zeichenabstand siehe 6.6)
    const gh=ch*(R===24?0.64:0.45), rp=gh/7;          // Glyphenhoehe, vertikaler Punktabstand
    const yo=(ch-gh)/2;
    h9Ctx.clearRect(0,0,w,h);
    h9Ctx.fillStyle=h9Phosphor;
    for(let r=0;r<R;r++){
      const line=this.buf[r];
      for(let c=0;c<C;c++){
        const code=line[c].charCodeAt(0);
        if(code===32) continue;
        const g=H9_FONT[code-32];
        if(!g) continue;
        const x0=c*cw+(cw-5*p)/2, y0=r*ch+yo;
        for(let gc=0;gc<5;gc++){
          const bits=g[gc]; if(!bits) continue;
          for(let gr=0;gr<7;gr++){
            if(bits&(1<<gr)) h9Ctx.fillRect(x0+gc*p,y0+gr*rp,p*1.1,rp*0.7);
          }
        }
      }
    }
    if(Math.floor(Date.now()/450)%2===0){
      h9Ctx.fillRect(this.col*cw+(cw-5.4*p)/2,this.row*ch+yo,p*5.4,gh);   // Blockcursor
    }
  }
};
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;");}
setInterval(()=>term.render(),120);
document.querySelector(".terminal-legend .hint").textContent="80 × "+H9_ROWS+" · nur Großbuchstaben · Bildschirm anklicken zum Tippen";

function termWrite(byte){ term.put(byte & 0x7F); }
function termClear(){ /* keine Out-of-Band-Clear-Leitung, no-op */ }

const crt=document.getElementById("crt");
function h9Key(ev){
  if(ev.metaKey||ev.ctrlKey||ev.isComposing||ev.key==="Dead")return;
  // Lokale Bildschirmtasten des H9 (wirken nur auf den Schirm, nichts geht zum H8)
  const local={ArrowUp:()=>term.cursorUp(),ArrowDown:()=>term.cursorDown(),ArrowLeft:()=>term.cursorLeft(),
    ArrowRight:()=>term.cursorRight(),Home:()=>term.home(),End:()=>term.eraseToEOL(),
    PageDown:()=>term.eraseToEOP(),Delete:()=>term.eraseScreen()};
  if(local[ev.key]){ local[ev.key](); term.render(); ev.preventDefault(); return; }
  if(ev.key==="F2"){   // Acey Ducey in die laufende BASIC-Sitzung tippen
    ev.preventDefault();
    if(!romTyping){ romTyping=true; (async()=>{ try{ for(const l of ACEYDUCEY_LINES) await typeBasicLine(l); } finally { romTyping=false; } })(); }
    return;
  }
  let code=null;
  if(ev.key==="Enter")code=0x0D;
  else if(ev.key==="Backspace")code=0x08;
  else if(ev.key.length===1)code=ev.key.toUpperCase().charCodeAt(0);
  if(code!==null&&code<128){rxQ.push(code);queueHostByte(code);ev.preventDefault();}
}
(H9ONLY?document:crt).addEventListener("keydown",h9Key);
if(H9ONLY){ document.addEventListener("click",()=>crt.focus()); }

