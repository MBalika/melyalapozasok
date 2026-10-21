// C05 – Fúrt (talajhelyettesítéses) cölöpök: fúrófejek, furatállékonyság-labor, kontraktorcsöves betonozás, CFA-monitor, technológiaválasztó, kvíz
import { register, shell, slider, seg, toggle, select, stat, verdict, svg, figure, clear, fmt, clamp, lerp, pathD, h, loop, onTheme } from './core.js';
import { defineQuiz } from './ui.js';
import './g3_phases.js';

/* ------------------------------------------------------------------ rajzsegédek */
const T = (p, x, y, s, cls = 't-lab', o = {}) => svg('text', { x, y, class: cls, text: s, ...o }, p);
const R = (p, x, y, w, hh, cls, o = {}) => svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls, ...o }, p);
const C = (p, cx, cy, r, cls, o = {}) => svg('circle', { cx, cy, r: Math.max(0, r), class: cls, ...o }, p);
const L = (p, x1, y1, x2, y2, style, o = {}) => svg('line', { x1, y1, x2, y2, style, ...o }, p);
const P = (p, pts, style, close = false, o = {}) => svg('path', { d: pathD(pts, close), style, ...o }, p);
const G = (p, o = {}) => svg('g', o, p);
function ar(p, x1, y1, x2, y2, col = 'var(--ink)', w = 2, hd = 7) {
  const g = G(p);
  const a = Math.atan2(y2 - y1, x2 - x1);
  L(g, x1, y1, x2 - Math.cos(a) * hd * 0.6, y2 - Math.sin(a) * hd * 0.6, `stroke:${col};stroke-width:${w};stroke-linecap:round`);
  P(g, [[x2, y2], [x2 - Math.cos(a - 0.45) * hd, y2 - Math.sin(a - 0.45) * hd], [x2 - Math.cos(a + 0.45) * hd, y2 - Math.sin(a + 0.45) * hd]], `fill:${col}`, true);
  return g;
}
/** determinisztikus álvéletlen (a „szemcsék” ne ugráljanak képkockáról képkockára) */
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const SOIL = {
  homok: { t: 'Homok', cls: 'f-soilA', pat: 'pat-sand', szem: true },
  kavics: { t: 'Kavics', cls: 'f-soilC', pat: 'pat-gravel', szem: true },
  agyag: { t: 'Agyag (kötött)', cls: 'f-soilB', pat: 'pat-clay', szem: false },
};
function soilRect(p, x, y, w, hh, key) {
  const s = SOIL[key];
  R(p, x, y, w, hh, s.cls);
  R(p, x, y, w, hh, '', { fill: `url(#${s.pat})`, opacity: 0.75 });
}
/** talajvízjel (▽ + vonalkák) */
function gwMark(p, x, y, lab = 'TV') {
  P(p, [[x - 7, y - 10], [x + 7, y - 10], [x, y - 1]], 'fill:var(--water)', true);
  L(p, x - 9, y + 3, x + 9, y + 3, 'stroke:var(--water);stroke-width:1.5');
  L(p, x - 5, y + 7, x + 5, y + 7, 'stroke:var(--water);stroke-width:1.5');
  if (lab) T(p, x + 12, y - 2, lab, 't-sm t-water halo');
}
const ST = { ok: 'Stabil', warn: 'Kockázatos', bad: 'Beomlik' };

/* ================================================================== 1. Fúrófejek munkaciklusa */
const TOOLS = {
  rovid: { t: 'Rövid spirál', soils: [['kötött talaj', 'ok'], ['szemcsés talaj', 'bad']], txt: 'Néhány menetes spirál a Kelly-rúd végén. Lefúr, megtelik, a gép kiemeli, majd a furat mellett gyors pörgetéssel lerázza róla a földet – és kezdi elölről. Elsősorban kötött talajban hatékony: a szemcsés talaj kipereg a menetek közül.' },
  cfa: { t: 'Folyamatos spirál', soils: [['kötött talaj', 'ok'], ['szemcsés talaj', 'ok']], txt: 'A spirál a teljes cölöphosszon végigér, és egyetlen menetben hatol le a végső mélységig. A furadék a menetek között marad, és közben megtámasztja a furat falát – ez a CFA-cölöp alapja. Bármely talajban használható.' },
  marko: { t: 'Markoló', soils: [['kötött talaj', 'ok'], ['szemcsés talaj', 'ok']], txt: 'Hengeres markolókanál: nyitott pofákkal ejtik a furat aljára, összezárva beleharap a talajba, majd a furat mellett ürítik. Bármely talajban használható, feltöltésben, köves rétegben is; gyakran az acél béléscső védelmében dolgozik.' },
  dob: { t: 'Dobfúró', soils: [['kötött talaj', 'warn'], ['szemcsés talaj', 'ok']], txt: 'Fogazott aljú, hengeres dob: forgatás közben a talaj a dob alján lévő nyíláson át a dobba kerül. Megtelve kiemelik, és a nyitható fenéklapon át ürítik. Elsősorban szemcsés talajban hatékony, ahol a spirálról a talaj leperegne.' },
  obl: { t: 'Öblítéses fúrás', soils: [['kötött talaj', 'ok'], ['szemcsés talaj', 'ok']], txt: 'A fúrófej csak feltöri, fellazítja a talajt a furat talpán; a fellazított anyagot az öblítőfolyadék szállítja ki: a fúrórúdon le, a rúd és a furatfal közötti résben fel, a felszínen egy ülepítőbe. Kis átmérőjű fúrásoknál, mikrocölöpöknél gyakori.' },
};
register('furtTool', (root) => {
  const { ctrls, viz, out } = shell(root);
  const s = seg(ctrls, { label: 'Eszköz', options: Object.entries(TOOLS).map(([v, o]) => ({ v, t: o.t })), value: 'rovid', vert: true });
  const chips = h('div', { class: 'chips' }); ctrls.append(h('div', { class: 'ctl' }, h('span', { class: 'ctl-lab' }, 'Melyik talajhoz?'), chips));
  const W = 560, H = 360, G0 = 92, X = 250, BW = 74, MAXD = 230;
  const fig = figure(viz, W, H);
  const cap = h('p', { class: 'furt-cap' }); viz.append(cap);
  const bg = G(fig), dyn = G(fig);
  // háttér: talaj, terep, gép árboca
  R(bg, 0, 0, W, G0, 'f-sky');
  soilRect(bg, 0, G0, W, H - G0, 'agyag');
  L(bg, 0, G0, W, G0, 'stroke:var(--soil-line);stroke-width:2');
  R(bg, X - 150, G0 - 18, 96, 18, 'f-steel2', { rx: 3 });
  for (let i = 0; i < 6; i++) C(bg, X - 140 + i * 16, G0 - 4, 5, 'f-ink', { opacity: 0.6 });
  R(bg, X - 116, G0 - 58, 52, 40, 'f-steel', { rx: 4 });
  R(bg, X - 70, 8, 8, G0 - 26, 'f-acc');
  L(bg, X - 62, 12, X, 12, 'stroke:var(--accent);stroke-width:5');
  T(bg, 12, 22, 'fúrógép (vázlat)', 't-sm halo');
  out.remove();
  let typ = s.v, depth = 40, pile = 0, last = -1;
  const reset = () => { depth = 40; pile = 0; last = -1; };
  const paintInfo = () => {
    const o = TOOLS[typ];
    cap.innerHTML = `<b>${o.t}.</b> ${o.txt}`;
    chips.innerHTML = o.soils.map(([t, st]) => `<span class="chip ${st}">${st === 'ok' ? '✓' : st === 'warn' ? '~' : '✗'} ${t}</span>`).join('');
  };
  s.on((v) => { typ = v; reset(); paintInfo(); });
  paintInfo();
  // eszközrajzolók (y: az eszköz alja)
  const kelly = (g, yTop) => R(g, X - 5, 12, 10, Math.max(0, yTop - 12), 'f-steel2');
  const flights = (g, y0, y1, ph, soil) => {
    R(g, X - 4, y0, 8, y1 - y0, 'f-steel2');
    const pitch = 22;
    for (let y = y0 + ((ph * pitch) % pitch); y < y1; y += pitch) {
      if (soil) P(g, [[X - BW / 2 + 4, y + 4], [X + BW / 2 - 4, y + 13], [X + BW / 2 - 4, y + 20], [X - BW / 2 + 4, y + 11]], 'fill:var(--soilB);opacity:.9', true);
      L(g, X - BW / 2 + 3, y, X + BW / 2 - 3, y + 9, 'stroke:var(--steelm2);stroke-width:3.4;stroke-linecap:round');
    }
  };
  const spoil = (g, n) => {
    const k = clamp(n, 0, 1);
    if (k <= 0) return;
    P(g, [[X + 60, G0], [X + 60 + 60 * k + 30, G0], [X + 90 + 30 * k, G0 - 34 * k], [X + 76, G0 - 30 * k]], 'fill:var(--soilB);stroke:var(--soil-line);stroke-width:1', true);
    T(g, X + 100, G0 - 40 * k - 6, 'kiemelt föld', 't-sm halo');
  };
  const draw = (tt) => {
    clear(dyn);
    const g = dyn;
    const per = typ === 'cfa' ? 7 : typ === 'obl' ? 6 : 4.2;
    const cyc = Math.floor(tt / per), u = (tt % per) / per;
    if (cyc !== last) {
      if (typ === 'cfa' || typ === 'obl') { depth = 40; pile = 0; }
      else if (last >= 0) { if (depth + 26 > MAXD) { depth = 40; pile = 0; } else { depth += 26; pile += 0.12; } }
      last = cyc;
    }
    // a furat (üreg) aktuális mélysége
    let dNow;
    if (typ === 'cfa' || typ === 'obl') dNow = 20 + MAXD * clamp(u / 0.8, 0, 1) * (typ === 'obl' ? 0.9 : 1);
    else dNow = u < 0.3 ? depth : u < 0.5 ? depth + 26 * (u - 0.3) / 0.2 : depth + 26;
    const yB = G0 + Math.max(10, dNow);
    if (typ === 'obl') R(g, X - 22, G0, 44, yB - G0, 'f-water', { style: 'opacity:.9' });
    else R(g, X - BW / 2, G0, BW, yB - G0, 'f-surface', { opacity: 0.92 });
    if (typ === 'marko') { // béléscső
      L(g, X - BW / 2 - 3, G0 - 14, X - BW / 2 - 3, Math.max(G0 + 10, yB - 8), 'stroke:var(--steelm2);stroke-width:5');
      L(g, X + BW / 2 + 3, G0 - 14, X + BW / 2 + 3, Math.max(G0 + 10, yB - 8), 'stroke:var(--steelm2);stroke-width:5');
      T(g, X + BW / 2 + 10, G0 + 26, 'béléscső', 't-sm halo');
    }
    spoil(g, typ === 'cfa' ? clamp(u / 0.8, 0, 1) * 0.55 : typ === 'obl' ? 0 : pile + (u > 0.85 ? 0.12 * (u - 0.85) / 0.15 : 0));
    const yTopTool = 26;
    let label = '';
    if (typ === 'cfa') {
      const ph = tt * 2.2;
      const yb = yB;
      kelly(g, yTopTool);
      flights(g, Math.min(yTopTool, yb - 40), yb, ph, true);
      label = u < 0.8 ? 'lehajtás – a furadék a meneteken marad' : 'végső mélység – jöhet a betonozás';
    } else if (typ === 'obl') {
      kelly(g, yTopTool);
      R(g, X - 5, yTopTool, 10, yB - yTopTool - 10, 'f-steel2');
      P(g, [[X - 14, yB - 12], [X + 14, yB - 12], [X + 8, yB], [X - 8, yB]], 'fill:var(--steelm2)', true);
      // folyadékáram: le a rúdban, fel a résben
      const fl = (tt * 60) % 30;
      for (let y = yTopTool + fl; y < yB - 14; y += 30) ar(g, X, y, X, y + 14, 'var(--surface)', 2, 5);
      for (let y = yB - 20 - fl; y > G0 + 6; y -= 30) {
        ar(g, X - 16, y + 12, X - 16, y, 'var(--water)', 2, 5); ar(g, X + 16, y + 12, X + 16, y, 'var(--water)', 2, 5);
        C(g, X - 13 + rnd(y) * 4, y + 6, 1.8, 'f-ink', { opacity: 0.6 }); C(g, X + 13 + rnd(y + 3) * 4, y + 4, 1.8, 'f-ink', { opacity: 0.6 });
      }
      // ülepítő
      P(g, [[X + 70, G0], [X + 150, G0], [X + 140, G0 + 26], [X + 80, G0 + 26]], 'fill:var(--water-fill);stroke:var(--water);stroke-width:1.5', true);
      ar(g, X + 18, G0 - 6, X + 74, G0 + 6, 'var(--water)', 2, 6);
      T(g, X + 82, G0 + 44, 'ülepítő', 't-sm t-water halo');
      label = 'a fej feltöri a talajt, a folyadék kiszállítja';
    } else {
      // szakaszos eszközök: le – fúr – fel – ürít
      let yb;
      if (u < 0.3) yb = lerp(G0 - 6, yB, u / 0.3);
      else if (u < 0.5) yb = yB;
      else if (u < 0.8) yb = lerp(yB, G0 - 8, (u - 0.5) / 0.3);
      else yb = G0 - 8;
      const full = u >= 0.42 && u < 0.86;
      const empt = u >= 0.8;
      if (typ === 'rovid') {
        const ph = u > 0.3 && u < 0.5 ? tt * 3 : u > 0.8 ? tt * 8 : 0;
        kelly(g, yb - 66);
        flights(g, yb - 66, yb, ph, full && !(u > 0.82));
        if (u > 0.8) for (let i = 0; i < 7; i++) { const k = ((u - 0.8) / 0.2 + i / 7) % 1; C(g, X + 40 + k * 50, yb - 30 + k * 26 - Math.sin(k * 3) * 18, 4, 'f-soilB'); }
      } else if (typ === 'dob') {
        kelly(g, yb - 70);
        R(g, X - BW / 2 + 4, yb - 70, BW - 8, 66, 'f-steel', { rx: 3 });
        if (full) R(g, X - BW / 2 + 8, yb - 60 + (empt ? 50 * (u - 0.8) / 0.2 : 0), BW - 16, 54 - (empt ? 50 * (u - 0.8) / 0.2 : 0), 'f-soilA');
        for (let i = 0; i < 6; i++) P(g, [[X - BW / 2 + 6 + i * 11, yb - 4], [X - BW / 2 + 11 + i * 11, yb + 4], [X - BW / 2 + 16 + i * 11, yb - 4]], 'fill:var(--steelm2)', true);
        if (empt) { L(g, X - BW / 2 + 4, yb - 4, X - BW / 2 + 4 + 40 * Math.cos(0.9), yb - 4 + 40 * Math.sin(0.9), 'stroke:var(--steelm2);stroke-width:4');
          for (let i = 0; i < 8; i++) C(g, X - 6 + rnd(i) * 30, yb + 6 + ((u - 0.8) / 0.2 * 30 + i * 6) % 30, 3, 'f-soilA'); }
      } else if (typ === 'marko') {
        const open = u < 0.34 || u > 0.82 ? 1 : u < 0.44 ? 1 - (u - 0.34) / 0.1 : 0;
        L(g, X, 12, X, yb - 60, 'stroke:var(--ink2);stroke-width:2');
        R(g, X - 16, yb - 66, 32, 26, 'f-steel2', { rx: 3 });
        const jaw = (sg) => P(g, [[X, yb - 42], [X + sg * (BW / 2 - 6 + open * 10), yb - 30], [X + sg * (BW / 2 - 10 + open * 16), yb - 4 - open * 6], [X + sg * 3, yb + 2 - open * 10]], 'fill:var(--steelm);stroke:var(--steelm2);stroke-width:1.5', true);
        jaw(-1); jaw(1);
        if (full && open < 0.6) R(g, X - 16, yb - 26, 32, 20, 'f-soilB', { opacity: 0.85 });
        if (u > 0.82) for (let i = 0; i < 7; i++) C(g, X - 12 + rnd(i + 9) * 24, yb + 4 + ((u - 0.82) / 0.18 * 40 + i * 7) % 40, 3.5, 'f-soilB');
      }
      label = u < 0.3 ? '1 · le a furatba' : u < 0.5 ? '2 · fúrás, telítődés' : u < 0.8 ? '3 · kiemelés' : '4 · ürítés a furat mellett';
    }
    T(g, W - 12, H - 14, label, 't-lab halo', { 'text-anchor': 'end' });
  };
  loop(root, (tt) => draw(tt));
  draw(0);
});

