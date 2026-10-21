// C01 – Mi a mélyalapozás? Okok, döntés-widget, tornyok léptékben, kimosáslabor, talp és köpeny, a cölöpalap részei
import { $, $$, h, svg, figure, clear, fmt, clamp, lerp, register, shell, slider, seg, toggle, stat, verdict, arrow, pathD, loop } from './core.js';
import { defineQuiz } from './ui.js';

const NB = ' ';
const T = (parent, x, y, text, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text, ...o }, parent);
const hatch = (parent, x, y, w, hh, cls, pat, op = 0.55) => {
  svg('rect', { x, y, width: w, height: hh, class: cls }, parent);
  svg('rect', { x, y, width: w, height: hh, fill: `url(#${pat})`, opacity: op }, parent);
};
// vasbeton test (a teteje mindig vízszintes, keresztmetszete téglalap)
const conc = (parent, x, y, w, hh, cls = 'f-conc') => {
  svg('rect', { x, y, width: w, height: hh, class: cls }, parent);
  svg('rect', { x, y, width: w, height: hh, fill: 'url(#pat-conc)', opacity: 0.7 }, parent);
  svg('rect', { x, y, width: w, height: hh, fill: 'none', class: 's-ink', 'stroke-width': 0.8, opacity: 0.45 }, parent);
};
const water = (parent, x1, x2, y, lab = 'TV') => {
  svg('line', { x1, y1: y, x2, y2: y, class: 's-water', 'stroke-width': 1.6, 'stroke-dasharray': '7 4' }, parent);
  svg('path', { d: `M${x2 - 26} ${y - 9} h12 l-6 8 z`, style: 'fill: var(--water)' }, parent);
  T(parent, x2 - 30, y - 3, lab, 't-sm t-water', { 'text-anchor': 'end' });
};

