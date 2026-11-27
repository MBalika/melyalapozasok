// C08 – Kút, szekrény, keszon: részletes ábrák a folyamatábrák elemtárából (proc.js KIT).
// A feliratok itt állnak; az ékezet nélküli egyszavas feliratok EN ? … : … alakban (a fordító különben kódnak sorolná).
import { KIT } from './proc.js';
const { defs, v, F, SK, g_, R, P, C, E, Ln, el, hash, backdrop, tag, arrowP, head, arrowV, arrowH, worker, man, crane, mixer, excavator, concrete, casing, water, tremie, clam, skip, tipper, pbBig, silo, spoil, vibroUnit, carSide, hoseTo, CUR, EN, SOIL } = KIT;

/* ------------------------------------------------------------------ közös elemek */
export function mkS(host, W, H, label, cls = '') {
  const s = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pr-svg kf ' + cls, role: 'img', 'aria-label': label }, host);
  defs(); CUR.W = W; return s;
}
const lab = (g, x, y, t, o = {}) => tag(g, x, y, t, { fs: 12, ...o });
const big = (g, x, y, t, o = {}) => el('text', { x, y, class: 'pr-tx pr-big', 'text-anchor': o.anchor || 'middle', text: t, ...(o.style ? { style: o.style } : {}) }, g);
const concP = (g, d, o = {}) => { P(g, d, o.fresh ? 'fill:url(#pr-freshg)' : 'fill:url(#pr-concg)'); P(g, d, 'fill:url(#pr-p-conc)'); P(g, d, SK('concedge', o.w ?? 1.1, 'stroke-linejoin:round')); };
const soilP = (g, d, k) => { const [c, p] = SOIL[k]; P(g, d, F(c)); P(g, d, `fill:url(#${p})`); };
const soilR = (g, x, y, w, h, k) => soilP(g, `M${x} ${y}h${w}v${h}h${-w}Z`, k);
function waterBody(g, x, y, w, h, o = {}) {
  R(g, x, y, w, h, F('water', o.op ?? 0.34)); R(g, x, y, w, Math.min(h, 14), F('air', 0.18));
  for (let i = 0; i < (o.n ?? 2); i++) { let d = `M${x} ${y + 5 + i * 7}`; for (let xx = x; xx < x + w; xx += 16) d += ` q4 -3 8 0 t8 0`; P(g, d, SK('water', 0.9, 'opacity:.55'), { 'clip-path': o.clip || null }); }
  Ln(g, x, y, x + w, y, SK('water', 1.6));
}
function dimV(g, x, y1, y2, t, o = {}) {
  Ln(g, x, y1, x, y2, SK('labline', 1.1)); for (const y of [y1, y2]) Ln(g, x - 5, y, x + 5, y, SK('labline', 1.1));
  if (t) { const tx = el('text', { x: x + (o.dx ?? 8), y: (y1 + y2) / 2, class: 'pr-tx', style: 'font-size:12px;font-weight:700', 'dominant-baseline': 'middle', text: t }, g); if (o.rot) { tx.setAttribute('transform', `rotate(-90 ${x + (o.dx ?? 8)} ${(y1 + y2) / 2})`); tx.setAttribute('text-anchor', 'middle'); } }
}
function dimH(g, x1, x2, y, t) { Ln(g, x1, y, x2, y, SK('labline', 1.1)); for (const x of [x1, x2]) Ln(g, x, y - 5, x, y + 5, SK('labline', 1.1)); el('text', { x: (x1 + x2) / 2, y: y - 7, class: 'pr-tx', 'text-anchor': 'middle', style: 'font-size:12px;font-weight:700', text: t }, g); }
function lvl(g, x, y, t, o = {}) { // szintjel (o.below: a jel és a felirat a vonal alatt)
  P(g, o.below ? `M${x - 6} ${y + 9}h12l-6 -9Z` : `M${x - 6} ${y - 9}h12l-6 9Z`, F('labline')); Ln(g, x - 12, y, x + (o.len ?? 30), y, SK('labline', 1.1));
  el('text', { x: x + 12, y: o.below ? y + 12 : y - 4, class: 'pr-tx', style: 'font-size:11.5px;font-weight:700;paint-order:stroke;stroke:var(--pr-labbg);stroke-width:3px', text: t }, g);
}
/** kút- vagy szekrényköpeny metszete (két tükrös fal). o: t falvastagság, sh vállkiugrás, tp kúposodás (alul kifelé), eh az él magassága, rings: gyűrűhézagok */
export function shell(g, cx, top, bot, half, o = {}) {
  const t = o.t ?? 13, sh = o.sh ?? 0, tp = o.tp ?? 0, eh = o.eh ?? 22, w = g_(g);
  for (const k of [-1, 1]) {
    const xi = cx + k * half, xo = cx + k * (half + t), xb = xo + k * tp, ys = bot - eh - 10;
    const d = sh ? `M${xi} ${top}L${xo} ${top}L${xo + k * tp * 0.8} ${ys}L${xb + k * sh} ${ys + sh * 0.9}L${xb + k * sh} ${bot}L${xi + k * (tp * 0.9 + 2)} ${bot - eh}L${xi + k * tp * 0.86} ${bot - eh}Z`
      : `M${xi} ${top}L${xo} ${top}L${xb} ${bot}L${xi + k * (tp * 0.9 + 2)} ${bot - eh}L${xi + k * tp * 0.86} ${bot - eh}Z`;
    concP(w, d, o);
    P(w, `M${xb + k * sh} ${bot}l${-k * 4} -6`, SK('steel3', 2.6, 'stroke-linecap:round'));
    if (o.rings) for (let y = top + o.rings; y < bot - eh - 6; y += o.rings) Ln(w, Math.min(xi, xo), y, Math.max(xi, xo), y, SK('concedge', 1.2));
    if (o.rebar) for (const dx of [3.5, t - 3.5]) Ln(w, xi + k * dx, top + 4, xi + k * dx + k * tp * 0.8, bot - eh - 4, SK('rebar', 0.9, 'opacity:.75'));
  }
  return w;
}
const bore = (g, x, y, w, h) => R(g, x, y, w, h, F('bore'));
const downs = (g, xs, y1, y2) => xs.forEach((x) => arrowV(g, x, y1, y2, { c: 'push', w: 2.6, s: 7 }));

/* ================================================================== A) földkiemelés kútalapnál */
export function artKotro(host) {
  const W = 640, H = 430, GY = 196, M = { H, GY, layers: [{ k: 'clay', y: GY }, { k: 'gravel', y: 346 }] };
  const s = mkS(host, W, H, 'Földkiemelés kútalapnál: forgó kotró markolóedénnyel, a vasbeton köpenyfal a saját súlyától süllyed'), g = g_(s);
  backdrop(g, M, 0, W);
  const cx = 214, half = 52, top = GY - 40, bot = 318;
  bore(g, cx - half, top, 2 * half, bot - top - 14);
  P(g, `M${cx - half - 4} ${bot - 6} Q${cx} ${bot + 22} ${cx + half + 4} ${bot - 6} L${cx + half} ${bot - 20} H${cx - half}Z`, F('bore'));
  P(g, `M${cx - half - 4} ${bot - 6} Q${cx} ${bot + 22} ${cx + half + 4} ${bot - 6}`, SK('labline', 1.2, 'stroke-dasharray:5 4'));
  for (let i = 0; i < 7; i++) E(g, cx - 30 + i * 10, bot + 2 - Math.abs(i - 3) * 2.4, 3.4, 2.2, F('clay2') + `;stroke:${v('layer')};stroke-width:.5`);
  shell(g, cx, top, bot, half, { t: 14, rebar: true });
  const gr = clam(g, cx, bot + 2, 33, 0.7, { soil: 'clay' });
  crane(g, M, cx, gr.top, { reach: 190, tipY: 22 });
  tipper(pbBig(g, 540, GY, 1.25), M, 520, -1, 0.5);
  spoil(g, M, 86, 62, 16, 'clay');
  worker(g, cx + half + 38, { GY, dir: -1, pose: 'guide' });
  downs(g, [cx - half - 28, cx + half + 28], GY + 18, GY + 64);
  lab(g, 30, GY + 44, 'süllyed a saját súlyától', { to: [cx - half - 34, GY + 44] });
  lab(g, 336, GY + 36, 'vasbeton köpenyfal', { to: [cx + half + 8, GY + 36] });
  lab(g, 336, bot - 52, 'markolóedény', { to: [cx + 18, bot - 52] });
  lab(g, 336, bot + 6, 'vágóél', { to: [cx + half + 11, bot - 3] });
  lab(g, 404, 38, 'forgó kotró', { to: [404, 76] });
  lab(g, W - 12, GY + 22, 'puha réteg', { anchor: 'end' }); lab(g, W - 12, 372, 'teherbíró réteg', { anchor: 'end' });
}

/* ================================================================== C) az erők útja */
export function artEro(host) {
  const W = 640, H = 430, GY = 150, M = { H, GY, layers: [{ k: 'clay', y: GY }, { k: 'gravel', y: 268 }] };
  const s = mkS(host, W, H, 'A kútalap erőjátéka: oszlopteher, áthidaló gerenda, kutak, talp- és köpenyellenállás'), g = g_(s);
  backdrop(g, M, 0, W);
  const xs = [120, 320, 520], hw = 36, bot = 318, by = GY - 34;
  for (const x of xs) {
    const d = `M${x - hw} ${GY - 4}H${x + hw}V${bot}H${x - hw}Z`; concP(g, d);
    for (const k of [-1, 1]) { for (const y of [GY + 30, GY + 62, GY + 94]) arrowV(g, x + k * (hw + 12), y + 14, y - 8, { c: 'ok', w: 2, s: 5.5 }); }
    for (const dx of [-18, 0, 18]) arrowV(g, x + dx, bot + 40, bot + 6, { c: 'push', w: 2.6, s: 7 });
    arrowV(g, x, GY + 60, GY + 8, { c: 'acc2', w: 3.4, s: 8 });
  }
  concP(g, `M${xs[0] - 70} ${by}H${xs[2] + 70}V${GY - 4}H${xs[0] - 70}Z`);
  for (const x of [220, 420]) { concP(g, `M${x - 13} ${by - 86}h26V${by}h-26Z`); arrowV(g, x, 14, by - 92, { c: 'labline', w: 3.4, s: 8 }); big(g, x + 22, 34, 'F', { anchor: 'start' }); }
  P(g, `M${xs[0]} ${by + 15} Q${220} ${by + 34} ${xs[1]} ${by + 15} Q${420} ${by + 34} ${xs[2]} ${by + 15}`, SK('acc', 2, 'stroke-dasharray:6 4'));
  big(g, xs[2] + 24, GY + 36, 'R', { anchor: 'start' });
  lab(g, 20, by - 22, 'áthidaló gerenda', { to: [xs[0] - 40, by + 8] });
  lab(g, 12, GY + 22, 'puha réteg'); lab(g, 12, 290, 'teherbíró réteg');
  lab(g, xs[0] + hw + 26, GY + 62, 'köpenyellenállás', { to: [xs[0] + hw + 14, GY + 62] });
  lab(g, xs[2] + hw + 20, bot - 30, EN ? 'well' : 'kút', { to: [xs[2] + hw - 6, bot - 30] });
  lab(g, xs[1], bot + 58, 'talpellenállás', { anchor: 'middle' });
  lab(g, 320, by - 22, EN ? 'bending (M)' : 'hajlítás (M)', { anchor: 'middle', to: [320, by + 16] });
}

