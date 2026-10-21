// C08 – Kút-, szekrény- és keszonalapozás: kútsüllyesztő, acél köpenycsöves kút, szekrénytípusok, keszon-nyomás, elferdülés-monitor, kvíz
import { register, shell, slider, seg, toggle, stat, verdict, svg, figure, clear, fmt, clamp, lerp, pathD, h, loop } from './core.js';
import { defineQuiz } from './ui.js';

/* ------------------------------------------------------------------ rajzsegédek */
const T = (p, x, y, s, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text: s, ...o }, p);
const TH = (p, x, y, html, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, html, ...o }, p);
const R = (p, x, y, w, hh, cls, o = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...o }, p);
const C = (p, cx, cy, r, cls, o = {}) => svg('circle', { cx, cy, r: Math.max(0, r), class: cls, ...o }, p);
const L = (p, x1, y1, x2, y2, style, o = {}) => svg('line', { x1, y1, x2, y2, style, ...o }, p);
const P = (p, d, cls, o = {}) => svg('path', { d, class: cls, ...o }, p);
const G = (p, o = {}) => svg('g', o, p);
const sub = (a, b) => `${a}<tspan baseline-shift="sub" font-size="72%">${b}</tspan>`;
function ar(p, x1, y1, x2, y2, col = 'var(--ink)', w = 2, hd = 7) {
  const g = G(p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  L(g, x1, y1, x2 - Math.cos(a) * hd * 0.6, y2 - Math.sin(a) * hd * 0.6, `stroke:${col};stroke-width:${w};stroke-linecap:round`);
  svg('path', { d: pathD([[x2, y2], [x2 - Math.cos(a - 0.45) * hd, y2 - Math.sin(a - 0.45) * hd], [x2 - Math.cos(a + 0.45) * hd, y2 - Math.sin(a + 0.45) * hd]], true), style: `fill:${col}` }, g);
  return g;
}
function soil(p, x, y, w, hh, cls = 'f-soilA', pat = 'pat-sand', op = 0.75) {
  R(p, x, y, w, hh, cls);
  R(p, x, y, w, hh, '', { fill: `url(#${pat})`, opacity: op });
}
function grab(p, cx, yb, w, open = 0.4) {
  const g = G(p);
  const hh = 12, jaw = 9, o = open * 4;
  R(g, cx - w / 2 + 3, yb - hh - jaw, w - 6, hh, 'f-warn', { style: 'stroke:var(--ink);stroke-width:1', rx: 2 });
  P(g, `M${cx - w / 2 + 3} ${yb - jaw} L${cx - 2} ${yb - jaw} L${cx - 3 - o} ${yb} L${cx - w / 2 - o} ${yb - 2} Z`, 'f-steel2');
  P(g, `M${cx + w / 2 - 3} ${yb - jaw} L${cx + 2} ${yb - jaw} L${cx + 3 + o} ${yb} L${cx + w / 2 + o} ${yb - 2} Z`, 'f-steel2');
  return g;
}
function crane(p, x0, y, tip) {
  const g = G(p);
  R(g, x0, y - 9, 80, 9, 'f-steel2', { rx: 4.5 });
  for (let i = 0; i < 5; i++) C(g, x0 + 8 + i * 16, y - 4.5, 2.6, 'f-surface', { opacity: 0.55 });
  R(g, x0 + 8, y - 30, 58, 21, 'f-grp', { rx: 3 });
  R(g, x0 + 48, y - 41, 18, 12, 'f-steel', { rx: 2 });
  R(g, x0 + 51, y - 38, 12, 7, 'f-sky', { opacity: 0.9 });
  L(g, x0 + 54, y - 26, tip[0], tip[1], 'stroke:var(--steelm2);stroke-width:4.5;stroke-linecap:round');
  return g;
}
function person(p, x, y, s = 1) {
  const g = G(p, { transform: `translate(${x} ${y}) scale(${s})` });
  C(g, 0, -15, 3.2, 'f-ink');
  L(g, 0, -12, 0, -4, 'stroke:var(--ink);stroke-width:2;stroke-linecap:round');
  L(g, 0, -4, -3, 2, 'stroke:var(--ink);stroke-width:2;stroke-linecap:round');
  L(g, 0, -4, 3, 2, 'stroke:var(--ink);stroke-width:2;stroke-linecap:round');
  L(g, 0, -10, 5, -6, 'stroke:var(--ink);stroke-width:2;stroke-linecap:round');
  L(g, 5, -6, 9, -2, 'stroke:var(--steelm2);stroke-width:1.6');
  P(g, 'M-4 -17 q4 -5 8 0 z', 'f-warn');
  return g;
}

/* ================================================================== 1. Kútsüllyesztő */
const KSOIL = {
  homok: { t: 'Laza–közepes homok', f: 12, qe: 400, cls: 'f-soilA', pat: 'pat-sand' },
  agyag: { t: 'Puha–közepes agyag', f: 9, qe: 250, cls: 'f-soilB', pat: 'pat-clay' },
  kavics: { t: 'Tömör homokos kavics', f: 20, qe: 700, cls: 'f-soilD', pat: 'pat-gravel' },
};
const LUB = { nincs: { t: 'nincs', k: 1 }, kavics: { t: 'gömbkavics', k: 0.5 }, bento: { t: 'bentonitzagy', k: 0.3 } };
function kModel(o) {
  const Aw = Math.PI / 4 * (o.D ** 2 - (o.D - 2 * o.v) ** 2);
  const Hk = o.L + 0.5;
  const G0 = 25 * Aw * Hk;
  const be = Math.min(o.v, 0.15);
  const Re = o.qe * (o.under ? 0.25 : 1) * Math.PI * o.D * be;
  const U = (z) => (o.tv ? 10 * Aw * Math.max(0, z - 1.5) : 0);
  const S = (z) => o.f * o.lub * Math.PI * o.D * (o.vall ? Math.min(z, 1) + 0.35 * Math.max(0, z - 1) : z);
  const F = (z) => G0 + o.B - U(z);
  const Rz = (z) => S(z) + Re;
  let zs = null;
  for (let z = 0; z <= o.L + 1e-9; z += 0.01) if (Rz(z) >= F(z)) { zs = z; break; }
  let need = 0;
  for (let z = 0; z <= o.L + 1e-9; z += 0.05) need = Math.max(need, Rz(z) - (G0 - U(z)));
  return { Aw, Hk, G0, Re, U, S, F, Rz, zs, need };
}
register('kut-sully', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sS = seg(ctrls, { label: 'Talaj', options: Object.entries(KSOIL).map(([v, o]) => ({ v, t: o.t })), value: 'homok', vert: true });
  const sD = slider(ctrls, { label: 'A kút külső átmérője', sym: 'D', min: 0.8, max: 3, step: 0.1, value: 2, unit: 'm', d: 1 });
  const sV = slider(ctrls, { label: 'Falvastagság', sym: 'v', min: 0.15, max: 0.6, step: 0.05, value: 0.3, unit: 'm', d: 2 });
  const sL = slider(ctrls, { label: 'A teherbíró réteg mélysége', sym: 'L', min: 4, max: 8, step: 0.5, value: 6, unit: 'm', d: 1 });
  const sK = seg(ctrls, { label: 'Súrlódáscsökkentés a köpeny mentén', options: Object.entries(LUB).map(([v, o]) => ({ v, t: o.t })), value: 'nincs' });
  const tV = toggle(ctrls, { label: 'Vállkiugrás a vágóél felett', value: false });
  const tU = toggle(ctrls, { label: 'A markoló a vágóél alól is kotor', value: true });
  const sB = slider(ctrls, { label: 'Ballaszt (pl. betonblokkok)', sym: 'G<sub>b</sub>', min: 0, max: 1500, step: 50, value: 0, unit: 'kN', d: 0 });
  const tW = toggle(ctrls, { label: 'Talajvíz 1,5 m mélyen', value: true });
  const btnGo = h('button', { type: 'button', class: 'on' }, '▶ Süllyesztés');
  const btnRe = h('button', { type: 'button' }, '↺ Vissza a terepre');
  viz.append(h('div', { class: 'play-row' }, h('div', { class: 'stepbtns' }, btnGo, btnRe), h('span', { class: 'kut-msg' })));
  const msg = viz.querySelector('.kut-msg');
  const W = 640, H = 400;
  const fig = figure(viz, W, H, 'fig kut-sfig');
  const oG = stat(out, { label: 'Önsúly G', unit: 'kN', d: 0 }), oU = stat(out, { label: 'Felhajtóerő a célmélységben', unit: 'kN', d: 0 }), oR = stat(out, { label: 'Ellenállás a célmélységben', unit: 'kN', d: 0 }), oN = stat(out, { label: 'Ballasztigény', unit: 'kN', d: 0 });
  const vd = verdict(out); vd.el.classList.add('rf-span');
  let m = null, z = 0, run = false, done = false, tt = 0;
  const Y0 = 190, KP = 20, cx = 160;
  const y = (zz) => Y0 + zz * KP;
  const params = () => ({ ...KSOIL[sS.v], D: sD.v, v: Math.min(sV.v, sD.v / 2 - 0.15), L: sL.v, lub: LUB[sK.v].k, vall: tV.v, under: tU.v, B: sB.v, tv: tW.v });
  const draw = () => {
    clear(fig);
    const o = params();
    const so = KSOIL[sS.v];
    // háttér
    R(fig, 0, 0, 330, Y0, 'f-sky');
    soil(fig, 0, Y0, 310, y(o.L) - Y0, so.cls, so.pat);
    soil(fig, 0, y(o.L), 310, H - y(o.L), 'f-soilE', 'pat-gravel', 0.6);
    T(fig, 8, y(o.L) + 16, 'teherbíró réteg', 't-sm halo', { style: 'font-weight:700' });
    if (o.tv) { R(fig, 0, y(1.5), 310, y(o.L) - y(1.5), 'f-water', { opacity: 0.55 }); L(fig, 0, y(1.5), 310, y(1.5), 'stroke:var(--water);stroke-width:1.4;stroke-dasharray:5 3'); T(fig, 8, y(1.5) - 4, 'TV', 't-sm t-water halo'); }
    // kút
    const r = o.D / 2 * KP, w = o.v * KP, ye = y(z), yt = ye - m.Hk * KP;
    const yin = o.under ? ye + 5 : ye - 6;
    R(fig, cx - r, yt, 2 * r, yin - yt, 'f-sky');
    if (o.tv && yin > y(1.5)) R(fig, cx - r + w, Math.max(y(1.5), yt), 2 * r - 2 * w, yin - Math.max(y(1.5), yt), 'f-water', { opacity: 0.8 });
    if (!o.under) for (const s of [-1, 1]) P(fig, `M${cx + s * (r - w)} ${ye} L${cx + s * (r - w - 14)} ${yin} L${cx + s * (r - w)} ${yin} Z`, so.cls);
    // kenés a köpeny mentén
    const emb = Math.max(0, ye - Y0);
    if (o.lub < 1 && emb > 0) {
      const top = Y0, bot = o.vall ? Math.max(Y0, ye - KP) : ye;
      for (const s of [-1, 1]) R(fig, s < 0 ? cx - r - 4 : cx + r, top, 4, bot - top, sK.v === 'bento' ? 'f-slurry' : 'f-grout', { opacity: 0.95 });
    }
    // falak (vágóéllel, opcionális vállkiugrással)
    for (const s of [-1, 1]) {
      const xo = cx + s * r, xi = cx + s * (r - w), sh = o.vall ? 3 : 0;
      const pts = [[xo, yt], [xi, yt], [xi, ye - Math.min(16, w * 1.5)], [xo + s * sh, ye], [xo + s * sh, ye - (o.vall ? KP : 0)], [xo, ye - (o.vall ? KP : 0) - (o.vall ? 3 : 0)]];
      P(fig, pathD(pts, true), 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
      P(fig, pathD(pts, true), '', { fill: 'url(#pat-conc)' });
    }
    if (done) { R(fig, cx - r + w, ye - 0.6 * KP, 2 * r - 2 * w, 0.6 * KP + 5, 'f-conc2'); T(fig, cx, ye - 0.6 * KP - 4, 'zárófenék', 't-sm halo', { 'text-anchor': 'middle' }); }
    // markoló
    const tip = [cx, 14];
    crane(fig, 196, Y0, [cx + 6, 14]);
    if (!done) {
      const bob = run ? 0.5 + 0.5 * Math.sin(tt * 5) : 0.3;
      const gb = yin - 2 - bob * 26;
      L(fig, cx + 6, tip[1], cx, gb - 20, 'stroke:var(--ink);stroke-width:1.1');
      grab(fig, cx, gb, Math.min(28, 2 * (r - w) - 4), bob);
    }
    // erők
    ar(fig, cx, yt + 18, cx, yt + 62, 'var(--grp)', 3, 9);
    TH(fig, cx + 7, yt + 34, 'G' + (o.B > 0 ? ' + ' + sub('G', 'b') : ''), 't-lab halo', { style: 'font-weight:800;fill:var(--grp)' });
    if (emb > 12) for (const s of [-1, 1]) { ar(fig, cx + s * (r + 12), Math.min(ye - 6, Y0 + emb * 0.75), cx + s * (r + 12), Math.min(ye - 6, Y0 + emb * 0.75) - 22, 'var(--bad)', 2, 6); }
    if (emb > 12) T(fig, cx + r + 18, Y0 + emb * 0.6, 'S', 't-lab halo', { style: 'font-weight:800;fill:var(--bad)' });
    for (const s of [-1, 1]) ar(fig, cx + s * (r - 2), ye + 22, cx + s * (r - 2), ye + 4, 'var(--bad)', 2.2, 6);
    TH(fig, cx + r + 4, ye + 22, sub('R', 'v'), 't-lab halo', { style: 'font-weight:800;fill:var(--bad)' });
    // mélységskála
    for (let k = 0; k <= 9; k++) { L(fig, 304, y(k), 310, y(k), 'stroke:var(--muted);stroke-width:1'); if (k % 2 === 0) T(fig, 300, y(k) + 4, k + ' m', 't-sm halo', { 'text-anchor': 'end' }); }
    // ---- diagram
    const gx0 = 350, gx1 = 622, gy0 = Y0, gy1 = y(9);
    const fmax = Math.max(m.F(0), m.Rz(o.L), 100) * 1.12;
    const xs = (f) => gx0 + (f / fmax) * (gx1 - gx0);
    const stepF = fmax > 2000 ? 500 : fmax > 800 ? 200 : 100;
    for (let f = 0; f <= fmax; f += stepF) { L(fig, xs(f), gy0, xs(f), gy1, 'stroke:var(--line);stroke-width:1'); T(fig, xs(f), gy1 + 14, String(f), 't-sm', { 'text-anchor': 'middle' }); }
    T(fig, gx1, gy1 + 28, 'kN', 't-sm', { 'text-anchor': 'end' });
    for (let k = 0; k <= 9; k++) L(fig, gx0, y(k), gx1, y(k), 'stroke:var(--line);stroke-width:1');
    R(fig, gx0, y(o.L), gx1 - gx0, gy1 - y(o.L), 'f-soilE', { opacity: 0.18 });
    const zz = []; for (let q = 0; q <= o.L + 1e-9; q += 0.05) zz.push(q);
    const fP = zz.map((q) => [xs(m.F(q)), y(q)]), rP = zz.map((q) => [xs(m.Rz(q)), y(q)]);
    // a két görbe közti terület: zöld, ahol süllyed; piros, ahol elakad
    for (let i = 0; i < zz.length - 1; i++) {
      const ok = m.F(zz[i]) > m.Rz(zz[i]);
      P(fig, pathD([fP[i], fP[i + 1], rP[i + 1], rP[i]], true), ok ? 'f-ok' : 'f-bad', { opacity: 0.16 });
    }
    P(fig, pathD(fP), '', { style: 'fill:none;stroke:var(--grp);stroke-width:2.6' });
    P(fig, pathD(rP), '', { style: 'fill:none;stroke:var(--bad);stroke-width:2.6' });
    TH(fig, xs(m.F(0)) + 4, gy0 + 14, 'G + ' + sub('G', 'b') + ' − U', 't-sm halo', { style: 'font-weight:700;fill:var(--grp)' });
    TH(fig, Math.min(gx1 - 60, xs(m.Rz(o.L)) + 4), y(o.L) - 6, 'S + ' + sub('R', 'v'), 't-sm halo', { style: 'font-weight:700;fill:var(--bad)' });
    L(fig, gx0, ye, gx1, ye, 'stroke:var(--ink);stroke-width:1.2;stroke-dasharray:4 3');
    if (m.zs !== null && m.zs < o.L) { C(fig, xs(m.F(m.zs)), y(m.zs), 5, 'f-bad', { style: 'stroke:var(--surface);stroke-width:2' }); T(fig, xs(m.F(m.zs)) + 8, y(m.zs) + 14, 'elakad', 't-sm halo t-bad', { style: 'font-weight:700' }); }
    L(fig, gx0, gy0, gx0, gy1, 'stroke:var(--ink);stroke-width:1');
    // mérleg a diagram felett
    const fz = m.F(z), rzz = m.Rz(z), bm = Math.max(fz, rzz, 1);
    T(fig, gx0, 30, `ERŐK A MOSTANI MÉLYSÉGBEN (${fmt(z, 1)} m)`, 't-sm', { style: 'letter-spacing:.08em;font-weight:700' });
    TH(fig, gx0, 56, 'süllyesztő: G + ' + sub('G', 'b') + ' − U', 't-sm');
    R(fig, gx0, 62, (gx1 - gx0) * fz / bm, 16, 'f-grp', { rx: 3 }); T(fig, gx0 + 6, 74, fmt(fz, 0) + ' kN', 't-num', { style: 'fill:#fff;font-size:11px' });
    TH(fig, gx0, 100, 'visszatartó: S + ' + sub('R', 'v'), 't-sm');
    R(fig, gx0, 106, (gx1 - gx0) * rzz / bm, 16, 'f-bad', { rx: 3 }); T(fig, gx0 + 6, 118, fmt(rzz, 0) + ' kN', 't-num', { style: 'fill:#fff;font-size:11px' });
    T(fig, gx0, 150, fz > rzz ? (done ? '✓ a kút a teherbíró rétegen áll' : '↓ a kút süllyed') : '✕ a kút áll – nem süllyed tovább', 't-lab', { style: `font-weight:700;fill:var(${fz > rzz || done ? '--ok' : '--bad'})` });
  };
  const evaluate = () => {
    const o = params();
    m = kModel(o);
    oG.set(m.G0); oU.set(m.U(o.L)); oR.set(m.Rz(o.L)); oN.set(Math.max(0, m.need), o.B >= m.need ? 'ok' : 'bad');
    const tips = [];
    if (!o.under) tips.push('kotorj a vágóél alól is');
    if (o.lub === 1) tips.push('csökkentsd a köpenysúrlódást bentonitzaggyal vagy gömbkaviccsal');
    if (!o.vall) tips.push('alkalmazz vállkiugrást');
    tips.push(`adj legalább ${fmt(Math.ceil(m.need / 50) * 50, 0)} kN ballasztot`);
    if (m.F(0) <= m.Re) vd.set('bad', 'Meg sem moccan', `<p>A vágóél alatti talaj (${fmt(m.Re, 0)} kN) többet bír, mint a kút súlya. Tipp: ${tips.slice(0, 2).join(', ')}.</p>`);
    else if (m.zs !== null && m.zs < o.L) vd.set('bad', `Elakad ${fmt(m.zs, 1)} m-en`, `<p>Ebben a mélységben a köpenysúrlódás és a vágóél-ellenállás eléri a hatékony súlyt. Tipp: ${tips.slice(0, 3).join(', ')}.</p>`);
    else vd.set('ok', 'Leér a teherbíró rétegig', `<p>A célmélységben is marad ${fmt(m.F(o.L) - m.Rz(o.L), 0)} kN tartalék. Ott zárófenék készül, vagy a kutat kibetonozzák.</p>`);
    if (z > (m.zs ?? o.L)) z = Math.min(z, m.zs ?? o.L);
    if (z > o.L) z = o.L;
    done = done && z >= o.L - 1e-6;
    draw();
  };
  const setMsg = () => { msg.textContent = done ? 'Kész – a kút elérte a teherbíró réteget.' : run ? 'Kotrás folyamatban…' : z > 0 ? 'A kút megállt.' : ''; btnGo.textContent = run ? '❚❚ Szünet' : '▶ Süllyesztés'; };
  btnGo.addEventListener('click', () => {
    if (run) { run = false; setMsg(); return; }
    const lim = m.zs ?? params().L;
    if (done || z >= lim - 0.005) { z = 0; done = false; }
    run = true; setMsg();
  });
  btnRe.addEventListener('click', () => { run = false; done = false; z = 0; setMsg(); draw(); });
  [sS, sD, sV, sL, sK, tV, tU, sB, tW].forEach((c) => c.on(() => { evaluate(); }));
  loop(root, (t, dt) => {
    tt = t;
    if (!run) return;
    const o = params();
    const lim = m.zs !== null ? Math.min(m.zs, o.L) : o.L;
    z = Math.min(lim, z + dt * 0.9);
    if (z >= lim - 1e-6) { run = false; done = lim >= o.L - 1e-6 && (m.zs === null || m.zs >= o.L); setMsg(); }
    draw();
  });
  evaluate(); setMsg();
});

/* ================================================================== 2. Acél köpenycsöves kútalap */
register('kut-acel', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false });
  const W = 660, H = 250, pw = 165, Y0 = 70, KP = 22;
  const fig = figure(viz, W, H, 'fig');
  const steps = ['Levibrálás, markolás', 'Teherbíró rétegen', 'Betonozás', 'Kész kút'];
  steps.forEach((t, i) => {
    const g = G(fig, { transform: `translate(${i * pw} 0)` });
    const cx = pw / 2, r = 22;
    R(g, 0, 0, pw, Y0, 'f-sky');
    soil(g, 0, Y0, pw, 7 * KP, 'f-soilA', 'pat-sand');
    soil(g, 0, Y0 + 7 * KP, pw, H - Y0 - 7 * KP, 'f-soilE', 'pat-gravel', 0.6);
    if (i) L(g, 0, 0, 0, H, 'stroke:var(--line2);stroke-width:1');
    C(g, 14, 16, 10, 'f-grp'); T(g, 14, 20, String(i + 1), '', { 'text-anchor': 'middle', style: 'font:800 12px var(--f-mono);fill:#fff' });
    T(g, 30, 20, t, 't-sm', { style: 'font-weight:700;fill:var(--ink)' });
    const yb = Y0 + (i === 0 ? 3.5 : 7.4) * KP;
    if (i < 3) {
      const lift = i === 2 ? 2.4 * KP : 0;
      const top = Math.max(30, (i === 0 ? Y0 - 18 : Y0 - 14) - lift), bot = yb - lift;
      R(g, cx - r, top, r * 2, bot - top, 'f-sky');
      if (i === 2) { R(g, cx - r + 1, Y0 + 2.4 * KP, 2 * r - 2, yb - Y0 - 2.4 * KP, 'f-fresh'); R(g, cx - r + 1, Y0 + 2.4 * KP, 2 * r - 2, yb - Y0 - 2.4 * KP, '', { fill: 'url(#pat-conc)' }); R(g, cx - r, bot, 2 * r, yb - bot, 'f-fresh'); }
      for (const s of [-1, 1]) R(g, s < 0 ? cx - r - 3 : cx + r, top, 3, bot - top, 'f-steel2');
      if (i === 0) { R(g, cx - 16, top - 16, 32, 14, 'f-acc', { rx: 2 }); T(g, cx + 20, top - 6, 'vibrátor', 't-sm halo'); grab(g, cx, yb - 4, 22, 0.3); L(g, cx, top - 2, cx, yb - 24, 'stroke:var(--ink);stroke-width:1'); }
      if (i === 1) { L(g, cx, 26, cx, yb - 24, 'stroke:var(--ink);stroke-width:1'); grab(g, cx, yb - 2, 22, 0.8); }
      if (i === 2) { R(g, cx - 2, 34, 4, Y0 + 2.4 * KP + 10 - 34, 'f-steel2'); P(g, `M${cx - 8} 34 h16 l-6 9 h-4 z`, 'f-steel2'); ar(g, cx + r + 16, Y0 + 40, cx + r + 16, Y0 + 8, 'var(--grp)', 2.2, 7); T(g, cx + r + 22, Y0 + 58, 'a cső', 't-sm halo', { 'text-anchor': 'middle' }); T(g, cx + r + 22, Y0 + 71, 'kihúzása', 't-sm halo', { 'text-anchor': 'middle' }); T(g, cx + 9, 54, 'kontraktorcső', 't-sm halo'); }
    } else {
      R(g, cx - r, Y0, 2 * r, yb - Y0, 'f-conc'); R(g, cx - r, Y0, 2 * r, yb - Y0, '', { fill: 'url(#pat-conc)' });
      R(g, 8, Y0 - 16, pw - 16, 16, 'f-conc2', { style: 'stroke:var(--ink);stroke-width:1' });
      R(g, cx - 10, 34, 20, Y0 - 50, 'f-bld2', { style: 'stroke:var(--building2)' });
      T(g, cx + 16, 48, 'pillér', 't-sm halo');
      T(g, pw / 2, Y0 + 14, 'vb. gerendarács', 't-sm halo', { 'text-anchor': 'middle' });
      T(g, pw / 2, Y0 + 4 * KP, 'kibetonozott kút', 't-sm halo', { 'text-anchor': 'middle' });
    }
  });
});

