// C10 – Melyiket válasszam? Technológia-mátrix, döntési fa, kvíz
// C11 – Videótár: nézési útvonal (a #vlib és a #ytlib tartalmát a ui.js tölti)
import { register, shell, seg, h, svg, figure, clear, arrow, wrapText, GUARD, EN } from './core.js';
import { defineQuiz, ytMini } from './ui.js';
import { VIDEOS, YT } from './data.js';

/* ================================================================== 10.1 TECHNOLÓGIA-MÁTRIX */
// r: feltétel → [állapot, szöveg]; állapot: 'x' kizáró, 'w' figyelni kell, 'p' kifejezetten előnyös
const GROUPS = { kisz: ['Talajkiszorításos', 1], hely: ['Talajhelyettesítéses', 2], egyeb: ['Egyéb cölöp', 3], fal: ['Résfal', 4], kut: ['Kútalap', 5] };
const TECH = [
  { n: 'Acél cső‑ és H-cölöp', g: 'kisz', href: '#elore', d: 'cső vagy „H” profil', L: 'elem 15–20 m; toldva csaknem tetszőleges', soil: 'cső: felül puha, alatta tömör szemcsés; a H-profil keményebb rétegen is átjut', gw: 'korrózióvédelem kell', vib: 'verés, vibrálás: zaj, rezgés', sp: 'gyors', ck: 'visszanyerhető; drága anyag',
    r: { vib: ['x', 'Verés, vibrálás: zaj és rezgés.'], hard: ['w', 'A H-profil jobban verhető, de kőzetben, kemény agyagban a verés korlátos.'], big: ['x', 'Nagyátmérőjű cölöp csak talajhelyettesítéssel készül.'], deep: ['w', 'Egy elem jellemzően 15–20 m; toldással csaknem tetszőleges hosszban készíthető.'], low: ['x', 'Verőgép, vibrátor kell.'], pit: ['x', 'Cölöpként nem vízzáró fal (arra a szádfal való).'] } },
  { n: 'Előregyártott vb. cölöp (vert, vibrált)', g: 'kisz', href: '#elore', d: '30×30, 40×40 cm; pörgetett: Ø 25–50 cm', L: '4–12 m; pörgetve legfeljebb 20–22 m', soil: 'kőzetben, kemény agyagban, cementált talajban, tömbös feltöltésben csak korlátozottan; a vibrálás a legtöbb talajban', gw: 'nem akadály', vib: 'nagy zaj és rezgés', sp: 'gyors (előre elkészül)', ck: 'gyári elem; a fejet a tervezett szintig visszabontják',
    r: { vib: ['x', 'A verés jelentős zajt és rezgést kelt – érzékeny szomszéd mellett a legkockázatosabb.'], hard: ['x', 'Kőzetben, kemény agyagban, cementált vagy tömbös rétegben csak korlátozottan alkalmazható – egy vékony betelepülés is megakadályozhatja a leverést.'], big: ['x', 'Nagyátmérőjű cölöp csak talajhelyettesítéssel készül.'], deep: ['x', 'Pörgetett csőcölöpként is legfeljebb 20–22 m.'], low: ['x', 'Nagy verőgép kell.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Talajcsavar (acél csavart cölöp)', g: 'kisz', href: '#elore', d: 'acélszár kúpos, menetes csúccsal vagy csavartányérral', L: '≤ 2–4 m', soil: 'kemény, köves talajban korlátozottan', gw: '–', vib: 'csendes, minimális vibráció (csavarás)', sp: 'gyors telepítés', ck: 'csak kisebb teher; nyomásra és húzásra is; visszanyerhető',
    r: { vib: ['p', 'Csavarással megy le: csendes, minimális vibrációval jár.'], hard: ['w', 'Kemény vagy köves talajban korlátozottan alkalmazható.'], big: ['x', 'Kis keresztmetszetű elem.'], deep: ['x', 'Jellemzően legfeljebb 2–4 m hosszú.'], low: ['x', 'Csak kisebb teherbírás érhető el; könnyű, új szerkezetekhez való, nem megerősítésre.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Csavart cölöp (FDP, Screwsol)', g: 'kisz', href: '#helyszini', d: '300–700 mm', L: '≤ 18 (20) m', soil: 'laza–közepesen tömör szemcsés, átmeneti, gyengén kötött', gw: 'nem akadály', vib: 'nincs dinamikus és zajhatás', sp: 'gyors', ck: 'csekély furadék; a kisebb átmérő korlátozza a teherbírást',
    r: { vib: ['p', 'Nincs dinamikus és zajhatás.'], hard: ['x', 'Laza–közepesen tömör talajokra való; kemény rétegbe a kiszorító fej nem jut le.'], big: ['x', '300–700 mm-es átmérő.'], deep: ['x', 'Legfeljebb kb. 20 m hosszú.'], low: ['x', 'Nagy fúrógép kell.'], pit: ['x', 'Nem vízzáró munkatérhatárolás.'] } },
  { n: 'CFA-cölöp (folyamatos spirál)', g: 'hely', href: '#furt', d: '40–120 cm', L: '≤ 22–24 m', soil: 'minden talajban, kivéve a laza, folyós talajokat; finom homokban különös gondosság', gw: 'a spirálon maradó talajdugó támaszt', vib: 'kis zaj, kis rezgés', sp: 'gyors fúrás, egyszerű gépészet', ck: 'automata monitorozás: betonnyomás, -mennyiség, jegyzőkönyv minden cölöpről',
    r: { vib: ['p', 'Kifejezetten zaj‑ és rezgéskorlátozás esetén választják.'], hard: ['w', 'Speciális fúrófejjel nagyon kemény talajban, puhább kőzetben is fúrható.'], big: ['w', 'A nagyobb átmérők (100–120 cm) is elérhetők.'], deep: ['x', 'Legfeljebb 22–24 m hosszú.'], low: ['x', 'Magas fúrógép kell.'], pit: ['w', 'Cölöpsorként csak akkor vízzáró, ha a cölöpök összemetszők.'], gw: ['w', 'Laza, folyós talajba nem javasolt; víztelített finom homokban különös gondosság kell.'] } },
  { n: 'Béléscsöves (köpenycsöves) fúrt cölöp', g: 'hely', href: '#furt', d: '80–150 (350) cm', L: '15–100 m (itthon eddig ≤ 30–40 m)', soil: 'különösen kedvezőtlen talajokban is', gw: 'magas víztartalmú, iszapos talajban is biztonságos', vib: 'a cső rotációval vagy vibrálással megy le', sp: 'lassabb, összetett gépészet', ck: 'a cső járjon a kiemelés előtt; talajvíz alatt vízpótlás a furatban',
    r: { vib: ['w', 'Rezgéskorlátnál a béléscsövet rotációval (és nem vibrálással) kell lehajtani.'], big: ['p', 'Nagy (min. 80 cm) átmérőhöz való.'], deep: ['p', 'Akár kb. 100 m hosszú (hazánkban eddig legfeljebb 30–40 m).'], low: ['x', 'Nagy fúrógép kell.'], pit: ['x', 'Nem munkatérhatárolás.'], gw: ['p', 'A cső a felbetonozásig megtámasztja a furatot.'] } },
  { n: 'Bentonitzagyos fúrt cölöp', g: 'hely', href: '#furt', d: '80–150 (350) cm', L: '15–100 m (itthon eddig ≤ 30–40 m)', soil: 'bármely talajban', gw: 'a zagy kiszorítja a talajvizet, megtámasztja a falat', vib: 'kicsi', sp: 'lassabb, összetett gépészet, zagytelep', ck: 'talptisztítás; betonozás kontraktorcsővel',
    r: { vib: ['p', 'Fúrással, zagyos megtámasztással: nincs verés.'], big: ['p', 'Nagy (min. 80 cm) átmérőhöz való.'], deep: ['p', 'Nagy mélységig: a fúrógép kapacitása nem korlát.'], low: ['x', 'Nagy fúrógép és zagytelep kell.'], pit: ['x', 'Cölöpként nem munkatérhatárolás.'], gw: ['p', 'A zagy kiszorítja a talajvizet.'] } },
  { n: 'Megtámasztás nélküli fúrt cölöp', g: 'hely', href: '#furt', d: 'rövid spirállal vagy markolóval', L: '≤ 8–10 m (5–6 m-ig markolt tömbalap)', soil: 'csak kötött talaj', gw: 'elsősorban talajvíz felett', vib: 'kicsi', sp: 'gyors', ck: 'a kiemelés után azonnal betonozni',
    r: { vib: ['p', 'Egyszerű fúrás, nincs verés.'], gw: ['x', 'Talajvíz alatt a furat megtámasztás nélkül már nem biztos, hogy megáll – megtámasztás kell.'], deep: ['x', 'Legfeljebb 8–10 m mély furat állékony.'], big: ['w', 'Nagy átmérőnél a furat állékonysága kérdéses.'], low: ['x', 'Fúrógép kell.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
  { n: 'Mikrocölöp', g: 'egyeb', href: '#egyeb', d: 'fúrt ≤ 300 mm, vert ≤ 150 mm', L: 'a feladathoz igazodik', soil: 'heterogén talajban és kőzetben is', gw: 'nem akadály', vib: 'kicsi, kis gép', sp: 'közepes', ck: 'talpellenállás nélkül számolunk; kihajlás, ha c<sub>u</sub> < 10 kPa; próbaterhelés indokolt',
    r: { low: ['p', 'Nehezen megközelíthető, alacsony helyen is készül – aláfogásra ideális.'], vib: ['p', 'Kis géppel, rezgésszegényen.'], big: ['x', 'Legfeljebb 300 mm-es törzsátmérő.'], deep: ['w', 'Karcsú elem: csak a köpeny visz terhet, puha talajban kihajlás.'], pit: ['w', 'Megtámasztó fal is kialakítható belőle, de vízzáró munkagödörre nem ez a jellemző.'] } },
  { n: 'Jet-grouting', g: 'egyeb', href: '#egyeb', d: 'szimpla 50–100 cm, dupla kb. 120 cm, panel 180–200 cm', L: 'a feladathoz igazodik', soil: 'bármely talaj, gyenge kőzet is', gw: 'kevéssé áteresztő zárófal is készíthető', vib: 'nincs verés; 350–400 bar-os sugár', sp: 'közepes', ck: 'az átmérő talajfüggő; hidraulikus talajtörés, felemelkedés veszélye',
    r: { low: ['p', 'Szűk helyen, alapmegerősítésre is.'], vib: ['p', 'Fúrás és injektálás: nincs verés.'], hard: ['w', 'Kötött talajban kisebb az oszlop (szimpla jetnél agyagban 50–70 cm).'], big: ['w', 'Nagyobb átmérő dupla jettel (kb. 120 cm) vagy durva szemcsés talajban.'], pit: ['w', 'Munkatérhatárolásra, kevéssé áteresztő zárófalnak is jó, de a vízzárás kényes.'] } },
  { n: 'Résfal', g: 'fal', href: '#resfal', d: '40–120 cm vastag; tábla 2,8–6,5 (8) m', L: '10–30 m, akár 100–120 m', soil: 'nehéz: puha agyag, tőzeg, folyós homok; kőzetben csak hydrofraise', gw: 'vízzáró; a zagyszint legalább 1,0–1,5 m-rel a talajvíz felett', vib: 'viszonylag zajtalan, rázkódásmentes', sp: 'közepes; drága gépek', ck: 'próbaterhelhető; izotópos vagy szeizmikus betonvizsgálat',
    r: { pit: ['p', 'Vízzáró, merev: a mélygarázs végleges oldalfala is lehet.'], vib: ['p', 'Viszonylag zaj‑ és rázkódásmentes.'], hard: ['w', 'Kőzetben, nagyon kemény agyagban csak hydrofraise-zel – nagyon drága.'], deep: ['p', 'Általában 10–30 m, de 100–120 m-es is lehet.'], big: ['p', 'Nagy keresztmetszet, nagy teherbírás, kis süllyedés.'], low: ['x', 'Nagy réselőgép és zagytelep kell.'], gw: ['p', 'Nincs szükség talajvízszint-süllyesztésre.'] } },
  { n: 'Kútalap', g: 'kut', href: '#kut', d: '0,8–3,0 m', L: '4–8 m', soil: 'kotorható talaj, nem túl mély teherbíró réteg', gw: 'magas talajvíznél előnyös', vib: 'ma: a köpenycsövet vibrálják', sp: 'lassú', ck: 'ma visszanyert acélköpenyes, kontraktoros betonozással',
    r: { deep: ['x', 'Csak 4–8 m-ig gazdaságos.'], gw: ['p', 'Magas talajvíznél, víz alatti alapsíknál alkalmazták.'], big: ['p', 'Nagy átmérő (0,8–3,0 m).'], vib: ['w', 'A mai acél köpenycsövet vibrálással hajtják le.'], low: ['x', 'Markoló és darus gép kell.'], pit: ['x', 'Nem munkatérhatárolás.'] } },
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
      ? `<b>${ok}</b> ${EN ? (ok === 1 ? 'technology is possible' : 'technologies are possible') : 'technológia jöhet szóba'}${ex ? `, <b>${ex}</b> kiesik` : ''}. ` + (ok ? 'Elöl a leginkább illők.' : 'Ilyen feltételekkel egyik sem megy magától – kombinált megoldás vagy más elrendezés kell.')
      : 'Nincs bekapcsolt feltétel – mind a 12 technológia látszik. Kapcsolj be egy vagy több feltételt!';
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

/* ================================================================== 10.2 DÖNTÉSI FA */
const TREE = {
  q1: { q: 'Megfelel a síkalap?', s: 'A teherbíró réteg sekélyen van, a süllyedés elfogadható, nincs kimosás‑ és elcsúszásveszély.', y: 'L1', n: 'q2' },
  q2: { q: 'Meglévő épületet kell megerősíteni, szűk, alacsony helyről?', s: 'Például ráépítés, pinceszint-mélyítés, túlterhelt régi alap.', y: 'L2', n: 'q3' },
  q3: { q: 'Talajvíz alatti munkagödör is kell, közvetlenül a telekhatáron?', s: 'Például mélygarázs, aluljáró a szomszéd épületek mellett.', y: 'L3', n: 'q4' },
  q4: { q: 'Sekély (4–8 m) a teherbíró réteg, magas talajvíz mellett, kevés nagy terhű pillér alatt?', s: 'A klasszikus kútalap-helyzet.', y: 'L4', n: 'q5' },
  q5: { q: '80 cm-nél nagyobb átmérő vagy kb. 24 m-nél hosszabb cölöp kell?', s: 'Nagy terhek, mélyen fekvő teherbíró réteg.', y: 'L5', n: 'q6' },
  q6: { q: 'Szigorú rezgés‑ és zajkorlát van?', s: 'Érzékeny szomszéd, belváros, kórház, régi épületek.', y: 'L6', n: 'L7' },
  L1: { t: 'Síkalap', href: 'https://sikalapoktervezese.vercel.app', ext: true, e: 'Ha a síkalap megfelel, általában az a legegyszerűbb és legolcsóbb megoldás. A mélyalap akkor kell, ha a teherbíró réteg mélyen van, a süllyedés síkalappal meg nem engedhető, kimosás vagy elcsúszás fenyeget, vagy ha összességében gazdaságosabb.' },
  L2: { t: 'Mikrocölöp vagy jet-grouting', href: '#egyeb', e: 'Nehezen megközelíthető, korlátozott magasságú helyen a mikrocölöp kis géppel készül, és a terhet a mélyebb, jobb rétegre hárítja át (aláfogás). A jet-grouting alapmegerősítésre, alapsík-mélyítésre is alkalmas, bármely talajban.' },
  L3: { t: 'Résfal', href: '#resfal', e: 'A résfal vízzáró és merev, viszonylag zaj‑ és rázkódásmentesen készül, nem kell hozzá talajvízszint-süllyesztés, és a végleges szerkezet – a mélygarázs oldalfala, akár alapozása – része lehet.' },
  L4: { t: 'Kútalap – vagy rövid fúrt cölöp', href: '#kut', e: 'A kútalap akkor gazdaságos, ha a teherbíró réteg nincs túl mélyen, és főleg magas talajvíznél, amikor az alapsíkot a vízszint alá kell vinni. Ma visszanyert acél köpenycsöves markolt alapként készül – de sokszor egy rövid fúrt cölöp a versenytársa.' },
  L5: { t: 'Béléscsöves vagy bentonitzagyos fúrt cölöp', href: '#furt', e: 'Nagyátmérőjű (80 cm feletti) cölöp kizárólag talajhelyettesítéssel készülhet. A béléscső kedvezőtlen, iszapos talajban is biztonságos, a bentonitzagyos fúrás bármely talajban dolgozik: mindkettő 80–150 (350) cm átmérővel, legfeljebb kb. 100 m (hazánkban eddig 30–40 m) mélységig készül.' },
  L6: { t: 'CFA‑ vagy csavart cölöp', href: '#furt', e: 'Zaj‑ és rezgéskorlátnál a CFA a kézenfekvő: gyors, monitorozott, 40–120 cm, legfeljebb 22–24 m. Laza–közepesen tömör szemcsés és átmeneti talajban a csavart cölöp is jó: nincs dinamikus és zajhatás, és alig van furadék.' },
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
  { t: 'Indulás: mi a mélyalap?', ch: [['#alapok', 'C01'], ['#rendszer', 'C02']], v: ['v1', 'v2'], yt: ['c3vKfjgqJdA', 'er4WW_v5qgk'], s: 'Mikor kell mélyalap, hogyan adja át a terhet a talp és a köpeny, milyen cölöpfajták vannak – és miben más a kiszorításos és a helyettesítéses cölöp.' },
  { t: 'Kiszorításos cölöpök', ch: [['#elore', 'C03'], ['#helyszini', 'C04']], v: [], yt: ['KDKCobw52qk', 'D27v2bVmoXc', '_QsH5x0ndtI', 'hwP8iZzAq6I'], s: 'Verés, vibrálás, csavarás, Franki-hagyma: a talajt széttolják és tömörítik.' },
  { t: 'Fúrt cölöpök', ch: [['#furt', 'C05']], v: [], yt: ['wqOU4bcUiCk', 'Oe5saZFiPJk'], s: 'Talajhelyettesítés, furatállékonyság, betonozás – a CFA és a béléscsöves gép a valóságban.' },
  { t: 'Mikrocölöp, jet-grouting, mélykeverés, kavicscölöp', ch: [['#egyeb', 'C06']], v: [], yt: ['7M7YPxBn8Xk', 'MPjXIhchN-w', 'wh31VB1fY_8', 'cNkNZV6kgqk'], s: 'Aláfogás pincéből, 350–400 bar-os sugár, helyben kevert talaj, kőoszlop.' },
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
      ...r.yt.map((id) => { const y = YT[id]; return h('button', { class: 'vt-b yt', type: 'button', onclick: () => playYT(id), 'aria-label': 'BME-felvétel: ' + y.title }, h('i', { class: 'vt-ytb' }), h('span', {}, h('small', {}, `${y.ch.split(' ')[0]} · ${y.dur}`), h('b', {}, y.tech))); }));
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
    e: 'Kőzetben, kemény (köves) agyagban, erősen cementált talajban és nagy tömbös feltöltésben a verés csak korlátozottan alkalmazható – sokszor egy vékony ilyen betelepülés is megakadályozza a leverést. Laza és közepesen tömör homokban a verés (vibrálás) jól működik, sőt a kiszorítás tömöríti a talajt.' },
  { q: 'Melyik technológiát választják <b>kifejezetten zaj‑ és rezgéskorlátozás</b> esetén?', a: ['CFA-cölöp', 'Vert előregyártott vasbeton cölöp', 'Franki-cölöp', 'Vibrált acél csőcölöp'], c: 0,
    e: 'A CFA fúrással készül, zaj‑ és rezgésszegény, és gyorsan halad. A vert és vibrált cölöpök, valamint a Franki-cölöp döngölése jelentős zajjal és rezgéssel jár.' },
  { q: 'Iszapos, magas víztartalmú talajban 120 cm átmérőjű, 35 m hosszú cölöp kell. Melyik a biztonságos választás?', a: ['Béléscsöves (köpenycsöves) fúrt cölöp', 'CFA-cölöp', 'Megtámasztás nélküli fúrt cölöp', 'Talajcsavar'], c: 0,
    e: 'A béléscső a felbetonozásig megtámasztja a furat falát, így magas víztartalmú, iszapos talajban is biztonságos; 80–150 (350) cm-es átmérővel, legfeljebb kb. 100 m-es (hazánkban eddig 30–40 m-es) hosszal készül. A CFA legfeljebb 22–24 m-es.' },
  { q: 'Mikor gazdaságos a kútalap?', a: ['Ha a teherbíró réteg nincs túl mélyen, és magas a talajvíz', 'Ha a teherbíró réteg 40 m mélyen van', 'Ha rezgésmentesen kell kőzetbe alapozni', 'Ha könnyűszerkezetes házat alapozunk'], c: 0,
    e: 'A kútalap jellemzően 4–8 m hosszú, 0,8–3,0 m átmérőjű; akkor versenyképes a cölöppel, ha a teherbíró réteg nem túl mélyen van, főleg magas talajvíznél, amikor az alapsíkot a vízszint alá kell vinni.' },
  { q: 'Kőzetbe kell vinni egy résfalat. Mivel réselnél?', a: ['Hydrofraise-zel', 'Kötélen függő markolóval', 'Kelly-rudas markolóval', 'Rövid spirállal'], c: 0,
    e: 'Kőzetben, nagyon kemény agyagban a résfal csak hydrofraise-zel (marótárcsás, folyadékszállítású réselővel) készíthető. Nagyon drága, de nagy mélységig bármely talajban és kőzetben pontos rést ad.' },
  { q: 'Melyik talajban <b>nehéz</b> biztosítani a résállékonyságot?', a: ['Tőzegben, puha agyagban, folyós homokban', 'Tömör homokos kavicsban, talajvíz felett', 'Kemény agyagban, talajvíz felett', 'Közepesen tömör homokban, mély talajvízzel'], c: 0,
    e: 'Puha agyagban, tőzegben, folyós (víz alatti) homokban és nagyon magas talajvíz mellett a rés falát a zagy nehezen tudja megtámasztani – ilyenkor a résfal korlátba ütközik.' },
  { q: 'Hol alkalmaznak jellemzően talajcsavart?', a: ['Könnyűszerkezetes családi ház, melléképület, reklámtábla alatt', 'Nagy fesztávú híd mederpillére alatt', 'Mélygarázs vízzáró oldalfalaként', 'Toronyház 40 m mély alapozásához'], c: 0,
    e: 'A talajcsavarral csak kisebb teherbírás érhető el; jellemzően legfeljebb 2–4 m hosszú, kisebb géppel vagy kézzel is lehajtható, és visszanyerhető – ideiglenes létesítményekhez (pl. színpadok, lelátók) is.' },
  { q: 'Melyik talajban <b>nem</b> való a helyben készülő csavart (talajkiszorításos) cölöp?', a: ['Kőzetben, nagyon tömör, kemény rétegben', 'Laza homokban', 'Közepesen tömör szemcsés talajban', 'Puha–gyúrható kötött talajban'], c: 0,
    e: 'A kiszorító fúrófej laza–közepesen tömör szemcsés, átmeneti és gyengén kötött (puha–gyúrható) talajban dolgozik jól: széttolja és tömöríti a talajt. Kemény, nagyon tömör rétegbe nem jut le.' },
  { q: 'Melyik állítás igaz a nagyátmérőjű (80 cm feletti) cölöpökre?', a: ['Kizárólag talajhelyettesítéses technológiával készülnek', 'Főleg előregyártva, verve készülnek', 'Csak talajcsavarként készülhetnek', 'Mindig fából készülnek'], c: 0,
    e: 'A 80 cm-nél nagyobb átmérőjű cölöpök már kizárólag talajhelyettesítéses technológiával – béléscsöves, bentonitzagyos fúrással, nagyobb CFA-géppel – készülnek.' },
]);

void GUARD;

/* ---- C11 videótár: a BME-felvételek csoportjainak rendezett elrendezése (G1)
   A ui.js a #ytlib-be csoportonként (fejléc + rács) tölti a kártyákat. A kevés elemű csoportokat
   (3 + 1, illetve 1 + a lejátszási listák) egy sorba rendezzük, hogy ne maradjon félig üres sor. */
function vtLayout() {
  const lib = document.getElementById('ytlib');
  if (!lib || lib.dataset.vtl) return;
  const kids = [...lib.children];
  const groups = [];
  for (let i = 0; i + 1 < kids.length; i += 2) if (kids[i].classList.contains('vgroup')) groups.push([kids[i], kids[i + 1]]);
  if (groups.length < 4) return;
  const n = (g) => g[1].children.length;
  if (n(groups[1]) + n(groups[2]) !== 4 || n(groups[3]) !== 1) return;
  lib.dataset.vtl = '1';
  // a keskeny (egykártyás) oszlopok fejléce egy sorba férjen, hogy a kártyák teteje egy vonalba essen
  groups[1][0].textContent = 'Egyéb cölöpök'; groups[1][0].title = 'A Talajjavítások lejátszási listából';
  groups[2][0].textContent = 'Résfal'; groups[2][0].title = 'A Befogott támszerkezetek lejátszási listából';
  groups[3][0].textContent = 'Kimosás'; groups[3][0].title = 'Miért kell mélyre menni? – kimosás a hídpillér körül';
  const mk = (cls, span) => { const d = document.createElement('div'); d.className = cls; if (span) d.style.setProperty('--n', span); return d; };
  const cell = (g) => { const c = mk('vt-ycell', n(g)); c.append(g[0], g[1]); return c; };
  const r1 = mk('vt-yrow'); r1.append(cell(groups[1]), cell(groups[2]));
  const r2 = mk('vt-yrow'); r2.append(cell(groups[3]));
  const lists = document.querySelector('#videotar .vt-lists');
  if (lists) {
    const c = mk('vt-ycell vt-ylists', 3);
    const hd = mk('vgroup grp6'); hd.textContent = 'A teljes lejátszási listák';
    c.append(hd, lists); r2.append(c);
  }
  lib.append(r1, r2);
}
if (typeof window !== 'undefined') setTimeout(vtLayout, 0);
// az angol oldalon a build a társoldalak gyökércímét írja át /en-re; az aloldalas és a később elkészült angol változatokat itt irányítjuk át
if (EN && typeof document !== 'undefined') for (const el of document.querySelectorAll('a[href^="https://cfa-colop-3d.vercel.app"], a[href^="https://bme-alapozas.vercel.app/ar-labor"]')) {
  const u = el.getAttribute('href').replace(/\/$/, ''); if (!/\/en$/.test(u)) el.setAttribute('href', u + '/en');
}

