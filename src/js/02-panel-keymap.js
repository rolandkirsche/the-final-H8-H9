/* ============================================================
   PAM-8-Tastenmatrix und Segment-Zeichentabelle — empirisch aus dem
   laufenden ROM sowie aus "XCON8 ROM.asm" (T. Gulczynski Re-Creation
   2009, basierend auf J.G. Letwins PAM-8 von 1976) verifiziert.
   ============================================================ */
const ROM_KEY_BYTE = {
  0:0xFE, 1:0xFC, 2:0xFA, 3:0xF8, 4:0xF6, 5:0xF4, 6:0xF2, 7:0xF0,
  LOAD:0xEF, DUMP:0xCF, PLUS:0xAF, MINUS:0x8F, CANCEL:0x6F, ALTER:0x4F, MEM:0x2F, REG:0x0F
};
const ROM_NO_KEY = 0xFF;
const ROM_RTM_BYTE = 0x2E; // Wired-AND von MEM(0x2F) und Taste 0(0xFE) auf dem Tastaturbus

// Segment-Dekodierung Port 361 (aktiv-low, Bit0=g..Bit6=f, Bit7=Punkt separat).
const ROM_SEG = {
  0x01:'0',0x73:'1',0x48:'2',0x60:'3',0x32:'4',0x24:'5',0x04:'6',0x71:'7',0x00:'8',
  0x18:'P',0x10:'A',0x1c:'F',0x06:'b',0x0d:'C',0x42:'d',0x0c:'E',0x12:'H',0x0f:'L',0x4e:'c',
  0x38:'o', 0x3a:'u', 0x3d:'r', 0x1f:'I', 0x39:'n', 0x7b:'i', 0x20:'g',
  0x56:'N',
  0x1e:'[', 0x7e:'-', 0x72:']'
};
function decodeRomSeg(byte){
  const core = byte & 0x7f;
  return ROM_SEG[core]!==undefined ? ROM_SEG[core] : ' ';
}

