// C08 – saját, statikus SVG-ábrák (a régi szkennelt PPT-rajzok helyett)
// Használat a HTML-ben: <div class="kf-svg" data-kfig="kotro"></div> – betöltéskor rajzolódik.
import { svg, pathD } from './core.js';

const NS = (p, tag, a = {}) => svg(tag, a, p);
const mk = (el, w, hh, label) => { const s = svg('svg', { viewBox: `0 0 ${w} ${hh}`, class: 'kf', role: 'img', 'aria-label': label || '' }); el.appendChild(s); return s; };
const G = (p, a = {}) => NS(p, 'g', a);
const R = (p, x, y, w, hh, cls = '', a = {}) => NS(p, 'rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...a });
const P = (p, d, cls = '', a = {}) => NS(p, 'path', { d, class: cls, ...a });
const C = (p, cx, cy, r, cls = '', a = {}) => NS(p, 'circle', { cx, cy, r, class: cls, ...a });
const L = (p, x1, y1, x2, y2, cls = 'kf-ln', a = {}) => NS(p, 'line', { x1, y1, x2, y2, class: cls, ...a });
const poly = (pts, close = true) => pathD(pts, close);
/** felirat; s-ben _x vagy _{xy} alsó index */
function T(p, x, y, s, cls = 'kf-t', a = {}) {
  const t = NS(p, 'text', { x, y, class: cls, ...a });
  const re = /_\{([^}]*)\}|_(\S)/g; let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) t.appendChild(document.createTextNode(s.slice(i, m.index)));
    NS(t, 'tspan', { 'baseline-shift': 'sub', 'font-size': '72%', text: m[1] ?? m[2] });
    i = m.index + m[0].length;
  }
  if (i < s.length) t.appendChild(document.createTextNode(s.slice(i)));
  return t;
}
function arw(p, x1, y1, x2, y2, cls = 'kf-ar', hd = 8) {
  const g = G(p, { class: cls });
  const a = Math.atan2(y2 - y1, x2 - x1);
  NS(g, 'line', { x1, y1, x2: x2 - Math.cos(a) * hd * 0.7, y2: y2 - Math.sin(a) * hd * 0.7 });
  NS(g, 'path', { d: poly([[x2, y2], [x2 - Math.cos(a - 0.42) * hd, y2 - Math.sin(a - 0.42) * hd], [x2 - Math.cos(a + 0.42) * hd, y2 - Math.sin(a + 0.42) * hd]]) });
  return g;
}
/** vezetővonal + felirat: a pontból (x1,y1) a felirathoz (x2,y2) */
function lead(p, x1, y1, x2, y2, s, anchor = 'start', cls = 'kf-t') {
  L(p, x1, y1, x2, y2, 'kf-lead');
  C(p, x1, y1, 2.4, 'kf-dot');
  const dx = anchor === 'end' ? -4 : anchor === 'middle' ? 0 : 4;
  return T(p, x2 + dx, y2 + 5, s, cls + ' halo', { 'text-anchor': anchor });
}
function dimV(p, x, y1, y2, s, side = 1, cls = 'kf-n', rot = false) {
  L(p, x, y1, x, y2, 'kf-dim');
  L(p, x - 5, y1, x + 5, y1, 'kf-dim'); L(p, x - 5, y2, x + 5, y2, 'kf-dim');
  const my = (y1 + y2) / 2;
  if (rot) { const tx = x + side * 12; return T(p, tx, my, s, cls + ' halo', { 'text-anchor': 'middle', transform: `rotate(-90 ${tx} ${my})`, dy: side > 0 ? '0.35em' : '0.35em' }); }
  return T(p, x + side * 7, my + 5, s, cls + ' halo', { 'text-anchor': side > 0 ? 'start' : 'end' });
}
function dimH(p, x1, x2, y, s, cls = 'kf-n') {
  L(p, x1, y, x2, y, 'kf-dim');
  L(p, x1, y - 5, x1, y + 5, 'kf-dim'); L(p, x2, y - 5, x2, y + 5, 'kf-dim');
  return T(p, (x1 + x2) / 2, y - 7, s, cls + ' halo', { 'text-anchor': 'middle' });
}
/** szint-jel (háromszög + érték) */
function lvl(p, x, y, s, anchor = 'start') {
  P(p, poly([[x, y], [x - 6, y - 9], [x + 6, y - 9]]), 'kf-lvl');
  L(p, x - 14, y, x + 14, y, 'kf-ln');
  T(p, x + (anchor === 'end' ? -10 : 9), y - 4, s, 'kf-n halo', { 'text-anchor': anchor });
}
function soil(p, x, y, w, hh, cls = 'f-soilA', pat = 'pat-sand', op = 0.8) {
  R(p, x, y, w, hh, cls);
  if (pat) R(p, x, y, w, hh, '', { fill: `url(#${pat})`, opacity: op });
}
/** vasbeton (vagy beton) kitöltés + körvonal */
function conc(p, d, cls = 'f-conc') {
  P(p, d, cls);
  P(p, d, '', { fill: 'url(#pat-conc)', opacity: 0.9 });
  return P(p, d, 'kf-out');
}
function water(p, x, y, w, hh, op = 1) { R(p, x, y, w, hh, 'f-water', { opacity: op }); R(p, x, y, w, hh, '', { fill: 'url(#pat-water)', opacity: 0.8 * op }); L(p, x, y, x + w, y, 'kf-wl'); }
function grab(p, cx, yb, w = 26, open = 0.5) {
  const g = G(p);
  const o = open * 6;
  R(g, cx - 5, yb - 30, 10, 12, 'f-steel2', { rx: 2 });
  P(g, `M${cx - 3} ${yb - 18} L${cx - w / 2 - o} ${yb - 4} Q${cx - w / 2 - o + 2} ${yb + 3} ${cx - 4} ${yb} Z`, 'f-steel');
  P(g, `M${cx + 3} ${yb - 18} L${cx + w / 2 + o} ${yb - 4} Q${cx + w / 2 + o - 2} ${yb + 3} ${cx + 4} ${yb} Z`, 'f-steel');
  P(g, `M${cx - 3} ${yb - 18} L${cx - w / 2 - o} ${yb - 4} Q${cx - w / 2 - o + 2} ${yb + 3} ${cx - 4} ${yb} Z M${cx + 3} ${yb - 18} L${cx + w / 2 + o} ${yb - 4} Q${cx + w / 2 + o - 2} ${yb + 3} ${cx + 4} ${yb} Z`, 'kf-out');
  C(g, cx, yb - 18, 3, 'f-surface', { class: 'kf-edge f-surface' });
  return g;
}
function person(p, x, y, s = 1) {
  const g = G(p, { transform: `translate(${x} ${y}) scale(${s})`, class: 'kf-man' });
  C(g, 0, -19, 4);
  NS(g, 'path', { d: 'M0 -15 V-5 M0 -5 L-4 3 M0 -5 L4 3 M0 -12 L6 -7 L10 -3 M0 -12 L-5 -8', class: 'kf-manl' });
  P(g, 'M-5 -21 q5 -6 10 0 z', 'f-warn');
  return g;
}

