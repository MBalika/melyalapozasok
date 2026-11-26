// C06 – Egyéb cölöpök: mikrocölöp (aláfogás), jet-grouting (oszlopgyár), mélykeverés, kavicscölöp
import { register, shell, slider, seg, toggle, stat, verdict, h, svg, figure, clear, fmt, clamp, lerp, smooth, cssVar, onTheme, loop, pathD } from './core.js';
import { defineQuiz } from './ui.js';
import { underpinScene } from './proc.js';

/* ------------------------------------------------------------------ segédek */
const txt = (p, x, y, t, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text: t, ...o }, p);
// alsó indexes SVG-felirat: stxt(g, x, y, 'c', 'u', ' = 10 kPa')
function stxt(p, x, y, base, sub, rest = '', cls = 't-lab', o = {}) {
  const t = svg('text', { x, y, class: cls, ...o }, p);
  svg('tspan', { text: base }, t);
  // alsó index dy-nal (a baseline-shift nem minden böngészőben működik); a záró, nulla szélességű tspan visszaemeli az alapvonalat
  svg('tspan', { text: sub, dy: '0.3em', 'font-size': '72%' }, t);
  svg('tspan', { text: '\u200b', dy: '-0.3em', 'font-size': '72%' }, t);
  if (rest) svg('tspan', { text: rest }, t);
  return t;
}
// színes nyíl (a fej is színes)
function carrow(p, x1, y1, x2, y2, col, w = 2, hd = 7) {
  const g = svg('g', { style: `color:${col}` }, p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  svg('line', { x1, y1, x2: x2 - Math.cos(a) * hd * 0.7, y2: y2 - Math.sin(a) * hd * 0.7, stroke: 'currentColor', 'stroke-width': w, 'stroke-linecap': 'round' }, g);
  svg('path', { d: pathD([[x2, y2], [x2 - Math.cos(a - 0.45) * hd, y2 - Math.sin(a - 0.45) * hd], [x2 - Math.cos(a + 0.45) * hd, y2 - Math.sin(a + 0.45) * hd]], true), fill: 'currentColor' }, g);
  return g;
}
// keskeny (mobil) nézet: a widget ábráját másképp vágjuk/rendezzük; onChange(narrow) újrarajzol
function watchNarrow(el, lim, onChange) {
  let cur = null;
  const chk = () => { const n = (el.clientWidth || 999) < lim; if (n !== cur) { cur = n; onChange(n); } };
  new ResizeObserver(chk).observe(el);
  return { get v() { if (cur === null) cur = (el.clientWidth || 999) < lim; return cur; } };
}
const MONO = () => cssVar('--f-mono') || 'monospace';
const nb = (s) => s.replace(/ (kN|kPa|m|cm|mm|bar|%|kNm²|kN\/m²)(?=$|[\s.,;:)])/g, ' $1');
// lépésgombok + szöveg + lejátszás (közös a stepperhez)
function stepper(ctrls, steps, onStep) {
  const box = h('div', { class: 'stepbtns', role: 'tablist', 'aria-label': 'Lépések' });
  const btns = steps.map((s, i) => { const b = h('button', { type: 'button', role: 'tab' }, `${i + 1}. ${s.k}`); b.addEventListener('click', () => go(i, true)); box.append(b); return b; });
  const text = h('div', { class: 'steptext' });
  const prev = h('button', { class: 'btn btn-line btn-sm', type: 'button' }, '← Előző');
  const next = h('button', { class: 'btn btn-line btn-sm', type: 'button' }, 'Következő →');
  const play = h('button', { class: 'btn btn-line btn-sm', type: 'button' }, '▶ Lejátszás');
  ctrls.append(box, text, h('div', { class: 'play-row' }, prev, next, play));
  let cur = 0, timer = 0;
  const stopPlay = () => { clearInterval(timer); timer = 0; play.textContent = '▶ Lejátszás'; };
  function go(i, user = false) {
    if (user) stopPlay();
    cur = clamp(i, 0, steps.length - 1);
    btns.forEach((b, k) => { b.classList.toggle('on', k === cur); b.setAttribute('aria-selected', k === cur); });
    text.innerHTML = `<b>${steps[cur].t}</b>${steps[cur].d}`;
    prev.disabled = cur === 0; next.disabled = cur === steps.length - 1;
    onStep(cur);
  }
  prev.addEventListener('click', () => go(cur - 1, true));
  next.addEventListener('click', () => go(cur + 1, true));
  play.addEventListener('click', () => {
    if (timer) { stopPlay(); return; }
    if (cur === steps.length - 1) go(0);
    play.textContent = '❚❚ Megállítás';
    timer = setInterval(() => { if (cur >= steps.length - 1) { stopPlay(); return; } go(cur + 1); }, 4200);
  });
  go(0);
  return { go, get cur() { return cur; } };
}

