// C01 – 1.2 A mélyalapozás típusai: interaktív terepmetszet-panoráma (cölöpalap, résfal, kútalap, szekrény/keszon, átmeneti)
import { $, $$, h, svg, register, shell, seg } from './core.js';

const NB = ' ';
const W = 1520, H = 700, G = 250, S = 17; // 1 m = 17 egység (függőlegesen)
const Y = (d) => G + d * S;
// a teherbíró réteg teteje (m) a panoráma mentén – koszinuszos simítás a pontok között
const BT = [[0, 11.5], [330, 11.0], [560, 10.2], [700, 7.0], [900, 6.5], [1085, 8.6], [1240, 6.2], [1300, 4.8], [1520, 5.8]];
function bt(x) {
  for (let i = 0; i < BT.length - 1; i++) {
    const [x0, d0] = BT[i], [x1, d1] = BT[i + 1];
    if (x <= x1) { const t = (x - x0) / (x1 - x0), u = (1 - Math.cos(Math.PI * Math.max(0, t))) / 2; return d0 + (d1 - d0) * u; }
  }
  return BT[BT.length - 1][1];
}
const hc = (x) => bt(x) + 7.5; // kemény agyag teteje
// folyó: vízszint 0,5 m, meder 4,5 m mélyen, rézsűs partokkal
const RX0 = 945, RX1 = 1225, WL = 0.5, RB = 4.5;
function top(x) { // a talaj felszíne (m)
  if (x <= RX0 || x >= RX1) return 0;
  if (x < RX0 + 50) return RB * (x - RX0) / 50;
  if (x > RX1 - 50) return RB * (RX1 - x) / 50;
  return RB;
}
const FILL = 1.2; // feltöltés vastagsága

export const TT_SCENES = [
  { k: 'colop', t: 'Cölöpalap', s: 'karcsú elemek a teherbíró rétegbe', x0: 34, x1: 330, zh: 520, c: 'var(--accent)',
    o: 'Karcsú, egyedi elemek viszik le a terhet a teherbíró rétegbe – a talpukon és a köpenyükön.' },
  { k: 'resfal', t: 'Résfal', s: 'fal a talajban: alap és határolás', x0: 330, x1: 660, zh: 615, c: 'var(--g4)',
    o: 'Folytonos vasbeton fal a talajban: alap és munkatérhatárolás egyben – a mélygarázs falát is adja.' },
  { k: 'kut', t: 'Kútalap', s: 'süllyesztett, nagy átmérőjű testek', x0: 660, x1: 930, zh: 470, c: 'var(--g5)',
    o: 'Nagy átmérőjű, süllyesztett, majd kibetonozott testek egyedi pillérek alatt; felül gerendarács köti össze őket.' },
  { k: 'szekreny', t: 'Szekrény · keszon', s: 'az építmény alaprajzán süllyesztve', x0: 930, x1: 1240, zh: 480, c: 'var(--g5)',
    o: 'Egyetlen nagy, az építmény alaprajzával azonos test – a folyómederben álló hídpillérek klasszikus alapja.' },
  { k: 'atmeneti', t: 'Átmeneti megoldások', s: 'markolt tömbalap · merev betétek', x0: 1240, x1: 1520, zh: 440, c: 'var(--g3)',
    o: 'A sík- és a mélyalap határán: markolt tömbalap, illetve merev betétes talajjavítás teherelosztó réteggel.' },
];

