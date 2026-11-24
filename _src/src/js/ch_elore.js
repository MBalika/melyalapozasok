// ch_elore – C03 Előregyártott cölöpök: behajtási módok, vibrálás-labor, rezgés a szomszédban, kvíz
import { register, shell, slider, seg, toggle, select, stat, verdict, figure, svg, h, fmt, clear, clamp, lerp, pathD, loop, EN } from './core.js';
import { defineQuiz } from './ui.js';
import { driveScene, vibroLab, vibScene } from './proc.js';

const txt = (p, x, y, s, cls = 't-lab', extra = {}) => svg('text', { x, y, class: cls, text: s, ...extra }, p);
// SVG-felirat alsó (_) vagy felső (^) indexszel: txtI(p, x, y, ['R/R', '_0'], …) – dy-os tspan, nem baseline-shift
function txtI(p, x, y, parts, cls = 't-sm', extra = {}) {
  const t = svg('text', { x, y, class: cls, ...extra }, p); let back = 0;
  for (const s of parts) {
    const up = s[0] === '^', dn = s[0] === '_';
    const o = { text: up || dn ? s.slice(1) : s }, dy = (up ? -0.42 : dn ? 0.28 : 0);
    if (dy - back) o.dy = (dy - back).toFixed(2) + 'em';
    if (up || dn) o['font-size'] = '76%';
    back = dy; svg('tspan', o, t);
  }
  return t;
}
const rect = (p, x, y, w, hh, style, extra = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), style, ...extra }, p);
const line = (p, x1, y1, x2, y2, style) => svg('line', { x1, y1, x2, y2, style }, p);
function arr(p, x1, y1, x2, y2, color = 'var(--ink)', w = 2, hd = 7) {
  const g = svg('g', { style: `color:${color}` }, p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(g, x1, y1, x2 - Math.cos(a) * hd * 0.7, y2 - Math.sin(a) * hd * 0.7, `stroke:currentColor;stroke-width:${w};stroke-linecap:round`);
  svg('path', { d: pathD([[x2, y2], [x2 - Math.cos(a - 0.42) * hd, y2 - Math.sin(a - 0.42) * hd], [x2 - Math.cos(a + 0.42) * hd, y2 - Math.sin(a + 0.42) * hd]], true), style: 'fill:currentColor' }, g);
  return g;
}
const PAT = { soilA: 'pat-sand', soilB: 'pat-clay', soilC: 'pat-soil', soilD: 'pat-gravel', soilE: 'pat-clay', soilF: 'pat-peat', rock: 'pat-rock' };
function soilRect(p, x, y, w, hh, key) {
  rect(p, x, y, w, hh, `fill:var(--${key})`);
  rect(p, x, y, w, hh, `fill:url(#${PAT[key] || 'pat-soil'})`, { opacity: 0.6 });
}
function meterBar(label, n, note) {
  const bar = h('span', { class: 'elo-meter' }, ...[1, 2, 3, 4, 5].map((k) => h('i', { class: k <= n ? 'on' : '' })));
  return h('div', { class: 'elo-rate' }, h('span', { class: 'l' }, label), bar, note ? h('span', { class: 'n' }, note) : null);
}

/* =================================================================== 1. behajtási módok */
const MODES = {
  veres: { t: 'Verés', zaj: 5, rez: 5, teh: 5, talaj: 'laza–közepes talajok; kőzet, kemény betelepülés nem', hasz: 'nagy teherbírású vb. és acélcölöpök', note: 'Ejtőkos, dízel- vagy hidraulikus kos: minden ütés egy lökés a talajba – a környezet ezt hallja és érzi.' },
  vibro: { t: 'Vibrálás', zaj: 4, rez: 4, teh: 4, talaj: 'elsősorban szemcsés talajok', hasz: 'acél csőcölöpök, H-profilok, szádpallók, vb. cölöpök', note: 'A talajhoz hangolt rezgés ideiglenesen „elfolyósítja” a cölöp körüli talajt – a cölöp szinte „belecsúszik” a talajba.' },
  sajto: { t: 'Sajtolás', zaj: 1, rez: 1, teh: 2, talaj: 'puhább talajok', hasz: 'kisebb teherbírású cölöpök, főleg mikrocölöpök', note: 'A sajtó egy ellensúlyra (vagy meglévő szerkezetre) támaszkodva lökethosszanként nyomja le a cölöpöt.' },
  csavar: { t: 'Csavarás', zaj: 1, rez: 1, teh: 1, talaj: 'ahol a csavar menetet tud vágni (nem köves)', hasz: 'talajcsavarok: könnyű házak, napelemparkok, lelátók', note: 'A forgatófej „dugóhúzóként” hajtja le a menetes szárat – nincs ütés, nincs furadék.' },
};
register('elo-modok', (root) => {
  const { ctrls, viz, out } = shell(root);
  const m = seg(ctrls, { label: 'Módszer', options: Object.entries(MODES).map(([v, o]) => ({ v, t: o.t })), value: 'veres', vert: true });
  const rates = h('div', { class: 'elo-rates' });
  ctrls.append(rates);
  const fig = figure(viz, 520, 268);
  const note = h('p', { class: 'small muted elo-note' });
  viz.append(note);
  const oT = stat(out, { label: 'Alkalmas talaj' });
  const oH = stat(out, { label: 'Jellemző felhasználás' });
  oT.el.classList.add('elo-tstat'); oH.el.classList.add('elo-tstat');
  // a jelenetek hossza (s): a végén néhány másodpercig kitart a végállapot, aztán újraindul
  const CYC = { veres: 19, vibro: 13.5, sajto: 18, csavar: 12 };
  let mode = 'veres', t0 = null;
  function setMode(v) {
    mode = v; t0 = null;
    const o = MODES[v];
    clear(rates); rates.append(meterBar('Zaj', o.zaj), meterBar('Rezgés', o.rez), meterBar('Teherbírás', o.teh));
    oT.set(0, null, o.talaj); oH.set(0, null, o.hasz); note.textContent = o.note;
  }
  m.on(setMode); setMode('veres');
  const draw = (t) => { if (t0 == null) t0 = t; driveScene(fig, mode, (t - t0) % CYC[mode], { name: MODES[mode].t.toUpperCase() }); };
  loop(root, (t) => draw(t));
  draw(0);
});

/* =================================================================== 3. vibrálás – rezonancia */
const VSOIL = {
  laza: { t: 'Laza homok', f0: 22, z: 0.22, k: 0.85, key: 'soilA' },
  tomor: { t: 'Tömör homok', f0: 28, z: 0.25, k: 0.75, key: 'soilD' },
  agyag: { t: 'Kötött agyag', f0: 14, z: 0.5, k: 0.28, key: 'soilB' },
};
register('elo-vibro', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sS = seg(ctrls, { label: 'Talaj', options: Object.entries(VSOIL).map(([v, o]) => ({ v, t: o.t })), value: 'laza' });
  const sF = slider(ctrls, { label: 'Rezgésszám', sym: 'f', min: 4, max: 45, step: 0.5, value: 8, unit: 'Hz', d: 1 });
  ctrls.append(h('p', { class: 'ctl-hint' }, 'Tipp: keresd a görbe mélypontját – ott a legkisebb a talaj ellenállása.'));
  const fig = figure(viz, 660, 330);
  const ver = verdict(viz);
  const oF = stat(out, { label: 'Rezgésszám', unit: 'Hz', d: 1 });
  const oR = stat(out, { label: 'Talajellenállás (R / R<sub>0</sub>)', unit: '%', d: 0 });
  const oV = stat(out, { label: 'Behatolás (szemléltető)', unit: 'm/perc', d: 1 });
  // excentrikus (forgó tömegű) gerjesztés: az amplitúdó 0-ról indul, a talaj önrezgésszáma körül csúcsosodik
  const ampl = (f, S) => { const r = f / S.f0; return (r * r) / Math.sqrt((1 - r * r) ** 2 + (2 * S.z * r) ** 2); };
  const AMX = {}; const amax = (S) => AMX[S.f0] || (AMX[S.f0] = Math.max(...Array.from({ length: 900 }, (_, i) => ampl(1 + i * 0.1, S))));
  const ratio = (f, S) => { const a = ampl(f, S) / amax(S); return 1 - S.k * a; };
  const speed = (rr) => 6 * Math.max(0, 1 - rr * 1.6) / (1 - 0.0);
  let pen = 0;
  [sS, sF].forEach((c) => c.on(() => upd()));
  function upd() {
    const S = VSOIL[sS.v], f = sF.v, rr = ratio(f, S), v = speed(rr);
    oF.set(f); oR.set(rr * 100, rr < 0.4 ? 'ok' : rr < 0.62 ? 'warn' : 'bad'); oV.set(v, v > 2 ? 'ok' : v > 0 ? 'warn' : 'bad');
    const fopt = S.f0 / Math.sqrt(1 - 2 * S.z * S.z);
    let tt, s, body;
    if (sS.v === 'agyag') { s = v > 0.5 ? 'warn' : 'bad'; tt = 'Kötött talajban a vibrálás gyenge'; body = `A kohézió miatt a rezgés alig csökkenti az ellenállást (legjobb esetben is csak kb. ${fmt(S.k * 100, 0)} %-kal). Ide inkább verés, sajtolás vagy fúrt technológia kell.`; }
    else if (rr < 0.4) { s = 'ok'; tt = 'Ráhangoltál!'; body = `≈ ${fmt(fopt, 0)} Hz körül a talaj ellenállása ideiglenesen a minimumra csökken – a cölöp szinte „belecsúszik” a talajba.`; }
    else if (f < 10) { s = 'bad'; tt = 'Túl alacsony rezgésszám'; body = 'Ilyen lassú rezgésnél a talaj még nem „folyósodik el”, viszont a közeli épületek szerkezetei ebben a tartományban rezonálhatnak – indításkor és leállításkor ezen gyorsan kell áthaladni.'; }
    else { s = 'warn'; tt = 'Még nem az igazi'; body = `Az optimum ≈ ${fmt(fopt, 0)} Hz körül van – ${f < fopt ? 'növeld' : 'csökkentsd'} a rezgésszámot.`; }
    ver.set(s, tt, `<span>${body}</span>`);
  }
  loop(root, (t, dt) => {
    const S = VSOIL[sS.v], rr = ratio(sF.v, S), v = speed(rr);
    pen += (v / 60) * dt * 4; if (pen > 4) pen = 0;
    draw(t, S, rr);
  });
  const left = svg('svg', { x: 0, y: 0, width: 300, height: 330, viewBox: '0 0 300 330' }, fig);
  const gr = svg('g', {}, fig);
  function draw(t, S, rr) {
    clear(gr);
    const f = sF.v, a = ampl(f, S) / amax(S);
    vibroLab(left, t, { soil: sS.v, f, a, rr, pen });
    const fig = gr;
    // grafikon
    const x0 = 340, x1 = 645, y0 = 30, y1 = 270, F0 = 4, F1 = 45;
    const X = (ff) => x0 + ((ff - F0) / (F1 - F0)) * (x1 - x0), Yv = (v) => y1 - v * (y1 - y0);
    rect(fig, X(4), y0, X(10) - X(4), y1 - y0, 'fill:var(--warn)', { opacity: 0.12 });
    txt(fig, 0, 0, 'épület-rezonancia', 't-sm', { 'text-anchor': 'middle', transform: `translate(${(X(4) + X(10)) / 2 + 4},${(y0 + y1) / 2}) rotate(-90)` });
    line(fig, x0, y1, x1, y1, 'stroke:var(--line2)'); line(fig, x0, y0, x0, y1, 'stroke:var(--line2)');
    for (let ff = 5; ff <= 45; ff += 5) { line(fig, X(ff), y1, X(ff), y1 + 4, 'stroke:var(--muted)'); txt(fig, X(ff), y1 + 16, String(ff), 't-sm', { 'text-anchor': 'middle' }); }
    txt(fig, x1, y1 + 36, 'f (Hz)', 't-sm', { 'text-anchor': 'end' });
    for (const v of [0, 0.5, 1]) txt(fig, x0 - 6, Yv(v) + 4, fmt(v * 100, 0) + '%', 't-sm', { 'text-anchor': 'end' });
    const pa = [], pr = [];
    for (let ff = F0; ff <= F1; ff += 0.5) { pa.push([X(ff), Yv(ampl(ff, S) / amax(S))]); pr.push([X(ff), Yv(ratio(ff, S))]); }
    svg('path', { d: pathD(pa), style: 'fill:none;stroke:var(--muted);stroke-width:1.6;stroke-dasharray:5 4' }, fig);
    svg('path', { d: pathD(pr), style: 'fill:none;stroke:var(--grp);stroke-width:2.6' }, fig);
    txtI(fig, x1 - 4, y0 + 2, ['talajellenállás R/R', '_0'], 't-sm t-grp halo', { 'text-anchor': 'end' });
    txt(fig, x1 - 4, y0 + 22, 'rezgési amplitúdó', 't-sm halo', { 'text-anchor': 'end' });
    line(fig, X(f), y0, X(f), y1, 'stroke:var(--accent);stroke-width:1.4');
    svg('circle', { cx: X(f), cy: Yv(rr), r: 6, style: 'fill:var(--accent);stroke:var(--surface);stroke-width:2' }, fig);
    txt(fig, x0, y1 + 52, 'Szemléltető modell', 't-sm');
  }
  upd();
});

