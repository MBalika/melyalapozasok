// C06 – Egyéb cölöpök: mikrocölöp (aláfogás, kihajlás), jet-grouting (oszlopgyár), mélykeverés, kavicscölöp
import { register, shell, slider, seg, toggle, stat, verdict, h, svg, figure, clear, fmt, clamp, lerp, smooth, cssVar, onTheme, loop, pathD } from './core.js';
import { defineQuiz } from './ui.js';

/* ------------------------------------------------------------------ segédek */
const txt = (p, x, y, t, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text: t, ...o }, p);
// alsó indexes SVG-felirat: stxt(g, x, y, 'c', 'u', ' = 10 kPa')
function stxt(p, x, y, base, sub, rest = '', cls = 't-lab', o = {}) {
  const t = svg('text', { x, y, class: cls, ...o }, p);
  svg('tspan', { text: base }, t);
  svg('tspan', { text: sub, 'baseline-shift': 'sub', 'font-size': '72%' }, t);
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
  { k: 'Fúrás', t: 'Fúrás a pincéből', d: 'A kis fúrógép befér a pincébe. A meglévő alaptesten át, ferdén fúrnak le a teherbíró rétegig; a fal mentén a cölöpök dőlése váltakozik. Nincs verés, nincs rezgés – a ház lakott maradhat.' },
  { k: 'Injektálás', t: 'Betét és injektálás', d: 'A furatba acélbetét kerül (vagy az üreges fúrórúd marad bent), a habarcsot alulról felfelé injektálják. A teherbíró rétegben kialakul a cementtest és az átitatott, érdes köpeny.' },
  { k: 'Bekötés', t: 'Bekötés az alapba', d: 'A cölöp felső szakasza a meglévő alaptestben injektálva kötődik a régi szerkezethez (szükség esetén új vasbeton fejgerendával). Gyakran sajtóval elő is terhelik, hogy a teher azonnal átkerüljön.' },
  { k: 'Teher', t: 'Teherátadás', d: 'A fal terhét a mikrocölöpök a köpenyükön adják át a teherbíró rétegnek – a talpellenállással nem számolunk. A régi talp alatti feszültség lecsökken, a süllyedés megáll; a pinceszint akár le is mélyíthető.' },
];
register('egy-alafogas', (root) => {
  const { ctrls, viz, out } = shell(root, { foot: '<b>Szemléltető ábra</b>, torzított léptékkel: a valóságban a mikrocölöpök jellemzően 6–15 m hosszúak, a fal mentén sűrű kiosztásban, váltakozó dőléssel készülnek. A teher megoszlása a talp és a cölöpök között az előterheléstől és a további süllyedéstől függ.' });
  const fig = figure(viz, 720, 430);
  fig.setAttribute('aria-label', 'Metszet: régi fal sávalappal, pince, puha réteg és mélyebb teherbíró réteg; a mikrocölöpök a pincéből, az alaptesten át készülnek');
  const sTalp = stat(out, { label: 'Teher a régi talpon', unit: '%', d: 0 });
  const sPile = stat(out, { label: 'Teher a mikrocölöpökön', unit: '%', d: 0 });
  const sRes = stat(out, { label: 'Ami a cölöpben dolgozik' });

  // geometria
  const WALL = [320, 390], FT = [290, 420, 190, 235], FLOOR = 160, CEIL = [30, 44], TERR = 70, HARD = 318, BOT = 430;
  const A0 = [405, 190], A1 = [326, 414];   // „A” cölöp: a pincéből kifelé dőlve, a fal alá
  const B0 = [412, 190], B1 = [446, 414];   // „B” cölöp: másik síkban, befelé dőlve
  const at = (P0, P1, k) => [lerp(P0[0], P1[0], k), lerp(P0[1], P1[1], k)];

  let step = 0, t0 = 0, anim = 1;
  const NW = watchNarrow(viz, 560, () => draw());
  const draw = () => {
    const nar = NW.v;
    fig.setAttribute('viewBox', nar ? '196 0 424 430' : '0 0 720 430');
    fig.classList.toggle('egy-sm', nar);
    const LX = nar ? 204 : 12, PXL = nar ? 470 : 600;
    clear(fig);
    const g = svg('g', {}, fig);
    const k = smooth(anim);
    // talaj: kint terep, bent pince
    svg('rect', { x: 0, y: TERR, width: 720, height: HARD - TERR, class: 'f-soilB' }, g);
    svg('rect', { x: 0, y: TERR, width: 720, height: HARD - TERR, fill: 'url(#pat-clay)', opacity: 0.5 }, g);
    svg('rect', { x: 0, y: HARD, width: 720, height: BOT - HARD, class: 'f-soilD' }, g);
    svg('rect', { x: 0, y: HARD, width: 720, height: BOT - HARD, fill: 'url(#pat-gravel)', opacity: 0.8 }, g);
    svg('line', { x1: 0, y1: HARD, x2: 720, y2: HARD, class: 's-soil', 'stroke-width': 1.2, 'stroke-dasharray': '6 4' }, g);
    txt(g, LX, TERR + 22, nar ? 'puha agyag' : 'puha agyag, feltöltés', 'egy-sl');
    txt(g, LX, HARD + 20, nar ? 'teherbíró réteg' : 'teherbíró réteg (kavicsos homok)', 'egy-sl');
    // pince: padló, födém, levegő
    svg('rect', { x: WALL[1], y: 0, width: 720 - WALL[1], height: FLOOR, class: 'f-surface' }, g);
    svg('rect', { x: WALL[1], y: CEIL[0], width: 720 - WALL[1], height: CEIL[1] - CEIL[0], class: 'f-conc' }, g);
    svg('rect', { x: WALL[1], y: FLOOR, width: 720 - WALL[1], height: 8, class: 'f-conc2' }, g);
    txt(g, PXL, CEIL[1] + 18, 'pince', 't-sm');
    txt(g, PXL, CEIL[1] + 32, 'alacsony belmagasság', 't-sm');
    // kint: terepvonal
    svg('line', { x1: 0, y1: TERR, x2: WALL[0], y2: TERR, class: 's-ink', 'stroke-width': 1.5 }, g);
    txt(g, LX, TERR - 8, 'utca felőli oldal', 't-sm');
    // fal (falazott) + sávalap (beton, téglalap)
    svg('rect', { x: WALL[0], y: 0, width: WALL[1] - WALL[0], height: FT[2], class: 'f-bld2' }, g);
    for (let y = 8; y < FT[2]; y += 12) svg('line', { x1: WALL[0], y1: y, x2: WALL[1], y2: y, class: 's-line', 'stroke-width': 0.8 }, g);
    for (let y = 8, r = 0; y < FT[2]; y += 12, r++) for (let x = WALL[0] + (r % 2 ? 12 : 24); x < WALL[1]; x += 24) svg('line', { x1: x, y1: y, x2: x, y2: y + 12, class: 's-line', 'stroke-width': 0.8 }, g);
    svg('rect', { x: FT[0], y: FT[2], width: FT[1] - FT[0], height: FT[3] - FT[2], class: 'f-conc' }, g);
    svg('rect', { x: FT[0], y: FT[2], width: FT[1] - FT[0], height: FT[3] - FT[2], fill: 'url(#pat-conc)' }, g);
    // repedés a falban (0. lépés erősen, utána halványul)
    const crack = svg('path', { d: 'M374 64 l-6 14 l8 10 l-7 16 l9 12 l-6 18', fill: 'none', class: 's-bad', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g);
    crack.setAttribute('opacity', step === 0 ? 1 : 0.35);

    // fúrógép a pincében (1–2. lépés)
    if (step === 1 || step === 2) {
      const rg = svg('g', { opacity: step === 1 ? 1 : 1 - k * 0.85 }, g);
      const m0 = at(A0, A1, -0.12), m1 = at(A0, A1, -0.56);
      svg('rect', { x: 446, y: 126, width: 92, height: 26, rx: 4, class: 'f-acc' }, rg);
      svg('rect', { x: 440, y: 150, width: 104, height: 10, rx: 5, class: 'f-ink', opacity: 0.8 }, rg);
      svg('line', { x1: 452, y1: 138, x2: lerp(m0[0], m1[0], 0.45), y2: lerp(m0[1], m1[1], 0.45), class: 's-steel', 'stroke-width': 5, 'stroke-linecap': 'round' }, rg);
      svg('line', { x1: m0[0], y1: m0[1], x2: m1[0], y2: m1[1], class: 's-steel', 'stroke-width': 8, 'stroke-linecap': 'round' }, rg);
      txt(rg, nar ? 470 : 548, nar ? 116 : 120, 'kompakt fúrógép', 't-sm');
    }
    // cölöpök
    const drawPile = (P0, P1, faint) => {
      const pg = svg('g', { opacity: faint ? 0.45 : 1 }, g);
      let len = 1, grout = 0;
      if (step === 1) { len = faint ? smooth((anim - 0.45) / 0.55) : smooth(anim / 0.7); grout = 0; }
      else if (step >= 2) { len = 1; grout = step === 2 ? k : 1; }
      if (len <= 0) return;
      const E = at(P0, P1, len);
      if (grout > 0) {
        // cementtest: alulról felfelé nő; a teherbíró rétegben vastagabb (átitatott köpeny)
        const gs = 1 - grout;
        const S = at(P0, P1, Math.max(0, gs));
        svg('line', { x1: S[0], y1: S[1], x2: P1[0], y2: P1[1], style: 'stroke:var(--grout)', 'stroke-width': 11, 'stroke-linecap': 'round', opacity: 0.95 }, pg);
        const kh = (HARD - P0[1]) / (P1[1] - P0[1]);
        const H0 = at(P0, P1, Math.max(kh, gs));
        if (Math.max(kh, gs) < 1) svg('line', { x1: H0[0], y1: H0[1], x2: P1[0], y2: P1[1], style: 'stroke:var(--grout)', 'stroke-width': 19, 'stroke-linecap': 'round', opacity: 0.7 }, pg);
      }
      svg('line', { x1: P0[0], y1: P0[1], x2: E[0], y2: E[1], class: step === 1 && !faint ? 's-ink' : 's-steel', 'stroke-width': step === 1 ? 2.5 : 4, 'stroke-linecap': 'round' }, pg);
      if (step === 1 && !faint && len < 1) svg('circle', { cx: E[0], cy: E[1], r: 5, class: 'f-steel2' }, pg);
    };
    if (step >= 1) { drawPile(B0, B1, true); drawPile(A0, A1, false); }
    if (step >= 1) {
      txt(g, B1[0] + 10, B1[1] - 30, 'a következő cölöp', 'egy-sl');
      txt(g, B1[0] + 10, B1[1] - 17, '(másik síkban)', 'egy-sl');
    }
    if (step >= 2) {
      const L = at(A0, A1, 0.9);
      if (!nar) svg('line', { x1: L[0] - 8, y1: L[1], x2: 196, y2: 380, class: 's-muted', 'stroke-width': 1 }, g);
      txt(g, nar ? LX : 60, nar ? HARD + 40 : 394, nar ? 'cementtest + köpeny' : 'cementtest + átitatott köpeny', 'egy-sl');
    }
    // bekötés kiemelése
    if (step >= 3) {
      const hl = svg('g', { opacity: step === 3 ? k : 1 }, g);
      svg('rect', { x: FT[1], y: FT[2] - 2, width: 46, height: FT[3] - FT[2] + 4, class: 'f-conc2' }, hl);
      svg('rect', { x: FT[1], y: FT[2] - 2, width: 46, height: FT[3] - FT[2] + 4, fill: 'url(#pat-conc)' }, hl);
      svg('ellipse', { cx: 404, cy: 212, rx: 20, ry: 30, fill: 'none', class: 's-acc', 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }, hl);
      txt(hl, 474, 206, nar ? 'bekötés az' : 'bekötés: injektálva az', 't-lab', { 'font-size': 12 });
      txt(hl, 474, 221, nar ? 'alapba' : 'alapba + új fejgerenda', 't-lab', { 'font-size': 12 });
      if (step === 3) { carrow(hl, 404, 120 - 18 * Math.sin(k * Math.PI), 404, 176, 'var(--accent)', 3, 10); txt(hl, 414, 116, 'előterhelés sajtóval', 't-sm'); }
    }
    // terhek
    const pileShare = step >= 4 ? 0.8 * k : step === 3 ? 0.35 * k : 0;
    const talpShare = 1 - pileShare;
    carrow(g, 355, -2, 355, 46, 'var(--bad)', 4, 12);
    txt(g, 366, 26, 'falteher', 't-lab', { 'font-size': 12.5 });
    // talp alatti feszültség
    const nArr = 6;
    for (let i = 0; i < nArr; i++) {
      const x = FT[0] + 12 + (i * (FT[1] - FT[0] - 24)) / (nArr - 1);
      const L = 10 + 34 * talpShare;
      carrow(g, x, FT[3] + L + 2, x, FT[3] + 2, 'var(--warn)', 2, 6);
    }
    txt(g, nar ? LX : FT[0] - 4, FT[3] + 58, 'talp alatti feszültség', 'egy-sl', { 'text-anchor': nar ? 'start' : 'end' });
    if (step >= 4) {
      // köpenymenti ellenállás a teherbíró rétegben (felfelé ható kis nyilak)
      const kh = (HARD - A0[1]) / (A1[1] - A0[1]);
      for (let i = 0; i < 4; i++) {
        const P = at(A0, A1, kh + ((1 - kh) * (i + 0.4)) / 4);
        carrow(g, P[0] + 14, P[1] + 12, P[0] + 18, P[1] - 4, 'var(--ok)', 2.2, 6);
        carrow(g, P[0] - 14, P[1] + 12, P[0] - 10, P[1] - 4, 'var(--ok)', 2.2, 6);
      }
      txt(g, A1[0] + 34, A1[1] - 44, 'köpenymenti', 't-lab t-ok halo', { 'font-size': 12 });
      txt(g, A1[0] + 34, A1[1] - 30, 'ellenállás', 't-lab t-ok halo', { 'font-size': 12 });
      const T = A1;
      svg('circle', { cx: T[0], cy: T[1] + 2, r: 8, fill: 'none', class: 's-bad', 'stroke-width': 1.8 }, g);
      svg('line', { x1: T[0] - 6, y1: T[1] + 8, x2: T[0] + 6, y2: T[1] - 4, class: 's-bad', 'stroke-width': 1.8 }, g);
      txt(g, T[0] - 14, T[1] + 6, 'talp: 0', 't-sm t-bad halo', { 'text-anchor': 'end' });
    }
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

/* ================================================================== 2. KIHAJLÁS */
// Szemléltető modell: rugalmasan ágyazott rúd. k = 67·c_u (kN/m²), λ = (EI/k)^¼,
// N_cr = π²·EI / (L_f + π·λ/√2)²  →  L_f = 0-nál N_cr = 2·√(k·EI)
const KH_SEC = {
  t30: { t: 'Önfúró rúd Ø30/11', EIs: 8.2, Npl: 260, D: 0.10, d: 0.030, core: 0.011 },
  t40: { t: 'Önfúró rúd Ø40/16', EIs: 25.7, Npl: 525, D: 0.12, d: 0.040, core: 0.016 },
  cso: { t: 'Acélcső 114,3×9', EIs: 873, Npl: 1057, D: 0.18, d: 0.1143, core: 0.0963 },
};
const EG = 1.0e7; // a cementtest rugalmassági modulusa, kN/m² (≈ 10 GPa)
function khCalc(sec, cu, Lf, withGrout) {
  const S = KH_SEC[sec];
  const Iring = (Math.PI / 64) * (S.D ** 4 - S.d ** 4) + (Math.PI / 64) * S.core ** 4;
  const EI = S.EIs + (withGrout ? EG * Iring : 0);
  const k = 67 * Math.max(0.1, cu);
  const lam = Math.pow(EI / k, 0.25);
  const Le = Lf + (Math.PI * lam) / Math.SQRT2;
  const Ncr = (Math.PI ** 2 * EI) / (Le * Le);
  return { EI, k, lam, half: Math.PI * lam, Ncr, Npl: S.Npl };
}
register('egy-kihajlas', (root) => {
  const { ctrls, viz, out } = shell(root, { foot: '<b>Szemléltető modell:</b> rugalmasan ágyazott rúd.<br>A talaj oldalirányú ágyazása: <i>k</i> ≈ 67·<i>c</i><sub>u</sub>; λ = (<i>EI</i>/<i>k</i>)<sup>¼</sup>.<br>Szabad hossz nélkül: <i>N</i><sub>cr</sub> = 2·√(<i>k</i>·<i>EI</i>),<br>szabad hosszal: <i>N</i><sub>cr</sub> ≈ π²·<i>EI</i> / (<i>L</i><sub>f</sub> + π·λ/√2)².<br>A cementtest merevségét <i>E</i> ≈ 10 GPa-lal, repedésmentesen vettük; az értékek parciális tényezők nélküliek. Tervezéshez a szabványos vizsgálat kell.' });
  const sec = seg(ctrls, { label: 'Keresztmetszet', options: Object.entries(KH_SEC).map(([v, s]) => ({ v, t: s.t })), value: 't30', vert: true });
  const gr = toggle(ctrls, { label: 'a cementtest merevségét is számítjuk', value: true });
  const cu = slider(ctrls, { label: 'Drénezetlen nyírószilárdság', sym: 'c<sub>u</sub>', min: 2, max: 60, step: 1, value: 8, unit: 'kPa', hint: 'puha agyag, iszap: 10–25 kPa; nagyon puha, szerves talaj: 10 kPa alatt' });
  const lf = slider(ctrls, { label: 'Szabad (ágyazatlan) hossz', sym: 'L<sub>f</sub>', min: 0, max: 3, step: 0.1, value: 0, unit: 'm', d: 1, hint: 'pl. üreg, lemélyített pince, nagyon laza feltöltés a cölöpfej alatt' });

  const fig = figure(viz, 720, 400);
  fig.setAttribute('aria-label', 'Bal oldalt a mikrocölöp a talajban kihajlási alakkal, jobb oldalt a kritikus erő a drénezetlen nyírószilárdság függvényében');
  const sEI = stat(out, { label: 'Hajlítási merevség <i>EI</i>', unit: 'kNm²', d: 1 });
  const sNcr = stat(out, { label: 'Kritikus (kihajlási) erő <i>N</i><sub>cr</sub>', unit: 'kN', d: 0 });
  const sNpl = stat(out, { label: 'Az acél folyási ereje <i>N</i><sub>pl</sub>', unit: 'kN', d: 0 });
  const sGov = stat(out, { label: 'Mértékadó' });
  const vd = verdict(viz);

  const NW = watchNarrow(viz, 560, () => draw());
  const draw = () => {
    const nar = NW.v;
    fig.setAttribute('viewBox', nar ? '0 0 400 790' : '0 0 720 400');
    fig.classList.toggle('egy-sm', nar);
    clear(fig);
    const R = khCalc(sec.v, cu.v, lf.v, gr.v);
    // ---------------- bal panel: cölöp a talajban (keskeny nézetben felül, középen)
    const g = svg('g', { transform: nar ? 'translate(90 0)' : null }, fig);
    const PX = 40, X = 112, CAP0 = 30, CAP1 = 54;
    const ys = CAP1 + lf.v * PX;
    const soilShade = clamp((cu.v - 2) / 40, 0, 1);
    svg('rect', { x: 20, y: ys, width: 190, height: 390 - ys, class: soilShade < 0.35 ? 'f-soilF' : soilShade < 0.7 ? 'f-soilB' : 'f-soilE' }, g);
    svg('rect', { x: 20, y: ys, width: 190, height: 390 - ys, fill: 'url(#pat-clay)', opacity: 0.55 }, g);
    if (lf.v > 0) {
      svg('rect', { x: 20, y: CAP1, width: 190, height: ys - CAP1, class: 'f-surface', opacity: 0.7 }, g);
      svg('line', { x1: 20, y1: ys, x2: 210, y2: ys, class: 's-soil', 'stroke-width': 1.4, 'stroke-dasharray': '5 4' }, g);
      txt(g, nar ? 14 : 26, (CAP1 + ys) / 2 + 4, 'szabad szakasz', 't-sm', { 'text-anchor': nar ? 'end' : 'start' });
    }
    svg('rect', { x: 34, y: CAP0, width: 160, height: CAP1 - CAP0, class: 'f-conc' }, g);
    svg('rect', { x: 34, y: CAP0, width: 160, height: CAP1 - CAP0, fill: 'url(#pat-conc)' }, g);
    txt(g, 124, CAP0 - 8, 'fejtömb, alap', 't-sm');
    carrow(g, X, 0, X, CAP0 - 2, 'var(--bad)', 3, 9);
    // kihajlási alak (torzított)
    const Lepx = (lf.v + (Math.PI * R.lam) / Math.SQRT2) * PX;
    const halfPx = R.half * PX;
    const pts = [], base = [];
    const A = 13;
    for (let y = CAP1; y <= 384; y += 3) {
      const z = y - CAP1;
      let w;
      if (y <= ys) w = A * Math.sin((Math.PI * z) / (2 * Math.max(Lepx, 1))) * (lf.v > 0 ? 1 : 0);
      else {
        const zz = y - ys;
        const w0 = lf.v > 0 ? A * Math.sin((Math.PI * (ys - CAP1)) / (2 * Math.max(Lepx, 1))) : 0;
        w = (w0 * Math.cos((Math.PI * zz) / halfPx) + A * Math.sin((Math.PI * zz) / halfPx)) * Math.exp(-zz / (1.6 * halfPx));
      }
      pts.push([X + w, y]); base.push([X, y]);
    }
    svg('path', { d: pathD(base), fill: 'none', class: 's-muted', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, g);
    svg('path', { d: pathD(pts), fill: 'none', style: 'stroke:var(--grout)', 'stroke-width': gr.v ? 9 : 0, 'stroke-linecap': 'round', opacity: 0.9 }, g);
    svg('path', { d: pathD(pts), fill: 'none', class: 's-steel', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
    // félhullám méret
    const hy0 = ys + 6, hy1 = Math.min(384, ys + 6 + halfPx);
    svg('line', { x1: 186, y1: hy0, x2: 186, y2: hy1, class: 's-ink', 'stroke-width': 1 }, g);
    svg('line', { x1: 181, y1: hy0, x2: 191, y2: hy0, class: 's-ink', 'stroke-width': 1 }, g);
    svg('line', { x1: 181, y1: hy1, x2: 191, y2: hy1, class: 's-ink', 'stroke-width': 1 }, g);
    txt(g, 180, (hy0 + hy1) / 2 - 4, 'félhullám', 't-sm halo', { 'text-anchor': 'end' });
    txt(g, 180, (hy0 + hy1) / 2 + 10, nb(fmt(R.half, 1) + ' m'), 't-num halo', { 'text-anchor': 'end' });
    // ---------------- jobb panel: N_cr(c_u)
    const c = svg('g', {}, fig);
    const x0 = nar ? 52 : 290, x1 = nar ? 386 : 700, y0 = nar ? 735 : 350, y1 = nar ? 440 : 30;
    const ymax = { t30: 700, t40: 1200, cso: 2500 }[sec.v];
    const sx = (v) => x0 + ((v - 0) / 60) * (x1 - x0), sy = (v) => y0 - (Math.min(v, ymax) / ymax) * (y0 - y1);
    // c_u < 10 kPa sáv
    svg('rect', { x: sx(0), y: y1, width: sx(10) - sx(0), height: y0 - y1, class: 'f-warn', opacity: 0.13 }, c);
    stxt(c, sx(0) + 6, y1 + 16, 'c', 'u', ' < 10 kPa:', 't-sm');
    txt(c, sx(0) + 6, y1 + 30, 'külön vizsgálni', 't-sm');
    for (let v = 0; v <= ymax; v += ymax / 5) { svg('line', { x1: x0, y1: sy(v), x2: x1, y2: sy(v), class: 'grid' }, c); txt(c, x0 - 6, sy(v) + 4, fmt(v, 0), 't-sm', { 'text-anchor': 'end' }); }
    for (let v = 0; v <= 60; v += 10) { svg('line', { x1: sx(v), y1: y0, x2: sx(v), y2: y0 + 4, class: 'axis' }, c); txt(c, sx(v), y0 + 17, String(v), 't-sm', { 'text-anchor': 'middle' }); }
    svg('line', { x1: x0, y1: y0, x2: x1, y2: y0, class: 'axis' }, c);
    svg('line', { x1: x0, y1: y0, x2: x0, y2: y1, class: 'axis' }, c);
    stxt(c, x1, y0 + 36, 'c', 'u', ' [kPa]', 't-lab', { 'text-anchor': 'end' });
    txt(c, x0 - 4, y1 - 12, 'N [kN]', 't-lab', { 'text-anchor': 'middle' });
    // görbe
    const cp = [];
    for (let v = 1; v <= 60; v += 0.25) { const n = khCalc(sec.v, v, lf.v, gr.v).Ncr; if (n > ymax) { cp.push([sx(v), sy(ymax)]); break; } cp.push([sx(v), sy(n)]); }
    svg('path', { d: pathD(cp), fill: 'none', class: 's-grp', 'stroke-width': 3 }, c);
    // N_pl
    svg('line', { x1: x0, y1: sy(R.Npl), x2: x1, y2: sy(R.Npl), class: 's-steel', 'stroke-width': 2, 'stroke-dasharray': '7 5' }, c);
    stxt(c, x1 - 4, sy(R.Npl) - 7, 'N', 'pl', ' – az acél folyása', 't-lab', { 'text-anchor': 'end', 'font-size': 12 });
    // metszéspont
    let cross = null;
    for (let v = 1; v <= 60; v += 0.25) { if (khCalc(sec.v, v, lf.v, gr.v).Ncr >= R.Npl) { cross = v; break; } }
    if (cross !== null && cross > 1) {
      svg('line', { x1: sx(cross), y1: sy(R.Npl), x2: sx(cross), y2: y0, class: 's-muted', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, c);
      txt(c, sx(cross) + 5, y0 - 8, nb(`≈ ${fmt(cross, 0)} kPa`), 't-num halo');
    }
    // aktuális pont
    const ncrLab = svg('g', {}, c);
    svg('circle', { cx: sx(cu.v), cy: sy(R.Ncr), r: 7, class: R.Ncr < R.Npl ? 'f-bad' : 'f-ok', style: 'stroke:var(--surface);stroke-width:2.5' }, ncrLab);
    const right = sx(cu.v) < x0 + (x1 - x0) * 0.62;
    stxt(ncrLab, sx(cu.v) + (right ? 12 : -12), Math.max(y1 + 12, sy(R.Ncr) - 10), 'N', 'cr', nb(` = ${fmt(R.Ncr, 0)} kN`), 't-num halo', { 'text-anchor': right ? 'start' : 'end' });
    // kimenetek
    sEI.set(R.EI);
    sNcr.set(R.Ncr, R.Ncr < R.Npl ? 'bad' : 'ok');
    sNpl.set(R.Npl);
    const gov = R.Ncr < R.Npl;
    sGov.set(gov ? 'kihajlás' : 'az acél folyása', gov ? 'bad' : 'ok');
    if (gov) vd.set('bad', 'A kihajlás a mértékadó', nb(`A talaj ennyire puha (vagy a szabad szakasz ennyire hosszú), hogy a cölöp előbb kihajlik (${fmt(R.Ncr, 0)} kN), mint hogy az acél megfolyna (${fmt(R.Npl, 0)} kN). Ilyenkor a kihajlást külön kell vizsgálni – merevebb betét, nagyobb cementtest, vagy a szabad szakasz megszüntetése segít.`));
    else if (cu.v < 10) vd.set('warn', 'Most még elég – de vizsgálni kell', nb(`c<sub>u</sub> < 10 kPa: a kihajlást külön ellenőrizni kell. Ebben a modellben a kritikus erő (${fmt(R.Ncr, 0)} kN) még meghaladja a folyási erőt, de a cementtest repedése vagy egy kis üreg ezt gyorsan megfordítja.`));
    else vd.set('ok', 'A talaj megtámasztja a cölöpöt', nb(`A kritikus erő (${fmt(R.Ncr, 0)} kN) nagyobb a folyási erőnél (${fmt(R.Npl, 0)} kN): az oldalirányú ágyazás elég ahhoz, hogy ne a kihajlás legyen a mértékadó. Kapcsold ki a cementtest merevségét, vagy adj szabad hosszt – és figyeld a görbét!`));
  };
  [sec, gr, cu, lf].forEach((c) => c.on(draw));
  draw();
});

/* ================================================================== 3. JET-OSZLOPGYÁR */
const JET_SOIL = {
  kavics: { t: 'Kavics', D: [0.8, 2.0], col: '--soilD', grain: 2.6 },
  homok: { t: 'Homok', D: [0.6, 1.6], col: '--soilA', grain: 1.5 },
  iszap: { t: 'Iszap', D: [0.45, 1.0], col: '--soilC', grain: 1.0 },
  agyag: { t: 'Agyag', D: [0.35, 0.7], col: '--soilB', grain: 0.7 },
};
const JET_VAR = {
  szimpla: { t: 'Szimpla', f: 0.25, water: false, air: false },
  levegos: { t: 'Levegős dupla', f: 0.6, water: false, air: true },
  vizes: { t: 'Vizes dupla', f: 0.55, water: true, air: false },
  tripla: { t: 'Tripla', f: 0.9, water: true, air: true },
};
function jetCalc(soil, vr, p, v, n) {
  const S = JET_SOIL[soil], V = JET_VAR[vr];
  const fp = clamp((p - 300) / 300, 0, 1);
  const fs = 0.8 + 0.4 * clamp((60 - v) / 50, 0, 1);
  const f = clamp(V.f * (0.55 + 0.45 * fp) * fs, 0, 1);
  const D = S.D[0] + (S.D[1] - S.D[0]) * f;
  const dz = v / n; // cm / fordulat
  return { D, dz, gaps: dz > 4 };
}
register('egy-jet', (root) => {
  const { ctrls, viz, out } = shell(root, { foot: '<b>Szemléltető modell.</b> Az átmérőt a talaj, a változat, a nyomás és az emelési sebesség alapján a jellemző tartományokba (agyagban legfeljebb 60–70 cm, kavicsban 150–200 cm) skáláztuk. A valós átmérőt a helyszínen próbaoszlopokkal, kibontással ellenőrzik.' });
  const soil = seg(ctrls, { label: 'Talaj', options: Object.entries(JET_SOIL).map(([v, s]) => ({ v, t: s.t })), value: 'homok' });
  const vr = seg(ctrls, { label: 'Változat', options: Object.entries(JET_VAR).map(([v, s]) => ({ v, t: s.t })), value: 'szimpla' });
  const pr = slider(ctrls, { label: 'Nyomás', sym: 'p', min: 300, max: 600, step: 10, value: 450, unit: 'bar', d: 0, hint: 'a szokásos tartomány 400–600 bar' });
  const sp = slider(ctrls, { label: 'Emelési sebesség', sym: 'v', min: 10, max: 60, step: 1, value: 30, unit: 'cm/perc', d: 0 });
  const rpm = slider(ctrls, { label: 'Fordulatszám', sym: 'n', min: 5, max: 25, step: 1, value: 12, unit: '1/perc', d: 0 });
  const ss = slider(ctrls, { label: 'Oszloptávolság a falban', sym: 's', min: 0.3, max: 2.4, step: 0.05, value: 0.6, unit: 'm', d: 2 });
  const blk = toggle(ctrls, { label: 'a visszafolyó iszap útja elzáródik', value: false });

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
    if (blk.v) vd.set('bad', 'Hidraulikus talajtörés veszélye', 'A visszafolyó iszap nem tud a furat mentén a felszínre távozni: a 400–600 bar-os sugár nyomása a talajban halmozódik. A talaj felreped, a felszín – és a szomszéd épület – megemelkedhet. Az iszap kiáramlását végig figyelni kell!');
    else if (t <= 0) vd.set('bad', 'Rés marad a falban', `Az oszloptávolság (${fmt(s, 2)} m) nem kisebb az átmérőnél (kb. ${fmt(D, 2)} m): az oszlopok nem metszik egymást, a fal nem vízzáró. Sűrítsd a kiosztást, vagy növeld az átmérőt.`.replace(/ m\b/g, ' m'));
    else if (t < 0.3) vd.set('warn', 'Vékony átfedés – kockázatos', `Az átfedésnél csak kb. ${fmt(t, 2)} m vastag a fal. 1 % fúrási ferdeség 10 m mélyen már 10 cm eltérés – mélyebben könnyen rés nyílhat.`.replace(/ (m|cm)\b/g, ' $1'));
    else if (R.gaps) vd.set('warn', 'Csavarvonalas hibák', `Fordulatonként ${fmt(R.dz, 1)} cm emelés túl sok: a sugár nem „söpri végig” a teljes palástot, az oszlopban csavarvonal mentén kezeletlen talaj maradhat. Lassíts, vagy forgass gyorsabban.`.replace(/ cm\b/g, ' cm'));
    else vd.set('ok', 'Zárt, átfedéses jet-fal', `Kb. ${fmt(D, 2)} m-es oszlopok ${fmt(s, 2)} m-enként: az átfedésnél kb. ${fmt(t, 2)} m vastag, folytonos fal.`.replace(/ m\b/g, ' m').replace(/ m-/g, ' m-'));
    return { R, t };
  };
  let S = upd();
  [soil, vr, pr, sp, rpm, ss, blk].forEach((c) => c.on(() => { S = upd(); if (!blk.v) heave = 0; draw(); }));

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
      for (let i = 0; i <= steps; i++) { const y = lerp(colTop, bot, i / steps); const wob = 1 + 0.06 * Math.sin(y * 0.09 + so.grain) * (soil.v === 'kavics' ? 1.6 : 1); ctx.lineTo(cx - half * wob, y); }
      for (let i = steps; i >= 0; i--) { const y = lerp(colTop, bot, i / steps); const wob = 1 + 0.06 * Math.sin(y * 0.11 + 1.3) * (soil.v === 'kavics' ? 1.6 : 1); ctx.lineTo(cx + half * wob, y); }
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
    ctx.font = `700 12px ${MONO()}`; ctx.fillStyle = C['--ink']; ctx.textAlign = 'left';
    ctx.fillText(u < drill ? '1 · fúrás' : u < rise ? '2 · injektálás felfelé' : '3 · kész oszlop', 10, 18);
    ctx.textAlign = 'center';
    ctx.fillText('D ≈ ' + fmt(D, 2).replace(' ', '') + ' m', cx, bot + 14 > H - 4 ? H - 6 : bot + 14);
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
      ctx.font = `700 12px ${MONO()}`; ctx.textAlign = 'left'; ctx.fillStyle = C['--ink'];
      ctx.fillText('t ≈ ' + fmt(S.t, 2) + '\u00A0m', Math.min(x + 8, PW - 90), Math.min(PH - 6, pcy + Math.max(tt, r * 0.6) + 16));
    }
    // osztásméret
    const yd = pcy - r - 12;
    ctx.strokeStyle = C['--ink']; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xs, yd); ctx.lineTo(xs + s * k, yd); ctx.moveTo(xs, yd - 5); ctx.lineTo(xs, yd + 5); ctx.moveTo(xs + s * k, yd - 5); ctx.lineTo(xs + s * k, yd + 5); ctx.stroke();
    ctx.font = `700 12px ${MONO()}`; ctx.textAlign = 'center'; ctx.fillStyle = C['--ink'];
    ctx.fillText('s = ' + fmt(s, 2) + '\u00A0m', Math.max(xs + (s * k) / 2, 46), yd - 7);
    ctx.textAlign = 'left'; ctx.fillText('felülnézet · oszlopsor', px0, 18);
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
  jet: { t: 'Jet-grouting', tool: 'fúrószár, alján a monitor 2–5 mm-es fúvókákkal', soil: '400–600 bar-os sugárral felaprózza, kötőanyaggal keveri, részben helyettesíti', left: '„talajbeton” oszlop, átmérője a talajtól függ', use: 'aláfalazás, munkagödör, vízzáró fal' },
  dsm: { t: 'Mélykeverés', tool: 'forgó, lapátos keverőszár', soil: 'helyben, mechanikusan összekeveri a kötőanyaggal – lefelé és felfelé is', left: 'kevert oszlop (tömb, fal), mérete ≈ a szerszámé', use: 'puha talaj javítása, töltések alatt, zárófal' },
  ko: { t: 'Kavicscölöp', tool: 'rezgő szár (mélyvibrátor), csúcsán kavicsadagolás', soil: 'kiszorítja, a kavicsot szakaszosan a talajba tömöríti', left: 'tömörített kavicsoszlop – szemcsés „cölöp”', use: 'süllyedéscsökkentés, konszolidáció gyorsítása' },
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
  { q: 'Mi történik a merevbetétes, injektálásos mikrocölöp (pl. Ischebeck Titan) készítésekor?', a: ['elvesző fúrófejes üreges rudat hajtanak le, és közben folyamatosan injektálnak', 'előregyártott acélcsövet vernek le, majd kihúzzák', 'a furatot bentonitzaggyal támasztják meg, majd kontraktorcsővel betonoznak', 'a rudat kihúzzák, és a helyét kaviccsal töltik ki'], c: 0, e: 'A rúd egyszerre fúrószár, injektálócső és végleges betét. Körülötte 20–50 mm-es cementtest, azon kívül 30–80 mm-es átitatott talajköpeny alakul ki.' },
  { q: 'Mekkora nyomással juttatják a talajba a kötőanyagot jet-groutingnál?', a: ['400–600 bar', '5–6 bar', '40–60 bar', '4000–6000 bar'], c: 0, e: 'A 2–5 mm-es fúvókákon 400–600 bar nyomással lövellik ki a kötőanyagot. Az 5–6 bar a levegőburok nyomása a levegős dupla jetnél.' },
  { q: 'Ugyanazzal a technológiával melyik talajban adódik a legnagyobb jet-oszlop?', a: ['kavicsban', 'agyagban', 'iszapban', 'mindegyikben ugyanakkora'], c: 0, e: 'Az átmérő a talaj áteresztőképességétől függ: agyagban legfeljebb 60–70 cm, kavicsban akár 150–200 cm.' },
  { q: 'Mi a levegős dupla jet lényege?', a: ['a cementsugarat 5–6 bar-os levegőburok veszi körül, ezért nő a hatótávolság', 'két cementsugár lő egymással szemben', 'előbb levegővel fúrnak, utána cementtel injektálnak', 'a levegő a visszafolyó iszapot szívja ki'], c: 0, e: 'A levegőburok csökkenti a sugár „fékeződését” a talajban, így nagyobb oszlopátmérő érhető el.' },
  { q: 'Mi a veszélye, ha injektálás közben a visszafolyó iszap nem tud a felszínre távozni?', a: ['hidraulikus talajtörés, a felszín és az épület megemelkedése', 'a jet-oszlop túl vékony lesz', 'a fúrórúd befagy', 'semmi, csak lassabb a munka'], c: 0, e: 'A többletanyag akadálytalan kiáramlását végig figyelni kell – különben a nyomás a talajban halmozódik.' },
  { q: 'Hogyan készül a jet-panel?', a: ['forgatás nélkül felhúzva, két, egymással szemben álló fúvókával', 'lassabb forgatással, de nagyobb nyomással', 'két szomszédos oszlop egyidejű injektálásával', 'vízszintes fúrással a gödör falából'], c: 0, e: 'Ha nem forgatják a szárat, a két fúvóka csak egy síkban „legyinti meg” a talajt: vékony, sík elem lesz belőle – V alakban kapcsolva vízzáró függönyfal.' },
  { q: 'Miben különbözik a mélykeverés a jet-groutingtól?', a: ['a talajt forgó, lapátos keverőszár keveri össze helyben a kötőanyaggal, nem nagy nyomású sugár', 'mélykeverésnél a talajt kiemelik és a felszínen keverik', 'mélykeverésnél nincs kötőanyag', 'a mélykeverés csak kőzetben működik'], c: 0, e: 'A keverőszerszám végzi a munkát, ezért az elem mérete közel a szerszáméval egyezik.' },
  { q: 'Melyik állítás igaz a vibrált kőoszlopra (kavicscölöpre)?', a: ['a kőoszlop és a köztes talaj együtt viseli a terhet – átmenet a talajjavítás felé', 'önálló, csúcsán álló teherhordó cölöp', 'betonnal kiöntött acélcső', 'csak talajvíz felett, kötött talajban készíthető'], c: 0, e: 'A rezgő szárral tömörített kavicsoszlop merevít és drénez; a teher egy része a talajra jut, ezért a talajjavításokhoz is soroljuk.' },
]);