/* ================================================================== 2. Furatállékonyság-labor */
const METH = {
  nincs: { t: 'Nincs megtámasztás' },
  bel: { t: 'Béléscső' },
  zagy: { t: 'Bentonitzagy' },
  cfa: { t: 'Talaj a spirálon (CFA)' },
};
function labEval(o) {
  const { soil, gw, hw, z, m, dh, lead, sz } = o;
  const szem = SOIL[soil].szem, wet = gw && hw < z;
  const r = { st: 'ok', mode: null, title: '', txt: '' };
  if (m === 'nincs') {
    if (szem) {
      Object.assign(r, { st: 'bad', mode: 'wall', zf: 1.2, title: 'A furat beomlik.', txt: `Szemcsés talajban (${SOIL[soil].t.toLowerCase()}) nincs kohézió, ami a függőleges falat megtartaná: a fal kipereg, beomlik${wet ? ', a talajvíz alatt pedig a beáramló víz is sodorja a szemcséket' : ''}. Megtámasztásra van szükség (béléscső, zagy vagy folyamatos spirál).` });
    } else if (wet) {
      Object.assign(r, { st: 'bad', mode: 'wall', zf: hw, title: 'A talajvíz alatt a fal megindul.', txt: 'Kötött talajban is csak talajvíz felett áll meg a furat. A víz alatt a fal felpuhul, a betörő víz a talpat is fellazítja – a megtámasztás nélküli technológia itt már nem alkalmazható.' });
    } else if (z > 10) {
      Object.assign(r, { st: 'bad', mode: 'wall', zf: 8, title: 'Túl mély a megtámasztás nélküli furat.', txt: 'Kötött talajban, talajvíz felett is legfeljebb 8–10 m-ig számíthatunk arra, hogy a furat rövid ideig megáll. Mélyebben a fal alsó része megindulhat.' });
    } else if (z > 8) {
      Object.assign(r, { st: 'warn', title: 'A határon: 8–10 m.', txt: 'Kötött talajban, talajvíz felett még megállhat – de csak rövid ideig. A kiemelés után azonnal betonozni kell, és figyelni a fal állapotát.' });
    } else {
      Object.assign(r, { st: 'ok', title: 'Rövid ideig megáll.', txt: `Kötött talaj, talajvíz felett, ${fmt(z, 0)} m: a furat megtámasztás nélkül is állékony – de a kiemelés után rögtön ki kell betonozni.${z <= 6 ? ' (5–6 m-ig ezt markolt tömbalapnak, kútalapnak is nevezik.)' : ''}` });
    }
  } else if (m === 'bel') {
    if (!lead && szem) {
      Object.assign(r, { st: 'bad', mode: 'under', title: 'A talaj befolyik a cső alá.', txt: 'Ha a kiemelés megelőzi a csövet, szemcsés talajban a cső alatti szabad falszakasz beomlik, a talaj a cső alatt befolyik a furatba, és a környezet fellazul. Szemcsés talajban a béléscsőnek feltétlenül a földkiemelés előtt kell járnia.' });
    } else if (wet && dh < 0) {
      if (szem) Object.assign(r, { st: 'bad', mode: 'boil', title: 'Felbuzgás a talpon!', txt: `A csőben ${fmt(-dh, 1)} m-rel alacsonyabban áll a víz, mint kint. A különbség a talpon felfelé irányuló áramlást indít: a víz betör, magával ragadja a szemcséket, és fellazítja a talajt ott, ahol a cölöp talpa ülni fog. A kiemelt vizet pótolni kell.` });
      else Object.assign(r, { st: 'warn', mode: 'boilS', title: 'A talp felpuhulhat.', txt: `A csőben ${fmt(-dh, 1)} m-rel alacsonyabban áll a víz, mint kint. Kötött talajban az áramlás lassú, de a talp felpuhulhat, megemelkedhet. A furatban a vízszintet a külső szinten kell tartani.` });
    } else if (!lead) {
      Object.assign(r, { st: 'warn', title: 'Kötött talajban elmegy – de nem ajánlott.', txt: 'Kötött talajban a cső alatti rövid szabad szakasz rövid ideig megállhat, ezért a cső „általában” jár elöl, nem feltétlenül. Biztonságosabb mégis a kiemelés előtt mélyíteni.' });
    } else {
      Object.assign(r, { st: 'ok', title: 'A cső tartja a falat.', txt: `Az acél béléscső megakadályozza a talaj és a talajvíz betörését${wet ? `, a csőben tartott víz${dh > 0 ? ` (+${fmt(dh, 1)} m)` : ''} pedig egyensúlyt tart a külső víznyomással` : ''}. Hátránya: a cső mozgatása, toldása nehézkes és lassú.` });
    }
  } else if (m === 'zagy') {
    if (wet && sz < 0.5) Object.assign(r, { st: 'bad', mode: 'wall', zf: Math.max(1, hw), title: 'Kevés a zagy túlnyomása.', txt: `A zagyszint csak ${fmt(sz, 2)} m-rel van a talajvízszint felett. A zagy nyomása így alig nagyobb a víznyomásnál, a földnyomást már nem tudja ellensúlyozni: a fal a talajvíz alatt megindul.` });
    else if (wet && sz < 1.0) Object.assign(r, { st: 'warn', title: 'Szűkös a túlnyomás.', txt: `A zagyszint ${fmt(sz, 2)} m-rel van a talajvíz felett – kevés. A zagyszintet legalább 1,0–1,5 m-rel a talajvízszint felett kell tartani.` });
    else if (soil === 'kavics') Object.assign(r, { st: 'warn', mode: 'loss', title: 'Megáll – de fogy a zagy.', txt: 'Nagy áteresztőképességű kavicsban a zagy elszivároghat a pórusokba (zagyveszteség), és a zagyszint süllyed. Folyamatosan figyelni és pótolni kell; szükség esetén sűrűbb zagy kell.' });
    else Object.assign(r, { st: 'ok', title: 'A zagy megtámasztja a falat.', txt: `A bentonitzagy sűrűbb a víznél, kiszorítja a talajvizet, és túlnyomásával megtámasztja a furat falát${wet ? ` – a zagyszint ${fmt(sz, 1)} m-rel a talajvíz felett van` : ''}.` });
  } else if (m === 'cfa') {
    if (z > 24) Object.assign(r, { st: 'bad', mode: 'short', title: 'Ilyen hosszú CFA nincs.', txt: 'A folyamatos spirál hossza a gép árbocához kötött: a CFA-cölöp legfeljebb kb. 22–24 m-es. Ehhez a mélységhez köpenycsöves vagy zagyos technológia kell.' });
    else if (z > 22) Object.assign(r, { st: 'warn', title: 'A felső határon.', txt: '22–24 m a CFA felső tartománya: csak nagy géppel, gondos tervezéssel.' });
    else if (soil === 'homok' && wet) Object.assign(r, { st: 'warn', mode: 'over', title: 'Megáll – különös gondossággal.', txt: 'Finom homokban, talajvíz alatt a CFA különös gondosságot igényel (laza, folyós talajba nem is javasolt): ha a spirál a behatoláshoz képest túl sokat forog, több talajt szállít fel, mint a furat térfogata, és a környezet fellazul. A fúrást és a betonozást ütemesen, megszakítás nélkül kell végezni.' });
    else Object.assign(r, { st: 'ok', title: 'A talajdugó megtámaszt.', txt: 'A spirálon maradó talajdugó folyamatosan támasztja a furat falát, külön megtámasztó technológia nem kell. A betont a fúrószáron át, a felhúzás közben nyomják be.' });
  }
  return r;
}
register('furtLab', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sSoil = seg(ctrls, { label: 'Talaj', options: Object.entries(SOIL).map(([v, o]) => ({ v, t: o.t })), value: 'homok' });
  const sGw = toggle(ctrls, { label: 'Talajvíz van', value: true });
  const sHw = slider(ctrls, { label: 'Talajvízszint mélysége', min: 1, max: 10, step: 0.5, value: 3, unit: 'm', d: 1 });
  const sZ = slider(ctrls, { label: 'A furat mélysége', min: 4, max: 40, step: 1, value: 14, unit: 'm', d: 0 });
  const sM = seg(ctrls, { label: 'Megtámasztás', options: Object.entries(METH).map(([v, o]) => ({ v, t: o.t })), value: 'nincs', vert: true });
  const boxBel = h('div', { class: 'furt-sub' });
  const sDh = slider(boxBel, { label: 'Vízszint a csőben a külsőhöz képest', min: -4, max: 2, step: 0.5, value: 0, unit: 'm', d: 1, fmt: (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), 1) });
  const sLead = toggle(boxBel, { label: 'A cső a kiemelés előtt jár', value: true });
  const boxZ = h('div', { class: 'furt-sub' });
  const sSz = slider(boxZ, { label: 'Zagyszint a talajvízszint felett', min: 0, max: 3, step: 0.25, value: 1.5, unit: 'm', d: 2 });
  ctrls.append(boxBel, boxZ);
  const W = 520, H = 470, G0 = 46, X = 236, BW = 64;
  const fig = figure(viz, W, H);
  const vd = verdict(viz);
  const oSt = stat(out, { label: 'A furat' }), oX = stat(out, { label: '–' });
  const bg = G(fig), dyn = G(fig);
  let st = null, t0 = 0, sc = 1;
  const yz = (z) => G0 + z * sc;
  const rebuild = () => {
    const soil = sSoil.v, gw = sGw.v, hw = sHw.v, z = sZ.v, m = sM.v;
    sHw.el.hidden = !gw;
    boxBel.hidden = m !== 'bel'; boxZ.hidden = m !== 'zagy' || !gw;
    sDh.el.style.opacity = gw ? 1 : 0.45; sDh.input.disabled = !gw;
    const r = labEval({ soil, gw, hw, z, m, dh: sDh.v, lead: sLead.v, sz: sSz.v });
    const zmax = Math.max(12, z + 3);
    sc = (H - G0 - 16) / zmax;
    st = { soil, gw, hw, z, m, r, zmax, dh: sDh.v, sz: sSz.v, lead: sLead.v };
    // háttér
    clear(bg);
    R(bg, 0, 0, W, G0, 'f-sky');
    soilRect(bg, 0, G0, W, yz(1) - G0, 'kavics');
    R(bg, 0, G0, W, yz(1) - G0, 'f-soilD', { opacity: 0.75 });
    soilRect(bg, 0, yz(1), W, H - yz(1), soil);
    L(bg, 0, G0, W, G0, 'stroke:var(--soil-line);stroke-width:2');
    L(bg, 0, yz(1), W, yz(1), 'stroke:var(--soil-line);stroke-width:1;stroke-dasharray:4 3');
    T(bg, 10, yz(0.6), 'feltöltés', 't-sm halo');
    T(bg, 10, yz(1) + 18, SOIL[soil].t, 't-lab halo');
    if (gw) {
      R(bg, 0, yz(hw), W, H - yz(hw), '', { fill: 'url(#pat-water)', opacity: 0.6 });
      L(bg, 0, yz(hw), W, yz(hw), 'stroke:var(--water);stroke-width:1.5;stroke-dasharray:7 4');
      gwMark(bg, W - 100, yz(hw), 'talajvíz');
    }
    // mélységskála
    const stp = zmax > 30 ? 5 : zmax > 16 ? 4 : 2;
    for (let k = 0; k <= zmax; k += stp) { L(bg, W - 26, yz(k), W - 18, yz(k), 'stroke:var(--ink2);stroke-width:1'); T(bg, W - 30, yz(k) + 4, `${k}`, 't-sm halo', { 'text-anchor': 'end' }); }
    L(bg, W - 18, G0, W - 18, H - 6, 'stroke:var(--ink2);stroke-width:1');
    T(bg, W - 14, G0 - 8, 'm', 't-sm', { 'text-anchor': 'end' });
    T(bg, 10, H - 10, 'Az átmérő nem méretarányos · szemléltető modell', 't-sm halo');
    // kimenetek
    oSt.set(ST[r.st], r.st, r.st === 'bad' && (r.mode === 'short') ? 'Nem kivitelezhető' : null);
    if (m === 'bel') { oX.el.querySelector('.stat-l').innerHTML = 'Belső − külső vízszint'; oX.set(gw ? (sDh.v > 0 ? '+' : sDh.v < 0 ? '−' : '') + fmt(Math.abs(sDh.v), 1) : '–', gw ? (sDh.v < 0 ? (SOIL[soil].szem ? 'bad' : 'warn') : 'ok') : null, gw ? null : 'nincs talajvíz'); if (gw) oX.el.querySelector('.stat-v').innerHTML += '<small>m</small>'; }
    else if (m === 'zagy') {
      oX.el.querySelector('.stat-l').innerHTML = 'Zagy túlnyomása a talpon';
      if (gw && hw < z) { const t = Math.max(0.3, hw - sSz.v); const dp = 11.0 * (z - t) - 10 * (z - hw); oX.set(dp, dp < 15 ? 'bad' : dp < 25 ? 'warn' : 'ok'); oX.el.querySelector('.stat-v').innerHTML += '<small>kPa</small>'; }
      else oX.set('–', null, 'talajvíz felett');
    } else if (m === 'nincs') { oX.el.querySelector('.stat-l').innerHTML = 'Megtámasztás nélkül (kötött talaj, TV felett)'; oX.set('≤ 8–10 m', SOIL[soil].szem || (gw && hw < z) || z > 10 ? 'bad' : z > 8 ? 'warn' : 'ok', '≤ 8–10 m'); }
    else { oX.el.querySelector('.stat-l').innerHTML = 'CFA-hossz'; oX.set('6–22 (24) m', z > 24 ? 'bad' : z > 22 ? 'warn' : 'ok', '6–22 (24) m'); }
    vd.set(r.st, r.title, ' ' + r.txt);
    t0 = performance.now() / 1000;
  };
  [sSoil, sGw, sHw, sZ, sM, sDh, sLead, sSz].forEach((c) => c.on(rebuild));
  const draw = (now) => {
    if (!st) return;
    clear(dyn);
    const g = dyn, { z, m, r, gw, hw } = st;
    const u = now - t0;
    const kDrill = clamp(u / 1.6, 0, 1);
    const zNow = r.mode === 'short' ? Math.min(z, 24) * kDrill : z * kDrill;
    const yb = yz(zNow);
    const xl = X - BW / 2, xr = X + BW / 2;
    const kc = clamp((u - 1.6) / 2.2, 0, 1); // beomlás üteme
    // furat belseje
    if (m === 'zagy') {
      const t = gw ? Math.max(0.3, hw - st.sz) : 0.5;
      const tl = r.mode === 'loss' ? t + 0.08 * zNow * clamp((u - 1.6) / 4, 0, 1) : t;
      R(g, xl, G0, BW, yb - G0, 'f-surface', { opacity: 0.85 });
      R(g, xl, yz(tl), BW, Math.max(0, yb - yz(tl)), 'f-slurry');
      R(g, xl, yz(tl), BW, Math.max(0, yb - yz(tl)), '', { fill: 'url(#pat-slurry)' });
      L(g, xl - 6, yz(tl), xr + 6, yz(tl), 'stroke:var(--bento);stroke-width:2');
      T(g, xr + 10, yz(tl) + 4, 'zagyszint', 't-sm halo');
      if (r.mode === 'loss') for (let i = 0; i < 10; i++) { const yy = yz(1.5 + rnd(i) * (zNow - 2)); const k = ((u * 0.4 + rnd(i + 5)) % 1); ar(g, xr + 2, yy, xr + 8 + k * 26, yy + 4, 'var(--bento)', 1.6, 5); }
      if (kDrill >= 1 && r.st !== 'bad') for (let i = 0; i < 3; i++) { const yy = yz(z * (0.3 + 0.25 * i)); ar(g, X - 6, yy, xl + 4, yy, 'var(--bento)', 2, 6); ar(g, X + 6, yy, xr - 4, yy, 'var(--bento)', 2, 6); }
    } else if (m === 'bel') {
      R(g, xl, G0, BW, yb - G0, 'f-surface', { opacity: 0.85 });
      if (gw && hw < zNow) {
        const tin = hw - st.dh;
        R(g, xl, yz(Math.max(0, tin)), BW, Math.max(0, yb - yz(Math.max(0, tin))), 'f-water');
        L(g, xl, yz(Math.max(0, tin)), xr, yz(Math.max(0, tin)), 'stroke:var(--water);stroke-width:2');
        if (Math.abs(st.dh) > 0.01) T(g, xl - 8, yz(Math.max(0, tin)) + 4, 'belső vízszint', 't-sm t-water halo', { 'text-anchor': 'end' });
      }
      const ycs = st.lead ? yb + 6 : yb - Math.min(48, (yb - G0) * 0.25);
      L(g, xl - 3, G0 - 14, xl - 3, ycs, 'stroke:var(--steelm2);stroke-width:5');
      L(g, xr + 3, G0 - 14, xr + 3, ycs, 'stroke:var(--steelm2);stroke-width:5');
      T(g, xl - 8, G0 + 30, 'béléscső', 't-sm halo', { 'text-anchor': 'end' });
      if (!st.lead) T(g, xr + 10, ycs + 4, '← a cső vége', 't-sm halo');
    } else if (m === 'cfa') {
      R(g, xl, G0, BW, yb - G0, 'f-surface', { opacity: 0.85 });
      const pitch = 22, ph = (u < 1.6 ? u * 30 : 0) % pitch;
      R(g, X - 4, 8, 8, yb - 8, 'f-steel2');
      for (let y = G0 + ph; y < yb - 4; y += pitch) {
        P(g, [[xl + 2, y + 4], [xr - 2, y + 13], [xr - 2, y + 21], [xl + 2, y + 12]], `fill:var(--${st.soil === 'agyag' ? 'soilB' : st.soil === 'kavics' ? 'soilC' : 'soilA'});opacity:.95`, true);
        L(g, xl + 1, y, xr - 1, y + 9, 'stroke:var(--steelm2);stroke-width:3.2;stroke-linecap:round');
      }
      if (r.mode === 'short') { T(g, X, yb + 18, 'a spirál nem ér le', 't-lab t-bad halo', { 'text-anchor': 'middle' }); L(g, xl, yz(z), xr, yz(z), 'stroke:var(--bad);stroke-width:2;stroke-dasharray:5 4'); T(g, xr + 8, yz(z) + 4, `tervezett: ${fmt(z, 0)} m`, 't-sm t-bad halo'); }
      if (r.mode === 'over') for (let i = 0; i < 6; i++) { const yy = yz(hw + rnd(i) * (zNow - hw)); ar(g, xl - 30, yy + 8, xl - 4, yy, 'var(--warn)', 1.6, 5); ar(g, xr + 30, yy + 8, xr + 4, yy, 'var(--warn)', 1.6, 5); }
    } else {
      R(g, xl, G0, BW, yb - G0, 'f-surface', { opacity: 0.85 });
      if (gw && hw < zNow && r.st === 'bad') R(g, xl, yz(Math.max(hw, zNow - (zNow - hw) * kc * 0.6)), BW, yb - yz(Math.max(hw, zNow - (zNow - hw) * kc * 0.6)), 'f-water');
    }
    // fúrófej a talpon (nem CFA)
    if (m !== 'cfa' && kDrill < 1) { R(g, X - 3, 6, 6, yb - 14, 'f-steel2'); R(g, xl + 8, yb - 16, BW - 16, 14, 'f-steel'); }
    // beomlás
    if (r.mode === 'wall' && kDrill >= 1) {
      const zf = Math.min(r.zf ?? 1, z - 0.5);
      const y0 = yz(zf), y1 = yb;
      const n = 9;
      const col = SOIL[st.soil].cls;
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < n; i++) {
          const yy = lerp(y0, y1, (i + 0.5) / n);
          const ki = clamp(kc * 1.6 - rnd(i * 3 + side) * 0.6, 0, 1);
          if (ki <= 0) continue;
          const xw = side < 0 ? xl : xr;
          const dep = 10 + rnd(i + side * 7) * 16, hh2 = 9 + rnd(i * 5 + side) * 9;
          // kiszakadt fészek a falban
          const below = st.gw && (yy - G0) / sc > st.hw;
          svg('path', { d: `M${xw} ${yy - hh2} Q ${xw + side * dep * ki * 1.5} ${yy - hh2 * 0.2} ${xw + side * dep * ki * 0.6} ${yy + hh2 * 0.5} Q ${xw + side * dep * ki * 0.2} ${yy + hh2} ${xw} ${yy + hh2} Z`, style: `fill:var(${below ? '--water-fill' : '--surface'});opacity:.95` }, g);
          // lehulló darab
          const fx = xw - side * (8 + rnd(i) * 18) * ki;
          const fy = lerp(yy, y1 - 6 - rnd(i + 2) * 10, ki * ki);
          R(g, fx - 6, fy - 5, 12, 10, col, { transform: `rotate(${ki * 140 * side} ${fx} ${fy})`, style: 'stroke:var(--soil-line);stroke-width:.8' });
        }
      }
      // felhalmozódó törmelék a talpon
      const hh = 34 * kc;
      if (hh > 0) { P(g, [[xl, y1], [xl, y1 - hh * 0.7], [X, y1 - hh], [xr, y1 - hh * 0.7], [xr, y1]], `fill:var(--${st.soil === 'agyag' ? 'soilB' : st.soil === 'kavics' ? 'soilC' : 'soilA'});stroke:var(--soil-line);stroke-width:1`, true); }
      if (kc > 0.5) T(g, xr + 12, y1 - 10, 'beomlott talaj a talpon', 't-sm t-bad halo');
    }
    if (r.mode === 'under' && kDrill >= 1) {
      const y1 = yb, k = kc;
      for (let i = 0; i < 14; i++) { const a = rnd(i) * Math.PI; const rr = 50 * (1 - ((u * 0.6 + rnd(i + 4)) % 1)); const cx = X + Math.cos(a) * (BW / 2 + rr) * (i % 2 ? 1 : -1); const cy = y1 - 10 + Math.sin(a) * 10; C(g, cx, cy, 2.6, 'f-ink', { opacity: 0.55 * k + 0.2 }); }
      ar(g, xl - 40, y1 + 10, xl + 6, y1 - 14, 'var(--bad)', 2.4, 8); ar(g, xr + 40, y1 + 10, xr - 6, y1 - 14, 'var(--bad)', 2.4, 8);
      R(g, xl - 46, y1 - 50, BW + 92, 60, '', { fill: 'url(#pat-soil)', opacity: 0.8 * k });
      T(g, xr + 12, y1 + 26, 'fellazult környezet', 't-sm t-bad halo');
    }
    if ((r.mode === 'boil' || r.mode === 'boilS') && kDrill >= 1) {
      const y1 = yb, big = r.mode === 'boil';
      for (let i = 0; i < 5; i++) { const xx = xl + 8 + i * (BW - 16) / 4; const k = (u * (big ? 1.4 : 0.5) + i * 0.2) % 1; ar(g, xx, y1 + 30 - k * 18, xx, y1 + 10 - k * 24, 'var(--water)', big ? 2.4 : 1.6, 7); }
      if (big) {
        for (let i = 0; i < 18; i++) { const k = (u * 0.9 + rnd(i)) % 1; C(g, xl + 6 + rnd(i + 1) * (BW - 12), y1 - k * 40, 2.4, 'f-soilA', { style: 'stroke:var(--soil-line);stroke-width:.6' }); }
        P(g, [[xl, y1], [xl + 10, y1 - 14 * kc], [X, y1 - 22 * kc], [xr - 10, y1 - 14 * kc], [xr, y1]], 'fill:var(--soilA);stroke:var(--soil-line);stroke-width:1', true);
      }
      R(g, xl - 30, y1, BW + 60, 40, '', { fill: 'url(#pat-soil)', opacity: 0.9 * kc });
      T(g, xr + 12, y1 + 22, big ? 'felbuzgás – fellazult talp' : 'felpuhuló talp', 't-sm t-bad halo');
    }
    if (r.st === 'ok' && kDrill >= 1 && m !== 'zagy') { const k = clamp((u - 1.6) / 0.4, 0, 1); C(g, X, yb + 26, 14 * k, 'f-ok'); T(g, X, yb + 31, '✓', 't-big', { 'text-anchor': 'middle', style: 'fill:#fff;font-size:16px', opacity: k }); }
  };
  rebuild();
  loop(root, (tt) => draw(performance.now() / 1000));
  onTheme(rebuild);
});

