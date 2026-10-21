// C07 – Résfalak: anatómia, réstábla-építő, gépválasztó, silóhatás, résállékonyság-labor, kvíz
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
/** talajréteg sraffozással */
function soil(p, x, y, w, hh, cls = 'f-soilA', pat = 'pat-sand', op = 0.75) {
  R(p, x, y, w, hh, cls);
  R(p, x, y, w, hh, '', { fill: `url(#${pat})`, opacity: op });
}
/** réskanál (markoló) – cx: közép, yb: alsó él, w: szélesség */
function grab(p, cx, yb, w, open = 0.4) {
  const g = G(p);
  const hh = 16, jaw = 12;
  R(g, cx - w / 2 + 4, yb - hh - jaw, w - 8, hh, 'f-warn', { style: 'stroke:var(--ink);stroke-width:1', rx: 2 });
  const o = open * 6;
  P(g, `M${cx - w / 2 + 4} ${yb - jaw} L${cx - 2} ${yb - jaw} L${cx - 4 - o} ${yb} L${cx - w / 2 - o} ${yb - 3} Z`, 'f-steel2');
  P(g, `M${cx + w / 2 - 4} ${yb - jaw} L${cx + 2} ${yb - jaw} L${cx + 4 + o} ${yb} L${cx + w / 2 + o} ${yb - 3} Z`, 'f-steel2');
  return g;
}
/** lánctalpas alapgép gémmel – x0: a talp bal széle, y: terepszint, tip: a gém csúcsa */
function crane(p, x0, y, tip) {
  const g = G(p);
  R(g, x0, y - 10, 88, 10, 'f-steel2', { rx: 5 });
  for (let i = 0; i < 6; i++) C(g, x0 + 8 + i * 14.4, y - 5, 3, 'f-surface', { opacity: 0.55 });
  R(g, x0 + 10, y - 34, 64, 24, 'f-acc', { rx: 3 });
  R(g, x0 + 54, y - 46, 20, 14, 'f-steel', { rx: 2 });
  R(g, x0 + 57, y - 43, 14, 8, 'f-sky', { opacity: 0.9 });
  L(g, x0 + 60, y - 30, tip[0], tip[1], 'stroke:var(--steelm2);stroke-width:5;stroke-linecap:round');
  L(g, x0 + 60, y - 30, tip[0], tip[1], 'stroke:var(--surface);stroke-width:1.2;stroke-dasharray:3 5;opacity:.6');
  return g;
}

