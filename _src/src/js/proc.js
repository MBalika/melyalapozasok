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
  lg('pr-cyld', [[0, v('hel3')], [0.32, v('hel1')], [0.66, v('hel2')], [1, v('hel3')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-tcyl', [[0, v('tool2')], [0.35, v('tool')], [1, v('tool2')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-dcyl', [[0, v('drv2')], [0.35, v('drv')], [0.75, v('drv')], [1, v('drv2')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-mixg', [[0, v('mix1')], [0.5, v('mix3')], [1, v('mix1')]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  // a spirálon ülő talajhenger árnyalása (két szélén sötétebb, a fény felőli harmadában világosabb)
  lg('pr-augsh', [[0, '#000', 0.34], [0.2, '#000', 0.08], [0.4, '#fff', 0.16], [0.62, '#fff', 0], [0.86, '#000', 0.14], [1, '#000', 0.36]], { x1: 0, y1: 0, x2: 1, y2: 0 });
  lg('pr-flt', [[0, v('steel1')], [0.55, v('steel2')], [1, v('steel3')]], { x1: 0, y1: 0, x2: 0, y2: 1 });
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
  // az árboc a fúrási tengely mögött áll; a forgatófej szánon fut az árboc elülső vezetősínjén (nem kötélen lóg)
  const GY = M.GY, top = o.top ?? 22, mx = x + 24, hy = GY - 19;
  const r0 = g_(g, { class: 'pr-rig' });
  let r = r0;
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
  // o.slew: a felsőváz elfordulása (oldalnézetben eltolásként); a lánctalp marad
  if (o.slew) { E(r, tx0 + 48, GY - 18, 26, 3, F('dark2')); r = g_(r0, { transform: `translate(${(-o.slew).toFixed(2)} 0)` }); }
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
    // dobozszelvényű árboc könnyítő lyuksorral, elöl vezetősín
    R(r, mx - 6, mtop, 12, mbot - mtop, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
    R(r, mx - 8, mtop + 4, 2.6, mbot - mtop - 8, F('mach3'));
    R(r, mx + 3.4, mtop, 1.4, mbot - mtop, F('mach2'));
    for (let y = mtop + 12; y < mbot - 10; y += 12.5) { C(r, mx - 0.6, y, 2.5, F('mach3')); C(r, mx - 0.2, y + 0.5, 1.5, F('mach2')); }
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
  P(r, `M${mx - 6} ${mtop + 2} L${mx - 12} ${mtop - 6} H${mx + 12} L${mx + 6} ${mtop + 2}Z`, F('mach2') + `;stroke:${v('mach3')};stroke-width:.8`);
  R(r, mx - 14, mtop - 12, 28, 7, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 2 });
  for (const sx2 of [-9, 9]) { C(r, mx + sx2, mtop - 8.5, 4, F('dark')); C(r, mx + sx2, mtop - 8.5, 1.4, F('steel1')); }
  // Kelly-rúdas gépnél a fő kötél a fúrási tengely fölötti kötélkorongon fut (a rúd tetejéhez)
  if (o.rope !== undefined) { R(r, x - 5, mtop - 12, mx - x - 8, 6, F('mach2') + `;stroke:${v('mach3')};stroke-width:.7`, { rx: 1.5 }); C(r, x, mtop - 6, 3.8, F('dark')); C(r, x, mtop - 6, 1.3, F('steel1')); }
  // csörlőkötelek az árboc két oldalán (a forgatófej szánjához, ill. hátul a csörlőhöz)
  const ropeY = o.headY != null ? o.headY - 7 : mbot - 30;
  Ln(r, mx - 12.5, mtop - 8.5, mx - 12.5, Math.max(mtop, ropeY), SK('rope', 1));
  Ln(r, mx + 12.5, mtop - 8.5, mx + 12.5, GY - 46, SK('rope', 1));
  // forgatófej
  const out = { mx, top: mtop };
  if (o.headY != null) {
    const yH = o.headY;
    // Kelly-rúdnál a fő kötél a rúd tetejéhez fut (o.rope: true); CFA-nál a szerszám a forgatófejhez merevén kapcsolódik
    if (o.rope === true) Ln(r, x, mtop - 3, x, yH - 6, SK('rope', 1));
    R(r, x - 3, yH - 7, 6, 7, F('dark2'));
    // szán az árboc vezetősínjén, görgőkkel
    R(r, mx - 10.5, yH - 9, 6, 42, F('mach2') + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 1.5 });
    for (const yy of [yH - 5, yH + 29]) C(r, mx - 7.5, yy, 1.8, F('dark'));
    R(r, mx - 12.5, yH - 9, 2, 3, F('dark2'));
    R(r, x + 14, yH + 2, mx - 10.5 - (x + 14) + 0.5, 20, F('mach2') + `;stroke:${v('mach3')};stroke-width:.7`);
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
  } else if (o.tool === 'mount') {
    // gyorscsatlakozó a kar végén – a munkaeszközt (vibrátor, forgatófej) a hívó rajzolja alá
    Ln(e, sx2, sy2, x, tipY - 6, SK('exc2', 5, 'stroke-linecap:round'));
    R(e, x - 6, tipY - 8, 12, 8, F('dark2') + `;stroke:${v('dark')};stroke-width:.7`, { rx: 2 });
    C(e, x, tipY - 4, 1.6, F('steel1'));
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
/**
 * Folyamatos (CFA) vagy rövid spirál oldalnézetben. A menet egy csavarvonal vetülete: a henger két szélén függőleges
 * érintővel fordul, középen lejt. Ahol talaj ül a meneteken (soilFrom–soilTo), ott a menetek közötti teret a henger
 * teljes átmérőjéig tömör talaj tölti ki (árnyalt talajhenger, a menetek éle alatt árnyékkal); fölötte üres, fémes menetek.
 * o.pitch: menetemelkedés, o.ph: forgási fázis (menetnyi), o.flow: beton a szárban (idő), o.soil/o.pat: talaj.
 */
function augerDraw(g, cx, top, bot, half, o = {}) {
  const a = g_(g, { class: 'pr-auger' });
  const p = o.pitch ?? 16, s2 = p / 2, sw = Math.max(7, half * 0.6), ft = Math.max(2.4, p * 0.22);
  const off = ((((o.ph ?? 0) % 1) + 1) % 1) * p;
  const hasSoil = o.soilFrom != null;
  const y0 = hasSoil ? Math.max(top + 2, o.soilFrom) : Infinity, y1 = hasSoil ? Math.min(bot - 3, o.soilTo ?? bot) : -Infinity;
  const soil = hasSoil && y1 > y0 + 1;
  const xl = cx - half, xr = cx + half, yEnd = bot - 8;
  const S = (xa, ya, xb, yb) => `M${xa.toFixed(1)} ${ya.toFixed(1)} C${xa.toFixed(1)} ${(ya + (yb - ya) / 3).toFixed(1)} ${xb.toFixed(1)} ${(ya + (2 * (yb - ya)) / 3).toFixed(1)} ${xb.toFixed(1)} ${yb.toFixed(1)}`;
  const ys = []; for (let y = top + 4 + off - p; y < yEnd; y += p) ys.push(y);
  const inSoil = (ya, yb) => soil && yb > y0 - 1 && ya < y1 + 1;
  // hátsó menetek (a szár mögött), csak ahol nincs talaj
  let back = '';
  for (const y of ys) { const ya = y + s2, yb = Math.min(yEnd + 2, y + p); if (yb <= top + 2 || ya >= yEnd) continue; if (!inSoil(ya, yb)) back += S(xr, Math.max(top + 2, ya), xl, yb) + ' '; }
  if (back) P(a, back, SK('steel3', 2.2, 'stroke-linecap:round;opacity:.7'));
  // szár
  R(a, cx - sw / 2, top, sw, bot - top - 2, 'fill:url(#pr-cyl)');
  Ln(a, cx - sw / 2 + 0.6, top, cx - sw / 2 + 0.6, bot - 4, SK('steel3', 0.8, 'opacity:.6'));
  // a meneteken ülő talajhenger: a két szélén a menetek között kissé behúzódik
  if (soil) {
    const [col, pat] = SOIL[o.soil ?? 'clay'];
    const inL = (y) => { const k = ((((y - (top + 4 + off)) % p) + p) % p) / p; return 1.2 + 1.6 * Math.sin(Math.PI * k); };
    const inR = (y) => { const k = ((((y - (top + 4 + off + s2)) % p) + p) % p) / p; return 1.2 + 1.6 * Math.sin(Math.PI * k); };
    let d = `M${(xl + inL(y0)).toFixed(1)} ${y0.toFixed(1)}`;
    // felső perem: egyenetlen, morzsás
    for (let x = xl + 3; x < xr - 2; x += 4) d += ` L${x.toFixed(1)} ${(y0 - 1.2 - 1.4 * hash(Math.round(x * 3 + y0))).toFixed(1)}`;
    for (let y = y0; y <= y1; y += 2) d += ` L${(xr - inR(y)).toFixed(1)} ${y.toFixed(1)}`;
    d += ` L${(xr - inR(y1)).toFixed(1)} ${y1.toFixed(1)} L${(xl + inL(y1)).toFixed(1)} ${y1.toFixed(1)}`;
    for (let y = y1; y >= y0; y -= 2) d += ` L${(xl + inL(y)).toFixed(1)} ${y.toFixed(1)}`;
    d += 'Z';
    P(a, d, F(col) + `;stroke:${v('layer')};stroke-width:.6`);
    P(a, d, `fill:url(#${o.pat ?? pat})`);
    P(a, d, 'fill:url(#pr-augsh)');
    // rögök a menetek között
    for (const y of ys) for (let i = 0; i < 3; i++) {
      const yy = y + p * (0.3 + 0.22 * i) + 2, xx = xl + 4 + (half * 2 - 8) * hash(i * 7 + Math.round(y));
      if (yy > y0 + 2 && yy < y1 - 2) E(a, xx, yy, 1.6 + hash(i + y) * 1.3, 1.1 + hash(i + 2 * y), F(col) + `;stroke:${v('layer')};stroke-width:.5;opacity:.9`);
    }
  }
  // beton a csőszárban (metszetben látszó belső ér)
  if (o.flow) {
    R(a, cx - 1.9, top + 2, 3.8, bot - top - 8, F('dark2', 0.55), { rx: 1.6 });
    for (let y = top + 4 + ((o.flow * 26) % 13); y < bot - 6; y += 13) R(a, cx - 1.6, y, 3.2, 6, F('fresh1'), { rx: 1.4 });
  }
  // elülső menetek: üres szakaszon fémes lap (a felső lapja látszik), a talajban csak az éle és alatta árnyék
  for (const y of ys) {
    const ya = Math.max(top + 1, y), yb = Math.min(yEnd + 1, y + s2);
    if (yb <= top + 2 || ya >= yEnd) continue;
    const edge = S(xl, y, xr, y + s2);
    if (inSoil(ya, yb)) {
      P(a, S(xl + 1, y + 2.2, xr - 1, y + s2 + 2.2), SK('dark', 2.4, 'stroke-linecap:round;opacity:.28'));
      P(a, edge, SK('steel3', 3.2, 'stroke-linecap:round'));
      P(a, S(xl + 0.4, y - 0.7, xr - 0.4, y + s2 - 0.7), SK('steel1', 1.1, 'stroke-linecap:round;opacity:.9'));
    } else {
      const face = `M${xl} ${y.toFixed(1)} C${xl} ${(y + s2 / 3 - ft * 1.3).toFixed(1)} ${xr} ${(y + (2 * s2) / 3 - ft * 1.3).toFixed(1)} ${xr} ${(y + s2).toFixed(1)} C${xr} ${(y + (2 * s2) / 3).toFixed(1)} ${xl} ${(y + s2 / 3).toFixed(1)} ${xl} ${y.toFixed(1)}Z`;
      if (y >= top + 1) P(a, face, 'fill:url(#pr-flt)' + `;stroke:${v('steel3')};stroke-width:.6`);
      P(a, edge, SK('steel3', 2.6, 'stroke-linecap:round'));
    }
  }
  // fúrófej: vágóélek, középső csúcs, a betonozónyílás zárólapja
  P(a, `M${cx - half + 1} ${bot - 7} L${cx - 3} ${bot} L${cx + 3} ${bot} L${cx + half - 1} ${bot - 7}`, SK('steel3', 2.8, 'stroke-linejoin:round'));
  for (const k of [-1, 1]) P(a, `M${cx + k * (half - 3)} ${bot - 6} l${k * 1.6} 3.4 l${-k * 3} 0.6z`, F('dark2'));
  P(a, `M${cx - 3} ${bot} L${cx} ${bot + 4} L${cx + 3} ${bot}Z`, F('steel3'));
  return a;
}
function auger(g, cx, top, bot, half, o = {}) { return augerDraw(g, cx, top, bot, half, o); }
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
/** CFA alsó spirálvezető az árboc lábánál: a spirál ezen a gyűrűn át fut (a spirál után rajzolandó) */
function guideFront(g, M, x, half) {
  const GY = M.GY, mx = x + 24, y0 = GY - 20, gg = g_(g, { class: 'pr-guide' });
  R(gg, x + half + 2, y0 + 1, mx - 6 - (x + half + 2), 6, F('mach2') + `;stroke:${v('mach3')};stroke-width:.7`);
  R(gg, x - half - 4, y0, half * 2 + 8, 8, F('mach') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 2 });
  Ln(gg, x - half - 3, y0 + 4, x + half + 3, y0 + 4, SK('mach3', 0.8));
  R(gg, x - half - 6, y0 - 1, 4, 10, F('dark2'), { rx: 1 }); R(gg, x + half + 2, y0 - 1, 4, 10, F('dark2'), { rx: 1 });
  return gg;
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
const CFA_TOE = 284, CFA_AL = 128; // CFA-sor: talpmélység és spirálhossz (a forgatófej a vezető fölött áll meg)
PROC.cfa = {
  H: 360, GY: 178, gw: 226, layers: [{ k: 'clay', y: 178, lab: 'iszapos agyag' }, { k: 'sand', y: 252, lab: 'homok' }],
  steps: [
    { w: 270, t: 'Kitűzés, pontraállás', d: 'Kitűzik a cölöp helyét, és a gép pontraáll. Az üreges fúrószár alján egy betonozónyílás van, ezt zárólap zárja.', draw(g, M) {
      const x = 108, r = rig(g, M, x, { top: 14, headY: M.GY - 2 - CFA_AL - 24 });
      auger(g, x, r.headBot, M.GY - 2, 15);
      guideFront(g, M, x, 15);
      tag(g, x + 30, M.GY + 18, 'zárólap', { to: [x + 3, M.GY] });
      tag(g, x - 24, 118, 'üreges szár', { anchor: 'end', to: [x - 4, 118] });
      worker(g, x - 44, { GY: M.GY, pose: 'signal' });
    } },
    { w: 270, t: 'Furatkészítés', d: 'Az üreges CFA-fúróspirált a cölöpfúró gép lehajtja. Lehajtás-tekerés közben a spirálon lévő talajdugó támasztja meg a furatot.', draw(g, M) {
      const x = 108, toe = CFA_TOE, top = toe - CFA_AL;
      spoil(g, M, x - 46, 30, 9); spoil(g, M, x + 14, 18, 6);
      const r = rig(g, M, x, { top: 14, headY: top - 24 });
      auger(g, x, r.headBot, toe, 15, { soilFrom: M.GY - 14, soilTo: toe - 4 });
      guideFront(g, M, x, 15);
      holeWall(g, x, M.GY, toe - 4, 15);
      spin(g, x, r.headY + 34, 24);
      arrowV(g, x - 38, 196, 236);
      tag(g, x + 24, 280, 'talajdugó', { to: [x + 8, 274] });
    } },
    { w: 360, t: 'Betonozás', d: 'A fúrószáron át túlnyomással betont pumpálnak, amely feltolja a spirált (rajta a talajdugóval) – ezt húzással segítik, forgatás nélkül. Vibrálni nem kell: a folyós beton nyomás alatt öntömörödik.', draw(g, M) {
      const x = 222, toe = CFA_TOE, tip = 236, top = tip - CFA_AL;
      spoil(g, M, x - 40, 26, 8); spoil(g, M, x + 16, 20, 7);
      const r = rig(g, M, x, { top: 14, headY: top - 24 });
      concrete(g, x - 15, tip, 30, toe - tip);
      holeWall(g, x, M.GY, toe, 15);
      // a talajdugó a spirállal együtt emelkedik: a kihúzott meneteken is ott a furadék
      auger(g, x, r.headBot, tip, 15, { soilFrom: M.GY - 14 - (toe - tip), soilTo: tip - 4 });
      guideFront(g, M, x, 15);
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
    { w: 290, t: 'Vasalás', d: 'A cölöpöt általában a munkaszintig betonozzák fel, és a vasalási armatúrát belenyomják a friss cölöpbetonba.', draw(g, M) {
      const x = 96, toe = CFA_TOE;
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
    { w: 240, t: 'A cső lehajtása', d: 'A béléscsövet rotációval vagy vibrálással, folyamatos toldással juttatják le: ez támasztja meg a furatot.', draw(g, M) {
      const x = 92, bot = 238, r = rig(g, M, x, { top: 16, headY: 66 });
      R(g, x - 16, r.headBot, 32, M.GY - r.headBot, F('bore'));
      casing(g, x, r.headBot, bot, 16, { inner: false, teeth: true, collar: true });
      spin(g, x, r.headBot + 8, 30);
      arrowV(g, x - 44, 120, 168);
      tag(g, x + 26, 214, 'béléscső', { to: [x + 20, 214] });
    } },
    { w: 240, t: 'Földkiemelés', d: 'A cső védelmében dobfúróval emelik ki a talajt; a cső jár elöl, víz alatt pótolják a vizet.', draw(g, M) {
      const x = 92, r = rig(g, M, x, { top: 16, rope: true, headY: 20 });
      spoil(g, M, x - 64, 34, 10, 'silt');
      casing(g, x, M.GY - 14, 304, 16, { teeth: true, collar: true });
      water(g, x - 16, M.gw, 32, 290 - M.gw);
      kelly(g, x, r.headBot, 252);
      drillBucket(g, x, 290, 14, { soil: 'gravel' });
      tag(g, x + 26, 228, 'víz a csőben', { to: [x + 10, 232] });
      tag(g, x + 26, 282, 'dobfúró', { to: [x + 14, 278] });
    } },
    { w: 240, t: 'Vasalás', d: 'A vasalási armatúrát a furatba, a cső belsejébe engedik; szükség esetén toldják.', draw(g, M) {
      const x = 70;
      casing(g, x, M.GY - 14, 304, 16, { teeth: true, collar: true });
      water(g, x - 16, M.gw, 32, 300 - M.gw);
      cage(g, x, 118, 298, 12);
      crane(g, M, x, 112, { reach: 110, tipY: 18 });
      worker(g, x - 32, { GY: M.GY, pose: 'guide' });
      tag(g, x + 26, 246, 'armatúra', { to: [x + 10, 246] });
    } },
    { w: 300, t: 'Betonozás', d: 'Kontraktorcsővel, alulról betonoznak; a betonozással együtt a béléscsöveket folyamatosan visszaszedik.', draw(g, M) {
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
    { w: 230, t: 'Előkészítés', d: 'pontraállás, előfúrás, iránycső', draw(g, M) {
      const x = 90, r = rig(g, M, x, { top: 16, rope: true, headY: 24 });
      casing(g, x, M.GY - 10, M.GY + 34, 18, { joints: false, collar: true });
      kelly(g, x, r.headBot, M.GY - 6);
      auger(g, x, M.GY - 6, M.GY + 30, 16, { pitch: 12, soilFrom: M.GY - 6, soil: 'fill', pat: 'pr-p-fill' });
      tag(g, x + 28, M.GY + 26, 'iránycső', { to: [x + 20, M.GY + 22] });
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
      const x = 90, r = rig(g, M, x, { top: 16, rope: true, headY: 22 });
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
    { w: 250, t: 'Iránycső ki', d: 'az iránycső eltávolítása, kész a cölöp', draw(g, M) {
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
      const x = 86, r = rig(g, M, x, { top: 16, rope: true, headY: 22 });
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

/* ---------------- Csavartányéros cölöp (talajcsavar) – a BME-videó lépései szerint */
PROC.csavar = {
  H: 330, GY: 200, layers: [{ k: 'fill', y: 200, lab: 'humuszos feltöltés' }, { k: 'clay', y: 226, lab: EN ? 'clay' : 'agyag' }],
  steps: [
    { w: 230, t: 'Kitűzés', d: 'A cölöpök helyét mérőállomással tűzik ki.', draw(g, M) {
      const S = 26, eye = totalStation(g, 70, M.GY, S);
      worker(g, 70 - 18, { GY: M.GY, pose: 'guide', dir: 1, s: 1.05 });
      for (const x of [150, 196]) markX(g, x, M.GY, S);
      P(g, `M${eye[0] + 8} ${eye[1]} L150 ${M.GY - 1}`, SK('mark', 1, 'stroke-dasharray:3 3'));
      R(g, 118, M.GY - 6, 2 * S, 0.2 * S, 'fill:url(#pr-cylh)' + `;stroke:${v('hel3')};stroke-width:.6`);
      E(g, 118 + 1.6 * S, M.GY - 6 + 0.1 * S, 0.08 * S, 0.3 * S, F('hel2'));
      tag(g, 20, 36, 'mérőállomás', { to: [70, M.GY - 1.4 * S] });
      tag(g, 210, 150, 'kitűzött pont', { anchor: 'end', to: [196, M.GY] });
    } },
    { w: 270, t: 'Lehajtás forgatófejjel', d: 'A kotróra szerelt forgatófej a kitűzött ponton lecsavarja a cölöpöt; közben ellenőrzik a függőlegességet.', draw(g, M) {
      const S = 26, x = 70, top = M.GY - 0.9 * S;
      excavator(g, M, x, top - 0.7 * S, { tool: 'mount', lift: 30, reach: 70 });
      screwV2(g, x, top, 2.6 * S, 1.2, { S });
      R(g, x - 0.22 * S, top - 0.7 * S, 0.44 * S, 0.42 * S, F('dark2') + `;stroke:${v('dark')};stroke-width:.7`, { rx: 2 });
      R(g, x - 0.14 * S, top - 0.3 * S, 0.28 * S, 0.5 * S, 'fill:url(#pr-cyl)');
      spin(g, x, top + 0.5 * S, 15);
      worker(g, x - 34, { GY: M.GY, pose: 'guide', dir: 1 });
      tag(g, 160, M.GY + 46, 'csavartányér', { to: [x + 0.3 * S, top + 2.6 * S - 0.45 * S] });
    } },
    { w: 230, t: 'Szintre igazítás', d: 'A fejeket zsinórral egy szintre igazítják, és felhelyezik a fejlemezeket.', draw(g, M) {
      const S = 26, hy = M.GY - 0.35 * S;
      [56, 174].forEach((x, i) => screwV2(g, x, hy, 2.6 * S, 0.4 + i, { S, cap: true }));
      Ln(g, 20, hy - 0.1 * S - 3.2, 214, hy - 0.1 * S - 3.2, SK('mark', 1.1));
      for (const x of [20, 214]) R(g, x - 2, hy - 18, 4, M.GY - hy + 18, F('timber'));
      worker(g, 115, { GY: M.GY, pose: 'guide', dir: -1 });
      tag(g, 115, 40, 'zsinór', { anchor: 'middle', to: [100, hy - 0.1 * S - 3.2] });
      tag(g, 214, 76, EN ? 'head plate' : 'fejlemez', { anchor: 'end', to: [174, hy - 0.1 * S - 2] });
    } },
    { w: 250, t: EN ? 'Timber frame' : 'Gerendakeret', d: 'A fejlemezekre kerül a fa gerendakeret, a felépítmény alapváza.', draw(g, M) {
      const S = 26, hy = M.GY - 0.35 * S;
      [40, 125, 210].forEach((x, i) => screwV2(g, x, hy, 2.6 * S, 0.8 + i, { S, cap: true }));
      R(g, 24, hy - 0.1 * S - 3.2 - 12, 202, 12, F('timber') + `;stroke:${v('timber2')};stroke-width:.8`);
      for (let x = 30; x < 222; x += 16) Ln(g, x, hy - 0.1 * S - 14, x + 10, hy - 0.1 * S - 5, SK('timber2', 0.6));
      tag(g, 125, 70, EN ? 'timber frame' : 'gerendakeret', { anchor: 'middle', to: [125, hy - 0.1 * S - 12] });
    } },
    { w: 260, t: 'Felépítmény', d: 'Az alapozás azonnal terhelhető: ráépül a könnyűszerkezetes ház.', draw(g, M) {
      const S = 26, hy = M.GY - 0.35 * S;
      [50, 210].forEach((x, i) => screwV2(g, x, hy, 2.6 * S, 0.5 + i, { S, cap: true }));
      R(g, 34, hy - 0.1 * S - 3.2 - 10, 192, 10, F('timber') + `;stroke:${v('timber2')};stroke-width:.8`);
      house(g, 42, hy - 0.1 * S - 13, 176);
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
    { w: 270, t: 'Fúrás öblítéssel', d: 'Az elvesző fúrófejes, belső furatú magrudat forgatva hajtják le és toldják; közben híg cementtejjel (v/c ≈ 0,7–1,0) öblítenek, amely a talajhézagokba hatol.', draw(g, M) {
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
    { w: 270, t: 'Injektálás', d: 'A végső mélységben sűrűbb (v/c ≈ 0,4–0,5) cementhabarcsot injektálnak: a rúd körül cementtest, azon kívül cementtel átitatott talajköpeny alakul ki.', draw(g, M) {
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
    { w: 260, t: 'Injektálás a talptól', d: 'A monitor fúvókáin át 350–400 bar nyomású sugár vágja és keveri a talajt.', draw(g, M) {
      const x = 150, r = smallRig(g, M, x, { top: 36, headY: 132 });
      silo(g, M, 22, { w: 20, h: 86 });
      const pl = plant(g, M, 36, { w: 44, h: 24 });
      hoseTo(g, pl.out[0], pl.out[1], x - 6, r.headY + 4, 10);
      column(g, x, 282, 306, 26, 'jet');
      jetTool(g, x, r.headBot, 294, { jet: 34 });
      tag(g, x + 22, 252, '350–400 bar', { to: [x + 18, 292] });
      tag(g, 74, M.GY - 108, 'nagynyomású szivattyú', { anchor: 'middle', to: [58, M.GY - 26] });
    } },
    { w: 260, t: 'Forgatás, visszahúzás', d: 'A szárat forgatva, 25–35 cm/perc sebességgel húzzák fel: az oszlop alulról felfelé nő, a visszafolyó cementhabarcs a furat mentén a felszínre jut.', draw(g, M) {
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
      tag(g, x + 30, M.GY - 16, 'visszafolyó cementhabarcs', { to: [x + 22, M.GY] });
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
    { w: 260, t: 'Lehajtás forgatva', d: 'A fúró-keverő berendezés lehatol a kellő mélységbe; a fúrószáron át folyékony kötőanyag-szuszpenziót juttatnak a talajba.', draw(g, M) {
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
    { w: 240, t: 'Visszahúzás keverve', d: 'Az eszköz lassú, fokozatos és ismétlődő felvonásával a talaj teljes mélységben átkeveredik.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 16, headY: 70 });
      column(g, x, M.GY, 304, 19, 'mix');
      mixTool(g, x, r.headBot, 222, 19);
      spin(g, x, r.headBot + 12, 22);
      arrowV(g, x - 40, 236, 196);
    } },
    { w: 230, t: 'A kész oszlop', d: 'Helyben kevert talajbeton oszlop; átmérője jellemzően 1,0–1,5 m, közel a keverőszerszáméval egyezik.', draw(g, M) {
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
    { w: 250, t: 'Előkészítés', d: 'A lánctalpas hordozógép a megvezetett, zsilipes mélyvibrátort a kitűzött pont fölé irányítja, és hidraulikus támaszokkal megtámasztja.', draw(g, M) {
      const x = 96;
      rig(g, M, x, { top: 16, hoses: false });
      vibroflot(g, x, 30, M.GY - 6, { full: false });
      Ln(g, x - 18, M.GY + 1, x + 18, M.GY + 1, SK('acc', 2));
      Ln(g, x, M.GY - 3, x, M.GY + 5, SK('acc', 2));
      arrowV(g, x - 30, 70, 120);
      tag(g, x + 26, M.GY + 22, EN ? 'set-out point' : 'kitűzött pont', { to: [x + 2, M.GY + 2] });
      tag(g, x + 24, 130, 'mélyvibrátor', { to: [x + 7, 140] });
    } },
    { w: 270, t: 'Töltés', d: 'A rakodógép feltölti az anyagtartályt, amely az árboc mentén felfelé halad, és tartalmát a zsilipbe üríti.', draw(g, M) {
      const x = 112, r = rig(g, M, x, { top: 16, hoses: false });
      vibroflot(g, x, 30, M.GY - 6, { full: true });
      P(g, `M${x - 40} ${M.GY - 22} L${x - 36} ${M.GY} H${x - 14} L${x - 10} ${M.GY - 22}Z`, F('steel2') + `;stroke:${v('steel3')};stroke-width:.8`);
      P(g, `M${x - 39} ${M.GY - 21} Q${x - 25} ${M.GY - 30} ${x - 11} ${M.GY - 21}Z`, F('stone') + `;stroke:${v('stone2')};stroke-width:.6`);
      Ln(g, x - 25, M.GY - 26, r.mx - 6, r.top + 2, SK('rope', 0.9));
      loader(g, M, 2, { lift: 22, full: true });
      arrowV(g, x - 44, M.GY - 40, 60);
      tag(g, x - 25, M.GY - 78, EN ? 'gravel' : 'kavics', { anchor: 'middle', to: [x - 25, M.GY - 26] });
      tag(g, x + 30, 30, EN ? 'airlock' : 'zsilip', { to: [x + 12, 34] });
    } },
    { w: 250, t: 'Lehajtás', d: 'A zsilipes mélyvibrátor a talajt oldalirányba kiszorítja, és – hidraulikus nyomással és sűrített levegővel segítve – a tervezett mélységig vagy a megadott talajellenállásig hatol.', draw(g, M) {
      const x = 96;
      rig(g, M, x, { top: 16, hoses: false });
      vibroflot(g, x, 150, 298, { full: true });
      pushOut(g, x, 270, 10, 3);
      arrowV(g, x + 34, 214, 250);
      tag(g, x + 30, 316, 'mélyvibrátor', { to: [x + 7, 286] });
    } },
    { w: 250, t: 'Tömörítés', d: 'A végmélységben az adalékanyagot a mélyponton fokozatosan kiengedik; a vibrátor föl-le mozgással többször behatol az anyagba, oldalirányba nyomja és tömöríti.', draw(g, M) {
      const x = 96, r = rig(g, M, x, { top: 16, hoses: false });
      stoneCol(g, x, 266, 302, 14);
      vibroflot(g, x, 124, 272, { full: true });
      arrowV(g, x - 32, 252, 222); arrowV(g, x + 30, 222, 252);
      pushOut(g, x, 284, 16, 2);
      tag(g, x + 24, 318, 'tömörített kavics', { to: [x + 10, 296] });
    } },
    { w: 250, t: 'Lezárás', d: 'Szakaszonként a felszínig építik, végül a felszínt tömörítik, elegyengetik.', draw(g, M) {
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
    { w: 240, t: 'Résvezető gerenda', d: 'A rés két oldalán 1,0–1,5 m magas, 20–25 cm széles vasbeton gerendapár készül: vezeti a réskanalat, megtámasztja a felső laza talajt, és ez a kitűzési alapbázis.', draw(g, M) {
      R(g, 14, M.GY - 3, 110, 14, 'fill:url(#pr-concg)' + `;stroke:${v('conc2')};stroke-width:.7`);
      R(g, 124, M.GY, 70, 12, F('bore'));
      spoil(g, M, 196, 30, 8, 'fill');
      excavator(g, M, 150, M.GY + 6, { reach: 56, lift: 46 });
      tag(g, 68, M.GY - 30, 'résvezető gerenda', { anchor: 'middle', to: [68, M.GY - 2] });
    } },
    { w: 240, t: 'Primer harapások', d: 'Szakaszos réselésnél minden második (primer) tábla készül először: két szélét kiharapják, a kiemelt föld helyét folyamatosan bentonitos résiszap tölti ki.', draw(g, M) {
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
    { w: 240, t: 'Vasalás, betonozás', d: 'A tábla végére szakaszoló palló, a résbe a vasalási armatúra (hossztól függően 1–3 db) kerül, majd két betonozócsővel alulról betonoznak.', draw(g, M) {
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

/* ================================================================== 2.4 – a két csoport egy-egy jelenetben */
/**
 * kind 'h': talajhelyettesítéses – CFA-gép fúr, a folyamatos spirál felhozza a talajt, mellette kész cölöp;
 * kind 'k': talajkiszorításos – helyszínen készülő csavart cölöp: a kiszorító fej oldalra tolja és tömöríti a talajt.
 */
export function kindScene(kind) {
  defs();
  const W = 400, H = 300;
  CUR.W = W;
  const M = kind === 'h'
    ? { H, GY: 150, layers: [{ k: 'clay', y: 150 }, { k: 'sand', y: 226 }] }
    : { H, GY: 150, layers: [{ k: 'sand', y: 150 }, { k: 'sand2', y: 232 }] };
  const s = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pr-svg rsz-kis', role: 'img',
    'aria-label': kind === 'h' ? 'CFA-cölöp fúrása: a spirál kihozza a talajt' : 'Csavart cölöp fúrása: a kiszorító fej oldalra tolja a talajt' });
  const g = g_(s);
  backdrop(g, M, 0, W);
  const GY = M.GY, x = 132;
  const tg = (gg, tx, ty, text, o = {}) => tag(gg, tx, ty, text, { fs: 12, ...o });   // a kártyán nagyobb felirat
  if (kind === 'h') {
    // kész cölöp a szomszédban: beton + vasalási armatúra
    const xp = 336;
    concrete(g, xp - 14, GY, 28, 270 - GY, false);
    holeWall(g, xp, GY, 270, 14);
    cage(g, xp, GY + 4, 262, 11);
    tg(g, xp, GY - 22, 'kész cölöp', { anchor: 'middle', to: [xp, GY + 2] });
    // fúrás: a spirál menetei közt a talaj felfelé halad, a felszínen kupacba hullik
    const toe = 236, top = toe - 94;
    spoil(g, M, x - 58, 40, 12); spoil(g, M, x + 16, 22, 7);
    const r = rig(g, M, x, { top: 14, headY: top - 24 });
    auger(g, x, r.headBot, toe, 15, { soilFrom: GY - 14, soilTo: toe - 4 });
    guideFront(g, M, x, 15);
    holeWall(g, x, GY, toe - 4, 15);
    spin(g, x, r.headY + 34, 24);
    // a fellazult zóna a furat körül
    for (const sx of [-1, 1]) for (let y = GY + 14; y < toe - 10; y += 15) P(g, `M${x + sx * 19} ${y} q${sx * 4} 3 ${sx * 8} 1`, SK('wall', 1.1, 'opacity:.75'));
    arrowP(g, `M${x - 26} ${GY + 46} L${x - 26} ${GY - 8} Q${x - 27} ${GY - 22} ${x - 40} ${GY - 18}`, { w: 2.6 });
    head(g, x - 42, GY - 17.5, 165, { s: 8 });
    worker(g, x - 74, { GY, pose: 'stand' });
    tg(g, x - 40, 34, 'CFA-fúrógép', { anchor: 'end', to: [x + 9, 40] });
    tg(g, x - 34, GY + 64, 'a spirál felhozza a talajt', { anchor: 'end', to: [x - 27, GY + 46] });
    tg(g, x - 70, GY - 36, EN ? 'excavated soil' : 'kitermelt talaj', { anchor: 'middle', to: [x - 46, GY - 8] });
    tg(g, x + 24, toe + 26, 'kissé fellazul', { to: [x + 22, toe - 16] });
  } else {
    // kész csavart cölöp a szomszédban, körülötte tömörödött zóna
    const xp = 336;
    E(g, xp, 214, 26, 70, F('push', 0.1) + `;stroke:${v('push')};stroke-width:1;stroke-dasharray:4 3;stroke-opacity:.6`);
    wavyShaft(g, xp, GY, 276, 13);
    tg(g, xp, GY - 22, 'kész csavart cölöp', { anchor: 'middle', to: [xp, GY + 2] });
    // fúrás: a kiszorító fej oldalra tolja és tömöríti a talajt – nincs kitermelt talaj
    const tip = 246, r = rig(g, M, x, { top: 14, headY: tip - 156 });
    for (const [rx, ry, op] of [[44, 36, 0.13], [30, 25, 0.16]]) E(g, x, tip - 22, rx, ry, F('push', op) + `;stroke:${v('push')};stroke-width:1;stroke-dasharray:4 3;stroke-opacity:.55`);
    dispTool(g, x, r.headBot, tip, 15);
    holeWall(g, x, GY, tip - 44, 7);
    pushOut(g, x, tip - 33, 17, 3);
    spin(g, x, r.headY + 34, 22);
    arrowV(g, x - 34, GY - 46, GY - 12);
    worker(g, x - 100, { GY, pose: 'signal' });
    tg(g, x - 40, 34, 'csavart cölöp fúrógépe', { anchor: 'end', to: [x + 9, 40] });
    tg(g, x - 52, tip - 18, 'kiszorító fúrófej', { anchor: 'end', to: [x - 16, tip - 22] });
    tg(g, x + 52, tip + 34, 'a talaj oldalra tömörödik', { anchor: 'middle', to: [x + 36, tip - 14] });
    tg(g, x - 24, GY + 20, EN ? 'no soil removed' : 'nincs kitermelt talaj', { anchor: 'end', to: [x - 8, GY + 2] });
  }
  return s;
}

/* ================================================================== 3.2 / 3.4 – behajtási animációk */
// A KDKCobw52qk és D27v2bVmoXc BME-videók gépei alapján: lánctalpas verőgép vezetőtoronnyal és hidraulikus kossal,
// kotróra szerelt vibrátor, hidraulikus sajtológép ellensúllyal, kotró forgatófejjel (talajcsavar).
const DRV = { W: 520, H: 268, GY: 168, BL: 224 };
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
function txtD(g, x, y, text, cls, a = {}) { return el('text', { x, y, class: cls, text, ...a }, g); }

/** Vibrátor a cölöpfejen: rugalmas felfüggesztés, rezgőtest két, ellentétesen forgó excentrikus tömeggel, szorítópofák.
 *  bot: a pofák alsó éle (cölöpfej), ph: a forgás fázisa (rad). Visszaadja a felfüggesztés tetejét és a test közepét. */
function vibroUnit(g, cx, bot, ph, o = {}) {
  const u = g_(g, { class: 'pr-vibro' });
  const w = o.w ?? 34, hb = o.hb ?? 26, half = o.half ?? 7, yB = bot - 9 - hb, yS = yB - 9;
  // szorítópofák
  R(u, cx - half - 6, bot - 11, 6, 13, F('dark'), { rx: 1.5 });
  R(u, cx + half, bot - 11, 6, 13, F('dark'), { rx: 1.5 });
  R(u, cx - half - 8, bot - 13, half * 2 + 16, 5, F('dark2'), { rx: 1.5 });
  // rezgőtest
  R(u, cx - w / 2, yB, w, hb, F('crane') + `;stroke:${v('crane3')};stroke-width:.9`, { rx: 3 });
  R(u, cx - w / 2, yB + hb - 5, w, 5, F('crane2'), { rx: 2 });
  R(u, cx - w / 2 + 2, yB + 2, w - 4, 2, F('steel1', 0.35), { rx: 1 });
  const r = Math.min(hb * 0.3, w * 0.17), ey = yB + hb * 0.46;
  for (const [dx, dir] of [[-w * 0.24, 1], [w * 0.24, -1]]) {
    const ex = cx + dx, a = ph * dir;
    C(u, ex, ey, r + 1.4, F('dark'));
    C(u, ex, ey, r, F('steel3'));
    P(u, `M${ex} ${ey} L${(ex + r * Math.cos(a - 1.15)).toFixed(2)} ${(ey + r * Math.sin(a - 1.15)).toFixed(2)} A${r} ${r} 0 0 1 ${(ex + r * Math.cos(a + 1.15)).toFixed(2)} ${(ey + r * Math.sin(a + 1.15)).toFixed(2)}Z`, F('steel1'));
    C(u, ex, ey, 1.3, F('dark'));
  }
  // felfüggesztés gumibakokkal
  R(u, cx - w / 2 + 3, yS, w - 6, 6, F('crane2') + `;stroke:${v('crane3')};stroke-width:.7`, { rx: 2 });
  for (const dx of [-w * 0.3, 0, w * 0.3]) R(u, cx + dx - 3, yS + 6, 6, 3, F('dark'), { rx: 1 });
  return { top: yS, mid: yB + hb / 2, body: [cx - w / 2, yB, w, hb], ecc: [cx - w * 0.24, ey] };
}
/** Acél csőcölöp zárt, kúpos csúccsal (cölöpcsúcs) */
function pipePile(g, cx, top, tip, half) {
  const p = g_(g, { class: 'pr-pipe' });
  R(p, cx - half, top, half * 2, tip - top - 10, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.6`);
  P(p, `M${cx - half} ${tip - 10} L${cx} ${tip} L${cx + half} ${tip - 10}Z`, F('steel3'));
  E(p, cx, top, half, 1.8, F('dark2'));
  return p;
}
function pileStock(g, x, y, n, len, o = {}) {
  // fekvő cölöpök alátétfákon
  R(g, x + 8, y - 3, 6, 3, F('timber2')); R(g, x + len - 16, y - 3, 6, 3, F('timber2'));
  for (let i = 0; i < n; i++) {
    const yy = y - 3 - (i + 1) * (o.d ?? 6);
    if (o.pipe) R(g, x, yy, len, o.d ?? 6, 'fill:url(#pr-cylh)' + `;stroke:${v('steel3')};stroke-width:.5`, { rx: 2.5 });
    else { R(g, x, yy, len - 6, o.d ?? 6, 'fill:url(#pr-pile)' + `;stroke:${v('conc2')};stroke-width:.5`); P(g, `M${x + len - 6} ${yy} L${x + len} ${yy + (o.d ?? 6) / 2} L${x + len - 6} ${yy + (o.d ?? 6)}Z`, F('steel3')); }
  }
}
const SHOW = (g, M, labs) => { labs.forEach(([y, t]) => tag(g, 8, y, t, { fs: 11 * TGF })); };

/* ---------- 1. verés: ütéssorozat (beverődés ütésenként; a teherbíró rétegben gyorsan csökken) */
const VB = (() => { const out = []; let d = 0; const tip0 = DRV.GY + 8; while (out.length < 40) { const y = tip0 + d; const st = y < DRV.BL ? 5.4 : 5.4 * Math.exp(-(y - DRV.BL) / 7.5); if (st < 0.4) break; d += st; out.push(d); } return out; })();
const TB = 0.62;
function drvVeres(g, u, st) {
  const { GY } = DRV, X = 168, M = st.M;
  const n = VB.length, tb = u - 0.8, i = tb < 0 ? 0 : Math.floor(tb / TB), ph = tb < 0 ? 0 : (tb % TB) / TB;
  const done = i >= n, prev = i > 0 ? VB[Math.min(i, n) - 1] : 0;
  let depth = done ? VB[n - 1] : prev + (ph > 0.86 ? (VB[i] - prev) * ease((ph - 0.86) / 0.06) : 0);
  const ram = done || tb < 0 ? 0 : ph < 0.72 ? ease(ph / 0.72) : ph < 0.86 ? 1 - ((ph - 0.72) / 0.14) ** 2 : 0;
  const dImp = tb < 0 ? 9 : ph >= 0.86 ? (ph - 0.86) * TB : i > 0 && !done ? (ph + 0.14) * TB : 9;
  const head = GY - 102 + depth, tip = head + 112, mx = st.r.mx;
  // cölöp, benne a lefutó nyomáshullám
  precast(g, X, head, tip, 6);
  if (dImp < 0.12) R(g, X - 6, head + (dImp / 0.12) * 100, 12, 7, F('steel1', 0.55));
  // cölöpsapka és hidraulikus kos a vezetőtoronyban
  const hb = head - 6;
  R(g, X - 10, hb, 20, 7, F('dark2'), { rx: 1.5 });
  const top = hb - 46;
  R(g, X - 12, top, 24, 46, F('mach') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 3 });
  R(g, X - 12, top + 6, 24, 4, F('dark')); R(g, X - 12, top + 40, 24, 3, F('mach3'));
  R(g, X - 6.5, top + 13, 13, 25, F('dark'), { rx: 1.5 });                       // ablak: a belső ejtőtömeg
  R(g, X - 5, top + 25 - ram * 10, 10, 11, F('steel3') + `;stroke:${v('steel1')};stroke-width:.6`, { rx: 1 });
  for (const yy of [top + 4, top + 34]) R(g, X + 12, yy, mx - 6 - (X + 12), 5, F('dark2'));   // vezetőpapucsok
  Ln(g, X, st.r.top - 1, X, top, SK('rope', 1.1));
  hoseTo(g, X + 10, top + 16, mx - 3, Math.min(GY - 40, top + 46), 18);
  // ütés hatásai: por a sapkánál, rezgés a terepen, hanghullám
  if (dImp < 0.45) {
    const k = dImp / 0.45;
    for (const [dx, dy] of [[-14, 0], [14, -2], [-9, -5], [10, 4]]) C(g, X + dx * (1 + k), hb + 3 + dy, 2.5 + k * 7, F('cloud', 0.75 * (1 - k)));
    for (let r = 0; r < 3; r++) E(g, X, GY + 1, 22 + r * 22 + k * 70, 3 + r * 1.6 + k * 4, SK('push', 1.3, `opacity:${(0.65 - r * 0.18) * (1 - k)}`));
    for (let a = 0; a < 3; a++) P(g, `M${X - 22 - a * 9} ${top + 8 - a * 4} q-${8 + a * 4} ${15 + a * 4} 0 ${30 + a * 8}`, SK('labline', 1.3, `opacity:${0.5 * (1 - k)}`));
    for (let p = 0; p < 6; p++) { const sx = p % 2 ? 1 : -1, d0 = 16 + (p >> 1) * 11; C(g, X + sx * (d0 + k * 6), GY - 2 - Math.sin(k * Math.PI) * (3 + (p % 3)), 1.3, F('clay2')); }
  }
  tg(g, X - 30, top + 12, 'hidraulikus kos', { anchor: 'end', to: [X - 12, top + 18] });
  tg(g, X - 30, Math.min(GY - 46, head + 34), 'vasbeton cölöp', { anchor: 'end', to: [X - 6, Math.min(GY - 40, head + 34)] });
  if (done) tg(g, X + 40, tip - 6, 'beállt: a teherbíró rétegben megállt', { to: [X + 5, tip - 6] });
  return { pen: (tip - GY) / 9, extra: `ütésszám: ${Math.min(i, n)}` };
}
/* ---------- 2. vibrálás: kotróra szerelt vibrátor, acél csőcölöp */
function drvVibro(g, u, st) {
  const { GY, BL } = DRV, X = 168, Lp = 100, tip0 = GY + 28, tipE = 252;
  const tu = Math.max(0, u - 1), v1 = 9, v2 = 4.2, d1 = BL - tip0;
  let d = tu * v1 < d1 ? tu * v1 : d1 + (tu - d1 / v1) * v2;
  const done = tip0 + d >= tipE; if (done) d = tipE - tip0;
  const on = u > 0.6 && !done, jig = on ? 1.4 * Math.sin(u * 2 * Math.PI * 26.3) : 0;
  const tip = tip0 + d + jig, head = tip - Lp;
  // átmenetileg „elfolyósodó” talaj a köpeny mentén
  if (on) {
    R(g, X - 17, GY + 1, 34, tip - GY + 4, F('water', 0.13 + 0.05 * Math.sin(u * 9)), { rx: 12 });
    for (let k = 0; k < 18; k++) { const yy = GY + 6 + ((k * 37) % Math.max(10, tip - GY - 6)); const sx = k % 2 ? 1 : -1; C(g, X + sx * (10 + (k % 3) * 2.2) + Math.sin(u * 61 + k) * 1.6, yy + Math.cos(u * 57 + k) * 1.2, 1.2, F('clay2', 0.8)); }
    for (let r = 0; r < 2; r++) { const k = ((u * 1.6 + r * 0.5) % 1); E(g, X, GY + 1, 20 + k * 60, 2 + k * 3, SK('push', 1, `opacity:${0.4 * (1 - k)}`)); }
  }
  if (on) for (const dy of [-1.8, 1.8]) pipePile(g, X, head + dy, tip + dy, 7).setAttribute('opacity', '0.25');
  pipePile(g, X, head, tip, 7);
  const vu = vibroUnit(g, X, head + 6, u * 26 * 2 * Math.PI * 0.11, { w: 34, hb: 26, half: 7 });
  excavator(g, st.M, X, vu.top - 1, { tool: 'mount', lift: 30 });
  hoseTo(g, X + 15, vu.mid - 6, X + 26, vu.top - 30, 10);
  tg(g, X - 30, vu.mid - 4, 'vibrátor', { anchor: 'end', to: [X - 15, vu.mid - 2] });
  tg(g, X - 30, Math.min(GY - 12, head + 52), 'acél csőcölöp', { anchor: 'end', to: [X - 7, Math.min(GY - 6, head + 52)] });
  if (on) tg(g, X + 34, GY + 40, 'átmenetileg „elfolyósodó” talaj', { to: [X + 14, GY + 30] });
  if (done) tg(g, X + 34, tip - 4, 'elérte a tervezett mélységet', { to: [X + 4, tip - 6] });
  return { pen: (tip0 + d - GY) / 9 };
}
/* ---------- 3. sajtolás: hidraulikus sajtológép ellensúllyal, szorít–nyom–enged–visszaáll ciklus */
const TC = 2.4, SS = 13;
function drvSajto(g, u, st) {
  const { GY, BL } = DRV, X = 236, tip0 = GY + 6, Lp = 96, tipE = 252;
  const nS = Math.ceil((tipE - tip0) / SS), tu = u - 0.8, c = tu < 0 ? 0 : Math.floor(tu / TC), ph = tu < 0 ? 0 : (tu % TC) / TC;
  const done = c >= nS;
  const push = done ? 1 : ph < 0.12 ? 0 : ease(Math.min(1, (ph - 0.12) / 0.5));
  let d = Math.min(tipE - tip0, (done ? nS : c) * SS + (done ? 0 : push * SS));
  const tip = tip0 + d, head = tip - Lp;
  const grip = done ? 0 : ph < 0.12 ? ph / 0.12 : ph < 0.62 ? 1 : ph < 0.72 ? 1 - (ph - 0.62) / 0.1 : 0;
  const back = done ? 0 : ph > 0.72 ? ease((ph - 0.72) / 0.28) : 0;
  const cy0 = GY - 74, cy = cy0 + (done ? 0 : (ph < 0.72 ? push : 1 - back) * SS);
  precast(g, X, head, tip, 6);
  // hengerek: a kereszttartóból lefelé, a dugattyúrúd a szorító egységig
  const ch = GY - 124;
  for (const dx of [-18, 18]) {
    R(g, X + dx - 4.5, ch, 9, 30, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.6`, { rx: 1.5 });
    R(g, X + dx - 2, ch + 30, 4, cy - ch - 30, F('steel1') + `;stroke:${v('steel2')};stroke-width:.5`);
  }
  // szorító egység (pofák)
  R(g, X - 26, cy, 52, 22, F('mach2') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 3 });
  R(g, X - 26, cy + 9, 52, 3, F('mach3'));
  const gap = 2.5 * (1 - grip);
  R(g, X - 6 - 5 - gap, cy + 3, 5, 16, F('dark'), { rx: 1 }); R(g, X + 6 + gap, cy + 3, 5, 16, F('dark'), { rx: 1 });
  // nyomóerő-mérő
  const res = tip < BL ? 0.25 + 0.2 * (tip - GY) / (BL - GY) : 0.45 + 0.5 * clamp01((tip - BL) / 28);
  const load = done ? 0.08 : ph >= 0.12 && ph < 0.62 ? res : 0.08, gx = X + 66, gy = GY - 112;
  C(g, gx, gy, 12, F('steel1') + `;stroke:${v('dark')};stroke-width:1.4`);
  P(g, `M${gx - 9} ${gy + 5} A10 10 0 1 1 ${gx + 9} ${gy + 5}`, SK('push', 2, 'opacity:.6'));
  const a = Math.PI * (0.85 + 1.3 * load);
  Ln(g, gx, gy, gx + 9 * Math.cos(a), gy + 9 * Math.sin(a), SK('dark', 1.6, 'stroke-linecap:round'));
  C(g, gx, gy, 1.6, F('dark'));
  Ln(g, gx - 10, gy + 12, gx - 14, ch + 8, SK('hose', 1.6));
  tg(g, gx + 18, gy - 4, 'nyomóerő', { to: [gx + 12, gy - 2] });
  tg(g, X - 40, cy + 11, 'szorító egység', { anchor: 'end', to: [X - 26, cy + 11] });
  tg(g, X - 40, ch + 14, 'hidraulikus hengerek', { anchor: 'end', to: [X - 22, ch + 14] });
  if (done) tg(g, X + 40, tip - 4, 'elérte a tervezett mélységet', { to: [X + 5, tip - 6] });
  return { pen: (tip - GY) / 9 };
}
/* ---------- 4. csavarás: kotró forgatófejjel, talajcsavar (közelkép, 1 m = 24 px) */
function drvCsavar(g, u, st) {
  const { GY } = DRV, X = 190, Ls = 74, k = 1.5, ax = X + 80;
  const tu = Math.max(0, u - 0.8), adv = 6, Trev = 0.7, dE = 72;
  let d = (tu / Trev) * adv; const done = d >= dE; if (done) d = dE;
  const phi = done ? dE / adv * 2 * Math.PI : (tu / Trev) * 2 * Math.PI;
  const tip = GY - 2 + d, top = tip - Ls;
  // kotró (felnagyítva): a kar vége a forgatófej tetején
  const mountY = top - 30, lx = ax + (X - ax) / k, ly = GY + (mountY - GY) / k;
  const ex = g_(g, { transform: `translate(${ax} ${GY}) scale(${k}) translate(${-ax} ${-GY})` });
  excavator(ex, st.M, lx, ly, { tool: 'mount', lift: 26, reach: 52 });
  // csavartányéros cölöp: egyenes acélszár, alján csavartányér (a forgással a tányér lépcsője körbejár)
  const sv = screwV2(g, X, top, Ls, phi, { S: 36 });
  R(g, X - 5.5, top - 10, 11, 12, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.6`);
  R(g, X - 10, mountY, 20, 22, F('dark2') + `;stroke:${v('dark')};stroke-width:.8`, { rx: 3 });
  R(g, X - 10, mountY + 7, 20, 3, F('dark'));
  hoseTo(g, X + 9, mountY + 4, X + 16, mountY - 12, 8);
  if (!done) spin(g, X, top + 8, 20);
  // a csavar körül kissé megemelkedő talaj
  if (d > 4) P(g, `M${X - 20} ${GY} q10 -2.4 16 -1 M${X + 4} ${GY - 1} q6 -1.4 16 1`, SK('clay2', 1.6));
  tg(g, 150, 34, 'forgatófej', { anchor: 'end', to: [X - 10, mountY + 10] });
  tg(g, X + 40, Math.max(GY + 62, sv.plates[0] + 6), 'csavartányér', { to: [X + 10, sv.plates[0] + 1] });
  tg(g, 150, GY + 74, 'csavartányéros cölöp', { anchor: 'end', to: [X - 4, Math.max(top + 8, (top + tip) / 2)] });
  if (done) tg(g, X + 30, GY - 30, EN ? 'installed to the design depth' : 'lehajtva a tervezett mélységig', { to: [X + 6, GY - 4] });
  return { pen: d / 24 };
}
// keskeny kijelzőn a feliratok betűmérete nő, hogy kb. 9–10 képpontos maradjon
let TGF = 1;
const tg = (g, x, y, t, o = {}) => tag(g, x, y, t, { fs: 12 * TGF, ...o });
/** beágyazott <svg> megjelenített szélessége (a getBoundingClientRect a túllógó tartalmat is beleszámolja) */
const nestW = (s) => { const o = s.ownerSVGElement; if (!o || !o.viewBox.baseVal || !o.viewBox.baseVal.width) return s.getBoundingClientRect().width; return (o.getBoundingClientRect().width / o.viewBox.baseVal.width) * s.width.baseVal.value; };
const fitTGF = (cw, vbw, px = 9.5, mx = 1.8) => (cw > 0 ? Math.round(Math.max(1, Math.min(mx, (px * vbw) / (12 * cw))) * 20) / 20 : 1);
function drvStatic(g, mode, st) {
  const { W, GY } = DRV;
  const M = mode === 'csavar' ? { H: DRV.H, GY, layers: [{ k: 'fill', y: GY }, { k: 'clay', y: GY + 26 }] } : { H: DRV.H, GY, layers: [{ k: 'silt', y: GY }, { k: 'gravel', y: DRV.BL }] };
  st.M = M;
  backdrop(g, M, 0, W);
  if (mode === 'csavar') [[GY + 13, 'humuszos feltöltés'], [GY + 44, 'kötött talaj']].forEach(([y, t]) => tag(g, W - 8, y, t, { fs: 11 * TGF, anchor: 'end' }));
  else SHOW(g, M, [[GY + 16, 'puha réteg'], [DRV.BL + 16, 'teherbíró réteg']]);
  if (mode === 'veres') {
    pileStock(g, 14, GY, 3, 100, { d: 6 });
    st.r = rig(g, M, 168, { top: 6 });
    R(g, 168 - 10, GY - 22, 20, 6, F('dark2'), { rx: 1.5 }); Ln(g, 178, GY - 19, st.r.mx - 6, GY - 19, SK('dark2', 3));
    worker(g, 108, { GY, pose: 'stand' });
    tg(g, st.r.mx + 40, 34, 'vezetőtorony', { to: [st.r.mx + 6, 40] });
  } else if (mode === 'vibro') {
    pileStock(g, 14, GY, 3, 92, { d: 6, pipe: true });
    worker(g, 118, { GY, pose: 'signal' });
    tg(g, 330, 96, 'kotró', { to: [262, 142] });
  } else if (mode === 'sajto') {
    const X = 236, fy = GY - 30;
    pileStock(g, 420, GY, 3, 92, { d: 6 });
    worker(g, 40, { GY, pose: 'stand', dir: 1 });
    R(g, X - 172, GY - 8, 344, 8, F('dark2'), { rx: 3 });
    for (const px of [X - 160, X - 60, X + 40, X + 140]) R(g, px, GY - 10, 20, 3, F('dark'));
    R(g, X - 168, fy, 336, 22, F('mach') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 3 });
    R(g, X - 168, fy + 15, 336, 4, F('mach3'));
    for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
      const bx = side < 0 ? X - 160 + col * 50 : X + 60 + col * 50, by = fy - (row + 1) * 14;
      R(g, bx, by, 48, 13, 'fill:url(#pr-pile)' + `;stroke:${v('conc2')};stroke-width:.8`, { rx: 1.5 });
    }
    for (const dx of [-32, 24]) R(g, X + dx, GY - 132, 8, 102, 'fill:url(#pr-mcyl)' + `;stroke:${v('mach3')};stroke-width:.6`);
    R(g, X - 40, GY - 136, 80, 12, F('mach') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 2 });
    // fülke
    const cx0 = X + 168;
    P(g, `M${cx0 - 2} ${fy} V${fy - 30} Q${cx0 - 2} ${fy - 33} ${cx0 + 1} ${fy - 33} H${cx0 + 22} L${cx0 + 26} ${fy}Z`, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`);
    P(g, `M${cx0 + 1} ${fy - 4} V${fy - 29} H${cx0 + 20.5} L${cx0 + 23.5} ${fy - 4}Z`, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:1`);
    C(g, cx0 + 10, fy - 17, 3, F('opr'));
    P(g, `M${cx0 + 4.5} ${fy - 6} Q${cx0 + 5.5} ${fy - 12} ${cx0 + 10} ${fy - 12} Q${cx0 + 14.5} ${fy - 12} ${cx0 + 15.5} ${fy - 6}Z`, F('opr'));
    tg(g, X - 110, fy - 60, 'ellensúly', { anchor: 'middle', to: [X - 110, fy - 42] });
  } else {
    // a korábban lehajtott cölöpök kiálló fejei, a földön a következők
    for (const x0 of [30, 78]) R(g, x0 - 3.6, GY - 9, 7.2, 9, 'fill:url(#pr-cyld)' + `;stroke:${v('hel3')};stroke-width:.6`);
    pileStock(g, 410, GY, 3, 90, { d: 5, pipe: true });
    worker(g, 162, { GY, pose: 'guide', s: 1.5 });
    worker(g, 130, { GY, pose: 'stand', s: 1.5 });
    tg(g, 56, GY - 40, 'lehajtott cölöpök', { anchor: 'middle', to: [30, GY - 9] });
  }
}
/** 3.2 – a négy behajtási mód animációja. s: a 520×268-as SVG, u: a mód indítása óta eltelt idő (s) */
export function driveScene(s, mode, u, labels = {}) {
  defs(); CUR.W = DRV.W;
  let st = s.__drv;
  TGF = fitTGF(s.getBoundingClientRect().width, DRV.W);
  if (!st || st.mode !== mode || st.tgf !== TGF) {
    while (s.firstChild) s.removeChild(s.firstChild);
    st = s.__drv = { mode, sg: g_(s), dg: g_(s), tgf: TGF };
    drvStatic(st.sg, mode, st);
  }
  const g = st.dg; while (g.firstChild) g.removeChild(g.firstChild);
  const res = mode === 'veres' ? drvVeres(g, u, st) : mode === 'vibro' ? drvVibro(g, u, st) : mode === 'sajto' ? drvSajto(g, u, st) : drvCsavar(g, u, st);
  txtD(g, DRV.W - 8, 18, labels.pen ? labels.pen(res.pen) : `behatolás ≈ ${res.pen.toFixed(1).replace('.', EN ? '.' : ',')} m`, 't-num halo', { 'text-anchor': 'end' });
  if (res.extra) txtD(g, DRV.W - 8, 34, res.extra, 't-sm halo', { 'text-anchor': 'end' });
  if (labels.name) txtD(g, DRV.W - 8, DRV.H - 10, labels.name, 't-big halo', { 'text-anchor': 'end' });
  return res;
}
/** 3.4 – vibrálás-labor bal oldala (300×330): daru kötelén lógó vibrátor, vasbeton cölöp csúccsal, rezgő talaj */
export function vibroLab(s, t, o) {
  defs(); CUR.W = 300;
  const cw = nestW(s), narrow = cw > 0 && cw < 260;
  TGF = fitTGF(cw, 300, 9, 1.35);
  while (s.firstChild) s.removeChild(s.firstChild);
  const g = g_(s), GY = 96, X = 132, SC = 24, Lp = 7 * SC;
  const kk = o.soil === 'agyag' ? 'clay' : o.soil === 'tomor' ? 'sand2' : 'sand';
  const M = { H: 330, GY, layers: [{ k: kk, y: GY }] };
  backdrop(g, M, 0, 300);
  const a = o.a, red = clamp01(1 - o.rr), jig = Math.sin(t * 60) * (1 + 2.5 * a);
  const head = 66 + o.pen * SC + jig, tip = head + Lp;
  // rezgő szemcsék a cölöp körül
  for (let i = 0; i < 70; i++) {
    const x0 = 10 + hash(i) * 280, y0 = GY + 8 + hash(i + 70) * 225, dd = Math.abs(x0 - X);
    if (dd < 14) continue;
    const amp = (1 + 5 * a) * Math.exp(-dd / 70);
    C(g, x0 + Math.sin(t * 55 + i * 1.7) * amp, y0 + Math.cos(t * 61 + i) * amp * 0.6, o.soil === 'agyag' ? 1.3 : 1.9, F('dark2', 0.45));
  }
  // a köpeny mentén átmenetileg „elfolyósodó” zóna – annál erősebb, minél jobban csökken az ellenállás
  if (o.soil !== 'agyag' && red > 0.05) R(g, X - 24, GY + 1, 48, Math.min(330, tip) - GY + 6, F('water', 0.06 + 0.22 * red), { rx: 18 });
  // köpenymenti ellenállás: annál több nyíl, minél nagyobb
  const n = Math.max(1, Math.round(4 * o.rr));
  for (let k = 0; k < 4; k++) { const y = GY + 34 + k * 46; if (k < n && y < tip - 20) for (const sx of [-1, 1]) arrowV(g, X + sx * 30, y + 12, y - 8, { c: 'push', w: 2, s: 6 }); }
  // daru kötele, vibrátor, cölöp csúccsal
  precast(g, X, head, tip, 9);
  const vu = vibroUnit(g, X, head + 6, t * o.f * 0.9, { w: 62, hb: 44, half: 9 });
  // daru horogblokkja és kötelei
  const hbY = vu.top - 12;
  Ln(g, X - 6, 0, X - 6, hbY, SK('rope', 1.3)); Ln(g, X + 6, 0, X + 6, hbY, SK('rope', 1.3));
  R(g, X - 10, hbY, 20, 10, F('crane2') + `;stroke:${v('crane3')};stroke-width:.8`, { rx: 2 });
  Ln(g, X, hbY + 10, X, vu.top, SK('dark', 2.2));
  hoseTo(g, X + 30, vu.mid, 300, 30, 30);
  tg(g, X - 42, vu.mid - 6, 'vibrátor', { anchor: 'end', to: [X - 31, vu.mid - 6] });
  if (!narrow) tg(g, X + 40, vu.ecc[1] + 30, 'forgó excentrikus tömegek', { to: [vu.ecc[0] + 4, vu.ecc[1] + 4] });
  if (tip < 322) tg(g, X + 34, tip - 6, 'cölöpcsúcs', { to: [X + 4, tip - 6] });
  if (!narrow) tg(g, 8, GY - 10, 'vasbeton cölöp', { to: [X - 9, GY - 8] });
}

/* ================================================================== 3.5 – rezgés a szomszédban */
/** Szomszéd épület: 'ipari' (vb. vázas csarnok), 'lakas' (kétszintes lakóház), 'mu' (műemlék templommal). x: a cölöp felőli homlokzat */
function nbBuilding(g, kind, x, GY, st) {
  const b = g_(g, { class: 'pr-nb' });
  if (kind === 'ipari') {
    const w = 150, h = 56;
    R(b, x, GY - h, w, h, F('steel1') + `;stroke:${v('steel3')};stroke-width:1`);
    for (let xx = x + 6; xx < x + w; xx += 6) Ln(b, xx, GY - h + 2, xx, GY, SK('steel2', 0.6));
    for (let xx = x; xx <= x + w; xx += 37.5) R(b, xx - 2, GY - h, 4, h, F('steel3'));
    P(b, `M${x - 4} ${GY - h} L${x + w / 2} ${GY - h - 9} L${x + w + 4} ${GY - h}Z`, F('steel3'));
    R(b, x + 12, GY - h + 8, w - 24, 6, 'fill:url(#pr-glass)');
    R(b, x + 48, GY - 34, 30, 34, F('steel2') + `;stroke:${v('steel3')};stroke-width:.8`);
    for (let yy = GY - 32; yy < GY; yy += 4) Ln(b, x + 48, yy, x + 78, yy, SK('steel3', 0.5));
    return { w, h: h + 9, wall: [x + 8, GY - 30], obs: [[x - 4, GY - h - 9, w + 8, h + 9]] };
  }
  if (kind === 'lakas') {
    const w = 78, h = 52;
    R(b, x, GY - h, w, h, F('wallh') + `;stroke:${v('wallh2')};stroke-width:.9`);
    R(b, x + w - 22, GY - h - 30, 8, 16, F('roof2'));
    P(b, `M${x - 7} ${GY - h} L${x + w / 2} ${GY - h - 28} L${x + w + 7} ${GY - h}Z`, F('roof') + `;stroke:${v('roof2')};stroke-width:.9`);
    for (let k = 1; k < 4; k++) Ln(b, x - 7 + k * 6.5, GY - h - k * 4.3, x + w + 7 - k * 6.5, GY - h - k * 4.3, SK('roof2', 0.6));
    Ln(b, x, GY - h / 2, x + w, GY - h / 2, SK('wallh2', 0.8));
    for (const [wx, wy] of [[x + 9, GY - h + 7], [x + 33, GY - h + 7], [x + 57, GY - h + 7], [x + 9, GY - 20], [x + 57, GY - 20]]) {
      R(b, wx, wy, 12, 12, 'fill:url(#pr-glass)' + `;stroke:${v('wallh2')};stroke-width:1`); Ln(b, wx + 6, wy, wx + 6, wy + 12, SK('wallh2', 0.7));
    }
    R(b, x + 33, GY - 22, 12, 22, F('timber2'));
    return { w, h: h + 28, wall: [x + 3, GY - 30], obs: [[x - 7, GY - h - 30, w + 14, h + 30]] };
  }
  // műemlék: templom toronnyal, íves ablakokkal, párkánnyal
  const w = 96, h = 54, tw = 24;
  R(b, x, GY - h, w, h, F('wallh') + `;stroke:${v('wallh2')};stroke-width:.9`);
  R(b, x - 2, GY - h - 3, w + 4, 4, F('wallh2'));
  P(b, `M${x + tw - 2} ${GY - h - 2} L${x + tw + (w - tw) / 2} ${GY - h - 24} L${x + w + 3} ${GY - h - 2}Z`, F('roof') + `;stroke:${v('roof2')};stroke-width:.9`);
  R(b, x, GY - h - 34, tw, h + 34, F('wallh') + `;stroke:${v('wallh2')};stroke-width:.9`);
  P(b, `M${x - 3} ${GY - h - 34} L${x + tw / 2} ${GY - h - 66} L${x + tw + 3} ${GY - h - 34}Z`, F('roof2'));
  Ln(b, x + tw / 2, GY - h - 66, x + tw / 2, GY - h - 74, SK('dark', 1.2)); Ln(b, x + tw / 2 - 3, GY - h - 71, x + tw / 2 + 3, GY - h - 71, SK('dark', 1.2));
  C(b, x + tw / 2, GY - h - 20, 5, F('steel1') + `;stroke:${v('wallh2')};stroke-width:.8`);
  for (const wx of [x + tw + 12, x + tw + 34, x + tw + 56]) P(b, `M${wx} ${GY - 12} V${GY - h + 18} a6 6 0 0 1 12 0 V${GY - 12}Z`, 'fill:url(#pr-glass)' + `;stroke:${v('wallh2')};stroke-width:1`);
  P(b, `M${x + 6} ${GY} V${GY - 16} a6 6 0 0 1 12 0 V${GY}Z`, F('timber2'));
  return { w, h: h + 74, wall: [x + tw + 4, GY - 26], obs: [[x - 3, GY - h - 74, tw + 6, h + 74], [x + tw - 2, GY - h - 24, w - tw + 5, h + 24]] };
}
/** 3.5 – a cölöpözés rezgése és a szomszéd épület. s: 660×200-as SVG. o: { tech, bld, r, v, u, lim, vtxt } */
export function vibScene(s, t, o) {
  defs(); CUR.W = 660;
  while (s.firstChild) s.removeChild(s.firstChild);
  const cw = nestW(s); TGF = fitTGF(cw, 660, 9, 1.8);
  const GY = 150, X0 = 150, g = g_(s);
  const M = { H: 200, GY, layers: [{ k: 'sand', y: GY }, { k: 'gravel', y: 186 }] };
  backdrop(g, M, 0, 660);
  // a rezgés erőssége (log-skálán): kos ≈ 1, talajcsavar ≈ 0
  const I = clamp01((Math.log10(Math.max(o.v10, 0.05)) + 1) / 2.2);
  const pulse = o.tech === 'vert', T = pulse ? 0.9 : o.tech === 'vibro' ? 0.22 : 0.6;
  const ph = (t % T) / T;
  // hullámfrontok a talajban (féltér, a cölöp tövéből)
  const src = GY + 34;
  for (let k = 0; k < (pulse ? 3 : 5); k++) {
    const age = pulse ? ph + k : ((t / T + k) % 5) / 5 * 3;
    const rr = 14 + age * (pulse ? 150 : 120); if (rr > 560) continue;
    const op = (0.15 + 0.6 * I) * Math.max(0, 1 - rr / 560) * (pulse ? Math.exp(-age * 0.6) : 1);
    const arc = `M${X0 - rr} ${GY + 1} A${rr} ${Math.min(rr * 0.42, 60)} 0 0 0 ${X0 + rr} ${GY + 1}`;
    P(g, arc, SK('push', 4 + 7 * I, `opacity:${(op * 0.22).toFixed(3)}`));
    P(g, arc, SK('push', 1 + 1.6 * I, `opacity:${Math.min(1, op * 1.25).toFixed(3)}`));
  }
  // felszíni hullám (a terep vonala kissé hullámzik): ütésnél hullámcsomag fut ki, vibrálásnál folyamatos
  const amp = 0.4 + 3.4 * I;
  let d = `M${X0 + 14} ${GY}`;
  for (let x = X0 + 14; x <= 664; x += 5) {
    const dx = x - X0, dec = Math.exp(-dx / 300);
    const y = pulse ? GY - amp * 1.6 * dec * Math.exp(-((dx - 14 - ph * 520) ** 2) / 1400) * Math.sin(dx / 7) : GY - amp * dec * Math.sin(dx / 14 - t * 34);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  P(g, d, SK('ground', 1.6));
  // gép (tükrözve: a gépház balra, a szomszéd jobbra) és a cölöp
  const mg = g_(g, { transform: `translate(${2 * X0} 0) scale(-1 1)` });
  const hit = pulse && ph < 0.12, jig = o.tech === 'vibro' ? Math.sin(t * 165) * 1.2 : 0;
  if (o.tech === 'vert') {
    const r = rig(mg, M, X0, { top: 10 });
    const head = GY - 58 + (hit ? 1.5 : 0);
    precast(mg, X0, head, GY + 40, 5);
    R(mg, X0 - 9, head - 7, 18, 7, F('dark2'), { rx: 1.5 });
    R(mg, X0 - 10, head - 49, 20, 42, F('mach') + `;stroke:${v('mach3')};stroke-width:.9`, { rx: 3 });
    R(mg, X0 - 10, head - 43, 20, 3, F('dark'));
    for (const yy of [head - 45, head - 15]) R(mg, X0 + 10, yy, r.mx - 6 - (X0 + 10), 4, F('dark2'));
    Ln(mg, X0, r.top, X0, head - 49, SK('rope', 1));
    if (ph < 0.35) for (const [dx, dy] of [[-12, 0], [12, -2], [-8, -5], [9, 4]]) C(mg, X0 + dx * (1 + ph * 3), head - 3 + dy, 2 + ph * 18, F('cloud', 0.7 * (1 - ph / 0.35)));
  } else if (o.tech === 'vibro') {
    const head = GY - 52 + jig;
    pipePile(mg, X0, head, GY + 40 + jig, 6);
    const vu = vibroUnit(mg, X0, head + 6, t * 25, { w: 30, hb: 24, half: 6 });
    excavator(mg, M, X0, vu.top - 1, { tool: 'mount', lift: 26 });
  } else if (o.tech === 'sajtolt') {
    const k = 0.5, sg = g_(mg, { transform: `translate(${X0} ${GY}) scale(${k}) translate(${-X0} ${-GY})` });
    R(sg, X0 - 172, GY - 8, 344, 8, F('dark2'), { rx: 3 });
    R(sg, X0 - 168, GY - 30, 336, 22, F('mach') + `;stroke:${v('mach3')};stroke-width:1.2`, { rx: 3 });
    for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) R(sg, side < 0 ? X0 - 160 + col * 50 : X0 + 60 + col * 50, GY - 30 - (row + 1) * 14, 48, 13, 'fill:url(#pr-pile)' + `;stroke:${v('conc2')};stroke-width:1`, { rx: 1.5 });
    for (const dx of [-32, 24]) R(sg, X0 + dx, GY - 132, 8, 102, 'fill:url(#pr-mcyl)');
    R(sg, X0 - 40, GY - 136, 80, 12, F('mach') + `;stroke:${v('mach3')};stroke-width:1.2`, { rx: 2 });
    const cyc = (t % 2.4) / 2.4, push = cyc < 0.6 ? ease(cyc / 0.6) : 1 - ease((cyc - 0.6) / 0.4);
    precast(sg, X0, GY - 110 + push * 4, GY + 80, 7);
    R(sg, X0 - 26, GY - 78 + push * 12, 52, 22, F('mach2') + `;stroke:${v('mach3')};stroke-width:1.2`, { rx: 3 });
    for (const dx of [-18, 18]) R(sg, X0 + dx - 2, GY - 124, 4, 46 + push * 12, F('steel1'));
  } else if (o.tech === 'csavar') {
    const ph2 = t * 6, top = GY - 30;
    excavator(mg, M, X0, top - 18, { tool: 'mount', lift: 24 });
    R(mg, X0 - 7, top - 18, 14, 14, F('dark2'), { rx: 2 });
    R(mg, X0 - 3, top - 4, 6, GY + 26 - top, 'fill:url(#pr-cyl)');
    for (let i = 0; i < 3; i++) { const yy = GY + 22 - i * 14; P(mg, `M${X0 - 9} ${yy} A9 2.4 0 0 0 ${X0 + 9} ${yy}`, SK('steel2', 2.4)); const a = ph2 + i; if (Math.sin(a) > -0.3) Ln(mg, X0 + 9 * Math.cos(a), yy - 2, X0 + 9 * Math.cos(a), yy + 2, SK('dark', 1.3)); }
  } else {
    // csavart (helyszíni) vagy CFA: fúrógép, kiszorító fej, illetve folyamatos spirál
    const r = rig(mg, M, X0, { top: 14, headY: GY - 92 });
    if (o.tech === 'csavart') dispTool(mg, X0, r.headBot, GY + 36, 9);
    else { auger(mg, X0, r.headBot, GY + 36, 9, { soilFrom: GY - 12, soilTo: GY + 34 }); guideFront(mg, M, X0, 9); spoil(mg, M, X0 - 40, 16, 5); }
  }
  // szomszéd épület: a távolság gyökös léptékben (2–60 m), a rezgéssel arányosan billeg; túllépésnél repedések
  const NBW = { ipari: 154, lakas: 85, mu: 99 };
  const bx = X0 + 96 + (660 - 8 - NBW[o.bld] - X0 - 96) * Math.pow(clamp01((o.r - 2) / 58), 0.6);
  const sh = Math.sin(t * (pulse ? 18 : 42)) * Math.min(1.8, o.u * 0.6) * (pulse ? Math.exp(-ph * 4) * 1.6 : 1);
  const bg = g_(g, { transform: `rotate(${sh.toFixed(3)} ${bx} ${GY})` });
  const B = nbBuilding(bg, o.bld, bx, GY, 0);
  if (o.u > 1) {
    const cx = bx + B.w * 0.55;
    P(bg, `M${cx} ${GY - B.h * 0.72} l-5 9 l6 6 l-6 11 l5 7`, SK('dark', 1.5, 'stroke-linejoin:round'));
    P(bg, `M${bx + B.w * 0.18} ${GY - 6} l6 -8 l-2 -7 l6 -6`, SK('dark', 1.3, 'stroke-linejoin:round'));
  }
  // rezgésmérő a homlokzaton, fölötte a mérőműszer kijelzője élő rezgésjellel
  const col = o.u > 1 ? '#e5534b' : o.u > 0.7 ? '#f0b429' : '#57c27a';
  R(g, B.wall[0] - 4, B.wall[1] - 3, 8, 6, F('dark'), { rx: 1 });
  C(g, B.wall[0], B.wall[1], 1.3, `fill:${col}`);
  const hit2 = (rx, ry, rw, rh) => B.obs.some(([ox, oy, ow, oh]) => rx < ox + ow + 4 && rx + rw > ox - 4 && ry < oy + oh + 4 && ry + rh > oy - 4);
  const top = Math.min(...B.obs.map((q) => q[1]));
  // a kijelző helye: az épület fölött, mellette vagy (templomnál) a hajó fölött; ha sehol nem fér el, kisebb méretben
  let m, MW, MH, mx, my;
  for (const k of [1, 0.86, 0.74, 0.64]) {
    m = Math.min(1.9, TGF) * k; MW = 136 * m; MH = 58 * m;
    const cand = [[bx + B.w / 2 - MW / 2, top - 10 - MH], [bx - MW - 14, 6], [bx + NBW[o.bld] + 14, 6]];
    if (B.obs.length > 1) cand.push([B.obs[1][0] + 6, B.obs[1][1] - 10 - MH], [B.obs[1][0] + B.obs[1][2] - MW, B.obs[1][1] - 10 - MH]);
    const ok = cand.find(([cx, cy]) => cx >= X0 + 28 && cx + MW <= 656 && cy >= 4 && !hit2(cx, cy, MW, MH));
    [mx, my] = ok || cand[0];
    if (ok) break;
  }
  mx = Math.max(X0 + 28, Math.min(656 - MW, mx)); my = Math.max(4, my);
  const ax = Math.max(mx + 10, Math.min(mx + MW - 10, B.wall[0]));
  Ln(g, B.wall[0], B.wall[1] - 3, ax, my + MH, SK('labline', 1, 'stroke-dasharray:3 2'));
  R(g, mx, my, MW, MH, `fill:#1c2530;stroke:${col};stroke-width:${1.4 * m}`, { rx: 6 * m });
  el('text', { x: mx + 8 * m, y: my + 12 * m, class: 'pr-tx', style: `font-size:${9 * m}px;fill:#9fb0c2;font-weight:600;letter-spacing:.04em`, text: 'rezgésmérő' }, g);
  C(g, mx + MW - 9 * m, my + 8.5 * m, 3 * m, `fill:${col}` + (o.u > 1 ? `;opacity:${0.45 + 0.55 * (Math.sin(t * 12) > 0)}` : ''));
  // jel: a legújabb pont jobbra, ~2 s-os ablak; a szaggatott vonal a határérték
  const tx0 = mx + 7 * m, tx1 = mx + MW - 7 * m, ty = my + 29 * m, th = 11 * m, N = 70, win = pulse ? 2.2 : 1.3;
  for (const sg2 of [-1, 1]) Ln(g, tx0, ty + sg2 * th * 0.78, tx1, ty + sg2 * th * 0.78, 'stroke:#e5534b;stroke-width:.8;stroke-dasharray:3 2;opacity:.75');
  Ln(g, tx0, ty, tx1, ty, 'stroke:#3b4a5a;stroke-width:.7');
  const A = th * 0.78 * Math.min(1.25, o.u), nz = (x) => Math.sin(x * 91.7) * 0.5 + Math.sin(x * 37.3) * 0.5;
  let tr = '';
  for (let i = 0; i < N; i++) {
    const tau = t - (N - 1 - i) * win / (N - 1);
    let sgl;
    if (pulse) { const age = ((tau % T) + T) % T; sgl = Math.exp(-age * 7) * Math.sin(age * 75); }
    else if (o.tech === 'vibro') sgl = Math.sin(tau * 2 * Math.PI * 7);
    else sgl = 0.55 * Math.sin(tau * 2 * Math.PI * 2.3) + 0.45 * nz(tau);
    const y = ty - Math.max(-th, Math.min(th, A * sgl + th * 0.05 * nz(tau * 3)));
    tr += `${i ? 'L' : 'M'}${(tx0 + (tx1 - tx0) * i / (N - 1)).toFixed(1)} ${y.toFixed(1)}`;
  }
  P(g, tr, `fill:none;stroke:${col};stroke-width:${1.3 * m};stroke-linejoin:round`);
  el('text', { x: mx + MW / 2, y: my + MH - 7 * m, 'text-anchor': 'middle', class: 'pr-tx', style: `font-size:${11 * m}px;fill:${col};font-weight:700`, text: `v ${/^[<>]/.test(o.vtxt) ? '' : '≈ '}${o.vtxt} mm/s` }, g);
  // távolság-méretvonal
  const my2 = GY + 24;
  Ln(g, X0, my2, bx, my2, SK('labline', 1.2)); for (const xx of [X0, bx]) Ln(g, xx, my2 - 5, xx, my2 + 5, SK('labline', 1.2));
  tg(g, (X0 + bx) / 2, my2, `r = ${o.r.toFixed(1).replace('.', EN ? '.' : ',')} m`, { anchor: 'middle' });
}

/* ================================================================== 3.6 – talajcsavar és csavartányéros cölöp */
// Méretarány: 1 m = CS.S px. A csavarok átmérője a láthatóság kedvéért túlzott.
const CS = { W: 520, H: 300, GY: 172, S: 45 };
const lerpN = (a, b, t) => a + (b - a) * t;
/** két szakaszos végtag inverz kinematikával; bend (+1/−1): a középső csukló az a→b szakasz melyik oldalára essen */
function ik2(ax, ay, bx, by, l1, l2, bend) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1e-6;
  if (d > l1 + l2 - 0.01) { const k = (l1 + l2 - 0.01) / d; dx *= k; dy *= k; d = l1 + l2 - 0.01; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = ax + (dx * a) / d, my = ay + (dy * a) / d;
  return [mx - (bend * dy * hh) / d, my + (bend * dx * hh) / d, ax + dx, ay + dy];
}
/**
 * Közeli munkás láthatósági mellényben (1 m = S px). o: { x: a csípő x-e, GY, S, face: +1 jobbra / −1 balra néz,
 * lean: a törzs előredőlése (fok), squat: 0–1 térdhajlítás, hands: [hátsó, első] kézpont vagy null, feet: [hátsó, első] x }
 */
function man(g, o) {
  const S = o.S ?? CS.S, GY = o.GY, f = o.face ?? 1, sq = o.squat ?? 0;
  const th = 0.46 * S, sh = 0.46 * S, to = 0.54 * S, ua = 0.31 * S, fa = 0.31 * S, hr = 0.105 * S;
  const hx = o.x, hipY = GY - 0.06 * S - (th + sh) * (1 - 0.45 * sq);
  const lean = ((o.lean ?? 4) * Math.PI) / 180;
  const shx = hx + f * Math.sin(lean) * to, shy = hipY - Math.cos(lean) * to;
  const w = g_(g, { class: 'pr-man' });
  const feet = o.feet ?? [hx - f * 0.1 * S, hx + f * 0.16 * S];
  const leg = (fx, col) => {
    const [kx, ky, ax, ay] = ik2(hx, hipY, fx, GY - 0.06 * S, th, sh, -f);
    P(w, `M${hx} ${hipY} L${kx} ${ky} L${ax} ${ay}`, SK(col, 0.15 * S, 'stroke-linecap:round;stroke-linejoin:round'));
    Ln(w, lerpN(kx, ax, 0.42), lerpN(ky, ay, 0.42), lerpN(kx, ax, 0.56), lerpN(ky, ay, 0.56), SK('refl', 0.152 * S));
    P(w, `M${ax - f * 0.05 * S} ${GY - 0.035 * S} h${f * 0.19 * S}`, SK('boot', 0.075 * S, 'stroke-linecap:round'));
  };
  const arm = (hand, back) => {
    const sx = shx - f * 0.02 * S, sy = shy + 0.05 * S;
    const tgt = hand || [sx + f * 0.06 * S, sy + 0.58 * S];
    const [ex, ey, wx, wy] = ik2(sx, sy, tgt[0], tgt[1], ua, fa, f);
    P(w, `M${sx} ${sy} L${ex} ${ey}`, SK(back ? 'shirt' : 'shirt', 0.11 * S, 'stroke-linecap:round'));
    P(w, `M${ex} ${ey} L${wx} ${wy}`, SK(back ? 'skin2' : 'skin', 0.085 * S, 'stroke-linecap:round'));
    C(w, wx, wy, 0.055 * S, F('glove'));
  };
  leg(feet[0], 'trous2');
  arm(o.hands && o.hands[0], true);
  leg(feet[1], 'trous');
  // törzs: mellény két fényvisszaverő csíkkal
  const nx = Math.cos(lean) * f, ny = Math.sin(lean);          // a törzs előre mutató normálisa
  const at = (t, s2) => [lerpN(hx, shx, t) + nx * s2, lerpN(hipY, shy, t) + ny * s2];
  const wf = [0.13, 0.17, 0.16, 0.11], wb = [0.13, 0.13, 0.13, 0.11], ts = [0, 0.38, 0.8, 1];
  const pts = [...ts.map((t, i) => at(t, wf[i] * S)), ...ts.slice().reverse().map((t, i) => at(t, -wb[3 - i] * S))];
  P(w, 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L') + 'Z', F('vest') + `;stroke:${v('vest2')};stroke-width:.9;stroke-linejoin:round`);
  for (const t of [0.28, 0.52]) { const a = at(t, 0.165 * S), b = at(t, -0.125 * S); Ln(w, a[0], a[1], b[0], b[1], SK('refl', 0.05 * S)); }
  // fej: nyak, arc, sisak (o.cap: baseballsapka)
  const hl = lean * 0.8, hx2 = shx + f * Math.sin(hl) * 0.2 * S, hy2 = shy - Math.cos(hl) * 0.2 * S;
  Ln(w, shx, shy, hx2, hy2 + 0.05 * S, SK('skin', 0.075 * S, 'stroke-linecap:round'));
  C(w, hx2, hy2, hr, F('skin'));
  P(w, `M${hx2 + f * hr * 0.92} ${hy2 - 0.02 * S} l${f * 0.032 * S} ${0.034 * S} l${-f * 0.03 * S} ${0.01 * S}Z`, F('skin'));
  const hc = o.cap ? 'trous' : 'helmet', hc2 = o.cap ? 'trous2' : 'helmet2';
  P(w, `M${hx2 - hr * 1.1} ${hy2 - 0.015 * S} Q${hx2 - hr * 1.05} ${hy2 - hr * 1.8} ${hx2} ${hy2 - hr * 1.8} Q${hx2 + hr * 1.05} ${hy2 - hr * 1.8} ${hx2 + hr * 1.1} ${hy2 - 0.015 * S}Z`, F(hc) + `;stroke:${v(hc2)};stroke-width:.7`);
  Ln(w, hx2 - f * hr * 1.15, hy2 - 0.015 * S, hx2 + f * hr * 1.7, hy2 - 0.015 * S, SK(hc, 0.035 * S, 'stroke-linecap:round'));
  arm(o.hands && o.hands[1], false);
  return { sh: [shx, shy], hip: [hx, hipY], head: [hx2, hy2] };
}

/** 1. változat – talajcsavar: horganyzott acélcső, alul kúpos, menetes csúcs, felül kerek fejlemez villás bekötéssel.
 *  top: a fejlemez síkja; L: a cső hossza a fejlemez alatt (px). A menetek a talajhoz rögzítettek (o.y0): csavaráskor
 *  a cső halad le rajtuk át – így a menet „helyben forog”, ahogy a valóságban látszik. */
function screwV1(g, cx, top, L, o = {}) {
  const S = o.S ?? CS.S, r0 = 0.085 * S, tip = top + L, cone = o.cone ?? 0.5 * L, yc = tip - cone, p = o.pitch ?? 0.2 * S, fw = 0.08 * S;
  const s = g_(g, { class: 'pr-screw1' });
  const rAt = (y) => Math.max(1, r0 * Math.pow(Math.max(0, tip - y) / cone, 0.8));
  const fl = (y) => fw * Math.min(1, (tip - y) / (0.25 * cone));
  const y0 = o.y0 ?? 0, Y = [];
  for (let y = y0 + Math.ceil((yc - p - y0) / p) * p; y < tip - 3; y += p) Y.push(y);
  const back = (y) => { const yy = y + p / 2, r = rAt(Math.max(yy, yc)) + fl(yy); return `M${cx + r} ${yy} Q${cx} ${yy + p / 4 - r * 0.32} ${cx - r} ${yy + p / 2}`; };
  const front = (y) => { const r = rAt(Math.max(y, yc)) + fl(y); return `M${cx - r} ${y} Q${cx} ${y + p / 4 + r * 0.32} ${cx + r} ${y + p / 2}`; };
  for (const y of Y) if (y + p / 2 < tip - 2) P(s, back(y), SK('steel3', 2.6, 'stroke-linecap:round'));
  R(s, cx - r0, top + 2, 2 * r0, yc - top - 2, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.6`);
  P(s, `M${cx - r0} ${yc} C${cx - r0} ${yc + cone * 0.45} ${cx - 1.4} ${tip - 6} ${cx} ${tip} C${cx + 1.4} ${tip - 6} ${cx + r0} ${yc + cone * 0.45} ${cx + r0} ${yc}Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.6`);
  for (const y of Y) { const d = front(y); P(s, d, SK('steel3', 3.2, 'stroke-linecap:round')); P(s, d, SK('steel1', 1.2, 'stroke-linecap:round')); }
  if (o.head !== false) {
    // kerek fejlemez és villás fej (U-kengyel) szemescsavarral
    E(s, cx, top + 2.2, r0 * 2.4, 2.4, F('steel3'));
    E(s, cx, top + 1, r0 * 2.4, 2.4, F('steel1') + `;stroke:${v('steel3')};stroke-width:.8`);
    const fx = r0 * 1.2, fh = 0.15 * S;
    P(s, `M${cx - fx - 2.2} ${top} V${top - fh} h3 V${top - 3.4} H${cx + fx - 0.8} V${top - fh} h3 V${top}Z`, F('steel1') + `;stroke:${v('steel3')};stroke-width:.8;stroke-linejoin:round`);
    C(s, cx, top - fh * 0.6, 2.4, `fill:none;stroke:${v('steel3')};stroke-width:1.4`);
    Ln(s, cx, top - fh * 0.6 + 2.4, cx, top - 3.4, SK('steel3', 1.6));
  }
  return { tip, yc, forkTop: top - 0.15 * S };
}

/** 2. változat – csavartányéros cölöp: egyenes acélszár, alján csavartányér, ferdén vágott csúcs. ph: elfordulás (rad) */
function screwV2(g, cx, top, L, ph, o = {}) {
  const S = o.S ?? CS.S, r0 = 0.1 * S, tip = top + L, rx = 0.3 * S, ry = (o.tilt ?? 0.08) * S, p = 0.17 * S;
  const s = g_(g, { class: 'pr-screw2' });
  const plates = (o.plates ?? [0.45]).map((k) => tip - k * S);
  // a tányér: egy menetnyi csavarfelület; a pontja a szögnél: x = rx·cos(a−ph), y = ry·sin(a−ph) + p·a/2π
  const pt = (yc, a) => [cx + rx * Math.cos(a - ph), yc + ry * Math.sin(a - ph) + (p * a) / (2 * Math.PI) - p / 2];
  const ri = r0 / rx;                                        // a szár sugara a tányér sugarához képest
  const ptI = (yc, a) => [cx + r0 * Math.cos(a - ph), yc + ry * ri * Math.sin(a - ph) + (p * a) / (2 * Math.PI) - p / 2];
  const segs = (wantFront) => {                              // a tányér elülső vagy hátsó része (a lépcsőnél megszakítva)
    const out = []; let cur = null;
    for (let k = 0; k <= 72; k++) { const a = (2 * Math.PI * k) / 72; if ((Math.sin(a - ph) > 0) === wantFront) { (cur = cur || []).push(a); } else if (cur) { out.push(cur); cur = null; } }
    if (cur) out.push(cur);
    return out;
  };
  const f1 = (q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  const plate = (yc, wantFront) => {
    for (const sg of segs(wantFront)) {
      if (sg.length < 2) continue;
      const outer = sg.map((a) => pt(yc, a)), inner = sg.map((a) => ptI(yc, a)).reverse();
      P(s, 'M' + outer.map(f1).join(' L') + ' L' + inner.map(f1).join(' L') + 'Z', wantFront ? 'fill:url(#pr-cylh)' : F('hel2'));
      const rim = 'M' + outer.map(f1).join(' L');
      P(s, rim, SK('hel3', wantFront ? 3.2 : 2.4, 'stroke-linecap:round;stroke-linejoin:round'));
      if (wantFront) P(s, rim, SK('hel1', 1, 'stroke-linecap:round;opacity:.9'));
    }
    // a tányér lépcsője: a kezdő és a záró él közti függőleges lap
    const isF = Math.sin(-ph) > 0;
    if (isF === wantFront) { const o1 = pt(yc, 0), o2 = pt(yc, 2 * Math.PI), i1 = ptI(yc, 0), i2 = ptI(yc, 2 * Math.PI); P(s, `M${f1(o1)} L${f1(o2)} L${f1(i2)} L${f1(i1)}Z`, F('hel3')); }
  };
  for (const yc of plates) plate(yc, false);
  R(s, cx - r0, top, 2 * r0, tip - top - 0.14 * S, 'fill:url(#pr-cyld)' + `;stroke:${v('hel3')};stroke-width:.7`);
  P(s, `M${cx - r0} ${tip - 0.14 * S} H${cx + r0} V${tip - 0.07 * S} L${cx - r0 * 0.3} ${tip} L${cx - r0} ${tip - 0.02 * S}Z`, 'fill:url(#pr-cyld)' + `;stroke:${v('hel3')};stroke-width:.7;stroke-linejoin:round`);
  for (const yc of plates) plate(yc, true);
  if (o.cap) {
    // négyzetes fejlemez hüvellyel (a szintre vágás után)
    R(s, cx - r0 - 1.5, top - 0.1 * S, 2 * r0 + 3, 0.16 * S, F('steel2') + `;stroke:${v('steel3')};stroke-width:.7`);
    P(s, `M${cx - 0.24 * S} ${top - 0.1 * S} L${cx - 0.2 * S} ${top - 0.1 * S - 3.2} H${cx + 0.2 * S} L${cx + 0.24 * S} ${top - 0.1 * S}Z`, F('steel1') + `;stroke:${v('steel3')};stroke-width:.8;stroke-linejoin:round`);
  }
  return { tip, plates, r0 };
}

/** Mérőállomás állványon (kitűzés) */
function totalStation(g, x, GY, S) {
  const t = g_(g, { class: 'pr-ts' }), hy = GY - 1.38 * S;
  for (const dx of [-0.32, 0.05, 0.3]) Ln(t, x, hy + 0.08 * S, x + dx * S, GY, SK(dx === 0.05 ? 'dark2' : 'mach2', 2.2, 'stroke-linecap:round'));
  R(t, x - 0.13 * S, hy, 0.26 * S, 0.08 * S, F('dark2'), { rx: 1 });
  P(t, `M${x - 0.1 * S} ${hy} V${hy - 0.26 * S} H${x + 0.1 * S} V${hy}Z`, F('ts') + `;stroke:${v('ts2')};stroke-width:.8`);
  R(t, x - 0.07 * S, hy - 0.2 * S, 0.14 * S, 0.11 * S, F('dark'), { rx: 1.5 });
  R(t, x - 0.16 * S, hy - 0.2 * S, 0.06 * S, 0.1 * S, F('dark2'), { rx: 1 });
  C(t, x + 0.1 * S, hy - 0.15 * S, 0.035 * S, F('glass2'));
  return [x - 0.16 * S, hy - 0.15 * S];
}
/** A lehajtás helyén festett kitűzési kereszt */
function markX(g, x, GY, S) { P(g, `M${x - 0.22 * S} ${GY - 1} L${x + 0.22 * S} ${GY + 1.4} M${x - 0.18 * S} ${GY + 1.6} L${x + 0.18 * S} ${GY - 1.2}`, SK('mark', 2.4, 'stroke-linecap:round')); }

function csScene(g, mode, u, st) {
  const { GY, S, W } = CS;
  const res = { pen: 0 };
  if (mode === 'kez' || mode === 'gep') {
    // ---- 1. változat, talajcsavar: kézzel (T-rúd, két ember körbejár) vagy kisebb géppel (kézi forgatógép, tápegység)
    const X = mode === 'kez' ? 262 : 270, L = 2 * S, p = 0.2 * S;
    const T0 = 1, T1 = mode === 'kez' ? 13.5 : 9.5, k = ease(clamp01((u - T0) / (T1 - T0)) * 0.98 + 0.01);
    const top0 = GY - (mode === 'kez' ? 0.95 : 0.85) * S, top1 = GY - 0.04 * S, top = lerpN(top0, top1, clamp01((u - T0) / (T1 - T0)));
    const turning = u > T0 && u < T1, done = u >= T1;
    const rev = (GY - 0 - top) / p;                                      // elfordulás a csúszásmentes menetből
    const th = -(top - top0) / p * 2 * Math.PI;                           // a fej elfordulása (rad)
    res.pen = (top + L - GY) / S;
    void k; void rev;
    if (mode === 'kez') {
      // fehér hajtószár a villán, rajta a T-rúd; a rúd vége ellipszisen jár körbe
      const yb = top - 0.15 * S - 0.32 * S, R0 = 0.62 * S, Rb = 0.95 * S;
      const ends = [0, Math.PI].map((a0) => { const a = th + a0; return { a, x: X + R0 * Math.cos(a), y: yb + 0.07 * S * Math.sin(a), z: Math.sin(a), bx: X + Rb * Math.cos(a) }; });
      const people = ends.map((e, i) => {
        const fz = e.z, walk = Math.sin(e.a) * -1;
        const face = Math.abs(Math.cos(e.a)) > 0.25 ? (e.x > e.bx ? 1 : -1) : walk > 0 ? 1 : -1;
        const stride = 0.17 * S * Math.abs(Math.sin(e.a)) * (turning ? Math.sin(th * 2 + i) : 0.3);
        const sq = clamp01((yb - (GY - 1.25 * S)) / (0.9 * S));
        return { e, z: fz, draw: (gg) => man(gg, { x: e.bx, GY: GY + fz * 2, face, lean: 14 + 30 * sq, squat: sq * 0.7, feet: [e.bx - face * 0.12 * S - stride, e.bx + face * 0.14 * S + stride], hands: [[e.x - face * 0.05 * S, e.y], [e.x - face * 0.17 * S, e.y + 0.01 * S]], cap: i === 1 }) };
      });
      const backP = people.filter((q) => q.z < 0), frontP = people.filter((q) => q.z >= 0);
      backP.forEach((q) => q.draw(g));
      const sv = screwV1(g, X, top, L, { y0: GY, pitch: p });
      // hajtószár és T-rúd
      R(g, X - 0.075 * S, yb - 0.06 * S, 0.15 * S, sv.forkTop + 0.06 * S - yb + 0.06 * S, 'fill:url(#pr-tcyl)' + `;stroke:${v('tool2')};stroke-width:.8`, { rx: 1.5 });
      const [a, b] = ends;
      P(g, `M${a.x} ${a.y} L${b.x} ${b.y}`, SK('tool2', 0.1 * S + 1.6, 'stroke-linecap:round')); P(g, `M${a.x} ${a.y} L${b.x} ${b.y}`, SK('tool', 0.1 * S, 'stroke-linecap:round'));
      if (done) {
        // ellenőrzés: oszlopvízmérték a hajtószáron
        R(g, X + 0.075 * S, yb + 0.06 * S, 0.12 * S, 0.24 * S, F('plvl'), { rx: 1.5 });
        R(g, X + 0.095 * S, yb + 0.1 * S, 0.08 * S, 0.06 * S, F('glass1'), { rx: 1 });
      }
      frontP.forEach((q) => q.draw(g));
      if (turning) spin(g, X, yb + 0.22 * S, 0.5 * S);
      const le = a.x < b.x ? a : b;
      tg(g, X - 1.55 * S, 40, 'T-rúd', { anchor: 'end', to: [lerpN(X, le.x, 0.7), lerpN(yb, le.y, 0.7)] });
      tg(g, W - 10, GY + 0.95 * S, EN ? 'ground screw' : 'talajcsavar', { anchor: 'end', to: [X + 0.1 * S, Math.min(GY + 0.5 * S, (top + sv.tip) / 2)] });
      tg(g, W - 10, GY + 1.45 * S, 'kúpos, menetes csúcs', { anchor: 'end', to: [X + 0.12 * S, Math.max(GY + 0.3 * S, sv.yc + 0.3 * S)] });
      if (done) tg(g, X + 1.2 * S, 52, 'vízmérték', { to: [X + 0.2 * S, yb + 0.16 * S] });
    } else {
      // kisebb géppel: kézi hidraulikus forgatógép a fejen, reakciókar a földhöz, tömlők a tápegységig
      const fork = top - 0.15 * S, db = fork + 0.02 * S, dh = 0.34 * S, dt = db - dh, hy = dt + 0.1 * S;
      const pack = 52, stake = X + 1.75 * S;
      // tápegység (motor, olajtartály, kerekek)
      R(g, pack - 0.42 * S, GY - 0.62 * S, 0.84 * S, 0.5 * S, F('drv') + `;stroke:${v('drv2')};stroke-width:.9`, { rx: 3 });
      R(g, pack - 0.34 * S, GY - 0.8 * S, 0.5 * S, 0.2 * S, F('dark2'), { rx: 2 });
      for (let i = 0; i < 5; i++) Ln(g, pack + 0.02 * S + i * 0.06 * S, GY - 0.55 * S, pack + 0.02 * S + i * 0.06 * S, GY - 0.25 * S, SK('drv2', 1.2));
      for (const wx of [pack - 0.28 * S, pack + 0.28 * S]) { C(g, wx, GY - 0.11 * S, 0.11 * S, F('dark')); C(g, wx, GY - 0.11 * S, 0.04 * S, F('steel2')); }
      // reakciókar
      Ln(g, stake, GY + 0.12 * S, stake, GY - 0.35 * S, SK('timber2', 0.09 * S, 'stroke-linecap:round'));
      Ln(g, X + 0.1 * S, hy + 0.04 * S, stake - 0.04 * S, GY - 0.28 * S, SK('dark', 0.07 * S, 'stroke-linecap:round'));
      Ln(g, X + 0.1 * S, hy + 0.04 * S, stake - 0.04 * S, GY - 0.28 * S, SK('steel2', 0.025 * S, 'stroke-linecap:round'));
      const sv = screwV1(g, X, top, L, { y0: GY, pitch: p });
      hoseTo(g, X - 0.1 * S, dt + 0.04 * S, pack + 0.2 * S, GY - 0.62 * S, Math.max(10, GY - 6 - dt));
      hoseTo(g, X - 0.04 * S, dt + 0.02 * S, pack + 0.3 * S, GY - 0.62 * S, Math.max(12, GY - 2 - dt));
      // a forgatógép: hajtómű, motor, két fogantyú
      R(g, X - 0.12 * S, db - 0.1 * S, 0.24 * S, 0.12 * S, F('dark2') + `;stroke:${v('dark')};stroke-width:.7`, { rx: 1 });
      R(g, X - 0.16 * S, dt, 0.32 * S, dh - 0.1 * S, 'fill:url(#pr-dcyl)' + `;stroke:${v('drv2')};stroke-width:.9`, { rx: 3 });
      R(g, X - 0.07 * S, dt - 0.1 * S, 0.14 * S, 0.11 * S, F('dark2'), { rx: 1.5 });
      Ln(g, X - 0.16 * S, hy, X - 0.5 * S, hy - 0.02 * S, SK('dark', 0.06 * S, 'stroke-linecap:round'));
      R(g, X - 0.56 * S, hy - 0.06 * S, 0.12 * S, 0.08 * S, F('glove'), { rx: 2 });
      const sq = clamp01((GY - 1.05 * S - hy) / (-0.75 * S));
      man(g, { x: X - 0.95 * S, GY, face: 1, lean: 12 + 34 * sq, squat: sq * 0.85, hands: [[X - 0.5 * S, hy - 0.01 * S], [X - 0.08 * S, hy + 0.01 * S]] });
      if (turning) spin(g, X, db + 0.08 * S, 0.32 * S);
      tg(g, X + 0.6 * S, 48, 'kézi forgatógép', { to: [X + 0.12 * S, dt + 0.1 * S] });
      tg(g, 18, 48, 'hidraulikus tápegység', { to: [pack - 0.1 * S, GY - 0.7 * S] });
      tg(g, W - 10, 84, 'reakciókar', { anchor: 'end', to: [lerpN(X, stake, 0.72), lerpN(hy, GY - 0.28 * S, 0.72)] });
      tg(g, W - 10, GY + 0.95 * S, EN ? 'ground screw' : 'talajcsavar', { anchor: 'end', to: [X + 0.1 * S, Math.min(GY + 0.5 * S, (top + sv.tip) / 2)] });
    }
    if (done) tg(g, X - 0.4 * S, GY + 1.25 * S, EN ? 'installed: head plate at ground level' : 'lehajtva: a fejlemez a terepen', { anchor: 'end', to: [X - 0.2 * S, GY - 0.02 * S] });
    return res;
  }
  // ---- 2. változat, csavartányéros cölöp: kitűzés mérőállomással, lehajtás kotróra szerelt forgatófejjel, fejlemez
  const X = 214, L = 2.2 * S, Tp = 1.6, Td = 11.2, Tc = 12.6;
  const topA = GY - L - 0.02 * S, topB = GY - 0.3 * S;
  const kd = clamp01((u - Tp) / (Td - Tp)), top = lerpN(topA, topB, kd);
  const turning = u > Tp && u < Td, ph = ((top - topA) / (0.17 * S)) * 2 * Math.PI;
  res.pen = Math.max(0, (top + L - GY) / S);
  // kitűzés: mérőállomás és kezelője
  const TSX = 80, eye = totalStation(g, TSX, GY, S);
  man(g, { x: TSX - 0.62 * S, GY, face: 1, lean: 26, squat: 0.15, hands: [[TSX + 2 - 0.05 * S, GY - 1.5 * S], [TSX + 2 + 0.02 * S, GY - 1.46 * S]] });
  if (u < Td) {
    P(g, `M${eye[0] + 0.3 * S} ${eye[1]} L${X} ${GY - 0.02 * S}`, SK('mark', 1, 'stroke-dasharray:3 3;opacity:.8'));
    markX(g, X, GY, S);
  }
  // a gép és a cölöp
  const attached = u < Tc, lift = attached ? 0 : ease(clamp01((u - Tc) / 1.2)) * 0.9 * S;
  const sleeveB = top + 0.32 * S, mot = 0.62 * S, motTop = top - mot - lift, mountY = motTop - 0.04 * S;
  const k = 1.9, ax = X + 150, lx = ax + (X - ax) / k, ly = GY + (mountY - GY) / k;
  const ex = g_(g, { transform: `translate(${ax} ${GY}) scale(${k}) translate(${-ax} ${-GY})` });
  excavator(ex, { GY, H: CS.H }, lx, ly, { tool: 'mount', lift: lerpN(10, 26, clamp01((mountY - 40) / 110)), reach: 50 });
  screwV2(g, X, top, L, ph, { cap: u > Tc + 1.2 });
  // forgatófej: hidraulikus motor, hajtómű, hüvely csapszeggel
  const fy = motTop;
  R(g, X - 0.2 * S, fy, 0.4 * S, mot * 0.62, F('dark2') + `;stroke:${v('dark')};stroke-width:.9`, { rx: 3 });
  R(g, X - 0.2 * S, fy + mot * 0.16, 0.4 * S, 0.05 * S, F('mach'));
  R(g, X - 0.26 * S, fy + mot * 0.6, 0.52 * S, 0.1 * S, F('dark') + `;stroke:${v('dark2')};stroke-width:.6`, { rx: 1.5 });
  R(g, X - 0.14 * S, fy + mot * 0.7, 0.28 * S, mot * 0.3 + 0.32 * S - (attached ? 0 : 0), 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.7`, { rx: 1 });
  if (attached) { Ln(g, X - 0.2 * S, sleeveB - 0.14 * S, X + 0.2 * S, sleeveB - 0.14 * S, SK('dark', 2.4, 'stroke-linecap:round')); }
  hoseTo(g, X + 0.18 * S, fy + 0.06 * S, X + 0.62 * S, fy - 0.5 * S, 6);
  hoseTo(g, X + 0.12 * S, fy + 0.04 * S, X + 0.7 * S, fy - 0.42 * S, 10);
  if (turning) spin(g, X, top + 0.6 * S, 0.42 * S);
  // feliratok
  tg(g, 14, 26, 'mérőállomás', { to: [TSX, GY - 1.5 * S] });
  tg(g, X - 0.6 * S, 64, 'forgatófej', { anchor: 'end', to: [X - 0.2 * S, fy + mot * 0.3] });
  tg(g, W - 10, GY + 0.9 * S, 'csavartányéros cölöp', { anchor: 'end', to: [X + 0.1 * S, Math.min(top + L * 0.62, GY + 1.3 * S)] });
  tg(g, W - 10, GY + 1.6 * S, 'csavartányér', { anchor: 'end', to: [X + 0.3 * S, top + L - 0.45 * S] });
  if (u > Tc + 1.2) tg(g, X + 0.5 * S, GY + 0.42 * S, EN ? 'head plate' : 'fejlemez', { to: [X + 0.22 * S, top - 0.08 * S] });
  return res;
}
/** 3.6 – a két változat felépítése (álló kép). Széles nézetben 760×300, egymás mellett; keskenyen 380×600, egymás alatt. */
export function screwParts(s) {
  defs();
  const cw = s.getBoundingClientRect().width, narrow = cw > 0 && cw < 600;
  const W = narrow ? 380 : 760, H = narrow ? 600 : 300;
  s.setAttribute('viewBox', `0 0 ${W} ${H}`);
  CUR.W = W; TGF = fitTGF(cw, W, 9.5, 1.8);
  while (s.firstChild) s.removeChild(s.firstChild);
  const S = 64, GY = narrow ? 104 : 112;
  const M = { H: 300, GY, layers: [{ k: 'fill', y: GY }, { k: 'clay', y: GY + 40 }] };
  const title = (g, x, n, t, anchor) => {
    const fs = 14 * TGF, tw = t.length * fs * 0.56, rb = 10 * Math.min(1.4, TGF);
    const x0 = anchor === 'start' ? x + 2 * rb + 4 : x - tw / 2 + rb + 2;
    C(g, x0 - rb - 4, 22, rb, `fill:var(--grp);stroke:${v('halo')};stroke-width:2`);
    el('text', { x: x0 - rb - 4, y: 22 + rb * 0.44, 'text-anchor': 'middle', class: 'pr-num', style: `font-size:${12 * Math.min(1.4, TGF)}px`, text: String(n) }, g);
    txtD(g, x0, 22 + fs * 0.36, t, 't-lab halo', { style: `font-size:${fs}px;font-weight:700` });
  };
  const gA = g_(s), gB = narrow ? g_(s, { transform: 'translate(0 300)' }) : gA;
  backdrop(gA, M, 0, W); if (narrow) backdrop(gB, M, 0, W);
  const X1 = narrow ? 112 : 250, X2 = narrow ? 112 : 520;
  const v1 = screwV1(gA, X1, GY - 3, 2 * S, { S, y0: GY - 3, pitch: 0.16 * S, cone: 0.55 * 2 * S });
  const v2 = screwV2(gB, X2, GY - 0.3 * S, 2.65 * S, 0.9, { S, cap: true, tilt: 0.12 });
  const t1 = EN ? 'ground screw' : 'talajcsavar', t2 = 'csavartányéros cölöp';
  if (narrow) {
    title(gA, 14, 1, t1, 'start'); title(gB, 14, 2, t2, 'start');
    const lx = X1 + 0.9 * S;
    tg(gA, lx, 52, 'villás fejlemez', { to: [X1 + 0.12 * S, v1.forkTop + 4] });
    tg(gA, lx, GY + 0.45 * S, 'horganyzott acélcső', { to: [X1 + 0.08 * S, GY + 0.45 * S] });
    tg(gA, lx, GY + 1.6 * S, 'kúpos, menetes csúcs', { to: [X1 + 0.12 * S, GY + 1.5 * S] });
    tg(gB, lx, 52, EN ? 'head plate' : 'fejlemez', { to: [X2 + 0.22 * S, GY - 0.36 * S] });
    tg(gB, lx, GY + 0.9 * S, 'egyenes acélszár', { to: [X2 + 0.1 * S, GY + 0.9 * S] });
    tg(gB, lx, GY + 1.95 * S, 'csavartányér', { to: [X2 + 0.3 * S, v2.plates[0]] });
    tg(gB, lx, GY + 2.5 * S, 'ferdén vágott csúcs', { to: [X2 + 0.04 * S, v2.tip - 0.06 * S] });
    return;
  }
  title(gA, X1, 1, t1, 'middle'); title(gA, X2, 2, t2, 'middle');
  tg(gA, X1 - 0.75 * S, 54, 'villás fejlemez', { anchor: 'end', to: [X1 - 0.12 * S, v1.forkTop + 4] });
  tg(gA, X1 - 0.75 * S, GY + 0.45 * S, 'horganyzott acélcső', { anchor: 'end', to: [X1 - 0.08 * S, GY + 0.45 * S] });
  tg(gA, X1 - 0.75 * S, GY + 1.75 * S, 'kúpos, menetes csúcs', { anchor: 'end', to: [X1 - 0.1 * S, GY + 1.6 * S] });
  tg(gA, X2 + 0.75 * S, 54, EN ? 'head plate' : 'fejlemez', { to: [X2 + 0.22 * S, GY - 0.36 * S] });
  tg(gA, X2 + 0.75 * S, GY + 0.9 * S, 'egyenes acélszár', { to: [X2 + 0.1 * S, GY + 0.9 * S] });
  tg(gA, X2 + 0.75 * S, GY + 2.0 * S, 'csavartányér', { to: [X2 + 0.3 * S, v2.plates[0]] });
  tg(gA, X2 + 0.75 * S, GY + 2.55 * S, 'ferdén vágott csúcs', { to: [X2 + 0.04 * S, v2.tip - 0.06 * S] });
}
/** 3.6 – a talajcsavar és a csavartányéros cölöp lehajtása. mode: 'kez' | 'gep' | 'munkagep'; u: idő (s) */
export function screwScene(s, mode, u, labels = {}) {
  defs(); CUR.W = CS.W;
  TGF = fitTGF(nestW(s), CS.W);
  let st = s.__cs;
  if (!st || st.mode !== mode || st.tgf !== TGF) {
    while (s.firstChild) s.removeChild(s.firstChild);
    st = s.__cs = { mode, sg: g_(s), dg: g_(s), tgf: TGF };
    const M = mode === 'munkagep' ? { H: CS.H, GY: CS.GY, layers: [{ k: 'sand', y: CS.GY }, { k: 'clay', y: CS.GY + 64 }] } : { H: CS.H, GY: CS.GY, layers: [{ k: 'fill', y: CS.GY }, { k: 'clay', y: CS.GY + 30 }] };
    backdrop(st.sg, M, 0, CS.W);
  }
  const g = st.dg; while (g.firstChild) g.removeChild(g.firstChild);
  const res = csScene(g, mode, u, st);
  txtD(g, CS.W - 8, 18, `behatolás ≈ ${res.pen.toFixed(1).replace('.', EN ? '.' : ',')} m`, 't-num halo', { 'text-anchor': 'end' });
  if (labels.name) txtD(g, CS.W - 8, CS.H - 10, labels.name, 't-big halo', { 'text-anchor': 'end' });
  return res;
}

/* ================================================================== 5.1 – fúrófejek munkaciklusa (animált jelenet, 600×360)
   Rövid spirál és dobfúró Kelly-rúdon, folyamatos (CFA) spirál, kötélen függő markoló béléscsőben (daru). A jelenet minden képkockán az u (s) időből számolódik, így ugrálás és felhalmozódó állapot nélkül fut. */
const TS = { W: 600, H: 360 };
const TSM = {
  rovid: { GY: 168, cyc: 6.8, n: 5, step: 32, layers: [{ k: 'fill', y: 168 }, { k: 'clay', y: 184 }, { k: 'clay2', y: 286 }],
    labs: [[176, 'feltöltés'], [226, 'kemény, kötött talaj'], [254, 'nincs talajvíz'], [312, 'kemény agyag']] },
  cfa: { GY: 188, cyc: 13.4, n: 1, layers: [{ k: 'fill', y: 188 }, { k: 'clay', y: 204 }, { k: 'sand', y: 272 }], gw: 252,
    labs: [[196, 'feltöltés'], [238, EN ? 'silty clay' : 'iszapos agyag'], [300, EN ? 'sand' : 'homok']] },
  marko: { GY: 218, cyc: 6.6, n: 4, step: 20, layers: [{ k: 'fill', y: 218 }, { k: 'sand', y: 234 }, { k: 'gravel', y: 300 }], gw: 262,
    labs: [[226, 'feltöltés'], [250, EN ? 'sand' : 'homok'], [312, EN ? 'sandy gravel' : 'homokos kavics']] },
  dob: { GY: 168, cyc: 6.4, n: 5, step: 28, layers: [{ k: 'fill', y: 168 }, { k: 'sand2', y: 186 }, { k: 'gravel', y: 262 }], gw: 208,
    labs: [[176, 'feltöltés'], [200, EN ? 'sand' : 'homok'], [290, EN ? 'sandy gravel' : 'homokos kavics']] },
};
/** egy teljes lejátszás hossza (s) eszközönként: a ciklusok és a végén egy rövid kitartás */
export const TOOL_LOOP = Object.fromEntries(Object.entries(TSM).map(([k, m]) => [k, m.cyc * m.n + 1.6]));
const lerp2 = (a, b, t) => a + (b - a) * t;
const seg01 = (u, a, b) => clamp01((u - a) / (b - a));
const fmtM = (m) => m.toFixed(1).replace('.', EN ? '.' : ',');
const tgs = (g, x, y, t, o = {}) => tag(g, x, y, t, { fs: 11 * TGF, ...o });

/** Forgó, rövid vagy folyamatos spirál (ph: elfordulás fordulatban – a menetek a forgással lefelé vándorolnak) */
function augerR(g, cx, top, bot, half, ph, o = {}) { return augerDraw(g, cx, top, bot, half, { ...o, ph }); }
/** Dobfúró metszetben: acélpalást, belül a felvett talaj (fill 0–1), fogazott fenéklap, amely a bal oldali csuklón lenyílik (flap 0–1) */
function bucketR(g, cx, bot, half, fill, flap, ph, soil = 'sand2') {
  const hh = 36, y0 = bot - hh, b = g_(g, { class: 'pr-bucket' });
  R(b, cx - 5, y0 - 9, 10, 9, F('steel3'), { rx: 1.5 });
  R(b, cx - half, y0, half * 2, hh - 5, F('bore'));
  if (fill > 0.01) {
    const [col, pat] = SOIL[soil], fy = bot - 6 - (hh - 12) * fill;
    R(b, cx - half + 3, fy, half * 2 - 6, bot - 5 - fy, F(col)); R(b, cx - half + 3, fy, half * 2 - 6, bot - 5 - fy, `fill:url(#${pat})`);
  }
  R(b, cx - half, y0, 3.4, hh - 5, 'fill:url(#pr-cyl)'); R(b, cx + half - 3.4, y0, 3.4, hh - 5, 'fill:url(#pr-cyl)');
  R(b, cx - half - 1, y0, half * 2 + 2, 4.5, F('steel3'), { rx: 1 });
  // forgás: a palást hegesztett bordái körbejárnak
  for (let k = 0; k < 3; k++) { const a = ph * Math.PI * 2 + (k * Math.PI * 2) / 3, xx = cx + half * 0.82 * Math.sin(a); if (Math.cos(a) > 0) Ln(b, xx, y0 + 5, xx, bot - 7, SK('steel3', 1.3, 'opacity:.75')); }
  // fenéklap a bal csuklón
  const ang = flap * 72, f = g_(b, { transform: `rotate(${ang} ${cx - half} ${bot - 4})` });
  R(f, cx - half - 1, bot - 5.5, half * 2 + 2, 3.6, F('steel3'));
  for (let i = 0; i < 5; i++) P(f, `M${(cx - half + 2 + (i * (half * 2 - 4)) / 4 - 2).toFixed(1)} ${bot - 2} l2 5.4 l2 -5.4z`, F('dark2'));
  C(b, cx - half, bot - 4, 2, F('dark2'));
  return b;
}
/** Kötélen függő hengeres markoló (kalapácsmarkoló): nehéz csőtest, alul két kagyló közös csuklón (open 0–1), benne a talaj (full 0–1) */
function grabR(g, cx, bot, half, open, full, soil = 'sand') {
  const b = g_(g, { class: 'pr-hgrab' }), py = bot - 24, bw = half * 0.86;
  R(b, cx - 3, py - 66, 6, 8, F('dark2'), { rx: 1 });
  E(b, cx, py - 68, 4.4, 3.4, `fill:none;stroke:${v('dark')};stroke-width:1.8`);
  R(b, cx - bw, py - 58, bw * 2, 46, 'fill:url(#pr-mcyl)' + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 3 });
  R(b, cx - bw, py - 58, bw * 2, 5, F('mach2'), { rx: 2 });
  R(b, cx - bw, py - 34, bw * 2, 4, F('mach2'));
  for (const dx of [-bw * 0.5, bw * 0.5]) Ln(b, cx + dx, py - 52, cx + dx, py - 14, SK('mach3', 1, 'opacity:.7'));
  R(b, cx - bw + 4, py - 14, bw * 2 - 8, 9, F('dark2'), { rx: 2 });
  const shell = (s) => `M${cx} ${py} L${cx + s * half} ${py} Q${cx + s * half} ${bot} ${cx + s * 1.2} ${bot} L${cx} ${bot}Z`;
  const ang = open * 38;
  if (full > 0.02 && open < 0.35) {
    const [col, pat] = SOIL[soil];
    const sd = `M${cx - half + 3} ${py + 3} Q${cx - half + 3} ${bot - 3} ${cx} ${bot - 3} Q${cx + half - 3} ${bot - 3} ${cx + half - 3} ${py + 3}Z`;
    P(b, sd, F(col)); P(b, sd, `fill:url(#${pat})`);
  }
  for (const s of [-1, 1]) {
    const j = g_(b, { transform: `rotate(${-s * ang} ${cx} ${py})` });
    P(j, shell(s), 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:1`);
    P(j, `M${cx + s * (half - 2)} ${py + 3} Q${cx + s * (half - 2)} ${bot - 3} ${cx + s * 3} ${bot - 3}`, SK('steel3', 1, 'opacity:.6'));
    P(j, `M${cx + s * (half - 1)} ${py + 8} Q${cx + s * (half - 1)} ${bot - 1} ${cx + s * 1.4} ${bot - 0.6}`, SK('dark2', 1.8, 'fill:none;stroke-linecap:round'));
  }
  C(b, cx, py, 3.2, F('dark')); C(b, cx, py, 1.2, F('steel1'));
  return { top: py - 68 };
}
/** röppenő földrög */
const clod = (g, x, y, r, k = 'clay', rot = 0) => E(g, x, y, r, r * 0.72, F(SOIL[k][0]) + `;stroke:${v('layer')};stroke-width:.6`, { transform: `rotate(${rot} ${x} ${y})` });

/* ---------- statikus háttér (eszközönként egyszer) */
function toolStatic(g, mode, st) {
  const m = TSM[mode], M = { H: TS.H, GY: m.GY, gw: m.gw, layers: m.layers };
  st.M = M;
  backdrop(g, M, 0, TS.W);
  m.labs.forEach(([y, t]) => tgs(g, TS.W - 8, y, t, { anchor: 'end' }));
  if (m.gw) tgs(g, TS.W - 8, m.gw + 13, 'talajvíz', { anchor: 'end' });
}

/* ---------- 1. rövid spirál Kelly-rúdon */
function tsRovid(g, st, u) {
  const M = st.M, GY = M.GY, X = 236, half = 15, LA = 52, m = TSM.rovid, N = m.n, CY = m.cyc, STEP = m.step, HANG = GY - 40, SL = 58;
  const done = u >= N * CY, k = done ? N - 1 : Math.floor(u / CY), tau = done ? CY : u - k * CY, D0 = GY + k * STEP;
  let bot = HANG, dep = D0 + STEP, fill = 0, ph = 0, phs = 6, spinK = -1, sl = 0;
  if (done) phs = 7;
  else if (tau < 1.0) { bot = lerp2(HANG, D0, ease(tau)); dep = D0; phs = 1; }
  else if (tau < 2.8) { const p = (tau - 1) / 1.8; dep = D0 + STEP * p; bot = dep; fill = p; ph = (tau - 1) * 2.4; phs = 2; }
  else if (tau < 3.8) { bot = lerp2(D0 + STEP, HANG, ease((tau - 2.8) / 1.0)); fill = 1; phs = 3; }
  else if (tau < 4.6) { sl = ease((tau - 3.8) / 0.8); fill = 1; phs = 4; }
  else if (tau < 6.0) { sl = 1; spinK = (tau - 4.6) / 1.4; fill = 1 - ease(spinK); ph = 3.4 + (tau - 4.6) * 7; phs = 5; }
  else { sl = 1 - ease((tau - 6.0) / 0.8); phs = 6; }
  const moved = (k + (phs >= 5 ? (spinK < 0 ? 1 : ease(spinK)) : 0)) / N;
  const xT = X - SL * sl;
  // furat, kiemelt föld a furat mellett (oda fordul a gép)
  if (dep > GY + 1) { R(g, X - half, GY, half * 2, dep - GY, F('bore')); P(g, `M${X - half} ${dep - 3} Q${X} ${dep + 4} ${X + half} ${dep - 3}`, F('bore')); holeWall(g, X, GY, dep - 2, half); }
  spoil(g, M, X - SL - 4, 24 + 30 * moved, 3 + 14 * moved, 'clay');
  worker(g, X - 196, { GY, pose: phs === 1 || phs === 3 || phs === 4 ? 'signal' : 'stand', dir: 1 });
  // gép (a felsőváz elfordul), Kelly-rúd, spirál
  const top = 14, headY = GY - 92, aTop = bot - LA, kTop = Math.max(top + 12, Math.min(headY - 14, aTop - 196));
  Ln(g, xT, top + 1, xT, kTop, SK('rope', 1.1));
  kelly(g, xT, kTop, aTop);
  rig(g, M, X, { top, headY, rope: false, slew: SL * sl });
  augerR(g, xT, aTop, bot, half - 1, ph, { pitch: 15, soilFrom: bot - 6 - (LA - 12) * fill, soilTo: bot - 3, soil: 'clay' });
  R(g, xT - 5, aTop - 6, 10, 7, F('steel3'), { rx: 1.5 });
  if (phs === 2 || phs === 5) spin(g, xT, aTop - 14, 24, { c: 'acc' });
  if (phs === 2) arrowV(g, X - 40, aTop + 2, aTop + 26);
  if (phs === 3) arrowV(g, X - 40, aTop + 26, aTop + 2);
  if (sl > 0.02 && sl < 0.98) { const d = `M${X + 110} ${GY - 70} Q${X + 76} ${GY - 92} ${X + 44} ${GY - 76}`; arrowP(g, d, { w: 2.6 }); head(g, X + 44, GY - 76, 160, { s: 8 }); }
  // lerázás: a rögök a menetekről a kupacra repülnek (a furat mellett, nem a furatba)
  if (spinK >= 0) for (let i = 0; i < 24; i++) {
    const t0 = (i / 24) * 0.85, a = (spinK - t0) * 1.5;
    if (a <= 0 || a > 0.62) continue;
    const s = i % 2 ? 1 : -1, x0 = xT + s * half, y0 = bot - 8 - hash(i) * (LA - 16);
    const x = x0 + s * (s > 0 ? 3 + 7 * hash(i + 3) : 8 + 22 * hash(i + 3)) * a, y = Math.min(GY - 3 - 10 * moved, y0 - 18 * hash(i + 5) * a + 0.5 * 560 * a * a);
    clod(g, x, y, 2.2 + 1.6 * hash(i + 7), 'clay', i * 40);
  }
  tgs(g, xT - 30, 64, 'Kelly-rúd', { anchor: 'end', to: [xT - 4, Math.max(kTop + 10, Math.min(headY - 16, 74))] });
  tgs(g, xT - 30, headY + 12, 'forgatófej', { anchor: 'end', to: [xT - 17, headY + 10] });
  tgs(g, X + 26, Math.max(GY + 34, Math.min(TS.H - 40, bot - 20)), 'rövid spirál', { to: [xT + half - 2, bot - LA / 2] });
  if (dep > GY + 44) tgs(g, X - half - 26, GY + 40, 'nincs megtámasztás', { anchor: 'end', to: [X - half - 1, GY + 30] });
  if (moved > 0.05) tgs(g, X - 104, GY - 46, 'kiemelt föld', { anchor: 'end', to: [X - SL - 18, GY - 4 - 10 * moved] });
  const PH = ['', '1 · leengedés a furatba', '2 · fúrás – a menetek megtelnek', '3 · kiemelés', '4 · a gép felsőváza elfordul', '5 · lerázás gyors pörgetéssel a furat mellé', '6 · vissza a furat fölé', 'a furat elkészült'];
  return { phase: PH[phs], depth: (dep - GY) / 30 };
}

/* ---------- 2. folyamatos spirál (CFA) */
function tsCfa(g, st, u) {
  const M = st.M, GY = M.GY, X = 210, half = 15, DEP = 126, LC = DEP + 22;
  let tip, ph = 0, conc = 0, pumpOn = false, phs;
  if (u < 0.5) { tip = GY - 2; phs = 1; }
  else if (u < 6.6) { const p = (u - 0.5) / 6.1; tip = GY - 2 + (DEP + 2) * p; ph = (u - 0.5) * 2.6; phs = 1; }
  else if (u < 7.6) { tip = GY + DEP; pumpOn = true; phs = 2; }
  else if (u < 11.8) { tip = lerp2(GY + DEP, GY - 6, (u - 7.6) / 4.2); pumpOn = true; phs = 3; }
  else { tip = GY - 6; phs = 4; }
  const maxDep = phs >= 2 ? GY + DEP : Math.max(GY, tip);
  if (phs >= 3) conc = GY + DEP - Math.max(GY, tip);
  // furat: a spirál és a beton tölti ki – nyitott furat sosem marad
  if (conc > 0) { const ct = GY + DEP - conc; concrete(g, X - half, ct, half * 2, conc); }
  if (maxDep > GY + 1) holeWall(g, X, GY, maxDep, half);
  const outSoil = phs <= 1 ? (tip - GY) / DEP : 1;
  spoil(g, M, X - 62, 18 + 18 * outSoil, 3 + 6 * outSoil, 'clay');
  // betonpumpa, mixer, tömlő
  mixer(g, M, X + 208, 1);
  const [px, py] = pump(g, M, X + 150);
  const headY = tip - LC - 24;
  const r = rig(g, M, X, { top: 12, headY });
  const hd = `M${px} ${py} C${px + 4} ${py - 80} ${X + 70} ${headY - 70} ${X + 1} ${headY - 7}`;
  P(g, hd, SK('hose', 3.4, 'stroke-linecap:round'));
  P(g, hd, SK('hose2', 1, 'stroke-linecap:round;opacity:.7'));
  if (pumpOn) P(g, hd, SK('fresh2', 1.8, `stroke-linecap:round;stroke-dasharray:4 10;stroke-dashoffset:${(-u * 40).toFixed(1)}`));
  // a talajdugó a meneteken: a talaj a talajszinttől lefelé tölti a meneteket; kihúzáskor a dugóval együtt jön fel
  const sFrom = phs <= 2 ? GY - 16 : GY - 16 - (GY + DEP - tip);
  augerR(g, X, r.headBot, tip, half, ph, { pitch: 16, soilFrom: sFrom, soilTo: tip - 4, soil: 'clay', flow: pumpOn ? u : 0 });
  guideFront(g, M, X, half);
  if (phs === 1 && u > 0.5) { spin(g, X, r.headY + 34, 24); arrowV(g, X - 40, r.headY + 44, r.headY + 74); }
  if (phs === 3) arrowV(g, X - 40, r.headY + 74, r.headY + 44);
  if (conc > 6) tgs(g, X - 30, Math.min(TS.H - 16, GY + DEP - conc / 2), 'friss beton', { anchor: 'end', to: [X - 8, GY + DEP - conc / 2] });
  if (phs <= 2) tgs(g, X + 26, GY + 26, 'talajdugó a meneteken', { to: [X + 9, Math.max(GY + 8, Math.min(tip - 10, GY + 30))] });
  else tgs(g, X - 30, Math.max(70, tip - 40), 'talajdugó a meneteken', { anchor: 'end', to: [X - 9, Math.max(70, tip - 40)] });
  tgs(g, X - 30, Math.max(22, headY + 12), 'forgatófej', { anchor: 'end', to: [X - 17, headY + 12] });
  tgs(g, px - 22, GY - 66, EN ? 'concrete pump' : 'betonpumpa', { anchor: 'middle', to: [px - 16, GY - 40] });
  tgs(g, X + 262, GY - 86, 'mixerautó', { anchor: 'middle' });
  const PH = ['', '1 · lehajtás forgatással – a talaj a meneteken marad', '2 · végső mélység – indul a betonozás', '3 · kihúzás forgatás nélkül, alulról betonozva', '4 · kész betonoszlop – jöhet az armatúra'];
  return { phase: PH[phs], depth: (Math.min(maxDep, GY + DEP) - GY) / 14 };
}

/* ---------- 3. markoló a béléscsőben, daruról */
function tsMarko(g, st, u) {
  // Egyetlen hosszú béléscső (toldás nélkül): a csőmozgató a kiemeléssel együtt folyamatosan süllyeszti, ezért elején
  // magasan kilóg a terepből, a végén is a csőmozgató fölé ér. A markoló mindig a cső teteje fölött lóg.
  const M = st.M, GY = M.GY, X = 214, half = 17, m = TSM.marko, N = m.n, CY = m.cyc, STEP = m.step, XD = X - 66, LC = 130;
  const done = u >= N * CY, k = done ? N - 1 : Math.floor(u / CY), tau = done ? CY : u - k * CY, D0 = GY + 8 + k * STEP;
  const uc = Math.min(u, N * CY), cas = GY + 30 + STEP * uc / CY, ctop = cas - LC, HANG = ctop - 12;
  const OI = 0.42; // nyitás a csőben: a kagylók nem érhetnek a cső falához
  let bot = HANG, xh = X, open = OI, full = 0, dep = D0 + STEP, phs = 7, dumpK = -1;
  if (done) { open = 0.2; phs = 8; }
  else if (tau < 1.2) { dep = D0; phs = 1; }
  else if (tau < 1.9) { const p = (tau - 1.2) / 0.7; bot = lerp2(HANG, D0, p * p); dep = D0; phs = 2; }
  else if (tau < 2.6) { const p = ease((tau - 1.9) / 0.7); open = OI * (1 - p); dep = D0 + STEP * p; bot = dep; full = p; phs = 3; }
  else if (tau < 3.8) { bot = lerp2(D0 + STEP, HANG, ease((tau - 2.6) / 1.2)); open = 0; full = 1; phs = 4; }
  else if (tau < 4.8) { xh = lerp2(X, XD, ease((tau - 3.8) / 1.0)); open = 0; full = 1; phs = 5; }
  else if (tau < 5.5) { xh = XD; dumpK = (tau - 4.8) / 0.7; open = ease(Math.min(1, dumpK * 2.2)); full = 1 - ease(dumpK); phs = 6; }
  else { const p = ease((tau - 5.5) / 1.1); xh = lerp2(XD, X, p); open = lerp2(1, OI, p); phs = 7; }
  const osc = done ? 0 : Math.sin(u * 9);
  const moved = (k + (phs >= 6 ? (dumpK < 0 ? 1 : ease(dumpK)) : 0)) / N;
  // furat a csőben, talajvíz a csőben (belső vízszint ≥ külső)
  R(g, X - half, ctop, half * 2, Math.max(0, dep - ctop), F('bore'));
  if (dep > M.gw - 6) water(g, X - half, M.gw - 6, half * 2, dep - (M.gw - 6));
  casing(g, X, ctop, cas, half, { inner: false, teeth: true, collar: true, joints: false });
  spoil(g, M, XD - 30, 26 + 30 * moved, 4 + 14 * moved, 'sand');
  // csőmozgató (oszcillátor) a cső körül: forgatva-nyomva viszi le a csövet; hidraulikus tápegység
  const og = g_(g, { transform: `translate(${(osc * 1.2).toFixed(2)} 0)` }), ow = 40 - half - 4.6;
  for (const x0 of [X - 40, X + half + 4.6]) {
    R(og, x0, GY - 24, ow, 24, F('mach') + `;stroke:${v('mach3')};stroke-width:.8`, { rx: 2 });
    R(og, x0, GY - 24, ow, 6, F('mach2'), { rx: 2 });
    R(og, x0 + ow / 2 - 3, GY - 44, 6, 20, 'fill:url(#pr-cyl)');
  }
  R(og, X - half - 6, GY - 20, 3, 14, F('dark2')); R(og, X + half + 3, GY - 20, 3, 14, F('dark2'));
  worker(g, X - 108, { GY, pose: phs === 2 || phs === 5 ? 'signal' : 'stand', dir: 1 });
  plant(g, M, X + 58, { w: 40, h: 22, col: 'mach' });
  hoseTo(g, X + 40, GY - 12, X + 58, GY - 12, 6);
  if (!done) { arrowV(g, X + half + 13, ctop + 14, ctop + 38, { w: 2.2, s: 7 }); if (phs === 1) { arrowH(g, X - 56, X - 74, GY - 12, { w: 2.2, s: 7 }); arrowH(g, X + 56, X + 74, GY - 12, { w: 2.2, s: 7 }); } }
  // daru: a gém dőlésével viszi a markolót a furat fölül a kupac fölé
  const CB = X + 132, fx = CB - 10, fy = GY - 31, tip0 = -30, Lb = Math.hypot(X - fx, tip0 - fy);
  const tipY = fy - Math.sqrt(Math.max(0, Lb * Lb - (xh - fx) * (xh - fx)));
  const gr = grabR(g, xh, bot, half - 4, open, full, 'sand');
  crane(g, M, xh, gr.top - 2, { reach: CB - xh, tipY });
  // ürítéskor a föld a kupacra hull
  if (dumpK >= 0) for (let i = 0; i < 16; i++) {
    const a = dumpK - (i / 16) * 0.5;
    if (a <= 0 || a > 0.62) continue;
    const x = xh + (hash(i) - 0.5) * 22, y = Math.min(GY - 4 - 10 * moved, bot - 4 + 0.5 * 900 * a * a);
    clod(g, x, y, 2.4 + 1.6 * hash(i + 4), 'sand', i * 30);
  }
  if (phs === 2) arrowV(g, X - 48, GY + 6, GY + 40);
  if (phs === 4) arrowV(g, X - 48, GY + 40, GY + 6);
  tgs(g, xh - 30, Math.max(40, Math.min(GY - 70, bot - 44)), 'markoló', { anchor: 'end', to: [xh - 11, bot - 44] });
  tgs(g, X - 34, Math.min(TS.H - 18, cas - 12), 'béléscső', { anchor: 'end', to: [X - half - 3, cas - 16] });
  tgs(g, X + 34, GY + 20, 'csőmozgató', { to: [X + 26, GY - 6] });
  if (dep > M.gw + 4) tgs(g, X + 30, Math.min(TS.H - 14, M.gw + 26), 'víz a csőben', { to: [X + 6, Math.min(dep - 4, M.gw + 16)] });
  tgs(g, CB + 34, GY - 74, EN ? 'crane' : 'daru', { anchor: 'middle', to: [CB + 26, GY - 46] });
  const PH = ['', '1 · a csőmozgató folyamatosan süllyeszti a béléscsövet', '2 · nyitott pofákkal a furat aljára ejtik', '3 · összezárva beleharap a talajba', '4 · kiemelés', '5 · a gém kiengedésével a kupac fölé', '6 · a pofák kinyílnak, ürítés', '7 · vissza a cső fölé', 'a furat elkészült'];
  return { phase: PH[phs], depth: (dep - GY) / 30 };
}

/* ---------- 4. dobfúró Kelly-rúdon, bentonitzagy védelmében */
function tsDob(g, st, u) {
  const M = st.M, GY = M.GY, X = 248, half = 15, m = TSM.dob, N = m.n, CY = m.cyc, STEP = m.step, HANG = GY - 44, SL = 46;
  const done = u >= N * CY, k = done ? N - 1 : Math.floor(u / CY), tau = done ? CY : u - k * CY, D0 = GY + 30 + k * STEP;
  let bot = HANG, sl = 0, fill = 0, flap = 0, dep = D0 + STEP, ph = 0, phs = 6, dumpK = -1;
  if (done) phs = 7;
  else if (tau < 1.0) { bot = lerp2(HANG, D0, ease(tau)); dep = D0; phs = 1; }
  else if (tau < 2.8) { const p = (tau - 1) / 1.8; dep = D0 + STEP * p; bot = dep; fill = p; ph = (tau - 1) * 1.4; phs = 2; }
  else if (tau < 3.8) { bot = lerp2(D0 + STEP, HANG, ease((tau - 2.8) / 1.0)); fill = 1; phs = 3; }
  else if (tau < 4.6) { sl = ease((tau - 3.8) / 0.8); fill = 1; phs = 4; }
  else if (tau < 5.4) { sl = 1; dumpK = (tau - 4.6) / 0.8; flap = ease(Math.min(1, dumpK * 2.4)); fill = 1 - ease(dumpK); phs = 5; }
  else { sl = 1 - ease((tau - 5.4) / 1.0); flap = 1 - ease(Math.min(1, (tau - 5.4) / 0.4)); phs = 6; }
  const moved = (k + (phs >= 5 ? (dumpK < 0 ? 1 : ease(dumpK)) : 0)) / N;
  const xT = X - SL * sl;
  // zaggyal teli furat, iránycső
  const ctop = GY - 12;
  R(g, X - half - 2, ctop, half * 2 + 4, Math.max(0, dep - ctop), F('bore'));
  slurry(g, X - half - 2, GY - 6, half * 2 + 4, dep - (GY - 6));
  holeWall(g, X, GY + 30, dep - 2, half + 2);
  casing(g, X, ctop, GY + 30, half + 2, { inner: false, collar: true, joints: false });
  spoil(g, M, X - SL - 18, 18 + 22 * moved, 4 + 13 * moved, 'sand2');
  worker(g, X - 128, { GY, pose: phs === 4 || phs === 6 ? 'signal' : 'stand', dir: 1 });
  // zagykeverő a gép mögött
  silo(g, M, X + 290, { w: 22, h: 84 });
  const pl = plant(g, M, X + 220, { w: 48, h: 24 });
  hoseTo(g, X + 220, GY - 10, X + half + 6, GY - 10, 10);
  // Kelly-rúd, gép (a felsőváz elfordul), dob
  const top = 14, headY = GY - 96, bTop = bot - 45, kTop = Math.max(top + 12, Math.min(headY - 14, bTop - 196));
  Ln(g, xT, top + 1, xT, kTop, SK('rope', 1.1));
  kelly(g, xT, kTop, bTop);
  rig(g, M, X, { top, headY, rope: false, slew: SL * sl });
  bucketR(g, xT, bot, half - 1, fill, flap, ph, 'sand2');
  if (phs === 2) spin(g, xT, bTop - 12, 24);
  if (phs === 3 && bot < GY) for (let i = 0; i < 5; i++) { const y = bot + ((u * 90 + i * 17) % 60); if (y < GY - 6) C(g, xT - 8 + i * 4, y, 1.6, F('slurry2')); }
  if (dumpK >= 0) for (let i = 0; i < 16; i++) {
    const a = dumpK - (i / 16) * 0.45;
    if (a <= 0.05 || a > 0.6) continue;
    const x = xT - half + 4 + hash(i) * (half * 2 - 8), y = Math.min(GY - 4 - 12 * moved, bot - 2 + 0.5 * 700 * a * a);
    clod(g, x, y, 2.4 + 1.5 * hash(i + 2), 'sand2', i * 37);
  }
  if (sl > 0.02 && sl < 0.98) { const d = `M${X + 110} ${GY - 70} Q${X + 76} ${GY - 92} ${X + 44} ${GY - 76}`; arrowP(g, d, { w: 2.6 }); head(g, X + 44, GY - 76, 160, { s: 8 }); }
  tgs(g, xT - 30, 64, 'Kelly-rúd', { anchor: 'end', to: [xT - 4, Math.max(kTop + 10, Math.min(headY - 16, 74))] });
  tgs(g, X + 32, Math.min(TS.H - 18, Math.max(GY + 40, dep - 30)), EN ? 'bentonite slurry' : 'bentonitzagy', { to: [X + 6, Math.min(dep - 6, Math.max(GY + 30, dep - 40))] });
  tgs(g, X + 34, GY + 16, 'iránycső', { to: [X + half + 2, GY + 12] });
  tgs(g, xT - 30, bot - 18, 'dobfúró', { anchor: 'end', to: [xT - half + 1, bot - 18] });
  const PH = ['', '1 · leengedés a zaggyal teli furatba', '2 · fúrás – a talaj a dobba kerül', '3 · kiemelés', '4 · a gép felsőváza elfordul', '5 · a fenéklap kinyílik, ürítés', '6 · vissza a furat fölé', 'a furat elkészült'];
  return { phase: PH[phs], depth: (dep - GY) / 30 };
}

/** 5.1 – a fúrófejek munkaciklusa. s: 600×360-as SVG, mode: rovid | cfa | marko | dob, u: idő (s) */
export function toolScene(s, mode, u, labels = {}) {
  defs(); CUR.W = TS.W;
  let st = s.__tool;
  TGF = fitTGF(s.getBoundingClientRect().width, TS.W, 10, 1.9);
  if (!st || st.mode !== mode || st.tgf !== TGF) {
    while (s.firstChild) s.removeChild(s.firstChild);
    st = s.__tool = { mode, sg: g_(s), dg: g_(s), tgf: TGF };
    toolStatic(st.sg, mode, st);
  }
  const g = st.dg; while (g.firstChild) g.removeChild(g.firstChild);
  const f = { rovid: tsRovid, cfa: tsCfa, marko: tsMarko, dob: tsDob }[mode];
  const res = f(g, st, u);
  txtD(g, TS.W - 10, 22, res.phase, 't-lab halo', { 'text-anchor': 'end', style: `font-size:${(12.5 * TGF).toFixed(1)}px` });
  txtD(g, TS.W - 10, 40, `mélység ≈ ${fmtM(res.depth)} m`, 't-num halo', { 'text-anchor': 'end', style: `font-size:${(12 * TGF).toFixed(1)}px` });
  if (labels.name) txtD(g, TS.W - 10, TS.H - 10, labels.name, 't-big halo', { 'text-anchor': 'end' });
  return res;
}

/* ================================================================== 5.5 CFA-monitor: a gép metszetben és a fülkemonitor */
// o: { L (m), D (cm), z (a spirál talpa, m), phase: idle | drill | pull | done, bins: betonfogyás/elméleti 0,25 m-enként
// (null = még nincs beton), tt (s), p (bar), pumpOn }
const CMS = { W: 340, H: 470, GY: 150, BOT: 446, X: 132 };
const cfaHalf = (D) => 7 + (21 * D) / 120;
export function cfaScene(s, o) {
  defs(); CUR.W = CMS.W;
  TGF = fitTGF(s.getBoundingClientRect().width, CMS.W, 9.5, 1.6);
  const { GY, BOT, X } = CMS, L0 = o.L, k = (BOT - GY) / L0, ySoft0 = GY + 0.44 * (BOT - GY), ySoft1 = GY + 0.68 * (BOT - GY);
  const M = { H: CMS.H, GY, gw: GY + 0.2 * (BOT - GY), layers: [{ k: 'sand', y: GY }, { k: 'silt', y: ySoft0 }, { k: 'sand2', y: ySoft1 }] };
  const key = `${L0}|${TGF}`;
  let st = s.__cfa;
  if (!st || st.key !== key) {
    while (s.firstChild) s.removeChild(s.firstChild);
    st = s.__cfa = { key, sg: g_(s), dg: g_(s) };
    backdrop(st.sg, M, 0, CMS.W);
    tgs(st.sg, CMS.W - 6, GY + 16, 'közepes homok', { anchor: 'end' });
    tgs(st.sg, CMS.W - 6, M.gw + 13, 'talajvíz', { anchor: 'end' });
    tgs(st.sg, CMS.W - 6, (ySoft0 + ySoft1) / 2 + 4, 'puha, iszapos réteg', { anchor: 'end' });
    tgs(st.sg, CMS.W - 6, ySoft1 + 24, 'homok', { anchor: 'end' });
  }
  const g = st.dg; while (g.firstChild) g.removeChild(g.firstChild);
  const half = cfaHalf(o.D), toe = GY + L0 * k, n = o.bins.length;
  const tip = o.phase === 'idle' ? GY - 6 : GY + o.z * k;
  const drilled = o.phase === 'drill' ? o.z : L0;
  // kiemelt föld a terepen: fúráskor a menetek hozzák fel, kihúzáskor a gép leszedi a spirálról
  const done = o.phase === 'done' ? 1 : o.phase === 'pull' ? 1 - o.z / L0 : 0;
  const amt = Math.min(1, (drilled / L0) * 0.55 + done * 0.45);
  spoil(g, M, X - 92, 30 + 40 * amt, 3 + 15 * amt, 'sand');
  // a kész (friss) cölöptest a betonfogyás szerint: nyakasodásnál a talaj a beton helyére nyomódik, puha rétegben a beton kihasasodik
  const hw = (i) => { const r = o.bins[i], yc = GY + (i + 0.5) * 0.25 * k; const soft = yc > ySoft0 && yc < ySoft1; return r < 1 ? half * Math.sqrt(Math.max(0.3, r)) : half * Math.sqrt(Math.min(r, soft ? 1.5 : 1.12)); };
  let i0 = -1; for (let i = 0; i < n; i++) if (o.bins[i] != null) { i0 = i; break; }
  const necks = []; let yTopN = GY;
  if (i0 >= 0) {
    const yTop = Math.max(GY, tip - 1); yTopN = yTop;
    let dl = `M${(X - hw(i0)).toFixed(1)} ${yTop.toFixed(1)}`, dr = '';
    for (let i = i0; i < n; i++) { const yc = GY + (i + 0.5) * 0.25 * k; if (yc < yTop) continue; dl += ` L${(X - hw(i)).toFixed(1)} ${yc.toFixed(1)}`; dr = ` L${(X + hw(i)).toFixed(1)} ${yc.toFixed(1)}` + dr; if (o.bins[i] < 1) necks.push(yc); }
    const d = dl + ` L${(X - hw(n - 1)).toFixed(1)} ${toe.toFixed(1)} Q${X} ${(toe + 4).toFixed(1)} ${(X + hw(n - 1)).toFixed(1)} ${toe.toFixed(1)}` + dr + ` L${(X + hw(i0)).toFixed(1)} ${yTop.toFixed(1)}Z`;
    P(g, d, 'fill:url(#pr-freshg)');
    P(g, d, 'fill:url(#pr-p-conc)');
    P(g, d, SK('conc2', 0.8));
    // nyakasodás: a furat teljes szélességét a beton nem töltötte ki, a fal talaja benyomódott a helyére
    // (a benyomódott talaj sötétebb, sraffozott ék a furat fala és a beton között, piros kontúrral)
    for (let i = Math.max(i0, 0); i < n; i++) {
      if (o.bins[i] == null || o.bins[i] >= 1) continue;
      const y0 = Math.max(yTopN, GY + i * 0.25 * k), y1 = GY + (i + 1) * 0.25 * k + 0.4; if (y1 <= y0) continue;
      const w = hw(i);
      for (const sx of [-1, 1]) {
        const xa = X + sx * half, xb = X + sx * w;
        R(g, Math.min(xa, xb), y0, Math.abs(xa - xb), y1 - y0, F('silt') + ';fill-opacity:.95');
        R(g, Math.min(xa, xb), y0, Math.abs(xa - xb), y1 - y0, 'fill:url(#pr-p-sand)');
        R(g, Math.min(xa, xb), y0, Math.abs(xa - xb), y1 - y0, F('push', 0.22));
        Ln(g, xb, y0, xb, y1, SK('push', 1.6));
        Ln(g, xa, y0, xa, y1, SK('push', 1.2, 'stroke-dasharray:3 2;opacity:.9'));
      }
    }
  }
  if (o.phase === 'drill' || o.phase === 'pull') holeWall(g, X, GY, Math.max(GY, tip - 2), half);
  // gép, forgatófej, betontömlő (a pumpa a képen kívül, jobbra)
  const aLen = L0 * k + 22, aTop = tip - aLen, headY = aTop - 24;
  const r = rig(g, M, X, { top: -40, headY });
  const hose = `M${CMS.W + 6} ${GY - 96} C${CMS.W - 40} ${GY - 150} ${X + 70} ${headY - 70} ${X + 1} ${headY - 7}`;
  P(g, hose, SK('hose', 3.4, 'stroke-linecap:round'));
  P(g, hose, SK('hose2', 1, 'stroke-linecap:round;opacity:.7'));
  if (o.pumpOn) P(g, hose, SK('fresh2', 1.8, `stroke-linecap:round;stroke-dasharray:4 10;stroke-dashoffset:${(-o.tt * 40).toFixed(1)}`));
  // a spirál: fúráskor forog, a menetekről nem pereg ki a talaj; kihúzáskor forgatás nélkül jön fel a talajdugóval
  const ph = o.phase === 'drill' ? o.tt * 2.2 : 0;
  if (o.phase !== 'idle') {
    const sFrom = o.phase === 'drill' ? GY - 12 : GY - 12 - (L0 - o.z) * k;
    augerDraw(g, X, r.headBot, tip, half, { pitch: Math.max(14, half * 1.05), ph, soilFrom: sFrom, soilTo: tip - 4, soil: 'sand', flow: o.pumpOn ? o.tt : 0 });
  } else augerDraw(g, X, r.headBot, tip, half, { pitch: Math.max(14, half * 1.05) });
  guideFront(g, M, X, half);
  if (o.phase === 'drill') { if (headY > 6) spin(g, X, headY + 36, half + 9); arrowV(g, X - half - 22, Math.max(GY + 8, tip - 60), Math.max(GY + 30, tip - 30)); }
  if (o.phase === 'pull') {
    arrowV(g, X - half - 22, Math.max(GY + 34, tip - 20), Math.max(GY + 8, tip - 50));
    if (o.pumpOn) for (let j = 0; j < 3; j++) { const kk = (o.tt * 1.6 + j / 3) % 1; C(g, X + (j - 1) * half * 0.45, tip + 3 + kk * 12, 1.8, F('fresh1', 1 - kk)); }
  }
  worker(g, X - 114, { GY, pose: o.phase === 'pull' ? 'signal' : 'stand', dir: 1 });
  // feliratok
  if (headY > 14) tgs(g, X - half - 12, headY + 10, 'forgatófej', { anchor: 'end', to: [X - 17, headY + 10] });
  tgs(g, CMS.W - 70, GY - 128, 'betontömlő', { anchor: 'middle', to: [CMS.W - 46, GY - 136] });
  if (o.phase === 'drill' && tip > GY + 30) tgs(g, X + half + 12, Math.min(tip - 14, GY + 46), 'talajdugó a meneteken', { to: [X + half - 4, Math.min(tip - 14, GY + 46)] });
  if (o.phase === 'pull') tgs(g, X - half - 12, GY - 38, 'talajdugó', { anchor: 'end', to: [X - half + 3, GY - 38] });
  if (i0 >= 0 && toe - Math.max(GY, tip) > 40) { const yb = Math.min(toe - 16, Math.max(GY, tip) + 34); tgs(g, X + half + 12, yb, 'friss beton', { to: [X + half - 3, yb] }); }
  if (necks.length) { const yn = necks[Math.floor(necks.length / 2)]; tgs(g, X - half - 12, yn, 'nyakasodás', { anchor: 'end', to: [X - half + 2, yn] }); }
  if (o.phase === 'pull' && o.pumpOn && tip < toe - 4) tgs(g, X - half - 12, tip + 14, 'betonozónyílás', { anchor: 'end', to: [X - 3, tip + 2] });
  txtD(g, X, CMS.H - 8, `Ø ${o.D} cm · L = ${L0} m`, 't-num halo', { 'text-anchor': 'middle', style: `font-size:${(11 * TGF).toFixed(1)}px` });
}

// A fülkemonitor: sötét kijelző, közös mélységtengelyen a cölöpprofil, a betonfogyás és a nyomás–sebesség görbe
const CMM = { W: 300, H: 470 };
const MC = { bg: '#0b1219', bez: '#1d2630', grid: '#22303c', tx: '#d7e2ec', mut: '#7f93a5', ok: '#34d399', warn: '#fbbf24', bad: '#f87171', cy: '#38bdf8', fr: '#9fb3c4' };
export function cfaMonitor(s, o) {
  const W = CMM.W, H = CMM.H, L0 = o.L, n = o.bins.length;
  while (s.firstChild) s.removeChild(s.firstChild);
  const tx = (x, y, t, a = {}, fs = 11, c = MC.tx, w = 600, mono = false) => el('text', { x, y, text: t, style: `font:${w} ${fs}px/1 ${mono ? 'var(--f-mono)' : 'var(--f-body)'};fill:${c}`, ...a }, s);
  R(s, 0, 0, W, H, `fill:${MC.bez}`, { rx: 14 });
  R(s, 7, 7, W - 14, H - 14, `fill:${MC.bg}`, { rx: 8 });
  // fejléc
  tx(16, 27, `CFA · C05-${String(o.pile).padStart(3, '0')}`, {}, 12, MC.tx, 700, true);
  const ph = { idle: ['KÉSZENLÉT', MC.mut], drill: ['FÚRÁS', MC.warn], pull: ['BETONOZÁS', MC.ok], done: ['KÉSZ', MC.cy] }[o.phase];
  C(s, W - 22, 23, 4.5, `fill:${ph[1]}`);
  tx(W - 32, 27, ph[0], { 'text-anchor': 'end' }, 11, ph[1], 700, true);
  tx(16, 45, `Ø ${o.D} cm · L = ${L0} m`, {}, 10.5, MC.mut, 600, true);
  { let z1 = -1, z2 = -1; for (let i = 0; i < n; i++) if (o.bins[i] != null && o.bins[i] < 1) { if (z1 < 0) z1 = i * 0.25; z2 = (i + 1) * 0.25; }
    if (z1 >= 0) { const f = (z) => z.toFixed(1).replace('.', EN ? '.' : ','); tx(W - 16, 45, `⚠ ${EN ? 'NECKING' : 'NYAKASODÁS'} ${f(z1)}–${f(z2)} m`, { 'text-anchor': 'end' }, 10.5, MC.bad, 700, true); } }
  Ln(s, 14, 54, W - 14, 54, `stroke:${MC.grid};stroke-width:1`);
  // sávok közös mélységtengellyel
  const Y0 = 84, Y1 = 368, ky = (Y1 - Y0) / L0, yz = (z) => Y0 + z * ky;
  const A = [36, 92], B = [100, 196], Cc = [204, 286];
  [[A, EN ? 'PROFILE' : 'PROFIL'], [B, 'BETONFOGYÁS'], [Cc, 'p · v']].forEach(([[x0, x1], t]) => { R(s, x0, Y0, x1 - x0, Y1 - Y0, 'fill:#0f1821;stroke:#1f2b37;stroke-width:1'); tx((x0 + x1) / 2, Y0 - 10, t, { 'text-anchor': 'middle' }, 9.5, MC.mut, 700); });
  const stp = L0 > 16 ? 4 : 2;
  for (let z = 0; z <= L0; z += stp) {
    Ln(s, 30, yz(z), Cc[1], yz(z), `stroke:${MC.grid};stroke-width:.8;stroke-dasharray:2 3`);
    tx(27, yz(z) + 3.5, String(z), { 'text-anchor': 'end' }, 9.5, MC.mut, 600, true);
  }
  tx(27, Y0 - 10, 'm', { 'text-anchor': 'end' }, 9.5, MC.mut, 600, true);
  // 1. cölöpprofil: elméleti átmérő szaggatva, a bedolgozott beton szerinti átmérő kitöltve
  const pc = (A[0] + A[1]) / 2, ph0 = 15;
  Ln(s, pc - ph0, Y0, pc - ph0, Y1, `stroke:${MC.mut};stroke-width:1;stroke-dasharray:3 3`);
  Ln(s, pc + ph0, Y0, pc + ph0, Y1, `stroke:${MC.mut};stroke-width:1;stroke-dasharray:3 3`);
  // 2. betonfogyás: 0–160 %, jó tartomány 100–125 %
  const rx = (r) => B[0] + (Math.max(0, Math.min(1.6, r)) / 1.6) * (B[1] - B[0]);
  R(s, rx(1), Y0, rx(1.25) - rx(1), Y1 - Y0, `fill:${MC.ok};fill-opacity:.13`);
  for (const r of [0.5, 1, 1.5]) { Ln(s, rx(r), Y0, rx(r), Y1, `stroke:${r === 1 ? MC.tx : MC.grid};stroke-width:${r === 1 ? 1.4 : 1}`); tx(rx(r), Y1 + 13, r === 1 ? '100 %' : String(r * 100), { 'text-anchor': 'middle' }, 9, r === 1 ? MC.tx : MC.mut, 600, true); }
  // 3. nyomás (0–10 bar) és húzási sebesség (0–4 m/perc)
  const px = (p) => Cc[0] + (Math.max(0, Math.min(10, p)) / 10) * (Cc[1] - Cc[0]), vx = (v) => Cc[0] + (Math.max(0, Math.min(4, v)) / 4) * (Cc[1] - Cc[0]);
  tx(Cc[0], Y1 + 13, 'p: 0–10 bar', {}, 9, MC.warn, 600, true);
  tx(Cc[0], Y1 + 25, EN ? 'v: 0–4 m/min' : 'v: 0–4 m/perc', {}, 9, MC.cy, 600, true);
  let dp = '', dv = '';
  for (let i = 0; i < n; i++) {
    const r = o.bins[i]; if (r == null) continue;
    const y = yz(i * 0.25), hh = Math.max(1, 0.25 * ky + 0.3), col = r < 1 ? MC.bad : r > 1.4 ? MC.warn : MC.ok;
    R(s, B[0], y, rx(r) - B[0], hh, `fill:${col};fill-opacity:.85`);
    const w = ph0 * Math.sqrt(Math.max(0.12, Math.min(1.6, r)));
    R(s, pc - w, y, w * 2, hh, `fill:${r < 1 ? MC.bad : MC.fr};fill-opacity:${r < 1 ? 0.95 : 0.8}`);
    const yc = y + hh / 2;
    if (o.pb[i] != null) { dp += `${dp ? 'L' : 'M'}${px(o.pb[i]).toFixed(1)} ${yc.toFixed(1)} `; dv += `${dv ? 'L' : 'M'}${vx(o.vb[i]).toFixed(1)} ${yc.toFixed(1)} `; }
  }
  if (dp) { el('path', { d: dp, style: `fill:none;stroke:${MC.warn};stroke-width:1.8;stroke-linejoin:round` }, s); el('path', { d: dv, style: `fill:none;stroke:${MC.cy};stroke-width:1.8;stroke-linejoin:round` }, s); }
  // aktuális mélység
  if (o.phase === 'drill' || o.phase === 'pull') {
    const y = yz(o.z);
    Ln(s, 30, y, Cc[1], y, `stroke:${MC.tx};stroke-width:1;stroke-dasharray:4 3;opacity:.85`);
    P(s, `M${A[0] - 1} ${y} l-6 -4 v8z`, `fill:${MC.tx}`);
    if (o.phase === 'pull') { const r = o.r; C(s, rx(r), y, 4.5, `fill:${r < 1 ? MC.bad : r > 1.4 ? MC.warn : MC.ok};stroke:${MC.bg};stroke-width:1.6`); C(s, px(o.p), y, 3.4, `fill:${MC.warn}`); C(s, vx(o.v), y, 3.4, `fill:${MC.cy}`); }
  }
  // kijelzők alul
  const box = (x, w, lab, val, unit, c = MC.tx) => {
    R(s, x, 404, w, 52, 'fill:#111b25;stroke:#22303c;stroke-width:1', { rx: 5 });
    tx(x + w / 2, 419, lab, { 'text-anchor': 'middle' }, 9, MC.mut, 700);
    tx(x + w / 2, 440, val, { 'text-anchor': 'middle' }, 16, c, 700, true);
    tx(x + w / 2, 451, unit, { 'text-anchor': 'middle' }, 8.5, MC.mut, 600, true);
  };
  const f1 = (x, d = 1) => x.toFixed(d).replace('.', EN ? '.' : ',');
  box(14, 64, 'MÉLYSÉG', f1(o.z), 'm');
  box(84, 64, 'NYOMÁS', o.phase === 'pull' ? f1(o.p) : '–', 'bar', MC.warn);
  box(154, 64, 'HÚZÁS', o.phase === 'pull' ? f1(o.v) : '–', EN ? 'm/min' : 'm/perc', MC.cy);
  const rr = o.phase === 'pull' ? o.r : o.tot;
  box(224, 62, 'FOGYÁS', rr != null ? f1(rr * 100, 0) : '–', '%', rr == null ? MC.tx : rr < 1 ? MC.bad : rr > 1.4 ? MC.warn : MC.ok);
}

function init() { document.querySelectorAll('[data-proc]').forEach(render); document.querySelectorAll('svg[data-csfig]').forEach((f) => { screwParts(f); let w0 = 0; new ResizeObserver(() => { const w = f.getBoundingClientRect().width; if (Math.abs(w - w0) > 8) { w0 = w; screwParts(f); } }).observe(f); }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
