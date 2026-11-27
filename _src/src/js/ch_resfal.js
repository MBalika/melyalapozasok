// C07 – Résfalak: anatómia, réstábla-építő, silóhatás, kvíz
import { anatScene, RFA, panelScene, PB, biteKin } from './proc.js';
import { register, shell, slider, seg, toggle, stat, verdict, svg, figure, clear, fmt, clamp, lerp, pathD, h, loop } from './core.js';
import { defineQuiz } from './ui.js';
import './rf_figs.js';

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
/** talajréteg sraffozással */
function soil(p, x, y, w, hh, cls = 'f-soilA', pat = 'pat-sand', op = 0.75) {
  R(p, x, y, w, hh, cls);
  R(p, x, y, w, hh, '', { fill: `url(#${pat})`, opacity: op });
}

/* ================================================================== 1. Egy résfal anatómiája */
const ANAT = [
  { n: 1, x: 228, y: 72, t: 'Résvezető gerenda', d: 'Két, 20–25 cm széles, 1,0–1,5 m magas vasbeton gerenda a rés két oldalán: vezeti a réskanalat, megtámasztja a laza felső talajt, megakadályozza a zagy elszivárgását, és ez a kitűzés alapja is.' },
  { n: 2, x: 200, y: 210, t: 'Bentonitzagy', d: 'A kiemelt föld helyét azonnal zagy tölti ki (ρ = 1,03–1,12 g/cm³). Belülről nyomja a rés falát, és kizárja a talajvizet – amíg a beton a helyére nem kerül.' },
  { n: 3, x: 224, y: 318, t: 'Réskanál', d: 'Ciklikus munka: leengedés – harapás – kiemelés – ürítés – újra leengedés. Egy harapás jellemzően 2,8–2,9 m hosszú: ennyi a nyitott kanál szélessége.' },
  { n: 4, x: 66, y: 134, t: 'Talajvízszint', d: 'A talajvíz kívülről nyomja a rés falát; a víznyomás a talajvízszint alatt a mélységgel lineárisan nő: σ<sub>v</sub> = (z − h)·γ<sub>v</sub>.' },
  { n: 5, x: 150, y: 116, t: 'Szintelőny', d: 'A zagyszintnek a résben mindig legalább 1,0–1,5 m-rel a talajvízszint felett kell lennie. Mivel a zagy csak kicsit nehezebb a víznél, ez a szintkülönbség „nyeri meg” a nyomásversenyt.' },
  { n: 6, x: 438, y: 62, t: 'Fejgerenda', d: 'A fal felső 30–50 cm-e zaggyal keveredett, ezt visszavésik; a táblákat vasbeton fejgerenda fogja össze, erre csatlakozik a felszerkezet.' },
  { n: 7, x: 722, y: 320, t: 'Résfal', d: 'Vasbeton panelek folytonos, 40–120 cm vastag fala. Merev és vízzáró – itt egyben a mélygarázs végleges oldalfala, és a felette álló épület terhét is leviszi.' },
  { n: 8, x: 600, y: 150, t: 'Födémek', d: 'A garázsszintek födémei támasztják meg a falat. Top-down építésnél felülről lefelé készülnek: a gödör kiemelése a födémek alatt halad.' },
  { n: 9, x: 389, y: 46, t: 'Szomszéd épület', d: 'A résfal viszonylag zaj- és rezgésmentesen készül, és merev fal: ezért építhető közvetlenül a telekhatáron álló épület mellett is.' },
];
register('rf-anat', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false });
  const W = RFA.W, H = RFA.H;
  const fig = figure(viz, W, H, 'fig rf-anatfig');
  const info = h('div', { class: 'rf-info' });
  const list = h('div', { class: 'rf-leg' });
  viz.append(info, list);
  anatScene(fig);
  const g = G(fig);
  // hotspotok
  const hots = ANAT.map((a) => {
    const hg = G(g, { class: 'rf-hot', tabindex: 0, role: 'button', 'aria-label': a.t });
    C(hg, a.x, a.y, 11, 'f-grp', { style: 'stroke:var(--surface);stroke-width:2' });
    T(hg, a.x, a.y + 4, String(a.n), '', { 'text-anchor': 'middle', style: 'font:800 12px var(--f-mono);fill:#fff' });
    return hg;
  });
  const items = ANAT.map((a, i) => {
    const b = h('button', { type: 'button', class: 'rf-legi' }, h('i', {}, String(a.n)), h('span', {}, a.t));
    list.append(b);
    return b;
  });
  const show = (i) => {
    const a = ANAT[i];
    info.innerHTML = `<b>${a.n}. ${a.t}</b><span>${a.d}</span>`;
    hots.forEach((x, k) => x.classList.toggle('on', k === i));
    items.forEach((x, k) => x.classList.toggle('on', k === i));
  };
  hots.forEach((x, i) => { x.addEventListener('mouseenter', () => show(i)); x.addEventListener('click', () => show(i)); x.addEventListener('focus', () => show(i)); });
  items.forEach((x, i) => { x.addEventListener('mouseenter', () => show(i)); x.addEventListener('click', () => show(i)); });
  show(1);
});