/* ---------------------------------------------------------------- rajzsegédek */
const R = (p, x, y, w, hh, cls, o = {}) => svg('rect', { x, y, width: w, height: hh, class: cls, ...o }, p);
const P = (p, d, cls, o = {}) => svg('path', { d, class: cls, ...o }, p);
const T = (p, x, y, text, cls = 'tt-lab', o = {}) => svg('text', { x, y, class: cls + ' halo', text, ...o }, p);
function conc(p, x, y, w, hh, cls = 'f-conc') {
  R(p, x, y, w, hh, cls);
  R(p, x, y, w, hh, '', { fill: 'url(#pat-conc)', opacity: 0.7 });
  R(p, x, y, w, hh, 's-ink', { fill: 'none', 'stroke-width': 1, opacity: 0.5 });
}
function hatchPoly(p, d, cls, pat, op = 0.55) { P(p, d, cls); P(p, d, '', { fill: `url(#${pat})`, opacity: op }); }
function band(fTop, fBot, x0 = 0, x1 = W, step = 8) { // két határgörbe közötti sáv útvonala
  const a = [], b = [];
  for (let x = x0; x <= x1; x += step) { a.push([x, Y(fTop(x))]); b.push([x, Y(fBot(x))]); }
  return 'M' + a.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L') + ' L' + b.reverse().map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L') + ' Z';
}
function line(fD, x0 = 0, x1 = W, step = 8) {
  const a = []; for (let x = x0; x <= x1; x += step) a.push([x, Y(fD(x))]);
  return 'M' + a.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L');
}
// erőnyíl (a fej felé): kind = 'load' | 'skin' | 'base' | 'earth'
function F(p, x1, y1, x2, y2, kind, dl = 0) {
  const g = svg('g', { class: 'tt-f tt-' + kind, style: `--dl:${dl.toFixed(2)}s` }, p);
  const a = Math.atan2(y2 - y1, x2 - x1), hd = kind === 'load' ? 11 : 8;
  svg('line', { x1, y1, x2: x2 - Math.cos(a) * hd * 0.7, y2: y2 - Math.sin(a) * hd * 0.7, 'stroke-linecap': 'round' }, g);
  svg('path', { d: `M${x2} ${y2} L${x2 - Math.cos(a - 0.45) * hd} ${y2 - Math.sin(a - 0.45) * hd} L${x2 - Math.cos(a + 0.45) * hd} ${y2 - Math.sin(a + 0.45) * hd} Z` }, g);
  return g;
}
function lead(p, x1, y1, x2, y2) { P(p, `M${x1} ${y1} L${x2} ${y2}`, 'tt-lead'); svg('circle', { cx: x1, cy: y1, r: 3, class: 'tt-dot' }, p); }
function building(p, x, y, w, floors, fh = 17, cls = 'f-bld') {
  const hh = floors * fh;
  R(p, x, y - hh, w, hh, cls + ' tt-bld');
  for (let f = 0; f < floors; f++) for (let wx = x + 10; wx < x + w - 14; wx += 22) R(p, wx, y - hh + f * fh + 5, 12, fh - 9, 'tt-win');
  R(p, x - 3, y - hh - 4, w + 6, 5, 'f-bld2');
}
// teherút: az épülettől a talajig futó, animált szaggatott vonal
const flow = (p, d) => P(p, d, 'tt-flowline');