/* ================================================================ 1.1 okok (ikonos kártyák) */
const OKOK = [
  { k: 'mely', t: 'Mélyen fekvő teherbíró\u00A0réteg', p: 'Megbízható teherbíró réteg csak mélyebben van – felette puha agyag, tőzeg vagy feltöltés.' },
  { k: 'teher', t: 'Nagy terhelések', p: 'Tornyok, hídpillérek, nehéz ipari berendezések: a talpfeszültséget a felső rétegek nem bírnák el.' },
  { k: 'sully', t: 'Meg nem engedhető süllyedés', p: 'Síkalappal túl nagy vagy túl egyenlőtlen süllyedés keletkezne – például dőlésre érzékeny tornyoknál.' },
  { k: 'viz', t: 'Magas talajvízszint', p: 'A síkalaphoz vízzáró munkagödör és víztelenítés kellene; összességében sokszor a mélyalap a gazdaságosabb.' },
  { k: 'kimos', t: 'Kimosás, kiüregelés', p: 'A hidak mederpillérei körül a víz kimélyíti a medret: az alapnak a kimosási mélység alá kell nyúlnia.' },
  { k: 'csuszas', t: 'Elcsúszás veszélye', p: 'Nagy ferdeségű teher alatt a síkalap elcsúszhatna az alapsíkon; a cölöpök a vízszintes erőt is felveszik.' },
];
function okIcon(k) {
  const s = svg('svg', { viewBox: '0 0 120 72', class: 'alap-oki', 'aria-hidden': 'true' });
  const g0 = 26;
  svg('rect', { x: 0, y: 0, width: 120, height: g0, class: 'f-sky' }, s);
  if (k === 'mely') {
    hatch(s, 0, g0, 120, 32, 'f-soilB', 'pat-clay'); hatch(s, 0, g0 + 32, 120, 14, 'f-soilD', 'pat-gravel');
    conc(s, 40, g0 - 2, 40, 5);
    for (const x of [46, 58, 70]) conc(s, x, g0 + 3, 4, 38, 'f-conc2');
    svg('rect', { x: 44, y: 4, width: 32, height: g0 - 6, class: 'f-bld' }, s);
  } else if (k === 'teher') {
    hatch(s, 0, g0, 120, 46, 'f-soilB', 'pat-clay');
    svg('path', { d: 'M52 24 L56 2 L64 2 L68 24 Z', class: 'f-bld2' }, s);
    conc(s, 40, g0 - 2, 40, 6);
    arrow(s, 60, -4, 60, 18, { cls: 's-bad', w: 3, head: 8 });
    for (const x of [44, 52, 60, 68, 76]) arrow(s, x, g0 + 6, x, g0 + 18, { cls: 's-bad', w: 1.4, head: 5 });
  } else if (k === 'sully') {
    hatch(s, 0, g0, 120, 46, 'f-soilB', 'pat-clay');
    const gg = svg('g', { transform: 'rotate(6 60 26)' }, s);
    svg('rect', { x: 46, y: 0, width: 28, height: g0 - 2, class: 'f-bld' }, gg);
    conc(gg, 42, g0 - 2, 36, 5);
    svg('path', { d: 'M30 27 Q60 40 92 27', fill: 'none', class: 's-bad', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, s);
  } else if (k === 'viz') {
    hatch(s, 0, g0, 120, 46, 'f-soilA', 'pat-sand');
    svg('rect', { x: 0, y: g0 + 12, width: 120, height: 34, class: 'f-water' }, s);
    svg('rect', { x: 36, y: g0, width: 48, height: 24, class: 'f-sky' }, s);
    conc(s, 40, g0 + 18, 40, 5);
    for (const x of [36, 84]) svg('rect', { x: x - 1.5, y: g0 - 2, width: 3, height: 34, class: 'f-steel2' }, s);
    water(s, 0, 120, g0 + 12, '');
  } else if (k === 'kimos') {
    svg('rect', { x: 0, y: 6, width: 120, height: g0 + 6, class: 'f-water' }, s);
    const bed = 40;
    svg('path', { d: `M0 ${bed} H34 Q46 ${bed + 18} 60 ${bed + 18} Q74 ${bed + 18} 86 ${bed} H120 V72 H0 Z`, class: 'f-soilA' }, s);
    svg('path', { d: `M0 ${bed} H34 Q46 ${bed + 18} 60 ${bed + 18} Q74 ${bed + 18} 86 ${bed} H120 V72 H0 Z`, fill: 'url(#pat-sand)', opacity: 0.6 }, s);
    conc(s, 54, 0, 12, bed + 6, 'f-conc2'); conc(s, 44, bed + 2, 32, 6);
    for (const y of [14, 22]) svg('path', { d: `M4 ${y} q8 -4 16 0 t16 0`, fill: 'none', class: 's-water', 'stroke-width': 1.4 }, s);
  } else if (k === 'csuszas') {
    hatch(s, 0, g0, 120, 46, 'f-soilB', 'pat-clay');
    conc(s, 40, g0 - 2, 40, 8);
    svg('rect', { x: 55, y: 4, width: 10, height: g0 - 6, class: 'f-conc2' }, s);
    arrow(s, 38, -2, 62, 16, { cls: 's-bad', w: 3, head: 8 });
    arrow(s, 66, g0 + 12, 94, g0 + 12, { cls: 's-warn', w: 2, head: 7 });
  }
  return s;
}
register('alap-okok', (root) => {
  for (const o of OKOK) root.append(h('div', { class: 'alap-ok' }, okIcon(o.k), h('div', {}, h('b', {}, o.t), h('p', {}, o.p))));
});

/* ================================================================ 1.1 döntés-widget */
register('alap-dontes', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sD = slider(ctrls, { label: 'A teherbíró réteg teteje', min: 0.5, max: 24, step: 0.5, value: 9, unit: 'm', d: 1, hint: 'tömör homokos kavics a terepszint alatt; felette puha agyag' });
  const sN = slider(ctrls, { label: 'Szintek száma', min: 1, max: 40, step: 1, value: 8, d: 0, hint: 'átlagosan kb. 12 kPa teher szintenként' });
  const sB = seg(ctrls, { label: 'Pinceszint', options: [{ v: 1.5, t: 'Nincs' }, { v: 4.5, t: '1 szint' }, { v: 7.5, t: '2 szint' }], value: 1.5 });
  const sW = slider(ctrls, { label: 'Talajvízszint', min: 0, max: 12, step: 0.5, value: 3, unit: 'm', d: 1, hint: 'a terepszint alatt' });
  const sS = seg(ctrls, { label: 'Süllyedésérzékenység', options: [{ v: 50, t: 'Normál' }, { v: 25, t: 'Érzékeny' }, { v: 15, t: 'Szigorú' }], value: 50 });
  const tK = toggle(ctrls, { label: 'Folyómeder – kimosásveszély', value: false });
  const tF = toggle(ctrls, { label: 'Nagy ferde teher (pl. földnyomás)', value: false });
  const s = figure(viz, 560, 360);
  const oH = stat(out, { label: 'Puha réteg az alapsík alatt', unit: 'm', d: 1 });
  const oS = stat(out, { label: 'Várható süllyedés síkalappal', unit: 'mm', d: 0 });
  const oQ = stat(out, { label: 'Az épület átlagos terhe', unit: 'kPa', d: 0 });
  const vd = verdict(null); out.append(vd.el); vd.el.style.gridColumn = '1 / -1';

  const G = 128, K = 220 / 26; // terepszint (px), px/m a terep alatt
  const Y = (z) => G + z * K;
  function model() {
    const D = sD.v, n = sN.v, df = sB.v, w = sW.v, allow = sS.v;
    const q = 12 * n, qnet = Math.max(0, q - 19 * df);
    const Hs = Math.max(0, D - df);
    const onGood = Hs <= 0.3;
    const sMm = 1000 * (0.75 * qnet * Hs / 3500) + (onGood ? 6 : 10) * Math.min(1, q / 150);
    const R = onGood ? 700 : (5.14 * 25 + 19 * df) / 1.4;
    const why = [];
    let bad = false, warn = 0;
    if (tK.v) { bad = true; why.push(['bad', 'Kimosásveszély: a síkalap alá mosódhat, az alapnak a várható kimosási mélység alá kell nyúlnia.']); }
    if (q > R) { bad = true; why.push(['bad', `A puha réteg nem bírja el a terhet (talajtörés veszélye): ${fmt(q, 0)}${NB}kPa > kb. ${fmt(R, 0)}${NB}kPa.`]); }
    if (sMm > allow) { bad = true; why.push(['bad', `A síkalap süllyedése (kb. ${fmt(sMm, 0)}${NB}mm) nagyobb a megengedettnél (kb. ${allow}${NB}mm).`]); }
    else if (!onGood) why.push(['ok', `A süllyedés (kb. ${fmt(sMm, 0)}${NB}mm) még belefér a kb. ${allow}${NB}mm‑es korlátba.`]);
    if (w < df) { warn++; why.push(['warn', 'A talajvíz az alapsík felett van: a síkalaphoz vízzáró munkagödör és víztelenítés kellene – ez sokszor drágább a mélyalapnál.']); }
    if (tF.v) { warn++; why.push(['warn', 'Nagy ferde teher: a síkalapot elcsúszásra is vizsgálni kell; a cölöpök a vízszintes erőt is fel tudják venni.']); }
    if (df > 1.6 && qnet < q) why.push(['ok', `A pince kiemelt földje „tehermentesít”: a többletteher csak kb. ${fmt(qnet, 0)}${NB}kPa.`]);
    let rec, st;
    if (!bad) {
      if (warn >= 2) { rec = 'kerdes'; st = 'warn'; }
      else { rec = 'sik'; st = 'ok'; }
    } else if (!tK.v && D <= 6 && w >= D && Hs <= 4.5) { rec = 'tomb'; st = 'warn'; }
    else { rec = 'colop'; st = 'bad'; }
    return { D, n, df, w, q, qnet, Hs, sMm, allow, R, why, rec, st, onGood };
  }
  function draw() {
    const m = model();
    clear(s);
    // ég, talaj
    svg('rect', { x: 0, y: 0, width: 560, height: G, class: 'f-sky' }, s);
    const yD = Y(m.D);
    hatch(s, 0, G, 560, yD - G, 'f-soilB', 'pat-clay');
    hatch(s, 0, yD, 560, 360 - yD, 'f-soilD', 'pat-gravel');
    svg('line', { x1: 0, y1: yD, x2: 560, y2: yD, class: 's-soil', 'stroke-width': 1.2 }, s);
    svg('line', { x1: 0, y1: G, x2: 560, y2: G, class: 's-ink', 'stroke-width': 1.5 }, s);
    if (m.D > 1.2) T(s, 12, G + 16, 'puha agyag', 't-sm halo');
    T(s, 548, Math.min(352, yD + 16), 'teherbíró réteg', 't-sm halo', { 'text-anchor': 'end' });
    // kimosás: meder, víz
    if (tK.v) {
      svg('rect', { x: 0, y: G - 30, width: 150, height: 30, class: 'f-water' }, s);
      svg('path', { d: `M10 ${G - 18} q10 -5 20 0 t20 0 t20 0 t20 0`, fill: 'none', class: 's-water', 'stroke-width': 1.5 }, s);
      svg('path', { d: `M150 ${G} q20 34 50 34 h0`, fill: 'none', class: 's-bad', 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }, s);
      T(s, 14, G - 36, 'meder, árvíz', 't-sm t-water halo');
      T(s, 160, G + 50, 'kimosás', 't-sm t-bad halo');
    }
    // épület
    const bx = 200, bw = 170, yF = Y(m.df);
    const fh = Math.min(13, (G - 16) / m.n), top = G - fh * m.n;
    svg('rect', { x: bx, y: top, width: bw, height: G - top, class: 'f-bld' }, s);
    for (let i = 1; i < m.n; i++) svg('line', { x1: bx, y1: G - i * fh, x2: bx + bw, y2: G - i * fh, class: 's-line', 'stroke-width': fh > 5 ? 1 : 0.5 }, s);
    svg('rect', { x: bx, y: top, width: bw, height: G - top, fill: 'none', class: 's-ink', 'stroke-width': 1, opacity: 0.5 }, s);
    if (m.df > 1.6) { svg('rect', { x: bx, y: G, width: bw, height: yF - G, class: 'f-bld2' }, s); T(s, bx + bw / 2, (G + yF) / 2 + 4, 'pince', 't-sm', { 'text-anchor': 'middle' }); }
    T(s, bx + bw + 8, top + 12, `${m.n} szint`, 't-num halo');
    // talajvíz
    water(s, 0, 560, Y(m.w));
    // alap
    const fx = bx - 12, fw = bw + 24;
    if (m.rec === 'sik' || m.rec === 'kerdes') {
      conc(s, fx, yF, fw, 0.9 * K);
      // süllyedési teknő (torzítva)
      const dd = clamp(m.sMm / 6, 2, 34);
      svg('path', { d: `M${fx - 40} ${yF + 0.9 * K + 2} Q${fx + fw / 2} ${yF + 0.9 * K + 2 + dd * 2} ${fx + fw + 40} ${yF + 0.9 * K + 2}`, fill: 'none', class: m.sMm > m.allow ? 's-bad' : 's-ok', 'stroke-width': 1.6, 'stroke-dasharray': '5 4' }, s);
    } else if (m.rec === 'tomb') {
      conc(s, fx, yF, fw, 0.7 * K);
      for (const x of [fx + 6, fx + fw / 2 - 16, fx + fw - 38]) conc(s, x, yF + 0.7 * K, 32, Math.max(4, yD + 0.6 * K - yF - 0.7 * K), 'f-conc2');
      T(s, fx + fw + 10, (yF + yD) / 2 + 4, 'markolt tömbök', 't-sm halo');
    } else {
      conc(s, fx, yF, fw, 1.0 * K);
      const tip = Math.min(356, yD + 3 * K);
      const nP = 6;
      for (let i = 0; i < nP; i++) { const x = fx + 10 + i * ((fw - 28) / (nP - 1)); conc(s, x, yF + K, 8, tip - yF - K, 'f-conc2'); }
      T(s, fx + fw + 10, Math.min(346, (yF + tip) / 2 + 4), `cölöpök (~${fmt(Math.max(4, m.D + 3 - m.df), 0)}${NB}m)`, 't-sm halo');
    }
    // mélység-méret
    svg('line', { x1: 534, y1: G, x2: 534, y2: yD, class: 's-muted', 'stroke-width': 1 }, s);
    for (const y of [G, yD]) svg('line', { x1: 530, y1: y, x2: 538, y2: y, class: 's-muted', 'stroke-width': 1 }, s);
    T(s, 528, (G + yD) / 2 + 4, `${fmt(m.D, 1)}${NB}m`, 't-num halo', { 'text-anchor': 'end' });
    // kimenet
    oH.set(m.Hs, m.Hs > 4 ? 'warn' : null);
    oS.set(m.sMm, m.sMm > m.allow ? 'bad' : 'ok');
    oQ.set(m.q);
    const REC = {
      sik: ['Síkalap', m.onGood ? 'A síkalap közvetlenül a teherbíró rétegre kerülhet.' : 'Síkalappal (pl. vasbeton lemezalappal) ez az épület megoldható.'],
      kerdes: ['Síkalap – de mérlegelni kell', 'Statikailag a síkalap megfelelhet, de a mellékkörülmények miatt a mélyalap összességében gazdaságosabb lehet.'],
      tomb: ['Átmeneti megoldás: markolt tömbalap', 'A teherbíró réteg nincs mélyen, a talajvíz alatta van: kötött talajban a tömbök megtámasztás nélkül kimarkolhatók és rögtön kibetonozhatók (kb. 5–6 m‑ig).'],
      colop: ['Mélyalap: cölöpalap', `A terhet a ${fmt(m.D, 1)}${NB}m mélyen lévő teherbíró rétegbe kell levinni – a cölöpöket kb. 3 m‑rel befogjuk a jó rétegbe.` + (m.n >= 30 ? ' Ekkora toronynál nagy átmérőjű fúrt cölöpök, barettek és vastag lemez jönnek szóba.' : '') + (m.D > 18 ? ' Ilyen mélyen fekvő rétegnél a hosszú lebegő cölöp vagy a cölöpös lemezalap is reális.' : '')],
    }[m.rec];
    vd.set(m.st, REC[0], `<p>${REC[1]}</p><ul class="alap-why">${m.why.map(([k, t]) => `<li class="${k}">${t}</li>`).join('')}</ul>`);
  }
  [sD, sN, sB, sW, sS, tK, tF].forEach((c) => c.on(draw));
  draw();
  root.append(h('div', { class: 'w-foot', html: '<b>Szemléltető modell:</b> a süllyedést egy egyszerű összenyomódási becslés adja (puha agyag, E<sub>s</sub> ≈ 3,5 MPa), a talajtörést a drénezetlen teherbírás közelítése. Valódi tervezésnél talajvizsgálat és részletes számítás dönt.' }));
});

