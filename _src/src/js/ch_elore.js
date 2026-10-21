// ch_elore – C03 Előregyártott cölöpök: behajtási módok, cölöpverés-szimulátor, vibrálás-labor, rezgés a szomszédban, kvíz
import { register, shell, slider, seg, toggle, select, stat, verdict, figure, svg, h, fmt, clear, clamp, lerp, pathD, loop } from './core.js';
import { defineQuiz } from './ui.js';

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
  vibro: { t: 'Vibrálás', zaj: 4, rez: 4, teh: 4, talaj: 'elsősorban szemcsés talajok', hasz: 'acél csőcölöpök, H-profilok, szádpallók, vb. cölöpök', note: 'A talajhoz hangolt rezgés ideiglenesen „elfolyósítja” a cölöp körüli talajt – a cölöp szinte belecsúszik.' },
  sajto: { t: 'Sajtolás', zaj: 1, rez: 1, teh: 2, talaj: 'puhább talajok', hasz: 'kisebb teherbírású cölöpök, főleg mikrocölöpök', note: 'A sajtó egy ellensúlyra (vagy meglévő szerkezetre) támaszkodva lökethosszanként nyomja le a cölöpöt.' },
  csavar: { t: 'Csavarás', zaj: 1, rez: 1, teh: 1, talaj: 'ahol a csavar menetet tud vágni (nem köves)', hasz: 'talajcsavarok: könnyű házak, napelemparkok, lelátók', note: 'A forgatófej „dugóhúzóként” hajtja le a menetes szárat – nincs ütés, nincs furadék.' },
};
register('elo-modok', (root) => {
  const { ctrls, viz, out } = shell(root);
  const m = seg(ctrls, { label: 'Módszer', options: Object.entries(MODES).map(([v, o]) => ({ v, t: o.t })), value: 'veres', vert: true });
  const rates = h('div', { class: 'elo-rates' });
  ctrls.append(rates);
  const fig = figure(viz, 640, 330);
  const note = h('p', { class: 'small muted elo-note' });
  viz.append(note);
  const oT = stat(out, { label: 'Alkalmas talaj' });
  const oH = stat(out, { label: 'Jellemző felhasználás' });
  oT.el.classList.add('elo-tstat'); oH.el.classList.add('elo-tstat');
  const GY = 210, PX = 300, PW = 22, SC = 9; // terep, cölöp tengelye, szélessége, px/m
  let mode = 'veres', t0 = 0;
  const L = 14; // a cölöp hossza (m) – szemléltető
  function setMode(v) {
    mode = v; t0 = performance.now() / 1000;
    const o = MODES[v];
    clear(rates); rates.append(meterBar('Zaj', o.zaj), meterBar('Rezgés', o.rez), meterBar('Teherbírás', o.teh));
    oT.set(0, null, o.talaj); oH.set(0, null, o.hasz); note.textContent = o.note;
  }
  m.on(setMode); setMode('veres');
  function draw(t) {
    clear(fig);
    const u = (t - t0) % 9, prog = clamp(u / 8, 0, 1); // 8 s alatt megy le, 1 s szünet
    rect(fig, 0, 0, 640, GY, 'fill:var(--sky)');
    soilRect(fig, 0, GY, 640, 70, 'soilB'); soilRect(fig, 0, GY + 70, 640, 50, 'soilA');
    line(fig, 0, GY, 640, GY, 'stroke:var(--soil-line);stroke-width:1.5');
    txt(fig, 12, GY + 20, 'puha réteg', 't-sm'); txt(fig, 12, GY + 92, 'teherbíró réteg', 't-sm');
    let pen = 0, jig = 0;
    const o = MODES[mode];
    if (mode === 'veres') {
      // ütésenként lépcsős süllyedés
      const bpm = 1.1, k = Math.floor(u / (1 / bpm) * 1), ph = (u * bpm) % 1;
      const steps = Math.min(k, 8); pen = steps / 8 * 7.5 + (ph > 0.82 && k < 8 ? (ph - 0.82) / 0.18 * (7.5 / 8) : 0);
      if (u > 8) pen = 7.5;
      const head = GY - (L - pen) * SC;
      // vezetőtorony
      rect(fig, PX + 26, 18, 10, GY - 18, 'fill:var(--steelm2)');
      for (let y = 30; y < GY - 10; y += 22) line(fig, PX + 26, y, PX + 36, y + 11, 'stroke:var(--steelm);stroke-width:1.5');
      rect(fig, PX + 20, GY - 26, 120, 22, 'fill:var(--steelm2)', { rx: 4 }); rect(fig, PX + 100, GY - 46, 44, 22, 'fill:var(--steelm)', { rx: 3 });
      // kos
      const lift = u > 8 ? 0 : (ph < 0.82 ? Math.sin((ph / 0.82) * Math.PI / 2) : 1 - (ph - 0.82) / 0.18) * 26;
      rect(fig, PX - 16, head - 30 - lift, 32, 30, 'fill:var(--ink2)', { rx: 3 });
      txt(fig, PX - 24, head - 36 - lift, 'kos', 't-sm', { 'text-anchor': 'end' });
      // ütés
      if (ph > 0.97 || ph < 0.06) {
        for (let r = 0; r < 3; r++) svg('ellipse', { cx: PX, cy: GY, rx: 40 + r * 36 + ph * 20, ry: 5 + r * 3, style: 'fill:none;stroke:var(--bad);stroke-width:1.4', opacity: 0.6 - r * 0.15 }, fig);
        for (const s of [-1, 1]) line(fig, PX + s * 22, head - 4, PX + s * 40, head - 18, 'stroke:var(--warn);stroke-width:2');
      }
      pile(head);
    } else if (mode === 'vibro') {
      pen = Math.min(7.5, prog * 7.5);
      jig = u < 8 ? Math.sin(t * 90) * 1.6 : 0;
      const head = GY - (L - pen) * SC + jig;
      rect(fig, PX - 28, head - 34, 56, 34, 'fill:var(--accent)', { rx: 5 });
      for (const s of [-1, 1]) rect(fig, PX + s * 34 - 4, head - 30, 8, 26, 'fill:var(--ink2)', { rx: 2 });
      txt(fig, PX + 40, head - 18, 'vibrátor', 't-sm');
      line(fig, PX, head - 34, PX, 0, 'stroke:var(--muted);stroke-width:1.5;stroke-dasharray:3 3');
      pile(head);
      // rezgő szemcsék
      if (u < 8) for (let i = 0; i < 26; i++) {
        const a = (i * 2.399) % (2 * Math.PI), rr = 18 + (i % 5) * 7;
        const x = PX + Math.cos(a) * rr * 1.4 + Math.sin(t * 70 + i) * 2, y = GY + 12 + ((i * 13) % 100) + Math.cos(t * 80 + i) * 1.5;
        if (y < GY + 2 || Math.abs(x - PX) < PW / 2 + 3) continue;
        svg('circle', { cx: x, cy: y, r: 2.2, style: 'fill:var(--ink2)', opacity: 0.55 }, fig);
      }
      for (let r = 0; r < 2; r++) svg('ellipse', { cx: PX, cy: GY, rx: 34 + r * 30 + (t * 40) % 30, ry: 4 + r * 2, style: 'fill:none;stroke:var(--warn);stroke-width:1.2', opacity: 0.5 }, fig);
    } else if (mode === 'sajto') {
      const stroke = 1.2, nStr = 6; // löketek
      const k = Math.min(nStr, Math.floor(prog * nStr)), ph = (prog * nStr) % 1;
      pen = Math.min(nStr * stroke, k * stroke + (k < nStr ? Math.min(1, ph / 0.7) * stroke : 0));
      const head = GY - (L - pen) * SC;
      // ellensúly-keret
      rect(fig, PX - 130, GY - 64, 70, 60, 'fill:var(--concrete2)', { rx: 3 }); rect(fig, PX + 60, GY - 64, 70, 60, 'fill:var(--concrete2)', { rx: 3 });
      txt(fig, PX - 95, GY - 30, 'ellensúly', 't-sm', { 'text-anchor': 'middle' }); txt(fig, PX + 95, GY - 30, 'ellensúly', 't-sm', { 'text-anchor': 'middle' });
      const ext = (k < nStr ? Math.min(1, ph / 0.7) : 1) * stroke * SC;
      const top = head - 18 - (stroke * SC - ext) - 24;
      rect(fig, PX - 70, top - 16, 140, 16, 'fill:var(--steelm2)', { rx: 3 });
      for (const s of [-1, 1]) { line(fig, PX + s * 64, top, PX + s * 64, GY - 64, 'stroke:var(--steelm2);stroke-width:6'); }
      rect(fig, PX - 9, top, 18, head - top - 8, 'fill:var(--steelm)'); // dugattyú
      rect(fig, PX - 18, head - 10, 36, 10, 'fill:var(--ink2)', { rx: 2 }); // befogó
      arr(fig, PX + 92, top - 24, PX + 92, top + 6, 'var(--accent)', 2.4, 9);
      txt(fig, PX + 100, top - 10, 'nyomás', 't-sm t-acc');
      pile(head);
    } else {
      pen = Math.min(6, prog * 6);
      const head = GY - (6 - pen) * SC - 40;
      const rot = t * 6;
      // kis kotró karja + forgatófej
      svg('path', { d: `M80 ${GY - 6} L150 ${GY - 6} L150 ${GY - 40} L110 ${GY - 52} Z`, style: 'fill:var(--warn)' }, fig);
      line(fig, 140, GY - 46, PX - 60, head - 70, 'stroke:var(--warn);stroke-width:9;stroke-linecap:round');
      line(fig, PX - 60, head - 70, PX, head - 46, 'stroke:var(--warn);stroke-width:7;stroke-linecap:round');
      rect(fig, PX - 16, head - 46, 32, 30, 'fill:var(--ink2)', { rx: 4 });
      txt(fig, PX + 22, head - 34, 'forgatófej', 't-sm');
      // csavar: üreges szár, szakaszos menetek
      const tip = head + 6 * SC + 40;
      rect(fig, PX - 6, head - 16, 12, tip - head + 16, 'fill:var(--steelm)');
      svg('path', { d: `M${PX - 6} ${tip} L${PX} ${tip + 12} L${PX + 6} ${tip}Z`, style: 'fill:var(--steelm2)' }, fig);
      for (let k = 0; k < 4; k++) {
        const y = tip - 8 - k * 4.5 * SC * 0.5;
        if (y < head) continue;
        const ph2 = Math.sin(rot + k);
        svg('ellipse', { cx: PX, cy: y, rx: 22, ry: 5, style: 'fill:var(--steelm2)', opacity: 0.9 }, fig);
        line(fig, PX - 22 * ph2, y - 3, PX + 22 * ph2, y + 3, 'stroke:var(--steelm);stroke-width:2');
      }
      svg('path', { d: `M${PX + 30} ${head - 54} a14 8 0 1 1 -2 -6`, style: 'fill:none;stroke:var(--accent);stroke-width:2' }, fig);
      txt(fig, PX + 48, head - 56, 'forgatás', 't-sm t-acc');
    }
    if (mode !== 'csavar') txt(fig, 630, 22, `behatolás ≈ ${fmt(pen, 1)} m`, 't-num', { 'text-anchor': 'end' });
    txt(fig, 630, 316, o.t.toUpperCase(), 't-big', { 'text-anchor': 'end' });
    // zajjel
    if (o.zaj >= 4 && u < 8) for (let i = 0; i < 3; i++) svg('path', { d: `M${PX - 60 - i * 10} ${70 - i * 4} a${14 + i * 8} ${14 + i * 8} 0 0 0 0 ${28 + i * 16}`, style: 'fill:none;stroke:var(--muted);stroke-width:1.5', opacity: 0.25 + 0.25 * Math.abs(Math.sin(t * 6 + i)) }, fig);
  }
  function pile(head) {
    rect(fig, PX - PW / 2, head, PW, L * SC, 'fill:var(--concrete)');
    rect(fig, PX - PW / 2, head, PW, L * SC, 'fill:url(#pat-conc)', { opacity: 0.8 });
    svg('path', { d: `M${PX - PW / 2} ${head + L * SC} L${PX} ${head + L * SC + 10} L${PX + PW / 2} ${head + L * SC}Z`, style: 'fill:var(--concrete2)' }, fig);
    // ami a talajba ért, azt a terep „takarja” – halvány sáv jelzi a talajt a cölöp előtt
    if (head + L * SC > GY) rect(fig, PX - PW / 2, GY, PW, head + L * SC + 10 - GY, 'fill:var(--soilB)', { opacity: 0.18 });
  }
  loop(root, (t) => draw(t));
  draw(0);
});

