// C02 – Cölöpök rendszere: teherátadás-labor, cölöpcsoport-igénybevétel, rendező játék, átmérő-skála, családfa
import { $, $$, h, svg, figure, clear, fmt, clamp, lerp, register, shell, slider, seg, toggle, stat, verdict, arrow, pathD, loop } from './core.js';
import { defineQuiz } from './ui.js';

const NB = ' ';
const T = (parent, x, y, text, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text, ...o }, parent);
const hatch = (parent, x, y, w, hh, cls, pat, op = 0.55) => {
  svg('rect', { x, y, width: w, height: hh, class: cls }, parent);
  svg('rect', { x, y, width: w, height: hh, fill: `url(#${pat})`, opacity: op }, parent);
};
const conc = (parent, x, y, w, hh, cls = 'f-conc') => {
  svg('rect', { x, y, width: w, height: hh, class: cls }, parent);
  svg('rect', { x, y, width: w, height: hh, fill: 'url(#pat-conc)', opacity: 0.7 }, parent);
  svg('rect', { x, y, width: w, height: hh, fill: 'none', class: 's-ink', 'stroke-width': 0.8, opacity: 0.45 }, parent);
};
const kN = (v) => `${fmt(v, 0)}${NB}kN`;

/* ================================================================ 2.1 teherátadás-labor */
// szemléltető egységnyi ellenállások: q_s – köpenymenti (kPa), q_b – talp (kPa)
const PROF = {
  A: { t: 'Puha agyag, alatta tömör kavics', good: true, L: [
    { n: 'puha agyag', cls: 'f-soilB', pat: 'pat-clay', qs: () => 15, qb: () => 180 },
    { n: 'tömör homokos kavics', cls: 'f-soilD', pat: 'pat-gravel', qs: () => 90, qb: () => 6000 }] },
  C: { t: 'Laza homok, alatta tömör homok', good: true, L: [
    { n: 'laza homok', cls: 'f-soilA', pat: 'pat-sand', qs: () => 22, qb: () => 1500 },
    { n: 'tömör homok', cls: 'f-soilD', pat: 'pat-sand', qs: () => 65, qb: () => 4500 }] },
  B: { t: 'Vastag agyag, nincs jobb réteg', good: false, L: [
    { n: 'közepes–kemény agyag (lefelé szilárdul)', cls: 'f-soilB', pat: 'pat-clay', qs: (z) => 30 + 1.5 * z, qb: (z) => 9 * (40 + 3 * z) }] },
};
register('rsz-teher', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sP = seg(ctrls, { label: 'Rétegződés', vert: true, options: Object.entries(PROF).map(([v, p]) => ({ v, t: p.t })), value: 'A' });
  const sG = slider(ctrls, { label: 'A jobb réteg teteje', min: 4, max: 20, step: 0.5, value: 10, unit: 'm', d: 1 });
  const sL = slider(ctrls, { label: 'Cölöphossz', sym: 'L', min: 4, max: 30, step: 0.5, value: 13, unit: 'm', d: 1 });
  const sD = slider(ctrls, { label: 'Átmérő', sym: 'D', min: 0.3, max: 1.5, step: 0.05, value: 0.6, unit: 'm', d: 2 });
  const s = figure(viz, 560, 420);
  const oB = stat(out, { label: 'Talpellenállás R<sub>b</sub>' });
  const oS = stat(out, { label: 'Köpenymenti ellenállás R<sub>s</sub>' });
  const oR = stat(out, { label: 'Összesen R' });
  const oP = stat(out, { label: 'A talp részaránya', unit: '%', d: 0 });
  const vd = verdict(null); out.append(vd.el); vd.el.style.gridColumn = '1 / -1';
  const G = 44, K = 11.2, Y = (z) => G + z * K;
  function calc() {
    const P = PROF[sP.v], zg = sG.v, L = sL.v, D = sD.v;
    const layerAt = (z) => (P.L.length === 1 || z < zg ? P.L[0] : P.L[1]);
    let Rs = 0; const dz = 0.1, seg_ = [];
    for (let z = dz / 2; z < L; z += dz) { const q = layerAt(z).qs(z); Rs += Math.PI * D * q * dz; }
    for (let z = 1; z < L; z += 2) seg_.push([z, layerAt(z).qs(z)]);
    const tipL = layerAt(L - 0.01), qb = tipL.qb(L);
    const Rb = Math.PI * D * D / 4 * qb;
    const inGood = P.L.length > 1 && L > zg;
    return { P, zg, L, D, Rs, Rb, R: Rs + Rb, f: Rb / (Rs + Rb), seg: seg_, qb, inGood, emb: L - zg };
  }
  function draw() {
    const c = calc(); clear(s);
    sG.el.style.opacity = c.P.L.length > 1 ? 1 : 0.4; sG.input.disabled = c.P.L.length === 1;
    svg('rect', { x: 0, y: 0, width: 560, height: G, class: 'f-sky' }, s);
    const zmax = (420 - G) / K;
    if (c.P.L.length === 1) hatch(s, 0, G, 380, 420 - G, c.P.L[0].cls, c.P.L[0].pat);
    else { hatch(s, 0, G, 380, Y(c.zg) - G, c.P.L[0].cls, c.P.L[0].pat); hatch(s, 0, Y(c.zg), 380, 420 - Y(c.zg), c.P.L[1].cls, c.P.L[1].pat); svg('line', { x1: 0, y1: Y(c.zg), x2: 380, y2: Y(c.zg), class: 's-soil', 'stroke-width': 1.3 }, s); }
    svg('line', { x1: 0, y1: G, x2: 380, y2: G, class: 's-ink', 'stroke-width': 1.5 }, s);
    T(s, 8, G + 16, c.P.L[0].n, 't-sm halo');
    if (c.P.L.length > 1) T(s, 8, 410, c.P.L[1].n, 't-sm halo');
    // mélységskála
    for (let z = 5; z < zmax; z += 5) { svg('line', { x1: 372, y1: Y(z), x2: 380, y2: Y(z), class: 's-muted', 'stroke-width': 1 }, s); T(s, 368, Y(z) + 4, `${z}${NB}m`, 't-sm halo', { 'text-anchor': 'end' }); }
    // cölöp (átmérő torzítva)
    const cx = 190, pw = Math.max(12, c.D * K * 2.6);
    conc(s, cx - 34, G - 14, 68, 14);
    conc(s, cx - pw / 2, G, pw, Y(c.L) - G, 'f-conc2');
    arrow(s, cx, 4, cx, G - 16, { cls: 's-ink', w: 3, head: 9 });
    T(s, cx + 8, 16, 'F', 't-num');
    // köpeny-nyilak
    const qsMax = 95;
    for (const [z, q] of c.seg) {
      const len = 5 + 26 * (q / qsMax), y = Y(z);
      for (const sx of [-1, 1]) arrow(s, cx + sx * (pw / 2 + 5 + len * 0.15), y + len * 0.5, cx + sx * (pw / 2 + 5 + len * 0.15), y - len * 0.5, { cls: 's-ok', w: 1.8, head: 5.5 });
    }
    // talp-nyilak
    const tl = 10 + 62 * c.f;
    for (const dx of [-pw * 0.3, 0, pw * 0.3]) arrow(s, cx + dx, Y(c.L) + tl + 4, cx + dx, Y(c.L) + 3, { cls: 's-acc', w: 2.4, head: 7 });
    if (c.inGood) {
      svg('line', { x1: cx + pw / 2 + 36, y1: Y(c.zg), x2: cx + pw / 2 + 36, y2: Y(c.L), class: 's-ink', 'stroke-width': 1 }, s);
      T(s, cx + pw / 2 + 41, (Y(c.zg) + Y(c.L)) / 2 + 4, `befogás ${fmt(c.emb, 1)}${NB}m`, 't-sm halo');
    }
    T(s, cx + pw / 2 + 8, Y(c.L) + 20, `L = ${fmt(c.L, 1)}${NB}m`, 't-num halo');
    // arány-oszlop
    const bx = 430, bw = 46, by0 = 74, bh = 306;
    svg('rect', { x: bx, y: by0, width: bw, height: bh, rx: 6, class: 'f-bg2' }, s);
    const hb = bh * c.f;
    svg('rect', { x: bx, y: by0 + bh - hb, width: bw, height: hb, rx: 6, class: 'f-acc', opacity: 0.85 }, s);
    svg('rect', { x: bx, y: by0, width: bw, height: bh - hb, rx: 6, class: 'f-ok', opacity: 0.75 }, s);
    for (const [fr, lb] of [[1 / 3, '33 %'], [2 / 3, '66 %']]) {
      const y = by0 + bh - bh * fr;
      svg('line', { x1: bx - 6, y1: y, x2: bx + bw + 6, y2: y, class: 's-ink', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, s);
      T(s, bx - 9, y + 4, lb, 't-sm halo', { 'text-anchor': 'end' });
    }
    svg('rect', { x: bx - 2, y: by0 - 50, width: 10, height: 10, rx: 2, class: 'f-ok' }, s); T(s, bx + 12, by0 - 41, 'köpeny', 't-sm');
    svg('rect', { x: bx - 2, y: by0 - 28, width: 10, height: 10, rx: 2, class: 'f-acc' }, s); T(s, bx + 12, by0 - 19, 'talp', 't-sm');
    const yb = by0 + bh - hb;
    svg('path', { d: `M${bx + bw + 2} ${yb} l8 -6 v12 z`, class: 'f-ink' }, s);
    const zone = c.f >= 2 / 3 ? 'all' : c.f <= 1 / 3 ? 'leb' : 'veg';
    const ZL = [['all', 'ÁLLÓ', by0 + bh * (1 / 6)], ['veg', 'VEGYES', by0 + bh / 2], ['leb', 'LEBEGŐ', by0 + bh * (5 / 6)]];
    // a felső harmad = csak talp > 2/3 → a sáv alján a talp; a zóna a talp részarányától függ
    for (const [k, lb, y] of ZL) T(s, bx + bw + 10, y + 4, lb, 't-lab' + (k === zone ? ' t-grp' : ' t-sm'), { 'font-weight': k === zone ? 800 : 500 });
    T(s, bx + bw / 2, by0 + bh + 16, `${fmt(100 * c.f, 0)}${NB}% talp`, 't-num', { 'text-anchor': 'middle' });
    // kimenet
    oB.set(kN(c.Rb)); oS.set(kN(c.Rs)); oR.set(kN(c.R)); oP.set(100 * c.f, zone === 'all' ? 'ok' : zone === 'leb' ? 'warn' : null);
    let st = 'ok', ttl, txt;
    if (zone === 'all') { ttl = 'Álló cölöp'; txt = `A teherbírás ${fmt(100 * c.f, 0)}${NB}%-át a talp adja: a cölöp a jobb rétegbe „áll bele”, a köpeny mentén gyengébb talaj van.`; }
    else if (zone === 'leb') { ttl = 'Lebegő cölöp'; txt = `A teherbírás ${fmt(100 * (1 - c.f), 0)}${NB}%-át a köpenymenti ellenállás adja – a hosszú cölöp köpenye mentén adódik át a teher nagyobb része, a talp szerepe kisebb.`; }
    else { ttl = 'Vegyes (kombinált) cölöp'; txt = 'A csúcs és a köpeny hasonló arányban (33–66 % között) vesz részt a teherbírásban.'; st = ''; }
    if (c.P.L.length > 1 && !c.inGood) { st = 'warn'; txt += ` <b>A csúcs még a ${c.P.L[0].n} rétegben van</b> – hosszabbítsd meg a cölöpöt, hogy elérje a jobb réteget!`; }
    else if (c.inGood && c.emb < 1.5) { st = 'warn'; txt += ' A befogás még nagyon kicsi – az álló cölöpöt kellő mélységgel be kell fogni a teherbíró rétegbe.'; }
    vd.set(st, ttl, `<p>${txt}</p>`);
  }
  [sP, sG, sL, sD].forEach((c) => c.on(draw)); draw();
  root.append(h('div', { class: 'w-foot', html: '<b>Szemléltető modell:</b> R<sub>s</sub> = Σ π·D·q<sub>s</sub>·Δz és R<sub>b</sub> = (π·D²/4)·q<sub>b</sub>, rétegenként felvett, egyszerűsített q<sub>s</sub> és q<sub>b</sub> értékekkel. A cölöp átmérője a rajzon torzítva látszik. A valódi teherbírást a későbbi geotechnikai tárgyakban, próbaterheléssel és szabványos módszerekkel határozzátok meg.' }));
});