/** több részábra cellákban, cellánként felirattal (data-caps="a|b|c") */
function panels(el, keys, W, H, draw) {
  const caps = (el.dataset.caps || '').split('|');
  keys.forEach((k, i) => {
    const c = document.createElement('div'); c.className = 'kf-cell'; el.appendChild(c);
    const s = mk(c, W, H, (caps[i] || k).replace(/<[^>]+>/g, ''));
    draw[k](s);
    if (caps[i]) { const t = document.createElement('p'); t.className = 'kf-cap'; t.innerHTML = caps[i]; c.appendChild(t); }
  });
}

/* ====================================================================== A) földkiemelés */
function figKotro(el) {
  const W = 640, H = 430, GY = 196, s = mk(el, W, H, 'Kútalap süllyesztése: a forgó kotró markolóedénnyel szedi ki a földet a vasbeton köpeny belsejéből');
  const BY = 348;
  soil(s, 0, GY, W, BY - GY, 'f-soilB', 'pat-clay');
  soil(s, 0, BY, W, H - BY, 'f-soilD', 'pat-gravel');
  L(s, 0, GY, W, GY, 'kf-gl'); L(s, 0, BY, W, BY, 'kf-ln', { 'stroke-dasharray': '6 4' });
  // kút: belső tér
  const xo = 150, t = 18, di = 96, top = GY - 24, yb = BY - 8, dig = yb - 8;
  const xi = xo + t, xr = xi + di;
  R(s, xi, top, di, dig - top, 'kf-void');
  P(s, `M${xi} ${dig} Q${xi + di / 2} ${dig + 12} ${xr} ${dig}`, 'kf-ln', { fill: 'none', 'stroke-dasharray': '4 3' });
  conc(s, poly([[xo, top], [xi, top], [xi, yb - 24], [xo + 3, yb], [xo, yb]]));
  conc(s, poly([[xr + t, top], [xr, top], [xr, yb - 24], [xr + t - 3, yb], [xr + t, yb]]));
  // kotró (lánctalpas, rácsos gém)
  const cx = 500, ty = GY;
  R(s, cx - 110, ty - 24, 220, 24, 'f-steel2', { rx: 12 });
  for (let i = 0; i < 7; i++) C(s, cx - 96 + i * 32, ty - 12, 6.5, 'f-steel');
  R(s, cx - 92, ty - 34, 180, 10, 'f-ink', { opacity: 0.75 });
  R(s, cx - 84, ty - 92, 168, 58, 'f-grp', { rx: 6 });
  R(s, cx - 70, ty - 122, 64, 36, 'f-grp', { rx: 5 });
  R(s, cx - 64, ty - 116, 52, 24, 'f-sky');
  R(s, cx + 30, ty - 80, 42, 14, 'f-ink', { opacity: 0.35, rx: 3 });
  const pv = [cx - 82, ty - 68], tip = [xi + di / 2, 28];
  const n = 9, off = 8;
  const ang = Math.atan2(tip[1] - pv[1], tip[0] - pv[0]), nx = -Math.sin(ang) * off, ny = Math.cos(ang) * off;
  const A = [pv[0] + nx, pv[1] + ny], B = [tip[0] + nx * 0.3, tip[1] + ny * 0.3], A2 = [pv[0] - nx, pv[1] - ny], B2 = [tip[0] - nx * 0.3, tip[1] - ny * 0.3];
  L(s, ...A, ...B, 'kf-boom'); L(s, ...A2, ...B2, 'kf-boom');
  for (let i = 0; i < n; i++) {
    const f0 = i / n, f1 = (i + 1) / n;
    const p0 = [A[0] + (B[0] - A[0]) * f0, A[1] + (B[1] - A[1]) * f0], q1 = [A2[0] + (B2[0] - A2[0]) * f1, A2[1] + (B2[1] - A2[1]) * f1];
    const p1 = [A[0] + (B[0] - A[0]) * f1, A[1] + (B[1] - A[1]) * f1];
    L(s, ...p0, ...q1, 'kf-lat'); L(s, ...q1, ...p1, 'kf-lat');
  }
  L(s, cx - 24, ty - 120, tip[0], tip[1], 'kf-rope');
  C(s, tip[0], tip[1], 5, 'f-steel2');
  const gy0 = dig - 6;
  L(s, tip[0], tip[1], tip[0], gy0 - 30, 'kf-rope');
  grab(s, tip[0], gy0, 34, 0.6);
  // süllyedés
  arw(s, xo - 24, top + 8, xo - 24, top + 86, 'kf-ar kf-acc', 11);
  T(s, xo - 34, top + 40, 'süllyed', 'kf-t kf-acc-t halo', { 'text-anchor': 'end' });
  T(s, xo - 34, top + 62, 'a saját', 'kf-s halo', { 'text-anchor': 'end' });
  T(s, xo - 34, top + 80, 'súlyától', 'kf-s halo', { 'text-anchor': 'end' });
  lead(s, xr + t - 2, GY + 40, xr + 70, GY + 40, 'vasbeton köpenyfal');
  lead(s, tip[0] + 14, gy0 - 10, xr + 70, GY + 92, 'markolóedény');
  lead(s, xr + t - 2, yb - 2, xr + 70, yb - 2, 'vágóél');
  T(s, cx + 6, ty - 134, 'forgó kotró', 'kf-t halo', { 'text-anchor': 'middle' });
  T(s, W - 12, GY + 26, 'puha réteg', 'kf-s halo', { 'text-anchor': 'end' });
  T(s, W - 12, BY + 28, 'teherbíró réteg', 'kf-s halo', { 'text-anchor': 'end' });
}

