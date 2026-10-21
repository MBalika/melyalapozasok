// C12 – Önellenőrzés: 40 igaz/hamis állítás + kereshető, szűrhető fogalomtár
import { register, h, clear } from './core.js';
import { defineTF } from './ui.js';

defineTF([
  { s: 'A mélyalap nemcsak az alsó támaszkodó felületén (talpán), hanem az oldalán, a köpenyén is képes terhet átadni a talajnak.', v: true, e: 'Ezért teherközvetítő elem: a teherbírás a talp- (csúcs-) és a köpenymenti ellenállásból adódik össze.' },
  { s: 'Vegyes (kombinált) cölöpnél a csúcs‑ és a köpenymenti ellenállás egyaránt 33–66 % között részesedik a teherbírásból.', v: true, e: 'Ha egyik sem éri el a 2/3-ot, a cölöp vegyes működésű.' },
  { s: 'Ha a teherbírás legalább 2/3-át a köpenymenti ellenállás adja, álló cölöpről beszélünk.', v: false, e: 'Ez a lebegő cölöp. Álló cölöpnél a teherbírás legalább 2/3-a csúcsellenállás: a cölöp egy sokkal jobb teherbírású rétegbe „áll bele”.' },
  { s: 'Felúszás elleni lehorgonyzásnál – például mélygarázsoknál, tartályoknál – a cölöp húzott elemként dolgozik.', v: true, e: 'Húzottá válhat a cölöp akkor is, ha egy cölöpcsoport nagy külpontos terhet kap.' },
  { s: 'Húzott cölöpnél a terhet a talp és a köpeny együtt adja át a talajnak.', v: false, e: 'Húzott cölöpnél csak a köpeny dolgozik, a nyomott esethez képest ellentétes irányban.' },
  { s: 'A 80 cm-nél nagyobb átmérőjű cölöpök jellemzően talajkiszorításos technológiával, előregyártva készülnek.', v: false, e: 'A nagyátmérőjű cölöpök kizárólag talajhelyettesítéses technológiával készülnek.' },
  { s: 'Hidak mederpilléreinél a kimosás veszélye miatt a síkalap a legbiztonságosabb megoldás.', v: false, e: 'Épp fordítva: a kimosás, kiüregelés veszélye a mélyalapozás egyik tipikus oka – akárcsak az elcsúszás veszélye vagy a síkalappal meg nem engedhető süllyedés.' },
  { s: 'Talajhelyettesítéses cölöp minden esetben helyben készül.', v: true, e: 'A talajt kiemeljük (kifúrjuk), és a keletkező üreget kitöltjük; közben a környező talaj kissé fellazulhat.' },
  { s: 'Előregyártott, talajba juttatott cölöpnél a kiszorítás a talp‑ és a köpenymenti ellenállást is növeli.', v: true, e: 'Helyben készülő csavart cölöpnél elsősorban a köpenymenti ellenállás nő.' },
  { s: 'A helyben készülő csavart cölöp fúrás közben felhozza a talajt, ezért sok furadékot kell elszállítani.', v: false, e: 'A kiszorító fúrófej széttolja és tömöríti a talajt, a felszínre csak csekély furatanyag kerül.' },
  { s: 'A cölöpverés kemény agyagban és nagy tömbös feltöltésben is gond nélkül alkalmazható.', v: false, e: 'Kőzetben, kemény agyagban, erősen cementált talajban és tömbös feltöltésben nem alkalmazható – akár egy vékony ilyen betelepülés is megakadályozhatja.' },
  { s: 'A talajcsavarok jellemzően 10–15 m hosszúak, és nagy terhű hidak alapozására valók.', v: false, e: 'Jellemzően legfeljebb 2–3 m hosszúak, kisebb terhű szerkezetekhez: könnyűszerkezetes házak, napelemparkok, kerítések, mobil lelátók.' },
  { s: 'Vibrálásnál a rezgésszámot a talaj önrezgésszámához igazítva a talaj ellenállása ideiglenesen minimálisra csökkenthető.', v: true, e: 'A vibrálás elsősorban szemcsés talajban alkalmazható; a nagy zajt árnyékolással próbálják csökkenteni.' },
  { s: 'A Franki-cölöp talpán döngöléssel kiszélesedő betontalpat, „hagymát” alakítanak ki.', v: true, e: 'A tömörített betontalp jelentősen megnöveli a teherbírást (2000–3000 kN is elérhető).' },
  { s: 'A furat talpán maradt fellazult, leülepedett vagy beomlott talaj jelentősen csökkentheti a cölöp csúcsellenállását.', v: true, e: 'Ezért betonozás előtt a cölöptalpat meg kell tisztítani.' },
  { s: 'A Franki-cölöp béléscsövét a cső tetejére mért kalapácsütésekkel verik le.', v: false, e: 'A csőbe töltött kb. 1 m-es száraz betondugót döngölik egy 3 t-ás ejtőkossal, és a beton a súrlódás révén magával húzza a csövet.' },
  { s: 'A rövid spirált elsősorban szemcsés, a dobfúrót elsősorban kötött talajban használják.', v: false, e: 'Fordítva: a rövid spirál elsősorban kötött, a dobfúró elsősorban szemcsés talajhoz való; a markoló és a folyamatos spirál bármely talajban dolgozik.' },
  { s: 'A CFA-cölöp betonját a furatba juttatás után alaposan vibrálni kell.', v: false, e: 'Nem kell vibrálni: a folyós konzisztencia és a nyomás alatti bedolgozás biztosítja az öntömörödést.' },
  { s: 'CFA-cölöpnél a furat falát a spirálon maradó talajdugó támasztja meg, külön megtámasztás nem kell.', v: true, e: 'Ez a folyamatos spirál egyik legnagyobb előnye.' },
  { s: 'CFA-cölöpnél a vasalókosarat a már bebetonozott, friss cölöpbe süllyesztik.', v: true, e: 'Ezért a cölöpöt általában a munkaszintig felbetonozzák.' },
  { s: 'Béléscsöves fúrásnál talajvíz alatt a furatban pótolni kell a kiemelt vizet, különben a talpon betörhet a talajvíz.', v: true, e: 'A magasabb külső vízszint a furat talpán betörő vízzel megbontaná a talajt.' },
  { s: 'A CFA-cölöp jellemző hossza 30–50 m.', v: false, e: 'Jellemzően 6–22 (24) m hosszú, 40–120 cm átmérőjű.' },
  { s: 'Szemcsés talajban a béléscső a földkiemelés után, attól lemaradva halad lefelé.', v: false, e: 'A béléscsőnek általában – szemcsés talajban feltétlenül – a földkiemelés előtt kell járnia.' },
  { s: 'Bentonitzagyos cölöpnél a betont felülről, szabadon ejtve juttatják a zaggyal teli furatba.', v: false, e: 'A betonozás kontraktorcsővel, alulról felfelé történik, a beton kiszorítja a zagyot.' },
  { s: 'Kötött talajban, talajvíz felett, legfeljebb 8–10 m mély furat megtámasztás nélkül is készülhet, de rögtön ki kell betonozni.', v: true, e: '5–6 m mélységig az ilyen alapot markolt tömbalapnak, kútalapnak is nevezik.' },
  { s: 'A fúrt mikrocölöp törzsátmérője 400–600 mm.', v: false, e: 'Fúrt mikrocölöp: legfeljebb 250–300 mm; vert mikrocölöp: legfeljebb 150 mm.' },
  { s: 'Mikrocölöpnél a kihajlást külön vizsgálni kell, ha a talajréteg drénezetlen nyírószilárdsága 10 kPa-nál kisebb.', v: true, e: 'A kis átmérő miatt puha talajban a karcsú cölöp kihajolhat.' },
  { s: 'Mikrocölöp teherbírásának számításakor a talpellenállást figyelmen kívül hagyjuk.', v: true, e: 'A palástellenállást a készítés módja határozza meg, ezért próbaterhelés indokolt.' },
  { s: 'Jet-groutingnál a cementszuszpenziót 5–6 bar nyomással juttatják a talajba.', v: false, e: 'A habarcssugár nyomása 400–600 bar; az 5–6 bar a levegős dupla jet levegőburkának nyomása.' },
  { s: 'A résfal réstábláját egyszerre akár 30 m hosszan is ki lehet emelni.', v: false, e: 'Egy réstábla legfeljebb 8–10 m, jellemzően 2,8–5,6 m hosszú – ezt a résállékonyság szabja meg.' },
  { s: 'Jet-groutingnál agyagban kisebb, kavicsban jóval nagyobb átmérőjű oszlop alakul ki.', v: true, e: 'Agyagban legfeljebb kb. 60–70 cm, kavicsban akár 150–200 cm.' },
  { s: 'Réseléskor a zagyszintnek mindig legalább 1,0–1,5 m-rel a talajvízszint felett kell lennie.', v: true, e: 'A zagynyomásnak a víznyomással és a földnyomással egyensúlyt kell tartania.' },
  { s: 'A résvezető gerenda egyebek mellett megvezeti a réselőszerszámot, és kitűzési alapbázis is.', v: true, e: 'Védi a rés peremét, megtámasztja a laza felső talajt, és megakadályozza a zagy elszivárgását.' },
  { s: 'A réseléshez használt bentonitzagy sűrűsége kb. 1,8–2,0 g/cm³.', v: false, e: 'A zagy sűrűsége ρ = 1,03–1,12 g/cm³; csak aktivált „Na” bentonit használható.' },
  { s: 'Véges hosszú résnél a földnyomás a mélységgel lineárisan nő, ezért mindig a teljes Rankine-féle nyomás a mértékadó.', v: false, e: 'A rés két vége felé boltozódás alakul ki (silóhatás), a földnyomás egy határértékhez tart – erre szolgál például a Schneebeli-féle képlet.' },
  { s: 'A réstábla betonozását ráérünk a réselés után egy-két nappal elkezdeni.', v: false, e: 'A betonozást mielőbb, legkésőbb 4–5 órán belül meg kell kezdeni, előtte aljtisztítással.' },
  { s: 'A résfal felső, kb. 30–50 cm-es, zaggyal keveredett betonrészét el kell bontani.', v: true, e: 'Ezt a részt visszavésik, és újra betonozzák.' },
  { s: 'Kőzetben vagy nagyon kemény agyagban résfal csak hydrofraiserrel készíthető; hazánkban a 4-es metró építésénél alkalmazták.', v: true, e: 'A Fővám téren 48,3 m, a Szent Gellért téren 40 m mély résfal készült így.' },
  { s: 'A keszonban a vizet levegő-túlnyomással szorították ki, legfeljebb kb. 3,2–3,5 bar túlnyomással.', v: true, e: 'Az emberek és az anyagok külön légzsilipen át jutottak le és fel – nagyon veszélyes, egészségkárosító munka volt.' },
  { s: 'A kútalapot hidraulikus sajtókkal nyomják le a talajba.', v: false, e: 'A köpenyfal a saját súlyánál fogva süllyed, miközben belül egy „csipegető” markoló kiszedi a földet.' },
]);

