# Angol oldalakon: a BME-videók eredeti angol változatai (Geotech Project) – 2026-11-20

A felhasználó kérése (2026-11-20): a https://www.youtube.com/@GeotechProject csatornán megvan angolul az összes mélyalapozási, munkatér-határolási és talajjavítási videó, amit korábban a BME Építőmérnöki Kar csatornájáról tettünk fel – **az angol oldalakon és az angol videókban mindenhol ezeket kell használni**. A magyar oldalakon a magyar (BME) videók maradnak.

## Megfeleltetés (magyar BME-azonosító → angol Geotech Project-azonosító)
| Magyar (BME) | Angol (Geotech Project) | Angol cím | Hossz | Lejátszási lista |
|---|---|---|---|---|
| Oe5saZFiPJk | vL-ohvoRlts | Large diameter bored piles | 5:23 | Pile Foundations |
| hwP8iZzAq6I | Mps1k494kSo | Full displacement piles (FDP) and Screwsol piles | 3:30 | Pile Foundations |
| KDKCobw52qk | cE-NBCAFayg | Precast piles | 4:32 | Pile Foundations |
| D27v2bVmoXc | -Cw33wzTdnE | Helical steel piles | 3:34 | Pile Foundations |
| _QsH5x0ndtI | sc0PpeHJ29c | Franki piles | 3:03 | Pile Foundations |
| 7M7YPxBn8Xk | rSY2i0RR9nk | Micropiles | 4:35 | Pile Foundations |
| wqOU4bcUiCk | Z94hg0Y4SNY | CFA piles | 2:41 | Pile Foundations |
| MPjXIhchN-w | ef6ZE8deD6M | Jet grouting | 4:27 | Ground improvement |
| wh31VB1fY_8 | 85GbWBj3in8 | Soil mixing technologies | 5:52 | Ground improvement |
| cNkNZV6kgqk | 2iWMoVIZc_k | Stone columns | 2:47 | Ground improvement |
| CgKwZBWn_xM | bVTljbQcE6U | Grouting technologies | 5:53 | Ground improvement |
| Gca4PGhTC5o | I1M6afZLrxo | Vibroflotation | 2:23 | Ground improvement |
| LtSalNj4ByQ | VNDEW8acU_0 | Dynamic compaction and replacement | 3:22 | Ground improvement |
| 6v1tscw5Y7M | 8F1wx4lukDQ | Soldier pile, jet-grouting, slurry and DSM walls | 6:33 | Embedded retaining walls |
| 4IzRHH2GgEM | 9ovHy3VMyoY | Sheet pile walls | 3:31 | Embedded retaining walls |
| QcPETASq0zI | H5Ivfpm-Sfo | Pile walls | 4:46 | Embedded retaining walls |
| f_41-sJhGK8 | eOZGv_2Q_Jg | Diaphragm walls | 4:59 | Embedded retaining walls |

Lejátszási listák: Pile Foundations `PL9ek0nuVwC85wlVXUmqQQF8Xd6Xul7P8_` (BME: PLiAsGexXzYoJk3IiDC5YBCNSs0_YQFXXA), Ground improvement `PL9ek0nuVwC85PcjPVCAAGIJso2CkeAUzw` (PLiAsGexXzYoLJnR9HUPPN85cACUQXJhYj), Embedded retaining walls `PL9ek0nuVwC858cRPzrO8NKwJ1_wevMYEm` (PLiAsGexXzYoLoUK4uIoeIHjowjrmQH1Tc).
**Nincs angol változata** (az angol oldalon „in Hungarian” jelzéssel marad): c3vKfjgqJdA (Cölöpalapozások rendszerezése), 8Zcv7ktWD68 (Talajjavítások), wRRuJb3yTLw (Befogott támszerkezetek), er4WW_v5qgk (kimélyülés a hídpillér körül).

## Kártyaképek
Mind a 17 angol videóhoz: `img/yt/<angol id>/t.jpg` (1280×720, a YouTube-indexkép), `p1–p4.jpg` (960×540, a magyar kártyák képkockáival azonos jelenetek, ahol az angol vágás eltér, a legközelebbi azonos jelenet), `qr.png` (youtu.be/<id>). Adatok: `yt_en.json` (cím, hossz, lista, angol képaláírások, időpontok). Csomag: `D:\…\Claude videók\_forras\youtube_angol_kartyak.zip`. A képkockák Chrome-ból készültek (a lejátszó teljes ablakra feszítve, `seekTo` + képkivágás), a tárolóból a YouTube nem érhető el.

## Hol cserélődött
- **melyalapozasok.vercel.app/en** (17 → 13 használt): az angol build (`_src/build.py`) az `i18n/yt_en.json` alapján cseréli az azonosítókat, listákat, címeket, képaláírásokat; a kártyán „Geotech Project · YouTube”. main `59d4135`.
- **munkaterhatarolasok.vercel.app/en** (6 + 1 csak magyarul): ugyanígy a buildben (`_src/build.py`, `src/js/ui.js` `ytCh`). main `e307c22`.
- **vedekezesakarossullyedesekellen.vercel.app/en** (6 + 2 csak magyarul): az angol `yt.js`-be injektált `YT_EN` táblával. main `26aaa9b`.
- **Angol magyarázó videók (mélyalapozás):** 2 (vL-ohvoRlts), 3 (eOZGv_2Q_Jg) YouTube-zárása angol képekkel, QR-ral, címmel (`mzv/tools/yt_swap.py`, `build_en.py` YTSWAP); 1 „in Hungarian”. **CFA angol videó** (`Melyalapozas\1_CFA_pile_EN_video.html`): zárás Z94hg0Y4SNY-re.
- Nem kellett: TSZK (nincs angol oldala), talajfelderítés, síkalapok-oldalak, nyitóoldal (nincs BME-videó; a hatások oldalán csak er4WW_v5qgk).
