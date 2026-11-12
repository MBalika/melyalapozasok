# Mélyalapozások – interaktív tananyag

Élő oldal: https://melyalapozasok.vercel.app (a `main` ág minden push után automatikusan élesedik a Vercelen).

BME Építőmérnöki Kar, Alapozás, 8. előadás: cölöpalapok (előregyártott, Franki, csavart, CFA, béléscsöves, bentonitzagyos, mikrocölöp, jet-grouting), résfalak, kút-, szekrény- és keszonalapozás – laborokkal, kalkulátorokkal, 3D cölöpépítővel, kvízekkel, öt magyarázó animációval és a BME Építőmérnöki Kar YouTube-videóinak kártyáival.

## Felépítés
- `index.html` – a kész, egyfájlos oldal (a buildből; CSS + JS beágyazva, three.js-szel együtt)
- `video/v1–v5.html` – a magyarázó animációk (önálló lejátszók, a hang beágyazva)
- `img/yt/<id>/` – a BME YouTube-videók kártyáinak képei (`t.jpg` indexkép, `p1–p4.jpg` képkockák, `qr.png`); a metaadatok a `_src/src/js/yt_meta.json`-ban és a `data.js`-ben
- `img/ppt/` – képek az előadásanyagból, `img/thumb/` – videó-bélyegképek
- `vendor/hyphenopoly/` – magyar elválasztás (Hyphenopoly 6, MIT); a sorkizárást és a nem törő egységeket a `core.js` `GUARD` modulja kezeli
- `fonts/` – saját tárhelyről kiszolgált betűk (@fontsource, OFL)
- `_src/` – forrás (a Vercel nem teszi ki)
  - `src/index.src.html` – keret (fejléc, cölöpsor-navigáció, hős-3D, lábléc, lejátszók)
  - `src/chapters/NN_*.html` – a 12 fejezet (= 12 cölöp a kiosztási terven), névsorrendben fűzi össze a build
  - `src/js/` – `core.js` (widget-segédek, formázás-őr), `ui.js` (navigáció, videók, YouTube-kártyák, kvíz, igaz/hamis), `hero.js`, `ch_*.js` (fejezetek widgetjei és kvízei), `sim3d.js` (3D cölöpépítő), `tf.js` (igaz/hamis, fogalomtár), `data.js`
  - `src/style.css`, `src/css/*.css`, `src/fonts.css`

## Újraépítés
```bash
cd _src
npm install
python3 build.py          # → ../index.html
# részleges fejlesztői build:  BUILD_ID=x MODULES=ch_furt CHAPTERS=05 python3 build.py  → ../dev-x.html
```


## Videók zenéje

A videók zenéje (2026-11) valódi hangszerek felvett mintáiból készült – zongora, vonósok, akusztikus és elektromos gitár, basszusgitár, fúvósok, akusztikus dob –, ütemre igazítva a képhez; a gép- és effekthangok a korábbi hangkönyvtárból vannak. Hangminták: Salamander Grand Piano (Alexander Holm, CC BY 3.0); tonejs-instruments (nbrosowsky; VSCO2, Karoryfer, Iowa, Freesound – CC BY 3.0); Tone.js dobminták.

## Angol változat (/en)

Élő: https://melyalapozasok.vercel.app/en („Deep foundations”). Ugyanabból a magyar forrásból épül: a `python3 build.py` az `index.html` mellett az `en.html`-t is elkészíti (előtte egyszer: `cd i18n && npm install`). A fordítás: `_src/i18n/en_*.tsv` (magyar szöveg azonosítója ⇥ angol), a BME-videók adatai: `_src/i18n/en_yt.tsv`. Ha a magyar szöveg változik, az angol build leáll, a hiányzók: `_src/i18n/missing.tsv`; munkalap: `python3 build.py catalog`. Az angol magyarázó videók: `video/en/v1–v5.html`, indexképeik: `img/thumb/en/`. A magyar forrás angolhoz szükséges kapcsait (EN jelző, nyelvváltó, angol tördelési szabályok) a `_src/i18n/prep_hu.py` teszi bele (idempotens).
