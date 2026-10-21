// C09 – 3D cölöpépítő. Technológia × talajszelvény: a cölöp lépésenként épül fel a 3D metszetben
// (gép sematikusan), idővonallal; közben teherátadási arány (szemléltető modell), besorolás,
// ellenőrző lista és cölöpcsoport-nézet (3×3 cölöp + vasbeton fejtömb).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { register, h, $$, fmt, clamp, lerp, slider, seg, toggle, select, stat, cssVar, onTheme, shell, isDark } from './core.js';
import { defineQuiz, ytMini } from './ui.js';

const TAU = Math.PI * 2;
const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const frac = (x) => x - Math.floor(x);

/* ------------------------------------------------------------------ talajok (szemléltető fajlagos értékek, kPa) */
const KIND = {
  fill: { n: 'feltöltés', c: 0x8b8173, qs: () => 10, qb: () => 300 },
  softclay: { n: 'puha agyag', c: 0x928b76, coh: true, soft: true, cu: () => 18, qs: () => 15, qb: () => 160 },
  peat: { n: 'tőzeg', c: 0x5e4a36, coh: true, soft: true, cu: () => 8, qs: () => 5, qb: () => 60 },
  gravel: { n: 'homokos kavics (tömör)', c: 0xc8ab7a, gran: true, dense: true, qs: (z) => Math.min(100, 60 + z), qb: (z) => Math.min(7000, 5000 + 50 * z) },
  sand: { n: 'homok', c: 0xd4c08f, gran: true, qs: (z) => Math.min(90, 15 + 2.5 * z), qb: (z) => Math.min(4000, 1500 + 60 * z) },
  hardclay: { n: 'kemény agyag', c: 0x7d7b70, coh: true, hard: true, cu: (z) => 120 + 8 * z, qs: (z) => Math.min(120, 35 + 3 * z), qb: (z) => Math.min(3600, 9 * (120 + 8 * z)) },
};
const PROF = {
  A: { n: 'A · Puha agyag a teherbíró kavicson', gw: 2, bear: 10, layers: [['fill', 0, 1.5], ['softclay', 1.5, 10], ['gravel', 10, 90]] },
  B: { n: 'B · Vastag homok, magas talajvíz', gw: 1.5, bear: null, layers: [['fill', 0, 1], ['sand', 1, 90]] },
  C: { n: 'C · Tőzeg, tömbös feltöltés', gw: 1, bear: 13, blocks: true, layers: [['fill', 0, 3, 'tömbös feltöltés'], ['peat', 3, 7], ['softclay', 7, 13], ['gravel', 13, 90]] },
  D: { n: 'D · Kemény agyag, mély talajvíz', gw: 40, bear: null, layers: [['fill', 0, 1], ['hardclay', 1, 90]] },
};
/* ------------------------------------------------------------------ technológiák */
const TECH = {
  cfa: { t: 'CFA – folyamatos spirál', g: 'talajhelyettesítéses', D: [40, 120, 10, 60], L: 13, ks: 1, kb: 1, yt: 'wqOU4bcUiCk', fault: 'Túl gyors kihúzás', link: '#furt' },
  casing: { t: 'Béléscsöves fúrt', g: 'talajhelyettesítéses', D: [80, 180, 10, 100], L: 20, ks: 1, kb: 1, yt: 'Oe5saZFiPJk', fault: 'Nincs vízpótlás a csőben', link: '#furt' },
  slurry: { t: 'Bentonitzagyos fúrt', g: 'talajhelyettesítéses', D: [80, 180, 10, 120], L: 22, ks: 1, kb: 1, yt: 'Oe5saZFiPJk', fault: 'Lesüllyed a zagyszint', link: '#furt' },
  dry: { t: 'Fúrt, megtámasztás nélkül', g: 'talajhelyettesítéses', D: [40, 100, 10, 60], L: 8, ks: 1, kb: 1, yt: null, fault: null, link: '#furt' },
  driven: { t: 'Vert előregyártott vasbeton', g: 'talajkiszorításos', D: [30, 50, 5, 40], L: 10, ks: 1.3, kb: 1.3, yt: 'KDKCobw52qk', fault: null, link: '#elore' },
  franki: { t: 'Franki-cölöp', g: 'talajkiszorításos', D: [60, 60, 1, 60], L: 12, ks: 1.2, kb: 1, yt: '_QsH5x0ndtI', fault: null, link: '#helyszini' },
  screw: { t: 'Csavart, talajkiszorításos', g: 'talajkiszorításos', D: [30, 60, 5, 45], L: 12, ks: 1.3, kb: 1, yt: 'hwP8iZzAq6I', fault: null, link: '#helyszini' },
  micro: { t: 'Mikrocölöp (merevbetétes)', g: 'egyéb (mikrocölöp)', D: [10, 30, 2, 20], L: 12, ks: 1.2, kb: 0, yt: '7M7YPxBn8Xk', fault: null, link: '#egyeb' },
};
const KISZ = (k) => TECH[k].g === 'talajkiszorításos';

function layersOf(P) { return P.layers.map(([k, t, b, nm]) => ({ k, t, b, K: KIND[k], n: nm || KIND[k].n })); }
function layerAt(P, z) { const Ls = layersOf(P); return Ls.find((l) => z >= l.t && z < l.b) || Ls[Ls.length - 1]; }

/* ------------------------------------------------------------------ szemléltető teherátadási modell */
function capacity(S, ks, kb, P = PROF[S.prof], sq = S.tech === 'driven' && S.shape === 'sq') {
  const L = S.L, D = S.D / 100;
  const per = sq ? 4 * D : Math.PI * D;
  let Ab = sq ? D * D : (Math.PI * D * D) / 4;
  if (S.tech === 'franki') { const Db = 1.6 * D; Ab = (Math.PI * Db * Db) / 4; }
  const parts = [];
  for (const l of layersOf(P)) {
    const a = l.t, b = Math.min(l.b, L); if (b <= a) continue;
    let s = 0; const n = Math.max(2, Math.ceil((b - a) / 0.25)), dz = (b - a) / n;
    for (let i = 0; i < n; i++) s += l.K.qs(a + (i + 0.5) * dz) * dz;
    parts.push({ k: l.k, n: l.n, c: l.K.c, R: s * per * ks });
  }
  const toe = layerAt(P, L - 0.01);
  const Rb = toe.K.qb(L) * Ab * kb;
  const Rs = parts.reduce((a, p) => a + p.R, 0);
  return { parts, Rb, Rs, R: Rb + Rs, toe };
}

/* ------------------------------------------------------------------ értékelés: besorolás + ellenőrző lista */
function evaluate(S) {
  const P = PROF[S.prof], T = TECH[S.tech], L = S.L, D = S.D / 100, rp = D / 2;
  const Ls = layersOf(P), gw = P.gw, gwIn = gw < L;
  const items = [];
  const add = (s, t, d) => items.push({ s, t, d });
  const inL = Ls.filter((l) => l.t < L);
  const toe = layerAt(P, L - 0.01);
  const M = { S, P, T, L, D, rp, gw, gwIn, Ls, toe, items, fault: !!(S.fault && T.fault), stuck: 0, neck: null, incl: null, collapse: null, boil: false };

  // --- kivitelezési korlátok, technológiánként
  const k = S.tech;
  if (k === 'cfa') {
    if (L > 24) add('bad', 'Túl hosszú CFA-cölöp', `A folyamatos spirállal legfeljebb kb. <b>22–24 m</b> hosszú cölöp készíthető – itt ${fmt(L, 1)} m kellene. Hosszabb cölöphöz béléscsöves vagy zagyos fúrt cölöp kell.`);
    else if (L > 22) add('warn', 'A CFA hosszának határán', `${fmt(L, 1)} m: a CFA-cölöp jellemzően legfeljebb 22–24 m hosszú.`);
    else add('ok', 'CFA: a talajdugó megtámaszt', 'A spirálon maradó talajdugó támasztja meg a furat falát, külön megtámasztás nem kell. Gyors, zaj- és rezgésszegény; minden cölöpről automatikus jegyzőkönyv készül.');
    if (P === PROF.B) add('warn', 'Homok a talajvíz alatt', 'Finom homokban, talajvíz alatt a CFA-cölöpnél különös gondosság kell (laza, folyós talajba nem is javasolt): a fúrás és a betonnyomás szabályozása kritikus.');
    if (M.fault) {
      const soft = inL.find((l) => l.K.soft);
      const z1 = soft ? Math.min(soft.t + 0.6, L - 3) : L * 0.4, z2 = soft ? Math.min(soft.b, z1 + 2.6, L - 1.5) : L * 0.4 + 2.2;
      M.neck = [Math.max(0.6, z1), Math.max(z1 + 1, z2)];
      add('bad', 'Nyakasodás!', `Ha a spirált gyorsabban húzzák, mint ahogy a beton kitölti a helyét, a cölöp elvékonyodik (itt kb. −${fmt(M.neck[0], 1)} és −${fmt(M.neck[1], 1)} m között). A gépi jegyzőkönyvben a beton mennyisége és nyomása ezt azonnal elárulja.`);
    }
  }
  if (k === 'casing' || k === 'slurry') {
    if (L < 15) add('info', 'Rövid cölöp nagy géppel', `A ${k === 'casing' ? 'béléscsöves' : 'zagyos'} fúrt cölöp jellemzően 15–50 m hosszú; ${fmt(L, 1)} m-hez a lassabb, összetett technológia ritkán gazdaságos.`);
    if (k === 'casing') {
      add('ok', 'Béléscső a földkiemelés előtt', 'A béléscső megakadályozza a talaj és a talajvíz betörését; szemcsés talajban a csőnek a földkiemelés előtt kell járnia. Magas víztartalmú, iszapos talajban is biztonságos.');
      if (!gwIn && M.fault) add('info', 'Itt nincs mit pótolni', 'Ebben a szelvényben a furat mentén nincs talajvíz, így a vízpótlás hiánya a modellben nem okoz gondot. Próbáld ki az A, B vagy C szelvényben!');
      if (gwIn && M.fault) { M.boil = true; add('bad', 'Talajtörés a talpon!', `A cső belsejében nincs pótolva a kiemelt víz: a magasabb külső talajvízszint (−${fmt(gw, 1)} m) miatt a talpon betör a víz, és megbontja a talajt – a talpellenállás jelentősen csökken.`); }
      else if (gwIn) add('ok', 'Vízpótlás a furatban', 'A talajvízszint alatt a furatban pótolják a kiemelt vizet, így a talpon nem tör be a talaj.');
    } else {
      add('ok', 'Bentonitzagyos megtámasztás', 'A zagy kiszorítja a talajvizet és megtámasztja a furat falát; a betont kontraktorcsővel, alulról felfelé juttatják be, a zagyot kiszorítja.');
      if (M.fault && !gwIn) add('info', 'Nincs talajvíz a furat mentén', 'Ebben a szelvényben a zagyszint süllyedése a modellben nem okoz beomlást – próbáld ki az A, B vagy C szelvényben!');
      if (M.fault && gwIn) {
        const z1 = Math.max(gw + 0.3, 1.5), z2 = Math.min(L - 2, z1 + 3);
        M.collapse = [z1, Math.max(z1 + 1, z2)]; M.incl = M.collapse;
        add('bad', 'Beomlik a furat fala!', `A zagyszint a talajvízszint (−${fmt(gw, 1)} m) közelébe süllyedt: megszűnik a túlnyomás, a fal beomlik. A cölöptestben folytonossági hiány keletkezik, több beton kell, a köpenymenti ellenállás csökken.`);
      } else if (!M.fault) add('info', 'Zagyszint a talajvíz felett', 'A zagyszintet végig jóval a talajvízszint felett tartják – így marad meg a túlnyomás a furat falán.');
    }
    if (L > 50) add('warn', 'Nagyon hosszú cölöp', 'A hazai gyakorlatban jellemzően 30–40 m-es mélység elegendő.');
  }
  if (k === 'dry') {
    const why = [];
    if (gwIn) why.push(`a talajvíz (−${fmt(gw, 1)} m) a furat talpa felett van`);
    const gr = inL.find((l) => l.K.gran);
    if (gr) why.push(`a furat szemcsés rétegen (${gr.n}) halad át`);
    if (why.length) {
      const z1 = gwIn ? Math.max(gw, 0.8) : Math.max(gr.t, 0.8), z2 = Math.min(L - 0.5, z1 + 3);
      M.collapse = [z1, Math.max(z1 + 0.8, z2)]; M.incl = M.collapse;
      add('bad', 'A furat beomlik!', `Megtámasztás nélkül csak kötött talajban, talajvíz felett áll meg a furat – itt ${why.join(', és ')}. Folytonossági hiány, több beton, kisebb köpenymenti ellenállás lenne az eredmény. Válassz béléscsövet, zagyot vagy CFA-t!`);
    } else add('ok', 'Kötött talaj, talajvíz felett', 'Kemény, kötött talajban, a talajvíz felett a furat rövid ideig magától is megáll – a kiemelés után rögtön be kell betonozni.');
    if (L > 10) add('bad', 'Túl mély megtámasztás nélküli furat', `Megtámasztás nélkül legfeljebb 8–10 m mélységig dolgoznak – itt ${fmt(L, 1)} m.`);
    else if (L > 8) add('warn', 'A határon', `${fmt(L, 1)} m: megtámasztás nélküli furat legfeljebb 8–10 m mély lehet.`);
    if (L <= 6) add('info', 'Markolt tömbalap', '5–6 m mélységig az ilyen alapot markolt tömbalapnak, más néven kútalapnak is nevezik.');
  }
  if (k === 'driven') {
    const sq = S.shape === 'sq';
    if (sq && L > 12) add('bad', 'Túl hosszú négyzetes cölöp', `A négyzetes (30×30, 40×40 cm-es) cölöpök jellemzően 4–12 m hosszúak. Hosszabbhoz kör keresztmetszetű pörgetett cölöp (max. 20–22 m) kell.`);
    if (!sq && L > 22) add('bad', 'Túl hosszú előregyártott cölöp', 'A kör keresztmetszetű pörgetett cölöpök legfeljebb 20–22 m hosszúak.');
    if (sq && S.D > 40) add('info', 'Szokatlan keresztmetszet', 'A hazai gyakorlatban a négyzetes cölöp 30×30 vagy 40×40 cm-es.');
    const hard = inL.find((l) => l.K.hard);
    if (hard) { M.stuck = Math.min(L, hard.t + 0.9); add('bad', 'A cölöp elakad!', `Kemény (köves) agyagban az előregyártott cölöp nem verhető le a tervezett mélységig – itt kb. −${fmt(M.stuck, 1)} m-en megáll.`); }
    else if (P.blocks) { M.stuck = 1.6; add('bad', 'A cölöp elakad a feltöltésben!', 'Nagy tömbös feltöltésben a cölöpverés nem alkalmazható – egyetlen vékonyabb ilyen betelepülés is megakadályozhatja, hogy a cölöp lejusson.'); }
    add('ok', 'A kiszorítás tömörít', 'A levert cölöp széttolja és tömöríti maga körül a talajt: előregyártott cölöpnél a talp- és a köpenymenti ellenállás is nő.');
    add(S.nb ? 'bad' : 'warn', S.nb ? 'Rezgésérzékeny szomszéd: a legkockázatosabb választás' : 'Zaj és rezgés', 'A verés jelentős zajt és rezgést kelt, építmények közelében csak erős korlátok mellett alkalmazható.' + (S.nb ? ' Itt fúrt (CFA) vagy csavart cölöp a jobb választás.' : ''));
  }
  if (k === 'franki') {
    if (L > 18) add('bad', 'Túl hosszú Franki-cölöp', 'A Franki-cölöp hossza legfeljebb kb. 16–18 m.');
    else if (L > 16) add('warn', 'A Franki-cölöp hosszának határán', 'A hossz legfeljebb kb. 16–18 m lehet.');
    if (P.bear && L < P.bear + 0.5) add('warn', 'Nem éri el a teherbíró réteget', 'A béléscsövet a teherbíró talajrétegbe verik – a hagyma ott ad nagy talpellenállást.');
    add('ok', 'Kiszélesedő talp: „hagyma”', 'A kidöngölt betonhagyma nagy talpellenállást ad; 2000–3000 kN-os teherbírás is elérhető. Hazánkban mára szinte teljesen eltűnt.');
    add(S.nb ? 'bad' : 'warn', 'Verés, döngölés', 'A béléscsövet ejtőkossal verik le, a betont döngölik – dinamikus hatással és zajjal jár.' + (S.nb ? ' Rezgésérzékeny szomszéd mellett kerülendő.' : ''));
  }
  if (k === 'screw') {
    if (L > 20) add('bad', 'Túl hosszú csavart cölöp', 'A csavart cölöp hossza legfeljebb kb. 20 m.');
    if (inL.some((l) => l.K.hard)) add('warn', 'Kemény agyagban nem ideális', 'A csavart cölöp elsősorban laza vagy közepesen tömör szemcsés és átmeneti, gyengén kötött talajban népszerű és gazdaságos.');
    if (P.bear && L - P.bear > 3) add('warn', 'Mélyen a tömör kavicsban', 'A kiszorító fej tömör rétegben csak nehezen halad – a technológia laza, közepesen tömör talajra való.');
    add('ok', 'Nincs rezgés, alig van furatanyag', 'A fej fúrás közben széttolja és tömöríti a talajt: nő a köpenymenti ellenállás, a felszínre csekély furatanyag kerül, nincs dinamikus és zajhatás.');
  }
  if (k === 'micro') {
    const weak = inL.find((l) => l.K.cu && l.K.cu(l.t) < 10);
    if (weak) add('warn', 'Kihajlás!', `A ${weak.n} rétegben a drénezetlen nyírószilárdság 10 kPa alatti: a karcsú mikrocölöp kihajlását külön vizsgálni kell.`);
    add('info', 'Csak a köpeny számít', 'A karcsú mikrocölöp teherbírásánál a csúcsellenállást jellemzően figyelmen kívül hagyjuk. Merevbetétes injektált mikrocölöppel 120–150 kN-os teherbírás érhető el.');
    add('ok', 'Kis gép, szűk hely', 'Nehezen megközelíthető, alacsony belmagasságú helyen, meglévő épület aláfogásánál is használható.');
  }
  if (!KISZ(k) && k !== 'micro' && S.nb) add('ok', 'Rezgésérzékeny szomszéd mellett is', k === 'casing' ? 'A fúrás nem dinamikus; a béléscső lehajtása rotációval kíméletesebb, mint vibrálással.' : 'A fúrt cölöp készítése nem jár verés okozta rezgéssel.');
  if (k === 'screw' && S.nb) add('ok', 'A szomszéd sem érzi', 'Csavarás közben nincs verés, vibrálás.');

  // --- talp: hova áll a cölöp?
  const Lact = M.stuck || L;
  const toeA = layerAt(P, Lact - 0.01);
  if (P.bear) {
    if (Lact < P.bear) add('bad', 'A talp a puha rétegben áll', `A teherbíró ${layerAt(P, P.bear + 0.1).n} csak −${fmt(P.bear, 1)} m-en kezdődik, a cölöp talpa (−${fmt(Lact, 1)} m) ${/^[aáeéiíoóöőuúüű]/i.test(toeA.n) ? 'az' : 'a'} ${toeA.n} rétegben van: kicsi teherbírás, nagy süllyedés.`);
    else add('ok', `A talp a teherbíró rétegben`, `A cölöp ${fmt(Lact - P.bear, 1)} m-re hatol a teherbíró rétegbe (−${fmt(P.bear, 1)} m).`);
  } else add('info', 'Nincs kiemelkedő teherbíró réteg', 'A talp környékén nincs jobb réteg – a hosszabb cölöp köpenye dolgozik többet.');

  // --- teherátadás
  const S2 = { ...S, L: Lact };
  const cap = capacity(S2, T.ks, T.kb);
  if (M.boil) cap.Rb *= 0.45;
  if (M.collapse) { cap.Rb *= 0.65; for (const p of cap.parts) p.R *= 0.75; cap.Rs = cap.parts.reduce((a, p) => a + p.R, 0); }
  cap.R = cap.Rb + cap.Rs;
  const ref = capacity({ ...S2, tech: 'cfa' }, 1, 1, P, S.tech === 'driven' && S.shape === 'sq');
  const share = cap.R > 0 ? cap.Rb / cap.R : 0;
  const cls = share >= 2 / 3 ? 'álló' : share <= 1 / 3 ? 'lebegő' : 'vegyes';
  Object.assign(M, { cap, share, cls, rel: ref.R > 0 ? cap.R / ref.R : 1, Lact });
  // térfogatok
  const area = S.tech === 'driven' && S.shape === 'sq' ? D * D : (Math.PI * D * D) / 4;
  M.spoilV = KISZ(k) || k === 'micro' ? 0 : area * L * (M.collapse ? 1.12 : 1);
  M.concV = k === 'driven' ? 0 : area * L + (k === 'franki' ? (4 / 3) * Math.PI * Math.pow(0.8 * D, 3) * 0.75 : 0);
  M.concAct = M.neck ? M.concV * 0.9 : M.collapse ? M.concV * 1.18 : M.concV;
  M.vib = k === 'driven' ? 'nagy' : k === 'franki' ? 'jelentős' : 'kicsi';
  return M;
}