/* ================================================================ 2.2 cölöpcsoport-igénybevétel */
const XI = [-3.75, -1.25, 1.25, 3.75], SX2 = XI.reduce((a, x) => a + x * x, 0);
const PRESET = {
  epulet: { t: 'Épület', N: 4000, H: 0, h: 10 },
  szel: { t: 'Szél a tornyon', N: 3000, H: 600, h: 25 },
  felusz: { t: 'Felúszás', N: -1600, H: 0, h: 10 },
  vizsz: { t: 'Fékezőerő', N: 1600, H: 500, h: 3 },
};
register('rsz-csoport', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sPre = seg(ctrls, { label: 'Helyzet', options: Object.entries(PRESET).map(([v, p]) => ({ v, t: p.t })), value: 'szel' });
  const sN = slider(ctrls, { label: 'Függőleges teher', sym: 'N', min: -2000, max: 6000, step: 100, value: 3000, unit: 'kN', d: 0, hint: 'negatív: eredő felfelé (pl. felhajtóerő a mélygarázson)' });
  const sH = slider(ctrls, { label: 'Vízszintes erő', sym: 'H', min: 0, max: 1000, step: 20, value: 600, unit: 'kN', d: 0 });
  const sh = slider(ctrls, { label: 'A vízszintes erő magassága', sym: 'h', min: 0, max: 30, step: 1, value: 25, unit: 'm', d: 0, hint: 'a fejtömb felett; M = H · h' });
  const s = figure(viz, 560, 420);
  const oC = stat(out, { label: 'Legnagyobb nyomóerő' });
  const oT = stat(out, { label: 'Legnagyobb húzóerő' });
  const oM = stat(out, { label: 'Nyomaték M = H · h', unit: 'kNm', d: 0 });
  const oHp = stat(out, { label: 'Vízszintes erő cölöpönként', unit: 'kN', d: 0 });
  const vd = verdict(null); out.append(vd.el); vd.el.style.gridColumn = '1 / -1';
  let lockPre = false;
  sPre.on((k) => { const p = PRESET[k]; lockPre = true; sN.set(p.N); sH.set(p.H); sh.set(p.h); lockPre = false; tgt(); });
  [sN, sH, sh].forEach((c) => c.on(() => { tgt(); }));
  const cur = { P: [0, 0, 0, 0], H: 0, N: 0, hh: 0 };
  let goal = null;
  function tgt() {
    const N = sN.v, H = sH.v, hh = sh.v, M = H * hh;
    goal = { P: XI.map((x) => N / 4 + M * x / SX2), H, N, hh, M };
    const mx = Math.max(...goal.P), mn = Math.min(...goal.P);
    oC.set(mx > 0 ? kN(mx) : 'nincs', mx > 0 ? null : 'ok');
    oT.set(mn < 0 ? kN(-mn) : 'nincs', mn < 0 ? 'warn' : 'ok');
    oM.set(M); oHp.set(H / 4);
    let st, ttl, txt;
    if (mx <= 0) { st = 'warn'; ttl = 'Minden cölöp húzott'; txt = 'Az eredő felfelé mutat (felúszás): a cölöpök lehorgonyoznak. A terhet csak a köpeny veszi fel, a megszokottal ellentétes irányban – a talp nem dolgozik.'; }
    else if (mn < 0) { st = 'warn'; ttl = 'A szélső cölöp húzottá vált'; txt = `A nagy külpontosság (M = ${fmt(M, 0)}${NB}kNm) miatt a széllel szemközti oldalon húzás lép fel: ott csak a köpeny dolgozik, ellentétes irányban. A túloldali cölöp ${kN(mx)}-nal nyomott.`; }
    else { st = 'ok'; ttl = 'Minden cölöp nyomott'; txt = 'A terhet a cölöpök a csúcson nyomással, a köpenyen nyírással adják át a talajnak.'; }
    if (H > 0) txt += ' A vízszintes erő miatt a cölöpökben a nyomóerő mellett <b>hajlítás és nyírás</b> is ébred.';
    vd.set(st, ttl, `<p>${txt}</p>`);
    if (!lockPre) { const m = Object.entries(PRESET).find(([, p]) => p.N === N && p.H === H && p.h === hh); sPre.set(m ? m[0] : null, false); }
  }
  const G = 214, CAP = [130, 430], capT = 196, capB = 232, colW = 36, Ptip = 404;
  const PX = XI.map((x) => 280 + x * 38);
  function draw() {
    clear(s);
    svg('rect', { x: 0, y: 0, width: 560, height: G, class: 'f-sky' }, s);
    hatch(s, 0, G, 560, 420 - G, 'f-soilB', 'pat-clay');
    svg('line', { x1: 0, y1: G, x2: 560, y2: G, class: 's-ink', 'stroke-width': 1.4 }, s);
    // oszlop / torony
    const topY = 30, hY = (hh) => capT - hh * ((capT - topY) / 30);
    svg('rect', { x: 280 - colW / 2, y: topY, width: colW, height: capT - topY, class: 'f-conc2' }, s);
    conc(s, CAP[0], capT, CAP[1] - CAP[0], capB - capT);
    T(s, CAP[0] - 6, capT + 22, 'fejtömb', 't-sm halo', { 'text-anchor': 'end' });
    // cölöpök (hajlítás: a fej elmozdul)
    const defl = clamp(cur.H / 1000, 0, 1) * 10;
    cur.P.forEach((P, i) => {
      const x = PX[i];
      const d = `M${x - 8} ${capB} C${x - 8 + defl} ${capB + 50} ${x - 8} ${capB + 90} ${x - 8} ${Ptip} L${x + 8} ${Ptip} C${x + 8} ${capB + 90} ${x + 8 + defl} ${capB + 50} ${x + 8} ${capB} Z`;
      const tens = P < 0;
      svg('path', { d, class: tens ? 'f-steel' : 'f-conc2', opacity: 0.95 }, s);
      svg('path', { d, fill: 'none', class: 's-ink', 'stroke-width': 0.8, opacity: 0.5 }, s);
      const mag = Math.abs(P), len = clamp(8 + mag / 80, 8, 40);
      // a cölöperő (a fejtömb alatt)
      if (mag > 1) {
        if (!tens) arrow(s, x, capB + 4, x, capB + 4 + len, { cls: 's-bad', w: 2.6, head: 7 });
        else arrow(s, x, capB + 4 + len, x, capB + 4, { cls: 's-water', w: 2.6, head: 7 });
        // mobilizált ellenállás a köpeny mentén
        for (let y = capB + 70; y < Ptip - 14; y += 36) {
          const l = clamp(mag / 220, 3, 10);
          for (const sx of [-1, 1]) {
            if (!tens) arrow(s, x + sx * 14, y + l, x + sx * 14, y - l, { cls: 's-ok', w: 1.5, head: 4.5 });
            else arrow(s, x + sx * 14, y - l, x + sx * 14, y + l, { cls: 's-water', w: 1.5, head: 4.5 });
          }
        }
        if (!tens) for (const dx of [-4, 4]) arrow(s, x + dx, Ptip + 14, x + dx, Ptip + 2, { cls: 's-acc', w: 1.8, head: 5 });
      }
      const lab = (P >= 0 ? '+' : '−') + fmt(Math.abs(P), 0);
      const ty = i % 2 ? 300 : 280;
      svg('rect', { x: x - 34, y: ty - 14, width: 68, height: 30, rx: 7, class: 'f-surface', opacity: 0.92 }, s);
      T(s, x, ty, lab, 't-num' + (tens ? ' t-water' : ' t-bad'), { 'text-anchor': 'middle' });
      T(s, x, ty + 12, tens ? 'húzott' : 'nyomott', 't-sm', { 'text-anchor': 'middle' });
    });
    // terhek
    const nl = clamp(Math.abs(cur.N) / 120, 0, 44);
    if (cur.N > 20) arrow(s, 280, topY - 26 - 0, 280, topY + Math.min(nl, 44) - 4, { cls: 's-ink', w: 4, head: 11 });
    if (cur.N < -20) { arrow(s, 280, capB + 4, 280, capT - Math.min(nl, 44) - 10, { cls: 's-water', w: 4, head: 11 }); T(s, 300, capT - 30, 'felhajtóerő', 't-lab t-water halo'); }
    if (cur.N > 20) T(s, 298, topY - 8, `N = ${kN(cur.N)}`, 't-num halo');
    if (cur.N < -20) T(s, 300, capT - 16, `N = −${fmt(-cur.N, 0)}${NB}kN`, 't-num t-water halo');
    if (cur.H > 5) {
      const y = hY(cur.hh), l = clamp(cur.H / 12, 14, 90);
      arrow(s, 280 - colW / 2 - l - 6, y, 280 - colW / 2 - 2, y, { cls: 's-warn', w: 4, head: 11 });
      T(s, 280 - colW / 2 - 8, y - 10, `H = ${kN(cur.H)}`, 't-num halo', { 'text-anchor': 'end' });
      if (cur.hh > 1) { svg('line', { x1: 280 + colW / 2 + 16, y1: y, x2: 280 + colW / 2 + 16, y2: capT, class: 's-muted', 'stroke-width': 1 }, s); T(s, 280 + colW / 2 + 22, (y + capT) / 2 + 4, `h = ${fmt(cur.hh, 0)}${NB}m`, 't-sm halo'); }
    }
  }
  tgt();
  Object.assign(cur, { P: goal.P.slice(), H: goal.H, N: goal.N, hh: goal.hh });
  draw();
  loop(s, (t, dt) => {
    if (!goal) return;
    const k = 1 - Math.exp(-dt * 9);
    let moved = false;
    const ap = (a, b) => { const v = a + (b - a) * k; if (Math.abs(b - v) > 0.5) moved = true; return Math.abs(b - v) <= 0.5 ? b : v; };
    cur.P = cur.P.map((p, i) => ap(p, goal.P[i])); cur.H = ap(cur.H, goal.H); cur.N = ap(cur.N, goal.N); cur.hh = ap(cur.hh, goal.hh);
    if (moved || cur._last !== JSON.stringify(goal)) { draw(); cur._last = JSON.stringify(goal); }
  });
  root.append(h('div', { class: 'w-foot', html: '<b>Szemléltető modell:</b> merev fejtömb, egyforma cölöpök, P<sub>i</sub> = N/n + M·x<sub>i</sub>/Σx<sub>i</sub>² (a cölöptávolság 2,5 m). A vízszintes erőt egyenlően osztottuk el a cölöpök között.' }));
});

