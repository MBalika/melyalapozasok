// Technológiai folyamatábrák (panorámasor): minden lépés egy oszlop, az oszlopok égboltja, horizontja és talajrétegei
// összefüggnek, így a sor egyetlen jelenetként olvasható. A BME Építőmérnöki Kar mélyalapozási videóinak ábrái alapján.
// Használat: <div class="pr-strip" data-proc="cfa"></div>
import { svg as el, h, EN } from './core.js';

/* ================================================================== alapok */
const v = (n) => `var(--pr-${n})`;
const F = (n, op) => `fill:${v(n)}` + (op != null ? `;fill-opacity:${op}` : '');
const SK = (n, w = 1, extra = '') => `fill:none;stroke:${v(n)};stroke-width:${w}` + (extra ? ';' + extra : '');
const g_ = (p, a = {}) => el('g', a, p);
const R = (p, x, y, w, hh, st, a = {}) => el('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), style: st, ...a }, p);
const P = (p, d, st, a = {}) => el('path', { d, style: st, ...a }, p);
const C = (p, cx, cy, r, st, a = {}) => el('circle', { cx, cy, r, style: st, ...a }, p);
const E = (p, cx, cy, rx, ry, st, a = {}) => el('ellipse', { cx, cy, rx, ry, style: st, ...a }, p);
const Ln = (p, x1, y1, x2, y2, st, a = {}) => el('line', { x1, y1, x2, y2, style: st, ...a }, p);
const CUR = { W: 9999 };
const hash = (k) => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* ================================================================== közös definíciók (egyszer) */
function defs() {
  if (document.getElementById('pr-defs')) return;
  const s = el('svg', { id: 'pr-defs', width: 0, height: 0, style: 'position:absolute;width:0;height:0;overflow:hidden', 'aria-hidden': 'true', focusable: 'false' });
  const d = el('defs', {}, s);
  const lg = (id, stops, a = {}) => { const g = el('linearGradient', { id, ...a }, d); stops.forEach(([o, c, op]) => el('stop', { offset: o, style: `stop-color:${c}` + (op != null ? `;stop-opacity:${op}` : '') }, g)); };
  lg('pr-sky', [[0, v('sky1')], [1, v('sky2')]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  lg('pr-cyl', [[0, v('steel3')], [0.3, v('steel1')], [0.62, v('steel2')], [1, v('steel3')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-cylh', [[0, v('steel1')], [0.45, v('steel2')], [1, v('steel3')]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  lg('pr-mcyl', [[0, v('mach3')], [0.35, v('mach')], [0.7, v('mach2')], [1, v('mach3')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-glass', [[0, v('glass1')], [1, v('glass2')]], { x1: 0, y1: 0, x2: 1, y2: 1 });
  lg('pr-drum', [[0, v('drum1')], [0.55, v('drum2')], [1, v('drum3')]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  lg('pr-deep', [[0, '#000', 0], [1, '#000', 0.16]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  lg('pr-wet', [[0, v('water'), 0.0], [0.08, v('water'), 0.13], [1, v('water'), 0.2]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  lg('pr-concg', [[0, v('conc1')], [0.5, v('conc2')], [1, v('conc1')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-freshg', [[0, v('fresh1')], [0.5, v('fresh2')], [1, v('fresh1')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-slurryg', [[0, v('slurry1')], [1, v('slurry2')]], { x1: 0, y1: 0, x2: 0, y2: 1 });
  lg('pr-groutg', [[0, v('grout2')], [0.5, v('grout1')], [1, v('grout2')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-cylw', [[0, v('drum3')], [0.3, v('drum1')], [0.7, v('drum2')], [1, v('drum3')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-pile', [[0, v('conc2')], [0.4, v('conc1')], [1, v('fresh2')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-mixg', [[0, v('mix1')], [0.5, v('mix3')], [1, v('mix1')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  const pat = (id, w, hh, draw, a = {}) => { const p = el('pattern', { id, width: w, height: hh, patternUnits: 'userSpaceOnUse', ...a }, d); draw(p); };
  // talajminták
  pat('pr-p-sand', 11, 11, (p) => { [[1.5, 2, 0.75], [6.5, 1.2, 0.6], [9.5, 6, 0.7], [3.5, 7.5, 0.65], [7, 9.6, 0.55], [1, 9.8, 0.45]].forEach(([x, y, r]) => C(p, x, y, r, F('dot'))); });
  pat('pr-p-clay', 16, 9, (p) => { P(p, 'M1 2.5h6 M10 2.5h4 M4 7h7', SK('dot', 0.9, 'stroke-linecap:round')); });
  pat('pr-p-silt', 13, 10, (p) => { P(p, 'M1 2.5h4 M8 7.5h4', SK('dot', 0.8, 'stroke-linecap:round')); C(p, 9, 2.6, 0.55, F('dot')); C(p, 3, 7.6, 0.55, F('dot')); });
  pat('pr-p-gravel', 22, 18, (p) => {
    [[4, 4, 2.8, 2.1], [13, 3, 2.2, 1.7], [18, 10, 2.6, 2], [7, 12, 3.2, 2.3], [14, 15.5, 1.8, 1.4], [1, 15, 1.6, 1.2]].forEach(([x, y, rx, ry], i) => E(p, x, y, rx, ry, F('pebble') + `;stroke:${v('dot')};stroke-width:.7`, { transform: `rotate(${i * 37} ${x} ${y})` }));
    C(p, 10, 8, 0.6, F('dot')); C(p, 20, 4, 0.6, F('dot'));
  });
  pat('pr-p-fill', 20, 16, (p) => { E(p, 5, 5, 2.4, 1.6, F('pebble') + `;stroke:${v('dot')};stroke-width:.6`); P(p, 'M11 4h5 M2 12h5', SK('dot', 0.8, 'stroke-linecap:round')); C(p, 15, 12, 0.7, F('dot')); C(p, 9, 14, 0.5, F('dot')); });
  pat('pr-p-peat', 18, 10, (p) => { P(p, 'M0 7 q4.5 -5 9 0 t9 0', SK('dot', 0.9)); P(p, 'M4 2.5h3 M12 3h3', SK('dot', 0.8, 'stroke-linecap:round')); });
  pat('pr-p-rock', 26, 18, (p) => { P(p, 'M0 6h26 M0 15h26 M8 6v9 M19 0v6 M16 15v3', SK('dot', 0.8)); });
  // anyagok
  pat('pr-p-conc', 12, 12, (p) => {
    [[2, 2.5, 1.1, 'agg1'], [7.5, 1.6, 0.8, 'agg2'], [10, 7, 1.2, 'agg2'], [4.4, 8, 0.9, 'agg1'], [8, 10.6, 0.6, 'agg1'], [1.2, 10.8, 0.7, 'agg2']].forEach(([x, y, r, c]) => C(p, x, y, r, F(c)));
  });
  pat('pr-p-slurry', 9, 9, (p) => { C(p, 2, 2, 0.55, F('slurryd')); C(p, 6.5, 6, 0.5, F('slurryd')); });
  pat('pr-p-stone', 16, 14, (p) => {
    [[4, 4, 3.4, 2.7], [11.5, 3.5, 3, 2.4], [8, 10, 3.6, 2.6], [1, 11, 2.2, 2.1], [15, 10.5, 2, 2.2]].forEach(([x, y, rx, ry], i) => E(p, x, y, rx, ry, F('stone') + `;stroke:${v('stone2')};stroke-width:.8`, { transform: `rotate(${i * 50} ${x} ${y})` }));
  });
  pat('pr-p-mix', 18, 14, (p) => { E(p, 5, 4, 3.6, 1.8, F('mix2')); E(p, 13, 10, 3, 1.5, F('mix2')); C(p, 12, 3, 0.7, F('dot')); C(p, 3, 11, 0.6, F('dot')); });
  pat('pr-p-grass', 8, 6, (p) => { P(p, 'M1 6 l1 -4 M4 6 l-0.6 -5 M6.5 6 l1 -3.4', SK('grass2', 0.9, 'stroke-linecap:round')); });
  pat('pr-p-shoe', 5, 4, (p) => { Ln(p, 0.5, 0, 0.5, 4, SK('dark2', 1.6)); });
  (document.body || document.documentElement).prepend(s);
}

/* ================================================================== háttér: ég, horizont, talaj */
const SOIL = {
  sand: ['sand', 'pr-p-sand'], sand2: ['sand2', 'pr-p-sand'], clay: ['clay', 'pr-p-clay'], clay2: ['clay2', 'pr-p-clay'], silt: ['silt', 'pr-p-silt'],
  gravel: ['gravel', 'pr-p-gravel'], fill: ['fill', 'pr-p-fill'], peat: ['peat', 'pr-p-peat'], rock: ['rock', 'pr-p-rock'], hard: ['hard', 'pr-p-clay'],
};
// réteghatár: globális x szerint hullámzik, így az oszlopok között folytonos
const waveY = (y0, x, i) => y0 + 2.6 * Math.sin(x / 47 + i * 1.7) + 1.6 * Math.sin(x / 17 + i * 0.9);

function backdrop(g, M, ox, w) {
  const b = g_(g, { transform: `translate(${-ox} 0)` });
  const x0 = ox - 2, x1 = ox + w + 2, GY = M.GY;
  R(b, x0, 0, x1 - x0, GY + 1, 'fill:url(#pr-sky)');
  // felhők
  for (let k = Math.floor(x0 / 230) - 1; k <= Math.ceil(x1 / 230); k++) {
    const cx = k * 230 + 60 + hash(k) * 90, cy = 26 + hash(k + 9) * 34, s = 0.7 + hash(k + 3) * 0.6;
    if (hash(k + 5) < 0.3) continue;
    const c = g_(b, { style: F('cloud', 0.85) });
    E(c, cx, cy, 22 * s, 7 * s, ''); E(c, cx - 12 * s, cy + 2 * s, 12 * s, 5.5 * s, ''); E(c, cx + 10 * s, cy - 4 * s, 12 * s, 8 * s, '');
  }
  // távoli dombok
  let d = `M${x0} ${GY}`;
  for (let x = x0; x <= x1; x += 6) d += ` L${x} ${(GY - 16 - 9 * Math.sin(x / 83) - 5 * Math.sin(x / 31 + 1)).toFixed(1)}`;
  P(b, d + ` L${x1} ${GY}Z`, F('hill'));
  // távoli épületek (városszél)
  for (let k = Math.floor(x0 / 38) - 1; k <= Math.ceil(x1 / 38); k++) {
    if (hash(k * 3.1) < 0.55) continue;
    const bx = k * 38 + hash(k) * 10, bw = 18 + hash(k + 1) * 16, bh = 16 + hash(k + 2) * 40;
    R(b, bx, GY - bh, bw, bh, F('city'));
    for (let wy = GY - bh + 5; wy < GY - 8; wy += 7) for (let wx = bx + 3.5; wx < bx + bw - 4; wx += 6) R(b, wx, wy, 2.4, 3, F('cityw'));
  }
  // fák
  for (let k = Math.floor(x0 / 57) - 1; k <= Math.ceil(x1 / 57); k++) {
    if (hash(k * 7.7) < 0.45) continue;
    const tx = k * 57 + hash(k + 4) * 30, th = 10 + hash(k + 6) * 9;
    R(b, tx - 0.8, GY - 5, 1.6, 5, F('trunk'));
    E(b, tx, GY - 5 - th * 0.55, th * 0.42, th * 0.6, F('tree'));
  }
  // talajrétegek
  const L = M.layers;
  L.forEach((l, i) => {
    const top = i === 0 ? GY : l.y, bot = i + 1 < L.length ? L[i + 1].y : M.H + 4, nxt = i + 1 < L.length;
    let pd = '';
    if (i === 0) pd = `M${x0} ${GY}H${x1}`;
    else { pd = `M${x0} ${waveY(top, x0, i).toFixed(1)}`; for (let x = x0 + 5; x <= x1 + 5; x += 5) pd += ` L${x} ${waveY(top, x, i).toFixed(1)}`; }
    let pb = '';
    if (nxt) { for (let x = x1 + 5; x >= x0 - 5; x -= 5) pb += ` L${x} ${waveY(bot, x, i + 1).toFixed(1)}`; } else pb = ` L${x1} ${M.H + 4} L${x0} ${M.H + 4}`;
    const [col, pat] = SOIL[l.k];
    P(b, pd + pb + 'Z', F(col));
    P(b, pd + pb + 'Z', `fill:url(#${pat})`);
    if (i > 0) P(b, pd, SK('layer', 1, 'stroke-dasharray:6 4'));
  });
  R(b, x0, GY, x1 - x0, M.H - GY + 4, 'fill:url(#pr-deep)');
  // talajvíz
  if (M.gw) {
    R(b, x0, M.gw, x1 - x0, M.H - M.gw + 4, 'fill:url(#pr-wet)');
    Ln(b, x0, M.gw, x1, M.gw, SK('water', 1.3, 'stroke-dasharray:7 5'));
  }
  // humusz, fű
  R(b, x0, GY - 1.2, x1 - x0, 4.5, F('top'));
  R(b, x0, GY - 4.5, x1 - x0, 4, 'fill:url(#pr-p-grass)');
  Ln(b, x0, GY, x1, GY, SK('ground', 1.4));
}

/* ================================================================== feliratok, nyilak */
function tag(g, x, y, text, o = {}) {
  // felirat lekerekített hátlapon; o.to = [px, py]: vezetővonal a pontig
  const fs = o.fs ?? 10.5, wch = fs * 0.56, tw = text.length * wch + 10, th = fs + 7;
  const anchor = o.anchor ?? 'start';
  let bx = anchor === 'end' ? x - tw : anchor === 'middle' ? x - tw / 2 : x;
  bx = Math.max(3, Math.min(CUR.W - tw - 3, bx));
  const gg = g_(g, { class: 'pr-tag' });
  if (o.to) {
    const [px, py] = o.to, lx = px < bx ? bx : px > bx + tw ? bx + tw : bx + tw / 2;
    Ln(gg, lx, y, px, py, SK('labline', 1));
    C(gg, px, py, 2.1, F('labline'));
  }
  R(gg, bx, y - th / 2, tw, th, F('labbg') + `;stroke:${v('labedge')};stroke-width:.7`, { rx: th / 2 });
  el('text', { x: bx + tw / 2, y: y + fs * 0.36, 'text-anchor': 'middle', class: 'pr-tx', style: `font-size:${fs}px`, text }, gg);
  return gg;
}
function arrowP(g, d, o = {}) {
  // vastag nyíl íves útvonallal, világos glóriával
  const w = o.w ?? 3.2;
  P(g, d, SK('halo', w + 3.2, 'stroke-linecap:round;stroke-linejoin:round;opacity:.85'));
  P(g, d, SK(o.c ?? 'acc', w, 'stroke-linecap:round;stroke-linejoin:round'));
}
function head(g, x, y, ang, o = {}) {
  const s = o.s ?? 9, c = o.c ?? 'acc', a = (ang * Math.PI) / 180;
  const p = (dx, dy) => `${(x + dx * Math.cos(a) - dy * Math.sin(a)).toFixed(1)} ${(y + dx * Math.sin(a) + dy * Math.cos(a)).toFixed(1)}`;
  const d = `M${p(0, 0)} L${p(-s, -s * 0.62)} L${p(-s * 0.72, 0)} L${p(-s, s * 0.62)}Z`;
  P(g, d, F('halo') + `;stroke:${v('halo')};stroke-width:3;stroke-linejoin:round;opacity:.85`);
  P(g, d, F(c));
}
const arrowV = (g, x, y1, y2, o = {}) => { arrowP(g, `M${x} ${y1} L${x} ${y2 + (y2 > y1 ? -6 : 6)}`, o); head(g, x, y2, y2 > y1 ? 90 : -90, o); };
const arrowH = (g, x1, x2, y, o = {}) => { arrowP(g, `M${x1} ${y} L${x2 + (x2 > x1 ? -5 : 5)} ${y}`, o); head(g, x2, y, x2 > x1 ? 0 : 180, o); };
function spin(g, cx, y, r, o = {}) {
  // forgásirány: elliptikus ív a szár körül, nyílheggyel
  const ry = r * 0.3;
  arrowP(g, `M${cx - r} ${y} A${r} ${ry} 0 0 0 ${cx + r * 0.82} ${y + ry * 0.58}`, { w: 2.6, ...o });
  head(g, cx + r * 0.9, y + ry * 0.45, -18, { s: 8, ...o });
}
function pushOut(g, cx, y, half, n = 1, o = {}) {
  // oldalirányú talajkiszorítás (piros nyilak)
  for (let i = 0; i < n; i++) {
    const yy = y + i * 9;
    arrowH(g, cx - half - 2, cx - half - 15, yy, { w: 2, s: 6, c: 'push', ...o });
    arrowH(g, cx + half + 2, cx + half + 15, yy, { w: 2, s: 6, c: 'push', ...o });
  }
}
function badge(g, n) {
  C(g, 15, 15, 10.5, `fill:var(--grp);stroke:${v('halo')};stroke-width:2`);
  el('text', { x: 15, y: 19.6, 'text-anchor': 'middle', class: 'pr-num', text: String(n) }, g);
}

/* ================================================================== ember */
function worker(g, x, o = {}) {
  // láthatósági mellényes munkás, oldalnézetben; o.pose: 'stand' | 'guide' (karja előre, a teher felé) | 'signal'
  const GY = o.GY, s = o.s ?? 1, dir = o.dir ?? -1, pose = o.pose ?? 'stand';
  const w = g_(g, { transform: `translate(${x} ${GY}) scale(${dir * -s} ${s})` });
  // lábak
  P(w, 'M-2.2 -13 L-3.4 0 M2 -13 L3.6 0', SK('trous', 3.4, 'stroke-linecap:round'));
  P(w, 'M-5.6 0 h4.4 M2 0 h4.6', SK('boot', 2.2, 'stroke-linecap:round'));
  Ln(w, -3, -5.5, -2.6, -3.8, SK('refl', 3.6));
  Ln(w, 3.2, -5.5, 3.4, -3.8, SK('refl', 3.6));
  // törzs (mellény)
  P(w, 'M-4.6 -24.5 Q-5.2 -18 -4 -12.4 L4.4 -12.4 Q5.4 -18 4.6 -24.5 Q0 -26.6 -4.6 -24.5Z', F('vest'));
  Ln(w, -4.8, -17.5, 5, -17.5, SK('refl', 1.5));
  Ln(w, -4.6, -14.6, 4.8, -14.6, SK('refl', 1.5));
  // karok
  if (pose === 'guide') P(w, 'M-3.4 -23 L-9.5 -18.2 L-14.5 -20.6', SK('vest', 2.6, 'stroke-linecap:round;stroke-linejoin:round'));
  else if (pose === 'signal') P(w, 'M-3.4 -23.4 L-8.6 -29.5 L-10.4 -35.5', SK('vest', 2.6, 'stroke-linecap:round;stroke-linejoin:round'));
  else P(w, 'M-3.6 -23 L-5.6 -16 L-5 -11.8', SK('vest', 2.6, 'stroke-linecap:round;stroke-linejoin:round'));
  P(w, 'M3.4 -23 L5.6 -16.4 L5.2 -12', SK('vest', 2.6, 'stroke-linecap:round;stroke-linejoin:round'));
  if (pose === 'guide') C(w, -14.8, -20.8, 1.4, F('skin'));
  else if (pose === 'signal') C(w, -10.6, -36, 1.4, F('skin'));
  // fej, sisak
  C(w, 0, -29.2, 3.3, F('skin'));
  P(w, 'M-3.9 -29.6 Q-3.8 -34.4 0.2 -34.6 Q4 -34.4 4 -29.6Z', F('helmet') + `;stroke:${v('helmet2')};stroke-width:.6`);
  Ln(w, -5.2, -29.6, 4.1, -29.6, SK('helmet', 1.4, 'stroke-linecap:round'));
  return w;
}

/* ================================================================== gépek */
/**
 * Lánctalpas fúró-/cölöpözőgép oldalnézetben. A szerszám tengelye x-en, a gép tőle jobbra.
 * o.top: az árboc teteje; o.headY: a forgatófej felső éle (null: nincs fej); o.lattice: rácsos árboc (Franki);
 * o.hoses: hidraulikatömlő-hurok a fejtől az árbocig. Visszaadja a fontos pontokat.
 */
function rig(g, M, x, o = {}) {
  const GY = M.GY, top = o.top ?? 22, mx = x + 15, hy = GY - 19;
  const r = g_(g, { class: 'pr-rig' });
  // árboc-hátsó merevítés és kinematika a gépház mögött
  const stayY = top + (GY - top) * (o.lattice ? 0.22 : 0.4);
  // lánctalp
  const tx0 = x + 26, tl = 94;
  R(r, tx0, GY - 15, tl, 15, F('dark'), { rx: 7.5 });
  R(r, tx0 + 1.5, GY - 15, tl - 3, 2.6, 'fill:url(#pr-p-shoe)');
  R(r, tx0 + 1.5, GY - 2.6, tl - 3, 2.6, 'fill:url(#pr-p-shoe)');
  R(r, tx0 + 4, GY - 11.5, tl - 8, 8, F('dark2'), { rx: 4 });
  for (let i = 0; i < 6; i++) C(r, tx0 + 15 + (i * (tl - 30)) / 5, GY - 6.4, 2.6, F('dark'));
  [tx0 + 8, tx0 + tl - 8].forEach((cx) => { C(r, cx, GY - 7.5, 5.6, F('steel3')); C(r, cx, GY - 7.5, 2.2, F('dark')); });
  R(r, tx0 + 30, GY - 19, 36, 4.5, F('dark'));
  // gépház
  const hx = x + 30, hw = 96;
  P(r, `M${hx} ${hy} V${hy - 22} Q${hx} ${hy - 27} ${hx + 5} ${hy - 27} H${hx + hw - 16} V${hy}Z`, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
  R(r, hx, hy - 6, hw - 16, 6, F('mach2'));
  for (let i = 0; i < 7; i++) Ln(r, hx + 44 + i * 4, hy - 21, hx + 44 + i * 4, hy - 10, SK('mach3', 1.1));
  // ellensúly
  P(r, `M${hx + hw - 18} ${hy + 0.5} V${hy - 31} H${hx + hw - 6} Q${hx + hw + 1} ${hy - 31} ${hx + hw + 1} ${hy - 24} V${hy - 5} Q${hx + hw + 1} ${hy + 0.5} ${hx + hw - 6} ${hy + 0.5}Z`, F('mach2') + `;stroke:${v('mach3')};stroke-width:.8`);
  for (let i = 0; i < 4; i++) P(r, `M${hx + hw - 16 + i * 4.4} ${hy - 1} l3 -4.4`, SK('dark', 1.8));
  // korlát
  Ln(r, hx + 36, hy - 34, hx + hw - 20, hy - 34, SK('dark2', 1));
  for (let px = hx + 36; px <= hx + hw - 20; px += 10) Ln(r, px, hy - 34, px, hy - 27, SK('dark2', 0.9));
  // fülke + kezelő
  const cx0 = hx + 3;
  P(r, `M${cx0} ${hy - 26} V${hy - 50} Q${cx0} ${hy - 53} ${cx0 + 3} ${hy - 53} H${cx0 + 22} L${cx0 + 26} ${hy - 26}Z`, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
  P(r, `M${cx0 + 3} ${hy - 30} V${hy - 49} H${cx0 + 20.5} L${cx0 + 23.5} ${hy - 30}Z`, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:1`);
  C(r, cx0 + 11, hy - 40.5, 3.1, F('opr'));
  P(r, `M${cx0 + 5.5} ${hy - 30.5} Q${cx0 + 6.5} ${hy - 37} ${cx0 + 11} ${hy - 36.6} Q${cx0 + 15.5} ${hy - 37} ${cx0 + 16.5} ${hy - 30.5}Z`, F('opr'));
  Ln(r, cx0 + 3, hy - 41, cx0 + 21.5, hy - 41, SK('dark', 0.5, 'opacity:.4'));
  // árboc
  const mtop = top, mbot = GY - 7;
  if (o.lattice) {
    R(r, mx - 6, mtop, 2.6, mbot - mtop, F('mach2'));
    R(r, mx + 3.4, mtop, 2.6, mbot - mtop, F('mach2'));
    let zd = `M${mx - 4.7} ${mtop + 2}`;
    for (let y = mtop + 2, s = 1; y < mbot - 6; y += 7, s = -s) zd += ` L${s > 0 ? mx + 4.7 : mx - 4.7} ${y + 7}`;
    P(r, zd, SK('mach3', 1));
  } else {
    R(r, mx - 6, mtop, 12, mbot - mtop, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
    R(r, mx - 6, mtop, 3, mbot - mtop, F('mach3'));
    R(r, mx + 2.5, mtop, 1.2, mbot - mtop, F('mach2'));
    for (let y = mtop + 40; y < mbot - 10; y += 42) { Ln(r, mx - 6, y, mx + 6, y, SK('mach3', 1.2)); C(r, mx + 4.2, y - 2.2, 0.8, F('dark')); C(r, mx + 4.2, y + 2.2, 0.8, F('dark')); }
  }
  R(r, mx - 9, GY - 7, 18, 7, F('dark2'), { rx: 1.5 });
  // árbocláb–gép kapcsolat: paralelogramma-karok
  Ln(r, hx + 6, hy - 14, mx + 5, hy - 40, SK('mach2', 6.5, 'stroke-linecap:round'));
  Ln(r, hx + 14, hy - 3, mx + 5, hy - 20, SK('mach2', 5.5, 'stroke-linecap:round'));
  // hátsó kitámasztó hengerek
  const sx = hx + 40, sy = hy - 27;
  const kx = sx + (mx + 6 - sx) * 0.55, ky = sy + (stayY - sy) * 0.55;
  Ln(r, sx, sy, kx, ky, SK('dark', 4.6, 'stroke-linecap:round'));
  Ln(r, kx, ky, mx + 6, stayY, SK('steel1', 2.4, 'stroke-linecap:round'));
  C(r, sx, sy, 2.4, F('dark2'));
  // árboccsúcs, kötélkorongok
  R(r, mx - 14, mtop - 9, 25, 10, F('mach2') + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 2 });
  C(r, x, mtop - 3, 4.2, F('dark')); C(r, x, mtop - 3, 1.5, F('steel1'));
  C(r, mx + 5, mtop - 3, 3.4, F('dark'));
  // forgatófej
  const out = { mx, top: mtop };
  if (o.headY != null) {
    const yH = o.headY;
    Ln(r, x, mtop + 1, x, yH - 6, SK('rope', 1));
    R(r, x - 3, yH - 7, 6, 7, F('dark2'));
    R(r, x + 15, yH + 3, mx - 6 - (x + 15), 17, F('mach2'));
    R(r, x - 17, yH, 34, 24, F('mach') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 3 });
    R(r, x - 17, yH + 16, 34, 8, F('mach2'), { rx: 2 });
    R(r, x - 13, yH - 6, 8, 6, F('dark2'), { rx: 1 });
    R(r, x + 5, yH - 6, 8, 6, F('dark2'), { rx: 1 });
    Ln(r, x - 14, yH + 6, x + 14, yH + 6, SK('mach3', 1));
    if (o.hoses !== false) {
      const hy2 = Math.min(GY - 30, yH + 46);
      P(r, `M${x + 12} ${yH + 2} C${x + 30} ${yH + 2} ${mx + 4} ${hy2 + 26} ${mx + 7} ${hy2}`, SK('dark', 2.2));
      P(r, `M${x + 12} ${yH + 7} C${x + 27} ${yH + 8} ${mx} ${hy2 + 32} ${mx + 7} ${hy2 + 5}`, SK('dark2', 1.6));
    }
    out.headY = yH; out.headBot = yH + 24;
  }
  return out;
}

/** Lánctalpas daru rácsos gémmel; a horog x-en, a daru tőle jobbra. hookY: a horog magassága. */
function crane(g, M, x, hookY, o = {}) {
  const GY = M.GY, r = g_(g, { class: 'pr-crane' });
  const bx = x + (o.reach ?? 70);
  const tx0 = bx - 30, tl = 84;
  R(r, tx0, GY - 13, tl, 13, F('dark'), { rx: 6.5 });
  R(r, tx0 + 1.5, GY - 13, tl - 3, 2.4, 'fill:url(#pr-p-shoe)');
  R(r, tx0 + 3.5, GY - 10, tl - 7, 7, F('dark2'), { rx: 3.5 });
  for (let i = 0; i < 6; i++) C(r, tx0 + 9 + (i * (tl - 18)) / 5, GY - 6.3, 2.5, F('dark'));
  R(r, tx0 + 24, GY - 17, 34, 4.5, F('dark'));
  const hy = GY - 17;
  P(r, `M${tx0 + 2} ${hy} V${hy - 20} Q${tx0 + 2} ${hy - 25} ${tx0 + 7} ${hy - 25} H${tx0 + 78} V${hy}Z`, F('crane') + `;stroke:${v('crane3')};stroke-width:.8`);
  R(r, tx0 + 66, hy - 30, 18, 30, F('crane2'), { rx: 4 });
  for (let i = 0; i < 6; i++) Ln(r, tx0 + 38 + i * 4, hy - 19, tx0 + 38 + i * 4, hy - 8, SK('crane3', 1));
  P(r, `M${tx0 + 4} ${hy - 25} V${hy - 46} H${tx0 + 22} L${tx0 + 26} ${hy - 25}Z`, F('crane') + `;stroke:${v('crane3')};stroke-width:.8`);
  P(r, `M${tx0 + 6.5} ${hy - 29} V${hy - 43} H${tx0 + 20} L${tx0 + 23} ${hy - 29}Z`, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:1`);
  C(r, tx0 + 13, hy - 36, 2.8, F('opr'));
  P(r, `M${tx0 + 8.5} ${hy - 29.4} Q${tx0 + 9.5} ${hy - 33.5} ${tx0 + 13} ${hy - 33.3} Q${tx0 + 16.5} ${hy - 33.5} ${tx0 + 17.5} ${hy - 29.4}Z`, F('opr'));
  // gém
  const fx = tx0 + 20, fy = hy - 14, tipX = x, tipY = o.tipY ?? 22;
  const len = Math.hypot(tipX - fx, tipY - fy), ux = (tipX - fx) / len, uy = (tipY - fy) / len, nx = -uy * 4.2, ny = ux * 4.2;
  Ln(r, fx + nx, fy + ny, tipX + nx * 0.4, tipY + ny * 0.4, SK('crane2', 1.8));
  Ln(r, fx - nx, fy - ny, tipX - nx * 0.4, tipY - ny * 0.4, SK('crane2', 1.8));
  let zd = `M${fx} ${fy}`;
  for (let t = 0, s = 1; t < len - 6; t += 8, s = -s) { const k = 1 - (t / len) * 0.6; zd += ` L${(fx + ux * (t + 8) + s * nx * k).toFixed(1)} ${(fy + uy * (t + 8) + s * ny * k).toFixed(1)}`; }
  P(r, zd, SK('crane3', 0.8));
  C(r, tipX, tipY, 3.2, F('dark'));
  // gémkötél a gép hátuljáról
  Ln(r, tx0 + 72, hy - 30, tipX + 2, tipY, SK('rope', 0.9));
  // horogkötél, horog
  Ln(r, tipX, tipY + 3, x, hookY - 7, SK('rope', 1));
  R(r, x - 4, hookY - 9, 8, 7, F('crane2'), { rx: 1.5 });
  P(r, `M${x} ${hookY - 2} v3 q0 3.4 -3 3.4`, SK('dark', 1.6));
  return { hook: [x, hookY + 3] };
}

/** Mixer gépkocsi; x: a hátsó vége, dir: 1 = jobbra néz (fülke jobbra) */
function mixer(g, M, x, dir = 1) {
  const GY = M.GY, t = g_(g, { class: 'pr-truck', transform: dir === 1 ? '' : `translate(${2 * x + 112} 0) scale(-1 1)` });
  R(t, x + 2, GY - 23, 106, 6, F('dark'));
  // dob
  const dg = g_(t, { transform: `rotate(-13 ${x + 46} ${GY - 44})` });
  E(dg, x + 46, GY - 44, 41, 17.5, 'fill:url(#pr-drum)' + `;stroke:${v('drum3')};stroke-width:.8`);
  for (let i = -2; i <= 2; i++) P(dg, `M${x + 46 + i * 15 - 6} ${GY - 60} q8 16 0 32`, SK('acc2', 2.6, 'opacity:.85'));
  E(dg, x + 8, GY - 44, 4, 10, F('drum3'));
  // dobtartó, garat, csúszda
  P(t, `M${x + 74} ${GY - 23} L${x + 80} ${GY - 52} L${x + 86} ${GY - 23}`, SK('dark2', 2.2));
  P(t, `M${x + 8} ${GY - 23} L${x + 11} ${GY - 38}`, SK('dark2', 2.2));
  P(t, `M${x + 1} ${GY - 56} l6 -7 h8 l-4 9z`, F('steel2'));
  P(t, `M${x + 3} ${GY - 33} l-10 9`, SK('steel3', 3, 'stroke-linecap:round'));
  // fülke
  P(t, `M${x + 88} ${GY - 21} V${GY - 50} Q${x + 88} ${GY - 54} ${x + 92} ${GY - 54} H${x + 103} Q${x + 112} ${GY - 52} ${x + 113} ${GY - 40} V${GY - 21}Z`, F('truck') + `;stroke:${v('truck2')};stroke-width:.8`);
  P(t, `M${x + 92} ${GY - 38} V${GY - 50} H${x + 103} Q${x + 109.5} ${GY - 49} ${x + 110} ${GY - 38}Z`, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:.9`);
  C(t, x + 99, GY - 43, 2.6, F('opr'));
  R(t, x + 108, GY - 27, 6, 3, F('lamp'), { rx: 1 });
  // kerekek
  [x + 18, x + 34, x + 96].forEach((cx) => { C(t, cx, GY - 8, 8, F('dark')); C(t, cx, GY - 8, 4.2, F('steel2')); C(t, cx, GY - 8, 1.6, F('dark2')); });
  P(t, `M${x + 8} ${GY - 17} q18 -9 36 0 M${x + 86} ${GY - 17} q10 -8 20 0`, SK('dark2', 2));
  return t;
}

/** Utánfutós betonpumpa garattal; az x a pumpa bal széle. Visszaadja a nyomócső kezdőpontját. */
function pump(g, M, x) {
  const GY = M.GY, p = g_(g, { class: 'pr-pump' });
  R(p, x + 2, GY - 15, 46, 4, F('dark'));
  R(p, x + 6, GY - 37, 38, 22, F('pump') + `;stroke:${v('pump3')};stroke-width:.8`, { rx: 3 });
  for (let i = 0; i < 5; i++) Ln(p, x + 24 + i * 3.6, GY - 33, x + 24 + i * 3.6, GY - 21, SK('pump3', 1));
  P(p, `M${x - 4} ${GY - 44} H${x + 16} L${x + 12} ${GY - 33} H${x}Z`, F('steel2') + `;stroke:${v('steel3')};stroke-width:.8`);
  R(p, x + 44, GY - 24, 10, 3, F('dark2'));
  C(p, x + 25, GY - 8, 7, F('dark')); C(p, x + 25, GY - 8, 3.4, F('steel2'));
  R(p, x + 38, GY - 41, 6, 5, F('steel3'));
  return [x + 41, GY - 41];
}

/** Kotrógép (kanál nélküli karvéggel); x: a karvég (horog) helye, a gép jobbra. */
function excavator(g, M, x, tipY, o = {}) {
  const GY = M.GY, e = g_(g, { class: 'pr-exc' });
  const bx = x + (o.reach ?? 64), tx0 = bx - 8, tl = 70;
  R(e, tx0, GY - 13, tl, 13, F('dark'), { rx: 6.5 });
  R(e, tx0 + 1.5, GY - 13, tl - 3, 2.4, 'fill:url(#pr-p-shoe)');
  R(e, tx0 + 3.5, GY - 10, tl - 7, 7, F('dark2'), { rx: 3.5 });
  for (let i = 0; i < 5; i++) C(e, tx0 + 9 + (i * (tl - 18)) / 4, GY - 6.3, 2.4, F('dark'));
  R(e, tx0 + 18, GY - 17, 30, 4.5, F('dark'));
  const hy = GY - 17;
  P(e, `M${tx0 + 8} ${hy} V${hy - 18} H${tx0 + 70} Q${tx0 + 76} ${hy - 18} ${tx0 + 76} ${hy - 10} V${hy}Z`, F('exc') + `;stroke:${v('exc3')};stroke-width:.8`);
  R(e, tx0 + 62, hy - 22, 15, 22, F('exc2'), { rx: 4 });
  P(e, `M${tx0 + 8} ${hy - 18} V${hy - 40} H${tx0 + 24} L${tx0 + 28} ${hy - 18}Z`, F('exc') + `;stroke:${v('exc3')};stroke-width:.8`);
  P(e, `M${tx0 + 10.5} ${hy - 21} V${hy - 37.5} H${tx0 + 22.4} L${tx0 + 25.4} ${hy - 21}Z`, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:1`);
  C(e, tx0 + 16.4, hy - 30, 2.7, F('opr'));
  P(e, `M${tx0 + 12} ${hy - 21.4} Q${tx0 + 13} ${hy - 27.3} ${tx0 + 16.4} ${hy - 27} Q${tx0 + 19.8} ${hy - 27.3} ${tx0 + 20.8} ${hy - 21.4}Z`, F('opr'));
  // gém (két egyenes szakasz), gémhenger, karhenger, kanál; a terhet a kanál horgán lógó lánc tartja
  const b0x = tx0 + 36, b0y = hy - 12;
  const kx = x + 26, ky = tipY - (o.lift ?? 34);                       // könyök (gém–kar csukló)
  const mx2 = b0x - (b0x - kx) * 0.3, my2 = ky - 10;                    // a gém törése
  P(e, `M${b0x} ${b0y} L${mx2} ${my2} L${kx} ${ky}`, SK('exc2', 8, 'stroke-linecap:round;stroke-linejoin:round'));
  P(e, `M${b0x} ${b0y} L${mx2} ${my2} L${kx} ${ky}`, SK('exc', 4.5, 'stroke-linecap:round;stroke-linejoin:round'));
  Ln(e, b0x + 6, b0y + 6, (b0x + mx2) / 2 + 5, (b0y + my2) / 2 + 4, SK('dark', 3, 'stroke-linecap:round'));
  Ln(e, (b0x + mx2) / 2 + 5, (b0y + my2) / 2 + 4, mx2 + 3, my2 + 12, SK('steel1', 1.6, 'stroke-linecap:round'));
  const sx2 = x + 4, sy2 = tipY - (o.tool === 'breaker' ? 46 : o.tool === 'rotary' ? 40 : 18);
  Ln(e, kx, ky, sx2, sy2, SK('exc2', 6, 'stroke-linecap:round'));
  Ln(e, kx, ky, sx2, sy2, SK('exc', 3, 'stroke-linecap:round'));
  Ln(e, mx2 - 2, my2 - 4, kx + 4, ky - 6, SK('dark', 2.4, 'stroke-linecap:round'));
  C(e, kx, ky, 3, F('dark'));
  if (o.tool === 'breaker') {
    // hidraulikus bontókalapács a kar végén
    Ln(e, sx2, sy2, x, tipY - 30, SK('exc2', 5, 'stroke-linecap:round'));
    R(e, x - 6, tipY - 32, 12, 22, F('dark2') + `;stroke:${v('dark')};stroke-width:.8`, { rx: 2 });
    R(e, x - 2, tipY - 10, 4, 10, F('steel2'));
    P(e, `M${x - 2} ${tipY} L${x} ${tipY + 4} L${x + 2} ${tipY}Z`, F('steel3'));
  } else if (o.tool === 'rotary') {
    // forgatómotor (talajcsavar behajtása)
    Ln(e, sx2, sy2, x, tipY - 24, SK('exc2', 5, 'stroke-linecap:round'));
    R(e, x - 9, tipY - 26, 18, 20, F('dark2') + `;stroke:${v('dark')};stroke-width:.8`, { rx: 3 });
    R(e, x - 5, tipY - 6, 10, 6, F('steel3'));
  } else {
    // kanál (behúzva) és horog
    P(e, `M${sx2 - 1} ${sy2 - 3} q-12 1 -11 11 q4 6 12 2 z`, F('exc2') + `;stroke:${v('exc3')};stroke-width:.8`);
    P(e, `M${sx2 - 3} ${sy2 + 9} q0 4 -3 4`, SK('dark', 1.4));
    Ln(e, sx2 - 4, sy2 + 12, x, tipY, SK('rope', 1.1));
  }
  return { tip: [x, tipY] };
}

/* ================================================================== szerszámok, anyagok */
function concrete(g, x, y, w, hh, fresh = true) {
  R(g, x, y, w, hh, fresh ? 'fill:url(#pr-freshg)' : 'fill:url(#pr-concg)');
  R(g, x, y, w, hh, 'fill:url(#pr-p-conc)');
}
function holeWall(g, cx, top, bot, half) {
  // a furat fala: vékony sötét vonal és árnyék
  Ln(g, cx - half, top, cx - half, bot, SK('wall', 1.2));
  Ln(g, cx + half, top, cx + half, bot, SK('wall', 1.2));
}
function cage(g, cx, top, bot, half) {
  const c = g_(g, { class: 'pr-cage' });
  const xs = [cx - half + 2, cx - half * 0.35, cx + half * 0.35, cx + half - 2];
  xs.forEach((x, i) => Ln(c, x, top, x, bot, SK('rebar', i === 0 || i === 3 ? 1.8 : 1.2)));
  let d = '';
  for (let y = top + 5; y < bot - 3; y += 8) d += `M${cx - half + 2} ${y} L${cx + half - 2} ${y + 4} `;
  P(c, d, SK('rebar2', 1));
  for (let y = top + 22; y < bot - 10; y += 46) { C(c, cx - half + 1, y, 1.7, F('spacer')); C(c, cx + half - 1, y + 8, 1.7, F('spacer')); }
  return c;
}
/**
 * Folyamatos fúróspirál metszetben: üreges szár, csavarmenetek elöl-hátul; a talajba hatoló részen
 * (soilFrom alatt) a menetek közét talaj tölti ki a furat faláig.
 */
function auger(g, cx, top, bot, half, o = {}) {
  const a = g_(g, { class: 'pr-auger' });
  const pitch = o.pitch ?? 16, soilFrom = o.soilFrom ?? null, soilTo = o.soilTo ?? bot;
  if (soilFrom != null && soilTo > soilFrom) {
    const y0 = Math.max(top, soilFrom);
    R(a, cx - half, y0, half * 2, soilTo - y0, F(o.soil ?? 'clay'));
    R(a, cx - half, y0, half * 2, soilTo - y0, `fill:url(#${o.pat ?? 'pr-p-clay'})`);
  }
  // hátsó menetek (halványan)
  let back = '';
  for (let y = top + 4; y < bot - 8; y += pitch) back += `M${cx + half} ${y + pitch / 2} Q${cx} ${y + pitch * 0.82} ${cx - half} ${y + pitch} `;
  P(a, back, SK('steel3', 1.4, 'opacity:.55'));
  // szár
  R(a, cx - 4, top, 8, bot - top - 2, 'fill:url(#pr-cyl)');
  // elülső menetek
  let fr = '';
  for (let y = top + 4; y < bot - 8; y += pitch) fr += `M${cx - half} ${y} Q${cx} ${y + pitch * 0.18} ${cx + half} ${y + pitch / 2} `;
  P(a, fr, SK('steel3', 3.6, 'stroke-linecap:round'));
  P(a, fr, SK('steel1', 1.6, 'stroke-linecap:round'));
  // csúcs: vágóélek, középső csúcs
  P(a, `M${cx - half + 1} ${bot - 7} L${cx - 3} ${bot} L${cx + 3} ${bot} L${cx + half - 1} ${bot - 7}`, SK('steel3', 2.6, 'stroke-linejoin:round'));
  P(a, `M${cx - 3} ${bot} L${cx} ${bot + 4} L${cx + 3} ${bot}Z`, F('steel3'));
  return a;
}
/** Kiemelt furadék kupaca a terepen */
function spoil(g, M, x, w, hh, k = 'clay') {
  const [col, pat] = SOIL[k], GY = M.GY;
  const d = `M${x} ${GY + 0.5} C${x + w * 0.2} ${GY - hh * 0.9} ${x + w * 0.45} ${GY - hh * 1.05} ${x + w * 0.62} ${GY - hh * 0.8} C${x + w * 0.8} ${GY - hh * 0.55} ${x + w * 0.9} ${GY - hh * 0.2} ${x + w} ${GY + 0.5}Z`;
  P(g, d, F(col) + `;stroke:${v('layer')};stroke-width:.7`);
  P(g, d, `fill:url(#${pat})`);
}


/* ================================================================== további szerszámok és gépek */
/** Béléscső metszetben: két acélfal, belül a furat tere; o.joints: toldások, o.teeth: vágókoszorú, o.inner: a belső tér színe */
function casing(g, cx, top, bot, half, o = {}) {
  const t = o.t ?? 3.6, c = g_(g, { class: 'pr-casing' });
  if (o.inner !== false) R(c, cx - half, top, half * 2, bot - top, F(o.inner ?? 'bore'));
  R(c, cx - half - t, top, t, bot - top, 'fill:url(#pr-cyl)');
  R(c, cx + half, top, t, bot - top, 'fill:url(#pr-cyl)');
  const seg = o.seg ?? 48;
  if (o.joints !== false) for (let y = top + seg; y < bot - 8; y += seg) { R(c, cx - half - t - 1, y - 1.6, t + 1.4, 3.2, F('steel3')); R(c, cx + half - 0.4, y - 1.6, t + 1.4, 3.2, F('steel3')); }
  if (o.teeth) for (const k of [-1, 1]) P(c, `M${cx + k * (half + t / 2) - 2.2} ${bot} l2.2 4.6 l2.2 -4.6z`, F('steel3'));
  if (o.collar) R(c, cx - half - t - 3, top, half * 2 + 2 * t + 6, 6, F('steel3'), { rx: 1.5 });
  return c;
}
/** Furat vagy cső tartalma: víz, zagy, cementtej */
function water(g, x, y, w, hh) { R(g, x, y, w, hh, F('water', 0.32)); Ln(g, x, y, x + w, y, SK('water', 1.2)); }
function slurry(g, x, y, w, hh) { R(g, x, y, w, hh, 'fill:url(#pr-slurryg)'); R(g, x, y, w, hh, 'fill:url(#pr-p-slurry)'); Ln(g, x, y, x + w, y, SK('slurry2', 1.4)); }
/** Teleszkópos kellyrúd */
function kelly(g, cx, top, bot) {
  const L = bot - top;
  R(g, cx - 2.4, top, 4.8, L, 'fill:url(#pr-cyl)');
  R(g, cx - 3.6, top, 7.2, L * 0.62, 'fill:url(#pr-cyl)');
  R(g, cx - 4.8, top, 9.6, L * 0.3, 'fill:url(#pr-cyl)');
  [L * 0.3, L * 0.62].forEach((d, i) => R(g, cx - 5.4 + i * 1.2, top + d - 2, 10.8 - i * 2.4, 3, F('steel3')));
}
/** Dobfúró (nyitható fenéklemezzel, fogakkal) */
function drillBucket(g, cx, bot, half, o = {}) {
  const hh = o.h ?? 34, y0 = bot - hh, b = g_(g, { class: 'pr-bucket' });
  R(b, cx - 4, y0 - 7, 8, 7, F('steel3'));
  R(b, cx - half, y0, half * 2, hh - 4, 'fill:url(#pr-cyl)', { rx: 2 });
  R(b, cx - half, y0, half * 2, 4, F('steel3'));
  if (o.soil) { const [col, pat] = SOIL[o.soil]; R(b, cx - half + 3, y0 + 7, half * 2 - 6, hh - 14, F(col)); R(b, cx - half + 3, y0 + 7, half * 2 - 6, hh - 14, `fill:url(#${pat})`); }
  for (let y = y0 + 10; y < bot - 8; y += 9) Ln(b, cx - half, y, cx + half, y, SK('steel3', 0.8, 'opacity:.6'));
  R(b, cx - half - 1, bot - 5, half * 2 + 2, 3.4, F('steel3'));
  for (let i = 0; i < 5; i++) P(b, `M${cx - half + 2 + (i * (half * 2 - 4)) / 4 - 2} ${bot - 2} l2 5 l2 -5z`, F('dark2'));
  return b;
}
/** Tölcsér és betonozó (kontraktor-) cső */
function tremie(g, cx, top, bot, o = {}) {
  const t = g_(g, { class: 'pr-tremie' });
  R(t, cx - 3.4, top + 16, 6.8, bot - top - 16, 'fill:url(#pr-cyl)');
  for (let y = top + 42; y < bot - 6; y += 30) R(t, cx - 4.6, y, 9.2, 2.4, F('steel3'));
  P(t, `M${cx - 17} ${top} L${cx - 4} ${top + 17} L${cx + 4} ${top + 17} L${cx + 17} ${top}Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.8`);
  if (o.full) P(t, `M${cx - 14} ${top + 3} L${cx - 4} ${top + 15} L${cx + 4} ${top + 15} L${cx + 14} ${top + 3} Q${cx} ${top - 4} ${cx - 14} ${top + 3}Z`, F('fresh1'));
  R(t, cx - 18, top - 2, 36, 3, F('steel3'), { rx: 1 });
  return t;
}
/** Kiszorító fúrófej üreges szárral (csavart / FDP cölöp) */
function dispTool(g, cx, top, tip, half) {
  const d = g_(g, { class: 'pr-disp' });
  R(d, cx - 6, top, 12, tip - top - 40, 'fill:url(#pr-cyl)');
  for (let y = top + 36; y < tip - 46; y += 36) R(d, cx - 7.5, y, 15, 2.6, F('steel3'));
  // kiszorító test: kúpos átmenet, henger, alsó csavarmenet, csúcs
  P(d, `M${cx - 6} ${tip - 42} L${cx - half} ${tip - 30} L${cx - half} ${tip - 18} L${cx - 5} ${tip - 2} L${cx} ${tip + 3} L${cx + 5} ${tip - 2} L${cx + half} ${tip - 18} L${cx + half} ${tip - 30} L${cx + 6} ${tip - 42}Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.9`);
  P(d, `M${cx - half - 2} ${tip - 33} Q${cx} ${tip - 30} ${cx + half + 2} ${tip - 26} M${cx - half + 1} ${tip - 20} Q${cx} ${tip - 16} ${cx + half - 2} ${tip - 12}`, SK('steel3', 3, 'stroke-linecap:round'));
  P(d, `M${cx - 7} ${tip - 52} Q${cx} ${tip - 50} ${cx + 7} ${tip - 46}`, SK('steel3', 2.6, 'stroke-linecap:round'));
  return d;
}
/** Résfal-markoló (két pofás hidraulikus markoló) */
function grab(g, cx, bot, half, open = 0.3) {
  const hh = 50, y0 = bot - hh, b = g_(g, { class: 'pr-grab' });
  R(b, cx - half * 0.62, y0, half * 1.24, 30, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 2 });
  R(b, cx - half * 0.62, y0, half * 1.24, 6, F('mach2'));
  R(b, cx - 2, y0 + 8, 4, 18, F('steel1'));
  const o = open * 10;
  P(b, `M${cx - half * 0.62} ${y0 + 28} L${cx - half - o} ${bot - 6} Q${cx - half * 0.5 - o * 0.5} ${bot + 2} ${cx - 1} ${bot - 1} L${cx - 3} ${y0 + 30}Z`, F('mach2') + `;stroke:${v('mach3')};stroke-width:.8`);
  P(b, `M${cx + half * 0.62} ${y0 + 28} L${cx + half + o} ${bot - 6} Q${cx + half * 0.5 + o * 0.5} ${bot + 2} ${cx + 1} ${bot - 1} L${cx + 3} ${y0 + 30}Z`, F('mach2') + `;stroke:${v('mach3')};stroke-width:.8`);
  for (let i = 0; i < 3; i++) { P(b, `M${cx - half * 0.8 - o + i * 7} ${bot - 2 + i} l2 4 l2 -4z`, F('dark2')); P(b, `M${cx + half * 0.8 + o - i * 7 - 4} ${bot - 2 + i} l2 4 l2 -4z`, F('dark2')); }
  return { top: y0 };
}
/** Siló lábakon (bentonit vagy cement) */
function silo(g, M, x, o = {}) {
  const GY = M.GY, w = o.w ?? 24, hh = o.h ?? 92, top = GY - hh, s = g_(g, { class: 'pr-silo' });
  [x - w / 2 + 2, x + w / 2 - 2].forEach((lx) => Ln(s, lx, GY, lx, GY - 30, SK('steel3', 2.4)));
  Ln(s, x - w / 2 + 2, GY - 8, x + w / 2 - 2, GY - 24, SK('steel3', 1.2));
  P(s, `M${x - w / 2} ${GY - 40} L${x - 3} ${GY - 26} H${x + 3} L${x + w / 2} ${GY - 40}Z`, 'fill:url(#pr-cylw)' + `;stroke:${v('drum3')};stroke-width:.8`);
  R(s, x - w / 2, top + 4, w, hh - 44, 'fill:url(#pr-cylw)' + `;stroke:${v('drum3')};stroke-width:.8`);
  P(s, `M${x - w / 2} ${top + 4} Q${x} ${top - 6} ${x + w / 2} ${top + 4}Z`, F('drum2') + `;stroke:${v('drum3')};stroke-width:.8`);
  for (let y = top + 12; y < GY - 44; y += 6) Ln(s, x + w / 2 - 4, y, x + w / 2 - 1, y, SK('steel3', 0.9));
  if (o.band) R(s, x - w / 2, top + 16, w, 6, F(o.band));
  return { out: [x, GY - 26] };
}
/** Keverő-szivattyú konténer */
function plant(g, M, x, o = {}) {
  const GY = M.GY, w = o.w ?? 50, hh = o.h ?? 26, p = g_(g, { class: 'pr-plant' });
  R(p, x, GY - hh, w, hh, F(o.col ?? 'cont') + `;stroke:${v('cont3')};stroke-width:.8`, { rx: 1.5 });
  for (let i = 4; i < w - 2; i += 4) Ln(p, x + i, GY - hh + 2, x + i, GY - 2, SK('cont3', 0.7, 'opacity:.6'));
  R(p, x + w * 0.62, GY - hh + 5, w * 0.28, hh * 0.45, F('dark2'), { rx: 1 });
  C(p, x + w * 0.76, GY - hh + 5 + hh * 0.22, 3.2, F('steel2'));
  return { out: [x + w, GY - hh + 8], top: GY - hh };
}
/** Tömlő két pont között, belógó ívvel */
function hoseTo(g, x1, y1, x2, y2, sag = 30, cls = 'hose') {
  const d = `M${x1} ${y1} C${x1 + (x2 - x1) * 0.25} ${Math.max(y1, y2) + sag} ${x1 + (x2 - x1) * 0.75} ${Math.max(y1, y2) + sag} ${x2} ${y2}`;
  P(g, d, SK(cls, 3, 'stroke-linecap:round'));
  P(g, d, SK('hose2', 0.9, 'stroke-linecap:round;opacity:.6'));
}
/** Kis, lánctalpas fúrógép (mikrocölöp, jet): a fúrás tengelye x-en, a gép jobbra, a kezelő a pultnál áll */
function smallRig(g, M, x, o = {}) {
  const GY = M.GY, r = g_(g, { class: 'pr-small' }), top = o.top ?? GY - 120, mx = x + 10;
  const tx0 = x + 14, tl = 60;
  R(r, tx0, GY - 11, tl, 11, F('dark'), { rx: 5.5 });
  R(r, tx0 + 1.5, GY - 11, tl - 3, 2.2, 'fill:url(#pr-p-shoe)');
  R(r, tx0 + 3, GY - 8.5, tl - 6, 6, F('dark2'), { rx: 3 });
  for (let i = 0; i < 4; i++) C(r, tx0 + 8 + (i * (tl - 16)) / 3, GY - 5.5, 2.2, F('dark'));
  const hy = GY - 13;
  P(r, `M${tx0 + 4} ${hy} V${hy - 18} Q${tx0 + 4} ${hy - 22} ${tx0 + 8} ${hy - 22} H${tx0 + tl - 2} Q${tx0 + tl + 3} ${hy - 22} ${tx0 + tl + 3} ${hy - 16} V${hy}Z`, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
  for (let i = 0; i < 5; i++) Ln(r, tx0 + 30 + i * 4, hy - 17, tx0 + 30 + i * 4, hy - 6, SK('mach3', 1));
  // árboc
  R(r, mx - 4.5, top, 9, GY - 6 - top, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
  R(r, mx - 4.5, top, 2.4, GY - 6 - top, F('mach3'));
  R(r, mx - 7, GY - 7, 14, 7, F('dark2'), { rx: 1.5 });
  Ln(r, tx0 + 10, hy - 14, mx + 4, hy - 34, SK('mach2', 5, 'stroke-linecap:round'));
  Ln(r, tx0 + 24, hy - 21, mx + 4, top + (GY - top) * 0.5, SK('dark', 3.2, 'stroke-linecap:round'));
  R(r, mx - 8, top - 6, 16, 7, F('mach2'), { rx: 1.5 });
  // fúrófej (forgató motor) a rúdon
  const hY = o.headY ?? top + 10;
  R(r, x + 4, hY + 3, mx - 4.5 - (x + 4), 10, F('mach2'));
  R(r, x - 9, hY, 18, 16, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 2 });
  R(r, x - 6, hY - 5, 12, 5, F('dark2'), { rx: 1 });
  // kezelőpult és kezelő
  const kx = tx0 + tl + 16;
  R(r, kx - 5, GY - 22, 10, 6, F('dark2'), { rx: 1 });
  Ln(r, kx, GY - 16, kx, GY, SK('dark2', 1.6));
  worker(g, kx + 9, { GY, pose: 'guide', dir: -1 });
  return { headY: hY, headBot: hY + 16, mx };
}
/** Kerekes homlokrakodó, emelt kanállal */
function loader(g, M, x, o = {}) {
  const GY = M.GY, l = g_(g, { class: 'pr-loader' }), lift = o.lift ?? 30;
  R(l, x + 10, GY - 30, 62, 16, F('exc') + `;stroke:${v('exc3')};stroke-width:.8`, { rx: 3 });
  P(l, `M${x + 42} ${GY - 30} V${GY - 56} H${x + 62} L${x + 66} ${GY - 30}Z`, F('exc') + `;stroke:${v('exc3')};stroke-width:.8`);
  P(l, `M${x + 45} ${GY - 33} V${GY - 53} H${x + 60} L${x + 63} ${GY - 33}Z`, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:.9`);
  C(l, x + 53, GY - 43, 2.7, F('opr'));
  R(l, x + 66, GY - 36, 10, 22, F('exc2'), { rx: 3 });
  [x + 22, x + 62].forEach((cx) => { C(l, cx, GY - 11, 11, F('dark')); C(l, cx, GY - 11, 5.4, F('exc2')); C(l, cx, GY - 11, 2, F('dark2')); });
  const ax = x + 2, ay = GY - 26 - lift;
  Ln(l, x + 36, GY - 30, ax + 6, ay + 8, SK('exc2', 6, 'stroke-linecap:round'));
  Ln(l, x + 40, GY - 38, ax + 10, ay + 2, SK('dark', 2.6, 'stroke-linecap:round'));
  P(l, `M${ax + 8} ${ay - 4} L${ax - 14} ${ay - 6} L${ax - 16} ${ay + 10} Q${ax - 4} ${ay + 16} ${ax + 8} ${ay + 10}Z`, F('exc2') + `;stroke:${v('exc3')};stroke-width:.8`);
  if (o.full) P(l, `M${ax - 13} ${ay - 6} Q${ax - 4} ${ay - 13} ${ax + 6} ${ay - 5}Z`, F('stone') + `;stroke:${v('stone2')};stroke-width:.6`);
  return l;
}
/** Hidraulikus kos a vezetőtornyon, cölöpsapkával */
function hammer(g, cx, y, half) {
  const k = g_(g, { class: 'pr-hammer' });
  R(k, cx - half - 3, y, half * 2 + 6, 48, F('mach') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 3 });
  R(k, cx - half - 3, y + 8, half * 2 + 6, 5, F('dark'));
  R(k, cx - half + 1, y + 16, half * 2 - 2, 24, F('mach2'), { rx: 2 });
  Ln(k, cx, y - 8, cx, y, SK('rope', 1.1));
  R(k, cx - half - 1, y + 48, half * 2 + 2, 9, F('dark2'), { rx: 1 });
  return y + 57;
}
/** Előregyártott vasbeton cölöp csúccsal, toldóval */
function precast(g, cx, top, tip, half, o = {}) {
  const p = g_(g, { class: 'pr-precast' });
  R(p, cx - half, top, half * 2, tip - top - 12, 'fill:url(#pr-pile)' + `;stroke:${v('conc2')};stroke-width:.6`);
  R(p, cx - half, top, half * 2, tip - top - 12, 'fill:url(#pr-p-conc)', { opacity: 0.5 });
  P(p, `M${cx - half} ${tip - 12} L${cx} ${tip} L${cx + half} ${tip - 12}Z`, F('steel3'));
  if (o.rebar) for (const dx of [-half + 3, half - 3]) Ln(p, cx + dx, top - o.rebar, cx + dx, top + 2, SK('rebar', 1.6));
  return p;
}
/** Talajcsavar: acélszár 2–3 csavarlemezzel, kúpos csúcs, fejlemez */
function screwPile(g, cx, top, tip, o = {}) {
  const s = g_(g, { class: 'pr-screw' });
  R(s, cx - 4, top, 8, tip - top - 8, 'fill:url(#pr-cyl)');
  P(s, `M${cx - 4} ${tip - 8} L${cx} ${tip + 2} L${cx + 4} ${tip - 8}Z`, F('steel3'));
  for (let i = 0; i < 3; i++) { const yy = tip - 14 - i * 18; P(s, `M${cx - 13} ${yy - 4} Q${cx} ${yy - 1} ${cx + 13} ${yy + 3}`, SK('steel3', 3.4, 'stroke-linecap:round')); P(s, `M${cx - 13} ${yy - 4} Q${cx} ${yy - 1} ${cx + 13} ${yy + 3}`, SK('steel1', 1.4, 'stroke-linecap:round')); }
  if (o.plate) R(s, cx - 14, top - 3, 28, 4, F('steel3'), { rx: 1 });
  return s;
}
/** Mélyvibrátor (kőoszlop) a vezetőtoronyban: vibrátortest, toldócső, felül anyagtartály (zsilip) */
function vibroflot(g, cx, top, tip, o = {}) {
  const f = g_(g, { class: 'pr-vibro' });
  R(f, cx - 4.5, top + 24, 9, tip - top - 60, 'fill:url(#pr-cyl)');
  R(f, cx + 4.5, top + 24, 4, tip - top - 60, F('steel3'));
  R(f, cx - 7, tip - 40, 14, 38, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.8`, { rx: 3 });
  P(f, `M${cx - 7} ${tip - 4} L${cx} ${tip + 3} L${cx + 7} ${tip - 4}Z`, F('steel3'));
  Ln(f, cx - 7, tip - 28, cx + 7, tip - 28, SK('steel3', 1));
  P(f, `M${cx - 13} ${top} L${cx - 6} ${top + 24} H${cx + 9} L${cx + 15} ${top}Z`, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
  if (o.full) P(f, `M${cx - 12} ${top + 2} Q${cx + 1} ${top - 6} ${cx + 14} ${top + 2}Z`, F('stone') + `;stroke:${v('stone2')};stroke-width:.6`);
  return f;
}
/** Jet monitor fúvókával és vágósugárral */
function jetTool(g, cx, top, y, o = {}) {
  const j = g_(g, { class: 'pr-jet' });
  R(j, cx - 3.4, top, 6.8, y - top + 10, 'fill:url(#pr-cyl)');
  R(j, cx - 5, y - 6, 10, 18, F('steel3'), { rx: 2 });
  P(j, `M${cx - 5} ${y + 12} L${cx} ${y + 18} L${cx + 5} ${y + 12}Z`, F('dark2'));
  if (o.jet) {
    const L = o.jet;
    for (const k of [-1, 1]) {
      P(j, `M${cx + k * 5} ${y - 1.2} L${cx + k * L} ${y - 6} Q${cx + k * (L + 5)} ${y} ${cx + k * L} ${y + 6} L${cx + k * 5} ${y + 1.2}Z`, F('halo', 0.9) + `;stroke:${v('water')};stroke-width:.7`);
      Ln(j, cx + k * 5, y, cx + k * (L + 1), y, SK('water', 1.6));
      for (let i = 0; i < 6; i++) C(j, cx + k * (L + 2 + (i % 3) * 3), y + (i - 2.5) * 2.6, 1, F('water', 0.7));
    }
  }
  return j;
}
/** Mélykeverő szerszám: lapátok több szinten, vágóél alul */
function mixTool(g, cx, top, bot, half) {
  const m = g_(g, { class: 'pr-mixtool' });
  R(m, cx - 4, top, 8, bot - top, 'fill:url(#pr-cyl)');
  for (let i = 0; i < 3; i++) {
    const yy = bot - 8 - i * 14;
    P(m, `M${cx - half} ${yy - 3} L${cx + half} ${yy + 3}`, SK('steel3', 3.6, 'stroke-linecap:round'));
    P(m, `M${cx - half * 0.8} ${yy + 4} L${cx + half * 0.8} ${yy - 4}`, SK('steel2', 2.6, 'stroke-linecap:round'));
  }
  P(m, `M${cx - half} ${bot - 2} L${cx + half} ${bot - 2}`, SK('dark2', 3, 'stroke-linecap:round'));
  for (let i = -2; i <= 2; i++) P(m, `M${cx + i * half * 0.45 - 2} ${bot - 1} l2 4 l2 -4z`, F('dark2'));
  return m;
}
/** Kevert (talaj–kötőanyag) vagy jet-oszlop teste */
function column(g, cx, top, bot, half, kind = 'mix') {
  const c = g_(g);
  if (kind === 'jet') {
    R(c, cx - half, top, half * 2, bot - top, 'fill:url(#pr-groutg)', { rx: 4 });
    for (let y = top + 6; y < bot - 4; y += 9) P(c, `M${cx - half + 2} ${y} Q${cx} ${y + 5} ${cx + half - 2} ${y}`, SK('grout2', 1, 'opacity:.8'));
  } else {
    R(c, cx - half, top, half * 2, bot - top, 'fill:url(#pr-mixg)', { rx: 3 });
    R(c, cx - half, top, half * 2, bot - top, 'fill:url(#pr-p-mix)', { rx: 3 });
  }
  return c;
}
/** Kőoszlop: bordás kavicsoszlop */
function stoneCol(g, cx, top, bot, half, o = {}) {
  const c = g_(g, { class: 'pr-stonecol' });
  let d = `M${cx - half} ${top}`;
  const n = Math.max(2, Math.round((bot - top) / 16)), st = (bot - top) / n;
  for (let i = 0; i < n; i++) { const hw = half + (o.bulge && top + (i + 0.5) * st > o.bulge[0] && top + (i + 0.5) * st < o.bulge[1] ? 5 : 0); d += ` Q${cx - hw - 4} ${top + (i + 0.5) * st} ${cx - half} ${top + (i + 1) * st}`; }
  d += ` Q${cx} ${bot + 6} ${cx + half} ${bot}`;
  for (let i = n - 1; i >= 0; i--) { const hw = half + (o.bulge && top + (i + 0.5) * st > o.bulge[0] && top + (i + 0.5) * st < o.bulge[1] ? 5 : 0); d += ` Q${cx + hw + 4} ${top + (i + 0.5) * st} ${cx + half} ${top + i * st}`; }
  d += 'Z';
  P(c, d, F('stone'));
  P(c, d, 'fill:url(#pr-p-stone)');
  P(c, d, SK('stone2', 0.8));
  return c;
}
/** Hullámos felületű Franki-törzs és hagyma */
function wavyShaft(g, cx, top, bot, half) {
  const n = Math.max(2, Math.round((bot - top) / 13)), st = (bot - top) / n;
  let d = `M${cx - half} ${top}`;
  for (let i = 0; i < n; i++) d += ` q-5 ${st / 2} 0 ${st}`;
  d += ` H${cx + half}`;
  for (let i = 0; i < n; i++) d += ` q5 ${-st / 2} 0 ${-st}`;
  P(g, d + 'Z', 'fill:url(#pr-concg)');
  P(g, d + 'Z', 'fill:url(#pr-p-conc)');
}
function bulb(g, cx, cy, rx, ry) {
  const d = `M${cx - rx * 0.5} ${cy - ry} C${cx - rx * 1.2} ${cy - ry * 0.75} ${cx - rx * 1.1} ${cy + ry} ${cx} ${cy + ry} C${cx + rx * 1.1} ${cy + ry} ${cx + rx * 1.2} ${cy - ry * 0.75} ${cx + rx * 0.5} ${cy - ry}Z`;
  P(g, d, 'fill:url(#pr-concg)'); P(g, d, 'fill:url(#pr-p-conc)'); P(g, d, SK('conc2', 0.8));
}
/** Franki ejtőkos a csőben (kötélen) */
function ram(g, cx, ropeTop, y, half) {
  Ln(g, cx, ropeTop, cx, y, SK('rope', 1.1));
  R(g, cx - half + 2, y, half * 2 - 4, 30, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.8`, { rx: 3 });
  R(g, cx - 2.5, y - 4, 5, 5, F('steel3'));
}
/** Betonszállító puttony (Franki) */
function skip(g, cx, y, o = {}) {
  const s = g_(g, { class: 'pr-skip' });
  P(s, `M${cx - 16} ${y} L${cx - 10} ${y + 20} H${cx + 10} L${cx + 16} ${y}Z`, F('steel2') + `;stroke:${v('steel3')};stroke-width:.9`);
  P(s, `M${cx - 14} ${y + 2} Q${cx} ${y - 6} ${cx + 14} ${y + 2}Z`, F('fresh1'));
  return s;
}
/** Egyszerű könnyűszerkezetes ház (talajcsavar) */
function house(g, x, y, w) {
  const hs = g_(g, { class: 'pr-house' });
  R(hs, x, y - 40, w, 40, F('wallh') + `;stroke:${v('wallh2')};stroke-width:.8`);
  P(hs, `M${x - 6} ${y - 40} L${x + w / 2} ${y - 66} L${x + w + 6} ${y - 40}Z`, F('roof') + `;stroke:${v('roof2')};stroke-width:.8`);
  R(hs, x + 8, y - 30, 12, 12, 'fill:url(#pr-glass)' + `;stroke:${v('wallh2')};stroke-width:1`);
  R(hs, x + w - 22, y - 26, 12, 26, F('timber2'));
  return hs;
}

/* ================================================================== módszerek */
// minden módszer: H, GY, rétegek (k: talajfajta, y: a réteg teteje, lab: név), gw: talajvízszint, steps: [{ w, t, d, draw }]
const PROC = {};

/* ---------------- CFA – folyamatos spirállal fúrt cölöp */
PROC.cfa = {
  H: 360, GY: 178, gw: 226, layers: [{ k: 'clay', y: 178, lab: 'iszapos agyag' }, { k: 'sand', y: 252, lab: 'homok' }],
  steps: [
    { w: 270, t: 'Kitűzés, pontraállás', d: 'Kitűzik a cölöp helyét, és a gép pontraáll. Az üreges fúrószár alját elvesző sapka vagy „csapóajtó” zárja.', draw(g, M) {
      const x = 108, r = rig(g, M, x, { top: 20, headY: 30 });
      auger(g, x, r.headBot, M.GY - 2, 15);
      tag(g, x + 30, M.GY + 18, 'csapóajtó', { to: [x + 3, M.GY] });
      tag(g, x - 24, 118, 'üreges szár', { anchor: 'end', to: [x - 4, 118] });
      worker(g, x - 44, { GY: M.GY, pose: 'signal' });
    } },
    { w: 270, t: 'Furatkészítés', d: 'A spirált földkitermelés nélkül hajtják le: a furadék csak részben nyomódik ki, a spirálon maradó talajdugó folyamatosan támasztja a furat falát.', draw(g, M) {
      const x = 108, toe = 304, top = toe - (M.GY - 2 - 54);
      spoil(g, M, x - 46, 30, 9); spoil(g, M, x + 14, 18, 6);
      const r = rig(g, M, x, { top: 20, headY: top - 24 });
      auger(g, x, r.headBot, toe, 15, { soilFrom: M.GY, soilTo: toe - 4 });
      holeWall(g, x, M.GY, toe - 4, 15);
      spin(g, x, r.headY + 34, 24);
      arrowV(g, x - 38, 196, 236);
      tag(g, x + 24, 280, 'talajdugó', { to: [x + 8, 274] });
    } },
    { w: 360, t: 'Betonozás', d: 'A fúrószáron át túlnyomással betont pumpálnak, amely feltolja a spirált – ezt húzással segítik. Vibrálni nem kell: a folyós beton nyomás alatt öntömörödik.', draw(g, M) {
      const x = 222, toe = 304, tip = 236, top = tip - (M.GY - 2 - 54);
      spoil(g, M, x - 40, 26, 8); spoil(g, M, x + 16, 20, 7);
      const r = rig(g, M, x, { top: 20, headY: top - 24 });
      concrete(g, x - 15, tip, 30, toe - tip);
      holeWall(g, x, M.GY, toe, 15);
      auger(g, x, r.headBot, tip, 15, { soilFrom: M.GY, soilTo: tip - 4 });
      mixer(g, M, 6, 1);
      const [px, py] = pump(g, M, 122);
      // betontömlő a pumpától a forgatófej tetejéig
      P(g, `M${px} ${py} C${px + 6} ${py - 70} ${x - 70} ${r.headY - 64} ${x - 1} ${r.headY - 8}`, SK('hose', 3.4, 'stroke-linecap:round'));
      P(g, `M${px} ${py} C${px + 6} ${py - 70} ${x - 70} ${r.headY - 64} ${x - 1} ${r.headY - 8}`, SK('hose2', 1, 'stroke-linecap:round;opacity:.7'));
      arrowV(g, x - 36, 214, 176);
      tag(g, x + 22, 284, 'beton', { to: [x + 6, 276] });
      tag(g, 58, M.GY - 86, 'mixerautó', { anchor: 'middle' });
      tag(g, 146, M.GY - 62, 'betonpumpa', { anchor: 'middle' });
    } },
    { w: 290, t: 'Vasalás', d: 'A cölöpöt általában a munkaszintig betonozzák fel, és a vasalási armatúrát a friss betonba süllyesztik.', draw(g, M) {
      const x = 96, toe = 304;
      concrete(g, x - 15, M.GY, 30, toe - M.GY);
      holeWall(g, x, M.GY, toe, 15);
      const ctop = 120, cbot = 262;
      cage(g, x, ctop, cbot, 12);
      R(g, x - 13, ctop - 3, 26, 3, F('steel3'));
      P(g, `M${x - 12} ${ctop - 2} L${x} ${ctop - 22} L${x + 12} ${ctop - 2}`, SK('rope', 1.1));
      excavator(g, M, x, ctop - 22, { reach: 70, lift: 40 });
      worker(g, x - 30, { GY: M.GY, pose: 'guide' });
      arrowV(g, x - 46, 140, 178);
      tag(g, x + 24, 214, 'armatúra', { to: [x + 10, 208] });
    } },
  ],
};


/* ---------------- Franki-cölöp */
PROC.franki = {
  H: 360, GY: 178, layers: [{ k: 'clay', y: 178, lab: 'puha, kötött réteg' }, { k: 'gravel', y: 262, lab: 'teherbíró réteg' }],
  steps: [
    { w: 200, t: 'Dugó', d: 'száraz beton a cső aljában, döngölve', draw(g, M) {
      const x = 66, r = rig(g, M, x, { top: 16, lattice: true });
      casing(g, x, 40, M.GY + 8, 11, { collar: true });
      concrete(g, x - 11, M.GY - 16, 22, 24, false);
      ram(g, x, r.top - 1, 92, 11);
      arrowV(g, x - 26, 92, 140);
      tag(g, x - 18, M.GY - 4, 'dugó', { anchor: 'end', to: [x - 4, M.GY - 4] });
      tag(g, x - 18, 70, 'kos', { anchor: 'end', to: [x - 5, 100] });
    } },
    { w: 200, t: 'Leverés', d: 'a dugó magával húzza le a csövet', draw(g, M) {
      const x = 66, r = rig(g, M, x, { top: 16, lattice: true });
      casing(g, x, 96, 244, 11, { collar: true });
      concrete(g, x - 11, 220, 22, 24, false);
      ram(g, x, r.top - 1, 188, 11);
      pushOut(g, x, 228, 15, 2);
      arrowV(g, x - 30, 120, 166);
    } },
    { w: 200, t: 'Kiverés', d: 'a rögzített csőből kiverik a dugót', draw(g, M) {
      const x = 66, r = rig(g, M, x, { top: 16, lattice: true });
      casing(g, x, 124, 270, 11, { collar: true });
      P(g, `M${x - 15} 126 L${r.mx - 4} 104 M${x + 15} 126 L${r.mx - 4} 114`, SK('rope', 1.3));
      bulb(g, x, 280, 16, 11);
      ram(g, x, r.top - 1, 238, 11);
      tag(g, x - 18, 112, 'rögzítve', { anchor: 'end', to: [x - 8, 124] });
    } },
    { w: 200, t: 'Hagyma', d: 'újabb adagok: kiszélesedő talp', draw(g, M) {
      const x = 66, r = rig(g, M, x, { top: 16, lattice: true });
      casing(g, x, 124, 270, 11, { collar: true });
      P(g, `M${x - 15} 126 L${r.mx - 4} 104 M${x + 15} 126 L${r.mx - 4} 114`, SK('rope', 1.3));
      bulb(g, x, 292, 32, 24);
      concrete(g, x - 11, 252, 22, 18, false);
      ram(g, x, r.top - 1, 200, 11);
      skip(g, x - 26, 92);
      Ln(g, x - 26, 92, r.mx - 6, r.top + 2, SK('rope', 0.9));
      arrowP(g, `M${x - 20} 108 Q${x - 10} 108 ${x - 4} 120`, { w: 2.6 }); head(g, x - 4, 122, 70, { s: 7 });
      tag(g, x + 22, 316, 'hagyma', { to: [x + 16, 300] });
      tag(g, x - 40, 78, 'beton', { anchor: 'middle' });
    } },
    { w: 200, t: 'Vasalás', d: 'az armatúra a csőbe, a hagymáig', draw(g, M) {
      const x = 66, r = rig(g, M, x, { top: 16, lattice: true });
      casing(g, x, 124, 270, 11, { collar: true });
      bulb(g, x, 292, 32, 24);
      cage(g, x, 96, 286, 8.5);
      Ln(g, x, r.top - 1, x, 96, SK('rope', 1.1));
      arrowV(g, x - 28, 140, 186);
      tag(g, x - 18, 200, 'armatúra', { anchor: 'end', to: [x - 6, 200] });
    } },
    { w: 200, t: 'Törzs', d: 'döngölés, közben a cső visszahúzása', draw(g, M) {
      const x = 66, r = rig(g, M, x, { top: 16, lattice: true });
      bulb(g, x, 292, 32, 24);
      wavyShaft(g, x, 210, 276, 16);
      casing(g, x, 64, 212, 11, { collar: true });
      cage(g, x, 96, 286, 8.5);
      ram(g, x, r.top - 1, 172, 11);
      arrowV(g, x - 30, 150, 104);
    } },
    { w: 200, t: 'Kész', d: 'Ø ≈ 60 cm, legfeljebb 16–18 m', draw(g, M) {
      const x = 84;
      bulb(g, x, 292, 32, 24);
      wavyShaft(g, x, M.GY - 1, 276, 16);
      cage(g, x, M.GY - 16, 286, 8.5);
      worker(g, x + 34, { GY: M.GY, pose: 'stand' });
      tag(g, x + 26, 220, 'törzs', { to: [x + 14, 220] });
      tag(g, x + 42, 318, 'talp', { to: [x + 24, 300] });
    } },
  ],
};

/* ---------------- Csavart (talajkiszorításos fúrt) cölöp */
PROC.csavart = {
  H: 360, GY: 178, layers: [{ k: 'sand', y: 178, lab: 'laza homok' }, { k: 'sand2', y: 258, lab: 'közepesen tömör homok' }],
  steps: [
    { w: 240, t: 'Pontraállás', d: 'A gép a cölöp helye fölé áll; az üreges fúrószár végén a kiszorító fúrófej.', draw(g, M) {
      const x = 92, r = rig(g, M, x, { top: 16, headY: 26 });
      dispTool(g, x, r.headBot, M.GY, 15);
      tag(g, x - 24, M.GY - 26, 'fúrófej', { anchor: 'end', to: [x - 14, M.GY - 26] });
    } },
    { w: 240, t: 'Fúrás', d: 'Forgatással és tolással hajtják le: a fej oldalra tolja és tömöríti a talajt, nem hozza fel.', draw(g, M) {
      const x = 92, tip = 252, r = rig(g, M, x, { top: 16, headY: tip - 152 });
      dispTool(g, x, r.headBot, tip, 15);
      holeWall(g, x, M.GY, tip - 40, 7);
      pushOut(g, x, tip - 32, 17, 3);
      spin(g, x, r.headY + 36, 22);
      arrowV(g, x - 40, 196, 232);
    } },
    { w: 240, t: 'Megállás', d: 'Az előírt mélységben a fúrás leáll; a gép a fúrás adatait folyamatosan rögzíti.', draw(g, M) {
      const x = 92, tip = 302, r = rig(g, M, x, { top: 16, headY: tip - 152 });
      dispTool(g, x, r.headBot, tip, 15);
      holeWall(g, x, M.GY, tip - 40, 7);
      Ln(g, x + 22, tip + 2, 236, tip + 2, SK('labline', 1.2, 'stroke-dasharray:4 3'));
      tag(g, 232, tip + 18, 'előírt mélység', { anchor: 'end' });
    } },
    { w: 340, t: 'Betonozás', d: 'Nyomás alatt betonoznak a fúrószáron át, a szár kiemelése és forgatása közben.', draw(g, M) {
      const x = 206, tip = 244, r = rig(g, M, x, { top: 16, headY: tip - 152 });
      concrete(g, x - 15, tip - 4, 30, 306 - tip);
      holeWall(g, x, M.GY, 306, 15);
      R(g, x - 15, M.GY, 30, tip - 40 - M.GY, F('bore'));
      dispTool(g, x, r.headBot, tip, 15);
      mixer(g, M, 0, 1);
      const [px, py] = pump(g, M, 116);
      P(g, `M${px} ${py} C${px + 6} ${py - 60} ${x - 60} ${r.headY - 60} ${x - 1} ${r.headY - 8}`, SK('hose', 3.4, 'stroke-linecap:round'));
      arrowV(g, x - 38, 224, 186);
      spin(g, x, r.headY + 36, 22);
      tag(g, x + 24, 290, 'friss beton', { to: [x + 8, 282] });
    } },
    { w: 280, t: 'Vasalás', d: 'A vasalási armatúrát a friss betonba juttatják, szükség esetén vibrációval.', draw(g, M) {
      const x = 76;
      concrete(g, x - 15, M.GY, 30, 306 - M.GY);
      holeWall(g, x, M.GY, 306, 15);
      cage(g, x, 112, 262, 12);
      R(g, x - 11, 96, 22, 16, F('dark2') + `;stroke:${v('dark')};stroke-width:.8`, { rx: 2 });
      P(g, `M${x - 8} 92 l4 -5 l4 5 l4 -5 l4 5`, SK('acc', 1.8));
      crane(g, M, x, 90, { reach: 120, tipY: 20 });
      worker(g, x - 30, { GY: M.GY, pose: 'guide' });
      arrowV(g, x - 48, 136, 172);
      tag(g, x + 24, 212, 'armatúra', { to: [x + 10, 212] });
      tag(g, x + 24, 98, 'vibrátor', { to: [x + 11, 104] });
    } },
  ],
};

/* ---------------- Köpenycsöves (béléscsöves) fúrt cölöp */
PROC.kopeny = {
  H: 360, GY: 178, gw: 214, layers: [{ k: 'silt', y: 178, lab: 'iszapos, puha réteg' }, { k: 'gravel', y: 256, lab: 'homokos kavics' }],
  steps: [
    { w: 240, t: 'A cső lehajtása', d: 'A béléscsövet rotációval vagy vibrálással hajtják le.', draw(g, M) {
      const x = 92, bot = 238, r = rig(g, M, x, { top: 16, headY: 66 });
      R(g, x - 16, r.headBot, 32, M.GY - r.headBot, F('bore'));
      casing(g, x, r.headBot, bot, 16, { inner: false, teeth: true, collar: true });
      spin(g, x, r.headBot + 8, 30);
      arrowV(g, x - 44, 120, 168);
      tag(g, x + 26, 214, 'béléscső', { to: [x + 20, 214] });
    } },
    { w: 240, t: 'Földkiemelés', d: 'A cső védelmében dobfúróval emelik ki a talajt; a cső jár elöl, víz alatt pótolják a vizet.', draw(g, M) {
      const x = 92, r = rig(g, M, x, { top: 16, headY: 20 });
      spoil(g, M, x - 64, 34, 10, 'silt');
      casing(g, x, M.GY - 14, 304, 16, { teeth: true, collar: true });
      water(g, x - 16, M.gw, 32, 290 - M.gw);
      kelly(g, x, r.headBot, 252);
      drillBucket(g, x, 290, 14, { soil: 'gravel' });
      tag(g, x + 26, 228, 'víz a csőben', { to: [x + 10, 232] });
      tag(g, x + 26, 282, 'dobfúró', { to: [x + 14, 278] });
    } },
    { w: 240, t: 'Vasalás', d: 'A vasalási armatúrát a furatba, a cső belsejébe engedik.', draw(g, M) {
      const x = 70;
      casing(g, x, M.GY - 14, 304, 16, { teeth: true, collar: true });
      water(g, x - 16, M.gw, 32, 300 - M.gw);
      cage(g, x, 118, 298, 12);
      crane(g, M, x, 112, { reach: 110, tipY: 18 });
      worker(g, x - 32, { GY: M.GY, pose: 'guide' });
      tag(g, x + 26, 246, 'armatúra', { to: [x + 10, 246] });
    } },
    { w: 300, t: 'Betonozás', d: 'Betonozó csővel betonoznak, közben a béléscsövet folyamatosan visszahúzzák.', draw(g, M) {
      const x = 176, ctop = M.GY - 46, cbot = 262;
      concrete(g, x - 16, 244, 32, 60);
      R(g, x - 16, ctop, 32, M.GY - ctop, F('bore'));
      casing(g, x, ctop, cbot, 16, { teeth: true, collar: true });
      water(g, x - 16, M.gw, 32, 244 - M.gw);
      concrete(g, x - 16, 244, 32, 18);
      cage(g, x, M.GY - 30, 298, 12);
      // csőmozgató (oszcillátor) a terepen, a csövet fogja és húzza
      R(g, x - 34, M.GY - 22, 68, 22, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 3 });
      R(g, x - 34, M.GY - 22, 68, 6, F('mach2'), { rx: 2 });
      [x - 28, x + 22].forEach((cx) => R(g, cx, M.GY - 42, 6, 20, 'fill:url(#pr-cyl)'));
      const pu = plant(g, M, 262, { w: 34, h: 22, col: 'mach' });
      hoseTo(g, x + 34, M.GY - 12, 262, M.GY - 12, 8);
      // betonozó állvány a cső tetején, rajta a tölcsér
      P(g, `M${x - 26} ${ctop - 2} L${x - 16} ${ctop - 26} H${x + 16} L${x + 26} ${ctop - 2}`, SK('steel3', 2));
      tremie(g, x, ctop - 44, 286, { full: true });
      mixer(g, M, 8, 1);
      P(g, `M${126} ${M.GY - 34} L${x - 16} ${ctop - 40}`, SK('steel3', 3.4, 'stroke-linecap:round'));
      arrowV(g, x - 46, M.GY - 30, M.GY - 64); arrowV(g, x + 46, M.GY - 30, M.GY - 64);
      tag(g, x + 26, 320, 'friss beton', { to: [x + 8, 290] });
      tag(g, x + 44, M.GY - 86, 'csőmozgató', { to: [x + 30, M.GY - 18] });
      worker(g, x + 58, { GY: M.GY, pose: 'stand' });
    } },
    { w: 230, t: 'Kész cölöp', d: 'A visszanyert cső helyén kész vasbeton cölöp marad.', draw(g, M) {
      const x = 86;
      concrete(g, x - 16, M.GY, 32, 304 - M.GY, false);
      cage(g, x, M.GY - 16, 298, 12);
      worker(g, x + 40, { GY: M.GY, pose: 'stand' });
      tag(g, x + 26, 230, 'vb. cölöp', { to: [x + 16, 230] });
    } },
  ],
};

/* ---------------- Bentonitzagyos (zagymegtámasztásos) fúrt cölöp */
PROC.zagy = {
  H: 360, GY: 178, gw: 196, layers: [{ k: 'fill', y: 178, lab: 'feltöltés' }, { k: 'sand', y: 206, lab: 'homok' }, { k: 'hard', y: 284, lab: 'kemény agyag' }],
  steps: [
    { w: 230, t: 'Előkészítés', d: 'pontraállás, előfúrás, vezetőcső', draw(g, M) {
      const x = 90, r = rig(g, M, x, { top: 16, headY: 24 });
      casing(g, x, M.GY - 10, M.GY + 34, 18, { joints: false, collar: true });
      kelly(g, x, r.headBot, M.GY - 6);
      auger(g, x, M.GY - 6, M.GY + 30, 16, { pitch: 12, soilFrom: M.GY - 6, soil: 'fill', pat: 'pr-p-fill' });
      tag(g, x + 28, M.GY + 26, 'vezetőcső', { to: [x + 20, M.GY + 22] });
    } },
    { w: 260, t: 'Zagy betöltése', d: 'bentonitos fúrófolyadék a furatba', draw(g, M) {
      const x = 186;
      casing(g, x, M.GY - 10, M.GY + 34, 18, { joints: false, collar: true });
      slurry(g, x - 18, M.GY - 4, 36, 52);
      silo(g, M, 26, { band: 'bento' });
      const pl = plant(g, M, 46);
      hoseTo(g, pl.out[0], pl.out[1], x - 14, M.GY - 12, 14, 'slurry2');
      arrowV(g, x - 8, M.GY - 30, M.GY + 4, { c: 'slurry2' });
      tag(g, 94, M.GY - 64, 'bentonitkeverő', { anchor: 'middle' });
      tag(g, x + 26, M.GY + 22, 'zagy', { to: [x + 12, M.GY + 22] });
    } },
    { w: 230, t: 'Talajkiemelés', d: 'spirállal vagy dobfúróval, zagy alatt', draw(g, M) {
      const x = 90, r = rig(g, M, x, { top: 16, headY: 22 });
      spoil(g, M, x - 64, 32, 10, 'sand');
      casing(g, x, M.GY - 10, M.GY + 34, 18, { joints: false, collar: true });
      slurry(g, x - 16, M.GY + 2, 32, 300 - M.GY);
      holeWall(g, x, M.GY + 34, 300, 16);
      kelly(g, x, r.headBot, 262);
      drillBucket(g, x, 300, 14, { soil: 'sand' });
      spin(g, x, r.headBot + 14, 18);
      tag(g, x + 28, M.GY + 24, 'zagyszint', { to: [x + 12, M.GY + 3] });
    } },
    { w: 240, t: 'Kontraktorcső', d: 'talptisztítás, armatúra, a betonozás indul', draw(g, M) {
      const x = 74;
      casing(g, x, M.GY - 10, M.GY + 34, 18, { joints: false, collar: true });
      slurry(g, x - 16, M.GY + 2, 32, 282 - M.GY);
      concrete(g, x - 16, 282, 32, 18);
      holeWall(g, x, M.GY + 34, 300, 16);
      cage(g, x, M.GY - 22, 298, 12);
      tremie(g, x, 86, 290, { full: true });
      crane(g, M, x, 80, { reach: 104, tipY: 18 });
      tag(g, x + 26, 236, 'kontraktorcső', { to: [x + 4, 236] });
    } },
    { w: 300, t: 'Betonozás', d: 'alulról a terepszintig, a zagy kiszorul', draw(g, M) {
      const x = 176;
      casing(g, x, M.GY - 10, M.GY + 34, 18, { joints: false, collar: true });
      concrete(g, x - 16, M.GY + 14, 32, 300 - M.GY - 14);
      slurry(g, x - 16, M.GY + 2, 32, 12);
      holeWall(g, x, M.GY + 34, 300, 16);
      cage(g, x, M.GY - 22, 298, 12);
      tremie(g, x, 92, 240, { full: true });
      mixer(g, M, 196, -1);
      P(g, `M${196 + 2} ${M.GY - 36} L${x + 15} 96`, SK('steel3', 3.4, 'stroke-linecap:round'));
      silo(g, M, 22, { band: 'bento' });
      const pl = plant(g, M, 42);
      hoseTo(g, x - 20, M.GY - 6, pl.out[0], pl.out[1], 16, 'slurry2');
      arrowH(g, x - 30, x - 66, M.GY - 30, { c: 'slurry2', w: 2.4 });
      tag(g, x - 48, M.GY - 46, 'zagy ki', { anchor: 'middle' });
    } },
    { w: 250, t: 'Vezetőcső ki', d: 'a vezetőcső eltávolítása, kész a cölöp', draw(g, M) {
      const x = 66;
      concrete(g, x - 16, M.GY, 32, 300 - M.GY, false);
      cage(g, x, M.GY - 16, 298, 12);
      casing(g, x, M.GY - 64, M.GY - 22, 18, { joints: false, collar: true });
      P(g, `M${x - 18} ${M.GY - 62} L${x} ${M.GY - 86} L${x + 18} ${M.GY - 62}`, SK('rope', 1.1));
      crane(g, M, x, M.GY - 86, { reach: 100, tipY: 18 });
      arrowV(g, x - 34, M.GY - 26, M.GY - 62); arrowV(g, x + 34, M.GY - 26, M.GY - 62);
    } },
  ],
};

/* ---------------- Megtámasztás nélküli fúrt cölöp */
PROC.nelkul = {
  H: 360, GY: 178, layers: [{ k: 'clay', y: 178, lab: 'kötött talaj (agyag)', ly: 330 }],
  steps: [
    { w: 240, t: 'Fúrás', d: 'Rövid spirállal (vagy markolóval) kötött talajban, talajvíz felett: a furat fala megtámasztás nélkül áll.', draw(g, M) {
      const x = 86, r = rig(g, M, x, { top: 16, headY: 22 });
      spoil(g, M, x - 66, 34, 10, 'clay');
      R(g, x - 17, M.GY, 34, 290 - M.GY, F('bore'));
      holeWall(g, x, M.GY, 290, 17);
      kelly(g, x, r.headBot, 252);
      auger(g, x, 252, 288, 15, { pitch: 12, soilFrom: 252, soil: 'clay' });
      tag(g, x + 28, 214, 'a fal megáll', { to: [x + 17, 214] });
    } },
    { w: 240, t: 'Betonozás', d: 'A kiemelés után rögtön betonoznak, tölcsérrel, gravitációsan.', draw(g, M) {
      const x = 70;
      R(g, x - 17, M.GY, 34, 290 - M.GY, F('bore'));
      concrete(g, x - 17, 226, 34, 64);
      holeWall(g, x, M.GY, 290, 17);
      tremie(g, x, M.GY - 40, 210, { full: true });
      mixer(g, M, 98, -1);
      P(g, `M${100} ${M.GY - 36} L${x + 15} ${M.GY - 38}`, SK('steel3', 3.4, 'stroke-linecap:round'));
      tag(g, x + 28, 262, 'beton', { to: [x + 12, 262] });
    } },
  ],
};

/* ---------------- Előregyártott vert cölöp */
PROC.elore = {
  H: 360, GY: 178, layers: [{ k: 'silt', y: 178, lab: 'puha réteg' }, { k: 'gravel', y: 246, lab: 'teherbíró réteg' }],
  steps: [
    { w: 250, t: 'Beemelés', d: 'A gép a cölöpöt a vezetőtoronyba emeli, és a kitűzött pont fölé állítja.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 14, hoses: false });
      const ph = hammer(g, x, 22, 10);
      precast(g, x, ph + 2, M.GY, 8);
      for (let i = 0; i < 3; i++) R(g, 4, M.GY - 8 - i * 7, 50, 6.5, 'fill:url(#pr-pile)' + `;stroke:${v('conc2')};stroke-width:.6`);
      R(g, 8, M.GY - 2, 4, 2, F('timber')); R(g, 46, M.GY - 2, 4, 2, F('timber'));
      worker(g, x - 26, { GY: M.GY, pose: 'signal' });
      tag(g, x - 22, 58, 'kos', { anchor: 'end', to: [x - 13, 52] });
      tag(g, 29, M.GY - 40, 'cölöpök', { anchor: 'middle' });
    } },
    { w: 250, t: 'Verés', d: 'A hidraulikus kos a cölöpsapkán át üti le a cölöpöt; a vezetőtorony függőlegesen tartja.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 14, hoses: false });
      const ph = hammer(g, x, 70, 10);
      precast(g, x, ph + 2, 230, 8);
      pushOut(g, x, 214, 10, 2);
      arrowV(g, x - 34, 150, 196);
      P(g, `M${x - 16} ${ph - 4} l-6 -3 M${x + 16} ${ph - 4} l6 -3 M${x - 16} ${ph + 2} l-7 1 M${x + 16} ${ph + 2} l7 1`, SK('acc', 1.6, 'stroke-linecap:round'));
    } },
    { w: 250, t: 'Beállás', d: 'Az előírt mélység közelében a cölöp „beáll”: ütésenként már csak alig hatol tovább.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 14, hoses: false });
      const ph = hammer(g, x, 112, 10);
      precast(g, x, ph + 2, 272, 8);
      Ln(g, x + 18, 272, 244, 272, SK('labline', 1.2, 'stroke-dasharray:4 3'));
      tag(g, 240, 290, 'előírt mélység', { anchor: 'end' });
    } },
    { w: 260, t: 'Fejezés', d: 'A tervezett szint fölötti részt visszabontják; a kilógó betonacélt a fejtömbbe kötik.', draw(g, M) {
      const x = 70;
      precast(g, x, M.GY - 4, 272, 8, { rebar: 16 });
      for (let i = 0; i < 4; i++) P(g, `M${x - 30 + i * 13} ${M.GY} l4 -5 l6 1 l2 4z`, F('conc1') + `;stroke:${v('conc2')};stroke-width:.6`);
      excavator(g, M, x, M.GY - 18, { reach: 76, tool: 'breaker', lift: 40 });
      Ln(g, x - 26, M.GY - 4, x + 26, M.GY - 4, SK('labline', 1.2, 'stroke-dasharray:4 3'));
      tag(g, x + 24, M.GY + 22, 'levágási szint', { to: [x + 20, M.GY - 4] });
    } },
  ],
};

/* ---------------- Talajcsavar */
PROC.csavar = {
  H: 330, GY: 200, layers: [{ k: 'fill', y: 200, lab: 'humuszos feltöltés' }, { k: 'clay', y: 226, lab: EN ? 'clay' : 'agyag' }],
  steps: [
    { w: 220, t: 'Kitűzés', d: 'Kitűzik a csavarok helyét, és a csavart függőlegesen a pontra állítják.', draw(g, M) {
      const x = 92;
      screwPile(g, x, M.GY - 74, M.GY, { plate: true });
      worker(g, x - 14, { GY: M.GY, pose: 'guide', dir: 1, s: 1.1 });
      R(g, 150, M.GY - 16, 3, 16, F('timber')); R(g, 186, M.GY - 16, 3, 16, F('timber'));
      Ln(g, 151, M.GY - 13, 188, M.GY - 13, SK('acc', 1));
      tag(g, x + 22, M.GY - 60, 'talajcsavar', { to: [x + 6, M.GY - 60] });
    } },
    { w: 260, t: 'Behajtás', d: 'Kotróra szerelt forgatófejjel (kisebbet kézzel, átdugott rúddal) a talajba csavarják.', draw(g, M) {
      const x = 74;
      excavator(g, M, x, M.GY - 40, { reach: 80, tool: 'rotary', lift: 30 });
      screwPile(g, x, M.GY - 40, M.GY + 34);
      spin(g, x, M.GY - 30, 16);
      arrowV(g, x - 30, M.GY - 34, M.GY - 2);
      worker(g, x - 44, { GY: M.GY, pose: 'signal' });
    } },
    { w: 220, t: 'Ellenőrzés', d: 'Behajtás közben vízmértékkel ellenőrzik a függőlegességet; a fej a tervezett szintre kerül.', draw(g, M) {
      const x = 96;
      screwPile(g, x, M.GY - 8, M.GY + 66, { plate: true });
      R(g, x + 5, M.GY - 34, 4, 26, F('acc2'), { rx: 1 });
      R(g, x + 5.6, M.GY - 24, 2.8, 5, F('lamp'));
      worker(g, x + 24, { GY: M.GY, pose: 'guide' });
      tag(g, x - 18, M.GY - 40, 'vízmérték', { anchor: 'end', to: [x + 5, M.GY - 28] });
    } },
    { w: 260, t: 'Felépítmény', d: 'A fejlemezre csavarozzák a talpgerendát vagy a tartószerkezetet – azonnal terhelhető.', draw(g, M) {
      [60, 190].forEach((x) => screwPile(g, x, M.GY - 6, M.GY + 66, { plate: true }));
      R(g, 44, M.GY - 16, 162, 9, F('timber') + `;stroke:${v('timber2')};stroke-width:.8`);
      house(g, 54, M.GY - 16, 142);
      tag(g, 125, M.GY + 28, 'talpgerenda', { anchor: 'middle', to: [125, M.GY - 10] });
    } },
  ],
};

/* ---------------- Merevbetétes, injektálásos mikrocölöp */
PROC.mikro = {
  H: 360, GY: 178, layers: [{ k: 'fill', y: 178, lab: 'feltöltés' }, { k: 'clay', y: 204, lab: EN ? 'clay' : 'agyag' }, { k: 'gravel', y: 270, lab: 'homokos kavics' }],
  steps: [
    { w: 230, t: 'Pontraállás', d: 'A kis fúrógép a helyére áll; szükség szerint ferdén, akár pincében is dolgozik.', draw(g, M) {
      const x = 110, r = smallRig(g, M, x, { top: 56, headY: 64 });
      R(g, x - 2.6, r.headBot, 5.2, M.GY - 4 - r.headBot, 'fill:url(#pr-cyl)');
      P(g, `M${x - 6} ${M.GY - 4} h12 l-6 6z`, F('dark2'));
      tag(g, x - 18, M.GY - 40, 'üreges acélrúd', { anchor: 'end', to: [x - 3, M.GY - 40] });
    } },
    { w: 270, t: 'Fúrás öblítéssel', d: 'Az elvesző fúrófejes, üreges rudat forgatva hajtják le, közben híg cementtejjel öblítenek.', draw(g, M) {
      const x = 150, r = smallRig(g, M, x, { top: 56, headY: 130 });
      silo(g, M, 22, { w: 20, h: 86 });
      const pl = plant(g, M, 36, { w: 44, h: 24 });
      hoseTo(g, pl.out[0], pl.out[1], x - 6, r.headY + 4, 10);
      R(g, x - 6, M.GY, 12, 252 - M.GY, F('grout1', 0.7));
      R(g, x - 2.6, r.headBot, 5.2, 252 - r.headBot, 'fill:url(#pr-cyl)');
      P(g, `M${x - 7} 252 h14 l-7 7z`, F('dark2'));
      E(g, x, M.GY + 1, 16, 3, F('grout1', 0.9));
      spin(g, x, r.headBot + 8, 14);
      arrowV(g, x - 26, 196, 232);
      tag(g, x + 18, 240, 'elvesző fúrófej', { to: [x + 6, 252] });
      tag(g, x - 14, M.GY - 46, 'cementtej', { anchor: 'end', to: [x - 8, r.headY + 6] });
    } },
    { w: 270, t: 'Injektálás', d: 'A végső mélységben sűrűbb cementtejet injektálnak: a rúd körül cementtest, azon kívül cementtel átitatott talajköpeny alakul ki.', draw(g, M) {
      const x = 150, r = smallRig(g, M, x, { top: 56, headY: 166 });
      silo(g, M, 22, { w: 20, h: 86 });
      const pl = plant(g, M, 36, { w: 44, h: 24 });
      hoseTo(g, pl.out[0], pl.out[1], x - 6, r.headY + 4, 10);
      P(g, `M${x - 12} ${M.GY + 4} Q${x - 15} 250 ${x - 11} 296 L${x + 11} 296 Q${x + 15} 250 ${x + 12} ${M.GY + 4}Z`, F('grout2', 0.55));
      R(g, x - 7, M.GY, 14, 294 - M.GY, 'fill:url(#pr-groutg)', { rx: 3 });
      R(g, x - 2.6, r.headBot, 5.2, 294 - r.headBot, 'fill:url(#pr-cyl)');
      P(g, `M${x - 7} 294 h14 l-7 7z`, F('dark2'));
      tag(g, x + 22, 236, 'cementtest', { to: [x + 6, 236] });
      tag(g, x + 22, 266, 'átitatott talaj', { to: [x + 12, 262] });
    } },
    { w: 230, t: 'Fejlemez', d: 'A rúdfejre fejlemezt és anyákat szerelnek, és a vasbeton fejtömb vagy lemez vasalásába kötik.', draw(g, M) {
      const x = 96;
      P(g, `M${x - 12} ${M.GY + 4} Q${x - 15} 250 ${x - 11} 296 L${x + 11} 296 Q${x + 15} 250 ${x + 12} ${M.GY + 4}Z`, F('grout2', 0.55));
      R(g, x - 7, M.GY, 14, 294 - M.GY, 'fill:url(#pr-groutg)', { rx: 3 });
      R(g, x - 2.6, M.GY - 26, 5.2, 320 - M.GY, 'fill:url(#pr-cyl)');
      R(g, 22, M.GY - 34, 190, 34, 'fill:url(#pr-concg)' + `;stroke:${v('conc2')};stroke-width:.8`);
      R(g, 22, M.GY - 34, 190, 34, 'fill:url(#pr-p-conc)', { opacity: 0.6 });
      for (let xx = 30; xx < 210; xx += 14) { C(g, xx, M.GY - 28, 1.8, F('rebar')); C(g, xx, M.GY - 6, 1.8, F('rebar')); }
      R(g, x - 13, M.GY - 16, 26, 4, F('steel3'));
      R(g, x - 5, M.GY - 21, 10, 5, F('dark2'));
      tag(g, x + 24, M.GY - 52, 'fejlemez és anyák', { to: [x + 10, M.GY - 16] });
    } },
  ],
};

/* ---------------- Jet-grouting */
PROC.jet = {
  H: 360, GY: 178, gw: 214, layers: [{ k: 'sand', y: 178, lab: 'homok' }, { k: 'clay2', y: 264, lab: EN ? 'clay' : 'agyag' }],
  steps: [
    { w: 230, t: 'Fúrás', d: '100–200 mm-es furat a tervezett mélységig, fúrófolyadékkal.', draw(g, M) {
      const x = 84, r = smallRig(g, M, x, { top: 36, headY: 120 });
      R(g, x - 5, M.GY, 10, 296 - M.GY, F('water', 0.3));
      jetTool(g, x, r.headBot, 288);
      spin(g, x, r.headBot + 8, 14);
      arrowV(g, x - 28, 196, 232);
      tag(g, x + 20, 250, 'fúrófolyadék', { to: [x + 5, 250] });
    } },
    { w: 260, t: 'Injektálás a talptól', d: 'A monitor fúvókáin át 400–600 bar nyomású sugár vágja és keveri a talajt.', draw(g, M) {
      const x = 150, r = smallRig(g, M, x, { top: 36, headY: 132 });
      silo(g, M, 22, { w: 20, h: 86 });
      const pl = plant(g, M, 36, { w: 44, h: 24 });
      hoseTo(g, pl.out[0], pl.out[1], x - 6, r.headY + 4, 10);
      column(g, x, 282, 306, 26, 'jet');
      jetTool(g, x, r.headBot, 294, { jet: 34 });
      tag(g, x + 22, 252, '400–600 bar', { to: [x + 18, 292] });
      tag(g, 74, M.GY - 108, 'nagynyomású szivattyú', { anchor: 'middle', to: [58, M.GY - 26] });
    } },
    { w: 260, t: 'Forgatás, visszahúzás', d: 'Az oszlop alulról felfelé nő; a többletanyag iszapként a furat mentén a felszínre jut.', draw(g, M) {
      const x = 150, r = smallRig(g, M, x, { top: 36, headY: 74 });
      silo(g, M, 22, { w: 20, h: 86 });
      const pl = plant(g, M, 36, { w: 44, h: 24 });
      hoseTo(g, pl.out[0], pl.out[1], x - 6, r.headY + 4, 10);
      column(g, x, 230, 306, 26, 'jet');
      R(g, x - 4, M.GY, 8, 230 - M.GY, F('grout2', 0.8));
      jetTool(g, x, r.headBot, 236, { jet: 34 });
      E(g, x + 22, M.GY + 1, 22, 3.4, F('grout2', 0.9));
      spin(g, x, r.headBot + 8, 14);
      arrowV(g, x - 40, 214, 178);
      tag(g, x + 30, M.GY - 16, 'visszafolyó iszap', { to: [x + 22, M.GY] });
    } },
    { w: 250, t: 'A következő oszlop', d: 'Az előzőbe metszve készül – így egymásba metsző oszlopokból folytonos fal lesz.', draw(g, M) {
      const x = 110, r = smallRig(g, M, x, { top: 36, headY: 74 });
      column(g, 66, M.GY + 8, 306, 26, 'jet');
      column(g, x, 232, 306, 26, 'jet');
      jetTool(g, x, r.headBot, 238, { jet: 30 });
      R(g, x - 4, M.GY, 8, 232 - M.GY, F('grout2', 0.8));
      tag(g, 22, M.GY + 40, 'kész oszlop', { to: [56, M.GY + 40] });
    } },
  ],
};

/* ---------------- Mélykeverés */
PROC.dsm = {
  H: 360, GY: 178, layers: [{ k: 'clay', y: 178, lab: 'puha agyag' }, { k: 'sand', y: 272, lab: 'homok' }],
  steps: [
    { w: 260, t: 'Lehajtás forgatva', d: 'A lapátos keverőszár forogva hatol le; a kötőanyagot a szár végén juttatják ki.', draw(g, M) {
      const x = 120, r = rig(g, M, x, { top: 16, headY: 96 });
      silo(g, M, 22, { w: 20, h: 86 });
      const pl = plant(g, M, 36, { w: 44, h: 24 });
      hoseTo(g, pl.out[0], pl.out[1], x - 14, r.headY + 6, 16);
      column(g, x, M.GY, 246, 19, 'mix');
      mixTool(g, x, r.headBot, 248, 19);
      spin(g, x, r.headBot + 12, 22);
      arrowV(g, x - 40, 200, 236);
      tag(g, x + 26, 226, 'keverőlapátok', { to: [x + 16, 236] });
    } },
    { w: 240, t: 'Visszahúzás keverve', d: 'A tervezett mélységből visszahúzás közben még egyszer átkeveri a talajt.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 16, headY: 70 });
      column(g, x, M.GY, 304, 19, 'mix');
      mixTool(g, x, r.headBot, 222, 19);
      spin(g, x, r.headBot + 12, 22);
      arrowV(g, x - 40, 236, 196);
    } },
    { w: 230, t: 'A kész oszlop', d: 'Helyben kevert talaj–kötőanyag elem; mérete közel a keverőszerszáméval egyezik.', draw(g, M) {
      const x = 90;
      column(g, x, M.GY, 304, 19, 'mix');
      worker(g, x + 38, { GY: M.GY, pose: 'stand' });
      tag(g, x + 28, 250, 'kevert oszlop', { to: [x + 19, 250] });
    } },
    { w: 260, t: 'Metszve: tömb, fal', d: 'Egymásba metsző oszlopokból tömb, rács vagy fal készül.', draw(g, M) {
      [70, 102, 134, 166].forEach((x) => column(g, x, M.GY, 304, 19, 'mix'));
      [86, 118, 150].forEach((x) => Ln(g, x, M.GY + 4, x, 300, SK('mix1', 1, 'opacity:.7')));
      const pg = g_(g, {});
      R(pg, 62, 54, 150, 52, F('labbg') + `;stroke:${v('labedge')};stroke-width:.8`, { rx: 8 });
      [92, 116, 140, 164, 188].forEach((cx) => C(pg, cx, 84, 14, 'fill:url(#pr-mixg)' + `;stroke:${v('mix1')};stroke-width:1`));
      el('text', { x: 137, y: 67, 'text-anchor': 'middle', class: 'pr-tx', style: 'font-size:9.5px', text: 'alaprajz' }, pg);
    } },
  ],
};

/* ---------------- Vibrált kőoszlop (alsó anyagadagolású mélyvibrátor) */
PROC.ko = {
  H: 360, GY: 178, layers: [{ k: 'silt', y: 178, lab: 'iszap' }, { k: 'peat', y: 222, lab: 'puha, szerves réteg' }, { k: 'sand', y: 262, lab: 'homok' }],
  steps: [
    { w: 270, t: 'Lehajtás', d: 'A rezgő mélyvibrátor oldalra szorítja a talajt, és (sűrített levegővel segítve) a tervezett mélységig hatol.', draw(g, M) {
      const x = 112, r = rig(g, M, x, { top: 16, hoses: false });
      vibroflot(g, x, 150, 298, { full: true });
      P(g, `M${x - 40} ${M.GY - 22} L${x - 36} ${M.GY} H${x - 14} L${x - 10} ${M.GY - 22}Z`, F('steel2') + `;stroke:${v('steel3')};stroke-width:.8`);
      P(g, `M${x - 39} ${M.GY - 21} Q${x - 25} ${M.GY - 30} ${x - 11} ${M.GY - 21}Z`, F('stone') + `;stroke:${v('stone2')};stroke-width:.6`);
      Ln(g, x - 25, M.GY - 26, r.mx - 6, r.top + 2, SK('rope', 0.9));
      loader(g, M, 2, { lift: 22, full: true });
      pushOut(g, x, 270, 10, 3);
      arrowV(g, x + 34, 214, 250);
      tag(g, x + 30, 306, 'mélyvibrátor', { to: [x + 7, 286] });
      tag(g, x - 25, M.GY - 78, EN ? 'gravel' : 'kavics', { anchor: 'middle', to: [x - 25, M.GY - 26] });
    } },
    { w: 250, t: 'Tömörítés', d: 'Kissé visszahúzzák; a kavics a csúcson át kitölti az üreget, a szár újbóli lenyomása tömöríti és oldalra préseli.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 16, hoses: false });
      stoneCol(g, x, 266, 302, 14);
      vibroflot(g, x, 124, 272, { full: true });
      arrowV(g, x - 32, 252, 222); arrowV(g, x + 30, 222, 252);
      pushOut(g, x, 284, 16, 2);
      tag(g, x + 24, 318, 'tömörített kavics', { to: [x + 10, 296] });
    } },
    { w: 250, t: 'Kiegyenlítés', d: 'Szakaszonként a felszínig építik, végül a felszínt tömörítik, elegyengetik.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 16, hoses: false });
      stoneCol(g, x, M.GY + 4, 302, 14, { bulge: [222, 262] });
      vibroflot(g, x, 34, M.GY - 2, { full: false });
      R(g, 0, M.GY - 6, 250, 6, F('gravel')); R(g, 0, M.GY - 6, 250, 6, 'fill:url(#pr-p-gravel)');
      arrowV(g, x - 32, 156, 118);
      tag(g, x + 24, 214, 'kőoszlop', { to: [x + 14, 214] });
    } },
    { w: 250, t: 'Kész oszlopok', d: 'Bordás kőoszlopok raszterben – a gyengébb (puhább) rétegben vastagabbak.', draw(g, M) {
      [54, 125, 196].forEach((x) => stoneCol(g, x, M.GY + 2, 302, 13, { bulge: [222, 262] }));
      R(g, 0, M.GY - 6, 250, 6, F('gravel')); R(g, 0, M.GY - 6, 250, 6, 'fill:url(#pr-p-gravel)');
      worker(g, 150, { GY: M.GY - 6, pose: 'stand' });
      tag(g, 125, 330, 'vastagabb a puha rétegben', { anchor: 'middle', to: [125, 262] });
    } },
  ],
};

/* ---------------- Résfal: szakaszos réselés (hosszmetszet) */
const RF = { P1: [22, 98], S1: [98, 134], P2: [134, 210] };
function rfBase(g, M, n) {
  // résvezető gerenda a rés két oldalán (a metszet mögött)
  R(g, 14, M.GY - 3, n >= 1 ? 206 : 0, 14, 'fill:url(#pr-concg)' + `;stroke:${v('conc2')};stroke-width:.7`);
}
function rfPanel(g, M, k, kind, o = {}) {
  const [a, b] = RF[k], bot = 318, top = M.GY + 11;
  if (kind === 'slurry') slurry(g, a, top, b - a, bot - top);
  else if (kind === 'conc') concrete(g, a, M.GY + 2, b - a, bot - M.GY - 2, o.fresh ?? false);
  Ln(g, a, top, a, bot, SK('wall', 1)); Ln(g, b, top, b, bot, SK('wall', 1)); Ln(g, a, bot, b, bot, SK('wall', 1));
  if (o.lab) el('text', { x: (a + b) / 2, y: bot - 8, 'text-anchor': 'middle', class: 'pr-tx pr-big', text: o.lab }, g);
}
PROC.resfal = {
  H: 360, GY: 178, gw: 216, layers: [{ k: 'fill', y: 178, lab: 'feltöltés' }, { k: 'sand', y: 200, lab: 'homok' }, { k: 'clay2', y: 272, lab: EN ? 'clay' : 'agyag' }],
  steps: [
    { w: 240, t: 'Résvezető gerenda', d: 'A rés két oldalán vasbeton gerendapár készül: ez jelöli ki és vezeti a rést.', draw(g, M) {
      R(g, 14, M.GY - 3, 110, 14, 'fill:url(#pr-concg)' + `;stroke:${v('conc2')};stroke-width:.7`);
      R(g, 124, M.GY, 70, 12, F('bore'));
      spoil(g, M, 196, 30, 8, 'fill');
      excavator(g, M, 150, M.GY + 6, { reach: 56, lift: 46 });
      tag(g, 68, M.GY - 30, 'résvezető gerenda', { anchor: 'middle', to: [68, M.GY - 2] });
    } },
    { w: 240, t: 'Primer harapások', d: 'A primer tábla két szélét kiharapják; a kiemelt föld helyét azonnal zagy tölti ki.', draw(g, M) {
      rfBase(g, M, 1);
      slurry(g, 22, M.GY + 11, 30, 318 - M.GY - 11); slurry(g, 68, M.GY + 11, 30, 318 - M.GY - 11);
      [22, 52, 68, 98].forEach((xx) => Ln(g, xx, M.GY + 11, xx, 318, SK('wall', 1)));
      const gr = grab(g, 83, 300, 14, 0.5);
      crane(g, M, 83, gr.top - 4, { reach: 104, tipY: 18 });
      el('text', { x: 60, y: 310, 'text-anchor': 'middle', class: 'pr-tx pr-big', text: 'P' }, g);
    } },
    { w: 240, t: 'A tábla közepe', d: 'A középső harapás után a primer tábla teljes hosszában nyitva áll – zagy alatt.', draw(g, M) {
      rfBase(g, M, 1);
      rfPanel(g, M, 'P1', 'slurry', { lab: 'P' });
      const gr = grab(g, 60, 276, 14, 0.2);
      crane(g, M, 60, gr.top - 4, { reach: 110, tipY: 18 });
      tag(g, 140, 246, 'zagy', { to: [92, 246] });
    } },
    { w: 240, t: 'Vasalás, betonozás', d: 'Beemelik a vasalási armatúrát (hossztól függően 1–3 db), majd két kontraktorcsővel alulról betonoznak.', draw(g, M) {
      rfBase(g, M, 1);
      rfPanel(g, M, 'P1', 'slurry');
      concrete(g, 22, 250, 76, 68);
      for (let xx = 30; xx < 92; xx += 9) Ln(g, xx, M.GY - 10, xx, 314, SK('rebar', 1));
      for (let yy = M.GY; yy < 314; yy += 12) Ln(g, 28, yy, 92, yy, SK('rebar2', 0.9));
      tremie(g, 42, 96, 300, { full: true }); tremie(g, 78, 96, 300, { full: true });
      mixer(g, M, 132, 1);
      P(g, `M${134} ${M.GY - 34} L${95} ${97}`, SK('steel3', 3.4, 'stroke-linecap:round'));
      el('text', { x: 60, y: 238, 'text-anchor': 'middle', class: 'pr-tx pr-big', text: 'P' }, g);
      tag(g, 124, 286, 'friss beton', { to: [98, 286] });
    } },
    { w: 240, t: 'Közbenső tábla', d: 'Két kész primer tábla között kiharapják a közbenső (szekunder) táblát.', draw(g, M) {
      rfBase(g, M, 1);
      rfPanel(g, M, 'P1', 'conc', { lab: 'P' }); rfPanel(g, M, 'P2', 'conc', { lab: 'P' }); rfPanel(g, M, 'S1', 'slurry', { lab: 'S' });
      const gr = grab(g, 116, 290, 15, 0.3);
      crane(g, M, 116, gr.top - 4, { reach: 84, tipY: 18 });
    } },
    { w: 240, t: 'Vasalás, betonozás', d: 'A közbenső tábla vasalása és betonozása után a táblák összefüggő falat alkotnak.', draw(g, M) {
      rfBase(g, M, 1);
      rfPanel(g, M, 'P1', 'conc', { lab: 'P' }); rfPanel(g, M, 'P2', 'conc', { lab: 'P' }); rfPanel(g, M, 'S1', 'conc', { lab: 'S', fresh: true });
      worker(g, 160, { GY: M.GY - 3, pose: 'stand' });
    } },
  ],
};


/* ---------------- Kútalap süllyesztése */
function well(g, cx, top, bot, half, o = {}) {
  // vasbeton kútköpeny metszetben, alul befelé ferde vágóéllel; o.fresh: a felső, frissen betonozott szakasz alsó széle
  const t = 11, w = g_(g, { class: 'pr-well' });
  for (const k of [-1, 1]) {
    const xo = cx + k * (half + t), xi = cx + k * half;
    const d = `M${xi} ${top} L${xo} ${top} L${xo} ${bot} L${xi + k * 1} ${bot - 18} L${xi} ${bot - 18} Z`;
    P(w, d, 'fill:url(#pr-concg)'); P(w, d, 'fill:url(#pr-p-conc)'); P(w, d, SK('conc2', 0.8));
    P(w, `M${xo} ${bot} L${xo - k * 3} ${bot - 4}`, SK('steel3', 2));
    if (o.fresh) R(w, Math.min(xo, xi), top, t, o.fresh - top, F('fresh2', 0.55));
    if (o.joint) Ln(w, Math.min(xo, xi), o.joint, Math.max(xo, xi), o.joint, SK('conc2', 1.4));
  }
  return w;
}
PROC.kut = {
  H: 360, GY: 178, gw: 214, layers: [{ k: 'fill', y: 178, lab: 'feltöltés' }, { k: 'sand', y: 206, lab: 'homok' }, { k: 'gravel', y: 284, lab: 'teherbíró kavics' }],
  steps: [
    { w: 250, t: 'Első szakasz', d: 'A terepen megépítik a vágóélt és a köpeny első szakaszát.', draw(g, M) {
      const x = 92;
      R(g, x - 36, M.GY - 52, 72, M.GY - (M.GY - 52), F('bore'));
      well(g, x, M.GY - 52, M.GY + 4, 36);
      worker(g, x + 70, { GY: M.GY, pose: 'stand' });
      tag(g, x + 52, M.GY + 24, 'vágóél', { to: [x + 44, M.GY - 2] });
      tag(g, x, M.GY - 70, 'vasbeton köpeny', { anchor: 'middle', to: [x - 40, M.GY - 40] });
    } },
    { w: 270, t: 'Kotrás, süllyedés', d: 'Belülről markolóval kiszedik a földet, a vágóél alól is; a kút a saját súlyától süllyed.', draw(g, M) {
      const x = 92, bot = 252;
      R(g, x - 36, M.GY - 28, 72, M.GY - (M.GY - 28), F('bore'));
      R(g, x - 36, M.GY, 72, 246 - M.GY, F('bore'));
      water(g, x - 36, M.gw, 72, 246 - M.gw);
      well(g, x, M.GY - 28, bot, 36);
      const gr = grab(g, x, 238, 20, 0.6);
      crane(g, M, x, gr.top - 4, { reach: 124, tipY: 18 });
      spoil(g, M, 150, 36, 10, 'sand');
      arrowV(g, x - 60, 200, 238); arrowV(g, x + 60, 200, 238);
      tag(g, x + 52, 296, 'a kút saját súlyától süllyed', { anchor: 'middle' });
    } },
    { w: 250, t: 'Toldás', d: 'A köpenyt szakaszonként (vagy kútgyűrűkkel) magasítják, és tovább süllyesztik.', draw(g, M) {
      const x = 92, bot = 270;
      R(g, x - 36, M.GY - 58, 72, M.GY + 58 - M.GY, F('bore'));
      R(g, x - 36, M.GY, 72, 266 - M.GY, F('bore'));
      water(g, x - 36, M.gw, 72, 266 - M.gw);
      well(g, x, M.GY - 58, bot, 36, { fresh: M.GY - 22, joint: M.GY - 22 });
      worker(g, x + 66, { GY: M.GY, pose: 'guide' });
      tag(g, x + 58, M.GY - 74, 'új szakasz', { to: [x + 46, M.GY - 40] });
    } },
    { w: 260, t: 'Zárás, kitöltés', d: 'A teherbíró rétegben víz alatti betonozással zárófenék készül, majd a kút belsejét sovány betonnal kitöltik.', draw(g, M) {
      const x = 92, bot = 304;
      concrete(g, x - 36, M.GY - 58, 72, 280 - (M.GY - 58), false);
      R(g, x - 36, M.GY - 58, 72, 280 - (M.GY - 58), F('grout1', 0.35));
      concrete(g, x - 36, 280, 72, bot - 280);
      well(g, x, M.GY - 58, bot, 36, { joint: M.GY - 22 });
      tag(g, x + 54, 296, 'zárófenék', { to: [x + 20, 292] });
      tag(g, x + 54, 236, 'sovány beton', { to: [x + 20, 236] });
    } },
  ],
};

/* ================================================================== megjelenítés */
function drawStep(M, i, ox) {
  const st = M.steps[i], W = st.w, H = M.H;
  CUR.W = W;
  const s = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pr-svg', role: 'img', 'aria-label': `${i + 1}. ${st.t}` });
  const g = g_(s);
  backdrop(g, M, ox, W);
  st.draw(g, M);
  if (i === 0) {
    M.layers.forEach((l, k) => {
      const t0 = k === 0 ? M.GY : l.y, t1 = k + 1 < M.layers.length ? M.layers[k + 1].y : M.H;
      if (l.lab) tag(g, 6, l.ly ?? Math.min(t0 + 18, (t0 + t1) / 2), l.lab, { fs: 9.5 });
    });
  }
  if (M.gw) {
    const gx = W - 18, gy = M.gw;
    P(g, `M${gx - 6} ${gy - 9} h12 l-6 8z`, F('halo') + `;stroke:${v('water')};stroke-width:1.6`);
    Ln(g, gx - 4, gy + 3, gx + 4, gy + 3, SK('water', 1.2));
    Ln(g, gx - 2, gy + 6, gx + 2, gy + 6, SK('water', 1.2));
  }
  badge(g, i + 1);
  return s;
}

function render(el0) {
  const M = PROC[el0.dataset.proc]; if (!M) return;
  defs();
  el0.classList.add('pr-strip');
  el0.style.setProperty('--n', M.steps.length);
  el0.dataset.n = M.steps.length;
  el0.style.gridTemplateColumns = M.steps.map((s) => `minmax(0, ${s.w}fr)`).join(' ');
  let ox = 0;
  M.steps.forEach((st, i) => {
    el0.append(h('figure', { class: 'pr-col', style: `--w:${st.w}` }, drawStep(M, i, ox), h('figcaption', {}, h('b', {}, h('i', {}, String(i + 1)), st.t), h('span', {}, st.d))));
    ox += st.w;
  });
}

function init() { document.querySelectorAll('[data-proc]').forEach(render); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