/* =================================================================== 4. rezgés a szomszédban */
// v = v10 · (10 / r)^n  [mm/s] – szemléltető nagyságrendek
const TECH = {
  vert: { t: 'Vert vb. cölöp (kos)', v10: 12, n: 1.1, en: true },
  vibro: { t: 'Vibrált cölöp', v10: 8, n: 1.2, peak: 1.6 },
  sajtolt: { t: 'Sajtolt cölöp', v10: 0.4, n: 1.2 },
  csavar: { t: 'Talajcsavar', v10: 0.2, n: 1.3 },
  csavart: { t: 'Csavart (helyszíni) cölöp', v10: 0.5, n: 1.3 },
  cfa: { t: 'Fúrt CFA-cölöp', v10: 0.4, n: 1.3 },
};
const BLD = { ipari: { t: 'Ipari vb. váz', lim: 20 }, lakas: { t: 'Lakóház', lim: 5 }, mu: { t: 'Műemlék, érzékeny', lim: 3 } };
register('elo-rezges', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sT = select(ctrls, { label: 'Technológia', options: Object.entries(TECH).map(([v, o]) => ({ v, t: o.t })), value: 'vert' });
  const sE = slider(ctrls, { label: 'Ütési energia', sym: 'E', min: 10, max: 80, step: 1, value: 30, unit: 'kJ', d: 0 });
  const sB = seg(ctrls, { label: 'Szomszéd épület', options: Object.entries(BLD).map(([v, o]) => ({ v, t: o.t })), value: 'lakas', vert: true });
  const sR = slider(ctrls, { label: 'Távolság a cölöptől', sym: 'r', min: 2, max: 60, step: 0.5, value: 8, unit: 'm', d: 1 });
  const fig = figure(viz, 660, 420);
  const scene = svg('svg', { x: 0, y: 0, width: 660, height: 200, viewBox: '0 0 660 200' }, fig);
  const gr = svg('g', {}, fig);
  const ver = verdict(viz);
  const oV = stat(out, { label: 'Rezgéssebesség a szomszédnál', unit: 'mm/s', d: 1 });
  const oL = stat(out, { label: 'Határérték (nagyságrend)', unit: 'mm/s', d: 0 });
  const oU = stat(out, { label: 'Kihasználtság', unit: '%', d: 0 });
  const oM = stat(out, { label: 'Ehhez szükséges távolság', unit: 'm', d: 1 });
  const v10 = (k) => { const T = TECH[k]; return T.en ? T.v10 * Math.sqrt(sE.v / 30) : T.v10; };
  const vAt = (k, r) => v10(k) * Math.pow(10 / r, TECH[k].n);
  [sT, sE, sB, sR].forEach((c) => c.on(() => upd()));
  function upd() {
    sE.el.style.display = TECH[sT.v].en ? '' : 'none';
    const T = TECH[sT.v], B = BLD[sB.v], v = vAt(sT.v, sR.v) * (T.peak || 1), u = v / B.lim;
    const rmin = 10 * Math.pow((v10(sT.v) * (T.peak || 1)) / B.lim, 1 / T.n);
    oV.set(v, u > 1 ? 'bad' : u > 0.7 ? 'warn' : 'ok', v < 0.1 ? '< 0,1' : null); oL.set(B.lim); oU.set(u * 100, u > 1 ? 'bad' : u > 0.7 ? 'warn' : 'ok');
    oM.set(Math.max(rmin, 0), null, rmin < 2 ? '< 2' : null);
    const pk = T.peak ? ' (az indítás–leállás rezonanciacsúcsával)' : '';
    const vT = v < 0.1 ? '< 0,1' : '≈ ' + fmt(v, 1);
    if (u > 1) ver.set('bad', 'Túl nagy rezgés', `<span>${T.t}, ${fmt(sR.v, 1)} m-re: ${vT} mm/s${pk}. Ez a határérték (${B.t.toLowerCase()}: kb. ${B.lim} mm/s) ${fmt(u * 100, 0)} %-a. Legalább ≈ ${fmt(rmin, 0)} m távolság, vagy zaj- és rezgésszegény technológia kell.</span>`);
    else if (u > 0.7) ver.set('warn', 'Határeset – mérni kell', `<span>${vT} mm/s${pk}: közel a határhoz. A munka alatt rezgésmérővel kell figyelni a szomszédot.</span>`);
    else ver.set('ok', 'Elviselhető rezgés', `<span>${vT} mm/s${pk} – a határérték ${fmt(u * 100, 0)} %-a. ${sT.v === 'vert' ? 'Közelebb érve vagy nagyobb energiával ez gyorsan megváltozik.' : 'Ez a technológia érzékeny környezetben is jó választás lehet.'}</span>`);
  }
  loop(root, (t) => draw(t));
  function draw(t) {
    clear(gr);
    const T = TECH[sT.v], B = BLD[sB.v], r = sR.v;
    const v = vAt(sT.v, r) * (T.peak || 1), u = v / B.lim;
    const X = (m) => 70 + (m / 60) * 510;
    const col = u > 1 ? 'var(--bad)' : u > 0.7 ? 'var(--warn)' : 'var(--ok)';
    vibScene(scene, t, { tech: sT.v, bld: sB.v, r, v, u, v10: v10(sT.v) * (T.peak || 1), vtxt: v < 0.1 ? '< 0,1' : fmt(v, 1) });
    const fig = gr;
    // grafikon – log y
    const cx0 = 70, cx1 = X(60), cy0 = 232, cy1 = 376, LMIN = -1, LMAX = 2;
    const Yl = (vv) => clamp(cy1 - ((Math.log10(Math.max(vv, 0.1)) - LMIN) / (LMAX - LMIN)) * (cy1 - cy0), cy0 - 6, cy1);
    line(fig, cx0, cy1, cx1, cy1, 'stroke:var(--line2)'); line(fig, cx0, cy0, cx0, cy1, 'stroke:var(--line2)');
    for (const vv of [0.1, 1, 10, 100]) { line(fig, cx0, Yl(vv), cx1, Yl(vv), 'stroke:var(--line);stroke-width:1'); txt(fig, cx0 - 6, Yl(vv) + 4, fmt(vv, vv < 1 ? 1 : 0), 't-sm', { 'text-anchor': 'end' }); }
    txt(fig, cx0 - 6, cy0 - 8, 'mm/s', 't-sm', { 'text-anchor': 'end' });
    for (let m = 0; m <= 60; m += 10) txt(fig, X(m), cy1 + 15, String(m), 't-sm', { 'text-anchor': 'middle' });
    txt(fig, cx1, cy1 + 36, 'távolság (m)', 't-sm', { 'text-anchor': 'end' });
    for (const [k, Tk] of Object.entries(TECH)) {
      const pts = []; for (let m = 2; m <= 60; m += 1) pts.push([X(m), Yl(vAt(k, m) * (Tk.peak || 1))]);
      const on = k === sT.v;
      svg('path', { d: pathD(pts), style: `fill:none;stroke:${on ? 'var(--grp)' : 'var(--faint)'};stroke-width:${on ? 3 : 1.2}`, opacity: on ? 1 : 0.8 }, fig);
    }
    line(fig, cx0, Yl(B.lim), cx1, Yl(B.lim), `stroke:var(--bad);stroke-width:1.4;stroke-dasharray:6 4`);
    txt(fig, cx0 + 6, Yl(B.lim) - 5, `határ: ${B.t.toLowerCase()} ≈ ${B.lim} mm/s`, 't-sm t-bad halo');
    svg('circle', { cx: X(r), cy: Yl(v), r: 6, style: `fill:${col};stroke:var(--surface);stroke-width:2` }, fig);
    const yc = Yl(vAt(sT.v, 44) * (T.peak || 1)), yl = Yl(B.lim);
    txt(fig, X(44), Math.abs(yc - yl) < 15 ? Math.max(yc, yl) + 15 : yc - 9, T.t, 't-sm t-grp halo', { 'text-anchor': 'middle' });
    txtI(fig, cx1, cy0 - 8, ['Szemléltető modell: v = v', '_10', '·(10 m / r)', '^n'], 't-sm', { 'text-anchor': 'end' });
  }
  upd();
});