/* ================================================================ 1.2 tornyok léptékben */
const TW = [
  { k: 'panel', n: 'Panelház', hgt: 30, loc: 'Budapest', yr: 'az 1970–80-as évek', f: 'síkalap vagy cölöp', fd: 3,
    p: 'Egy tízemeletes panelház kb. 30 m magas. Jó altalajon vasbeton sáv- vagy lemezalapon áll, kb. 2–3 m mélyen; kedvezőtlen altalajon cölöpökre alapozták.',
    l: 'Viszonyítási alap: a többi építmény mellett a panelház alapja szinte láthatatlan.' },
  { k: 'wind', n: 'Szélerőmű', hgt: 185, loc: 'szárazföldi szélpark', yr: 'napjainkban', f: 'vasbeton talp (gyenge talajon cölöpökkel)', fd: 3,
    p: 'A modern szárazföldi szélerőmű tornya kb. 100–150 m magas, a lapátvég 200 m közelébe is felér. Alapja jellemzően egy kb. 15–25 m átmérőjű, 2–3 m vastag vasbeton talp, gyenge talajon cölöpökkel.',
    l: 'A mértékadó a torony dőlése: a megengedett egyenlőtlen süllyedés kb. 3 mm/m.' },
  { k: 'cn', n: 'CN Tower', hgt: 553, loc: 'Toronto, Kanada', yr: '1976', f: '15 m mélyre vitt vasbeton alap', fd: 15,
    p: 'Több mint 30 évig a világ legmagasabb szabadon álló építménye volt. A 553 m magas torony terhét 15 m mélyre vitt vasbeton alap adja át a kőzetre (agyagpalára).',
    l: 'Ha a teherbíró réteg elérhető mélységben van, egy masszív, mélyre vitt alap is elég.' },
  { k: 'tp', n: 'Taipei 101', hgt: 508, loc: 'Tajpej, Tajvan', yr: '2004', f: '380 db fúrt cölöp, kb. 80 m', fd: 80,
    p: 'A toronyház 380 db, 1,5 m átmérőjű fúrt cölöpön áll: ezek kb. 80 m mélyre, a kőzetbe akár 30 m‑rel befogva érnek le. A terület földrengés- és tájfunveszélyes.',
    l: 'Nagy átmérőjű fúrt cölöpök viszik le a terhet a mélyebb teherbíró rétegbe.' },
  { k: 'pet', n: 'Petronas-tornyok', hgt: 452, loc: 'Kuala Lumpur, Malajzia', yr: '1998', f: '104 réselt elem (barett), 60–115 m', fd: 115,
    p: 'A teherbíró réteg nagyon mélyen fekszik, ezért tornyonként 104 réselt vasbeton elem (barett) készült, 60–115 m hosszan, rajtuk kb. 4,5 m vastag lemezzel. Az alapozás a terepszinttől mérve kb. 120 m mélyre nyúlik.',
    l: 'Kedvezőtlen altalaj: a teher nagy részét a köpenymenti ellenállás viszi.' },
  { k: 'burj', n: 'Burdzs Kalifa', hgt: 828, loc: 'Dubaj, Egyesült Arab Emírségek', yr: '2010', f: '192 db fúrt cölöp, kb. 43 m + lemez', fd: 50,
    p: 'A világ legmagasabb épülete egy 3,7 m vastag vasbeton lemezen áll, amelyet 192 db, 1,5 m átmérőjű, kb. 43 m hosszú fúrt cölöp támaszt alá – cölöpös lemezalap.',
    l: 'Majdnem kétszer olyan magas, mint a Petronas, mégis jóval rövidebb cölöpökön áll: az alap mélységét a talaj szabja meg.' },
];
function towerShape(g, k, x, Yz, kx, cls) {
  // Yz(m) → px (terep feletti magasság), kx: px/m vízszintesen
  const P = (pts) => svg('path', { d: pathD(pts.map(([a, b]) => [x + a * kx, Yz(b)]), true), class: cls }, g);
  if (k === 'panel') { P([[-30, 0], [30, 0], [30, 30], [-30, 30]]); }
  if (k === 'wind') {
    P([[-2.6, 0], [2.6, 0], [1.4, 120], [-1.4, 120]]);
    P([[-3, 118], [9, 118], [9, 122.5], [-3, 122.5]]);
  }
  if (k === 'cn') {
    P([[-16, 0], [16, 0], [5, 330], [-5, 330]]);
    P([[-20, 330], [20, 330], [20, 352], [-20, 352]]);
    P([[-3, 352], [3, 352], [2, 445], [-2, 445]]);
    P([[-4, 445], [4, 445], [4, 452], [-4, 452]]);
    P([[-1, 452], [1, 452], [0.3, 553], [-0.3, 553]]);
  }
  if (k === 'tp') {
    P([[-30, 0], [30, 0], [26, 100], [-26, 100]]);
    for (let i = 0; i < 8; i++) { const b = 100 + i * 34; P([[-22, b], [22, b], [27, b + 34], [-27, b + 34]]); }
    P([[-18, 372], [18, 372], [14, 448], [-14, 448]]);
    P([[-1.2, 448], [1.2, 448], [0.3, 508], [-0.3, 508]]);
  }
  if (k === 'pet') {
    for (const c of [-40, 40]) {
      P([[c - 23, 0], [c + 23, 0], [c + 23, 300], [c - 23, 300]]);
      P([[c - 18, 300], [c + 18, 300], [c + 16, 380], [c - 16, 380]]);
      P([[c - 11, 380], [c + 11, 380], [c + 9, 415], [c - 9, 415]]);
      P([[c - 5, 415], [c + 5, 415], [c + 3, 435], [c - 3, 435]]);
      P([[c - 1, 435], [c + 1, 435], [c + 0.2, 452], [c - 0.2, 452]]);
    }
    P([[-17, 170], [17, 170], [17, 179], [-17, 179]]);
  }
  if (k === 'burj') {
    const tiers = [[0, 150, 36], [150, 300, 28], [300, 450, 20], [450, 585, 13], [585, 640, 7]];
    for (const [a, b, w] of tiers) P([[-w, a], [w, a], [w * 0.92, b], [-w * 0.92, b]]);
    P([[-3, 640], [3, 640], [0.4, 828], [-0.4, 828]]);
  }
}
function towerFound(g, k, x, Zd, kx) {
  // Zd(m) → px (terep alatti mélység); vasbeton: vízszintes tetejű téglalapok
  const R = (a, b, z0, z1, cls = 'f-conc') => conc(g, x + a * kx, Zd(z0), (b - a) * kx, Math.max(1.2, Zd(z1) - Zd(z0)), cls);
  const piles = (a, b, z0, z1s, n) => { for (let i = 0; i < n; i++) { const xx = a + (b - a) * (i / (n - 1)); const z1 = Array.isArray(z1s) ? z1s[i % z1s.length] : z1s; R(xx - 0.75, xx + 0.75, z0, z1, 'f-conc2'); } };
  if (k === 'panel') R(-31, 31, 0, 2.5);
  if (k === 'wind') R(-11, 11, 0, 3);
  if (k === 'cn') R(-30, 30, 0, 15);
  if (k === 'tp') { R(-40, 40, 0, 4.5); piles(-38, 38, 4.5, 80, 13); }
  if (k === 'pet') { for (const c of [-40, 40]) { R(c - 27, c + 27, 0, 4.5); piles(c - 25, c + 25, 4.5, [62, 85, 115, 100, 72, 110, 90], 9); } }
  if (k === 'burj') { R(-45, 45, 0, 3.7); piles(-43, 43, 3.7, 47, 15); }
}
register('alap-tornyok', (root) => {
  const { viz, out } = shell(root, { layout: 'wide' });
  const bar = h('div', { class: 'alap-twbar' }); viz.append(bar);
  const sMode = seg(bar, { options: [{ v: 'real', t: 'Valós lépték' }, { v: 'zoom', t: 'Alapok nagyítva' }], value: 'real' });
  const sSel = seg(bar, { options: TW.map((t) => ({ v: t.k, t: t.n })), value: 'pet' });
  sSel.el.classList.add('alap-twsel');
  const s = figure(viz, 900, 560, 'fig alap-twfig');
  out.style.gridTemplateColumns = '1fr';
  const sheet = h('div', { class: 'alap-sheet' }); out.append(sheet);
  const XS = [70, 190, 330, 480, 640, 800];
  let blades = null;
  function draw() {
    clear(s);
    const zoom = sMode.v === 'zoom';
    const G = zoom ? 150 : 470;
    const kv = zoom ? 3.3 : 0.53, kx = zoom ? 1.25 : 0.53;
    const Yz = (m) => G - m * kv, Zd = (m) => G + m * kv;
    svg('rect', { x: 0, y: 0, width: 900, height: G, class: 'f-sky' }, s);
    hatch(s, 0, G, 900, 560 - G, 'f-soilB', 'pat-soil', 0.45);
    // mélységskála
    const step = zoom ? 20 : 100;
    for (let m = step; m * kv < 560 - G - 6; m += step) {
      svg('line', { x1: 0, y1: Zd(m), x2: 900, y2: Zd(m), class: 's-line', 'stroke-width': 0.6, 'stroke-dasharray': '2 5' }, s);
      T(s, 896, Zd(m) - 3, `−${m}${NB}m`, 't-sm halo alap-sc', { 'text-anchor': 'end' });
    }
    if (!zoom) for (let m = 100; m <= 800; m += 100) {
      svg('line', { x1: 0, y1: Yz(m), x2: 900, y2: Yz(m), class: 's-line', 'stroke-width': 0.6, 'stroke-dasharray': '2 5' }, s);
      T(s, 896, Yz(m) - 3, `${m}${NB}m`, 't-sm halo alap-sc', { 'text-anchor': 'end' });
    }
    const clipId = 'alapTwClip' + Math.random().toString(36).slice(2, 7);
    const cp = svg('clipPath', { id: clipId }, s); svg('rect', { x: 0, y: zoom ? 18 : 0, width: 900, height: 560 }, cp);
    blades = null;
    TW.forEach((tw, i) => {
      const x = XS[i], on = sSel.v === tw.k;
      const g = svg('g', { class: 'alap-tw' + (on ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': tw.n }, s);
      const gc = svg('g', { 'clip-path': `url(#${clipId})` }, g);
      towerShape(gc, tw.k, x, Yz, kx, on ? 'f-grp' : 'f-bld2');
      if (tw.k === 'wind') {
        const hub = [x, Yz(120.2)];
        blades = svg('g', { transform: `translate(${hub[0]} ${hub[1]})` }, gc);
        for (const a of [0, 120, 240]) svg('path', { d: `M0 0 L${-1.4 * kx} ${-6 * kv} L0 ${-65 * kv} L${1.4 * kx} ${-6 * kv} Z`, class: on ? 'f-grp' : 'f-bld2', transform: `rotate(${a})` }, blades);
        svg('circle', { cx: 0, cy: 0, r: Math.max(1.5, 2 * kx), class: 'f-ink' }, blades);
      }
      towerFound(g, tw.k, x, Zd, kx);
      if (zoom && tw.hgt > 40) {
        // törésjel a levágott tetőn
        svg('path', { d: `M${x - 46} 24 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6 l8 6 l8 -6`, fill: 'none', class: 's-muted', 'stroke-width': 1.4 }, g);
      }
      const topY = zoom ? (tw.hgt > 40 ? 14 : Yz(tw.hgt) - 8) : Yz(tw.hgt) - 8;
      T(g, x, Math.max(14, topY), zoom ? `${fmt(tw.hgt, 0)}${NB}m ↑` : `${fmt(tw.hgt, 0)}${NB}m`, 't-num halo', { 'text-anchor': 'middle' });
      T(g, x, Math.min(552, Zd(tw.fd) + 14), `−${fmt(tw.fd, 0)}${NB}m`, 't-num halo' + (on ? ' t-grp' : ''), { 'text-anchor': 'middle' });
      // ütközési terület
      svg('rect', { x: x - 62, y: 0, width: 124, height: 560, fill: 'transparent' }, g);
      const pick = () => { sSel.set(tw.k); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
    svg('line', { x1: 0, y1: G, x2: 900, y2: G, class: 's-ink', 'stroke-width': 1.5 }, s);
    T(s, 6, G - 6, 'terepszint ±0', 't-sm halo alap-sc');
    const tw = TW.find((t) => t.k === sSel.v);
    sheet.innerHTML = `<div class="alap-sh-h"><b>${tw.n}</b><span>${tw.loc} · ${tw.yr}</span></div>
      <div class="chips"><span class="chip grp">magasság: ${fmt(tw.hgt, 0)}${NB}m</span><span class="chip">alapozás: ${tw.f.replace(/(\d) (?=\S)/g, '$1' + NB).replace(/(kb\.|\+) /g, '$1' + NB)}</span></div>
      <p>${tw.p}</p><p class="alap-sh-l"><b>Tanulság:</b> ${tw.l}</p>`;
  }
  sMode.on(draw); sSel.on(draw); draw();
  let ang = 0;
  loop(s, (t, dt) => { if (!blades) return; ang = (ang + dt * 40) % 360; const tr = blades.getAttribute('transform').replace(/ rotate\([^)]*\)/, ''); blades.setAttribute('transform', `${tr} rotate(${ang.toFixed(1)})`); });
  root.append(h('div', { class: 'w-foot', html: 'Az építmények és az alapjuk egymáshoz képest <b>méretarányosak</b>, a sziluettek egyszerűsítettek. A cölöpöknek csak egy részét rajzoltuk ki: a valódi cölöpkiosztás jóval sűrűbb, a Taipei 101 alatt például 380 cölöp áll.' }));
});

/* ================================================================ 1.3 kimosáslabor */
register('alap-kimosas', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sV = slider(ctrls, { label: 'A víz sebessége', sym: 'v', min: 0.3, max: 4, step: 0.1, value: 1.2, unit: 'm/s', d: 1 });
  const sF = seg(ctrls, { label: 'A pillér alapozása', options: [{ v: 'sik', t: 'Síkalap' }, { v: 'col', t: 'Cölöpalap' }], value: 'sik' });
  const btns = h('div', { class: 'stepbtns' }); ctrls.append(btns);
  const bA = h('button', { type: 'button' }, '🌊 Árvíz!'), bN = h('button', { type: 'button' }, 'Nyugodt víz'), bR = h('button', { type: 'button' }, 'Újraindítás');
  btns.append(bA, bN, bR);
  ctrls.append(h('p', { class: 'ctl-hint', html: 'A pillér szélessége 3 m, a síkalap alapsíkja 3 m‑rel, a cölöpök csúcsa 16 m‑rel a meder alatt van.' }));
  const s = figure(viz, 560, 380);
  const oD = stat(out, { label: 'Kimélyülés a pillér mellett', unit: 'm', d: 1 });
  const oE = stat(out, { label: 'Alapsík / cölöpcsúcs a gödör alja alatt', unit: 'm', d: 1 });
  const vd = verdict(null); out.append(vd.el); vd.el.style.gridColumn = '1 / -1';
  const K = 12, BED = 150, WS = 62, X0 = 280, B = 3;
  const Y = (z) => BED + z * K;
  let ds = 0, tilt = 0, lastState = '';
  const target = () => { const v = sV.v; return 2.4 * B * Math.pow(clamp((v - 0.5) / 3.5, 0, 1), 0.6); };
  // statikus réteg + dinamikus réteg
  const gStatic = svg('g', {}, s), gDyn = svg('g', {}, s), gTop = svg('g', {}, s);
  const parts = Array.from({ length: 38 }, (_, i) => ({ x: Math.random() * 560, y: WS + 8 + Math.random() * (BED - WS - 14), r: 1.2 + Math.random() * 1.4, el: null }));
  const sed = Array.from({ length: 16 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, el: null }));
  function drawStatic() {
    clear(gStatic);
    svg('rect', { x: 0, y: 0, width: 560, height: WS, class: 'f-sky' }, gStatic);
    svg('rect', { x: 0, y: WS, width: 560, height: BED + 40 - WS, class: 'f-water' }, gStatic);
    water(gStatic, 0, 560, WS, 'vízszint');
    hatch(gStatic, 0, Y(10), 560, 380 - Y(10), 'f-soilB', 'pat-clay');
  }
  function drawDyn() {
    clear(gDyn);
    const dpx = ds * K;
    const half = B * K / 2, slope = 1.9;
    // homokos kavics meder a gödörrel
    const pts = [[0, BED]];
    const L = Math.max(0.01, dpx * slope);
    pts.push([X0 - half - L, BED]);
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([X0 - half - L + L * u, BED + dpx * Math.sin(u * Math.PI / 2)]); }
    pts.push([X0 + half, BED + dpx]);
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([X0 + half + L * 0.75 * u, BED + dpx * Math.cos(u * Math.PI / 2)]); }
    pts.push([560, BED], [560, Y(10)], [0, Y(10)]);
    svg('path', { d: pathD(pts, true), class: 'f-soilA' }, gDyn);
    svg('path', { d: pathD(pts, true), fill: 'url(#pat-gravel)', opacity: 0.6 }, gDyn);
    T(gDyn, 10, BED + 18, 'homokos kavics (meder)', 't-sm halo');
    T(gDyn, 10, Y(10) + 16, 'agyag', 't-sm halo');
    // pillér + alap
    const g = svg('g', { transform: `rotate(${tilt.toFixed(2)} ${X0 + 48} ${Y(3)})` }, gDyn);
    if (sF.v === 'sik') {
      conc(g, X0 - half, 30, B * K, Y(1.5) - 30, 'f-conc2');
      conc(g, X0 - 4 * K, Y(1.5), 8 * K, 1.5 * K);
    } else {
      conc(g, X0 - half, 30, B * K, Y(1) - 30, 'f-conc2');
      for (const dx of [-2.7, 0, 2.7]) conc(g, X0 + dx * K - 0.4 * K, Y(2.5), 0.8 * K, Y(16) - Y(2.5), 'f-conc');
      conc(g, X0 - 3.6 * K, Y(1), 7.2 * K, 1.5 * K);
    }
    svg('rect', { x: X0 - half - 6, y: 24, width: B * K + 12, height: 8, class: 'f-conc' }, g);
    // patkóörvény
    const v = sV.v;
    if (v > 0.6) {
      const op = clamp((v - 0.6) / 2, 0.2, 0.9);
      for (const sx of [-1, 1]) svg('ellipse', { cx: X0 + sx * (half + 10 + dpx * 0.3), cy: BED + dpx * 0.6 - 6, rx: 10 + dpx * 0.35, ry: 6 + dpx * 0.2, fill: 'none', class: 's-water flow', 'stroke-width': 1.6, opacity: op }, gDyn);
    }
  }
  function drawTop() {
    for (const p of parts) { if (!p.el) p.el = svg('circle', { r: p.r, style: 'fill: var(--water)', opacity: 0.55 }, gTop); }
    for (const q of sed) { if (!q.el) q.el = svg('circle', { r: 1.6, class: 'f-soilE', opacity: 0 }, gTop); }
  }
  drawStatic(); drawTop();
  function state() {
    const exp = sF.v === 'sik' ? 3 - ds : 16 - ds;
    let st, ttl, txt;
    if (sF.v === 'sik') {
      if (ds >= 3) { st = 'bad'; ttl = 'Alámosott pillér!'; txt = 'A kimélyülés elérte az alapsíkot: az alaptest alól kimosódik a talaj, a pillér megbillen – a híd leszakadhat.'; }
      else if (ds > 1.6) { st = 'warn'; ttl = 'Veszélyes kimélyülés'; txt = 'A gödör már közel van az alapsíkhoz. Egy nagyobb árvíz alámoshatja a síkalapot.'; }
      else { st = 'ok'; ttl = 'Egyelőre stabil'; txt = 'Kis sebességnél alig mozdul a mederanyag. De mi lesz árvízkor?'; }
    } else {
      if (ds > 6) { st = 'warn'; ttl = 'A cölöpök megtartanak, de…'; txt = 'A pillér nem billen meg, mert a cölöpök a kimosási mélység alá nyúlnak. A szabaddá vált cölöphossz miatt viszont nő a hajlítás – ezt a tervezésnél figyelembe kell venni.'; }
      else { st = 'ok'; ttl = 'Stabil – a cölöpök a kimosás alá érnek'; txt = 'A teher a kimosási mélység alatti rétegekbe jut, a kimélyülés csak a cölöpök felső szakaszát teszi szabaddá.'; }
    }
    return { exp, st, ttl, txt };
  }
  function outUpd() {
    const S = state();
    oD.set(ds, ds > 3 ? 'bad' : ds > 1.6 ? 'warn' : null);
    oE.set(S.exp, S.exp <= 0 ? 'bad' : S.exp < 1.4 ? 'warn' : 'ok');
    const key = S.st + S.ttl;
    if (key !== lastState) { vd.set(S.st, S.ttl, `<p>${S.txt}</p>`); lastState = key; }
  }
  let acc = 0;
  loop(s, (t, dt) => {
    const tg = target(), v = sV.v;
    if (tg > ds) ds = Math.min(tg, ds + dt * (0.25 + v * 0.35));
    else ds = Math.max(tg, ds - dt * 0.05);
    if (sF.v === 'sik' && ds >= 3) tilt = Math.min(7, tilt + dt * 2.2); else tilt = Math.max(0, tilt - dt * 4);
    acc += dt;
    if (acc > 0.05) { acc = 0; drawDyn(); outUpd(); }
    for (const p of parts) {
      p.x += dt * (20 + v * 55);
      // a pillér körül elterelődik
      if (Math.abs(p.x - X0) < 26 && p.y > 40) p.y += (p.x < X0 ? -1 : 1) * dt * 4;
      if (p.x > 565) { p.x = -5; p.y = WS + 8 + Math.random() * (BED - WS - 14); }
      p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1));
    }
    const growing = tg > ds + 0.05;
    for (const q of sed) {
      if (q.life <= 0 && growing && Math.random() < dt * 6) {
        q.life = 1; q.x = X0 + (Math.random() < 0.5 ? -1 : 1) * (22 + Math.random() * 20); q.y = BED + ds * K * 0.7; q.vx = 20 + v * 30; q.vy = -25 - Math.random() * 25;
      }
      if (q.life > 0) { q.life -= dt * 0.8; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 30 * dt; }
      q.el.setAttribute('cx', q.x.toFixed(1)); q.el.setAttribute('cy', q.y.toFixed(1)); q.el.setAttribute('opacity', Math.max(0, q.life).toFixed(2));
    }
  });
  bA.addEventListener('click', () => sV.set(3.6));
  bN.addEventListener('click', () => sV.set(0.6));
  bR.addEventListener('click', () => { ds = 0; tilt = 0; drawDyn(); outUpd(); });
  sF.on(() => { ds = 0; tilt = 0; drawDyn(); outUpd(); });
  drawDyn(); outUpd();
  root.append(h('div', { class: 'w-foot', html: '<b>Szemléltető modell:</b> a kimélyülés a sebességgel nő, legfeljebb a pillérszélesség kb. 2,4-szereséig. A valódi kimosási mélység a vízmélységtől, a pillér alakjától, a mederanyagtól és az árhullám hosszától is függ.' }));
});

