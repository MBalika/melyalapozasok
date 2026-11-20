# Mélyalapozások app – teljes átnézés és felújítás (fejezetcsoportonként)

Az app: https://melyalapozasok.vercel.app (magyar) és /en (angol), repó MBalika/melyalapozasok. A felhasználó (a tárgy oktatója, BME
geotechnika) kérése: „Nézd át ezt az appot … Minél jobban szebbítsd, csinosítsd és javítsd az oldalt, ha bármilyen hiba van … fontos,
hogy mindig a magyar és az angol oldalt is csináld.” Cél: a hallgató számára hibátlan, pontos, szép, látványos.

## A te munkaterületed
Saját git-munkafa (worktree) – lásd a megbízásodban. CSAK ott dolgozz, és csak a megbízásodban felsorolt fájlokat módosítsd.
Közös fájlhoz (style.css, core.js, ui.js, layout.js, main.js, data.js, hero.js, index.src.html, build.py, boxtitle.inc.html, zz_boxtitles.css,
i18n/*.mjs, a többi csoport fejezetei) NE nyúlj – ha ott találsz hibát, írd le pontosan a jelentésben (fájl, sor, mi a javítás).
Build a saját munkafádban: `cd <munkafa>/_src && python3 build.py` → `../index.html` + `../en.html` (az angol STRICT: hiányzó fordításnál leáll,
a hiányzók: `_src/i18n/missing.tsv`). Szerver a saját munkafád gyökerében, SAJÁT porton (megbízás), pl. `python3 -m http.server <port>` háttérben.
A gépen 2 CPU van és több ügynök dolgozik: MINDEN böngészős (Playwright) futtatást így indíts: `bash /home/claude/ref/gate.sh python3 …`
(egyszerre legfeljebb 2 böngésző fut; `timeout`-ot ne tegyél elé). Egy futásban több képet készíts.
Playwright-indítás szoftveres WebGL-lel: args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'].
Eszközök a munkafában: `_src/qa/` (README.md: audit.py, scan.py, sheet.py, els.py), `_src/tools/shot.py` (a 8770-es portot használja – a saját
portodra a qa-eszközöket használd, azok URL-t kapnak). A `?all` URL-paraméter minden widgetet azonnal elindít.

## Források a szakmai ellenőrzéshez
- a tárgy jegyzete: /home/claude/ref/mely_jegyzet.txt; az előadás (újabb, eltérésnél ez az irányadó): /home/claude/ref/mely_ppt.txt,
  a diák képe: `pdftoppm -r 70 -f N -l N -jpeg /home/claude/ref/mely_ppt.pdf /tmp/…/d` (105 dia);
- tényadatokhoz (épületméretek, évszámok, cölöpszámok, esetek) WebSearch – megbízható forrásból; amit nem tudsz ellenőrizni, ne írd át, jelezd.
- A szerző korábbi döntései (NE írd felül): nincs forrásmegjelölés sehol; CFA: „minden talajban, kivéve a laza, folyós talajokat; finom homokban
  különös gondosság”; CFA a fúrt cölöpök „részleges talajkiszorítás” ágán; köpenycsöves és zagyos cölöp 80–180 cm; Schneebeli kitevő
  e^(−z·sin2φ/L); Petronas: réselt elemek (barettek); „spirál” és nem „csiga”; beton/vb. alaptest teteje vízszintes, keresztmetszete téglalap;
  merev betétes talajjavítás: vasalatlan betétek, nincs merev kapcsolat, szemcsés teherelosztó réteg boltozódással, negatív köpenysúrlódás
  felül, talajjavítás és nem cölöpalap; a nyitó szövegben nincs „8. előadás”.

## Mit kell csinálni (az „oktatoapp-atnezes” rend szerint)
1. **Leltár – szöveg:** olvasd végig a fejezeteid TELJES szövegét (HTML + a JS minden karakterlánca: kvíz, játék, labor-üzenet, ábrafelirat,
   fogalomtár, vászonra/SVG-re rajzolt felirat). Keresd: ténybeli és szakmai hiba; belső ellentmondás (ugyanaz a szám a szövegben, kártyán,
   kvízben, labor-állandóban, táblázatban, fogalomtárban egyezzen – a többi fejezet szövegét is nézd meg grep-pel); elírás, helyesírás, magyartalan
   mondat; következetlen szakszó és jelölés (egy mennyiség egy jel; index valódi alsó index HTML-ben `<sub>`, SVG-ben `dy`-os tspan – NEM
   baseline-shift –, vásznon index-rajzolóval; tizedesvessző, szám + mértékegység egyben; mínusz −, szorzás ·, gondolatjel –);
   rövidítés első előfordulásnál feloldva; kvíz: a helyes válasz egyértelműen helyes, a rosszak nem részben igazak, a magyarázat egyezik a
   tananyaggal; tiltott tartalom (forrás, „a jegyzet szerint”, „(24. ábra)”).
2. **Leltár – számítás:** minden képletet, labor-/kalkulátor-modellt, példaszámot és kvízben szereplő számot számolj újra FÜGGETLENÜL (külön
   Python-szkript), és vesd össze a kiírt értékekkel és a widget kódjával (alapérték és a csúszkák két vége). A „szemléltető modell” maradhat
   egyszerű, de ne adjon fizikailag értelmetlen eredményt (negatív ellenállás, rossz irányú tendencia, mértékegység-hiba, nagyságrendi tévedés).
3. **Leltár – kép:** fényképezd végig a fejezeteidet 1440 px-en és 390 px-en (scan.py / els.py), világos és sötét témában; minden labor és játék
   minden állapotát (minden fül, kapcsoló, választó; a csúszkák két vége; a léptetős ábrák minden lépése). NÉZD MEG a képeket (Read). Keresd:
   átfedő / kilógó / levágott felirat (az animáció végállapotában is), rosszul olvasható felirat mintázaton (jó: tinta színű betű a kártya
   színével rajzolt glóriával: `paint-order: stroke; stroke: var(--surface); stroke-width: 3–4px; stroke-linejoin: round`), életlen vászon
   (devicePixelRatio), 390 px-en túl kicsi felirat (< ~10 px), vízszintes túlcsordulás, csonka kártyasor (pótold vagy középre), elcsúszott
   oszlopok, üres folt, sötét témában rossz kontraszt, tehernyíl, amely beleszúr a szerkezetbe, szakmailag hibás rajz (pl. rossz irányú
   ellenállás-nyíl, hibás rétegrend, a cölöp nem ér a teherbíró rétegbe, víz-/zagyszint rossz helyen), csúnya vagy „gyerekes” ábra.
4. **Javítás és szépítés:** minden hibát javíts MINDENHOL, ahol előfordul (a saját fájljaidban; a máshol lévőt jelezd). Szépíts bátran, ami
   gyenge: igényesebb SVG-ábrák (árnyalás, anyagminták, egységes vonalvastagság, vezetővonalas feliratok), simább animációk, jobb elrendezés,
   beszédesebb labor-kijelzők – de a tartalom és a működés maradjon, új hibát ne vigyél be. 3D (three.js) jelenetnél: semleges
   tónusleképezés, lágy árnyék, valódinak látszó anyagok; telefonon a 3D-vászon `touch-action: pan-y`. Az animáció csak változáskor írjon a DOM-ba.
   A dobozcímek középen vannak (zz_boxtitles.css + bxt-js) – ezt ne rontsd el; a doboz szövege sorkizárt.
5. **Angol változat:** a magyar szöveg minden változása után a build hiányt jelez (`i18n/missing.tsv`: azonosító ⇥ magyar szöveg). Az új párokat a
   SAJÁT fájlodba írd: `_src/i18n/<megbízás szerinti>.tsv` (formátum: `azonosító⇥angol szöveg`, mint a többi en_*.tsv; a HTML-címkéket,
   &nbsp;-okat a magyar mintájára tartsd meg). A megszűnt szövegek régi párjait töröld a régi en_NN.tsv-ből (a build kiírja: „fel nem használt”
   – 0 kell legyen; a listát a apply.mjs kimenete / STRICT hibaüzenete adja). Módosított mondatnál a régi angol párból indulj ki.
   Szóhasználat: brit angol, EC7-szakszavak; a projekt szótára: deep foundation, pile foundation, displacement / replacement pile, end-bearing /
   friction / mixed pile, base (tip) resistance, shaft resistance, bearing stratum, pile cap, grillage, piled raft, precast / driven / vibrated /
   jacked / screwed, refusal, ground screw, Franki pile (bulb), screw pile, CFA (continuous flight auger), soil plug, necking, cased pile,
   bentonite-supported pile, tremie pipe, micropile (hollow bar), jet grouting (soilcrete, jet panel), deep mixing, vibro stone column, rigid
   inclusions, diaphragm wall, panel (primary/secondary), bite, guide wall, stop end, hydrofraise, filter cake, silo effect, trench stability,
   well foundation, box foundation, caisson, cutting edge, shoulder offset, airlock, caisson disease, subsidence crater.
   Az angol oldalon tizedespont van (a build cseréli), tg → tan. Az angol fejezeteidet is nézd végig képen (legalább 1440 px-en és a módosított
   részeket 390 px-en): nem maradhat magyar szó (csak tulajdonnév), kilógó hosszabb angol felirat, törött elrendezés.
6. **Ellenőrzés a végén (mindkét nyelven, a saját fejezeteiden):** `python3 _src/qa/audit.py "http://localhost:<port>/index.html?all" hu` és
   `…/en.html?all en` – a saját fejezeteidre eső találatok: 0 vízszintes túlcsordulás, 0 lyuk, 0 tiltott sorvég, 0 nem középre zárt dobozcím,
   0 konzolhiba. Újra fényképezd a módosított részeket, és nézd meg. A build: hiányzó 0 · hiba 0 · fel nem használt 0.
7. **Commit** a saját munkafád ágán (kis lépésekben is lehet; üzenet magyarul; a végén a sorok:
   `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` és `Claude-Session: https://claude.ai/code/session_01F8M6kFBr2gG3iB4B38tRVP`).
   A buildelt index.html / en.html-t is commitold. NE pusholj és ne merge-elj – azt a koordinátor végzi.

## Záró jelentés (magyarul, tömören, de teljesen)
(a) javított hibák: előtte → utána, fájl; (b) szépítések; (c) ellenőrzés eredménye (audit számok, build); (d) közös fájlba kért javítások
pontosan; (e) a szerzőnek szóló nyitott kérdések (nem ellenőrizhető adat, szakmai döntés); (f) a webről ellenőrzött tények forrása (URL);
(g) 3–6 legjobb előtte–utána vagy „utána” kép teljes elérési útja; (h) általánosítható tanulság, ami a skillekbe való (új hibatípus, bevált
megoldás, új eszköz).
