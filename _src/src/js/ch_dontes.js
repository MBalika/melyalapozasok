// C10 – Melyiket válasszam? Esettanulmány-játék, technológia-mátrix, döntési fa, kvíz
// C11 – Videótár: nézési útvonal (a #vlib és a #ytlib tartalmát a ui.js tölti)
import { register, shell, seg, h, svg, figure, clear, arrow, wrapText, GUARD } from './core.js';
import { defineQuiz, ytMini } from './ui.js';
import { VIDEOS, YT } from './data.js';

/* ================================================================== közös rajzsegédek (vázlatok) */
const W = 360, H = 200;
const T = (g, x, y, t, a = 'start', cls = 't-sm halo') => svg('text', { x, y, 'text-anchor': a, class: cls, text: t }, g);
function ground(g, y0, pxm, layers) {
  svg('rect', { x: 0, y: 0, width: W, height: y0, class: 'f-sky' }, g);
  let top = y0;
  for (const [d, c, p, n] of layers) {
    const yb = d === null ? H : Math.min(H, y0 + d * pxm);
    svg('rect', { x: 0, y: top, width: W, height: yb - top, class: c }, g);
    if (p) svg('rect', { x: 0, y: top, width: W, height: yb - top, fill: `url(#${p})`, opacity: 0.6 }, g);
    if (n) T(g, W - 5, Math.min(yb - 4, top + 13), n, 'end');
    top = yb;
  }
  svg('line', { x1: 0, y1: y0, x2: W, y2: y0, class: 's-ink', 'stroke-width': 1.2, opacity: 0.6 }, g);
}
function gwl(g, y, x0 = 0, x1 = W) {
  svg('line', { x1: x0, y1: y, x2: x1, y2: y, class: 's-water', 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, g);
  T(g, x0 + 5, y - 4, '▽ talajvíz', 'start', 't-sm halo t-water');
}
function bld(g, x, y, w, hh, o = {}) {
  svg('rect', { x, y, width: w, height: hh, class: o.cls || 'f-bld', stroke: 'var(--line2)', 'stroke-width': 1 }, g);
  if (o.win !== false) {
    const cols = Math.max(1, Math.floor((w - 8) / 16)), rows = Math.max(1, Math.floor((hh - 8) / 14));
    const dx = (w - 8) / cols;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) svg('rect', { x: x + 4 + c * dx + dx * 0.25, y: y + 5 + r * 14, width: dx * 0.5, height: 7, class: 'f-bld2', opacity: 0.9 }, g);
  }
  if (o.lab) T(g, x + w / 2, y - 4, o.lab, 'middle');
}
function ghost(g, x, y, w, hh, lab) {
  svg('rect', { x, y, width: w, height: hh, fill: 'color-mix(in srgb, var(--grp) 8%, transparent)', stroke: 'var(--grp)', 'stroke-width': 1.4, 'stroke-dasharray': '5 4' }, g);
  if (lab) T(g, x + w / 2, y + hh / 2 + 4, lab, 'middle', 't-sm halo t-grp');
}
function pileQ(g, x, y1, y2, w = 7) {
  svg('rect', { x: x - w / 2, y: y1, width: w, height: y2 - y1, fill: 'color-mix(in srgb, var(--grp) 22%, transparent)', stroke: 'var(--grp)', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, g);
}
function qmark(g, x, y) {
  svg('circle', { cx: x, cy: y, r: 12, class: 'f-grp', stroke: 'var(--surface)', 'stroke-width': 2 }, g);
  svg('text', { x, y: y + 5, 'text-anchor': 'middle', class: 't-big', style: 'fill:#fff;font-size:16px', text: '?' }, g);
}
function vib(g, x, y, dir = 1) {
  for (let i = 0; i < 3; i++) {
    const r = 6 + i * 6;
    svg('path', { d: `M${x} ${y - r} A ${r} ${r} 0 0 ${dir > 0 ? 1 : 0} ${x} ${y + r}`, fill: 'none', class: 's-bad', 'stroke-width': 1.6, opacity: 1 - i * 0.25 }, g);
  }
}
function vdim(g, x, y1, y2, t) {
  svg('line', { x1: x, y1, x2: x, y2, class: 's-muted', 'stroke-width': 1 }, g);
  for (const y of [y1, y2]) svg('line', { x1: x - 4, y1: y, x2: x + 4, y2: y, class: 's-muted', 'stroke-width': 1 }, g);
  T(g, x + 6, (y1 + y2) / 2 + 4, t, 'start', 't-num halo');
}

/* ================================================================== 10.1 ESETTANULMÁNY-JÁTÉK */
const SKETCH = {
  foghij(g) {
    const y0 = 66, p = (H - y0) / 12;
    ground(g, y0, p, [[2, 'f-soilC', 'pat-soil', 'feltöltés'], [9, 'f-soilB', 'pat-clay', 'puha agyag'], [null, 'f-soilD', 'pat-gravel', 'homokos kavics']]);
    bld(g, 4, 18, 104, y0 - 18, { lab: 'érzékeny szomszéd' }); bld(g, 252, 18, 104, y0 - 18, { lab: 'érzékeny szomszéd' });
    ghost(g, 122, 22, 116, y0 - 22, 'új irodaház');
    for (const x of [136, 164, 196, 224]) pileQ(g, x, y0, y0 + 10 * p);
    vib(g, 116, 44, -1); vib(g, 244, 44, 1);
    qmark(g, 180, y0 + 5 * p);
  },
  garazs(g) {
    const y0 = 60, p = (H - y0) / 16;
    ground(g, y0, p, [[14, 'f-soilD', 'pat-gravel', 'homokos kavics'], [null, 'f-soilB', 'pat-clay', 'vízzáró agyag']]);
    svg('rect', { x: 0, y: y0 + 2 * p, width: W, height: 12 * p, class: 'f-water', opacity: 0.8 }, g);
    gwl(g, y0 + 2 * p);
    bld(g, 0, 18, 92, y0 - 18, { lab: 'régi ház' }); bld(g, 268, 18, 92, y0 - 18, { lab: 'régi ház' });
    svg('rect', { x: 96, y: y0, width: 168, height: 8 * p, class: 'f-sky' }, g);
    svg('rect', { x: 96, y: y0 + 8 * p - 2, width: 168, height: 2, class: 'f-ink', opacity: 0.35 }, g);
    for (const x of [96, 264]) pileQ(g, x, y0, y0 + 14 * p, 8);
    vdim(g, 180, y0, y0 + 8 * p, '8 m');
    qmark(g, 96, y0 + 11 * p);
  },
  pince(g) {
    const y0 = 70, p = (H - y0) / 10;
    ground(g, y0, p, [[1.5, 'f-soilC', 'pat-soil', 'feltöltés'], [6, 'f-soilB', 'pat-clay', 'puha agyag'], [null, 'f-soilD', 'pat-gravel', 'kavics']]);
    ghost(g, 70, 6, 220, 22, '+ 2 új emelet');
    bld(g, 70, 28, 220, y0 - 28);
    svg('rect', { x: 80, y: y0, width: 200, height: 30, fill: 'var(--surface)', stroke: 'var(--line2)' }, g);
    T(g, 180, y0 + 19, 'pince', 'middle');
    for (const x of [70, 280]) svg('rect', { x, y: y0 + 30, width: 14, height: 8, class: 'f-conc', stroke: 'var(--concrete2)' }, g);
    vdim(g, 96, y0, y0 + 30, '≈ 2,2 m');
    for (const [x, dx] of [[77, -10], [77, 6], [287, 10], [287, -6]]) svg('line', { x1: x, y1: y0 + 38, x2: x + dx, y2: y0 + 8 * p, stroke: 'var(--grp)', 'stroke-width': 3, 'stroke-dasharray': '5 3' }, g);
    qmark(g, 130, y0 + 60);
  },
  hid(g) {
    const yw = 42, y0 = 98, p = (H - y0) / 30;
    ground(g, y0, p, [[3, 'f-soilD', 'pat-gravel', 'homokos kavics'], [26, 'f-soilA', 'pat-sand', 'finom homok'], [null, 'f-soilE', 'pat-clay', 'teherbíró réteg']]);
    svg('rect', { x: 0, y: yw, width: W, height: y0 - yw, class: 'f-water' }, g);
    svg('rect', { x: 0, y: yw, width: W, height: y0 - yw, fill: 'url(#pat-water)' }, g);
    svg('rect', { x: 0, y: 20, width: W, height: 9, class: 'f-conc', stroke: 'var(--concrete2)' }, g);
    svg('rect', { x: 162, y: 29, width: 36, height: y0 - 29, class: 'f-conc', stroke: 'var(--concrete2)' }, g);
    svg('path', { d: `M128 ${y0} Q 145 ${y0 + 13} 162 ${y0} M198 ${y0} Q 215 ${y0 + 13} 232 ${y0}`, fill: 'var(--water-fill)', class: 's-bad', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, g);
    T(g, 112, y0 + 16, 'kimosás', 'middle', 't-sm halo t-bad');
    for (const x of [168, 180, 192]) pileQ(g, x, y0, y0 + 28 * p, 6);
    T(g, 8, yw - 5, 'Duna', 'start', 't-sm halo t-water');
    qmark(g, 228, y0 + 16 * p);
  },
  iszap(g) {
    const y0 = 58, p = (H - y0) / 34;
    ground(g, y0, p, [[25, 'f-soilC', 'pat-soil', 'folyós iszap'], [null, 'f-soilD', 'pat-gravel', 'tömör kavics']]);
    svg('rect', { x: 0, y: y0 + 0.6 * p, width: W, height: 24.4 * p, class: 'f-water', opacity: 0.55 }, g);
    gwl(g, y0 + 0.6 * p);
    bld(g, 60, 20, 240, y0 - 20, { win: false });
    svg('path', { d: `M60 20 L180 8 L300 20`, fill: 'var(--building2)' }, g);
    for (let x = 84; x <= 276; x += 48) pileQ(g, x, y0, y0 + 30 * p, 8);
    vdim(g, 30, y0, y0 + 30 * p, '30 m');
    qmark(g, 180, y0 + 14 * p);
  },
  agyag(g) {
    const y0 = 86, p = (H - y0) / 10;
    ground(g, y0, p, [[null, 'f-soilE', 'pat-clay', 'kemény, kötött agyag']]);
    bld(g, 124, 46, 112, y0 - 46);
    svg('path', { d: 'M116 46 L180 18 L244 46 Z', class: 'f-bld2', stroke: 'var(--line2)' }, g);
    for (const x of [136, 180, 224]) pileQ(g, x, y0, y0 + 7 * p, 9);
    vdim(g, 100, y0, y0 + 7 * p, '7 m');
    T(g, 8, H - 8, 'talajvíz 15 m-ig sincs', 'start', 't-sm halo');
    qmark(g, 300, y0 + 5 * p);
  },
  kozet(g) {
    const y0 = 52, p = (H - y0) / 50;
    ground(g, y0, p, [[20, 'f-soilD', 'pat-gravel', 'homokos kavics'], [null, 'f-rock', 'pat-rock', 'kemény márga, kőzet']]);
    svg('rect', { x: 0, y: y0 + 4 * p, width: W, height: 16 * p, class: 'f-water', opacity: 0.6 }, g);
    gwl(g, y0 + 4 * p);
    bld(g, 0, 14, 80, y0 - 14); bld(g, 280, 8, 80, y0 - 8);
    svg('rect', { x: 110, y: y0, width: 140, height: 25 * p, class: 'f-sky' }, g);
    for (const x of [110, 250]) pileQ(g, x, y0, y0 + 45 * p, 8);
    vdim(g, 180, y0, y0 + 45 * p, '45 m');
    qmark(g, 250, y0 + 33 * p);
  },
  napelem(g) {
    const y0 = 124, p = (H - y0) / 5;
    ground(g, y0, p, [[0.4, 'f-soilC', 'pat-soil', 'termőtalaj'], [null, 'f-soilA', 'pat-sand', 'közepesen tömör homok']]);
    for (let i = 0; i < 3; i++) {
      const x = 10 + i * 78;
      svg('line', { x1: x + 14, y1: y0, x2: x + 14, y2: y0 - 26, class: 's-steel', 'stroke-width': 3 }, g);
      svg('line', { x1: x + 46, y1: y0, x2: x + 46, y2: y0 - 42, class: 's-steel', 'stroke-width': 3 }, g);
      svg('path', { d: `M${x} ${y0 - 22} L${x + 62} ${y0 - 48} L${x + 66} ${y0 - 40} L${x + 4} ${y0 - 14} Z`, fill: 'var(--steel)', opacity: 0.85 }, g);
      for (const xx of [x + 14, x + 46]) {
        svg('line', { x1: xx, y1: y0, x2: xx, y2: y0 + 2.5 * p, stroke: 'var(--grp)', 'stroke-width': 2.5, 'stroke-dasharray': '4 3' }, g);
        for (let k = 0.6; k < 2.5; k += 0.7) svg('line', { x1: xx - 5, y1: y0 + k * p, x2: xx + 5, y2: y0 + k * p - 3, stroke: 'var(--grp)', 'stroke-width': 1.5 }, g);
      }
    }
    qmark(g, 326, y0 + 3.5 * p);
  },
  csarnok(g) {
    const y0 = 64, p = (H - y0) / 16;
    ground(g, y0, p, [[13, 'f-soilA', 'pat-sand', 'laza–közepes homok'], [null, 'f-soilD', 'pat-gravel', 'tömörebb kavics']]);
    svg('rect', { x: 0, y: y0 + 6 * p, width: W, height: 7 * p, class: 'f-water', opacity: 0.5 }, g);
    gwl(g, y0 + 6 * p);
    bld(g, 24, 26, 220, y0 - 26, { win: false });
    svg('rect', { x: 104, y: 40, width: 60, height: y0 - 40, class: 'f-bld2' }, g);
    for (let x = 40; x <= 232; x += 32) pileQ(g, x, y0, y0 + 12 * p, 7);
    qmark(g, 300, y0 + 8 * p);
  },
};

const CASES = [
  { t: 'Foghíjtelek a belvárosban', sk: 'foghij',
    d: 'Hatszintes irodaház épül egy belvárosi foghíjtelken; két oldalán százéves, rezgésre érzékeny bérházak állnak. A teherbíró homokos kavics kb. 9 m mélyen van.',
    q: 'Melyik cölöpözési technológia a <b>legkockázatosabb</b> itt?',
    o: ['Vert előregyártott vasbeton cölöp', 'Fúrt cölöp (CFA)', 'Csavart, talajkiszorításos cölöp', 'Mikrocölöp'], c: 0,
    e: 'A cölöpverés jelentős zajt és rezgést kelt, ezért építmények közelében csak erős korlátok mellett alkalmazható – rezgésre érzékeny szomszédok mellett ez a legkockázatosabb. A CFA-t kifejezetten zaj‑ és rezgéskorlátozás esetén választják, a csavart cölöpnél nincs dinamikus és zajhatás, a mikrocölöp pedig kis géppel, rezgésmentesen készül.' },
  { t: 'Mélygarázs a telekhatáron', sk: 'garazs',
    d: 'Kétszintes mélygarázs munkagödrét kell határolni. A talajvíz 2 m-rel a terep alatt van, 14 m mélyen vízzáró agyag következik, a telekhatáron közvetlenül régi épületek állnak.',
    q: 'Melyik szerkezetet választanád?',
    o: ['Résfal', 'CFA-cölöpsor', 'Kútalap', 'Kavicscölöpök'], c: 0,
    e: 'A résfal vízzáró és merev, viszonylag zaj‑ és rázkódásmentesen készül, nincs szükség talajvízszint-süllyesztésre, és a vízzáró agyagba kötve a mélygarázs végleges oldalfala is lehet. Egy CFA-cölöpsor nem zárja ki a vizet, a kútalap alapozás és nem munkatérhatárolás, a kavicscölöp pedig talajjavítási módszer.' },
  { t: 'Ráépítés egy régi bérházra', sk: 'pince',
    d: 'Egy régi bérházra két emeletet építenek, a meglévő sávalapok a többletterhet már nem bírják. Csak a pincéből lehet dolgozni, ahol a belmagasság alig több mint két méter.',
    q: 'Mivel erősítenéd meg az alapokat?',
    o: ['Mikrocölöpös aláfogással', 'Nagyátmérőjű béléscsöves cölöpökkel', 'Franki-cölöpökkel', 'Vert előregyártott vasbeton cölöpökkel'], c: 0,
    e: 'A mikrocölöp nehezen megközelíthető, korlátozott magasságú munkahelyen is elkészíthető, és a meglévő alapok terheit a mélyebb, jobb rétegre hárítja át (aláfogás). Teherbírásánál a talpellenállást figyelmen kívül hagyjuk, puha talajban (c<sub>u</sub> < 10 kPa) a kihajlást is vizsgálni kell. A többi technológia nagy gépet igényel, a verés és a döngölés rezgése pedig a régi épületet is károsítaná.' },
  { t: 'Hídpillér a folyó medrében', sk: 'hid',
    d: 'Nagy fesztávú közúti híd mederpillérét kell alapozni. A meder homokos kavicsa árvízkor kimosódhat, a megbízható teherbíró réteg 25–30 m mélyen van, a terhek nagyok.',
    q: 'Melyik a legkézenfekvőbb mai megoldás?',
    o: ['Nagyátmérőjű, bentonitzagyos fúrt cölöpök', 'Síkalap a mederfenéken', 'Talajcsavarok', 'Fa cölöpök'], c: 0,
    e: 'A kimosás, kiüregelés veszélye miatt síkalap itt szóba sem jöhet: mélyalap kell. Nagy átmérőjű, nagy mélységű, nagy teherbírású cölöpökhöz a zagymegtámasztásos fúrt cölöp terjedt el – hazánkban elsősorban éppen nagy fesztávú hidak alapozására. A régebbi budapesti Duna-hidakat még szekrényalapozással (keszonnal) építették; ez ma már kiszorult.' },
  { t: 'Daruzott csarnok folyós iszapon', sk: 'iszap',
    d: 'Nehéz, daruzott csarnok épül. A felső 25 m-es réteg magas víztartalmú, folyós iszap, a talajvíz szinte a felszínen áll, alatta tömör kavics. 120 cm átmérőjű, 30 m hosszú cölöpök kellenek.',
    q: 'Melyik technológiát választanád?',
    o: ['Béléscsöves (köpenycsöves) fúrt cölöpöt', 'CFA-cölöpöt', 'Megtámasztás nélküli fúrt cölöpöt', 'Előregyártott acél talajcsavart'], c: 0,
    e: 'A béléscső a furat falát egészen a felbetonozásig megtámasztja, ezért magas víztartalmú, iszapos talajban is biztonsággal alkalmazható – 80–180 cm átmérővel, 15–50 (100) m hosszal. A CFA jellemzően 22–24 m-ig készül, és laza, folyós talajban különös gondosságot kíván; megtámasztás nélkül a furat beomlana, a talajcsavar pedig csak 2–3 m-es, kis terhű elem.' },
  { t: 'Lakóépület kemény agyagon', sk: 'agyag',
    d: 'Kisebb lakóépület alá 7 m hosszú, 60 cm átmérőjű cölöpök kellenek. A talaj végig kemény, kötött agyag; talajvizet a feltárás 15 m-ig sem talált.',
    q: 'Mi a legegyszerűbb megoldás?',
    o: ['Megtámasztás nélküli fúrt cölöp, azonnali betonozással', 'Bentonitzagyos fúrt cölöp', 'Keszonalapozás', 'Résfal'], c: 0,
    e: 'Kötött talajban, talajvíz felett, legfeljebb 8–10 m mélységig a furat rövid ideig megtámasztás nélkül is állékony – de a kiemelés után rögtön ki kell betonozni. A zagy itt felesleges költség, a keszon és a résfal pedig nagyságrenddel nagyobb szerkezet.' },
  { t: 'Résfal kőzetbe', sk: 'kozet',
    d: 'Egy metróállomás munkagödrét 45 m mély résfal határolja; a fal alsó része kemény márgába, kőzetbe kerül.',
    q: 'Mivel réselnél?',
    o: ['Hydrofraiserrel (marótárcsás réselővel)', 'Kötélen függő mechanikus markolóval', 'Kelly-rudas hidraulikus markolóval', 'Sehogy: résfal helyett vert acél szádfal'], c: 0,
    e: 'Kőzetben vagy nagyon kemény agyagban résfal csak hydrofraiserrel készíthető: a marótárcsák felaprítják az anyagot, amelyet a zaggyal együtt szivattyúznak ki, majd kint szétválasztanak. Nagyon drága, de nagy mélységig, bármely talajban és kőzetben pontos rést ad. Hazánkban a 4-es metró építésénél alkalmazták: a Fővám téren 48,3 m, a Szent Gellért téren 40 m mély résfal készült. Kőzetbe szádfal nem verhető.' },
  { t: 'Napelempark a szántóföldön', sk: 'napelem',
    d: 'Napelempark épül több ezer kis terhű tartóoszloppal. A talaj közepesen tömör homok, és az oszlopoknak évtizedek múlva könnyen elbonthatónak kell lenniük.',
    q: 'Mire alapoznád az oszlopokat?',
    o: ['Talajcsavarokra', 'Nagyátmérőjű fúrt cölöpökre', 'Résfalra', 'Franki-cölöpökre'], c: 0,
    e: 'A talajcsavar kisebb terhelésű szerkezetek – könnyűszerkezetes házak, napelemparkok, kerítések, mobil lelátók – alapozására való: géppel (kisebbeknél akár kézzel) gyorsan, rezgésmentesen lehajtható, és visszanyerhető, kicsavarható. Jellemzően legfeljebb 2–3 m hosszú, és ott működik, ahol menetet tud vágni a talajba.' },
  { t: 'Logisztikai csarnok laza homokon', sk: 'csarnok',
    d: 'Közepes terhű csarnok épül, több száz cölöppel. A talaj laza–közepesen tömör homok, a kitermelt furadék elszállítása drága lenne, és gyorsan kell haladni.',
    q: 'Melyik technológia illik ide a legjobban?',
    o: ['Helyben betonozott, csavart (talajkiszorításos) cölöp', 'Béléscsöves, nagyátmérőjű fúrt cölöp', 'Kútalap', 'Keszonalapozás'], c: 0,
    e: 'A csavart cölöp fúrófeje fúrás közben széttolja és tömöríti a talajt: nő a köpenymenti ellenállás, a felszínre csak csekély furatanyag kerül, és nincs dinamikus és zajhatás. Laza–közepesen tömör szemcsés és átmeneti talajban, közepes terhelésű ipari létesítményeknél népszerű, gazdaságos, gyors megoldás (átmérő 300–600 mm, hossz kb. 20 m-ig).' },
];

// determinisztikus keverés: a helyes válasz helye esetről esetre változik, kétszer egymás után nem ugyanott
function orders() {
  let seed = 20261021, prev = -1;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return CASES.map((C) => {
    const n = C.o.length; let pos;
    do { pos = Math.floor(rnd() * n); } while (pos === prev);
    prev = pos;
    const rest = C.o.map((_, k) => k).filter((k) => k !== C.c);
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    rest.splice(pos, 0, C.c);
    return rest;
  });
}

register('dnt-cases', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false, foot: 'A vázlatok <b>szemléltetők</b>, nem méretarányosak. Egy-egy helyzetben több technológia is szóba jöhet – itt mindig a leginkább kézenfekvőt keressük.' });
  const box = h('div', { class: 'dnt-game' });
  viz.append(box);
  const ORD = orders();
  let i = 0, score = 0, ans = [];
  const render = () => {
    clear(box);
    if (i >= CASES.length) {
      const msg = score === CASES.length ? 'Hibátlan! Bátran rád bíznánk egy alapozási tervet.' : score >= 7 ? 'Nagyon jó – a hibásakat érdemes még egyszer átgondolni.' : 'Érdemes a technológia-mátrixszal és a fejezetekkel még egyszer átnézni.';
      box.append(h('div', { class: 'q-res' }, h('b', {}, `${score} / ${CASES.length}`), h('p', { class: 'center' }, msg),
        h('button', { class: 'btn btn-line', type: 'button', onclick: () => { i = 0; score = 0; ans = []; render(); } }, 'Újra')));
      return;
    }
    const C = CASES[i];
    const sk = h('div', { class: 'dnt-sk' });
    const s = figure(sk, W, H); s.setAttribute('aria-label', 'Vázlat: ' + C.t);
    SKETCH[C.sk](svg('g', {}, s));
    const order = ORD[i];
    const opts = h('div', { class: 'q-opts' });
    const exp = h('div', { class: 'q-exp', hidden: true });
    const sc = h('span', { class: 'dnt-sc' }, `Pontszám: ${score} / ${CASES.length}`);
    const next = h('button', { class: 'btn btn-line btn-sm', type: 'button', disabled: true, onclick: () => { i++; render(); } }, i === CASES.length - 1 ? 'Eredmény' : 'Következő helyzet →');
    order.forEach((k, n) => {
      const b = h('button', { type: 'button' }, h('i', {}, 'ABCD'[n]), h('span', { html: C.o[k] }));
      b.addEventListener('click', () => {
        if (ans[i] !== undefined) return;
        ans[i] = k === C.c; if (ans[i]) score++;
        [...opts.children].forEach((x, nn) => { x.disabled = true; if (order[nn] === C.c) x.classList.add('right'); });
        if (k !== C.c) b.classList.add('wrong');
        exp.hidden = false; exp.innerHTML = (ans[i] ? '<b>Pontosan!</b> ' : '<b>Nem ez a legjobb válasz.</b> ') + C.e;
        next.disabled = false; sc.textContent = `Pontszám: ${score} / ${CASES.length}`;
      });
      opts.append(b);
    });
    const dots = h('div', { class: 'q-dots' }, ...CASES.map((_, k) => h('i', { class: (ans[k] === true ? 'ok' : ans[k] === false ? 'bad' : '') + (k === i ? ' cur' : '') })));
    box.append(h('div', { class: 'dnt-case' }, sk,
      h('div', { class: 'dnt-cbody' },
        h('div', { class: 'q-n' }, `${i + 1}. helyzet / ${CASES.length}`),
        h('h4', { class: 'dnt-ct' }, C.t),
        h('p', { class: 'dnt-desc' }, C.d),
        h('div', { class: 'q-t', html: C.q }),
        opts, exp,
        h('div', { class: 'q-nav' }, h('div', { class: 'dnt-navl' }, dots, sc), next))));
  };
  render();
});

