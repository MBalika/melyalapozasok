// C07 – Résfalak: saját, statikus SVG-ábrák (a régi, beszkennelt rajzok helyett)
// A HTML-ben: <div class="rf-fig…" data-rffig="név"></div> – betöltéskor azonnal kirajzolódnak (nem lusták, így nem ugrál az oldal).
import { svg, h, pathD } from './core.js';

/* ------------------------------------------------------------------ rajzsegédek */
const T = (p, x, y, s, cls = 'rf-t', o = {}) => svg('text', { x, y, class: cls, text: s, ...o }, p);
const TH = (p, x, y, html, cls = 'rf-t', o = {}) => svg('text', { x, y, class: cls, html, ...o }, p);
const R = (p, x, y, w, hh, cls, o = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...o }, p);
const C = (p, cx, cy, r, cls, o = {}) => svg('circle', { cx, cy, r: Math.max(0, r), class: cls, ...o }, p);
const L = (p, x1, y1, x2, y2, style, o = {}) => svg('line', { x1, y1, x2, y2, style, ...o }, p);
const P = (p, d, cls, o = {}) => svg('path', { d, class: cls, ...o }, p);
const G = (p, o = {}) => svg('g', o, p);
const sub = (a, b) => `${a}<tspan baseline-shift="sub" font-size="70%">${b}</tspan>`;
function mk(parent, w, hh, label, cls = '') {
  const s = svg('svg', { viewBox: `0 0 ${w} ${hh}`, class: 'rf-svg ' + cls, role: 'img', 'aria-label': label });
  parent.appendChild(s);
  return s;
}
/** nyíl: szín, vonalvastagság, fejméret */
function ar(p, x1, y1, x2, y2, col = 'var(--ink)', w = 2, hd = 8) {
  const g = G(p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  L(g, x1, y1, x2 - Math.cos(a) * hd * 0.6, y2 - Math.sin(a) * hd * 0.6, `stroke:${col};stroke-width:${w};stroke-linecap:round`);
  P(g, pathD([[x2, y2], [x2 - Math.cos(a - 0.42) * hd, y2 - Math.sin(a - 0.42) * hd], [x2 - Math.cos(a + 0.42) * hd, y2 - Math.sin(a + 0.42) * hd]], true), '', { style: `fill:${col}` });
  return g;
}
/** méretvonal két végjellel, középen felirattal (vízszintes vagy függőleges) */
function dimH(p, x1, x2, y, text, o = {}) {
  const g = G(p);
  L(g, x1, y, x2, y, 'stroke:var(--muted);stroke-width:1.2');
  for (const x of [x1, x2]) L(g, x, y - 6, x, y + 6, 'stroke:var(--muted);stroke-width:1.2');
  if (o.ext) for (const x of [x1, x2]) L(g, x, y + (o.ext > 0 ? 6 : -6), x, y + o.ext, 'stroke:var(--muted);stroke-width:.8;stroke-dasharray:3 3');
  T(g, (x1 + x2) / 2 + (o.dx || 0), y + (o.dy ?? -8), text, o.cls || 'rf-tn', { 'text-anchor': 'middle' });
  return g;
}
function dimV(p, x, y1, y2, text, o = {}) {
  const g = G(p);
  L(g, x, y1, x, y2, 'stroke:var(--muted);stroke-width:1.2');
  for (const y of [y1, y2]) L(g, x - 6, y, x + 6, y, 'stroke:var(--muted);stroke-width:1.2');
  const tx = x + (o.dx ?? -10), ty = (y1 + y2) / 2;
  T(g, tx, ty, text, o.cls || 'rf-tn', { 'text-anchor': o.anchor || 'end', 'dominant-baseline': 'middle', ...(o.rot ? { transform: `rotate(-90 ${tx} ${ty})`, 'text-anchor': 'middle' } : {}) });
  return g;
}
/** felirat vezetővonallal: (x,y) a mutatott pont, (tx,ty) a szöveg helye */
function lead(p, x, y, tx, ty, text, o = {}) {
  const g = G(p);
  L(g, x, y, tx + (o.anchor === 'end' ? 4 : -4), ty - 5, 'stroke:var(--ink2);stroke-width:1');
  C(g, x, y, 2.4, 'f-ink');
  T(g, tx, ty, text, o.cls || 'rf-t', { 'text-anchor': o.anchor || 'start' });
  return g;
}
/** számozott jelölő */
function badge(p, x, y, n, r = 13) {
  const g = G(p);
  C(g, x, y, r, 'f-grp', { style: 'stroke:var(--surface);stroke-width:2.5' });
  T(g, x, y + r * 0.38, String(n), 'rf-badge', { 'text-anchor': 'middle', style: `font-size:${r * 1.1}px` });
  return g;
}
const soilBox = (p, x, y, w, hh, cls = 'f-soilA', pat = 'pat-sand', op = 0.7) => { R(p, x, y, w, hh, cls); R(p, x, y, w, hh, '', { fill: `url(#${pat})`, opacity: op }); };
const conc = (p, x, y, w, hh, o = {}) => { const g = G(p); R(g, x, y, w, hh, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1', ...o }); R(g, x, y, w, hh, '', { fill: 'url(#pat-conc)' }); return g; };
const slurry = (p, x, y, w, hh) => { R(p, x, y, w, hh, 'f-slurry', { opacity: 0.92 }); R(p, x, y, w, hh, '', { fill: 'url(#pat-slurry)' }); };
/** vasalókosár (rácsos) */
function cage(p, x, y, w, hh, dx = 7, dy = 9) {
  const g = G(p, { style: 'stroke:var(--rebar);fill:none' });
  R(g, x, y, w, hh, '', { style: 'stroke-width:1.6' });
  for (let xx = x + dx; xx < x + w - 1; xx += dx) L(g, xx, y, xx, y + hh, 'stroke-width:.8');
  for (let yy = y + dy; yy < y + hh - 1; yy += dy) L(g, x, yy, x + w, yy, 'stroke-width:.8');
  return g;
}
/** kontraktorcső tölcsérrel */
function tremie(p, x, ytop, ybot, fw = 9) {
  const g = G(p);
  P(g, `M${x - fw} ${ytop} L${x + fw} ${ytop} L${x + 2} ${ytop + fw * 1.1} L${x - 2} ${ytop + fw * 1.1} Z`, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:.8' });
  R(g, x - 2, ytop + fw * 1.1, 4, ybot - ytop - fw * 1.1, 'f-steel', { style: 'stroke:var(--ink);stroke-width:.6' });
  return g;
}
/** lánctalpas daru (alapgép) – x0: a talp bal széle, y: terepszint, tip: a gém csúcsa */
function crane(p, x0, y, tip, s = 1) {
  const g = G(p);
  R(g, x0, y - 9 * s, 80 * s, 9 * s, 'f-steel2', { rx: 4 * s });
  for (let i = 0; i < 6; i++) C(g, x0 + 7 * s + i * 13.2 * s, y - 4.5 * s, 2.6 * s, 'f-surface', { opacity: 0.55 });
  R(g, x0 + 8 * s, y - 31 * s, 58 * s, 22 * s, 'f-acc', { rx: 3 * s });
  R(g, x0 + 48 * s, y - 42 * s, 18 * s, 12 * s, 'f-steel', { rx: 2 * s });
  R(g, x0 + 51 * s, y - 39.5 * s, 12 * s, 7 * s, 'f-sky', { opacity: 0.9 });
  L(g, x0 + 22 * s, y - 28 * s, tip[0], tip[1], `stroke:var(--steelm2);stroke-width:${4.5 * s};stroke-linecap:round`);
  L(g, x0 + 22 * s, y - 28 * s, tip[0], tip[1], `stroke:var(--surface);stroke-width:${1.1 * s};stroke-dasharray:3 5;opacity:.6`);
  return g;
}
/** réskanál – cx: közép, yb: alsó él, w: szélesség (a harapás hossza), open: 0…1 */
function grab(p, cx, yb, w, open = 0.4) {
  const g = G(p);
  const hh = Math.max(14, w * 0.6), jaw = Math.max(10, w * 0.4);
  R(g, cx - w / 2 + 3, yb - hh - jaw, w - 6, hh, 'f-warn', { style: 'stroke:var(--ink);stroke-width:1', rx: 2 });
  const o = open * w * 0.22;
  P(g, `M${cx - w / 2 + 3} ${yb - jaw} L${cx - 2} ${yb - jaw} L${cx - 3 - o} ${yb} L${cx - w / 2 - o} ${yb - 3} Z`, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:.8' });
  P(g, `M${cx + w / 2 - 3} ${yb - jaw} L${cx + 2} ${yb - jaw} L${cx + 3 + o} ${yb} L${cx + w / 2 + o} ${yb - 3} Z`, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:.8' });
  return { g, top: yb - hh - jaw };
}
/** kotró (a résvezető árkához) */
function excavator(p, x0, y, bucket) {
  const g = G(p);
  R(g, x0, y - 9, 62, 9, 'f-steel2', { rx: 4 });
  R(g, x0 + 6, y - 27, 44, 18, 'f-acc', { rx: 3 });
  R(g, x0 + 32, y - 38, 16, 12, 'f-steel', { rx: 2 });
  R(g, x0 + 35, y - 35.5, 10, 6, 'f-sky', { opacity: 0.9 });
  const sh = [x0 + 10, y - 24], el = [x0 - 22, y - 52];
  P(g, pathD([sh, el, bucket]), '', { style: 'fill:none;stroke:var(--warn);stroke-width:5;stroke-linecap:round;stroke-linejoin:round' });
  P(g, `M${bucket[0] - 7} ${bucket[1] - 6} q 2 12 12 9 l 2 -10 z`, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:.8' });
  return g;
}

/* ================================================================== 1. A szakaszos réselés hat lépése */
const STEPS = [
  ['Résvezető gerenda', 'A rés két oldalán vasbeton gerendapár készül: ez jelöli ki és vezeti a rést.'],
  ['Primer harapások', 'A primer tábla két szélét kiharapják; a kiemelt föld helyét azonnal zagy tölti ki.'],
  ['A tábla közepe', 'A középső harapás után a primer tábla teljes hosszában nyitva áll – zagy alatt.'],
  ['Vasalás, betonozás', 'Beemelik a vasalókosarat (hossztól függően 1–3 db), majd két kontraktorcsővel alulról betonoznak.'],
  ['Közbenső tábla', 'Két kész primer tábla között kiharapják a közbenső (szekunder) táblát.'],
  ['Vasalás, betonozás', 'A közbenső tábla vasalása és betonozása után a táblák összefüggő falat alkotnak.'],
];
const PX = { P1: [26, 92], S1: [92, 120], P2: [120, 186], S2: [186, 214], P3: [214, 280] };
const TY = 74, BOT = 188;
function stepFig(parent, n) {
  const s = mk(parent, 300, 200, `${n}. lépés: ${STEPS[n - 1][0]}`, 'rf-stepfig');
  R(s, 0, 0, 300, TY, 'f-sky');
  soilBox(s, 0, TY, 300, 200 - TY);
  const gw = (x1, x2) => { R(s, x1, TY - 1, x2 - x1, 8, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:.8' }); };
  const lab = (k, txt) => { const [a, b] = PX[k]; T(s, (a + b) / 2, BOT - 6, txt, 'rf-tn rf-onfill', { 'text-anchor': 'middle' }); };
  const panelConc = (k) => { const [a, b] = PX[k]; conc(s, a, TY + 4, b - a, BOT - TY - 4); };
  const panelSl = (a, b, top = TY + 3) => slurry(s, a, top, b - a, BOT - top);
  if (n === 1) {
    R(s, 150, TY, 56, 8, 'f-soilB', { opacity: 0.9 });
    gw(18, 150);
    excavator(s, 222, TY, [178, TY + 5]);
    T(s, 84, TY - 10, 'résvezető gerenda', 'rf-ts', { 'text-anchor': 'middle' });
    ar(s, 84, TY - 6, 84, TY + 1, 'var(--ink2)', 1.2, 5);
  } else {
    if (n === 2) { panelSl(26, 54); panelSl(64, 92); }
    if (n === 3) panelSl(26, 92);
    if (n === 4) {
      panelSl(26, 92); conc(s, 26, 128, 66, BOT - 128);
      cage(s, 30, TY + 6, 58, BOT - TY - 9, 7.25, 9);
      tremie(s, 43, TY - 16, BOT - 6); tremie(s, 75, TY - 16, BOT - 6);
      L(s, 59, 10, 59, TY + 6, 'stroke:var(--ink);stroke-width:1');
    }
    if (n >= 5) { panelConc('P1'); panelConc('P2'); }
    if (n === 5) panelSl(92, 120);
    if (n === 6) {
      panelSl(92, 120); conc(s, 92, 134, 28, BOT - 134);
      cage(s, 95, TY + 6, 22, BOT - TY - 9, 5.5, 9);
      tremie(s, 106, TY - 16, BOT - 6, 7);
      L(s, 106, 10, 106, TY - 16, 'stroke:var(--ink);stroke-width:1');
    }
    gw(10, 292);
    if (n === 2) { const gr = grab(s, 78, 150, 28, 0.6); L(s, 78, 10, 78, gr.top, 'stroke:var(--ink);stroke-width:1'); crane(s, 150, TY, [78, 10]); }
    if (n === 3) { const gr = grab(s, 59, 160, 28, 0.6); L(s, 59, 10, 59, gr.top, 'stroke:var(--ink);stroke-width:1'); crane(s, 150, TY, [59, 10]); }
    if (n === 4) crane(s, 160, TY, [59, 10]);
    if (n === 5) { const gr = grab(s, 106, 156, 28, 0.6); L(s, 106, 10, 106, gr.top, 'stroke:var(--ink);stroke-width:1'); crane(s, 196, TY, [106, 10]); }
    if (n === 6) crane(s, 196, TY, [106, 10]);
    if (n >= 5) { lab('P1', 'P'); lab('P2', 'P'); lab('S1', 'S'); }
    if (n <= 4) lab('P1', 'P');
  }
  return s;
}
function renderSteps(el) {
  el.classList.add('rf-steps');
  STEPS.forEach(([t, d], i) => {
    const card = h('figure', { class: 'rf-step' });
    const box = h('div', { class: 'rf-stepviz' });
    stepFig(box, i + 1);
    card.append(box, h('figcaption', {}, h('span', { class: 'rf-stepn' }, String(i + 1)), h('b', {}, t), h('span', { class: 'rf-stepd' }, d)));
    el.append(card);
  });
}

/* ================================================================== 2. Résvezető gerenda – két kialakítás */
function renderGW(el, kind) {
  const W = 340, H = 260;
  const s = mk(el, W, H, kind === 'L' ? 'L alakú résvezető gerenda metszete' : 'Egyenes résvezető gerenda metszete');
  const TY2 = 62, hb = 96, t = 20, gap = 62, xl = 128, xr = xl + t + gap; // xl: bal fal bal síkja
  // talaj
  soilBox(s, 0, TY2, W, H - TY2, 'f-soilA', 'pat-soil', 0.8);
  // rés (zaggyal) a gerendák között és alatta
  slurry(s, xl + t, TY2 + 8, gap, H - TY2 - 8);
  P(s, `M${xl + t} ${TY2 + 8} h${gap}`, '', { style: 'stroke:var(--surface);stroke-width:1.5' });
  T(s, xl + t + gap / 2, 214, 'zagy', 'rf-ts rf-onfill', { 'text-anchor': 'middle' });
  // szakadásvonal alul
  P(s, `M${xl + t - 6} ${H - 18} l 10 -6 l 10 6 l 10 -6 l 10 6 l 10 -6 l 10 6 l 10 -6`, '', { style: 'fill:none;stroke:var(--surface);stroke-width:5' });
  P(s, `M${xl + t - 6} ${H - 18} l 10 -6 l 10 6 l 10 -6 l 10 6 l 10 -6 l 10 6 l 10 -6`, '', { style: 'fill:none;stroke:var(--muted);stroke-width:1.2' });
  // gerendák
  const beam = (x, dir) => {
    if (kind === 'L') {
      const foot = 92, ft = 20; // talp hossza (~1,0–1,5 m) és vastagsága
      const x0 = dir < 0 ? x + t - foot : x;
      P(s, dir < 0
        ? `M${x} ${TY2} h${t} v${hb} h${-foot} v${-ft} h${foot - t} Z`
        : `M${x} ${TY2} h${t} v${hb - ft} h${foot - t} v${ft} h${-foot} Z`, 'f-conc', { style: 'stroke:var(--ink);stroke-width:1.4' });
      P(s, dir < 0
        ? `M${x} ${TY2} h${t} v${hb} h${-foot} v${-ft} h${foot - t} Z`
        : `M${x} ${TY2} h${t} v${hb - ft} h${foot - t} v${ft} h${-foot} Z`, '', { fill: 'url(#pat-conc)' });
      return x0;
    }
    R(s, x, TY2, t, hb, 'f-conc', { style: 'stroke:var(--ink);stroke-width:1.4' });
    R(s, x, TY2, t, hb, '', { fill: 'url(#pat-conc)' });
    return x;
  };
  const fl = beam(xl, -1); beam(xr, 1);
  // terepszint
  L(s, 0, TY2, xl, TY2, 'stroke:var(--ink);stroke-width:1.6');
  L(s, xr + t, TY2, W, TY2, 'stroke:var(--ink);stroke-width:1.6');
  // dúc a két gerenda között
  R(s, xl + t, TY2 + 10, gap, 11, 'f-timber', { style: 'stroke:var(--timber2);stroke-width:1' });
  // zagyszint
  P(s, `M${xl + t + gap - 18} ${TY2 + 26} l 6 -9 h -12 z`, '', { style: 'fill:var(--ink2)' });
  // méretek
  dimH(s, xl, xl + t, 30, '20–30 cm', { ext: 26 });
  dimV(s, 22, TY2, TY2 + hb, '1,0–1,5 m', { dx: 14, anchor: 'start', rot: true });
  L(s, 22, TY2, xl, TY2, 'stroke:var(--muted);stroke-width:.8;stroke-dasharray:3 3');
  L(s, 22, TY2 + hb, fl, TY2 + hb, 'stroke:var(--muted);stroke-width:.8;stroke-dasharray:3 3');
  if (kind === 'L') dimH(s, fl, xl + t, TY2 + hb + 20, '1,0–1,5 m', { dy: 18, ext: -18 });
  lead(s, xl + t + gap / 2, TY2 + 15, 262, 38, 'dúc', { cls: 'rf-ts' });
  T(s, kind === 'L' ? 316 : 300, 128, 'talaj', 'rf-ts rf-onfill', { 'text-anchor': 'end' });
}

/* ================================================================== 3. Réskanál és marótárcsák */
function renderGrab(el) {
  const W = 360, H = 240, TY3 = 48;
  const s = mk(el, W, H, 'Résmarkoló: a nyitott réskanál a zagyos résben');
  R(s, 0, 0, W, TY3, 'f-sky');
  soilBox(s, 0, TY3, W, H - TY3);
  slurry(s, 90, TY3 + 4, 180, H - TY3 - 4);
  R(s, 80, TY3 - 2, 200, 10, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:.8' });
  // kanál: nyitva, a harapás hossza 2,8 m
  const cx = 180, yb = 196, w = 140;
  const body = G(s);
  R(body, cx - 34, yb - 96, 68, 46, 'f-warn', { style: 'stroke:var(--ink);stroke-width:1.4', rx: 3 });
  R(body, cx - 26, yb - 90, 10, 34, 'f-steel', { style: 'stroke:var(--ink);stroke-width:.8' });
  R(body, cx + 16, yb - 90, 10, 34, 'f-steel', { style: 'stroke:var(--ink);stroke-width:.8' });
  P(body, `M${cx - 30} ${yb - 50} L${cx - 4} ${yb - 50} L${cx - 14} ${yb} L${cx - w / 2} ${yb - 14} Z`, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:1.4' });
  P(body, `M${cx + 30} ${yb - 50} L${cx + 4} ${yb - 50} L${cx + 14} ${yb} L${cx + w / 2} ${yb - 14} Z`, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:1.4' });
  for (const k of [-1, 1]) for (let i = 0; i < 4; i++) { const x = cx + k * (w / 2 - 4 - i * 13); const y = yb - 14 + i * 3.6; P(body, `M${x} ${y} l ${-k * 3} 8 l ${-k * 6} -7 z`, 'f-ink'); }
  L(s, cx, 6, cx, yb - 96, 'stroke:var(--ink);stroke-width:2.2');
  L(s, cx - 6, 6, cx - 6, yb - 96, 'stroke:var(--ink);stroke-width:1');
  dimH(s, cx - w / 2, cx + w / 2, yb + 22, '≈ 2,8 m – egy harapás', { dy: 18 });
  T(s, 98, TY3 + 36, 'zagy', 'rf-ts rf-onfill');
  T(s, 350, TY3 + 36, 'talaj', 'rf-ts rf-onfill', { 'text-anchor': 'end' });
}
function renderCutter(el) {
  const W = 360, H = 240;
  const s = mk(el, W, H, 'Hydrofraiser: két ellentétesen forgó marótárcsa, középen a szívócsonk');
  soilBox(s, 0, 0, W, H, 'f-soilA', 'pat-gravel', 0.8);
  slurry(s, 40, 0, 280, H);
  // keret és szívócső
  R(s, 70, 0, 220, 56, 'f-warn', { style: 'stroke:var(--ink);stroke-width:1.4' });
  R(s, 166, 0, 28, 132, 'f-steel', { style: 'stroke:var(--ink);stroke-width:1.2' });
  // tárcsák
  const wheel = (cx, cy, dir) => {
    const g = G(s);
    const r = 62;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + (dir > 0 ? 0.1 : -0.1);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      P(g, `M${x} ${y} L${cx + Math.cos(a + 0.12) * (r + 13)} ${cy + Math.sin(a + 0.12) * (r + 13)} L${cx + Math.cos(a + 0.2) * r} ${cy + Math.sin(a + 0.2) * r} Z`, 'f-ink');
    }
    C(g, cx, cy, r, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:1.6' });
    C(g, cx, cy, r * 0.62, 'f-steel', { style: 'stroke:var(--ink);stroke-width:1' });
    C(g, cx, cy, 5, 'f-ink');
    // forgásirány: alul a középső szívócsonk felé
    const a1 = dir > 0 ? 2.45 : 0.69, a2 = dir > 0 ? 1.2 : 1.94, rr = r * 0.4;
    const x1 = cx + Math.cos(a1) * rr, y1 = cy + Math.sin(a1) * rr, x2 = cx + Math.cos(a2) * rr, y2 = cy + Math.sin(a2) * rr;
    P(g, `M${x1} ${y1} A ${rr} ${rr} 0 0 ${dir > 0 ? 0 : 1} ${x2} ${y2}`, '', { style: 'fill:none;stroke:var(--surface);stroke-width:3' });
    const ta = a2 + (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    ar(g, x2 - Math.cos(ta) * 4, y2 - Math.sin(ta) * 4, x2 + Math.cos(ta) * 2, y2 + Math.sin(ta) * 2, 'var(--surface)', 3, 9);
  };
  wheel(112, 150, 1); wheel(248, 150, -1);
  // törmelék a csonk felé és fel a csőben
  const bits = [[150, 222], [164, 206], [196, 210], [210, 224], [174, 186], [186, 196], [180, 166], [172, 146], [186, 120], [178, 96], [184, 70], [176, 44], [182, 20]];
  for (const [x, y] of bits) C(s, x, y, 3.6, 'f-soilB', { style: 'stroke:var(--ink);stroke-width:.6' });
  ar(s, 180, 150, 180, 112, 'var(--ink)', 2, 7); ar(s, 180, 70, 180, 30, 'var(--ink)', 2, 7);
  T(s, 200, 104, 'szívócső', 'rf-ts rf-onfill');
  T(s, 180, 236, 'a tárcsák a fenéken a csonk felé hordják a törmeléket', 'rf-ts rf-onfill', { 'text-anchor': 'middle' });
}

/* ================================================================== 4. A zagy útja (hydrofraiser, zagykezelő telep) */
function renderZagykor(el) {
  const W = 1000, H = 440, TY4 = 262;
  const s = mk(el, W, H, 'A zagy útja hydrofraiseres réselésnél: marótárcsa, bontószivattyú, homoktalanító, tartály, szivattyúk, keverő, bentonitsiló', 'rf-zagy');
  soilBox(s, 0, TY4, W, H - TY4, 'f-soilA', 'pat-sand', 0.6);
  L(s, 0, TY4, W, TY4, 'stroke:var(--ink);stroke-width:1.6');
  const dirty = 'stroke:var(--soilB);stroke-width:7;fill:none;stroke-linejoin:round;stroke-linecap:round';
  const clean = 'stroke:var(--bento);stroke-width:7;fill:none;stroke-linejoin:round;stroke-linecap:round';
  // rés és marógép
  slurry(s, 62, TY4, 92, H - TY4);
  R(s, 52, TY4 - 8, 112, 10, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:.8' });
  P(s, `M${120} ${TY4 + 9} l 7 -10 h -14 z`, '', { style: 'fill:var(--ink2)' });
  const fx = 76, fw = 64, fy0 = TY4 + 22, fy1 = 404;
  R(s, fx, fy0, fw, fy1 - fy0, '', { style: 'fill:none;stroke:var(--warn);stroke-width:4' });
  for (let y = fy0; y < fy1 - 20; y += 38) { L(s, fx, y, fx + fw, y + 38, 'stroke:var(--warn);stroke-width:2.4'); L(s, fx, y + 38, fx + fw, y + 38, 'stroke:var(--warn);stroke-width:2.4'); }
  for (const cx of [91, 125]) { C(s, cx, 416, 17, 'f-steel2', { style: 'stroke:var(--ink);stroke-width:1.4' }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; C(s, cx + Math.cos(a) * 18, 416 + Math.sin(a) * 18, 3, 'f-ink'); } }
  R(s, 98, 372, 20, 22, 'f-steel', { style: 'stroke:var(--ink);stroke-width:1.2', rx: 4 });
  // 2 → 3: talajjal terhelt zagy fel a homoktalanítóra
  P(s, `M108 372 V 40 Q108 28 120 28 H 440 Q452 28 452 40 V 118`, '', { style: dirty });
  ar(s, 452, 100, 452, 124, 'var(--soilB)', 4, 14);
  // tartály (4) + homoktalanító (3)
  R(s, 300, 150, 190, TY4 - 150, '', { style: 'fill:var(--surface2);stroke:var(--ink);stroke-width:1.6' });
  slurry(s, 302, 176, 186, TY4 - 178);
  P(s, 'M330 186 l 7 -10 h -14 z', '', { style: 'fill:var(--ink2)' });
  P(s, 'M410 122 H 500 V 150 Z', 'f-grp', { opacity: 0.85, style: 'stroke:var(--ink);stroke-width:1.4' });
  P(s, 'M410 122 H 500 V 150 H 410 Z', '', { style: 'fill:none;stroke:var(--ink);stroke-width:1.4' });
  for (const x of [424, 444, 464]) ar(s, x, 152, x, 174, 'var(--ink2)', 2, 7);
  // 3 → 6: leválasztott talaj
  P(s, 'M500 136 H 548 Q 560 136 560 148 V 196', '', { style: 'stroke:var(--soilB);stroke-width:6;fill:none' });
  ar(s, 560, 186, 560, 206, 'var(--soilB)', 3, 10);
  P(s, `M520 ${TY4} Q 562 206 604 ${TY4} Z`, 'f-soilB', { style: 'stroke:var(--ink);stroke-width:1.2' });
  P(s, `M520 ${TY4} Q 562 206 604 ${TY4} Z`, '', { fill: 'url(#pat-gravel)', opacity: 0.9 });
  // 4 → 5 → rés: tisztított zagy vissza
  P(s, `M300 236 H 236`, '', { style: clean });
  C(s, 222, 240, 17, 'f-steel', { style: 'stroke:var(--ink);stroke-width:1.4' });
  P(s, `M206 240 H 176 Q 164 240 164 252 V ${TY4 + 6}`, '', { style: clean });
  ar(s, 164, TY4 - 6, 164, TY4 + 20, 'var(--bento)', 4, 14);
  // keverő (8), szivattyú (7), siló (9), víz (10)
  R(s, 724, 214, 100, TY4 - 214, '', { style: 'fill:var(--surface2);stroke:var(--ink);stroke-width:1.6' });
  slurry(s, 726, 226, 96, TY4 - 228);
  L(s, 774, 196, 774, 246, 'stroke:var(--ink);stroke-width:2');
  P(s, 'M752 246 h 44', '', { style: 'stroke:var(--ink);stroke-width:4;stroke-linecap:round' });
  P(s, `M724 240 H 692`, '', { style: clean });
  C(s, 676, 244, 17, 'f-steel', { style: 'stroke:var(--ink);stroke-width:1.4' });
  P(s, `M676 227 V 96 Q676 84 664 84 H 322 Q 310 84 310 96 V 164`, '', { style: clean });
  ar(s, 310, 146, 310, 172, 'var(--bento)', 4, 14);
  P(s, 'M876 60 H 956 V 196 L 924 226 H 908 L 876 196 Z', 'f-warn', { opacity: 0.85, style: 'stroke:var(--ink);stroke-width:1.6' });
  L(s, 882, 226, 882, TY4, 'stroke:var(--ink);stroke-width:2.4'); L(s, 950, 226, 950, TY4, 'stroke:var(--ink);stroke-width:2.4');
  P(s, 'M916 226 L 792 182', '', { style: 'stroke:var(--steelm2);stroke-width:11;stroke-linecap:round' });
  P(s, 'M916 226 L 792 182', '', { style: 'stroke:var(--ink);stroke-width:1;stroke-dasharray:4 4' });
  ar(s, 792, 184, 792, 208, 'var(--ink)', 2.4, 9);
  ar(s, 748, 150, 748, 210, 'var(--water)', 3, 11);
  T(s, 748, 140, 'víz', 'rf-ts', { 'text-anchor': 'middle' });
  // jelölők
  const B = [[1, 46, 416], [2, 140, 383], [3, 520, 112], [4, 400, 214], [5, 222, 210], [6, 618, 238], [7, 676, 214], [8, 846, 232], [9, 916, 120], [10, 718, 150]];
  for (const [n, x, y] of B) badge(s, x, y, n, 15);
  // jelmagyarázat-sáv
  P(s, 'M560 36 h 46', '', { style: dirty });
  T(s, 616, 42, 'talajjal terhelt zagy', 'rf-ts');
  P(s, 'M780 36 h 46', '', { style: clean });
  T(s, 836, 42, 'tisztított, ill. friss zagy', 'rf-ts');
}

/* ================================================================== 5. Nyomások a rés falán (σp, σv, σx) */
function renderPress(el) {
  const W = 640, H = 580;
  const s = mk(el, W, H, 'A zagynyomás és a víz- és földnyomás a rés falán a mélység mentén', 'rf-press');
  // számpélda (szemléltető): homok φ = 32°, γ = 18 / γ′ = 10 kN/m³, h = 2,0 m, t = 0,5 m, ρ = 1,10 g/cm³, L = 5,6 m, D = 20 m
  const D = 20, t = 0.5, hw = 2, gb = 10.8, gw = 10, phi = 32 * Math.PI / 180, Lr = 5.6;
  const Ka = Math.tan(Math.PI / 4 - phi / 2) ** 2, s2 = Math.sin(2 * phi);
  const y0 = 64, ky = (500 - y0) / D, X0 = 330, kx = 0.9;
  const Y = (z) => y0 + z * ky;
  // talajtömbök
  soilBox(s, 46, y0, X0 - 34 - 46, Y(D) - y0, 'f-soilA', 'pat-sand', 0.35);
  soilBox(s, X0, y0, 300, Y(D) - y0, 'f-soilA', 'pat-sand', 0.35);
  R(s, X0 - 34, y0, 34, Y(D) - y0, 'f-slurry', { opacity: 0.35 });
  // résvezető
  R(s, X0 - 50, y0, 16, 1.2 * ky, 'f-conc', { style: 'stroke:var(--ink);stroke-width:1' });
  R(s, X0, y0, 16, 1.2 * ky, 'f-conc', { style: 'stroke:var(--ink);stroke-width:1' });
  // nyomások
  const sp = (z) => Math.max(0, (z - t) * gb);
  const sv = (z) => Math.max(0, (z - hw) * gw);
  const pts = []; let sx = 0, sxr = 0, sigv = 0; const dz = 0.05;
  for (let z = 0; z <= D + 1e-9; z += dz) {
    pts.push([z, sx, sxr]);
    const g = z < hw ? 18 : 10;
    sx += (Ka * g - sx * s2 / Lr) * dz; sigv += g * dz; sxr = Ka * sigv;
  }
  // σp (balra, sraffozva)
  P(s, pathD([[X0, Y(t)], [X0, Y(D)], [X0 - sp(D) * kx, Y(D)]], true), '', { style: 'fill:color-mix(in srgb, var(--bento) 30%, transparent);stroke:var(--ink);stroke-width:1.4' });
  for (let z = t + 0.8; z < D; z += 0.8) L(s, X0 - sp(z) * kx, Y(z), X0, Y(z), 'stroke:var(--ink2);stroke-width:.7');
  // σv (jobbra, kék)
  P(s, pathD([[X0, Y(hw)], [X0, Y(D)], [X0 + sv(D) * kx, Y(D)]], true), 'f-water', { style: 'stroke:var(--water);stroke-width:1.4' });
  // σv + σx (boltozódás) és Rankine
  P(s, pathD(pts.map(([z, a]) => [X0 + (sv(z) + a) * kx, Y(z)])), '', { style: 'fill:none;stroke:var(--ink);stroke-width:2.2' });
  P(s, pathD(pts.map(([z, , b]) => [X0 + (sv(z) + b) * kx, Y(z)])), '', { style: 'fill:none;stroke:var(--bad);stroke-width:1.8;stroke-dasharray:7 5' });
  // tengely, szintek
  ar(s, 30, y0 - 20, 30, y0 + 70, 'var(--ink)', 1.6, 8); T(s, 18, y0 + 66, 'z', 'rf-t', { 'text-anchor': 'middle', style: 'font-style:italic' });
  L(s, 46, y0, X0 - 50, y0, 'stroke:var(--ink);stroke-width:1.6'); L(s, X0 + 16, y0, W - 10, y0, 'stroke:var(--ink);stroke-width:1.6');
  L(s, X0 - 34, Y(t), X0, Y(t), 'stroke:var(--ink2);stroke-width:1.2');
  P(s, `M${X0 - 17} ${Y(t) - 1} l 6 -9 h -12 z`, '', { style: 'fill:var(--ink2)' });
  L(s, 46, Y(hw), X0 - 34, Y(hw), 'stroke:var(--water);stroke-width:1.4;stroke-dasharray:6 4'); L(s, X0, Y(hw), W - 10, Y(hw), 'stroke:var(--water);stroke-width:1.4;stroke-dasharray:6 4');
  P(s, `M${80} ${Y(hw) - 1} l 6 -9 h -12 z`, '', { style: 'fill:var(--water)' });
  T(s, 92, Y(hw) - 4, 'talajvízszint', 'rf-ts t-water');
  T(s, X0 - 17, y0 - 12, 'zagyszint', 'rf-ts', { 'text-anchor': 'middle' });
  // feliratok
  TH(s, X0 - 110, Y(15), sub('σ', 'p'), 'rf-tbig', { 'text-anchor': 'middle' });
  T(s, X0 - 110, Y(15) + 34, 'zagynyomás', 'rf-ts', { 'text-anchor': 'middle' });
  TH(s, X0 + 64, Y(16.2), sub('σ', 'v'), 'rf-tbig', { 'text-anchor': 'middle' });
  T(s, X0 + 64, Y(16.2) + 34, 'víznyomás', 'rf-ts', { 'text-anchor': 'middle' });
  const [zA, aA] = pts[Math.round(11 / dz)];
  lead(s, X0 + (sv(zA) + aA) * kx, Y(zA), 520, Y(8.6), '', {});
  TH(s, 520, Y(8.6), `${sub('σ', 'v')} + ${sub('σ', 'x')}`, 'rf-t');
  T(s, 520, Y(8.6) + 19, 'boltozódással', 'rf-ts');
  const [zB, , bB] = pts[Math.round(6 / dz)];
  lead(s, X0 + (sv(zB) + bB) * kx, Y(zB), 520, Y(4.2), 'Rankine-féle', { cls: 'rf-ts t-bad' });
  // összevetés a talpon
  const yb = Y(D) + 30;
  T(s, X0 - sp(D) * kx, yb, `${Math.round(sp(D))} kPa`, 'rf-tn', { 'text-anchor': 'middle' });
  T(s, X0 + (sv(D) + pts[pts.length - 1][1]) * kx, yb, `${Math.round(sv(D) + pts[pts.length - 1][1])} kPa`, 'rf-tn', { 'text-anchor': 'middle' });
  T(s, X0 + (sv(D) + pts[pts.length - 1][2]) * kx, yb + 20, `${Math.round(sv(D) + pts[pts.length - 1][2])} kPa`, 'rf-tn t-bad', { 'text-anchor': 'middle' });
  T(s, 46, yb + 20, 'z = 20 m', 'rf-tn');
}

/* ================================================================== 6. Betonozás: fúrt cölöp és réstábla */
function renderBeton(el) {
  const W = 1000, H = 580;
  const s = mk(el, W, H, 'Fúrt cölöp és réstábla betonozása: munkaszint, betonozási és visszavésési szint, betonszint, armatúra, betonozó tölcsér és csövek', 'rf-beton');
  const TY6 = 150, BOT6 = 540, Bz = 430; // terep, talp, pillanatnyi betonszint
  const LV = [[TY6, 'munkaszint'], [TY6 + 22, 'betonozási szint'], [TY6 + 46, 'visszavésési szint'], [Bz, 'betonszint']];
  // talaj
  soilBox(s, 0, TY6, W, BOT6 + 26 - TY6, 'f-soilA', 'pat-soil', 0.55);
  // ---------- fúrt cölöp
  const px = 96, pw = 56;
  slurry(s, px, TY6, pw, BOT6 - TY6);
  conc(s, px, Bz, pw, BOT6 - Bz);
  R(s, px - 6, TY6 - 16, 6, 54, 'f-steel', { style: 'stroke:var(--ink);stroke-width:1' }); R(s, px + pw, TY6 - 16, 6, 54, 'f-steel', { style: 'stroke:var(--ink);stroke-width:1' });
  const pc = G(s, { style: 'stroke:var(--rebar);fill:none' });
  R(pc, px + 6, TY6 + 10, pw - 12, BOT6 - TY6 - 18, '', { style: 'stroke-width:1.6' });
  for (let y = TY6 + 10; y < BOT6 - 14; y += 14) L(pc, px + 6, y + 14, px + pw - 6, y, 'stroke-width:.9');
  L(pc, px + pw / 2, TY6 + 10, px + pw / 2, BOT6 - 8, 'stroke-width:.9');
  C(s, px + pw / 2, 74, 26, '', { style: 'fill:var(--surface);stroke:var(--ink);stroke-width:1.6' });
  dimH(s, px + pw / 2 - 26, px + pw / 2 + 26, 36, 'cölöpátmérő', { ext: 38 });
  dimV(s, 40, TY6, BOT6, 'fúrási mélység', { rot: true, dx: -12 });
  lead(s, px - 3, TY6 + 18, 4, TY6 + 76, 'megvezető cső', { cls: 'rf-ts' });
  lead(s, px + pw - 8, 300, 196, 300, 'armatúra', { cls: 'rf-ts' });
  T(s, px + pw / 2, BOT6 + 22, 'fúrt cölöp', 'rf-tb', { 'text-anchor': 'middle' });
  // ---------- réstábla (hosszmetszet + felülnézet)
  const x0 = 330, x1 = 720;
  slurry(s, x0, TY6, x1 - x0, BOT6 - TY6);
  conc(s, x0, Bz, x1 - x0, BOT6 - Bz);
  conc(s, x0 - 26, TY6 + 4, 26, BOT6 - TY6 - 4); conc(s, x1, TY6 + 4, 26, BOT6 - TY6 - 4);
  L(s, x0, TY6, x0, BOT6, 'stroke:var(--ink);stroke-width:1.4'); L(s, x1, TY6, x1, BOT6, 'stroke:var(--ink);stroke-width:1.4');
  cage(s, x0 + 14, TY6 + 12, 168, BOT6 - TY6 - 22, 12, 14);
  cage(s, x0 + 208, TY6 + 12, 168, BOT6 - TY6 - 22, 12, 14);
  const tx = [x0 + 98, x0 + 292];
  for (const x of tx) tremie(s, x, TY6 - 50, BOT6 - 12, 16);
  // felülnézet
  const py = 52;
  R(s, x0 - 60, py, x1 - x0 + 120, 40, '', { style: 'fill:var(--surface2);stroke:var(--ink);stroke-width:1;stroke-dasharray:6 4' });
  R(s, x0, py, x1 - x0, 40, 'f-conc', { opacity: 0.55, style: 'stroke:var(--ink);stroke-width:1.6' });
  R(s, x0 + 14, py + 7, 168, 26, '', { style: 'fill:none;stroke:var(--rebar);stroke-width:1.6', rx: 6 });
  R(s, x0 + 208, py + 7, 168, 26, '', { style: 'fill:none;stroke:var(--rebar);stroke-width:1.6', rx: 6 });
  for (const x of tx) { C(s, x, py + 20, 11, '', { style: 'fill:var(--surface);stroke:var(--ink);stroke-width:1.4' }); C(s, x, py + 20, 3.5, 'f-ink'); }
  dimH(s, x0, x1, 24, 'panel hossza', { ext: 28 });
  T(s, tx[0] + 22, TY6 - 34, 'betonozó tölcsér', 'rf-ts');
  T(s, tx[1] + 10, 372, 'betonozó cső', 'rf-ts rf-onfill');
  T(s, tx[1] + 10, 389, '(kontraktorcső)', 'rf-ts rf-onfill');
  T(s, x0 + 196, Bz + 62, 'friss beton', 'rf-ts rf-onfill', { 'text-anchor': 'middle' });
  lead(s, x0 + 380, 300, 760, 300, 'armatúra', { cls: 'rf-ts' });
  T(s, (x0 + x1) / 2, BOT6 + 22, 'réstábla – felülnézet és hosszmetszet', 'rf-tb', { 'text-anchor': 'middle' });
  T(s, x0 + 8, 260, 'zagy', 'rf-ts rf-onfill');
  // ---------- résfal keresztmetszet
  const cx0 = 860, cw = 44;
  slurry(s, cx0, TY6, cw, BOT6 - TY6);
  conc(s, cx0, Bz, cw, BOT6 - Bz);
  for (const x of [cx0 - 18, cx0 + cw]) { R(s, x, TY6 - 4, 18, 44, 'f-conc2', { style: 'stroke:var(--ink);stroke-width:1.2' }); R(s, x, TY6 - 4, 18, 44, '', { fill: 'url(#pat-conc)' }); }
  cage(s, cx0 + 8, TY6 + 12, cw - 16, BOT6 - TY6 - 22, 7, 14);
  dimH(s, cx0, cx0 + cw, 116, 'falvastagság', { ext: 30 });
  lead(s, cx0 + cw + 10, TY6 + 14, 940, 214, 'résvezető', { cls: 'rf-ts', anchor: 'middle' });
  T(s, cx0 + cw / 2, BOT6 + 22, 'résfal metszete', 'rf-tb', { 'text-anchor': 'middle' });
  // ---------- szintvonalak
  for (const [y, t] of LV) {
    L(s, 160, y, 326, y, 'stroke:var(--ink2);stroke-width:1;stroke-dasharray:12 4 2 4');
    L(s, 748, y, 842, y, 'stroke:var(--ink2);stroke-width:1;stroke-dasharray:12 4 2 4');
    P(s, `M${176} ${y - 1} l 6 -9 h -12 z`, '', { style: 'fill:var(--ink2)' });
    T(s, 190, y - 4, t, 'rf-ts');
  }
}
/* kiegészítő ábrák: szerkezeti elemek metszete, vasalási részlet */
function renderShapes(el) {
  const s = mk(el, 480, 170, 'Résfallal készíthető szerkezeti elemek metszete: kör, téglalap, T és kereszt alakú');
  const cs = 'fill:var(--concrete);stroke:var(--ink);stroke-width:1.6';
  C(s, 60, 76, 30, '', { style: cs });
  R(s, 130, 56, 100, 40, '', { style: cs, rx: 3 });
  P(s, 'M260 46 h 90 v 30 h -30 v 50 h -30 v -50 h -30 Z', '', { style: cs });
  P(s, 'M400 36 h 30 v 30 h 30 v 30 h -30 v 30 h -30 v -30 h -30 v -30 h 30 Z', '', { style: cs });
  const lb = [[60, 'cölöp'], [180, 'réstábla'], [305, 'T alakú tábla'], [430, 'kereszt alakú']];
  for (const [x, t] of lb) T(s, x, 158, t, 'rf-ts', { 'text-anchor': 'middle' });
}
function renderCover(el) {
  const s = mk(el, 480, 190, 'Vasalási részlet: szabad távolság az acélbetétek között és betontakarás');
  P(s, 'M60 30 H 400 V 150 H 100 Q 60 150 60 110 Z', '', { style: 'fill:var(--concrete);stroke:var(--ink);stroke-width:1.6' });
  P(s, 'M60 30 H 400 V 150 H 100 Q 60 150 60 110 Z', '', { fill: 'url(#pat-conc)' });
  P(s, 'M400 112 H 120 Q 96 112 96 88 V 30', '', { style: 'fill:none;stroke:var(--rebar);stroke-width:5;stroke-linecap:round' });
  for (const x of [150, 300]) C(s, x, 98, 12, 'f-rebar', { style: 'stroke:var(--ink);stroke-width:1.2' });
  dimH(s, 162, 288, 70, 'szabad távolság', { dy: -10 });
  dimV(s, 426, 114.5, 150, '', {});
  L(s, 400, 114.5, 434, 114.5, 'stroke:var(--muted);stroke-width:.8;stroke-dasharray:3 3'); L(s, 400, 150, 434, 150, 'stroke:var(--muted);stroke-width:.8;stroke-dasharray:3 3');
  T(s, 426, 176, 'betontakarás', 'rf-ts', { 'text-anchor': 'middle' });
  lead(s, 296, 106, 214, 140, 'acélbetétek', { cls: 'rf-ts rf-onfill', anchor: 'end' });
}

/* ------------------------------------------------------------------ indítás */
const RENDER = {
  steps: renderSteps,
  'gw-L': (el) => renderGW(el, 'L'),
  'gw-I': (el) => renderGW(el, 'I'),
  grab: renderGrab,
  cutter: renderCutter,
  zagykor: renderZagykor,
  press: renderPress,
  beton: renderBeton,
  shapes: renderShapes,
  cover: renderCover,
};
function renderAll() {
  document.querySelectorAll('[data-rffig]').forEach((el) => {
    if (el.dataset.done) return;
    const fn = RENDER[el.dataset.rffig];
    if (!fn) { console.warn('Nincs ilyen résfal-ábra:', el.dataset.rffig); return; }
    try { fn(el); el.dataset.done = '1'; } catch (e) { console.error('Résfal-ábra hiba:', el.dataset.rffig, e); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderAll); else renderAll();