/* ================================================================== 1. ALÁFOGÁS MIKROCÖLÖPPEL */
const AF_STEPS = [
  { k: 'Állapot', t: 'Kiinduló állapot', d: 'A régi falazott fal sávalapja túlterhelt: a puha rétegen nagy a talp alatti feszültség, a fal megsüllyedt és megrepedt – vagy ráépítés jön, ami még több terhet hozna. A teherbíró réteg mélyebben van.' },
  { k: 'Fúrás', t: 'Fúrás a pincéből és kívülről', d: 'A kis fúrógép befér a pincébe: onnan ferdén, a meglévő alaptesten át fúrnak le a teherbíró rétegig. A következő cölöpöt kívülről, a terepszintről fúrják, ellentétes dőléssel, szintén az alaptesten át. A cölöpök így keresztezik egymást, a fal mentén felváltva, egymáshoz képest eltolva készülnek. Nincs verés, nincs rezgés – a ház lakott maradhat.' },
  { k: 'Injektálás', t: 'Betét és injektálás', d: 'A furatba acélbetét kerül (vagy az üreges fúrórúd marad bent), a habarcsot alulról felfelé injektálják. A teherbíró rétegben kialakul a cementtest és az átitatott, érdes köpeny.' },
  { k: 'Bekötés', t: 'Bekötés az alapba', d: 'A cölöp felső szakasza a meglévő alaptestben injektálva kötődik a régi szerkezethez (szükség esetén új vasbeton fejgerendával). Gyakran sajtóval elő is terhelik, hogy a teher azonnal átkerüljön.' },
  { k: 'Teher', t: 'Teherátadás', d: 'A fal terhét a mikrocölöpök a köpenyükön adják át a teherbíró rétegnek – a talpellenállással nem számolunk. A régi talp alatti feszültség lecsökken, a süllyedés megáll; a pinceszint akár le is mélyíthető.' },
];
register('egy-alafogas', (root) => {
  const { ctrls, viz, out } = shell(root, { foot: '<b>Szemléltető ábra</b>, torzított léptékkel: a valóságban a mikrocölöpök jellemzően 6–15 m hosszúak, a fal mentén sűrű kiosztásban, felváltva a pincéből és kívülről, keresztező dőléssel készülnek. A teher megoszlása a talp és a cölöpök között az előterheléstől és a további süllyedéstől függ.' });
  const fig = figure(viz, 720, 430);
  fig.setAttribute('aria-label', 'Metszet: régi fal sávalappal, pince, puha réteg és mélyebb teherbíró réteg; a mikrocölöpök felváltva a pincéből és kívülről, ferdén, az alaptesten át készülnek, keresztezik egymást');
  const sTalp = stat(out, { label: 'Teher a régi talpon', unit: '%', d: 0 });
  const sPile = stat(out, { label: 'Teher a mikrocölöpökön', unit: '%', d: 0 });
  const sRes = stat(out, { label: 'Ami a cölöpben dolgozik' });

  // geometria

  let step = 0, t0 = 0, anim = 1;
  const NW = watchNarrow(viz, 560, () => draw());
  const draw = () => {
    const nar = NW.v, k = smooth(anim);
    fig.classList.toggle('egy-sm', nar);
    const pileShare = step >= 4 ? 0.8 * k : step === 3 ? 0.35 * k : 0;
    const talpShare = 1 - pileShare;
    underpinScene(fig, { step, k, nar, anim, talp: talpShare });
    sTalp.set(talpShare * 100, step >= 4 ? 'ok' : step === 0 ? 'bad' : null);
    sPile.set(pileShare * 100, step >= 4 ? 'ok' : null);
    sRes.set(step >= 4 ? 'köpeny (talp ≈ 0)' : step >= 2 ? 'köpeny – kialakulóban' : '–', step >= 4 ? 'ok' : null);
  };
  const ani = loop(fig, (t) => {
    if (anim >= 1) return;
    if (!t0) t0 = t;
    anim = clamp((t - t0) / 1.4, 0, 1);
    draw();
  });
  void ani;
  stepper(ctrls, AF_STEPS, (i) => { step = i; t0 = 0; anim = i === 0 ? 1 : 0; draw(); });
});