/* ---------------------------------------------------------------- jelenetek */
function sceneColop(g) {
  const x0 = 56, x1 = 278, raftTop = G - 4, raftBot = G + 18;
  building(g, 64, raftTop, 206, 10);
  conc(g, x0, raftTop, x1 - x0, raftBot - raftTop);
  const xs = Array.from({ length: 7 }, (_, i) => 74 + i * 31);
  xs.forEach((cx, i) => {
    const yb = Y(bt(cx) + 2.0);
    conc(g, cx - 6.5, raftBot, 13, yb - raftBot, 'f-conc2');
    if (i % 2 === 0) {
      for (let d = 3; d < bt(cx) + 1.6; d += 2.2) { F(g, cx - 11, Y(d) + 16, cx - 11, Y(d), 'skin', d * 0.08); F(g, cx + 11, Y(d) + 16, cx + 11, Y(d), 'skin', d * 0.08); }
      F(g, cx, yb + 22, cx, yb + 3, 'base', 1.2);
    }
  });
  for (const cx of [105, 167, 229]) F(g, cx, raftTop - 70, cx, raftTop - 6, 'load');
  flow(g, `M167 ${raftTop - 90} V${raftBot} M105 ${raftBot} V${Y(bt(105) + 2)} M229 ${raftBot} V${Y(bt(229) + 2)}`);
  lead(g, 272, raftTop + 8, 296, G - 34); T(g, 322, G - 40, 'vb. lemez', 'tt-lab', { 'text-anchor': 'end' });
  lead(g, 260, Y(6), 296, Y(5.2)); T(g, 322, Y(5.2) - 6, 'cölöpök', 'tt-lab', { 'text-anchor': 'end' });
}
function sceneResfal(g) {
  const L0 = 346, L1 = 360, R0 = 630, R1 = 644, yb = Y(hc(346) + 1.5);
  const slabT = Y(9.0), slabB = Y(9.8);
  // munkatér (levegő) a mélygarázsban
  R(g, L1, G, R0 - L1, slabT - G, 'tt-air');
  // födémek, oszlopok, autók
  for (const d of [3.0, 6.0]) conc(g, L1, Y(d), R0 - L1, 6, 'f-conc');
  conc(g, L1, slabT, R0 - L1, slabB - slabT, 'f-conc');
  for (const cx of [450, 540]) for (const [a, b] of [[0.4, 3.0], [3.35, 6.0], [6.35, 9.0]]) R(g, cx - 4, Y(a), 8, Y(b) - Y(a), 'f-conc2');
  for (const [d, xs] of [[3.0, [380, 486, 580]], [6.0, [392, 500, 590]], [9.0, [384, 470, 566]]]) for (const cx of xs) { const yy = Y(d); P(g, `M${cx} ${yy - 3} h34 v-8 q0 -5 -6 -6 l-5 -6 h-12 l-6 6 q-5 1 -5 6 z`, 'tt-car'); }
  // falak + fejgerenda
  conc(g, L0, G - 6, L1 - L0, yb - G + 6, 'f-conc2'); conc(g, R0, G - 6, R1 - R0, yb - G + 6, 'f-conc2');
  conc(g, L0 - 4, G - 12, 22, 14); conc(g, R0 - 4, G - 12, 22, 14);
  conc(g, L1, G - 4, R0 - L1, 8, 'f-conc');
  building(g, 364, G - 12, 262, 6);
  // erők
  for (const cx of [353, 637]) { F(g, cx, G - 80, cx, G - 16, 'load'); }
  F(g, 495, G - 90, 495, G - 16, 'load');
  for (const [cx, sgn] of [[L0, -1], [R1, 1]]) {
    for (let d = 1.2; d < 8.6; d += 1.9) F(g, cx + sgn * 24, Y(d), cx + sgn * 3, Y(d), 'earth', d * 0.06);
    for (let d = 10.6; d < hc(346) + 1.2; d += 2.1) F(g, cx + sgn * 9, Y(d) + 16, cx + sgn * 9, Y(d), 'skin', d * 0.06);
  }
  F(g, 353, yb + 22, 353, yb + 3, 'base', 1.3); F(g, 637, yb + 22, 637, yb + 3, 'base', 1.3);
  flow(g, `M353 ${G - 100} V${yb} M637 ${G - 100} V${yb}`);
  T(g, 495, Y(1.75), 'mélygarázs', 'tt-sm', { 'text-anchor': 'middle' });
  lead(g, 344, Y(13.5), 372, Y(12.6)); T(g, 374, Y(12.6) + 5, 'résfal', 'tt-lab');
}
function sceneKut(g) {
  const cols = [705, 795, 885], beamT = G - 12, beamB = G + 6;
  // csarnok
  P(g, `M680 ${G - 120} L795 ${G - 160} L910 ${G - 120} Z`, 'f-bld2 tt-bld');
  for (const cx of cols) R(g, cx - 5, G - 122, 10, 110, 'f-conc2');
  R(g, 680, G - 124, 230, 6, 'f-bld2');
  conc(g, 680, beamT, 230, beamB - beamT); // gerendarács (teteje vízszintes)
  for (const cx of cols) {
    const yb = Y(bt(cx) + 0.6), x = cx - 18;
    conc(g, x + 4, beamB, 28, yb - beamB, 'f-conc'); // kitöltő beton
    R(g, x, beamB, 4, yb - beamB, 'f-conc2'); R(g, x + 32, beamB, 4, yb - beamB, 'f-conc2'); // köpenyfal
    P(g, `M${x} ${yb} l-3 0 l3 -14 z M${x + 36} ${yb} l3 0 l-3 -14 z`, 'f-steelc'); // vágóél
    R(g, x, beamB, 36, yb - beamB, 's-ink', { fill: 'none', 'stroke-width': 1.2, opacity: 0.6 });
    for (let d = 2.4; d < bt(cx) - 0.4; d += 2.6) { F(g, x - 8, Y(d) + 14, x - 8, Y(d), 'skin', d * 0.08); F(g, x + 44, Y(d) + 14, x + 44, Y(d), 'skin', d * 0.08); }
    for (const dx of [8, 18, 28]) F(g, x + dx, yb + 26, x + dx, yb + 3, 'base', 1.0);
    F(g, cx, G - 96, cx, beamT - 4, 'load');
  }
  flow(g, cols.map((cx) => `M${cx} ${G - 110} V${Y(bt(cx) + 0.6)}`).join(' '));
  lead(g, 900, beamT + 6, 918, G - 40); T(g, 920, G - 46, 'gerendarács', 'tt-lab', { 'text-anchor': 'end' });
  lead(g, 795, Y(bt(795) + 0.7), 795, Y(9.4)); T(g, 795, Y(9.4) + 20, 'kút: Ø 0,8–3,0' + NB + 'm, 4–8' + NB + 'm', 'tt-lab', { 'text-anchor': 'middle' });
}
function sceneSzekreny(g) {
  const cx = 1085, x0 = 1015, x1 = 1155, yt = Y(4.2), yb = Y(bt(cx) + 1.0);
  // híd
  R(g, 930, 128, 310, 14, 'f-conc2'); R(g, 930, 122, 310, 3, 'f-steelc');
  for (let x = 936; x < 1240; x += 16) R(g, x, 112, 2, 10, 'f-steelc');
  // pillér (felfelé kissé szűkül)
  P(g, `M${cx - 30} ${yt} L${cx - 24} 142 L${cx + 24} 142 L${cx + 30} ${yt} Z`, 'f-conc2');
  P(g, `M${cx - 30} ${yt} L${cx - 24} 142 L${cx + 24} 142 L${cx + 30} ${yt} Z`, '', { fill: 'url(#pat-rock)', opacity: 0.6 });
  // szekrény (vágóéllel), egykori munkakamra
  conc(g, x0, yt, x1 - x0, yb - yt);
  P(g, `M${x0} ${yb} l-4 0 l4 -18 z M${x1} ${yb} l4 0 l-4 -18 z`, 'f-steelc');
  R(g, x0 + 10, yb - 34, x1 - x0 - 20, 26, 'tt-chamber');
  T(g, cx, yb - 17, 'egykori munkakamra', 'tt-xs', { 'text-anchor': 'middle' });
  for (let d = 5.6; d < bt(cx) + 0.4; d += 1.7) { F(g, x0 - 9, Y(d) + 14, x0 - 9, Y(d), 'skin', d * 0.08); F(g, x1 + 9, Y(d) + 14, x1 + 9, Y(d), 'skin', d * 0.08); }
  for (let x = x0 + 12; x <= x1 - 10; x += 24) F(g, x, yb + 26, x, yb + 3, 'base', 1.1);
  F(g, cx, 76, cx, 120, 'load');
  flow(g, `M${cx} 80 V${yb}`);
  T(g, 985, Y(1.9), 'folyó', 'tt-sm t-water');
  lead(g, x1 - 6, yt + 30, 1200, Y(2.6)); T(g, 1200, Y(2.6) - 6, 'szekrény', 'tt-lab', { 'text-anchor': 'middle' });
}
function sceneAtmeneti(g) {
  // a) kis ház markolt tömbalapon
  const hx0 = 1262, hx1 = 1352;
  R(g, hx0, G - 70, hx1 - hx0, 66, 'f-bld tt-bld');
  P(g, `M${hx0 - 6} ${G - 70} L${(hx0 + hx1) / 2} ${G - 110} L${hx1 + 6} ${G - 70} Z`, 'f-bld2');
  for (const wx of [hx0 + 12, hx0 + 52]) for (const wy of [G - 60, G - 32]) R(g, wx, wy, 18, 16, 'tt-win');
  for (const bx of [1266, 1324]) {
    const yb = Y(bt(bx + 12) + 0.4);
    conc(g, bx, G - 4, 24, yb - G + 4, 'f-conc2');
    F(g, bx + 12, G - 54, bx + 12, G - 8, 'load');
    for (const dx of [5, 12, 19]) F(g, bx + dx, yb + 22, bx + dx, yb + 3, 'base', 1.0);
  }
  flow(g, `M1278 ${G - 60} V${Y(bt(1278) + 0.4)} M1336 ${G - 60} V${Y(bt(1336) + 0.4)}`);
  T(g, 1307, Y(6.7), 'markolt', 'tt-sm', { 'text-anchor': 'middle' }); T(g, 1307, Y(6.7) + 16, 'tömbalap', 'tt-sm', { 'text-anchor': 'middle' });
  // b) csarnoklemez merev betéteken, teherelosztó szemcsés réteggel
  const sx0 = 1370, sx1 = 1514, slabT = G - 6, ltpB = G + 10;
  R(g, 1374, G - 96, 4, 90, 'f-steelc'); R(g, 1506, G - 96, 4, 90, 'f-steelc'); P(g, `M1368 ${G - 96} L1442 ${G - 120} L1516 ${G - 96}`, 'tt-roof');
  P(g, `M${sx0} ${G} H${sx1} V${ltpB} H${sx0} Z`, 'f-soilD'); P(g, `M${sx0} ${G} H${sx1} V${ltpB} H${sx0} Z`, '', { fill: 'url(#pat-gravel)', opacity: 0.8 });
  conc(g, sx0, slabT, sx1 - sx0, 6);
  const xs = [1390, 1424, 1458, 1492];
  for (const cx of xs) {
    const yb = Y(bt(cx) + 0.8);
    R(g, cx - 4, ltpB, 8, yb - ltpB, 'f-grout'); R(g, cx - 4, ltpB, 8, yb - ltpB, 's-ink', { fill: 'none', 'stroke-width': 0.8, opacity: 0.5 });
    P(g, `M${cx - 16} ${G + 2} Q${cx} ${G - 6} ${cx + 16} ${G + 2}`, 'tt-arch');
    F(g, cx, yb + 20, cx, yb + 3, 'base', 1.1);
    for (let d = 2.0; d < bt(cx) + 0.3; d += 1.8) F(g, cx + 9, Y(d) + 12, cx + 9, Y(d), 'skin', d * 0.08);
  }
  for (let x = sx0 + 8; x < sx1; x += 17) F(g, x, slabT - 26, x, slabT - 3, 'load', 0);
  flow(g, xs.map((cx) => `M${cx} ${slabT - 30} V${Y(bt(cx) + 0.8)}`).join(' '));
  lead(g, 1500, G + 5, 1494, G + 40); T(g, 1468, G + 54, 'teherelosztó', 'tt-xs', { 'text-anchor': 'middle' }); T(g, 1468, G + 68, 'szemcsés réteg', 'tt-xs', { 'text-anchor': 'middle' });
  T(g, 1440, Y(6.9), 'merev betétek', 'tt-sm', { 'text-anchor': 'middle' });
}
const DRAW = { colop: sceneColop, resfal: sceneResfal, kut: sceneKut, szekreny: sceneSzekreny, atmeneti: sceneAtmeneti };