/* ------------------------------------------------------------------ textúrák */
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
let rs = 1; const rnd = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
function canvasTex(draw, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.repeat.set(1 / 2.4, 1 / 2.4); return t;
}
function soilTex(kind) {
  return canvasTex((g, s) => {
    rs = 11 + kind.length * 17;
    g.fillStyle = hex(KIND[kind].c); g.fillRect(0, 0, s, s);
    const dark = 'rgba(0,0,0,0.2)', light = 'rgba(255,255,255,0.16)';
    if (kind === 'softclay' || kind === 'hardclay') {
      g.strokeStyle = dark; g.lineWidth = kind === 'hardclay' ? 1.6 : 1.1;
      const st = kind === 'hardclay' ? 11 : 15;
      for (let i = -s; i < 2 * s; i += st) { g.beginPath(); g.moveTo(i, s); g.lineTo(i + s, 0); g.stroke(); }
      if (kind === 'softclay') { g.strokeStyle = 'rgba(0,0,0,0.14)'; for (let y = 10; y < s; y += 22) { g.beginPath(); for (let x = 0; x <= s; x += 4) g.lineTo(x, y + Math.sin((x / s) * TAU * 2) * 2); g.stroke(); } }
    } else if (kind === 'peat') {
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.3;
      for (let y = 8; y < s; y += 12) { g.beginPath(); for (let x = 0; x <= s; x += 4) g.lineTo(x, y + Math.sin((x / s) * TAU * 3 + y) * 2.4); g.stroke(); }
      g.strokeStyle = 'rgba(190,160,110,0.35)'; for (let k = 0; k < 18; k++) { const x = rnd() * s, y = rnd() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7, y - 2); g.stroke(); }
    } else if (kind === 'gravel') {
      for (let k = 0; k < 48; k++) { const r = 2 + rnd() * 5; g.beginPath(); g.ellipse(rnd() * s, rnd() * s, r, r * 0.75, rnd() * 3, 0, 7); g.fillStyle = rnd() > 0.5 ? dark : light; g.fill(); }
    } else if (kind === 'sand') {
      for (let k = 0; k < 280; k++) { g.fillStyle = rnd() > 0.5 ? dark : light; g.fillRect(rnd() * s, rnd() * s, 1.6, 1.6); }
    } else {
      for (let k = 0; k < 30; k++) { g.fillStyle = ['rgba(0,0,0,0.25)', 'rgba(160,60,40,0.35)', 'rgba(255,255,255,0.2)'][k % 3]; const x = rnd() * s, y = rnd() * s, w = 3 + rnd() * 9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + 2); g.lineTo(x + w * 0.6, y + w * 0.7); g.closePath(); g.fill(); }
      for (let k = 0; k < 80; k++) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(rnd() * s, rnd() * s, 1.5, 1.5); }
    }
  });
}

/* ------------------------------------------------------------------ anyagok: metszet a z = 0 síkon (csak a terep alatt) */
const SEC = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
// a hátlapok (amit a vágáson át látunk) lapos „metszetszínt” kapnak → tömör hatású vágott felület
function secMat(color, cap = null, o = {}) {
  const m = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, clippingPlanes: SEC, clipIntersection: true, ...o });
  const cc = new THREE.Color(cap ?? color);
  m.userData.cap = cc;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.capColor = { value: cc };
    sh.fragmentShader = 'uniform vec3 capColor;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\nif (!gl_FrontFacing) gl_FragColor = vec4(capColor, gl_FragColor.a);');
  };
  m.customProgramCacheKey = () => 'sec-' + cc.getHexString() + (o.transparent ? 't' : '');
  return m;
}
const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });

/* ------------------------------------------------------------------ geometria-segédek */
function lathe(pts, seg = 36) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y)), seg); }
// tömör forgástest a [z0, z1] mélységtartományra (z lefelé pozitív), sugár rf(z)
function solidProfile(z0, z1, rf) {
  const pts = [[0, -z1]];
  const n = Math.max(6, Math.ceil((z1 - z0) / 0.12));
  for (let i = 0; i <= n; i++) { const z = z1 - ((z1 - z0) * i) / n; pts.push([rf(z), -z]); }
  pts.push([0, -z0]);
  return lathe(pts);
}
// gyűrű (talajbetüremkedés) a [z0, z1] tartományban: belső rIn(z), külső rOut
function ringProfile(z0, z1, rIn, rOut) {
  const pts = [], n = 16;
  for (let i = 0; i <= n; i++) { const z = z0 + ((z1 - z0) * i) / n; pts.push([rOut, -z]); }
  for (let i = n; i >= 0; i--) { const z = z0 + ((z1 - z0) * i) / n; pts.push([Math.min(rOut - 0.005, rIn(z)), -z]); }
  pts.push(pts[0]);
  return lathe(pts, 28);
}
function helixGeom(len, rad, pitch, tube) {
  const turns = len / pitch, N = Math.ceil(turns * 18);
  const pts = []; for (let i = 0; i <= N; i++) { const a = (i / N) * turns * TAU; pts.push(new THREE.Vector3(Math.sin(a) * rad, -(i / N) * len, Math.cos(a) * rad)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, tube, 5, false);
}
const unitCyl = (r, seg = 32, open = false) => new THREE.CylinderGeometry(r, r, 1, seg, 1, open).translate(0, -0.5, 0); // teteje y = 0, alja y = −1
const unitBox = () => new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0);
// mélység-tartomány [top, bot] (lefelé +) → y-pozíció és magasság egy egységnyi (0…−1) testnek
function span(mesh, top, bot) { const hgt = Math.max(0.001, bot - top); mesh.position.y = -top; mesh.scale.y = hgt; mesh.visible = bot - top > 0.005; }