/* ================================================================== B) kutak, gerendarács, felmenő szerkezet (axonometria) */
export function artSema(host) {
  const W = 640, H = 430, s = mkS(host, W, H, 'Kútalapozás sémája: kutak, áthidaló gerendarács és felmenő szerkezet axonometriában'), g = g_(s);
  R(g, 0, 0, W, H, 'fill:url(#pr-sky)');
  const c = 0.86, sn = 0.42, U = 30, ox = 300, oy = 196;
  const I = (x, y, z) => [ox + (x - y) * c * U, oy + (x + y) * sn * U - z * U];
  const pt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  const poly = (ps, st) => P(g, 'M' + ps.map(pt).join('L') + 'Z', st);
  const box = (x0, y0, z0, x1, y1, z1, cols) => { // három látható lap: tető, bal-elülső (y1), jobb-elülső (x1)
    poly([I(x0, y1, z0), I(x1, y1, z0), I(x1, y1, z1), I(x0, y1, z1)], cols[1]);
    poly([I(x1, y0, z0), I(x1, y1, z0), I(x1, y1, z1), I(x1, y0, z1)], cols[2]);
    poly([I(x0, y0, z1), I(x1, y0, z1), I(x1, y1, z1), I(x0, y1, z1)], cols[0]);
  };
  const edge = `;stroke:${v('concedge')};stroke-width:.9;stroke-linejoin:round`;
  const CC = [F('conc2') + edge, F('conc1') + edge, F('fresh1') + edge];
  // talajtömb: puha réteg és teherbíró réteg, elöl metszve
  const X0 = -1.2, X1 = 7.2, Y0 = -1.2, Y1 = 4.2, ZS = -4.2, ZB = -6.4;
  for (const [za, zb, k] of [[ZS, 0, 'clay'], [ZB, ZS, 'gravel']]) {
    soilP(g, 'M' + [I(X0, Y1, za), I(X1, Y1, za), I(X1, Y1, zb), I(X0, Y1, zb)].map(pt).join('L') + 'Z', k);
    soilP(g, 'M' + [I(X1, Y0, za), I(X1, Y1, za), I(X1, Y1, zb), I(X1, Y0, zb)].map(pt).join('L') + 'Z', k);
    poly([I(X1, Y0, za), I(X1, Y1, za), I(X1, Y1, zb), I(X1, Y0, zb)], 'fill:rgba(0,0,0,.14)');
  }
  poly([I(X0, Y0, 0), I(X1, Y0, 0), I(X1, Y1, 0), I(X0, Y1, 0)], F('grass', 0.55) + `;stroke:${v('ground')};stroke-width:1`);
  P(g, 'M' + pt(I(X0, Y1, ZS)) + 'L' + pt(I(X1, Y1, ZS)) + 'L' + pt(I(X1, Y0, ZS)), SK('layer', 1.1, 'stroke-dasharray:6 4'));
  // kutak (3 × 2): a terep alatt áttetszően, az elülső sor a metszeten teljes hosszban
  const WX = [0, 3, 6], WY = [0, 3], r = 0.62;
  const cyl = (x, y, z0, z1, op) => { const a = I(x - r, y + r, z1), b = I(x + r, y - r, z1), rx = (b[0] - a[0]) / 2, ry = rx * 0.5, cx = (a[0] + b[0]) / 2, cy = I(x, y, z1)[1], h = (z1 - z0) * U;
    const gg = g_(g, { opacity: op });
    P(gg, `M${cx - rx} ${cy} v${h} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-h}Z`, 'fill:url(#pr-concg)' + edge); P(gg, `M${cx - rx} ${cy} v${h} a${rx} ${ry} 0 0 0 ${2 * rx} 0 v${-h}Z`, 'fill:url(#pr-p-conc)');
    E(gg, cx, cy, rx, ry, F('conc2') + edge); };
  for (const y of WY) for (const x of WX) cyl(x, y, ZS - 0.9, 0.0, y === WY[1] ? 0.96 : 0.5);
  // gerendarács
  const bw = 0.42, zt = 0.75;
  for (const y of WY) box(-0.7, y - bw, 0.05, 6.7, y + bw, zt, CC);
  for (const x of WX) box(x - bw, -0.7, 0.05, x + bw, 3.7, zt, CC);
  // felmenő szerkezet: oszlopok a kutak között is, födémek
  const cols = [[0, 0], [1.5, 0], [3, 0], [4.5, 0], [6, 0], [0, 3], [1.5, 3], [3, 3], [4.5, 3], [6, 3], [0, 1.5], [6, 1.5]];
  const GL = F('glass1', 0.5) + `;stroke:${v('steel3')};stroke-width:.8`;
  for (let f = 0; f < 3; f++) {
    const z0 = zt + f * 1.5;
    for (const [x, y] of cols) box(x - 0.14, y - 0.14, z0, x + 0.14, y + 0.14, z0 + 1.36, [F('steel1') + edge, F('steel2') + edge, F('steel3') + edge]);
    box(-0.3, -0.3, z0 + 1.36, 6.3, 3.3, z0 + 1.5, [GL, F('steel2') + edge, F('steel3') + edge]);
  }
  const A = (x, y, z) => I(x, y, z);
  lab(g, 20, 250, 'terepszint', { to: A(X0 + 0.6, Y1 - 0.4, 0) });
  lab(g, 468, 60, 'felmenő szerkezet', { to: A(6.2, 0.6, 3.6) });
  lab(g, 440, 188, 'áthidaló, elosztó gerendarács', { to: A(6.7, 1.2, 0.4) });
  lab(g, 500, 360, EN ? 'wells' : 'kutak', { to: A(6.3, 3.4, -2.4) });
  lab(g, 20, 330, 'puha réteg', { to: A(0.4, Y1, -2.2) }); lab(g, 20, 396, 'teherbíró réteg', { to: A(0.4, Y1, -5.2) });
}

/* ================================================================== D) kútalap-változatok (hat kártya) */
const prep = (s, W) => { s.classList.add('pr-svg'); defs(); CUR.W = W; return g_(s); };
const VW = 200, VH = 300, VG = 74;
function vCard(s, o, labs) {
  const g = prep(s, VW), M = { H: VH, GY: VG, layers: [{ k: 'clay', y: VG }] }, cx = 100, half = 34, top = 30, bot = 250;
  backdrop(g, M, 40, VW);
  const eb = bot - (o.eh ?? 22);
  bore(g, cx - half, top, 2 * half, eb - top);
  P(g, `M${cx - half - 2 - (o.tp ?? 0)} ${bot - 4} Q${cx} ${bot + 16} ${cx + half + 2 + (o.tp ?? 0)} ${bot - 4} L${cx + half + (o.tp ?? 0)} ${eb} H${cx - half - (o.tp ?? 0)}Z`, F('bore'));
  P(g, `M${cx - half - 2 - (o.tp ?? 0)} ${bot - 4} Q${cx} ${bot + 16} ${cx + half + 2 + (o.tp ?? 0)} ${bot - 4}`, SK('labline', 1.1, 'stroke-dasharray:5 4'));
  if (o.lub) { // a vállkiugrás feletti rés kitöltése: balra tixotróp zagy, jobbra gömbkavics
    const t = 13, sh = o.sh, ys = bot - 22 - 10;
    R(g, cx - half - t - sh, VG + 2, sh, ys - VG, 'fill:url(#pr-slurryg)'); R(g, cx - half - t - sh, VG + 2, sh, ys - VG, 'fill:url(#pr-p-slurry)');
    R(g, cx + half + t, VG + 2, sh, ys - VG, F('pebble')); for (let y = VG + 6; y < ys; y += 6.5) C(g, cx + half + t + sh / 2 + (hash(y) - 0.5) * 2, y, 2.7, F('gravel') + `;stroke:${v('layer')};stroke-width:.6`);
  }
  shell(g, cx, top, bot, half, { t: 13, rebar: true, ...o });
  labs.forEach(([x, y, t, to, a]) => lab(g, x, y, t, { fs: 11.5, to, anchor: a }));
}
export const artValt = {
  gyuru: (s) => vCard(s, { rings: 44 }, [[6, 50, 'kútgyűrűk', [62, 118]]]),
  hengeres: (s) => vCard(s, {}, [[100, 282, 'vágóél', [58, 250], 'middle']]),
  hvall: (s) => vCard(s, { sh: 7 }, [[4, 176, 'vállkiugrás', [47, 222]]]),
  kupos: (s) => vCard(s, { tp: 14 }, [[100, 282, 'lefelé szélesedő köpeny', null, 'middle']]),
  kvall: (s) => vCard(s, { tp: 11, sh: 7 }, [[4, 160, 'vállkiugrás', [40, 222]]]),
  surl: (s) => vCard(s, { sh: 9, lub: true }, [[4, 48, EN ? 'slurry' : 'zagy', [48, 130]], [196, 48, EN ? 'gravel' : 'kavics', [152, 130], 'end']]),
};