/* ====================================================================== B) kútalapozás sémája (axonometria) */
function figSema(el) {
  const W = 540, H = 420, s = mk(el, W, H, 'Kútalapozás sémája: a kutakat áthidaló, elosztó vasbeton gerendarács köti össze, erre áll a felmenő szerkezet');
  const sc = 15, c = Math.cos(Math.PI / 6), ox = 230, oy = 150;
  const pr = (x, y, z) => [ox + (x - y) * c * sc, oy + (x + y) * 0.5 * sc - z * sc];
  const face = (pts, cls) => P(s, poly(pts.map((q) => pr(...q))), cls);
  const XS = [0, 6, 12], YS = [0, 6.5], bw = 0.45, bh = 1.0, r = 0.8, wd = 6.5;
  // terepszint (halvány sík)
  face([[-2.2, -2.2, -bh], [14.2, -2.2, -bh], [14.2, 8.7, -bh], [-2.2, 8.7, -bh]], 'kf-ground');
  // kutak (hátulról előre)
  const wells = [];
  for (const x of XS) for (const y of YS) wells.push([x, y]);
  wells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const rx = 1.2247 * r * sc, ry = 0.7071 * r * sc;
  for (const [x, y] of wells) {
    const [tx, tyy] = pr(x, y, -bh), [, by] = pr(x, y, -bh - wd);
    P(s, `M${tx - rx} ${tyy} L${tx - rx} ${by} A${rx} ${ry} 0 0 0 ${tx + rx} ${by} L${tx + rx} ${tyy} Z`, 'f-conc kf-edge');
    P(s, `M${tx - rx} ${tyy} L${tx - rx} ${by} A${rx} ${ry} 0 0 0 ${tx + rx} ${by} L${tx + rx} ${tyy} Z`, '', { fill: 'url(#pat-conc)', opacity: 0.9 });
    P(s, `M${tx - rx * 0.45} ${tyy + 4} L${tx - rx * 0.45} ${by + ry * 0.7}`, 'kf-shine');
    NS(s, 'ellipse', { cx: tx, cy: tyy, rx, ry, class: 'f-conc2 kf-edge' });
  }
  // gerendarács: hosszirányú (x) és keresztirányú (y) gerendák, felső síkjuk vízszintes (z = 0)
  const beams = [];
  for (const y of YS) beams.push({ k: 'x', y, key: y });
  for (const x of XS) beams.push({ k: 'y', x, key: x });
  const drawBeamX = (y) => { // x irányú gerenda y-nál
    const x0 = -1, x1 = 13;
    face([[x0, y - bw, 0], [x1, y - bw, 0], [x1, y + bw, 0], [x0, y + bw, 0]], 'f-conc2 kf-edge');
    face([[x0, y + bw, 0], [x1, y + bw, 0], [x1, y + bw, -bh], [x0, y + bw, -bh]], 'f-conc kf-edge');
    face([[x1, y - bw, 0], [x1, y + bw, 0], [x1, y + bw, -bh], [x1, y - bw, -bh]], 'f-conc kf-edge');
  };
  const drawBeamY = (x) => {
    const y0 = -1, y1 = 7.5;
    face([[x - bw, y0, 0], [x + bw, y0, 0], [x + bw, y1, 0], [x - bw, y1, 0]], 'f-conc2 kf-edge');
    face([[x + bw, y0, 0], [x + bw, y1, 0], [x + bw, y1, -bh], [x + bw, y0, -bh]], 'f-conc kf-edge');
    face([[x - bw, y1, 0], [x + bw, y1, 0], [x + bw, y1, -bh], [x - bw, y1, -bh]], 'f-conc kf-edge');
  };
  drawBeamY(0); drawBeamX(0); drawBeamY(6); drawBeamY(12); drawBeamX(6.5);
  // felmenő szerkezet: oszlopok a gerendákon (a kutak között is), két födém
  const cols = [];
  for (const y of YS) for (const x of [0, 3, 6, 9, 12]) cols.push([x, y]);
  cols.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const H1 = 3.2, H2 = 6.4, cw = 0.2;
  const slab = (z) => face([[-0.6, -0.6, z], [12.6, -0.6, z], [12.6, 7.1, z], [-0.6, 7.1, z]], 'kf-slab');
  const fbeam = (z) => { for (const y of YS) P(s, poly([pr(0, y, z), pr(12, y, z)], false), 'kf-fb'); for (const x of [0, 3, 6, 9, 12]) P(s, poly([pr(x, 0, z), pr(x, 6.5, z)], false), 'kf-fb'); };
  slab(H1); fbeam(H1);
  for (const [x, y] of cols) {
    face([[x - cw, y + cw, 0], [x + cw, y + cw, 0], [x + cw, y + cw, H2], [x - cw, y + cw, H2]], 'f-bld kf-edge');
    face([[x + cw, y - cw, 0], [x + cw, y + cw, 0], [x + cw, y + cw, H2], [x + cw, y - cw, H2]], 'f-bld2 kf-edge');
  }
  slab(H2); fbeam(H2);
  // feliratok
  const pw = pr(12, 6.5, -bh - wd * 0.6);
  lead(s, pw[0] + rx, pw[1], pw[0] + 70, pw[1] + 18, 'kutak');
  const pw2 = pr(6, 6.5, -bh - wd * 0.75);
  L(s, pw2[0] + rx, pw2[1], pw[0] + 66, pw[1] + 18, 'kf-lead');
  const pb = pr(12, 3, -bh / 2);
  lead(s, pb[0] + 4, pb[1], pb[0] + 50, pb[1] - 40, 'áthidaló, elosztó');
  T(s, pb[0] + 54, pb[1] - 17, 'gerendarács', 'kf-t halo');
  const pc = pr(12, 0, H2 * 0.7);
  lead(s, pc[0] + 5, pc[1], pc[0] + 46, pc[1] - 18, 'felmenő');
  T(s, pc[0] + 50, pc[1] + 5, 'szerkezet', 'kf-t halo');
  const pg = pr(-2.2, 8.7, -bh);
  T(s, pg[0] - 4, pg[1] + 22, 'terepszint', 'kf-s halo', { 'text-anchor': 'middle' });
}