/* ================================================================== 3. Három szekrény */
const TIP = [
  { t: 'Alulról zárt (úsztatott)', d: 'A szekrényt a parton vagy szárazdokkban megépítik, a nyílt vízen a helyére úsztatják, majd vízzel feltöltve a mederfenékre süllyesztik. A víz itt nem ellenség: ballasztként használják.' },
  { t: 'Alul-felül nyitott', d: 'Belülről kotrással termelik ki a talajt – talajvíz alatt víz alatti kotrással. A szekrényt 6–8 m-es ütemekben építik és süllyesztik, alul körben nagyobb vágóél, belül merevítő rekeszfalak. Jól kotorható talajban 40–50 m-ig is lejut.' },
  { t: 'Felülről zárt: keszon', d: 'A munkakamrából túlnyomásos levegő szorítja ki a vizet (legfeljebb 3,2–3,5 bar). A munkások személyzsilipen át jutnak le, a föld egy másik zsilipen át távozik.' },
];
register('kut-tipus', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false });
  const W = 660, H = 270, pw = 220, WY = 60, BY = 150;
  const fig = figure(viz, W, H, 'fig');
  const info = h('div', { class: 'rf-info' }); viz.append(info);
  const grs = TIP.map((tp, i) => {
    const g = G(fig, { transform: `translate(${i * pw} 0)`, class: 'kut-tip', tabindex: 0, role: 'button', 'aria-label': tp.t });
    R(g, 0, 0, pw, H, 'f-surface', { opacity: 0 });
    R(g, 0, 0, pw, WY, 'f-sky');
    R(g, 0, WY, pw, BY - WY, 'f-water');
    soil(g, 0, BY, pw, H - BY, 'f-soilA', 'pat-sand');
    L(g, 0, WY, pw, WY, 'stroke:var(--water);stroke-width:1.5');
    if (i) L(g, 0, 0, 0, H, 'stroke:var(--line2);stroke-width:1');
    T(g, pw / 2, 22, tp.t, 't-lab', { 'text-anchor': 'middle', style: 'font-weight:700' });
    const cx = pw / 2;
    if (i === 0) {
      // úsztatás: szaggatott korábbi helyzet + végleges
      R(g, cx - 50, WY - 20, 100, 54, '', { style: 'fill:none;stroke:var(--muted);stroke-width:1.2;stroke-dasharray:4 3' });
      ar(g, cx + 62, WY + 4, cx + 62, BY - 40, 'var(--muted)', 1.6, 6);
      const top = BY - 64;
      P(g, `M${cx - 50} ${top} V${BY} H${cx + 50} V${top} H${cx + 42} V${BY - 8} H${cx - 42} V${top} Z`, 'f-conc', { style: 'stroke:var(--concrete2)' });
      R(g, cx - 42, BY - 46, 84, 38, 'f-water', { opacity: 0.9 });
      T(g, cx, BY - 22, 'vízballaszt', 't-sm halo', { 'text-anchor': 'middle' });
      T(g, cx, BY + 30, 'a mederfenékre ül', 't-sm halo', { 'text-anchor': 'middle' });
    } else if (i === 1) {
      const ye = BY + 70, top = WY - 14;
      for (const x of [cx - 60, cx + 52]) P(g, `M${x} ${top} h8 V${ye - 10} L${x + (x < cx ? 0 : 8)} ${ye} Z`, 'f-conc', { style: 'stroke:var(--concrete2)' });
      for (const x of [cx - 22, cx + 16]) R(g, x, top, 6, ye - 22 - top, 'f-conc2');
      R(g, cx - 52, ye - 6, 104, 8, 'f-water', { opacity: 0.6 });
      for (const yy of [WY + 10, BY + 2]) L(g, cx - 60, yy, cx + 60, yy, 'stroke:var(--ink);stroke-width:1;stroke-dasharray:3 2');
      T(g, cx + 66, WY + 14, '6–8 m', 't-sm halo');
      grab(g, cx - 38, ye - 4, 18, 0.6); L(g, cx - 38, 30, cx - 38, ye - 20, 'stroke:var(--ink);stroke-width:1');
      grab(g, cx + 38, ye - 12, 18, 0.2); L(g, cx + 38, 30, cx + 38, ye - 28, 'stroke:var(--ink);stroke-width:1');
      T(g, cx, H - 8, 'rekeszfalak, víz alatti kotrás', 't-sm halo', { 'text-anchor': 'middle' });
    } else {
      const ye = BY + 60, top = WY - 4, ch = 26;
      P(g, `M${cx - 60} ${top} H${cx + 60} V${ye} L${cx + 52} ${ye - 10} V${ye - ch} H${cx - 52} V${ye - 10} L${cx - 60} ${ye} Z`, 'f-conc', { style: 'stroke:var(--concrete2)' });
      R(g, cx - 52, ye - ch, 104, ch - 1, 'f-sky');
      person(g, cx - 24, ye - 2, 0.9); person(g, cx + 18, ye - 2, 0.9);
      R(g, cx - 5, top - 12, 10, ye - ch - top + 12, 'f-steel2');
      R(g, cx - 18, top - 24, 36, 13, 'f-acc', { rx: 3 });
      T(g, cx + 22, top - 14, 'légzsilip', 't-sm halo');
      for (let k = 0; k < 4; k++) C(g, cx - 40 + k * 26, ye - 14, 1.6, 'f-steelc', { opacity: 0.6 });
      T(g, cx, H - 8, 'munkakamra levegőnyomásban', 't-sm halo', { 'text-anchor': 'middle' });
    }
    return g;
  });
  const show = (i) => { info.innerHTML = `<b>${TIP[i].t}</b><span>${TIP[i].d}</span>`; grs.forEach((g, k) => g.classList.toggle('on', k === i)); };
  grs.forEach((g, i) => { g.addEventListener('mouseenter', () => show(i)); g.addEventListener('click', () => show(i)); g.addEventListener('focus', () => show(i)); });
  show(1);
});

