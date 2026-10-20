/* ============================================================
   Sieben-Segment-Anzeige (9 Stellen) — SVG-Aufbau unverändert,
   Zeichensatz um Buchstaben erweitert (Registernamen, Lauftext).
   ============================================================ */
const SEG={
  "0":"abcdef","1":"bc","2":"abdeg","3":"abcdg","4":"bcfg","5":"acdfg","6":"acdefg","7":"abc","8":"abcdefg",
  "A":"abcefg","b":"cdefg","C":"adef","c":"deg","d":"bcdeg","E":"adefg","H":"bcefg","L":"def","P":"abefg",
  "S":"acdfg","F":"aefg","o":"abfg","u":"bfg","r":"af","I":"ef","n":"abf","N":"ceg","i":"b","g":"abcdfg",
  "[":"efg","-":"g","]":"bcg"," ":""
};
const SEGPTS={
  a:"12,12 18,6 42,6 48,12 42,18 18,18",
  g:"12,50 18,44 42,44 48,50 42,56 18,56",
  d:"12,88 18,82 42,82 48,88 42,94 18,94",
  b:"48,14 54,20 54,44 48,50 42,44 42,20",
  c:"48,52 54,58 54,82 48,88 42,82 42,58",
  f:"12,14 18,20 18,44 12,50 6,44 6,20",
  e:"12,52 18,58 18,82 12,88 6,82 6,58"
};
const digits=[];
(function buildDisplay(){
  const win=document.getElementById("ledwin");
  const NS="http://www.w3.org/2000/svg";
  for(let i=0;i<9;i++){
    const svg=document.createElementNS(NS,"svg");
    svg.setAttribute("viewBox","0 0 68 100");
    svg.classList.add("digit");
    if(i===3||i===6)svg.classList.add("gap");
    const segs={};
    for(const s of "abcdefg"){
      const p=document.createElementNS(NS,"polygon");
      p.setAttribute("points",SEGPTS[s]);svg.appendChild(p);segs[s]=p;
    }
    const dp=document.createElementNS(NS,"circle");
    dp.setAttribute("cx","62");dp.setAttribute("cy","91");dp.setAttribute("r","4.5");
    svg.appendChild(dp);
    win.appendChild(svg);
    digits.push({segs,dp});
  }
})();
function setDigit(i,ch,dp){
  const on=SEG[ch]||"";
  for(const s of "abcdefg")digits[i].segs[s].classList.toggle("on",on.includes(s));
  digits[i].dp.classList.toggle("on",!!dp);
}
function oct3(v){return v.toString(8).padStart(3,"0");}