/* ====================================================================== B2) erőjáték (nézet) */
function figEro(el) {
  const W = 540, H = 420, s = mk(el, W, H, 'A kútalapozás erőjátéka: az oszlopterhet az áthidaló gerenda viszi a kutakra, azok a teherbíró rétegre');
  const GY = 210, BY = 300, xs = [86, 270, 454], bt = 172, bb = 196, kw = 50, kb = 352;
  soil(s, 0, GY, W, BY - GY, 'f-soilB', 'pat-clay');
  soil(s, 0, BY, W, H - BY, 'f-soilD', 'pat-gravel');
  L(s, 0, GY, W, GY, 'kf-gl'); L(s, 0, BY, W, BY, 'kf-ln', { 'stroke-dasharray': '6 4' });
  // nyomatéki ábra (a húzott oldalon) a gerenda fölötti sávban
  const m0 = 46, k = 34 / 0.1875;
  const mp = [[xs[0], m0], [(xs[0] + xs[1]) / 2, m0 + 0.15625 * k], [xs[1], m0 - 0.1875 * k], [(xs[1] + xs[2]) / 2, m0 + 0.15625 * k], [xs[2], m0]];
  P(s, poly([...mp, [xs[0], m0]]), 'kf-mom');
  P(s, poly(mp, false), 'kf-momL');
  L(s, xs[0] - 8, m0, xs[2] + 8, m0, 'kf-ln');
  T(s, xs[0] - 14, m0 + 5, 'M', 'kf-t kf-acc-t', { 'text-anchor': 'end' });
  T(s, (xs[0] + xs[1]) / 2 - 26, m0 + 0.15625 * k - 4, '+', 'kf-t');
  T(s, xs[1] + 12, m0 - 0.1875 * k + 4, '−', 'kf-t');
  // kutak
  for (const x of xs) {
    conc(s, poly([[x - kw / 2, bb], [x + kw / 2, bb], [x + kw / 2, kb], [x - kw / 2, kb]]));
    // köpeny- és talpellenállás
    for (const yy of [232, 266]) { arw(s, x - kw / 2 - 12, yy + 14, x - kw / 2 - 12, yy, 'kf-ar kf-ok', 7); arw(s, x + kw / 2 + 12, yy + 14, x + kw / 2 + 12, yy, 'kf-ar kf-ok', 7); }
    for (const dx of [-15, 0, 15]) arw(s, x + dx, kb + 26, x + dx, kb + 4, 'kf-ar kf-acc', 7);
  }
  // gerenda (felső síkja vízszintes, keresztmetszete téglalap)
  conc(s, poly([[xs[0] - 44, bt], [xs[2] + 44, bt], [xs[2] + 44, bb], [xs[0] - 44, bb]]), 'f-conc2');
  // oszlopok a mezők közepén + F
  for (const x of [(xs[0] + xs[1]) / 2, (xs[1] + xs[2]) / 2]) {
    R(s, x - 10, 112, 20, bt - 112, 'f-bld kf-edge');
    arw(s, x, 86, x, 110, 'kf-ar kf-bad', 10);
    T(s, x + 14, 100, 'F', 'kf-t kf-bad-t halo');
  }
  // reakciók
  for (const x of xs) { arw(s, x, bb + 34, x, bb + 4, 'kf-ar kf-steel', 9); }
  T(s, xs[2] + 14, bb + 30, 'R', 'kf-t kf-steel-t halo');
  T(s, W - 12, 30, 'nyomatéki ábra', 'kf-s halo', { 'text-anchor': 'end' });
  lead(s, xs[0] - 30, bt + 12, 22, 136, 'áthidaló gerenda', 'start');
  T(s, 14, GY + 26, 'puha réteg', 'kf-s halo');
  T(s, 14, BY + 24, 'teherbíró réteg', 'kf-s halo');
  lead(s, xs[2] + kw / 2, 330, W - 16, 330, 'kút', 'end');
  T(s, xs[1], H - 14, 'talpellenállás', 'kf-s kf-acc-t halo', { 'text-anchor': 'middle' });
  T(s, xs[0] + kw / 2 + 20, 252, 'köpeny', 'kf-s kf-ok-t halo');
}

