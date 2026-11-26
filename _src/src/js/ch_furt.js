// C05 – Fúrt (talajhelyettesítéses) cölöpök: fúrófejek, CFA-monitor, technológiaválasztó, kvíz
import { register, shell, slider, seg, toggle, select, stat, verdict, svg, figure, clear, fmt, clamp, pathD, h, loop, onTheme } from './core.js';
import { defineQuiz } from './ui.js';
import './g3_phases.js';
import { toolScene, TOOL_LOOP } from './proc.js';

/* ------------------------------------------------------------------ rajzsegédek */
const T = (p, x, y, s, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text: s, ...o }, p);
const R = (p, x, y, w, hh, cls, o = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...o }, p);
const C = (p, cx, cy, r, cls, o = {}) => svg('circle', { cx, cy, r: Math.max(0, r), class: cls, ...o }, p);
const L = (p, x1, y1, x2, y2, style, o = {}) => svg('line', { x1, y1, x2, y2, style, ...o }, p);
const P = (p, pts, style, close = false, o = {}) => svg('path', { d: pathD(pts, close), style, ...o }, p);
const G = (p, o = {}) => svg('g', o, p);
function ar(p, x1, y1, x2, y2, col = 'var(--ink)', w = 2, hd = 7) {
  const g = G(p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  L(g, x1, y1, x2 - Math.cos(a) * hd * 0.6, y2 - Math.sin(a) * hd * 0.6, `stroke:${col};stroke-width:${w};stroke-linecap:round`);
  P(g, [[x2, y2], [x2 - Math.cos(a - 0.45) * hd, y2 - Math.sin(a - 0.45) * hd], [x2 - Math.cos(a + 0.45) * hd, y2 - Math.sin(a + 0.45) * hd]], `fill:${col}`, true);
  return g;
}
const SOIL = {
  k_homok: { t: 'Homok', cls: 'f-soilA', pat: 'pat-sand', szem: true },
  k_kavics: { t: 'Kavics', cls: 'f-soilC', pat: 'pat-gravel', szem: true },
  k_agyag: { t: 'Agyag (kötött)', cls: 'f-soilB', pat: 'pat-clay', szem: false },
};
function soilRect(p, x, y, w, hh, key) {
  const s = SOIL[key];
  R(p, x, y, w, hh, s.cls);
  R(p, x, y, w, hh, '', { fill: `url(#${s.pat})`, opacity: 0.75 });
}
/**
 * Sematikus cölöpözőgép a furat bal oldalán: lánctalpas alváz, felsőváz fülkével és ellensúllyal,
 * a terepre támaszkodó árboc hátsó kitámasztással, fent konzol a furat tengelyéig (X).
 * o.off: az árboc távolsága a furat tengelyétől; o.top: az árboc teteje (lehet a kép felett is: a kép levágja).
 */
function rigL(p, X, G0, o = {}) {
  const g = G(p), mx = X - (o.off ?? 46), top = o.top ?? 6;
  R(g, mx - 122, G0 - 16, 104, 16, 'f-steel2', { rx: 8 });
  for (let i = 0; i < 6; i++) { C(g, mx - 112 + i * 16.8, G0 - 8, 4.6, 'f-surface', { opacity: 0.85 }); C(g, mx - 112 + i * 16.8, G0 - 8, 1.6, 'f-steel2'); }
  R(g, mx - 114, G0 - 40, 86, 22, 'f-steel', { rx: 4, style: 'stroke:var(--steelm2);stroke-width:1.2' });
  R(g, mx - 120, G0 - 47, 24, 29, 'f-steel2', { rx: 3 });
  R(g, mx - 56, G0 - 62, 28, 44, 'f-steel', { rx: 4, style: 'stroke:var(--steelm2);stroke-width:1.2' });
  R(g, mx - 52, G0 - 58, 20, 16, 'f-surface', { rx: 2, opacity: 0.88 });
  L(g, mx - 4, Math.max(top, 0) + (G0 - Math.max(top, 0)) * 0.3, mx - 100, G0 - 44, 'stroke:var(--steelm2);stroke-width:3;stroke-linecap:round');
  L(g, mx - 28, G0 - 28, mx - 5, G0 - 28, 'stroke:var(--steelm2);stroke-width:6');
  R(g, mx - 5, top, 10, G0 - top, 'f-acc');
  for (let y = Math.max(top, 0) + 10; y < G0 - 12; y += 14) L(g, mx - 3.5, y, mx + 3.5, y + 8, 'stroke:var(--surface);stroke-width:1;opacity:.45');
  R(g, mx - 10, G0 - 4, 20, 4, 'f-steel2');
  if (o.jib !== false) { R(g, mx - 5, top, X - mx + 12, 7, 'f-acc', { rx: 2 }); C(g, X, top + 8, 5, 'f-steel2'); C(g, X, top + 8, 1.6, 'f-surface'); }
  return g;
}

/* ================================================================== 1. Fúrófejek munkaciklusa */
const TOOLS = {
  rovid: { t: 'Rövid spirál', soils: [['kötött talaj', 'ok'], ['szemcsés talaj', 'bad']], txt: 'Néhány menetes spirál a Kelly-rúd végén. Lefúr, megtelik, a gép kiemeli, majd a furat mellett gyors pörgetéssel lerázza róla a földet – és kezdi elölről. Elsősorban kötött talajban hatékony: a szemcsés talaj kipereg a menetek közül. Kemény, kötött talajban, talajvíz nélkül a furat megtámasztás nélkül is állékony marad – ezért itt nincs béléscső.' },
  cfa: { t: 'Folyamatos spirál', soils: [['kötött talaj', 'ok'], ['szemcsés talaj', 'ok']], txt: 'A spirál a teljes cölöphosszon végigér, és egyetlen menetben hatol le a végső mélységig. A furadék a menetek között marad, és közben megtámasztja a furat falát – ez a CFA-cölöp alapja. Bármely talajban használható.' },
  marko: { t: 'Markoló', soils: [['kötött talaj', 'ok'], ['szemcsés talaj', 'ok']], txt: 'Hengeres markolókanál: nyitott pofákkal ejtik a furat aljára, összezárva beleharap a talajba, majd a furat mellett ürítik. Bármely talajban használható, feltöltésben, köves rétegben is; gyakran az acél béléscső védelmében dolgozik.' },
  dob: { t: 'Dobfúró', soils: [['kötött talaj', 'warn'], ['szemcsés talaj', 'ok']], txt: 'Fogazott aljú, hengeres dob: forgatás közben a talaj a dob alján lévő nyíláson át a dobba kerül. Megtelve kiemelik, és a nyitható fenéklapon át ürítik. Elsősorban szemcsés talajban hatékony, ahol a spirálról a talaj leperegne.' },
};
register('furtTool', (root) => {
  const { ctrls, viz, out } = shell(root);
  const s = seg(ctrls, { label: 'Eszköz', options: Object.entries(TOOLS).map(([v, o]) => ({ v, t: o.t })), value: 'rovid', vert: true });
  const chips = h('div', { class: 'chips' }); ctrls.append(h('div', { class: 'ctl' }, h('span', { class: 'ctl-lab' }, 'Melyik talajhoz?'), chips));
  const fig = figure(viz, 600, 360, 'fig pr-svg furt-toolfig');
  const cap = h('p', { class: 'furt-cap' }); viz.append(cap);
  out.remove();
  let typ = s.v, t0 = null;
  const paintInfo = () => {
    const o = TOOLS[typ];
    cap.innerHTML = `<b>${o.t}.</b> ${o.txt}`;
    chips.innerHTML = o.soils.map(([t, st]) => `<span class="chip ${st}">${st === 'ok' ? '✓' : st === 'warn' ? '~' : '✗'} ${t}</span>`).join('');
  };
  s.on((v) => { typ = v; t0 = null; paintInfo(); });
  paintInfo();
  const draw = (t) => { if (t0 == null) t0 = t; const u = window.__toolFix != null ? window.__toolFix : (t - t0) % TOOL_LOOP[typ]; toolScene(fig, typ, u, { name: TOOLS[typ].t.toUpperCase() }); };
  loop(root, (t) => draw(t));
  draw(0);
});

/* ================================================================== 4. CFA-monitor */
register('furtCfa', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sD = seg(ctrls, { label: 'Átmérő', options: [40, 60, 80, 100, 120].map((v) => ({ v, t: v + ' cm' })), value: 60 });
  const sL = slider(ctrls, { label: 'Cölöphossz', min: 6, max: 24, step: 1, value: 14, unit: 'm', d: 0 });
  const sV = slider(ctrls, { label: 'Húzási sebesség', sym: 'v', min: 0.2, max: 4, step: 0.1, value: 1.5, unit: 'm/perc', d: 1 });
  const sP = slider(ctrls, { label: 'Betonnyomás', sym: 'p', min: 0, max: 10, step: 0.5, value: 5, unit: 'bar', d: 1, hint: 'Szemléltető modell: a betonáram a nyomással arányos (1 bar ≈ 6 m³/óra).' });
  const row = h('div', { class: 'play-row' });
  const bGo = h('button', { class: 'btn btn-acc btn-sm', type: 'button' }, '▶ Fúrás és betonozás');
  const bFast = h('button', { class: 'btn btn-line btn-sm', type: 'button', 'aria-pressed': 'false' }, '×4 gyorsítás');
  row.append(bGo, bFast); ctrls.append(row);
  const W = 600, H = 452, G0 = 78, BOT = 432;
  const fig = figure(viz, W, H);
  const vd = verdict(viz);
  const rep = h('div', { class: 'furt-rep', hidden: true }); viz.append(rep);
  const oZ = stat(out, { label: 'A spirál talpa', unit: 'm' }), oQ = stat(out, { label: 'Betonáram', unit: 'm³/óra', d: 0 }), oR = stat(out, { label: 'Betonfogyás / elméleti', unit: '%' }), oV = stat(out, { label: 'Bedolgozott beton', unit: 'm³' });
  const bg = G(fig), dyn = G(fig);
  const XS = 190, BWmax = 92; // metszet
  const CX0 = 330, CX1 = 580; // diagram
  const rMin = 0, rMax = 1.6;
  const cx = (r) => CX0 + (clamp(r, rMin, rMax) - rMin) / (rMax - rMin) * (CX1 - CX0);
  let st, fast = false, pileNo = 17;
  const A = () => Math.PI * (sD.v / 100) ** 2 / 4;
  const Q = () => sP.v * 0.1; // m³/perc
  const sc = () => (BOT - G0) / sL.v;
  const paintBg = () => {
    clear(bg);
    const L0 = sL.v, k = sc();
    R(bg, 0, 0, W, G0, 'f-sky');
    soilRect(bg, 0, G0, 290, H - G0, 'k_homok');
    R(bg, 0, G0 + 0.45 * (BOT - G0), 290, 0.25 * (BOT - G0), 'f-soilE', { opacity: 0.55 });
    T(bg, 8, G0 + 0.45 * (BOT - G0) + 16, 'puha, iszapos réteg', 't-sm halo');
    L(bg, 0, G0, 290, G0, 'stroke:var(--soil-line);stroke-width:2');
    T(bg, 8, G0 + 16, 'közepes homok', 't-sm halo');
    // gép
    rigL(bg, XS, G0, { off: 58, top: -12, jib: false }); // a magas árboc a kép fölé nyúlik
    // diagram háttér
    R(bg, CX0, G0, CX1 - CX0, BOT - G0, 'f-surface', { style: 'stroke:var(--line2);stroke-width:1' });
    R(bg, cx(1.0), G0, cx(1.25) - cx(1.0), BOT - G0, 'f-ok', { opacity: 0.12 });
    for (const r of [0, 0.5, 1, 1.5]) { L(bg, cx(r), G0, cx(r), BOT, `stroke:var(--line2);stroke-width:${r === 1 ? 2 : 1}`); T(bg, cx(r), BOT + 15, fmt(r * 100, 0) + ' %', 't-sm', { 'text-anchor': 'middle' }); }
    T(bg, (CX0 + CX1) / 2, G0 - 26, 'betonfogyás / elméleti', 't-lab', { 'text-anchor': 'middle' });
    T(bg, cx(1.12), G0 - 8, 'jó tartomány', 't-sm t-ok', { 'text-anchor': 'middle' });
    const stp = L0 > 16 ? 4 : 2;
    for (let z = 0; z <= L0; z += stp) { L(bg, CX0 - 6, G0 + z * k, CX0, G0 + z * k, 'stroke:var(--ink2)'); T(bg, CX0 - 9, G0 + z * k + 4, `${z}`, 't-sm', { 'text-anchor': 'end' }); }
    T(bg, CX0 - 9, G0 - 8, 'm', 't-sm', { 'text-anchor': 'end' });
  };
  const fresh = () => {
    const L0 = sL.v, n = Math.round(L0 / 0.25);
    st = { phase: 'idle', z: 0, bins: new Array(n).fill(null), n, vol: 0, pmin: Infinity, vmax: 0, tsum: 0 };
    rep.hidden = true; paintBg();
    vd.set('', 'Készen áll a gép.', ' Indítsd a fúrást: a spirál lehajt a végső mélységig, aztán te húzod fel – a betonnyomással és a húzási sebességgel együtt.');
  };
  sD.on(() => { if (st.phase !== 'pull') fresh(); }); sL.on(() => { if (st.phase !== 'pull' && st.phase !== 'drill') fresh(); });
  bGo.addEventListener('click', () => { if (st.phase === 'drill' || st.phase === 'pull') return; fresh(); st.phase = 'drill'; pileNo++; });
  bFast.addEventListener('click', () => { fast = !fast; bFast.setAttribute('aria-pressed', fast); bFast.classList.toggle('on', fast); bFast.textContent = fast ? '×1 normál' : '×4 gyorsítás'; });
  const finish = () => {
    st.phase = 'done';
    const a = A(), L0 = sL.v, Vth = a * L0;
    const bins = st.bins.map((b) => b ?? 0);
    let lo = Infinity, loZ = 0; const necks = [];
    bins.forEach((r, i) => { if (r < lo) { lo = r; loZ = (i + 0.5) * 0.25; } if (r < 1) necks.push(i); });
    let rng = '';
    if (necks.length) { const z1 = necks[0] * 0.25, z2 = (necks[necks.length - 1] + 1) * 0.25; rng = `<span class="nw">${fmt(z1, 2)}–${fmt(z2, 2)} m</span>`; }
    const tot = st.vol / Vth;
    const verdictTxt = necks.length ? ['bad', `NYAKASODÁS GYANÚ · ${rng}`] : tot > 1.4 ? ['warn', 'TÚLZOTT BETONFOGYÁS – vizsgálat javasolt'] : lo < 1.05 ? ['warn', 'MEGFELELŐ – szűk tartalékkal'] : ['ok', 'MEGFELELŐ'];
    rep.hidden = false;
    rep.innerHTML = `<div class="furt-rep-h"><b>Cölöpkészítési jegyzőkönyv</b><span>CFA · C05-${String(pileNo).padStart(3, '0')}</span></div>
      <dl>
        <dt>Átmérő / hossz</dt><dd>${sD.v} cm / ${fmt(L0, 1)} m</dd>
        <dt>Elméleti betontérfogat</dt><dd>${fmt(Vth, 2)} m³</dd>
        <dt>Bedolgozott beton</dt><dd>${fmt(st.vol, 2)} m³ (${fmt(tot * 100, 0)} %)</dd>
        <dt>Legkisebb fogyás</dt><dd>${fmt(lo * 100, 0)} % (${fmt(loZ, 2)} m-en)</dd>
        <dt>Átlagos / legnagyobb húzási sebesség</dt><dd>${fmt(L0 / Math.max(0.01, st.tsum), 2)} / ${fmt(st.vmax, 1)} m/perc</dd>
        <dt>Legkisebb betonnyomás</dt><dd>${fmt(st.pmin, 1)} bar</dd>
      </dl>
      <div class="furt-stamp" data-s="${verdictTxt[0]}">${verdictTxt[1]}</div>`;
    if (necks.length) vd.set('bad', 'Nyakasodás!', ` ${rng} között a spirált gyorsabban húztad, mint ahogy a beton a felszabaduló teret kitöltötte: a talaj a beton helyére nyomódott, a cölöp ott elvékonyodott. Lassíts, vagy növeld a betonnyomást!`);
    else if (tot > 1.4) vd.set('warn', 'Sok beton fogyott.', ' A beton jóval több, mint az elméleti térfogat: túl nagy nyomással a beton a puha rétegbe préselődik. Ez önmagában nem hiba, de a nagy túlfogyást vizsgálni kell (üreg, nagyon puha réteg?).');
    else vd.set('ok', 'Szép munka!', ' A betonáram végig lépést tartott a húzással – a cölöp teljes hosszában legalább az elméleti keresztmetszettel készült, enyhe túlfogyással.');
  };
  const draw = (tt, dt) => {
    const sp = (fast ? 4 : 1) * 0.8; // szimulált perc / valós s
    const L0 = sL.v, k = sc();
    if (st.phase === 'drill') { st.z = Math.min(L0, st.z + dt * 6 * (fast ? 3 : 1)); if (st.z >= L0) st.phase = 'pull'; }
    else if (st.phase === 'pull') {
      const dtm = dt * sp, v = sV.v, q = Q(), a = A();
      const dz = v * dtm;
      const z0 = st.z, z1 = Math.max(0, z0 - dz);
      const r = q / (v * a);
      for (let i = Math.floor(z1 / 0.25); i <= Math.min(st.n - 1, Math.floor((z0 - 1e-9) / 0.25)); i++) st.bins[i] = r;
      st.vol += Math.min(q * dtm, a * (z0 - z1) * 3);
      st.pmin = Math.min(st.pmin, sP.v); st.vmax = Math.max(st.vmax, v); st.tsum += dtm;
      st.z = z1;
      if (st.z <= 0) finish();
    }
    clear(dyn);
    const g = dyn;
    const bw = BWmax * sD.v / 120;
    const xl = XS - bw / 2;
    // kész cölöp (alulról)
    for (let i = 0; i < st.n; i++) {
      const r = st.bins[i]; if (r === null) continue;
      const y = G0 + i * 0.25 * k, hh = 0.25 * k + 0.3;
      const w = r < 1 ? bw * Math.sqrt(Math.max(0.08, r)) : bw * Math.sqrt(Math.min(r, 1.35));
      R(g, XS - w / 2, y, w, hh, r < 1 ? 'f-bad' : 'f-fresh', { opacity: r < 1 ? 0.75 : 1 });
      // diagram oszlop
      R(g, CX0, y, cx(r) - CX0, hh, r < 1 ? 'f-bad' : r > 1.4 ? 'f-warn' : 'f-grp');
    }
    for (const rr of [1, 1.25]) L(g, cx(rr), G0, cx(rr), BOT, `stroke:var(--${rr === 1 ? 'ink' : 'ok'});stroke-width:1.5;stroke-dasharray:${rr === 1 ? '0' : '4 3'};opacity:.7`);
    // furat a spirál felett/alatt
    if (st.phase === 'drill' || st.phase === 'pull') {
      const yb = G0 + st.z * k;
      const yt = yb - L0 * k; // a spirál teteje (a fúrás elején a kép felett van)
      R(g, XS - 4, Math.max(0, yt), 8, yb - Math.max(0, yt), 'f-steel2');
      if (yt - 14 > -14) { L(g, XS - 58, yt - 7, XS - 12, yt - 7, 'stroke:var(--steelm2);stroke-width:6'); R(g, XS - 13, yt - 14, 26, 14, 'f-steel', { rx: 3, style: 'stroke:var(--steelm2);stroke-width:1.2' }); }
      const pitch = 20, ph = (tt * (st.phase === 'drill' ? 60 : 10)) % pitch;
      // a menetek között végig talaj van: fúráskor a terep alatt, húzáskor a kiemelt szakaszon is
      const ys0 = st.phase === 'drill' ? G0 : Math.max(0, yt);
      for (let y = Math.max(0, yt) - pitch + ph; y < yb - 4; y += pitch) {
        if (y + 4 >= ys0) P(g, [[xl + 2, y + 4], [xl + bw - 2, y + 12], [xl + bw - 2, y + 18], [xl + 2, y + 10]], 'fill:color-mix(in srgb, var(--soilA) 62%, var(--soilE))', true);
        L(g, xl + 1, y, xl + bw - 1, y + 8, 'stroke:var(--steelm2);stroke-width:3;stroke-linecap:round');
      }
      if (st.phase === 'pull' && sP.v > 0) { const kk = (tt * 3) % 1; ar(g, XS, yb - 30 + kk * 20, XS, yb - 6 + kk * 14, 'var(--surface)', 2, 6); }
      // aktuális sor a diagramon
      L(g, CX0, yb, CX1, yb, 'stroke:var(--ink);stroke-width:1;stroke-dasharray:3 3');
      if (st.phase === 'pull') { const r = Q() / (sV.v * A()); C(g, cx(r), yb, 6, r < 1 ? 'f-bad' : 'f-ok', { style: 'stroke:var(--surface);stroke-width:2' }); }
    }
    T(g, XS, BOT + 16, `Ø ${sD.v} cm · ${fmt(L0, 0)} m`, 't-sm', { 'text-anchor': 'middle' });
    // kimenetek
    const q = Q(), r = q / (sV.v * A());
    oZ.set(st.z, null);
    oQ.set(q * 60, null);
    oR.set(r * 100, r < 1 ? 'bad' : r < 1.05 || r > 1.4 ? 'warn' : 'ok', fmt(r * 100, 0));
    oV.set(st.vol, null, fmt(st.vol, 2));
    if (st.phase === 'pull') {
      if (r < 1) vd.set('bad', 'Vigyázz – nyakasodik!', ` Most ${fmt(r * 100, 0)} %: kevesebb beton érkezik, mint amennyi teret a spirál felszabadít. Lassíts, vagy adj több nyomást!`);
      else if (r > 1.4) vd.set('warn', 'Sok a beton.', ' A beton a talajba préselődik – pazarló, és megemelheti a környezetet. Csökkentsd a nyomást, vagy húzz kicsit gyorsabban.');
      else vd.set('ok', 'Jó ütem.', ` A betonáram lépést tart a húzással (${fmt(r * 100, 0)} %). Tartsd így a felszínig!`);
    } else if (st.phase === 'drill') vd.set('', 'Fúrás…', ' A spirál lehajt; a furadék a meneteken marad, és megtámasztja a falat. A betonozónyílás zárólapja zárva.');
  };
  fresh();
  loop(root, (tt, dt) => draw(tt, dt));
  draw(0, 0);
  onTheme(paintBg);
});