/* ================================================================ 1.4 talp és köpeny (ábra) */
register('alap-elv', (root) => {
  const s = figure(root, 460, 330, 'fig');
  const G = 70, yB = 230;
  svg('rect', { x: 0, y: 0, width: 460, height: G, class: 'f-sky' }, s);
  hatch(s, 0, G, 460, yB - G, 'f-soilB', 'pat-clay');
  hatch(s, 0, yB, 460, 330 - yB, 'f-soilD', 'pat-gravel');
  svg('line', { x1: 0, y1: G, x2: 460, y2: G, class: 's-ink', 'stroke-width': 1.5 }, s);
  svg('line', { x1: 230, y1: 6, x2: 230, y2: 324, class: 's-surface', 'stroke-width': 3 }, s);
  T(s, 115, 22, 'SÍKALAP', 't-big', { 'text-anchor': 'middle' });
  T(s, 345, 22, 'MÉLYALAP (CÖLÖP)', 't-big', { 'text-anchor': 'middle' });
  // síkalap
  conc(s, 70, G - 4, 90, 18);
  svg('rect', { x: 102, y: 30, width: 26, height: G - 34, class: 'f-conc2' }, s);
  arrow(s, 115, 26, 115, 48, { cls: 's-ink', w: 3, head: 9 });
  for (let i = 0; i < 4; i++) svg('ellipse', { cx: 115, cy: G + 14 + i * 14, rx: 50 + i * 18, ry: 16 + i * 14, fill: 'none', class: 's-bad', 'stroke-width': 1.1, 'stroke-dasharray': '4 3', opacity: 0.8 - i * 0.15 }, s);
  for (const x of [80, 97, 115, 133, 150]) arrow(s, x, G + 16, x, G + 34, { cls: 's-bad', w: 1.6, head: 6 });
  T(s, 115, G + 120, 'a talpfeszültség a puha', 't-sm halo', { 'text-anchor': 'middle' });
  T(s, 115, G + 133, 'réteget nyomja össze', 't-sm halo', { 'text-anchor': 'middle' });
  T(s, 10, yB + 18, 'teherbíró réteg', 't-sm halo');
  T(s, 10, G + 16, 'puha réteg', 't-sm halo');
  // cölöp
  conc(s, 310, G - 6, 70, 16);
  svg('rect', { x: 333, y: 30, width: 24, height: G - 36, class: 'f-conc2' }, s);
  arrow(s, 345, 26, 345, 48, { cls: 's-ink', w: 3, head: 9 });
  conc(s, 336, G + 10, 18, yB + 50 - G - 10, 'f-conc2');
  for (let y = G + 24; y < yB + 44; y += 22) {
    arrow(s, 330, y + 10, 330, y - 4, { cls: 's-ok', w: 1.8, head: 6 });
    arrow(s, 360, y + 10, 360, y - 4, { cls: 's-ok', w: 1.8, head: 6 });
  }
  for (const x of [338, 345, 352]) arrow(s, x, yB + 76, x, yB + 60, { cls: 's-acc', w: 2.2, head: 7 });
  T(s, 322, G + 70, 'köpenymenti', 't-lab t-ok halo', { 'text-anchor': 'end' });
  T(s, 322, G + 85, 'ellenállás', 't-lab t-ok halo', { 'text-anchor': 'end' });
  T(s, 330, yB + 70, 'talp- (csúcs-)', 't-lab t-acc halo', { 'text-anchor': 'end' });
  T(s, 330, yB + 85, 'ellenállás', 't-lab t-acc halo', { 'text-anchor': 'end' });
});