/* ------------------------------------------------------------------ a fő widget */
register('sim3d', (root) => {
  const ui = shell(root, { layout: 'ctl-right' });
  const S = { tech: 'cfa', prof: 'A', D: 60, L: 13, shape: 'sq', nb: false, fault: false, view: 'kozeli' };

  /* ---- színpad + idővonal */
  const viewSeg = seg(null, { label: '', options: [{ v: 'kozeli', t: 'Közeli (követ)' }, { v: 'teljes', t: 'Teljes metszet' }, { v: 'csoport', t: 'Cölöpcsoport' }], value: 'kozeli' });
  const stage = h('div', { class: 'sim-stage' });
  const badge = h('div', { class: 'sim-badge' }, 'Szemléltető modell');
  const stepEl = h('div', { class: 'sim-step' });
  const alertEl = h('div', { class: 'sim-alert' });
  stage.append(badge, alertEl, stepEl);
  const bPrev = h('button', { class: 'btn btn-line btn-sm sim-ic', type: 'button', 'aria-label': 'Előző lépés', title: 'Előző lépés' }, '⏮');
  const bPlay = h('button', { class: 'btn btn-acc btn-sm sim-playbtn', type: 'button' }, '▶ Építés');
  const bNext = h('button', { class: 'btn btn-line btn-sm sim-ic', type: 'button', 'aria-label': 'Következő lépés', title: 'Következő lépés' }, '⏭');
  const tl = h('input', { type: 'range', min: 0, max: 1000, step: 1, value: 1000, 'aria-label': 'Idővonal', class: 'sim-tl' });
  const playRow = h('div', { class: 'sim-play' }, bPrev, bPlay, bNext, tl);
  const chips = h('div', { class: 'sim-chips' });
  ui.viz.append(h('div', { class: 'sim-views' }, viewSeg.el), stage, playRow, chips);

  /* ---- vezérlők */
  const C = ui.ctrls;
  C.append(h('div', { class: 'sim-ctl-h' }, 'Helyszín'));
  const cProf = select(C, { label: 'Talajszelvény', options: Object.entries(PROF).map(([v, p]) => ({ v, t: p.n })), value: S.prof });
  const cNb = toggle(C, { label: 'Rezgésérzékeny szomszéd (belváros)', value: S.nb });
  C.append(h('div', { class: 'sim-ctl-h' }, 'Cölöp'));
  const cTech = select(C, { label: 'Technológia', options: Object.entries(TECH).map(([v, t]) => ({ v, t: t.t })), value: S.tech });
  const techChip = h('div', { class: 'sim-techg' });
  C.append(techChip);
  const cShape = seg(C, { label: 'Keresztmetszet', options: [{ v: 'sq', t: 'Négyzet' }, { v: 'kor', t: 'Kör (pörgetett)' }], value: S.shape });
  const cD = slider(C, { label: 'Átmérő', sym: 'D', min: 40, max: 120, step: 10, value: S.D, unit: 'cm', d: 0 });
  const cL = slider(C, { label: 'Cölöphossz', sym: 'L', min: 4, max: 50, step: 0.5, value: S.L, unit: 'm', d: 1 });
  const dNote = h('div', { class: 'sim-ctl-note' });
  C.append(dNote);
  C.append(h('div', { class: 'sim-ctl-h' }, 'Kivitelezési hiba'));
  const cFault = toggle(C, { label: '–', value: false });
  const fNote = h('div', { class: 'sim-ctl-note' });
  C.append(fNote);
  const ytBox = h('div', { class: 'sim-yt' });
  C.append(ytBox);

  /* ---- kimenetek */
  const ratio = h('div', { class: 'sim-ratio' });
  ui.out.append(ratio);
  const oTalp = stat(ui.out, { label: 'Talpellenállás' });
  const oKop = stat(ui.out, { label: 'Köpenymenti ellenállás' });
  const oCls = stat(ui.out, { label: 'Besorolás' });
  const oRel = stat(ui.out, { label: 'Az azonos méretű CFA-hoz képest' });
  const oSpoil = stat(ui.out, { label: 'Kitermelt talaj' });
  const oConc = stat(ui.out, { label: 'Helyszíni beton' });
  const oVib = stat(ui.out, { label: 'Rezgés, zaj' });
  const checkBox = h('div', { class: 'sim-check' });
  root.append(checkBox);

  /* ---- three.js */
  let renderer = null;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { stage.append(h('div', { class: 'sim-msg', html: 'A 3D nézethez WebGL kell, amit ez a böngésző most nem támogat.<br>A vezérlők, az arány-sáv és az ellenőrző lista ettől még működnek.' })); }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1.4, 0.2, 500);
  let controls = null;
  if (renderer) {
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.localClippingEnabled = true;
    stage.prepend(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', '3D cölöpépítő – metszet');
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; controls.minDistance = 2.5; controls.maxDistance = 220; controls.maxPolarAngle = Math.PI * 0.72;
    controls.addEventListener('change', () => req());
    controls.addEventListener('start', () => { userAct = true; });
    controls.addEventListener('end', () => { userAct = false; if (S.view === 'kozeli' && camDist > 0) userK = clamp(camera.position.distanceTo(controls.target) / camDist, 0.35, 3); });
  }
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6a5a4a, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(18, 40, 30); scene.add(sun);
  const fillL = new THREE.DirectionalLight(0xc7dcff, 0.55); fillL.position.set(-30, 10, 25); scene.add(fillL);

  // anyagok
  const MAT = {
    fresh: secMat(0x8f8c84, 0x8a877f), cured: secMat(0xb9b6ae, 0xaeaba3), precast: secMat(0xbdb9b0, 0xa9a59c),
    steel: secMat(0x5c6a76, 0x3e4851), steelD: secMat(0x3d4650, 0x2c333a), plug: secMat(0xcdc6b4, 0xc4bca8), grout: secMat(0xd3cdbf, 0xc7c0b0),
    slurry: secMat(0x7d7a48, 0x75723f, { transparent: true, opacity: 0.55, depthWrite: false }),
    water: secMat(0x3d8fd1, 0x3d8fd1, { transparent: true, opacity: 0.42, depthWrite: false }),
    spoilS: secMat(0x8b7a62, 0x7d6c55), spoilC: lam(0x8b7a62), parts: lam(0x8d7c62),
    rigBody: lam(0xe3a12b), rigDark: lam(0x2a2e33), mast: lam(0x45505b), head: lam(0xc4502c), cab: lam(0x9fb6c8), yellow: lam(0xe7b43a),
    rebar: new THREE.LineBasicMaterial({ color: 0xc0632e, clippingPlanes: SEC, clipIntersection: true }),
    cable: new THREE.LineBasicMaterial({ color: 0x222222 }),
    halo: new THREE.MeshBasicMaterial({ color: 0xf0864a, transparent: true, opacity: 0.22, depthWrite: false }),
    gwLine: new THREE.LineDashedMaterial({ color: 0x2f86c9, dashSize: 0.5, gapSize: 0.3 }),
    gwFace: new THREE.MeshBasicMaterial({ color: 0x4fa6e0, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    bear: new THREE.MeshBasicMaterial({ color: 0xf0864a }),
    grass: lam(0x7b8656), line: new THREE.LineBasicMaterial({ color: 0x2b241c, transparent: true, opacity: 0.5 }),
  };
  // talajanyagok rétegfajtánként: homlok (textúra), „rés” (a furat helyén, alulról fogyó), furatfal, oldal
  const clipStrip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0); // y ≤ −d marad
  const clipWall = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);   // y ≥ −d marad
  const SM = {};
  for (const k of Object.keys(KIND)) {
    const tex = soilTex(k), base = new THREE.Color(KIND[k].c);
    SM[k] = {
      face: lam(0xffffff, { map: tex }), strip: lam(0xffffff, { map: tex, clippingPlanes: [clipStrip] }),
      wall: lam(base.clone().multiplyScalar(0.7), { side: THREE.DoubleSide, clippingPlanes: [clipWall] }),
      side: lam(base.clone().multiplyScalar(0.86), { map: tex, side: THREE.DoubleSide }),
      incl: secMat(base.clone().multiplyScalar(0.92).getHex(), base.clone().multiplyScalar(0.8).getHex()),
    };
  }
  const soilMats = () => Object.values(SM).flatMap((m) => [m.face, m.strip, m.side]);
  const setXray = (on) => { for (const m of [...soilMats(), MAT.grass]) { m.transparent = on; m.opacity = on ? 0.2 : 1; m.depthWrite = !on; m.needsUpdate = true; } };

  // csoportok
  const G = { soil: new THREE.Group(), pile: new THREE.Group(), rig: new THREE.Group(), group: new THREE.Group() };
  Object.values(G).forEach((g) => scene.add(g));
  const disposeGroup = (g) => { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material?.userData?.tmp) o.material.dispose(); }); g.clear(); };
  const tmp = (m) => { m.userData.tmp = true; return m; };

  /* ---- HTML-címkék */
  const labs = [];
  function mkLab(cls = '') { const el = h('div', { class: 'sim-lab ' + cls }); stage.append(el); const L = { el, p: new THREE.Vector3(), on: false, txt: '' }; labs.push(L); return L; }
  function setLab(L, on, txt, x = 0, y = 0, z = 0) { L.on = !!on; if (!on) return; L.p.set(x, y, z); if (txt !== L.txt) { L.el.innerHTML = txt; L.txt = txt; } }
  const v3 = new THREE.Vector3();
  function placeLabs() {
    const w = stage.clientWidth, hh = stage.clientHeight;
    for (const L of labs) {
      if (!L.on) { L.el.style.display = 'none'; continue; }
      v3.copy(L.p).project(camera);
      const ok = v3.z < 1 && v3.x > -1.1 && v3.x < 1.1 && v3.y > -1.05 && v3.y < 1.05;
      L.el.style.display = ok ? '' : 'none';
      if (ok) { L.el.style.left = ((v3.x + 1) / 2) * w + 'px'; L.el.style.top = ((1 - v3.y) / 2) * hh + 'px'; }
    }
  }
  const staticLabs = [];
  const clearStatic = () => { staticLabs.splice(0).forEach((L) => { L.el.remove(); labs.splice(labs.indexOf(L), 1); }); };
  const sLab = (txt, cls, x, y, z) => { const L = mkLab(cls); staticLabs.push(L); setLab(L, true, txt, x, y, z); return L; };
  const DL = { tool: mkLab('tool'), conc: mkLab('tool'), cage: mkLab('tool'), casing: mkLab('tool'), fluid: mkLab('tool'), extra: mkLab('tool'), halo: mkLab('tool acc'), zone: mkLab('tool bad') };

  /* ---- jelenetváltozók */
  let M = null, W = 14, ZB = 9, YB = 20, Hm = 16, steps = [], total = 1, T = 0, playing = false;
  const ZF = 3;
  let rcProfile = () => 0; // furat/kiszorítás sugara a mélység függvényében
  const O = {}; // dinamikus testek

  /* ---- talajtömb (minden paraméterváltozáskor újraépül) */
  function buildSoil() {
    disposeGroup(G.soil);
    const g = G.soil, Ls = M.Ls.filter((l) => l.t < YB);
    const rcf = rcProfile;
    for (const l of Ls) {
      const t = l.t, b = Math.min(l.b, YB), m = SM[l.k];
      const n = Math.max(4, Math.ceil((b - t) / 0.1)), zs = Array.from({ length: n + 1 }, (_, i) => t + ((b - t) * i) / n);
      // bal és jobb homlok (a furat körvonaláig)
      for (const sgn of [-1, 1]) {
        const sh = new THREE.Shape(); sh.moveTo(sgn * W / 2, -t);
        zs.forEach((z) => sh.lineTo(sgn * rcf(z), -z));
        sh.lineTo(sgn * W / 2, -b); sh.closePath();
        g.add(new THREE.Mesh(new THREE.ShapeGeometry(sh), m.face));
      }
      // a furat helye: a furat aljától lefelé látszik
      if (zs.some((z) => rcf(z) > 0.001)) {
        const sh = new THREE.Shape(); sh.moveTo(-rcf(t), -t);
        zs.forEach((z) => sh.lineTo(-rcf(z), -z)); [...zs].reverse().forEach((z) => sh.lineTo(rcf(z), -z)); sh.closePath();
        g.add(new THREE.Mesh(new THREE.ShapeGeometry(sh), m.strip));
        // furatfal: félhenger a metszősík mögött (a furat aljáig látszik)
        const pts = zs.map((z) => new THREE.Vector2(Math.max(0.001, rcf(z)), -z));
        g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 24, Math.PI / 2, Math.PI), m.wall));
      }
      // oldallapok
      for (const sgn of [-1, 1]) {
        const sh = new THREE.Shape(); sh.moveTo(0, -t); sh.lineTo(ZB, -t); sh.lineTo(ZB, -b); sh.lineTo(0, -b); sh.closePath();
        const geo = new THREE.ShapeGeometry(sh).rotateY(Math.PI / 2).translate(sgn * W / 2, 0, 0);
        g.add(new THREE.Mesh(geo, m.side));
      }
      // réteghatár-vonal a homlokon
      if (t > 0) {
        const r0 = rcf(t);
        const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, -t, 0.004), new THREE.Vector3(-r0, -t, 0.004), new THREE.Vector3(r0, -t, 0.004), new THREE.Vector3(W / 2, -t, 0.004)]);
        g.add(new THREE.LineSegments(lg, MAT.line));
      }
    }
    // terepfelszín: egyedi cölöpnél a furat félkörével kivágva
    const r0 = Math.max(0.02, rcf(0.01));
    const top = new THREE.Shape(); top.moveTo(-W / 2, 0); top.lineTo(-r0, 0); top.absarc(0, 0, r0, Math.PI, 0, true); top.lineTo(W / 2, 0); top.lineTo(W / 2, ZB); top.lineTo(-W / 2, ZB); top.closePath();
    O.groundCut = new THREE.Mesh(new THREE.ShapeGeometry(top).rotateX(-Math.PI / 2).translate(0, 0.001, 0), MAT.grass); g.add(O.groundCut);
    const full = new THREE.Shape(); full.moveTo(-W / 2, 0); full.lineTo(W / 2, 0); full.lineTo(W / 2, ZB); full.lineTo(-W / 2, ZB); full.closePath();
    O.groundFull = new THREE.Mesh(new THREE.ShapeGeometry(full).rotateX(-Math.PI / 2).translate(0, 0.001, 0), MAT.grass); g.add(O.groundFull);
    // „levágott” talaj a metszősík előtt – halvány doboz
    const dk = isDark();
    const ghost = new THREE.Mesh(new THREE.BoxGeometry(W, YB, ZF), tmp(new THREE.MeshBasicMaterial({ color: dk ? 0xb7a27e : 0x8a7a62, transparent: true, opacity: dk ? 0.05 : 0.06, depthWrite: false })));
    ghost.position.set(0, -YB / 2, ZF / 2); ghost.renderOrder = 5; g.add(ghost);
    const ge = new THREE.LineSegments(new THREE.EdgesGeometry(ghost.geometry), tmp(new THREE.LineBasicMaterial({ color: dk ? 0xc9d3dc : 0x5f6c78, transparent: true, opacity: dk ? 0.2 : 0.28 })));
    ge.position.copy(ghost.position); g.add(ge);
    // talajvíz
    if (M.gw < YB) {
      const y = -M.gw, r1 = rcf(M.gw);
      const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, y, 0.006), new THREE.Vector3(-r1, y, 0.006), new THREE.Vector3(r1, y, 0.006), new THREE.Vector3(W / 2, y, 0.006)]);
      const ln = new THREE.LineSegments(lg, MAT.gwLine); ln.computeLineDistances(); g.add(ln);
      const wf = new THREE.Mesh(new THREE.PlaneGeometry(W, ZF), MAT.gwFace); wf.rotation.x = -Math.PI / 2; wf.position.set(0, y, ZF / 2); wf.renderOrder = 6; g.add(wf);
      for (const sgn of [-1, 1]) { const sl = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sgn * W / 2 + sgn * 0.005, y, 0), new THREE.Vector3(sgn * W / 2 + sgn * 0.005, y, -ZB)]); const l2 = new THREE.Line(sl, MAT.gwLine); l2.computeLineDistances(); g.add(l2); }
    }
    // teherbíró réteg teteje
    if (M.P.bear && M.P.bear < YB) { const band = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.02, 0.1), MAT.bear); band.position.set(0, -M.P.bear, 0.005); band.scale.x = 1; g.add(band); O.bearBand = band; }
    // statikus címkék
    clearStatic();
    for (const l of Ls) { const b = Math.min(l.b, YB); if (b - l.t < 0.7) continue; sLab(l.n, 'lay', -W / 2 + 0.25, -(l.t + Math.min(b, l.t + 6)) / 2, 0.02); }
    for (let z = 5; z < YB - 0.5; z += 5) sLab(`−${z} m`, 'ruler', W / 2 - 0.15, -z, 0.02);
    if (M.gw < YB) sLab(`talajvíz −${fmt(M.gw, 1)} m`, 'water', W / 2 - 1.6, -M.gw - 0.45, 0.02);
    if (M.P.bear && M.P.bear < YB) sLab(`teherbíró réteg −${fmt(M.P.bear, 0)} m`, 'acc', W / 2 - 2.2, -M.P.bear + 0.45, 0.02);
  }

  /* ---- gép (sematikus) */
  function buildRig() {
    disposeGroup(G.rig);
    const k = S.tech, g = G.rig, rr = Math.max(0.2, M.rp + 0.05);
    const small = k === 'micro', s = small ? 0.55 : 1;
    const cx = -(3.1 * s + rr), cz = -1.5 * s;
    const box = (w, hh, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); g.add(b); return b; };
    box(4.4 * s, 0.75 * s, 0.7 * s, cx, 0.38 * s, cz - 1.05 * s, MAT.rigDark); box(4.4 * s, 0.75 * s, 0.7 * s, cx, 0.38 * s, cz + 1.05 * s, MAT.rigDark);
    box(3.3 * s, 1.3 * s, 2.3 * s, cx - 0.35 * s, 1.4 * s, cz, MAT.rigBody);
    box(1.15 * s, 1.35 * s, 1.0 * s, cx + 0.9 * s, 2.7 * s, cz + 0.6 * s, MAT.cab);
    box(1.15 * s, 0.12 * s, 1.0 * s, cx + 0.9 * s, 3.43 * s, cz + 0.6 * s, MAT.rigBody);
    const mz = -(rr + 0.55 * s);
    Hm = { cfa: clamp(S.L + 3, 9, 30), screw: clamp(S.L + 3, 9, 26), casing: 15, slurry: 15, dry: 11, driven: Math.min(S.L, S.shape === 'sq' ? 12 : 22) + 5.5, franki: 16, micro: 4.6 }[k];
    box(0.5 * s, Hm, 0.5 * s, 0, Hm / 2 + 0.5 * s, mz, MAT.mast);
    // támasztókar a géptől az árbocig
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3 * s, 0.3 * s), MAT.mast);
    const a = new THREE.Vector3(cx + 1.2 * s, 2.0 * s, cz), b = new THREE.Vector3(0, Math.min(Hm * 0.45, 7 * s), mz);
    arm.scale.x = a.distanceTo(b); arm.position.copy(a).add(b).multiplyScalar(0.5); arm.rotation.z = Math.atan2(b.y - a.y, b.x - a.x); arm.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); g.add(arm);
    box(1.2 * s, 0.25 * s, 1.1 * s, 0, 0.62 * s, mz + 0.2, MAT.rigDark);
    // mozgó fej / kalapács
    O.head = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.9, rr * 2.2) * s, 1.1 * s, rr + 0.9 * s), k === 'driven' ? MAT.yellow : MAT.head);
    O.head.geometry.translate(0, 0, -(rr + 0.9 * s) / 2 + 0.3 * s); g.add(O.head);
    O.cable = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]), MAT.cable); g.add(O.cable); O.cable.visible = false;
    O.mastTop = Hm + 0.5 * s;
  }

  /* ---- a cölöp és a szerszámok testei */
  function buildPile() {
    disposeGroup(G.pile);
    for (const key of ['auger', 'plugSoil', 'augLen', 'bucket', 'bucketLoad', 'kelly', 'bucketH', 'rod', 'rodLen', 'grout', 'pile', 'Lp', 'plug', 'ram']) delete O[key];
    const g = G.pile, r = M.rp, k = S.tech;
    const add = (m) => { g.add(m); m.visible = false; return m; };
    O.conc = add(new THREE.Mesh(new THREE.BufferGeometry(), MAT.fresh)); O.concKey = '';
    O.incl = add(new THREE.Mesh(new THREE.BufferGeometry(), SM.softclay.incl)); O.inclKey = '';
    // vasalókosár
    const rc = Math.max(0.05, r - (k === 'micro' ? 0.02 : 0.075)), Lc = k === 'cfa' || k === 'screw' ? Math.max(3, S.L - 0.8) : S.L - 0.3;
    M.cageL = Lc;
    const nb = clamp(Math.round((TAU * rc) / 0.2), 6, 16), segs = [];
    for (let i = 0; i < nb; i++) { const a = (i / nb) * TAU; segs.push(new THREE.Vector3(Math.sin(a) * rc, 0.6, Math.cos(a) * rc), new THREE.Vector3(Math.sin(a) * rc, -Lc, Math.cos(a) * rc)); }
    const pitch = 0.3, turns = (Lc + 0.6) / pitch, N = Math.ceil(turns * 14);
    for (let i = 0; i < N; i++) {
      const a0 = (i / 14) * TAU, a1 = ((i + 1) / 14) * TAU, y0 = 0.6 - (i / 14) * pitch, y1 = 0.6 - ((i + 1) / 14) * pitch;
      if (y1 < -Lc) break;
      segs.push(new THREE.Vector3(Math.sin(a0) * rc, y0, Math.cos(a0) * rc), new THREE.Vector3(Math.sin(a1) * rc, y1, Math.cos(a1) * rc));
    }
    O.cage = add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), MAT.rebar));
    // béléscső / vezetőcső
    O.casing = add(new THREE.Mesh(unitCyl(k === 'franki' ? 0.255 : r + 0.035, 40, true), MAT.steel));
    O.vez = add(new THREE.Mesh(unitCyl(r + 0.12, 40, true), MAT.steel));
    O.slurry = add(new THREE.Mesh(unitCyl(k === 'franki' ? 0.24 : r + (k === 'slurry' ? 0.0 : 0.02), 32), MAT.slurry)); O.slurry.renderOrder = 3;
    O.water = add(new THREE.Mesh(unitCyl(k === 'franki' ? 0.24 : r + 0.01, 32), MAT.water)); O.water.renderOrder = 3;
    // kontraktorcső + tölcsér
    const tr = clamp(r * 0.18, 0.07, 0.15);
    O.tremie = add(new THREE.Group());
    O.tremieP = new THREE.Mesh(unitCyl(tr, 16), MAT.steelD); O.tremie.add(O.tremieP);
    O.hopper = new THREE.Mesh(new THREE.CylinderGeometry(tr * 4.2, tr * 1.2, 0.9, 20, 1, true), MAT.steelD); O.tremie.add(O.hopper);
    // CFA-spirál (talajdugóval) / csavart fej / rövid spirál / dobfúró / rúd
    const augLen = S.L + 1.4;
    if (k === 'cfa') {
      O.auger = add(new THREE.Group());
      O.auger.add(new THREE.Mesh(unitCyl(Math.max(0.06, r * 0.22), 16).scale(1, augLen, 1), MAT.steelD));
      O.auger.add(new THREE.Mesh(helixGeom(augLen, r * 0.72, Math.max(0.45, r * 1.3), Math.max(0.03, r * 0.22)), MAT.steel));
      O.plugSoil = new THREE.Mesh(unitCyl(r * 0.9, 24), MAT.spoilS); O.auger.add(O.plugSoil);
      O.augLen = augLen;
    }
    if (k === 'screw') {
      O.auger = add(new THREE.Group());
      O.auger.add(new THREE.Mesh(unitCyl(Math.max(0.06, r * 0.45), 18).scale(1, augLen, 1), MAT.steelD));
      // kiszorító fej: rövid spirál + vastag test + kúp
      const hd = lathe([[0, -augLen - 0.05], [r * 0.5, -augLen + 0.35], [r * 0.98, -augLen + 1.1], [r * 0.98, -augLen + 1.7], [r * 0.55, -augLen + 2.3], [r * 0.45, -augLen + 2.6]], 28);
      O.auger.add(new THREE.Mesh(hd, MAT.steel));
      const fl = helixGeom(0.9, r * 0.85, 0.45, Math.max(0.03, r * 0.16)); fl.translate(0, -augLen + 1.05, 0); O.auger.add(new THREE.Mesh(fl, MAT.steelD));
      O.augLen = augLen;
    }
    if (k === 'dry') {
      O.bucket = add(new THREE.Group());
      const sp = helixGeom(1.6, r * 0.75, Math.max(0.4, r), Math.max(0.03, r * 0.2)); O.bucket.add(new THREE.Mesh(sp, MAT.steel));
      O.bucket.add(new THREE.Mesh(unitCyl(Math.max(0.05, r * 0.2), 12).scale(1, 1.7, 1), MAT.steelD));
      O.bucketLoad = new THREE.Mesh(unitCyl(r * 0.88, 20).scale(1, 1.5, 1), MAT.spoilS); O.bucket.add(O.bucketLoad);
      O.kelly = add(new THREE.Mesh(unitBox().scale(0.22, 1, 0.22), MAT.steelD)); O.bucketH = 1.7;
    }
    if (k === 'casing' || k === 'slurry') {
      O.bucket = add(new THREE.Group());
      O.bucket.add(new THREE.Mesh(unitCyl(r * 0.92, 28).scale(1, 1.4, 1), MAT.steelD));
      O.bucketLoad = new THREE.Mesh(unitCyl(r * 0.86, 24).scale(1, 1.1, 1).translate(0, -0.15, 0), MAT.spoilS); O.bucket.add(O.bucketLoad);
      O.kelly = add(new THREE.Mesh(unitBox().scale(0.26, 1, 0.26), MAT.steelD)); O.bucketH = 1.4;
    }
    if (k === 'micro') {
      O.rod = add(new THREE.Group());
      O.rod.add(new THREE.Mesh(unitCyl(0.026, 10).scale(1, S.L + 0.8, 1), MAT.steelD));
      const bit = new THREE.Mesh(new THREE.ConeGeometry(Math.max(0.05, r * 0.55), 0.18, 12).rotateX(Math.PI).translate(0, -(S.L + 0.8) - 0.05, 0), MAT.steel); O.rod.add(bit);
      O.rodLen = S.L + 0.8;
      O.grout = add(new THREE.Mesh(unitCyl(r, 24), MAT.grout));
    }
    if (k === 'driven') {
      const a = M.D;
      O.pile = add(new THREE.Mesh(S.shape === 'sq' ? unitBox().scale(a, 1, a) : unitCyl(a / 2, 28), MAT.precast));
      O.Lp = S.L + 1.0;
    }
    if (k === 'franki') {
      O.plug = add(new THREE.Mesh(unitCyl(0.24, 24), MAT.plug));
      O.ram = add(new THREE.Mesh(unitCyl(0.17, 20), MAT.steelD));
    }
    // kiszorítási zóna (a homlokon, a cölöp két oldalán)
    O.halo = [];
    if (KISZ(k)) for (const sgn of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, -0.5, 0), MAT.halo); p.scale.x = Math.max(0.35, 1.1 * M.D); p.position.set(sgn > 0 ? rcProfile(0.5) : -rcProfile(0.5) - p.scale.x, 0, 0.008); p.renderOrder = 7; add(p); O.halo.push(p); }
    // depónia
    O.spoil = add(new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24).translate(0, 0.5, 0), MAT.spoilC));
    O.spoil.position.set(3.2 + M.rp, 0, -2.4);
    // törmelék-részecskék (beomlás, talajtörés)
    const pg = new THREE.DodecahedronGeometry(Math.max(0.05, r * 0.16), 0);
    O.parts = add(new THREE.InstancedMesh(pg, MAT.parts, 70));
    O.pseed = Array.from({ length: 70 }, (_, i) => [frac(Math.sin(i * 12.9898) * 43758.5453), frac(Math.sin(i * 78.233) * 12345.678), frac(Math.sin(i * 39.425) * 9876.54)]);
  }

  /* ---- a cölöpbeton sugara a mélység függvényében */
  function rConc(z, st) {
    let r = M.rp;
    const k = S.tech;
    if (k === 'franki') {
      r = 0.3 * (1 + 0.05 * Math.sin(z * 5.5));
      const Rb = 0.8 * M.D * st.bulb, cb = M.Lact - 0.68 * M.D;
      if (Rb > 0.01) { const dz = z - cb; if (Math.abs(dz) < Rb) r = Math.max(r, Math.sqrt(Rb * Rb - dz * dz)); }
    }
    if (M.neck && st.neck) { const [a, b] = M.neck; if (z > a && z < b) r *= 1 - 0.42 * Math.sin((Math.PI * (z - a)) / (b - a)); }
    if (M.incl && st.incl) { const [a, b] = M.incl; if (z > a && z < b) r *= 1 - 0.45 * Math.pow(Math.sin((Math.PI * (z - a)) / (b - a)), 1.3); }
    return Math.max(0.01, r);
  }

  /* ---- lépések technológiánként: apply(st, u) – az előző lépések u = 1-gyel már lefutottak */
  function cycles(u, n, L) { // dobfúró / rövid spirál ciklusai: [mélység, szerszám talpmélysége, teli?]
    const x = u * n, i = Math.min(n - 1, Math.floor(x)), p = x - i;
    const dg = (i + clamp((p - 0.35) / 0.3, 0, 1)) / n * L;
    const prev = (i / n) * L;
    let tip; if (p < 0.35) tip = lerp(-2.2, prev, sm(p / 0.35)); else if (p < 0.65) tip = dg; else tip = lerp(dg, -2.2, sm((p - 0.65) / 0.35));
    return [dg, tip, p >= 0.5];
  }
  function trip(u, L) { let tip; if (u < 0.35) tip = lerp(-2.2, L, sm(u / 0.35)); else if (u < 0.65) tip = L; else tip = lerp(L, -2.2, sm((u - 0.65) / 0.35)); return tip; }
  function blows(u, n) { const x = u * n, i = Math.floor(x), p = x - i; return { adv: (i + sm(clamp(p / 0.25, 0, 1))) / n, lift: p < 0.25 ? 0 : Math.sin(((p - 0.25) / 0.75) * Math.PI) }; }
  function buildSteps() {
    const L = S.L, k = S.tech, gw = M.gw, Lc = M.cageL;
    const cageIn = (st, u, top = -0.3) => { st.cage = { top: lerp(-Lc - 1.2, top, sm(u)) }; st.focus = clamp(st.cage.top + Lc, -2, L); st.span = 7; };
    const done = (st, u) => { st.cured = u; st.focus = L * 0.5 - 1; st.span = L + 6; st.done = u > 0.5; };
    if (k === 'cfa') return [
      { t: 'Kitűzés, pontraállás', dur: 2, d: 'A gép a kitűzött pont fölé áll. Az üreges fúrószár alján a csapóajtó zárva van.', a(st, u) { st.auger = { tip: lerp(-1.4, 0, sm(u)), rot: 0 }; st.focus = -Hm * 0.4; st.span = Hm + 5; } },
      { t: 'Fúrás a talpszintig', dur: 5, d: 'A folyamatos spirál becsavarodik a talajba. A spirálon maradó talajdugó támasztja meg a furat falát – külön megtámasztás nem kell.', a(st, u) { const d = u * L; st.d = d; st.auger = { tip: d, rot: (d / 0.6) * TAU }; st.spoil = 0.75 * u; st.focus = d; st.span = 5.5; st.lab = 'talajdugó a spirálon'; } },
      { t: 'Betonozás a fúrószáron át', dur: 5, d: M.fault ? '<b class="bad">Túl gyors kihúzás!</b> A beton nem tudja kitölteni a spirál helyét – a puha rétegben a cölöp elvékonyodik (nyakasodás).' : 'A betont túlnyomással pumpálják a szár belsején át; a beton feltolja a spirált a talajdugóval, a gép közben húzza. A betonnyomást folyamatosan mérik.', a(st, u) { const tip = L * (1 - sm(u)); st.d = L; st.auger = { tip, rot: (L / 0.6) * TAU }; st.conc = { top: tip, bot: L }; st.neck = true; st.spoil = 0.75 + 0.25 * u; st.focus = tip; st.span = 5.5; if (M.neck && tip < M.neck[0]) st.alert = 'Nyakasodás!'; } },
      { t: 'Vasalás a friss betonba', dur: 3.5, d: 'A vasalókosarat a friss betonba süllyesztik (nyomják, vibrálják). A betont vibrálni nem kell: a folyós konzisztencia és a nyomás alatti bedolgozás tömörít.', a(st, u) { st.auger = { tip: lerp(0, -3, sm(u * 2)), rot: 0, away: u }; cageIn(st, u); } },
      { t: 'Kész a cölöp', dur: 2.5, d: 'Minden cölöpről automatikus jegyzőkönyv készül: mélység, betonnyomás, bedolgozott betonmennyiség.', a(st, u) { st.auger = null; done(st, u); } },
    ];
    if (k === 'casing') return [
      { t: 'Pontraállás, béléscső indítása', dur: 2.5, d: 'A béléscső lefúrását rotációval (vagy vibrálással) kezdik.', a(st, u) { st.casing = { top: -1.2, bot: 1.4 * u }; st.d = 1.4 * u; st.bucket = { tip: -2.2, full: false }; st.focus = -3; st.span = 14; } },
      { t: 'Földkiemelés a béléscső védelmében', dur: 7, d: 'Dobfúróval emelik ki a talajt; szemcsés talajban a béléscső a földkiemelés előtt jár.' + (M.gwIn ? (M.fault ? ' <b class="bad">Nincs vízpótlás:</b> a külső víznyomás a talpon betöri a talajt!' : ' A talajvíz alatt a furatban pótolják a kiemelt vizet.') : ''), a(st, u) {
        const [d, tip, full] = cycles(u, Math.max(5, Math.round(L / 3)), L); st.d = d; st.bucket = { tip, full }; st.casing = { top: -1.2, bot: Math.min(L, d + 1.2) }; st.spoil = 0.85 * u; st.focus = Math.max(d, 0); st.span = 10;
        if (M.gwIn && d > gw) { if (M.fault) { st.boil = clamp((d - gw - 1) / 3, 0, 1); if (st.boil > 0.1) st.alert = 'Talajtörés a talpon!'; } else st.water = { top: gw - 0.6, bot: d }; }
      } },
      { t: 'Talptisztítás', dur: 2, d: 'A furat talpán nem maradhat fellazult, leülepedett talaj – az jelentősen csökkentené a talpellenállást.', a(st, u) { const tip = trip(u, L); st.bucket = { tip, full: u > 0.5 }; st.focus = clamp(tip, 0, L); st.span = 8; } },
      { t: 'Vasalás', dur: 3, d: 'A vasalókosarat a béléscsőbe engedik; távtartók biztosítják a betontakarást.', a(st, u) { st.bucket = null; cageIn(st, u); } },
      { t: 'Betonozás, a cső visszahúzása', dur: 6, d: 'A betont kontraktorcsővel alulról felfelé juttatják be, a béléscsövet közben ütemesen visszahúzzák. A cső vége végig a betonban marad.', a(st, u) { const top = L * (1 - sm(u)); st.conc = { top, bot: L }; st.tremie = { bot: Math.min(L - 0.3, top + 1.6) }; st.casing = { top: -1.2 - (L - Math.min(L, top + 2.2)), bot: Math.min(L, top + 2.2) }; if (st.water) st.water.bot = top; st.focus = top; st.span = 10; } },
      { t: 'Kész a cölöp', dur: 2.5, d: 'Nagy átmérő, nagy mélység: magas víztartalmú, iszapos talajban is biztonságos – cserébe lassabb, összetett gépészet.', a(st, u) { const cb = lerp(2.2, -1.5, sm(u * 2)); st.casing = u < 0.5 ? { top: cb - L - 1.2, bot: cb } : null; st.tremie = null; st.water = null; done(st, u); } },
    ];
    if (k === 'slurry') return [
      { t: 'Pontraállás, előfúrás, vezetőcső', dur: 2.5, d: 'A furat felső részébe rövid acél vezetőcsövet helyeznek.', a(st, u) { st.vez = { top: -0.6, bot: 2.6 * sm(u) }; st.d = 2.6 * sm(u); st.bucket = { tip: -2.2, full: false }; st.focus = -2; st.span = 12; } },
      { t: 'Zagy betöltése', dur: 2, d: 'A furatot bentonitzaggyal töltik fel – a zagyszint jóval a talajvízszint felett van.', a(st, u) { st.slurry = { top: lerp(2.6, -0.3, sm(u)), bot: 2.6 }; st.focus = 1; st.span = 8; st.lab2 = 'bentonitzagy'; } },
      { t: 'Talajkiemelés zagyos megtámasztással', dur: 7, d: M.fault && M.gwIn ? '<b class="bad">A zagyszint a talajvízszint közelébe süllyedt:</b> megszűnik a túlnyomás, a furat fala beomlik.' : 'Dobfúróval emelik ki a talajt. A zagy kiszorítja a talajvizet, és túlnyomásával megtámasztja a furat falát.', a(st, u) {
        const [d, tip, full] = cycles(u, Math.max(5, Math.round(L / 3)), L); st.d = Math.max(2.6, d); st.bucket = { tip, full }; st.slurry = { top: -0.3, bot: st.d }; st.spoil = 0.85 * u; st.focus = Math.max(d, 0); st.span = 10;
        if (M.fault && M.gwIn) { const lv = lerp(-0.3, gw - 0.2, sm((u - 0.15) / 0.35)); st.slurry.top = lv; if (M.collapse && st.d > M.collapse[0] && u > 0.45) { st.collapse = clamp((u - 0.45) / 0.4, 0, 1); st.alert = 'Beomlik a furat fala!'; } }
      } },
      { t: 'Talptisztítás, vasalás', dur: 3.5, d: 'A talpat kitisztítják, majd a vasalókosarat a zagyba engedik.', a(st, u) { st.bucket = null; st.slurry.top = -0.3; cageIn(st, u); } },
      { t: 'Betonozás kontraktorcsővel', dur: 5.5, d: 'A beton alulról tölti ki a furatot, és a könnyebb zagyot felfelé kiszorítja – a zagyot visszanyerik.', a(st, u) { const top = lerp(L, 0.4, sm(u)); st.conc = { top, bot: L }; st.incl = true; st.tremie = { bot: Math.min(L - 0.3, top + 1.6) }; st.slurry = { top: -0.3, bot: top }; st.focus = top; st.span = 10; } },
      { t: 'Betonozás a terepszintig, vezetőcső ki', dur: 2.5, d: 'A betont a terepszintig hozzák fel, majd kiemelik a vezetőcsövet.', a(st, u) { st.conc.top = lerp(0.4, 0, u); st.slurry = u < 0.4 ? { top: -0.3, bot: lerp(0.4, -0.3, u / 0.4) } : null; st.tremie = u < 0.3 ? st.tremie : null; st.vez = { top: -0.6 - 3 * sm(u), bot: 2.6 - 3 * sm(u) }; st.focus = 0; st.span = 8; } },
      { t: 'Kész a cölöp', dur: 2.5, d: 'Elsősorban nagy átmérőjű, nagy mélységű cölöpökhöz; hazánkban főleg nagy fesztávú hidak alapozásához.', a(st, u) { st.vez = null; done(st, u); } },
    ];
    if (k === 'dry') return [
      { t: 'Pontraállás', dur: 2, d: 'Kötött talajban, talajvíz felett, legfeljebb 8–10 m-es furat rövid ideig megtámasztás nélkül is megáll.', a(st, u) { st.bucket = { tip: lerp(-3.5, -2.2, u), full: false }; st.focus = -3; st.span = 13; } },
      { t: 'Fúrás rövid spirállal', dur: 6, d: M.collapse ? '<b class="bad">A furat nem állékony:</b> a talajvíz vagy a szemcsés réteg miatt a fal beomlik!' : 'A rövid spirál ciklusokban hordja fel a talajt.', a(st, u) {
        const [d, tip, full] = cycles(u, Math.max(4, Math.round(L / 1.8)), L); st.d = d; st.bucket = { tip, full }; st.spoil = 0.85 * u; st.focus = Math.max(d, 0); st.span = 9;
        if (M.collapse && d > M.collapse[0] + 0.4) { st.collapse = clamp((d - M.collapse[0] - 0.4) / Math.max(1, L - M.collapse[0]), 0, 1); st.alert = 'Beomlik a furat!'; }
        if (M.collapse && M.gwIn && d > gw) st.water = { top: gw + 0.4, bot: d };
      } },
      { t: 'Vasalás', dur: 3, d: 'A vasalókosarat azonnal a furatba engedik.', a(st, u) { st.bucket = null; cageIn(st, u); } },
      { t: 'Betonozás azonnal', dur: 4, d: 'A kiemelés után rögtön be kell betonozni – betonozó tölcsérrel.', a(st, u) { const top = L * (1 - sm(u)); st.conc = { top, bot: L }; st.incl = true; st.tremie = { bot: Math.min(L - 0.3, top + 1.2) }; if (st.water) st.water.bot = top; st.focus = top; st.span = 9; } },
      { t: 'Kész a cölöp', dur: 2.5, d: L <= 6 ? '5–6 m mélységig az ilyen alapot markolt tömbalapnak, más néven kútalapnak is nevezik.' : 'Egyszerű és olcsó – de csak állékony furatnál.', a(st, u) { st.tremie = null; st.water = null; done(st, u); } },
    ];
    if (k === 'driven') {
      const Lt = M.stuck || L, Lp = O.Lp;
      return [
        { t: 'A cölöp beemelése', dur: 2.5, d: 'Az előregyártott vasbeton cölöpöt a cölöpverő gép vezetőoszlopa tartja függőlegesen.', a(st, u) { st.pile = { tip: lerp(-2.5, 0, sm(u)), top: lerp(-2.5, 0, sm(u)) - Lp }; st.hammer = { lift: 0.8 }; st.focus = -Lp * 0.45; st.span = Lp + 6; } },
        { t: 'Verés', dur: 6.5, d: M.stuck ? `<b class="bad">Elakadt!</b> ${M.P.blocks ? 'A tömbös feltöltésen' : 'A kemény agyagban'} a cölöp nem jut le a tervezett mélységig.` : 'A kalapácsütések a cölöpöt a talajba hajtják; a kiszorított talaj tömörödik – nő a talp- és a köpenymenti ellenállás.', a(st, u) {
          const b = blows(u, 34), want = b.adv * L, tip = Math.min(Lt, want);
          st.pile = { tip, top: tip - Lp }; st.hammer = { lift: b.lift }; st.d = tip; st.halo = tip; st.focus = tip; st.span = 10; st.vibe = b.lift;
          if (M.stuck && want > Lt + 0.3) st.alert = 'Elakadt!';
        } },
        { t: 'Cölöpfejezés', dur: 2.5, d: M.stuck ? 'A kilógó részt levágják – de a cölöp nem érte el a tervezett talpszintet.' : 'A leverés után a cölöp fejét a tervezett szintig visszabontják.', a(st, u) { st.pile.top = lerp(Lt - Lp, -0.4, sm(u)); st.hammer = { lift: 0, away: u }; st.focus = 0; st.span = 8; } },
        { t: 'Kész a cölöp', dur: 2.5, d: 'Gyors és nagy teherbírású – de a verés jelentős zajjal és rezgéssel jár.', a(st, u) { st.hammer = { away: 1 }; done(st, u); } },
      ];
    }
    if (k === 'franki') {
      const Lr = 0.68 * M.D;
      return [
        { t: 'Béléscső, betondugó', dur: 2.5, d: 'A 46–52 cm-es béléscső aljába kb. 1 m magas száraz betondugót töltenek.', a(st, u) { st.casing = { top: -1.6 - L, bot: 0 }; st.plug = { top: lerp(-3, -1, sm(u)), bot: lerp(-2, 0, sm(u)) }; st.ram = { bot: -2 - 1.8 }; st.focus = -4; st.span = 14; } },
        { t: 'Verés belső ejtőkossal', dur: 6, d: 'A 3 t-ás ejtőkos a dugót döngöli; a dugó a súrlódás révén magával húzza a csövet a teherbíró rétegig.', a(st, u) { const b = blows(u, 30), z = b.adv * L; st.casing = { top: z - 1.6 - L, bot: z }; st.plug = { top: z - 1, bot: z }; st.ram = { bot: z - 1 - b.lift * 2.2 }; st.d = z; st.halo = z; st.focus = z; st.span = 10; st.vibe = b.lift; st.lab = 'ejtőkos'; } },
        { t: 'Dugó kiverése, hagyma', dur: 3.5, d: 'A csövet rögzítik, a dugót kiverik, és újabb betonadagokkal kiszélesedő talpat – „hagymát” – döngölnek.', a(st, u) { const b = blows(u, 10); st.casing = { top: -1.6 - Lr, bot: L - Lr }; st.plug = u < 0.25 ? { top: L - 1 + u * 2, bot: L } : null; st.bulb = sm(u); st.conc = { top: L - Lr - 0.8 * M.D * st.bulb, bot: L + 0.2 }; st.ram = { bot: st.conc.top - b.lift * 1.6 }; st.focus = L; st.span = 8; st.vibe = b.lift; st.lab = 'hagyma'; } },
        { t: 'Vasalás', dur: 3, d: 'A vasalókosarat a béléscsőbe engedik.', a(st, u) { st.ram = { bot: lerp(L - 2, -3, sm(u)) }; cageIn(st, u); } },
        { t: 'Köpeny betonozása, cső visszahúzása', dur: 5.5, d: 'Betonadagolás és döngölés közben a béléscsövet visszahúzzák. A kiszorítás miatt a kész cölöp kb. 60 cm átmérőjű.', a(st, u) { const top = lerp(st.conc.top, 0, sm(u)), cb = Math.min(L - Lr, top + 0.4); st.conc = { top, bot: L + 0.2 }; st.casing = { top: cb - L - 1.6, bot: cb }; st.ram = { bot: Math.max(-2, top - 0.3) - blows(u, 24).lift * 1.4 }; st.focus = top; st.span = 10; } },
        { t: 'Kész a cölöp', dur: 2.5, d: 'Legfeljebb 16–18 m hosszú; 2000–3000 kN-os teherbírás is elérhető. Hazánkban mára szinte teljesen eltűnt.', a(st, u) { st.casing = null; st.ram = null; done(st, u); } },
      ];
    }
    if (k === 'screw') return [
      { t: 'Pontraállás', dur: 2, d: 'Az üreges fúrószár végén speciális kiszorító fúrófej van.', a(st, u) { st.auger = { tip: lerp(-1.4, 0, sm(u)), rot: 0 }; st.focus = -Hm * 0.4; st.span = Hm + 5; } },
      { t: 'Fúrás forgatással és tolással', dur: 5, d: 'A fej széttolja és tömöríti maga körül a talajt – a felszínre alig kerül furatanyag.', a(st, u) { const d = u * L; st.d = d; st.auger = { tip: d, rot: (d / 0.5) * TAU }; st.halo = d; st.focus = d; st.span = 9; st.lab = 'kiszorító fej'; } },
      { t: 'Betonozás a szár kiemelése közben', dur: 4.5, d: 'A betont nyomás alatt a fúrószáron át juttatják be, a szárat forgatva emelik ki.', a(st, u) { const tip = L * (1 - sm(u)); st.d = L; st.auger = { tip, rot: (L / 0.5 + (L - tip) / 0.5) * TAU }; st.conc = { top: tip, bot: L }; st.focus = tip; st.span = 9; } },
      { t: 'Vasalás vibrálással', dur: 3.5, d: 'Az előregyártott vasalókosarat vibrálással juttatják le a friss betonba.', a(st, u) { st.auger = { tip: lerp(0, -3, sm(u * 2)), rot: 0, away: u }; cageIn(st, u); st.vibe = 0.3; } },
      { t: 'Kész a cölöp', dur: 2.5, d: 'Nincs dinamikus és zajhatás; a kiszorítás miatt nő a fajlagos teherbírás.', a(st, u) { st.auger = null; done(st, u); } },
    ];
    // mikrocölöp
    return [
      { t: 'Pontraállás kis géppel', dur: 2, d: 'A kis gép nehezen megközelíthető, alacsony belmagasságú helyen is dolgozhat.', a(st, u) { st.rod = { tip: lerp(-0.8, 0, sm(u)), rot: 0 }; st.focus = -2; st.span = 7; } },
      { t: 'Fúrás és injektálás egyszerre', dur: 6, d: 'Elvesző fúrófejes, üreges acélrudat hajtanak le (toldással), és közben folyamatosan injektálnak cementhabarccsal.', a(st, u) { const d = u * L; st.d = d; st.rod = { tip: d, rot: (d / 0.3) * TAU }; st.grout = { top: 0, bot: d }; st.focus = d; st.span = 7; st.lab = 'injektált cementtest'; } },
      { t: 'Kész a mikrocölöp', dur: 3, d: 'A rúd körül 20–50 mm-es cementtest, kívül 30–80 mm-es cementtel átitatott talajköpeny alakul ki. A teherbírásnál a csúcsellenállást figyelmen kívül hagyjuk.', a(st, u) { st.rod = { tip: L, rot: 0 }; done(st, u); } },
    ];
  }
  const st0 = () => ({ d: 0, auger: null, bucket: null, rod: null, pile: null, hammer: null, casing: null, vez: null, slurry: null, water: null, conc: null, bulb: 0, cage: null, tremie: null, plug: null, ram: null, grout: null, halo: 0, spoil: 0, collapse: 0, boil: 0, neck: false, incl: false, cured: 0, focus: 0, span: 10, alert: null, lab: null, lab2: null, vibe: 0, done: false });
  function stateAt(T) {
    const st = st0(); let acc = 0, k = 0;
    for (; k < steps.length; k++) { const s = steps[k]; if (T < acc + s.dur || k === steps.length - 1) break; s.a(st, 1); acc += s.dur; }
    st.lab = null; st.lab2 = null; st.vibe = 0; st.alert = st.alert || null;
    const u = clamp((T - acc) / steps[k].dur, 0, 1);
    steps[k].a(st, u);
    st.k = k; st.u = u;
    return st;
  }

  /* ---- állapot → jelenet */
  function apply(st) {
    clipStrip.constant = -st.d; clipWall.constant = st.d;
    const k = S.tech, L = S.L;
    // beton
    const ck = st.conc ? [st.conc.top.toFixed(2), st.conc.bot.toFixed(2), st.bulb.toFixed(2), st.neck, st.incl].join() : '';
    if (ck !== O.concKey) {
      O.concKey = ck; O.conc.geometry.dispose();
      if (st.conc && st.conc.bot - st.conc.top > 0.02) { O.conc.geometry = solidProfile(Math.max(-0.2, st.conc.top), st.conc.bot, (z) => rConc(z, st)); O.conc.visible = true; }
      else { O.conc.geometry = new THREE.BufferGeometry(); O.conc.visible = false; }
    }
    O.conc.material = st.cured > 0.5 ? MAT.cured : MAT.fresh;
    // talajbetüremkedés (nyakasodás / beomlás)
    const zone = (M.neck && st.neck) ? M.neck : (M.incl && st.incl) ? M.incl : null;
    const ik = zone && st.conc && st.conc.top < zone[0] ? zone.join() : '';
    if (ik !== O.inclKey) {
      O.inclKey = ik; O.incl.geometry.dispose();
      if (ik) { const lay = layerAt(M.P, (zone[0] + zone[1]) / 2); O.incl.material = SM[lay.k].incl; O.incl.geometry = ringProfile(zone[0], zone[1], (z) => rConc(z, st), rcProfile((zone[0] + zone[1]) / 2) + 0.003); O.incl.visible = true; }
      else { O.incl.geometry = new THREE.BufferGeometry(); O.incl.visible = false; }
    }
    // kosár
    if (st.cage) { O.cage.visible = true; O.cage.position.set(st.vibe ? Math.sin(performance.now() / 30) * 0.01 : 0, -st.cage.top, 0); } else O.cage.visible = false;
    // csövek, folyadékok
    if (st.casing) { span(O.casing, st.casing.top, st.casing.bot); } else O.casing.visible = false;
    if (st.vez) span(O.vez, st.vez.top, st.vez.bot); else O.vez.visible = false;
    if (st.slurry) span(O.slurry, st.slurry.top, st.slurry.bot); else O.slurry.visible = false;
    if (st.water) span(O.water, st.water.top, st.water.bot); else O.water.visible = false;
    if (st.tremie) { O.tremie.visible = true; span(O.tremieP, -1.6, st.tremie.bot); O.tremieP.visible = true; O.hopper.position.y = 1.9; } else O.tremie.visible = false;
    // szerszámok
    const headAt = (y) => { O.head.visible = true; O.head.position.set(0, y, 0); };
    O.cable.visible = false;
    if (O.auger) {
      if (st.auger) {
        O.auger.visible = true; const tip = st.auger.tip; O.auger.position.set(0, -tip + O.augLen, 0); O.auger.rotation.y = st.auger.rot || 0;
        if (O.plugSoil) { const len = Math.min(O.augLen, tip + 0.4); if (tip > 0.05 && !st.auger.away) span(O.plugSoil, O.augLen - len, O.augLen); else O.plugSoil.visible = false; }
        headAt(-tip + O.augLen + 0.55);
      } else { O.auger.visible = false; headAt(Hm - 0.6); }
    }
    if (O.bucket) {
      if (st.bucket) {
        O.bucket.visible = true; O.bucket.position.y = -st.bucket.tip + O.bucketH; O.bucket.rotation.y = st.bucket.tip * 2.2; O.bucketLoad.visible = !!st.bucket.full;
        const hy = Hm - 0.8; headAt(hy); O.kelly.visible = true; O.kelly.position.y = hy; O.kelly.scale.y = Math.max(0.1, hy + st.bucket.tip - O.bucketH);
      } else { O.bucket.visible = false; O.kelly.visible = false; headAt(Hm - 0.8); }
    }
    if (O.rod) {
      if (st.rod) { O.rod.visible = true; O.rod.position.y = -st.rod.tip + O.rodLen; O.rod.rotation.y = st.rod.rot; headAt(-st.rod.tip + O.rodLen + 0.5); } else { O.rod.visible = false; headAt(Hm - 0.5); }
      if (st.grout) span(O.grout, st.grout.top, st.grout.bot); else O.grout.visible = false;
      O.grout.material = st.cured > 0.5 ? MAT.cured : MAT.grout;
    }
    if (O.pile) {
      if (st.pile) span(O.pile, st.pile.top, st.pile.tip); else O.pile.visible = false;
      const away = st.hammer?.away || 0;
      if (st.hammer && away < 1) headAt((st.pile ? -st.pile.top : 2) + 0.55 + (st.hammer.lift || 0) * 1.1 + away * 4); else headAt(Hm - 0.8);
    }
    if (k === 'franki') {
      if (st.plug) span(O.plug, st.plug.top, st.plug.bot); else O.plug.visible = false;
      if (st.ram) { span(O.ram, st.ram.bot - 1.8, st.ram.bot); const pts = O.cable.geometry.attributes.position; pts.setXYZ(0, 0, O.mastTop, 0); pts.setXYZ(1, 0, -st.ram.bot + 1.8, 0); pts.needsUpdate = true; O.cable.visible = true; O.cable.geometry.computeBoundingSphere(); } else O.ram.visible = false;
      headAt(O.mastTop - 0.6);
    }
    // kiszorítási zóna
    for (const p of O.halo) { p.visible = st.halo > 0.05 && S.view !== 'csoport'; p.scale.y = Math.max(0.01, st.halo); }
    // depónia
    const sv = st.spoil * Math.min(1.6, Math.cbrt(M.spoilV + 0.01) * 0.9);
    O.spoil.visible = sv > 0.03; O.spoil.scale.set(0.3 + sv * 1.2, 0.2 + sv * 0.9, 0.3 + sv * 1.2);
    // részecskék
    const n = O.parts.count, mtx = new THREE.Matrix4(), r = M.rp;
    let vis = 0;
    if (st.collapse > 0 && M.collapse) {
      const [a, b] = M.collapse;
      for (let i = 0; i < n; i++) {
        const [s1, s2, s3] = O.pseed[i], t0 = s1 * 0.6, p = clamp((st.collapse - t0) / 0.4, 0, 1);
        if (p <= 0) { mtx.makeScale(0, 0, 0); O.parts.setMatrixAt(i, mtx); continue; }
        const zStart = a + s2 * (b - a), ang = Math.PI / 2 + s3 * Math.PI, rad = r * (0.95 - 0.7 * p);
        const zEnd = Math.min(st.d - 0.05, b + 0.3 + s2 * 1.2);
        mtx.makeTranslation(Math.sin(ang) * rad, -lerp(zStart, zEnd, p * p), Math.min(-0.03, Math.cos(ang) * rad)); O.parts.setMatrixAt(i, mtx); vis++;
      }
    } else if (st.boil > 0) {
      for (let i = 0; i < n; i++) {
        const [s1, s2, s3] = O.pseed[i], ph = frac(s1 + performance.now() / 2400), rad = r * 0.8 * s2, ang = Math.PI / 2 + s3 * Math.PI;
        const z = st.d + 0.2 - ph * 1.8 * st.boil;
        mtx.makeTranslation(Math.sin(ang) * rad, -z, Math.min(-0.03, Math.cos(ang) * rad)); O.parts.setMatrixAt(i, mtx); vis++;
      }
    } else for (let i = 0; i < n; i++) { mtx.makeScale(0, 0, 0); O.parts.setMatrixAt(i, mtx); }
    O.parts.instanceMatrix.needsUpdate = true; O.parts.visible = vis > 0;
    // dinamikus címkék
    const lx = r + 0.45;
    setLab(DL.tool, st.lab && st.k !== undefined, st.lab || '', -lx - 0.2, -Math.max(0.6, st.focus - 0.6), 0.05);
    setLab(DL.conc, st.conc && st.conc.bot - st.conc.top > 1.2 && !st.done, st.cured > 0.5 ? 'beton' : 'friss beton', lx + 0.3, -Math.min(st.conc?.bot - 0.8 || 0, (st.conc?.top || 0) + 1.2), 0.05);
    setLab(DL.cage, st.cage && !st.done, 'vasalókosár', lx + 0.4, -clamp(st.cage ? st.cage.top + 1.6 : 0, -1, L), 0.05);
    setLab(DL.casing, st.casing && (k === 'casing' || k === 'franki'), 'béléscső', -lx - 0.35, 0.9, 0.05);
    const fluidOn = st.slurry && st.slurry.bot - st.slurry.top > 1.5;
    setLab(DL.fluid, fluidOn || (st.water && st.water.bot - st.water.top > 1.5), fluidOn ? 'bentonitzagy' : 'víz a furatban', lx + 0.3, -((fluidOn ? st.slurry.top : st.water?.top || 0) + 1.0), 0.05);
    setLab(DL.extra, st.tremie && !st.done, 'kontraktorcső', -lx - 0.4, -Math.min(2.5, st.tremie?.bot || 0), 0.05);
    const zl = O.incl.visible && zone;
    setLab(DL.zone, zl, M.neck && st.neck ? 'nyakasodás' : 'beomlás → folytonossági hiány', -lx - 0.6, zl ? -(zone[0] + zone[1]) / 2 : 0, 0.05);
    setLab(DL.halo, st.halo > 1.5 && S.view !== 'csoport', 'tömörödött talaj', rcProfile(1) + 1.1 * M.D + 0.9, -Math.min(st.halo * 0.5, 4), 0.05);
    // riasztás + lépésszöveg
    const s = steps[st.k];
    stepEl.innerHTML = `<b>${st.k + 1}/${steps.length}</b> <span class="sim-st">${s.t}</span><span class="sim-sd">${s.d}</span>`;
    alertEl.innerHTML = '';
    if (st.alert) alertEl.append(h('span', { class: 'a-bad' }, st.alert));
    if (st.done) alertEl.append(h('span', { class: M.items.some((i) => i.s === 'bad') ? 'a-bad' : M.items.some((i) => i.s === 'warn') ? 'a-warn' : 'a-ok' }, `${M.cls} cölöp · talp ${Math.round(M.share * 100)} %`));
    [...chips.children].forEach((c, i) => { c.classList.toggle('on', i === st.k); c.classList.toggle('done', i < st.k || (i === st.k && st.u >= 1)); });
    curSt = st;
  }

  /* ---- cölöpcsoport-nézet (3×3 + fejtömb) */
  function buildGroup() {
    disposeGroup(G.group);
    const g = G.group, D = M.D, s = Math.max(3 * D, 1.0), zc = -ZB / 2, L = M.Lact;
    const fin = { ...st0(), bulb: 1, cured: 1, neck: true, incl: true };
    let geo;
    if (S.tech === 'driven') geo = S.shape === 'sq' ? new THREE.BoxGeometry(D, L, D).translate(0, -L / 2, 0) : new THREE.CylinderGeometry(D / 2, D / 2, L, 24).translate(0, -L / 2, 0);
    else geo = solidProfile(0, S.tech === 'franki' ? L + 0.2 : L, (z) => rConc(z, fin));
    const pm = tmp(lam(0xb9b6ae));
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const m = new THREE.Mesh(geo, pm); m.position.set(i * s, -0.9, zc + j * s); g.add(m); }
    const B = 2 * s + 2 * Math.max(D, 0.5), Hc = Math.max(1.0, 0.9 + D * 0.6);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(B, Hc, B), tmp(lam(0xc9c5bb))); cap.position.set(0, -Hc / 2, zc); g.add(cap);
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(cap.geometry), tmp(new THREE.LineBasicMaterial({ color: 0x3b3f44, transparent: true, opacity: 0.5 }))); ed.position.copy(cap.position); g.add(ed);
    const col = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.7, B * 0.22), 2.2, Math.max(0.7, B * 0.22)), tmp(lam(0xd5d1c7))); col.position.set(0, 1.1, zc); g.add(col);
    M.grp = { s, B, Hc, zc };
  }

  /* ---- kamera */
  let camDist = 0, userK = 1, userAct = false, curSt = null, fFocus = 0, fSpan = 10, camInit = false;
  const dirK = new THREE.Vector3(0.42, 0.2, 1).normalize();
  function fitDist(spanV) { const t = Math.tan((camera.fov / 2) * Math.PI / 180), asp = camera.aspect || 1.4; return Math.max(spanV / 2 / t, (spanV * 0.55) / (t * asp)) * 1.05; }
  function setMode(v) {
    S.view = v;
    const grp = v === 'csoport';
    G.group.visible = grp; G.pile.visible = !grp; G.rig.visible = !grp; O.groundCut.visible = !grp; O.groundFull.visible = grp;
    setXray(grp);
    for (const [key, L] of Object.entries(DL)) L.el.classList.toggle('hid', grp || (v === 'teljes' && key !== 'zone'));
    grpLabs.forEach((L) => (L.on = grp));
    clipStrip.constant = grp ? 0 : -(curSt?.d || 0); clipWall.constant = grp ? 0 : curSt?.d || 0;
  }
  function setView(v, instant = false) {
    setMode(v);
    if (!controls) return;
    const grp = v === 'csoport';
    let pos, tgt;
    if (v === 'teljes') { const top = Hm + 1, bot = -YB, sp = top - bot; tgt = new THREE.Vector3(0, (top + bot) / 2, -1.5); pos = tgt.clone().add(new THREE.Vector3(0.38, 0.1, 1).normalize().multiplyScalar(fitDist(sp) * 0.98)); }
    else if (grp) { const sp = M.Lact + 4, Lx = M.grp.B + 4; tgt = new THREE.Vector3(0, -M.Lact / 2 + 1, M.grp.zc); pos = tgt.clone().add(new THREE.Vector3(0.75, 0.42, 1).normalize().multiplyScalar(Math.max(fitDist(sp), fitDist(Lx * 0.8)) * 1.05)); }
    else { fFocus = curSt ? curSt.focus : 0; fSpan = curSt ? curSt.span : 10; userK = 1; camDist = fitDist(fSpan); tgt = new THREE.Vector3(0, -fFocus - fSpan * 0.1, -0.3); pos = tgt.clone().add(dirK.clone().multiplyScalar(camDist)); }
    if (instant) { camera.position.copy(pos); controls.target.copy(tgt); controls.update(); }
    else tween = { t0: performance.now(), from: { pos: camera.position.clone(), tgt: controls.target.clone() }, to: { pos, tgt } };
    req();
  }
  let tween = null;
  const grpLabs = [mkLab('tool acc'), mkLab('tool'), mkLab('tool')];
  function setGrpLabs() {
    if (!M.grp) return; const { s, B, Hc, zc } = M.grp;
    setLab(grpLabs[0], S.view === 'csoport', 'vasbeton fejtömb', B / 2 + 0.3, -Hc / 2, zc + B / 2);
    setLab(grpLabs[1], S.view === 'csoport', `tengelytáv itt 3·D = ${fmt(s, 2)} m`, 0, -M.Lact * 0.55, zc + s);
    setLab(grpLabs[2], S.view === 'csoport', `${M.cls} cölöpök · L = ${fmt(M.Lact, 1)} m`, -B / 2 - 0.5, -M.Lact * 0.8, zc - s);
  }

  /* ---- render-ciklus (csak ha kell) */
  let visible = false, pending = false, lastT = 0, warm = 0;
  function req() { if (!pending && renderer) { pending = true; requestAnimationFrame(frame); } }
  function frame(t) {
    pending = false;
    const dtr = lastT ? (t - lastT) / 1000 : 0, dt = Math.min(0.05, dtr); lastT = t;
    let again = false;
    if (playing && visible) {
      T = Math.min(total, T + dt);
      setTl();
      if (T >= total) { playing = false; paintPlay(); }
      again = true;
    }
    if (curSt && (playing || curSt.boil > 0 || curSt.vibe)) { apply(stateAt(T)); if (curSt.boil > 0 && visible) again = true; }
    if (tween) {
      const k = clamp((t - tween.t0) / 800, 0, 1), s = sm(k);
      camera.position.lerpVectors(tween.from.pos, tween.to.pos, s); controls.target.lerpVectors(tween.from.tgt, tween.to.tgt, s); controls.update();
      if (k >= 1) tween = null; else again = true;
    } else if (S.view === 'kozeli' && curSt && controls && !userAct) {
      const kf = 1 - Math.exp(-Math.min(0.1, dt || 0.03) * 5);
      fFocus = lerp(fFocus, curSt.focus, kf); fSpan = lerp(fSpan, curSt.span, kf);
      camDist = fitDist(fSpan);
      const dir = camera.position.clone().sub(controls.target).normalize();
      const tgt = new THREE.Vector3(0, -fFocus - fSpan * 0.1, -0.3), want = tgt.clone().add(dir.multiplyScalar(camDist * userK));
      const moved = want.distanceTo(camera.position) > 0.005 || tgt.distanceTo(controls.target) > 0.005;
      if (moved) { controls.target.copy(tgt); camera.position.copy(want); controls.update(); again = true; }
    }
    if (visible) { renderer.render(scene, camera); placeLabs(); if (warm > 0) { warm--; again = true; } }
    if (again && visible) req(); else lastT = 0;
  }
  if (renderer) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) { warm = 24; req(); } }, { threshold: [0, 0.05, 0.5] }).observe(stage);
    const resize = () => {
      const w = stage.clientWidth || 600;
      const hh = Math.round(w * (w < 560 ? 1.12 : w < 820 ? 0.82 : 0.64));
      stage.style.height = hh + 'px'; renderer.setSize(w, hh, false);
      camera.aspect = w / hh; camera.updateProjectionMatrix(); warm = Math.max(warm, 6); req();
    };
    new ResizeObserver(resize).observe(stage); resize();
  }

  /* ---- teljes újraépítés */
  function techRanges() {
    const T = TECH[S.tech];
    cD.input.min = T.D[0]; cD.input.max = T.D[1]; cD.input.step = T.D[2];
    cD.el.classList.toggle('sim-off', T.D[0] === T.D[1]); cD.input.disabled = T.D[0] === T.D[1];
    cShape.el.style.display = S.tech === 'driven' ? '' : 'none';
    techChip.innerHTML = `<span class="chip grp">${T.g}</span>`;
    dNote.innerHTML = { franki: 'A cső 46–52 cm-es; a kész cölöp a kiszorítás miatt kb. 60 cm átmérőjű.', driven: 'Négyzetes: 30×30 vagy 40×40 cm, L = 4–12 m · kör (pörgetett): D = 25–50 cm, L ≤ 20–22 m.', micro: 'Mikrocölöp: fúrt törzsátmérő legfeljebb 250–300 mm.', cfa: 'CFA: D = 40–120 cm, L legfeljebb 22–24 m.', casing: 'Béléscsöves: D = 80–180 cm, L = 15–50 (100) m.', slurry: 'Zagyos: D = 80–180 cm, L = 15–50 m.', dry: 'Megtámasztás nélkül: legfeljebb 8–10 m mélységig.', screw: 'Csavart: D = 300–600 mm, L legfeljebb kb. 20 m.' }[S.tech];
    const f = T.fault;
    cFault.el.style.display = f ? '' : 'none'; fNote.style.display = f ? '' : 'none';
    if (f) { cFault.el.querySelector('span').textContent = f; fNote.textContent = 'Kapcsold be, és nézd meg, mi romlik el – és mit árul el a lista.'; }
    else { fNote.style.display = ''; fNote.textContent = S.tech === 'dry' ? 'Itt a talaj dönt: próbáld ki talajvíz alatt vagy homokban.' : 'Ennél a technológiánál a talaj és a hossz dönt – figyeld a listát.'; }
    ytBox.innerHTML = '';
    if (T.yt) { ytBox.append(h('div', { class: 'sim-ctl-h' }, 'Valós felvétel')); const b = h('button', {}); ytMini(b, T.yt); ytBox.append(b); }
  }
  function rebuild(keepT = false) {
    S.D = cD.v; S.L = cL.v;
    M = evaluate(S);
    const D = M.D;
    // furat / kiszorítás körvonala
    const r0 = { casing: M.rp + 0.04, slurry: M.rp + 0.005, franki: 0.31, driven: M.rp, micro: M.rp }[S.tech] ?? M.rp + 0.005;
    const Lc = M.Lact;
    rcProfile = (z) => {
      if (z > Lc + (S.tech === 'franki' ? 0.25 : 0.0)) return 0;
      let r = r0;
      if (S.tech === 'slurry' && z < 2.6) r = M.rp + 0.13;
      if (S.tech === 'franki') { const Rb = 0.8 * D, cb = Lc - 0.68 * D, dz = z - cb; if (Math.abs(dz) < Rb) r = Math.max(r, Math.sqrt(Rb * Rb - dz * dz) + 0.004); }
      return r;
    };
    const s = Math.max(3 * D, 1.0);
    W = Math.max(14, 2 * s + 2 * D + 6); ZB = Math.max(9, 2 * s + 2 * D + 3);
    YB = Math.max(16, Math.ceil((Math.max(S.L, M.P.bear || 0) + 5) / 2) * 2);
    buildSoil(); buildRig(); buildPile(); buildGroup(); setGrpLabs();
    steps = buildSteps(); total = steps.reduce((a, s) => a + s.dur, 0);
    chips.innerHTML = '';
    steps.forEach((s, i) => { const b = h('button', { type: 'button' }, h('i', {}, String(i + 1)), s.t); b.addEventListener('click', () => { playing = false; paintPlay(); T = steps.slice(0, i).reduce((a, x) => a + x.dur, 0) + 0.001; setTl(); apply(stateAt(T)); req(); }); chips.append(b); });
    if (!keepT) T = total;
    T = Math.min(T, total);
    setTl();
    apply(stateAt(T));
    renderOut();
    if (!camInit || S.view !== 'kozeli') { setView(S.view, !camInit); camInit = true; } else setMode(S.view);
    req();
  }

  function renderOut() {
    const cap = M.cap, pct = (x) => Math.round(x * 100);
    const kop = 1 - M.share;
    oTalp.set('', M.share >= 2 / 3 ? 'ok' : null, `${pct(M.share)}<small>%</small>`);
    oKop.set('', kop >= 2 / 3 ? 'ok' : null, `${pct(kop)}<small>%</small>`);
    oCls.set(M.cls, M.items.some((i) => i.s === 'bad') ? 'bad' : null, M.cls);
    oRel.set('', M.rel > 1.05 ? 'ok' : M.rel < 0.95 ? 'warn' : null, `${fmt(M.rel, 2)}<small>×</small>`);
    oSpoil.set('', M.spoilV === 0 ? 'ok' : null, M.spoilV === 0 ? '0<small>m³ – kiszorítja</small>' : `${fmt(M.spoilV, M.spoilV < 10 ? 1 : 0)}<small>m³</small>`);
    oConc.set('', M.neck ? 'bad' : M.collapse ? 'warn' : null, S.tech === 'driven' ? '–<small>előregyártott</small>' : M.neck || M.collapse ? `${fmt(M.concAct, 1)}<small>m³ (elméleti ${fmt(M.concV, 1)})</small>` : `${fmt(M.concV, M.concV < 10 ? 1 : 0)}<small>m³</small>`);
    oVib.set(M.vib, M.vib === 'nagy' ? (S.nb ? 'bad' : 'warn') : M.vib === 'jelentős' ? 'warn' : 'ok', M.vib);
    // arány-sáv rétegenként
    ratio.innerHTML = '';
    const R = cap.R || 1;
    const bar = h('div', { class: 'sim-rbar' }, h('span', { class: 'b', style: { width: (cap.Rb / R) * 100 + '%' }, title: `talp: ${pct(cap.Rb / R)} %` }, cap.Rb / R > 0.12 ? 'talp' : ''),
      ...cap.parts.filter((p) => p.R > 0).map((p) => h('span', { class: 's', style: { width: (p.R / R) * 100 + '%', background: hex(p.c) }, title: `köpeny – ${p.n}: ${pct(p.R / R)} %` }, p.R / R > 0.14 ? p.n : '')),
      h('i', { class: 'm1' }), h('i', { class: 'm2' }), h('em', { class: 'ptr', style: { left: M.share * 100 + '%' } }));
    ratio.append(h('div', { class: 'sim-rh' }, h('b', {}, 'Teherátadás'), h('span', {}, 'talpellenállás + köpenymenti ellenállás rétegenként · szemléltető modell')), bar,
      h('div', { class: 'sim-rz' }, h('span', { class: M.cls === 'lebegő' ? 'on' : '' }, 'lebegő (talp\u00A0≤\u00A01/3)'), h('span', { class: M.cls === 'vegyes' ? 'on' : '' }, 'vegyes'), h('span', { class: M.cls === 'álló' ? 'on' : '' }, 'álló (talp\u00A0≥\u00A02/3)')));
    // ellenőrző lista
    const order = { bad: 0, warn: 1, ok: 2, info: 3 }, items = [...M.items].sort((a, b) => order[a.s] - order[b.s]);
    const cnt = (s) => M.items.filter((i) => i.s === s).length;
    checkBox.innerHTML = '';
    checkBox.append(h('div', { class: 'sim-check-h' }, h('b', {}, 'Ellenőrző lista'), h('span', {}, `${PROF[S.prof].n.slice(4)} · ${TECH[S.tech].t} · D = ${S.D} cm · L = ${fmt(S.L, 1)} m`),
      h('span', { class: 'sim-sum' }, cnt('bad') ? h('span', { class: 'chip bad' }, `${cnt('bad')} hiba`) : null, cnt('warn') ? h('span', { class: 'chip warn' }, `${cnt('warn')} figyelmeztetés`) : null, h('span', { class: 'chip ok' }, `${cnt('ok')} rendben`))));
    const ul = h('ul', { class: 'sim-list' });
    for (const it of items) ul.append(h('li', { 'data-s': it.s }, h('i', {}, it.s === 'ok' ? '✓' : it.s === 'info' ? 'i' : it.s === 'bad' ? '✕' : '!'), h('b', {}, it.t), h('span', { html: it.d })));
    checkBox.append(ul, h('p', { class: 'sim-more' }, 'Részletesen: ', h('a', { href: TECH[S.tech].link }, TECH[S.tech].t + ' →')));
  }

  /* ---- vezérlők bekötése */
  function setTl() { tl.value = Math.round((T / total) * 1000); tl.style.setProperty('--p', (tl.value / 10) + '%'); }
  const paintPlay = () => { bPlay.textContent = playing ? '❚❚ Szünet' : T >= total - 0.001 ? '↺ Újra' : T > 0.01 ? '▶ Folytatás' : '▶ Építés'; };
  let rbPending = false;
  const schedule = (keep = false) => { if (rbPending) return; rbPending = true; requestAnimationFrame(() => { rbPending = false; playing = false; rebuild(keep); paintPlay(); }); };
  cProf.on((v) => { S.prof = v; schedule(); });
  cNb.on((v) => { S.nb = v; schedule(true); });
  cTech.on((v) => { S.tech = v; const T = TECH[v]; techRanges(); cD.set(T.D[3], false); if (S.L > 24 && v === 'cfa') cL.set(T.L, false); if (v === 'dry' && S.L > 10) cL.set(T.L, false); S.fault = false; cFault.set(false, false); schedule(); });
  cShape.on((v) => { S.shape = v; schedule(); });
  cD.on(() => schedule());
  cL.on(() => schedule());
  cFault.on((v) => { S.fault = v; schedule(); });
  viewSeg.on((v) => { setView(v); setGrpLabs(); });
  tl.addEventListener('input', () => { playing = false; T = (tl.value / 1000) * total; tl.style.setProperty('--p', (tl.value / 10) + '%'); apply(stateAt(T)); paintPlay(); req(); });
  const startAt = () => steps.reduce((acc, s, i) => { acc.push((acc[i - 1] ?? 0) + (i ? steps[i - 1].dur : 0)); return acc; }, []);
  bPlay.addEventListener('click', () => {
    if (S.view === 'csoport') { viewSeg.set('kozeli'); }
    if (playing) { playing = false; paintPlay(); return; }
    if (T >= total - 0.001) T = 0;
    playing = true; lastT = 0; paintPlay(); req();
  });
  bPrev.addEventListener('click', () => { playing = false; const st = startAt(); const k = curSt ? curSt.k : 0; const i = curSt && curSt.u > 0.05 ? k : Math.max(0, k - 1); T = st[i] + 0.001; setTl(); apply(stateAt(T)); paintPlay(); req(); });
  bNext.addEventListener('click', () => { playing = false; const st = startAt(); const k = curSt ? curSt.k : 0; T = k + 1 < steps.length ? st[k + 1] + 0.001 : total; setTl(); apply(stateAt(T)); paintPlay(); req(); });
  onTheme(() => { scene.background = new THREE.Color(cssVar('--sky') || '#dfe8ee'); if (M) { buildSoil(); setMode(S.view); } req(); });
  scene.background = new THREE.Color(cssVar('--sky') || '#dfe8ee');

  // „Próbáld ki” feladatok
  const PRESETS = {
    1: { tech: 'cfa', prof: 'A', D: 60, L: 13, nb: false, fault: false },
    2: { tech: 'driven', prof: 'D', D: 40, L: 10, nb: true, fault: false, shape: 'sq' },
    3: { tech: 'dry', prof: 'A', D: 60, L: 9, nb: false, fault: false },
    4: { tech: 'cfa', prof: 'C', D: 60, L: 16, nb: false, fault: true },
  };
  const applyPreset = (key) => {
    const p = PRESETS[key]; if (!p) return;
    Object.assign(S, p);
    cProf.set(p.prof, false); cTech.set(p.tech, false); techRanges(); cD.set(p.D, false); cL.set(p.L, false); cNb.set(p.nb, false); cFault.set(p.fault, false); if (p.shape) cShape.set(p.shape, false);
    viewSeg.set('kozeli', false); S.view = 'kozeli';
    rebuild(); T = 0; apply(stateAt(0)); setView('kozeli');
    playing = true; lastT = 0; paintPlay(); req();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $$('[data-sim-preset]').forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.simPreset)));

  techRanges(); cD.set(S.D, false);
  rebuild(); paintPlay();
  // első megjelenéskor egyszer lejátsszuk
  if (renderer && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); if (!playing && T >= total - 0.001) { T = 0; playing = true; lastT = 0; paintPlay(); req(); } } }, { threshold: 0.4 });
    io.observe(stage);
  }
});