/* ================================================================== FOGALOMTÁR */
// [fogalom, magyarázat, fejezet-id, témakör]
const TOPICS = [['alap', 'Alapok', 'Alapok'], ['kisz', 'Kiszorításos', 'Kiszorításos'], ['hely', 'Fúrt, helyettesítéses', 'Fúrt'], ['egyeb', 'Egyéb cölöpök', 'Egyéb'], ['fal', 'Résfal', 'Résfal'], ['kut', 'Kút, szekrény', 'Kút, szekrény']];
const GLOSS = [
  ['Mélyalap', 'Teherközvetítő elem az építmény és a mélyebben fekvő teherbíró réteg között, amely a talpán és a köpenyén is ad át terhet. Fajtái: cölöp-, résfalas, kút‑ és szekrényalapozás.', 'alapok', 'alap'],
  ['Csúcsellenállás (talpellenállás)', 'A cölöp talpán, síkalapszerűen, nyomással átadott teher.', 'rendszer', 'alap'],
  ['Köpenymenti (palást-) ellenállás', 'A cölöp oldalfelülete mentén, nyírással átadott teher. Húzott cölöpnél csak ez dolgozik.', 'rendszer', 'alap'],
  ['Álló cölöp', 'A teherbírás legalább 2/3-át a csúcsellenállás adja: a cölöp egy jóval jobb rétegbe „áll bele”.', 'rendszer', 'alap'],
  ['Lebegő cölöp', 'A teherbírás legalább 2/3-át a köpenymenti ellenállás adja; a csúcs környékén nincs jobb teherbírású réteg.', 'rendszer', 'alap'],
  ['Vegyes (kombinált) cölöp', 'A csúcs‑ és a köpenymenti ellenállás egyaránt 33–66 % között részesedik a teherbírásból.', 'rendszer', 'alap'],
  ['Húzott cölöp', 'Csak a köpenye mentén, ellentétes irányban ad át terhet – például felúszás elleni lehorgonyzásnál vagy nagy külpontosságnál.', 'rendszer', 'alap'],
  ['Cölöprács, fejtömb', 'A cölöpfejeket összefogó vasbeton tömb, lemez és/vagy gerendarács, amely a felépítmény terhét szétosztja a cölöpökre.', 'alapok', 'alap'],
  ['Talajhelyettesítéses cölöp', 'A talajt kiemelik (kifúrják), az üreget betonnal töltik ki. Mindig helyben készül, a környező talaj kissé fellazulhat.', 'rendszer', 'alap'],
  ['Talajkiszorításos cölöp', 'Előregyártott elemet vernek, vibrálnak, sajtolnak, csavarnak a talajba, vagy helyben széttolják a talajt – a környezet tömörödik.', 'rendszer', 'alap'],
  ['Nagyátmérőjű cölöp', '80 cm-nél nagyobb átmérőjű cölöp; kizárólag talajhelyettesítéses technológiával készül.', 'rendszer', 'alap'],
  ['Cölöpverés', 'Előregyártott cölöp talajba juttatása kalapáccsal (mechanikus, pneumatikus, gőz‑ vagy dízelkalapáccsal). Zajos, rezgést kelt; kőzetben, kemény agyagban nem alkalmazható.', 'elore', 'kisz'],
  ['Vibrálás', 'A rezgésszámot a talaj önrezgésszámához igazítva a talaj ellenállása ideiglenesen minimálisra csökken – főleg szemcsés talajban.', 'elore', 'kisz'],
  ['Cölöpfejezés', 'A leverés után a cölöp fejét a tervezett szintig visszabontják.', 'elore', 'kisz'],
  ['Talajcsavar', 'Üreges acélszár 40–60 cm-enként menettel, jellemzően legfeljebb 2–3 m hosszú; kis terhű szerkezetekhez, visszanyerhető.', 'elore', 'kisz'],
  ['Franki-cölöp', 'Béléscsöves, helyben vert betoncölöp: a csőbe töltött száraz betondugót ejtőkossal döngölik, a talpon „hagyma” alakul ki.', 'helyszini', 'kisz'],
  ['Csavart cölöp', 'Üreges fúrószár végén kiszorító fúrófej (Omega, FDP, Fundex, Screwsol), amely fúrás közben széttolja és tömöríti a talajt; 300–600 mm, kb. 20 m-ig.', 'helyszini', 'kisz'],
  ['CFA-cölöp', 'Folyamatos (végtelenített) spirállal fúrt cölöp: a betont a fúrószáron át, túlnyomással juttatják a furatba; 40–120 cm, 6–22 (24) m.', 'furt', 'hely'],
  ['Talajdugó', 'A CFA spirálján maradó talaj, amely fúrás közben megtámasztja a furat falát.', 'furt', 'hely'],
  ['Nyakasodás', 'A cölöptest helyi elvékonyodása, például ha a CFA fúrószárát a betonozás ütemén túl gyorsan húzzák ki.', 'furt', 'hely'],
  ['Béléscső (köpenycső)', 'A talajkiemeléssel párhuzamosan lehajtott acélcső, amely a felbetonozásig megakadályozza a talaj és a víz betörését.', 'furt', 'hely'],
  ['Bentonitzagy (fúróiszap)', 'Víz és benne diszpergált bentonit (montmorillonit); kiszorítja a talajvizet, megtámasztja a furat vagy a rés falát. ρ = 1,03–1,12 g/cm³.', 'resfal', 'hely'],
  ['Kontraktorcső', 'Betonozócső, amelynek vége végig a friss betonban van: alulról felfelé betonoz, a zagyot vagy a vizet kiszorítja.', 'furt', 'hely'],
  ['Dobfúró', 'Hengeres fúrószerszám a talaj kiemelésére, elsősorban szemcsés talajban.', 'furt', 'hely'],
  ['Markolt tömbalap', 'Kötött talajban, talajvíz felett, megtámasztás nélkül markolt, legfeljebb 5–6 m mély alap; kútalapnak is nevezik.', 'furt', 'hely'],
  ['Mikrocölöp', 'Fúrva legfeljebb 300 mm, verve legfeljebb 150 mm átmérőjű cölöp; aláfogásra, nehezen megközelíthető helyen. Talpellenállással nem számolunk.', 'egyeb', 'egyeb'],
  ['Merevbetétes mikrocölöp', 'Elvesző fúrófejes, folyamatosan toldható üreges acélrúd, amelyen át fúrás közben injektálnak (pl. Ischebeck Titan).', 'egyeb', 'egyeb'],
  ['Jet-grouting', 'A talajt 400–600 bar-os folyadéksugár aprózza fel és keveri kötőanyaggal: „talajbeton” oszlop vagy panel jön létre.', 'egyeb', 'egyeb'],
  ['Mélykeverés', 'A keverőszár a talajt helyben keveri össze a kötőanyaggal.', 'egyeb', 'egyeb'],
  ['Résfal', 'Függőleges falú, bentonitzaggyal megtámasztott árok (rés) vasalásával és kibetonozásával készülő fal a talajban; 40–120 cm vastag.', 'resfal', 'fal'],
  ['Réstábla (primer, szekunder)', 'Az egyszerre kiemelt és betonozott falszakasz (jellemzően 2,8–5,6 m). Előbb a primer, majd közöttük a közbenső táblák készülnek.', 'resfal', 'fal'],
  ['Harapás', 'A réskanál egy kiemelése; hossza jellemzően 2,8 m, a kanál nyitott szélessége.', 'resfal', 'fal'],
  ['Résvezető gerenda', 'A rés két oldalán épülő vasbeton gerenda: védi a peremet, vezeti a szerszámot és a zagyot, kitűzési alapbázis.', 'resfal', 'fal'],
  ['Szakaszoló palló', 'A réstáblák határát kijelölő elem; helyet ad a duzzadószalagnak, és védi az elkészült táblát a következő kiemeléskor.', 'resfal', 'fal'],
  ['Silóhatás', 'Véges hosszú résben a két vég felé boltozódás alakul ki, így a földnyomás a mélységgel egy határértékhez tart (Schneebeli-képlet).', 'resfal', 'fal'],
  ['Hydrofraiser', 'Marótárcsás, folyadékszállítású réselőgép: kőzetben és nagyon kemény agyagban is nagy mélységig pontos rést ad.', 'resfal', 'fal'],
  ['Kútalap', 'Nagy átmérőjű (0,8–3,0 m), 4–8 m hosszú, alul-felül nyitott köpenyfal, amelyet önsúllyal süllyesztenek, miközben belül kiszedik a földet.', 'kut', 'kut'],
  ['Vágóél', 'A süllyesztett köpenyfal alsó, megerősített éle, amely a talajba vág.', 'kut', 'kut'],
  ['Szekrényalap', 'Az építmény (pl. hídpillér) teljes alaprajzával azonos, süllyesztett szekrény; szakaszosan építik és süllyesztik.', 'kut', 'kut'],
  ['Keszon', 'Felülről zárt szekrény („harang”), amelyből a vizet legfeljebb 3,2–3,5 bar levegő-túlnyomással szorították ki.', 'kut', 'kut'],
  ['Légzsilip', 'Nyomáskiegyenlítő kamra a keszonnál: külön zsilip van a személyeknek (lassú nyomásváltással) és az anyagoknak.', 'kut', 'kut'],
  ['Roskadási tölcsér', 'A süllyesztett szekrény körül kialakuló felszíni bemélyedés, ha a környező talaj fellazul.', 'kut', 'kut'],
];
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