/* ================================================================ 1.4 fajták ikonjai */
function typeIcon(k) {
  const s = svg('svg', { viewBox: '0 0 160 84', class: 'alap-tii', 'aria-hidden': 'true' });
  const G = 22;
  svg('rect', { x: 0, y: 0, width: 160, height: G, class: 'f-sky' }, s);
  hatch(s, 0, G, 160, 62, 'f-soilB', 'pat-clay');
  svg('line', { x1: 0, y1: G, x2: 160, y2: G, class: 's-ink', 'stroke-width': 1.2 }, s);
  if (k === 'colop') {
    conc(s, 40, G - 6, 80, 9);
    for (const x of [46, 66, 86, 106]) conc(s, x, G + 3, 8, 56, 'f-conc2');
    svg('rect', { x: 58, y: 2, width: 44, height: G - 8, class: 'f-bld' }, s);
  } else if (k === 'resfal') {
    for (let i = 0; i < 5; i++) conc(s, 18 + i * 25, G - 2, 24, 58, i % 2 ? 'f-conc' : 'f-conc2');
    svg('rect', { x: 18, y: G - 6, width: 124, height: 5, class: 'f-conc' }, s);
  } else {
    svg('path', { d: `M50 ${G - 4} V70 L56 78 H104 L110 70 V${G - 4} Z`, class: 'f-conc2' }, s);
    svg('path', { d: `M60 ${G - 4} V70 H100 V${G - 4} Z`, class: 'f-soilB' }, s);
    svg('ellipse', { cx: 80, cy: G - 4, rx: 30, ry: 5, class: 'f-conc' }, s);
    svg('ellipse', { cx: 80, cy: G - 4, rx: 20, ry: 3.2, class: 'f-soilB' }, s);
    arrow(s, 125, 30, 125, 62, { cls: 's-grp', w: 2.4, head: 7 });
  }
  return s;
}
register('alap-tipusok', (root) => { $$('.alap-ti', root).forEach((el) => el.append(typeIcon(el.dataset.ti))); });