/* ====================================================================== C) kútalap-változatok */
const VW = 200, VH = 300, GYV = 74, TOP = 40, YB = 254, XO = 40, TW = 16, DI = 104;
function vBase(s) {
  soil(s, 0, GYV, VW, VH - GYV, 'f-soilB', 'pat-clay');
  L(s, 0, GYV, VW, GYV, 'kf-gl');
}
function vVoid(s, xl, xr, dig = YB - 6) {
  R(s, xl, TOP, xr - xl, dig - TOP, 'kf-void');
  P(s, `M${xl} ${dig} Q${(xl + xr) / 2} ${dig + 10} ${xr} ${dig}`, 'kf-ln', { fill: 'none', 'stroke-dasharray': '4 3' });
}
/** egy fal (bal oldali) pontjai: o = külső x(y) függvény, i = belső x(y) */
function wallPair(s, outer, inner, opts = {}) {
  // outer, inner: pontlisták a bal falra (felülről lefelé), a jobb fal tükrözve
  const mir = (pts) => pts.map(([x, y]) => [VW - x, y]);
  const left = [...outer, ...inner.slice().reverse()];
  conc(s, poly(left));
  conc(s, poly(mir(left)));
  if (opts.rings) for (const y of opts.rings) { L(s, outer[0][0], y, inner[0][0], y, 'kf-joint'); L(s, VW - outer[0][0], y, VW - inner[0][0], y, 'kf-joint'); }
}
const variants = {
  gyuru: (s) => {
    vBase(s); vVoid(s, XO + TW, VW - XO - TW);
    wallPair(s, [[XO, TOP], [XO, YB]], [[XO + TW, TOP], [XO + TW, YB - 20], [XO + 3, YB]], { rings: [82, 124, 166, 208] });
    lead(s, XO + 2, 104, 4, 22, 'kútgyűrűk', 'start', 'kf-s');
  },
  hengeres: (s) => {
    vBase(s); vVoid(s, XO + TW, VW - XO - TW);
    wallPair(s, [[XO, TOP], [XO, YB]], [[XO + TW, TOP], [XO + TW, YB - 26], [XO + 3, YB]]);
    lead(s, XO + 2, YB - 4, 8, YB + 26, 'vágóél', 'start', 'kf-s');
  },
  hvall: (s) => {
    vBase(s);
    R(s, XO - 6, GYV, 6, YB - 34 - GYV, 'kf-void'); R(s, VW - XO, GYV, 6, YB - 34 - GYV, 'kf-void');
    vVoid(s, XO + TW, VW - XO - TW);
    wallPair(s, [[XO, TOP], [XO, YB - 34], [XO - 6, YB - 30], [XO - 6, YB]], [[XO + TW, TOP], [XO + TW, YB - 26], [XO - 3, YB]]);
    lead(s, XO - 6, YB - 31, 6, YB - 74, 'vállkiugrás', 'start', 'kf-s');
  },
  kupos: (s) => {
    vBase(s);
    P(s, poly([[XO + 2, GYV], [XO - 12, YB], [XO - 12, GYV]]), 'kf-void'); P(s, poly([[VW - XO - 2, GYV], [VW - XO + 12, YB], [VW - XO + 12, GYV]]), 'kf-void');
    vVoid(s, XO + TW, VW - XO - TW);
    wallPair(s, [[XO + 4, TOP], [XO - 12, YB]], [[XO + TW + 4, TOP], [XO + TW - 9, YB - 24], [XO - 9, YB]]);
    T(s, VW / 2, YB + 30, 'lefelé szélesedő köpeny', 'kf-s halo', { 'text-anchor': 'middle' });
  },
  kvall: (s) => {
    vBase(s);
    R(s, XO - 8, GYV, 8, YB - 58 - GYV, 'kf-void'); R(s, VW - XO, GYV, 8, YB - 58 - GYV, 'kf-void');
    P(s, poly([[XO - 8, YB - 58], [XO - 20, YB], [XO - 8, YB]]), 'kf-void'); P(s, poly([[VW - XO + 8, YB - 58], [VW - XO + 20, YB], [VW - XO + 8, YB]]), 'kf-void');
    vVoid(s, XO + TW, VW - XO - TW);
    wallPair(s, [[XO, TOP], [XO, YB - 58], [XO - 8, YB - 54], [XO - 20, YB]], [[XO + TW, TOP], [XO + TW, YB - 26], [XO - 17, YB]]);
    lead(s, XO - 8, YB - 55, 6, YB - 96, 'vállkiugrás', 'start', 'kf-s');
  },
  surl: (s) => {
    vBase(s);
    const g = 9;
    // a rés kitöltése: bal oldalon tixotróp zagy, jobb oldalon gördülő kavics
    R(s, XO - g, GYV - 4, g, YB - 34 - GYV + 4, 'f-bento'); R(s, XO - g, GYV - 4, g, YB - 34 - GYV + 4, '', { fill: 'url(#pat-slurry)' });
    R(s, VW - XO, GYV - 4, g, YB - 34 - GYV + 4, 'f-soilD'); R(s, VW - XO, GYV - 4, g, YB - 34 - GYV + 4, '', { fill: 'url(#pat-gravel)' });
    for (let y = GYV + 4; y < YB - 40; y += 9) C(s, VW - XO + 4.5, y, 3.2, 'kf-pebble');
    vVoid(s, XO + TW, VW - XO - TW);
    wallPair(s, [[XO, TOP], [XO, YB - 34], [XO - g, YB - 30], [XO - g, YB]], [[XO + TW, TOP], [XO + TW, YB - 26], [XO - g + 3, YB]]);
    lead(s, XO - 5, 112, 6, 22, 'zagy', 'start', 'kf-s');
    lead(s, VW - XO + 5, 150, VW - 6, 22, 'kavics', 'end', 'kf-s');
  },
};
function figValt(el) { panels(el, (el.dataset.v || 'gyuru,hengeres,hvall,kupos,kvall,surl').split(','), VW, VH, variants); }

/* ====================================================================== D) vágóél kialakítása */
const EW = 220, EH = 300;
function eBody(s, tipPts) {
  // vágóél teste (vasbeton): külső oldal balra, belső ferde oldal jobbra
  soil(s, 0, 236, EW, EH - 236, 'f-soilB', 'pat-clay');
  const d = poly(tipPts);
  conc(s, d);
  L(s, 0, 18, EW, 18, 'kf-cut');
  T(s, EW - 6, 12, 'metszet', 'kf-s', { 'text-anchor': 'end' });
}
const BODY = [[52, 18], [168, 18], [168, 110], [84, 262], [52, 262]];
const edges = {
  vb: (s) => {
    eBody(s, BODY);
    // kengyelek a vágóél alakját követve + hosszvasak
    for (const q of [[[62, 34], [158, 34], [158, 104], [62, 104]], [[62, 124], [150, 124], [110, 192], [62, 192]], [[62, 206], [102, 206], [84, 244], [62, 244]]]) P(s, poly(q), 'kf-rebarl');
    for (const [x, y] of [[62, 34], [158, 34], [62, 104], [158, 104], [62, 124], [150, 124], [62, 192], [110, 192], [62, 206], [62, 244]]) C(s, x, y, 4.2, 'f-rebar kf-edge');
    lead(s, 158, 34, 210, 58, 'Ø18', 'end', 'kf-s');
    lead(s, 150, 124, 212, 150, 'Ø8 kengyel', 'end', 'kf-s');
    lead(s, 62, 244, 12, 290, 'Ø20', 'start', 'kf-s');
  },
  szog: (s) => {
    eBody(s, BODY);
    // szögacél a csúcson + a betonba nyúló horgonyok
    for (const [x1, y1, x2, y2] of [[64, 250, 100, 190], [74, 252, 112, 180], [84, 254, 124, 168]]) L(s, x1, y1, x2, y2, 'kf-anch');
    P(s, poly([[50, 236], [50, 266], [92, 266], [92, 258], [58, 258], [58, 236]]), 'f-steelc kf-edge');
    lead(s, 52, 264, 10, 292, 'L 100×100×14', 'start', 'kf-s');
    lead(s, 106, 186, 212, 150, 'horgonyok', 'end', 'kf-s');
  },
  elo: (s) => {
    eBody(s, [[52, 18], [168, 18], [168, 110], [96, 238], [52, 238]]);
    // kiálló acél elő-vágóél
    P(s, poly([[48, 236], [100, 236], [100, 243], [56, 243], [56, 290], [48, 290]]), 'f-steelc kf-edge');
    for (const x of [74, 92]) P(s, `M${x} 236 L${x + 30} 120 q4 -12 -8 -14`, 'kf-anch', { fill: 'none' });
    lead(s, 56, 270, 120, 284, 'acélél 100×10', 'start', 'kf-s');
    lead(s, 104, 130, 206, 66, 'Ø12 horgony', 'end', 'kf-s');
    T(s, 206, 86, '25 cm-enként', 'kf-s halo', { 'text-anchor': 'end' });
  },
  geo: (s) => {
    soil(s, 0, 236, EW, EH - 236, 'f-soilB', 'pat-clay');
    // fal metszete: külső vállkiugrás felül-balra, belül ferde (α ≤ 35°) oldal, alul acél elővágóél
    const body = [[40, 18], [150, 18], [150, 40], [86, 262], [58, 262], [58, 80], [40, 74]];
    conc(s, poly(body));
    L(s, 0, 18, EW, 18, 'kf-cut');
    P(s, poly([[54, 262], [64, 262], [64, 284], [54, 284]]), 'f-steelc kf-edge');
    // α a függőlegeshez képest
    L(s, 86, 262, 86, 150, 'kf-dim', { 'stroke-dasharray': '4 3' });
    P(s, `M86 190 A72 72 0 0 1 ${86 + 72 * Math.sin(0.278)} ${262 - 72 * Math.cos(0.278)}`, 'kf-ln', { fill: 'none' });
    T(s, 98, 176, 'α ≤ 35°', 'kf-s kf-acc-t halo');
    lead(s, 46, 76, 4, 128, 'külső', 'start', 'kf-s');
    T(s, 8, 146, 'vállkiugrás', 'kf-s halo');
    dimH(s, 54, 64, 296, 's₀', 'kf-s');
    lead(s, 64, 276, 120, 284, 'acél elővágóél', 'start', 'kf-s');
  },
};
function figEdge(el) { panels(el, (el.dataset.v || 'vb,szog,elo,geo').split(','), EW, EH, edges); }

