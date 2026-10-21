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