/* ================================================================ 2.4 készítés – ikonok */
register('rsz-kinds', (root) => {
  $$('.rsz-kic', root).forEach((el) => {
    const k = el.dataset.ki;
    const s = svg('svg', { viewBox: '-20 0 260 90', class: 'rsz-kis', 'aria-hidden': 'true' }, el);
    const G = 24;
    svg('rect', { x: -20, y: 0, width: 260, height: G, class: 'f-sky' }, s);
    hatch(s, -20, G, 260, 66, 'f-soilA', 'pat-sand');
    svg('line', { x1: -20, y1: G, x2: 240, y2: G, class: 's-ink', 'stroke-width': 1.2 }, s);
    if (k === 'h') {
      // furat + kiemelt talaj (depónia)
      svg('rect', { x: 92, y: G, width: 26, height: 60, class: 'f-sky' }, s);
      for (let y = G + 6; y < G + 60; y += 9) svg('path', { d: `M95 ${y} L115 ${y + 5}`, class: 's-steel', 'stroke-width': 2.4 }, s);
      svg('rect', { x: 103, y: 0, width: 4, height: G + 60, class: 'f-steel2' }, s);
      svg('path', { d: `M128 ${G} q14 -18 30 0 z`, class: 'f-soilA' }, s);
      svg('path', { d: `M128 ${G} q14 -18 30 0 z`, fill: 'url(#pat-sand)' }, s);
      arrow(s, 122, G + 24, 140, G - 10, { cls: 's-acc', w: 2, head: 6 });
      for (const sx of [-1, 1]) svg('path', { d: `M${105 + sx * 20} ${G + 14} l${sx * 6} 3 M${105 + sx * 20} ${G + 34} l${sx * 6} 3`, class: 's-muted', 'stroke-width': 1.2 }, s);
      T(s, 236, G + 50, 'kissé fellazul', 't-sm halo', { 'text-anchor': 'end' });
    } else {
      conc(s, 96, G - 18, 18, 76, 'f-conc2');
      svg('path', { d: `M96 ${G + 58} L105 ${G + 70} L114 ${G + 58} Z`, class: 'f-conc2' }, s);
      arrow(s, 105, 0, 105, G - 20, { cls: 's-ink', w: 3, head: 8 });
      for (let y = G + 12; y < G + 64; y += 16) { arrow(s, 120, y, 140, y, { cls: 's-grp', w: 1.8, head: 5 }); arrow(s, 90, y, 70, y, { cls: 's-grp', w: 1.8, head: 5 }); }
      T(s, 146, G + 50, 'tömörödik', 't-sm halo');
    }
  });
});