/* ================================================================== 2. Réstábla-építő */
// öt, egyformán 7,0 m hosszú tábla (a primer és a szekunder tábla a valóságban is hasonló hosszú); mindegyik három harapás:
// két szélső, 2,8 m-es harapás, köztük 1,4 m széles talajtömb marad a harmadik harapásra (ennél keskenyebb csíkot nem terveznek)
const PAN = [
  { id: 'P1', k: 'P', x0: 0, x1: 7 },
  { id: 'S1', k: 'S', x0: 7, x1: 14 },
  { id: 'P2', k: 'P', x0: 14, x1: 21 },
  { id: 'S2', k: 'S', x0: 21, x1: 28 },
  { id: 'P3', k: 'P', x0: 28, x1: 35 },
];
PAN.forEach((q) => { q.bites = [[q.x0, q.x0 + 2.8], [q.x1 - 2.8, q.x1], [q.x0 + 2.8, q.x1 - 2.8]]; });
const EP_STEPS = [
  { t: 'Résvezető gerenda', d: 'A falvonal két oldalán vasbeton résvezető gerendák készülnek (20–25 cm széles, 1,0–1,5 m magas). Ezek vezetik a réskanalat, és ez a kitűzés alapja is.', dur: 2.4 },
  { t: 'P1 – első harapás', d: 'A réskanál a primer tábla egyik végén kezd: leengedés – harapás – kiemelés – ürítés. A kiemelt föld helyét azonnal bentonitzagy tölti ki, a zagyszint végig a résvezető gerenda teteje közelében marad.', dur: 6.0 },
  { t: 'P1 – második harapás', d: 'A tábla másik vége következik. Egy harapás jellemzően 2,8–2,9 m hosszú – ennyi a nyitott réskanál szélessége.', dur: 6.0 },
  { t: 'P1 – a közép kiharapása', d: 'A két szélső harapás között megmaradt, kb. 1,4 m széles talajtömböt is kiemelik: ez a 7,0 m-es tábla így három harapásból áll.', dur: 6.0 },
  { t: 'Szakaszoló pallók, vasalási armatúrák', d: 'Aljtisztítás után a tábla két végére szakaszoló palló kerül, majd daruval beemelik a két vasalási armatúrát.', dur: 5.0 },
  { t: 'P1 betonozása két kontraktorcsővel', d: 'Alulról felfelé, folyamatosan betonoznak. A nehezebb beton kiszorítja a zagyot, amelyet visszaszivattyúznak a telepre. A csövek vége végig a friss betonba merül.', dur: 4.0 },
  { t: 'A többi primer tábla: P2, P3', d: 'Ugyanígy készül el P2 és P3. A primer táblák között egy-egy táblányi talaj marad a helyén – itt lesznek a hasonló hosszúságú közbenső (szekunder) táblák.', dur: 12.0 },
  { t: 'Közbenső táblák kiharapása', d: 'S1 és S2 ugyanúgy, három harapással nyílik ki: a közbenső táblák ugyanolyan hosszúak, mint a primerek. A szakaszoló pallók vezetik a kanalat, és védik a már kész primer táblák betonját.', dur: 10.0 },
  { t: 'Közbenső táblák vasalása, betonozása', d: 'A szakaszoló pallókat kihúzzák – a hézagot a betonba ágyazott duzzadószalag tömíti –, beemelik a vasalási armatúrákat, és betonoznak. A fal most már folytonos.', dur: 6.0 },
  { t: 'Kész a fal: fejgerenda', d: 'A táblák felső 30–50 cm-e zaggyal keveredett, gyenge beton: ezt visszavésik, és a falat vasbeton fejgerenda fogja össze. A résvezető gerendák elbonthatók.', dur: 2.8 },
];
const JUMP = { P1: 1, S1: 7, P2: 6, S2: 7, P3: 6 };
function epState(s, p) {
  const st = { guide: 0, gone: 0, top: 0, pull: false, pan: PAN.map((q) => ({ b: q.bites.map(() => 0), cage: 0, conc: 0, stop: 0 })), grabs: [] };
  const seq = (i, f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const bite = (i, j, f, n = 3) => { st.pan[i].b[j] = Math.max(st.pan[i].b[j], biteKin(f, n).d); if (f > 0 && f < 1) st.grabs.push([i, j, f, n]); };
  const apply = (k, f) => {
    switch (k) {
      case 0: st.guide = f; break;
      case 1: bite(0, 0, f); break;
      case 2: bite(0, 1, f); break;
      case 3: bite(0, 2, f); break;
      case 4: st.pan[0].stop = seq(0, f, 0, 0.4); st.pan[0].cage = seq(0, f, 0.4, 1); break;
      case 5: st.pan[0].conc = f; break;
      case 6: for (const i of [2, 4]) {
        bite(i, 0, seq(i, f, 0, 0.17), 1); bite(i, 1, seq(i, f, 0.17, 0.34), 1); bite(i, 2, seq(i, f, 0.34, 0.5), 1);
        st.pan[i].stop = seq(i, f, 0.5, 0.6); st.pan[i].cage = seq(i, f, 0.6, 0.76); st.pan[i].conc = seq(i, f, 0.76, 1);
      } break;
      case 7: for (const i of [1, 3]) { bite(i, 0, seq(i, f, 0, 0.36), 1); bite(i, 1, seq(i, f, 0.36, 0.72), 1); bite(i, 2, seq(i, f, 0.72, 1), 1); } break;
      case 8: st.pull = f < 1; for (const i of [0, 2, 4]) st.pan[i].stop = 1 - seq(i, f, 0, 0.2);
        for (const i of [1, 3]) { st.pan[i].cage = seq(i, f, 0.2, 0.5); st.pan[i].conc = seq(i, f, 0.5, 1); } break;
      case 9: st.top = f; st.gone = seq(0, f, 0, 0.4); break;
    }
  };
  for (let k = 0; k <= s; k++) apply(k, k < s ? 1 : p);
  return st;
}
register('rf-epito', (root) => {
  const { viz, out } = shell(root, { layout: 'wide' });
  const btnPrev = h('button', { type: 'button' }, '◀ Előző');
  const btnPlay = h('button', { type: 'button' }, '▶ Lejátszás');
  const btnNext = h('button', { type: 'button' }, 'Következő ▶');
  const btnReset = h('button', { type: 'button' }, '↺ Elölről');
  const dots = h('div', { class: 'stepbtns rf-dots' });
  const dotB = EP_STEPS.map((s, i) => { const b = h('button', { type: 'button', title: s.t }, String(i + 1)); b.addEventListener('click', () => go(i)); dots.append(b); return b; });
  viz.append(h('div', { class: 'play-row' }, h('div', { class: 'stepbtns' }, btnPrev, btnPlay, btnNext, btnReset), dots));
  const fig = figure(viz, PB.W, PB.H, 'fig rf-epfig');
  const txt = h('div', { class: 'steptext' }); viz.append(txt);
  const sEx = stat(out, { label: 'Kiemelt talaj', unit: 'm³', d: 0 }), sZ = stat(out, { label: 'Zagy a résben', unit: 'm³', d: 0 }), sB = stat(out, { label: 'Bedolgozott beton', unit: 'm³', d: 0 }), sT = stat(out, { label: 'Kész táblák' });
  const TH_ = 0.6, DEP = 20;
  let step = 0, p = 1, playing = false, hold = 0;
  const LAB = { plan: 'FELÜLNÉZET', sec: 'HOSSZMETSZET A FAL TENGELYÉBEN', slv: 'zagyszint', head: 'zaggyal keveredett felső 30–50 cm', cap: 'fejgerenda', gw: 'résvezető gerenda', prim: ' · primer', sec2: ' · szekunder' };
  let hits = null;
  const draw = (tt) => {
    const st = epState(step, p);
    panelScene(fig, { st, step, t: tt, pan: PAN, L: LAB });
    if (!hits) { // kattintható táblák (a rajz fölött, átlátszó)
      hits = G(fig);
      PAN.forEach((q) => { const hit = R(hits, PB.X(q.x0), 24, PB.X(q.x1) - PB.X(q.x0), PB.H - 30, '', { style: 'fill:transparent;cursor:pointer' }); hit.addEventListener('click', () => go(JUMP[q.id])); svg('title', { text: `${q.id} – ugrás az építéséhez` }, hit); });
    } else fig.append(hits);
    let vEx = 0, vB = 0, done = 0;
    PAN.forEach((q, i) => { const s = st.pan[i]; q.bites.forEach(([a, b], j) => { vEx += (b - a) * TH_ * DEP * s.b[j]; }); vB += (q.x1 - q.x0) * TH_ * DEP * s.conc; if (s.conc >= 1) done++; });
    sEx.set(vEx); sZ.set(Math.max(0, vEx - vB)); sB.set(vB); sT.set(`${done} / 5`, done === 5 ? 'ok' : null);
  };
  const paint = () => {
    const s = EP_STEPS[step];
    txt.innerHTML = `<b>${step + 1}. ${s.t}</b>${s.d}`;
    dotB.forEach((b, i) => b.classList.toggle('on', i === step));
    btnPrev.disabled = step === 0; btnNext.disabled = step === EP_STEPS.length - 1;
    btnPlay.textContent = playing ? '❚❚ Szünet' : '▶ Lejátszás';
  };
  function go(i, anim = true) { step = clamp(i, 0, EP_STEPS.length - 1); p = anim ? 0 : 1; hold = 0; paint(); draw(0); }
  btnPrev.addEventListener('click', () => { playing = false; go(step - 1); });
  btnNext.addEventListener('click', () => { playing = false; go(step + 1); });
  btnReset.addEventListener('click', () => { playing = false; go(0); });
  btnPlay.addEventListener('click', () => { playing = !playing; if (playing && step === EP_STEPS.length - 1 && p >= 1) go(0); paint(); });
  let tt = 0;
  loop(root, (t, dt) => {
    tt = t;
    if (p < 1) { p = Math.min(1, p + dt / EP_STEPS[step].dur); draw(tt); return; }
    if (playing) {
      hold += dt;
      if (hold > 0.9) { if (step < EP_STEPS.length - 1) go(step + 1); else { playing = false; paint(); } }
    }
  });
  go(0, false); p = 1; draw(0);
});

/* ================================================================== közös: földnyomás silóhatással (Schneebeli-féle) */
/**
 * Mélység menti profil dz lépéssel. A Schneebeli-képlet a dσ/dz = γ·K_a − (sin 2φ / L)·(σ + B) differenciálegyenlet
 * megoldása (B = c·(1 − K_a)/tg φ); rétegenként változó γ-ra (TV felett γ, alatta γ′) lépésenként, pontosan integráljuk.
 */
function profile(o) {
  const { phi, c, gam, gsat, h: hw, t, rho, Lr, D, q } = o;
  const gw = 10, gb = 10 * rho;
  const f = phi * Math.PI / 180;
  const Ka = Math.tan(Math.PI / 4 - f / 2) ** 2;
  const B = f > 0.01 ? c * (1 - Ka) / Math.tan(f) : 2 * c;
  const k = Math.sin(2 * f) / Lr;
  const dz = 0.05, n = Math.round(D / dz);
  const out = [];
  let u = Ka * q;            // u = σx + B ; σx(0) = Ka·q − B
  let sv = q;                // hatékony függőleges feszültség (Rankine)
  for (let i = 0; i <= n; i++) {
    const z = i * dz;
    const sx = Math.max(0, u - B);
    const sR = Math.max(0, Ka * sv - 2 * c * Math.sqrt(Ka));
    const sw = Math.max(0, z - hw) * gw;
    const sp = Math.max(0, z - t) * gb;
    out.push({ z, sx, sR, sw, sp });
    const ge = z + dz / 2 < hw ? gam : gsat - gw;
    const uinf = ge * Ka / k;
    u = uinf + (u - uinf) * Math.exp(-k * dz);
    sv += ge * dz;
  }
  return { pts: out, Ka, k, gb };
}
const eta = (p, s) => { const ex = p.sp - p.sw; if (s < 0.5) return ex >= 0 ? 9.99 : 0; return ex / s; };

/* ================================================================== 4. Silóhatás egy pillantással */
register('rf-silo', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sL = slider(ctrls, { label: 'Réstábla hossza', sym: 'L', min: 2.8, max: 10, step: 0.2, value: 5.6, unit: 'm', d: 1 });
  ctrls.append(h('p', { class: 'ctl-hint', html: 'Homok a talajvízszint alatt: φ = 32°, c = 0, γ′ = 10 kN/m³. Az ábra a hatékony földnyomást mutatja (a víznyomás nélkül), 0–30 m mélységig.' }));
  const W = 640, H = 330;
  const fig = figure(viz, W, H, 'fig');
  const s30 = stat(out, { label: 'σ<sub>x</sub> 30 m-en (silóhatással)', unit: 'kPa' }), sR = stat(out, { label: 'Rankine 30 m-en', unit: 'kPa' }), sRed = stat(out, { label: 'Csökkenés', unit: '%', d: 0 }), sLim = stat(out, { label: 'Határérték L·γ′·K<sub>a</sub>/sin 2φ', unit: 'kPa' });
  const base = { phi: 32, c: 0, gam: 10, gsat: 20, h: 0, t: 0, rho: 1.08, D: 30, q: 0 };
  const ghost = [2.8, 10].map((Lr) => profile({ ...base, Lr }).pts);
  const draw = () => {
    clear(fig);
    const Lr = sL.v;
    const pr = profile({ ...base, Lr });
    // felülnézet
    const x0 = 20, y0 = 30, w = 250;
    T(fig, x0, 18, 'FELÜLNÉZET', 't-sm', { style: 'letter-spacing:.12em;font-weight:700' });
    soil(fig, x0, y0, w, 260, 'f-soilA', 'pat-sand', 0.7);
    const pxm = 22, Lp = Lr * pxm, cx = x0 + w / 2, ty = 210;
    R(fig, cx - Lp / 2, ty, Lp, 14, 'f-slurry'); R(fig, cx - Lp / 2, ty, Lp, 14, '', { fill: 'url(#pat-slurry)' });
    // boltozódás: a talajék a tábla végein támaszkodik
    const hb = Math.min(150, Lp * 0.62);
    for (let k = 0; k < 4; k++) {
      const s = 1 - k * 0.2;
      P(fig, `M${cx - Lp / 2} ${ty} Q ${cx} ${ty - hb * s * 1.5} ${cx + Lp / 2} ${ty}`, '', { style: `fill:none;stroke:var(--grp);stroke-width:${2.4 - k * 0.4};stroke-dasharray:${k ? '5 4' : 'none'};opacity:${1 - k * 0.18}` });
    }
    for (const sx of [-1, 1]) ar(fig, cx + sx * Lp / 2 + sx * 18, ty - 26, cx + sx * Lp / 2 + sx * 4, ty - 4, 'var(--grp)', 2, 7);
    T(fig, cx, ty - hb * 0.9 - 8, 'boltozódás', 't-sm halo t-grp', { 'text-anchor': 'middle', style: 'font-weight:700' });
    T(fig, cx, ty + 32, `L = ${fmt(Lr, 1)} m`, 't-num halo', { 'text-anchor': 'middle' });
    T(fig, cx, ty + 50, 'réstábla (zaggyal)', 't-sm halo', { 'text-anchor': 'middle' });
    // diagram
    const gx0 = 330, gx1 = 620, gy0 = 30, gy1 = 300, smax = 100;
    const xs = (s) => gx0 + (s / smax) * (gx1 - gx0), ys = (z) => gy0 + (z / 30) * (gy1 - gy0);
    for (let s = 0; s <= smax; s += 20) { L(fig, xs(s), gy0, xs(s), gy1, 'stroke:var(--line);stroke-width:1'); T(fig, xs(s), gy0 - 8, String(s), 't-sm', { 'text-anchor': 'middle' }); }
    for (let z = 0; z <= 30; z += 5) { L(fig, gx0, ys(z), gx1, ys(z), 'stroke:var(--line);stroke-width:1'); T(fig, gx0 - 6, ys(z) + 4, z + ' m', 't-sm', { 'text-anchor': 'end' }); }
    T(fig, gx1, gy0 - 20, 'kPa', 't-sm', { 'text-anchor': 'end' });
    const line = (pts, key) => pathD(pts.filter((_, i) => i % 4 === 0).map((p) => [xs(p[key]), ys(p.z)]));
    P(fig, line(pr.pts, 'sR'), '', { style: 'fill:none;stroke:var(--muted);stroke-width:2;stroke-dasharray:6 4' });
    ghost.forEach((g) => P(fig, line(g, 'sx'), '', { style: 'fill:none;stroke:var(--grp);stroke-width:1.2;opacity:.35' }));
    P(fig, line(pr.pts, 'sx'), '', { style: 'fill:none;stroke:var(--grp);stroke-width:3' });
    const last = pr.pts[pr.pts.length - 1];
    T(fig, xs(last.sR) - 4, ys(26), 'Rankine', 't-sm halo', { 'text-anchor': 'end' });
    TH(fig, xs(last.sx) + 6, ys(29), sub('σ', 'x') + ' (siló)', 't-lab halo t-grp', { style: 'font-weight:700' });
    T(fig, xs(ghost[0][ghost[0].length - 1].sx) - 5, ys(23), '2,8 m', 't-sm halo', { 'text-anchor': 'end' });
    T(fig, xs(ghost[1][ghost[1].length - 1].sx) + 4, ys(19), '10 m', 't-sm halo');
    const lim = Lr * 10 * pr.Ka / Math.sin(2 * 32 * Math.PI / 180);
    L(fig, xs(lim), gy0, xs(lim), gy1, 'stroke:var(--grp);stroke-width:1;stroke-dasharray:2 3;opacity:.7');
    s30.set(last.sx); sR.set(last.sR); sRed.set((1 - last.sx / last.sR) * 100, 'ok'); sLim.set(lim);
  };
  sL.on(draw); draw();
});

