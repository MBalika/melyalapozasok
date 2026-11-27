// C08 – Kút, szekrény, keszon: részletes ábrák a folyamatábrák elemtárából (proc.js KIT).
// A feliratok itt állnak; az ékezet nélküli egyszavas feliratok EN ? … : … alakban (a fordító különben kódnak sorolná).
import { KIT } from './proc.js';
const { defs, v, F, SK, g_, R, P, C, E, Ln, el, hash, backdrop, tag, arrowP, head, arrowV, arrowH, worker, crane, mixer, excavator, concrete, casing, water, tremie, grabR, tipper, pbBig, silo, spoil, vibroUnit, carSide, hoseTo, CUR, EN, SOIL } = KIT;

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
function lvl(g, x, y, t, o = {}) { // szintjel
  P(g, `M${x - 6} ${y - 9}h12l-6 9Z`, F('labline')); Ln(g, x - 12, y, x + (o.len ?? 30), y, SK('labline', 1.1));
  el('text', { x: x + 12, y: y - 4, class: 'pr-tx', style: 'font-size:11.5px;font-weight:700;paint-order:stroke;stroke:var(--pr-labbg);stroke-width:3px', text: t }, g);
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
  const gr = grabR(g, cx, bot - 6, 24, 0.55, 0, 'clay');
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
const topGrab = (g, x, y, r = 11) => { C(g, x, y, r * 0.42, F('dark2')); for (const k of [-1, 1]) P(g, `M${x} ${y} l${k * r} ${r * 0.9} q${-k * r * 0.5} ${r * 0.9} ${-k * r} ${r * 0.2}Z`, 'fill:url(#pr-cyl)' + `;stroke:${v('steel3')};stroke-width:.8`); C(g, x, y, 2.2, F('steel1')); };
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
  const x0 = 104, x1 = 312, t = 16, top = 52, yb = 386;
  R(sc, x0, top, x1 - x0, yb - 20 - top, F('bore')); waterBody(sc, x0, WL, x1 - x0, yb - 20 - WL, { op: 0.5, n: 1 });
  P(sc, `M${x0 - 4} ${yb - 8} Q${(x0 + x1) / 2} ${yb + 14} ${x1 + 4} ${yb - 8} L${x1} ${yb - 30} H${x0}Z`, F('water', 0.5));
  boxWall(sc, x0, -1, top, yb, t); boxWall(sc, x1, 1, top, yb, t);
  for (const x of [173, 243]) concP(sc, `M${x - 7} ${top}h14V${yb - 70}L${x} ${yb - 52}L${x - 7} ${yb - 70}Z`);
  for (const y of [158, 262]) Ln(sc, x0 - 30, y, x1 + 30, y, SK('acc', 1.3, 'stroke-dasharray:7 4'));
  for (const [x, yy, op] of [[138, yb - 20, 0.6], [278, yb - 34, 0.25]]) { const gr = grabR(sc, x, yy, 18, op, op < 0.3 ? 1 : 0, 'sand'); Ln(sc, x, 6, x, gr.top, SK('rope', 1.4)); }
  // úszódaru és uszály a kotort anyaggal
  P(sc, `M4 ${WL + 7} h70 l-6 -15 h-58Z`, F('dark2') + `;stroke:${v('dark')};stroke-width:1`); P(sc, `M14 ${WL - 8} q22 -16 46 0Z`, F('sand2') + `;stroke:${v('layer')};stroke-width:.6`);
  for (const [y, n] of [[110, '3.'], [212, '2.'], [320, EN ? 'stage 1' : '1. ütem']]) big(sc, x1 + 34, y, n, { anchor: 'start' });
  dimV(sc, 44, 158, 262, '6–8 m');
  lab(sc, 8, H - 14, 'vágóél körben', { to: [x0 - t - 6, yb - 6] }); lab(sc, 330, H - 14, 'rekeszfal', { to: [243, 300] });
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

/* ================================================================== G) a genfi szekrény három üteme */
const GF = { W: 240, H: 470, Y0: 150, k: 10.6, x0: 92, x1: 196 };
const gy = (z) => GF.Y0 - z * GF.k;
function gBase(s, pit) {
  const g = prep(s, GF.W);
  backdrop(g, { H: GF.H, GY: gy(0), gw: gy(-3.8), layers: [{ k: 'gravel', y: gy(0) }, { k: 'sand', y: gy(-3) }, { k: 'silt', y: gy(-9) }, { k: 'clay', y: gy(-22) }, { k: 'hard', y: gy(-28) }] }, 30, GF.W);
  if (pit) { P(g, `M${GF.x0 - 44} ${gy(0) - 1}L${GF.x0 - 10} ${gy(-3.5)}H${GF.x1 + 10}L${GF.x1 + 44} ${gy(0) - 1}Z`, 'fill:url(#pr-sky)'); P(g, `M${GF.x0 - 44} ${gy(0)}L${GF.x0 - 10} ${gy(-3.5)}H${GF.x1 + 10}L${GF.x1 + 44} ${gy(0)}`, SK('ground', 1.2)); }
  return g;
}
function gBox(g, zt, zb, floors, lubTo, lub = 'slurry') {
  const { x0, x1 } = GF, t = 9, yt = gy(zt), yb = gy(zb);
  if (lubTo != null) for (const x of [x0 - t - 6, x1 + t]) { const y0 = Math.max(yt, gy(0)); R(g, x, y0, 6, gy(lubTo) - y0, lub === 'slurry' ? 'fill:url(#pr-slurryg)' : F('grout1')); R(g, x, y0, 6, gy(lubTo) - y0, SK('layer', 0.6)); }
  bore(g, x0, yt, x1 - x0, yb - yt - 22);
  for (let i = 1; i <= floors; i++) { const y = yt + (yb - yt - 26) * i / (floors + 1); R(g, x0, y - 2.2, x1 - x0, 4.4, 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.6`); }
  boxWall(g, x0, -1, yt, yb, t, { ex: 6, eh: 26 }); boxWall(g, x1, 1, yt, yb, t, { ex: 6, eh: 26 });
  concP(g, `M${x0 - t} ${yt - 5}H${x1 + t}V${yt + 2}H${x0 - t}Z`);
}
const miniExc = (g, x, y) => { R(g, x - 14, y - 5, 28, 5, F('dark'), { rx: 2.5 }); R(g, x - 10, y - 14, 17, 9, F('exc') + `;stroke:${v('exc3')};stroke-width:.7`, { rx: 2 }); R(g, x - 8, y - 12.5, 6, 5, 'fill:url(#pr-glass)'); P(g, `M${x + 5} ${y - 10} L${x + 17} ${y - 19} L${x + 23} ${y - 6}`, SK('exc2', 2.6, 'stroke-linejoin:round;stroke-linecap:round')); P(g, `M${x + 20} ${y - 7} l6 1 l-2 6 l-5 -2Z`, F('dark2')); };
export const artGenf = {
  u1: (s) => { const g = gBase(s); gBox(g, 3, -10, 3, -8);
    miniExc(g, GF.x0 + 44, gy(-10) - 22); P(g, `M${GF.x0 + 6} ${gy(-10) - 22} q22 -9 44 0Z`, F('silt') + `;stroke:${v('layer')};stroke-width:.5`);
    lvl(g, 14, gy(0), '±0,00'); lvl(g, 14, gy(-3.8), '−3,80'); lvl(g, 14, gy(-10), '−10,0');
    dimV(g, GF.x1 + 30, gy(3), gy(-10), '13,0 m', { rot: true, dx: 10 });
    letter(g, 28, gy(-3.8) + 20, 'a'); letter(g, GF.x0 + 78, gy(-10) - 34, 'b'); letter(g, GF.x0 - 30, gy(-7.6), 'c'); },
  u2: (s) => { const g = gBase(s); gBox(g, 10, -14.5, 8, -12.5);
    miniExc(g, GF.x0 + 40, gy(-14.5) - 22);
    lvl(g, 14, gy(0), '±0,00'); lvl(g, 14, gy(-14.5), '−14,50');
    dimV(g, GF.x1 + 30, gy(10), gy(-14.5), '24,5 m', { rot: true, dx: 10 }); dimH(g, GF.x0 - 9, GF.x1 + 9, gy(10) - 16, 'D = 57,0 m'); },
  u3: (s) => { const g = gBase(s, true); gBox(g, -3.5, -28, 8, -26, 'grout');
    for (const z of [-10, -18]) arrowH(g, GF.x0 - 46, GF.x0 - 18, gy(z), { c: 'acc', w: 2.4, s: 6 });
    lvl(g, 14, gy(0), '±0,00'); lvl(g, 14, gy(-28), '−28,0'); lvl(g, 14, gy(-3.5), '−3,50', { len: 60 });
    letter(g, GF.x0 - 58, gy(-14), 'd'); },
};

/* ================================================================== H) a kész szekrény metszete */
export function artGenfKesz(host) {
  const W = 640, H = 470, k = 7.6, Y0 = 210, y = (z) => Y0 - z * k;
  const s = mkS(host, W, H, 'A kész süllyesztett szekrény metszete: hét garázsszint, felette két épülettömb'), g = g_(s);
  backdrop(g, { H, GY: Y0, layers: [{ k: 'gravel', y: Y0 }, { k: 'silt', y: y(-4) }, { k: 'clay', y: y(-22) }] }, 0, W);
  const x0 = 120, x1 = 560, t = 11;
  R(g, x0, y(-3), x1 - x0, y(-24.5) - y(-3), F('bore'));
  R(g, 316, y(-3), 48, y(-24.5) - y(-3), F('steel1', 0.7));
  for (let i = 0; i < 8; i++) { const yy = y(-3.6 - i * 2.7); P(g, `M316 ${yy}L364 ${yy + 14}`, SK('concedge', 2)); }
  for (let i = 1; i < 8; i++) { const yy = y(-3 - i * 2.7); R(g, x0, yy - 2.4, 196, 4.8, 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.6`); R(g, 364, yy - 2.4, x1 - 364, 4.8, 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.6`); }
  for (const x of [175, 230, 285, 395, 450, 505]) R(g, x - 3, y(-3), 6, y(-24.5) - y(-3), 'fill:url(#pr-concg)' + `;stroke:${v('concedge')};stroke-width:.5`);
  const CARS = ['acc', 'water', 'mach', 'mach2', 'crane', 'exc'];
  for (let i = 0; i < 7; i++) { const yy = y(-3 - (i + 1) * 2.7) - 2.4; for (const [bx, q] of [[128, 0], [183, 1], [238, 2], [403, 4], [458, 5], [513, 6]]) if (hash(i * 7 + q) > 0.42) carSide(g_(g, { transform: `translate(${bx} ${yy}) scale(0.82) translate(${-bx} ${-yy})` }), bx, yy, CARS[(i + q) % 6]); }
  concP(g, `M${x0 - t} ${y(-24.5)}H${x1 + t}V${y(-27.9)}H${x0 - t}Z`);
  concP(g, `M${x0 - t} ${y(-3)}H${x0}V${y(-24.5)}H${x0 - t}Z`); concP(g, `M${x1} ${y(-3)}H${x1 + t}V${y(-24.5)}H${x1}Z`);
  concP(g, `M${x0 - t} ${y(-24.5)}H${x0 + 16}L${x0 - 4} ${y(-28)}H${x0 - 22}V${y(-25.5)}Z`); concP(g, `M${x1 + t} ${y(-24.5)}H${x1 - 16}L${x1 + 4} ${y(-28)}H${x1 + 22}V${y(-25.5)}Z`);
  concP(g, `M${x0 - t} ${y(-3)}H${x1 + t}V${y(-1)}H${x0 - t}Z`);
  for (const [a, b] of [[x0 + 10, x0 + 160], [x1 - 160, x1 - 10]]) { // két épülettömb üveghomlokzattal
    R(g, a, y(23.7), b - a, y(0) - y(23.7), F('steel1') + `;stroke:${v('steel3')};stroke-width:1.2`);
    for (let z = 0.5; z < 23; z += 2.9) for (let x = a + 6; x < b - 12; x += 18) R(g, x, y(z + 2.3), 13, 2.3 * k - 5, 'fill:url(#pr-glass)' + `;stroke:${v('steel3')};stroke-width:.5`);
    R(g, a - 3, y(23.7) - 5, b - a + 6, 6, F('steel3')); R(g, (a + b) / 2 - 9, y(0) - 15, 18, 15, F('dark2'));
  }
  lvl(g, 40, y(23.7), '+23,70'); lvl(g, 40, y(0), '±0,00'); lvl(g, 40, y(-28), '−28,0');
  dimV(g, W - 50, y(-3), y(-21.9), '7 × 2,70 m', { rot: true, dx: 10 }); dimV(g, W - 22, y(0), y(-27.9), '27,9 m', { rot: true, dx: 10 });
  lab(g, 392, y(-31), 'rámpa', { to: [340, y(-13)] }); lab(g, 60, y(-32.4), 'fenéklemez', { to: [x0 + 40, y(-26.2)] }); lab(g, x1 + 30, y(-32.4), 'vágóél', { anchor: 'end', to: [x1 + 14, y(-27.4)] });
}

/* ================================================================== I) a keszon metszete */
export function artKeszon(host) {
  const W = 560, H = 430, WL = 120, BED = 232;
  const s = mkS(host, W, H, 'Keszon (légnyomásos szekrény) metszete: munkakamra túlnyomásos levegőben, aknacső, személy- és anyagzsilip, kompresszor'), g = g_(s);
  river(g, W, H, WL, BED, [{ k: 'sand', y: WL }, { k: 'gravel', y: 398 }]);
  const x0 = 150, x1 = 410, ce = 380, ch = 54, roof = 30, sx = 230, mx = 330;
  R(g, x0 + 10, ce - ch, x1 - x0 - 20, ch + 2, F('air')); R(g, x0 + 10, ce - ch, x1 - x0 - 20, ch + 2, F('lamp', 0.12));
  P(g, `M${x0 + 26} ${ce + 2} Q${(x0 + x1) / 2} ${ce - 12} ${x1 - 26} ${ce + 2}Z`, F('sand2') + `;stroke:${v('layer')};stroke-width:.6`);
  // pillértest (kőburkolat) és a keszon vasbeton teste
  const pier = `M${x0 + 16} 150H${x1 - 16}L${x1} ${ce - ch - roof}H${x0}Z`;
  P(g, pier, F('stone') + `;stroke:${v('stone2')};stroke-width:1.2`);
  for (let yy = 164, r = 0; yy < ce - ch - roof; yy += 15, r++) { const e = 16 * (1 - (yy - 150) / (ce - ch - roof - 150)); Ln(g, x0 + e, yy, x1 - e, yy, SK('stone2', 0.8)); for (let xx = x0 + 30 + (r % 2) * 20; xx < x1 - 20; xx += 40) Ln(g, xx, yy, xx, Math.min(yy + 15, ce - ch - roof), SK('stone2', 0.7)); }
  concP(g, `M${x0} ${ce - ch - roof}H${x1}V${ce}h-6L${x1 - 22} ${ce - ch + 6}V${ce - ch}H${x0 + 22}v6L${x0 + 6} ${ce}H${x0}Z`, { w: 1.4 });
  for (const x of [x0 + 3, x1 - 3]) Ln(g, x - 3, ce, x + 3, ce, SK('steel3', 3, 'stroke-linecap:round'));
  // aknacsövek a zsilipekkel
  for (const x of [sx, mx]) { R(g, x - 9, 70, 18, ce - ch - 68, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:1`); for (let yy = 100; yy < ce - ch; yy += 34) Ln(g, x - 10, yy, x + 10, yy, SK('steel3', 1.6)); }
  for (let yy = 150; yy < ce - ch - 6; yy += 9) Ln(g, sx - 4, yy, sx + 4, yy, SK('steel1', 1)); // létra
  Ln(g, mx, 78, mx, ce - ch + 12, SK('rope', 1)); P(g, `M${mx - 6} ${ce - ch + 12}l2 9h8l2 -9Z`, F('steel2') + `;stroke:${v('dark')};stroke-width:.8`);
  const lock = (x, y, w, h, col) => { R(g, x - w / 2, y, w, h, F(col) + `;stroke:${v('dark')};stroke-width:1.1`, { rx: 9 }); R(g, x - w / 2 + 5, y + 4, w - 10, 4, F('halo', 0.25), { rx: 2 }); C(g, x - w / 2 + 12, y + h / 2 + 3, 5, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:.9`); for (const dx of [-w / 2 + 3, w / 2 - 3]) for (const dy of [5, h - 5]) C(g, x + dx, y + dy, 1.3, F('dark')); };
  lock(sx, 32, 62, 42, 'crane'); lock(mx, 36, 58, 36, 'steel2');
  // kompresszor uszályon, légvezeték
  P(g, `M440 ${WL + 8}h108l-8 -20h-92Z`, F('dark2') + `;stroke:${v('dark')};stroke-width:1`);
  R(g, 462, WL - 50, 66, 38, F('cont') + `;stroke:${v('cont3')};stroke-width:1`, { rx: 4 }); for (let xx = 470; xx < 524; xx += 7) Ln(g, xx, WL - 44, xx, WL - 18, SK('cont3', 0.8)); C(g, 512, WL - 31, 8, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.9`); R(g, 476, WL - 58, 8, 9, F('dark2'));
  const pd = `M462 ${WL - 34}H${mx + 22}V${ce - ch - 2}`; P(g, pd, SK('dark', 6, 'stroke-linejoin:round')); P(g, pd, SK('acc2', 3.4, 'stroke-linejoin:round'));
  for (const [x, d] of [[196, 1], [262, -1], [300, 1], [366, -1]]) worker(g, x, { GY: ce + 1, s: 1.05, dir: d, pose: d > 0 ? 'guide' : 'stand' });
  // a túlnyomásos levegő kiszorítja a vizet: buborékok a vágóél alól
  for (const [x, k] of [[x0 - 4, -1], [x1 + 4, 1]]) { arrowH(g, x, x + k * 26, ce - 4, { c: 'water', w: 2.4, s: 6 }); for (let i = 0; i < 4; i++) C(g, x + k * (8 + i * 5), ce - 16 - i * 13, 2 + (i % 2), SK('water', 1) + ';fill:' + v('air')); }
  dimV(g, 70, WL, ce, 'h', { dx: -22 }); el('text', { x: 57, y: (WL + ce) / 2 + 8, class: 'pr-tx', style: 'font-size:9px;font-weight:700', text: 'v' }, g);
  lab(g, 8, WL - 12, 'vízszint'); lab(g, W - 8, BED + 20, 'mederfenék', { anchor: 'end' });
  lab(g, 74, 22, 'személyzsilip', { to: [sx - 18, 46] }); lab(g, 380, 18, 'anyagzsilip', { to: [mx + 20, 46] });
  lab(g, 494, WL - 68, 'kompresszor', { anchor: 'middle' }); lab(g, mx + 34, 176, 'légvezeték');
  lab(g, 88, 186, 'aknacső', { to: [sx - 9, 196] }); lab(g, 470, 214, 'pillértest', { to: [x1 - 44, 214] });
  lab(g, 448, 300, 'munkakamra (túlnyomás)', { to: [x1 - 60, ce - 30] }); lab(g, 470, 362, 'vágóél', { to: [x1 - 3, ce - 3] });
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
  if (!q.done) { const gb = yin - 2 - q.bob * 26, k = Math.max(0.34, Math.min(0.8, ri / 26)), gr = grabR(g_(g, { transform: `translate(${cx} ${gb}) scale(${k}) translate(${-cx} ${-gb})` }), cx, gb, 22, q.bob * 0.9, q.bob < 0.3 ? 1 : 0, q.soil); hook = gb - (gb - gr.top) * k; }
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
export function artAcel(fig, steps, L) {
  fig.classList.add('pr-svg'); defs(); const W = 760, H = 330, pw = W / 4, GY = 104, KP = 26; CUR.W = W;
  const M = { H, GY, layers: [{ k: 'sand', y: GY }, { k: 'gravel', y: GY + 7 * KP }] };
  steps.forEach((t, i) => {
    const cid = 'kac' + i; el('rect', { x: 0, y: 0, width: pw, height: H }, el('clipPath', { id: cid }, el('defs', {}, fig)));
    const g = g_(g_(fig, { transform: `translate(${i * pw} 0)` }), { 'clip-path': `url(#${cid})` });
    backdrop(g, M, i * pw + 40, pw);
    const cx = 78, r = 24, yb = GY + (i === 0 ? 3.6 : 7.4) * KP;
    if (i < 3) {
      const lift = i === 2 ? 2.6 * KP : 0, top = (i === 0 ? GY - 34 : GY - 22) - lift, bot = yb - lift;
      bore(g, cx - r, top, 2 * r, bot - top);
      if (i === 0) soilR(g, cx - r, GY + 1.6 * KP, 2 * r, bot - GY - 1.6 * KP, 'sand');
      if (i === 2) { concrete(g, cx - r, GY + 2.2 * KP, 2 * r, bot - GY - 2.2 * KP, true); concrete(g, cx - r - 4, bot, 2 * r + 8, yb - bot, true); }
      casing(g, cx, top, bot, r, {});
      if (i === 0) { vibroUnit(g, cx, top + 9, 0, { w: 46, hb: 26, half: r }); Ln(g, cx, 0, cx, top - 44, SK('rope', 1.6)); lab(g, cx + 40, top - 26, 'vibrátor', { to: [cx + 24, top - 16] }); for (const k of [-1, 1]) for (let q = 0; q < 3; q++) P(g, `M${cx + k * (r + 8 + q * 6)} ${top + 30 + q * 8} q${k * 4} 6 0 12`, SK('acc', 1.3)); }
      if (i === 1) { const gr = grabR(g, cx, yb - 3, 17, 0.6, 0, 'sand'); Ln(g, cx, 0, cx, gr.top, SK('rope', 1.5)); spoil(g, M, cx + 44, 40, 12, 'sand'); worker(g, cx + 96, { GY, dir: -1, pose: 'guide' }); }
      if (i === 2) { tremie(g, cx, 34, GY + 3.4 * KP, { full: true }); mixer(g, M, cx + 54, 1); arrowV(g, cx - r - 16, GY + 34, GY - 10, { c: 'ok', w: 2.6, s: 7 }); lab(g, 4, GY + 56, L.pull, { fs: 11 }); lab(g, 4, GY - 30, L.trem, { to: [cx - 4, GY - 22], fs: 11 }); }
    } else {
      concrete(g, cx - r, GY, 2 * r, yb - GY, false);
      concP(g, `M6 ${GY - 22}H${pw - 6}V${GY - 2}H6Z`); concP(g, `M${cx - 13} 30h26V${GY - 22}h-26Z`);
      lab(g, cx + 26, 50, L.pier, { to: [cx + 12, 60], fs: 11 }); lab(g, pw - 8, GY + 18, L.beam, { anchor: 'end', to: [pw - 40, GY - 10], fs: 11 }); lab(g, cx, yb + 18, L.well, { anchor: 'middle', to: [cx, yb - 8], fs: 11 });
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
    lab(g, cx - 8, BY - 24, L[0], { anchor: 'middle', fs: 11 }); lab(g, cx, BY + 26, L[1], { anchor: 'middle', fs: 11 });
  } else if (i === 1) {
    const ye = BY + 84, top = WY - 20, x0 = cx - 54, x1 = cx + 54;
    R(g, x0, top, x1 - x0, ye - 14 - top, F('bore')); waterBody(g, x0, WY, x1 - x0, ye - 14 - WY, { op: 0.48, n: 1 });
    boxWall(g, x0, -1, top, ye, 9, { ex: 6, eh: 30 }); boxWall(g, x1, 1, top, ye, 9, { ex: 6, eh: 30 });
    for (const x of [cx - 18, cx + 18]) concP(g, `M${x - 4} ${top}h8V${ye - 42}L${x} ${ye - 32}L${x - 4} ${ye - 42}Z`);
    for (const yy of [WY + 22, BY + 14]) Ln(g, x0 - 16, yy, x1 + 16, yy, SK('acc', 1.2, 'stroke-dasharray:6 4'));
    dimV(g, x0 - 24, WY + 22, BY + 14, '6–8 m', { dx: -42 });
    for (const [x, yy, op] of [[cx - 36, ye - 14, 0.6], [cx + 36, ye - 24, 0.2]]) { const gr = grabR(g, x, yy, 11, op, op < 0.3 ? 1 : 0, 'sand'); Ln(g, x, 34, x, gr.top, SK('rope', 1.2)); }
    lab(g, cx, H - 12, L[2], { anchor: 'middle', fs: 11 });
  } else {
    const ye = BY + 72, top = WY - 6, ch = 30, x0 = cx - 62, x1 = cx + 62;
    R(g, x0 + 8, ye - ch, x1 - x0 - 16, ch + 1, F('air')); R(g, x0 + 8, ye - ch, x1 - x0 - 16, ch + 1, F('lamp', 0.12));
    concP(g, `M${x0} ${top}H${x1}V${ye}h-4L${x1 - 12} ${ye - ch + 4}V${ye - ch}H${x0 + 12}v4L${x0 + 4} ${ye}H${x0}Z`);
    R(g, cx - 6, top - 22, 12, ye - ch - top + 22, 'fill:url(#pr-cyl)' + `;stroke:${v('dark')};stroke-width:.9`);
    R(g, cx - 22, top - 40, 44, 20, F('crane') + `;stroke:${v('dark')};stroke-width:1`, { rx: 7 }); C(g, cx - 12, top - 30, 4, 'fill:url(#pr-glass)' + `;stroke:${v('dark')};stroke-width:.8`);
    worker(g, cx - 30, { GY: ye, s: 0.8, dir: 1, pose: 'guide' }); worker(g, cx + 28, { GY: ye, s: 0.8, dir: -1 });
    for (const [x, k] of [[x0 - 3, -1], [x1 + 3, 1]]) for (let q = 0; q < 3; q++) C(g, x + k * (5 + q * 4), ye - 12 - q * 12, 1.8 + (q % 2), SK('water', 0.9) + ';fill:' + v('air'));
    lab(g, cx + 30, top - 30, L[3], { to: [cx + 22, top - 30], fs: 11 }); lab(g, cx, H - 12, L[4], { anchor: 'middle', fs: 11 });
  }
}