/* ================================================================== E) vágóél-kialakítások (négy részlet) */
const EW = 220, EH = 300;
const ply = (ps) => 'M' + ps.map((p) => p.join(' ')).join('L') + 'Z';
function eBase(s, body) {
  const g = prep(s, EW);
  R(g, 0, 0, EW, EH, F('labbg'));
  soilR(g, 0, 238, EW, EH - 238, 'clay'); Ln(g, 0, 238, EW, 238, SK('ground', 1.3));
  concP(g, ply(body), { w: 1.4 });
  // törésvonal a metszet tetején
  let d = 'M0 18'; for (let x = 0; x < EW; x += 11) d += ` l5.5 -4 l5.5 4`; P(g, d, SK('labline', 1, 'stroke-dasharray:3 3'));
  el('text', { x: EW - 6, y: 12, class: 'pr-tx', 'text-anchor': 'end', style: 'font-size:11px', text: EN ? 'section' : 'metszet' }, g);
  return g;
}
const steelP = (g, d) => { P(g, d, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:1.2;stroke-linejoin:round`); };
const bar = (g, x, y, r = 4.4) => { C(g, x, y, r, F('rebar') + `;stroke:${v('dark')};stroke-width:.9`); C(g, x - r * 0.3, y - r * 0.3, r * 0.3, F('rebar2')); };
const anch = (g, d) => { P(g, d, SK('dark', 4.6, 'stroke-linecap:round')); P(g, d, SK('steel2', 2.6, 'stroke-linecap:round')); };
const EBODY = [[52, 18], [168, 18], [168, 110], [84, 262], [52, 262]];
export const artEdge = {
  vb: (s) => { const g = eBase(s, EBODY);
    for (const q of [[[62, 34], [158, 34], [158, 104], [62, 104]], [[62, 124], [150, 124], [110, 192], [62, 192]], [[62, 206], [102, 206], [84, 244], [62, 244]]]) P(g, ply(q), SK('rebar', 2.2, 'stroke-linejoin:round'));
    for (const [x, y] of [[62, 34], [158, 34], [62, 104], [158, 104], [62, 124], [150, 124], [62, 192], [110, 192], [62, 206]]) bar(g, x, y);
    bar(g, 62, 244, 5.2);
    lab(g, 214, 60, 'Ø18', { anchor: 'end', to: [160, 36] }); lab(g, 214, 152, EN ? 'Ø8 stirrup' : 'Ø8 kengyel', { anchor: 'end', to: [150, 126] }); lab(g, 8, 286, 'Ø20', { to: [60, 247] }); },
  szog: (s) => { const g = eBase(s, EBODY);
    for (const [x1, y1, x2, y2] of [[64, 250, 100, 190], [74, 252, 112, 180], [84, 254, 124, 168]]) anch(g, `M${x1} ${y1}L${x2} ${y2}`);
    steelP(g, ply([[49, 234], [49, 267], [93, 267], [93, 258], [58, 258], [58, 234]]));
    lab(g, 8, 288, 'L 100×100×14', { to: [54, 264] }); lab(g, 214, 150, 'horgonyok', { anchor: 'end', to: [108, 184] }); },
  elo: (s) => { const g = eBase(s, [[52, 18], [168, 18], [168, 110], [96, 238], [52, 238]]);
    for (const x of [74, 92]) anch(g, `M${x} 236 L${x + 30} 120 q4 -12 -8 -14`);
    steelP(g, ply([[47, 235], [101, 235], [101, 243], [56, 243], [56, 290], [47, 290]]));
    lab(g, 214, 284, 'acélél 100×10', { anchor: 'end', to: [57, 272] }); lab(g, 214, 60, 'Ø12 horgony', { anchor: 'end', to: [106, 128] });
    el('text', { x: 208, y: 84, class: 'pr-tx', 'text-anchor': 'end', style: 'font-size:11px;paint-order:stroke;stroke:var(--pr-labbg);stroke-width:3px', text: '25 cm-enként' }, g); },
  geo: (s) => { const g = eBase(s, [[40, 18], [150, 18], [150, 40], [86, 262], [58, 262], [58, 80], [40, 74]]);
    steelP(g, ply([[53, 262], [65, 262], [65, 286], [53, 286]]));
    Ln(g, 86, 262, 86, 150, SK('labline', 1, 'stroke-dasharray:4 3'));
    P(g, `M86 190 A72 72 0 0 1 ${(86 + 72 * Math.sin(0.278)).toFixed(1)} ${(262 - 72 * Math.cos(0.278)).toFixed(1)}`, SK('acc', 1.6));
    el('text', { x: 100, y: 178, class: 'pr-tx', style: `font-size:13px;font-weight:800;fill:${v('acc')};paint-order:stroke;stroke:var(--pr-labbg);stroke-width:3px`, text: 'α ≤ 35°' }, g);
    lab(g, 4, 136, 'külső vállkiugrás', { to: [46, 77] });
    Ln(g, 53, 293, 65, 293, SK('labline', 1.1)); for (const x of [53, 65]) Ln(g, x, 289, x, 297, SK('labline', 1.1)); el('text', { x: 40, y: 297, class: 'pr-tx', 'text-anchor': 'middle', style: 'font-size:12px;font-weight:700', text: 's₀' }, g); lab(g, 214, 276, 'acél elővágóél', { anchor: 'end', to: [66, 276] }); },
};

/* ------------------------------------------------------------------ folyó: ég, part, víz, meder */
function river(g, W, H, WL, BED, layers, ox = 0) {
  backdrop(g, { H, GY: WL, layers: [{ k: layers[0].k, y: WL }, ...layers.slice(1)] }, ox, W);
  soilR(g, 0, WL - 5, W, BED - WL + 5, layers[0].k); R(g, 0, WL - 5, W, BED - WL + 5, F('glass1'));
  waterBody(g, 0, WL, W, BED - WL, { op: 0.46, n: 3 });
  Ln(g, 0, BED, W, BED, SK('ground', 1.3));
}
const letter = (g, x, y, t) => { C(g, x, y, 10, F('acc')); el('text', { x, y: y + 4.4, class: 'pr-num', 'text-anchor': 'middle', style: 'font-size:13px', text: t }, g); };
const topGrab = (g, x, y, r = 13) => { for (const k of [-1, 1]) { R(g, k < 0 ? x - r * 1.5 : x + r * 0.12, y - r * 0.8, r * 1.38, r * 1.6, F('acc') + `;stroke:${v('dark')};stroke-width:1`, { rx: r * 0.22 }); Ln(g, x + k * r * 0.95, y - r * 0.62, x + k * r * 0.95, y + r * 0.62, SK('dark', 1, 'opacity:.4')); } R(g, x - r * 0.42, y - r * 0.52, r * 0.84, r * 1.04, F('dark2') + `;stroke:${v('dark')};stroke-width:.9`, { rx: r * 0.12 }); C(g, x, y, r * 0.2, F('steel1') + `;stroke:${v('dark')};stroke-width:.7`); };
/** szekrényfal nagy vágóéllel (k: −1 bal, +1 jobb fal; x a belső sík) */
function boxWall(g, x, k, top, bot, t, o = {}) {
  const xo = x + k * t, ex = o.ex ?? 9, eh = o.eh ?? 44;
  concP(g, `M${x} ${top}L${xo} ${top}L${xo} ${bot - eh - 4}L${xo + k * ex} ${bot - eh + 6}L${xo + k * ex} ${bot}L${xo - k * 3} ${bot}L${x} ${bot - eh}Z`, o);
  P(g, `M${xo + k * ex} ${bot}l${-k * 7} 0`, SK('steel3', 3, 'stroke-linecap:round'));
}

/* ================================================================== F) nyitott szekrény: metszet + alaprajz */
export function artNyitott(host) {
  const W = 700, H = 440, s = mkS(host, W, H, 'Nyitott süllyesztett szekrény: metszet (vágóél körben, rekeszfalak, víz alatti kotrás, 6–8 m-es ütemek) és alaprajz (cellák)'), g = g_(s);
  const WL = 96, BED = 146, SW = 430;
  const clip = 'nyc' + Math.random().toString(36).slice(2, 7); el('rect', { x: 0, y: 0, width: SW, height: H }, el('clipPath', { id: clip }, el('defs', {}, s)));
  const sc = g_(g, { 'clip-path': `url(#${clip})` });
  river(sc, SW, H, WL, BED, [{ k: 'sand', y: WL }, { k: 'gravel', y: 352 }]);
  const x0 = 86, x1 = 334, t = 16, top = 52, yb = 386;
  R(sc, x0, top, x1 - x0, yb - 20 - top, F('bore')); waterBody(sc, x0, WL, x1 - x0, yb - 20 - WL, { op: 0.5, n: 1 });
  P(sc, `M${x0 - 4} ${yb - 8} Q${(x0 + x1) / 2} ${yb + 14} ${x1 + 4} ${yb - 8} L${x1} ${yb - 30} H${x0}Z`, F('water', 0.5));
  boxWall(sc, x0, -1, top, yb, t); boxWall(sc, x1, 1, top, yb, t);
  for (const x of [164, 256]) concP(sc, `M${x - 7} ${top}h14V${yb - 70}L${x} ${yb - 52}L${x - 7} ${yb - 70}Z`);
  for (const y of [158, 262]) Ln(sc, x0 - 30, y, x1 + 30, y, SK('acc', 1.3, 'stroke-dasharray:7 4'));
  for (const [x, yy, op] of [[121, yb - 14, 0.8], [299, yb - 120, 0.05]]) { const gr = clam(sc, x, yy, 23, op, { full: op < 0.3, soil: 'sand' }); Ln(sc, x, 6, x, gr.top, SK('rope', 1.4)); }
  // úszódaru és uszály a kotort anyaggal
  P(sc, `M4 ${WL + 7} h70 l-6 -15 h-58Z`, F('dark2') + `;stroke:${v('dark')};stroke-width:1`); P(sc, `M14 ${WL - 8} q22 -16 46 0Z`, F('sand2') + `;stroke:${v('layer')};stroke-width:.6`);
  for (const [y, n] of [[110, '3.'], [212, '2.'], [320, EN ? 'stage 1' : '1. ütem']]) big(sc, x1 + 26, y, n, { anchor: 'start' });
  dimV(sc, 30, 158, 262, '6–8 m', { rot: true, dx: -9 });
  lab(sc, 8, H - 14, 'vágóél körben', { to: [x0 - t - 6, yb - 6] }); lab(sc, 330, H - 14, 'rekeszfal', { to: [256, 300] });
  lab(sc, SW / 2, 20, 'metszet: víz alatti kotrás a cellákban', { anchor: 'middle' });
  // alaprajz
  const px = 468, py = 70, pw = 200, ph = 280, tt = 13;
  R(g, SW + 6, 0, W - SW - 6, H, F('labbg'));
  concP(g, `M${px} ${py}h${pw}v${ph}h${-pw}Z`, { w: 1.5 });
  const cw = (pw - 2 * tt - 7) / 2, ch = (ph - 2 * tt - 14) / 3;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { const cx = px + tt + i * (cw + 7), cy = py + tt + j * (ch + 7);
    R(g, cx, cy, cw, ch, F('glass1')); R(g, cx, cy, cw, ch, F('water', 0.5) + `;stroke:${v('concedge')};stroke-width:1`); P(g, `M${cx + 8} ${cy + 14} q6 -4 12 0 t12 0`, SK('water', 0.9, 'opacity:.6')); topGrab(g, cx + cw / 2, cy + ch / 2 - 2); }
  big(g, px + pw / 2, 44, EN ? 'plan' : 'alaprajz');
  for (const [dy, t2] of [[28, 'cellák a rekeszfalak között;'], [48, 'a külső körvonal = az építményé']]) el('text', { x: px + pw / 2, y: py + ph + dy, class: 'pr-tx', 'text-anchor': 'middle', style: 'font-size:12.5px', text: t2 }, g);
}

/* ================================================================== G) a genfi Rive-Centre mélygarázs szekrénye – méretarányos sorozat */
// 1 m = 8 px. A szekrény gyűrű: külső fal + 6 m széles, spirális födémgyűrűk az oszlopsorral, alul lépcsős vágóél; a közepe
// a süllyesztés alatt nyitott (ott dolgoztak a kotrógépek). A belső födémek, a belső pillérsor és a 13,5 m átmérőjű
// központi mag (liftek, lépcső, szellőzés) a süllyesztés után épült. A spirális útpálya miatt a metszet két oldalán a szintek fél emelettel eltérnek.
const GV = { W: 640, H: 472, Y0: 200, k: 8, cx: 320, R: 228, tw: 5, ring: 48 };
const gz = (z) => GV.Y0 - z * GV.k;
const GVL = [{ k: 'gravel', y: gz(0) }, { k: 'sand', y: gz(-3) }, { k: 'silt', y: gz(-6.5) }, { k: 'clay2', y: gz(-9) }, { k: 'clay', y: gz(-22) }, { k: 'hard', y: gz(-28) }];
const tg11 = (g, x, y, t, o = {}) => tag(g, x, y, t, { fs: 11, ...o });
function gvBase(s, ox) { const g = prep(s, GV.W); backdrop(g, { H: GV.H, GY: gz(0), gw: gz(-3.8), layers: GVL }, ox, GV.W); return g; }
const gvDeck = (g, x, y, w) => R(g, x, y, w, 2.8, 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.5`);
/** a gyűrű alakú szekrény metszete: b a vágóél szintje (m), h a megépült magasság (m), nR a kész födémgyűrűk száma, dig a belső földszint (m) */
function gvRing(g, b, h, nR, o = {}) {
  const { cx, R: RR, tw, ring } = GV, top = gz(b + h), yb = gz(b), sh = 26, xl = cx - RR + tw, xr = cx + RR - tw;
  const lv = (i, s) => gz(b + 3.5 + 2.7 * i + (s < 0 ? 0 : -1.35));
  if (o.dig != null) { // a gyűrű belseje: nyitott tér a túlsó fallal, födémgyűrűkkel és oszlopokkal (nézetben)
    R(g, xl, top, xr - xl, gz(o.dig) - top, F('bore'));
    for (let x = xl + ring + 56; x < xr - ring - 20; x += 56) Ln(g, x, top + 2, x, gz(o.dig), SK('concedge', 2.2, 'opacity:.16'));
    for (let i = 1; i <= nR; i++) { const ya = lv(i, -1), yc = lv(i, 1); if (ya > top + 2) P(g, `M${xl + ring} ${ya + 1.4} L${xr - ring} ${yc + 1.4}`, SK('concedge', 2.4, 'opacity:.2')); }
  }
  for (const s of [-1, 1]) {
    const xo = cx + s * RR, xi = xo - s * tw, xc = xi - s * ring, cellBot = yb - sh;
    if (!o.noCell) R(g, Math.min(xi, xc), top, ring, cellBot - top, F('conc2', 0.5));           // a gyűrű rekeszei (mögöttük harántfalak)
    for (let i = 1; i <= nR; i++) { const y = lv(i, s); if (y < top - 1) continue; gvDeck(g, Math.min(xi, xc), y, ring); R(g, s < 0 ? xc - 7 : xc + 3, y + 2.8, 4, 3.4, F('conc1') + `;stroke:${v('concedge')};stroke-width:.4`); }
    R(g, s < 0 ? xc - 4 : xc, top, 4, cellBot - top, 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.5`);   // oszlopsor
    // külső fal a lépcsős, üreges vágóéllel
    concP(g, `M${xo} ${top}V${yb - sh}L${xo + s * 2.2} ${yb - sh + 3}V${yb}H${xo - s * 4}v-7h${-s * 7}v-7h${-s * 7}v-7h${-s * 6}V${yb - sh}H${xi}V${top}Z`, { w: 0.9 });
    for (const [dx, dy] of [[6, 19], [13, 12]]) R(g, s < 0 ? xo + dx : xo - dx - 5, yb - sh + (sh - dy) - 6, 5, 5, F('bore') + `;stroke:${v('concedge')};stroke-width:.4`);
    P(g, `M${xo + s * 2.2} ${yb}h${-s * 6}`, SK('steel3', 2.4, 'stroke-linecap:round'));
    if (o.lub) { const y0 = Math.max(top, gz(0)); R(g, s < 0 ? xo - 2.8 : xo, y0, 2.8, yb - sh - y0, o.lub === 'grout' ? F('grout1') : 'fill:url(#pr-slurryg)'); R(g, s < 0 ? xo - 2.8 : xo, y0, 2.8, yb - sh - y0, SK('layer', 0.5)); }
  }
  if (!o.noRim) for (const s of [-1, 1]) for (let q = 0; q < 4; q++) Ln(g, cx + s * (RR - 1 - q * 1.2), top, cx + s * (RR - 1 - q * 1.2), top - 8, SK('rebar', 0.8)); // csatlakozó vasak
}
function towerCrane(g, x, by, h, jib, hook) {
  const c = g_(g), mw = 7, ty = by - h, jy = ty - 7, d = Math.sign(jib), col = 'mach2';
  R(c, x - 10, by - 4, 20, 4, F('dark2'));
  for (const k of [-1, 1]) Ln(c, x + k * mw / 2, by - 4, x + k * mw / 2, ty, SK(col, 1.4));
  for (let y = by - 4; y > ty + 4; y -= 9) P(c, `M${x - mw / 2} ${y}L${x + mw / 2} ${y - 9}M${x + mw / 2} ${y}L${x - mw / 2} ${y - 9}`, SK(col, 0.7));
  Ln(c, x - d * 30, jy, x + jib, jy, SK(col, 2.6)); Ln(c, x, jy - 4.5, x + jib, jy - 4.5, SK(col, 1));
  for (let q = 0; Math.abs(q) < Math.abs(jib) - 4; q += d * 9) P(c, `M${x + q} ${jy}l${d * 4.5} -4.5l${d * 4.5} 4.5`, SK(col, 0.7));
  Ln(c, x, jy + 2, x, jy - 22, SK(col, 2.2)); P(c, `M${x} ${jy - 22}L${x + jib * 0.72} ${jy - 4.5}M${x} ${jy - 22}L${x - d * 28} ${jy}`, SK('rope', 0.9));
  R(c, d > 0 ? x - 30 : x + 20, jy, 10, 8, F('conc1') + `;stroke:${v('concedge')};stroke-width:.5`);
  R(c, x - 6, ty - 6, 12, 9, F('mach') + `;stroke:${v('mach3')};stroke-width:.7`, { rx: 1.5 }); R(c, d > 0 ? x + 1 : x - 5, ty - 4.5, 4, 4, 'fill:url(#pr-glass)');
  if (hook) { const hx = x + jib * hook[0], hy = hook[1]; R(c, hx - 3, jy + 1.2, 6, 3, F('dark')); Ln(c, hx, jy + 4, hx, hy, SK('rope', 0.9)); P(c, `M${hx - 5} ${hy}h10l-2 8h-6Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.6`); if (hook[2]) P(c, `M${hx - 4} ${hy + 1}q4 -4 8 0Z`, F(hook[2])); }
}
const gvExc = (g, x, zy, dir = 1, sc = 0.62) => { const q = g_(g, { transform: `translate(${x} ${zy}) scale(${dir * sc} ${sc}) translate(${-x} ${-zy})` }); excavator(q, { GY: zy }, x - 60, zy - 6, { reach: 40, lift: 40 }); };
const gvChain = (g, x, zy, s) => { // vödörláncos kotró a vágóél melletti körsínen
  Ln(g, x - 10, zy, x + 14, zy, SK('steel3', 1.6)); R(g, x - 7, zy - 12, 16, 10, F('exc') + `;stroke:${v('exc3')};stroke-width:.7`, { rx: 1.5 }); for (const dx of [-4, 6]) C(g, x + dx, zy - 1.6, 1.8, F('dark'));
  P(g, `M${x + s * 2} ${zy - 12}L${x + s * 20} ${zy - 2}`, SK('dark2', 3.4, 'stroke-linecap:round')); for (let q = 0; q < 5; q++) C(g, x + s * (4 + q * 3.8), zy - 11 + q * 2.1, 1.5, F('mach')); };