/* ================================================================== kvíz */
defineQuiz('rf', 'Kvíz – résfalak', [
  { q: 'Legalább mennyivel legyen a zagyszint a résben a talajvízszint felett?', a: ['1,0–1,5 m-rel', '10–20 cm-rel', 'Legalább 5 m-rel', 'Mindegy, ha elég sűrű a zagy'], c: 0, e: 'A zagy csak kicsit nehezebb a víznél (1,03–1,12 g/cm³), ezért szintelőny kell: legalább 1,0–1,5 m. Ez a többlet tartja egyensúlyban a földnyomást is.' },
  { q: 'Mekkora egy résmarkolós „harapás” jellemző hossza?', a: ['2,8–2,9 m', '0,6 m', '8–10 m', '15 m'], c: 0, e: 'A réskanál nyitott szélessége kb. 2,8–2,9 m – ez egyben a legrövidebb kiemelhető réstábla. A szokásos táblák 2,8–6,5 (8) m hosszúak.' },
  { q: 'Miért kisebb a rés falára ható földnyomás a Rankine-félénél?', a: ['A tábla két vége felé boltozódás alakul ki (silóhatás)', 'A zagy kémiailag megszilárdítja a talajt', 'A talajvíz felhajtóereje teljesen kiegyenlíti', 'Mert a résfal hajlékony'], c: 0, e: 'A véges hosszú rés mellett a talajék a tábla végeinél a nyugvó talajra támaszkodik; a földnyomás a mélységgel egy határértékhez tart (Schneebeli-képlet).' },
  { q: 'Mi történik, ha hosszabb réstáblát nyitunk ugyanabban a talajban?', a: ['Gyengül a boltozódás, nő a földnyomás, csökken az állékonyság', 'Nő az állékonyság', 'Nincs hatása, csak a betonozás tart tovább', 'A zagy sűrűsége megnő'], c: 0, e: 'Rövidebb tábla → erősebb boltozódás → kisebb földnyomás → állékonyabb rés. Ezért legfeljebb 8–10 m, jellemzően 2,8–5,6 m a táblahossz.' },
  { q: 'Milyen bentonit használható réseléshez?', a: ['Csak aktivált „Na” bentonit', 'Bármilyen helyi agyag', 'Kalciumbentonit cementtel', 'Kvarchomok és víz keveréke'], c: 0, e: 'A bentonit döntően montmorillonitból álló kolloid agyag; réseléshez csak aktivált Na-bentonit jó, a viszkozitás CMC-vel növelhető.' },
  { q: 'Legkésőbb mennyi idővel a réselés befejezése után kell megkezdeni a betonozást?', a: ['4–5 óra', '24 óra', '7 nap', 'Csak a zagy teljes ülepedése után'], c: 0, e: 'Mielőbb, de legkésőbb 4–5 óra múlva – előtte aljtisztítás, utána folyamatos, megszakítás nélküli víz alatti betonozás.' },
  { q: 'Miért vésik vissza a résfal felső 30–50 cm-ét?', a: ['Mert zaggyal keveredett, gyenge minőségű', 'Mert ott a legnagyobb a hajlítónyomaték', 'Hogy a résvezető gerenda kiférjen', 'Csak esztétikai okból'], c: 0, e: 'A beton felső része a kiszorított zaggyal keveredik. Visszavésés után erre kerül a vasbeton fejgerenda.' },
  { q: 'Melyik helyzetben a legnehezebb a résállékonyság biztosítása?', a: ['Puha agyagban, tőzegben, folyós homokban, nagyon magas talajvíznél', 'Tömör kavicsban, talajvíz felett', 'Kemény agyagban', 'Ha a rés rövid és sekély'], c: 0, e: 'Itt kicsi a talaj nyírószilárdsága, nagy a víznyomás vagy a zagyveszteség veszélye. Kemény agyag és kőzet a kiemelést nehezíti (ott hydrofraise kell), nem az állékonyságot.' },
  { q: 'Mikor indokolt a hydrofraise (résmaró) a markolóval szemben?', a: ['Kőzetben, nagyon kemény agyagban, nagy mélységnél és pontossági igénynél', 'Rövid, sekély falnál laza homokban', 'Ha nincs szükség zagyra', 'Ha a legolcsóbb megoldás kell'], c: 0, e: 'A marógép bármely talajban és kőzetben, nagy mélységig, pontosan dolgozik – de nagyon drága. Hazánkban a 4-es metrónál alkalmazták (Fővám tér: 48,3 m).' },
]);