/* ================================================================== 3. Kontraktorcsöves betonozás */
register('furtTremie', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sE = slider(ctrls, { label: 'A cső bemerülése a betonba (cél)', min: 0, max: 4, step: 0.5, value: 2, unit: 'm', d: 1, hint: 'A gépkezelő a csövet 2 m-es szakaszokban bontja, és úgy emeli, hogy a vége legalább ennyire a betonban maradjon. 1 m alatti célnál egy emelés könnyen kirántja.' });
  const row = h('div', { class: 'play-row' });
  const bPlay = h('button', { class: 'btn btn-acc btn-sm', type: 'button' }, '▶ Betonozás');
  const bJerk = h('button', { class: 'btn btn-line btn-sm', type: 'button' }, 'Kirántom a csövet!');
  const bReset = h('button', { class: 'btn btn-line btn-sm', type: 'button' }, 'Újra');
  row.append(bPlay, bJerk, bReset); ctrls.append(row);
  ctrls.append(h('p', { class: 'ctl-hint', html: 'Az első betonadag előtt a csőbe dugót tesznek (pl. habszivacs labdát), hogy a beton ne keveredjen a zaggyal.' }));
  const W = 520, H = 470, TOP = 66, BOT = 446, X = 230, BW = 132, HP = 16;
  const sc = (BOT - TOP) / HP;
  const yz = (zb) => BOT - zb * sc; // zb: magasság a talptól (m)
  const fig = figure(viz, W, H);
  const vd = verdict(viz);
  const oC = stat(out, { label: 'Betonszint a talptól', unit: 'm' }), oE = stat(out, { label: 'A cső bemerülése' }), oP = stat(out, { label: 'Cölöptest' });
  const bg = G(fig), dyn = G(fig);
  R(bg, 0, 0, W, TOP, 'f-sky');
  soilRect(bg, 0, TOP, W, H - TOP, 'homok');
  L(bg, 0, TOP, W, TOP, 'stroke:var(--soil-line);stroke-width:2');
  R(bg, 0, yz(HP - 2.5), W, H - yz(HP - 2.5), '', { fill: 'url(#pat-water)', opacity: 0.5 });
  gwMark(bg, W - 100, yz(HP - 2.5), 'talajvíz');
  R(bg, X - BW / 2 - 6, TOP - 14, 8, 40, 'f-steel2'); R(bg, X + BW / 2 - 2, TOP - 14, 8, 40, 'f-steel2');
  T(bg, X - BW / 2 - 10, TOP + 20, 'vezetőcső', 't-sm halo', { 'text-anchor': 'end' });
  T(bg, 10, H - 8, 'szemléltető modell · 16 m-es zagyos furat', 't-sm halo');
  let c, tip, run, inc, plugY, done, breach, last, primed;
  const reset = () => { c = 0; tip = 0.3; run = false; inc = []; plugY = -1; done = false; breach = false; last = 0; primed = false; bPlay.textContent = '▶ Betonozás'; };
  reset();
  bPlay.addEventListener('click', () => { if (done) reset(); if (plugY < 0 && c === 0) plugY = 0; run = !run; bPlay.textContent = run ? '❚❚ Szünet' : '▶ Folytatás'; });
  bReset.addEventListener('click', reset);
  bJerk.addEventListener('click', () => { if (primed && !done) { tip = c + 0.6; breach = true; } });
  const step = (dt) => {
    if (!run || done) return;
    if (plugY >= 0 && plugY < 1) { plugY += dt * 1.4; return; }
    const emb = c - tip;
    // betonáram: ha a cső vége a betonban van, alulról tölt
    c = Math.min(HP + 0.6, c + dt * 0.9);
    if (!primed) { if (c >= tip + 0.5) primed = true; }
    else if (tip > c) { // a cső vége kint van: a beton a zagyon át hullik
      if (!inc.length || inc[inc.length - 1][1] < c - 0.05) inc.push([c, c]);
      inc[inc.length - 1][1] = c + 0.15;
      if (c > tip + 0.4) { tip = c - 0.4; breach = false; } // újra bemerül
    }
    const e = sE.v;
    if (emb > e + 2 && tip < HP) { tip = e < 1 ? c + 0.4 : c - e; if (e < 1) breach = true; }
    if (c >= HP + 0.6) { done = true; run = false; bPlay.textContent = '▶ Új cölöp'; }
  };
  const draw = (tt, dt) => {
    step(dt || 0);
    clear(dyn);
    const g = dyn;
    const xl = X - BW / 2, xr = X + BW / 2;
    // zagy a furatban
    R(g, xl, TOP - 4, BW, BOT - TOP + 4, 'f-slurry');
    R(g, xl, TOP - 4, BW, BOT - TOP + 4, '', { fill: 'url(#pat-slurry)' });
    // beton
    const cy = yz(Math.min(c, HP + 0.6));
    if (c > 0) {
      R(g, xl, cy, BW, BOT - cy, 'f-fresh');
      R(g, xl, cy, BW, BOT - cy, '', { fill: 'url(#pat-conc)' });
      // a felső, zaggyal keveredett réteg
      const ct = Math.min(0.6, c);
      R(g, xl, cy, BW, ct * sc, 'f-slurry', { opacity: 0.55 });
      R(g, xl, cy, BW, ct * sc, '', { fill: 'url(#pat-soil)', opacity: 0.7 });
      // zárványok
      let lab1 = false;
      for (const [a, b] of inc) {
        if (a >= c - 0.6) continue;
        const ya = yz(Math.min(b, c - 0.6)), yb2 = yz(a);
        R(g, xl, ya, BW, yb2 - ya, 'f-slurry');
        for (let i = 0; i < 12; i++) C(g, xl + 6 + rnd(i + a * 10) * (BW - 12), ya + rnd(i * 2 + a) * (yb2 - ya), 3, 'f-conc2', { opacity: 0.8 });
        L(g, xr + 4, (ya + yb2) / 2, xr + 30, (ya + yb2) / 2 - 6, 'stroke:var(--bad);stroke-width:1.5');
        if (!lab1) { T(g, xr + 34, (ya + yb2) / 2 - 4, 'zagyzárvány', 't-lab t-bad halo'); lab1 = true; }
      }
    }
    // vasalókosár
    for (const xx of [xl + 14, xr - 14]) L(g, xx, yz(HP - 0.2), xx, yz(0.3), 'stroke:var(--rebar);stroke-width:3');
    for (let zb = 0.6; zb < HP; zb += 0.8) L(g, xl + 14, yz(zb), xr - 14, yz(zb), 'stroke:var(--rebar);stroke-width:1.4;opacity:.8');
    // kontraktorcső + tölcsér
    const ty = yz(tip);
    R(g, X - 8, 26, 16, ty - 26, 'f-steel', { style: 'stroke:var(--steelm2);stroke-width:1.5' });
    for (let zb = tip + 2; zb < HP + 3; zb += 2) { const yy = yz(zb); if (yy > 30) L(g, X - 10, yy, X + 10, yy, 'stroke:var(--steelm2);stroke-width:3'); }
    P(g, [[X - 40, 2], [X + 40, 2], [X + 10, 28], [X - 10, 28]], 'fill:var(--steelm);stroke:var(--steelm2);stroke-width:1.5', true);
    if (run) R(g, X - 30, 4, 60, 8, 'f-fresh');
    // dugó
    if (plugY >= 0 && plugY < 1) { C(g, X, lerp(30, ty - 8, plugY), 7, 'f-acc'); T(g, X + 14, lerp(30, ty - 8, plugY) + 4, 'dugó', 't-sm halo'); }
    // áramlás
    if (run && plugY >= 1) {
      const k = (tt * 1.6) % 1;
      if (tip <= c) { for (let i = 0; i < 2; i++) { const yy = ty - 10 + ((k + i / 2) % 1) * 16; ar(g, X - 22, yy, X - 40, yy - 10, 'var(--surface)', 2, 6); ar(g, X + 22, yy, X + 40, yy - 10, 'var(--surface)', 2, 6); } }
      else { for (let i = 0; i < 6; i++) C(g, X - 10 + rnd(i) * 20, ty + ((k + i / 6) % 1) * (cy - ty), 3.2, 'f-fresh', { style: 'stroke:var(--surface);stroke-width:1' }); }
      // kiszoruló zagy
      ar(g, xr - 4, TOP + 4, xr + 60, TOP - 22, 'var(--bento)', 3, 9);
      T(g, W - 8, TOP - 30, 'kiszoruló zagy → tartály', 't-sm halo', { 'text-anchor': 'end' });
    }
    // felirat: bemerülés
    if (c > 0 && tip < c) { const yA = yz(c), yB2 = ty; L(g, xl - 18, yA, xl - 18, yB2, 'stroke:var(--grp);stroke-width:2'); L(g, xl - 24, yA, xl - 12, yA, 'stroke:var(--grp);stroke-width:2'); L(g, xl - 24, yB2, xl - 12, yB2, 'stroke:var(--grp);stroke-width:2'); T(g, xl - 28, (yA + yB2) / 2 + 4, `${fmt(c - tip, 1)} m`, 't-num halo', { 'text-anchor': 'end' }); }
    if (done) { L(g, xl - 30, yz(HP - 0.6), xr + 30, yz(HP - 0.6), 'stroke:var(--bad);stroke-width:1.6;stroke-dasharray:6 4'); T(g, xr + 34, yz(HP - 0.6) + 4, 'eddig levésik a fejet', 't-sm t-bad halo'); }
    // kimenetek (ritkítva)
    if (tt - last > 0.12 || dt === 0) {
      last = tt;
      const emb = c - tip;
      oC.set(Math.min(c, HP), null);
      if (!primed) oE.set('–', null, c > 0 ? 'indul…' : '–'); else { oE.set(emb, emb < 0 ? 'bad' : emb < 1.5 ? 'warn' : 'ok', emb < 0 ? 'kint van!' : null); if (emb >= 0) oE.el.querySelector('.stat-v').innerHTML += '<small>m</small>'; }
      const bad = inc.some(([a]) => a < c - 0.6) || (tip > c && primed);
      oP.set(bad ? 'zagyzárvány' : 'ép', bad ? 'bad' : c > 0 ? 'ok' : null);
      if (bad) vd.set('bad', 'Zagyzárvány – folytonossági hiány.', ' A cső vége kiemelkedett a betonból: az új beton a zagyon át hullott, keveredett vele, és a cölöptestben gyenge, zagyos réteg maradt. A csövet mindig úgy kell emelni, hogy a vége a friss betonban maradjon.');
      else if (done) vd.set('ok', 'Kész a cölöp.', ' A beton alulról felfelé, egy tömbben töltötte ki a furatot, és kiszorította a zagyot. A legfelső, zaggyal keveredett réteget a cölöpfej kialakításakor levésik – ezért a cölöpöt a tervezett fejszint fölé betonozzák.');
      else if (primed && emb < 1.5 && emb >= 0) vd.set('warn', 'Kevés a bemerülés.', ' A cső vége alig van a betonban: egy hirtelen emelésnél kiemelkedhet. Biztonságosabb nagyobb bemerüléssel dolgozni.');
      else vd.set(c > 0 ? 'ok' : '', c > 0 ? 'Rendben: a cső vége a betonban.' : 'Indítsd a betonozást!', c > 0 ? ' A beton a cső végén át alulról tölti a furatot, a már bent lévő betont emeli fel, a zagy nem keveredik bele.' : ' A furatban zagy és a vasalókosár. A betont a tölcséren és a kontraktorcsövön át, a furat aljától kezdve juttatjuk be.');
    }
  };
  loop(root, (tt, dt) => draw(tt, dt));
  draw(0, 0);
});