/* =================================================================== kvíz */
defineQuiz('elore', 'Kvíz – előregyártott cölöpök', [
  { q: 'Miért nő a vert előregyártott cölöp talp- <i>és</i> köpenymenti ellenállása is?', a: ['Mert a kiszorítás tömöríti a cölöp körüli és alatti talajt', 'Mert a verés közben a beton szilárdsága megnő', 'Mert a talajvíz a verés hatására végleg eltávozik', 'Mert a cölöp felülete érdesebb, mint a fúrt cölöpé'], c: 0, e: 'A talajkiszorításos cölöp nem hoz fel talajt: széttolja és tömöríti. Előregyártott cölöpnél ettől a talp- és a köpenymenti ellenállás is nő.' },
  { q: 'Melyik rétegen <b>nem</b> lehet átverni egy előregyártott vasbeton cölöpöt?', a: ['Erősen cementálódott, vékony pad', 'Laza homok', 'Puha, iszapos agyag', 'Talajvíz alatti finom homok'], c: 0, e: 'Kőzetben, sziklás talajban, kemény (köves) agyagban, erősen cementálódott talajban és tömbös feltöltésben a verés nem alkalmazható – egy vékony betelepülés is megállíthatja a cölöpöt.' },
  { q: 'Verés közben a beverődés a tervezett talpmélység <b>felett</b> szinte nullára csökken. Mit jelent ez?', a: ['A cölöp elakadt: valószínűleg kemény betelepülésre ért', 'Elérte a teherbíró réteget, készen vagyunk', 'A kos energiája túl nagy', 'A talajvíz felúsztatja a cölöpöt'], c: 0, e: 'Ha a cölöp a tervezett mélység felett áll meg, valami az útjában van. Ilyenkor nem szabad „erővel” tovább verni: a cölöpfej megsérülhet, és a talp sem a tervezett rétegben áll.' },
  { q: 'Hol előnyös az acél csőcölöp?', a: ['Felül puha, laza talaj, alatta tömör szemcsés réteg', 'Ha a felszín közelében kőzet van', 'Nagyon kemény, köves agyagban', 'Ha a cölöpnek fából kell lennie'], c: 0, e: 'A csőcölöp a puha rétegen átjutva a tömör szemcsés rétegbe „beleáll”. Keményebb rétegekhez a H-profil a jobb, mert jobban verhető.' },
  { q: 'Belvárosi foghíjtelek, rezgésre érzékeny szomszéd épület. Melyik a legkockázatosabb cölöptechnológia?', a: ['Vert előregyártott vasbeton cölöp', 'Fúrt CFA-cölöp', 'Csavart, talajkiszorításos cölöp', 'Mikrocölöp'], c: 0, e: 'A verés nagy zajjal és rezgéssel jár, építmények közelében csak erős korlátok mellett alkalmazható. A fúrt, csavart és mikrocölöpök zaj- és rezgésszegények.' },
  { q: 'Milyen talajban hatékony elsősorban a vibrálás?', a: ['Szemcsés talajban', 'Kötött, kemény agyagban', 'Kőzetben', 'Szerves, tőzeges talajban'], c: 0, e: 'A talaj önrezgésszámához hangolt rezgés szemcsés talajban ideiglenesen a minimumra csökkenti az ellenállást. Kötött talajban a kohézió miatt ez a hatás kicsi.' },
  { q: 'Öblítéssel egyidejű vibrálásnál mikor kell az öblítést abbahagyni?', a: ['A cölöpcsúcs (végleges talpmélység) elérése előtt 1–2 m-rel', 'Már a felső 1–2 m után', 'Csak a végleges talpmélység elérésekor', 'Soha, az öblítés végig mehet'], c: 0, e: 'Az öblítést 1–2 m-rel a végleges talpmélység előtt abba kell hagyni, hogy a talp alatti talaj ne lazuljon fel. Utólag a talpat a csöveken át injektálni is lehet.' },
  { q: 'Melyik jellemző a talajcsavarra?', a: ['40–60 cm-ként egy-egy menet az üreges száron, jellemzően legfeljebb 2–4 m', 'Folyamatos spirál végig, 10–15 m hosszban', 'Nagy átmérőjű vasbeton törzs, kontraktorcsöves betonozással', 'Csak veréssel juttatható le'], c: 0, e: 'A talajcsavar nem folyamatos spirállal készül: 40–60 cm-ként van rajta egy-egy menet. Kis terhelésű, 1–2 szintes könnyűszerkezetes házakhoz, napelemparkokhoz, lelátókhoz használják.' },
  { q: 'Miért tartós a facölöp a talajvízszint alatt?', a: ['Mert oxigén hiányában a fa nem korhad', 'Mert a víz kioldja belőle a gyantát', 'Mert a víz alatt a fa megkövesedik', 'Mert ott nagyobb a földnyomás'], c: 0, e: 'Víz alatt, oxigén nélkül a korhasztó gombák és a rovarok nem élnek meg. Ha a talajvízszint lesüllyed, a cölöpfejek a levegőre kerülnek és korhadni kezdenek.' },
]);