/* =================================================================== 2. cölöpverés-szimulátor */
// talajrétegek: qs – köpenymenti, qb – talp alatti dinamikus ellenállás (kPa), szemléltető értékek
const LAY = {
  puha: { n: 'puha agyag', key: 'soilB', qs: 15, qb: 300 },
  lhomok: { n: 'laza homok', key: 'soilA', qs: 20, qb: 1500 },
  thomok: { n: 'tömör homok', key: 'soilD', qs: 60, qb: 15000 },
  cement: { n: 'cementált pad', key: 'soilE', qs: 120, qb: 80000, hard: true },
  feltolt: { n: 'feltöltés', key: 'soilC', qs: 18, qb: 1200 },
  tomb: { n: 'betontörmelék-tömb', key: 'rock', qs: 60, qb: 90000, hard: true },
  kavics: { n: 'tömör kavics', key: 'soilD', qs: 70, qb: 18000 },
  kozet: { n: 'kőzet', key: 'rock', qs: 100, qb: 1e9, rock: true },
};
const PROF = {
  A: { t: 'Puha agyag, 7 m-től tömör homok', L: [['puha', 7], ['thomok', 14]] },
  B: { t: 'Laza homok, 3,5 m-en vékony cementált pad', L: [['lhomok', 3.5], ['cement', 4.0], ['thomok', 14]] },
  C: { t: 'Feltöltés tömbös betelepüléssel, alatta kavics', L: [['feltolt', 1.6], ['tomb', 2.2], ['feltolt', 3.2], ['puha', 6], ['kavics', 14]] },
  D: { t: 'Puha agyag, 6,5 m-en kőzet', L: [['puha', 6.5], ['kozet', 14]] },
};
const PILES = {
  vb30: { t: 'vb. 30×30 cm', L: 10, per: 1.2, A: 0.09, conc: true, w: 18 },
  vb40: { t: 'vb. 40×40 cm', L: 10, per: 1.6, A: 0.16, conc: true, w: 24 },
  H: { t: 'acél H-profil', L: 12, per: 1.2, A: 0.02, conc: false, w: 18 },
};
const HAM = { ejto: { t: 'ejtőkos', eta: 0.75 }, diesel: { t: 'diesel', eta: 0.5 }, hidr: { t: 'hidraulikus', eta: 0.85 } };
register('elo-veres', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sHam = seg(ctrls, { label: 'Kos', options: Object.entries(HAM).map(([v, o]) => ({ v, t: o.t })), value: 'hidr' });
  const sM = slider(ctrls, { label: 'A kos tömege', sym: 'm', min: 1, max: 9, step: 0.5, value: 4, unit: 't' });
  const sH = slider(ctrls, { label: 'Ejtési magasság', sym: 'h', min: 0.2, max: 1.5, step: 0.05, value: 0.8, unit: 'm', d: 2, hint: '„Nehéz kos, kis ejtés” – a nagy ejtési magasság a cölöpfejet töri.' });
  const sPile = seg(ctrls, { label: 'Cölöp', options: Object.entries(PILES).map(([v, o]) => ({ v, t: o.t })), value: 'vb30' });
  const sProf = select(ctrls, { label: 'Talajprofil', options: Object.entries(PROF).map(([v, o]) => ({ v, t: o.t })), value: 'A' });
  const bOne = h('button', { type: 'button', class: 'btn btn-acc btn-sm' }, 'Egy ütés');
  const bAuto = h('button', { type: 'button', class: 'btn btn-line btn-sm' }, '▶ Folyamatos verés');
  const bNew = h('button', { type: 'button', class: 'btn btn-line btn-sm' }, '↺ Új cölöp');
  ctrls.append(h('div', { class: 'elo-btns' }, bOne, bAuto, bNew));
  const fig = figure(viz, 720, 500);
  const ver = verdict(viz);
  const oZ = stat(out, { label: 'Behatolás', unit: 'm', d: 2 });
  const oN = stat(out, { label: 'Ütésszám', d: 0 });
  const oS = stat(out, { label: 'Beverődés', unit: 'mm/ütés', d: 1 });
  const o10 = stat(out, { label: 'Az utolsó 10 ütésre', unit: 'mm', d: 0 });
  const oE = stat(out, { label: 'Ütési energia η·m·g·h', unit: 'kJ', d: 1 });
  const oSig = stat(out, { label: 'Ütésfeszültség (becslés)', unit: 'MPa', d: 0 });
  const oR = stat(out, { label: 'Dinamikus ellenállás', unit: 'kN', d: 0 });

  const GY = 270, SC = 16, PX = 200, ZMAX = 13.2;
  let st, anim = null, auto = false;
  const reset = () => { st = { z: 0, n: 0, sets: [], log: {}, end: null, lastS: null, lastR: null }; anim = null; };
  reset();
  const layersOf = () => { let top = 0; return PROF[sProf.v].L.map(([k, bot]) => { const o = { ...LAY[k], top, bot }; top = bot; return o; }); };
  function resist(z) {
    const P = PILES[sPile.v]; const Ls = layersOf();
    let Rs = 0; for (const l of Ls) { const a = Math.max(0, Math.min(z, l.bot) - l.top); Rs += l.qs * P.per * a; }
    const lt = Ls.find((l) => z >= l.top - 1e-9 && z < l.bot) || Ls[Ls.length - 1];
    return { R: Rs + lt.qb * P.A, lt };
  }
  const energy = () => HAM[sHam.v].eta * sM.v * 9.81 * sH.v;
  const sigma = () => { const P = PILES[sPile.v]; const v0 = Math.sqrt(2 * 9.81 * sH.v * HAM[sHam.v].eta); return (P.conc ? 5 : 20) * v0; };
  function blow() {
    if (st.end) return;
    const P = PILES[sPile.v], E = energy(), c2 = 0.003;
    const { R, lt } = resist(st.z + 1e-6);
    let s = lt.rock ? 0 : E / R - c2;
    if (s < 0) s = 0;
    const zmax = P.L - 0.5;
    if (st.z + s >= zmax) s = zmax - st.z;
    const zb = Math.floor(st.z / 0.5); st.log[zb] = (st.log[zb] || 0) + 1;
    st.z += s; st.n++; st.sets.push(s); st.lastS = s; st.lastR = E / (Math.max(s, 0.0005) + c2);
    const last10 = st.sets.slice(-10).reduce((a, b) => a + b, 0);
    if (st.z >= zmax - 1e-6) st.end = 'ok';
    else if (st.sets.length >= 10 && last10 < 0.01) st.end = lt.rock ? 'rock' : 'refusal';
    anim = { t: 0, from: st.z - s, to: st.z };
    upd();
  }
  bOne.addEventListener('click', () => { auto = false; bAuto.textContent = '▶ Folyamatos verés'; blow(); });
  bAuto.addEventListener('click', () => { auto = !auto; bAuto.textContent = auto ? '❚❚ Megállítás' : '▶ Folyamatos verés'; if (st.end) { reset(); upd(); } });
  bNew.addEventListener('click', () => { auto = false; bAuto.textContent = '▶ Folyamatos verés'; reset(); upd(); });
  [sPile, sProf].forEach((c) => c.on(() => { auto = false; bAuto.textContent = '▶ Folyamatos verés'; reset(); upd(); }));
  [sHam, sM, sH].forEach((c) => c.on(() => upd()));
  let acc = 0;
  loop(root, (t, dt) => {
    if (auto && !st.end) { acc += dt; const per = 0.12; while (acc > per) { acc -= per; blow(); if (st.end) { auto = false; bAuto.textContent = '▶ Folyamatos verés'; break; } } }
    if (anim) { anim.t += dt; if (anim.t > 0.35) anim = null; draw(); }
  });
  function upd() {
    const P = PILES[sPile.v], E = energy(), sg = sigma();
    const last10 = st.sets.slice(-10).reduce((a, b) => a + b, 0) * 1000;
    oZ.set(st.z); oN.set(st.n); oS.set(st.lastS === null ? '–' : st.lastS * 1000, st.lastS !== null && st.lastS < 0.0015 ? 'bad' : null, st.lastS === null ? '–' : null);
    o10.set(st.sets.length >= 10 ? last10 : '–', null, st.sets.length >= 10 ? null : '–');
    oE.set(E);
    const lim = P.conc ? 25 : 250;
    oSig.set(sg, sg > lim ? 'bad' : sg > lim * 0.8 ? 'warn' : 'ok');
    oR.set(st.lastR === null ? '–' : st.lastR, null, st.lastR === null ? '–' : null);
    const { lt } = resist(st.z + 1e-6);
    const head = sg > lim ? ` <span>Figyelem: becsült ütésfeszültség ≈ ${fmt(sg, 0)} MPa – ${P.conc ? 'a betoncölöp feje megrepedhet, széteshet' : 'az acélprofil feje deformálódhat'}. Nehezebb kos, kisebb ejtési magasság kíméletesebb.</span>` : '';
    if (st.end === 'ok') ver.set('ok', 'Elérte a tervezett mélységet', `<span>${fmt(st.n, 0)} ütés, a végén ${fmt(last10, 0)} mm beverődés 10 ütésre ${lt.n} rétegben. A dinamikus ellenállás ≈ ${fmt(st.lastR, 0)} kN – ${st.lastR > 1200 ? 'a cölöp jó teherbíró rétegben áll.' : 'kevés: a cölöp nem ért jó teherbíró rétegbe, vagy a szelvény kicsi.'}</span>` + head);
    else if (st.end === 'rock') ver.set('warn', 'Megállt a kőzet felszínén', `<span>A kőzetbe verni nem lehet: a cölöp ${fmt(st.z, 2)} m-en a kőzetre ül. Ha ez a terv (álló cölöp a kőzeten), rendben – a fölösleges hosszt le kell bontani. Vigyázat: ilyenkor a visszaverődő hullám tovább növeli a feszültséget a cölöpben.</span>` + head);
    else if (st.end === 'refusal') ver.set('bad', 'Elakadás a tervezett mélység felett', `<span>A cölöp ${fmt(st.z, 2)} m-en ${/^[aáeéiíoóöőuúüű]/i.test(lt.n) ? 'az' : 'a'} <b>${lt.n}</b> rétegben elakadt (az utolsó 10 ütésre ${fmt(last10, 0)} mm). ${lt.hard ? 'Egy vékony kemény betelepülés is megállíthatja a vert cölöpöt – ki kell emelni, más szelvény vagy más technológia kell.' : 'Növeld az energiát, vagy válassz más cölöpöt.'}</span>` + head);
    else if (st.n === 0) ver.set('', 'Kész a verésre', `<span>A cölöp (${P.t}, L = ${fmt(P.L, 0)} m) a vezetőtoronyban áll. Üss egyet, vagy indítsd a folyamatos verést!</span>` + head);
    else ver.set(head ? 'warn' : '', 'Halad…', `<span>A talp most ${/^[aáeéiíoóöőuúüű]/i.test(lt.n) ? 'az' : 'a'} <b>${lt.n}</b> rétegben jár, ${fmt(st.z, 2)} m mélyen.</span>` + head);
    draw();
  }
  function draw() {
    clear(fig);
    const P = PILES[sPile.v], Ls = layersOf();
    const Y = (z) => GY + z * SC;
    let z = st.z, liftK = 0;
    if (anim) { const k = clamp(anim.t / 0.35, 0, 1); z = k < 0.55 ? anim.from : lerp(anim.from, anim.to, clamp((k - 0.55) / 0.15, 0, 1)); liftK = k < 0.55 ? Math.sin((k / 0.55) * Math.PI / 2) : k < 0.7 ? 1 - (k - 0.55) / 0.15 : 0; }
    rect(fig, 0, 0, 440, GY, 'fill:var(--sky)');
    for (const l of Ls) { const y0 = Y(l.top), y1 = Math.min(Y(Math.min(l.bot, ZMAX)), 500); if (y0 >= 500) continue; soilRect(fig, 0, y0, 440, y1 - y0, l.key); if (y1 - y0 > 13) txt(fig, 8, y0 + 14, l.n, 't-sm halo'); else txt(fig, 300, (y0 + y1) / 2 + 4, '◂ ' + l.n, 't-sm halo'); }
    line(fig, 0, GY, 440, GY, 'stroke:var(--soil-line);stroke-width:1.5');
    for (let k = 0; k <= 13; k++) { line(fig, 440, Y(k), 446, Y(k), 'stroke:var(--muted);stroke-width:1'); if (k % 2 === 0) txt(fig, 449, Y(k) + 4, `${k}`, 't-sm halo'); }
    txt(fig, 449, GY - 8, 'm', 't-sm');
    // gép: lánctalp + vezetőtorony
    rect(fig, PX + 22, 14, 9, GY - 30, 'fill:var(--steelm2)');
    for (let y = 22; y < GY - 20; y += 20) line(fig, PX + 22, y, PX + 31, y + 10, 'stroke:var(--steelm);stroke-width:1.3');
    rect(fig, PX + 14, GY - 30, 150, 24, 'fill:var(--steelm2)', { rx: 4 });
    rect(fig, PX + 90, GY - 58, 64, 28, 'fill:var(--steelm)', { rx: 3 });
    svg('path', { d: `M${PX + 14} ${GY - 6} h150 a6 6 0 0 1 0 6 h-150 a6 6 0 0 1 0 -6z`, style: 'fill:var(--ink2)' }, fig);
    line(fig, PX + 120, GY - 58, PX + 32, 60, 'stroke:var(--steelm2);stroke-width:3');
    // cölöp
    const head = GY - (P.L - z) * SC, tip = head + P.L * SC;
    if (P.conc) {
      rect(fig, PX - P.w / 2, head, P.w, P.L * SC, 'fill:var(--concrete)');
      rect(fig, PX - P.w / 2, head, P.w, P.L * SC, 'fill:url(#pat-conc)', { opacity: 0.8 });
      svg('path', { d: `M${PX - P.w / 2} ${tip} L${PX} ${tip + 8} L${PX + P.w / 2} ${tip}Z`, style: 'fill:var(--concrete2)' }, fig);
    } else {
      rect(fig, PX - P.w / 2, head, P.w, P.L * SC, 'fill:var(--steelm)');
      rect(fig, PX - 2, head, 4, P.L * SC, 'fill:var(--steelm2)');
    }
    if (tip > GY) rect(fig, PX - P.w / 2 - 1, GY, P.w + 2, tip - GY + 8, 'fill:var(--ink)', { opacity: 0.08 });
    // kos + sapka
    const lift = liftK * sH.v * SC;
    rect(fig, PX - 14, head - 8, 28, 8, 'fill:var(--ink2)', { rx: 2 });
    rect(fig, PX - 17, head - 8 - 26 - lift, 34, 26, 'fill:var(--accent)', { rx: 3 });
    txt(fig, PX - 22, head - 18 - lift, `${fmt(sM.v, 1)} t`, 't-num halo', { 'text-anchor': 'end' });
    if (anim && anim.t > 0.19 && anim.t < 0.3 && st.lastS > 0) for (let r = 0; r < 3; r++) svg('ellipse', { cx: PX, cy: GY, rx: 30 + r * 30, ry: 4 + r * 2, style: 'fill:none;stroke:var(--bad);stroke-width:1.3', opacity: 0.55 - r * 0.15 }, fig);
    // tervezett talpmélység
    line(fig, PX - 50, Y(P.L - 0.5), PX + 50, Y(P.L - 0.5), 'stroke:var(--accent);stroke-width:1.2;stroke-dasharray:5 4');
    txt(fig, PX + 54, Y(P.L - 0.5) + 4, 'tervezett talp', 't-sm t-acc halo');
    // verési napló
    const cx0 = 490, cx1 = 712; const bins = Object.keys(st.log).map(Number);
    const mx = Math.max(10, ...bins.map((b) => st.log[b]));
    txt(fig, cx0, 22, 'VERÉSI NAPLÓ', 't-big');
    txt(fig, cx0, 40, 'ütés / 0,5 m', 't-sm');
    line(fig, cx0, GY, cx0, Y(13), 'stroke:var(--line2);stroke-width:1');
    for (const b of bins) {
      const n = st.log[b], w = (n / mx) * (cx1 - cx0 - 30);
      rect(fig, cx0, Y(b * 0.5) + 1, w, 0.5 * SC - 2, n > 40 ? 'fill:var(--bad)' : 'fill:var(--grp)', { opacity: 0.85 });
      if (n >= 3) txt(fig, cx0 + w + 4, Y(b * 0.5) + 0.5 * SC - 2, String(n), 't-sm');
    }
    txt(fig, cx0, GY - 12, `max. ${mx}`, 't-sm');
    if (!bins.length) txt(fig, cx0 + 6, GY + 30, 'még nincs ütés', 't-sm');
    txt(fig, 8, 494, 'Szemléltető modell: R = köpeny + talp, s = η·E/R − c/2', 't-sm');
  }
  upd();
});