/* ================================================================ 2.4 rendező játék */
const ITEMS = [
  { t: 'CFA-cölöp', k: 'h', p: 'helyszíni', e: 'Folyamatos spirállal fúrják ki a talajt; a spirálon lévő talaj támasztja meg a furatot, a betont a fúrószáron át juttatják be.' },
  { t: 'Béléscsöves fúrt cölöp', k: 'h', p: 'helyszíni', e: 'A béléscső védelmében emelik ki a talajt, majd a cső visszahúzása közben betonoznak.' },
  { t: 'Bentonitzagyos fúrt cölöp', k: 'h', p: 'helyszíni', e: 'A furatot bentonitzagy támasztja meg, a talajt kiemelik, a betont kontraktorcsővel juttatják be.' },
  { t: 'Megtámasztás nélkül fúrt cölöp', k: 'h', p: 'helyszíni', e: 'Kötött talajban, talajvíz felett a furat rövid ideig magától is megáll – kiemelés után rögtön be kell betonozni.' },
  { t: 'Barett (markolt elem)', k: 'h', p: 'helyszíni', e: 'Résfalmarkolóval, zagy védelmében kiemelt, téglalap keresztmetszetű elem – a Petronas-tornyok is ilyeneken állnak.' },
  { t: 'Vert vasbeton cölöp', k: 'k', p: 'előregyártott', e: 'Cölöpverővel juttatják a talajba: a talajt oldalra tolja és tömöríti.' },
  { t: 'Vibrált acél csőcölöp', k: 'k', p: 'előregyártott', e: 'Vibrálás közben a cölöp kiszorítja maga körül a talajt.' },
  { t: 'Talajcsavar', k: 'k', p: 'előregyártott', e: '„Dugóhúzószerűen” csavarják be, menetet vág a talajba, és nem hozza fel.' },
  { t: 'Facölöp', k: 'k', p: 'előregyártott', e: 'Levert keményfa cölöp – régi épületek alatt gyakran „előkerül”.' },
  { t: 'Franki-cölöp', k: 'k', p: 'helyszíni', e: 'A béléscsövet a benne lévő száraz betondugóval verik le, majd talphagymát döngölnek – végig kiszorítja a talajt.' },
  { t: 'Csavart cölöp (pl. Omega, FDP)', k: 'k', p: 'helyszíni', e: 'A speciális fúrófej fúrás közben széttolja és tömöríti a talajt, alig hoz fel furatanyagot.' },
  { t: 'Sajtolt cölöp', k: 'k', p: 'előregyártott', e: 'Puhább talajban verés és vibrálás nélkül „nyomják” le – kis zajjal, kisebb teherbírású cölöpöknél.' },
];
register('rsz-valogato', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false });
  const pool = h('div', { class: 'rsz-pool', 'aria-label': 'Besorolásra váró technológiák' });
  const binH = h('div', { class: 'rsz-bin', 'data-k': 'h', tabindex: 0, role: 'button' }, h('div', { class: 'rsz-bin-h' }, h('b', {}, 'Talajhelyettesítéses'), h('small', {}, 'kiemeljük a talajt')), h('div', { class: 'rsz-bin-l' }));
  const binK = h('div', { class: 'rsz-bin', 'data-k': 'k', tabindex: 0, role: 'button' }, h('div', { class: 'rsz-bin-h' }, h('b', {}, 'Talajkiszorításos'), h('small', {}, 'széttoljuk, tömörítjük')), h('div', { class: 'rsz-bin-l' }));
  const fb = h('div', { class: 'verdict rsz-fb', 'aria-live': 'polite' });
  const bar = h('div', { class: 'rsz-gbar' });
  const score = h('span', { class: 'rsz-score' });
  const bSol = h('button', { type: 'button', class: 'btn btn-line btn-sm' }, 'Megoldás');
  const bRe = h('button', { type: 'button', class: 'btn btn-line btn-sm' }, 'Újrakezdés');
  bar.append(score, h('span', { style: { flex: 1 } }), bSol, bRe);
  viz.append(bar, pool, h('div', { class: 'rsz-bins' }, binH, binK), fb);
  let state, sel = null;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function reset() {
    state = { first: 0, done: 0, tried: new Set() };
    pool.innerHTML = ''; $$('.rsz-bin-l', root).forEach((l) => (l.innerHTML = ''));
    shuffle(ITEMS.map((it, i) => i)).forEach((i) => pool.append(chip(i)));
    fb.dataset.s = ''; fb.innerHTML = '<b>Kezdd el!</b>Melyik technológia emeli ki a talajt, és melyik tolja szét?';
    sel = null; upd();
  }
  function upd() { score.innerHTML = `Besorolva: <b>${state.done}/${ITEMS.length}</b> · elsőre jó: <b>${state.first}</b>`; }
  function chip(i) {
    const it = ITEMS[i];
    const c = h('button', { type: 'button', class: 'rsz-chip', 'data-i': i }, it.t);
    let drag = null;
    c.addEventListener('pointerdown', (e) => {
      if (c.classList.contains('placed')) return;
      drag = { x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on && Math.hypot(dx, dy) > 6) { drag.on = true; c.classList.add('drag'); select(null); }
      if (drag.on) {
        c.style.transform = `translate(${dx}px, ${dy}px)`;
        const b = binAt(e.clientX, e.clientY); $$('.rsz-bin', root).forEach((x) => x.classList.toggle('hover', x === b));
      }
    });
    const end = (e) => {
      if (!drag) return;
      const wasDrag = drag.on; drag = null;
      c.classList.remove('drag'); c.style.transform = '';
      $$('.rsz-bin', root).forEach((x) => x.classList.remove('hover'));
      if (wasDrag) { const b = binAt(e.clientX, e.clientY); if (b) place(i, b.dataset.k); }
      else select(sel === i ? null : i);
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', () => { drag = null; c.classList.remove('drag'); c.style.transform = ''; });
    return c;
  }
  function binAt(x, y) {
    for (const b of $$('.rsz-bin', root)) { const r = b.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return b; }
    return null;
  }
  function select(i) {
    sel = i;
    $$('.rsz-chip', pool).forEach((c) => c.classList.toggle('sel', +c.dataset.i === i));
    $$('.rsz-bin', root).forEach((b) => b.classList.toggle('armed', i !== null));
  }
  function place(i, k) {
    const it = ITEMS[i], c = $(`.rsz-chip[data-i="${i}"]`, pool);
    if (!c) return;
    const ok = it.k === k;
    if (ok) {
      if (!state.tried.has(i)) state.first++;
      state.done++;
      c.classList.remove('sel'); c.classList.add('placed', 'ok');
      $(`.rsz-bin[data-k="${k}"] .rsz-bin-l`, root).append(c);
      fb.dataset.s = 'ok';
      fb.innerHTML = `<b>✓ ${it.t}</b>${k === 'h' ? 'Talajhelyettesítéses' : 'Talajkiszorításos'}, ${it.p}. ${it.e}`;
    } else {
      state.tried.add(i);
      c.classList.remove('bad'); void c.offsetWidth; c.classList.add('bad');
      fb.dataset.s = 'bad';
      fb.innerHTML = `<b>✗ Nem egészen – ${it.t}</b>${it.e}`;
    }
    select(null); upd();
    if (state.done === ITEMS.length) {
      fb.dataset.s = 'ok';
      fb.innerHTML = `<b>Kész! ${state.first}/${ITEMS.length} elsőre jó</b>Jegyezd meg: a nagyátmérőjű (80 cm feletti) cölöpök mind talajhelyettesítéssel készülnek, a talajkiszorításos cölöp pedig lehet előregyártott és helyben készülő is.`;
    }
  }
  [binH, binK].forEach((b) => {
    b.addEventListener('click', () => { if (sel !== null) place(sel, b.dataset.k); });
    b.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && sel !== null) { e.preventDefault(); place(sel, b.dataset.k); } });
  });
  bRe.addEventListener('click', reset);
  bSol.addEventListener('click', () => {
    $$('.rsz-chip', pool).forEach((c) => { const i = +c.dataset.i; state.tried.add(i); place(i, ITEMS[i].k); });
    fb.dataset.s = ''; fb.innerHTML = '<b>Megoldás</b>Minden technológia a helyére került. Nyomd meg az „Újrakezdés” gombot, és próbáld meg fejből!';
  });
  reset();
});

