// Saját technológiai fázisábrák (SVG) a C04 és C05 fejezethez – a PPT régi, szkennelt rajzai helyett.
// Használat a HTML-ben: <div class="g3-phases" data-g3ph="franki"></div>  (vagy data-g3mini="beles" egy kis ikonhoz)
// Minden panel: égbolt + talajrétegek mintával, gép/szerszám sematikusan, a cölöp anyagai a közös mintákkal.
import { svg, h, arrow } from './core.js';

/* ------------------------------------------------------------------ alapelemek */
const R = (g, x, y, w, hh, cls, extra = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...extra }, g);
const PAT = (g, x, y, w, hh, pat, op = 1) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), fill: `url(#${pat})`, opacity: op }, g);
const L = (g, x1, y1, x2, y2, cls, w = 1.5, extra = {}) => svg('line', { x1, y1, x2, y2, class: cls, 'stroke-width': w, ...extra }, g);
const P = (g, d, cls, extra = {}) => svg('path', { d, class: cls, ...extra }, g);
const T = (g, x, y, s, anchor = 'start', cls = 't-sm halo') => svg('text', { x, y, class: cls, 'text-anchor': anchor, text: s }, g);

function lab(g, x, y, s, side = 1, lx = null) {
  // felirat vezetővonallal: (x,y) a pont, a szöveg oldalra
  const tx = lx ?? x + side * 16;
  L(g, x, y, tx - side * 2, y, 's-muted', 1);
  svg('circle', { cx: x, cy: y, r: 1.8, class: 'f-ink' }, g);
  T(g, tx, y + 3.5, s, side > 0 ? 'start' : 'end', 't-lab halo');
}