/* =================================================================== 3. vibrálás – rezonancia */
const VSOIL = {
  laza: { t: 'Laza homok', f0: 22, z: 0.22, k: 0.85, key: 'soilA', flush: 0.35 },
  tomor: { t: 'Tömör homok', f0: 28, z: 0.25, k: 0.75, key: 'soilD', flush: 0.4 },
  agyag: { t: 'Kötött agyag', f0: 14, z: 0.5, k: 0.28, key: 'soilB', flush: 0.8 },
};
register('elo-vibro', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sS = seg(ctrls, { label: 'Talaj', options: Object.entries(VSOIL).map(([v, o]) => ({ v, t: o.t })), value: 'laza' });
  const sF = slider(ctrls, { label: 'Rezgésszám', sym: 'f', min: 4, max: 45, step: 0.5, value: 8, unit: 'Hz', d: 1 });
  const tFl = toggle(ctrls, { label: 'Öblítéssel egyidejű vibrálás', value: false });
  ctrls.append(h('p', { class: 'ctl-hint' }, 'Tipp: keresd a görbe mélypontját – ott a legkisebb a talaj ellenállása.'));
  const fig = figure(viz, 660, 330);
  const ver = verdict(viz);
  const oF = stat(out, { label: 'Rezgésszám', unit: 'Hz', d: 1 });
  const oR = stat(out, { label: 'Talajellenállás (R / R₀)', unit: '%', d: 0 });
  const oV = stat(out, { label: 'Behatolás (szemléltető)', unit: 'm/perc', d: 1 });
  // excentrikus (forgó tömegű) gerjesztés: az amplitúdó 0-ról indul, a talaj önrezgésszáma körül csúcsosodik
  const ampl = (f, S) => { const r = f / S.f0; return (r * r) / Math.sqrt((1 - r * r) ** 2 + (2 * S.z * r) ** 2); };
  const AMX = {}; const amax = (S) => AMX[S.f0] || (AMX[S.f0] = Math.max(...Array.from({ length: 900 }, (_, i) => ampl(1 + i * 0.1, S))));
  const RS = 0.7, RB = 0.3; // a köpeny és a talp aránya a statikus ellenállásban (R₀ = 1)
  const ratio = (f, S, fl) => { const a = ampl(f, S) / amax(S); const red = 1 - S.k * a; return RS * red + RB * red * (fl ? S.flush : 1); };
  const speed = (rr) => 6 * Math.max(0, 1 - rr * 1.6) / (1 - 0.0);
  let pen = 0;
  let sd = 11; const rn = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const GR = Array.from({ length: 80 }, () => [12 + rn() * 276, 80 + rn() * 245, rn() * 6.28]);
  [sS, sF, tFl].forEach((c) => c.on(() => upd()));
  function upd() {
    const S = VSOIL[sS.v], f = sF.v, rr = ratio(f, S, tFl.v), v = speed(rr);
    oF.set(f); oR.set(rr * 100, rr < 0.4 ? 'ok' : rr < 0.62 ? 'warn' : 'bad'); oV.set(v, v > 2 ? 'ok' : v > 0 ? 'warn' : 'bad');
    const fopt = S.f0 / Math.sqrt(1 - 2 * S.z * S.z);
    let tt, s, body;
    if (sS.v === 'agyag') { s = v > 0.5 ? 'warn' : 'bad'; tt = 'Kötött talajban a vibrálás gyenge'; body = `A kohézió miatt a rezgés alig csökkenti az ellenállást (legjobb esetben is csak kb. ${fmt(S.k * 100, 0)} %-kal). Ide inkább verés, sajtolás vagy fúrt technológia kell.`; }
    else if (rr < 0.4) { s = 'ok'; tt = 'Ráhangoltál!'; body = `≈ ${fmt(fopt, 0)} Hz körül a talaj ellenállása ideiglenesen a minimumra csökken – a cölöp szinte belecsúszik.`; }
    else if (f < 10) { s = 'bad'; tt = 'Túl alacsony rezgésszám'; body = 'Ilyen lassú rezgésnél a talaj még nem „folyósodik el”, viszont a közeli épületek szerkezetei ebben a tartományban rezonálhatnak – indításkor és leállításkor ezen gyorsan kell áthaladni.'; }
    else { s = 'warn'; tt = 'Még nem az igazi'; body = `Az optimum ≈ ${fmt(fopt, 0)} Hz körül van – ${f < fopt ? 'növeld' : 'csökkentsd'} a rezgésszámot.`; }
    if (tFl.v) body += ' Az öblítés a talp alatti ellenállást is csökkenti – de 1–2 m-rel a végleges talpmélység előtt abba kell hagyni, különben a talp alatti talaj fellazul.';
    ver.set(s, tt, `<span>${body}</span>`);
  }
  loop(root, (t, dt) => {
    const S = VSOIL[sS.v], rr = ratio(sF.v, S, tFl.v), v = speed(rr);
    pen += (v / 60) * dt * 4; if (pen > 4) pen = 0;
    draw(t, S, rr);
  });
  function draw(t, S, rr) {
    clear(fig);
    const GY = 70, SC = 24, PX = 140, f = sF.v;
    const a = ampl(f, S) / amax(S);
    rect(fig, 0, 0, 300, GY, 'fill:var(--sky)'); soilRect(fig, 0, GY, 300, 260, S.key);
    line(fig, 0, GY, 300, GY, 'stroke:var(--soil-line);stroke-width:1.5');
    const jig = Math.sin(t * 60) * (1 + 2.5 * a);
    const head = 40 + pen * SC + jig, len = 7 * SC;
    rect(fig, PX - 9, head, 18, len, 'fill:var(--steelm)');
    rect(fig, PX - 26, head - 30, 52, 30, 'fill:var(--accent)', { rx: 4 });
    txt(fig, PX + 32, head - 12, 'vibrátor', 't-sm halo');
    if (tFl.v) { for (const s of [-1, 1]) line(fig, PX + s * 6, head, PX + s * 6, head + len - 4, 'stroke:var(--water);stroke-width:1.6'); for (let i = 0; i < 6; i++) svg('circle', { cx: PX + (i % 2 ? 6 : -6) + Math.sin(t * 9 + i) * 8, cy: head + len + 4 + ((t * 40 + i * 9) % 26), r: 2.2, style: 'fill:var(--water)', opacity: 0.7 }, fig); }
    // szemcsék
    for (let i = 0; i < GR.length; i++) {
      const [x0, y0] = GR[i];
      if (Math.abs(x0 - PX) < 14) continue;
      const d = Math.abs(x0 - PX); const amp = (1.2 + 5 * a) * Math.exp(-d / 70);
      svg('circle', { cx: x0 + Math.sin(t * 55 + i * 1.7) * amp, cy: y0 + Math.cos(t * 61 + i) * amp * 0.6, r: sS.v === 'agyag' ? 1.6 : 2.4, style: 'fill:var(--ink2)', opacity: 0.45 }, fig);
    }
    // köpeny menti ellenállás nyilak
    const n = Math.round(4 * rr / 1);
    for (let k = 0; k < 4; k++) { const y = GY + 30 + k * 45; if (k < Math.max(1, n)) for (const s of [-1, 1]) arr(fig, PX + s * 9 + s * 22, y + 12, PX + s * 9 + s * 22, y - 10 + 22 * (1 - rr), 'var(--bad)', 1.8, 6); }
    // grafikon
    const x0 = 340, x1 = 645, y0 = 30, y1 = 270, F0 = 4, F1 = 45;
    const X = (ff) => x0 + ((ff - F0) / (F1 - F0)) * (x1 - x0), Yv = (v) => y1 - v * (y1 - y0);
    rect(fig, X(4), y0, X(10) - X(4), y1 - y0, 'fill:var(--warn)', { opacity: 0.12 });
    txt(fig, 0, 0, 'épület-rezonancia', 't-sm', { 'text-anchor': 'middle', transform: `translate(${(X(4) + X(10)) / 2 + 4},${(y0 + y1) / 2}) rotate(-90)` });
    line(fig, x0, y1, x1, y1, 'stroke:var(--line2)'); line(fig, x0, y0, x0, y1, 'stroke:var(--line2)');
    for (let ff = 5; ff <= 45; ff += 5) { line(fig, X(ff), y1, X(ff), y1 + 4, 'stroke:var(--muted)'); txt(fig, X(ff), y1 + 16, String(ff), 't-sm', { 'text-anchor': 'middle' }); }
    txt(fig, x1, y1 + 30, 'f (Hz)', 't-sm', { 'text-anchor': 'end' });
    for (const v of [0, 0.5, 1]) txt(fig, x0 - 6, Yv(v) + 4, fmt(v * 100, 0) + '%', 't-sm', { 'text-anchor': 'end' });
    const pa = [], pr = [];
    for (let ff = F0; ff <= F1; ff += 0.5) { pa.push([X(ff), Yv(ampl(ff, S) / amax(S))]); pr.push([X(ff), Yv(ratio(ff, S, tFl.v))]); }
    svg('path', { d: pathD(pa), style: 'fill:none;stroke:var(--muted);stroke-width:1.6;stroke-dasharray:5 4' }, fig);
    svg('path', { d: pathD(pr), style: 'fill:none;stroke:var(--grp);stroke-width:2.6' }, fig);
    txt(fig, x1 - 4, y0 + 2, 'talajellenállás R/R₀', 't-sm t-grp', { 'text-anchor': 'end' });
    txt(fig, x1 - 4, y0 + 22, 'rezgési amplitúdó', 't-sm', { 'text-anchor': 'end' });
    line(fig, X(f), y0, X(f), y1, 'stroke:var(--accent);stroke-width:1.4');
    svg('circle', { cx: X(f), cy: Yv(rr), r: 6, style: 'fill:var(--accent);stroke:var(--surface);stroke-width:2' }, fig);
    txt(fig, 645, 322, 'Szemléltető modell', 't-sm', { 'text-anchor': 'end' });
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
  const fig = figure(viz, 660, 380);
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
    if (u > 1) ver.set('bad', 'Túl nagy rezgés', `<span>${T.t}, ${fmt(sR.v, 1)} m-re: ≈ ${fmt(v, 1)} mm/s${pk}. Ez a határérték (${B.t.toLowerCase()}: kb. ${B.lim} mm/s) ${fmt(u * 100, 0)} %-a. Legalább ≈ ${fmt(rmin, 0)} m távolság, vagy zaj- és rezgésszegény technológia kell.</span>`);
    else if (u > 0.7) ver.set('warn', 'Határeset – mérni kell', `<span>≈ ${fmt(v, 1)} mm/s${pk}: közel a határhoz. A munka alatt rezgésmérővel kell figyelni a szomszédot.</span>`);
    else ver.set('ok', 'Elviselhető rezgés', `<span>≈ ${fmt(v, 1)} mm/s${pk} – a határérték ${fmt(u * 100, 0)} %-a. ${sT.v === 'vert' ? 'Közelebb érve vagy nagyobb energiával ez gyorsan megváltozik.' : 'Ez a technológia érzékeny környezetben is jó választás lehet.'}</span>`);
  }
  loop(root, (t) => draw(t));
  function draw(t) {
    clear(fig);
    const T = TECH[sT.v], B = BLD[sB.v], r = sR.v;
    const v = vAt(sT.v, r) * (T.peak || 1), u = v / B.lim;
    const GY = 120, X = (m) => 70 + (m / 60) * 560;
    rect(fig, 0, 0, 660, GY, 'fill:var(--sky)'); soilRect(fig, 0, GY, 660, 42, 'soilA');
    line(fig, 0, GY, 660, GY, 'stroke:var(--soil-line);stroke-width:1.5');
    // gép
    const gx = X(0);
    rect(fig, gx - 4, 18, 8, GY - 30, 'fill:var(--steelm2)'); rect(fig, gx - 30, GY - 22, 60, 18, 'fill:var(--steelm2)', { rx: 3 });
    // hullámok
    const amp = Math.min(1, v10(sT.v) / 15);
    for (let k = 0; k < 4; k++) { const rr = ((t * 70 + k * 45) % 180); svg('path', { d: `M${gx - rr} ${GY} A${rr} ${rr * 0.32} 0 0 0 ${gx + rr} ${GY}`, style: `fill:none;stroke:var(--bad);stroke-width:${1 + 1.5 * amp}`, opacity: (1 - rr / 180) * (0.25 + 0.6 * amp) }, fig); }
    // épület
    const bx = X(r), sh = Math.sin(t * 40) * Math.min(4, u * 2.2);
    const col = u > 1 ? 'var(--bad)' : u > 0.7 ? 'var(--warn)' : 'var(--ok)';
    const bw = sB.v === 'ipari' ? 70 : 52, bh = sB.v === 'ipari' ? 64 : sB.v === 'mu' ? 84 : 72;
    const g = svg('g', { transform: `translate(${sh},0)` }, fig);
    rect(g, bx, GY - bh, bw, bh, 'fill:var(--building);stroke:' + col + ';stroke-width:2.5');
    if (sB.v === 'mu') svg('path', { d: `M${bx - 4} ${GY - bh} L${bx + bw / 2} ${GY - bh - 26} L${bx + bw + 4} ${GY - bh}Z`, style: 'fill:var(--building2);stroke:' + col + ';stroke-width:2' }, g);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) rect(g, bx + 8 + j * (bw / 2 - 2), GY - bh + 10 + i * 20, bw / 2 - 18, 10, 'fill:var(--building2)');
    if (u > 1) svg('path', { d: `M${bx + bw * 0.6} ${GY - bh + 4} l-6 12 l8 6 l-7 14`, style: 'fill:none;stroke:var(--bad);stroke-width:1.8' }, g);
    line(fig, gx, GY + 26, bx, GY + 26, 'stroke:var(--ink);stroke-width:1');
    txt(fig, (gx + bx) / 2, GY + 22, `r = ${fmt(r, 1)} m`, 't-num halo', { 'text-anchor': 'middle' });
    // grafikon – log y
    const cx0 = 70, cx1 = 630, cy0 = 190, cy1 = 350, LMIN = -1, LMAX = 2;
    const Yl = (vv) => clamp(cy1 - ((Math.log10(Math.max(vv, 0.1)) - LMIN) / (LMAX - LMIN)) * (cy1 - cy0), cy0 - 6, cy1);
    line(fig, cx0, cy1, cx1, cy1, 'stroke:var(--line2)'); line(fig, cx0, cy0, cx0, cy1, 'stroke:var(--line2)');
    for (const vv of [0.1, 1, 10, 100]) { line(fig, cx0, Yl(vv), cx1, Yl(vv), 'stroke:var(--line);stroke-width:1'); txt(fig, cx0 - 6, Yl(vv) + 4, fmt(vv, vv < 1 ? 1 : 0), 't-sm', { 'text-anchor': 'end' }); }
    txt(fig, cx0 - 6, cy0 - 8, 'mm/s', 't-sm', { 'text-anchor': 'end' });
    for (let m = 0; m <= 60; m += 10) txt(fig, X(m), cy1 + 15, String(m), 't-sm', { 'text-anchor': 'middle' });
    txt(fig, cx1, cy1 + 28, 'távolság (m)', 't-sm', { 'text-anchor': 'end' });
    for (const [k, Tk] of Object.entries(TECH)) {
      const pts = []; for (let m = 2; m <= 60; m += 1) pts.push([X(m), Yl(vAt(k, m) * (Tk.peak || 1))]);
      const on = k === sT.v;
      svg('path', { d: pathD(pts), style: `fill:none;stroke:${on ? 'var(--grp)' : 'var(--faint)'};stroke-width:${on ? 3 : 1.2}`, opacity: on ? 1 : 0.8 }, fig);
    }
    line(fig, cx0, Yl(B.lim), cx1, Yl(B.lim), `stroke:var(--bad);stroke-width:1.4;stroke-dasharray:6 4`);
    txt(fig, cx0 + 6, Yl(B.lim) - 5, `határ: ${B.t.toLowerCase()} ≈ ${B.lim} mm/s`, 't-sm t-bad halo');
    svg('circle', { cx: X(r), cy: Yl(v), r: 6, style: `fill:${col};stroke:var(--surface);stroke-width:2` }, fig);
    txt(fig, X(2) + 4, Yl(vAt(sT.v, 2) * (T.peak || 1)) + (Yl(vAt(sT.v, 2) * (T.peak || 1)) < cy0 + 12 ? 14 : -6), T.t, 't-sm t-grp halo');
    txt(fig, cx1, cy0 - 8, 'Szemléltető modell: v = v₁₀·(10 m / r)ⁿ', 't-sm', { 'text-anchor': 'end' });
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
  { q: 'Melyik jellemző a talajcsavarra?', a: ['40–60 cm-ként egy-egy menet az üreges száron, jellemzően legfeljebb 2–3 m', 'Folyamatos spirál végig, 10–15 m hosszban', 'Nagy átmérőjű vasbeton törzs, kontraktorcsöves betonozással', 'Csak veréssel juttatható le'], c: 0, e: 'A talajcsavar nem folyamatos spirállal készül: 40–60 cm-ként van rajta egy-egy menet. Kis terhelésű, 1–2 szintes könnyűszerkezetes házakhoz, napelemparkokhoz, lelátókhoz használják.' },
  { q: 'Miért tartós a facölöp a talajvízszint alatt?', a: ['Mert oxigén hiányában a fa nem korhad', 'Mert a víz kioldja belőle a gyantát', 'Mert a víz alatt a fa megkövesedik', 'Mert ott nagyobb a földnyomás'], c: 0, e: 'Víz alatt, oxigén nélkül a korhasztó gombák és a rovarok nem élnek meg. Ha a talajvízszint lesüllyed, a cölöpfejek a levegőre kerülnek és korhadni kezdenek.' },
]);