/* ================================================================== 5. Technológiaválasztó */
const PICK_SOIL = [
  { v: 'kot', t: 'kötött (agyag, iszap)' },
  { v: 'szem', t: 'szemcsés (homok, kavics)' },
  { v: 'laza', t: 'laza, folyós vagy iszapos rétegekkel' },
  { v: 'felt', t: 'felül törmelékes feltöltés' },
  { v: 'kem', t: 'kemény réteg, puhább kőzet' },
];
function pickEval(o) {
  const { soil, gw, D, L0, vib, fast, big } = o;
  const res = [];
  // CFA
  {
    const r = { id: 'cfa', t: 'CFA (folyamatos spirál)', s: 3, why: [], out: null, href: '#furt-cfa' };
    if (D > 120) r.out = 'legfeljebb 120 cm átmérő'; else r.why.push(['ok', `Ø ${D} cm: a 40–120 cm-es tartományban`]);
    if (L0 > 24) r.out = r.out || 'legfeljebb 22–24 m hosszú'; else if (L0 > 22) { r.s -= 1; r.why.push(['warn', 'hossz a 22–24 m-es felső határon']); } else if (L0 < 6) { r.s -= 0.5; r.why.push(['warn', 'nagyon rövid cölöp – a szokásos hossz 6–22 m']); } else r.why.push(['ok', `${L0} m: belefér a 6–22 m-be`]);
    if (soil === 'laza') { r.s -= 2.5; r.why.push(['bad', 'laza, folyós talajba nem javasolt']); }
    if (soil === 'felt') { r.s -= 0.5; r.why.push(['warn', 'a feltöltést felül markolással érdemes átfúrni']); }
    if (soil === 'kem') r.why.push(['warn', 'kemény rétegben speciális fúrófej kell']);
    if (fast) { r.s += 1; r.why.push(['ok', 'gyors, egyszerű gépészet']); }
    if (vib) { r.s += 1; r.why.push(['ok', 'zaj- és rezgésszegény']); }
    if (big) { r.s -= 0.5; r.why.push(['warn', 'nagy teherbírásnál a nagy átmérőjű cölöp előnyösebb lehet']); }
    r.why.push(['ok', 'automata monitorozás, jegyzőkönyv']);
    res.push(r);
  }
  // köpenycsöves
  {
    const r = { id: 'kop', t: 'Köpenycsöves (béléscsöves)', s: 2.5, why: [], out: null, href: '#furt-kopeny' };
    if (D < 80) r.out = 'legalább 80 cm átmérő'; else r.why.push(['ok', `Ø ${D} cm: a 80–150 (350) cm-es tartományban`]);
    if (L0 < 15) { r.s -= 1; r.why.push(['warn', 'rövid cölöphöz összetett, lassú technológia']); } else r.why.push(['ok', `${L0} m: belefér a 15–100 m-be`]);
    if (soil === 'laza') { r.s += 1.5; r.why.push(['ok', 'különösen kedvezőtlen, iszapos talajban is biztonságos']); }
    if (gw && (soil === 'szem' || soil === 'laza')) r.why.push(['warn', 'a cső járjon a kiemelés előtt, a vizet pótolni kell']);
    if (big) { r.s += 1; r.why.push(['ok', 'nagy teherbírás']); }
    if (fast) { r.s -= 1; r.why.push(['warn', 'lassabb fúrási sebesség']); }
    if (vib) r.why.push(['warn', 'a csövet forgatással mozgassák, ne vibrálással']);
    r.why.push(['warn', 'összetett gépészet']);
    res.push(r);
  }
  // zagyos
  {
    const r = { id: 'k_zagy', t: 'Bentonitzagyos', s: 2.5, why: [], out: null, href: '#furt-zagy' };
    if (D < 80) r.out = 'legalább 80 cm átmérő'; else r.why.push(['ok', `Ø ${D} cm: a 80–150 (350) cm-es tartományban`]);
    if (L0 < 15) { r.s -= 1; r.why.push(['warn', 'rövid cölöphöz összetett technológia']); } else r.why.push(['ok', `${L0} m: belefér a 15–100 m-be`]);
    if (L0 > 30) { r.s += 1; r.why.push(['ok', 'nagy mélységben a gép kapacitása nem korlát']); }
    if (soil === 'laza') { r.s += 0.5; r.why.push(['ok', 'bármely talajban alkalmazható']); }
    if (big) { r.s += 1; r.why.push(['ok', 'nagy teherbírás']); }
    if (fast) { r.s -= 1; r.why.push(['warn', 'lassabb, zagytelep kell']); } else r.why.push(['warn', 'zagykeverő és -tisztító telep kell']);
    res.push(r);
  }
  // megtámasztás nélküli
  {
    const r = { id: 'nel', t: 'Megtámasztás nélküli furat', s: 3.5, why: [], out: null, href: '#furt-nelkul' };
    if (soil !== 'kot') r.out = 'csak kötött talajban'; else r.why.push(['ok', 'kötött talaj']);
    if (gw) r.out = r.out || 'elsősorban talajvíz felett'; else r.why.push(['ok', 'nincs talajvíz']);
    if (L0 > 10) r.out = r.out || 'legfeljebb 8–10 m mély'; else if (L0 > 8) { r.s -= 1; r.why.push(['warn', 'a 8–10 m-es határon – azonnal betonozni']); } else r.why.push(['ok', `${L0} m ≤ 8 m${L0 <= 6 ? ' (markolt tömbalap, kútalap)' : ''}`]);
    if (big) { r.s -= 1; r.why.push(['warn', 'nagy teherbíráshoz rövid']); }
    r.why.push(['ok', 'egyszerű, olcsó']);
    res.push(r);
  }
  const ins = res.filter((r) => !r.out).sort((a, b) => b.s - a.s);
  const best = ins[0]?.s;
  for (const r of res) r.lab = r.out ? ['bad', 'Nem alkalmas'] : r.s === best ? ['ok', 'Ajánlott'] : r.s >= best - 1 ? ['warn', 'Szóba jöhet'] : ['warn', 'Kevésbé előnyös'];
  return [...ins, ...res.filter((r) => r.out)];
}
register('furtPick', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sS = select(ctrls, { label: 'Talaj', options: PICK_SOIL, value: 'szem' });
  const sGw = toggle(ctrls, { label: 'Talajvíz a cölöp hosszán', value: true });
  const sD = slider(ctrls, { label: 'Átmérő', min: 40, max: 180, step: 10, value: 60, unit: 'cm', d: 0 });
  const sL = slider(ctrls, { label: 'Cölöphossz', min: 4, max: 50, step: 1, value: 14, unit: 'm', d: 0 });
  const tV = toggle(ctrls, { label: 'Rezgés- és zajérzékeny környezet', value: true });
  const tF = toggle(ctrls, { label: 'Szoros határidő', value: false });
  const tB = toggle(ctrls, { label: 'Nagy teherbírási igény', value: false });
  out.remove();
  const list = h('div', { class: 'furt-pick' }); viz.append(list);
  const draw = () => {
    const rs = pickEval({ soil: sS.v, gw: sGw.v, D: sD.v, L0: sL.v, vib: tV.v, fast: tF.v, big: tB.v });
    clear(list);
    for (const r of rs) {
      const row = h('a', { class: 'furt-pk' + (r.out ? ' off' : ''), href: r.href },
        h('span', { class: 'furt-pk-n' }, r.t),
        h('span', { class: 'chip ' + r.lab[0] }, r.lab[1]),
        h('span', { class: 'furt-pk-bar' }, h('i', { style: { width: (r.out ? 0 : clamp(r.s / 5.5, 0.05, 1) * 100) + '%' } })),
        h('span', { class: 'furt-pk-why', html: r.out ? `<em class="t-bad">✗ ${r.out}</em>` : r.why.map(([s, t]) => `<span class="${s}">${s === 'ok' ? '✓' : s === 'bad' ? '✗' : '!'} ${t}</span>`).join('') }));
      list.append(row);
    }
  };
  [sS, sGw, sD, sL, tV, tF, tB].forEach((c) => c.on(draw));
  draw();
});