function ground(g, S, prof) {
  R(g, 0, 0, S.W, S.GY, 'f-sky');
  for (const l of prof.layers) {
    R(g, 0, l.y, S.W, (l.to ?? S.H) - l.y, l.cls);
    if (l.pat) PAT(g, 0, l.y, S.W, (l.to ?? S.H) - l.y, l.pat, 0.9);
    if (l.y > S.GY) L(g, 0, l.y, S.W, l.y, 's-soil', 1, { 'stroke-dasharray': '4 3' });
  }
  L(g, 0, S.GY, S.W, S.GY, 's-soil', 2);
}
function layerLabels(g, S, prof) {
  for (const l of prof.layers) if (l.lab) T(g, 5, l.y + 13, l.lab, 'start', 't-sm halo');
}
function gwl(g, S, y) {
  L(g, 0, y, S.W, y, 's-water', 1.4, { 'stroke-dasharray': '6 4' });
  const x = S.W - 14;
  P(g, `M${x - 6} ${y - 9} h12 l-6 8z`, 'f-surface', { style: 'stroke:var(--water);stroke-width:1.5' });
}
function conc(g, x, y, w, hh, fresh = false) {
  R(g, x, y, w, hh, fresh ? 'f-fresh' : 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
  PAT(g, x, y, w, hh, 'pat-conc', fresh ? 0.6 : 1);
}
function wavyShaft(g, cx, top, bot, w) {
  // döngölt, hullámos felületű Franki-törzs
  const n = Math.max(2, Math.round((bot - top) / 14)), st = (bot - top) / n;
  let d = `M${cx - w / 2} ${top}`;
  for (let i = 0; i < n; i++) d += ` q-4 ${st / 2} 0 ${st}`;
  d += ` H${cx + w / 2}`;
  for (let i = 0; i < n; i++) d += ` q4 ${-st / 2} 0 ${-st}`;
  d += 'z';
  P(g, d, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
  P(g, d, '', { fill: 'url(#pat-conc)' });
}
function bulb(g, cx, cy, rx, ry) {
  const d = `M${cx - rx * 0.55} ${cy - ry} C${cx - rx * 1.15} ${cy - ry * 0.7} ${cx - rx * 1.05} ${cy + ry} ${cx} ${cy + ry} C${cx + rx * 1.05} ${cy + ry} ${cx + rx * 1.15} ${cy - ry * 0.7} ${cx + rx * 0.55} ${cy - ry}z`;
  P(g, d, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
  P(g, d, '', { fill: 'url(#pat-conc)' });
}
function casing(g, cx, top, bot, w, t = 3.5) {
  R(g, cx - w / 2 - t, top, t, bot - top, 'f-steel2');
  R(g, cx + w / 2, top, t, bot - top, 'f-steel2');
}
function hole(g, cx, top, bot, w, cls = 'f-bg2') { R(g, cx - w / 2, top, w, bot - top, cls); }
function water(g, cx, top, bot, w) { R(g, cx - w / 2, top, w, bot - top, 'f-water'); }
function slurry(g, cx, top, bot, w) { R(g, cx - w / 2, top, w, bot - top, 'f-slurry', { opacity: 0.55 }); PAT(g, cx - w / 2, top, w, bot - top, 'pat-slurry'); }
function cage(g, cx, top, bot, w) {
  const x1 = cx - w / 2 + 3, x2 = cx + w / 2 - 3;
  L(g, x1, top, x1, bot, 's-rebar', 1.6); L(g, x2, top, x2, bot, 's-rebar', 1.6); L(g, cx, top, cx, bot, 's-rebar', 1);
  let d = `M${x1} ${top + 4}`; let s = 1;
  for (let y = top + 4; y < bot - 8; y += 10) { d += ` L${s > 0 ? x2 : x1} ${y + 10}`; s = -s; }
  P(g, d, 's-rebar', { fill: 'none', 'stroke-width': 1.1 });
}
function stem(g, cx, top, bot, w = 6) { R(g, cx - w / 2, top, w, bot - top, 'f-steel2'); }
function auger(g, cx, top, bot, w, soilCls = null, from = null) {
  if (soilCls) R(g, cx - w / 2, Math.max(top, from ?? top), w, bot - Math.max(top, from ?? top), soilCls, { opacity: 0.92 });
  stem(g, cx, top, bot, 6);
  for (let y = top + 4; y < bot - 4; y += 12) P(g, `M${cx - w / 2} ${y} L${cx + w / 2} ${y + 7}`, 's-steel', { 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none' });
  P(g, `M${cx - w / 2} ${bot - 4} L${cx} ${bot + 4} L${cx + w / 2} ${bot - 4}`, 's-steel', { fill: 'none', 'stroke-width': 2.4 });
}
function shortAuger(g, cx, top, bot, w) {
  stem(g, cx, top, bot - 26, 5);
  auger(g, cx, bot - 28, bot, w);
}
function bucket(g, cx, bot, w) {
  // dobfúró: henger, alul fogakkal
  R(g, cx - w / 2, bot - 30, w, 28, 'f-steel', { style: 'stroke:var(--steelm2);stroke-width:1.2' });
  for (let i = 0; i < 4; i++) P(g, `M${cx - w / 2 + 3 + i * (w - 6) / 3} ${bot - 2} l-2 5 l5 0z`, 'f-steel2');
}
function dispHead(g, cx, tip, w) {
  // kiszorító fúrófej (csavart cölöp): kúpos csúcs, kiszélesedő test, rövid csavarmenet
  P(g, `M${cx - 5} ${tip - 52} L${cx - w / 2} ${tip - 30} L${cx - w / 2} ${tip - 16} L${cx} ${tip} L${cx + w / 2} ${tip - 16} L${cx + w / 2} ${tip - 30} L${cx + 5} ${tip - 52}z`, 'f-steel', { style: 'stroke:var(--steelm2);stroke-width:1.2' });
  P(g, `M${cx - w / 2 - 3} ${tip - 26} L${cx + w / 2 + 3} ${tip - 20} M${cx - w / 2 - 2} ${tip - 40} L${cx + w / 2 - 6} ${tip - 34}`, 's-steel', { 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' });
}
function rig(g, S, headY, o = {}) {
  // sematikus cölöpözőgép: árboc, forgatófej, lánctalp, fülke
  const mx = S.cx + 24, base = S.GY - 3;
  R(g, mx, 4, 6, base - 14, 'f-steel2');
  R(g, S.cx + 16, base - 13, Math.min(64, S.W - S.cx - 18), 11, 'f-steel2', { rx: 5 });
  for (let i = 0; i < 4; i++) svg('circle', { cx: S.cx + 22 + i * Math.min(15, (S.W - S.cx - 32) / 3.4), cy: base - 7.5, r: 3, class: 'f-surface' }, g);
  R(g, mx + 8, base - 34, Math.min(26, S.W - mx - 12), 20, 'f-steel', { rx: 3 });
  R(g, mx + 12, base - 30, 9, 8, 'f-surface', { opacity: 0.8 });
  if (o.head !== false) { R(g, S.cx - 11, headY, 22, 14, 'f-steel', { rx: 2, style: 'stroke:var(--steelm2);stroke-width:1.2' }); L(g, S.cx + 11, headY + 7, mx, headY + 7, 's-steel', 3); }
  if (o.pulley) { svg('circle', { cx: S.cx, cy: 9, r: 4, class: 'f-steel2' }, g); L(g, S.cx, 9, mx, 9, 's-steel', 3); }
}
function truck(g, x, y) {
  // mixer / betonpumpa
  R(g, x, y - 16, 30, 12, 'f-steel2', { rx: 2 });
  svg('ellipse', { cx: x + 14, cy: y - 22, rx: 13, ry: 8, class: 'f-conc', style: 'stroke:var(--concrete2);stroke-width:1' }, g);
  R(g, x + 30, y - 18, 10, 14, 'f-steel', { rx: 2 });
  for (const dx of [6, 22, 35]) svg('circle', { cx: x + dx, cy: y - 3, r: 3, class: 'f-ink' }, g);
}
function hose(g, x1, y1, x2, y2) { P(g, `M${x1} ${y1} C${x1 + 10} ${y2 - 40} ${x2 - 30} ${y2 - 10} ${x2} ${y2}`, 's-ink', { fill: 'none', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.75 }); }
function funnel(g, cx, top, bot) {
  P(g, `M${cx - 16} ${top} L${cx - 4} ${top + 14} L${cx + 4} ${top + 14} L${cx + 16} ${top}z`, 'f-steel', { style: 'stroke:var(--steelm2);stroke-width:1.2' });
  R(g, cx - 3.5, top + 14, 7, bot - top - 14, 'f-steel', { style: 'stroke:var(--steelm2);stroke-width:1' });
}
const down = (g, x, y1, y2, cls = 's-acc') => arrow(g, x, y1, x, y2, { cls, w: 2.4, head: 8 });
const up = (g, x, y1, y2, cls = 's-acc') => arrow(g, x, y1, x, y2, { cls, w: 2.4, head: 8 });
function rot(g, cx, y, r) {
  const gg = svg('g', {}, g); gg.style.color = 'var(--accent)';
  P(gg, `M${cx - r} ${y} A${r} ${r * 0.38} 0 0 0 ${cx + r} ${y}`, '', { fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2 });
  P(gg, `M${cx + r + 4} ${y - 5} L${cx + r} ${y + 3} L${cx + r - 6} ${y - 4}z`, '', { fill: 'currentColor' });
}
function push(g, cx, y, w) { arrow(g, cx - w / 2 - 2, y, cx - w / 2 - 16, y, { cls: 's-acc', w: 2, head: 6 }); arrow(g, cx + w / 2 + 2, y, cx + w / 2 + 16, y, { cls: 's-acc', w: 2, head: 6 }); }
function heap(g, x, w) { return (S) => P(g, `M${x} ${S.GY} q${w / 2} -10 ${w} 0z`, 'f-soilC'); }

/* ------------------------------------------------------------------ talajszelvények */
const PROF = {
  franki: (S) => ({ layers: [{ y: S.GY, to: 206, cls: 'f-soilB', pat: 'pat-clay', lab: 'puha, kötött réteg' }, { y: 206, cls: 'f-soilD', pat: 'pat-gravel', lab: 'teherbíró réteg' }] }),
  csavart: (S) => ({ layers: [{ y: S.GY, to: 200, cls: 'f-soilA', pat: 'pat-sand', lab: 'laza homok' }, { y: 200, cls: 'f-soilD', pat: 'pat-sand', lab: 'közepesen tömör homok' }] }),
  cfa: (S) => ({ layers: [{ y: S.GY, to: 182, cls: 'f-soilC', pat: 'pat-clay', lab: 'iszapos agyag' }, { y: 182, cls: 'f-soilA', pat: 'pat-sand', lab: 'homok' }], gw: 132 }),
  kopeny: (S) => ({ layers: [{ y: S.GY, to: 206, cls: 'f-soilC', pat: 'pat-clay', lab: 'iszapos, puha réteg' }, { y: 206, cls: 'f-soilD', pat: 'pat-gravel', lab: 'homokos kavics' }], gw: 122 }),
  zagy: (S) => ({ layers: [{ y: S.GY, to: 120, cls: 'f-soilC', lab: 'feltöltés' }, { y: 120, to: 252, cls: 'f-soilA', pat: 'pat-sand', lab: 'homok' }, { y: 252, cls: 'f-soilE', pat: 'pat-clay', lab: 'kemény agyag' }], gw: 112 }),
  nelkul: (S) => ({ layers: [{ y: S.GY, cls: 'f-soilB', pat: 'pat-clay', lab: 'kötött talaj (agyag)' }] }),
};

/* ------------------------------------------------------------------ a fázisok */
// minden fázis: [cím, rövid leírás, rajzoló(g, S)]
const PH = {
  franki: { W: 160, prof: 'franki', items: [
    ['Dugó', 'száraz beton a cső aljában, döngölve', (g, S) => {
      rig(g, S, 0, { head: false, pulley: true }); casing(g, S.cx, 26, S.GY + 8, 22); conc(g, S.cx - 11, S.GY - 18, 22, 26);
      R(g, S.cx - 8, 34, 16, 20, 'f-steel2'); L(g, S.cx, 9, S.cx, 34, 's-muted', 1.2); down(g, S.cx + 19, 28, 56); lab(g, S.cx - 11, S.GY - 6, 'dugó', -1, S.cx - 28); lab(g, S.cx - 8, 44, 'kos', -1, S.cx - 28);
    }],
    ['Leverés', 'a dugó magával húzza le a csövet', (g, S) => {
      rig(g, S, 0, { head: false, pulley: true }); casing(g, S.cx, 26, 196, 22); conc(g, S.cx - 11, 172, 22, 24); R(g, S.cx - 8, 150, 16, 20, 'f-steel2'); L(g, S.cx, 9, S.cx, 150, 's-muted', 1.2);
      push(g, S.cx, 192, 29); down(g, S.cx + 28, 104, 150);
    }],
    ['Kiverés', 'a rögzített csőből kiverik a dugót', (g, S) => {
      rig(g, S, 0, { head: false, pulley: true }); casing(g, S.cx, 26, 238, 22); bulb(g, S.cx, 246, 15, 10); R(g, S.cx - 8, 214, 16, 20, 'f-steel2'); L(g, S.cx, 9, S.cx, 214, 's-muted', 1.2);
      L(g, S.cx - 18, 30, S.cx + 18, 30, 's-ink', 3); T(g, S.cx - 22, 24, 'rögzítve', 'end', 't-sm halo');
    }],
    ['Hagyma', 'újabb adagok: kiszélesedő talp', (g, S) => {
      rig(g, S, 0, { head: false, pulley: true }); casing(g, S.cx, 26, 238, 22); bulb(g, S.cx, 262, 30, 22); conc(g, S.cx - 11, 226, 22, 12); R(g, S.cx - 8, 120, 16, 20, 'f-steel2'); L(g, S.cx, 9, S.cx, 120, 's-muted', 1.2);
      P(g, `M${S.cx - 44} 18 q14 -10 26 6`, 's-acc', { fill: 'none', 'stroke-width': 2.2 }); arrow(g, S.cx - 20, 20, S.cx - 16, 30, { cls: 's-acc', w: 2.2, head: 7 }); T(g, S.cx - 46, 40, 'beton', 'start', 't-sm halo');
      lab(g, S.cx + 26, 262, 'hagyma', 1, S.cx + 40);
    }],
    ['Vasalás', 'a kosár a csőbe, a hagymáig', (g, S) => {
      rig(g, S, 0, { head: false, pulley: true }); casing(g, S.cx, 26, 238, 22); bulb(g, S.cx, 262, 30, 22); cage(g, S.cx, 22, 258, 20); L(g, S.cx, 9, S.cx, 22, 's-muted', 1.2);
      lab(g, S.cx + 9, 120, 'kosár', 1, S.cx + 30);
    }],
    ['Törzs', 'döngölés, közben a cső visszahúzása', (g, S) => {
      rig(g, S, 0, { head: false, pulley: true }); bulb(g, S.cx, 262, 30, 22); wavyShaft(g, S.cx, 150, 248, 30); casing(g, S.cx, 6, 154, 22); cage(g, S.cx, 22, 258, 20); R(g, S.cx - 8, 120, 16, 20, 'f-steel2');
      up(g, S.cx - 28, 140, 100); up(g, S.cx + 28, 140, 100);
    }],
    ['Kész', 'Ø ≈ 60 cm, legfeljebb 16–18 m', (g, S) => {
      bulb(g, S.cx, 262, 30, 22); wavyShaft(g, S.cx, S.GY - 2, 248, 30); cage(g, S.cx, S.GY - 16, 258, 20);
      lab(g, S.cx + 16, 150, 'törzs', 1, S.cx + 32); lab(g, S.cx + 26, 266, 'talp', 1, S.cx + 40);
    }],
  ] },
  csavart: { W: 200, prof: 'csavart', items: [
    ['Pontraállás', 'A gép a cölöp helye fölé áll; az üreges fúrószár végén a kiszorító fúrófej.', (g, S) => {
      rig(g, S, 24); stem(g, S.cx, 38, S.GY - 50, 10); dispHead(g, S.cx, S.GY, 26); lab(g, S.cx - 13, S.GY - 26, 'fúrófej', -1, S.cx - 30);
    }],
    ['Fúrás', 'Forgatással és tolással hajtják le: a fej oldalra tolja és tömöríti a talajt, nem hozza fel.', (g, S) => {
      rig(g, S, 24); stem(g, S.cx, 38, 140, 10); dispHead(g, S.cx, 192, 26); rot(g, S.cx, 64, 16); down(g, S.cx - 30, 100, 140);
      push(g, S.cx, 168, 26); push(g, S.cx, 150, 16);
    }],
    ['Megállás', 'Az előírt mélységben a fúrás leáll; a gép a fúrás adatait folyamatosan rögzíti.', (g, S) => {
      rig(g, S, 24); stem(g, S.cx, 38, 236, 10); dispHead(g, S.cx, 288, 26);
      L(g, S.cx + 20, 288, S.W - 4, 288, 's-ink', 1.2, { 'stroke-dasharray': '4 3' }); T(g, S.W - 6, 302, 'előírt mélység', 'end', 't-sm halo');
    }],
    ['Betonozás', 'Nyomás alatt betonoznak a fúrószáron át, a szár kiemelése és forgatása közben.', (g, S) => {
      rig(g, S, 24); conc(g, S.cx - 13, 200, 26, 88, true); stem(g, S.cx, 38, 152, 10); dispHead(g, S.cx, 204, 26); rot(g, S.cx, 64, 16); up(g, S.cx - 30, 150, 110);
      truck(g, 6, S.GY - 3); hose(g, 34, S.GY - 26, S.cx - 11, 34); lab(g, S.cx + 13, 250, 'friss beton', 1, S.cx + 28);
    }],
    ['Vasalás', 'A vasalókosarat a friss betonba juttatják, szükség esetén vibrációval.', (g, S) => {
      conc(g, S.cx - 13, S.GY, 26, 204, true); cage(g, S.cx, S.GY - 24, 250, 22); R(g, S.cx - 12, S.GY - 40, 24, 16, 'f-steel', { rx: 2 });
      P(g, `M${S.cx - 8} ${S.GY - 44} l4 -5 l4 5 l4 -5 l4 5`, 's-acc', { fill: 'none', 'stroke-width': 1.8 }); down(g, S.cx + 26, S.GY - 30, S.GY + 14);
      lab(g, S.cx - 9, 160, 'kosár', -1, S.cx - 28);
    }],
  ] },
  cfa: { W: 230, prof: 'cfa', items: [
    ['Kitűzés, pontraállás', 'Kitűzik a cölöp helyét, és a gép pontraáll. Az üreges fúrószár alját elvesző sapka vagy „csapóajtó” zárja.', (g, S) => {
      rig(g, S, 22); auger(g, S.cx, 36, S.GY - 2, 30); lab(g, S.cx, S.GY + 1, 'csapóajtó', -1, S.cx - 34);
    }],
    ['Furatkészítés', 'A spirált földkitermelés nélkül hajtják le: a furadék csak részben nyomódik ki, a spirálon maradó talajdugó folyamatosan támasztja a furat falát.', (g, S) => {
      rig(g, S, 22); auger(g, S.cx, 36, 292, 30, 'f-soilC', S.GY); heap(g, S.cx - 44, 22)(S); heap(g, S.cx + 20, 18)(S); rot(g, S.cx, 58, 20);
      lab(g, S.cx - 15, 160, 'talajdugó', -1, S.cx - 34);
    }],
    ['Betonozás', 'A fúrószáron át túlnyomással betont pumpálnak, amely feltolja a spirált – ezt húzással segítik. Vibrálni nem kell: a folyós beton nyomás alatt öntömörödik.', (g, S) => {
      rig(g, S, 22); conc(g, S.cx - 15, 204, 30, 88, true); auger(g, S.cx, 36, 204, 30, 'f-soilC', S.GY); up(g, S.cx - 34, 200, 160);
      truck(g, 6, S.GY - 3); hose(g, 34, S.GY - 26, S.cx - 11, 32); lab(g, S.cx + 15, 250, 'beton', 1, S.cx + 30);
    }],
    ['Vasalás', 'A cölöpöt általában a munkaszintig betonozzák fel, és a vasalókosarat a friss betonba süllyesztik.', (g, S) => {
      conc(g, S.cx - 15, S.GY, 30, 208, true); cage(g, S.cx, S.GY - 36, 240, 26); down(g, S.cx + 32, S.GY - 30, S.GY + 20);
      lab(g, S.cx - 13, 170, 'kosár', -1, S.cx - 32);
    }],
  ] },
  kopeny: { W: 200, prof: 'kopeny', items: [
    ['A cső lehajtása', 'A béléscsövet rotációval vagy vibrálással hajtják le.', (g, S) => {
      rig(g, S, S.GY - 26, { head: false }); R(g, S.cx - 22, S.GY - 26, 44, 14, 'f-steel', { rx: 2, style: 'stroke:var(--steelm2);stroke-width:1.2' }); L(g, S.cx + 22, S.GY - 19, S.cx + 24, S.GY - 19, 's-steel', 3);
      casing(g, S.cx, S.GY - 30, 160, 30); rot(g, S.cx, S.GY - 34, 26); down(g, S.cx - 36, 110, 150); lab(g, S.cx + 19, 140, 'béléscső', 1, S.cx + 34);
    }],
    ['Földkiemelés', 'A cső védelmében dobfúróval emelik ki a talajt; a cső jár elöl, víz alatt pótolják a vizet.', (g, S) => {
      rig(g, S, 22); casing(g, S.cx, S.GY - 30, 272, 30); hole(g, S.cx, S.GY - 30, 262, 30); water(g, S.cx, 116, 262, 30); stem(g, S.cx, 36, 230, 5); bucket(g, S.cx, 258, 26);
      lab(g, S.cx - 15, 116, 'víz a csőben', -1, S.cx - 30);
    }],
    ['Vasalás', 'A vasalókosarat a furatba, a cső belsejébe engedik.', (g, S) => {
      casing(g, S.cx, S.GY - 30, 272, 30); hole(g, S.cx, S.GY - 30, 270, 30); water(g, S.cx, 116, 270, 30); cage(g, S.cx, 26, 266, 26); L(g, S.cx, 4, S.cx, 26, 's-muted', 1.2);
      lab(g, S.cx + 13, 200, 'kosár', 1, S.cx + 32);
    }],
    ['Betonozás', 'Betonozó csővel betonoznak, közben a béléscsövet folyamatosan visszahúzzák.', (g, S) => {
      conc(g, S.cx - 15, 176, 30, 94, true); casing(g, S.cx, S.GY - 50, 212, 30); hole(g, S.cx, S.GY - 50, 176, 30); water(g, S.cx, 116, 176, 30); cage(g, S.cx, 30, 266, 26); funnel(g, S.cx, 28, 236);
      up(g, S.cx - 36, 200, 160); up(g, S.cx + 36, 200, 160); truck(g, 4, S.GY - 3);
    }],
    ['Kész cölöp', 'A visszanyert cső helyén kész vasbeton cölöp marad.', (g, S) => {
      conc(g, S.cx - 15, S.GY, 30, 190); cage(g, S.cx, S.GY - 14, 266, 26); lab(g, S.cx + 15, 160, 'vb. cölöp', 1, S.cx + 30);
    }],
  ] },
  zagy: { W: 160, prof: 'zagy', items: [
    ['Előkészítés', 'pontraállás, előfúrás, vezetőcső', (g, S) => {
      rig(g, S, 22); casing(g, S.cx, S.GY - 10, S.GY + 32, 34); shortAuger(g, S.cx, 36, S.GY + 26, 28); lab(g, S.cx + 20, S.GY + 22, 'vezetőcső', 1, S.cx + 34);
    }],
    ['Zagy betöltése', 'bentonitos fúrófolyadék a furatba', (g, S) => {
      casing(g, S.cx, S.GY - 10, S.GY + 32, 34); slurry(g, S.cx, S.GY - 4, S.GY + 40, 30); P(g, `M8 ${S.GY - 30} H${S.cx - 8} v22`, 's-ink', { fill: 'none', 'stroke-width': 4, opacity: 0.7 });
      down(g, S.cx - 8, S.GY - 6, S.GY + 8, 's-ink'); T(g, 8, S.GY - 36, 'zagy', 'start', 't-lab halo');
    }],
    ['Talajkiemelés', 'spirállal vagy dobfúróval, zagy alatt', (g, S) => {
      rig(g, S, 22); casing(g, S.cx, S.GY - 10, S.GY + 32, 34); slurry(g, S.cx, S.GY + 2, 298, 30); stem(g, S.cx, 36, 272, 5); bucket(g, S.cx, 298, 26); rot(g, S.cx, 58, 16);
      lab(g, S.cx - 15, S.GY + 2, 'zagyszint', -1, S.cx - 30);
    }],
    ['Kontraktorcső', 'talptisztítás, kosár, a betonozás indul', (g, S) => {
      casing(g, S.cx, S.GY - 10, S.GY + 32, 34); slurry(g, S.cx, S.GY + 2, 280, 30); conc(g, S.cx - 15, 280, 30, 18, true); cage(g, S.cx, S.GY - 18, 296, 26); funnel(g, S.cx, 30, 290);
      lab(g, S.cx + 4, 220, 'kontraktorcső', 1, S.cx + 22);
    }],
    ['Betonozás', 'alulról a terepszintig, a zagy kiszorul', (g, S) => {
      casing(g, S.cx, S.GY - 10, S.GY + 32, 34); conc(g, S.cx - 15, S.GY + 10, 30, 288 - S.GY, true); slurry(g, S.cx, S.GY + 2, S.GY + 10, 30); cage(g, S.cx, S.GY - 18, 296, 26); funnel(g, S.cx, 30, 200);
      P(g, `M${S.cx + 18} ${S.GY - 2} q20 -6 30 -22`, 's-ink', { fill: 'none', 'stroke-width': 2.2, opacity: 0.7 }); T(g, S.cx + 20, S.GY - 30, 'zagy ki', 'start', 't-sm halo');
    }],
    ['Vezetőcső ki', 'a vezetőcső eltávolítása, kész a cölöp', (g, S) => {
      conc(g, S.cx - 15, S.GY, 30, 298 - S.GY); cage(g, S.cx, S.GY - 14, 296, 26); casing(g, S.cx, S.GY - 46, S.GY - 6, 34); up(g, S.cx - 30, S.GY - 6, S.GY - 40); up(g, S.cx + 30, S.GY - 6, S.GY - 40);
    }],
  ] },
  nelkul: { W: 200, prof: 'nelkul', items: [
    ['Fúrás', 'Rövid spirállal (vagy markolóval) kötött talajban, talajvíz felett: a furat fala megtámasztás nélkül áll.', (g, S) => {
      rig(g, S, 22); hole(g, S.cx, S.GY, 244, 34); shortAuger(g, S.cx, 36, 244, 30); lab(g, S.cx + 17, 170, 'a fal megáll', 1, S.cx + 30);
    }],
    ['Betonozás', 'A kiemelés után rögtön betonoznak, tölcsérrel, gravitációsan.', (g, S) => {
      hole(g, S.cx, S.GY, 244, 34); conc(g, S.cx - 17, 176, 34, 68, true); funnel(g, S.cx, 40, 226); truck(g, 8, S.GY - 3);
      P(g, `M${S.cx - 46} ${S.GY - 40} q20 -10 30 4`, 's-acc', { fill: 'none', 'stroke-width': 2.2 }); lab(g, S.cx + 17, 210, 'beton', 1, S.cx + 30);
    }],
  ] },
};

/* kis ikonok a furatállékonyság módjaihoz (C05, 5.3) */
const MINI = {
  beles: (g, S) => { ground(g, S, { layers: [{ y: S.GY, cls: 'f-soilA', pat: 'pat-sand' }] }); casing(g, S.cx, S.GY - 16, S.H - 26, 30); hole(g, S.cx, S.GY - 16, S.H - 34, 30); water(g, S.cx, 70, S.H - 34, 30); gwl(g, S, 76); },
  zagy: (g, S) => { ground(g, S, { layers: [{ y: S.GY, cls: 'f-soilA', pat: 'pat-sand' }] }); slurry(g, S.cx, S.GY + 2, S.H - 20, 30); gwl(g, S, 76); },
  talaj: (g, S) => { ground(g, S, { layers: [{ y: S.GY, cls: 'f-soilC', pat: 'pat-clay' }] }); auger(g, S.cx, 6, S.H - 20, 30, 'f-soilC', S.GY); gwl(g, S, 96); },
  nincs: (g, S) => { ground(g, S, { layers: [{ y: S.GY, cls: 'f-soilB', pat: 'pat-clay' }] }); hole(g, S.cx, S.GY, S.H - 30, 30); },
};

function draw(def, i, n) {
  const W = def.W, H = 330, S = { W, H, GY: 84, cx: W / 2 };
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'g3-svg', role: 'img', 'aria-label': `${i + 1}. ${def.items[i][0]}` });
  const g = svg('g', {}, s);
  const prof = PROF[def.prof](S);
  ground(g, S, prof);
  if (prof.gw) gwl(g, S, prof.gw);
  def.items[i][2](g, S);
  if (i === 0) layerLabels(g, S, prof);
  return s;
}

function init() {
  for (const el of document.querySelectorAll('[data-g3ph]')) {
    const def = PH[el.dataset.g3ph]; if (!def) continue;
    el.style.setProperty('--n', def.items.length);
    if (def.items.length >= 6) el.classList.add('g3-many');
    def.items.forEach(([t, d], i) => {
      el.append(h('figure', { class: 'g3-ph' }, draw(def, i, def.items.length), h('figcaption', {}, h('b', {}, h('i', {}, String(i + 1)), t), h('span', {}, d))));
    });
  }
  for (const el of document.querySelectorAll('[data-g3mini]')) {
    const f = MINI[el.dataset.g3mini]; if (!f) continue;
    const W = 150, H = 200, S = { W, H, GY: 40, cx: W / 2 };
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'g3-mini-svg', 'aria-hidden': 'true' });
    f(svg('g', {}, s), S);
    el.append(s);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
