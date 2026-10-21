// ch_helyszini – C04 Franki és csavart cölöpök: kiszorítás vs helyettesítés szemcseszimuláció, Franki-lépések, csavart cölöp monitor, kvíz
import { register, shell, slider, seg, toggle, select, stat, verdict, figure, svg, h, fmt, clear, clamp, lerp, smooth, pathD, loop, fitCanvas, cssVar, onTheme } from './core.js';
import { defineQuiz } from './ui.js';
import './g3_phases.js';

const txt = (p, x, y, s, cls = 't-lab', extra = {}) => svg('text', { x, y, class: cls, text: s, ...extra }, p);
const rect = (p, x, y, w, hh, style, extra = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), style, ...extra }, p);
const line = (p, x1, y1, x2, y2, style) => svg('line', { x1, y1, x2, y2, style }, p);
function arr(p, x1, y1, x2, y2, color = 'var(--ink)', w = 2, hd = 7) {
  const g = svg('g', { style: `color:${color}` }, p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(g, x1, y1, x2 - Math.cos(a) * hd * 0.7, y2 - Math.sin(a) * hd * 0.7, `stroke:currentColor;stroke-width:${w};stroke-linecap:round`);
  svg('path', { d: pathD([[x2, y2], [x2 - Math.cos(a - 0.42) * hd, y2 - Math.sin(a - 0.42) * hd], [x2 - Math.cos(a + 0.42) * hd, y2 - Math.sin(a + 0.42) * hd]], true), style: 'fill:currentColor' }, g);
  return g;
}
const PAT = { soilA: 'pat-sand', soilB: 'pat-clay', soilC: 'pat-soil', soilD: 'pat-gravel', soilE: 'pat-clay' };
function soilRect(p, x, y, w, hh, key) {
  rect(p, x, y, w, hh, `fill:var(--${key})`);
  rect(p, x, y, w, hh, `fill:url(#${PAT[key] || 'pat-soil'})`, { opacity: 0.6 });
}

/* =================================================================== 1. szemcseszimuláció */
const RP = 0.26; // a cölöp sugara a panel egységében
function mapRepl(r0, Rt) { // helyettesítés: a fal menti talaj kissé a furat felé mozdul (fellazul)
  const d = 0.04 * (Rt / RP), lam = 0.12;
  return r0 - d * Math.exp(-Math.max(0, r0 - Rt) / lam);
}
function mapDisp(r0, Rt) { // kiszorítás: a szemcsék kifelé tolódnak, a köpeny mentén összetömörödnek
  return Math.sqrt(r0 * r0 + Rt * Rt * Math.exp(-r0 / 0.25));
}
register('hsz-reszecske', (root) => {
  const { viz, out } = shell(root);
  const cv = h('canvas', { class: 'fig hsz-cv', role: 'img', 'aria-label': 'Szemcsék a cölöp körül felülnézetben: talajhelyettesítés és talajkiszorítás' });
  viz.append(cv);
  const row = h('div', { class: 'hsz-row' });
  viz.append(row);
  const bPlay = h('button', { type: 'button', class: 'btn btn-acc btn-sm' }, '▶ Lejátszás');
  row.append(h('div', { class: 'hsz-btns' }, bPlay));
  const sP = slider(row, { label: 'Előrehaladás', min: 0, max: 125, step: 1, value: 125, unit: '%', d: 0, fmt: (v) => fmt(Math.min(v, 100), 0) });
  const tCol = toggle(row, { label: 'Színezés a tömörödés szerint', value: true });
  const chart = figure(viz, 720, 190);
  const oA = stat(out, { label: 'Helyettesítés: sűrűségváltozás a köpeny mentén', unit: '%', d: 0 });
  const oB = stat(out, { label: 'Kiszorítás: sűrűségváltozás a köpeny mentén', unit: '%', d: 0 });
  const oC = stat(out, { label: 'Felszínre hozott talaj (D = 50 cm)', unit: 'm³/m', d: 2 });
  // szemcsék: szórt rács
  const P = [];
  const sp = 0.082;
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let y = -1.15; y <= 1.15; y += sp) for (let x = -1.15; x <= 1.15; x += sp) {
    const px = x + (rnd() - 0.5) * sp * 0.5, py = y + (rnd() - 0.5) * sp * 0.5;
    P.push({ r: Math.hypot(px, py), a: Math.atan2(py, px), k: rnd() });
  }
  // sűrű virtuális mintavétel a sűrűséggörbéhez
  const V = []; for (let i = 0; i < 24000; i++) { const r = Math.sqrt(rnd()) * 1.5; V.push(r); }
  let p = 1.25, playing = false, col = {}, st = null;
  const hex = (c) => { c = (c || '#888').trim(); if (c[0] !== '#') return [128, 128, 128]; if (c.length === 4) c = '#' + [...c.slice(1)].map((x) => x + x).join(''); return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); };
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
  const colors = () => { col = { soil: cssVar('--soilA'), grain: cssVar('--ink2'), gR: hex(cssVar('--ink2')), aR: hex(cssVar('--accent')), wR: hex(cssVar('--water')), conc: cssVar('--concrete'), conc2: cssVar('--concrete2'), ink: cssVar('--ink'), muted: cssVar('--muted'), bg: cssVar('--surface'), bad: cssVar('--bad'), ok: cssVar('--ok'), water: cssVar('--water'), acc: cssVar('--accent') }; };
  colors(); onTheme(() => { colors(); draw(); });
  bPlay.addEventListener('click', () => { playing = !playing; if (playing && p >= 1.25) p = 0; bPlay.textContent = playing ? '❚❚ Megállítás' : '▶ Lejátszás'; });
  sP.on((v) => { p = v / 100; playing = false; bPlay.textContent = '▶ Lejátszás'; draw(); upd(); });
  tCol.on(() => draw());
  loop(root, (t, dt) => { if (!playing) return; p = Math.min(1.25, p + dt * 0.22); sP.set(Math.round(p * 100), false); if (p >= 1.25) { playing = false; bPlay.textContent = '▶ Lejátszás'; } draw(); upd(); });
  const Rt = () => RP * smooth(Math.min(1, p));
  function dens(mapper, R, alive) {
    // gyűrűnkénti sűrűség a kezdetihez képest: r/R 1…4
    const bins = 30, lo = 1, hi = 4, cnt = new Array(bins).fill(0);
    for (const r0 of V) { if (!alive(r0, R)) continue; const r = mapper(r0, R); const q = r / RP; if (q < lo || q >= hi) continue; cnt[Math.floor(((q - lo) / (hi - lo)) * bins)]++; }
    const n0 = V.length / (Math.PI * 1.5 * 1.5);
    return cnt.map((c, i) => { const a = lo + ((hi - lo) * i) / bins, b = a + (hi - lo) / bins; const area = Math.PI * ((b * RP) ** 2 - (a * RP) ** 2); return { q: (a + b) / 2, v: c / area / n0 }; });
  }
  function upd() {
    const R = Rt();
    const dA = dens(mapRepl, R, (r0, RR) => r0 >= RR), dB = dens(mapDisp, R, () => true);
    const avg = (d) => { const s = d.filter((x) => x.q < 1.5); return s.reduce((a, x) => a + x.v, 0) / s.length; };
    const a = (avg(dA) - 1) * 100, b = (avg(dB) - 1) * 100;
    oA.set(p < 0.05 ? 0 : a, a < -2 ? 'warn' : null); oB.set(p < 0.05 ? 0 : b, b > 2 ? 'ok' : null);
    oC.set(Math.PI * 0.25 * 0.25 * smooth(Math.min(1, p)) ** 2);
    drawChart(dA, dB);
  }
  function drawChart(dA, dB) {
    clear(chart);
    const x0 = 60, x1 = 700, y0 = 16, y1 = 150, vmin = 0.6, vmax = 1.8;
    const X = (q) => x0 + ((q - 1) / 3) * (x1 - x0), Y = (v) => y1 - ((clamp(v, vmin, vmax) - vmin) / (vmax - vmin)) * (y1 - y0);
    line(chart, x0, y1, x1, y1, 'stroke:var(--line2)'); line(chart, x0, y0, x0, y1, 'stroke:var(--line2)');
    line(chart, x0, Y(1), x1, Y(1), 'stroke:var(--muted);stroke-dasharray:4 4');
    txt(chart, x1, Y(1) - 5, 'eredeti sűrűség', 't-sm', { 'text-anchor': 'end' });
    for (const v of [0.6, 1, 1.4, 1.8]) txt(chart, x0 - 6, Y(v) + 4, `${v > 1 ? '+' : ''}${fmt((v - 1) * 100, 0)}%`, 't-sm', { 'text-anchor': 'end' });
    for (let q = 1; q <= 4; q++) { line(chart, X(q), y1, X(q), y1 + 4, 'stroke:var(--muted)'); txt(chart, X(q) - (q === 1 ? 4 : 0), y1 + 17, q === 1 ? 'köpeny' : `${q}·R`, 't-sm', { 'text-anchor': q === 1 ? 'start' : 'middle' }); }
    txt(chart, x1, y1 + 34, 'távolság a cölöp tengelyétől', 't-sm', { 'text-anchor': 'end' });
    const sm = (d) => d.map((x, i) => [X(x.q), Y((d[Math.max(0, i - 1)].v + x.v + d[Math.min(d.length - 1, i + 1)].v) / 3)]);
    if (p > 0.05) {
      svg('path', { d: pathD(sm(dA)), style: 'fill:none;stroke:var(--water);stroke-width:2.6' }, chart);
      svg('path', { d: pathD(sm(dB)), style: 'fill:none;stroke:var(--accent);stroke-width:2.6' }, chart);
    }
    rect(chart, x0 + 10, y0 - 4, 14, 4, 'fill:var(--water)'); txt(chart, x0 + 30, y0 + 2, 'helyettesítés (fúrás)', 't-sm');
    rect(chart, x0 + 330, y0 - 4, 14, 4, 'fill:var(--accent)'); txt(chart, x0 + 350, y0 + 2, 'kiszorítás', 't-sm');
    txt(chart, x1, y0 + 2, 'Szemléltető modell', 't-sm', { 'text-anchor': 'end' });
  }
  function draw() {
    if (!st || !st.w) return; const { ctx, w, h: hh } = st;
    ctx.clearRect(0, 0, w, hh);
    const gap = 16, side = Math.min((w - gap) / 2, hh - 26), sc = side / 1.9;
    const R = Rt(), fill = clamp((p - 1) / 0.25, 0, 1);
    [0, 1].forEach((m) => {
      const ox = m === 0 ? (w / 2 - gap / 2 - side / 2) : (w / 2 + gap / 2 + side / 2), oy = 24 + side / 2;
      ctx.save();
      ctx.beginPath(); ctx.rect(ox - side / 2, oy - side / 2, side, side); ctx.clip();
      ctx.fillStyle = col.soil; ctx.fillRect(ox - side / 2, oy - side / 2, side, side);
      const base = sp * sc * 0.36;
      for (const q of P) {
        let r, alpha = 1, rad = base, rho = 1;
        if (m === 0) {
          if (q.r < R) { alpha = 1 - clamp((R - q.r) / 0.05, 0, 1); if (alpha <= 0) continue; }
          r = mapRepl(q.r, R);
          if (q.r >= R) { const dr = (mapRepl(q.r + 0.002, R) - r) / 0.002; rho = q.r / (r * dr); rad = base / Math.sqrt(Math.max(0.5, rho)); }
        } else {
          r = mapDisp(q.r, R);
          const dr = Math.abs((mapDisp(q.r + 0.002, R) - r) / 0.002); rho = q.r < 0.01 ? 3 : q.r / (r * Math.max(dr, 0.15));
          rad = base / Math.sqrt(clamp(rho, 0.6, 3.2));
        }
        const x = ox + Math.cos(q.a) * r * sc, y = oy + Math.sin(q.a) * r * sc;
        if (tCol.v && rho > 1.01) ctx.fillStyle = mix(col.gR, col.aR, clamp((rho - 1) / 0.45, 0, 1));
        else if (tCol.v && rho < 0.99) ctx.fillStyle = mix(col.gR, col.wR, clamp((1 - rho) / 0.12, 0, 1));
        else ctx.fillStyle = col.grain;
        ctx.globalAlpha = alpha * (0.55 + 0.25 * q.k);
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, rad), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // furat / cölöp
      const hr = (m === 0 ? R - 0.04 * (R / RP) : R) * sc;
      if (R > 0.005) {
        ctx.fillStyle = fill > 0 ? col.conc : col.bg; ctx.globalAlpha = fill > 0 ? 0.35 + 0.65 * fill : 0.9;
        ctx.beginPath(); ctx.arc(ox, oy, Math.max(0, hr), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = m === 0 ? col.water : col.acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, Math.max(0, hr), 0, Math.PI * 2); ctx.stroke();
        if (m === 1 && p < 1) { // kiszorító fej – forgó jel
          ctx.strokeStyle = col.ink; ctx.lineWidth = 1.5; const t = performance.now() / 300;
          for (let k = 0; k < 3; k++) { const a = t + (k * 2 * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * hr * 0.9, oy + Math.sin(a) * hr * 0.9); ctx.stroke(); }
        }
        if (fill > 0.6) { ctx.fillStyle = col.ink; ctx.font = `700 ${Math.max(10, side * 0.045)}px "JetBrains Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('beton', ox, oy); }
      }
      ctx.restore();
      ctx.strokeStyle = col.muted; ctx.lineWidth = 1; ctx.strokeRect(ox - side / 2, oy - side / 2, side, side);
      ctx.fillStyle = col.ink; ctx.font = `800 ${w < 500 ? 12 : 15}px "Big Shoulders Display", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(w < 560 ? (m === 0 ? 'HELYETTESÍTÉS' : 'KISZORÍTÁS') : (m === 0 ? 'TALAJHELYETTESÍTÉS – FÚRÁS' : 'TALAJKISZORÍTÁS – CSAVART, VERT'), ox, 16);
    });
  }
  fitCanvas(cv, 0.5, (S) => { st = S; draw(); });
  upd();
});

/* =================================================================== 2. Franki-lépések */
const FSTEPS = [
  { k: 'Dugó', t: '1. Pontraállás, dugó', d: 'A béléscsövet (Ø 46–52 cm, 30 mm fal) a cölöp helyére állítják, az aljába kb. 1 m magasan száraz betont (vagy kavicsot) töltenek.' },
  { k: 'Leverés', t: '2. Leverés a dugóval', d: 'A 3 t-ás ejtőkos a csőben a dugót döngöli; a dugó a súrlódás révén magával húzza a csövet. A cső kiszorítja a talajt – sem talaj, sem víz nem jut bele.' },
  { k: 'Kiverés', t: '3. A dugó kiverése', d: 'A teherbíró rétegben a csövet a verőállványhoz rögzítik, és erőteljes döngöléssel kiverik belőle a betont – kb. 30–40 cm marad a csőben.' },
  { k: 'Hagyma', t: '4. A „hagyma” kidöngölése', d: 'Újabb és újabb betonadagokat juttatnak a csőbe, és kidöngölik: a talp kiszélesedik, körülötte a talaj tömörödik.' },
  { k: 'Vasalás', t: '5. Vasalás', d: 'A vasalókosarat a csőbe engedik, egészen a hagymáig.' },
  { k: 'Törzs', t: '6. A törzs betonozása', d: 'Újabb betonadagolás és döngölés mellett a béléscsövet fokozatosan visszahúzzák. A döngölt beton a talajba is benyomódik – a törzs érdes, bordázott.' },
  { k: 'Kész', t: '7. Kész cölöp', d: 'A kész cölöp átmérője a kiszorítás miatt kb. 60 cm, hossza legfeljebb 16–18 m; 2000–3000 kN teherbírás is elérhető.' },
];
register('hsz-franki', (root) => {
  const { ctrls, viz, out } = shell(root);
  const stepsBox = h('div', { class: 'stepbtns hsz-steps' });
  const sb = FSTEPS.map((s, i) => { const b = h('button', { type: 'button', onclick: () => go(i, 1) }, `${i + 1} ${s.k}`); stepsBox.append(b); return b; });
  ctrls.append(h('div', { class: 'ctl' }, h('span', { class: 'ctl-lab' }, 'Lépés'), stepsBox));
  const bPlay = h('button', { type: 'button', class: 'btn btn-acc btn-sm' }, '▶ Lejátszás');
  ctrls.append(h('div', { class: 'hsz-btns' }, bPlay));
  const sN = slider(ctrls, { label: 'Kidöngölt betonadagok a talpban', min: 1, max: 8, step: 1, value: 5, d: 0, hint: 'Egy adag ≈ 0,12 m³ (szemléltető érték).' });
  const stx = h('div', { class: 'steptext' });
  ctrls.append(stx);
  const fig = figure(viz, 640, 440);
  viz.append(h('p', { class: 'hsz-cap' }, 'Metszet, vízszintesen kétszeresre nagyítva. Szemléltető ábra.'));
  const oD = stat(out, { label: 'Hagyma átmérője', unit: 'm', d: 2 });
  const oA = stat(out, { label: 'Talpfelület', unit: 'm²', d: 2 });
  const oX = stat(out, { label: 'A törzs keresztmetszetéhez képest', unit: '×', d: 1 });
  const oV = stat(out, { label: 'A talpba döngölt beton', unit: 'm³', d: 2 });
  const GY = 64, SC = 32, HX = 2 * SC, PX = 250, ZT = 7.2; // terep, px/m, vízszintes px/m, tengely, csőtalp
  const TUBE = 0.52, SHAFT = 0.6, AIN = Math.PI / 4 * 0.46 * 0.46;
  let cur = 6, u = 1, playing = false;
  const bulbV = (n) => 0.075 + n * 0.12;
  const bulbD = (V) => Math.cbrt((6 * V) / Math.PI);
  function go(i, uu = 0) { cur = i; u = uu; paint(); }
  bPlay.addEventListener('click', () => { playing = !playing; if (playing && cur === 6 && u >= 1) { cur = 0; u = 0; } bPlay.textContent = playing ? '❚❚ Megállítás' : '▶ Lejátszás'; });
  sN.on(() => paint());
  loop(root, (t, dt) => {
    if (playing) { u += dt / 3.2; if (u >= 1) { if (cur < 6) { cur++; u = 0; } else { u = 1; playing = false; bPlay.textContent = '▶ Lejátszás'; } } }
    paint(t);
  });
  function stats() {
    const n = sN.v;
    const Vb = cur < 2 ? 0 : cur === 2 ? 0.075 * u : cur === 3 ? lerp(bulbV(0), bulbV(n), u) : bulbV(n);
    const D = Vb > 0 ? bulbD(Vb) : 0, A = Math.PI / 4 * D * D, As = Math.PI / 4 * SHAFT * SHAFT;
    return { Vb, D, A, x: A / As };
  }
  function paint(t = performance.now() / 1000) {
    sb.forEach((b, i) => b.classList.toggle('on', i === cur));
    const S = FSTEPS[cur]; stx.innerHTML = `<b>${S.t}</b>${S.d}`;
    const s = stats();
    oD.set(s.D || '–', null, s.D ? null : '–'); oA.set(s.A || '–', null, s.A ? null : '–'); oX.set(s.x || '–', s.x > 2.5 ? 'ok' : null, s.x ? null : '–'); oV.set(s.Vb || '–', null, s.Vb ? null : '–');
    draw(t, s);
  }
  function draw(t, s) {
    clear(fig);
    const Y = (z) => GY + z * SC, Xh = (m) => m * HX; // Xh: vízszintes méret px-ben
    rect(fig, 0, 0, 640, GY, 'fill:var(--sky)');
    soilRect(fig, 0, GY, 640, 5.6 * SC, 'soilB'); soilRect(fig, 0, Y(5.6), 640, 440 - Y(5.6), 'soilD');
    line(fig, 0, GY, 640, GY, 'stroke:var(--soil-line);stroke-width:1.5');
    txt(fig, 10, GY + 18, 'puha, kötött réteg', 't-sm halo'); txt(fig, 10, Y(5.6) + 18, 'teherbíró réteg', 't-sm halo');
    for (let k = 0; k <= 11; k++) { line(fig, 600, Y(k), 606, Y(k), 'stroke:var(--muted)'); if (k % 2 === 0) txt(fig, 610, Y(k) + 4, String(k), 't-sm halo'); }
    txt(fig, 610, GY - 8, 'm', 't-sm');
    // verőállvány
    rect(fig, PX + 70, 4, 8, GY - 4, 'fill:var(--steelm2)'); line(fig, PX + 74, 6, PX + 160, GY, 'stroke:var(--steelm2);stroke-width:3');
    rect(fig, PX + 60, GY - 16, 120, 14, 'fill:var(--steelm2)', { rx: 3 });
    // csőtalp mélysége és a betonszint a csőben
    let zt = 0.3, plug = 1.0, tubeOn = true, shaftTop = null, cage = null, ram = null;
    const bounce = Math.abs(Math.sin(t * 5.5)) * 0.9;
    if (cur === 0) { zt = 0.3; plug = 1.0; ram = 1.6 - u * 0.4; }
    if (cur === 1) { zt = lerp(0.3, ZT, smooth(u)); plug = 1.0; ram = bounce; }
    if (cur === 2) { zt = ZT; plug = lerp(1.0, 0.35, u); ram = bounce; }
    if (cur === 3) { zt = ZT; plug = 0.35 + 0.4 * Math.max(0, Math.sin(u * Math.PI * sN.v)); ram = bounce; }
    if (cur === 4) { zt = ZT; plug = 0.35; cage = lerp(-ZT, 0, smooth(u)); }
    if (cur === 5) { zt = lerp(ZT, 0, smooth(u)); plug = 0.6; shaftTop = zt; cage = 0; ram = bounce; }
    if (cur === 6) { tubeOn = false; shaftTop = 0; cage = 0; }
    // hagyma
    if (s.D > 0) {
      const rx = Xh(s.D) / 2, ry = (s.D / 2) * SC * 0.82, cy = Y(ZT) + ry * 0.7;
      if (cur >= 3) svg('ellipse', { cx: PX, cy, rx: rx + 18, ry: ry + 12, style: 'fill:var(--accent);fill-opacity:.1;stroke:var(--accent);stroke-dasharray:4 4;stroke-width:1.2' }, fig);
      svg('path', { d: `M${PX - rx * 0.55} ${cy - ry * 0.9} C${PX - rx * 1.15} ${cy - ry * 0.6} ${PX - rx * 1.1} ${cy + ry * 0.9} ${PX} ${cy + ry} C${PX + rx * 1.1} ${cy + ry * 0.9} ${PX + rx * 1.15} ${cy - ry * 0.6} ${PX + rx * 0.55} ${cy - ry * 0.9} Z`, style: 'fill:var(--fresh);stroke:var(--concrete2);stroke-width:1.5' }, fig);
      svg('path', { d: `M${PX - rx * 0.55} ${cy - ry * 0.9} C${PX - rx * 1.15} ${cy - ry * 0.6} ${PX - rx * 1.1} ${cy + ry * 0.9} ${PX} ${cy + ry} C${PX + rx * 1.1} ${cy + ry * 0.9} ${PX + rx * 1.15} ${cy - ry * 0.6} ${PX + rx * 0.55} ${cy - ry * 0.9} Z`, style: 'fill:url(#pat-conc)', opacity: 0.8 }, fig);
      if (cur >= 3) { line(fig, PX - rx, cy + ry + 14, PX + rx, cy + ry + 14, 'stroke:var(--ink);stroke-width:1'); txt(fig, PX, cy + ry + 28, `Ø ≈ ${fmt(s.D, 2)} m`, 't-num halo', { 'text-anchor': 'middle' }); }
    }
    // törzs (bordázott)
    if (shaftTop !== null) {
      const zb = ZT, yA = Y(shaftTop), yB = Y(zb) + 4, hw = Xh(SHAFT) / 2;
      const pts = []; for (let y = yA; y <= yB; y += 6) pts.push([PX - hw - 2 * Math.sin(y * 0.55), y]);
      const ptsR = []; for (let y = yB; y >= yA; y -= 6) ptsR.push([PX + hw + 2 * Math.sin(y * 0.6 + 1), y]);
      svg('path', { d: pathD([...pts, ...ptsR], true), style: 'fill:var(--fresh)' }, fig);
      svg('path', { d: pathD([...pts, ...ptsR], true), style: 'fill:url(#pat-conc)', opacity: 0.8 }, fig);
      if (cur === 6) {
        line(fig, PX + hw + 4, Y(0.9), PX + hw + 30, Y(0.9), 'stroke:var(--ink);stroke-width:1');
        txt(fig, PX + hw + 34, Y(0.9) + 5, 'Ø ≈ 60 cm', 't-num halo');
        for (const sgn of [-1, 1]) for (let k = 0; k < 4; k++) arr(fig, PX + sgn * (hw + 26), Y(1.5 + k * 1.4), PX + sgn * (hw + 8), Y(1.5 + k * 1.4), 'var(--accent)', 1.6, 6);
        txt(fig, PX + hw + 32, Y(3.6), 'tömörödött talaj', 't-sm t-acc halo');
      }
    }
    // vasalókosár
    if (cage !== null) {
      const top = Y(cage) - 14, bot = Y(cage + ZT) + 6, cw = Xh(0.4) / 2;
      for (const sx of [-cw, -cw / 3, cw / 3, cw]) line(fig, PX + sx, top, PX + sx, bot, 'stroke:var(--rebar);stroke-width:1.6');
      for (let y = top + 4; y < bot; y += 12) line(fig, PX - cw, y, PX + cw, y, 'stroke:var(--rebar);stroke-width:1');
    }
    // béléscső
    if (tubeOn) {
      const yt = Y(zt), ytop = Math.min(GY - 0.2 * SC, yt - 8.2 * SC), hw = Xh(TUBE) / 2;
      // cső belseje (üres) + betondugó
      rect(fig, PX - hw + 3, ytop, 2 * hw - 6, yt - ytop, 'fill:var(--surface)', { opacity: 0.92 });
      const ypl = yt - plug * SC;
      rect(fig, PX - hw + 3, ypl, 2 * hw - 6, yt - ypl, 'fill:var(--fresh)');
      rect(fig, PX - hw + 3, ypl, 2 * hw - 6, yt - ypl, 'fill:url(#pat-conc)', { opacity: 0.8 });
      for (const sx of [-hw, hw - 3]) rect(fig, PX + sx, ytop, 3, yt - ytop, 'fill:var(--steelm2)');
      if (cur <= 1) txt(fig, PX + hw + 8, ypl + plug * SC / 2 + 4, cur === 0 ? 'dugó' : 'dugó húzza a csövet', 't-sm halo');
      if (cur === 1) for (const sgn of [-1, 1]) arr(fig, PX + sgn * (hw + 4), yt - 10, PX + sgn * (hw + 22), yt - 4, 'var(--accent)', 1.6, 6);
      // kötelek (3. lépéstől rögzítve)
      if (cur >= 2 && cur <= 5) { for (const sgn of [-1, 1]) line(fig, PX + sgn * hw, Math.max(ytop, 12) + 4, PX + 70, 8, 'stroke:var(--ink2);stroke-width:1.4'); txt(fig, PX - hw - 10, 40, 'a cső a verőállványhoz rögzítve', 't-sm halo', { 'text-anchor': 'end' }); }
      // ejtőkos a csőben
      if (ram !== null) {
        const yr = ypl - 6 - ram * SC - 1.2 * SC;
        rect(fig, PX - hw + 6, yr, 2 * hw - 12, 1.2 * SC, 'fill:var(--ink2)', { rx: 2 });
        line(fig, PX, yr, PX, 6, 'stroke:var(--ink2);stroke-width:1.2'); line(fig, PX, 6, PX + 70, 6, 'stroke:var(--ink2);stroke-width:1.2');
        if (yr > GY - 1.2 * SC) txt(fig, PX - hw - 8, Math.max(GY + 12, yr + 14), 'ejtőkos (3 t)', 't-sm halo', { 'text-anchor': 'end' });
      }
      // betonadag a cső tetején (4. és 6. lépés)
      if ((cur === 3 || cur === 5) && Math.sin(t * 2) > 0) { rect(fig, PX + hw + 6, ytop - 22, 36, 18, 'fill:var(--fresh)', { rx: 3 }); txt(fig, PX + hw + 46, ytop - 9, 'betonadag', 't-sm halo'); }
    }
    txt(fig, 630, 430, FSTEPS[cur].t.toUpperCase(), 't-big', { 'text-anchor': 'end' });
  }
  paint();
});

/* =================================================================== 3. csavart cölöp – monitor */
const HEADS = { sima: { t: 'Sima köpenyű', k: 1, vol: 1 }, menetes: { t: 'Csavarmenetes', k: 1.15, vol: 0.85 }, fdp: { t: 'FDP', k: 1.25, vol: 1 } };
const CSOIL = {
  laza: { t: 'Laza homok', key: 'soilA', q: 1.0, comp: 'jelentős', ok: 'ok' },
  kozep: { t: 'Közepesen tömör homok', key: 'soilD', q: 1.6, comp: 'mérsékelt', ok: 'ok' },
  agyag: { t: 'Puha–gyúrható agyag', key: 'soilB', q: 1.2, comp: 'kicsi', ok: 'ok' },
  tomor: { t: 'Tömör kavics, kemény agyag', key: 'soilE', q: 3.2, comp: '—', ok: 'bad' },
};
register('hsz-csavart', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sHd = seg(ctrls, { label: 'Fúrófej', options: Object.entries(HEADS).map(([v, o]) => ({ v, t: o.t })), value: 'sima' });
  const sD = slider(ctrls, { label: 'Átmérő', sym: 'D', min: 300, max: 600, step: 10, value: 450, unit: 'mm', d: 0 });
  const sL = slider(ctrls, { label: 'Cölöphossz', sym: 'L', min: 6, max: 20, step: 0.5, value: 14, unit: 'm', d: 1 });
  const sS = select(ctrls, { label: 'Talaj', options: Object.entries(CSOIL).map(([v, o]) => ({ v, t: o.t })), value: 'laza' });
  const bGo = h('button', { type: 'button', class: 'btn btn-acc btn-sm' }, '▶ Fúrás indítása');
  ctrls.append(h('div', { class: 'hsz-btns' }, bGo));
  const fig = figure(viz, 660, 400);
  const ver = verdict(viz);
  const oV = stat(out, { label: 'Oldalra tolt talaj (nem jön fel)', unit: 'm³', d: 2 });
  const oF = stat(out, { label: 'Fúrt cölöpnél ennyi furadék lenne', unit: 'm³', d: 1 });
  const oT = stat(out, { label: 'Ez kb. ennyi teherautó', d: 0 });
  const oA = stat(out, { label: 'Köpenyfelület', unit: 'm²', d: 1 });
  const oC = stat(out, { label: 'A talaj tömörödése' });
  oC.el.classList.add('elo-tstat');
  const TMAX = 400; // kNm, a gép határa (szemléltető)
  let ph = 'drill', z = 0, zc = 0, cage = 0, stuck = null, trace = [];
  bGo.textContent = '↺ Újra';
  const torque = (zz) => { const S = CSOIL[sS.v], H = HEADS[sHd.v]; return 120 * (sD.v / 450) ** 2 * S.q * H.k * (1 + 0.03 * zz); };
  const reset = () => { ph = 'idle'; z = 0; zc = 0; cage = 0; stuck = null; trace = []; bGo.textContent = '▶ Fúrás indítása'; };
  bGo.addEventListener('click', () => { if (ph === 'idle' || ph === 'done' || ph === 'stuck') { reset(); ph = 'drill'; bGo.textContent = '↺ Újra'; } else { reset(); } upd(); });
  [sHd, sD, sL, sS].forEach((c) => c.on(() => { reset(); upd(); }));
  loop(root, (t, dt) => {
    const L = sL.v;
    if (ph === 'drill') {
      z += dt * 2.2; const T = torque(z); trace.push([z, T]);
      if (T > TMAX) { stuck = z; ph = 'stuck'; upd(); }
      else if (z >= L) { z = L; ph = 'conc'; zc = L; upd(); }
    } else if (ph === 'conc') { zc -= dt * 2.6; if (zc <= 0) { zc = 0; ph = 'cage'; cage = 0; upd(); } }
    else if (ph === 'cage') { cage += dt * 3.2; if (cage >= L * 0.85) { cage = L * 0.85; ph = 'done'; upd(); } }
    draw(t);
  });
  function upd() {
    const D = sD.v / 1000, L = sL.v, H = HEADS[sHd.v], S = CSOIL[sS.v];
    const V = Math.PI / 4 * D * D * L * H.vol;
    oV.set(V); oF.set(V * 1.25); oT.set(Math.max(1, Math.ceil((V * 1.25) / 10))); oA.set(Math.PI * D * L);
    oC.set(0, S.ok === 'bad' ? 'bad' : S.comp === 'jelentős' ? 'ok' : null, S.comp);
    const T0 = torque(L);
    if (ph === 'stuck') ver.set('bad', 'Elakadt a fúrófej', `<span>${fmt(stuck, 1)} m-en a forgatónyomaték elérte a gép határát (${TMAX} kNm). Tömör, kemény talajban a kiszorító fej nem tudja széttolni a talajt – ide inkább talajhelyettesítéses (fúrt, CFA) cölöp való.</span>`);
    else if (ph === 'done') ver.set('ok', 'Kész a cölöp', `<span>${fmt(L, 1)} m, Ø ${fmt(sD.v, 0)} mm – ${fmt(V, 2)} m³ talajt toltunk oldalra, a felszínre szinte semmi sem jött. Fúrt cölöpnél ugyanez kb. ${fmt(V * 1.25, 1)} m³ (fellazult) furadék lenne.</span>`);
    else if (ph === 'drill') ver.set('', 'Fúrás – forgatás és tolás', '<span>A fej széttolja és tömöríti a talajt; a monitor a nyomatékot rögzíti.</span>');
    else if (ph === 'conc') ver.set('', 'Betonozás nyomás alatt', '<span>A beton a fúrószáron át, nyomás alatt áramlik a talpra, miközben a szárat forgatva kiemelik.</span>');
    else if (ph === 'cage') ver.set('', 'Vasalás', '<span>A vasalókosarat a friss betonba vibrálással juttatják le.</span>');
    else ver.set(T0 > TMAX ? 'warn' : '', T0 > TMAX ? 'Ez nehéz lesz…' : 'Indulhat a fúrás', T0 > TMAX ? `<span>A becsült nyomaték a talpnál ≈ ${fmt(T0, 0)} kNm – több, mint amennyit a gép tud (${TMAX} kNm).</span>` : `<span>Becsült nyomaték a talpnál ≈ ${fmt(T0, 0)} kNm (a gép határa ${TMAX} kNm).</span>`);
  }
  function draw(t) {
    clear(fig);
    const L = sL.v, D = sD.v / 1000, S = CSOIL[sS.v], Hd = sHd.v;
    const GY = 56, SC = 16, HX = 3 * SC, PX = 170, Y = (zz) => GY + zz * SC, hw = (D * HX) / 2;
    rect(fig, 0, 0, 400, GY, 'fill:var(--sky)'); soilRect(fig, 0, GY, 400, 400 - GY, S.key);
    line(fig, 0, GY, 400, GY, 'stroke:var(--soil-line);stroke-width:1.5');
    txt(fig, 10, GY + 30, S.t.toLowerCase(), 't-sm halo');
    for (let k = 0; k <= 20; k += 2) { line(fig, 380, Y(k), 386, Y(k), 'stroke:var(--muted)'); if (k % 4 === 0) txt(fig, 388, Y(k) + 4, String(k), 't-sm halo'); }
    // gép
    rect(fig, PX + 34, 2, 8, GY - 10, 'fill:var(--steelm2)'); rect(fig, PX + 20, GY - 14, 110, 12, 'fill:var(--steelm2)', { rx: 3 });
    rect(fig, PX + 70, GY - 30, 46, 16, 'fill:var(--steelm)', { rx: 3 });
    // tömörödött zóna
    const zz = ph === 'idle' ? 0 : ph === 'drill' || ph === 'stuck' ? z : L;
    const comp = S.comp === 'jelentős' ? 0.22 : S.comp === 'mérsékelt' ? 0.14 : 0.07;
    if (zz > 0) rect(fig, PX - hw - 12, GY, 2 * hw + 24, zz * SC, 'fill:var(--ink)', { opacity: comp, rx: 6 });
    // beton (alulról fel)
    if (ph === 'conc' || ph === 'cage' || ph === 'done') {
      const top = ph === 'conc' ? zc : 0;
      const yA = Y(top), yB = Y(L);
      if (Hd === 'menetes') {
        const pts = []; for (let y = yA; y <= yB; y += 4) pts.push([PX - hw + ((Math.floor((y - yA) / 8) % 2) ? 5 : 0), y]);
        const pr = []; for (let y = yB; y >= yA; y -= 4) pr.push([PX + hw - ((Math.floor((y - yA) / 8 + 0.5) % 2) ? 5 : 0), y]);
        svg('path', { d: pathD([...pts, ...pr], true), style: 'fill:var(--fresh)' }, fig);
      } else rect(fig, PX - hw, yA, 2 * hw, yB - yA, 'fill:var(--fresh)');
      rect(fig, PX - hw, yA, 2 * hw, yB - yA, 'fill:url(#pat-conc)', { opacity: 0.7 });
    }
    // fúrószár + fej
    const zh = ph === 'drill' || ph === 'stuck' ? z : ph === 'conc' ? zc : ph === 'idle' ? 0 : null;
    if (zh !== null) {
      const yh = Y(zh);
      rect(fig, PX - 4, 4, 8, yh - 4 - 18, 'fill:var(--steelm2)');
      const rot = t * 8;
      if (Hd === 'fdp') { rect(fig, PX - hw * 0.7, Math.max(4, yh - 6 * SC), hw * 1.4, Math.min(6 * SC, yh - 4) - 18, 'fill:var(--steelm2)'); }
      // kiszorító test
      svg('path', { d: `M${PX - hw * 0.6} ${yh - 30} L${PX + hw * 0.6} ${yh - 30} L${PX + hw} ${yh - 18} L${PX + hw} ${yh - 8} L${PX} ${yh + 6} L${PX - hw} ${yh - 8} L${PX - hw} ${yh - 18}Z`, style: 'fill:var(--steelm)' }, fig);
      for (let k = 0; k < 3; k++) { const yy = yh - 26 + k * 7, s2 = Math.sin(rot + k * 1.3); line(fig, PX - hw * s2, yy - 2, PX + hw * s2, yy + 2, 'stroke:var(--steelm2);stroke-width:2.2'); }
      if (Hd === 'menetes') for (let k = 0; k < 4; k++) { const yy = yh - 40 - k * 10; line(fig, PX - hw, yy, PX + hw, yy + 5, 'stroke:var(--steelm);stroke-width:4;stroke-linecap:round'); }
      if (ph === 'drill') for (const sg of [-1, 1]) { arr(fig, PX + sg * (hw + 2), yh - 14, PX + sg * (hw + 20), yh - 18, 'var(--accent)', 1.8, 6); }
      if (ph === 'conc') { for (let k = 0; k < 3; k++) svg('circle', { cx: PX, cy: yh + 6 + ((t * 30 + k * 8) % 20), r: 2, style: 'fill:var(--fresh)' }, fig); }
      if (ph === 'stuck') { txt(fig, PX + hw + 12, yh - 6, 'ELAKADT', 't-big t-bad halo'); }
    }
    // kosár
    if (ph === 'cage' || ph === 'done') {
      const cw = hw * 0.65, top = GY - 10, bot = Y(cage);
      for (const sx of [-cw, 0, cw]) line(fig, PX + sx, top, PX + sx, bot, 'stroke:var(--rebar);stroke-width:1.5');
      for (let y = top + 4; y < bot; y += 10) line(fig, PX - cw, y, PX + cw, y, 'stroke:var(--rebar);stroke-width:1');
      if (ph === 'cage') for (let k = 0; k < 3; k++) svg('ellipse', { cx: PX, cy: top - 4, rx: 10 + k * 6, ry: 3 + k, style: 'fill:none;stroke:var(--warn);stroke-width:1', opacity: 0.6 }, fig);
    }
    // felszín: furadék (szinte semmi)
    if (ph !== 'idle') { svg('path', { d: `M${PX - 50} ${GY} q10 -6 20 0z`, style: 'fill:var(--soilC)' }, fig); txt(fig, 6, GY - 4, 'csekély furadék', 't-sm halo'); }
    // ---------- monitor
    const mx = 412, my = 8, mw = 240, mh = 384;
    rect(fig, mx, my, mw, mh, 'fill:var(--plan)', { rx: 12 });
    const ink = 'fill:var(--plan-ink)';
    txt(fig, mx + 14, my + 22, 'MONITOR · CSAVART CÖLÖP', 't-sm', { style: ink + ';font-weight:700;letter-spacing:.06em;font-size:11px' });
    const zShow = ph === 'drill' || ph === 'stuck' ? z : ph === 'conc' ? zc : ph === 'idle' ? 0 : 0;
    txt(fig, mx + 14, my + 56, `${fmt(zShow, 1)} m`, 't-num', { style: 'fill:#f0864a;font-size:26px' });
    txt(fig, mx + 14, my + 72, ph === 'conc' ? 'a fúrófej mélysége – betonozás' : 'a fúrófej mélysége', 't-sm', { style: 'fill:var(--plan-ink);opacity:.7;font-size:11px' });
    // nyomaték–mélység
    const gx0 = mx + 40, gx1 = mx + mw - 14, gy0 = my + 96, gy1 = my + mh - 70;
    rect(fig, gx0, gy0, gx1 - gx0, gy1 - gy0, 'fill:none;stroke:var(--plan-line)');
    const TX = (T) => gx0 + (Math.min(T, 520) / 520) * (gx1 - gx0), ZY = (zz2) => gy0 + (zz2 / 20) * (gy1 - gy0);
    line(fig, TX(TMAX), gy0, TX(TMAX), gy1, 'stroke:#e05a4a;stroke-width:1.4;stroke-dasharray:4 3');
    txt(fig, TX(TMAX) - 4, gy1 - 6, 'gép határa', 't-sm', { style: 'fill:#e88;font-size:10px', 'text-anchor': 'end' });
    for (let k = 0; k <= 20; k += 5) txt(fig, gx0 - 6, ZY(k) + 4, String(k), 't-sm', { style: 'fill:var(--plan-ink);opacity:.7;font-size:11px', 'text-anchor': 'end' });
    for (const T of [0, 200, 400]) txt(fig, TX(T), gy0 - 6, String(T), 't-sm', { style: 'fill:var(--plan-ink);opacity:.7;font-size:11px', 'text-anchor': 'middle' });
    txt(fig, gx1, gy0 - 18, 'nyomaték (kNm)', 't-sm', { style: 'fill:var(--plan-ink);opacity:.8;font-size:11px', 'text-anchor': 'end' });
    if (trace.length > 1) svg('path', { d: pathD(trace.map(([a, b]) => [TX(b), ZY(a)])), style: 'fill:none;stroke:#f0864a;stroke-width:2.2' }, fig);
    // betonnyomás
    const pr = ph === 'conc' ? 2 + 0.8 * Math.sin(t * 3) + (zc / L) * 1.2 : 0;
    txt(fig, mx + 14, my + mh - 44, 'betonnyomás', 't-sm', { style: 'fill:var(--plan-ink);opacity:.8;font-size:11px' });
    rect(fig, mx + 14, my + mh - 36, mw - 28, 10, 'fill:var(--plan-line)', { rx: 5 });
    rect(fig, mx + 14, my + mh - 36, ((mw - 28) * pr) / 5, 10, 'fill:#4ab3e0', { rx: 5 });
    txt(fig, mx + mw - 14, my + mh - 12, ph === 'conc' ? `${fmt(pr, 1)} bar` : '—', 't-num', { style: 'fill:var(--plan-ink);font-size:13px', 'text-anchor': 'end' });
    txt(fig, mx + 14, my + mh - 12, { idle: 'készenlét', drill: 'FÚRÁS', stuck: 'ELAKADT', conc: 'BETONOZÁS', cage: 'VASALÁS', done: 'KÉSZ' }[ph], 't-num', { style: (ph === 'stuck' ? 'fill:#e88' : 'fill:#9fe0b0') + ';font-size:13px' });
    txt(fig, 10, 394, 'Szemléltető, vízszintesen 3×', 't-sm halo');
  }
  upd();
});