/* ================================================================== 4. CFA-monitor */
register('furtCfa', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sD = seg(ctrls, { label: 'Átmérő', options: [40, 60, 80, 100, 120].map((v) => ({ v, t: v + ' cm' })), value: 60 });
  const sL = slider(ctrls, { label: 'Cölöphossz', min: 6, max: 24, step: 1, value: 14, unit: 'm', d: 0 });
  const sV = slider(ctrls, { label: 'Húzási sebesség', sym: 'v', min: 0.2, max: 4, step: 0.1, value: 1.5, unit: 'm/perc', d: 1 });
  const sP = slider(ctrls, { label: 'Betonnyomás', sym: 'p', min: 0, max: 10, step: 0.5, value: 5, unit: 'bar', d: 1, hint: 'Szemléltető modell: a betonáram a nyomással arányos (1 bar ≈ 6 m³/óra).' });
  const row = h('div', { class: 'play-row' });
  const bGo = h('button', { class: 'btn btn-acc btn-sm', type: 'button' }, '▶ Fúrás és betonozás');
  const bFast = h('button', { class: 'btn btn-line btn-sm', type: 'button', 'aria-pressed': 'false' }, '×4 gyorsítás');
  row.append(bGo, bFast); ctrls.append(row);
  const W = 600, H = 430, G0 = 56, BOT = 410;
  const fig = figure(viz, W, H);
  const vd = verdict(viz);
  const rep = h('div', { class: 'furt-rep', hidden: true }); viz.append(rep);
  const oZ = stat(out, { label: 'A spirál talpa', unit: 'm' }), oQ = stat(out, { label: 'Betonáram', unit: 'm³/óra', d: 0 }), oR = stat(out, { label: 'Betonfogyás / elméleti', unit: '%' }), oV = stat(out, { label: 'Bedolgozott beton', unit: 'm³' });
  const bg = G(fig), dyn = G(fig);
  const XS = 140, BWmax = 92; // metszet
  const CX0 = 330, CX1 = 580; // diagram
  const rMin = 0, rMax = 1.6;
  const cx = (r) => CX0 + (clamp(r, rMin, rMax) - rMin) / (rMax - rMin) * (CX1 - CX0);
  let st, fast = false, pileNo = 17;
  const A = () => Math.PI * (sD.v / 100) ** 2 / 4;
  const Q = () => sP.v * 0.1; // m³/perc
  const sc = () => (BOT - G0) / sL.v;
  const paintBg = () => {
    clear(bg);
    const L0 = sL.v, k = sc();
    R(bg, 0, 0, W, G0, 'f-sky');
    soilRect(bg, 0, G0, 290, H - G0, 'homok');
    R(bg, 0, G0 + 0.45 * (BOT - G0), 290, 0.25 * (BOT - G0), 'f-soilE', { opacity: 0.55 });
    T(bg, 8, G0 + 0.45 * (BOT - G0) + 16, 'puha, iszapos réteg', 't-sm halo');
    L(bg, 0, G0, 290, G0, 'stroke:var(--soil-line);stroke-width:2');
    T(bg, 8, G0 + 16, 'közepes homok', 't-sm halo');
    // gép
    R(bg, XS - 120, G0 - 18, 90, 18, 'f-steel2', { rx: 3 }); R(bg, XS - 100, G0 - 50, 50, 32, 'f-steel', { rx: 4 });
    R(bg, XS - 30, 6, 7, G0 - 24, 'f-acc'); L(bg, XS - 23, 10, XS, 10, 'stroke:var(--accent);stroke-width:4');
    // diagram háttér
    R(bg, CX0, G0, CX1 - CX0, BOT - G0, 'f-surface', { style: 'stroke:var(--line2);stroke-width:1' });
    R(bg, cx(1.0), G0, cx(1.25) - cx(1.0), BOT - G0, 'f-ok', { opacity: 0.12 });
    for (const r of [0, 0.5, 1, 1.5]) { L(bg, cx(r), G0, cx(r), BOT, `stroke:var(--line2);stroke-width:${r === 1 ? 2 : 1}`); T(bg, cx(r), BOT + 15, fmt(r * 100, 0) + ' %', 't-sm', { 'text-anchor': 'middle' }); }
    T(bg, (CX0 + CX1) / 2, G0 - 26, 'betonfogyás / elméleti', 't-lab', { 'text-anchor': 'middle' });
    T(bg, cx(1.12), G0 - 8, 'jó tartomány', 't-sm t-ok', { 'text-anchor': 'middle' });
    const stp = L0 > 16 ? 4 : 2;
    for (let z = 0; z <= L0; z += stp) { L(bg, CX0 - 6, G0 + z * k, CX0, G0 + z * k, 'stroke:var(--ink2)'); T(bg, CX0 - 9, G0 + z * k + 4, `${z}`, 't-sm', { 'text-anchor': 'end' }); }
    T(bg, CX0 - 9, G0 - 8, 'm', 't-sm', { 'text-anchor': 'end' });
  };
  const fresh = () => {
    const L0 = sL.v, n = Math.round(L0 / 0.25);
    st = { phase: 'idle', z: 0, bins: new Array(n).fill(null), n, vol: 0, pmin: Infinity, vmax: 0, tsum: 0 };
    rep.hidden = true; paintBg();
    vd.set('', 'Készen áll a gép.', ' Indítsd a fúrást: a spirál lehajt a végső mélységig, aztán te húzod fel – a betonnyomással és a húzási sebességgel együtt.');
  };
  sD.on(() => { if (st.phase !== 'pull') fresh(); }); sL.on(() => { if (st.phase !== 'pull' && st.phase !== 'drill') fresh(); });
  bGo.addEventListener('click', () => { if (st.phase === 'drill' || st.phase === 'pull') return; fresh(); st.phase = 'drill'; pileNo++; });
  bFast.addEventListener('click', () => { fast = !fast; bFast.setAttribute('aria-pressed', fast); bFast.classList.toggle('on', fast); bFast.textContent = fast ? '×1 normál' : '×4 gyorsítás'; });
  const finish = () => {
    st.phase = 'done';
    const a = A(), L0 = sL.v, Vth = a * L0;
    const bins = st.bins.map((b) => b ?? 0);
    let lo = Infinity, loZ = 0; const necks = [];
    bins.forEach((r, i) => { if (r < lo) { lo = r; loZ = (i + 0.5) * 0.25; } if (r < 1) necks.push(i); });
    let rng = '';
    if (necks.length) { const z1 = necks[0] * 0.25, z2 = (necks[necks.length - 1] + 1) * 0.25; rng = `<span class="nw">${fmt(z1, 2)}–${fmt(z2, 2)} m</span>`; }
    const tot = st.vol / Vth;
    const verdictTxt = necks.length ? ['bad', `NYAKASODÁS GYANÚ · ${rng}`] : tot > 1.4 ? ['warn', 'TÚLZOTT BETONFOGYÁS – vizsgálat javasolt'] : lo < 1.05 ? ['warn', 'MEGFELELŐ – szűk tartalékkal'] : ['ok', 'MEGFELELŐ'];
    rep.hidden = false;
    rep.innerHTML = `<div class="furt-rep-h"><b>Cölöpkészítési jegyzőkönyv</b><span>CFA · C05-${String(pileNo).padStart(3, '0')}</span></div>
      <dl>
        <dt>Átmérő / hossz</dt><dd>${sD.v} cm / ${fmt(L0, 1)} m</dd>
        <dt>Elméleti betontérfogat</dt><dd>${fmt(Vth, 2)} m³</dd>
        <dt>Bedolgozott beton</dt><dd>${fmt(st.vol, 2)} m³ (${fmt(tot * 100, 0)} %)</dd>
        <dt>Legkisebb fogyás</dt><dd>${fmt(lo * 100, 0)} % (${fmt(loZ, 2)} m-en)</dd>
        <dt>Átlagos / legnagyobb húzási sebesség</dt><dd>${fmt(L0 / Math.max(0.01, st.tsum), 2)} / ${fmt(st.vmax, 1)} m/perc</dd>
        <dt>Legkisebb betonnyomás</dt><dd>${fmt(st.pmin, 1)} bar</dd>
      </dl>
      <div class="furt-stamp" data-s="${verdictTxt[0]}">${verdictTxt[1]}</div>`;
    if (necks.length) vd.set('bad', 'Nyakasodás!', ` ${rng} között a spirált gyorsabban húztad, mint ahogy a beton a felszabaduló teret kitöltötte: a talaj a beton helyére nyomódott, a cölöp ott elvékonyodott. Lassíts, vagy növeld a betonnyomást!`);
    else if (tot > 1.4) vd.set('warn', 'Sok beton fogyott.', ' A beton jóval több, mint az elméleti térfogat: túl nagy nyomással a beton a puha rétegbe préselődik. Ez önmagában nem hiba, de a nagy túlfogyást vizsgálni kell (üreg, nagyon puha réteg?).');
    else vd.set('ok', 'Szép munka!', ' A betonáram végig lépést tartott a húzással – a cölöp teljes hosszában legalább az elméleti keresztmetszettel készült, enyhe túlfogyással.');
  };
  const draw = (tt, dt) => {
    const sp = (fast ? 4 : 1) * 0.8; // szimulált perc / valós s
    const L0 = sL.v, k = sc();
    if (st.phase === 'drill') { st.z = Math.min(L0, st.z + dt * 6 * (fast ? 3 : 1)); if (st.z >= L0) st.phase = 'pull'; }
    else if (st.phase === 'pull') {
      const dtm = dt * sp, v = sV.v, q = Q(), a = A();
      const dz = v * dtm;
      const z0 = st.z, z1 = Math.max(0, z0 - dz);
      const r = q / (v * a);
      for (let i = Math.floor(z1 / 0.25); i <= Math.min(st.n - 1, Math.floor((z0 - 1e-9) / 0.25)); i++) st.bins[i] = r;
      st.vol += Math.min(q * dtm, a * (z0 - z1) * 3);
      st.pmin = Math.min(st.pmin, sP.v); st.vmax = Math.max(st.vmax, v); st.tsum += dtm;
      st.z = z1;
      if (st.z <= 0) finish();
    }
    clear(dyn);
    const g = dyn;
    const bw = BWmax * sD.v / 120;
    const xl = XS - bw / 2;
    // kész cölöp (alulról)
    for (let i = 0; i < st.n; i++) {
      const r = st.bins[i]; if (r === null) continue;
      const y = G0 + i * 0.25 * k, hh = 0.25 * k + 0.3;
      const w = r < 1 ? bw * Math.sqrt(Math.max(0.08, r)) : bw * Math.sqrt(Math.min(r, 1.35));
      R(g, XS - w / 2, y, w, hh, r < 1 ? 'f-bad' : 'f-fresh', { opacity: r < 1 ? 0.75 : 1 });
      // diagram oszlop
      R(g, CX0, y, cx(r) - CX0, hh, r < 1 ? 'f-bad' : r > 1.4 ? 'f-warn' : 'f-grp');
    }
    for (const rr of [1, 1.25]) L(g, cx(rr), G0, cx(rr), BOT, `stroke:var(--${rr === 1 ? 'ink' : 'ok'});stroke-width:1.5;stroke-dasharray:${rr === 1 ? '0' : '4 3'};opacity:.7`);
    // furat a spirál felett/alatt
    if (st.phase === 'drill' || st.phase === 'pull') {
      const yb = G0 + st.z * k;
      R(g, XS - 4, 8, 8, yb - 8, 'f-steel2');
      const pitch = 20, ph = (tt * (st.phase === 'drill' ? 60 : 10)) % pitch;
      for (let y = Math.max(G0, yb - L0 * k) + ph; y < yb - 4; y += pitch) {
        P(g, [[xl + 2, y + 4], [xl + bw - 2, y + 12], [xl + bw - 2, y + 18], [xl + 2, y + 10]], 'fill:var(--soilA);opacity:.95', true);
        L(g, xl + 1, y, xl + bw - 1, y + 8, 'stroke:var(--steelm2);stroke-width:3;stroke-linecap:round');
      }
      if (st.phase === 'pull' && sP.v > 0) { const kk = (tt * 3) % 1; ar(g, XS, yb - 30 + kk * 20, XS, yb - 6 + kk * 14, 'var(--surface)', 2, 6); }
      // aktuális sor a diagramon
      L(g, CX0, yb, CX1, yb, 'stroke:var(--ink);stroke-width:1;stroke-dasharray:3 3');
      if (st.phase === 'pull') { const r = Q() / (sV.v * A()); C(g, cx(r), yb, 6, r < 1 ? 'f-bad' : 'f-ok', { style: 'stroke:var(--surface);stroke-width:2' }); }
    }
    T(g, XS, BOT + 16, `Ø ${sD.v} cm · ${fmt(L0, 0)} m`, 't-sm', { 'text-anchor': 'middle' });
    // kimenetek
    const q = Q(), r = q / (sV.v * A());
    oZ.set(st.z, null);
    oQ.set(q * 60, null);
    oR.set(r * 100, r < 1 ? 'bad' : r < 1.05 || r > 1.4 ? 'warn' : 'ok', fmt(r * 100, 0));
    oV.set(st.vol, null, fmt(st.vol, 2));
    if (st.phase === 'pull') {
      if (r < 1) vd.set('bad', 'Vigyázz – nyakasodik!', ` Most ${fmt(r * 100, 0)} %: kevesebb beton érkezik, mint amennyi teret a spirál felszabadít. Lassíts, vagy adj több nyomást!`);
      else if (r > 1.4) vd.set('warn', 'Sok a beton.', ' A beton a talajba préselődik – pazarló, és megemelheti a környezetet. Csökkentsd a nyomást, vagy húzz kicsit gyorsabban.');
      else vd.set('ok', 'Jó ütem.', ` A betonáram lépést tart a húzással (${fmt(r * 100, 0)} %). Tartsd így a felszínig!`);
    } else if (st.phase === 'drill') vd.set('', 'Fúrás…', ' A spirál lehajt; a furadék a meneteken marad, és megtámasztja a falat. A csapóajtó zárva.');
  };
  fresh();
  loop(root, (tt, dt) => draw(tt, dt));
  draw(0, 0);
  onTheme(paintBg);
});