/* ================================================================== 4. Keszon-nyomáskalkulátor */
const zsilip = (p) => 10 + 50 * Math.pow(Math.max(0, p), 1.6); // perc – szemléltető, NEM dekompressziós táblázat
register('kut-keszon', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sW = slider(ctrls, { label: 'Vízmélység a folyóban', sym: 'h<sub>1</sub>', min: 0, max: 20, step: 0.5, value: 8, unit: 'm', d: 1 });
  const sD = slider(ctrls, { label: 'Vágóél a mederfenék alatt', sym: 'h<sub>2</sub>', min: 0, max: 25, step: 0.5, value: 10, unit: 'm', d: 1 });
  const sP = slider(ctrls, { label: 'Kompresszor: túlnyomás a kamrában', sym: 'p', min: 0, max: 4, step: 0.05, value: 1.65, unit: 'bar', d: 2 });
  const bReq = h('button', { type: 'button', class: 'btn btn-line btn-sm' }, 'Állítsd a szükséges nyomásra');
  ctrls.append(bReq, h('p', { class: 'ctl-hint', html: 'A talaj pórusai a folyóval közlekednek: a vágóél szintjén h<sub>v</sub> = h<sub>1</sub> + h<sub>2</sub> vízoszlop nyomása hat.' }));
  const W = 640, H = 420;
  const fig = figure(viz, W, H, 'fig');
  const oReq = stat(out, { label: 'Szükséges túlnyomás', unit: 'bar', d: 2 }), oHv = stat(out, { label: 'Vízoszlop a vágóél felett', unit: 'm', d: 1 }), oCh = stat(out, { label: 'Munkakamra' }), oZs = stat(out, { label: 'Zsilipelés kifelé (szemléltető)' });
  const vd = verdict(out); vd.el.classList.add('rf-span');
  let st = {};
  const calc = () => {
    const hv = sW.v + sD.v, req = 9.81 * hv / 100, p = sP.v, diff = p - req;
    let ch = 'száraz', hin = 0;
    if (diff < -0.01) { hin = -diff * 100 / 9.81; ch = hin >= 2.5 ? 'elöntve' : 'vizes'; }
    else if (diff > 0.12) ch = 'szökik';
    st = { hv, req, p, diff, ch, hin };
  };
  const draw = (t = 0) => {
    clear(fig);
    const { hv, req, p, ch, hin } = st;
    const k = Math.min(8, 300 / (hv + 6)), WY = 70, BY = WY + sW.v * k, EY = BY + sD.v * k;
    const x0 = 140, x1 = 330, chH = 30;
    R(fig, 0, 0, 430, WY, 'f-sky');
    R(fig, 0, WY, 430, BY - WY, 'f-water');
    soil(fig, 0, BY, 430, H - BY, 'f-soilA', 'pat-sand');
    R(fig, 0, BY, 430, H - BY, 'f-water', { opacity: 0.35 });
    L(fig, 0, WY, 430, WY, 'stroke:var(--water);stroke-width:1.6');
    P(fig, `M14 ${WY - 2} l6 -9 h-12 z`, '', { style: 'fill:var(--water)' });
    T(fig, 24, WY - 4, 'vízszint', 't-sm t-water halo');
    T(fig, 8, BY - 6, 'mederfenék', 't-sm halo');
    // keszon + pillér
    const top = 34;
    P(fig, `M${x0} ${top} H${x1} V${EY} L${x1 - 10} ${EY - 12} V${EY - chH} H${x0 + 10} V${EY - 12} L${x0} ${EY} Z`, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
    P(fig, `M${x0} ${top} H${x1} V${EY} L${x1 - 10} ${EY - 12} V${EY - chH} H${x0 + 10} V${EY - 12} L${x0} ${EY} Z`, '', { fill: 'url(#pat-conc)' });
    // munkakamra
    R(fig, x0 + 10, EY - chH, x1 - x0 - 20, chH, 'f-sky');
    const hinPx = Math.min(chH, hin / 2.5 * chH);
    if (hinPx > 0) R(fig, x0 + 10, EY - hinPx, x1 - x0 - 20, hinPx, '', { style: 'fill:var(--water);opacity:.5' });
    if (ch !== 'elöntve') { person(fig, x0 + 50, EY - 2 - Math.min(hinPx, 6) * 0, 0.95); person(fig, x0 + 120, EY - 2, 0.95); grab(fig, x1 - 40, EY - 2, 16, 0.3); }
    TH(fig, (x0 + x1) / 2, EY - chH + 13, `p = ${fmt(p, 2)} bar`, 't-num halo', { 'text-anchor': 'middle', style: 'font-size:11px' });
    // aknák, zsilipek, gépház
    R(fig, 220, 14, 12, EY - chH - 14, 'f-steel2');
    R(fig, 202, 2, 48, 16, 'f-acc', { rx: 3 });
    T(fig, 256, 13, 'személyzsilip', 't-sm halo');
    R(fig, 290, 20, 8, EY - chH - 20, 'f-steel2');
    R(fig, 282, 12, 24, 12, 'f-warn', { rx: 2 });
    T(fig, 312, 30, 'anyagzsilip', 't-sm halo');
    R(fig, 20, 20, 70, 26, 'f-steel', { rx: 3 });
    T(fig, 55, 37, 'kompresszor', 't-sm', { 'text-anchor': 'middle', style: 'fill:#fff;font-weight:700' });
    P(fig, `M90 30 H150 V${EY - chH - 2}`, '', { style: 'fill:none;stroke:var(--steel);stroke-width:2.5' });
    // buborékok, ha szökik a levegő
    if (ch === 'szökik') {
      for (let i = 0; i < 14; i++) {
        const ph = ((t * 0.5 + i / 14) % 1), side = i % 2 ? x1 + 6 : x0 - 6;
        const yy = EY - ph * (EY - WY);
        C(fig, side + Math.sin(ph * 12 + i) * 6, yy, 2 + (i % 3), '', { style: 'fill:var(--surface);stroke:var(--water);stroke-width:1', opacity: 0.85 });
      }
    }
    // méretek
    L(fig, 360, WY, 360, EY, 'stroke:var(--ink);stroke-width:1');
    for (const yy of [WY, BY, EY]) L(fig, 355, yy, 365, yy, 'stroke:var(--ink);stroke-width:1');
    TH(fig, 368, (WY + BY) / 2 + 4, sub('h', '1') + ` = ${fmt(sW.v, 1)} m`, 't-sm halo');
    TH(fig, 368, (BY + EY) / 2 + 4, sub('h', '2') + ` = ${fmt(sD.v, 1)} m`, 't-sm halo');
    // ---- nyomásmérő
    const gc = [535, 130], gr = 76, ang = (b) => Math.PI + (clamp(b, 0, 4) / 4) * Math.PI;
    const arc = (a, b, cls) => { const p0 = [gc[0] + gr * Math.cos(ang(a)), gc[1] + gr * Math.sin(ang(a))], p1 = [gc[0] + gr * Math.cos(ang(b)), gc[1] + gr * Math.sin(ang(b))]; P(fig, `M${p0[0]} ${p0[1]} A${gr} ${gr} 0 0 1 ${p1[0]} ${p1[1]}`, '', { style: `fill:none;stroke:var(${cls});stroke-width:12` }); };
    arc(0, 3.2, '--ok'); arc(3.2, 3.5, '--warn'); arc(3.5, 4, '--bad');
    for (let b = 0; b <= 4; b += 0.5) { const a = ang(b); L(fig, gc[0] + (gr - 14) * Math.cos(a), gc[1] + (gr - 14) * Math.sin(a), gc[0] + (gr - 6) * Math.cos(a), gc[1] + (gr - 6) * Math.sin(a), 'stroke:var(--ink);stroke-width:1.2'); if (b % 1 === 0) T(fig, gc[0] + (gr - 26) * Math.cos(a), gc[1] + (gr - 26) * Math.sin(a) + 4, String(b), 't-sm', { 'text-anchor': 'middle' }); }
    const ar0 = ang(req); P(fig, `M${gc[0] + (gr + 8) * Math.cos(ar0)} ${gc[1] + (gr + 8) * Math.sin(ar0)} l${-6 * Math.sin(ar0) - 5 * Math.cos(ar0)} ${6 * Math.cos(ar0) - 5 * Math.sin(ar0)}`, '', { style: 'stroke:var(--ink);stroke-width:2' });
    C(fig, gc[0] + (gr + 10) * Math.cos(ar0), gc[1] + (gr + 10) * Math.sin(ar0), 4, 'f-ink');
    const ap = ang(p);
    L(fig, gc[0], gc[1], gc[0] + (gr - 10) * Math.cos(ap), gc[1] + (gr - 10) * Math.sin(ap), 'stroke:var(--grp);stroke-width:3.5;stroke-linecap:round');
    C(fig, gc[0], gc[1], 6, 'f-grp');
    T(fig, gc[0], gc[1] + 26, 'bar túlnyomás', 't-sm', { 'text-anchor': 'middle' });
    T(fig, gc[0], 30, 'NYOMÁSMÉRŐ', 't-sm', { 'text-anchor': 'middle', style: 'letter-spacing:.1em;font-weight:700' });
    C(fig, gc[0] - 62, gc[1] + 42, 4, 'f-ink'); T(fig, gc[0] - 54, gc[1] + 46, 'szükséges', 't-sm');
    L(fig, gc[0] + 6, gc[1] + 42, gc[0] + 22, gc[1] + 42, 'stroke:var(--grp);stroke-width:3.5;stroke-linecap:round'); T(fig, gc[0] + 26, gc[1] + 46, 'beállított', 't-sm');
    // ---- zsilipelés (szemléltető lépcsők)
    const zx0 = 456, zx1 = 626, zy0 = 250, zy1 = 380, tot = zsilip(p);
    T(fig, zx0, zy0 - 18, 'ZSILIPELÉS KIFELÉ', 't-sm', { style: 'letter-spacing:.06em;font-weight:700' }); T(fig, zx0 - 4, zy0 - 6, 'bar', 't-sm', { 'text-anchor': 'end' });
    L(fig, zx0, zy0, zx0, zy1, 'stroke:var(--ink);stroke-width:1'); L(fig, zx0, zy1, zx1, zy1, 'stroke:var(--ink);stroke-width:1');
    T(fig, zx0 - 4, zy0 + 4, fmt(Math.max(p, 0.5), 1), 't-sm', { 'text-anchor': 'end' }); T(fig, zx0 - 4, zy1, '0', 't-sm', { 'text-anchor': 'end' });
    T(fig, zx1, zy1 + 14, `${Math.floor(tot / 60)} ó ${Math.round(tot % 60)} p`, 't-sm', { 'text-anchor': 'end' });
    const n = 6, pmax = Math.max(p, 0.5), yp = (q) => zy1 - (zy1 - zy0) * q / pmax;
    const wts = [...Array(n)].map((_, i) => 0.08 + 0.24 * i / (n - 1)), ws = wts.reduce((a2, b2) => a2 + b2, 0);
    const pts = [[zx0, yp(p)]];
    let tx = zx0;
    for (let i = 0; i < n; i++) {
      tx += (zx1 - zx0 - n * 4) * wts[i] / ws;
      pts.push([tx, yp(p * (1 - i / n))]);
      tx += 4; pts.push([tx, yp(p * (1 - (i + 1) / n))]);
    }
    P(fig, pathD(pts), '', { style: 'fill:none;stroke:var(--grp);stroke-width:2.4' });
  };
  const upd = () => {
    calc();
    const { hv, req, p, ch } = st;
    oReq.set(req, req <= 3.2 ? 'ok' : req <= 3.5 ? 'warn' : 'bad');
    oHv.set(hv);
    oCh.set(0, ch === 'száraz' ? 'ok' : ch === 'szökik' ? 'warn' : 'bad', ch === 'szökik' ? 'szökik a levegő' : ch);
    const tot = zsilip(p);
    oZs.set(0, null, `≈&nbsp;${Math.floor(tot / 60)}&nbsp;ó&nbsp;${Math.round(tot % 60)}&nbsp;p`);
    let s = 'ok', ttl = 'Száraz munkakamra', tx = 'A levegő nyomása épp kiszorítja a vizet a vágóél alól – lehet dolgozni.';
    if (ch === 'vizes') { s = 'warn'; ttl = 'Betör a víz'; tx = `Kevés a nyomás: a víz ${fmt(st.hin, 1)} m magasan áll a kamrában. Emeld a kompresszor nyomását!`; }
    if (ch === 'elöntve') { s = 'bad'; ttl = 'Elárasztva!'; tx = 'A túlnyomás messze kevesebb a víznyomásnál: a munkakamrát elönti a víz.'; }
    if (ch === 'szökik') { s = 'warn'; ttl = 'Szökik a levegő'; tx = 'Túl nagy a nyomás: a levegő a vágóél alatt kibuborékol, a talaj is megbolydulhat. Elég a szükséges nyomás.'; }
    if (req > 3.5) { s = 'bad'; ttl = 'Ez már túl mély'; tx = `${fmt(req, 2)} bar kellene – ez meghaladja a 3,2–3,5 bar-os határt, ekkora túlnyomásban nem dolgozhatnak emberek.`; }
    else if (req > 3.2 && s === 'ok') { s = 'warn'; ttl = 'A határon'; tx = 'A 3,2–3,5 bar-os sávban vagyunk: rövid műszakok, nagyon hosszú zsilipelés.'; }
    vd.set(s, ttl, `<p>${tx}</p>`);
    draw(0);
  };
  bReq.addEventListener('click', () => { calc(); sP.set(Math.min(4, Math.ceil(st.req / 0.05 - 1e-9) * 0.05)); });
  [sW, sD, sP].forEach((c) => c.on(upd));
  root.append(h('div', { class: 'w-foot', html: '<b>Szemléltető modell.</b> A zsilipelési idő csak a nagyságrendet érzékelteti (a nyomással meredeken nő) – nem valós dekompressziós táblázat.' }));
  upd();
  loop(root, (t) => { if (st.ch === 'szökik') draw(t); });
});