/* ================================================================== 3. JET-OSZLOPGYÁR */
const JET_SOIL = {
  k_kavics: { t: 'Kavics', D: [0.8, 2.0], col: '--soilD', grain: 2.6 },
  k_homok: { t: 'Homok', D: [0.7, 1.6], col: '--soilA', grain: 1.5 },
  k_iszap: { t: 'Iszap', D: [0.45, 1.0], col: '--soilC', grain: 1.0 },
  k_agyag: { t: 'Agyag', D: [0.45, 0.9], col: '--soilB', grain: 0.7 },
};
const JET_VAR = {
  szimpla: { t: 'Szimpla', f: 0.25, water: false, air: false },
  levegos: { t: 'Levegős dupla', f: 0.6, water: false, air: true },
  vizes: { t: 'Vizes dupla', f: 0.55, water: true, air: false },
  tripla: { t: 'Tripla', f: 0.9, water: true, air: true },
};
function jetCalc(soil, vr, p, v, n) {
  const S = JET_SOIL[soil], V = JET_VAR[vr];
  const fp = clamp((p - 250) / 200, 0, 1);
  const fs = 0.8 + 0.4 * clamp((60 - v) / 50, 0, 1);
  const f = clamp(V.f * (0.55 + 0.45 * fp) * fs, 0, 1);
  const D = S.D[0] + (S.D[1] - S.D[0]) * f;
  const dz = v / n; // cm / fordulat
  return { D, dz, gaps: dz > 4 };
}
register('egy-jet', (root) => {
  const { ctrls, viz, out } = shell(root, { foot: '<b>Szemléltető modell.</b> Az átmérőt a talaj, a változat, a nyomás és az emelési sebesség alapján a jellemző tartományokba (szimpla jetnél agyagban 50–70 cm, homokban 80–100 cm, dupla jetnél kb. 120 cm) skáláztuk. A valós átmérőt a helyszínen próbaoszlopokkal, kibontással ellenőrzik.' });
  const soil = seg(ctrls, { label: 'Talaj', options: Object.entries(JET_SOIL).map(([v, s]) => ({ v, t: s.t })), value: 'k_homok' });
  const vr = seg(ctrls, { label: 'Változat', options: Object.entries(JET_VAR).map(([v, s]) => ({ v, t: s.t })), value: 'szimpla' });
  const pr = slider(ctrls, { label: 'Nyomás', sym: 'p', min: 250, max: 450, step: 10, value: 380, unit: 'bar', d: 0, hint: 'a jellemző injektálási nyomás 350–400 bar' });
  const sp = slider(ctrls, { label: 'Felhúzási sebesség', sym: 'v', min: 10, max: 60, step: 1, value: 30, unit: 'cm/perc', d: 0, hint: 'jellemzően 25–35 cm/perc' });
  const rpm = slider(ctrls, { label: 'Fordulatszám', sym: 'n', min: 5, max: 25, step: 1, value: 12, unit: '1/perc', d: 0 });
  const ss = slider(ctrls, { label: 'Oszloptávolság a falban', sym: 's', min: 0.3, max: 2.4, step: 0.05, value: 0.6, unit: 'm', d: 2 });
  const blk = toggle(ctrls, { label: 'a visszafolyó cementhabarcs útja elzáródik', value: false });

  const cv = h('canvas', { class: 'fig egy-cv', role: 'img', 'aria-label': 'Bal oldalt a jet-oszlop készítése oldalnézetben, jobb oldalt az átfedéses oszlopfal felülnézetben' });
  viz.append(cv);
  viz.append(h('div', { class: 'legend' },
    h('span', {}, h('i', { style: { background: 'var(--grout)' } }), 'talajbeton (jet-oszlop)'),
    h('span', {}, h('i', { style: { background: 'var(--water)' } }), 'vízsugár'),
    h('span', {}, h('i', { style: { background: 'var(--sky)' } }), 'levegőburok'),
    h('span', {}, h('i', { style: { background: 'var(--bad)' } }), 'rés a falban')));
  const sD = stat(out, { label: 'Oszlopátmérő <i>D</i>', unit: 'm', d: 2 });
  const sDz = stat(out, { label: 'Emelés fordulatonként', unit: 'cm', d: 1 });
  const sT = stat(out, { label: 'Falvastagság az átfedésnél <i>t</i>' });
  const sN = stat(out, { label: 'Oszlop 10 m falhoz', unit: 'db', d: 0 });
  const vd = verdict(viz);

  const C = {};
  const cols = () => { for (const k of ['--soilA', '--soilB', '--soilC', '--soilD', '--grout', '--water', '--sky', '--ink', '--muted', '--bad', '--ok', '--steelm2', '--surface', '--line2', '--warn', '--surface2', '--fresh']) C[k] = cssVar(k); };
  cols();
  let st = null, phase = 4.5, heave = 0;
  const upd = () => {
    const R = jetCalc(soil.v, vr.v, pr.v, sp.v, rpm.v);
    const s = ss.v, D = R.D;
    const t = s < D ? 2 * Math.sqrt((D / 2) ** 2 - (s / 2) ** 2) : 0;
    sD.set(D, null, `${fmt(D * 0.9, 2)}–${fmt(D * 1.1, 2)}`);
    sDz.set(R.dz, R.gaps ? 'warn' : null);
    sT.set(t, t <= 0 ? 'bad' : t < 0.3 ? 'warn' : 'ok', t <= 0 ? 'rés!' : fmt(t, 2) + '<small>m</small>');
    sN.set(Math.ceil(10 / s) + 1);
    if (blk.v) vd.set('bad', 'Hidraulikus talajtörés veszélye', 'A visszafolyó cementhabarcs nem tud a furat mentén a felszínre távozni: a 350–400 bar-os sugár nyomása a talajban halmozódik. A talaj felreped, a felszín – és a szomszéd épület – megemelkedhet. Az iszap kiáramlását végig figyelni kell!');
    else if (t <= 0) vd.set('bad', 'Rés marad a falban', `Az oszloptávolság (${fmt(s, 2)} m) nem kisebb az átmérőnél (kb. ${fmt(D, 2)} m): az oszlopok nem metszik egymást, a fal nem vízzáró. Sűrítsd a kiosztást, vagy növeld az átmérőt.`.replace(/ m\b/g, ' m'));
    else if (t < 0.3) vd.set('warn', 'Vékony átfedés – kockázatos', `Az átfedésnél csak kb. ${fmt(t, 2)} m vastag a fal. 1 % fúrási ferdeség 10 m mélyen már 10 cm eltérés – mélyebben könnyen rés nyílhat.`.replace(/ (m|cm)\b/g, ' $1'));
    else if (R.gaps) vd.set('warn', 'Csavarvonalas hibák', `Fordulatonként ${fmt(R.dz, 1)} cm emelés túl sok: a sugár nem „söpri végig” a teljes palástot, az oszlopban csavarvonal mentén kezeletlen talaj maradhat. Lassíts, vagy forgass gyorsabban.`.replace(/ cm\b/g, ' cm'));
    else vd.set('ok', 'Zárt, átfedéses jet-fal', `Kb. ${fmt(D, 2)} m-es oszlopok ${fmt(s, 2)} m-enként: az átfedésnél kb. ${fmt(t, 2)} m vastag, folytonos fal.`.replace(/ m\b/g, ' m').replace(/ m-/g, ' m-'));
    return { R, t };
  };
  let S = upd();
  [soil, vr, pr, sp, rpm, ss, blk].forEach((c) => c.on(() => { S = upd(); if (!blk.v) heave = 0; draw(); }));

  // vászonfelirat a kártya színével rajzolt hátlapon (a talajmintán is olvasható, sötét témában megfordul)
  const chip = (s, x, y, align) => {
    const ctx = st.ctx;
    ctx.font = `700 12px ${MONO()}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    const tw = ctx.measureText(s).width, x0 = align === 'center' ? x - tw / 2 : x;
    ctx.globalAlpha = 0.9; ctx.fillStyle = C['--surface']; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0 - 5, y - 13, tw + 10, 18, 5); else ctx.rect(x0 - 5, y - 13, tw + 10, 18); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = C['--ink']; ctx.fillText(s, x, y);
  };
  const draw = () => {
    if (!st || !st.w || st.w < 200) return;
    const { ctx, w, h: HH, narrow } = st;
    const R = S.R, D = R.D, so = JET_SOIL[soil.v], V = JET_VAR[vr.v];
    ctx.clearRect(0, 0, w, HH);
    const split = narrow ? w : Math.round(w * 0.42), H = narrow ? Math.round(HH * 0.6) : HH;
    // ---------------- oldalnézet
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, split, H); ctx.clip();
    const gy = H * 0.14 - heave * H * 0.035, bot = H * 0.93;
    ctx.fillStyle = C['--surface2']; ctx.fillRect(0, 0, split, H);
    ctx.fillStyle = C[so.col];
    ctx.beginPath(); ctx.moveTo(0, H * 0.14);
    if (heave > 0) { ctx.lineTo(split * 0.15, H * 0.14); ctx.quadraticCurveTo(split * 0.5, gy - heave * H * 0.05, split * 0.85, H * 0.14); }
    ctx.lineTo(split, H * 0.14); ctx.lineTo(split, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C['--ink']; ctx.globalAlpha = 0.17;
    for (let i = 0; i < 260; i++) { const y = H * 0.16 + ((i * 41.7) % (H * 0.82)); ctx.beginPath(); ctx.arc((i * 97.3) % split, y, so.grain, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    const cx = split * 0.5;
    const pxm = (split * 0.86) / 2.1;
    const T = 9 * Math.sqrt(30 / sp.v); // egy oszlop ideje, s
    const u = (phase % T) / T;
    const drill = 0.16, rise = 0.86;
    const top = H * 0.2;
    let my; // monitor helye
    if (u < drill) my = lerp(top - H * 0.08, bot, u / drill);
    else if (u < rise) my = lerp(bot, top, (u - drill) / (rise - drill));
    else my = top;
    const colTop = u < drill ? bot : my;
    const half = (D * pxm) / 2;
    // a tervezett oszlop körvonala
    ctx.setLineDash([5, 5]); ctx.strokeStyle = C['--ink']; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - half, top, 2 * half, bot - top); ctx.setLineDash([]); ctx.globalAlpha = 1;
    // kész oszlop (alulról a monitorig)
    if (colTop < bot) {
      ctx.fillStyle = C['--grout'];
      ctx.beginPath();
      const steps = 30;
      for (let i = 0; i <= steps; i++) { const y = lerp(colTop, bot, i / steps); const wob = 1 + 0.06 * Math.sin(y * 0.09 + so.grain) * (soil.v === 'k_kavics' ? 1.6 : 1); ctx.lineTo(cx - half * wob, y); }
      for (let i = steps; i >= 0; i--) { const y = lerp(colTop, bot, i / steps); const wob = 1 + 0.06 * Math.sin(y * 0.11 + 1.3) * (soil.v === 'k_kavics' ? 1.6 : 1); ctx.lineTo(cx + half * wob, y); }
      ctx.closePath(); ctx.fill();
      // csavarvonalas hibák
      if (R.gaps) {
        ctx.save(); ctx.clip();
        ctx.strokeStyle = C[so.col]; ctx.lineWidth = Math.min(10, (R.dz - 4) * 3 + 3);
        const pitch = clamp(R.dz * 5, 18, 60);
        for (let y = colTop - 40; y < bot + 40; y += pitch) { ctx.beginPath(); ctx.moveTo(cx - half - 4, y); ctx.lineTo(cx + half + 4, y + pitch * 0.45); ctx.stroke(); }
        ctx.restore();
      }
    }
    // fúrórúd
    ctx.fillStyle = C['--steelm2'];
    ctx.fillRect(cx - 4, gy - H * 0.12, 8, my - gy + H * 0.12);
    // fúrógép-árboc
    ctx.fillRect(cx - 9, 0, 6, gy); ctx.fillRect(cx + 3, 0, 6, gy);
    ctx.fillRect(cx - 14, gy - 10, 28, 10);
    // monitor + sugarak
    ctx.fillStyle = C['--ink']; ctx.fillRect(cx - 6, my - 10, 12, 20);
    if (u >= drill && u < rise) {
      const ang = phase * rpm.v * 2 * Math.PI / 60 * 3; // gyorsított forgás a láthatóságért
      const dir = Math.cos(ang);
      const L = half * Math.abs(dir) + 2, sg = dir >= 0 ? 1 : -1;
      if (V.air) { ctx.strokeStyle = C['--sky']; ctx.lineWidth = 12; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.moveTo(cx + sg * 6, my - (V.water ? 6 : 0)); ctx.lineTo(cx + sg * (6 + L), my - (V.water ? 6 : 0)); ctx.stroke(); ctx.globalAlpha = 1; }
      if (V.water) { ctx.strokeStyle = C['--water']; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(cx + sg * 6, my - 6); ctx.lineTo(cx + sg * (6 + L), my - 6); ctx.stroke(); }
      ctx.strokeStyle = C['--fresh']; ctx.lineWidth = 4;
      const gyj = V.water ? my + 7 : my;
      const sg2 = V.water ? -sg : sg; const L2 = V.water ? half * 0.55 * Math.abs(dir) + 2 : L;
      ctx.beginPath(); ctx.moveTo(cx + sg2 * 6, gyj); ctx.lineTo(cx + sg2 * (6 + L2), gyj); ctx.stroke();
      // visszafolyó iszap a rúd mentén
      if (!blk.v) {
        ctx.fillStyle = C['--fresh'];
        for (let i = 0; i < 10; i++) { const yy = my - ((phase * 60 + i * 23) % Math.max(10, my - gy)); ctx.beginPath(); ctx.arc(cx + (i % 2 ? 7 : -7), yy, 2.2, 0, 7); ctx.fill(); }
        ctx.beginPath(); ctx.ellipse(cx, gy, 30, 4, 0, 0, 7); ctx.fill();
      }
    }
    if (blk.v && heave > 0.2) {
      ctx.strokeStyle = C['--bad']; ctx.lineWidth = 2;
      for (const [x0, a] of [[0.25, 1], [0.7, -1], [0.45, 1]]) { ctx.beginPath(); let x = split * x0, y = H * 0.15; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += a * 6; y += 9; ctx.lineTo(x + (k % 2 ? 4 : -4), y); } ctx.stroke(); }
    }
    chip(u < drill ? '1 · fúrás' : u < rise ? '2 · injektálás' : '3 · kész oszlop', 8, 20, 'left');
    chip('D ≈ ' + fmt(D, 2).replace(' ', '') + '\u00A0m', cx, bot + 15 > H - 5 ? H - 7 : bot + 15, 'center');
    ctx.restore();
    // ---------------- felülnézet (jobb oldalt, keskeny kijelzőn alul)
    ctx.save();
    const PX = narrow ? 0 : split, PY = narrow ? H : 0, PW = w - PX, PH = HH - PY;
    ctx.translate(PX, PY); ctx.beginPath(); ctx.rect(0, 0, PW, PH); ctx.clip();
    const px0 = 16, pw = PW - 28, pcy = PH * 0.54;
    ctx.fillStyle = C[so.col]; ctx.fillRect(0, 0, PW, PH);
    ctx.fillStyle = C['--ink']; ctx.globalAlpha = 0.14;
    for (let i = 0; i < 220; i++) { ctx.beginPath(); ctx.arc((i * 61.7) % PW, (i * 37.3) % PH, so.grain * 0.9, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (narrow) { ctx.fillStyle = C['--surface']; ctx.fillRect(0, 0, PW, 2); }
    const s = ss.v, N = 5;
    const span = (N - 1) * s + D;
    const k = Math.min(pw / span, (PH * 0.58) / D);
    const xs = px0 + (pw - span * k) / 2 + (D * k) / 2;
    const r = (D * k) / 2;
    ctx.fillStyle = C['--grout'];
    for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(xs + i * s * k, pcy, r, 0, 7); ctx.fill(); }
    ctx.strokeStyle = C['--ink']; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    for (let i = 0; i < N; i++) { ctx.beginPath(); ctx.arc(xs + i * s * k, pcy, r, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < N; i++) { ctx.fillStyle = C['--steelm2']; ctx.beginPath(); ctx.arc(xs + i * s * k, pcy, 3, 0, 7); ctx.fill(); }
    // rések / falvastagság
    if (S.t <= 0) {
      ctx.strokeStyle = C['--bad']; ctx.lineWidth = 4;
      for (let i = 0; i < N - 1; i++) { const x = xs + (i + 0.5) * s * k; ctx.beginPath(); ctx.moveTo(x, pcy - 16); ctx.lineTo(x, pcy + 16); ctx.stroke(); }
    } else {
      const x = xs + 1.5 * s * k, tt = (S.t * k) / 2;
      ctx.strokeStyle = C['--ink']; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, pcy - tt); ctx.lineTo(x, pcy + tt); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 5, pcy - tt); ctx.lineTo(x + 5, pcy - tt); ctx.moveTo(x - 5, pcy + tt); ctx.lineTo(x + 5, pcy + tt); ctx.stroke();
      chip('t ≈ ' + fmt(S.t, 2) + '\u00A0m', clamp(x, 50, PW - 50), Math.min(PH - 8, pcy + r + 20), 'center');
    }
    // osztásméret
    const yd = pcy - r - 12;
    ctx.strokeStyle = C['--ink']; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xs, yd); ctx.lineTo(xs + s * k, yd); ctx.moveTo(xs, yd - 5); ctx.lineTo(xs, yd + 5); ctx.moveTo(xs + s * k, yd - 5); ctx.lineTo(xs + s * k, yd + 5); ctx.stroke();
    chip('s = ' + fmt(s, 2) + '\u00A0m', clamp(xs + (s * k) / 2, 46, PW - 46), Math.max(46, yd - 9), 'center');
    chip('felülnézet · oszlopsor', 8, 20, 'left');
    ctx.restore();
  };
  // saját illesztés: keskeny kijelzőn az oldalnézet és a felülnézet egymás alá kerül
  st = { ctx: cv.getContext('2d'), w: 0, h: 0, narrow: false };
  const fit = () => {
    const W = cv.clientWidth || cv.parentElement.clientWidth;
    const narrow = W < 560, HH = Math.round(W * (narrow ? 1.25 : 0.5));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(HH * dpr); cv.style.height = HH + 'px';
    st.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); st.w = W; st.h = HH; st.narrow = narrow;
    draw();
  };
  new ResizeObserver(fit).observe(cv.parentElement);
  fit();
  onTheme(() => { cols(); draw(); });
  loop(cv, (t, dt) => { phase += dt; if (blk.v) heave = Math.min(1, heave + dt * 0.4); draw(); });
});

/* ================================================================== 4. MIT CSINÁL A TALAJJAL? */
const GEP = {
  mikro: { t: 'Mikrocölöp', tool: 'üreges, toldható acélrúd elvesző fúrófejjel', soil: 'kifúrja, a furatot és a környezetét fúrás közben injektálja', left: 'acélrúd + cementtest + átitatott talajköpeny, Ø 10–30 cm', use: 'aláfogás, megerősítés szűk helyen, felúszás ellen' },
  jet: { t: 'Jet-grouting', tool: 'fúrószár, alján a monitor kb. 2,5 mm-es fúvókákkal', soil: '350–400 bar-os sugárral felaprózza, kötőanyaggal keveri, részben helyettesíti', left: '„talajbeton” oszlop, átmérője a talajtól függ', use: 'aláfalazás, munkagödör, vízzáró fal' },
  dsm: { t: 'Mélykeverés', tool: 'fúró-keverő berendezés, CSM-maró vagy kotróra szerelt keverőfej', soil: 'helyben, mechanikusan összekeveri a kötőanyaggal – lefelé és felfelé is', left: 'talajbeton oszlop (1,0–1,5 m), fal vagy tömegstabilizált tömb', use: 'gyenge teherbírású talaj javítása, talajbeton fal, szennyezett terület rehabilitációja' },
  ko: { t: 'Kavicscölöp', tool: 'zsilipes mélyvibrátor, csúcsán kavicsadagolás', soil: 'oldalirányba kiszorítja, a kavicsot szakaszosan a talajba tömöríti', left: 'tömörített kavicsoszlop – szemcsés „cölöp”', use: 'töltésalapozás, ipari padlók alapozása, süllyedéscsökkentés' },
};
register('egy-gepek', (root) => {
  const { ctrls, viz } = shell(root, { out: false, foot: '<b>Szemléltető animáció</b>, torzított léptékkel és gyorsítva.' });
  const tech = seg(ctrls, { label: 'Technológia', options: Object.entries(GEP).map(([v, s]) => ({ v, t: s.t })), value: 'jet', vert: true });
  const info = h('dl', { class: 'egy-dl' });
  ctrls.append(info);
  const pbtn = h('button', { class: 'btn btn-line btn-sm', type: 'button' }, '❚❚ Megállítás');
  ctrls.append(h('div', { class: 'play-row' }, pbtn));
  const fig = figure(viz, 640, 400);
  fig.setAttribute('aria-label', 'Animáció: a választott technológia szerszáma lehatol a puha talajba, és kialakítja az elemet');
  let phase = 0, run = true;
  pbtn.addEventListener('click', () => { run = !run; pbtn.textContent = run ? '❚❚ Megállítás' : '▶ Folytatás'; });
  const fill = () => {
    const G = GEP[tech.v];
    info.innerHTML = `<dt>Szerszám</dt><dd>${G.tool}</dd><dt>A talajjal</dt><dd>${G.soil}</dd><dt>Ami marad</dt><dd>${G.left}</dd><dt>Jellemző felhasználás</dt><dd>${G.use}</dd>`;
  };
  tech.on(() => { phase = 0; fill(); draw(); });
  fill();
  const SURF = 76, BOTT = 350, HARD = 296, X = 320;
  const NW = watchNarrow(viz, 560, () => draw());
  const draw = () => {
    const nar = NW.v, LX = nar ? 166 : 10;
    fig.setAttribute('viewBox', nar ? '160 0 320 400' : '0 0 640 400');
    clear(fig);
    const g = svg('g', {}, fig);
    const T = 8, u = (phase % T) / T;
    const down = 0.34, up = 0.88;
    const tv = tech.v;
    // talaj
    svg('rect', { x: 0, y: SURF, width: 640, height: HARD - SURF, class: 'f-soilB' }, g);
    svg('rect', { x: 0, y: SURF, width: 640, height: HARD - SURF, fill: 'url(#pat-clay)', opacity: 0.55 }, g);
    svg('rect', { x: 0, y: HARD, width: 640, height: 400 - HARD, class: 'f-soilA' }, g);
    svg('rect', { x: 0, y: HARD, width: 640, height: 400 - HARD, fill: 'url(#pat-sand)' }, g);
    svg('line', { x1: 0, y1: SURF, x2: 640, y2: SURF, class: 's-ink', 'stroke-width': 1.5 }, g);
    txt(g, LX + 4, SURF + 20, 'puha agyag', 'egy-sl'); txt(g, LX + 4, HARD + 20, 'homok', 'egy-sl');
    // gép
    svg('rect', { x: X - 70, y: SURF - 26, width: 80, height: 20, rx: 4, class: 'f-acc' }, g);
    svg('rect', { x: X - 76, y: SURF - 8, width: 92, height: 8, rx: 4, class: 'f-ink', opacity: 0.8 }, g);
    svg('rect', { x: X + 12, y: 8, width: 7, height: SURF - 10, class: 'f-steel2' }, g);
    svg('rect', { x: X - 20, y: 8, width: 7, height: SURF - 10, class: 'f-steel2' }, g);
    // szerszám mélysége
    let ty;
    if (u < down) ty = lerp(SURF, BOTT, smooth(u / down));
    else if (u < up) ty = lerp(BOTT, SURF, (u - down) / (up - down));
    else ty = SURF;
    if (tv === 'mikro') ty = u < down * 1.5 ? lerp(SURF, BOTT, smooth(u / (down * 1.5))) : BOTT;
    const lbl = tv === 'mikro'
      ? (u < down * 1.5 ? '1 · fúrás és injektálás egyszerre' : u < up ? '2 · a habarcs megköt, a rúd bent marad' : '3 · kész mikrocölöp')
      : (u < down ? '1 · lehajtás' : u < up ? (tv === 'ko' ? '2 · kavics adagolása, tömörítés' : tv === 'jet' ? '2 · injektálás forgatva, felfelé' : '2 · keverés visszahúzás közben') : '3 · kész elem');
    // elem
    const el = svg('g', {}, g);
    if (tv === 'mikro') {
      const bt = u < down * 1.5 ? ty : BOTT;
      svg('path', { d: `M${X - 9} ${SURF} L${X - 9} ${bt} L${X + 9} ${bt} L${X + 9} ${SURF} Z`, class: 'f-grout', opacity: 0.95 }, el);
      if (bt > HARD) svg('rect', { x: X - 14, y: HARD, width: 28, height: bt - HARD, rx: 8, class: 'f-grout', opacity: 0.7 }, el);
      svg('rect', { x: X - 3, y: SURF - 70, width: 6, height: bt - SURF + 70, class: 'f-steel2' }, el);
      svg('path', { d: `M${X - 8} ${bt - 6} L${X + 8} ${bt - 6} L${X} ${bt + 8}Z`, class: 'f-ink' }, el);
      if (u < down * 1.5) for (let i = 0; i < 6; i++) carrow(el, X + 8, bt - 4 - i * 2, X + 24 + (i % 3) * 4, bt - 14 - i * 6, 'var(--muted)', 1.4, 5);
    } else if (tv === 'jet') {
      const R = 62;
      if (u >= down) {
        const yTop = u < up ? ty : SURF + 6;
        svg('rect', { x: X - R, y: yTop, width: 2 * R, height: BOTT - yTop, rx: 10, class: 'f-grout' }, el);
        if (BOTT > HARD && yTop < HARD + 40) svg('rect', { x: X - R - 8, y: Math.max(yTop, HARD), width: 2 * R + 16, height: BOTT - Math.max(yTop, HARD), rx: 12, class: 'f-grout', opacity: 0.9 }, el);
      }
      svg('rect', { x: X - 4, y: SURF - 70, width: 8, height: ty - SURF + 70, class: 'f-steel2' }, el);
      svg('rect', { x: X - 7, y: ty - 10, width: 14, height: 18, class: 'f-ink' }, el);
      if (u >= down && u < up) {
        const d = Math.cos(phase * 7);
        const L = (R + 6) * Math.abs(d), sg = d >= 0 ? 1 : -1;
        svg('line', { x1: X + sg * 7, y1: ty, x2: X + sg * (7 + L), y2: ty, style: 'stroke:var(--fresh)', 'stroke-width': 4, 'stroke-linecap': 'round' }, el);
      }
    } else if (tv === 'dsm') {
      const R = 48;
      const yTop = u < down ? SURF : u < up ? SURF : SURF;
      const mixed = u < down ? ty : BOTT;
      if (mixed > SURF) svg('rect', { x: X - R, y: yTop, width: 2 * R, height: mixed - yTop, class: 'egy-mix', opacity: u < down ? 0.55 : u < up ? 0.55 + 0.45 * ((u - down) / (up - down)) : 1 }, el);
      if (u >= down && u < up) svg('rect', { x: X - R, y: ty, width: 2 * R, height: BOTT - ty, class: 'egy-mix' }, el);
      svg('rect', { x: X - 4, y: SURF - 70, width: 8, height: ty - SURF + 70, class: 'f-steel2' }, el);
      if (u < up) for (let i = 0; i < 3; i++) {
        const yy = ty - 6 - i * 16, d = Math.cos(phase * 6 + i * 1.1);
        svg('line', { x1: X - R * Math.abs(d), y1: yy, x2: X + R * Math.abs(d), y2: yy, class: 's-steel', 'stroke-width': 5, 'stroke-linecap': 'round' }, el);
      }
    } else if (tv === 'ko') {
      // bordás kavicsoszlop alulról felfelé
      const yTop = u < down ? BOTT : u < up ? ty : SURF + 4;
      if (yTop < BOTT) {
        const pts = [];
        for (let y = BOTT; y >= yTop; y -= 6) { const soft = y < HARD ? 1 : 0.6; pts.push([X - (26 + 9 * soft * (0.6 + 0.4 * Math.sin(y * 0.11))), y]); }
        const back = pts.map(([x, y]) => [2 * X - x, y]).reverse();
        svg('path', { d: pathD([...pts, ...back], true), class: 'f-soilD' }, el);
        svg('path', { d: pathD([...pts, ...back], true), fill: 'url(#pat-gravel)' }, el);
      }
      const vy = u < down ? ty : u < up ? ty + 10 * Math.max(0, Math.sin(phase * 5)) : SURF;
      svg('rect', { x: X - 13, y: SURF - 70, width: 26, height: vy - SURF + 70, rx: 10, class: 'f-steel2' }, el);
      svg('path', { d: `M${X - 13} ${vy - 4} L${X + 13} ${vy - 4} L${X} ${vy + 12}Z`, class: 'f-steel2' }, el);
      if (u < down) { carrow(el, X + 16, vy - 8, X + 40, vy - 8, 'var(--ink)', 1.6, 6); carrow(el, X - 16, vy - 8, X - 40, vy - 8, 'var(--ink)', 1.6, 6); }
      else if (u < up) { carrow(el, X + 36, vy + 4, X + 58, vy + 4, 'var(--ok)', 2, 7); carrow(el, X - 36, vy + 4, X - 58, vy + 4, 'var(--ok)', 2, 7); }
      if (u >= down && u < up) txt(el, X + 66, vy + 8, 'tömörítés', 't-sm t-ok halo');
    }
    const lb = svg('g', {}, g);
    svg('rect', { x: LX, y: 10, width: nar ? 308 : 286, height: 30, rx: 8, class: 'f-surface', opacity: 0.92 }, lb);
    txt(lb, LX + 10, 30, lbl, 't-lab', { 'font-size': 13.5, 'font-weight': 700 });
    // folyamatjelző
    const pg = Math.min(1, u / up);
    const PW = nar ? 300 : 620;
    svg('rect', { x: LX, y: 380, width: PW, height: 6, rx: 3, class: 'f-bg2' }, g);
    svg('rect', { x: LX, y: 380, width: PW * pg, height: 6, rx: 3, class: 'f-grp' }, g);
  };
  loop(fig, (t, dt) => { if (run) { phase += dt; draw(); } });
  draw();
});

/* ================================================================== KVÍZ */
defineQuiz('egy', 'Kvíz – mikrocölöp, jet, keverés', [
  { q: 'Mekkora legfeljebb a <b>fúrt</b> mikrocölöp törzsátmérője?', a: ['kb. 250–300 mm', '150 mm', '500 mm', '800 mm'], c: 0, e: 'A fúrt mikrocölöp törzsátmérője legfeljebb 250–300 mm; a 150 mm-es határ a <b>vert</b> mikrocölöp legnagyobb keresztmetszeti méretére vonatkozik.' },
  { q: 'Mit hagyunk figyelmen kívül a karcsú mikrocölöp teherbírásának számításakor?', a: ['a talpellenállást', 'a köpenyellenállást', 'az injektálás hatását', 'az acélbetét szilárdságát'], c: 0, e: 'A mikrocölöpnél csak a köpeny dolgozik; mivel a készítés módja meghatározó, próbaterhelést is érdemes végezni.' },
  { q: 'Mikor kell a mikrocölöp kihajlását külön vizsgálni?', a: ['ha a talaj drénezetlen nyírószilárdsága c<sub>u</sub> &lt; 10 kPa', 'ha a cölöp 10 m-nél hosszabb', 'ha a talajvíz a cölöpfej felett van', 'mindig, minden talajban'], c: 0, e: 'A kis átmérő miatt nagyon puha (c<sub>u</sub> &lt; 10 kPa) talajban a talaj oldalirányú megtámasztása kevés – ilyenkor a kihajlás válhat mértékadóvá.' },
  { q: 'Mi történik a merev magrudas, fúrt-injektált mikrocölöp (pl. Ischebeck Titan) készítésekor?', a: ['elvesző fúrófejes, belső furatú magrudat hajtanak le, és közben híg cementtejjel injektálnak', 'előregyártott acélcsövet vernek le, majd kihúzzák', 'a furatot bentonitzaggyal támasztják meg, majd kontraktorcsővel betonoznak', 'a rudat kihúzzák, és a helyét kaviccsal töltik ki'], c: 0, e: 'A rúd egyszerre fúrószár, injektálócső és végleges betét. Körülötte 20–50 mm-es cementtest, azon kívül 30–80 mm-es átitatott talajköpeny alakul ki.' },
  { q: 'Mekkora nyomással juttatják a talajba a kötőanyagot jet-groutingnál?', a: ['350–400 bar', '5–6 bar', '35–40 bar', '3500–4000 bar'], c: 0, e: 'A kb. 2,5 mm-es fúvókákon 350–400 bar nyomással lövellik ki a kötőanyagot. Az 5–6 bar a levegőburok nyomása a levegős dupla jetnél.' },
  { q: 'Ugyanazzal a technológiával melyik talajban adódik a legnagyobb jet-oszlop?', a: ['kavicsban', 'agyagban', 'iszapban', 'mindegyikben ugyanakkora'], c: 0, e: 'Az átmérő a talaj áteresztőképességétől függ: szimpla jetnél agyagban 50–70 cm, homokban 80–100 cm – durva szemcsés talajban ennél is nagyobb.' },
  { q: 'Mi a levegős dupla jet lényege?', a: ['a cementsugarat 5–6 bar-os levegőburok veszi körül, ezért nő a hatótávolság', 'két cementsugár lő egymással szemben', 'előbb levegővel fúrnak, utána cementtel injektálnak', 'a levegő a visszafolyó habarcsot szívja ki'], c: 0, e: 'A levegőburok csökkenti a sugár „fékeződését” a talajban, így nagyobb oszlopátmérő érhető el.' },
  { q: 'Mi a veszélye, ha injektálás közben a visszafolyó cementhabarcs nem tud a felszínre távozni?', a: ['hidraulikus talajtörés, a felszín és az épület megemelkedése', 'a jet-oszlop túl vékony lesz', 'a fúrórúd befagy', 'semmi, csak lassabb a munka'], c: 0, e: 'A többletanyag akadálytalan kiáramlását végig figyelni kell – különben a nyomás a talajban halmozódik.' },
  { q: 'Hogyan készül a jet-panel?', a: ['forgatás nélkül felhúzva, két, egymással szemben álló fúvókával', 'lassabb forgatással, de nagyobb nyomással', 'két szomszédos oszlop egyidejű injektálásával', 'vízszintes fúrással a gödör falából'], c: 0, e: 'Ha nem forgatják a szárat, a két fúvóka csak egy síkban „legyinti meg” a talajt: vékony, sík elem lesz belőle – V alakban kapcsolva vízzáró függönyfal.' },
  { q: 'Miben különbözik a mélykeverés a jet-groutingtól?', a: ['a talajt forgó, lapátos keverőszár keveri össze helyben a kötőanyaggal, nem nagy nyomású sugár', 'mélykeverésnél a talajt kiemelik és a felszínen keverik', 'mélykeverésnél nincs kötőanyag', 'a mélykeverés csak kőzetben működik'], c: 0, e: 'A keverőszerszám végzi a munkát, ezért az elem mérete közel a szerszáméval egyezik.' },
  { q: 'Melyik állítás igaz a vibrált kőoszlopra (kavicscölöpre)?', a: ['a kőoszlop és a köztes talaj együtt viseli a terhet – átmenet a talajjavítás felé', 'önálló, csúcsán álló teherhordó cölöp', 'betonnal kiöntött acélcső', 'csak talajvíz felett, kötött talajban készíthető'], c: 0, e: 'A rezgő szárral tömörített kavicsoszlop merevít és drénez; a teher egy része a talajra jut, ezért a talajjavításokhoz is soroljuk.' },
]);