register('tz-gloss', (root) => {
  const inp = h('input', { type: 'search', class: 'tz-in', placeholder: 'Keresés a fogalmak között… (pl. zagy, köpeny, keszon)', 'aria-label': 'Keresés a fogalomtárban' });
  let topic = 'all';
  const chips = h('div', { class: 'tz-chips', role: 'group', 'aria-label': 'Témakör' });
  const mk = (k, t) => { const b = h('button', { type: 'button', class: k === topic ? 'on' : '' }, t); b.addEventListener('click', () => { topic = k; [...chips.children].forEach((x) => x.classList.toggle('on', x === b)); render(); }); return b; };
  chips.append(mk('all', 'Mind'), ...TOPICS.map(([k, t]) => mk(k, t)));
  const cnt = h('span', { class: 'tz-cnt' });
  const list = h('dl', { class: 'tz-list' });
  root.append(h('div', { class: 'tz-bar' }, inp, cnt), chips, list);
  const TI = Object.fromEntries(TOPICS.map(([k, , t]) => [k, t]));
  const render = () => {
    const q = norm(inp.value.trim());
    clear(list);
    let n = 0;
    for (const [t, d, ch, tp] of GLOSS) {
      if (topic !== 'all' && tp !== topic) continue;
      if (q && !norm(t + ' ' + d).includes(q)) continue;
      n++;
      list.append(h('div', { class: 'tz-gi', 'data-t': tp }, h('dt', {}, t), h('dd', {}, d, h('a', { href: '#' + ch }, 'Ugrás a fejezethez →')), h('span', { class: 'tz-tp' }, TI[tp])));
    }
    cnt.textContent = `${n} / ${GLOSS.length} fogalom`;
    if (!n) list.append(h('p', { class: 'muted' }, 'Nincs találat – próbálj rövidebb szórészletet.'));
  };
  inp.addEventListener('input', render);
  render();
});