const gvLevels = (g, arr) => arr.forEach(([z, t, below]) => lvl(g, 12, gz(z), t, { len: 44, below }));
export const artGenf = {
  u1: (s) => { const g = gvBase(s, 0), b = -10;
    gvRing(g, b, 13, 3, { dig: b + 0.9, lub: 'slurry' });
    // bentonitos tömítőinjektálás a vízvezető rétegben (−4 … −8 m), a faltól 1–2 m-re
    for (const k of [-1, 1]) { const x = GV.cx + k * (GV.R + 10); R(g, k < 0 ? x - 16 : x, gz(-4), 16, gz(-8) - gz(-4), F('halo', 0.34) + `;stroke:${v('slurry2')};stroke-width:.8;stroke-dasharray:3 2`); }
    P(g, `M${GV.cx - 150} ${gz(b + 0.9)} q60 -22 130 -4 q50 10 110 2 l60 2Z`, F('silt') + `;stroke:${v('layer')};stroke-width:.5`);
    gvChain(g, GV.cx - GV.R + 46, gz(b + 0.9), -1); gvExc(g, GV.cx + 40, gz(b + 0.9) - 1, 1); gvExc(g, GV.cx + 150, gz(b + 0.9), -1, 0.56);
    towerCrane(g, 44, gz(0), 166, 150, [0.62, gz(b + 5), 'silt']); towerCrane(g, 596, gz(0), 150, -130, [0.5, gz(4.5), 'fresh1']);
    gvLevels(g, [[0, '±0,00'], [-3.8, '−3,80'], [-10, '−10,0']]);
    dimV(g, GV.cx + GV.R + 18, gz(3), gz(-10), '13,0 m', { rot: true, dx: 9 }); dimH(g, GV.cx - GV.R, GV.cx + GV.R, gz(3) - 18, 'D = 57,0 m');
    tg11(g, 116, gz(-13.6), 'tixotróp folyadékköpeny (≈ 10 cm)', { to: [GV.cx - GV.R - 1.5, gz(-6.6)] });
    tg11(g, 404, gz(-13.6), 'bentonitos tömítőinjektálás', { to: [GV.cx + GV.R + 16, gz(-7)] });
    tg11(g, 150, gz(-17.6), 'lépcsős vágóél', { to: [GV.cx - GV.R + 10, gz(-9.2)] });
    tg11(g, 150, gz(10.4), 'födémgyűrű (6 m) oszlopsorral', { to: [GV.cx - GV.R + 30, gz(-1)] });
    tg11(g, 282, gz(-6.4), 'kotrógépek', { anchor: 'middle' }); },
  u2: (s) => { const g = gvBase(s, 700), b = -14.5;
    gvRing(g, b, 24.5, 7, { dig: b + 1.0, lub: 'slurry' });
    P(g, `M${GV.cx - 120} ${gz(b + 1.0)} q70 -18 150 -3 l70 3Z`, F('clay2') + `;stroke:${v('layer')};stroke-width:.5`);
    gvExc(g, GV.cx - 110, gz(b + 1.0), -1); gvExc(g, GV.cx + 60, gz(b + 1.0) - 1, 1); gvExc(g, GV.cx + 160, gz(b + 1.0), 1, 0.5);
    towerCrane(g, 40, gz(0), 190, 170, [0.56, gz(b + 6), 'clay2']); towerCrane(g, 600, gz(0), 172, -150, [0.42, gz(12), 'fresh1']);
    gvLevels(g, [[0, '±0,00'], [-14.5, '−14,50']]);
    dimV(g, GV.cx + GV.R + 18, gz(10), gz(-14.5), '24,5 m', { rot: true, dx: 9 });
    tg11(g, 160, gz(-18.4), 'hét födémgyűrű – a gyűrű közepe nyitott', { to: [GV.cx - GV.R + 30, gz(-9)] });
    tg11(g, GV.cx + 30, gz(15), EN ? 'tower cranes' : 'toronydaruk', { anchor: 'middle' }); },
  u3: (s) => { const g = gvBase(s, 1400), b = -28, { cx, R: RR, tw } = GV;
    P(g, `M${cx - RR - 40} ${gz(0) - 1}L${cx - RR - 8} ${gz(-3.5)}H${cx + RR + 8}L${cx + RR + 40} ${gz(0) - 1}Z`, 'fill:url(#pr-sky)'); P(g, `M${cx - RR - 40} ${gz(0)}L${cx - RR - 8} ${gz(-3.5)}M${cx + RR + 8} ${gz(-3.5)}L${cx + RR + 40} ${gz(0)}`, SK('ground', 1.2));
    gvRing(g, b, 24.5, 7, { dig: b + 0.2, lub: 'grout', noRim: true });
    // szivárgóréteg dréncsövekkel, rajta a fenéklemez szektoronként (a bal fele kész, a jobb oldalon még a szivárgóréteg látszik)
    const xa = cx - RR + 24, xb = cx + RR - 24, y0 = gz(-27.9), y1 = gz(-27.3), yt = gz(-24.5);
    R(g, xa, y1, xb - xa, y0 - y1, F('pebble') + `;stroke:${v('layer')};stroke-width:.5`); for (let x = xa + 16; x < xb; x += 40) C(g, x, (y0 + y1) / 2, 1.8, SK('dark', 0.9) + ';fill:' + v('halo'));
    concP(g, `M${cx - RR + tw} ${yt}H${cx - 60}V${y1}H${xa}V${yt + 6}H${cx - RR + tw}Z`, { fresh: true });
    concP(g, `M${cx - 58} ${yt}H${cx + 30}V${y1}H${cx - 58}Z`, { fresh: true });
    for (let x = cx + 36; x < xb - 6; x += 9) Ln(g, x, y1 - 1, x, y1 - 7, SK('rebar', 0.9));
    towerCrane(g, 36, gz(0), 150, 190, [0.92, yt - 22, 'fresh1']); gvExc(g, cx + 150, y1, 1, 0.5);
    for (const k of [-1, 1]) for (const z of [-11, -19]) arrowH(g, cx + k * (RR + 34), cx + k * (RR + 6), gz(z), { c: 'acc', w: 2.2, s: 5.5 });
    gvLevels(g, [[0, '±0,00'], [-3.5, '−3,50'], [-28, '−28,0']]);
    tg11(g, 128, gz(-14.6), 'cementhabarcs-injektálás', { to: [cx - RR - 1.5, gz(-15)] });
    tg11(g, cx - 96, gz(-21.2), 'fenéklemez – szektoronként', { anchor: 'middle', to: [cx - 110, gz(-25.6)] });
    tg11(g, cx + 124, gz(-21.2), 'szivárgóréteg dréncsövekkel', { anchor: 'middle', to: [cx + 100, gz(-27.6)] }); },
  u4: (s) => { const g = gvBase(s, 2100), b = -28, { cx, R: RR, tw, ring } = GV, eye = 54, col2 = 99.6, yt = gz(-24.5), yr = gz(-3.5);
    R(g, cx - RR, gz(0) - 0.5, 2 * RR, gz(-3.5) - gz(0) + 0.5, F('bore'));
    R(g, cx - RR + tw, yr, 2 * (RR - tw), yt - yr, F('bore'));
    gvRing(g, b, 24.5, 0, { lub: 'grout', noRim: true, noCell: true });
    // fenéklemez szivárgórétegen, középen szivattyúakna
    R(g, cx - RR + 24, gz(-27.3), 2 * RR - 48, gz(-27.9) - gz(-27.3), F('pebble'));
    concP(g, `M${cx - RR + tw} ${yt}H${cx - 9}v9h18v-9H${cx + RR - tw}v6H${cx + RR - 24}V${gz(-27.3)}H${cx - RR + 24}V${yt + 6}H${cx - RR + tw}Z`);
    R(g, cx - 7, yt + 3, 14, 5, F('water', 0.6));
    const CARS = ['acc', 'water', 'mach', 'mach2', 'crane', 'exc', 'steel2'];
    const car = (x, y, c, dir) => carSide(g_(g, { transform: `translate(${x} ${y}) scale(${dir * 0.62} 0.62)` }), -24, 0, c);
    const carF = (x, y, c) => { R(g, x - 6.5, y - 8.6, 13, 6.4, F(c), { rx: 2 }); R(g, x - 5, y - 11.6, 10, 4, 'fill:url(#pr-glass)', { rx: 1.5 }); for (const k of [-1, 1]) R(g, x + k * 5 - 1.2, y - 2.6, 2.4, 2.6, F('dark')); };
    for (const sd of [-1, 1]) {
      const xi = cx + sd * (RR - tw), xe = cx + sd * eye, xo2 = cx + sd * (RR - tw - ring), xi2 = cx + sd * col2, off = sd < 0 ? 0 : -1.35;
      for (let i = 0; i <= 7; i++) { const z = -24.5 + 2.7 * i + off, y = gz(z);
        if (i > 0 || sd > 0) { if (y > yr + 6) gvDeck(g, Math.min(xi, xe), y, Math.abs(xi - xe)); else continue; }
        const fy = (i === 0 && sd < 0) ? yt : y;
        if (fy - 21 < yr + 3) continue;
        if (hash(i * 3 + sd) > 0.25) car(xi - sd * 26, fy, CARS[(i + 1) % 7], sd); if (hash(i * 5 + sd + 2) > 0.3) car(xe + sd * 24, fy, CARS[(i + 4) % 7], -sd);
        if (hash(i * 7 + sd + 9) > 0.45) carF((xo2 + xi2) / 2 + sd * (hash(i) * 26 - 13), fy, CARS[(i * 2 + 3) % 7]); }
      for (const xcol of [xo2, xi2]) R(g, xcol - 2, yr, 4, yt - yr, 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.5`);
      R(g, Math.min(xe, xe + sd * 3.6), yr, 3.6, yt - yr, 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.5`);           // a központi mag fala
    }
    // központi mag: két lift, menekülőlépcső, szellőzőakna
    for (const [x, cy] of [[cx - 34, gz(-12)], [cx - 12, gz(-19)]]) { R(g, x - 9, yr, 18, yt - yr, F('steel1', 0.55) + `;stroke:${v('concedge')};stroke-width:.5`); Ln(g, x, yr, x, cy - 16, SK('rope', 0.8)); R(g, x - 7, cy - 16, 14, 16, F('steel2') + `;stroke:${v('dark')};stroke-width:.8`, { rx: 1.5 }); R(g, x - 4.5, cy - 13, 9, 7, 'fill:url(#pr-glass)'); }
    { let d = `M${cx + 3} ${yt}`; for (let y = yt, q = 0; y > yr + 10; y -= 10.8, q++) d += `L${cx + (q % 2 ? 3 : 21)} ${y - 10.8}`; P(g, d, SK('concedge', 1.6, 'stroke-linejoin:round')); }
    R(g, cx + 26, yr - 14, 20, yt - yr + 14, F('air', 0.5) + `;stroke:${v('concedge')};stroke-width:.5`); for (const z of [-20, -13, -6]) arrowV(g, cx + 36, gz(z), gz(z + 4), { c: 'water', w: 1.6, s: 4.5 });
    concP(g, `M${cx - RR} ${yr - 3}H${cx + RR}V${yr + 2}H${cx - RR}Z`);
    // két irodaház az udvar körül, pincével a garázsfödém felett
    for (const sd of [-1, 1]) { const a = sd < 0 ? cx - RR + 6 : cx + 62, w = RR - 68, top = gz(23.7);
      R(g, a, gz(0), w, yr - 3 - gz(0), F('conc2', 0.6) + `;stroke:${v('concedge')};stroke-width:.6`); for (let x = a + 30; x < a + w - 8; x += 32) Ln(g, x, gz(0), x, yr - 3, SK('concedge', 1));
      R(g, a, top, w, gz(0) - top, F('steel1') + `;stroke:${v('steel3')};stroke-width:1.1`);
      for (let z = 4.4; z < 22.5; z += 3.2) for (let x = a + 6; x < a + w - 10; x += 13) R(g, x, gz(z + 2.2), 9, 13, 'fill:url(#pr-glass)' + `;stroke:${v('steel3')};stroke-width:.4`);
      for (let x = a + 6; x < a + w - 16; x += 20) R(g, x, gz(3.5), 15, 3.5 * 8 - 3, 'fill:url(#pr-glass)' + `;stroke:${v('steel3')};stroke-width:.5`);
      R(g, a - 3, top - 4, w + 6, 5, F('steel3')); }
    gvLevels(g, [[23.7, '+23,70', true], [0, '±0,00'], [-28, '−28,0']]);
    dimV(g, cx + RR + 20, gz(0), gz(-28), '28,0 m', { rot: true, dx: 9 });
    tg11(g, cx, gz(8), EN ? 'courtyard' : 'udvar', { anchor: 'middle' });
    tg11(g, cx + 10, gz(-30.6), 'központi mag: liftek, lépcső, szellőzés', { anchor: 'middle', to: [cx - 20, gz(-23.4)] });
    tg11(g, 20, gz(-30.6), 'spirális útpálya', { to: [cx - 138, gz(-21.6)] });
    tg11(g, 628, gz(-30.6), 'parkolóállások', { anchor: 'end', to: [cx + RR - 30, gz(-23)] }); },
};