/* ================================================================== 5. Technológiaválasztó */
const PICK_SOIL = [
  { v: 'kot', t: 'kötött (agyag, iszap)' },
  { v: 'szem', t: 'szemcsés (homok, kavics)' },
  { v: 'laza', t: 'laza, folyós vagy iszapos rétegekkel' },
  { v: 'felt', t: 'felül törmelékes feltöltés' },
  { v: 'kem', t: 'kemény réteg, puhább kőzet' },
];
function pickEval(o) {
  const { soil, gw, D, L0, vib, fast, big } = o;
  const res = [];
  // CFA
  {
    const r = { id: 'cfa', t: 'CFA (folyamatos spirál)', s: 3, why: [], out: null, href: '#furt-cfa' };
    if (D > 120) r.out = 'legfeljebb 120 cm átmérő'; else r.why.push(['ok', `Ø ${D} cm: a 40–120 cm-es tartományban`]);
    if (L0 > 24) r.out = r.out || 'legfeljebb 22–24 m hosszú'; else if (L0 > 22) { r.s -= 1; r.why.push(['warn', 'hossz a 22–24 m-es felső határon']); } else if (L0 < 6) { r.s -= 0.5; r.why.push(['warn', 'nagyon rövid cölöp – a szokásos hossz 6–22 m']); } else r.why.push(['ok', `${L0} m: belefér a 6–22 m-be`]);
    if (soil === 'laza') { r.s -= 2.5; r.why.push(['bad', 'laza, folyós talajba nem javasolt']); }
    if (soil === 'felt') { r.s -= 0.5; r.why.push(['warn', 'a feltöltést felül markolással érdemes átfúrni']); }
    if (soil === 'kem') r.why.push(['warn', 'kemény rétegben speciális fúrófej kell']);
    if (fast) { r.s += 1; r.why.push(['ok', 'gyors, egyszerű gépészet']); }
    if (vib) { r.s += 1; r.why.push(['ok', 'zaj- és rezgésszegény']); }
    if (big) { r.s -= 0.5; r.why.push(['warn', 'nagy teherbírásnál a nagy átmérőjű cölöp előnyösebb lehet']); }
    r.why.push(['ok', 'automata monitorozás, jegyzőkönyv']);
    res.push(r);
  }
  // köpenycsöves
  {
    const r = { id: 'kop', t: 'Köpenycsöves (béléscsöves)', s: 2.5, why: [], out: null, href: '#furt-kopeny' };
    if (D < 80) r.out = 'legalább 80 cm átmérő'; else r.why.push(['ok', `Ø ${D} cm: a 80–180 cm-es tartományban`]);
    if (L0 < 15) { r.s -= 1; r.why.push(['warn', 'rövid cölöphöz összetett, lassú technológia']); } else r.why.push(['ok', `${L0} m: belefér a 15–50 (100) m-be`]);
    if (soil === 'laza') { r.s += 1.5; r.why.push(['ok', 'különösen kedvezőtlen, iszapos talajban is biztonságos']); }
    if (gw && (soil === 'szem' || soil === 'laza')) r.why.push(['warn', 'a cső járjon a kiemelés előtt, a vizet pótolni kell']);
    if (big) { r.s += 1; r.why.push(['ok', 'nagy teherbírás']); }
    if (fast) { r.s -= 1; r.why.push(['warn', 'lassabb fúrási sebesség']); }
    if (vib) r.why.push(['warn', 'a csövet forgatással mozgassák, ne vibrálással']);
    r.why.push(['warn', 'összetett gépészet']);
    res.push(r);
  }
  // zagyos
  {
    const r = { id: 'zagy', t: 'Bentonitzagyos', s: 2.5, why: [], out: null, href: '#furt-zagy' };
    if (D < 80) r.out = 'legalább 80 cm átmérő'; else r.why.push(['ok', `Ø ${D} cm: a 80–180 cm-es tartományban`]);
    if (L0 < 15) { r.s -= 1; r.why.push(['warn', 'rövid cölöphöz összetett technológia']); } else r.why.push(['ok', `${L0} m: belefér a 15–50 m-be`]);
    if (L0 > 30) { r.s += 1; r.why.push(['ok', 'nagy mélységben a gép kapacitása nem korlát']); }
    if (soil === 'laza') { r.s += 0.5; r.why.push(['ok', 'bármely talajban alkalmazható']); }
    if (big) { r.s += 1; r.why.push(['ok', 'nagy teherbírás']); }
    if (fast) { r.s -= 1; r.why.push(['warn', 'lassabb, zagytelep kell']); } else r.why.push(['warn', 'zagykeverő és -tisztító telep kell']);
    res.push(r);
  }
  // megtámasztás nélküli
  {
    const r = { id: 'nel', t: 'Megtámasztás nélküli furat', s: 3.5, why: [], out: null, href: '#furt-nelkul' };
    if (soil !== 'kot') r.out = 'csak kötött talajban'; else r.why.push(['ok', 'kötött talaj']);
    if (gw) r.out = r.out || 'csak talajvíz felett'; else r.why.push(['ok', 'nincs talajvíz']);
    if (L0 > 10) r.out = r.out || 'legfeljebb 8–10 m mély'; else if (L0 > 8) { r.s -= 1; r.why.push(['warn', 'a 8–10 m-es határon – azonnal betonozni']); } else r.why.push(['ok', `${L0} m ≤ 8 m${L0 <= 6 ? ' (markolt tömbalap, kútalap)' : ''}`]);
    if (big) { r.s -= 1; r.why.push(['warn', 'nagy teherbíráshoz rövid']); }
    r.why.push(['ok', 'egyszerű, olcsó']);
    res.push(r);
  }
  const ins = res.filter((r) => !r.out).sort((a, b) => b.s - a.s);
  const best = ins[0]?.s;
  for (const r of res) r.lab = r.out ? ['bad', 'Nem alkalmas'] : r.s === best ? ['ok', 'Ajánlott'] : r.s >= best - 1 ? ['warn', 'Szóba jöhet'] : ['warn', 'Kevésbé előnyös'];
  return [...ins, ...res.filter((r) => r.out)];
}
register('furtPick', (root) => {
  const { ctrls, viz, out } = shell(root);
  const sS = select(ctrls, { label: 'Talaj', options: PICK_SOIL, value: 'szem' });
  const sGw = toggle(ctrls, { label: 'Talajvíz a cölöp hosszán', value: true });
  const sD = slider(ctrls, { label: 'Átmérő', min: 40, max: 180, step: 10, value: 60, unit: 'cm', d: 0 });
  const sL = slider(ctrls, { label: 'Cölöphossz', min: 4, max: 50, step: 1, value: 14, unit: 'm', d: 0 });
  const tV = toggle(ctrls, { label: 'Rezgés- és zajérzékeny környezet', value: true });
  const tF = toggle(ctrls, { label: 'Szoros határidő', value: false });
  const tB = toggle(ctrls, { label: 'Nagy teherbírási igény', value: false });
  out.remove();
  const list = h('div', { class: 'furt-pick' }); viz.append(list);
  const draw = () => {
    const rs = pickEval({ soil: sS.v, gw: sGw.v, D: sD.v, L0: sL.v, vib: tV.v, fast: tF.v, big: tB.v });
    clear(list);
    for (const r of rs) {
      const row = h('a', { class: 'furt-pk' + (r.out ? ' off' : ''), href: r.href },
        h('span', { class: 'furt-pk-n' }, r.t),
        h('span', { class: 'chip ' + r.lab[0] }, r.lab[1]),
        h('span', { class: 'furt-pk-bar' }, h('i', { style: { width: (r.out ? 0 : clamp(r.s / 5.5, 0.05, 1) * 100) + '%' } })),
        h('span', { class: 'furt-pk-why', html: r.out ? `<em class="t-bad">✗ ${r.out}</em>` : r.why.map(([s, t]) => `<span class="${s}">${s === 'ok' ? '✓' : s === 'bad' ? '✗' : '!'} ${t}</span>`).join('') }));
      list.append(row);
    }
  };
  [sS, sGw, sD, sL, tV, tF, tB].forEach((c) => c.on(draw));
  draw();
});