/* ---------------------------------------------------------------- a panoráma */
function panorama(root) {
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tt-svg', role: 'img', 'aria-label': 'A mélyalapozás típusai egy terepmetszeten: cölöpalap, résfal, kútalap, szekrény és keszon, átmeneti megoldások' }, root);
  const sky = svg('g', { class: 'tt-sky' }, s);
  R(sky, 0, 0, W, G, 'f-sky');
  // talajrétegek
  const soil = svg('g', { class: 'tt-soil' }, s);
  hatchPoly(soil, band((x) => top(x), (x) => Math.max(FILL, top(x))), 'f-soilC', 'pat-soil');
  hatchPoly(soil, band((x) => Math.max(FILL, top(x)), bt), 'f-soilB', 'pat-clay');
  hatchPoly(soil, band(bt, hc), 'f-soilD', 'pat-gravel', 0.7);
  hatchPoly(soil, band(hc, () => (H - G) / S), 'f-soilE', 'pat-clay', 0.45);
  P(soil, line(bt), 'tt-layer'); P(soil, line(hc), 'tt-layer'); P(soil, line((x) => top(x)), 'tt-ground');
  // folyó
  const riv = [];
  for (let x = RX0; x <= RX1; x += 5) riv.push([x, Y(Math.max(WL, top(x)))]);
  const rd = `M${RX0} ${Y(WL)} L` + riv.map((q) => q.join(' ')).join(' L') + ` L${RX1} ${Y(WL)} Z`;
  P(soil, rd, 'tt-river'); P(soil, rd, '', { fill: 'url(#pat-water)', opacity: 0.8 });
  P(soil, `M${RX0 + 6} ${Y(WL)} H${RX1 - 6}`, 'tt-wl');
  // talajvíz
  P(soil, `M34 ${Y(2.5)} H346 M644 ${Y(2.5)} H${RX0 + 20}`, 'tt-gw');
  P(soil, `M${RX1 - 20} ${Y(WL + 0.5)} C${RX1 + 30} ${Y(1.5)} 1270 ${Y(7)} 1310 ${Y(7)} H${W}`, 'tt-gw');
  T(soil, 324, Y(2.5) - 6, 'TV', 'tt-xs t-water', { 'text-anchor': 'end' });
  // mélységléc
  const rl = svg('g', { class: 'tt-ruler' }, s);
  P(rl, `M28 ${G} V${H - 6}`, 'tt-rl');
  for (let d = 0; d <= 20; d += 5) { P(rl, `M22 ${Y(d)} H34`, 'tt-rl'); T(rl, 18, Y(d) + 5, d === 0 ? '0' : '−' + d, 'tt-xs', { 'text-anchor': 'end' }); }
  T(rl, 18, Y(21.4) + 5, 'm', 'tt-xs', { 'text-anchor': 'end' });
  // jelenetek
  const groups = {};
  for (const sc of TT_SCENES) {
    const g = svg('g', { class: 'tt-scene', 'data-k': sc.k, style: `--c:${sc.c}`, tabindex: 0, role: 'button', 'aria-label': sc.t }, s);
    R(g, sc.x0, 0, sc.x1 - sc.x0, H, 'tt-hit');
    DRAW[sc.k](g);
    const cx = (sc.x0 + sc.x1) / 2;
    T(g, cx, 34, sc.t.toUpperCase(), 'tt-tit', { 'text-anchor': 'middle' });
    T(g, cx, 58, sc.s, 'tt-sub', { 'text-anchor': 'middle' });
    groups[sc.k] = g;
  }
  // elválasztók
  for (const sc of TT_SCENES.slice(1)) P(s, `M${sc.x0} 14 V${G - 130}`, 'tt-sep');
  return { s, groups };
}