/* ================================================================== 5. Elferdülés-monitor */
register('kut-ferde', (root) => {
  const { ctrls, viz, out } = shell(root);
  const cells = ['bal', 'középső', 'jobb'];
  const tg = cells.map((c, i) => toggle(ctrls, { label: `Kotrás a ${c} cellában`, value: true }));
  const tA = toggle(ctrls, { label: 'Mindhárom cella (egyenletes kotrás)', value: true });
  const tM = toggle(ctrls, { label: 'Monitoring (geodéziai mérés)', value: true });
  const bGo = h('button', { type: 'button', class: 'on' }, '▶ Süllyesztés');
  const bRe = h('button', { type: 'button' }, '↺ Új szekrény');
  ctrls.append(h('div', { class: 'stepbtns' }, bGo, bRe), h('p', { class: 'ctl-hint', html: 'Tipp: ha az egyik oldal mélyebben jár, a <b>másik</b> oldalon kotorj. Kemény rétegnél a cella alatt alig fogy a föld; laza, folyós zsebben viszont könnyen túlkotrod – és fellazul a környezet.' }));
  const W = 640, H = 380;
  const fig = figure(viz, W, H, 'fig');
  const oZ = stat(out, { label: 'Mélység (átlag)', unit: 'm', d: 1 }), oT = stat(out, { label: 'Dőlés', unit: '%', d: 2 }), oS = stat(out, { label: 'Ütem' }), oMx = stat(out, { label: 'Legnagyobb dőlés', unit: '%', d: 2 });
  const vd = verdict(out); vd.el.classList.add('rf-span');
  const B = 20, SEG = 7, NSEG = 3, TARGET = 20, KP = 11, Y0 = 92, CX = 320;
  let s;
  const reset = () => { s = { z: 0, th: 0, segs: 1, build: 0, lL: 0, lR: 0, run: false, st: 'run', mx: 0, t: 0 }; };
  reset();
  const sf = (side, z) => side === 'L' ? (z > 6 && z < 9 ? 0.45 : 1) : (z > 13 && z < 16 ? 1.6 : 1);
  const y = (z) => Y0 + z * KP;
  const step = (dt) => {
    if (s.st !== 'run') return;
    if (s.build > 0) { s.build -= dt; if (s.build <= 0) s.segs++; return; }
    const e = tg.map((t) => (t.v ? 1 : 0));
    const zL = s.z - s.th * B / 2, zR = s.z + s.th * B / 2;
    const fL = sf('L', zL), fR = sf('R', zR);
    const pushL = (e[0] + 0.5 * e[1]) * fL, pushR = (e[2] + 0.5 * e[1]) * fR;
    const at = Math.abs(s.th);
    const jam = at > 0.006 ? clamp(1 - (at - 0.006) / 0.009, 0.15, 1) : 1;
    const v = 0.9 * (e[0] * fL + e[1] * (fL + fR) / 2 + e[2] * fR) / 3 * jam;
    let th = s.th + dt * (0.0025 * (pushR - pushL) + (e.some(Boolean) ? 0.0002 * Math.sin(s.t * 0.9) : 0));
    let z = s.z + v * dt;
    // a teherbíró réteg megállítja a vágóélt
    let nL = z - th * B / 2, nR = z + th * B / 2;
    nL = Math.min(nL, TARGET); nR = Math.min(nR, TARGET);
    z = (nL + nR) / 2; th = (nR - nL) / B;
    // fellazulás: laza zsebben kotrás → roskadási tölcsér
    if (fR > 1) s.lR += e[2] * (fR - 1) * dt * 0.25;
    if (fL > 1) s.lL += e[0] * (fL - 1) * dt * 0.25;
    s.z = z; s.th = th; s.t += dt;
    s.mx = Math.max(s.mx, Math.abs(th));
    if (Math.abs(th) >= 0.015) { s.st = 'stuck'; s.run = false; }
    // új ütem, ha a teteje a terep közelébe ér
    const topDepth = s.z - s.segs * SEG;
    if (topDepth > -0.8 && s.segs < NSEG) s.build = 1.4;
    if (s.z >= TARGET - 0.02) { s.st = 'done'; s.run = false; }
  };
  const draw = (t = 0) => {
    clear(fig);
    const mon = tM.v;
    R(fig, 0, 0, W, Y0, 'f-sky');
    soil(fig, 0, Y0, W, 6 * KP, 'f-soilA', 'pat-sand');
    soil(fig, 0, y(6), W, y(20) - y(6), 'f-soilC', 'pat-sand', 0.6);
    soil(fig, 0, y(6), CX, 3 * KP, 'f-soilE', 'pat-gravel', 0.8);
    T(fig, 10, y(7.8), 'kemény lencse', 't-sm halo', { style: 'font-weight:700' });
    soil(fig, CX, y(13), W - CX, 3 * KP, 'f-soilF', 'pat-peat', 0.7);
    T(fig, W - 10, y(14.8), 'laza, folyós zseb', 't-sm halo', { 'text-anchor': 'end', style: 'font-weight:700' });
    soil(fig, 0, y(20), W, H - y(20), 'f-soilB', 'pat-clay', 0.8);
    T(fig, 10, y(20) + 18, 'teherbíró réteg', 't-sm halo', { style: 'font-weight:700' });
    R(fig, 0, y(2), W, y(20) - y(2), 'f-water', { opacity: 0.35 });
    L(fig, 0, y(2), W, y(2), 'stroke:var(--water);stroke-width:1.2;stroke-dasharray:5 3');
    // roskadási tölcsér
    for (const [side, l] of [[1, s.lR], [-1, s.lL]]) {
      if (l < 0.05) continue;
      const dep = Math.min(26, l * 30), xa = CX + side * (B / 2 * KP + 4), wd = 40 + dep * 3;
      P(fig, `M${xa} ${Y0} Q ${xa + side * wd / 2} ${Y0 + dep * 1.6} ${xa + side * wd} ${Y0} Z`, 'f-sky');
      if (l > 0.3) T(fig, xa + side * wd / 2, Y0 - 8, 'roskadási tölcsér', 't-sm halo t-bad', { 'text-anchor': 'middle', style: 'font-weight:700' });
    }
    L(fig, 0, Y0, W, Y0, 'stroke:var(--soil-line);stroke-width:1.5');
    // szekrény
    const exag = mon ? 6 : 1;
    const ang = Math.atan(s.th * exag) * 180 / Math.PI;
    const ye = y(s.z), hgt = s.segs * SEG * KP, hw = B / 2 * KP;
    const g = G(fig, { transform: `rotate(${ang} ${CX} ${ye})` });
    // belső: víz és föld
    R(g, CX - hw + 11, ye - hgt, 2 * hw - 22, hgt, 'f-sky');
    const wy = Math.max(ye - hgt, y(2));
    if (ye > y(2)) R(g, CX - hw + 11, wy, 2 * hw - 22, ye - wy, 'f-water', { opacity: 0.85 });
    // falak
    for (const sd of [-1, 1]) {
      const xo = CX + sd * hw, xi = CX + sd * (hw - 11);
      P(g, pathD([[xo, ye - hgt], [xi, ye - hgt], [xi, ye - 14], [xo + sd * 3, ye], [xo, ye - 2]], true), 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
    }
    for (const xx of [CX - hw / 3, CX + hw / 3]) R(g, xx - 3.5, ye - hgt, 7, hgt - 22, 'f-conc2');
    for (let k = 1; k < s.segs; k++) L(g, CX - hw, ye - k * SEG * KP, CX + hw, ye - k * SEG * KP, 'stroke:var(--ink);stroke-width:1;stroke-dasharray:4 3');
    if (s.build > 0) { const a = 1 - s.build / 1.4; R(g, CX - hw, ye - hgt - SEG * KP * a, 2 * hw, SEG * KP * a, 'f-fresh', { opacity: 0.7 }); }
    if (s.st === 'done') R(g, CX - hw + 11, ye - 16, 2 * hw - 22, 16, 'f-conc2');
    // markolók
    const e = tg.map((tt) => tt.v);
    if (s.st === 'run') [-1, 0, 1].forEach((k, i) => {
      if (!e[i]) return;
      const gx = CX + k * hw * 2 / 3, bob = s.run ? 0.5 + 0.5 * Math.sin(t * 4 + i * 2) : 0.4;
      L(g, gx, ye - hgt - 30, gx, ye - 22 - bob * 30, 'stroke:var(--ink);stroke-width:1');
      grab(g, gx, ye - 2 - bob * 30, 26, bob);
    });
    // mérőpontok
    if (mon) for (const sd of [-1, 1]) {
      const zz = s.z + sd * s.th * B / 2;
      C(g, CX + sd * (hw - 5), ye - hgt - 4, 4, 'f-grp', { style: 'stroke:var(--surface);stroke-width:1.5' });
      T(fig, CX + sd * (hw + 8), 28, `${sd < 0 ? 'bal' : 'jobb'}: ${fmt(zz, 2)} m`, 't-num halo', { 'text-anchor': sd < 0 ? 'end' : 'start', style: 'font-size:11px' });
    }
    // dőlésmérő
    if (mon) {
      const bx = 520, by = 46, bw = 104;
      R(fig, bx - bw / 2, by - 10, bw, 20, 'f-surface', { rx: 10, style: 'stroke:var(--line2);stroke-width:1.2' });
      R(fig, bx - 9, by - 10, 18, 20, '', { style: 'fill:none;stroke:var(--ok);stroke-width:1.2' });
      const bxp = bx + clamp(s.th / 0.015, -1, 1) * (bw / 2 - 10);
      C(fig, bxp, by, 7, Math.abs(s.th) < 0.006 ? 'f-ok' : Math.abs(s.th) < 0.01 ? 'f-warn' : 'f-bad');
      T(fig, bx, by + 26, 'dőlésmérő', 't-sm', { 'text-anchor': 'middle' });
      T(fig, 8, H - 8, 'A dőlés a rajzon hatszorosan nagyítva.', 't-sm halo');
    } else T(fig, 8, H - 8, 'Monitoring nélkül: a pár tized százalékos dőlés szabad szemmel nem látszik…', 't-sm halo');
    if (s.build > 0) T(fig, CX, Y0 - hgt - 10 > 14 ? 60 : 60, 'új ütem betonozása…', 't-lab halo', { 'text-anchor': 'middle', style: 'font-weight:700' });
    // ki
    oZ.set(s.z);
    if (mon) { oT.set(Math.abs(s.th) * 100, Math.abs(s.th) < 0.006 ? 'ok' : Math.abs(s.th) < 0.01 ? 'warn' : 'bad'); oMx.set(s.mx * 100, s.mx < 0.006 ? 'ok' : s.mx < 0.01 ? 'warn' : 'bad'); }
    else { oT.set(0, null, '–'); oMx.set(0, null, '–'); }
    oS.set(0, null, `${s.segs} / ${NSEG}`);
  };
  const verdictUpd = () => {
    if (s.st === 'stuck') vd.set('bad', 'Befeszült!', '<p>A szekrény megdőlt, és beékelődött a talajba – ez helyrehozhatatlan. Kezdd újra, és figyeld a dőlésmérőt: a mélyebben járó oldallal <b>ellentétes</b> oldalon kotorj.</p>');
    else if (s.st === 'done') vd.set(s.mx < 0.006 ? 'ok' : 'warn', s.mx < 0.006 ? 'Leért – szépen, egyenesen!' : 'Leért, de közben erősen megdőlt', `<p>A szekrény elérte a teherbíró réteget (20 m); a legnagyobb dőlés ${fmt(s.mx * 100, 2)} % volt. Jöhet a fenéklemez.${(s.lL + s.lR) > 0.3 ? ' A túlkotrás miatt azonban roskadási tölcsér alakult ki a környezetben.' : ''}</p>`);
    else if (s.lR > 0.3 || s.lL > 0.3) vd.set('warn', 'Fellazult a talaj', '<p>A laza zsebben túl sokat kotortál: a föld befolyik a vágóél alá, a felszínen roskadási tölcsér nyílik. Ilyenkor kevesebbet, óvatosabban kell kotorni azon az oldalon.</p>');
    else if (Math.abs(s.th) >= 0.006) vd.set('warn', 'Dől a szekrény!', `<p>${s.th > 0 ? 'A jobb' : 'A bal'} oldal mélyebben jár. Kapcsold ki ott a kotrást, és a másik oldalon dolgozz.</p>`);
    else vd.set('ok', s.run ? 'Süllyesztés folyamatban' : 'Indulásra kész', '<p>A szekrény 6–8 m-es (itt 7 m-es) ütemekben épül és süllyed; ha a teteje a terep közelébe ér, betonozzák a következő ütemet.</p>');
    bGo.textContent = s.run ? '❚❚ Szünet' : '▶ Süllyesztés';
  };
  tg.forEach((t) => t.on(() => { tA.set(tg.every((x) => x.v), false); draw(); }));
  tA.on((v) => { tg.forEach((t) => t.set(v, false)); draw(); });
  tM.on(() => { draw(); verdictUpd(); });
  bGo.addEventListener('click', () => { if (s.st !== 'run') reset(); s.run = !s.run; verdictUpd(); });
  bRe.addEventListener('click', () => { reset(); draw(); verdictUpd(); });
  let last = '';
  loop(root, (t, dt) => {
    if (s.run) { step(dt); draw(t); }
    const key = s.st + (s.run ? 1 : 0) + (Math.abs(s.th) >= 0.006 ? 'w' : '') + ((s.lL + s.lR) > 0.3 ? 'l' : '');
    if (key !== last) { last = key; verdictUpd(); }
  });
  draw(); verdictUpd();
});

/* ================================================================== kvíz */
defineQuiz('kut', 'Kvíz – kút, szekrény, keszon', [
  { q: 'Mi viszi le a kút- vagy szekrényalap köpenyét a mélybe?', a: ['A saját súlya, miközben belülről kiszedik a földet', 'Hidraulikus sajtók, amelyek lenyomják', 'Vibrálás, mint a szádfalaknál', 'A talajvíz felhajtóereje'], c: 0, e: 'A vasbeton köpeny a saját súlyánál fogva süllyed, a „csipegető” markoló közben belülről – és a vágóél alól – kiveszi a földet. A felhajtóerő épp ellene dolgozik.' },
  { q: 'Mekkora a kútalapok jellemző mérete?', a: ['Átmérő 0,8–3,0 m, hossz 4–8 m', 'Átmérő 10–30 cm, hossz 20–30 m', 'Átmérő 20–60 m, hossz 40–50 m', 'Átmérő 5–6 m, hossz 1–2 m'], c: 0, e: 'A kútalap pontonként támasztja alá a pilléreket, falakat: Ø 0,8–3,0 m, 4–8 m hosszú; felül vasbeton gerendaráccsal vagy lemezzel kötik össze.' },
  { q: 'Hogyan csökkenthető a kút köpenysúrlódása?', a: ['Bentonitzaggyal vagy egyszemcsés gömbkaviccsal, illetve vállkiugrással', 'Sűrűbb vasalással', 'A vágóél elhagyásával', 'A talajvízszint megemelésével'], c: 0, e: 'A vállkiugrás és a kúposodó alak miatt a vágóél nagyobb lyukat vág, mint a köpeny; a résbe tixotróp zagy vagy gördülő kavics kerülhet.' },
  { q: 'Mekkora volt a keszonokban alkalmazott legnagyobb túlnyomás?', a: ['3,2–3,5 bar', '0,3–0,5 bar', '10–12 bar', '25 bar'], c: 0, e: 'Kb. 10 m vízoszlop = 1 bar, így 3,2–3,5 bar nagyjából 32–35 m vízmélységnek felel meg – ennél nagyobb nyomásban ember nem dolgozhat.' },
  { q: 'Miért volt a keszonnak két légzsilipje?', a: ['Egy a személyeknek (lassú nyomásváltás), egy az anyagoknak és a kitermelt földnek', 'Egy a bejáratnak, egy a vészkijáratnak', 'Egy a sűrített levegőnek, egy a víznek', 'Mert két munkakamrája volt'], c: 0, e: 'A személyzsilipben órákon át, lassan változtatták a nyomást (keszonbetegség!), a földet és az anyagokat egy külön zsilipen mozgatták.' },
  { q: 'Mi a szekrényalap alaprajza?', a: ['Azonos az építmény (pl. hídpillér, épület) alaprajzával', 'Pontszerű, a pillérek alatt', 'Mindig kör', 'A cölöprács alaprajzával azonos'], c: 0, e: 'A kutak pontonként támasztanak, a szekrény a teljes építmény alá kerül – ezért sokkal nagyobb.' },
  { q: 'Hogyan épül fel egy nyitott szekrény süllyesztése?', a: ['Szakaszosan: 6–8 m-es ütemekben építik és süllyesztik, belül rekeszfalakkal', 'Egyben megépítik teljes magasságban, majd egyetlen lépésben süllyesztik', 'Előbb kiássák a gödröt, és beleemelik', 'Úsztatva, a vízen'], c: 0, e: 'Egy ütem 6–8 m; alul körben nagyobb vágóél, belül merevítő rekeszfalak. Jól kotorható talajban 40–50 m-ig is lejut.' },
  { q: 'Mi a legnagyobb veszély szekrénysüllyesztéskor?', a: ['Az elferdülés, amely helyrehozhatatlan befeszülést okozhat', 'A beton túl gyors kötése', 'A szekrény felúszása', 'A zaj'], c: 0, e: 'Az egyenletes süllyesztés nagyon nehéz, folyamatos monitoring kell. Ha a talaj fellazul, a környezetben roskadási tölcsér is kialakulhat.' },
  { q: 'Mit értünk ma „kútalapozás” alatt?', a: ['Visszanyerhető acél köpenycsöves markolt alapot', 'Kútgyűrűkből rakott falazott kutat', 'Ásott kutat ivóvíznek', 'Résfalas dobozt'], c: 0, e: 'Acél béléscsövet vibrálnak le folyamatos földkiemelés mellett, majd visszahúzás közben kontraktorcsővel kibetonozzák a kutat.' },
]);