/* ====================================================================== E) nyitott szekrény: metszet + alaprajz */
function figNyitott(el) {
  const W = 680, H = 420, s = mk(el, W, H, 'Nyitott süllyesztett szekrény: metszet (vágóél körben, rekeszfalak, víz alatti kotrás, 6–8 m-es ütemek) és alaprajz (cellák)');
  const WL = 92, GY = 140, SW = 400;
  R(s, 0, 0, SW, WL, 'f-sky', { opacity: 0.45 });
  water(s, 0, WL, SW, GY - WL);
  soil(s, 0, GY, SW, 190, 'f-soilA', 'pat-sand');
  soil(s, 0, GY + 190, SW, H - GY - 190, 'f-soilD', 'pat-gravel');
  L(s, 0, GY, SW, GY, 'kf-gl');
  const x0 = 96, x1 = 304, t = 16, top = 56, yb = 372;
  R(s, x0 + t, WL, x1 - x0 - 2 * t, yb - 14 - WL, 'f-water', { opacity: 0.85 });
  R(s, x0 + t, top, x1 - x0 - 2 * t, WL - top, 'kf-void');
  conc(s, poly([[x0, top], [x0 + t, top], [x0 + t, yb - 46], [x0 + 4, yb], [x0 - 8, yb], [x0 - 8, yb - 40], [x0, yb - 46]]));
  conc(s, poly([[x1, top], [x1 - t, top], [x1 - t, yb - 46], [x1 - 4, yb], [x1 + 8, yb], [x1 + 8, yb - 40], [x1, yb - 46]]));
  for (const x of [165, 235]) conc(s, poly([[x - 6, top], [x + 6, top], [x + 6, yb - 66], [x, yb - 50], [x - 6, yb - 66]]));
  for (const y of [150, 252]) L(s, x0 - 22, y, x1 + 22, y, 'kf-joint2');
  for (const [y, n] of [[104, '3.'], [204, '2.'], [316, '1.']]) T(s, x1 + 18, y, n, 'kf-n halo');
  T(s, x1 + 18, 334, 'ütem', 'kf-s halo');
  dimV(s, 40, 150, 252, '6–8 m', 1, 'kf-s');
  for (const [x, yy] of [[130, yb - 22], [270, yb - 30]]) { L(s, x, 30, x, yy - 30, 'kf-rope'); grab(s, x, yy, 22, 0.5); }
  lead(s, x0 - 6, yb - 6, 14, H - 16, 'vágóél körben', 'start', 'kf-s');
  lead(s, 235, 290, 330, H - 16, 'rekeszfal', 'start', 'kf-s');
  T(s, SW / 2, 22, 'metszet: víz alatti kotrás a cellákban', 'kf-s halo', { 'text-anchor': 'middle' });
  // alaprajz
  const px = 440, py = 70, pw = 200, ph = 270, tt = 12;
  R(s, px, py, pw, ph, 'f-conc kf-edge'); R(s, px, py, pw, ph, '', { fill: 'url(#pat-conc)' });
  const cw = (pw - 2 * tt - 6) / 2, ch = (ph - 2 * tt - 12) / 3;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
    const cx = px + tt + i * (cw + 6), cy = py + tt + j * (ch + 6);
    R(s, cx, cy, cw, ch, 'f-water', { opacity: 0.85 });
    grab(s, cx + cw / 2, cy + ch / 2 + 14, 18, 0.5);
  }
  T(s, px + pw / 2, 40, 'alaprajz', 'kf-t halo', { 'text-anchor': 'middle' });
  T(s, px + pw / 2, py + ph + 30, 'cellák a rekeszfalak között;', 'kf-s halo', { 'text-anchor': 'middle' });
  T(s, px + pw / 2, py + ph + 50, 'a külső körvonal = az építményé', 'kf-s halo', { 'text-anchor': 'middle' });
}