/* ================================================================== 1. Egy résfal anatómiája */
const ANAT = [
  { n: 1, x: 205, y: 46, t: 'Résvezető gerenda', d: 'Két, 20–30 cm széles, 1,0–1,5 m magas vasbeton gerenda a rés két oldalán: vezeti a réskanalat, megtámasztja a laza felső talajt, megakadályozza a zagy elszivárgását, és ez a kitűzés alapja is.' },
  { n: 2, x: 185, y: 196, t: 'Bentonitzagy', d: 'A kiemelt föld helyét azonnal zagy tölti ki (ρ = 1,03–1,12 g/cm³). Belülről nyomja a rés falát, és kizárja a talajvizet – amíg a beton a helyére nem kerül.' },
  { n: 3, x: 205, y: 300, t: 'Réskanál', d: 'Ciklikus munka: leengedés – harapás – kiemelés – ürítés – újra leengedés. Egy harapás jellemzően 2,8 m hosszú: ennyi a nyitott kanál szélessége.' },
  { n: 4, x: 92, y: 110, t: 'Talajvízszint', d: 'A talajvíz kívülről nyomja a rés falát; a víznyomás a talajvízszint alatt a mélységgel lineárisan nő: σ<sub>v</sub> = (z − h)·γ<sub>v</sub>.' },
  { n: 5, x: 146, y: 86, t: 'Szintelőny', d: 'A zagyszintnek a résben mindig legalább 1,0–1,5 m-rel a talajvízszint felett kell lennie. Mivel a zagy csak kicsit nehezebb a víznél, ez a szintkülönbség „nyeri meg” a nyomásversenyt.' },
  { n: 6, x: 421, y: 40, t: 'Fejgerenda', d: 'A fal felső 30–50 cm-e zaggyal keveredett, ezt visszavésik; a táblákat vasbeton fejgerenda fogja össze, erre csatlakozik a felszerkezet.' },
  { n: 7, x: 726, y: 300, t: 'Résfal', d: 'Vasbeton panelek folytonos, 40–120 cm vastag fala. Merev és vízzáró – itt egyben a mélygarázs végleges oldalfala, és a felette álló épület terhét is leviszi.' },
  { n: 8, x: 565, y: 104, t: 'Födémek', d: 'A garázsszintek födémei támasztják meg a falat. Top-down építésnél felülről lefelé készülnek: a gödör kiemelése a födémek alatt halad.' },
  { n: 9, x: 444, y: 330, t: 'Beágyazás', d: 'A fal lába a vízzáró agyagba kötve a talajvizet is kizárja a gödörből – így nincs szükség talajvízszint-süllyesztésre a környéken.' },
  { n: 10, x: 382, y: 24, t: 'Szomszéd épület', d: 'A résfal viszonylag zaj- és rezgésmentesen készül, és merev fal: ezért építhető közvetlenül a telekhatáron álló épület mellett is.' },
];
register('rf-anat', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false });
  const W = 760, H = 400;
  const fig = figure(viz, W, H, 'fig rf-anatfig');
  const info = h('div', { class: 'rf-info' });
  const list = h('div', { class: 'rf-leg' });
  viz.append(info, list);
  const g = G(fig);
  R(g, 0, 0, W, 60, 'f-sky');
  soil(g, 0, 60, W, 190, 'f-soilA', 'pat-sand');
  soil(g, 0, 250, W, 150, 'f-soilB', 'pat-clay', 0.8);
  T(g, 10, 244, 'homok, kavics', 't-sm halo');
  T(g, 10, 392, 'vízzáró agyag', 't-sm halo');
  // ---- bal fél: építés közben
  const tip = [186, 6];
  crane(g, 30, 60, tip);
  L(g, tip[0], tip[1], 186, 286, 'stroke:var(--ink);stroke-width:1.2');
  R(g, 176, 60, 20, 300, 'f-slurry', { opacity: 0.95 });
  R(g, 176, 60, 20, 300, '', { fill: 'url(#pat-slurry)' });
  R(g, 166, 57, 10, 19, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
  R(g, 196, 57, 10, 19, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
  grab(g, 186, 306, 20, 0.2);
  L(g, 0, 110, 166, 110, 'stroke:var(--water);stroke-width:1.6;stroke-dasharray:6 4');
  L(g, 206, 110, 345, 110, 'stroke:var(--water);stroke-width:1.6;stroke-dasharray:6 4');
  P(g, 'M24 104 l6 -9 h-12 z', '', { style: 'fill:var(--water)' });
  T(g, 34, 104, 'TV', 't-sm t-water');
  // szintelőny
  L(g, 158, 60, 158, 110, 'stroke:var(--grp);stroke-width:1.5');
  L(g, 153, 60, 172, 60, 'stroke:var(--grp);stroke-width:1.5');
  L(g, 153, 110, 163, 110, 'stroke:var(--grp);stroke-width:1.5');
  T(g, 214, 72, 'zagyszint', 't-sm halo');
  T(g, 214, 340, 'rés zaggyal', 't-sm halo');
  // ---- jobb fél: kész állapot
  L(g, 345, 0, 345, H, 'stroke:var(--line2);stroke-width:1.5;stroke-dasharray:5 5');
  T(g, 334, 22, 'ÉPÍTÉS KÖZBEN', 't-big', { 'text-anchor': 'end', style: 'font-size:15px' });
  T(g, 566, 22, 'KÉSZ ÁLLAPOT', 't-big', { 'text-anchor': 'middle', style: 'font-size:15px' });
  // szomszéd épület síkalapon
  R(g, 358, 6, 46, 54, 'f-bld', { style: 'stroke:var(--building2);stroke-width:1' });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) R(g, 364 + c * 20, 12 + r * 16, 12, 9, 'f-bld2');
  R(g, 354, 60, 54, 12, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
  // munkagödör
  R(g, 428, 60, 274, 190, 'f-bg2');
  for (const y of [60, 110, 160, 210]) R(g, 428, y, 274, 6, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:.8' });
  R(g, 428, 244, 274, 12, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:.8' });
  for (const x of [520, 610]) for (const y of [66, 116, 166, 216]) R(g, x - 3, y, 6, y === 216 ? 28 : 44, 'f-conc2');
  // falak
  for (const x of [414, 702]) {
    R(g, x, 58, 14, 302, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
    R(g, x, 58, 14, 302, '', { fill: 'url(#pat-conc)' });
    L(g, x + 4, 70, x + 4, 352, 'stroke:var(--rebar);stroke-width:1;stroke-dasharray:4 3');
    L(g, x + 10, 70, x + 10, 352, 'stroke:var(--rebar);stroke-width:1;stroke-dasharray:4 3');
    R(g, x - 4, 48, 22, 12, 'f-conc2', { style: 'stroke:var(--ink);stroke-width:.8' });
  }
  // talajvíz kívül + víznyomás-nyilak
  L(g, 345, 110, 414, 110, 'stroke:var(--water);stroke-width:1.6;stroke-dasharray:6 4');
  L(g, 716, 110, W, 110, 'stroke:var(--water);stroke-width:1.6;stroke-dasharray:6 4');
  for (const y of [150, 190, 230]) { const l = 10 + (y - 110) * 0.12; ar(g, 716 + l + 10, y, 718, y, 'var(--water)', 2, 6); }
  T(g, 566, 236, 'munkatér – száraz', 't-sm', { 'text-anchor': 'middle' });
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
const PAN = [
  { id: 'P1', k: 'P', x0: 0, x1: 7 },
  { id: 'S1', k: 'S', x0: 7, x1: 9.8 },
  { id: 'P2', k: 'P', x0: 9.8, x1: 16.8 },
  { id: 'S2', k: 'S', x0: 16.8, x1: 19.6 },
  { id: 'P3', k: 'P', x0: 19.6, x1: 26.6 },
];
PAN.forEach((q) => { q.bites = q.k === 'P' ? [[q.x0, q.x0 + 2.8], [q.x1 - 2.8, q.x1], [q.x0 + 2.8, q.x1 - 2.8]] : [[q.x0, q.x1]]; });
const EP_STEPS = [
  { t: 'Résvezető gerenda', d: 'A falvonal két oldalán vasbeton résvezető gerendák készülnek (20–30 cm széles, 1,0–1,5 m magas). Ezek vezetik a réskanalat, és ez a kitűzés alapja is.', dur: 1.6 },
  { t: 'P1 – első harapás', d: 'A réskanál a primer tábla egyik végén kezd: leengedés – harapás – kiemelés – ürítés. A kiemelt föld helyét azonnal bentonitzagy tölti ki, a zagyszint végig a résvezető gerenda teteje közelében marad.', dur: 2.2 },
  { t: 'P1 – második harapás', d: 'A tábla másik vége következik. Egy harapás jellemzően 2,8 m hosszú – ennyi a nyitott réskanál szélessége.', dur: 2.2 },
  { t: 'P1 – a közép kiharapása', d: 'A két szélső harapás között megmaradt talajtömböt is kiemelik: ez a 7,0 m-es tábla így három harapásból áll. (Egy 5,6 m-es tábla két harapással is elkészül.)', dur: 1.8 },
  { t: 'Szakaszoló pallók, vasalókosarak', d: 'Aljtisztítás után a tábla két végére szakaszoló palló kerül, majd daruval beemelik a két vasalókosarat.', dur: 2.0 },
  { t: 'P1 betonozása két kontraktorcsővel', d: 'Alulról felfelé, folyamatosan betonoznak. A nehezebb beton kiszorítja a zagyot, amelyet visszaszivattyúznak a telepre. A csövek vége végig a friss betonba merül.', dur: 2.6 },
  { t: 'A többi primer tábla: P2, P3', d: 'Ugyanígy készül el P2 és P3. A primer táblák között egy-egy harapásnyi talaj marad a helyén – itt lesznek a közbenső táblák.', dur: 3.6 },
  { t: 'Közbenső táblák kiharapása', d: 'S1 és S2 egyetlen harapással nyílik ki. A szakaszoló pallók vezetik a kanalat, és védik a már kész primer táblák betonját.', dur: 2.4 },
  { t: 'Közbenső táblák vasalása, betonozása', d: 'A szakaszoló pallókat kihúzzák – a hézagot a betonba ágyazott duzzadószalag tömíti –, beemelik a kosarakat, és betonoznak. A fal most már folytonos.', dur: 3.0 },
  { t: 'Kész a fal: fejgerenda', d: 'A táblák felső 30–50 cm-e zaggyal keveredett, gyenge beton: ezt visszavésik, és a falat vasbeton fejgerenda fogja össze. A résvezető gerendák elbonthatók.', dur: 2.4 },
];
const JUMP = { P1: 1, S1: 7, P2: 6, S2: 7, P3: 6 };
function epState(s, p) {
  const st = { guide: 0, gone: 0, top: 0, pan: PAN.map((q) => ({ b: q.bites.map(() => 0), cage: 0, conc: 0, stop: 0 })), grabs: [] };
  const seq = (i, f, a, b) => clamp((f - a) / (b - a), 0, 1);
  const bite = (i, j, f) => { st.pan[i].b[j] = Math.max(st.pan[i].b[j], f); if (f > 0 && f < 1) st.grabs.push([i, j, f]); };
  const apply = (k, f) => {
    switch (k) {
      case 0: st.guide = f; break;
      case 1: bite(0, 0, f); break;
      case 2: bite(0, 1, f); break;
      case 3: bite(0, 2, f); break;
      case 4: st.pan[0].stop = seq(0, f, 0, 0.3); st.pan[0].cage = seq(0, f, 0.3, 1); break;
      case 5: st.pan[0].conc = f; break;
      case 6: for (const i of [2, 4]) {
        bite(i, 0, seq(i, f, 0, 0.15)); bite(i, 1, seq(i, f, 0.15, 0.3)); bite(i, 2, seq(i, f, 0.3, 0.42));
        st.pan[i].stop = seq(i, f, 0.42, 0.48); st.pan[i].cage = seq(i, f, 0.48, 0.6); st.pan[i].conc = seq(i, f, 0.6, 1);
      } break;
      case 7: for (const i of [1, 3]) bite(i, 0, f); break;
      case 8: for (const i of [0, 2, 4]) st.pan[i].stop = 1 - seq(i, f, 0, 0.15);
        for (const i of [1, 3]) { st.pan[i].cage = seq(i, f, 0.15, 0.4); st.pan[i].conc = seq(i, f, 0.4, 1); } break;
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
  const W = 660, H = 372;
  const fig = figure(viz, W, H, 'fig rf-epfig');
  const txt = h('div', { class: 'steptext' }); viz.append(txt);
  const sEx = stat(out, { label: 'Kiemelt talaj', unit: 'm³', d: 0 }), sZ = stat(out, { label: 'Zagy a résben', unit: 'm³', d: 0 }), sB = stat(out, { label: 'Bedolgozott beton', unit: 'm³', d: 0 }), sT = stat(out, { label: 'Kész táblák' });
  const X = (m) => 40 + m * 22, EY0 = 130, EY1 = 330, DY = (EY1 - EY0);
  const TH_ = 0.6, DEP = 20;
  let step = 0, p = 1, playing = false, hold = 0;
  const uid = 'rfc' + Math.random().toString(36).slice(2, 7);
  const draw = (tt) => {
    clear(fig);
    const st = epState(step, p);
    const defs = svg('defs', {}, fig);
    const cp = svg('clipPath', { id: uid }, defs); R(cp, 0, 98, W, EY1 - 98);
    // ---- felülnézet
    T(fig, 40, 16, 'FELÜLNÉZET', 't-sm', { style: 'letter-spacing:.12em;font-weight:700' });
    soil(fig, 30, 24, 600, 74, 'f-soilA', 'pat-sand', 0.6);
    const gw = (1 - st.gone) * st.guide;
    if (gw > 0) for (const y of [46, 70]) R(fig, X(0) - 6, y, (X(26.6) - X(0) + 12) * st.guide, 8, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1', opacity: 1 - st.gone });
    // ---- hosszmetszet
    T(fig, 40, 116, 'HOSSZMETSZET A FAL TENGELYÉBEN', 't-sm', { style: 'letter-spacing:.12em;font-weight:700' });
    R(fig, 30, 98, 600, EY0 - 98, 'f-sky', { opacity: 0.6 });
    soil(fig, 30, EY0, 600, 222, 'f-soilA', 'pat-sand', 0.6);
    for (let m = 0; m <= 20; m += 5) { L(fig, 30, EY0 + m * 10, 36, EY0 + m * 10, 'stroke:var(--muted);stroke-width:1'); T(fig, 26, EY0 + m * 10 + 4, String(m), 't-sm', { 'text-anchor': 'end' }); }
    T(fig, 26, EY1 + 18, 'm', 't-sm', { 'text-anchor': 'end' });
    if (gw > 0) R(fig, X(0) - 6, EY0, (X(26.6) - X(0) + 12) * st.guide, 13, 'f-conc', { opacity: 0.45 * (1 - st.gone), style: 'stroke:var(--concrete2);stroke-dasharray:3 3' });
    const conc = G(fig), clipG = G(fig, { 'clip-path': `url(#${uid})` });
    let vEx = 0, vB = 0, done = 0;
    PAN.forEach((q, i) => {
      const s = st.pan[i];
      q.bites.forEach(([a, b], j) => {
        const d = s.b[j]; if (d <= 0) return;
        vEx += (b - a) * TH_ * DEP * d;
        R(conc, X(a), 55, X(b) - X(a), 14, 'f-slurry');
        R(conc, X(a), EY0 + 3, X(b) - X(a), DY * d - 3, 'f-slurry', { opacity: 0.92 });
        R(conc, X(a), EY0 + 3, X(b) - X(a), DY * d - 3, '', { fill: 'url(#pat-slurry)' });
      });
      if (s.conc > 0) {
        vB += (q.x1 - q.x0) * TH_ * DEP * s.conc;
        const yc = EY1 - DY * s.conc;
        R(conc, X(q.x0), yc, X(q.x1) - X(q.x0), EY1 - yc, 'f-conc');
        R(conc, X(q.x0), yc, X(q.x1) - X(q.x0), EY1 - yc, '', { fill: 'url(#pat-conc)' });
        R(conc, X(q.x0), 55, X(q.x1) - X(q.x0), 14, 'f-conc', { opacity: clamp(s.conc * 1.4, 0, 1) });
        if (s.conc >= 1) {
          done++;
          if (st.top < 0.45) { R(conc, X(q.x0), EY0, X(q.x1) - X(q.x0), 4.5, 'f-bento', { opacity: 0.85 }); }
        }
        if (s.conc < 1) {
          const xs = q.k === 'P' ? [q.x0 + 1.75, q.x1 - 1.75] : [(q.x0 + q.x1) / 2];
          for (const xm of xs) {
            R(clipG, X(xm) - 2, 100, 4, yc + 12 - 100, 'f-steel2');
            P(clipG, `M${X(xm) - 7} 100 h14 l-5 8 h-4 z`, 'f-steel2');
          }
        }
      }
      // vasalókosár
      if (s.cage > 0) {
        const off = -(1 - s.cage) * 230;
        const cg = q.k === 'P' ? [[q.x0 + 0.2, (q.x0 + q.x1) / 2 - 0.15], [(q.x0 + q.x1) / 2 + 0.15, q.x1 - 0.2]] : [[q.x0 + 0.25, q.x1 - 0.25]];
        for (const [a, b] of cg) {
          const gg = G(clipG, { transform: `translate(0 ${off})` });
          R(gg, X(a), EY0 + 2, X(b) - X(a), DY - 8, '', { style: 'fill:none;stroke:var(--rebar);stroke-width:1.6' });
          for (let x = X(a) + 7; x < X(b) - 3; x += 8) L(gg, x, EY0 + 2, x, EY1 - 6, 'stroke:var(--rebar);stroke-width:.6;opacity:.7');
          for (let y = EY0 + 18; y < EY1 - 6; y += 18) L(gg, X(a), y, X(b), y, 'stroke:var(--rebar);stroke-width:.6;opacity:.7');
          if (s.cage < 1) L(gg, (X(a) + X(b)) / 2, EY0 + 2, (X(a) + X(b)) / 2, EY0 - 120, 'stroke:var(--ink);stroke-width:1');
          R(conc, X(a), 59, X(b) - X(a), 6, '', { style: 'fill:none;stroke:var(--rebar);stroke-width:1.2', opacity: s.cage });
        }
      }
      // szakaszoló pallók
      if (s.stop > 0 && q.k === 'P') for (const xe of [q.x0, q.x1]) {
        const dx = xe === q.x0 ? -1 : 1;
        R(clipG, X(xe) - (dx < 0 ? 3 : 0), EY0 - 6 - (1 - s.stop) * 200, 3, DY + 6, 'f-ink', { opacity: 0.8 });
        R(conc, X(xe) - (dx < 0 ? 3 : 0), 54, 3, 16, 'f-ink', { opacity: 0.8 * s.stop });
      }
    });
    // réskanál
    for (const [i, j, d] of st.grabs) {
      const [a, b] = PAN[i].bites[j];
      const cx = (X(a) + X(b)) / 2;
      const bob = Math.sin((tt || 0) * 5 + i) * 0.5 + 0.5;
      const yb = EY0 + DY * d - bob * 10;
      L(clipG, cx, 100, cx, yb - 26, 'stroke:var(--ink);stroke-width:1.2');
      grab(clipG, cx, yb, 2.8 * 22, bob);
      P(fig, `M${X(a)} 52 h${X(b) - X(a)} M${X(a)} 72 h${X(b) - X(a)}`, '', { style: 'stroke:var(--warn);stroke-width:2;fill:none' });
    }
    // fejgerenda
    if (st.top > 0.45) {
      const k = clamp((st.top - 0.45) / 0.55, 0, 1);
      R(fig, X(0), EY0 - 8, (X(26.6) - X(0)) * k, 13, 'f-conc2', { style: 'stroke:var(--ink);stroke-width:1' });
      R(fig, X(0) - 2, 52, (X(26.6) - X(0) + 4) * k, 20, '', { style: 'fill:none;stroke:var(--ink);stroke-width:1.4' });
      if (k > 0.6) T(fig, X(13.3), EY0 - 13, 'fejgerenda', 't-sm halo', { 'text-anchor': 'middle' });
    }
    // táblacímkék + kattintható zónák
    PAN.forEach((q) => {
      const cx = (X(q.x0) + X(q.x1)) / 2;
      T(fig, cx, 90, q.id, 't-num halo', { 'text-anchor': 'middle', style: `font-size:11px;fill:${q.k === 'P' ? 'var(--ink)' : 'var(--grp)'}` });
      T(fig, cx, EY1 + 16, q.id + (q.k === 'P' ? ' · primer' : ' · szekunder'), 't-sm', { 'text-anchor': 'middle' });
      const hit = R(fig, X(q.x0), 24, X(q.x1) - X(q.x0), EY1 - 24, '', { style: 'fill:transparent;cursor:pointer' });
      hit.addEventListener('click', () => go(JUMP[q.id]));
      svg('title', { text: `${q.id} – ugrás az építéséhez` }, hit);
    });
    if (step >= 1 && step <= 8) T(fig, 626, EY0 + 14, 'zagyszint', 't-sm halo', { 'text-anchor': 'end' });
    if (step === 9 && st.top < 0.45) T(fig, 626, EY0 + 14, 'zaggyal keveredett felső 30–50 cm', 't-sm halo', { 'text-anchor': 'end' });
    // kiírások
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

/* ================================================================== 3. Markoló vagy hydrofraiser? */
const GSOIL = {
  homok: { t: 'Homok, kavics', m: 0, f: 0, cls: 'f-soilA', pat: 'pat-sand' },
  agyag: { t: 'Puha–közepes agyag', m: 0, f: 0, cls: 'f-soilB', pat: 'pat-clay' },
  kemeny: { t: 'Kemény agyag, márga', m: -70, f: 15, cls: 'f-soilE', pat: 'pat-clay' },
  kozet: { t: 'Kőzet', m: -100, f: 25, cls: 'f-rock', pat: 'pat-rock' },
};
register('rf-gep', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sS = seg(ctrls, { label: 'Talaj a fal mélységében', options: Object.entries(GSOIL).map(([v, o]) => ({ v, t: o.t })), value: 'homok', vert: true });
  const sD = slider(ctrls, { label: 'A fal mélysége', min: 10, max: 60, step: 1, value: 25, unit: 'm' });
  const tP = toggle(ctrls, { label: 'Nagy pontosság kell (függőlegesség, sima felület)', value: false });
  const tC = toggle(ctrls, { label: 'Szűk a költségkeret', value: false });
  ctrls.append(h('p', { class: 'ctl-hint', html: 'A pontszám szemléltető: a döntést a valóságban a talajfeltárás, a mélység, a pontossági előírás és az ajánlati ár együtt adja ki.' }));
  const W = 640, H = 330;
  const fig = figure(viz, W, H, 'fig');
  const sM = stat(out, { label: 'Résmarkoló', unit: '/ 100', d: 0 }), sF = stat(out, { label: 'Hydrofraiser', unit: '/ 100', d: 0 });
  const vd = verdict(out); vd.el.classList.add('rf-span');
  let sc = { m: 0, f: 0 };
  const score = () => {
    const so = GSOIL[sS.v], d = sD.v;
    const why = [];
    let m = 82, f = 64;
    m += so.m; f += so.f;
    if (sS.v === 'kozet' || sS.v === 'kemeny') why.push('kőzetben, nagyon kemény agyagban a résfal <b>csak hydrofraiserrel</b> készülhet');
    if (d > 30) { m -= (d - 30) * 1.6; f += Math.min(14, (d - 30) * 0.6); why.push('nagy mélységben a markoló függőlegessége egyre nehezebben tartható, a marógép végig vezetett'); }
    if (tP.v) { m -= 18; f += 18; why.push('a marógép pontosabb, szebb felületet ad'); }
    if (tC.v) { m += 10; f -= 34; why.push('a hydrofraiser nagyon drága (marógép + zagytisztító telep)'); }
    if (!why.length) why.push('laza vagy közepes talajban, szokásos mélységben a ciklikusan dolgozó réskanál gyors és gazdaságos');
    m = clamp(m, 0, 100); f = clamp(f, 0, 100);
    return { m, f, why };
  };
  const draw = (t = 0) => {
    clear(fig);
    const so = GSOIL[sS.v], d = sD.v, ty = 70, kpx = 3.9;
    R(fig, 0, 0, W, ty, 'f-sky');
    const top = sS.v === 'kemeny' ? 8 : sS.v === 'kozet' ? 10 : 0;
    if (top) soil(fig, 0, ty, W, top * kpx, 'f-soilA', 'pat-sand');
    soil(fig, 0, ty + top * kpx, W, H - ty - top * kpx, so.cls, so.pat, 0.8);
    const best = sc.m >= sc.f ? 'm' : 'f';
    const yb = ty + d * kpx;
    // markoló
    const tipM = [172, 10];
    crane(fig, 40, ty, tipM);
    R(fig, 162, ty, 20, d * kpx, 'f-slurry'); R(fig, 162, ty, 20, d * kpx, '', { fill: 'url(#pat-slurry)' });
    const bob = 0.5 + 0.5 * Math.sin(t * 2.4);
    const gy = ty + 30 + (d * kpx - 30) * (0.55 + 0.45 * bob);
    L(fig, tipM[0], tipM[1], 172, gy - 26, 'stroke:var(--ink);stroke-width:1.2');
    grab(fig, 172, gy, 22, bob);
    T(fig, 160, H - 10, 'RÉSMARKOLÓ', 't-big', { 'text-anchor': 'middle', style: 'font-size:15px' });
    // hydrofraiser
    const tipF = [492, 10];
    crane(fig, 360, ty, tipF);
    R(fig, 482, ty, 20, d * kpx, 'f-slurry'); R(fig, 482, ty, 20, d * kpx, '', { fill: 'url(#pat-slurry)' });
    L(fig, tipF[0], tipF[1], 492, yb - 64, 'stroke:var(--ink);stroke-width:1.2');
    R(fig, 485, yb - 64, 14, 50, 'f-acc', { style: 'stroke:var(--ink);stroke-width:1' });
    for (const cx of [487, 497]) {
      const wg = G(fig, { transform: `rotate(${(cx === 487 ? 1 : -1) * t * 160} ${cx} ${yb - 8})` });
      C(wg, cx, yb - 8, 7.5, 'f-steel2');
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; L(wg, cx, yb - 8, cx + Math.cos(a) * 8.5, yb - 8 + Math.sin(a) * 8.5, 'stroke:var(--surface);stroke-width:1.2'); }
    }
    P(fig, `M496 ${yb - 64} C 520 ${ty - 20}, 560 ${ty - 30}, 580 ${ty - 22}`, '', { style: 'fill:none;stroke:var(--steel);stroke-width:3' });
    R(fig, 566, ty - 28, 62, 28, 'f-bento', { rx: 3, opacity: 0.9 });
    T(fig, 597, ty - 10, 'zagytelep', 't-sm', { 'text-anchor': 'middle', style: 'fill:#fff;font-weight:700' });
    T(fig, 480, H - 10, 'HYDROFRAISER', 't-big', { 'text-anchor': 'middle', style: 'font-size:15px' });
    // mélységskála
    for (let m = 0; m <= 60; m += 10) { L(fig, 316, ty + m * kpx, 324, ty + m * kpx, 'stroke:var(--ink);stroke-width:1'); T(fig, 312, ty + m * kpx + 4, m + ' m', 't-sm halo', { 'text-anchor': 'end' }); }
    L(fig, 320, ty, 320, ty + 60 * kpx, 'stroke:var(--ink);stroke-width:1');
    for (const [m, s] of [[40, 'Szent Gellért tér · 40 m'], [48.3, 'Fővám tér · 48,3 m']]) {
      L(fig, 324, ty + m * kpx, 340, ty + m * kpx, 'stroke:var(--g6);stroke-width:1.5');
      T(fig, 344, ty + m * kpx + 4, s, 't-sm halo', { style: 'fill:var(--g6);font-weight:700' });
    }
    // kiemelés
    const bx = best === 'm' ? 6 : 326;
    R(fig, bx, 4, 308, H - 8, '', { rx: 12, style: 'fill:none;stroke:var(--grp);stroke-width:3' });
    R(fig, bx + 214, 10, 88, 20, 'f-grp', { rx: 10 });
    T(fig, bx + 258, 24, 'JAVASOLT', '', { 'text-anchor': 'middle', style: 'font:800 11px var(--f-mono);fill:#fff;letter-spacing:.08em' });
  };
  const upd = () => {
    sc = score();
    sM.set(sc.m, sc.m >= 60 ? 'ok' : sc.m >= 35 ? 'warn' : 'bad');
    sF.set(sc.f, sc.f >= 60 ? 'ok' : sc.f >= 35 ? 'warn' : 'bad');
    const best = sc.m >= sc.f ? 'Résmarkoló' : 'Hydrofraiser';
    const st = Math.abs(sc.m - sc.f) < 8 ? 'warn' : 'ok';
    vd.set(st, Math.abs(sc.m - sc.f) < 8 ? 'Mindkettő szóba jöhet' : best + ' a jobb választás', '<ul class="rf-why">' + sc.why.map((w) => `<li>${w}</li>`).join('') + '</ul>');
    draw(0);
  };
  [sS, sD, tP, tC].forEach((c) => c.on(upd));
  upd();
  loop(root, (t) => draw(t));
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
    T(fig, xs(ghost[0][ghost[0].length - 1].sx) + 4, ys(14), '2,8 m', 't-sm halo');
    T(fig, xs(ghost[1][ghost[1].length - 1].sx) + 4, ys(19), '10 m', 't-sm halo');
    const lim = Lr * 10 * pr.Ka / Math.sin(2 * 32 * Math.PI / 180);
    L(fig, xs(lim), gy0, xs(lim), gy1, 'stroke:var(--grp);stroke-width:1;stroke-dasharray:2 3;opacity:.7');
    s30.set(last.sx); sR.set(last.sR); sRed.set((1 - last.sx / last.sR) * 100, 'ok'); sLim.set(lim);
  };
  sL.on(draw); draw();
});

/* ================================================================== 5. Résállékonyság-labor */
const LSOIL = {
  kavics: { t: 'Kavicsos homok', phi: 36, c: 0, gam: 19, ds: 2.0 },
  homok: { t: 'Közepes homok', phi: 32, c: 0, gam: 18, ds: 2.0 },
  iszap: { t: 'Iszapos, folyós homok', phi: 27, c: 0, gam: 18, ds: 1.5 },
  agyag: { t: 'Puha agyag', phi: 20, c: 4, gam: 17.5, ds: 0.5 },
};
register('rf-lab', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sS = seg(ctrls, { label: 'Talaj', options: Object.entries(LSOIL).map(([v, o]) => ({ v, t: o.t })), value: 'homok' });
  const sPhi = slider(ctrls, { label: 'Belső súrlódási szög', sym: 'φ', min: 15, max: 42, step: 1, value: 32, unit: '°' });
  const sC = slider(ctrls, { label: 'Kohézió', sym: 'c', min: 0, max: 20, step: 1, value: 0, unit: 'kPa' });
  const sG = slider(ctrls, { label: 'Térfogatsúly (TV felett)', sym: 'γ', min: 15, max: 21, step: 0.5, value: 18, unit: 'kN/m³', d: 1 });
  const sH = slider(ctrls, { label: 'Talajvízszint mélysége', sym: 'h', min: 0, max: 10, step: 0.1, value: 2, unit: 'm', d: 1 });
  const sT = slider(ctrls, { label: 'Zagyszint mélysége', sym: 't', min: 0, max: 4, step: 0.1, value: 0.3, unit: 'm', d: 1 });
  const sR = slider(ctrls, { label: 'Zagy sűrűsége', sym: 'ρ', min: 1, max: 1.2, step: 0.01, value: 1.08, unit: 'g/cm³', d: 2, hint: 'Réseléskor 1,03–1,12 g/cm³.' });
  const sL = slider(ctrls, { label: 'Réstábla hossza', sym: 'L', min: 2.8, max: 10, step: 0.2, value: 5.6, unit: 'm', d: 1 });
  const sD = slider(ctrls, { label: 'A rés mélysége', sym: 'D', min: 10, max: 40, step: 1, value: 25, unit: 'm' });
  const sQ = slider(ctrls, { label: 'Felszíni teher a rés mellett', sym: 'q', min: 0, max: 60, step: 5, value: 0, unit: 'kPa' });
  const gHint = h('p', { class: 'ctl-hint' }); ctrls.append(gHint);
  const W = 640, H = 470;
  const fig = figure(viz, W, H, 'fig rf-labfig');
  const leg = h('div', { class: 'legend' }); viz.append(leg);
  leg.innerHTML = '<span><i style="background:var(--slurry)"></i>zagynyomás σ<sub>p</sub></span><span><i style="background:var(--water-fill);border-color:var(--water)"></i>víznyomás σ<sub>v</sub></span><span><i style="background:var(--bad);height:3px"></i>víz + föld (silóhatással)</span><span><i style="background:repeating-linear-gradient(90deg,var(--muted) 0 5px,transparent 5px 8px);height:3px;border:0"></i>víz + föld (Rankine)</span>';
  const oDh = stat(out, { label: 'Zagyszint a TV felett', unit: 'm', d: 1 }), oE = stat(out, { label: 'η<sub>min</sub> silóhatással' }), oER = stat(out, { label: 'η<sub>min</sub> Rankine-nel' }), oSx = stat(out, { label: 'Földnyomás a talpon: siló / Rankine', unit: 'kPa' });
  const vd = verdict(out); vd.el.classList.add('rf-span');
  const ZG = 1.2; // a résvezető gerenda mélysége: eddig a gerenda támaszt
  let pr = null, cur = null;
  const hover = G(fig);
  const params = () => ({ phi: sPhi.v, c: sC.v, gam: sG.v, gsat: Math.min(23, sG.v + LSOIL[sS.v].ds), h: sH.v, t: sT.v, rho: sR.v, Lr: sL.v, D: sD.v, q: sQ.v });
  // geometria
  const gx0 = 250, gx1 = 618, gy0 = 34, gy1 = 452;
  let smax = 300, D = 25;
  const xs = (s) => gx0 + (s / smax) * (gx1 - gx0), ys = (z) => gy0 + (z / D) * (gy1 - gy0);
  const draw = () => {
    const o = params(); D = o.D; cur = o;
    pr = profile(o);
    const pts = pr.pts;
    clear(fig);
    const last = pts[pts.length - 1];
    smax = Math.max(last.sp, last.sw + last.sR, last.sw + last.sx, 20) * 1.05;
    const stepS = smax > 400 ? 100 : smax > 160 ? 50 : smax > 80 ? 20 : 10;
    // ---- résmetszet (bal)
    const tx0 = 40, tx1 = 200, tc = 120, tw = 26;
    T(fig, tx0, 20, 'A RÉS METSZETE', 't-sm', { style: 'letter-spacing:.12em;font-weight:700' });
    soil(fig, tx0, gy0, tx1 - tx0, gy1 - gy0 + 8, 'f-soilA', o.phi < 23 ? 'pat-clay' : 'pat-sand', 0.75);
    if (o.h < D) R(fig, tx0, ys(o.h), tx1 - tx0, gy1 - ys(o.h) + 8, 'f-water', { opacity: 0.7 });
    R(fig, tc - tw / 2, gy0, tw, gy1 - gy0, 'f-sky');
    R(fig, tc - tw / 2, ys(o.t), tw, gy1 - ys(o.t), 'f-slurry');
    R(fig, tc - tw / 2, ys(o.t), tw, gy1 - ys(o.t), '', { fill: 'url(#pat-slurry)' });
    R(fig, tc - tw / 2 - 10, gy0 - 4, 10, ys(ZG) - gy0 + 4, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
    R(fig, tc + tw / 2, gy0 - 4, 10, ys(ZG) - gy0 + 4, 'f-conc', { style: 'stroke:var(--concrete2);stroke-width:1' });
    if (o.h < D) {
      for (const x of [tx0, tc + tw / 2 + 12]) L(fig, x, ys(o.h), x + (tc - tw / 2 - 12 - tx0), ys(o.h), 'stroke:var(--water);stroke-width:1.6;stroke-dasharray:5 3');
      P(fig, `M${tx0 + 10} ${ys(o.h) - 2} l5 -8 h-10 z`, '', { style: 'fill:var(--water)' });
      T(fig, tx0 + 18, ys(o.h) - 4, 'TV', 't-sm t-water halo');
    }
    L(fig, tc - tw / 2, ys(o.t), tc + tw / 2, ys(o.t), 'stroke:var(--bento);stroke-width:2.5');
    // beomló zónák a metszeten
    // zónák számítása
    const zones = [], zonesR = [];
    let eMin = 99, eMinZ = 0, eRMin = 99, eRMinZ = 0;
    let curZ = null, curZR = null;
    pts.forEach((p, i) => {
      if (p.z < ZG) return;
      const e = eta(p, p.sx), eR = eta(p, p.sR);
      if (e < eMin) { eMin = e; eMinZ = p.z; }
      if (eR < eRMin) { eRMin = eR; eRMinZ = p.z; }
      const lev = e < 1 ? 'bad' : e < 1.3 ? 'warn' : null;
      if (lev && (!curZ || curZ.lev !== lev)) { curZ = { a: p.z, b: p.z, lev }; zones.push(curZ); } else if (lev) curZ.b = p.z; else curZ = null;
      if (eR < 1) { if (!curZR) { curZR = { a: p.z, b: p.z }; zonesR.push(curZR); } else curZR.b = p.z; } else curZR = null;
    });
    // ---- diagram (jobb)
    T(fig, gx0, 20, 'NYOMÁSOK A RÉS FALÁN', 't-sm', { style: 'letter-spacing:.12em;font-weight:700' });
    for (const zn of zones) {
      R(fig, gx0, ys(zn.a), gx1 - gx0, Math.max(1.5, ys(zn.b) - ys(zn.a)), zn.lev === 'bad' ? 'f-bad' : 'f-warn', { opacity: zn.lev === 'bad' ? 0.22 : 0.16 });
      if (zn.lev === 'bad') {
        const ya = ys(zn.a), yb2 = ys(zn.b);
        P(fig, `M${tc + tw / 2} ${ya} L${tc + tw / 2 + Math.min(50, (yb2 - ya) * 0.6 + 14)} ${ya} L${tc + tw / 2} ${yb2} Z`, 'f-bad', { opacity: 0.35 });
        P(fig, `M${tc - tw / 2} ${ya} L${tc - tw / 2 - Math.min(50, (yb2 - ya) * 0.6 + 14)} ${ya} L${tc - tw / 2} ${yb2} Z`, 'f-bad', { opacity: 0.35 });
        L(fig, tc + tw / 2 + Math.min(50, (yb2 - ya) * 0.6 + 14), ya, tc + tw / 2, yb2, 'stroke:var(--bad);stroke-width:1.6;stroke-dasharray:4 3');
        L(fig, tc - tw / 2 - Math.min(50, (yb2 - ya) * 0.6 + 14), ya, tc - tw / 2, yb2, 'stroke:var(--bad);stroke-width:1.6;stroke-dasharray:4 3');
      }
    }
    for (let s = 0; s <= smax; s += stepS) { L(fig, xs(s), gy0, xs(s), gy1, 'stroke:var(--line);stroke-width:1'); T(fig, xs(s), gy1 + 14, String(s), 't-sm', { 'text-anchor': 'middle' }); }
    const stepZ = D > 30 ? 10 : 5;
    for (let z = 0; z <= D; z += stepZ) { L(fig, gx0, ys(z), gx1, ys(z), 'stroke:var(--line);stroke-width:1'); T(fig, gx0 - 6, ys(z) + 4, z + ' m', 't-sm', { 'text-anchor': 'end' }); L(fig, tx1 + 4, ys(z), tx1 + 10, ys(z), 'stroke:var(--muted)'); }
    T(fig, gx1, gy1 + 28, 'kPa', 't-sm', { 'text-anchor': 'end' });
    const sel = pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1);
    const area = (key, cls, op) => P(fig, pathD([[xs(0), ys(0)], ...sel.map((p) => [xs(p[key]), ys(p.z)]), [xs(0), ys(D)]], true), cls, { opacity: op });
    area('sp', 'f-slurry', 0.35);
    area('sw', 'f-water', 0.9);
    P(fig, pathD(sel.map((p) => [xs(p.sp), ys(p.z)])), '', { style: 'fill:none;stroke:var(--bento);stroke-width:2.4' });
    P(fig, pathD(sel.map((p) => [xs(p.sw), ys(p.z)])), '', { style: 'fill:none;stroke:var(--water);stroke-width:1.6' });
    P(fig, pathD(sel.map((p) => [xs(p.sw + p.sR), ys(p.z)])), '', { style: 'fill:none;stroke:var(--muted);stroke-width:1.8;stroke-dasharray:6 4' });
    P(fig, pathD(sel.map((p) => [xs(p.sw + p.sx), ys(p.z)])), '', { style: 'fill:none;stroke:var(--bad);stroke-width:2.6' });
    L(fig, gx0, ys(ZG), gx1, ys(ZG), 'stroke:var(--concrete2);stroke-width:1;stroke-dasharray:2 3');
    T(fig, gx1 - 4, ys(ZG) - 4, 'résvezető gerenda alja', 't-sm halo', { 'text-anchor': 'end' });
    TH(fig, xs(last.sp) - 6, ys(D) - 8, sub('σ', 'p'), 't-lab halo', { 'text-anchor': 'end', style: 'fill:var(--bento);font-weight:800' });
    L(fig, gx0, gy0, gx0, gy1, 'stroke:var(--ink);stroke-width:1');
    fig.append(hover);
    // ---- kiírások
    const dh = o.h - o.t;
    oDh.set(dh, dh >= 1.5 ? 'ok' : dh >= 1.0 ? 'warn' : 'bad');
    const ef = (e) => e >= 9.99 ? '> 9,99' : fmt(Math.max(0, e), 2);
    oE.set(0, eMin >= 1.3 ? 'ok' : eMin >= 1 ? 'warn' : 'bad', `${ef(eMin)} <small class="nw">(${fmt(eMinZ, 1)}&nbsp;m)</small>`);
    oER.set(0, eRMin >= 1.3 ? 'ok' : eRMin >= 1 ? 'warn' : 'bad', `${ef(eRMin)} <small class="nw">(${fmt(eRMinZ, 1)}&nbsp;m)</small>`);
    oSx.set(0, null, `${fmt(last.sx, 0)} / ${fmt(last.sR, 0)}`);
    gHint.innerHTML = `TV alatt: γ<sub>sat</sub> = ${fmt(o.gsat, 1)} kN/m³, γ′ = ${fmt(o.gsat - 10, 1)} kN/m³; a zagy térfogatsúlya γ<sub>b</sub> = ${fmt(pr.gb, 1)} kN/m³; K<sub>a</sub> = ${fmt(pr.Ka, 3)}.`;
    const bad = zones.filter((z) => z.lev === 'bad');
    const tips = [];
    if (dh < 1.5) tips.push('emeld a zagyszintet (a szintelőny most ' + fmt(dh, 1) + ' m)');
    if (o.rho < 1.1) tips.push('növeld a zagy sűrűségét');
    if (o.Lr > 3) tips.push('nyiss rövidebb táblát');
    if (o.q > 0) tips.push('vidd távolabb a felszíni terhet');
    const rng = (zs) => zs.map((z) => `${fmt(z.a, 1)}–${fmt(z.b, 1)} m`).join(', ');
    if (bad.length) vd.set('bad', 'A rés beomlik', `<p>A zagy víznyomás feletti többlete nem győzi a földnyomást: <b>${rng(bad)}</b> között. Javaslat: ${tips.slice(0, 3).join(', ') || 'változtass a paramétereken'}.</p>`);
    else if (zones.length) vd.set('warn', 'Határeset', `<p>A rés éppen megáll, de kevés a tartalék (η &lt; 1,3) itt: <b>${rng(zones)}</b>. ${dh < 1.0 ? 'A zagyszint ráadásul nincs legalább 1,0 m-rel a talajvíz felett.' : ''}</p>`);
    else vd.set(dh < 1.0 ? 'warn' : 'ok', dh < 1.0 ? 'Állékony – de nem szabályos' : 'Állékony', `<p>${dh < 1.0 ? 'A modell szerint a rés megáll, de a zagyszint nincs legalább 1,0–1,5 m-rel a talajvízszint felett: egy kis zagyveszteség is beomlást okozhatna.' : 'A zagy minden mélységben kellő tartalékkal tartja meg a rés falát.'} ${eRMin < 1 ? 'Figyeld meg: a Rankine-féle földnyomással számolva ugyanez a rés beomlana – a silóhatás „menti meg”.' : ''}</p>`);
  };
  // egérrel olvasás
  const pick = (ev) => {
    if (!pr) return;
    const m = fig.getScreenCTM(); if (!m) return;
    const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
    clear(hover);
    if (pt.x < gx0 || pt.x > gx1 || pt.y < gy0 || pt.y > gy1) return;
    const z = clamp((pt.y - gy0) / (gy1 - gy0) * D, 0, D);
    const p = pr.pts[Math.round(z / 0.05)] || pr.pts[pr.pts.length - 1];
    const y = ys(p.z);
    L(hover, gx0, y, gx1, y, 'stroke:var(--ink);stroke-width:1;stroke-dasharray:3 3');
    const e = p.z < ZG ? null : eta(p, p.sx);
    const bx = pt.x > (gx0 + gx1) / 2 ? gx0 + 8 : gx1 - 196, by = clamp(y + 10, gy0 + 4, gy1 - 92);
    R(hover, bx, by, 188, 86, 'f-surface', { rx: 8, style: 'stroke:var(--line2);stroke-width:1', opacity: 0.96 });
    const rows = [['z', fmt(p.z, 1) + ' m'], [sub('σ', 'p'), fmt(p.sp, 1) + ' kPa'], [sub('σ', 'v'), fmt(p.sw, 1) + ' kPa'], [sub('σ', 'x') + ' (siló)', fmt(p.sx, 1) + ' kPa'], ['η', e === null ? 'gerenda' : e >= 9.99 ? '> 9,99' : fmt(Math.max(0, e), 2)]];
    rows.forEach(([a, b], i) => { TH(hover, bx + 10, by + 18 + i * 15, a, 't-sm'); T(hover, bx + 178, by + 18 + i * 15, b, 't-num', { 'text-anchor': 'end', style: 'font-size:11px' }); });
  };
  fig.addEventListener('pointermove', pick);
  fig.addEventListener('pointerleave', () => clear(hover));
  sS.on((v) => { const s = LSOIL[v]; sPhi.set(s.phi, false); sC.set(s.c, false); sG.set(s.gam, false); draw(); });
  [sPhi, sC, sG, sH, sT, sR, sL, sD, sQ].forEach((c) => c.on(draw));
  root.querySelector('.w-foot')?.remove();
  root.append(h('div', { class: 'w-foot', html: '<b>Szemléltető modell.</b> η = (σ<sub>p</sub> − σ<sub>v</sub>) / σ<sub>x</sub>: a zagy víznyomás feletti nyomástöbblete hányszorosa a földnyomásnak (η &lt; 1: beomlás, 1–1,3: kevés tartalék). A földnyomás a Schneebeli-képletből, rétegenként (TV felett γ, alatta γ′) számolva; a résvezető gerenda (1,2 m) alatt vizsgálunk. A valós ellenőrzés térbeli csúszólapokkal és biztonsági tényezőkkel dolgozik, és tőzegben, nagyon puha agyagban a drénezetlen viselkedés és a zagyveszteség még kedvezőtlenebb.' }));
  draw();
});

/* ================================================================== kvíz */
defineQuiz('rf', 'Kvíz – résfalak', [
  { q: 'Legalább mennyivel legyen a zagyszint a résben a talajvízszint felett?', a: ['1,0–1,5 m-rel', '10–20 cm-rel', 'Legalább 5 m-rel', 'Mindegy, ha elég sűrű a zagy'], c: 0, e: 'A zagy csak kicsit nehezebb a víznél (1,03–1,12 g/cm³), ezért szintelőny kell: legalább 1,0–1,5 m. Ez a többlet tartja egyensúlyban a földnyomást is.' },
  { q: 'Mekkora egy résmarkolós „harapás” jellemző hossza?', a: ['2,8 m', '0,6 m', '8–10 m', '15 m'], c: 0, e: 'A réskanál nyitott szélessége kb. 2,8 m – ez egyben a legrövidebb kiemelhető réstábla. A szokásos táblák 2,8–5,6 m hosszúak.' },
  { q: 'Miért kisebb a rés falára ható földnyomás a Rankine-félénél?', a: ['A tábla két vége felé boltozódás alakul ki (silóhatás)', 'A zagy kémiailag megszilárdítja a talajt', 'A talajvíz felhajtóereje teljesen kiegyenlíti', 'Mert a résfal hajlékony'], c: 0, e: 'A véges hosszú rés mellett a talajék a tábla végeinél a nyugvó talajra támaszkodik; a földnyomás a mélységgel egy határértékhez tart (Schneebeli-képlet).' },
  { q: 'Mi történik, ha hosszabb réstáblát nyitunk ugyanabban a talajban?', a: ['Gyengül a boltozódás, nő a földnyomás, csökken az állékonyság', 'Nő az állékonyság', 'Nincs hatása, csak a betonozás tart tovább', 'A zagy sűrűsége megnő'], c: 0, e: 'Rövidebb tábla → erősebb boltozódás → kisebb földnyomás → állékonyabb rés. Ezért legfeljebb 8–10 m, jellemzően 2,8–5,6 m a táblahossz.' },
  { q: 'Milyen bentonit használható réseléshez?', a: ['Csak aktivált „Na” bentonit', 'Bármilyen helyi agyag', 'Kalciumbentonit cementtel', 'Kvarchomok és víz keveréke'], c: 0, e: 'A bentonit döntően montmorillonitból álló kolloid agyag; réseléshez csak aktivált Na-bentonit jó, a viszkozitás CMC-vel növelhető.' },
  { q: 'Legkésőbb mennyi idővel a réselés befejezése után kell megkezdeni a betonozást?', a: ['4–5 óra', '24 óra', '7 nap', 'Csak a zagy teljes ülepedése után'], c: 0, e: 'Mielőbb, de legkésőbb 4–5 óra múlva – előtte aljtisztítás, utána folyamatos, megszakítás nélküli víz alatti betonozás.' },
  { q: 'Miért vésik vissza a résfal felső 30–50 cm-ét?', a: ['Mert zaggyal keveredett, gyenge minőségű', 'Mert ott a legnagyobb a hajlítónyomaték', 'Hogy a résvezető gerenda kiférjen', 'Csak esztétikai okból'], c: 0, e: 'A beton felső része a kiszorított zaggyal keveredik. Visszavésés után erre kerül a vasbeton fejgerenda.' },
  { q: 'Melyik helyzetben a legnehezebb a résállékonyság biztosítása?', a: ['Puha agyagban, tőzegben, folyós homokban, nagyon magas talajvíznél', 'Tömör kavicsban, talajvíz felett', 'Kemény agyagban', 'Ha a rés rövid és sekély'], c: 0, e: 'Itt kicsi a talaj nyírószilárdsága, nagy a víznyomás vagy a zagyveszteség veszélye. Kemény agyag és kőzet a kiemelést nehezíti (ott hydrofraiser kell), nem az állékonyságot.' },
  { q: 'Mikor indokolt a hydrofraiser (résmaró) a markolóval szemben?', a: ['Kőzetben, nagyon kemény agyagban, nagy mélységnél és pontossági igénynél', 'Rövid, sekély falnál laza homokban', 'Ha nincs szükség zagyra', 'Ha a legolcsóbb megoldás kell'], c: 0, e: 'A marógép bármely talajban és kőzetben, nagy mélységig, pontosan dolgozik – de nagyon drága. Hazánkban a 4-es metrónál alkalmazták (Fővám tér: 48,3 m).' },
]);