/* ------------------------------------------------------------------ kvíz */
defineQuiz('sim', 'Kvíz – a cölöpépítő tanulságai', [
  { q: 'Mi tartja meg a CFA-cölöp furatának falát fúrás közben?', a: ['A spirálon maradó talajdugó', 'Bentonitzagy', 'Acél béléscső', 'Semmi – a furat magától áll'], c: 0, e: 'A folyamatos spirálon maradó talaj támasztja a falat, ezért a CFA-hoz nem kell külön megtámasztás.' },
  { q: 'Az A szelvényben (puha agyag a kavicson) a 13 m-es CFA-cölöpöt 20 m-esre hosszabbítod. Mi történik?', a: ['A köpeny aránya nő, az „álló” cölöpből vegyes lesz', 'A talp aránya nő, még inkább álló lesz', 'Semmi, mert a talp ugyanabban a rétegben van', 'Lebegő lesz, mert a talp puha rétegbe kerül'], c: 0, e: 'A teherbíró rétegben futó hosszabb köpeny egyre nagyobb részt vállal – a talp aránya 2/3 alá esik.' },
  { q: 'Miért kockázatos a vert előregyártott cölöp egy belvárosi foghíjtelken?', a: ['A verés jelentős zajt és rezgést kelt', 'Mert talajvíz alatt nem lehet betonozni', 'Mert nem tömöríti a talajt', 'Mert legfeljebb 4 m hosszú lehet'], c: 0, e: 'A verés dinamikus hatása a szomszéd épületeket is éri – építmények közelében csak erős korlátokkal alkalmazható.' },
  { q: 'Béléscsöves fúrásnál a talajvíz alatt mit kell tenni a furatban?', a: ['Pótolni a kiemelt vizet, hogy a talpon ne törjön be a talaj', 'Kiszivattyúzni a vizet, hogy száraz legyen a talp', 'Cementtel injektálni a talpat', 'Semmit, a béléscső mindent megold'], c: 0, e: 'Ha a belső vízszint a külső alá kerül, a víznyomás-különbség a talpon betöri és fellazítja a talajt.' },
  { q: 'Melyiknél hagyjuk figyelmen kívül a csúcsellenállást a teherbírás számításakor?', a: ['Mikrocölöp', 'Franki-cölöp', 'Vert előregyártott cölöp', 'Béléscsöves fúrt cölöp'], c: 0, e: 'A karcsú mikrocölöpnél jellemzően csak a köpenymenti ellenállással számolunk.' },
  { q: 'Mi a Franki-cölöp „hagymája”?', a: ['Betonadagokból kidöngölt, kiszélesedő talp', 'A cölöpfej felett hagyott túlnyúló beton', 'A béléscső végére hegesztett acélcsúcs', 'A zaggyal keveredett felső betonréteg'], c: 0, e: 'A dugó kiverése után újabb betonadagokat döngölnek a talpnál – ez a „hagyma” adja a nagy talpellenállást.' },
  { q: 'Kemény agyag, a talajvíz mélyen van, 8 m-es fúrt cölöp kell. Melyik a legegyszerűbb megtámasztás?', a: ['Megtámasztás nélkül – de rögtön betonozni kell', 'Bentonitzagy', 'Béléscső vízpótlással', 'Sűrített levegő'], c: 0, e: 'Kötött talajban, talajvíz felett, legfeljebb 8–10 m-ig a furat rövid ideig magától is megáll.' },
  { q: 'A helyben készülő csavart cölöpnél a kiszorítás elsősorban melyik ellenállást növeli?', a: ['A köpenymenti ellenállást', 'Csak a talpellenállást', 'Egyiket sem', 'Csökkenti a köpenymenti ellenállást'], c: 0, e: 'A fej széttolja és tömöríti a talajt a cölöp körül – ez a köpeny mentén érvényesül.' },
]);