/* ================================================================ 2.5 átmérő-skála */
const TECH_D = [
  { t: 'Facölöp', a: 10, b: 15 },
  { t: 'Mikrocölöp', a: 10, b: 30 },
  { t: 'Pörgetett vb. cölöp', a: 25, b: 50 },
  { t: 'Négyzetes vb. cölöp (oldal)', a: 30, b: 40 },
  { t: 'Csavart cölöp', a: 30, b: 60 },
  { t: 'Franki-cölöp (cső → kész)', a: 46, b: 60 },
  { t: 'CFA-cölöp', a: 40, b: 120 },
  { t: 'Béléscsöves fúrt cölöp', a: 80, b: 180 },
  { t: 'Bentonitzagyos fúrt cölöp', a: 80, b: 180 },
];
register('rsz-atmero', (root) => {
  const { viz, out } = shell(root, { layout: 'wide' });
  const cbox = h('div', { class: 'rsz-ictl' }); viz.append(cbox);
  const sD = slider(cbox, { label: 'Átmérő', sym: 'D', min: 10, max: 200, step: 5, value: 60, unit: 'cm', d: 0, hint: 'A bal oldali rajzon a cölöp és az ember (1,75 m) méretaránya valós.' });
  const dg = h('div', { class: 'rsz-dgrid' }); viz.append(dg);
  const s = figure(dg, 230, 350, 'fig rsz-dman'), s2 = figure(dg, 430, 350, 'fig rsz-dchart');
  const oK = stat(out, { label: 'Kategória' });
  const oA = stat(out, { label: 'Keresztmetszet A = π·D²/4', unit: 'm²', d: 3 });
  const oU = stat(out, { label: 'Köpenyfelület 1 m hosszon', unit: 'm²', d: 2 });
  const vd = verdict(null); out.append(vd.el); vd.el.style.gridColumn = '1 / -1';
  function man(g, x, yb, hgt) {
    const k = hgt / 1.75, gg = svg('g', { class: 'f-ink' }, g);
    svg('circle', { cx: x, cy: yb - 1.63 * k, r: 0.11 * k }, gg);
    svg('rect', { x: x - 0.19 * k, y: yb - 1.48 * k, width: 0.38 * k, height: 0.62 * k, rx: 0.06 * k }, gg);
    svg('rect', { x: x - 0.27 * k, y: yb - 1.46 * k, width: 0.07 * k, height: 0.58 * k, rx: 0.03 * k }, gg);
    svg('rect', { x: x + 0.2 * k, y: yb - 1.46 * k, width: 0.07 * k, height: 0.58 * k, rx: 0.03 * k }, gg);
    svg('rect', { x: x - 0.17 * k, y: yb - 0.9 * k, width: 0.15 * k, height: 0.9 * k, rx: 0.04 * k }, gg);
    svg('rect', { x: x + 0.02 * k, y: yb - 0.9 * k, width: 0.15 * k, height: 0.9 * k, rx: 0.04 * k }, gg);
  }
  function draw() {
    const D = sD.v; clear(s); clear(s2);
    // bal: méretarányos rajz
    const k = 120, yb = 300, x0 = 30;
    svg('rect', { x: 0, y: 0, width: 230, height: 340, rx: 12, class: 'f-bg2' }, s);
    T(s, 14, 24, 'MÉRETARÁNYOSAN', 't-sm');
    svg('line', { x1: 10, y1: yb, x2: 220, y2: yb, class: 's-ink', 'stroke-width': 1.2 }, s);
    man(s, x0 + 18, yb, 1.75 * k);
    const pw = D / 100 * k, px = 150 - pw / 2;
    const top = yb - 2.1 * k;
    conc(s, px, top, pw, yb - top, 'f-conc2');
    // törésvonalak
    svg('path', { d: `M${px - 6} ${top + 8} l${pw / 2 + 6} -10 l${pw / 2 + 6} 10`, fill: 'none', class: 's-muted', 'stroke-width': 1.4 }, s);
    svg('line', { x1: px, y1: yb + 14, x2: px + pw, y2: yb + 14, class: 's-ink', 'stroke-width': 1 }, s);
    for (const x of [px, px + pw]) svg('line', { x1: x, y1: yb + 9, x2: x, y2: yb + 19, class: 's-ink', 'stroke-width': 1 }, s);
    T(s, px + pw / 2, yb + 32, `D = ${fmt(D, 0)}${NB}cm`, 't-num', { 'text-anchor': 'middle' });
    T(s, x0 + 18, yb + 32, '1,75 m', 't-sm', { 'text-anchor': 'middle' });
    // jobb: tartomány-diagram
    const ax0 = 170, ax1 = 418, X = (cm) => ax0 + (cm / 200) * (ax1 - ax0);
    const bands = [[10, 30, 'mikro'], [30, 80, 'normál'], [80, 200, 'nagyátmérőjű']];
    bands.forEach(([a, b, t], i) => {
      svg('rect', { x: X(a), y: 36, width: X(b) - X(a), height: 290, class: i === 1 ? 'f-bg2' : 'f-surface', opacity: 0.9 }, s2);
      T(s2, (X(a) + X(b)) / 2, i === 0 ? 18 : 30, t, 't-sm', { 'text-anchor': 'middle' });
    });
    for (const cm of [0, 50, 100, 150, 200]) { svg('line', { x1: X(cm), y1: 36, x2: X(cm), y2: 326, class: 's-line', 'stroke-width': 0.6 }, s2); T(s2, X(cm), 342, cm === 200 ? '200 cm' : `${cm}`, 't-sm', { 'text-anchor': cm === 200 ? 'end' : 'middle' }); }
    TECH_D.forEach((tc, i) => {
      const y = 50 + i * 31;
      const on = D >= tc.a && D <= tc.b;
      T(s2, ax0 - 10, y + 9, tc.t, on ? 't-lab t-grp' : 't-sm', { 'text-anchor': 'end', 'font-weight': on ? 700 : 500 });
      svg('rect', { x: X(tc.a), y: y, width: Math.max(4, X(tc.b) - X(tc.a)), height: 12, rx: 6, class: on ? 'f-grp' : 'rsz-off' }, s2);
    });
    svg('line', { x1: X(D), y1: 36, x2: X(D), y2: 326, class: 's-acc', 'stroke-width': 2.2 }, s2);
    const cat = D <= 30 ? 'mikrocölöp' : D <= 80 ? '„normál” cölöp' : 'nagyátmérőjű';
    oK.set(cat);
    const A = Math.PI * (D / 100) ** 2 / 4; oA.set(A); oU.set(Math.PI * D / 100);
    const list = TECH_D.filter((tc) => D >= tc.a && D <= tc.b).map((tc) => tc.t);
    const extra = D > 80 ? ' Ekkora átmérő már <b>csak talajhelyettesítéses</b> technológiával készülhet.' : D <= 30 ? ' Mikrocölöpöt elsősorban utólagos alapmegerősítésre használunk; teherbírásánál a talpellenállást figyelmen kívül hagyjuk.' : '';
    vd.set(D > 80 ? 'warn' : D <= 30 ? '' : 'ok', cat.charAt(0).toUpperCase() + cat.slice(1), `<p>${list.length ? 'Szóba jöhet: ' + list.join(', ') + '.' : 'Ebben a tartományban nincs jellemző technológia.'}${extra}</p>`);
  }
  sD.on(draw); draw();
});