/* ====================================================================== F) a genfi szekrény ütemei */
const GF = { W: 240, H: 470, Y0: 150, k: 10.6, x0: 92, x1: 196 };
const gy = (z) => GF.Y0 - z * GF.k;
const LAYERS = [
  [0, -3, 'f-soilD', 'pat-gravel'], [-3, -6.5, 'f-soilA', 'pat-sand'], [-6.5, -9, 'f-soilC', 'pat-sand'],
  [-9, -22, 'f-soilC', 'pat-soil'], [-22, -28, 'f-soilB', 'pat-clay'], [-28, -30.2, 'f-soilE', 'pat-clay'],
];
function gSoil(s, cut = null) {
  R(s, 0, 0, GF.W, gy(0), 'f-sky', { opacity: 0.35 });
  for (const [a, b, cls, pat] of LAYERS) soil(s, 0, gy(a), GF.W, Math.min(GF.H, gy(b)) - gy(a), cls, pat);
  if (cut) P(s, poly(cut), 'f-sky', { opacity: 0.35 });
  L(s, 0, gy(0), GF.W, gy(0), 'kf-gl');
}
function gBox(s, zt, zb, floors) {
  const { x0, x1 } = GF, t = 8;
  const yt = gy(zt), yb = gy(zb);
  R(s, x0 + t, yt, x1 - x0 - 2 * t, yb - yt - 4, 'kf-void2');
  for (let i = 1; i <= floors; i++) { const y = yt + (yb - yt - 22) * i / (floors + 1); R(s, x0 + t, y - 2, x1 - x0 - 2 * t, 4, 'f-conc2'); }
  conc(s, poly([[x0, yt], [x0 + t, yt], [x0 + t, yb - 26], [x0 + 3, yb], [x0 - 6, yb], [x0 - 6, yb - 20], [x0, yb - 24]]));
  conc(s, poly([[x1, yt], [x1 - t, yt], [x1 - t, yb - 26], [x1 - 3, yb], [x1 + 6, yb], [x1 + 6, yb - 20], [x1, yb - 24]]));
  R(s, x0, yt - 4, x1 - x0, 6, 'f-conc2 kf-edge');
}
function gWater(s) { L(s, 0, gy(-3.8), GF.W, gy(-3.8), 'kf-wl', { 'stroke-dasharray': '7 4' }); }
const LX = 14; // a szintjelek helye (bal szél)
const geneva = {
  u1: (s) => {
    gSoil(s); gWater(s);
    gBox(s, 3, -10, 3);
    for (const x of [GF.x0 - 7, GF.x1 + 1]) R(s, x, gy(0), 6, gy(-8) - gy(0), 'f-bento', { opacity: 0.9 });
    R(s, GF.x0 + 22, gy(-8.4) - 12, 40, 12, 'f-steel2', { rx: 3 });
    lvl(s, LX, gy(0), '±0,00'); lvl(s, LX, gy(-3.8), '−3,80'); lvl(s, LX, gy(-10), '−10,0');
    dimV(s, GF.x1 + 24, gy(3), gy(-10), '13,0 m', 1, 'kf-s', true);
    T(s, GF.x0 - 14, gy(-6), 'c', 'kf-t kf-acc-t halo', { 'text-anchor': 'end' });
    T(s, GF.x0 + 70, gy(-8.4) - 2, 'b', 'kf-t kf-acc-t halo');
    T(s, LX + 26, gy(-3.8) + 18, 'a', 'kf-t kf-acc-t halo');
  },
  u2: (s) => {
    gSoil(s); gWater(s);
    gBox(s, 10, -14.5, 8);
    for (const x of [GF.x0 - 7, GF.x1 + 1]) R(s, x, gy(0), 6, gy(-12.5) - gy(0), 'f-bento', { opacity: 0.9 });
    lvl(s, LX, gy(0), '±0,00'); lvl(s, LX, gy(-14.5), '−14,50');
    dimV(s, GF.x1 + 24, gy(10), gy(-14.5), '24,5 m', 1, 'kf-s', true);
    dimH(s, GF.x0, GF.x1, gy(10) - 14, 'D = 57,0 m', 'kf-s');
  },
  u3: (s) => {
    gSoil(s, [[GF.x0 - 40, gy(0)], [GF.x0 - 8, gy(-3.5)], [GF.x1 + 8, gy(-3.5)], [GF.x1 + 40, gy(0)]]);
    gWater(s);
    gBox(s, -3.5, -28, 8);
    for (const x of [GF.x0 - 7, GF.x1 + 1]) R(s, x, gy(-3.5), 6, gy(-26) - gy(-3.5), 'f-grout', { opacity: 0.95 });
    for (const z of [-10, -18]) arw(s, GF.x0 - 34, gy(z), GF.x0 - 10, gy(z), 'kf-ar kf-acc', 7);
    lvl(s, LX, gy(0), '±0,00'); lvl(s, LX, gy(-28), '−28,0');
    lvl(s, GF.x1 + 30, gy(-3.5), '−3,50', 'end');
    T(s, GF.x0 - 38, gy(-14) + 6, 'd', 'kf-t kf-acc-t halo', { 'text-anchor': 'end' });
  },
};
function figGenf(el) { panels(el, (el.dataset.v || 'u1,u2,u3').split(','), GF.W, GF.H, geneva); }

/* ====================================================================== G) a kész genfi szekrény metszete */
function figGenfKesz(el) {
  const W = 640, H = 470, s = mk(el, W, H, 'A kész süllyesztett szekrény metszete: hét garázsszint, felette két épülettömb');
  const k = 7.6, Y0 = 210, y = (z) => Y0 - z * k;
  soil(s, 0, Y0, W, H - Y0, 'f-soilC', 'pat-soil');
  soil(s, 0, y(-22), W, H - y(-22), 'f-soilB', 'pat-clay');
  L(s, 0, Y0, W, Y0, 'kf-gl');
  const x0 = 120, x1 = 560;
  // szekrény
  R(s, x0, y(-3), x1 - x0, y(-27.9) - y(-3), 'kf-void2');
  for (let i = 0; i < 8; i++) { const yy = y(-3 - 1 - i * 2.7); R(s, x0, yy - 2, x1 - x0, 4, 'f-conc2'); }
  for (const x of [230, 450]) R(s, x - 3, y(-3), 6, y(-24.5) - y(-3), 'f-conc2');
  // rámpa (középen)
  R(s, 316, y(-3), 48, y(-24.5) - y(-3), 'kf-ramp');
  for (let i = 0; i < 8; i++) { const yy = y(-3.6 - i * 2.7); L(s, 316, yy, 364, yy + 14, 'kf-ln'); }
  // autók
  for (const [cx, z] of [[170, -20.6], [270, -20.6], [410, -15.2], [500, -9.8], [180, -12.5]]) { const yy = y(z); R(s, cx - 18, yy - 9, 36, 9, 'f-steel', { rx: 4 }); R(s, cx - 10, yy - 15, 20, 7, 'f-steel2', { rx: 3 }); }
  // fenéklemez + vágóél
  conc(s, poly([[x0 - 10, y(-24.5)], [x1 + 10, y(-24.5)], [x1 + 10, y(-27.9)], [x0 - 10, y(-27.9)]]));
  conc(s, poly([[x0 - 10, y(-3)], [x0, y(-3)], [x0, y(-24.5)], [x0 - 10, y(-24.5)]]));
  conc(s, poly([[x1, y(-3)], [x1 + 10, y(-3)], [x1 + 10, y(-24.5)], [x1, y(-24.5)]]));
  conc(s, poly([[x0 - 10, y(-24.5)], [x0 + 16, y(-24.5)], [x0 - 4, y(-28)], [x0 - 20, y(-28)], [x0 - 20, y(-25.5)]]));
  conc(s, poly([[x1 + 10, y(-24.5)], [x1 - 16, y(-24.5)], [x1 + 4, y(-28)], [x1 + 20, y(-28)], [x1 + 20, y(-25.5)]]));
  // födém a terep alatt + épülettömbök
  conc(s, poly([[x0 - 10, y(-3)], [x1 + 10, y(-3)], [x1 + 10, y(-1)], [x0 - 10, y(-1)]]), 'f-conc2');
  for (const [a, b] of [[x0 + 10, x0 + 160], [x1 - 160, x1 - 10]]) {
    R(s, a, y(23.7), b - a, y(0) - y(23.7), 'f-bld kf-edge');
    for (let z = 2.9; z < 23.7; z += 2.9) L(s, a, y(z), b, y(z), 'kf-ln', { opacity: 0.5 });
    for (let x = a + 30; x < b - 10; x += 30) L(s, x, y(23.7), x, y(0), 'kf-ln', { opacity: 0.35 });
  }
  lvl(s, 40, y(23.7), '+23,70'); lvl(s, 40, y(0), '±0,00'); lvl(s, 40, y(-28), '−28,0');
  dimV(s, W - 46, y(-4), y(-22.9), '7 × 2,70 m', 1, 'kf-s', true);
  dimV(s, W - 18, y(0), y(-27.9), '27,9 m', 1, 'kf-s', true);
  lead(s, 340, y(-12), 392, y(-30.8), 'rámpa', 'start', 'kf-s');
  lead(s, x0 + 40, y(-26.2), 70, y(-33), 'fenéklemez', 'start', 'kf-s');
  lead(s, x1 + 14, y(-27.4), x1 + 30, y(-32.4), 'vágóél', 'start', 'kf-s');
}