/* ================================================================== 10.2 TECHNOLÓGIA-MÁTRIX */
// r: feltétel → [állapot, szöveg]; állapot: 'x' kizáró, 'w' figyelni kell, 'p' kifejezetten előnyös
const GROUPS = { kisz: ['Talajkiszorításos', 1], hely: ['Talajhelyettesítéses', 2], egyeb: ['Egyéb cölöp', 3], fal: ['Résfal', 4], kut: ['Kút, szekrény', 5] };
const TECH = [
  { n: 'Fa cölöp', g: 'kisz', href: '#elore', d: '10–15 cm', L: '≤ 8–10 m', soil: 'puha talaj', gw: 'víz alatt nagyon tartós, felette kezelés kell', vib: 'verés: zaj, rezgés', sp: 'ma ritka', ck: 'csak keményfa; védeni kell rovarok, gombák ellen',
    r: { vib: ['x', 'Verve kerül a talajba: zaj és rezgés.'], hard: ['x', 'Kemény, köves rétegen nem verhető át.'], big: ['x', 'Vékony elem (10–15 cm).'], deep: ['x', 'Legfeljebb 8–10 m hosszú.'], low: ['x', 'Verőgép kell hozzá.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Acél cső‑ és H-cölöp', g: 'kisz', href: '#elore', d: 'cső vagy „H” profil', L: '≤ 15–20 m (toldható)', soil: 'cső: felül puha, alatta tömör szemcsés; a H-profil keményebb rétegen is átjut', gw: 'korrózióvédelem kell', vib: 'verés, vibrálás: zaj, rezgés', sp: 'gyors', ck: 'visszanyerhető; drága anyag',
    r: { vib: ['x', 'Verés, vibrálás: zaj és rezgés.'], hard: ['w', 'A H-profil jobban verhető, de kőzetben, kemény agyagban a verés korlátos.'], big: ['x', 'Nagyátmérőjű cölöp csak talajhelyettesítéssel készül.'], deep: ['x', 'Jellemzően legfeljebb 15–20 m.'], low: ['x', 'Verőgép, vibrátor kell.'], pit: ['x', 'Cölöpként nem vízzáró fal (arra a szádfal való).'] } },
  { n: 'Előregyártott vb. cölöp (vert, vibrált)', g: 'kisz', href: '#elore', d: '30×30, 40×40 cm; pörgetett: Ø 25–50 cm', L: '4–12 m; pörgetve legfeljebb 20–22 m', soil: 'nem: kőzet, kemény agyag, cementált talaj, tömbös feltöltés; vibrálás főleg szemcsésben', gw: 'nem akadály', vib: 'nagy zaj és rezgés', sp: 'gyors (előre elkészül)', ck: 'gyári elem; a fejet a tervezett szintig visszabontják',
    r: { vib: ['x', 'A verés jelentős zajt és rezgést kelt – érzékeny szomszéd mellett a legkockázatosabb.'], hard: ['x', 'Kőzetben, kemény agyagban, cementált vagy tömbös rétegben nem verhető le – egy vékony betelepülés is megakadályozhatja.'], big: ['x', 'Nagyátmérőjű cölöp csak talajhelyettesítéssel készül.'], deep: ['x', 'Pörgetett csőcölöpként is legfeljebb 20–22 m.'], low: ['x', 'Nagy verőgép kell.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Talajcsavar (acél csavart cölöp)', g: 'kisz', href: '#elore', d: 'üreges szár, 40–60 cm-enként menet', L: '≤ 2–3 m', soil: 'ahol menetet tud vágni a talajba', gw: '–', vib: 'rezgésmentes (csavarás)', sp: 'nagyon gyors', ck: 'kis teher; visszanyerhető, kicsavarható',
    r: { vib: ['p', 'Csavarással megy le: rezgés‑ és zajmentes.'], hard: ['x', 'Kemény, köves talajba nem tud menetet vágni.'], big: ['x', 'Kis keresztmetszetű elem.'], deep: ['x', 'Jellemzően legfeljebb 2–3 m hosszú.'], low: ['x', 'Kis terhű, új könnyűszerkezetekhez való, nem megerősítésre.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Franki-cölöp', g: 'kisz', href: '#helyszini', d: 'csőátmérő 46–52 cm; a kész cölöp kb. 60 cm', L: '≤ 16–18 m', soil: 'a béléscsövet a teherbíró rétegbe verik', gw: '–', vib: 'döngölés 3 t-ás ejtőkossal: zaj, rezgés', sp: 'lassú', ck: '2000–3000 kN; ma már szinte eltűnt',
    r: { vib: ['x', 'Az ejtőkos döngölése zajjal és rezgéssel jár.'], hard: ['w', 'Vert technológia: kemény, köves rétegen nehezen jut át.'], big: ['x', 'A kész átmérő kb. 60 cm.'], deep: ['x', 'Legfeljebb 16–18 m hosszú.'], low: ['x', 'Magas verőállvány kell.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Csavart cölöp (Omega, FDP, Fundex, Screwsol)', g: 'kisz', href: '#helyszini', d: '300–600 mm', L: '≤ kb. 20 m', soil: 'laza–közepesen tömör szemcsés, átmeneti, puha–gyúrható kötött', gw: 'nem akadály', vib: 'nincs dinamikus és zajhatás', sp: 'gyors', ck: 'csekély furadék; a kisebb átmérő korlátozza a teherbírást',
    r: { vib: ['p', 'Nincs dinamikus és zajhatás.'], hard: ['x', 'Laza–közepesen tömör talajokra való; kemény rétegbe a kiszorító fej nem jut le.'], big: ['x', '300–600 mm-es átmérő.'], deep: ['x', 'Legfeljebb kb. 20 m hosszú.'], low: ['x', 'Nagy fúrógép kell.'], pit: ['x', 'Nem vízzáró munkatérhatárolás.'] } },
  { n: 'CFA-cölöp (folyamatos spirál)', g: 'hely', href: '#furt', d: '40–120 cm', L: '6–22 (24) m', soil: 'minden talajban, kivéve a laza, folyós talajokat; finom homokban különös gondosság', gw: 'a spirálon maradó talajdugó támaszt', vib: 'kis zaj, kis rezgés', sp: 'gyors fúrás, egyszerű gépészet', ck: 'automata monitorozás: betonnyomás, -mennyiség, jegyzőkönyv minden cölöpről',
    r: { vib: ['p', 'Kifejezetten zaj‑ és rezgéskorlátozás esetén választják.'], hard: ['w', 'Speciális fúrófejjel nagyon kemény talajban, puhább kőzetben is fúrható.'], big: ['w', 'A nagyobb átmérők (100–120 cm) is elérhetők.'], deep: ['x', 'Legfeljebb 22–24 m hosszú.'], low: ['x', 'Magas fúrógép kell.'], pit: ['w', 'Cölöpsorként csak akkor vízzáró, ha a cölöpök összemetszők.'], gw: ['w', 'Laza, folyós talajba nem javasolt; víztelített finom homokban különös gondosság kell.'] } },
  { n: 'Béléscsöves (köpenycsöves) fúrt cölöp', g: 'hely', href: '#furt', d: '80–180 cm', L: '15–50 (100) m', soil: 'különösen kedvezőtlen talajokban is', gw: 'magas víztartalmú, iszapos talajban is biztonságos', vib: 'a cső rotációval vagy vibrálással megy le', sp: 'lassabb, összetett gépészet', ck: 'a cső járjon a kiemelés előtt; talajvíz alatt vízpótlás a furatban',
    r: { vib: ['w', 'Rezgéskorlátnál a béléscsövet rotációval (és nem vibrálással) kell lehajtani.'], big: ['p', 'Nagy (min. 80 cm) átmérőhöz való.'], deep: ['p', '15–50, akár 100 m hosszú.'], low: ['x', 'Nagy fúrógép kell.'], pit: ['x', 'Nem munkatérhatárolás.'], gw: ['p', 'A cső a felbetonozásig megtámasztja a furatot.'] } },
  { n: 'Bentonitzagyos fúrt cölöp', g: 'hely', href: '#furt', d: '80–180 cm', L: '15–50 m', soil: 'bármely talajban', gw: 'a zagy kiszorítja a talajvizet, megtámasztja a falat', vib: 'kicsi', sp: 'lassabb, összetett gépészet, zagytelep', ck: 'talptisztítás; betonozás kontraktorcsővel',
    r: { vib: ['p', 'Fúrással, zagyos megtámasztással: nincs verés.'], big: ['p', 'Nagy (min. 80 cm) átmérőhöz való.'], deep: ['p', 'Nagy mélységig: a fúrógép kapacitása nem korlát.'], low: ['x', 'Nagy fúrógép és zagytelep kell.'], pit: ['x', 'Cölöpként nem munkatérhatárolás.'], gw: ['p', 'A zagy kiszorítja a talajvizet.'] } },
  { n: 'Megtámasztás nélküli fúrt cölöp', g: 'hely', href: '#furt', d: 'rövid spirállal vagy markolóval', L: '≤ 8–10 m (5–6 m-ig markolt tömbalap)', soil: 'csak kötött talaj', gw: 'csak talajvíz felett', vib: 'kicsi', sp: 'gyors', ck: 'a kiemelés után azonnal betonozni',
    r: { vib: ['p', 'Egyszerű fúrás, nincs verés.'], gw: ['x', 'Talajvíz alatt a furat beomlik – megtámasztás kell.'], deep: ['x', 'Legfeljebb 8–10 m mély furat állékony.'], big: ['w', 'Nagy átmérőnél a furat állékonysága kérdéses.'], low: ['x', 'Fúrógép kell.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Mikrocölöp', g: 'egyeb', href: '#egyeb', d: 'fúrt ≤ 300 mm, vert ≤ 150 mm', L: 'a feladathoz igazodik', soil: 'heterogén talajban és kőzetben is', gw: 'nem akadály', vib: 'kicsi, kis gép', sp: 'közepes', ck: 'talpellenállás nélkül számolunk; kihajlás, ha c<sub>u</sub> < 10 kPa; próbaterhelés indokolt',
    r: { low: ['p', 'Nehezen megközelíthető, alacsony helyen is készül – aláfogásra ideális.'], vib: ['p', 'Kis géppel, rezgésszegényen.'], big: ['x', 'Legfeljebb 300 mm-es törzsátmérő.'], deep: ['w', 'Karcsú elem: csak a köpeny visz terhet, puha talajban kihajlás.'], pit: ['w', 'Megtámasztó fal is kialakítható belőle, de vízzáró munkagödörre nem ez a jellemző.'] } },
  { n: 'Jet-grouting', g: 'egyeb', href: '#egyeb', d: '≤ 60–70 cm (agyag), 150–200 cm (kavics)', L: 'a feladathoz igazodik', soil: 'bármely talaj, gyenge kőzet is', gw: 'kevéssé áteresztő zárófal is készíthető', vib: 'nincs verés; 400–600 bar-os sugár', sp: 'közepes', ck: 'az átmérő talajfüggő; hidraulikus talajtörés, felemelkedés veszélye',
    r: { low: ['p', 'Szűk helyen, alapmegerősítésre, aláfalazásra is.'], vib: ['p', 'Fúrás és injektálás: nincs verés.'], hard: ['w', 'Kötött, kemény talajban kisebb az oszlop (agyagban legfeljebb 60–70 cm).'], big: ['w', 'Nagy átmérő csak durva szemcsés talajban (kavicsban 150–200 cm).'], pit: ['w', 'Munkatérhatárolásra, kevéssé áteresztő zárófalnak is jó, de a vízzárás kényes.'] } },
  { n: 'Résfal', g: 'fal', href: '#resfal', d: '40–120 cm vastag; tábla 2,8–5,6 m', L: '6–30 m, akár 120–150 m', soil: 'nehéz: puha agyag, tőzeg, folyós homok; kőzetben csak hydrofraiser', gw: 'vízzáró; a zagyszint legalább 1,0–1,5 m-rel a talajvíz felett', vib: 'viszonylag zajtalan, rázkódásmentes', sp: 'közepes; drága gépek', ck: 'próbaterhelhető; izotópos vagy szeizmikus betonvizsgálat',
    r: { pit: ['p', 'Vízzáró, merev: a mélygarázs végleges oldalfala is lehet.'], vib: ['p', 'Viszonylag zaj‑ és rázkódásmentes.'], hard: ['w', 'Kőzetben, nagyon kemény agyagban csak hydrofraiserrel – nagyon drága.'], deep: ['p', 'Általában 15–30 m, de 120–150 m-es is készült.'], big: ['p', 'Nagy keresztmetszet, nagy teherbírás, kis süllyedés.'], low: ['x', 'Nagy réselőgép és zagytelep kell.'], gw: ['p', 'Nincs szükség talajvízszint-süllyesztésre.'] } },
  { n: 'Kútalap', g: 'kut', href: '#kut', d: '0,8–3,0 m', L: '4–8 m', soil: 'kotorható talaj, nem túl mély teherbíró réteg', gw: 'magas talajvíznél előnyös', vib: 'ma: a köpenycsövet vibrálják', sp: 'lassú', ck: 'ma visszanyert acélköpenyes, kontraktoros betonozással',
    r: { deep: ['x', 'Csak 4–8 m-ig gazdaságos.'], gw: ['p', 'Magas talajvíznél, víz alatti alapsíknál alkalmazták.'], big: ['p', 'Nagy átmérő (0,8–3,0 m).'], vib: ['w', 'A mai acél köpenycsövet vibrálással hajtják le.'], low: ['x', 'Markoló és darus gép kell.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Szekrényalap, keszon', g: 'kut', href: '#kut', d: 'alaprajza az építményé', L: 'nyitott szekrény 40–50 m-ig', soil: 'jól kotorható talaj', gw: 'keszon: legfeljebb 3,2–3,5 bar túlnyomás', vib: 'kicsi', sp: 'nagyon lassú (6–8 m-es ütemek)', ck: 'elferdülés, roskadási tölcsér: folyamatos monitoring; kiszorulóban',
    r: { deep: ['w', 'Jól kotorható talajban 40–50 m-ig süllyeszthető.'], big: ['p', 'Az egész építmény (pl. hídpillér) alá.'], hard: ['w', 'Kemény, nehezen kotorható talajban elakad, elferdülhet.'], low: ['x', 'Nagy, szakaszosan épülő szerkezet.'], pit: ['w', 'Mélygarázs is készült így, de ma a résfal a jellemző.'], gw: ['w', 'Keszonnál a túlnyomás legfeljebb 3,2–3,5 bar – mélyebb víznél nem megy.'] } },
];
const FLAGS = [
  { k: 'vib', t: 'Rezgés‑ és zajkorlát', s: 'érzékeny szomszéd' },
  { k: 'gw', t: 'Talajvíz a talpsík felett', s: 'víztelített, laza rétegek' },
  { k: 'hard', t: 'Kemény agyag, kőzet', s: 'cementált, tömbös réteg' },
  { k: 'big', t: '80 cm-nél nagyobb átmérő', s: 'nagy teher cölöpönként' },
  { k: 'deep', t: '25 m-nél mélyebb teherbíró réteg', s: 'hosszú elem kell' },
  { k: 'low', t: 'Alacsony belmagasság', s: 'meglévő épület megerősítése' },
  { k: 'pit', t: 'Vízzáró munkagödör is kell', s: 'pl. mélygarázs' },
];

register('dnt-matrix', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false, foot: '<b>Tájékoztató összevetés</b> a jellemző értékekkel. A határok nem élesek: egy-egy technológia speciális géppel, kiegészítő eljárással a „kizárt” helyzetben is megoldható lehet – a végső szó a tervezőé.' });
  const on = new Set();
  let grp = 'all';
  const flagBox = h('div', { class: 'dnt-flags', role: 'group', 'aria-label': 'Helyszíni feltételek' });
  FLAGS.forEach((f) => {
    const b = h('button', { type: 'button', 'aria-pressed': 'false' }, h('b', {}, f.t), h('small', {}, f.s));
    b.addEventListener('click', () => { if (on.has(f.k)) on.delete(f.k); else on.add(f.k); b.setAttribute('aria-pressed', on.has(f.k)); b.classList.toggle('on', on.has(f.k)); upd(); });
    flagBox.append(b);
  });
  const top = h('div', { class: 'dnt-mx-top' });
  const gseg = seg(top, { label: 'Csoport', options: [{ v: 'all', t: 'Mind' }, ...Object.entries(GROUPS).map(([v, [t]]) => ({ v, t }))], value: 'all' });
  gseg.on((v) => { grp = v; upd(); });
  const reset = h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: () => { on.clear(); $$b().forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }); upd(); } }, 'Feltételek törlése');
  top.append(reset);
  const $$b = () => [...flagBox.querySelectorAll('button')];
  const sum = h('div', { class: 'dnt-sum', 'aria-live': 'polite' });
  const tbl = h('table', { class: 't dnt-tab' });
  const COLS = [['d', 'Átmérő, méret'], ['L', 'Hossz, mélység'], ['soil', 'Talaj'], ['gw', 'Talajvíz'], ['vib', 'Rezgés, zaj'], ['sp', 'Sebesség, gépészet'], ['ck', 'Ellenőrzés, figyelni kell']];
  tbl.append(h('colgroup', {}, ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => h('col', { class: 'c' + k }))));
  tbl.append(h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Technológia'), ...COLS.map(([, t]) => h('th', { scope: 'col' }, t)))));
  const tb = h('tbody');
  tbl.append(tb);
  viz.append(h('div', { class: 'ctl-lab dnt-fl' }, 'A helyszín feltételei – kapcsold be, ami igaz:'), flagBox, top, sum, h('div', { class: 'tscroll dnt-scroll' }, tbl));

  function upd() {
    clear(tb);
    const rows = TECH.filter((t) => grp === 'all' || t.g === grp).map((t) => {
      const why = [...on].map((k) => t.r[k] ? [t.r[k][0], t.r[k][1]] : null).filter(Boolean);
      const x = why.some((w) => w[0] === 'x');
      const wn = why.filter((w) => w[0] === 'w').length, p = why.filter((w) => w[0] === 'p').length;
      return { t, why, st: x ? 'bad' : wn ? 'warn' : on.size ? 'ok' : '', score: x ? -1 : p - wn * 0.5 };
    });
    rows.sort((a, b) => (b.score - a.score) || (TECH.indexOf(a.t) - TECH.indexOf(b.t)));
    const ok = rows.filter((r) => r.st !== 'bad').length, ex = rows.length - ok;
    sum.innerHTML = on.size
      ? `<b>${ok}</b> technológia jöhet szóba${ex ? `, <b>${ex}</b> kiesik` : ''}. ` + (ok ? 'Elöl a leginkább illők.' : 'Ilyen feltételekkel egyik sem megy magától – kombinált megoldás vagy más elrendezés kell.')
      : 'Nincs bekapcsolt feltétel – mind a 15 technológia látszik. Kapcsolj be egy vagy több feltételt!';
    for (const r of rows) {
      const [gt, gi] = GROUPS[r.t.g];
      const status = r.st === 'bad' ? 'kiesik' : r.st === 'warn' ? 'figyelni kell' : r.st === 'ok' ? 'szóba jöhet' : '';
      const name = h('td', { class: 'dnt-n', 'data-l': 'Technológia' },
        h('a', { href: r.t.href }, r.t.n),
        h('div', { class: 'dnt-tags' }, h('span', { class: 'chip grp grp' + gi }, gt), status ? h('span', { class: 'chip ' + r.st }, status) : null),
        r.why.length ? h('ul', { class: 'dnt-why' }, ...r.why.map(([s, t]) => h('li', { class: s === 'x' ? 'neg' : s === 'w' ? 'warn' : 'pos' }, t))) : null);
      const tr = h('tr', { 'data-s': r.st }, name, ...COLS.map(([k, t]) => h('td', { 'data-l': t, html: r.t[k] })));
      const more = h('button', { class: 'dnt-more', type: 'button', 'aria-expanded': 'false' }, 'További jellemzők ▾');
      more.addEventListener('click', () => { const o = tr.classList.toggle('open'); more.setAttribute('aria-expanded', o); more.textContent = o ? 'Kevesebb ▴' : 'További jellemzők ▾'; });
      name.append(more);
      tb.append(tr);
    }
  }
  upd();
});

/* ================================================================== 10.3 DÖNTÉSI FA */
const TREE = {
  q1: { q: 'Megfelel a síkalap?', s: 'A teherbíró réteg sekélyen van, a süllyedés elfogadható, nincs kimosás‑ és elcsúszásveszély.', y: 'L1', n: 'q2' },
  q2: { q: 'Meglévő épületet kell megerősíteni, szűk, alacsony helyről?', s: 'Például ráépítés, pinceszint-mélyítés, túlterhelt régi alap.', y: 'L2', n: 'q3' },
  q3: { q: 'Talajvíz alatti munkagödör is kell, közvetlenül a telekhatáron?', s: 'Például mélygarázs, aluljáró a szomszéd épületek mellett.', y: 'L3', n: 'q4' },
  q4: { q: 'Sekély (4–8 m) a teherbíró réteg, magas talajvíz mellett, kevés nagy terhű pillér alatt?', s: 'A klasszikus kútalap-helyzet.', y: 'L4', n: 'q5' },
  q5: { q: '80 cm-nél nagyobb átmérő vagy kb. 24 m-nél hosszabb cölöp kell?', s: 'Nagy terhek, mélyen fekvő teherbíró réteg.', y: 'L5', n: 'q6' },
  q6: { q: 'Szigorú rezgés‑ és zajkorlát van?', s: 'Érzékeny szomszéd, belváros, kórház, régi épületek.', y: 'L6', n: 'L7' },
  L1: { t: 'Síkalap', href: 'https://sikalapoktervezese.vercel.app', ext: true, e: 'Ha a síkalap megfelel, általában az a legegyszerűbb és legolcsóbb megoldás. A mélyalap akkor kell, ha a teherbíró réteg mélyen van, a süllyedés síkalappal meg nem engedhető, kimosás vagy elcsúszás fenyeget, vagy ha összességében gazdaságosabb.' },
  L2: { t: 'Mikrocölöp vagy jet-grouting', href: '#egyeb', e: 'Nehezen megközelíthető, korlátozott magasságú helyen a mikrocölöp kis géppel készül, és a terhet a mélyebb, jobb rétegre hárítja át (aláfogás). A jet-grouting alapmegerősítésre, alapsík-mélyítésre, aláfalazásra is alkalmas, bármely talajban.' },
  L3: { t: 'Résfal', href: '#resfal', e: 'A résfal vízzáró és merev, viszonylag zaj‑ és rázkódásmentesen készül, nem kell hozzá talajvízszint-süllyesztés, és a végleges szerkezet – a mélygarázs oldalfala, akár alapozása – része lehet.' },
  L4: { t: 'Kútalap – vagy rövid fúrt cölöp', href: '#kut', e: 'A kútalap akkor gazdaságos, ha a teherbíró réteg nincs túl mélyen, és főleg magas talajvíznél, amikor az alapsíkot a vízszint alá kell vinni. Ma visszanyert acél köpenycsöves markolt alapként készül – de sokszor egy rövid fúrt cölöp a versenytársa.' },
  L5: { t: 'Béléscsöves vagy bentonitzagyos fúrt cölöp', href: '#furt', e: 'Nagyátmérőjű (80 cm feletti) cölöp kizárólag talajhelyettesítéssel készülhet. A béléscső kedvezőtlen, iszapos talajban is biztonságos (80–180 cm, 15–50, akár 100 m), a bentonitzagyos fúrás bármely talajban, nagy mélységig dolgozik (80–180 cm, 15–50 m).' },
  L6: { t: 'CFA‑ vagy csavart cölöp', href: '#furt', e: 'Zaj‑ és rezgéskorlátnál a CFA a kézenfekvő: gyors, monitorozott, 40–120 cm, 6–22 (24) m. Laza–közepesen tömör szemcsés és átmeneti talajban a csavart cölöp is jó: nincs dinamikus és zajhatás, és alig van furadék.' },
  L7: { t: 'Vert előregyártott, CFA vagy csavart cölöp', href: '#elore', e: 'Rezgéskorlát nélkül az előregyártott vert cölöp is szóba jöhet – ha nincs a nyomvonalban kőzet, kemény agyag, cementált vagy tömbös réteg –, és a kiszorítás még tömöríti is a talajt. A végső döntést a talaj, a teher és a gazdaságosság hozza meg.' },
};
const SPINE = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

let measCtx = null;
function lines(str, font, maxW) {
  if (!measCtx) measCtx = document.createElement('canvas').getContext('2d');
  measCtx.font = font;
  return wrapText(measCtx, str, maxW);
}

register('dnt-tree', (root) => {
  const { viz } = shell(root, { layout: 'wide', out: false });
  const wrapEl = h('div', { class: 'dnt-tree' });
  const ctl = h('div', { class: 'dnt-tctl' });
  const info = h('div', { class: 'verdict dnt-tinfo', 'aria-live': 'polite' });
  viz.append(ctl, wrapEl, info);
  let path = ['q1']; // bejárt csomópontok
  const ansOf = {}; // q → 'y' | 'n'
  const cur = () => path[path.length - 1];

  const answer = (a) => {
    const id = cur(); const N = TREE[id]; if (!N.q) return;
    ansOf[id] = a; path.push(a === 'y' ? N.y : N.n); draw();
  };
  const back = () => { if (path.length > 1) { path.pop(); delete ansOf[cur()]; draw(); } };
  const restart = () => { path = ['q1']; for (const k in ansOf) delete ansOf[k]; draw(); };
  const jump = (id) => { const k = path.indexOf(id); if (k < 0 || !TREE[id].q) return; path = path.slice(0, k + 1); for (const q of SPINE) if (!path.includes(q) || q === id) delete ansOf[q]; draw(); };

  function draw() {
    // vezérlők
    clear(ctl);
    const id = cur(), N = TREE[id];
    if (N.q) {
      ctl.append(h('span', { class: 'dnt-tq' }, h('small', {}, `${SPINE.indexOf(id) + 1}. kérdés`), h('b', {}, N.q)),
        h('div', { class: 'dnt-tbtn' },
          h('button', { class: 'btn btn-sm dnt-yes', type: 'button', onclick: () => answer('y') }, 'Igen'),
          h('button', { class: 'btn btn-sm dnt-no', type: 'button', onclick: () => answer('n') }, 'Nem'),
          path.length > 1 ? h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: back }, '← Vissza') : null));
    } else {
      ctl.append(h('span', { class: 'dnt-tq' }, h('small', {}, 'Javaslat'), h('b', {}, N.t)),
        h('div', { class: 'dnt-tbtn' }, h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: back }, '← Vissza'), h('button', { class: 'btn btn-line btn-sm', type: 'button', onclick: restart }, 'Újrakezdés')));
    }
    if (N.q) info.removeAttribute('data-s'); else info.dataset.s = 'ok';
    info.innerHTML = N.q ? `<b>${N.q}</b>${N.s}` : `<b>${N.t}</b>${N.e} <a href="${N.href}"${N.ext ? ' target="_blank" rel="noopener"' : ''}>${N.ext ? 'Síkalapok tervezése ↗' : 'Ugrás a fejezethez →'}</a>`;
    // SVG
    clear(wrapEl);
    const Wd = Math.max(300, Math.round(wrapEl.clientWidth || 700));
    const wide = Wd >= 640;
    const fq = '700 14.5px "Public Sans", system-ui, sans-serif', fl = '800 16px "Big Shoulders Display", "Arial Narrow", sans-serif';
    const pad = 11, lhq = 19, lhl = 18;
    const qW = wide ? Math.round(Wd * 0.5) : Wd - 2, lX = wide ? Math.round(Wd * 0.62) : 30, lW = wide ? Wd - lX - 2 : Wd - 32;
    const s = svg('svg', { viewBox: `0 0 ${Wd} 100`, class: 'fig dnt-tsvg', width: Wd, role: 'img', 'aria-label': 'Döntési fa' });
    wrapEl.append(s);
    const gE = svg('g', {}, s), gN = svg('g', {}, s);
    let y = 6;
    const nodeQ = (qid) => {
      const Q = TREE[qid];
      const L = lines(Q.q, fq, qW - 2 * pad - 30);
      const hh = L.length * lhq + 2 * pad;
      const st = qid === cur() ? 'cur' : path.includes(qid) ? 'on' : 'off';
      const g = svg('g', { class: 'tn q ' + st, tabindex: path.includes(qid) && qid !== cur() ? 0 : null }, gN);
      svg('rect', { x: 1, y, width: qW - 2, height: hh, rx: 10 }, g);
      svg('text', { x: 14, y: y + pad + 14, class: 'tn-n', text: String(SPINE.indexOf(qid) + 1) }, g);
      L.forEach((ln, k) => svg('text', { x: 34, y: y + pad + 14 + k * lhq, class: 'tn-t', text: ln }, g));
      if (st === 'on') { g.addEventListener('click', () => jump(qid)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter') jump(qid); }); svg('title', { text: 'Vissza ehhez a kérdéshez' }, g); }
      const box = { x: 1, y, w: qW - 2, h: hh };
      y += hh;
      return box;
    };
    const nodeL = (lid, x, yy, w) => {
      const Lf = TREE[lid];
      const L = lines(Lf.t.toUpperCase(), fl, w - 2 * pad);
      const hh = L.length * lhl + 2 * pad - 2;
      const st = lid === cur() ? 'cur' : 'off';
      const g = svg('g', { class: 'tn leaf ' + st }, gN);
      svg('rect', { x, y: yy, width: w, height: hh, rx: 10 }, g);
      L.forEach((ln, k) => svg('text', { x: x + pad, y: yy + pad + 13 + k * lhl, class: 'tn-l', text: ln }, g));
      return { x, y: yy, w, h: hh };
    };
    const edge = (pts, chosen, lab, lx, ly, anchor = 'start') => {
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
      svg('path', { d, class: 'te ' + (chosen ? 'on' : ''), fill: 'none' }, gE);
      const e = pts[pts.length - 1], p0 = pts[pts.length - 2];
      const ah = arrow(gE, p0[0], p0[1], e[0], e[1], chosen ? { cls: 's-grp', w: 2.6, head: 9 } : { cls: 's-line', w: 1.4, head: 7 });
      if (!chosen) ah.setAttribute('class', 'te-h');
      if (lab) svg('text', { x: lx, y: ly, class: 'te-l halo ' + (chosen ? 'on' : ''), 'text-anchor': anchor, text: lab }, gE);
    };
    SPINE.forEach((qid, i) => {
      const Q = TREE[qid];
      const qb = nodeQ(qid);
      const a = ansOf[qid];
      // „Igen” levél
      let lb;
      if (wide) {
        lb = nodeL(Q.y, lX, 0, lW);
        const ly = Math.round(qb.y + qb.h / 2 - lb.h / 2);
        gN.lastChild.setAttribute('transform', `translate(0 ${ly})`);
        lb.y = ly;
        const cy = qb.y + qb.h / 2;
        edge([[qb.x + qb.w, cy], [lX, cy]], a === 'y', 'Igen', qb.x + qb.w + 10, cy - 7);
        y = Math.max(y, ly + lb.h);
      } else {
        y += 22;
        lb = nodeL(Q.y, lX, y, lW);
        edge([[16, qb.y + qb.h], [16, y + lb.h / 2], [lX, y + lb.h / 2]], a === 'y', 'Igen', 22, qb.y + qb.h + 15);
        y += lb.h;
      }
      // „Nem” ág
      const last = i === SPINE.length - 1;
      const yTop = qb.y + qb.h;
      y += 30;
      if (!last) {
        if (wide) edge([[29, yTop], [29, y]], a === 'n', 'Nem', 37, yTop + 17);
        else edge([[8, yTop], [8, y]], a === 'n', 'Nem', 16, y - 10);
      } else {
        const nb = nodeL(Q.n, wide ? 1 : lX, y, wide ? qW - 2 : lW);
        if (wide) edge([[29, yTop], [29, y]], a === 'n', 'Nem', 37, yTop + 17);
        else edge([[8, yTop], [8, y + nb.h / 2], [lX, y + nb.h / 2]], a === 'n', 'Nem', 16, y - 10);
        y += nb.h;
      }
    });
    s.setAttribute('viewBox', `0 0 ${Wd} ${y + 6}`);
    s.setAttribute('height', y + 6);
  }
  draw();
  let lastW = 0;
  new ResizeObserver(() => { const w = Math.round(wrapEl.clientWidth); if (Math.abs(w - lastW) > 8) { lastW = w; draw(); } }).observe(wrapEl);
  if (document.fonts?.ready) document.fonts.ready.then(draw);
});

/* ================================================================== C11 NÉZÉSI ÚTVONAL */
const ROUTE = [
  { t: 'Indulás: mi a mélyalap?', ch: [['#alapok', 'C01'], ['#rendszer', 'C02']], v: ['v1'], yt: ['c3vKfjgqJdA', 'er4WW_v5qgk'], s: 'Mikor kell mélyalap, hogyan adja át a terhet a talp és a köpeny – és milyen cölöpfajták vannak.' },
  { t: 'Kiszorításos cölöpök', ch: [['#elore', 'C03'], ['#helyszini', 'C04']], v: [], yt: ['KDKCobw52qk', 'D27v2bVmoXc', '_QsH5x0ndtI', 'hwP8iZzAq6I'], s: 'Verés, vibrálás, csavarás, Franki-hagyma: a talajt széttolják és tömörítik.' },
  { t: 'Fúrt cölöpök', ch: [['#furt', 'C05']], v: ['v2'], yt: ['wqOU4bcUiCk', 'Oe5saZFiPJk'], s: 'Talajhelyettesítés, furatállékonyság, betonozás – előbb az elv, aztán a CFA és a béléscsöves gép.' },
  { t: 'Mikrocölöp, jet, keverés', ch: [['#egyeb', 'C06']], v: [], yt: ['7M7YPxBn8Xk', 'MPjXIhchN-w', 'wh31VB1fY_8', 'cNkNZV6kgqk'], s: 'Aláfogás pincéből, 400–600 bar-os sugár, helyben kevert talaj, kőoszlop.' },
  { t: 'Résfal', ch: [['#resfal', 'C07']], v: ['v3'], yt: ['f_41-sJhGK8'], s: 'Miért nem omlik be a zaggyal teli rés? Utána a valódi markoló és a betonozás.' },
  { t: 'Kút, szekrény, keszon', ch: [['#kut', 'C08']], v: ['v4'], yt: [], s: 'Süllyesztés önsúllyal, vágóél, túlnyomás és zsilipek – ehhez csak animáció van.' },
  { t: 'Ismétlés vizsga előtt', ch: [['#dontes', 'C10'], ['#teszt', 'C12']], v: ['v5'], yt: [], s: 'Összefoglaló kvízzel, aztán döntési helyzetek és 40 igaz/hamis állítás.' },
];
const VIDX = Object.fromEntries(VIDEOS.map((v, i) => [v.n, i]));
function playOwn(n) { const tiles = document.querySelectorAll('#vlib .vtile'); const t = tiles[VIDX[n]]; if (t) t.click(); }
function playYT(id) { const b = h('button', { type: 'button' }); ytMini(b, id); b.click(); }

register('vt-route', (root) => {
  const ol = h('ol', { class: 'vt-steps' });
  ROUTE.forEach((r, i) => {
    const btns = h('div', { class: 'vt-btns' },
      ...r.v.map((n) => { const v = VIDEOS[VIDX[n]]; return h('button', { class: 'vt-b own grp' + v.grp, type: 'button', onclick: () => playOwn(n), 'aria-label': 'Animáció: ' + v.t }, h('i', { class: 'vt-play' }), h('span', {}, h('small', {}, `Animáció · ${VIDX[n] + 1} / ${VIDEOS.length}`), h('b', {}, v.t))); }),
      ...r.yt.map((id) => { const y = YT[id]; return h('button', { class: 'vt-b yt', type: 'button', onclick: () => playYT(id), 'aria-label': 'BME-felvétel: ' + y.title }, h('i', { class: 'vt-ytb' }), h('span', {}, h('small', {}, `BME · ${y.dur}`), h('b', {}, y.tech))); }));
    ol.append(h('li', { class: 'vt-step' },
      h('div', { class: 'vt-num' }, String(i + 1)),
      h('div', { class: 'vt-body' },
        h('div', { class: 'vt-head' }, h('b', {}, r.t), h('span', { class: 'vt-ch' }, ...r.ch.map(([href, p]) => h('a', { href, class: 'chip' }, p)))),
        h('p', {}, r.s), btns)));
  });
  root.append(ol);
});

/* ================================================================== KVÍZ */
defineQuiz('dnt', 'Kvíz – melyiket válasszam?', [
  { q: 'Melyik <b>nem</b> korlátja a cölöpverésnek?', a: ['Laza, közepesen tömör homok', 'Kőzet, sziklás talaj', 'Kemény agyag', 'Nagy tömbös feltöltés'], c: 0,
    e: 'Kőzetben, kemény (köves) agyagban, erősen cementált talajban és nagy tömbös feltöltésben a cölöp nem verhető le – sokszor egy vékony ilyen betelepülés is megakadályozza. Laza és közepesen tömör homokban a verés (vibrálás) jól működik, sőt a kiszorítás tömöríti a talajt.' },
  { q: 'Melyik technológiát választják <b>kifejezetten zaj‑ és rezgéskorlátozás</b> esetén?', a: ['CFA-cölöp', 'Vert előregyártott vasbeton cölöp', 'Franki-cölöp', 'Vibrált acél csőcölöp'], c: 0,
    e: 'A CFA fúrással készül, zaj‑ és rezgésszegény, és gyorsan halad. A vert és vibrált cölöpök, valamint a Franki-cölöp döngölése jelentős zajjal és rezgéssel jár.' },
  { q: 'Iszapos, magas víztartalmú talajban 120 cm átmérőjű, 35 m hosszú cölöp kell. Melyik a biztonságos választás?', a: ['Béléscsöves (köpenycsöves) fúrt cölöp', 'CFA-cölöp', 'Megtámasztás nélküli fúrt cölöp', 'Talajcsavar'], c: 0,
    e: 'A béléscső a felbetonozásig megtámasztja a furat falát, így magas víztartalmú, iszapos talajban is biztonságos; 80–180 cm-es átmérővel, 15–50 (100) m-es hosszal készül. A CFA legfeljebb 22–24 m-es.' },
  { q: 'Mikor gazdaságos a kútalap?', a: ['Ha a teherbíró réteg nincs túl mélyen, és magas a talajvíz', 'Ha a teherbíró réteg 40 m mélyen van', 'Ha rezgésmentesen kell kőzetbe alapozni', 'Ha könnyűszerkezetes házat alapozunk'], c: 0,
    e: 'A kútalap jellemzően 4–8 m hosszú, 0,8–3,0 m átmérőjű; akkor versenyképes a cölöppel, ha a teherbíró réteg nem túl mélyen van, főleg magas talajvíznél, amikor az alapsíkot a vízszint alá kell vinni.' },
  { q: 'Kőzetbe kell vinni egy résfalat. Mivel réselnél?', a: ['Hydrofraiserrel', 'Kötélen függő markolóval', 'Kelly-rudas markolóval', 'Rövid spirállal'], c: 0,
    e: 'Kőzetben, nagyon kemény agyagban a résfal csak hydrofraiserrel (marótárcsás, folyadékszállítású réselővel) készíthető. Nagyon drága, de nagy mélységig bármely talajban és kőzetben pontos rést ad.' },
  { q: 'Melyik talajban <b>nehéz</b> biztosítani a résállékonyságot?', a: ['Tőzegben, puha agyagban, folyós homokban', 'Tömör homokos kavicsban, talajvíz felett', 'Kemény agyagban, talajvíz felett', 'Közepesen tömör homokban, mély talajvízzel'], c: 0,
    e: 'Puha agyagban, tőzegben, folyós (víz alatti) homokban és nagyon magas talajvíz mellett a rés falát a zagy nehezen tudja megtámasztani – ilyenkor a résfal korlátba ütközik.' },
  { q: 'Hol alkalmaznak jellemzően talajcsavart?', a: ['Napelempark, kerítés, könnyűszerkezetes ház alatt', 'Nagy fesztávú híd mederpillére alatt', 'Mélygarázs vízzáró oldalfalaként', 'Toronyház 40 m mély alapozásához'], c: 0,
    e: 'A talajcsavar kis terhű szerkezetek alapozására való; jellemzően legfeljebb 2–3 m hosszú, géppel vagy kézzel lehajtható, és könnyen visszanyerhető – ideiglenes, mobil szerkezetekhez is.' },
  { q: 'Melyik talajban <b>nem</b> való a helyben készülő csavart (talajkiszorításos) cölöp?', a: ['Kőzetben, nagyon tömör, kemény rétegben', 'Laza homokban', 'Közepesen tömör szemcsés talajban', 'Puha–gyúrható kötött talajban'], c: 0,
    e: 'A kiszorító fúrófej laza–közepesen tömör szemcsés, átmeneti és puha–gyúrható kötött talajban dolgozik jól: széttolja és tömöríti a talajt. Kemény, nagyon tömör rétegbe nem jut le.' },
  { q: 'Melyik állítás igaz a nagyátmérőjű (80 cm feletti) cölöpökre?', a: ['Kizárólag talajhelyettesítéses technológiával készülnek', 'Főleg előregyártva, verve készülnek', 'Csak talajcsavarként készülhetnek', 'Mindig fából készülnek'], c: 0,
    e: 'A 80 cm-nél nagyobb átmérőjű cölöpök már kizárólag talajhelyettesítéses technológiával – béléscsöves, bentonitzagyos fúrással, nagyobb CFA-géppel – készülnek.' },
]);

void GUARD;