/* (a kész szekrény külön metszete megszűnt: a sorozat 4. képe) */
/* ================================================================== I) a keszon metszete */
// 1 m ≈ 26 px (a munkakamra kb. 2,4 m magas). Emberek: ízületes figurák (man) szerszámmal.
export function artKeszon(host) {
  const W = 720, H = 540, WL = 158, BED = 282, S = 26;
  const s = mkS(host, W, H, 'Keszon (légnyomásos szekrény) metszete: munkakamra túlnyomásos levegőben, aknacső, személy- és anyagzsilip, kompresszor'), g = g_(s);
  river(g, W, H, WL, BED, [{ k: 'sand', y: WL }, { k: 'gravel', y: 486 }]);
  const x0 = 186, x1 = 534, ce = 452, ch = 62, roof = 26, ry = ce - ch, sx = 296, mx = 430, pt = 126;
  const steel = (d, w = 1) => P(g, d, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:${w};stroke-linejoin:round`);
  // ---- munkakamra: levegő, lámpafény, kitermelés alatt álló talaj
  R(g, x0 + 10, ry, x1 - x0 - 20, ch + 4, F('air')); R(g, x0 + 10, ry, x1 - x0 - 20, ch + 4, F('lamp', 0.14));
  for (const lx of [x0 + 70, (x0 + x1) / 2 + 20, x1 - 60]) { C(g, lx, ry + 9, 26, F('lamp', 0.16)); C(g, lx, ry + 9, 12, F('lamp', 0.3)); Ln(g, lx, ry, lx, ry + 5, SK('dark', 1)); C(g, lx, ry + 8, 3.2, F('lamp') + `;stroke:${v('dark')};stroke-width:.6`); }
  soilP(g, `M${x0 + 4} ${ce + 5} L${x0 + 22} ${ce - 3} Q${x0 + 70} ${ce - 9} ${x0 + 120} ${ce - 2} Q${sx + 60} ${ce + 4} ${mx - 40} ${ce - 4} Q${mx + 30} ${ce - 12} ${x1 - 40} ${ce - 3} L${x1 - 4} ${ce + 5} V${ce + 9} H${x0 + 4}Z`, 'sand');
  // ---- emberek a munkakamrában: csákányozó, talicskázó, lapátoló, a vágóél alól fejtő
  const GY = ce - 1, hd = (x, y) => [x, y];
  { const x = x0 + 62, h0 = hd(x - 0.42 * S, GY - 1.5 * S), h1 = hd(x - 0.2 * S, GY - 1.62 * S);     // csákány
    P(g, `M${x + 0.02 * S} ${GY - 1.76 * S} L${x - 0.86 * S} ${GY - 1.28 * S}`, SK('timber2', 2.4, 'stroke-linecap:round')); P(g, `M${x - 0.98 * S} ${GY - 1.5 * S} Q${x - 0.8 * S} ${GY - 1.22 * S} ${x - 0.66 * S} ${GY - 1.02 * S}`, SK('dark', 2.6, 'stroke-linecap:round'));
    man(g, { x, GY, S, face: -1, lean: 16, squat: 0.2, hands: [h1, h0] }); }
  { const x = sx - 6, bx = x + 1.32 * S;                                                               // talicska
    P(g, `M${x + 0.34 * S} ${GY - 0.74 * S} L${bx - 0.5 * S} ${GY - 0.5 * S}`, SK('timber2', 2.2, 'stroke-linecap:round'));
    P(g, `M${bx - 0.62 * S} ${GY - 0.66 * S} L${bx + 0.3 * S} ${GY - 0.74 * S} L${bx + 0.12 * S} ${GY - 0.3 * S} L${bx - 0.44 * S} ${GY - 0.3 * S}Z`, F('steel2') + `;stroke:${v('dark')};stroke-width:1`);
    P(g, `M${bx - 0.56 * S} ${GY - 0.66 * S} Q${bx - 0.14 * S} ${GY - 0.98 * S} ${bx + 0.26 * S} ${GY - 0.74 * S}Z`, F('sand2') + `;stroke:${v('layer')};stroke-width:.5`);
    Ln(g, bx - 0.42 * S, GY - 0.3 * S, bx - 0.5 * S, GY - 0.02 * S, SK('dark', 1.6)); C(g, bx + 0.18 * S, GY - 0.17 * S, 0.17 * S, F('dark')); C(g, bx + 0.18 * S, GY - 0.17 * S, 0.06 * S, F('steel1'));
    man(g, { x, GY, S, face: 1, lean: 16, squat: 0.1, hands: [hd(x + 0.3 * S, GY - 0.74 * S), hd(x + 0.36 * S, GY - 0.74 * S)] }); }
  // vödör az anyagakna alatt, a kötélen
  Ln(g, mx, ry - 4, mx, GY - 0.92 * S, SK('rope', 1.1)); P(g, `M${mx - 9} ${GY - 0.9 * S} Q${mx} ${GY - 1.2 * S} ${mx + 9} ${GY - 0.9 * S}`, SK('dark', 1.2));
  P(g, `M${mx - 10} ${GY - 0.9 * S} L${mx - 7} ${GY - 0.12 * S} H${mx + 7} L${mx + 10} ${GY - 0.9 * S}Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:1`); P(g, `M${mx - 9} ${GY - 0.88 * S} Q${mx} ${GY - 1.08 * S} ${mx + 9} ${GY - 0.88 * S}Z`, F('sand2'));
  { const x = mx - 1.15 * S, bl = hd(x + 0.9 * S, GY - 0.62 * S);                                      // lapátoló a vödörnél
    P(g, `M${x + 0.12 * S} ${GY - 1.02 * S} L${bl[0]} ${bl[1]}`, SK('timber2', 2.2, 'stroke-linecap:round')); P(g, `M${bl[0] - 2} ${bl[1] - 4} l10 2 l-2 9 l-9 -3Z`, F('steel2') + `;stroke:${v('dark')};stroke-width:.8`); E(g, bl[0] + 4, bl[1] - 3, 5, 3, F('sand2'));
    man(g, { x, GY, S, face: 1, lean: 24, squat: 0.22, hands: [hd(x + 0.22 * S, GY - 0.95 * S), hd(x + 0.6 * S, GY - 0.76 * S)] }); }
  { const x = x1 - 70, bl = hd(x + 0.98 * S, GY - 0.1 * S);                                            // fejtés a vágóél alól
    P(g, `M${x + 0.1 * S} ${GY - 0.98 * S} L${bl[0]} ${bl[1]}`, SK('timber2', 2.2, 'stroke-linecap:round')); P(g, `M${bl[0] - 3} ${bl[1] - 5} l9 4 l-4 8 l-8 -5Z`, F('steel2') + `;stroke:${v('dark')};stroke-width:.8`);
    man(g, { x, GY, S, face: 1, lean: 34, squat: 0.4, hands: [hd(x + 0.24 * S, GY - 0.86 * S), hd(x + 0.62 * S, GY - 0.48 * S)] }); }
  // ---- a keszon vasbeton teste acél vágóéllel, a födém alatt acélgerendákkal
  concP(g, `M${x0} ${ry - roof}H${x1}V${ce}h-7L${x1 - 24} ${ry + 8}V${ry}H${x0 + 24}v8L${x0 + 7} ${ce}H${x0}Z`, { w: 1.4 });
  for (const k of [-1, 1]) { const xe = k < 0 ? x0 : x1; steel(`M${xe} ${ce - 26}V${ce + 5}h${-k * 5}L${xe - k * 9} ${ce - 26}Z`.replace(/h--/g, 'h'), 0.9); for (let q = 0; q < 3; q++) C(g, xe - k * 3.5, ce - 20 + q * 8, 0.9, F('dark')); }
  for (let x = x0 + 44; x < x1 - 30; x += 34) { R(g, x - 5, ry, 10, 2.2, F('steel3')); R(g, x - 1.2, ry + 2, 2.4, 5, F('steel3')); R(g, x - 4, ry + 7, 8, 2, F('steel3')); }
  // ---- pillértest: kőburkolat sorokkal, felül munkaállvány
  const bat = 30, ptop = pt, pb = ry - roof;
  P(g, `M${x0 + bat} ${ptop}H${x1 - bat}L${x1} ${pb}H${x0}Z`, F('stone') + `;stroke:${v('stone2')};stroke-width:1.3`);
  for (let yy = ptop + 15, r = 0; yy < pb; yy += 15, r++) { const e = bat * (1 - (yy - ptop) / (pb - ptop)); Ln(g, x0 + e, yy, x1 - e, yy, SK('stone2', 0.8)); for (let xx = x0 + 34 + (r % 2) * 22; xx < x1 - 20; xx += 44) Ln(g, xx, yy - 15, xx, yy, SK('stone2', 0.7)); }
  P(g, `M${x0 + bat} ${ptop}L${x0} ${pb}h14L${x0 + bat + 12} ${ptop}Z`, F('halo', 0.18)); P(g, `M${x1 - bat} ${ptop}L${x1} ${pb}h-16L${x1 - bat - 14} ${ptop}Z`, F('dark', 0.12));
  R(g, 0, WL, W, 4, F('water', 0.35)); // a vízfelszín a pillér előtt
  R(g, x0 + bat - 16, ptop - 5, x1 - x0 - 2 * bat + 32, 5, F('timber') + `;stroke:${v('timber2')};stroke-width:.8`);
  for (let x = x0 + bat - 14; x <= x1 - bat + 14; x += 30) Ln(g, x, ptop - 5, x, ptop - 26, SK('steel3', 1.4)); for (const dy of [14, 26]) Ln(g, x0 + bat - 14, ptop - dy, x1 - bat + 16, ptop - dy, SK('steel3', 1.2));
  // ---- aknacsövek (metszetben), személyzsilip létrával, anyagzsilip vödörrel
  const shaft = (x, w, top) => { R(g, x - w / 2 - 3, top, w + 6, ry - top + 2, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.9`); R(g, x - w / 2, top, w, ry - top + 6, F('air')); R(g, x - w / 2, top, w, ry - top + 6, F('dark', 0.1)); for (let yy = top + 40; yy < ry - 10; yy += 48) R(g, x - w / 2 - 5, yy, w + 10, 3.4, F('steel3'), { rx: 1 }); };
  shaft(sx, 24, 78); shaft(mx, 22, 78);
  for (const k of [-1, 1]) Ln(g, sx + k * 6, 84, sx + k * 6, ry + 4, SK('steel3', 1.3)); for (let yy = 92; yy < ry + 2; yy += 8) Ln(g, sx - 6, yy, sx + 6, yy, SK('steel3', 1.1));
  man(g, { x: sx + 1, GY: 300, S: 20, face: -1, lean: 4, squat: 0.3, hands: [hd(sx - 5, 262), hd(sx - 5, 254)], feet: [sx - 3, sx + 1] });
  Ln(g, mx, 70, mx, 232, SK('rope', 1.1)); P(g, `M${mx - 8} 232 L${mx - 6} 250 H${mx + 6} L${mx + 8} 232Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.9`); P(g, `M${mx - 7} 233 Q${mx} 225 ${mx + 7} 233Z`, F('sand2'));
  const lock = (x, y, w, h, col) => { R(g, x - w / 2, y, w, h, F(col) + `;stroke:${v('dark')};stroke-width:1.2`, { rx: h / 2.6 }); R(g, x - w / 2 + 8, y + 5, w - 16, 4, F('halo', 0.3), { rx: 2 }); for (const dx of [-w / 2 + 5, w / 2 - 5]) R(g, x + dx - 1.6, y + 3, 3.2, h - 6, F('dark', 0.35));
    R(g, x - 9, y + h - 2, 18, 8, F('steel3')); R(g, x + w / 2 - 22, y + 9, 12, h - 16, F('dark2') + `;stroke:${v('dark')};stroke-width:.8`, { rx: 3 }); C(g, x - w / 2 + 18, y + h / 2, 6, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:1`);
    C(g, x, y - 5, 5.5, F('halo') + `;stroke:${v('dark')};stroke-width:1`); Ln(g, x, y - 5, x + 3, y - 8, SK('acc', 1.2)); Ln(g, x, y, x, y - 1, SK('dark', 2)); };
  lock(sx, 34, 84, 44, 'crane'); lock(mx, 38, 76, 40, 'steel2');
  worker(g, x1 - bat - 30, { GY: ptop - 5, dir: -1, pose: 'guide' }); worker(g, x0 + bat + 14, { GY: ptop - 5, dir: 1 });
  // ---- kompresszortelep uszályon: kompresszor, légtartály, légvezeték a munkakamráig
  P(g, `M556 ${WL + 9}h156l-10 -24h-136Z`, F('dark2') + `;stroke:${v('dark')};stroke-width:1`); Ln(g, 560, WL - 15, 706, WL - 15, SK('steel3', 1.4));
  R(g, 574, WL - 58, 70, 43, F('cont') + `;stroke:${v('cont3')};stroke-width:1`, { rx: 4 }); for (let xx = 582; xx < 622; xx += 7) Ln(g, xx, WL - 51, xx, WL - 24, SK('cont3', 0.9)); C(g, 630, WL - 37, 9, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:1`); C(g, 630, WL - 37, 3, F('dark')); R(g, 586, WL - 68, 9, 11, F('dark2')); for (let q = 0; q < 3; q++) C(g, 590 + q * 5, WL - 76 - q * 9, 4 + q * 2, F('cloud', 0.55 - q * 0.13));
  R(g, 660, WL - 74, 26, 59, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:1`, { rx: 12 }); C(g, 673, WL - 80, 5, F('halo') + `;stroke:${v('dark')};stroke-width:.9`); Ln(g, 673, WL - 80, 676, WL - 83, SK('acc', 1.1)); Ln(g, 644, WL - 30, 660, WL - 30, SK('acc2', 3.4));
  const pd = `M673 ${WL - 74}V${pt - 44}H${mx + 26}V${ry - roof - 2}`; P(g, pd, SK('dark', 6.4, 'stroke-linejoin:round')); P(g, pd, SK('acc2', 3.8, 'stroke-linejoin:round'));
  for (const yy of [200, 300]) head(g, mx + 26, yy, 90, { c: 'halo', s: 5 });
  // uszály a kiemelt földdel
  P(g, `M14 ${WL + 9}h120l-8 -20h-104Z`, F('dark2') + `;stroke:${v('dark')};stroke-width:1`); P(g, `M30 ${WL - 11}q44 -30 90 0Z`, F('sand2') + `;stroke:${v('layer')};stroke-width:.6`);
  // ---- a túlnyomásos levegő kiszorítja a vizet: nyilak és buborékok a vágóél alól
  for (const [x, k] of [[x0 - 6, -1], [x1 + 6, 1]]) { arrowH(g, x, x + k * 30, ce - 2, { c: 'water', w: 2.6, s: 6.5 }); for (let i = 0; i < 6; i++) C(g, x + k * (8 + (i % 3) * 7), ce - 18 - i * 22, 2 + (i % 3), SK('water', 1) + ';fill:' + v('air')); }
  dimV(g, 92, WL, ce, '', {}); el('text', { x: 72, y: (WL + ce) / 2 + 4, class: 'pr-tx pr-big', 'text-anchor': 'middle', text: 'h' }, g); el('text', { x: 78, y: (WL + ce) / 2 + 8, class: 'pr-tx', style: 'font-size:10px;font-weight:800', text: 'v' }, g);
  lab(g, 8, WL + 30, 'vízszint', { to: [150, WL + 1] }); lab(g, W - 8, BED + 22, 'mederfenék', { anchor: 'end' });
  lab(g, 120, 22, 'személyzsilip', { to: [sx - 40, 50] }); lab(g, 512, 22, 'anyagzsilip', { to: [mx + 36, 50] });
  lab(g, 610, WL - 100, 'kompresszor', { anchor: 'middle' }); lab(g, 700, WL + 36, EN ? 'air receiver' : 'légtartály', { anchor: 'end', to: [676, WL - 30] }); lab(g, mx + 44, 196, 'légvezeték', { to: [mx + 28, 216] });
  lab(g, 126, 212, 'aknacső', { to: [sx - 15, 222] }); lab(g, 556, 330, 'pillértest', { to: [x1 - 30, 330] });
  lab(g, 556, 396, 'munkakamra (túlnyomás)', { to: [x1 - 96, ry + 24] }); lab(g, 556, 470, 'vágóél', { to: [x1 - 2, ce + 2] });
  lab(g, 20, 100, 'munkaállvány', { to: [x0 + bat - 6, ptop - 14] });
}

/* ================================================================== J) Kútsüllyesztő – a widget jelenete (bal oldal, 0–330 px) */
const symT = (g, x, y, a, b, col) => { const t = el('text', { x, y, class: 'pr-tx', style: `font-size:14px;font-weight:800;fill:${col};paint-order:stroke;stroke:var(--pr-labbg);stroke-width:3px` }, g); t.innerHTML = b ? `${a}<tspan dy="0.3em" font-size="72%">${b}</tspan>` : a; return t; };
export function artSully(fig, q) {
  // q: { soil, L, tv, r, w, ye, yt, Y0, KP, cx, under, lub: null | 'bento' | 'kavics', vall, done, bob, B, H }
  fig.classList.add('pr-svg'); defs(); CUR.W = 640;
  const SW = 330, { Y0, KP, cx, r, w, ye, yt, H } = q, y = (z) => Y0 + z * KP;
  const id = 'ksc', d0 = el('defs', {}, fig); el('rect', { x: 0, y: 0, width: SW, height: H }, el('clipPath', { id }, d0));
  const g = g_(fig, { 'clip-path': `url(#${id})` });
  const bear = q.soil === 'gravel' ? 'hard' : 'gravel';
  backdrop(g, { H, GY: Y0, gw: q.tv ? y(1.5) : 0, layers: [{ k: q.soil, y: Y0 }, { k: bear, y: y(q.L) }] }, 0, SW);
  const yin = q.under ? ye + 5 : ye - 6, ri = r - w;
  // a kút belseje: kiemelt tér, benne talajvíz
  R(g, cx - ri, yt, 2 * ri, Math.max(0, yin - yt), F('bore'));
  if (q.under) P(g, `M${cx - r} ${ye} Q${cx} ${ye + 14} ${cx + r} ${ye} L${cx + ri} ${ye - 4} H${cx - ri}Z`, F('bore'));
  if (q.tv && yin > y(1.5)) waterBody(g, cx - ri, Math.max(y(1.5), yt), 2 * ri, yin - Math.max(y(1.5), yt), { op: 0.42, n: 1 });
  if (!q.under) for (const s of [-1, 1]) soilP(g, `M${cx + s * ri} ${ye}L${cx + s * (ri - 14)} ${yin}L${cx + s * ri} ${yin}Z`, q.soil);
  // súrlódáscsökkentés a köpeny mentén
  const emb = Math.max(0, ye - Y0);
  if (q.lub && emb > 0) { const bot = q.vall ? Math.max(Y0, ye - KP) : ye; for (const s of [-1, 1]) { const x = s < 0 ? cx - r - 5 : cx + r; if (q.lub === 'bento') { R(g, x, Y0, 5, bot - Y0, 'fill:url(#pr-slurryg)'); } else { R(g, x, Y0, 5, bot - Y0, F('pebble')); for (let yy = Y0 + 4; yy < bot - 2; yy += 6) C(g, x + 2.5, yy, 2.2, F('gravel') + `;stroke:${v('layer')};stroke-width:.5`); } } }
  // köpenyfal vágóéllel, opcionális vállkiugrással
  for (const s of [-1, 1]) { const xo = cx + s * r, xi = cx + s * ri, sh = q.vall ? 4 : 0, eh = Math.min(18, w * 1.6);
    concP(g, `M${xi} ${yt}L${xo} ${yt}L${xo} ${ye - (q.vall ? KP + 3 : 0)}L${xo + s * sh} ${ye - (q.vall ? KP : 0)}L${xo + s * sh} ${ye}L${xi} ${ye - eh}Z`);
    P(g, `M${xo + s * sh} ${ye}l${-s * 4} -5`, SK('steel3', 2.4, 'stroke-linecap:round')); }
  if (q.done) { concP(g, `M${cx - ri} ${ye - 0.6 * KP}h${2 * ri}v${0.6 * KP + 4}h${-2 * ri}Z`, { fresh: true }); lab(g, cx, ye - 0.6 * KP - 12, 'zárófenék', { anchor: 'middle', fs: 11 }); }
  // forgó kotró a markolóedénnyel, kiemelt föld
  let hook = 60;
  if (!q.done) { const gb = yin - q.bob * 26, gr = clam(g, cx, gb, Math.max(6, ri / 1.5), 0.15 + q.bob * 0.7, { full: q.bob < 0.25, soil: q.soil }); hook = gr.top; }
  crane(g, { GY: Y0 }, cx, hook, { reach: 112, tipY: 12 });
  spoil(g, { GY: Y0 }, 6, 44, 6 + Math.min(12, emb / 12), q.soil);
  // erők
  arrowV(g, cx, yt + 16, yt + 60, { c: 'ok', w: 3.4, s: 8 }); symT(g, cx + 8, yt + 36, 'G' + (q.B > 0 ? ' + G' : ''), q.B > 0 ? 'b' : '', v('ok'));
  if (emb > 12) { const ya = Math.min(ye - 6, Y0 + emb * 0.75); for (const s of [-1, 1]) arrowV(g, cx + s * (r + 13), ya, ya - 24, { c: 'push', w: 2.2, s: 6 }); symT(g, cx + r + 21, ya - 6, 'S', '', v('push')); }
  for (const s of [-1, 1]) arrowV(g, cx + s * (r - w / 2), ye + 26, ye + 5, { c: 'push', w: 2.4, s: 6.5 });
  symT(g, cx + r + 6, ye + 24, 'R', 'v', v('push'));
  if (q.tv) lab(g, 6, y(1.5) - 10, EN ? 'GWT' : 'TV', { fs: 11 });
  lab(g, 6, y(q.L) + 14, 'teherbíró réteg', { fs: 11 });
  // mélységskála
  for (let k = 0; k <= 9; k++) { Ln(g, SW - 26, y(k), SW - 18, y(k), SK('labline', 1)); if (k % 2 === 0) el('text', { x: SW - 30, y: y(k) + 4, class: 'pr-tx', 'text-anchor': 'end', style: 'font-size:11px;paint-order:stroke;stroke:var(--pr-labbg);stroke-width:3px', text: k + ' m' }, g); }
}

/* ================================================================== K) acél köpenycsöves kútalap – négy lépés */
// Egyetlen, toldás nélküli acél köpenycső (kb. 4,5 m): levibrálják a teherbíró rétegig, kimarkolják, majd betonozás közben visszahúzzák.
function oneCasing(g, cx, top, bot, r) {
  casing(g, cx, top, bot, r, { joints: false, inner: false });
  for (const k of [-1, 1]) { R(g, k < 0 ? cx - r - 5.2 : cx + r - 0.4, top, 5.6, 7, F('steel3'), { rx: 1 }); R(g, k < 0 ? cx - r - 4.6 : cx + r, bot - 6, 4.6, 6, F('dark2')); }
}
export function artAcel(fig, steps, L) {
  fig.classList.add('pr-svg'); defs(); const W = 760, H = 400, pw = W / 4, GY = 176, KP = 36, r = 28, CL = 4.6 * KP; CUR.W = W;
  const y = (z) => GY + z * KP, yB = y(4.3);
  const M = { H, GY, layers: [{ k: 'sand', y: GY }, { k: 'gravel', y: y(4) }] };
  steps.forEach((t, i) => {
    const cid = 'kac' + i; el('rect', { x: 0, y: 0, width: pw, height: H }, el('clipPath', { id: cid }, el('defs', {}, fig)));
    const g = g_(g_(fig, { transform: `translate(${i * pw} 0)` }), { 'clip-path': `url(#${cid})` }); CUR.W = pw;
    backdrop(g, M, i * pw + 40, pw);
    if (i === 0) { // levibrálás: a cső még félúton, benne a talaj
      const cx = 100, bot = y(2.2), top = bot - CL;
      bore(g, cx - r, top, 2 * r, GY - top);
      oneCasing(g, cx, top, bot, r);
      const vb = vibroUnit(g, cx, top + 9, 0.6, { w: 56, hb: 30, half: r });
      Ln(g, cx, 34, cx, vb.top, SK('rope', 1.8)); P(g, `M${cx - 6} ${vb.top}L${cx} ${vb.top - 9}L${cx + 6} ${vb.top}`, SK('rope', 1.4));
      R(g, 150, GY - 18, 30, 18, F('cont') + `;stroke:${v('cont3')};stroke-width:.9`, { rx: 2 }); for (let xx = 155; xx < 176; xx += 5) Ln(g, xx, GY - 14, xx, GY - 5, SK('cont3', 0.8));
      hoseTo(g, cx + 28, vb.mid, 152, GY - 12, 26);
      for (const k of [-1, 1]) for (let q = 0; q < 3; q++) P(g, `M${cx + k * (r + 10 + q * 7)} ${GY + 8 + q * 9} q${k * 5} 7 0 14`, SK('acc', 1.4, 'stroke-linecap:round'));
      arrowV(g, cx - r - 18, GY - 64, GY - 22, { c: 'ok', w: 2.6, s: 7 });
      lab(g, 4, vb.mid - 36, L.vib, { to: [cx - 30, vb.mid - 4], fs: 11 }); lab(g, 4, y(2.9), L.cas, { to: [cx - r - 2, y(1.8)], fs: 11 });
      worker(g, 26, { GY, dir: 1, pose: 'guide' });
    } else if (i === 1) { // a cső a teherbíró rétegen áll; markolás kotróra szerelt, teleszkópos szárú markolóedénnyel
      const cx = 58, top = yB - CL, dig = y(3.3);
      bore(g, cx - r, top, 2 * r, dig - top); soilR(g, cx - r, dig, 2 * r, yB - dig, 'sand'); P(g, `M${cx - r} ${dig + 1} Q${cx} ${dig - 9} ${cx + r} ${dig + 1}Z`, F('sand2'));
      oneCasing(g, cx, top, yB, r);
      const gr = clam(g, cx, dig - 1, 17, 0.8, { hang: 'stick', soil: 'sand' });
      const tipY = GY - 92; excavator(g, M, cx, tipY, { tool: 'mount', reach: 62, lift: 30 });
      R(g, cx - 4.2, tipY, 8.4, (gr.top - tipY) * 0.56, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.8`); R(g, cx - 2.6, tipY + (gr.top - tipY) * 0.5, 5.2, (gr.top - tipY) * 0.5, F('steel2') + `;stroke:${v('dark')};stroke-width:.7`);
      spoil(g, M, 2, 26, 10, 'sand');
      lab(g, cx + r + 12, y(2.4), L.grab, { to: [cx + 12, dig - 24], fs: 11 });
    } else if (i === 2) { // betonozás: a betonozócső vége a friss betonban, a csövet közben visszahúzzák
      const cx = 118, bot = y(2.6), top = bot - CL, lv = y(1.5), hp = 66, pe = y(3.5);
      bore(g, cx - r, top, 2 * r, lv - top);
      concrete(g, cx - r - 4, bot, 2 * r + 8, yB - bot, true); concrete(g, cx - r, lv, 2 * r, bot - lv + 1, true);
      oneCasing(g, cx, top, bot, r);
      tremie(g, cx, hp, pe, { full: true });
      R(g, cx - 1.7, hp + 16, 3.4, pe - hp - 18, F('fresh1')); // beton a csőben
      for (const k of [-1, 1]) { arrowP(g, `M${cx + k * 5} ${pe + 4} q${k * 12} 6 ${k * 13} -16`, { c: 'halo', w: 2 }); head(g, cx + k * 18, pe - 14, -90, { c: 'halo', s: 5.5 }); }
      Ln(g, cx - r + 3, lv + 0.5, cx + r - 3, lv + 0.5, SK('concedge', 1.2));
      // betonozókonténer (kübli) a tölcsér felett
      const ky = hp - 22; Ln(g, cx, 0, cx, ky - 9, SK('rope', 1.4)); skip(g, cx, ky - 9); R(g, cx - 1.6, ky + 11, 3.2, hp - ky - 8, F('fresh1'));
      for (const k of [-1, 1]) arrowV(g, cx + k * (r + 18), GY - 16, GY - 60, { c: 'ok', w: 2.8, s: 7.5 });
      lab(g, 4, GY - 76, L.pull, { to: [cx - r - 18, GY - 40], fs: 11 }); lab(g, 4, y(1.0), L.trem, { to: [cx - 4, y(0.9)], fs: 11 }); lab(g, 4, y(3.2), L.fresh, { to: [cx - 14, y(3.0)], fs: 11 });
    } else { // kész kút: a terepszintig kibetonozva, rajta a gerendarács és a pillér
      const cx = 78;
      concrete(g, cx - r - 4, GY + 14, 2 * r + 8, yB - GY - 14, false);
      concP(g, `M4 ${GY - 10}H${pw - 4}V${GY + 14}H4Z`); concP(g, `M${cx - 14} 54h28V${GY - 10}h-28Z`);
      lab(g, cx + 30, 84, L.pier, { to: [cx + 13, 96], fs: 11 }); lab(g, pw - 6, GY + 34, L.beam, { anchor: 'end', to: [pw - 34, GY + 4], fs: 11 }); lab(g, cx + r + 14, y(2.6), L.well, { to: [cx + 12, y(2.6)], fs: 11 });
    }
    if (i) Ln(g, 0.5, 0, 0.5, H, SK('halo', 1.4, 'opacity:.8'));
    C(g, 18, 20, 12, F('ok') + `;stroke:${v('halo')};stroke-width:1.6`); el('text', { x: 18, y: 25, class: 'pr-num', 'text-anchor': 'middle', text: String(i + 1) }, g);
    el('text', { x: 36, y: 25, class: 'pr-tx', style: 'font-size:12px;font-weight:800;paint-order:stroke;stroke:var(--pr-labbg);stroke-width:3.5px', text: t }, g);
  });
}

/* ================================================================== L) három szekrény, három trükk */
export function artTipus(g, i, pw, H, L) {
  defs(); CUR.W = pw; const WY = 78, BY = 168, cx = pw / 2;
  river(g, pw, H, WY, BY, [{ k: 'sand', y: WY }, { k: 'gravel', y: H - 34 }], i * pw + 30);
  if (i === 0) { // úsztatott szekrény: fent úszva (vontatóhajóval), lent vízballaszttal a mederfenéken
    const fb = (x, y, op, wl) => { const b = g_(g, { opacity: op }); if (wl) { R(b, x - 40, wl, 80, y - 8 - wl, F('glass1')); R(b, x - 40, wl, 80, y - 8 - wl, F('water', 0.6)); } concP(b, `M${x - 50} ${y - 56}V${y}H${x + 50}V${y - 56}h-10V${y - 9}H${x - 40}V${y - 56}Z`); };
    fb(cx - 8, WY + 16, 0.6, 0); P(g, `M${cx + 50} ${WY - 3}h38l-6 9h-28Z`, F('dark2')); R(g, cx + 58, WY - 12, 14, 9, F('crane')); Ln(g, cx + 42, WY - 2, cx + 52, WY, SK('rope', 1.2));
    arrowV(g, cx + 66, WY + 22, BY - 8, { c: 'labline', w: 2.2, s: 7 });
    fb(cx - 8, BY, 1, BY - 44);
    P(g, `M${cx + 56} ${WY - 6} q-10 ${BY - WY - 60} -34 ${BY - WY - 44}`, SK('dark', 4.4, 'stroke-linecap:round')); P(g, `M${cx + 56} ${WY - 6} q-10 ${BY - WY - 60} -34 ${BY - WY - 44}`, SK('water', 2.4, 'stroke-linecap:round')); for (let q = 0; q < 3; q++) C(g, cx + 20 - q * 3, BY - 46 + q * 6, 1.6, F('water'));
    lab(g, cx - 8, BY - 24, L[0], { anchor: 'middle', fs: 11 }); lab(g, cx, BY + 26, L[1], { anchor: 'middle', fs: 11 });
  } else if (i === 1) {
    const ye = BY + 96, top = WY - 22, x0 = cx - 72, x1 = cx + 72;
    R(g, x0, top, x1 - x0, ye - 14 - top, F('bore')); waterBody(g, x0, WY, x1 - x0, ye - 14 - WY, { op: 0.48, n: 1 });
    P(g, `M${x0 - 6} ${ye - 6} Q${cx} ${ye + 10} ${x1 + 6} ${ye - 6} L${x1} ${ye - 20} H${x0}Z`, F('water', 0.5));
    boxWall(g, x0, -1, top, ye, 9, { ex: 6, eh: 30 }); boxWall(g, x1, 1, top, ye, 9, { ex: 6, eh: 30 });
    for (const x of [cx - 24, cx + 24]) concP(g, `M${x - 4} ${top}h8V${ye - 44}L${x} ${ye - 34}L${x - 4} ${ye - 44}Z`);
    for (const yy of [WY + 22, BY + 14]) Ln(g, x0 - 16, yy, x1 + 16, yy, SK('acc', 1.2, 'stroke-dasharray:6 4'));
    dimV(g, x1 + 24, WY + 22, BY + 14, '6–8 m', { dx: -8, rot: true });
    for (const [x, yy, op, full] of [[cx - 48, ye - 6, 0.8, 0], [cx + 48, BY + 26, 0.05, 1]]) { const gr = clam(g, x, yy, 15.5, op, { full, soil: 'sand' }); Ln(g, x, 36, x, gr.top, SK('rope', 1.3)); }
    P(g, `M4 ${WY + 6}h34l-4 -11h-26Z`, F('dark2') + `;stroke:${v('dark')};stroke-width:.8`); P(g, `M9 ${WY - 5}q11 -9 22 0Z`, F('sand2') + `;stroke:${v('layer')};stroke-width:.5`);
    lab(g, cx, H - 12, L[2], { anchor: 'middle', fs: 11 });
  } else {
    const ye = BY + 72, top = WY - 2, ch = 30, x0 = cx - 62, x1 = cx + 62;
    R(g, x0 + 8, ye - ch, x1 - x0 - 16, ch + 1, F('air')); R(g, x0 + 8, ye - ch, x1 - x0 - 16, ch + 1, F('lamp', 0.12));
    concP(g, `M${x0} ${top}H${x1}V${ye}h-4L${x1 - 12} ${ye - ch + 4}V${ye - ch}H${x0 + 12}v4L${x0 + 4} ${ye}H${x0}Z`);
    for (let yy = top + 14, q = 0; yy < ye - ch - 6; yy += 14, q++) { Ln(g, x0, yy, x1, yy, SK('concedge', 0.7, 'opacity:.5')); for (let xx = x0 + 18 + (q % 2) * 16; xx < x1 - 8; xx += 32) Ln(g, xx, yy - 14, xx, yy, SK('concedge', 0.6, 'opacity:.45')); }
    // két aknacső két zsilippel: személyzsilip (létrával) és anyagzsilip (vödörrel)
    for (const [k, col] of [[-1, 'crane'], [1, 'steel2']]) { const x = cx + k * 24;
      R(g, x - 5.5, top - 8, 11, ye - ch - top + 8, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.9`); for (let yy = top + 24; yy < ye - ch - 8; yy += 34) R(g, x - 7, yy, 14, 2.4, F('steel3'), { rx: 1 });
      R(g, x - 19, top - 23, 38, 16, F(col) + `;stroke:${v('dark')};stroke-width:1`, { rx: 6 }); R(g, x - 13, top - 20.5, 26, 2.4, F('halo', 0.3), { rx: 1.2 }); C(g, x - 10, top - 14, 3.2, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:.7`); R(g, x + 6, top - 19, 7, 9, F('dark2'), { rx: 2 }); }
    Ln(g, cx + 24, ye - ch, cx + 24, ye - 13, SK('rope', 0.9)); P(g, `M${cx + 19} ${ye - 13}l1.6 9h6.8l1.6 -9Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.7`);
    { const S2 = 13, GYm = ye - 1; let x = cx - 34; P(g, `M${x + 0.1 * S2} ${GYm - 1.0 * S2}L${x + 0.95 * S2} ${GYm - 0.1 * S2}`, SK('timber2', 1.6, 'stroke-linecap:round')); man(g, { x, GY: GYm, S: S2, face: 1, lean: 30, squat: 0.3, hands: [[x + 0.24 * S2, GYm - 0.86 * S2], [x + 0.6 * S2, GYm - 0.5 * S2]] });
      x = cx + 46; P(g, `M${x + 0.02 * S2} ${GYm - 1.76 * S2}L${x - 0.86 * S2} ${GYm - 1.28 * S2}`, SK('timber2', 1.6, 'stroke-linecap:round')); man(g, { x, GY: GYm, S: S2, face: -1, lean: 16, squat: 0.2, hands: [[x - 0.2 * S2, GYm - 1.62 * S2], [x - 0.42 * S2, GYm - 1.5 * S2]] }); }
    for (const [x, k] of [[x0 - 3, -1], [x1 + 3, 1]]) for (let q = 0; q < 3; q++) C(g, x + k * (5 + q * 4), ye - 12 - q * 12, 1.8 + (q % 2), SK('water', 0.9) + ';fill:' + v('air'));
    lab(g, cx - 4, top - 33, L[3], { anchor: 'end', fs: 10 }); lab(g, cx + 4, top - 33, L[5], { fs: 10 }); lab(g, cx, H - 12, L[4], { anchor: 'middle', fs: 11 });
  }
}