/* ====================================================================== H) keszon anatómiája */
function figKeszon(el) {
  const W = 560, H = 430, s = mk(el, W, H, 'Keszon (légnyomásos szekrény) metszete: munkakamra túlnyomásos levegőben, aknacső, személy- és anyagzsilip, kompresszor');
  const WL = 120, BED = 232;
  R(s, 0, 0, W, WL, 'f-sky', { opacity: 0.45 });
  water(s, 0, WL, W, BED - WL);
  soil(s, 0, BED, W, H - BED, 'f-soilA', 'pat-sand');
  soil(s, 0, 396, W, H - 396, 'f-soilD', 'pat-gravel');
  L(s, 0, BED, W, BED, 'kf-gl');
  const x0 = 150, x1 = 410, ce = 380, ch = 54, roof = 30;
  // munkakamra (túlnyomás) + vágóél
  R(s, x0 + 10, ce - ch, x1 - x0 - 20, ch, 'kf-air');
  conc(s, poly([[x0, ce - ch - roof], [x1, ce - ch - roof], [x1, ce], [x1 - 6, ce], [x1 - 22, ce - ch + 6], [x1 - 22, ce - ch], [x0 + 22, ce - ch], [x0 + 22, ce - ch + 6], [x0 + 6, ce], [x0, ce]]));
  // a pillér (falazat / sovány beton kitöltés) a mederfenék fölé
  conc(s, poly([[x0 + 16, 150], [x1 - 16, 150], [x1, ce - ch - roof], [x0, ce - ch - roof]]), 'f-conc2');
  // aknacsövek: személy (bal) és anyag (jobb)
  const sx = 230, mx = 330;
  for (const x of [sx, mx]) { R(s, x - 9, 70, 18, ce - ch - 70 + 2, 'f-steel'); R(s, x - 9, 70, 18, ce - ch - 70 + 2, 'kf-edge', { fill: 'none' }); }
  // zsilipek a csövek tetején
  R(s, sx - 30, 34, 60, 40, 'f-acc kf-edge', { rx: 6 }); R(s, mx - 28, 38, 56, 34, 'f-steel2 kf-edge', { rx: 6 });
  // kompresszor egy uszályon + légvezeték
  R(s, 444, WL - 20, 100, 22, 'f-steel2 kf-edge', { rx: 4 });
  R(s, 462, WL - 56, 64, 36, 'f-grp kf-edge', { rx: 4 });
  P(s, `M462 ${WL - 40} H${mx + 22} V${ce - ch - 2}`, 'kf-pipe', { fill: 'none' });
  T(s, mx + 30, 178, 'légvezeték', 'kf-s halo');
  // emberek, föld a kamrában
  person(s, 210, ce - 6, 1); person(s, 268, ce - 6, 1); person(s, 330, ce - 6, 1);
  P(s, `M${x0 + 30} ${ce} Q${(x0 + x1) / 2} ${ce - 10} ${x1 - 30} ${ce}`, 'kf-ln', { fill: 'none', 'stroke-dasharray': '4 3' });
  // a levegő kiszorítja a vizet: nyilak a vágóél alatt kifelé
  for (const [x, dx] of [[x0 + 8, -26], [x1 - 8, 26]]) arw(s, x, ce - 4, x + dx, ce - 4, 'kf-ar kf-water', 7);
  // h_v méret
  dimV(s, 70, WL, ce, 'h_v', -1, 'kf-t');
  T(s, 14, WL - 8, 'vízszint', 'kf-s halo');
  T(s, W - 14, BED + 22, 'mederfenék', 'kf-s halo', { 'text-anchor': 'end' });
  lead(s, sx, 54, 150, 20, 'személyzsilip', 'end', 'kf-s');
  lead(s, mx + 28, 56, 430, 20, 'anyagzsilip', 'start', 'kf-s');
  T(s, 494, WL - 64, 'kompresszor', 'kf-s halo', { 'text-anchor': 'middle' });
  lead(s, sx + 9, 190, 120, 176, 'aknacső', 'end', 'kf-s');
  lead(s, x1 - 40, 200, 470, 200, 'pillértest', 'start', 'kf-s');
  lead(s, x1 - 60, ce - 26, 470, 300, 'munkakamra', 'start', 'kf-s');
  T(s, 474, 320, '(túlnyomás)', 'kf-s halo');
  lead(s, x1 - 3, ce - 2, 470, 356, 'vágóél', 'start', 'kf-s');
}

const FIGS = { kotro: figKotro, sema: figSema, ero: figEro, valt: figValt, edge: figEdge, nyitott: figNyitott, genf: figGenf, genfkesz: figGenfKesz, keszon: figKeszon };
function initKutFigs() {
  document.querySelectorAll('[data-kfig]').forEach((el) => {
    if (el.dataset.kready) return; el.dataset.kready = '1';
    const f = FIGS[el.dataset.kfig];
    if (f) try { f(el); } catch (e) { console.error('kút-ábra hiba', el.dataset.kfig, e); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initKutFigs); else initKutFigs();