register('alap-tipusterkep', (root) => {
  const { viz, out } = shell(root, { layout: 'wide' });
  const bar = h('div', { class: 'tt-bar' }); viz.append(bar);
  const view = h('div', { class: 'tt-view' }); viz.append(view);
  viz.append(h('div', { class: 'tt-legend', html: '<span><i class="sw f-l1"></i>feltöltés</span><span><i class="sw f-l2"></i>puha agyag</span><span><i class="sw f-l3"></i>teherbíró homokos kavics</span><span><i class="sw f-l4"></i>kemény agyag</span><span><i class="ln gw"></i>talajvízszint</span><span><i class="ar ld"></i>teher</span><span><i class="ar sk"></i>köpenymenti ellenállás</span><span><i class="ar bs"></i>talpellenállás</span><span><i class="ar ea"></i>föld- és víznyomás</span>' }));
  const { s, groups } = panorama(view);
  const sg = seg(bar, { label: '', options: [{ v: 'all', t: 'Mind' }, ...TT_SCENES.map((sc) => ({ v: sc.k, t: sc.t }))], value: 'all' });
  const cards = $$('.alap-ttc');
  const info = h('div', { class: 'tt-info' }); out.append(info);
  const narrow = () => view.clientWidth < 640;
  function apply(k) {
    root.dataset.sel = k;
    for (const sc of TT_SCENES) groups[sc.k].classList.toggle('dim', k !== 'all' && sc.k !== k);
    cards.forEach((c) => { c.classList.toggle('on', c.dataset.tt === k); c.classList.toggle('dim', k !== 'all' && c.dataset.tt !== k); });
    const sc = TT_SCENES.find((q) => q.k === k);
    if (narrow() && sc) { const pad = 10; s.setAttribute('viewBox', `${sc.x0 - pad} 0 ${sc.x1 - sc.x0 + 2 * pad} ${sc.zh}`); view.classList.add('zoom'); }
    else { s.setAttribute('viewBox', `0 0 ${W} ${H}`); view.classList.remove('zoom'); }
    s.style.aspectRatio = s.getAttribute('viewBox').split(' ').slice(2).join(' / ');
    if (sc) {
      info.innerHTML = '';
      info.append(h('span', { class: 'tt-dotc', style: `background:${sc.c}` }), h('div', {}, h('b', {}, sc.t), h('span', {}, ' – ' + sc.o + ' '), h('a', { href: '#alap-tt-' + sc.k }, 'Adatlap ↓')));
    } else {
      info.innerHTML = '';
      info.append(h('div', {}, h('b', {}, 'Öt megoldás egy metszeten. '), h('span', {}, 'Válassz egy típust a metszeten vagy a gombokkal – lent az adatlapja is kiemelődik.')));
    }
  }
  sg.on(apply);
  for (const sc of TT_SCENES) {
    const g = groups[sc.k];
    const pick = () => { const k = sg.v === sc.k ? 'all' : sc.k; sg.set(k); };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  }
  cards.forEach((c) => c.addEventListener('click', (e) => { if (e.target.closest('a')) return; sg.set(sg.v === c.dataset.tt ? 'all' : c.dataset.tt); }));
  let lastNarrow = null;
  new ResizeObserver(() => { const n = narrow(); if (n !== lastNarrow) { lastNarrow = n; apply(sg.v); } }).observe(view);
  apply('all');
});
