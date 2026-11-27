// C08 – Kút-, szekrény- és keszonalapozás: kútsüllyesztő, acél köpenycsöves kút, szekrénytípusok, keszon-nyomás, elferdülés-monitor, kvíz
import { register, shell, slider, seg, toggle, stat, verdict, svg, figure, clear, fmt, clamp, lerp, pathD, h, loop } from './core.js';
import { defineQuiz } from './ui.js';
import './kut_figs.js';
import { artSully, artAcel, artTipus } from './kut_art.js';

/* ------------------------------------------------------------------ rajzsegédek */
const T = (p, x, y, s, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text: s, ...o }, p);
const TH = (p, x, y, html, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, html, ...o }, p);
const R = (p, x, y, w, hh, cls, o = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...o }, p);
const C = (p, cx, cy, r, cls, o = {}) => svg('circle', { cx, cy, r: Math.max(0, r), class: cls, ...o }, p);
const L = (p, x1, y1, x2, y2, style, o = {}) => svg('line', { x1, y1, x2, y2, style, ...o }, p);
const P = (p, d, cls, o = {}) => svg('path', { d, class: cls, ...o }, p);
const G = (p, o = {}) => svg('g', o, p);
const sub = (a, b) => `${a}<tspan dy="0.3em" font-size="72%">${b}</tspan><tspan dy="-0.3em" font-size="72%">\u200b</tspan>`;
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
  k_homok: { t: 'Laza–közepes homok', f: 12, qe: 400, cls: 'f-soilA', pat: 'pat-sand' },
  k_agyag: { t: 'Puha–közepes agyag', f: 9, qe: 250, cls: 'f-soilB', pat: 'pat-clay' },
  k_kavics: { t: 'Tömör homokos kavics', f: 20, qe: 700, cls: 'f-soilD', pat: 'pat-gravel' },
};
const LUB = { k_nincs: { t: 'nincs', k: 1 }, k_kavics: { t: 'gömbkavics', k: 0.5 }, bento: { t: 'bentonitzagy', k: 0.3 } };
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
  const sS = seg(ctrls, { label: 'Talaj', options: Object.entries(KSOIL).map(([v, o]) => ({ v, t: o.t })), value: 'k_homok', vert: true });
  const sD = slider(ctrls, { label: 'A kút külső átmérője', sym: 'D', min: 0.8, max: 3, step: 0.1, value: 2, unit: 'm', d: 1 });
  const sV = slider(ctrls, { label: 'Falvastagság', sym: 'v', min: 0.15, max: 0.6, step: 0.05, value: 0.3, unit: 'm', d: 2 });
  const sL = slider(ctrls, { label: 'A teherbíró réteg mélysége', sym: 'L', min: 4, max: 8, step: 0.5, value: 6, unit: 'm', d: 1 });
  const sK = seg(ctrls, { label: 'Súrlódáscsökkentés a köpeny mentén', options: Object.entries(LUB).map(([v, o]) => ({ v, t: o.t })), value: 'k_nincs' });
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
    // jelenet (kut_art.js): égbolt, talajrétegek, köpenyfal, forgó kotró markolóedénnyel, erők, mélységskála
    const r = o.D / 2 * KP, w = o.v * KP, ye = y(z), yt = ye - m.Hk * KP;
    artSully(fig, { soil: { k_homok: 'sand', k_agyag: 'clay', k_kavics: 'gravel' }[sS.v], L: o.L, tv: o.tv, r, w, ye, yt, Y0, KP, cx, under: o.under, lub: o.lub < 1 ? (sK.v === 'bento' ? 'bento' : 'kavics') : null, vall: o.vall, done, bob: run ? 0.5 + 0.5 * Math.sin(tt * 5) : 0.3, B: o.B, H });
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
  const fig = figure(viz, 760, 330, 'fig kut-afig');
  artAcel(fig, ['Levibrálás, markolás', 'Teherbíró rétegen', 'Betonozás', 'Kész kút'], { pull: 'a cső kihúzása', trem: 'kontraktorcső', pier: 'pillér', beam: 'vb. gerendarács', well: 'kibetonozott kút' });
});

/* ================================================================== 3. Három szekrény */
const TIP = [
  { t: 'Alulról zárt (úsztatott)', d: 'A szekrényt a parton vagy szárazdokkban megépítik, a nyílt vízen a helyére úsztatják, majd vízzel feltöltve a mederfenékre süllyesztik. A víz itt nem ellenség: ballasztként használják.' },
  { t: 'Alul-felül nyitott', d: 'Belülről kotrással termelik ki a talajt – talajvíz alatt víz alatti kotrással. A szekrényt 6–8 m-es ütemekben építik és süllyesztik, alul körben nagyobb vágóél, belül merevítő rekeszfalak. Jól kotorható talajban 40–50 m-ig is lejut.' },
  { t: 'Felülről zárt: keszon', d: 'A munkakamrából túlnyomásos levegő szorítja ki a vizet (legfeljebb 3,2–3,5 bar). A munkások személyzsilipen át jutnak le, a föld egy másik zsilipen át távozik.' },
];
register('kut-tipus', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false });
  const W = 720, H = 320, pw = 240;
  const fig = figure(viz, W, H, 'fig pr-svg');
  const info = h('div', { class: 'rf-info' }); viz.append(info);
  const grs = TIP.map((tp, i) => {
    const g = G(fig, { transform: `translate(${i * pw} 0)`, class: 'kut-tip', tabindex: 0, role: 'button', 'aria-label': tp.t });
    R(g, 0, 0, pw, H, '', { style: 'fill:transparent' });
    artTipus(G(g), i, pw, H, ['vízballaszt', 'a mederfenékre ül', 'rekeszfalak, víz alatti kotrás', 'légzsilip', 'munkakamra levegőnyomásban']);
    if (i) L(g, 0.5, 0, 0.5, H, 'stroke:var(--surface);stroke-width:2');
    R(g, 0, 0, pw, 34, '', { style: 'fill:var(--surface);opacity:.82' });
    T(g, pw / 2, 23, tp.t, 't-lab', { 'text-anchor': 'middle', style: 'font-weight:700' });
    return g;
  });
  const show = (i) => { info.innerHTML = `<b>${TIP[i].t}</b><span>${TIP[i].d}</span>`; grs.forEach((g, k) => g.classList.toggle('on', k === i)); };
  grs.forEach((g, i) => { g.addEventListener('mouseenter', () => show(i)); g.addEventListener('click', () => show(i)); g.addEventListener('focus', () => show(i)); });
  show(1);
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
