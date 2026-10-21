// Mélyalapozások – közös adatok: fejezetek (cölöpök), saját animációs videók, BME YouTube-videók
import YTMETA from './yt_meta.json';

// Fejezetek = cölöpök a kiosztási terven. grp: színcsoport (style.css --g0…--g6)
export const CHAPTERS = [
  { id: 'alapok', pile: 'C01', t: 'Mi a mélyalapozás?', nav: 'Alapok', grp: 0 },
  { id: 'rendszer', pile: 'C02', t: 'Cölöpök rendszere', nav: 'Rendszer', grp: 0 },
  { id: 'elore', pile: 'C03', t: 'Előregyártott cölöpök', nav: 'Előregyártott', grp: 1 },
  { id: 'helyszini', pile: 'C04', t: 'Franki és csavart', nav: 'Franki, csavart', grp: 1 },
  { id: 'furt', pile: 'C05', t: 'Fúrt cölöpök', nav: 'Fúrt', grp: 2 },
  { id: 'egyeb', pile: 'C06', t: 'Mikrocölöp, jet, keverés', nav: 'Egyéb', grp: 3 },
  { id: 'resfal', pile: 'C07', t: 'Résfalak', nav: 'Résfal', grp: 4 },
  { id: 'kut', pile: 'C08', t: 'Kút, szekrény, keszon', nav: 'Kút, keszon', grp: 5 },
  { id: 'szimulator', pile: 'C09', t: '3D cölöpépítő', nav: '3D', grp: 6 },
  { id: 'dontes', pile: 'C10', t: 'Melyiket válasszam?', nav: 'Döntés', grp: 6 },
  { id: 'videotar', pile: 'C11', t: 'Videótár', nav: 'Videótár', grp: 6 },
  { id: 'teszt', pile: 'C12', t: 'Önellenőrzés', nav: 'Teszt', grp: 6 },
];

// Saját magyarázó animációk (video/vN.html + vN.mp3)
export const VIDEOS = [
  { n: 'v1', t: 'A mélyalapozás alapjai', d: '2:31', g: 'nu-disco', grp: 0, s: 'Mikor kell mélyalap? Csúcs- és köpenymenti ellenállás, álló, lebegő és vegyes cölöp' },
  { n: 'v2', t: 'Kiszorítás és furatállékonyság', d: '2:45', g: 'drum & bass', grp: 2, s: 'Mi történik a talajjal? Béléscső, zagy, talajdugó – és ami rosszul sülhet el' },
  { n: 'v3', t: 'Résállékonyság', d: '2:48', g: 'synthwave', grp: 4, s: 'Bentonitzagy, zagyszint a talajvíz felett, silóhatás, réstábla-hossz' },
  { n: 'v4', t: 'Kút, szekrény, keszon', d: '2:45', g: 'melodic house', grp: 5, s: 'Süllyesztés önsúllyal, vágóél, rekeszfalak, túlnyomás és zsilipek' },
  { n: 'v5', t: 'Összefoglaló és kvíz', d: '2:28', g: 'UK garage', grp: 6, s: 'Térkép a mélyalapokról és hat kvízkérdés – teszteld magad!' },
];

// BME Építőmérnöki Kar – YouTube (valós felvételek). A képek: img/yt/<id>/t.jpg, p1–p4.jpg, qr.png
// kick: a kártya felső sora („… A VALÓSÁGBAN”); tech: rövid név a listákhoz
const KICK = {
  c3vKfjgqJdA: ['A cölöpözési technológiák áttekintése', 'Cölöpalapozások'],
  wqOU4bcUiCk: ['A CFA-cölöp a valóságban', 'CFA-cölöp'],
  Oe5saZFiPJk: ['A nagyátmérőjű fúrt cölöp a valóságban', 'Nagyátmérőjű fúrt cölöp'],
  hwP8iZzAq6I: ['A csavart cölöp a valóságban', 'Csavart cölöp'],
  KDKCobw52qk: ['A vert és vibrált cölöp a valóságban', 'Vert, vibrált cölöp'],
  D27v2bVmoXc: ['A talajcsavar a valóságban', 'Acél csavart cölöp'],
  _QsH5x0ndtI: ['A Franki-cölöp a valóságban', 'Franki-cölöp'],
  '7M7YPxBn8Xk': ['A mikrocölöp a valóságban', 'Mikrocölöp'],
  '8Zcv7ktWD68': ['A talajjavítások áttekintése', 'Talajjavítások'],
  CgKwZBWn_xM: ['Az injektálás a valóságban', 'Injektálás'],
  'MPjXIhchN-w': ['A jet-grouting a valóságban', 'Jet-grouting'],
  wh31VB1fY_8: ['A mélykeverés a valóságban', 'Mélykeverés'],
  Gca4PGhTC5o: ['A vibroflotáció a valóságban', 'Vibroflotáció'],
  cNkNZV6kgqk: ['A vibrált kőoszlop a valóságban', 'Vibrált kőoszlop'],
  LtSalNj4ByQ: ['A döngölés a valóságban', 'Döngölés'],
  wRRuJb3yTLw: ['A befogott támszerkezetek áttekintése', 'Befogott támszerkezetek'],
  '6v1tscw5Y7M': ['A hézagos falak a valóságban', 'Hézagos erősítésű falak'],
  '4IzRHH2GgEM': ['A szádfalazás a valóságban', 'Szádfal'],
  QcPETASq0zI: ['A cölöpfal a valóságban', 'Cölöpfal'],
  'f_41-sJhGK8': ['A résfal a valóságban', 'Résfal'],
  er4WW_v5qgk: ['Kimélyülés a hídpillér körül', 'Kimosás a pillér körül'],
};
export const YT = Object.fromEntries(Object.entries(YTMETA).map(([id, m]) => [id, { id, ...m, kick: KICK[id]?.[0] || m.title, tech: KICK[id]?.[1] || m.title }]));

// A videótár BME-szekciói
export const YT_GROUPS = [
  { t: 'Cölöpalapozások', grp: 1, ids: ['c3vKfjgqJdA', 'KDKCobw52qk', 'D27v2bVmoXc', '_QsH5x0ndtI', 'hwP8iZzAq6I', 'wqOU4bcUiCk', 'Oe5saZFiPJk', '7M7YPxBn8Xk'] },
  { t: 'Egyéb cölöpök (a Talajjavítások listából)', grp: 3, ids: ['MPjXIhchN-w', 'wh31VB1fY_8', 'cNkNZV6kgqk'] },
  { t: 'Résfal (a Befogott támszerkezetek listából)', grp: 4, ids: ['f_41-sJhGK8'] },
  { t: 'Miért kell mélyre menni? – kimosás a hídpillér körül', grp: 0, ids: ['er4WW_v5qgk'] },
];