/* ================================================================ 1.5 a cölöpalap részei */
const RESZ = {
  tomb: { t: 'Fejtömb', p: 'Egyedi pillér alá kerül: a pillér terhét egy vasbeton tömb osztja szét az alatta lévő cölöpcsoportra. A cölöpök vasalását bekötik a tömbbe.' },
  racs: { t: 'Gerendarács (cölöprács)', p: 'Falak, pillérsorok alá: a cölöpfejeket vasbeton gerendák kötik össze, a fal terhe a gerendán keresztül jut a cölöpökre.' },
  lemez: { t: 'Lemez (cölöpös lemezalap)', p: 'Nagy, egyenletes terhű épületek – például tornyok, mélygarázsok – alá: a vasbeton lemez a cölöpökkel együtt dolgozik, és a talajra is ad át terhet.' },
};
register('alap-reszek', (root) => {
  const { viz, out } = shell(root, { layout: 'wide' });
  const sg = seg(viz, { options: [{ v: 'tomb', t: 'Fejtömb' }, { v: 'racs', t: 'Gerendarács' }, { v: 'lemez', t: 'Lemez' }], value: 'tomb' });
  const s = figure(viz, 640, 340);
  out.style.gridTemplateColumns = '1fr';
  const vd = verdict(out);
  function lab(x, y, tx, ty, text, anchor = 'start') {
    svg('line', { x1: x, y1: y, x2: tx, y2: ty, class: 's-muted', 'stroke-width': 1 }, s);
    svg('circle', { cx: x, cy: y, r: 2.5, class: 'f-ink' }, s);
    T(s, tx + (anchor === 'end' ? -4 : 4), ty + 4, text, 't-lab halo', { 'text-anchor': anchor });
  }
  function draw() {
    const k = sg.v; clear(s);
    const G = 120;
    svg('rect', { x: 0, y: 0, width: 420, height: G, class: 'f-sky' }, s);
    hatch(s, 0, G, 420, 340 - G, 'f-soilB', 'pat-clay');
    svg('line', { x1: 0, y1: G, x2: 420, y2: G, class: 's-ink', 'stroke-width': 1.4 }, s);
    T(s, 10, 18, 'METSZET', 't-sm');
    // alaprajz panel
    svg('rect', { x: 440, y: 20, width: 190, height: 300, rx: 10, class: 'f-bg2' }, s);
    T(s, 452, 40, 'ALAPRAJZ', 't-sm');
    let piles = [], capTop, capH, plan = [];
    if (k === 'tomb') {
      capTop = G - 6; capH = 30;
      conc(s, 130, capTop, 160, capH);
      svg('rect', { x: 192, y: 20, width: 36, height: capTop - 20, class: 'f-conc2' }, s);
      piles = [150, 250];
      lab(210, 50, 290, 46, 'pillér');
      lab(280, capTop + 16, 330, capTop + 6, 'fejtömb');
      // alaprajz
      conc(s, 475, 110, 120, 120);
      svg('rect', { x: 522, y: 157, width: 26, height: 26, class: 'f-conc2 s-ink', 'stroke-width': 0.8 }, s);
      for (const [x, y] of [[495, 130], [575, 130], [495, 210], [575, 210]]) svg('circle', { cx: x, cy: y, r: 9, class: 'f-conc2 s-ink', 'stroke-width': 0.8, 'stroke-dasharray': '3 2' }, s);
    } else if (k === 'racs') {
      capTop = G - 4; capH = 26;
      conc(s, 30, capTop, 360, capH);
      svg('rect', { x: 30, y: 30, width: 360, height: capTop - 30, class: 'f-bld' }, s);
      for (let x = 30; x < 390; x += 45) svg('line', { x1: x, y1: 30, x2: x, y2: capTop, class: 's-line', 'stroke-width': 0.8 }, s);
      piles = [55, 135, 215, 295, 365];
      lab(120, 60, 120, 14, 'fal');
      lab(330, capTop + 13, 330, capTop - 28, 'gerendarács');
      // alaprajz: rács
      for (const y of [80, 170, 260]) conc(s, 466, y - 8, 138, 16);
      for (const x of [474, 535, 596]) conc(s, x - 8, 72, 16, 196);
      for (const y of [80, 170, 260]) for (const x of [474, 535, 596]) svg('circle', { cx: x, cy: y, r: 8, class: 'f-conc2 s-ink', 'stroke-width': 0.8, 'stroke-dasharray': '3 2' }, s);
    } else {
      capTop = G - 8; capH = 22;
      conc(s, 20, capTop, 380, capH);
      svg('rect', { x: 30, y: 16, width: 360, height: capTop - 16, class: 'f-bld' }, s);
      for (let y = 16 + 16; y < capTop; y += 16) svg('line', { x1: 30, y1: y, x2: 390, y2: y, class: 's-line', 'stroke-width': 0.8 }, s);
      piles = [45, 105, 165, 225, 285, 345, 385 - 10];
      lab(150, 40, 150, 10, 'épület');
      lab(330, capTop + 11, 330, capTop - 26, 'vasbeton lemez');
      conc(s, 462, 70, 146, 220);
      for (let y = 88; y < 290; y += 34) for (let x = 478; x < 600; x += 32) svg('circle', { cx: x, cy: y, r: 7, class: 'f-conc2 s-ink', 'stroke-width': 0.8, 'stroke-dasharray': '3 2' }, s);
      // a lemez a talajra is ad át terhet
      for (const x of [75, 195, 255, 315]) arrow(s, x, capTop + capH + 2, x, capTop + capH + 16, { cls: 's-warn', w: 1.4, head: 5 });
    }
    const pTop = capTop + capH, pBot = 318;
    for (const x of piles) conc(s, x - 8, pTop - 6, 16, pBot - pTop + 6, 'f-conc2');
    // a teher útja
    const src = k === 'tomb' ? [210, 26] : k === 'racs' ? [210, 40] : [210, 24];
    for (const x of piles) svg('path', { d: `M${src[0]} ${src[1]} Q${src[0]} ${capTop + 4} ${x} ${pTop + 10} L${x} ${pBot - 14}`, fill: 'none', class: 's-acc flow', 'stroke-width': 1.6, opacity: 0.85 }, s);
    const px = piles[piles.length - 1];
    lab(px - 8, pTop + 4, 414, pTop + 2, 'cölöpfej', 'end');
    lab(px + 8, (pTop + pBot) / 2, 414, (pTop + pBot) / 2, 'köpeny', 'end');
    lab(px, pBot, 414, pBot + 10, 'talp (csúcs)', 'end');
    vd.set('', RESZ[k].t, `<p>${RESZ[k].p}</p>`);
  }
  sg.on(draw); draw();
});