/* ================================================================ 2.6 családfa */
const TREE = { t: 'Cölöpök', c: [
  { t: 'Talajkiszorításos', g: 1, c: [
    { t: 'Előregyártott: fa, acél, vasbeton', h: '#elore', yt: 1 },
    { t: 'Talajcsavar', h: '#elore', yt: 1 },
    { t: 'Franki-cölöp', h: '#helyszini', yt: 1 },
    { t: 'Csavart cölöp', h: '#helyszini', yt: 1 }] },
  { t: 'Talajhelyettesítéses', g: 2, c: [
    { t: 'CFA-cölöp', h: '#furt', yt: 1 },
    { t: 'Béléscsöves fúrt cölöp', h: '#furt', yt: 1 },
    { t: 'Bentonitzagyos fúrt cölöp', h: '#furt', yt: 1 },
    { t: 'Megtámasztás nélküli furat', h: '#furt' }] },
  { t: 'Egyéb', g: 3, c: [
    { t: 'Mikrocölöp', h: '#egyeb', yt: 1 },
    { t: 'Jet-grouting', h: '#egyeb', yt: 1 },
    { t: 'Mélykeverés', h: '#egyeb', yt: 1 },
    { t: 'Kavicscölöp, kőoszlop', h: '#egyeb', yt: 1 }] }] };