/* ================================================================== Kvíz */
defineQuiz('furt', 'Kvíz – fúrt cölöpök', [
  { q: 'Mi támasztja meg a furat falát CFA-cölöp készítésekor?', a: ['A spirálon maradó talajdugó', 'Bentonitzagy', 'Acél béléscső', 'Semmi – a betont azonnal bejuttatják'], c: 0, e: 'Lehajtás közben a furadék csak részben nyomódik ki, a spirálon maradó talajdugó folyamatosan támasztja a falat – külön technológia nem kell.' },
  { q: 'Szemcsés talajban hogyan kell a béléscsövet mélyíteni?', a: ['A földkiemelés előtt kell járnia', 'Elég a kiemelés után, ha már látszik a talajvíz', 'Csak a talajvízszint alatt kell', 'Mindegy, a cső a végén úgyis megtámaszt'], c: 0, e: 'Ha a kiemelés megelőzi a csövet, a cső alatti szabad falszakasz beomlik, a talaj befolyik, a környezet fellazul.' },
  { q: 'Mi történik, ha talajvíz alatt a béléscsőben alacsonyabban áll a víz, mint kint?', a: ['A talpon betör a talajvíz, és fellazítja a talajt', 'A cső felúszik', 'A beton gyorsabban köt meg', 'Semmi, a cső vízzáró'], c: 0, e: 'A vízszintkülönbség felfelé irányuló áramlást indít a talpon (felbuzgás): a víz magával ragadja a szemcséket. Ezért a furatban pótolni kell a kiemelt vizet.' },
  { q: 'Mikor alkalmazható megtámasztás nélküli furat?', a: ['Kötött talajban, elsősorban talajvíz felett, nem túl hosszú (kb. 8–10 m-es) furatnál', 'Szemcsés talajban, ha a talajvíz mélyen van, legfeljebb 20 m-ig', 'Bármely talajban, ha gyorsan betonozunk', 'Laza homokban, talajvíz alatt, ha a furat rövid'], c: 0, e: 'Kötött talajban, elsősorban talajvíz felett, nem túl hosszú furatnál rövid ideig megtámasztás nélkül is állékony maradhat – de a kiemelés után rögtön ki kell betonozni.' },
  { q: 'Miért nem kell a CFA-cölöp betonját vibrálni?', a: ['A folyós konzisztencia és a nyomás alatti bedolgozás öntömörödést biztosít', 'Mert a CFA-cölöp vasalatlan', 'Mert a spirál forgása tömöríti', 'Mert a talajdugó összenyomja'], c: 0, e: 'A betont a fúrószáron át, túlnyomással pumpálják: a folyós beton és a nyomás együtt tömörít.' },
  { q: 'Mi a nyakasodás egy CFA-cölöpnél?', a: ['Elvékonyodás, ha a spirált gyorsabban húzzák, mint ahogy a beton a teret kitölti', 'A cölöpfej megvastagodása a túlbetonozástól', 'A vasalási armatúra felúszása a friss betonban', 'A fúrószár elhajlása kemény rétegben'], c: 0, e: 'Ha a betonáram nem tart lépést a húzással, a talaj a beton helyére nyomódik. A gépek ezért folyamatosan mérik a betonnyomást és a betonmennyiséget.' },
  { q: 'Melyik technológia NEM alkalmas egy 150 cm átmérőjű cölöphöz?', a: ['CFA', 'Köpenycsöves fúrt cölöp', 'Bentonitzagyos fúrt cölöp'], c: 0, e: 'A CFA-cölöp átmérője 40–120 cm; a köpenycsöves és a zagyos cölöp 80–150 (350) cm-es átmérővel készül.' },
  { q: 'Kontraktorcsöves betonozásnál mi a legfontosabb szabály?', a: ['A cső vége végig a friss betonba merüljön', 'A cső végét a betonozás elején ki kell emelni a zagyból', 'A betont a cső tetejéről a zagyra kell önteni', 'A zagyot betonozás előtt le kell szivattyúzni a furatból'], c: 0, e: 'Ha a cső vége kiemelkedik, az új beton a zagyon át hullik, keveredik vele, és zagyzárvány – folytonossági hiány – keletkezik.' },
  { q: 'Miért veszélyes a furat talpán maradt fellazult, leülepedett talaj?', a: ['Jelentősen csökkentheti a talpellenállást', 'Növeli a köpenysúrlódást', 'Megakadályozza a vasalás behelyezését', 'Nincs jelentősége, a beton kiszorítja'], c: 0, e: 'A cölöp talpa a fellazult rétegen ül – a talpellenállás jelentősen kisebb lehet a tervezettnél.' },
  { q: 'Melyik talajkiemelő eszköz való elsősorban szemcsés talajhoz?', a: ['Dobfúró', 'Rövid spirál', 'Csavart fúrófej'], c: 0, e: 'A dobfúró a szemcsés talajt a dobban viszi ki; a rövid spirál elsősorban kötött talajhoz való, a csavart fúrófej pedig nem kiemel, hanem kiszorít.' },
]);