/* ================================================================ kvíz */
defineQuiz('alapok', 'Kvíz – mi a mélyalapozás?', [
  { q: 'Mi különbözteti meg alapvetően a mélyalapot a síkalaptól?', a: ['A talpán kívül a köpenyén (oldalán) is át tud adni terhet a talajnak.', 'Mindig legalább 10 m mélyre ér le.', 'Csak előregyártott elemekből készülhet.', 'Nincs szükség a fejét összefogó szerkezetre.'], c: 0, e: 'A mélyalap teherközvetítő elem a szerkezet és a mélyebb teherbíró réteg között, amely a talpán és a köpenyén is ad át terhet.' },
  { q: 'Melyik NEM tipikus oka a mélyalapozásnak?', a: ['A teherbíró réteg közvetlenül a terepszint alatt van.', 'Síkalappal meg nem engedhető süllyedés keletkezne.', 'A hídpillér körül kimosás veszélye áll fenn.', 'A megbízható teherbíró réteg csak mélyebben van.'], c: 0, e: 'Ha a jó réteg közvetlenül a felszín alatt van, a síkalap általában a legegyszerűbb és legolcsóbb megoldás.' },
  { q: 'Melyik a mélyalapozás három fő fajtája?', a: ['Cölöpalapozás, résfalas alapozás, kút- és szekrényalapozás', 'Sávalap, lemezalap, cölöpalap', 'CFA, Franki-cölöp, jet-grouting', 'Talajcsere, előterhelés, cölöpözés'], c: 0, e: 'Ma leggyakrabban cölöpalap készül; a résfalat főleg munkatérhatárolásra használjuk, a kút- és szekrényalap egyre ritkább.' },
  { q: 'Mi a markolt tömbalap?', a: ['Átmeneti megoldás: megtámasztás nélkül kimarkolt és rögtön kibetonozott tömb, kötött talajban kb. 5–6 m‑ig.', 'Előregyártott vasbeton tömb, amelyet a talajba vernek.', 'Bentonitzagyos megtámasztással készülő résfaltábla.', 'A cölöpfejeket összefogó vasbeton gerendarács.'], c: 0, e: 'A sík- és a mélyalap között álló „átmeneti” megoldás, kútalapnak is nevezik.' },
  { q: 'Szélerőműnél mi a mértékadó az alapozás tervezésekor?', a: ['A torony dőlése: a megengedett egyenlőtlen süllyedés kb. 3 mm/m.', 'A talajvíz kémiai agresszivitása.', 'A lapátok súlya.', 'A fagyhatár mélysége.'], c: 0, e: 'A magas, karcsú tornyoknál már kis egyenlőtlen süllyedés is jelentős dőlést okoz.' },
  { q: 'Miből áll egy új építmény cölöpalapja?', a: ['A cölöpökből és a fejeiket összefogó tömbből, lemezből és/vagy gerendarácsból.', 'Csak a cölöpökből – a felépítmény közvetlenül rájuk támaszkodik.', 'A cölöpökből és a köréjük injektált habarcsból.', 'Egy sávalapból és alatta egy talajcserés rétegből.'], c: 0, e: 'Az összefogó szerkezet osztja szét a terhet és dolgoztatja együtt a cölöpöket.' },
  { q: 'Melyik NEM oka annak, hogy ma egyre több mélyalap készül?', a: ['A szabványok már nem engedik a síkalapozást.', 'Egyre nagyobb terhelésű, süllyedésre érzékenyebb épületek épülnek.', 'Elfogytak a jó altalajú területek.', 'A mélyalapozási technológiák versenyképessé váltak.'], c: 0, e: 'A síkalap ma is teljesen elfogadott – ahol megfelel, gyakran a legolcsóbb.' },
  { q: 'Miért cölöpökre helyezik a folyómederben álló hídpillért?', a: ['Mert a pillér körüli kimélyülés elérheti a síkalap alapsíkját, a cölöpök viszont a kimosási mélység alá nyúlnak.', 'Mert a víz felhajtóereje miatt a síkalap felúszna.', 'Mert a mederben nem lehet betonozni.', 'Mert a cölöp nem korrodál a vízben.'], c: 0, e: 'A kimosás (kiüregelés) a hídkárok egyik leggyakoribb oka – ezért a mederpillérek mélyalapot kapnak.' },
  { q: 'A Burdzs Kalifa (828 m) cölöpei rövidebbek, mint a Petronas-tornyok (452 m) alapozó elemei. Mi ennek a fő oka?', a: ['Az alap mélységét elsősorban az altalaj, a teherbíró réteg mélysége szabja meg.', 'A magasabb épület mindig könnyebb.', 'Dubajban nincs talajvíz.', 'A Burdzs Kalifa résfalra épült.'], c: 0, e: 'Nem az épület magassága, hanem a talaj dönti el, milyen mélyre kell nyúlnia az alapnak.' },
]);