/* =================================================================== kvíz */
defineQuiz('helyszini', 'Kvíz – Franki és csavart cölöpök', [
  { q: 'Mi húzza le a Franki-cölöp béléscsövét a talajba?', a: ['A csőben döngölt betondugó a súrlódás révén', 'A cső tetejére mért kalapácsütések', 'A cső saját súlya', 'A cső belsejéből kiszivattyúzott talaj'], c: 0, e: 'A cső aljába töltött száraz betont a 3 t-ás ejtőkos a csőben döngöli; a dugó a súrlódás révén magával húzza a csövet – így sem talaj, sem víz nem jut bele.' },
  { q: 'Mi a Franki-cölöp „hagymája”?', a: ['A talpnál kidöngölt, kiszélesedő betontest', 'A cölöpfej fölötti fejtömb', 'A béléscső alsó, kúpos vége', 'A törzs mentén kialakuló repedéses zóna'], c: 0, e: 'Amikor már csak 30–40 cm beton marad a csőben, újabb adagokat döngölnek ki: a tömörített betontalp jelentősen megnöveli a teherbírást.' },
  { q: 'Mekkora teherbírás érhető el egy Franki-cölöppel?', a: ['2000–3000 kN', '200–300 kN', '20–30 kN', '20 000–30 000 kN'], c: 0, e: 'A Franki-cölöp legfeljebb 16–18 m hosszú, átmérője a kiszorítás miatt kb. 60 cm, és 2000–3000 kN-os teherbírás is elérhető vele.' },
  { q: 'Mi történik a talajjal, amikor csavart (talajkiszorításos) cölöpöt fúrnak?', a: ['A fúrófej oldalra tolja és tömöríti, alig jön fel furadék', 'A spirál a teljes talajtérfogatot a felszínre hozza', 'Bentonitzagy szorítja ki a talajt', 'A talajt víz alatti kotrással emelik ki'], c: 0, e: 'A különleges fej fúrás közben maga körül széttolja és tömöríti a talajt. Csak csekély furatanyag kerül a felszínre – nem kell elszállítani.' },
  { q: 'Melyik ellenállás nő elsősorban a helyben készülő csavart cölöpnél a tömörítés miatt?', a: ['A köpenymenti ellenállás', 'Csak a talpellenállás', 'A cölöp húzószilárdsága', 'Egyik sem – csak a beton szilárdsága nő'], c: 0, e: 'Előregyártott (vert) cölöpnél a talp- és a köpenymenti, a helyben készülő csavart cölöpnél elsősorban a köpenymenti ellenállás nő meg.' },
  { q: 'Hogyan kerül a vasalás a csavart cölöpbe?', a: ['A friss betonba vibrálással juttatják le', 'A fúrás előtt a talajba verik', 'A fúrószárban együtt halad le a fúrófejjel', 'A beton megszilárdulása után befúrják'], c: 0, e: 'A betonozás a fúrószáron át, a szár forgatása és kiemelése közben történik; az előregyártott betonacél armatúrát utána, a friss betonba vibrálják le.' },
  { q: 'Mekkora a csavart cölöpök járatos átmérője és legnagyobb hossza?', a: ['300–600 mm, kb. 20 m', '80–180 cm, 50 m', '10–30 cm, 6 m', '1,0–1,5 m, 40 m'], c: 0, e: 'A járatos átmérő 300–600 mm, a legnagyobb hossz kb. 20 m. A kisebb átmérő miatti kisebb tartószerkezeti teherbírás korlátozhatja a terjedését.' },
  { q: 'Melyik csavart cölöprendszer hagy csavarmenetes palástot?', a: ['Screwsol', 'Omega', 'Fundex', 'CFA'], c: 0, e: 'Sima köpenyű pl. az Omega, a Fundex, a De Waal és a CHD; csavarmenetes köpenyű a Screwsol. A CFA nem kiszorításos, hanem talajhelyettesítéses (legfeljebb részleges kiszorítású) fúrt cölöp.' },
  { q: 'Melyik talajban a legkevésbé alkalmas a csavart, talajkiszorításos cölöp?', a: ['Nagyon tömör kavicsban, kemény agyagban', 'Laza homokban', 'Közepesen tömör homokban', 'Puha–gyúrható agyagban'], c: 0, e: 'A technológia laza–közepesen tömör szemcsés, átmeneti és puha–gyúrható kötött talajban népszerű. Nagyon tömör, kemény talajban a fej nem tudja széttolni a talajt.' },
]);