/* ================================================================== Kvíz */
defineQuiz('furt', 'Kvíz – fúrt cölöpök', [
  { q: 'Mi támasztja meg a furat falát CFA-cölöp készítésekor?', a: ['A spirálon maradó talajdugó', 'Bentonitzagy', 'Acél béléscső', 'Semmi – a betont azonnal bejuttatják'], c: 0, e: 'Lehajtás közben a furadék csak részben nyomódik ki, a spirálon maradó talajdugó folyamatosan támasztja a falat – külön technológia nem kell.' },
  { q: 'Szemcsés talajban hogyan kell a béléscsövet mélyíteni?', a: ['A földkiemelés előtt kell járnia', 'Elég a kiemelés után, ha már látszik a talajvíz', 'Csak a talajvízszint alatt kell', 'Mindegy, a cső a végén úgyis megtámaszt'], c: 0, e: 'Ha a kiemelés megelőzi a csövet, a cső alatti szabad falszakasz beomlik, a talaj befolyik, a környezet fellazul.' },
  { q: 'Mi történik, ha talajvíz alatt a béléscsőben alacsonyabban áll a víz, mint kint?', a: ['A talpon betör a talajvíz, és fellazítja a talajt', 'A cső felúszik', 'A beton gyorsabban köt meg', 'Semmi, a cső vízzáró'], c: 0, e: 'A vízszintkülönbség felfelé irányuló áramlást indít a talpon (felbuzgás): a víz magával ragadja a szemcséket. Ezért a furatban pótolni kell a kiemelt vizet.' },
  { q: 'Mikor alkalmazható megtámasztás nélküli furat?', a: ['Kötött talajban, talajvíz felett, legfeljebb 8–10 m-ig', 'Szemcsés talajban, ha a talajvíz mélyen van, legfeljebb 20 m-ig', 'Bármely talajban, ha gyorsan betonozunk', 'Talajvíz alatt, ha a furat rövid'], c: 0, e: 'Kötött talajban, talajvíz felett, nem túl hosszú furatnál – és a kiemelés után rögtön ki kell betonozni.' },
  { q: 'Miért nem kell a CFA-cölöp betonját vibrálni?', a: ['A folyós konzisztencia és a nyomás alatti bedolgozás öntömörödést biztosít', 'Mert a CFA-cölöp vasalatlan', 'Mert a spirál forgása tömöríti', 'Mert a talajdugó összenyomja'], c: 0, e: 'A betont a fúrószáron át, túlnyomással pumpálják: a folyós beton és a nyomás együtt tömörít.' },
  { q: 'Mi a nyakasodás egy CFA-cölöpnél?', a: ['Elvékonyodás, ha a spirált gyorsabban húzzák, mint ahogy a beton a teret kitölti', 'A cölöpfej megvastagodása a túlbetonozástól', 'A vasalókosár felúszása a friss betonban', 'A fúrószár elhajlása kemény rétegben'], c: 0, e: 'Ha a betonáram nem tart lépést a húzással, a talaj a beton helyére nyomódik. A gépek ezért folyamatosan mérik a betonnyomást és a betonmennyiséget.' },
  { q: 'Melyik technológia NEM alkalmas egy 150 cm átmérőjű cölöphöz?', a: ['CFA', 'Köpenycsöves fúrt cölöp', 'Bentonitzagyos fúrt cölöp'], c: 0, e: 'A CFA-cölöp átmérője 40–120 cm; a köpenycsöves és a zagyos cölöp 80–180 cm-ig készül.' },
  { q: 'Kontraktorcsöves betonozásnál mi a legfontosabb szabály?', a: ['A cső vége végig a friss betonba merüljön', 'A cső végét a betonozás elején ki kell emelni a zagyból', 'A betont a cső tetejéről a zagyra kell önteni', 'A zagyot betonozás előtt le kell szivattyúzni a furatból'], c: 0, e: 'Ha a cső vége kiemelkedik, az új beton a zagyon át hullik, keveredik vele, és zagyzárvány – folytonossági hiány – keletkezik.' },
  { q: 'Miért veszélyes a furat talpán maradt fellazult, leülepedett talaj?', a: ['Jelentősen csökkentheti a talpellenállást', 'Növeli a köpenysúrlódást', 'Megakadályozza a vasalás behelyezését', 'Nincs jelentősége, a beton kiszorítja'], c: 0, e: 'A cölöp talpa a fellazult rétegen ül – a talpellenállás jelentősen kisebb lehet a tervezettnél.' },
  { q: 'Melyik talajkiemelő eszköz való elsősorban szemcsés talajhoz?', a: ['Dobfúró', 'Rövid spirál', 'Csavart fúrófej'], c: 0, e: 'A dobfúró a szemcsés talajt a dobban viszi ki; a rövid spirál elsősorban kötött talajhoz való, a csavart fúrófej pedig nem kiemel, hanem kiszorít.' },
]);