register('rsz-fa', (root) => {
  const nodes = [];
  (function walk(n, d, g, parent) { const me = { ...n, d, g: n.g ?? g, parent }; nodes.push(me); me.kids = (n.c || []).map((c) => walk(c, d + 1, me.g, me)); return me; })(TREE, 0, 0, null);
  let lastW = 0, lastMode = '';
  function render() {
    const cs = getComputedStyle(root), W = Math.round(root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)); if (W < 240 || W === lastW) return; lastW = W;
    const mode = W >= 760 ? 'h' : 'v'; lastMode = mode;
    root.innerHTML = '';
    let H, pos = new Map();
    if (mode === 'h') {
      const rowH = 34, leaves = nodes.filter((n) => !n.kids.length);
      const cols = [0.2, 0.26, 0.38].map((f) => f * W), gap = (W - cols.reduce((a, b) => a + b, 0)) / 2;
      const cx = [0]; for (let i = 1; i < 3; i++) cx[i] = cx[i - 1] + cols[i - 1] + gap;
      leaves.forEach((n, i) => pos.set(n, { y: 10 + i * rowH }));
      const setY = (n) => { if (!n.kids.length) return pos.get(n).y; const ys = n.kids.map(setY); const y = (Math.min(...ys) + Math.max(...ys)) / 2; pos.set(n, { y }); return y; };
      setY(nodes[0]);
      for (const n of nodes) { const p = pos.get(n); p.x = cx[n.d]; p.w = cols[n.d] - (n.d === 2 ? 0 : 4); }
      H = 10 + leaves.length * rowH + 4;
    } else {
      const rowH = 38;
      nodes.forEach((n, i) => pos.set(n, { x: 4 + n.d * 22, y: 6 + i * rowH, w: W - 8 - n.d * 22 }));
      H = 6 + nodes.length * rowH + 2;
    }
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'rsz-svg' }, root);
    const bh = 28;
    // összekötők
    for (const n of nodes) for (const k of n.kids) {
      const a = pos.get(n), b = pos.get(k);
      const d = mode === 'h'
        ? `M${a.x + a.w} ${a.y + bh / 2} C${a.x + a.w + 22} ${a.y + bh / 2} ${b.x - 22} ${b.y + bh / 2} ${b.x} ${b.y + bh / 2}`
        : `M${a.x + 11} ${a.y + bh} V${b.y + bh / 2} H${b.x}`;
      svg('path', { d, fill: 'none', class: 'rsz-link', style: `--c: var(--g${k.g})` }, s);
    }
    for (const n of nodes) {
      const p = pos.get(n), leaf = !n.kids.length;
      const wrap = n.h ? svg('a', { href: n.h, class: 'rsz-a' }, s) : s;
      const g = svg('g', { class: 'rsz-n' + (n.d === 0 ? ' root' : leaf ? ' leaf' : ' int'), style: `--c: var(--g${n.g})`, transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})` }, wrap);
      svg('rect', { x: 0, y: 0, width: p.w, height: bh, rx: 8 }, g);
      svg('text', { x: 10, y: bh / 2 + 4.5, text: n.t }, g);
      if (n.yt) { const yg = svg('g', { transform: `translate(${p.w - 28} ${bh / 2 - 7})`, class: 'rsz-yt' }, g); svg('rect', { x: 0, y: 0, width: 20, height: 14, rx: 4 }, yg); svg('path', { d: 'M8 3.5 L14 7 L8 10.5 Z' }, yg); }
      if (n.h && !n.yt) svg('text', { x: p.w - 12, y: bh / 2 + 4.5, text: '→', class: 'rsz-go', 'text-anchor': 'end' }, g);
    }
  }
  new ResizeObserver(() => render()).observe(root);
  render();
  void lastMode;
});

/* ================================================================ kvíz */
defineQuiz('rendszer', 'Kvíz – a cölöpök rendszere', [
  { q: 'Álló cölöpnél a teherbírás legalább mekkora részét adja a csúcs- (talp-) ellenállás?', a: ['2/3-át', '1/3-át', 'a felét', 'a teljes teherbírást'], c: 0, e: 'Álló cölöp: min. 2/3 csúcsellenállás. A cölöp a jobb teherbírású rétegbe „áll bele”.' },
  { q: 'Mikor beszélünk lebegő cölöpről?', a: ['Ha a teherbírás legalább 2/3-át a köpenymenti ellenállás adja, mert a csúcs környékén nincs jobb réteg.', 'Ha a cölöp talajvízben áll.', 'Ha a cölöp feje nincs bekötve a fejtömbbe.', 'Ha a cölöp csak vízszintes terhet kap.'], c: 0, e: 'Lebegő cölöpnél a hosszabb cölöpök súrlódási (köpenymenti) ellenállása dominál.' },
  { q: 'Mekkora a csúcsellenállás részaránya a vegyes (kombinált) cölöpnél?', a: ['33–66 %', '0–10 %', '90–100 %', 'pontosan 50 %'], c: 0, e: 'Vegyes cölöpnél a csúcs és a köpeny hasonló arányban vesz részt a teherbírásban.' },
  { q: 'Hogyan adja át a terhet a húzott cölöp?', a: ['Csak a köpeny mentén, a nyomott cölöphöz képest ellentétes irányban.', 'Csak a talpán.', 'A talpán és a köpenyén, ugyanúgy, mint a nyomott.', 'Sehogy – húzott cölöp nem létezik.'], c: 0, e: 'Húzásnál a talp nem dolgozik; a köpenymenti ellenállás lefelé hat.' },
  { q: 'Melyik helyzetben válhat egy cölöp húzottá?', a: ['Talajvíz alatti mélygarázs lehorgonyzásánál felúszás ellen.', 'Ha a cölöp álló cölöp.', 'Ha az átmérője 80 cm‑nél nagyobb.', 'Ha a cölöp vasbetonból készül.'], c: 0, e: 'Felúszás elleni lehorgonyzásnál, vezetéktartó oszlopoknál, vagy ha a cölöpcsoport nagy külpontos terhet kap.' },
  { q: 'Mi keletkezik a cölöpben keresztirányú (vízszintes) terhelés hatására?', a: ['A nyomófeszültségen kívül hajlító- és nyírófeszültség is.', 'Csak húzófeszültség.', 'Semmi – a vízszintes erőt a fejtömb veszi fel.', 'Csak a talpon keletkezik többletfeszültség.'], c: 0, e: 'Földnyomás, fékezőerő, szél, földrengés: a cölöp hajlított és nyírt is lesz.' },
  { q: 'Melyik talajkiszorításos technológia?', a: ['Franki-cölöp', 'CFA-cölöp', 'Béléscsöves fúrt cölöp', 'Bentonitzagyos fúrt cölöp'], c: 0, e: 'A Franki-cölöp a béléscsövet a betondugóval veri le, és a talajt kiszorítja; a másik három talajhelyettesítéses.' },
  { q: 'Mi történik a környező talajjal talajkiszorításos cölöp készítésekor?', a: ['Tömörödik – előregyártott cölöpnél a talp- és a köpenymenti, csavart cölöpnél a köpenymenti ellenállás nő.', 'Fellazul, ezért csökken a köpenymenti ellenállás.', 'Kiemelik és elszállítják.', 'Semmi nem történik vele.'], c: 0, e: 'A kiszorítás tömöríti a talajt, ez növeli az ellenállást.' },
  { q: 'Milyen technológiával készülhet a 80 cm‑nél nagyobb átmérőjű cölöp?', a: ['Kizárólag talajhelyettesítéssel.', 'Kizárólag veréssel.', 'Csak talajcsavarként.', 'Csak Franki-technológiával.'], c: 0, e: 'A nagyátmérőjű cölöpök már csak valamilyen talajhelyettesítéses technológiával készülnek.' },
  { q: 'Mekkora a mikrocölöp átmérője?', a: ['Kb. 10–30 cm (fúrtnál a törzsátmérő legfeljebb 250–300 mm, vertnél 150 mm).', '30–80 cm', '80–180 cm', '1–3 m'], c: 0, e: 'A mikrocölöpöket elsősorban utólagos alapmegerősítésre használjuk.' },
]);
